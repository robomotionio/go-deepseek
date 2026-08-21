# 11 · learning — a capability it did not have, and keeps

Three turns and two processes.

The agent is asked something no model can know, and says so. It is then told
the rule, and calls `learn` — a Go tool. Go decides whether that is worth
keeping, registers it on `ctx.skills`, and appends it to a file. Then a
**second process** opens on the same workspace, replays that file into
`ctx.skills` at mount, and is asked the original question on a session that
has never been spoken to. It loads the skill by name and answers.

**The memory is the host's, not the agent's.** `learned.jsonl` lives outside
`Config.Roots`, so the agent's own `read` cannot reach it — which is what
makes the third turn mean anything. A file inside the workspace would leave
"it read its notes" as an explanation exactly as good as "it loaded the
skill", and the whole point is that those are different. The program asserts
the separation rather than claiming it.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/11-learning
```

## What to look for

- Turn 1 failing honestly; turn 3 answering cold, `[tools: skill]`.
- Turn 2 calling `learn` and then `skill` — the catalog updated
  mid-conversation, and the model read back its own minutes-old lesson.
- Three hard-won facts the example documents:
  - a Go plugin's bridge calls only cross while the event loop runs, so
    learning happens inside a tool call — where it belongs;
  - a learned skill is knowledge, not code (`node:vm` is refused by name);
  - a skill invisible in the catalog might as well not exist — one incomplete
    skill provider suppresses the whole `<available_skills>` catalog,
    silently, which is why the filesystem provider is pointed at no roots
    here.

Part of [the examples tour](../README.md).
