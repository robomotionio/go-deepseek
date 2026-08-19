package runtime

// Plugins written in Go.
//
// The harness is built out of cordis components, and the paper behind cordis
// defines one precisely: a component pairs a COEFFECT SPECIFICATION — the
// services it declares it needs — with an EFFECT FUNCTION that installs what it
// contributes. Instantiating it produces a fiber with a lifecycle, and every
// mutation the effect function makes through the context is tracked so that
// unloading recovers it.
//
// A Go plugin here is that, with the effect function in Go:
//
//	Plugin{
//	    ID:      "approvals",
//	    Inject:  []string{"tools"},          // the coeffect specification
//	    Provide: []string{"approval"},       // what it becomes a provider of
//	    Apply: func(ctx *Context) error {    // the effect function
//	        return ctx.Provide("approval", map[string]any{...})
//	    },
//	}
//
// What reaches Go is not a fixed list of capabilities. Apply receives the
// component's own cordis context and can call ANY path on it — register a tool,
// provide a service, listen to an event, wrap every tool call, contribute a
// prompt section, install a revertible effect — because the bridge names paths
// rather than enumerating features. Whatever the harness gains upstream is
// reachable the day it lands, without a change here.
//
// The one thing Go cannot do is be hot-replaced. Retracting a component's code
// needs a module registry to evict it from, and Go has none: a Go plugin's code
// is compiled in. Its FIBER is fully composable — it mounts, unmounts, reacts to
// a dependency appearing or leaving, and recovers its effects — but replacing
// the Go behind it means restarting the process.

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// Plugin is a cordis component implemented in Go.
type Plugin struct {
	// ID names the component. It is the composition entry's id, the name the
	// harness reports, and what the generated module's specifier is built from,
	// so it must be unique among the composition's entries.
	ID string

	// Inject is the coeffect specification: the services this component needs.
	// It is enforced, not documentation — the context refuses to resolve a
	// service that was not declared, and the component stays unmounted until
	// every declared service has a provider, then unmounts again if one leaves.
	//
	// Registering a tool needs "tools"; it is added automatically when Tools is
	// used.
	Inject []string

	// Provide lists the services this component registers, which is what lets
	// other components inject them. The registration itself happens in Apply,
	// through Context.Provide.
	Provide []string

	// Config is the entry's configuration, handed to Apply as Context.Config.
	Config map[string]any

	// Apply is the effect function: it runs when the component mounts, on its
	// own goroutine, and everything it installs is recovered when the component
	// unmounts. Returning an error fails the mount, which fails the composition
	// rather than leaving a half-built tree.
	Apply func(ctx *Context) error

	// Tools is the common case made short: these are registered on ctx.tools
	// when the component mounts, before Apply runs. A plugin may use Tools,
	// Apply, or both.
	Tools []Tool
}

// Tool is one function the agent can call.
type Tool struct {
	// Name is what the model calls. It is global across the composition: two
	// tools cannot share a name, including one from the harness itself.
	Name string

	// Description is how the model decides to call this rather than something
	// else. It is not documentation — it is the whole of what the model knows
	// about the tool beyond its parameters, so an empty one is refused.
	Description string

	// Parameters is the harness's parameter spec: one entry per named parameter,
	// each a JSON-Schema-shaped map with an optional `required: true`.
	//
	//	map[string]any{
	//	    "city": map[string]any{"type": "string", "required": true,
	//	        "description": "The city to report on."},
	//	}
	//
	// The harness compiles it and validates arguments against it before Execute
	// is reached, so a call that arrives has already been checked.
	Parameters map[string]any

	// Execute runs the call, on its own goroutine. Returning a value settles the
	// call; returning an error fails it, and the model is shown what the error
	// said — so the message is part of the interface.
	//
	// The context is cancelled when the harness closes and when the harness
	// abandons the call: a cancelled turn, a tool-call timeout.
	Execute func(ctx context.Context, args json.RawMessage) (string, error)
}

// pluginScheme keys a Go plugin's generated module. The scheme is what keeps it
// from ever colliding with a bundled package or a Node builtin.
const pluginScheme = "go:"

