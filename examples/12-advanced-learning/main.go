// Command advanced-learning does a day's RPA twice: once by working the site
// out, and once from what it learned the first time.
//
// Example 11 taught the agent a fact. This one has it learn a JOB — the shape
// of an enterprise web application it has never seen, and the policy the
// business applies inside it. That is the expensive part of real process
// automation, and it is expensive exactly once.
//
// THE WORK. A Workmonth HR portal is served by this program on loopback, with
// six pending leave requests in it. The agent must sign in, find the queue,
// read every request, find the leave policy — which is published in the portal
// but not where you would look first — and approve or deny each one, writing a
// reason in the format the portal insists on. Nothing about the site is in the
// prompt beyond its address and a login.
//
//	run 1   explore     sign in, wander, find the policy, decide six requests,
//	                    then record the whole route with `learn`
//	RESET   the queue goes back to six pending, every session is forgotten
//	run 2   replay      a new process, a new session, the same task, and the
//	                    lesson replayed into ctx.skills before the first token
//
// WHAT IS MEASURED. The portal counts every HTTP request it serves, so the two
// runs are compared on the thing that actually costs time and money: trips to
// the site, tool calls, and wall clock. The exploring run pays for the map. The
// replaying run has it.
//
// HOW IT IS VERIFIED, which is the half that makes this more than a demo. The
// portal is a Go struct in this process. When a run finishes, the assertions
// read that struct — not the agent's summary — and check every one of the six
// against the policy written in Go beside it. An agent cannot report a job it
// did not do, because it is never asked. Three approvals, three denials, and
// each denial has to name the one rule it actually broke.
//
// THE SEAM. The agent has no way to reach a network: `@deepseek-ai/dsh-tool-web`
// is bundled but injects `web`, which nothing here provides, so it mounts
// nothing — example 05 shows that happening. What it gets instead is `open` and
// `submit`, two Go functions holding a cookie jar and an http.Client fenced to
// this one origin. That is a browser in the only sense an RPA needs one, and
// what it may reach is a Go decision rather than a hope.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=$OPENROUTER_API_KEY
//	export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1
//	export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731
//	go run ./examples/12-advanced-learning
//
// Set DSH_EXPLORER_MODEL and DSH_OPERATOR_MODEL to two different ids on your
// gateway to have one model do the exploring and another do the work — which is
// the shape a deployment actually wants, because only one of the two has to be
// clever. With neither set, one model plays both parts and the program says so.
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

const (
	user     = "priya.sharma@globex.example"
	password = "WorkTraining2026!"
)

// job is the task, and it is the SAME STRING for both runs. The only difference
// between them is the paragraph the exploring run gets afterwards, and what the
// replaying run already knows when it starts.
func job(base string) string {
	return "Clear the pending time-off queue in the Workmonth HR portal at " + base + ".\n\n" +
		"Sign in as " + user + " with the password " + password + ". Approve every pending " +
		"request that complies with the company leave policy and deny the ones that do not, " +
		"writing the reason the portal asks for. The policy is published inside the portal; " +
		"find it and follow it exactly rather than guessing what is reasonable.\n\n" +
		"You reach the site only through the `open` and `submit` tools, and you are being timed. " +
		"If you already hold a skill for this portal, load it first and follow the ROUTE it " +
		"describes rather than rediscovering the site — though read the queue itself fresh, " +
		"because the requests in it are not the ones it was written against. Finish when no " +
		"request is left pending."
}

