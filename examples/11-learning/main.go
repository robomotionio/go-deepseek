// Command learning teaches the agent something it cannot know, and it keeps it.
//
// What it proves: the harness has a LEARNING SURFACE, and in Go the host owns
// it. `ctx.skills` is a registry of capabilities the agent can load by name —
// the same seam `@deepseek-ai/dsh-skill-filesystem` fills from `.dsh/skills`
// upstream — and `ctx.skills.register` reaches it from Go. So a Go program can
// decide what the agent is allowed to remember, write the durable copy itself,
// and hand it back at the start of the next process.
//
// The shape of the demonstration is three turns:
//
//  1. COLD. The agent is asked something no model can know. It cannot answer.
//  2. TAUGHT. The procedure arrives in a message, and the agent calls `learn` —
//     a Go tool. Go validates it, registers it on ctx.skills, and appends it to
//     its own file.
//  3. A SECOND PROCESS. A fresh harness, a fresh JavaScript world, a fresh
//     conversation. Its Apply replays the file into ctx.skills before the first
//     turn, the same question is asked cold, and this time the agent loads the
//     skill and answers.
//
// THE MEMORY IS THE HOST'S, NOT THE AGENT'S. learned.jsonl is written OUTSIDE
// Config.Roots, so the agent's own `read` cannot reach it — which is what makes
// turn 3 mean something. A file inside the workspace would leave "it read its
// notes" as an explanation just as good as "it loaded the skill", and the point
// of the example is that those are different.
//
// TWO THINGS ABOUT WHERE LEARNING CAN HAPPEN, because both are easy to get
// wrong and neither is obvious.
//
// A Go plugin's calls cross the bridge only while the harness's event loop is
// running — during Apply, and during a turn. Between turns the owning goroutine
// is parked waiting for work, so a bridge call made from the host in that gap
// BLOCKS rather than failing. Learning therefore happens inside a tool call,
// which is where it belongs anyway: the agent decides it has learned something,
// and says so by calling a tool.
//
// And a learned skill is KNOWLEDGE, not code. Go cannot evaluate JavaScript the
// model wrote — `node:vm` is refused by this runtime by name, and upstream's
// self-referential toolset (@deepseek-ai/dsh-tool-cordis) is not in this bundle
// because its runner needs exactly that. What the model gains here is a named,
// loadable procedure; see 12 for a plugin the model authors.
//
// Seam: ctx.skills — @deepseek-ai/dsh-skill's registry, mounted by the default
// composition through agent-spine-demo, and read by the harness's own `skill`
// tool.
//
// Upstream: docs/capability-seams.md, packages/skill/skill/README.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/11-learning
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

