package sdk_test

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// A Go plugin reaches the harness through the front door and its tool is in the
// registry the model is shown.
func TestGoPluginThroughTheSDK(t *testing.T) {
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{
		CWD: dir,
		Env: map[string]string{"HOME": dir, "DEEPSEEK_API_KEY": "sk-not-used-for-boot"},
		Plugins: []sdk.Plugin{{
			ID: "inventory",
			Tools: []sdk.Tool{{
				Name:        "stock_level",
				Description: "The number of units of a part that are in stock.",
				Parameters: map[string]any{
					"sku": map[string]any{"type": "string", "required": true, "description": "The part number."},
				},
				Execute: func(context.Context, json.RawMessage) (string, error) { return "0", nil },
			}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	tools, err := h.Tools(ctx)
	if err != nil {
		t.Fatal(err)
	}
	names := make([]string, len(tools))
	for i, tool := range tools {
		names[i] = tool.Name
	}
	if !contains(names, "stock_level") {
		t.Fatalf("stock_level is missing; the agent has %v", names)
	}
	// It is registered ALONGSIDE the harness's own, not instead of them.
	if !contains(names, "read") {
		t.Errorf("the harness's own tools are gone: %v", names)
	}
}

// A prebuilt runtime is a different program, so it cannot run a Go function in
// this one. Saying so at Open beats a harness that starts and then cannot call
// the tools it was configured with.
func TestGoPluginsNeedTheInProcessCarrier(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_, err := sdk.Open(ctx, sdk.Config{
		CWD: t.TempDir(),
		Plugins: []sdk.Plugin{{
			ID:    "inventory",
			Tools: []sdk.Tool{{Name: "t", Description: "d", Execute: func(context.Context, json.RawMessage) (string, error) { return "", nil }}},
		}},
	}, sdk.WithRuntimeBinary("/nonexistent/dsh-jsonrpc-agent"))
	if err == nil {
		t.Fatal("a subprocess runtime accepted Go plugins")
	}
	if !strings.Contains(err.Error(), "in process") {
		t.Errorf("the error does not explain why: %v", err)
	}
}

// The live proof, through the SDK: the model calls a Go function and answers
// with what that function returned. It answers something no model could know,
// so a pass cannot be the model being agreeable.
func TestLiveGoPlugin(t *testing.T) {
	key := os.Getenv("OPENROUTER_API_KEY")
	if key == "" {
		t.Skip("set OPENROUTER_API_KEY to run the live Go-plugin turn")
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	var calls atomic.Int64
	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL: "https://openrouter.ai/api/v1",
		APIKey:  key,
		Model:   "deepseek/deepseek-v4-flash-0731",
		CWD:     dir,
		Env:     map[string]string{"HOME": dir},
		Plugins: []sdk.Plugin{{
			ID: "inventory",
			Tools: []sdk.Tool{{
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
					if in.SKU != "RM-77" {
						return "", errors.New("no such part")
					}
					calls.Add(1)
					return "1493 units", nil
				},
			}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx, sdk.Text("How many units of part RM-77 are in stock? Answer with the number only."))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%v, finish=%q, said %q", result.Duration, result.FinishReason, result.FinalResponse)
	if calls.Load() == 0 {
		t.Fatal("the model never called the Go tool")
	}
	if !strings.Contains(result.FinalResponse, "1493") {
		t.Errorf("the answer does not carry what the Go tool returned: %q", result.FinalResponse)
	}
}

func contains(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}

// The live proof that a Go component is more than a tool: this one wraps the
// tool pipeline, so it observes every call the model makes — including the
// harness's own tools, which it never registered and knows nothing about.
func TestLiveComponentSeesToolCalls(t *testing.T) {
	key := os.Getenv("OPENROUTER_API_KEY")
	if key == "" {
		t.Skip("set OPENROUTER_API_KEY to run the live component turn")
	}
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "note.txt"), []byte("the answer is plum\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	var mu sync.Mutex
	var observed []string

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL: "https://openrouter.ai/api/v1",
		APIKey:  key,
		Model:   "deepseek/deepseek-v4-flash-0731",
		CWD:     dir,
		Env:     map[string]string{"HOME": dir},
		Plugins: []sdk.Plugin{{
			ID:     "auditor",
			Inject: []string{"tools"},
			Apply: func(pc *sdk.Context) error {
				_, err := pc.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
					var execution struct {
						Name string `json:"name"`
					}
					if len(args) > 0 {
						_ = json.Unmarshal(args[0], &execution)
					}
					mu.Lock()
					observed = append(observed, execution.Name)
					mu.Unlock()
					// Continue the waterfall: the last argument is `next`, and a
					// listener that does not call it has denied the call.
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
		t.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx, sdk.Text("Read note.txt and tell me the answer."))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%v, finish=%q, said %q", result.Duration, result.FinishReason, result.FinalResponse)

	mu.Lock()
	defer mu.Unlock()
	if len(observed) == 0 {
		t.Fatal("the Go component saw no tool calls")
	}
	t.Logf("the Go component observed: %v", observed)
	if !strings.Contains(strings.ToLower(result.FinalResponse), "plum") {
		t.Errorf("the turn did not read the file: %q", result.FinalResponse)
	}
}
