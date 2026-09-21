var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/tslib.mjs
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
var init_tslib = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/tslib.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/uuid.mjs
var uuid4;
var init_uuid = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/uuid.mjs"() {
    uuid4 = function() {
      const { crypto: crypto3 } = globalThis;
      if (crypto3?.randomUUID) {
        uuid4 = crypto3.randomUUID.bind(crypto3);
        return crypto3.randomUUID();
      }
      const u8 = new Uint8Array(1);
      const randomByte = crypto3 ? () => crypto3.getRandomValues(u8)[0] : () => Math.random() * 255 & 255;
      return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ randomByte() & 15 >> +c / 4).toString(16));
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/errors.mjs
function isAbortError(err) {
  return typeof err === "object" && err !== null && // Spec-compliant fetch implementations
  ("name" in err && err.name === "AbortError" || // Expo fetch
  "message" in err && String(err.message).includes("FetchRequestCanceledException"));
}
var castToError;
var init_errors = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/errors.mjs"() {
    castToError = (err) => {
      if (err instanceof Error)
        return err;
      if (typeof err === "object" && err !== null) {
        try {
          const tag = Object.prototype.toString.call(err);
          if (tag === "[object Error]" || tag === "[object DOMException]") {
            const error = new Error(err.message, err.cause ? { cause: err.cause } : {});
            if (err.stack)
              error.stack = err.stack;
            if (err.cause && !error.cause)
              error.cause = err.cause;
            if (err.name)
              error.name = err.name;
            return error;
          }
        } catch {
        }
        try {
          return new Error(JSON.stringify(err));
        } catch {
        }
      }
      return new Error(err);
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/error.mjs
var AnthropicError, APIError, APIUserAbortError, APIConnectionError, APIConnectionTimeoutError, RetryableError, BadRequestError, AuthenticationError, PermissionDeniedError, NotFoundError, ConflictError, UnprocessableEntityError, RateLimitError, InternalServerError;
var init_error = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/error.mjs"() {
    init_errors();
    AnthropicError = class extends Error {
    };
    APIError = class _APIError extends AnthropicError {
      constructor(status, error, message, headers, type) {
        super(`${_APIError.makeMessage(status, error, message)}`);
        this.status = status;
        this.headers = headers;
        this.requestID = headers?.get("request-id");
        this.workspaceID = headers?.get("anthropic-workspace-id");
        this.error = error;
        this.type = type ?? null;
      }
      static makeMessage(status, error, message) {
        const msg = error?.message ? typeof error.message === "string" ? error.message : JSON.stringify(error.message) : error ? JSON.stringify(error) : message;
        if (status && msg) {
          return `${status} ${msg}`;
        }
        if (status) {
          return `${status} status code (no body)`;
        }
        if (msg) {
          return msg;
        }
        return "(no status code or body)";
      }
      static generate(status, errorResponse, message, headers) {
        if (!status || !headers) {
          return new APIConnectionError({ message, cause: castToError(errorResponse) });
        }
        const error = errorResponse;
        const type = error?.["error"]?.["type"];
        if (status === 400) {
          return new BadRequestError(status, error, message, headers, type);
        }
        if (status === 401) {
          return new AuthenticationError(status, error, message, headers, type);
        }
        if (status === 403) {
          return new PermissionDeniedError(status, error, message, headers, type);
        }
        if (status === 404) {
          return new NotFoundError(status, error, message, headers, type);
        }
        if (status === 409) {
          return new ConflictError(status, error, message, headers, type);
        }
        if (status === 422) {
          return new UnprocessableEntityError(status, error, message, headers, type);
        }
        if (status === 429) {
          return new RateLimitError(status, error, message, headers, type);
        }
        if (status >= 500) {
          return new InternalServerError(status, error, message, headers, type);
        }
        return new _APIError(status, error, message, headers, type);
      }
    };
    APIUserAbortError = class extends APIError {
      constructor({ message } = {}) {
        super(void 0, void 0, message || "Request was aborted.", void 0);
      }
    };
    APIConnectionError = class extends APIError {
      constructor({ message, cause }) {
        super(void 0, void 0, message || "Connection error.", void 0);
        if (cause)
          this.cause = cause;
      }
    };
    APIConnectionTimeoutError = class extends APIConnectionError {
      constructor({ message } = {}) {
        super({ message: message ?? "Request timed out." });
      }
    };
    RetryableError = class extends AnthropicError {
      constructor(message, { cause } = {}) {
        super(message ?? "Retryable error.");
        if (cause !== void 0)
          this.cause = cause;
      }
    };
    BadRequestError = class extends APIError {
    };
    AuthenticationError = class extends APIError {
    };
    PermissionDeniedError = class extends APIError {
    };
    NotFoundError = class extends APIError {
    };
    ConflictError = class extends APIError {
    };
    UnprocessableEntityError = class extends APIError {
    };
    RateLimitError = class extends APIError {
    };
    InternalServerError = class extends APIError {
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/values.mjs
function maybeObj(x) {
  if (typeof x !== "object") {
    return {};
  }
  return x ?? {};
}
function isEmptyObj(obj) {
  if (!obj)
    return true;
  for (const _k in obj)
    return false;
  return true;
}
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function isObj(obj) {
  return obj != null && typeof obj === "object" && !Array.isArray(obj);
}
function checkNever(_value) {
}
var startsWithSchemeRegexp, isAbsoluteURL, isArray, isReadonlyArray, validatePositiveInteger, safeJSON;
var init_values = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/values.mjs"() {
    init_error();
    startsWithSchemeRegexp = /^[a-z][a-z0-9+.-]*:/i;
    isAbsoluteURL = (url) => {
      return startsWithSchemeRegexp.test(url);
    };
    isArray = (val) => (isArray = Array.isArray, isArray(val));
    isReadonlyArray = isArray;
    validatePositiveInteger = (name, n) => {
      if (typeof n !== "number" || !Number.isInteger(n)) {
        throw new AnthropicError(`${name} must be an integer`);
      }
      if (n < 0) {
        throw new AnthropicError(`${name} must be a positive integer`);
      }
      return n;
    };
    safeJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch (err) {
        return void 0;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/sleep.mjs
var sleep;
var init_sleep = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/sleep.mjs"() {
    sleep = (ms, signal) => new Promise((resolve2) => {
      if (signal?.aborted)
        return resolve2();
      const onAbort = () => {
        clearTimeout(timer);
        resolve2();
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve2();
      }, ms);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/version.mjs
var VERSION;
var init_version = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/version.mjs"() {
    VERSION = "0.123.0";
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/detect-platform.mjs
function getDetectedPlatform() {
  if (typeof Deno !== "undefined" && Deno.build != null) {
    return "deno";
  }
  if (typeof EdgeRuntime !== "undefined") {
    return "edge";
  }
  if (Object.prototype.toString.call(typeof globalThis.process !== "undefined" ? globalThis.process : 0) === "[object process]") {
    return "node";
  }
  return "unknown";
}
function getBrowserInfo() {
  if (typeof navigator === "undefined" || !navigator) {
    return null;
  }
  const browserPatterns = [
    { key: "edge", pattern: /Edge(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /MSIE(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "ie", pattern: /Trident(?:.*rv\:(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "chrome", pattern: /Chrome(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "firefox", pattern: /Firefox(?:\W+(\d+)\.(\d+)(?:\.(\d+))?)?/ },
    { key: "safari", pattern: /(?:Version\W+(\d+)\.(\d+)(?:\.(\d+))?)?(?:\W+Mobile\S*)?\W+Safari/ }
  ];
  for (const { key, pattern } of browserPatterns) {
    const match = pattern.exec(navigator.userAgent);
    if (match) {
      const major = match[1] || 0;
      const minor = match[2] || 0;
      const patch = match[3] || 0;
      return { browser: key, version: `${major}.${minor}.${patch}` };
    }
  }
  return null;
}
var isRunningInBrowser, getPlatformProperties, normalizeArch, normalizePlatform, _platformHeaders, getPlatformHeaders;
var init_detect_platform = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/detect-platform.mjs"() {
    init_version();
    isRunningInBrowser = () => {
      return (
        // @ts-ignore
        typeof window !== "undefined" && // @ts-ignore
        typeof window.document !== "undefined" && // @ts-ignore
        typeof navigator !== "undefined"
      );
    };
    getPlatformProperties = () => {
      const detectedPlatform = getDetectedPlatform();
      if (detectedPlatform === "deno") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(Deno.build.os),
          "X-Stainless-Arch": normalizeArch(Deno.build.arch),
          "X-Stainless-Runtime": "deno",
          "X-Stainless-Runtime-Version": typeof Deno.version === "string" ? Deno.version : Deno.version?.deno ?? "unknown"
        };
      }
      if (typeof EdgeRuntime !== "undefined") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": `other:${EdgeRuntime}`,
          "X-Stainless-Runtime": "edge",
          "X-Stainless-Runtime-Version": globalThis.process?.version ?? "unknown"
        };
      }
      if (detectedPlatform === "node") {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": normalizePlatform(globalThis.process.platform ?? "unknown"),
          "X-Stainless-Arch": normalizeArch(globalThis.process.arch ?? "unknown"),
          "X-Stainless-Runtime": "node",
          "X-Stainless-Runtime-Version": globalThis.process.version ?? "unknown"
        };
      }
      const browserInfo = getBrowserInfo();
      if (browserInfo) {
        return {
          "X-Stainless-Lang": "js",
          "X-Stainless-Package-Version": VERSION,
          "X-Stainless-OS": "Unknown",
          "X-Stainless-Arch": "unknown",
          "X-Stainless-Runtime": `browser:${browserInfo.browser}`,
          "X-Stainless-Runtime-Version": browserInfo.version
        };
      }
      return {
        "X-Stainless-Lang": "js",
        "X-Stainless-Package-Version": VERSION,
        "X-Stainless-OS": "Unknown",
        "X-Stainless-Arch": "unknown",
        "X-Stainless-Runtime": "unknown",
        "X-Stainless-Runtime-Version": "unknown"
      };
    };
    normalizeArch = (arch) => {
      if (arch === "x32")
        return "x32";
      if (arch === "x86_64" || arch === "x64")
        return "x64";
      if (arch === "arm")
        return "arm";
      if (arch === "aarch64" || arch === "arm64")
        return "arm64";
      if (arch)
        return `other:${arch}`;
      return "unknown";
    };
    normalizePlatform = (platform) => {
      platform = platform.toLowerCase();
      if (platform.includes("ios"))
        return "iOS";
      if (platform === "android")
        return "Android";
      if (platform === "darwin")
        return "MacOS";
      if (platform === "win32")
        return "Windows";
      if (platform === "freebsd")
        return "FreeBSD";
      if (platform === "openbsd")
        return "OpenBSD";
      if (platform === "linux")
        return "Linux";
      if (platform)
        return `Other:${platform}`;
      return "Unknown";
    };
    getPlatformHeaders = () => {
      return _platformHeaders ?? (_platformHeaders = getPlatformProperties());
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/request-signal.mjs
function makeCleanup(signal, listener) {
  return () => signal.removeEventListener("abort", listener);
}
function registerRequestSignalCleanup(controller, signal, listener) {
  cleanups.set(controller, makeCleanup(signal, listener));
}
function armAbandonmentBackstop(body, controller) {
  if (cleanups.has(controller))
    registry?.register(body, controller, controller);
}
function releaseRequestSignal(controller) {
  const cleanup = cleanups.get(controller);
  if (cleanup) {
    cleanups.delete(controller);
    registry?.unregister(controller);
    cleanup();
  }
}
var cleanups, registry;
var init_request_signal = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/request-signal.mjs"() {
    cleanups = /* @__PURE__ */ new WeakMap();
    registry = typeof globalThis.FinalizationRegistry === "function" ? new globalThis.FinalizationRegistry((controller) => releaseRequestSignal(controller)) : null;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/shims.mjs
function getDefaultFetch() {
  if (typeof fetch !== "undefined") {
    return fetch;
  }
  throw new Error("`fetch` is not defined as a global; Either pass `fetch` to the client, `new Anthropic({ fetch })` or polyfill the global, `globalThis.fetch = fetch`");
}
function makeReadableStream(...args) {
  const ReadableStream2 = globalThis.ReadableStream;
  if (typeof ReadableStream2 === "undefined") {
    throw new Error("`ReadableStream` is not defined as a global; You will need to polyfill it, `globalThis.ReadableStream = ReadableStream`");
  }
  return new ReadableStream2(...args);
}
function ReadableStreamFrom(iterable) {
  let iter = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
  return makeReadableStream({
    start() {
    },
    async pull(controller) {
      const { done, value } = await iter.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    async cancel() {
      await iter.return?.();
    }
  });
}
function ReadableStreamToAsyncIterable(stream2) {
  if (stream2[Symbol.asyncIterator])
    return stream2;
  const reader = stream2.getReader();
  return {
    async next() {
      try {
        const result = await reader.read();
        if (result?.done)
          reader.releaseLock();
        return result;
      } catch (e) {
        reader.releaseLock();
        throw e;
      }
    },
    async return() {
      const cancelPromise = reader.cancel();
      reader.releaseLock();
      await cancelPromise;
      return { done: true, value: void 0 };
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function CancelReadableStream(stream2) {
  if (stream2 === null || typeof stream2 !== "object")
    return;
  if (stream2[Symbol.asyncIterator]) {
    await stream2[Symbol.asyncIterator]().return?.();
    return;
  }
  const reader = stream2.getReader();
  const cancelPromise = reader.cancel();
  reader.releaseLock();
  await cancelPromise;
}
var init_shims = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/shims.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/request-options.mjs
var BetaFallbackState, FallbackEncoder;
var init_request_options = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/request-options.mjs"() {
    BetaFallbackState = class {
    };
    FallbackEncoder = ({ headers, body }) => {
      return {
        bodyHeaders: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      };
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/formats.mjs
var default_format, default_formatter, formatters, RFC1738;
var init_formats = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/formats.mjs"() {
    default_format = "RFC3986";
    default_formatter = (v) => String(v);
    formatters = {
      RFC1738: (v) => String(v).replace(/%20/g, "+"),
      RFC3986: default_formatter
    };
    RFC1738 = "RFC1738";
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/utils.mjs
function is_buffer(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
}
function maybe_map(val, fn) {
  if (isArray(val)) {
    const mapped = [];
    for (let i = 0; i < val.length; i += 1) {
      mapped.push(fn(val[i]));
    }
    return mapped;
  }
  return fn(val);
}
var has, hex_table, limit, encode;
var init_utils = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/utils.mjs"() {
    init_formats();
    init_values();
    has = (obj, key) => (has = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty), has(obj, key));
    hex_table = /* @__PURE__ */ (() => {
      const array = [];
      for (let i = 0; i < 256; ++i) {
        array.push("%" + ((i < 16 ? "0" : "") + i.toString(16)).toUpperCase());
      }
      return array;
    })();
    limit = 1024;
    encode = (str, _defaultEncoder, charset, _kind, format) => {
      if (str.length === 0) {
        return str;
      }
      let string = str;
      if (typeof str === "symbol") {
        string = Symbol.prototype.toString.call(str);
      } else if (typeof str !== "string") {
        string = String(str);
      }
      if (charset === "iso-8859-1") {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function($0) {
          return "%26%23" + parseInt($0.slice(2), 16) + "%3B";
        });
      }
      let out = "";
      for (let j = 0; j < string.length; j += limit) {
        const segment = string.length >= limit ? string.slice(j, j + limit) : string;
        const arr = [];
        for (let i = 0; i < segment.length; ++i) {
          let c = segment.charCodeAt(i);
          if (c === 45 || // -
          c === 46 || // .
          c === 95 || // _
          c === 126 || // ~
          c >= 48 && c <= 57 || // 0-9
          c >= 65 && c <= 90 || // a-z
          c >= 97 && c <= 122 || // A-Z
          format === RFC1738 && (c === 40 || c === 41)) {
            arr[arr.length] = segment.charAt(i);
            continue;
          }
          if (c < 128) {
            arr[arr.length] = hex_table[c];
            continue;
          }
          if (c < 2048) {
            arr[arr.length] = hex_table[192 | c >> 6] + hex_table[128 | c & 63];
            continue;
          }
          if (c < 55296 || c >= 57344) {
            arr[arr.length] = hex_table[224 | c >> 12] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
            continue;
          }
          i += 1;
          c = 65536 + ((c & 1023) << 10 | segment.charCodeAt(i) & 1023);
          arr[arr.length] = hex_table[240 | c >> 18] + hex_table[128 | c >> 12 & 63] + hex_table[128 | c >> 6 & 63] + hex_table[128 | c & 63];
        }
        out += arr.join("");
      }
      return out;
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/stringify.mjs
function is_non_nullish_primitive(v) {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean" || typeof v === "symbol" || typeof v === "bigint";
}
function inner_stringify(object, prefix, generateArrayPrefix, commaRoundTrip, allowEmptyArrays, strictNullHandling, skipNulls, encodeDotInKeys, encoder2, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset, sideChannel) {
  let obj = object;
  let tmp_sc = sideChannel;
  let step = 0;
  let find_flag = false;
  while ((tmp_sc = tmp_sc.get(sentinel)) !== void 0 && !find_flag) {
    const pos = tmp_sc.get(object);
    step += 1;
    if (typeof pos !== "undefined") {
      if (pos === step) {
        throw new RangeError("Cyclic object value");
      } else {
        find_flag = true;
      }
    }
    if (typeof tmp_sc.get(sentinel) === "undefined") {
      step = 0;
    }
  }
  if (typeof filter === "function") {
    obj = filter(prefix, obj);
  } else if (obj instanceof Date) {
    obj = serializeDate?.(obj);
  } else if (generateArrayPrefix === "comma" && isArray(obj)) {
    obj = maybe_map(obj, function(value) {
      if (value instanceof Date) {
        return serializeDate?.(value);
      }
      return value;
    });
  }
  if (obj === null) {
    if (strictNullHandling) {
      return encoder2 && !encodeValuesOnly ? (
        // @ts-expect-error
        encoder2(prefix, defaults.encoder, charset, "key", format)
      ) : prefix;
    }
    obj = "";
  }
  if (is_non_nullish_primitive(obj) || is_buffer(obj)) {
    if (encoder2) {
      const key_value = encodeValuesOnly ? prefix : encoder2(prefix, defaults.encoder, charset, "key", format);
      return [
        formatter?.(key_value) + "=" + // @ts-expect-error
        formatter?.(encoder2(obj, defaults.encoder, charset, "value", format))
      ];
    }
    return [formatter?.(prefix) + "=" + formatter?.(String(obj))];
  }
  const values = [];
  if (typeof obj === "undefined") {
    return values;
  }
  let obj_keys;
  if (generateArrayPrefix === "comma" && isArray(obj)) {
    if (encodeValuesOnly && encoder2) {
      obj = maybe_map(obj, encoder2);
    }
    obj_keys = [{ value: obj.length > 0 ? obj.join(",") || null : void 0 }];
  } else if (isArray(filter)) {
    obj_keys = filter;
  } else {
    const keys = Object.keys(obj);
    obj_keys = sort ? keys.sort(sort) : keys;
  }
  const encoded_prefix = encodeDotInKeys ? String(prefix).replace(/\./g, "%2E") : String(prefix);
  const adjusted_prefix = commaRoundTrip && isArray(obj) && obj.length === 1 ? encoded_prefix + "[]" : encoded_prefix;
  if (allowEmptyArrays && isArray(obj) && obj.length === 0) {
    return adjusted_prefix + "[]";
  }
  for (let j = 0; j < obj_keys.length; ++j) {
    const key = obj_keys[j];
    const value = (
      // @ts-ignore
      typeof key === "object" && typeof key.value !== "undefined" ? key.value : obj[key]
    );
    if (skipNulls && value === null) {
      continue;
    }
    const encoded_key = allowDots && encodeDotInKeys ? key.replace(/\./g, "%2E") : key;
    const key_prefix = isArray(obj) ? typeof generateArrayPrefix === "function" ? generateArrayPrefix(adjusted_prefix, encoded_key) : adjusted_prefix : adjusted_prefix + (allowDots ? "." + encoded_key : "[" + encoded_key + "]");
    sideChannel.set(object, step);
    const valueSideChannel = /* @__PURE__ */ new WeakMap();
    valueSideChannel.set(sentinel, sideChannel);
    push_to_array(values, inner_stringify(
      value,
      key_prefix,
      generateArrayPrefix,
      commaRoundTrip,
      allowEmptyArrays,
      strictNullHandling,
      skipNulls,
      encodeDotInKeys,
      // @ts-ignore
      generateArrayPrefix === "comma" && encodeValuesOnly && isArray(obj) ? null : encoder2,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      valueSideChannel
    ));
  }
  return values;
}
function normalize_stringify_options(opts = defaults) {
  if (typeof opts.allowEmptyArrays !== "undefined" && typeof opts.allowEmptyArrays !== "boolean") {
    throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
  }
  if (typeof opts.encodeDotInKeys !== "undefined" && typeof opts.encodeDotInKeys !== "boolean") {
    throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
  }
  if (opts.encoder !== null && typeof opts.encoder !== "undefined" && typeof opts.encoder !== "function") {
    throw new TypeError("Encoder has to be a function.");
  }
  const charset = opts.charset || defaults.charset;
  if (typeof opts.charset !== "undefined" && opts.charset !== "utf-8" && opts.charset !== "iso-8859-1") {
    throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
  }
  let format = default_format;
  if (typeof opts.format !== "undefined") {
    if (!has(formatters, opts.format)) {
      throw new TypeError("Unknown format option provided.");
    }
    format = opts.format;
  }
  const formatter = formatters[format];
  let filter = defaults.filter;
  if (typeof opts.filter === "function" || isArray(opts.filter)) {
    filter = opts.filter;
  }
  let arrayFormat;
  if (opts.arrayFormat && opts.arrayFormat in array_prefix_generators) {
    arrayFormat = opts.arrayFormat;
  } else if ("indices" in opts) {
    arrayFormat = opts.indices ? "indices" : "repeat";
  } else {
    arrayFormat = defaults.arrayFormat;
  }
  if ("commaRoundTrip" in opts && typeof opts.commaRoundTrip !== "boolean") {
    throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
  }
  const allowDots = typeof opts.allowDots === "undefined" ? !!opts.encodeDotInKeys === true ? true : defaults.allowDots : !!opts.allowDots;
  return {
    addQueryPrefix: typeof opts.addQueryPrefix === "boolean" ? opts.addQueryPrefix : defaults.addQueryPrefix,
    // @ts-ignore
    allowDots,
    allowEmptyArrays: typeof opts.allowEmptyArrays === "boolean" ? !!opts.allowEmptyArrays : defaults.allowEmptyArrays,
    arrayFormat,
    charset,
    charsetSentinel: typeof opts.charsetSentinel === "boolean" ? opts.charsetSentinel : defaults.charsetSentinel,
    commaRoundTrip: !!opts.commaRoundTrip,
    delimiter: typeof opts.delimiter === "undefined" ? defaults.delimiter : opts.delimiter,
    encode: typeof opts.encode === "boolean" ? opts.encode : defaults.encode,
    encodeDotInKeys: typeof opts.encodeDotInKeys === "boolean" ? opts.encodeDotInKeys : defaults.encodeDotInKeys,
    encoder: typeof opts.encoder === "function" ? opts.encoder : defaults.encoder,
    encodeValuesOnly: typeof opts.encodeValuesOnly === "boolean" ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
    filter,
    format,
    formatter,
    serializeDate: typeof opts.serializeDate === "function" ? opts.serializeDate : defaults.serializeDate,
    skipNulls: typeof opts.skipNulls === "boolean" ? opts.skipNulls : defaults.skipNulls,
    // @ts-ignore
    sort: typeof opts.sort === "function" ? opts.sort : null,
    strictNullHandling: typeof opts.strictNullHandling === "boolean" ? opts.strictNullHandling : defaults.strictNullHandling
  };
}
function stringify(object, opts = {}) {
  let obj = object;
  const options = normalize_stringify_options(opts);
  let obj_keys;
  let filter;
  if (typeof options.filter === "function") {
    filter = options.filter;
    obj = filter("", obj);
  } else if (isArray(options.filter)) {
    filter = options.filter;
    obj_keys = filter;
  }
  const keys = [];
  if (typeof obj !== "object" || obj === null) {
    return "";
  }
  const generateArrayPrefix = array_prefix_generators[options.arrayFormat];
  const commaRoundTrip = generateArrayPrefix === "comma" && options.commaRoundTrip;
  if (!obj_keys) {
    obj_keys = Object.keys(obj);
  }
  if (options.sort) {
    obj_keys.sort(options.sort);
  }
  const sideChannel = /* @__PURE__ */ new WeakMap();
  for (let i = 0; i < obj_keys.length; ++i) {
    const key = obj_keys[i];
    if (options.skipNulls && obj[key] === null) {
      continue;
    }
    push_to_array(keys, inner_stringify(
      obj[key],
      key,
      // @ts-expect-error
      generateArrayPrefix,
      commaRoundTrip,
      options.allowEmptyArrays,
      options.strictNullHandling,
      options.skipNulls,
      options.encodeDotInKeys,
      options.encode ? options.encoder : null,
      options.filter,
      options.sort,
      options.allowDots,
      options.serializeDate,
      options.format,
      options.formatter,
      options.encodeValuesOnly,
      options.charset,
      sideChannel
    ));
  }
  const joined = keys.join(options.delimiter);
  let prefix = options.addQueryPrefix === true ? "?" : "";
  if (options.charsetSentinel) {
    if (options.charset === "iso-8859-1") {
      prefix += "utf8=%26%2310003%3B&";
    } else {
      prefix += "utf8=%E2%9C%93&";
    }
  }
  return joined.length > 0 ? prefix + joined : "";
}
var array_prefix_generators, push_to_array, toISOString, defaults, sentinel;
var init_stringify = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/qs/stringify.mjs"() {
    init_utils();
    init_formats();
    init_values();
    array_prefix_generators = {
      brackets(prefix) {
        return String(prefix) + "[]";
      },
      comma: "comma",
      indices(prefix, key) {
        return String(prefix) + "[" + key + "]";
      },
      repeat(prefix) {
        return String(prefix);
      }
    };
    push_to_array = function(arr, value_or_array) {
      Array.prototype.push.apply(arr, isArray(value_or_array) ? value_or_array : [value_or_array]);
    };
    defaults = {
      addQueryPrefix: false,
      allowDots: false,
      allowEmptyArrays: false,
      arrayFormat: "indices",
      charset: "utf-8",
      charsetSentinel: false,
      delimiter: "&",
      encode: true,
      encodeDotInKeys: false,
      encoder: encode,
      encodeValuesOnly: false,
      format: default_format,
      formatter: default_formatter,
      /** @deprecated */
      indices: false,
      serializeDate(date) {
        return (toISOString ?? (toISOString = Function.prototype.call.bind(Date.prototype.toISOString)))(date);
      },
      skipNulls: false,
      strictNullHandling: false
    };
    sentinel = {};
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/query.mjs
function stringifyQuery(query) {
  return stringify(query, { arrayFormat: "brackets" });
}
var init_query = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/query.mjs"() {
    init_stringify();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/node.mjs
var node_exports = {};
__export(node_exports, {
  child_process: () => child_process,
  crypto: () => crypto,
  fs: () => fs,
  os: () => os,
  path: () => path,
  stream: () => stream,
  util: () => util
});
import * as child_process from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as stream from "node:stream";
import * as util from "node:util";
var init_node = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/node.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/types.mjs
function requireSecureTokenEndpoint(baseURL) {
  if (!baseURL)
    return;
  let u;
  try {
    u = new URL(baseURL);
  } catch (err) {
    throw new WorkloadIdentityError(`Invalid token endpoint base URL "${baseURL}": ${err}`);
  }
  if (u.protocol === "https:")
    return;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (u.protocol === "http:" && (host === "localhost" || host === "127.0.0.1" || host === "::1")) {
    return;
  }
  throw new WorkloadIdentityError(`Refusing to send credential over non-https token endpoint "${baseURL}"`);
}
async function parseTokenResponse(resp, requestId) {
  const text = await readLimitedText(resp);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new WorkloadIdentityError(`Token endpoint returned non-JSON response (status ${resp.status})`, resp.status, redactSensitive(text), requestId);
  }
  if (!data.access_token) {
    throw new WorkloadIdentityError(`Token endpoint response missing access_token: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
  }
  if (data.token_type && data.token_type.toLowerCase() !== "bearer") {
    throw new WorkloadIdentityError(`Token endpoint response: unsupported token_type "${data.token_type}" (want Bearer)`, resp.status, redactSensitive(data), requestId);
  }
  return data;
}
function redactSensitive(body) {
  if (body == null)
    return body;
  if (typeof body === "string") {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      if (body.length <= MAX_ERROR_BODY_CHARS)
        return body;
      return body.slice(0, MAX_ERROR_BODY_CHARS) + `... <${body.length - MAX_ERROR_BODY_CHARS} more chars>`;
    }
    return JSON.stringify(redactSensitive(parsed));
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    const out = {};
    for (const [k, v] of Object.entries(body)) {
      if (SAFE_ERROR_KEYS.has(k))
        out[k] = v;
    }
    return out;
  }
  return null;
}
async function checkCredentialsFileSafety(path4, onWarn = (m) => console.warn(`anthropic-sdk: ${m}`)) {
  if (typeof process === "undefined" || process.platform === "win32")
    return;
  const { fs: fs5 } = await Promise.resolve().then(() => (init_node(), node_exports));
  let resolved = path4;
  let st;
  try {
    resolved = await fs5.promises.realpath(path4);
    st = await fs5.promises.stat(resolved);
  } catch {
    return;
  }
  const mode = st.mode & 511;
  if (mode & 18) {
    throw new WorkloadIdentityError(`Credentials file at ${resolved} is group/world-writable (mode 0o${mode.toString(8)}); this allows other local users to plant tokens. Run \`chmod 600 ${resolved}\`.`);
  }
  if (mode & 36) {
    throw new WorkloadIdentityError(`Credentials file at ${resolved} is group/world-readable (mode 0o${mode.toString(8)}); run \`chmod 600 ${resolved}\` before retrying.`);
  }
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) {
    onWarn(`credentials file at ${resolved} is owned by uid ${st.uid} (current process uid ${process.getuid()}); verify this is intentional.`);
  }
}
async function writeCredentialsFileAtomic(targetPath, data) {
  const { fs: fs5, path: path4 } = await Promise.resolve().then(() => (init_node(), node_exports));
  const dir = path4.dirname(targetPath);
  await fs5.promises.mkdir(dir, { recursive: true, mode: 448 });
  const tmpPath = `${targetPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const fh = await fs5.promises.open(tmpPath, "w", 384);
    try {
      await fh.writeFile(JSON.stringify(data, null, 2));
      await fh.sync();
    } finally {
      await fh.close();
    }
    await fs5.promises.rename(tmpPath, targetPath);
  } catch (err) {
    await fs5.promises.unlink(tmpPath).catch(() => {
    });
    throw err;
  }
  try {
    const dirFh = await fs5.promises.open(dir, "r");
    try {
      await dirFh.sync();
    } finally {
      await dirFh.close();
    }
  } catch {
  }
}
async function readLimitedText(resp) {
  if (!resp.body) {
    return "";
  }
  const reader = resp.body.getReader();
  const chunks = [];
  let received = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done)
      break;
    if (received + value.length > MAX_TOKEN_RESPONSE_BYTES) {
      const remaining = MAX_TOKEN_RESPONSE_BYTES - received;
      if (remaining > 0)
        chunks.push(value.subarray(0, remaining));
      await reader.cancel();
      break;
    }
    chunks.push(value);
    received += value.length;
  }
  let merged;
  if (chunks.length === 1) {
    merged = chunks[0];
  } else {
    merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
  }
  return new TextDecoder("utf-8").decode(merged);
}
var GRANT_TYPE_JWT_BEARER, GRANT_TYPE_REFRESH_TOKEN, TOKEN_ENDPOINT, OAUTH_API_BETA_HEADER, FEDERATION_BETA_HEADER, ADVISORY_REFRESH_THRESHOLD_IN_SECONDS, MANDATORY_REFRESH_THRESHOLD_IN_SECONDS, ADVISORY_REFRESH_BACKOFF_IN_SECONDS, MAX_TOKEN_RESPONSE_BYTES, MAX_ERROR_BODY_CHARS, SAFE_ERROR_KEYS, WorkloadIdentityError;
var init_types = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/types.mjs"() {
    init_error();
    GRANT_TYPE_JWT_BEARER = "urn:ietf:params:oauth:grant-type:jwt-bearer";
    GRANT_TYPE_REFRESH_TOKEN = "refresh_token";
    TOKEN_ENDPOINT = "/v1/oauth/token";
    OAUTH_API_BETA_HEADER = "oauth-2025-04-20";
    FEDERATION_BETA_HEADER = "oidc-federation-2026-04-01";
    ADVISORY_REFRESH_THRESHOLD_IN_SECONDS = 120;
    MANDATORY_REFRESH_THRESHOLD_IN_SECONDS = 30;
    ADVISORY_REFRESH_BACKOFF_IN_SECONDS = 5;
    MAX_TOKEN_RESPONSE_BYTES = 1 << 20;
    MAX_ERROR_BODY_CHARS = 2e3;
    SAFE_ERROR_KEYS = /* @__PURE__ */ new Set(["error", "error_description", "error_uri"]);
    WorkloadIdentityError = class extends AnthropicError {
      constructor(message, statusCode = null, body = null, requestId = null) {
        super(message);
        this.statusCode = statusCode;
        this.body = body;
        this.requestId = requestId;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/time.mjs
function nowAsSeconds() {
  return Math.floor(Date.now() / 1e3);
}
var init_time = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/time.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/token-cache.mjs
var TokenCache;
var init_token_cache = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/token-cache.mjs"() {
    init_types();
    init_time();
    TokenCache = class {
      constructor(provider, onAdvisoryRefreshError) {
        this.cached = null;
        this.pendingRefresh = null;
        this.nextForce = false;
        this.lastAdvisoryError = 0;
        this.provider = provider;
        this.onAdvisoryRefreshError = onAdvisoryRefreshError;
      }
      async getToken() {
        const force = this.nextForce;
        this.nextForce = false;
        const cached = this.cached;
        if (force || cached == null) {
          const token2 = await this.refresh(force);
          return token2.token;
        }
        if (cached.expiresAt == null) {
          return cached.token;
        }
        const remaining = cached.expiresAt - nowAsSeconds();
        if (remaining > ADVISORY_REFRESH_THRESHOLD_IN_SECONDS) {
          return cached.token;
        }
        if (remaining > MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
          this.backgroundRefresh();
          return cached.token;
        }
        const token = await this.refresh();
        return token.token;
      }
      /**
       * Clears the cached token and marks the next {@link getToken} as a forced
       * refresh, so the underlying provider bypasses any on-disk freshness check.
       * Called after a 401 — the server has just told us the token is bad even
       * if its `expires_at` still looks fresh.
       */
      invalidate() {
        this.cached = null;
        this.nextForce = true;
      }
      /**
       * Mandatory refresh. Joins any in-flight refresh unless forced — a forced
       * refresh must not coalesce into a non-forced one that may re-serve the
       * same stale disk token.
       */
      refresh(force = false) {
        if (this.pendingRefresh && !force) {
          return this.pendingRefresh;
        }
        return this.doRefresh(force);
      }
      /**
       * Advisory background refresh. Shares the same in-flight promise as
       * mandatory refreshes for deduplication, but swallows errors so the
       * stale cached token keeps being served. Backs off for
       * {@link ADVISORY_REFRESH_BACKOFF_IN_SECONDS} after a failure so an
       * outage during the advisory window doesn't hammer the token endpoint.
       */
      backgroundRefresh() {
        if (this.pendingRefresh) {
          return;
        }
        if (nowAsSeconds() - this.lastAdvisoryError < ADVISORY_REFRESH_BACKOFF_IN_SECONDS) {
          return;
        }
        this.doRefresh().catch((err) => {
          this.lastAdvisoryError = nowAsSeconds();
          this.onAdvisoryRefreshError?.(err);
        });
      }
      /**
       * Core refresh. Sets {@link pendingRefresh} so concurrent callers
       * (both advisory and mandatory) coalesce into a single provider call.
       */
      doRefresh(force = false) {
        this.pendingRefresh = this.provider(force ? { forceRefresh: true } : void 0).then((token) => {
          this.cached = token;
          this.pendingRefresh = null;
          return token;
        }, (err) => {
          this.pendingRefresh = null;
          throw err;
        });
        return this.pendingRefresh;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/env.mjs
var readEnv;
var init_env = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/env.mjs"() {
    readEnv = (env) => {
      if (typeof globalThis.process !== "undefined") {
        return globalThis.process.env?.[env]?.trim() || void 0;
      }
      if (typeof globalThis.Deno !== "undefined") {
        return globalThis.Deno.env?.get?.(env)?.trim() || void 0;
      }
      return void 0;
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/bytes.mjs
function concatBytes(buffers) {
  let length = 0;
  for (const buffer of buffers) {
    length += buffer.length;
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const buffer of buffers) {
    output.set(buffer, index);
    index += buffer.length;
  }
  return output;
}
function encodeUTF8(str) {
  let encoder2;
  return (encodeUTF8_ ?? (encoder2 = new globalThis.TextEncoder(), encodeUTF8_ = encoder2.encode.bind(encoder2)))(str);
}
function decodeUTF8(bytes) {
  let decoder;
  return (decodeUTF8_ ?? (decoder = new globalThis.TextDecoder(), decodeUTF8_ = decoder.decode.bind(decoder)))(bytes);
}
var encodeUTF8_, decodeUTF8_;
var init_bytes = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/bytes.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/base64.mjs
var fromBase64;
var init_base64 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/base64.mjs"() {
    init_error();
    init_bytes();
    fromBase64 = (str) => {
      if (typeof globalThis.Buffer !== "undefined") {
        const buf = globalThis.Buffer.from(str, "base64");
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      if (typeof atob !== "undefined") {
        const bstr = atob(str);
        const buf = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) {
          buf[i] = bstr.charCodeAt(i);
        }
        return buf;
      }
      throw new AnthropicError("Cannot decode base64 string; Expected `Buffer` or `atob` to be defined");
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/log.mjs
function noop() {
}
function makeLogFn(fnLevel, logger, logLevel) {
  if (!logger || levelNumbers[fnLevel] > levelNumbers[logLevel]) {
    return noop;
  } else {
    return logger[fnLevel].bind(logger);
  }
}
function filterLogger(logger, logLevel) {
  const cachedLogger = cachedLoggers.get(logger);
  if (cachedLogger && cachedLogger[0] === logLevel) {
    return cachedLogger[1];
  }
  const levelLogger = {
    error: makeLogFn("error", logger, logLevel),
    warn: makeLogFn("warn", logger, logLevel),
    info: makeLogFn("info", logger, logLevel),
    debug: makeLogFn("debug", logger, logLevel)
  };
  cachedLoggers.set(logger, [logLevel, levelLogger]);
  return levelLogger;
}
function loggerFor(client) {
  const logger = client.logger;
  const logLevel = client.logLevel ?? "off";
  if (!logger) {
    return noopLogger;
  }
  return filterLogger(logger, logLevel);
}
function defaultLogger() {
  const envLevel = readEnv("ANTHROPIC_LOG");
  if (!cachedDefaultLogger || envLevel !== lastEnvLevel) {
    lastEnvLevel = envLevel;
    cachedDefaultLogger = filterLogger(console, parseLogLevel(envLevel, "process.env['ANTHROPIC_LOG']", filterLogger(console, defaultLogLevel)) ?? defaultLogLevel);
  }
  return cachedDefaultLogger;
}
var defaultLogLevel, levelNumbers, parseLogLevel, noopLogger, cachedLoggers, lastEnvLevel, cachedDefaultLogger, formatRequestDetails;
var init_log = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/log.mjs"() {
    init_values();
    init_env();
    defaultLogLevel = "warn";
    levelNumbers = {
      off: 0,
      error: 200,
      warn: 300,
      info: 400,
      debug: 500
    };
    parseLogLevel = (maybeLevel, sourceName, logger) => {
      if (!maybeLevel) {
        return void 0;
      }
      if (hasOwn(levelNumbers, maybeLevel)) {
        return maybeLevel;
      }
      logger.warn(`${sourceName} was set to ${JSON.stringify(maybeLevel)}, expected one of ${JSON.stringify(Object.keys(levelNumbers))}`);
      return void 0;
    };
    noopLogger = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop
    };
    cachedLoggers = /* @__PURE__ */ new WeakMap();
    formatRequestDetails = (details) => {
      if (details.options) {
        details.options = { ...details.options };
        delete details.options["headers"];
      }
      if (details.headers) {
        details.headers = Object.fromEntries((details.headers instanceof Headers ? [...details.headers] : Object.entries(details.headers)).map(([name, value]) => [
          name,
          name.toLowerCase() === "authorization" || name.toLowerCase() === "api-key" || name.toLowerCase() === "x-api-key" || name.toLowerCase() === "cookie" || name.toLowerCase() === "set-cookie" ? "***" : value
        ]));
      }
      if ("retryOfRequestLogID" in details) {
        if (details.retryOfRequestLogID) {
          details.retryOf = details.retryOfRequestLogID;
        }
        delete details.retryOfRequestLogID;
      }
      return details;
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils.mjs
var init_utils2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils.mjs"() {
    init_values();
    init_base64();
    init_env();
    init_log();
    init_uuid();
    init_sleep();
    init_query();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/credentials.mjs
function validateProfileName(name) {
  if (!name) {
    throw new Error("profile name is empty");
  }
  if (name === "." || name === "..") {
    throw new Error(`profile name "${name}" is not allowed`);
  }
  if (name.includes("/") || name.includes("\\")) {
    throw new Error(`profile name "${name}" must not contain path separators`);
  }
  if (!PROFILE_NAME_PATTERN.test(name)) {
    throw new Error(`profile name "${name}" contains disallowed characters (allowed: letters, digits, '_', '.', '-')`);
  }
}
var CREDENTIALS_FILE_VERSION, PROFILE_NAME_PATTERN, loadConfigWithSource, getCredentialsPath, getRootConfigPath, supportsLocalConfigFiles, getActiveProfileName;
var init_credentials = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/credentials.mjs"() {
    init_detect_platform();
    init_utils2();
    CREDENTIALS_FILE_VERSION = "1.0";
    PROFILE_NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;
    loadConfigWithSource = async (profile) => {
      var _a2, _b;
      const rootConfigPath = await getRootConfigPath();
      if (rootConfigPath === null) {
        return null;
      }
      const profileName = profile ?? await getActiveProfileName();
      if (profileName === null) {
        return null;
      }
      validateProfileName(profileName);
      const { fs: fs5, path: path4 } = await Promise.resolve().then(() => (init_node(), node_exports));
      const configPath = path4.join(rootConfigPath, "configs", `${profileName}.json`);
      let configRaw;
      try {
        configRaw = await fs5.promises.readFile(configPath, "utf-8");
      } catch (err) {
        if (err?.code !== "ENOENT") {
          throw new Error(`failed to read config file ${configPath}: ${err}`);
        }
        configRaw = null;
      }
      if (configRaw === null) {
        const organizationId = readEnv("ANTHROPIC_ORGANIZATION_ID");
        const identityTokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
        const federationRuleId = readEnv("ANTHROPIC_FEDERATION_RULE_ID");
        if (federationRuleId && organizationId) {
          return {
            fromFile: false,
            config: {
              organization_id: organizationId,
              // A defaulted-but-empty CI variable (`ANTHROPIC_WORKSPACE_ID=""`) is
              // treated as unset — readEnv coerces empty to undefined, and the body
              // builder's truthy check skips it — so `"workspace_id": ""` never goes
              // on the wire.
              workspace_id: readEnv("ANTHROPIC_WORKSPACE_ID"),
              base_url: readEnv("ANTHROPIC_BASE_URL"),
              authentication: {
                type: "oidc_federation",
                federation_rule_id: federationRuleId,
                service_account_id: readEnv("ANTHROPIC_SERVICE_ACCOUNT_ID"),
                identity_token: identityTokenFile ? { source: "file", path: identityTokenFile } : void 0,
                scope: readEnv("ANTHROPIC_SCOPE")
              }
            }
          };
        }
        return null;
      }
      let config;
      try {
        config = JSON.parse(configRaw);
      } catch (err) {
        throw new Error(`failed to parse config file ${configPath}: ${err}`);
      }
      if (!config.authentication) {
        throw new Error(`config file ${configPath} is missing "authentication"`);
      }
      const authType = config.authentication.type;
      if (authType !== "oidc_federation" && authType !== "user_oauth") {
        throw new Error(`authentication.type "${authType}" is not a known authentication type`);
      }
      config.organization_id ?? (config.organization_id = readEnv("ANTHROPIC_ORGANIZATION_ID"));
      config.workspace_id ?? (config.workspace_id = readEnv("ANTHROPIC_WORKSPACE_ID"));
      config.base_url ?? (config.base_url = readEnv("ANTHROPIC_BASE_URL"));
      (_a2 = config.authentication).scope ?? (_a2.scope = readEnv("ANTHROPIC_SCOPE"));
      if (config.authentication.type === "oidc_federation") {
        if (!config.authentication.identity_token) {
          const identityTokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
          if (identityTokenFile) {
            config.authentication.identity_token = {
              source: "file",
              path: identityTokenFile
            };
          }
        }
        if (!config.authentication.federation_rule_id) {
          config.authentication.federation_rule_id = readEnv("ANTHROPIC_FEDERATION_RULE_ID") ?? "";
        }
        (_b = config.authentication).service_account_id ?? (_b.service_account_id = readEnv("ANTHROPIC_SERVICE_ACCOUNT_ID"));
      }
      return { config, fromFile: true };
    };
    getCredentialsPath = async (config, profile) => {
      if (config?.authentication.credentials_path) {
        return config.authentication.credentials_path;
      }
      const rootConfigPath = await getRootConfigPath();
      if (!rootConfigPath) {
        return null;
      }
      const profileName = profile ?? await getActiveProfileName();
      if (!profileName) {
        return null;
      }
      validateProfileName(profileName);
      const { path: path4 } = await Promise.resolve().then(() => (init_node(), node_exports));
      return path4.join(rootConfigPath, "credentials", `${profileName}.json`);
    };
    getRootConfigPath = async () => {
      if (!supportsLocalConfigFiles()) {
        return null;
      }
      const { path: path4 } = await Promise.resolve().then(() => (init_node(), node_exports));
      const configDir = readEnv("ANTHROPIC_CONFIG_DIR");
      if (configDir) {
        return configDir;
      }
      const os2 = getPlatformHeaders()["X-Stainless-OS"];
      if (os2 === "Windows") {
        const appData = readEnv("APPDATA");
        if (appData) {
          return path4.join(appData, "Anthropic");
        }
        const userProfile = readEnv("USERPROFILE");
        if (userProfile) {
          return path4.join(userProfile, "AppData", "Roaming", "Anthropic");
        }
        return null;
      }
      const xdgConfigHome = readEnv("XDG_CONFIG_HOME");
      if (xdgConfigHome) {
        return path4.join(xdgConfigHome, "anthropic");
      }
      const home = readEnv("HOME");
      if (home) {
        return path4.join(home, ".config", "anthropic");
      }
      return null;
    };
    supportsLocalConfigFiles = () => {
      const runtime = getPlatformHeaders()["X-Stainless-Runtime"];
      return runtime === "node" || runtime === "deno";
    };
    getActiveProfileName = async () => {
      const rootConfigPath = await getRootConfigPath();
      if (!rootConfigPath) {
        return null;
      }
      const profileName = readEnv("ANTHROPIC_PROFILE");
      if (profileName) {
        return profileName;
      }
      const { fs: fs5, path: path4 } = await Promise.resolve().then(() => (init_node(), node_exports));
      const filePath = path4.join(rootConfigPath, "active_config");
      try {
        return (await fs5.promises.readFile(filePath, "utf-8")).trim() || "default";
      } catch (err) {
        if (err?.code !== "ENOENT") {
          throw new Error(`failed to read ${filePath}: ${err}`);
        }
        return "default";
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/identity-token.mjs
function identityTokenFromFile(path4) {
  if (!path4) {
    throw new AnthropicError("Identity token file path is empty");
  }
  return async () => {
    const { fs: fs5 } = await Promise.resolve().then(() => (init_node(), node_exports));
    let content;
    try {
      content = await fs5.promises.readFile(path4, "utf-8");
    } catch (err) {
      throw new AnthropicError(`Failed to read identity token file at ${path4}: ${err}`);
    }
    const token = content.trim();
    if (!token) {
      throw new AnthropicError(`Identity token file at ${path4} is empty`);
    }
    return token;
  };
}
function identityTokenFromValue(token) {
  if (!token) {
    throw new AnthropicError("Identity token value is empty");
  }
  return () => token;
}
var init_identity_token = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/identity-token.mjs"() {
    init_error();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/oidc-federation.mjs
function oidcFederationProvider(config) {
  return async () => {
    requireSecureTokenEndpoint(config.baseURL);
    const jwt = await config.identityTokenProvider();
    if (jwt.length > 16 * 1024) {
      throw new WorkloadIdentityError(`Identity token is ${Math.ceil(jwt.length / 1024)} KiB, exceeds the 16 KiB assertion limit`);
    }
    const body = {
      grant_type: GRANT_TYPE_JWT_BEARER,
      assertion: jwt,
      federation_rule_id: config.federationRuleId,
      organization_id: config.organizationId
    };
    if (config.serviceAccountId) {
      body["service_account_id"] = config.serviceAccountId;
    }
    if (config.workspaceId) {
      body["workspace_id"] = config.workspaceId;
    }
    const url = `${config.baseURL}${TOKEN_ENDPOINT}`;
    let resp;
    try {
      resp = await config.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-beta": `${OAUTH_API_BETA_HEADER},${FEDERATION_BETA_HEADER}`,
          "User-Agent": config.userAgent || `anthropic-sdk-typescript/${VERSION} oidcFederationProvider`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new WorkloadIdentityError(`Failed to reach token endpoint ${url}: ${err}`);
    }
    const requestId = resp.headers.get("Request-Id");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      const redacted = redactSensitive(text);
      let hint = "";
      if (resp.status === 401) {
        const hintMiddle = config.workspaceId ? "" : "If your federation rule is scoped to multiple workspaces, set the ANTHROPIC_WORKSPACE_ID environment variable, the 'workspace_id' config key, or the `workspaceId` option. ";
        hint = ` Ensure your federation rule matches your identity token. ${hintMiddle}View your authentication events in the Workload identity page of Claude Console for more details.`;
      }
      throw new WorkloadIdentityError(`Token exchange failed with status ${resp.status}${requestId ? ` (request-id ${requestId})` : ""}: ${redacted}${hint}`, resp.status, redacted, requestId);
    }
    const data = await parseTokenResponse(resp, requestId);
    const expiresIn = Number(data.expires_in);
    if (!Number.isFinite(expiresIn)) {
      throw new WorkloadIdentityError(`Token endpoint response missing required fields: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
    }
    return {
      token: data.access_token,
      expiresAt: nowAsSeconds() + expiresIn
    };
  };
}
var init_oidc_federation = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/oidc-federation.mjs"() {
    init_types();
    init_time();
    init_version();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/user-oauth.mjs
function userOAuthProvider(config) {
  return async (opts) => {
    const { fs: fs5 } = await Promise.resolve().then(() => (init_node(), node_exports));
    await checkCredentialsFileSafety(config.credentialsPath, config.onSafetyWarning);
    let raw;
    try {
      raw = await fs5.promises.readFile(config.credentialsPath, "utf-8");
    } catch (err) {
      throw new WorkloadIdentityError(`Credentials file not found at ${config.credentialsPath}: ${err}`);
    }
    let creds;
    try {
      creds = JSON.parse(raw);
    } catch (err) {
      throw new WorkloadIdentityError(`Credentials file at ${config.credentialsPath} is not valid JSON: ${err}`);
    }
    const accessToken = creds.access_token;
    if (!accessToken) {
      throw new WorkloadIdentityError(`Credentials file at ${config.credentialsPath} must include 'access_token'`);
    }
    const expiresAt = creds.expires_at;
    if (!opts?.forceRefresh && (expiresAt == null || nowAsSeconds() < expiresAt - MANDATORY_REFRESH_THRESHOLD_IN_SECONDS)) {
      return { token: accessToken, expiresAt: expiresAt ?? null };
    }
    const refreshToken = creds.refresh_token;
    if (!config.clientId || !refreshToken) {
      throw new WorkloadIdentityError(`Access token at ${config.credentialsPath} has expired and no refresh is available (client_id ${config.clientId ? "set" : "empty"}, refresh_token ${refreshToken ? "set" : "empty"})`);
    }
    requireSecureTokenEndpoint(config.baseURL);
    const body = {
      grant_type: GRANT_TYPE_REFRESH_TOKEN,
      refresh_token: refreshToken,
      client_id: config.clientId
    };
    const url = `${config.baseURL}${TOKEN_ENDPOINT}`;
    let resp;
    try {
      resp = await config.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-beta": OAUTH_API_BETA_HEADER,
          "User-Agent": config.userAgent || `anthropic-sdk-typescript/${VERSION} userOAuthProvider`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new WorkloadIdentityError(`User OAuth refresh failed to reach token endpoint: ${err}`);
    }
    const requestId = resp.headers.get("Request-Id");
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new WorkloadIdentityError(`User OAuth refresh failed (HTTP ${resp.status}): ${redactSensitive(text)}`, resp.status, redactSensitive(text), requestId);
    }
    const data = await parseTokenResponse(resp, requestId);
    const expiresIn = Number(data.expires_in);
    if (!Number.isFinite(expiresIn)) {
      throw new WorkloadIdentityError(`User OAuth refresh response missing or invalid expires_in: ${JSON.stringify(redactSensitive(data))}`, resp.status, redactSensitive(data), requestId);
    }
    const newExpiresAt = nowAsSeconds() + expiresIn;
    const newRefreshToken = data.refresh_token || refreshToken;
    await writeCredentialsFileAtomic(config.credentialsPath, {
      ...creds,
      version: CREDENTIALS_FILE_VERSION,
      type: "oauth_token",
      access_token: data.access_token,
      expires_at: newExpiresAt,
      refresh_token: newRefreshToken
    });
    return { token: data.access_token, expiresAt: newExpiresAt };
  };
}
var init_user_oauth = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/user-oauth.mjs"() {
    init_credentials();
    init_types();
    init_time();
    init_version();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs
function resolveCredentialsFromConfig(config, options) {
  const credentialsPath = config.authentication.credentials_path ?? null;
  const effectiveBaseURL = (config.base_url || options.baseURL).replace(/\/+$/, "");
  const provider = buildProvider(config, credentialsPath, effectiveBaseURL, options);
  const extraHeaders = {};
  if (config.workspace_id && config.authentication.type === "user_oauth") {
    extraHeaders["anthropic-workspace-id"] = config.workspace_id;
  }
  return { provider, extraHeaders, baseURL: config.base_url || void 0 };
}
async function defaultCredentials(options, profile) {
  const loaded = await loadConfigWithSource(profile);
  if (!loaded) {
    return null;
  }
  const { config, fromFile } = loaded;
  const withPath = config.authentication.credentials_path || !fromFile ? config : {
    ...config,
    authentication: {
      ...config.authentication,
      credentials_path: await getCredentialsPath(config, profile) ?? void 0
    }
  };
  return resolveCredentialsFromConfig(withPath, options);
}
function buildProvider(config, credentialsPath, baseURL, options) {
  switch (config.authentication.type) {
    case "oidc_federation": {
      const auth = config.authentication;
      const identityProvider = resolveIdentityTokenProvider(auth);
      if (!identityProvider) {
        throw new WorkloadIdentityError("oidc_federation config requires an identity token (set authentication.identity_token, ANTHROPIC_IDENTITY_TOKEN_FILE, or ANTHROPIC_IDENTITY_TOKEN)");
      }
      if (!auth.federation_rule_id) {
        throw new WorkloadIdentityError("oidc_federation config requires 'federation_rule_id'. Set it in authentication.federation_rule_id in your profile, or via ANTHROPIC_FEDERATION_RULE_ID (profile takes precedence).");
      }
      if (!config.organization_id) {
        throw new WorkloadIdentityError("oidc_federation config requires organization_id (set ANTHROPIC_ORGANIZATION_ID or config.organization_id)");
      }
      const exchange = oidcFederationProvider({
        identityTokenProvider: identityProvider,
        federationRuleId: auth.federation_rule_id,
        organizationId: config.organization_id,
        serviceAccountId: auth.service_account_id,
        workspaceId: config.workspace_id,
        baseURL,
        fetch: options.fetch,
        userAgent: options.userAgent
      });
      if (credentialsPath) {
        return cachedExchangeProvider(exchange, credentialsPath, options.onCacheWriteError, options.onSafetyWarning);
      }
      return exchange;
    }
    case "user_oauth": {
      if (!credentialsPath) {
        throw new WorkloadIdentityError("user_oauth config requires authentication.credentials_path (or load via a profile so it defaults to <config_dir>/credentials/<profile>.json)");
      }
      return userOAuthProvider({
        credentialsPath,
        clientId: config.authentication.client_id,
        baseURL,
        fetch: options.fetch,
        userAgent: options.userAgent,
        onSafetyWarning: options.onSafetyWarning
      });
    }
    default: {
      const t = config.authentication.type;
      throw new WorkloadIdentityError(`authentication.type "${t}" is not a known authentication type`);
    }
  }
}
function resolveIdentityTokenProvider(auth) {
  if (auth.identity_token) {
    const source = auth.identity_token.source;
    if (source !== "file") {
      throw new WorkloadIdentityError(`identity_token.source "${source}" is not supported by this SDK version (only "file")`);
    }
    if (!auth.identity_token.path) {
      throw new WorkloadIdentityError(`identity_token.source "file" requires a non-empty path`);
    }
    return identityTokenFromFile(auth.identity_token.path);
  }
  const tokenFile = readEnv("ANTHROPIC_IDENTITY_TOKEN_FILE");
  if (tokenFile) {
    return identityTokenFromFile(tokenFile);
  }
  const tokenValue = readEnv("ANTHROPIC_IDENTITY_TOKEN");
  if (tokenValue) {
    return identityTokenFromValue(tokenValue);
  }
  return null;
}
function cachedExchangeProvider(exchange, credentialsPath, onCacheWriteError, onSafetyWarning) {
  return async (opts) => {
    const { fs: fs5 } = await Promise.resolve().then(() => (init_node(), node_exports));
    await checkCredentialsFileSafety(credentialsPath, onSafetyWarning);
    let existing;
    try {
      const raw = await fs5.promises.readFile(credentialsPath, "utf-8");
      existing = JSON.parse(raw);
      const token = existing?.["access_token"];
      if (token && !opts?.forceRefresh) {
        const expiresAt = existing?.["expires_at"];
        if (expiresAt == null || nowAsSeconds() < expiresAt - MANDATORY_REFRESH_THRESHOLD_IN_SECONDS) {
          return { token, expiresAt: expiresAt ?? null };
        }
      }
    } catch (err) {
      const code = err?.code;
      if (code !== "ENOENT" && !(err instanceof SyntaxError)) {
        onCacheWriteError?.(err);
      }
    }
    const result = await exchange(opts);
    try {
      await writeCredentialsFileAtomic(credentialsPath, {
        ...existing ?? {},
        version: CREDENTIALS_FILE_VERSION,
        type: "oauth_token",
        access_token: result.token,
        expires_at: result.expiresAt
      });
    } catch (err) {
      onCacheWriteError?.(err);
    }
    return result;
  };
}
var init_credential_chain = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/credentials/credential-chain.mjs"() {
    init_env();
    init_credentials();
    init_types();
    init_time();
    init_identity_token();
    init_oidc_federation();
    init_user_oauth();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/decoders/line.mjs
function findNewlineIndex(buffer, startIndex) {
  const newline = 10;
  const carriage = 13;
  for (let i = startIndex ?? 0; i < buffer.length; i++) {
    if (buffer[i] === newline) {
      return { preceding: i, index: i + 1, carriage: false };
    }
    if (buffer[i] === carriage) {
      return { preceding: i, index: i + 1, carriage: true };
    }
  }
  return null;
}
function findDoubleNewlineIndex(buffer) {
  const newline = 10;
  const carriage = 13;
  for (let i = 0; i < buffer.length - 1; i++) {
    if (buffer[i] === newline && buffer[i + 1] === newline) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === carriage) {
      return i + 2;
    }
    if (buffer[i] === carriage && buffer[i + 1] === newline && i + 3 < buffer.length && buffer[i + 2] === carriage && buffer[i + 3] === newline) {
      return i + 4;
    }
  }
  return -1;
}
var _LineDecoder_buffer, _LineDecoder_carriageReturnIndex, LineDecoder;
var init_line = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/decoders/line.mjs"() {
    init_tslib();
    init_bytes();
    LineDecoder = class {
      constructor() {
        _LineDecoder_buffer.set(this, void 0);
        _LineDecoder_carriageReturnIndex.set(this, void 0);
        __classPrivateFieldSet(this, _LineDecoder_buffer, new Uint8Array(), "f");
        __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
      }
      decode(chunk) {
        if (chunk == null) {
          return [];
        }
        const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
        __classPrivateFieldSet(this, _LineDecoder_buffer, concatBytes([__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), binaryChunk]), "f");
        const lines = [];
        let patternIndex;
        while ((patternIndex = findNewlineIndex(__classPrivateFieldGet(this, _LineDecoder_buffer, "f"), __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f"))) != null) {
          if (patternIndex.carriage && __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") == null) {
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, patternIndex.index, "f");
            continue;
          }
          if (__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") != null && (patternIndex.index !== __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") + 1 || patternIndex.carriage)) {
            lines.push(decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") - 1)));
            __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(__classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f")), "f");
            __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
            continue;
          }
          const endIndex = __classPrivateFieldGet(this, _LineDecoder_carriageReturnIndex, "f") !== null ? patternIndex.preceding - 1 : patternIndex.preceding;
          const line = decodeUTF8(__classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(0, endIndex));
          lines.push(line);
          __classPrivateFieldSet(this, _LineDecoder_buffer, __classPrivateFieldGet(this, _LineDecoder_buffer, "f").subarray(patternIndex.index), "f");
          __classPrivateFieldSet(this, _LineDecoder_carriageReturnIndex, null, "f");
        }
        return lines;
      }
      flush() {
        if (!__classPrivateFieldGet(this, _LineDecoder_buffer, "f").length) {
          return [];
        }
        return this.decode("\n");
      }
    };
    _LineDecoder_buffer = /* @__PURE__ */ new WeakMap(), _LineDecoder_carriageReturnIndex = /* @__PURE__ */ new WeakMap();
    LineDecoder.NEWLINE_CHARS = /* @__PURE__ */ new Set(["\n", "\r"]);
    LineDecoder.NEWLINE_REGEXP = /\r\n|[\n\r]/g;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/streaming.mjs
async function* _iterSSEMessages(response, controller) {
  if (!response.body) {
    controller.abort();
    if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
      throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
    }
    throw new AnthropicError(`Attempted to iterate over a response with no body`);
  }
  const sseDecoder = new SSEDecoder();
  const lineDecoder = new LineDecoder();
  const iter = ReadableStreamToAsyncIterable(response.body);
  for await (const sseChunk of iterSSEChunks(iter)) {
    for (const line of lineDecoder.decode(sseChunk)) {
      const sse = sseDecoder.decode(line);
      if (sse)
        yield sse;
    }
  }
  for (const line of lineDecoder.flush()) {
    const sse = sseDecoder.decode(line);
    if (sse)
      yield sse;
  }
}
async function* iterSSEChunks(iterator) {
  let data = new Uint8Array();
  for await (const chunk of iterator) {
    if (chunk == null) {
      continue;
    }
    const binaryChunk = chunk instanceof ArrayBuffer ? new Uint8Array(chunk) : typeof chunk === "string" ? encodeUTF8(chunk) : chunk;
    let newData = new Uint8Array(data.length + binaryChunk.length);
    newData.set(data);
    newData.set(binaryChunk, data.length);
    data = newData;
    let patternIndex;
    while ((patternIndex = findDoubleNewlineIndex(data)) !== -1) {
      yield data.slice(0, patternIndex);
      data = data.slice(patternIndex);
    }
  }
  if (data.length > 0) {
    yield data;
  }
}
function partition(str, delimiter2) {
  const index = str.indexOf(delimiter2);
  if (index !== -1) {
    return [str.substring(0, index), delimiter2, str.substring(index + delimiter2.length)];
  }
  return [str, "", ""];
}
var _Stream_client, Stream, SSEDecoder;
var init_streaming = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/streaming.mjs"() {
    init_tslib();
    init_error();
    init_shims();
    init_line();
    init_shims();
    init_errors();
    init_values();
    init_bytes();
    init_log();
    init_error();
    init_request_signal();
    Stream = class _Stream {
      constructor(iterator, controller, client) {
        this.iterator = iterator;
        _Stream_client.set(this, void 0);
        this.controller = controller;
        __classPrivateFieldSet(this, _Stream_client, client, "f");
      }
      /**
       * Iterate the raw Server-Sent Events from `response` — `{event, data, raw}`
       * objects, before any JSON parsing or event-name filtering.
       *
       * This reads `response.body` directly (not a clone), so the response is
       * consumed. Use this in middleware that fully replaces the stream body; for
       * read-only observation of parsed events, use `ctx.parse()` instead.
       */
      static rawEvents(response, controller = new AbortController()) {
        return _iterSSEMessages(response, controller);
      }
      static fromSSEResponse(response, controller, client) {
        let consumed = false;
        const logger = client ? loggerFor(client) : console;
        async function* iterator() {
          if (consumed) {
            throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const sse of _iterSSEMessages(response, controller)) {
              if (sse.event === "completion") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "message_start" || sse.event === "message_delta" || sse.event === "message_stop" || sse.event === "content_block_start" || sse.event === "content_block_delta" || sse.event === "content_block_stop" || sse.event === "message" || sse.event === "user.message" || sse.event === "user.interrupt" || sse.event === "user.tool_confirmation" || sse.event === "user.custom_tool_result" || sse.event === "user.tool_result" || sse.event === "agent.message" || sse.event === "agent.thinking" || sse.event === "agent.tool_use" || sse.event === "agent.tool_result" || sse.event === "agent.mcp_tool_use" || sse.event === "agent.mcp_tool_result" || sse.event === "agent.custom_tool_use" || sse.event === "agent.thread_context_compacted" || sse.event === "session.status_running" || sse.event === "session.status_idle" || sse.event === "session.status_rescheduled" || sse.event === "session.status_terminated" || sse.event === "session.error" || sse.event === "session.deleted" || sse.event === "session.updated" || sse.event === "span.model_request_start" || sse.event === "span.model_request_end" || sse.event === "span.outcome_evaluation_start" || sse.event === "span.outcome_evaluation_ongoing" || sse.event === "span.outcome_evaluation_end" || sse.event === "user.define_outcome" || sse.event === "agent.thread_message_received" || sse.event === "agent.thread_message_sent" || sse.event === "agent.session_thread_message_received" || sse.event === "agent.session_thread_message_sent" || sse.event === "session.thread_created" || sse.event === "session.thread_status_created" || sse.event === "session.thread_status_running" || sse.event === "session.thread_status_idle" || sse.event === "session.thread_status_rescheduled" || sse.event === "session.thread_status_terminated" || sse.event === "event_start" || sse.event === "event_delta" || sse.event === "system.message") {
                try {
                  yield JSON.parse(sse.data);
                } catch (e) {
                  logger.error(`Could not parse message into JSON:`, sse.data);
                  logger.error(`From chunk:`, sse.raw);
                  throw e;
                }
              }
              if (sse.event === "ping") {
                continue;
              }
              if (sse.event === "error") {
                const body = safeJSON(sse.data) ?? sse.data;
                const type = body?.error?.type;
                throw new APIError(void 0, body, void 0, response.headers, type);
              }
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
            releaseRequestSignal(controller);
          }
        }
        return new _Stream(iterator, controller, client);
      }
      /**
       * Generates a Stream from a newline-separated ReadableStream
       * where each item is a JSON value.
       */
      static fromReadableStream(readableStream, controller, client) {
        let consumed = false;
        async function* iterLines() {
          const lineDecoder = new LineDecoder();
          const iter = ReadableStreamToAsyncIterable(readableStream);
          for await (const chunk of iter) {
            for (const line of lineDecoder.decode(chunk)) {
              yield line;
            }
          }
          for (const line of lineDecoder.flush()) {
            yield line;
          }
        }
        async function* iterator() {
          if (consumed) {
            throw new AnthropicError("Cannot iterate over a consumed stream, use `.tee()` to split the stream.");
          }
          consumed = true;
          let done = false;
          try {
            for await (const line of iterLines()) {
              if (done)
                continue;
              if (line)
                yield JSON.parse(line);
            }
            done = true;
          } catch (e) {
            if (isAbortError(e))
              return;
            throw e;
          } finally {
            if (!done)
              controller.abort();
            releaseRequestSignal(controller);
          }
        }
        return new _Stream(iterator, controller, client);
      }
      [(_Stream_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        return this.iterator();
      }
      /**
       * Splits the stream into two streams which can be
       * independently read from at different speeds.
       */
      tee() {
        const left = [];
        const right = [];
        const iterator = this.iterator();
        const teeIterator = (queue) => {
          return {
            next: () => {
              if (queue.length === 0) {
                const result = iterator.next();
                left.push(result);
                right.push(result);
              }
              return queue.shift();
            }
          };
        };
        return [
          new _Stream(() => teeIterator(left), this.controller, __classPrivateFieldGet(this, _Stream_client, "f")),
          new _Stream(() => teeIterator(right), this.controller, __classPrivateFieldGet(this, _Stream_client, "f"))
        ];
      }
      /**
       * Converts this stream to a newline-separated ReadableStream of
       * JSON stringified values in the stream
       * which can be turned back into a Stream with `Stream.fromReadableStream()`.
       */
      toReadableStream() {
        const self = this;
        let iter;
        return makeReadableStream({
          async start() {
            iter = self[Symbol.asyncIterator]();
          },
          async pull(ctrl) {
            try {
              const { value, done } = await iter.next();
              if (done)
                return ctrl.close();
              const bytes = encodeUTF8(JSON.stringify(value) + "\n");
              ctrl.enqueue(bytes);
            } catch (err) {
              ctrl.error(err);
            }
          },
          async cancel() {
            await iter.return?.();
          }
        });
      }
    };
    SSEDecoder = class {
      constructor() {
        this.event = null;
        this.data = [];
        this.chunks = [];
      }
      decode(line) {
        if (line.endsWith("\r")) {
          line = line.substring(0, line.length - 1);
        }
        if (!line) {
          if (!this.event && !this.data.length)
            return null;
          const sse = {
            event: this.event,
            data: this.data.join("\n"),
            raw: this.chunks
          };
          this.event = null;
          this.data = [];
          this.chunks = [];
          return sse;
        }
        this.chunks.push(line);
        if (line.startsWith(":")) {
          return null;
        }
        let [fieldname, _, value] = partition(line, ":");
        if (value.startsWith(" ")) {
          value = value.substring(1);
        }
        if (fieldname === "event") {
          this.event = value;
        } else if (fieldname === "data") {
          this.data.push(value);
        }
        return null;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/parse.mjs
async function defaultParseResponse(client, props) {
  const { response, requestLogID, retryOfRequestLogID, startTime } = props;
  const body = await (async () => {
    if (props.options.stream) {
      loggerFor(client).debug("response", response.status, response.url, response.headers, response.body);
      return Stream.fromSSEResponse(response, props.controller, client);
    }
    if (response.status === 204) {
      return null;
    }
    if (props.options.__binaryResponse) {
      return response;
    }
    const contentType = response.headers.get("content-type");
    const mediaType = contentType?.split(";")[0]?.trim();
    const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
    if (isJSON) {
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0") {
        return void 0;
      }
      const json = await response.json();
      return addResponseIDs(json, response);
    }
    const text = await response.text();
    return text;
  })().finally(() => {
    if (!props.options.stream && !props.options.__binaryResponse) {
      releaseRequestSignal(props.controller);
    }
  });
  loggerFor(client).debug(`[${requestLogID}] response parsed`, formatRequestDetails({
    retryOfRequestLogID,
    url: response.url,
    status: response.status,
    body,
    durationMs: Date.now() - startTime
  }));
  return body;
}
function addResponseIDs(value, response) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  return Object.defineProperties(value, {
    _request_id: { value: response.headers.get("request-id"), enumerable: false },
    _workspace_id: { value: response.headers.get("anthropic-workspace-id"), enumerable: false }
  });
}
var init_parse = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/parse.mjs"() {
    init_streaming();
    init_log();
    init_request_signal();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/middleware.mjs
function isFetchOriginError(err) {
  return typeof err === "object" && err !== null && fetchOriginErrors.has(err);
}
function isRetryableError(err) {
  const seen = /* @__PURE__ */ new Set();
  while (typeof err === "object" && err !== null && !seen.has(err)) {
    seen.add(err);
    if (isFetchOriginError(err) || isAbortError(err) || err instanceof APIConnectionError || err instanceof RetryableError) {
      return true;
    }
    err = err.cause;
  }
  return false;
}
function wrapFetchWithMiddleware(fetchFn, middleware, options, client) {
  return async (url, init = {}) => {
    if (middleware.length === 0) {
      return fetchFn.call(void 0, url, init);
    }
    const headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers);
    const response = await applyMiddleware(fetchFn, middleware, options, client)({
      ...init,
      headers,
      url: typeof url === "string" ? url : url instanceof URL ? url.href : url.url
    });
    if (response.bodyUsed || response.body?.locked) {
      throw new AnthropicError("middleware consumed the response body; use response.clone() to inspect it, or return new Response(body, response) to consume and replace it");
    }
    return response;
  };
}
function createMiddlewareContext(options, client) {
  const cache = /* @__PURE__ */ new WeakMap();
  return {
    options,
    // Resolved per chain, so changes to the client's `logLevel`/`logger`
    // apply to subsequent requests.
    logger: client ? loggerFor(client) : defaultLogger(),
    parse(response) {
      if (options?.stream && response.ok) {
        return parseMiddlewareResponse(response, options, client);
      }
      let parsed = cache.get(response);
      if (!parsed) {
        parsed = parseMiddlewareResponse(response, options, client);
        cache.set(response, parsed);
      }
      return parsed;
    }
  };
}
async function parseMiddlewareResponse(response, options, client) {
  if (response.bodyUsed || response.body?.locked) {
    throw new AnthropicError("cannot ctx.parse() a response whose body was already consumed; call ctx.parse() instead of reading the body, or read via response.clone()");
  }
  if (options?.stream && response.ok) {
    return Stream.fromSSEResponse(response.clone(), new AbortController(), client);
  }
  if (response.status === 204) {
    return null;
  }
  if (options?.__binaryResponse) {
    return response;
  }
  const contentType = response.headers.get("content-type");
  const mediaType = contentType?.split(";")[0]?.trim();
  const isJSON = mediaType?.includes("application/json") || mediaType?.endsWith("+json");
  if (isJSON) {
    if (response.headers.get("content-length") === "0") {
      return void 0;
    }
    return addResponseIDs(await response.clone().json(), response);
  }
  return await response.clone().text();
}
function applyMiddleware(fetchFn, middleware, options, client) {
  let next = async ({ url, ...init }) => {
    try {
      return await fetchFn.call(void 0, url, init);
    } catch (err) {
      const error = castToError(err);
      fetchOriginErrors.add(error);
      throw error;
    }
  };
  const ctx = createMiddlewareContext(options, client);
  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i];
    const nextInner = next;
    next = async (request) => mw(request, nextInner, ctx);
  }
  return next;
}
var fetchOriginErrors;
var init_middleware = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/middleware.mjs"() {
    init_errors();
    init_parse();
    init_log();
    init_error();
    init_streaming();
    fetchOriginErrors = /* @__PURE__ */ new WeakSet();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/api-promise.mjs
var _APIPromise_client, APIPromise;
var init_api_promise = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/api-promise.mjs"() {
    init_tslib();
    init_parse();
    APIPromise = class _APIPromise extends Promise {
      constructor(client, responsePromise, parseResponse = defaultParseResponse) {
        super((resolve2) => {
          resolve2(null);
        });
        this.responsePromise = responsePromise;
        this.parseResponse = parseResponse;
        _APIPromise_client.set(this, void 0);
        __classPrivateFieldSet(this, _APIPromise_client, client, "f");
      }
      _thenUnwrap(transform) {
        return new _APIPromise(__classPrivateFieldGet(this, _APIPromise_client, "f"), this.responsePromise, async (client, props) => addResponseIDs(transform(await this.parseResponse(client, props), props), props.response));
      }
      /**
       * Gets the raw `Response` instance instead of parsing the response
       * data.
       *
       * If you want to parse the response body but still get the `Response`
       * instance, you can use {@link withResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      asResponse() {
        return this.responsePromise.then((p) => p.response);
      }
      /**
       * Gets the parsed response data, the raw `Response` instance and the ID of the request,
       * returned via the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * If you just want to get the raw `Response` instance without parsing it,
       * you can use {@link asResponse()}.
       *
       * 👋 Getting the wrong TypeScript type for `Response`?
       * Try setting `"moduleResolution": "NodeNext"` or add `"lib": ["DOM"]`
       * to your `tsconfig.json`.
       */
      async withResponse() {
        const [data, response] = await Promise.all([this.parse(), this.asResponse()]);
        return {
          data,
          response,
          request_id: response.headers.get("request-id"),
          workspace_id: response.headers.get("anthropic-workspace-id")
        };
      }
      parse() {
        if (!this.parsedPromise) {
          this.parsedPromise = this.responsePromise.then((data) => this.parseResponse(__classPrivateFieldGet(this, _APIPromise_client, "f"), data));
        }
        return this.parsedPromise;
      }
      then(onfulfilled, onrejected) {
        return this.parse().then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.parse().catch(onrejected);
      }
      finally(onfinally) {
        return this.parse().finally(onfinally);
      }
    };
    _APIPromise_client = /* @__PURE__ */ new WeakMap();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/pagination.mjs
var _AbstractPage_client, AbstractPage, PagePromise, Page, PageCursor, BidirectionalPageCursor;
var init_pagination = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/pagination.mjs"() {
    init_tslib();
    init_error();
    init_parse();
    init_api_promise();
    init_values();
    AbstractPage = class {
      constructor(client, response, body, options) {
        _AbstractPage_client.set(this, void 0);
        __classPrivateFieldSet(this, _AbstractPage_client, client, "f");
        this.options = options;
        this.response = response;
        this.body = body;
      }
      hasNextPage() {
        const items = this.getPaginatedItems();
        if (!items.length)
          return false;
        return this.nextPageRequestOptions() != null;
      }
      async getNextPage() {
        const nextOptions = this.nextPageRequestOptions();
        if (!nextOptions) {
          throw new AnthropicError("No next page expected; please check `.hasNextPage()` before calling `.getNextPage()`.");
        }
        return await __classPrivateFieldGet(this, _AbstractPage_client, "f").requestAPIList(this.constructor, nextOptions);
      }
      async *iterPages() {
        let page = this;
        yield page;
        while (page.hasNextPage()) {
          page = await page.getNextPage();
          yield page;
        }
      }
      async *[(_AbstractPage_client = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        for await (const page of this.iterPages()) {
          for (const item of page.getPaginatedItems()) {
            yield item;
          }
        }
      }
    };
    PagePromise = class extends APIPromise {
      constructor(client, request, Page2) {
        super(client, request, async (client2, props) => new Page2(client2, props.response, await defaultParseResponse(client2, props), props.options));
      }
      /**
       * Allow auto-paginating iteration on an unawaited list call, eg:
       *
       *    for await (const item of client.items.list()) {
       *      console.log(item)
       *    }
       */
      async *[Symbol.asyncIterator]() {
        const page = await this;
        for await (const item of page) {
          yield item;
        }
      }
    };
    Page = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.has_more = body.has_more || false;
        this.first_id = body.first_id || null;
        this.last_id = body.last_id || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      hasNextPage() {
        if (this.has_more === false) {
          return false;
        }
        return super.hasNextPage();
      }
      nextPageRequestOptions() {
        if (this.options.query?.["before_id"]) {
          const first_id = this.first_id;
          if (!first_id) {
            return null;
          }
          return {
            ...this.options,
            query: {
              ...maybeObj(this.options.query),
              before_id: first_id
            }
          };
        }
        const cursor = this.last_id;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            after_id: cursor
          }
        };
      }
    };
    PageCursor = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.next_page = body.next_page || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      nextPageRequestOptions() {
        const cursor = this.next_page;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            page: cursor
          }
        };
      }
    };
    BidirectionalPageCursor = class extends AbstractPage {
      constructor(client, response, body, options) {
        super(client, response, body, options);
        this.data = body.data || [];
        this.next_page = body.next_page || null;
        this.prev_page = body.prev_page || null;
      }
      getPaginatedItems() {
        return this.data ?? [];
      }
      nextPageRequestOptions() {
        const cursor = this.next_page;
        if (!cursor) {
          return null;
        }
        return {
          ...this.options,
          query: {
            ...maybeObj(this.options.query),
            page: cursor
          }
        };
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/uploads.mjs
function makeFile(fileBits, fileName, options) {
  checkFileSupport();
  return new File(fileBits, fileName ?? "unknown_file", options);
}
function getName(value, stripPath) {
  const val = typeof value === "object" && value !== null && ("name" in value && value.name && String(value.name) || "url" in value && value.url && String(value.url) || "filename" in value && value.filename && String(value.filename) || "path" in value && value.path && String(value.path)) || "";
  return stripPath ? val.split(/[\\/]/).pop() || void 0 : val;
}
function supportsFormData(fetchObject) {
  const fetch2 = typeof fetchObject === "function" ? fetchObject : fetchObject.fetch;
  const cached = supportsFormDataMap.get(fetch2);
  if (cached)
    return cached;
  const promise = (async () => {
    try {
      const FetchResponse = "Response" in fetch2 ? fetch2.Response : (await fetch2("data:,")).constructor;
      const data = new FormData();
      if (data.toString() === await new FetchResponse(data).text()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  })();
  supportsFormDataMap.set(fetch2, promise);
  return promise;
}
var checkFileSupport, isAsyncIterable, multipartFormRequestOptions, supportsFormDataMap, createForm, addFormValue;
var init_uploads = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/uploads.mjs"() {
    init_shims();
    checkFileSupport = () => {
      if (typeof File === "undefined") {
        const { process: process2 } = globalThis;
        const isOldNode = typeof process2?.versions?.node === "string" && parseInt(process2.versions.node.split(".")) < 20;
        throw new Error("`File` is not defined as a global, which is required for file uploads." + (isOldNode ? " Update to Node 20 LTS or newer, or set `globalThis.File` to `import('node:buffer').File`." : ""));
      }
    };
    isAsyncIterable = (value) => value != null && typeof value === "object" && typeof value[Symbol.asyncIterator] === "function";
    multipartFormRequestOptions = async (opts, fetch2, stripFilenames = true) => {
      return { ...opts, body: await createForm(opts.body, fetch2, stripFilenames) };
    };
    supportsFormDataMap = /* @__PURE__ */ new WeakMap();
    createForm = async (body, fetch2, stripFilenames = true) => {
      if (!await supportsFormData(fetch2)) {
        throw new TypeError("The provided fetch function does not support file uploads with the current global FormData class.");
      }
      const form = new FormData();
      await Promise.all(Object.entries(body || {}).map(([key, value]) => addFormValue(form, key, value, stripFilenames)));
      return form;
    };
    addFormValue = async (form, key, value, stripFilenames) => {
      if (value === void 0)
        return;
      if (value == null) {
        throw new TypeError(`Received null for "${key}"; to pass null in FormData, you must use the string 'null'`);
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        form.append(key, String(value));
      } else if (value instanceof Response) {
        let options = {};
        const contentType = value.headers.get("Content-Type");
        if (contentType) {
          options = { type: contentType };
        }
        form.append(key, makeFile([await value.blob()], getName(value, stripFilenames), options));
      } else if (isAsyncIterable(value)) {
        form.append(key, makeFile([await new Response(ReadableStreamFrom(value)).blob()], getName(value, stripFilenames)));
      } else if (value instanceof Blob) {
        form.append(key, makeFile([value], getName(value, stripFilenames) || void 0, { type: value.type }));
      } else if (Array.isArray(value)) {
        await Promise.all(value.map((entry) => addFormValue(form, key + "[]", entry, stripFilenames)));
      } else if (typeof value.then === "function") {
        throw new TypeError(`Received a Promise for "${key}"; await it first, e.g. \`await toFile(...)\``);
      } else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        throw new TypeError(`Received ${value.constructor.name} for "${key}"; to upload raw bytes, wrap them with \`await toFile(bytes, 'filename')\``);
      } else if (typeof value === "object") {
        await Promise.all(Object.entries(value).map(([name, prop]) => addFormValue(form, `${key}[${name}]`, prop, stripFilenames)));
      } else {
        throw new TypeError(`Invalid value given to form, expected a string, number, boolean, object, Array, File or Blob but got ${value} instead`);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/to-file.mjs
async function toFile(value, name, options) {
  checkFileSupport();
  value = await value;
  name || (name = getName(value, true));
  if (isFileLike(value)) {
    if (value instanceof File && name == null && options == null) {
      return value;
    }
    return makeFile([await value.arrayBuffer()], name ?? value.name, {
      type: value.type,
      lastModified: value.lastModified,
      ...options
    });
  }
  if (isResponseLike(value)) {
    const blob = await value.blob();
    name || (name = new URL(value.url).pathname.split(/[\\/]/).pop());
    return makeFile(await getBytes(blob), name, options);
  }
  const parts = await getBytes(value);
  if (!options?.type) {
    const type = parts.find((part) => typeof part === "object" && "type" in part && part.type);
    if (typeof type === "string") {
      options = { ...options, type };
    }
  }
  return makeFile(parts, name, options);
}
async function getBytes(value) {
  let parts = [];
  if (typeof value === "string" || ArrayBuffer.isView(value) || // includes Uint8Array, Buffer, etc.
  value instanceof ArrayBuffer) {
    parts.push(value);
  } else if (isBlobLike(value)) {
    parts.push(value instanceof Blob ? value : await value.arrayBuffer());
  } else if (isAsyncIterable(value)) {
    for await (const chunk of value) {
      parts.push(...await getBytes(chunk));
    }
  } else {
    const constructor = value?.constructor?.name;
    throw new Error(`Unexpected data type: ${typeof value}${constructor ? `; constructor: ${constructor}` : ""}${propsForError(value)}`);
  }
  return parts;
}
function propsForError(value) {
  if (typeof value !== "object" || value === null)
    return "";
  const props = Object.getOwnPropertyNames(value);
  return `; props: [${props.map((p) => `"${p}"`).join(", ")}]`;
}
var isBlobLike, isFileLike, isResponseLike;
var init_to_file = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/to-file.mjs"() {
    init_uploads();
    init_uploads();
    isBlobLike = (value) => value != null && typeof value === "object" && typeof value.size === "number" && typeof value.type === "string" && typeof value.text === "function" && typeof value.slice === "function" && typeof value.arrayBuffer === "function";
    isFileLike = (value) => value != null && typeof value === "object" && typeof value.name === "string" && typeof value.lastModified === "number" && isBlobLike(value);
    isResponseLike = (value) => value != null && typeof value === "object" && typeof value.url === "string" && typeof value.blob === "function";
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/uploads.mjs
var init_uploads2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/uploads.mjs"() {
    init_to_file();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/shared.mjs
var init_shared = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/shared.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/resource.mjs
var APIResource;
var init_resource = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/core/resource.mjs"() {
    APIResource = class {
      constructor(client) {
        this._client = client;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/headers.mjs
function* iterateHeaders(headers) {
  if (!headers)
    return;
  if (brand_privateNullableHeaders in headers) {
    const { values, nulls } = headers;
    yield* values.entries();
    for (const name of nulls) {
      yield [name, null];
    }
    return;
  }
  let shouldClear = false;
  let iter;
  if (headers instanceof Headers) {
    iter = headers.entries();
  } else if (isReadonlyArray(headers)) {
    iter = headers;
  } else {
    shouldClear = true;
    iter = Object.entries(headers ?? {});
  }
  for (let row of iter) {
    const name = row[0];
    if (typeof name !== "string")
      throw new TypeError("expected header name to be a string");
    const values = isReadonlyArray(row[1]) ? row[1] : [row[1]];
    let didClear = false;
    for (const value of values) {
      if (value === void 0)
        continue;
      if (shouldClear && !didClear) {
        didClear = true;
        yield [name, clearSentinel];
      }
      yield [name, value];
    }
  }
}
var brand_privateNullableHeaders, clearSentinel, APPEND_HEADERS, appendHeaderValue, buildHeaders;
var init_headers = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/headers.mjs"() {
    init_values();
    brand_privateNullableHeaders = /* @__PURE__ */ Symbol.for("brand.privateNullableHeaders");
    clearSentinel = /* @__PURE__ */ Symbol("clear");
    APPEND_HEADERS = /* @__PURE__ */ new Set(["x-stainless-helper"]);
    appendHeaderValue = (existing, addition) => {
      const tokens = existing ? existing.split(",").map((t) => t.trim()).filter(Boolean) : [];
      for (const tok of addition.split(",").map((t) => t.trim())) {
        if (tok && !tokens.includes(tok))
          tokens.push(tok);
      }
      return tokens.join(", ");
    };
    buildHeaders = (newHeaders) => {
      const targetHeaders = new Headers();
      const nullHeaders = /* @__PURE__ */ new Set();
      for (const headers of newHeaders) {
        const seenHeaders = /* @__PURE__ */ new Set();
        for (const [name, value] of iterateHeaders(headers)) {
          const lowerName = name.toLowerCase();
          if (APPEND_HEADERS.has(lowerName)) {
            if (value === clearSentinel)
              continue;
            if (value === null) {
              targetHeaders.delete(name);
              nullHeaders.add(lowerName);
            } else {
              targetHeaders.set(name, appendHeaderValue(targetHeaders.get(name), value));
              nullHeaders.delete(lowerName);
            }
            continue;
          }
          if (value === clearSentinel || !seenHeaders.has(lowerName)) {
            targetHeaders.delete(name);
            seenHeaders.add(lowerName);
            if (value === clearSentinel)
              continue;
          }
          if (value === null) {
            targetHeaders.delete(name);
            nullHeaders.add(lowerName);
          } else {
            targetHeaders.append(name, value);
            nullHeaders.delete(lowerName);
          }
        }
      }
      return { [brand_privateNullableHeaders]: true, values: targetHeaders, nulls: nullHeaders };
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/path.mjs
function encodeURIPath(str) {
  return str.replace(/[^A-Za-z0-9\-._~!$&'()*+,;=:@]+/g, encodeURIComponent);
}
var EMPTY, createPathTagFunction, path2;
var init_path = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/path.mjs"() {
    init_error();
    EMPTY = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.create(null));
    createPathTagFunction = (pathEncoder = encodeURIPath) => function path4(statics, ...params) {
      if (statics.length === 1)
        return statics[0];
      let postPath = false;
      const invalidSegments = [];
      const path5 = statics.reduce((previousValue, currentValue, index) => {
        if (/[?#]/.test(currentValue)) {
          postPath = true;
        }
        const value = params[index];
        let encoded = (postPath ? encodeURIComponent : pathEncoder)("" + value);
        if (index !== params.length && (value == null || typeof value === "object" && // handle values from other realms
        value.toString === Object.getPrototypeOf(Object.getPrototypeOf(value.hasOwnProperty ?? EMPTY) ?? EMPTY)?.toString)) {
          encoded = value + "";
          invalidSegments.push({
            start: previousValue.length + currentValue.length,
            length: encoded.length,
            error: `Value of type ${Object.prototype.toString.call(value).slice(8, -1)} is not a valid path parameter`
          });
        }
        return previousValue + currentValue + (index === params.length ? "" : encoded);
      }, "");
      const pathOnly = path5.split(/[?#]/, 1)[0];
      const invalidSegmentPattern = /(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi;
      let match;
      while ((match = invalidSegmentPattern.exec(pathOnly)) !== null) {
        invalidSegments.push({
          start: match.index,
          length: match[0].length,
          error: `Value "${match[0]}" can't be safely passed as a path parameter`
        });
      }
      invalidSegments.sort((a, b) => a.start - b.start);
      if (invalidSegments.length > 0) {
        let lastEnd = 0;
        const underline = invalidSegments.reduce((acc, segment) => {
          const spaces = " ".repeat(segment.start - lastEnd);
          const arrows = "^".repeat(segment.length);
          lastEnd = segment.start + segment.length;
          return acc + spaces + arrows;
        }, "");
        throw new AnthropicError(`Path parameters result in path with invalid segments:
${invalidSegments.map((e) => e.error).join("\n")}
${path5}
${underline}`);
      }
      return path5;
    };
    path2 = /* @__PURE__ */ createPathTagFunction(encodeURIPath);
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/deployment-runs.mjs
var DeploymentRuns;
var init_deployment_runs = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/deployment-runs.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    DeploymentRuns = class extends APIResource {
      /**
       * Get Deployment Run
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeploymentRun =
       *   await client.beta.deploymentRuns.retrieve(
       *     'deployment_run_id',
       *   );
       * ```
       */
      retrieve(deploymentRunID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/deployment_runs/${deploymentRunID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Deployment Runs
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsDeploymentRun of client.beta.deploymentRuns.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/deployment_runs?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/deployments.mjs
var Deployments;
var init_deployments = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/deployments.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Deployments = class extends APIResource {
      /**
       * Create Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.create({
       *     agent: 'string',
       *     environment_id: 'x',
       *     initial_events: [
       *       {
       *         content: [
       *           {
       *             text: 'Where is my order #1234?',
       *             type: 'text',
       *           },
       *         ],
       *         type: 'user.message',
       *       },
       *     ],
       *     name: 'x',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/deployments?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.retrieve(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      retrieve(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/deployments/${deploymentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.update(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      update(deploymentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/deployments/${deploymentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Deployments
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsDeployment of client.beta.deployments.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/deployments?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.archive(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      archive(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/deployments/${deploymentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Pause Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.pause(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      pause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/deployments/${deploymentID}/pause?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Run Deployment Now
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeploymentRun =
       *   await client.beta.deployments.run(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      run(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/deployments/${deploymentID}/run?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Unpause Deployment
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeployment =
       *   await client.beta.deployments.unpause(
       *     'depl_011CZkZcDH3vPqd7xnEfwTai',
       *   );
       * ```
       */
      unpause(deploymentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/deployments/${deploymentID}/unpause?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/dreams.mjs
var Dreams;
var init_dreams = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/dreams.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Dreams = class extends APIResource {
      /**
       * Create a Dream
       *
       * @example
       * ```ts
       * const betaDream = await client.beta.dreams.create({
       *   inputs: [{ memory_store_id: 'x', type: 'memory_store' }],
       *   model: 'string',
       * });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/dreams?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "dreaming-2026-04-21"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get a Dream
       *
       * @example
       * ```ts
       * const betaDream = await client.beta.dreams.retrieve(
       *   'dream_id',
       * );
       * ```
       */
      retrieve(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/dreams/${dreamID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "dreaming-2026-04-21"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Dreams
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaDream of client.beta.dreams.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/dreams?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "dreaming-2026-04-21"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive a Dream
       *
       * @example
       * ```ts
       * const betaDream = await client.beta.dreams.archive(
       *   'dream_id',
       * );
       * ```
       */
      archive(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/dreams/${dreamID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "dreaming-2026-04-21"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Cancel a Dream
       *
       * @example
       * ```ts
       * const betaDream = await client.beta.dreams.cancel(
       *   'dream_id',
       * );
       * ```
       */
      cancel(dreamID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/dreams/${dreamID}/cancel?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "dreaming-2026-04-21"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/stainless-helper-header.mjs
function helperHeader(value) {
  return { [STAINLESS_HELPER_HEADER]: value };
}
function wasCreatedByStainlessHelper(value) {
  return typeof value === "object" && value !== null && SDK_HELPER_SYMBOL in value;
}
function collectStainlessHelpers(tools, messages) {
  const helpers = /* @__PURE__ */ new Set();
  if (tools) {
    for (const tool of tools) {
      if (wasCreatedByStainlessHelper(tool)) {
        helpers.add(tool[SDK_HELPER_SYMBOL]);
      }
    }
  }
  if (messages) {
    for (const message of messages) {
      if (wasCreatedByStainlessHelper(message)) {
        helpers.add(message[SDK_HELPER_SYMBOL]);
      }
      const content = message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (wasCreatedByStainlessHelper(block)) {
            helpers.add(block[SDK_HELPER_SYMBOL]);
          }
        }
      }
    }
  }
  return Array.from(helpers);
}
function stainlessHelperHeader(tools, messages) {
  const helpers = collectStainlessHelpers(tools, messages);
  if (helpers.length === 0)
    return {};
  return { [STAINLESS_HELPER_HEADER]: helpers.join(", ") };
}
function stainlessHelperHeaderFromFile(file) {
  if (wasCreatedByStainlessHelper(file)) {
    return { [STAINLESS_HELPER_HEADER]: file[SDK_HELPER_SYMBOL] };
  }
  return {};
}
var STAINLESS_HELPER_HEADER, STAINLESS_HELPER_METHOD_HEADER, SDK_HELPER_SYMBOL;
var init_stainless_helper_header = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/stainless-helper-header.mjs"() {
    STAINLESS_HELPER_HEADER = "x-stainless-helper";
    STAINLESS_HELPER_METHOD_HEADER = "x-stainless-helper-method";
    SDK_HELPER_SYMBOL = /* @__PURE__ */ Symbol("anthropic.sdk.stainlessHelper");
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/files.mjs
var Files;
var init_files = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/files.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_stainless_helper_header();
    init_uploads();
    init_path();
    Files = class extends APIResource {
      /**
       * List Files
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaFileMetadata of client.beta.files.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/files?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Delete File
       *
       * @example
       * ```ts
       * const betaDeletedFile = await client.beta.files.delete(
       *   'file_id',
       * );
       * ```
       */
      delete(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/files/${fileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Download File
       *
       * @example
       * ```ts
       * const response = await client.beta.files.download(
       *   'file_id',
       * );
       *
       * const content = await response.blob();
       * console.log(content);
       * ```
       */
      download(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/files/${fileID}/content?beta=true`, {
          ...options,
          headers: buildHeaders([
            {
              Accept: "application/binary",
              ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0
            },
            options?.headers
          ]),
          __binaryResponse: true
        });
      }
      /**
       * Get File Metadata
       *
       * @example
       * ```ts
       * const betaFileMetadata =
       *   await client.beta.files.retrieveMetadata('file_id');
       * ```
       */
      retrieveMetadata(fileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/files/${fileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Upload File
       *
       * @example
       * ```ts
       * const betaFileMetadata = await client.beta.files.upload({
       *   file: fs.createReadStream('path/to/file'),
       * });
       * ```
       */
      upload(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/files?beta=true", multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            stainlessHelperHeaderFromFile(body.file),
            options?.headers
          ])
        }, this._client));
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/models.mjs
var Models;
var init_models = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/models.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Models = class extends APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       *
       * @example
       * ```ts
       * const betaModelInfo = await client.beta.models.retrieve(
       *   'model_id',
       * );
       * ```
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/models/${modelID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaModelInfo of client.beta.models.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models?beta=true", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/user-profiles.mjs
var UserProfiles;
var init_user_profiles = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/user-profiles.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    UserProfiles = class extends APIResource {
      /**
       * Create User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.create();
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/user_profiles?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-08-18"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.retrieve(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      retrieve(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/user_profiles/${userProfileID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-08-18"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update User Profile
       *
       * @example
       * ```ts
       * const betaUserProfile =
       *   await client.beta.userProfiles.update(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      update(userProfileID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/user_profiles/${userProfileID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-08-18"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List User Profiles
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaUserProfile of client.beta.userProfiles.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/user_profiles?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-08-18"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Create Enrollment URL
       *
       * @example
       * ```ts
       * const betaUserProfileEnrollmentURL =
       *   await client.beta.userProfiles.createEnrollmentURL(
       *     'uprof_011CZkZCu8hGbp5mYRQgUmz9',
       *   );
       * ```
       */
      createEnrollmentURL(userProfileID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/user_profiles/${userProfileID}/enrollment_url?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "user-profiles-2026-08-18"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/webhooks.mjs
import { Webhook } from "standardwebhooks";
var Webhooks;
var init_webhooks = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/webhooks.mjs"() {
    init_resource();
    Webhooks = class extends APIResource {
      /**
       * Parses a webhook payload into an event without verifying its signature. Prefer
       * `unwrap()` unless you have already verified the signature yourself.
       */
      parseUnverified(body) {
        return JSON.parse(body);
      }
      /**
       * Verifies the webhook signature from the `webhook-id`, `webhook-timestamp` and
       * `webhook-signature` headers using your webhook signing key, then parses the
       * payload into an event. Fails if the signature is missing or invalid.
       */
      unwrap(body, options) {
        const headers = options?.headers;
        if (headers == null)
          throw new Error("Webhook headers are required in order to verify the signature");
        const keyStr = options.key === void 0 ? this._client.webhookKey : options.key;
        if (!keyStr)
          throw new Error("Webhook key must not be null or empty in order to unwrap");
        const wh = new Webhook(keyStr);
        wh.verify(body, headers);
        return JSON.parse(body);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/agents/versions.mjs
var Versions;
var init_versions = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/agents/versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Versions = class extends APIResource {
      /**
       * List Agent Versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsAgent of client.beta.agents.versions.list(
       *   'agent_011CZkYpogX7uDKUyvBTophP',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(agentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/agents/${agentID}/versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/agents/agents.mjs
var Agents;
var init_agents = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/agents/agents.mjs"() {
    init_resource();
    init_versions();
    init_versions();
    init_pagination();
    init_headers();
    init_path();
    Agents = class extends APIResource {
      constructor() {
        super(...arguments);
        this.versions = new Versions(this._client);
      }
      /**
       * Create Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.create({
       *     model: 'claude-opus-5',
       *     name: 'My First Agent',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/agents?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.retrieve(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *   );
       * ```
       */
      retrieve(agentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.get(path2`/v1/agents/${agentID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.update(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *     { description: 'updated' },
       *   );
       * ```
       */
      update(agentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/agents/${agentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Agents
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsAgent of client.beta.agents.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/agents?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Agent
       *
       * @example
       * ```ts
       * const betaManagedAgentsAgent =
       *   await client.beta.agents.archive(
       *     'agent_011CZkYpogX7uDKUyvBTophP',
       *   );
       * ```
       */
      archive(agentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/agents/${agentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Agents.Versions = Versions;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/abort.mjs
function linkAbort(external, controller) {
  if (!external)
    return () => {
    };
  if (external.aborted) {
    controller.abort();
    return () => {
    };
  }
  const onAbort = () => controller.abort();
  external.addEventListener("abort", onAbort);
  return () => external.removeEventListener("abort", onAbort);
}
var init_abort = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/abort.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/backoff.mjs
function isStatus(e, code) {
  return e instanceof APIError && e.status === code;
}
function is4xx(e) {
  return e instanceof APIError && typeof e.status === "number" && e.status >= 400 && e.status < 500;
}
function isFatal4xx(e) {
  return is4xx(e) && !isStatus(e, 408) && !isStatus(e, 409) && !isStatus(e, 429);
}
function backoff(attempt, baseMs, capMs) {
  return Math.min(baseMs * 2 ** attempt, capMs);
}
function jitter(lowMs, highMs) {
  return lowMs + Math.random() * (highMs - lowMs);
}
function applyJitter(ms) {
  return ms * (1 - Math.random() * 0.25);
}
var init_backoff = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/backoff.mjs"() {
    init_error();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/helper-client.mjs
function copyClientForHelper(client, { authToken, helper }) {
  if (!authToken) {
    throw new AnthropicError(`copyClientForHelper: expected a non-empty authToken but received ${JSON.stringify(authToken)}`);
  }
  const internal = client;
  const parentDefaults = internal._options.defaultHeaders;
  const parentAuthExtraHeaders = internal._authState?.extraHeaders;
  const inheritedAuthExtraHeaders = parentAuthExtraHeaders ? Object.fromEntries(Object.entries(parentAuthExtraHeaders).filter(([name]) => {
    const lower = name.toLowerCase();
    return lower !== "authorization" && lower !== "x-api-key";
  })) : void 0;
  const defaultHeaders = buildHeaders([
    inheritedAuthExtraHeaders,
    parentDefaults,
    { [STAINLESS_HELPER_HEADER]: helper }
  ]);
  return client.withOptions({
    apiKey: null,
    authToken,
    baseURL: client.baseURL,
    credentials: void 0,
    defaultHeaders
  });
}
var init_helper_client = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/helper-client.mjs"() {
    init_error();
    init_headers();
    init_stainless_helper_header();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/environments/poller.mjs
function backoff2(attempt) {
  return backoff(attempt, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS);
}
function defaultWorkerId() {
  const env = globalThis.process?.env;
  const host = env?.["HOSTNAME"];
  return host ? `${host}-${uuid4()}` : uuid4();
}
var _WorkPoller_runnerClient, _WorkPoller_consumed, _WorkPoller_controller, _WorkPoller_detachExternal, _WorkPoller_autoStop, _WorkPoller_drain, _WorkPoller_blockMs, _WorkPoller_reclaimOlderThanMs, _WorkPoller_requestOpts, _IdleLog_log, _IdleLog_environmentId, _IdleLog_idleSince, _IdleLog_lastReport, POLL_BLOCK_MS, POLL_BACKOFF_BASE_MS, POLL_BACKOFF_CAP_MS, IDLE_REPORT_INTERVAL_MS, WorkPoller, IdleLog;
var init_poller = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/environments/poller.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_sleep();
    init_uuid();
    init_abort();
    init_headers();
    init_backoff();
    init_helper_client();
    init_backoff();
    POLL_BLOCK_MS = 999;
    POLL_BACKOFF_BASE_MS = 1e3;
    POLL_BACKOFF_CAP_MS = 6e4;
    IDLE_REPORT_INTERVAL_MS = 3e5;
    WorkPoller = class {
      constructor(opts) {
        _WorkPoller_runnerClient.set(this, void 0);
        _WorkPoller_consumed.set(this, false);
        _WorkPoller_controller.set(this, void 0);
        _WorkPoller_detachExternal.set(this, void 0);
        _WorkPoller_autoStop.set(this, void 0);
        _WorkPoller_drain.set(this, void 0);
        _WorkPoller_blockMs.set(this, void 0);
        _WorkPoller_reclaimOlderThanMs.set(this, void 0);
        _WorkPoller_requestOpts.set(this, void 0);
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.workerId = opts.workerId ?? defaultWorkerId();
        __classPrivateFieldSet(this, _WorkPoller_runnerClient, copyClientForHelper(opts.client, {
          authToken: opts.environmentKey,
          helper: "environments-work-poller"
        }), "f");
        __classPrivateFieldSet(this, _WorkPoller_autoStop, opts.autoStop ?? true, "f");
        __classPrivateFieldSet(this, _WorkPoller_drain, opts.drain ?? false, "f");
        __classPrivateFieldSet(this, _WorkPoller_blockMs, opts.blockMs === void 0 ? POLL_BLOCK_MS : opts.blockMs, "f");
        __classPrivateFieldSet(this, _WorkPoller_reclaimOlderThanMs, opts.reclaimOlderThanMs ?? null, "f");
        __classPrivateFieldSet(this, _WorkPoller_requestOpts, opts.requestOptions, "f");
        __classPrivateFieldSet(this, _WorkPoller_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _WorkPoller_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _WorkPoller_controller, "f")), "f");
      }
      /** Read-only view of this iterator's abort signal. */
      get signal() {
        return __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal;
      }
      /** Abort the iterator. The current `for await` will exit cleanly. */
      abort() {
        __classPrivateFieldGet(this, _WorkPoller_controller, "f").abort();
      }
      async *[(_WorkPoller_runnerClient = /* @__PURE__ */ new WeakMap(), _WorkPoller_consumed = /* @__PURE__ */ new WeakMap(), _WorkPoller_controller = /* @__PURE__ */ new WeakMap(), _WorkPoller_detachExternal = /* @__PURE__ */ new WeakMap(), _WorkPoller_autoStop = /* @__PURE__ */ new WeakMap(), _WorkPoller_drain = /* @__PURE__ */ new WeakMap(), _WorkPoller_blockMs = /* @__PURE__ */ new WeakMap(), _WorkPoller_reclaimOlderThanMs = /* @__PURE__ */ new WeakMap(), _WorkPoller_requestOpts = /* @__PURE__ */ new WeakMap(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _WorkPoller_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed WorkPoller");
        }
        __classPrivateFieldSet(this, _WorkPoller_consumed, true, "f");
        const log = loggerFor(this.client);
        log.info("poller starting", {
          component: "work-poller",
          environment_id: this.environmentId
        });
        const idle = new IdleLog(log, this.environmentId);
        try {
          let attempt = 0;
          while (!__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted) {
            let work;
            try {
              work = await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.poll(this.environmentId, {
                "Anthropic-Worker-ID": this.workerId,
                ...__classPrivateFieldGet(this, _WorkPoller_blockMs, "f") !== null ? { block_ms: __classPrivateFieldGet(this, _WorkPoller_blockMs, "f") } : {},
                ...__classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") !== null ? { reclaim_older_than_ms: __classPrivateFieldGet(this, _WorkPoller_reclaimOlderThanMs, "f") } : {}
              }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
            } catch (e) {
              if (__classPrivateFieldGet(this, _WorkPoller_controller, "f").signal.aborted)
                return;
              if (isFatal4xx(e)) {
                log.error("poll failed permanently, stopping poller", { error: String(e) });
                throw e;
              }
              const wait = applyJitter(backoff2(attempt));
              log.warn("poll failed, backing off", { error: String(e), backoff_ms: wait });
              attempt++;
              await sleep(wait, __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
              continue;
            }
            attempt = 0;
            if (work == null) {
              if (__classPrivateFieldGet(this, _WorkPoller_drain, "f"))
                return;
              idle.onEmptyPoll();
              await sleep(jitter(1e3, 3e3), __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal);
              continue;
            }
            idle.onClaim();
            log.info("claimed work", {
              component: "work-poller",
              environment_id: this.environmentId,
              work_id: work.id,
              work_type: work.data.type
            });
            try {
              await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.ack(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]), signal: __classPrivateFieldGet(this, _WorkPoller_controller, "f").signal });
            } catch (e) {
              log.error("ack failed", { work_id: work.id, error: String(e) });
              continue;
            }
            try {
              yield work;
            } finally {
              if (__classPrivateFieldGet(this, _WorkPoller_autoStop, "f")) {
                try {
                  await __classPrivateFieldGet(this, _WorkPoller_runnerClient, "f").beta.environments.work.stop(work.id, { environment_id: work.environment_id }, { headers: buildHeaders([__classPrivateFieldGet(this, _WorkPoller_requestOpts, "f")?.headers]) });
                } catch (e) {
                  if (!isStatus(e, 409))
                    log.warn("stop failed", { work_id: work.id, error: String(e) });
                }
              }
            }
          }
        } finally {
          __classPrivateFieldGet(this, _WorkPoller_detachExternal, "f").call(this);
        }
      }
    };
    IdleLog = class {
      constructor(log, environmentId) {
        _IdleLog_log.set(this, void 0);
        _IdleLog_environmentId.set(this, void 0);
        _IdleLog_idleSince.set(this, void 0);
        _IdleLog_lastReport.set(this, 0);
        __classPrivateFieldSet(this, _IdleLog_log, log, "f");
        __classPrivateFieldSet(this, _IdleLog_environmentId, environmentId, "f");
      }
      onEmptyPoll() {
        const now = Date.now();
        const fields = { component: "work-poller", environment_id: __classPrivateFieldGet(this, _IdleLog_environmentId, "f") };
        if (__classPrivateFieldGet(this, _IdleLog_idleSince, "f") === void 0) {
          __classPrivateFieldSet(this, _IdleLog_idleSince, __classPrivateFieldSet(this, _IdleLog_lastReport, now, "f"), "f");
          __classPrivateFieldGet(this, _IdleLog_log, "f").info("idle; polling for work", fields);
        } else if (now - __classPrivateFieldGet(this, _IdleLog_lastReport, "f") >= IDLE_REPORT_INTERVAL_MS) {
          __classPrivateFieldSet(this, _IdleLog_lastReport, now, "f");
          __classPrivateFieldGet(this, _IdleLog_log, "f").info(`still polling; idle for ${Math.round((now - __classPrivateFieldGet(this, _IdleLog_idleSince, "f")) / 1e3)}s`, fields);
        } else {
          __classPrivateFieldGet(this, _IdleLog_log, "f").debug("poll returned no work", fields);
        }
      }
      onClaim() {
        __classPrivateFieldSet(this, _IdleLog_idleSince, void 0, "f");
      }
    };
    _IdleLog_log = /* @__PURE__ */ new WeakMap(), _IdleLog_environmentId = /* @__PURE__ */ new WeakMap(), _IdleLog_idleSince = /* @__PURE__ */ new WeakMap(), _IdleLog_lastReport = /* @__PURE__ */ new WeakMap();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/async-queue.mjs
var _AsyncQueue_items, _AsyncQueue_waiters, _AsyncQueue_closed, AsyncQueue;
var init_async_queue = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/async-queue.mjs"() {
    init_tslib();
    AsyncQueue = class {
      constructor() {
        _AsyncQueue_items.set(this, []);
        _AsyncQueue_waiters.set(this, []);
        _AsyncQueue_closed.set(this, false);
      }
      /** Enqueue an item, or hand it directly to a waiting reader. Returns `false` once closed. */
      push(item) {
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
          return false;
        const w = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
        if (w)
          w({ done: false, value: item });
        else
          __classPrivateFieldGet(this, _AsyncQueue_items, "f").push(item);
        return true;
      }
      /** Mark the queue done. Idempotent; wakes every pending reader with `done: true`. */
      close() {
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f"))
          return;
        __classPrivateFieldSet(this, _AsyncQueue_closed, true, "f");
        while (__classPrivateFieldGet(this, _AsyncQueue_waiters, "f").length > 0) {
          const w = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").shift();
          w({ done: true, value: void 0 });
        }
      }
      /**
       * Resolve with the next item, or `done: true` once the queue is closed and
       * drained. When `signal` is supplied, aborting it resolves a pending read
       * with `done: true` (cancellation is pushed down here rather than handled by
       * an outer `Promise.race`).
       */
      next(signal) {
        if (__classPrivateFieldGet(this, _AsyncQueue_items, "f").length > 0) {
          return Promise.resolve({ done: false, value: __classPrivateFieldGet(this, _AsyncQueue_items, "f").shift() });
        }
        if (__classPrivateFieldGet(this, _AsyncQueue_closed, "f") || signal?.aborted) {
          return Promise.resolve({ done: true, value: void 0 });
        }
        return new Promise((resolve2) => {
          const waiter = (r) => {
            signal?.removeEventListener("abort", onAbort);
            resolve2(r);
          };
          const onAbort = () => {
            const idx = __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").indexOf(waiter);
            if (idx >= 0)
              __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").splice(idx, 1);
            resolve2({ done: true, value: void 0 });
          };
          __classPrivateFieldGet(this, _AsyncQueue_waiters, "f").push(waiter);
          signal?.addEventListener("abort", onAbort, { once: true });
        });
      }
      /** Synchronously remove and return the next buffered item, or `undefined` if empty. */
      tryShift() {
        return __classPrivateFieldGet(this, _AsyncQueue_items, "f").shift();
      }
    };
    _AsyncQueue_items = /* @__PURE__ */ new WeakMap(), _AsyncQueue_waiters = /* @__PURE__ */ new WeakMap(), _AsyncQueue_closed = /* @__PURE__ */ new WeakMap();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/ToolError.mjs
var ToolError;
var init_ToolError = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/ToolError.mjs"() {
    ToolError = class extends Error {
      constructor(content) {
        const message = typeof content === "string" ? content : content.map((block) => {
          if (block.type === "text")
            return block.text;
          return `[${block.type}]`;
        }).join(" ");
        super(message);
        this.name = "ToolError";
        this.content = content;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/BetaRunnableTool.mjs
function toolName(tool) {
  return "name" in tool ? tool.name : "mcp_server_name" in tool ? tool.mcp_server_name : tool.type;
}
function toolErrorContent(e) {
  return e instanceof ToolError ? e.content : `Error: ${e instanceof Error ? e.message : String(e)}`;
}
async function runRunnableTool(tool, rawInput, context) {
  try {
    const input = tool.parse ? tool.parse(rawInput) : rawInput;
    const content = await tool.run(input, context);
    return { content, isError: false };
  } catch (e) {
    return { content: toolErrorContent(e), isError: true };
  }
}
var init_BetaRunnableTool = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/BetaRunnableTool.mjs"() {
    init_ToolError();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/SessionToolRunner.mjs
function isEndTurnIdle(ev) {
  return ev.type === "session.status_idle" && ev.stop_reason?.type === "end_turn";
}
function buildResultEvent(ev, isError, content) {
  if (ev.type === "agent.custom_tool_use") {
    return { type: "user.custom_tool_result", custom_tool_use_id: ev.id, is_error: isError, content };
  }
  return { type: "user.tool_result", tool_use_id: ev.id, is_error: isError, content };
}
function toSessionContent(content) {
  if (typeof content === "string")
    return [{ type: "text", text: content || "(no output)" }];
  const out = content.map((b) => {
    if (b.type === "text")
      return { type: "text", text: b.text || "(no output)" };
    if (b.type === "image" || b.type === "document")
      return b;
    if (b.type === "search_result") {
      return {
        type: "search_result",
        source: b.source,
        title: b.title,
        content: b.content.map((c) => ({ type: "text", text: c.text })),
        citations: { enabled: b.citations?.enabled ?? false }
      };
    }
    return { type: "text", text: JSON.stringify(b) };
  });
  return out.length > 0 ? out : [{ type: "text", text: "(no output)" }];
}
var _IdleClock_maxIdleMs, _IdleClock_onExpire, _IdleClock_blockers, _IdleClock_armPending, _IdleClock_timer, _SessionToolRunner_instances, _SessionToolRunner_consumed, _SessionToolRunner_controller, _SessionToolRunner_detachExternal, _SessionToolRunner_requestOpts, _SessionToolRunner_toolByName, _SessionToolRunner_logger, _SessionToolRunner_seen, _SessionToolRunner_answered, _SessionToolRunner_confirmationVerdicts, _SessionToolRunner_awaitingConfirmation, _SessionToolRunner_results, _SessionToolRunner_inFlightCount, _SessionToolRunner_sendRetryWindowMs, _SessionToolRunner_onIdle, _SessionToolRunner_idleClock, _SessionToolRunner_requestOptions, _SessionToolRunner_streamLoop, _SessionToolRunner_reconcile, _SessionToolRunner_ingestHistory, _SessionToolRunner_handleStreamEvent, _SessionToolRunner_routeToolEvent, _SessionToolRunner_noteConfirmation, _SessionToolRunner_applyVerdict, _SessionToolRunner_surfaceCall, _SessionToolRunner_execute, _SessionToolRunner_sendResult, _SessionToolRunner_drain, STREAM_BACKOFF_START_MS, STREAM_BACKOFF_CAP_MS, TOOL_TIMEOUT_MS, DRAIN_TIMEOUT_MS, SEND_BACKOFF_START_MS, SEND_BACKOFF_CAP_MS, SEND_RETRY_WINDOW_MS, DEFAULT_MAX_IDLE_MS, IdleClock, SessionToolRunner;
var init_SessionToolRunner = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/SessionToolRunner.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_sleep();
    init_backoff();
    init_abort();
    init_async_queue();
    init_headers();
    init_stainless_helper_header();
    init_BetaRunnableTool();
    STREAM_BACKOFF_START_MS = 500;
    STREAM_BACKOFF_CAP_MS = 1e4;
    TOOL_TIMEOUT_MS = 12e4;
    DRAIN_TIMEOUT_MS = 3e4;
    SEND_BACKOFF_START_MS = 1e3;
    SEND_BACKOFF_CAP_MS = 3e4;
    SEND_RETRY_WINDOW_MS = 5 * 6e4;
    DEFAULT_MAX_IDLE_MS = 6e4;
    IdleClock = class {
      constructor(maxIdleMs, onExpire) {
        _IdleClock_maxIdleMs.set(this, void 0);
        _IdleClock_onExpire.set(this, void 0);
        _IdleClock_blockers.set(this, /* @__PURE__ */ new Set());
        _IdleClock_armPending.set(this, false);
        _IdleClock_timer.set(this, void 0);
        __classPrivateFieldSet(this, _IdleClock_maxIdleMs, maxIdleMs, "f");
        __classPrivateFieldSet(this, _IdleClock_onExpire, onExpire, "f");
      }
      /**
       * Arm on `status_idle{end_turn}`; disarm otherwise. `user.tool_confirmation`
       * is neutral: it signals neither agent activity nor an idle, and its effect
       * on the clock flows through {@link block} / {@link unblock} instead —
       * disarming here would discard the pending arm the verdict is about to
       * settle.
       */
      noteEvent(ev) {
        if (ev.type === "user.tool_confirmation")
          return;
        if (isEndTurnIdle(ev))
          this.arm();
        else
          this.disarm();
      }
      /** Register gated work that must resolve before an idle countdown starts. */
      block(toolUseId) {
        __classPrivateFieldGet(this, _IdleClock_blockers, "f").add(toolUseId);
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== void 0) {
          __classPrivateFieldSet(this, _IdleClock_armPending, true, "f");
          clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
          __classPrivateFieldSet(this, _IdleClock_timer, void 0, "f");
        }
      }
      /**
       * Retire gated work (a no-op for ids never blocked); applies a pending arm —
       * with a fresh full `maxIdleMs` window — once the last blocker retires.
       */
      unblock(toolUseId) {
        __classPrivateFieldGet(this, _IdleClock_blockers, "f").delete(toolUseId);
        if (__classPrivateFieldGet(this, _IdleClock_blockers, "f").size === 0 && __classPrivateFieldGet(this, _IdleClock_armPending, "f"))
          this.arm();
      }
      /**
       * (Re)start the idle countdown — or, while blockers are outstanding, hold
       * the arm pending instead. Stopping then would drop a held call when its
       * verdict later arrives, or cut the runner off before a released call's
       * result can drive the next turn.
       */
      arm() {
        if (__classPrivateFieldGet(this, _IdleClock_maxIdleMs, "f") <= 0)
          return;
        if (__classPrivateFieldGet(this, _IdleClock_blockers, "f").size > 0) {
          __classPrivateFieldSet(this, _IdleClock_armPending, true, "f");
          return;
        }
        __classPrivateFieldSet(this, _IdleClock_armPending, false, "f");
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== void 0)
          clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
        __classPrivateFieldSet(this, _IdleClock_timer, setTimeout(__classPrivateFieldGet(this, _IdleClock_onExpire, "f"), __classPrivateFieldGet(this, _IdleClock_maxIdleMs, "f")), "f");
      }
      /**
       * Cancel the idle countdown and any pending arm. Blockers persist — they
       * track real outstanding work, retired only by {@link unblock}.
       */
      disarm() {
        __classPrivateFieldSet(this, _IdleClock_armPending, false, "f");
        if (__classPrivateFieldGet(this, _IdleClock_timer, "f") !== void 0) {
          clearTimeout(__classPrivateFieldGet(this, _IdleClock_timer, "f"));
          __classPrivateFieldSet(this, _IdleClock_timer, void 0, "f");
        }
      }
    };
    _IdleClock_maxIdleMs = /* @__PURE__ */ new WeakMap(), _IdleClock_onExpire = /* @__PURE__ */ new WeakMap(), _IdleClock_blockers = /* @__PURE__ */ new WeakMap(), _IdleClock_armPending = /* @__PURE__ */ new WeakMap(), _IdleClock_timer = /* @__PURE__ */ new WeakMap();
    SessionToolRunner = class {
      constructor(sessionId, opts) {
        _SessionToolRunner_instances.add(this);
        _SessionToolRunner_consumed.set(this, false);
        _SessionToolRunner_controller.set(this, void 0);
        _SessionToolRunner_detachExternal.set(this, void 0);
        _SessionToolRunner_requestOpts.set(this, void 0);
        _SessionToolRunner_toolByName.set(this, void 0);
        _SessionToolRunner_logger.set(this, void 0);
        _SessionToolRunner_seen.set(this, /* @__PURE__ */ new Set());
        _SessionToolRunner_answered.set(this, /* @__PURE__ */ new Set());
        _SessionToolRunner_confirmationVerdicts.set(this, /* @__PURE__ */ new Map());
        _SessionToolRunner_awaitingConfirmation.set(this, /* @__PURE__ */ new Map());
        _SessionToolRunner_results.set(this, new AsyncQueue());
        _SessionToolRunner_inFlightCount.set(this, 0);
        _SessionToolRunner_sendRetryWindowMs.set(this, SEND_RETRY_WINDOW_MS);
        _SessionToolRunner_onIdle.set(this, null);
        _SessionToolRunner_idleClock.set(this, void 0);
        this.client = opts.client;
        this.sessionId = sessionId;
        this.tools = opts.tools;
        this.maxIdleMs = opts.maxIdleMs ?? DEFAULT_MAX_IDLE_MS;
        __classPrivateFieldSet(this, _SessionToolRunner_logger, loggerFor(opts.client), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_toolByName, new Map(opts.tools.map((t) => [toolName(t), t])), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_controller, new AbortController(), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_detachExternal, linkAbort(opts.signal, __classPrivateFieldGet(this, _SessionToolRunner_controller, "f")), "f");
        __classPrivateFieldSet(this, _SessionToolRunner_requestOpts, opts.requestOptions, "f");
        __classPrivateFieldSet(this, _SessionToolRunner_idleClock, new IdleClock(this.maxIdleMs, () => {
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session idle after end_turn; stopping", {
            component: "session-tool-runner",
            session_id: this.sessionId,
            max_idle_ms: this.maxIdleMs
          });
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
        }), "f");
      }
      /** Read-only view of this runner's abort signal. */
      get signal() {
        return __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal;
      }
      /** Abort the runner. Background tasks will wind down and `for await` will exit cleanly. */
      abort() {
        __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
      }
      /**
       * @internal
       * `EnvironmentWorker` keeps this equal to the lease TTL each heartbeat
       * reports; applies to a send already retrying.
       */
      _setSendRetryWindow(ms) {
        __classPrivateFieldSet(this, _SessionToolRunner_sendRetryWindowMs, ms, "f");
      }
      async *[(_SessionToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_controller = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_detachExternal = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_requestOpts = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_toolByName = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_logger = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_seen = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_answered = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_confirmationVerdicts = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_awaitingConfirmation = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_results = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_inFlightCount = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_sendRetryWindowMs = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_onIdle = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_idleClock = /* @__PURE__ */ new WeakMap(), _SessionToolRunner_instances = /* @__PURE__ */ new WeakSet(), Symbol.asyncIterator)]() {
        if (__classPrivateFieldGet(this, _SessionToolRunner_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed SessionToolRunner");
        }
        __classPrivateFieldSet(this, _SessionToolRunner_consumed, true, "f");
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session tool runner starting", {
          component: "session-tool-runner",
          session_id: this.sessionId
        });
        const streamPromise = __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_streamLoop).call(this).catch((e) => {
          if (!__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal.aborted) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("stream loop failed", { error: String(e) });
          }
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
        });
        try {
          while (true) {
            const next = await __classPrivateFieldGet(this, _SessionToolRunner_results, "f").next(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal);
            if (next.done)
              break;
            yield next.value;
          }
          await streamPromise;
          let pending;
          while ((pending = __classPrivateFieldGet(this, _SessionToolRunner_results, "f").tryShift()) !== void 0) {
            yield pending;
          }
        } finally {
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
          __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
          await streamPromise;
          try {
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_drain).call(this);
          } catch (e) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("drain failed", { error: String(e) });
          }
          __classPrivateFieldGet(this, _SessionToolRunner_results, "f").close();
          for (const t of this.tools) {
            try {
              await t.close?.();
            } catch (e) {
              __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("tool.close failed", { tool: toolName(t), error: String(e) });
            }
          }
          __classPrivateFieldGet(this, _SessionToolRunner_detachExternal, "f").call(this);
        }
      }
    };
    _SessionToolRunner_requestOptions = function _SessionToolRunner_requestOptions2() {
      return {
        ...__classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f"),
        headers: buildHeaders([helperHeader("session-tool-runner"), __classPrivateFieldGet(this, _SessionToolRunner_requestOpts, "f")?.headers]),
        signal: __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal
      };
    }, _SessionToolRunner_streamLoop = // ===== event stream =====
    async function _SessionToolRunner_streamLoop2() {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      let backoff3 = STREAM_BACKOFF_START_MS;
      while (!ctrl.signal.aborted) {
        try {
          const stream2 = await this.client.beta.sessions.events.stream(this.sessionId, {}, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_reconcile).call(this);
          for await (const ev of stream2) {
            backoff3 = STREAM_BACKOFF_START_MS;
            if (await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_handleStreamEvent).call(this, ev))
              return;
          }
        } catch (e) {
          ctrl.signal.throwIfAborted();
          if (isFatal4xx(e)) {
            __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("permanent stream failure, shutting down", { error: String(e) });
            ctrl.abort();
            throw e;
          }
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("stream disconnected, reconnecting", {
            error: String(e),
            backoff_ms: backoff3
          });
        }
        ctrl.signal.throwIfAborted();
        await sleep(backoff3, ctrl.signal);
        backoff3 = Math.min(backoff3 * 2, STREAM_BACKOFF_CAP_MS);
      }
    }, _SessionToolRunner_reconcile = /**
     * Read full history before dispatching so a `tool_use` whose result appears
     * later in the same history is not re-executed. Runs after the live stream is
     * already attached (see {@link SessionToolRunner.#streamLoop}).
     */
    async function _SessionToolRunner_reconcile2() {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      const pending = [];
      let lastWasEndTurn = false;
      try {
        for await (const ev of this.client.beta.sessions.events.list(this.sessionId, { limit: 1e3 }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this))) {
          __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_ingestHistory).call(this, ev, pending);
          lastWasEndTurn = isEndTurnIdle(ev);
        }
      } catch (e) {
        ctrl.signal.throwIfAborted();
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("reconcile list failed", { error: String(e) });
        for (const ev of pending)
          __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").delete(ev.id);
        return;
      }
      const unanswered = pending.filter((ev) => !__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id));
      __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
      for (const ev of unanswered)
        await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_routeToolEvent).call(this, ev);
      for (const held of [...__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").values()]) {
        const verdict = __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").get(held.id);
        if (verdict !== void 0)
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, held, verdict);
      }
      const outstanding = unanswered.filter((ev) => !__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id) && !__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").has(ev.id));
      if (lastWasEndTurn && outstanding.length === 0)
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").arm();
      else
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").disarm();
    }, _SessionToolRunner_ingestHistory = function _SessionToolRunner_ingestHistory2(ev, pending) {
      if (ev.type === "agent.tool_use" || ev.type === "agent.custom_tool_use") {
        __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
        if (!__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
          pending.push(ev);
      } else if (ev.type === "user.tool_result") {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
      } else if (ev.type === "user.custom_tool_result") {
        __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
      } else if (ev.type === "user.tool_confirmation") {
        if (!__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.tool_use_id))
          __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").set(ev.tool_use_id, ev.result);
      }
    }, _SessionToolRunner_handleStreamEvent = /** Returns true when the runner should exit. */
    async function _SessionToolRunner_handleStreamEvent2(ev) {
      __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").noteEvent(ev);
      switch (ev.type) {
        case "agent.tool_use":
        case "agent.custom_tool_use":
          if (!__classPrivateFieldGet(this, _SessionToolRunner_seen, "f").has(ev.id)) {
            __classPrivateFieldGet(this, _SessionToolRunner_seen, "f").add(ev.id);
            await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_routeToolEvent).call(this, ev);
          }
          return false;
        case "user.tool_confirmation":
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_noteConfirmation).call(this, ev);
          return false;
        case "user.tool_result":
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.tool_use_id);
          return false;
        case "user.custom_tool_result":
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.custom_tool_use_id);
          return false;
        case "session.status_terminated":
        case "session.deleted":
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("session terminated", {
            component: "session-tool-runner",
            session_id: this.sessionId
          });
          __classPrivateFieldGet(this, _SessionToolRunner_controller, "f").abort();
          return true;
        default:
          return false;
      }
    }, _SessionToolRunner_routeToolEvent = // ===== confirmation gating (always_ask tools) =====
    /**
     * Dispatch `ev`, honoring its evaluated permission. A call the server gated
     * (`evaluated_permission == "ask"`) is held until its `user.tool_confirmation`
     * arrives. Fails closed: only an explicit `allow` verdict releases a gated
     * call; a server-side `deny` overrides any recorded verdict; an unrecognized
     * permission is held like `ask` and an unrecognized verdict is denied.
     */
    async function _SessionToolRunner_routeToolEvent2(ev) {
      const permission = ev.evaluated_permission;
      const verdict = permission === "deny" ? "deny" : __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").get(ev.id);
      if (verdict === void 0) {
        if (permission === void 0 || permission === "allow") {
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev, void 0);
        } else if (!__classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").has(ev.id)) {
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("tool call awaiting confirmation; holding", {
            component: "session-tool-runner",
            session_id: this.sessionId,
            tool: ev.name,
            tool_use_id: ev.id
          });
          __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").set(ev.id, ev);
          __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").block(ev.id);
        }
        return;
      }
      await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, ev, verdict);
    }, _SessionToolRunner_noteConfirmation = /** Record an allow/deny verdict and release the held call it gates, if any. */
    async function _SessionToolRunner_noteConfirmation2(ev) {
      __classPrivateFieldGet(this, _SessionToolRunner_confirmationVerdicts, "f").set(ev.tool_use_id, ev.result);
      const held = __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").get(ev.tool_use_id);
      if (held === void 0)
        return;
      await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_applyVerdict).call(this, held, ev.result);
    }, _SessionToolRunner_applyVerdict = /**
     * Dispatch or resolve a gated call according to its verdict.
     *
     * The idle-clock blocker accounting lives here: a denial retires the held
     * call's blocker, while an allow keeps one on the call — taking it now if the
     * verdict was already known when the call was routed, so it was never held —
     * until `#execute` has finished with it. The countdown must not run over
     * gated work that is still in flight.
     */
    async function _SessionToolRunner_applyVerdict2(ev, verdict) {
      const wasHeld = __classPrivateFieldGet(this, _SessionToolRunner_awaitingConfirmation, "f").delete(ev.id);
      if (verdict === "allow") {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("tool call confirmed", {
          component: "session-tool-runner",
          session_id: this.sessionId,
          tool: ev.name,
          tool_use_id: ev.id
        });
        if (!wasHeld)
          __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").block(ev.id);
        try {
          await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_execute).call(this, ev, "allow");
        } finally {
          __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").unblock(ev.id);
        }
        return;
      }
      if (wasHeld)
        __classPrivateFieldGet(this, _SessionToolRunner_idleClock, "f").unblock(ev.id);
      __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(ev.id);
      __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("tool call denied; not executing", {
        component: "session-tool-runner",
        session_id: this.sessionId,
        tool: ev.name,
        tool_use_id: ev.id
      });
      __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
        event: ev,
        toolUseId: ev.id,
        name: ev.name,
        isError: false,
        posted: false,
        confirmation: "deny"
      });
    }, _SessionToolRunner_surfaceCall = function _SessionToolRunner_surfaceCall2(call) {
      __classPrivateFieldGet(this, _SessionToolRunner_results, "f").push(call);
    }, _SessionToolRunner_execute = // ===== tool execution =====
    async function _SessionToolRunner_execute2(ev, confirmation) {
      var _a2, _b;
      if (__classPrivateFieldGet(this, _SessionToolRunner_answered, "f").has(ev.id))
        return;
      __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("executing tool", {
        component: "session-tool-runner",
        session_id: this.sessionId,
        tool: ev.name,
        tool_use_id: ev.id
      });
      __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_a2 = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _a2++, _a2), "f");
      try {
        const tool = __classPrivateFieldGet(this, _SessionToolRunner_toolByName, "f").get(ev.name);
        if (!tool) {
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").info("tool not owned by this runner; leaving the tool_use_id pending for its owner", {
            component: "session-tool-runner",
            session_id: this.sessionId,
            tool: ev.name,
            tool_use_id: ev.id
          });
          __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
            event: ev,
            toolUseId: ev.id,
            name: ev.name,
            isError: false,
            posted: false,
            confirmation
          });
          return;
        }
        let content;
        let isError;
        const toolCtrl = new AbortController();
        const detachTool = linkAbort(__classPrivateFieldGet(this, _SessionToolRunner_controller, "f").signal, toolCtrl);
        const timer = setTimeout(() => toolCtrl.abort(), TOOL_TIMEOUT_MS);
        try {
          const outcome = await runRunnableTool(tool, ev.input, {
            toolUse: ev,
            toolUseBlock: ev,
            signal: toolCtrl.signal
          });
          content = outcome.content;
          isError = outcome.isError;
        } finally {
          clearTimeout(timer);
          detachTool();
        }
        const result = buildResultEvent(ev, isError, toSessionContent(content));
        const posted = await __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_sendResult).call(this, result, ev.id);
        __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_surfaceCall).call(this, {
          event: ev,
          result,
          toolUseId: ev.id,
          name: ev.name,
          isError,
          posted,
          confirmation
        });
      } finally {
        __classPrivateFieldSet(this, _SessionToolRunner_inFlightCount, (_b = __classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f"), _b--, _b), "f");
        if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
          __classPrivateFieldGet(this, _SessionToolRunner_onIdle, "f")?.call(this);
      }
    }, _SessionToolRunner_sendResult = async function _SessionToolRunner_sendResult2(result, toolUseId) {
      const ctrl = __classPrivateFieldGet(this, _SessionToolRunner_controller, "f");
      const start = Date.now();
      let lastErr;
      let attempt = 0;
      while (true) {
        attempt++;
        ctrl.signal.throwIfAborted();
        try {
          await this.client.beta.sessions.events.send(this.sessionId, { events: [result] }, __classPrivateFieldGet(this, _SessionToolRunner_instances, "m", _SessionToolRunner_requestOptions).call(this));
          __classPrivateFieldGet(this, _SessionToolRunner_answered, "f").add(toolUseId);
          return true;
        } catch (e) {
          lastErr = e;
          if (isFatal4xx(e))
            break;
          const remainingMs = __classPrivateFieldGet(this, _SessionToolRunner_sendRetryWindowMs, "f") - (Date.now() - start);
          if (remainingMs <= 0)
            break;
          const waitMs = Math.min(applyJitter(backoff(attempt - 1, SEND_BACKOFF_START_MS, SEND_BACKOFF_CAP_MS)), remainingMs);
          __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("tool result send failed; retrying", {
            tool_use_id: toolUseId,
            attempt,
            backoff_ms: waitMs,
            error: String(e)
          });
          await sleep(waitMs, ctrl.signal);
        }
      }
      __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").error("failed to send tool result", {
        tool_use_id: toolUseId,
        attempts: attempt,
        error: String(lastErr)
      });
      return false;
    }, _SessionToolRunner_drain = /** Wait (bounded) for in-flight tool executions to finish during teardown. */
    async function _SessionToolRunner_drain2() {
      if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") === 0)
        return;
      await Promise.race([new Promise((r) => __classPrivateFieldSet(this, _SessionToolRunner_onIdle, r, "f")), sleep(DRAIN_TIMEOUT_MS)]);
      __classPrivateFieldSet(this, _SessionToolRunner_onIdle, null, "f");
      if (__classPrivateFieldGet(this, _SessionToolRunner_inFlightCount, "f") > 0) {
        __classPrivateFieldGet(this, _SessionToolRunner_logger, "f").warn("drain timeout exceeded");
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/sync-interval.mjs
function checkMemorySyncInterval(ms, option) {
  if (!(ms >= MIN_MEMORY_SYNC_INTERVAL_MS)) {
    throw new AnthropicError(`${option} must be at least ${MIN_MEMORY_SYNC_INTERVAL_MS}ms (got ${ms}); to run without memory sync, pass \`memorySyncIntervalMs: null\` to the worker instead`);
  }
}
var DEFAULT_MEMORY_SYNC_INTERVAL_MS, MIN_MEMORY_SYNC_INTERVAL_MS;
var init_sync_interval = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/sync-interval.mjs"() {
    init_error();
    DEFAULT_MEMORY_SYNC_INTERVAL_MS = 15e3;
    MIN_MEMORY_SYNC_INTERVAL_MS = 5e3;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs
var init_transform_json_schema = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/transform-json-schema.mjs"() {
    init_utils2();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/helpers/beta/json-schema.mjs
function betaTool(options) {
  if (options.inputSchema.type !== "object") {
    throw new Error(`JSON schema for tool "${options.name}" must be an object, but got ${options.inputSchema.type}`);
  }
  return {
    type: "custom",
    name: options.name,
    input_schema: options.inputSchema,
    description: options.description,
    run: options.run,
    parse: (content) => content,
    ...options.close ? { close: options.close } : {}
  };
}
var init_json_schema = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/helpers/beta/json-schema.mjs"() {
    init_index();
    init_transform_json_schema();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/promise.mjs
function promiseWithResolvers() {
  let resolve2;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve2 = res;
    reject = rej;
  });
  return { promise, resolve: resolve2, reject };
}
var init_promise = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/utils/promise.mjs"() {
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/fs-util.mjs
function isWithin(root, p) {
  const rel = path.relative(root, p);
  return rel === "" || !rel.startsWith(".." + path.sep) && rel !== ".." && !path.isAbsolute(rel);
}
async function containingRoot(roots, target) {
  for (const root of roots) {
    if (isWithin(await canonicalize(path.resolve(root)), target))
      return root;
  }
  return void 0;
}
function errnoCode(err) {
  const code = err?.code;
  return typeof code === "string" ? code : void 0;
}
async function canonicalize(abs) {
  const tail = [];
  let prefix = abs;
  let hops = 0;
  for (; ; ) {
    let real;
    try {
      real = await fs2.realpath(prefix);
    } catch (realpathErr) {
      let isLink;
      try {
        isLink = (await fs2.lstat(prefix)).isSymbolicLink();
      } catch (lstatErr) {
        const code = errnoCode(lstatErr);
        if (code !== "ENOENT" && code !== "ENOTDIR")
          throw lstatErr;
        const parent = path.dirname(prefix);
        if (parent === prefix)
          throw lstatErr;
        tail.push(path.basename(prefix));
        prefix = parent;
        continue;
      }
      if (!isLink)
        throw realpathErr;
      if (++hops > MAX_SYMLINK_HOPS) {
        throw Object.assign(new Error("too many levels of symbolic links"), { code: "ELOOP" });
      }
      prefix = path.resolve(path.dirname(prefix), await fs2.readlink(prefix));
      continue;
    }
    return tail.length ? path.join(real, ...tail.reverse()) : real;
  }
}
async function confineToRoot(root, p, opts) {
  const allowedRoots = opts?.allowedRoots ?? [];
  const realRoot = await canonicalize(path.resolve(root));
  let real;
  try {
    real = await canonicalize(path.resolve(realRoot, p));
  } catch (err) {
    throw new ToolError(fsErrorMessage(err, `path ${JSON.stringify(p)}`));
  }
  if (isWithin(realRoot, real) || await containingRoot(allowedRoots, real) !== void 0) {
    return real;
  }
  const permitted = allowedRoots.length ? "the session's working directory and its other permitted directories" : "the session's working directory";
  throw new ToolError(`path ${JSON.stringify(p)} is outside ${permitted}`);
}
async function atomicWriteFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tempPath = path.join(dir, `.tmp-${process.pid}-${crypto.randomUUID()}`);
  let handle;
  try {
    handle = await fs2.open(tempPath, "wx", FILE_CREATE_MODE);
    await handle.writeFile(content, "utf-8");
    await handle.sync();
    await handle.close();
    handle = void 0;
    await fs2.rename(tempPath, targetPath);
  } catch (err) {
    if (handle)
      await handle.close().catch(() => {
      });
    await fs2.unlink(tempPath).catch(() => {
    });
    throw err;
  }
}
function fsErrorMessage(err, file) {
  const code = errnoCode(err);
  switch (code) {
    case "ENOENT":
      return `${file}: no such file or directory`;
    case "EACCES":
    case "EPERM":
      return `${file}: permission denied`;
    case "ENOTDIR":
      return `${file}: not a directory`;
    case "EISDIR":
      return `${file}: is a directory`;
    case "ELOOP":
      return `${file}: too many levels of symbolic links`;
    case "ENAMETOOLONG":
      return `${file}: file name too long`;
    case "ENOSPC":
      return `${file}: no space left on device`;
    case "EMFILE":
    case "ENFILE":
      return `${file}: too many open files`;
    default:
      return `${file}: ${code !== void 0 ? `i/o error (${code})` : "i/o error"}`;
  }
}
var fs2, DIR_CREATE_MODE, FILE_CREATE_MODE, MAX_SYMLINK_HOPS;
var init_fs_util = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/fs-util.mjs"() {
    init_node();
    init_ToolError();
    fs2 = fs.promises;
    DIR_CREATE_MODE = 493;
    FILE_CREATE_MODE = 420;
    MAX_SYMLINK_HOPS = 40;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/skills.mjs
async function setupSkills(ctx) {
  const { client, sessionId } = ctx;
  if (!client)
    return async () => {
    };
  const log = loggerFor(client);
  let session = ctx.session;
  if (!session) {
    if (sessionId === void 0)
      return async () => {
      };
    log.warn("AgentToolContext.sessionId is deprecated and costs an extra session fetch; fetch the session once and set `session` instead", { component: "agent-tool-context" });
    session = await client.beta.sessions.retrieve(sessionId);
  }
  const skillsRoot = path.resolve(ctx.workdir, "skills");
  const created = [];
  for (const skill of session.agent.skills) {
    try {
      const version = await client.beta.skills.versions.retrieve(skill.version, { skill_id: skill.skill_id });
      let dirname2 = path.basename(version.name.trim());
      if (dirname2 === "" || dirname2 === "." || dirname2 === "..")
        dirname2 = skill.skill_id;
      const dest = path.resolve(skillsRoot, dirname2);
      if (dest !== skillsRoot && !dest.startsWith(skillsRoot + path.sep)) {
        log.warn("skill name escapes the skills dir; skipping", {
          component: "agent-tool-context",
          name: version.name
        });
        continue;
      }
      const resp = await client.beta.skills.versions.download(version.id, { skill_id: skill.skill_id });
      await fs3.rm(dest, { recursive: true, force: true });
      await fs3.mkdir(dest, { recursive: true, mode: DIR_CREATE_MODE });
      created.push(dest);
      await extractSkillArchive(resp, dest);
      log.info("downloaded skill", {
        component: "agent-tool-context",
        skill_id: skill.skill_id,
        version: version.id,
        dest
      });
    } catch (e) {
      log.warn("failed to download skill", {
        component: "agent-tool-context",
        skill_id: skill.skill_id,
        error: String(e)
      });
    }
  }
  return async () => {
    for (const dest of created) {
      await fs3.rm(dest, { recursive: true, force: true }).catch((e) => {
        log.warn("failed to clean up skill", { component: "agent-tool-context", dest, error: String(e) });
      });
    }
  };
}
function assertSafeMemberNames(names) {
  for (const raw of names) {
    const entry = raw.trim();
    if (!entry)
      continue;
    if (path.isAbsolute(entry) || entry.split(/[\\/]/).includes("..")) {
      throw new AnthropicError(`refusing to extract unsafe archive member: ${entry}`);
    }
  }
}
function listingLines(listing) {
  const lines = listing.split("\n");
  if (lines[lines.length - 1] === "")
    lines.pop();
  return lines;
}
function canExcludeVerbatim(cmd, name) {
  return /^[\x20-\x7E]+$/.test(name) && !/[\\^#]/.test(name) && !(cmd === "unzip" && name.startsWith("-"));
}
function classifyArchiveListing(cmd, names, typed) {
  const nameLines = listingLines(names);
  const typedLines = listingLines(typed);
  if (nameLines.length !== typedLines.length)
    throw new AnthropicError(INCONSISTENT_LISTING);
  const plain = [];
  const special = [];
  nameLines.forEach((name, i) => {
    if (PLAIN_TYPE_CHARS[cmd].has(typedLines[i].charAt(0))) {
      plain.push(name);
      return;
    }
    if (!canExcludeVerbatim(cmd, name)) {
      throw new AnthropicError(`refusing to extract archive: cannot safely exclude member ${JSON.stringify(name)}`);
    }
    special.push(name);
  });
  return { plain, special };
}
async function assertOnlyPlainEntries(dir) {
  for (const entry of await fs3.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory())
      await assertOnlyPlainEntries(path.join(dir, entry.name));
    else if (!entry.isFile())
      throw new AnthropicError(INCONSISTENT_LISTING);
  }
}
async function runArchiveTool(cmd, args) {
  try {
    const { stdout } = await execFileAsync(cmd, args);
    return stdout;
  } catch (e) {
    if (errnoCode(e) === "ENOENT") {
      throw new AnthropicError(`skill extraction requires the \`${cmd}\` command, but it was not found on PATH`);
    }
    throw e;
  }
}
function archiveTopDir(names) {
  let top;
  let nested = false;
  for (const raw of names) {
    const parts = raw.trim().split("/").filter((p) => p !== "" && p !== ".");
    if (parts.length === 0)
      continue;
    const first = parts[0];
    if (top === void 0)
      top = first;
    else if (first !== top)
      return "";
    if (parts.length > 1)
      nested = true;
  }
  return top !== void 0 && nested ? top : "";
}
async function extractSkillArchive(resp, dest) {
  const tmp = path.join(dest, `.skill-archive-${process.pid}-${Date.now()}`);
  if (!resp.body) {
    throw new AnthropicError("skill download response had no body");
  }
  await stream.promises.pipeline(stream.Readable.fromWeb(resp.body), fs.createWriteStream(tmp));
  const stage = path.join(path.dirname(dest), `.skill-stage-${process.pid}-${Date.now()}`);
  const excludeFile = path.join(path.dirname(dest), `.skill-exclude-${process.pid}-${Date.now()}`);
  try {
    const head = await readHead(tmp, 4);
    const isZip = head.length >= 4 && head[0] === 80 && head[1] === 75 && head[2] === 3 && head[3] === 4;
    const archiveCmd = isZip ? "unzip" : "tar";
    const names = await runArchiveTool(archiveCmd, isZip ? ["-Z1", tmp] : ["-tf", tmp]);
    const typed = await runArchiveTool(archiveCmd, isZip ? ["-Z", "--h", "--t", tmp] : ["-tvf", tmp]);
    const { plain, special } = classifyArchiveListing(archiveCmd, names, typed);
    assertSafeMemberNames([...plain, ...special]);
    const top = archiveTopDir(plain);
    await fs3.mkdir(stage, { recursive: true, mode: DIR_CREATE_MODE });
    if (plain.length > 0) {
      await runArchiveTool(archiveCmd, await extractArgs(archiveCmd, tmp, stage, special, excludeFile));
    }
    await assertOnlyPlainEntries(stage);
    const srcRoot = top ? path.join(stage, top) : stage;
    const entries = await fs3.readdir(srcRoot).catch((e) => {
      throw errnoCode(e) === "ENOENT" ? new AnthropicError(INCONSISTENT_LISTING) : e;
    });
    for (const entry of entries) {
      await fs3.rename(path.join(srcRoot, entry), path.join(dest, entry));
    }
  } finally {
    await fs3.rm(tmp, { force: true });
    await fs3.rm(excludeFile, { force: true });
    await fs3.rm(stage, { recursive: true, force: true });
  }
}
async function extractArgs(cmd, archive, stage, special, excludeFile) {
  const patterns = special.map((name) => name.replace(/[*?[\\]/g, "\\$&"));
  if (cmd === "unzip") {
    return ["-oq", archive, "-d", stage, ...patterns.length > 0 ? ["-x", ...patterns] : []];
  }
  if (patterns.length === 0)
    return ["-xf", archive, "-C", stage];
  await fs3.writeFile(excludeFile, patterns.join("\n") + "\n", { flag: "wx", mode: 384 });
  return ["-xf", archive, "-C", stage, "-X", excludeFile];
}
async function readHead(file, n) {
  const handle = await fs3.open(file, "r");
  try {
    const buf = Buffer.alloc(n);
    const { bytesRead } = await handle.read(buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
var fs3, execFileAsync, INCONSISTENT_LISTING, PLAIN_TYPE_CHARS;
var init_skills = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/skills.mjs"() {
    init_node();
    init_error();
    init_log();
    init_fs_util();
    fs3 = fs.promises;
    execFileAsync = util.promisify(child_process.execFile);
    INCONSISTENT_LISTING = "skill archive listing is inconsistent; refusing to extract";
    PLAIN_TYPE_CHARS = { unzip: /* @__PURE__ */ new Set(["-", "d", "?"]), tar: /* @__PURE__ */ new Set(["-", "d", "C"]) };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/file-store.mjs
function isPathLegal(p) {
  return p.startsWith("/") && !p.split("/").includes("..");
}
function platformSupported() {
  return O_NOFOLLOW !== 0;
}
async function makeDirAndAncestors(dir) {
  const missing = [];
  let current = dir;
  for (; ; ) {
    try {
      await fsp.stat(current);
      break;
    } catch (e) {
      const code = e.code;
      if (code !== "ENOENT" && code !== "ENOTDIR" && code !== "ELOOP")
        throw e;
    }
    missing.push(current);
    const parent = path.dirname(current);
    if (parent === current)
      break;
    current = parent;
  }
  for (const directory of missing.reverse()) {
    try {
      await fsp.mkdir(directory, { mode: OWNER_ONLY_DIR_MODE });
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
    }
  }
}
async function makeDirsBelowRoot(root, dir) {
  const below = path.relative(root, dir);
  if (below === "")
    return;
  let current = root;
  for (const part of below.split(path.sep)) {
    current = path.join(current, part);
    try {
      await fsp.mkdir(current, { mode: OWNER_ONLY_DIR_MODE });
    } catch (e) {
      if (e.code !== "EEXIST")
        throw e;
    }
  }
}
async function replaceViaTemp(dest, data, isExecutable) {
  const mode = isExecutable ? OWNER_ONLY_EXEC_MODE : OWNER_ONLY_FILE_MODE;
  const tmp = path.join(path.dirname(dest), `.fs-${crypto.randomBytes(8).toString("hex")}.tmp`);
  let handle;
  try {
    handle = await fsp.open(tmp, C.O_WRONLY | C.O_CREAT | C.O_EXCL | O_NOFOLLOW, mode);
    await handle.writeFile(data);
    await handle.close();
    handle = void 0;
    await fsp.rename(tmp, dest);
  } catch (err) {
    if (handle)
      await handle.close().catch(() => {
      });
    await fsp.unlink(tmp).catch(() => {
    });
    throw err;
  }
}
async function openRegularFile(relPath, dest) {
  let handle;
  try {
    handle = await fsp.open(dest, C.O_RDONLY | O_NOFOLLOW | O_NONBLOCK);
  } catch (e) {
    const code = e.code;
    if (code === "ELOOP" || code === "EMLINK") {
      throw new FileStoreError(FileStoreError.IS_A_SYMLINK, relPath);
    }
    throw e;
  }
  try {
    const st = await handle.stat();
    if (!st.isFile())
      throw new FileStoreError(FileStoreError.NOT_A_FILE, relPath);
  } catch (e) {
    await handle.close().catch(() => {
    });
    throw e;
  }
  return handle;
}
async function hashFile(full) {
  const digest = crypto.createHash("sha256");
  const handle = await openRegularFile(path.basename(full), full);
  const buf = new Uint8Array(1024 * 1024);
  try {
    for (; ; ) {
      const { bytesRead } = await handle.read(buf, 0, buf.length);
      if (bytesRead === 0)
        break;
      digest.update(buf.subarray(0, bytesRead));
    }
  } finally {
    await handle.close();
  }
  return digest.digest("hex");
}
async function filenamesInDir(root, under, base) {
  if (!await requireDir(under, base))
    return [];
  const out = [];
  await walk(base, (full, entry) => {
    if (entry.isFile())
      out.push([path.relative(root, full).split(path.sep).join("/"), full]);
  });
  out.sort();
  return out;
}
async function symlinksInDir(root, under, base) {
  const relOf = (full) => path.relative(root, full).split(path.sep).join("/");
  let st;
  try {
    st = await fsp.lstat(base, { bigint: true });
  } catch (e) {
    const code = e.code;
    if (code === "ENOENT" || code === "ENOTDIR")
      return /* @__PURE__ */ new Set();
    throw e;
  }
  if (st.isSymbolicLink())
    return /* @__PURE__ */ new Set([relOf(base)]);
  if (!st.isDirectory())
    throw new FileStoreError(FileStoreError.NOT_A_DIRECTORY, under);
  const out = /* @__PURE__ */ new Set();
  await walk(base, (full, entry) => {
    if (entry.isSymbolicLink())
      out.add(relOf(full));
  });
  return out;
}
async function requireDir(under, base) {
  let st;
  try {
    st = await fsp.lstat(base, { bigint: true });
  } catch (e) {
    const code = e.code;
    if (code === "ENOENT" || code === "ENOTDIR")
      return false;
    throw e;
  }
  if (!st.isDirectory())
    throw new FileStoreError(FileStoreError.NOT_A_DIRECTORY, under);
  return true;
}
async function walk(base, visit) {
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT")
        continue;
      throw e;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      visit(full, entry);
      if (entry.isDirectory() && !entry.isSymbolicLink())
        stack.push(full);
    }
  }
}
function unchangedSinceHashed(cached, st) {
  return st.mtimeNs === cached.mtimeNs && st.ctimeNs === cached.ctimeNs && st.size === cached.size;
}
function oldEnoughToCache(st, walkStartNs) {
  const newestNs = st.mtimeNs > st.ctimeNs ? st.mtimeNs : st.ctimeNs;
  return newestNs < walkStartNs - _internals.timestampTrustMarginNs;
}
var fsp, C, OWNER_ONLY_DIR_MODE, OWNER_ONLY_FILE_MODE, OWNER_ONLY_EXEC_MODE, O_NOFOLLOW, O_NONBLOCK, FileStoreError, FileStore, TIMESTAMP_TRUST_MARGIN_NS, _internals, LocalFileStore, asyncDispose;
var init_file_store = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/file-store.mjs"() {
    init_node();
    init_bytes();
    fsp = fs.promises;
    C = fs.constants;
    OWNER_ONLY_DIR_MODE = 448;
    OWNER_ONLY_FILE_MODE = 384;
    OWNER_ONLY_EXEC_MODE = 448;
    O_NOFOLLOW = C.O_NOFOLLOW ?? 0;
    O_NONBLOCK = C.O_NONBLOCK ?? 0;
    FileStoreError = class extends Error {
      constructor(reason, relPath) {
        super(`path ${JSON.stringify(relPath)} ${reason}`);
        this.name = "FileStoreError";
        this.reason = reason;
        this.relPath = relPath;
      }
    };
    FileStoreError.ESCAPES_ROOT = "escapes the store root";
    FileStoreError.IS_A_SYMLINK = "is a symlink";
    FileStoreError.NOT_A_FILE = "is not a regular file";
    FileStoreError.NOT_A_DIRECTORY = "is not a directory";
    FileStoreError.NOT_UTF8 = "is not valid utf-8";
    FileStoreError.MOVE_DESTINATION_EXISTS = "already exists";
    FileStore = class _FileStore {
      /** @internal — use {@link FileStore.open} / {@link openFileStore}. */
      constructor(root, removedOnDispose, utf8Only = false) {
        this.hashes = /* @__PURE__ */ new Map();
        this.rootPath = root;
        this.removedOnDispose = removedOnDispose;
        this.decoder = utf8Only ? new TextDecoder("utf-8", { fatal: true }) : void 0;
      }
      /** Resolve `root`; creates nothing — only {@link createRoot} makes the folder. */
      static async open(root, opts) {
        if (!platformSupported()) {
          throw new Error("FileStore requires O_NOFOLLOW support on this platform");
        }
        let removedOnDispose = false;
        try {
          await fsp.lstat(root);
        } catch (e) {
          if (e.code !== "ENOENT")
            throw e;
          removedOnDispose = true;
        }
        return new _FileStore(path.resolve(root), removedOnDispose, opts?.utf8 ?? false);
      }
      /** Create the root directory and any missing ancestors; already existing is fine. */
      async createRoot() {
        await makeDirAndAncestors(this.rootPath);
      }
      /** The resolved root, and what {@link dispose} will do to it. */
      root() {
        return { path: this.rootPath, removedOnDispose: this.removedOnDispose };
      }
      /**
       * Remove the root iff `open` created it; pre-existing roots are kept.
       *
       * Wired to `Symbol.asyncDispose` at runtime when the host provides it, so
       * `await using` works on engines with explicit resource management.
       */
      async dispose() {
        if (!this.removedOnDispose)
          return;
        await fsp.rm(this.rootPath, { recursive: true, force: true });
      }
      /**
       * Write `data` (`string` UTF-8 or bytes) atomically to the file at `relPath`.
       *
       * Missing directories below the root are created; a missing root is not —
       * the write fails with `ENOENT`.
       */
      async put(relPath, data, opts) {
        const tail = relPath.replace(/\\/g, "/");
        if (tail.endsWith("/") || tail.endsWith("/.") || tail === "" || tail === ".") {
          throw new FileStoreError(FileStoreError.NOT_A_FILE, relPath);
        }
        const dest = this.resolveUnderRoot(relPath);
        const payload = typeof data === "string" ? encodeUTF8(data) : data;
        this.requireUtf8(relPath, payload);
        await makeDirsBelowRoot(this.rootPath, path.dirname(dest));
        await replaceViaTemp(dest, payload, opts?.executable ?? false);
      }
      /** The file's bytes; `null` when absent. */
      async get(relPath) {
        const dest = this.resolveUnderRoot(relPath);
        let handle;
        try {
          handle = await openRegularFile(relPath, dest);
        } catch (e) {
          if (e.code === "ENOENT")
            return null;
          throw e;
        }
        let data;
        try {
          const buf = await handle.readFile();
          data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        } finally {
          await handle.close();
        }
        this.requireUtf8(relPath, data);
        return data;
      }
      /** The relative path of every file under the directory `under`. */
      async ls(under = "/") {
        const base = this.resolveUnderRoot(under);
        return new Set((await filenamesInDir(this.rootPath, under, base)).map(([rel]) => rel));
      }
      /**
       * Every symlink under `under` — listings skip them and reads refuse them,
       * so a caller that must know they exist asks here.
       */
      async findSymlinks(under = "/") {
        const base = this.resolveUnderRoot(under);
        return symlinksInDir(this.rootPath, under, base);
      }
      /**
       * `{relPath: sha256Hex}` of every file under the directory `under`.
       *
       * Unchanged files — same size, mtime, and ctime since the last call —
       * reuse their recorded hash instead of being re-read.
       */
      async hashtree(under = "/") {
        const base = this.resolveUnderRoot(under);
        const walkStartNs = _internals.nowNs();
        const out = /* @__PURE__ */ Object.create(null);
        for (const [rel, full] of await filenamesInDir(this.rootPath, under, base)) {
          const sha = await this.hashViaCache(rel, full, walkStartNs);
          if (sha !== null)
            out[rel] = sha;
        }
        return out;
      }
      /** One file's sha256; `null` when absent. Shares {@link hashtree}'s cache. */
      async hashFile(relPath) {
        const dest = this.resolveUnderRoot(relPath);
        let st;
        try {
          st = await fsp.lstat(dest, { bigint: true });
        } catch (e) {
          if (e.code === "ENOENT")
            return null;
          throw e;
        }
        if (st.isSymbolicLink())
          throw new FileStoreError(FileStoreError.IS_A_SYMLINK, relPath);
        if (!st.isFile())
          throw new FileStoreError(FileStoreError.NOT_A_FILE, relPath);
        const rel = path.relative(this.rootPath, dest).split(path.sep).join("/");
        return this.hashViaCache(rel, dest, _internals.nowNs());
      }
      /**
       * Rename `src` to `dst`; an existing `dst` is refused. The banned store
       * root as either end does nothing.
       */
      async move(src, dst) {
        const s = this.resolveUnderRoot(src);
        const d = this.resolveUnderRoot(dst);
        if (s === this.rootPath || d === this.rootPath)
          return;
        const dstExists = await fsp.stat(d).then(() => true, () => false);
        if (dstExists)
          throw new FileStoreError(FileStoreError.MOVE_DESTINATION_EXISTS, dst);
        await makeDirsBelowRoot(this.rootPath, path.dirname(d));
        await fsp.rename(s, d);
      }
      /** Delete a file or subtree; absent — and the banned store root — do nothing. */
      async remove(relPath) {
        const dest = this.resolveUnderRoot(relPath);
        if (dest === this.rootPath)
          return;
        let st;
        try {
          st = await fsp.lstat(dest, { bigint: true });
        } catch (e) {
          if (e.code === "ENOENT")
            return;
          throw e;
        }
        if (st.isDirectory()) {
          await fsp.rm(dest, { recursive: true, force: true });
        } else {
          try {
            await fsp.unlink(dest);
          } catch (e) {
            if (e.code !== "ENOENT")
              throw e;
          }
        }
      }
      resolveUnderRoot(relPath) {
        const norm = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
        const parts = norm.split("/").filter((p) => p !== "" && p !== ".");
        if (path.posix.isAbsolute(norm) || parts.includes("..")) {
          throw new FileStoreError(FileStoreError.ESCAPES_ROOT, relPath);
        }
        return parts.length === 0 ? this.rootPath : path.join(this.rootPath, ...parts);
      }
      requireUtf8(relPath, data) {
        if (!this.decoder)
          return;
        try {
          this.decoder.decode(data);
        } catch {
          throw new FileStoreError(FileStoreError.NOT_UTF8, relPath);
        }
      }
      async hashViaCache(rel, full, walkStartNs) {
        let st;
        try {
          st = await fsp.lstat(full, { bigint: true });
        } catch (e) {
          if (e.code === "ENOENT")
            return null;
          throw e;
        }
        if (!st.isFile())
          return null;
        const cached = this.hashes.get(rel);
        let sha;
        if (cached !== void 0 && unchangedSinceHashed(cached, st)) {
          sha = cached.sha;
        } else {
          try {
            sha = await _internals.hashFile(full);
          } catch (e) {
            const code = e.code;
            if (code === "ENOENT" || e instanceof FileStoreError)
              return null;
            if (code === "ELOOP" || code === "EMLINK")
              return null;
            throw e;
          }
        }
        if (oldEnoughToCache(st, walkStartNs)) {
          this.hashes.set(rel, { mtimeNs: st.mtimeNs, ctimeNs: st.ctimeNs, size: st.size, sha });
        }
        return sha;
      }
    };
    FileStore.isPathLegal = isPathLegal;
    TIMESTAMP_TRUST_MARGIN_NS = 2000000000n;
    _internals = {
      hashFile,
      timestampTrustMarginNs: TIMESTAMP_TRUST_MARGIN_NS,
      nowNs: () => BigInt(Date.now()) * 1000000n
    };
    LocalFileStore = FileStore;
    asyncDispose = Symbol.asyncDispose;
    if (asyncDispose) {
      Object.defineProperty(FileStore.prototype, asyncDispose, {
        value: FileStore.prototype.dispose,
        configurable: true,
        writable: true
      });
    }
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/memories.mjs
function markerSha(memoryStoreId) {
  return crypto.createHash("sha256").update(`version ${MARKER_VERSION}
${memoryStoreId}`, "utf-8").digest("hex");
}
function isErrno(e) {
  return typeof e === "object" && e !== null && typeof e.code === "string";
}
async function settledOrAborted(p, signal) {
  if (!signal) {
    await p;
    return;
  }
  let onAbort;
  const aborted = new Promise((resolve2) => {
    onAbort = resolve2;
    if (signal.aborted)
      resolve2();
  });
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    await Promise.race([p, aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
var _SessionMemoryStores_instances, _SessionMemoryStores_client, _SessionMemoryStores_workdir, _SessionMemoryStores_syncIntervalMs, _SessionMemoryStores_syncDeletions, _SessionMemoryStores_log, _SessionMemoryStores_lastSyncAt, _SessionMemoryStores_finished, _SessionMemoryStores_stores, _SessionMemoryStores_storeRoot, _SessionMemoryStores_scanMarker, _SessionMemoryStores_syncStore, _SessionMemoryStores_flushStore, _SessionMemoryStores_recover, _SessionMemoryStores_stampAndPull, _SessionMemoryStores_syncPath, _SessionMemoryStores_removeLocal, _SessionMemoryStores_write, _SessionMemoryStores_pullAll, _SessionMemoryStores_uploadAll, _SessionMemoryStores_listMemories, _SessionMemoryStores_upload, _SessionMemoryStores_corroboratedDelete, _SessionMemoryStores_deleteRemote, MEMORY_FLUSH_TIMEOUT_MS, MARKER_PATH, MARKER_VERSION, DELETE_CORROBORATION_MS, LIST_PAGE_SIZE, FULL_LIST_PAGE_SIZE, FETCH_CONCURRENCY, UPLOAD_CONCURRENCY, DELETE_CAP_FLOOR, DELETE_CAP_CEILING, SessionMemoryError, DeletePass, SessionMemoryStores;
var init_memories = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/memories.mjs"() {
    init_tslib();
    init_node();
    init_error();
    init_log();
    init_bytes();
    init_backoff();
    init_file_store();
    init_sync_interval();
    init_sync_interval();
    MEMORY_FLUSH_TIMEOUT_MS = 3e4;
    MARKER_PATH = ".anthropic-memory-store";
    MARKER_VERSION = 1;
    DELETE_CORROBORATION_MS = 3e4;
    LIST_PAGE_SIZE = 100;
    FULL_LIST_PAGE_SIZE = 20;
    FETCH_CONCURRENCY = 16;
    UPLOAD_CONCURRENCY = 32;
    DELETE_CAP_FLOOR = 8;
    DELETE_CAP_CEILING = 50;
    SessionMemoryError = class extends AnthropicError {
      constructor(message, cause) {
        super(message);
        this.name = "SessionMemoryError";
        if (cause !== void 0)
          this.cause = cause;
      }
    };
    DeletePass = class {
      constructor(mode, cap, waiveWindow) {
        this.mode = mode;
        this.cap = cap;
        this.waiveWindow = waiveWindow;
        this.attempted = 0;
        this.capped = 0;
        this.suppressed = 0;
      }
      takeSlot() {
        if (this.attempted >= this.cap) {
          this.capped++;
          return false;
        }
        this.attempted++;
        return true;
      }
    };
    SessionMemoryStores = class {
      constructor(client, opts) {
        _SessionMemoryStores_instances.add(this);
        _SessionMemoryStores_client.set(this, void 0);
        _SessionMemoryStores_workdir.set(this, void 0);
        _SessionMemoryStores_syncIntervalMs.set(this, void 0);
        _SessionMemoryStores_syncDeletions.set(this, void 0);
        _SessionMemoryStores_log.set(this, void 0);
        _SessionMemoryStores_lastSyncAt.set(this, void 0);
        _SessionMemoryStores_finished.set(this, false);
        _SessionMemoryStores_stores.set(this, []);
        __classPrivateFieldSet(this, _SessionMemoryStores_client, client, "f");
        __classPrivateFieldSet(this, _SessionMemoryStores_workdir, opts.workdir, "f");
        __classPrivateFieldSet(this, _SessionMemoryStores_syncIntervalMs, opts.syncIntervalMs ?? DEFAULT_MEMORY_SYNC_INTERVAL_MS, "f");
        checkMemorySyncInterval(__classPrivateFieldGet(this, _SessionMemoryStores_syncIntervalMs, "f"), "syncIntervalMs");
        __classPrivateFieldSet(this, _SessionMemoryStores_syncDeletions, opts.syncDeletions ?? "enabled", "f");
        __classPrivateFieldSet(this, _SessionMemoryStores_log, loggerFor(client), "f");
        __classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
      }
      /**
       * Every attached store's root directory.
       *
       * The worker lists these as the file tools' allowed roots so a store
       * mounted outside the workdir stays reachable.
       */
      get roots() {
        return __classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((s) => s.files.root().path);
      }
      /**
       * Root directories of stores attached read-only.
       *
       * The file tools consult this to refuse writes into read-only stores.
       */
      get readOnlyRoots() {
        return __classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").filter((s) => s.readOnly).map((s) => s.files.root().path);
      }
      /**
       * Download every attached store's memories to disk.
       *
       * `session` arrives already fetched — one snapshot shared with the skills
       * download, so the two cannot disagree about the resources.
       */
      async download(session) {
        for (const resource of session.resources) {
          if (resource.type !== "memory_store")
            continue;
          const root = __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_storeRoot).call(this, resource);
          let store;
          try {
            store = {
              memoryStoreId: resource.memory_store_id,
              // utf8: a binary file is refused at put/get, not mid-sync.
              files: await LocalFileStore.open(root, { utf8: true }),
              readOnly: resource.access === "read_only",
              baseline: /* @__PURE__ */ new Map(),
              refusedShas: /* @__PURE__ */ new Map(),
              pendingDeletes: /* @__PURE__ */ new Map()
            };
            if (!store.files.root().removedOnDispose) {
              throw new SessionMemoryError(`something already exists at the memory store's path: ${root} (memory_store_id=${resource.memory_store_id}); it must not exist when the session starts`);
            }
            try {
              await store.files.createRoot();
            } catch (e) {
              if (!isErrno(e))
                throw e;
              throw new SessionMemoryError(`cannot create the memory store's folder: ${root} (memory_store_id=${resource.memory_store_id}): ${e}; the worker host must make this mount path writable`, e);
            }
            await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_stampAndPull).call(this, store);
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info("downloaded memories", {
              count: store.baseline.size,
              memory_store_id: store.memoryStoreId,
              dest: store.files.root().path
            });
            __classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").push(store);
          } catch (e) {
            if (store)
              await store.files.dispose().catch(() => {
              });
            if (e instanceof SessionMemoryError)
              throw e;
            throw new SessionMemoryError(`failed to download memory store memory_store_id=${resource.memory_store_id}: ${e}`, e);
          }
        }
        __classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
      }
      /**
       * The session's last sync — skips the delete wait, so calling it twice
       * would undo the protection; it throws instead.
       */
      async finish() {
        if (__classPrivateFieldGet(this, _SessionMemoryStores_finished, "f")) {
          throw new AnthropicError("finish() was already called: it is the session's last sync and runs once");
        }
        __classPrivateFieldSet(this, _SessionMemoryStores_finished, true, "f");
        await this.syncAll(true);
      }
      /** @internal — reconcile every store once; the tests' deterministic driver */
      async syncAll(final) {
        await Promise.all(__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((store) => __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_syncStore).call(this, store, final)));
        __classPrivateFieldSet(this, _SessionMemoryStores_lastSyncAt, Date.now(), "f");
      }
      /** Sync when `syncIntervalMs` has elapsed since the last one. Never throws. */
      async syncIfDue() {
        if (Date.now() - __classPrivateFieldGet(this, _SessionMemoryStores_lastSyncAt, "f") < __classPrivateFieldGet(this, _SessionMemoryStores_syncIntervalMs, "f"))
          return;
        await this.syncAll(false);
      }
      /**
       * Upload new and changed files; send no deletes and pull nothing.
       *
       * The push-only rescue pass for a session ending on an error or
       * cancel — best-effort, bounded by the caller: once `signal` aborts no
       * further upload starts, each store cut off part-way logs how many
       * changed files it had not finished uploading, and this resolves without
       * waiting for requests already in flight. Each store uploads up to
       * {@link UPLOAD_CONCURRENCY} files at a time. Skips read-only stores,
       * refused files, files the server already holds, and folders that fail
       * the marker check. Never throws.
       */
      async flushWrites(signal) {
        await Promise.all(__classPrivateFieldGet(this, _SessionMemoryStores_stores, "f").map((store) => __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_flushStore).call(this, store, signal)));
      }
      /**
       * Remove every store directory that {@link SessionMemoryStores.download}
       * created. Pre-existing directories are left alone — that is
       * {@link FileStore.dispose}'s own rule. A folder that fails the marker
       * check is kept too — sync left it as found, so must dispose.
       */
      async dispose() {
        for (const store of __classPrivateFieldGet(this, _SessionMemoryStores_stores, "f")) {
          const root = store.files.root();
          try {
            const scan = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
            if (!scan.markerOk && Object.keys(scan.files).length > 0) {
              __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; leaving the memory store folder on disk`, {
                root: root.path,
                memory_store_id: store.memoryStoreId
              });
              continue;
            }
            await store.files.dispose();
          } catch (e) {
            if (!(e instanceof FileStoreError) && !isErrno(e))
              throw e;
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to remove the memory store folder", {
              root: store.files.root().path,
              memory_store_id: store.memoryStoreId,
              error: String(e)
            });
            continue;
          }
          if (root.removedOnDispose) {
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info("removed memory store dir", {
              dest: root.path,
              memory_store_id: store.memoryStoreId
            });
          }
        }
      }
    };
    _SessionMemoryStores_client = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_workdir = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_syncIntervalMs = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_syncDeletions = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_log = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_lastSyncAt = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_finished = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_stores = /* @__PURE__ */ new WeakMap(), _SessionMemoryStores_instances = /* @__PURE__ */ new WeakSet(), _SessionMemoryStores_storeRoot = function _SessionMemoryStores_storeRoot2(resource) {
      if (resource.mount_path) {
        if (!isPathLegal(resource.mount_path)) {
          throw new SessionMemoryError(`memory store mount_path is not a clean absolute path: ${JSON.stringify(resource.mount_path)} (memory_store_id=${resource.memory_store_id})`);
        }
        return resource.mount_path;
      }
      return path.join(__classPrivateFieldGet(this, _SessionMemoryStores_workdir, "f"), "memory", resource.name || resource.memory_store_id);
    }, _SessionMemoryStores_scanMarker = async function _SessionMemoryStores_scanMarker2(store) {
      const local = await store.files.hashtree();
      const marker = local[MARKER_PATH];
      delete local[MARKER_PATH];
      if (marker === markerSha(store.memoryStoreId)) {
        return { files: local, markerOk: true, distrustReason: null };
      }
      return {
        files: local,
        markerOk: false,
        distrustReason: marker !== void 0 ? "the marker file does not match this store" : "the marker file is gone"
      };
    }, _SessionMemoryStores_syncStore = async function _SessionMemoryStores_syncStore2(store, final) {
      try {
        const scan = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
        const local = scan.files;
        if (!scan.markerOk) {
          if (Object.keys(local).length > 0) {
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; leaving the memory store folder as found and not syncing`, {
              root: store.files.root().path,
              memory_store_id: store.memoryStoreId
            });
            return;
          }
          await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_recover).call(this, store, "the folder or its marker is gone");
          return;
        }
        if (Object.keys(local).length === 0 && store.baseline.size > 1) {
          await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_recover).call(this, store, "every memory file is gone at once");
          return;
        }
        const remote = /* @__PURE__ */ new Map();
        for await (const [rel, item] of __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId)) {
          remote.set(rel, item);
        }
        const deletes = new DeletePass(__classPrivateFieldGet(this, _SessionMemoryStores_syncDeletions, "f"), Math.max(DELETE_CAP_FLOOR, Math.min(DELETE_CAP_CEILING, Math.floor(store.baseline.size / 4))), final);
        const pulls = [];
        const baseline = /* @__PURE__ */ new Map();
        const paths = [.../* @__PURE__ */ new Set([...remote.keys(), ...Object.keys(local), ...store.baseline.keys()])].sort();
        for (const rel of paths) {
          const remoteItem = remote.get(rel);
          const localSha = local[rel];
          const baseSha = store.baseline.get(rel);
          let sha;
          if (localSha === void 0 && baseSha !== void 0 && remoteItem !== void 0 && remoteItem.content_sha256 === baseSha && !store.readOnly) {
            sha = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_corroboratedDelete).call(this, store, rel, remoteItem, baseSha, deletes);
          } else {
            sha = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_syncPath).call(this, store, rel, remoteItem, localSha, pulls);
          }
          if (sha !== void 0)
            baseline.set(rel, sha);
        }
        store.baseline = baseline;
        await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_pullAll).call(this, store, pulls);
        if (deletes.suppressed > 0) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").debug("remote deletes are disabled; locally deleted memories stay on the server", {
            count: deletes.suppressed,
            memory_store_id: store.memoryStoreId
          });
        }
        if (deletes.capped > 0) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`delete cap reached: ${deletes.mode === "log_only" ? "would send" : "sent"} ${deletes.attempted} deletes, held ${deletes.capped} for later syncs`, { memory_store_id: store.memoryStoreId });
        }
      } catch (e) {
        __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory sync failed", { memory_store_id: store.memoryStoreId, error: String(e) });
      }
    }, _SessionMemoryStores_flushStore = async function _SessionMemoryStores_flushStore2(store, signal) {
      const dirty = /* @__PURE__ */ new Map();
      const unsent = /* @__PURE__ */ new Set();
      const push = async () => {
        if (store.readOnly)
          return;
        const scan = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_scanMarker).call(this, store);
        if (!scan.markerOk) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${scan.distrustReason}; not uploading anything from the memory store folder`, {
            root: store.files.root().path,
            memory_store_id: store.memoryStoreId
          });
          return;
        }
        for (const [rel, sha] of Object.entries(scan.files)) {
          if (sha !== store.baseline.get(rel) && store.refusedShas.get(rel) !== sha) {
            dirty.set(rel, sha);
            unsent.add(rel);
          }
        }
        if (dirty.size === 0 || signal?.aborted)
          return;
        const remote = /* @__PURE__ */ new Map();
        for await (const [rel, item] of __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId)) {
          if (signal?.aborted)
            return;
          remote.set(rel, item);
        }
        const uploads = [];
        for (const rel of [...dirty.keys()].sort()) {
          const localSha = dirty.get(rel);
          const baseSha = store.baseline.get(rel);
          const existing = remote.get(rel);
          if (existing !== void 0 && existing.content_sha256 === localSha) {
            store.baseline.set(rel, existing.content_sha256);
            unsent.delete(rel);
            continue;
          }
          if (existing !== void 0 && existing.content_sha256 !== baseSha) {
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory changed both locally and remotely; the flush leaves the remote version", {
              path: rel,
              memory_store_id: store.memoryStoreId
            });
            unsent.delete(rel);
            continue;
          }
          uploads.push([rel, localSha, existing]);
        }
        await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_uploadAll).call(this, store, uploads, unsent, signal);
      };
      try {
        await settledOrAborted(push(), signal);
        if (signal?.aborted && unsent.size > 0) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`memory flush cut off part-way; ${unsent.size} of ${dirty.size} changed files had not finished uploading`, { memory_store_id: store.memoryStoreId });
        }
      } catch (e) {
        __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory flush failed", { memory_store_id: store.memoryStoreId, error: String(e) });
      }
    }, _SessionMemoryStores_recover = /** Rebuild a destroyed folder from the server; sends no deletes, no uploads. */
    async function _SessionMemoryStores_recover2(store, reason) {
      __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn(`${reason}; re-downloading the memory store folder instead of syncing`, {
        root: store.files.root().path,
        memory_store_id: store.memoryStoreId
      });
      await store.files.createRoot();
      await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_stampAndPull).call(this, store);
    }, _SessionMemoryStores_stampAndPull = /**
     * Write the marker, then pull every remote memory. Baseline is cleared
     * first so a failed write never leaves an entry whose file is not on disk.
     * Every memory is needed here, so the listing carries the content — pages
     * cost far fewer round-trips than a request per memory.
     */
    async function _SessionMemoryStores_stampAndPull2(store) {
      store.baseline = /* @__PURE__ */ new Map();
      store.pendingDeletes.clear();
      await store.files.put(MARKER_PATH, `version ${MARKER_VERSION}
${store.memoryStoreId}`);
      for await (const [rel, item] of __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_listMemories).call(this, store.memoryStoreId, "full")) {
        if (await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_write).call(this, store, rel, item.content ?? "")) {
          store.baseline.set(rel, item.content_sha256);
        }
      }
    }, _SessionMemoryStores_syncPath = /**
     * Reconcile one path. Returns the sha to record in the baseline, or
     * `undefined` to drop the path from it.
     *
     * `pulls` is an output: when the remote version should be written to disk,
     * this appends `[rel, remote]` to it instead of writing — `rel` is the
     * file to write, `remote` the listed memory whose content `#pullAll` will
     * fetch and write there.
     */
    async function _SessionMemoryStores_syncPath2(store, rel, remote, localSha, pulls) {
      const baseSha = store.baseline.get(rel);
      if (localSha !== void 0) {
        store.pendingDeletes.delete(rel);
      }
      if (!remote) {
        if (localSha === void 0) {
          store.pendingDeletes.delete(rel);
          return void 0;
        }
        if (baseSha !== void 0) {
          if (localSha === baseSha) {
            const fresh = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_removeLocal).call(this, store, rel, baseSha);
            if (fresh === void 0)
              return void 0;
            if (fresh === baseSha)
              return baseSha;
            localSha = fresh;
          }
          if (store.readOnly) {
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory deleted remotely but edited locally; keeping the file, which a read-only store cannot push", { path: rel, memory_store_id: store.memoryStoreId });
          } else if (store.refusedShas.get(rel) !== localSha) {
            __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info("memory deleted remotely but edited locally; re-creating it from the file", {
              path: rel,
              memory_store_id: store.memoryStoreId
            });
          }
        }
        if (store.readOnly)
          return void 0;
        if (store.refusedShas.get(rel) === localSha)
          return void 0;
        return await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, void 0);
      }
      const remoteSha = remote.content_sha256;
      const remoteChanged = remoteSha !== baseSha;
      const locallyEdited = localSha !== void 0 && localSha !== baseSha && localSha !== remoteSha;
      const localChanged = !store.readOnly && locallyEdited;
      if (localSha === void 0 && baseSha !== void 0) {
        if (remoteChanged) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory deleted locally but changed remotely; restoring the remote version", {
            path: rel,
            memory_store_id: store.memoryStoreId
          });
          store.pendingDeletes.delete(rel);
          pulls.push([rel, remote]);
        }
        return baseSha;
      }
      if (remoteChanged) {
        if (localSha === remoteSha)
          return remoteSha;
        if (locallyEdited) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory changed both locally and remotely; keeping the remote version", {
            path: rel,
            memory_store_id: store.memoryStoreId
          });
        }
        pulls.push([rel, remote]);
        return baseSha;
      }
      if (localChanged) {
        if (store.refusedShas.get(rel) === localSha)
          return remoteSha;
        return await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, remote) ?? remoteSha;
      }
      return remoteSha;
    }, _SessionMemoryStores_removeLocal = /**
     * Remove the file for a memory the server no longer has, if it still holds
     * `expectSha`. Returns `undefined` when the file is gone from disk,
     * `expectSha` when it must stay in the baseline (I/O error), or the file's
     * fresh sha when it was edited since the scan.
     */
    async function _SessionMemoryStores_removeLocal2(store, rel, expectSha) {
      let freshSha;
      try {
        freshSha = await store.files.hashFile(rel);
      } catch (e) {
        if (!(e instanceof FileStoreError) && !isErrno(e))
          throw e;
        return expectSha;
      }
      if (freshSha === null)
        return void 0;
      if (freshSha !== expectSha)
        return freshSha;
      try {
        await store.files.remove(rel);
      } catch (e) {
        if (!(e instanceof FileStoreError) && !isErrno(e))
          throw e;
        __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to remove memory deleted remotely", {
          path: rel,
          memory_store_id: store.memoryStoreId,
          error: String(e)
        });
        return expectSha;
      }
      return void 0;
    }, _SessionMemoryStores_write = /**
     * Write a memory's content to disk; `false` (and a warning) on failure.
     *
     * A `..` component in the wire path reaches here as {@link FileStoreError} —
     * that is the escape guard.
     */
    async function _SessionMemoryStores_write2(store, rel, content) {
      try {
        await store.files.put(rel, content);
      } catch (e) {
        if (!(e instanceof FileStoreError) && !isErrno(e))
          throw e;
        __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to write memory", {
          path: rel,
          memory_store_id: store.memoryStoreId,
          error: String(e)
        });
        return false;
      }
      return true;
    }, _SessionMemoryStores_pullAll = /**
     * Fetch and write the given memories, {@link FETCH_CONCURRENCY} at a time.
     *
     * The sync's content pass: the listing carried no content, so each memory
     * is fetched individually and written as it arrives. On success the path's
     * baseline advances; on a failed fetch or write the old entry stays and the
     * next sync retries. A 404 means the memory was deleted after the listing —
     * the next sync reconciles it.
     */
    async function _SessionMemoryStores_pullAll2(store, pulls) {
      if (pulls.length === 0)
        return;
      const pullOne = async (rel, listed) => {
        let item;
        try {
          item = await __classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.retrieve(listed.id, {
            memory_store_id: store.memoryStoreId,
            view: "full"
          });
        } catch (e) {
          if (isStatus(e, 404))
            return;
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to fetch memory content", {
            path: rel,
            memory_store_id: store.memoryStoreId,
            error: String(e)
          });
          return;
        }
        if (await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_write).call(this, store, rel, item.content ?? "")) {
          store.baseline.set(rel, item.content_sha256);
        }
      };
      const queue = pulls[Symbol.iterator]();
      const worker = async () => {
        for (const [rel, listed] of queue)
          await pullOne(rel, listed);
      };
      await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, pulls.length) }, worker));
    }, _SessionMemoryStores_uploadAll = /**
     * Upload the given files, {@link UPLOAD_CONCURRENCY} at a time, taking each
     * path off `unsent` as its upload returns. No upload starts once `signal`
     * aborts; the ones already in flight run to completion.
     */
    async function _SessionMemoryStores_uploadAll2(store, uploads, unsent, signal) {
      const queue = uploads[Symbol.iterator]();
      const worker = async () => {
        for (const [rel, localSha, existing] of queue) {
          if (signal?.aborted)
            return;
          const sha = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload).call(this, store, rel, localSha, existing);
          unsent.delete(rel);
          if (sha !== void 0)
            store.baseline.set(rel, sha);
        }
      };
      await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, uploads.length) }, worker));
    }, _SessionMemoryStores_listMemories = /**
     * The store's memories keyed by relative path (the wire path's leading `/`
     * stripped — `#upload` re-prefixes it) — `basic` view (shas, no content) at
     * {@link LIST_PAGE_SIZE} per page unless the caller needs `full` pages.
     * `memory_prefix` rollups and the reserved marker path are skipped.
     */
    async function* _SessionMemoryStores_listMemories2(memoryStoreId, view = "basic") {
      const limit2 = view === "basic" ? LIST_PAGE_SIZE : FULL_LIST_PAGE_SIZE;
      for await (const item of __classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.list(memoryStoreId, { view, limit: limit2 })) {
        if (item.type !== "memory")
          continue;
        const rel = item.path.replace(/^\/+/, "");
        if (rel === MARKER_PATH) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("the server listed the reserved marker path; skipping", {
            path: item.path,
            memory_store_id: memoryStoreId
          });
          continue;
        }
        yield [rel, item];
      }
    }, _SessionMemoryStores_upload = /**
     * Push one local file; `undefined` keeps the old baseline so the next pass retries.
     *
     * A refusal the server would repeat (400/413, the utf-8 gate) enters
     * `refusedShas`: warned once, retried only after the file changes.
     */
    async function _SessionMemoryStores_upload2(store, rel, localSha, existing) {
      try {
        const data = await store.files.get(rel);
        if (data === null)
          return void 0;
        const content = decodeUTF8(data);
        const item = existing ? await __classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.update(existing.id, {
          memory_store_id: store.memoryStoreId,
          content,
          precondition: { type: "content_sha256", content_sha256: existing.content_sha256 }
        }) : await __classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.create(store.memoryStoreId, {
          path: "/" + rel,
          content
        });
        store.refusedShas.delete(rel);
        return item.content_sha256;
      } catch (e) {
        if (existing && isStatus(e, 404)) {
          return await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_upload2).call(this, store, rel, localSha, void 0);
        }
        const permanent = e instanceof FileStoreError || isStatus(e, 400) || isStatus(e, 413);
        if (existing && isStatus(e, 409)) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory changed both locally and remotely; the upload was refused and the local edit loses", {
            path: rel,
            memory_store_id: store.memoryStoreId
          });
        } else if (permanent && localSha !== void 0) {
          store.refusedShas.set(rel, localSha);
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("the server rejected this memory file, so it stays un-synced until its content changes", { path: rel, memory_store_id: store.memoryStoreId, rejection: String(e) });
        } else {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to upload memory", {
            path: rel,
            memory_store_id: store.memoryStoreId,
            error: String(e)
          });
        }
        return void 0;
      }
    }, _SessionMemoryStores_corroboratedDelete = /** Send the server delete only after the wait, the cap, and a fresh re-check all clear. */
    async function _SessionMemoryStores_corroboratedDelete2(store, rel, remote, baseSha, deletes) {
      if (deletes.mode === "disabled") {
        deletes.suppressed++;
        return baseSha;
      }
      let firstAbsent = store.pendingDeletes.get(rel);
      if (firstAbsent === void 0) {
        firstAbsent = Date.now();
        store.pendingDeletes.set(rel, firstAbsent);
      }
      if (!deletes.waiveWindow && Date.now() - firstAbsent < DELETE_CORROBORATION_MS) {
        return baseSha;
      }
      let markerOk;
      let stillAbsent;
      try {
        markerOk = await store.files.hashFile(MARKER_PATH) === markerSha(store.memoryStoreId);
        stillAbsent = await store.files.hashFile(rel) === null;
      } catch (e) {
        if (!(e instanceof FileStoreError) && !isErrno(e))
          throw e;
        markerOk = stillAbsent = false;
      }
      if (!markerOk)
        return baseSha;
      if (!stillAbsent) {
        store.pendingDeletes.delete(rel);
        return baseSha;
      }
      if (!deletes.takeSlot())
        return baseSha;
      if (deletes.mode === "log_only") {
        __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info("log-only: sync would delete this memory on the server", {
          path: rel,
          memory_store_id: store.memoryStoreId
        });
        return baseSha;
      }
      const sha = await __classPrivateFieldGet(this, _SessionMemoryStores_instances, "m", _SessionMemoryStores_deleteRemote).call(this, store, rel, remote, baseSha);
      if (sha === void 0) {
        store.pendingDeletes.delete(rel);
      }
      return sha;
    }, _SessionMemoryStores_deleteRemote = async function _SessionMemoryStores_deleteRemote2(store, rel, remote, baseSha) {
      try {
        await __classPrivateFieldGet(this, _SessionMemoryStores_client, "f").beta.memoryStores.memories.delete(remote.id, {
          memory_store_id: store.memoryStoreId,
          expected_content_sha256: baseSha
        });
      } catch (e) {
        if (isStatus(e, 404))
          return void 0;
        if (isStatus(e, 409) || isStatus(e, 412)) {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("memory deleted locally but changed remotely; keeping the remote version", {
            path: rel,
            memory_store_id: store.memoryStoreId
          });
        } else {
          __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").warn("failed to delete memory", {
            path: rel,
            memory_store_id: store.memoryStoreId,
            error: String(e)
          });
        }
        return baseSha;
      }
      __classPrivateFieldGet(this, _SessionMemoryStores_log, "f").info("propagated local deletion", { path: rel, memory_store_id: store.memoryStoreId });
      return void 0;
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs
var node_exports2 = {};
__export(node_exports2, {
  BashSession: () => BashSession,
  BashTimeoutError: () => BashTimeoutError,
  DEFAULT_MEMORY_SYNC_INTERVAL_MS: () => DEFAULT_MEMORY_SYNC_INTERVAL_MS,
  MARKER_PATH: () => MARKER_PATH,
  MEMORY_FLUSH_TIMEOUT_MS: () => MEMORY_FLUSH_TIMEOUT_MS,
  MIN_MEMORY_SYNC_INTERVAL_MS: () => MIN_MEMORY_SYNC_INTERVAL_MS,
  SessionMemoryError: () => SessionMemoryError,
  SessionMemoryStores: () => SessionMemoryStores,
  betaAgentToolset20260401: () => betaAgentToolset20260401,
  betaBashTool: () => betaBashTool,
  betaEditTool: () => betaEditTool,
  betaGlobTool: () => betaGlobTool,
  betaGrepTool: () => betaGrepTool,
  betaReadTool: () => betaReadTool,
  betaWriteTool: () => betaWriteTool,
  extractSkillArchive: () => extractSkillArchive,
  resolvePath: () => resolvePath,
  setupSkills: () => setupSkills
});
import * as fs4 from "node:fs/promises";
import * as fssync from "node:fs";
import * as path3 from "node:path";
import * as cp from "node:child_process";
import * as crypto2 from "node:crypto";
import * as readline from "node:readline";
function resolveMaxBytes(configured) {
  return configured === void 0 ? DEFAULT_MAX_FILE_BYTES : configured;
}
function rejectUnrestrictedPaths(value) {
  if (value === void 0)
    return;
  throw new AnthropicError("The `unrestrictedPaths` option you passed to the agent toolset (AgentToolContext) is no longer supported. The toolset's file tools (read, write, edit, glob, grep) are now always confined to the working directory plus the directories listed in `allowedRoots`. Remove `unrestrictedPaths` from your context; to let the file tools reach any other directory, add it to `allowedRoots`.");
}
function betaAgentToolset20260401(ctx) {
  return [
    betaBashTool(ctx),
    betaReadTool(ctx),
    betaWriteTool(ctx),
    betaEditTool(ctx),
    betaGlobTool(ctx),
    betaGrepTool(ctx)
  ];
}
async function resolvePath(ctx, p) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return confineToRoot(ctx.workdir, p, { allowedRoots: ctx.allowedRoots ?? [] });
}
function readOnlyRootFor(ctx, target) {
  return containingRoot(ctx.readOnlyRoots ?? [], target);
}
function scrubbedShellEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("ANTHROPIC_"))
      continue;
    env[key] = value;
  }
  return env;
}
function betaBashTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  let session;
  let tail = Promise.resolve();
  return betaTool({
    name: "bash",
    description: "Run a bash command in a persistent shell. State (cwd, env vars) persists across calls.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run" },
        restart: { type: "boolean", description: "Restart the persistent shell before running" },
        timeout_ms: { type: "integer", description: "Per-call timeout in milliseconds" }
      }
    },
    run: async ({ command, restart, timeout_ms }, context) => {
      const prev = tail;
      const gate = promiseWithResolvers();
      tail = gate.promise;
      try {
        await prev;
      } catch {
      }
      try {
        if (restart) {
          session?.close();
          session = void 0;
        }
        if (!command) {
          if (restart)
            return "bash session restarted";
          throw new ToolError("bash: command is required");
        }
        session ?? (session = new BashSession(ctx.workdir, ctx.env));
        try {
          const { output, exitCode } = await session.exec(command, {
            timeoutMs: timeout_ms ?? BASH_DEFAULT_TIMEOUT_MS,
            signal: context?.signal
          });
          if (exitCode !== 0)
            throw new ToolError(output || `exit ${exitCode}`);
          return output;
        } catch (e) {
          if (e instanceof ToolError)
            throw e;
          session.close();
          session = void 0;
          throw new ToolError(`bash: ${e instanceof Error ? e.message : String(e)}`);
        }
      } finally {
        gate.resolve();
      }
    },
    close: () => {
      session?.close();
      session = void 0;
    }
  });
}
function betaReadTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return betaTool({
    name: "read",
    description: "Read a UTF-8 text file relative to the workdir.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string" },
        view_range: {
          type: "array",
          items: { type: "integer" },
          description: "[start_line, end_line] 1-indexed inclusive"
        }
      },
      required: ["file_path"]
    },
    run: async ({ file_path, view_range }) => {
      if (!file_path)
        throw new ToolError("read: file_path is required");
      const abs = await resolvePath(ctx, file_path);
      if (view_range?.length && view_range.length !== 2) {
        throw new ToolError("read: view_range must be [start_line, end_line]");
      }
      let data;
      try {
        const st = await fs4.stat(abs);
        if (!st.isFile()) {
          throw new ToolError(`read: ${file_path} is not a regular file`);
        }
        const limit2 = resolveMaxBytes(ctx.maxFileBytes);
        if (limit2 !== null && st.size > limit2) {
          if (!view_range?.length) {
            throw new ToolError(`read: ${file_path} is ${st.size} bytes, exceeds ${limit2}-byte limit. Use the view_range parameter to read specific line ranges, e.g. view_range: [1, 500].`);
          }
          const [startLine2, endLine2] = view_range;
          return await readRangeStreaming(abs, file_path, startLine2, endLine2, limit2);
        }
        data = await fs4.readFile(abs, "utf8");
      } catch (e) {
        if (e instanceof ToolError)
          throw e;
        throw new ToolError(`read: ${fsErrorMessage(e, file_path)}`);
      }
      if (!view_range?.length)
        return data;
      const [startLine, endLine] = view_range;
      const lines = data.split("\n");
      const start = Math.max(0, startLine - 1);
      const end = endLine > 0 ? endLine : lines.length;
      return lines.slice(start, end).join("\n");
    }
  });
}
async function readRangeStreaming(abs, filePath, startLine, endLine, limit2) {
  const lines = new LineRangeCollector(filePath, startLine, endLine, limit2);
  if (lines.rangeIsEmpty())
    return "";
  const stream2 = fssync.createReadStream(abs, { highWaterMark: READ_STREAM_CHUNK_BYTES });
  try {
    for await (const chunk of stream2) {
      lines.collectFrom(chunk);
      if (lines.rangeIsCollected())
        break;
    }
  } finally {
    stream2.destroy();
  }
  return lines.text();
}
function betaWriteTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return betaTool({
    name: "write",
    description: "Write a UTF-8 text file relative to the workdir, creating parent directories as needed.",
    inputSchema: {
      type: "object",
      properties: { file_path: { type: "string" }, content: { type: "string" } },
      required: ["file_path", "content"]
    },
    run: async ({ file_path, content }) => {
      if (!file_path)
        throw new ToolError("write: file_path is required");
      const abs = await resolvePath(ctx, file_path);
      const ro = await readOnlyRootFor(ctx, abs);
      if (ro !== void 0) {
        throw new ToolError(`write: ${file_path} is inside read-only directory ${ro}`);
      }
      try {
        await fs4.mkdir(path3.dirname(abs), { recursive: true, mode: DIR_CREATE_MODE });
        await atomicWriteFile(abs, content ?? "");
      } catch (e) {
        throw new ToolError(`write: ${fsErrorMessage(e, file_path)}`);
      }
      return `wrote ${Buffer.byteLength(content ?? "")} bytes to ${file_path}`;
    }
  });
}
function betaEditTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return betaTool({
    name: "edit",
    description: "Replace old_string with new_string in a file. old_string must be unique unless replace_all.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string" },
        old_string: { type: "string" },
        new_string: { type: "string" },
        replace_all: { type: "boolean" }
      },
      required: ["file_path", "old_string", "new_string"]
    },
    run: async ({ file_path, old_string, new_string, replace_all }) => {
      if (!file_path)
        throw new ToolError("edit: file_path is required");
      if (!old_string)
        throw new ToolError("edit: old_string is required");
      const abs = await resolvePath(ctx, file_path);
      const ro = await readOnlyRootFor(ctx, abs);
      if (ro !== void 0) {
        throw new ToolError(`edit: ${file_path} is inside read-only directory ${ro}`);
      }
      let data;
      try {
        const st = await fs4.stat(abs);
        if (!st.isFile()) {
          throw new ToolError(`edit: ${file_path} is not a regular file`);
        }
        const limit2 = resolveMaxBytes(ctx.maxFileBytes);
        if (limit2 !== null && st.size > limit2) {
          throw new ToolError(`edit: ${file_path} is ${st.size} bytes, exceeds ${limit2}-byte limit. The edit tool loads the whole file and cannot modify a file this large.`);
        }
        data = await fs4.readFile(abs, "utf8");
      } catch (e) {
        if (e instanceof ToolError)
          throw e;
        throw new ToolError(`edit: ${fsErrorMessage(e, file_path)}`);
      }
      const count = data.split(old_string).length - 1;
      if (count === 0)
        throw new ToolError(`edit: old_string not found in ${file_path}`);
      let updated;
      if (replace_all) {
        updated = data.split(old_string).join(new_string);
      } else {
        if (count > 1)
          throw new ToolError(`edit: old_string appears ${count} times in ${file_path} (must be unique)`);
        updated = data.replace(old_string, () => new_string);
      }
      try {
        await atomicWriteFile(abs, updated);
      } catch (e) {
        throw new ToolError(`edit: write: ${fsErrorMessage(e, file_path)}`);
      }
      return `edited ${file_path} (${replace_all ? count : 1} replacement(s))`;
    }
  });
}
function patternCanAscend(pattern) {
  return pattern.split(/[\\/{},]/).includes("..");
}
function betaGlobTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return betaTool({
    name: "glob",
    description: "Match files under the workdir against a glob pattern. Results are mtime-sorted, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string" },
        path: { type: "string", description: "Directory to search in. Defaults to the workdir." }
      },
      required: ["pattern"]
    },
    run: async ({ pattern, path: searchPath }) => {
      if (!pattern)
        throw new ToolError("glob: pattern is required");
      if (path3.isAbsolute(pattern)) {
        throw new ToolError("glob: absolute pattern not permitted; pass a relative pattern (and optionally path)");
      }
      if (patternCanAscend(pattern)) {
        throw new ToolError('glob: ".." is not permitted in the pattern');
      }
      const root = searchPath ? await resolvePath(ctx, searchPath) : path3.resolve(ctx.workdir);
      const realRoot = searchPath ? root : await canonicalize(root);
      const matches = [];
      let remaining = WALK_MAX_ENTRIES;
      try {
        for await (const entry of fsGlob(pattern, {
          cwd: root,
          withFileTypes: true,
          exclude: (d) => d.name === ".git" || d.name === "node_modules"
        })) {
          if (remaining-- <= 0)
            break;
          if (!entry.isFile())
            continue;
          const full = path3.join(entry.parentPath, entry.name);
          let real;
          try {
            real = await fs4.realpath(full);
          } catch {
            continue;
          }
          if (!isWithin(realRoot, real))
            continue;
          let mtime = 0;
          try {
            mtime = (await fs4.stat(full)).mtimeMs;
          } catch {
          }
          matches.push({ path: full, mtime });
        }
      } catch (e) {
        throw new ToolError(`glob: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (matches.length === 0)
        return "no matches";
      matches.sort((a, b) => b.mtime - a.mtime);
      return matches.slice(0, GLOB_RESULT_LIMIT).map((m) => m.path).join("\n");
    }
  });
}
function betaGrepTool(ctx) {
  rejectUnrestrictedPaths(ctx.unrestrictedPaths);
  return betaTool({
    name: "grep",
    description: "Search file contents for a regex. Uses ripgrep if available, otherwise a built-in walker.",
    inputSchema: {
      type: "object",
      properties: { pattern: { type: "string" }, path: { type: "string" } },
      required: ["pattern"]
    },
    run: async ({ pattern, path: p }, context) => {
      if (!pattern)
        throw new ToolError("grep: pattern is required");
      let searchPath = path3.resolve(ctx.workdir);
      if (p)
        searchPath = await resolvePath(ctx, p);
      const rg = await findRg();
      return rg ? runRipgrep(rg, pattern, searchPath, context?.signal) : runWalkGrep(pattern, searchPath, context?.signal);
    }
  });
}
function runRipgrep(rg, pattern, searchPath, signal) {
  return new Promise((resolve2, reject) => {
    const proc = cp.spawn(rg, ["-n", "--no-heading", "-e", pattern, "--", searchPath], {
      ...signal ? { signal } : {}
    });
    let out = "";
    let errOut = "";
    let truncated = false;
    proc.stdout.on("data", (d) => {
      if (truncated)
        return;
      out += d;
      if (out.length > GREP_OUTPUT_LIMIT) {
        truncated = true;
        out = out.slice(0, GREP_OUTPUT_LIMIT);
        proc.kill("SIGKILL");
      }
    });
    proc.stderr.on("data", (d) => errOut += d);
    proc.on("close", (code) => {
      if (signal?.aborted)
        return reject(new ToolError("grep: aborted"));
      if (truncated)
        return resolve2(out + `
[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
      if (code === 0)
        return resolve2(out);
      if (code === 1)
        return resolve2("no matches");
      reject(new ToolError(`grep: rg failed: ${errOut || `exit ${code}`}`));
    });
    proc.on("error", (e) => {
      if (signal?.aborted)
        return reject(new ToolError("grep: aborted"));
      reject(new ToolError(`grep: rg failed: ${e.message}`));
    });
  });
}
async function runWalkGrep(pattern, root, signal) {
  let re;
  try {
    re = new RegExp(pattern);
  } catch (e) {
    throw new ToolError(`grep: invalid regex: ${e instanceof Error ? e.message : String(e)}`);
  }
  const hits = [];
  let budget = GREP_OUTPUT_LIMIT;
  const push = (line) => {
    budget -= line.length + 1;
    if (budget < 0) {
      hits.push(`[output truncated at ${GREP_OUTPUT_LIMIT} bytes]`);
      return false;
    }
    hits.push(line);
    return true;
  };
  const stat2 = await fs4.stat(root).catch(() => null);
  if (stat2?.isFile()) {
    await grepFile(root, re, push);
  } else {
    await walk2(root, "", (rel) => grepFile(path3.join(root, rel), re, push), signal);
  }
  if (signal?.aborted)
    throw new ToolError("grep: aborted");
  if (hits.length === 0)
    return "no matches";
  return hits.join("\n");
}
async function grepFile(file, re, push) {
  const stream2 = fssync.createReadStream(file, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream2, crlfDelay: Infinity });
  let i = 0;
  try {
    for await (const line of rl) {
      i++;
      if (line.length > GREP_MAX_LINE_LENGTH)
        continue;
      if (re.test(line) && !push(`${file}:${i}:${line}`))
        return false;
    }
  } catch {
  } finally {
    stream2.destroy();
  }
  return true;
}
async function walk2(root, rel, fn, signal) {
  let remaining = WALK_MAX_ENTRIES;
  async function inner(rel2, depth) {
    if (depth > WALK_MAX_DEPTH)
      return true;
    if (signal?.aborted)
      return false;
    let entries;
    try {
      entries = await fs4.readdir(path3.join(root, rel2), { withFileTypes: true });
    } catch {
      return true;
    }
    for (const e of entries) {
      if (e.name === ".git" || e.name === "node_modules")
        continue;
      if (remaining-- <= 0)
        return false;
      if (signal?.aborted)
        return false;
      const childRel = rel2 ? path3.join(rel2, e.name) : e.name;
      if (e.isDirectory()) {
        if (!await inner(childRel, depth + 1))
          return false;
      } else if (e.isFile()) {
        if (await fn(childRel) === false)
          return false;
      }
    }
    return true;
  }
  await inner(rel, 0);
}
async function findRg() {
  const dirs = (process.env["PATH"] ?? "").split(path3.delimiter);
  for (const d of dirs) {
    const candidate = path3.join(d, "rg");
    try {
      await fs4.access(candidate, fssync.constants.X_OK);
      return candidate;
    } catch {
    }
  }
  return null;
}
var _BashSession_instances, _BashSession_proc, _BashSession_buf, _BashSession_truncated, _BashSession_closed, _BashSession_waiting, _BashSession_append, _LineRangeCollector_instances, _LineRangeCollector_filePath, _LineRangeCollector_startLine, _LineRangeCollector_endLine, _LineRangeCollector_start, _LineRangeCollector_end, _LineRangeCollector_limit, _LineRangeCollector_line, _LineRangeCollector_collected, _LineRangeCollector_collectedBytes, _LineRangeCollector_collect, _LineRangeCollector_overLimitError, BASH_OUTPUT_LIMIT, BASH_DEFAULT_TIMEOUT_MS, DEFAULT_MAX_FILE_BYTES, READ_STREAM_CHUNK_BYTES, NEWLINE, GREP_OUTPUT_LIMIT, GREP_MAX_LINE_LENGTH, GLOB_RESULT_LIMIT, BashTimeoutError, ANSI_RE, fsGlob, BashSession, LineRangeCollector, WALK_MAX_DEPTH, WALK_MAX_ENTRIES;
var init_node2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/tools/agent-toolset/node.mjs"() {
    init_tslib();
    init_error();
    init_ToolError();
    init_json_schema();
    init_promise();
    init_fs_util();
    init_skills();
    init_memories();
    BASH_OUTPUT_LIMIT = 100 * 1024;
    BASH_DEFAULT_TIMEOUT_MS = 12e4;
    DEFAULT_MAX_FILE_BYTES = 256 * 1024;
    READ_STREAM_CHUNK_BYTES = 64 * 1024;
    NEWLINE = Buffer.from("\n");
    GREP_OUTPUT_LIMIT = 100 * 1024;
    GREP_MAX_LINE_LENGTH = 2e3;
    GLOB_RESULT_LIMIT = 200;
    BashTimeoutError = class extends AnthropicError {
      constructor(timeoutMs) {
        super(`bash command timed out after ${timeoutMs}ms`);
        this.name = "BashTimeoutError";
        this.timeoutMs = timeoutMs;
      }
    };
    ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;
    fsGlob = fs4.glob;
    BashSession = class {
      constructor(dir, env = scrubbedShellEnv()) {
        _BashSession_instances.add(this);
        _BashSession_proc.set(this, void 0);
        _BashSession_buf.set(this, "");
        _BashSession_truncated.set(this, false);
        _BashSession_closed.set(this, false);
        _BashSession_waiting.set(this, null);
        __classPrivateFieldSet(this, _BashSession_proc, cp.spawn("/bin/bash", ["--noprofile", "--norc"], {
          cwd: dir,
          // `env` is the full base environment (the scrubbed process env by
          // default, or the verbatim replacement from `AgentToolContext.env`).
          // PS1/PS2/TERM are shell-control settings BashSession always applies so
          // the pipe-based sentinel exec parsing works — not part of the
          // user-facing environment.
          env: { ...env, PS1: "", PS2: "", TERM: "dumb" },
          stdio: ["pipe", "pipe", "pipe"],
          detached: true
        }), "f");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.setEncoding("utf8");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.setEncoding("utf8");
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.on("data", (d) => __classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.on("data", (d) => __classPrivateFieldGet(this, _BashSession_instances, "m", _BashSession_append).call(this, d));
        __classPrivateFieldGet(this, _BashSession_proc, "f").once("close", () => {
          __classPrivateFieldSet(this, _BashSession_closed, true, "f");
          const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
          __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
          w?.resolve();
        });
      }
      /** Whether the underlying shell process has exited. */
      get closed() {
        return __classPrivateFieldGet(this, _BashSession_closed, "f");
      }
      async exec(command, opts = {}) {
        if (__classPrivateFieldGet(this, _BashSession_closed, "f")) {
          throw new AnthropicError("bash session terminated");
        }
        const timeoutMs = opts.timeoutMs ?? BASH_DEFAULT_TIMEOUT_MS;
        const signal = opts.signal;
        signal?.throwIfAborted();
        __classPrivateFieldSet(this, _BashSession_buf, "", "f");
        __classPrivateFieldSet(this, _BashSession_truncated, false, "f");
        const sentinel2 = `__ANT_CMD_${crypto2.randomUUID()}_DONE__`;
        const sentinelSplit = `${sentinel2.slice(0, 8)}''${sentinel2.slice(8)}`;
        const wrapped = `{ ${command}
} </dev/null 2>&1; printf '\\n${sentinelSplit}%d\\n' $?
`;
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdin.write(wrapped);
        if (__classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel2) < 0) {
          const { promise: sentinelSeen, resolve: resolve2 } = promiseWithResolvers();
          __classPrivateFieldSet(this, _BashSession_waiting, { sentinel: sentinel2, resolve: resolve2 }, "f");
          let timer;
          let onAbort;
          try {
            await Promise.race([
              sentinelSeen,
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(new BashTimeoutError(timeoutMs)), timeoutMs);
              }),
              new Promise((_, reject) => {
                if (!signal)
                  return;
                onAbort = () => reject(signal.reason);
                signal.addEventListener("abort", onAbort, { once: true });
              })
            ]);
          } finally {
            if (timer)
              clearTimeout(timer);
            if (onAbort && signal)
              signal.removeEventListener("abort", onAbort);
            __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
          }
        }
        const idx = __classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(sentinel2);
        if (idx < 0) {
          throw new AnthropicError("bash session terminated");
        }
        const tail = __classPrivateFieldGet(this, _BashSession_buf, "f").slice(idx + sentinel2.length);
        const m = tail.match(/^(-?\d+)/);
        const exitCode = m ? parseInt(m[1], 10) : -1;
        let out = __classPrivateFieldGet(this, _BashSession_buf, "f").slice(0, idx).replace(ANSI_RE, "").replace(/\n+$/, "");
        if (__classPrivateFieldGet(this, _BashSession_truncated, "f")) {
          out = `[output truncated]
${out}`;
        }
        return { output: out, exitCode };
      }
      close() {
        if (__classPrivateFieldGet(this, _BashSession_closed, "f"))
          return;
        __classPrivateFieldSet(this, _BashSession_closed, true, "f");
        const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
        __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w?.resolve();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdout.destroy();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stderr.destroy();
        __classPrivateFieldGet(this, _BashSession_proc, "f").stdin.destroy();
        try {
          process.kill(-__classPrivateFieldGet(this, _BashSession_proc, "f").pid, "SIGKILL");
        } catch {
          __classPrivateFieldGet(this, _BashSession_proc, "f").kill("SIGKILL");
        }
        __classPrivateFieldGet(this, _BashSession_proc, "f").unref();
      }
    };
    _BashSession_proc = /* @__PURE__ */ new WeakMap(), _BashSession_buf = /* @__PURE__ */ new WeakMap(), _BashSession_truncated = /* @__PURE__ */ new WeakMap(), _BashSession_closed = /* @__PURE__ */ new WeakMap(), _BashSession_waiting = /* @__PURE__ */ new WeakMap(), _BashSession_instances = /* @__PURE__ */ new WeakSet(), _BashSession_append = function _BashSession_append2(d) {
      __classPrivateFieldSet(this, _BashSession_buf, __classPrivateFieldGet(this, _BashSession_buf, "f") + d, "f");
      if (__classPrivateFieldGet(this, _BashSession_buf, "f").length > BASH_OUTPUT_LIMIT) {
        __classPrivateFieldSet(this, _BashSession_buf, __classPrivateFieldGet(this, _BashSession_buf, "f").slice(__classPrivateFieldGet(this, _BashSession_buf, "f").length - BASH_OUTPUT_LIMIT), "f");
        __classPrivateFieldSet(this, _BashSession_truncated, true, "f");
      }
      if (__classPrivateFieldGet(this, _BashSession_waiting, "f") && __classPrivateFieldGet(this, _BashSession_buf, "f").indexOf(__classPrivateFieldGet(this, _BashSession_waiting, "f").sentinel) >= 0) {
        const w = __classPrivateFieldGet(this, _BashSession_waiting, "f");
        __classPrivateFieldSet(this, _BashSession_waiting, null, "f");
        w.resolve();
      }
    };
    LineRangeCollector = class {
      constructor(filePath, startLine, endLine, limit2) {
        _LineRangeCollector_instances.add(this);
        _LineRangeCollector_filePath.set(this, void 0);
        _LineRangeCollector_startLine.set(this, void 0);
        _LineRangeCollector_endLine.set(this, void 0);
        _LineRangeCollector_start.set(this, void 0);
        _LineRangeCollector_end.set(this, void 0);
        _LineRangeCollector_limit.set(this, void 0);
        _LineRangeCollector_line.set(this, 0);
        _LineRangeCollector_collected.set(this, []);
        _LineRangeCollector_collectedBytes.set(this, 0);
        __classPrivateFieldSet(this, _LineRangeCollector_filePath, filePath, "f");
        __classPrivateFieldSet(this, _LineRangeCollector_startLine, startLine, "f");
        __classPrivateFieldSet(this, _LineRangeCollector_endLine, endLine, "f");
        __classPrivateFieldSet(this, _LineRangeCollector_start, Math.max(0, startLine - 1), "f");
        __classPrivateFieldSet(this, _LineRangeCollector_end, endLine > 0 ? endLine : Infinity, "f");
        __classPrivateFieldSet(this, _LineRangeCollector_limit, limit2, "f");
      }
      rangeIsEmpty() {
        return __classPrivateFieldGet(this, _LineRangeCollector_end, "f") <= __classPrivateFieldGet(this, _LineRangeCollector_start, "f");
      }
      rangeIsCollected() {
        return __classPrivateFieldGet(this, _LineRangeCollector_line, "f") >= __classPrivateFieldGet(this, _LineRangeCollector_end, "f");
      }
      collectFrom(chunk) {
        var _a2;
        let lineStart = 0;
        while (lineStart < chunk.length && !this.rangeIsCollected()) {
          const newline = chunk.indexOf(10, lineStart);
          const lineEnd = newline < 0 ? chunk.length : newline;
          if (__classPrivateFieldGet(this, _LineRangeCollector_line, "f") >= __classPrivateFieldGet(this, _LineRangeCollector_start, "f")) {
            __classPrivateFieldGet(this, _LineRangeCollector_instances, "m", _LineRangeCollector_collect).call(this, chunk.subarray(lineStart, lineEnd), newline >= 0);
          }
          if (newline < 0)
            break;
          __classPrivateFieldSet(this, _LineRangeCollector_line, (_a2 = __classPrivateFieldGet(this, _LineRangeCollector_line, "f"), _a2++, _a2), "f");
          lineStart = newline + 1;
        }
      }
      text() {
        return Buffer.concat(__classPrivateFieldGet(this, _LineRangeCollector_collected, "f"), __classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f")).toString("utf8");
      }
    };
    _LineRangeCollector_filePath = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_startLine = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_endLine = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_start = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_end = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_limit = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_line = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_collected = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_collectedBytes = /* @__PURE__ */ new WeakMap(), _LineRangeCollector_instances = /* @__PURE__ */ new WeakSet(), _LineRangeCollector_collect = function _LineRangeCollector_collect2(lineBytes, newlineTerminated) {
      __classPrivateFieldGet(this, _LineRangeCollector_collected, "f").push(lineBytes);
      __classPrivateFieldSet(this, _LineRangeCollector_collectedBytes, __classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") + lineBytes.length, "f");
      if (newlineTerminated && __classPrivateFieldGet(this, _LineRangeCollector_line, "f") + 1 < __classPrivateFieldGet(this, _LineRangeCollector_end, "f")) {
        __classPrivateFieldGet(this, _LineRangeCollector_collected, "f").push(NEWLINE);
        __classPrivateFieldSet(this, _LineRangeCollector_collectedBytes, __classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") + NEWLINE.length, "f");
      }
      if (__classPrivateFieldGet(this, _LineRangeCollector_collectedBytes, "f") > __classPrivateFieldGet(this, _LineRangeCollector_limit, "f"))
        throw __classPrivateFieldGet(this, _LineRangeCollector_instances, "m", _LineRangeCollector_overLimitError).call(this);
    }, _LineRangeCollector_overLimitError = function _LineRangeCollector_overLimitError2() {
      if (__classPrivateFieldGet(this, _LineRangeCollector_end, "f") - __classPrivateFieldGet(this, _LineRangeCollector_start, "f") === 1) {
        return new ToolError(`read: line ${__classPrivateFieldGet(this, _LineRangeCollector_start, "f") + 1} of ${__classPrivateFieldGet(this, _LineRangeCollector_filePath, "f")} alone exceeds ${__classPrivateFieldGet(this, _LineRangeCollector_limit, "f")}-byte limit. The read tool cannot return part of a line, so view_range cannot narrow this further.`);
      }
      return new ToolError(`read: view_range [${__classPrivateFieldGet(this, _LineRangeCollector_startLine, "f")}, ${__classPrivateFieldGet(this, _LineRangeCollector_endLine, "f")}] of ${__classPrivateFieldGet(this, _LineRangeCollector_filePath, "f")} exceeds ${__classPrivateFieldGet(this, _LineRangeCollector_limit, "f")}-byte limit. Narrow the view_range to read a smaller portion.`);
    };
    WALK_MAX_DEPTH = 40;
    WALK_MAX_ENTRIES = 5e4;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/environments/worker.mjs
function hasMemoryStore(session) {
  return session.resources.some((r) => r.type === "memory_store");
}
function sessionsTokenFromSecret(secret) {
  if (!secret)
    return null;
  let parsed;
  try {
    const normalized = secret.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    parsed = JSON.parse(decodeUTF8(fromBase64(padded)));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    return null;
  const token = parsed.sessions_token;
  return typeof token === "string" && token !== "" ? token : null;
}
async function withTimeout(p, ms) {
  let timer;
  try {
    return await Promise.race([
      p.then(() => false, () => false),
      new Promise((resolve2) => {
        timer = setTimeout(() => resolve2(true), ms);
      })
    ]);
  } finally {
    if (timer !== void 0)
      clearTimeout(timer);
  }
}
async function forceStop(client, work, log, requestOptions) {
  try {
    await client.beta.environments.work.stop(
      work.id,
      { environment_id: work.environment_id, force: true },
      // Caller's headers pass through; the helper-tag header is on the scoped
      // sub-client's default_headers via copyClientForHelper, so no per-call
      // re-stamping needed.
      { ...requestOptions, headers: buildHeaders([requestOptions?.headers]) }
    );
  } catch (e) {
    if (!isStatus(e, 409)) {
      log.error("force-stop on exit failed", { work_id: work.id, error: String(e) });
    }
  }
}
function serverLeaseState(e) {
  let node = e instanceof APIError ? e.error : void 0;
  for (const key of ["error", "details", "current_state"]) {
    if (!isObj(node))
      return {};
    node = node[key];
  }
  return isObj(node) ? node : {};
}
async function heartbeatLoop(client, work, lease, logger, requestOptions, onLeaseTtl) {
  let intervalMs = HEARTBEAT_DEFAULT_MS;
  let ttlMs = HEARTBEAT_TTL_DEFAULT_MS;
  let lastSuccessMs = Date.now();
  let last = NO_HEARTBEAT_SENTINEL;
  const beat = async () => {
    const beatCtrl = new AbortController();
    const detach = linkAbort(lease.signal, beatCtrl);
    const cutoff = setTimeout(() => beatCtrl.abort(), intervalMs);
    try {
      const resp = await client.beta.environments.work.heartbeat(work.id, { environment_id: work.environment_id, expected_last_heartbeat: last }, { ...requestOptions, headers: buildHeaders([requestOptions?.headers]), signal: beatCtrl.signal });
      lastSuccessMs = Date.now();
      last = resp.last_heartbeat;
      if (resp.ttl_seconds > 0) {
        ttlMs = resp.ttl_seconds * 1e3;
        intervalMs = Math.max(1e3, Math.min(ttlMs / 2, HEARTBEAT_DEFAULT_MS));
        onLeaseTtl?.(ttlMs);
      }
      if (resp.state === "stopping" || resp.state === "stopped") {
        logger.info("heartbeat signals shutdown", { work_id: work.id, state: resp.state });
        lease.finish("control_plane_stop");
      }
      if (!resp.lease_extended) {
        logger.warn("lease not extended, shutting down", { work_id: work.id });
        lease.finish("control_plane_stop");
      }
    } catch (e) {
      lease.signal.throwIfAborted();
      if (isStatus(e, 412)) {
        const server = serverLeaseState(e);
        logger.error("lease lost: heartbeat precondition failed", {
          work_id: work.id,
          server_state: server["state"],
          server_ttl_seconds: server["ttl_seconds"],
          server_last_heartbeat: server["last_heartbeat"]
        });
        lease.finish("lease_lost");
        return;
      }
      if (isFatal4xx(e)) {
        logger.error("permanent heartbeat failure", { work_id: work.id, error: String(e) });
        lease.finish("heartbeat_rejected");
        throw e;
      }
      if (Date.now() - lastSuccessMs > ttlMs) {
        logger.error("lease assumed lost: no successful heartbeat in ttl", {
          work_id: work.id,
          ttl_ms: ttlMs,
          error: String(e)
        });
        lease.finish("assumed_lost");
        return;
      }
      logger.warn("transient heartbeat failure", { work_id: work.id, error: String(e) });
    } finally {
      clearTimeout(cutoff);
      detach();
    }
  };
  await beat();
  while (!lease.signal.aborted) {
    await sleep(intervalMs, lease.signal);
    lease.signal.throwIfAborted();
    await beat();
  }
}
var _EnvironmentWorker_instances, _EnvironmentWorker_signal, _EnvironmentWorker_handleItem, _Lease_ctrl, _Lease_endReason, HEARTBEAT_DEFAULT_MS, HEARTBEAT_TTL_DEFAULT_MS, NO_HEARTBEAT_SENTINEL, EnvironmentWorker, Lease;
var init_worker = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/environments/worker.mjs"() {
    init_tslib();
    init_error();
    init_log();
    init_base64();
    init_bytes();
    init_env();
    init_sleep();
    init_backoff();
    init_abort();
    init_values();
    init_headers();
    init_SessionToolRunner();
    init_poller();
    init_helper_client();
    init_sync_interval();
    HEARTBEAT_DEFAULT_MS = 3e4;
    HEARTBEAT_TTL_DEFAULT_MS = 9e4;
    NO_HEARTBEAT_SENTINEL = "NO_HEARTBEAT";
    EnvironmentWorker = class {
      constructor(opts) {
        _EnvironmentWorker_instances.add(this);
        _EnvironmentWorker_signal.set(this, void 0);
        if (opts.unrestrictedPaths !== void 0) {
          throw new AnthropicError("The `unrestrictedPaths` option you passed to EnvironmentWorker (or client.beta.environments.work.worker()) is no longer supported. The worker's file tools (read, write, edit, glob, grep) are now always confined to `workdir` plus the session's memory folders. Remove `unrestrictedPaths` from your options; to let the file tools reach any other directory, add it to `AgentToolContext.allowedRoots` from a `tools` factory.");
        }
        this.client = opts.client;
        this.environmentId = opts.environmentId;
        this.environmentKey = opts.environmentKey;
        this.tools = opts.tools;
        this.workdir = opts.workdir ?? process.cwd();
        this.maxFileBytes = opts.maxFileBytes;
        this.maxIdleMs = opts.maxIdleMs;
        if (opts.memorySyncIntervalMs != null) {
          checkMemorySyncInterval(opts.memorySyncIntervalMs, "memorySyncIntervalMs");
        }
        this.memorySyncIntervalMs = opts.memorySyncIntervalMs;
        this.memorySyncDeletions = opts.memorySyncDeletions ?? "enabled";
        this.workerId = opts.workerId;
        this.requestOptions = opts.requestOptions;
        __classPrivateFieldSet(this, _EnvironmentWorker_signal, opts.signal, "f");
      }
      /**
       * Poll the environment and service each claimed session until the supplied
       * signal (or the one passed to the constructor) aborts. Throws if
       * `environmentId` / `environmentKey` were not provided to the constructor.
       */
      async run(signal) {
        const { environmentId, environmentKey } = this;
        if (environmentId === void 0 || environmentKey === void 0) {
          throw new AnthropicError("EnvironmentWorker.run: environmentId and environmentKey are required to poll for work");
        }
        const externalSignal = signal ?? __classPrivateFieldGet(this, _EnvironmentWorker_signal, "f");
        const poller = new WorkPoller({
          client: this.client,
          environmentId,
          environmentKey,
          ...this.workerId !== void 0 ? { workerId: this.workerId } : {},
          ...externalSignal ? { signal: externalSignal } : {},
          ...this.requestOptions !== void 0 ? { requestOptions: this.requestOptions } : {},
          // The per-item handler stops or releases every work item on exit; let it
          // be the single owner of `work.stop` rather than double-posting from the
          // poller.
          autoStop: false
        });
        for await (const work of poller) {
          try {
            await __classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, poller.signal);
          } catch (e) {
            if (poller.signal?.aborted)
              throw e;
            loggerFor(this.client).error("work item failed", { work_id: work.id, error: String(e) });
          }
        }
      }
      /**
       * Service a single, already-claimed work item without the poll loop: build the
       * per-session {@link AgentToolContext} (workdir from this worker's options),
       * download the session agent's skills (`setupSkills`), run a
       * {@link SessionToolRunner} for the session while heartbeating the work-item
       * lease, and force-stop the work item on exit (whether the runner finishes
       * normally, throws, or the control plane signals shutdown). The one
       * exception is a lost lease: the item then belongs to the queue or another
       * worker and is left alone.
       *
       * Use this when something else does the claiming — e.g. a `worker poll
       * --on-work` script that hands an already-claimed item to a fresh process. The
       * work id / environment id / session id each fall back to `ANTHROPIC_WORK_ID` /
       * `ANTHROPIC_ENVIRONMENT_ID` / `ANTHROPIC_SESSION_ID` (the env vars that
       * command sets) when not passed; the environment key resolves from this
       * option, then the worker's own `environmentKey`, then
       * `ANTHROPIC_ENVIRONMENT_KEY`. With no arguments inside that command it just
       * works. Throws a clear error naming the first of the four required values
       * still missing after resolution. Throws `SessionMemoryError` when the
       * session has memory stores attached but they cannot be mounted — the work
       * item carried no sessions token (unless `memorySyncIntervalMs` turned
       * memory off), or a store failed to download.
       *
       * `workSecret` is the work item's per-item `secret` payload from the poll
       * response, falling back to `ANTHROPIC_WORK_SECRET`; unlike the others it is
       * optional — when present, the sessions token extracted from it is preferred
       * as the Bearer credential for this item's heartbeat / force-stop / session
       * calls; when absent (or undecodable) those calls use the environment key.
       */
      async handleItem(opts) {
        const workId = opts?.workId ?? readEnv("ANTHROPIC_WORK_ID");
        const environmentId = opts?.environmentId ?? readEnv("ANTHROPIC_ENVIRONMENT_ID");
        const sessionId = opts?.sessionId ?? readEnv("ANTHROPIC_SESSION_ID");
        const environmentKey = opts?.environmentKey ?? this.environmentKey ?? readEnv("ANTHROPIC_ENVIRONMENT_KEY");
        const workSecret = opts?.workSecret || readEnv("ANTHROPIC_WORK_SECRET") || null;
        if (!workId) {
          throw new AnthropicError("handleItem: workId is required \u2014 pass it or set ANTHROPIC_WORK_ID");
        }
        if (!environmentId) {
          throw new AnthropicError("handleItem: environmentId is required \u2014 pass it or set ANTHROPIC_ENVIRONMENT_ID");
        }
        if (!sessionId) {
          throw new AnthropicError("handleItem: sessionId is required \u2014 pass it or set ANTHROPIC_SESSION_ID");
        }
        if (!environmentKey) {
          throw new AnthropicError("handleItem: environmentKey is required \u2014 pass it, construct the worker with it, or set ANTHROPIC_ENVIRONMENT_KEY");
        }
        const work = {
          id: workId,
          environment_id: environmentId,
          secret: workSecret,
          data: { type: "session", id: sessionId }
        };
        await __classPrivateFieldGet(this, _EnvironmentWorker_instances, "m", _EnvironmentWorker_handleItem).call(this, work, environmentKey, opts?.signal ?? __classPrivateFieldGet(this, _EnvironmentWorker_signal, "f"));
      }
    };
    _EnvironmentWorker_signal = /* @__PURE__ */ new WeakMap(), _EnvironmentWorker_instances = /* @__PURE__ */ new WeakSet(), _EnvironmentWorker_handleItem = /**
     * The per-item body shared by {@link EnvironmentWorker.run}'s poll loop and
     * {@link EnvironmentWorker.handleItem}: run a {@link SessionToolRunner} for the
     * work item's session while heartbeating its lease, force-stopping on exit
     * unless the lease was lost. Non-session work items are ignored.
     *
     * When the poll response carried a per-item `secret` (a short-lived payload
     * scoped to this work item), the sessions token extracted from it is
     * preferred over `environmentKey` as the Bearer credential for those
     * per-item calls; a missing/undecodable secret falls back to
     * `environmentKey` unchanged.
     */
    async function _EnvironmentWorker_handleItem2(work, environmentKey, externalSignal) {
      const log = loggerFor(this.client);
      const sessionsToken = sessionsTokenFromSecret(work.secret);
      if (work.secret && sessionsToken === null) {
        log.warn("work item carried a secret payload but no sessions token could be extracted; falling back to the environment key", { work_id: work.id });
      }
      const itemCredential = sessionsToken ?? environmentKey;
      const sessionClient = copyClientForHelper(this.client, {
        authToken: itemCredential,
        helper: "environments-worker"
      });
      const sessionId = work.data.id;
      const ctrl = new AbortController();
      const detachExternal = linkAbort(externalSignal, ctrl);
      const lease = new Lease(ctrl);
      const agentToolset = await Promise.resolve().then(() => (init_node2(), node_exports2));
      let leaseTtlMs;
      let runner;
      const heartbeatPromise = heartbeatLoop(sessionClient, work, lease, log, this.requestOptions, (ttlMs) => {
        leaseTtlMs = ttlMs;
        runner?._setSendRetryWindow(ttlMs);
      }).catch((e) => {
        if (!ctrl.signal.aborted)
          log.error("heartbeat loop failed", { work_id: work.id, error: String(e) });
        ctrl.abort();
      });
      let cleanupSkills = async () => {
      };
      let stores;
      let cleanEnd = false;
      try {
        if (work.data.type !== "session") {
          log.debug("skipping non-session work item", { work_id: work.id, type: work.data.type });
          return;
        }
        const session = await sessionClient.beta.sessions.retrieve(sessionId);
        if (sessionsToken === null && this.memorySyncIntervalMs !== null && hasMemoryStore(session)) {
          throw new agentToolset.SessionMemoryError(`cannot mount the session's memories: the work item carried no sessions token (work_id=${work.id}, session_id=${sessionId}); the memory endpoints reject the environment key, so the poller must issue a per-item \`secret\` carrying \`sessions_token\`, or set \`memorySyncIntervalMs: null\` to run without memory`);
        }
        const ctx = {
          workdir: this.workdir,
          // The scoped sub-client, not the parent: the skill download
          // `setupSkills` performs for this session rides the same per-item
          // credential as every other per-item call.
          client: sessionClient,
          session,
          ...this.maxFileBytes !== void 0 ? { maxFileBytes: this.maxFileBytes } : {}
        };
        try {
          cleanupSkills = await agentToolset.setupSkills(ctx);
        } catch (e) {
          log.warn("skill setup failed", { session_id: sessionId, work_id: work.id, error: String(e) });
        }
        if (sessionsToken !== null && this.memorySyncIntervalMs !== null) {
          stores = new agentToolset.SessionMemoryStores(sessionClient, {
            workdir: this.workdir,
            ...this.memorySyncIntervalMs !== void 0 ? { syncIntervalMs: this.memorySyncIntervalMs } : {},
            syncDeletions: this.memorySyncDeletions
          });
          await stores.download(session);
          ctx.allowedRoots = stores.roots;
          ctx.readOnlyRoots = stores.readOnlyRoots;
        } else {
          log.debug("memory stores disabled for this item", { work_id: work.id });
        }
        const tools = typeof this.tools === "function" ? this.tools(ctx) : this.tools ?? agentToolset.betaAgentToolset20260401(ctx);
        runner = new SessionToolRunner(sessionId, {
          client: sessionClient,
          tools,
          ...this.maxIdleMs !== void 0 ? { maxIdleMs: this.maxIdleMs } : {},
          ...this.requestOptions !== void 0 ? { requestOptions: this.requestOptions } : {},
          signal: ctrl.signal
        });
        if (leaseTtlMs !== void 0)
          runner._setSendRetryWindow(leaseTtlMs);
        for await (const _ of runner) {
          if (stores)
            await stores.syncIfDue();
        }
        cleanEnd = !ctrl.signal.aborted;
      } finally {
        try {
          await cleanupSkills().catch((e) => {
            log.warn("skill cleanup failed", { session_id: sessionId, work_id: work.id, error: String(e) });
          });
        } finally {
          if (stores) {
            const boundMs = agentToolset.MEMORY_FLUSH_TIMEOUT_MS;
            if (cleanEnd) {
              const finishCutOff = await withTimeout(stores.finish(), boundMs);
              if (finishCutOff) {
                log.warn(`final memory sync cut off after ${boundMs}ms; the flush that follows still uploads changed files`, { session_id: sessionId, work_id: work.id });
              }
            }
            const flushBound = new AbortController();
            const flushCutOff = await withTimeout(stores.flushWrites(flushBound.signal), boundMs);
            if (flushCutOff) {
              flushBound.abort();
              log.warn(`memory flush cut off after ${boundMs}ms; changed files it had not uploaded yet are not saved`, { session_id: sessionId, work_id: work.id });
            }
            await stores.dispose().catch((e) => {
              log.warn("memory store cleanup failed", {
                session_id: sessionId,
                work_id: work.id,
                error: String(e)
              });
            });
          }
        }
        lease.finish("runner_done");
        detachExternal();
        await heartbeatPromise;
        if (lease.lost) {
          log.info("lease lost; released without stopping it", { session_id: sessionId, work_id: work.id });
        } else {
          await forceStop(sessionClient, work, log, this.requestOptions);
        }
      }
    };
    Lease = class {
      constructor(ctrl) {
        _Lease_ctrl.set(this, void 0);
        _Lease_endReason.set(this, void 0);
        __classPrivateFieldSet(this, _Lease_ctrl, ctrl, "f");
      }
      get signal() {
        return __classPrivateFieldGet(this, _Lease_ctrl, "f").signal;
      }
      finish(reason) {
        __classPrivateFieldSet(this, _Lease_endReason, __classPrivateFieldGet(this, _Lease_endReason, "f") ?? reason, "f");
        __classPrivateFieldGet(this, _Lease_ctrl, "f").abort();
      }
      /** True once the item belongs to the queue or another worker. */
      get lost() {
        return __classPrivateFieldGet(this, _Lease_endReason, "f") === "lease_lost" || __classPrivateFieldGet(this, _Lease_endReason, "f") === "assumed_lost";
      }
    };
    _Lease_ctrl = /* @__PURE__ */ new WeakMap(), _Lease_endReason = /* @__PURE__ */ new WeakMap();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/environments/work.mjs
var Work;
var init_work = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/environments/work.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    init_poller();
    init_worker();
    init_poller();
    init_worker();
    Work = class extends APIResource {
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Retrieve detailed information about a specific work item.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.retrieve('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      retrieve(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.get(path2`/v1/environments/${environment_id}/work/${workID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Update work item metadata with merge semantics.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.update('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *     metadata: { foo: 'string' },
       *   });
       * ```
       */
      update(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post(path2`/v1/environments/${environment_id}/work/${workID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * List work items in an environment.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaSelfHostedWork of client.beta.environments.work.list(
       *   'env_011CZkZ9X2dpNyB7HsEFoRfW',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(environmentID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/environments/${environmentID}/work?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Acknowledge receipt of a work item, transitioning it from 'queued' to 'starting'
       * and removing it from the queue.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.ack('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      ack(workID, params, options) {
        const { environment_id, betas } = params;
        return this._client.post(path2`/v1/environments/${environment_id}/work/${workID}/ack?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Record a heartbeat for a work item to maintain the lease.
       *
       * @example
       * ```ts
       * const betaSelfHostedWorkHeartbeatResponse =
       *   await client.beta.environments.work.heartbeat('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      heartbeat(workID, params, options) {
        const { environment_id, desired_ttl_seconds, expected_last_heartbeat, betas } = params;
        return this._client.post(path2`/v1/environments/${environment_id}/work/${workID}/heartbeat?beta=true`, {
          query: { desired_ttl_seconds, expected_last_heartbeat },
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Long poll for work items in the queue.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.poll(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      poll(environmentID, params = {}, options) {
        const { betas, "Anthropic-Worker-ID": anthropicWorkerID, ...query } = params ?? {};
        return this._client.get(path2`/v1/environments/${environmentID}/work/poll?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString(),
              ...anthropicWorkerID != null ? { "Anthropic-Worker-ID": anthropicWorkerID } : void 0
            },
            options?.headers
          ])
        });
      }
      /**
       * Get statistics about the work queue for an environment.
       *
       * @example
       * ```ts
       * const betaSelfHostedWorkQueueStats =
       *   await client.beta.environments.work.stats(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      stats(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/environments/${environmentID}/work/stats?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Note: these endpoints are called automatically by the pre-built environment
       * worker provided in the SDKs and CLI, for orchestrating sessions with self-hosted
       * sandbox environments. They are included here as a reference; you do not need to
       * invoke them directly.
       *
       * Stop a work item, initiating graceful or forced shutdown.
       *
       * @example
       * ```ts
       * const betaSelfHostedWork =
       *   await client.beta.environments.work.stop('work_id', {
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      stop(workID, params, options) {
        const { environment_id, betas, ...body } = params;
        return this._client.post(path2`/v1/environments/${environment_id}/work/${workID}/stop?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Continuously claim work from a self-hosted environment, ack each item,
       * and yield it. Posts `stop` automatically when the consumer's loop body
       * returns or when iteration ends.
       *
       * @example
       * ```ts
       * for await (const work of client.beta.environments.work.poller({
       *   environmentId,
       *   environmentKey,
       * })) {
       *   if (work.data.type !== 'session') continue;
       *   // ...service the work...
       * }
       * ```
       */
      poller(opts) {
        return new WorkPoller({ ...opts, client: this._client });
      }
      worker(opts) {
        return new EnvironmentWorker({ ...opts, client: this._client });
      }
    };
    Work.WorkPoller = WorkPoller;
    Work.EnvironmentWorker = EnvironmentWorker;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/environments/environments.mjs
var Environments;
var init_environments = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/environments/environments.mjs"() {
    init_resource();
    init_work();
    init_work();
    init_pagination();
    init_headers();
    init_path();
    Environments = class extends APIResource {
      constructor() {
        super(...arguments);
        this.work = new Work(this._client);
      }
      /**
       * Create a new environment with the specified configuration.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.create({
       *     name: 'python-data-analysis',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/environments?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a specific environment by ID.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.retrieve(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      retrieve(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/environments/${environmentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update an existing environment's configuration.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.update(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      update(environmentID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/environments/${environmentID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List environments with pagination support.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaEnvironment of client.beta.environments.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/environments?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete an environment by ID. Returns a confirmation of the deletion.
       *
       * @example
       * ```ts
       * const betaEnvironmentDeleteResponse =
       *   await client.beta.environments.delete(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      delete(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/environments/${environmentID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive an environment by ID. Archived environments cannot be used to create new
       * sessions.
       *
       * @example
       * ```ts
       * const betaEnvironment =
       *   await client.beta.environments.archive(
       *     'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   );
       * ```
       */
      archive(environmentID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/environments/${environmentID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Environments.Work = Work;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memories.mjs
var Memories;
var init_memories2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memories.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Memories = class extends APIResource {
      /**
       * Create a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.create(
       *     'memory_store_id',
       *     { content: 'content', path: 'xx' },
       *   );
       * ```
       */
      create(memoryStoreID, params, options) {
        const { view, betas, ...body } = params;
        return this._client.post(path2`/v1/memory_stores/${memoryStoreID}/memories?beta=true`, {
          query: { view },
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.retrieve(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      retrieve(memoryID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path2`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemory =
       *   await client.beta.memoryStores.memories.update(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      update(memoryID, params, options) {
        const { memory_store_id, view, betas, ...body } = params;
        return this._client.post(path2`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query: { view },
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memories
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryListItem of client.beta.memoryStores.memories.list(
       *   'memory_store_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/memory_stores/${memoryStoreID}/memories?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a memory
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedMemory =
       *   await client.beta.memoryStores.memories.delete(
       *     'memory_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      delete(memoryID, params, options) {
        const { memory_store_id, expected_content_sha256, betas } = params;
        return this._client.delete(path2`/v1/memory_stores/${memory_store_id}/memories/${memoryID}?beta=true`, {
          query: { expected_content_sha256 },
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-versions.mjs
var MemoryVersions;
var init_memory_versions = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    MemoryVersions = class extends APIResource {
      /**
       * Retrieve a memory version
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryVersion =
       *   await client.beta.memoryStores.memoryVersions.retrieve(
       *     'memory_version_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      retrieve(memoryVersionID, params, options) {
        const { memory_store_id, betas, ...query } = params;
        return this._client.get(path2`/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memory versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryVersion of client.beta.memoryStores.memoryVersions.list(
       *   'memory_store_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(memoryStoreID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/memory_stores/${memoryStoreID}/memory_versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Redact a memory version
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryVersion =
       *   await client.beta.memoryStores.memoryVersions.redact(
       *     'memory_version_id',
       *     { memory_store_id: 'memory_store_id' },
       *   );
       * ```
       */
      redact(memoryVersionID, params, options) {
        const { memory_store_id, betas } = params;
        return this._client.post(path2`/v1/memory_stores/${memory_store_id}/memory_versions/${memoryVersionID}/redact?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-stores.mjs
var MemoryStores;
var init_memory_stores = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/memory-stores/memory-stores.mjs"() {
    init_resource();
    init_memories2();
    init_memories2();
    init_memory_versions();
    init_memory_versions();
    init_pagination();
    init_headers();
    init_path();
    MemoryStores = class extends APIResource {
      constructor() {
        super(...arguments);
        this.memories = new Memories(this._client);
        this.memoryVersions = new MemoryVersions(this._client);
      }
      /**
       * Create a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.create({ name: 'x' });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/memory_stores?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Retrieve a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.retrieve(
       *     'memory_store_id',
       *   );
       * ```
       */
      retrieve(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.update('memory_store_id');
       * ```
       */
      update(memoryStoreID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List memory stores
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsMemoryStore of client.beta.memoryStores.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/memory_stores?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedMemoryStore =
       *   await client.beta.memoryStores.delete('memory_store_id');
       * ```
       */
      delete(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/memory_stores/${memoryStoreID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive a memory store
       *
       * @example
       * ```ts
       * const betaManagedAgentsMemoryStore =
       *   await client.beta.memoryStores.archive('memory_store_id');
       * ```
       */
      archive(memoryStoreID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/memory_stores/${memoryStoreID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "agent-memory-2026-07-22"].toString() },
            options?.headers
          ])
        });
      }
    };
    MemoryStores.Memories = Memories;
    MemoryStores.MemoryVersions = MemoryVersions;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/error.mjs
var init_error2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/error.mjs"() {
    init_error();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.mjs
var JSONLDecoder;
var init_jsonl = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/decoders/jsonl.mjs"() {
    init_error();
    init_shims();
    init_line();
    JSONLDecoder = class _JSONLDecoder {
      constructor(iterator, controller) {
        this.iterator = iterator;
        this.controller = controller;
      }
      async *decoder() {
        const lineDecoder = new LineDecoder();
        for await (const chunk of this.iterator) {
          for (const line of lineDecoder.decode(chunk)) {
            yield JSON.parse(line);
          }
        }
        for (const line of lineDecoder.flush()) {
          yield JSON.parse(line);
        }
      }
      [Symbol.asyncIterator]() {
        return this.decoder();
      }
      static fromResponse(response, controller) {
        if (!response.body) {
          controller.abort();
          if (typeof globalThis.navigator !== "undefined" && globalThis.navigator.product === "ReactNative") {
            throw new AnthropicError(`The default react-native fetch implementation does not support streaming. Please use expo/fetch: https://docs.expo.dev/versions/latest/sdk/expo/#expofetch-api`);
          }
          throw new AnthropicError(`Attempted to iterate over a response with no body`);
        }
        return new _JSONLDecoder(ReadableStreamToAsyncIterable(response.body), controller);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.mjs
var Batches;
var init_batches = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/messages/batches.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_jsonl();
    init_error2();
    init_path();
    Batches = class extends APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.create({
       *     requests: [
       *       {
       *         custom_id: 'my-custom-id-1',
       *         params: {
       *           max_tokens: 1024,
       *           messages: [
       *             { content: 'Hello, world', role: 'user' },
       *           ],
       *           model: 'claude-opus-5',
       *         },
       *       },
       *     ],
       *   });
       * ```
       */
      create(params, options) {
        const { betas, user_profile_id, ...body } = params;
        return this._client.post("/v1/messages/batches?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
              ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0
            },
            options?.headers
          ])
        });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.retrieve(
       *     'message_batch_id',
       *   );
       * ```
       */
      retrieve(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaMessageBatch of client.beta.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/messages/batches?beta=true", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaDeletedMessageBatch =
       *   await client.beta.messages.batches.delete(
       *     'message_batch_id',
       *   );
       * ```
       */
      delete(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/messages/batches/${messageBatchID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatch =
       *   await client.beta.messages.batches.cancel(
       *     'message_batch_id',
       *   );
       * ```
       */
      cancel(messageBatchID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/messages/batches/${messageBatchID}/cancel?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const betaMessageBatchIndividualResponse =
       *   await client.beta.messages.batches.results(
       *     'message_batch_id',
       *   );
       * ```
       */
      async results(messageBatchID, params = {}, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        const { betas } = params ?? {};
        return this._client.get(batch.results_url, {
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "message-batches-2024-09-24"].toString(),
              Accept: "application/binary"
            },
            options?.headers
          ]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/constants.mjs
var MODEL_NONSTREAMING_TOKENS;
var init_constants = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/constants.mjs"() {
    MODEL_NONSTREAMING_TOKENS = {
      "claude-opus-4@20250514": 8192,
      "anthropic.claude-opus-4-1-20250805-v1:0": 8192,
      "claude-opus-4-1@20250805": 8192
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/beta-parser.mjs
function getOutputFormat(params) {
  return params?.output_format ?? params?.output_config?.format;
}
function maybeParseBetaMessage(message, params, opts) {
  const outputFormat = getOutputFormat(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return Object.defineProperty(parsedBlock, "parsed", {
            get() {
              opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
              return null;
            },
            enumerable: false
          });
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseBetaMessage(message, params, opts);
}
function parseBetaMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseBetaOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return Object.defineProperty(parsedBlock, "parsed", {
        get() {
          opts.logger.warn("The `parsed` property on `text` blocks is deprecated, please use `parsed_output` instead.");
          return parsedOutput;
        },
        enumerable: false
      });
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseBetaOutputFormat(params, content) {
  const outputFormat = getOutputFormat(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}
var init_beta_parser = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/beta-parser.mjs"() {
    init_error();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/streaming.mjs
var init_streaming2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/streaming.mjs"() {
    init_streaming();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.mjs
var tokenize, strip, unstrip, generate, partialParse;
var init_parser = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/_vendor/partial-json-parser/parser.mjs"() {
    tokenize = (input) => {
      let current = 0;
      let tokens = [];
      while (current < input.length) {
        let char = input[current];
        if (char === "\\") {
          current++;
          continue;
        }
        if (char === "{") {
          tokens.push({
            type: "brace",
            value: "{"
          });
          current++;
          continue;
        }
        if (char === "}") {
          tokens.push({
            type: "brace",
            value: "}"
          });
          current++;
          continue;
        }
        if (char === "[") {
          tokens.push({
            type: "paren",
            value: "["
          });
          current++;
          continue;
        }
        if (char === "]") {
          tokens.push({
            type: "paren",
            value: "]"
          });
          current++;
          continue;
        }
        if (char === ":") {
          tokens.push({
            type: "separator",
            value: ":"
          });
          current++;
          continue;
        }
        if (char === ",") {
          tokens.push({
            type: "delimiter",
            value: ","
          });
          current++;
          continue;
        }
        if (char === '"') {
          let value = "";
          let danglingQuote = false;
          char = input[++current];
          while (char !== '"') {
            if (current === input.length) {
              danglingQuote = true;
              break;
            }
            if (char === "\\") {
              current++;
              if (current === input.length) {
                danglingQuote = true;
                break;
              }
              value += char + input[current];
              char = input[++current];
            } else {
              value += char;
              char = input[++current];
            }
          }
          char = input[++current];
          if (!danglingQuote) {
            tokens.push({
              type: "string",
              value
            });
          }
          continue;
        }
        let WHITESPACE = /\s/;
        if (char && WHITESPACE.test(char)) {
          current++;
          continue;
        }
        let NUMBERS = /[0-9]/;
        if (char && NUMBERS.test(char) || char === "-" || char === ".") {
          let value = "";
          if (char === "-") {
            value += char;
            char = input[++current];
          }
          while (char && (NUMBERS.test(char) || char === "." || // exponent marker, e.g. `1e10` or `1.5E-9`
          char === "e" || char === "E" || // exponent sign, only valid immediately after the exponent marker
          (char === "-" || char === "+") && (value[value.length - 1] === "e" || value[value.length - 1] === "E"))) {
            value += char;
            char = input[++current];
          }
          tokens.push({
            type: "number",
            value
          });
          continue;
        }
        let LETTERS = /[a-z]/i;
        if (char && LETTERS.test(char)) {
          let value = "";
          while (char && LETTERS.test(char)) {
            if (current === input.length) {
              break;
            }
            value += char;
            char = input[++current];
          }
          if (value == "true" || value == "false" || value === "null") {
            tokens.push({
              type: "name",
              value
            });
          } else {
            current++;
            continue;
          }
          continue;
        }
        current++;
      }
      return tokens;
    };
    strip = (tokens) => {
      if (tokens.length === 0) {
        return tokens;
      }
      let lastToken = tokens[tokens.length - 1];
      switch (lastToken.type) {
        case "separator":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
        case "number":
          let lastCharacterOfLastToken = lastToken.value[lastToken.value.length - 1];
          if (lastCharacterOfLastToken === "." || lastCharacterOfLastToken === "-" || lastCharacterOfLastToken === "+" || lastCharacterOfLastToken === "e" || lastCharacterOfLastToken === "E") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
        case "string":
          let tokenBeforeTheLastToken = tokens[tokens.length - 2];
          if (tokenBeforeTheLastToken?.type === "delimiter") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          } else if (tokenBeforeTheLastToken?.type === "brace" && tokenBeforeTheLastToken.value === "{") {
            tokens = tokens.slice(0, tokens.length - 1);
            return strip(tokens);
          }
          break;
        case "delimiter":
          tokens = tokens.slice(0, tokens.length - 1);
          return strip(tokens);
          break;
      }
      return tokens;
    };
    unstrip = (tokens) => {
      let tail = [];
      tokens.map((token) => {
        if (token.type === "brace") {
          if (token.value === "{") {
            tail.push("}");
          } else {
            tail.splice(tail.lastIndexOf("}"), 1);
          }
        }
        if (token.type === "paren") {
          if (token.value === "[") {
            tail.push("]");
          } else {
            tail.splice(tail.lastIndexOf("]"), 1);
          }
        }
      });
      if (tail.length > 0) {
        tail.reverse().map((item) => {
          if (item === "}") {
            tokens.push({
              type: "brace",
              value: "}"
            });
          } else if (item === "]") {
            tokens.push({
              type: "paren",
              value: "]"
            });
          }
        });
      }
      return tokens;
    };
    generate = (tokens) => {
      let output = "";
      tokens.map((token) => {
        switch (token.type) {
          case "string":
            output += '"' + token.value + '"';
            break;
          default:
            output += token.value;
            break;
        }
      });
      return output;
    };
    partialParse = (input) => JSON.parse(generate(unstrip(strip(tokenize(input)))));
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/message-stream-utils.mjs
function withLazyInput(prev, jsonBuf) {
  const next = {};
  for (const key of Object.keys(prev)) {
    if (key !== "input")
      next[key] = prev[key];
  }
  Object.defineProperty(next, JSON_BUF_PROPERTY, { value: jsonBuf, enumerable: false, writable: true });
  let input;
  let parsed = false;
  Object.defineProperty(next, "input", {
    enumerable: true,
    configurable: true,
    get() {
      if (!parsed) {
        input = jsonBuf ? partialParse(jsonBuf) : {};
        parsed = true;
      }
      return input;
    }
  });
  return next;
}
var JSON_BUF_PROPERTY;
var init_message_stream_utils = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/internal/message-stream-utils.mjs"() {
    init_parser();
    JSON_BUF_PROPERTY = "__json_buf";
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.mjs
function tracksToolInput(content) {
  return content.type === "tool_use" || content.type === "server_tool_use" || content.type === "mcp_tool_use";
}
var _BetaMessageStream_instances, _BetaMessageStream_currentMessageSnapshot, _BetaMessageStream_params, _BetaMessageStream_connectedPromise, _BetaMessageStream_resolveConnectedPromise, _BetaMessageStream_rejectConnectedPromise, _BetaMessageStream_endPromise, _BetaMessageStream_resolveEndPromise, _BetaMessageStream_rejectEndPromise, _BetaMessageStream_listeners, _BetaMessageStream_ended, _BetaMessageStream_errored, _BetaMessageStream_aborted, _BetaMessageStream_catchingPromiseCreated, _BetaMessageStream_response, _BetaMessageStream_request_id, _BetaMessageStream_workspace_id, _BetaMessageStream_logger, _BetaMessageStream_getFinalMessage, _BetaMessageStream_getFinalText, _BetaMessageStream_handleError, _BetaMessageStream_beginRequest, _BetaMessageStream_addStreamEvent, _BetaMessageStream_endRequest, _BetaMessageStream_accumulateMessage, _BetaMessageStream_toolInputParseError, BetaMessageStream;
var init_BetaMessageStream = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.mjs"() {
    init_tslib();
    init_stainless_helper_header();
    init_error2();
    init_errors();
    init_values();
    init_streaming2();
    init_beta_parser();
    init_message_stream_utils();
    BetaMessageStream = class _BetaMessageStream {
      constructor(params, opts) {
        _BetaMessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _BetaMessageStream_currentMessageSnapshot.set(this, void 0);
        _BetaMessageStream_params.set(this, null);
        this.controller = new AbortController();
        _BetaMessageStream_connectedPromise.set(this, void 0);
        _BetaMessageStream_resolveConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_rejectConnectedPromise.set(this, () => {
        });
        _BetaMessageStream_endPromise.set(this, void 0);
        _BetaMessageStream_resolveEndPromise.set(this, () => {
        });
        _BetaMessageStream_rejectEndPromise.set(this, () => {
        });
        _BetaMessageStream_listeners.set(this, {});
        _BetaMessageStream_ended.set(this, false);
        _BetaMessageStream_errored.set(this, false);
        _BetaMessageStream_aborted.set(this, false);
        _BetaMessageStream_catchingPromiseCreated.set(this, false);
        _BetaMessageStream_response.set(this, void 0);
        _BetaMessageStream_request_id.set(this, void 0);
        _BetaMessageStream_workspace_id.set(this, void 0);
        _BetaMessageStream_logger.set(this, void 0);
        _BetaMessageStream_handleError.set(this, (error) => {
          __classPrivateFieldSet(this, _BetaMessageStream_errored, true, "f");
          if (isAbortError(error)) {
            error = new APIUserAbortError();
          }
          if (error instanceof APIUserAbortError) {
            __classPrivateFieldSet(this, _BetaMessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new AnthropicError(String(error)));
        });
        __classPrivateFieldSet(this, _BetaMessageStream_connectedPromise, new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_resolveConnectedPromise, resolve2, "f");
          __classPrivateFieldSet(this, _BetaMessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        __classPrivateFieldSet(this, _BetaMessageStream_endPromise, new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_resolveEndPromise, resolve2, "f");
          __classPrivateFieldSet(this, _BetaMessageStream_rejectEndPromise, reject, "f");
        }), "f");
        __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f").catch(() => {
        });
        __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f").catch(() => {
        });
        __classPrivateFieldSet(this, _BetaMessageStream_params, params, "f");
        __classPrivateFieldSet(this, _BetaMessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return __classPrivateFieldGet(this, _BetaMessageStream_response, "f");
      }
      get request_id() {
        return __classPrivateFieldGet(this, _BetaMessageStream_request_id, "f");
      }
      get workspace_id() {
        return __classPrivateFieldGet(this, _BetaMessageStream_workspace_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        const response = await __classPrivateFieldGet(this, _BetaMessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id"),
          workspace_id: response.headers.get("anthropic-workspace-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream2) {
        const runner = new _BetaMessageStream(null);
        runner._run(() => runner._fromReadableStream(stream2));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _BetaMessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        __classPrivateFieldSet(runner, _BetaMessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, [STAINLESS_HELPER_METHOD_HEADER]: "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit2 = true) {
        this.receivedMessages.push(message);
        if (emit2) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          const { response, data: stream2 } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream2) {
            __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream2.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _BetaMessageStream_response, response, "f");
        __classPrivateFieldSet(this, _BetaMessageStream_request_id, response?.headers.get("request-id"), "f");
        __classPrivateFieldSet(this, _BetaMessageStream_workspace_id, response?.headers.get("anthropic-workspace-id"), "f");
        __classPrivateFieldGet(this, _BetaMessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return __classPrivateFieldGet(this, _BetaMessageStream_ended, "f");
      }
      get errored() {
        return __classPrivateFieldGet(this, _BetaMessageStream_errored, "f");
      }
      get aborted() {
        return __classPrivateFieldGet(this, _BetaMessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve2);
        });
      }
      async done() {
        __classPrivateFieldSet(this, _BetaMessageStream_catchingPromiseCreated, true, "f");
        await __classPrivateFieldGet(this, _BetaMessageStream_endPromise, "f");
      }
      get currentMessage() {
        return __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed` field.
       */
      async finalMessage() {
        await this.done();
        return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (__classPrivateFieldGet(this, _BetaMessageStream_ended, "f"))
          return;
        if (event === "end") {
          __classPrivateFieldSet(this, _BetaMessageStream_ended, true, "f");
          __classPrivateFieldGet(this, _BetaMessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event];
        if (listeners) {
          __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _BetaMessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _BetaMessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _BetaMessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_beginRequest).call(this);
          this._connected(null);
          const stream2 = Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream2) {
            __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_addStreamEvent).call(this, event);
          }
          if (stream2.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_BetaMessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_params = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_listeners = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_ended = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_errored = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_aborted = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_response = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_request_id = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_workspace_id = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_logger = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_handleError = /* @__PURE__ */ new WeakMap(), _BetaMessageStream_instances = /* @__PURE__ */ new WeakSet(), _BetaMessageStream_getFinalMessage = function _BetaMessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _BetaMessageStream_getFinalText = function _BetaMessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _BetaMessageStream_beginRequest = function _BetaMessageStream_beginRequest2() {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
      }, _BetaMessageStream_addStreamEvent = function _BetaMessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput(content) && __classPrivateFieldGet(this, _BetaMessageStream_listeners, "f").inputJson?.length) {
                  let jsonSnapshot;
                  try {
                    jsonSnapshot = content.input;
                  } catch (err) {
                    __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_toolInputParseError).call(this, content, err));
                    break;
                  }
                  this._emit("inputJson", event.delta.partial_json, jsonSnapshot);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              case "compaction_delta": {
                if (content.type === "compaction" && content.content) {
                  this._emit("compaction", content.content);
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage(maybeParseBetaMessage(messageSnapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _BetaMessageStream_endRequest = function _BetaMessageStream_endRequest2() {
        if (this.ended) {
          throw new AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new AnthropicError(`request ended without sending any chunks`);
        }
        __classPrivateFieldSet(this, _BetaMessageStream_currentMessageSnapshot, void 0, "f");
        return maybeParseBetaMessage(snapshot, __classPrivateFieldGet(this, _BetaMessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _BetaMessageStream_logger, "f") });
      }, _BetaMessageStream_accumulateMessage = function _BetaMessageStream_accumulateMessage2(event) {
        let snapshot = __classPrivateFieldGet(this, _BetaMessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            snapshot.stop_details = event.delta.stop_details;
            snapshot.usage.output_tokens = event.usage.output_tokens;
            if (event.delta.container != null) {
              snapshot.container = event.delta.container;
            }
            if (event.context_management != null) {
              snapshot.context_management = event.context_management;
            }
            if (event.input_transformations != null) {
              snapshot.input_transformations = event.input_transformations;
            }
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            if (event.usage.iterations != null) {
              snapshot.usage.iterations = event.usage.iterations;
            }
            if (event.usage.fallback_credit != null) {
              snapshot.usage.fallback_credit = event.usage.fallback_credit;
            }
            if (event.usage.output_tokens_details != null) {
              snapshot.usage.output_tokens_details = event.usage.output_tokens_details;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push(event.content_block);
            if (event.content_block.type === "fallback") {
              snapshot.model = event.content_block.to.model;
            }
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput(snapshotContent)) {
                  const jsonBuf = (snapshotContent[JSON_BUF_PROPERTY] || "") + event.delta.partial_json;
                  snapshot.content[event.index] = withLazyInput(snapshotContent, jsonBuf);
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              case "compaction_delta": {
                if (snapshotContent?.type === "compaction") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    content: (snapshotContent.content || "") + event.delta.content,
                    encrypted_content: event.delta.encrypted_content
                  };
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop": {
            const snapshotContent = snapshot.content.at(event.index);
            if (snapshotContent && tracksToolInput(snapshotContent) && JSON_BUF_PROPERTY in snapshotContent) {
              let input;
              try {
                input = snapshotContent.input;
              } catch (err) {
                input = {};
                __classPrivateFieldGet(this, _BetaMessageStream_handleError, "f").call(this, __classPrivateFieldGet(this, _BetaMessageStream_instances, "m", _BetaMessageStream_toolInputParseError).call(this, snapshotContent, err));
              }
              Object.defineProperty(snapshotContent, "input", {
                value: input,
                enumerable: true,
                configurable: true,
                writable: true
              });
            }
            return snapshot;
          }
        }
      }, _BetaMessageStream_toolInputParseError = function _BetaMessageStream_toolInputParseError2(block, err) {
        const jsonBuf = block[JSON_BUF_PROPERTY];
        return new AnthropicError(`Unable to parse tool parameter JSON from model. Please retry your request or adjust your prompt. Error: ${err}. JSON: ${jsonBuf}`);
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve2, reject) => readQueue.push({ resolve: resolve2, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream2 = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream2.toReadableStream();
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.mjs
var DEFAULT_TOKEN_THRESHOLD, DEFAULT_SUMMARY_PROMPT;
var init_CompactionControl = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/CompactionControl.mjs"() {
    DEFAULT_TOKEN_THRESHOLD = 1e5;
    DEFAULT_SUMMARY_PROMPT = `You have been working on the task described above but have not yet completed it. Write a continuation summary that will allow you (or another instance of yourself) to resume work efficiently in a future context window where the conversation history will be replaced with this summary. Your summary should be structured, concise, and actionable. Include:
1. Task Overview
The user's core request and success criteria
Any clarifications or constraints they specified
2. Current State
What has been completed so far
Files created, modified, or analyzed (with paths if relevant)
Key outputs or artifacts produced
3. Important Discoveries
Technical constraints or requirements uncovered
Decisions made and their rationale
Errors encountered and how they were resolved
What approaches were tried that didn't work (and why)
4. Next Steps
Specific actions needed to complete the task
Any blockers or open questions to resolve
Priority order if multiple steps remain
5. Context to Preserve
User preferences or style requirements
Domain-specific details that aren't obvious
Any promises made to the user
Be concise but complete\u2014err on the side of including information that would prevent duplicate work or repeated mistakes. Write in a way that enables immediate resumption of the task.
Wrap your summary in <summary></summary> tags.`;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.mjs
async function generateToolResponse(params, lastMessage = params.messages.at(-1), requestOptions) {
  if (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content || typeof lastMessage.content === "string") {
    return null;
  }
  const toolUseBlocks = lastMessage.content.filter((content) => content.type === "tool_use");
  if (toolUseBlocks.length === 0) {
    return null;
  }
  const available = availableToolNames(params);
  const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
    const tool = params.tools.find((t) => ("name" in t ? t.name : "mcp_server_name" in t ? t.mcp_server_name : t.type) === toolUse.name);
    if (!tool || !("run" in tool) || !available.has(toolUse.name)) {
      return toolNotFoundResult(toolUse);
    }
    try {
      let input = toolUse.input;
      if ("parse" in tool && tool.parse) {
        input = tool.parse(input);
      }
      const result = await tool.run(input, {
        toolUse,
        toolUseBlock: toolUse,
        signal: requestOptions?.signal
      });
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result
      };
    } catch (error) {
      return {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: error instanceof ToolError ? error.content : `Error: ${error instanceof Error ? error.message : String(error)}`,
        is_error: true
      };
    }
  }));
  return {
    role: "user",
    content: toolResults
  };
}
function toolNotFoundResult(toolUse) {
  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: `Error: Tool '${toolUse.name}' not found`,
    is_error: true
  };
}
function availableToolNames(params) {
  const available = /* @__PURE__ */ new Set();
  for (const tool of params.tools) {
    if ("run" in tool) {
      available.add(tool.name);
    }
  }
  for (const message of params.messages) {
    if (message.role !== "system" || typeof message.content === "string") {
      continue;
    }
    for (const block of message.content) {
      applyToolChange(block, available);
    }
  }
  return available;
}
function applyToolChange(block, available) {
  switch (block.type) {
    case "tool_removal":
    case "tool_addition":
      applyToolReference(block, available);
      break;
  }
}
function applyToolReference(block, available) {
  const name = referencedToolName(block.tool);
  if (name === void 0)
    return;
  if (block.type === "tool_removal") {
    available.delete(name);
  } else {
    available.add(name);
  }
}
function referencedToolName(ref) {
  switch (ref.type) {
    case "tool_reference":
      return ref.name;
    default:
      return void 0;
  }
}
function determineNextStepFromStopReason(stopReason) {
  if (stopReason === null)
    return "stop";
  switch (stopReason) {
    case "tool_use":
      return "run_tools";
    case "pause_turn":
    // pause_after_compaction hands the turn back before the model answers; sending it back
    // unchanged continues it.
    case "compaction":
      return "resume";
    case "end_turn":
    case "stop_sequence":
    case "max_tokens":
    case "model_context_window_exceeded":
    case "refusal":
      return "stop";
    default:
      checkNever(stopReason);
      return "stop";
  }
}
var _BetaToolRunner_instances, _BetaToolRunner_consumed, _BetaToolRunner_mutated, _BetaToolRunner_state, _BetaToolRunner_options, _BetaToolRunner_message, _BetaToolRunner_toolResponse, _BetaToolRunner_completion, _BetaToolRunner_iterationCount, _BetaToolRunner_checkAndCompact, _BetaToolRunner_generateToolResponse, BetaToolRunner;
var init_BetaToolRunner = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/tools/BetaToolRunner.mjs"() {
    init_tslib();
    init_ToolError();
    init_error();
    init_headers();
    init_promise();
    init_values();
    init_CompactionControl();
    init_stainless_helper_header();
    BetaToolRunner = class {
      constructor(client, params, options) {
        _BetaToolRunner_instances.add(this);
        this.client = client;
        _BetaToolRunner_consumed.set(this, false);
        _BetaToolRunner_mutated.set(this, false);
        _BetaToolRunner_state.set(this, void 0);
        _BetaToolRunner_options.set(this, void 0);
        _BetaToolRunner_message.set(this, void 0);
        _BetaToolRunner_toolResponse.set(this, void 0);
        _BetaToolRunner_completion.set(this, void 0);
        _BetaToolRunner_iterationCount.set(this, 0);
        __classPrivateFieldSet(this, _BetaToolRunner_state, {
          params: {
            // You can't clone the entire params since there are functions as handlers.
            // You also don't really need to clone params.messages, but it probably will prevent a foot gun
            // somewhere.
            ...params,
            messages: structuredClone(params.messages)
          }
        }, "f");
        const collected = collectStainlessHelpers(params.tools, params.messages);
        __classPrivateFieldSet(this, _BetaToolRunner_options, {
          ...options,
          headers: buildHeaders([
            helperHeader("BetaToolRunner"),
            collected.length ? { [STAINLESS_HELPER_HEADER]: collected.join(", ") } : void 0,
            options?.headers
          ])
        }, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
        if (params.compactionControl?.enabled) {
          console.warn('Anthropic: The `compactionControl` parameter is deprecated and will be removed in a future version. Use server-side compaction instead by passing `edits: [{ type: "compact_20260112" }]` in the params passed to `toolRunner()`. See https://platform.claude.com/docs/en/build-with-claude/compaction');
        }
      }
      async *[(_BetaToolRunner_consumed = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_mutated = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_state = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_options = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_message = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_toolResponse = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_completion = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_iterationCount = /* @__PURE__ */ new WeakMap(), _BetaToolRunner_instances = /* @__PURE__ */ new WeakSet(), _BetaToolRunner_checkAndCompact = async function _BetaToolRunner_checkAndCompact2() {
        const compactionControl = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.compactionControl;
        if (!compactionControl || !compactionControl.enabled) {
          return false;
        }
        let tokensUsed = 0;
        if (__classPrivateFieldGet(this, _BetaToolRunner_message, "f") !== void 0) {
          try {
            const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
            const totalInputTokens = message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0);
            tokensUsed = totalInputTokens + message.usage.output_tokens;
          } catch {
            return false;
          }
        }
        const threshold = compactionControl.contextTokenThreshold ?? DEFAULT_TOKEN_THRESHOLD;
        if (tokensUsed < threshold) {
          return false;
        }
        const model = compactionControl.model ?? __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.model;
        const summaryPrompt = compactionControl.summaryPrompt ?? DEFAULT_SUMMARY_PROMPT;
        const messages = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages;
        if (messages[messages.length - 1].role === "assistant") {
          const lastMessage = messages[messages.length - 1];
          if (Array.isArray(lastMessage.content)) {
            const nonToolBlocks = lastMessage.content.filter((block) => block.type !== "tool_use");
            if (nonToolBlocks.length === 0) {
              messages.pop();
            } else {
              lastMessage.content = nonToolBlocks;
            }
          }
        }
        const response = await this.client.beta.messages.create({
          model,
          messages: [
            ...messages,
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: summaryPrompt
                }
              ]
            }
          ],
          max_tokens: __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_tokens
        }, {
          signal: __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal,
          headers: buildHeaders([__classPrivateFieldGet(this, _BetaToolRunner_options, "f").headers, helperHeader("compaction")])
        });
        if (response.content[0]?.type !== "text") {
          throw new AnthropicError("Expected text response for compaction");
        }
        __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages = [
          {
            role: "user",
            content: response.content
          }
        ];
        return true;
      }, Symbol.asyncIterator)]() {
        var _a2;
        if (__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          throw new AnthropicError("Cannot iterate over a consumed stream");
        }
        __classPrivateFieldSet(this, _BetaToolRunner_consumed, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
        try {
          while (true) {
            let stream2;
            try {
              if (__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations && __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f") >= __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.max_iterations) {
                break;
              }
              __classPrivateFieldSet(this, _BetaToolRunner_mutated, false, "f");
              __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
              __classPrivateFieldSet(this, _BetaToolRunner_iterationCount, (_a2 = __classPrivateFieldGet(this, _BetaToolRunner_iterationCount, "f"), _a2++, _a2), "f");
              __classPrivateFieldSet(this, _BetaToolRunner_message, void 0, "f");
              const { max_iterations, compactionControl, ...params } = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
              if (params.stream) {
                stream2 = this.client.beta.messages.stream({ ...params }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f"));
                __classPrivateFieldSet(this, _BetaToolRunner_message, stream2.finalMessage(), "f");
                __classPrivateFieldGet(this, _BetaToolRunner_message, "f").catch(() => {
                });
                yield stream2;
              } else {
                __classPrivateFieldSet(this, _BetaToolRunner_message, this.client.beta.messages.create({ ...params, stream: false }, __classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
                yield __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
              }
              const isCompacted = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_checkAndCompact).call(this);
              if (!isCompacted) {
                if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f");
                  const nextStep = determineNextStepFromStopReason(message.stop_reason);
                  __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push({ role: message.role, content: message.content });
                  const { container } = __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
                  if (message.container) {
                    if (container == null) {
                      __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.container = message.container.id;
                    } else if (typeof container === "object" && container.id == null) {
                      __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.container = { ...container, id: message.container.id };
                    }
                  }
                  if (nextStep === "stop") {
                    break;
                  }
                  if (nextStep === "resume") {
                    continue;
                  }
                }
                const toolMessage = await __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.at(-1));
                if (toolMessage) {
                  __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params.messages.push(toolMessage);
                } else if (!__classPrivateFieldGet(this, _BetaToolRunner_mutated, "f")) {
                  break;
                }
              }
            } finally {
              if (stream2) {
                stream2.abort();
              }
            }
          }
          if (!__classPrivateFieldGet(this, _BetaToolRunner_message, "f")) {
            throw new AnthropicError("ToolRunner concluded without a message from the server");
          }
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").resolve(await __classPrivateFieldGet(this, _BetaToolRunner_message, "f"));
        } catch (error) {
          __classPrivateFieldSet(this, _BetaToolRunner_consumed, false, "f");
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise.catch(() => {
          });
          __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").reject(error);
          __classPrivateFieldSet(this, _BetaToolRunner_completion, promiseWithResolvers(), "f");
          throw error;
        }
      }
      setMessagesParams(paramsOrMutator) {
        if (typeof paramsOrMutator === "function") {
          __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params);
        } else {
          __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params = paramsOrMutator;
        }
        __classPrivateFieldSet(this, _BetaToolRunner_mutated, true, "f");
        __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, void 0, "f");
      }
      setRequestOptions(optionsOrMutator) {
        if (typeof optionsOrMutator === "function") {
          __classPrivateFieldSet(this, _BetaToolRunner_options, optionsOrMutator(__classPrivateFieldGet(this, _BetaToolRunner_options, "f")), "f");
        } else {
          __classPrivateFieldSet(this, _BetaToolRunner_options, { ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"), ...optionsOrMutator }, "f");
        }
      }
      /**
       * Get the tool response for the last message from the assistant.
       * Avoids redundant tool executions by caching results.
       *
       * @returns A promise that resolves to a BetaMessageParam containing tool results, or null if no tools need to be executed
       *
       * @example
       * const toolResponse = await runner.generateToolResponse();
       * if (toolResponse) {
       *   console.log('Tool results:', toolResponse.content);
       * }
       */
      async generateToolResponse(signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
        const message = await __classPrivateFieldGet(this, _BetaToolRunner_message, "f") ?? this.params.messages.at(-1);
        if (!message) {
          return null;
        }
        return __classPrivateFieldGet(this, _BetaToolRunner_instances, "m", _BetaToolRunner_generateToolResponse).call(this, message, signal);
      }
      /**
       * Wait for the async iterator to complete. This works even if the async iterator hasn't yet started, and
       * will wait for an instance to start and go to completion.
       *
       * @returns A promise that resolves to the final BetaMessage when the iterator completes
       *
       * @example
       * // Start consuming the iterator
       * for await (const message of runner) {
       *   console.log('Message:', message.content);
       * }
       *
       * // Meanwhile, wait for completion from another part of the code
       * const finalMessage = await runner.done();
       * console.log('Final response:', finalMessage.content);
       */
      done() {
        return __classPrivateFieldGet(this, _BetaToolRunner_completion, "f").promise;
      }
      /**
       * Returns a promise indicating that the stream is done. Unlike .done(), this will eagerly read the stream:
       * * If the iterator has not been consumed, consume the entire iterator and return the final message from the
       * assistant.
       * * If the iterator has been consumed, waits for it to complete and returns the final message.
       *
       * @returns A promise that resolves to the final BetaMessage from the conversation
       * @throws {AnthropicError} If no messages were processed during the conversation
       *
       * @example
       * const finalMessage = await runner.runUntilDone();
       * console.log('Final response:', finalMessage.content);
       */
      async runUntilDone() {
        if (!__classPrivateFieldGet(this, _BetaToolRunner_consumed, "f")) {
          for await (const _ of this) {
          }
        }
        return this.done();
      }
      /**
       * Get the current parameters being used by the ToolRunner.
       *
       * @returns A readonly view of the current ToolRunnerParams
       *
       * @example
       * const currentParams = runner.params;
       * console.log('Current model:', currentParams.model);
       * console.log('Message count:', currentParams.messages.length);
       */
      get params() {
        return __classPrivateFieldGet(this, _BetaToolRunner_state, "f").params;
      }
      /**
       * Add one or more messages to the conversation history.
       *
       * @param messages - One or more BetaMessageParam objects to add to the conversation
       *
       * @example
       * runner.pushMessages(
       *   { role: 'user', content: 'Also, what about the weather in NYC?' }
       * );
       *
       * @example
       * // Adding multiple messages
       * runner.pushMessages(
       *   { role: 'user', content: 'What about NYC?' },
       *   { role: 'user', content: 'And Boston?' }
       * );
       */
      pushMessages(...messages) {
        this.setMessagesParams((params) => ({
          ...params,
          messages: [...params.messages, ...messages]
        }));
      }
      /**
       * Makes the ToolRunner directly awaitable, equivalent to calling .runUntilDone()
       * This allows using `await runner` instead of `await runner.runUntilDone()`
       */
      then(onfulfilled, onrejected) {
        return this.runUntilDone().then(onfulfilled, onrejected);
      }
    };
    _BetaToolRunner_generateToolResponse = async function _BetaToolRunner_generateToolResponse2(lastMessage, signal = __classPrivateFieldGet(this, _BetaToolRunner_options, "f").signal) {
      if (__classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f") !== void 0) {
        return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
      }
      __classPrivateFieldSet(this, _BetaToolRunner_toolResponse, generateToolResponse(__classPrivateFieldGet(this, _BetaToolRunner_state, "f").params, lastMessage, {
        ...__classPrivateFieldGet(this, _BetaToolRunner_options, "f"),
        signal
      }), "f");
      return __classPrivateFieldGet(this, _BetaToolRunner_toolResponse, "f");
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.mjs
function transformOutputFormat(params) {
  if (!params.output_format) {
    return params;
  }
  if (params.output_config?.format) {
    throw new AnthropicError("Both output_format and output_config.format were provided. Please use only output_config.format (output_format is deprecated).");
  }
  const { output_format, ...rest } = params;
  return {
    ...rest,
    output_config: {
      ...params.output_config,
      format: output_format
    }
  };
}
var DEPRECATED_MODELS, MODELS_TO_WARN_WITH_THINKING_ENABLED, Messages;
var init_messages = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/messages/messages.mjs"() {
    init_error2();
    init_batches();
    init_resource();
    init_constants();
    init_headers();
    init_stainless_helper_header();
    init_beta_parser();
    init_BetaMessageStream();
    init_BetaToolRunner();
    init_ToolError();
    init_batches();
    init_BetaToolRunner();
    init_ToolError();
    DEPRECATED_MODELS = {};
    MODELS_TO_WARN_WITH_THINKING_ENABLED = ["claude-mythos-preview", "claude-opus-4-6"];
    Messages = class extends APIResource {
      constructor() {
        super(...arguments);
        this.batches = new Batches(this._client);
      }
      create(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, user_profile_id, ...body } = modifiedParams;
        if (body.model in DEPRECATED_MODELS) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (MODELS_TO_WARN_WITH_THINKING_ENABLED.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = options?.timeout ?? this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader2 = stainlessHelperHeader(body.tools, body.messages);
        return this._client.post("/v1/messages?beta=true", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            {
              ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0,
              ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0
            },
            helperHeader2,
            options?.headers
          ]),
          stream: modifiedParams.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.beta.messages.parse({
       *   model: 'claude-3-5-sonnet-20241022',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_format: zodOutputFormat(z.object({ answer: z.number() }), 'math'),
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        options = {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...params.betas ?? [], "structured-outputs-2025-12-15"].toString() },
            options?.headers
          ])
        };
        return this.create(params, options).then((message) => parseBetaMessage(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream
       */
      stream(body, options) {
        return BetaMessageStream.createMessage(this, body, options);
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const betaMessageTokensCount =
       *   await client.beta.messages.countTokens({
       *     messages: [{ content: 'Hello, world', role: 'user' }],
       *     model: 'claude-opus-5',
       *   });
       * ```
       */
      countTokens(params, options) {
        const modifiedParams = transformOutputFormat(params);
        const { betas, user_profile_id, ...body } = modifiedParams;
        return this._client.post("/v1/messages/count_tokens?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            {
              "anthropic-beta": [...betas ?? [], "token-counting-2024-11-01"].toString(),
              ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0
            },
            options?.headers
          ])
        });
      }
      toolRunner(body, options) {
        return new BetaToolRunner(this._client, body, options);
      }
    };
    Messages.Batches = Batches;
    Messages.BetaToolRunner = BetaToolRunner;
    Messages.ToolError = ToolError;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/api-keys.mjs
var APIKeys;
var init_api_keys = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/api-keys.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    APIKeys = class extends APIResource {
      /**
       * Get API Key
       *
       * @example
       * ```ts
       * const betaAPIKey =
       *   await client.beta.organization.apiKeys.retrieve(
       *     'api_key_id',
       *   );
       * ```
       */
      retrieve(apiKeyID, options) {
        return this._client.get(path2`/v1/organizations/api_keys/${apiKeyID}?beta=true`, options);
      }
      /**
       * Update API Key
       *
       * @example
       * ```ts
       * const betaAPIKey =
       *   await client.beta.organization.apiKeys.update(
       *     'api_key_id',
       *   );
       * ```
       */
      update(apiKeyID, body, options) {
        return this._client.post(path2`/v1/organizations/api_keys/${apiKeyID}?beta=true`, { body, ...options });
      }
      /**
       * List API Keys
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaAPIKey of client.beta.organization.apiKeys.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/api_keys?beta=true", Page, {
          query,
          ...options
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/compliance-settings.mjs
var ComplianceSettings;
var init_compliance_settings = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/compliance-settings.mjs"() {
    init_resource();
    ComplianceSettings = class extends APIResource {
      /**
       * Retrieve your organization's Compliance Settings.
       *
       * Compliance Settings is a singleton resource: there is exactly one per
       * organization, addressed without an identifier. The `state` field reflects
       * whether the Compliance API is enabled. An organization with a parent
       * organization reads the state inherited from the parent's configuration.
       *
       * @example
       * ```ts
       * const betaComplianceSettings =
       *   await client.beta.organization.complianceSettings.retrieve();
       * ```
       */
      retrieve(options) {
        return this._client.get("/v1/organizations/compliance_settings?beta=true", options);
      }
      /**
       * Update your organization's Compliance Settings.
       *
       * Setting `state` to `enabled` turns on the Compliance API and begins capturing
       * organization activity events. Setting it to `disabled` turns both off. `state`
       * reflects whether the Compliance API is enabled.
       *
       * A request that sets `state` to its current value succeeds and leaves the
       * resource unchanged. A `disabled` request stays in effect until a later `enabled`
       * request or the organization's next provisioning action that enables Access
       * Transparency: enabling Access Transparency also enables the Compliance API,
       * which serves its activity events, so such provisioning (including re-runs)
       * re-enables the Compliance API even after a `disabled` request. Automated
       * provisioning never disables compliance settings.
       *
       * @example
       * ```ts
       * const betaComplianceSettings =
       *   await client.beta.organization.complianceSettings.update({
       *     state: { type: 'enabled' },
       *   });
       * ```
       */
      update(body, options) {
        return this._client.post("/v1/organizations/compliance_settings?beta=true", { body, ...options });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/external-keys.mjs
var ExternalKeys;
var init_external_keys = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/external-keys.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    ExternalKeys = class extends APIResource {
      /**
       * Create an external key config owned by the caller's organization.
       *
       * @example
       * ```ts
       * const betaExternalKey =
       *   await client.beta.organization.externalKeys.create({
       *     provider_config: {
       *       kms_arn:
       *         'arn:aws:kms:us-east-1:111122223333:key/abcd1234-5678-90ab-cdef-000011112222',
       *       type: 'aws',
       *     },
       *   });
       * ```
       */
      create(body, options) {
        return this._client.post("/v1/organizations/external_keys?beta=true", { body, ...options });
      }
      /**
       * Retrieve a single external key config in the caller's organization by ID.
       *
       * @example
       * ```ts
       * const betaExternalKey =
       *   await client.beta.organization.externalKeys.retrieve(
       *     'external_key_id',
       *   );
       * ```
       */
      retrieve(externalKeyID, options) {
        return this._client.get(path2`/v1/organizations/external_keys/${externalKeyID}?beta=true`, options);
      }
      /**
       * Partially update an external key config. Omitted fields are left unchanged.
       *
       * `display_name` is always editable. `geo` and `provider_config` cannot be changed
       * once any workspace references this config, because previously encrypted data
       * requires the original key identity to decrypt.
       *
       * @example
       * ```ts
       * const betaExternalKey =
       *   await client.beta.organization.externalKeys.update(
       *     'external_key_id',
       *   );
       * ```
       */
      update(externalKeyID, body, options) {
        return this._client.post(path2`/v1/organizations/external_keys/${externalKeyID}?beta=true`, {
          body,
          ...options
        });
      }
      /**
       * List external key configs in the caller's organization.
       *
       * Results are ordered by creation time (newest first). Use the `next_page` cursor
       * from the response to fetch subsequent pages.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaExternalKey of client.beta.organization.externalKeys.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/external_keys?beta=true", PageCursor, {
          query,
          ...options
        });
      }
      /**
       * Delete an external key config.
       *
       * The request is rejected if any workspace still references this config.
       *
       * @example
       * ```ts
       * const externalKey =
       *   await client.beta.organization.externalKeys.delete(
       *     'external_key_id',
       *   );
       * ```
       */
      delete(externalKeyID, options) {
        return this._client.delete(path2`/v1/organizations/external_keys/${externalKeyID}?beta=true`, options);
      }
      /**
       * Validate an external key config against the customer's KMS.
       *
       * Anthropic performs an encrypt/decrypt roundtrip against the configured KMS key
       * and waits up to 30 seconds for the result. The response status is `success` if
       * the roundtrip succeeded, or `failure` with an error message if it failed or
       * timed out.
       *
       * @example
       * ```ts
       * const response =
       *   await client.beta.organization.externalKeys.validate(
       *     'external_key_id',
       *   );
       * ```
       */
      validate(externalKeyID, options) {
        return this._client.post(path2`/v1/organizations/external_keys/${externalKeyID}/validate?beta=true`, options);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/invites.mjs
var Invites;
var init_invites = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/invites.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    Invites = class extends APIResource {
      /**
       * Invite a user to join the organization by email.
       *
       * On plans that draw members from a finite pool of purchased seats, the invite
       * automatically consumes a seat from the lowest tier with availability; there is
       * no seat-tier parameter. When no seat is free the request fails with a 400 error
       * rather than purchasing a seat.
       *
       * @example
       * ```ts
       * const betaOrganizationInvite =
       *   await client.beta.organization.invites.create({
       *     email: 'user@emaildomain.com',
       *     role: 'user',
       *   });
       * ```
       */
      create(body, options) {
        return this._client.post("/v1/organizations/invites?beta=true", { body, ...options });
      }
      /**
       * Retrieve an invite by ID.
       *
       * @example
       * ```ts
       * const betaOrganizationInvite =
       *   await client.beta.organization.invites.retrieve(
       *     'invite_id',
       *   );
       * ```
       */
      retrieve(inviteID, options) {
        return this._client.get(path2`/v1/organizations/invites/${inviteID}?beta=true`, options);
      }
      /**
       * List the organization's invites.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaOrganizationInvite of client.beta.organization.invites.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/invites?beta=true", Page, {
          query,
          ...options
        });
      }
      /**
       * Delete a pending invite.
       *
       * @example
       * ```ts
       * const invite =
       *   await client.beta.organization.invites.delete(
       *     'invite_id',
       *   );
       * ```
       */
      delete(inviteID, options) {
        return this._client.delete(path2`/v1/organizations/invites/${inviteID}?beta=true`, options);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/rate-limits.mjs
var RateLimits;
var init_rate_limits = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/rate-limits.mjs"() {
    init_resource();
    init_pagination();
    RateLimits = class extends APIResource {
      /**
       * List Messages API rate limits for your organization.
       *
       * Each entry corresponds to one rate-limit group (either a model family or an
       * API-surface category such as the Files API or Message Batches) and contains the
       * set of limiter values that apply to it.
       *
       * When `limit` is omitted, every matching entry is returned in a single page; when
       * `limit` truncates the result, follow `next_page` to fetch the remaining entries.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaOrganizationRateLimit of client.beta.organization.rateLimits.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/rate_limits?beta=true", PageCursor, { query, ...options });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/users.mjs
var Users;
var init_users = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/users.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    Users = class extends APIResource {
      /**
       * Retrieve a member of the organization by user ID.
       *
       * @example
       * ```ts
       * const betaOrganizationUser =
       *   await client.beta.organization.users.retrieve('user_id');
       * ```
       */
      retrieve(userID, options) {
        return this._client.get(path2`/v1/organizations/users/${userID}?beta=true`, options);
      }
      /**
       * Update a member's organization role.
       *
       * @example
       * ```ts
       * const betaOrganizationUser =
       *   await client.beta.organization.users.update('user_id', {
       *     role: 'user',
       *   });
       * ```
       */
      update(userID, body, options) {
        return this._client.post(path2`/v1/organizations/users/${userID}?beta=true`, { body, ...options });
      }
      /**
       * List the organization's members.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaOrganizationUser of client.beta.organization.users.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/users?beta=true", Page, {
          query,
          ...options
        });
      }
      /**
       * Remove a member from the organization.
       *
       * @example
       * ```ts
       * const user = await client.beta.organization.users.remove(
       *   'user_id',
       * );
       * ```
       */
      remove(userID, options) {
        return this._client.delete(path2`/v1/organizations/users/${userID}?beta=true`, options);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/issuers.mjs
var Issuers;
var init_issuers = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/issuers.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Issuers = class extends APIResource {
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Register an OIDC issuer that Anthropic will trust for workload identity
       * federation in your organization.
       *
       * The `jwks` field controls how the issuer's signing keys are obtained and takes
       * one of three shapes selected by `type`: `discovery` (resolve keys through OIDC
       * discovery), `explicit_url` (fetch keys from a fixed JWKS URL), or `inline`
       * (provide a static key set). When `jwks.type` is `discovery` and no
       * `discovery_base` is set, the issuer URL must be publicly reachable over HTTPS so
       * Anthropic can fetch the discovery document; for `explicit_url` and `inline`
       * modes the issuer URL is only matched as the JWT's `iss` claim and is not
       * fetched.
       *
       * @example
       * ```ts
       * const betaFederationIssuer =
       *   await client.beta.organization.federation.issuers.create({
       *     issuer_url: 'x',
       *     name: 'x',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/organizations/federation_issuers?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Retrieve a federation issuer by its ID (`fdis_...`).
       *
       * @example
       * ```ts
       * const betaFederationIssuer =
       *   await client.beta.organization.federation.issuers.retrieve(
       *     'federation_issuer_id',
       *   );
       * ```
       */
      retrieve(federationIssuerID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/organizations/federation_issuers/${federationIssuerID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Partially update a federation issuer.
       *
       * Setting `jwks` replaces the full JWKS shape at once. Archived issuers cannot be
       * updated; this returns 400. Create a new issuer instead.
       *
       * Updating an issuer that backs a rule with a scope outside `workspace:developer`
       * or `workspace:inference` requires a Console session.
       *
       * @example
       * ```ts
       * const betaFederationIssuer =
       *   await client.beta.organization.federation.issuers.update(
       *     'federation_issuer_id',
       *   );
       * ```
       */
      update(federationIssuerID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/federation_issuers/${federationIssuerID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List federation issuers in your organization.
       *
       * Archived issuers are excluded unless `include_archived=true`.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaFederationIssuer of client.beta.organization.federation.issuers.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/organizations/federation_issuers?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Archive a federation issuer.
       *
       * Idempotent; re-archiving returns the issuer with its original `archived_at`.
       * Rejected with 400 if any live (non-archived) federation rule still references
       * the issuer; archive those rules first (a rule's issuer cannot be changed), or
       * recreate them against another issuer.
       *
       * @example
       * ```ts
       * const betaFederationIssuer =
       *   await client.beta.organization.federation.issuers.archive(
       *     'federation_issuer_id',
       *   );
       * ```
       */
      archive(federationIssuerID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/organizations/federation_issuers/${federationIssuerID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/rules/workspaces.mjs
var Workspaces;
var init_workspaces = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/rules/workspaces.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Workspaces = class extends APIResource {
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List workspaces where this federation rule is enabled.
       *
       * Returns all workspace enablements in a single response; the `limit` and `page`
       * parameters are accepted but have no effect, and `next_page` is always `null`.
       * Returns explicit per-workspace enablements only; for rules with
       * `applies_to_all_workspaces` or a legacy single `workspace_id`, check those
       * fields on the rule itself.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaFederationRuleWorkspace of client.beta.organization.federation.rules.workspaces.list(
       *   'federation_rule_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(federationRuleID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/organizations/federation_rules/${federationRuleID}/workspaces?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Enable a federation rule for a workspace.
       *
       * Idempotent; re-enabling returns the existing enablement. The rule and workspace
       * must both belong to your organization. Membership of the rule's target service
       * account in this workspace is not checked at enablement: token exchange into this
       * workspace is rejected unless the target is a member (it is implicitly a member
       * of the default workspace). Archived rules are rejected with 400. OAuth callers
       * may only manage rules whose `oauth_scope` is `workspace:developer` or
       * `workspace:inference`; other scopes require a Console session.
       *
       * @example
       * ```ts
       * const betaFederationRuleWorkspace =
       *   await client.beta.organization.federation.rules.workspaces.add(
       *     'federation_rule_id',
       *     { workspace_id: 'workspace_id' },
       *   );
       * ```
       */
      add(federationRuleID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/federation_rules/${federationRuleID}/workspaces?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Disable a federation rule for a workspace.
       *
       * Idempotent; succeeds even if the enablement was already removed. OAuth callers
       * may only manage rules whose `oauth_scope` is `workspace:developer` or
       * `workspace:inference`; other scopes require a Console session.
       *
       * @example
       * ```ts
       * const workspace =
       *   await client.beta.organization.federation.rules.workspaces.remove(
       *     'workspace_id',
       *     { federation_rule_id: 'federation_rule_id' },
       *   );
       * ```
       */
      remove(workspaceID, params, options) {
        const { federation_rule_id, betas } = params;
        return this._client.delete(path2`/v1/organizations/federation_rules/${federation_rule_id}/workspaces/${workspaceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/rules/rules.mjs
var Rules;
var init_rules = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/rules/rules.mjs"() {
    init_resource();
    init_workspaces();
    init_workspaces();
    init_pagination();
    init_headers();
    init_path();
    Rules = class extends APIResource {
      constructor() {
        super(...arguments);
        this.workspaces = new Workspaces(this._client);
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Create a federation rule owned by your organization.
       *
       * The referenced issuer and the target service account must already exist in the
       * same organization; invalid references are rejected with a 400 error. The
       * workspace reference is validated. Membership is not checked at rule creation:
       * token exchange resolves a single enabled workspace per call and is rejected
       * unless the target service account is a member of that workspace (it is
       * implicitly a member of the default workspace). Rules on well-known shared
       * issuers (GitHub Actions, GitLab, Buildkite, Terraform Cloud, Google) must
       * constrain tenant identity via an identity-bearing claim, a tenant-pinning
       * subject prefix (such as `repo:YOUR_ORG/...`), or a CEL condition referencing one
       * of those identity claims (e.g. `claims.repository_owner`). OAuth callers may
       * only manage rules whose `oauth_scope` is `workspace:developer` or
       * `workspace:inference`; other scopes require a Console session.
       *
       * @example
       * ```ts
       * const betaFederationRule =
       *   await client.beta.organization.federation.rules.create({
       *     issuer_id: 'issuer_id',
       *     match: {},
       *     name: 'x',
       *     oauth_scope: 'x',
       *     target: {
       *       service_account_id: 'svac_01SDCCSbTxrXDpWc1phhtcfK',
       *       type: 'service_account',
       *     },
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/organizations/federation_rules?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Retrieve a federation rule by its ID (`fdrl_...`).
       *
       * @example
       * ```ts
       * const betaFederationRule =
       *   await client.beta.organization.federation.rules.retrieve(
       *     'federation_rule_id',
       *   );
       * ```
       */
      retrieve(federationRuleID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/organizations/federation_rules/${federationRuleID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Partially update a federation rule.
       *
       * `issuer_id` is immutable. `match` and `target` are replaced as whole objects
       * when set. Referenced service accounts and workspaces must exist in your
       * organization; invalid references are rejected with a 400 error. Archived rules
       * cannot be updated; this returns 400. Create a new rule instead. Rules on
       * well-known shared issuers (GitHub Actions, GitLab, Buildkite, Terraform Cloud,
       * Google) must constrain tenant identity via an identity-bearing claim, a
       * tenant-pinning subject prefix (such as `repo:YOUR_ORG/...`), or a CEL condition
       * referencing one of those identity claims (e.g. `claims.repository_owner`). On
       * these issuers the requirement is re-checked on every update; if an existing
       * rule's stored match does not yet constrain tenant identity, any update (even a
       * rename or description change) must also supply a conforming `match` in the same
       * request. OAuth callers may only manage rules whose `oauth_scope` is
       * `workspace:developer` or `workspace:inference`; other scopes require a Console
       * session.
       *
       * @example
       * ```ts
       * const betaFederationRule =
       *   await client.beta.organization.federation.rules.update(
       *     'federation_rule_id',
       *   );
       * ```
       */
      update(federationRuleID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/federation_rules/${federationRuleID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List federation rules in your organization.
       *
       * Optionally filter by issuer with `issuer_id`. Archived rules are excluded unless
       * `include_archived=true`.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaFederationRule of client.beta.organization.federation.rules.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/organizations/federation_rules?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Archive a federation rule.
       *
       * Token exchange through this rule stops immediately. Idempotent; re-archiving
       * returns the rule with its original `archived_at`. Archiving clears the rule's
       * workspace targeting (`workspace_id` and `workspace_ids` are emptied). Tokens
       * already minted before archive remain valid until they expire. OAuth callers may
       * only manage rules whose `oauth_scope` is `workspace:developer` or
       * `workspace:inference`; other scopes require a Console session.
       *
       * @example
       * ```ts
       * const betaFederationRule =
       *   await client.beta.organization.federation.rules.archive(
       *     'federation_rule_id',
       *   );
       * ```
       */
      archive(federationRuleID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/organizations/federation_rules/${federationRuleID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
    Rules.Workspaces = Workspaces;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/federation.mjs
var Federation;
var init_federation = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/federation/federation.mjs"() {
    init_resource();
    init_issuers();
    init_issuers();
    init_rules();
    init_rules();
    Federation = class extends APIResource {
      constructor() {
        super(...arguments);
        this.issuers = new Issuers(this._client);
        this.rules = new Rules(this._client);
      }
    };
    Federation.Issuers = Issuers;
    Federation.Rules = Rules;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/service-accounts/workspaces.mjs
var Workspaces2;
var init_workspaces2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/service-accounts/workspaces.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Workspaces2 = class extends APIResource {
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List the workspaces a service account is a member of.
       *
       * Each entry includes the service account's `workspace_role` in that workspace.
       * Use `limit` and the `next_page` cursor to paginate. When the service account has
       * no explicit default-workspace membership, the implicit (`implicit: true`)
       * membership is returned as the first entry on the first page; with `limit=1` the
       * first page may return up to 2 entries (the implicit entry plus one explicit
       * membership) so a pagination cursor can be derived. Memberships are returned only
       * while the service account is active. Without a `page` cursor, an archived
       * service account returns an empty list. A `page` cursor that does not match an
       * active membership returns a 400 invalid-request error. A cursor stops matching
       * when the membership is removed, the workspace is deleted, or the service account
       * is archived. Restart pagination from the first page to recover.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaServiceAccountWorkspaceMember of client.beta.organization.serviceAccounts.workspaces.list(
       *   'service_account_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(serviceAccountID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/organizations/service_accounts/${serviceAccountID}/workspaces?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Add a service account to a workspace with the given `workspace_role`.
       *
       * Mirror of `POST /workspaces/{workspace_id}/service_accounts`, addressed from the
       * service-account side; both create the same membership. If the service account is
       * already an explicit member of the workspace, its `workspace_role` is replaced
       * with the value supplied here. Archived workspaces return 400. Archived service
       * accounts cannot be added and are rejected.
       *
       * @example
       * ```ts
       * const betaServiceAccountWorkspaceMember =
       *   await client.beta.organization.serviceAccounts.workspaces.add(
       *     'service_account_id',
       *     {
       *       workspace_id: 'workspace_id',
       *       workspace_role: 'workspace_admin',
       *     },
       *   );
       * ```
       */
      add(serviceAccountID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/service_accounts/${serviceAccountID}/workspaces?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Remove a service account from a workspace.
       *
       * Mirror of
       * `DELETE /workspaces/{workspace_id}/service_accounts/{service_account_id}`,
       * addressed from the service-account side. Removal is idempotent (returns 200 even
       * if the membership was already removed). A DELETE against the implicit
       * default-workspace membership returns 200 but is a no-op and the membership
       * persists; deleting an explicit default-workspace row reverts to the implicit
       * `workspace_user` membership. Archived workspaces return 400.
       *
       * @example
       * ```ts
       * const workspace =
       *   await client.beta.organization.serviceAccounts.workspaces.remove(
       *     'workspace_id',
       *     { service_account_id: 'service_account_id' },
       *   );
       * ```
       */
      remove(workspaceID, params, options) {
        const { service_account_id, betas } = params;
        return this._client.delete(path2`/v1/organizations/service_accounts/${service_account_id}/workspaces/${workspaceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/service-accounts/service-accounts.mjs
var ServiceAccounts;
var init_service_accounts = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/service-accounts/service-accounts.mjs"() {
    init_resource();
    init_workspaces2();
    init_workspaces2();
    init_pagination();
    init_headers();
    init_path();
    ServiceAccounts = class extends APIResource {
      constructor() {
        super(...arguments);
        this.workspaces = new Workspaces2(this._client);
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Create a service account.
       *
       * A service account is a named workload identity that federation rules target.
       * `organization_role` is `developer` (default) or `admin`; a rule may only be
       * created or retargeted to grant `org:admin` scope when the target's
       * `organization_role` is `admin`. Creating an `admin`-role service account
       * requires an interactive credential (a user OAuth token or a Console session) — a
       * workload may only create `developer`-role service accounts.
       *
       * @example
       * ```ts
       * const betaServiceAccount =
       *   await client.beta.organization.serviceAccounts.create({
       *     name: 'ci-deploy-bot',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/organizations/service_accounts?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Retrieve a service account by its ID (`svac_...`).
       *
       * @example
       * ```ts
       * const betaServiceAccount =
       *   await client.beta.organization.serviceAccounts.retrieve(
       *     'service_account_id',
       *   );
       * ```
       */
      retrieve(serviceAccountID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/organizations/service_accounts/${serviceAccountID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Update a service account.
       *
       * Only `description` and `organization_role` are mutable; `name` cannot be
       * changed. Archived service accounts cannot be updated; this returns 400. Setting
       * `organization_role` to `admin` (even when unchanged) requires an interactive
       * credential (a user OAuth token or a Console session).
       *
       * @example
       * ```ts
       * const betaServiceAccount =
       *   await client.beta.organization.serviceAccounts.update(
       *     'service_account_id',
       *   );
       * ```
       */
      update(serviceAccountID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/service_accounts/${serviceAccountID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List service accounts in the caller's organization.
       *
       * Results are ordered by creation time, newest first. Use `limit` and the
       * `next_page` cursor to paginate; set `include_archived=true` to include archived
       * service accounts.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaServiceAccount of client.beta.organization.serviceAccounts.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/organizations/service_accounts?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Archive a service account.
       *
       * Idempotent; re-archiving returns the service account with its original
       * `archived_at`. Rejected with 400 if any live (non-archived) federation rule
       * still targets this service account, same as issuer archival; archive those rules
       * first or change their target to another service account.
       *
       * @example
       * ```ts
       * const betaServiceAccount =
       *   await client.beta.organization.serviceAccounts.archive(
       *     'service_account_id',
       *   );
       * ```
       */
      archive(serviceAccountID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/organizations/service_accounts/${serviceAccountID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
    ServiceAccounts.Workspaces = Workspaces2;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/members.mjs
var Members;
var init_members = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/members.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    Members = class extends APIResource {
      /**
       * Get Workspace Member
       *
       * @example
       * ```ts
       * const betaWorkspaceMember =
       *   await client.beta.organization.workspaces.members.retrieve(
       *     'user_id',
       *     { workspace_id: 'workspace_id' },
       *   );
       * ```
       */
      retrieve(userID, params, options) {
        const { workspace_id } = params;
        return this._client.get(path2`/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, options);
      }
      /**
       * Update Workspace Member
       *
       * @example
       * ```ts
       * const betaWorkspaceMember =
       *   await client.beta.organization.workspaces.members.update(
       *     'user_id',
       *     {
       *       workspace_id: 'workspace_id',
       *       workspace_role: 'workspace_admin',
       *     },
       *   );
       * ```
       */
      update(userID, params, options) {
        const { workspace_id, ...body } = params;
        return this._client.post(path2`/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, {
          body,
          ...options
        });
      }
      /**
       * List Workspace Members
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaWorkspaceMember of client.beta.organization.workspaces.members.list(
       *   'workspace_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(workspaceID, query = {}, options) {
        return this._client.getAPIList(path2`/v1/organizations/workspaces/${workspaceID}/members?beta=true`, Page, { query, ...options });
      }
      /**
       * Create Workspace Member
       *
       * @example
       * ```ts
       * const betaWorkspaceMember =
       *   await client.beta.organization.workspaces.members.add(
       *     'workspace_id',
       *     {
       *       user_id: 'user_01WCz1FkmYMm4gnmykNKUu3Q',
       *       workspace_role: 'workspace_admin',
       *     },
       *   );
       * ```
       */
      add(workspaceID, body, options) {
        return this._client.post(path2`/v1/organizations/workspaces/${workspaceID}/members?beta=true`, {
          body,
          ...options
        });
      }
      /**
       * Delete Workspace Member
       *
       * @example
       * ```ts
       * const member =
       *   await client.beta.organization.workspaces.members.remove(
       *     'user_id',
       *     { workspace_id: 'workspace_id' },
       *   );
       * ```
       */
      remove(userID, params, options) {
        const { workspace_id } = params;
        return this._client.delete(path2`/v1/organizations/workspaces/${workspace_id}/members/${userID}?beta=true`, options);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/rate-limits.mjs
var RateLimits2;
var init_rate_limits2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/rate-limits.mjs"() {
    init_resource();
    init_pagination();
    init_path();
    RateLimits2 = class extends APIResource {
      /**
       * List rate-limit overrides configured for a workspace.
       *
       * Returns only the groups and limiter types that have a workspace-level override.
       * Groups without overrides inherit the organization limits and are not listed; use
       * `GET /v1/organizations/rate_limits` to see those.
       *
       * When `limit` is omitted, every matching entry is returned in a single page; when
       * `limit` truncates the result, follow `next_page` to fetch the remaining entries.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaWorkspaceRateLimit of client.beta.organization.workspaces.rateLimits.list(
       *   'workspace_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(workspaceID, query = {}, options) {
        return this._client.getAPIList(path2`/v1/organizations/workspaces/${workspaceID}/rate_limits?beta=true`, PageCursor, { query, ...options });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/service-accounts.mjs
var ServiceAccounts2;
var init_service_accounts2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/service-accounts.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    ServiceAccounts2 = class extends APIResource {
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Retrieve a service account's membership in a workspace.
       *
       * Returns the membership record, including the service account's `workspace_role`
       * in this workspace. Archived workspaces return 400. For the default workspace,
       * returns the implicit (`implicit: true`) membership when no explicit membership
       * exists; an explicitly added membership is returned with its assigned role. An
       * archived service account returns 404.
       *
       * @example
       * ```ts
       * const betaServiceAccountWorkspaceMember =
       *   await client.beta.organization.workspaces.serviceAccounts.retrieve(
       *     'service_account_id',
       *     { workspace_id: 'workspace_id' },
       *   );
       * ```
       */
      retrieve(serviceAccountID, params, options) {
        const { workspace_id, betas } = params;
        return this._client.get(path2`/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Change a service account's role in a workspace.
       *
       * The new `workspace_role` replaces the current one. Only explicit memberships can
       * be updated; to set a role on the implicit default-workspace membership, add the
       * service account explicitly with
       * `POST /workspaces/{workspace_id}/service_accounts`. Archived workspaces
       * return 400. Archived service accounts cannot be updated and are rejected.
       *
       * @example
       * ```ts
       * const betaServiceAccountWorkspaceMember =
       *   await client.beta.organization.workspaces.serviceAccounts.update(
       *     'service_account_id',
       *     {
       *       workspace_id: 'workspace_id',
       *       workspace_role: 'workspace_admin',
       *     },
       *   );
       * ```
       */
      update(serviceAccountID, params, options) {
        const { workspace_id, betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * List the service accounts that are members of a workspace.
       *
       * Each entry includes the service account's `workspace_role`. Use `limit` and the
       * `next_page` cursor to paginate. Archived workspaces return 400; use
       * `GET /service_accounts/{id}/workspaces` to audit memberships of an archived
       * workspace. The implicit default-workspace membership is not included in this
       * list. Memberships of archived service accounts are omitted from the results.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaServiceAccountWorkspaceMember of client.beta.organization.workspaces.serviceAccounts.list(
       *   'workspace_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(workspaceID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/organizations/workspaces/${workspaceID}/service_accounts?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Add a service account to a workspace with the given `workspace_role`.
       *
       * The role determines what the service account can do in the workspace and which
       * workspace-scoped permissions it can be granted when authenticating through
       * federation. Every service account is already an implicit `workspace_user` member
       * of the default workspace; adding it explicitly assigns a chosen role. If the
       * service account is already an explicit member of the workspace, its
       * `workspace_role` is replaced with the value supplied here. Archived workspaces
       * return 400. Archived service accounts cannot be added and are rejected.
       *
       * @example
       * ```ts
       * const betaServiceAccountWorkspaceMember =
       *   await client.beta.organization.workspaces.serviceAccounts.add(
       *     'workspace_id',
       *     {
       *       service_account_id: 'service_account_id',
       *       workspace_role: 'workspace_admin',
       *     },
       *   );
       * ```
       */
      add(workspaceID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/organizations/workspaces/${workspaceID}/service_accounts?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * **Requires an OAuth access token with the `org:admin` scope**, from
       * `ant auth login --scope org:admin` or a workload identity federation rule; Admin
       * API keys are not accepted. See
       * [Manage WIF with the Admin API](/docs/en/manage-claude/wif-admin-api).
       *
       * Remove a service account from a workspace.
       *
       * Removal is idempotent (returns 200 even if the membership was already removed).
       * A DELETE against the implicit default-workspace membership returns 200 but is a
       * no-op and the membership persists; deleting an explicit default-workspace row
       * reverts to the implicit `workspace_user` membership. Archived workspaces
       * return 400.
       *
       * @example
       * ```ts
       * const serviceAccount =
       *   await client.beta.organization.workspaces.serviceAccounts.remove(
       *     'service_account_id',
       *     { workspace_id: 'workspace_id' },
       *   );
       * ```
       */
      remove(serviceAccountID, params, options) {
        const { workspace_id, betas } = params;
        return this._client.delete(path2`/v1/organizations/workspaces/${workspace_id}/service_accounts/${serviceAccountID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/workspaces.mjs
var Workspaces3;
var init_workspaces3 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/workspaces/workspaces.mjs"() {
    init_resource();
    init_members();
    init_members();
    init_rate_limits2();
    init_rate_limits2();
    init_service_accounts2();
    init_service_accounts2();
    init_pagination();
    init_headers();
    init_path();
    Workspaces3 = class extends APIResource {
      constructor() {
        super(...arguments);
        this.rateLimits = new RateLimits2(this._client);
        this.members = new Members(this._client);
        this.serviceAccounts = new ServiceAccounts2(this._client);
      }
      /**
       * Create Workspace
       *
       * @example
       * ```ts
       * const betaWorkspace =
       *   await client.beta.organization.workspaces.create({
       *     name: 'x',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/organizations/workspaces?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Get Workspace
       *
       * @example
       * ```ts
       * const betaWorkspace =
       *   await client.beta.organization.workspaces.retrieve(
       *     'workspace_id',
       *   );
       * ```
       */
      retrieve(workspaceID, options) {
        return this._client.get(path2`/v1/organizations/workspaces/${workspaceID}?beta=true`, options);
      }
      /**
       * Update Workspace
       *
       * @example
       * ```ts
       * const betaWorkspace =
       *   await client.beta.organization.workspaces.update(
       *     'workspace_id',
       *   );
       * ```
       */
      update(workspaceID, body, options) {
        return this._client.post(path2`/v1/organizations/workspaces/${workspaceID}?beta=true`, {
          body,
          ...options
        });
      }
      /**
       * List Workspaces
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaWorkspace of client.beta.organization.workspaces.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/organizations/workspaces?beta=true", Page, {
          query,
          ...options
        });
      }
      /**
       * Archive Workspace
       *
       * @example
       * ```ts
       * const betaWorkspace =
       *   await client.beta.organization.workspaces.archive(
       *     'workspace_id',
       *   );
       * ```
       */
      archive(workspaceID, options) {
        return this._client.post(path2`/v1/organizations/workspaces/${workspaceID}/archive?beta=true`, options);
      }
    };
    Workspaces3.RateLimits = RateLimits2;
    Workspaces3.Members = Members;
    Workspaces3.ServiceAccounts = ServiceAccounts2;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/organization.mjs
var Organization;
var init_organization = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/organization/organization.mjs"() {
    init_resource();
    init_api_keys();
    init_api_keys();
    init_compliance_settings();
    init_compliance_settings();
    init_external_keys();
    init_external_keys();
    init_invites();
    init_invites();
    init_rate_limits();
    init_rate_limits();
    init_users();
    init_users();
    init_federation();
    init_federation();
    init_service_accounts();
    init_service_accounts();
    init_workspaces3();
    init_workspaces3();
    Organization = class extends APIResource {
      constructor() {
        super(...arguments);
        this.apiKeys = new APIKeys(this._client);
        this.externalKeys = new ExternalKeys(this._client);
        this.federation = new Federation(this._client);
        this.invites = new Invites(this._client);
        this.serviceAccounts = new ServiceAccounts(this._client);
        this.users = new Users(this._client);
        this.workspaces = new Workspaces3(this._client);
        this.rateLimits = new RateLimits(this._client);
        this.complianceSettings = new ComplianceSettings(this._client);
      }
      /**
       * Retrieve information about the organization associated with the authenticated
       * API key.
       *
       * @example
       * ```ts
       * const betaOrganization =
       *   await client.beta.organization.retrieve();
       * ```
       */
      retrieve(options) {
        return this._client.get("/v1/organizations/me?beta=true", options);
      }
    };
    Organization.APIKeys = APIKeys;
    Organization.ExternalKeys = ExternalKeys;
    Organization.Federation = Federation;
    Organization.Invites = Invites;
    Organization.ServiceAccounts = ServiceAccounts;
    Organization.Users = Users;
    Organization.Workspaces = Workspaces3;
    Organization.RateLimits = RateLimits;
    Organization.ComplianceSettings = ComplianceSettings;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/events.mjs
var Events;
var init_events = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/events.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    init_SessionToolRunner();
    init_SessionToolRunner();
    Events = class extends APIResource {
      /**
       * List Events
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.events.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/sessions/${sessionID}/events?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Send Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsSendSessionEvents =
       *   await client.beta.sessions.events.send(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *     {
       *       events: [
       *         {
       *           content: [
       *             {
       *               text: 'Where is my order #1234?',
       *               type: 'text',
       *             },
       *           ],
       *           type: 'user.message',
       *         },
       *       ],
       *     },
       *   );
       * ```
       */
      send(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/sessions/${sessionID}/events?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Stream Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsStreamSessionEvents =
       *   await client.beta.sessions.events.stream(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      stream(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.get(path2`/v1/sessions/${sessionID}/events/stream?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ]),
          stream: true
        });
      }
      /**
       * Attach to a session and dispatch every incoming `agent.tool_use` and
       * `agent.custom_tool_use` event to a local tool registry, sending the matching
       * result back (`user.tool_result` / `user.custom_tool_result`). The
       * sessions-side counterpart to `client.beta.messages.toolRunner`: yields one
       * entry per completed tool call so callers can observe each dispatch (and
       * `break` to abort cleanly).
       *
       * @example
       * ```ts
       * import { betaAgentToolset20260401 } from '@anthropic-ai/sdk/tools/agent-toolset/node';
       *
       * for await (const call of client.beta.sessions.events.toolRunner(work.data.id, {
       *   tools: [...betaAgentToolset20260401({ workdir }), myTool],
       * })) {
       *   console.log(`${call.name} -> ${call.isError ? 'error' : 'ok'}`);
       * }
       * ```
       */
      toolRunner(sessionID, opts) {
        return new SessionToolRunner(sessionID, { ...opts, client: this._client });
      }
    };
    Events.SessionToolRunner = SessionToolRunner;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/resources.mjs
var Resources;
var init_resources = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/resources.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Resources = class extends APIResource {
      /**
       * Get Session Resource
       *
       * @example
       * ```ts
       * const resource =
       *   await client.beta.sessions.resources.retrieve(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      retrieve(resourceID, params, options) {
        const { session_id, betas } = params;
        return this._client.get(path2`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Session Resource
       *
       * @example
       * ```ts
       * const resource =
       *   await client.beta.sessions.resources.update(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     {
       *       session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *       authorization_token: 'ghp_exampletoken',
       *     },
       *   );
       * ```
       */
      update(resourceID, params, options) {
        const { session_id, betas, ...body } = params;
        return this._client.post(path2`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Session Resources
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionResource of client.beta.sessions.resources.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/sessions/${sessionID}/resources?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Session Resource
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeleteSessionResource =
       *   await client.beta.sessions.resources.delete(
       *     'sesrsc_011CZkZBJq5dWxk9fVLNcPht',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      delete(resourceID, params, options) {
        const { session_id, betas } = params;
        return this._client.delete(path2`/v1/sessions/${session_id}/resources/${resourceID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Add Session Resource
       *
       * @example
       * ```ts
       * const betaManagedAgentsFileResource =
       *   await client.beta.sessions.resources.add(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *     {
       *       file_id: 'file_011CNha8iCJcU1wXNR6q4V8w',
       *       type: 'file',
       *     },
       *   );
       * ```
       */
      add(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/sessions/${sessionID}/resources?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/events.mjs
var Events2;
var init_events2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/events.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Events2 = class extends APIResource {
      /**
       * List Session Thread Events
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionEvent of client.beta.sessions.threads.events.list(
       *   'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *   { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       * )) {
       *   // ...
       * }
       * ```
       */
      list(threadID, params, options) {
        const { session_id, betas, ...query } = params;
        return this._client.getAPIList(path2`/v1/sessions/${session_id}/threads/${threadID}/events?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Stream Session Thread Events
       *
       * @example
       * ```ts
       * const betaManagedAgentsStreamSessionThreadEvents =
       *   await client.beta.sessions.threads.events.stream(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      stream(threadID, params, options) {
        const { session_id, betas, ...query } = params;
        return this._client.get(path2`/v1/sessions/${session_id}/threads/${threadID}/stream?beta=true`, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ]),
          stream: true
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/threads.mjs
var Threads;
var init_threads = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/threads/threads.mjs"() {
    init_resource();
    init_events2();
    init_events2();
    init_pagination();
    init_headers();
    init_path();
    Threads = class extends APIResource {
      constructor() {
        super(...arguments);
        this.events = new Events2(this._client);
      }
      /**
       * Get Session Thread
       *
       * @example
       * ```ts
       * const betaManagedAgentsSessionThread =
       *   await client.beta.sessions.threads.retrieve(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      retrieve(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.get(path2`/v1/sessions/${session_id}/threads/${threadID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Session Threads
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSessionThread of client.beta.sessions.threads.list(
       *   'sesn_011CZkZAtmR3yMPDzynEDxu7',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(sessionID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/sessions/${sessionID}/threads?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Session Thread
       *
       * @example
       * ```ts
       * const betaManagedAgentsSessionThread =
       *   await client.beta.sessions.threads.archive(
       *     'sthr_011CZkZVWa6oIjw0rgXZpnBt',
       *     { session_id: 'sesn_011CZkZAtmR3yMPDzynEDxu7' },
       *   );
       * ```
       */
      archive(threadID, params, options) {
        const { session_id, betas } = params;
        return this._client.post(path2`/v1/sessions/${session_id}/threads/${threadID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Threads.Events = Events2;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.mjs
var Sessions;
var init_sessions = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/sessions/sessions.mjs"() {
    init_resource();
    init_events();
    init_events();
    init_resources();
    init_resources();
    init_threads();
    init_threads();
    init_pagination();
    init_headers();
    init_path();
    Sessions = class extends APIResource {
      constructor() {
        super(...arguments);
        this.events = new Events(this._client);
        this.resources = new Resources(this._client);
        this.threads = new Threads(this._client);
      }
      /**
       * Create Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.create({
       *     agent: 'agent_011CZkYpogX7uDKUyvBTophP',
       *     environment_id: 'env_011CZkZ9X2dpNyB7HsEFoRfW',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/sessions?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.retrieve(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      retrieve(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/sessions/${sessionID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.update(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      update(sessionID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/sessions/${sessionID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Sessions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsSession of client.beta.sessions.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/sessions?beta=true", BidirectionalPageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedSession =
       *   await client.beta.sessions.delete(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      delete(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/sessions/${sessionID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Session
       *
       * @example
       * ```ts
       * const betaManagedAgentsSession =
       *   await client.beta.sessions.archive(
       *     'sesn_011CZkZAtmR3yMPDzynEDxu7',
       *   );
       * ```
       */
      archive(sessionID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/sessions/${sessionID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Sessions.Events = Events;
    Sessions.Resources = Resources;
    Sessions.Threads = Threads;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.mjs
var Versions2;
var init_versions2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/skills/versions.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_uploads();
    init_path();
    Versions2 = class extends APIResource {
      /**
       * Create Skill Version
       *
       * @example
       * ```ts
       * const betaSkillVersion =
       *   await client.beta.skills.versions.create('skill_id', {
       *     files: [fs.createReadStream('path/to/file')],
       *   });
       * ```
       */
      create(skillID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/skills/${skillID}/versions?beta=true`, multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        }, this._client, false));
      }
      /**
       * Get Skill Version
       *
       * @example
       * ```ts
       * const betaSkillVersion =
       *   await client.beta.skills.versions.retrieve('version', {
       *     skill_id: 'skill_id',
       *   });
       * ```
       */
      retrieve(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.get(path2`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List Skill Versions
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaSkillVersion of client.beta.skills.versions.list(
       *   'skill_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(skillID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/skills/${skillID}/versions?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill Version
       *
       * @example
       * ```ts
       * const betaDeletedSkillVersion =
       *   await client.beta.skills.versions.delete('version', {
       *     skill_id: 'skill_id',
       *   });
       * ```
       */
      delete(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.delete(path2`/v1/skills/${skill_id}/versions/${version}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Download a skill version's content as a zip archive.
       *
       * @example
       * ```ts
       * const response = await client.beta.skills.versions.download(
       *   'version',
       *   { skill_id: 'skill_id' },
       * );
       *
       * const content = await response.blob();
       * console.log(content);
       * ```
       */
      download(version, params, options) {
        const { skill_id, betas } = params;
        return this._client.get(path2`/v1/skills/${skill_id}/versions/${version}/content?beta=true`, {
          ...options,
          headers: buildHeaders([
            {
              Accept: "application/binary",
              ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0
            },
            options?.headers
          ]),
          __binaryResponse: true
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.mjs
var Skills;
var init_skills2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/skills/skills.mjs"() {
    init_resource();
    init_versions2();
    init_versions2();
    init_pagination();
    init_headers();
    init_uploads();
    init_path();
    Skills = class extends APIResource {
      constructor() {
        super(...arguments);
        this.versions = new Versions2(this._client);
      }
      /**
       * Create Skill
       *
       * @example
       * ```ts
       * const betaSkill = await client.beta.skills.create({
       *   files: [fs.createReadStream('path/to/file')],
       * });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/skills?beta=true", multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        }, this._client, false));
      }
      /**
       * Get Skill
       *
       * @example
       * ```ts
       * const betaSkill = await client.beta.skills.retrieve(
       *   'skill_id',
       * );
       * ```
       */
      retrieve(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List Skills
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaSkill of client.beta.skills.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/skills?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * Delete Skill
       *
       * @example
       * ```ts
       * const betaDeletedSkill = await client.beta.skills.delete(
       *   'skill_id',
       * );
       * ```
       */
      delete(skillID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/skills/${skillID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
    Skills.Versions = Versions2;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/tunnels/certificates.mjs
var Certificates;
var init_certificates = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/tunnels/certificates.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Certificates = class extends APIResource {
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Registers a public CA certificate on a tunnel. Anthropic verifies the gateway's
       * server certificate against this CA when it terminates the inner TLS session. A
       * tunnel holds at most two non-archived certificates.
       *
       * @example
       * ```ts
       * const betaTunnelCertificate =
       *   await client.beta.tunnels.certificates.create(
       *     'tunnel_id',
       *     { ca_certificate_pem: 'ca_certificate_pem' },
       *   );
       * ```
       */
      create(tunnelID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/tunnels/${tunnelID}/certificates?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Fetches a tunnel certificate by ID.
       *
       * @example
       * ```ts
       * const betaTunnelCertificate =
       *   await client.beta.tunnels.certificates.retrieve(
       *     'certificate_id',
       *     { tunnel_id: 'tunnel_id' },
       *   );
       * ```
       */
      retrieve(certificateID, params, options) {
        const { tunnel_id, betas } = params;
        return this._client.get(path2`/v1/tunnels/${tunnel_id}/certificates/${certificateID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Lists the certificates registered on a tunnel. Archived certificates are
       * excluded unless include_archived is set.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaTunnelCertificate of client.beta.tunnels.certificates.list(
       *   'tunnel_id',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(tunnelID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/tunnels/${tunnelID}/certificates?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Archives a tunnel certificate, removing it from the set Anthropic trusts for the
       * tunnel. The certificate record is retained. Archiving the last non-archived
       * certificate is permitted; the tunnel rejects MCP traffic until a new certificate
       * is added.
       *
       * @example
       * ```ts
       * const betaTunnelCertificate =
       *   await client.beta.tunnels.certificates.archive(
       *     'certificate_id',
       *     { tunnel_id: 'tunnel_id' },
       *   );
       * ```
       */
      archive(certificateID, params, options) {
        const { tunnel_id, betas } = params;
        return this._client.post(path2`/v1/tunnels/${tunnel_id}/certificates/${certificateID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/tunnels/tunnels.mjs
var Tunnels;
var init_tunnels = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/tunnels/tunnels.mjs"() {
    init_resource();
    init_certificates();
    init_certificates();
    init_pagination();
    init_headers();
    init_path();
    Tunnels = class extends APIResource {
      constructor() {
        super(...arguments);
        this.certificates = new Certificates(this._client);
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Creates a tunnel. Creation allocates a fresh hostname and provisions the tunnel;
       * it is not idempotent. The new tunnel rejects MCP traffic until at least one CA
       * certificate is added.
       *
       * @example
       * ```ts
       * const betaTunnel = await client.beta.tunnels.create();
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/tunnels?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Fetches a tunnel by ID.
       *
       * @example
       * ```ts
       * const betaTunnel = await client.beta.tunnels.retrieve(
       *   'tunnel_id',
       * );
       * ```
       */
      retrieve(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/tunnels/${tunnelID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Lists tunnels. Results are ordered by creation time, newest first; archived
       * tunnels are excluded unless include_archived is set.
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaTunnel of client.beta.tunnels.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/tunnels?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Archives a tunnel. Archival is irreversible: every non-archived certificate on
       * the tunnel is archived in the same operation, the hostname is retired and never
       * re-allocated, and the tunnel token is invalidated. Retrying against an
       * already-archived tunnel returns the existing record unchanged.
       *
       * @example
       * ```ts
       * const betaTunnel = await client.beta.tunnels.archive(
       *   'tunnel_id',
       * );
       * ```
       */
      archive(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/tunnels/${tunnelID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Reveals a tunnel's connector token. The value is fetched live on each call;
       * Anthropic does not store it. Repeated calls return the same value until the
       * token is rotated. Exposed as POST so the token does not appear in intermediary
       * access logs.
       *
       * @example
       * ```ts
       * const betaTunnelToken =
       *   await client.beta.tunnels.revealToken('tunnel_id');
       * ```
       */
      revealToken(tunnelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/tunnels/${tunnelID}/reveal_token?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * The Tunnels API is in research preview. It requires the
       * `anthropic-beta: mcp-tunnels-2026-06-22` header and may change without a
       * deprecation period. It supersedes the Admin API endpoints at
       * `/v1/organizations/tunnels`, which remain available during a migration window.
       *
       * Rotates a tunnel's connector token. Rotation invalidates the current token for
       * new connections and returns a fresh value; established connections are not
       * severed. A connector restarted after rotation must use the new value.
       *
       * @example
       * ```ts
       * const betaTunnelToken =
       *   await client.beta.tunnels.rotateToken('tunnel_id');
       * ```
       */
      rotateToken(tunnelID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/tunnels/${tunnelID}/rotate_token?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "mcp-tunnels-2026-06-22"].toString() },
            options?.headers
          ])
        });
      }
    };
    Tunnels.Certificates = Certificates;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/vaults/credentials.mjs
var Credentials;
var init_credentials2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/vaults/credentials.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Credentials = class extends APIResource {
      /**
       * Create Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.create(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *     {
       *       auth: {
       *         token: 'bearer_exampletoken',
       *         mcp_server_url:
       *           'https://example-server.modelcontextprotocol.io/sse',
       *         type: 'static_bearer',
       *       },
       *     },
       *   );
       * ```
       */
      create(vaultID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/vaults/${vaultID}/credentials?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.retrieve(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      retrieve(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.get(path2`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.update(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      update(credentialID, params, options) {
        const { vault_id, betas, ...body } = params;
        return this._client.post(path2`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Credentials
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsCredential of client.beta.vaults.credentials.list(
       *   'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       * )) {
       *   // ...
       * }
       * ```
       */
      list(vaultID, params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList(path2`/v1/vaults/${vaultID}/credentials?beta=true`, PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedCredential =
       *   await client.beta.vaults.credentials.delete(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      delete(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.delete(path2`/v1/vaults/${vault_id}/credentials/${credentialID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredential =
       *   await client.beta.vaults.credentials.archive(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      archive(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post(path2`/v1/vaults/${vault_id}/credentials/${credentialID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Validate Credential
       *
       * @example
       * ```ts
       * const betaManagedAgentsCredentialValidation =
       *   await client.beta.vaults.credentials.mcpOAuthValidate(
       *     'vcrd_011CZkZEMt8gZan2iYOQfSkw',
       *     { vault_id: 'vlt_011CZkZDLs7fYzm1hXNPeRjv' },
       *   );
       * ```
       */
      mcpOAuthValidate(credentialID, params, options) {
        const { vault_id, betas } = params;
        return this._client.post(path2`/v1/vaults/${vault_id}/credentials/${credentialID}/mcp_oauth_validate?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/vaults/vaults.mjs
var Vaults;
var init_vaults = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/vaults/vaults.mjs"() {
    init_resource();
    init_credentials2();
    init_credentials2();
    init_pagination();
    init_headers();
    init_path();
    Vaults = class extends APIResource {
      constructor() {
        super(...arguments);
        this.credentials = new Credentials(this._client);
      }
      /**
       * Create Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.create({
       *     display_name: 'Example vault',
       *   });
       * ```
       */
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/vaults?beta=true", {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Get Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.retrieve(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      retrieve(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/vaults/${vaultID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Update Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.update(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      update(vaultID, params, options) {
        const { betas, ...body } = params;
        return this._client.post(path2`/v1/vaults/${vaultID}?beta=true`, {
          body,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * List Vaults
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const betaManagedAgentsVault of client.beta.vaults.list()) {
       *   // ...
       * }
       * ```
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/vaults?beta=true", PageCursor, {
          query,
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Delete Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsDeletedVault =
       *   await client.beta.vaults.delete(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      delete(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.delete(path2`/v1/vaults/${vaultID}?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
      /**
       * Archive Vault
       *
       * @example
       * ```ts
       * const betaManagedAgentsVault =
       *   await client.beta.vaults.archive(
       *     'vlt_011CZkZDLs7fYzm1hXNPeRjv',
       *   );
       * ```
       */
      archive(vaultID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.post(path2`/v1/vaults/${vaultID}/archive?beta=true`, {
          ...options,
          headers: buildHeaders([
            { "anthropic-beta": [...betas ?? [], "managed-agents-2026-04-01"].toString() },
            options?.headers
          ])
        });
      }
    };
    Vaults.Credentials = Credentials;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/beta.mjs
var Beta;
var init_beta = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/beta/beta.mjs"() {
    init_resource();
    init_deployment_runs();
    init_deployment_runs();
    init_deployments();
    init_deployments();
    init_dreams();
    init_dreams();
    init_files();
    init_files();
    init_models();
    init_models();
    init_user_profiles();
    init_user_profiles();
    init_webhooks();
    init_webhooks();
    init_agents();
    init_agents();
    init_environments();
    init_environments();
    init_memory_stores();
    init_memory_stores();
    init_messages();
    init_messages();
    init_organization();
    init_organization();
    init_sessions();
    init_sessions();
    init_skills2();
    init_skills2();
    init_tunnels();
    init_tunnels();
    init_vaults();
    init_vaults();
    Beta = class extends APIResource {
      constructor() {
        super(...arguments);
        this.models = new Models(this._client);
        this.messages = new Messages(this._client);
        this.agents = new Agents(this._client);
        this.environments = new Environments(this._client);
        this.sessions = new Sessions(this._client);
        this.deployments = new Deployments(this._client);
        this.deploymentRuns = new DeploymentRuns(this._client);
        this.vaults = new Vaults(this._client);
        this.memoryStores = new MemoryStores(this._client);
        this.files = new Files(this._client);
        this.skills = new Skills(this._client);
        this.webhooks = new Webhooks(this._client);
        this.userProfiles = new UserProfiles(this._client);
        this.dreams = new Dreams(this._client);
        this.tunnels = new Tunnels(this._client);
        this.organization = new Organization(this._client);
      }
    };
    Beta.Models = Models;
    Beta.Messages = Messages;
    Beta.Agents = Agents;
    Beta.Environments = Environments;
    Beta.Sessions = Sessions;
    Beta.Deployments = Deployments;
    Beta.DeploymentRuns = DeploymentRuns;
    Beta.Vaults = Vaults;
    Beta.MemoryStores = MemoryStores;
    Beta.Files = Files;
    Beta.Skills = Skills;
    Beta.Webhooks = Webhooks;
    Beta.UserProfiles = UserProfiles;
    Beta.Dreams = Dreams;
    Beta.Tunnels = Tunnels;
    Beta.Organization = Organization;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/completions.mjs
var Completions;
var init_completions = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/completions.mjs"() {
    init_resource();
    init_headers();
    Completions = class extends APIResource {
      create(params, options) {
        const { betas, ...body } = params;
        return this._client.post("/v1/complete", {
          body,
          timeout: this._client._options.timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ]),
          stream: params.stream ?? false
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/files.mjs
var Files2;
var init_files2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/files.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_stainless_helper_header();
    init_uploads();
    init_path();
    Files2 = class extends APIResource {
      /**
       * List Files
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/files", PageCursor, { query, ...options });
      }
      /**
       * Delete File
       */
      delete(fileID, options) {
        return this._client.delete(path2`/v1/files/${fileID}`, options);
      }
      /**
       * Download File
       */
      download(fileID, options) {
        return this._client.get(path2`/v1/files/${fileID}/content`, {
          ...options,
          headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
          __binaryResponse: true
        });
      }
      /**
       * Get File Metadata
       */
      retrieveMetadata(fileID, options) {
        return this._client.get(path2`/v1/files/${fileID}`, options);
      }
      /**
       * Upload File
       */
      upload(body, options) {
        return this._client.post("/v1/files", multipartFormRequestOptions({
          body,
          ...options,
          headers: buildHeaders([stainlessHelperHeaderFromFile(body.file), options?.headers])
        }, this._client));
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/parser.mjs
function getOutputFormat2(params) {
  return params?.output_config?.format;
}
function maybeParseMessage(message, params, opts) {
  const outputFormat = getOutputFormat2(params);
  if (!params || !("parse" in (outputFormat ?? {}))) {
    return {
      ...message,
      content: message.content.map((block) => {
        if (block.type === "text") {
          const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
            value: null,
            enumerable: false
          });
          return parsedBlock;
        }
        return block;
      }),
      parsed_output: null
    };
  }
  return parseMessage(message, params, opts);
}
function parseMessage(message, params, opts) {
  let firstParsedOutput = null;
  const content = message.content.map((block) => {
    if (block.type === "text") {
      const parsedOutput = parseOutputFormat(params, block.text);
      if (firstParsedOutput === null) {
        firstParsedOutput = parsedOutput;
      }
      const parsedBlock = Object.defineProperty({ ...block }, "parsed_output", {
        value: parsedOutput,
        enumerable: false
      });
      return parsedBlock;
    }
    return block;
  });
  return {
    ...message,
    content,
    parsed_output: firstParsedOutput
  };
}
function parseOutputFormat(params, content) {
  const outputFormat = getOutputFormat2(params);
  if (outputFormat?.type !== "json_schema") {
    return null;
  }
  try {
    if ("parse" in outputFormat) {
      return outputFormat.parse(content);
    }
    return JSON.parse(content);
  } catch (error) {
    throw new AnthropicError(`Failed to parse structured output: ${error}`);
  }
}
var init_parser2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/parser.mjs"() {
    init_error();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/MessageStream.mjs
function tracksToolInput2(content) {
  return content.type === "tool_use" || content.type === "server_tool_use";
}
var _MessageStream_instances, _MessageStream_currentMessageSnapshot, _MessageStream_params, _MessageStream_connectedPromise, _MessageStream_resolveConnectedPromise, _MessageStream_rejectConnectedPromise, _MessageStream_endPromise, _MessageStream_resolveEndPromise, _MessageStream_rejectEndPromise, _MessageStream_listeners, _MessageStream_ended, _MessageStream_errored, _MessageStream_aborted, _MessageStream_catchingPromiseCreated, _MessageStream_response, _MessageStream_request_id, _MessageStream_workspace_id, _MessageStream_logger, _MessageStream_getFinalMessage, _MessageStream_getFinalText, _MessageStream_handleError, _MessageStream_beginRequest, _MessageStream_addStreamEvent, _MessageStream_endRequest, _MessageStream_accumulateMessage, MessageStream;
var init_MessageStream = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/MessageStream.mjs"() {
    init_tslib();
    init_stainless_helper_header();
    init_errors();
    init_values();
    init_error2();
    init_streaming2();
    init_parser2();
    init_message_stream_utils();
    MessageStream = class _MessageStream {
      constructor(params, opts) {
        _MessageStream_instances.add(this);
        this.messages = [];
        this.receivedMessages = [];
        _MessageStream_currentMessageSnapshot.set(this, void 0);
        _MessageStream_params.set(this, null);
        this.controller = new AbortController();
        _MessageStream_connectedPromise.set(this, void 0);
        _MessageStream_resolveConnectedPromise.set(this, () => {
        });
        _MessageStream_rejectConnectedPromise.set(this, () => {
        });
        _MessageStream_endPromise.set(this, void 0);
        _MessageStream_resolveEndPromise.set(this, () => {
        });
        _MessageStream_rejectEndPromise.set(this, () => {
        });
        _MessageStream_listeners.set(this, {});
        _MessageStream_ended.set(this, false);
        _MessageStream_errored.set(this, false);
        _MessageStream_aborted.set(this, false);
        _MessageStream_catchingPromiseCreated.set(this, false);
        _MessageStream_response.set(this, void 0);
        _MessageStream_request_id.set(this, void 0);
        _MessageStream_workspace_id.set(this, void 0);
        _MessageStream_logger.set(this, void 0);
        _MessageStream_handleError.set(this, (error) => {
          __classPrivateFieldSet(this, _MessageStream_errored, true, "f");
          if (isAbortError(error)) {
            error = new APIUserAbortError();
          }
          if (error instanceof APIUserAbortError) {
            __classPrivateFieldSet(this, _MessageStream_aborted, true, "f");
            return this._emit("abort", error);
          }
          if (error instanceof AnthropicError) {
            return this._emit("error", error);
          }
          if (error instanceof Error) {
            const anthropicError = new AnthropicError(error.message);
            anthropicError.cause = error;
            return this._emit("error", anthropicError);
          }
          return this._emit("error", new AnthropicError(String(error)));
        });
        __classPrivateFieldSet(this, _MessageStream_connectedPromise, new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _MessageStream_resolveConnectedPromise, resolve2, "f");
          __classPrivateFieldSet(this, _MessageStream_rejectConnectedPromise, reject, "f");
        }), "f");
        __classPrivateFieldSet(this, _MessageStream_endPromise, new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _MessageStream_resolveEndPromise, resolve2, "f");
          __classPrivateFieldSet(this, _MessageStream_rejectEndPromise, reject, "f");
        }), "f");
        __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f").catch(() => {
        });
        __classPrivateFieldGet(this, _MessageStream_endPromise, "f").catch(() => {
        });
        __classPrivateFieldSet(this, _MessageStream_params, params, "f");
        __classPrivateFieldSet(this, _MessageStream_logger, opts?.logger ?? console, "f");
      }
      get response() {
        return __classPrivateFieldGet(this, _MessageStream_response, "f");
      }
      get request_id() {
        return __classPrivateFieldGet(this, _MessageStream_request_id, "f");
      }
      get workspace_id() {
        return __classPrivateFieldGet(this, _MessageStream_workspace_id, "f");
      }
      /**
       * Returns the `MessageStream` data, the raw `Response` instance and the ID of the request,
       * returned vie the `request-id` header which is useful for debugging requests and resporting
       * issues to Anthropic.
       *
       * This is the same as the `APIPromise.withResponse()` method.
       *
       * This method will raise an error if you created the stream using `MessageStream.fromReadableStream`
       * as no `Response` is available.
       */
      async withResponse() {
        __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        const response = await __classPrivateFieldGet(this, _MessageStream_connectedPromise, "f");
        if (!response) {
          throw new Error("Could not resolve a `Response` object");
        }
        return {
          data: this,
          response,
          request_id: response.headers.get("request-id"),
          workspace_id: response.headers.get("anthropic-workspace-id")
        };
      }
      /**
       * Intended for use on the frontend, consuming a stream produced with
       * `.toReadableStream()` on the backend.
       *
       * Note that messages sent to the model do not appear in `.on('message')`
       * in this context.
       */
      static fromReadableStream(stream2) {
        const runner = new _MessageStream(null);
        runner._run(() => runner._fromReadableStream(stream2));
        return runner;
      }
      static createMessage(messages, params, options, { logger } = {}) {
        const runner = new _MessageStream(params, { logger });
        for (const message of params.messages) {
          runner._addMessageParam(message);
        }
        __classPrivateFieldSet(runner, _MessageStream_params, { ...params, stream: true }, "f");
        runner._run(() => runner._createMessage(messages, { ...params, stream: true }, { ...options, headers: { ...options?.headers, [STAINLESS_HELPER_METHOD_HEADER]: "stream" } }));
        return runner;
      }
      _run(executor) {
        executor().then(() => {
          this._emitFinal();
          this._emit("end");
        }, __classPrivateFieldGet(this, _MessageStream_handleError, "f"));
      }
      _addMessageParam(message) {
        this.messages.push(message);
      }
      _addMessage(message, emit2 = true) {
        this.receivedMessages.push(message);
        if (emit2) {
          this._emit("message", message);
        }
      }
      async _createMessage(messages, params, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          const { response, data: stream2 } = await messages.create({ ...params, stream: true }, { ...options, signal: this.controller.signal }).withResponse();
          this._connected(response);
          for await (const event of stream2) {
            __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream2.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      _connected(response) {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _MessageStream_response, response, "f");
        __classPrivateFieldSet(this, _MessageStream_request_id, response?.headers.get("request-id"), "f");
        __classPrivateFieldSet(this, _MessageStream_workspace_id, response?.headers.get("anthropic-workspace-id"), "f");
        __classPrivateFieldGet(this, _MessageStream_resolveConnectedPromise, "f").call(this, response);
        this._emit("connect");
      }
      get ended() {
        return __classPrivateFieldGet(this, _MessageStream_ended, "f");
      }
      get errored() {
        return __classPrivateFieldGet(this, _MessageStream_errored, "f");
      }
      get aborted() {
        return __classPrivateFieldGet(this, _MessageStream_aborted, "f");
      }
      abort() {
        this.controller.abort();
      }
      /**
       * Adds the listener function to the end of the listeners array for the event.
       * No checks are made to see if the listener has already been added. Multiple calls passing
       * the same combination of event and listener will result in the listener being added, and
       * called, multiple times.
       * @returns this MessageStream, so that calls can be chained
       */
      on(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener });
        return this;
      }
      /**
       * Removes the specified listener from the listener array for the event.
       * off() will remove, at most, one instance of a listener from the listener array. If any single
       * listener has been added multiple times to the listener array for the specified event, then
       * off() must be called multiple times to remove each instance.
       * @returns this MessageStream, so that calls can be chained
       */
      off(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (!listeners)
          return this;
        const index = listeners.findIndex((l) => l.listener === listener);
        if (index >= 0)
          listeners.splice(index, 1);
        return this;
      }
      /**
       * Adds a one-time listener function for the event. The next time the event is triggered,
       * this listener is removed and then invoked.
       * @returns this MessageStream, so that calls can be chained
       */
      once(event, listener) {
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] || (__classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = []);
        listeners.push({ listener, once: true });
        return this;
      }
      /**
       * This is similar to `.once()`, but returns a Promise that resolves the next time
       * the event is triggered, instead of calling a listener callback.
       * @returns a Promise that resolves the next time given event is triggered,
       * or rejects if an error is emitted.  (If you request the 'error' event,
       * returns a promise that resolves with the error).
       *
       * Example:
       *
       *   const message = await stream.emitted('message') // rejects if the stream errors
       */
      emitted(event) {
        return new Promise((resolve2, reject) => {
          __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
          if (event !== "error")
            this.once("error", reject);
          this.once(event, resolve2);
        });
      }
      async done() {
        __classPrivateFieldSet(this, _MessageStream_catchingPromiseCreated, true, "f");
        await __classPrivateFieldGet(this, _MessageStream_endPromise, "f");
      }
      get currentMessage() {
        return __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
      }
      /**
       * @returns a promise that resolves with the the final assistant Message response,
       * or rejects if an error occurred or the stream ended prematurely without producing a Message.
       * If structured outputs were used, this will be a ParsedMessage with a `parsed_output` field.
       */
      async finalMessage() {
        await this.done();
        return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this);
      }
      /**
       * @returns a promise that resolves with the the final assistant Message's text response, concatenated
       * together if there are more than one text blocks.
       * Rejects if an error occurred or the stream ended prematurely without producing a Message.
       */
      async finalText() {
        await this.done();
        return __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalText).call(this);
      }
      _emit(event, ...args) {
        if (__classPrivateFieldGet(this, _MessageStream_ended, "f"))
          return;
        if (event === "end") {
          __classPrivateFieldSet(this, _MessageStream_ended, true, "f");
          __classPrivateFieldGet(this, _MessageStream_resolveEndPromise, "f").call(this);
        }
        const listeners = __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event];
        if (listeners) {
          __classPrivateFieldGet(this, _MessageStream_listeners, "f")[event] = listeners.filter((l) => !l.once);
          listeners.forEach(({ listener }) => listener(...args));
        }
        if (event === "abort") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
          return;
        }
        if (event === "error") {
          const error = args[0];
          if (!__classPrivateFieldGet(this, _MessageStream_catchingPromiseCreated, "f") && !listeners?.length) {
            Promise.reject(error);
          }
          __classPrivateFieldGet(this, _MessageStream_rejectConnectedPromise, "f").call(this, error);
          __classPrivateFieldGet(this, _MessageStream_rejectEndPromise, "f").call(this, error);
          this._emit("end");
        }
      }
      _emitFinal() {
        const finalMessage = this.receivedMessages.at(-1);
        if (finalMessage) {
          this._emit("finalMessage", __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_getFinalMessage).call(this));
        }
      }
      async _fromReadableStream(readableStream, options) {
        const signal = options?.signal;
        let abortHandler;
        if (signal) {
          if (signal.aborted)
            this.controller.abort();
          abortHandler = this.controller.abort.bind(this.controller);
          signal.addEventListener("abort", abortHandler);
        }
        try {
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_beginRequest).call(this);
          this._connected(null);
          const stream2 = Stream.fromReadableStream(readableStream, this.controller);
          for await (const event of stream2) {
            __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_addStreamEvent).call(this, event);
          }
          if (stream2.controller.signal?.aborted) {
            throw new APIUserAbortError();
          }
          __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_endRequest).call(this);
        } finally {
          if (signal && abortHandler) {
            signal.removeEventListener("abort", abortHandler);
          }
        }
      }
      [(_MessageStream_currentMessageSnapshot = /* @__PURE__ */ new WeakMap(), _MessageStream_params = /* @__PURE__ */ new WeakMap(), _MessageStream_connectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectConnectedPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_endPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_resolveEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_rejectEndPromise = /* @__PURE__ */ new WeakMap(), _MessageStream_listeners = /* @__PURE__ */ new WeakMap(), _MessageStream_ended = /* @__PURE__ */ new WeakMap(), _MessageStream_errored = /* @__PURE__ */ new WeakMap(), _MessageStream_aborted = /* @__PURE__ */ new WeakMap(), _MessageStream_catchingPromiseCreated = /* @__PURE__ */ new WeakMap(), _MessageStream_response = /* @__PURE__ */ new WeakMap(), _MessageStream_request_id = /* @__PURE__ */ new WeakMap(), _MessageStream_workspace_id = /* @__PURE__ */ new WeakMap(), _MessageStream_logger = /* @__PURE__ */ new WeakMap(), _MessageStream_handleError = /* @__PURE__ */ new WeakMap(), _MessageStream_instances = /* @__PURE__ */ new WeakSet(), _MessageStream_getFinalMessage = function _MessageStream_getFinalMessage2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        return this.receivedMessages.at(-1);
      }, _MessageStream_getFinalText = function _MessageStream_getFinalText2() {
        if (this.receivedMessages.length === 0) {
          throw new AnthropicError("stream ended without producing a Message with role=assistant");
        }
        const textBlocks = this.receivedMessages.at(-1).content.filter((block) => block.type === "text").map((block) => block.text);
        if (textBlocks.length === 0) {
          throw new AnthropicError("stream ended without producing a content block with type=text");
        }
        return textBlocks.join(" ");
      }, _MessageStream_beginRequest = function _MessageStream_beginRequest2() {
        if (this.ended)
          return;
        __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
      }, _MessageStream_addStreamEvent = function _MessageStream_addStreamEvent2(event) {
        if (this.ended)
          return;
        const messageSnapshot = __classPrivateFieldGet(this, _MessageStream_instances, "m", _MessageStream_accumulateMessage).call(this, event);
        this._emit("streamEvent", event, messageSnapshot);
        switch (event.type) {
          case "content_block_delta": {
            const content = messageSnapshot.content.at(-1);
            switch (event.delta.type) {
              case "text_delta": {
                if (content.type === "text") {
                  this._emit("text", event.delta.text, content.text || "");
                }
                break;
              }
              case "citations_delta": {
                if (content.type === "text") {
                  this._emit("citation", event.delta.citation, content.citations ?? []);
                }
                break;
              }
              case "input_json_delta": {
                if (tracksToolInput2(content) && __classPrivateFieldGet(this, _MessageStream_listeners, "f").inputJson?.length) {
                  this._emit("inputJson", event.delta.partial_json, content.input);
                }
                break;
              }
              case "thinking_delta": {
                if (content.type === "thinking") {
                  this._emit("thinking", event.delta.thinking, content.thinking);
                }
                break;
              }
              case "signature_delta": {
                if (content.type === "thinking") {
                  this._emit("signature", content.signature);
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            break;
          }
          case "message_stop": {
            this._addMessageParam(messageSnapshot);
            this._addMessage(maybeParseMessage(messageSnapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") }), true);
            break;
          }
          case "content_block_stop": {
            this._emit("contentBlock", messageSnapshot.content.at(-1));
            break;
          }
          case "message_start": {
            __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, messageSnapshot, "f");
            break;
          }
          case "content_block_start":
          case "message_delta":
            break;
        }
      }, _MessageStream_endRequest = function _MessageStream_endRequest2() {
        if (this.ended) {
          throw new AnthropicError(`stream has ended, this shouldn't happen`);
        }
        const snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (!snapshot) {
          throw new AnthropicError(`request ended without sending any chunks`);
        }
        __classPrivateFieldSet(this, _MessageStream_currentMessageSnapshot, void 0, "f");
        return maybeParseMessage(snapshot, __classPrivateFieldGet(this, _MessageStream_params, "f"), { logger: __classPrivateFieldGet(this, _MessageStream_logger, "f") });
      }, _MessageStream_accumulateMessage = function _MessageStream_accumulateMessage2(event) {
        let snapshot = __classPrivateFieldGet(this, _MessageStream_currentMessageSnapshot, "f");
        if (event.type === "message_start") {
          if (snapshot) {
            throw new AnthropicError(`Unexpected event order, got ${event.type} before receiving "message_stop"`);
          }
          return event.message;
        }
        if (!snapshot) {
          throw new AnthropicError(`Unexpected event order, got ${event.type} before "message_start"`);
        }
        switch (event.type) {
          case "message_stop":
            return snapshot;
          case "message_delta":
            snapshot.stop_reason = event.delta.stop_reason;
            snapshot.stop_sequence = event.delta.stop_sequence;
            snapshot.stop_details = event.delta.stop_details;
            snapshot.usage.output_tokens = event.usage.output_tokens;
            if (event.delta.container != null) {
              snapshot.container = event.delta.container;
            }
            if (event.usage.input_tokens != null) {
              snapshot.usage.input_tokens = event.usage.input_tokens;
            }
            if (event.usage.cache_creation_input_tokens != null) {
              snapshot.usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens;
            }
            if (event.usage.cache_read_input_tokens != null) {
              snapshot.usage.cache_read_input_tokens = event.usage.cache_read_input_tokens;
            }
            if (event.usage.server_tool_use != null) {
              snapshot.usage.server_tool_use = event.usage.server_tool_use;
            }
            if (event.usage.output_tokens_details != null) {
              snapshot.usage.output_tokens_details = event.usage.output_tokens_details;
            }
            return snapshot;
          case "content_block_start":
            snapshot.content.push({ ...event.content_block });
            return snapshot;
          case "content_block_delta": {
            const snapshotContent = snapshot.content.at(event.index);
            switch (event.delta.type) {
              case "text_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    text: (snapshotContent.text || "") + event.delta.text
                  };
                }
                break;
              }
              case "citations_delta": {
                if (snapshotContent?.type === "text") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    citations: [...snapshotContent.citations ?? [], event.delta.citation]
                  };
                }
                break;
              }
              case "input_json_delta": {
                if (snapshotContent && tracksToolInput2(snapshotContent)) {
                  const jsonBuf = (snapshotContent[JSON_BUF_PROPERTY] || "") + event.delta.partial_json;
                  snapshot.content[event.index] = withLazyInput(snapshotContent, jsonBuf);
                }
                break;
              }
              case "thinking_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    thinking: snapshotContent.thinking + event.delta.thinking
                  };
                }
                break;
              }
              case "signature_delta": {
                if (snapshotContent?.type === "thinking") {
                  snapshot.content[event.index] = {
                    ...snapshotContent,
                    signature: event.delta.signature
                  };
                }
                break;
              }
              default:
                checkNever(event.delta);
            }
            return snapshot;
          }
          case "content_block_stop": {
            const snapshotContent = snapshot.content.at(event.index);
            if (snapshotContent && tracksToolInput2(snapshotContent) && JSON_BUF_PROPERTY in snapshotContent) {
              Object.defineProperty(snapshotContent, "input", {
                value: snapshotContent.input,
                enumerable: true,
                configurable: true,
                writable: true
              });
            }
            return snapshot;
          }
        }
      }, Symbol.asyncIterator)]() {
        const pushQueue = [];
        const readQueue = [];
        let done = false;
        this.on("streamEvent", (event) => {
          const reader = readQueue.shift();
          if (reader) {
            reader.resolve(event);
          } else {
            pushQueue.push(event);
          }
        });
        this.on("end", () => {
          done = true;
          for (const reader of readQueue) {
            reader.resolve(void 0);
          }
          readQueue.length = 0;
        });
        this.on("abort", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        this.on("error", (err) => {
          done = true;
          for (const reader of readQueue) {
            reader.reject(err);
          }
          readQueue.length = 0;
        });
        return {
          next: async () => {
            if (!pushQueue.length) {
              if (done) {
                return { value: void 0, done: true };
              }
              return new Promise((resolve2, reject) => readQueue.push({ resolve: resolve2, reject })).then((chunk2) => chunk2 ? { value: chunk2, done: false } : { value: void 0, done: true });
            }
            const chunk = pushQueue.shift();
            return { value: chunk, done: false };
          },
          return: async () => {
            this.abort();
            return { value: void 0, done: true };
          }
        };
      }
      toReadableStream() {
        const stream2 = new Stream(this[Symbol.asyncIterator].bind(this), this.controller);
        return stream2.toReadableStream();
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/messages/batches.mjs
var Batches2;
var init_batches2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/messages/batches.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_jsonl();
    init_error2();
    init_path();
    Batches2 = class extends APIResource {
      /**
       * Send a batch of Message creation requests.
       *
       * The Message Batches API can be used to process multiple Messages API requests at
       * once. Once a Message Batch is created, it begins processing immediately. Batches
       * can take up to 24 hours to complete.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.create({
       *   requests: [
       *     {
       *       custom_id: 'my-custom-id-1',
       *       params: {
       *         max_tokens: 1024,
       *         messages: [
       *           { content: 'Hello, world', role: 'user' },
       *         ],
       *         model: 'claude-opus-5',
       *       },
       *     },
       *   ],
       * });
       * ```
       */
      create(params, options) {
        const { user_profile_id, ...body } = params;
        return this._client.post("/v1/messages/batches", {
          body,
          ...options,
          headers: buildHeaders([
            { ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * This endpoint is idempotent and can be used to poll for Message Batch
       * completion. To access the results of a Message Batch, make a request to the
       * `results_url` field in the response.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.retrieve(
       *   'message_batch_id',
       * );
       * ```
       */
      retrieve(messageBatchID, options) {
        return this._client.get(path2`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * List all Message Batches within a Workspace. Most recently created batches are
       * returned first.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * // Automatically fetches more pages as needed.
       * for await (const messageBatch of client.messages.batches.list()) {
       *   // ...
       * }
       * ```
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/messages/batches", Page, { query, ...options });
      }
      /**
       * Delete a Message Batch.
       *
       * Message Batches can only be deleted once they've finished processing. If you'd
       * like to delete an in-progress batch, you must first cancel it.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const deletedMessageBatch =
       *   await client.messages.batches.delete('message_batch_id');
       * ```
       */
      delete(messageBatchID, options) {
        return this._client.delete(path2`/v1/messages/batches/${messageBatchID}`, options);
      }
      /**
       * Batches may be canceled any time before processing ends. Once cancellation is
       * initiated, the batch enters a `canceling` state, at which time the system may
       * complete any in-progress, non-interruptible requests before finalizing
       * cancellation.
       *
       * The number of canceled requests is specified in `request_counts`. To determine
       * which requests were canceled, check the individual results within the batch.
       * Note that cancellation may not result in any canceled requests if they were
       * non-interruptible.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatch = await client.messages.batches.cancel(
       *   'message_batch_id',
       * );
       * ```
       */
      cancel(messageBatchID, options) {
        return this._client.post(path2`/v1/messages/batches/${messageBatchID}/cancel`, options);
      }
      /**
       * Streams the results of a Message Batch as a `.jsonl` file.
       *
       * Each line in the file is a JSON object containing the result of a single request
       * in the Message Batch. Results are not guaranteed to be in the same order as
       * requests. Use the `custom_id` field to match results to requests.
       *
       * Learn more about the Message Batches API in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
       *
       * @example
       * ```ts
       * const messageBatchIndividualResponse =
       *   await client.messages.batches.results('message_batch_id');
       * ```
       */
      async results(messageBatchID, options) {
        const batch = await this.retrieve(messageBatchID);
        if (!batch.results_url) {
          throw new AnthropicError(`No batch \`results_url\`; Has it finished processing? ${batch.processing_status} - ${batch.id}`);
        }
        return this._client.get(batch.results_url, {
          ...options,
          headers: buildHeaders([{ Accept: "application/binary" }, options?.headers]),
          stream: true,
          __binaryResponse: true
        })._thenUnwrap((_, props) => JSONLDecoder.fromResponse(props.response, props.controller));
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/messages/messages.mjs
var Messages2, DEPRECATED_MODELS2, MODELS_TO_WARN_WITH_THINKING_ENABLED2;
var init_messages2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/messages/messages.mjs"() {
    init_resource();
    init_headers();
    init_stainless_helper_header();
    init_MessageStream();
    init_parser2();
    init_batches2();
    init_batches2();
    init_constants();
    Messages2 = class extends APIResource {
      constructor() {
        super(...arguments);
        this.batches = new Batches2(this._client);
      }
      create(params, options) {
        const { user_profile_id, ...body } = params;
        if (body.model in DEPRECATED_MODELS2) {
          console.warn(`The model '${body.model}' is deprecated and will reach end-of-life on ${DEPRECATED_MODELS2[body.model]}
Please migrate to a newer model. Visit https://docs.anthropic.com/en/docs/resources/model-deprecations for more information.`);
        }
        if (MODELS_TO_WARN_WITH_THINKING_ENABLED2.includes(body.model) && body.thinking && body.thinking.type === "enabled") {
          console.warn(`Using Claude with ${body.model} and 'thinking.type=enabled' is deprecated. Use 'thinking.type=adaptive' instead which results in better model performance in our testing: https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking`);
        }
        let timeout = options?.timeout ?? this._client._options.timeout;
        if (!body.stream && timeout == null) {
          const maxNonstreamingTokens = MODEL_NONSTREAMING_TOKENS[body.model] ?? void 0;
          timeout = this._client.calculateNonstreamingTimeout(body.max_tokens, maxNonstreamingTokens);
        }
        const helperHeader2 = stainlessHelperHeader(body.tools, body.messages);
        return this._client.post("/v1/messages", {
          body,
          timeout: timeout ?? 6e5,
          ...options,
          headers: buildHeaders([
            { ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0 },
            helperHeader2,
            options?.headers
          ]),
          stream: params.stream ?? false
        });
      }
      /**
       * Send a structured list of input messages with text and/or image content, along with an expected `output_config.format` and
       * the response will be automatically parsed and available in the `parsed_output` property of the message.
       *
       * @example
       * ```ts
       * const message = await client.messages.parse({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      parse(params, options) {
        return this.create(params, options).then((message) => parseMessage(message, params, { logger: this._client.logger ?? console }));
      }
      /**
       * Create a Message stream.
       *
       * If `output_config.format` is provided with a parseable format (like `zodOutputFormat()`),
       * the final message will include a `parsed_output` property with the parsed content.
       *
       * @example
       * ```ts
       * const stream = client.messages.stream({
       *   model: 'claude-sonnet-4-5-20250929',
       *   max_tokens: 1024,
       *   messages: [{ role: 'user', content: 'What is 2+2?' }],
       *   output_config: {
       *     format: zodOutputFormat(z.object({ answer: z.number() })),
       *   },
       * });
       *
       * const message = await stream.finalMessage();
       * console.log(message.parsed_output?.answer); // 4
       * ```
       */
      stream(body, options) {
        return MessageStream.createMessage(this, body, options, { logger: this._client.logger ?? console });
      }
      /**
       * Count the number of tokens in a Message.
       *
       * The Token Count API can be used to count the number of tokens in a Message,
       * including tools, images, and documents, without creating it.
       *
       * Learn more about token counting in our
       * [user guide](https://platform.claude.com/docs/en/build-with-claude/token-counting)
       *
       * @example
       * ```ts
       * const messageTokensCount =
       *   await client.messages.countTokens({
       *     messages: [{ content: 'Hello, world', role: 'user' }],
       *     model: 'claude-opus-5',
       *   });
       * ```
       */
      countTokens(params, options) {
        const { user_profile_id, ...body } = params;
        return this._client.post("/v1/messages/count_tokens", {
          body,
          ...options,
          headers: buildHeaders([
            { ...user_profile_id != null ? { "anthropic-user-profile-id": user_profile_id } : void 0 },
            options?.headers
          ])
        });
      }
    };
    DEPRECATED_MODELS2 = {};
    MODELS_TO_WARN_WITH_THINKING_ENABLED2 = ["claude-mythos-preview", "claude-opus-4-6"];
    Messages2.Batches = Batches2;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/models.mjs
var Models2;
var init_models2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/models.mjs"() {
    init_resource();
    init_pagination();
    init_headers();
    init_path();
    Models2 = class extends APIResource {
      /**
       * Get a specific model.
       *
       * The Models API response can be used to determine information about a specific
       * model or resolve a model alias to a model ID.
       */
      retrieve(modelID, params = {}, options) {
        const { betas } = params ?? {};
        return this._client.get(path2`/v1/models/${modelID}`, {
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
      /**
       * List available models.
       *
       * The Models API response can be used to determine which models are available for
       * use in the API. More recently released models are listed first.
       */
      list(params = {}, options) {
        const { betas, ...query } = params ?? {};
        return this._client.getAPIList("/v1/models", Page, {
          query,
          ...options,
          headers: buildHeaders([
            { ...betas?.toString() != null ? { "anthropic-beta": betas?.toString() } : void 0 },
            options?.headers
          ])
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/skills/versions.mjs
var Versions3;
var init_versions3 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/skills/versions.mjs"() {
    init_resource();
    init_pagination();
    init_uploads();
    init_path();
    Versions3 = class extends APIResource {
      /**
       * Create Skill Version
       */
      create(skillID, body, options) {
        return this._client.post(path2`/v1/skills/${skillID}/versions`, multipartFormRequestOptions({ body, ...options }, this._client, false));
      }
      /**
       * Get Skill Version
       */
      retrieve(version, params, options) {
        const { skill_id } = params;
        return this._client.get(path2`/v1/skills/${skill_id}/versions/${version}`, options);
      }
      /**
       * List Skill Versions
       */
      list(skillID, query = {}, options) {
        return this._client.getAPIList(path2`/v1/skills/${skillID}/versions`, PageCursor, {
          query,
          ...options
        });
      }
      /**
       * Delete Skill Version
       */
      delete(version, params, options) {
        const { skill_id } = params;
        return this._client.delete(path2`/v1/skills/${skill_id}/versions/${version}`, options);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/skills/skills.mjs
var Skills2;
var init_skills3 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/skills/skills.mjs"() {
    init_resource();
    init_versions3();
    init_versions3();
    init_pagination();
    init_uploads();
    init_path();
    Skills2 = class extends APIResource {
      constructor() {
        super(...arguments);
        this.versions = new Versions3(this._client);
      }
      /**
       * Create Skill
       */
      create(body, options) {
        return this._client.post("/v1/skills", multipartFormRequestOptions({ body, ...options }, this._client, false));
      }
      /**
       * Get Skill
       */
      retrieve(skillID, options) {
        return this._client.get(path2`/v1/skills/${skillID}`, options);
      }
      /**
       * List Skills
       */
      list(query = {}, options) {
        return this._client.getAPIList("/v1/skills", PageCursor, { query, ...options });
      }
      /**
       * Delete Skill
       */
      delete(skillID, options) {
        return this._client.delete(path2`/v1/skills/${skillID}`, options);
      }
    };
    Skills2.Versions = Versions3;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/index.mjs
var init_resources2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/resources/index.mjs"() {
    init_shared();
    init_beta();
    init_completions();
    init_files2();
    init_messages2();
    init_models2();
    init_skills3();
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/client.mjs
var _BaseAnthropic_instances, _a, _BaseAnthropic_encoder, _BaseAnthropic_baseURLOverridden, HUMAN_PROMPT, AI_PROMPT, BaseAnthropic, Anthropic;
var init_client = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/client.mjs"() {
    init_tslib();
    init_uuid();
    init_values();
    init_sleep();
    init_errors();
    init_detect_platform();
    init_request_signal();
    init_shims();
    init_request_options();
    init_query();
    init_version();
    init_error();
    init_types();
    init_token_cache();
    init_credential_chain();
    init_middleware();
    init_pagination();
    init_uploads2();
    init_resources2();
    init_api_promise();
    init_completions();
    init_files2();
    init_models2();
    init_beta();
    init_messages2();
    init_skills3();
    init_detect_platform();
    init_headers();
    init_env();
    init_log();
    init_values();
    HUMAN_PROMPT = "\\n\\nHuman:";
    AI_PROMPT = "\\n\\nAssistant:";
    BaseAnthropic = class {
      /**
       * The active credential provider. Default credential resolution runs once
       * at construction time. If it fails, the error is surfaced on every
       * request and the client must be reconstructed — there is no retry path.
       *
       * Clones returned by {@link withOptions} share the parent's auth state
       * (provider, token cache, pending resolution, and any resolution error)
       * unless the caller passes an explicit `apiKey`, `authToken`,
       * `credentials`, `config`, or `profile` override.
       */
      get credentials() {
        return this._authState.provider;
      }
      /**
       * API Client for interfacing with the Anthropic API.
       *
       * @param {string | null | undefined} [opts.apiKey=process.env['ANTHROPIC_API_KEY'] ?? null]
       * @param {string | null | undefined} [opts.authToken=process.env['ANTHROPIC_AUTH_TOKEN'] ?? null]
       * @param {string | null | undefined} [opts.webhookKey=process.env['ANTHROPIC_WEBHOOK_SIGNING_KEY'] ?? null]
       * @param {string} [opts.baseURL=process.env['ANTHROPIC_BASE_URL'] ?? https://api.anthropic.com] - Override the default base URL for the API.
       * @param {number} [opts.timeout=10 minutes] - The maximum amount of time (in milliseconds) the client will wait for a response before timing out.
       * @param {MergedRequestInit} [opts.fetchOptions] - Additional `RequestInit` options to be passed to `fetch` calls.
       * @param {Fetch} [opts.fetch] - Specify a custom `fetch` function implementation.
       * @param {number} [opts.maxRetries=2] - The maximum number of times the client will retry a request.
       * @param {HeadersLike} opts.defaultHeaders - Default headers to include with every request to the API.
       * @param {Record<string, string | undefined>} opts.defaultQuery - Default query parameters to include with every request to the API.
       * @param {boolean} [opts.dangerouslyAllowBrowser=false] - By default, client-side use of this library is not allowed, as it risks exposing your secret API credentials to attackers.
       */
      constructor({ baseURL = readEnv("ANTHROPIC_BASE_URL"), apiKey, authToken, webhookKey = readEnv("ANTHROPIC_WEBHOOK_SIGNING_KEY") ?? null, ...opts } = {}) {
        _BaseAnthropic_instances.add(this);
        this._requestAuthFlags = /* @__PURE__ */ new WeakMap();
        _BaseAnthropic_encoder.set(this, void 0);
        if (apiKey === void 0) {
          apiKey = opts.profile != null ? null : readEnv("ANTHROPIC_API_KEY") ?? null;
        }
        if (authToken === void 0) {
          authToken = opts.profile != null ? null : readEnv("ANTHROPIC_AUTH_TOKEN") ?? null;
        }
        if (opts.profile != null && (opts.credentials != null || opts.config != null)) {
          throw new TypeError("Pass at most one of `profile`, `credentials`, or `config`.");
        }
        const options = {
          apiKey,
          authToken,
          webhookKey,
          ...opts,
          baseURL: baseURL || `https://api.anthropic.com`
        };
        if (!options.dangerouslyAllowBrowser && isRunningInBrowser()) {
          throw new AnthropicError("It looks like you're running in a browser-like environment.\n\nThis is disabled by default, as it risks exposing your secret API credentials to attackers.\nIf you understand the risks and have appropriate mitigations in place,\nyou can set the `dangerouslyAllowBrowser` option to `true`, e.g.,\n\nnew Anthropic({ apiKey, dangerouslyAllowBrowser: true });\n");
        }
        this.baseURL = options.baseURL;
        this._baseURLIsExplicit = opts.__baseURLIsExplicit ?? !!baseURL;
        this.timeout = options.timeout ?? _a.DEFAULT_TIMEOUT;
        this.logger = options.logger ?? console;
        this.logLevel = defaultLogLevel;
        this.logLevel = parseLogLevel(options.logLevel, "ClientOptions.logLevel", loggerFor(this)) ?? parseLogLevel(readEnv("ANTHROPIC_LOG"), "process.env['ANTHROPIC_LOG']", loggerFor(this)) ?? defaultLogLevel;
        this.fetchOptions = options.fetchOptions;
        this.maxRetries = options.maxRetries ?? 2;
        this.fetch = options.fetch ?? getDefaultFetch();
        __classPrivateFieldSet(this, _BaseAnthropic_encoder, FallbackEncoder, "f");
        this.middleware = [...options.middleware ?? []];
        const customHeadersEnv = readEnv("ANTHROPIC_CUSTOM_HEADERS");
        if (customHeadersEnv) {
          const parsed = {};
          for (const line of customHeadersEnv.split("\n")) {
            const colon = line.indexOf(":");
            if (colon >= 0) {
              parsed[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
            }
          }
          options.defaultHeaders = { ...parsed, ...options.defaultHeaders };
        }
        const inherited = opts.__auth;
        delete options.__auth;
        delete options.__baseURLIsExplicit;
        this._options = options;
        this.apiKey = typeof apiKey === "string" ? apiKey : null;
        this.authToken = authToken;
        this.webhookKey = webhookKey;
        if (inherited) {
          this._authState = inherited;
          if (!this._baseURLIsExplicit && inherited.baseURL) {
            this.baseURL = inherited.baseURL;
          }
        } else {
          this._authState = { provider: null, tokenCache: null, resolution: null, error: null, extraHeaders: {} };
          if (this.apiKey == null && this.authToken == null) {
            const credentials = options.credentials ?? null;
            if (credentials) {
              this._authState.provider = credentials;
              this._authState.tokenCache = this._makeTokenCache(credentials);
            } else if (options.config != null) {
              const result = resolveCredentialsFromConfig(options.config, this._credentialResolverOptions());
              this._authState.provider = result.provider;
              this._authState.tokenCache = this._makeTokenCache(result.provider);
              this._authState.extraHeaders = result.extraHeaders;
              this._applyCredentialBaseURL(result.baseURL);
            } else if (options.profile != null) {
              this._authState.resolution = this._resolveDefaultCredentials(options.profile);
            } else if (this._shouldResolveDefaultCredentials()) {
              this._authState.resolution = this._resolveDefaultCredentials();
            }
          }
        }
      }
      /**
       * Whether to lazily resolve auth from the default credential chain when no
       * explicit auth is configured. Called once from the constructor, so
       * overrides must not depend on subclass instance state. Subclasses that
       * bring their own auth scheme return false so unrelated local credentials
       * are never resolved or allowed to supply a base URL.
       */
      _shouldResolveDefaultCredentials() {
        return true;
      }
      /**
       * Stores a profile/config-supplied base URL on the shared auth state and, if
       * the caller did not pin `baseURL` via constructor option or env, adopts it
       * as this client's outbound API host. Precedence: ctor opt > env > profile >
       * hardcoded default.
       */
      _applyCredentialBaseURL(baseURL) {
        if (!baseURL)
          return;
        const normalized = baseURL.replace(/\/+$/, "");
        this._authState.baseURL = normalized;
        if (!this._baseURLIsExplicit) {
          this.baseURL = normalized;
        }
      }
      /**
       * Options bag passed into the credential chain. `baseURL` here is only the
       * fallback host for the token-exchange POST when the config itself omits
       * `base_url`; the chain returns the config's own `base_url` (if any) on
       * {@link CredentialResult.baseURL}, which {@link _applyCredentialBaseURL}
       * then adopts for outbound API requests. The two are deliberately decoupled
       * so this fallback never round-trips into precedence.
       */
      _credentialResolverOptions() {
        return {
          baseURL: this.baseURL,
          fetch: this._credentialsFetch(),
          userAgent: this.getUserAgent(),
          onCacheWriteError: (err) => {
            loggerFor(this).debug("credential cache write failed (best-effort)", err);
          },
          onSafetyWarning: (msg) => {
            loggerFor(this).warn(msg);
          }
        };
      }
      /**
       * A `Fetch` for first-party credential token-exchange requests (OIDC
       * federation jwt-bearer grants, user-OAuth refresh grants) that routes
       * through this client's middleware chain, so middleware observes token
       * traffic like any other request. Only client-level middleware applies:
       * a minted token is shared across requests, so attributing the exchange
       * to any one request's per-request middleware would be arbitrary. For the
       * same reason, `ctx.options` is undefined for these requests.
       */
      _credentialsFetch() {
        return wrapFetchWithMiddleware(this.fetch, this.middleware, void 0, this);
      }
      _makeTokenCache(provider) {
        return new TokenCache(provider, (err) => {
          loggerFor(this).debug("advisory token refresh failed; serving cached token", err);
        });
      }
      /**
       * Create a new client instance re-using the same options given to the current client with optional overriding.
       */
      withOptions(options) {
        const overridesStructuredAuth = "credentials" in options || "config" in options || "profile" in options;
        const overridesAuth = "apiKey" in options || "authToken" in options || overridesStructuredAuth;
        const internal = {
          ...this._options,
          // Only forward baseURL when the caller (or env) explicitly chose it.
          // For a non-explicit parent, this.baseURL may have been mutated to the
          // profile-resolved host; pinning that as the clone's options.baseURL
          // would make _options on the clone misreport caller intent and would
          // leave the clone stuck on the parent's host across an auth override.
          // The clone instead receives the construction-time value via
          // ...this._options above and re-adopts the profile host through the
          // shared _authState.baseURL + __baseURLIsExplicit=false path.
          ...this._baseURLIsExplicit ? { baseURL: this.baseURL } : {},
          maxRetries: this.maxRetries,
          timeout: this.timeout,
          logger: this.logger,
          logLevel: this.logLevel,
          fetch: this.fetch,
          fetchOptions: this.fetchOptions,
          middleware: this.middleware,
          apiKey: this.apiKey,
          authToken: this.authToken,
          webhookKey: this.webhookKey,
          // credentials: this.credentials is a no-op when __auth is shared (the
          // ctor takes the inherited path and ignores options.credentials); when
          // overridesAuth is true via apiKey/authToken only, it lets the clone
          // build a fresh TokenCache around the parent's provider.
          credentials: this.credentials,
          // When the caller passes a structured-credential override, drop inherited
          // structured-credential options so only `...options` supplies them —
          // otherwise an inherited `credentials`/`config`/`profile` would trip the
          // mutual-exclusion check or precedence over the override.
          ...overridesStructuredAuth ? { credentials: void 0, config: void 0, profile: void 0 } : {},
          ...options,
          // Always set __auth so any stale value from ...this._options is
          // overwritten. undefined means "build fresh auth from these options".
          __auth: overridesAuth ? void 0 : this._authState,
          __baseURLIsExplicit: "baseURL" in options ? true : this._baseURLIsExplicit
        };
        return new this.constructor(internal);
      }
      /**
       * Lazily resolves credentials from config files or environment variables.
       * Called once from the constructor when no explicit auth is provided, or
       * when an explicit `profile` was passed (in which case a missing/unresolved
       * profile is surfaced as an error instead of falling through to "no auth").
       * The returned promise is stored and awaited on the first request.
       */
      async _resolveDefaultCredentials(profile) {
        try {
          const result = await defaultCredentials(this._credentialResolverOptions(), profile);
          if (result) {
            this._authState.provider = result.provider;
            this._authState.tokenCache = this._makeTokenCache(result.provider);
            this._authState.extraHeaders = result.extraHeaders;
            this._applyCredentialBaseURL(result.baseURL);
          } else if (profile != null) {
            throw new AnthropicError(`Profile "${profile}" could not be resolved (no <config_dir>/configs/${profile}.json found).`);
          }
        } catch (err) {
          this._authState.error = err;
        } finally {
          this._authState.resolution = null;
        }
      }
      defaultQuery() {
        return this._options.defaultQuery;
      }
      validateHeaders({ values, nulls }) {
        if (values.get("x-api-key") || values.get("authorization")) {
          return;
        }
        if (this._authState.error) {
          throw this._authState.error;
        }
        if (this._authState.tokenCache || this._authState.resolution) {
          return;
        }
        if (this.apiKey && values.get("x-api-key")) {
          return;
        }
        if (nulls.has("x-api-key")) {
          return;
        }
        if (this.authToken && values.get("authorization")) {
          return;
        }
        if (nulls.has("authorization")) {
          return;
        }
        throw new Error('Could not resolve authentication method. Expected one of apiKey, authToken, credentials, config, or profile to be set. Or for one of the "X-Api-Key" or "Authorization" headers to be explicitly omitted');
      }
      _authFlags(opts) {
        let flags = this._requestAuthFlags.get(opts);
        if (!flags) {
          flags = { usedTokenCache: false, didRefreshFor401: false };
          this._requestAuthFlags.set(opts, flags);
        }
        return flags;
      }
      async authHeaders(opts) {
        if (this._authState.resolution) {
          await this._authState.resolution;
        }
        if (this._authState.error) {
          return void 0;
        }
        if (this._authState.tokenCache && this.apiKey == null) {
          const token = await this._authState.tokenCache.getToken();
          this._authFlags(opts).usedTokenCache = true;
          return buildHeaders([{ Authorization: `Bearer ${token}` }]);
        }
        return buildHeaders([await this.apiKeyAuth(opts), await this.bearerAuth(opts)]);
      }
      async apiKeyAuth(opts) {
        if (this.apiKey == null) {
          return void 0;
        }
        return buildHeaders([{ "X-Api-Key": this.apiKey }]);
      }
      async bearerAuth(opts) {
        if (this.authToken == null) {
          return void 0;
        }
        return buildHeaders([{ Authorization: `Bearer ${this.authToken}` }]);
      }
      stringifyQuery(query) {
        return stringifyQuery(query);
      }
      getUserAgent() {
        return `Anthropic/JS ${VERSION}`;
      }
      defaultIdempotencyKey() {
        return `stainless-node-retry-${uuid4()}`;
      }
      makeStatusError(status, error, message, headers) {
        return APIError.generate(status, error, message, headers);
      }
      buildURL(path4, query, defaultBaseURL) {
        const baseURL = !__classPrivateFieldGet(this, _BaseAnthropic_instances, "m", _BaseAnthropic_baseURLOverridden).call(this) && defaultBaseURL || this.baseURL;
        const url = isAbsoluteURL(path4) ? new URL(path4) : new URL(baseURL + (baseURL.endsWith("/") && path4.startsWith("/") ? path4.slice(1) : path4));
        const defaultQuery = this.defaultQuery();
        const pathQuery = Object.fromEntries(url.searchParams);
        if (!isEmptyObj(defaultQuery) || !isEmptyObj(pathQuery)) {
          query = { ...pathQuery, ...defaultQuery, ...query };
        }
        if (typeof query === "object" && query && !Array.isArray(query)) {
          url.search = this.stringifyQuery(query);
        }
        return url.toString();
      }
      _calculateNonstreamingTimeout(maxTokens) {
        const defaultTimeout = 10 * 60;
        const expectedTimeout = 60 * 60 * maxTokens / 128e3;
        if (expectedTimeout > defaultTimeout) {
          throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#streaming-responses for more details");
        }
        return defaultTimeout * 1e3;
      }
      /**
       * Used as a callback for mutating the given `FinalRequestOptions` object.
       */
      async prepareOptions(options) {
      }
      /**
       * Used as a callback for mutating the given `RequestInit` object.
       *
       * This is useful for cases where you want to add certain headers based off of
       * the request properties, e.g. `method` or `url`.
       *
       * Runs after all middleware (including {@link backendMiddleware}),
       * immediately before each underlying fetch call, so it sees exactly what
       * goes over the wire. Middleware may replay a request by calling `next()`
       * more than once, so this hook can run multiple times per attempt:
       * overrides must be idempotent and overwrite headers from a previous
       * invocation rather than append to them.
       */
      async prepareRequest(request, { url, options }) {
        if (this._authState.tokenCache && this.apiKey == null) {
          const headers = request.headers instanceof Headers ? request.headers : new Headers(request.headers);
          for (const [k, v] of Object.entries(this._authState.extraHeaders)) {
            if (!headers.has(k))
              headers.set(k, v);
          }
          const existing = headers.get("anthropic-beta")?.split(",").map((s) => s.trim());
          if (!existing?.includes(OAUTH_API_BETA_HEADER)) {
            headers.append("anthropic-beta", OAUTH_API_BETA_HEADER);
          }
          request.headers = headers;
        }
      }
      /**
       * Internal {@link Middleware} composed innermost in the chain — inside both
       * client-level and per-request middleware, immediately around the underlying
       * `fetch`. Subclasses for third-party backends override this to adapt the
       * canonical Anthropic-shaped request to the backend's wire shape (URL/body
       * rewriting, request signing) and to normalize the wire response back to the
       * canonical shape (e.g. AWS EventStream to SSE).
       *
       * Running inside the user's middleware means user middleware always observes
       * canonical Anthropic-shaped traffic, and the adaptation re-runs (e.g.
       * re-signs) on every `next()` invocation, covering whatever the middleware
       * mutated.
       *
       * Errors thrown here follow the middleware error policy: they propagate to
       * the caller as-is — no retries, no `APIConnectionError` wrapping — unless
       * retryable (see {@link Middleware}); throw a `RetryableError` to opt into
       * the retry path.
       */
      backendMiddleware() {
        return [];
      }
      get(path4, opts) {
        return this.methodRequest("get", path4, opts);
      }
      post(path4, opts) {
        return this.methodRequest("post", path4, opts);
      }
      patch(path4, opts) {
        return this.methodRequest("patch", path4, opts);
      }
      put(path4, opts) {
        return this.methodRequest("put", path4, opts);
      }
      delete(path4, opts) {
        return this.methodRequest("delete", path4, opts);
      }
      methodRequest(method, path4, opts) {
        return this.request(Promise.resolve(opts).then((opts2) => {
          return { method, path: path4, ...opts2 };
        }));
      }
      request(options, remainingRetries = null) {
        return new APIPromise(this, this.makeRequest(options, remainingRetries, void 0));
      }
      async makeRequest(optionsInput, retriesRemaining, retryOfRequestLogID) {
        const options = await optionsInput;
        const maxRetries = options.maxRetries ?? this.maxRetries;
        if (retriesRemaining == null) {
          retriesRemaining = maxRetries;
          this._requestAuthFlags.delete(options);
        }
        await this.prepareOptions(options);
        const { req, url, timeout } = await this.buildRequest(options, {
          retryCount: maxRetries - retriesRemaining
        });
        const requestLogID = "log_" + (Math.random() * (1 << 24) | 0).toString(16).padStart(6, "0");
        const retryLogStr = retryOfRequestLogID === void 0 ? "" : `, retryOf: ${retryOfRequestLogID}`;
        const startTime = Date.now();
        if (options.signal?.aborted) {
          throw new APIUserAbortError();
        }
        const controller = new AbortController();
        const response = await this.fetchWithTimeout(url, req, timeout, controller, options, {
          requestLogID,
          retryOfRequestLogID
        }).catch(castToError);
        const headersTime = Date.now();
        if (response instanceof globalThis.Error) {
          releaseRequestSignal(controller);
          const retryMessage = `retrying, ${retriesRemaining} attempts remaining`;
          if (options.signal?.aborted) {
            throw new APIUserAbortError();
          }
          const isTimeout = isAbortError(response) || /timed? ?out/i.test(String(response) + ("cause" in response ? String(response.cause) : ""));
          const hasMiddleware = this.middleware.length > 0 || !!options.middleware?.length || this.backendMiddleware().length > 0;
          if (hasMiddleware && !isTimeout && !isRetryableError(response)) {
            loggerFor(this).info(`[${requestLogID}] middleware error (not retryable)`);
            loggerFor(this).debug(`[${requestLogID}] middleware error (not retryable)`, formatRequestDetails({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            throw response;
          }
          if (retriesRemaining) {
            loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - ${retryMessage}`);
            loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (${retryMessage})`, formatRequestDetails({
              retryOfRequestLogID,
              url,
              durationMs: headersTime - startTime,
              message: response.message
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID);
          }
          loggerFor(this).info(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} - error; no more retries left`);
          loggerFor(this).debug(`[${requestLogID}] connection ${isTimeout ? "timed out" : "failed"} (error; no more retries left)`, formatRequestDetails({
            retryOfRequestLogID,
            url,
            durationMs: headersTime - startTime,
            message: response.message
          }));
          if (isTimeout) {
            throw new APIConnectionTimeoutError();
          }
          if (hasMiddleware && !isFetchOriginError(response)) {
            throw response;
          }
          throw new APIConnectionError({ cause: response });
        }
        const specialHeaders = [...response.headers.entries()].filter(([name]) => name === "request-id" || name === "anthropic-workspace-id").map(([name, value]) => ", " + name + ": " + JSON.stringify(value)).join("");
        const responseInfo = `[${requestLogID}${retryLogStr}${specialHeaders}] ${req.method} ${url} ${response.ok ? "succeeded" : "failed"} with status ${response.status} in ${headersTime - startTime}ms`;
        if (!response.ok) {
          const shouldRetry = await this.shouldRetry(response, options);
          if (retriesRemaining && shouldRetry) {
            const retryMessage2 = `retrying, ${retriesRemaining} attempts remaining`;
            await CancelReadableStream(response.body);
            releaseRequestSignal(controller);
            loggerFor(this).info(`${responseInfo} - ${retryMessage2}`);
            loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage2})`, formatRequestDetails({
              retryOfRequestLogID,
              url: response.url,
              status: response.status,
              headers: response.headers,
              durationMs: headersTime - startTime
            }));
            return this.retryRequest(options, retriesRemaining, retryOfRequestLogID ?? requestLogID, response.headers);
          }
          const retryMessage = shouldRetry ? `error; no more retries left` : `error; not retryable`;
          loggerFor(this).info(`${responseInfo} - ${retryMessage}`);
          const errText = await response.text().catch((err2) => castToError(err2).message);
          const errJSON = safeJSON(errText);
          const errMessage = errJSON ? void 0 : errText;
          loggerFor(this).debug(`[${requestLogID}] response error (${retryMessage})`, formatRequestDetails({
            retryOfRequestLogID,
            url: response.url,
            status: response.status,
            headers: response.headers,
            message: errMessage,
            durationMs: Date.now() - startTime
          }));
          releaseRequestSignal(controller);
          const err = this.makeStatusError(response.status, errJSON, errMessage, response.headers);
          throw err;
        }
        loggerFor(this).info(responseInfo);
        loggerFor(this).debug(`[${requestLogID}] response start`, formatRequestDetails({
          retryOfRequestLogID,
          url: response.url,
          status: response.status,
          headers: response.headers,
          durationMs: headersTime - startTime
        }));
        armAbandonmentBackstop(response.body ?? response, controller);
        return { response, options, controller, requestLogID, retryOfRequestLogID, startTime };
      }
      getAPIList(path4, Page2, opts) {
        return this.requestAPIList(Page2, opts && "then" in opts ? opts.then((opts2) => ({ method: "get", path: path4, ...opts2 })) : { method: "get", path: path4, ...opts });
      }
      requestAPIList(Page2, options) {
        const request = this.makeRequest(options, null, void 0);
        return new PagePromise(this, request, Page2);
      }
      async fetchWithTimeout(url, init, ms, controller, requestOptions, logCtx) {
        const { signal, method, ...options } = init || {};
        const abort = this._makeAbort(controller);
        if (signal) {
          signal.addEventListener("abort", abort, { once: true });
          registerRequestSignalCleanup(controller, signal, abort);
        }
        const isReadableBody = globalThis.ReadableStream && options.body instanceof globalThis.ReadableStream || typeof options.body === "object" && options.body !== null && Symbol.asyncIterator in options.body;
        const fetchOptions = {
          signal: controller.signal,
          ...isReadableBody ? { duplex: "half" } : {},
          method: "GET",
          ...options
        };
        if (method) {
          fetchOptions.method = method.toUpperCase();
        }
        const baseFetch = this.fetch;
        const timedFetch = async (innerUrl, innerInit) => {
          const timeout = setTimeout(abort, ms);
          try {
            return await baseFetch.call(void 0, innerUrl, innerInit);
          } finally {
            clearTimeout(timeout);
          }
        };
        const innerFetch = requestOptions === void 0 ? timedFetch : (async (innerUrl, innerInit = {}) => {
          const innerUrlStr = typeof innerUrl === "string" ? innerUrl : innerUrl instanceof URL ? innerUrl.href : innerUrl.url;
          innerInit.headers = innerInit.headers instanceof Headers ? innerInit.headers : new Headers(innerInit.headers);
          await this.prepareRequest(innerInit, { url: innerUrlStr, options: requestOptions });
          if (logCtx) {
            loggerFor(this).debug(`[${logCtx.requestLogID}] sending request`, formatRequestDetails({
              retryOfRequestLogID: logCtx.retryOfRequestLogID,
              method: innerInit.method,
              url: innerUrlStr,
              options: requestOptions,
              headers: innerInit.headers
            }));
          }
          return timedFetch(innerUrl, innerInit);
        });
        const requestMiddleware = requestOptions?.middleware;
        const backendMiddleware = this.backendMiddleware();
        const allMiddleware = requestMiddleware?.length || backendMiddleware.length ? [...this.middleware, ...requestMiddleware ?? [], ...backendMiddleware] : this.middleware;
        return await wrapFetchWithMiddleware(innerFetch, allMiddleware, requestOptions, this)(url, fetchOptions);
      }
      async shouldRetry(response, options) {
        const flags = this._authFlags(options);
        if (response.status === 401 && this._authState.tokenCache && flags.usedTokenCache && !flags.didRefreshFor401) {
          flags.didRefreshFor401 = true;
          this._authState.tokenCache.invalidate();
          return true;
        }
        const shouldRetryHeader = response.headers.get("x-should-retry");
        if (shouldRetryHeader === "true")
          return true;
        if (shouldRetryHeader === "false")
          return false;
        if (response.status === 408)
          return true;
        if (response.status === 409)
          return true;
        if (response.status === 429)
          return true;
        if (response.status >= 500)
          return true;
        return false;
      }
      async retryRequest(options, retriesRemaining, requestLogID, responseHeaders) {
        let timeoutMillis;
        const retryAfterMillisHeader = responseHeaders?.get("retry-after-ms");
        if (retryAfterMillisHeader) {
          const timeoutMs = parseFloat(retryAfterMillisHeader);
          if (!Number.isNaN(timeoutMs)) {
            timeoutMillis = timeoutMs;
          }
        }
        const retryAfterHeader = responseHeaders?.get("retry-after");
        if (retryAfterHeader && !timeoutMillis) {
          const timeoutSeconds = parseFloat(retryAfterHeader);
          if (!Number.isNaN(timeoutSeconds)) {
            timeoutMillis = timeoutSeconds * 1e3;
          } else {
            timeoutMillis = Date.parse(retryAfterHeader) - Date.now();
          }
        }
        if (timeoutMillis === void 0) {
          const maxRetries = options.maxRetries ?? this.maxRetries;
          timeoutMillis = this.calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries);
        }
        await sleep(timeoutMillis);
        return this.makeRequest(options, retriesRemaining - 1, requestLogID);
      }
      calculateDefaultRetryTimeoutMillis(retriesRemaining, maxRetries) {
        const initialRetryDelay = 0.5;
        const maxRetryDelay = 8;
        const numRetries = maxRetries - retriesRemaining;
        const sleepSeconds = Math.min(initialRetryDelay * Math.pow(2, numRetries), maxRetryDelay);
        const jitter2 = 1 - Math.random() * 0.25;
        return sleepSeconds * jitter2 * 1e3;
      }
      calculateNonstreamingTimeout(maxTokens, maxNonstreamingTokens) {
        const maxTime = 60 * 60 * 1e3;
        const defaultTime = 60 * 10 * 1e3;
        const expectedTime = maxTime * maxTokens / 128e3;
        if (expectedTime > defaultTime || maxNonstreamingTokens != null && maxTokens > maxNonstreamingTokens) {
          throw new AnthropicError("Streaming is required for operations that may take longer than 10 minutes. See https://github.com/anthropics/anthropic-sdk-typescript#long-requests for more details");
        }
        return defaultTime;
      }
      async buildRequest(inputOptions, { retryCount = 0 } = {}) {
        const options = { ...inputOptions };
        const { method, path: path4, query, defaultBaseURL } = options;
        if (this._authState.resolution) {
          await this._authState.resolution;
        }
        if (!this._baseURLIsExplicit && this._authState.baseURL && this.baseURL !== this._authState.baseURL) {
          this.baseURL = this._authState.baseURL;
        }
        const url = this.buildURL(path4, query, defaultBaseURL);
        if ("timeout" in options)
          validatePositiveInteger("timeout", options.timeout);
        options.timeout = options.timeout ?? this.timeout;
        const { bodyHeaders, body } = this.buildBody({ options });
        const reqHeaders = await this.buildHeaders({ options: inputOptions, method, bodyHeaders, retryCount });
        const req = {
          method,
          headers: reqHeaders,
          ...options.signal && { signal: options.signal },
          ...globalThis.ReadableStream && body instanceof globalThis.ReadableStream && { duplex: "half" },
          ...body && { body },
          ...this.fetchOptions ?? {},
          ...options.fetchOptions ?? {}
        };
        return { req, url, timeout: options.timeout };
      }
      async buildHeaders({ options, method, bodyHeaders, retryCount }) {
        let idempotencyHeaders = {};
        if (this.idempotencyHeader && method !== "get") {
          if (!options.idempotencyKey)
            options.idempotencyKey = this.defaultIdempotencyKey();
          idempotencyHeaders[this.idempotencyHeader] = options.idempotencyKey;
        }
        const headers = buildHeaders([
          idempotencyHeaders,
          {
            Accept: "application/json",
            "User-Agent": this.getUserAgent(),
            "X-Stainless-Retry-Count": String(retryCount),
            ...options.timeout ? { "X-Stainless-Timeout": String(Math.trunc(options.timeout / 1e3)) } : {},
            ...getPlatformHeaders(),
            ...this._options.dangerouslyAllowBrowser ? { "anthropic-dangerous-direct-browser-access": "true" } : void 0,
            "anthropic-version": "2023-06-01"
          },
          await this.authHeaders(options),
          this._options.defaultHeaders,
          bodyHeaders,
          options.headers
        ]);
        this.validateHeaders(headers);
        return headers.values;
      }
      _makeAbort(controller) {
        return () => controller.abort();
      }
      buildBody({ options: { body, headers: rawHeaders } }) {
        if (!body) {
          return { bodyHeaders: void 0, body: void 0 };
        }
        const headers = buildHeaders([rawHeaders]);
        if (
          // Pass raw type verbatim
          ArrayBuffer.isView(body) || body instanceof ArrayBuffer || body instanceof DataView || typeof body === "string" && // Preserve legacy string encoding behavior for now
          headers.values.has("content-type") || // `Blob` is superset of `File`
          globalThis.Blob && body instanceof globalThis.Blob || // `FormData` -> `multipart/form-data`
          body instanceof FormData || // `URLSearchParams` -> `application/x-www-form-urlencoded`
          body instanceof URLSearchParams || // Send chunked stream (each chunk has own `length`)
          globalThis.ReadableStream && body instanceof globalThis.ReadableStream
        ) {
          return { bodyHeaders: void 0, body };
        } else if (typeof body === "object" && (Symbol.asyncIterator in body || Symbol.iterator in body && "next" in body && typeof body.next === "function")) {
          return { bodyHeaders: void 0, body: ReadableStreamFrom(body) };
        } else if (typeof body === "object" && headers.values.get("content-type") === "application/x-www-form-urlencoded") {
          return {
            bodyHeaders: { "content-type": "application/x-www-form-urlencoded" },
            body: this.stringifyQuery(body)
          };
        } else {
          return __classPrivateFieldGet(this, _BaseAnthropic_encoder, "f").call(this, { body, headers });
        }
      }
    };
    _a = BaseAnthropic, _BaseAnthropic_encoder = /* @__PURE__ */ new WeakMap(), _BaseAnthropic_instances = /* @__PURE__ */ new WeakSet(), _BaseAnthropic_baseURLOverridden = function _BaseAnthropic_baseURLOverridden2() {
      return this.baseURL !== "https://api.anthropic.com";
    };
    BaseAnthropic.Anthropic = _a;
    BaseAnthropic.HUMAN_PROMPT = HUMAN_PROMPT;
    BaseAnthropic.AI_PROMPT = AI_PROMPT;
    BaseAnthropic.DEFAULT_TIMEOUT = 6e5;
    BaseAnthropic.AnthropicError = AnthropicError;
    BaseAnthropic.APIError = APIError;
    BaseAnthropic.APIConnectionError = APIConnectionError;
    BaseAnthropic.APIConnectionTimeoutError = APIConnectionTimeoutError;
    BaseAnthropic.APIUserAbortError = APIUserAbortError;
    BaseAnthropic.NotFoundError = NotFoundError;
    BaseAnthropic.ConflictError = ConflictError;
    BaseAnthropic.RateLimitError = RateLimitError;
    BaseAnthropic.BadRequestError = BadRequestError;
    BaseAnthropic.AuthenticationError = AuthenticationError;
    BaseAnthropic.InternalServerError = InternalServerError;
    BaseAnthropic.PermissionDeniedError = PermissionDeniedError;
    BaseAnthropic.UnprocessableEntityError = UnprocessableEntityError;
    BaseAnthropic.toFile = toFile;
    Anthropic = class extends BaseAnthropic {
      constructor() {
        super(...arguments);
        this.completions = new Completions(this);
        this.messages = new Messages2(this);
        this.models = new Models2(this);
        this.files = new Files2(this);
        this.skills = new Skills2(this);
        this.beta = new Beta(this);
      }
    };
    Anthropic.Completions = Completions;
    Anthropic.Messages = Messages2;
    Anthropic.Models = Models2;
    Anthropic.Files = Files2;
    Anthropic.Skills = Skills2;
    Anthropic.Beta = Beta;
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/middleware.mjs
function stripFallbackBlocks(body) {
  const messages = body.messages.flatMap((message) => {
    if (!Array.isArray(message.content))
      return [message];
    const content = message.content.filter((block) => block.type !== "fallback");
    if (content.length === message.content.length)
      return [message];
    return content.length > 0 ? [{ ...message, content }] : [];
  });
  return { ...body, messages };
}
function applyFallbackPatch(body, entry) {
  const patched = { ...body };
  for (const [key, value] of Object.entries(entry)) {
    if (key === "output_config" && value != null) {
      const merged = { ...patched[key] ?? {} };
      for (const [subKey, subValue] of Object.entries(value)) {
        patchField(merged, subKey, subValue);
      }
      patchField(patched, key, Object.keys(merged).length ? merged : null);
    } else {
      patchField(patched, key, value);
    }
  }
  return patched;
}
function patchField(target, key, value) {
  if (value === void 0)
    return;
  if (value === null) {
    delete target[key];
  } else {
    target[key] = value;
  }
}
function betaRefusalFallbackMiddleware(fallbacks, options = {}) {
  let warnedMissingState = false;
  return async (request, next, ctx) => {
    const [path4, query] = (ctx.options?.path ?? "").split("?");
    if (fallbacks.length === 0 || ctx.options?.method !== "post" || path4 !== "/v1/messages" || new URLSearchParams(query).get("beta") !== "true" || typeof ctx.options.body !== "object" || ctx.options.body == null) {
      return next(request);
    }
    if (ctx.options.body.fallbacks != null) {
      throw new AnthropicError("Sending the `fallbacks:` request param is not supported when using the `betaRefusalFallbackMiddleware`. You should either remove the middleware and send `fallbacks:` with the `server-side-fallback-2026-07-01` beta header to let the API handle refusal fallbacks, or omit the `fallbacks:` param if you'd like `betaRefusalFallbackMiddleware` to handle fallbacks on the client side.");
    }
    const onError = options.onError ?? ((error) => ctx.logger.error(`anthropic-sdk: betaRefusalFallbackMiddleware: ${error.message}`));
    request = withMiddlewareHeaders(request, options.betas ?? DEFAULT_BETAS);
    const body = stripFallbackBlocks(ctx.options.body);
    const state = ctx.options.fallbackState;
    const startIndex = state?.index ?? -1;
    if (!Number.isInteger(startIndex) || startIndex < -1 || startIndex >= fallbacks.length) {
      throw new AnthropicError(`fallbackState.index ${startIndex} is out of bounds for a chain of ${fallbacks.length} fallback(s); was the state shared with a different middleware?`);
    }
    const pin = (index2) => {
      if (state) {
        state.index = index2;
      } else if (!warnedMissingState) {
        warnedMissingState = true;
        ctx.logger.warn("anthropic-sdk: betaRefusalFallbackMiddleware fell back without a `fallbackState` request option; follow-up requests will retry models that already refused. Pass a shared `{ fallbackState: new BetaFallbackState() }` to pin them to the accepted model.");
      }
    };
    const initialBody = startIndex === -1 ? body : applyFallbackPatch(body, fallbacks[startIndex]);
    const initialRequest = typeof request.body !== "string" ? request : { ...request, body: JSON.stringify(initialBody) };
    const response = await next(initialRequest);
    if (!response.ok) {
      return response;
    }
    if (ctx.options.stream === true) {
      const firstHop = startIndex + 1;
      if (firstHop >= fallbacks.length || typeof initialRequest.body !== "string") {
        return response;
      }
      return spliceFallbackStream({
        request: initialRequest,
        response,
        next,
        ctx,
        fallbacks,
        firstHop,
        onError,
        pin
      });
    }
    let index = startIndex;
    let res = response;
    let requestedModel = initialBody.model;
    const fallbackBlocks = [];
    while (index < fallbacks.length - 1) {
      const message = await ctx.parse(res);
      if (message?.type !== "message" || message.stop_reason !== "refusal") {
        break;
      }
      index += 1;
      pin(index);
      const entry = fallbacks[index];
      fallbackBlocks.push({
        type: "fallback",
        // `requestedModel` is always set for a typed body; the `??` defends
        // against an untyped body that carried no `model` field.
        from: { model: requestedModel ?? message.model },
        to: { model: entry.model },
        trigger: { type: "refusal", category: message.stop_details?.category ?? null }
      });
      requestedModel = entry.model;
      res = await next({
        ...request,
        body: JSON.stringify({
          ...applyFallbackPatch(body, entry),
          ...message.stop_details?.fallback_credit_token ? { fallback_credit_token: creditTokenParam(message.stop_details.fallback_credit_token) } : void 0
        })
      });
    }
    if (fallbackBlocks.length === 0) {
      return res;
    }
    const served = await ctx.parse(res);
    if (served?.type !== "message" || served.stop_reason === "refusal" || !Array.isArray(served.content)) {
      return res;
    }
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(JSON.stringify({ ...served, content: [...fallbackBlocks, ...served.content] }), {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  };
}
function spliceFallbackStream(args) {
  const controller = new AbortController();
  const signal = args.request.signal;
  if (signal?.aborted) {
    controller.abort(signal.reason);
  } else {
    signal?.addEventListener("abort", makeAbort(controller, signal), { once: true });
  }
  const iter = splicedEvents(args, controller);
  const body = new ReadableStream({
    async pull(ctrl) {
      try {
        const { value, done } = await iter.next();
        if (done)
          return ctrl.close();
        ctrl.enqueue(value);
      } catch (err) {
        ctrl.error(err);
      }
    },
    async cancel() {
      controller.abort();
      await iter.return?.(void 0);
    }
  });
  return new Response(body, args.response);
}
async function* splicedEvents({ request, response, next, ctx, fallbacks, firstHop, onError, pin }, controller) {
  const a = yield* consumeHop({
    response,
    controller,
    indexBase: 0,
    hasNext: true,
    // the caller guarantees firstHop < fallbacks.length
    onError,
    splice: null
  });
  if (!a.refused)
    return;
  let nextIndex = a.nextIndex;
  let token = a.refused.token;
  let base = [];
  let partial = a.refused.hasPrefillClaim ? toPrefillBlocks(a.blocks) : [];
  let fromModel = a.model ?? "";
  let lastUsage = a.refused.usage;
  let refusalDetails = a.refused.stopDetails;
  let refusalInputTransformations = a.refused.inputTransformations;
  const iterations = [
    toIterationUsage("message", a.model ?? "", a.refused.usage)
  ];
  for (let hop = firstHop; hop < fallbacks.length; hop++) {
    const model = fallbacks[hop].model;
    const hasNext = hop + 1 < fallbacks.length;
    pin(hop);
    const fbIndex = nextIndex++;
    yield emit("content_block_start", {
      type: "content_block_start",
      index: fbIndex,
      content_block: {
        type: "fallback",
        from: { model: fromModel },
        to: { model },
        trigger: { type: "refusal", category: refusalDetails?.category ?? null }
      }
    });
    yield emit("content_block_stop", {
      type: "content_block_stop",
      index: fbIndex
    });
    let continuation = [...base, ...partial];
    let resB = null;
    let failure = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const reqB = buildFallbackRequest(request, { model, creditToken: token, continuation });
      reqB.signal = controller.signal;
      try {
        resB = await next(reqB);
      } catch (err) {
        if (isAbortError(err))
          throw err;
        failure = {
          kind: "request_failed",
          message: `fallback request failed: ${err}`,
          model,
          status: null,
          detail: err
        };
        break;
      }
      if (resB.ok)
        break;
      const errBody = await ctx.parse(resB).catch(() => null);
      if (attempt === 0 && resB.status === 400 && partial.length) {
        ctx.logger.warn(`anthropic-sdk: betaRefusalFallbackMiddleware: fallback request with the partial output appended was rejected (HTTP 400: ${JSON.stringify(errBody)}); retrying without it`);
        continuation = base;
        resB = null;
        continue;
      }
      failure = {
        kind: "request_failed",
        message: `fallback request failed: HTTP ${resB.status}: ${JSON.stringify(errBody)}`,
        model,
        status: resB.status,
        detail: errBody
      };
      break;
    }
    if (failure) {
      onError(failure);
      if (hasNext)
        continue;
      const stopDetails = {
        ...refusalDetails,
        recommended_model: model
      };
      yield emit("message_delta", {
        type: "message_delta",
        context_management: null,
        delta: {
          stop_reason: "refusal",
          stop_sequence: null,
          container: null,
          stop_details: stopDetails
        },
        usage: lastUsage ?? {},
        ...refusalInputTransformations !== void 0 && {
          input_transformations: refusalInputTransformations
        }
      });
      yield emit("message_stop", { type: "message_stop" });
      return;
    }
    const b = yield* consumeHop({
      response: resB,
      controller,
      indexBase: nextIndex,
      hasNext,
      onError,
      splice: { iterations, model }
    });
    if (!b.refused)
      return;
    token = b.refused.token;
    refusalDetails = b.refused.stopDetails;
    refusalInputTransformations = b.refused.inputTransformations;
    base = continuation;
    partial = b.refused.hasPrefillClaim ? toPrefillBlocks(b.blocks) : [];
    iterations.push(toIterationUsage("message", model, b.refused.usage));
    lastUsage = b.refused.usage;
    fromModel = model;
    nextIndex = b.nextIndex;
  }
}
async function* consumeHop(args) {
  const { response, controller, indexBase, hasNext, onError, splice } = args;
  const tracker = new BlockTracker(indexBase);
  let model;
  let startUsage = null;
  let startInputTransformations;
  for await (const sse of Stream.rawEvents(response, controller)) {
    const p = safeJSON(sse.data);
    switch (p?.type) {
      case "message_start": {
        model = p.message.model;
        startUsage = p.message.usage;
        if ("input_transformations" in p.message)
          startInputTransformations = p.message.input_transformations;
        if (splice)
          continue;
        break;
      }
      case "content_block_start": {
        tracker.start(p);
        if (splice) {
          yield emit(p.type, p);
          continue;
        }
        break;
      }
      case "content_block_delta": {
        tracker.delta(p);
        if (splice) {
          yield emit(p.type, p);
          continue;
        }
        break;
      }
      case "content_block_stop": {
        tracker.stop(p);
        if (splice) {
          yield emit(p.type, p);
          continue;
        }
        break;
      }
      case "message_delta": {
        if (p.delta.stop_reason === "refusal") {
          const details = p.delta.stop_details?.type === "refusal" ? p.delta.stop_details : null;
          if (details?.fallback_credit_token && hasNext) {
            const usage = backfill(p.usage, startUsage);
            yield* tracker.closeOpenBlocks();
            return {
              refused: {
                token: details.fallback_credit_token,
                hasPrefillClaim: details.fallback_has_prefill_claim === true,
                usage,
                stopDetails: details,
                inputTransformations: splice ? startInputTransformations : void 0
              },
              model,
              blocks: tracker.contentBlocks(),
              nextIndex: tracker.nextIndex
            };
          }
          if (!details?.fallback_credit_token) {
            onError({
              kind: "no_credit_token",
              message: "refusal stop_details has no fallback_credit_token",
              event: p
            });
          } else {
            onError({
              kind: "chain_exhausted",
              message: "refusal but no fallback entries remain",
              event: p
            });
          }
        }
        if (splice) {
          const usage = backfill(p.usage, startUsage);
          usage.iterations = [
            ...splice.iterations,
            toIterationUsage("fallback_message", splice.model, usage)
          ];
          p.usage = usage;
          if (!("input_transformations" in p) && startInputTransformations !== void 0) {
            p.input_transformations = startInputTransformations;
          }
          yield emit("message_delta", p);
          continue;
        }
        break;
      }
    }
    yield passthroughSSE(sse);
  }
  return { refused: null, model, blocks: tracker.contentBlocks(), nextIndex: tracker.nextIndex };
}
function creditTokenParam(token) {
  return { token, mode: "best_effort" };
}
function buildFallbackRequest(orig, { model, creditToken, continuation }) {
  const body = JSON.parse(orig.body);
  body.model = model;
  body.fallback_credit_token = creditTokenParam(creditToken);
  if (continuation.length) {
    body.messages = [...body.messages, { role: "assistant", content: continuation }];
  }
  return { ...orig, headers: new Headers(orig.headers), body: JSON.stringify(body) };
}
function applyDelta(blocks, index, delta) {
  const block = blocks.find((x) => x.index === index)?.block;
  if (!block)
    return;
  switch (delta.type) {
    case "text_delta": {
      block.text = (block.text ?? "") + delta.text;
      break;
    }
    case "input_json_delta": {
      block._partial_json = (block._partial_json ?? "") + delta.partial_json;
      break;
    }
    case "citations_delta":
      (block.citations ?? (block.citations = [])).push(delta.citation);
      break;
    case "thinking_delta": {
      block.thinking = (block.thinking ?? "") + delta.thinking;
      break;
    }
    case "signature_delta": {
      block.signature = delta.signature;
      break;
    }
    case "compaction_delta": {
      break;
    }
    default:
      /* @__PURE__ */ ((_) => {
      })(delta);
  }
}
function toPrefillBlocks(responseBlocks) {
  return responseBlocks.map((b) => {
    if (typeof b?._partial_json !== "string")
      return b;
    const { _partial_json, ...block } = b;
    return { ...block, input: safeJSON(_partial_json) ?? block.input };
  });
}
function withMiddlewareHeaders(request, betas) {
  const headers = new Headers(request.headers);
  const existing = new Set(headers.get("anthropic-beta")?.split(",").map((s) => s.trim()));
  for (const beta of betas) {
    if (!existing.has(beta)) {
      headers.append("anthropic-beta", beta);
      existing.add(beta);
    }
  }
  headers.set(STAINLESS_HELPER_HEADER, appendHeaderValue(headers.get(STAINLESS_HELPER_HEADER), "fallback-refusal-middleware"));
  return { ...request, headers };
}
function emit(event, payload) {
  const sse = { event, data: JSON.stringify(payload), raw: [] };
  return encoder.encode(serializeSSE(sse));
}
function passthroughSSE(sse) {
  return encoder.encode(sse.raw.length ? sse.raw.join("\n") + "\n\n" : serializeSSE(sse));
}
function toIterationUsage(type, model, u) {
  return {
    type,
    model,
    input_tokens: u?.input_tokens ?? 0,
    output_tokens: u?.output_tokens ?? 0,
    cache_read_input_tokens: u?.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: u?.cache_creation_input_tokens ?? 0,
    cache_creation: u?.cache_creation ?? null
  };
}
function backfill(primary, fallback) {
  const out = { ...fallback ?? {}, ...primary ?? {} };
  for (const k of Object.keys(out)) {
    if (out[k] == null && fallback?.[k] != null)
      out[k] = fallback[k];
  }
  return out;
}
function serializeSSE(sse) {
  let out = "";
  if (sse.event !== null)
    out += `event: ${sse.event}
`;
  for (const line of sse.data.split("\n"))
    out += `data: ${line}
`;
  return out + "\n";
}
function makeAbort(controller, signal) {
  return () => controller.abort(signal.reason);
}
var encoder, DEFAULT_BETAS, BlockTracker;
var init_middleware2 = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/lib/middleware.mjs"() {
    init_error();
    init_streaming();
    init_errors();
    init_headers();
    init_stainless_helper_header();
    init_values();
    init_request_options();
    encoder = new TextEncoder();
    DEFAULT_BETAS = ["fallback-credit-2026-07-01"];
    BlockTracker = class {
      constructor(indexBase = 0) {
        this.indexBase = indexBase;
        this.blocks = [];
        this.open = [];
        this.nextIndex = indexBase;
      }
      /** The accumulated content blocks, in start order. */
      contentBlocks() {
        return this.blocks.map((b) => b.block);
      }
      /** Track a content_block_start, shifting `event.index`. */
      start(event) {
        this.blocks.push({ index: event.index, block: { ...event.content_block } });
        event.index += this.indexBase;
        this.open.push(event.index);
        this.nextIndex = Math.max(this.nextIndex, event.index + 1);
      }
      /** Apply a content_block_delta to its accumulating block, shifting `event.index`. */
      delta(event) {
        applyDelta(this.blocks, event.index, event.delta);
        event.index += this.indexBase;
      }
      /** Track a content_block_stop, shifting `event.index`. */
      stop(event) {
        event.index += this.indexBase;
        const i = this.open.indexOf(event.index);
        if (i !== -1)
          this.open.splice(i, 1);
        this.nextIndex = Math.max(this.nextIndex, event.index + 1);
      }
      /** content_block_stop events for any blocks still open. */
      *closeOpenBlocks() {
        for (const index of this.open) {
          yield emit("content_block_stop", {
            type: "content_block_stop",
            index
          });
        }
        this.open.length = 0;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/index.mjs
var init_index = __esm({
  ".harness/node_modules/.pnpm/@anthropic-ai+sdk@0.123.0_zod@4.4.3/node_modules/@anthropic-ai/sdk/index.mjs"() {
    init_client();
    init_uploads2();
    init_api_promise();
    init_middleware2();
    init_client();
    init_pagination();
    init_error();
  }
});
init_index();
export {
  AI_PROMPT,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIPromise,
  APIUserAbortError,
  Anthropic,
  AnthropicError,
  AuthenticationError,
  BadRequestError,
  BaseAnthropic,
  BetaFallbackState,
  ConflictError,
  HUMAN_PROMPT,
  InternalServerError,
  NotFoundError,
  PagePromise,
  PermissionDeniedError,
  RateLimitError,
  RetryableError,
  UnprocessableEntityError,
  betaRefusalFallbackMiddleware,
  Anthropic as default,
  toFile
};
