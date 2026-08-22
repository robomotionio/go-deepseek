<p align="center">
  <img src="docs/logo.png" alt="A Go gopher riding the DeepSeek whale" width="320">
</p>

# go-deepseek

The [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) as a
pure-Go SDK. No Node.js, no native addons, nothing to fetch at run time — the
harness is compiled into your binary and executed by a pure-Go JavaScript
engine.

```go
import "github.com/robomotionio/go-deepseek/sdk"

h, err := sdk.Open(ctx, sdk.Config{
    Model:  "deepseek-v4-flash",
    APIKey: key,        // or leave empty and set DEEPSEEK_API_KEY
    CWD:    workdir,    // where the agent works, and the fence it works inside
})
if err != nil {
    return err
}
defer h.Close()

result, err := h.Run(ctx, sdk.Text("Fix the failing test in add.js."))
if err != nil {
    return err
}
fmt.Println(result.FinalResponse)
```

That is a real coding agent: it reads files, edits them, runs its tools, keeps a
session log, and streams its reasoning — inside your process, on one goroutine,
with a filesystem fence you set.

```
go get github.com/robomotionio/go-deepseek
```

## What is the DeepSeek Harness?

DeepSeek Harness (`dsh`) is an open-source agent harness developed by
[DeepSeek AI](https://deepseek.com). It uses an architecture where **everything
is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis),
whose design is described in [_A Programming Paradigm for Spatiotemporal
Composability_](https://github.com/cordiverse/paper).

"Everything is a plugin" is not a note on how it happens to be built. It is the
entire configuration surface: a deployment **is** a list of plugins — the model
adapter, the session log, the filesystem the agent may reach, each tool it may
call — and changing the list is how you change what the agent is. There is no
second place to configure anything.

That is what makes a Go SDK for it worth building rather than wrapping.
[Composing the harness](#composing-the-harness) is that list, from Go. And
because the list is the only surface, a plugin written in Go is not an extension
point bolted on the side: it is [an entry on the same
list](#beyond-tools-the-whole-component), mounted by the same loader, with the
same lifecycle as the harness's own.

## Why go-deepseek?

**Because a Go program could not run one.** The harness is TypeScript, and the
supported way to embed it is the official Python SDK — which is a subprocess
driver: it spawns a prebuilt single-file Node executable shipped as a platform
wheel. PyPI has those wheels for `manylinux_2_28_x86_64`,
`manylinux_2_28_aarch64` and `macosx_14_0_arm64` only — no Windows, no macOS x64
— and the unpacked runtime measures 196 MB. Anything built on it inherits that
platform matrix and that payload.

This inherits Go's instead: **linux, darwin and windows on both amd64 and
arm64**, from one toolchain, with the harness inside the binary and nothing to
install beside it. `go build` is the whole story; there is no Node.js to
provision on the machine that runs it, and no second artifact to ship.

**And because a subprocess is the wrong shape for what people actually want.**
Driving an agent over a pipe means everything you give it lives on the far side
of a protocol: a tool is an RPC endpoint you host, a policy is a message you
answer, and the failure modes are the transport's. Running the harness *in* the
process collapses that. A tool is a Go function. A policy that governs every
tool call — including the harness's own — is a Go function. Cancellation is a
`context.Context`. There is no protocol between your code and the agent's,
because there is no gap for one to cross.

| | |
|---|---|
| Cold boot (parse and mount the default composition) | **0.37 s** |
| Go heap after boot | **58 MB** |
| One text turn | **3.2 s** |
| One tool-using turn (read a file, edit it, verify) | **4.2 s**, 3 tool calls |
| Harness compiled into the binary | 12.5 MB across 64 modules |

(`go test -run TestBootCost -v ./internal/runtime`. Measure it on an idle
machine: the first numbers recorded here were four times worse, taken while a
conformance suite was saturating the same laptop.)

## Examples

What follows this section is a reference, written as fragments with two whole
programs at the end of it. [`examples/`](examples) is the other way in: thirteen whole
programs, simple to complex, each proving one idea about the harness and each
runnable without editing anything.

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/01-hello
```

| | |
|---|---|
| [`01-hello`](examples/01-hello) | An agent runs inside your process. |
| [`02-chat`](examples/02-chat) | The session log is the source of truth. |
| [`03-workspace`](examples/03-workspace) | Capability is fenced by composition, not by trust. |
| [`04-tools`](examples/04-tools) | The agent's tools come from plugins; yours can be Go functions. |
| [`05-composition`](examples/05-composition) | The plugin list *is* the product. Two agents from one binary. |
| [`06-policy`](examples/06-policy) | A reorderable waterfall, plus a guard nobody can undo. |
| [`07-approval`](examples/07-approval) | A Go handler may block, so a human can stand in the pipeline. |
| [`08-audit`](examples/08-audit) | Wrap to measure, observe to record; effects revert themselves. |
| [`09-context`](examples/09-context) | Every step can carry facts the model cannot know. |
| [`10-shell`](examples/10-shell) | Go fills a seam the JavaScript runtime cannot, and the agent gains `bash`. (Its allowlist names POSIX coreutils, so this one wants them on `PATH`.) |
| [`11-learning`](examples/11-learning) | The agent gains a capability it did not have, and the next process starts with it. |
| [`12-advanced-learning`](examples/12-advanced-learning) | An RPA job worked out once, then replayed from what was learned — and checked. |
| [`13-phone-banking`](examples/13-phone-banking) | A telephone menu explored once; the second caller keys straight through it. |

[`examples/README.md`](examples/README.md) is the tour: what each one proves,
which seam or event it sits on, the upstream document for it, and the output
each actually produced. Standard library only; no new dependencies.

## Using it

### A conversation

Turns on one session share history and run one at a time. Turns on different
sessions do not, and may run concurrently.

```go
session := h.Session("ticket-4171")

_, _ = session.Run(ctx, sdk.Text("Read main.go and tell me what it does."))
second, err := session.Run(ctx, sdk.Text("Now add a test for the part you described."))

fmt.Println(second.FinalResponse, second.ToolCalls(), second.Duration)
```

`h.NewSession()` gives a session a fresh random id; `h.Run` is shorthand for a
session used once. The session id is also the name of its log under
`Config.SessionRoot`, so a session resumes by using its id again.

### Talking to a gateway

Point it anywhere that speaks the DeepSeek chat-completions API — OpenRouter, a
proxy, a local server — with `BaseURL`, `APIKey` and that endpoint's model id:

```go
h, err := sdk.Open(ctx, sdk.Config{
    BaseURL: "https://openrouter.ai/api/v1",
    APIKey:  os.Getenv("OPENROUTER_API_KEY"),
    Model:   "deepseek/deepseek-v4-flash-0731",   // the gateway's id for it
    CWD:     workdir,
})
```

`Provider` is deliberately absent there, and that is the one thing about this
worth reading twice: it names the ROUTE the composition registers, not the
vendor at the other end. The default composition registers exactly one route,
`deepseek-official`, and that route is what the adapter's `BaseURL` points
somewhere else. Set `Provider` only when your composition mounts an adapter that
registers a different route name.

The endpoint is also read from the environment when the fields are empty:
`DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY`, the same variables the harness and
the Python SDK use.

### Streaming

`OnEvent` sees each of the session's own events as the harness records it, which
is how a reply is rendered as it arrives rather than after it:

```go
result, err := h.Run(ctx, sdk.Text("Refactor the parser."),
    sdk.OnEvent(func(e sdk.Event) {
        switch e.Type {
        case "assistant/chunk":
            var chunk struct {
                Chunk struct {
                    Type string `json:"type"`
                    Text string `json:"text"`
                } `json:"chunk"`
            }
            if e.Decode(&chunk) == nil && chunk.Chunk.Type == "text-delta" {
                fmt.Print(chunk.Chunk.Text)
            }
        case "tool/call":
            fmt.Println("\n[tool]", string(e.Data))
        }
    }))
```

Event payloads stay as raw JSON on purpose: the harness defines dozens of event
types whose shapes move with it, so `Decode` into whatever you actually read
beats a generated struct per type maintained against every release.
`OnNotification` sees everything, including the events of subagent sessions a
delegation created.

### Fencing the agent

`CWD` is where the agent works and, by default, the only place its tools can
reach — along with its session directory and the temporary directory. Widen that
deliberately or not at all:

```go
h, err := sdk.Open(ctx, sdk.Config{
    CWD:   "/srv/checkouts/app",
    Roots: []string{"/srv/checkouts/app", "/srv/reference"},   // and nothing else
    Env:   map[string]string{"DEEPSEEK_API_KEY": key},         // not the process's own
})
```

`Env` is the whole environment the harness sees. Passing a map rather than
inheriting is how a credential that has nothing to do with this agent stays out
of reach of the shell it might run.

### Giving the agent your own tools

A plugin is how the harness gains a capability, and a tool is how the agent
reaches one. Both can be Go:

```go
h, err := sdk.Open(ctx, sdk.Config{
    CWD: workdir,
    Plugins: []sdk.Plugin{{
        ID: "inventory",
        Tools: []sdk.Tool{{
            Name:        "stock_level",
            Description: "The number of units of a part that are in stock.",
            Parameters: map[string]any{
                "sku": map[string]any{"type": "string", "required": true,
                    "description": "The part number."},
            },
            Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
                var in struct {
                    SKU string `json:"sku"`
                }
                if err := json.Unmarshal(args, &in); err != nil {
                    return "", err
                }
                return inventory.Report(ctx, in.SKU)   // your code, your process
            },
        }},
    }},
})
```

This is a real cordis plugin, not a side channel: the loader mounts it, it sits
in the same tree as the harness's own, and `stock_level` appears in the registry
beside `read` and `bash`. `h.Tools(ctx)` lists them, which is how you confirm a
plugin registered what it meant to.

Two things about it are worth knowing.

**The description is the interface.** It is the whole of what the model knows
about the tool beyond its parameters, so an empty one is refused rather than
mounted. The same goes for the error a tool returns: the model is shown it, so
`invalid part number: RM-7` gets a corrected retry where `error` gets a shrug.

**Each call runs on its own goroutine**, not the one that owns the JavaScript
world, and the turn waits for a promise settled from Go. A tool that takes a
second costs the agent a second of waiting rather than freezing everything else
the harness is doing. The context is cancelled when the harness closes and when
the harness abandons the call — a cancelled turn, a tool-call timeout — so
honouring it is what stops work nobody is waiting for any more.

This is the alternative to handing an agent a shell and hoping. A tool has a
name, a schema, a fence you wrote in Go, and an implementation you can test
without a model in the room.

### Beyond tools: the whole component

A tool is one entry in a registry. A **component** — what cordis calls a plugin —
is the unit the harness is actually built from: a coeffect specification (the
services it declares it needs), an effect function that installs what it
contributes, and a fiber with a lifecycle. All of that reaches Go.

```go
sdk.Plugin{
    ID:      "policy",
    Inject:  []string{"tools"},        // declared, and enforced
    Provide: []string{"approval"},     // others may now depend on this
    Apply: func(ctx *sdk.Context) error {
        // Wrap every tool call the agent makes — including the harness's own.
        _, err := ctx.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
            var call struct{ Name string `json:"name"` }
            _ = json.Unmarshal(args[0], &call)
            audit.Record(call.Name)

            next, err := ctx.Value(args[len(args)-1]).Object()   // continue the waterfall
            if err != nil {
                return nil, err
            }
            decision, err := next.Invoke()
            return json.RawMessage(decision.JSON()), err
        })
        return err
    },
}
```

`Apply` receives the component's own cordis context, and **any path on it is
reachable by name** — there is no per-capability wrapper to wait for:

| | |
|---|---|
| `ctx.Service("fs")` | read a seam it declared, then call it: `fs.CallForObject("resolve", p)` then `fs.Call("readText", target)` |
| `ctx.Provide("approval", …)` | become a provider others inject; unmounting withdraws it and them |
| `ctx.On(event, fn)` | any event or waterfall, including `tools/pre-execute`, `tools/execute`, `tools/post-execute` |
| `ctx.Call(path, args…)` | anything else: `tools.register`, `systemPrompt.section`, `sessionProjections.register` |
| `ctx.Effect(inverse)` | a revertible effect whose inverse is Go, recovered LIFO on unmount (runs synchronously; use `ctx.OnDispose` for teardown that blocks) |
| `ctx.Func` / `ctx.SyncFunc` | a Go closure as a JavaScript function — a tool's execute, a listener, a service method |
| `sdk.Undefined()` | JavaScript's `undefined`, which a Go `nil` is not: it crosses as `null`, and a `ctx.tools.guard` reading `string \| undefined` denies every call in the harness on anything else |

Three properties are worth stating because they are the ones that make this a
component rather than a callback bag.

**The declaration is enforced.** `ctx.Service("fs")` without `Inject: ["fs"]`
fails with the harness's own error — *cannot get property "fs" without inject*.
The declaration is a capability request, and reading past it is refused.

**An unsatisfied component waits.** Declare a service nothing provides and it
stays unmounted, without erroring; it activates if a provider appears and
unmounts again if one leaves.

**What it installed is withdrawn.** Effects revert LIFO when the component
unmounts, whether it unmounts because you closed the harness or because a
dependency went away. You name the inverse; nothing else is your problem.

The one thing Go cannot do is be **hot-replaced**. Retracting a component's code
needs a module registry to evict it from, and Go has none — its code is compiled
in. The fiber is fully composable; the Go behind it changes only by restarting.

### A whole program

Everything above is a fragment. This is a whole one — a Go plugin, streaming and
a real turn — that compiles and runs as it stands:

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

func main() {
	// Ctrl-C cancels the turn: the request in flight is aborted rather than
	// left to finish and be billed.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	h, err := sdk.Open(ctx, sdk.Config{
		// An OpenRouter gateway. For DeepSeek itself, drop BaseURL and use
		// "deepseek-v4-flash" as the model.
		BaseURL: "https://openrouter.ai/api/v1",
		APIKey:  os.Getenv("OPENROUTER_API_KEY"),
		Model:   "deepseek/deepseek-v4-flash-0731",

		// Where the agent works, and the fence its tools cannot reach outside.
		CWD: workdir,

		// A tool of our own, in Go, beside the harness's own read/edit/bash.
		Plugins: []sdk.Plugin{{
			ID: "deploys",
			Tools: []sdk.Tool{{
				Name:        "last_deploy",
				Description: "When a service was last deployed, and by whom. The only way to know this.",
				Parameters: map[string]any{
					"service": map[string]any{
						"type":        "string",
						"required":    true,
						"description": "The service name, e.g. \"checkout\".",
					},
				},
				Execute: lastDeploy,
			}},
		}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	result, err := h.Run(ctx,
		sdk.Text("When did checkout last go out, and does CHANGELOG.md mention it?"),
		sdk.OnEvent(func(e sdk.Event) {
			switch e.Type {
			case "assistant/chunk":
				// Print the reply as it arrives rather than after it.
				var chunk struct {
					Chunk struct {
						Type string `json:"type"`
						Text string `json:"text"`
					} `json:"chunk"`
				}
				if e.Decode(&chunk) == nil && chunk.Chunk.Type == "text-delta" {
					fmt.Print(chunk.Chunk.Text)
				}
			case "tool/call":
				fmt.Fprintln(os.Stderr, "\n[tool]", string(e.Data))
			}
		}))
	if err != nil {
		log.Fatal(err) // transport, protocol, or the Ctrl-C above
	}

	fmt.Printf("\n\n%s in %v (session %s)\n",
		result.FinishReason, result.Duration.Round(time.Millisecond), result.SessionID)
}

// lastDeploy is an ordinary Go function. It runs on its own goroutine, and the
// context is cancelled if the agent stops waiting for it.
func lastDeploy(ctx context.Context, args json.RawMessage) (string, error) {
	var in struct {
		Service string `json:"service"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	// Your database, your internal API, whatever this program can reach. The
	// error text goes to the model, so it is worth writing for that reader.
	if in.Service != "checkout" {
		return "", fmt.Errorf("no service named %q; known services: checkout, search", in.Service)
	}
	return "checkout v4.2.1, deployed 2026-08-17 14:03 UTC by rita@example.com", nil
}
```

In a directory with a `CHANGELOG.md`, that prints:

```
[tool] {"turn":1,"step":1,"callId":"...","name":"last_deploy","arguments":"{\"service\": \"checkout\"}"}
[tool] {"turn":1,"step":1,"callId":"...","name":"read","arguments":"{\"file_path\": \"CHANGELOG.md\"}"}

