// Command workspace gives the agent a directory to fix, then checks the disk.
//
// What it proves: capability is fenced by COMPOSITION, not by trust. `CWD`,
// `Roots` and `Env` are not advice to a well-behaved model — they configure the
// `fs-local` plugin bound to the `ctx.fs` seam, and every filesystem tool in the
// harness goes through that seam. A path outside the fence is refused by the
// provider before the tool body runs, so a model that tries anyway is told no
// rather than obeyed.
//
// The second thing it proves is a habit rather than a mechanism: the assertion
// is on DISK, from Go, not on the model's word that it made the edit.
//
// Seam: ctx.fs — @deepseek-ai/dsh-fs-local, configured from Config.CWD/Roots.
//
// Upstream: docs/capability-seams.md § fs, docs/subsystems/filesystem.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/03-workspace
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"

	"github.com/robomotionio/go-deepseek/sdk"
)

// A typo a reader can spot and a program can check for. `nmae` is undefined, so
// greet() returns "Hello, undefined!" — broken in a way that has exactly one
// sensible fix, which is what makes the disk assertion below meaningful.
const broken = `function greet(name) {
  return "Hello, " + nmae + "!";
}

module.exports = { greet };
`

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-workspace-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	target := filepath.Join(workdir, "greet.js")
	if err := os.WriteFile(target, []byte(broken), 0o644); err != nil {
		log.Fatal(err)
	}

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),

		// Where the agent works.
		CWD: workdir,

		// And the only place its tools may reach. Left empty this would default
		// to CWD, the session directory and the temporary directory; naming it
		// makes the fence explicit and narrower.
		Roots: []string{workdir},

		// The whole environment the harness sees — not this process's own. A
		// credential that has nothing to do with this agent stays out of reach
		// of anything the agent runs. DEEPSEEK_API_KEY is added by the SDK from
		// Config.APIKey or the process environment, so it need not be here.
		Env: map[string]string{"HOME": workdir},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	// ---- 1. a real edit, verified from Go -----------------------------------

	fmt.Println("--- fixing greet.js ---")
	result, err := h.Run(ctx, sdk.Text(
		"greet.js has a bug that makes it return \"Hello, undefined!\". "+
			"Find it and fix it. Change nothing else."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("%s\n[%s, %d tool calls]\n\n",
		result.FinalResponse, result.FinishReason, result.ToolCalls())

	// THE ASSERTION. Not "did it say it fixed the file" — did the bytes change.
	after, err := os.ReadFile(target)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("--- greet.js on disk ---")
	fmt.Println(strings.TrimRight(string(after), "\n"))

	switch {
	case strings.Contains(string(after), "nmae"):
		fmt.Println("\nFAIL: the typo is still there.")
		os.Exit(1)
	case !strings.Contains(string(after), `"Hello, " + name`):
		fmt.Println("\nFAIL: the typo is gone but the expression is not the fix.")
		os.Exit(1)
	default:
		fmt.Println("\nPASS: the file on disk is fixed.")
	}

	// ---- 2. the same agent, reaching outside the fence ----------------------

	fmt.Println("\n--- now something outside the fence ---")
	var refusals []string
	result, err = h.Run(ctx, sdk.Text(
		"Read the file /etc/hostname and tell me exactly what it contains. "+
			"If you cannot, say why in one sentence."),
		sdk.OnEvent(func(e sdk.Event) {
			if e.Type != sdk.EventToolResult {
				return
			}
			// The durable tool/result carries the model-facing message, and a
			// failed call is marked isError with the reason as its text. That
			// is how the refusal is visible to the PROGRAM, not only to the
			// model — the difference between "it says it could not" and "it
			// could not".
			var payload struct {
				Message struct {
					Content []struct {
						Type    string `json:"type"`
						IsError bool   `json:"isError"`
						Content []struct {
							Type string `json:"type"`
							Text string `json:"text"`
						} `json:"content"`
					} `json:"content"`
				} `json:"message"`
			}
			if e.Decode(&payload) != nil {
				return
			}
			for _, block := range payload.Message.Content {
				if block.Type != "tool-result" || !block.IsError {
					continue
				}
				var text strings.Builder
				for _, inner := range block.Content {
					text.WriteString(inner.Text)
				}
				refusals = append(refusals, strings.TrimSpace(text.String()))
			}
		}))
	if err != nil {
		log.Fatal(err)
	}

	for _, refusal := range refusals {
		fmt.Println("the fence said ·", refusal)
	}
	fmt.Println()
	fmt.Println(result.FinalResponse)

	if len(refusals) == 0 {
		// It never tried, which is not a refusal — worth distinguishing, because
		// "the model chose not to" and "the fence said no" are different facts.
		fmt.Println("\n(the agent did not attempt the read; the fence was not exercised)")
	}
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
