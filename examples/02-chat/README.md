# 02 · chat — a conversation, and the log underneath it

A stdin REPL on one session, streamed token by token off `assistant/chunk` —
and then the actual lesson, in two parts. When the REPL ends, the program
**reads the session log back off disk and reprints the conversation** it
never held in memory. Then it opens a **second harness on the same session
id** and asks what was said first, and the second one knows.

The harness does not hand you a conversation. It appends every turn to a
durable ordered log; the model's history, a resume and an audit are all
derived from that. A session id is not a handle — it is the name of a log,
which is why using one again in a new process continues rather than restarts.

The example also reconfigures the persistence provider through the
composition (plain JSONL instead of the default zstd), which is what makes
the log readable here without a decompressor. Both compressions resume; only
one is legible to `jq`.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/02-chat                # interactive

# or scripted:
printf 'Name a fruit. One word.\nWhat colour is it? One word.\n' | go run ./examples/02-chat
```

## What to look for

- The reprinted transcript comes from the JSONL on disk, not from memory.
- The event census: what a session log actually holds beside the messages.
- The second harness answering a question about a conversation it never had.
- **What a run is:** a run owns the interval from the prompt being durably
  received to the next whole-agent idle — *not* "the answer to my question".

Upstream: `docs/subsystems/persistence.md`, `docs/capability-seams.md`.
Part of [the examples tour](../README.md).