// The thing no model can know. Two rules rather than one, so that a right
// answer means the whole procedure survived rather than half of it, and a
// number no model would land on by accident.
const (
	skillName = "flux-tolerance"

	question = "What is the flux tolerance of part RM-7, whose bore is 12 mm? " +
		"Give me the number in millimetres. If you do not know how to work it out, say so plainly."

	teaching = "Here is how we work out a flux tolerance, which is house knowledge and is not " +
		"written down anywhere you can reach: take the bore in millimetres, multiply it by 1.8, " +
		"then subtract 0.4. If the part number ends in an odd digit, add a further 0.25. " +
		"Record that as a reusable skill called \"" + skillName + "\" so that you never need " +
		"telling again, then answer my earlier question."

	// 12 × 1.8 = 21.6, − 0.4 = 21.2, and RM-7 ends odd, so + 0.25.
	expected = "21.45"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	root, err := os.MkdirTemp("", "dsh-learning-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(root)

	// Two directories, and the separation is the point. The agent works in one
	// and is fenced to it; the other holds what it has learned, where its own
	// tools cannot reach.
	workspace := filepath.Join(root, "workspace")
	memory := filepath.Join(root, "memory")
	for _, dir := range []string{workspace, memory} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			log.Fatal(err)
		}
	}
	remembered := filepath.Join(memory, "learned.jsonl")

	// ---- 1 and 2: one conversation, in one process --------------------------

	// Turns 1 and 2 share a session, so that "answer my earlier question" in the
	// lesson refers to something. Turn 3 does not, deliberately.
	teacher := newMentor(remembered)
	school := open(ctx, workspace, teacher)
	bench := school.Session("bench")

	fmt.Println("--- turn 1: cold ---")
	answer, tools := ask(ctx, bench, question)
	fmt.Printf("%s\n[tools: %s]\n", answer, orNone(tools))
	if strings.Contains(answer, expected) {
		// Not a harness failure — the PREMISE failed, and saying which is the
		// difference between a broken example and a bad one.
		school.Close()
		fmt.Printf("\nFAIL: the agent already answered %q, so it did know.\n"+
			"The example needs a fact no model can have; this one is no longer that.\n", expected)
		os.Exit(1)
	}
	fmt.Println("\nPASS: it could not answer, because nothing here knows this yet.")

	fmt.Println("\n--- turn 2: taught ---")
	answer, tools = ask(ctx, bench, teaching)
	school.Close()
	fmt.Printf("%s\n[tools: %s]\n", answer, orNone(tools))

	fmt.Println("\n--- what the host agreed to remember ---")
	for _, line := range teacher.log() {
		fmt.Println(" ", line)
	}
	if len(teacher.log()) == 0 {
		fmt.Println("  (nothing — the agent never called `learn`)")
	}

	learned, err := load(remembered)
	if err != nil {
		log.Fatalf("FAIL: cannot read the host memory: %v", err)
	}
	fmt.Printf("\n  %s holds %d skill(s), outside the agent's roots\n",
		filepath.Base(remembered), len(learned))
	for _, entry := range learned {
		fmt.Printf("  · %-18s %s\n", entry.Name, entry.Description)
	}
	if len(learned) == 0 {
		log.Fatal("FAIL: the agent was taught and recorded nothing")
	}

	// ---- 3. a second process, which starts already knowing -------------------

	// A fresh harness, a fresh JavaScript world, and a FRESH SESSION ID — the
	// last of those on purpose. A session id is the name of a durable log, so
	// reusing "bench" would resume the lesson and prove nothing. This one has
	// never been spoken to.
	fmt.Println("\n--- turn 3: a second process, same question, no conversation ---")
	student := newMentor(remembered)
	again := open(ctx, workspace, student)
	answer, tools = ask(ctx, again.Session("cold-start"), question)
	again.Close()

	fmt.Printf("%s\n[tools: %s]\n", answer, orNone(tools))

	fmt.Println("\n--- the assertions ---")
	failed := false
	for _, check := range []struct {
		what string
		ok   bool
		why  string
	}{
		{"out of reach", !within(remembered, workspace),
			"the memory is outside Config.Roots, so no tool of the agent's could have read it"},
		{"replayed at mount", student.replayed() > 0,
			"Apply handed the learned skill back to ctx.skills before the turn"},
		{"the right number", strings.Contains(answer, expected),
			"the whole procedure survived, not half of it"},
		{"loaded, not guessed", has(tools, "skill"),
			"it called the harness's own `skill` tool to fetch what it had learned"},
	} {
		status := "PASS"
		if !check.ok {
			status, failed = "FAIL", true
		}
		fmt.Printf("  %s  %-19s %s\n", status, check.what, check.why)
	}

	if failed {
		os.Exit(1)
	}
	fmt.Println("\nTurn 1 and turn 3 are the same question asked of the same binary.")
	fmt.Println("What changed between them is a skill the agent asked to keep.")
}

// ---- the component ----------------------------------------------------------

// skill is one learned capability, as Go stores it. It is deliberately the
// shape ctx.skills.register accepts, so replaying is a pass-through rather than
// a translation that could drift.
type skill struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
	LearnedAt   string `json:"learnedAt"`
}

// mentor is the Go component: one tool the agent can call to remember
// something, the policy that decides whether it may, and the durable copy.
type mentor struct {
	path string

	mu       sync.Mutex
	verdicts []string
	replays  int
}

func newMentor(path string) *mentor { return &mentor{path: path} }

