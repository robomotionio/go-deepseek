// Shared between node:fs and node:fs/promises: the two faces of one API, and
// everything except the calling convention is common to both.

const host = globalThis.__nodeHost;

export const constants = {
  F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1,
  O_RDONLY: 0, O_WRONLY: 1, O_RDWR: 2, O_CREAT: 64, O_EXCL: 128,
  O_TRUNC: 512, O_APPEND: 1024,
  COPYFILE_EXCL: 1,
};

// asFsError turns the message the Go side formats ("ENOENT: no such file or
// directory, open '/x'") back into an Error with the code broken out. Callers
// branch on `err.code === 'ENOENT'` far more often than they read the message,
// and an error without one turns a handled case into a rethrow.
export function asFsError(err) {
  const message = String(err && err.message ? err.message : err);
  const out = err instanceof Error ? err : new Error(message);
  const match = /^([A-Z]+[0-9]*):/.exec(message);
  if (match) {
    out.code = match[1];
    const path = /'([^']*)'$/.exec(message);
    if (path) out.path = path[1];
    const syscall = /,\s+(\w+)\s+'/.exec(message);
    if (syscall) out.syscall = syscall[1];
    if (out.code === 'ENOENT') out.errno = -2;
  }
  return out;
}

export function guard(fn) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (err) {
      throw asFsError(err);
    }
  };
}

// Stats is what every stat returns. The file's kind lives under a symbol,
// not beside the data: the host reports isFile as a boolean while the API
// exposes a method of that name, so the two cannot share a key — and a symbol
// is also what keeps an instance CLONEABLE. structuredClone copies own
// enumerable string keys, which here are data only, exactly as Node's (whose
// methods are on the prototype too). The JSONL session backend posts a stat
// result from its migration verifier back across a worker boundary; with the
// methods as own properties that was "a function could not be cloned".
const KIND = Symbol('nodecompat.stats.kind');

export class Stats {
  isFile() { return Boolean(this[KIND]?.isFile); }
  isDirectory() { return Boolean(this[KIND]?.isDirectory); }
  isSymbolicLink() { return Boolean(this[KIND]?.isSymlink); }
  isBlockDevice() { return false; }
  isCharacterDevice() { return false; }
  isFIFO() { return false; }
  isSocket() { return false; }
}

// bigint is not a detail. `stat(path, { bigint: true })` promises BigInt fields,
// and code that asks for it then does BigInt arithmetic on them — so returning
// Numbers does not merely lose precision, it makes the next expression throw
// "Cannot mix BigInt and other types". The harness's own filesystem provider
// asks for it on every stat.
export function makeStats(raw, options) {
  const asBigInt = Boolean(options && options.bigint);
  const n = (value) => (asBigInt ? BigInt(Math.trunc(Number(value) || 0)) : value);
  const { isFile, isDirectory, isSymlink, ...data } = raw;
  const stats = Object.assign(new Stats(), data, {
    dev: n(raw.dev),
    ino: n(raw.ino),
    mode: n(raw.mode),
    nlink: n(raw.nlink),
    uid: n(raw.uid),
    gid: n(raw.gid),
    rdev: n(0),
    size: n(raw.size),
    blksize: n(4096),
    blocks: n(Math.ceil((Number(raw.size) || 0) / 512)),
    atimeMs: n(raw.atimeMs),
    mtimeMs: n(raw.mtimeMs),
    ctimeMs: n(raw.ctimeMs),
    birthtimeMs: n(raw.birthtimeMs),
    // The nanosecond fields exist only in the bigint form, where they are the
    // reason to ask for it.
    ...(asBigInt ? {
      atimeNs: BigInt(Math.trunc(raw.atimeMs)) * 1000000n,
      mtimeNs: BigInt(Math.trunc(raw.mtimeMs)) * 1000000n,
      ctimeNs: BigInt(Math.trunc(raw.ctimeMs)) * 1000000n,
      birthtimeNs: BigInt(Math.trunc(raw.birthtimeMs)) * 1000000n,
    } : {}),
    mtime: new Date(raw.mtimeMs),
    atime: new Date(raw.atimeMs),
    ctime: new Date(raw.ctimeMs),
    birthtime: new Date(raw.birthtimeMs),
  });
  Object.defineProperty(stats, KIND, { value: { isFile, isDirectory, isSymlink }, enumerable: false });
  return stats;
}

export class Dirent {
  constructor(raw, parentPath) {
    this.name = raw.name;
    this.parentPath = parentPath;
    this.path = parentPath;
    this._raw = raw;
  }
  isFile() { return this._raw.isFile; }
  isDirectory() { return this._raw.isDirectory; }
  isSymbolicLink() { return this._raw.isSymlink; }
  isBlockDevice() { return false; }
  isCharacterDevice() { return false; }
  isFIFO() { return false; }
  isSocket() { return false; }
}

// decode applies the encoding option the way the API does: no encoding means a
// Buffer, an encoding means a string.
export function decode(bytes, options) {
  const encoding = typeof options === 'string' ? options : options && options.encoding;
  if (!encoding || encoding === 'buffer') return Buffer.from(bytes);
  return Buffer.from(bytes).toString(encoding);
}

export function encodeData(data, options) {
  if (typeof data === 'string') {
    const encoding = (typeof options === 'string' ? options : options && options.encoding) || 'utf8';
    return Buffer.from(data, encoding);
  }
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return Buffer.from(String(data), 'utf8');
}

export function pathOf(p) {
  if (typeof p === 'string') return p;
  if (typeof URL !== 'undefined' && p instanceof URL) return host.url.fileToPath(p.href);
  if (p && typeof p.toString === 'function') return p.toString();
  const err = new TypeError('The "path" argument must be of type string or an instance of URL');
  err.code = 'ERR_INVALID_ARG_TYPE';
  throw err;
}

export function fdOf(fd) { return typeof fd === 'object' && fd ? Number(fd.fd) : Number(fd); }

export function modeOf(options) {
  if (typeof options === 'number') return options;
  return options && typeof options.mode === 'number' ? options.mode : 0;
}

// The write flag, as `fs.writeFile(path, data, { flag })` gives it. Empty means
// "the default for this call" and the host decides which — 'w' for a write, 'a'
// for an append — because only the host knows which one it is being asked for.
//
// Worth passing through rather than ignoring: 'wx' is an exclusive create, and
// exclusive create is how portable JavaScript takes a lock. Dropping it grants
// the lock to every caller at once, silently.
export function flagOf(options) {
  if (typeof options === 'string') return '';
  return options && typeof options.flag === 'string' ? options.flag : '';
}

export function toMs(t) {
  if (t instanceof Date) return t.getTime();
  // A number is seconds or milliseconds depending on who wrote the call, and
  // no epoch in milliseconds is smaller than 1e12.
  if (typeof t === 'number') return t < 1e12 ? t * 1000 : t;
  return Date.now();
}

export { host };