**When:** Checkout last went out as **v4.2.1 on 2026-08-17 14:03 UTC**, deployed by rita@example.com.

**Does CHANGELOG.md mention it?** Yes — CHANGELOG.md has an entry for `v4.2.1 - 2026-08-17`
noting "checkout: faster cart totals," which matches that deployment.

completed in 4.059s (session session-5a7af6692c8d97f8)
```

One turn, two tools: the Go function this program supplied, and the harness's own
`read` reaching a file inside the fence. Neither one knows the other is unusual.

### A policy component, whole

The program above gives the agent a tool. This one gives it a **governor**: a Go
component that wraps every tool call the harness already has and refuses the ones
it does not like. It registers no tools of its own.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/robomotionio/go-deepseek/sdk"
)

// A policy component: it wraps every tool call the agent makes, records it, and
// refuses the ones that would write outside the documentation.
//
// Nothing here registers a tool. This component governs the tools the harness
// already has — `read`, `write`, `edit` — which it did not create and knows
// nothing about beyond their names.
func policy(audit func(name, verdict string)) sdk.Plugin {
	writes := map[string]bool{"write": true, "edit": true, "str_replace_editor": true}

	return sdk.Plugin{
		ID:     "policy",
		Inject: []string{"tools"}, // declared, and enforced: undeclared is refused
		Apply: func(ctx *sdk.Context) error {
			_, err := ctx.On("tools/pre-execute", func(args []json.RawMessage) (any, error) {
				var call struct {
					Name      string `json:"name"`
					Arguments struct {
						Path string `json:"path"`
						File string `json:"file_path"`
					} `json:"arguments"`
				}
				_ = json.Unmarshal(args[0], &call)

				path := call.Arguments.File
				if path == "" {
					path = call.Arguments.Path
				}
				if writes[call.Name] {
					// Fail closed. A policy that allows what it could not read is
					// not a policy, and a model that sends a malformed call gets
					// told so rather than getting through.
					reason := ""
					switch {
					case path == "":
						reason = "no path in the call, so it cannot be checked"
					case !strings.HasSuffix(path, ".md"):
						reason = "this agent may only write Markdown, and " + path + " is not a .md file"
					}
					if reason != "" {
						audit(call.Name, "denied: "+reason)
						// The reason reaches the model, so write it for that
						// reader: a good one earns a corrected retry.
						return map[string]any{"kind": "deny", "reason": reason}, nil
					}
				}

				audit(call.Name, "allowed "+path)
				// Continue the waterfall. The last argument is `next`, and a
				// listener that does not call it has decided the call itself.
				next, err := ctx.Value(args[len(args)-1]).Object()
				if err != nil {
					return nil, err
				}
				decision, err := next.Invoke()
				if err != nil {
					return nil, err
				}
				return json.RawMessage(decision.JSON()), nil
			})
			return err
		},
	}
}

func main() {
	ctx := context.Background()
	workdir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}

	h, err := sdk.Open(ctx, sdk.Config{
		BaseURL: "https://openrouter.ai/api/v1",
		APIKey:  os.Getenv("OPENROUTER_API_KEY"),
		Model:   "deepseek/deepseek-v4-flash-0731",
		CWD:     workdir,
		Plugins: []sdk.Plugin{policy(func(name, verdict string) {
			fmt.Fprintf(os.Stderr, "[policy] %-8s %s\n", name, verdict)
		})},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	// What the agent can call, the harness's own tools included.
	tools, err := h.Tools(ctx)
	if err != nil {
		log.Fatal(err)
	}
	names := make([]string, len(tools))
	for i, tool := range tools {
		names[i] = tool.Name
	}
	fmt.Println("tools:", strings.Join(names, " "))

	result, err := h.Run(ctx, sdk.Text(
		"Write the line 'hello' into notes.txt, then write the same line into notes.md. "+
			"Tell me which ones worked."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("\n" + result.FinalResponse)
}
```

