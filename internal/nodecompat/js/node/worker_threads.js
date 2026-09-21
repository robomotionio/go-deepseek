// node:worker_threads — a Worker that runs on this loop.
//
// There is one engine and one event loop here, so there is no second thread to
// give a worker. What there can be is a worker's CONTRACT: a script evaluated
// with its own `workerData` and its own `parentPort`, messages that cross by
// structured clone and arrive asynchronously, and `exit` once the worker is
// finished. That is all a caller can observe of a real one apart from timing
// and memory — which is exactly what this gives up: a worker's allocations
// count against the one heap, and a worker that computes for a long time
// holds the loop while it does.
//
// It exists for one caller, and the limits are drawn around it.
// dsh-session-persistence-jsonl (harness 0.1.5+) verifies a session log it has
// just migrated to the current format inside a Worker, for memory isolation.
// Every session a robot wrote before that release is format 0, so resuming one
// migrates it, and without a Worker the resume fails. The verification is an
// ordinary async function; running it here is running it where it would run
// anyway, minus the isolation.
//
// Limits, all refused loudly rather than approximated:
//   - the script must be CommonJS source the host can read (the bundle serves
//     a package's worker file beside its module — see tools/bundle/build.mjs);
//   - `eval: true`, transfer lists and SharedArrayBuffer semantics are not
//     offered;
//   - `terminate()` stops delivery and reports exit, but cannot interrupt a
//     worker that is in the middle of a synchronous computation.

import { EventEmitter } from './events.js';
// A worker's `require` is synchronous, so every builtin it may ask for must
// already have been evaluated (see the require shim in prelude.js). Importing
// the set here is what makes that true for any worker, not just the ones whose
// requirements happen to overlap what the host imported first.
import './assert.js';
import './async_hooks.js';
import './buffer.js';
import './child_process.js';
import './crypto.js';
import './fs.js';
import './fs_promises.js';
import './module.js';
import './os.js';
import './path.js';
import './perf_hooks.js';
import './process.js';
import './querystring.js';
import './readline.js';
import './stream.js';
import './stream_promises.js';
import './stream_web.js';
import './string_decoder.js';
import './timers.js';
import './timers_promises.js';
import './tty.js';
import './url.js';
import './util.js';
import './util_types.js';
import './zlib.js';

const host = globalThis.__nodeHost;

export const isMainThread = true;
export const parentPort = null;
export const workerData = null;
export const threadId = 0;
export const resourceLimits = {};
export const SHARE_ENV = Symbol.for('nodejs.worker_threads.SHARE_ENV');
export const markAsUntransferable = () => {};
export const isMarkedAsUntransferable = () => false;
export const moveMessagePortToContext = (port) => port;
export const receiveMessageOnPort = () => undefined;
const environment = new Map();
export const getEnvironmentData = (key) => environment.get(key);
export const setEnvironmentData = (key, value) => {
  if (value === undefined) environment.delete(key);
  else environment.set(key, value);
};

const later = (fn) => setTimeout(fn, 0);

function notAvailable(what) {
  return Object.assign(new Error(`worker_threads: ${what} is not available in this runtime`), {
    code: 'ERR_NOT_AVAILABLE',
  });
}

/** One end of a worker's channel. Messages are cloned and arrive on a later tick. */
export class MessagePort extends EventEmitter {
  constructor(deliver) {
    super();
    this._deliver = deliver;
    this._closed = false;
  }

  postMessage(value, transfer) {
    if (transfer !== undefined && (!Array.isArray(transfer) || transfer.length > 0)) {
      throw notAvailable('a transfer list');
    }
    if (this._closed) return;
    const copy = structuredClone(value);
    later(() => this._deliver(copy));
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    later(() => this.emit('close'));
  }

  start() {}
  ref() { return this; }
  unref() { return this; }
}

let nextThreadId = 1;

