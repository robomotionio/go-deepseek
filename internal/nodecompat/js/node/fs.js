// node:fs — the sync and callback faces. node:fs/promises is the third, built
// on the same bindings; both import their shared parts from ./_fsutil.js.

import { Readable, Writable } from 'node:stream';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import * as promisesAPI from 'node:fs/promises';
import {
  host, constants, asFsError, guard, makeStats, Dirent,
  decode, encodeData, pathOf, fdOf, modeOf, flagOf, toMs,
} from './_fsutil.js';

export { constants, Dirent };

export const readFileSync = guard((path, options) => decode(host.fs.readFile(pathOf(path)), options));
export const writeFileSync = guard((path, data, options) => host.fs.writeFile(pathOf(path), encodeData(data, options), modeOf(options), flagOf(options)));
export const appendFileSync = guard((path, data, options) => host.fs.appendFile(pathOf(path), encodeData(data, options), modeOf(options), flagOf(options)));
export const existsSync = (path) => { try { return host.fs.exists(pathOf(path)); } catch { return false; } };
export const statSync = guard((path, options) => statOrUndefined(pathOf(path), true, options));
export const lstatSync = guard((path, options) => statOrUndefined(pathOf(path), false, options));
export const mkdirSync = guard((path, options = {}) => host.fs.mkdir(pathOf(path), Boolean(options.recursive), modeOf(options)));
export const rmSync = guard((path, options = {}) => host.fs.rm(pathOf(path), Boolean(options.recursive), Boolean(options.force)));
export const rmdirSync = guard((path, options = {}) => host.fs.rm(pathOf(path), Boolean(options.recursive), false));
export const unlinkSync = guard((path) => host.fs.rm(pathOf(path), false, false));
export const renameSync = guard((from, to) => host.fs.rename(pathOf(from), pathOf(to)));
export const copyFileSync = guard((from, to) => host.fs.copyFile(pathOf(from), pathOf(to)));
export const cpSync = guard((from, to, options = {}) => host.fs.cp(pathOf(from), pathOf(to), Boolean(options.recursive)));
export const realpathSync = guard((path) => host.fs.realpath(pathOf(path)));
export const readlinkSync = guard((path) => host.fs.readlink(pathOf(path)));
export const symlinkSync = guard((target, path) => host.fs.symlink(pathOf(target), pathOf(path)));
export const linkSync = guard((existing, path) => host.fs.link(pathOf(existing), pathOf(path)));
export const chmodSync = guard((path, mode) => host.fs.chmod(pathOf(path), Number(mode)));
export const utimesSync = guard((path, atime, mtime) => host.fs.utimes(pathOf(path), toMs(atime), toMs(mtime)));
export const accessSync = guard((path, mode = 0) => host.fs.access(pathOf(path), (mode & constants.W_OK) !== 0));
export const truncateSync = guard((path, len = 0) => host.fs.truncate(pathOf(path), len));
export const mkdtempSync = guard((prefix) => host.fs.mkdtemp(pathOf(prefix)));
export const openSync = guard((path, flags = 'r', mode = 0) => host.fs.open(pathOf(path), String(flags), Number(mode)));
export const closeSync = guard((fd) => host.fs.close(fdOf(fd)));
export const fsyncSync = guard((fd) => host.fs.fsync(fdOf(fd)));
export const fstatSync = guard((fd, options) => makeStats(host.fs.fstat(fdOf(fd)), options));

export const readdirSync = guard((path, options = {}) => {
  const withTypes = Boolean(options && options.withFileTypes);
  const entries = host.fs.readdir(pathOf(path), withTypes);
  return withTypes ? entries.map((e) => new Dirent(e, pathOf(path))) : entries;
});

// readSync fills the caller's buffer, which is the signature everything expects,
// while the binding returns bytes — the copy happens on this side so that Go
// never holds a live view into JavaScript memory.
export const readSync = guard((fd, buffer, offset = 0, length = buffer.length, position = -1) => {
  const bytes = host.fs.read(fdOf(fd), length, position === null ? -1 : position);
  new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength).set(bytes, offset);
  return bytes.length;
});

export const writeSync = guard((fd, buffer, offset = 0, length, position = -1) => {
  let bytes;
  if (typeof buffer === 'string') bytes = Buffer.from(buffer, 'utf8');
  else {
    const view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    bytes = view.subarray(offset, length === undefined ? undefined : offset + length);
  }
  return host.fs.write(fdOf(fd), bytes, position === null ? -1 : position);
});

function statOrUndefined(path, follow, options) {
  try {
    return makeStats(host.fs.stat(path, follow), options);
  } catch (err) {
    // throwIfNoEntry:false is how callers ask "tell me about this if it is
    // there", and it is the difference between a branch and a try/catch.
    if (options && options.throwIfNoEntry === false) return undefined;
    throw err;
  }
}

