// node:stream — Readable, Writable, Transform, and the pipeline helpers.
//
// A deliberately small implementation of a very large API. What is here is what
// the code that runs on this runtime uses: push/read with backpressure, the
// async iterator, pipe, and the events (data, end, error, close, finish). What
// is not here is the object-mode/highWaterMark tuning surface, the legacy
// pause/resume state machine in its full detail, and duplex socket semantics —
// none of which have a caller here, and each of which would be a subtle
// half-implementation if included for completeness.

import { EventEmitter } from 'node:events';

export class Stream extends EventEmitter {}

export class Readable extends Stream {
  #buffer = [];
  #ended = false;
  #reading = false;
  #flowing = false;
  #destroyed = false;
  #waiters = [];

  constructor(options = {}) {
    super();
    this.readable = true;
    this._readableState = { objectMode: Boolean(options.objectMode), ended: false };
    if (options.read) this._read = options.read;
    if (options.destroy) this._destroy = options.destroy;
    this.encoding = options.encoding || null;
  }

  _read() {}
  _destroy(err, cb) { cb(err); }

  push(chunk) {
    if (chunk === null) {
      this.#ended = true;
      this.#notify();
      return false;
    }
    this.#buffer.push(chunk);
    this.#notify();
    // The return value is backpressure: false means "stop producing". Sixteen
    // chunks ahead of a consumer is where a producer should wait.
    return this.#buffer.length < 16;
  }

  read() {
    if (this.#buffer.length === 0) {
      this.#pump();
      return null;
    }
    return this.#buffer.shift();
  }

  #pump() {
    if (this.#reading || this.#ended || this.#destroyed) return;
    this.#reading = true;
    try {
      // _read may be async — Readable.from's is — so the push it performs
      // arrives on a later turn. The flag is cleared here rather than after it
      // resolves, because a pull-based reader asks again as soon as it has
      // consumed what arrived.
      this._read(64 * 1024);
    } finally {
      this.#reading = false;
    }
  }

  // #notify wakes whoever is waiting. Which one that is depends on the mode the
  // stream is in, and the two must not both run: flowing mode empties the buffer
  // into 'data' events, so a pull-based reader that also let it flow would find
  // the buffer empty every time it looked. That is the bug this shape avoids.
  #notify() {
    if (this.#flowing) {
      queueMicrotask(() => {
        while (this.#flowing && this.#buffer.length) this.emit('data', this.#buffer.shift());
        if (this.#flowing && this.#ended && !this._readableState.ended) {
          this._readableState.ended = true;
          this.emit('end');
          this.emit('close');
        } else if (this.#flowing && !this.#ended) {
          this.#pump();
        }
      });
      return;
    }
    const waiters = this.#waiters;
    this.#waiters = [];
    for (const resolve of waiters) resolve();
  }