// alsoRecord is the only difference between the two prompts. It is written as a
// second half of the job rather than as an afterthought, because an agent that
// has just been told to finish when the queue is clear will do exactly that: an
// earlier draft of this ended with the recording step appended after the
// finishing condition, and the run cleared the queue in twelve requests and
// then stopped without writing anything down.
const alsoRecord = "\n\nThe queue being clear is only half of this job. You are NOT finished until " +
	"both of these are done as well:\n\n" +
	"1. Go and look for a FASTER route through this job than the one you took. A portal this " +
	"size usually has one, and finding it is worth more than anything else you can record.\n" +
	"2. Call `learn` and write down what a session that has never seen this portal would need in " +
	"order to do this again without exploring: the paths and what each is for, the form field " +
	"names, how the session and the token work, where the policy lives and what it says, the " +
	"exact format a denial reason must take, and the fastest route end to end. Write paths rather " +
	"than absolute URLs, and do NOT record the six decisions themselves — the queue will hold " +
	"different requests next time.\n\n" +
	"Stop only once `learn` has accepted a lesson."

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	explorer := pick("DSH_EXPLORER_MODEL")
	operator := pick("DSH_OPERATOR_MODEL")

	site, err := newPortal()
	if err != nil {
		log.Fatal(err)
	}
	defer site.close()

	root, err := os.MkdirTemp("", "dsh-rpa-")
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

	fmt.Printf("Workmonth HR is up at %s\n", site.base)
	fmt.Printf("explorer: %s\noperator: %s\n", explorer, operator)
	if explorer == operator {
		fmt.Println("(one model on both sides — set DSH_EXPLORER_MODEL and DSH_OPERATOR_MODEL to")
		fmt.Println(" different ids to have the clever one teach the cheap one.)")
	}
	fmt.Printf("pending: %s\n", pending(site.state()))

	// EVERY RUN STARTS FROM SCRATCH. The memory lives in a temp directory this
	// process made and removes, so nothing an earlier run learned is here — and
	// that is asserted rather than assumed, because an example whose first pass
	// quietly began already knowing would prove nothing at all.
	before, err := load(remembered)
	if err != nil {
		log.Fatal(err)
	}
	if len(before) != 0 {
		log.Fatalf("FAIL: this run began already knowing %d thing(s)", len(before))
	}
	fmt.Println("memory: empty — nothing has been learned yet")

	// ---- run 1: work it out --------------------------------------------------

	fmt.Println("\n═══ run 1 · exploring ═══")
	teacher := newMemory(remembered)
	firstPending := len(strings.Fields(pending(site.state())))
	first := openHarness(ctx, explorer, workspace, site, teacher, true)
	cold := ask(ctx, first.Session("explore"), job(site.base)+alsoRecord)
	first.Close()

	fmt.Printf("\n%s\n", oneLine(cold.text))
	coldTrips := site.requests()
	coldWork := audit(site.state())
	report("run 1", cold, coldTrips, coldWork)

	fmt.Println("\n--- what the host agreed to keep ---")
	for _, line := range teacher.log() {
		fmt.Println(" ", line)
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
	if len(learned) > 0 {
		lessonName = learned[0].Name
	}

	// ---- the reset -----------------------------------------------------------

	site.reset()
	secondPending := len(strings.Fields(pending(site.state())))
	fmt.Printf("\n═══ reset · pending again: %s ═══\n", pending(site.state()))

	// ---- run 2: from the lesson ---------------------------------------------

	fmt.Println("\n═══ run 2 · replaying ═══")
	student := newMemory(remembered)
	second := openHarness(ctx, operator, workspace, site, student, false)
	warm := ask(ctx, second.Session("replay"), job(site.base))
	second.Close()

	fmt.Printf("\n%s\n", oneLine(warm.text))
	warmTrips := site.requests()
	warmWork := audit(site.state())
	report("run 2", warm, warmTrips, warmWork)

	// ---- the comparison ------------------------------------------------------

	fmt.Println("\n--- the same job, twice ---")
	fmt.Printf("  %-24s %9s %9s\n", "", "run 1", "run 2")
	fmt.Printf("  %-24s %9d %9d\n", "HTTP requests", len(coldTrips), len(warmTrips))
	fmt.Printf("  %-24s %9d %9d\n", "tool calls", len(cold.calls), len(warm.calls))
	fmt.Printf("  %-24s %9s %9s\n", "wall clock",
		cold.took.Round(time.Second), warm.took.Round(time.Second))
	fmt.Printf("  %-24s %9s %9s\n", "queue cleared correctly", yes(coldWork.ok), yes(warmWork.ok))

	fmt.Println("\n--- the assertions ---")
	failed := false
	for _, check := range []struct {
		what string
		ok   bool
		why  string
	}{
		{"run 1 did the job", coldWork.ok,
			"every request decided as the published policy says, read off the portal's own state"},
		{"a lesson was kept", lessonName != "",
			"the exploring run wrote down the route it had just paid for"},
		{"run 1 had nothing", !cold.loaded(lessonName),
			"the first pass could not have loaded what it had not written yet"},
		{"the reset was real", firstPending == 6 && secondPending == 6,
			"run 2 faced six pending requests, not run 1's finished queue"},
		{"replayed at mount", student.replayed() > 0,
			"Apply handed the lesson to ctx.skills before run 2's first token"},
		{"the skill was loaded", warm.loaded(lessonName),
			"run 2 called the harness's own `skill` tool for " + quoted(lessonName) + " by name"},
		{"run 2 did the job", warmWork.ok,
			"the same six decisions, from the lesson rather than from exploring"},
		{"and did it in less", len(warmTrips) < len(coldTrips),
			"fewer trips to the site for identical work — which is the whole point"},
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
	fmt.Println("\nThe portal never changed. What changed is that the second run had been here")
	fmt.Println("before — in a file it cannot read, replayed into it before it woke up.")
}

// ---- checking the work ------------------------------------------------------

type outcome struct {
	ok    bool
	lines []string
}

// audit reads the portal's own state and checks it against the policy in Go.
// Nothing the agent said is consulted, which is the point: the job is finished
// when the queue is finished, not when the agent says it is.
func audit(state []leave) outcome {
	result := outcome{ok: true}
	for _, item := range state {
		want, rule := verdict(item)
		got := item.Status
		note := ""
		switch {
		case got == "Pending":
			note, result.ok = "still pending", false
		case got != want:
			note, result.ok = "should be "+strings.ToLower(want), false
		case want == "Denied" && !strings.HasPrefix(strings.ToLower(item.Reason), rule):
			note, result.ok = "denied for the wrong rule; "+rule+" is the one it breaks", false
		}
		mark := "  "
		if note != "" {
			mark = "**"
			note = " — " + note
		}
		result.lines = append(result.lines, fmt.Sprintf("  %s %-9s %-9s %s%s",
			mark, item.ID, got, short(item.Reason), note))
	}
	return result
}

func report(label string, run answer, trips []string, work outcome) {
	fmt.Printf("\n--- %s: the queue afterwards ---\n", label)
	for _, line := range work.lines {
		fmt.Println(line)
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
	fmt.Printf("\n--- %s: what the portal was asked for (%d requests) ---\n", label, len(trips))
	for _, line := range collapse(trips) {
		fmt.Println("  " + line)
	}
	fmt.Printf("[%s, %d tool calls, %v]\n",
		run.reason, len(run.calls), run.took.Round(time.Millisecond))
}

// collapse folds a repeated path into one line with a count, so a run that
// fetched the same page eleven times says so in one line rather than eleven.
func collapse(trail []string) []string {
	var out []string
	for i := 0; i < len(trail); {
		j := i
		for j < len(trail) && trail[j] == trail[i] {
			j++
		}
		if j-i > 1 {
			out = append(out, fmt.Sprintf("%s  ×%d", trail[i], j-i))
		} else {
			out = append(out, trail[i])
		}
		i = j
	}
	return out
}

func pending(state []leave) string {
	var ids []string
	for _, item := range state {
		if item.Status == "Pending" {
			ids = append(ids, item.ID)
		}
	}
	return strings.Join(ids, " ")
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

func openHarness(ctx context.Context, model, workspace string, site *portal, m *memory, canTeach bool) *sdk.Harness {
	cfg := sdk.Config{
		Model: model,
		CWD:   workspace,
		Roots: []string{workspace},
		Env:   map[string]string{"HOME": workspace},

		Plugins: []sdk.Plugin{
			newBrowser(site.base).plugin(),
			m.plugin(model, canTeach),
		},
	}

	// A registered skill is only loadable BY NAME, and the model learns the
	// names from a catalog that `tool-skill` injects into the conversation —
	// but only when every skill provider reports its discovery complete. The
	// bundled `skill-filesystem` provider cannot, here: it watches its roots
	// with chokidar, chokidar needs `fs.watch`, and this runtime deliberately
	// lacks it — so the provider reports `complete: false`, and one incomplete
	// provider suppresses the whole catalog. Nothing errors. The skills are
	// all registered, loadable, invisible — and a model told "load your skill
	// first" can only guess at a name, miss, and re-explore, which is exactly
	// the waste run 2 exists to not do.
	//
	// So the provider is pointed at no roots at all, which is also the truth
	// of this deployment: every skill here is host-registered, not read off
	// disk. With nothing to scan or watch, discovery completes, and the
	// catalog appears.
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
	// the browser its cookie jar, the portal its state — so the honest recovery
	// is to resume the same session, not to start the run over. Once; a second
	// failure is a real one, and papering over it would hide it.
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

func short(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > 46 {
		return s[:45] + "…"
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
				Description: "Write down a route you have just worked out, so that a session that " +
					"has never seen this system can follow it without exploring. Use it once, at " +
					"the end, for the whole job rather than for one step of it.",
				Parameters: map[string]any{
					"name": map[string]any{
						"type": "string", "required": true,
						"description": `Kebab-case identifier, e.g. "workmonth-leave-policing".`,
					},
					"description": map[string]any{
						"type": "string", "required": true,
						"description": "One line saying WHEN to reach for this. It is all a later " +
							"session sees before deciding to load it, so describe the occasion.",
					},
					"procedure": map[string]any{
						"type": "string", "required": true,
						"description": "The route itself, in Markdown: the paths, the field names, " +
							"the session and token rules, the policy in full, the format a denial " +
							"reason must take, and the shortest way through. Complete enough to " +
							"act on without ever opening an exploratory page.",
					},
				},
				Execute: m.learn(skills, model),
			})
		},
	}
}

// learn is the host's policy on what may be kept, and the two things keeping it
// means: a live registration and a durable line.
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
		return fmt.Sprintf("%q is not a kebab-case name like \"workmonth-leave-policing\"", entry.Name)
	case len(entry.Description) < 16:
		return "the description is all a later session reads before deciding to load this, " +
			"so it has to say when this is the right thing to reach for"
	case len(entry.Content) < 200:
		return "the route is too short to follow without exploring; it needs the paths, the " +
			"field names, the session and token rules, and the policy in full"
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
// from a provider's disk, and the invocation policy is what makes it visible to
// the model at all.
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
