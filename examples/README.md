# examples — a tour of the DeepSeek Harness, hosted in Go

Ten runnable programs, simple to complex. Each one proves a single idea about
the harness, is self-contained, and can be copied out of here whole.

```
go run ./examples/01-hello
```

**The harness is the subject; Go is the host.** These are not "how to call an
SDK" samples. The [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
is a microkernel: an agent loop with nothing in it, surrounded by documented
extension points. Upstream states the design as a checkable claim in
[`docs/cookbook/extension-cookbook.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/extension-cookbook.md) —
every product feature maps to a listener on an extension point, and **no row
modifies the loop**. Hooks, `/goal`, `/loop`, compaction, plan mode, MCP,
skills, memory, cron, subagents, telemetry: every one is a listener, not a
patch.

**A Go program can be one of those listeners.** That is what the tour is for.
By example 10 a Go function is filling a capability seam the JavaScript runtime
cannot, and the agent gains a tool this program never registered.

## Running them

```sh
export DEEPSEEK_API_KEY=...                             # read by the SDK itself
export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1   # or leave unset for DeepSeek
export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731   # read by the examples
```

`DEEPSEEK_API_KEY` and `DEEPSEEK_BASE_URL` are read by `sdk.Open` when the
matching `Config` fields are empty, so the examples never mention them.
`DEEPSEEK_MODEL` is the examples' own, because the model id differs by endpoint:
`deepseek-v4-flash` at DeepSeek, `deepseek/deepseek-v4-flash-0731` through
OpenRouter. Unset, they use the DeepSeek id.

Everything below was captured from a real run against the OpenRouter gateway,
with `…` marking where a long answer was trimmed. Model prose varies run to run;
the assertions do not.

> **A known flake, so it does not read as your mistake.** Opening a *second*
> harness in the same process and running a turn on it hangs some of the time —
> measured at 3–5 rounds in 10 with a tight open/close loop, and rarely with the
> two that example 02 opens. It predates these examples (a controlled A/B pinned
> it to the runtime, not to anything here) and affects only 02 and 05, the two
> that open more than one. Re-run it.

## The tour

| # | Directory | The harness idea | Seam / event |
|---|---|---|---|
| 01 | [`01-hello`](01-hello) | An agent runs inside your process. No Node, nothing installed. | — |
| 02 | [`02-chat`](02-chat) | The session log is the source of truth; a run owns an *interval*, not an answer. | `session/event`, `ctx.sessionPersistence` |
| 03 | [`03-workspace`](03-workspace) | Capability is fenced by composition, not by trust. | `ctx.fs` via `CWD`/`Roots` |
| 04 | [`04-tools`](04-tools) | The agent's tools come from plugins; yours can be Go functions. | `ctx.tools.register()` |
| 05 | [`05-composition`](05-composition) | The plugin list *is* the product. Two agents from one binary. | the composition |
| 06 | [`06-policy`](06-policy) | Policy is a reorderable waterfall plus a monotonic guard. | `tools/pre-execute`, `ctx.tools.guard()` |
| 07 | [`07-approval`](07-approval) | A Go handler may block, so a human can stand in the waterfall. | `tools/pre-execute` |
| 08 | [`08-audit`](08-audit) | Wrap to measure, observe to record; effects revert themselves. | `tools/execute`, `tools/result`, `ctx.Effect` |
| 09 | [`09-context`](09-context) | Every step can carry facts the model cannot know. | `ctx.systemPrompt.section()` |
| 10 | [`10-shell`](10-shell) | Go fills a seam the JavaScript runtime cannot. The agent gains `bash`. | `ctx.shell` |

---

## 01 · hello — one turn

`sdk.Open` → `h.Run` → the final response, the finish reason, the duration. It
prints `sdk.HarnessVersion()` first, so you can see which upstream revision is
compiled into the binary.

There is no service to start, no runtime to install and no subprocess. The
harness is in the binary, on a pure-Go JavaScript engine.

```
DeepSeek Harness 0.1.0-rc.7 (99f6f02fecdb), embedded

A pure-Go JavaScript engine lets you embed and run JavaScript inside Go
applications without CGO or external dependencies, making it trivially
cross-compilable and easy to embed for scripting, plugins, or config logic.

[completed in 17.589s]
```

With no `CWD` set, the agent works in the process's working directory and its
session log lands in `./.sessions` there. Example 03 sets that fence
deliberately.

## 02 · chat — a conversation, and the log underneath it

A stdin REPL on one session, streamed token by token off `assistant/chunk`.
When it ends the program does two things, and together they are the lesson.

It **reads the session log back off disk and reprints the conversation** — a
transcript it never held in memory. Then it opens a **second harness on the same
session id** and asks it what was said first, and the second one knows.

The harness does not hand you the conversation. It appends every turn to a
durable ordered log, and the model's history, a resume and an audit are all
derived from that. A session id is not a handle — it is the name of a log, which
is why using one again in a new process continues rather than restarts.
Upstream:
[`docs/subsystems/persistence.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/persistence.md),
[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/capability-seams.md).

