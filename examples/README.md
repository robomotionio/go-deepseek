# examples — a tour of the DeepSeek Harness, hosted in Go

Thirteen runnable programs, simple to complex. Each one proves a single idea
about the harness, is self-contained, and can be copied out of here whole.

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
cannot, and the agent gains a tool this program never registered. By example 12
one model has taught another something neither could have known, and the lesson
outlives both processes in a file the agents cannot reach.

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

> **A known flake, so it does not read as your mistake.** A turn occasionally
> fails to settle. It shows up two ways: the run hangs, or it comes back with
> `turn result: unexpected end of JSON input (the runtime answered "")`.
>
> It predates these examples and belongs to the runtime rather than to anything
> here — a controlled A/B, with only `internal/runtime/js/boot.js` differing,
> measured 5 hangs in 10 rounds on the unmodified `main` and 3 in 10 with this
> branch's changes. It is most reproducible with a tight open-a-harness /
> run-a-turn / close loop (which is why the A/B used one), but it is not
> confined to that shape: example 07, which opens a single harness, hit it once
> in roughly eight runs, then passed six for six.
>
> Any example can hit it. Re-run. Example 12 also shows the recovery: on this
> exact signature it resumes the session once, telling the model the cutoff was
> infrastructure — the captured run below hit it mid-replay and finished the
> job anyway, because everything a turn needs survives the dead one.

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
| 11 | [`11-learning`](11-learning) | The agent gains a capability it did not have, and keeps it. | `ctx.skills.register()` |
| 12 | [`12-advanced-learning`](12-advanced-learning) | An RPA job learned once and replayed cheaply, checked against the site's own state. | `ctx.skills.register()`, Go tools |
| 13 | [`13-phone-banking`](13-phone-banking) | A telephone menu explored once; the second caller keys straight through it. | `ctx.skills.register()`, Go tools |

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
  ran      ls -la                                   exit 0 in 2ms
  ran      cat inventory.txt                        exit 0 in 1ms
  REFUSED  count=$(awk '{n++} END {print n}' inven… "$" chains, redirects or substitutes, and this shell runs exactly one program
  REFUSED  cat inventory.txt | sort | tail -1       "|" chains, redirects or substitutes, and this shell runs exactly one program
  REFUSED  curl https://example.com                 "curl" is not on the allowlist; allowed programs are cat, cut, echo, grep, head, ls, sort, tail, wc
  REFUSED  cat /etc/hostname                        "/etc/hostname" is an absolute path, and this shell reaches only the workspace
  ran      wc -l inventory.txt                      exit 0 in 1ms
  ran      sort inventory.txt                       exit 0 in 1ms

[4 commands run, 4 refused by the host program]
[allowlist refused a program: true | the fence refused a path: true]
```

**Two fences, and the second is the one that gets forgotten.** The allowlist
decides which *programs* run. It says nothing about which *files* they touch —
`cat` is a safe program and `cat /etc/passwd` is not a safe command, and
`ctx.fs` does not reach a subprocess. So the executor also requires every
argument to be a relative path that stays put, which is why `cat /etc/hostname`
is refused above. A program allowlist on its own would have let it through.

Getting that second fence right is fiddlier than it looks, which is why it is
the one part of the tour with its own test (`fence_test.go`). A review of this
branch found the first hole in it: `grep -f/etc/passwd` is how GNU getopt
spells `grep -f /etc/passwd`, and a check that only understood `--flag=value`
walked straight past it.

Note what the executor does *not* do: hand the string to `bash -c`. The tool
tells the model it is talking to bash; this executor answers a deliberately
smaller question, and there is no shell present to be injected into. The
chaining refusal is therefore not an injection defence — a `;` in an argv is
inert — it is the executor declining to pretend it is a shell, so that
`ls -la; rm -rf /` fails loudly instead of running `ls` with four odd arguments.

Portability, since the surrounding prose advertises Go's: the allowlist names
POSIX coreutils, so example 10 needs them on `PATH`. On stock Windows without
WSL or Git Bash every command fails "executable file not found" — loudly, but
it fails. The seam and the Go executor are portable; this executor's *policy*
is not, and the policy is the part you would replace.

The request's optional `AbortSignal` is dropped in favour of the Go deadline,
and the example says so where it does it.

Upstream: [`docs/subsystems/shell.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/subsystems/shell.md),
[`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/main/docs/capability-seams.md).

## 11 · learning — a capability it did not have, and keeps

Three turns and two processes.

The agent is asked something no model can know, and cannot answer. It is then
told the rule, and calls `learn` — a Go tool. Go decides whether that is worth
keeping, registers it on `ctx.skills`, and appends it to a file. Then a **second
process** opens on the same workspace, replays that file into `ctx.skills` at
mount, and is asked the ORIGINAL question on a session that has never been
spoken to. It loads the skill and answers.

`ctx.skills` is the seam upstream fills from `.dsh/skills` with
`@deepseek-ai/dsh-skill-filesystem`. `ctx.skills.register` reaches it from Go,
which means the host decides what the agent is allowed to remember.

**The memory is the host's, not the agent's.** `learned.jsonl` is written
outside `Config.Roots`, so the agent's own `read` cannot reach it — and that is
what makes the third turn mean anything. A file inside the workspace would leave
"it read its notes" as an explanation exactly as good as "it loaded the skill",
and the whole point is that those are different. The program asserts the
separation rather than claiming it.

Three facts the example documents because none of them is obvious and each
cost time:

- **A Go plugin's calls cross the bridge only while the event loop is running** —
  during `Apply`, and during a turn. Between turns the owning goroutine is parked
  waiting for work, so a bridge call made from the host in that gap BLOCKS rather
  than failing. Learning therefore happens inside a tool call, which is where it
  belongs: the agent decides it has learned something and says so by calling a
  tool.
- **A learned skill is knowledge, not code.** Go cannot evaluate JavaScript the
  model wrote — `node:vm` is refused by this runtime by name, and upstream's
  self-referential toolset (`@deepseek-ai/dsh-tool-cordis`, which `web-cordis`
  demonstrates) is not in this bundle because its runner needs exactly that.
- **A skill invisible in the catalog might as well not exist.** A registered
  skill is loadable only by exact name, and the model learns the names from an
  `<available_skills>` catalog that `tool-skill` injects — but only when every
  skill provider reports its discovery complete, and bundled
  `skill-filesystem` cannot complete here (see "What is deliberately not
  here"). One incomplete provider suppresses the whole catalog, silently. A
  model told "load your skill" then guesses a plausible name, misses, and
  falls back to not knowing — so both 11 and 12 point that provider at no
  roots on the spine's composition entry, which is also the truth of this
  deployment: every skill in it is host-registered.

From a captured run:

```
--- turn 1: cold ---
I don't know how to work this out, and I'll say so plainly.
The workspace available to me contains no reference materials about part
RM-7 … no procedure for computing "flux tolerance" from a bore size. …

--- turn 2: taught ---
The flux tolerance of part RM-7 (bore 12 mm) is **21.45 mm** …
[tools: learn skill]

--- turn 3: a second process, same question, no conversation ---
21.45 mm
The flux tolerance is calculated as: bore (12 mm) × 1.8 − 0.4 = 21.2 mm, plus
an additional 0.25 mm because part RM-7 ends in an odd digit (7) …
[tools: skill]
```

Turn 2 is worth a second look: `learn` first, then `skill` — the catalog
updated mid-conversation when the registration landed, and the model loaded
its own minutes-old lesson to check what it had written.

## 12 · advanced-learning — a day's RPA, learned once

The capstone of the two. Example 11 taught the agent a fact; this one has it
learn a **job**.

This program serves a **Workmonth HR portal** on loopback with six pending
leave requests in it, and gives the agent two Go functions — `open` and
`submit` — holding a cookie jar and an `http.Client` fenced to that one origin.
That is a browser in the only sense an RPA needs one. Nothing else about the
site is in the prompt: no map, no field names, no policy.

```
run 1   explore   sign in, wander, find the policy, decide six requests,
                  then record the whole route with `learn`
RESET             the queue goes back to six pending, every session forgotten
run 2   replay    a new process, a new session, the same task, and the lesson
                  replayed into ctx.skills before the first token
```

**The portal is awkward on purpose**, in the specific ways enterprise software
is awkward: login fields called `u` and `p`, a session cookie, a per-page token
a POST is refused without, a queue that paginates, the leave policy on a page
nothing links to prominently, and a denial reason that must begin with the rule
that failed or be rejected. None of it is hard. It is just unknowable without
going and finding out — which is the cost the example is about paying once.

**What is measured.** The portal counts every HTTP request it serves, so the
two runs are compared on what actually costs time and money: trips to the site,
tool calls, and wall clock. The exploring run pays for the map. The replaying
run has it.

**How it is verified**, which is the half that makes this more than a demo. The
portal is a Go struct in this process. When a run finishes, the assertions read
that struct — never the agent's summary — and check all six decisions against
the policy written in Go beside the handbook page. Three approvals and three
denials, each denial naming the one rule it actually breaks. `TOR-2045` is the
one that matters: sick leave starting inside the month-end blackout with no
notice at all, so a run that skipped the exemption sentence denies it and the
audit says so.

From a captured run — the same job, twice:

```
                               run 1     run 2
  HTTP requests                   15        10
  tool calls                      17        11
  wall clock                   2m32s       57s
  queue cleared correctly        yes       yes

--- run 2: tools called ---
  skill submit submit open open open submit open open open open
  · skill {"name": "workmonth-leave-queue"}

--- run 2: what the portal was asked for ---
  POST /login
  GET /desk
  GET /timeoff/export
  GET /handbook/leave-policy
  GET /timeoff/bulk
  POST /timeoff/bulk-decide
  GET /timeoff
  …
```

Run 1 wandered: the desk, the handbook, both queue pages, three detail pages —
then found `/timeoff/export`, decided the queue in bulk, and recorded
`workmonth-leave-queue`. Run 2's first tool call loads that lesson by name, and
its first HTTP request is `POST /login`: it never fetched the login page,
because the lesson already says what the form takes. The queue itself is still
read fresh — it is the site that is not re-learned.

Set `DSH_EXPLORER_MODEL` and `DSH_OPERATOR_MODEL` to two different ids on your
gateway to have one model do the exploring and another do the work — which is
the shape a deployment actually wants, because only one of the two has to be
clever.

**It has a test**, like example 10, and for the same reason: the portal and the
browser have to work before a model is worth spending. `go test
./examples/12-advanced-learning` walks the entire job with no model at all —
the token trap, the reason format, the pagination, the bulk route, and the
fence that keeps the browser on one origin.

> Why a stand-in and not a live site. Robomotion's training systems
> ([workmonth.robomotion.online](https://workmonth.robomotion.online) and its
> siblings) are static React SPAs with zero backend — real RPA against them
> drives a headed Chrome, which is a dependency these examples do not take. The
> stand-in borrows their personas, their `GLX-` worker ids and their published
> credentials, and buys two things a live site cannot: the same six requests
> every run, and verification that reads the portal's own state instead of
> believing the agent.

## 13 · phone-banking — a telephone menu, learned once

Example 12's idea, on the oldest self-describing interface in production
anywhere: an IVR — the bank line that reads its options aloud. *"For account
services, press 1. For card services, press 2."* Everything the agent needs to
know is spoken to it, and every word costs airtime, which is exactly the trade
this example measures.

This program is a **Meridian Trust Bank** phone line: a menu tree three deep,
an access code demanded at the door of anything private, and a credit card
balance read out at the bottom of one path. The agent gets three Go
functions — `dial`, `press`, `hangup` — and a question: what is the balance?
Nothing about the tree is in the prompt beyond the number and the code. The
model decides every key.

```
run 1   explore   dial, listen, ride branch after branch to the bottom,
                  find the balance behind the access code — then record
                  the route with `learn`
RESET             the call log is wiped and THE BALANCE CHANGES, the way a
                  balance does; the menus hold still
run 2   replay    a new process, a new session, the same question, and the
                  lesson replayed into ctx.skills before the first token
```

**The menu is deliberately unhelpful, and that is the design.** An earlier
draft of this tree labelled its departments honestly — "card services", "card
balances and payments" — and the exploring run walked straight down without a
single wrong turn, because an IVR is self-describing and a model that READS
never has to GUESS. The comparison still held (exploring costs listening even
when every guess is right), but the exploration never showed. So the tree is
now shaped the way real bank lines actually fail their callers: every
department name is equally plausible — a balance could live under *account
services*, *card services* or *member services* — only the **leaves** say
what they are, one branch bottoms out in a balance that is not the balance
(rewards points), and the credit card figure waits behind the label a caller
tries last, carded. Now the first caller has to do what first callers do:
ride a branch to the bottom, hear what is actually there, back out with star,
and try the next.

**The line supports keying ahead**, as real IVRs do: keys sent in one `press`
are taken in order, and the menus keyed past are never played — not heard, not
charged, not in the log. That is the mechanical reason a learned route is
cheap. The first caller listens to every menu on the way down; a caller who
knows the tree interrupts all of them.

**What is measured.** The line logs every prompt it plays and every key it
takes, and prices each prompt at spoken pace (150 words a minute) — so the two
runs are compared on what a phone call actually costs: menus sat through, keys
pressed, wrong turns, airtime.

**How it is verified.** The balance is different on each run, so run 2 can
only be right by dialing and hearing it fresh — a lesson that recorded the
figure instead of the route would read out a stale number and fail. And the
trail is the IVR's own log, never the agent's summary: "run 2 heard it fresh"
is the credit-balance leaf sitting in the list of prompts the line actually
played.

From a captured run. Run 1's trail is the search, written in keys:

```
--- run 1: the call, leg by leg ---
  dial 1-800-634-7100      → main-menu (20s)
  press 2                  → card-services (14s)
  press 1                  → card-programs (12s)
  press *2                 → card-assistance (18s)
  hangup                   ☎
  dial 1-800-634-7100      → main-menu (20s)
  press 1                  → account-services (14s)
  press 1                  → account-information (14s)
  …
  press 1                  → rewards (11s)          ← a balance! …of points
  press *2                 → travel-benefits (9s)
  …
  press *3                 → member-services (16s)
  press 1                  → access-code (8s)
  press 731942#            → self-service (23s)
  press 2                  → credit-balance (15s)   ← BINGO
  hangup                   ☎
  dial 1-800-634-7100      → main-menu (20s)
  press 31731942#2         → credit-balance (24s)   ← proving the fast route
```

And run 2's trail is the learned answer:

```
--- run 2: the call, leg by leg ---
  dial 1-800-634-7100      → main-menu (20s)
  press 31731942#2         → credit-balance (24s)
  hangup                   ☎

--- run 2: tools called ---
  skill dial press hangup
  · skill {"name": "meridian-trust-credit-balance"}

                                run 1      run 2
  prompts listened to              26          2
  keys pressed                     43         10
  wrong turns                      17          0
  airtime (simulated)           6m34s        44s
  wall clock                    2m58s        14s
  the balance on the line   $2,847.19  $1,983.47
  reported correctly              yes        yes
```

Run 2's entire call is two prompts: the greeting it cannot skip, and the
balance — with the new figure, $1,983.47, which did not exist when the lesson
was written. The route survived the reset; a memorized figure would not have.

The lesson run 1 recorded is worth reading in the program's output. It holds
the tree depth by depth, the one-press sequence `31731942#2` — and the
negative knowledge only exploration can buy: *"do NOT press 2 (card
services) — the credit card balance is NOT under card services."* Seventeen
wrong turns, distilled into one sentence no later session will ever pay for
again. The host's `admissible` check polices only the shape; the model chose
the content, and the assertion `the route, not the figure` checks the balance
itself appears nowhere in it. (Reading its own lesson back *after* recording
it is allowed — the captured run did exactly that, like example 11's — the
assertion only insists nothing was loaded before `learn`.)

