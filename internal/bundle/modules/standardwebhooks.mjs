import * as __req0 from "@stablelib/base64";
(globalThis.__nodeRegistry ??= {})["@stablelib/base64"] = __req0.default ?? __req0;
import * as __req1 from "fast-sha256";
(globalThis.__nodeRegistry ??= {})["fast-sha256"] = __req1.default ?? __req1;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// .harness/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/timing_safe_equal.js
var require_timing_safe_equal = __commonJS({
  ".harness/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/timing_safe_equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.timingSafeEqual = timingSafeEqual;
    function assert(expr, msg = "") {
      if (!expr) {
        throw new Error(msg);
      }
    }
    function timingSafeEqual(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      if (!(a instanceof DataView)) {
        a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
      }
      if (!(b instanceof DataView)) {
        b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
      }
      assert(a instanceof DataView);
      assert(b instanceof DataView);
      const length = a.byteLength;
      let out = 0;
      let i = -1;
      while (++i < length) {
        out |= a.getUint8(i) ^ b.getUint8(i);
      }
      return out === 0;
    }
  }
});

// .harness/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js
var require_index = __commonJS({
  ".harness/node_modules/.pnpm/standardwebhooks@1.1.1/node_modules/standardwebhooks/dist/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Webhook = exports.WebhookVerificationError = void 0;
    var base64 = __require("@stablelib/base64");
    var sha256 = __require("fast-sha256");
    var timing_safe_equal_1 = require_timing_safe_equal();
    var WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
    var ExtendableError = class _ExtendableError extends Error {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _ExtendableError.prototype);
        this.name = "ExtendableError";
        this.stack = new Error(message).stack;
      }
    };
    var WebhookVerificationError = class _WebhookVerificationError extends ExtendableError {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, _WebhookVerificationError.prototype);
        this.name = "WebhookVerificationError";
      }
    };
    exports.WebhookVerificationError = WebhookVerificationError;
    var Webhook = class _Webhook {
      constructor(secret, options) {
        if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
          if (secret instanceof Uint8Array) {
            this.key = secret;
          } else {
            this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
          }
        } else {
          if (typeof secret !== "string") {
            throw new Error("Expected secret to be of type string");
          }
          if (secret.startsWith(_Webhook.prefix)) {
            secret = secret.substring(_Webhook.prefix.length);
          }
          this.key = base64.decode(secret);
        }
        if (this.key.length === 0) {
          throw new Error("Secret can't be empty.");
        }
      }
      verify(payload, headers, options) {
        var _a;
        const jsonParse = (_a = options === null || options === void 0 ? void 0 : options.jsonParse) !== null && _a !== void 0 ? _a : true;
        const normalizedHeaders = {};
        for (const key of Object.keys(headers)) {
          normalizedHeaders[key.toLowerCase()] = headers[key];
        }
        const msgId = normalizedHeaders["webhook-id"];
        const msgSignature = normalizedHeaders["webhook-signature"];
        const msgTimestamp = normalizedHeaders["webhook-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
          throw new WebhookVerificationError("Missing required headers");
        }
        const timestamp = this.verifyTimestamp(msgTimestamp);
        const computedSignature = this.sign(msgId, timestamp, payload);
        const expectedSignature = computedSignature.split(",")[1];
        const passedSignatures = msgSignature.split(" ");
        const encoder = new globalThis.TextEncoder();
        for (const versionedSignature of passedSignatures) {
          const [version, signature] = versionedSignature.split(",");
          if (version !== "v1") {
            continue;
          }
          if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
            const payloadString = payload.toString();
            if (payloadString === "") {
              return void 0;
            }
            if (jsonParse) {
              return JSON.parse(payloadString);
            } else {
              return void 0;
            }
          }
        }
        throw new WebhookVerificationError("No matching signature found");
      }
      sign(msgId, timestamp, payload) {
        if (typeof payload === "string") {
        } else if (payload.constructor.name === "Buffer") {
          payload = payload.toString();
        } else {
          throw new Error("Expected payload to be of type string or Buffer.");
        }
        const encoder = new TextEncoder();
        const timestampNumber = Math.floor(timestamp.getTime() / 1e3);
        const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
        const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
        return `v1,${expectedSignature}`;
      }
      verifyTimestamp(timestampHeader) {
        const now = Math.floor(Date.now() / 1e3);
        const timestamp = parseInt(timestampHeader, 10);
        if (Number.isNaN(timestamp)) {
          throw new WebhookVerificationError("Invalid Signature Headers");
        }
        if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too old");
        }
        if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
          throw new WebhookVerificationError("Message timestamp too new");
        }
        return new Date(timestamp * 1e3);
      }
    };
    exports.Webhook = Webhook;
    Webhook.prefix = "whsec_";
  }
});
const __cjs = require_index();
export default __cjs;
export const Webhook = __cjs?.Webhook;

