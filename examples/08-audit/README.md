# 08 · audit — wrap to measure, observe to record

A component that writes one JSONL record per tool call: name, arguments,
verdict, duration, error. It uses two hooks, and the split is upstream's own
selection rule:

- **`tools/execute` wraps the dispatch.** It is the one hook whose lexical
  lifetime spans the call, so it is the only place a duration can be measured.
- **`tools/result` observes the frozen authoritative outcome.** It cannot
  change anything, which is precisely why the record belongs there: what it
  sees is what happened.

The file handle is installed with `ctx.Effect` and the flush-and-close with
`ctx.OnDispose`. Nothing uninstalls either by hand — `h.Close()` unmounts the
component, and the JSONL is complete on disk by the time it returns. The
example is only finished when the log exists *after* `Close`.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/08-audit
```

## What to look for

- The teardown order: effect inverse first, then the Go flush.
- The audit log read back after `Close`, failures included.
- `Config.TraceHTTP`: the request-level view beside the tool-level one.
- **The naming trap:** `tools/result` (the pipeline hook listened to here) is
  **not** `tool/result` (the durable session-event type). Plural is the
  pipeline; singular is the log.

Upstream: `docs/cookbook/adding-a-tool.md`,
`docs/user/develop/framework/events.md`.
Part of [the examples tour](../README.md).
