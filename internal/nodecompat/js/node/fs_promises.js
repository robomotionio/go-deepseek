// node:fs/promises.
//
// The bindings underneath are synchronous (see fs.go), so each of these settles
// on the microtask queue rather than doing real work off-thread. That is a
// difference from Node worth stating: a large read here blocks the loop for its
// duration. For an agent reading source files and session logs it is not a
// difference anyone can measure, and it is what makes the sync face — which the
// same code uses constantly — possible at all.

import { watch as fsWatch, __holdWatchPoll } from 'node:fs';
import {
  host, constants, asFsError, makeStats, Dirent,
  decode, encodeData, pathOf, fdOf, modeOf, toMs,
} from './_fsutil.js';

export { constants };

// settle runs the work now and hands back a promise, so a throw becomes a
// rejection rather than an exception the caller was not expecting from an
// async function.
function settle(fn) {
  return async (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      throw asFsError(err);
    }
  };
}

export const readFile = settle((path, options) => {
  if (path && typeof path === 'object' && typeof path.read === 'function') {
    return path.readFile(options);   // a FileHandle, not a path
  }
  return decode(host.fs.readFile(pathOf(path)), options);
});
export const writeFile = settle((path, data, options) => host.fs.writeFile(pathOf(path), encodeData(data, options), modeOf(options)));
export const appendFile = settle((path, data, options) => host.fs.appendFile(pathOf(path), encodeData(data, options), modeOf(options)));
export const stat = settle((path, options) => makeStats(host.fs.stat(pathOf(path), true), options));
export const lstat = settle((path, options) => makeStats(host.fs.stat(pathOf(path), false), options));
export const mkdir = settle((path, options = {}) => host.fs.mkdir(pathOf(path), Boolean(options.recursive), modeOf(options)));
export const rm = settle((path, options = {}) => host.fs.rm(pathOf(path), Boolean(options.recursive), Boolean(options.force)));
export const rmdir = settle((path, options = {}) => host.fs.rm(pathOf(path), Boolean(options.recursive), false));
export const unlink = settle((path) => host.fs.rm(pathOf(path), false, false));
export const rename = settle((from, to) => host.fs.rename(pathOf(from), pathOf(to)));
export const copyFile = settle((from, to) => host.fs.copyFile(pathOf(from), pathOf(to)));
export const cp = settle((from, to, options = {}) => host.fs.cp(pathOf(from), pathOf(to), options.recursive !== false));
export const realpath = settle((path) => host.fs.realpath(pathOf(path)));
export const readlink = settle((path) => host.fs.readlink(pathOf(path)));
export const symlink = settle((target, path) => host.fs.symlink(pathOf(target), pathOf(path)));
export const link = settle((existing, path) => host.fs.link(pathOf(existing), pathOf(path)));
export const chmod = settle((path, mode) => host.fs.chmod(pathOf(path), Number(mode)));
export const utimes = settle((path, atime, mtime) => host.fs.utimes(pathOf(path), toMs(atime), toMs(mtime)));
export const access = settle((path, mode = 0) => host.fs.access(pathOf(path), (mode & constants.W_OK) !== 0));
export const truncate = settle((path, len = 0) => host.fs.truncate(pathOf(path), len));
export const mkdtemp = settle((prefix) => host.fs.mkdtemp(pathOf(prefix)));

export const readdir = settle((path, options = {}) => {
  const withTypes = Boolean(options && options.withFileTypes);
  const entries = host.fs.readdir(pathOf(path), withTypes);
  return withTypes ? entries.map((e) => new Dirent(e, pathOf(path))) : entries;
});

