// node:stream/web — the WHATWG streams, which are globals here.

export const ReadableStream = globalThis.ReadableStream;
export const WritableStream = globalThis.WritableStream;
export const TransformStream = globalThis.TransformStream;
export const ByteLengthQueuingStrategy = globalThis.ByteLengthQueuingStrategy;
export const CountQueuingStrategy = globalThis.CountQueuingStrategy;
export const TextDecoderStream = globalThis.TextDecoderStream;
export const TextEncoderStream = globalThis.TextEncoderStream;

export default {
  ReadableStream, WritableStream, TransformStream,
  ByteLengthQueuingStrategy, CountQueuingStrategy,
  TextDecoderStream, TextEncoderStream,
};
