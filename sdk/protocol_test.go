package sdk_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// modelRoute returns the model row and the part of it that carries the
// endpoint, the catalog and the retry budget: the row's own config on the
// Messages plugin, the one route under `providers` on the chat-completions one.
func modelRoute(t *testing.T, entries []sdk.Entry) (sdk.Entry, map[string]any) {
	t.Helper()
	for _, entry := range entries {
		if entry.ID != sdk.ModelRowID {
			continue
		}
		providers, served := entry.Config["providers"].(map[string]any)
		if !served {
			return entry, entry.Config
		}
		if len(providers) != 1 {
			t.Fatalf("the model row serves %d routes, want 1: %#v", len(providers), providers)
		}
		for _, route := range providers {
			return entry, route.(map[string]any)
		}
	}
	t.Fatalf("the composition has no %q entry", sdk.ModelRowID)
	return sdk.Entry{}, nil
}

// The wire protocol is pinned, not inherited — and since harness 0.1.7 it
// picks the plugin rather than a key on one.
//
// Upstream's default became "messages" in 0.1.5, which resolves BaseURL to
// <BaseURL>/v1/messages; every gateway a caller has pointed BaseURL at speaks
// chat completions. Measured against OpenRouter on 2026-09-21: chat
// completions answers, and the same request over "messages" is refused with
// "Invalid Anthropic Messages API request (400)". In 0.1.7 upstream went
// further and made its DeepSeek adapter Messages-only, refusing a config that
// still carries `protocol`; chat completions is llm-pi-ai's now. So the
// default must mount pi-ai, and neither row may carry the key.
func TestComposePinsTheProtocol(t *testing.T) {
	for _, tc := range []struct {
		protocol, plugin string
	}{
		{"", "@deepseek-ai/dsh-llm-pi-ai"},
		{"chat-completions", "@deepseek-ai/dsh-llm-pi-ai"},
		{"messages", "@deepseek-ai/dsh-llm-deepseek-api-key"},
	} {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x", Protocol: tc.protocol})
		row, _ := modelRoute(t, entries)
		if row.Name != tc.plugin {
			t.Errorf("Protocol %q mounts %s, want %s", tc.protocol, row.Name, tc.plugin)
		}
		if _, present := row.Config["protocol"]; present {
			t.Errorf("Protocol %q left a `protocol` key on the row, which the Messages adapter refuses at boot", tc.protocol)
		}
	}
}

// The route the chat-completions row registers is the one the agent asks for,
// and it reads the key from where Open puts it.
func TestChatCompletionsRouteIsTheAgents(t *testing.T) {
	entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x", Provider: "acme", Model: "acme/think"})
	row, route := modelRoute(t, entries)
	if _, ok := row.Config["providers"].(map[string]any)["acme"]; !ok {
		t.Fatalf("the route is not keyed by the provider: %#v", row.Config["providers"])
	}
	if route["api"] != "openai-completions" || route["apiKeyEnv"] != "DEEPSEEK_API_KEY" {
		t.Errorf("api = %v, apiKeyEnv = %v", route["api"], route["apiKeyEnv"])
	}
	if route["baseURL"] != "https://api.deepseek.com" {
		t.Errorf("with no BaseURL the route goes to %v, want DeepSeek's own endpoint", route["baseURL"])
	}
	models, _ := route["models"].([]map[string]any)
	if len(models) != 1 || models[0]["id"] != "acme/think" {
		t.Errorf("the catalog does not list the configured model: %#v", route["models"])
	}
}

// An unknown protocol used to be the adapter's to refuse. It selects a plugin
// now, and Compose takes anything it does not recognise for the default — so
// Open is where a misspelling has to be caught.
func TestOpenRefusesAnUnknownProtocol(t *testing.T) {
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	h, err := sdk.Open(ctx, sdk.Config{CWD: dir, APIKey: "x", Protocol: "mesages", Env: map[string]string{"HOME": dir}})
	if err == nil {
		h.Close()
		t.Fatal("a misspelled Protocol opened a harness")
	}
	if !strings.Contains(err.Error(), "mesages") {
		t.Errorf("the failure does not name the protocol: %v", err)
	}
}

