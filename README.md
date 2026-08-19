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

## Why

The official Python SDK is a subprocess driver: it spawns a prebuilt single-file
Node executable shipped as a platform wheel. PyPI has those wheels for
`manylinux_2_28_x86_64`, `manylinux_2_28_aarch64` and `macosx_14_0_arm64` only —
no Windows, no macOS x64 — and the unpacked runtime measures 196 MB. Anything
built on it inherits that platform matrix and that payload.

This inherits Go's instead: **linux, darwin and windows on both amd64 and
arm64**, from one toolchain, with the harness inside the binary and nothing to
install beside it.

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
make update HARNESS_REF=dsh-v0.1.0-rc.8       # move to another revision
make bundle HARNESS_DIR=../deepseek-harness   # use a checkout you already have
make show                                     # what the committed bundle was built from
```

`make verify` is the test that matters afterwards: every bundled module must
still evaluate on the engine. A new upstream revision reaching for a Node API
this runtime does not have fails there, naming the module, rather than later
during a plugin mount.

## Status

The harness is a developer preview at `0.1.0-rc.7` whose session format is still
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
