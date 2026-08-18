// node:path — pure string algebra, so it lives here rather than in Go.
//
// Both flavours are built from one implementation parameterised by separator,
// because the only real differences are the separator, the drive/UNC prefix, and
// whether a backslash also separates. Keeping them as one body is what stops the
// win32 half drifting into a subtly different algorithm, which is how these
// implementations usually go wrong.

const host = globalThis.__nodeHost;

function make(sep, isWin) {
  const isSep = (ch) => ch === sep || (isWin && ch === '/');

  // rootLength returns how much of p is the root: '/' on posix, and on win32 a
  // drive ('C:\'), a drive-relative prefix ('C:') or a UNC share.
  function rootLength(p) {
    if (!isWin) return p.length > 0 && p[0] === '/' ? 1 : 0;
    if (p.length >= 2 && p[1] === ':') {
      return p.length >= 3 && isSep(p[2]) ? 3 : 2;
    }
    if (p.length >= 2 && isSep(p[0]) && isSep(p[1])) {
      // \\server\share
      let i = 2;
      let seen = 0;
      while (i < p.length && seen < 2) {
        if (isSep(p[i])) seen++;
        i++;
      }
      return seen === 2 ? i : p.length;
    }
    return p.length >= 1 && isSep(p[0]) ? 1 : 0;
  }

  function normaliseParts(body, absolute) {
    const out = [];
    for (const part of body.split(isWin ? /[\\/]+/ : /\/+/)) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        if (out.length && out[out.length - 1] !== '..') out.pop();
        else if (!absolute) out.push('..');
        continue;
      }
      out.push(part);
    }
    return out;
  }

  const path = {
    sep,
    delimiter: isWin ? ';' : ':',

    isAbsolute(p) {
      assertString(p, 'path');
      if (!isWin) return p.startsWith('/');
      const r = rootLength(p);
      return r > 0 && (r !== 2 || isSep(p[2] || ''));
    },

    normalize(p) {
      assertString(p, 'path');
      if (p.length === 0) return '.';
      const rootLen = rootLength(p);
      const root = p.slice(0, rootLen);
      const absolute = path.isAbsolute(p);
      const parts = normaliseParts(p.slice(rootLen), absolute);
      let out = parts.join(sep);
      if (!out && !root) return '.';
      // A trailing separator survives normalisation, because `a/b/` and `a/b`
      // mean different things to a caller building a URL or a prefix test.
      if (p.length > 1 && isSep(p[p.length - 1]) && out) out += sep;
      return normaliseRoot(root) + out;
    },

    join(...parts) {
      const strings = parts.filter((p) => {
        assertString(p, 'path');
        return p.length > 0;
      });
      if (strings.length === 0) return '.';
      return path.normalize(strings.join(sep));
    },

    resolve(...parts) {
      let resolved = '';
      let absolute = false;
      for (let i = parts.length - 1; i >= 0 && !absolute; i--) {
        const p = parts[i];
        assertString(p, 'path');
        if (!p) continue;
        resolved = resolved ? `${p}${sep}${resolved}` : p;
        absolute = path.isAbsolute(p);
      }
      if (!absolute) {
        const cwd = host.process.cwd();
        resolved = resolved ? `${cwd}${sep}${resolved}` : cwd;
      }
      const out = path.normalize(resolved);
      // resolve never returns a trailing separator, unlike normalize: its result
      // names a single location rather than describing a path.
      if (out.length > rootLength(out) && isSep(out[out.length - 1])) return out.slice(0, -1);
      return out;
    },

    relative(from, to) {
      assertString(from, 'from');
      assertString(to, 'to');
      const a = path.resolve(from);
      const b = path.resolve(to);
      if (a === b) return '';
      const cmp = (s) => (isWin ? s.toLowerCase() : s);
      const aParts = cmp(a).split(isWin ? /[\\/]/ : '/').filter(Boolean);
      const bParts = cmp(b).split(isWin ? /[\\/]/ : '/').filter(Boolean);
      const bReal = b.split(isWin ? /[\\/]/ : '/').filter(Boolean);
      let i = 0;
      while (i < aParts.length && i < bParts.length && aParts[i] === bParts[i]) i++;
      const up = new Array(aParts.length - i).fill('..');
      return [...up, ...bReal.slice(i)].join(sep);
    },

    dirname(p) {
      assertString(p, 'path');
      const rootLen = rootLength(p);
      let end = p.length;
      while (end > rootLen && isSep(p[end - 1])) end--;
      let i = end - 1;
      while (i >= rootLen && !isSep(p[i])) i--;
      if (i < rootLen) return rootLen > 0 ? normaliseRoot(p.slice(0, rootLen)) : '.';
      while (i > rootLen && isSep(p[i - 1])) i--;
      return p.slice(0, i) || (rootLen > 0 ? normaliseRoot(p.slice(0, rootLen)) : '.');
    },

    basename(p, ext) {
      assertString(p, 'path');
      let end = p.length;
      while (end > 0 && isSep(p[end - 1])) end--;
      let start = end;
      while (start > 0 && !isSep(p[start - 1])) start--;
      let base = p.slice(start, end);
      if (ext && base.endsWith(ext) && base !== ext) base = base.slice(0, -ext.length);
      return base;
    },

    extname(p) {
      const base = path.basename(p);
      const dot = base.lastIndexOf('.');
      // A leading dot is a hidden file, not an extension: '.bashrc' has none.
      return dot <= 0 ? '' : base.slice(dot);
    },

    parse(p) {
      assertString(p, 'path');
      const rootLen = rootLength(p);
      const root = p.slice(0, rootLen);
      const base = path.basename(p);
      const ext = path.extname(p);
      return {
        root,
        dir: path.dirname(p) === '.' && !root ? '' : path.dirname(p),
        base,
        ext,
        name: ext ? base.slice(0, -ext.length) : base,
      };
    },

    format(o = {}) {
      const dir = o.dir || o.root || '';
      const base = o.base || `${o.name || ''}${o.ext || ''}`;
      if (!dir) return base;
      if (dir === o.root) return `${dir}${base}`;
      return `${dir}${sep}${base}`;
    },

    toNamespacedPath(p) { return p; },
  };

  function normaliseRoot(root) {
    if (!isWin) return root;
    return root.replace(/\//g, sep);
  }

  return path;
}

function assertString(p, name) {
  if (typeof p !== 'string') {
    const err = new TypeError(`The "${name}" argument must be of type string. Received ${typeof p}`);
    err.code = 'ERR_INVALID_ARG_TYPE';
    throw err;
  }
}

export const posix = make('/', false);
export const win32 = make('\\', true);

const active = host.os.platform() === 'win32' ? win32 : posix;

export const sep = active.sep;
export const delimiter = active.delimiter;
export const isAbsolute = active.isAbsolute;
export const normalize = active.normalize;
export const join = active.join;
export const resolve = active.resolve;
export const relative = active.relative;
export const dirname = active.dirname;
export const basename = active.basename;
export const extname = active.extname;
export const parse = active.parse;
export const format = active.format;
export const toNamespacedPath = active.toNamespacedPath;

const path = { ...active, posix, win32 };
posix.posix = posix;
posix.win32 = win32;
win32.posix = posix;
win32.win32 = win32;

export default path;
