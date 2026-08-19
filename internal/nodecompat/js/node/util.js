// node:util — the grab bag. inspect and promisify are what code actually uses;
// the rest is here so an import of it does not fail.

import types from 'node:util/types';

export { types };

// inspect is a debugging renderer, and its job is to be readable rather than
// reversible: cycles become [Circular], long output is not truncated because a
// truncated log entry is worse than a long one, and a Map shows its contents
// where JSON.stringify shows `{}`.
export function inspect(value, options = {}) {
  const depth = options.depth === undefined ? 2 : options.depth;
  return render(value, depth, new Set());
}

function render(value, depth, seen) {
  switch (typeof value) {
    case 'string': return depth < 0 ? `'${value}'` : `'${value.replace(/'/g, "\\'")}'`;
    case 'number': case 'boolean': case 'undefined': return String(value);
    case 'bigint': return `${value}n`;
    case 'symbol': return value.toString();
    case 'function': return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (value === null) return 'null';
  if (seen.has(value)) return '[Circular *1]';
  if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof RegExp) return String(value);
  if (depth < 0) return Array.isArray(value) ? '[Array]' : '[Object]';

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return `[ ${value.map((v) => render(v, depth - 1, seen)).join(', ')} ]`;
    }
    if (value instanceof Map) {
      const body = [...value].map(([k, v]) => `${render(k, depth - 1, seen)} => ${render(v, depth - 1, seen)}`);
      return `Map(${value.size}) { ${body.join(', ')} }`;
    }
    if (value instanceof Set) {
      return `Set(${value.size}) { ${[...value].map((v) => render(v, depth - 1, seen)).join(', ')} }`;
    }
    if (ArrayBuffer.isView(value)) {
      return `${value.constructor.name}(${value.length}) [ ${[...value].slice(0, 32).join(', ')}${value.length > 32 ? ', ...' : ''} ]`;
    }
    const name = value.constructor && value.constructor.name !== 'Object' ? `${value.constructor.name} ` : '';
    const body = Object.entries(value).map(([k, v]) => `${renderKey(k)}: ${render(v, depth - 1, seen)}`);
    return body.length ? `${name}{ ${body.join(', ')} }` : `${name}{}`;
  } finally {
    seen.delete(value);
  }
}

function renderKey(k) {
  return /^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`;
}

// format is console.log's substitution, and it is worth having because library
// code builds messages with it.
export function format(first, ...rest) {
  if (typeof first !== 'string') return [first, ...rest].map((v) => inspect(v)).join(' ');
  let i = 0;
  const out = first.replace(/%[sdifjoOc%]/g, (token) => {
    if (token === '%%') return '%';
    if (i >= rest.length) return token;
    const arg = rest[i++];
    switch (token) {
      case '%s': return typeof arg === 'string' ? arg : inspect(arg, { depth: 1 });
      case '%d': case '%f': return String(Number(arg));
      case '%i': return String(parseInt(arg, 10));
      case '%j': try { return JSON.stringify(arg); } catch { return '[Circular]'; }
      case '%c': return '';
      default: return inspect(arg);
    }
  });
  const extra = rest.slice(i).map((v) => (typeof v === 'string' ? v : inspect(v)));
  return [out, ...extra].join(' ');
}

export const formatWithOptions = (_options, ...args) => format(...args);

export function promisify(fn) {
  if (fn[promisify.custom]) return fn[promisify.custom];
  const promisified = function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, ...values) => {
        if (err) reject(err);
        else resolve(values.length > 1 ? values : values[0]);
      });
    });
  };
  Object.defineProperty(promisified, 'name', { value: `${fn.name}Promisified` });
  return promisified;
}
promisify.custom = Symbol.for('nodejs.util.promisify.custom');

export function callbackify(fn) {
  return function (...args) {
    const cb = args.pop();
    fn.apply(this, args).then((v) => cb(null, v), (err) => cb(err));
  };
}

export function inherits(ctor, superCtor) {
  Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  Object.defineProperty(ctor, 'super_', { value: superCtor, writable: true, configurable: true });
}

export function deprecate(fn, message) {
  let warned = false;
  return function (...args) {
    if (!warned) {
      warned = true;
      console.error(`DeprecationWarning: ${message}`);
    }
    return fn.apply(this, args);
  };
}

export const isDeepStrictEqual = (a, b) => deepEqual(a, b);

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map) {
    return a.size === b.size && [...a].every(([k, v]) => b.has(k) && deepEqual(v, b.get(k)));
  }
  if (a instanceof Set) {
    return a.size === b.size && [...a].every((v) => b.has(v));
  }
  const ka = Reflect.ownKeys(a);
  const kb = Reflect.ownKeys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
}

// TextEncoder/TextDecoder are re-exported from util because that is where they
// lived before they were global, and code from that era still imports them here.
export const TextEncoder = globalThis.TextEncoder;
export const TextDecoder = globalThis.TextDecoder;

export const debuglog = () => () => {};
export const debug = debuglog;
export const stripVTControlCharacters = (s) => String(s).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');

export const parseArgs = () => { throw new Error('util.parseArgs is not implemented'); };

const __ns = {
  types, inspect, format, formatWithOptions, promisify, callbackify, inherits,
  deprecate, isDeepStrictEqual, TextEncoder, TextDecoder, debuglog, debug,
  stripVTControlCharacters, parseArgs,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['util'] = __ns;