Set `DSH_EXPLORER_MODEL` and `DSH_OPERATOR_MODEL` to two different ids to have
one model do the listening and another do the calling, as in example 12.

**It has a test**, for the same reason 10 and 12 do: `go test
./examples/13-phone-banking` walks the whole call with no model — the
plausible-but-wrong branches down to their leaves, the rewards decoy, the
access-code gate, the wrong-code refusal, star and 0, the keyed-ahead fast
route, and the fence that keeps the handset on one number. The test proves
the tree is walkable; the example is the model walking it.

**And it has a face.** `go run ./examples/13-phone-banking/web` serves the
same demo as a page to watch: a touch-tone phone whose keys light and click
(real DTMF, synthesized in the browser) as the agent presses them, an LCD
showing every digit, the prompts typing out beside it, and the two runs'
found-it stamps and comparison table. Everything on the page is the agent's
own tool-call stream over Server-Sent Events — one stdlib binary, page
embedded, nothing scripted. The web demo also accepts an `OPENROUTER_API_KEY`
on its own: it checks both variables, prefers an explicit `DEEPSEEK_API_KEY`,
and otherwise aims itself at OpenRouter with that endpoint's model id.


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
- **No self-mounting-plugin example**, which is what upstream's `web-cordis`
  shows. `@deepseek-ai/dsh-tool-cordis` is not in this bundle — `cordis_define`,
  `cordis_inspect` and `dynamicCordisRunner` appear in no bundled module — and
  its runner needs `node:vm`, which this runtime refuses by name. Example 11 is
  the reachable half of that claim: the agent extends its own capabilities, with
  knowledge rather than with code.
