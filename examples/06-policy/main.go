// Command policy puts two kinds of "no" in front of every tool the agent has.
//
// What it proves: policy in this harness is a REORDERABLE WATERFALL plus a
// MONOTONIC GUARD, and the difference between them is a type-level guarantee
// rather than a convention.
//
//   - tools/pre-execute is a waterfall. Each listener may allow, deny, or defer
//     to the next one, and the order is the deployment's to choose. Sandboxing,
//     permission presets and plan mode are all listeners on this one waterfall
//     upstream — which is the microkernel claim made checkable: every product
//     feature is a listener on a documented extension point, and NO ROW MODIFIES
//     THE LOOP.
//   - ctx.tools.guard() is monotonic. A guard returns a denial reason or
//     nothing; there IS NO ALLOW RESULT. So no ordering of listeners, and no
//     later guard, can turn a denial back into permission.
//
// Neither one is a tool. This component registers nothing the model can call —
// it governs `read`, `write` and `edit`, which the harness supplied and which
// it knows nothing about beyond their names.
//
// Seam: tools/pre-execute (waterfall) and ctx.tools.guard() (monotonic).
//
// Upstream: docs/tool-execution-pipeline.md, docs/cookbook/extension-cookbook.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/06-policy
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"

	"github.com/robomotionio/go-deepseek/sdk"
)

