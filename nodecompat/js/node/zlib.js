// node:zlib — one-shot compression in every spelling the API offers.
//
// zstd is the one that matters here: session logs are JSONL compressed with it,
// so this is what lets the runtime read back a session it wrote. The rest come along
// because the standard library has them.

const host = globalThis.__nodeHost;

export const constants = {
  Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1,
  ZSTD_c_compressionLevel: 100,
};

const bytesOf = (data) => (typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data));
const levelOf = (options) => {
  if (typeof options === 'number') return options;
  if (!options) return 0;
  if (typeof options.level === 'number') return options.level;
  const params = options.params;
  if (params && typeof params[constants.ZSTD_c_compressionLevel] === 'number') {
    return params[constants.ZSTD_c_compressionLevel];
  }
  return 0;
};

// Each operation exists three times because the API does: sync, callback and
// (through util.promisify) promise. They are generated from one implementation
// so the three cannot disagree.
function trio(name, fn) {
  const sync = (data, options) => Buffer.from(fn(bytesOf(data), levelOf(options)));
  const async_ = (data, options, cb) => {
    if (typeof options === 'function') { cb = options; options = undefined; }
    queueMicrotask(() => {
      try { cb(null, sync(data, options)); } catch (err) { cb(err); }
    });
  };
  // promisify looks for this symbol before it wraps a callback function, which
  // is how `promisify(gunzip)` gets the direct implementation.
  async_[Symbol.for('nodejs.util.promisify.custom')] = async (data, options) => sync(data, options);
  return { [`${name}Sync`]: sync, [name]: async_ };
}

const zstd = trio('zstdCompress', (b, level) => host.zlib.zstdCompress(b, level));
const unzstd = trio('zstdDecompress', (b) => host.zlib.zstdDecompress(b));
const gz = trio('gzip', (b, level) => host.zlib.gzip(b, level));
const gunz = trio('gunzip', (b) => host.zlib.gunzip(b));
const defl = trio('deflate', (b, level) => host.zlib.deflate(b, level));
const infl = trio('inflate', (b) => host.zlib.inflate(b));
const deflRaw = trio('deflateRaw', (b, level) => host.zlib.deflateRaw(b, level));
const inflRaw = trio('inflateRaw', (b) => host.zlib.inflateRaw(b));

export const zstdCompress = zstd.zstdCompress;
export const zstdCompressSync = zstd.zstdCompressSync;
export const zstdDecompress = unzstd.zstdDecompress;
export const zstdDecompressSync = unzstd.zstdDecompressSync;
export const gzip = gz.gzip;
export const gzipSync = gz.gzipSync;
export const gunzip = gunz.gunzip;
export const gunzipSync = gunz.gunzipSync;
export const deflate = defl.deflate;
export const deflateSync = defl.deflateSync;
export const inflate = infl.inflate;
export const inflateSync = infl.inflateSync;
export const deflateRaw = deflRaw.deflateRaw;
export const deflateRawSync = deflRaw.deflateRawSync;
export const inflateRaw = inflRaw.inflateRaw;
export const inflateRawSync = inflRaw.inflateRawSync;
export const unzip = gunz.gunzip;
export const unzipSync = gunz.gunzipSync;

// The stream constructors are deliberately absent rather than faked: a
// createGzip() that buffered everything and compressed at the end would look
// like a stream and behave like a memory leak.
function noStreams(name) {
  return () => { throw new Error(`zlib.${name} is not available: this runtime compresses in one shot, not as a stream`); };
}
export const createGzip = noStreams('createGzip');
export const createGunzip = noStreams('createGunzip');
export const createDeflate = noStreams('createDeflate');
export const createInflate = noStreams('createInflate');
export const createZstdCompress = noStreams('createZstdCompress');
export const createZstdDecompress = noStreams('createZstdDecompress');

const __ns = {
  constants,
  zstdCompress, zstdCompressSync, zstdDecompress, zstdDecompressSync,
  gzip, gzipSync, gunzip, gunzipSync, deflate, deflateSync, inflate, inflateSync,
  deflateRaw, deflateRawSync, inflateRaw, inflateRawSync, unzip, unzipSync,
  createGzip, createGunzip, createDeflate, createInflate,
  createZstdCompress, createZstdDecompress,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['zlib'] = __ns;