Run it in an empty directory:

```
tools: read write edit str_replace_editor todo_write skill job_output job_list job_kill
[policy] write    denied: this agent may only write Markdown, and notes.txt is not a .md file
[policy] write    allowed notes.md

Here's what happened:

- **notes.txt**: ❌ **Failed** — the agent is restricted to writing Markdown files only,
  so `notes.txt` was rejected.
- **notes.md**: ✅ **Worked** — the file was created with the line `hello`.

So only **notes.md** succeeded.
```

Afterwards the directory holds `notes.md` and nothing else, which is the part
that matters: the refusal was enforced, not merely reported. The model was told
why in words it could act on, and the tools being governed — `write`, `edit` —
are the harness's own. The component never registered them and knows nothing
about them beyond their names.

### Composing the harness

Everything in the harness is a plugin, and a deployment is a list of them. The
default is the minimal useful agent: a model, a session that persists, a
filesystem the agent can read and edit, and a todo list. Add a capability, take
one away, or configure one:

```go
cfg := sdk.Config{CWD: workdir, Model: "deepseek-v4-flash"}

entries := sdk.Compose(cfg)
entries = sdk.Add(entries, sdk.Entry{ID: "web", Name: "@deepseek-ai/dsh-tool-web"})
entries = sdk.Disable(entries, "persistence", true)      // keep the config, mount nothing
entries = sdk.With(entries, "tool-todo", map[string]any{ // replaces, never merges
    "allowParallelInProgress": false,
})
cfg.Composition = entries

h, err := sdk.Open(ctx, cfg)
```

