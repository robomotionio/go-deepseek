# 06 · policy — a deny with a reason, and a deny nobody can undo

One Go component, two layers, and the contrast between them is the lesson.

1. A **`tools/pre-execute` listener** — the waterfall. It allows reads and
   denies writes outside `drafts/`, returning `{"kind":"deny","reason":…}`.
   Each listener may allow, deny or defer to the next, and the order is the
   deployment's to choose.
2. A **`ctx.tools.guard()`** — the floor. It denies any call touching `.env`,
   whatever the listeners above decided. A guard returns a reason or nothing;
   there is no allow result, so no ordering of listeners can turn a denial
   back into permission.

The transcript shows the guard doing exactly that: the waterfall **allowed**
the `.env` read, and the guard overrode it. The workspace is checked on disk
afterwards, so the example is only finished when the denial appeared *and*
the files agree.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/06-policy
```

## What to look for

- The decision log: waterfall denies with reasons, guard denying over an allow.
- The agent adapting to "no" and reporting honestly.
- **The trap documented in full:** a guard's contract is
  `string | undefined`, and a Go `nil` crosses the bridge as `null` — which
  denies **every** call in the harness, with the reason `null`.
  `sdk.Undefined()` is how Go says undefined and means it.

Upstream: `docs/tool-execution-pipeline.md`.
Part of [the examples tour](../README.md).
