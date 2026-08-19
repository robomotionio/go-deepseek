// node:perf_hooks — the clock, which is already global.

export const performance = globalThis.performance;
export const monitorEventLoopDelay = () => ({
  enable() {}, disable() {}, reset() {},
  min: 0, max: 0, mean: 0, stddev: 0, percentile: () => 0,
});
export class PerformanceObserver {
  observe() {}
  disconnect() {}
}
export const constants = {};
const __ns = { performance, PerformanceObserver, monitorEventLoopDelay, constants };
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['perf_hooks'] = __ns;
