package main

// The handset: `dial`, `press` and `hangup`, in Go.
//
// The agent has no other way to reach anything. As in examples 05, 10 and 12,
// `@deepseek-ai/dsh-tool-web` is bundled but injects `web`, which nothing here
// provides, so it mounts nothing — the agent has no network, and it has no
// telephone either until this component hands it one.
//
// What a telephone is, for an agent, is a smaller thing than a telephone: a
// way to place a call, a way to press keys, and a way to hang up. The audio
// comes back as text, because text is what the model listens with — but it is
// the IVR's own prompt, word for word, exactly what a caller would hear.
//
// The fence is a Go decision, and it is one number wide. A handset that
// dialed whatever the model wrote would be a modem to anywhere; this one
// reaches the bank's automated line and refuses everything else with a reason
// the model can read.

import (
	"context"
	"encoding/json"

	"github.com/robomotionio/go-deepseek/sdk"
)

type handset struct {
	line *ivr
}

func newHandset(line *ivr) *handset { return &handset{line: line} }

func (h *handset) plugin() sdk.Plugin {
	return sdk.Plugin{
		ID:     "handset",
		Inject: []string{"tools"},
		Apply: func(ctx *sdk.Context) error {
			if err := ctx.RegisterTool(sdk.Tool{
				Name: "dial",
				Description: "Place a call. The line answers and reads its first menu back as " +
					"text — this is the only way to reach anything; there is no other phone " +
					"and no network. Dialing during a call hangs up and starts over.",
				Parameters: map[string]any{
					"number": map[string]any{
						"type": "string", "required": true,
						"description": `The number to call, e.g. "1-800-634-7100".`,
					},
				},
				Execute: h.dial,
			}); err != nil {
				return err
			}
			if err := ctx.RegisterTool(sdk.Tool{
				Name: "press",
				Description: "Press keys on the keypad, in order: digits, star and pound — " +
					`"2", "731942#", or a whole route like "23". You can key ahead: menus ` +
					"keyed past are skipped unheard, exactly as for a caller who knows the " +
					"tree, and what comes back is the prompt where you land. Pressing 0 " +
					"replays the menu you are in; star returns to the previous one.",
				Parameters: map[string]any{
					"keys": map[string]any{
						"type": "string", "required": true,
						"description": "The keys, in the order to press them.",
					},
				},
				Execute: h.press,
			}); err != nil {
				return err
			}
			return ctx.RegisterTool(sdk.Tool{
				Name: "hangup",
				Description: "Hang up the call. Dialing again starts a fresh call at the main " +
					"menu, unauthenticated.",
				Execute: h.hangup,
			})
		},
	}
}

func (h *handset) dial(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		Number string `json:"number"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	return h.line.dial(in.Number)
}

func (h *handset) press(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		Keys string `json:"keys"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	return h.line.press(in.Keys)
}

func (h *handset) hangup(_ context.Context, _ json.RawMessage) (string, error) {
	return h.line.hangupCall(), nil
}
