package sdk_test

import (
	"context"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// The JSON-RPC carrier is tested against a scripted runtime rather than a real
// one, and that is the point: the protocol's awkward parts are the ones a real
// harness would only exercise by accident.
//
// Each script is a tiny program compiled from this test file itself — the helper
// process pattern — so there is no fixture to keep in step and nothing to
// install. TestHelperRuntime below is the program.

func helperRuntime(t *testing.T, script string) (string, []string) {
	t.Helper()
	if runtime.GOOS == "windows" {
		t.Skip("the helper-process pattern needs a POSIX shell here")
	}
	return os.Args[0], []string{"-test.run=TestHelperRuntime", "--", script}
}

func helperEnv(script string) []string {
	return []string{"DSH_HELPER=1", "DSH_SCRIPT=" + script}
}

// TestHelperRuntime is not a test: it is the fake runtime, which runs when the
// test binary is started with DSH_HELPER set.
func TestHelperRuntime(t *testing.T) {
	if os.Getenv("DSH_HELPER") == "" {
		t.Skip("helper process")
	}
	runHelper(os.Getenv("DSH_SCRIPT"))
	os.Exit(0)
}

func TestJSONRPCRun(t *testing.T) {
	bin, args := helperRuntime(t, "normal")
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{
		CWD: dir,
		Env: mergeEnv(helperEnv("normal")),
	}, sdk.WithRuntimeBinary(bin, args...))
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer h.Close()

	var streamed []string
	result, err := h.Session("s1").Run(ctx, sdk.Text("hello"),
		sdk.OnEvent(func(e sdk.Event) { streamed = append(streamed, e.Type) }))
	if err != nil {
		t.Fatalf("run: %v", err)
	}
	if result.FinalResponse != "hello back" {
		t.Errorf("FinalResponse = %q", result.FinalResponse)
	}
	if result.FinishReason != "completed" {
		t.Errorf("FinishReason = %q", result.FinishReason)
	}
	if len(streamed) == 0 {
		t.Error("nothing was streamed")
	}
}

// The interval opens at this prompt's own receipt. Anything the session was
// already doing belongs to whoever asked for it, and must not appear in this
// result — the scripted runtime emits exactly such an event first.
func TestJSONRPCIntervalStartsAtOurReceipt(t *testing.T) {
	bin, args := helperRuntime(t, "noise-first")
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{CWD: dir, Env: mergeEnv(helperEnv("noise-first"))},
		sdk.WithRuntimeBinary(bin, args...))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	result, err := h.Session("s1").Run(ctx, sdk.Text("hello"))
	if err != nil {
		t.Fatal(err)
	}
	for _, e := range result.Events {
		if strings.Contains(string(e.Raw), "from-before") {
			t.Fatalf("an event from before the prompt was collected: %s", e.Raw)
		}
	}
	if result.FinalResponse != "mine" {
		t.Errorf("FinalResponse = %q, want %q", result.FinalResponse, "mine")
	}
}

// A runtime that dies mid-run must report that, rather than hanging until the
// caller's context expires.
func TestJSONRPCTransportClosed(t *testing.T) {
	bin, args := helperRuntime(t, "die-after-prompt")
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{CWD: dir, Env: mergeEnv(helperEnv("die-after-prompt"))},
		sdk.WithRuntimeBinary(bin, args...))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	start := time.Now()
	_, err = h.Session("s1").Run(ctx, sdk.Text("hello"))
	if !errors.Is(err, sdk.ErrTransportClosed) {
		t.Fatalf("got %v, want ErrTransportClosed", err)
	}
	if time.Since(start) > 10*time.Second {
		t.Error("the run waited for its context instead of noticing the runtime had gone")
	}
}

// An error response is the runtime refusing, which is different from the
// runtime breaking.
func TestJSONRPCErrorResponse(t *testing.T) {
	bin, args := helperRuntime(t, "refuse")
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{CWD: dir, Env: mergeEnv(helperEnv("refuse"))},
		sdk.WithRuntimeBinary(bin, args...))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	_, err = h.Session("s1").Run(ctx, sdk.Text("hello"))
	var rpcErr *sdk.RPCError
	if !errors.As(err, &rpcErr) {
		t.Fatalf("got %v, want an RPCError", err)
	}
	if rpcErr.Code != -32000 || !strings.Contains(rpcErr.Message, "no such session") {
		t.Errorf("RPCError = %+v", rpcErr)
	}
}

// A runtime that will not initialize reports what it wrote to stderr, which is
// usually the only description of the problem that exists.
func TestJSONRPCStartFailureCarriesStderr(t *testing.T) {
	bin, args := helperRuntime(t, "fail-to-start")
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	_, err := sdk.Open(ctx, sdk.Config{CWD: dir, Env: mergeEnv(helperEnv("fail-to-start"))},
		sdk.WithRuntimeBinary(bin, args...))
	if err == nil {
		t.Fatal("a runtime that exits at once should fail to open")
	}
	var startErr *sdk.StartError
	if errors.As(err, &startErr) && !strings.Contains(startErr.Stderr, "cannot find the model catalog") {
		t.Errorf("the failure lost the runtime's own diagnostics: %v", err)
	}
}

func TestJSONRPCMissingBinary(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := sdk.Open(ctx, sdk.Config{CWD: t.TempDir()},
		sdk.WithRuntimeBinary(filepath.Join(t.TempDir(), "not-a-runtime")))
	if err == nil {
		t.Fatal("expected opening a nonexistent runtime to fail")
	}
	if !strings.Contains(err.Error(), "cannot start") {
		t.Errorf("unhelpful error: %v", err)
	}
}

// mergeEnv keeps the test binary's own environment (it needs PATH and the Go
// test flags) and adds the helper's.
func mergeEnv(extra []string) map[string]string {
	env := map[string]string{}
	for _, kv := range os.Environ() {
		if k, v, ok := strings.Cut(kv, "="); ok {
			env[k] = v
		}
	}
	for _, kv := range extra {
		if k, v, ok := strings.Cut(kv, "="); ok {
			env[k] = v
		}
	}
	return env
}

var _ = exec.Command
