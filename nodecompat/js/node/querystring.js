// node:querystring — the pre-URLSearchParams API, built on the same host parser
// so the two cannot disagree about encoding.

const host = globalThis.__nodeHost;

export function parse(query) {
  const flat = host.url.parseQuery(String(query || ''));
  const out = Object.create(null);
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const k = flat[i];
    const v = flat[i + 1];
    // A repeated key becomes an array, which is what this API does and what
    // makes it awkward enough that URLSearchParams replaced it.
    if (k in out) out[k] = Array.isArray(out[k]) ? [...out[k], v] : [out[k], v];
    else out[k] = v;
  }
  return out;
}

export function stringify(obj = {}) {
  const pairs = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) for (const item of v) pairs.push(k, String(item));
    else pairs.push(k, String(v));
  }
  return host.url.encodeQuery(pairs);
}

export const escape = encodeURIComponent;
export const unescape = decodeURIComponent;
export const decode = parse;
export const encode = stringify;

export default { parse, stringify, escape, unescape, decode, encode };
