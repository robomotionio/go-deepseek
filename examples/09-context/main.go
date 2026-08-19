// Command context gives the model facts it has no way to know.
//
// What it proves: every step the agent takes can carry live state from your
// program. A Go component registers a system-prompt section whose text is not a
// string but a PROVIDER — a function the harness calls at each assembly — so the
// model sees the world as it is at that step, not as it was when the process
// started.
//
// This is what separates an agent embedded in a system from a chatbot with a
// long preamble. The deployment status below changes between the two turns, in
// Go, with no re-open and no second prompt, and the model's answer moves with it.
//
// Seam: ctx.systemPrompt.section(), with a ctx.SyncFunc text provider.
//
// Upstream: docs/subsystems/system-prompt.md.
//
// THE HEAVIER ALTERNATIVE, for when a section is not enough. A section
// contributes to the SYSTEM PROMPT. To inject whole MESSAGES before a step —
// or to refuse the step outright — listen on the agent/pre-step waterfall,
// whose decision is `{kind:'reject'} | {kind:'enter', messages}`. That is how
// upstream's own time-context and agent-instructions plugins work, and thirteen
// shipped plugins listen there: compaction, plan mode, the hooks bridges, the
// skill tool, the subagent driver, and more. No row modifies the loop.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/09-context
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"sync"

	"github.com/robomotionio/go-deepseek/sdk"
)

// deployment is the live state — the sort of thing that lives in your process
// and changes while the agent is mid-conversation.
type deployment struct {
	mu      sync.Mutex
	release string
	build   string
	onCall  string
	reads   int
}

func (d *deployment) set(release, build, onCall string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.release, d.build, d.onCall = release, build, onCall
}

// text is what the model is shown. It is recomputed on EVERY assembly, which is
// the whole point: the section is a window on the state, not a copy of it.
func (d *deployment) text() string {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.reads++
	return strings.Join([]string{
		"## Deployment status",
		"",
		"These facts are supplied by the host program at every step. They are",
		"authoritative and current; do not guess at them or recall earlier values.",
		"",
		"- Current release: " + d.release,
		"- Build pipeline: " + d.build,
		"- On call right now: " + d.onCall,
	}, "\n")
}

func (d *deployment) assemblies() int {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.reads
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-context-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	state := &deployment{}
	state.set("v4.2.1", "green — last build passed 11 minutes ago", "rita@example.com")

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),
		CWD:   workdir,
		Env:   map[string]string{"HOME": workdir},
		Plugins: []sdk.Plugin{{
			ID: "deployment-context",

			// Declared, and enforced: reading a service this component did not
			// name is refused by the context itself.
			Inject: []string{"systemPrompt"},

			Apply: func(pc *sdk.Context) error {
				// section(...) returns its own disposer, and registering is a
				// tracked effect either way — unmounting the component removes
				// the section whether or not anyone calls it.
				_, err := pc.Call("systemPrompt.section", map[string]any{
					"name": "host:deployment",

					// Sections are concatenated in ascending order. -100 is the
					// harness identity and 0 the deployment persona, so this
					// sits just after the persona and well before tool guidance
					// (100–199).
					"order": 10,

					// A SyncFunc, not a Func. The harness wants a string here
					// and now — it is assembling a prompt, not awaiting one — so
					// this runs on the goroutine that owns the JavaScript world.
					// It must not block and must not call back across the
					// bridge; reading a mutex-guarded struct is exactly the
					// shape that is safe.
					"text": pc.SyncFunc(func([]json.RawMessage) (any, error) {
						return state.text(), nil
					}),
				})
				return err
			},
		}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	// One session, so the second turn shares the first turn's history. If the
	// answer changed only because the conversation was reset, the example would
	// prove nothing.
	session := h.Session("ops")

	fmt.Println("--- turn 1 ---")
	first, err := session.Run(ctx, sdk.Text(
		"What release is live right now, is the pipeline healthy, and who is on call? "+
			"Answer in one short line."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(first.FinalResponse)

	// The world moves. No re-open, no new prompt, no message injected.
	fmt.Println("\n--- the host changes the facts (deploy lands, on-call rotates) ---")
	state.set("v4.3.0", "red — the nightly integration job is failing", "sam@example.com")

	fmt.Println("\n--- turn 2, same session ---")
	second, err := session.Run(ctx, sdk.Text(
		"And now? Same three facts, one short line."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(second.FinalResponse)

	fmt.Printf("\n[the section was assembled %d times]\n", state.assemblies())

	// THE ASSERTIONS. The second answer must carry the new facts and not the
	// old ones — a model repeating v4.2.1 would mean the text was captured once
	// rather than recomputed.
	failed := false
	for _, check := range []struct {
		want    string
		present bool
		why     string
	}{
		{"v4.3.0", true, "the new release"},
		{"v4.2.1", false, "the old release, which must not survive into turn 2"},
		{"sam", true, "the new on-call"},
	} {
		got := strings.Contains(strings.ToLower(second.FinalResponse), strings.ToLower(check.want))
		status := "PASS"
		if got != check.present {
			status, failed = "FAIL", true
		}
		fmt.Printf("  %s  %-8s present=%-5v  %s\n", status, check.want, got, check.why)
	}
	if failed {
		os.Exit(1)
	}
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
