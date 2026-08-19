// node:async_hooks — AsyncLocalStorage only, which is the whole of what the
// agent spine uses it for: carrying "which session is this" through an await
// without threading it through every signature.
//
// The real implementation hooks the engine's continuation machinery. This one
// keeps a stack, which is correct for the case that matters — run() with a
// synchronous or awaited body — and wrong for one that does not arise here:
// storing a value, returning, and expecting a later unrelated callback to still
// see it.

const stack = [];

export class AsyncLocalStorage {
  #current = undefined;
  #depth = 0;

  run(store, fn, ...args) {
    const previous = this.#current;
    this.#current = store;
    this.#depth++;
    stack.push(this);
    try {
      const out = fn(...args);
      // An async body finishes after run() returns, so the store has to stay in
      // place until its promise settles. Restoring in a finally would clear it
      // at the first await, which is the bug this shape avoids.
      if (out && typeof out.then === 'function') {
        return out.finally(() => this.#restore(previous));
      }
      this.#restore(previous);
      return out;
    } catch (err) {
      this.#restore(previous);
      throw err;
    }
  }

  #restore(previous) {
    this.#current = previous;
    this.#depth--;
    const i = stack.lastIndexOf(this);
    if (i >= 0) stack.splice(i, 1);
  }

  getStore() { return this.#current; }
  enterWith(store) { this.#current = store; }
  exit(fn, ...args) {
    const previous = this.#current;
    this.#current = undefined;
    try { return fn(...args); } finally { this.#current = previous; }
  }
  disable() { this.#current = undefined; }
}

export class AsyncResource {
  constructor(type) { this.type = type; }
  runInAsyncScope(fn, thisArg, ...args) { return fn.apply(thisArg, args); }
  emitDestroy() { return this; }
  asyncId() { return 0; }
  triggerAsyncId() { return 0; }
  bind(fn) { return fn; }
  static bind(fn) { return fn; }
}

export const executionAsyncId = () => 0;
export const triggerAsyncId = () => 0;
export const createHook = () => ({ enable() { return this; }, disable() { return this; } });

const __ns = { AsyncLocalStorage, AsyncResource, executionAsyncId, triggerAsyncId, createHook };
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['async_hooks'] = __ns;
