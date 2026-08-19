// Boot the harness and expose a small control surface to Go.
//
// This is the only JavaScript go-deepseek writes for itself. Everything else is
// upstream's, unmodified: a cordis Context with the Loader mounted, an entry
// list applied to its root group, and the same agent-loop API the upstream
// examples drive.
//
// The entry list arrives as data from Go rather than as YAML from disk. That is
// the one deliberate departure, and it is what removes `!!js` from the picture
// entirely: an expression that would have been evaluated by the loader is
// computed on the Go side and arrives as a value.

// The Node builtins are imported here, first, and deliberately. A bundled
// CommonJS package may `require` one at run time, and require is synchronous —
// so a builtin can only be served if it has already been evaluated. Importing
// them at the top of the first module guarantees that, because a module graph
// evaluates its dependencies in source order, depth first.
import 'node:process';
import 'node:buffer';
import 'node:path';
import 'node:fs';
import 'node:fs/promises';
import 'node:os';
import 'node:util';
import 'node:events';
import 'node:stream';
import 'node:url';
import 'node:crypto';
import 'node:zlib';
import 'node:assert';
import 'node:timers';
import 'node:string_decoder';
import 'node:querystring';
import 'node:tty';
import 'node:perf_hooks';
import 'node:async_hooks';
import 'node:module';

import { Context } from '@deepseek-ai/cordis';
import Loader from '@deepseek-ai/cordis-plugin-loader';
import { SessionId } from '@deepseek-ai/dsh-session';
import { createUserMessage } from '@deepseek-ai/dsh-llm';

// The Go side installs these before this module runs.
const emit = globalThis.__dshEmit;
const options = globalThis.__dshOptions;

/** Every context this boot owns, so that Close disposes what it started. */
let context;

/** Sessions already created, keyed by id: a follow-up turn reuses its agent. */
const agents = new Map();

async function boot(entries) {
  const ctx = new Context();
  // Relative specifiers would resolve against this. Ours are all bare and served
  // from the bundle, so it exists to satisfy the loader rather than to be used.
  ctx.baseUrl = 'dsh:/';
  await ctx.plugin(Loader);
  const loader = ctx.get('loader');
  if (!loader) throw new Error('the loader did not register itself as a service');
  try {
    await loader.root.update(entries);
    // The tree settles asynchronously: entries import, mount and inject in
    // parallel, and a plugin that failed reports here rather than at update().
    await loader.await();
  } catch (error) {
    // The loader wraps a failing entry once per tree layer, and the wrap
    // carries the layer's message rather than the plugin's. Without unwrapping,
    // a mistake deep in a plugin reads as "failed to import loader entry X"
    // with a stack pointing at the loader — true, and useless.
    throw new Error(describeCause(error), { cause: error });
  }
  context = ctx;
  return ctx;
}

// describeCause walks the cause chain to the error that actually happened and
// renders it with its stack, which is the only part that names a file.
function describeCause(error) {
  const chain = [];
  let current = error;
  while (current instanceof Error) {
    chain.push(current);
    current = current.cause;
  }
  const deepest = chain[chain.length - 1] ?? error;
  const lines = chain.map((err, i) => `${'  '.repeat(i)}${err.message}`);
  if (deepest?.stack) lines.push('', String(deepest.stack));
  return lines.join('\n');
}

// forwardEvents pipes the session's own event stream to Go. The events are
// upstream's vocabulary, not ours: keeping their names and shapes is what makes
// a Go consumer of this the same consumer as a JSON-RPC one.
function forwardEvents(ctx, sessionId, agent) {
  const seen = new Set();
  const push = (event) => {
    if (!event || seen.has(event)) return;
    seen.add(event);
    try {
      emit(sessionId, JSON.stringify(event, replacer));
    } catch (err) {
      // A single unserialisable event must not stop the turn: report it as one
      // and carry on, because the alternative is losing the whole stream.
      emit(sessionId, JSON.stringify({ type: 'runtime/event-error', data: { message: String(err) } }));
    }
  };
  // (session, event) — two arguments, not one payload object. Reading it as one
  // meant the filter never matched and nothing was ever streamed: every event
  // arrived at the end of the turn instead, in a burst, from the replay below.
  // The JSON-RPC server plugin upstream subscribes the same way.
  const dispose = ctx.on('session/event', (session, event) => {
    if (session && String(session.id) !== String(sessionId)) return;
    push(event);
  });
  return { dispose, push };
}

// replacer keeps JSON.stringify from failing on the things a session event may
// legitimately contain: a cycle, a bigint, an Error.
function replacer(key, value) {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  return value;
}

function waitForIdle(ctx, agent) {
  return new Promise((resolve) => {
    const dispose = ctx.on('agent/status', ({ agent: subject, status }) => {
      if (subject === agent && status === 'idle') {
        dispose();
        resolve();
      }
    });
  });
}

