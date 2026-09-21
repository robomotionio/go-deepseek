// node:stream/promises — the promise forms of pipeline and finished.
//
// A separate module because the two pipelines differ in more than their return
// value: this one takes no trailing callback, so a function in last place is a
// stage — the consumer the chain ends in — rather than the thing to call back.

import { promises } from './stream.js';

export const pipeline = promises.pipeline;
export const finished = promises.finished;

const __ns = { pipeline, finished };
export default __ns;

// Registered for CommonJS interop, like every other shim; see prelude.js.
(globalThis.__nodeRegistry ??= {})['stream/promises'] = __ns;
