// The JavaScript half of the Go plugin bridge.
//
// A Go plugin is a cordis component whose apply() runs in Go. Everything the
// component does to its context — provide a service, inject one, register a
// tool, listen to an event, install a revertible effect — is a call across this
// bridge, so the Go side needs no special case per capability: it names a path
// on the context and passes arguments.
//
// Two problems make that more than a JSON round trip, and this module is what
// solves them.
//
// A JavaScript value often cannot cross. A service object, a context, a session
// — none of them are JSON, and copying them would be wrong anyway because the
// point is to call methods on the ONE that exists. So anything not plainly
// serializable is held here and named by a handle; Go passes the handle back to
// reach the same object.
//
// A Go value often has to be callable. A tool's execute, an event listener, an
// effect's inverse, a service's methods: cordis wants functions, and Go has
// closures. A marker in the encoded value ({"$fn": n}) is revived here into a
// real function that calls back into Go.

// The one upstream import here. Registering a tool means handing the registry a
// definition built by defineTool, which compiles the parameter spec into JSON
// Schema and wraps execute in the validation the registry expects — reproducing
// that in Go would be a copy of upstream's schema compiler to keep in step.
import { defineTool } from '@deepseek-ai/dsh-tools';

const refs = new Map();
let nextRef = 0;

/** Hold a value and return the handle Go names it by. */
function hold(value) {
  const handle = ++nextRef;
  refs.set(handle, value);
  return handle;
}

function deref(handle) {
  if (!refs.has(handle)) throw new Error(`go-bridge: reference ${handle} is gone`);
  return refs.get(handle);
}

export function release(handle) {
  refs.delete(handle);
}

/** Go value -> JavaScript value. Markers become functions and held objects. */
function revive(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(revive);
  if (typeof value.$fn === 'number') return goFunction(value.$fn, value.$sync === true);
  if (typeof value.$ref === 'number') return deref(value.$ref);
  const out = {};
  for (const key of Object.keys(value)) out[key] = revive(value[key]);
  return out;
}

/**
 * JavaScript value -> Go value.
 *
 * Plain data crosses as itself. Everything else is held and named, which is
 * what lets Go keep talking to a service it was handed rather than receiving a
 * dead copy of its fields.
 */
function encode(value, seen) {
  if (value === undefined || value === null) return null;
  const type = typeof value;
  if (type === 'boolean' || type === 'string') return value;
  if (type === 'number') return Number.isFinite(value) ? value : { $ref: hold(value) };
  if (type === 'bigint') return value.toString();
  if (type === 'function' || type === 'symbol') return { $ref: hold(value) };
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  seen = seen ?? new Set();
  if (seen.has(value)) return { $ref: hold(value) };
  if (Array.isArray(value)) {
    seen.add(value);
    const out = value.map(item => encode(item, seen));
    seen.delete(value);
    return out;
  }
  const proto = Object.getPrototypeOf(value);
  // Anything with a prototype of its own is a live object — a service, a
  // context, a session — and is held rather than flattened. Flattening one is
  // the bug this check exists to prevent: its methods would vanish and its
  // identity with it.
  if (proto !== Object.prototype && proto !== null) return { $ref: hold(value) };
  seen.add(value);
  const out = {};
  for (const key of Object.keys(value)) out[key] = encode(value[key], seen);
  seen.delete(value);
  return out;
}

/** A Go callback, as a JavaScript function. */
function goFunction(id, sync) {
  if (sync) {
    // Runs on the goroutine that owns this world, so it returns a value rather
    // than a promise. That is what cordis requires of the pure callbacks — a
    // tool's render, a guard's verdict — which must answer immediately.
    return (...args) => {
      const answer = globalThis.__dshGoInvokeSync(id, JSON.stringify(args.map(arg => encode(arg))));
      return revive(JSON.parse(answer));
    };
  }
  return (...args) =>
    globalThis.__dshGoInvoke(id, JSON.stringify(args.map(arg => encode(arg))))
      .then(answer => revive(JSON.parse(answer)));
}

/**
 * Walk a dotted path to the thing it names, keeping the receiver so that a
 * method still gets its `this`.
 */
function walk(root, path) {
  if (path === '') return { receiver: undefined, value: root };
  const parts = path.split('.');
  let receiver;
  let value = root;
  for (const part of parts) {
    if (value === null || value === undefined) {
      throw new Error(`go-bridge: cannot read ${path} — ${part} has nothing before it`);
    }
    receiver = value;
    value = value[part];
  }
  return { receiver, value };
}

/**
 * Perform one operation for Go and settle it by token.
 *
 * Every operation answers asynchronously even when it completes at once, so the
 * Go side has one shape to wait on rather than two.
 */
export function perform(kind, handle, path, argsJSON, token) {
  // 'hold' and 'callHold' answer with a handle instead of a copy. The caller
  // wants the live thing — a service to go on calling, a tool definition whose
  // methods must survive — and encoding would flatten it.
  const keep = kind === 'hold' || kind === 'callHold';
  let result;
  try {
    const root = handle === 0 ? globalThis : deref(handle);
    const { receiver, value } = walk(root, path);
    if (kind === 'call' || kind === 'callHold') {
      if (typeof value !== 'function') {
        throw new Error(`go-bridge: ${path || '<root>'} is not a function`);
      }
      result = value.apply(receiver, revive(JSON.parse(argsJSON)));
    } else if (kind === 'hold') {
      settle(token, true, { $ref: hold(value) });
      return;
    } else {
      result = value;
    }
  } catch (error) {
    settle(token, false, described(error));
    return;
  }
  Promise.resolve(result).then(
    value => settle(token, true, keep ? { $ref: hold(value) } : encode(value)),
    error => settle(token, false, described(error)),
  );
}

function described(error) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  return { message: String(error) };
}

function settle(token, ok, payload) {
  let body;
  try {
    body = JSON.stringify(payload);
  } catch (error) {
    ok = false;
    body = JSON.stringify({ message: `go-bridge: result will not serialize: ${error}` });
  }
  globalThis.__dshGoSettle(token, ok, body);
}

/**
 * The apply() every generated plugin module delegates to.
 *
 * The context is held before Go sees it, because a context is the one object a
 * component absolutely must reach by identity. The returned disposer is what
 * makes a Go plugin temporally composable: unloading the fiber runs the Go
 * side's inverses, and cordis has already run the ones installed through
 * ctx.effect.
 */
export function apply(id, ctx, config) {
  const handle = hold(ctx);
  // The Go teardown is registered as a TRACKED EFFECT rather than returned from
  // apply. Two reasons, both learned the hard way: a disposer returned from an
  // async apply is not collected here, so a Go inverse would silently never run;
  // and registering it before apply means it still runs when apply FAILS, which
  // is exactly when a half-installed component most needs taking down.
  //
  // Registering it first also places it last in the LIFO recovery, so a
  // component's context-mediated effects are reverted before its Go teardown.
  ctx.effect(() => () =>
    Promise.resolve(globalThis.__dshGoDispose(id, handle)).then(() => release(handle)));
  return Promise.resolve(globalThis.__dshGoApply(id, handle, JSON.stringify(config ?? null)));
}

globalThis.__dshBridge = { perform, release, apply, defineTool };
