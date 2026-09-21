package runtime

import (
	"context"
	"net"
	"strings"
	"testing"
	"time"
)

// A turn's promise survives a garbage collection while Go awaits it.
//
// goant does not root a Value only Go holds, and the promise run() returned
// was held by nothing else — so a collection during the await swept it and
// Go read back whatever was allocated into its slot: an answer of "" and
// "cannot convert object to primitive value". Live, that was every second turn
// on a long-lived harness. Here the collection is forced at the worst moment,
// right after the turn begins, and the model is a port nobody listens on — so
// the turn fails quickly and offline, and what matters is that Go reads the
// failure it actually had.
func TestATurnSurvivesACollection(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a moment")
	}
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	closed := listener.Addr().String()
	listener.Close()

	dir := t.TempDir()
	created, err := New(Config{
		CWD:      dir,
		Model:    "deepseek-v4-flash",
		Provider: "deepseek-official",
		BaseURL:  "http://" + closed + "/v1",
		Env:      map[string]string{"DEEPSEEK_API_KEY": "sk-not-a-real-key", "HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	h := created.(*harness)
	h.collectAfterBegin = true
	defer h.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	if err := h.Start(ctx); err != nil {
		t.Fatal(err)
	}
	for turn := 1; turn <= 2; turn++ {
		_, err := h.Run(ctx, "collected", Text("hello"))
		if err == nil {
			t.Fatalf("turn %d: a model nobody serves answered", turn)
		}
		if strings.Contains(err.Error(), "turn result") || strings.Contains(err.Error(), "primitive") {
			t.Fatalf("turn %d: Go read a swept promise instead of the turn's failure: %v", turn, err)
		}
		t.Logf("turn %d failed as it should: %v", turn, err)
	}
}
