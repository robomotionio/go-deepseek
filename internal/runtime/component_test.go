package runtime_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	dsh "github.com/robomotionio/go-deepseek/internal/runtime"
)

// A Go plugin is a cordis component, and these are the things that makes true
// which registering a tool does not: it declares what it needs and is refused
// what it did not declare, it can become a provider others depend on, its
// effects are reverted when it unmounts, and it can reach anything on its
// context by name.

// Inject: the component declares a service, and reads it. The filesystem seam
// answers with a live target object that has to survive the round trip back
// into a second call — a copy of its fields would not do.
func TestComponentInjectsAService(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "note.txt"), []byte("from the fs seam"), 0o644); err != nil {
		t.Fatal(err)
	}

	read := make(chan string, 1)
	fail := make(chan error, 1)
	h := startPlugins(t, dir, dsh.Plugin{
		ID:     "reader",
		Inject: []string{"fs"},
		Apply: func(ctx *dsh.Context) error {
			fs, err := ctx.Service("fs")
			if err != nil {
				fail <- err
				return err
			}
			// resolve answers with a target the seam understands; holding it is
			// what lets the second call name the same one.
			target, err := fs.CallForObject("resolve", filepath.Join(dir, "note.txt"))
			if err != nil {
				fail <- err
				return err
			}
			text, err := fs.Call("readText", target)
			if err != nil {
				fail <- err
				return err
			}
			read <- text.String()
			return nil
		},
	})
	defer h.Close()

	select {
	case err := <-fail:
		t.Fatalf("the component could not use the seam: %v", err)
	case text := <-read:
		if text != "from the fs seam" {
			t.Fatalf("read %q", text)
		}
	case <-time.After(30 * time.Second):
		t.Fatal("the component never read the file")
	}
}

// The coeffect specification is enforced, not advisory: a service the component
// did not declare is refused by the context itself.
func TestUndeclaredServiceIsRefused(t *testing.T) {
	refused := make(chan error, 1)
	h := startPlugins(t, t.TempDir(), dsh.Plugin{
		ID: "peeker",
		// No Inject at all.
		Apply: func(ctx *dsh.Context) error {
			_, err := ctx.Service("fs")
			refused <- err
			return nil
		},
	})
	defer h.Close()

	select {
	case err := <-refused:
		if err == nil {
			t.Fatal("an undeclared service resolved")
		}
		t.Logf("refused: %v", err)
	case <-time.After(30 * time.Second):
		t.Fatal("the component never ran")
	}
}

// A component whose declared service has no provider stays unmounted, and says
// so rather than failing: it is waiting, and would activate if one appeared.
func TestUnsatisfiedComponentStaysUnmounted(t *testing.T) {
	var mounted bool
	var mu sync.Mutex
	h := startPlugins(t, t.TempDir(), dsh.Plugin{
		ID:     "waiting",
		Inject: []string{"nothingProvidesThis"},
		Apply: func(ctx *dsh.Context) error {
			mu.Lock()
			mounted = true
			mu.Unlock()
			return nil
		},
	})
	defer h.Close()

	mu.Lock()
	defer mu.Unlock()
	if mounted {
		t.Fatal("a component mounted without its declared dependency")
	}
}

// Provide: one Go component becomes a service, and another injects it. This is
// the dependency topology the paradigm exists for, with both ends in Go.
func TestComponentProvidesAService(t *testing.T) {
	answered := make(chan string, 1)
	fail := make(chan error, 2)

	provider := dsh.Plugin{
		ID:      "greeter",
		Provide: []string{"greeting"},
		Apply: func(ctx *dsh.Context) error {
			return ctx.Provide("greeting", map[string]any{
				"greet": ctx.Func(func(args []json.RawMessage) (any, error) {
					var name string
					if len(args) > 0 {
						_ = json.Unmarshal(args[0], &name)
					}
					return "hello " + name + ", from Go", nil
				}),
			})
		},
	}
	consumer := dsh.Plugin{
		ID:     "greeted",
		Inject: []string{"greeting"},
		Apply: func(ctx *dsh.Context) error {
			greeting, err := ctx.Service("greeting")
			if err != nil {
				fail <- err
				return err
			}
			said, err := greeting.Call("greet", "world")
			if err != nil {
				fail <- err
				return err
			}
			answered <- said.String()
			return nil
		},
	}

	h := startPlugins(t, t.TempDir(), provider, consumer)
	defer h.Close()

	select {
	case err := <-fail:
		t.Fatalf("the consumer could not reach the provided service: %v", err)
	case said := <-answered:
		if said != "hello world, from Go" {
			t.Fatalf("got %q", said)
		}
	case <-time.After(30 * time.Second):
		t.Fatal("the consumer never ran: the Go-provided service never satisfied it")
	}
}

