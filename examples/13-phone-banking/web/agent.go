package main

// The agent side, unchanged in substance from the parent example: the same
// three-tool handset, the same job strings, the same `learn` courier and the
// same replay-at-mount. What differs is plumbing — errors are returned to
// the web server instead of ending the process, because a demo page should
// say what went wrong rather than disappear.

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

func job() string {
	return "Find out the current balance on your Meridian Trust Bank credit card, by phone, " +
		"and report the exact figures.\n\n" +
		"The bank's automated line is " + bankNumber + " and your six-digit phone banking " +
		"access code is " + accessCode + ". You reach the world only through the `dial`, " +
		"`press` and `hangup` tools — the line reads every prompt back as text, exactly as a " +
		"caller hears it — and you are paying airtime for every menu you sit through.\n\n" +
		"If you already hold a skill for this phone system, load it first and key the sequence " +
		"it records rather than rediscovering the menus — but hear the balance on THIS call " +
		"rather than repeating a figure from memory, because the balance changes between " +
		"calls. Finish by stating the current balance and the available credit."
}

const alsoRecord = "\n\nHearing the balance is only half of this job. You are NOT finished " +
	"until both of these are done as well:\n\n" +
	"1. Work out the FASTEST route to the balance — fewest keys, least listening. This line " +
	"lets a caller key ahead: keys sent in one `press` are taken in order and the menus keyed " +
	"past are never read out, so a caller who knows the tree hears almost nothing.\n" +
	"2. Call `learn` and write down what a session that has never dialed this bank would need " +
	"in order to hear the balance without exploring: the number, what each menu offers and " +
	"which key matters at each depth, where the access code is demanded and how it is " +
	"entered, and the exact key sequence end to end. Record the ROUTE and never the balance " +
	"itself — the balance is different on every call, and a figure written down is a wrong " +
	"answer waiting to be read out.\n\n" +
	"Stop only once `learn` has accepted a lesson."

// ---- the handset -------------------------------------------------------------

type handset struct {
	line *ivr
}

func newHandset(line *ivr) *handset { return &handset{line: line} }

func (h *handset) plugin() sdk.Plugin {
	return sdk.Plugin{
		ID:     "handset",
		Inject: []string{"tools"},
		Apply: func(ctx *sdk.Context) error {
			if err := ctx.RegisterTool(sdk.Tool{
				Name: "dial",
				Description: "Place a call. The line answers and reads its first menu back as " +
					"text — this is the only way to reach anything; there is no other phone " +
					"and no network. Dialing during a call hangs up and starts over.",
				Parameters: map[string]any{
					"number": map[string]any{
						"type": "string", "required": true,
						"description": `The number to call, e.g. "1-800-634-7100".`,
					},
				},
				Execute: h.dial,
			}); err != nil {
				return err
			}
			if err := ctx.RegisterTool(sdk.Tool{
				Name: "press",
				Description: "Press keys on the keypad, in order: digits, star and pound — " +
					`"2", "731942#", or a whole route like "23". You can key ahead: menus ` +
					"keyed past are skipped unheard, exactly as for a caller who knows the " +
					"tree, and what comes back is the prompt where you land. Pressing 0 " +
					"replays the menu you are in; star returns to the previous one.",
				Parameters: map[string]any{
					"keys": map[string]any{
						"type": "string", "required": true,
						"description": "The keys, in the order to press them.",
					},
				},
				Execute: h.press,
			}); err != nil {
				return err
			}
			return ctx.RegisterTool(sdk.Tool{
				Name: "hangup",
				Description: "Hang up the call. Dialing again starts a fresh call at the main " +
					"menu, unauthenticated.",
				Execute: h.hangup,
			})
		},
	}
}

func (h *handset) dial(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		Number string `json:"number"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	return h.line.dial(in.Number)
}

func (h *handset) press(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		Keys string `json:"keys"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	return h.line.press(in.Keys)
}

func (h *handset) hangup(_ context.Context, _ json.RawMessage) (string, error) {
	return h.line.hangupCall(), nil
}

// ---- running a turn ----------------------------------------------------------

