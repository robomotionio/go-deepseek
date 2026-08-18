// node:timers/promises — a delay you can await, and one you can abort.
//
// The abort half is the reason this is not a one-liner: a sleep that ignores its
// signal is a request that cannot be cancelled, which is exactly what a caller
// racing a timeout is trying to avoid.

const rawSetTimeout = globalThis.setTimeout;
const rawClearTimeout = globalThis.clearTimeout;

export function setTimeout(delay = 0, value, options = {}) {
  const { signal } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const handle = rawSetTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(value);
    }, delay);
    const onAbort = () => { rawClearTimeout(handle); reject(signal.reason); };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export const setImmediate = (value, options) => setTimeout(0, value, options);

export async function* setInterval(delay = 0, value, options = {}) {
  while (true) {
    await setTimeout(delay, undefined, options);
    yield value;
  }
}

export const scheduler = {
  wait: (delay, options) => setTimeout(delay, undefined, options),
  yield: () => setTimeout(0),
};

export default { setTimeout, setImmediate, setInterval, scheduler };
