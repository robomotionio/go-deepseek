// node:tty — nothing here is a terminal, and saying so plainly is what callers
// need: `isatty(fd)` decides whether to emit colour.

export const isatty = () => false;
export class ReadStream {}
export class WriteStream {}
const __ns = { isatty, ReadStream, WriteStream };
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['tty'] = __ns;