The example also reconfigures the persistence provider through the composition
(plain JSONL instead of the default zstd), which is what makes the log readable
here without a decompressor. Both compressions resume; only one is legible to
`jq`.

```sh
printf 'Name a fruit. One word.\nWhat colour is it? One word.\n' | go run ./examples/02-chat
```

```
you> dsh> Mango
     [completed, 0 tool calls, 3.828s]

you> dsh> Orange
     [completed, 0 tool calls, 3.485s]

--- the log: /tmp/dsh-chat-…/.sessions/…/chat/session.jsonl (13397 bytes) ---
header · id "chat", cwd /tmp/dsh-chat-…, started 2026-08-19T13:20:01+03:00

you> Name a fruit. One word.
dsh> Mango
you> What colour is it? One word.
dsh> Orange

--- everything else the log holds ---
  session                  1
  agent/inbox/spliced      4
  turn/start               2
  step/start               2
  user/message             2
  session/title            1
  request/header           1
  request/context          1
  assistant/chunk          11
  assistant/message        2
  step/end                 2
  turn/end                 2

The log is the durable copy: ordered, self-describing, and readable
by anything — including, next, by a second harness.

--- a second harness, same session id ---
"Name a fruit. One word."

[the first thing said was "Name a fruit. One word."]
PASS: a second process picked the conversation back up.
```

**What a run is.** A run owns the interval from the prompt being durably
received to the next whole-agent idle — *not* "the answer to my question".
Steering, injected context and a subagent finishing all land in the same
interval and contribute to the same `RunResult`. See
[`docs/defensive-patterns.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/defensive-patterns.md)
and `sdk/doc.go`.

## 03 · workspace — a fenced editor, checked on disk

The agent is given a temp workspace holding a small broken file, an explicit
`CWD`, an explicit `Roots` and an explicit `Env`. It fixes the file — and then
**Go reads the file back**, because the assertion belongs on the bytes, not on
the model's word.

Then the same agent is asked for something outside the fence. `ctx.fs` refuses
it, and the program can see the refusal rather than only reading about it in the
reply.

```
--- fixing greet.js ---
Fixed. The bug was a typo in line 2: the parameter `name` was misspelled as
`nmae`, so the function referenced an undefined variable and returned
`"Hello, undefined!"`. I corrected it to `name`. Nothing else was changed.
[completed, 2 tool calls]

--- greet.js on disk ---
function greet(name) {
  return "Hello, " + name + "!";
}

module.exports = { greet };

PASS: the file on disk is fixed.

--- now something outside the fence ---
the fence said · Error: EACCES: path is outside the permitted roots: /etc/hostname

I cannot read /etc/hostname because the filesystem backend restricts access to
allowed root directories, and this path is outside those permitted roots.
```

Upstream: [`docs/subsystems/filesystem.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/filesystem.md).

## 04 · tools — your functions, as tools

Two Go functions over a deterministic in-memory dataset, exposed as
`order_status` and `refund_window`. The program prints `h.Tools(ctx)` **before**
the turn, so the Go tools are visibly sitting in one registry beside `read`,
`edit` and `todo_write`.

The question asked is one no model could answer from training data — a
per-category refund policy and a delivery date — so a pass cannot be the model
being agreeable.

```
the registry: edit job_kill job_list job_output order_status read refund_window
              skill str_replace_editor todo_write write
(ours and the harness's own, in one list)

--- the turn ---
**Order A-4471** (headphones)
- **Where:** Delivered on 2026-08-02 by Ryder (tracking RY82255193).
- **Return window:** ❌ **Closed.** Headphones have a 14-day window, and it
  ended 3 days ago.

**Order A-4472**
- **Where:** Still **in transit** with Ryder (tracking RY82255207).
- **Return window:** ⏳ Not started yet — it begins once it's delivered.
…
[completed, Go tools called: order_status, refund_window, order_status, refund_window]
```