export class Worker extends EventEmitter {
  constructor(filename, options = {}) {
    super();
    if (options.eval) throw notAvailable('eval: true');
    const url = filename instanceof URL ? filename.href : String(filename);
    let source;
    try {
      source = new TextDecoder().decode(host.fs.readFile(url));
    } catch (error) {
      throw Object.assign(new Error(`worker_threads: cannot read the worker script ${url}: ${error?.message ?? error}`), {
        code: 'ERR_WORKER_PATH',
        cause: error,
      });
    }

    this.threadId = nextThreadId++;
    this.resourceLimits = {};
    this._exited = false;
    this._terminated = false;

    // The worker's parentPort: what it posts arrives here as 'message'.
    const inside = new MessagePort((value) => {
      if (!this._terminated) this.emit('message', value);
    });
    // Closing its port is how a worker says it is done; with nothing else
    // keeping a real worker's loop alive, that is its exit.
    inside.once('close', () => this._exit(0));
    this._inside = inside;

    const threads = {
      ...namespace,
      isMainThread: false,
      parentPort: inside,
      workerData: structuredClone(options.workerData),
      threadId: this.threadId,
    };
    // A worker script served by the host has a URL for a filename, not a path
    // — dsh:/modules/<package>/worker.cjs — and scripts turn their own name
    // into a URL with pathToFileURL(__filename), which would make it a file
    // under the working directory. The worker's url module leaves a URL
    // standing, so `createRequire(pathToFileURL(__filename))` keeps pointing
    // where the script actually came from.
    const urls = globalThis.require('node:url');
    const workerURL = {
      ...urls,
      pathToFileURL: (value, options) =>
        (/^[a-z][a-z0-9+.-]*:\//i.test(String(value)) && !/^[a-z]:[\\/]/i.test(String(value))
          ? new URL(String(value))
          : urls.pathToFileURL(value, options)),
    };
    const require = (name) => {
      const key = String(name).replace(/^node:/, '');
      if (key === 'worker_threads') return threads;
      if (key === 'url') return workerURL;
      return globalThis.require(name);
    };
    const dirname = url.slice(0, url.lastIndexOf('/'));

    later(() => {
      if (this._terminated) return;
      this.emit('online');
      try {
        const module = { exports: {} };
        const evaluate = new Function('exports', 'require', 'module', '__filename', '__dirname',
          `${source}\n//# sourceURL=${url}`);
        evaluate(module.exports, require, module, url, dirname);
      } catch (error) {
        this.emit('error', error);
        this._exit(1);
      }
    });
  }

  postMessage(value, transfer) {
    if (transfer !== undefined && (!Array.isArray(transfer) || transfer.length > 0)) {
      throw notAvailable('a transfer list');
    }
    if (this._terminated) return;
    const copy = structuredClone(value);
    later(() => {
      if (!this._terminated) this._inside.emit('message', copy);
    });
  }

  terminate() {
    if (!this._exited) {
      this._terminated = true;
      this._exit(1);
    }
    return new Promise((resolve) => later(() => resolve(this._exitCode)));
  }

  _exit(code) {
    if (this._exited) return;
    this._exited = true;
    this._exitCode = code;
    later(() => this.emit('exit', code));
  }

  ref() { return this; }
  unref() { return this; }
}

export class MessageChannel {
  constructor() {
    this.port1 = new MessagePort((value) => this.port2.emit('message', value));
    this.port2 = new MessagePort((value) => this.port1.emit('message', value));
  }
}

export class BroadcastChannel {
  constructor() { throw notAvailable('BroadcastChannel'); }
}

const namespace = {
  isMainThread, parentPort, workerData, threadId, resourceLimits, SHARE_ENV,
  markAsUntransferable, isMarkedAsUntransferable, moveMessagePortToContext,
  receiveMessageOnPort, getEnvironmentData, setEnvironmentData,
  MessagePort, MessageChannel, BroadcastChannel, Worker,
};
export default namespace;

// Registered for CommonJS interop, like every other shim; see prelude.js.
(globalThis.__nodeRegistry ??= {})['worker_threads'] = namespace;
