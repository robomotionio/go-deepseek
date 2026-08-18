// node:events — EventEmitter.
//
// Small, and worth having exactly right: half the ecosystem inherits from it,
// and the details people rely on are the awkward ones — 'error' with no listener
// throwing, once() removing before it calls, a listener added during emit not
// being called by that emit.

const kListeners = Symbol('listeners');

export class EventEmitter {
  constructor() {
    this[kListeners] = new Map();
    this._maxListeners = undefined;
  }

  #bucket(type) {
    if (!this[kListeners]) this[kListeners] = new Map();
    let list = this[kListeners].get(type);
    if (!list) {
      list = [];
      this[kListeners].set(type, list);
    }
    return list;
  }

  addListener(type, fn) { return this.on(type, fn); }

  on(type, fn) {
    assertFunction(fn);
    this.#bucket(type).push(fn);
    if (type !== 'newListener') this.emit('newListener', type, fn);
    return this;
  }

  prependListener(type, fn) {
    assertFunction(fn);
    this.#bucket(type).unshift(fn);
    return this;
  }

  once(type, fn) {
    assertFunction(fn);
    const wrapper = (...args) => {
      // Removed BEFORE the call, so a listener that re-emits its own event does
      // not run twice.
      this.off(type, wrapper);
      fn.apply(this, args);
    };
    wrapper.listener = fn;
    return this.on(type, wrapper);
  }

  prependOnceListener(type, fn) {
    const wrapper = (...args) => { this.off(type, wrapper); fn.apply(this, args); };
    wrapper.listener = fn;
    return this.prependListener(type, wrapper);
  }

  off(type, fn) { return this.removeListener(type, fn); }

  removeListener(type, fn) {
    const list = this[kListeners]?.get(type);
    if (!list) return this;
    const i = list.findIndex((l) => l === fn || l.listener === fn);
    if (i >= 0) {
      list.splice(i, 1);
      this.emit('removeListener', type, fn);
    }
    return this;
  }

  removeAllListeners(type) {
    if (!this[kListeners]) return this;
    if (type === undefined) this[kListeners].clear();
    else this[kListeners].delete(type);
    return this;
  }

  emit(type, ...args) {
    const list = this[kListeners]?.get(type);
    if (!list || list.length === 0) {
      if (type === 'error') {
        // An unhandled 'error' is thrown rather than dropped. Node does this
        // because an error nobody listened for is a bug, and swallowing it hides
        // the bug behind whatever fails next.
        const err = args[0];
        throw err instanceof Error ? err : Object.assign(new Error('Unhandled error.'), { context: err });
      }
      return false;
    }
    // A copy: a listener may add or remove listeners, and the set that runs is
    // the set that existed when emit was called.
    for (const fn of [...list]) fn.apply(this, args);
    return true;
  }

  listenerCount(type) { return this[kListeners]?.get(type)?.length ?? 0; }
  listeners(type) { return [...(this[kListeners]?.get(type) ?? [])].map((l) => l.listener ?? l); }
  rawListeners(type) { return [...(this[kListeners]?.get(type) ?? [])]; }
  eventNames() { return [...(this[kListeners]?.keys() ?? [])]; }
  setMaxListeners(n) { this._maxListeners = n; return this; }
  getMaxListeners() { return this._maxListeners ?? EventEmitter.defaultMaxListeners; }
}

EventEmitter.defaultMaxListeners = 10;
EventEmitter.EventEmitter = EventEmitter;

function assertFunction(fn) {
  if (typeof fn !== 'function') {
    const err = new TypeError('The "listener" argument must be of type function');
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
  }
}

// once(emitter, type) — the promise form, which resolves on the event and
// rejects on 'error', so an await does not hang on a failure.
export function once(emitter, type, options = {}) {
  return new Promise((resolve, reject) => {
    const signal = options.signal;
    if (signal?.aborted) return reject(signal.reason);
    const onEvent = (...args) => { cleanup(); resolve(args); };
    const onError = (err) => { cleanup(); reject(err); };
    const onAbort = () => { cleanup(); reject(signal.reason); };
    function cleanup() {
      emitter.off(type, onEvent);
      if (type !== 'error') emitter.off('error', onError);
      signal?.removeEventListener('abort', onAbort);
    }
    emitter.once(type, onEvent);
    if (type !== 'error') emitter.once('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function on(emitter, type) {
  const queue = [];
  const waiting = [];
  emitter.on(type, (...args) => {
    if (waiting.length) waiting.shift()({ value: args, done: false });
    else queue.push(args);
  });
  return {
    [Symbol.asyncIterator]() { return this; },
    next() {
      if (queue.length) return Promise.resolve({ value: queue.shift(), done: false });
      return new Promise((resolve) => waiting.push(resolve));
    },
    return() { return Promise.resolve({ done: true, value: undefined }); },
  };
}

export const captureRejectionSymbol = Symbol.for('nodejs.rejection');
export const errorMonitor = Symbol('events.errorMonitor');
export const defaultMaxListeners = 10;
export function setMaxListeners() {}

export default EventEmitter;
