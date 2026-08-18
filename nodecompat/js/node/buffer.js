// node:buffer — Buffer is a global here (the prelude installs it), so this
// module is the naming layer that lets `import { Buffer } from 'node:buffer'`
// work, which is the spelling a bundler-aware codebase prefers.

export const Buffer = globalThis.Buffer;
export const Blob = globalThis.Blob;
export const atob = (s) => Buffer.from(s, 'base64').toString('latin1');
export const btoa = (s) => Buffer.from(s, 'latin1').toString('base64');
export const kMaxLength = 2 ** 32 - 1;
export const constants = { MAX_LENGTH: kMaxLength, MAX_STRING_LENGTH: 2 ** 29 - 24 };
export const isUtf8 = (input) => {
  try { new TextDecoder('utf-8', { fatal: true }).decode(input); return true; } catch { return false; }
};
export const isAscii = (input) => Array.prototype.every.call(new Uint8Array(input.buffer ?? input), (b) => b < 0x80);

export default { Buffer, Blob, atob, btoa, kMaxLength, constants, isUtf8, isAscii };
