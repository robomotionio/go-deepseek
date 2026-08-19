// Package sdk is a Go client for the DeepSeek Harness.
//
// It is the same shape as the official Python SDK — a harness, sessions, a run
// that returns the final response, the finish reason and the events it saw — so
// that a program written against one translates to the other:
//
//	h, err := sdk.Open(ctx, sdk.Config{Model: "deepseek-v4-flash"})
//	if err != nil { return err }
//	defer h.Close()
//
//	result, err := h.Run(ctx, sdk.Text("Say hi."))
//	fmt.Println(result.FinalResponse, result.FinishReason)
//
// # Two carriers
//
// The harness can be reached two ways, and this package hides which:
//
//   - In process (the default). The harness runs inside this program, on a
//     pure-Go JavaScript engine, with no subprocess and nothing installed. See
//     the parent package.
//   - Over JSON-RPC. A prebuilt harness executable is launched and spoken to
//     over newline-delimited JSON on its stdin and stdout — the same protocol
//     and the same wire vocabulary as the Python SDK. Use it with
//     [WithRuntimeBinary] when you have that executable and want it rather than
//     the embedded one.
//
// The carrier changes nothing above it: the result of a run, the events, the
// errors and their meanings are identical either way.
//
// # What a run means
//
// A run owns the interval from the prompt being durably received to the next
// whole-agent idle, and its result describes THAT INTERVAL rather than an answer
// attributable to the prompt. Anything else queued — steering, injected context,
// a subagent finishing — contributes to it too. This is the Python SDK's rule
// and it is worth restating, because "the answer to my question" is the natural
// reading and it is not what the field is.
//
// FinalResponse is the last committed assistant text in the interval;
// FinishReason is the kind of its last turn/end ("completed", "max-tokens",
// "error", …), and is empty when no turn ended.
package sdk
