package deepseek_test

import (
	"context"
	"os"
	"testing"
	"time"

	deepseek "github.com/robomotionio/go-deepseek"
)

// The gate: the composition boots on goant, with no Node.js involved.
func TestBootsTheComposition(t *testing.T) {
	dir := t.TempDir()
	h, err := deepseek.New(deepseek.Config{
		CWD:      dir,
		Model:    "deepseek-v4-flash",
		Provider: "deepseek-official",
		Env:      map[string]string{"DEEPSEEK_API_KEY": "sk-not-used-for-boot", "HOME": dir},
		Stdout:   func(p []byte) { os.Stdout.Write(p) },
		Stderr:   func(p []byte) { os.Stderr.Write(p) },
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	start := time.Now()
	if err := h.Start(ctx); err != nil {
		t.Fatalf("start: %v", err)
	}
	t.Logf("booted in %v", time.Since(start))
}
