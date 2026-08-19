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

Everything the harness can reach is one Go object (`nodecompat`'s host bindings),
which is what makes the operating-system surface small enough to read and small
enough to fence. `child_process`, `worker_threads` and `vm` are refused by name.

## Measurements

On one Linux x86-64 laptop, against `deepseek/deepseek-v4-flash-0731` through
OpenRouter:

| | |
|---|---|
| Cold boot (parse + mount the 8-entry composition) | **5.0 s** |
| Warm boot (same process, second Runtime) | **1.2 s** |
| Go heap after boot | **58 MB** |
| One text turn | **3.2 s**, 16 session events |
| One tool-using turn (read a file, edit it, verify) | **17.6 s**, 131 events, 3 tool calls |
| Bundle size compiled into the binary | 12.5 MB across 63 modules |

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
  supplied — a composition arriving from a designer or a saved flow is data.

## Regenerating the bundle

Maintainers only, and only when moving to a new upstream revision:

```bash
node tools/bundle/build.mjs --harness ../deepseek-harness --out bundle
go test ./...        # every bundled module must still evaluate
```

`bundle/manifest.json` records the harness version and commit it was built from.

## Licences

MIT. The harness is MIT; goant is MIT; `web-streams-polyfill`, vendored into
`nodecompat/js/vendor/`, is MIT. See `NOTICE`.
