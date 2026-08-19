// node:stream/web — the WHATWG streams, which are globals here.

export const ReadableStream = globalThis.ReadableStream;
export const WritableStream = globalThis.WritableStream;
export const TransformStream = globalThis.TransformStream;
export const ByteLengthQueuingStrategy = globalThis.ByteLengthQueuingStrategy;
export const CountQueuingStrategy = globalThis.CountQueuingStrategy;
export const TextDecoderStream = globalThis.TextDecoderStream;
export const TextEncoderStream = globalThis.TextEncoderStream;

const __ns = {
  ReadableStream, WritableStream, TransformStream,
  ByteLengthQueuingStrategy, CountQueuingStrategy,
  TextDecoderStream, TextEncoderStream,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['stream/web'] = __ns;
