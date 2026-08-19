package sdk_test

import (
	"context"
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/klauspost/compress/zstd"
	"github.com/robomotionio/go-deepseek/sdk"
)

// fakeCarrier replays a scripted set of notifications, which is what a carrier
// is from the SDK's point of view. It lets the run-interval rules — final
// response, finish reason, event filtering — be tested exactly, without a model
// or a subprocess deciding what the events are.
type fakeCarrier struct {
	events    []string
	sessionID string
	err       error
	started   bool
	closed    bool
}

func (f *fakeCarrier) Start(context.Context) error { f.started = true; return nil }
func (f *fakeCarrier) Close() error                { f.closed = true; return nil }

func (f *fakeCarrier) Prompt(ctx context.Context, sessionID string, input sdk.Input, sink func(sdk.Notification)) error {
	if f.err != nil {
		return f.err
	}
	for _, raw := range f.events {
		id := f.sessionID
		if id == "" {
			id = sessionID
		}
		params, _ := json.Marshal(map[string]any{"sessionId": id, "event": json.RawMessage(raw)})
		sink(sdk.Notification{Method: "session.event", SessionID: id, Params: params})
	}
	return nil
}

func event(t *testing.T, kind string, data string) string {
	t.Helper()
	return `{"type":"` + kind + `","seq":1,"time":1,"data":` + data + `}`
}

func TestRunReadsTheInterval(t *testing.T) {
	carrier := &fakeCarrier{events: []string{
		event(t, "turn/start", `{"turn":1}`),
		event(t, "assistant/message", `{"message":{"content":[{"type":"text","text":"first"}]}}`),
		event(t, "tool/call", `{"name":"read"}`),
		event(t, "tool/result", `{"name":"read"}`),
		event(t, "assistant/message", `{"message":{"content":[{"type":"text","text":"the "},{"type":"reasoning","text":"hidden"},{"type":"text","text":"answer"}]}}`),
		event(t, "turn/end", `{"turn":1,"reason":{"kind":"completed"}}`),
	}}

	h, err := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(carrier))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	var streamed []string
	result, err := h.Session("s1").Run(context.Background(), sdk.Text("go"),
		sdk.OnEvent(func(e sdk.Event) { streamed = append(streamed, e.Type) }))
	if err != nil {
		t.Fatal(err)
	}

	// The last assistant message, text blocks only — reasoning is not the answer.
	if result.FinalResponse != "the answer" {
		t.Errorf("FinalResponse = %q, want %q", result.FinalResponse, "the answer")
	}
	if result.FinishReason != "completed" {
		t.Errorf("FinishReason = %q", result.FinishReason)
	}
	if result.ToolCalls() != 1 {
		t.Errorf("ToolCalls = %d, want 1", result.ToolCalls())
	}
	if len(result.Events) != 6 {
		t.Errorf("collected %d events, want 6", len(result.Events))
	}
	if len(streamed) != 6 {
		t.Errorf("streamed %d events, want 6", len(streamed))
	}
	if result.SessionID != "s1" {
		t.Errorf("SessionID = %q", result.SessionID)
	}
	if result.Duration <= 0 {
		t.Error("Duration was not measured")
	}
}

// Another session's events must not land in this run's result, or a delegating
// agent's children would overwrite the answer.
func TestRunIgnoresOtherSessions(t *testing.T) {
	carrier := &fakeCarrier{
		sessionID: "somebody-else",
		events: []string{
			event(t, "assistant/message", `{"message":{"content":[{"type":"text","text":"not mine"}]}}`),
		},
	}
	h, err := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(carrier))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	result, err := h.Session("mine").Run(context.Background(), sdk.Text("go"))
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Events) != 0 {
		t.Errorf("collected %d events from another session", len(result.Events))
	}
	if result.FinalResponse != "" {
		t.Errorf("FinalResponse = %q, want empty", result.FinalResponse)
	}
	// The notification is still reported: a caller watching a delegating agent
	// wants to see its children work.
	if len(result.Notifications) != 1 {
		t.Errorf("got %d notifications, want 1", len(result.Notifications))
	}
}