func (p Plugin) specifier() string { return pluginScheme + p.ID }

// injects returns the declared coeffects, with what the sugar implies.
func (p Plugin) injects() []string {
	declared := append([]string(nil), p.Inject...)
	if len(p.Tools) > 0 {
		for _, name := range declared {
			if name == "tools" {
				return declared
			}
		}
		declared = append(declared, "tools")
	}
	return declared
}

// Object is something in the JavaScript world that Go is holding: a context, a
// service, a session, a disposer. Calls on it reach the one that exists rather
// than a copy of it.
type Object struct {
	bridge *bridge
	ref    int64
}

// Call invokes a method by dotted path and returns what it produced. A promise
// is awaited, so Call answers with the value rather than the promise.
//
//	ctx.Call("tools.register", definition)
//	ctx.Call("emit", "my/event", payload)
//	fs.Call("readFile", path)
//
// Arguments are encoded as JSON, except for values made by Context.Func and
// Context.SyncFunc, which arrive as real functions, and other Objects, which
// arrive as themselves.
func (o *Object) Call(path string, args ...any) (Value, error) {
	raw, err := o.bridge.perform("call", o.ref, path, args)
	return Value{raw: raw, bridge: o.bridge}, err
}

// Get reads a property by dotted path.
func (o *Object) Get(path string) (Value, error) {
	raw, err := o.bridge.perform("get", o.ref, path, nil)
	return Value{raw: raw, bridge: o.bridge}, err
}

// At holds the value at a path so that it can be called on. This is how a
// service is reached: ctx.At("fs") is the filesystem service itself, not a
// snapshot of its fields.
func (o *Object) At(path string) (*Object, error) {
	raw, err := o.bridge.perform("hold", o.ref, path, nil)
	if err != nil {
		return nil, err
	}
	return Value{raw: raw, bridge: o.bridge}.Object()
}

// CallForObject invokes a method and holds its result, for a call that answers
// with something live rather than with data.
func (o *Object) CallForObject(path string, args ...any) (*Object, error) {
	raw, err := o.bridge.perform("callHold", o.ref, path, args)
	if err != nil {
		return nil, err
	}
	return Value{raw: raw, bridge: o.bridge}.Object()
}

// Invoke calls this object itself, for the ones that are functions — the
// disposer On and Provide answer with.
func (o *Object) Invoke(args ...any) (Value, error) {
	return o.Call("", args...)
}

// Release lets go of the object. Everything a component holds is released when
// it unmounts, so this is for a program that holds many and wants them gone
// sooner.
func (o *Object) Release() error {
	_, err := o.bridge.perform("call", 0, "__dshBridge.release", []any{o.ref})
	return err
}

// ref encodes an Object as an argument.
func (o *Object) MarshalJSON() ([]byte, error) { return json.Marshal(jsRef{Ref: o.ref}) }

// Value is one answer from the JavaScript world.
type Value struct {
	raw    json.RawMessage
	bridge *bridge
}

// JSON is the raw answer.
func (v Value) JSON() json.RawMessage { return v.raw }

// Decode unmarshals the answer.
func (v Value) Decode(out any) error {
	if len(v.raw) == 0 {
		return nil
	}
	return json.Unmarshal(v.raw, out)
}

// String renders the answer as text: a JSON string without its quotes, anything
// else as its JSON.
func (v Value) String() string {
	var text string
	if json.Unmarshal(v.raw, &text) == nil {
		return text
	}
	return string(v.raw)
}

// Object interprets the answer as something held. It is an error if it is not.
func (v Value) Object() (*Object, error) {
	var held jsRef
	if err := json.Unmarshal(v.raw, &held); err != nil || held.Ref == 0 {
		return nil, fmt.Errorf("deepseek: %s is data, not an object", truncate(string(v.raw)))
	}
	return &Object{bridge: v.bridge, ref: held.Ref}, nil
}

func truncate(s string) string {
	if len(s) > 120 {
		return s[:120] + "…"
	}
	return s
}