`sdk.Compose` reads the Config exactly as `Open` would, defaults and environment
included — the same endpoint from `DEEPSEEK_BASE_URL`, the same working
directory. It has to: an entry list is data, and it FREEZES what it read, so a
composition built from a Config that had not been defaulted yet would aim the
model adapter at the default endpoint however carefully the environment was set.

`sdk.Plugins()` lists what the embedded bundle can mount — anything else has to
go into the bundle first, see below. Two rules worth knowing, because both are
quiet traps:

- An entry's config **replaces** the plugin's defaults rather than merging into
  them. An override that mentions one key discards the rest.
- The YAML form of a composition supports `!!js`, which is arbitrary JavaScript
  the loader evaluates. Nothing here emits it and a composition is validated
  before it mounts — a composition that arrives from outside your program is
  data, and a value in it that executes is code with your process's privileges.

### When a turn fails

A turn that ends in a provider error is a described outcome, not a transport
failure: by default it comes back as a result whose `FinishReason` is `"error"`,
with the events that explain it.

```go
result, err := h.Run(ctx, sdk.Text("..."))
if err != nil {
    return err                       // transport, protocol, or cancellation
}
switch result.FinishReason {
case "completed":
    fmt.Println(result.FinalResponse)
case "max-tokens":
    fmt.Println("truncated:", result.FinalResponse)
case "error":
    log.Println(sdk.TurnError(result.Events))
    // sdk: turn failed: Insufficient credits (BILLING 402)
}
```

