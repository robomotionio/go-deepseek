# 03 · workspace — a fenced editor, checked on disk

The agent is given a temp workspace holding a small broken file, an explicit
`CWD`, an explicit `Roots` and an explicit `Env`. It fixes the file — and then
**Go reads the file back**, because the assertion belongs on the bytes, not on
the model's word.

Then the same agent is asked for something outside the fence, and `ctx.fs`
refuses it. The program sees the refusal itself (`EACCES: path is outside the
permitted roots`) rather than only reading about it in the reply. That is the
example's claim in one line: **capability is fenced by composition, not by
trust** — what the agent may touch is a `Config` decision, made before the
first token.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/03-workspace
```

## What to look for

- `PASS: the file on disk is fixed.` — verified by reading the file, not the
  transcript.
- The fence speaking for itself when `/etc/hostname` is asked for, and the
  model reporting the refusal honestly.

Upstream: `docs/subsystems/filesystem.md`.
Part of [the examples tour](../README.md).
