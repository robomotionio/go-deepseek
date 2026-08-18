// node:tty — nothing here is a terminal, and saying so plainly is what callers
// need: `isatty(fd)` decides whether to emit colour.

export const isatty = () => false;
export class ReadStream {}
export class WriteStream {}
export default { isatty, ReadStream, WriteStream };
