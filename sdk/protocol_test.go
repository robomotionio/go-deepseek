package sdk_test

import (
	"testing"

	"github.com/robomotionio/go-deepseek/sdk"
)

// The wire protocol is pinned, not inherited. Upstream's default became
// "messages" in harness 0.1.5, which resolves BaseURL to <BaseURL>/v1/messages;
// every gateway a caller has pointed BaseURL at speaks chat completions.
// Measured against OpenRouter on 2026-09-21: chat completions answers, and the
// same request over "messages" is refused with "Invalid Anthropic Messages API
// request (400)" — so inheriting the default would have broken the gateway
// this package is tested through.
func TestComposePinsTheProtocol(t *testing.T) {
	for _, tc := range []struct {
		protocol, want string
	}{{"", "chat-completions"}, {"messages", "messages"}, {"chat-completions", "chat-completions"}} {
		entries := sdk.Compose(sdk.Config{CWD: t.TempDir(), APIKey: "x", Protocol: tc.protocol})
		var got any
		for _, entry := range entries {
			if entry.ID == "llm-deepseek" {
				got = entry.Config["protocol"]
			}
		}
		if got != tc.want {
			t.Errorf("Protocol %q composed protocol %v, want %q", tc.protocol, got, tc.want)
		}
	}
}