// FileHandle is what open() resolves to. It exists so that a descriptor can be
// closed by the object that owns it rather than by a number someone has to
// remember — which is the whole reason the promise API replaced the fd one.
class FileHandle {
  #fd;
  constructor(fd) { this.#fd = fd; }
  get fd() { return this.#fd; }
  async read(buffer, offset = 0, length, position = -1) {
    if (buffer && typeof buffer === 'object' && !ArrayBuffer.isView(buffer)) {
      // The options-object form: read({ buffer, offset, length, position }).
      ({ buffer, offset = 0, length, position = -1 } = buffer);
    }
    const want = length === undefined ? buffer.length - offset : length;
    const bytes = host.fs.read(this.#fd, want, position === null ? -1 : position);
    new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength).set(bytes, offset);
    return { bytesRead: bytes.length, buffer };
  }
  async write(data, offset = 0, length, position = -1) {
    const bytes = typeof data === 'string'
      ? Buffer.from(data, 'utf8')
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
        .subarray(offset, length === undefined ? undefined : offset + length);
    const written = host.fs.write(this.#fd, bytes, position === null ? -1 : position);
    return { bytesWritten: written, buffer: data };
  }
  async readFile(options) { return decode(readAllFrom(this.#fd), options); }
  async writeFile(data, options) { host.fs.write(this.#fd, encodeData(data, options), -1); }
  async appendFile(data, options) { host.fs.write(this.#fd, encodeData(data, options), -1); }
  async stat(options) { return makeStats(host.fs.fstat(this.#fd), options); }
  async truncate(len = 0) { host.fs.ftruncate(this.#fd, len); }
  // chmod through the handle rather than the path is what an atomic write does:
  // the staging file is given its mode while it is still open and still
  // unpublished, so nothing ever observes it at the wrong permissions.
  async chmod(mode) { host.fs.fchmod(this.#fd, Number(mode)); }
  async chown() { /* ownership is not something this runtime changes */ }
  async utimes() { /* the handle's times are not settable here */ }
  async sync() { host.fs.fsync(this.#fd); }
  async datasync() { host.fs.fsync(this.#fd); }
  async close() { host.fs.close(this.#fd); }
  createReadStream() {
    throw Object.assign(new Error('FileHandle.createReadStream is not supported'), { code: 'ERR_NOT_IMPLEMENTED' });
  }
  createWriteStream() {
    throw Object.assign(new Error('FileHandle.createWriteStream is not supported'), { code: 'ERR_NOT_IMPLEMENTED' });
  }
  // A FileHandle is disposable, so `await using handle = await open(...)` closes
  // it on the way out of the block even if the block throws.
  async [Symbol.asyncDispose]() { await this.close(); }
}

function readAllFrom(fd) {
  const parts = [];
  for (;;) {
    const chunk = host.fs.read(fd, 64 * 1024, -1);
    if (!chunk || chunk.length === 0) break;
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

export const open = settle((path, flags = 'r', mode = 0) =>
  new FileHandle(host.fs.open(pathOf(path), String(flags), Number(mode))));

// A directory handle, for the callers that iterate rather than list. It is
// backed by one readdir: the incremental syscall version buys nothing here,
// where the read is a Go function call away rather than a syscall away.
class Dir {
  constructor(path, entries) { this.path = path; this._entries = entries; this._at = 0; }
  async read() { return this._at < this._entries.length ? this._entries[this._at++] : null; }
  async close() {}
  async *[Symbol.asyncIterator]() { for (const entry of this._entries) yield entry; }
}

export const opendir = settle((path, options = {}) =>
  new Dir(pathOf(path), host.fs.readdir(pathOf(path), true).map((e) => new Dirent(e, pathOf(path)))));

export const lutimes = utimes;
export const lchmod = chmod;
export const statfs = settle(() => ({ type: 0, bsize: 4096, blocks: 0, bfree: 0, bavail: 0, files: 0, ffree: 0 }));
export const glob = () => { throw Object.assign(new Error('fs.glob is not supported'), { code: 'ERR_NOT_IMPLEMENTED' }); };

// The promise face of fs.watch is an async iterator rather than an emitter. It
// is built on the emitter one so that both faces share a single poll: events
// queue as they are delivered, and each `for await` step takes one.
export async function* watch(filename, options = {}) {
  if (typeof options === 'string') options = { encoding: options };
  const watcher = fsWatch(filename, options);
  // An iterating consumer is waiting on this, so the poll must keep running —
  // see __holdWatchPoll. Released in the finally below, on every exit.
  const release = __holdWatchPoll();

  const queue = [];
  let waiting = null;
  let ended = false;
  let failure;

  const push = (value) => {
    if (waiting) { const resume = waiting; waiting = null; resume(value); }
    else queue.push(value);
  };
  watcher.on('change', (eventType, name) => push({ eventType, filename: name }));
  watcher.on('error', (error) => { failure = error; ended = true; push(undefined); });
  watcher.on('close', () => { ended = true; push(undefined); });

  if (options.signal) {
    if (options.signal.aborted) { watcher.close(); return; }
    options.signal.addEventListener('abort', () => watcher.close(), { once: true });
  }

  try {
    for (;;) {
      const next = queue.length > 0
        ? queue.shift()
        : (ended ? undefined : await new Promise((resume) => { waiting = resume; }));
      if (next === undefined) {
        if (failure) throw failure;
        return;
      }
      yield next;
    }
  } finally {
    // Reached on return, on throw, and on the consumer simply breaking out of
    // its loop — which is the case that would otherwise leak the watcher.
    release();
    watcher.close();
  }
}

const __ns = {
  constants, readFile, writeFile, appendFile, stat, lstat, mkdir, rm, rmdir,
  unlink, rename, copyFile, cp, realpath, readlink, symlink, link, chmod,
  utimes, access, truncate, mkdtemp, readdir, open, watch,
  opendir, lutimes, lchmod, statfs, glob,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['fs/promises'] = __ns;
