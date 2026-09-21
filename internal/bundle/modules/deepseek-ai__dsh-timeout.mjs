// .harness/packages/util/timeout/lib/index.js
var TimeoutReason = class extends Error {
  code;
  timeoutMs;
  name = "TimeoutReason";
  /**
  * @param code Capability-owned timeout code (e.g. `BASH_TIMEOUT`).
  * @param timeoutMs The deadline that elapsed, in milliseconds.
  */
  constructor(code, timeoutMs) {
    super(`${code} after ${timeoutMs}ms`);
    this.code = code;
    this.timeoutMs = timeoutMs;
  }
};
var MAX_TIMER_DELAY_MS = 2147483647;
function assertTimerDelay(timeoutMs, name) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new Error(`${name} must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
}
function clampTimeout(requested, def, max, name = "timeoutMs") {
  if (requested !== void 0 && (!Number.isFinite(requested) || requested <= 0)) throw new Error(`${name} must be a positive finite number`);
  return Math.min(requested ?? def, max);
}
function deadline(upstream, timeoutMs, code) {
  if (timeoutMs <= 0) return {
    signal: upstream ?? new AbortController().signal,
    [Symbol.dispose]() {
    }
  };
  assertTimerDelay(timeoutMs, "deadline timeoutMs");
  const timer = new AbortController();
  const id = setTimeout(() => {
    timer.abort(new TimeoutReason(code, timeoutMs));
  }, timeoutMs);
  return {
    signal: upstream !== void 0 ? AbortSignal.any([upstream, timer.signal]) : timer.signal,
    [Symbol.dispose]() {
      clearTimeout(id);
    }
  };
}
function idleWatchdog(upstream, timeoutMs, code) {
  assertTimerDelay(timeoutMs, "idleWatchdog timeoutMs");
  const timeout = new AbortController();
  const signal = upstream === void 0 ? timeout.signal : AbortSignal.any([upstream, timeout.signal]);
  let timer;
  let outstanding = false;
  let disposed = false;
  const arm = () => {
    if (timer !== void 0) clearTimeout(timer);
    timer = setTimeout(() => {
      timeout.abort(new TimeoutReason(code, timeoutMs));
    }, timeoutMs);
  };
  return {
    signal,
    async next(iterator) {
      if (disposed) throw new Error("idleWatchdog is disposed");
      if (outstanding) throw new Error("idleWatchdog next is already outstanding");
      outstanding = true;
      arm();
      try {
        return await iterator.next();
      } finally {
        clearTimeout(timer);
        timer = void 0;
        outstanding = false;
      }
    },
    pulse() {
      if (disposed || !outstanding) return;
      arm();
    },
    [Symbol.dispose]() {
      if (disposed) return;
      disposed = true;
      if (timer !== void 0) clearTimeout(timer);
      timer = void 0;
    }
  };
}
function timeoutOf(x, code) {
  const reason = x.reason;
  if (!(reason instanceof TimeoutReason)) return void 0;
  return code === void 0 || reason.code === code ? reason : void 0;
}
export {
  MAX_TIMER_DELAY_MS,
  TimeoutReason,
  clampTimeout,
  deadline,
  idleWatchdog,
  timeoutOf
};