async function agentFor(ctx, sessionId, agentOptions) {
  const existing = agents.get(sessionId);
  if (existing) return existing;
  const loop = ctx.get('agentLoop') ?? ctx.agentLoop;
  if (!loop) throw new Error('no agentLoop service: the composition has no agent spine');
  // The working directory is session METADATA — create(id, options, meta) — not
  // one of the agent options. Passing it in the options silently does nothing:
  // the session header records no cwd, the file tools refuse every relative
  // path ("notes.txt is not an absolute path"), and the agent spends its turn
  // guessing at paths instead of reading the file.
  const { cwd, ...options } = agentOptions;
  const agent = await openAgent(ctx, loop, sessionId, options, cwd);
  agents.set(sessionId, agent);
  return agent;
}

/**
 * Open the agent for a session id: RESUME it when the id already has a stored
 * log, and create it fresh when it does not.
 *
 * Both halves are needed, and only creating is the bug this replaced. A session
 * id is durable — it is the name of its log — so using one again in a new
 * process is how a conversation continues. Creating on an id that already has
 * history does not start over; the persistence layer sees a stored log that
 * does not match the fresh session and refuses the turn with an id collision,
 * which reads like corruption and is really "you asked for a new session with
 * an old name".
 */
async function openAgent(ctx, loop, sessionId, options, cwd) {
  if (await isStored(ctx, sessionId)) {
    // No cwd here on purpose: a resumed session keeps the workspace recorded in
    // its own header. Overriding it would repoint the file tools halfway
    // through a conversation whose history is full of the old paths.
    const handle = await loop.resume(ctx, {
      resumeSessionId: SessionId(sessionId),
      agentOptions: options,
    });
    return handle.agent;
  }
  return loop.create(SessionId(sessionId), options, cwd ? { cwd } : {});
}

/** Whether this id already has a persisted log to resume from. */
async function isStored(ctx, sessionId) {
  const persistence = ctx.get('sessionPersistence');
  // A composition with no persistence has nothing to resume from, and a
  // backend that cannot be listed is not evidence that history exists — both
  // fall through to creating, which is what this runtime did unconditionally
  // before.
  if (!persistence) return false;
  try {
    const stored = await persistence.list();
    return stored.some((header) => String(header.id) === String(sessionId));
  } catch {
    return false;
  }
}

// finalText is the answer as a caller means it: the text of the last assistant
// message, with the tool calls and reasoning left out.
function finalText(events) {
  const message = [...events].reverse().find((event) => event.type === 'assistant/message');
  if (!message) return '';
  return (message.data?.message?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

// turnOutcome reads how the turn actually ended.
//
// A turn that failed still emits turn/end, and its reason carries the provider's
// error — a 401, a rate limit, a refusal. Reporting that as "completed" with an
// empty answer is the worst possible rendering: the caller sees a successful
// turn that said nothing, and goes looking for the bug in its own prompt. The
// first live run against a gateway did exactly that with a dead API key.
function turnOutcome(events) {
  const end = [...events].reverse().find((event) => event.type === 'turn/end');
  const reason = end?.data?.reason;
  if (reason?.kind === 'error') {
    const error = reason.error ?? reason.failure ?? {};
    return { failed: true, message: error.message ?? 'the turn failed', code: error.code, status: error.status };
  }
  return { failed: false, reason: reason?.kind ?? 'completed' };
}

async function run(sessionId, text, agentOptions) {
  const ctx = context;
  if (!ctx) throw new Error('the harness has not been started');
  const agent = await agentFor(ctx, sessionId, agentOptions);
  const forwarding = forwardEvents(ctx, sessionId, agent);
  try {
    const before = agent.session ? agent.session.events.length : 0;
    agent.followup(createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'user' },
    }));
    await waitForIdle(ctx, agent);
    const events = [...(agent.session?.events ?? [])];
    // Everything this turn produced, which is what a caller wants to inspect —
    // the session accumulates across turns.
    const turn = events.slice(before);
    for (const event of turn) forwarding.push(event);
    const outcome = turnOutcome(turn);
    if (outcome.failed) {
      const label = [outcome.code, outcome.status].filter(Boolean).join(' ');
      throw new Error(label ? `${outcome.message} (${label})` : outcome.message);
    }
    return JSON.stringify({
      text: finalText(turn),
      finishReason: outcome.reason,
      events: turn.length,
    }, replacer);
  } finally {
    forwarding.dispose();
  }
}

// tools reports the registry's view of what the agent can call. `schemas()` is
// the same projection the model is shown, so what this lists is what the model
// sees — including a tool a Go plugin registered.
function tools() {
  const ctx = context;
  if (!ctx) throw new Error('the harness has not been started');
  const registry = ctx.get('tools');
  if (!registry) throw new Error('the composition registers no tool service');
  return JSON.stringify(registry.schemas(), replacer);
}

async function dispose() {
  agents.clear();
  if (context) {
    await context.fiber.dispose();
    context = undefined;
  }
}

// The control surface Go calls. Assigned to the global rather than exported
// because the Go side reaches it by name after the module has evaluated.
globalThis.__dsh = { boot, run, tools, dispose };

// Booting is part of evaluating this module, so a composition that will not
// mount fails at Start rather than at the first turn.
await boot(options.entries);
