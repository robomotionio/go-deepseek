package sdk_test

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// A gateway is configured with BaseURL, APIKey and the gateway's model id, and
// nothing else — Provider stays as it is, because it names the ROUTE the
// composition registers rather than the vendor at the other end. That
// distinction is the one thing about this that surprises people, so it has a
// test rather than only a paragraph.
func TestLiveGateway(t *testing.T) {
	key := os.Getenv("OPENROUTER_API_KEY")
	if key == "" {
		t.Skip("set OPENROUTER_API_KEY to run the gateway turn")
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL: "https://openrouter.ai/api/v1",
		APIKey:  key,
		Model:   "deepseek/deepseek-v4-flash-0731",
		CWD:     dir,
		Env:     map[string]string{"HOME": dir},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx, sdk.Text("Reply with exactly the word GATEWAY-OK and nothing else."))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%v, finish=%q, said %q", result.Duration, result.FinishReason, result.FinalResponse)
	if !strings.Contains(strings.ToUpper(result.FinalResponse), "GATEWAY-OK") {
		t.Errorf("unexpected answer: %q", result.FinalResponse)
	}
}