func TestFailedTurn(t *testing.T) {
	carrier := &fakeCarrier{events: []string{
		event(t, "turn/end", `{"turn":1,"reason":{"kind":"error","error":{"message":"User not found.","code":"AUTH","status":401}}}`),
	}}
	h, _ := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(carrier))
	defer h.Close()

	// By default a failed turn is a result, not an error: the events describing
	// the failure are worth having.
	result, err := h.Session("s").Run(context.Background(), sdk.Text("go"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.FinishReason != "error" {
		t.Errorf("FinishReason = %q, want error", result.FinishReason)
	}
	if turnErr := sdk.TurnError(result.Events); turnErr == nil ||
		!strings.Contains(turnErr.Error(), "User not found") ||
		!errors.Is(turnErr, sdk.ErrTurnFailed) {
		t.Errorf("TurnError = %v", turnErr)
	}

	// And an error when the caller asks for one.
	_, err = h.Session("s2").Run(context.Background(), sdk.Text("go"), sdk.FailOnTurnError())
	if !errors.Is(err, sdk.ErrTurnFailed) {
		t.Errorf("FailOnTurnError gave %v", err)
	}
}

// A turn/end without a reason kind is a runtime that is not speaking the
// protocol. Reporting it as "completed" would turn a broken runtime into a
// silently wrong answer.
func TestProtocolViolation(t *testing.T) {
	carrier := &fakeCarrier{events: []string{
		event(t, "turn/end", `{"turn":1,"reason":{}}`),
	}}
	h, _ := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(carrier))
	defer h.Close()

	if _, err := h.Session("s").Run(context.Background(), sdk.Text("go")); !errors.Is(err, sdk.ErrProtocol) {
		t.Fatalf("got %v, want ErrProtocol", err)
	}
}

func TestClosedHarness(t *testing.T) {
	carrier := &fakeCarrier{}
	h, _ := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(carrier))
	if err := h.Close(); err != nil {
		t.Fatal(err)
	}
	if !carrier.closed {
		t.Error("closing the harness did not close the carrier")
	}
	if _, err := h.Session("s").Run(context.Background(), sdk.Text("go")); !errors.Is(err, sdk.ErrClosed) {
		t.Fatalf("got %v, want ErrClosed", err)
	}
	if err := h.Close(); err != nil {
		t.Errorf("closing twice: %v", err)
	}
}

func TestEmptyInputIsRefused(t *testing.T) {
	h, _ := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(&fakeCarrier{}))
	defer h.Close()
	if _, err := h.Session("s").Run(context.Background(), nil); err == nil {
		t.Fatal("an empty prompt should be refused")
	}
}

func TestSessionsAreDistinct(t *testing.T) {
	h, _ := sdk.Open(context.Background(), sdk.Config{CWD: t.TempDir()}, sdk.WithCarrier(&fakeCarrier{}))
	defer h.Close()
	if a, b := h.NewSession().ID(), h.NewSession().ID(); a == b {
		t.Fatalf("two new sessions share the id %q", a)
	}
	if h.Session("fixed").ID() != "fixed" {
		t.Fatal("Session did not keep the id it was given")
	}
}

// The in-process carrier is the default, and Open must boot it. This is the
// expensive test in the package — it parses the whole harness — so it is the
// only one that does.
func TestInProcessCarrierBoots(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a few seconds")
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	start := time.Now()
	h, err := sdk.Open(ctx, sdk.Config{
		CWD: dir,
		Env: map[string]string{"DEEPSEEK_API_KEY": "not-used-for-boot", "HOME": dir},
	})
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer h.Close()
	t.Logf("booted in %v", time.Since(start))
}