Pass `sdk.FailOnTurnError()` to have `Run` return that as an error instead. The
sentinels are `sdk.ErrTurnFailed`, `sdk.ErrProtocol`, `sdk.ErrTransportClosed`
and `sdk.ErrClosed`, plus `*sdk.RPCError` for a runtime that refused a request.

### Cancelling

The context governs the run. Cancelling it stops the turn — the request in
flight is aborted rather than left to finish and be billed:

```go
ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
defer cancel()

result, err := h.Run(ctx, sdk.Text("Do the long thing."))
if errors.Is(err, context.DeadlineExceeded) {
    // the session log still holds everything that happened before the deadline
}
```

### Watching the runtime

Two questions have no other way to be asked, so there are two hooks for them:

```go
h, err := sdk.Open(ctx, sdk.Config{
    CWD: workdir,
    TraceHTTP: func(step string, id int64, detail string) {
        log.Println("http", step, id, detail)     // fetch, response, chunk, eof, cancel
    },
    TraceTimers: func(kind string, delayMs, id float64, stack string) {
        if delayMs > 10_000 {
            log.Println("long timer", kind, delayMs, stack)
        }
    },
})
```

The first answers "is the stream stalled, or slow?"; the second answers "what is
keeping this alive?". Each of them found a real bug during development.

