package sdk

import (
	"context"

	runtime "github.com/robomotionio/go-deepseek/internal/runtime"
)

// Components written in Go.
//
// The harness is built out of cordis components, and a component is a coeffect
// specification — the services it declares it needs — paired with an effect
// function that installs what it contributes. A Go plugin here is that, with the
// effect function in Go, mounted by the same loader into the same tree.
//
// What reaches Go is not a fixed list of capabilities. Apply receives the
// component's own context and can call any path on it, so anything the harness
// offers is reachable by name — including whatever it gains upstream, on the day
// it lands.
//
//	sdk.Plugin{
//	    ID:      "policy",
//	    Inject:  []string{"tools"},
//	    Provide: []string{"approval"},
//	    Apply: func(ctx *sdk.Context) error {
//	        _, err := ctx.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
//	            next, err := ctx.Value(args[len(args)-1]).Object()   // the waterfall continues
//	            if err != nil {
//	                return nil, err
//	            }
//	            decision, err := next.Invoke()
//	            return json.RawMessage(decision.JSON()), err
//	        })
//	        return err
//	    },
//	}
//
// The one thing Go cannot do is be hot-replaced: retracting a component's code
// needs a module registry to evict it from, and Go has none. The FIBER is fully
// composable — it mounts, unmounts, waits for a dependency, reverts its effects —
// but replacing the Go behind it means restarting the process.
//
// Tools are the common case, kept short:
//
// The harness is made of plugins, and the tools an agent calls come from them.
// A Go plugin is one of those — mounted by the same loader, in the same tree,
// with the same lifecycle — whose tools are Go functions. That is the answer to
// "how does the agent query our database, call our internal API, talk to the
// device on the bench": not by being handed a shell and a hope, but by being
// given a named function with a schema, which runs in this process under this
// program's control.
//
//	h, err := sdk.Open(ctx, sdk.Config{
//	    CWD: workdir,
//	    Plugins: []sdk.Plugin{{
//	        ID: "inventory",
//	        Tools: []sdk.Tool{{
//	            Name:        "stock_level",
//	            Description: "The number of units of a part that are in stock.",
//	            Parameters: map[string]any{
//	                "sku": map[string]any{"type": "string", "required": true,
//	                    "description": "The part number."},
//	            },
//	            Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
//	                var in struct{ SKU string `json:"sku"` }
//	                if err := json.Unmarshal(args, &in); err != nil {
//	                    return "", err
//	                }
//	                return inventory.Report(ctx, in.SKU)
//	            },
//	        }},
//	    }},
//	})
//
// Each Execute runs on its own goroutine, not the one that owns the JavaScript
// world, so a tool that takes a second costs the agent a second of waiting
// rather than stopping everything else the harness is doing. Its context is
// cancelled when the harness closes and when the harness abandons the call — a
// cancelled turn, a tool-call timeout — so honouring it is what stops work the
// agent is no longer waiting for.
//
// In process only. A prebuilt runtime driven over JSON-RPC (see
// WithRuntimeBinary) is a separate program and cannot call back into this one;
// Open reports that rather than starting a harness whose tools would be missing.

// Plugin is a cordis component implemented in Go: a coeffect specification
// (Inject), the services it becomes a provider of (Provide), and an effect
// function (Apply) that installs what it contributes.
type Plugin = runtime.Plugin

// Tool is one function the agent can call. See Plugin for the whole shape.
type Tool = runtime.Tool

// Context is a Go component's cordis context — the component's own view of the
// system. Apply receives one, and everything the harness offers is reachable
// through it by name: register a tool, provide a service, read one it declared,
// listen to an event, wrap every tool call, install a revertible effect.
type Context = runtime.Context

// Object is something live in the harness that Go is holding: a service, a
// session, a disposer. Calls on it reach the one that exists.
type Object = runtime.Object

// Value is one answer from the harness.
type Value = runtime.Value

// Handler is a Go function the harness can call. Arguments arrive as JSON, one
// per parameter.
type Handler = runtime.Handler

// Undefined is JavaScript's undefined, as a value a Go plugin can return.
//
// Go has no undefined and neither has JSON, so a Go nil crosses as null — and
// the harness distinguishes the two where it matters most quietly. A tool guard
// reads `string | undefined`: a string denies the call, undefined means "no
// objection", and the registry tests against undefined rather than for
// truthiness. A guard returning nil denies EVERY call in the harness with the
// reason "null".
//
//	nothing := sdk.Undefined()
//	ctx.Call("tools.guard", ctx.SyncFunc(func(args []json.RawMessage) (any, error) {
//	    if forbidden(args) {
//	        return "that file holds credentials", nil
//	    }
//	    return nothing, nil
//	}))
//
// It is a marker, not a held reference: no bridge call, no handle, and safe to
// return from a SyncFunc.
func Undefined() any { return runtime.Undefined() }

// ToolSchema is one tool as the model is shown it.
type ToolSchema = runtime.ToolSchema

// toolLister is the carrier's optional ability to say what tools it has. The
// in-process carrier can ask the registry; a JSON-RPC one has no request for it.
type toolLister interface {
	Tools(ctx context.Context) ([]ToolSchema, error)
}

// Tools lists every tool the agent can call — the harness's own and any a Go
// plugin registered — as the model is shown them.
//
// It is the way to confirm a plugin registered what it meant to, and the way to
// see what a composition actually provides, which is otherwise a question only
// the model gets an answer to.
//
// In process only: a runtime driven over JSON-RPC reports ErrUnsupported.
func (h *Harness) Tools(ctx context.Context) ([]ToolSchema, error) {
	h.mu.Lock()
	closed := h.closed
	h.mu.Unlock()
	if closed {
		return nil, ErrClosed
	}
	lister, ok := h.carrier.(toolLister)
	if !ok {
		return nil, ErrUnsupported
	}
	return lister.Tools(ctx)
}
