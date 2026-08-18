// node:string_decoder — a stateful UTF-8 decoder that does not split a
// multi-byte character across two chunks.
//
// It is the TextDecoder streaming mode with a different name and an older
// interface, so that is exactly what it is built on.

export class StringDecoder {
  constructor(encoding = 'utf8') {
    this.encoding = encoding;
    const normalised = String(encoding).toLowerCase();
    this._passthrough = ['hex', 'base64', 'latin1', 'binary', 'ascii'].includes(normalised);
    this._decoder = this._passthrough ? null : new TextDecoder('utf-8');
  }
  write(buffer) {
    if (this._passthrough) return Buffer.from(buffer).toString(this.encoding);
    return this._decoder.decode(buffer, { stream: true });
  }
  end(buffer) {
    const tail = buffer ? this.write(buffer) : '';
    if (this._passthrough) return tail;
    return tail + this._decoder.decode();
  }
  text(buffer) { return this.write(buffer); }
}

export default { StringDecoder };