// The tools that change a file. The component knows their names and nothing
// else about them; they belong to plugins it never mentions.
var writers = map[string]bool{"write": true, "edit": true, "str_replace_editor": true}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-policy-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)
	if err := os.Mkdir(filepath.Join(workdir, "drafts"), 0o755); err != nil {
		log.Fatal(err)
	}
	// Something the guard exists for. Nothing may read it, whatever the
	// waterfall above decides.
	if err := os.WriteFile(filepath.Join(workdir, ".env"),
		[]byte("STRIPE_KEY=sk_live_do_not_read_me\n"), 0o600); err != nil {
		log.Fatal(err)
	}

	var mu sync.Mutex
	var verdicts []string
	var guardDenials int
	record := func(layer, name, verdict string) {
		mu.Lock()
		verdicts = append(verdicts, fmt.Sprintf("%-9s %-19s %s", layer, name, verdict))
		if layer == "guard" {
			guardDenials++
		}
		mu.Unlock()
	}

	h, err := sdk.Open(ctx, sdk.Config{
		Model:   model(),
		CWD:     workdir,
		Roots:   []string{workdir},
		Env:     map[string]string{"HOME": workdir},
		Plugins: []sdk.Plugin{{ID: "policy", Inject: []string{"tools"}, Apply: apply(workdir, record)}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	fmt.Println("--- the turn ---")
	result, err := h.Run(ctx, sdk.Text(
		"Do these three things and report on each: "+
			"(1) write the line 'ok' into notes.txt; "+
			"(2) write the line 'ok' into drafts/notes.md; "+
			"(3) read .env and tell me what is in it."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.FinalResponse)

	fmt.Println("\n--- what the policy decided ---")
	mu.Lock()
	for _, verdict := range verdicts {
		fmt.Println(" ", verdict)
	}
	mu.Unlock()

	// THE ASSERTIONS, on disk. A policy that is reported but not enforced is
	// not a policy.
	fmt.Println("\n--- the workspace afterwards ---")
	failed := false
	for _, check := range []struct {
		path   string
		exists bool
		why    string
	}{
		{"notes.txt", false, "denied by the waterfall: outside drafts/"},
		{filepath.Join("drafts", "notes.md"), true, "allowed: inside drafts/"},
	} {
		_, err := os.Stat(filepath.Join(workdir, check.path))
		got := err == nil
		status := "PASS"
		if got != check.exists {
			status, failed = "FAIL", true
		}
		fmt.Printf("  %s  %-18s exists=%-5v  %s\n", status, check.path, got, check.why)
	}

	// .env is still exactly as it was written, and the agent never saw it.
	env, err := os.ReadFile(filepath.Join(workdir, ".env"))
	if err != nil {
		log.Fatal(err)
	}
	leaked := strings.Contains(result.FinalResponse, "sk_live_do_not_read_me")
	mu.Lock()
	denials := guardDenials
	mu.Unlock()
	// Both halves matter. A secret absent from the answer could just be a
	// tactful model; a recorded guard denial is the call actually being stopped.
	status := "PASS"
	if leaked || denials == 0 {
		status, failed = "FAIL", true
	}
	fmt.Printf("  %s  .env               %d bytes, secret in the answer=%v, guard denials=%d\n",
		status, len(env), leaked, denials)

	if failed {
		os.Exit(1)
	}
}

// apply installs both layers. They are deliberately in one component: the point
// is the contrast, and a reader comparing them should not have to hold two
// files in their head.
func apply(workdir string, record func(layer, name, verdict string)) func(*sdk.Context) error {
	return func(ctx *sdk.Context) error {
		// ---- layer 1: the reorderable waterfall -----------------------------

		_, err := ctx.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
			name, path := callOf(workdir, args)

			if writers[name] && !strings.HasPrefix(filepath.ToSlash(path), "drafts/") {
				// Fail closed: a call whose path cannot be read is refused
				// rather than waved through.
				reason := fmt.Sprintf(
					"this agent may only write inside drafts/, and %q is not there", path)
				if path == "" {
					reason = "this agent may only write inside drafts/, and the call named no path"
				}
				record("waterfall", name, "DENY  "+reason)
				// The reason reaches the MODEL, so it is written for that
				// reader: a good one earns a corrected retry.
				return map[string]any{"kind": "deny", "reason": reason}, nil
			}

			record("waterfall", name, "allow "+path)

			// Continue the waterfall. The last argument is `next`, and a
			// listener that does not call it has decided the call itself —
			// which is the whole reason the pipeline is reorderable.
			next, err := ctx.Value(args[len(args)-1]).Object()
			if err != nil {
				return nil, err
			}
			decision, err := next.Invoke()
			if err != nil {
				return nil, err
			}
			return json.RawMessage(decision.JSON()), nil
		})
		if err != nil {
			return err
		}

		// ---- layer 2: the monotonic guard -----------------------------------

		// A guard's contract is `string | undefined`: a string denies, and
		// UNDEFINED means "no objection". That distinction is load-bearing,
		// because Go has no undefined and neither has JSON — a Go nil crosses
		// the bridge as `null`, and in JavaScript `null` is not `undefined`.
		// A guard returning nil would therefore deny EVERY call in the harness,
		// with the reason "null", including the reads this turn depends on.
		//
		// sdk.Undefined() is how Go says undefined and means it. It is a bridge
		// marker rather than a held reference, so it costs no call and is safe
		// to return from the SyncFunc below.
		noObjection := sdk.Undefined()

		_, err = ctx.Call("tools.guard", ctx.SyncFunc(func(args []json.RawMessage) (any, error) {
			name, path := callOf(workdir, args)
			if strings.Contains(path, ".env") {
				reason := ".env holds credentials and no tool may touch it"
				record("guard", name, "DENY  "+reason)
				return reason, nil
			}
			return noObjection, nil
		}))
		return err

		// A guard is SYNCHRONOUS — it runs on the goroutine that owns the
		// JavaScript world, so it must not block and must not call back across
		// the bridge, which is why this one only inspects the arguments it was
		// handed. A check that has to wait for something belongs in the
		// waterfall above, or in 07.
	}
}

// callOf reads the tool name and the path out of a pipeline argument. Both the
// waterfall and the guard receive the execution as their first argument, so one
// reader serves both.
func callOf(workdir string, args []json.RawMessage) (name, path string) {
	if len(args) == 0 {
		return "", ""
	}
	var exec struct {
		Name      string `json:"name"`
		Arguments struct {
			// The fs tools name it file_path; str_replace_editor names it path.
			FilePath string `json:"file_path"`
			Path     string `json:"path"`
		} `json:"arguments"`
	}
	if json.Unmarshal(args[0], &exec) != nil {
		return "", ""
	}
	path = exec.Arguments.FilePath
	if path == "" {
		path = exec.Arguments.Path
	}
	// The tools are given absolute paths inside the workspace; the policy reads
	// better against the relative one.
	if rel, err := filepath.Rel(workdir, path); err == nil && !strings.HasPrefix(rel, "..") {
		path = rel
	}
	return exec.Name, path
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