Three things the example makes explicit: the parameter-spec shape
(`"required": true` inside each parameter), that a returned **error becomes what
the model is told** — so `no order "A-9"; known orders: A-4108, A-4471, A-4472`
earns a corrected retry where `not found` earns a shrug — and that each
`Execute` runs on its own goroutine and must honour its `context.Context`.

Upstream: [`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md).

## 05 · composition — the plugin list is the product

**This one calls no model.** It proves its claim by inspection, which is the
right shape for it: what the bundle can serve, what a config would mount, and
what two adjusted lists actually did mount.

```
--- the bundle serves 64 modules; 29 of them are dsh plugins ---
  @deepseek-ai/dsh-agent @deepseek-ai/dsh-agent-loop
  @deepseek-ai/dsh-agent-spine-demo @deepseek-ai/dsh-bash-local
  …
  @deepseek-ai/dsh-tool-bash @deepseek-ai/dsh-tool-fs
  @deepseek-ai/dsh-tool-skill @deepseek-ai/dsh-tool-str-replace-editor
  @deepseek-ai/dsh-tool-todo @deepseek-ai/dsh-tool-web @deepseek-ai/dsh-tools

--- the default composition ---
  llm-deepseek             @deepseek-ai/dsh-llm-deepseek
  agent-spine              @deepseek-ai/dsh-agent-spine-demo
  persistence              @deepseek-ai/dsh-session-persistence-jsonl
  checkpoint-policy        @deepseek-ai/dsh-session-checkpoint-policy
  fs-local                 @deepseek-ai/dsh-fs-local
  tool-fs                  @deepseek-ai/dsh-tool-fs
  tool-str-replace-editor  @deepseek-ai/dsh-tool-str-replace-editor
  tool-todo                @deepseek-ai/dsh-tool-todo

--- two agents, one binary ---
  default : edit job_kill job_list job_output read skill str_replace_editor todo_write write
  lean    : edit job_kill job_list job_output read skill write
  removed : str_replace_editor todo_write
  added   : (none)
  (tool-web mounted nothing: it injects `web`, which this bundle has no provider for)
```

That last line is the one to sit with. `tool-web` was **added** to the
composition and mounted nothing, because an unsatisfied component waits rather
than failing. Example 10 is the other end of exactly that.

The example also demonstrates the two quiet traps:

- an entry's config **replaces** the plugin's defaults rather than merging, so
  an override that mentions one key discards the rest;
- a composition naming a plugin the bundle does not carry is refused at `Open`,
  not during a turn.

Upstream: [`docs/cordis-tutorial/06-composition-and-hmr.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cordis-tutorial/06-composition-and-hmr.md),
[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/config-catalog.md).

## 06 · policy — a deny with a reason, and a deny nobody can undo

One Go component, two layers, and the contrast between them is the lesson.

1. A **`tools/pre-execute` listener** allows reads and denies writes outside
   `drafts/`, returning `{"kind":"deny","reason":…}`. This is a waterfall: each
   listener may allow, deny or defer to the next, and the order is the
   deployment's to choose.
2. A **`ctx.tools.guard()`** denies any call touching `.env`, whatever the
   listeners above decided. A guard returns a reason or nothing; there is no
   allow result, so no ordering of listeners can turn a denial back into
   permission.

The transcript shows the guard doing exactly that — the waterfall **allowed**
the `.env` read and the guard overrode it:

```
--- what the policy decided ---
  waterfall write               DENY  this agent may only write inside drafts/, and "notes.txt" is not there
  waterfall write               allow drafts/notes.md
  waterfall read                allow .env
  guard     read                DENY  .env holds credentials and no tool may touch it

--- the workspace afterwards ---
  PASS  notes.txt          exists=false  denied by the waterfall: outside drafts/
  PASS  drafts/notes.md    exists=true   allowed: inside drafts/
  PASS  .env               34 bytes, secret in the answer=false, guard denials=1
```

The agent was told no, adapted, and reported honestly. Sandboxing, permission
presets and plan mode are all listeners on this same waterfall upstream. The
loop was not modified.

