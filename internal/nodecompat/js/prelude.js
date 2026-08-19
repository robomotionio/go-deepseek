// The global surface: everything published JavaScript expects to find without
// importing it.
//
// This runs as a script, before any module, and it is the only place that reads
// the host object directly apart from the node: shims. Nothing here is a
// language feature — goant supplies those — and nothing here touches the machine
// except through __nodeHost.

'use strict';

(function installGlobals(g) {
  const host = g.__nodeHost;
  if (!host) throw new Error('nodecompat: host bindings are missing');

  // --- streams --------------------------------------------------------------
  // The ponyfill exported itself onto a namespace object rather than the global,
  // which is what "pony" means: it does not install anything, so we choose what
  // is installed and can leave a real implementation in place if one appears.
  const streams = g.WebStreamsPolyfill;
  if (streams) {
    for (const name of [
      'ReadableStream', 'WritableStream', 'TransformStream',
      'ReadableStreamDefaultReader', 'ReadableStreamBYOBReader',
      'ReadableStreamDefaultController', 'ReadableByteStreamController',
      'WritableStreamDefaultWriter', 'WritableStreamDefaultController',
      'TransformStreamDefaultController',
      'ByteLengthQueuingStrategy', 'CountQueuingStrategy',
    ]) {
      if (!(name in g) && streams[name]) g[name] = streams[name];
    }
    delete g.WebStreamsPolyfill;
  }

  // A ReadableStream that cannot be iterated is a ReadableStream half of the
  // ecosystem cannot use: `for await (const chunk of response.body)` is the
  // ordinary way to read one, and the polyfill predates it being standard.
  if (g.ReadableStream && !g.ReadableStream.prototype[Symbol.asyncIterator]) {
    const values = function values({ preventCancel = false } = {}) {
      const reader = this.getReader();
      return {
        async next() {
          try {
            const { done, value } = await reader.read();
            if (done) reader.releaseLock();
            return { done, value };
          } catch (err) {
            reader.releaseLock();
            throw err;
          }
        },
        async return(value) {
          if (!preventCancel) await reader.cancel(value);
          reader.releaseLock();
          return { done: true, value };
        },
        [Symbol.asyncIterator]() { return this; },
      };
    };
    g.ReadableStream.prototype.values = values;
    g.ReadableStream.prototype[Symbol.asyncIterator] = values;
  }

  // --- text encoding --------------------------------------------------------

  class TextEncoder {
    get encoding() { return 'utf-8'; }
    encode(input = '') { return host.text.encode(String(input)); }
    encodeInto(input, dest) {
      const bytes = host.text.encode(String(input));
      const written = Math.min(bytes.length, dest.length);
      dest.set(bytes.subarray(0, written));
      // read counts CHARACTERS consumed, not bytes written, and a truncated
      // multi-byte sequence would be a decoding bug downstream. Only whole
      // input is reported as read.
      return { read: written === bytes.length ? input.length : 0, written };
    }
  }

  class TextDecoder {
    #encoding;
    #fatal;
    #pending;
    constructor(label = 'utf-8', options = {}) {
      this.#encoding = String(label).toLowerCase();
      if (!['utf-8', 'utf8', 'unicode-1-1-utf-8', ''].includes(this.#encoding)) {
        // Being explicit beats decoding latin-1 as if it were UTF-8 and handing
        // back plausible nonsense.
        throw new RangeError(`TextDecoder: unsupported encoding '${label}'`);
      }
      this.#encoding = 'utf-8';
      this.#fatal = Boolean(options.fatal);
      this.#pending = null;
    }
    get encoding() { return this.#encoding; }
    get fatal() { return this.#fatal; }
    decode(input, options = {}) {
      let bytes = toBytes(input);
      if (this.#pending && this.#pending.length) {
        const merged = new Uint8Array(this.#pending.length + bytes.length);
        merged.set(this.#pending, 0);
        merged.set(bytes, this.#pending.length);
        bytes = merged;
        this.#pending = null;
      }
      if (options.stream) {
        // Hold back a trailing partial sequence rather than decoding it into a
        // replacement character that the next chunk cannot undo. This is the
        // whole reason streaming decode exists.
        const keep = trailingPartial(bytes);
        if (keep > 0) {
          this.#pending = bytes.subarray(bytes.length - keep).slice();
          bytes = bytes.subarray(0, bytes.length - keep);
        }
      }
      return host.text.decode(bytes);
    }
  }

  // trailingPartial returns how many bytes at the end of the buffer are the
  // start of a multi-byte sequence that has not finished.
  function trailingPartial(bytes) {
    for (let back = 1; back <= 3 && back <= bytes.length; back++) {
      const b = bytes[bytes.length - back];
      if (b < 0x80) return 0;             // ASCII: nothing pending
      if (b >= 0xc0) {                    // a lead byte
        const needed = b >= 0xf0 ? 4 : b >= 0xe0 ? 3 : 2;
        return needed > back ? back : 0;
      }
    }
    return 0;
  }

  function toBytes(input) {
    if (input === undefined || input === null) return new Uint8Array(0);
    if (input instanceof Uint8Array) return input;
    if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new TypeError('expected a BufferSource');
  }

  g.TextEncoder = TextEncoder;
  g.TextDecoder = TextDecoder;

  if (g.TransformStream) {
    g.TextDecoderStream = class TextDecoderStream extends g.TransformStream {
      constructor(label, options) {
        const decoder = new TextDecoder(label, options);
        super({
          transform(chunk, controller) {
            const text = decoder.decode(chunk, { stream: true });
            if (text) controller.enqueue(text);
          },
          flush(controller) {
            const text = decoder.decode();
            if (text) controller.enqueue(text);
          },
        });
      }
    };
    g.TextEncoderStream = class TextEncoderStream extends g.TransformStream {
      constructor() {
        const encoder = new TextEncoder();
        super({
          transform(chunk, controller) { controller.enqueue(encoder.encode(chunk)); },
        });
      }
    };
  }

  // --- Buffer ---------------------------------------------------------------
  // A Uint8Array subclass, as in Node, so that anything taking a BufferSource
  // takes a Buffer without knowing what one is.

  class Buffer extends Uint8Array {
    static from(value, encodingOrOffset, length) {
      if (typeof value === 'string') return fromString(value, encodingOrOffset || 'utf8');
      if (value instanceof ArrayBuffer) {
        const view = length === undefined
          ? new Uint8Array(value, encodingOrOffset || 0)
          : new Uint8Array(value, encodingOrOffset || 0, length);
        return wrap(view.slice());
      }
      if (ArrayBuffer.isView(value)) return wrap(new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice());
      if (Array.isArray(value)) return wrap(Uint8Array.from(value));
      if (value && typeof value.length === 'number') return wrap(Uint8Array.from(value));
      throw new TypeError('Buffer.from: unsupported input');
    }
    static alloc(size, fill = 0) {
      const b = wrap(new Uint8Array(size));
      if (fill) b.fill(typeof fill === 'string' ? fill.charCodeAt(0) : fill);
      return b;
    }
    static allocUnsafe(size) { return Buffer.alloc(size); }
    static isBuffer(x) { return x instanceof Buffer; }
    static byteLength(value, encoding = 'utf8') {
      if (typeof value !== 'string') return toBytes(value).length;
      return fromString(value, encoding).length;
    }
    static concat(list, total) {
      const parts = list.map(toBytes);
      const size = total === undefined ? parts.reduce((n, p) => n + p.length, 0) : total;
      const out = new Uint8Array(size);
      let at = 0;
      for (const p of parts) {
        if (at >= size) break;
        out.set(p.subarray(0, size - at), at);
        at += p.length;
      }
      return wrap(out);
    }
    toString(encoding = 'utf8', start = 0, end = this.length) {
      const slice = this.subarray(start, end);
      switch (String(encoding).toLowerCase()) {
        case 'hex': return host.text.hexEncode(slice);
        case 'base64': return host.text.base64Encode(slice);
        case 'base64url': return host.text.base64Encode(slice).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        case 'latin1': case 'binary': case 'ascii': {
          let s = '';
          for (const b of slice) s += String.fromCharCode(b);
          return s;
        }
        default: return host.text.decode(slice);
      }
    }
    toJSON() { return { type: 'Buffer', data: Array.from(this) }; }
    equals(other) {
      const b = toBytes(other);
      if (b.length !== this.length) return false;
      for (let i = 0; i < b.length; i++) if (b[i] !== this[i]) return false;
      return true;
    }
    write(string, offset = 0, length, encoding = 'utf8') {
      if (typeof length === 'string') { encoding = length; length = undefined; }
      const bytes = fromString(string, encoding);
      const n = Math.min(length === undefined ? bytes.length : length, this.length - offset);
      this.set(bytes.subarray(0, n), offset);
      return n;
    }
    slice(start, end) { return wrap(super.subarray(start, end)); }
    subarray(start, end) { return wrap(super.subarray(start, end)); }
  }

  function wrap(u8) { return Object.setPrototypeOf(u8, Buffer.prototype); }

  function fromString(value, encoding = 'utf8') {
    switch (String(encoding).toLowerCase()) {
      case 'hex': return wrap(host.text.hexDecode(value));
      case 'base64': case 'base64url': return wrap(host.text.base64Decode(value));
      case 'latin1': case 'binary': case 'ascii': {
        const out = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++) out[i] = value.charCodeAt(i) & 0xff;
        return wrap(out);
      }
      default: return wrap(host.text.encode(value));
    }
  }

  // --- Buffer's numeric accessors -------------------------------------------
  //
  // A Node Buffer is a binary READER as well as a byte array, and code that
  // parses a format reaches for these rather than for a DataView. The session
  // log reader is one such caller: it walks Zstandard frame headers with
  // readUInt32LE, readUInt8 and readUIntLE, so a Buffer without them cannot
  // read back a log this runtime itself wrote. That failure arrives as
  // "undefined is not a function" a long way from its cause, which is the
  // argument for implementing the whole family rather than the three in use.
  //
  // They are generated from one table so the spellings cannot drift apart, and
  // they range-check the way Node's do: a silent out-of-range read is how a
  // parser returns a wrong answer instead of failing.

  const fixedWidth = {
    UInt8: ['getUint8', 'setUint8', 1, false],
    UInt16LE: ['getUint16', 'setUint16', 2, true],
    UInt16BE: ['getUint16', 'setUint16', 2, false],
    UInt32LE: ['getUint32', 'setUint32', 4, true],
    UInt32BE: ['getUint32', 'setUint32', 4, false],
    Int8: ['getInt8', 'setInt8', 1, false],
    Int16LE: ['getInt16', 'setInt16', 2, true],
    Int16BE: ['getInt16', 'setInt16', 2, false],
    Int32LE: ['getInt32', 'setInt32', 4, true],
    Int32BE: ['getInt32', 'setInt32', 4, false],
    FloatLE: ['getFloat32', 'setFloat32', 4, true],
    FloatBE: ['getFloat32', 'setFloat32', 4, false],
    DoubleLE: ['getFloat64', 'setFloat64', 8, true],
    DoubleBE: ['getFloat64', 'setFloat64', 8, false],
    BigUInt64LE: ['getBigUint64', 'setBigUint64', 8, true],
    BigUInt64BE: ['getBigUint64', 'setBigUint64', 8, false],
    BigInt64LE: ['getBigInt64', 'setBigInt64', 8, true],
    BigInt64BE: ['getBigInt64', 'setBigInt64', 8, false],
  };

  function outOfRange(name, value, max) {
    const error = new RangeError(
      `The value of "${name}" is out of range. It must be >= 0 and <= ${max}. Received ${value}`);
    error.code = 'ERR_OUT_OF_RANGE';
    return error;
  }

  // The view is over the Buffer's own window, so an offset is relative to the
  // Buffer rather than to the ArrayBuffer it may be a slice of. Getting that
  // wrong reads a neighbour's bytes and reports no error at all.
  function windowOf(buf, offset, size) {
    const max = buf.length - size;
    if (!Number.isInteger(offset) || offset < 0 || offset > max) {
      throw outOfRange('offset', offset, max < 0 ? 0 : max);
    }
    return new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  for (const suffix of Object.keys(fixedWidth)) {
    const [get, set, size, little] = fixedWidth[suffix];
    Buffer.prototype['read' + suffix] = function (offset = 0) {
      return windowOf(this, offset, size)[get](offset, little);
    };
    Buffer.prototype['write' + suffix] = function (value, offset = 0) {
      windowOf(this, offset, size)[set](offset, value, little);
      return offset + size;
    };
    // Node spells the unsigned ones both ways — readUInt8 and readUint8 — and
    // code in the wild uses both, so both are here.
    if (suffix.includes('UInt')) {
      const alias = suffix.replace('UInt', 'Uint');
      Buffer.prototype['read' + alias] = Buffer.prototype['read' + suffix];
      Buffer.prototype['write' + alias] = Buffer.prototype['write' + suffix];
    }
  }

  // The variable-width pair, 1 to 6 bytes. They exist because formats store
  // 24- and 48-bit fields, and 48 bits is the widest a JavaScript number holds
  // exactly — which is why Node caps them there and why these do too.
  function checkByteLength(byteLength) {
    if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > 6) {
      throw outOfRange('byteLength', byteLength, 6);
    }
  }

  function readVariable(buf, offset, byteLength, signed, little) {
    checkByteLength(byteLength);
    const view = windowOf(buf, offset, byteLength);
    let value = 0;
    for (let i = 0; i < byteLength; i++) {
      const at = little ? offset + byteLength - 1 - i : offset + i;
      value = value * 256 + view.getUint8(at);
    }
    if (!signed) return value;
    const half = Math.pow(2, byteLength * 8 - 1);
    return value >= half ? value - half * 2 : value;
  }

  function writeVariable(buf, value, offset, byteLength, little) {
    checkByteLength(byteLength);
    const view = windowOf(buf, offset, byteLength);
    let rest = Math.floor(Number(value));
    if (rest < 0) rest += Math.pow(2, byteLength * 8);
    for (let i = 0; i < byteLength; i++) {
      const at = little ? offset + i : offset + byteLength - 1 - i;
      view.setUint8(at, rest % 256);
      rest = Math.floor(rest / 256);
    }
    return offset + byteLength;
  }

  const variableWidth = {
    UIntLE: [false, true], UIntBE: [false, false],
    IntLE: [true, true], IntBE: [true, false],
  };
  for (const suffix of Object.keys(variableWidth)) {
    const [signed, little] = variableWidth[suffix];
    Buffer.prototype['read' + suffix] = function (offset = 0, byteLength = 1) {
      return readVariable(this, offset, byteLength, signed, little);
    };
    Buffer.prototype['write' + suffix] = function (value, offset = 0, byteLength = 1) {
      return writeVariable(this, value, offset, byteLength, little);
    };
    if (suffix.includes('UInt')) {
      const alias = suffix.replace('UInt', 'Uint');
      Buffer.prototype['read' + alias] = Buffer.prototype['read' + suffix];
      Buffer.prototype['write' + alias] = Buffer.prototype['write' + suffix];
    }
  }

  g.Buffer = Buffer;

  // --- Blob -----------------------------------------------------------------
  // Enough of one to be a fetch body and to be read back. Anything more (slice
  // ranges over streams, type sniffing) is unused by what runs here.

  class Blob {
    #bytes;
    constructor(parts = [], options = {}) {
      const chunks = [];
      for (const part of parts) {
        if (typeof part === 'string') chunks.push(host.text.encode(part));
        else if (part instanceof Blob) chunks.push(part.#bytes);
        else chunks.push(toBytes(part));
      }
      this.#bytes = Buffer.concat(chunks);
      this.type = options.type || '';
    }
    get size() { return this.#bytes.length; }
    async text() { return host.text.decode(this.#bytes); }
    async arrayBuffer() { return this.#bytes.slice().buffer; }
    async bytes() { return this.#bytes.slice(); }
    stream() {
      const bytes = this.#bytes;
      return new g.ReadableStream({
        start(controller) { controller.enqueue(bytes); controller.close(); },
      });
    }
    slice(start, end, type) {
      const b = new Blob([], { type: type || this.type });
      b.#bytes = this.#bytes.subarray(start, end);
      return b;
    }
  }
  g.Blob = Blob;

  // --- AbortController ------------------------------------------------------

  class AbortSignal extends EventTarget0() {
    #aborted = false;
    #reason = undefined;
    get aborted() { return this.#aborted; }
    get reason() { return this.#reason; }
    throwIfAborted() { if (this.#aborted) throw this.#reason; }
    static abort(reason) {
      const s = new AbortSignal();
      s.#abort(reason);
      return s;
    }
    static timeout(ms) {
      const s = new AbortSignal();
      const t = setTimeout(() => s.#abort(timeoutError(ms)), ms);
      // A timeout that keeps the loop alive would stop a program from ever
      // finishing on its own, which is the opposite of what a deadline is for.
      if (t && typeof t.unref === 'function') t.unref();
      return s;
    }
    static any(signals) {
      const out = new AbortSignal();
      for (const s of signals) {
        if (s.aborted) { out.#abort(s.reason); return out; }
        s.addEventListener('abort', () => out.#abort(s.reason), { once: true });
      }
      return out;
    }
    #abort(reason) {
      if (this.#aborted) return;
      this.#aborted = true;
      this.#reason = reason === undefined ? abortError() : reason;
      if (typeof this.onabort === 'function') this.onabort({ type: 'abort', target: this });
      this.dispatchEvent({ type: 'abort', target: this });
    }
    // The controller reaches the private abort through here rather than through
    // a public method, so a script holding only the signal cannot fire it.
    static _abort(signal, reason) { signal.#abort(reason); }
  }

  class AbortController {
    constructor() { this.signal = new AbortSignal(); }
    abort(reason) { AbortSignal._abort(this.signal, reason); }
  }

  function abortError() {
    const e = new Error('This operation was aborted');
    e.name = 'AbortError';
    return e;
  }
  function timeoutError(ms) {
    const e = new Error(`The operation was aborted due to timeout (${ms}ms)`);
    e.name = 'TimeoutError';
    return e;
  }

  // A minimal EventTarget, defined lazily so a real one wins if the engine ever
  // grows it.
  function EventTarget0() {
    if (g.EventTarget) return g.EventTarget;
    class EventTarget {
      #listeners = new Map();
      addEventListener(type, fn, options = {}) {
        if (!this.#listeners.has(type)) this.#listeners.set(type, []);
        this.#listeners.get(type).push({ fn, once: Boolean(options.once) });
      }
      removeEventListener(type, fn) {
        const list = this.#listeners.get(type);
        if (!list) return;
        const i = list.findIndex((l) => l.fn === fn);
        if (i >= 0) list.splice(i, 1);
      }
      dispatchEvent(event) {
        const list = this.#listeners.get(event.type);
        if (!list) return true;
        for (const l of [...list]) {
          if (l.once) this.removeEventListener(event.type, l.fn);
          try { l.fn.call(this, event); } catch (err) { reportUncaught(err); }
        }
        return true;
      }
    }
    g.EventTarget = EventTarget;
    return EventTarget;
  }

  g.AbortController = AbortController;
  g.AbortSignal = AbortSignal;

  function reportUncaught(err) {
    try { console.error('Uncaught (in listener)', err && err.stack ? err.stack : err); } catch { /* nothing left to do */ }
  }

  // --- URL ------------------------------------------------------------------
  // Parsing happens in Go (net/url), because a hand-written parser handles the
  // cases its author thought of and mangles the rest — and the failure mode is a
  // request to slightly the wrong place, which nothing reports.

  class URLSearchParams {
    #pairs = [];
    #onchange = null;
    constructor(init) {
      if (!init) return;
      if (typeof init === 'string') {
        const flat = host.url.parseQuery(init);
        for (let i = 0; i + 1 < flat.length; i += 2) this.#pairs.push([flat[i], flat[i + 1]]);
        return;
      }
      if (init instanceof URLSearchParams) { this.#pairs = init.#pairs.map((p) => [...p]); return; }
      if (Array.isArray(init)) { for (const [k, v] of init) this.#pairs.push([String(k), String(v)]); return; }
      for (const [k, v] of Object.entries(init)) this.#pairs.push([String(k), String(v)]);
    }
    _bind(fn) { this.#onchange = fn; return this; }
    #changed() { if (this.#onchange) this.#onchange(this.toString()); }
    append(k, v) { this.#pairs.push([String(k), String(v)]); this.#changed(); }
    set(k, v) {
      const key = String(k);
      const at = this.#pairs.findIndex((p) => p[0] === key);
      this.#pairs = this.#pairs.filter((p) => p[0] !== key);
      if (at >= 0) this.#pairs.splice(at, 0, [key, String(v)]);
      else this.#pairs.push([key, String(v)]);
      this.#changed();
    }
    get(k) { const hit = this.#pairs.find((p) => p[0] === String(k)); return hit ? hit[1] : null; }
    getAll(k) { return this.#pairs.filter((p) => p[0] === String(k)).map((p) => p[1]); }
    has(k) { return this.#pairs.some((p) => p[0] === String(k)); }
    delete(k) { this.#pairs = this.#pairs.filter((p) => p[0] !== String(k)); this.#changed(); }
    sort() { this.#pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)); this.#changed(); }
    forEach(fn, thisArg) { for (const [k, v] of this.#pairs) fn.call(thisArg, v, k, this); }
    keys() { return this.#pairs.map((p) => p[0])[Symbol.iterator](); }
    values() { return this.#pairs.map((p) => p[1])[Symbol.iterator](); }
    entries() { return this.#pairs.map((p) => [...p])[Symbol.iterator](); }
    [Symbol.iterator]() { return this.entries(); }
    get size() { return this.#pairs.length; }
    toString() { return host.url.encodeQuery(this.#pairs.flat()); }
  }

  class URL {
    #parts;
    #params;
    constructor(input, base) {
      const parsed = host.url.parse(String(input), base === undefined ? '' : String(base));
      if (!parsed.ok) throw new TypeError(`Invalid URL: ${input}`);
      this.#parts = parsed;
      this.#params = new URLSearchParams(parsed.search)._bind((query) => {
        // Writing through searchParams has to move href too, or the two
        // disagree and whichever the caller reads next is a coin flip.
        this.#parts.search = query ? `?${query}` : '';
        this.#reparse();
      });
    }
    #reparse() {
      const rebuilt = `${this.#parts.protocol}//${this.#authority()}${this.#parts.pathname}${this.#parts.search}${this.#parts.hash}`;
      const parsed = host.url.parse(rebuilt, '');
      if (parsed.ok) this.#parts = { ...parsed };
    }
    #authority() {
      const credentials = this.#parts.username
        ? `${this.#parts.username}${this.#parts.password ? `:${this.#parts.password}` : ''}@`
        : '';
      return credentials + this.#parts.host;
    }
    get href() { return this.#parts.href; }
    set href(v) {
      const parsed = host.url.parse(String(v), '');
      if (!parsed.ok) throw new TypeError(`Invalid URL: ${v}`);
      this.#parts = parsed;
      this.#params = new URLSearchParams(parsed.search)._bind((q) => {
        this.#parts.search = q ? `?${q}` : '';
        this.#reparse();
      });
    }
    get protocol() { return this.#parts.protocol; }
    set protocol(v) { this.#parts.protocol = String(v).endsWith(':') ? String(v) : `${v}:`; this.#reparse(); }
    get username() { return this.#parts.username; }
    set username(v) { this.#parts.username = String(v); this.#reparse(); }
    get password() { return this.#parts.password; }
    set password(v) { this.#parts.password = String(v); this.#reparse(); }
    get host() { return this.#parts.host; }
    set host(v) { this.#parts.host = String(v); this.#reparse(); }
    get hostname() { return this.#parts.hostname; }
    set hostname(v) {
      this.#parts.host = this.#parts.port ? `${v}:${this.#parts.port}` : String(v);
      this.#parts.hostname = String(v);
      this.#reparse();
    }
    get port() { return this.#parts.port; }
    set port(v) {
      this.#parts.port = String(v);
      this.#parts.host = v === '' ? this.#parts.hostname : `${this.#parts.hostname}:${v}`;
      this.#reparse();
    }
    get pathname() { return this.#parts.pathname; }
    set pathname(v) { this.#parts.pathname = String(v).startsWith('/') ? String(v) : `/${v}`; this.#reparse(); }
    get search() { return this.#parts.search; }
    set search(v) {
      const q = String(v);
      this.#parts.search = q === '' || q === '?' ? '' : (q.startsWith('?') ? q : `?${q}`);
      this.#params = new URLSearchParams(this.#parts.search)._bind((query) => {
        this.#parts.search = query ? `?${query}` : '';
        this.#reparse();
      });
      this.#reparse();
    }
    get searchParams() { return this.#params; }
    get hash() { return this.#parts.hash; }
    set hash(v) {
      const h = String(v);
      this.#parts.hash = h === '' || h === '#' ? '' : (h.startsWith('#') ? h : `#${h}`);
      this.#reparse();
    }
    get origin() { return this.#parts.origin; }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static canParse(input, base) { return host.url.parse(String(input), base === undefined ? '' : String(base)).ok; }
    static parse(input, base) { try { return new URL(input, base); } catch { return null; } }
  }

  g.URL = URL;
  g.URLSearchParams = URLSearchParams;

  // --- fetch ----------------------------------------------------------------

  class Headers {
    #entries = [];
    constructor(init) {
      if (!init) return;
      if (init instanceof Headers) { this.#entries = init.#entries.map((e) => [...e]); return; }
      if (Array.isArray(init)) { for (const [k, v] of init) this.append(k, v); return; }
      for (const [k, v] of Object.entries(init)) this.append(k, v);
    }
    append(name, value) { this.#entries.push([String(name).toLowerCase(), String(value)]); }
    set(name, value) {
      const key = String(name).toLowerCase();
      this.#entries = this.#entries.filter((e) => e[0] !== key);
      this.#entries.push([key, String(value)]);
    }
    // A repeated header joins with ", " rather than returning the first, which
    // is what a caller reading `set-cookie` or `accept` needs.
    get(name) {
      const key = String(name).toLowerCase();
      const hits = this.#entries.filter((e) => e[0] === key).map((e) => e[1]);
      return hits.length ? hits.join(', ') : null;
    }
    getSetCookie() { return this.#entries.filter((e) => e[0] === 'set-cookie').map((e) => e[1]); }
    has(name) { return this.get(name) !== null; }
    delete(name) {
      const key = String(name).toLowerCase();
      this.#entries = this.#entries.filter((e) => e[0] !== key);
    }
    forEach(fn, thisArg) { for (const [k, v] of this) fn.call(thisArg, v, k, this); }
    *entries() {
      const seen = new Map();
      for (const [k, v] of this.#entries) seen.set(k, seen.has(k) ? `${seen.get(k)}, ${v}` : v);
      yield* [...seen.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    }
    *keys() { for (const [k] of this.entries()) yield k; }
    *values() { for (const [, v] of this.entries()) yield v; }
    [Symbol.iterator]() { return this.entries(); }
    _flat() { return this.#entries.flat(); }
  }

  // Body is what Request and Response share: one source, read once, in whatever
  // shape the caller asks for.
  class Body {
    #source;
    #used = false;
    constructor(source) { this.#source = source; }
    get bodyUsed() { return this.#used; }
    get body() {
      if (this.#source === null || this.#source === undefined) return null;
      if (this.#source instanceof g.ReadableStream) return this.#source;
      const bytes = toBytes(this.#source);
      this.#source = new g.ReadableStream({
        start(controller) { controller.enqueue(bytes); controller.close(); },
      });
      return this.#source;
    }
    async arrayBuffer() { return (await this.#consume()).slice().buffer; }
    async bytes() { return this.#consume(); }
    async blob() { return new Blob([await this.#consume()]); }
    async text() { return host.text.decode(await this.#consume()); }
    async json() { return JSON.parse(await this.text()); }
    async #consume() {
      if (this.#used) throw new TypeError('Body has already been consumed');
      this.#used = true;
      const source = this.#source;
      if (source === null || source === undefined) return new Uint8Array(0);
      if (!(source instanceof g.ReadableStream)) return toBytes(source);
      const chunks = [];
      for await (const chunk of source) chunks.push(toBytes(chunk));
      return Buffer.concat(chunks);
    }
  }

  class Request extends Body {
    constructor(input, init = {}) {
      const from = input instanceof Request ? input : null;
      super(init.body !== undefined ? init.body : from ? from.body : null);
      this.url = from ? from.url : String(input);
      this.method = String(init.method || (from && from.method) || 'GET').toUpperCase();
      this.headers = new Headers(init.headers || (from && from.headers));
      this.signal = init.signal || (from && from.signal) || undefined;
      this.redirect = init.redirect || (from && from.redirect) || 'follow';
    }
  }

  class Response extends Body {
    constructor(body = null, init = {}) {
      super(body);
      this.status = init.status === undefined ? 200 : init.status;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers);
      this.url = init.url || '';
      this.redirected = Boolean(init.redirected);
      this.type = 'basic';
    }
    get ok() { return this.status >= 200 && this.status < 300; }
    static json(data, init) {
      const res = new Response(host.text.encode(JSON.stringify(data)), init);
      if (!res.headers.has('content-type')) res.headers.set('content-type', 'application/json');
      return res;
    }
  }

  let nextRequestId = 1;

  async function fetch(input, init = {}) {
    const request = input instanceof Request && !init.body && !init.method
      ? input
      : new Request(input, init);
    const signal = request.signal;
    if (signal && signal.aborted) throw signal.reason || abortError();

    const requestId = nextRequestId++;
    let bodyBytes = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const raw = init.body !== undefined ? init.body : null;
      if (raw !== null && raw !== undefined) {
        if (typeof raw === 'string') bodyBytes = host.text.encode(raw);
        else if (raw instanceof Blob) bodyBytes = await raw.bytes();
        else if (raw instanceof g.ReadableStream) {
          // Sending a stream means buffering it: the binding takes bytes, and
          // an upload that streams is not something anything here does.
          const chunks = [];
          for await (const chunk of raw) chunks.push(toBytes(chunk));
          bodyBytes = Buffer.concat(chunks);
        } else bodyBytes = toBytes(raw);
      }
    }

    let onAbort;
    if (signal) {
      onAbort = () => host.http.abort(requestId);
      signal.addEventListener('abort', onAbort, { once: true });
    }

    let raw;
    try {
      raw = await host.http.fetch({
        method: request.method,
        url: request.url,
        headers: request.headers._flat(),
        body: bodyBytes,
        requestId,
        redirect: request.redirect,
      });
    } finally {
      if (signal && onAbort) signal.removeEventListener('abort', onAbort);
    }

    const bodyId = raw.bodyId;
    const stream = new g.ReadableStream({
      async pull(controller) {
        const chunk = await host.http.read(bodyId);
        if (chunk === null || chunk === undefined) { controller.close(); return; }
        controller.enqueue(chunk);
      },
      cancel() { host.http.cancel(bodyId); },
    });
    if (signal) {
      signal.addEventListener('abort', () => host.http.cancel(bodyId), { once: true });
    }

    const headers = new Headers();
    for (let i = 0; i + 1 < raw.headers.length; i += 2) headers.append(raw.headers[i], raw.headers[i + 1]);
    const response = new Response(stream, {
      status: raw.status,
      statusText: raw.statusText,
      headers,
      url: raw.url,
      redirected: raw.redirected,
    });
    return response;
  }

  g.Headers = Headers;
  g.Request = Request;
  g.Response = Response;
  g.fetch = fetch;

  // --- process --------------------------------------------------------------

  const processEnv = host.process.env();
  const process = {
    platform: host.os.platform(),
    arch: host.os.arch(),
    version: 'v22.0.0',
    // Claiming a Node version is a lie with a purpose: published code gates
    // features on it, and every feature those gates ask about is present.
    versions: { node: '22.0.0', v8: 'goant' },
    env: processEnv,
    argv: host.process.argv(),
    argv0: 'node',
    execPath: host.process.argv()[0] || 'node',
    // Empty rather than absent. Library code reads it without checking —
    // `process.execArgv.includes('--expose-internals')` is in the harness's own
    // loader — and an undefined here fails as "cannot read properties of
    // undefined", a long way from the missing field.
    execArgv: [],
    title: 'dsh',
    release: { name: 'node' },
    config: { variables: {} },
    exitCode: undefined,
    pid: host.process.pid(),
    ppid: 0,
    cwd: () => host.process.cwd(),
    chdir() { throw new Error('process.chdir is not supported: the working directory belongs to the host'); },
    exit: (code = 0) => host.process.exit(code),
    uptime: () => host.os.uptime(),
    hrtime: Object.assign(
      (previous) => {
        const ns = host.process.hrtime();
        const s = Math.floor(ns / 1e9);
        const rest = ns % 1e9;
        if (!previous) return [s, rest];
        let ds = s - previous[0];
        let dn = rest - previous[1];
        if (dn < 0) { ds -= 1; dn += 1e9; }
        return [ds, dn];
      },
      { bigint: () => BigInt(Math.round(host.process.hrtime())) },
    ),
    memoryUsage: () => host.process.memoryUsage(),
    nextTick: (fn, ...args) => queueMicrotask(() => fn(...args)),
    emitWarning: (warning) => { console.error('Warning:', warning); },
    // The event surface is inert on purpose. There is no process to signal: the
    // Runtime is one part of a larger program, and a plugin listening for SIGINT
    // must not be told about the host's.
    on: () => process, once: () => process, off: () => process,
    removeListener: () => process, removeAllListeners: () => process,
    setMaxListeners: () => process, listeners: () => [],
    stdout: writableStdio('stdout'),
    stderr: writableStdio('stderr'),
    stdin: { isTTY: false, on: () => {}, once: () => {}, read: () => null, setEncoding: () => {}, resume: () => {}, pause: () => {} },
    features: { inspector: false },
    allowedNodeEnvironmentFlags: new Set(),
    getBuiltinModule: () => undefined,
  };

  function writableStdio(name) {
    return {
      isTTY: false,
      columns: 80,
      rows: 24,
      write(chunk, encoding, cb) {
        const text = typeof chunk === 'string' ? chunk : host.text.decode(toBytes(chunk));
        host.process.write(name, text);
        if (typeof encoding === 'function') encoding();
        else if (typeof cb === 'function') cb();
        return true;
      },
      end() {}, on: () => {}, once: () => {}, removeListener: () => {},
      cork: () => {}, uncork: () => {}, setDefaultEncoding: () => {},
    };
  }

  g.process = process;
  g.global = g;

  // --- CommonJS interop ------------------------------------------------------
  //
  // A bundled CommonJS package may `require` a Node builtin at run time: the
  // bundler leaves those as dynamic requires when the builtin is external, and
  // the shim it emits looks for a global `require` before giving up with
  // "Dynamic require of \"process\" is not supported".
  //
  // require is synchronous and a module is not, so this cannot import anything.
  // It serves what has already been evaluated instead: each node: shim publishes
  // itself into __nodeRegistry as it loads, and the two below exist from here.
  const registry = (g.__nodeRegistry ??= {});
  registry.process = process;
  registry.buffer = { Buffer, Blob, atob: (x) => Buffer.from(x, 'base64').toString('latin1'), btoa: (x) => Buffer.from(x, 'latin1').toString('base64') };

  if (typeof g.require !== 'function') {
    g.require = (name) => {
      const key = String(name).replace(/^node:/, '');
      const found = registry[key];
      if (found !== undefined) return found;
      throw Object.assign(
        new Error(
          `require('${name}') is not available: this runtime resolves modules through its host. `
          + (key.includes('/') || /^[a-z_]+$/.test(key)
            ? `If '${key}' is a Node builtin, it has to be imported somewhere before a synchronous require can see it.`
            : 'Only Node builtins are requireable.'),
        ),
        { code: 'ERR_MODULE_NOT_FOUND' },
      );
    };
  }

  // --- performance ----------------------------------------------------------

  if (!g.performance) {
    g.performance = {
      now: () => host.process.now(),
      timeOrigin: host.process.epochMs() - host.process.now(),
      mark: () => {}, measure: () => {}, clearMarks: () => {}, clearMeasures: () => {},
      getEntriesByName: () => [], getEntriesByType: () => [],
    };
  }

  // --- crypto ---------------------------------------------------------------

  const webcrypto = {
    randomUUID: () => host.crypto.randomUUID(),
    getRandomValues(view) {
      const bytes = host.crypto.randomBytes(view.byteLength);
      new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(bytes);
      return view;
    },
    subtle: {
      async digest(algorithm, data) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        return host.crypto.hash(name, toBytes(data)).buffer;
      },
    },
  };
  if (!g.crypto) g.crypto = webcrypto;
  g.__webcrypto = webcrypto;

  // --- timers ---------------------------------------------------------------
  // Node's timers return an object with unref/ref, and library code calls
  // .unref() on a keepalive interval. goant returns a number, so the two are
  // reconciled here rather than in every caller.

  const rawSetTimeout = g.setTimeout;
  const rawSetInterval = g.setInterval;
  const rawClearTimeout = g.clearTimeout;
  const rawClearInterval = g.clearInterval;

  const tracing = Boolean(host.timers.tracing);

  function timerHandle(id, clear) {
    let refed = true;
    return {
      id,
      // Node's unref, and it has to be real. Library code arms a watchdog
      // alongside some work and unrefs it, meaning "fire if we are still here,
      // but do not be the reason we are". A no-op version held the loop open
      // for the whole of a five-minute stream timeout after the stream had
      // finished — which looked exactly like a hang.
      unref() { refed = false; host.timers.unref(id); if (tracing) host.timers.trace('unref', 0, id, ''); return this; },
      ref() { refed = true; host.timers.ref(id); if (tracing) host.timers.trace('ref', 0, id, ''); return this; },
      hasRef() { return refed; },
      close() { clear(id); },
      [Symbol.toPrimitive]() { return id; },
    };
  }

  g.setTimeout = (fn, delay, ...args) => {
    const id = rawSetTimeout(fn, delay, ...args);
    if (tracing) host.timers.trace('timeout', Number(delay) || 0, id, Number(delay) >= 1000 ? String(new Error('armed').stack) : '');
    return timerHandle(id, rawClearTimeout);
  };
  g.setInterval = (fn, delay, ...args) => {
    const id = rawSetInterval(fn, delay, ...args);
    if (tracing) host.timers.trace('interval', Number(delay) || 0, id, Number(delay) >= 1000 ? String(new Error('armed').stack) : '');
    return timerHandle(id, rawClearInterval);
  };
  g.clearTimeout = (handle) => {
    const id = handle && typeof handle === 'object' ? handle.id : handle;
    if (tracing) host.timers.trace('clear', 0, Number(id) || 0, '');
    return rawClearTimeout(id);
  };
  g.clearInterval = (handle) => {
    const id = handle && typeof handle === 'object' ? handle.id : handle;
    if (tracing) host.timers.trace('clear', 0, Number(id) || 0, '');
    return rawClearInterval(id);
  };
  g.setImmediate = (fn, ...args) => g.setTimeout(fn, 0, ...args);
  g.clearImmediate = g.clearTimeout;
})(globalThis);
