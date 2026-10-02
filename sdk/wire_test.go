package sdk_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// Every other turn test in this repository is live, which leaves the wire
// itself — the path under BaseURL, the auth header, the dialect of the body —
// checked only when somebody has a key. Those are exactly the things a bundle
// regeneration moves: harness 0.1.7 took chat completions out of the DeepSeek
// adapter altogether, and the plugin that serves it now guesses a dialect from
// the endpoint's host. So they are pinned here, against endpoints that need no
// key and answer what they are scripted to.

// wireRequest is one model request as an endpoint received it.
type wireRequest struct {
	Method, Path string
	Header       http.Header
	Body         map[string]any
}

// wireEndpoint records every request and lets reply answer the nth one that
// reached the model path.
func wireEndpoint(t *testing.T, modelPath string, reply func(n int, request wireRequest, send func(event, data string))) (*httptest.Server, func() []wireRequest) {
	t.Helper()
	var mu sync.Mutex
	var seen []wireRequest
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		request := wireRequest{Method: r.Method, Path: r.URL.Path, Header: r.Header.Clone()}
		_ = json.Unmarshal(raw, &request.Body)
		if r.Method != http.MethodPost || !strings.HasSuffix(r.URL.Path, modelPath) {
			http.Error(w, `{"error":{"message":"not served here"}}`, http.StatusNotFound)
			return
		}
		mu.Lock()
		seen = append(seen, request)
		n := len(seen)
		mu.Unlock()

		w.Header().Set("Content-Type", "text/event-stream")
		reply(n, request, func(event, data string) {
			if event != "" {
				fmt.Fprintf(w, "event: %s\n", event)
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}
		})
	}))
	t.Cleanup(server.Close)
	return server, func() []wireRequest {
		mu.Lock()
		defer mu.Unlock()
		return append([]wireRequest(nil), seen...)
	}
}

// completionChunk is one chat-completions stream chunk.
func completionChunk(delta map[string]any, finish any) string {
	payload := map[string]any{
		"id": "chatcmpl-wire", "object": "chat.completion.chunk", "created": 1, "model": "wire",
		"choices": []map[string]any{{"index": 0, "delta": delta, "finish_reason": finish}},
	}
	if finish != nil {
		payload["usage"] = map[string]any{"prompt_tokens": 7, "completion_tokens": 1, "total_tokens": 8}
	}
	line, _ := json.Marshal(payload)
	return string(line)
}

func sayWord(word string) func(int, wireRequest, func(string, string)) {
	return func(_ int, _ wireRequest, send func(string, string)) {
		send("", completionChunk(map[string]any{"role": "assistant", "content": word}, nil))
		send("", completionChunk(map[string]any{}, "stop"))
		send("", "[DONE]")
	}
}

func openAgainst(t *testing.T, cfg sdk.Config) (*sdk.Harness, context.Context) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	t.Cleanup(cancel)
	if cfg.CWD == "" {
		cfg.CWD = t.TempDir()
	}
	cfg.Env = map[string]string{"HOME": cfg.CWD}
	h, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { h.Close() })
	return h, ctx
}

