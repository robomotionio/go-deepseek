# go-deepseek

Run the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) inside
a Go program. No Node.js, no native addons, nothing to fetch at run time — the
harness is compiled into the binary and executed by a pure-Go JavaScript engine.

```go
h, err := deepseek.New(deepseek.Config{
    CWD:      workdir,
    Provider: "deepseek-official",
    Model:    "deepseek-v4-flash",
    Env:      map[string]string{"DEEPSEEK_API_KEY": key},
})
if err != nil { return err }
defer h.Close()

if err := h.Start(ctx); err != nil { return err }
result, err := h.Run(ctx, "session-1", deepseek.Text("Fix the failing test in add.js."))
fmt.Println(result.Text)
```

## Why it exists

The upstream Python SDK is a subprocess driver: it spawns a prebuilt single-file
Node executable shipped as a platform wheel. PyPI has those wheels for
`manylinux_2_28_x86_64`, `manylinux_2_28_aarch64` and `macosx_14_0_arm64` only —
no Windows, no macOS x64 — and the unpacked runtime measures 196 MB. Anything
built on it inherits that platform matrix and that payload.

This package inherits Go's instead: **linux, darwin and windows on both amd64
and arm64**, from one toolchain, with the harness inside the binary.

## How it is put together

| Piece | What it does |
|---|---|
| [goant](https://github.com/robomotionio/goant) | The JavaScript engine. Pure Go, CGO-free, 99.4% of test262. |
| `nodecompat` | The Node.js and web-platform surface: `node:fs`, `path`, `crypto`, `zlib`, `fetch`, streams, `Buffer`, `URL`. Computation in JavaScript, the machine in Go. |
| `bundle` | The harness itself — one ES module per package, generated from a pinned checkout by `tools/bundle/build.mjs` and committed. |
| the root package | `Config`, `Compose`, `Harness`: composing the plugin list and running turns. |
| `sdk` | The client API, shaped like the official Python SDK, over either carrier. |

Everything the harness can reach is one Go object (`nodecompat`'s host bindings),
which is what makes the operating-system surface small enough to read and small
enough to fence. `child_process`, `worker_threads` and `vm` are refused by name.

## Measurements

On one idle Linux x86-64 laptop, against `deepseek/deepseek-v4-flash-0731`
through a gateway:

| | |
|---|---|
| Cold boot (parse and mount the 8-entry composition) | **0.37 s** |
| Go heap after boot | **58 MB** |
| One text turn | **3.2 s**, 20 session events |
| One tool-using turn (read a file, edit it, verify) | **4.2 s**, 72 events, 3 tool calls |
| Bundle compiled into the binary | 12.5 MB across 64 modules |

(Measured with `go test -run TestBootCost -v .`; the first figures recorded for
this were four times worse, taken while a conformance suite was saturating the
same machine. Worth knowing when you measure it yourself.)

## The composition

Everything in the harness is a plugin, and a deployment is a list of them. The
default list is the minimal useful agent — a model, a session that persists, a
filesystem it can read and edit, a todo list:

```go
entries := deepseek.Compose(cfg)
entries = deepseek.With(entries, "tool-todo", map[string]any{"allowParallelInProgress": false})
entries = deepseek.Disable(entries, "persistence", true)
```

Two rules the harness imposes, restated here because both are quiet traps:

- An entry's config **replaces** the plugin's defaults rather than merging into
  them. An override that mentions one key discards the rest.
- The YAML form supports `!!js`, which is arbitrary JavaScript the loader
  evaluates. Nothing here emits it and `validate` rejects it in anything a caller
  supplied — a composition that arrives from outside the program is data.

## The SDK

`sdk/` is the same API the official Python SDK offers — a harness, sessions, a
run that returns the final response, the finish reason and the events it saw —
so that a program written against one translates to the other:

```go
h, err := sdk.Open(ctx, sdk.Config{Model: "deepseek-v4-flash"})
if err != nil { return err }
defer h.Close()

result, err := h.Run(ctx, sdk.Text("Say hi."),
    sdk.OnEvent(func(e sdk.Event) { log.Println(e.Type) }))
fmt.Println(result.FinalResponse, result.FinishReason)
```

It reaches the harness two ways, and hides which:

- **In process** (the default): the embedded harness above, no subprocess.
- **Over JSON-RPC**: `sdk.WithRuntimeBinary(path)` launches a prebuilt harness
  executable and speaks newline-delimited JSON to it — the same protocol, method
  names and run-interval rule as the Python SDK, so it drives an executable
  upstream built.

A run owns the interval from the prompt being durably received to the next
whole-agent idle, and its result describes that interval rather than an answer
attributable to the prompt. That is upstream's rule, restated because the
natural reading is the other one.

## Regenerating the bundle

Maintainers only, and only when moving to a new upstream revision:

```bash
make update                      # fetch upstream, build it, regenerate, test
make update HARNESS_REF=dsh-v0.1.0-rc.8    # move to another revision
make bundle HARNESS_DIR=../deepseek-harness   # use a checkout you already have
make show                        # what the committed bundle was built from
```

`bundle/manifest.json` records the harness version and commit it was built from.

## Licences

MIT. The harness is MIT; goant is MIT; `web-streams-polyfill`, vendored into
`nodecompat/js/vendor/`, is MIT. See `NOTICE`.
