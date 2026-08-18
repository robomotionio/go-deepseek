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
export default { performance, PerformanceObserver, monitorEventLoopDelay, constants };
