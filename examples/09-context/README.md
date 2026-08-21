# 09 · context — facts the model cannot know

A Go component registers a system-prompt section whose `text` is not a string
but a **provider**: a `ctx.SyncFunc` the harness calls at each assembly. The
deployment status changes between the two turns, in Go, with no re-open and
no injected message — and the model's answer moves with it.

Both turns run on **one session**, so the second answer cannot be explained
by a reset conversation. The assertions check that the new release is in the
answer and the old one is *not* — a stale fact surviving into turn 2 is the
failure this example exists to rule out.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/09-context
```

## What to look for

- `[the section was assembled 2 times]` — the provider ran per step, not once.
- The old release absent from turn 2's answer.
- **The heavier alternative**, documented beside it: to inject whole
  *messages* before a step — or refuse the step outright — listen on the
  `agent/pre-step` waterfall. That is how upstream's own `time-context` and
  `agent-instructions` work, and thirteen shipped plugins listen there. No
  row modifies the loop.

Upstream: `docs/subsystems/system-prompt.md`.
Part of [the examples tour](../README.md).
