// node:fs — the sync and callback faces. node:fs/promises is the third, built
// on the same bindings; both import their shared parts from ./_fsutil.js.

import { Readable, Writable } from 'node:stream';
import * as promisesAPI from 'node:fs/promises';
import {
  host, constants, asFsError, guard, makeStats, Dirent,
  decode, encodeData, pathOf, fdOf, modeOf, toMs,
} from './_fsutil.js';

export { constants, Dirent };

export const readFileSync = guard((path, options) => decode(host.fs.readFile(pathOf(path)), options));
export const writeFileSync = guard((path, data, options) => host.fs.writeFile(pathOf(path), encodeData(data, options), modeOf(options)));
export const appendFileSync = guard((path, data, options) => host.fs.appendFile(pathOf(path), encodeData(data, options), modeOf(options)));
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
export const fstatSync = guard((fd) => makeStats(host.fs.fstat(fdOf(fd))));

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
    return makeStats(host.fs.stat(path, follow));
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

export function watch() {
  // Deliberate. A watcher is a long-lived host resource with no owner in this
  // design, and everything here that watches files does so to notice edits a
  // person made — which is not something an embedded robot run has.
  throw Object.assign(new Error('fs.watch is not supported in this runtime'), { code: 'ERR_NOT_IMPLEMENTED' });
}
export const watchFile = watch;
export const unwatchFile = () => {};

export const promises = promisesAPI;

export default {
  constants, Dirent, promises,
  readFileSync, writeFileSync, appendFileSync, existsSync, statSync, lstatSync,
  mkdirSync, rmSync, rmdirSync, unlinkSync, renameSync, copyFileSync, cpSync,
  realpathSync, readlinkSync, symlinkSync, linkSync, chmodSync, utimesSync,
  accessSync, truncateSync, mkdtempSync, openSync, closeSync, readSync,
  writeSync, readdirSync, fsyncSync, fstatSync,
  readFile, writeFile, appendFile, stat, lstat, mkdir, rm, rmdir, unlink,
  rename, copyFile, readdir, realpath, readlink, symlink, link, chmod, utimes,
  access, truncate, mkdtemp, open, close,
  createReadStream, createWriteStream, watch, watchFile, unwatchFile,
};
