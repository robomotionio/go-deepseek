# 10 · shell — Go becomes a capability seam

The capstone of the seams half of the tour.

`ctx.shell` is a seam: an abstract three-method service — `resolve`, `run`,
`start` — that somebody must provide. The harness's own `tool-bash` plugin is
already mounted and **already waiting** in the default composition, because
nothing in this runtime can reach a subprocess (`node:child_process` is
refused by name). This program provides `shell` in Go — `os/exec`, an
allowlist, a deadline it owns — and `bash` appears in the agent's registry
without this program ever registering a tool. **The dependency topology did
it.** Compare example 05, where the same registry has no `bash` at all.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/10-shell
```

The allowlist names POSIX coreutils (`cat`, `grep`, `sort`, …), so this one
wants them on `PATH`. On stock Windows without WSL or Git Bash every command
fails loudly — the seam is portable, this executor's *policy* is the part you
would replace.

## What to look for

- Every command as the host saw it: 4 ran, 4 refused, each with a reason.
- **Two fences, and the second is the one that gets forgotten.** The
  allowlist decides which *programs* run; it says nothing about which *files*
  they touch. `cat` is a safe program and `cat /etc/passwd` is not a safe
  command, so every argument must also be a relative path that stays put.
  That fence is fiddly enough to have its own test (`fence_test.go`) — a
  review found `grep -f/etc/passwd` walking past a check that only understood
  `--flag=value`.
- What the executor does *not* do: hand the string to `bash -c`. There is no
  shell present to be injected into; chaining is refused so `ls; rm -rf /`
  fails loudly instead of running `ls` with odd arguments.

Upstream: `docs/subsystems/shell.md`, `docs/capability-seams.md`.
Part of [the examples tour](../README.md).
