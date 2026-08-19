// Command hello runs one turn of a real coding agent inside this process.
//
// What it proves: the harness is not a service you call over a network and not
// a subprocess you spawn. It is compiled into this binary and executed by a
// pure-Go JavaScript engine. There is no Node.js on this machine, nothing was
// fetched at start-up, and nothing but this program is running.
//
// Seam: none. This is the floor the other nine examples stand on.
//
// Upstream: docs/architecture.md — "the harness is a cordis application", and
// the composition Open builds for you is the one described there as the minimal
// useful agent.
//
// One side effect worth knowing about, because it is the default rather than
// this example's choice: with no CWD set the agent works in the process's
// working directory, and its session log lands in ./.sessions there. Example 03
// sets that fence deliberately.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/01-hello
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

func main() {
	// Ctrl-C cancels the turn rather than leaving a request in flight to finish
	// and be billed.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	// Worth printing before anything else. The harness is a developer preview
	// whose session format is still version zero, so "which one is in here?" is
	// a question that will be asked of a bug report.
	version, commit := sdk.HarnessVersion()
	fmt.Printf("DeepSeek Harness %s (%s), embedded\n\n", version, commit[:12])

	h, err := sdk.Open(ctx, sdk.Config{
		// Everything else is optional: the key comes from DEEPSEEK_API_KEY and
		// the endpoint from DEEPSEEK_BASE_URL, both read by the SDK itself.
		Model: model(),
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx, sdk.Text(
		"In one sentence: what is a pure-Go JavaScript engine good for?"))
	if err != nil {
		// A transport failure, a protocol violation, or the Ctrl-C above. A turn
		// that the MODEL failed is not this — see 02.
		log.Fatal(err)
	}

	fmt.Println(result.FinalResponse)
	fmt.Printf("\n[%s in %v]\n",
		result.FinishReason, result.Duration.Round(time.Millisecond))
}

// model is the model id, which differs by endpoint: "deepseek-v4-flash" at
// DeepSeek itself, "deepseek/deepseek-v4-flash-0731" through OpenRouter.
func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