func (m *mentor) plugin() sdk.Plugin {
	return sdk.Plugin{
		ID: "mentor",

		// Declared, and enforced. `skills` is the registry; `tools` is where the
		// one tool below lands.
		Inject: []string{"tools", "skills"},

		Apply: func(ctx *sdk.Context) error {
			skills, err := ctx.Service("skills")
			if err != nil {
				return err
			}

			// REPLAY, before anything else. This is the half that makes the
			// third turn possible: the process starts by handing back
			// everything the host agreed to remember last time.
			known, err := load(m.path)
			if err != nil {
				return err
			}
			for _, learned := range known {
				if err := register(skills, learned); err != nil {
					return err
				}
				m.mu.Lock()
				m.replays++
				m.mu.Unlock()
			}

			return ctx.RegisterTool(sdk.Tool{
				Name: "learn",
				// The description is the interface, and this one has a job to
				// do: the model has to recognise the moment. "You were told
				// something you did not know" is that moment.
				Description: "Remember a procedure you were just taught, so that later sessions " +
					"already know it. Call this when you learn something durable that you could " +
					"not have worked out yourself — a house rule, a formula, a convention. " +
					"The skill becomes loadable by name through the `skill` tool.",
				Parameters: map[string]any{
					"name": map[string]any{
						"type": "string", "required": true,
						"description": `Kebab-case identifier, e.g. "flux-tolerance".`,
					},
					"description": map[string]any{
						"type": "string", "required": true,
						"description": "One line saying WHEN this is the right thing to load. " +
							"It is all a later session sees before deciding, so describe the " +
							"occasion, not the procedure.",
					},
					"procedure": map[string]any{
						"type": "string", "required": true,
						"description": "The knowledge itself, in Markdown, complete enough to " +
							"act on without the conversation that produced it.",
					},
				},
				// Runs on its own goroutine, mid-turn — which is the only time a
				// Go plugin can call back across the bridge. See the file
				// comment.
				Execute: m.learn(skills),
			})
		},
	}
}

// learn is the tool body: the host's policy on what may be remembered, then the
// two things remembering means here — a live registration, and a durable line.
func (m *mentor) learn(skills *sdk.Object) func(context.Context, json.RawMessage) (string, error) {
	return func(ctx context.Context, args json.RawMessage) (string, error) {
		var in struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Procedure   string `json:"procedure"`
		}
		if err := json.Unmarshal(args, &in); err != nil {
			return "", err
		}

		learned := skill{
			Name:        strings.TrimSpace(in.Name),
			Description: strings.TrimSpace(in.Description),
			Content:     strings.TrimSpace(in.Procedure),
			LearnedAt:   time.Now().UTC().Format(time.RFC3339),
		}

		// The policy. It is short, and it is the whole reason this is a Go
		// function rather than a write the model does itself: what a system
		// remembers forever is worth one program's opinion. Every refusal is
		// written for the model, because the model is who reads it and a good
		// reason earns a corrected retry.
		if reason := admissible(learned); reason != "" {
			m.note(learned.Name, "refused: "+reason)
			return "", fmt.Errorf("not remembered: %s", reason)
		}

		known, err := load(m.path)
		if err != nil {
			return "", err
		}
		for _, already := range known {
			if already.Name == learned.Name {
				m.note(learned.Name, "refused: already known")
				return "", fmt.Errorf("a skill called %q is already known; "+
					"load it with the `skill` tool and use it, or choose another name",
					learned.Name)
			}
		}

		// Live first. A skill written to the file but rejected by the registry
		// would be a memory that only the NEXT process discovers is broken.
		if err := register(skills, learned); err != nil {
			m.note(learned.Name, "refused by the registry")
			return "", err
		}
		if err := appendTo(m.path, learned); err != nil {
			return "", err
		}

		m.note(learned.Name, "remembered")
		return fmt.Sprintf("Remembered %q. It is loadable now with the `skill` tool, "+
			"and every later session starts with it.", learned.Name), nil
	}
}