// --- the callback face -------------------------------------------------------
//
// Generated from the sync one rather than written out: each is "do the sync
// thing on a later turn, and report either way", and writing twenty of those by
// hand is twenty chances to get an argument order wrong.

function callbackify(syncFn, arity) {
  return (...args) => {
    const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    if (!cb) throw new TypeError('callback must be a function');
    queueMicrotask(() => {
      try {
        cb(null, syncFn(...args.slice(0, arity)));
      } catch (err) {
        cb(asFsError(err));
      }
    });
  };
}

export const readFile = callbackify(readFileSync, 2);
export const writeFile = callbackify(writeFileSync, 3);
export const appendFile = callbackify(appendFileSync, 3);
export const stat = callbackify(statSync, 2);
export const lstat = callbackify(lstatSync, 2);
export const mkdir = callbackify(mkdirSync, 2);
export const rm = callbackify(rmSync, 2);
export const rmdir = callbackify(rmdirSync, 2);
export const unlink = callbackify(unlinkSync, 1);
export const rename = callbackify(renameSync, 2);
export const copyFile = callbackify(copyFileSync, 2);
export const readdir = callbackify(readdirSync, 2);
export const realpath = callbackify(realpathSync, 1);
export const readlink = callbackify(readlinkSync, 1);
export const symlink = callbackify(symlinkSync, 2);
export const link = callbackify(linkSync, 2);
export const chmod = callbackify(chmodSync, 2);
export const utimes = callbackify(utimesSync, 3);
export const access = callbackify(accessSync, 2);
export const truncate = callbackify(truncateSync, 2);
export const mkdtemp = callbackify(mkdtempSync, 1);
export const open = callbackify(openSync, 3);
export const close = callbackify(closeSync, 1);

// --- streams -----------------------------------------------------------------

const CHUNK = 64 * 1024;

// createReadStream reads in chunks rather than whole. It is used for hashing and
// for scanning session logs line by line, where the file may be larger than
// anything that should be in memory at once.
export function createReadStream(path, options = {}) {
  const encoding = typeof options === 'string' ? options : options.encoding;
  let fd = null;
  let position = typeof options.start === 'number' ? options.start : 0;
  const end = typeof options.end === 'number' ? options.end : Infinity;
  return new Readable({
    read(size) {
      try {
        if (fd === null) fd = openSync(pathOf(path), 'r');
        const want = Math.min(size || CHUNK, end - position + 1);
        if (want <= 0) { this.push(null); return; }
        const bytes = host.fs.read(fd, want, position);
        if (!bytes || bytes.length === 0) {
          closeSync(fd);
          fd = null;
          this.push(null);
          return;
        }
        position += bytes.length;
        this.push(encoding ? Buffer.from(bytes).toString(encoding) : Buffer.from(bytes));
      } catch (err) {
        if (fd !== null) { try { closeSync(fd); } catch { /* already gone */ } fd = null; }
        this.destroy(asFsError(err));
      }
    },
    destroy(err, cb) {
      if (fd !== null) { try { closeSync(fd); } catch { /* already gone */ } fd = null; }
      cb(err);
    },
  });
}

export function createWriteStream(path, options = {}) {
  const flags = options.flags || 'w';
  let fd = null;
  return new Writable({
    write(chunk, encoding, cb) {
      try {
        if (fd === null) fd = openSync(pathOf(path), flags, modeOf(options));
        host.fs.write(fd, encodeData(chunk, encoding), -1);
        cb();
      } catch (err) {
        cb(asFsError(err));
      }
    },
    final(cb) {
      try {
        if (fd !== null) { closeSync(fd); fd = null; }
        cb();
      } catch (err) { cb(asFsError(err)); }
    },
  });
}

// The classes callers import by name. They are constructors so that
// `instanceof` and `import { Stats } from 'node:fs'` both work; the instances
// this module returns are built by makeStats, which is a plain object with the
// same shape (see _fsutil.js for why the two cannot be one thing).
export class Stats {
  isFile() { return Boolean(this._isFile); }
  isDirectory() { return Boolean(this._isDirectory); }
  isSymbolicLink() { return Boolean(this._isSymlink); }
  isBlockDevice() { return false; }
  isCharacterDevice() { return false; }
  isFIFO() { return false; }
  isSocket() { return false; }
}

export class Dir {
  constructor(path, entries) { this.path = path; this._entries = entries; this._at = 0; }
  async read() { return this._at < this._entries.length ? this._entries[this._at++] : null; }
  readSync() { return this._at < this._entries.length ? this._entries[this._at++] : null; }
  async close() {}
  closeSync() {}
  async *[Symbol.asyncIterator]() { for (const entry of this._entries) yield entry; }
}

export const opendirSync = (path, options) => new Dir(pathOf(path), readdirSync(path, { ...options, withFileTypes: true }));
export const opendir = callbackify(opendirSync, 2);