// Model settings are spelled the way a saved composition spells them, and
// land where the mounted plugin reads them.
func TestModelSettingsFollowTheProtocol(t *testing.T) {
	settings := map[string]any{
		"protocol":            "messages", // consumed before Compose; never written
		"reasoningEffort":     "low",
		"maxTokens":           float64(4096),
		"streamIdleTimeoutMs": float64(60000),
		"thinking":            nil, // an editor's "no override"
	}

	t.Run("messages", func(t *testing.T) {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x", Protocol: "messages"})
		tuned, err := sdk.WithModelSettings(entries, settings)
		if err != nil {
			t.Fatal(err)
		}
		_, config := modelRoute(t, tuned)
		if config["reasoningEffort"] != "low" || config["maxTokens"] != float64(4096) || config["streamIdleTimeoutMs"] != float64(60000) {
			t.Errorf("the settings were not merged as written: %#v", config)
		}
		for _, absent := range []string{"protocol", "thinking"} {
			if _, present := config[absent]; present {
				t.Errorf("%q reached the row", absent)
			}
		}
		if _, kept := config["retryPolicy"]; !kept {
			t.Error("applying settings dropped what Compose pinned")
		}
	})

	t.Run("chat-completions", func(t *testing.T) {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x"})
		tuned, err := sdk.WithModelSettings(entries, settings)
		if err != nil {
			t.Fatal(err)
		}
		row, route := modelRoute(t, tuned)
		if route["reasoning"] != "low" {
			t.Errorf("reasoning = %v, want low", route["reasoning"])
		}
		if route["streamIdleTimeoutMs"] != float64(60000) {
			t.Errorf("streamIdleTimeoutMs = %v", route["streamIdleTimeoutMs"])
		}
		if models := route["models"].([]map[string]any); models[0]["maxTokens"] != float64(4096) {
			t.Errorf("the output cap is %v, want it on the model's catalog entry", models[0]["maxTokens"])
		}
		for _, misplaced := range []string{"reasoningEffort", "maxTokens", "protocol"} {
			if _, present := row.Config[misplaced]; present {
				t.Errorf("%q was written at the top of the row, where pi-ai reads nothing", misplaced)
			}
			if _, present := route[misplaced]; present {
				t.Errorf("%q was written on the route under the adapter's name for it", misplaced)
			}
		}

		// The list handed in is not the list edited.
		_, original := modelRoute(t, entries)
		if original["reasoning"] != "high" || original["models"].([]map[string]any)[0]["maxTokens"] == float64(4096) {
			t.Error("WithModelSettings wrote through to the composition it was given")
		}
	})

	t.Run("thinking disabled is the level off", func(t *testing.T) {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x"})
		tuned, err := sdk.WithModelSettings(entries, map[string]any{"thinking": "disabled", "reasoningEffort": "max"})
		if err != nil {
			t.Fatal(err)
		}
		if _, route := modelRoute(t, tuned); route["reasoning"] != "off" {
			t.Errorf("reasoning = %v, want off whatever effort was also named", route["reasoning"])
		}
	})

	// A saved row holds the one key somebody changed. Replacing the object
	// would drop what Compose pinned beside it — here the retry mode — and
	// nothing would say so.
	t.Run("an object merges onto the composed one", func(t *testing.T) {
		for _, protocol := range []string{"chat-completions", "messages"} {
			entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x", Protocol: protocol})
			tuned, err := sdk.WithModelSettings(entries, map[string]any{"retryPolicy": map[string]any{"maxRetries": float64(4)}})
			if err != nil {
				t.Fatal(err)
			}
			_, route := modelRoute(t, tuned)
			policy, _ := route["retryPolicy"].(map[string]any)
			if policy["maxRetries"] != float64(4) || policy["mode"] != "normal" {
				t.Errorf("%s: retryPolicy is %#v, want maxRetries 4 beside the composed mode", protocol, policy)
			}
		}
	})

	t.Run("a setting with no place is named", func(t *testing.T) {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x"})
		for key, value := range map[string]any{"maxImagesPerRequest": float64(3), "reasoningEffort": "medium"} {
			_, err := sdk.WithModelSettings(entries, map[string]any{key: value})
			if err == nil {
				t.Errorf("%s: %v was accepted on the chat-completions row", key, value)
			} else if !strings.Contains(err.Error(), key) {
				t.Errorf("the failure does not name %s: %v", key, err)
			}
		}
	})
}
