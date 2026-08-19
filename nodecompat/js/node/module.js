// node:module — enough of it for ESM code that keeps a CommonJS escape hatch.
//
// createRequire is the one that matters: a package with `const x =
// createRequire(import.meta.url)('./thing.json')` in it is otherwise unloadable,
// and the JSON case is the only one that actually appears.

const host = globalThis.__nodeHost;

export function createRequire(from) {
  const base = typeof from === 'string' && from.startsWith('file:')
    ? host.url.fileToPath(from)
    : String(from || host.process.cwd());

  const require = (specifier) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      throw Object.assign(
        new Error(`require('${specifier}') is not supported: this runtime resolves modules through its host, not node_modules`),
        { code: 'ERR_MODULE_NOT_FOUND' },
      );
    }
    const dir = base.slice(0, base.lastIndexOf('/') + 1);
    const path = normalise(specifier.startsWith('/') ? specifier : dir + specifier);
    if (path.endsWith('.json')) {
      return JSON.parse(new TextDecoder().decode(host.fs.readFile(path)));
    }
    throw Object.assign(
      new Error(`require('${specifier}') is not supported: only JSON is loadable this way`),
      { code: 'ERR_REQUIRE_ESM' },
    );
  };
  require.resolve = (specifier) => specifier;
  require.cache = {};
  return require;
}

// normalise resolves `.` and `..` textually. The path is not necessarily a file
// path — a module compiled into the binary is reached by a URL-shaped key — so
// node:path's algebra is the wrong tool and its separator handling would mangle
// the scheme.
function normalise(p) {
  const [scheme, rest] = /^[a-z][a-z0-9+.-]*:\//i.test(p)
    ? [p.slice(0, p.indexOf(':/') + 2), p.slice(p.indexOf(':/') + 2)]
    : ['', p];
  const out = [];
  for (const part of rest.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') { out.pop(); continue; }
    out.push(part);
  }
  return scheme + (scheme ? '' : p.startsWith('/') ? '/' : '') + out.join('/');
}

export const builtinModules = [
  'assert', 'async_hooks', 'buffer', 'crypto', 'events', 'fs', 'module', 'os',
  'path', 'perf_hooks', 'process', 'querystring', 'stream', 'string_decoder',
  'timers', 'tty', 'url', 'util', 'zlib',
];

export const isBuiltin = (name) => builtinModules.includes(String(name).replace(/^node:/, ''));
export const register = () => {};
export const syncBuiltinESMExports = () => {};

export class Module {
  constructor(id) { this.id = id; this.exports = {}; }
  static createRequire = createRequire;
  static builtinModules = builtinModules;
  static isBuiltin = isBuiltin;
}

export default Module;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['module'] = Module;