export class ReadStream {}
export class WriteStream {}
export const FileReadStream = ReadStream;
export const FileWriteStream = WriteStream;

export const lutimesSync = utimesSync;
export const lutimes = utimes;
export const lchmodSync = chmodSync;
export const lchmod = chmod;
export const fchmodSync = (fd, mode) => { throw Object.assign(new Error('fs.fchmodSync is not supported'), { code: 'ERR_NOT_IMPLEMENTED' }); };
export const statfsSync = () => ({ type: 0, bsize: 4096, blocks: 0, bfree: 0, bavail: 0, files: 0, ffree: 0 });
export const globSync = () => { throw Object.assign(new Error('fs.globSync is not supported'), { code: 'ERR_NOT_IMPLEMENTED' }); };

// --- watching ----------------------------------------------------------------
//
// Two different mechanisms, because Node has two and they are not
// interchangeable. fs.watch is event-driven: the host tells us when something
// happened. fs.watchFile is a stat poll, and its listener is handed the two
// Stats rather than an event name — chokidar's polling mode is built on it, and
// so is anything that has to see a file on a network mount.
//
// The event-driven half is a LONG POLL over the host binding: ask for the next
// batch, get a promise, emit what arrives, ask again. Nothing is pushed at us,
// which is what lets a closed watcher end cleanly — the pending read resolves
// with null and the loop below simply stops.

// How often the shared timer collects. Fifty milliseconds is well inside the
// stability thresholds every watcher consumer already applies to debounce an
// editor's save, and it is the only latency the poll adds.
const WATCH_POLL_INTERVAL_MS = 50;

// Every live watcher, by the handle the host names it. One timer serves all of
// them: chokidar opens a watch per directory, and a timer each would be a
// hundred timers on a tree of any size.
const liveWatchers = new Map();
let pollTimer = null;

// How many consumers are AWAITING an event right now. The emitter face never
// counts: a watcher with a listener attached is not, by itself, a reason for a
// run to continue, and treating it as one is what parked the loop. The promise
// face does count, because `for await (const event of watch(dir))` is a
// consumer that has said it will wait — and Node keeps the loop alive for it.
let pollHolds = 0;

function startPolling() {
  if (pollTimer !== null) return;
  pollTimer = setInterval(collect, WATCH_POLL_INTERVAL_MS);
  // The unref is the whole design, not a nicety. A watcher must never be the
  // reason a run does not finish: unref'd, this timer fires while the loop is
  // alive for other reasons and holds it open for none.
  if (pollHolds === 0 && pollTimer && typeof pollTimer.unref === 'function') pollTimer.unref();
}

// Hold the loop open while an awaiting consumer exists, and release it when
// that consumer is done. Exported for node:fs/promises, which is the only
// caller; it is deliberately absent from the module's default namespace,
// because Node's fs has no such function and code written against Node must
// not find one here.
export function __holdWatchPoll() {
  pollHolds += 1;
  if (pollHolds === 1 && pollTimer && typeof pollTimer.ref === 'function') pollTimer.ref();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    pollHolds -= 1;
    if (pollHolds === 0 && pollTimer && typeof pollTimer.unref === 'function') pollTimer.unref();
  };
}

