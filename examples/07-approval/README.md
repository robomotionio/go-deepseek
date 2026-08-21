# 07 · approval — a human in the waterfall

The same `tools/pre-execute` seam as example 06, used differently: the
handler prints the proposed call **with its content** and blocks on stdin for
`y`/`n`.

It can block because `Context.Func` runs the handler on its own goroutine and
answers the JavaScript world with a promise. Waiting on a human stops that
one tool call and nothing else — the harness's timers keep firing, other
sessions keep running. That is the practical difference between hosting the
harness and driving one over a pipe: the gate is a function call, not a
protocol.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/07-approval            # answer y/n yourself

# or scripted — deny the first write, allow the second:
printf 'n\ny\n' | go run ./examples/07-approval
```

When stdin runs out the gate falls back to `DSH_APPROVE` (`y`/`n`, default
`n`), so the example still finishes unattended.

## What to look for

- The denied file does not exist afterwards; the allowed one does. Checked on
  disk, not in the transcript.
- **Why not `ctx.approval`:** the harness has a dedicated approval seam, and
  it is deliberately unused here — no approval provider is in this bundle,
  and the seam **fails closed**, so `{kind:"ask"}` would be an unconditional
  no.

Upstream: `docs/capability-seams.md`, `docs/subsystems/approval.md`.
Part of [the examples tour](../README.md).
