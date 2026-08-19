// node:timers — the globals under their module names.

export const setTimeout = globalThis.setTimeout;
export const clearTimeout = globalThis.clearTimeout;
export const setInterval = globalThis.setInterval;
export const clearInterval = globalThis.clearInterval;
export const setImmediate = globalThis.setImmediate;
export const clearImmediate = globalThis.clearImmediate;

export const promises = await import('node:timers/promises');
const __ns = { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate, promises };
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['timers'] = __ns;
