// Command audit writes one JSONL record per tool call, from Go.
//
// What it proves two things at once.
//
// WRAP TO MEASURE, OBSERVE TO RECORD. The tool pipeline offers several places
// to stand, and upstream's own selection rule (docs/cookbook/adding-a-tool.md
// § Execution policy and observation) picks between them:
//
//   - tools/execute WRAPS the dispatch. It is the one hook whose lexical
//     lifetime spans the call, so it is the only place a duration can be
//     measured — start the clock, await next(), stop the clock.
//   - tools/result OBSERVES the frozen, authoritative outcome after the whole
//     pipeline has settled it. It cannot change anything, which is exactly why
//     it is the right place to write a record: what it sees is what happened.
//
// EFFECTS REVERT THEMSELVES. The log file is installed with ctx.Effect and the
// flush-and-close with ctx.OnDispose. Nothing in this program uninstalls
// either. h.Close() unmounts the component, cordis runs the effect inverses
// LIFO and then the Go teardown — so the example is its own demonstration, and
// the JSONL is complete on disk by the time Close returns.
//
// A NAMING TRAP worth stating, because upstream flags it explicitly
// (docs/user/develop/framework/events.md): `tools/result` — the cordis event
// listened to here — is NOT `tool/result`, the durable session-event type
// observed through session/event. Plural is the pipeline; singular is the log.
//
// Seam: tools/execute (waterfall), tools/result (emit), ctx.Effect,
// ctx.OnDispose, and Config.TraceHTTP for the request-level view.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/08-audit
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
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// record is one line of the audit log.
type record struct {
	At        string `json:"at"`
	Call      string `json:"callId"`
	Tool      string `json:"tool"`
	Arguments any    `json:"arguments,omitempty"`
	Failed    bool   `json:"failed"`
	Error     string `json:"error,omitempty"`
	// Absent for a call that never dispatched — a denial settles without ever
	// reaching tools/execute, and a fabricated zero would read as "instant".
	DurationMS *float64 `json:"durationMs,omitempty"`
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-audit-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)
	if err := os.WriteFile(filepath.Join(workdir, "inventory.txt"),
		[]byte("bolts 120\nnuts 310\nwashers 0\n"), 0o644); err != nil {
		log.Fatal(err)
	}

	auditPath := filepath.Join(workdir, "tool-calls.jsonl")

	// The teardown order, observed rather than assumed.
	var orderMu sync.Mutex
	var order []string
	note := func(what string) { orderMu.Lock(); order = append(order, what); orderMu.Unlock() }

	// The request-level view, beside the tool-level one. TraceHTTP answers the
	// question no log can: "is the stream stalled, or just slow?"
	var httpMu sync.Mutex
	httpSteps := map[string]int{}

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),
		CWD:   workdir,
		Roots: []string{workdir},
		Env:   map[string]string{"HOME": workdir},
		TraceHTTP: func(step string, id int64, detail string) {
			httpMu.Lock()
			httpSteps[step]++
			httpMu.Unlock()
		},
		Plugins: []sdk.Plugin{auditor(auditPath, note)},
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("--- the turn ---")
	result, err := h.Run(ctx, sdk.Text(
		"Read inventory.txt. Add a line for 'screws 45', keep it sorted alphabetically, "+
			"and then read the file back to confirm. Also try to read prices.txt, which "+
			"may not exist — say so if it does not."))
	if err != nil {
		h.Close()
		log.Fatal(err)
	}
	fmt.Println(result.FinalResponse)

	// Closing is what flushes the log. Nothing below asks it to.
	if err := h.Close(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("\n--- teardown, in the order it happened ---")
	orderMu.Lock()
	for i, what := range order {
		fmt.Printf("  %d. %s\n", i+1, what)
	}
	orderMu.Unlock()

	fmt.Println("\n--- the audit log, read back after Close ---")
	file, err := os.Open(auditPath)
	if err != nil {
		log.Fatalf("FAIL: no audit log after Close: %v", err)
	}
	defer file.Close()

	lines, calls := bufio.NewScanner(file), 0
	lines.Buffer(make([]byte, 0, 1<<20), 1<<24)
	for lines.Scan() {
		var entry record
		if err := json.Unmarshal(lines.Bytes(), &entry); err != nil {
			log.Fatalf("FAIL: the audit log is not JSONL: %v", err)
		}
		calls++
		took := "not dispatched"
		if entry.DurationMS != nil {
			took = fmt.Sprintf("%.1fms", *entry.DurationMS)
		}
		verdict := "ok"
		if entry.Failed {
			verdict = "FAILED: " + entry.Error
		}
		fmt.Printf("  %-19s %-14s %s\n", entry.Tool, took, verdict)
	}
	if err := lines.Err(); err != nil {
		log.Fatal(err)
	}

	httpMu.Lock()
	steps := fmt.Sprintf("%v", httpSteps)
	httpMu.Unlock()
	fmt.Printf("\n[%d tool calls recorded; http steps %s]\n", calls, steps)

	if calls == 0 {
		log.Fatal("FAIL: the audit log is empty")
	}
	if want := result.ToolCalls(); calls < want {
		log.Fatalf("FAIL: the turn made %d tool calls and the log holds %d", want, calls)
	}
}