// BaseURL means an OpenAI-compatible endpoint, and a default Config speaks
// DeepSeek's chat-completions dialect to it — whatever the endpoint's host is.
//
// The host matters because pi-ai, which serves this wire since 0.1.7, picks a
// dialect from it when none is stated: an address it does not recognise (this
// one is 127.0.0.1) gets OpenAI's, which renames the output cap, moves the
// system prompt to a `developer` role and adds `store`. The adapter it
// replaced sent one dialect everywhere, so every gateway already behind a
// BaseURL has been answering that one.
func TestChatCompletionsWire(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a few seconds")
	}
	server, requests := wireEndpoint(t, "/chat/completions", sayWord("WIRE-OK"))
	h, ctx := openAgainst(t, sdk.Config{
		BaseURL: server.URL + "/v1",
		APIKey:  "sk-wire-test",
		Model:   "gateway/some-model",
	})

	result, err := h.Run(ctx, sdk.Text("Reply with exactly the word WIRE-OK and nothing else."))
	if err != nil {
		t.Fatal(err)
	}
	if result.FinishReason != "completed" || !strings.Contains(result.FinalResponse, "WIRE-OK") {
		t.Fatalf("finish=%q said %q", result.FinishReason, result.FinalResponse)
	}

	sent := requests()
	if len(sent) != 1 {
		t.Fatalf("%d model requests, want 1", len(sent))
	}
	turn := sent[0]
	if turn.Path != "/v1/chat/completions" {
		t.Errorf("path = %q, want /v1/chat/completions", turn.Path)
	}
	if got := turn.Header.Get("Authorization"); got != "Bearer sk-wire-test" {
		t.Errorf("Authorization = %q", got)
	}
	body := turn.Body
	if body["model"] != "gateway/some-model" || body["stream"] != true {
		t.Errorf("model = %v, stream = %v", body["model"], body["stream"])
	}
	if body["reasoning_effort"] != "high" {
		t.Errorf("reasoning_effort = %v, want high", body["reasoning_effort"])
	}
	if thinking, _ := body["thinking"].(map[string]any); thinking["type"] != "enabled" {
		t.Errorf("thinking = %v, want {type: enabled}", body["thinking"])
	}
	// The cap is the configured 256000 clamped to the room the context window
	// has left, so its exact value moves with the prompt.
	if cap, _ := body["max_tokens"].(float64); cap <= 0 || cap > 256000 {
		t.Errorf("max_tokens = %v, want a cap of at most 256000", body["max_tokens"])
	}
	for _, foreign := range []string{"max_completion_tokens", "store", "reasoning"} {
		if _, present := body[foreign]; present {
			t.Errorf("the request carries %q, which is another dialect's field", foreign)
		}
	}
	if usage, _ := body["stream_options"].(map[string]any); usage["include_usage"] != true {
		t.Errorf("stream_options = %v, want include_usage", body["stream_options"])
	}
	messages, _ := body["messages"].([]any)
	if len(messages) == 0 {
		t.Fatal("the request has no messages")
	}
	if first, _ := messages[0].(map[string]any); first["role"] != "system" {
		t.Errorf("the prompt travels as role %v, want system", first["role"])
	}
	if tools, _ := body["tools"].([]any); len(tools) == 0 {
		t.Error("the request offers the model no tools")
	}
}

// A tool call is the part of the wire a one-word answer never exercises: the
// call comes back from the model, runs, and is replayed — with the reasoning
// that preceded it, which DeepSeek requires on a thinking turn — beside its
// result on the next request.
func TestChatCompletionsToolRoundTrip(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a few seconds")
	}
	dir := t.TempDir()
	note := filepath.Join(dir, "note.txt")
	if err := os.WriteFile(note, []byte("the marker is PLOVER-7\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	arguments, _ := json.Marshal(map[string]string{"file_path": note})

	server, requests := wireEndpoint(t, "/chat/completions", func(n int, _ wireRequest, send func(string, string)) {
		if n > 1 {
			sayWord("ROUND-TRIP-OK")(n, wireRequest{}, send)
			return
		}
		send("", completionChunk(map[string]any{"role": "assistant", "reasoning_content": "I should read the note."}, nil))
		send("", completionChunk(map[string]any{"tool_calls": []map[string]any{{
			"index": 0, "id": "call_wire_1", "type": "function",
			"function": map[string]any{"name": "read", "arguments": string(arguments)},
		}}}, nil))
		send("", completionChunk(map[string]any{}, "tool_calls"))
		send("", "[DONE]")
	})
	h, ctx := openAgainst(t, sdk.Config{BaseURL: server.URL + "/v1", APIKey: "sk-wire-test", Model: "gateway/some-model", CWD: dir})

	result, err := h.Run(ctx, sdk.Text("Read note.txt and tell me the marker."))
	if err != nil {
		t.Fatal(err)
	}
	if result.FinishReason != "completed" || !strings.Contains(result.FinalResponse, "ROUND-TRIP-OK") {
		t.Fatalf("finish=%q said %q", result.FinishReason, result.FinalResponse)
	}

	sent := requests()
	if len(sent) != 2 {
		t.Fatalf("%d model requests, want 2", len(sent))
	}
	var call, outcome map[string]any
	messages, _ := sent[1].Body["messages"].([]any)
	for _, item := range messages {
		message, _ := item.(map[string]any)
		switch message["role"] {
		case "assistant":
			if _, ok := message["tool_calls"]; ok {
				call = message
			}
		case "tool":
			outcome = message
		}
	}
	if call == nil || outcome == nil {
		t.Fatalf("the second request replays neither the call nor its result: %v", messages)
	}
	if call["reasoning_content"] != "I should read the note." {
		t.Errorf("the replayed call carries reasoning_content %q", call["reasoning_content"])
	}
	if outcome["tool_call_id"] != "call_wire_1" {
		t.Errorf("tool_call_id = %v", outcome["tool_call_id"])
	}
	if text, _ := json.Marshal(outcome["content"]); !strings.Contains(string(text), "PLOVER-7") {
		t.Errorf("the tool result does not carry what the file says: %s", text)
	}
}

// Protocol "messages" is DeepSeek's Anthropic-compatible wire: POST
// <BaseURL>/v1/messages with the key in x-api-key. Since 0.1.7 it is a
// different plugin from the one that serves chat completions, so this is also
// the test that the row Compose mounts for it starts and answers.
func TestMessagesWire(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a few seconds")
	}
	event := func(payload map[string]any) (string, string) {
		line, _ := json.Marshal(payload)
		return payload["type"].(string), string(line)
	}
	server, requests := wireEndpoint(t, "/messages", func(_ int, _ wireRequest, send func(string, string)) {
		send(event(map[string]any{"type": "message_start", "message": map[string]any{
			"id": "msg_wire", "type": "message", "role": "assistant", "model": "wire", "content": []any{},
			"stop_reason": nil, "usage": map[string]any{"input_tokens": 7, "output_tokens": 0},
		}}))
		send(event(map[string]any{"type": "content_block_start", "index": 0, "content_block": map[string]any{"type": "text", "text": ""}}))
		send(event(map[string]any{"type": "content_block_delta", "index": 0, "delta": map[string]any{"type": "text_delta", "text": "MESSAGES-OK"}}))
		send(event(map[string]any{"type": "content_block_stop", "index": 0}))
		send(event(map[string]any{"type": "message_delta", "delta": map[string]any{"stop_reason": "end_turn", "stop_sequence": nil}, "usage": map[string]any{"output_tokens": 1}}))
		send(event(map[string]any{"type": "message_stop"}))
	})
	h, ctx := openAgainst(t, sdk.Config{
		BaseURL:  server.URL,
		APIKey:   "sk-wire-test",
		Model:    "deepseek-v4-flash",
		Protocol: "messages",
	})

	result, err := h.Run(ctx, sdk.Text("Reply with exactly the word MESSAGES-OK and nothing else."))
	if err != nil {
		t.Fatal(err)
	}
	if result.FinishReason != "completed" || !strings.Contains(result.FinalResponse, "MESSAGES-OK") {
		t.Fatalf("finish=%q said %q", result.FinishReason, result.FinalResponse)
	}

	sent := requests()
	if len(sent) != 1 {
		t.Fatalf("%d model requests, want 1", len(sent))
	}
	if sent[0].Path != "/v1/messages" {
		t.Errorf("path = %q, want /v1/messages", sent[0].Path)
	}
	if got := sent[0].Header.Get("X-Api-Key"); got != "sk-wire-test" {
		t.Errorf("x-api-key = %q", got)
	}
	if sent[0].Body["model"] != "deepseek-v4-flash" {
		t.Errorf("model = %v", sent[0].Body["model"])
	}
}