// Context is a Go plugin's cordis context: the component's own view of the
// system, through which it reads services and installs everything it
// contributes.
type Context struct {
	*Object

	// Plugin is the component's id.
	Plugin string

	// Config is the entry's configuration, as JSON.
	Config json.RawMessage
}

// Func makes a Go function callable from JavaScript. It runs on its own
// goroutine and answers with a promise, so it may block — which is what a tool's
// execute, an event listener or a service method usually needs to do.
func (c *Context) Func(fn Handler) any {
	return c.bridge.register(c.ref, fn, false)
}

// SyncFunc makes a Go function callable and answers immediately, on the
// goroutine that owns the JavaScript world.
//
// Use it only where cordis requires an answer rather than a promise: a tool's
// render, a guard's verdict, a prompt section's text. It must not block and must
// not call back across the bridge, because it is occupying the goroutine that
// would have to serve it.
func (c *Context) SyncFunc(fn Handler) any {
	return c.bridge.register(c.ref, fn, true)
}

// Service holds one of the services this component declared in Inject.
//
// An undeclared service is refused by the context itself: the declaration is a
// capability request, and reading past it is the error the paradigm exists to
// make impossible.
func (c *Context) Service(name string) (*Object, error) { return c.At(name) }

// Provide registers this component as the provider of a service. Other
// components that inject the name become satisfied, and unmounting this one
// withdraws the binding and unmounts them.
//
// The value is usually a map of methods made with Func:
//
//	ctx.Provide("approval", map[string]any{
//	    "request": ctx.Func(func(args []json.RawMessage) (any, error) { ... }),
//	})
func (c *Context) Provide(name string, value any) error {
	_, err := c.Call("provide", name, value)
	return err
}

// Set binds a value into the context's service store, the plain form of
// provision.
func (c *Context) Set(name string, value any) error {
	_, err := c.Call("set", name, value)
	return err
}

// On subscribes to an event and returns a disposer. Listening is a revertible
// effect, so unmounting removes the listener whether or not the disposer is
// called.
//
// This is the way into everything the harness announces, including the tool-call
// waterfalls — "tools/pre-execute", "tools/execute", "tools/post-execute" —
// which is how a Go plugin audits, gates or wraps every call the agent makes.
func (c *Context) On(event string, fn Handler) (*Object, error) {
	return c.CallForObject("on", event, c.Func(fn))
}

// Emit announces an event.
func (c *Context) Emit(event string, args ...any) error {
	_, err := c.Call("emit", append([]any{event}, args...)...)
	return err
}

// Effect installs a revertible effect whose inverse is Go. The inverse runs when
// the component unmounts, LIFO, interleaved correctly with the inverses cordis
// tracked itself.
//
// It runs SYNCHRONOUSLY, on the goroutine that owns the JavaScript world, and
// that is what buys the ordering: cordis invokes disposers last-installed-first,
// but an inverse that only STARTS the work and returns is ordered by nothing.
// An effect that opened something another effect went on to use would then be
// closed out of order, some of the time — which is the shape of bug that shows
// up once in eight runs and never in the one you are watching.
//
// So an inverse must not block and must not call back across the bridge. For
// teardown that needs to do either, use OnDispose.
func (c *Context) Effect(inverse func()) error {
	_, err := c.Call("effect", c.SyncFunc(func([]json.RawMessage) (any, error) {
		return c.SyncFunc(func([]json.RawMessage) (any, error) {
			inverse()
			return nil, nil
		}), nil
	}))
	return err
}

// OnDispose runs fn when the component unmounts, after every effect has been
// reverted, on a goroutine of its own and in reverse order of registration. This
// is where teardown that has to block belongs — draining a queue, closing a
// connection, waiting for a worker.
func (c *Context) OnDispose(fn func()) { c.bridge.onDispose(c.ref, fn) }

