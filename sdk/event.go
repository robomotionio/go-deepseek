package sdk

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Block is one piece of a prompt. The harness accepts a list of them; Text is
// the ordinary case.
type Block struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// Input is what a session is asked to work on.
type Input []Block

// Text is a prompt that is a sentence.
func Text(s string) Input { return Input{{Type: "text", Text: s}} }

// Blocks is a prompt assembled from parts.
func Blocks(blocks ...Block) Input { return Input(blocks) }

// Event is one entry from a session's log, in the harness's own vocabulary:
// turn/start, assistant/chunk, assistant/message, tool/call, tool/result,
// turn/end and the rest.
//
// Data is left as raw JSON on purpose. The harness defines dozens of event
// types whose shapes move with it, and a Go struct per type would be a
// translation to maintain against every release — for consumers that mostly
// forward events, count them, or look at two fields. Decode what you need:
//
//	var chunk struct{ Chunk struct{ Text string } }
//	event.Decode(&chunk)
type Event struct {
	// Type is the event kind, e.g. "assistant/message".
	Type string `json:"type"`
	// Seq is the session-log sequence number, which orders events within a
	// session.
	Seq int64 `json:"seq"`
	// Time is the millisecond timestamp the harness recorded.
	Time int64 `json:"time"`
	// Data is the event's payload.
	Data json.RawMessage `json:"data,omitempty"`
	// Raw is the whole envelope as it arrived, for forwarding it on unchanged.
	Raw json.RawMessage `json:"-"`
}

// Decode unmarshals the event's data into v.
func (e Event) Decode(v any) error {
	if len(e.Data) == 0 {
		return nil
	}
	return json.Unmarshal(e.Data, v)
}

// Notification is a message from the harness that is not part of a session log:
// a status change, a subagent starting, a session being created. Session events
// arrive as notifications too, with Method "session.event".
type Notification struct {
	// Method is the notification name, e.g. "session.status".
	Method string `json:"method"`
	// SessionID is the session it concerns, when it concerns one.
	SessionID string `json:"sessionId,omitempty"`
	// Params is the payload as it arrived.
	Params json.RawMessage `json:"params,omitempty"`
}

// Decode unmarshals the notification's params into v.
func (n Notification) Decode(v any) error {
	if len(n.Params) == 0 {
		return nil
	}
	return json.Unmarshal(n.Params, v)
}

// Event method names on the wire.
const (
	methodSessionEvent  = "session.event"
	methodSessionStatus = "session.status"
)

// Event types this package reads. Everything else passes through untouched.
const (
	EventAssistantMessage = "assistant/message"
	EventTurnEnd          = "turn/end"
	EventToolCall         = "tool/call"
	EventToolResult       = "tool/result"
	EventInboxSpliced     = "agent/inbox/spliced"
)

// FinalResponse is the text of the last assistant message in the events — the
// answer as a caller means it, with tool calls and reasoning left out.
//
// Empty when the interval committed no assistant message, which happens for a
// turn that only ran tools, or one that failed.
func FinalResponse(events []Event) string {
	for i := len(events) - 1; i >= 0; i-- {
		if events[i].Type != EventAssistantMessage {
			continue
		}
		var data struct {
			Message struct {
				Content []struct {
					Type string `json:"type"`
					Text string `json:"text"`
				} `json:"content"`
			} `json:"message"`
		}
		if err := events[i].Decode(&data); err != nil {
			return ""
		}
		var out strings.Builder
		for _, block := range data.Message.Content {
			if block.Type == "text" {
				out.WriteString(block.Text)
			}
		}
		return out.String()
	}
	return ""
}

// FinishReason is the kind of the last turn that ended: "completed",
// "max-tokens", "error", and so on. It is empty when no turn ended in the
// interval.
//
// A turn/end without a string reason kind is a runtime that is not speaking the
// protocol, and is reported as ErrProtocol rather than papered over — the field
// is how a caller tells success from a truncated or failed turn, and a wrong
// answer there is worse than none.
func FinishReason(events []Event) (string, error) {
	for i := len(events) - 1; i >= 0; i-- {
		if events[i].Type != EventTurnEnd {
			continue
		}
		var data struct {
			Reason struct {
				Kind  string          `json:"kind"`
				Error json.RawMessage `json:"error"`
			} `json:"reason"`
		}
		if err := events[i].Decode(&data); err != nil {
			return "", fmt.Errorf("%w: turn/end payload: %v", ErrProtocol, err)
		}
		if data.Reason.Kind == "" {
			return "", fmt.Errorf("%w: turn/end has no string data.reason.kind", ErrProtocol)
		}
		return data.Reason.Kind, nil
	}
	return "", nil
}

// TurnError is the provider error a failed turn ended with, if it failed.
//
// A turn that ends in an error still ends: FinishReason reports "error" and the
// events describe what happened. This reads the reason out so a caller does not
// have to know the envelope.
func TurnError(events []Event) error {
	for i := len(events) - 1; i >= 0; i-- {
		if events[i].Type != EventTurnEnd {
			continue
		}
		var data struct {
			Reason struct {
				Kind  string `json:"kind"`
				Error struct {
					Message string `json:"message"`
					Code    string `json:"code"`
					Status  int    `json:"status"`
				} `json:"error"`
			} `json:"reason"`
		}
		if err := events[i].Decode(&data); err != nil || data.Reason.Kind != "error" {
			return nil
		}
		e := data.Reason.Error
		switch {
		case e.Code != "" && e.Status != 0:
			return fmt.Errorf("%w: %s (%s %d)", ErrTurnFailed, e.Message, e.Code, e.Status)
		case e.Code != "":
			return fmt.Errorf("%w: %s (%s)", ErrTurnFailed, e.Message, e.Code)
		case e.Message != "":
			return fmt.Errorf("%w: %s", ErrTurnFailed, e.Message)
		}
		return ErrTurnFailed
	}
	return nil
}

// ToolCalls counts the tool calls in the events, which is the cheapest useful
// question to ask about a turn that did work rather than only answering.
func ToolCalls(events []Event) int {
	n := 0
	for _, event := range events {
		if event.Type == EventToolCall {
			n++
		}
	}
	return n
}
