// node:crypto — hashing, HMAC and randomness over the host primitives.
//
// Only the parts that exist in Go are here. Anything asymmetric — sign, verify,
// createCipheriv, generateKeyPair — throws rather than pretending: a
// cryptographic API that silently does something other than what it says is
// worse than one that is absent.

const host = globalThis.__nodeHost;

class Hash {
  #alg;
  #chunks = [];
  constructor(alg) { this.#alg = alg; }
  update(data, encoding) {
    this.#chunks.push(typeof data === 'string' ? Buffer.from(data, encoding || 'utf8') : Buffer.from(data));
    return this;
  }
  digest(encoding) {
    // Buffered rather than incremental: the host binding is one-shot, and the
    // inputs here are file contents and JSON, not gigabyte streams.
    const out = host.crypto.hash(this.#alg, Buffer.concat(this.#chunks));
    const buf = Buffer.from(out);
    return encoding ? buf.toString(encoding) : buf;
  }
  copy() {
    const h = new Hash(this.#alg);
    h.update(Buffer.concat(this.#chunks));
    return h;
  }
}

class Hmac {
  #alg; #key; #chunks = [];
  constructor(alg, key) {
    this.#alg = alg;
    this.#key = typeof key === 'string' ? Buffer.from(key, 'utf8') : Buffer.from(key);
  }
  update(data, encoding) {
    this.#chunks.push(typeof data === 'string' ? Buffer.from(data, encoding || 'utf8') : Buffer.from(data));
    return this;
  }
  digest(encoding) {
    const out = host.crypto.hmac(this.#alg, this.#key, Buffer.concat(this.#chunks));
    const buf = Buffer.from(out);
    return encoding ? buf.toString(encoding) : buf;
  }
}

export const createHash = (alg) => new Hash(alg);
export const createHmac = (alg, key) => new Hmac(alg, key);
export const randomBytes = (n, cb) => {
  const bytes = Buffer.from(host.crypto.randomBytes(n));
  if (cb) { queueMicrotask(() => cb(null, bytes)); return undefined; }
  return bytes;
};
export const randomUUID = () => host.crypto.randomUUID();
export const randomInt = (min, max) => {
  if (max === undefined) { max = min; min = 0; }
  const range = max - min;
  // Rejection sampling, so the result is uniform rather than biased towards the
  // low end the way a plain modulo is.
  const bytes = 6;
  const limit = 2 ** (8 * bytes);
  const cutoff = limit - (limit % range);
  for (;;) {
    let n = 0;
    for (const b of host.crypto.randomBytes(bytes)) n = n * 256 + b;
    if (n < cutoff) return min + (n % range);
  }
};
export const getRandomValues = (view) => globalThis.__webcrypto.getRandomValues(view);
export const timingSafeEqual = (a, b) => host.crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const webcrypto = globalThis.__webcrypto;
export const getHashes = () => host.crypto.algorithms;
export const constants = {};

function unsupported(name) {
  return () => {
    throw Object.assign(
      new Error(`crypto.${name} is not available in this runtime`),
      { code: 'ERR_CRYPTO_OPERATION_UNSUPPORTED' },
    );
  };
}

export const createCipheriv = unsupported('createCipheriv');
export const createDecipheriv = unsupported('createDecipheriv');
export const createSign = unsupported('createSign');
export const createVerify = unsupported('createVerify');
export const generateKeyPairSync = unsupported('generateKeyPairSync');
export const publicEncrypt = unsupported('publicEncrypt');
export const privateDecrypt = unsupported('privateDecrypt');
export const scryptSync = unsupported('scryptSync');
export const pbkdf2Sync = unsupported('pbkdf2Sync');

const __ns = {
  createHash, createHmac, randomBytes, randomUUID, randomInt, getRandomValues,
  timingSafeEqual, webcrypto, getHashes, constants,
  createCipheriv, createDecipheriv, createSign, createVerify,
  generateKeyPairSync, publicEncrypt, privateDecrypt, scryptSync, pbkdf2Sync,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['crypto'] = __ns;
