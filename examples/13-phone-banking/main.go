// Command phone-banking listens its way down a bank's telephone tree twice:
// once by exploring it, and once from what it learned the first time.
//
// Example 12 taught the agent a web application. This one hands it the oldest
// self-describing interface in production anywhere: an IVR — the telephone
// menu that reads its options aloud. "For account services, press 1. For card
// services, press 2." Everything the agent needs to know is spoken to it, and
// every word costs airtime, which is exactly the trade this example measures.
//
// THE WORK. A Meridian Trust Bank phone line is served by this program, with
// a menu tree three deep and a credit card balance at the bottom of one path,
// behind an access code. The agent is asked for the balance. Nothing about
// the tree is in the prompt beyond the number and the code.
//
//	run 1   explore     dial, listen, press, take the wrong department,
//	                    get redirected, find the balance — then record the
//	                    route with `learn`
//	RESET   the call log is wiped and THE BALANCE CHANGES, the way a
//	        balance does; the menus hold still
//	run 2   replay      a new process, a new session, the same question, and
//	                    the lesson replayed into ctx.skills before the first
//	                    token
//
// WHAT IS MEASURED. The line logs every prompt it plays and every key it
// takes, and prices each prompt at spoken pace — so the two runs are compared
// on what a phone call actually costs: menus sat through, keys pressed, wrong
// turns, airtime. The line supports keying ahead, as real IVRs do: keys sent
// in one press are taken in order and the menus keyed past are never played.
// The exploring run pays to hear the tree. The replaying run keys through it.
//
// HOW IT IS VERIFIED, which is the half that makes this more than a demo.
// The balance is different on each run, so run 2 can only answer correctly by
// dialing and hearing it fresh — a lesson that recorded the figure instead of
// the route would read out a stale number and fail the assertion. The trail
// is read off the IVR's own log, never off the agent's summary: a run that
// claims to have heard the balance without the credit-balance leaf in its
// trail is caught, because the leaf is a Go struct in this process.
//
// THE SEAM. The agent has no network and no telephone until this program
// provides one: `dial`, `press` and `hangup` are three Go functions holding
// the line, and the handset reaches exactly one number in the world. What it
// may call is a Go decision rather than a hope.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=$OPENROUTER_API_KEY
//	export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1
//	export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731
//	go run ./examples/13-phone-banking
//
// Set DSH_EXPLORER_MODEL and DSH_OPERATOR_MODEL to two different ids on your
// gateway to have one model do the listening and another do the calling —
// the deployment shape, because only one of the two has to be clever.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// job is the question, and it is the SAME STRING for both runs. The only
// difference between them is the paragraph the exploring run gets afterwards,
// and what the replaying run already knows when it starts.
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

// alsoRecord is the only difference between the two prompts, written as the
// second half of the job rather than an afterthought — example 12 learned the
// hard way that a model told "finish when X" finishes when X.
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

