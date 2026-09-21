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
		Model:   openRouterModel(),
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

// openRouterModel is the model the gateway tests ask OpenRouter for: DeepSeek's
// current flash model unless OPENROUTER_MODEL names another. One place, because
// a gateway's model ids move and a test pinned to a retired one fails as
// "no endpoints found", which reads like an outage.
func openRouterModel() string {
	if model := os.Getenv("OPENROUTER_MODEL"); model != "" {
		return model
	}
	return "deepseek/deepseek-v4.1-flash"
}

// Two turns on one session of one long-lived harness — the way a robot node
// runs. The first turn is too short to trigger a collection; the second was
// long enough, and until 0.4.1 the collector swept the promise Go was awaiting
// (see runtime.TestATurnSurvivesACollection). The second answer also proves
// the history carried.
func TestLiveTwoTurnsOneHarness(t *testing.T) {
	key := os.Getenv("OPENROUTER_API_KEY")
	if key == "" {
		t.Skip("set OPENROUTER_API_KEY to run the two-turn session")
	}
	dir := t.TempDir()
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Minute)
	defer cancel()
	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL:     "https://openrouter.ai/api/v1",
		APIKey:      key,
		Model:       openRouterModel(),
		CWD:         dir,
		Env:         map[string]string{"HOME": dir},
		MemoryLimit: 512 << 20,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()
	session := h.Session("two-turns")
	for i, prompt := range []string{
		"Remember this number: 4271. Just acknowledge.",
		"What number did I ask you to remember? Answer with digits only.",
		"And that number plus one? Digits only.",
	} {
		result, err := session.Run(ctx, sdk.Text(prompt))
		if err != nil {
			t.Fatalf("turn %d: %v", i+1, err)
		}
		t.Logf("turn %d said %q", i+1, result.FinalResponse)
		if i == 1 && !strings.Contains(result.FinalResponse, "4271") {
			t.Errorf("the session did not carry history: %q", result.FinalResponse)
		}
	}
}
