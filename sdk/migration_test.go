package sdk_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/klauspost/compress/zstd"

	"github.com/robomotionio/go-deepseek/sdk"
)

// A session written by go-deepseek v0.3.0 resumes here.
//
// That release shipped harness 0.1.1-rc.2, whose logs are session format 0 —
// `session.jsonl.zstd`. Harness 0.1.5 moved to format 3 and 0.1.7 to format 4,
// and an older log is migrated — straight to the current format, whatever it
// started as — the first time something opens it for writing, so every
// conversation a robot has on disk goes through this on the first turn after
// the upgrade. Three pieces of this runtime are on that path and nowhere else:
//
//   - the migration verifies the new generation inside a node:worker_threads
//     Worker, which runs on this loop (nodecompat/js/node/worker_threads.js)
//     from a script the bundle carries beside the module (carryAssets);
//   - the write lease is flock(2) through a native addon the host serves
//     (nodecompat/flock_unix.go);
//   - resume asks persistence.stat, since list() changed shape.
//
// testdata/format0/session.jsonl is what v0.3.0 wrote for one turn, verbatim
// but for the working directory, which is a placeholder filled in here. The
// dud key fails both turns at the provider — which is after the user's message
// is durable, so the test needs no network beyond that refusal.
func TestResumesAFormat0Log(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a moment")
	}
	dir := t.TempDir()
	root := filepath.Join(dir, "sessions")
	sessionDir := plantLog(t, dir, root, "format0", "legacy", "session.jsonl.zstd")

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	h, err := sdk.Open(ctx, sdk.Config{
		CWD:         dir,
		SessionRoot: root,
		Env:         map[string]string{"DEEPSEEK_API_KEY": "sk-not-a-real-key", "HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, turnErr := h.Session("legacy").Run(ctx, sdk.Text("what was the word?"))
	if err := h.Close(); err != nil {
		t.Fatal(err)
	}
	// The provider refusing the key is the expected ending. Anything else —
	// a verifier that could not start, a lock that could not be taken, an id
	// collision — means the migration never got as far as the model.
	if turnErr == nil || !strings.Contains(turnErr.Error(), "401") {
		t.Fatalf("the resumed turn should have reached the provider and been refused there: %v", turnErr)
	}

	text := currentLog(t, sessionDir)
	for _, want := range []string{`"version":4`, "remember the word MARMALADE", "what was the word?"} {
		if !strings.Contains(text, want) {
			t.Errorf("the migrated log does not carry %q", want)
		}
	}
}

// A session written by go-deepseek v0.4.x resumes here, and that is the one
// every deployed robot has: harness 0.1.6 wrote format 3, and 0.1.7 moved to
// format 4 — flat tool results, plugin-prefixed extension events — with its
// own migration step (dsh-session-format-v3-to-v4).
//
// testdata/format3/session.jsonl is what v0.4.2 wrote for one turn that
// thinks, calls `read` and answers, verbatim but for the working directory.
// A tool call is in it on purpose: the result is the part of the log format 4
// reshaped, so a fixture without one would migrate whatever the step did.
//
// "A new file appeared" would be a weak claim, so the resumed turn is run
// against an endpoint that records it: what the migration is FOR is the model
// seeing the earlier conversation, and the request either replays the call,
// its result and the answer or it does not.
//
// One thing does not come back the way it went. The fixture's reasoning was
// recorded by the DeepSeek adapter, and chat completions is llm-pi-ai's now;
// pi-ai replays thinking natively only where its own replay metadata is on the
// message, and treats anything else as another provider's history — which it
// keeps, as text in the assistant message rather than as `reasoning_content`.
// So a turn from before the upgrade costs its reasoning in context and reads
// to the model as something it said. Turns written after it replay natively
// (TestChatCompletionsToolRoundTrip). The assertion is that the reasoning
// survives, not where: upstream chose to degrade rather than fail the request,
// and where it lands is theirs to improve.
func TestResumesAFormat3Log(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a moment")
	}
	dir := t.TempDir()
	root := filepath.Join(dir, "sessions")
	sessionDir := plantLog(t, dir, root, "format3", "legacy3", "session.v3.jsonl.zstd")

	server, requests := wireEndpoint(t, "/chat/completions", sayWord("The word was MARMALADE."))
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL:     server.URL + "/v1",
		APIKey:      "sk-wire-test",
		CWD:         dir,
		SessionRoot: root,
		Env:         map[string]string{"HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	result, turnErr := h.Session("legacy3").Run(ctx, sdk.Text("what was the word?"))
	if err := h.Close(); err != nil {
		t.Fatal(err)
	}
	if turnErr != nil {
		t.Fatalf("the resumed turn failed: %v", turnErr)
	}
	if result.FinishReason != "completed" || !strings.Contains(result.FinalResponse, "MARMALADE") {
		t.Fatalf("finish=%q said %q", result.FinishReason, result.FinalResponse)
	}

	sent := requests()
	if len(sent) != 1 {
		t.Fatalf("%d model requests, want 1", len(sent))
	}
	var call, outcome, answer, question bool
	messages, _ := sent[0].Body["messages"].([]any)
	for _, item := range messages {
		message, _ := item.(map[string]any)
		text, _ := json.Marshal(message)
		switch message["role"] {
		case "assistant":
			if strings.Contains(string(text), "call_fixture_1") && strings.Contains(string(text), "I should read the note.") {
				call = true
			}
			if strings.Contains(string(text), "I will remember the word MARMALADE.") {
				answer = true
			}
		case "tool":
			if message["tool_call_id"] == "call_fixture_1" && strings.Contains(string(text), "the word is MARMALADE") {
				outcome = true
			}
		case "user":
			if strings.Contains(string(text), "what was the word?") {
				question = true
			}
		}
	}
	for what, replayed := range map[string]bool{
		"the tool call and the reasoning before it": call, "the tool result": outcome,
		"the earlier answer": answer, "the new question": question,
	} {
		if !replayed {
			t.Errorf("the request after migration does not carry %s", what)
		}
	}

	text := currentLog(t, sessionDir)
	for _, want := range []string{`"version":4`, "call_fixture_1", "what was the word?", "The word was MARMALADE."} {
		if !strings.Contains(text, want) {
			t.Errorf("the migrated log does not carry %q", want)
		}
	}
	// The source generation is kept: a migration that consumed it would leave
	// nothing to go back to.
	if _, err := os.Stat(filepath.Join(sessionDir, "session.v3.jsonl.zstd")); err != nil {
		t.Errorf("the format-3 log is gone after migration: %v", err)
	}
}

// plantLog writes a fixture log where the backend looks for a session: under
// the project key of its working directory, in a directory named for its id.
// It returns that directory.
func plantLog(t *testing.T, cwd, root, fixtureDir, sessionID, name string) string {
	t.Helper()
	fixture, err := os.ReadFile(filepath.Join("testdata", fixtureDir, "session.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	// Spliced into JSON, so escaped as JSON: a Windows path is all
	// backslashes, and C:\Users read raw is an invalid \U escape — a header
	// the backend cannot parse, and so a log it does not count as a session.
	quoted, err := json.Marshal(cwd)
	if err != nil {
		t.Fatal(err)
	}
	log := strings.ReplaceAll(string(fixture), "__CWD__", string(quoted[1:len(quoted)-1]))
	sessionDir := filepath.Join(root, projectKey(cwd), sessionID)
	if err := os.MkdirAll(sessionDir, 0o700); err != nil {
		t.Fatal(err)
	}
	encoder, err := zstd.NewWriter(nil)
	if err != nil {
		t.Fatal(err)
	}
	// Framed the way the writer framed it: the header line alone in the first
	// frame — the reader refuses anything else as corrupt — and the events
	// after it, one frame per flush.
	var framed []byte
	for _, line := range strings.SplitAfter(log, "\n") {
		if line != "" {
			framed = encoder.EncodeAll([]byte(line), framed)
		}
	}
	if err := os.WriteFile(filepath.Join(sessionDir, name), framed, 0o600); err != nil {
		t.Fatal(err)
	}
	return sessionDir
}

// currentLog reads a session directory's current-format log, decoded.
func currentLog(t *testing.T, sessionDir string) string {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(sessionDir, "session.v4.jsonl.zstd"))
	if err != nil {
		entries, _ := os.ReadDir(sessionDir)
		var names []string
		for _, entry := range entries {
			names = append(names, entry.Name())
		}
		t.Fatalf("no format-4 log beside the legacy one (%v): %v", names, err)
	}
	decoder, err := zstd.NewReader(nil)
	if err != nil {
		t.Fatal(err)
	}
	defer decoder.Close()
	text, err := decoder.DecodeAll(raw, nil)
	if err != nil {
		t.Fatal(err)
	}
	return string(text)
}

// projectKey is the JSONL backend's name for a session's project directory
// (session-persistence-jsonl/src/format.ts): separator runs collapse to one
// dash, anything outside [A-Za-z0-9._-] is escaped as ~XXXX, leading dashes
// go, and the result is wrapped in "--".
func projectKey(cwd string) string {
	var b strings.Builder
	run := false
	for _, r := range cwd {
		switch {
		case r == '/' || r == '\\' || r == ':':
			if !run {
				b.WriteByte('-')
			}
			run = true
		case r < 128 && r != '~' && (r == '.' || r == '_' || r == '-' ||
			(r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9')):
			b.WriteRune(r)
			run = false
		default:
			fmt.Fprintf(&b, "~%04X", r)
			run = false
		}
	}
	slug := strings.TrimLeft(b.String(), "-")
	if slug == "" {
		slug = "root"
	}
	if len(slug) > 251 {
		slug = slug[:251]
	}
	return "--" + slug + "--"
}