// Model settings are only worth translating if the request changes. A key
// pi-ai does not read is accepted and ignored, so "it landed in the right map"
// and "it reached the endpoint" are two claims, and this is the second.
func TestModelSettingsReachTheWire(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a few seconds")
	}
	for _, tc := range []struct {
		name     string
		settings map[string]any
		check    func(t *testing.T, body map[string]any)
	}{
		{"an output cap", map[string]any{"maxTokens": float64(4096)}, func(t *testing.T, body map[string]any) {
			if body["max_tokens"] != float64(4096) {
				t.Errorf("max_tokens = %v, want 4096", body["max_tokens"])
			}
		}},
		{"the highest effort", map[string]any{"reasoningEffort": "max"}, func(t *testing.T, body map[string]any) {
			if body["reasoning_effort"] != "max" {
				t.Errorf("reasoning_effort = %v, want max", body["reasoning_effort"])
			}
		}},
		{"thinking off", map[string]any{"thinking": "disabled"}, func(t *testing.T, body map[string]any) {
			if thinking, _ := body["thinking"].(map[string]any); thinking["type"] != "disabled" {
				t.Errorf("thinking = %v, want {type: disabled}", body["thinking"])
			}
			if effort, present := body["reasoning_effort"]; present {
				t.Errorf("reasoning_effort = %v on a request with thinking off", effort)
			}
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server, requests := wireEndpoint(t, "/chat/completions", sayWord("SET-OK"))
			cfg := sdk.Config{BaseURL: server.URL + "/v1", APIKey: "sk-wire-test", Model: "gateway/some-model", CWD: t.TempDir()}
			composition, err := sdk.WithModelSettings(sdk.Compose(cfg), tc.settings)
			if err != nil {
				t.Fatal(err)
			}
			cfg.Composition = composition
			h, ctx := openAgainst(t, cfg)
			if _, err := h.Run(ctx, sdk.Text("Reply with exactly the word SET-OK and nothing else.")); err != nil {
				t.Fatal(err)
			}
			sent := requests()
			if len(sent) != 1 {
				t.Fatalf("%d model requests, want 1", len(sent))
			}
			tc.check(t, sent[0].Body)
		})
	}
}
