package runtime

// Plugins written in Go.
//
// Everything in the harness is a plugin, and the loader mounts one by importing
// its specifier and calling the module's apply(ctx, config). Nothing in that
// contract requires the module to be JavaScript anybody wrote: a module is a
// source string the resolver hands back, and the resolver is ours. So a Go
// plugin here is a REAL cordis plugin — mounted by the same loader, in the same
// tree, with the same lifecycle — whose body forwards into Go.
//
// The generated module is deliberately thin, and registers tools and nothing
// else. Mirroring the whole cordis API in Go would be a translation layer to
// maintain against every upstream release, for a surface most programs never
// touch; the tool registry is the seam that actually matters to a program
// embedding an agent, because it is how the agent reaches something only the
// host can do — a database, an internal API, a device, a function you already
// wrote.
//
// The asynchrony is the part worth understanding. A JavaScript world runs on one
// goroutine, so a tool that blocked it while Go worked would stall the agent,
// the timers, and every request in flight. Instead the call returns a pending
// promise immediately, the work runs on its own goroutine, and the promise is
// settled from there. The engine counts an unsettled host promise as a reason to
// keep the loop alive, which is what makes the turn wait for an answer that has
// not been produced yet.

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// Plugin is a cordis plugin implemented in Go.
//
// It appears in the composition like any other entry and mounts like any other
// plugin. What it contributes is Tools: functions the agent can call that run in
// this process, with everything the process can reach.
type Plugin struct {
	// ID is the composition entry's id, and the name the plugin reports to the
	// harness. It is also what the entry's specifier is built from, so it must
	// be unique among the composition's entries.
	ID string

	// Tools are registered on ctx.tools when the plugin mounts, and unregistered
	// when it is disposed.
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
	// The harness validates arguments against this before Execute is reached, so
	// a call that arrives has already been checked.
	Parameters map[string]any

	// Execute runs the call, on its own goroutine, off the one that owns the
	// JavaScript world. Returning a value settles the call; returning an error
	// fails it, and the model is told what the error said — so the message is
	// part of the interface, and "invalid city: Berlim" gets a retry where
	// "error" gets a shrug.
	//
	// args is the validated arguments as JSON. The returned string is what the
	// model reads, so it can be prose or JSON, whichever the model can use.
	//
	// The context is cancelled when the harness closes, and when the harness
	// abandons the call — a turn the caller cancelled, a tool-call timeout.
	// Respect it: work that ignores cancellation keeps running after the agent
	// has stopped waiting for it.
	Execute func(ctx context.Context, args json.RawMessage) (string, error)
}

// pluginScheme keys a Go plugin's generated module. The scheme is what keeps it
// from ever colliding with a bundled package or a Node builtin, so resolution
// needs no precedence rule.
const pluginScheme = "go:"

func (p Plugin) specifier() string { return pluginScheme + p.ID }

// validatePlugins refuses what would otherwise fail during a mount, or worse,
// during a turn — an anonymous plugin, a tool with no way for the model to know
// what it is for, a name already taken.
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
		if len(p.Tools) == 0 {
			return fmt.Errorf("deepseek: Go plugin %q registers nothing", p.ID)
		}
		for _, tool := range p.Tools {
			switch {
			case tool.Name == "":
				return fmt.Errorf("deepseek: Go plugin %q has a tool with no name", p.ID)
			case tool.Description == "":
				return fmt.Errorf("deepseek: tool %q has no description, which is all the model would have to go on", tool.Name)
			case tool.Execute == nil:
				return fmt.Errorf("deepseek: tool %q has no Execute", tool.Name)
			}
			if owner, ok := owners[tool.Name]; ok {
				return fmt.Errorf("deepseek: tool %q is registered by both %q and %q", tool.Name, owner, p.ID)
			}
			owners[tool.Name] = p.ID
		}
	}
	return nil
}