// Undefined is JavaScript's undefined, as a value a Go plugin can pass or
// return.
//
// It exists because Go has no undefined and JSON has no undefined, so a Go nil
// crosses the bridge as null — and the harness distinguishes the two in places
// where getting it wrong is silent and total. The tools guard is the sharp one.
// Its contract is `string | undefined`, where a string is a denial reason and
// undefined means "no objection", and the registry tests the result against
// undefined rather than for truthiness. A guard that returns nil therefore
// denies EVERY tool call in the harness, with the reason "null", and the agent
// spends its turn being told no by something that meant to say nothing.
//
//	nothing := runtime.Undefined()
//	ctx.Call("tools.guard", ctx.SyncFunc(func(args []json.RawMessage) (any, error) {
//	    if forbidden(args) {
//	        return "that file holds credentials", nil
//	    }
//	    return nothing, nil
//	}))
//
// It is a marker rather than a held reference, so it costs no bridge call and
// no handle: it is safe to return from SyncFunc, which must not call back
// across the bridge. Inside a map or a slice it works the same way, though note
// that a property set to undefined still EXISTS on the JavaScript object — an
// undefined value is not an absent key.
//
// One direction only. A JavaScript undefined reaching Go still arrives as null,
// because a Go value has nowhere else to put it.
func Undefined() any { return jsUndefined{Undefined: true} }

// Value interprets one argument a callback received, so that a handler can
// reach a live object JavaScript passed it — the `next` of a waterfall, a
// session, an execution.
//
//	next, err := ctx.Value(args[1]).Object()
//	decision, err := next.Invoke()
func (c *Context) Value(raw json.RawMessage) Value {
	return Value{raw: raw, bridge: c.bridge}
}

// Logger returns the component's named logger.
func (c *Context) Logger(name string) (*Object, error) {
	return c.CallForObject("logger", name)
}

// RegisterTool registers one tool on ctx.tools.
func (c *Context) RegisterTool(tool Tool) error {
	if err := validateTool(tool, c.Plugin); err != nil {
		return err
	}
	parameters := tool.Parameters
	if parameters == nil {
		parameters = map[string]any{}
	}
	execute := tool.Execute
	// defineTool lives on the global bridge object, not on the context: handle 0
	// is the global scope.
	global := &Object{bridge: c.bridge, ref: 0}
	definition, err := global.CallForObject("__dshBridge.defineTool", map[string]any{
		"name":        tool.Name,
		"description": tool.Description,
		"parameters":  parameters,
		"output": map[string]any{
			// The Go side answers with text, so the schema says text and the
			// rendering is the identity. A tool wanting structure puts JSON in it.
			"schema": map[string]any{"type": "string"},
			"render": c.SyncFunc(func(args []json.RawMessage) (any, error) {
				text := ""
				if len(args) > 1 {
					_ = json.Unmarshal(args[1], &text)
				}
				return []map[string]any{{"type": "text", "text": text}}, nil
			}),
		},
		"execute": c.Func(func(args []json.RawMessage) (any, error) {
			var arguments json.RawMessage = []byte("{}")
			if len(args) > 0 {
				arguments = args[0]
			}
			// The turn's own cancellation reaches the tool through the context
			// the harness gives the call; this one ends when the harness does.
			return execute(c.bridge.callContext(), arguments)
		}),
	})
	if err != nil {
		return err
	}
	_, err = c.Call("tools.register", definition)
	return err
}

// runApply mounts one Go component: the sugar first, then the effect function.
func (b *bridge) runApply(plugin *Plugin, ctx *Context) error {
	for _, tool := range plugin.Tools {
		if err := ctx.RegisterTool(tool); err != nil {
			return err
		}
	}
	if plugin.Apply == nil {
		return nil
	}
	return plugin.Apply(ctx)
}

