// node:url — URL and URLSearchParams are globals (the prelude installs them);
// this module adds the Node-only helpers that surround them.

const host = globalThis.__nodeHost;

export const URL = globalThis.URL;
export const URLSearchParams = globalThis.URLSearchParams;

export const fileURLToPath = (url) => host.url.fileToPath(typeof url === 'string' ? url : url.href);
export const pathToFileURL = (path) => new URL(host.url.pathToFile(String(path)));
export const format = (url) => (typeof url === 'string' ? url : url.href);
export const parse = (input) => new URL(input);
export const resolve = (from, to) => new URL(to, from).href;
export const domainToASCII = (domain) => String(domain).toLowerCase();
export const domainToUnicode = (domain) => String(domain);

const __ns = {
  URL, URLSearchParams, fileURLToPath, pathToFileURL, format, parse, resolve,
  domainToASCII, domainToUnicode,
};
export default __ns;

// Registered for CommonJS interop. A bundled CommonJS package may `require` a
// builtin at run time — esbuild leaves those as dynamic requires when the
// builtin is external — and require is synchronous, so it cannot import this
// module itself. Evaluating this file publishes it instead; see the require
// shim in prelude.js.
(globalThis.__nodeRegistry ??= {})['url'] = __ns;
