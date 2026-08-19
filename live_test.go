package deepseek_test

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	deepseek "github.com/robomotionio/go-deepseek"
)

// The gate: a real model, over the real network, driving the real harness on a
// pure-Go runtime. Everything else in this package can pass while this does not,
// which is why it exists and why it is not mocked.
//
// Key-gated: set DEEPSEEK_API_KEY (and DEEPSEEK_BASE_URL / DEEPSEEK_MODEL for a
// gateway) to run it.
func TestLiveTurn(t *testing.T) {
	key := os.Getenv("DEEPSEEK_API_KEY")
	if key == "" {
		t.Skip("set DEEPSEEK_API_KEY to run the live turn")
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}

	dir := t.TempDir()
	h, err := deepseek.New(deepseek.Config{
		CWD:      dir,
		Model:    model,
		BaseURL:  os.Getenv("DEEPSEEK_BASE_URL"),
		Provider: "deepseek-official",
		Env: map[string]string{
			"DEEPSEEK_API_KEY": key,
			"HOME":             dir,
		},
		Stdout: func(p []byte) { t.Log("out: " + strings.TrimRight(string(p), "\n")) },
		Stderr: func(p []byte) { t.Log("err: " + strings.TrimRight(string(p), "\n")) },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	go func() {
		for event := range h.Events() {
			raw := string(event.Raw)
			if len(raw) > 600 {
				raw = raw[:600] + "…"
			}
			t.Logf("event %s %s", event.Type, raw)
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
	defer cancel()

	booted := time.Now()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	t.Logf("cold boot: %v", time.Since(booted))

	result, err := h.Run(ctx, "gate", deepseek.Text(
		"Reply with exactly the word ROBOMOTION and nothing else."))
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	t.Logf("turn took %v, %d events, finish=%q", result.Duration, result.Events, result.FinishReason)
	t.Logf("text: %q", result.Text)
	if result.Text == "" {
		t.Fatal("the model produced no text")
	}
	if !strings.Contains(strings.ToUpper(result.Text), "ROBOMOTION") {
		t.Errorf("unexpected answer: %q", result.Text)
	}
}

// The second half of the gate: the agent has to USE its tools, not just answer.
// It reads a file it was not given the contents of, edits it, and the check is
// what is on disk afterwards — verified outside the agent, so an agent that
// merely claims success fails here.
func TestLiveToolUse(t *testing.T) {
	key := os.Getenv("DEEPSEEK_API_KEY")
	if key == "" {
		t.Skip("set DEEPSEEK_API_KEY to run the live tool-use turn")
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}

	dir := t.TempDir()
	const before = "one\ntwo\nBROKEN\nfour\n"
	if err := os.WriteFile(dir+"/notes.txt", []byte(before), 0o644); err != nil {
		t.Fatal(err)
	}

	h, err := deepseek.New(deepseek.Config{
		CWD:      dir,
		Model:    model,
		BaseURL:  os.Getenv("DEEPSEEK_BASE_URL"),
		Provider: "deepseek-official",
		Env:      map[string]string{"DEEPSEEK_API_KEY": key, "HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	var tools []string
	go func() {
		for event := range h.Events() {
			if strings.Contains(event.Type, "tool") {
				tools = append(tools, event.Type)
			}
		}
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	result, err := h.Run(ctx, "tools", deepseek.Text(
		"The file notes.txt in the current directory has a line that says BROKEN. "+
			"Replace that one line with the word FIXED, leaving every other line as it is. "+
			"Use your file tools."))
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	t.Logf("turn took %v, %d events, tool events: %v", result.Duration, result.Events, tools)
	t.Logf("said: %q", result.Text)

	after, err := os.ReadFile(dir + "/notes.txt")
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("file now: %q", string(after))
	if strings.Contains(string(after), "BROKEN") {
		t.Errorf("the agent did not edit the file: %q", string(after))
	}
	if !strings.Contains(string(after), "FIXED") {
		t.Errorf("FIXED is not in the file: %q", string(after))
	}
	for _, line := range []string{"one", "two", "four"} {
		if !strings.Contains(string(after), line) {
			t.Errorf("the agent lost the line %q: %q", line, string(after))
		}
	}
}
