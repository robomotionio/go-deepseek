package sdk_test

import (
	"context"
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
// `session.jsonl.zstd`. Harness 0.1.5 moved to format 3 and migrates an older
// log the first time something opens it for writing, so every conversation a
// robot has on disk goes through this on the first turn after the upgrade.
// Three pieces of this runtime are on that path and nowhere else:
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

	fixture, err := os.ReadFile(filepath.Join("testdata", "format0", "session.jsonl"))
	if err != nil {
		t.Fatal(err)
	}
	log := strings.ReplaceAll(string(fixture), "__CWD__", dir)
	sessionDir := filepath.Join(root, projectKey(dir), "legacy")
	if err := os.MkdirAll(sessionDir, 0o700); err != nil {
		t.Fatal(err)
	}
	encoder, err := zstd.NewWriter(nil)
	if err != nil {
		t.Fatal(err)
	}
	// Framed the way the format-0 writer framed it: the header line alone in
	// the first frame — the reader refuses anything else as corrupt — and the
	// events after it, one frame per flush.
	var framed []byte
	for _, line := range strings.SplitAfter(log, "\n") {
		if line != "" {
			framed = encoder.EncodeAll([]byte(line), framed)
		}
	}
	legacy := filepath.Join(sessionDir, "session.jsonl.zstd")
	if err := os.WriteFile(legacy, framed, 0o600); err != nil {
		t.Fatal(err)
	}

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

	migrated := filepath.Join(sessionDir, "session.v3.jsonl.zstd")
	raw, err := os.ReadFile(migrated)
	if err != nil {
		entries, _ := os.ReadDir(sessionDir)
		var names []string
		for _, entry := range entries {
			names = append(names, entry.Name())
		}
		t.Fatalf("no format-3 log beside the legacy one (%v): %v", names, err)
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
	for _, want := range []string{`"version":3`, "remember the word MARMALADE", "what was the word?"} {
		if !strings.Contains(string(text), want) {
			t.Errorf("the migrated log does not carry %q", want)
		}
	}
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
