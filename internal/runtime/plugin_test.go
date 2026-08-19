package runtime_test

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"testing"
	"time"

	dsh "github.com/robomotionio/go-deepseek/internal/runtime"
)

// A Go plugin is a real plugin: the loader mounts it, and the tool it registers
// is in the registry the model is shown. That is what this proves without a
// model in the picture — the parts that break are the generated module's syntax,
// the tool schema the harness validates, and the cordis injection.
func TestGoPluginRegistersItsTools(t *testing.T) {
	dir := t.TempDir()
	h := start(t, dir, dsh.Plugin{
		ID: "inventory",
		Tools: []dsh.Tool{{
			Name:        "stock_level",
			Description: "How many units of a part are in stock.",
			Parameters: map[string]any{
				"sku": map[string]any{
					"type":        "string",
					"required":    true,
					"description": "The part number.",
				},
			},
			Execute: func(context.Context, json.RawMessage) (string, error) { return "0", nil },
		}},
	})

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	tools, err := h.Tools(ctx)
	if err != nil {
		t.Fatalf("tools: %v", err)
	}
	var found *dsh.ToolSchema
	names := make([]string, 0, len(tools))
	for i := range tools {
		names = append(names, tools[i].Name)
		if tools[i].Name == "stock_level" {
			found = &tools[i]
		}
	}
	if found == nil {
		t.Fatalf("stock_level is not registered; the agent has %v", names)
	}
	if found.Description != "How many units of a part are in stock." {
		t.Errorf("description did not survive: %q", found.Description)
	}
	// The harness compiles the parameter spec into JSON Schema, so this also
	// says the spec was one it understood.
	if !strings.Contains(string(found.Parameters), `"sku"`) {
		t.Errorf("parameters lost the sku property: %s", found.Parameters)
	}
	t.Logf("the agent has %d tools: %v", len(tools), names)
}

// A composition is checked before anything mounts, because a mistake found at
// mount time has already half-built the tree.
func TestGoPluginValidation(t *testing.T) {
	cases := []struct {
		name   string
		plugin dsh.Plugin
		want   string
	}{
		{"no id", dsh.Plugin{Tools: []dsh.Tool{ok()}}, "no ID"},
		{"contributes nothing", dsh.Plugin{ID: "empty"}, "neither Tools nor Apply"},
		{"no description", dsh.Plugin{ID: "p", Tools: []dsh.Tool{{Name: "t", Execute: ok().Execute}}}, "no description"},
		{"no execute", dsh.Plugin{ID: "p", Tools: []dsh.Tool{{Name: "t", Description: "d"}}}, "no Execute"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			_, err := dsh.New(dsh.Config{CWD: t.TempDir(), Plugins: []dsh.Plugin{c.plugin}})
			if err == nil {
				t.Fatalf("accepted %+v", c.plugin)
			}
			if !strings.Contains(err.Error(), c.want) {
				t.Errorf("error does not say %q: %v", c.want, err)
			}
		})
	}

	t.Run("colliding tool names", func(t *testing.T) {
		_, err := dsh.New(dsh.Config{CWD: t.TempDir(), Plugins: []dsh.Plugin{
			{ID: "one", Tools: []dsh.Tool{ok()}},
			{ID: "two", Tools: []dsh.Tool{ok()}},
		}})
		if err == nil || !strings.Contains(err.Error(), "registered by both") {
			t.Fatalf("want a collision error, got %v", err)
		}
	})

	t.Run("id already used by an entry", func(t *testing.T) {
		_, err := dsh.New(dsh.Config{CWD: t.TempDir(), Plugins: []dsh.Plugin{
			{ID: "tool-todo", Tools: []dsh.Tool{ok()}},
		}})
		if err == nil || !strings.Contains(err.Error(), "collides") {
			t.Fatalf("want a collision error, got %v", err)
		}
	})
}

func ok() dsh.Tool {
	return dsh.Tool{
		Name:        "noop",
		Description: "Does nothing.",
		Execute:     func(context.Context, json.RawMessage) (string, error) { return "", nil },
	}
}

// start boots a harness with the given plugins and fails the test if it cannot.
func start(t *testing.T, dir string, plugins ...dsh.Plugin) dsh.Harness {
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
	t.Cleanup(func() { h.Close() })
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	return h
}

// The live proof: a model calls a tool whose body is Go, and the answer it gets
// back is the one the Go function produced. Key-gated, like the other live test.
func TestLiveGoTool(t *testing.T) {
	key := os.Getenv("DEEPSEEK_API_KEY")
	if key == "" {
		t.Skip("set DEEPSEEK_API_KEY to run the live Go-tool turn")
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}

	// The tool answers something no model could know or guess, so a passing
	// assertion cannot be the model being agreeable.
	called := make(chan string, 4)
	dir := t.TempDir()
	h, err := dsh.New(dsh.Config{
		CWD:      dir,
		Model:    model,
		BaseURL:  os.Getenv("DEEPSEEK_BASE_URL"),
		Provider: "deepseek-official",
		Env:      map[string]string{"DEEPSEEK_API_KEY": key, "HOME": dir},
		Plugins: []dsh.Plugin{{
			ID: "inventory",
			Tools: []dsh.Tool{{
				Name:        "stock_level",
				Description: "The number of units of a part that are in stock. The ONLY way to know a stock level.",
				Parameters: map[string]any{
					"sku": map[string]any{"type": "string", "required": true, "description": "The part number."},
				},
				Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
					var in struct {
						SKU string `json:"sku"`
					}
					if err := json.Unmarshal(args, &in); err != nil {
						return "", err
					}
					called <- in.SKU
					if in.SKU != "RM-77" {
						return "", errors.New("no such part")
					}
					// Work that takes real time on a real goroutine: this is the
					// part that would deadlock a single-threaded engine if the
					// call were not asynchronous.
					select {
					case <-time.After(750 * time.Millisecond):
					case <-ctx.Done():
						return "", ctx.Err()
					}
					return "1493 units", nil
				},
			}},
		}},
		Stderr: func(p []byte) { t.Log("err: " + strings.TrimRight(string(p), "\n")) },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	go func() {
		for range h.Events() {
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}

	started := time.Now()
	result, err := h.Run(ctx, "go-tool", dsh.Text(
		"How many units of part RM-77 are in stock? Answer with the number only."))
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	t.Logf("%v, finish=%q, said %q", result.Duration, result.FinishReason, result.Text)

	select {
	case sku := <-called:
		t.Logf("the Go tool was called with sku=%q", sku)
	default:
		t.Fatal("the model never called the Go tool")
	}
	if !strings.Contains(result.Text, "1493") {
		t.Errorf("the answer does not carry what the Go tool returned: %q", result.Text)
	}
	if time.Since(started) < 750*time.Millisecond {
		t.Error("the turn finished before the tool could have")
	}
}