type call struct {
	name string
	args string
}

type answer struct {
	text   string
	reason string
	calls  []call
	took   time.Duration
}

func openHarness(ctx context.Context, model, workspace string, line *ivr, m *memory, canTeach bool) (*sdk.Harness, error) {
	cfg := sdk.Config{
		Model: model,
		CWD:   workspace,
		Roots: []string{workspace},
		Env:   map[string]string{"HOME": workspace},

		Plugins: []sdk.Plugin{
			newHandset(line).plugin(),
			m.plugin(model, canTeach),
		},
	}

	// The skills catalog fix examples 11 and 12 explain: the filesystem skill
	// provider cannot complete discovery in this runtime, one incomplete
	// provider suppresses the whole catalog, and every skill here is
	// host-registered anyway — so it is pointed at no roots.
	entries := sdk.Compose(cfg)
	for i := range entries {
		if entries[i].ID == "agent-spine" {
			entries[i].Config["skills"] = map[string]any{
				"filesystem": map[string]any{"includeDefaultRoots": false},
			}
		}
	}
	cfg.Composition = entries

	return sdk.Open(ctx, cfg)
}

// ask runs one turn and survives the known runtime flake once, the way the
// parent example does — note() tells the page it happened.
func ask(ctx context.Context, s *sdk.Session, prompt string, note func(string)) (answer, error) {
	var mu sync.Mutex
	var called []call

	started := time.Now()
	record := sdk.OnEvent(func(e sdk.Event) {
		if e.Type != "tool/call" {
			return
		}
		var made struct {
			Name      string `json:"name"`
			Arguments string `json:"arguments"`
		}
		if e.Decode(&made) == nil && made.Name != "" {
			mu.Lock()
			called = append(called, call{name: made.Name, args: made.Arguments})
			mu.Unlock()
		}
	})
	result, err := s.Run(ctx, sdk.Text(prompt), record)
	if err != nil && strings.Contains(err.Error(), "the runtime answered") {
		note("a turn died in the runtime; resuming the session")
		result, err = s.Run(ctx, sdk.Text(
			"That last turn was cut off by an infrastructure error, not by anything you did. "+
				"The job is unchanged; check where things stand and finish it."), record)
	}
	if err != nil {
		return answer{}, err
	}
	if result.FinishReason == "error" {
		return answer{}, sdk.TurnError(result.Events)
	}
	mu.Lock()
	defer mu.Unlock()
	return answer{
		text:   strings.TrimSpace(result.FinalResponse),
		reason: result.FinishReason,
		calls:  append([]call(nil), called...),
		took:   time.Since(started),
	}, nil
}

func norm(s string) string {
	return strings.NewReplacer(",", "", "$", "", " ", "").Replace(s)
}

func oneLine(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > 400 {
		return s[:399] + "…"
	}
	return s
}

func pick(role string) string {
	if id := os.Getenv(role); id != "" {
		return id
	}
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}

// ---- the courier, as in the parent ------------------------------------------

type lessonRecord struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	TaughtBy    string `json:"taughtBy"`
	TaughtAt    string `json:"taughtAt"`
}

type memory struct {
	path string

	mu      sync.Mutex
	replays int
}

func newMemory(path string) *memory { return &memory{path: path} }

func (m *memory) plugin(model string, canTeach bool) sdk.Plugin {
	return sdk.Plugin{
		ID:     "courier",
		Inject: []string{"tools", "skills"},
		Apply: func(ctx *sdk.Context) error {
			skills, err := ctx.Service("skills")
			if err != nil {
				return err
			}

			known, err := load(m.path)
			if err != nil {
				return err
			}
			for _, entry := range known {
				if err := register(skills, entry); err != nil {
					return err
				}
				m.mu.Lock()
				m.replays++
				m.mu.Unlock()
			}

			if !canTeach {
				return nil
			}

			return ctx.RegisterTool(sdk.Tool{
				Name: "learn",
				Description: "Write down a route you have just worked out, so that a session " +
					"that has never dialed this system can follow it without exploring. Use " +
					"it once, at the end, for the whole job rather than for one step of it.",
				Parameters: map[string]any{
					"name": map[string]any{
						"type": "string", "required": true,
						"description": `Kebab-case identifier, e.g. "meridian-credit-balance".`,
					},
					"description": map[string]any{
						"type": "string", "required": true,
						"description": "One line saying WHEN to reach for this. It is all a " +
							"later session sees before deciding to load it, so describe the occasion.",
					},
					"procedure": map[string]any{
						"type": "string", "required": true,
						"description": "The route itself, in Markdown: the number to dial, what " +
							"each menu offers and which key matters, where the access code is " +
							"demanded and how it is entered, and the fastest key sequence end " +
							"to end. Complete enough to act on without listening to a single " +
							"menu you do not have to.",
					},
				},
				Execute: m.learn(skills, model),
			})
		},
	}
}