> **A trap the example documents in full.** A guard's contract is
> `string | undefined`, and Go has no `undefined` — nor has JSON, so a Go `nil`
> crosses the bridge as `null`, which in JavaScript is *not* `undefined`. A
> guard returning `nil` therefore denies **every** call in the harness, with the
> reason `null`. `sdk.Undefined()` is how Go says undefined and means it: a
> bridge marker rather than a held reference, so it costs no call and is safe to
> return from the synchronous callback a guard has to be.

Upstream: [`docs/tool-execution-pipeline.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/tool-execution-pipeline.md).

## 07 · approval — a human in the waterfall

The same seam, used differently: the handler prints the proposed call **with its
content** and blocks on stdin for `y`/`n`.

It can block because `Context.Func` runs the handler on its own goroutine and
answers the JavaScript world with a promise. Waiting on a human stops that one
tool call and nothing else — the harness's timers keep firing, other sessions
keep running. That is the practical difference between hosting the harness and
driving one over a pipe: the gate is a function call, not a protocol.

```sh
printf 'n\ny\n' | go run ./examples/07-approval    # or answer it yourself
```

```
┌─ the agent wants to write notes.txt
│  first
└─ allow? [y/N] n

┌─ the agent wants to write summary.md
│  second
└─ allow? [y/N] y

--- the agent ---
- **notes.txt** — ❌ **not created**: a human reviewer declined the write.
- **summary.md** — ✅ **created**: it now contains the single line `second`.

--- the workspace afterwards ---
  .sessions
  summary.md
```

When stdin runs out the gate falls back to `DSH_APPROVE` (`y`/`n`, default `n`),
so the example still finishes unattended.

**Why not `ctx.approval`.** The harness has a dedicated approval seam, and
`{kind:"ask"}` routes to it. It is deliberately unused here: no approval
provider is in this bundle, and the seam **fails closed** — a missing,
non-owning, throwing or non-conforming answerer becomes `unavailable`, which
denies rather than opens the gate. `{kind:"ask"}` here would be an
unconditional no. See
[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/capability-seams.md)
and [`docs/subsystems/approval.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/approval.md).

## 08 · audit — wrap to measure, observe to record

A component that writes one JSONL record per tool call: name, arguments,
verdict, duration, error. It uses two hooks, and the split is upstream's own
selection rule from
[`docs/cookbook/adding-a-tool.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/cookbook/adding-a-tool.md#execution-policy-and-observation):

- **`tools/execute` wraps the dispatch.** It is the one hook whose lexical
  lifetime spans the call, so it is the only place a duration can be measured.
- **`tools/result` observes the frozen authoritative outcome.** It cannot change
  anything, which is precisely why it is where the record belongs: what it sees
  is what happened.

The file handle is installed with `ctx.Effect` and the flush-and-close with
`ctx.OnDispose`. Nothing in the program uninstalls either — `h.Close()` unmounts
the component, and the JSONL is complete on disk by the time it returns.

```
--- teardown, in the order it happened ---
  1. effect inverse: stopped accepting records
  2. go teardown: flushed and closed tool-calls.jsonl

--- the audit log, read back after Close ---
  read                7.4ms          ok
  read                10.0ms         FAILED: cannot read "/tmp/dsh-audit-…/prices.txt": not found
  edit                5.2ms          ok
  read                5.5ms          ok

[4 tool calls recorded; http steps map[cancel:8 chunk:177 eof:4 fetch:4 response:4]]
```

The http line is `Config.TraceHTTP`, the request-level view beside the
tool-level one.

> **A naming trap, which upstream flags explicitly** in
> [`docs/user/develop/framework/events.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/user/develop/framework/events.md):
> `tools/result` — the cordis event listened to here — is **not** `tool/result`,
> the durable session-event type observed through `session/event`. Plural is the
> pipeline; singular is the log.

## 09 · context — facts the model cannot know

A Go component registers a system-prompt section whose `text` is not a string
but a **provider**: a `ctx.SyncFunc` the harness calls at each assembly. The
deployment status changes between the two turns, in Go, with no re-open and no
injected message — and the model's answer moves with it.

```
--- turn 1 ---
Current release is v4.2.1, the build pipeline is green (last build passed 11
minutes ago), and rita@example.com is on call.

--- the host changes the facts (deploy lands, on-call rotates) ---

--- turn 2, same session ---
The facts are the same: release v4.3.0, build pipeline red, sam@example.com on call.

[the section was assembled 2 times]
  PASS  v4.3.0   present=true   the new release
  PASS  v4.2.1   present=false  the old release, which must not survive into turn 2
  PASS  sam      present=true   the new on-call
```