- **Filesystem-backed skills now work.** They did not for a while, and the
  reason is worth keeping: `@deepseek-ai/dsh-skill-filesystem` watches its roots
  with chokidar, chokidar needs `fs.watch`, and `fs.watch` was deliberately
  unimplemented here. Incomplete discovery has a quiet consequence —
  `tool-skill` withholds the whole `<available_skills>` catalog until every
  provider reports complete, so a registered skill stayed loadable by exact name
  while nothing told the model the name. `fs.watch`, `fs.watchFile` and the
  `fs/promises.watch` async iterator are implemented now (see
  `internal/nodecompat/watch.go`), and `TestSkillDiscoveryCompletes` in
  `sdk/skills_test.go` asserts the catalogue completes. 11 and 12 still point
  the provider at no roots and keep their durable copy in a file the host owns,
  which is the better place for it anyway. Chasing this surfaced a real compat
  bug, since fixed: `os.homedir()` answered the host's home rather than the
  composed `HOME`, aiming every skill root the provider derives from it outside
  the fence — where the fenced filesystem refuses with EACCES, which is not
  "absent" and poisoned discovery a second way.

## Ground rules these follow

- **Standard library only.** No new module dependencies in the examples
  themselves. They live in the module, so `go build ./...` and `go vet ./...`
  cover them. (The module has one dependency the examples do not use:
  `fsnotify`, which backs `fs.watch`.)
- **No shared helper package.** A little duplication is the price of each
  example standing alone and being copy-pasteable.
- **Every claim is checked, not asserted.** 03 verifies its edit by reading the
  file. 04, 05 and 10 assert against `h.Tools(ctx)`. 06 and 07 are only finished
  when a denial appears *and* the workspace afterwards agrees. 08 is only
  finished when the JSONL exists after `Close`. Where an example cannot check
  something, it says so.
