package sdk_test

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"testing"
	"time"

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