// The live turn, key-gated like the parent package's.
func TestLiveRun(t *testing.T) {
	key := os.Getenv("DEEPSEEK_API_KEY")
	if key == "" {
		t.Skip("set DEEPSEEK_API_KEY to run a live turn")
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{
		CWD:     dir,
		Model:   model,
		BaseURL: os.Getenv("DEEPSEEK_BASE_URL"),
		Env:     map[string]string{"DEEPSEEK_API_KEY": key, "HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	var deltas int
	result, err := h.Run(ctx, sdk.Text("Reply with exactly the word HARNESS-OK and nothing else."),
		sdk.OnEvent(func(e sdk.Event) {
			if e.Type == "assistant/chunk" {
				deltas++
			}
		}))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%v, %d events, %d chunks, finish=%q, said %q",
		result.Duration, len(result.Events), deltas, result.FinishReason, result.FinalResponse)
	if !strings.Contains(strings.ToUpper(result.FinalResponse), "HARNESS-OK") {
		t.Errorf("unexpected answer: %q", result.FinalResponse)
	}
	if result.FinishReason != "completed" {
		t.Errorf("FinishReason = %q", result.FinishReason)
	}
	if deltas == 0 {
		t.Error("no chunks were streamed — OnEvent saw nothing as it arrived")
	}
}

// A session id is durable — it IS the name of its log — so using one again in a
// new process is how a conversation continues. This is the pair of fixes that
// makes that true: the runtime now RESUMES a stored id instead of creating a
// fresh session on top of it, and the Buffer accessors the zstd log reader
// needs now exist, so the default compressed log can actually be read back.
//
// It needs no model. A dud key fails the turn at the provider, which is a
// described outcome rather than a transport failure — and the interesting part
// happened before that: the second harness loaded the first one's log and
// appended to it instead of colliding with it.
func TestSessionResumesAStoredLog(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness twice takes a moment")
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	// The DEFAULT composition, so the log is zstd — the shape that could not be
	// read back at all before.
	cfg := sdk.Config{
		CWD: dir,
		Env: map[string]string{"DEEPSEEK_API_KEY": "sk-not-a-real-key", "HOME": dir},
	}

	first, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	// The dud key fails this turn at the provider, which is expected and is what
	// keeps the test offline. The session is still opened, logged and closed.
	_, firstErr := first.Session("continued").Run(ctx, sdk.Text("the first thing said"))
	t.Logf("first turn ended with: %v", firstErr)
	if err := first.Close(); err != nil {
		t.Fatal(err)
	}

	second, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	_, secondErr := second.Session("continued").Run(ctx, sdk.Text("the second thing said"))
	if err := second.Close(); err != nil {
		t.Fatal(err)
	}
	t.Logf("second turn ended with: %v", secondErr)

	// Reaching the provider at all is the result that matters. Before the fix
	// the second turn never got there: it failed with "already has a persisted
	// log on disk that does not match this live session (id collision)",
	// because the runtime created a fresh session on an id that already had
	// history instead of resuming it.
	if secondErr != nil && strings.Contains(secondErr.Error(), "id collision") {
		t.Fatalf("the stored session was not resumed: %v", secondErr)
	}

	// The proof is on disk: one log, holding both turns. A collision would have
	// left the second turn unwritten.
	log := readSessionLog(t, filepath.Join(dir, ".sessions"))
	for _, want := range []string{"the first thing said", "the second thing said"} {
		if !strings.Contains(log, want) {
			t.Errorf("the resumed log does not carry %q", want)
		}
	}
}

// readSessionLog finds the one session log under root and returns its text,
// decompressing it when the default zstd persistence wrote it.
func readSessionLog(t *testing.T, root string) string {
	t.Helper()
	var path string
	if err := filepath.WalkDir(root, func(at string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasPrefix(d.Name(), "session.jsonl") {
			return err
		}
		path = at
		return fs.SkipAll
	}); err != nil {
		t.Fatal(err)
	}
	if path == "" {
		t.Fatalf("no session log was written under %s", root)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasSuffix(path, ".zstd") {
		return string(raw)
	}
	decoder, err := zstd.NewReader(nil)
	if err != nil {
		t.Fatal(err)
	}
	defer decoder.Close()
	// The persistence appends one frame per flush, so this is several frames
	// concatenated rather than one.
	text, err := decoder.DecodeAll(raw, nil)
	if err != nil {
		t.Fatalf("the zstd session log will not decode: %v", err)
	}
	return string(text)
}

// The live half of the same claim: a second process picks the conversation back
// up and can answer from what the first one was told.
func TestLiveSessionResume(t *testing.T) {
	key := os.Getenv("DEEPSEEK_API_KEY")
	if key == "" {
		t.Skip("set DEEPSEEK_API_KEY to resume a session for real")
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-v4-flash"
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cfg := sdk.Config{
		CWD:     dir,
		Model:   model,
		BaseURL: os.Getenv("DEEPSEEK_BASE_URL"),
		Env:     map[string]string{"DEEPSEEK_API_KEY": key, "HOME": dir},
	}

	first, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := first.Session("memory").Run(ctx,
		sdk.Text("Remember this codeword: MARMALADE. Reply with just the word OK.")); err != nil {
		first.Close()
		t.Fatal(err)
	}
	if err := first.Close(); err != nil {
		t.Fatal(err)
	}

	second, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer second.Close()

	result, err := second.Session("memory").Run(ctx,
		sdk.Text("What was the codeword? Reply with just the word."))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%v, finish=%q, said %q", result.Duration, result.FinishReason, result.FinalResponse)
	if !strings.Contains(strings.ToUpper(result.FinalResponse), "MARMALADE") {
		t.Errorf("the second process did not resume the conversation: %q", result.FinalResponse)
	}
}

// A composition FREEZES what it read, so it has to read the Config the way Open
// does — defaults and environment included. When it did not, building a
// composition first and opening with it second produced an adapter pointed at
// the default endpoint however carefully DEEPSEEK_BASE_URL was set, and the
// symptom was a 401 from the wrong host: a bad-key error that is not one.
func TestComposeAppliesTheSameDefaultsAsOpen(t *testing.T) {
	t.Setenv("DEEPSEEK_BASE_URL", "https://gateway.example/v1")

	// The zero Config: nothing named, everything defaulted.
	entries := sdk.Compose(sdk.Config{})

	find := func(id string) map[string]any {
		for _, entry := range entries {
			if entry.ID == id {
				return entry.Config
			}
		}
		t.Fatalf("the default composition has no %q entry", id)
		return nil
	}

	// The endpoint the environment named, on the adapter that will use it.
	if got := find("llm-deepseek")["baseURL"]; got != "https://gateway.example/v1" {
		t.Errorf("the adapter's baseURL is %v, so the gateway was lost between Compose and Open", got)
	}

	// And the working directory, which is the same trap wearing a different
	// hat: an agent configured with an empty cwd refuses every relative path.
	agents, ok := find("agent-spine")["agents"].([]map[string]any)
	if !ok || len(agents) == 0 {
		t.Fatalf("the spine entry carries no agents: %#v", find("agent-spine"))
	}
	cwd, _ := agents[0]["cwd"].(string)
	if cwd == "" || !filepath.IsAbs(cwd) {
		t.Errorf("the agent's cwd is %q, want the process's own absolute directory", cwd)
	}

	// An explicit field still wins over the ambient one.
	named := sdk.Compose(sdk.Config{BaseURL: "https://explicit.example/v1", CWD: t.TempDir()})
	for _, entry := range named {
		if entry.ID == "llm-deepseek" && entry.Config["baseURL"] != "https://explicit.example/v1" {
			t.Errorf("an explicit BaseURL was overridden by the environment: %v", entry.Config["baseURL"])
		}
	}
}

func TestComposeIsAdjustable(t *testing.T) {
	cfg := sdk.Config{CWD: t.TempDir(), Model: "deepseek-v4-flash"}
	entries := sdk.Compose(cfg)
	if len(entries) == 0 {
		t.Fatal("the default composition is empty")
	}

	find := func(list []sdk.Entry, id string) *sdk.Entry {
		for i := range list {
			if list[i].ID == id {
				return &list[i]
			}
		}
		return nil
	}
	if find(entries, "tool-fs") == nil {
		t.Error("the default composition has no filesystem tools")
	}

	added := sdk.Add(entries, sdk.Entry{ID: "web", Name: "@deepseek-ai/dsh-tool-web"})
	if find(added, "web") == nil {
		t.Error("Add did not add the entry")
	}
	if len(entries) != len(added)-1 {
		t.Error("Add mutated the list it was given")
	}

	off := sdk.Disable(added, "persistence", true)
	if entry := find(off, "persistence"); entry == nil || !entry.Disabled {
		t.Error("Disable did not disable the entry")
	}
	if entry := find(added, "persistence"); entry != nil && entry.Disabled {
		t.Error("Disable mutated the list it was given")
	}

	tuned := sdk.With(added, "tool-todo", map[string]any{"allowParallelInProgress": false})
	if entry := find(tuned, "tool-todo"); entry == nil || entry.Config["allowParallelInProgress"] != false {
		t.Error("With did not replace the config")
	}
}

// A composition set on the Config has to actually reach the harness. Naming a
// plugin that does not exist is the cheapest proof: it fails at Open, where a
// composition that was ignored would have started happily.
func TestCompositionReachesTheHarness(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a moment")
	}
	dir := t.TempDir()
	cfg := sdk.Config{CWD: dir, Env: map[string]string{"HOME": dir}}
	cfg.Composition = sdk.Add(sdk.Compose(cfg), sdk.Entry{
		ID:   "nope",
		Name: "@deepseek-ai/dsh-not-a-real-plugin",
	})

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	h, err := sdk.Open(ctx, cfg)
	if err == nil {
		h.Close()
		t.Fatal("a composition naming a plugin that does not exist should fail to start")
	}
	if !strings.Contains(err.Error(), "dsh-not-a-real-plugin") {
		t.Fatalf("the failure does not name the plugin: %v", err)
	}
}

func TestPluginsAndVersion(t *testing.T) {
	plugins := sdk.Plugins()
	if len(plugins) == 0 {
		t.Fatal("the bundle reports no plugins")
	}
	var found bool
	for _, p := range plugins {
		if p == "@deepseek-ai/dsh-tool-fs" {
			found = true
		}
	}
	if !found {
		t.Errorf("the filesystem tools are not in the bundle: %v", plugins[:min(5, len(plugins))])
	}
	version, commit := sdk.HarnessVersion()
	if version == "" || commit == "" {
		t.Fatalf("the bundle does not record where it came from: %q @ %q", version, commit)
	}
	t.Logf("harness %s @ %s, %d plugins", version, commit[:12], len(plugins))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
