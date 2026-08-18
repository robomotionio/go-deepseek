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
    const path = specifier.startsWith('/') ? specifier : dir + specifier;
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
