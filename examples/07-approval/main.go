// Command approval puts a human in the tool pipeline.
//
// What it proves: a Go handler on tools/pre-execute MAY BLOCK. Context.Func
// registers the handler as a Go callback that runs on its own goroutine and
// answers the JavaScript world with a promise, so waiting on stdin — or on an
// HTTP round trip to a reviewer, or on a Slack button — stops that one tool
// call and nothing else. The harness's timers keep firing, other sessions keep
// running, the process stays responsive.
//
// That is the practical difference between running the harness IN your process
// and driving one over a pipe: the human gate is a function call, not a
// protocol.
//
// Seam: tools/pre-execute — the same waterfall as 06, used differently.
//
// WHY NOT ctx.approval. The harness has a dedicated approval seam, and
// {kind:"ask"} in a pre-execute decision routes to it. It is deliberately NOT
// used here: no approval provider is in this bundle, and the seam FAILS CLOSED —
// a missing, non-owning, throwing or non-conforming answerer becomes
// `unavailable`, which denies rather than opens the gate. So {kind:"ask"} here
// would be an unconditional no. Gating inside the handler is the honest way to
// do it with what is bundled. See docs/capability-seams.md and
// docs/subsystems/approval.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/07-approval              # answer y/n yourself
//	printf 'n\ny\n' | go run ./examples/07-approval   # or feed the answers
//
// When stdin runs out, the gate falls back to DSH_APPROVE (y/n, default n) so
// the example still finishes unattended.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// The calls a human is asked about. Reads go through unchallenged, which is the
// point of a gate: it is for the things that change something.
var mutating = map[string]bool{"write": true, "edit": true, "str_replace_editor": true}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-approval-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	gate := newGate(os.Stdin, os.Stdout)

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),
		CWD:   workdir,
		Roots: []string{workdir},
		Env:   map[string]string{"HOME": workdir},
		Plugins: []sdk.Plugin{{
			ID:     "approval",
			Inject: []string{"tools"},
			Apply: func(pc *sdk.Context) error {
				_, err := pc.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
					name, path, preview := callOf(workdir, args)

					if mutating[name] {
						// THE BLOCKING PART. This runs on a goroutine of its
						// own; the JavaScript world is not waiting on this
						// thread, it is waiting on a promise.
						if ok, reason := gate.ask(name, path, preview); !ok {
							return map[string]any{"kind": "deny", "reason": reason}, nil
						}
					}

					next, err := pc.Value(args[len(args)-1]).Object()
					if err != nil {
						return nil, err
					}
					decision, err := next.Invoke()
					if err != nil {
						return nil, err
					}
					return json.RawMessage(decision.JSON()), nil
				})
				return err
			},
		}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx, sdk.Text(
		"Create two files: notes.txt containing the single line 'first', and "+
			"summary.md containing the single line 'second'. "+
			"Then tell me which of the two you managed to create."))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("\n--- the agent ---\n%s\n", result.FinalResponse)

	fmt.Println("\n--- what the human decided ---")
	for _, decision := range gate.log() {
		fmt.Println(" ", decision)
	}

	fmt.Println("\n--- the workspace afterwards ---")
	entries, err := os.ReadDir(workdir)
	if err != nil {
		log.Fatal(err)
	}
	if len(entries) == 0 {
		fmt.Println("  (empty — every write was refused)")
	}
	for _, entry := range entries {
		fmt.Println(" ", entry.Name())
	}

	waited, asked := gate.stats()
	fmt.Printf("\n[%d calls put to a human, %v spent waiting for one]\n",
		asked, waited.Round(time.Millisecond))
	if asked == 0 {
		log.Fatal("FAIL: nothing was ever put to the human")
	}
}

// gate is the human. It serialises its prompts, because tool calls may run in
// parallel and two questions interleaved on one terminal is not a question.
type gate struct {
	mu        sync.Mutex
	in        *bufio.Reader
	out       io.Writer
	decided   []string
	asked     int
	waited    time.Duration
	exhausted bool
}

func newGate(in io.Reader, out io.Writer) *gate {
	return &gate{in: bufio.NewReader(in), out: out}
}

// ask blocks until the human answers, and answers itself when nobody is there.
func (g *gate) ask(name, path, preview string) (bool, string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	started := time.Now()
	g.asked++

	fmt.Fprintf(g.out, "\n┌─ the agent wants to %s %s\n", name, path)
	for _, line := range strings.Split(preview, "\n") {
		fmt.Fprintf(g.out, "│  %s\n", line)
	}
	fmt.Fprint(g.out, "└─ allow? [y/N] ")

	answer := ""
	if !g.exhausted {
		line, err := g.in.ReadString('\n')
		if err != nil && line == "" {
			// Nobody is there. Fall back so the example still finishes.
			g.exhausted = true
		} else {
			answer = strings.TrimSpace(strings.ToLower(line))
		}
	}
	if g.exhausted {
		answer = strings.ToLower(strings.TrimSpace(os.Getenv("DSH_APPROVE")))
		if answer == "" {
			answer = "n"
		}
		fmt.Fprintf(g.out, "%s (no one at the keyboard; DSH_APPROVE)\n", answer)
	} else {
		fmt.Fprintln(g.out)
	}
	g.waited += time.Since(started)

	allowed := answer == "y" || answer == "yes"
	verdict := "DENIED  by a human"
	reason := "a human reviewed this call and declined it"
	if allowed {
		verdict, reason = "allowed by a human", ""
	}
	g.decided = append(g.decided, fmt.Sprintf("%-19s %-14s %s", name, path, verdict))
	return allowed, reason
}

func (g *gate) log() []string {
	g.mu.Lock()
	defer g.mu.Unlock()
	return append([]string(nil), g.decided...)
}

func (g *gate) stats() (time.Duration, int) {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.waited, g.asked
}

// callOf reads the name, the path and a short preview of what would be written
// out of the pending execution. Showing the human the CONTENT is what makes the
// gate meaningful — approving a name is approving nothing.
func callOf(workdir string, args []json.RawMessage) (name, path, preview string) {
	if len(args) == 0 {
		return "", "", ""
	}
	var exec struct {
		Name      string `json:"name"`
		Arguments struct {
			FilePath  string `json:"file_path"`
			Path      string `json:"path"`
			Content   string `json:"content"`
			FileText  string `json:"file_text"`
			NewString string `json:"new_string"`
			OldString string `json:"old_string"`
			Command   string `json:"command"`
		} `json:"arguments"`
	}
	if json.Unmarshal(args[0], &exec) != nil {
		return "", "", ""
	}
	path = first(exec.Arguments.FilePath, exec.Arguments.Path)
	if rel, err := filepath.Rel(workdir, path); err == nil && !strings.HasPrefix(rel, "..") {
		path = rel
	}
	preview = first(exec.Arguments.Content, exec.Arguments.FileText,
		exec.Arguments.NewString, exec.Arguments.Command, "(no content in this call)")
	return exec.Name, path, truncate(preview)
}

func first(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func truncate(s string) string {
	s = strings.TrimRight(s, "\n")
	lines := strings.Split(s, "\n")
	if len(lines) > 6 {
		lines = append(lines[:6], fmt.Sprintf("… %d more lines", len(lines)-6))
	}
	for i, line := range lines {
		if len(line) > 72 {
			lines[i] = line[:71] + "…"
		}
	}
	return strings.Join(lines, "\n")
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
