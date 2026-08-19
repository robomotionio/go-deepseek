package sdk_test

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// runHelper is the scripted runtime the JSON-RPC tests drive: it speaks the
// protocol over stdin and stdout, badly or well according to its script.
//
// Writing it here rather than as a fixture keeps it honest — it reads the same
// requests a real runtime would, and its scripts describe failures ("die after
// the prompt", "refuse the session") in the terms the tests are about.
func runHelper(script string) {
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()

	send := func(v any) {
		payload, _ := json.Marshal(v)
		out.Write(payload)
		out.WriteByte('\n')
		out.Flush()
	}
	notify := func(method string, params any) {
		send(map[string]any{"jsonrpc": "2.0", "method": method, "params": params})
	}
	sessionEvent := func(sessionID string, event map[string]any) {
		notify("session.event", map[string]any{"sessionId": sessionID, "event": event})
	}

	if script == "fail-to-start" {
		fmt.Fprintln(os.Stderr, "dsh: cannot find the model catalog")
		os.Exit(2)
	}

	reader := bufio.NewReader(os.Stdin)
	for {
		line, err := reader.ReadString('\n')
		if strings.TrimSpace(line) == "" && err != nil {
			return
		}
		var request struct {
			ID     int64           `json:"id"`
			Method string          `json:"method"`
			Params json.RawMessage `json:"params"`
		}
		if json.Unmarshal([]byte(line), &request) != nil {
			if err != nil {
				return
			}
			continue
		}

		switch request.Method {
		case "initialize":
			send(map[string]any{
				"jsonrpc": "2.0", "id": request.ID,
				"result": map[string]any{"serverInfo": map[string]any{"name": "helper", "version": "0"}},
			})

		case "session/prompt":
			var params struct {
				SessionID string `json:"sessionId"`
			}
			json.Unmarshal(request.Params, &params)

			if script == "refuse" {
				send(map[string]any{
					"jsonrpc": "2.0", "id": request.ID,
					"error": map[string]any{"code": -32000, "message": "no such session"},
				})
				continue
			}

			// An event from before this prompt: the interval must not include it.
			if script == "noise-first" {
				sessionEvent(params.SessionID, map[string]any{
					"type": "assistant/message", "seq": 0, "time": 1,
					"data": map[string]any{"message": map[string]any{
						"content": []any{map[string]any{"type": "text", "text": "from-before"}},
					}},
				})
			}

			messageID := "msg-1"
			send(map[string]any{
				"jsonrpc": "2.0", "id": request.ID,
				"result": map[string]any{"messageId": messageID},
			})

			if script == "die-after-prompt" {
				os.Exit(1)
			}

			// The durable receipt that opens the interval.
			sessionEvent(params.SessionID, map[string]any{
				"type": "agent/inbox/spliced", "seq": 1, "time": 2,
				"data": map[string]any{"inserted": []any{map[string]any{"id": messageID}}},
			})
			sessionEvent(params.SessionID, map[string]any{
				"type": "turn/start", "seq": 2, "time": 3,
				"data": map[string]any{"turn": 1},
			})
			text := "hello back"
			if script == "noise-first" {
				text = "mine"
			}
			sessionEvent(params.SessionID, map[string]any{
				"type": "assistant/message", "seq": 3, "time": 4,
				"data": map[string]any{"message": map[string]any{
					"content": []any{map[string]any{"type": "text", "text": text}},
				}},
			})
			sessionEvent(params.SessionID, map[string]any{
				"type": "turn/end", "seq": 4, "time": 5,
				"data": map[string]any{"turn": 1, "reason": map[string]any{"kind": "completed"}},
			})
			notify("session.status", map[string]any{"sessionId": params.SessionID, "status": "idle"})
		}

		if err != nil {
			return
		}
	}
}