  #wait() {
    return new Promise((resolve, reject) => {
      this.#waiters.push(resolve);
      this.once('error', reject);
      this.#pump();
    });
  }

  on(event, fn) {
    const out = super.on(event, fn);
    if (event === 'data') {
      this.#flowing = true;
      this.#pump();
      this.#notify();
    }
    return out;
  }

  resume() { this.#flowing = true; this.#pump(); this.#notify(); return this; }
  pause() { this.#flowing = false; return this; }
  setEncoding(enc) { this.encoding = enc; return this; }

  destroy(err) {
    if (this.#destroyed) return this;
    this.#destroyed = true;
    this.#ended = true;
    this.#notify();
    this._destroy(err, (e) => {
      if (e) this.emit('error', e);
      this.emit('close');
    });
    return this;
  }

  pipe(destination, options = {}) {
    this.on('data', (chunk) => {
      if (destination.write(chunk) === false) this.pause();
    });
    destination.on('drain', () => this.resume());
    this.on('end', () => { if (options.end !== false) destination.end(); });
    this.on('error', (err) => destination.destroy(err));
    return destination;
  }

  async *[Symbol.asyncIterator]() {
    while (true) {
      if (this.#buffer.length) {
        yield this.#buffer.shift();
        continue;
      }
      if (this.#ended) return;
      await this.#wait();
    }
  }

  static from(iterable) {
    const iterator = iterable[Symbol.asyncIterator]
      ? iterable[Symbol.asyncIterator]()
      : iterable[Symbol.iterator]();
    return new Readable({
      async read() {
        try {
          const { value, done } = await iterator.next();
          this.push(done ? null : value);
        } catch (err) {
          this.destroy(err);
        }
      },
    });
  }
}

export class Writable extends Stream {
  #destroyed = false;
  #ended = false;

  constructor(options = {}) {
    super();
    this.writable = true;
    if (options.write) this._write = options.write;
    if (options.final) this._final = options.final;
    if (options.destroy) this._destroy = options.destroy;
  }

  _write(chunk, encoding, cb) { cb(); }
  _final(cb) { cb(); }
  _destroy(err, cb) { cb(err); }

  write(chunk, encoding, cb) {
    if (typeof encoding === 'function') { cb = encoding; encoding = undefined; }
    if (this.#ended) {
      const err = new Error('write after end');
      if (cb) cb(err); else this.emit('error', err);
      return false;
    }
    this._write(chunk, encoding, (err) => {
      if (err) { this.destroy(err); if (cb) cb(err); return; }
      if (cb) cb(null);
      this.emit('drain');
    });
    return true;
  }

  end(chunk, encoding, cb) {
    if (typeof chunk === 'function') { cb = chunk; chunk = undefined; }
    if (chunk !== undefined && chunk !== null) this.write(chunk, encoding);
    this.#ended = true;
    this._final((err) => {
      if (err) { this.destroy(err); return; }
      this.writable = false;
      this.emit('finish');
      this.emit('close');
      if (cb) cb();
    });
    return this;
  }

  destroy(err) {
    if (this.#destroyed) return this;
    this.#destroyed = true;
    this._destroy(err, (e) => {
      if (e) this.emit('error', e);
      this.emit('close');
    });
    return this;
  }
}

export class Duplex extends Readable {
  constructor(options = {}) {
    super(options);
    const writable = new Writable(options);
    // Composition rather than multiple inheritance, which JavaScript does not
    // have: the writable half is a real Writable and its methods are forwarded.
    this._writable = writable;
    this.write = writable.write.bind(writable);
    this.end = writable.end.bind(writable);
  }
}

export class Transform extends Duplex {
  constructor(options = {}) {
    super(options);
    if (options.transform) this._transform = options.transform;
    if (options.flush) this._flush = options.flush;
    this._writable._write = (chunk, encoding, cb) => {
      try {
        this._transform(chunk, encoding, (err, out) => {
          if (err) return cb(err);
          if (out !== undefined && out !== null) this.push(out);
          cb();
        });
      } catch (err) { cb(err); }
    };
    this._writable._final = (cb) => {
      const done = () => { this.push(null); cb(); };
      try {
        if (this._flush) this._flush((err, out) => {
          if (err) return cb(err);
          if (out !== undefined && out !== null) this.push(out);
          done();
        });
        else done();
      } catch (err) { cb(err); }
    };
  }
  _transform(chunk, encoding, cb) { cb(null, chunk); }
}

export class PassThrough extends Transform {}

export function pipeline(...args) {
  const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
  const [source, ...rest] = args;
  let current = source;
  for (const next of rest) current = current.pipe(next);
  const done = new Promise((resolve, reject) => {
    current.on('finish', resolve);
    current.on('end', resolve);
    current.on('error', reject);
    source.on('error', reject);
  });
  if (cb) {
    done.then(() => cb(null), cb);
    return current;
  }
  return done;
}

export function finished(stream, cb) {
  const done = new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('finish', resolve);
    stream.on('close', resolve);
    stream.on('error', reject);
  });
  if (cb) { done.then(() => cb(null), cb); return; }
  return done;
}

export const promises = { pipeline, finished };

export default {
  Stream, Readable, Writable, Duplex, Transform, PassThrough,
  pipeline, finished, promises,
};