// direct is the one path through the tree that leads to the answer, for the
// wrong-turn count: any prompt played from outside this set was a detour the
// caller paid airtime for.
var direct = map[string]bool{
	"main-menu": true, "card-services": true, "card-balances": true,
	"access-code": true, "credit-balance": true,
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	explorer := pick("DSH_EXPLORER_MODEL")
	operator := pick("DSH_OPERATOR_MODEL")

	line := newIVR()

	root, err := os.MkdirTemp("", "dsh-ivr-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(root)
	workspace := filepath.Join(root, "workspace")
	if err := os.MkdirAll(workspace, 0o755); err != nil {
		log.Fatal(err)
	}
	// Outside the workspace on purpose: the agent has no tool that reaches it.
	remembered := filepath.Join(root, "learned.jsonl")

	fmt.Printf("Meridian Trust Bank answers at %s\n", bankNumber)
	fmt.Printf("explorer: %s\noperator: %s\n", explorer, operator)
	if explorer == operator {
		fmt.Println("(one model on both sides — set DSH_EXPLORER_MODEL and DSH_OPERATOR_MODEL to")
		fmt.Println(" different ids to have the clever one teach the cheap one.)")
	}
	fmt.Printf("the balance today: $%s\n", books[0].balance)

	// EVERY RUN STARTS FROM SCRATCH, and that is asserted rather than assumed —
	// an example whose first pass quietly began already knowing would prove
	// nothing at all.
	before, err := load(remembered)
	if err != nil {
		log.Fatal(err)
	}
	if len(before) != 0 {
		log.Fatalf("FAIL: this run began already knowing %d thing(s)", len(before))
	}
	fmt.Println("memory: empty — nothing has been learned yet")

	// ---- run 1: listen the way down ------------------------------------------

	fmt.Println("\n═══ run 1 · exploring ═══")
	teacher := newMemory(remembered)
	first := openHarness(ctx, explorer, workspace, line, teacher, true)
	cold := ask(ctx, first.Session("explore"), job()+alsoRecord)
	first.Close()

	fmt.Printf("\n%s\n", oneLine(cold.text))
	coldLegs := line.legs()
	coldTally := measure(coldLegs)
	report("run 1", cold, coldLegs, coldTally)

	fmt.Println("\n--- what the host agreed to keep ---")
	for _, verdictLine := range teacher.log() {
		fmt.Println(" ", verdictLine)
	}
	learned, err := load(remembered)
	if err != nil {
		log.Fatalf("FAIL: cannot read the host memory: %v", err)
	}
	if len(learned) == 0 {
		fmt.Println("  (nothing — the agent never called `learn`)")
	}
	for _, entry := range learned {
		fmt.Printf("\n  %s — %s\n%s\n", entry.Name, entry.Description, indent(entry.Content))
	}

	lessonName := ""
	routeNotFigure := true
	for _, entry := range learned {
		if lessonName == "" {
			lessonName = entry.Name
		}
		if strings.Contains(norm(entry.Content), norm(books[0].balance)) {
			routeNotFigure = false
		}
	}

	// ---- the reset -----------------------------------------------------------

	line.reset()
	fmt.Printf("\n═══ reset · the balance is now $%s; the menus have not moved ═══\n",
		books[1].balance)

	// ---- run 2: key straight through -----------------------------------------

	fmt.Println("\n═══ run 2 · replaying ═══")
	student := newMemory(remembered)
	second := openHarness(ctx, operator, workspace, line, student, false)
	warm := ask(ctx, second.Session("replay"), job())
	second.Close()

	fmt.Printf("\n%s\n", oneLine(warm.text))
	warmLegs := line.legs()
	warmTally := measure(warmLegs)
	report("run 2", warm, warmLegs, warmTally)

	// ---- the comparison ------------------------------------------------------

	coldRight := strings.Contains(norm(cold.text), norm(books[0].balance))
	warmRight := strings.Contains(norm(warm.text), norm(books[1].balance)) &&
		!strings.Contains(norm(warm.text), norm(books[0].balance))

	fmt.Println("\n--- the same question, twice ---")
	fmt.Printf("  %-26s %10s %10s\n", "", "run 1", "run 2")
	fmt.Printf("  %-26s %10d %10d\n", "prompts listened to", coldTally.prompts, warmTally.prompts)
	fmt.Printf("  %-26s %10d %10d\n", "keys pressed", coldTally.keys, warmTally.keys)
	fmt.Printf("  %-26s %10d %10d\n", "wrong turns", coldTally.wrong, warmTally.wrong)
	fmt.Printf("  %-26s %10s %10s\n", "airtime (simulated)", mmss(coldTally.seconds), mmss(warmTally.seconds))
	fmt.Printf("  %-26s %10d %10d\n", "tool calls", len(cold.calls), len(warm.calls))
	fmt.Printf("  %-26s %10s %10s\n", "wall clock",
		cold.took.Round(time.Second), warm.took.Round(time.Second))
	fmt.Printf("  %-26s %10s %10s\n", "the balance on the line", "$"+books[0].balance, "$"+books[1].balance)
	fmt.Printf("  %-26s %10s %10s\n", "reported correctly", yes(coldRight), yes(warmRight))

	fmt.Println("\n--- the assertions ---")
	failed := false
	for _, check := range []struct {
		what string
		ok   bool
		why  string
	}{
		{"run 1 heard the balance", heardIn(coldLegs, "credit-balance"),
			"the credit-balance leaf is in the line's own log of what it played"},
		{"run 1 reported it", coldRight,
			"the answer states the figure the line read out, $" + books[0].balance},
		{"a lesson was kept", lessonName != "",
			"the exploring run wrote down the route it had just paid to hear"},
		{"the route, not the figure", routeNotFigure,
			"the lesson holds keys and menus, not a balance that is stale by the next call"},
		{"run 1 had nothing", !cold.loaded(lessonName),
			"the first pass could not have loaded what it had not written yet"},
		{"replayed at mount", student.replayed() > 0,
			"Apply handed the lesson to ctx.skills before run 2's first token"},
		{"the skill was loaded", warm.loaded(lessonName),
			"run 2 called the harness's own `skill` tool for " + quoted(lessonName) + " by name"},
		{"run 2 heard it fresh", heardIn(warmLegs, "credit-balance"),
			"the leaf was played again this run — the figure was dialed for, not remembered"},
		{"run 2 reported today's", warmRight,
			"the new figure, which did not exist when the lesson was written"},
		{"and listened to less", warmTally.prompts < coldTally.prompts &&
			warmTally.seconds < coldTally.seconds,
			"fewer menus sat through and less airtime for the same answer — the whole point"},
	} {
		status := "PASS"
		if !check.ok {
			status, failed = "FAIL", true
		}
		fmt.Printf("  %s  %-24s %s\n", status, check.what, check.why)
	}

	if failed {
		os.Exit(1)
	}
	fmt.Println("\nThe menus never moved. What changed is that the second caller had been here")
	fmt.Println("before — in a file it cannot read, replayed into it before it picked up the")
	fmt.Println("handset.")
}

// ---- measuring the calls ----------------------------------------------------

// tally is one run's travel, counted off the line's own log.
type tally struct {
	prompts int // menus and leaves actually played
	keys    int // keys pressed
	wrong   int // prompts played from off the direct path — detours, paid in airtime
	seconds int // simulated airtime
}

func measure(legs []leg) tally {
	var t tally
	for _, l := range legs {
		t.keys += l.keys
		t.seconds += l.secs
		if l.heard == "" {
			continue
		}
		t.prompts++
		if !direct[l.heard] {
			t.wrong++
		}
	}
	return t
}

func heardIn(legs []leg, id string) bool {
	for _, l := range legs {
		if l.heard == id {
			return true
		}
	}
	return false
}

func report(label string, run answer, legs []leg, t tally) {
	fmt.Printf("\n--- %s: the call, leg by leg ---\n", label)
	for _, l := range legs {
		if l.heard == "" {
			fmt.Printf("  %-24s ☎\n", l.action)
			continue
		}
		fmt.Printf("  %-24s → %s (%ds)\n", l.action, l.heard, l.secs)
	}
	fmt.Printf("\n--- %s: tools called ---\n  %s\n", label, strings.Join(run.names(), " "))
	// The `skill` calls get printed with their arguments, because "it consulted
	// what it knew" is the observation this whole example exists to make, and a
	// tool name on its own does not make it.
	for _, made := range run.calls {
		if made.name == "skill" {
			fmt.Printf("  · skill %s\n", made.args)
		}
	}
	fmt.Printf("[%s, %d tool calls, %d prompts heard, airtime %s, %v]\n",
		run.reason, len(run.calls), t.prompts, mmss(t.seconds), run.took.Round(time.Millisecond))
}

// norm flattens the ways a model writes money — "$2,847.19", "2847.19",
// "2,847.19 dollars" — onto one searchable spelling.
func norm(s string) string {
	return strings.NewReplacer(",", "", "$", "", " ", "").Replace(s)
}

// ---- the program's own plumbing ---------------------------------------------

// call is one tool call as the session recorded it. The arguments are kept
// because "it called `skill`" and "it loaded the skill run 1 wrote" are
// different claims, and only the second one is this example's.
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

func (a answer) names() []string {
	out := make([]string, len(a.calls))
	for i, c := range a.calls {
		out[i] = c.name
	}
	return out
}

// loaded says whether this run fetched a named skill through the harness's own
// `skill` tool — the observation the whole example turns on.
func (a answer) loaded(skill string) bool {
	for _, c := range a.calls {
		if c.name == "skill" && strings.Contains(c.args, skill) {
			return true
		}
	}
	return false
}

func openHarness(ctx context.Context, model, workspace string, line *ivr, m *memory, canTeach bool) *sdk.Harness {
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

	// A registered skill is only loadable BY NAME, and the model learns the
	// names from a catalog that `tool-skill` injects — but only when every
	// skill provider reports its discovery complete. The bundled
	// `skill-filesystem` provider cannot complete here (its watcher needs
	// `fs.watch`, which this runtime deliberately lacks), and one incomplete
	// provider suppresses the whole catalog, silently. So it is pointed at no
	// roots at all — which is also the truth of this deployment: every skill
	// here is host-registered, not read off disk. Examples 11 and 12 tell the
	// full story.
	entries := sdk.Compose(cfg)
	for i := range entries {
		if entries[i].ID == "agent-spine" {
			entries[i].Config["skills"] = map[string]any{
				"filesystem": map[string]any{"includeDefaultRoots": false},
			}
		}
	}
	cfg.Composition = entries

	h, err := sdk.Open(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}
	return h
}

func ask(ctx context.Context, s *sdk.Session, prompt string) answer {
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
	// The runtime has one known flake: a turn whose promise settles empty, which
	// surfaces as `unexpected end of JSON input (the runtime answered "")`. It
	// is transient, and everything survives it — the session keeps its history,
	// the line keeps its call state, the trail keeps its legs — so the honest
	// recovery is to resume the same session, not to start the run over. Once;
	// a second failure is a real one, and papering over it would hide it.
	if err != nil && strings.Contains(err.Error(), "the runtime answered") {
		fmt.Printf("  (a turn died in the runtime — %v — resuming the session)\n", err)
		result, err = s.Run(ctx, sdk.Text(
			"That last turn was cut off by an infrastructure error, not by anything you did. "+
				"The job is unchanged; check where things stand and finish it."), record)
	}
	if err != nil {
		log.Fatal(err)
	}
	if result.FinishReason == "error" {
		log.Fatal(sdk.TurnError(result.Events))
	}
	mu.Lock()
	defer mu.Unlock()
	return answer{
		text: strings.TrimSpace(result.FinalResponse),
		// The finish reason travels with the answer. A turn that ran out of
		// tokens halfway and a turn that did the job badly read identically
		// otherwise, and only one of those is the model's fault.
		reason: result.FinishReason,
		calls:  append([]call(nil), called...),
		took:   time.Since(started),
	}
}

func indent(s string) string {
	lines := strings.Split(strings.TrimRight(s, "\n"), "\n")
	for i, line := range lines {
		lines[i] = "    " + line
	}
	return strings.Join(lines, "\n")
}

func oneLine(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > 300 {
		return s[:299] + "…"
	}
	return s
}

func quoted(s string) string { return `"` + s + `"` }

func yes(ok bool) string {
	if ok {
		return "yes"
	}
	return "NO"
}

// pick reads a role's model id, falling back to the shared one the other
// examples use. The ids differ by endpoint, which is why they are environment
// rather than constants.
func pick(role string) string {
	if id := os.Getenv(role); id != "" {
		return id
	}
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}

// ---- the courier ------------------------------------------------------------

// lessonRecord is one thing the host agreed to keep. It is the shape
// ctx.skills.register accepts, so replaying it is a pass-through.
type lessonRecord struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	TaughtBy    string `json:"taughtBy"`
	TaughtAt    string `json:"taughtAt"`
}