### Another carrier

The same API drives a prebuilt harness executable instead of the embedded one,
over the Python SDK's JSON-RPC protocol:

```go
h, err := sdk.Open(ctx, sdk.Config{Model: "deepseek-v4-flash"},
    sdk.WithRuntimeBinary("/opt/dsh/dsh-jsonrpc-agent"))
```

Nothing above the carrier changes: same results, same events, same errors. Use
it for a build carrying plugins the embedded bundle does not, or a runtime
pinned separately from this package. `sdk.WithCarrier` takes one of your own — a
fake for tests, or a transport this package does not implement.

### What a run means

A run owns the interval from the prompt being durably received to the next
whole-agent idle, and its result describes THAT INTERVAL rather than an answer
attributable to the prompt. Anything else queued — steering, injected context, a
subagent finishing — contributes to it too. This is upstream's rule, restated
here because "the answer to my question" is the natural reading and is not what
the field is.

## How it works

```
your program
     │
     ▼
   sdk                    sessions, runs, streaming, errors — the only API
     │
     ├── in process ────► internal/runtime   goant + the Node surface + the harness
     └── or subprocess ─► JSON-RPC over stdio to a prebuilt runtime
```

| Piece | What it is |
|---|---|
| [goant](https://github.com/robomotionio/goant) | The JavaScript engine. Pure Go, CGO-free, 99.4% of test262. |
| `internal/nodecompat` | The Node.js and web-platform surface — `node:fs`, `path`, `crypto`, `zlib`, `fetch`, streams, `Buffer`, `URL`. Computation in JavaScript, the machine in Go. |
| `internal/bundle` | The harness itself: one ES module per package, generated from a pinned checkout and committed. |
| `internal/runtime` | Mounts a composition and runs turns on one goroutine. |

Everything the harness can reach is one Go object — `nodecompat`'s host bindings
— which is what makes the operating-system surface small enough to read and
small enough to fence. `child_process`, `worker_threads` and `vm` are refused by
name: a capability that dangerous should be granted deliberately, not acquired
by importing a module.

## Tracking upstream

The bundle is a generated artifact, committed like any other. Regenerating it
needs node, pnpm and git; using it needs none of them.

```bash
make update                                   # fetch upstream, build, regenerate, test
make update HARNESS_REF=dsh-v0.1.1-rc.3       # move to another revision
make bundle HARNESS_DIR=../deepseek-harness   # use a checkout you already have
make show                                     # what the committed bundle was built from
make upstream-check                           # how far upstream has moved since the pin
```

`make verify` is the test that matters afterwards: every bundled module must
still evaluate on the engine. A new upstream revision reaching for a Node API
this runtime does not have fails there, naming the module, rather than later
during a plugin mount.

### The pin

`UPSTREAM.lock.json` records which upstream revision this repository ships, the
33 bundled packages at their versions, and what is deliberately refused. The
generated manifest records the same revision, but it is generated: it changes
whenever the bundler runs and proves only that it ran. The lockfile is written
by hand, so a diff in it is somebody deciding to move the pin, with the reason
in the commit.

`make upstream-check` reads it, fetches upstream, and reports the commits since
the pin that touch a path the bundle actually carries — with anything reading as
security work raised to the top, because that ordering is the whole point. It is
run weekly by `.github/workflows/upstream-drift.yml`, which keeps one issue
updated for as long as the pin lags, and by `make verify`, which prints the
report without failing on it: drift is not fixable by editing this repository,
and a gate you cannot satisfy is a gate people learn to skip.

## Status

The harness is a developer preview at `0.1.1-rc.2` whose session format is still
version zero, and upstream says breaking changes will happen. The bundle is
pinned by tag, and `sdk.HarnessVersion()` reports which one you have.

Not everything upstream ships is bundled. Excluded, with the reason recorded in
the manifest: anything needing `node:sqlite`, native image processing, worker
threads, `node:vm`, or a pseudo-terminal. `sdk.Plugins()` lists what is there,
and a capability none of them covers can be written in Go instead of bundled —
see "Giving the agent your own tools".

## Licences

MIT. The harness is MIT; goant is MIT; `web-streams-polyfill`, vendored into
`internal/nodecompat/js/vendor/`, is MIT. See `NOTICE`.