// Temporal composability: what the component installed is withdrawn when it
// unmounts, in reverse order, without the author writing an uninstall path
// beyond naming the inverse.
func TestComponentEffectsAreReverted(t *testing.T) {
	var mu sync.Mutex
	var order []string
	record := func(what string) { mu.Lock(); order = append(order, what); mu.Unlock() }

	h := startPlugins(t, t.TempDir(), dsh.Plugin{
		ID: "reverting",
		Apply: func(ctx *dsh.Context) error {
			if err := ctx.Effect(func() { record("first effect") }); err != nil {
				return err
			}
			if err := ctx.Effect(func() { record("second effect") }); err != nil {
				return err
			}
			ctx.OnDispose(func() { record("go disposer") })
			return nil
		},
	})
	if err := h.Close(); err != nil {
		t.Fatal(err)
	}

	mu.Lock()
	defer mu.Unlock()
	if len(order) != 3 {
		t.Fatalf("not everything was reverted: %v", order)
	}
	// Cordis recovers effects LIFO, and the Go disposers run the same way.
	if order[0] != "second effect" || order[1] != "first effect" {
		t.Errorf("effects were not reverted in reverse order: %v", order)
	}
	t.Logf("reverted: %v", order)
}

// Events: the component subscribes and announces, both from Go.
func TestComponentListensAndEmits(t *testing.T) {
	heard := make(chan string, 1)
	h := startPlugins(t, t.TempDir(), dsh.Plugin{
		ID: "listener",
		Apply: func(ctx *dsh.Context) error {
			if _, err := ctx.On("go/ping", func(args []json.RawMessage) (any, error) {
				var payload string
				if len(args) > 0 {
					_ = json.Unmarshal(args[0], &payload)
				}
				heard <- payload
				return nil, nil
			}); err != nil {
				return err
			}
			return ctx.Emit("go/ping", "round trip")
		},
	})
	defer h.Close()

	select {
	case payload := <-heard:
		if payload != "round trip" {
			t.Fatalf("heard %q", payload)
		}
	case <-time.After(30 * time.Second):
		t.Fatal("the listener never fired")
	}
}

// A Go component can wrap every tool call the agent makes, which is the seam
// an approval policy, an audit log or a rate limiter lives on. Registering it
// is what this proves; TestLiveComponentSeesToolCalls drives one for real.
func TestComponentWrapsToolCalls(t *testing.T) {
	installed := make(chan error, 1)
	h := startPlugins(t, t.TempDir(), dsh.Plugin{
		ID:     "auditor",
		Inject: []string{"tools"},
		Apply: func(ctx *dsh.Context) error {
			_, err := ctx.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
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
			installed <- err
			return err
		},
	})
	defer h.Close()

	select {
	case err := <-installed:
		if err != nil {
			t.Fatalf("could not wrap the tool pipeline: %v", err)
		}
	case <-time.After(30 * time.Second):
		t.Fatal("the component never ran")
	}
}

// startPlugins boots a harness with the given Go components.
func startPlugins(t *testing.T, dir string, plugins ...dsh.Plugin) dsh.Harness {
	t.Helper()
	h, err := dsh.New(dsh.Config{
		CWD:      dir,
		Model:    "deepseek-v4-flash",
		Provider: "deepseek-official",
		Plugins:  plugins,
		Env:      map[string]string{"DEEPSEEK_API_KEY": "sk-not-used-for-boot", "HOME": dir},
		Stderr:   func(p []byte) { t.Log("err: " + strings.TrimRight(string(p), "\n")) },
	})
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	return h
}