func (m *memory) learn(skills *sdk.Object, model string) func(context.Context, json.RawMessage) (string, error) {
	return func(_ context.Context, args json.RawMessage) (string, error) {
		var in struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Procedure   string `json:"procedure"`
		}
		if err := json.Unmarshal(args, &in); err != nil {
			return "", err
		}

		entry := lessonRecord{
			Name:        strings.TrimSpace(in.Name),
			Description: strings.TrimSpace(in.Description),
			Content:     strings.TrimSpace(in.Procedure),
			TaughtBy:    model,
			TaughtAt:    time.Now().UTC().Format(time.RFC3339),
		}

		if reason := admissible(entry); reason != "" {
			return "", fmt.Errorf("not recorded: %s", reason)
		}

		known, err := load(m.path)
		if err != nil {
			return "", err
		}
		for _, already := range known {
			if already.Name == entry.Name {
				return "", fmt.Errorf("a lesson called %q is already recorded; load it with the "+
					"`skill` tool to see what it says, then either use it or record what is new "+
					"under another name", entry.Name)
			}
		}

		if err := register(skills, entry); err != nil {
			return "", err
		}
		if err := appendTo(m.path, entry); err != nil {
			return "", err
		}
		return fmt.Sprintf("Recorded %q. It is loadable now with the `skill` tool, and every later "+
			"session — including other models' — starts with it.", entry.Name), nil
	}
}

func admissible(entry lessonRecord) string {
	switch {
	case entry.Name == "":
		return "a lesson needs a name"
	case !kebab(entry.Name):
		return fmt.Sprintf("%q is not a kebab-case name like \"meridian-credit-balance\"", entry.Name)
	case len(entry.Description) < 16:
		return "the description is all a later session reads before deciding to load this, " +
			"so it has to say when this is the right thing to reach for"
	case len(entry.Content) < 200:
		return "the route is too short to follow without exploring; it needs the number, the " +
			"keys at each menu, where the access code is demanded, and the sequence end to end"
	}
	return ""
}

func kebab(name string) bool {
	for i, r := range name {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
		case r == '-' && i > 0 && i < len(name)-1:
		default:
			return false
		}
	}
	return name != ""
}

func register(skills *sdk.Object, entry lessonRecord) error {
	_, err := skills.Call("register", map[string]any{
		"name":        entry.Name,
		"description": entry.Description,
		"content":     entry.Content,
		"source":      "runtime",
		"invocation":  map[string]any{"modelInvocable": true, "userInvocable": true},
	})
	return err
}

func load(path string) ([]lessonRecord, error) {
	file, err := os.Open(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var out []lessonRecord
	lines := bufio.NewScanner(file)
	lines.Buffer(make([]byte, 0, 1<<20), 1<<24)
	for lines.Scan() {
		if strings.TrimSpace(lines.Text()) == "" {
			continue
		}
		var entry lessonRecord
		if err := json.Unmarshal(lines.Bytes(), &entry); err != nil {
			return nil, err
		}
		out = append(out, entry)
	}
	return out, lines.Err()
}

func appendTo(path string, entry lessonRecord) error {
	line, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return err
	}
	if _, err := file.Write(append(line, '\n')); err != nil {
		file.Close()
		return err
	}
	return file.Close()
}