// admissible is the host's opinion about what is worth keeping. A description
// that describes the procedure rather than the occasion is the common failure,
// because it is what a later session reads before deciding whether to load.
func admissible(learned skill) string {
	switch {
	case learned.Name == "":
		return "a skill needs a name"
	case !kebab(learned.Name):
		return fmt.Sprintf("%q is not a kebab-case name like \"flux-tolerance\"", learned.Name)
	case len(learned.Description) < 12:
		return "the description is what a later session reads before deciding to load this, " +
			"so it needs to say when this is the right thing to reach for"
	case len(learned.Content) < 24:
		return "the procedure is too short to act on without the conversation that produced it"
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

// appendTo adds one line to the host's memory. Opened and closed per call
// rather than held: the file is the durable copy, and a process that dies
// between turns should leave the lesson behind it.
func appendTo(path string, learned skill) error {
	line, err := json.Marshal(learned)
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

func (m *mentor) note(name, verdict string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.verdicts = append(m.verdicts, fmt.Sprintf("%-18s %s", name, verdict))
}

// log is what the policy decided, for the transcript.
func (m *mentor) log() []string {
	m.mu.Lock()
	defer m.mu.Unlock()
	return append([]string(nil), m.verdicts...)
}

func (m *mentor) replayed() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.replays
}

// register puts one skill into the live registry. `source: "runtime"` is how
// the registry labels a contribution that came from the process rather than
// from a provider's disk, and the invocation policy is what makes it visible to
// the model at all.
func register(skills *sdk.Object, learned skill) error {
	_, err := skills.Call("register", map[string]any{
		"name":        learned.Name,
		"description": learned.Description,
		"content":     learned.Content,
		"source":      "runtime",
		"invocation":  map[string]any{"modelInvocable": true, "userInvocable": true},
	})
	return err
}

// load reads the host's memory. A missing file is an empty memory, not an
// error: the first process to run has never learned anything.
func load(path string) ([]skill, error) {
	file, err := os.Open(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var out []skill
	lines := bufio.NewScanner(file)
	lines.Buffer(make([]byte, 0, 1<<20), 1<<24)
	for lines.Scan() {
		if strings.TrimSpace(lines.Text()) == "" {
			continue
		}
		var learned skill
		if err := json.Unmarshal(lines.Bytes(), &learned); err != nil {
			return nil, err
		}
		out = append(out, learned)
	}
	return out, lines.Err()
}

// ---- the program's own plumbing ---------------------------------------------

func open(ctx context.Context, workspace string, m *mentor) *sdk.Harness {
	cfg := sdk.Config{
		Model: model(),

		// The fence. Note what is NOT in it: the memory directory, which is a
		// sibling of this one.
		CWD:   workspace,
		Roots: []string{workspace},
		Env:   map[string]string{"HOME": workspace},

		Plugins: []sdk.Plugin{m.plugin()},
	}

	// A registered skill is only loadable BY NAME, and the model learns the
	// names from a catalog `tool-skill` injects into the conversation — but
	// only when every skill provider reports its discovery complete.
	//
	// `fs.watch` used to be the obstacle: the bundled `skill-filesystem`
	// watches its roots with chokidar, this runtime had no watcher, and the
	// provider reported `complete: false` — which suppresses the whole catalog
	// without an error. The runtime implements `fs.watch` now (nodecompat), and
	// `sdk.TestSkillDiscoveryCompletes` holds it to that, so the provider would
	// complete on its own.
	//
	// Pointing it at no roots is kept anyway, because it is the truth of THIS
	// deployment rather than a workaround: every skill here is host-registered,
	// so a filesystem scan has nothing to find and asking for one only makes
	// act three wait for an answer that is always empty.
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

// ask runs one turn and reports the answer with the tools it took to get there.
func ask(ctx context.Context, s *sdk.Session, prompt string) (string, []string) {
	var mu sync.Mutex
	var called []string

	result, err := s.Run(ctx, sdk.Text(prompt), sdk.OnEvent(func(e sdk.Event) {
		if e.Type != "tool/call" {
			return
		}
		var call struct {
			Name string `json:"name"`
		}
		if e.Decode(&call) == nil && call.Name != "" {
			mu.Lock()
			called = append(called, call.Name)
			mu.Unlock()
		}
	}))
	if err != nil {
		log.Fatal(err)
	}
	if result.FinishReason == "error" {
		log.Fatal(sdk.TurnError(result.Events))
	}
	mu.Lock()
	defer mu.Unlock()
	return strings.TrimSpace(result.FinalResponse), append([]string(nil), called...)
}

// within says whether a path lies inside a directory, which is how the fence
// claim above is checked rather than asserted.
func within(path, dir string) bool {
	rel, err := filepath.Rel(dir, path)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func has(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}

func orNone(values []string) string {
	if len(values) == 0 {
		return "(none)"
	}
	return strings.Join(values, " ")
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
