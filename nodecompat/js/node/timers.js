// node:timers — the globals under their module names.

export const setTimeout = globalThis.setTimeout;
export const clearTimeout = globalThis.clearTimeout;
export const setInterval = globalThis.setInterval;
export const clearInterval = globalThis.clearInterval;
export const setImmediate = globalThis.setImmediate;
export const clearImmediate = globalThis.clearImmediate;

export const promises = await import('node:timers/promises');
export default { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate, promises };