// memory is the Go component both runs mount. On the exploring run it is a
// `learn` tool and a policy about what may be kept; on the replaying run it is
// the replay and nothing else.
type memory struct {
	path string

	mu       sync.Mutex
	verdicts []string
	replays  int
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

			// The replay. This is the half that makes run 2 possible: the
			// process begins by handing back what the host kept.
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

			// Only the exploring run gets the tool. A replaying run that could
			// write into the memory would make the comparison unreadable.
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

// learn is the host's policy on what may be kept, and the two things keeping
// it means: a live registration and a durable line.
//
// The policy is deliberately about SHAPE and never about content. A courier
// that told the agent what to write down would be doing the learning, and the
// comparison at the end would be measuring this program rather than the model.
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

		// Every refusal is written for the model, because the model is who
		// reads it, and a reason it can act on earns a corrected retry where
		// "invalid" earns a shrug.
		if reason := admissible(entry); reason != "" {
			m.note(entry.Name, "refused: "+reason)
			return "", fmt.Errorf("not recorded: %s", reason)
		}

		known, err := load(m.path)
		if err != nil {
			return "", err
		}
		for _, already := range known {
			if already.Name == entry.Name {
				m.note(entry.Name, "refused: already known")
				return "", fmt.Errorf("a lesson called %q is already recorded; load it with the "+
					"`skill` tool to see what it says, then either use it or record what is new "+
					"under another name", entry.Name)
			}
		}

		// Live first. A lesson written to the file but rejected by the registry
		// would be a memory that only the NEXT process discovers is broken.
		if err := register(skills, entry); err != nil {
			m.note(entry.Name, "refused by the registry")
			return "", err
		}
		if err := appendTo(m.path, entry); err != nil {
			return "", err
		}

		m.note(entry.Name, fmt.Sprintf("kept, %d bytes, from %s", len(entry.Content), model))
		return fmt.Sprintf("Recorded %q. It is loadable now with the `skill` tool, and every later "+
			"session — including other models' — starts with it.", entry.Name), nil
	}
}

// admissible is the host's opinion about shape. A description that describes
// the procedure rather than the occasion is the common failure, because the
// description is all a later session reads before deciding to load anything.
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

func (m *memory) note(name, verdict string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.verdicts = append(m.verdicts, fmt.Sprintf("%-26s %s", name, verdict))
}

func (m *memory) log() []string {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]string(nil), m.verdicts...)
}

func (m *memory) replayed() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.replays
}

// register puts one lesson into the live registry. `source: "runtime"` is how
// the registry labels a contribution that came from the process rather than
// from a provider's disk, and the invocation policy is what makes it visible
// to the model at all.
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