function stopPolling() {
  if (pollTimer === null || liveWatchers.size > 0) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

function collect() {
  let reports;
  try {
    reports = host.watch.poll();
  } catch (error) {
    // The host itself failed, which is every watcher's problem.
    for (const watcher of [...liveWatchers.values()]) watcher._fail(asFsError(error));
    return;
  }
  if (!reports || reports.length === 0) return;
  for (const report of reports) {
    const watcher = liveWatchers.get(report.id);
    if (!watcher) continue;
    if (report.events) watcher._deliver(report.events);
    if (report.error) { watcher._fail(asFsError(new Error(report.error))); continue; }
    if (report.ended) watcher._finish();
  }
}

export class FSWatcher extends EventEmitter {
  constructor(filename, options = {}) {
    super();
    this._ended = false;
    this._encoding = options.encoding === undefined ? 'utf8' : options.encoding;
    this._id = guard((path, recursive) => host.watch.start(path, recursive))(
      pathOf(filename), Boolean(options.recursive));
    liveWatchers.set(this._id, this);
    startPolling();
    if (options.signal) {
      if (options.signal.aborted) this.close();
      else options.signal.addEventListener('abort', () => this.close(), { once: true });
    }
  }

  _deliver(events) {
    for (const event of events) {
      if (this._ended) return;
      this.emit('change', event.eventType, this._name(event.filename));
    }
  }

  _name(filename) {
    return this._encoding === 'buffer' ? Buffer.from(filename, 'utf8') : filename;
  }

  _fail(error) {
    if (this._ended) return;
    this._ended = true;
    this._forget();
    this.emit('error', error);
  }

  _finish() {
    if (this._ended) return;
    this._ended = true;
    this._forget();
    this.emit('close');
  }

  _forget() {
    liveWatchers.delete(this._id);
    stopPolling();
  }

  close() {
    if (this._ended) return;
    this._ended = true;
    this._forget();
    try { host.watch.close(this._id); } catch { /* already gone */ }
    this.emit('close');
  }

  // A watcher here never holds the loop open on its own — see startPolling —
  // so ref/unref are the no-ops that keep callers from having to branch.
  ref() { return this; }
  unref() { return this; }
}

export function watch(filename, options, listener) {
  if (typeof options === 'function') { listener = options; options = {}; }
  if (typeof options === 'string') options = { encoding: options };
  const watcher = new FSWatcher(filename, options || {});
  if (typeof listener === 'function') watcher.on('change', listener);
  return watcher;
}

// --- the stat poll -----------------------------------------------------------

const DEFAULT_WATCH_FILE_INTERVAL_MS = 5007;

// One poller per path, however many listeners it has. Node's own StatWatcher
// works this way and callers depend on it: watchFile twice and unwatchFile once
// leaves the file watched.
const statWatchers = new Map();

// The Stats a path that is not there produces. Node hands the listener a
// zeroed Stats rather than undefined, so "it appeared" and "it vanished" are
// both ordinary comparisons instead of null checks.
const ABSENT_STAT = {
  size: 0, mode: 0, mtimeMs: 0, atimeMs: 0, ctimeMs: 0, birthtimeMs: 0,
  isFile: false, isDirectory: false, isSymlink: false,
  uid: 0, gid: 0, ino: 0, dev: 0, nlink: 0,
};

function rawStat(path) {
  try { return host.fs.stat(path, true); } catch { return ABSENT_STAT; }
}

// What counts as a change. Node compares the whole Stats; these five are the
// fields that can actually differ for the same path, and comparing only them
// keeps a poll from reporting a change because atime moved when we read it.
function statChanged(a, b) {
  return a.mtimeMs !== b.mtimeMs || a.size !== b.size || a.ino !== b.ino
    || a.mode !== b.mode || a.dev !== b.dev;
}

export function watchFile(filename, options, listener) {
  if (typeof options === 'function') { listener = options; options = {}; }
  options = options || {};
  const path = pathOf(filename);
  const interval = Number(options.interval) > 0
    ? Number(options.interval) : DEFAULT_WATCH_FILE_INTERVAL_MS;
  const bigint = Boolean(options.bigint);

  let state = statWatchers.get(path);
  if (!state) {
    state = { listeners: new Set(), previous: rawStat(path), timer: null, bigint };
    state.timer = setInterval(() => {
      const current = rawStat(path);
      if (!statChanged(current, state.previous)) return;
      const before = state.previous;
      state.previous = current;
      const curr = makeStats(current, { bigint: state.bigint });
      const prev = makeStats(before, { bigint: state.bigint });
      for (const fn of [...state.listeners]) fn(curr, prev);
    }, interval);
    // A stat poll must not be the reason a program cannot exit.
    if (typeof state.timer === 'object' && state.timer && typeof state.timer.unref === 'function') {
      state.timer.unref();
    }
    statWatchers.set(path, state);
  }
  if (typeof listener === 'function') state.listeners.add(listener);
  return { unref() { return this; }, ref() { return this; } };
}

export function unwatchFile(filename, listener) {
  const path = pathOf(filename);
  const state = statWatchers.get(path);
  if (!state) return;
  if (typeof listener === 'function') state.listeners.delete(listener);
  else state.listeners.clear();
  if (state.listeners.size === 0) {
    clearInterval(state.timer);
    statWatchers.delete(path);
  }
}

export const promises = promisesAPI;

const __ns = {
  constants, Dirent, promises, Stats, Dir, ReadStream, WriteStream,
  opendir, opendirSync, lutimes, lutimesSync, lchmod, lchmodSync,
  statfsSync, globSync,
  readFileSync, writeFileSync, appendFileSync, existsSync, statSync, lstatSync,
  mkdirSync, rmSync, rmdirSync, unlinkSync, renameSync, copyFileSync, cpSync,
  realpathSync, readlinkSync, symlinkSync, linkSync, chmodSync, utimesSync,
  accessSync, truncateSync, mkdtempSync, openSync, closeSync, readSync,
  writeSync, readdirSync, fsyncSync, fstatSync,
  readFile, writeFile, appendFile, stat, lstat, mkdir, rm, rmdir, unlink,
  rename, copyFile, readdir, realpath, readlink, symlink, link, chmod, utimes,
  access, truncate, mkdtemp, open, close,
  createReadStream, createWriteStream, watch, watchFile, unwatchFile, FSWatcher,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['fs'] = __ns;