// pluginModule generates the plugin's JavaScript face.
//
// It is generated rather than written because the parts that vary — names,
// descriptions, parameter schemas — come from Go and have to arrive as literals
// the loader can read at mount time. Everything else is the same eleven lines
// per tool.
func pluginModule(p Plugin) (string, error) {
	var b strings.Builder
	b.WriteString("// Generated by go-deepseek: the JavaScript face of a Go plugin.\n")
	b.WriteString("// Registering tools is all it does; each one forwards into Go.\n")
	b.WriteString("import { defineTool } from '@deepseek-ai/dsh-tools';\n\n")
	fmt.Fprintf(&b, "export const name = %s;\n", literal(p.ID))
	b.WriteString("export const inject = ['tools'];\n\n")
	b.WriteString("// One call id per call, so that an abort names the call it aborts.\n")
	b.WriteString("let calls = 0;\n\n")
	b.WriteString("export function apply(ctx) {\n")
	for i, tool := range p.Tools {
		params := tool.Parameters
		if params == nil {
			params = map[string]any{}
		}
		schema, err := json.Marshal(params)
		if err != nil {
			return "", fmt.Errorf("deepseek: tool %q parameters: %w", tool.Name, err)
		}
		if i > 0 {
			b.WriteString("\n")
		}
		fmt.Fprintf(&b, `  ctx.tools.register(defineTool({
    name: %s,
    description: %s,
    parameters: %s,
    output: {
      // The Go side answers with text, so the schema says text and the
      // rendering is the identity. A tool that wants structure puts JSON in it.
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    execute: (args, exec) => {
      const call = %s + '#' + (++calls);
      const settled = globalThis.__dshGoCall(%s, %s, call, JSON.stringify(args));
      // The harness aborts a call it has stopped waiting for: a cancelled turn,
      // a tool-call timeout. Forwarding that cancels the Go context, which is
      // the only thing that can actually stop work already running over there.
      const signal = exec && exec.signal;
      if (signal) {
        if (signal.aborted) globalThis.__dshGoCancel(call);
        else signal.addEventListener('abort', () => globalThis.__dshGoCancel(call), { once: true });
      }
      return settled;
    },
  }));
`, literal(tool.Name), literal(tool.Description), schema,
			literal(p.ID), literal(p.ID), literal(tool.Name))
	}
	b.WriteString("}\n")
	return b.String(), nil
}

// literal renders a Go string as a JavaScript one. JSON's string grammar is a
// subset of JavaScript's, so the encoder is the escaper.
func literal(s string) string {
	encoded, err := json.Marshal(s)
	if err != nil {
		// json.Marshal fails on a string only for invalid UTF-8, which it
		// replaces rather than refusing; this is unreachable and the fallback is
		// a literal that is at least syntactically a string.
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
		entries = append(entries, Entry{ID: p.ID, Name: p.specifier()})
	}
	return entries
}

// pluginModules generates every plugin's module, keyed by specifier, for the
// engine's resolver to serve.
func pluginModules(plugins []Plugin) (map[string]string, error) {
	if len(plugins) == 0 {
		return nil, nil
	}
	modules := make(map[string]string, len(plugins))
	for _, p := range plugins {
		source, err := pluginModule(p)
		if err != nil {
			return nil, err
		}
		modules[p.specifier()] = source
	}
	return modules, nil
}

// findTool looks up what a call names. A miss is a mistake in the generated
// module rather than in anything a caller wrote, but it is reported rather than
// panicked on, because the alternative is taking down a process over a typo.
func findTool(plugins []Plugin, pluginID, toolName string) *Tool {
	for i := range plugins {
		if plugins[i].ID != pluginID {
			continue
		}
		for j := range plugins[i].Tools {
			if plugins[i].Tools[j].Name == toolName {
				return &plugins[i].Tools[j]
			}
		}
	}
	return nil
}

// runTool calls a host tool with the failures it might produce contained.
//
// A panic in a tool is the host program's bug, not the agent's, and the agent is
// the wrong thing to kill for it: the call fails, the model is told, and the
// turn carries on. The message keeps the panic value because that is the only
// part that says what happened.
func runTool(ctx context.Context, tool *Tool, args string) (out string, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("tool %q panicked: %v", tool.Name, r)
		}
	}()
	return tool.Execute(ctx, json.RawMessage(args))
}
