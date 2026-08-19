package runtime_test

import (
	"context"
	"os"
	"runtime"
	"testing"
	"time"

	dsh "github.com/robomotionio/go-deepseek/internal/runtime"
)

// What the gate is supposed to measure: how long a cold boot takes, and what it
// costs in memory. Both are numbers the plan asks for and neither is obvious —
// the harness is ~200k lines of JavaScript, parsed by an engine that is one to
// two orders of magnitude slower than V8 at compute.
func TestBootCost(t *testing.T) {
	dir := t.TempDir()
	var before, after runtime.MemStats
	runtime.GC()
	runtime.ReadMemStats(&before)

	h, err := dsh.New(dsh.Config{
		CWD:      dir,
		Model:    "deepseek-v4-flash",
		Provider: "deepseek-official",
		Env:      map[string]string{"DEEPSEEK_API_KEY": "not-used-for-boot", "HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	boot := time.Since(start)

	runtime.GC()
	runtime.ReadMemStats(&after)
	t.Logf("cold boot: %v", boot)
	t.Logf("heap after boot: %.1f MB (delta %.1f MB)",
		float64(after.HeapAlloc)/(1<<20), float64(after.HeapAlloc-before.HeapAlloc)/(1<<20))
	t.Logf("peak process RSS proxy (Sys): %.1f MB", float64(after.Sys)/(1<<20))

	// A guard rather than a benchmark: the number that matters is whether a host
	// can boot this at all, and ten seconds would mean it cannot.
	if boot > 30*time.Second {
		t.Errorf("cold boot took %v, which is too slow to be worth having", boot)
	}
	if os.Getenv("DSH_PRINT_BOOT") != "" {
		os.Stdout.WriteString(boot.String() + "\n")
	}
}