Both turns run on **one session**, so the second answer cannot be explained by a
reset conversation.

**The heavier alternative.** A section contributes to the system prompt. To
inject whole *messages* before a step — or to refuse the step outright — listen
on the `agent/pre-step` waterfall, whose decision is
`{kind:'reject'} | {kind:'enter', messages}`. That is how upstream's own
`time-context` and `agent-instructions` work, and thirteen shipped plugins
listen there: compaction, plan mode, the two hooks bridges, the skill tool, the
subagent driver, and more. No row modifies the loop.

Upstream: [`docs/subsystems/system-prompt.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/system-prompt.md).

## 10 · shell — Go becomes a capability seam

The capstone.

`ctx.shell` is a seam: an abstract three-method service — `resolve`, `run`,
`start` — that somebody must provide. The harness's own `tool-bash` plugin is
**already mounted and already waiting** in the default composition, because it
injects `['tools', 'shell', 'systemPrompt', 'shellEnv']` and the bundle provides
every one of those except `shell`. Nothing in this runtime can reach a
subprocess; `node:child_process` is refused by name.

So this program provides `shell`. In Go, with `os/exec`, an allowlist and a
deadline it owns:

```go
Plugins: []sdk.Plugin{{
    ID:      "go-shell",
    Provide: []string{"shell"},
    Apply:   executor.apply,
}},
```

And then:

```
the registry: bash edit job_kill job_list job_output read skill str_replace_editor todo_write write

`bash` is in that list, and this program never registered it.
```

Nothing was configured to make that happen and no flag was set. `tool-bash`'s
declared coeffect became satisfiable, so the loader mounted it. **The dependency
topology did it.** Compare example 05, where the same registry has no `bash` at
all.

The agent gets a shell, and your program decides what a shell means:

```
--- every command, as this program saw it ---
  REFUSED  ls -la; find . -name inventory.txt 2>/d… ";" chains, redirects or substitutes, and this shell runs exactly one program
  ran      ls -la                                   exit 0 in 4ms
  REFUSED  find . -name inventory.txt               "find" is not on the allowlist; allowed programs are cat, cut, echo, grep, head, ls, sort, tail, wc
  ran      wc -l inventory.txt                      exit 0 in 1ms
  ran      sort inventory.txt                       exit 0 in 1ms
  ran      cat inventory.txt                        exit 0 in 0s
  REFUSED  curl https://example.com                 "curl" is not on the allowlist; allowed programs are cat, cut, echo, grep, head, ls, sort, tail, wc

[4 commands run, 3 refused by the Go allowlist]
```

Every command is allowlisted, time-boxed and logged by code you own, in your
language, in your process — rather than by a sandbox configured from outside and
hoped to be right. Note what the executor does *not* do: hand the string to
`bash -c`. The tool tells the model it is talking to bash; this executor answers
a deliberately smaller question, and there is no shell present to be injected
into.

The request's optional `AbortSignal` is dropped in favour of the Go deadline,
and the example says so where it does it.

Upstream: [`docs/subsystems/shell.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/shell.md),
[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/capability-seams.md).

---

## What is deliberately not here

The embedded bundle constrains the set, and pretending otherwise would make the
examples lie.

- **No web-search example.** `tool-web` is bundled but injects `web`, whose
  provider (`dsh-web`) is not. It mounts nothing — which example 05 shows
  rather than hides.
- **No `ctx.approval` example.** No approval provider is bundled, and the seam
  fails closed, so `{kind:"ask"}` denies. Example 07 gates inside the
  `tools/pre-execute` handler instead.
- **`bash` is absent by default**, for the reason example 10 exists.

## Ground rules these follow

- **Standard library only.** No new module dependencies; `go.mod` is untouched.
  The examples live in the module, so `go build ./...` and `go vet ./...` cover
  them.
- **No shared helper package.** A little duplication is the price of each
  example standing alone and being copy-pasteable.
- **Every claim is checked, not asserted.** 03 verifies its edit by reading the
  file. 04, 05 and 10 assert against `h.Tools(ctx)`. 06 and 07 are only finished
  when a denial appears *and* the workspace afterwards agrees. 08 is only
  finished when the JSONL exists after `Close`. Where an example cannot check
  something, it says so.
