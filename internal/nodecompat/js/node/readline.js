// node:readline — createInterface over a readable, and nothing terminal.
//
// There is no terminal here (see tty.js), so the interactive half — prompts,
// cursor movement, history — has nothing to drive. What remains is the half
// libraries actually use: splitting a stream into lines, as events or as an
// async iterator. @anthropic-ai/sdk imports it for exactly that.

import { EventEmitter } from './events.js';
import { StringDecoder } from './string_decoder.js';

export class Interface extends EventEmitter {
  constructor(options = {}) {
    super();
    const input = options.input ?? options;
    this.input = input;
    this.terminal = false;
    this.closed = false;
    this._pending = '';
    this._decoder = new StringDecoder('utf8');
    this._onData = (chunk) => this._push(typeof chunk === 'string' ? chunk : this._decoder.write(chunk));
    this._onEnd = () => {
      const tail = this._pending + this._decoder.end();
      this._pending = '';
      if (tail.length > 0) this.emit('line', tail);
      this.close();
    };
    this._onError = (error) => this.emit('error', error);
    input?.on?.('data', this._onData);
    input?.on?.('end', this._onEnd);
    input?.on?.('error', this._onError);
  }

  _push(text) {
    const parts = (this._pending + text).split(/\r?\n/);
    this._pending = parts.pop();
    for (const line of parts) {
      if (this.closed) return;
      this.emit('line', line);
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.input?.removeListener?.('data', this._onData);
    this.input?.removeListener?.('end', this._onEnd);
    this.input?.removeListener?.('error', this._onError);
    this.emit('close');
  }

  pause() { this.input?.pause?.(); return this; }
  resume() { this.input?.resume?.(); return this; }
  setPrompt() {}
  prompt() {}
  write() {}

  async *[Symbol.asyncIterator]() {
    const queue = [];
    let finished = this.closed;
    let wake = null;
    const onLine = (line) => { queue.push(line); wake?.(); };
    const onClose = () => { finished = true; wake?.(); };
    this.on('line', onLine);
    this.on('close', onClose);
    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
          continue;
        }
        if (finished) return;
        await new Promise((resolve) => { wake = resolve; });
        wake = null;
      }
    } finally {
      this.removeListener('line', onLine);
      this.removeListener('close', onClose);
    }
  }
}

export function createInterface(options) {
  return new Interface(options);
}

export const clearLine = () => true;
export const clearScreenDown = () => true;
export const cursorTo = () => true;
export const moveCursor = () => true;
export const emitKeypressEvents = () => {};

const __ns = { Interface, createInterface, clearLine, clearScreenDown, cursorTo, moveCursor, emitKeypressEvents };
export default __ns;

// Registered for CommonJS interop, like every other shim; see prelude.js.
(globalThis.__nodeRegistry ??= {})['readline'] = __ns;