// validatePlugins refuses what would otherwise fail during a mount, or worse,
// during a turn.
func validatePlugins(plugins []Plugin, entries []Entry) error {
	ids := map[string]bool{}
	owners := map[string]string{}
	for _, p := range plugins {
		if p.ID == "" {
			return fmt.Errorf("deepseek: a Go plugin has no ID")
		}
		if strings.ContainsAny(p.ID, " \t\n\"'\\") {
			return fmt.Errorf("deepseek: Go plugin %q: the ID is an identifier, not a sentence", p.ID)
		}
		if ids[p.ID] {
			return fmt.Errorf("deepseek: two Go plugins share the ID %q", p.ID)
		}
		ids[p.ID] = true
		for _, entry := range entries {
			if entry.ID == p.ID {
				return fmt.Errorf("deepseek: Go plugin %q collides with a composition entry of the same id", p.ID)
			}
		}
		if len(p.Tools) == 0 && p.Apply == nil {
			return fmt.Errorf("deepseek: Go plugin %q has neither Tools nor Apply, so it would contribute nothing", p.ID)
		}
		for _, tool := range p.Tools {
			if err := validateTool(tool, p.ID); err != nil {
				return err
			}
			if owner, ok := owners[tool.Name]; ok {
				return fmt.Errorf("deepseek: tool %q is registered by both %q and %q", tool.Name, owner, p.ID)
			}
			owners[tool.Name] = p.ID
		}
	}
	return nil
}

func validateTool(tool Tool, plugin string) error {
	switch {
	case tool.Name == "":
		return fmt.Errorf("deepseek: Go plugin %q has a tool with no name", plugin)
	case tool.Description == "":
		return fmt.Errorf("deepseek: tool %q has no description, which is all the model would have to go on", tool.Name)
	case tool.Execute == nil:
		return fmt.Errorf("deepseek: tool %q has no Execute", tool.Name)
	}
	return nil
}

// pluginModule generates the component's JavaScript face.
//
// It is small on purpose. The module exists to be a cordis component — to carry
// the name, the coeffect specification and the provided keys where the loader
// reads them, since those are read from the module rather than passed at
// runtime — and to hand its context to Go. Everything else happens across the
// bridge.
func pluginModule(p Plugin) (string, error) {
	inject, err := json.Marshal(p.injects())
	if err != nil {
		return "", err
	}
	provide, err := json.Marshal(p.Provide)
	if err != nil {
		return "", err
	}
	var b strings.Builder
	b.WriteString("// Generated by go-deepseek: the cordis face of a Go component.\n")
	b.WriteString("// Its name, coeffects and provided keys are read from this module by the\n")
	b.WriteString("// loader; its behaviour is in Go, one bridge call away.\n")
	fmt.Fprintf(&b, "import { apply as toGo } from %s;\n\n", literal(bridgeModule))
	fmt.Fprintf(&b, "export const name = %s;\n", literal(p.ID))
	fmt.Fprintf(&b, "export const inject = %s;\n", inject)
	if len(p.Provide) > 0 {
		fmt.Fprintf(&b, "export const provide = %s;\n", provide)
	}
	fmt.Fprintf(&b, "\nexport function apply(ctx, config) {\n  return toGo(%s, ctx, config);\n}\n", literal(p.ID))
	return b.String(), nil
}

// literal renders a Go string as a JavaScript one. JSON's string grammar is a
// subset of JavaScript's, so the encoder is the escaper.
func literal(s string) string {
	encoded, err := json.Marshal(s)
	if err != nil {
		return `""`
	}
	return string(encoded)
}

// pluginEntries turns each Go plugin into a composition entry. They are appended
// rather than merged so that a collision with an existing id is reported by
// validate, which says which id, rather than one entry quietly replacing another.
func pluginEntries(plugins []Plugin) []Entry {
	entries := make([]Entry, 0, len(plugins))
	for _, p := range plugins {
		entries = append(entries, Entry{ID: p.ID, Name: p.specifier(), Config: p.Config})
	}
	return entries
}

// pluginModules generates every plugin's module, plus the bridge they share.
func pluginModules(plugins []Plugin) (map[string]string, error) {
	if len(plugins) == 0 {
		return nil, nil
	}
	bridgeSource, err := jsFS.ReadFile("js/bridge.js")
	if err != nil {
		return nil, fmt.Errorf("deepseek: bridge script is missing: %w", err)
	}
	modules := map[string]string{bridgeModule: string(bridgeSource)}
	for _, p := range plugins {
		source, err := pluginModule(p)
		if err != nil {
			return nil, err
		}
		modules[p.specifier()] = source
	}
	return modules, nil
}