// auditor is the component. It registers no tools; it watches the ones the
// harness already has.
func auditor(path string, note func(string)) sdk.Plugin {
	return sdk.Plugin{
		ID:     "auditor",
		Inject: []string{"tools"},
		Apply: func(ctx *sdk.Context) error {
			file, err := os.Create(path)
			if err != nil {
				return err
			}
			out := bufio.NewWriter(file)

			var mu sync.Mutex
			accepting := true
			started := map[string]time.Time{}

			// The effect's inverse runs SYNCHRONOUSLY on the goroutine that
			// owns the JavaScript world, interleaved correctly with the
			// inverses cordis tracked itself — which is what buys the ordering.
			// So it must not block and must not call back across the bridge:
			// it flips a flag, and the writing stops.
			if err := ctx.Effect(func() {
				mu.Lock()
				accepting = false
				mu.Unlock()
				note("effect inverse: stopped accepting records")
			}); err != nil {
				file.Close()
				return err
			}

			// Teardown that has to block belongs here instead: OnDispose runs
			// after every effect has been reverted, on a goroutine of its own.
			ctx.OnDispose(func() {
				mu.Lock()
				defer mu.Unlock()
				if err := out.Flush(); err != nil {
					note("dispose: flush failed: " + err.Error())
				}
				if err := file.Close(); err != nil {
					note("dispose: close failed: " + err.Error())
				}
				note("go teardown: flushed and closed " + filepath.Base(path))
			})

			// ---- wrap, to measure ------------------------------------------

			// tools/execute is a waterfall around the dispatch. Its lexical
			// lifetime spans the call, which is what makes a duration possible
			// here and impossible in an observer.
			if _, err := ctx.On("tools/execute", func(args []json.RawMessage) (any, error) {
				callID := callIDOf(args)

				mu.Lock()
				started[callID] = time.Now()
				mu.Unlock()

				next, err := ctx.Value(args[len(args)-1]).Object()
				if err != nil {
					return nil, err
				}
				outcome, err := next.Invoke()
				if err != nil {
					return nil, err
				}
				return json.RawMessage(outcome.JSON()), nil
			}); err != nil {
				return err
			}

			// ---- observe, to record ----------------------------------------

			// tools/result sees the frozen authoritative outcome. It cannot
			// change it — which is the reason to write the record here rather
			// than anywhere earlier, where the outcome could still move.
			_, err = ctx.On("tools/result", func(args []json.RawMessage) (any, error) {
				var exec struct {
					CallID    string `json:"callId"`
					Name      string `json:"name"`
					Arguments any    `json:"arguments"`
				}
				var outcome struct {
					IsError bool `json:"isError"`
					Error   struct {
						Message string `json:"message"`
					} `json:"error"`
				}
				if len(args) > 0 {
					_ = json.Unmarshal(args[0], &exec)
				}
				if len(args) > 1 {
					_ = json.Unmarshal(args[1], &outcome)
				}

				entry := record{
					At:        time.Now().UTC().Format(time.RFC3339Nano),
					Call:      exec.CallID,
					Tool:      exec.Name,
					Arguments: exec.Arguments,
					Failed:    outcome.IsError,
					Error:     outcome.Error.Message,
				}

				mu.Lock()
				defer mu.Unlock()
				if !accepting {
					return nil, nil
				}
				if at, ok := started[exec.CallID]; ok {
					ms := float64(time.Since(at).Microseconds()) / 1000
					entry.DurationMS = &ms
					delete(started, exec.CallID)
				}
				line, err := json.Marshal(entry)
				if err != nil {
					return nil, err
				}
				out.Write(line)
				out.WriteByte('\n')
				return nil, nil
			})
			return err
		},
	}
}

// callIDOf reads the call identity out of a pipeline argument.
func callIDOf(args []json.RawMessage) string {
	if len(args) == 0 {
		return ""
	}
	var exec struct {
		CallID string `json:"callId"`
	}
	if json.Unmarshal(args[0], &exec) != nil {
		return ""
	}
	return exec.CallID
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
