var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name15, symbol) => (symbol = Symbol[name15]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name15);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name15 in all)
    __defProp(target, name15, { get: all[name15], enumerable: true });
};
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name15, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name15, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name15, decorators, target, extra2) => {
  var fn, it, done, ctx, access2, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name15]() {
    return __privateGet(this, extra2);
  }, set [name15](x) {
    return __privateSet(this, extra2, x);
  } }, name15));
  k ? p && k < 4 && __name(extra2, (k > 2 ? "set " : k > 1 ? "get " : "") + name15) : __name(target, name15);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name15, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access2 = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name15 in x };
      if (k ^ 3) access2.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra2 : desc.get) : (x) => x[name15];
      if (k > 2) access2.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra2 : desc.set) : (x, y) => x[name15] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra2 : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra2 = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name15, desc), p ? k ^ 4 ? extra2 : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __using = (stack, value, async) => {
  if (value != null) {
    if (typeof value !== "object" && typeof value !== "function") __typeError("Object expected");
    var dispose, inner;
    if (async) dispose = value[__knownSymbol("asyncDispose")];
    if (dispose === void 0) {
      dispose = value[__knownSymbol("dispose")];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") __typeError("Object not disposable");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    stack.push([async, dispose, value]);
  } else if (async) {
    stack.push([async]);
  }
  return value;
};
var __callDispose = (stack, error, hasError) => {
  var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
    return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
  };
  var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
  var next = (it) => {
    while (it = stack.pop()) {
      try {
        var result = it[1] && it[1].call(it[2]);
        if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
      } catch (e) {
        fail(e);
      }
    }
    if (hasError) throw error;
  };
  return next();
};

// ../../source/deepseek-harness/vendor/cosmokit/src/misc.ts
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) {
    if (forced || source[key] !== void 0) result[key] = source[key];
  }
  return result;
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, { writable: true, value, enumerable: false });
}

// ../../source/deepseek-harness/vendor/cosmokit/src/types.ts
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
((Binary2) => {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) {
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    } else {
      return source;
    }
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") {
      return Buffer.from(source).toString("base64");
    }
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) {
      buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    }
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) {
      descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    }
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  if (a === b) return true;
  if (!strict && isNullable(a) && isNullable(b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (!a || !b) return false;
  function check(test, then) {
    return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
  }
  return check(Array.isArray, (a2, b2) => a2.length === b2.length && a2.every((item, index) => deepEqual(item, b2[index]))) ?? check(is("Date"), (a2, b2) => a2.valueOf() === b2.valueOf()) ?? check(is("RegExp"), (a2, b2) => a2.source === b2.source && a2.flags === b2.flags) ?? check(isArrayBufferLike, (a2, b2) => {
    if (a2.byteLength !== b2.byteLength) return false;
    const viewA = new Uint8Array(a2);
    const viewB = new Uint8Array(b2);
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false;
    }
    return true;
  }) ?? Object.keys({ ...a, ...b }).every((key) => deepEqual(a[key], b[key], strict));
}

// ../../source/deepseek-harness/vendor/cosmokit/src/string.ts
function tokenize(source, delimiters, delimiter) {
  const output = [];
  let state = 0 /* DELIM */;
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      if (state === 1 /* UPPER */) {
        const next = source.charCodeAt(i + 1);
        if (next >= 97 && next <= 122) {
          output.push(delimiter);
        }
        output.push(code + 32);
      } else {
        if (state !== 0 /* DELIM */) {
          output.push(delimiter);
        }
        output.push(code + 32);
      }
      state = 1 /* UPPER */;
    } else if (code >= 97 && code <= 122) {
      output.push(code);
      state = 2 /* LOWER */;
    } else if (delimiters.includes(code)) {
      if (state !== 0 /* DELIM */) {
        output.push(delimiter);
      }
      state = 0 /* DELIM */;
    } else {
      output.push(code);
    }
  }
  return String.fromCharCode(...output);
}
function paramCase(source) {
  return tokenize(source, [45, 95], 45);
}
var hyphenate = paramCase;

// ../../source/deepseek-harness/vendor/cosmokit/src/time.ts
var Time;
((Time2) => {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date2 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date2 === "number") date2 = new Date(date2);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date2.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date2 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date2 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date2) {
    const parsed = parseTime(date2);
    if (parsed) {
      date2 = Date.now() + parsed;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) {
      date2 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date2}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) {
      date2 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date2}`;
    }
    return date2 ? new Date(date2) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) {
      return Math.round(ms / Time2.day) + "d";
    } else if (abs >= Time2.hour - Time2.minute / 2) {
      return Math.round(ms / Time2.hour) + "h";
    } else if (abs >= Time2.minute - Time2.second / 2) {
      return Math.round(ms / Time2.minute) + "m";
    } else if (abs >= Time2.second) {
      return Math.round(ms / Time2.second) + "s";
    }
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// ../../source/deepseek-harness/vendor/cordis/src/utils.ts
var DisposableList = class {
  sn = 0;
  map = /* @__PURE__ */ new Map();
  weak = /* @__PURE__ */ new WeakMap();
  get length() {
    return this.map.size;
  }
  push(value) {
    const sn = ++this.sn;
    this.map.set(sn, value);
    this.weak.set(value, sn);
    return () => this.map.delete(sn);
  }
  delete(value) {
    const sn = this.weak.get(value);
    if (!sn) return false;
    return this.map.delete(sn);
  }
  clear() {
    const values = [...this.map.values()];
    this.map.clear();
    return values.reverse();
  }
  [Symbol.iterator]() {
    return this.map.values();
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this];
  }
};
var symbols = {
  // internal symbols
  shadow: /* @__PURE__ */ Symbol.for("cordis.shadow"),
  receiver: /* @__PURE__ */ Symbol.for("cordis.receiver"),
  original: /* @__PURE__ */ Symbol.for("cordis.original"),
  metadata: /* @__PURE__ */ Symbol.for("cordis.metadata"),
  initHooks: /* @__PURE__ */ Symbol.for("cordis.initHooks"),
  checkProto: /* @__PURE__ */ Symbol.for("cordis.checkProto"),
  // context symbols
  effect: /* @__PURE__ */ Symbol.for("cordis.effect"),
  filter: /* @__PURE__ */ Symbol.for("cordis.filter"),
  isolate: /* @__PURE__ */ Symbol.for("cordis.isolate"),
  intercept: /* @__PURE__ */ Symbol.for("cordis.intercept"),
  // service symbols
  init: /* @__PURE__ */ Symbol.for("cordis.init"),
  check: /* @__PURE__ */ Symbol.for("cordis.check"),
  config: /* @__PURE__ */ Symbol.for("cordis.config"),
  invoke: /* @__PURE__ */ Symbol.for("cordis.invoke"),
  extend: /* @__PURE__ */ Symbol.for("cordis.extend"),
  tracker: /* @__PURE__ */ Symbol.for("cordis.tracker"),
  resolveConfig: /* @__PURE__ */ Symbol.for("cordis.resolveConfig")
};
var GeneratorFunction = function* () {
}.constructor;
var AsyncGeneratorFunction = async function* () {
}.constructor;
function isConstructor(func) {
  if (!func.prototype) return false;
  if (func instanceof GeneratorFunction) return false;
  if (AsyncGeneratorFunction !== Function && func instanceof AsyncGeneratorFunction) return false;
  return true;
}
function joinPrototype(proto1, proto2) {
  if (proto1 === Object.prototype) return proto2;
  const result = Object.create(joinPrototype(Object.getPrototypeOf(proto1), proto2));
  for (const key of Reflect.ownKeys(proto1)) {
    Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(proto1, key));
  }
  return result;
}
function isObject(value) {
  return value && (typeof value === "object" || typeof value === "function");
}
function getPropertyDescriptor(target, prop) {
  let proto = target;
  while (proto) {
    const desc = Reflect.getOwnPropertyDescriptor(proto, prop);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }
}
function getTraceable(ctx, value) {
  if (!isObject(value)) return value;
  if (Object.hasOwn(value, symbols.shadow)) {
    return Object.getPrototypeOf(value);
  }
  const tracker = value[symbols.tracker];
  if (!tracker) return value;
  return createTraceable(ctx, value, tracker);
}
function withProps(target, props) {
  if (!props) return target;
  return new Proxy(target, {
    get: (target2, prop, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.get(props, prop, receiver);
      return Reflect.get(target2, prop, receiver);
    },
    set: (target2, prop, value, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.set(props, prop, value, receiver);
      return Reflect.set(target2, prop, value, receiver);
    }
  });
}
function withProp(target, prop, value) {
  return withProps(target, Object.defineProperty(/* @__PURE__ */ Object.create(null), prop, {
    value,
    writable: false
  }));
}
function createShadow(ctx, target, property2, receiver) {
  if (!property2) return receiver;
  const origin = Reflect.getOwnPropertyDescriptor(target, property2)?.value;
  if (!origin) return receiver;
  return withProp(receiver, property2, ctx.extend({ [symbols.shadow]: origin }));
}
function createShadowMethod(ctx, value, outer, shadow) {
  return new Proxy(value, {
    apply: (target, thisArg, args) => {
      if (thisArg === outer) thisArg = shadow;
      return getTraceable(ctx, Reflect.apply(target, thisArg, args));
    }
  });
}
function createTraceable(ctx, value, tracker) {
  if (ctx[symbols.shadow] && !tracker.noShadow) {
    ctx = Object.getPrototypeOf(ctx);
  }
  const proxy = new Proxy(value, {
    get: (target, prop, receiver) => {
      if (prop === symbols.original) return target;
      if (prop === tracker.property) return ctx;
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) {
        return Reflect.get(ctx, `${tracker.associate}.${prop}`, withProp(ctx, symbols.receiver, receiver));
      }
      let shadow, innerValue;
      const desc = getPropertyDescriptor(target, prop);
      if (desc && "value" in desc) {
        innerValue = desc.value;
      } else {
        shadow = createShadow(ctx, target, tracker.property, receiver);
        innerValue = Reflect.get(target, prop, shadow);
      }
      const innerTracker = innerValue?.[symbols.tracker];
      if (innerTracker) {
        return createTraceable(ctx, innerValue, innerTracker);
      } else if (!tracker.noShadow && typeof innerValue === "function") {
        shadow ??= createShadow(ctx, target, tracker.property, receiver);
        return createShadowMethod(ctx, innerValue, receiver, shadow);
      } else {
        return innerValue;
      }
    },
    set: (target, prop, value2, receiver) => {
      if (prop === symbols.original) return false;
      if (prop === tracker.property) return false;
      if (typeof prop === "symbol") {
        return Reflect.set(target, prop, value2, receiver);
      }
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) {
        return Reflect.set(ctx, `${tracker.associate}.${prop}`, value2, withProp(ctx, symbols.receiver, receiver));
      }
      const shadow = createShadow(ctx, target, tracker.property, receiver);
      return Reflect.set(target, prop, value2, shadow);
    },
    apply: (target, thisArg, args) => {
      return applyTraceable(proxy, target, thisArg, args);
    }
  });
  return proxy;
}
function applyTraceable(proxy, value, thisArg, args) {
  if (!value[symbols.invoke]) return Reflect.apply(value, thisArg, args);
  return value[symbols.invoke].apply(proxy, args);
}
function createCallable(name15, proto, tracker) {
  const self = function(...args) {
    const proxy = createTraceable(self["ctx"], self, tracker);
    return applyTraceable(proxy, self, this, args);
  };
  defineProperty(self, "name", name15);
  return Object.setPrototypeOf(self, proto);
}
function handleError(info, reason, getOuterStack) {
  const innerLines = info.error.stack.split("\n");
  if (typeof reason?.stack !== "string") {
    const outerError = new Error(reason);
    const lines2 = outerError.stack.split("\n");
    lines2.splice(1, Infinity, ...getOuterStack());
    outerError.stack = lines2.join("\n");
    throw outerError;
  }
  const lines = reason.stack.split("\n");
  let index = lines.indexOf(innerLines[2]);
  if (index === -1) throw reason;
  index -= info.offset;
  while (index > 0) {
    if (!lines[index - 1].endsWith(" (<anonymous>)")) break;
    index -= 1;
  }
  lines.splice(index, Infinity, ...getOuterStack());
  reason.stack = lines.join("\n");
  throw reason;
}
function composeError(callback, getOuterStack = buildOuterStack()) {
  const info = { offset: 1, error: new Error() };
  try {
    const result = callback(info);
    if (isObject(result) && "then" in result) {
      return result.then(void 0, (reason) => handleError(info, reason, getOuterStack));
    } else {
      return result;
    }
  } catch (reason) {
    handleError(info, reason, getOuterStack);
  }
}
function buildOuterStack(offset = 0) {
  const outerError = new Error();
  return () => outerError.stack.split("\n").slice(3 + offset);
}

// ../../source/deepseek-harness/vendor/cordis/src/events.ts
function isBailed(value) {
  return value !== null && value !== false && value !== void 0;
}
var EventsService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.on("internal/listener", function(name15, listener, options) {
      if (name15 === "internal/update" && !options.global) {
        const hooks = this.fiber._hooks["internal/update"] ??= new DisposableList();
        const method = options.prepend ? "unshift" : "push";
        return hooks[method](listener);
      }
    });
    this.on("internal/update", function(config, noSave, next) {
      const cbs = [...this._hooks["internal/update"] || []];
      const _next = () => {
        const cb = cbs.shift() ?? next;
        return cb.call(this, config, noSave, _next);
      };
      return _next();
    }, { global: true, prepend: true });
  }
  ctx;
  _hooks = {};
  /**
   * Resolve listeners for one dispatch and apply context filtering.
   *
   * @param type — the dispatch mode, reported on `internal/dispatch`.
   * @param args — the raw dispatch arguments; consumed up to the event name.
   * @returns the matching listener callbacks, bound to the dispatch `this`.
   */
  dispatch(type, args) {
    const thisArg = typeof args[0] === "object" || typeof args[0] === "function" ? args.shift() : null;
    const name15 = args.shift();
    if (!name15.startsWith("internal/")) {
      this.emit("internal/dispatch", type, name15, args, thisArg);
    }
    const filter = thisArg?.[Context.filter];
    return (this._hooks[name15] || []).filter((hook) => hook.global || !filter || filter.call(thisArg, hook.ctx)).map((hook) => hook.callback.bind(thisArg));
  }
  /**
   * Run listeners concurrently and wait for all of them.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns a promise resolving once every listener has settled.
   */
  async parallel(...args) {
    const results = await Promise.allSettled(this.dispatch("emit", args).map(async (cb) => cb(...args)));
    const errors = results.filter((result) => result.status === "rejected");
    if (errors.length) throw new AggregateError(errors.map((error) => error.reason));
  }
  /**
   * Run listeners synchronously without waiting for returned promises.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   */
  emit(...args) {
    this.dispatch("emit", args).map((cb) => cb(...args));
  }
  /**
   * Run listeners in order, awaiting each, until one returns a bail value.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns the first bail value (see {@link isBailed}), if any.
   */
  async serial(...args) {
    for (const cb of this.dispatch("serial", args)) {
      const result = await cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
   * Run listeners synchronously until one returns a bail value.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns the first bail value (see {@link isBailed}), if any.
   */
  bail(...args) {
    for (const cb of this.dispatch("bail", args)) {
      const result = cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
   * Compose listeners around the final `next` callback.
   *
   * The last dispatch argument is treated as the innermost `next`. Listeners
   * run outermost-first; a listener that does not call `next()` vetoes the
   * rest of the chain, including the built-in behavior.
   *
   * @param args — optional `this`, the event name, listener arguments, then `next`.
   * @returns the outermost listener's return value.
   */
  waterfall(...args) {
    const cbs = this.dispatch("waterfall", args);
    const inner = args.pop();
    const next = () => {
      const cb = cbs.shift() ?? inner;
      return cb(...args);
    };
    args.push(next);
    return next();
  }
  /**
   * Store a listener record as an effect on the current fiber.
   *
   * @param label — effect label shown in fiber diagnostics.
   * @param hooks — the listener list for one event.
   * @param callback — the listener to store.
   * @param options — placement and filtering options.
   * @returns a disposer that unregisters the listener.
   */
  register(label, hooks, callback, options) {
    const method = options.prepend ? "unshift" : "push";
    return this.ctx.fiber.effect(() => {
      hooks[method]({ ctx: this.ctx, callback, ...options });
      return () => this.unregister(hooks, callback);
    }, label);
  }
  /**
   * Remove a stored listener record.
   *
   * @param hooks — the listener list for one event.
   * @param callback — the listener to remove.
   * @returns `true` if the listener was found and removed.
   */
  unregister(hooks, callback) {
    const index = hooks.findIndex((hook) => hook.callback === callback);
    if (index >= 0) {
      hooks.splice(index, 1);
      return true;
    }
  }
  /**
   * Register an event listener owned by the current fiber.
   *
   * The listener is removed automatically when the fiber unloads. Throws
   * `CordisError('INACTIVE_EFFECT')` if the fiber is already disposed.
   *
   * @param name — the event name to listen for.
   * @param listener — called with the dispatch arguments.
   * @param options — listener options; a boolean is shorthand for `prepend`.
   * @returns a disposer removing the listener; `true` if it was still registered.
   */
  on(name15, listener, options) {
    if (typeof options !== "object") {
      options = { prepend: options };
    }
    this.ctx.fiber.assertActive();
    listener = this.ctx.reflect.bind(listener);
    const result = this.bail(this.ctx, "internal/listener", name15, listener, options);
    if (result) return result;
    const hooks = this._hooks[name15] ||= [];
    const label = `ctx.on(${typeof name15 === "string" ? JSON.stringify(name15) : name15.toString()})`;
    return this.register(label, hooks, listener, options);
  }
  /**
   * Register an event listener that disposes itself after the first call.
   *
   * @param name — the event name to listen for.
   * @param listener — called at most once with the dispatch arguments.
   * @param options — listener options; a boolean is shorthand for `prepend`.
   * @returns a disposer removing the listener; `true` if it was still registered.
   */
  once(name15, listener, options) {
    const dispose = this.on(name15, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, options);
    return dispose;
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/logger.ts
var defaultFormatters = {
  s: (value) => String(value),
  d: (value) => Math.trunc(Number(value)),
  i: (value) => Math.trunc(Number(value)),
  f: (value) => Number(value),
  o: (value) => JSON.stringify(value),
  O: (value) => JSON.stringify(value),
  c: () => "",
  C: (value, exporter, message) => {
    return Logger.color(exporter, Logger.code(message.name, exporter.colors), value);
  }
};
function isAggregateError(error) {
  return error instanceof Error && Array.isArray(error["errors"]);
}
var Logger = class {
  constructor(options, service) {
    this.service = service;
    Object.assign(this, options);
    this.error = this._method("error", 0 /* ERROR */);
    this.info = this._method("info", 1 /* INFO */);
    this.warn = this._method("warn", 2 /* WARN */);
    this.debug = this._method("debug", 3 /* DEBUG */);
  }
  service;
  static color(exporter, code, value, decoration = "") {
    if (!exporter.colors) return "" + value;
    return `\x1B[3${code < 8 ? code : "8;5;" + code}${exporter.colors >= 2 ? decoration : ""}m${value}\x1B[0m`;
  }
  static code(name15, level) {
    let hash = 0;
    for (let i = 0; i < name15.length; i++) {
      hash = (hash << 3) - hash + name15.charCodeAt(i) + 13;
      hash |= 0;
    }
    const colors = !level ? [] : level >= 2 ? c256 : c16;
    return colors[Math.abs(hash) % colors.length];
  }
  static format(exporter, message) {
    const args = message.args.slice();
    if (args[0] instanceof Error) {
      args[0] = args[0].stack || args[0].message;
      args.unshift("%s");
    } else if (typeof args[0] !== "string") {
      args.unshift("%o");
    }
    let format = args.shift();
    format = format.replace(/%([a-zA-Z%])/g, (match, char) => {
      if (match === "%%") return "%";
      const formatter = exporter.formatters?.[char] ?? defaultFormatters[char];
      if (typeof formatter === "function") {
        const value = args.shift();
        return formatter(value, exporter, message);
      }
      return match;
    });
    const oFormatter = exporter.formatters?.o ?? defaultFormatters.o;
    for (let arg of args) {
      if (typeof arg === "object" && arg) {
        arg = oFormatter(arg, exporter, message);
      }
      format += " " + arg;
    }
    const { maxLength = 10240 } = exporter;
    return format.split(/\r?\n/g).map((line) => {
      return line.slice(0, maxLength) + (line.length > maxLength ? "..." : "");
    }).join("\n");
  }
  _method(type, level) {
    return (...args) => {
      if (args.length === 1 && args[0] instanceof Error) {
        if (args[0].cause) {
          this[type](args[0].cause);
        } else if (isAggregateError(args[0])) {
          args[0].errors.forEach((error) => this[type](error));
          return;
        }
      }
      const sn = ++this.service._snMessage;
      const ts = Date.now();
      for (const exporter of this.service.exporters.values()) {
        const targetLevel = exporter.levels?.[this.name] ?? exporter.levels?.default ?? this.level ?? 1 /* INFO */;
        if (targetLevel < level) continue;
        const message = { sn, ts, type, level, name: this.name, ...this.meta, args };
        exporter.export(message);
      }
    };
  }
};
var c16 = [6, 2, 3, 4, 5, 1];
var c256 = [
  20,
  21,
  26,
  27,
  32,
  33,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  56,
  57,
  62,
  63,
  68,
  69,
  74,
  75,
  76,
  77,
  78,
  79,
  80,
  81,
  92,
  93,
  98,
  99,
  112,
  113,
  129,
  134,
  135,
  148,
  149,
  160,
  161,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  171,
  172,
  173,
  178,
  179,
  184,
  185,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  203,
  204,
  205,
  206,
  207,
  208,
  209,
  214,
  215,
  220,
  221
];
var LoggerService = class _LoggerService {
  bufferSize = 1e3;
  buffer = [];
  ctx;
  _snMessage = 0;
  _snExporter = 0;
  exporters = /* @__PURE__ */ new Map();
  constructor(ctx) {
    const tracker = {
      property: "ctx",
      noShadow: true
    };
    const self = createCallable("logger", joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    Object.assign(self, this);
    self.ctx = ctx;
    defineProperty(self, symbols.tracker, tracker);
    self.exporter({
      colors: 3,
      export: (message) => {
        self.buffer.push(message);
        if (self.buffer.length > self.bufferSize) {
          self.buffer = self.buffer.slice(-self.bufferSize);
        }
      }
    });
    return self;
  }
  /**
   * Register an exporter and dispose it with the current fiber.
   *
   * @param exporter — the sink that receives structured log messages.
   * @returns a disposer that removes the exporter.
   */
  exporter(exporter) {
    return this.ctx.effect(() => {
      this.exporters.set(++this._snExporter, exporter);
      return () => this.exporters.delete(this._snExporter);
    }, "ctx.logger.exporter()");
  }
  _resolveConfig() {
    let intercept = this.ctx[symbols.intercept];
    const configs = [];
    while ("logger" in intercept) {
      if (Object.hasOwn(intercept, "logger")) {
        configs.unshift(intercept["logger"]);
      }
      intercept = Object.getPrototypeOf(intercept);
    }
    return Object.assign({}, ...configs);
  }
  [symbols.invoke](name15) {
    const config = this._resolveConfig();
    const fiber = (this.ctx[symbols.shadow] ?? this.ctx).fiber;
    name15 ??= config.name;
    name15 ??= hyphenate(fiber.name);
    return new Logger({
      name: name15,
      level: config.level,
      meta: { fiber: new WeakRef(fiber) }
    }, this);
  }
  static {
    for (const type of ["error", "info", "warn", "debug"]) {
      ;
      _LoggerService.prototype[type] = function(...args) {
        return this()[type](...args);
      };
    }
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/fiber.ts
var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
var ValidationError = class extends TypeError {
  name = "ValidationError";
  /**
   * Build the aggregated message from schema issues.
   *
   * @param issues — the standard-schema issues, one message line each.
   */
  constructor(issues) {
    super(`invalid config:
` + issues.map((issue) => {
      if (issue.path) {
        return `  - ${issue.message} (at ${issue.path.join(".")})`;
      } else {
        return `  - ${issue.message}`;
      }
    }).join("\n"));
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, {
  value: true
});
function resolveConfig(runtime, config) {
  if (!runtime.Config) return config;
  const result = runtime.Config["~standard"].validate(config);
  if ("then" in result) {
    throw new TypeError("Async config validation is not supported");
  }
  if (result.issues) {
    throw new ValidationError(result.issues);
  } else {
    return result.value;
  }
}
var effectInertia = /* @__PURE__ */ new WeakMap();
function runDisposable(dispose) {
  const result = dispose();
  return effectInertia.get(dispose)?.() ?? result;
}
function emitPluginDisposed(context, fiber) {
  const args = ["internal/plugin", fiber];
  let callbacks;
  try {
    callbacks = context.events.dispatch("emit", args);
  } catch (error) {
    context.logger.error(error);
    return;
  }
  for (const callback of callbacks) {
    try {
      const returned = callback(...args);
      void Promise.resolve(returned).catch((error) => context.logger.error(error));
    } catch (error) {
      context.logger.error(error);
    }
  }
}
var CordisError = class _CordisError extends Error {
  /**
   * @param code — the stable error code; also the default message.
   * @param message — optional human-readable override.
   */
  constructor(code, message) {
    super(message ?? _CordisError.Code[code]);
    this.code = code;
  }
  code;
};
((CordisError2) => {
  CordisError2.Code = {
    INACTIVE_EFFECT: "cannot create effect on inactive context"
  };
})(CordisError || (CordisError = {}));
var INACTIVE = "__INACTIVE__";
var Fiber = class {
  /**
   * Create a fiber. Plugin authors normally obtain fibers from `ctx.plugin()`
   * rather than constructing them directly.
   *
   * @param parent — the context the plugin was loaded from.
   * @param config — raw config, validated against the runtime's schema.
   * @param inject — resolved dependency map (service name → intercept config).
   * @param runtime — the shared plugin runtime, or `null` for the root fiber.
   * @param getOuterStack — captures the caller stack for effect diagnostics.
   */
  constructor(parent, config, inject13, runtime, getOuterStack) {
    this.parent = parent;
    this.inject = inject13;
    this.runtime = runtime;
    this._config = config;
    const collect = (dispose) => {
      this._disposables.push(dispose);
    };
    if (runtime) {
      this.uid = parent.registry.counter;
      this.ctx = this.context = parent.extend({ fiber: this });
      const injectEntries = Object.entries(this.inject);
      if (injectEntries.length) {
        this.ctx[Context.intercept] = Object.create(parent[Context.intercept]);
        for (const [name15, config2] of injectEntries) {
          if (isNullable(config2)) continue;
          this.ctx[Context.intercept][name15] = config2;
        }
      }
      this._runner = {
        epoch: INACTIVE,
        getOuterStack,
        execute: function() {
          if (isConstructor(runtime.callback)) {
            const instance = new runtime.callback(this.ctx, this.config);
            for (const hook of instance?.[symbols.initHooks] ?? []) {
              hook();
            }
            return instance?.[symbols.init]?.();
          } else {
            return runtime.callback(this.ctx, this.config);
          }
        },
        collect
      };
      this.dispose = parent.fiber.effect(() => {
        const remove = runtime.fibers.push(this);
        return async () => {
          this.uid = null;
          emitPluginDisposed(this.context, this);
          if (this.ctx.registry.has(runtime.callback)) {
            remove();
            if (!runtime.fibers.length) {
              this.ctx.registry.delete(runtime.callback);
            }
          }
          this._setEpoch(INACTIVE);
          if (!this.inertia) {
            this._updateState(() => {
              this.inertia = this._unload();
              return 5 /* UNLOADING */;
            });
          }
          while (this.inertia) {
            await this.inertia;
          }
        };
      }, "ctx.plugin()");
      try {
        this.context.emit("internal/plugin", this);
      } catch (error) {
        void Promise.resolve(this.dispose()).catch((reason) => this.ctx.logger.error(reason));
        throw error;
      }
      if (this.uid !== null && parent.fiber.state !== 5 /* UNLOADING */) {
        for (const name15 of Object.keys(this.inject)) {
          this._checkImpl(name15);
        }
        this._refresh();
      }
    } else {
      this.uid = 0;
      this.ctx = this.context = parent;
      this.state = 2 /* ACTIVE */;
      this.store = /* @__PURE__ */ Object.create(null);
      this._runner = {
        epoch: "",
        getOuterStack,
        execute: () => {
        },
        collect
      };
      this.dispose = () => this.restart();
    }
  }
  parent;
  inject;
  runtime;
  /** Unique id within the registry; 0 for the root fiber, `null` once disposed. */
  uid;
  /** The context this fiber's plugin runs in (extends the parent context). */
  ctx;
  /** The validated plugin config (updated by `update()`). */
  config;
  /** The raw plugin config, re-resolved before each activation. */
  _config;
  /** Current lifecycle state; transitions emit `internal/status`. */
  state = 0 /* PENDING */;
  /** Dispose this fiber: unload the plugin, then settle once cleanup finished. */
  dispose;
  /** Snapshot of required service implementations while loaded; `undefined` otherwise. */
  store;
  /** The in-flight load/unload transition, if one is currently running. */
  inertia;
  _hooks = /* @__PURE__ */ Object.create(null);
  _disposables = new DisposableList();
  // Same as `this.ctx`, but with a more specific type.
  context;
  _error;
  _runner;
  _store = /* @__PURE__ */ Object.create(null);
  /** The plugin's display name, inherited from the nearest named ancestor, else `'root'`. */
  get name() {
    let fiber = this;
    do {
      if (fiber.runtime?.name) return fiber.runtime.name;
      fiber = fiber.parent.fiber;
    } while (fiber !== fiber.parent.fiber);
    return "root";
  }
  /**
   * Throw if the fiber has already been disposed.
   *
   * @returns nothing when the fiber is still active.
   * @throws {CordisError} `INACTIVE_EFFECT` when the fiber's uid has been cleared.
   */
  assertActive() {
    if (this.uid !== null) return;
    throw new CordisError("INACTIVE_EFFECT");
  }
  _execute(runner) {
    const oldEpoch = runner.epoch;
    return composeError((info) => {
      const safeCollect = (dispose) => {
        if (typeof dispose === "function") {
          runner.collect(dispose);
        } else if (!isNullable(dispose)) {
          throw new TypeError("Invalid effect");
        }
      };
      const effect = runner.execute.call(this);
      if (typeof effect === "function") {
        return runner.collect(effect);
      } else if (isNullable(effect)) {
      } else if (!isObject(effect)) {
        throw new TypeError("Invalid effect");
      } else if ("then" in effect) {
        return effect.then(safeCollect);
      } else if (Symbol.iterator in effect) {
        info.error = new Error();
        const iter = effect[Symbol.iterator]();
        while (true) {
          const result = iter.next();
          safeCollect(result.value);
          if (result.done) return;
        }
      } else if (Symbol.asyncIterator in effect) {
        const iter = effect[Symbol.asyncIterator]();
        return (async () => {
          await Promise.resolve();
          info.error = new Error();
          while (true) {
            if (runner.epoch !== oldEpoch) return;
            const result = await iter.next();
            safeCollect(result.value);
            if (result.done) return;
          }
        })();
      } else {
        throw new TypeError("Invalid effect");
      }
    }, runner.getOuterStack);
  }
  effect(execute, label = "anonymous") {
    this.assertActive();
    if (this.state === 5 /* UNLOADING */) {
      throw new CordisError("INACTIVE_EFFECT");
    }
    const disposables = [];
    let disposing = false;
    let disposalTask;
    const dispose = () => {
      if (disposing) return disposalTask;
      disposing = true;
      let task2;
      for (const disposable of disposables.splice(0).reverse()) {
        if (task2) {
          task2 = task2.then(() => runDisposable(disposable));
        } else {
          const result = runDisposable(disposable);
          if (isObject(result) && "then" in result) {
            task2 = result;
          }
        }
      }
      return disposalTask = task2;
    };
    const meta = { label, children: [] };
    const runner = {
      execute,
      epoch: true,
      collect: (dispose2) => {
        disposables.push(dispose2);
        this._disposables.delete(dispose2);
        if (dispose2[symbols.effect]) {
          meta.children.push(dispose2[symbols.effect]);
        }
      },
      getOuterStack: buildOuterStack()
    };
    let task;
    let executing = true;
    let resolveSetup;
    let rejectSetup;
    let setupBarrier;
    let setupFailed = false;
    let inFlight;
    let removeWrapper = () => false;
    const waitForSetup = () => {
      setupBarrier ??= new Promise((resolve5, reject2) => {
        resolveSetup = resolve5;
        rejectSetup = reject2;
      });
      return setupBarrier;
    };
    const disposeAfter = (setup) => {
      return Promise.resolve(setup).then(
        () => dispose(),
        async (reason) => {
          await dispose();
          throw reason;
        }
      );
    };
    const finalizeDisposal = (callback) => {
      let result;
      try {
        result = callback();
      } catch (error) {
        removeWrapper();
        throw error;
      }
      if (isObject(result) && "then" in result) {
        const pending = Promise.resolve(result).finally(() => {
          removeWrapper();
          if (inFlight === pending) inFlight = void 0;
        });
        return inFlight = pending;
      }
      removeWrapper();
      return result;
    };
    const wrapper = defineProperty(() => {
      if (!runner.epoch) return setupFailed ? inFlight : void 0;
      runner.epoch = false;
      return finalizeDisposal(() => {
        if (executing) return disposeAfter(waitForSetup());
        return task ? disposeAfter(task) : dispose();
      });
    }, symbols.effect, meta);
    effectInertia.set(wrapper, () => inFlight);
    removeWrapper = this._disposables.push(wrapper);
    try {
      task = this._execute(runner);
    } catch (reason) {
      executing = false;
      setupFailed = true;
      runner.epoch = false;
      let cleanup;
      try {
        cleanup = finalizeDisposal(dispose);
      } finally {
        rejectSetup?.(reason);
      }
      if (isObject(cleanup) && "then" in cleanup) {
        cleanup.catch((error) => this.ctx.logger.error(error));
      }
      throw reason;
    }
    executing = false;
    if (setupBarrier) {
      Promise.resolve(task).then(resolveSetup, rejectSetup);
    }
    task?.catch(() => {
      if (!runner.epoch) return dispose();
      return finalizeDisposal(dispose);
    }).catch((error) => this.ctx.logger.error(error));
    const disposeAsync = () => {
      if (!runner.epoch) return;
      runner.epoch = false;
      return finalizeDisposal(dispose);
    };
    wrapper.then = async (onFulfilled, onRejected) => {
      return Promise.resolve(task).then(() => disposeAsync).then(onFulfilled, onRejected);
    };
    return wrapper;
  }
  /**
   * Return metadata for currently registered effects.
   *
   * @returns one {@link EffectMeta} tree per labeled live effect.
   */
  getEffects() {
    return [...this._disposables].map((dispose) => dispose[symbols.effect]).filter(Boolean);
  }
  _getState() {
    if (this.uid === null) return 4 /* DISPOSED */;
    if (this._error) return 3 /* FAILED */;
    if (this._runner.epoch !== INACTIVE) return 2 /* ACTIVE */;
    return 0 /* PENDING */;
  }
  _updateState(callback) {
    const oldState = this.state;
    this.state = callback() ?? this._getState();
    if (oldState === this.state) return;
    this.context.emit("internal/status", this, oldState);
    if (oldState !== 2 /* ACTIVE */ && this.state !== 2 /* ACTIVE */) return;
    for (const key of Reflect.ownKeys(this.ctx.reflect.store)) {
      const impl = this.ctx.reflect.store[key];
      if (impl.fiber !== this) continue;
      this.ctx.reflect.notify([impl.name]);
    }
  }
  _checkImpl(name15) {
    const impl = this.ctx.reflect._getImpl(name15, true);
    if (!impl) return delete this._store[name15];
    try {
      if (impl.check && !impl.check.call(getTraceable(this.ctx, impl.value))) {
        return delete this._store[name15];
      }
    } catch (error) {
      impl.fiber.ctx.logger.error(error);
      return delete this._store[name15];
    }
    this._store[name15] = impl;
  }
  _refresh() {
    let epoch = false;
    epoch = "";
    for (const name15 of Object.keys(this.inject)) {
      const impl = this._store[name15];
      if (!impl) {
        epoch = INACTIVE;
        break;
      }
      epoch += ":" + impl.fiber.uid;
    }
    this._setEpoch(epoch);
  }
  _setEpoch(epoch) {
    const oldEpoch = this._runner.epoch;
    if (epoch === oldEpoch) return;
    this._runner.epoch = epoch;
    if (this.inertia) return;
    this._updateState(() => {
      if (epoch !== INACTIVE && oldEpoch === INACTIVE) {
        this.inertia = this._reload();
        return 1 /* LOADING */;
      } else {
        this.inertia = this._unload();
        return 5 /* UNLOADING */;
      }
    });
  }
  _resolveConfig(config) {
    config = this.context.waterfall(this, "internal/config", config, () => config);
    return this.runtime ? resolveConfig(this.runtime, config) : config;
  }
  async _reload() {
    this.store = { ...this._store };
    const oldEpoch = this._runner.epoch;
    try {
      await Promise.resolve();
      if (this._runner.epoch === oldEpoch) {
        this.config = this._resolveConfig(this._config);
        await this._execute(this._runner);
        this._error = void 0;
      }
    } catch (reason) {
      this.ctx.logger.error(reason);
      this._error = reason;
      this._runner.epoch = INACTIVE;
    }
    this._updateState(() => {
      if (this._runner.epoch === oldEpoch) {
        this.inertia = void 0;
      } else {
        this.inertia = this._unload();
        return 5 /* UNLOADING */;
      }
    });
  }
  async _unload() {
    await Promise.all(this._disposables.clear().map(async (dispose) => {
      try {
        await composeError(async (info) => {
          await Promise.resolve();
          info.error = new Error();
          await runDisposable(dispose);
        }, this._runner.getOuterStack);
      } catch (reason) {
        this.ctx.logger.error(reason);
      }
    }));
    this.store = void 0;
    this._updateState(() => {
      if (this._runner.epoch === INACTIVE) {
        this.inertia = void 0;
      } else {
        this.inertia = this._reload();
        return 1 /* LOADING */;
      }
    });
  }
  /**
   * Wait for current lifecycle work and rethrow startup errors.
   *
   * @returns this fiber, once it has settled into a stable state.
   * @throws the config-validation or plugin-startup error, if any.
   */
  async await() {
    while (this.inertia) {
      await this.inertia;
    }
    if (this._error) throw this._error;
    return this;
  }
  /**
   * Dispose and immediately reload this plugin with its current config.
   *
   * @returns a promise resolving once the reload settled.
   * @throws {CordisError} `INACTIVE_EFFECT` when the fiber is already disposed.
   */
  async restart() {
    this.assertActive();
    this._setEpoch(INACTIVE);
    this._refresh();
    await this.await();
  }
  /**
   * Validate and apply new config, then restart the plugin.
   *
   * Runs the `internal/update` waterfall first, so update hooks (and HMR)
   * can veto or replace the restart.
   *
   * @param config — the new raw config; validated before anything restarts.
   * @param noSave — hint for persistence hooks not to write the change back.
   * @returns the update waterfall result; the default restart returns a promise.
   * @throws when validation, an update listener, or the restarted plugin fails.
   */
  update(config, noSave = false) {
    this.assertActive();
    this._config = config;
    if (this.state !== 2 /* ACTIVE */) {
      this._error = void 0;
      this._setEpoch(INACTIVE);
      this._refresh();
      return;
    }
    config = this._resolveConfig(config);
    return this.context.waterfall(this, "internal/update", config, noSave, () => {
      this.config = config;
      this._error = void 0;
      return this.restart();
    });
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/reflect.ts
function enhanceError(error) {
  const lines = error.stack.split("\n");
  lines.splice(0, 2, `Error: ${error.message}`);
  error.stack = lines.join("\n");
  return error;
}
var RESERVED_WORDS = ["prototype", "then"];
function isSpecialProperty(prop) {
  return typeof prop === "symbol" || RESERVED_WORDS.includes(prop) || parseInt(prop).toString() === prop || prop.startsWith("_");
}
var ReflectService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.mixin("reflect", ["get", "set", "provide", "accessor", "mixin"]);
    this.mixin("fiber", ["runtime", "effect"]);
    this.mixin("registry", ["inject", "plugin"]);
    this.mixin("events", ["on", "once", "parallel", "emit", "serial", "bail", "waterfall"]);
  }
  ctx;
  /** Proxy traps implementing service resolution for every context object. */
  static handler = {
    get: (target, prop, ctx) => {
      if (isSpecialProperty(prop)) {
        return Reflect.get(target, prop, ctx);
      }
      if (Reflect.has(target, prop)) {
        return getTraceable(ctx, Reflect.get(target, prop, ctx));
      }
      const error = new Error(`cannot get property "${prop}" without inject`);
      try {
        const def = target.reflect.props[prop];
        if (def?.type === "accessor") {
          return def.get.call(ctx, ctx[symbols.receiver], error);
        }
        if (!ctx.fiber.runtime) return ctx.reflect.get(prop, false);
        return ctx.events.waterfall("internal/get", ctx, prop, error, () => {
          const key = target[symbols.isolate][prop];
          let fiber = (ctx[symbols.shadow] ?? ctx).fiber;
          while (true) {
            const impl = fiber.store?.[prop];
            if (impl) return getTraceable(ctx, impl.value);
            if (prop in fiber.inject) {
              error.message = `cannot get required service "${prop}" in inactive context`;
              throw error;
            }
            if (!fiber.runtime) throw error;
            if (fiber.parent[symbols.isolate][prop] !== key) throw error;
            fiber = fiber.parent.fiber;
          }
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    set: (target, prop, value, ctx) => {
      if (isSpecialProperty(prop)) {
        return Reflect.set(target, prop, value, ctx);
      }
      const error = new Error(`cannot set property "${prop}" without provide`);
      const def = target.reflect.props[prop];
      if (!def) {
        if (!ctx.fiber.runtime) return Reflect.set(target, prop, value, ctx);
        throw enhanceError(error);
      }
      try {
        if (def.type === "accessor") {
          if (!def.set) return false;
          return def.set.call(ctx, value, ctx[symbols.receiver], error);
        }
        return ctx.events.waterfall("internal/set", ctx, prop, value, error, () => {
          return ctx.reflect.set(prop, value, error);
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    has: (target, prop) => {
      if (isSpecialProperty(prop)) {
        return Reflect.has(target, prop);
      }
      if (Reflect.has(target, prop)) return true;
      return !!target.reflect.props[prop];
    }
  };
  /** Service implementations, keyed by isolation label. */
  store = /* @__PURE__ */ Object.create(null);
  /** Declared context properties (services and accessors), by name. */
  props = /* @__PURE__ */ Object.create(null);
  /**
   * Read a service from the store without the inject requirement.
   *
   * @param name — the service name.
   * @param strict — when `true`, only return implementations whose providing
   * fiber is currently active.
   * @returns the service value, or `undefined` when not (yet) provided.
   */
  get(name15, strict = true) {
    return getTraceable(this.ctx, this._getImpl(name15, strict)?.value);
  }
  _getImpl(name15, strict = true) {
    const key = this.ctx[symbols.isolate][name15];
    const impl = key && this.store[key];
    if (!impl) return;
    if (strict && impl.fiber.state !== 2 /* ACTIVE */) return;
    return impl;
  }
  /**
   * Overwrite a provided service's value.
   *
   * @param name — the service name.
   * @param value — the new service value.
   * @param error — carrier for the caller stack in diagnostics.
   * @returns `true` on success.
   * @throws when `name` was never provided, or was provided by another fiber.
   */
  set(name15, value, error) {
    const key = this.ctx[symbols.isolate][name15];
    const impl = this.store[key];
    if (!impl) {
      throw new Error(`cannot set property "${name15}" without provide`);
    }
    if (impl.fiber !== this.ctx.fiber) {
      throw new Error(`cannot set property "${name15}" in multiple fibers`);
    }
    impl.value = value;
    return true;
  }
  /**
   * Register a service implementation owned by the current fiber.
   *
   * See the `ctx.provide()` overload above for the full contract.
   *
   * @param name — the service name.
   * @param value — the service value.
   * @param check — optional availability predicate for dependents.
   * @returns a disposer that unregisters the service.
   */
  provide(name15, value, check) {
    return this.ctx.fiber.effect(() => {
      if (!this.props[name15]) {
        this.props[name15] ??= { type: "service" };
      } else if (this.props[name15].type !== "service") {
        throw new Error(`property "${name15}" is already declared as ${this.props[name15].type}`);
      }
      this.props[name15] = { type: "service" };
      this.ctx.root[symbols.isolate][name15] ??= Symbol(name15);
      const key = this.ctx[symbols.isolate][name15];
      const impl = { name: name15, value, fiber: this.ctx.fiber, check };
      if (this.store[key]) {
        throw new Error(`service "${name15}" has been registered at <${this.store[key].fiber.name}>`);
      }
      this.store[key] = impl;
      this.ctx.fiber.store[name15] = impl;
      if (this.ctx.fiber.state === 2 /* ACTIVE */) {
        this.notify([name15]);
      }
      return async () => {
        delete this.store[key];
        const fibers = this.notify([name15]);
        await Promise.allSettled(fibers.map((fiber) => fiber.await()));
        delete this.ctx.fiber.store[name15];
      };
    }, `ctx.provide(${JSON.stringify(name15)})`);
  }
  /**
   * Re-evaluate every fiber that requires one of the given services.
   *
   * @param names — the service names that changed.
   * @param filter — restricts notification to matching isolation scopes.
   * @returns the fibers whose dependency state was refreshed.
   */
  notify(names, filter = (ctx, name15) => ctx[symbols.isolate][name15] === this.ctx[symbols.isolate][name15]) {
    const fibers = [];
    for (const runtime of this.ctx.registry.values()) {
      for (const fiber of runtime.fibers) {
        let hasUpdate = false;
        for (const name15 of names) {
          if (!(name15 in fiber.inject)) continue;
          if (!filter(fiber.ctx, name15)) continue;
          hasUpdate = true;
          fiber._checkImpl(name15);
        }
        if (!hasUpdate) continue;
        fiber._refresh();
        fibers.push(fiber);
      }
    }
    for (const name15 of names) {
      const self = Object.create(this.ctx);
      self[symbols.filter] = (target) => filter(target, name15);
      this.ctx.events.emit(self, "internal/service", name15, this._getImpl(name15, false)?.value);
    }
    return fibers;
  }
  /**
   * Define a computed context property backed by get/set hooks.
   *
   * @param name — the context property name.
   * @param options — the `get` hook and optional `set` hook.
   * @returns a disposer that removes the accessor.
   */
  accessor(name15, options) {
    return this.ctx.fiber.effect(() => {
      if (name15 in this.props) {
        throw new Error(`property "${name15}" is already declared as ${this.props[name15].type}`);
      }
      this.props[name15] = { type: "accessor", ...options };
      return () => delete this.props[name15];
    }, `ctx.accessor(${JSON.stringify(name15)})`);
  }
  /**
   * Expose selected members of a service directly on `ctx`.
   *
   * See the `ctx.mixin()` overload above for the full contract.
   *
   * @param source — a context property name or a source object.
   * @param mixins — keys to forward, or a source-key → ctx-key map.
   * @returns a disposer that removes all created accessors.
   */
  mixin(source, mixins) {
    const self = this;
    return this.ctx.fiber.effect(function* () {
      const entries = Array.isArray(mixins) ? mixins.map((key) => [key, key]) : Object.entries(mixins);
      const getTarget = (ctx, error) => {
        return ctx[source];
      };
      for (const [key, value] of entries) {
        yield self.accessor(value, {
          get(receiver, error) {
            const service = getTarget(this, error);
            if (isNullable(service)) return service;
            const mixin = receiver ? withProps(receiver, service) : service;
            const value2 = Reflect.get(service, key, mixin);
            if (typeof value2 !== "function") return value2;
            return value2.bind(mixin ?? service);
          },
          set(value2, receiver, error) {
            const service = getTarget(this, error);
            const mixin = receiver ? withProps(receiver, service) : service;
            return Reflect.set(service, key, value2, mixin);
          }
        });
      }
    }, `ctx.mixin(${JSON.stringify(source)})`);
  }
  /**
   * Attach this context's tracing wrapper to a value.
   *
   * @param value — the value to wrap.
   * @returns the traceable wrapper (or the value itself when not applicable).
   */
  trace(value) {
    return getTraceable(this.ctx, value);
  }
  /**
   * Wrap a callback so calls trace `this` and arguments to this context.
   *
   * @param callback — the function to wrap.
   * @returns a proxy delegating to `callback` with traced values.
   */
  bind(callback) {
    return new Proxy(callback, {
      apply: (target, thisArg, args) => {
        return Reflect.apply(target, this.trace(thisArg), args.map((arg) => this.trace(arg)));
      },
      construct: (target, args, newTarget) => {
        return Reflect.construct(target, args.map((arg) => this.trace(arg)), newTarget);
      }
    });
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/registry.ts
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
function Inject(name15, config) {
  return function(value, decorator) {
    if (decorator.kind === "class") {
      if (!Object.hasOwn(value, "inject")) {
        defineProperty(value, "inject", Object.create(Object.getPrototypeOf(value).inject ?? null));
        defineProperty(value.inject, symbols.checkProto, true);
      }
      value.inject[name15] = config;
    } else if (decorator.kind === "method") {
      const inject13 = (value[symbols.metadata] ??= {}).inject ??= /* @__PURE__ */ Object.create(null);
      inject13[name15] = config;
      decorator.addInitializer(function() {
        const property2 = this[symbols.tracker]?.property;
        (this[symbols.initHooks] ??= []).push(() => {
          this.ctx.inject(inject13, (ctx) => {
            return value.call(property2 ? withProps(this, { [property2]: ctx }) : this);
          });
        });
      });
    } else {
      throw new Error("@Inject() can only be used on class or class methods");
    }
  };
}
((Inject2) => {
  function resolve5(inject13, result = /* @__PURE__ */ Object.create(null)) {
    if (!inject13) return result;
    if (Array.isArray(inject13)) {
      for (const name15 of inject13) {
        result[name15] = null;
      }
    } else if (Reflect.has(inject13, symbols.checkProto)) {
      Object.assign(result, resolve5(Object.getPrototypeOf(inject13)));
      for (const name15 of Object.keys(inject13)) {
        result[name15] = inject13[name15] ?? null;
      }
    } else {
      for (const name15 of Object.keys(inject13)) {
        result[name15] = inject13[name15] ?? null;
      }
    }
    return result;
  }
  Inject2.resolve = resolve5;
})(Inject || (Inject = {}));
var RegistryService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
  }
  ctx;
  _counter = 0;
  _internal = /* @__PURE__ */ new Map();
  /** Allocate the next fiber uid (increments on every read). */
  get counter() {
    return ++this._counter;
  }
  /** Number of registered plugin runtimes. */
  get size() {
    return this._internal.size;
  }
  /**
   * Resolve a supported plugin shape to its executable callback.
   *
   * @param plugin — a function, class, or `{ apply }` object plugin.
   * @returns the callback identifying the plugin, or `undefined` if invalid.
   */
  resolve(plugin) {
    try {
      if (typeof plugin === "function") return plugin;
      if (isApplicable(plugin)) return plugin.apply;
    } catch {
    }
  }
  /**
   * Look up the runtime record for a plugin.
   *
   * @param plugin — any supported plugin shape.
   * @returns the runtime, or `undefined` when the plugin is not registered.
   */
  get(plugin) {
    const key = this.resolve(plugin);
    return key && this._internal.get(key);
  }
  /**
   * Check whether a plugin has a registered runtime.
   *
   * @param plugin — any supported plugin shape.
   * @returns `true` when at least one fiber of the plugin exists.
   */
  has(plugin) {
    const key = this.resolve(plugin);
    return !!key && this._internal.has(key);
  }
  /**
   * Dispose every running fiber for a plugin and remove its runtime record.
   *
   * @param plugin — any supported plugin shape.
   * @returns the removed runtime, or `undefined` when none was registered.
   */
  delete(plugin) {
    const key = this.resolve(plugin);
    const runtime = key && this._internal.get(key);
    if (!runtime) return;
    this._internal.delete(key);
    for (const fiber of runtime.fibers) {
      fiber.dispose();
    }
    return runtime;
  }
  /** Iterate the registered plugin callbacks. */
  keys() {
    return this._internal.keys();
  }
  /** Iterate the registered plugin runtimes. */
  values() {
    return this._internal.values();
  }
  /** Iterate `[callback, runtime]` pairs. */
  entries() {
    return this._internal.entries();
  }
  /**
   * Visit every registered runtime.
   *
   * @param callback — receives each runtime and its identifying callback.
   */
  forEach(callback) {
    return this._internal.forEach(callback);
  }
  /**
   * Start a callback once the requested dependencies are available.
   *
   * @param inject — required services, as an array or a name → config map.
   * @param callback — plugin body called with `(ctx, config)`.
   * @returns the fiber; awaiting it settles once loading finished.
   */
  inject(inject13, callback) {
    return this.plugin({ inject: inject13, apply: callback, name: callback.name });
  }
  /**
   * Start a plugin in the current context and return its fiber.
   *
   * Creates (or reuses) the plugin's runtime record, then starts a new fiber
   * under the current context. Throws if `plugin` is not a supported shape or
   * if the current fiber is already disposed.
   *
   * @param plugin — a function, class, or `{ apply }` object plugin.
   * @param config — the plugin config, validated against its `Config` schema.
   * @param getOuterStack — captures the caller stack for effect diagnostics.
   * @returns the fiber; awaiting it settles once loading finished.
   */
  plugin(plugin, config, getOuterStack = buildOuterStack()) {
    const callback = this.resolve(plugin);
    if (!callback) throw new Error('invalid plugin, expect function or object with an "apply" method, received ' + typeof plugin);
    this.ctx.fiber.assertActive();
    let runtime = this._internal.get(callback);
    if (!runtime) {
      let name15 = plugin.name;
      if (name15 === "apply") name15 = void 0;
      runtime = { name: name15, callback, fibers: new DisposableList(), Config: plugin.Config };
      this._internal.set(callback, runtime);
    }
    const fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack);
    const wrapped = Object.create(fiber);
    wrapped.then = (onFulfilled, onRejected) => {
      return fiber.await().then(onFulfilled, onRejected);
    };
    return wrapped;
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/context.ts
var Context = class _Context {
  /** Symbol key under which a disposer exposes its {@link EffectMeta} diagnostics tree. */
  static effect = symbols.effect;
  /** Symbol key for a context's listener filter, consulted on every event dispatch. */
  static filter = symbols.filter;
  /** Symbol key of the isolation map (see the `Context[symbols.isolate]` property). */
  static isolate = symbols.isolate;
  /** Symbol key of the intercept map (see the `Context[symbols.intercept]` property). */
  static intercept = symbols.intercept;
  /**
   * Returns true for Cordis context proxies and context prototypes.
   *
   * Works across realms and across multiple copies of cordis, because the
   * brand is keyed by a global symbol rather than by `instanceof`.
   *
   * @param value — the value to test.
   * @returns `true` if `value` is a Cordis context, narrowing its type.
   */
  static is(value) {
    return !!value?.[_Context.is];
  }
  static {
    _Context.is[Symbol.toPrimitive] = () => /* @__PURE__ */ Symbol.for("cordis.is");
    _Context.prototype[_Context.is] = true;
  }
  /** Create the root context and install the built-in services. */
  constructor() {
    this[symbols.isolate] = /* @__PURE__ */ Object.create(null);
    this[symbols.intercept] = /* @__PURE__ */ Object.create(null);
    const self = new Proxy(this, ReflectService.handler);
    this.root = self;
    this.baseUrl = void 0;
    this.fiber = new Fiber(self, {}, /* @__PURE__ */ Object.create(null), null, () => []);
    this.reflect = new ReflectService(self);
    this.registry = new RegistryService(self);
    this.events = new EventsService(self);
    this.logger = new LoggerService(self);
    this.fiber._disposables.clear();
    return self;
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return `Context <${this.fiber.name}>`;
  }
  /**
   * Create a child context with extra metadata on top of the current scope.
   *
   * The child prototypally inherits every property of this context; own
   * properties of `meta` shadow the inherited ones. The parent is not mutated.
   *
   * @param meta — own properties (including symbol keys) to define on the child.
   * @returns a child context inheriting from this one.
   */
  extend(meta = {}) {
    const shadow = Reflect.getOwnPropertyDescriptor(this, symbols.shadow)?.value;
    const self = Object.create(getTraceable(this, this));
    for (const prop of Reflect.ownKeys(meta)) {
      Object.defineProperty(self, prop, Reflect.getOwnPropertyDescriptor(meta, prop));
    }
    if (!shadow) return self;
    return Object.assign(Object.create(self), { [symbols.shadow]: shadow });
  }
  /**
   * Create a child context with an independent service scope for `name`.
   *
   * Below the returned context, reads and writes of the service `name`
   * resolve against the new label instead of the parent's, so a different
   * implementation can be provided without affecting the parent scope.
   * Passing the same `label` to two `isolate()` calls joins their scopes.
   *
   * @param name — the service name to isolate.
   * @param label — scope label to join; defaults to a fresh unique symbol.
   * @returns a child context whose `name` service resolves in the new scope.
   */
  isolate(name15, label) {
    const shadow = Object.create(this[symbols.isolate]);
    shadow[name15] = label ?? Symbol(name15);
    return this.extend({ [symbols.isolate]: shadow });
  }
  intercept(name15, config) {
    const intercept = Object.create(this[symbols.intercept]);
    intercept[name15] = config;
    return this.extend({ [symbols.intercept]: intercept });
  }
};

// ../../source/deepseek-harness/vendor/cordis/src/service.ts
var Service = class _Service {
  /**
   * Register this instance as `name` in the current context.
   *
   * Calls `ctx.reflect.provide(name, this, this[Service.check])`, so the
   * service is unregistered automatically when the owning fiber unloads.
   * Services with a `[Service.invoke]` body return a callable instance.
   *
   * @param ctx — the context to register in (stored as `this.ctx`).
   * @param name — the service name; defaults to the static `provide` field.
   */
  constructor(ctx, name15) {
    this.ctx = ctx;
    name15 ??= this.constructor["provide"];
    let self = this;
    const tracker = {
      associate: name15,
      property: "ctx"
    };
    if (self[symbols.invoke]) {
      self = createCallable(name15, joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    }
    self.ctx = ctx;
    self.name = name15;
    defineProperty(self, symbols.tracker, tracker);
    self.ctx.reflect.provide(name15, self, this[symbols.check]);
    return self;
  }
  ctx;
  /** Symbol key of an instance method run after construction (class plugins). */
  static init = symbols.init;
  /** Symbol key of the availability predicate passed to `ctx.provide()`. */
  static check = symbols.check;
  /** Symbol key of the phantom intercept-config type parameter. */
  static config = symbols.config;
  /** Symbol key of the call body making a service callable (e.g. `ctx.logger()`). */
  static invoke = symbols.invoke;
  /** Symbol key of the helper deriving an extended service instance. */
  static extend = symbols.extend;
  /** Symbol key of the tracker metadata used for context tracing. */
  static tracker = symbols.tracker;
  /** Symbol key of the intercept-config resolution helper below. */
  static resolveConfig = symbols.resolveConfig;
  /** The service name this instance is registered under. */
  name;
  [symbols.filter](ctx) {
    return ctx[symbols.isolate][this.name] === this.ctx[symbols.isolate][this.name];
  }
  [symbols.extend](props) {
    let self;
    if (this[_Service.invoke]) {
      self = createCallable(this.name, this, this[symbols.tracker]);
    } else {
      self = Object.create(this);
    }
    return Object.assign(self, props);
  }
  /**
   * Merge intercept config from ancestors with optional base and head values.
   *
   * Entries added closer to the root apply first; `base` is prepended and
   * `head` appended. Uses `Config.merge` when the service declares one,
   * otherwise a shallow `Object.assign`.
   *
   * @param base — lowest-precedence config merged before all intercepts.
   * @param head — highest-precedence config merged after all intercepts.
   * @returns the merged config.
   */
  [symbols.resolveConfig](base, head) {
    let intercept = this.ctx[Context.intercept];
    const configs = [];
    while (this.name in intercept) {
      if (Object.hasOwn(intercept, this.name)) {
        configs.unshift(intercept[this.name]);
      }
      intercept = Object.getPrototypeOf(intercept);
    }
    if (base) configs.unshift(base);
    if (head) configs.push(head);
    if (this["Config"]?.merge) {
      return this["Config"].merge(...configs);
    } else {
      return Object.assign({}, ...configs);
    }
  }
  static [Symbol.hasInstance](instance) {
    if (!instance) return false;
    let constructor = instance.constructor;
    while (constructor) {
      constructor = constructor.prototype?.constructor;
      if (constructor === this) return true;
      constructor &&= Object.getPrototypeOf(constructor);
    }
    return false;
  }
};

// ../../source/deepseek-harness/vendor/timer/src/index.ts
var TimerService = class extends Service {
  constructor(ctx) {
    super(ctx, "timer");
    ctx.mixin("timer", ["timeout", "interval", "throttle", "debounce", "setTimeout", "setInterval"]);
  }
  /** @deprecated use `ctx.timeout()` instead */
  setTimeout(callback, delay) {
    return this.timeout(callback, delay);
  }
  /** @deprecated use `ctx.interval()` instead */
  setInterval(callback, delay) {
    return this.interval(callback, delay);
  }
  timeout(...args) {
    const callback = typeof args[0] === "function" ? args.shift() : void 0;
    const delay = args[0];
    if (callback) {
      const dispose = this.ctx.effect(() => {
        const timer = setTimeout(() => {
          dispose();
          callback();
        }, delay);
        return () => clearTimeout(timer);
      }, "ctx.timeout()");
      return dispose;
    } else {
      const { promise, resolve: resolve5, reject: reject2 } = Promise.withResolvers();
      const dispose = this.ctx.effect(() => {
        const timer = setTimeout(resolve5, delay);
        return () => {
          clearTimeout(timer);
          reject2(new Error("Context has been disposed"));
        };
      }, "ctx.timeout()");
      return promise.finally(dispose);
    }
  }
  interval(...args) {
    const callback = typeof args[0] === "function" ? args.shift() : void 0;
    const delay = args[0];
    if (callback) {
      return this.ctx.effect(() => {
        const timer = setInterval(callback, delay);
        return () => clearInterval(timer);
      }, "ctx.interval()");
    } else {
      let done;
      let nextTask;
      const dispose = this.ctx.effect(() => {
        const timer = setInterval(() => {
          nextTask?.resolve({ done: false, value: void 0 });
        }, delay);
        return () => {
          clearInterval(timer);
          if (done) return;
          done = { kind: "throw", reason: new Error("Context has been disposed") };
          nextTask?.reject(done.reason);
        };
      }, "ctx.interval()");
      return {
        next: () => {
          if (!done) return (nextTask = Promise.withResolvers()).promise;
          if (done.kind === "return") return Promise.resolve({ done: true, value: done.value });
          return Promise.reject(done.reason);
        },
        return: (value) => {
          if (!done) done = { kind: "return", value };
          nextTask?.resolve({ done: true, value });
          dispose();
          return Promise.resolve({ done: true, value });
        },
        throw: (reason) => {
          if (!done) done = { kind: "throw", reason };
          nextTask?.reject(reason);
          dispose();
          return Promise.resolve({ done: true, value: void 0 });
        },
        [Symbol.asyncIterator]() {
          return this;
        }
      };
    }
  }
  _schedule(label, trigger, isDisposed = false) {
    let timer;
    const dispose = this.ctx.effect(() => () => {
      isDisposed = true;
      clearTimeout(timer);
    }, label);
    const wrapper = (...args) => {
      clearTimeout(timer);
      timer = trigger(args, isDisposed);
    };
    wrapper.dispose = dispose;
    return wrapper;
  }
  /** Return a throttled function whose timer is disposed with the current fiber. */
  throttle(callback, delay, noTrailing) {
    let lastCall = -Infinity;
    const execute = (...args) => {
      lastCall = Date.now();
      callback(...args);
    };
    return this._schedule("ctx.throttle()", (args, isDisposed) => {
      const now = Date.now();
      const remaining = delay - now + lastCall;
      if (remaining <= 0) {
        execute(...args);
      } else if (!isDisposed) {
        return setTimeout(execute, remaining, ...args);
      }
    }, noTrailing);
  }
  /** Return a debounced function whose timer is disposed with the current fiber. */
  debounce(callback, delay) {
    return this._schedule("ctx.debounce()", (args, isDisposed) => {
      if (isDisposed) return;
      return setTimeout(callback, delay, ...args);
    });
  }
};
var src_default = TimerService;

// ../../source/deepseek-harness/vendor/schemastery/src/index.ts
var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError2 = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError2 = class extends TypeError {
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) {
      if (typeof segment === "string") {
        prefix += "." + segment;
      } else if (typeof segment === "number") {
        prefix += "[" + segment + "]";
      } else if (typeof segment === "symbol") {
        prefix += `[Symbol(${segment.toString()})]`;
      }
    }
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  options;
  name = "ValidationError";
  static is(error) {
    return !!error?.[kValidationError2];
  }
};
Object.defineProperty(ValidationError2.prototype, kValidationError2, {
  value: true
});
var Schema = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") {
    try {
      schema.callback = new Function("return " + schema.callback)();
    } catch {
    }
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema.prototype);
  schema.meta ||= {};
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", {
  get() {
    return {
      version: 1,
      vendor: "schemastery",
      validate: (value) => {
        try {
          return { value: Schema.resolve(value, this, {})[0] };
        } catch (error) {
          if (ValidationError2.is(error)) {
            return { issues: [{ message: error.message, path: error.options.path }] };
          }
          throw error;
        }
      }
    };
  }
});
Schema.ValidationError = ValidationError2;
Schema.prototype.toJSON = function toJSON() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = { uid: this.uid, refs: globalThis.__schemastery_refs__ };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) {
      result[locale] = value.$description || value.$desc;
    } else if (typeof value === "string") {
      result[locale] = value;
    }
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema = Schema(this);
  const desc = mergeDesc(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) {
    schema.dict = mapValues(schema.dict, (inner, key) => {
      return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
    });
  }
  if (schema.list) {
    schema.list = schema.list.map((inner, index) => {
      return inner.i18n(mapValues(messages, (data = {}) => {
        if (Array.isArray(getInner(data))) return getInner(data)[index];
        if (Array.isArray(data)) return data[index];
        return extractKeys(data);
      }));
    });
  }
  if (schema.inner) {
    schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
      if (getInner(data)) return getInner(data);
      return extractKeys(data);
    }));
  }
  if (schema.sKey) {
    schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  }
  return schema;
};
Schema.prototype.extra = function extra(key, value) {
  const schema = Schema(this);
  schema.meta = { ...schema.meta, [key]: value };
  return schema;
};
for (const key of ["required", "disabled", "collapse", "hidden", "loose"]) {
  Object.assign(Schema.prototype, {
    [key](value = true) {
      const schema = Schema(this);
      schema.meta = { ...schema.meta, [key]: value };
      return schema;
    }
  });
}
Schema.prototype.deprecated = function deprecated() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({ text: "deprecated", type: "danger" });
  return schema;
};
Schema.prototype.experimental = function experimental() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({ text: "experimental", type: "warning" });
  return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema = Schema(this);
  const pattern2 = pick(regexp, ["source", "flags"]);
  schema.meta = { ...schema.meta, pattern: pattern2 };
  return schema;
};
Schema.prototype.simplify = function simplify(value) {
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const schema = this.type === "object" ? this.dict[key] : this.inner;
      const item = schema?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) {
      Object.assign(result, item.simplify(value));
    }
    return result;
  } else if (this.type === "union") {
    for (const schema of this.list) {
      try {
        Schema.resolve(value, schema, {});
        return schema.simplify(value);
      } catch {
      }
    }
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra2) {
  const schema = Schema(this);
  schema.meta = { ...schema.meta, role, extra: extra2 };
  return schema;
};
for (const key of ["default", "link", "comment", "description", "max", "min", "step"]) {
  Object.assign(Schema.prototype, {
    [key](value) {
      const schema = Schema(this);
      schema.meta = { ...schema.meta, [key]: value };
      return schema;
    }
  });
}
var resolvers = {};
Schema.extend = function extend(type, resolve5) {
  resolvers[type] = resolve5;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError2(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema.type];
  if (!callback) throw new ValidationError2(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) {
    return Schema.any();
  } else if (["string", "number", "boolean"].includes(typeof source)) {
    return Schema.const(source).required();
  } else if (source[kSchema]) {
    return source;
  } else if (typeof source === "function") {
    switch (source) {
      case String:
        return Schema.string().required();
      case Number:
        return Schema.number().required();
      case Boolean:
        return Schema.boolean().required();
      case Function:
        return Schema.function().required();
      default:
        return Schema.is(source).required();
    }
  } else {
    throw new TypeError(`cannot infer schema from ${source}`);
  }
};
Schema.lazy = function lazy(builder) {
  const toJSON2 = () => {
    if (!schema.inner[kSchema]) {
      schema.inner = schema.builder();
      schema.inner.meta = { ...schema.meta, ...schema.inner.meta };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema({ type: "lazy", builder, inner: { toJSON: toJSON2 } });
  return schema;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([
    Schema.is(Date),
    Schema.transform(Schema.string().role("datetime"), (value, options) => {
      const date2 = new Date(value);
      if (isNaN(+date2)) throw new ValidationError2(`invalid date "${value}"`, options);
      return date2;
    }, true)
  ]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([
    Schema.is(RegExp),
    Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
      try {
        return new RegExp(value, flag);
      } catch (e) {
        throw new ValidationError2(e.message, options);
      }
    }, true)
  ]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError2(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError2(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema]) {
    schema.inner = schema.builder();
    schema.inner.meta = { ...schema.meta, ...schema.inner.meta };
  }
  return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError2(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError2(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError2(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError2(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError2(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError2(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) {
    return (data - min) % step === 0;
  }
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError2(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) {
    throw new ValidationError2(`expected number multiple of ${step} but got ${data}`, options);
  }
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError2(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) {
      if (data & bits[key]) {
        keys.push(key);
      }
    }
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError2(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else {
    throw new ValidationError2(`expected number or array but got ${data}`, options);
  }
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError2(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError2(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) {
      throw new ValidationError2(`expected ${constructor} but got ${data}`, options);
    }
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError2(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError2(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError2(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError2(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError2(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) {
      result[key] = value;
    }
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString2 }, options, strict) => {
  const messages = [];
  for (const inner of list) {
    try {
      return Schema.resolve(data, inner, options, strict);
    } catch (error) {
      messages.push(error);
    }
  }
  throw new ValidationError2(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString2 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) {
      result = value;
    } else if (typeof result !== typeof value) {
      throw new ValidationError2(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    } else if (typeof value === "object") {
      merge(result ??= {}, value);
    } else if (result !== value) {
      throw new ValidationError2(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    }
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) {
    return [callback(result)];
  } else {
    return [callback(result), callback(adapted)];
  }
});
var formatters = {};
function defineMethod(name15, keys, format) {
  formatters[name15] = format;
  Object.assign(Schema, {
    [name15](...args) {
      const schema = new Schema({ type: name15 });
      keys.forEach((key, index) => {
        switch (key) {
          case "sKey":
            schema.sKey = args[index] ?? Schema.string();
            break;
          case "inner":
            schema.inner = Schema.from(args[index]);
            break;
          case "list":
            schema.list = args[index].map(Schema.from);
            break;
          case "dict":
            schema.dict = mapValues(args[index], Schema.from);
            break;
          case "bits": {
            schema.bits = {};
            for (const key2 in args[index]) {
              if (typeof args[index][key2] !== "number") continue;
              schema.bits[key2] = args[index][key2];
            }
            break;
          }
          case "callback": {
            const callback = schema.callback = args[index];
            callback["toJSON"] ||= () => callback.toString();
            break;
          }
          case "constructor": {
            const constructor = schema.constructor = args[index];
            if (typeof constructor === "function") {
              ;
              constructor["toJSON"] ||= () => constructor["name"];
            }
            break;
          }
          default:
            schema[key] = args[index];
        }
      });
      if (name15 === "object" || name15 === "dict") {
        schema.meta.default = {};
      } else if (name15 === "array" || name15 === "tuple") {
        schema.meta.default = [];
      } else if (name15 === "bitset") {
        schema.meta.default = 0;
      }
      return schema;
    }
  });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") {
    return constructor.name;
  } else {
    return constructor;
  }
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", ["inner", "callback", "preserve"], ({ inner }, isInner) => inner.toString(isInner));
var src_default2 = Schema;

// ../../source/deepseek-harness/packages/llm/llm/src/brand.ts
function MessageId(id) {
  return id;
}
function CallId(id) {
  return id;
}

// ../../source/deepseek-harness/packages/llm/llm/src/call-config.ts
var AGENT_LOOP_REQUESTS = /* @__PURE__ */ new WeakSet();
function callConfigEquals(a, b) {
  if (a.provider !== b.provider || a.model !== b.model || a.reasoningEffort !== b.reasoningEffort || a.temperature !== b.temperature || a.maxTokens !== b.maxTokens) return false;
  if (a.stop === void 0 || b.stop === void 0) return a.stop === b.stop;
  return a.stop.length === b.stop.length && a.stop.every((s, i) => s === b.stop?.[i]);
}
function markAgentLoopRequest(request) {
  AGENT_LOOP_REQUESTS.add(request);
  return request;
}
function isAgentLoopRequest(request) {
  return AGENT_LOOP_REQUESTS.has(request);
}
function deepFreeze(value) {
  const seen = /* @__PURE__ */ new WeakSet();
  const pending = [{ kind: "visit", node: value }];
  while (pending.length > 0) {
    const task = pending.pop();
    if (task === void 0) continue;
    if (task.kind === "property") {
      pending.push({ kind: "visit", node: task.source[task.key] });
      continue;
    }
    const node = task.node;
    if (node === null || typeof node !== "object") continue;
    if (node instanceof AbortSignal) continue;
    if (seen.has(node)) continue;
    seen.add(node);
    Object.freeze(node);
    const keys = Object.keys(node);
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) continue;
      pending.push({ kind: "property", source: node, key });
    }
  }
  return value;
}

// ../../source/deepseek-harness/packages/llm/llm/src/message.ts
var CONTEXT_SUMMARY_MAX_CHARS = 120;
function boundContextSummary(summary) {
  return summary.length <= CONTEXT_SUMMARY_MAX_CHARS ? summary : `${summary.slice(0, CONTEXT_SUMMARY_MAX_CHARS - 1)}\u2026`;
}
function freezeMessage(message) {
  return deepFreeze(structuredClone(message));
}
function createMessage(input) {
  return freezeMessage({
    ...input,
    id: MessageId(crypto.randomUUID())
  });
}
function createUserMessage(input) {
  return createMessage({
    ...input,
    role: "user"
  });
}
function createAssistantMessage(input) {
  return createMessage({
    role: "assistant",
    content: input.content,
    source: {
      kind: "model",
      ...input.source
    }
  });
}
function createToolResultMessage(input) {
  return createUserMessage({
    source: { kind: "tool", callId: input.callId },
    content: [{
      type: "tool-result",
      toolCallId: input.callId,
      content: input.content,
      isError: input.isError
    }]
  });
}

// ../../source/deepseek-harness/packages/util/timeout/src/index.ts
var TimeoutReason = class extends Error {
  /**
   * @param code Capability-owned timeout code (e.g. `BASH_TIMEOUT`).
   * @param timeoutMs The deadline that elapsed, in milliseconds.
   */
  constructor(code, timeoutMs) {
    super(`${code} after ${timeoutMs}ms`);
    this.code = code;
    this.timeoutMs = timeoutMs;
  }
  code;
  timeoutMs;
  name = "TimeoutReason";
};
var MAX_TIMER_DELAY_MS = 2147483647;
function assertTimerDelay(timeoutMs, name15) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`${name15} must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
}
function deadline(upstream, timeoutMs, code) {
  if (timeoutMs <= 0) {
    return { signal: upstream ?? new AbortController().signal, [Symbol.dispose]() {
    } };
  }
  assertTimerDelay(timeoutMs, "deadline timeoutMs");
  const timer = new AbortController();
  const id = setTimeout(() => {
    timer.abort(new TimeoutReason(code, timeoutMs));
  }, timeoutMs);
  return {
    // AbortSignal.any adopts the reason of whichever source aborts FIRST, so a
    // race resolves to a single cause: timeoutOf() reads TimeoutReason only
    // when the timeout won, and upstream-wins leaves an ordinary abort reason.
    signal: upstream !== void 0 ? AbortSignal.any([upstream, timer.signal]) : timer.signal,
    [Symbol.dispose]() {
      clearTimeout(id);
    }
  };
}
function timeoutOf(x, code) {
  const reason = x.reason;
  if (!(reason instanceof TimeoutReason)) return void 0;
  return code === void 0 || reason.code === code ? reason : void 0;
}

// ../../source/deepseek-harness/packages/llm/llm/src/error.ts
var HarnessError = class extends Error {
  /** Stable machine-routable failure class (e.g. `RATE_LIMIT`); route on this, never by parsing `message`. */
  code;
  constructor(message, code, options) {
    super(message, options);
    this.code = code;
    this.name = new.target.name;
  }
};
var EMPTY_RESPONSE_CODE = "EMPTY_RESPONSE";
var STRUCTURED_CONTEXT_OVERFLOW = new RegExp(
  String.raw`(?:^|[^a-z0-9])context[\s_-](?:length|window)[\s_-]` + String.raw`(?:exceed(?:ed|s)?|overflow(?:ed)?|limit[\s_-]exceeded)(?:$|[^a-z0-9])`,
  "i"
);
var TOO_LARGE_FOR_CONTEXT = new RegExp(
  String.raw`\b(?:request|prompt|input|messages?)\s+(?:is\s+|are\s+)?` + String.raw`too\s+(?:large|long)\s+for\s+(?:(?:this|the)\s+)?` + String.raw`(?:model(?:'s)?\s+)?context(?:\s+window)?\b`,
  "i"
);
var EXCEEDS_MODEL_CONTEXT = new RegExp(
  String.raw`\b(?:input|prompt|request|messages?)\b.{0,40}` + String.raw`\b(?:exceed(?:s|ed)?|overflows?|is\s+larger\s+than)\b.{0,40}` + String.raw`\b(?:the\s+)?(?:model(?:'s)?\s+)?context(?:\s+(?:length|window))?\b`,
  "i"
);
function errorChain(value) {
  const path = /* @__PURE__ */ new Set();
  const render = (current) => {
    if (path.has(current)) return "<circular cause>";
    path.add(current);
    try {
      if (!(current instanceof Error)) {
        if (typeof current === "object" && current !== null) {
          const descriptor = Object.getOwnPropertyDescriptor(current, "message");
          if (descriptor !== void 0 && "value" in descriptor && typeof descriptor.value === "string") {
            return descriptor.value;
          }
        }
        return String(current);
      }
      const message = current.message === "" ? current.name : current.message;
      const members = current instanceof AggregateError && current.errors.length > 0 ? ` [${current.errors.map(render).join("; ")}]` : "";
      const causeText = current.cause === void 0 || current.cause === null ? "" : render(current.cause);
      const cause = causeText === "" || causeText === message ? "" : `: ${causeText}`;
      return `${message}${members}${cause}`;
    } catch {
      return "<unrenderable value>";
    } finally {
      path.delete(current);
    }
  };
  return render(value);
}

// ../../source/deepseek-harness/packages/llm/llm/src/retry-policy.ts
var DEFAULT_MAX_RETRIES = 2;
var DEFAULT_INITIAL_DELAY_MS = 500;
var DEFAULT_MAX_DELAY_MS = 1e4;
var DEFAULT_JITTER_RATIO = 0.1;
var DEFAULT_RETRYABLE_CODES = Object.freeze([
  EMPTY_RESPONSE_CODE,
  "RATE_LIMIT",
  "SERVER",
  "TIMEOUT",
  "TRANSPORT"
]);
var backoffSchema = src_default2.object({
  initialDelayMs: src_default2.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_INITIAL_DELAY_MS),
  maxDelayMs: src_default2.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_MAX_DELAY_MS),
  jitterRatio: src_default2.number().min(0).max(1).default(DEFAULT_JITTER_RATIO)
});
var normalPolicySchema = src_default2.object({
  mode: src_default2.const("normal").required(),
  maxRetries: src_default2.number().step(1).min(0).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_RETRIES),
  retryableCodes: src_default2.array(src_default2.string()).default([...DEFAULT_RETRYABLE_CODES]),
  backoff: backoffSchema
});
var alwaysPolicySchema = src_default2.object({
  mode: src_default2.const("always").required(),
  backoff: backoffSchema
});
var RetryPolicySchema = src_default2.union([
  normalPolicySchema,
  alwaysPolicySchema
]);
var NORMAL_POLICY_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "maxRetries",
  "retryableCodes",
  "backoff"
]);
var ALWAYS_POLICY_KEYS = /* @__PURE__ */ new Set(["mode", "backoff"]);
var BACKOFF_KEYS = /* @__PURE__ */ new Set(["initialDelayMs", "maxDelayMs", "jitterRatio"]);
function validateKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${path}: unknown key "${key}"`);
  }
}
function resolveBackoff(config, path) {
  if (config !== void 0) validateKeys(config, BACKOFF_KEYS, path);
  const initialDelayMs = config?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = config?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitterRatio = config?.jitterRatio ?? DEFAULT_JITTER_RATIO;
  if (!Number.isFinite(initialDelayMs) || initialDelayMs <= 0 || initialDelayMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`${path}.initialDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
  if (!Number.isFinite(maxDelayMs) || maxDelayMs <= 0 || maxDelayMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`${path}.maxDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
  if (initialDelayMs > maxDelayMs) {
    throw new Error(`${path}.initialDelayMs must be less than or equal to maxDelayMs`);
  }
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1) {
    throw new Error(`${path}.jitterRatio must be between 0 and 1`);
  }
  return Object.freeze({ initialDelayMs, maxDelayMs, jitterRatio });
}
function resolveRetryPolicy(config, path) {
  if (config === void 0) {
    return Object.freeze({
      mode: "normal",
      maxRetries: DEFAULT_MAX_RETRIES,
      retryableCodes: DEFAULT_RETRYABLE_CODES,
      ...resolveBackoff(void 0, `${path}.backoff`)
    });
  }
  switch (config.mode) {
    case "normal": {
      validateKeys(config, NORMAL_POLICY_KEYS, path);
      const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
      const retryableCodes = config.retryableCodes ?? [...DEFAULT_RETRYABLE_CODES];
      if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) {
        throw new Error(`${path}.maxRetries must be a non-negative safe integer`);
      }
      if (retryableCodes.length === 0) {
        throw new Error(`${path}.retryableCodes must not be empty`);
      }
      if (retryableCodes.some((code) => typeof code !== "string" || code.length === 0)) {
        throw new Error(`${path}.retryableCodes must contain only non-empty strings`);
      }
      if (new Set(retryableCodes).size !== retryableCodes.length) {
        throw new Error(`${path}.retryableCodes must not contain duplicates`);
      }
      return Object.freeze({
        mode: "normal",
        maxRetries,
        retryableCodes: Object.freeze([...retryableCodes]),
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    }
    case "always":
      validateKeys(config, ALWAYS_POLICY_KEYS, path);
      return Object.freeze({
        mode: "always",
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    default:
      throw new Error(`${path}.mode must be "normal" or "always"`);
  }
}

// ../../source/deepseek-harness/packages/llm/llm/src/adapter-failure.ts
function normalizeLlmFailure(value) {
  const error = value instanceof Error ? value : new HarnessError(thrownMessage(value), "UNKNOWN", { cause: value });
  const carried = ownFailureSnapshot(error);
  if (carried !== void 0 && carried.code === ownErrorCode(error)) return carried;
  return Object.freeze({
    message: errorMessage(error),
    code: harnessErrorCode(error)
  });
}
function thrownMessage(value) {
  try {
    const message = String(value);
    return message.length > 0 ? message : "LLM adapter failed";
  } catch (_hostileThrownValue) {
    return "LLM adapter failed";
  }
}
function ownErrorCode(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "code");
    return descriptor !== void 0 && "value" in descriptor ? descriptor.value : void 0;
  } catch (_sdkPropertyTrap) {
    return void 0;
  }
}
function ownFailureSnapshot(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "failure");
    return descriptor !== void 0 && "value" in descriptor ? failureSnapshot(descriptor.value) : void 0;
  } catch (_sdkPropertyTrap) {
    return void 0;
  }
}
function failureSnapshot(value) {
  if (typeof value !== "object" || value === null) return void 0;
  try {
    const candidate = value;
    const message = candidate.message;
    const code = candidate.code;
    const status = candidate.status;
    const providerRetryAfterMs = candidate.providerRetryAfterMs;
    const requestId = candidate.requestId;
    if (typeof message !== "string" || message.length === 0 || typeof code !== "string" || code.length === 0 || status !== void 0 && (!Number.isInteger(status) || status < 100 || status > 599) || providerRetryAfterMs !== void 0 && (!Number.isFinite(providerRetryAfterMs) || providerRetryAfterMs <= 0) || requestId !== void 0 && (typeof requestId !== "string" || requestId.length === 0)) return void 0;
    return Object.freeze({
      message,
      code,
      ...status === void 0 ? {} : { status },
      ...providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs },
      ...requestId === void 0 ? {} : { requestId }
    });
  } catch (_sdkFailureGetter) {
    return void 0;
  }
}
function errorMessage(error) {
  try {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) return message;
  } catch (_sdkMessageGetter) {
  }
  return "LLM adapter failed";
}
function harnessErrorCode(error) {
  return error instanceof HarnessError ? error.code : "UNKNOWN";
}

// ../../source/deepseek-harness/packages/llm/llm/src/attribution.ts
import { createRequire } from "node:module";
var { version } = createRequire(import.meta.url)("../package.json");

// ../../source/deepseek-harness/packages/llm/llm/src/never.ts
function assertNever(value, context) {
  const rendered = JSON.stringify(value) ?? String(value);
  throw new Error(`unreachable variant${context ? ` in ${context}` : ""}: ${rendered}`);
}

// ../../source/deepseek-harness/packages/llm/llm/src/assembler.ts
var BlockAssembler = class {
  partials = /* @__PURE__ */ new Map();
  order = [];
  _usage;
  _finish;
  _replayState;
  /**
   * Feed one chunk into the assembly state.
   * @param chunk - the next raw chunk, in stream order.
   */
  push(chunk) {
    switch (chunk.type) {
      case "block-start": {
        if (!this.partials.has(chunk.index)) {
          this.order.push(chunk.index);
          this.partials.set(chunk.index, {
            blockType: chunk.blockType,
            text: "",
            toolCallArguments: ""
          });
        }
        return;
      }
      case "text-delta":
      case "reasoning-delta": {
        const partial = this.ensure(chunk.index, chunk.type === "text-delta" ? "text" : "reasoning");
        if (partial.block) return;
        partial.text += chunk.text;
        return;
      }
      case "tool-call-delta": {
        const partial = this.ensure(chunk.index, "tool-call");
        if (partial.block) return;
        partial.toolCallId = chunk.id;
        if (chunk.name) partial.toolCallName = chunk.name;
        partial.toolCallArguments += chunk.argumentsDelta;
        return;
      }
      case "block-end": {
        const partial = this.ensure(chunk.index, chunk.block.type);
        if (partial.block) return;
        partial.block = chunk.block;
        return;
      }
      case "usage": {
        this._usage = chunk.usage;
        return;
      }
      case "finish": {
        this._finish = chunk.reason;
        this._replayState = chunk.replayState;
        return;
      }
      default:
        return assertNever(chunk, "BlockAssembler.push");
    }
  }
  ensure(index, blockType) {
    let partial = this.partials.get(index);
    if (!partial) {
      partial = { blockType, text: "", toolCallArguments: "" };
      this.partials.set(index, partial);
      this.order.push(index);
    }
    return partial;
  }
  assemble(partial, index) {
    if (partial.block) return partial.block;
    switch (partial.blockType) {
      case "text":
        return { type: "text", text: partial.text };
      case "reasoning":
        return { type: "reasoning", text: partial.text };
      case "tool-call":
        return {
          type: "tool-call",
          id: partial.toolCallId ?? CallId(`call-${index}`),
          name: partial.toolCallName ?? "",
          arguments: partial.toolCallArguments
        };
      default:
        throw new Error(`cannot assemble incomplete block of type "${partial.blockType}"`);
    }
  }
  /** Invariant accessor: every index in `order` has a partial. */
  mustGet(index) {
    const partial = this.partials.get(index);
    if (!partial) throw new Error(`BlockAssembler invariant violated: no partial for index ${index}`);
    return partial;
  }
  /**
   * The one shared keep/drop decision over all seen blocks: max-token
   * truncation drops tool calls that cannot be executed safely. Emitted blocks
   * and replay metadata both derive from this result, so they cannot disagree.
   */
  assembled() {
    const all = this.order.map((index) => this.assemble(this.mustGet(index), index));
    const kept = this.finish.kind === "max-tokens" ? all.map((block) => block.type !== "tool-call") : void 0;
    const blocks = kept === void 0 ? all : all.filter((_, position) => kept[position]);
    const envelope = this._replayState;
    if (envelope?.blocks === void 0) return { blocks, replay: envelope };
    if (envelope.blocks.length !== all.length) return { blocks, replay: void 0 };
    return {
      blocks,
      replay: kept === void 0 || blocks.length === all.length ? envelope : { response: envelope.response, blocks: envelope.blocks.filter((_, position) => kept[position]) }
    };
  }
  /**
   * Assemble all blocks seen so far, in stream order.
   * @returns one block per seen index, except that max-token truncation drops
   *   tool calls that cannot be executed safely; an open block assembles from
   *   its accumulated deltas (an unknown block type never closed by `block-end` throws).
   */
  blocks() {
    return this.assembled().blocks;
  }
  /** Usage from the `usage` chunk; undefined until one arrives. */
  get usage() {
    return this._usage;
  }
  /** Finish reason from the `finish` chunk; `{kind: 'stop'}` when the stream ended without one. */
  get finish() {
    return this._finish ?? { kind: "stop" };
  }
  /**
   * Replay metadata from the terminal finish chunk, if any, with per-block
   * entries pruned in step with {@link blocks}. Undefined when the envelope's
   * entries do not align with the emitted blocks.
   */
  get replayState() {
    return this.assembled().replay;
  }
  /**
   * The assembled assistant message.
   * @param source - producer attribution for the assembled message.
   * @returns a frozen assistant-role message over `blocks()` (same open-block assembly rules).
   */
  message(source = { kind: "plugin", plugin: "dsh-llm/assembler" }) {
    return createMessage({ role: "assistant", content: this.blocks(), source });
  }
};

// ../../source/deepseek-harness/packages/llm/llm/src/index.ts
var LlmError = class extends HarnessError {
  /** Serializable facts retained beside this live Error. */
  failure;
  /**
   * @param message - non-empty human-readable failure summary.
   * @param code - non-empty stable provider-neutral machine code.
   * @param options - optional cause and validated serializable provider facts.
   */
  constructor(message, code, options) {
    if (typeof message !== "string" || message.length === 0) throw new Error("LlmError message must be a non-empty string");
    if (typeof code !== "string" || code.length === 0) throw new Error("LlmError code must be a non-empty string");
    if (options?.status !== void 0 && (!Number.isInteger(options.status) || options.status < 100 || options.status > 599)) {
      throw new Error("LlmError status must be an integer from 100 through 599");
    }
    if (options?.providerRetryAfterMs !== void 0 && (!Number.isFinite(options.providerRetryAfterMs) || options.providerRetryAfterMs <= 0)) {
      throw new Error("LlmError providerRetryAfterMs must be a positive finite number");
    }
    if (options?.requestId !== void 0 && (typeof options.requestId !== "string" || options.requestId.length === 0)) {
      throw new Error("LlmError requestId must be a non-empty string");
    }
    super(message, code, options);
    this.name = "LlmError";
    this.failure = Object.freeze({
      message,
      code,
      ...options?.status === void 0 ? {} : { status: options.status },
      ...options?.providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs: options.providerRetryAfterMs },
      ...options?.requestId === void 0 ? {} : { requestId: options.requestId }
    });
  }
};
var LlmRuntime = class extends Service {
  adapters = /* @__PURE__ */ new Map();
  directory = /* @__PURE__ */ new Map();
  discoveries = /* @__PURE__ */ new Map();
  constructor(ctx) {
    super(ctx, "llm");
  }
  /** Notify topology observers without letting one broken listener veto the commit. */
  emitAdaptersUpdated() {
    let invariantFailure;
    for (const listener of this.ctx.events.dispatch("emit", ["llm/adapters-updated"])) {
      try {
        const returned = listener();
        if (returned != null && typeof returned.then === "function") {
          void Promise.resolve(returned).then(void 0, (error) => {
            this.warnAdaptersListenerFailure(error);
          });
        }
      } catch (error) {
        if (error?.code === "INVARIANT") {
          invariantFailure ??= error;
          continue;
        }
        this.warnAdaptersListenerFailure(error);
      }
    }
    if (invariantFailure !== void 0) throw invariantFailure;
  }
  /** Contained-listener diagnostic shared by the sync and async failure paths. */
  warnAdaptersListenerFailure(error) {
    this.ctx.logger.warn("llm: an llm/adapters-updated listener failed");
    this.ctx.logger.warn(error);
  }
  /**
   * Register an adapter for the given provider routes. Throws `LlmError` with code
   * `DUPLICATE_ADAPTER` if any provider already has an adapter (all-or-nothing).
   * Disposed with the fiber.
   * @param providers - every provider route this adapter should serve.
   * @param adapter - the adapter that streams calls for those providers.
   * @returns the disposer, carrying {@link AdapterRegistrationHandle.replace}.
   */
  registerAdapter(providers, adapter) {
    const owned = /* @__PURE__ */ new Set();
    let released = false;
    const dispose = this.ctx.effect(function* () {
      if (providers.length === 0) throw new LlmError("an adapter must register at least one provider", "INVALID_ADAPTER");
      this.commitRoutes(owned, this.prepareRoutes(providers, adapter, owned));
      yield () => {
        released = true;
        for (const provider of owned) this.adapters.delete(provider);
        owned.clear();
        this.emitAdaptersUpdated();
      };
    }.bind(this), "llm.registerAdapter()");
    const handle = (() => void dispose());
    handle.replace = (next) => {
      if (released) {
        throw new LlmError("a disposed adapter registration cannot replace its routes", "REGISTRATION_DISPOSED");
      }
      this.commitRoutes(owned, this.prepareRoutes(next, adapter, owned));
    };
    return handle;
  }
  /**
   * Validate one candidate route set for `adapter`, treating routes this
   * registration already holds as available. Nothing is mutated: a rejected
   * candidate leaves the registry exactly as it was.
   */
  prepareRoutes(providers, adapter, owned) {
    const unique = /* @__PURE__ */ new Set();
    const registrations = [];
    for (const provider of providers) {
      if (provider.length === 0) throw new LlmError("adapter provider names must be non-empty", "INVALID_ADAPTER");
      if (unique.has(provider) || this.adapters.has(provider) && !owned.has(provider)) {
        throw new LlmError(`an adapter for provider "${provider}" is already registered`, "DUPLICATE_ADAPTER");
      }
      const info = adapter.providerInfo(provider);
      if (typeof info.id !== "string" || info.id !== provider || typeof info.name !== "string" || info.name.length === 0) {
        throw new LlmError(`adapter metadata for provider "${provider}" must preserve its id and have a non-empty name`, "INVALID_ADAPTER");
      }
      unique.add(provider);
      const retryPolicy = adapter.providerRetryPolicy(provider) ?? resolveRetryPolicy(void 0, `llm: provider "${provider}" retryPolicy`);
      registrations.push({
        adapter,
        provider: { id: info.id, name: info.name },
        retryPolicy
      });
    }
    return registrations;
  }
  /**
   * Swap this registration's routes for the prepared ones in one synchronous
   * section, so no observer can see the registry between the release and the
   * re-registration. The route set's one mutation point is also where
   * `llm/adapters-updated` is published, so a `replace` announces itself
   * exactly like a first registration.
   */
  commitRoutes(owned, registrations) {
    for (const provider of owned) this.adapters.delete(provider);
    owned.clear();
    for (const registration of registrations) {
      this.adapters.set(registration.provider.id, registration);
      owned.add(registration.provider.id);
    }
    this.emitAdaptersUpdated();
  }
  /**
   * Describe provider routes with a registered adapter.
   * @returns detached provider metadata in registration order.
   */
  listProviders() {
    return [...this.adapters.values()].map(({ provider }) => ({ ...provider }));
  }
  /**
   * Declare provider routes an adapter plugin can activate through
   * configuration. Registration is all-or-nothing: an empty list, invalid
   * entry, or a provider already declared by any registration throws
   * `LlmError` without registering the rest. Disposed with the fiber.
   * @param entries - every configurable provider this plugin owns.
   * @returns a handle that withdraws all of them, and can atomically replace them.
   */
  registerConfigurableProviders(entries) {
    let held = [];
    let disposed = false;
    const commit = (candidates) => {
      const detached = [];
      const own = new Set(held.map((entry) => entry.provider));
      for (const entry of candidates) {
        if (entry.provider.length === 0 || entry.displayName.length === 0 || entry.settingsNs.length === 0) {
          throw new LlmError("configurable providers need a non-empty provider, displayName, and settingsNs", "INVALID_DIRECTORY");
        }
        if (entry.settingsPath.some((segment) => segment.length === 0)) {
          throw new LlmError(`configurable provider "${entry.provider}" has an empty settingsPath segment`, "INVALID_DIRECTORY");
        }
        if (this.directory.has(entry.provider) && !own.has(entry.provider) || detached.some((seen) => seen.provider === entry.provider)) {
          throw new LlmError(`configurable provider "${entry.provider}" is already declared`, "DUPLICATE_DIRECTORY");
        }
        detached.push({ ...entry, settingsPath: [...entry.settingsPath] });
      }
      for (const entry of held) this.directory.delete(entry.provider);
      for (const entry of detached) this.directory.set(entry.provider, entry);
      held = detached;
      this.emitAdaptersUpdated();
    };
    const dispose = this.ctx.effect(function* () {
      if (entries.length === 0) {
        throw new LlmError("a configurable-provider registration must declare at least one provider", "INVALID_DIRECTORY");
      }
      commit(entries);
      yield () => {
        disposed = true;
        for (const entry of held) this.directory.delete(entry.provider);
        held = [];
        this.emitAdaptersUpdated();
      };
    }.bind(this), "llm.registerConfigurableProviders()");
    const handle = (() => void dispose());
    handle.replace = (next) => {
      if (disposed) {
        throw new LlmError("this configurable-provider registration was disposed", "REGISTRATION_DISPOSED");
      }
      commit(next);
    };
    return handle;
  }
  /**
   * List every declared configurable provider, registered or dormant.
   * @returns detached directory entries in declaration order.
   */
  listConfigurableProviders() {
    return [...this.directory.values()].map((entry) => ({ ...entry, settingsPath: [...entry.settingsPath] }));
  }
  /**
   * Offer to interrogate provider endpoints on behalf of the settings
   * namespace this plugin owns. The namespace is the key because that is what
   * a configuration surface already holds from the configurable-provider
   * directory, and because a provider being *added* has no route to name yet.
   * Disposed with the fiber.
   * @param settingsNs - the namespace whose profiles this discovery serves.
   * @param discover - interrogates one endpoint; must honor `request.signal`.
   * @returns the disposer that withdraws the offer.
   */
  registerModelDiscovery(settingsNs, discover) {
    const dispose = this.ctx.effect(function* () {
      if (settingsNs.length === 0) {
        throw new LlmError("model discovery needs a non-empty settings namespace", "INVALID_DISCOVERY");
      }
      if (this.discoveries.has(settingsNs)) {
        throw new LlmError(`model discovery for "${settingsNs}" is already registered`, "DUPLICATE_DISCOVERY");
      }
      this.discoveries.set(settingsNs, discover);
      yield () => {
        this.discoveries.delete(settingsNs);
      };
    }.bind(this), "llm.registerModelDiscovery()");
    return () => void dispose();
  }
  /**
   * Interrogate one provider endpoint for the models it advertises. The
   * request describes a draft, not a stored route, so nothing here reads or
   * writes settings or credentials — the caller owns both, and the reply is
   * candidate metadata a surface may offer for adoption.
   * @param settingsNs - namespace whose registered discovery serves this draft.
   * @param request - the endpoint, protocol, and one-shot credential to use.
   * @returns the advertised models, deduplicated in endpoint order.
   */
  async discoverModels(settingsNs, request) {
    const discover = this.discoveries.get(settingsNs);
    if (discover === void 0) {
      throw new LlmError(`no model discovery is registered for "${settingsNs}"`, "NO_DISCOVERY");
    }
    if ((request.provider ?? "").length === 0 && (request.baseURL ?? "").length === 0) {
      throw new LlmError("model discovery needs a provider route or a baseURL", "INVALID_DISCOVERY");
    }
    const discovered = await discover(request);
    const seen = /* @__PURE__ */ new Set();
    const models = [];
    for (const model of discovered) {
      if (typeof model.id !== "string" || model.id.length === 0 || seen.has(model.id)) continue;
      seen.add(model.id);
      models.push({
        id: model.id,
        ...model.name === void 0 ? {} : { name: model.name },
        ...model.contextWindow === void 0 ? {} : { contextWindow: model.contextWindow },
        ...model.maxTokens === void 0 ? {} : { maxTokens: model.maxTokens }
      });
    }
    return models;
  }
  /**
   * Resolve the retry policy captured when one provider route was registered.
   * @param provider - registered provider route to inspect.
   * @returns the provider-owned policy, with normal defaults already resolved.
   */
  providerRetryPolicy(provider) {
    return this.registration(provider).retryPolicy;
  }
  /** Detach typed adapter-owned modality metadata. */
  detachedModalities(modalities) {
    return modalities === void 0 ? void 0 : [...modalities];
  }
  /**
   * Discover models advertised by one registered provider. Catalog membership
   * is advisory and never changes routing or request validation.
   * @param provider - registered provider route to inspect.
   * @returns detached model metadata in adapter-preferred order.
   */
  async listModels(provider) {
    const adapter = this.registration(provider).adapter;
    const models = await adapter.listModels(provider);
    const seen = /* @__PURE__ */ new Set();
    return models.map((model) => {
      if (typeof model.provider !== "string" || model.provider !== provider || typeof model.id !== "string" || model.id.length === 0 || typeof model.name !== "string" || model.name.length === 0 || model.description !== void 0 && typeof model.description !== "string" || seen.has(model.id)) {
        throw new LlmError(`adapter returned invalid or duplicate model metadata for provider "${provider}"`, "INVALID_CATALOG");
      }
      seen.add(model.id);
      const inputModalities = this.detachedModalities(model.inputModalities);
      return {
        provider: model.provider,
        id: model.id,
        name: model.name,
        ...model.description === void 0 ? {} : { description: model.description },
        ...inputModalities === void 0 ? {} : { inputModalities }
      };
    });
  }
  /**
   * Resolve and validate all metadata from the adapter that owns one exact
   * route. The result is detached from adapter-owned objects; catalog
   * membership remains advisory and does not control request routing.
   * @param provider - registered provider route to inspect.
   * @param model - exact model id passed to the adapter.
   * @param signal - optional cancellation for adapter-owned asynchronous lookup.
   * @returns exact model identity plus available context and reasoning metadata.
   */
  async resolveModelInfo(provider, model, signal) {
    return this.resolveModelInfoFor(this.registration(provider), model, signal);
  }
  async resolveModelInfoFor(registration, model, signal) {
    const provider = registration.provider.id;
    const resolved = await registration.adapter.resolveModel(provider, model, signal);
    if (typeof resolved.provider !== "string" || resolved.provider !== provider || typeof resolved.id !== "string" || resolved.id !== model || typeof resolved.name !== "string" || resolved.name.length === 0 || resolved.description !== void 0 && typeof resolved.description !== "string") {
      throw new LlmError(
        `adapter returned invalid exact model metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_INFO"
      );
    }
    const context = resolved.context;
    if (context !== void 0 && (!Number.isInteger(context.contextWindow) || context.contextWindow <= 0)) {
      throw new LlmError(
        `adapter returned invalid context metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_CONTEXT"
      );
    }
    const inputModalities = this.detachedModalities(resolved.inputModalities);
    const defaultMaxTokens = resolved.defaultMaxTokens;
    if (defaultMaxTokens !== void 0 && (!Number.isSafeInteger(defaultMaxTokens) || defaultMaxTokens <= 0)) {
      throw new LlmError(
        `adapter returned invalid default maxTokens for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_MAX_TOKENS"
      );
    }
    const info = {
      provider,
      id: model,
      name: resolved.name,
      ...resolved.description === void 0 ? {} : { description: resolved.description },
      ...inputModalities === void 0 ? {} : { inputModalities },
      ...context === void 0 ? {} : { context: { contextWindow: context.contextWindow } },
      ...defaultMaxTokens === void 0 ? {} : { defaultMaxTokens }
    };
    const reasoning = resolved.reasoning;
    if (reasoning === void 0) return info;
    if (reasoning.efforts.length === 0) {
      throw new LlmError(
        `adapter returned invalid reasoning metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_REASONING"
      );
    }
    const seen = /* @__PURE__ */ new Set();
    const efforts = reasoning.efforts.map((effort) => {
      if (typeof effort.id !== "string" || effort.id.length === 0 || typeof effort.name !== "string" || effort.name.length === 0 || effort.description !== void 0 && typeof effort.description !== "string" || seen.has(effort.id)) {
        throw new LlmError(
          `adapter returned invalid or duplicate reasoning effort metadata for provider "${provider}" model "${model}"`,
          "INVALID_MODEL_REASONING"
        );
      }
      seen.add(effort.id);
      return {
        id: effort.id,
        name: effort.name,
        ...effort.description === void 0 ? {} : { description: effort.description }
      };
    });
    if (reasoning.defaultEffort !== void 0 && !seen.has(reasoning.defaultEffort)) {
      throw new LlmError(
        `adapter returned an unknown default reasoning effort for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_REASONING"
      );
    }
    return {
      ...info,
      reasoning: {
        efforts,
        ...reasoning.defaultEffort === void 0 ? {} : { defaultEffort: reasoning.defaultEffort }
      }
    };
  }
  /**
   * Validate a conversation call config against its exact model capability and
   * materialize adapter-configured defaults. Unsupported explicit efforts
   * reject before provider I/O; no clamping or aliasing is performed. This
   * standalone query does not bind a later dispatch; use {@link prepareCall}
   * when logging and streaming must share one adapter registration.
   * @param config - provider/model route and optional request controls.
   * @param signal - optional cancellation for adapter-owned capability lookup.
   * @returns a detached config only when a default must be materialized.
   */
  async resolveCallConfig(config, signal) {
    return (await this.resolveCallFor(this.registration(config.provider), config, signal)).config;
  }
  async resolveCallFor(registration, config, signal) {
    const info = await this.resolveModelInfoFor(registration, config.model, signal);
    const defaulted = config.maxTokens === void 0 && info.defaultMaxTokens !== void 0 ? { ...config, maxTokens: info.defaultMaxTokens } : config;
    const reasoning = info.reasoning;
    const requested = defaulted.reasoningEffort;
    let resolvedConfig = defaulted;
    if (reasoning === void 0) {
      if (requested !== void 0) {
        throw new LlmError(
          `provider "${config.provider}" model "${config.model}" does not support reasoning effort "${requested}"`,
          "UNSUPPORTED_REASONING_EFFORT"
        );
      }
    } else {
      const effective = requested ?? reasoning.defaultEffort;
      if (effective !== void 0) {
        if (!reasoning.efforts.some((effort) => effort.id === effective)) {
          throw new LlmError(
            `provider "${config.provider}" model "${config.model}" does not support reasoning effort "${effective}"`,
            "UNSUPPORTED_REASONING_EFFORT"
          );
        }
        if (requested !== effective) resolvedConfig = { ...defaulted, reasoningEffort: effective };
      }
    }
    return {
      config: resolvedConfig,
      ...info.context === void 0 ? {} : { context: info.context }
    };
  }
  /**
   * Resolve one call under its current adapter registration. The returned
   * one-shot handle keeps that registration across header logging and dispatch,
   * so HMR cannot combine one adapter's capability result with another adapter.
   * @param config - provider/model route and optional request controls.
   * @param signal - optional cancellation for adapter-owned capability lookup.
   * @returns a prepared config and its registration-bound stream entry point.
   */
  async prepareCall(config, signal) {
    const registration = this.registration(config.provider);
    const resolved = await this.resolveCallFor(registration, config, signal);
    const resolvedConfig = deepFreeze(structuredClone(resolved.config));
    const context = resolved.context === void 0 ? void 0 : deepFreeze(structuredClone(resolved.context));
    const adapterDefaults = deepFreeze({
      ...config.reasoningEffort === void 0 && resolvedConfig.reasoningEffort !== void 0 ? { reasoningEffort: true } : {},
      ...config.maxTokens === void 0 && resolvedConfig.maxTokens !== void 0 ? { maxTokens: true } : {}
    });
    let dispatched = false;
    return Object.freeze({
      config: resolvedConfig,
      retryPolicy: registration.retryPolicy,
      adapterDefaults,
      ...context === void 0 ? {} : { context },
      stream: (options) => {
        if (dispatched) {
          throw new LlmError("a prepared LLM call can only be dispatched once", "INVALID_PREPARED_CALL");
        }
        if (!callConfigEquals(options, resolvedConfig)) {
          throw new LlmError(
            "prepared LLM call config changed before adapter dispatch",
            "INVALID_PREPARED_CALL"
          );
        }
        dispatched = true;
        return this.streamWithRegistration(options, { registration, config: resolvedConfig });
      }
    });
  }
  registration(provider) {
    const registration = this.adapters.get(provider);
    if (!registration) throw new LlmError(`no adapter registered for provider "${provider}"`, "NO_ADAPTER");
    return registration;
  }
  /** Remove replay state whose historical route is owned by another adapter. */
  forAdapter(options, adapter) {
    const messages = options.messages.map((message) => {
      const source = message.source;
      if (message.role !== "assistant" || source.kind !== "model" || source.replayState === void 0) return message;
      if (this.adapters.get(source.provider)?.adapter === adapter) return message;
      return freezeMessage({
        ...message,
        source: { kind: "model", provider: source.provider, model: source.model }
      });
    });
    if (messages.every((message, index) => message === options.messages[index])) return options;
    const filtered = { ...options, messages };
    return Object.isFrozen(options) ? deepFreeze(filtered) : filtered;
  }
  /**
   * Final adapter boundary. Adapter selection, dispatch, iterator construction,
   * and iteration failures become one terminal failure chunk. Middleware and
   * downstream consumer failures remain thrown plugin or consumer errors.
   */
  async *adapterStream(options, prepared) {
    let iterator;
    try {
      const registration = prepared?.registration ?? this.registration(options.provider);
      const resolvedConfig = prepared === void 0 ? (await this.resolveCallFor(registration, options, options.signal)).config : prepared.config;
      if (prepared !== void 0 && !callConfigEquals(options, resolvedConfig)) {
        throw new LlmError(
          "prepared LLM call config changed before adapter dispatch",
          "INVALID_PREPARED_CALL"
        );
      }
      const resolvedOptions = callConfigEquals(options, resolvedConfig) ? options : Object.isFrozen(options) ? deepFreeze({ ...options, ...resolvedConfig }) : { ...options, ...resolvedConfig };
      const adapter = registration.adapter;
      const stream = adapter.stream(this.forAdapter(resolvedOptions, adapter));
      iterator = stream[Symbol.asyncIterator]();
    } catch (error) {
      yield adapterFailureChunk(error, options.signal);
      return;
    }
    let completed = false;
    try {
      while (true) {
        let item;
        try {
          const next = await iterator.next();
          item = next.done ? { done: true } : { done: false, value: next.value };
        } catch (error) {
          completed = true;
          yield adapterFailureChunk(error, options.signal);
          return;
        }
        if (item.done) {
          completed = true;
          return;
        }
        yield item.value;
      }
    } finally {
      if (!completed) {
        const close = iterator.return?.bind(iterator);
        if (close) await close();
      }
    }
  }
  /**
   * Stream one model call as raw chunks (token-level deltas). Replay state is
   * retained only when the same adapter instance owns its historical provider
   * and the target provider. Final adapter selection remains fixed through
   * asynchronous exact-model resolution and dispatch. Adapter selection,
   * dispatch, and iteration failures become terminal `error` or `aborted`
   * finish chunks; middleware, nested-call, cleanup, and consumer failures
   * remain thrown.
   * @param options - the full request; `options.provider` selects the adapter.
   * @returns the chunk stream, possibly wrapped by `llm/stream` listeners.
   */
  stream(options) {
    return this.streamWithRegistration(options);
  }
  streamWithRegistration(options, prepared) {
    return this.ctx.waterfall(
      this,
      "llm/stream",
      options,
      () => this.adapterStream(options, prepared)
    );
  }
};
function adapterFailureChunk(error, signal) {
  const failure = normalizeLlmFailure(error);
  return {
    type: "finish",
    reason: signal?.aborted || failure.code === "ABORTED" ? { kind: "aborted", failure } : { kind: "error", failure }
  };
}
var src_default3 = LlmRuntime;

// ../../source/deepseek-harness/packages/core/session/src/index.ts
import { isAbsolute } from "node:path";

// ../../source/deepseek-harness/packages/core/scope/src/store.ts
var NamedEntries = class {
  constructor(duplicateError) {
    this.duplicateError = duplicateError;
  }
  duplicateError;
  data = /* @__PURE__ */ new Map();
  /**
   * Insert one unique name.
   * @param name - name unique within this table.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo that removes only this insertion.
   */
  insert(name15, value) {
    const data = this.data;
    if (data.has(name15)) throw this.duplicateError(name15);
    data.set(name15, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(name15);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Read one named value.
   * @param name - name to resolve.
   * @returns the retained value, or `undefined` when absent.
   */
  get(name15) {
    return this.data.get(name15);
  }
  /**
   * Test one name for membership.
   * @param name - name to test.
   * @returns whether the table contains that name.
   */
  has(name15) {
    return this.data.has(name15);
  }
  /**
   * Iterate live names in insertion order.
   * @returns the native live key iterator.
   */
  keys() {
    return this.data.keys();
  }
  /**
   * Iterate live entries in insertion order.
   * @returns the native live entry iterator.
   */
  entries() {
    return this.data.entries();
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var AnonymousEntries = class {
  data = /* @__PURE__ */ new Map();
  /**
   * Append one independently owned value.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo for this exact append.
   */
  append(value) {
    const data = this.data;
    const key = /* @__PURE__ */ Symbol();
    data.set(key, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(key);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var ScopedLayers = class {
  constructor(createLayer, onChange) {
    this.createLayer = createLayer;
    this.onChange = onChange;
    this.global = createLayer(void 0);
  }
  createLayer;
  onChange;
  /** The eagerly constructed context-global layer. */
  global;
  scoped = /* @__PURE__ */ new Map();
  /**
   * Read an existing exact-scope overlay. Deliberately chain-blind: callers
   * addressing one scope's OWN contributions (its restrictions, its guards)
   * must not silently pick up an ancestor's — use {@link chainLayers} where
   * inheritance is the point.
   * @param scope - exact scope key; `undefined` denotes no overlay.
   * @returns the existing scoped layer, or `undefined` without creating one.
   */
  peek(scope2) {
    if (scope2 === void 0) return void 0;
    return this.scoped.get(scope2);
  }
  /**
   * Existing overlays along the scope's parent chain ({@link scopeChainOf}),
   * farthest ancestor first and the exact scope last, so a caller layering
   * them in order gives the nearest scope the final word.
   * @param scope - viewing scope, or `undefined` for no overlays.
   * @returns the existing layers, nearest last; absent overlays are skipped.
   */
  chainLayers(scope2) {
    const layers = [];
    for (const key of scopeChainOf(scope2).reverse()) {
      const layer = this.scoped.get(key);
      if (layer !== void 0) layers.push(layer);
    }
    return layers;
  }
  /**
   * Materialize global named entries followed by scope-chain shadows,
   * farthest ancestor first, so the nearest scope's entry wins a name.
   * @param scope - viewing scope, or `undefined` for the global view.
   * @param pick - select the named table from a layer.
   * @returns an insertion-ordered effective map.
   */
  merge(scope2, pick2) {
    const merged = new Map(pick2(this.global).entries());
    for (const layer of this.chainLayers(scope2)) {
      for (const [name15, value] of pick2(layer).entries()) merged.set(name15, value);
    }
    return merged;
  }
  /**
   * Attach one synchronous layer mutation to its registration context.
   * @param ctx - context that determines both scope visibility and effect ownership.
   * @param action - atomic mutation returning its synchronous undo.
   * @param options - Cordis effect label and optional change notification.
   * @returns the exact disposer returned by `ctx.effect()`.
   */
  effect(ctx, action, options) {
    const scope2 = scopeOf(ctx);
    const notify = options.notify ?? true;
    const dispose = ctx.effect(function* () {
      let layer;
      let created = false;
      if (scope2 === void 0) {
        layer = this.global;
      } else {
        const existing = this.scoped.get(scope2);
        if (existing === void 0) {
          layer = this.createLayer(scope2);
          this.scoped.set(scope2, layer);
          created = true;
        } else {
          layer = existing;
        }
      }
      let undo;
      try {
        undo = action(layer);
      } catch (error) {
        if (scope2 !== void 0 && created && layer.isEmpty()) this.scoped.delete(scope2);
        throw error;
      }
      yield () => {
        undo();
        if (scope2 !== void 0 && layer.isEmpty()) this.scoped.delete(scope2);
        if (notify) this.onChange();
      };
      if (notify) this.onChange();
    }.bind(this), options.label);
    return dispose;
  }
};

// ../../source/deepseek-harness/packages/core/scope/src/index.ts
var kScope = /* @__PURE__ */ Symbol("dsh.scope");
var carrierKeys = /* @__PURE__ */ new WeakMap();
var scopeParents = /* @__PURE__ */ new WeakMap();
function linkScopeParent(key, parent) {
  for (let cursor = parent; cursor !== void 0; cursor = scopeParents.get(cursor)) {
    if (cursor === key) throw new Error("dsh-scope: scope parent link would form a cycle");
  }
  scopeParents.set(key, parent);
}
function bindScopeParent(key, parent) {
  if (scopeParents.has(key)) {
    throw new Error("dsh-scope: scope key is already bound to a parent; re-linking requires the binding returned by the original bind");
  }
  linkScopeParent(key, parent);
  return {
    rebind(next) {
      linkScopeParent(key, next);
    }
  };
}
function scopeChainOf(key) {
  const chain = [];
  for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) chain.push(cursor);
  return chain;
}
async function quiesceFiber(fiber) {
  await Promise.resolve(fiber.dispose());
  while (fiber.inertia !== void 0) await fiber.inertia;
}
function scope() {
}
function createScope(ctx, key, options) {
  if (options?.parent !== void 0) bindScopeParent(key, options.parent);
  const fiber = ctx.plugin(scope);
  const scoped = fiber.ctx.extend({ [kScope]: key });
  let disposing;
  return {
    ctx: scoped,
    rawDispose: fiber.dispose,
    dispose: () => disposing ??= quiesceFiber(fiber)
  };
}
function scopeOf(ctx) {
  return ctx[kScope];
}
function scopeTarget(base, key) {
  const baseFilter = base[Context.filter];
  const carrier = {
    [Context.filter](ctx) {
      if (baseFilter !== void 0 && !baseFilter.call(base, ctx)) return false;
      const tag = scopeOf(ctx);
      if (tag === void 0) return true;
      for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) {
        if (cursor === tag) return true;
      }
      return false;
    }
  };
  carrierKeys.set(carrier, key);
  return carrier;
}
function isScopeCarrier(value) {
  return typeof value === "object" && value !== null && carrierKeys.has(value);
}
function carrierKeyOf(value) {
  if (!isScopeCarrier(value)) return void 0;
  return carrierKeys.get(value);
}

// ../../source/deepseek-harness/packages/core/session/src/types.ts
function SessionId(id) {
  return id;
}
var SESSION_FORMAT_VERSION = 0;

// ../../source/deepseek-harness/packages/core/session/src/json.ts
function hasIntrinsicConstructor(prototype, name15) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name15 && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === `function ${name15}() { [native code] }`;
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor(value, "Object");
}
function hasPlainArrayPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype(objectPrototype);
}
function hasPlainObjectPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype(prototype);
}
function enumerableStringKeys(value) {
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(value, key))) return void 0;
  return keys;
}
function walkJsonValue(value, detach) {
  const ancestors = /* @__PURE__ */ new Set();
  let root;
  const assign = (destination, item) => {
    if (destination === void 0) return;
    if (destination.kind === "root") {
      root = item;
    } else if (destination.kind === "array") {
      destination.target[destination.index] = item;
    } else {
      Object.defineProperty(destination.target, destination.key, {
        value: item,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
  };
  const tasks = [{
    kind: "visit",
    value,
    ...detach ? { destination: { kind: "root" } } : {}
  }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      ancestors.delete(task.source);
      continue;
    }
    if (task.kind === "array-item") {
      if (!Object.prototype.hasOwnProperty.call(task.source, task.index)) return void 0;
      tasks.push({
        kind: "visit",
        value: task.source[task.index],
        ...task.target === void 0 ? {} : { destination: { kind: "array", target: task.target, index: task.index } }
      });
      continue;
    }
    if (task.kind === "object-property") {
      tasks.push({
        kind: "visit",
        value: task.source[task.key],
        ...task.target === void 0 ? {} : { destination: { kind: "object", target: task.target, key: task.key } }
      });
      continue;
    }
    const current = task.value;
    if (current === null) {
      assign(task.destination, null);
      continue;
    }
    if (typeof current === "boolean" || typeof current === "string") {
      assign(task.destination, current);
      continue;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current) || Object.is(current, -0)) return void 0;
      assign(task.destination, current);
      continue;
    }
    if (typeof current !== "object") return void 0;
    if (ancestors.has(current)) return void 0;
    if (Array.isArray(current)) {
      if (!hasPlainArrayPrototype(current)) return void 0;
      const length = current.length;
      if (Reflect.ownKeys(current).length !== length + 1) return void 0;
      const target2 = detach ? [] : void 0;
      if (target2 !== void 0) assign(task.destination, target2);
      ancestors.add(current);
      tasks.push({ kind: "leave", source: current });
      for (let index = length - 1; index >= 0; index--) {
        tasks.push({ kind: "array-item", source: current, index, ...target2 === void 0 ? {} : { target: target2 } });
      }
      continue;
    }
    if (!hasPlainObjectPrototype(current)) return void 0;
    const keys = enumerableStringKeys(current);
    if (keys === void 0) return void 0;
    const target = detach ? {} : void 0;
    if (target !== void 0) assign(task.destination, target);
    ancestors.add(current);
    tasks.push({ kind: "leave", source: current });
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) return void 0;
      tasks.push({ kind: "object-property", source: current, key, ...target === void 0 ? {} : { target } });
    }
  }
  return detach ? root : true;
}
function snapshotJsonValue(value) {
  return walkJsonValue(value, true);
}
function isJsonValue(value) {
  return walkJsonValue(value, false) === true;
}

// ../../source/deepseek-harness/packages/core/session/src/surface.ts
var SURFACE_EVENT_TYPES = /* @__PURE__ */ new Set([
  "user/message",
  "assistant/message",
  "tool/result"
]);
function isSurfaceEligibleType(type) {
  return SURFACE_EVENT_TYPES.has(type);
}
function isSurfaceEvent(event) {
  if (!SURFACE_EVENT_TYPES.has(event.type)) return false;
  return event.surfaceOp !== void 0;
}
function isReplacementSurfaceEvent(event) {
  return isSurfaceEvent(event) && event.surfaceOp !== "append";
}
function deriveEventMessage(event) {
  switch (event.type) {
    // Ordinary prompts and injected context project in user role: the event's
    // model-facing content stays verbatim. Do NOT re-add per-type framing
    // (e.g. `<context>`) here: framing is caller-owned — a producer bakes it
    // into `content`, as agent-instructions does with `<system-reminder>` — or,
    // if reintroduced, must be driven by the event `meta` map and a dedicated
    // renderer, keeping this projection a verbatim pass-through. See the
    // deferred design note in
    // ../../../../.agents/notes/implemented/simplification/2026-07-20-unwrap-injected-content-envelopes.md
    case "user/message": {
      return event.data;
    }
    case "assistant/message": {
      if (event.data.message.content.length === 0) return null;
      return event.data.message;
    }
    case "tool/result": {
      return event.data.message;
    }
    default:
      return null;
  }
}
function createFoldState() {
  return { nodes: [], replaceGeneration: 0 };
}
function isEventSeq(value) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function isReplaceOp(value) {
  const op = value;
  return Object.keys(op).length === 3 && Object.hasOwn(op, "op") && Object.hasOwn(op, "start") && Object.hasOwn(op, "end") && op["op"] === "replace" && isEventSeq(op["start"]) && isEventSeq(op["end"]);
}
function surfaceOpOf(event) {
  const raw = event;
  if (!isSurfaceEligibleType(event.type)) {
    if (raw.surfaceOp !== void 0) {
      throw new Error(`session event "${event.type}" is not surface-eligible and cannot carry surfaceOp`);
    }
    if (raw.sourceEventSeqs !== void 0) {
      throw new Error(`session event "${event.type}" is not surface-eligible and cannot carry sourceEventSeqs`);
    }
    return;
  }
  const op = raw.surfaceOp;
  if (op === void 0) {
    throw new Error(`session event "${event.type}" is surface-eligible and requires a surfaceOp marker`);
  }
  if (op === "append") return op;
  if (op === null || typeof op !== "object" || Array.isArray(op)) {
    throw new Error(`session event "${event.type}" carries an invalid surfaceOp`);
  }
  if (!isReplaceOp(op)) {
    throw new Error(`session event "${event.type}" carries an invalid replace surfaceOp`);
  }
  return op;
}
function assertProvenance(event, shadowedSeqs) {
  const raw = event.sourceEventSeqs;
  const sources = /* @__PURE__ */ new Set();
  if (raw !== void 0) {
    if (!Array.isArray(raw)) {
      throw new Error(`sourceEventSeqs on event at seq ${event.seq} must be an array when present`);
    }
    if (raw.length === 0 && event.type !== "assistant/message") {
      throw new Error("sourceEventSeqs must not be empty except on assistant/message");
    }
    let nonEarlierSource;
    for (const source of raw) {
      if (!isEventSeq(source)) {
        throw new Error(`session event "${event.type}" sourceEventSeqs must densely contain non-negative safe integers`);
      }
      sources.add(source);
      if (nonEarlierSource === void 0 && source >= event.seq) nonEarlierSource = source;
    }
    if (sources.size !== raw.length) {
      throw new Error("sourceEventSeqs must not contain duplicates");
    }
    if (nonEarlierSource !== void 0) {
      throw new Error(`sourceEventSeqs must reference earlier events: ${nonEarlierSource} >= current seq ${event.seq}`);
    }
  }
  const missing = shadowedSeqs.filter((seq) => !sources.has(seq));
  if (missing.length > 0) {
    throw new Error(`surface replace: sourceEventSeqs must include every shadowed surface node; missing ${missing.join(", ")}`);
  }
}
function replacementRange(state, op) {
  const startIdx = state.nodes.indexOf(op.start);
  if (startIdx === -1) {
    throw new Error(`surface replace: start seq ${op.start} not found in surface`);
  }
  const endIdx = state.nodes.indexOf(op.end);
  if (endIdx === -1) {
    throw new Error(`surface replace: end seq ${op.end} not found in surface`);
  }
  if (startIdx > endIdx) {
    throw new Error(`surface replace: start seq ${op.start} (index ${startIdx}) is after end seq ${op.end} (index ${endIdx})`);
  }
  return {
    startIdx,
    endIdx,
    shadowedSeqs: state.nodes.slice(startIdx, endIdx + 1)
  };
}
function isDeepEqualJson(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => isDeepEqualJson(item, b[i]));
  }
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bRecord = b;
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((key) => Object.hasOwn(b, key) && isDeepEqualJson(a[key], bRecord[key]));
}
function assertToolResultRewrite(event, shadowedSeqs, events, baseSeq) {
  if (event.type !== "tool/result") return;
  if (shadowedSeqs.length !== 1) {
    throw new Error("tool/result surface replacement must rewrite exactly one current node");
  }
  for (const originalSeq of shadowedSeqs) {
    const original = events[originalSeq - baseSeq];
    if (original?.type !== "tool/result") {
      throw new Error("tool/result surface replacement must target a current tool/result");
    }
    const originalRest = { ...original.data };
    const replacementRest = { ...event.data };
    const originalResult = original.data.message.content[0];
    const replacementResult = event.data.message.content[0];
    originalRest["message"] = {
      ...original.data.message,
      content: [{ ...originalResult, content: null }]
    };
    replacementRest["message"] = {
      ...event.data.message,
      content: [{ ...replacementResult, content: null }]
    };
    if (!isDeepEqualJson(originalRest, replacementRest)) {
      throw new Error("tool/result surface replacement may change only content");
    }
  }
}
function planSurfaceEvent(state, event, expectedSeq, events, baseSeq) {
  if (event.seq !== expectedSeq) {
    throw new Error(`session event seq ${event.seq} is not contiguous; expected ${expectedSeq}`);
  }
  const surfaceOp = surfaceOpOf(event);
  if (surfaceOp === void 0) return;
  if (surfaceOp === "append") {
    assertProvenance(event, []);
    return { kind: "append", seq: event.seq };
  }
  const range = replacementRange(state, surfaceOp);
  assertProvenance(event, range.shadowedSeqs);
  assertToolResultRewrite(event, range.shadowedSeqs, events, baseSeq);
  return {
    kind: "replace",
    seq: event.seq,
    start: surfaceOp.start,
    end: surfaceOp.end,
    ...range
  };
}
function applySurfaceEvent(state, event, expectedSeq, events, baseSeq) {
  const plan = planSurfaceEvent(state, event, expectedSeq, events, baseSeq);
  return applySurfacePlan(state, plan);
}
function applySurfacePlan(state, plan) {
  if (plan?.kind === "append") {
    state.nodes.push(plan.seq);
  } else if (plan?.kind === "replace") {
    state.nodes.splice(plan.startIdx, plan.endIdx - plan.startIdx + 1, plan.seq);
    state.replaceGeneration += 1;
  }
  if (plan?.kind !== "replace") return;
  return {
    seq: plan.seq,
    start: plan.start,
    end: plan.end,
    shadowedSeqs: plan.shadowedSeqs
  };
}
var SurfaceManager = class {
  /**
   * @param log - Contiguous complete log or loaded event window.
   * @param baseSeq - Absolute sequence of the window's first event.
   */
  constructor(log, baseSeq = 0) {
    this.log = log;
    this.baseSeq = baseSeq;
    this._lastProcessedSeq = baseSeq - 1;
  }
  log;
  baseSeq;
  /** Shared transition state; replacement history is not retained. */
  _state = createFoldState();
  /** Last processed absolute seq. */
  _lastProcessedSeq;
  /** Candidate already validated by `validateNext`, pending exact log admission. */
  _pendingPlan;
  /**
   * Validate the next candidate without mutating the committed surface.
   * @param event - candidate event that has not entered the log yet.
   */
  validateNext(event) {
    if (this._lastProcessedSeq < this.baseSeq + this.log.length - 1) this._processDelta();
    const expectedSeq = this.baseSeq + this.log.length;
    this._pendingPlan = {
      event,
      expectedSeq,
      plan: planSurfaceEvent(this._state, event, expectedSeq, this.log, this.baseSeq)
    };
  }
  /** Monotonic count of folded positional replacements. */
  get replaceGeneration() {
    if (this._lastProcessedSeq < this.baseSeq + this.log.length - 1) this._processDelta();
    return this._state.replaceGeneration;
  }
  /** Surface event sequences in model-visible order. */
  get nodes() {
    if (this._lastProcessedSeq < this.baseSeq + this.log.length - 1) this._processDelta();
    return this._state.nodes;
  }
  /** Fold events appended since the previous access. */
  _processDelta() {
    const tailSeq = this.baseSeq + this.log.length - 1;
    for (let seq = this._lastProcessedSeq + 1; seq <= tailSeq; seq++) {
      const index = seq - this.baseSeq;
      const event = this.log[index];
      const pending = this._pendingPlan;
      if (pending?.event === event && pending.expectedSeq === seq) {
        applySurfacePlan(this._state, pending.plan);
      } else {
        applySurfaceEvent(this._state, event, seq, this.log, this.baseSeq);
      }
      if (pending !== void 0 && pending.expectedSeq <= seq) this._pendingPlan = void 0;
      this._lastProcessedSeq = seq;
    }
  }
};

// ../../source/deepseek-harness/packages/core/session/src/request-header.ts
function canonicalHeader(header) {
  const adapterDefaults = header.adapterDefaults;
  return {
    config: header.config,
    ...adapterDefaults?.reasoningEffort === true || adapterDefaults?.maxTokens === true ? { adapterDefaults } : {},
    ...header.system !== void 0 && header.system.length > 0 ? { system: header.system } : {},
    ...header.tools !== void 0 && header.tools.length > 0 ? { tools: header.tools } : {}
  };
}
function sameSchema(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function headerEquals(a, b) {
  if (!callConfigEquals(a.config, b.config) || a.adapterDefaults?.reasoningEffort !== b.adapterDefaults?.reasoningEffort || a.adapterDefaults?.maxTokens !== b.adapterDefaults?.maxTokens || a.system !== b.system) return false;
  const at = a.tools ?? [];
  const bt = b.tools ?? [];
  return at.length === bt.length && at.every((tool, i) => sameSchema(tool, bt[i]));
}
function foldRequestHeader(events, from2) {
  let state = from2;
  for (const event of events) {
    if (event.type === "request/header") state = canonicalHeader(event.data.header);
  }
  return state;
}

// ../../source/deepseek-harness/packages/core/session/src/preparation.ts
var SessionPreparation = class _SessionPreparation {
  constructor(session, options) {
    this.options = options;
    this.session = session;
  }
  options;
  released = false;
  /** The exact Session to use for setup and publication. */
  session;
  /**
   * Wrap an unpublished Session in one preparation lifetime.
   * @param session - exact unpublished Session.
   * @param options - optional provider release behavior.
   * @returns a preparation disposed after publication or rollback.
   */
  static create(session, options) {
    return new _SessionPreparation(session, options ?? {});
  }
  /** Release provider state once when this preparation leaves its caller. */
  [Symbol.dispose]() {
    if (this.released) return;
    this.released = true;
    this.options.release?.();
  }
};

// ../../source/deepseek-harness/packages/core/session/src/repair.ts
var TOOL_NOT_STARTED = "TOOL_NOT_STARTED";

// ../../source/deepseek-harness/packages/core/session/src/index.ts
function validateSessionHeader(id, input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("session header is not a plain JSON record");
  }
  const record = input;
  if (record.version !== SESSION_FORMAT_VERSION) {
    throw new Error(`session header version must be ${SESSION_FORMAT_VERSION}, got ${String(record.version)}`);
  }
  if (record.id !== id) {
    throw new Error(`session header id "${String(record.id)}" does not match session id "${id}"`);
  }
  if (typeof record.createdAt !== "number" || !Number.isSafeInteger(record.createdAt) || record.createdAt < 0) {
    throw new Error("session header createdAt must be a non-negative safe integer");
  }
  if (record.cwd !== void 0) {
    if (typeof record.cwd !== "string") throw new Error("session header cwd must be a string");
    if (!isAbsolute(record.cwd)) {
      throw new Error(`session header cwd must be an absolute path, got "${record.cwd}"`);
    }
  }
  if (record.parentSession !== void 0 && typeof record.parentSession !== "string") {
    throw new Error("session header parentSession must be a string");
  }
  if (record.seedLength !== void 0 && (typeof record.seedLength !== "number" || !Number.isSafeInteger(record.seedLength) || record.seedLength < 0)) {
    throw new Error("session header seedLength must be a non-negative safe integer");
  }
  if (record.origin !== void 0 && record.origin !== "subagent") {
    throw new Error('session header origin must be "subagent"');
  }
  if (record.delegationDepth !== void 0 && (typeof record.delegationDepth !== "number" || !Number.isSafeInteger(record.delegationDepth) || record.delegationDepth < 0)) {
    throw new Error("session header delegationDepth must be a non-negative safe integer");
  }
  if (record.agentPreset !== void 0 && typeof record.agentPreset !== "string") {
    throw new Error("session header agentPreset must be a string");
  }
  return deepFreeze(record);
}
function validateRestoredSessionHeader(id, input) {
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    const prototype = Reflect.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("session header is not a plain JSON record");
    }
  }
  return validateSessionHeader(id, input);
}
function snapshotSessionHeader(id, source) {
  const input = source === void 0 ? { version: SESSION_FORMAT_VERSION, id, createdAt: Date.now() } : source;
  const snapshot = snapshotJsonValue(input);
  if (snapshot === void 0) throw new Error("session header is not losslessly JSON-serializable");
  return validateSessionHeader(id, snapshot);
}
function freezeRestoredObject(value) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    Object.freeze(current);
    for (const key in current) {
      const child = current[key];
      if (child !== null && typeof child === "object") pending.push(child);
    }
  }
  return value;
}
function assertSessionEventEnvelope(value, index) {
  const event = value;
  if (event["type"] === "request/header-delta") {
    throw new Error(`seed event at index ${index} uses unsupported legacy request/header-delta format`);
  }
  for (const key in event) {
    switch (key) {
      case "type":
      case "seq":
      case "time":
      case "data":
      case "surfaceOp":
      case "sourceEventSeqs":
      case "ignorable":
        break;
      default:
        throw new Error(`seed event at index ${index} has an invalid event envelope`);
    }
  }
  const type = event["type"];
  const seq = event["seq"];
  const time = event["time"];
  if (typeof type !== "string" || typeof seq !== "number" || !Number.isSafeInteger(seq) || seq < 0 || typeof time !== "number" || !Number.isSafeInteger(time) || event["data"] === void 0 || event["ignorable"] !== void 0 && event["ignorable"] !== true) {
    throw new Error(`seed event at index ${index} has an invalid event envelope`);
  }
  switch (type) {
    case "request/header":
    case "user/message":
    case "assistant/message":
    case "tool/result":
      assertCurrentLlmShape(event, index);
      break;
  }
}
function assertCurrentLlmShape(event, index) {
  const data = event["data"];
  const record = typeof data === "object" && data !== null ? data : void 0;
  if (event["type"] === "request/header") {
    const header = record?.["header"];
    const headerRecord = typeof header === "object" && header !== null && !Array.isArray(header) ? header : void 0;
    const config = headerRecord?.["config"];
    if (!hasProviderModel(config)) throw new Error(`seed request/header at index ${index} lacks provider/model`);
    const configRecord = config;
    const reasoningEffort = configRecord["reasoningEffort"];
    if (reasoningEffort !== void 0 && (typeof reasoningEffort !== "string" || reasoningEffort.length === 0)) {
      throw new Error(`seed request/header at index ${index} has an invalid reasoningEffort`);
    }
    assertAdapterDefaults(headerRecord?.["adapterDefaults"], configRecord, index);
  }
  const type = event["type"];
  if (type !== "user/message" && type !== "assistant/message" && type !== "tool/result") return;
  assertMessageEventShape(event, `seed ${type} at index ${index}`);
}
var allowedAdapterKeys = /* @__PURE__ */ new Set(["reasoningEffort", "maxTokens"]);
function assertAdapterDefaults(value, config, index) {
  if (value === void 0) return;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`seed request/header at index ${index} has invalid adapterDefaults`);
  }
  const defaults = value;
  if (Object.keys(defaults).some((key) => !allowedAdapterKeys.has(key)) || Object.values(defaults).some((marker) => marker !== true) || defaults["reasoningEffort"] === true && config["reasoningEffort"] === void 0 || defaults["maxTokens"] === true && config["maxTokens"] === void 0) {
    throw new Error(`seed request/header at index ${index} has invalid adapterDefaults`);
  }
}
function assertMessageEventShape(event, subject) {
  const type = event["type"];
  if (type !== "user/message" && type !== "assistant/message" && type !== "tool/result") return;
  const data = event["data"];
  const record = typeof data === "object" && data !== null ? data : void 0;
  const message = type === "user/message" ? record : record?.["message"];
  if (typeof message !== "object" || message === null || typeof message["id"] !== "string" || message["id"] === "") {
    throw new Error(`${subject} lacks an identified message`);
  }
  const messageRecord = message;
  const expectedRole = type === "assistant/message" ? "assistant" : "user";
  if (messageRecord["role"] !== expectedRole) {
    throw new Error(`${subject} message must have role "${expectedRole}"`);
  }
  const source = messageRecord["source"];
  if (typeof source !== "object" || source === null || typeof source["kind"] !== "string" || source["kind"] === "") {
    throw new Error(`${subject} message has invalid source`);
  }
  if (!Array.isArray(messageRecord["content"])) {
    throw new Error(`${subject} message has invalid content`);
  }
  const sourceRecord = source;
  if (type === "assistant/message") {
    if (sourceRecord["kind"] !== "model" || !hasProviderModel(sourceRecord)) {
      throw new Error(`${subject} message must have model source`);
    }
    return;
  }
  if (type !== "tool/result") return;
  if (sourceRecord["kind"] !== "tool" || typeof sourceRecord["callId"] !== "string" || sourceRecord["callId"] === "") {
    throw new Error(`${subject} message must have tool source`);
  }
  const content = messageRecord["content"];
  const block = content[0];
  if (content.length !== 1 || typeof block !== "object" || block === null || block["type"] !== "tool-result" || !Array.isArray(block["content"])) {
    throw new Error(`${subject} message must contain one tool-result block`);
  }
  if (block["toolCallId"] !== sourceRecord["callId"]) {
    throw new Error(`${subject} message has mismatched tool call ids`);
  }
}
function hasProviderModel(value) {
  if (typeof value !== "object" || value === null) return false;
  const pair = value;
  return typeof pair["provider"] === "string" && pair["provider"].length > 0 && typeof pair["model"] === "string" && pair["model"].length > 0;
}
function assertSupportedRequestHeader(type, data, location) {
  if (type === "request/header-delta") {
    throw new Error(`${location} uses unsupported legacy request/header-delta format`);
  }
  if (type === "request/header" && data !== null && typeof data === "object" && !Array.isArray(data) && data["reason"] === "fallback") {
    throw new Error(`${location} uses unsupported legacy request/header reason "fallback"`);
  }
}
function collectSessionCallbacks(ctx, args) {
  return [...ctx.events.dispatch("emit", args)];
}
function invokeContainedSessionObservers(ctx, name15, id, args, callbacks) {
  for (const callback of callbacks) {
    try {
      const returned = callback(...args);
      void Promise.resolve(returned).catch((error) => {
        ctx.logger.warn(`session "${id}": ${name15} listener rejected: ${String(error)}`);
      });
    } catch (error) {
      ctx.logger.warn(`session "${id}": ${name15} listener threw: ${String(error)}`);
    }
  }
}
var attachments = /* @__PURE__ */ new WeakMap();
var Session = class _Session {
  log = [];
  /** Single incremental owner of surface acceptance and projection state. */
  surfaceManager = new SurfaceManager(this.log);
  /** The ordered surface over this session's event log. */
  get surface() {
    return this.surfaceManager;
  }
  /**
   * Detached, deep-frozen creation metadata (format version, cwd, lineage,
   * seed boundary). Supplied by the store via `ctx.sessions.create()`. When a
   * `Session` is created without a store-owned header, a minimal header is
   * synthesized (stamped with the current {@link SESSION_FORMAT_VERSION}) so
   * `session.header` is always present. Kept out of the event log — it is a
   * storage concern, not replayable conversation state.
   */
  header;
  /** The session identity, derived from its durable header's single copy. */
  get id() {
    return this.header.id;
  }
  /**
   * The first seq appended IN THIS PROCESS: the length of the constructor
   * seed (0 without one). Events with smaller seq values entered through
   * construction — replay, fork, or resume — and were never published on the
   * `session/event` firehose (constructor seeds do not emit), so consumers
   * that replay the log as a publication substitute (telemetry adoption)
   * start here. Distinct from `header.seedLength`, the DURABLE fork-lineage
   * boundary: a resumed session's constructor seed is its full stored log,
   * while its header keeps the original fork value — this field is the
   * in-process construction fact.
   *
   * Not persisted itself: a seeded session projects it into the log as the
   * `session/end-seed` event, which is what a consumer reading STORED history
   * reads. Locate the LAST such event, not necessarily one at this seq — a
   * seed already ending in one is not re-marked, so reopening an untouched
   * session leaves that event at a smaller seq than `firstLiveSeq`. Prefer
   * this field in-process: it is exact before the marker reaches storage.
   *
   * When this lifecycle appends the marker, it occupies this seq before the
   * store attaches and therefore does not publish either. Otherwise this seq
   * holds an ordinary published write.
   */
  firstLiveSeq;
  /**
   * Create a detached session by validating and snapshotting borrowed seed
   * events and storage metadata.
   * @param id - session identity.
   * @param seed - optional borrowed replay or fork events.
   * @param header - optional borrowed storage metadata.
   * @returns a detached session.
   */
  static create(id, seed, header) {
    return new _Session(id, seed, header);
  }
  /**
   * Restore a detached session by taking ownership of fresh persistence values.
   * The storage format, event envelopes, sequence continuity, surface transitions,
   * and header fields are validated before the restored objects are frozen.
   * @param id - restored session identity.
   * @param seed - fresh detached events whose ownership is transferred.
   * @param header - fresh detached metadata whose ownership is transferred.
   * @returns a restored detached session.
   */
  static fromRestore(id, seed, header) {
    return new _Session(id, seed, header, "restore");
  }
  constructor(id, seed, header, mode = "snapshot") {
    const restoredHeader = mode === "restore" ? validateRestoredSessionHeader(id, header) : void 0;
    if (seed !== void 0) {
      for (const [index, source] of seed.entries()) {
        const snapshot = mode === "restore" ? source : snapshotJsonValue(source);
        if (snapshot === void 0) {
          throw new Error(`seed event at index ${index} is not losslessly JSON-serializable`);
        }
        assertSessionEventEnvelope(snapshot, index);
        assertSupportedRequestHeader(snapshot.type, snapshot.data, `seed event at index ${index}`);
        if (snapshot.seq !== index) {
          throw new Error(`seed event at index ${index} has seq ${snapshot.seq} (expected ${index}); seed must be contiguous from 0`);
        }
        try {
          this.surfaceManager.validateNext(snapshot);
        } catch (error) {
          throw new Error(`invalid seed event at index ${index}: ${error instanceof Error ? error.message : "invalid surface metadata"}`);
        }
        this.log.push(mode === "restore" ? freezeRestoredObject(snapshot) : deepFreeze(snapshot));
      }
    }
    this.firstLiveSeq = this.log.length;
    this.header = restoredHeader ?? snapshotSessionHeader(id, header);
    if (seed !== void 0 && this.log.at(-1)?.type !== "session/end-seed") {
      this.append("session/end-seed", {});
    }
  }
  /** Cached immutable public snapshot of the private append-only log. */
  eventsSnapshot;
  /**
   * An immutable snapshot of the append-only event log. The snapshot is reused
   * until the next append; a previously returned array does not grow later.
   * Events and their nested data are deep-frozen at acceptance, so neither a
   * cast nor ordinary JavaScript can rewrite durable history.
   */
  get events() {
    this.eventsSnapshot ??= Object.freeze([...this.log]);
    return this.eventsSnapshot;
  }
  /** The next event's sequence number — always the log length (the `seq = log.length` contiguity contract). */
  get seq() {
    return this.log.length;
  }
  /**
   * Append one typed event to the log and synchronously notify observers via
   * the store-owned, module-private publication hooks. The hot path never blocks
   * on I/O — persistence plugins buffer asynchronously. Once the event enters
   * the log, the append is committed: observer failures are logged and
   * contained per listener, so they do not change the return value or prevent
   * later listeners from observing the same accepted event.
   *
   * @param type - The event type (key of {@link SessionEventMap}).
   * @param data - The event payload; must be JSON-serializable.
   * @param opts - Surface metadata: `surfaceOp` controls how the event enters
   *   the ordered surface; `sourceEventSeqs` lists the seq numbers of earlier
   *   events this one derives from. REQUIRED for
   *   {@link SurfaceEventType} events (every message-producing event must
   *   declare how it joins the surface, the sole source of derived model
   *   history) and
   *   rejected by the compiler for non-surface types like `turn/start` or
   *   `assistant/chunk`.
   * @returns the logged event — its assigned `seq`/`time` plus the SNAPSHOT of
   *   `data` that entered the log, so reading `event.data` back sees the logged
   *   value, never the caller's still-mutable input.
   * @throws if `data` or surface metadata is not losslessly JSON-serializable
   *   (BigInt, function, symbol, undefined, negative zero, non-finite number,
   *   circular reference, sparse array, or an exotic object such as
   *   Map/Set/Date/class instance), or when the candidate violates the
   *   canonical surface contract (marker shape and eligibility, unique
   *   earlier source-event references, positional replacement validity, and complete
   *   shadowed-node coverage). One recursive pass reads, validates, and
   *   copies each nested value once, so a stateful getter cannot supply one value
   *   to validation and another to storage. The event log is the durable source
   *   of truth, so a bad event fails at the append site rather than later during
   *   a backend flush. A synchronous internal dispatch validation failure or an
   *   append reentered while this acceptance/publication boundary is open also
   *   rejects before the log changes.
   */
  append(type, data, ...opts) {
    const surfaceOpts = opts[0];
    const surfaceMetadata = {
      ...surfaceOpts?.sourceEventSeqs === void 0 ? {} : { sourceEventSeqs: surfaceOpts.sourceEventSeqs },
      ...surfaceOpts?.surfaceOp === void 0 ? {} : { surfaceOp: surfaceOpts.surfaceOp }
    };
    const dataSnapshot = snapshotJsonValue(data);
    if (dataSnapshot === void 0) {
      throw new Error(`session event "${type}" carries non-JSON-serializable data`);
    }
    assertSupportedRequestHeader(type, dataSnapshot, `session event "${type}"`);
    const surfaceMetadataSnapshot = snapshotJsonValue(surfaceMetadata);
    if (surfaceMetadataSnapshot === void 0) {
      throw new Error(`session event "${type}" carries non-JSON-serializable surface metadata`);
    }
    const entry = attachments.get(this);
    if (entry?.appending) {
      throw new Error("session append cannot reenter while another append is being published");
    }
    const event = deepFreeze({
      type,
      seq: this.log.length,
      time: Date.now(),
      data: dataSnapshot,
      ...surfaceMetadataSnapshot
    });
    this.surfaceManager.validateNext(event);
    if (entry !== void 0) entry.appending = true;
    try {
      let callbacks;
      const callbackArgs = [this, event];
      if (entry !== void 0) {
        callbacks = collectSessionCallbacks(entry.emitCtx, [entry.carrier, "session/event", ...callbackArgs]);
      }
      this.log.push(event);
      this.eventsSnapshot = void 0;
      if (callbacks !== void 0 && entry !== void 0) {
        invokeContainedSessionObservers(entry.emitCtx, "session/event", entry.id, callbackArgs, callbacks);
      }
      return event;
    } finally {
      if (entry !== void 0) {
        entry.appending = false;
        if (entry.detachRequested && !entry.announcing) entry.detach();
      }
    }
  }
  /** Cached fold of the request-header events — see {@link requestHeader}. */
  headerFold;
  /** Log position (events consumed) the header fold has reached. */
  headerFoldSeq = 0;
  /**
   * The {@link EpochHeader} in force after the log's last header event — the
   * header the NEXT request will be compared against — or undefined before
   * the first `request/header` snapshot. The live, incrementally-maintained
   * form of `foldRequestHeader(session.events)`: each header event is folded
   * once, when first seen, so a per-step read costs O(new events).
   * @returns the folded header, or undefined when no header event exists yet.
   */
  requestHeader() {
    if (this.headerFoldSeq < this.log.length) {
      this.headerFold = deepFreeze(foldRequestHeader(this.log.slice(this.headerFoldSeq), this.headerFold));
      this.headerFoldSeq = this.log.length;
    }
    return this.headerFold;
  }
  /** Cached fold of `request/context` events. */
  contextFold;
  contextFoldSeq = 0;
  /**
   * Return the latest resolved route metadata, or `undefined` before the first
   * `request/context` event. Each event is folded once.
   * @returns the latest immutable route metadata.
   */
  requestContext() {
    if (this.contextFoldSeq < this.log.length) {
      for (const event of this.log.slice(this.contextFoldSeq)) {
        if (event.type === "request/context") this.contextFold = deepFreeze({ ...event.data });
      }
      this.contextFoldSeq = this.log.length;
    }
    return this.contextFold;
  }
  /** The derived-message cache: frozen projections, extended per unseen node. */
  derived = [];
  /** Surface position (nodes projected) the cache has reached. */
  derivedNodes = 0;
  /** {@link SurfaceManager.replaceGeneration} the cache was built under. */
  derivedGeneration = 0;
  /**
   * Derive the LLM message history by walking the ordered sequences of
   * message-producing events maintained by `surfaceOp` markers. The
   * surface is the single source of derived history: every message-producing
   * append records its `surfaceOp`, so a raw event with no marker (a chunk, a
   * turn boundary) is correctly absent, and a compaction `replace` deletes the
   * shadowed nodes from the derivation. The projection rules are
   * {@link deriveEventMessage}, folded per node.
   *
   * CACHED: each surface node is projected exactly once, when first seen — a
   * call costs O(new nodes), and a surface rewrite (a `replace`;
   * {@link SessionSurface.replaceGeneration}) rebuilds. The returned array is
   * a fresh snapshot per call (later appends never grow an array a caller
   * already holds); the `Message` objects in it are SHARED and **deep-frozen**.
   * Their content reuses the already frozen durable event data, so the cache
   * needs no second deep clone and consumers still cannot mutate the log.
   * @returns a fresh array of the shared, frozen derived history.
   */
  deriveMessages() {
    const surface = this.surface;
    const nodes = surface.nodes;
    const generation = surface.replaceGeneration;
    if (generation !== this.derivedGeneration) {
      this.derived = [];
      this.derivedNodes = 0;
      this.derivedGeneration = generation;
    }
    for (const seq of nodes.slice(this.derivedNodes)) {
      const msg = this.deriveEventMessage(this.log[seq]);
      if (msg) this.derived.push(msg);
    }
    this.derivedNodes = nodes.length;
    return [...this.derived];
  }
  /**
   * Instance face of the pure per-node `deriveEventMessage` export from
   * `surface.ts`.
   * @param event - the event to project.
   * @returns the derived message, or null when the event produces none.
   */
  deriveEventMessage(event) {
    return deriveEventMessage(event);
  }
};
var SessionForkError = class extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "SessionForkError";
  }
  code;
};
var SessionStore = class extends Service {
  store = /* @__PURE__ */ new Map();
  counter = 0;
  constructor(ctx) {
    super(ctx, "sessions");
    ctx.inject(["typert"], (typeCtx) => {
      typeCtx.typert.lookups.register("session", {
        parameter: "session",
        wire: "sessionId",
        hostTypeSymbol: "@deepseek-ai/dsh-session#Session",
        wireTypeSymbol: "@deepseek-ai/dsh-session/types#SessionId",
        resolve: (sessionId) => this.get(sessionId)
      });
    });
  }
  /**
   * Create a session owned by the calling fiber: disposing that fiber stops
   * event notification and removes the session from the store. `options.seed`
   * populates the session with a copy of those events (replay/fork);
   * `options.meta` attaches creation metadata (validated absolute `cwd`, seed
   * and parent lineage, and delegation depth) as the immutable
   * {@link SessionHeader} (the store fills `version`/`id`/`createdAt`).
   *
   * For an agent whose session must be torn down IN ORDER with its loop (so the
   * loop's final events are published before the store attachment ends), do NOT use this
   * — fold the session lifecycle into the agent's own effect via
   * {@link prepare} + {@link enter} + {@link announce} (see
   * `dsh-agent-loop`'s creation transaction).
   *
   * @param id - the session id; omitted, the store mints `session-<n>`.
   * @param options - seed events and/or creation metadata for the header.
   * @returns the live session, already entered and announced.
   * @throws if a session with `id` already exists, metadata is not a plain
   *   lossless-JSON record with valid scalar fields, or `meta.cwd` is a
   *   non-absolute path (storage backends key directories off it).
   */
  create(id, options) {
    const session = this.prepare(id, options);
    this.ctx.effect(function* () {
      yield this.enter(session);
      this.announce(session);
    }.bind(this), "sessions.create()");
    return session;
  }
  /**
   * Build a session WITHOUT entering it into the store — validate the id/cwd and
   * construct the {@link Session} (with its immutable {@link SessionHeader}).
   * Pairs with {@link enter} + {@link announce}: a caller that owns a composite
   * `ctx.effect` (the agent factory) folds the session lifecycle into that ONE
   * effect so a fiber unload tears the session + agent down as a single ORDERED
   * chain rather than as racing sibling effects — which would remove the publication hooks
   * before the driver's closing events commit, dropping them.
   *
   * @param id - the session id; omitted, the store mints `session-<n>`.
   * @param options - seed events and/or creation metadata for the header. With
   *   `seedSource: 'persistence'`, metadata and events must be fresh detached
   *   graphs whose ownership transfers to this call: they are validated and
   *   frozen in place through {@link Session.fromRestore}, so the caller must
   *   retain no mutable aliases.
   * @returns the constructed session, NOT yet in the store.
   * @throws if a session with `id` already exists, metadata is not a plain
   *   lossless-JSON record with valid scalar fields, or `meta.cwd` is a
   *   non-absolute path.
   */
  prepare(id, options) {
    let sessionId;
    if (id === void 0) {
      do
        sessionId = SessionId(`session-${++this.counter}`);
      while (this.store.has(sessionId));
    } else {
      sessionId = SessionId(id);
    }
    if (this.store.has(sessionId)) throw new Error(`session "${sessionId}" already exists`);
    if (options?.seedSource === "persistence") {
      return Session.fromRestore(sessionId, options.seed, options.meta);
    }
    const seed = options?.seed;
    const meta = options?.meta;
    const header = {
      version: SESSION_FORMAT_VERSION,
      id: sessionId,
      createdAt: meta?.createdAt ?? Date.now(),
      ...meta?.cwd === void 0 ? {} : { cwd: meta.cwd },
      ...meta?.parentSession === void 0 ? {} : { parentSession: meta.parentSession },
      ...meta?.seedLength === void 0 ? {} : { seedLength: meta.seedLength },
      ...meta?.origin === void 0 ? {} : { origin: meta.origin },
      ...meta?.delegationDepth === void 0 ? {} : { delegationDepth: meta.delegationDepth },
      ...meta?.agentPreset === void 0 ? {} : { agentPreset: meta.agentPreset }
    };
    return Session.create(sessionId, seed, header);
  }
  /**
   * Enter a {@link prepare}d session into the store: install the module-private
   * append publication hooks and add it to the store. Returns the DETACH
   * disposer (hooks + store removal). Does NOT emit `session/created` —
   * the caller yields this disposer inside its effect and THEN calls
   * {@link announce}, so a throwing `session/created` listener rolls the attach
   * back instead of leaking it.
   *
   * Re-checks the id for a duplicate: `prepare` and `enter` are public
   * cross-package primitives and a caller may interleave arbitrary work (or
   * another create) between them, so a stale prepared session must NOT overwrite
   * a live store entry of the same id — its detach disposer would later delete
   * the REAL session. The {@link create} convenience and the agent factory call
   * the two back-to-back so they never trip this, but the public API cannot
   * assume that.
   *
   * @param session - a {@link prepare}d session not yet in the store.
   * @returns the detach disposer (publication hooks + store removal). When called from
   *   a synchronous `session/created` listener, removal and disposal wait until
   *   that creation dispatch unwinds.
   * @throws if a session with this id is already in the store.
   */
  enter(session) {
    const id = session.id;
    const carrier = scopeTarget(session, scopeOf(this.ctx));
    if (this.store.has(id)) throw new Error(`session "${id}" already exists`);
    if (attachments.has(session)) throw new Error(`session "${id}" is already attached to a store`);
    const entry = {
      id,
      session,
      carrier,
      emitCtx: this.ctx,
      announced: false,
      announcing: false,
      appending: false,
      detachRequested: false,
      detach: () => {
        this.detachEntered(entry);
      }
    };
    this.store.set(id, entry);
    attachments.set(session, entry);
    let entered = true;
    const detach = () => {
      if (!entered) return;
      entered = false;
      if (entry.announcing || entry.appending) {
        entry.detachRequested = true;
        return;
      }
      entry.detach();
    };
    return detach;
  }
  /** Remove one exact entered session and emit its paired disposal when announced. */
  detachEntered(entry) {
    entry.detachRequested = false;
    if (this.store.get(entry.id) !== entry) return;
    this.store.delete(entry.id);
    attachments.delete(entry.session);
    if (entry.announced) this.emitDisposed(entry);
  }
  /** Emit `session/created` exactly once for an {@link enter}ed session (with
   * the carrier {@link enter} captured). Separate from {@link enter} so the
   * caller can yield the detach disposer first (rollback safety — see
   * {@link enter}).
   * @param session - the entered session to announce to listeners.
   * @throws if the session is not live or its announcement already began,
   *   including a reentrant call from a creation listener. */
  announce(session) {
    const entry = this.liveEntryFor(session);
    if (entry.announced || entry.announcing) {
      throw new Error(`session "${entry.id}" was already announced`);
    }
    entry.announced = true;
    const callbackArgs = [session];
    entry.announcing = true;
    try {
      const callbacks = collectSessionCallbacks(this.ctx, [entry.carrier, "session/created", session]);
      for (const callback of callbacks) {
        const returned = callback(...callbackArgs);
        void Promise.resolve(returned).catch((error) => {
          this.ctx.logger.warn(`session "${entry.id}": session/created listener rejected: ${String(error)}`);
        });
      }
    } finally {
      entry.announcing = false;
      if (entry.detachRequested && !entry.appending) entry.detach();
    }
  }
  /** Emit the paired teardown notification with per-listener containment. */
  emitDisposed(entry) {
    const callbackArgs = [entry.session];
    try {
      const callbacks = collectSessionCallbacks(this.ctx, [entry.carrier, "session/disposed", entry.session]);
      invokeContainedSessionObservers(this.ctx, "session/disposed", entry.id, callbackArgs, callbacks);
    } catch (error) {
      this.ctx.logger.warn(`session "${entry.id}": session/disposed dispatch threw: ${String(error)}`);
    }
  }
  /**
   * Dispatch the awaited `session/flush` durability checkpoint for `session`,
   * with the carrier captured at {@link enter}. THE flush entry point: the
   * store owns the carrier, so callers (the checkpoint policy's per-request
   * barrier, goal-round-driver's idle checkpoint, teardown drains, and consumers
   * that flush themselves before reading storage) must come through here
   * rather than dispatch a raw `ctx.parallel('session/flush', …)` — one owner,
   * one spelling, and the scoped-dispatch invariant can pin it.
   * @param session - the session whose buffered events must reach durable storage.
   * @returns whether at least one durability listener participated, after every
   *   listener has settled successfully.
   * @throws the first registered listener failure after every listener settles.
   */
  async flush(session) {
    const { carrier } = this.liveEntryFor(session);
    const callbackArgs = [session];
    const callbacks = collectSessionCallbacks(this.ctx, [carrier, "session/flush", session]);
    const results = await Promise.allSettled(callbacks.map((callback) => {
      try {
        return callback(...callbackArgs);
      } catch (error) {
        return Promise.reject(error);
      }
    }));
    const failure = results.find((result) => result.status === "rejected");
    if (failure !== void 0) throw failure.reason;
    return callbacks.length > 0;
  }
  /** Return the exact live entry; detached/prepared objects reject. */
  liveEntryFor(session) {
    const entry = attachments.get(session);
    if (entry === void 0 || this.store.get(entry.id) !== entry) {
      throw new Error(`session "${session.id}" is not live in this store`);
    }
    return entry;
  }
  /**
   * Look up a live session.
   * @param id - the session id to look up.
   * @returns the session, or undefined when no live session has that id.
   */
  get(id) {
    return this.store.get(id)?.session;
  }
  /**
   * All live sessions, in creation order.
   * @returns a fresh array; mutating it does not affect the store.
   */
  list() {
    return [...this.store.values()].map((entry) => entry.session);
  }
  /**
   * Create a live child session from a stable prefix of a live source.
   * `boundary` is an inclusive source event seq; omitted means the source's
   * current last event. The selected slice may end with a between-turn event
   * but must not end inside an open turn.
   *
   * @param source - Live source session object or id.
   * @param boundary - Inclusive source event seq to fork through; omitted means
   *   the source's current last event, and omitted on an empty source forks an
   *   empty child.
   * @param childSessionId - Optional child session id; omitted delegates to
   *   `SessionStore`'s id policy.
   * @returns The created live child session.
   */
  fork(source, boundary, childSessionId) {
    if (childSessionId !== void 0 && this.get(childSessionId) !== void 0) {
      throw new SessionForkError(`session "${childSessionId}" already exists`, "SESSION_ALREADY_EXISTS");
    }
    const liveSource = this._resolveForkSource(source);
    const seed = this._forkSeed(liveSource, boundary);
    return this.create(childSessionId, {
      seed,
      meta: {
        ...liveSource.header.cwd !== void 0 ? { cwd: liveSource.header.cwd } : {},
        parentSession: liveSource.id,
        seedLength: seed.length
      }
    });
  }
  _forkSeed(session, requestedBoundary) {
    const events = session.events;
    const lastEvent = events.at(-1);
    let boundary;
    if (requestedBoundary !== void 0) {
      boundary = requestedBoundary;
    } else {
      if (lastEvent === void 0) return [];
      boundary = lastEvent.seq;
    }
    if (!Number.isSafeInteger(boundary) || boundary < 0) {
      throw new SessionForkError(
        `fork boundary for session "${session.id}" must be a non-negative safe integer, got ${String(boundary)}`,
        "INVALID_BOUNDARY"
      );
    }
    if (boundary >= events.length) {
      const lastSeq = events.at(-1)?.seq;
      throw new SessionForkError(
        `fork boundary ${boundary} does not exist in session "${session.id}" (last seq: ${lastSeq ?? "none"})`,
        "INVALID_BOUNDARY"
      );
    }
    const boundaryEvent = events[boundary];
    if (boundaryEvent === void 0 || boundaryEvent.seq !== boundary) {
      throw new SessionForkError(
        `fork boundary ${boundary} does not match a contiguous event seq in session "${session.id}"`,
        "INVALID_BOUNDARY"
      );
    }
    const lastTurnBoundary = events.slice(0, boundary + 1).findLast((event) => event.type === "turn/start" || event.type === "turn/end");
    if (lastTurnBoundary?.type === "turn/start") {
      throw new SessionForkError(
        `fork boundary ${boundary} in session "${session.id}" ends inside open turn ${lastTurnBoundary.data.turn}`,
        "OPEN_TURN"
      );
    }
    return events.slice(0, boundary + 1);
  }
  _resolveForkSource(source) {
    if (typeof source === "string") {
      const session = this.get(source);
      if (session === void 0) throw new SessionForkError(`session "${source}" not found`, "SESSION_NOT_FOUND");
      return session;
    }
    const live = this.get(source.id);
    if (live === void 0) {
      throw new SessionForkError(`session "${source.id}" not found`, "SESSION_NOT_FOUND");
    }
    if (live !== source) throw new SessionForkError(`session "${source.id}" is not the live store instance`, "SESSION_NOT_LIVE");
    return source;
  }
};
var src_default4 = SessionStore;

// ../../source/deepseek-harness/packages/session/session-title/src/index.ts
import { z as zod } from "zod";

// ../../source/deepseek-harness/packages/session/session-title/src/normalize.ts
var OSC_SEQUENCE = /(?:\u001B\]|\u009D)(?:(?!\u0007|\u001B\\)[\s\S])*(?:\u0007|\u001B\\|$)/gu;
var CSI_SEQUENCE = /(?:\u001B\[|\u009B)[0-?]*[ -/]*[@-~]/gu;
var ESC_SEQUENCE = /\u001B[@-_]/gu;
var CONTROL_CHARACTER = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;
var DIRECTIONAL_CONTROL = /[\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/gu;
function assertPositiveInteger(name15, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name15} must be a positive integer`);
  }
}
function cleanTitleText(input) {
  return input.replace(OSC_SEQUENCE, "").replace(CSI_SEQUENCE, "").replace(ESC_SEQUENCE, "").replace(CONTROL_CHARACTER, "").replace(DIRECTIONAL_CONTROL, "").replace(/\s+/gu, " ").trim();
}
function truncateTitleUtf8(input, maxBytes) {
  assertPositiveInteger("maxBytes", maxBytes);
  if (Buffer.byteLength(input, "utf8") <= maxBytes) return input;
  let used = 0;
  let output = "";
  for (const character of input) {
    const bytes = Buffer.byteLength(character, "utf8");
    if (used + bytes > maxBytes) break;
    output += character;
    used += bytes;
  }
  return output;
}
function normalizeSessionTitle(input, maxBytes) {
  return truncateTitleUtf8(cleanTitleText(input), maxBytes).trimEnd();
}
function fallbackSessionTitle(input, maxWords, maxBytes) {
  assertPositiveInteger("maxWords", maxWords);
  const words = cleanTitleText(input).split(" ").filter(Boolean).slice(0, maxWords);
  return truncateTitleUtf8(words.join(" "), maxBytes).trimEnd();
}

// ../../source/deepseek-harness/packages/session/session-title/src/index.ts
var SessionTitleInvalidError = class extends Error {
  name = "SessionTitleInvalidError";
};
function collectSessionTitleMessages(events, throughSeq) {
  const messages = [];
  for (const event of events) {
    if (throughSeq !== void 0 && event.seq > throughSeq) break;
    if (event.type !== "user/message" || event.data.source.kind !== "user") continue;
    const content = event.data.content;
    const text = content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
    if (normalizeSessionTitle(text, Number.MAX_SAFE_INTEGER).length === 0) continue;
    messages.push({ seq: event.seq, text });
  }
  return messages;
}
function foldSessionTitle(events) {
  const event = events.findLast((item) => item.type === "session/title");
  if (event === void 0) return void 0;
  return deepFreeze({
    title: event.data.title,
    messageSeqs: [...event.data.messageSeqs],
    source: copySessionTitleSource(event.data.source),
    eventSeq: event.seq,
    updatedAt: event.time
  });
}
function copySessionTitleSource(source) {
  switch (source.kind) {
    case "fallback":
      return { kind: "fallback" };
    case "provider":
      return {
        kind: "provider",
        provider: source.provider,
        ...source.model === void 0 ? {} : { model: { ...source.model } }
      };
    case "user":
      return { kind: "user" };
    /* v8 ignore next -- closed-union exhaustiveness guard */
    default:
      return assertNever(source, "SessionTitleSource");
  }
}
function assertPositiveInteger2(name15, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`session-title: ${name15} must be a positive integer`);
  }
}
var SessionTitleService = class extends Service {
  static inject = ["sessions"];
  static Config = src_default2.object({
    fallbackMaxWords: src_default2.number().step(1).min(1).required(),
    fallbackMaxBytes: src_default2.number().step(1).min(1).required(),
    maxTitleBytes: src_default2.number().step(1).min(1).required()
  });
  config;
  ownerFiber;
  registration;
  work = /* @__PURE__ */ new Map();
  lifetime = new AbortController();
  inFlight = /* @__PURE__ */ new Set();
  constructor(ctx, config) {
    super(ctx, "sessionTitle");
    this.ownerFiber = ctx.fiber;
    const candidate = config;
    if (candidate === null || typeof candidate !== "object") {
      throw new Error("session-title: configuration is required");
    }
    const value = candidate;
    assertPositiveInteger2("fallbackMaxWords", value.fallbackMaxWords);
    assertPositiveInteger2("fallbackMaxBytes", value.fallbackMaxBytes);
    assertPositiveInteger2("maxTitleBytes", value.maxTitleBytes);
    if (value.fallbackMaxBytes > value.maxTitleBytes) {
      throw new Error("session-title: fallbackMaxBytes must not exceed maxTitleBytes");
    }
    this.config = deepFreeze({ ...value });
    ctx.effect(() => async () => {
      this.lifetime.abort(new Error("session-title service disposed"));
      if (this.registration !== void 0) this.registration.closing = true;
      this.registration = void 0;
      for (const state of this.work.values()) {
        delete state.pending;
        state.active?.controller.abort(new Error("session-title service disposed"));
      }
      await this.drain(this.inFlight);
      this.work.clear();
    }, "sessionTitle lifecycle");
    ctx.inject(["sessionProjections"], (projectionCtx) => {
      projectionCtx.sessionProjections.register({
        key: "title",
        schema: zod.union([zod.string().min(1), zod.null()]),
        init: () => null,
        apply: (state, event) => event.type === "session/title" ? event.data.title : state,
        view: (state) => state,
        stateVersion: 1
      });
    });
    ctx.on("session/event", (session, event) => {
      switch (event.type) {
        case "user/message":
          this.onUserMessage(session, event);
          break;
        case "request/header":
          this.onRequestHeader(session, event);
          break;
        default:
          break;
      }
    });
    ctx.on("llm/stream", (options, next) => {
      this.onMainRequest(options);
      return next();
    }, { global: true, prepend: true });
    ctx.on("session/disposed", (session) => {
      const state = this.work.get(session);
      if (state === void 0) return;
      state.active?.controller.abort(new Error("session disposed during title generation"));
      this.work.delete(session);
    });
  }
  /**
   * Read the latest folded title from one live or replayed session.
   * @param session - session whose log is the title source of truth.
   * @returns latest title snapshot, or `undefined` before eligible input.
   */
  get(session) {
    return foldSessionTitle(session.events);
  }
  /**
   * Accept an explicit user title. Appends a `session/title` event with the
   * `user` source, which pins the title: in-flight automatic generation is
   * superseded and later user messages schedule none (an explicit
   * {@link SessionTitleService.refresh} remains the deliberate unpin).
   * @param session - exact live session to rename.
   * @param title - raw user input; normalized before acceptance.
   * @returns the accepted title snapshot.
   * @throws {SessionTitleInvalidError} when the title normalizes to empty.
   * @throws {Error} when the session is not live or the service is disposed.
   */
  rename(session, title) {
    this.assertServiceActive();
    if (this.ctx.sessions.get(session.id) !== session) {
      throw new Error(`session "${session.id}" is not live in this store`);
    }
    const normalized = normalizeSessionTitle(title, this.config.maxTitleBytes);
    if (normalized.length === 0) {
      throw new SessionTitleInvalidError("session title must contain visible characters");
    }
    const state = this.stateFor(session);
    this.supersede(state, "user rename superseded automatic title generation");
    session.append("session/title", {
      title: normalized,
      messageSeqs: [],
      source: { kind: "user" }
    });
    const snapshot = this.get(session);
    if (snapshot === void 0) throw new Error("renamed title failed to fold");
    return snapshot;
  }
  /**
   * Explicitly retry the registered provider, or materialize the built-in
   * fallback when no provider is registered.
   * @param session - exact live session to refresh.
   * @param signal - optional caller cancellation.
   * @returns latest accepted title, or `undefined` when no eligible text exists.
   */
  async refresh(session, signal) {
    signal?.throwIfAborted();
    this.assertServiceActive();
    if (this.ctx.sessions.get(session.id) !== session) {
      throw new Error(`session "${session.id}" is not live in this store`);
    }
    const registration = this.registration;
    const messages = collectSessionTitleMessages(session.events);
    const latest = messages.at(-1);
    if (registration === void 0 || registration.closing || latest === void 0) {
      const current = this.get(session);
      const [first] = messages;
      if (current?.source.kind === "user" && first !== void 0) {
        this.appendFallback(session, first);
        signal?.throwIfAborted();
        return this.get(session);
      }
      const fallback = await this.ensureFallback(session);
      signal?.throwIfAborted();
      return fallback;
    }
    const state = this.stateFor(session);
    const revision = this.supersede(state, "explicit title refresh superseded older generation");
    const work = this.activate({
      registration,
      revision,
      throughSeq: latest.seq
    }, state, signal);
    const config = session.requestHeader()?.config;
    const route = config === void 0 ? void 0 : { provider: config.provider, model: config.model };
    return this.startProvider(session, work, route);
  }
  /**
   * Register the sole optional title provider. Disposal aborts its pending and
   * active work before another provider may register.
   * @param provider - provider identity, cadence, and generation function.
   * @returns exact Cordis effect disposer, which settles after active calls quiesce.
   */
  register(provider) {
    this.validateProvider(provider);
    if (this.registration !== void 0) {
      throw new Error(`session-title provider "${this.registration.provider.id}" is already registered`);
    }
    const registration = {
      provider,
      active: /* @__PURE__ */ new Set(),
      closing: false
    };
    const dispose = this.ctx.effect(function* () {
      this.registration = registration;
      yield async () => {
        registration.closing = true;
        for (const state of this.work.values()) {
          if (state.pending?.registration === registration) delete state.pending;
          if (state.active?.registration === registration) {
            state.active.controller.abort(new Error(`session-title provider "${provider.id}" was disposed`));
          }
        }
        await this.drain(registration.active);
        if (this.registration === registration) this.registration = void 0;
      };
    }.bind(this), "sessionTitle.register()");
    return dispose;
  }
  /** Schedule fallback creation and any provider cadence for one eligible event. */
  onUserMessage(session, event) {
    if (!this.serviceActive()) return;
    if (event.data.source.kind !== "user" || collectSessionTitleMessages([event]).length === 0) return;
    if (this.get(session)?.source.kind === "user") return;
    const registration = this.registration;
    if (registration !== void 0 && !registration.closing) {
      const messages = collectSessionTitleMessages(session.events, event.seq);
      const shouldSchedule = registration.provider.automatic === "all-prompts" || session.header.parentSession === void 0 && messages.length === 1 && this.get(session) === void 0;
      if (shouldSchedule) {
        const state = this.stateFor(session);
        const revision = this.supersede(state, "newer user message superseded title generation");
        state.pending = { registration, revision, throughSeq: event.seq };
      }
    }
    this.defer(async () => {
      try {
        await this.ensureFallback(session);
      } catch (error) {
        if (!this.serviceActive()) return;
        this.ctx.logger.warn(`session "${session.id}": fallback title update failed: ${String(error)}`);
      }
    });
  }
  /** Start pending automatic work only after its exact main-request route is logged. */
  onRequestHeader(session, event) {
    if (!this.serviceActive()) return;
    const state = this.work.get(session);
    const pending = state?.pending;
    if (state === void 0 || pending === void 0 || pending.throughSeq >= event.seq) return;
    const route = {
      provider: event.data.header.config.provider,
      model: event.data.header.config.model
    };
    this.startPending(session, state, pending, route);
  }
  /** Start unchanged-route work from the marked loop request after its header fold is current. */
  onMainRequest(options) {
    if (!this.serviceActive() || options.sessionId === void 0 || !isAgentLoopRequest(options)) return;
    const session = this.ctx.sessions.get(options.sessionId);
    const state = session === void 0 ? void 0 : this.work.get(session);
    const pending = state?.pending;
    if (session === void 0 || state === void 0 || pending === void 0) return;
    const boundary = session.events.findLast((event) => event.type === "step/start" || event.type === "step/end");
    const route = session.requestHeader()?.config;
    if (boundary?.type !== "step/start" || boundary.seq <= pending.throughSeq || route?.provider !== options.provider || route.model !== options.model) return;
    this.startPending(session, state, pending, { provider: options.provider, model: options.model });
  }
  /** Consume one pending revision and schedule its non-blocking provider call. */
  startPending(session, state, pending, route) {
    delete state.pending;
    this.defer(async () => {
      if (this.registration !== pending.registration || pending.registration.closing || this.work.get(session) !== state || state.revision !== pending.revision) return;
      const work = this.activate(pending, state);
      try {
        await this.startProvider(session, work, route);
      } catch (error) {
        if (work.signal.aborted || !this.serviceActive()) return;
        this.ctx.logger.warn(`session "${session.id}": automatic title generation failed: ${String(error)}`);
      }
    });
  }
  /** Start one tracked provider call after publishing its active revision. */
  startProvider(session, work, route) {
    const run = Promise.resolve().then(() => this.runProvider(session, work, route));
    return this.track(run, work.registration);
  }
  /** Execute and accept one current provider revision. */
  async runProvider(session, work, route) {
    try {
      this.assertCurrent(session, work);
      await this.ensureFallback(session);
      this.assertCurrent(session, work);
      const messages = collectSessionTitleMessages(session.events, work.throughSeq);
      const result = await work.registration.provider.generate({
        session,
        messages,
        ...route === void 0 ? {} : { route },
        signal: work.signal
      });
      this.assertCurrent(session, work);
      const accepted = this.validateResult(result, messages);
      session.append("session/title", {
        title: accepted.title,
        messageSeqs: [...accepted.messageSeqs],
        source: {
          kind: "provider",
          provider: work.registration.provider.id,
          ...accepted.model === void 0 ? {} : { model: accepted.model }
        }
      });
      return this.get(session);
    } finally {
      const state = this.work.get(session);
      if (state?.active === work) delete state.active;
    }
  }
  /** Validate and normalize provider output against the supplied message snapshot. */
  validateResult(result, messages) {
    if (result === null || typeof result !== "object") {
      throw new Error("session-title provider returned an invalid result");
    }
    const candidate = result;
    if (typeof candidate.title !== "string") throw new Error("session-title provider title must be a string");
    const title = normalizeSessionTitle(candidate.title, this.config.maxTitleBytes);
    if (title.length === 0) throw new Error("session-title provider returned an empty title");
    if (!Array.isArray(candidate.messageSeqs) || candidate.messageSeqs.length === 0) {
      throw new Error("session-title provider must identify at least one source message seq");
    }
    const messageSeqs = [];
    const order = new Map(messages.map((message, index) => [message.seq, index]));
    let previous = -1;
    for (const seq of candidate.messageSeqs) {
      if (typeof seq !== "number") {
        throw new Error("session-title provider messageSeqs must be unique, ordered seqs from the request");
      }
      const index = order.get(seq);
      if (!Number.isSafeInteger(seq) || seq < 0 || index === void 0 || index <= previous) {
        throw new Error("session-title provider messageSeqs must be unique, ordered seqs from the request");
      }
      messageSeqs.push(seq);
      previous = index;
    }
    const modelCandidate = candidate.model;
    let model;
    if (modelCandidate !== void 0) {
      if (modelCandidate === null || typeof modelCandidate !== "object") {
        throw new Error("session-title provider result model must contain non-empty provider and model strings");
      }
      const record = modelCandidate;
      if (typeof record.provider !== "string" || record.provider.length === 0 || typeof record.model !== "string" || record.model.length === 0) {
        throw new Error("session-title provider result model must contain non-empty provider and model strings");
      }
      model = { provider: record.provider, model: record.model };
    }
    return {
      title,
      messageSeqs,
      ...model === void 0 ? {} : { model }
    };
  }
  /** Fail a completion whose provider, revision, session, or signal is stale. */
  assertCurrent(session, work) {
    this.assertServiceActive();
    work.signal.throwIfAborted();
    const state = this.work.get(session);
    if (this.registration !== work.registration || state?.active !== work || state.revision !== work.revision || this.ctx.sessions.get(session.id) !== session) {
      throw new Error("session title generation state changed without cancellation");
    }
  }
  /** Create and publish an active provider call from one fixed revision. */
  activate(pending, state, upstream) {
    const controller = new AbortController();
    const signal = upstream === void 0 ? AbortSignal.any([controller.signal, this.lifetime.signal]) : AbortSignal.any([controller.signal, this.lifetime.signal, upstream]);
    const work = { ...pending, controller, signal };
    state.active = work;
    return work;
  }
  /** Abort older active work and reserve the next session-local revision. */
  supersede(state, reason) {
    state.active?.controller.abort(new Error(reason));
    delete state.pending;
    state.revision += 1;
    return state.revision;
  }
  /** Return mutable work state for one session. */
  stateFor(session) {
    let state = this.work.get(session);
    if (state === void 0) {
      state = { revision: 0 };
      this.work.set(session, state);
    }
    return state;
  }
  /** Queue detached service work and retain it through service disposal. */
  defer(task) {
    const run = Promise.resolve().then(async () => {
      if (!this.serviceActive()) return;
      await task();
    });
    void this.track(run);
  }
  /** Retain one promise until settlement for service and optional provider teardown. */
  track(run, registration) {
    this.inFlight.add(run);
    registration?.active.add(run);
    const settled = () => {
      this.inFlight.delete(run);
      registration?.active.delete(run);
    };
    void run.then(settled, settled);
    return run;
  }
  /** Await every current and settling promise in one lifecycle registry. */
  async drain(active) {
    while (active.size > 0) await Promise.allSettled([...active]);
  }
  /** Whether the owning plugin fiber can still start or commit title work. */
  serviceActive() {
    return !this.lifetime.signal.aborted && this.ownerFiber.uid !== null && this.ownerFiber.state === 2 /* ACTIVE */;
  }
  /** Reject work once the owning plugin fiber has begun unloading. */
  assertServiceActive() {
    if (!this.serviceActive()) throw new Error("session-title service disposed");
  }
  /** Reject malformed provider registrations before publishing an effect. */
  validateProvider(provider) {
    if (provider === null || typeof provider !== "object") {
      throw new Error("session-title provider must be an object");
    }
    const candidate = provider;
    if (typeof candidate.id !== "string" || candidate.id.length === 0) {
      throw new Error("session-title provider id must be a non-empty string");
    }
    if (candidate.automatic !== "first-prompt" && candidate.automatic !== "all-prompts") {
      throw new Error("session-title provider automatic mode is invalid");
    }
    if (typeof candidate.generate !== "function") {
      throw new Error(`session-title provider "${candidate.id}" requires generate()`);
    }
  }
  /**
   * Derive and append the deterministic fallback title over whatever stands
   * (the refresh unpin path: overwriting a pinned user title is the point).
   * Synchronous on purpose — no await may separate derivation from append, so
   * it needs neither ensureFallback's in-flight dedup nor its liveness
   * re-check. An underivable fallback (empty after the caps) appends nothing.
   */
  appendFallback(session, first) {
    const title = fallbackSessionTitle(first.text, this.config.fallbackMaxWords, this.config.fallbackMaxBytes);
    if (title.length === 0) return;
    session.append("session/title", {
      title,
      messageSeqs: [first.seq],
      source: { kind: "fallback" }
    });
  }
  /** Create the first deterministic fallback if the session still lacks a title. */
  async ensureFallback(session) {
    this.assertServiceActive();
    const current = this.get(session);
    if (current !== void 0) return current;
    const [first] = collectSessionTitleMessages(session.events);
    if (first === void 0) return void 0;
    const title = fallbackSessionTitle(
      first.text,
      this.config.fallbackMaxWords,
      this.config.fallbackMaxBytes
    );
    if (title.length === 0) return void 0;
    const state = this.stateFor(session);
    if (state.fallback !== void 0) return state.fallback;
    const fallback = Promise.resolve().then(() => {
      this.assertServiceActive();
      if (this.ctx.sessions.get(session.id) !== session) {
        throw new Error(`session "${session.id}" is not live in this store`);
      }
      const accepted = this.get(session);
      if (accepted !== void 0) return accepted;
      session.append("session/title", {
        title,
        messageSeqs: [first.seq],
        source: { kind: "fallback" }
      });
      return this.get(session);
    });
    state.fallback = fallback;
    try {
      return await fallback;
    } finally {
      delete state.fallback;
    }
  }
};
var src_default5 = SessionTitleService;

// ../../source/deepseek-harness/packages/core/system-prompt/src/index.ts
var PERSONA_SECTION = "deployment:persona";
var PERSONA_ORDER = 0;
var VARIABLE_NAME = /^[a-z][a-z0-9_]*$/;
var GROUP_AT = /^\{\{([^{}]*)\}\}/;
var TOOL_ORDER_REST = "<unlisted-tools>";
function validateToolOrder(toolOrder) {
  if (toolOrder === void 0) return void 0;
  const seen = /* @__PURE__ */ new Set();
  for (const name15 of toolOrder) {
    if (seen.has(name15)) throw new Error(`toolOrder lists "${name15}" more than once`);
    seen.add(name15);
  }
  if (!seen.has(TOOL_ORDER_REST)) {
    throw new Error(`toolOrder must contain the "${TOOL_ORDER_REST}" rest entry (where unlisted tools are inserted)`);
  }
  return toolOrder;
}
function orderTools(tools, toolOrder, knownNames) {
  const reserved = tools.find((tool) => tool.name === TOOL_ORDER_REST);
  if (reserved !== void 0) {
    throw new Error(`tool provider returned reserved tool name "${TOOL_ORDER_REST}" (reserved for toolOrder's rest entry)`);
  }
  if (toolOrder === void 0) return tools.sort(compareToolNames);
  const unknown = toolOrder.filter((name15) => name15 !== TOOL_ORDER_REST && !knownNames.has(name15));
  if (unknown.length > 0) {
    throw new Error(`toolOrder lists unregistered tool${unknown.length > 1 ? "s" : ""} ${unknown.map((name15) => `"${name15}"`).join(", ")}; known tools: ${[...knownNames].sort().join(", ") || "(none)"}`);
  }
  const listed = new Set(toolOrder);
  const rest = tools.filter((tool) => !listed.has(tool.name)).sort(compareToolNames);
  return toolOrder.flatMap((name15) => name15 === TOOL_ORDER_REST ? rest : tools.filter((tool) => tool.name === name15));
}
function compareToolNames(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}
function renderPrompt(assembly) {
  return assembly.sections.map((section) => interpolate(section, assembly.variables, "section")).filter((text) => text.length > 0).join("\n\n");
}
function joinContextSections(sections) {
  const body = sections.map((section) => section.text).join("\n\n");
  if (body.length === 0) return "";
  return `Current runtime context. This snapshot supersedes earlier runtime-context snapshots.

${body}`;
}
function renderContextSections(assembly) {
  return assembly.contexts.map((context) => ({ name: context.name, text: interpolate(context, assembly.variables, "context") })).filter((section) => section.text.length > 0);
}
function interpolate(input, variables, kind) {
  const text = input.text;
  let result = "";
  let last = 0;
  for (let open = text.indexOf("{{"); open >= 0; open = text.indexOf("{{", last)) {
    const group = GROUP_AT.exec(text.slice(open));
    if (group === null) {
      if (text.indexOf("}}", open + 2) >= 0) {
        throw new Error(`malformed prompt variable reference at "${text.slice(open, open + 16)}\u2026" in ${kind} "${input.name}" (references are complete simple {{name}} groups)`);
      }
      result += text.slice(last, open + 2);
      last = open + 2;
      continue;
    }
    const name15 = group[0].slice(2, -2);
    if (!VARIABLE_NAME.test(name15)) {
      throw new Error(`malformed prompt variable reference "{{${name15}}}" in ${kind} "${input.name}" (variable names match ${String(VARIABLE_NAME)})`);
    }
    if (!Object.hasOwn(variables, name15)) {
      const known = Object.keys(variables);
      throw new Error(`unknown prompt variable "{{${name15}}}" in ${kind} "${input.name}"; registered variables: ${known.length > 0 ? known.join(", ") : "(none)"}`);
    }
    const value = variables[name15];
    if (value === void 0) {
      throw new Error(`prompt variable "{{${name15}}}" has no value for this assembly (${kind} "${input.name}")`);
    }
    result += text.slice(last, open) + value;
    last = open + group[0].length;
  }
  return result + text.slice(last);
}
var PromptLayer = class {
  sections;
  contexts;
  runtimeContextSuppressors = new AnonymousEntries();
  toolProviders = new AnonymousEntries();
  variables;
  /**
   * Create one prompt layer with diagnostics specific to its ownership scope.
   * @param scope - the scoped owner, or `undefined` for global registrations.
   */
  constructor(scope2) {
    this.sections = new NamedEntries((name15) => new Error(scope2 === void 0 ? `prompt section "${name15}" is already registered (for a per-agent override, register through that agent's \`agent.ctx\` instead)` : `prompt section "${name15}" is already registered in this scope`));
    this.contexts = new NamedEntries((name15) => new Error(scope2 === void 0 ? `prompt context "${name15}" is already registered (for a per-agent override, register through that agent's \`agent.ctx\` instead)` : `prompt context "${name15}" is already registered in this scope`));
    this.variables = new NamedEntries((name15) => new Error(scope2 === void 0 ? `prompt variable "${name15}" is already registered (for a per-agent value, register through that agent's \`agent.ctx\` instead)` : `prompt variable "${name15}" is already registered in this scope`));
  }
  /** @returns whether this layer owns no prompt registrations. */
  isEmpty() {
    return this.sections.isEmpty() && this.contexts.isEmpty() && this.runtimeContextSuppressors.isEmpty() && this.toolProviders.isEmpty() && this.variables.isEmpty();
  }
};
var SystemPrompt = class extends Service {
  static Config = src_default2.object({
    includeHarnessIdentity: src_default2.boolean().default(true),
    includeRuntimeContext: src_default2.boolean().default(true),
    persona: src_default2.string().default(""),
    // Preserve omission because an explicit empty order lacks the rest marker.
    toolOrder: src_default2.array(src_default2.string()).default(void 0)
  });
  layers = new ScopedLayers(
    (scope2) => new PromptLayer(scope2),
    () => {
      this.ctx.emit("system-prompt/change");
    }
  );
  toolOrder;
  constructor(ctx, config) {
    super(ctx, "systemPrompt");
    this.toolOrder = validateToolOrder(config.toolOrder);
    if (config.includeHarnessIdentity ?? true) {
      this.section({
        name: "harness:identity",
        order: -100,
        text: "You are an AI agent powered by DeepSeek Harness."
      });
    }
    this.section({
      name: PERSONA_SECTION,
      order: PERSONA_ORDER,
      // The fallback narrows the optional input type; the schema already defaults it.
      text: config.persona ?? ""
    });
    if (!(config.includeRuntimeContext ?? true)) this.suppressRuntimeContext();
  }
  /**
   * Register an ordered prompt section in the calling context's scope. A scoped
   * section shadows a global section with the same name; duplicates within one
   * layer and non-finite orders throw. Registration and disposal emit
   * `system-prompt/change`.
   * @param section - the section to register.
   * @returns the exact Cordis effect disposer.
   */
  section(section) {
    if (!Number.isFinite(section.order)) {
      throw new TypeError(`prompt section "${section.name}" order must be a finite number`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.sections.insert(section.name, section),
      { label: "systemPrompt.section()" }
    );
  }
  /**
   * Register ordered dynamic context in the calling context's scope. Scoped
   * entries shadow global entries with the same name.
   * @param context - the context contribution to register.
   * @returns the exact Cordis effect disposer.
   */
  context(context) {
    if (!Number.isFinite(context.order)) {
      throw new TypeError(`prompt context "${context.name}" order must be a finite number`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.contexts.insert(context.name, context),
      { label: "systemPrompt.context()" }
    );
  }
  /**
   * Suppress every dynamic runtime-context contribution in the calling
   * context's scope without changing the services that own or enforce those
   * facts. Multiple suppressors remain independently disposable.
   * @returns the exact Cordis effect disposer.
   */
  suppressRuntimeContext() {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.runtimeContextSuppressors.append(true),
      { label: "systemPrompt.suppressRuntimeContext()" }
    );
  }
  /**
   * Register a tool-schema provider in the calling context's scope. Global and
   * matching scoped providers both contribute; returning the reserved
   * {@link TOOL_ORDER_REST} name makes assembly fail.
   * @param provider - evaluated for each assembly with its context.
   * @returns the exact Cordis effect disposer.
   */
  tools(provider) {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.toolProviders.append(provider),
      { label: "systemPrompt.tools()" }
    );
  }
  /**
   * Register a prompt variable in the calling context's scope. Scoped values
   * shadow globals; invalid or duplicate names throw. A provider may return
   * `undefined`, but rendering a section that references that value then fails.
   * @param name - the `[a-z][a-z0-9_]*` reference name.
   * @param provider - evaluated for each assembly.
   * @returns the exact Cordis effect disposer.
   */
  variable(name15, provider) {
    if (!VARIABLE_NAME.test(name15)) {
      throw new Error(`invalid prompt variable name "${name15}" (must match ${String(VARIABLE_NAME)})`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.variables.insert(name15, provider),
      { label: "systemPrompt.variable()" }
    );
  }
  /**
   * Assemble global and scoped providers, detach tool parameters, apply
   * canonical ordering, then run the assembly waterfall. Scoped sections and
   * variables shadow globals. The returned waterfall value is authoritative
   * except that an effective complete section is restored afterwards as the
   * sole prompt section.
   * @param context - the optional scope and plugin-defined assembly fields.
   * @returns the post-waterfall assembly with any complete prompt enforced.
   */
  // Keep configuration failures on the declared asynchronous error path.
  async assemble(context = {}) {
    const scope2 = context.scope;
    const scopeLayers = this.layers.chainLayers(scope2);
    const runtimeContextSuppressed = !this.layers.global.runtimeContextSuppressors.isEmpty() || scopeLayers.some((layer) => !layer.runtimeContextSuppressors.isEmpty());
    const variables = {};
    for (const [name15, provider] of this.layers.global.variables.entries()) {
      variables[name15] = provider(context);
    }
    for (const layer of scopeLayers) {
      for (const [name15, provider] of layer.variables.entries()) {
        variables[name15] = provider(context);
      }
    }
    const sectionByName = this.layers.merge(scope2, (layer) => layer.sections);
    const contextByName = this.layers.merge(scope2, (layer) => layer.contexts);
    const providers = [
      ...this.layers.global.toolProviders.values(),
      ...scopeLayers.flatMap((layer) => [...layer.toolProviders.values()])
    ];
    const collected = [];
    const knownNames = /* @__PURE__ */ new Set();
    for (const provider of providers) {
      const result = provider(context);
      const schemas = result.schemas.map(({ name: name15, description, parameters }) => ({
        name: name15,
        description,
        parameters: structuredClone(parameters)
      }));
      const acceptedKnownNames = result.knownNames ?? schemas.map((tool) => tool.name);
      collected.push(...schemas);
      for (const name15 of acceptedKnownNames) knownNames.add(name15);
    }
    const sectionDefinitions = [...sectionByName.values()].sort((a, b) => a.order - b.order);
    const completeSections = sectionDefinitions.filter((section) => section.complete === true);
    if (completeSections.length > 1) {
      throw new Error(`multiple complete prompt sections are active: ${completeSections.map((section) => JSON.stringify(section.name)).join(", ")}`);
    }
    let completeSection;
    const sections = sectionDefinitions.map((section) => {
      const assembled = {
        name: section.name,
        text: typeof section.text === "function" ? section.text(context) : section.text
      };
      if (section.complete === true) completeSection = { ...assembled };
      return assembled;
    });
    const assembly = {
      sections,
      contexts: runtimeContextSuppressed ? [] : [...contextByName.values()].sort((a, b) => a.order - b.order).map((entry) => ({
        name: entry.name,
        text: typeof entry.text === "function" ? entry.text(context) : entry.text
      })),
      tools: orderTools(collected, this.toolOrder, knownNames),
      variables
    };
    const transformed = await this.ctx.waterfall(
      scopeTarget(this, scope2),
      "system-prompt/assemble",
      assembly,
      context,
      () => Promise.resolve(assembly)
    );
    if (completeSection === void 0 && !runtimeContextSuppressed) return transformed;
    return {
      ...transformed,
      sections: completeSection === void 0 ? transformed.sections : [completeSection],
      contexts: runtimeContextSuppressed ? [] : transformed.contexts
    };
  }
};
var src_default6 = SystemPrompt;

// ../../source/deepseek-harness/packages/core/tools/src/json-schema.ts
var JsonSchemaError = class extends HarnessError {
  /** Individual schema violations in walk order. */
  violations;
  constructor(violations) {
    super(`unsupported JSON schema: ${violations.join("; ")}`, "UNSUPPORTED_SCHEMA");
    this.name = "JsonSchemaError";
    this.violations = violations;
  }
};
var CONSTRAINT_KEYWORDS = /* @__PURE__ */ new Set([
  "type",
  "oneOf",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const"
]);
var ANNOTATION_KEYWORDS = /* @__PURE__ */ new Set(["description", "title", "default", "examples"]);
var SCHEMA_TYPES = ["object", "array", "string", "number", "integer", "boolean", "null"];
function hasIntrinsicConstructor2(prototype, name15) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name15 && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === `function ${name15}() { [native code] }`;
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype2(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor2(value, "Object");
}
function isPlainJsonRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype2(prototype);
  } catch {
    return false;
  }
}
function hasPlainArrayPrototype2(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor2(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype2(objectPrototype);
}
function hasOnlyEnumerableStringKeys(value) {
  try {
    return Reflect.ownKeys(value).every((key) => typeof key === "string" && Object.prototype.propertyIsEnumerable.call(value, key));
  } catch {
    return false;
  }
}
function isJsonSchemaRecord(value) {
  return isPlainJsonRecord(value) && hasOnlyEnumerableStringKeys(value);
}
function isPlainJsonArray(value) {
  if (!Array.isArray(value)) return false;
  try {
    if (!hasPlainArrayPrototype2(value) || Reflect.ownKeys(value).length !== value.length + 1) return false;
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(value, index)) return false;
    }
    return true;
  } catch {
    return false;
  }
}
function isJsonNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
}
function scalarMatches(type, value) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return isJsonNumber(value);
    case "integer":
      return isJsonNumber(value) && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    /* v8 ignore next -- JsonSchemaScalarType is closed; this retains compile-time exhaustiveness. */
    default:
      return assertNever(type, "JsonSchemaType");
  }
}
var ONE_OF_SIBLING_KEYWORDS = ["properties", "required", "additionalProperties", "items", "enum", "const"];
function checkObjectSchemaTail(node, path, properties, violations) {
  const hasRequired = Object.hasOwn(node, "required");
  const required = hasRequired ? node.required : void 0;
  if (hasRequired) {
    if (!isPlainJsonArray(required) || required.some((entry) => typeof entry !== "string")) {
      violations.push(`${path}.required must be an array of strings`);
    } else {
      const declared = isJsonSchemaRecord(properties) ? properties : {};
      for (const key of required) {
        if (!Object.hasOwn(declared, key)) violations.push(`${path}.required names "${key}" which is not in properties`);
      }
    }
  }
  if (Object.hasOwn(node, "additionalProperties") && typeof node.additionalProperties !== "boolean") {
    violations.push(`${path}.additionalProperties must be a boolean`);
  }
}
function checkSchemaNode(root, rootPath, violations, seen) {
  const tasks = [{ kind: "enter", node: root, path: rootPath }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.node);
      continue;
    }
    if (task.kind === "one-of-tail") {
      for (const key of ONE_OF_SIBLING_KEYWORDS) {
        if (Object.hasOwn(task.node, key)) violations.push(`${task.path}.${key} is not supported beside oneOf`);
      }
      continue;
    }
    if (task.kind === "object-tail") {
      checkObjectSchemaTail(task.node, task.path, task.properties, violations);
      continue;
    }
    const { node, path } = task;
    if (!isJsonSchemaRecord(node)) {
      violations.push(`${path} must be a schema object`);
      continue;
    }
    if (seen.has(node)) {
      violations.push(`${path} is circular`);
      continue;
    }
    seen.add(node);
    tasks.push({ kind: "leave", node });
    for (const key of Object.keys(node)) {
      if (CONSTRAINT_KEYWORDS.has(key)) continue;
      if (ANNOTATION_KEYWORDS.has(key)) {
        try {
          if (!isJsonValue(node[key])) violations.push(`${path}.${key} annotation must be lossless JSON data`);
        } catch {
          violations.push(`${path}.${key} annotation must be lossless JSON data`);
        }
        continue;
      }
      violations.push(`${path}.${key} is not a supported keyword (subset: type/oneOf/properties/required/additionalProperties/items/enum/const + annotations)`);
    }
    if (Object.hasOwn(node, "description") && typeof node.description !== "string") {
      violations.push(`${path}.description must be a string`);
    }
    if (Object.hasOwn(node, "title") && typeof node.title !== "string") {
      violations.push(`${path}.title must be a string`);
    }
    const hasType = Object.hasOwn(node, "type");
    const hasOneOf = Object.hasOwn(node, "oneOf");
    if (hasType && hasOneOf) {
      violations.push(`${path} cannot declare both type and oneOf`);
      continue;
    }
    if (!hasType && !hasOneOf) {
      for (const key of ONE_OF_SIBLING_KEYWORDS) {
        if (Object.hasOwn(node, key)) violations.push(`${path}.${key} requires type or oneOf`);
      }
      continue;
    }
    if (hasOneOf) {
      const oneOf = node.oneOf;
      tasks.push({ kind: "one-of-tail", node, path });
      if (!isPlainJsonArray(oneOf) || oneOf.length < 2) {
        violations.push(`${path}.oneOf must be an array of at least two schemas`);
      } else {
        for (let index = oneOf.length - 1; index >= 0; index--) {
          tasks.push({ kind: "enter", node: oneOf[index], path: `${path}.oneOf[${index}]` });
        }
      }
      continue;
    }
    const type = node.type;
    if (typeof type !== "string" || !SCHEMA_TYPES.includes(type)) {
      violations.push(Array.isArray(type) ? `${path}.type must be a single type string (type arrays are not supported)` : `${path}.type must be one of ${SCHEMA_TYPES.join("/")}`);
      continue;
    }
    const schemaType = type;
    const allowedFor = {
      properties: ["object"],
      required: ["object"],
      additionalProperties: ["object"],
      items: ["array"],
      enum: ["string", "number", "integer", "boolean", "null"],
      const: ["string", "number", "integer", "boolean", "null"]
    };
    for (const [key, types] of Object.entries(allowedFor)) {
      if (Object.hasOwn(node, key) && !types.includes(schemaType)) {
        violations.push(`${path}.${key} is not supported on type "${schemaType}"`);
      }
    }
    switch (schemaType) {
      case "object": {
        const properties = Object.hasOwn(node, "properties") ? node.properties : void 0;
        tasks.push({ kind: "object-tail", node, path, properties });
        if (Object.hasOwn(node, "properties")) {
          if (!isJsonSchemaRecord(properties)) {
            violations.push(`${path}.properties must be an object of schemas`);
          } else {
            const entries = Object.entries(properties);
            for (let index = entries.length - 1; index >= 0; index--) {
              const entry = entries[index];
              if (entry === void 0) continue;
              tasks.push({ kind: "enter", node: entry[1], path: `${path}.properties.${entry[0]}` });
            }
          }
        }
        break;
      }
      case "array": {
        if (Object.hasOwn(node, "items")) tasks.push({ kind: "enter", node: node.items, path: `${path}.items` });
        break;
      }
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null": {
        const hasEnum = Object.hasOwn(node, "enum");
        const allowed = hasEnum ? node.enum : void 0;
        const enumValid = isPlainJsonArray(allowed) && allowed.length > 0 && allowed.every((entry) => scalarMatches(schemaType, entry));
        if (hasEnum && !enumValid) {
          violations.push(`${path}.enum must be a non-empty array of ${schemaType} values`);
        }
        const hasConst = Object.hasOwn(node, "const");
        const declaredConst = hasConst ? node.const : void 0;
        const constValid = scalarMatches(schemaType, declaredConst);
        if (hasConst) {
          if (!constValid) {
            violations.push(`${path}.const must be a ${schemaType} value`);
          } else if (enumValid && !allowed.includes(declaredConst)) {
            violations.push(`${path}.const must be one of ${path}.enum when both are declared`);
          }
        }
        break;
      }
      /* v8 ignore next -- schemaType was narrowed from the closed SCHEMA_TYPES table above. */
      default:
        assertNever(schemaType, "JsonSchemaType");
    }
  }
}
function assertSupportedJsonSchema(schema) {
  const violations = [];
  checkSchemaNode(schema, "schema", violations, /* @__PURE__ */ new Set());
  if (violations.length > 0) throw new JsonSchemaError(violations);
}
function safelyIsJsonValue(value) {
  try {
    return isJsonValue(value);
  } catch {
    return false;
  }
}
function diagnosticPath(path) {
  return path === "" ? "arguments" : path;
}
function propertyPath(path, key) {
  return path === "" ? key : `${path}.${key}`;
}
function losslessValueViolation(path) {
  return [`"${diagnosticPath(path)}" must be a lossless JSON value`];
}
function appendViolations(target, source) {
  for (const violation of source) target.push(violation);
}
function valueFrame(node, value, path) {
  return {
    node,
    value,
    path,
    catches: false,
    phase: "start",
    children: [],
    childIndex: 0,
    violations: [],
    tailViolations: [],
    matches: 0
  };
}
function checkScalarValue(node, value, path) {
  const allowed = Object.hasOwn(node, "enum") ? node.enum : void 0;
  if (allowed !== void 0 && !allowed.includes(value)) {
    return [`"${diagnosticPath(path)}" must be one of ${JSON.stringify(allowed)}`];
  }
  if (Object.hasOwn(node, "const") && value !== node.const) {
    return [`"${diagnosticPath(path)}" must be ${JSON.stringify(node.const)}`];
  }
  return [];
}
function checkValue(schema, value, path) {
  const frames = [valueFrame(schema, value, path)];
  let rootResult;
  const receive = (result) => {
    const parent = frames.at(-1);
    if (parent === void 0) {
      rootResult = result;
      return;
    }
    if (parent.kind === "oneOf") {
      if (result.length === 0) parent.matches++;
    } else {
      appendViolations(parent.violations, result);
    }
  };
  const finish = (result) => {
    frames.pop();
    receive(result);
  };
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === void 0) break;
    try {
      if (frame.phase === "children") {
        if (frame.childIndex < frame.children.length) {
          const child = frame.children[frame.childIndex];
          if (child === void 0) throw new Error("missing schema-value child frame");
          frame.childIndex++;
          frames.push(valueFrame(child.node, child.value, child.path));
          continue;
        }
        if (frame.kind === "oneOf") {
          finish(frame.matches === 1 ? [] : [`"${diagnosticPath(frame.path)}" must match exactly one oneOf branch (matched ${frame.matches})`]);
          continue;
        }
        appendViolations(frame.violations, frame.tailViolations);
        if (frame.violations.length > 0) {
          finish(frame.violations);
        } else if (frame.kind === "object") {
          finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a lossless JSON object`]);
        } else {
          finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a dense lossless JSON array`]);
        }
        continue;
      }
      const nodeType = Object.hasOwn(frame.node, "type") ? frame.node.type : void 0;
      frame.catches = !(nodeType !== void 0 && !SCHEMA_TYPES.includes(nodeType));
      const oneOf = Object.hasOwn(frame.node, "oneOf") ? frame.node.oneOf : void 0;
      if (oneOf !== void 0) {
        frame.kind = "oneOf";
        frame.children = Array.from(oneOf, (branch) => ({ node: branch, value: frame.value, path: frame.path }));
        frame.childIndex = 0;
        frame.matches = 0;
        frame.phase = "children";
        continue;
      }
      if (nodeType === void 0) {
        finish(safelyIsJsonValue(frame.value) ? [] : losslessValueViolation(frame.path));
        continue;
      }
      switch (nodeType) {
        case "object": {
          if (!isPlainJsonRecord(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an object`]);
            break;
          }
          const properties = Object.hasOwn(frame.node, "properties") ? frame.node.properties ?? {} : {};
          const violations = [];
          const required = Object.hasOwn(frame.node, "required") ? frame.node.required ?? [] : [];
          for (const key of required) {
            if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) {
              violations.push(`missing required property "${propertyPath(frame.path, key)}"`);
            }
          }
          const children = [];
          for (const [key, child] of Object.entries(properties)) {
            if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) continue;
            children.push({ node: child, value: frame.value[key], path: propertyPath(frame.path, key) });
          }
          const tailViolations = [];
          if (Object.hasOwn(frame.node, "additionalProperties") && frame.node.additionalProperties === false) {
            for (const key of Object.keys(frame.value)) {
              if (!Object.hasOwn(properties, key)) {
                tailViolations.push(`"${propertyPath(frame.path, key)}" is not a declared property (additionalProperties: false)`);
              }
            }
          }
          frame.kind = "object";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = violations;
          frame.tailViolations = tailViolations;
          frame.phase = "children";
          break;
        }
        case "array": {
          if (!Array.isArray(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an array`]);
            break;
          }
          const items = Object.hasOwn(frame.node, "items") ? frame.node.items : void 0;
          const children = items === void 0 ? [] : frame.value.flatMap((entry, index) => [{ node: items, value: entry, path: `${frame.path}[${index}]` }]);
          frame.kind = "array";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = [];
          frame.phase = "children";
          break;
        }
        case "string":
          finish(typeof frame.value === "string" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a string`]);
          break;
        case "number":
          finish(typeof frame.value !== "number" ? [`"${diagnosticPath(frame.path)}" must be a number`] : !isJsonNumber(frame.value) ? [`"${diagnosticPath(frame.path)}" must be a finite JSON number`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "integer":
          finish(!isJsonNumber(frame.value) || !Number.isInteger(frame.value) ? [`"${diagnosticPath(frame.path)}" must be an integer`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "boolean":
          finish(typeof frame.value === "boolean" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a boolean`]);
          break;
        case "null":
          finish(frame.value === null ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be null`]);
          break;
        default:
          finish(assertNever(nodeType, "JsonSchemaType"));
      }
    } catch (error) {
      let failed = frames.pop();
      while (failed !== void 0 && !failed.catches) failed = frames.pop();
      if (failed === void 0) throw error;
      receive(losslessValueViolation(failed.path));
    }
  }
  return rootResult ?? losslessValueViolation(path);
}
function validateJsonSchemaValue(schema, value, path = "value") {
  return checkValue(schema, value, path);
}

// ../../source/deepseek-harness/packages/core/tools/src/schema.ts
var ANNOTATION_KEYS = ["description", "title", "default", "examples"];
function authorError(message) {
  throw new JsonSchemaError([message]);
}
function copyAnnotations(source, target) {
  if (Object.hasOwn(source, "description")) target.description = source.description;
  if (Object.hasOwn(source, "title")) target.title = source.title;
  if (Object.hasOwn(source, "default")) target.default = source.default;
  if (Object.hasOwn(source, "examples")) target.examples = source.examples;
}
function assertAuthorKeys(source, path, allowed) {
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) authorError(`${path}.${key} is not supported by the value schema DSL`);
  }
}
function assignCompiledNode(destination, node) {
  switch (destination.kind) {
    case "root":
      destination.holder.value = node;
      break;
    case "property":
      Object.defineProperty(destination.target, destination.key, {
        value: node,
        enumerable: true,
        configurable: true,
        writable: true
      });
      break;
    case "item":
      destination.target.items = node;
      break;
    case "one-of":
      destination.target[destination.index] = node;
      break;
  }
}
function assignCompiledPropertyMap(destination, compiled) {
  if (destination.kind === "root") {
    destination.holder.value = compiled;
  } else {
    destination.target.properties = compiled.properties;
  }
}
function runSchemaCompiler(initial) {
  const seen = /* @__PURE__ */ new Set();
  const tasks = [initial];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.input);
      continue;
    }
    if (task.kind === "property-map-tail") {
      if (task.required.length > 0) {
        task.compiled.required = task.required;
        if (task.destination.kind === "object") task.destination.target.required = task.required;
      }
      continue;
    }
    if (task.kind === "property") {
      if (!isJsonSchemaRecord(task.property)) authorError(`${task.path} must be a value schema object`);
      if (Object.hasOwn(task.property, "required") && task.property.required !== true) {
        authorError(`${task.path}.required must be true when present`);
      }
      if (Object.hasOwn(task.property, "required") && task.property.required === true) task.required.push(task.key);
      tasks.push({
        kind: "value",
        input: task.property,
        path: task.path,
        allowRequired: true,
        destination: { kind: "property", target: task.properties, key: task.key }
      });
      continue;
    }
    if (task.kind === "property-map") {
      if (!isJsonSchemaRecord(task.input)) authorError(`${task.path} must be an object of value schemas`);
      if (seen.has(task.input)) authorError(`${task.path} is circular`);
      seen.add(task.input);
      const compiled = { properties: {} };
      const required = [];
      assignCompiledPropertyMap(task.destination, compiled);
      tasks.push({ kind: "leave", input: task.input });
      tasks.push({ kind: "property-map-tail", compiled, required, destination: task.destination });
      const entries = Object.entries(task.input);
      for (let index = entries.length - 1; index >= 0; index--) {
        const entry = entries[index];
        if (entry === void 0) continue;
        tasks.push({
          kind: "property",
          property: entry[1],
          path: `${task.path}.${entry[0]}`,
          key: entry[0],
          properties: compiled.properties,
          required
        });
      }
      continue;
    }
    const { input, path } = task;
    if (!isJsonSchemaRecord(input)) authorError(`${path} must be a value schema object`);
    if (seen.has(input)) authorError(`${path} is circular`);
    seen.add(input);
    const authorKeys = [...ANNOTATION_KEYS, ...task.allowRequired ? ["required"] : []];
    const node = {};
    assignCompiledNode(task.destination, node);
    tasks.push({ kind: "leave", input });
    if (Object.hasOwn(input, "oneOf")) {
      assertAuthorKeys(input, path, [...authorKeys, "oneOf", "type"]);
      if (Object.hasOwn(input, "type")) authorError(`${path} cannot declare both type and oneOf`);
      if (!isPlainJsonArray(input.oneOf)) authorError(`${path}.oneOf must be an array of at least two value schemas`);
      const branches = [];
      node.oneOf = branches;
      copyAnnotations(input, node);
      for (let index = input.oneOf.length - 1; index >= 0; index--) {
        tasks.push({
          kind: "value",
          input: input.oneOf[index],
          path: `${path}.oneOf[${index}]`,
          allowRequired: false,
          destination: { kind: "one-of", target: branches, index }
        });
      }
      continue;
    }
    const inputType = Object.hasOwn(input, "type") ? input.type : void 0;
    switch (inputType) {
      case "json":
        assertAuthorKeys(input, path, [...authorKeys, "type"]);
        copyAnnotations(input, node);
        break;
      case "object":
        assertAuthorKeys(input, path, [...authorKeys, "type", "properties", "additionalProperties"]);
        if (!Object.hasOwn(input, "additionalProperties") || typeof input.additionalProperties !== "boolean") {
          authorError(`${path}.additionalProperties must be explicitly true or false`);
        }
        node.type = "object";
        copyAnnotations(input, node);
        node.additionalProperties = input.additionalProperties;
        if (Object.hasOwn(input, "properties")) {
          tasks.push({
            kind: "property-map",
            input: input.properties,
            path: `${path}.properties`,
            destination: { kind: "object", target: node }
          });
        }
        break;
      case "array":
        assertAuthorKeys(input, path, [...authorKeys, "type", "items"]);
        node.type = "array";
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "items")) {
          tasks.push({
            kind: "value",
            input: input.items,
            path: `${path}.items`,
            allowRequired: false,
            destination: { kind: "item", target: node }
          });
        }
        break;
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        assertAuthorKeys(input, path, [...authorKeys, "type", "enum", "const"]);
        node.type = inputType;
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "enum")) {
          if (!isPlainJsonArray(input.enum)) authorError(`${path}.enum must be a non-empty array of scalar values`);
          node.enum = Array.from(input.enum, (entry) => entry);
        }
        if (Object.hasOwn(input, "const")) node.const = input.const;
        break;
      default:
        authorError(`${path}.type must be string/number/integer/boolean/null/array/object/json, or use oneOf`);
    }
  }
}
function compilePropertyMap(input, path) {
  const holder = {};
  runSchemaCompiler({ kind: "property-map", input, path, destination: { kind: "root", holder } });
  return holder.value ?? authorError(`${path} did not compile`);
}
function compileValueSchema(input, path) {
  const holder = {};
  runSchemaCompiler({ kind: "value", input, path, allowRequired: false, destination: { kind: "root", holder } });
  return holder.value ?? authorError(`${path} did not compile`);
}
function valueSchemaSpecToJsonSchema(spec) {
  const schema = compileValueSchema(spec, "schema");
  assertSupportedJsonSchema(schema);
  return schema;
}
function parameterSchemaSpecToJsonSchema(spec) {
  const compiled = compilePropertyMap(spec, "parameters");
  const schema = {
    type: "object",
    properties: compiled.properties,
    ...compiled.required === void 0 ? {} : { required: compiled.required }
  };
  assertSupportedJsonSchema(schema);
  return schema;
}
var ToolArgsError = class extends HarnessError {
  /** Individual violations in schema-walk order. */
  violations;
  constructor(violations) {
    super(`invalid arguments: ${violations.join("; ")}`, "INVALID_ARGS");
    this.name = "ToolArgsError";
    this.violations = violations;
  }
};
function defineTool(options) {
  const userExecute = options.execute;
  const userFinalizeContent = options.finalizeContent;
  const userRender = options.output.render;
  const userPresentationMeta = options.output.presentationMeta;
  const userPresentCall = options.presentCall;
  const userPresentResult = options.presentResult;
  const userIsConcurrencySafe = options.isConcurrencySafe;
  if (options.timeoutMs !== void 0 && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
    throw new Error(`defineTool(${options.name}): timeoutMs must be a positive finite number`);
  }
  const parameters = parameterSchemaSpecToJsonSchema(options.parameters);
  const outputSchema = valueSchemaSpecToJsonSchema(options.output.schema);
  const validate = (args) => validateJsonSchemaValue(parameters, args, "");
  const tool = {
    name: options.name,
    description: options.description,
    parameters,
    output: {
      schema: outputSchema,
      render(args, value) {
        return userRender(args, value);
      },
      ...userPresentationMeta !== void 0 ? {
        presentationMeta(args, value) {
          return userPresentationMeta(args, value);
        }
      } : {}
    },
    ...options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : {},
    async execute(args, exec) {
      const violations = validate(args);
      if (violations.length > 0) throw new ToolArgsError(violations);
      return userExecute(args, exec);
    }
  };
  if (userFinalizeContent) {
    tool.finalizeContent = (exec, result) => userFinalizeContent(exec, result);
  }
  if (userPresentCall) {
    tool.presentCall = (args) => {
      if (validate(args).length > 0) return void 0;
      return userPresentCall(args);
    };
  }
  if (userPresentResult) {
    tool.presentResult = (args, result) => {
      if (validate(args).length > 0) return void 0;
      return userPresentResult(args, result);
    };
  }
  if (userIsConcurrencySafe) {
    tool.isConcurrencySafe = (args) => {
      if (validate(args).length > 0) return false;
      return userIsConcurrencySafe(args);
    };
  }
  return tool;
}

// ../../source/deepseek-harness/packages/core/tools/src/code-mode.ts
var RUN_CODE_NAME = "run_code";
var SDK_SECTION_ORDER = 150;
var TYPESCRIPT_FLAVOR = {
  description: "Execute a TypeScript program against the available tools. Takes two required arguments: `code`, the BODY of an async function (erasable syntax only; top-level `await` and `return` work), and `description`, a short summary of what the program does. Call tools as `await tools.name(args)` per the declarations in the system prompt. Only what you print or return is program output \u2014 curate it. Image-bearing subtool results are attached after the run.",
  codeDescription: "The program: the body of an async TypeScript function."
};
var PYTHON_FLAVOR = {
  description: "Execute a Python program against the available tools. Takes two required arguments: `code`, the BODY of an async function (top-level `await` and `return` work), and `description`, a short summary of what the program does. Call tools as `await tools.name(args)` per the declarations in the system prompt. Use `print(...)` and/or `return <value>` for program output \u2014 curate it. Image-bearing subtool results are attached after the run.",
  codeDescription: "The program: the body of an async Python function."
};
var RUN_CODE_FLAVORS = {
  typescript: TYPESCRIPT_FLAVOR,
  python: PYTHON_FLAVOR
};
var RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION = 'Clear, concise description of what this program does in active voice, 5-10 words (shown in the UI). Examples: "Count TODO markers across packages"; "Read failing test and its fixture"; "Rename config key in every cordis.yml".';
function resolveFlavor(peekRuntime) {
  const runtime = peekRuntime();
  if (runtime === void 0) {
    return TYPESCRIPT_FLAVOR;
  }
  const flavor = RUN_CODE_FLAVORS[runtime.language];
  if (!Object.hasOwn(RUN_CODE_FLAVORS, runtime.language) || flavor === void 0) {
    const known = Object.keys(RUN_CODE_FLAVORS).map((name15) => JSON.stringify(name15)).join(", ");
    throw new Error(`dsh-tools: no run_code schema flavor registered for runtime language ${JSON.stringify(runtime.language)} (known: ${known})`);
  }
  return flavor;
}
var CodeRunFailedError = class extends HarnessError {
  constructor(message) {
    super(message, "CODE_RUN_FAILED");
    this.name = "CodeRunFailedError";
  }
};
function jsonNormalizeArgs(value) {
  let snapshot;
  try {
    snapshot = snapshotJsonValue(value);
  } catch (error) {
    throw new Error(`tool arguments must be lossless JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (snapshot === void 0) {
    throw new Error("tool arguments must be lossless JSON (call the tool with an arguments object, e.g. `{}`)");
  }
  const logged = snapshotJsonValue(snapshot);
  if (logged === void 0) {
    throw new Error("tool arguments could not be detached for durable logging");
  }
  return { dispatched: snapshot, logged };
}
var JSON_INDENT = "  ";
var MAX_JSON_INDENT_CHARS = 10;
function renderJsonValue(value) {
  const chunks = [];
  const tasks = [{ kind: "value", value, depth: 0, compact: false }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "text") {
      chunks.push(task.text);
      continue;
    }
    const current = task.value;
    if (current === null || typeof current === "boolean" || typeof current === "number") {
      chunks.push(String(current));
      continue;
    }
    if (typeof current === "string") {
      chunks.push(JSON.stringify(current));
      continue;
    }
    const compact = task.compact || (task.depth + 1) * JSON_INDENT.length > MAX_JSON_INDENT_CHARS;
    const childDepth = task.depth + 1;
    if (Array.isArray(current)) {
      chunks.push("[");
      if (current.length === 0) {
        chunks.push("]");
        continue;
      }
      tasks.push({ kind: "text", text: compact ? "]" : `
${JSON_INDENT.repeat(task.depth)}]` });
      for (let index = current.length - 1; index >= 0; index--) {
        const item = current[index];
        if (item === void 0) throw new Error("cannot render a sparse JSON array");
        tasks.push({ kind: "value", value: item, depth: childDepth, compact });
        tasks.push({
          kind: "text",
          text: compact ? index === 0 ? "" : "," : `${index === 0 ? "\n" : ",\n"}${JSON_INDENT.repeat(childDepth)}`
        });
      }
      continue;
    }
    const keys = Object.keys(current);
    chunks.push("{");
    if (keys.length === 0) {
      chunks.push("}");
      continue;
    }
    tasks.push({ kind: "text", text: compact ? "}" : `
${JSON_INDENT.repeat(task.depth)}}` });
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) throw new Error("cannot render a missing JSON object key");
      const item = current[key];
      if (item === void 0) throw new Error("cannot render an undefined JSON object property");
      tasks.push({ kind: "value", value: item, depth: childDepth, compact });
      tasks.push({
        kind: "text",
        text: compact ? `${index === 0 ? "" : ","}${JSON.stringify(key)}:` : `${index === 0 ? "\n" : ",\n"}${JSON_INDENT.repeat(childDepth)}${JSON.stringify(key)}: `
      });
    }
  }
  return chunks.join("");
}
function renderValue(value) {
  return typeof value === "string" ? value : renderJsonValue(value);
}
function createRunCodeTool(registry, options) {
  const { requireRuntime, peekRuntime, maxParallel, shapeDispatchLog } = options;
  const definition = defineTool({
    name: RUN_CODE_NAME,
    // The description and `code` parameter description are placeholders here:
    // the language-aware getters installed below replace both, resolving the
    // loaded runtime's flavor at schema-emission time so the schema the MODEL
    // sees matches the SDK section's language. Argument VALIDATION still keys
    // off this static spec (defineTool closes over it), which is language-
    // independent (one required string `code`).
    description: TYPESCRIPT_FLAVOR.description,
    parameters: {
      code: { type: "string", required: true, description: TYPESCRIPT_FLAVOR.codeDescription },
      description: {
        type: "string",
        required: true,
        description: RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          logs: { type: "array", required: true, items: { type: "string" } },
          result: { type: "json" }
        }
      },
      render: (_args, value) => {
        const rendered = value.result === void 0 ? "" : renderValue(value.result);
        const parts = [value.logs.join("\n"), rendered].filter((part) => part.length > 0);
        return [{ type: "text", text: parts.length > 0 ? parts.join("\n") : "(run_code completed with no output)" }];
      }
    },
    async execute(args, exec) {
      if (args.description.trim().length === 0) {
        throw new Error("invalid description: expected a non-empty string");
      }
      const runtime = requireRuntime();
      const runController = new AbortController();
      const onOuterAbort = () => {
        runController.abort(exec.signal.reason);
      };
      exec.signal.addEventListener("abort", onOuterAbort, { once: true });
      let dispatches = 0;
      const pendingQueue = [];
      const inFlight = /* @__PURE__ */ new Set();
      const logWork = /* @__PURE__ */ new Set();
      const commitQueue = [];
      let exclusiveActive = false;
      let driving = false;
      let driverRun = Promise.resolve();
      let wake;
      const wakeup = () => {
        const release = wake;
        wake = void 0;
        release?.();
      };
      const drive = () => {
        if (driving) return driverRun;
        driving = true;
        driverRun = (async () => {
          try {
            for (; ; ) {
              const signal = new Promise((resolve5) => {
                wake = resolve5;
              });
              const commitHead = commitQueue[0];
              if (commitHead !== void 0 && commitHead.settled) {
                commitQueue.shift();
                await commitHead.commit();
                if (commitHead.mode === "exclusive") exclusiveActive = false;
                continue;
              }
              const head = pendingQueue[0];
              if (head !== void 0) {
                if (runController.signal.aborted) {
                  pendingQueue.shift();
                  head.abandon();
                  continue;
                }
                const mode = head.classify();
                const capacity = !exclusiveActive && (mode === "exclusive" ? inFlight.size === 0 : inFlight.size < maxParallel);
                if (capacity) {
                  if (mode === "exclusive") exclusiveActive = true;
                  head.mode = mode;
                  pendingQueue.shift();
                  commitQueue.push(head);
                  await head.start();
                  const flight = head.flight.finally(() => {
                    inFlight.delete(flight);
                    wakeup();
                  });
                  inFlight.add(flight);
                  continue;
                }
              }
              if (pendingQueue.length === 0 && commitQueue.length === 0 && inFlight.size === 0) return;
              await signal;
            }
          } finally {
            driving = false;
            wake = void 0;
          }
        })();
        return driverRun;
      };
      const drainDispatches = async () => {
        await drive();
        while (logWork.size > 0) await Promise.allSettled([...logWork]);
      };
      const runOver = () => runController.signal.aborted;
      const binding = (name15) => async (rawArgs) => {
        if (runOver()) {
          throw new Error(`run_code run is over (${String(runController.signal.reason)}); ${name15} not dispatched`);
        }
        const normalized = jsonNormalizeArgs(rawArgs);
        const n = ++dispatches;
        const subCallId = CallId(`${String(exec.callId)}:code:${n}`);
        const input = {
          callId: subCallId,
          rootCallId: exec.rootCallId,
          name: name15,
          arguments: normalized.dispatched,
          ...exec.agent ? { agent: exec.agent } : {},
          parent: exec.token,
          signal: runController.signal
        };
        const scheduler = registry[TOOL_RUNTIME_SCHEDULER];
        const outcome = await new Promise((resolve5, reject2) => {
          let parked;
          const settle = (result) => {
            resolve5(result.isError ? { isError: true, message: result.error.message } : { isError: false, value: result.value });
            const agent = exec.agent;
            if (agent === void 0) return;
            const task = (async () => {
              const logged = await shapeDispatchLog({
                exec,
                agent,
                subCallId,
                name: name15,
                isError: result.isError,
                // The registry deep-froze this projection at result
                // finalization; append snapshots the final copy again, so
                // the log stays detached.
                content: result.content
              });
              agent.session.append("tool/code-dispatch", {
                rootCallId: exec.rootCallId,
                parentCallId: exec.callId,
                subCallId,
                name: name15,
                // The SIBLING parse of the dispatched value: byte-identical JSON,
                // but a separate object — a tool mutating its args cannot desync
                // this record from what it actually received.
                arguments: normalized.logged,
                isError: result.isError,
                content: logged
              });
            })().finally(() => {
              logWork.delete(task);
            });
            logWork.add(task);
          };
          pendingQueue.push({
            flight: Promise.resolve(),
            settled: false,
            // Re-read per driver pass against the same agent view the SDK
            // declared; fail-closed exclusive when undeclared/invalid.
            classify: () => registry.executionMode(input).kind,
            abandon: () => {
              reject2(new Error(`run_code run is over (${String(runController.signal.reason)}); ${name15} tool call abandoned`));
            },
            async start() {
              exec.agent?.session.append("tool/code-dispatch-start", {
                rootCallId: exec.rootCallId,
                parentCallId: exec.callId,
                subCallId,
                name: name15,
                arguments: normalized.logged
              });
              const prepared = await scheduler.prepare(input);
              if (prepared.kind === "dispatch") {
                this.flight = scheduler.dispatch(prepared.exec).then((dispatchOutcome) => {
                  parked = { kind: dispatchOutcome.kind, exec: prepared.exec, result: dispatchOutcome.result };
                  this.settled = true;
                });
                return;
              }
              parked = { kind: prepared.kind, exec: prepared.exec, result: prepared.result };
              this.settled = true;
            },
            async commit() {
              if (parked === void 0) return;
              const result = parked.kind === "post-result" ? await scheduler.finalize(parked.exec, parked.result) : scheduler.finish(parked.exec, parked.result);
              if (!result.isError && result.content.some((block) => block.type === "image")) {
                exec.deferContext(createUserMessage({
                  content: result.content,
                  source: { kind: "plugin", plugin: "tools-code-mode" }
                }));
              }
              for (const context of result.additionalContexts ?? []) {
                exec.deferContext(context);
              }
              if (result.concludesTurn) exec.concludeTurn();
              settle(result);
              while (logWork.size > maxParallel) await Promise.race(logWork);
            }
          });
          wakeup();
          void drive();
        });
        if (runOver()) {
          throw new Error(`run_code run is over (${String(runController.signal.reason)}); ${name15} result discarded`);
        }
        if (outcome.isError) throw new Error(outcome.message);
        return outcome.value;
      };
      const functions = /* @__PURE__ */ Object.create(null);
      for (const schema of registry.schemas(exec.agent)) {
        if (schema.name === RUN_CODE_NAME) continue;
        Object.defineProperty(functions, schema.name, { enumerable: true, value: binding(schema.name) });
      }
      try {
        let result;
        try {
          result = await runtime.run({
            program: args.code,
            bindings: [{
              global: "tools",
              functions,
              errorClass: { name: "ToolCallError", memberNameProperty: "toolName" }
            }],
            signal: runController.signal
          });
        } finally {
          runController.abort("run_code settled");
          await drainDispatches();
        }
        if (result.error) {
          const logsText = result.logs.length > 0 ? `
Captured output:
${result.logs.join("\n")}` : "";
          throw new CodeRunFailedError(`code run failed (${result.error.kind}): ${result.error.message}${logsText}`);
        }
        return {
          logs: result.logs,
          ...result.value !== void 0 ? { result: result.value } : {}
        };
      } finally {
        exec.signal.removeEventListener("abort", onOuterAbort);
      }
    },
    // The model-authored description is the call's always-visible UI label
    // (the bash `description` precedent); the program itself rides rawInput.
    presentCall: (args) => ({
      card: "generic",
      title: args.description,
      kind: "execute",
      rawInput: args.code
    })
    // Deliberately no presentResult: the generic card fallback keeps this
    // title and reads durable result content without duplicating a large raw
    // result into the host view payload.
  });
  Object.defineProperty(definition, "description", {
    enumerable: true,
    get: () => resolveFlavor(peekRuntime).description
  });
  Object.defineProperty(definition, "parameters", {
    enumerable: true,
    // Recompile through the same spec→schema projection defineTool used, so
    // the emitted schema always matches the validated specification.
    get: () => parameterSchemaSpecToJsonSchema({
      code: { type: "string", required: true, description: resolveFlavor(peekRuntime).codeDescription },
      description: { type: "string", required: true, description: RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION }
    })
  });
  return definition;
}

// ../../source/deepseek-harness/packages/core/tools/src/ts-types.ts
var IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
function renderKey(name15) {
  return IDENTIFIER.test(name15) ? name15 : JSON.stringify(name15);
}
function pad(indent) {
  return "  ".repeat(indent);
}
function docLines(description, indent) {
  if (typeof description !== "string" || description.length === 0) return [];
  const collapsed = description.replace(/\s+/g, " ").trim();
  return [`${pad(indent)}/** ${collapsed.replaceAll("*/", String.raw`*\/`)} */`];
}
function renderScalar(value) {
  return JSON.stringify(value);
}
function renderConstrainedScalar(node, type) {
  const broad = type === "integer" ? "number" : type;
  if (Object.hasOwn(node, "const")) return renderScalar(node.const);
  if (Object.hasOwn(node, "enum")) {
    return node.enum.map(renderScalar).join(" | ");
  }
  return broad;
}
function typeDocumentFrom(parts) {
  return {
    parts,
    containsUnionOrIntersection: parts.some((part) => typeof part === "string" ? part.includes("|") || part.includes("&") : part.containsUnionOrIntersection)
  };
}
function typeDocument(...parts) {
  return typeDocumentFrom(parts);
}
function flattenTypeDocument(document) {
  const chunks = [];
  const tasks = [document];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (typeof task === "string") {
      chunks.push(task);
      continue;
    }
    for (let index = task.parts.length - 1; index >= 0; index--) {
      const part = task.parts[index];
      if (part !== void 0) tasks.push(part);
    }
  }
  return chunks.join("");
}
function schemaRenderFrame(node, indent) {
  return { node, indent, phase: "start", children: [], childIndex: 0, childDocuments: [], entries: [] };
}
function renderSupportedSchema(schema, indent) {
  const frames = [schemaRenderFrame(schema, indent)];
  let rootDocument;
  const finish = (document) => {
    frames.pop();
    const parent = frames.at(-1);
    if (parent === void 0) rootDocument = document;
    else parent.childDocuments.push(document);
  };
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === void 0) break;
    if (frame.phase === "children") {
      if (frame.childIndex < frame.children.length) {
        const child = frame.children[frame.childIndex];
        if (child === void 0) throw new Error("missing schema render child");
        frame.childIndex++;
        frames.push(schemaRenderFrame(child.node, child.indent));
        continue;
      }
      if (frame.kind === "oneOf") {
        const parts2 = [];
        for (let index = 0; index < frame.childDocuments.length; index++) {
          if (index > 0) parts2.push(" | ");
          const child = frame.childDocuments[index];
          if (child !== void 0) parts2.push(child);
        }
        finish(typeDocumentFrom(parts2));
        continue;
      }
      if (frame.kind === "array") {
        const child = frame.childDocuments[0];
        if (child === void 0) throw new Error("missing array item type");
        finish(child.containsUnionOrIntersection ? typeDocument("(", child, ")[]") : typeDocument(child, "[]"));
        continue;
      }
      const required = new Set(frame.node.required);
      const parts = ["{"];
      for (let index = 0; index < frame.entries.length; index++) {
        const entry = frame.entries[index];
        const child = frame.childDocuments[index];
        if (entry === void 0 || child === void 0) throw new Error("missing object property type");
        const [name15, prop] = entry;
        for (const line of docLines(prop.description, frame.indent + 1)) parts.push("\n", line);
        parts.push("\n", `${pad(frame.indent + 1)}${renderKey(name15)}${required.has(name15) ? "" : "?"}: `, child, ";");
      }
      parts.push("\n", `${pad(frame.indent)}}`);
      const declared = typeDocumentFrom(parts);
      finish(frame.node.additionalProperties === false ? declared : typeDocument(declared, " & Record<string, JsonValue>"));
      continue;
    }
    const node = frame.node;
    if (node.oneOf !== void 0) {
      frame.kind = "oneOf";
      frame.children = Array.from(node.oneOf, (child) => ({ node: child, indent: frame.indent }));
      frame.childIndex = 0;
      frame.childDocuments = [];
      frame.phase = "children";
      continue;
    }
    if (node.type === void 0) {
      finish(typeDocument("JsonValue"));
      continue;
    }
    switch (node.type) {
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        finish(typeDocument(renderConstrainedScalar(node, node.type)));
        break;
      case "array":
        if (node.items === void 0) {
          finish(typeDocument("JsonValue[]"));
        } else {
          frame.kind = "array";
          frame.children = [{ node: node.items, indent: frame.indent }];
          frame.childIndex = 0;
          frame.childDocuments = [];
          frame.phase = "children";
        }
        break;
      case "object": {
        const open = node.additionalProperties !== false;
        const entries = Object.entries(node.properties ?? {});
        if (entries.length === 0) {
          finish(typeDocument(open ? "Record<string, JsonValue>" : "Record<string, never>"));
        } else {
          frame.kind = "object";
          frame.entries = entries;
          frame.children = entries.map(([, child]) => ({ node: child, indent: frame.indent + 1 }));
          frame.childIndex = 0;
          frame.childDocuments = [];
          frame.phase = "children";
        }
        break;
      }
      /* v8 ignore next -- assertSupportedJsonSchema narrowed this closed type union. */
      default:
        finish(typeDocument("unknown"));
    }
  }
  return rootDocument ?? typeDocument("unknown");
}
function jsonSchemaToTs(schema, indent = 0) {
  try {
    assertSupportedJsonSchema(schema);
    return flattenTypeDocument(renderSupportedSchema(schema, indent));
  } catch {
    return "unknown";
  }
}
var SDK_INSTRUCTIONS = `## Writing code for run_code

\`run_code\` takes two required arguments: \`code\` \u2014 the body of an async TypeScript function (erasable syntax only \u2014 no \`enum\` or namespaces; type annotations are advisory, the code runs type-stripped) \u2014 and \`description\`, a short summary of what the program does. Inside the program:

- Call tools as \`await tools.name(args)\` \u2014 quoted access for exotic names: \`tools["my-tool"](args)\`. Every call resolves to the tool's typed canonical JSON value. Tool arguments must be lossless JSON.
- A FAILED tool call rejects with \`ToolCallError\`, whose \`toolName\` identifies the failed tool and whose \`message\` is human-readable \u2014 \`try/catch\` it to handle and continue.
- Independent read-only calls MAY overlap under \`Promise.all\` (safe calls run concurrently; mutating calls run alone, in submission order). Sequence dependent work with \`await\`.
- Emit results with \`return\` and/or \`console.log(...)\`. Only what you print or return is program output. A successful tool result containing an image is attached after the run so you can inspect it on the next step; every other intermediate result stays out of the conversation, so extract just what you need.

The available tools:`;
function renderToolsSdk(schemas) {
  const sorted = [...schemas].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const argsMembers = [];
  const outputMembers = [];
  for (const schema of sorted) {
    argsMembers.push(...docLines(schema.description, 1));
    argsMembers.push(`${pad(1)}${renderKey(schema.name)}: ${jsonSchemaToTs(schema.parameters, 1)};`);
    outputMembers.push(`${pad(1)}${renderKey(schema.name)}: ${jsonSchemaToTs(schema.output, 1)};`);
  }
  const argsMap = `interface ToolArgsMap {${argsMembers.length > 0 ? `
${argsMembers.join("\n")}
` : ""}}`;
  const outputMap = `interface ToolOutputMap {${outputMembers.length > 0 ? `
${outputMembers.join("\n")}
` : ""}}`;
  const declaration = [
    argsMap,
    outputMap,
    "type ToolName = keyof ToolOutputMap",
    ["declare class ToolCallError extends Error {", '  readonly name: "ToolCallError";', "  readonly toolName: ToolName;", "}"].join("\n"),
    ["declare const tools: {", "  [K in ToolName]: (args: ToolArgsMap[K]) => Promise<ToolOutputMap[K]>;", "}"].join("\n")
  ].join("\n\n");
  const jsonValue = "type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }";
  return `${SDK_INSTRUCTIONS}

\`\`\`ts
${jsonValue}

${declaration}
\`\`\``;
}

// ../../source/deepseek-harness/packages/core/tools/src/py-types.ts
var IDENTIFIER2 = /^[\p{XID_Start}_]\p{XID_Continue}*$/u;
function isBareIdentifier(name15) {
  return IDENTIFIER2.test(name15) && name15.normalize("NFKC") === name15;
}
var RESERVED = /* @__PURE__ */ new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
  // Not a keyword, but CPython refuses to ASSIGN it at compile time
  // (`SyntaxError: cannot assign to __debug__`), which is what a TypedDict
  // field, a parameter name, and a keyword argument all are.
  "__debug__"
]);
var TYPING_ORDER = ["Any", "Literal", "NotRequired", "Protocol", "TypedDict"];
function pad2(indent) {
  return "    ".repeat(indent);
}
var UNPRINTABLE = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/g;
var LONE_SURROGATE = /[\ud800-\udfff]/gu;
function describe(schema) {
  const description = schema.description;
  if (typeof description !== "string") return void 0;
  const collapsed = description.replace(/\s+/g, " ").replace(UNPRINTABLE, (char) => `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`).replace(LONE_SURROGATE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`).trim();
  return collapsed.length === 0 ? void 0 : collapsed;
}
function docLines2(description, indent) {
  const collapsed = describe({ description });
  if (collapsed === void 0) return [];
  const escaped = collapsed.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return [`${pad2(indent)}"""${escaped}"""`];
}
function camelCase(raw) {
  const joined = raw.split(/[^\p{XID_Continue}]+|_+/u).filter((part) => part.length > 0).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join("").normalize("NFKC");
  return (/^\p{XID_Start}/u.test(joined) ? joined : `Tool${joined}`).normalize("NFKC");
}
var MAX_CLASS_NAME_BASE = 120;
var MAX_LIST_NESTING = 180;
function capClassNameBase(base) {
  if (base.length <= MAX_CLASS_NAME_BASE) return base;
  const capped = base.slice(0, MAX_CLASS_NAME_BASE);
  return /[\uD800-\uDBFF]$/.test(capped) ? capped.slice(0, -1) : capped;
}
function allocateClassName(base, state) {
  const capped = capClassNameBase(base);
  let name15 = capped;
  if (state.usedClassNames.has(name15)) {
    let n = state.nextClassCounter.get(capped) ?? 2;
    while (state.usedClassNames.has(`${capped}${n}`)) n++;
    name15 = `${capped}${n}`;
    state.nextClassCounter.set(capped, n + 1);
  }
  state.usedClassNames.add(name15);
  return name15;
}
function childClassName(base, segment) {
  return capClassNameBase(`${base}${segment}`.normalize("NFKC"));
}
function pyScalar(value) {
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isInteger(value) && !Number.isSafeInteger(value)) {
    return BigInt(value).toString();
  }
  return String(value);
}
function renderConstrainedScalar2(node, broad, state) {
  if (node.const !== void 0) {
    state.typing.add("Literal");
    return `Literal[${pyScalar(node.const)}]`;
  }
  if (node.enum !== void 0) {
    state.typing.add("Literal");
    return `Literal[${node.enum.map(pyScalar).join(", ")}]`;
  }
  return broad;
}
function renderType(schema, className, state) {
  const newFrame = (schema2, className2, listDepth) => ({ schema: schema2, className: className2, phase: "start", listDepth, children: [], childIndex: 0, childTypes: [], entries: [] });
  try {
    assertSupportedJsonSchema(schema);
    const frames = [newFrame(schema, className, 0)];
    let result;
    const finish = (type) => {
      frames.pop();
      const parent = frames.at(-1);
      if (parent === void 0) result = type;
      else parent.childTypes.push(type);
    };
    while (frames.length > 0) {
      const frame = frames.at(-1);
      if (frame === void 0) break;
      if (frame.phase === "children") {
        if (frame.childIndex < frame.children.length) {
          const child = frame.children[frame.childIndex];
          if (child === void 0) throw new Error("missing python render child");
          frame.childIndex++;
          frames.push(newFrame(child.schema, child.className, child.listDepth));
          continue;
        }
        if (frame.kind === "oneOf") {
          let union = "";
          for (const [index, childType] of frame.childTypes.entries()) {
            union = index === 0 ? childType : `${union} | ${childType}`;
          }
          finish(union);
          continue;
        }
        if (frame.kind === "array") {
          finish(`list[${frame.childTypes[0] ?? "Any"}]`);
          continue;
        }
        const node2 = frame.node;
        const name15 = frame.allocated;
        if (node2 === void 0 || name15 === void 0) throw new Error("missing typeddict frame state");
        const required = new Set(node2.required);
        const lines = [`class ${name15}(TypedDict):`];
        for (let index = 0; index < frame.entries.length; index++) {
          const entry = frame.entries[index];
          const fieldType = frame.childTypes[index];
          if (entry === void 0 || fieldType === void 0) throw new Error("missing typeddict field type");
          const [field, fieldSchema] = entry;
          const description = describe(fieldSchema);
          if (description !== void 0) lines.push(`${pad2(1)}# ${description}`);
          if (required.has(field)) {
            lines.push(`${pad2(1)}${field}: ${fieldType}`);
          } else {
            state.typing.add("NotRequired");
            lines.push(`${pad2(1)}${field}: NotRequired[${fieldType}]`);
          }
        }
        if (node2.additionalProperties !== false) {
          lines.push(`${pad2(1)}# Additional keys beyond those declared are allowed.`);
        }
        if (lines.length === 1) lines.push(`${pad2(1)}pass`);
        state.classes.push(lines.join("\n"));
        finish(name15);
        continue;
      }
      frame.phase = "children";
      const node = frame.schema;
      if (node.oneOf !== void 0) {
        frame.kind = "oneOf";
        frame.children = node.oneOf.map((branch, index) => ({ schema: branch, className: childClassName(frame.className, `${index + 1}`), listDepth: frame.listDepth }));
        continue;
      }
      if (node.type === void 0) {
        state.typing.add("Any");
        finish("Any");
        continue;
      }
      switch (node.type) {
        case "string":
          finish(renderConstrainedScalar2(node, "str", state));
          break;
        case "number":
          finish(renderConstrainedScalar2(node, "float", state));
          break;
        case "integer":
          finish(renderConstrainedScalar2(node, "int", state));
          break;
        case "boolean":
          finish(renderConstrainedScalar2(node, "bool", state));
          break;
        case "null":
          finish("None");
          break;
        case "array": {
          if (node.items === void 0) {
            state.typing.add("Any");
            finish("list[Any]");
            break;
          }
          if (frame.listDepth >= MAX_LIST_NESTING) {
            state.typing.add("Any");
            finish("Any");
            break;
          }
          frame.kind = "array";
          frame.children = [{ schema: node.items, className: frame.className, listDepth: frame.listDepth + 1 }];
          break;
        }
        case "object": {
          const entries = Object.entries(node.properties ?? {});
          if (className === "" || !entries.every(([name15]) => isBareIdentifier(name15) && !RESERVED.has(name15) && !(name15.startsWith("__") && !name15.endsWith("__")))) {
            state.typing.add("Any");
            finish("dict[str, Any]");
            break;
          }
          if (entries.length === 0 && node.additionalProperties !== false) {
            state.typing.add("Any");
            finish("dict[str, Any]");
            break;
          }
          frame.kind = "typeddict";
          frame.node = node;
          frame.allocated = allocateClassName(frame.className, state);
          state.typing.add("TypedDict");
          frame.entries = entries;
          frame.children = entries.map(([field, child]) => ({ schema: child, className: childClassName(frame.allocated ?? "", camelCase(field)), listDepth: 1 }));
          break;
        }
        /* v8 ignore next 4 -- assertSupportedJsonSchema narrowed this closed type union. */
        default: {
          state.typing.add("Any");
          finish("Any");
        }
      }
    }
    return result ?? "Any";
  } catch {
    state.typing.add("Any");
    return "Any";
  }
}
var SDK_INSTRUCTIONS2 = `## Writing code for run_code

\`run_code\` takes two required arguments: \`code\` \u2014 the body of an async Python function (top-level \`await\` and \`return\` both work) \u2014 and \`description\`, a short summary of what the program does. At run time exactly two of the names declared below are bound: \`tools\` and \`ToolCallError\`. Everything else is a STATIC STUB describing argument and return types \u2014 in particular the \`TypedDict\` classes do NOT exist at run time, so build arguments as plain \`dict\`/\`list\` JSON values: \`await tools.name({"field": 1})\`, never \`FooArgs(field=1)\`, which raises \`NameError\`. Inside the program:

- Call tools as \`await tools.name(args)\` \u2014 subscript access for exotic, reserved, or underscore-leading names: \`await tools["my-tool"](args)\`. Every call resolves to the tool's typed canonical JSON value (each method's return type below). Tool arguments must be lossless JSON.
- A FAILED tool call raises \`ToolCallError\`, whose \`toolName\` identifies the failed tool and whose message is human-readable \u2014 wrap in \`try/except\` to handle and continue.
- Independent read-only calls MAY overlap under \`asyncio.gather\` (safe calls run concurrently; mutating calls run alone, in submission order). Sequence dependent work with \`await\`.
- Emit the run's answer with \`print(...)\` and/or a top-level \`return <value>\`; the returned value must be lossless JSON. Only what you print and return is program output. A successful tool result containing an image is attached after the run so you can inspect it on the next step; every other intermediate result stays out of the conversation, so extract just what you need.

The available tools:`;
function renderToolsSdkPy(schemas) {
  const sorted = [...schemas].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const state = { classes: [], usedClassNames: /* @__PURE__ */ new Set(), nextClassCounter: /* @__PURE__ */ new Map(), typing: /* @__PURE__ */ new Set(["Protocol"]) };
  const members = [];
  let statements = 0;
  for (const schema of sorted) {
    const argType = renderType(schema.parameters, `${camelCase(schema.name)}Args`, state);
    const outputType = renderType(schema.output, `${camelCase(schema.name)}Output`, state);
    if (isBareIdentifier(schema.name) && !RESERVED.has(schema.name) && !schema.name.startsWith("_")) {
      const doc = docLines2(schema.description, 2);
      members.push(doc.length > 0 ? `${pad2(1)}async def ${schema.name}(self, args: ${argType}) -> ${outputType}:` : `${pad2(1)}async def ${schema.name}(self, args: ${argType}) -> ${outputType}: ...`);
      members.push(...doc);
      statements += 1;
    } else {
      members.push(`${pad2(1)}# tools[${JSON.stringify(schema.name)}](args: ${argType}) -> ${outputType}`);
      const description = describe(schema);
      if (description !== void 0) members.push(`${pad2(1)}#   ${description}`);
    }
  }
  const bodyLines = statements > 0 ? members : [`${pad2(1)}pass`, ...members];
  const body = bodyLines.join("\n");
  const imports = TYPING_ORDER.filter((symbol) => state.typing.has(symbol));
  const classBlock = state.classes.length > 0 ? `${state.classes.join("\n\n")}

` : "";
  const errorDeclaration = "class ToolCallError(Exception):\n    toolName: str";
  const declaration = `from typing import ${imports.join(", ")}

${errorDeclaration}

${classBlock}class Tools(Protocol):
${body}

tools: Tools`;
  return `${SDK_INSTRUCTIONS2}

\`\`\`python
${declaration}
\`\`\``;
}

// ../../source/deepseek-harness/packages/core/tools/src/index.ts
var COLLAPSE_SECTION_ORDER = 99;
var CODE_ONLY_INSTRUCTION = `\`${RUN_CODE_NAME}\` is the only tool you can call directly \u2014 a tool call naming any other tool fails. Reach every tool the SDK declares below from inside the program.`;
var SDK_RENDERERS = {
  typescript: renderToolsSdk,
  python: renderToolsSdkPy
};
var TOOL_RUNTIME_SCHEDULER = /* @__PURE__ */ Symbol("@deepseek-ai/dsh-tools.scheduler");
var TOOL_ABORTED = "ABORTED";
var TOOL_ABORTED_BEFORE_DISPATCH = "ABORTED_BEFORE_DISPATCH";
var ToolNotFoundError = class extends HarnessError {
  /**
   * @param toolName - the name the caller asked for.
   * @param reachableFrom - how the model reaches this tool instead, when the
   *   name IS visible and only the presentation denies calling it directly.
   *   Omitted for a name that is registered nowhere.
   */
  constructor(toolName, reachableFrom) {
    super(
      reachableFrom === void 0 ? `unknown tool "${toolName}"` : `unknown tool "${toolName}": ${reachableFrom}`,
      "UNKNOWN_TOOL"
    );
    this.name = "ToolNotFoundError";
  }
};
var ToolOutputError = class extends HarnessError {
  /** Schema/value violations in validation order. */
  violations;
  constructor(toolName, violations) {
    super(`tool "${toolName}" returned invalid output: ${violations.join("; ")}`, "INVALID_TOOL_OUTPUT");
    this.name = "ToolOutputError";
    this.violations = violations;
  }
};
function projectionError(toolName, projector, error) {
  return new ToolOutputError(toolName, [`output.${projector} failed: ${errorMessage2(error)}`]);
}
function snapshotProjection(toolName, projector, candidate) {
  try {
    const detached = snapshotJsonValue(candidate);
    if (detached === void 0) {
      throw new ToolOutputError(toolName, [`output.${projector} returned non-lossless JSON`]);
    }
    return detached;
  } catch (error) {
    if (error instanceof ToolOutputError) throw error;
    throw projectionError(toolName, projector, error);
  }
}
function snapshotToolValue(toolName, candidate) {
  try {
    const detached = snapshotJsonValue(candidate);
    if (detached === void 0) throw new ToolOutputError(toolName, ["value is not lossless JSON"]);
    return detached;
  } catch (error) {
    if (error instanceof ToolOutputError) throw error;
    throw new ToolOutputError(toolName, [`value snapshot failed: ${errorMessage2(error)}`]);
  }
}
function errorMessage2(error) {
  try {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
      return error.message;
    }
    return String(error);
  } catch {
    return "<unprintable thrown value>";
  }
}
function failureMessageFromContent(content) {
  const text = content.map((block) => block.type === "text" ? block.text : `[${block.type} content]`).join("\n");
  return text.length > 0 ? text : "tool result blocked by post-execute policy";
}
function materializePresentation(candidate) {
  const detached = snapshotJsonValue(candidate);
  if (detached === void 0) {
    throw new TypeError("tool result must be losslessly JSON-serializable");
  }
  return deepFreeze(detached);
}
function errorInfo(error) {
  try {
    return error instanceof HarnessError ? { name: error.name, code: error.code } : void 0;
  } catch {
    return void 0;
  }
}
var ToolLayer = class {
  tools;
  restrictions = new AnonymousEntries();
  guards = new AnonymousEntries();
  /**
   * Presentation this scope's agent declared for itself, shadowing the
   * deployment default. One cell rather than an entry table: two answers to
   * "which form does the model see" is a contradiction, not a merge.
   */
  mode;
  constructor(scope2) {
    this.tools = new NamedEntries((name15) => new Error(scope2 === void 0 ? `tool "${name15}" is already registered (for a per-agent variant, register through that agent's \`agent.ctx\` instead)` : `tool "${name15}" is already registered in this scope`));
  }
  /** Whether every contribution table in this aggregate layer is empty. */
  isEmpty() {
    return this.tools.isEmpty() && this.restrictions.isEmpty() && this.guards.isEmpty() && this.mode === void 0;
  }
  /** Whether every compiled restriction in this layer admits a global tool name. */
  admits(name15) {
    for (const filter of this.restrictions.values()) {
      if (filter.allow !== void 0 && !filter.allow.has(name15) || filter.deny !== void 0 && filter.deny.has(name15)) return false;
    }
    return true;
  }
  /** First monotonic denial from this layer's live guard registrations. */
  guardReason(exec) {
    for (const guard of this.guards.values()) {
      const reason = guard(exec);
      if (reason !== void 0) return reason;
    }
    return void 0;
  }
};
function resolveMaxParallelSubCalls(value) {
  const maxParallelSubCalls = value ?? 10;
  if (!Number.isInteger(maxParallelSubCalls) || maxParallelSubCalls < 1) {
    throw new Error("maxParallelSubCalls must be a positive integer");
  }
  return maxParallelSubCalls;
}
var ToolRuntime = class extends Service {
  static inject = ["systemPrompt"];
  static Config = src_default2.object({
    mode: src_default2.union(["native", "code", "both"]).default("native"),
    maxParallelSubCalls: src_default2.natural().min(1).default(10)
  });
  /** Internal staged view consumed by `dsh-agent-loop`'s parallel scheduler. */
  [TOOL_RUNTIME_SCHEDULER] = {
    prepare: (exec) => this.prepareScheduledExecution(exec),
    dispatch: (exec) => this.dispatchScheduledExecution(exec),
    finalize: (exec, result) => this.finalizeScheduledExecution(exec, result),
    finish: (exec, result) => this.finishScheduledExecution(exec, result)
  };
  /** Context deferred by a running tool body, keyed by its scheduler-owned execution. */
  deferredContexts = /* @__PURE__ */ new WeakMap();
  /** Executions whose tool body declared the current turn complete. */
  concludingExecutions = /* @__PURE__ */ new WeakSet();
  /** Original caller cancellation, kept outside the wrapper-mutable execution object. */
  cancellationStates = /* @__PURE__ */ new WeakMap();
  /** Definition-owned final content transform snapshotted before policy begins. */
  contentFinalizers = /* @__PURE__ */ new WeakMap();
  layers = new ScopedLayers(
    (scope2) => new ToolLayer(scope2),
    () => {
      this.ctx.emit("tools/change");
    }
  );
  /** Presentation for scopes that declare none; {@link presentAs} shadows it per scope. */
  defaultMode;
  maxParallelSubCalls;
  /**
   * Reserved presentation transport, kept outside the filterable registration
   * layers. Built on first need rather than at construction: which agents run
   * a code mode is no longer known when the service is constructed, and the
   * transport is stateless beyond its closures over `this`.
   */
  codeTransport;
  constructor(ctx, config = {}) {
    super(ctx, "tools");
    this.defaultMode = config.mode ?? "native";
    this.maxParallelSubCalls = resolveMaxParallelSubCalls(config.maxParallelSubCalls);
    ctx.systemPrompt.tools((context) => this.wireSchemas(context.scope));
    if (this.defaultMode !== "native") {
      ctx.systemPrompt.section(this.collapseSection());
      ctx.systemPrompt.section(this.sdkSection());
    }
  }
  /**
   * The prompt statement of the `code` executor collapse, registered wherever
   * {@link sdkSection} is and rendering empty outside an effective `code`.
   *
   * Every tool contributes its own guidance section naming its tool, none of
   * them qualify how that tool is reached, and they all render before the SDK
   * (orders 100-199 against {@link SDK_SECTION_ORDER}). Without this the model
   * reads a catalog of tools it is told to use and no statement that only
   * `run_code` may be called, so it emits a native call, receives
   * `UNKNOWN_TOOL` for a tool the prompt just declared, and concludes the
   * deployment is inconsistent. {@link COLLAPSE_SECTION_ORDER} places the rule
   * before that guidance rather than after it.
   *
   * `both` renders empty: native calls do execute there, so the rule is false.
   * @returns the section registration.
   */
  collapseSection() {
    return {
      name: "tools:code-only",
      order: COLLAPSE_SECTION_ORDER,
      // The SAME predicate the executor denies by, so the prompt cannot state
      // a rule the registry does not enforce (see `collapses`).
      text: (context) => this.modeFor(context.scope) === "code" ? CODE_ONLY_INSTRUCTION : ""
    };
  }
  /**
   * The generated-SDK prompt section, registered globally by a code-mode
   * deployment and per scope by {@link presentAs}.
   *
   * The body regenerates from the CALLING scope, and renders empty for an
   * agent presenting natively — an agent that opted out under a code-mode
   * deployment still sees the global registration, and an empty section is
   * dropped from the rendered prompt.
   * @returns the section registration.
   */
  sdkSection() {
    return {
      name: "tools:sdk",
      order: SDK_SECTION_ORDER,
      // Regenerate from the calling scope's visible tools in stable order.
      text: (context) => {
        const mode = this.modeFor(context.scope);
        if (mode === "native") return "";
        const runtime = this.requireCodeRuntime(mode);
        const render = SDK_RENDERERS[runtime.language];
        if (render === void 0) throw new Error(`dsh-tools: no SDK renderer for ${runtime.language}`);
        return render(this.sdkSchemas(context.scope));
      }
    };
  }
  /**
   * The presentation one scope's agent sees: its own declaration, else the
   * deployment default.
   * @param scope - the calling agent, or undefined for the global view.
   * @returns the resolved presentation mode.
   */
  modeFor(scope2) {
    const layers = this.layers.chainLayers(scope2);
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      const mode = layers[index]?.mode;
      if (mode !== void 0) return mode;
    }
    return this.defaultMode;
  }
  /**
   * The reserved `run_code` transport, built on first need.
   *
   * It never enters the global layer: per-agent restrictions must not remove
   * it, and a scoped registration must not shadow it. The visibility resolver
   * appends it after resolving the filterable global/scoped capability layers,
   * and only for scopes whose mode actually presents it.
   * @returns the shared transport definition.
   */
  requireCodeTransport() {
    this.codeTransport ??= createRunCodeTool(this, {
      requireRuntime: () => this.requireCodeRuntime(this.defaultMode),
      // The language-aware description/parameters getters read the runtime
      // without demanding one, so a native-default process can still project
      // the transport for an agent that chose code.
      peekRuntime: () => this.ctx.get("codeRuntime"),
      maxParallel: this.maxParallelSubCalls,
      shapeDispatchLog: (dispatch) => this.shapeDispatchLog(dispatch)
    });
    return this.codeTransport;
  }
  /**
   * Present the calling scope's tools in `mode` instead of the deployment
   * default. Nearest scope on the chain wins, so a preset's standing
   * declaration covers every agent joined under it.
   *
   * Scoped only, and one declaration per scope: this is how an agent preset
   * composes Code Mode agents beside native ones in the same process, and a
   * process-global override would be the `mode` config field instead.
   * @param mode - the presentation the covered agents' models see.
   * @returns the exact disposer that restores the deployment default.
   */
  presentAs(mode) {
    const ctx = this.ctx;
    if (scopeOf(ctx) === void 0) {
      throw new Error("tools.presentAs() requires a scoped context (agent.ctx): a context-global presentation is the `mode` config field on the tools row");
    }
    const dispose = ctx.effect(function* () {
      yield this.layers.effect(
        ctx,
        (layer) => {
          if (layer.mode !== void 0) {
            throw new Error(`tools.presentAs("${mode}") conflicts with "${layer.mode}" already declared for this scope; one composition selects one presentation`);
          }
          layer.mode = mode;
          return () => {
            layer.mode = void 0;
          };
        },
        { label: "tools.presentAs()" }
      );
      if (mode !== "native") {
        yield ctx.systemPrompt.section(this.collapseSection());
        yield ctx.systemPrompt.section(this.sdkSection());
      }
    }.bind(this), "tools.presentAs()");
    return dispose;
  }
  /**
   * Build one scope's wire schemas and names for prompt-order validation.
   * Restrictions do not make known tools invalid, but a mode collapse does.
   */
  wireSchemas(scope2) {
    const view = this.view(scope2);
    const mode = this.modeFor(scope2);
    if (mode === "native") {
      const schemas2 = [...view.visible.values()].map((definition) => this.schemaOf(definition, false));
      return { schemas: schemas2, knownNames: [...view.knownNames] };
    }
    this.requireCodeRuntime(mode);
    const schemas = [...view.visible.values()].map((definition) => this.schemaOf(definition, false));
    if (mode === "code") {
      return {
        schemas: schemas.filter((schema) => schema.name === RUN_CODE_NAME),
        knownNames: [RUN_CODE_NAME]
      };
    }
    return { schemas, knownNames: [...view.knownNames, RUN_CODE_NAME] };
  }
  /**
   * Resolve the code runtime or throw the actionable misconfiguration error.
   * Read at use time (assembly / run_code execution), NOT via static
   * `inject`: an inject entry would hold `ctx.tools` — and every tool plugin
   * behind it — hostage to a code runtime existing even under `mode:
   * 'native'` (the loop's optional-backend idiom, same as
   * `sessionPersistence`).
   *
   * Assembly and `run_code` execution read separately, so the language is not
   * bound to a request. Harmless while one published backend exists — both
   * reads return the same flavor — but a reload that swapped in a second
   * language between them would hand a program written against one SDK to the
   * other. Binding it is deferred until a second backend ships (the first
   * point it is testable); rationale in the
   * [language-dispatch note](../../../../.agents/notes/implemented/feature/2026-07-31-code-mode-language-dispatch.md).
   */
  requireCodeRuntime(mode) {
    const runtime = this.ctx.get("codeRuntime");
    if (!runtime) {
      throw new Error(`dsh-tools: mode "${mode}" requires a code runtime \u2014 load a ctx.codeRuntime implementation (e.g. @deepseek-ai/dsh-code-runtime-worker-thread) or set tools mode to "native"`);
    }
    if (!Object.hasOwn(SDK_RENDERERS, runtime.language)) {
      const known = Object.keys(SDK_RENDERERS).map((name15) => JSON.stringify(name15)).join(", ");
      throw new Error(`dsh-tools: no SDK renderer registered for runtime language ${JSON.stringify(runtime.language)} (known: ${known})`);
    }
    return runtime;
  }
  /**
   * Register globally or in the calling agent scope. Scoped tools shadow
   * globals; duplicates within one layer and the reserved `run_code` name fail.
   * @param definition - tool schema, execution, and optional finalization/presentation callbacks.
   * @returns the exact disposer that unregisters the tool.
   */
  register(definition) {
    const name15 = definition.name;
    const output = definition.output;
    if (output === void 0 || typeof output !== "object" || typeof output.render !== "function" || output.presentationMeta !== void 0 && typeof output.presentationMeta !== "function") {
      throw new TypeError(`tool "${name15}" must declare output { schema, render, presentationMeta? }`);
    }
    assertSupportedJsonSchema(output.schema);
    const timeoutMs = definition.timeoutMs;
    if (timeoutMs !== void 0 && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
      throw new TypeError(`tool "${name15}" timeoutMs must be a positive finite number`);
    }
    if (name15 === RUN_CODE_NAME) {
      throw new Error(`tool name "${RUN_CODE_NAME}" is reserved for the Code Mode presentation transport and cannot be registered or shadowed`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.tools.insert(name15, definition),
      { label: "tools.register()" }
    );
  }
  /**
   * Restrict global tools for the calling agent scope. Empty filters, unknown
   * names, scope-local names, and reserved transport names fail. Restrictions
   * intersect; scoped registrations remain visible.
   * @param filter - global-tool mask: `allow` (keep only) and/or `deny` (remove).
   * @returns the exact disposer that lifts this restriction.
   */
  restrict(filter) {
    const scope2 = scopeOf(this.ctx);
    if (scope2 === void 0) {
      throw new Error("tools.restrict() requires a scoped context (agent.ctx): a context-global restriction would mask every agent \u2014 deny the tool for the intended agent instead");
    }
    const allow = filter.allow;
    const deny = filter.deny;
    if (allow === void 0 && deny === void 0) {
      throw new Error("tools.restrict({}) is a no-op: pass `allow` and/or `deny` (an empty filter is almost always a materialized-empty-config bug)");
    }
    const compiled = {
      ...allow !== void 0 ? { allow: new Set(allow) } : {},
      ...deny !== void 0 ? { deny: new Set(deny) } : {}
    };
    if ([...allow ?? [], ...deny ?? []].includes(RUN_CODE_NAME)) {
      throw new Error(`tools.restrict() cannot name reserved Code Mode presentation transport "${RUN_CODE_NAME}"; restrict end-capability tools instead`);
    }
    const known = this.view(scope2).restrictableNames;
    const unknown = [...allow ?? [], ...deny ?? []].filter((name15) => !known.has(name15));
    if (unknown.length > 0) {
      throw new Error(`tools.restrict() names unknown global tool${unknown.length > 1 ? "s" : ""} ${unknown.map((n) => `"${n}"`).join(", ")}; known global tools: ${[...known].sort().join(", ") || "(none)"}`);
    }
    return this.layers.effect(
      this.ctx,
      (layer) => layer.restrictions.append(compiled),
      { label: "tools.restrict()" }
    );
  }
  /**
   * Register a monotonic guard after the extensible `tools/pre-execute`
   * waterfall. A plain-context guard applies globally; one registered through
   * `agent.ctx` applies only to that agent. Any matching guard may deny by
   * returning a reason, while no guard can force-allow a call another guard
   * denied. The exact effect disposer is returned for ordered ownership and
   * HMR cleanup.
   * @param guard - synchronous check; a returned string denies the execution.
   * @returns the exact disposer that unregisters the guard.
   */
  guard(guard) {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.guards.append(guard),
      { label: "tools.guard()", notify: false }
    );
  }
  /** First monotonic denial from the global then the scope chain's guard layers, farthest first. */
  guardReason(exec) {
    const globalReason = this.layers.global.guardReason(exec);
    if (globalReason !== void 0) return globalReason;
    if (exec.agent === void 0) return void 0;
    for (const layer of this.layers.chainLayers(exec.agent)) {
      const reason = layer.guardReason(exec);
      if (reason !== void 0) return reason;
    }
    return void 0;
  }
  /**
   * Resolve every registry fact one scope needs in one layer traversal. The
   * visible map applies restrictions to the INHERITED surface, then the
   * scope's own registrations and the reserved presentation transport; the
   * other sets retain the pre-restriction facts needed by restriction and
   * prompt-order validation.
   *
   * A restriction filters what a scope inherits — the global layer and every
   * ancestor layer on its chain — and never what its OWN layer registers.
   * That exemption is what a per-child capability filter has to keep intact:
   * the delegation runtime registers a child's reporting and structured-output
   * tools into the child's own layer, and a filter naming the capabilities the
   * child may use must not strip the machinery it answers through.
   *
   * Reading the exempt set as "the global layer" instead of "not mine" held
   * only while every model-facing tool sat in the host composition. Once
   * presets moved them onto the agent plane they became an ANCESTOR
   * contribution, so a child's filter silently stopped constraining anything
   * it was given.
   * @param scope - the viewing scope (the agent), or undefined for the global view.
   * @returns the complete derived view for that scope.
   */
  view(scope2) {
    const layers = this.layers.chainLayers(scope2);
    const own = this.layers.peek(scope2);
    const inherited = new Map(this.layers.global.tools.entries());
    for (const layer of layers) {
      if (layer === own) continue;
      for (const [name15, definition] of layer.tools.entries()) inherited.set(name15, definition);
    }
    const visible = /* @__PURE__ */ new Map();
    const knownNames = /* @__PURE__ */ new Set();
    const restrictableNames = /* @__PURE__ */ new Set();
    for (const [name15, definition] of inherited) {
      knownNames.add(name15);
      restrictableNames.add(name15);
      if (layers.every((layer) => layer.admits(name15))) visible.set(name15, definition);
    }
    if (own !== void 0) {
      for (const [name15, definition] of own.tools.entries()) {
        knownNames.add(name15);
        visible.set(name15, definition);
      }
    }
    if (this.modeFor(scope2) !== "native") {
      visible.set(RUN_CODE_NAME, this.requireCodeTransport());
    }
    return { visible, knownNames, restrictableNames };
  }
  /**
   * Look up a tool as one scope sees it (scoped
   * shadows global; a restricted-away global reads as absent). Presenters pass
   * the calling agent so the rendered card matches the definition that
   * actually executed.
   * @param name - the tool name as registered.
   * @param scope - the viewing scope (the agent); omitted = the global view.
   * @returns the definition the scope resolves, or undefined when none is visible.
   */
  get(name15, scope2) {
    return this.view(scope2).visible.get(name15);
  }
  /**
   * Resolve the definition that MAY EXECUTE for a call, applying the mode
   * collapse at the operation boundary that owns it. The registry view
   * (`get`) is presentation-agnostic; here a MODEL-DIRECT call under `code`
   * may only name the reserved `run_code` transport, while a nested
   * sub-dispatch (a `parent` token set — the `run_code` SDK calling a tool
   * it bound) may call any visible tool. Denial surfaces as `UNKNOWN_TOOL`
   * through the executor, matching an absent definition.
   * @param name - the tool name as registered.
   * @param scope - the viewing scope (the agent); omitted = the global view.
   * @param nested - whether the call is a transport sub-dispatch, not a model-direct call.
   * @returns the definition that may run, or undefined when the call must be rejected.
   */
  resolveExecution(name15, scope2, nested) {
    const tool = this.get(name15, scope2);
    if (tool === void 0) return void 0;
    if (this.collapses(name15, scope2, nested)) return void 0;
    return tool;
  }
  /**
   * Project visible definitions onto the allowlisted model-facing schema fields,
   * excluding execution and presentation callbacks.
   * @param scope - the viewing scope (the agent); omitted = the global view.
   * @returns one deep-cloned schema per visible tool.
   */
  schemas(scope2) {
    return [...this.view(scope2).visible.values()].map((definition) => this.schemaOf(definition, true));
  }
  /** Project visible callable tools onto the generated Code Mode SDK contract. */
  sdkSchemas(scope2) {
    return [...this.view(scope2).visible.values()].filter((definition) => definition.name !== RUN_CODE_NAME).map((definition) => {
      const output = snapshotJsonValue(definition.output.schema);
      if (output === void 0) {
        throw new Error(`tool "${definition.name}" output schema must be lossless JSON before SDK projection`);
      }
      return {
        ...this.schemaOf(definition, true),
        output
      };
    });
  }
  /** Project one definition onto the model-facing schema fields. */
  schemaOf(definition, detachParameters) {
    const { name: name15, description, parameters } = definition;
    const detached = detachParameters ? snapshotJsonValue(parameters) : parameters;
    if (detached === void 0) {
      throw new Error(`tool "${name15}" parameters must be lossless JSON before schema projection`);
    }
    return {
      name: name15,
      description,
      parameters: detached
    };
  }
  /**
   * Classify a pending call through the caller's visible tool definition. Only
   * an exact `true` is parallel; unknown, hidden, undeclared, invalid, or
   * throwing classifiers are exclusive.
   * @param exec - call name, parsed arguments, and optional agent scope.
   * @returns the fail-closed scheduling mode.
   */
  executionMode(exec) {
    const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
    if (!tool?.isConcurrencySafe) return { kind: "exclusive" };
    try {
      const concurrencySafe = tool.isConcurrencySafe(exec.arguments);
      return concurrencySafe === true ? { kind: "parallel" } : { kind: "exclusive" };
    } catch {
      return { kind: "exclusive" };
    }
  }
  /**
   * Run the `tools/code-dispatch-log` waterfall over one settled sub-dispatch
   * and return the content the bridge should log on `tool/code-dispatch`.
   * Contained: when a listener throws, the method logs the original settled
   * content; that failure must not fail the dispatch or omit the settle event. Private:
   * the ONE consumer is the `run_code` bridge this registry constructs, which
   * receives it as a capability parameter (the `requireRuntime` idiom) — the
   * waterfall, not this invoker, is the public extension point.
   */
  async shapeDispatchLog(dispatch) {
    try {
      return await this.ctx.waterfall(
        scopeTarget(this, dispatch.agent),
        "tools/code-dispatch-log",
        dispatch,
        () => Promise.resolve(dispatch.content)
      );
    } catch (error) {
      this.ctx.logger.warn(`tools: code-dispatch-log listener failed for ${dispatch.name}: ${errorMessage2(error)}; logging the original settled content`);
      return dispatch.content;
    }
  }
  /**
   * Whether the `code` mode collapse denies a model-direct call: only the
   * reserved `run_code` transport may be named. Nested sub-dispatches (a
   * `parent` token set) bypass the collapse. One home for the
   * security-relevant predicate, shared by {@link resolveExecution} and
   * {@link createExecution} so the two can never drift apart.
   *
   * Resolved through {@link modeFor}, NOT `defaultMode`: an agent given `code`
   * by an agent preset under a native deployment is the composition
   * `dsh-agent-tool-presentation` exists for, and reading the deployment default would
   * leave exactly that agent uncollapsed — announcing one surface while
   * executing another, which is the bypass this collapse closes.
   * @param name - the tool name as registered.
   * @param scope - the viewing scope whose effective presentation mode applies.
   * @param nested - whether the call is a transport sub-dispatch, not a model-direct call.
   */
  collapses(name15, scope2, nested) {
    return !nested && this.modeFor(scope2) === "code" && name15 !== RUN_CODE_NAME;
  }
  /**
   * Execute through pre-policy, guards, around-dispatch, post-policy,
   * definition-owned content finalization, and final notification. Tool and
   * listener failures resolve as materialized error results; an invisible tool
   * reports `UNKNOWN_TOOL`. The returned outcome is the same lossless, frozen
   * snapshot final observers receive. Cancellation
   * arriving after entry and before final result materialization skips a
   * not-yet-started body with `ABORTED_BEFORE_DISPATCH` or replaces a
   * successful started outcome with `ABORTED`; already-started work is still
   * drained and may retain a tool-owned structured error.
   * @param exec - the typed same-process call input. The registry assigns its
   *   correlation token before policy begins.
   * @returns the materialized final result.
   */
  async execute(exec) {
    return this.prepareExecution(exec, (prepared) => this.completeScheduledExecution(prepared));
  }
  async completeScheduledExecution(prepared) {
    switch (prepared.kind) {
      case "dispatch": {
        const dispatched = await this.dispatchScheduledExecution(prepared.exec);
        return dispatched.kind === "post-result" ? await this.finalizeScheduledExecution(prepared.exec, dispatched.result) : this.finishScheduledExecution(prepared.exec, dispatched.result);
      }
      case "post-result":
        return await this.finalizeScheduledExecution(prepared.exec, prepared.result);
      case "final-result":
        return this.finishScheduledExecution(prepared.exec, prepared.result);
      /* v8 ignore next -- closed-union exhaustiveness guard */
      default:
        return assertNever(prepared, "scheduled tool preparation");
    }
  }
  createExecution(exec) {
    const deferredContexts = [];
    const token = createExecutionToken();
    const callId = exec.callId;
    const rootCallId = exec.rootCallId ?? callId;
    const name15 = exec.name;
    const agent = exec.agent;
    const parent = exec.parent;
    const signal = exec.signal;
    const visible = this.get(name15, agent);
    const collapsed = visible !== void 0 && this.collapses(name15, agent, parent !== void 0);
    const concludingExecutions = this.concludingExecutions;
    const base = {
      token,
      callId,
      rootCallId,
      name: name15,
      signal,
      ...agent !== void 0 ? { agent } : {},
      ...parent !== void 0 ? { parent } : {},
      deferContext(context) {
        deferredContexts.push(context);
      },
      concludeTurn() {
        concludingExecutions.add(this);
      }
    };
    const capturedFinalizer = visible?.finalizeContent?.bind(visible);
    const finalizerFor = () => collapsed && !signal.aborted ? void 0 : capturedFinalizer;
    try {
      const detached = snapshotJsonValue(exec.arguments);
      if (detached === void 0) {
        throw new TypeError("tool execution arguments must be losslessly JSON-serializable");
      }
      const execution = { ...base, arguments: deepFreeze(detached) };
      this.deferredContexts.set(execution, deferredContexts);
      this.contentFinalizers.set(execution, finalizerFor());
      this.cancellationStates.set(execution, {
        callerSignal: signal,
        bodyInvoked: false
      });
      if (collapsed) {
        if (signal.aborted) {
          return { kind: "final-result", exec: execution, result: toolAbortedBeforeDispatchResult() };
        }
        return {
          kind: "final-result",
          exec: execution,
          result: toolErrorResult(new ToolNotFoundError(
            name15,
            `only \`${RUN_CODE_NAME}\` is callable directly \u2014 call \`${name15}\` from inside a \`${RUN_CODE_NAME}\` program instead`
          ))
        };
      }
      return { kind: "ready", exec: execution };
    } catch (error) {
      const execution = { ...base, arguments: void 0 };
      this.contentFinalizers.set(execution, finalizerFor());
      return { kind: "final-result", exec: execution, result: toolErrorResult(error) };
    }
  }
  /**
   * Run the ordered pre-execute and monotonic guard stages for the scheduler.
   * @param input - the caller-supplied execution input.
   * @returns the prepared execution plus the next scheduler stage.
   * @internal
   */
  async prepareScheduledExecution(input) {
    return this.prepareExecution(input, (prepared) => prepared);
  }
  async prepareExecution(input, next) {
    const created = this.createExecution(input);
    if (created.kind !== "ready") return next(created);
    const exec = created.exec;
    if (this.callerCancelled(exec)) {
      return next({ kind: "final-result", exec, result: toolAbortedBeforeDispatchResult() });
    }
    try {
      const carrier = scopeTarget(this, exec.agent);
      const gate = await this.ctx.waterfall(
        carrier,
        "tools/pre-execute",
        exec,
        () => Promise.resolve({ kind: "allow" })
      );
      const askResolution = gate.kind === "ask" ? await this.serviceAsk(exec, gate) : { decision: gate, approvalCancelled: false };
      const { decision } = askResolution;
      if (this.callerCancelled(exec) && askResolution.approvalCancelled) {
        return await next({ kind: "post-result", exec, result: toolAbortedBeforeDispatchResult() });
      }
      const denialReason = decision.kind === "allow" ? this.guardReason(exec) : decision.reason;
      if (denialReason !== void 0) {
        return await next({
          kind: "post-result",
          exec,
          result: this.materializeFinalResult({
            content: [{ type: "text", text: `Error: ${denialReason}` }],
            isError: true,
            error: { message: denialReason }
          })
        });
      }
      if (this.callerCancelled(exec)) {
        return await next({ kind: "post-result", exec, result: toolAbortedBeforeDispatchResult() });
      }
      return await next({ kind: "dispatch", exec });
    } catch (error) {
      return next({ kind: "final-result", exec, result: toolErrorResult(error) });
    }
  }
  /** Whether the original caller signal is currently aborted. */
  callerCancelled(exec) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    return state.callerSignal.aborted;
  }
  /** Canonical cancellation outcome selected by whether the tool body started. */
  cancellationResult(exec, prior) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    return state.bodyInvoked ? toolAbortedResult(prior) : toolAbortedBeforeDispatchResult(prior);
  }
  /**
   * Dispatch the registered body with the original caller signal fused back
   * into any around-wrapper replacement. Cancellation never abandons the body:
   * a started promise reaches quiescence before its outcome becomes `ABORTED`.
   */
  async dispatchToolBody(exec) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    const wrapperSignal = exec.signal;
    const fused = fuseToolSignals(state.callerSignal, wrapperSignal);
    const signal = fused.signal;
    if (isAborted(signal)) {
      fused.dispose();
      return toolAbortedBeforeDispatchResult();
    }
    exec.signal = signal;
    try {
      const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
      if (!tool) throw new ToolNotFoundError(exec.name);
      state.bodyInvoked = true;
      const returned = await tool.execute(exec.arguments, exec);
      const result = this.createSuccessResult(exec, tool, returned);
      return isAborted(signal) ? toolAbortedResult(result) : result;
    } catch (error) {
      return toolErrorResult(error);
    } finally {
      fused.dispose();
      exec.signal = wrapperSignal;
    }
  }
  /**
   * Run around-dispatch and the tool body. Tool and unknown-tool failures still
   * receive post-execute; pipeline failures are already final.
   * @param exec - the prepared execution.
   * @returns whether the result still needs post-execute.
   * @internal
   */
  async dispatchScheduledExecution(exec) {
    try {
      const mutableExec = exec;
      const carrier = scopeTarget(this, exec.agent);
      const result = await this.ctx.waterfall(
        carrier,
        "tools/execute",
        mutableExec,
        () => this.dispatchToolBody(mutableExec)
      );
      const normalized = this.normalizeDispatchResult(exec, result);
      const deferredContexts = this.deferredContexts.get(exec);
      if (deferredContexts === void 0) throw new Error("tool registry scheduler invariant violated: unprepared execution");
      const resultWithDeferredContexts = deferredContexts.length === 0 ? normalized : this.markCanonical(exec, {
        ...normalized,
        additionalContexts: [
          ...deferredContexts,
          ...normalized.additionalContexts ?? []
        ]
      });
      return {
        kind: "post-result",
        result: this.callerCancelled(exec) && !resultWithDeferredContexts.isError ? this.cancellationResult(exec, resultWithDeferredContexts) : resultWithDeferredContexts
      };
    } catch (error) {
      return { kind: "final-result", result: toolErrorResult(error) };
    }
  }
  /**
   * Run ordered post-execute, then apply definition-owned content finalization,
   * materialize, and notify the final outcome.
   * @param exec - the prepared execution.
   * @param result - dispatch/pre result that still needs post-execute.
   * @returns the materialized final result.
   * @internal
   */
  async finalizeScheduledExecution(exec, result) {
    try {
      const postResult = await this.postExecute(exec, result);
      return this.finishScheduledExecution(
        exec,
        this.callerCancelled(exec) && !postResult.isError ? this.cancellationResult(exec, postResult) : postResult
      );
    } catch (error) {
      return this.finishScheduledExecution(exec, toolErrorResult(error));
    }
  }
  /**
   * Materialize the candidate, apply definition-owned content finalization,
   * then materialize and notify the authoritative result.
   * @param exec - the prepared execution.
   * @param result - final result.
   * @returns the materialized final result.
   * @internal
   */
  finishScheduledExecution(exec, result) {
    let materializedResult;
    try {
      materializedResult = this.materializeFinalResult(result);
    } catch (error) {
      materializedResult = this.materializeFinalResult(toolErrorResult(error));
    }
    let finalResult;
    try {
      finalResult = this.materializeFinalResult(this.applyFinalContent(exec, materializedResult));
    } catch (error) {
      finalResult = this.materializeFinalResult(toolErrorResult(error));
    }
    this.notifyResult(exec, finalResult);
    return finalResult;
  }
  /** Apply the snapshotted tool-owned content transform without exposing other result fields. */
  applyFinalContent(exec, result) {
    const finalizeContent = this.contentFinalizers.get(exec);
    if (finalizeContent === void 0) return result;
    const content = finalizeContent(exec, result);
    return content === void 0 ? result : { ...result, content };
  }
  /** Notify observers without exposing a mutation or error channel into the outcome. */
  notifyResult(exec, result) {
    Object.freeze(exec);
    const { name: toolName, callId } = exec;
    const reportFailure = (error) => {
      this.ctx.logger.warn(`tool "${toolName}" (${callId}): tools/result observer failed: ${errorMessage2(error)}`);
    };
    const callbacks = this.ctx.events.dispatch("emit", [
      scopeTarget(this, exec.agent),
      "tools/result",
      exec,
      result
    ]);
    for (const callback of callbacks) {
      try {
        const returned = callback(exec, result);
        void Promise.resolve(returned).catch(reportFailure);
      } catch (error) {
        reportFailure(error);
      }
    }
  }
  /**
   * Resolve an `ask` decision to allow/deny through the approval seam. The
   * seam is consumed opportunistically with `ctx.get('approval')` — a
   * deployment that composes no ApprovalService keeps the historical degrade
   * to deny, and an unmount mid-session degrades the same way on the next ask.
   * An agent-less execution also degrades: without an agent there is no
   * session to audit to and no UI to route to. Otherwise the outcome maps
   * one-to-one — `allowed-once` proceeds; the three non-grants deny with
   * distinct reasons so the model can tell a human "no" from an absent
   * approval channel.
   */
  async serviceAsk(exec, ask) {
    const approval = this.ctx.get("approval");
    if (approval === void 0) {
      return {
        decision: { kind: "deny", reason: ask.reason ?? `tool "${exec.name}" requires approval (not yet supported)` },
        approvalCancelled: false
      };
    }
    if (exec.agent === void 0) {
      return {
        decision: { kind: "deny", reason: `tool "${exec.name}" requires approval, but the call has no agent to route it through` },
        approvalCancelled: false
      };
    }
    const outcome = await approval.request({
      agent: exec.agent,
      toolName: exec.name,
      callId: exec.callId,
      ...ask.reason !== void 0 ? { reason: ask.reason } : {},
      signal: exec.signal
    });
    switch (outcome) {
      case "allowed-once":
        return { decision: { kind: "allow" }, approvalCancelled: false };
      case "rejected":
        return {
          decision: { kind: "deny", reason: `the user rejected tool "${exec.name}"` },
          approvalCancelled: false
        };
      case "cancelled":
        return {
          decision: { kind: "deny", reason: `approval for tool "${exec.name}" was cancelled` },
          approvalCancelled: true
        };
      case "unavailable":
        return {
          decision: { kind: "deny", reason: `tool "${exec.name}" requires approval, but no approval channel is available` },
          approvalCancelled: false
        };
      default:
        return assertNever(outcome, "ApprovalOutcome");
    }
  }
  /**
   * Run the `tools/post-execute` waterfall over a dispatched `result` and apply
   * its {@link PostToolDecision}: `accept` keeps the call successful (replacing
   * `content` when given), `block` turns it into an `isError` whose content is
   * the corrective `feedback`. Either decision may attach `additionalContexts`,
   * which are ferried on the returned result for the loop's active-batch FIFO.
   * Context deferred by the tool body survives an accepted result but is
   * discarded when the outer call is blocked; a block exposes only context the
   * blocking decision explicitly supplied.
   * Runs inside `execute`'s outer try/catch (a throwing listener → isError).
   */
  async postExecute(exec, result) {
    const decision = await this.ctx.waterfall(
      scopeTarget(this, exec.agent),
      "tools/post-execute",
      exec,
      result,
      () => Promise.resolve({ kind: "accept" })
    );
    const decisionContexts = decision.additionalContexts ?? [];
    if (decision.kind === "block") {
      const message = failureMessageFromContent(decision.feedback);
      return this.markCanonical(exec, {
        content: decision.feedback,
        isError: true,
        error: { message },
        ...decisionContexts.length > 0 ? { additionalContexts: decisionContexts } : {}
      });
    }
    if (Object.hasOwn(decision, "content") && Object.hasOwn(decision, "value")) {
      throw new TypeError("tools/post-execute accept decision cannot replace both value and content");
    }
    const additionalContexts = [
      ...result.additionalContexts ?? [],
      ...decisionContexts
    ];
    if (Object.hasOwn(decision, "value")) {
      if (result.isError) {
        throw new TypeError("tools/post-execute cannot replace the value of a failed result");
      }
      const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
      if (tool === void 0) throw new ToolNotFoundError(exec.name);
      const replaced = this.createSuccessResult(exec, tool, decision.value);
      return this.markCanonical(exec, {
        ...replaced,
        ...additionalContexts.length > 0 ? { additionalContexts } : {}
      });
    }
    return this.markCanonical(exec, {
      ...result,
      ...decision.content !== void 0 ? { content: decision.content } : {},
      ...additionalContexts.length > 0 ? { additionalContexts } : {}
    });
  }
  /** Registry-normalized results and the exact dispatch that validated each value. */
  canonicalResults = /* @__PURE__ */ new WeakMap();
  /** Mark one registry-normalized result as canonical only for its owning dispatch. */
  markCanonical(exec, result) {
    this.canonicalResults.set(result, exec.token);
    return result;
  }
  /** Snapshot, validate, render, and optionally project one successful body value. */
  createSuccessResult(exec, tool, candidate) {
    const detached = snapshotToolValue(tool.name, candidate);
    const violations = validateJsonSchemaValue(tool.output.schema, detached, "value");
    if (violations.length > 0) throw new ToolOutputError(tool.name, violations);
    const value = deepFreeze(detached);
    let rendered;
    try {
      rendered = tool.output.render(exec.arguments, value);
    } catch (error) {
      throw projectionError(tool.name, "render", error);
    }
    const content = snapshotProjection(tool.name, "render", rendered);
    let meta;
    if (exec.parent === void 0 && tool.output.presentationMeta !== void 0) {
      let projected;
      try {
        projected = tool.output.presentationMeta(exec.arguments, value);
      } catch (error) {
        throw projectionError(tool.name, "presentationMeta", error);
      }
      meta = snapshotProjection(tool.name, "presentationMeta", projected);
    }
    const concludesTurn = this.concludingExecutions.has(exec);
    return this.markCanonical(exec, this.materializeFinalResult({
      isError: false,
      value,
      content,
      ...meta !== void 0 ? { meta } : {},
      ...concludesTurn ? { concludesTurn: true } : {}
    }));
  }
  /** Normalize an around-dispatch wrapper's authored result through the owning output contract. */
  normalizeDispatchResult(exec, result) {
    if (this.canonicalResults.get(result) === exec.token) return result;
    if (result.isError) {
      return this.markCanonical(exec, {
        isError: true,
        error: result.error,
        content: result.content,
        ...result.meta !== void 0 ? { meta: result.meta } : {},
        ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
      });
    }
    const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
    if (tool === void 0) throw new ToolNotFoundError(exec.name);
    const normalized = this.createSuccessResult(exec, tool, result.value);
    return this.markCanonical(exec, {
      ...normalized,
      ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
    });
  }
  /** Materialize the authoritative commit outcome once, immediately before `tools/result`. */
  materializeFinalResult(result) {
    const presentation = {
      content: result.content,
      ...result.meta !== void 0 ? { meta: result.meta } : {},
      ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
    };
    if (result.isError) {
      return materializePresentation({ isError: true, error: result.error, ...presentation });
    }
    const detached = materializePresentation({
      isError: false,
      ...presentation,
      ...result.concludesTurn === true ? { concludesTurn: true } : {}
    });
    return deepFreeze({ ...detached, value: result.value });
  }
};
function createExecutionToken() {
  return /* @__PURE__ */ Symbol("dsh.tool.execution");
}
function toolErrorResult(error) {
  const info = errorInfo(error);
  const message = errorMessage2(error);
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
    error: { message, ...info ? { info } : {} }
  };
}
function isAborted(signal) {
  return signal.aborted;
}
function fuseToolSignals(caller, wrapper) {
  if (caller === wrapper) return { signal: caller, dispose() {
  } };
  const controller = new AbortController();
  let listening = false;
  const dispose = () => {
    if (!listening) return;
    listening = false;
    caller.removeEventListener("abort", abortFromCaller);
    wrapper.removeEventListener("abort", abortFromWrapper);
  };
  const abortFrom = (source) => {
    const reason = source.reason;
    controller.abort(reason);
    dispose();
  };
  const abortFromCaller = () => {
    abortFrom(caller);
  };
  const abortFromWrapper = () => {
    abortFrom(wrapper);
  };
  if (wrapper.aborted) abortFromWrapper();
  else if (caller.aborted) abortFromCaller();
  else {
    listening = true;
    caller.addEventListener("abort", abortFromCaller, { once: true });
    wrapper.addEventListener("abort", abortFromWrapper, { once: true });
  }
  return { signal: controller.signal, dispose };
}
function toolAbortedResult(prior) {
  const additionalContexts = prior?.additionalContexts ?? [];
  return {
    content: [{ type: "text", text: "Error: tool call aborted" }],
    isError: true,
    error: {
      message: "tool call aborted",
      info: { name: "AbortError", code: TOOL_ABORTED }
    },
    ...additionalContexts.length > 0 ? { additionalContexts } : {}
  };
}
function toolAbortedBeforeDispatchResult(prior) {
  const additionalContexts = prior?.additionalContexts ?? [];
  return {
    content: [{ type: "text", text: "Error: tool call aborted before dispatch" }],
    isError: true,
    error: {
      message: "tool call aborted before dispatch",
      info: { name: "AbortError", code: TOOL_ABORTED_BEFORE_DISPATCH }
    },
    ...additionalContexts.length > 0 ? { additionalContexts } : {}
  };
}
var src_default7 = ToolRuntime;

// ../../source/deepseek-harness/packages/skill/skill/src/index.ts
var SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var DEFAULT_COLLECT_CACHE_ENTRIES = 128;
var MAX_COLLECT_ATTEMPTS = 2;
var RUNTIME_PROVIDER = "runtime";
var RUNTIME_RANK = 250;
var BUNDLED_SKILL_RANK = 600;
function isSkillName(name15) {
  return SKILL_NAME.test(name15);
}
function isModelInvocable(skill) {
  return skill.invocation.modelInvocable;
}
function isUserInvocable(skill) {
  return skill.invocation.userInvocable;
}
function renderSkillContent(skill) {
  const resourceHint = renderResourceHint(skill);
  return [
    `<skill_content name="${escapeAttr(skill.name)}">`,
    "<skill_resources>",
    ...resourceHint,
    "</skill_resources>",
    "",
    "<skill_instructions>",
    skill.content,
    "</skill_instructions>",
    "</skill_content>"
  ].join("\n");
}
function renderResourceHint(skill) {
  const base = skill.resourceBase;
  if (base === void 0) {
    return [
      `Resources for this skill are managed by provider "${escapeText(skill.provider)}".`,
      "Load referenced resources only as needed."
    ];
  }
  switch (base.kind) {
    case "directory":
      return [
        `Base directory for this skill: ${escapeText(base.path)}`,
        "Resolve relative paths mentioned by this skill against the base directory before using them. Load referenced resources only as needed."
      ];
    case "url":
      return [
        `Base URL for this skill: ${escapeText(base.url)}`,
        "Resolve relative URLs mentioned by this skill against the base URL before using them. Load referenced resources only as needed."
      ];
    case "opaque":
      return [
        `Resources for this skill: ${escapeText(base.description)}`,
        "Load referenced resources only as needed."
      ];
    /* v8 ignore start -- SkillResourceBase is a closed union; a future kind must fail compilation here. */
    default:
      return assertNever(base, "SkillResourceBase.kind");
  }
}
function escapeAttr(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
var SkillLayer = class {
  /** Providers registered through contexts carrying this scope, insertion-ordered. */
  providers;
  /** Runtime skills registered through contexts carrying this scope. */
  runtime = /* @__PURE__ */ new Map();
  constructor(scope2) {
    this.providers = new NamedEntries((name15) => new Error(scope2 === void 0 ? `a skill provider named "${name15}" is already registered` : `a skill provider named "${name15}" is already registered in this scope`));
  }
  /** Whether every contribution table in this aggregate layer is empty. */
  isEmpty() {
    return this.providers.isEmpty() && this.runtime.size === 0;
  }
};
var SkillRegistry = class extends Service {
  static Config = src_default2.object({
    collectCacheMaxEntries: src_default2.number().default(DEFAULT_COLLECT_CACHE_ENTRIES)
  });
  collectCacheMaxEntries;
  layers = new ScopedLayers(
    (scope2) => new SkillLayer(scope2),
    () => {
      this.invalidateCache();
    }
  );
  collectCache = /* @__PURE__ */ new Map();
  revision = 0;
  nextProviderOrder = 0;
  /** Stable identities for cache keys; scope keys are opaque identity-compared objects. */
  scopeIds = /* @__PURE__ */ new WeakMap();
  nextScopeId = 1;
  constructor(ctx, config = {}) {
    super(ctx, "skills");
    this.collectCacheMaxEntries = config.collectCacheMaxEntries ?? DEFAULT_COLLECT_CACHE_ENTRIES;
    assertPositiveInteger3("collectCacheMaxEntries", this.collectCacheMaxEntries);
  }
  /**
   * Register a borrowed same-process provider synchronously during plugin
   * apply, into the calling context's layer: a scoped context (an agent
   * preset's standing mount) registers for that scope alone, an unscoped
   * context registers globally. Duplicate names within one layer and reserved
   * names throw; remote initialization belongs in `list()`. Fiber disposal
   * unregisters the provider and invalidates catalog caches.
   * @param create - synchronous factory receiving this registration's lifecycle and invalidation control.
   * @returns the exact Cordis effect disposer that unregisters this provider;
   *   composite effects may yield it directly to preserve teardown ordering.
   */
  registerProvider(create) {
    const lifecycle = new AbortController();
    let registration;
    let provider;
    const control = {
      signal: lifecycle.signal,
      invalidate: () => {
        const active = registration;
        if (active !== void 0 && active.layer.providers.get(active.name)?.provider === provider) {
          this.invalidateCache();
        }
      }
    };
    try {
      provider = create(control);
      const name15 = provider.name;
      if (name15 === RUNTIME_PROVIDER) {
        throw new Error(`"${RUNTIME_PROVIDER}" is reserved for runtime skill registrations`);
      }
      const order = this.nextProviderOrder;
      this.nextProviderOrder += 1;
      return this.layers.effect(
        this.ctx,
        (layer) => {
          const undo = layer.providers.insert(name15, { provider, order });
          registration = { layer, name: name15 };
          return () => {
            registration = void 0;
            undo();
            lifecycle.abort(new Error(`skill provider "${name15}" disposed`));
          };
        },
        { label: "skills.registerProvider()" }
      );
    } catch (error) {
      lifecycle.abort(error);
      throw error;
    }
  }
  /**
   * Register a borrowed readonly runtime skill into the calling context's
   * layer. Project entries outrank runtime entries, which outrank user
   * entries, within one layer. Same-name runtime entries in one layer are
   * first-wins; a duplicate logs a warning and receives a no-op disposer so
   * it cannot remove the winner.
   * @param skill - the skill definition input; omitted invocation and provider fields receive defaults.
   * @returns the exact Cordis effect disposer, preserving composite teardown order and invalidating caches.
   */
  register(skill) {
    validateRuntimeSkill(skill);
    const scope2 = scopeOf(this.ctx);
    const existingLayer = scope2 === void 0 ? this.layers.global : this.layers.peek(scope2);
    if (existingLayer !== void 0 && existingLayer.runtime.has(skill.name)) {
      this.ctx.logger.warn(`runtime skill "${skill.name}" ignored because it is already registered`);
      return () => {
      };
    }
    const definition = {
      ...skill,
      invocation: skill.invocation ?? { modelInvocable: true, userInvocable: true },
      provider: skill.provider ?? RUNTIME_PROVIDER
    };
    return this.layers.effect(
      this.ctx,
      (layer) => {
        layer.runtime.set(definition.name, definition);
        return () => {
          layer.runtime.delete(definition.name);
        };
      },
      { label: "skills.register()" }
    );
  }
  /**
   * List invocation-neutral skill summaries for a workspace. Consumers apply
   * model or user invocation policy at their operational boundary. Lookup
   * options and provider candidates are readonly same-process values borrowed
   * throughout discovery.
   * @param options - view options; `scope` selects the viewing agent's layers, `cwd` selects project roots, and `signal` cancels discovery.
   * @returns all sorted winning summaries.
   */
  async list(options = {}) {
    return (await this.snapshot(options)).skills;
  }
  /**
   * Observe the current invocation-neutral catalog and whether discovery completed within a stable revision.
   * Incomplete observations are never cached, allowing consumers to retain last-good state and
   * retry on their next request boundary.
   * @param options - view options; `scope` selects the viewing agent's layers, `cwd` selects project roots, and `signal` cancels discovery.
   * @returns sorted summaries plus discovery-completeness state.
   */
  async snapshot(options = {}) {
    const collected = await this.collect(options);
    return {
      skills: [...collected.entries.values()].map((entry) => toSummary(entry.candidate)).sort(compareSkillSummary),
      complete: collected.cacheable
    };
  }
  /**
   * Load and validate the winning candidate, passing its opaque discovery locator back to the
   * provider. Cancellation is rechecked after selection, including cache hits, and raced against
   * loading so an uncooperative provider cannot hang the caller.
   * @param name - kebab-case skill name.
   * @param options - view options; `scope` selects the viewing agent's layers,
   *   `cwd` selects workspace-sensitive skills, and `signal` cancels work.
   * @returns the full skill, including body content, or `undefined`.
   */
  async get(name15, options = {}) {
    if (!isSkillName(name15)) return void 0;
    const collected = await this.collect(options);
    throwIfAborted(options.signal);
    const match = collected.entries.get(name15);
    if (match === void 0) return void 0;
    const definition = await waitWithAbort(
      match.provider.get(match.candidate, options),
      options.signal
    );
    if (definition === void 0) return void 0;
    validateDefinition(definition);
    if (definition.name !== match.candidate.name) {
      this.invalidateEntry(match);
      return void 0;
    }
    return definition;
  }
  async collect(options) {
    throwIfAborted(options.signal);
    let attempt = 1;
    while (true) {
      const revision = this.revision;
      const key = this.collectCacheKey(options.cwd, scopeChainOf(options.scope), revision);
      const cached = this.collectCache.get(key);
      if (cached !== void 0) return { entries: cached, cacheable: true };
      const result = await this.collectFresh(options);
      throwIfAborted(options.signal);
      if (revision !== this.revision) {
        if (attempt < MAX_COLLECT_ATTEMPTS) {
          attempt += 1;
          continue;
        }
        return { entries: result.entries, cacheable: false };
      }
      if (result.cacheable) {
        this.collectCache.set(key, result.entries);
        if (this.collectCache.size > this.collectCacheMaxEntries) {
          const oldest = this.collectCache.keys().next();
          this.collectCache.delete(oldest.value);
        }
      }
      return result;
    }
  }
  async collectFresh(options) {
    const layers = [this.layers.global, ...this.layers.chainLayers(options.scope)];
    const merged = /* @__PURE__ */ new Map();
    let cacheable = true;
    for (const layer of layers) {
      const collected = await this.collectLayer(layer, options);
      if (!collected.cacheable) cacheable = false;
      for (const entry of collected.entries) merged.set(entry.candidate.name, entry);
    }
    return { entries: merged, cacheable };
  }
  async collectLayer(layer, options) {
    const collected = await this.listLayerCandidates(layer, options);
    collected.entries.sort(compareIndexedCandidates);
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const entry of collected.entries) {
      const skill = entry.candidate;
      if (seen.has(skill.name)) {
        this.ctx.logger.warn(`skill "${skill.name}" from ${skill.source} ignored because a higher-priority skill already exists`);
        continue;
      }
      seen.add(skill.name);
      result.push(entry);
    }
    return { entries: result, cacheable: collected.cacheable };
  }
  async listLayerCandidates(layer, options) {
    throwIfAborted(options.signal);
    const candidates = [];
    let cacheable = true;
    let runtimeOrder = 0;
    for (const skill of [...layer.runtime.values()].sort((a, b) => compareCodePoints(a.name, b.name))) {
      candidates.push({
        candidate: runtimeCandidate(skill),
        provider: RUNTIME_SKILL_PROVIDER,
        providerOrder: -1,
        localOrder: runtimeOrder,
        layer
      });
      runtimeOrder += 1;
    }
    for (const { provider, order } of [...layer.providers.values()]) {
      let localOrder = 0;
      let output;
      try {
        output = await waitWithAbort(provider.list(options), options.signal);
      } catch (error) {
        if (options.signal?.aborted === true) throw toError(options.signal.reason);
        cacheable = false;
        this.ctx.logger.warn(`skill provider "${provider.name}" skipped: ${errorMessage3(error)}`);
      }
      if (output === void 0) continue;
      const observation = normalizeProviderObservation(output, provider.name);
      if (!observation.complete) cacheable = false;
      for (const candidate of observation.candidates) {
        validateCandidate(candidate, provider.name);
        candidates.push({ candidate, provider, providerOrder: order, localOrder, layer });
        localOrder += 1;
      }
    }
    return { entries: candidates, cacheable };
  }
  invalidateCache() {
    this.revision += 1;
    this.collectCache.clear();
    this.notifyChange();
  }
  /** Invalidate after a stale definition load, only while the exact registration that produced the entry is still live. */
  invalidateEntry(entry) {
    if (entry.layer.providers.get(entry.provider.name)?.provider === entry.provider) this.invalidateCache();
  }
  scopeId(key) {
    let id = this.scopeIds.get(key);
    if (id === void 0) {
      id = this.nextScopeId;
      this.nextScopeId += 1;
      this.scopeIds.set(key, id);
    }
    return id;
  }
  collectCacheKey(cwd, chain, revision) {
    return JSON.stringify({ cwd, scopes: chain.map((key) => this.scopeId(key)), revision });
  }
  /** Notify catalog observers without making their refresh work load-bearing. */
  notifyChange() {
    for (const callback of this.ctx.events.dispatch("emit", ["skills/change"])) {
      try {
        const returned = callback();
        void Promise.resolve(returned).catch((error) => {
          this.ctx.logger.warn(`skills/change listener rejected: ${errorMessage3(error)}`);
        });
      } catch (error) {
        this.ctx.logger.warn(`skills/change listener threw: ${errorMessage3(error)}`);
      }
    }
  }
};
function normalizeProviderObservation(output, providerName) {
  if (Array.isArray(output)) {
    return { candidates: output, complete: true };
  }
  if (output === null || typeof output !== "object") {
    throw invalidProviderObservation(providerName);
  }
  const observation = output;
  if (!Array.isArray(observation.candidates) || typeof observation.complete !== "boolean") {
    throw invalidProviderObservation(providerName);
  }
  return observation;
}
function invalidProviderObservation(providerName) {
  return new TypeError(`skill provider "${providerName}" list() must return an array or { candidates, complete } observation`);
}
var RUNTIME_SKILL_PROVIDER = {
  name: RUNTIME_PROVIDER,
  /* v8 ignore next -- Runtime skills are injected directly by the registry; this provider only owns `get()`. */
  list() {
    return Promise.resolve([]);
  },
  get(candidate) {
    return Promise.resolve(candidate.locator);
  }
};
function runtimeCandidate(skill) {
  return {
    name: skill.name,
    description: skill.description,
    ...skill.whenToUse !== void 0 ? { whenToUse: skill.whenToUse } : {},
    invocation: skill.invocation,
    source: skill.source,
    provider: skill.provider,
    ...skill.resourceBase !== void 0 ? { resourceBase: skill.resourceBase } : {},
    rank: RUNTIME_RANK,
    locator: skill,
    ...skill.path !== void 0 ? { path: skill.path } : {},
    ...skill.metadata !== void 0 ? { metadata: skill.metadata } : {}
  };
}
function validateCandidate(candidate, providerName) {
  if (typeof candidate.name !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned a non-string skill name`);
  }
  if (!SKILL_NAME.test(candidate.name)) {
    throw new Error(`skill provider "${providerName}" returned invalid skill name "${candidate.name}"`);
  }
  if (typeof candidate.description !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned skill "${candidate.name}" with a non-string description`);
  }
  if (candidate.description.length === 0) {
    throw new Error(`skill provider "${providerName}" returned skill "${candidate.name}" without a description`);
  }
  validateInvocation(candidate.invocation, `skill provider "${providerName}" returned skill "${candidate.name}"`);
  if (candidate.whenToUse !== void 0 && typeof candidate.whenToUse !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned skill "${candidate.name}" with a non-string whenToUse`);
  }
  if (typeof candidate.source !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned skill "${candidate.name}" with a non-string source`);
  }
  if (typeof candidate.rank !== "number" || !Number.isFinite(candidate.rank)) {
    throw new Error(`skill provider "${providerName}" returned skill "${candidate.name}" with an invalid rank`);
  }
  if (typeof candidate.provider !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned skill "${candidate.name}" with a non-string provider`);
  }
  if (candidate.provider !== providerName) {
    throw new Error(`skill provider "${providerName}" returned skill "${candidate.name}" for provider "${candidate.provider}"`);
  }
  if (candidate.path !== void 0 && typeof candidate.path !== "string") {
    throw new TypeError(`skill provider "${providerName}" returned skill "${candidate.name}" with a non-string path`);
  }
}
function validateRuntimeSkill(skill) {
  if (!SKILL_NAME.test(skill.name)) throw new Error(`invalid skill name "${skill.name}"`);
  if (skill.description.length === 0) throw new Error(`skill "${skill.name}" requires a description`);
  validateInvocation(skill.invocation, `runtime skill "${skill.name}"`);
}
function validateDefinition(skill) {
  const name15 = skill.name;
  const description = skill.description;
  const whenToUse = skill.whenToUse;
  const invocation = skill.invocation;
  const source = skill.source;
  const provider = skill.provider;
  const content = skill.content;
  const path = skill.path;
  if (typeof name15 !== "string") throw new TypeError("loaded skill name must be a string");
  if (!SKILL_NAME.test(name15)) throw new Error(`loaded skill has invalid name "${name15}"`);
  if (typeof description !== "string") throw new TypeError(`loaded skill "${name15}" description must be a string`);
  if (description.length === 0) throw new Error(`loaded skill "${name15}" requires a description`);
  validateInvocation(invocation, `loaded skill "${name15}"`);
  if (whenToUse !== void 0 && typeof whenToUse !== "string") throw new TypeError(`loaded skill "${name15}" whenToUse must be a string`);
  if (typeof source !== "string") throw new TypeError(`loaded skill "${name15}" source must be a string`);
  if (typeof provider !== "string") throw new TypeError(`loaded skill "${name15}" provider must be a string`);
  if (typeof content !== "string") throw new TypeError(`loaded skill "${name15}" content must be a string`);
  if (path !== void 0 && typeof path !== "string") throw new TypeError(`loaded skill "${name15}" path must be a string`);
}
function toSummary(skill) {
  const { name: name15, description, whenToUse, invocation, source, provider, resourceBase } = skill;
  return {
    name: name15,
    description,
    ...whenToUse !== void 0 ? { whenToUse } : {},
    invocation,
    source,
    provider,
    ...resourceBase !== void 0 ? { resourceBase } : {}
  };
}
function validateInvocation(invocation, subject) {
  if (invocation === void 0) return;
  if (typeof invocation !== "object" || invocation === null || Array.isArray(invocation)) {
    throw new TypeError(`${subject} with a non-object invocation policy`);
  }
  const policy = invocation;
  if (typeof policy.modelInvocable !== "boolean") {
    throw new TypeError(`${subject} with a non-boolean invocation.modelInvocable`);
  }
  if (typeof policy.userInvocable !== "boolean") {
    throw new TypeError(`${subject} with a non-boolean invocation.userInvocable`);
  }
}
function compareSkillSummary(left, right) {
  return compareCodePoints(left.name, right.name);
}
function compareCodePoints(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
function compareIndexedCandidates(left, right) {
  return left.candidate.rank - right.candidate.rank || left.providerOrder - right.providerOrder || left.localOrder - right.localOrder;
}
function assertPositiveInteger3(name15, value, minimum = 1) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`skill: ${name15} must be an integer greater than or equal to ${minimum}`);
  }
}
function waitWithAbort(promise, signal) {
  if (signal === void 0) return promise;
  throwIfAborted(signal);
  return new Promise((resolve5, reject2) => {
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject2(toError(signal.reason));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    void promise.then(
      (value) => {
        cleanup();
        resolve5(value);
      },
      (error) => {
        cleanup();
        reject2(toError(error));
      }
    );
  });
}
function throwIfAborted(signal) {
  if (signal?.aborted === true) throw toError(signal.reason);
}
function toError(error) {
  try {
    if (error instanceof Error) return error;
  } catch {
  }
  return new Error(errorMessage3(error));
}
function errorMessage3(error) {
  try {
    return String(error);
  } catch {
    return "[unrenderable thrown value]";
  }
}
var src_default8 = SkillRegistry;

// ../../source/deepseek-harness/packages/skill/skill-filesystem/src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  FileSystemSkillProvider: () => FileSystemSkillProvider,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
import { access, lstat, readdir, readFile, stat } from "node:fs/promises";
import { unwatchFile, watchFile } from "node:fs";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join2, relative, resolve as resolve3, sep } from "node:path";
import { homedir as homedir2 } from "node:os";
import chokidar from "chokidar";
import { parse as parseYaml } from "yaml";

// ../../source/deepseek-harness/packages/util/home-paths/src/index.ts
import { opendir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve as resolve2 } from "node:path";
var DSH_HOME_DIR_NAME = ".dsh";
var DEFAULT_DSH_HOME_DISPLAY = `~/${DSH_HOME_DIR_NAME}`;
var DSH_HOME_ENV = "DSH_HOME";
async function canonicalizeWatchPath(path) {
  let current = resolve2(path);
  const missing = [];
  while (true) {
    try {
      const canonical = await realpath(current);
      if (missing.length > 0) {
        const directory = await opendir(canonical);
        await directory.close();
      }
      return join(canonical, ...missing.reverse());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = dirname(current);
      if (parent === current) throw error;
      missing.push(basename(current));
      current = parent;
    }
  }
}
function defaultDshHome() {
  return join(homedir(), DSH_HOME_DIR_NAME);
}
function expandHomePath(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
  return path;
}
function resolveDshHome(configured, env = process.env) {
  const fromEnv = env[DSH_HOME_ENV];
  const selected = configured ?? (fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : defaultDshHome());
  return resolve2(expandHomePath(selected));
}
function dshHomeDisplay(resolvedHome) {
  return resolvedHome === resolve2(defaultDshHome()) ? DEFAULT_DSH_HOME_DISPLAY : `$${DSH_HOME_ENV}`;
}

// ../../source/deepseek-harness/packages/skill/skill-filesystem/src/index.ts
var PROJECT_DSH_RANK = 100;
var PROJECT_AGENTS_RANK = 200;
var CUSTOM_RANK = 300;
var USER_DSH_RANK = 400;
var USER_AGENTS_RANK = 500;
var DEFAULT_WATCH_STABILITY_THRESHOLD_MS = 200;
var DEFAULT_WATCH_POLL_INTERVAL_MS = 100;
var DEFAULT_WATCH_MAX_PROJECTS = 128;
var name = "skill-filesystem";
var inject = ["skills"];
var Config = src_default2.object({
  providerName: src_default2.string().min(1).default("filesystem"),
  includeDefaultRoots: src_default2.boolean().default(true),
  dshHome: src_default2.string(),
  agentsHome: src_default2.string(),
  customSkillDirs: src_default2.array(src_default2.string()).default([]),
  watch: src_default2.boolean().default(true),
  watchUsePolling: src_default2.boolean().default(false),
  watchStabilityThresholdMs: src_default2.number().default(DEFAULT_WATCH_STABILITY_THRESHOLD_MS),
  watchPollIntervalMs: src_default2.number().default(DEFAULT_WATCH_POLL_INTERVAL_MS),
  watchMaxProjects: src_default2.number().default(DEFAULT_WATCH_MAX_PROJECTS),
  watchFollowSymlinks: src_default2.boolean().default(true),
  bundledSkillDir: src_default2.string()
});
function apply(ctx, config = {}) {
  let provider;
  ctx.skills.registerProvider((control) => {
    provider = new FileSystemSkillProvider(ctx, control, config);
    return provider;
  });
  ctx.effect(function* () {
    yield async () => {
      await provider.dispose();
    };
  }, "skill-filesystem watcher");
  ctx.on("fs/observed", (target, _observation, actor) => {
    if (mutationToolName(actor) === void 0) return;
    provider.observeHostMutation(target.displayPath);
  });
}
var FileSystemSkillProvider = class {
  constructor(ctx, control, config = {}) {
    this.ctx = ctx;
    this.name = config.providerName ?? "filesystem";
    this.includeDefaultRoots = config.includeDefaultRoots ?? true;
    this.dshHome = resolveDshHome(config.dshHome);
    this.agentsHome = resolve3(config.agentsHome ?? process.env.DSH_AGENTS_HOME ?? join2(homedir2(), ".agents"));
    this.customSkillDirs = (config.customSkillDirs ?? []).map((root) => resolve3(root));
    this.watchManager = new SkillWatchManager(ctx, control.invalidate, resolveWatchConfig(config));
    control.signal.addEventListener("abort", () => {
      void this.dispose();
    }, { once: true });
    const bundledSkillDir = config.bundledSkillDir ?? (this.includeDefaultRoots ? process.env.DSH_BUNDLED_SKILL_DIR : void 0);
    this.bundledSkillDir = bundledSkillDir === void 0 ? void 0 : resolve3(bundledSkillDir);
  }
  ctx;
  name;
  includeDefaultRoots;
  dshHome;
  agentsHome;
  customSkillDirs;
  watchManager;
  bundledSkillDir;
  disposal;
  /**
   * Discover local skill summaries for a cwd-sensitive workspace.
   * @param options - lookup options; `cwd` selects the project roots to scan.
   * @returns local provider candidates with stable root ranks; watcher startup
   *   failure returns readable candidates as an incomplete observation.
   */
  async list(options) {
    const roots = await this.roots(options.cwd);
    let complete = true;
    try {
      await this.watchManager.observeRoots(roots);
    } catch (error) {
      if (this.disposal !== void 0) throw error;
      complete = false;
    }
    const candidates = [];
    for (const root of roots) {
      for (const skill of await discoverRoot(root, this.ctx, this.name)) {
        candidates.push(skill);
      }
    }
    return complete ? candidates : { candidates, complete };
  }
  /**
   * Load a complete local skill body from the candidate's file locator.
   * @param candidate - the winning candidate returned by this provider.
   * @param options - lookup options whose signal cancels filesystem reads.
   * @returns the full local skill, or `undefined` if the file disappeared.
   */
  async get(candidate, options) {
    const locator = candidate.locator;
    const parsed = await parseSkillFile(locator.path, this.ctx, options.signal, candidate.source === "bundled");
    if (parsed === void 0) return void 0;
    return {
      name: parsed.name,
      description: parsed.description,
      ...parsed.whenToUse !== void 0 ? { whenToUse: parsed.whenToUse } : {},
      invocation: parsed.invocation,
      source: candidate.source,
      provider: this.name,
      resourceBase: { kind: "directory", path: locator.directory },
      path: locator.path,
      ...parsed.metadata !== void 0 ? { metadata: parsed.metadata } : {},
      content: parsed.content
    };
  }
  /**
   * Invalidate this provider synchronously after a first-party filesystem mutation.
   * @param path - host display path observed after a model-facing write or edit.
   */
  observeHostMutation(path) {
    this.watchManager.observeHostMutation(path);
  }
  /**
   * Close every host watcher and contain late filesystem callbacks.
   * @returns a shared promise that settles when every watcher reaches quiescence.
   */
  dispose() {
    this.disposal ??= this.watchManager.dispose();
    return this.disposal;
  }
  async roots(cwd) {
    const roots = [];
    if (this.includeDefaultRoots && cwd !== void 0) {
      const projectRoot = await findProjectRoot(resolve3(cwd), optionalFileSystem(this.ctx));
      roots.push(
        { path: join2(projectRoot, ".dsh/skills"), source: "project-dsh", rank: PROJECT_DSH_RANK, projectRoot },
        { path: join2(projectRoot, ".agents/skills"), source: "project-agents", rank: PROJECT_AGENTS_RANK, projectRoot }
      );
    }
    roots.push(...this.customSkillDirs.map((path) => ({ path, source: "custom", rank: CUSTOM_RANK })));
    if (this.includeDefaultRoots) {
      roots.push(
        { path: join2(this.dshHome, "skills"), source: "user-dsh", rank: USER_DSH_RANK, skipSystem: true },
        { path: join2(this.agentsHome, "skills"), source: "user-agents", rank: USER_AGENTS_RANK }
      );
    }
    if (this.bundledSkillDir !== void 0) {
      roots.push({ path: this.bundledSkillDir, source: "bundled", rank: BUNDLED_SKILL_RANK, trustedHost: true });
    }
    return roots;
  }
};
var SkillWatchManager = class {
  constructor(ctx, invalidate, config) {
    this.ctx = ctx;
    this.invalidate = invalidate;
    this.config = config;
  }
  ctx;
  invalidate;
  config;
  roots = /* @__PURE__ */ new Map();
  projects = /* @__PURE__ */ new Map();
  lifecycle = new AbortController();
  closing = false;
  invalidationQueued = false;
  async observeRoots(roots) {
    if (this.closing) return;
    const projectRoots = /* @__PURE__ */ new Map();
    const pending = [];
    for (const root of roots) {
      if (root.projectRoot === void 0) {
        pending.push(this.retainRoot(root, `shared:${root.path}`));
        continue;
      }
      const grouped = projectRoots.get(root.projectRoot) ?? [];
      grouped.push(root);
      projectRoots.set(root.projectRoot, grouped);
    }
    for (const [projectRoot, grouped] of projectRoots) {
      const owner = `project:${projectRoot}`;
      this.projects.delete(projectRoot);
      const paths = new Set(grouped.map((root) => root.path));
      this.projects.set(projectRoot, paths);
      for (const root of grouped) pending.push(this.retainRoot(root, owner));
    }
    let evictedProject = false;
    while (this.projects.size > this.config.maxProjects) {
      const oldest = this.projects.entries().next();
      if (oldest.done) break;
      const [projectRoot, paths] = oldest.value;
      this.projects.delete(projectRoot);
      const owner = `project:${projectRoot}`;
      for (const path of paths) pending.push(this.releaseRoot(path, owner));
      evictedProject = true;
    }
    await Promise.all(pending);
    if (evictedProject) this.invalidate();
  }
  observeHostMutation(path) {
    if (this.closing) return;
    const normalized = resolve3(path);
    if (![...this.roots.values()].some((state) => isPotentialSkillPath(state.root, normalized))) return;
    this.invalidate();
  }
  async dispose() {
    this.closing = true;
    this.lifecycle.abort(new Error("skill-filesystem watcher disposed"));
    const states = [...this.roots.values()];
    this.roots.clear();
    this.projects.clear();
    await Promise.all(states.map(async (state) => {
      await settleWatcherOpening(state.opening);
      const watcher = state.watcher;
      state.watcher = void 0;
      if (watcher !== void 0) await this.closeWatcher(watcher);
    }));
  }
  async retainRoot(root, owner) {
    let state = this.roots.get(root.path);
    if (state === void 0) {
      state = { root, owners: /* @__PURE__ */ new Set(), watcher: void 0, opening: void 0, unhealthy: true };
      this.roots.set(root.path, state);
    }
    state.owners.add(owner);
    if (this.config.enabled) await this.ensureWatcher(state);
  }
  async releaseRoot(path, owner) {
    const state = this.roots.get(path);
    if (state === void 0) return;
    state.owners.delete(owner);
    if (state.owners.size > 0) return;
    this.roots.delete(path);
    await settleWatcherOpening(state.opening);
    const watcher = state.watcher;
    state.watcher = void 0;
    if (watcher !== void 0) await this.closeWatcher(watcher);
  }
  ensureWatcher(state) {
    if (this.closing || !this.config.enabled) return Promise.resolve();
    if (state.opening !== void 0) return state.opening;
    const opening = this.ensureCurrentWatcher(state);
    state.opening = opening;
    void opening.then(
      () => {
        state.opening = void 0;
      },
      () => {
        state.opening = void 0;
      }
    );
    return opening;
  }
  async ensureCurrentWatcher(state) {
    const watcher = state.watcher;
    if (watcher !== void 0 && !state.unhealthy) {
      const current = await resolveRootWatchMode(state.root.path, this.config.followSymlinks);
      if (!state.unhealthy && sameWatchMode(watcher.mode, current)) return;
    }
    await this.replaceWatcher(state);
  }
  async replaceWatcher(state) {
    const previous = state.watcher;
    state.watcher = void 0;
    if (previous !== void 0) await this.closeWatcher(previous);
    if (this.closing || state.owners.size === 0) return;
    try {
      const watcher = await this.openStableWatcher(state);
      if (watcher === void 0) return;
      if (this.closing || state.owners.size === 0) {
        await this.closeWatcher(watcher);
        return;
      }
      state.watcher = watcher;
      state.unhealthy = false;
    } catch (error) {
      if (!this.closing) {
        state.unhealthy = true;
        this.ctx.logger.warn(`skill-filesystem: failed to watch ${state.root.path}: ${errorMessage4(error)}`);
      }
      throw error;
    }
  }
  // TODO(file-watch-service): Extract Chokidar and missing-root observation below into a Cordis
  // service; keep skill filtering and invalidation here.
  async openStableWatcher(state) {
    while (!this.closing && state.owners.size > 0) {
      const mode = await resolveRootWatchMode(state.root.path, this.config.followSymlinks);
      const watcher = mode.kind === "ancestor" ? this.openAncestorWatcher(state, mode) : await this.openRootWatcher(state, mode);
      const current = await resolveRootWatchMode(state.root.path, this.config.followSymlinks);
      if (sameWatchMode(mode, current)) return watcher;
      await this.closeWatcher(watcher);
    }
    return void 0;
  }
  openAncestorWatcher(state, mode) {
    const listener = (_current, _previous) => {
      void this.handleAncestorWatchEvent(state, mode);
    };
    watchFile(mode.nextPath, {
      persistent: false,
      interval: this.config.pollIntervalMs
    }, listener);
    return {
      mode,
      close() {
        unwatchFile(mode.nextPath, listener);
      }
    };
  }
  async handleAncestorWatchEvent(state, mode) {
    let current;
    try {
      current = await resolveRootWatchMode(state.root.path, this.config.followSymlinks);
    } catch (error) {
      if (!this.closing && state.owners.size > 0) this.handleWatcherError(state, error);
      return;
    }
    if (this.closing || state.owners.size === 0 || sameWatchMode(mode, current)) return;
    this.queueInvalidation();
    state.unhealthy = true;
    this.scheduleRewatch(state);
  }
  async openRootWatcher(state, mode) {
    const watcher = chokidar.watch(mode.anchor, {
      // Chokidar owns late native fs.watch errors only for persistent watchers;
      // this provider's effect explicitly closes every handle at teardown.
      persistent: true,
      ignoreInitial: true,
      depth: 1,
      followSymlinks: this.config.followSymlinks,
      atomic: true,
      awaitWriteFinish: {
        stabilityThreshold: this.config.stabilityThresholdMs,
        pollInterval: this.config.pollIntervalMs
      },
      usePolling: this.config.usePolling,
      interval: this.config.pollIntervalMs
    });
    const handle = {
      mode,
      close: () => watcher.close()
    };
    let ready = false;
    const readiness = Promise.withResolvers();
    const signal = this.lifecycle.signal;
    if (signal.aborted) {
      await this.closeWatcher(handle);
      signal.throwIfAborted();
    }
    const onAbort = () => {
      readiness.reject(signal.reason);
    };
    signal.addEventListener("abort", onAbort, { once: true });
    const onError = (error) => {
      if (!ready) {
        readiness.reject(error);
        return;
      }
      this.handleWatcherError(state, error);
    };
    watcher.on("error", onError);
    watcher.once("ready", () => {
      ready = true;
      readiness.resolve(void 0);
    });
    for (const event of ["add", "addDir", "change", "unlink", "unlinkDir"]) {
      watcher.on(event, (path) => {
        this.handleWatchEvent(state, mode, event, path);
      });
    }
    try {
      await readiness.promise;
    } catch (error) {
      await this.closeWatcher(handle);
      throw error;
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
    return handle;
  }
  handleWatchEvent(state, mode, event, path) {
    const target = resolve3(path);
    if (this.closing || !isRelevantWatchEvent({ ...state.root, path: mode.anchor }, event, target)) return;
    this.queueInvalidation();
    if (target === mode.anchor && event === "unlinkDir") {
      state.unhealthy = true;
      this.scheduleRewatch(state);
    }
  }
  handleWatcherError(state, error) {
    if (this.closing) return;
    this.ctx.logger.warn(`skill-filesystem: watcher for ${state.root.path} failed: ${errorMessage4(error)}`);
    state.unhealthy = true;
    this.queueInvalidation();
    this.scheduleRewatch(state);
  }
  scheduleRewatch(state) {
    const currentOpening = state.opening ?? Promise.resolve();
    void (async () => {
      await settleWatcherOpening(currentOpening);
      try {
        await this.ensureWatcher(state);
      } catch {
        return;
      }
      this.queueInvalidation();
    })();
  }
  queueInvalidation() {
    if (this.closing || this.invalidationQueued) return;
    this.invalidationQueued = true;
    queueMicrotask(() => {
      this.invalidationQueued = false;
      if (this.closing) return;
      this.invalidate();
    });
  }
  async closeWatcher(watcher) {
    try {
      await watcher.close();
    } catch (error) {
      this.ctx.logger.warn(`skill-filesystem: failed to close watcher: ${errorMessage4(error)}`);
    }
  }
};
async function settleWatcherOpening(opening) {
  if (opening === void 0) return;
  try {
    await opening;
  } catch {
  }
}
function resolveWatchConfig(config) {
  const stabilityThresholdMs = config.watchStabilityThresholdMs ?? DEFAULT_WATCH_STABILITY_THRESHOLD_MS;
  const pollIntervalMs = config.watchPollIntervalMs ?? DEFAULT_WATCH_POLL_INTERVAL_MS;
  const maxProjects = config.watchMaxProjects ?? DEFAULT_WATCH_MAX_PROJECTS;
  assertPositiveInteger4("watchStabilityThresholdMs", stabilityThresholdMs);
  assertPositiveInteger4("watchPollIntervalMs", pollIntervalMs);
  assertPositiveInteger4("watchMaxProjects", maxProjects);
  return {
    enabled: config.watch ?? true,
    usePolling: config.watchUsePolling ?? false,
    stabilityThresholdMs,
    pollIntervalMs,
    maxProjects,
    followSymlinks: config.watchFollowSymlinks ?? true
  };
}
async function resolveRootWatchMode(root, followSymlinks) {
  let candidate = root;
  while (true) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) {
        const preserveRootLink = candidate === root && !followSymlinks && (await lstat(candidate)).isSymbolicLink();
        const anchor = preserveRootLink ? resolve3(candidate) : await canonicalizeWatchPath(candidate);
        if (candidate === root) return { kind: "root", anchor };
        const firstSegment = relative(candidate, root).split(sep)[0];
        if (firstSegment === void 0 || firstSegment.length === 0) return { kind: "root", anchor };
        return { kind: "ancestor", anchor, nextPath: join2(anchor, firstSegment) };
      }
    } catch (error) {
      if (!isAbsentPathError(error)) throw error;
    }
    const parent = dirname2(candidate);
    if (parent === candidate) return { kind: "ancestor", anchor: candidate, nextPath: root };
    candidate = parent;
  }
}
function sameWatchMode(left, right) {
  return left.kind === right.kind && left.anchor === right.anchor && (left.kind === "root" || right.kind === "ancestor" && left.nextPath === right.nextPath);
}
function isRelevantWatchEvent(root, event, path) {
  const segments = containedSegments(root.path, path);
  if (segments === void 0) return false;
  if (segments.length === 0) return event === "addDir" || event === "unlinkDir";
  if (root.skipSystem === true && segments[0] === ".system") return false;
  if (segments.length === 1) {
    if (event === "addDir" || event === "unlinkDir") return true;
    return segments[0]?.endsWith(".md") === true;
  }
  return segments.length === 2 && segments[1] === "SKILL.md" && event !== "addDir" && event !== "unlinkDir";
}
function isPotentialSkillPath(root, path) {
  const segments = containedSegments(root.path, path);
  if (segments === void 0 || segments.length === 0 || segments.length > 2) return false;
  if (root.skipSystem === true && segments[0] === ".system") return false;
  return segments.length === 1 ? segments[0]?.endsWith(".md") === true : segments[1] === "SKILL.md";
}
function containedSegments(root, path) {
  const child = relative(root, path);
  if (child.length === 0) return [];
  if (child === ".." || child.startsWith(`..${sep}`) || isAbsolute2(child)) return void 0;
  return child.split(sep);
}
function mutationToolName(actor) {
  if (actor === void 0 || !("name" in actor)) return void 0;
  const value = actor.name;
  return value === "edit" || value === "write" ? value : void 0;
}
function assertPositiveInteger4(field, value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`skill-filesystem: ${field} must be a positive integer`);
  }
}
function isAbsentPathError(error) {
  return hasErrorCode(error, "ENOENT") || hasErrorCode(error, "ENOTDIR");
}
function isAbsentSkillPathError(error) {
  return isAbsentPathError(error) || hasErrorCode(error, "FS_NOT_FOUND") || hasErrorCode(error, "FS_NOT_DIRECTORY");
}
function hasErrorCode(error, code) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
async function discoverRoot(root, ctx, provider) {
  const skills = [];
  const entries = await listSkillRootEntries(root, ctx);
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (root.skipSystem && entry.name === ".system") continue;
    const locator = entry.type === "directory" ? { path: join2(entry.path, "SKILL.md"), directory: entry.path } : entry.type === "file" && entry.name.endsWith(".md") ? { path: entry.path, directory: root.path } : void 0;
    if (locator === void 0) continue;
    const parsed = await parseSkillFile(locator.path, ctx, void 0, root.trustedHost === true);
    if (parsed === void 0) continue;
    skills.push({
      name: parsed.name,
      description: parsed.description,
      ...parsed.whenToUse !== void 0 ? { whenToUse: parsed.whenToUse } : {},
      invocation: parsed.invocation,
      provider,
      source: root.source,
      rank: root.rank,
      locator,
      resourceBase: { kind: "directory", path: locator.directory },
      path: locator.path,
      ...parsed.metadata !== void 0 ? { metadata: parsed.metadata } : {}
    });
  }
  return skills;
}
async function listSkillRootEntries(root, ctx) {
  const fs = optionalFileSystem(ctx);
  if (fs !== void 0 && root.trustedHost !== true) return await listSkillRootEntriesFromFileSystem(root, fs);
  return await listSkillRootEntriesFromNode(root, ctx);
}
async function listSkillRootEntriesFromFileSystem(root, fs) {
  try {
    return (await fsListDir(fs, root.path)).map(entryFromFs);
  } catch (error) {
    if (isAbsentSkillPathError(error)) return [];
    throw error;
  }
}
async function fsListDir(fs, path) {
  const target = await fs.resolve(path);
  return await fs.listDir(target);
}
function entryFromFs(entry) {
  return { name: entry.name, type: entry.type, path: entry.target.displayPath };
}
async function listSkillRootEntriesFromNode(root, ctx) {
  let entries;
  try {
    entries = await readdir(root.path, { withFileTypes: true, encoding: "utf8" });
  } catch (error) {
    if (isAbsentSkillPathError(error)) return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    const path = join2(root.path, entry.name);
    const type = await nodeEntryKind(path, entry, ctx);
    result.push({ name: entry.name, type: type ?? "other", path });
  }
  return result;
}
async function parseSkillFile(path, ctx, signal, trustedHost = false) {
  const raw = await readSkillText(ctx, path, signal, trustedHost);
  signal?.throwIfAborted();
  if (raw === void 0) {
    return void 0;
  }
  let parsed;
  try {
    parsed = parseFrontmatter(raw);
  } catch (error) {
    ctx.logger.warn(`skill file ${path} ignored: invalid YAML frontmatter: ${errorMessage4(error)}`);
    return void 0;
  }
  if (!parsed) {
    ctx.logger.warn(`skill file ${path} ignored: missing YAML frontmatter`);
    return void 0;
  }
  const name15 = stringField(parsed.data, "name");
  const description = stringField(parsed.data, "description");
  if (name15 === void 0 || description === void 0) {
    ctx.logger.warn(`skill file ${path} ignored: frontmatter requires name and description`);
    return void 0;
  }
  if (!isSkillName(name15)) {
    ctx.logger.warn(`skill file ${path} ignored: invalid skill name "${name15}"`);
    return void 0;
  }
  let invocation;
  try {
    invocation = parseInvocationPolicy(parsed.data);
  } catch (error) {
    ctx.logger.warn(`skill file ${path} ignored: invalid invocation frontmatter: ${errorMessage4(error)}`);
    return void 0;
  }
  return {
    name: name15,
    description,
    ...optionalString(parsed.data, "whenToUse"),
    invocation,
    ...optionalMetadata(parsed.data),
    content: parsed.body.trim()
  };
}
function optionalFileSystem(ctx) {
  return ctx.get("fs");
}
async function readSkillText(ctx, path, signal, trustedHost = false) {
  signal?.throwIfAborted();
  const fs = optionalFileSystem(ctx);
  if (fs !== void 0 && !trustedHost) {
    return await readSkillTextFromFileSystem(ctx, fs, path, signal);
  }
  try {
    return await readFile(path, { encoding: "utf8", signal });
  } catch (error) {
    signal?.throwIfAborted();
    if (isAbsentSkillPathError(error)) return void 0;
    throw error;
  }
}
async function readSkillTextFromFileSystem(ctx, fs, path, signal) {
  signal?.throwIfAborted();
  let target;
  try {
    target = await fs.resolve(path);
  } catch (error) {
    if (isAbsentSkillPathError(error)) return void 0;
    throw error;
  }
  signal?.throwIfAborted();
  let info;
  try {
    info = await fs.stat(target, signal);
  } catch (error) {
    signal?.throwIfAborted();
    if (isAbsentSkillPathError(error)) return void 0;
    throw error;
  }
  if (info === void 0 || info.type !== "file") return void 0;
  try {
    return await fs.readText(target, signal);
  } catch (error) {
    signal?.throwIfAborted();
    if (isAbsentSkillPathError(error)) return void 0;
    if (!hasErrorCode(error, "FS_NOT_TEXT")) throw error;
    ctx.logger.warn(`skill file ${path} ignored: ${fsReadErrorMessage(target, error)}`);
    return void 0;
  }
}
function fsReadErrorMessage(target, error) {
  return `failed to read text file at ${target.displayPath}: ${errorMessage4(error)}`;
}
async function nodeEntryKind(fullPath, entry, ctx) {
  if (entry.isDirectory()) return "directory";
  if (entry.isFile()) return "file";
  if (!entry.isSymbolicLink()) return void 0;
  try {
    const info = await stat(fullPath);
    if (info.isDirectory()) return "directory";
    if (info.isFile()) return "file";
    return void 0;
  } catch (error) {
    ctx.logger.warn(`skill entry ${fullPath} ignored: failed to follow symbolic link: ${errorMessage4(error)}`);
    return void 0;
  }
}
function parseFrontmatter(raw) {
  const firstLineEnd = raw.indexOf("\n");
  if (firstLineEnd < 0) return void 0;
  const firstLine = raw.slice(0, firstLineEnd).replace(/\r$/, "");
  if (firstLine !== "---") return void 0;
  const start = firstLineEnd + 1;
  const closing = findClosingFrontmatter(raw, start);
  if (closing === void 0) return void 0;
  const yaml = raw.slice(start, closing.start);
  const parsed = parseYaml(yaml);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return void 0;
  return { data: parsed, body: raw.slice(closing.bodyStart) };
}
function findClosingFrontmatter(raw, start) {
  let lineStart = start;
  while (lineStart <= raw.length) {
    const nextNewline = raw.indexOf("\n", lineStart);
    const lineEnd = nextNewline < 0 ? raw.length : nextNewline;
    const line = raw.slice(lineStart, lineEnd).replace(/\r$/, "");
    if (line === "---") {
      return { start: lineStart, bodyStart: nextNewline < 0 ? raw.length : nextNewline + 1 };
    }
    if (nextNewline < 0) return void 0;
    lineStart = nextNewline + 1;
  }
}
async function findProjectRoot(cwd, fs) {
  let current = cwd;
  while (true) {
    if (await pathExists(join2(current, ".git"), fs)) {
      return current;
    }
    const parent = dirname2(current);
    if (parent === current) return cwd;
    current = parent;
  }
}
async function pathExists(path, fs) {
  if (fs !== void 0) {
    return await pathExistsInFileSystem(path, fs);
  }
  return await pathExistsInNode(path);
}
async function pathExistsInFileSystem(path, fs) {
  let target;
  try {
    target = await fs.resolve(path);
  } catch {
    return false;
  }
  try {
    return await fs.stat(target) !== void 0;
  } catch {
    return false;
  }
}
async function pathExistsInNode(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function stringField(data, key) {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function optionalString(data, key) {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? { [key]: value } : {};
}
function parseInvocationPolicy(data) {
  rejectLegacyInvocationKey(data, "disableModelInvocation", "disable-model-invocation");
  rejectLegacyInvocationKey(data, "modelInvocable", "disable-model-invocation");
  rejectLegacyInvocationKey(data, "userInvocable", "user-invocable");
  const disableModelInvocation = frontmatterBoolean(data, "disable-model-invocation");
  const userInvocable = frontmatterBoolean(data, "user-invocable");
  return {
    modelInvocable: disableModelInvocation !== true,
    userInvocable: userInvocable !== false
  };
}
function rejectLegacyInvocationKey(data, legacy, canonical) {
  if (Object.hasOwn(data, legacy)) {
    throw new Error(`frontmatter field "${legacy}" is unsupported; use "${canonical}"`);
  }
}
function frontmatterBoolean(data, key) {
  if (!Object.hasOwn(data, key)) return void 0;
  const value = data[key];
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    switch (value.toLowerCase()) {
      case "true":
      case "yes":
      case "on":
        return true;
      case "false":
      case "no":
      case "off":
        return false;
    }
  }
  throw new TypeError(`frontmatter field "${key}" must be a boolean`);
}
function optionalMetadata(data) {
  const value = data.metadata;
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return { metadata: value };
  }
  return {};
}
function errorMessage4(error) {
  return String(error);
}

// ../../source/deepseek-harness/packages/core/agent/src/index.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { isPromise } from "node:util/types";

// ../../source/deepseek-harness/packages/core/agent/src/inbox.ts
var Inbox = class {
  constructor(session, notifications) {
    this.session = session;
    this.notifications = notifications;
    for (const event of session.events.slice(session.header.seedLength ?? 0)) {
      if (event.type !== "agent/inbox/spliced") continue;
      try {
        this.apply(event.data);
      } catch (error) {
        throw new Error(`invalid persisted inbox splice at session seq ${event.seq}`, { cause: error });
      }
    }
  }
  session;
  notifications;
  state = { "next-turn": [], "next-step": [] };
  /** Prompts awaiting individual turns. */
  get nextTurn() {
    return this.state["next-turn"];
  }
  /** Input awaiting the next step boundary. */
  get nextStep() {
    return this.state["next-step"];
  }
  /** Whether either pending-message list contains work. */
  get hasPending() {
    return this.nextTurn.length > 0 || this.nextStep.length > 0;
  }
  /** Durably cancel all pending input, clearing next-step before next-turn. */
  clear() {
    this.splice("next-step", 0, this.nextStep.length, []);
    this.splice("next-turn", 0, this.nextTurn.length, []);
  }
  /**
   * Remove and return the complete batch proposed for one step, publishing
   * each claimed message. The durable splices are pure deletions.
   * @param target - whether this boundary also consumes one queued turn.
   * @param turn - turn that will own the claimed batch.
   * @returns next-step input followed by the queued turn, when requested.
   * @internal - The agent loop's step-boundary operation, not a plugin extension point.
   */
  claim(target, turn) {
    const claimed = this.mutate("next-step", 0, this.nextStep.length, [], false);
    if (target === "next-turn") {
      claimed.push(...this.mutate("next-turn", 0, 1, [], false));
    }
    for (const message of claimed) this.notifications.claimed(message, turn);
    return claimed;
  }
  /**
   * Append one message to a pending list and durably record the insertion.
   * @param target - pending list to extend.
   * @param message - message to append.
   * @throws if the message identity is already pending.
   */
  append(target, message) {
    this.splice(target, this.state[target].length, 0, [message]);
  }
  /**
   * Prepend one message to a pending list and durably record the insertion.
   * @param target - pending list to extend.
   * @param message - message to prepend.
   * @throws if the message identity is already pending.
   */
  prepend(target, message) {
    this.splice(target, 0, 0, [message]);
  }
  /**
   * Replace one pending message in place, possibly changing its identity. A
   * successful replacement publishes the old message as discarded and the new
   * message as inserted.
   * @param messageId - identity of the pending message to replace.
   * @param newMessage - replacement message.
   * @returns whether the message was still pending.
   * @throws if the replacement duplicates another pending message identity.
   */
  replace(messageId, newMessage) {
    const location = this.locate(messageId);
    if (location === void 0) return false;
    this.splice(location.target, location.index, 1, [newMessage]);
    return true;
  }
  /**
   * Remove one pending message and durably record its cancellation.
   * @param messageId - identity of the pending message to remove.
   * @returns whether the message was still pending.
   */
  remove(messageId) {
    const location = this.locate(messageId);
    if (location === void 0) return false;
    this.splice(location.target, location.index, 1, []);
    return true;
  }
  /**
   * Apply standard splice semantics and durably record the normalized result.
   * The durable event commits before the live projection mutates, so synchronous
   * `session/event` observers see the pre-splice lists and can reconstruct the
   * removed messages from the normalized coordinates.
   * @param target - pending list to mutate.
   * @param start - splice position.
   * @param deleteCount - maximum number of messages to remove.
   * @param inserted - messages to insert at the resolved position.
   * @returns messages removed by the splice.
   */
  splice(target, start, deleteCount, inserted) {
    return this.mutate(target, start, deleteCount, inserted, true);
  }
  /** Locate one pending identity across both owned lists. */
  locate(messageId) {
    for (const target of ["next-turn", "next-step"]) {
      const index = this.state[target].findIndex((message) => message.id === messageId);
      if (index >= 0) return { target, index };
    }
    return void 0;
  }
  /** Commit one normalized mutation and publish its live notifications. */
  mutate(target, start, deleteCount, inserted, discardRemoved) {
    const inbox = this.state[target];
    const truncatedStart = Math.trunc(start);
    const offset = Number.isNaN(truncatedStart) ? 0 : truncatedStart;
    const actualStart = offset < 0 ? Math.max(inbox.length + offset, 0) : Math.min(offset, inbox.length);
    const truncatedDeleteCount = Math.trunc(deleteCount);
    const actualDeleteCount = Math.min(
      Math.max(Number.isNaN(truncatedDeleteCount) ? 0 : truncatedDeleteCount, 0),
      inbox.length - actualStart
    );
    if (actualDeleteCount === 0 && inserted.length === 0) return [];
    const outcome = discardRemoved && actualDeleteCount > 0 ? "canceled" : void 0;
    const splice = {
      target,
      start: actualStart,
      ...actualDeleteCount === 0 ? {} : { removedCount: actualDeleteCount },
      inserted,
      ...outcome === void 0 ? {} : { outcome }
    };
    this.validate(splice);
    const event = this.session.append("agent/inbox/spliced", splice);
    const removed = inbox.splice(actualStart, actualDeleteCount, ...event.data.inserted);
    if (discardRemoved) {
      for (const message of removed) this.notifications.discarded(message);
    }
    for (const message of event.data.inserted) this.notifications.inserted(message);
    return removed;
  }
  /** Apply one normalized durable splice to the projection. */
  apply(splice) {
    this.validate(splice);
    const inbox = this.state[splice.target];
    return inbox.splice(splice.start, splice.removedCount ?? 0, ...splice.inserted);
  }
  /** Validate one normalized splice against the current projection. */
  validate(splice) {
    const inbox = this.state[splice.target];
    const removedCount = splice.removedCount ?? 0;
    if (!Number.isSafeInteger(splice.start) || splice.start < 0 || splice.start > inbox.length || !Number.isSafeInteger(removedCount) || removedCount < 0 || splice.start + removedCount > inbox.length) {
      throw new Error("invalid inbox splice");
    }
    const candidate = inbox.toSpliced(splice.start, removedCount, ...splice.inserted);
    const ids = /* @__PURE__ */ new Set();
    for (const message of splice.target === "next-turn" ? [...candidate, ...this.nextStep] : [...this.nextTurn, ...candidate]) {
      if (ids.has(message.id)) throw new Error(`message "${message.id}" is already pending`);
      ids.add(message.id);
    }
  }
};

// ../../source/deepseek-harness/packages/core/agent/src/dispatch.ts
function agentCarrier(agent) {
  return scopeTarget(agent, agent);
}
function agentEvents(ctx, agent, carrier = agentCarrier(agent)) {
  const fused = (payload) => (
    // The dispatcher owns the subject injection; callers pass PayloadRest, so
    // the fused record is exactly the declared payload. The spread comes
    // first, so a structurally acceptable payload that happens to carry an
    // `agent` field can never override the injected subject.
    { ...payload, agent }
  );
  return {
    emit(name15, payload) {
      const args = [carrier, name15, fused(payload)];
      const callbacks = ctx.events.dispatch("emit", args);
      for (const callback of callbacks) {
        try {
          const returned = callback(...args);
          void Promise.resolve(returned).catch((error) => {
            ctx.logger.warn(`agent event "${name15}" listener rejected: ${String(error)}`);
          });
        } catch (error) {
          ctx.logger.warn(`agent event "${name15}" listener threw: ${String(error)}`);
        }
      }
    },
    async serial(name15, payload) {
      const serial = ctx.serial;
      return await serial(carrier, name15, fused(payload));
    },
    waterfall(name15, payload, ...rest) {
      const waterfall = ctx.waterfall;
      return waterfall(carrier, name15, fused(payload), ...rest);
    }
  };
}
function emitAgentEvent(ctx, agent, name15, payload) {
  agentEvents(ctx, agent).emit(name15, payload);
}
function assembleContextFor(agent, signal) {
  return { agent, scope: agent, ...signal === void 0 ? {} : { signal } };
}

// ../../source/deepseek-harness/packages/core/agent/src/index.ts
var NO_FACTORY_MESSAGE = "no agent factory registered (load an agent-loop plugin)";
var NO_INITIATOR_MESSAGE = "no initiating agent is active";
var DISPOSED_INITIATOR_MESSAGE = "agent initiator scope is disposed";
var AgentRegistry = class extends Service {
  store = /* @__PURE__ */ new Map();
  factory;
  initiators = new AsyncLocalStorage();
  initiatorRuns = new AsyncLocalStorage();
  initiatorState = "active";
  activeInitiatorRuns = 0;
  initiatorDrain;
  initiatorDisposal;
  constructor(ctx) {
    super(ctx, "agents");
    ctx.inject(["typert"], (typeCtx) => {
      typeCtx.typert.lookups.register("agent", {
        parameter: "agent",
        wire: "agentId",
        hostTypeSymbol: "@deepseek-ai/dsh-agent#Agent",
        wireTypeSymbol: "@deepseek-ai/dsh-session/types#SessionId",
        resolve: (sessionId) => this.get(sessionId)
      });
      typeCtx.typert.contexts.registerHost("agent", {
        wire: "agentId",
        wireTypeSymbol: "@deepseek-ai/dsh-session/types#SessionId",
        resolve: (sessionId) => this.get(sessionId)?.ctx
      });
    });
    ctx.accessor("agent", { get: () => void 0 });
    ctx.on("internal/status", (fiber) => {
      if (fiber.state === 5 /* UNLOADING */ && this.hasLifecycleAncestor(fiber)) {
        this.closeInitiators();
      }
    });
    ctx.effect(function* () {
      yield () => this.disposeInitiators();
      yield () => {
        this.closeInitiators();
      };
    }.bind(this), "agents.initiatorLifecycle()");
  }
  /**
   * Read the Agent that initiated the inherited asynchronous driver chain.
   * Use this optional form for logging, tracing, metrics, or host attribution
   * that also supports agentless calls. When a parent creates a child, setup
   * reports the causal parent while `agentCtx.agent` identifies the child.
   * @returns the inherited Agent, or `undefined` outside an initiator boundary
   *   and inside an explicit clearing boundary.
   * @throws when this service instance has been disposed.
   */
  currentInitiator() {
    this.assertInitiatorsReadable();
    return this.initiators.getStore();
  }
  /**
   * Read the initiating Agent and fail when no initiator boundary is active.
   * Use this for private helpers contractually below a driver, or for a
   * deployment-owned outbound request whose contract forbids agentless calls.
   * Generic or direct-call paths use optional lookup or explicit request fields.
   * @returns the inherited Agent.
   * @throws when no initiator is active or this service instance has been disposed.
   */
  requireInitiator() {
    const agent = this.currentInitiator();
    if (agent === void 0) throw new Error(NO_INITIATOR_MESSAGE);
    return agent;
  }
  /**
   * Run an operation with one exact Agent as its process-local initiator. The
   * exact synchronous value or Promise returned by the operation is preserved.
   * Custom drivers and test harnesses wrap their complete returned foreground
   * lifetime.
   * A queue or wire receiver may establish this boundary only after validating
   * explicit identity and resolving the exact live Agent; this method does neither.
   * Detached work remains owned by the subsystem that starts it.
   * @param agent - initiating Agent to inherit; presence is neither liveness proof nor authorization.
   * @param operation - synchronous or asynchronous operation to invoke.
   * @returns the exact value returned by `operation`.
   * @throws when the initiator scope is closing/disposed, or when `operation` throws.
   */
  withInitiator(agent, operation) {
    return this.runWithInitiator(agent, operation);
  }
  /**
   * Run an operation inside a boundary that hides any inherited initiating
   * Agent. The exact synchronous value or Promise is preserved.
   * Use this while creating lazy shared timers, queue pumps, pool maintenance,
   * watchers, or exporters so they do not inherit the first Agent that happens
   * to initialize them. It clears only initiator attribution, not explicit
   * fields, and does not own or drain detached resources.
   * @param operation - synchronous or asynchronous operation to invoke without an initiator.
   * @returns the exact value returned by `operation`.
   * @throws when the initiator scope is closing/disposed, or when `operation` throws.
   */
  withoutInitiator(operation) {
    return this.runWithInitiator(void 0, operation);
  }
  /**
   * Register the agent-creation factory (the loop calls this on construction,
   * effect-scoped). A traced Cordis service is canonicalized to its concrete
   * target; each create/resume call is then traced through that caller's
   * context so ownership follows the caller without stacking proxy layers.
   * Throws if a factory is already registered. Returns the disposer; on
   * dispose the factory slot is cleared.
   * @param factory - the loop-owned factory {@link create}/{@link resume} delegate to.
   * @returns the disposer that clears the factory slot. The exact
   *   Cordis effect disposer (single-shot): composite (generator) effects may
   *   yield it directly — exact identity nests the teardown in order.
   */
  setFactory(factory) {
    const dispose = this.ctx.effect(() => {
      if (this.factory !== void 0) throw new Error("an agent factory is already registered");
      const target = factory[symbols.original] ?? factory;
      this.factory = { target };
      return () => {
        this.factory = void 0;
      };
    }, "agents.setFactory()");
    return dispose;
  }
  /** Return the active creation factory. */
  requireFactory() {
    if (this.factory === void 0) throw new Error(NO_FACTORY_MESSAGE);
    return this.factory;
  }
  /**
   * Create and publish a new agent through the registered factory.
   * Distinct from {@link register} (which records an already-constructed
   * agent): this constructs the agent and its session. Rejects if no factory is
   * registered or creation/setup fails. The resolved {@link AgentHandle} lets
   * the owner tear down exactly this agent.
   * @param options - shared identity, session seed/metadata, and agent options.
   * @returns the handle after setup, rollback-covered publication, and loop start complete.
   */
  async create(options) {
    const ownerCtx = this.ctx;
    const { target } = this.requireFactory();
    const receiver = getTraceable(ownerCtx, target);
    return Reflect.apply(target.createAgent, receiver, [ownerCtx, options]);
  }
  /**
   * Load a persisted session and resume an agent on it through the registered
   * factory. Rejects if no factory is registered; the factory rejects if
   * session persistence is not configured or persistence/setup fails.
   * @param options - persisted identity, configuration, and optional setup.
   * @returns the handle after setup, rollback-covered publication, and loop start complete.
   */
  async resume(options) {
    const ownerCtx = this.ctx;
    const { target } = this.requireFactory();
    const receiver = getTraceable(ownerCtx, target);
    return Reflect.apply(target.resume, receiver, [ownerCtx, options]);
  }
  /**
   * Register a live agent. Throws if an agent with the same id is already
   * registered. Emits `agent/created` on registration and `agent/disposed`
   * when the calling fiber is disposed — both with the agent's scope carrier
   * (`scopeTarget(agent, agent)`): the subject is the agent in hand, so the
   * emits are scope-filtered regardless of which context invoked `register`
   * (calling through `agent.ctx` scopes EFFECTS; dispatch scoping always
   * requires passing the carrier). Returns the disposer.
   * @param agent - the already-constructed agent to record in the store.
   * @returns the EXACT Cordis effect disposer (single-shot; a repeat call
   *   returns undefined without awaiting an in-flight teardown). Exact
   *   identity is load-bearing: a composite (generator) effect that owns a
   *   teardown ORDER — the agent factory's lifecycle chain — must yield THIS
   *   function so Cordis nests the unregistration at that yield position;
   *   yielding a wrapper would leave it disposing as a concurrent sibling on
   *   owner unload, unregistering the agent (and emitting `agent/disposed`)
   *   while its final turn is still draining.
   */
  register(agent) {
    const dispose = this.ctx.effect(function* () {
      yield this.enter(agent, this.ctx.agent);
      this.announce(agent);
    }.bind(this), "agents.register()");
    return dispose;
  }
  /**
   * Insert an already-constructed agent without announcing it. This is the
   * advanced ordered-lifecycle primitive used by the async agent factory: it
   * first completes setup while the agent is unpublished, then assigns the
   * returned detach closure into its pre-installed composite teardown before
   * calling {@link announce}. Ordinary callers use {@link register}.
   * @param agent - the prepared, unpublished agent.
   * @param owner - live agent whose scoped context created this agent, or
   *   undefined for a top-level runtime root. This is runtime ownership, not
   *   the resumed session's durable parent lineage.
   * @returns an idempotent closure that removes this exact entry and emits
   *   `agent/disposed` with listener failures contained. When called from a
   *   synchronous `agent/created` listener, removal and disposal wait until
   *   that creation dispatch unwinds.
   */
  enter(agent, owner) {
    const id = agent.id;
    if (id !== agent.session.id) {
      throw new Error(`agent id "${id}" does not match session id "${agent.session.id}"`);
    }
    const carrier = scopeTarget(agent, agent);
    if (this.store.has(id)) throw new Error(`agent "${id}" is already registered`);
    const entry = {
      id,
      agent,
      owner,
      carrier,
      announced: false,
      announcing: false,
      detachRequested: false
    };
    this.store.set(id, entry);
    let entered = true;
    const detach = () => {
      if (!entered) return;
      entered = false;
      if (entry.announcing) {
        entry.detachRequested = true;
        return;
      }
      this.detachEntered(entry);
    };
    return detach;
  }
  /** Remove one exact entered agent and emit its paired disposal when announced. */
  detachEntered(entry) {
    entry.detachRequested = false;
    if (this.store.get(entry.id) !== entry) return;
    this.store.delete(entry.id);
    if (!entry.announced) return;
    this.emitDisposed(entry);
  }
  /** Emit the paired disposal edge through the entry's stable carrier. */
  emitDisposed(entry) {
    const args = [entry.carrier, "agent/disposed", { agent: entry.agent }];
    for (const callback of this.ctx.events.dispatch("emit", args)) {
      try {
        const returned = callback(...args);
        void Promise.resolve(returned).catch((error) => {
          this.ctx.logger.warn(`agent "${entry.id}": agent/disposed listener rejected: ${String(error)}`);
        });
      } catch (error) {
        this.ctx.logger.warn(`agent "${entry.id}": agent/disposed listener threw: ${String(error)}`);
      }
    }
  }
  /**
   * Announce an agent previously inserted with {@link enter}.
   * @param agent - the live inserted agent to announce.
   * @throws if `agent` is not the exact live registry entry for its id, or its
   *   creation announcement already began (including a reentrant call from a
   *   creation listener).
   */
  announce(agent) {
    const entry = this.store.get(agent.id);
    if (entry === void 0 || entry.agent !== agent) {
      throw new Error(`agent "${agent.id}" is not live in this registry`);
    }
    if (entry.announced || entry.announcing) {
      throw new Error(`agent "${entry.id}" was already announced`);
    }
    entry.announcing = true;
    entry.announced = true;
    const args = [entry.carrier, "agent/created", { agent: entry.agent }];
    try {
      for (const callback of this.ctx.events.dispatch("emit", args)) {
        const returned = callback(...args);
        void Promise.resolve(returned).catch((error) => {
          this.ctx.logger.warn(`agent "${entry.id}": agent/created listener rejected: ${String(error)}`);
        });
      }
    } finally {
      entry.announcing = false;
      if (entry.detachRequested) this.detachEntered(entry);
    }
  }
  /**
   * Look up a live agent.
   * @param id - the shared agent/session id to look up.
   * @returns the agent, or undefined when no live agent has that id.
   */
  get(id) {
    return this.store.get(id)?.agent;
  }
  /**
   * Test whether a live agent was created through one exact parent agent's
   * scoped context. Runtime ownership is independent of durable session
   * lineage and remains unambiguous when unrelated providers reuse an id.
   * @param id - the candidate child agent's shared agent/session id.
   * @param owner - the expected runtime creator agent.
   * @returns true only while the exact child entry is live under that owner.
   */
  isOwnedBy(id, owner) {
    return this.store.get(id)?.owner === owner;
  }
  /**
   * All live agents, in registration order.
   * @returns a fresh array; mutating it does not affect the registry.
   */
  list() {
    return [...this.store.values()].map((entry) => entry.agent);
  }
  /**
   * All live top-level agents in registration order. A top-level agent was
   * created without an owning agent context; durable session lineage does not
   * affect this runtime relation, so a resumed fork may still be a root.
   * @returns a fresh array; mutating it does not affect the registry.
   */
  roots() {
    return [...this.store.values()].filter((entry) => entry.owner === void 0).map((entry) => entry.agent);
  }
  /** Reject new initiator boundaries while inherited continuations drain. */
  closeInitiators() {
    if (this.initiatorState === "active") this.initiatorState = "closing";
  }
  /** Wait for returned-Promise boundaries, then invalidate retained references. */
  disposeInitiators() {
    return this.initiatorDisposal ??= (async () => {
      this.closeInitiators();
      this.releaseReentrantInitiatorRuns();
      if (this.activeInitiatorRuns !== 0) {
        this.initiatorDrain ??= Promise.withResolvers();
        await this.initiatorDrain.promise;
      }
      this.initiatorState = "disposed";
      this.initiators.disable();
      this.initiatorRuns.disable();
    })();
  }
  /** Establish one tracked initiator or clearing boundary. */
  runWithInitiator(agent, operation) {
    if (this.initiatorState !== "active") throw new Error(DISPOSED_INITIATOR_MESSAGE);
    const run = {
      active: true,
      parent: this.initiatorRuns.getStore()
    };
    this.activeInitiatorRuns += 1;
    let result;
    try {
      result = this.initiatorRuns.run(run, () => this.initiators.run(agent, operation));
    } catch (error) {
      this.releaseInitiatorRun(run);
      throw error;
    }
    if (isPromise(result)) {
      try {
        void Promise.prototype.then.call(
          result,
          () => {
            this.releaseInitiatorRun(run);
          },
          () => {
            this.releaseInitiatorRun(run);
          }
        );
      } catch {
        this.releaseInitiatorRun(run);
      }
    } else {
      this.releaseInitiatorRun(run);
    }
    return result;
  }
  /** Whether one unloading fiber owns this service's lifecycle. */
  hasLifecycleAncestor(candidate) {
    let fiber = this.ctx.fiber;
    while (true) {
      if (fiber === candidate) return true;
      const parent = fiber.parent.fiber;
      if (parent === fiber) return false;
      fiber = parent;
    }
  }
  assertInitiatorsReadable() {
    if (this.initiatorState === "disposed") throw new Error(DISPOSED_INITIATOR_MESSAGE);
  }
  /** Exclude the boundary chain that initiated this teardown from its own drain. */
  releaseReentrantInitiatorRuns() {
    let run = this.initiatorRuns.getStore();
    while (run !== void 0) {
      this.releaseInitiatorRun(run);
      run = run.parent;
    }
  }
  releaseInitiatorRun(run) {
    if (!run.active) return;
    run.active = false;
    this.activeInitiatorRuns -= 1;
    if (this.activeInitiatorRuns !== 0) return;
    this.initiatorDrain?.resolve();
    this.initiatorDrain = void 0;
  }
};
var src_default9 = AgentRegistry;

// ../../source/deepseek-harness/packages/goal/goal/src/index.ts
import { randomUUID } from "node:crypto";
import { z as zod2 } from "zod";

// ../../source/deepseek-harness/packages/typert/protocol/src/index.ts
var TYPERT_REMOTE_SEGMENT_PATTERN = /^[A-Za-z0-9_$.-]+$/;
function isTypertRemoteSegment(value) {
  return value !== "." && value !== ".." && TYPERT_REMOTE_SEGMENT_PATTERN.test(value);
}
var markers = /* @__PURE__ */ new WeakMap();
function bindTypertRemote(service, serviceKey, options = {}) {
  validateName("service key", serviceKey);
  const namespace = options.namespace ?? serviceKey;
  validateName("namespace", namespace);
  return Object.freeze({ service, serviceKey, namespace });
}
var TypertRemoteService = class extends Service {
  /** Visible binding consumed by the Gateway's source-mode discovery. */
  typertRemote;
  /**
   * Register the Service and bind the same key to Typert Gateway.
   * @param ctx - owning Cordis Context.
   * @param serviceKey - exact Cordis service key and default wire namespace.
   * @param options - optional distinct wire namespace.
   */
  constructor(ctx, serviceKey, options = {}) {
    super(ctx, serviceKey);
    this.typertRemote = bindTypertRemote(this, this.name, options);
  }
};
function Remote(methodOrExportName, context) {
  if (typeof methodOrExportName === "string") {
    validateName("Remote export name", methodOrExportName);
    return function(_method, decoratorContext) {
      addMarkerInitializer(decoratorContext, { kind: "direct" }, methodOrExportName);
    };
  }
  if (context === void 0) throw new TypeError("typert-protocol: Remote decorator context is missing");
  addMarkerInitializer(context, { kind: "direct" });
}
function addMarkerInitializer(context, invocation, exportName) {
  if (context.private || context.static || typeof context.name !== "string") {
    throw new TypeError("typert-protocol: Remote decorators require a public instance method with a string name");
  }
  const method = context.name;
  context.addInitializer(function() {
    const prototype = Object.getPrototypeOf(this);
    if (prototype === null) {
      throw new TypeError(`typert-protocol: cannot mark Remote method "${method}" on an object without a prototype`);
    }
    mark(prototype, method, invocation, exportName);
  });
}
function mark(prototype, method, invocation, exportName) {
  let table = markers.get(prototype);
  if (table === void 0) {
    table = /* @__PURE__ */ new Map();
    markers.set(prototype, table);
  }
  const marker = {
    ...exportName === void 0 || exportName === method ? {} : { exportName },
    invocation: Object.freeze(invocation)
  };
  const current = table.get(method);
  if (current !== void 0) {
    if (current.exportName === marker.exportName && sameInvocation(current.invocation, invocation)) return;
    throw new Error(`typert-protocol: Remote method "${method}" has conflicting invocation markers`);
  }
  table.set(method, Object.freeze(marker));
}
function sameInvocation(left, right) {
  return left.kind === right.kind && (left.kind === "direct" || right.kind === "context" && left.context === right.context);
}
function validateName(subject, value) {
  if (!isTypertRemoteSegment(value)) {
    throw new TypeError(`typert-protocol: ${subject} must contain only RPC endpoint segment characters`);
  }
}

// ../../source/deepseek-harness/packages/goal/goal/src/runtime.ts
var GOAL_CHANGE_VERSION = 1;
function GoalId(id) {
  return id;
}
var GoalError = class extends HarnessError {
  /**
   * @param message - human-readable rejection reason.
   * @param code - stable machine-routable classification.
   */
  // Keep the constructor to narrow HarnessError's string code at this boundary.
  // oxlint-disable-next-line typescript/no-useless-constructor -- type-only narrowing
  constructor(message, code) {
    super(message, code);
  }
};

// ../../source/deepseek-harness/packages/goal/goal/src/fold.ts
var SNAPSHOT_OPERATIONS = /* @__PURE__ */ new Set([
  "create",
  "edit",
  "pause",
  "resume",
  "complete",
  "block"
]);
var PHASES = /* @__PURE__ */ new Set(["active", "paused", "blocked", "complete"]);
function emptyGoalFoldState() {
  return {
    goal: void 0,
    roundsStarted: 0,
    createdAt: void 0,
    updatedAt: void 0,
    lastRef: void 0,
    seenGoalIds: /* @__PURE__ */ new Set()
  };
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function positiveInteger(value, field) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`goal change ${field} must be a positive safe integer`);
  }
  return value;
}
function nonNegativeInteger(value, field) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`goal change ${field} must be a non-negative safe integer`);
  }
  return value;
}
function decodeBlockReason(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "code,message") {
    throw new Error("goal change goal.blockedReason must have exactly code and message fields");
  }
  if (typeof value["code"] !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value["code"])) {
    throw new Error("goal change goal.blockedReason.code must be lower-kebab-case");
  }
  if (typeof value["message"] !== "string" || value["message"].trim().length === 0 || value["message"] !== value["message"].trim()) {
    throw new Error("goal change goal.blockedReason.message must be non-empty and normalized");
  }
  return { code: value["code"], message: value["message"] };
}
function decodeSnapshot(value) {
  if (!isRecord(value)) throw new Error("goal change goal must be a record");
  if (typeof value["id"] !== "string" || value["id"].length === 0) {
    throw new Error("goal change goal.id must be a non-empty string");
  }
  if (typeof value["objective"] !== "string" || value["objective"].trim().length === 0 || value["objective"] !== value["objective"].trim()) {
    throw new Error("goal change goal.objective must be non-empty and normalized");
  }
  if (typeof value["phase"] !== "string" || !PHASES.has(value["phase"])) {
    throw new Error("goal change goal.phase is invalid");
  }
  const phase = value["phase"];
  const expectedKeys = phase === "blocked" ? "blockedReason,id,maxGoalRounds,objective,phase,revision" : "id,maxGoalRounds,objective,phase,revision";
  if (Object.keys(value).sort().join(",") !== expectedKeys) {
    throw new Error(`goal change goal for phase ${phase} must have exactly ${expectedKeys} fields`);
  }
  return {
    id: GoalId(value["id"]),
    revision: positiveInteger(value["revision"], "goal.revision"),
    objective: value["objective"],
    phase,
    maxGoalRounds: positiveInteger(value["maxGoalRounds"], "goal.maxGoalRounds"),
    ...phase === "blocked" ? { blockedReason: decodeBlockReason(value["blockedReason"]) } : {}
  };
}
function decodeRef(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "id,revision") {
    throw new Error("goal clear tombstone must have exactly id and revision fields");
  }
  if (typeof value["id"] !== "string" || value["id"].length === 0) {
    throw new Error("goal clear tombstone id must be a non-empty string");
  }
  return { id: GoalId(value["id"]), revision: positiveInteger(value["revision"], "cleared.revision") };
}
function decodeGoalChange(value) {
  if (!isRecord(value) || value["kind"] !== "goal/change") return void 0;
  if (value["version"] !== GOAL_CHANGE_VERSION) {
    throw new Error(`unsupported goal change version ${String(value["version"])}`);
  }
  if (value["operation"] === "clear") {
    const allowed2 = ["cleared", "clearedAt", "kind", "operation", "version"];
    if (Object.keys(value).sort().join(",") !== allowed2.sort().join(",")) {
      throw new Error(`goal clear change must have exactly ${allowed2.sort().join(",")} fields`);
    }
    return {
      kind: "goal/change",
      version: GOAL_CHANGE_VERSION,
      operation: "clear",
      cleared: decodeRef(value["cleared"]),
      clearedAt: nonNegativeInteger(value["clearedAt"], "clearedAt")
    };
  }
  if (typeof value["operation"] !== "string" || !SNAPSHOT_OPERATIONS.has(value["operation"])) {
    throw new Error("goal change operation is invalid");
  }
  const allowed = ["createdAt", "goal", "kind", "operation", "roundsStarted", "updatedAt", "version"];
  if (Object.keys(value).sort().join(",") !== allowed.sort().join(",")) {
    throw new Error(`goal snapshot change must have exactly ${allowed.sort().join(",")} fields`);
  }
  const createdAt = nonNegativeInteger(value["createdAt"], "createdAt");
  const updatedAt = nonNegativeInteger(value["updatedAt"], "updatedAt");
  if (updatedAt < createdAt) throw new Error("goal change updatedAt cannot precede createdAt");
  return {
    kind: "goal/change",
    version: GOAL_CHANGE_VERSION,
    operation: value["operation"],
    goal: decodeSnapshot(value["goal"]),
    roundsStarted: nonNegativeInteger(value["roundsStarted"], "roundsStarted"),
    createdAt,
    updatedAt
  };
}
function goalSource(source) {
  if (source.kind !== "goal") return void 0;
  if (typeof source.goalId !== "string" || source.goalId.length === 0 || !Number.isSafeInteger(source.revision) || source.revision < 1 || !Number.isSafeInteger(source.round) || source.round < 1) {
    throw new Error("goal message source is invalid");
  }
  return source;
}
function requireSameDefinition(current, next, operation) {
  if (next.objective !== current.objective || next.maxGoalRounds !== current.maxGoalRounds) {
    throw new Error(`goal ${operation} cannot change objective or maxGoalRounds`);
  }
}
function requireNextRevision(current, next, operation) {
  if (next.id !== current.id || next.revision !== current.revision + 1) {
    throw new Error(`goal ${operation} must advance the current goal by one revision`);
  }
}
function validateSnapshotTransition(state, change, current) {
  const next = change.goal;
  requireNextRevision(current, next, change.operation);
  if (state.updatedAt === void 0) throw new Error("current goal fold lacks updatedAt");
  if (change.createdAt !== state.createdAt || change.updatedAt < state.updatedAt || change.roundsStarted !== state.roundsStarted) {
    throw new Error(`goal ${change.operation} does not preserve the current counters and timestamps`);
  }
  switch (change.operation) {
    case "edit":
      if (next.phase !== current.phase || JSON.stringify(next.blockedReason) !== JSON.stringify(current.blockedReason)) {
        throw new Error("goal edit cannot change phase or blocked reason");
      }
      break;
    case "pause":
      requireSameDefinition(current, next, change.operation);
      if (current.phase !== "active" || next.phase !== "paused") throw new Error("goal pause has an invalid phase transition");
      break;
    case "resume": {
      requireSameDefinition(current, next, change.operation);
      const resumable = /* @__PURE__ */ new Set([
        "active",
        "paused",
        "blocked"
      ]);
      if (!resumable.has(current.phase) || next.phase !== "active" || state.roundsStarted >= next.maxGoalRounds) {
        throw new Error("goal resume has an invalid phase transition or exhausted round budget");
      }
      break;
    }
    case "complete":
      requireSameDefinition(current, next, change.operation);
      if (current.phase === "complete" || next.phase !== "complete") throw new Error("goal complete has an invalid phase transition");
      break;
    case "block":
      requireSameDefinition(current, next, change.operation);
      if (current.phase !== "active" || next.phase !== "blocked") throw new Error("goal block has an invalid phase transition");
      break;
    /* v8 ignore start -- the caller excludes create and GoalOperation is closed; these arms retain fail-loud exhaustiveness */
    case "create":
      throw new Error("goal create cannot be validated as a current-goal transition");
    default:
      change.operation;
      throw new Error("unknown goal snapshot operation");
  }
}
function goalChangeRef(change) {
  return change.operation === "clear" ? change.cleared : { id: change.goal.id, revision: change.goal.revision };
}
function applyGoalChange(state, change) {
  const ref = goalChangeRef(change);
  if (change.operation === "clear") {
    const current = state.goal;
    if (current === void 0) throw new Error("goal clear requires a current goal");
    requireNextRevision(current, change.cleared, change.operation);
    if (state.updatedAt === void 0) throw new Error("current goal fold lacks updatedAt");
    if (change.clearedAt < state.updatedAt) {
      throw new Error("goal clear timestamp cannot precede the current goal update");
    }
    state.goal = void 0;
    state.roundsStarted = 0;
    state.createdAt = void 0;
    state.updatedAt = void 0;
    state.lastRef = ref;
    return;
  }
  if (change.operation === "create") {
    if (change.goal.revision !== 1 || change.goal.phase !== "active" || change.roundsStarted !== 0 || state.goal !== void 0 && state.goal.phase !== "complete" || state.seenGoalIds.has(change.goal.id)) {
      throw new Error("goal create requires a fresh active revision-one goal with zero rounds");
    }
    state.seenGoalIds.add(change.goal.id);
  } else {
    const current = state.goal;
    if (current === void 0) throw new Error(`goal ${change.operation} requires a current goal`);
    validateSnapshotTransition(state, change, current);
  }
  state.goal = change.goal;
  state.roundsStarted = change.roundsStarted;
  state.createdAt = change.createdAt;
  state.updatedAt = change.updatedAt;
  state.lastRef = ref;
}
function applyGoalEvent(state, event) {
  if (event.type === "goal/change") {
    const change = decodeGoalChange(event.data);
    if (change === void 0) throw new Error(`goal change at session event ${event.seq} has an invalid kind`);
    applyGoalChange(state, change);
    return;
  }
  if (event.type === "user/message") {
    const source = goalSource(event.data.source);
    if (source === void 0) return;
    const current = state.goal;
    if (current === void 0 || current.phase !== "active" || source.goalId !== current.id || source.revision !== current.revision || source.round !== state.roundsStarted + 1 || source.round > current.maxGoalRounds) {
      throw new Error(`goal round at session event ${event.seq} is not the next admitted round of the active goal`);
    }
    state.roundsStarted = source.round;
  }
}

// ../../source/deepseek-harness/packages/goal/goal/src/index.ts
var goalProjectionSchema = zod2.union([
  zod2.object({
    goal: zod2.object({
      id: zod2.string().min(1),
      revision: zod2.number().int().positive(),
      objective: zod2.string().min(1),
      phase: zod2.union([zod2.literal("active"), zod2.literal("paused"), zod2.literal("blocked"), zod2.literal("complete")]),
      blockedReason: zod2.object({ code: zod2.string(), message: zod2.string() }).optional(),
      maxGoalRounds: zod2.number().int().positive()
    }),
    roundsStarted: zod2.number().int().nonnegative(),
    createdAt: zod2.number(),
    updatedAt: zod2.number()
  }),
  zod2.null()
]);
function applyGoalProjection(state, event) {
  if (event.type !== "goal/change") return state;
  let change;
  try {
    change = decodeGoalChange(event.data);
  } catch (_invalidPersistedGoalChange) {
    return state;
  }
  if (change === void 0) return state;
  return change.operation === "clear" ? null : {
    goal: change.goal,
    roundsStarted: change.roundsStarted,
    createdAt: change.createdAt,
    updatedAt: change.updatedAt
  };
}
function resolveMaxGoalRounds(value) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new GoalError("maxGoalRounds must be a positive safe integer", "GOAL_INVALID_MAX_ROUNDS");
  }
  return value;
}
function resolveObjective(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GoalError("goal objective must be a non-empty string", "GOAL_INVALID_OBJECTIVE");
  }
  return value.trim();
}
function resolveCreateGoal(request, defaultMaxGoalRounds) {
  return {
    objective: resolveObjective(request.objective),
    maxGoalRounds: resolveMaxGoalRounds(request.maxGoalRounds ?? defaultMaxGoalRounds)
  };
}
function resolveBlockReason(reason) {
  const record = typeof reason === "object" && reason !== null && !Array.isArray(reason) ? reason : void 0;
  const code = record?.["code"];
  const message = record?.["message"];
  if (typeof code !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(code) || typeof message !== "string" || message.trim().length === 0) {
    throw new GoalError(
      "goal block reason requires a lower-kebab-case code and a non-empty message",
      "GOAL_INVALID_BLOCK_REASON"
    );
  }
  return { code, message: message.trim() };
}
var _remoteExportCreate_dec, _clear_dec, _complete_dec, _resume_dec, _pause_dec, _edit_dec, _a, _init;
var GoalService = class extends (_a = TypertRemoteService, _edit_dec = [Remote("edit")], _pause_dec = [Remote("pause")], _resume_dec = [Remote("resume")], _complete_dec = [Remote("complete")], _clear_dec = [Remote("clear")], _remoteExportCreate_dec = [Remote("create")], _a) {
  constructor(ctx, config = {}) {
    super(ctx, "goals");
    __runInitializers(_init, 5, this);
    __publicField(this, "resolved");
    __publicField(this, "caches", /* @__PURE__ */ new WeakMap());
    this.resolved = {
      defaultMaxGoalRounds: resolveMaxGoalRounds(config.defaultMaxGoalRounds ?? 256)
    };
    ctx.on("agent/session-start", ({ agent }) => {
      this.cache(agent.session).activation = "disarmed";
    });
    ctx.inject(["sessionProjections"], (projectionCtx) => {
      projectionCtx.sessionProjections.register({
        key: "goal",
        schema: goalProjectionSchema,
        init: () => null,
        apply: applyGoalProjection,
        view: (state) => state,
        stateVersion: 4
      });
    });
  }
  /**
   * Read the current goal for one exact live agent.
   * @param agent - owning live agent.
   * @returns a fresh view or `undefined` when no goal is current.
   * @throws {@link GoalError} when the agent is not the registry's live instance.
   */
  get(agent) {
    this.assertLive(agent);
    const cache = this.cache(agent.session);
    this.sync(agent.session, cache);
    return this.view(cache);
  }
  /**
   * Remove process-local continuation authority without changing durable goal
   * phase or revision. Lifecycle owners use this before unloading a driver;
   * a later human-authorized {@link resume} records the new activation edge.
   * @param agent - owning live agent.
   * @returns a fresh disarmed view, or `undefined` when no goal is current.
   */
  disarm(agent) {
    this.assertLive(agent);
    const cache = this.cache(agent.session);
    this.sync(agent.session, cache);
    cache.activation = "disarmed";
    return this.view(cache);
  }
  /**
   * Create and arm a goal. A completed goal may be replaced; every other
   * current phase must be cleared or resumed instead.
   * @param agent - owning live agent.
   * @param request - objective and optional round cap.
   * @returns the created live view.
   */
  create(agent, request) {
    const spec = resolveCreateGoal(request, this.resolved.defaultMaxGoalRounds);
    const cache = this.prepareMutation(agent);
    const current = cache.state.goal;
    if (current !== void 0 && current.phase !== "complete") {
      throw new GoalError(`goal "${current.id}" already exists with phase "${current.phase}"`, "GOAL_ALREADY_EXISTS");
    }
    const now = Date.now();
    const goal = {
      id: GoalId(`goal-${randomUUID()}`),
      revision: 1,
      objective: spec.objective,
      phase: "active",
      maxGoalRounds: spec.maxGoalRounds
    };
    return this.commitSnapshot(agent, cache, "create", goal, 0, now, now, "armed");
  }
  edit(agent, ref, request) {
    const cache = this.prepareMutation(agent);
    const current = this.expectCurrent(cache, ref);
    if (request.objective === void 0 && request.maxGoalRounds === void 0) {
      throw new GoalError("goal edit requires objective and/or maxGoalRounds", "GOAL_INVALID_EDIT");
    }
    const goal = {
      ...current,
      revision: current.revision + 1,
      ...request.objective === void 0 ? {} : { objective: resolveObjective(request.objective) },
      ...request.maxGoalRounds === void 0 ? {} : { maxGoalRounds: resolveMaxGoalRounds(request.maxGoalRounds) }
    };
    return this.commitCurrent(agent, cache, "edit", goal, cache.activation);
  }
  pause(agent, ref) {
    return this.transition(agent, ref, "pause", ["active"], "paused", "disarmed");
  }
  resume(agent, ref) {
    const cache = this.prepareMutation(agent);
    const current = this.expectCurrent(cache, ref);
    const resumable = ["active", "paused", "blocked"];
    if (!resumable.includes(current.phase)) {
      throw this.transitionError(current, "resume", resumable);
    }
    if (current.phase === "active" && cache.activation === "armed") {
      throw new GoalError(`goal "${current.id}" is already active and armed`, "GOAL_INVALID_TRANSITION");
    }
    if (cache.state.roundsStarted >= current.maxGoalRounds) {
      throw new GoalError(
        `goal "${current.id}" exhausted ${current.maxGoalRounds} goal rounds; increase maxGoalRounds before resuming`,
        "GOAL_INVALID_TRANSITION"
      );
    }
    return this.commitCurrent(agent, cache, "resume", this.withPhase(current, "active"), "armed");
  }
  complete(agent, ref) {
    return this.transition(
      agent,
      ref,
      "complete",
      ["active", "paused", "blocked"],
      "complete",
      "disarmed"
    );
  }
  /**
   * Mark an active goal blocked and disarm it.
   * @param agent - owning live agent.
   * @param ref - expected current revision.
   * @param reason - policy-owned stable code and human-readable explanation.
   * @returns the blocked view with its durable reason.
   */
  block(agent, ref, reason) {
    const cache = this.prepareMutation(agent);
    const current = this.expectCurrent(cache, ref);
    if (current.phase !== "active") {
      throw this.transitionError(current, "block", ["active"]);
    }
    return this.commitCurrent(
      agent,
      cache,
      "block",
      { ...this.withPhase(current, "blocked"), blockedReason: resolveBlockReason(reason) },
      "disarmed"
    );
  }
  clear(agent, ref) {
    const cache = this.prepareMutation(agent);
    const current = this.expectCurrent(cache, ref);
    const tombstone = { id: current.id, revision: current.revision + 1 };
    const change = {
      kind: "goal/change",
      version: GOAL_CHANGE_VERSION,
      operation: "clear",
      cleared: tombstone,
      clearedAt: this.nextMutationTime(cache)
    };
    this.commit(agent, cache, change, "disarmed");
    return { ...tombstone };
  }
  /** Resolve and validate the cache used by a mutation. */
  prepareMutation(agent) {
    this.assertLive(agent);
    const cache = this.cache(agent.session);
    this.sync(agent.session, cache);
    return cache;
  }
  /** Reject stale or missing current-state refs. */
  expectCurrent(cache, ref) {
    const current = cache.state.goal;
    if (current === void 0) throw new GoalError("no current goal", "GOAL_NOT_FOUND");
    if (ref.id !== current.id || ref.revision !== current.revision) {
      throw new GoalError(
        `stale goal ref "${ref.id}" revision ${ref.revision}; current is "${current.id}" revision ${current.revision}`,
        "GOAL_STALE_REVISION"
      );
    }
    return current;
  }
  /** Enforce exact live-agent identity rather than trusting a matching id. */
  assertLive(agent) {
    if (this.ctx.agents.get(agent.id) !== agent) {
      throw new GoalError(`agent "${agent.id}" is not live in this registry`, "GOAL_AGENT_NOT_LIVE");
    }
  }
  /** Return the per-session cache, folding a seed once with activation disarmed. */
  cache(session) {
    let cache = this.caches.get(session);
    if (cache !== void 0) return cache;
    const state = emptyGoalFoldState();
    for (const event of session.events) applyGoalEvent(state, event);
    cache = {
      state,
      activation: "disarmed",
      observedSeq: session.seq,
      pendingActivation: void 0
    };
    this.caches.set(session, cache);
    return cache;
  }
  /** Incrementally observe durable events and reconcile local activation intent. */
  sync(session, cache) {
    for (const event of session.events.slice(cache.observedSeq)) {
      applyGoalEvent(cache.state, event);
      if (event.type === "goal/change") {
        cache.activation = cache.pendingActivation?.seq === event.seq ? cache.pendingActivation.activation : "disarmed";
      }
      cache.observedSeq += 1;
    }
  }
  /** Build a new revision with one replacement phase. */
  withPhase(current, phase) {
    return {
      id: current.id,
      revision: current.revision + 1,
      objective: current.objective,
      phase,
      maxGoalRounds: current.maxGoalRounds
    };
  }
  /** Shared validated phase transition. */
  transition(agent, ref, operation, allowed, phase, activation) {
    const cache = this.prepareMutation(agent);
    const current = this.expectCurrent(cache, ref);
    if (!allowed.includes(current.phase)) throw this.transitionError(current, operation, allowed);
    return this.commitCurrent(agent, cache, operation, this.withPhase(current, phase), activation);
  }
  /** Render a stable invalid-transition error. */
  transitionError(current, operation, allowed) {
    return new GoalError(
      `cannot ${operation} goal "${current.id}" from phase "${current.phase}"; expected ${allowed.join(" or ")}`,
      "GOAL_INVALID_TRANSITION"
    );
  }
  /** Commit a mutation that retains the current goal's derived counters/times. */
  commitCurrent(agent, cache, operation, goal, activation) {
    const createdAt = cache.state.createdAt;
    if (createdAt === void 0) throw new Error("current goal cache lacks createdAt");
    return this.commitSnapshot(
      agent,
      cache,
      operation,
      goal,
      cache.state.roundsStarted,
      createdAt,
      this.nextMutationTime(cache),
      activation
    );
  }
  /** Clamp a current goal's next timestamp across backward wall-clock movement. */
  nextMutationTime(cache) {
    const updatedAt = cache.state.updatedAt;
    if (updatedAt === void 0) throw new Error("current goal cache lacks updatedAt");
    return Math.max(Date.now(), updatedAt);
  }
  /** Build and commit one full-snapshot mutation. */
  commitSnapshot(agent, cache, operation, goal, roundsStarted, createdAt, updatedAt, activation) {
    const change = {
      kind: "goal/change",
      version: GOAL_CHANGE_VERSION,
      operation,
      goal,
      roundsStarted,
      createdAt,
      updatedAt
    };
    this.commit(agent, cache, change, activation);
    const view = this.view(cache);
    if (view === void 0) throw new Error("snapshot commit cleared the goal unexpectedly");
    return view;
  }
  /** Commit one mutation into the goal log, cache, and live event stream. */
  commit(agent, cache, change, activation) {
    const ref = goalChangeRef(change);
    cache.pendingActivation = { seq: agent.session.seq, activation };
    try {
      agent.session.append("goal/change", change);
      this.sync(agent.session, cache);
    } finally {
      cache.pendingActivation = void 0;
    }
    const goal = this.view(cache);
    const notification = {
      operation: change.operation,
      ref: { ...ref },
      ...goal === void 0 ? {} : { goal }
    };
    agentEvents(this.ctx, agent).emit("goal/changed", { change: notification });
  }
  /** Build a detached current view. */
  view(cache) {
    const goal = cache.state.goal;
    const createdAt = cache.state.createdAt;
    const updatedAt = cache.state.updatedAt;
    if (goal === void 0) return void 0;
    if (createdAt === void 0 || updatedAt === void 0) {
      throw new Error(`goal "${goal.id}" cache lacks timestamps`);
    }
    return {
      ...goal,
      roundsStarted: cache.state.roundsStarted,
      createdAt,
      updatedAt,
      activation: cache.activation
    };
  }
  remoteExportCreate(agent, request) {
    const view = this.create(agent, request);
    return { ref: { id: view.id, revision: view.revision } };
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "edit", _edit_dec, GoalService);
__decorateElement(_init, 1, "pause", _pause_dec, GoalService);
__decorateElement(_init, 1, "resume", _resume_dec, GoalService);
__decorateElement(_init, 1, "complete", _complete_dec, GoalService);
__decorateElement(_init, 1, "clear", _clear_dec, GoalService);
__decorateElement(_init, 1, "remoteExportCreate", _remoteExportCreate_dec, GoalService);
__decoratorMetadata(_init, GoalService);
__publicField(GoalService, "inject", ["agents"]);
__publicField(GoalService, "Config", src_default2.object({
  defaultMaxGoalRounds: src_default2.number().default(256)
}));
var src_default10 = GoalService;

// ../../source/deepseek-harness/packages/goal/goal-round-driver/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  apply: () => apply2,
  inject: () => inject2,
  name: () => name2,
  renderGoalRoundPrompt: () => renderGoalRoundPrompt
});
import { isDeepStrictEqual } from "node:util";

// ../../source/deepseek-harness/packages/goal/goal-round-driver/src/prompt.ts
function renderGoalRoundPrompt(goal, round) {
  return [{
    type: "text",
    text: `<goal_round>
Objective: ${JSON.stringify(goal.objective)}
Round: ${round}/${goal.maxGoalRounds}

Continue working toward the objective in this same session. Treat the current workspace, tool results, and durable session state as authoritative; inspect them instead of assuming earlier narration is still current. Make concrete progress and verify the result. Before claiming completion, gather evidence that the whole objective is achieved, read the current goal, and mark it complete. If work remains, leave the goal active for the next round. Follow the configured goal-tool policy before reporting a blocker.
</goal_round>`
  }];
}

// ../../source/deepseek-harness/packages/goal/goal-round-driver/src/index.ts
var name2 = "goal-round-driver";
var inject2 = ["agents", "goals", "sessions"];
function isGoalRoundSource(source) {
  return source.kind === "goal" && source.round > 0;
}
function sameRound(source, round) {
  return source.goalId === round.goalId && source.revision === round.revision && source.round === round.round;
}
function sameQueued(content, source, attempt) {
  return isGoalRoundSource(source) && sameRound(source, attempt) && isDeepStrictEqual(content, attempt.content);
}
function goalRef(goal) {
  return { id: goal.id, revision: goal.revision };
}
function renderThrown(value) {
  return value instanceof Error ? value.message : String(value);
}
function apply2(ctx) {
  const states = /* @__PURE__ */ new Map();
  function stateFor(agent) {
    const existing = states.get(agent);
    if (existing !== void 0) return existing;
    const state = {
      agent,
      attempt: void 0,
      competingQueued: false,
      needsCheckpoint: false,
      requested: false,
      run: void 0,
      stopping: false
    };
    states.set(agent, state);
    return state;
  }
  function currentGoal(state) {
    if (ctx.agents.get(state.agent.id) !== state.agent) return void 0;
    return ctx.goals.get(state.agent);
  }
  function readyToDrive(state) {
    return ctx.fiber.state === 2 /* ACTIVE */ && !state.stopping && ctx.agents.get(state.agent.id) === state.agent && state.agent.status === "idle" && !state.competingQueued;
  }
  function readyAfterCheckpoint(state) {
    return readyToDrive(state) && !state.needsCheckpoint;
  }
  function disarm(state) {
    try {
      const goal = currentGoal(state);
      if (goal?.activation === "armed") ctx.goals.disarm(state.agent);
    } catch (error) {
      ctx.logger.warn(`goal-round-driver: could not disarm agent "${state.agent.id}": ${renderThrown(error)}`);
    }
  }
  function restoreOtherClaimed(agent, messages, messageId) {
    const retained = messages.filter((message) => message.id !== messageId && !(message.source.kind === "goal" && message.source.round === 0));
    for (const message of retained.toReversed()) {
      if (agent.inbox.nextStep.some((candidate) => candidate.id === message.id) || agent.inbox.nextTurn.some((candidate) => candidate.id === message.id)) continue;
      agent.inbox.prepend("next-step", message);
    }
  }
  async function drive(state) {
    const { agent } = state;
    if (!readyToDrive(state)) return;
    if (state.needsCheckpoint) {
      state.needsCheckpoint = false;
      try {
        await ctx.sessions.flush(agent.session);
      } catch (error) {
        ctx.logger.warn(`goal-round-driver: durability checkpoint failed for agent "${agent.id}": ${renderThrown(error)}`);
        disarm(state);
        return;
      }
      if (!readyAfterCheckpoint(state)) return;
    }
    const attempt = state.attempt;
    if (attempt !== void 0) {
      state.attempt = void 0;
      state.needsCheckpoint = true;
      state.requested = true;
      return;
    }
    const goal = currentGoal(state);
    if (goal === void 0 || goal.phase !== "active" || goal.activation !== "armed") return;
    if (goal.roundsStarted >= goal.maxGoalRounds) {
      ctx.goals.block(agent, goalRef(goal), {
        code: "round-limit",
        message: `Goal reached its configured limit of ${goal.maxGoalRounds} rounds.`
      });
      return;
    }
    const round = goal.roundsStarted + 1;
    const content = renderGoalRoundPrompt(goal, round);
    const message = createUserMessage({
      content,
      source: { kind: "goal", goalId: goal.id, revision: goal.revision, round }
    });
    const reservation = {
      goalId: goal.id,
      revision: goal.revision,
      round,
      messageId: message.id,
      content,
      phase: "queued",
      cancelled: false,
      stale: false
    };
    state.attempt = reservation;
    try {
      agent.followup(message);
    } catch (error) {
      state.attempt = void 0;
      ctx.logger.warn(`goal-round-driver: could not queue round ${round} for agent "${agent.id}": ${renderThrown(error)}`);
      const latest = currentGoal(state);
      if (latest !== void 0 && latest.id === goal.id && latest.revision === goal.revision && latest.phase === "active" && latest.activation === "armed") {
        ctx.goals.block(agent, goalRef(latest), {
          code: "queue-failed",
          message: `Could not queue goal round ${round}: ${renderThrown(error)}`
        });
      }
    }
  }
  function requestDrive(state) {
    if (state.stopping) return;
    state.requested = true;
    if (state.run !== void 0) return;
    let run;
    try {
      run = ctx.agents.withoutInitiator(async () => {
        while (state.requested && !state.stopping) {
          state.requested = false;
          try {
            await drive(state);
          } catch (error) {
            ctx.logger.warn(`goal-round-driver: driver failed for agent "${state.agent.id}": ${renderThrown(error)}`);
            disarm(state);
          }
        }
      });
    } catch (error) {
      ctx.logger.warn(`goal-round-driver: could not start driver for agent "${state.agent.id}": ${renderThrown(error)}`);
      disarm(state);
      return;
    }
    state.run = run;
    const retire = () => {
      state.run = void 0;
      if (state.requested && !state.stopping) requestDrive(state);
    };
    void run.then(retire, (error) => {
      ctx.logger.warn(`goal-round-driver: driver task rejected for agent "${state.agent.id}": ${renderThrown(error)}`);
      disarm(state);
      retire();
    });
  }
  ctx.effect(function* () {
    ctx.on("agent/error", ({ agent }) => {
      const state = stateFor(agent);
      disarm(state);
    });
    ctx.on("agent/created", ({ agent }) => {
      stateFor(agent);
    });
    ctx.on("agent/disposed", ({ agent }) => {
      states.delete(agent);
    });
    ctx.on("agent/session-start", ({ agent }) => {
      const state = stateFor(agent);
      state.attempt = void 0;
      state.competingQueued = false;
      state.needsCheckpoint = false;
    });
    ctx.on("agent/status", ({ agent, status }) => {
      const state = stateFor(agent);
      if (status === "idle") {
        state.competingQueued = false;
        const attempt = state.attempt;
        const goal = currentGoal(state);
        if ((attempt?.phase === "queued" || attempt?.phase === "claimed" || attempt?.cancelled) && goal?.phase === "active" && goal.activation === "armed") {
          state.attempt = void 0;
          try {
            ctx.goals.pause(agent, goalRef(goal));
          } catch (error) {
            ctx.logger.warn(`goal-round-driver: could not pause cancelled goal for agent "${agent.id}": ${renderThrown(error)}`);
            disarm(state);
          }
        }
        requestDrive(state);
      }
    });
    ctx.on("goal/changed", ({ agent }) => {
      const state = stateFor(agent);
      state.needsCheckpoint = true;
      requestDrive(state);
    });
    ctx.on("agent/inbox/inserted", ({ agent, message }) => {
      if (!agent.inbox.nextTurn.some((candidate) => candidate.id === message.id)) return;
      const state = stateFor(agent);
      const attempt = state.attempt;
      if (attempt !== void 0 && sameQueued(message.content, message.source, attempt)) return;
      state.competingQueued = true;
      if (attempt?.phase === "queued") attempt.stale = true;
    });
    ctx.on("agent/inbox/claimed", ({ agent, message }) => {
      const state = stateFor(agent);
      const attempt = state.attempt;
      if (attempt !== void 0 && sameQueued(message.content, message.source, attempt)) {
        attempt.phase = "claimed";
      }
    });
    ctx.on("agent/inbox/discarded", ({ agent, message }) => {
      const state = stateFor(agent);
      const attempt = state.attempt;
      if (attempt !== void 0 && sameQueued(message.content, message.source, attempt)) {
        attempt.cancelled = true;
      }
    });
    ctx.on("session/event", (session, event) => {
      const agent = ctx.agents.get(session.id);
      if (agent === void 0 || agent.session !== session) return;
      const state = stateFor(agent);
      switch (event.type) {
        case "user/message":
          if (state.attempt !== void 0 && event.data.id === state.attempt.messageId) {
            state.attempt.phase = "admitted";
          }
          return;
        case "turn/end":
          if (event.data.reason.kind === "max-tokens") {
            disarm(state);
            return;
          }
          if (event.data.reason.kind !== "aborted") return;
          if (state.attempt?.phase === "claimed" || state.attempt?.phase === "admitted") {
            state.attempt.cancelled = true;
          } else disarm(state);
          return;
        default:
          return;
      }
    });
    function validReservation(state, content, source) {
      const attempt = state.attempt;
      const goal = currentGoal(state);
      return ctx.fiber.state === 2 /* ACTIVE */ && !state.stopping && attempt !== void 0 && attempt.phase === "claimed" && !attempt.stale && sameQueued(content, source, attempt) && goal !== void 0 && goal.id === source.goalId && goal.revision === source.revision && goal.phase === "active" && goal.activation === "armed" && source.round === goal.roundsStarted + 1;
    }
    ctx.on("agent/pre-step", async ({ agent, messages, signal }, next) => {
      const submitted = messages.find((message) => isGoalRoundSource(message.source));
      if (submitted === void 0) return next();
      const { content, source } = submitted;
      const state = stateFor(agent);
      let valid = false;
      try {
        valid = validReservation(state, content, source);
      } catch (error) {
        ctx.logger.warn(`goal-round-driver: pre-step check failed for agent "${agent.id}": ${renderThrown(error)}`);
        disarm(state);
      }
      if (!valid) {
        const attempt = state.attempt;
        if (attempt !== void 0 && sameRound(source, attempt)) {
          attempt.stale = true;
          state.attempt = void 0;
        }
        restoreOtherClaimed(agent, messages, submitted.id);
        requestDrive(state);
        return { kind: "reject" };
      }
      let decision;
      try {
        decision = await next();
      } catch (error) {
        if (signal.aborted) throw error;
        state.attempt = void 0;
        requestDrive(state);
        throw error;
      }
      if (signal.aborted) {
        if (decision.kind === "enter") restoreOtherClaimed(agent, decision.messages, submitted.id);
        return decision;
      }
      if (decision.kind === "reject") {
        state.attempt = void 0;
        const goal = currentGoal(state);
        if (goal !== void 0 && goal.id === source.goalId && goal.revision === source.revision && goal.phase === "active" && goal.activation === "armed") {
          ctx.goals.block(agent, goalRef(goal), {
            code: "prompt-rejected",
            message: "Goal round was rejected before entering its step."
          });
        }
        return decision;
      }
      try {
        valid = validReservation(state, content, source);
      } catch (error) {
        ctx.logger.warn(`goal-round-driver: post-decision check failed for agent "${agent.id}": ${renderThrown(error)}`);
        disarm(state);
        valid = false;
      }
      if (!valid) {
        state.attempt = void 0;
        restoreOtherClaimed(agent, decision.messages, submitted.id);
        requestDrive(state);
        return { kind: "reject" };
      }
      return decision;
    });
    for (const agent of ctx.agents.list()) {
      const state = stateFor(agent);
      disarm(state);
    }
    yield async () => {
      const waits = [];
      for (const state of states.values()) {
        state.stopping = true;
        disarm(state);
        const attempt = state.attempt;
        if (attempt !== void 0) {
          attempt.stale = true;
          if (state.agent.status === "running") {
            state.agent.cancel({ kind: "parent" });
            waits.push(state.agent.whenIdle());
          }
        }
        if (state.run !== void 0) waits.push(state.run);
      }
      await Promise.allSettled(waits);
      states.clear();
    };
  }, "goal-round-driver lifecycle");
}

// ../../source/deepseek-harness/packages/goal/tool-goal/src/index.ts
var src_exports3 = {};
__export(src_exports3, {
  Config: () => Config2,
  apply: () => apply3,
  inject: () => inject3,
  name: () => name3
});

// ../../source/deepseek-harness/packages/goal/tool-goal/src/authority.ts
function reject(message, code = "GOAL_TOOL_AUTHORITY_REQUIRED") {
  throw new HarnessError(message, code);
}
function openTurn(agent) {
  const events = agent.session.events;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const boundary = events[index];
    if (boundary?.type === "turn/end") {
      reject("goal tools require an open model turn", "GOAL_TOOL_DRIVER_REQUIRED");
    }
    if (boundary?.type === "turn/start") {
      return { start: boundary, events: events.slice(index + 1) };
    }
  }
  return reject("goal tools require an open model turn", "GOAL_TOOL_DRIVER_REQUIRED");
}
function goalToolExecution(ctx, exec) {
  const agent = exec.agent;
  if (agent === void 0) {
    return reject("goal tools require a calling agent", "GOAL_TOOL_AGENT_REQUIRED");
  }
  if (ctx.agents.get(agent.id) !== agent || agent.status !== "running" || ctx.agents.currentInitiator() !== agent) {
    return reject(
      "goal tools require the exact live calling agent inside its active driver",
      "GOAL_TOOL_DRIVER_REQUIRED"
    );
  }
  return { agent, ...openTurn(agent) };
}
function hasDirectHumanInput(ctx, execution) {
  if (!ctx.agents.roots().includes(execution.agent)) return false;
  return execution.events.some((event) => event.type === "user/message" && event.data.source.kind === "user");
}
function isMatchingGoalRound(execution, goal) {
  return execution.events.some((event) => event.type === "user/message" && event.data.source.kind === "goal" && event.data.source.goalId === goal.id && event.data.source.revision === goal.revision && event.data.source.round === goal.roundsStarted);
}
function requireDirectHuman(ctx, execution) {
  if (hasDirectHumanInput(ctx, execution)) return;
  reject("this goal operation requires a direct human turn on a top-level agent");
}
function completionAuthority(ctx, execution) {
  if (hasDirectHumanInput(ctx, execution)) return { kind: "direct-human" };
  const goal = ctx.goals.get(execution.agent);
  if (goal !== void 0 && isMatchingGoalRound(execution, goal)) {
    return { kind: "goal-round", goal };
  }
  return reject("complete and blocked require a direct human turn or the current goal round");
}

// ../../source/deepseek-harness/packages/goal/tool-goal/src/wrapup.ts
var GROUNDING = "Report only what earlier rounds and tool results in this session actually establish; when a detail is not in the session, say so instead of inventing it. ";
function renderWrapupContext(objective, blockedReason) {
  const heading = `Objective: ${JSON.stringify(objective)}
`;
  const text = blockedReason === void 0 ? "<goal_complete>\n" + heading + "The goal is marked complete and this autonomous run is ending. Write the closing message to the user now: state the outcome, summarize what was done and how it was verified, and point to the concrete results (files, commits, or other artifacts). " + GROUNDING + "Note anything the user should review or do next. Address the user directly. Do not call any more tools in this run; further work waits for the user's next instruction.\n</goal_complete>" : "<goal_blocked>\n" + heading + `Blocked: ${JSON.stringify(blockedReason)}
The goal is marked blocked and this autonomous run is ending. Write the closing message to the user now: state what has been completed so far, describe the concrete blocking condition and what you tried, and say exactly what you need from the user to continue. ` + GROUNDING + "Address the user directly. Do not call any more tools in this run; further work waits for the user's next instruction.\n</goal_blocked>";
  return [{ type: "text", text }];
}

// ../../source/deepseek-harness/packages/goal/tool-goal/src/index.ts
var name3 = "tool-goal";
var inject3 = ["agents", "goals", "tools", "systemPrompt"];
var Config2 = src_default2.object({
  blockedAfterConsecutiveRounds: src_default2.number().step(1).min(1).default(3)
});
var UPDATE_ACTIONS = ["edit", "pause", "resume", "complete", "blocked"];
var CREATE_DESCRIPTION = 'Create one persisted same-session completion goal when the current direct human request is a long-running objective that should continue across autonomous goal rounds. You may infer that intent without requiring the user to say "create a goal". Do not use this for trivial single-turn work. Execution rejects non-human and subagent authority.';
var GET_DESCRIPTION = "Read the current same-session goal, including its exact id/revision, objective, phase, completed continuation rounds, round limit, blocker reason when present, and whether another continuation is armed. Call this before updating a goal.";
var GOAL_VALUE_SCHEMA = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      properties: {
        goal: { type: "null", required: true }
      }
    },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        goal: {
          type: "object",
          additionalProperties: false,
          required: true,
          properties: {
            id: { type: "string", required: true },
            revision: { type: "integer", required: true },
            objective: { type: "string", required: true },
            phase: { type: "string", required: true, enum: ["active", "paused", "blocked", "complete"] },
            roundsStarted: { type: "integer", required: true },
            maxGoalRounds: { type: "integer", required: true },
            blockedReason: {
              type: "object",
              additionalProperties: false,
              properties: {
                code: { type: "string", required: true },
                message: { type: "string", required: true }
              }
            }
          }
        },
        activation: { type: "string", required: true, enum: ["armed", "disarmed"] }
      }
    }
  ]
};
function guidance(blockedAfter) {
  return `Use goal tools for one long-running completion objective in the current session. create_goal may infer goal intent from a direct human request in any language; do not create a goal for routine single-turn work. Call get_goal before update_goal and copy its exact goal_id and revision. After session resume or fork, an active goal is disarmed: when a human asks to continue or resume in any wording or language, use update_goal action resume to rearm it. Mark complete only when the objective is actually achieved. Mark blocked only after the same blocking condition persists for at least ${blockedAfter} consecutive goal rounds, and report that concrete condition in blocked_reason; difficulty, uncertainty, or useful remaining work is not blocked.`;
}
function resolveConfig2(config) {
  const blockedAfter = config.blockedAfterConsecutiveRounds ?? 3;
  if (!Number.isSafeInteger(blockedAfter) || blockedAfter < 1) {
    throw new TypeError("blockedAfterConsecutiveRounds must be a positive safe integer");
  }
  return { blockedAfterConsecutiveRounds: blockedAfter };
}
function hasText(value) {
  return value !== void 0 && value !== "";
}
function hasRoundCap(value) {
  return value !== void 0 && value !== 0;
}
function goalRef2(goalId, revision) {
  if (goalId.length === 0 || goalId !== goalId.trim() || !Number.isSafeInteger(revision) || revision < 1) {
    throw new HarnessError(
      "goal_id must be non-empty and revision must be a positive safe integer",
      "GOAL_TOOL_INVALID_UPDATE"
    );
  }
  return { id: GoalId(goalId), revision };
}
function goalValue(goal) {
  if (goal === void 0) return { goal: null };
  return {
    goal: {
      id: goal.id,
      revision: goal.revision,
      objective: goal.objective,
      phase: goal.phase,
      roundsStarted: goal.roundsStarted,
      maxGoalRounds: goal.maxGoalRounds,
      ...goal.blockedReason === void 0 ? {} : {
        blockedReason: { code: goal.blockedReason.code, message: goal.blockedReason.message }
      }
    },
    activation: goal.activation
  };
}
var GOAL_OUTPUT = {
  schema: GOAL_VALUE_SCHEMA,
  render: (_args, value) => [{ type: "text", text: JSON.stringify(value) }]
};
function present(title, kind, rawInput) {
  return { card: "generic", title, kind, ...rawInput === void 0 ? {} : { rawInput } };
}
function apply3(ctx, config) {
  const resolved = resolveConfig2(config);
  ctx.systemPrompt.section({
    name: "tool:goal",
    order: 114,
    text: guidance(resolved.blockedAfterConsecutiveRounds)
  });
  ctx.tools.register(defineTool({
    name: "get_goal",
    description: GET_DESCRIPTION,
    parameters: {},
    output: GOAL_OUTPUT,
    execute(_args, exec) {
      const execution = goalToolExecution(ctx, exec);
      return Promise.resolve(goalValue(ctx.goals.get(execution.agent)));
    },
    presentCall: () => present("Read current goal", "read")
  }));
  ctx.tools.register(defineTool({
    name: "create_goal",
    description: CREATE_DESCRIPTION,
    parameters: {
      objective: {
        type: "string",
        required: true,
        description: "The concrete completion objective inferred from the direct human request."
      },
      max_goal_rounds: {
        type: "number",
        description: "Optional positive safe-integer limit on automatic continuation rounds."
      }
    },
    output: GOAL_OUTPUT,
    execute(args, exec) {
      const execution = goalToolExecution(ctx, exec);
      requireDirectHuman(ctx, execution);
      const goal = ctx.goals.create(execution.agent, {
        objective: args.objective,
        ...args.max_goal_rounds === void 0 ? {} : { maxGoalRounds: args.max_goal_rounds }
      });
      return Promise.resolve(goalValue(goal));
    },
    presentCall: (args) => present("Create goal", "other", args.objective)
  }));
  ctx.tools.register(defineTool({
    name: "update_goal",
    description: "Update the exact current goal revision. edit, pause, and resume require a direct top-level human request. During an automatic continuation of the current goal, complete and blocked are also allowed. blocked is rejected before the configured minimum round count; the model remains responsible for judging that the same condition persisted across those rounds and must explain it in blocked_reason.",
    parameters: {
      goal_id: { type: "string", required: true, description: "Exact id returned by get_goal." },
      revision: { type: "number", required: true, description: "Exact positive revision returned by get_goal." },
      action: {
        type: "string",
        required: true,
        enum: UPDATE_ACTIONS,
        description: "edit | pause | resume | complete | blocked"
      },
      objective: { type: "string", description: "Replacement objective; valid only with action edit." },
      max_goal_rounds: { type: "number", description: "Replacement cap; valid only with action edit." },
      blocked_reason: {
        type: "string",
        description: "Concrete blocking condition; required only with action blocked."
      }
    },
    output: GOAL_OUTPUT,
    execute(args, exec) {
      const execution = goalToolExecution(ctx, exec);
      const ref = goalRef2(args.goal_id, args.revision);
      const replacements = {
        ...hasText(args.objective) ? { objective: args.objective } : {},
        ...hasRoundCap(args.max_goal_rounds) ? { maxGoalRounds: args.max_goal_rounds } : {}
      };
      if (args.action === "edit") {
        requireDirectHuman(ctx, execution);
        if (hasText(args.blocked_reason)) {
          throw new HarnessError("blocked_reason is valid only with action blocked", "GOAL_TOOL_INVALID_UPDATE");
        }
        const goal2 = ctx.goals.edit(execution.agent, ref, replacements);
        return Promise.resolve(goalValue(goal2));
      }
      if (args.action === "pause" || args.action === "resume") {
        requireDirectHuman(ctx, execution);
        if (hasText(args.objective) || hasRoundCap(args.max_goal_rounds) || hasText(args.blocked_reason)) {
          throw new HarnessError(
            "objective and max_goal_rounds are valid only with action edit; blocked_reason is valid only with action blocked",
            "GOAL_TOOL_INVALID_UPDATE"
          );
        }
        const goal2 = args.action === "pause" ? ctx.goals.pause(execution.agent, ref) : ctx.goals.resume(execution.agent, ref);
        return Promise.resolve(goalValue(goal2));
      }
      const authority = completionAuthority(ctx, execution);
      if (hasText(args.objective) || hasRoundCap(args.max_goal_rounds)) {
        throw new HarnessError(
          "objective and max_goal_rounds are valid only with action edit",
          "GOAL_TOOL_INVALID_UPDATE"
        );
      }
      if (args.action === "complete" && hasText(args.blocked_reason)) {
        throw new HarnessError("blocked_reason is valid only with action blocked", "GOAL_TOOL_INVALID_UPDATE");
      }
      if (args.action === "blocked" && (args.blocked_reason === void 0 || args.blocked_reason.trim().length === 0)) {
        throw new HarnessError("blocked_reason is required with action blocked", "GOAL_TOOL_INVALID_UPDATE");
      }
      if (args.action === "blocked" && authority.kind === "goal-round" && authority.goal.roundsStarted < resolved.blockedAfterConsecutiveRounds) {
        throw new HarnessError(
          `blocked requires at least ${resolved.blockedAfterConsecutiveRounds} consecutive goal rounds; current round is ${authority.goal.roundsStarted}`,
          "GOAL_TOOL_BLOCK_THRESHOLD"
        );
      }
      const goal = args.action === "complete" ? ctx.goals.complete(execution.agent, ref) : ctx.goals.block(execution.agent, ref, {
        code: "model-reported",
        message: args.blocked_reason
      });
      if (authority.kind === "goal-round") {
        exec.deferContext(createUserMessage({
          content: args.action === "complete" ? renderWrapupContext(goal.objective) : renderWrapupContext(goal.objective, args.blocked_reason),
          source: {
            kind: "plugin",
            plugin: "tool-goal",
            form: "notice",
            summary: boundContextSummary(`${args.action}: ${goal.objective}`)
          }
        }));
      }
      return Promise.resolve(goalValue(goal));
    },
    presentCall: (args) => present(
      `${args.action === "blocked" ? "Mark" : args.action.charAt(0).toUpperCase() + args.action.slice(1)} goal`,
      "other",
      hasText(args.blocked_reason) ? args.blocked_reason : hasText(args.objective) ? args.objective : hasRoundCap(args.max_goal_rounds) ? args.max_goal_rounds : args.goal_id
    )
  }));
}

// ../../source/deepseek-harness/packages/jobs/jobs/src/brand.ts
function JobId(id) {
  return id;
}

// ../../source/deepseek-harness/packages/jobs/jobs/src/index.ts
var JobRegistry = class _JobRegistry extends Service {
  constructor(ctx) {
    if (new.target === _JobRegistry) {
      throw new Error("@deepseek-ai/dsh-jobs is the abstract job registry seam; load an implementation such as @deepseek-ai/dsh-jobs-local instead");
    }
    super(ctx, "jobs");
  }
};

// ../../source/deepseek-harness/packages/jobs/jobs-local/src/index.ts
var TASK_WAIT_TIMEOUT = "TASK_WAIT_TIMEOUT";
var DEFAULT_MAX_CONCURRENT_TASKS_PER_OWNER = 10;
function isTerminal(status) {
  return status === "completed" || status === "killed" || status === "failed";
}
var JobLayer = class {
  controllers = new AnonymousEntries();
  listeners = new AnonymousEntries();
  changed = new AnonymousEntries();
  isEmpty() {
    return this.controllers.isEmpty() && this.listeners.isEmpty() && this.changed.isEmpty();
  }
};
var LocalJobRegistry = class extends JobRegistry {
  static Config = src_default2.object({
    maxConcurrentJobsPerOwner: src_default2.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_CONCURRENT_TASKS_PER_OWNER)
  });
  /** Schemastery-defaulted active-job limit. */
  maxConcurrentJobsPerOwner;
  store = /* @__PURE__ */ new Map();
  counters = /* @__PURE__ */ new Map();
  /**
   * Surfaces and listeners layered by the scope that registered them, in the
   * tools-registry shape: a contribution files into its registering context's
   * scope, and a read unions the global layer with the reader's scope chain.
   *
   * The registry is one process-wide instance serving every composition, so a
   * flat table would answer a per-owner question process-wide: one preset's
   * job controls would hold `start()` open for an agent whose own composition
   * loads none, and one settlement would reach every preset's notice listener.
   * Layers make both reads owner-relative. Nothing derives a cache from a
   * layer, so change notification is a no-op.
   */
  layers = new ScopedLayers(() => new JobLayer(), () => {
  });
  listenersClosed = false;
  /** Owner agents with attached scope cleanup, mapped to the exact disposer. */
  ownerCleanups = /* @__PURE__ */ new Map();
  /** Service context used by detached settlement continuations and teardown. */
  selfCtx;
  constructor(ctx, config) {
    super(ctx);
    this.maxConcurrentJobsPerOwner = config.maxConcurrentJobsPerOwner;
    this.selfCtx = ctx;
    ctx.effect(() => () => this.disposeAll(), "jobs teardown");
  }
  start(spec) {
    if (!this.servesOwner(spec.owner)) {
      throw new Error("background jobs unavailable: no job controller serves this agent (load @deepseek-ai/dsh-tool-jobs in its composition)");
    }
    if (spec.kind.length === 0) throw new Error("invalid job kind: expected a non-empty string");
    if (spec.label.length === 0) throw new Error("invalid job label: expected a non-empty string");
    if (spec.outputLimitBytes !== void 0 && (!Number.isSafeInteger(spec.outputLimitBytes) || spec.outputLimitBytes <= 0)) {
      throw new Error(`invalid outputLimitBytes: expected a positive safe integer, got ${JSON.stringify(spec.outputLimitBytes)}`);
    }
    if (spec.owner !== void 0) this.ensureOwnerCleanup(spec.owner);
    const active = this.activeTaskCount(spec.owner);
    if (active >= this.maxConcurrentJobsPerOwner) {
      throw new Error(
        `background job limit reached for this owner (limit: ${this.maxConcurrentJobsPerOwner}); use job_kill to stop an unneeded job, wait for it to finish, then retry`
      );
    }
    const hooks = spec.run();
    const count = (this.counters.get(spec.kind) ?? 0) + 1;
    this.counters.set(spec.kind, count);
    const id = JobId(`${spec.kind}-${count}`);
    let markSettled;
    const settled = new Promise((resolve5) => {
      markSettled = resolve5;
    });
    const job = {
      id,
      kind: spec.kind,
      label: spec.label,
      outputLimitBytes: spec.outputLimitBytes,
      owner: spec.owner,
      cancel: hooks.cancel.bind(hooks),
      readOutput: hooks.readOutput?.bind(hooks),
      status: "running",
      detail: void 0,
      output: void 0,
      startedAt: Date.now(),
      finishedAt: void 0,
      reported: false,
      settled,
      markSettled,
      waiters: 0,
      waitResolvers: /* @__PURE__ */ new Set()
    };
    this.store.set(id, job);
    void hooks.done.then(
      (outcome) => {
        this.settle(job, outcome);
      },
      (error) => {
        this.selfCtx.logger.warn(`jobs: job ${job.id} producer done promise rejected (producer contract violation): ${String(error)}`);
        this.settle(job, { status: "failed", detail: String(error) });
      }
    );
    this.notifyChanged(job.owner);
    return id;
  }
  list(caller) {
    const session = caller?.id;
    return [...this.store.values()].filter((job) => job.owner === void 0 || job.owner.id === session).map((job) => this.snapshot(job));
  }
  get(id, caller) {
    const job = this.expect(id);
    this.assertAccess(job, caller);
    return this.snapshot(job);
  }
  read(id, caller) {
    const job = this.expect(id);
    this.assertAccess(job, caller);
    const text = job.readOutput !== void 0 ? job.readOutput() : isTerminal(job.status) ? job.output ?? "" : "";
    if (isTerminal(job.status)) job.reported = true;
    return { text, snapshot: this.snapshot(job) };
  }
  kill(id, caller, reason) {
    const job = this.expect(id);
    this.assertAccess(job, caller);
    if (isTerminal(job.status)) {
      job.reported = true;
      return "already-finished";
    }
    job.cancel(reason);
    job.status = "stopping";
    job.reported = true;
    this.notifyChanged(job.owner);
    return "requested";
  }
  async wait(id, timeoutMs, caller, signal) {
    const job = this.expect(id);
    this.assertAccess(job, caller);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error(`invalid wait timeout: expected a positive number of milliseconds, got ${JSON.stringify(timeoutMs)}`);
    }
    if (!isTerminal(job.status)) {
      if (signal?.aborted) throw new Error("wait aborted");
      job.waiters += 1;
      let counted = true;
      const uncount = () => {
        if (!counted) return;
        counted = false;
        job.waiters -= 1;
      };
      try {
        var _stack = [];
        try {
          const d = __using(_stack, deadline(signal, timeoutMs, TASK_WAIT_TIMEOUT));
          await new Promise((resolve5, reject2) => {
            const onSettled = () => {
              job.waitResolvers.delete(onSettled);
              d.signal.removeEventListener("abort", onAbort);
              resolve5();
            };
            const onAbort = () => {
              job.waitResolvers.delete(onSettled);
              if (timeoutOf(d.signal, TASK_WAIT_TIMEOUT) !== void 0) {
                resolve5();
              } else {
                uncount();
                reject2(new Error("wait aborted"));
              }
            };
            job.waitResolvers.add(onSettled);
            d.signal.addEventListener("abort", onAbort, { once: true });
          });
        } catch (_) {
          var _error = _, _hasError = true;
        } finally {
          __callDispose(_stack, _error, _hasError);
        }
      } finally {
        uncount();
      }
    }
    if (isTerminal(job.status)) job.reported = true;
    return this.snapshot(job);
  }
  onJobDone(listener) {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.listeners.append(listener),
      { label: "jobs.onJobDone()" }
    );
  }
  onJobsChanged(listener) {
    return this.layers.effect(
      this.ctx,
      (layer) => layer.changed.append(listener),
      { label: "jobs.onJobsChanged()" }
    );
  }
  attachController(name15) {
    const token = Symbol(name15);
    return this.layers.effect(
      this.ctx,
      (layer) => layer.controllers.append(token),
      { label: "jobs.attachController()" }
    );
  }
  /**
   * Whether an attached job controller can collect and stop work owned by
   * `owner`. The global layer holds every controller attached from an unscoped
   * context — a host composition's own controls — and therefore serves every
   * owner; a scoped controller serves exactly the agents composed under it.
   * @param owner - the job's owner, or undefined for unowned work.
   * @returns whether some reachable controller serves the owner.
   */
  servesOwner(owner) {
    if (!this.layers.global.controllers.isEmpty()) return true;
    return this.layers.chainLayers(owner === void 0 ? void 0 : scopeOf(owner.ctx)).some((layer) => !layer.controllers.isEmpty());
  }
  /** Count authoritative active records for one exact owner or the shared unowned bucket. */
  activeTaskCount(owner) {
    let count = 0;
    for (const job of this.store.values()) {
      if (job.owner === owner && (job.status === "running" || job.status === "stopping")) count += 1;
    }
    return count;
  }
  /**
   * The completion listeners that own `owner`'s notices: the global layer's
   * first, then each scoped layer along the owner's chain. A listener outside
   * that chain belongs to another composition and must not deliver, or the
   * owner reads one notice per mounted preset.
   * @param owner - the settled job's owner, or undefined for unowned work.
   * @returns the listeners to notify, in registration order per layer.
   */
  *listenersFor(owner) {
    yield* this.layers.global.listeners.values();
    const scope2 = owner === void 0 ? void 0 : scopeOf(owner.ctx);
    for (const layer of this.layers.chainLayers(scope2)) yield* layer.listeners.values();
  }
  /** Look up a job or fail loud. */
  expect(id) {
    const job = this.store.get(id);
    if (job === void 0) throw new Error(`unknown job ${id}`);
    return job;
  }
  /**
   * The isolation fence: a job with an owner is reachable only by callers
   * whose session id matches (`!== undefined` semantics — an unowned job is
   * open, and a no-agent caller can never match an owned one).
   */
  assertAccess(job, caller) {
    if (job.owner !== void 0 && job.owner.id !== caller?.id) {
      throw new Error(`job ${job.id} belongs to another session`);
    }
  }
  /** Project a fresh read-only snapshot from the mutable record. */
  snapshot(job) {
    const ownerSession = job.owner?.id;
    return {
      id: job.id,
      kind: job.kind,
      label: job.label,
      ...job.outputLimitBytes !== void 0 ? { outputLimitBytes: job.outputLimitBytes } : {},
      ...ownerSession !== void 0 ? { ownerSession } : {},
      status: job.status,
      ...job.detail !== void 0 ? { detail: job.detail } : {},
      startedAt: job.startedAt,
      ...job.finishedAt !== void 0 ? { finishedAt: job.finishedAt } : {},
      reported: job.reported
    };
  }
  /**
   * The change observers that own `owner`'s updates, resolved exactly like
   * {@link listenersFor}: the global layer — a host composition's own carrier,
   * which serves every owner — then each scoped layer along the owner's chain.
   * An observer outside that chain belongs to another composition and would
   * otherwise be told about agents it does not compose.
   * @param owner - the owner whose visible set moved, or undefined for unowned work.
   * @returns the observers to notify, in registration order per layer.
   */
  *changedFor(owner) {
    yield* this.layers.global.changed.values();
    const scope2 = owner === void 0 ? void 0 : scopeOf(owner.ctx);
    for (const layer of this.layers.chainLayers(scope2)) yield* layer.changed.values();
  }
  /**
   * Announce that one owner's visible set changed. Each listener is contained
   * so an observer cannot break a lifecycle commit that already happened.
   */
  notifyChanged(owner) {
    for (const listener of this.changedFor(owner)) {
      try {
        listener(owner);
      } catch (error) {
        this.selfCtx.logger.warn(`jobs: onJobsChanged listener threw: ${String(error)}`);
      }
    }
  }
  /**
   * Record the first terminal outcome, release waiters, then announce
   * completion. First-wins preserves a teardown force-failure against late
   * producer settlement. Pending waits mark the job reported before listeners
   * run. Completion is announced last because a reporter may open a model turn
   * synchronously: every other observer of this settlement must already have
   * seen the committed record.
   */
  settle(job, outcome) {
    if (isTerminal(job.status)) return;
    job.status = outcome.status;
    job.detail = outcome.detail;
    job.output = outcome.output;
    job.finishedAt = Date.now();
    if (job.waiters > 0) job.reported = true;
    const snapshot = this.snapshot(job);
    const waitResolvers = [...job.waitResolvers];
    job.waitResolvers.clear();
    for (const resolveWait of waitResolvers) resolveWait();
    job.markSettled();
    this.notifyChanged(job.owner);
    if (this.listenersClosed) return;
    for (const listener of this.listenersFor(job.owner)) {
      try {
        const returned = listener(snapshot, job.owner);
        void Promise.resolve(returned).catch((error) => {
          this.selfCtx.logger.warn(`jobs: onJobDone listener rejected for ${job.id}: ${String(error)}`);
        });
      } catch (error) {
        this.selfCtx.logger.warn(`jobs: onJobDone listener threw for ${job.id}: ${String(error)}`);
      }
    }
  }
  /**
   * Attach one awaited cleanup through the exact owner's scope. This survives
   * producer reloads and joins agent quiescence; the retained disposer lets
   * service teardown detach the cross-fiber effect. Fails when the registry is
   * absent or the owner is not its currently registered instance.
   */
  ensureOwnerCleanup(owner) {
    const ownerId = owner.id;
    const agents = this.selfCtx.get("agents");
    if (agents === void 0) {
      throw new Error("background job ownership requires the agent registry (load @deepseek-ai/dsh-agent)");
    }
    if (agents.get(ownerId) !== owner) {
      throw new Error(`agent "${ownerId}" is not the registered agent instance (background job owner must be live)`);
    }
    if (this.ownerCleanups.has(owner)) return;
    const detach = owner.ctx.effect(() => async () => {
      this.ownerCleanups.delete(owner);
      await this.disposeOwned(owner);
    }, "jobs.ownerCleanup()");
    this.ownerCleanups.set(owner, detach);
  }
  /** Cancel, await terminal records, and drop every job owned by one exact agent lifecycle. */
  async disposeOwned(owner) {
    const owned = [...this.store.values()].filter((job) => job.owner === owner);
    this.cancelForTeardown(owned, "owner disposed");
    await Promise.all(owned.map((job) => job.settled));
    for (const job of owned) this.store.delete(job.id);
    if (owned.length > 0) this.notifyChanged(owner);
  }
  /**
   * Close listeners, cancel live jobs, await settlement, and detach owner
   * effects. Throwing cancels are force-failed to avoid teardown deadlock.
   */
  async disposeAll() {
    this.listenersClosed = true;
    const all = [...this.store.values()];
    this.cancelForTeardown(all, "jobs service disposed");
    await Promise.all(all.map((job) => job.settled));
    const emptied = new Set(all.map((job) => job.owner));
    this.store.clear();
    for (const owner of emptied) this.notifyChanged(owner);
    const ownerCleanups = [...this.ownerCleanups.values()];
    this.ownerCleanups.clear();
    await Promise.all(ownerCleanups.map((cleanup) => Promise.resolve(cleanup())));
  }
  /**
   * Cancel jobs during teardown with per-job containment. A throwing cancel
   * force-fails the record and reports a possible orphan; a cancel that returns
   * without settling remains indistinguishable from a slow stop and may stall.
   */
  cancelForTeardown(jobs, reason) {
    for (const job of jobs) {
      if (isTerminal(job.status)) continue;
      job.reported = true;
      try {
        job.cancel(reason);
        job.status = "stopping";
        this.notifyChanged(job.owner);
      } catch (error) {
        const detail = `cancel threw during teardown; work may be orphaned: ${String(error)}`;
        this.selfCtx.logger.warn(`jobs: cancel of ${job.id} threw during teardown; job record forced failed and work may be orphaned: ${String(error)}`);
        this.settle(job, { status: "failed", detail });
      }
    }
  }
};
var src_default11 = LocalJobRegistry;

// ../../source/deepseek-harness/packages/runtime-diagnostics/invariants/src/index.ts
var InvariantError = class extends Error {
  /** Stable machine-readable invariant failure code. */
  code = "INVARIANT";
  /** Full npm package name that owns the violated invariant. */
  packageName;
  /**
   * Construct a package-attributed invariant failure.
   * @param packageName - full npm package name that registered the check.
   * @param message - violated contract, without the standard error prefix.
   */
  constructor(packageName, message) {
    super(`invariant violated by "${packageName}": ${message}`);
    this.name = "InvariantError";
    this.packageName = packageName;
  }
};
function compilePatterns(field, values) {
  const seen = /* @__PURE__ */ new Set();
  return values.map((value) => {
    if (value.length === 0 || value.trim() !== value) {
      throw new Error(`invariants: ${field} entries must be non-blank and have no surrounding whitespace`);
    }
    if (seen.has(value)) {
      throw new Error(`invariants: ${field} contains duplicate regex ${JSON.stringify(value)}`);
    }
    seen.add(value);
    try {
      return new RegExp(value);
    } catch (cause) {
      throw new Error(`invariants: ${field} contains invalid regex ${JSON.stringify(value)}`, { cause });
    }
  });
}
var InvariantRegistry = class extends Service {
  static Config = src_default2.object({
    enabled: src_default2.boolean().default(true),
    package_allowlist: src_default2.array(src_default2.string()).default([]),
    package_blocklist: src_default2.array(src_default2.string()).default([])
  });
  enabled;
  ownerCtx;
  packageAllowlist;
  packageBlocklist;
  registrations = /* @__PURE__ */ new Set();
  /**
   * Create and install the invariant registry.
   * @param ctx - Cordis context that owns the service.
   * @param config - global enablement and package-name regex filters.
   */
  constructor(ctx, config = {}) {
    super(ctx, "invariants");
    this.ownerCtx = ctx;
    this.enabled = config.enabled ?? true;
    this.packageAllowlist = compilePatterns("package_allowlist", config.package_allowlist ?? []);
    this.packageBlocklist = compilePatterns("package_blocklist", config.package_blocklist ?? []);
  }
  /** Return whether one full package name passes the configured filters. */
  selected(packageName) {
    if (!this.enabled) return false;
    if (this.packageAllowlist.length > 0 && !this.packageAllowlist.some((pattern2) => pattern2.test(packageName))) return false;
    return !this.packageBlocklist.some((pattern2) => pattern2.test(packageName));
  }
  /**
   * Register one package's invariant installer. The package name is reserved
   * even when filtering disables its checks. Enabled installers run in a child
   * fiber; failure disposes that fiber and releases the reservation.
   * @param packageName - full npm package name that owns the contribution.
   * @param installer - listener or startup-check installer for the child context.
   * @returns an effect-scoped disposer for the registration.
   */
  register(packageName, installer) {
    if (packageName.length === 0 || packageName.trim() !== packageName || /\s/.test(packageName)) {
      throw new Error("invariants: packageName must be non-blank and contain no whitespace");
    }
    if (this.registrations.has(packageName)) {
      throw new Error(`invariants: package "${packageName}" is already registered`);
    }
    const ctx = this.ownerCtx;
    const registrations = this.registrations;
    registrations.add(packageName);
    let registration;
    try {
      registration = ctx.effect(async () => {
        if (!this.selected(packageName)) {
          return () => {
            registrations.delete(packageName);
          };
        }
        const installInvariant = (childCtx) => installer(childCtx, (message) => {
          throw new InvariantError(packageName, message);
        });
        try {
          const child = ctx.plugin(installer.inject === void 0 ? installInvariant : Object.assign(installInvariant, { inject: installer.inject }));
          try {
            await child;
          } catch (error) {
            await child.dispose();
            throw error;
          }
          return async () => {
            try {
              await child.dispose();
            } finally {
              registrations.delete(packageName);
            }
          };
        } catch (error) {
          registrations.delete(packageName);
          throw error;
        }
      }, `invariants.register(${JSON.stringify(packageName)})`);
    } catch (error) {
      registrations.delete(packageName);
      throw error;
    }
    return registration;
  }
};
var src_default12 = InvariantRegistry;

// ../../source/deepseek-harness/packages/core/session/src/invariant.ts
var invariant_exports = {};
__export(invariant_exports, {
  apply: () => apply4,
  inject: () => inject4,
  name: () => name4
});
var PACKAGE_NAME = "@deepseek-ai/dsh-session";
var name4 = "session-invariant";
var inject4 = ["invariants"];
function requireOpenStep(trace, kind, turn, step, fail) {
  if (trace.openTurn !== turn || trace.openStep !== step) {
    fail(`${kind} names turn ${turn}/step ${step} but open is turn ${trace.openTurn}/step ${trace.openStep}`);
  }
}
function validateEvent(trace, event, fail) {
  if (event.seq <= trace.lastSeq) {
    fail(`seq must strictly increase: saw ${event.seq} after ${trace.lastSeq}`);
  }
  let openTurn2 = trace.openTurn;
  let openStep = trace.openStep;
  let nextTurn = trace.nextTurn;
  let nextStep = trace.nextStep;
  let pendingCalls = { kind: "none" };
  switch (event.type) {
    case "turn/start": {
      if (trace.openTurn !== null) {
        fail(`turn/start ${event.data.turn} while turn ${trace.openTurn} is still open`);
      }
      if (event.data.turn !== trace.nextTurn) {
        fail(`turn/start expected turn ${trace.nextTurn}, got ${event.data.turn}`);
      }
      openTurn2 = event.data.turn;
      nextStep = 1;
      break;
    }
    case "turn/end": {
      if (trace.openTurn !== event.data.turn) {
        fail(`turn/end ${event.data.turn} does not match open turn ${trace.openTurn}`);
      }
      if (trace.openStep !== null) {
        fail(`turn/end ${event.data.turn} while step ${trace.openStep} is still open`);
      }
      openTurn2 = null;
      nextTurn += 1;
      break;
    }
    case "step/start": {
      if (trace.openTurn !== event.data.turn) {
        fail(`step/start in turn ${event.data.turn} but open turn is ${trace.openTurn}`);
      }
      if (trace.openStep !== null) {
        fail(`step/start ${event.data.step} while step ${trace.openStep} is still open`);
      }
      if (event.data.step !== trace.nextStep) {
        fail(`step/start expected step ${trace.nextStep} in turn ${event.data.turn}, got ${event.data.step}`);
      }
      openStep = event.data.step;
      break;
    }
    case "step/end": {
      requireOpenStep(trace, "step/end", event.data.turn, event.data.step, fail);
      pendingCalls = { kind: "clear" };
      openStep = null;
      nextStep += 1;
      break;
    }
    case "assistant/chunk": {
      requireOpenStep(trace, "assistant/chunk", event.data.turn, event.data.step, fail);
      break;
    }
    case "assistant/message": {
      requireOpenStep(trace, "assistant/message", event.data.turn, event.data.step, fail);
      break;
    }
    case "tool/call": {
      requireOpenStep(trace, "tool/call", event.data.turn, event.data.step, fail);
      pendingCalls = { kind: "add", callId: event.data.callId };
      break;
    }
    case "tool/result": {
      if (event.surfaceOp !== "append") {
        if (trace.openTurn === null) {
          fail("tool/result surface replacement appended outside any open turn");
        }
        break;
      }
      requireOpenStep(trace, "tool/result", event.data.turn, event.data.step, fail);
      const callId = event.data.message.source.callId;
      const syntheticNotStarted = event.data.message.content[0].isError === true && event.data.error?.code === TOOL_NOT_STARTED;
      if (!trace.pendingCalls.has(callId) && !syntheticNotStarted) {
        fail(`tool/result for ${callId} with no prior tool/call in this step`);
      }
      pendingCalls = { kind: "delete", callId };
      break;
    }
    case "user/message":
      break;
    case "session/end-seed":
      break;
    case "todo/write":
    case "request/header":
    case "request/context": {
      if (trace.openTurn === null) {
        fail(`${event.type} appended outside any open turn (core execution events must be turn-enclosed)`);
      }
      break;
    }
    default:
      break;
  }
  return {
    scalars: { lastSeq: event.seq, openTurn: openTurn2, openStep, nextTurn, nextStep },
    pendingCalls
  };
}
function applyTransition(trace, transition) {
  Object.assign(trace, transition.scalars);
  switch (transition.pendingCalls.kind) {
    case "none":
      break;
    case "add":
      trace.pendingCalls.add(transition.pendingCalls.callId);
      break;
    case "delete":
      trace.pendingCalls.delete(transition.pendingCalls.callId);
      break;
    case "clear":
      trace.pendingCalls.clear();
      break;
    /* v8 ignore next -- validateEvent produces this closed transition union */
    default:
      assertNever(transition.pendingCalls, "session trace pending-call transition");
  }
}
var install = Object.assign((ctx, fail) => {
  const traces = /* @__PURE__ */ new WeakMap();
  const stagedTransitions = /* @__PURE__ */ new WeakMap();
  const freshTrace = () => ({
    lastSeq: -1,
    openTurn: null,
    openStep: null,
    nextTurn: 1,
    nextStep: 1,
    pendingCalls: /* @__PURE__ */ new Set()
  });
  const seedSession = (session) => {
    const trace = freshTrace();
    traces.set(session, trace);
    for (const event of session.events) {
      applyTransition(trace, validateEvent(trace, event, fail));
    }
    return trace;
  };
  const traceFor = (session) => traces.get(session) ?? seedSession(session);
  for (const session of ctx.sessions.list()) seedSession(session);
  ctx.on("session/created", (session) => {
    seedSession(session);
  }, { global: true });
  ctx.on("session/event", (session, event) => {
    const staged = stagedTransitions.get(event);
    if (staged === void 0 || staged.session !== session) {
      return fail("session/event reached publication without matching pre-commit validation");
    }
    stagedTransitions.delete(event);
    applyTransition(staged.trace, staged.transition);
  }, { global: true });
  ctx.on("internal/dispatch", (_mode, eventName, args) => {
    if (eventName !== "session/event") return;
    const [session, event] = args;
    const trace = traceFor(session);
    const transition = validateEvent(trace, event, fail);
    stagedTransitions.set(event, { session, trace, transition });
  }, { global: true });
}, { inject: ["sessions"] });
var apply4 = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));

// ../../source/deepseek-harness/packages/core/agent/src/invariant.ts
var invariant_exports2 = {};
__export(invariant_exports2, {
  apply: () => apply5,
  inject: () => inject5,
  name: () => name5
});
var PACKAGE_NAME2 = "@deepseek-ai/dsh-agent";
var name5 = "agent-invariant";
var inject5 = ["invariants"];
var install2 = (ctx, fail) => {
  const lastStatus = /* @__PURE__ */ new WeakMap();
  ctx.on("agent/status", ({ agent, status }) => {
    const previous = lastStatus.get(agent);
    if (previous === status) {
      fail(`agent/status repeated ${status} (no-op transition)`);
    }
    lastStatus.set(agent, status);
  }, { global: true });
};
var apply5 = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME2, install2));

// ../../source/deepseek-harness/packages/core/scope/src/invariant.ts
var invariant_exports3 = {};
__export(invariant_exports3, {
  apply: () => apply6,
  inject: () => inject6,
  name: () => name6
});

// ../../source/deepseek-harness/packages/core/scope/src/scoped-events.generated.ts
var scopedSubjectResolvers = Object.freeze({
  "agent/created": (args) => args[0]["agent"],
  "agent/disposed": (args) => args[0]["agent"],
  "agent/error": (args) => args[0]["agent"],
  "agent/inbox/claimed": (args) => args[0]["agent"],
  "agent/inbox/discarded": (args) => args[0]["agent"],
  "agent/inbox/inserted": (args) => args[0]["agent"],
  "agent/pre-step": (args) => args[0]["agent"],
  "agent/request": (args) => args[0]["agent"],
  "agent/request-error": (args) => args[0]["agent"],
  "agent/session-start": (args) => args[0]["agent"],
  "agent/status": (args) => args[0]["agent"],
  "agent/turn-stopping": (args) => args[0]["agent"],
  "approval/request": (args) => args[0]["agent"],
  "goal/changed": (args) => args[0]["agent"],
  "session/created": null,
  "session/disposed": null,
  "session/event": null,
  "session/flush": null,
  "subagent/end": null,
  "subagent/start": null,
  "system-prompt/assemble": (args) => args[1]["scope"],
  "tools/code-dispatch-log": (args) => args[0]["agent"],
  "tools/execute": (args) => args[0]["agent"],
  "tools/post-execute": (args) => args[0]["agent"],
  "tools/pre-execute": (args) => args[0]["agent"],
  "tools/result": (args) => args[0]["agent"]
});
function scopedSubjectResolverFor(event) {
  return scopedSubjectResolvers[event];
}

// ../../source/deepseek-harness/packages/core/scope/src/invariant.ts
var PACKAGE_NAME3 = "@deepseek-ai/dsh-scope";
var name6 = "scope-invariant";
var inject6 = ["invariants"];
var install3 = (ctx, fail) => {
  ctx.on("internal/dispatch", (_mode, eventName, args, thisArg) => {
    const subjectOf = scopedSubjectResolverFor(eventName);
    if (subjectOf === void 0) return;
    if (!isScopeCarrier(thisArg)) {
      fail(
        `"${eventName}" is a scope-filtered event but was dispatched without a scope carrier \u2014 pass scopeTarget(base, subject) as the dispatch thisArg (agent events: use agentEvents(ctx, agent))`
      );
    }
    if (subjectOf !== null && carrierKeyOf(thisArg) !== subjectOf(args)) {
      fail(
        `"${eventName}" was dispatched with a scope carrier keyed to a DIFFERENT subject than its arguments name \u2014 the carrier key and the event's subject must be the same object (use agentEvents(ctx, agent))`
      );
    }
  }, { global: true });
};
var apply6 = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME3, install3));

// ../../source/deepseek-harness/packages/core/agent-loop/src/invariant.ts
var invariant_exports4 = {};
__export(invariant_exports4, {
  apply: () => apply7,
  inject: () => inject7,
  name: () => name7
});
var PACKAGE_NAME4 = "@deepseek-ai/dsh-agent-loop";
var name7 = "agent-loop-invariant";
var inject7 = ["invariants"];
var install4 = Object.assign((ctx, fail) => {
  ctx.on("llm/stream", (options, next) => {
    if (!isAgentLoopRequest(options)) return next();
    if (!Object.isFrozen(options)) fail("a loop-built request must be frozen");
    if (options.sessionId === void 0) fail("a loop-built request must carry a session id");
    const session = ctx.sessions.get(options.sessionId);
    if (!session) fail(`a loop-built request must carry a live session id, got "${String(options.sessionId)}"`);
    if (!Object.isFrozen(options.messages)) {
      fail("a loop-built request must carry a frozen messages array");
    }
    const events = session.events;
    if (!events.some((event) => event.type === "step/start")) {
      return fail("a loop-built request with no step/start in its session log");
    }
    const header = foldRequestHeader(events);
    if (header === void 0) {
      return fail("a loop-built request with no request/header event in its session log");
    }
    const expected = session.deriveMessages();
    if (JSON.stringify(options.messages) !== JSON.stringify(expected)) {
      fail(`llm request for session "${String(session.id)}" diverges from the dispatch-time durable derivation (log-reconstruction desync)`);
    }
    const headerMatches = options.model === header.config.model && options.system === header.system && options.temperature === header.config.temperature && options.maxTokens === header.config.maxTokens && JSON.stringify(options.stop) === JSON.stringify(header.config.stop) && JSON.stringify(options.tools ?? []) === JSON.stringify(header.tools ?? []);
    if (!headerMatches) {
      fail(`llm request for session "${String(session.id)}" diverges from the folded request header`);
    }
    return next();
  }, { global: true, prepend: true });
}, { inject: ["sessions"] });
var apply7 = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME4, install4));

// ../../source/deepseek-harness/packages/shell/tool-bash/src/index.ts
var src_exports4 = {};
__export(src_exports4, {
  Config: () => Config3,
  apply: () => apply8,
  inject: () => inject8,
  name: () => name8
});
import { isAbsolute as isAbsolute3, resolve as resolvePath } from "node:path";

// ../../source/deepseek-harness/packages/sandbox/sandbox/src/escalation.ts
var WIDER_MODES = {
  "read-only": ["workspace-write", "danger-full-access"],
  "workspace-write": ["danger-full-access"]
};
var ESCALATION_TARGETS = ["workspace-write", "danger-full-access"];
function validateEscalationArgs(sandboxPermissions, justification) {
  if (sandboxPermissions !== void 0 && justification === void 0) {
    throw new Error("invalid escalation: sandbox_permissions requires a justification");
  }
  if (justification !== void 0 && sandboxPermissions === void 0) {
    throw new Error("invalid escalation: justification is only valid together with sandbox_permissions");
  }
  if (justification !== void 0 && justification.trim().length === 0) {
    throw new Error("invalid justification: expected a non-empty sentence");
  }
}
function sandboxDenialMarker(mode) {
  return `[sandbox: file access denied under ${mode} mode]`;
}
function escalationHintMarker(subject) {
  return `[sandbox: escalation available \u2014 retry this exact ${subject} once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]`;
}
async function approveEscalation(request, approval) {
  const { requestedMode: mode, effectiveMode, justification, subject } = request;
  if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) {
    throw new Error(`sandbox escalation to "${mode}" is not strictly wider than this call's current "${effectiveMode}" mode`);
  }
  if (approval.approver === void 0) {
    throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`);
  }
  if (approval.agent === void 0) {
    throw new Error(`sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`);
  }
  const outcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `escalate sandbox to ${mode}: ${justification}`,
    ...approval.signal ? { signal: approval.signal } : {}
  });
  switch (outcome) {
    // The schema enum already pinned `mode` to the closed target vocabulary;
    // the check above proved it is strictly wider.
    case "allowed-once":
      return mode;
    case "rejected":
      throw new Error(`the user rejected escalating this ${subject} to "${mode}"`);
    case "cancelled":
      throw new Error(`approval for escalating to "${mode}" was cancelled`);
    case "unavailable":
      throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval channel is available`);
    default:
      return assertNever(outcome, "EscalationOutcome");
  }
}

// ../../source/deepseek-harness/packages/sandbox/sandbox/src/roots.ts
import { realpathSync } from "node:fs";
function canonicalPath(path) {
  try {
    return realpathSync.native(path);
  } catch {
    return path;
  }
}

// ../../source/deepseek-harness/packages/settings/settings/src/redact.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function walk(node, value, path, secrets) {
  if (node === void 0) return value;
  if (node.meta?.role === "secret") {
    secrets.push({ path, set: value !== void 0 });
    return void 0;
  }
  switch (node.type) {
    case "object": {
      const properties = node.dict ?? {};
      const source = isRecord2(value) ? value : void 0;
      const rebuilt = {};
      if (source !== void 0) {
        for (const [key, entry] of Object.entries(source)) {
          if (key in properties) continue;
          rebuilt[key] = entry;
        }
      }
      for (const [key, child] of Object.entries(properties)) {
        const stripped = walk(child, source?.[key], [...path, key], secrets);
        if (stripped !== void 0) rebuilt[key] = stripped;
      }
      return source === void 0 && Object.keys(rebuilt).length === 0 ? value : rebuilt;
    }
    case "dict": {
      if (!isRecord2(value)) return value;
      const rebuilt = {};
      for (const [key, entry] of Object.entries(value)) {
        const stripped = walk(node.inner, entry, [...path, key], secrets);
        if (stripped !== void 0) rebuilt[key] = stripped;
      }
      return rebuilt;
    }
    case "array": {
      if (!Array.isArray(value)) return value;
      return value.map((entry, index) => walk(node.inner, entry, [...path, String(index)], secrets));
    }
    default:
      return value;
  }
}
function redactSecrets(schema, value) {
  const secrets = [];
  const stripped = walk(schema, value, [], secrets);
  return { value: stripped, secrets };
}

// ../../source/deepseek-harness/packages/settings/settings/src/index.ts
var NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;
function settingsNamespace(value) {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
  }
  return value;
}
function deepEqualJson(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((entry, index) => deepEqualJson(entry, b[index]));
  }
  const left = a;
  const right = b;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every((key) => key in right && deepEqualJson(left[key], right[key]));
}
var SettingsConflictError = class extends Error {
  /** Stable machine code for wire layers mapping this to their own taxonomy. */
  code = "SETTINGS_CONFLICT";
  /** The revision the write expected. */
  expected;
  /** The revision the namespace actually stands at. */
  actual;
  /**
   * @param ns - the namespace whose write was refused.
   * @param expected - the revision the caller sent.
   * @param actual - the revision now stored.
   */
  constructor(ns, expected, actual) {
    super(`settings namespace "${ns}" changed since it was read (expected revision ${String(expected)}, now ${String(actual)})`);
    this.name = "SettingsConflictError";
    this.expected = expected;
    this.actual = actual;
  }
};
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function applyPathOp(section, op) {
  const [head, ...rest] = op.path;
  if (head === void 0) {
    if (op.op === "unset") return {};
    if (!isPlainObject2(op.value)) {
      throw new TypeError("settings mutate: setting the section root requires a plain object");
    }
    return { ...op.value };
  }
  if (rest.length === 0) {
    if (op.op === "set") return { ...section, [head]: op.value };
    const { [head]: _removed, ...kept } = section;
    return kept;
  }
  const child = section[head];
  if (!isPlainObject2(child)) {
    if (op.op === "unset") return section;
    return { ...section, [head]: applyPathOp({}, { ...op, path: rest }) };
  }
  return { ...section, [head]: applyPathOp(child, { ...op, path: rest }) };
}
function describeRejected(value) {
  if (value === void 0) return "undefined";
  if (typeof value === "object" && value !== null) {
    const proto = Object.getPrototypeOf(value);
    const name15 = proto?.constructor?.name;
    return name15 === void 0 || name15 === "Object" ? "a non-plain object" : `a ${name15}`;
  }
  return `a ${typeof value}`;
}
function cloneJsonShaped(root, reject2) {
  const visiting = /* @__PURE__ */ new WeakSet();
  const clone2 = (value, path) => {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw reject2("a non-finite number", path);
      return value;
    }
    if (Array.isArray(value)) {
      if (visiting.has(value)) throw reject2("a circular reference", path);
      visiting.add(value);
      const entries = value.map((entry, index) => clone2(entry, `${path}[${index}]`));
      visiting.delete(value);
      return entries;
    }
    if (isPlainObject2(value)) {
      if (visiting.has(value)) throw reject2("a circular reference", path);
      visiting.add(value);
      const out = {};
      for (const [key, entry] of Object.entries(value)) {
        if (entry === void 0) continue;
        out[key] = clone2(entry, `${path}.${key}`);
      }
      visiting.delete(value);
      return out;
    }
    throw reject2(describeRejected(value), path);
  };
  return clone2(root, "$");
}
function mergeLayers(under, over) {
  if (over === void 0) return under;
  if (!isPlainObject2(under) || !isPlainObject2(over)) return over;
  const merged = { ...under };
  for (const [key, value] of Object.entries(over)) {
    merged[key] = key in merged ? mergeLayers(merged[key], value) : value;
  }
  return merged;
}
function deepFreeze2(value) {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) deepFreeze2(entry);
  return Object.freeze(value);
}
var SettingsProvider = class extends Service {
  registrations = /* @__PURE__ */ new Map();
  /** Latest published raw document; empty until the provider's first publish. */
  document = {};
  /** Per-namespace write chains; settled tails, so a failure never poisons the queue. */
  writeQueues = /* @__PURE__ */ new Map();
  /** In-flight watcher invocation segments, drained by the dispose teardown. */
  pendingTails = /* @__PURE__ */ new Set();
  /** Set at service dispose: refuse new writes while queued ones drain. */
  stopped = false;
  /** Opaque read of {@link stopped}: control flow cannot narrow it across awaits. */
  isStopped() {
    return this.stopped;
  }
  constructor(ctx) {
    super(ctx, "settings");
  }
  /**
   * Load the provider's document once and publish it before the service
   * becomes injectable, and register the write-drain teardown. Providers with
   * their own init (watchers, connections) delegate here first via
   * `yield* super[Service.init]()`; their disposers then run before the drain.
   */
  async *[Service.init]() {
    yield async () => {
      this.stopped = true;
      await Promise.allSettled([...this.writeQueues.values(), ...this.pendingTails]);
    };
    this.publish(await this.load());
  }
  /**
   * Absolute path of the provider's user-editable document, when its storage
   * is one local file. Configuration surfaces use this only as availability
   * metadata; the guarded open operation resolves the path again Host-side.
   * Non-file providers leave it undefined and expose no open-document affordance.
   * @returns the absolute local document path, or undefined for non-file storage.
   */
  get documentPath() {
    return void 0;
  }
  /**
   * Prepare the provider's user-editable document for a native editor. File
   * providers may materialize an absent document before returning its path;
   * non-file providers return undefined.
   * @returns the absolute local document path, or undefined for non-file storage.
   */
  prepareDocument() {
    return Promise.resolve(this.documentPath);
  }
  /**
   * Register a namespace schema and receive its owner scope. The registration
   * is an effect on the calling plugin's fiber: disposing that fiber removes
   * the namespace and its observers. An invalid stored section fails the
   * registration itself — the earliest point where the schema can judge it.
   * @param ns - unique namespace; duplicate registration fails loud.
   * @param schema - schemastery schema resolving this namespace's value.
   * @param options - composition `base` layer and effect timing.
   * @returns the owner scope for reads, observation, and updates.
   */
  register(ns, schema, options) {
    if (this.registrations.has(ns)) {
      throw new Error(`settings namespace "${ns}" is already registered`);
    }
    const registration = {
      ns,
      schema,
      base: options?.base,
      applies: options?.applies ?? "live",
      ...options?.validate === void 0 ? {} : { validate: options.validate },
      resolved: deepFreeze2(this.resolve(schema, options?.base, this.section(ns), options?.validate)),
      revision: 0,
      watchers: /* @__PURE__ */ new Set()
    };
    this.ctx.effect(() => {
      this.registrations.set(ns, registration);
      return () => this.registrations.delete(ns);
    }, `settings.register(${JSON.stringify(String(ns))})`);
    return {
      get: () => registration.resolved,
      watch: (callback) => {
        const watcher = { callback, tail: Promise.resolve(), active: true };
        registration.watchers.add(watcher);
        return () => {
          watcher.active = false;
          registration.watchers.delete(watcher);
        };
      },
      update: (patch) => this.update(ns, patch),
      replace: (section) => this.replace(ns, section)
    };
  }
  /**
   * Describe every registered namespace for configuration surfaces, including
   * the composition `base` and raw user layers so a form can mark which fields
   * the user overrode (presence in `user`) and what a reset returns to.
   * @param options - redaction switch; wire surfaces must redact.
   * @returns one descriptor per registered namespace, in registration order.
   */
  describe(options) {
    return [...this.registrations.values()].map((registration) => {
      let user;
      try {
        user = this.section(registration.ns);
      } catch {
        user = void 0;
      }
      const base = registration.base === void 0 ? void 0 : structuredClone(registration.base);
      const detachedUser = user === void 0 ? void 0 : structuredClone(user);
      const descriptor = {
        ns: registration.ns,
        schema: registration.schema.toJSON(),
        value: registration.resolved,
        revision: registration.revision,
        ...base === void 0 ? {} : { base },
        ...detachedUser === void 0 ? {} : { user: detachedUser },
        applies: registration.applies
      };
      if (options?.redactSecrets !== true) return descriptor;
      const schema = registration.schema;
      const redacted = redactSecrets(schema, registration.resolved);
      return {
        ...descriptor,
        value: redacted.value,
        ...base === void 0 ? {} : { base: redactSecrets(schema, base).value },
        ...detachedUser === void 0 ? {} : { user: redactSecrets(schema, detachedUser).value },
        secrets: redacted.secrets
      };
    });
  }
  /**
   * Read one registered namespace's resolved value.
   * @param ns - the namespace to read.
   * @returns the resolved value, or `undefined` while unregistered.
   */
  get(ns) {
    return this.registrations.get(ns)?.resolved;
  }
  /**
   * Merge a patch into one registered namespace's user layer, validate the
   * resolved candidate, persist through the provider, then commit and emit.
   * A validation failure rejects before anything is persisted. Writes to one
   * namespace are serialized: concurrent updates apply in call order, each
   * merging over the previous write's committed section.
   * @param ns - the registered namespace to update.
   * @param patch - plain-object patch over the user section.
   * @param expectedRevision - the descriptor `revision` the caller read; a
   *   namespace that moved past it rejects with {@link SettingsConflictError}.
   */
  async update(ns, patch, expectedRevision) {
    return this.write(ns, patch, "merge", expectedRevision);
  }
  /**
   * Replace one registered namespace's user section wholesale, validate,
   * persist, then commit and emit. Keys absent from `section` fall back to the
   * composition `base` and schema defaults — this is the removal/reset path a
   * merge-only patch cannot express (`replace({})` re-inherits everything).
   * @param ns - the registered namespace to replace.
   * @param section - the complete next user section.
   * @param expectedRevision - the descriptor `revision` the caller read; a
   *   namespace that moved past it rejects with {@link SettingsConflictError}.
   */
  async replace(ns, section, expectedRevision) {
    return this.write(ns, section, "replace", expectedRevision);
  }
  /**
   * Apply path-addressed edits to one registered namespace's user section,
   * validate, persist, then commit and emit. The ops are applied to the
   * section as it stands when the write reaches the front of the queue, so a
   * caller never has to restate fields it did not touch — and, crucially,
   * cannot delete fields it never saw. This is the write path for any caller
   * holding a redacted view; `replace` remains the wholesale reset.
   * @param ns - the registered namespace to edit.
   * @param ops - ordered path edits; later ops observe earlier ones.
   * @param expectedRevision - the descriptor `revision` the caller read; a
   *   namespace that moved past it rejects with {@link SettingsConflictError}.
   */
  async mutate(ns, ops, expectedRevision) {
    if (!Array.isArray(ops)) throw new TypeError(`settings mutate for "${ns}" must be an array of path ops`);
    for (const op of ops) {
      if (!isPlainObject2(op) || op["op"] !== "set" && op["op"] !== "unset") {
        throw new TypeError(`settings mutate for "${ns}" ops must be {op:'set'|'unset', path}`);
      }
      if (!Array.isArray(op["path"]) || op["path"].some((part) => typeof part !== "string")) {
        throw new TypeError(`settings mutate for "${ns}" op paths must be arrays of strings`);
      }
    }
    return this.write(ns, ops, "mutate", expectedRevision);
  }
  /** Validate a write, then queue it on the namespace's serialized write chain. */
  write(ns, input, mode, expectedRevision) {
    const verb = mode === "merge" ? "update" : mode === "replace" ? "replace" : "mutate";
    const registration = this.registrations.get(ns);
    if (registration === void 0) {
      throw new Error(`settings namespace "${ns}" is not registered`);
    }
    if (this.isStopped()) {
      throw new Error(`settings service is disposed: "${ns}" cannot be written`);
    }
    if (!this.writable) {
      throw new Error(`settings provider is read-only: "${ns}" cannot be updated in-process`);
    }
    let payload;
    if (mode === "mutate") {
      payload = { ops: input };
    } else {
      if (!isPlainObject2(input)) throw new TypeError(`settings ${verb} for "${ns}" must be a plain object`);
      payload = input;
    }
    const snapshot = cloneJsonShaped(payload, (label, path) => new TypeError(`settings ${verb} for "${ns}" must contain only JSON-compatible data (found ${label} at ${path})`));
    const previous = this.writeQueues.get(ns) ?? Promise.resolve();
    const run = previous.catch(() => void 0).then(async () => {
      if (this.isStopped()) {
        throw new Error(`settings service was disposed before the queued "${ns}" ${verb} ran`);
      }
      if (this.registrations.get(ns) !== registration) {
        throw new Error(`settings namespace "${ns}" registration was disposed before the queued ${verb} ran`);
      }
      const current = this.section(ns) ?? {};
      if (expectedRevision !== void 0 && expectedRevision !== registration.revision) {
        throw new SettingsConflictError(ns, expectedRevision, registration.revision);
      }
      const section = mode === "merge" ? mergeLayers(current, snapshot) : mode === "replace" ? snapshot : snapshot["ops"].reduce(applyPathOp, current);
      const next = deepFreeze2(this.resolve(registration.schema, registration.base, section, registration.validate));
      await this.persist(ns, section);
      this.document[ns] = section;
      if (this.registrations.get(ns) === registration && !this.isStopped()) {
        this.bumpRevision(registration, current, section);
        this.commit(registration, next, "update");
      }
    });
    this.writeQueues.set(ns, run);
    return run;
  }
  /**
   * Provider hook: commit a complete raw document observed in storage. Each
   * registered namespace re-resolves; an invalid section keeps that
   * namespace's last good value and warns, other namespaces still commit.
   * @param doc - the detached raw document (unregistered sections preserved).
   * @param source - change origin; defaults to `provider`.
   */
  publish(doc, source = "provider") {
    const before = /* @__PURE__ */ new Map();
    for (const registration of this.registrations.values()) {
      try {
        before.set(registration.ns, this.section(registration.ns));
      } catch {
        before.set(registration.ns, void 0);
      }
    }
    this.document = doc;
    for (const registration of this.registrations.values()) {
      let next;
      try {
        next = deepFreeze2(this.resolve(registration.schema, registration.base, this.section(registration.ns), registration.validate));
      } catch (error) {
        this.ctx.logger.warn('settings: keeping last good "%s" after invalid stored section', registration.ns);
        this.ctx.logger.warn(error);
        continue;
      }
      this.bumpRevision(registration, before.get(registration.ns), this.section(registration.ns));
      this.commit(registration, next, source);
    }
  }
  /** Read one namespace's raw user section, rejecting non-object sections. */
  section(ns) {
    const section = this.document[ns];
    if (section === void 0) return void 0;
    if (!isPlainObject2(section)) {
      throw new TypeError(`settings section "${ns}" must be an object of keys`);
    }
    return section;
  }
  /** Resolve one namespace value: schema defaults, then `base`, then the user layer. */
  resolve(schema, base, section, validate) {
    const value = schema(mergeLayers(base, section));
    validate?.(value);
    return value;
  }
  /**
   * Advance a namespace's revision when its RAW section changed, and announce
   * it. Deliberately independent of {@link commit}'s resolved-value equality:
   * storing an override equal to the composition base leaves the resolved
   * value alone but changes what the document says, which is exactly what a
   * configuration surface must re-read.
   */
  bumpRevision(registration, before, after) {
    if (deepEqualJson(before, after)) return;
    registration.revision += 1;
    this.emitDocumentUpdated(registration.ns, registration.revision);
  }
  /** Contained fan-out of `settings/document-updated`, mirroring {@link commit}'s. */
  emitDocumentUpdated(ns, revision) {
    let invariantFailure;
    const args = ["settings/document-updated", ns, revision];
    for (const listener of this.ctx.events.dispatch("emit", args)) {
      try {
        const returned = listener(ns, revision);
        if (returned != null && typeof returned.then === "function") {
          void Promise.resolve(returned).then(void 0, (error) => {
            this.warnListenerFailure(ns, error);
          });
        }
      } catch (error) {
        if (error?.code === "INVARIANT") {
          invariantFailure ??= error;
          continue;
        }
        this.warnListenerFailure(ns, error);
      }
    }
    if (invariantFailure !== void 0) throw invariantFailure;
  }
  /** Commit a resolved value when changed: swap, notify watchers, emit the event. */
  commit(registration, next, source) {
    const prev = registration.resolved;
    if (deepEqualJson(next, prev)) return;
    registration.resolved = next;
    for (const watcher of [...registration.watchers]) {
      const segment = watcher.tail.then(() => {
        if (!watcher.active || this.isStopped()) return;
        return watcher.callback(next, prev);
      }).then(() => void 0, (error) => {
        this.warnWatcherFailure(registration.ns, error);
      });
      watcher.tail = segment;
      this.pendingTails.add(segment);
      void segment.then(() => this.pendingTails.delete(segment));
    }
    let invariantFailure;
    const args = ["settings/updated", registration.ns, next, prev, source];
    for (const listener of this.ctx.events.dispatch("emit", args)) {
      try {
        const returned = listener(registration.ns, next, prev, source);
        if (returned != null && typeof returned.then === "function") {
          void Promise.resolve(returned).then(void 0, (error) => {
            this.warnListenerFailure(registration.ns, error);
          });
        }
      } catch (error) {
        if (error?.code === "INVARIANT") {
          invariantFailure ??= error;
          continue;
        }
        this.warnListenerFailure(registration.ns, error);
      }
    }
    if (invariantFailure !== void 0) throw invariantFailure;
  }
  /** Contained-watcher diagnostic shared by the sync and async failure paths. */
  warnWatcherFailure(ns, error) {
    this.ctx.logger.warn('settings: watcher for "%s" failed', ns);
    this.ctx.logger.warn(error);
  }
  /** Contained-listener diagnostic shared by the sync and async failure paths. */
  warnListenerFailure(ns, error) {
    this.ctx.logger.warn('settings: a settings/updated listener for "%s" failed', ns);
    this.ctx.logger.warn(error);
  }
};
var FIBER_DISPOSED = 4;
var FIBER_UNLOADING = 5;
function isUnloading(ctx) {
  const state = ctx.fiber.state;
  return state === FIBER_UNLOADING || state === FIBER_DISPOSED;
}
function installSettingsSection(ctx, ns, schema, entry, hooks) {
  ctx.inject(["settings"], (sctx) => {
    const scope2 = sctx.settings.register(ns, schema, {
      base: entry,
      ...hooks.validate === void 0 ? {} : { validate: hooks.validate }
    });
    hooks.setSource(() => scope2.get());
    sctx.effect(() => () => {
      if (isUnloading(ctx)) return;
      hooks.setSource(() => entry);
      hooks.onChange();
    });
    hooks.onChange();
    scope2.watch(() => {
      if (isUnloading(ctx)) return;
      hooks.onChange();
    });
  });
}

// ../../source/deepseek-harness/packages/subprocess/subprocess/src/types.ts
var DSH_ENV_PREFIX = "DSH_";

// ../../source/deepseek-harness/packages/shell/shell/src/render.ts
function parseExitStatus(text) {
  const signal = /\n\[killed by signal: ([^\]\n]+)\]$/.exec(text);
  if (signal?.[1] !== void 0) return { body: text.slice(0, signal.index), signal: signal[1] };
  const exit = /\n\[exit code: (\d+)\]$/.exec(text);
  if (exit?.[1] !== void 0) return { body: text.slice(0, exit.index), exitCode: Number(exit[1]) };
  return { body: text, exitCode: 0 };
}

// ../../source/deepseek-harness/packages/shell/shell/src/index.ts
var SHELL_SETTINGS_NAMESPACE = settingsNamespace("shell");

// ../../source/deepseek-harness/packages/shell/tool-bash/src/background.ts
function processOutcome(proc) {
  if (proc.status === "killed") {
    return { status: "killed", detail: proc.signal !== null ? `signal: ${proc.signal}` : "killed before exit" };
  }
  return { status: "completed", detail: `exit code: ${proc.exitCode ?? 0}` };
}

// ../../source/deepseek-harness/packages/shell/tool-bash/src/render.ts
function streamText(output) {
  if (!output.truncated) return output.text;
  return `${output.text}
[output truncated; full output: ${output.spillPath ?? "(unavailable)"}]`;
}
function renderResult(result, escalationModes = []) {
  const out = streamText(result.stdout);
  const err = streamText(result.stderr);
  let body = out;
  if (err.length > 0) {
    if (body.length > 0 && !body.endsWith("\n")) body += "\n";
    body += `[stderr]
${err}`;
  }
  if (body.length === 0) body = "(no output)";
  const markers2 = [];
  if (result.sandbox?.denied) {
    markers2.push(sandboxDenialMarker(result.sandbox.mode));
    if (escalationModes.length > 0) {
      markers2.push(escalationHintMarker("command"));
    }
  }
  if (result.timedOut) markers2.push(`[timed out after ${result.timeoutMs}ms]`);
  if (result.signal !== null) {
    markers2.push(`[killed by signal: ${result.signal}]`);
  } else if (result.exitCode !== 0) {
    markers2.push(`[exit code: ${result.exitCode}]`);
  }
  if (markers2.length === 0) return body;
  if (!body.endsWith("\n")) body += "\n";
  return body + markers2.join("\n");
}
function renderProcessRead(read, sandbox, escalationModes = []) {
  const notices = [];
  if (read.lossy) {
    const paths = [read.stdoutSpillPath, read.stderrSpillPath].filter((path) => path !== void 0);
    notices.push(`[some output was dropped from memory; full output: ${paths.length > 0 ? paths.join(", ") : "(unavailable)"}]`);
  }
  if (sandbox?.runnerFailed) {
    notices.push(`[sandbox: the sandbox runner itself failed under ${sandbox.mode} mode \u2014 the command did not run; this is a sandbox problem, not a command failure]`);
  } else if (sandbox?.denied) {
    notices.push(sandboxDenialMarker(sandbox.mode));
    if (escalationModes.length > 0) {
      notices.push(escalationHintMarker("command"));
    }
  }
  if (notices.length === 0) return read.delta;
  return `${read.delta}${read.delta.length > 0 && !read.delta.endsWith("\n") ? "\n" : ""}${notices.join("\n")}`;
}

// ../../source/deepseek-harness/packages/shell/tool-bash/src/index.ts
var name8 = "tool-bash";
var inject8 = ["tools", "shell", "systemPrompt", "shellEnv"];
var Config3 = src_default2.object({
  enableRunInBackground: src_default2.boolean().default(true)
});
function validateBashArgs(args) {
  if (args.command.trim().length === 0) {
    throw new Error("invalid command: expected a non-empty string");
  }
  if (args.description.trim().length === 0) {
    throw new Error("invalid description: expected a non-empty string");
  }
  if (args.timeoutMs !== void 0 && (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0)) {
    throw new Error(`invalid timeoutMs: expected a positive number, got ${JSON.stringify(args.timeoutMs)}`);
  }
  validateEscalationArgs(args.sandbox_permissions, args.justification);
}
function bashDescription(backgroundEnabled, escalationModes) {
  const background = backgroundEnabled ? "Set `run_in_background: true` for long-running commands: the call returns a job id immediately; read its output with `job_output` and stop it with `job_kill`." : "Background execution is not available; long-running commands must finish within the timeout.";
  const base = `Execute a bash command (\`bash -c\`) and return its stdout/stderr. Each call runs in a fresh shell: no state (cwd, variables, functions) persists between calls \u2014 pass \`workdir\` instead of using \`cd\`. Non-zero exits are reported as \`[exit code: N]\`. Current harness environment facts are exposed through managed \`$${DSH_ENV_PREFIX}*\` variables; inspect them when needed. Commands may run under a file sandbox; a blocked file operation is reported as \`[sandbox: file access denied under <mode> mode]\` \u2014 a policy denial, not a bug in the command; do not retry another way. Long output is truncated to its tail; the full output is saved to a file whose path is reported when available. ` + background;
  if (escalationModes.length === 0) return base;
  return base + " Attempting a command the sandbox may deny is safe and expected: run it and read the marker rather than assuming the denial. When a command is denied and a wider mode would let it succeed, escalate immediately in the same turn \u2014 the one sanctioned exception to a denial: retry the exact same command once with `sandbox_permissions` (the narrowest wider mode that suffices) plus a one-sentence `justification`. Do not detour through chat to ask permission first \u2014 the approval prompt raised by that retry is how the user consents. If the session states approval prompts are disabled, there is no exception: a denial is final \u2014 do not set `sandbox_permissions`. Never escalate speculatively: ground the request in a real denial \u2014 normally the one this command just hit; escalating up front is fine only when this session already denied the same access. A rejected escalation is final for that command \u2014 stop and explain, never work around it \u2014 but it does not forbid attempting or escalating other commands later.";
}
function presentBashCall(args) {
  if (args.run_in_background === true) {
    return {
      card: "generic",
      title: args.command,
      kind: "execute",
      rawInput: args.command,
      content: [{ type: "text", text: args.description }]
    };
  }
  return {
    card: "terminal",
    title: args.command,
    description: args.description,
    ...args.workdir !== void 0 ? { cwd: args.workdir } : {}
  };
}
function presentBashResult(args, result) {
  const block = result.content.length === 1 ? result.content[0] : void 0;
  if (block === void 0 || block.type !== "text") return void 0;
  const raw = block.text;
  const isBackground = typeof args === "object" && args !== null && args.run_in_background === true;
  if (isBackground || result.isError) {
    return { card: "generic", content: [{ type: "text", text: `\`\`\`console
${raw.replace(/\n+$/, "")}
\`\`\`` }] };
  }
  const { body, ...exit } = parseExitStatus(raw);
  return { card: "terminal", output: body, ...exit };
}
function resolveWorkdir(modelWorkdir, exec, policyWorkspaceRoot) {
  const headerCwd = exec.agent?.session.header.cwd;
  const sessionCwd = policyWorkspaceRoot ?? (headerCwd === void 0 ? void 0 : canonicalPath(headerCwd));
  if (modelWorkdir === void 0) return sessionCwd;
  if (sessionCwd !== void 0 && !isAbsolute3(modelWorkdir)) {
    return resolvePath(sessionCwd, modelWorkdir);
  }
  return modelWorkdir;
}
function canonicalBashResult(result) {
  const output = (stream) => ({
    text: stream.text,
    truncated: stream.truncated,
    ...stream.spillPath !== void 0 ? { spillPath: stream.spillPath } : {}
  });
  return {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    aborted: result.aborted,
    timeoutMs: result.timeoutMs,
    stdout: output(result.stdout),
    stderr: output(result.stderr),
    ...result.sandbox !== void 0 ? {
      sandbox: {
        mode: result.sandbox.mode,
        denied: result.sandbox.denied,
        ...result.sandbox.enforcement !== void 0 ? { enforcement: result.sandbox.enforcement } : {},
        ...result.sandbox.runnerFailed !== void 0 ? { runnerFailed: result.sandbox.runnerFailed } : {}
      }
    } : {}
  };
}
var BACKGROUND_OUTPUT_PROPERTIES = {
  kind: { type: "string", required: true, const: "background" },
  jobId: { type: "string", required: true }
};
function apply8(ctx, config = {}) {
  const backgroundEnabled = config.enableRunInBackground ?? true;
  const defaultMode = ctx.shell.sandboxMode;
  const escalationModes = defaultMode === void 0 ? [] : ESCALATION_TARGETS;
  const sandboxPolicy = defaultMode === void 0 ? void 0 : ctx.get("sandboxPolicy");
  if (defaultMode !== void 0 && sandboxPolicy === void 0) {
    throw new Error("tool-bash: the mounted bash executor confines but ctx.sandboxPolicy is missing");
  }
  const resolveSandboxPolicy = (exec) => sandboxPolicy?.resolve(exec.agent === void 0 ? {} : { session: exec.agent.session });
  const approveBashEscalation = (mode, justification, exec, standingPolicy) => {
    if (escalationModes.length === 0) {
      throw new Error("sandbox_permissions is not available in this composition (no sandboxing executor to escalate)");
    }
    const effectiveMode = standingPolicy.mode;
    return approveEscalation(
      { requestedMode: mode, justification, effectiveMode, subject: "command" },
      {
        approver: ctx.get("approval"),
        agent: exec.agent,
        callId: exec.callId,
        toolName: "bash",
        signal: exec.signal
      }
    );
  };
  ctx.systemPrompt.section({
    name: "tool:bash",
    order: 105,
    text: "Check the [exit code: N] marker on every bash result; investigate failures before moving on."
  });
  ctx.tools.register(defineTool({
    name: "bash",
    description: bashDescription(backgroundEnabled, escalationModes),
    parameters: {
      command: { type: "string", required: true, description: "The bash command to execute." },
      description: {
        type: "string",
        required: true,
        description: 'Clear, concise description of what this command does in active voice, 5-10 words (shown in the UI). Examples: "ls" \u2192 "List files in current directory"; "git status" \u2192 "Show working tree status"; "npm install" \u2192 "Install package dependencies".'
      },
      timeoutMs: { type: "number", description: "Timeout in milliseconds. The executor applies its configured default and cap, and kills the command on expiry." },
      workdir: { type: "string", description: "Working directory for this command. Defaults to the session workspace; a relative path is resolved against it." },
      ...backgroundEnabled ? {
        run_in_background: { type: "boolean", description: "Run in the background and return a job id immediately (collect with job_output, stop with job_kill). No timeout applies." }
      } : {},
      ...escalationModes.length > 0 ? {
        sandbox_permissions: {
          type: "string",
          enum: [...escalationModes],
          description: "The wider sandbox mode this command needs. Only valid as a one-shot retry of a command the sandbox just denied; requires justification and user approval."
        },
        justification: {
          type: "string",
          description: "Required with sandbox_permissions: one sentence for the user explaining why this exact command needs the wider access."
        }
      } : {}
    },
    output: {
      schema: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: BACKGROUND_OUTPUT_PROPERTIES
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: { type: "string", required: true, const: "foreground" },
              exitCode: { required: true, oneOf: [{ type: "integer" }, { type: "null" }] },
              signal: { required: true, oneOf: [{ type: "string" }, { type: "null" }] },
              timedOut: { type: "boolean", required: true },
              aborted: { type: "boolean", required: true },
              timeoutMs: { type: "number", required: true },
              stdout: {
                type: "object",
                additionalProperties: false,
                required: true,
                properties: {
                  text: { type: "string", required: true },
                  truncated: { type: "boolean", required: true },
                  spillPath: { type: "string" }
                }
              },
              stderr: {
                type: "object",
                additionalProperties: false,
                required: true,
                properties: {
                  text: { type: "string", required: true },
                  truncated: { type: "boolean", required: true },
                  spillPath: { type: "string" }
                }
              },
              sandbox: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mode: { type: "string", required: true },
                  denied: { type: "boolean", required: true },
                  enforcement: { type: "string" },
                  runnerFailed: { type: "boolean" }
                }
              }
            }
          }
        ]
      },
      render: (_args, value) => [{
        type: "text",
        text: value.kind === "background" ? `started background job ${value.jobId}` : renderResult(value, escalationModes)
      }]
    },
    async execute(args, exec) {
      validateBashArgs(args);
      const standingPolicy = resolveSandboxPolicy(exec);
      const approvedMode = args.sandbox_permissions !== void 0 && args.justification !== void 0 ? await approveBashEscalation(args.sandbox_permissions, args.justification, exec, standingPolicy) : void 0;
      const policy = approvedMode === void 0 ? standingPolicy : { ...standingPolicy, mode: approvedMode };
      const workdir = resolveWorkdir(args.workdir, exec, standingPolicy?.workspaceRoot);
      const dshEnv = ctx.shellEnv.collect(exec);
      const request = {
        command: args.command,
        ...workdir !== void 0 ? { workdir } : {},
        ...args.timeoutMs !== void 0 ? { timeoutMs: args.timeoutMs } : {},
        dshEnv,
        ...policy !== void 0 ? { sandboxPolicy: policy } : {}
      };
      if (args.run_in_background === true) {
        if (!backgroundEnabled) {
          throw new Error("run_in_background is disabled for this deployment (enableRunInBackground: false)");
        }
        const jobs = ctx.get("jobs");
        if (jobs === void 0) {
          throw new Error("background jobs unavailable: load @deepseek-ai/dsh-jobs and @deepseek-ai/dsh-tool-jobs");
        }
        if (exec.signal.aborted) {
          const error = new HarnessError("tool call aborted", TOOL_ABORTED);
          error.name = "AbortError";
          throw error;
        }
        const id = jobs.start({
          kind: "bash",
          label: args.command,
          ...exec.agent ? { owner: exec.agent } : {},
          run: () => {
            const proc = ctx.shell.start(ctx.shell.resolve(request));
            return {
              cancel: () => void proc.kill(),
              done: proc.done.then(() => processOutcome(proc)),
              readOutput: () => renderProcessRead(proc.readOutput(), proc.sandbox, escalationModes)
            };
          }
        });
        return { kind: "background", jobId: id };
      }
      const result = await ctx.shell.run(ctx.shell.resolve({
        ...request,
        signal: exec.signal
      }));
      if (result.aborted) {
        const error = new HarnessError("tool call aborted", TOOL_ABORTED);
        error.name = "AbortError";
        throw error;
      }
      return { kind: "foreground", ...canonicalBashResult(result) };
    },
    presentCall: presentBashCall,
    presentResult: presentBashResult
  }));
}

// ../../source/deepseek-harness/packages/shell/shell-env/src/index.ts
var src_exports5 = {};
__export(src_exports5, {
  Config: () => Config4,
  ShellEnvRegistry: () => ShellEnvRegistry,
  apply: () => apply9,
  inject: () => inject9,
  name: () => name9
});
var name9 = "shell-env";
var inject9 = [];
var Config4 = src_default2.object({
  dshHome: src_default2.string()
});
var DSH_SHELL_KEY = `${DSH_ENV_PREFIX}SHELL`;
var DSH_SESSION_ID_KEY = `${DSH_ENV_PREFIX}SESSION_ID`;
var DSH_SESSION_JSONL_KEY = `${DSH_ENV_PREFIX}SESSION_JSONL`;
var RESERVED_BASH_ENV_KEYS = /* @__PURE__ */ new Set([
  DSH_HOME_ENV,
  DSH_SHELL_KEY,
  DSH_SESSION_ID_KEY
]);
var BASH_ENV_KEY_SUFFIX = /^[A-Z][A-Z0-9_]*$/;
var ShellEnvRegistry = class extends Service {
  contributors = /* @__PURE__ */ new Map();
  keyOwners = /* @__PURE__ */ new Map();
  dshHome;
  /**
   * Create and install the `ctx.shellEnv` service.
   * @param ctx - Cordis context that owns the service and registrations.
   * @param config - home-directory configuration for the built-in variables.
   */
  constructor(ctx, config = {}) {
    super(ctx, "shellEnv");
    this.dshHome = resolveDshHome(config.dshHome);
  }
  /**
   * Register one environment contributor. Names and keys are unique; built-in
   * keys are reserved. Registration is disposed with the calling plugin fiber.
   * @param contributor - declared key ownership and per-execution resolver.
   * @returns the disposer that unregisters the contribution.
   */
  register(contributor) {
    const dispose = this.ctx.effect(function* () {
      if (contributor.name.trim().length === 0) {
        throw new Error("bash env contributor name must be non-empty");
      }
      if (this.contributors.has(contributor.name)) {
        throw new Error(`bash env contributor "${contributor.name}" is already registered`);
      }
      const variables = Object.entries(contributor.variables);
      for (const [key, variable] of variables) {
        if (!key.startsWith(DSH_ENV_PREFIX) || !BASH_ENV_KEY_SUFFIX.test(key.slice(DSH_ENV_PREFIX.length))) {
          throw new Error(`bash env contributor "${contributor.name}" declared invalid key "${key}"`);
        }
        if (RESERVED_BASH_ENV_KEYS.has(key)) {
          throw new Error(`bash env contributor "${contributor.name}" cannot own reserved key "${key}"`);
        }
        if (variable.description.trim().length === 0) {
          throw new Error(`bash env contributor "${contributor.name}" must describe "${key}"`);
        }
        const owner = this.keyOwners.get(key);
        if (owner !== void 0) {
          throw new Error(`bash env key "${key}" is already owned by contributor "${owner}"; contributor "${contributor.name}" cannot also own it`);
        }
      }
      this.contributors.set(contributor.name, contributor);
      for (const [key] of variables) this.keyOwners.set(key, contributor.name);
      yield () => {
        this.contributors.delete(contributor.name);
        for (const [key] of variables) this.keyOwners.delete(key);
      };
    }.bind(this), "bashEnv.register()");
    return () => void dispose();
  }
  /**
   * Build the trusted `DSH_*` snapshot for one shell tool execution.
   * @param execution - the current tool execution.
   * @returns an immutable environment overlay containing built-ins and current contributions.
   */
  collect(execution) {
    const values = {
      [DSH_HOME_ENV]: this.dshHome,
      [DSH_SHELL_KEY]: "1"
    };
    if (execution.agent !== void 0) {
      values[DSH_SESSION_ID_KEY] = execution.agent.session.header.id;
    }
    for (const contributor of [...this.contributors.values()].sort((left, right) => left.name.localeCompare(right.name))) {
      const resolved = contributor.resolve(execution);
      for (const [rawKey, value] of Object.entries(resolved)) {
        const key = rawKey;
        if (!Object.hasOwn(contributor.variables, key)) {
          throw new Error(`bash env contributor "${contributor.name}" returned undeclared key "${key}"`);
        }
        if (typeof value !== "string") {
          throw new Error(`bash env contributor "${contributor.name}" returned a non-string value for "${key}"`);
        }
        values[key] = value;
      }
    }
    return Object.freeze(Object.fromEntries(Object.entries(values).sort(([left], [right]) => left.localeCompare(right))));
  }
  // TODO(bash-env-list-builtins): Include registry-owned built-ins before diagnostics,
  // prompt, or UI code treats list() as an exhaustive environment catalog.
  /**
   * Enumerate plugin-contributed variables without executing their resolvers.
   * @returns declarations sorted by environment variable name.
   */
  list() {
    return [...this.contributors.values()].flatMap((contributor) => Object.entries(contributor.variables).map(([key, variable]) => ({
      contributor: contributor.name,
      description: variable.description,
      key
    }))).sort((left, right) => left.key.localeCompare(right.key));
  }
};
function apply9(ctx, config = {}) {
  const registry = new ShellEnvRegistry(ctx, config);
  registry.register({
    name: "session-persistence",
    variables: {
      [DSH_SESSION_JSONL_KEY]: {
        description: "Absolute target path of the current session JSONL when the active persistence backend provides one."
      }
    },
    resolve(execution) {
      const agent = execution.agent;
      if (agent === void 0) return {};
      const location = ctx.get("sessionPersistence")?.locate(agent.session.header);
      return location?.kind === "jsonl" ? { [DSH_SESSION_JSONL_KEY]: location.path } : {};
    }
  });
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/index.ts
var src_exports6 = {};
__export(src_exports6, {
  Config: () => Config5,
  apply: () => apply10,
  discoverBaselineInstructionFiles: () => discoverBaselineInstructionFiles,
  loadBaselineInstructions: () => loadBaselineInstructions,
  name: () => name10,
  renderWorkspaceContext: () => renderWorkspaceContext
});
import { isDeepStrictEqual as isDeepStrictEqual2 } from "node:util";

// ../../source/deepseek-harness/packages/context/agent-instructions/src/config.ts
import { relative as relative2 } from "node:path";
var DEFAULT_PROJECT_ROOT_MARKERS = [".git"];
var DEFAULT_INSTRUCTION_FILE_CANDIDATES = ["AGENTS.md", "CLAUDE.md"];
var DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES = ["AGENTS.local.md", "CLAUDE.local.md"];
var DEFAULT_MAX_SOURCE_BYTES = 1048576;
var RESERVED_PATH_SEGMENTS = /* @__PURE__ */ new Set(["", ".", ".."]);
var Config5 = src_default2.object({
  dshHome: src_default2.string(),
  projectRootMarkers: src_default2.array(src_default2.string()).default([...DEFAULT_PROJECT_ROOT_MARKERS]),
  maxBytes: src_default2.number().required(),
  maxSourceBytes: src_default2.number().step(1).min(1).default(DEFAULT_MAX_SOURCE_BYTES),
  instructionFileCandidates: src_default2.array(src_default2.string()).default([...DEFAULT_INSTRUCTION_FILE_CANDIDATES]),
  localInstructionFileCandidates: src_default2.array(src_default2.string()).default([...DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES])
});
function workspaceBaselineIdentity(config, cwd, projectRoot) {
  return JSON.stringify({
    projectRoot: relative2(cwd, projectRoot),
    projectRootMarkers: config.projectRootMarkers,
    maxBytes: config.maxBytes,
    maxSourceBytes: config.maxSourceBytes,
    instructionFileCandidates: config.instructionFileCandidates,
    localInstructionFileCandidates: config.localInstructionFileCandidates
  });
}
function resolveConfig3(config) {
  return {
    ...resolveDiscoveryConfig(config),
    maxBytes: config.maxBytes,
    maxSourceBytes: config.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES
  };
}
function resolveDiscoveryConfig(config) {
  return {
    dshHome: resolveDshHome(config.dshHome),
    projectRootMarkers: config.projectRootMarkers ?? [...DEFAULT_PROJECT_ROOT_MARKERS],
    instructionFileCandidates: resolveInstructionFileCandidates(
      config.instructionFileCandidates,
      DEFAULT_INSTRUCTION_FILE_CANDIDATES
    ),
    localInstructionFileCandidates: resolveInstructionFileCandidates(
      config.localInstructionFileCandidates,
      DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES
    )
  };
}
function resolveInstructionFileCandidates(candidates, fallback) {
  return (candidates ?? [...fallback]).filter((candidate) => !RESERVED_PATH_SEGMENTS.has(candidate) && !/[\\/]/.test(candidate));
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/files.ts
import { createReadStream } from "node:fs";
import { stat as stat2 } from "node:fs/promises";
import { dirname as dirname4, isAbsolute as isAbsolute4, join as join3, relative as relative3, resolve as resolve4 } from "node:path";

// ../../source/deepseek-harness/packages/context/agent-instructions/src/digest.ts
import { createHash } from "node:crypto";
function instructionContentSha1(content) {
  return createHash("sha1").update(content).digest("hex");
}
function trimmedInstructionDigest(content) {
  return instructionContentSha1(content.trim());
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/render.ts
import { basename as basename2, dirname as dirname3 } from "node:path";
var SYSTEM_REMINDER_OPEN = "<system-reminder>";
var SYSTEM_REMINDER_CLOSE = "</system-reminder>";
var WORKSPACE_CONTEXT_INTRO = "The following workspace instructions may be relevant to your work. Use them as guidance when applicable. More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.";
var REPLACEMENT_WORKSPACE_CONTEXT_INTRO = "This complete workspace instruction baseline replaces all earlier workspace instruction baselines. " + WORKSPACE_CONTEXT_INTRO;
var EMPTY_REPLACEMENT_WORKSPACE_CONTEXT_INTRO = "This complete workspace instruction baseline replaces all earlier workspace instruction baselines. No workspace instructions are currently active.";
var COMPACT_WORKSPACE_CONTEXT_INTRO = "Workspace instructions were omitted or truncated to fit the configured byte budget.";
function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}
function truncateUtf8(value, maxBytes) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length <= maxBytes) return value;
  let end = Math.max(0, Math.trunc(maxBytes));
  while (end > 0 && (bytes.readUInt8(end) & 192) === 128) {
    end -= 1;
  }
  return bytes.subarray(0, end).toString("utf8");
}
function escapeInstructionFrameBody(body) {
  return body.replaceAll(SYSTEM_REMINDER_CLOSE, "<\\/system-reminder>");
}
function sectionText(file) {
  return `Instructions from: ${file.displayPath}

${file.content}`;
}
var USER_GLOBAL_DIRECTORY = "user-global";
var USER_GLOBAL_FILE = "AGENTS.md";
function scopeForDisplayPath(displayPath) {
  if (displayPath === "~/.dsh/AGENTS.md" || displayPath === "$DSH_HOME/AGENTS.md") return USER_GLOBAL_DIRECTORY;
  return dirname3(displayPath);
}
var SCOPE_SEPARATOR = "\0";
function candidateScopeKey(directory, candidateName) {
  return `${directory}${SCOPE_SEPARATOR}${candidateName}`;
}
function instructionScopeKey(displayPath) {
  return candidateScopeKey(scopeForDisplayPath(displayPath), basename2(displayPath));
}
function decodeScopeKey(scope2) {
  const separator = scope2.indexOf(SCOPE_SEPARATOR);
  if (separator < 0) return { directory: scope2, candidateName: "" };
  return { directory: scope2.slice(0, separator), candidateName: scope2.slice(separator + 1) };
}
function additionalSectionText(file) {
  const scope2 = scopeForDisplayPath(file.displayPath);
  return [
    `Additional instructions from: ${file.displayPath}`,
    "",
    `These instructions apply to work under \`${scope2}\`. Use them as guidance when relevant; more specific instructions take precedence. They do not override system, developer, or direct user instructions.`,
    "",
    file.content
  ].join("\n");
}
var BASELINE_RENDER_STYLE = { intro: WORKSPACE_CONTEXT_INTRO, section: sectionText };
function baselineRenderStyle(files, replacePreviousBaseline) {
  if (replacePreviousBaseline !== true) return BASELINE_RENDER_STYLE;
  return {
    ...BASELINE_RENDER_STYLE,
    intro: files.length === 0 ? EMPTY_REPLACEMENT_WORKSPACE_CONTEXT_INTRO : REPLACEMENT_WORKSPACE_CONTEXT_INTRO
  };
}
function changedSectionText(item) {
  const { change, file } = item;
  if (change.action === "set") return additionalSectionText(file);
  if (change.action === "remove") {
    return `Instructions removed: ${change.path}

The previously loaded instructions from this file no longer apply.`;
  }
  return [
    `Updated instructions from: ${change.path}`,
    "",
    "This file changed after it was loaded. Use the following content instead of the previously loaded instructions from this file.",
    "",
    file.content
  ].join("\n");
}
function renderInstructionChanges(items, maxBytes) {
  const byAbsolutePath = new Map(items.map((item) => [item.file.absolutePath, item]));
  const style = {
    intro: "",
    section(file) {
      const item = byAbsolutePath.get(file.absolutePath);
      return item === void 0 ? "" : changedSectionText({ ...item, file });
    }
  };
  const rendered = renderInstructionContext(items.map((item) => item.file), maxBytes, style);
  const represented = new Set(rendered.represented.map((file) => file.absolutePath));
  return {
    text: rendered.text,
    changes: items.filter((item) => represented.has(item.file.absolutePath)).map((item) => item.change)
  };
}
function markerText(maxBytes, omitted, truncated) {
  if (omitted.length === 0 && truncated.length === 0) return "";
  const parts = [];
  if (omitted.length > 0) {
    parts.push(`omitted ${omitted.map((file) => file.displayPath).join(", ")}`);
  }
  if (truncated.length > 0) {
    parts.push(`truncated ${truncated.map((item) => `${item.displayPath} from ${item.originalBytes} to ${item.includedBytes} bytes`).join(", ")}`);
  }
  return `Workspace instruction budget ${maxBytes} bytes: ${parts.join("; ")}`;
}
function buildInstructionText(files, maxBytes, omitted, truncated, style) {
  const marker = markerText(maxBytes, omitted, truncated);
  const body = [marker, style.intro, ...files.map((file) => style.section(file))].filter((block) => block.length > 0);
  return [SYSTEM_REMINDER_OPEN, escapeInstructionFrameBody(body.join("\n\n")), SYSTEM_REMINDER_CLOSE].join("\n");
}
function withTruncatedContent(file, includedBytes) {
  return { ...file, content: truncateUtf8(file.content, includedBytes) };
}
function truncateToFit(file, includedFiles, maxBytes, omitted, style) {
  const originalBytes = byteLength(file.content);
  let low = 0;
  let high = originalBytes;
  let best = withTruncatedContent(file, 0);
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = withTruncatedContent(file, mid);
    const truncated = [{ displayPath: file.displayPath, originalBytes, includedBytes: byteLength(candidate.content) }];
    const text = buildInstructionText([...includedFiles, candidate], maxBytes, omitted, truncated, style);
    if (byteLength(text) <= maxBytes) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}
function renderInstructionContext(files, maxBytes, style) {
  if (maxBytes <= 0 || !Number.isFinite(maxBytes)) {
    return { text: "", omitted: files, truncated: [], represented: [] };
  }
  const fullText = buildInstructionText(files, maxBytes, [], [], style);
  if (byteLength(fullText) <= maxBytes) {
    return { text: fullText, omitted: [], truncated: [], represented: files };
  }
  for (let start = 1; start < files.length; start += 1) {
    const included = files.slice(start);
    const omitted2 = files.slice(0, start).map((file) => ({ absolutePath: file.absolutePath, displayPath: file.displayPath }));
    const suffixText = buildInstructionText(included, maxBytes, omitted2, [], style);
    if (byteLength(suffixText) <= maxBytes) return { text: suffixText, omitted: omitted2, truncated: [], represented: included };
  }
  const mostSpecific = files.at(-1);
  if (mostSpecific === void 0) return { text: "", omitted: [], truncated: [], represented: [] };
  const omitted = files.slice(0, -1).map((file) => ({ absolutePath: file.absolutePath, displayPath: file.displayPath }));
  const originalBytes = byteLength(mostSpecific.content);
  for (const candidateStyle of [style, { ...style, intro: COMPACT_WORKSPACE_CONTEXT_INTRO }]) {
    const truncatedFile = truncateToFit(mostSpecific, [], maxBytes, omitted, candidateStyle);
    const includedBytes = byteLength(truncatedFile.content);
    const truncated2 = [{
      displayPath: mostSpecific.displayPath,
      originalBytes,
      includedBytes
    }];
    const text2 = buildInstructionText([truncatedFile], maxBytes, omitted, truncated2, candidateStyle);
    if (byteLength(text2) <= maxBytes) {
      const represented = includedBytes > 0 || originalBytes === 0 ? [mostSpecific] : [];
      return { text: text2, omitted, truncated: truncated2, represented };
    }
  }
  const truncated = [{
    displayPath: mostSpecific.displayPath,
    originalBytes,
    includedBytes: 0
  }];
  const compactNotice = escapeInstructionFrameBody(markerText(maxBytes, omitted, truncated));
  const compactWithHeading = escapeInstructionFrameBody(
    [compactNotice, style.section(withTruncatedContent(mostSpecific, 0))].join("\n\n")
  );
  if (byteLength(compactWithHeading) <= maxBytes) {
    const represented = originalBytes === 0 ? [mostSpecific] : [];
    return { text: compactWithHeading, omitted, truncated, represented };
  }
  const text = byteLength(compactNotice) <= maxBytes ? compactNotice : truncateUtf8(compactNotice, maxBytes);
  return { text, omitted, truncated, represented: [] };
}
function renderWorkspaceInstructionSet(files, options) {
  const style = baselineRenderStyle(files, options.replacePreviousBaseline);
  const { represented, ...rendered } = renderInstructionContext(files, options.maxBytes, style);
  return { rendered, included: represented };
}
function renderWorkspaceContext(files, options) {
  return renderWorkspaceInstructionSet(files, options).rendered;
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/files.ts
function signalOptions(signal) {
  return signal === void 0 ? void 0 : { signal };
}
function isMissingPathError(error) {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
}
async function nodeStatFile(path, signal) {
  try {
    signal?.throwIfAborted();
    const info = await stat2(path);
    signal?.throwIfAborted();
    if (!info.isFile()) return { kind: "absent" };
    return { kind: "present", info: { size: info.size } };
  } catch (error) {
    signal?.throwIfAborted();
    return isMissingPathError(error) ? { kind: "absent" } : { kind: "unavailable" };
  }
}
async function fsStatFile(path, fileSystem, signal) {
  try {
    const target = await fileSystem.resolve(path, signalOptions(signal));
    signal?.throwIfAborted();
    const info = await fileSystem.stat(target, signal);
    signal?.throwIfAborted();
    if (info?.type !== "file") return { kind: "absent" };
    return {
      kind: "present",
      info: { target, version: info.version, ...info.size === void 0 ? {} : { size: info.size } }
    };
  } catch {
    signal?.throwIfAborted();
    return { kind: "unavailable" };
  }
}
async function statFile(path, fileSystem, signal) {
  return fileSystem === void 0 ? nodeStatFile(path, signal) : fsStatFile(path, fileSystem, signal);
}
async function existsAsMarker(path, fileSystem, signal) {
  if (fileSystem !== void 0) {
    try {
      const target = await fileSystem.resolve(path, signalOptions(signal));
      return await fileSystem.stat(target, signal) !== void 0;
    } catch {
      signal?.throwIfAborted();
      return false;
    }
  }
  try {
    signal?.throwIfAborted();
    await stat2(path);
    signal?.throwIfAborted();
    return true;
  } catch {
    signal?.throwIfAborted();
    return false;
  }
}
async function findProjectRoot2(cwd, markers2, fileSystem, signal) {
  let current = resolve4(cwd);
  for (; ; ) {
    for (const marker of markers2) {
      if (await existsAsMarker(join3(current, marker), fileSystem, signal)) return current;
    }
    const parent = dirname4(current);
    if (parent === current) return resolve4(cwd);
    current = parent;
  }
}
function ancestorChain(root, cwd) {
  const chain = [];
  let current = resolve4(cwd);
  const resolvedRoot = resolve4(root);
  while (current !== resolvedRoot) {
    chain.push(current);
    const parent = dirname4(current);
    if (parent === current) break;
    current = parent;
  }
  chain.push(resolvedRoot);
  return chain.reverse();
}
function descendantDirsBetween(root, touchedPath) {
  const resolvedRoot = resolve4(root);
  const targetPath = isAbsolute4(touchedPath) ? resolve4(touchedPath) : resolve4(resolvedRoot, touchedPath);
  const targetDir = dirname4(targetPath);
  const rel = relative3(resolvedRoot, targetDir);
  if (rel.length === 0 || rel.startsWith("..") || isAbsolute4(rel)) return [];
  return ancestorChain(resolvedRoot, targetDir).slice(1);
}
function relativeDisplay(root, path) {
  return relative3(root, path);
}
async function allExistingInstructionFiles(dir, root, instructionFileCandidates, fileSystem, signal) {
  const found = [];
  for (const candidate of instructionFileCandidates) {
    const path = join3(dir, candidate);
    const probe = await statFile(path, fileSystem, signal);
    switch (probe.kind) {
      case "present":
        found.push({ absolutePath: path, displayPath: relativeDisplay(root, path), ...probe.info });
        continue;
      // A missing candidate is skipped; a transient provider failure skips only
      // that candidate so the remaining independent candidates still load.
      case "absent":
      case "unavailable":
        continue;
      /* v8 ignore next 2 -- StatFileProbe is closed; this arm only makes adding a kind a compile error. */
      default:
        assertNever(probe, "StatFileProbe");
    }
  }
  return found;
}
async function discoverInstructionFiles(options, fileSystem) {
  const config = resolveDiscoveryConfig(options);
  const files = [];
  const seen = /* @__PURE__ */ new Set();
  const addFile = (file) => {
    if (seen.has(file.absolutePath)) return;
    seen.add(file.absolutePath);
    files.push(file);
  };
  const userGlobal = join3(config.dshHome, USER_GLOBAL_FILE);
  const userGlobalProbe = await statFile(userGlobal, fileSystem, options.signal);
  switch (userGlobalProbe.kind) {
    case "present":
      addFile({
        absolutePath: userGlobal,
        displayPath: userGlobalDisplayPath(config.dshHome),
        ...userGlobalProbe.info
      });
      break;
    case "absent":
    case "unavailable":
      break;
    /* v8 ignore next 2 -- StatFileProbe is closed; this arm only makes adding a kind a compile error. */
    default:
      assertNever(userGlobalProbe, "StatFileProbe");
  }
  const cwd = resolve4(options.cwd);
  const projectRoot = options.projectRoot ?? await findProjectRoot2(cwd, config.projectRootMarkers, fileSystem, options.signal);
  for (const dir of ancestorChain(projectRoot, cwd)) {
    for (const candidates of [config.instructionFileCandidates, config.localInstructionFileCandidates]) {
      for (const file of await allExistingInstructionFiles(dir, projectRoot, candidates, fileSystem, options.signal)) {
        addFile(file);
      }
    }
  }
  return files;
}
async function discoverBaselineInstructionFiles(options) {
  return (await discoverInstructionFiles(options)).map(({ absolutePath, displayPath }) => ({ absolutePath, displayPath }));
}
async function* nodeTextChunks(path, signal) {
  const stream = createReadStream(path, { encoding: "utf8", signal });
  for await (const chunk of stream) yield String(chunk);
}
async function readBounded(file, maxSourceBytes, fileSystem, signal) {
  signal?.throwIfAborted();
  if (file.size !== void 0 && file.size > maxSourceBytes) return void 0;
  try {
    const chunks = fileSystem === void 0 || file.target === void 0 ? nodeTextChunks(file.absolutePath, signal) : await fileSystem.streamText(file.target, signal);
    const parts = [];
    let bytes = 0;
    for await (const chunk of chunks) {
      signal?.throwIfAborted();
      bytes += Buffer.byteLength(chunk, "utf8");
      if (bytes > maxSourceBytes) return void 0;
      parts.push(chunk);
    }
    signal?.throwIfAborted();
    return parts.join("");
  } catch {
    signal?.throwIfAborted();
    return void 0;
  }
}
function dedupInstructionFilesByDirectory(files) {
  const keptDigestsByDir = /* @__PURE__ */ new Map();
  const kept = [];
  for (const file of files) {
    const dir = dirname4(file.displayPath);
    let digests = keptDigestsByDir.get(dir);
    if (digests === void 0) {
      digests = /* @__PURE__ */ new Set();
      keptDigestsByDir.set(dir, digests);
    }
    const digest = trimmedInstructionDigest(file.content);
    if (digests.has(digest)) continue;
    digests.add(digest);
    kept.push(file);
  }
  return kept;
}
async function loadBaselineInstructions(options, fileSystem) {
  return (await loadBaselineInstructionSet(options, fileSystem))?.rendered;
}
async function loadBaselineInstructionSet(options, fileSystem) {
  const config = resolveConfig3(options);
  if (config.maxBytes <= 0 || !Number.isFinite(config.maxBytes)) return void 0;
  if (config.maxSourceBytes <= 0 || !Number.isFinite(config.maxSourceBytes)) return void 0;
  const discovered = await discoverInstructionFiles(options, fileSystem);
  const loaded = [];
  for (const file of discovered) {
    const content = await readBounded(file, config.maxSourceBytes, fileSystem, options.signal);
    if (content !== void 0) {
      loaded.push({
        absolutePath: file.absolutePath,
        displayPath: file.displayPath,
        content,
        ...file.version === void 0 ? {} : { version: file.version }
      });
    }
  }
  const deduped = dedupInstructionFilesByDirectory(loaded);
  if (deduped.length === 0) {
    if (options.replacePreviousBaseline !== true) return void 0;
    const { rendered: rendered2, included: included2 } = renderWorkspaceInstructionSet([], {
      maxBytes: config.maxBytes,
      replacePreviousBaseline: true
    });
    return {
      rendered: rendered2,
      observed: [],
      included: included2
    };
  }
  const { rendered, included } = renderWorkspaceInstructionSet(deduped, {
    maxBytes: config.maxBytes,
    ...options.replacePreviousBaseline === void 0 ? {} : { replacePreviousBaseline: options.replacePreviousBaseline }
  });
  return {
    rendered,
    observed: loaded,
    included
  };
}
async function probeScopeInstruction(scope2, projectRoot, resolved, fileSystem, signal) {
  const { directory, candidateName } = decodeScopeKey(scope2);
  const dir = directory === USER_GLOBAL_DIRECTORY ? resolved.dshHome : directory === "." ? projectRoot : join3(projectRoot, directory);
  const absolutePath = join3(dir, candidateName);
  let target;
  let info;
  try {
    target = await fileSystem.resolve(absolutePath, signalOptions(signal));
    info = await fileSystem.stat(target, signal);
  } catch {
    signal?.throwIfAborted();
    return { kind: "unavailable" };
  }
  if (info?.type !== "file") return { kind: "absent" };
  const file = {
    absolutePath,
    displayPath: directory === USER_GLOBAL_DIRECTORY ? userGlobalDisplayPath(resolved.dshHome) : relativeDisplay(projectRoot, absolutePath),
    target,
    version: info.version,
    ...info.size === void 0 ? {} : { size: info.size }
  };
  return { kind: "present", file };
}
async function readScopeInstruction(file, maxSourceBytes, fileSystem, signal) {
  const content = await readBounded(file, maxSourceBytes, fileSystem, signal);
  if (content === void 0) return void 0;
  return {
    absolutePath: file.absolutePath,
    displayPath: file.displayPath,
    content,
    version: file.version
  };
}
function userGlobalDisplayPath(dshHome) {
  return `${dshHomeDisplay(dshHome)}/AGENTS.md`;
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/state.ts
var name10 = "agent-instructions";
function workspaceContextHook(text, changes) {
  return createUserMessage({
    content: [{ type: "text", text }],
    source: { kind: "agent-instructions", form: "instructions", changes }
  });
}
function workspaceContextMessage(text) {
  return createUserMessage({
    content: [{ type: "text", text }],
    source: { kind: "plugin", plugin: name10 }
  });
}
function isWorkspaceContextSource(source) {
  return typeof source === "object" && source !== null && "kind" in source && source.kind === "agent-instructions" && "changes" in source && Array.isArray(source.changes);
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function workspaceInstructionChanges(source) {
  const changes = [];
  for (const value of source.changes) {
    if (!isRecord3(value)) continue;
    if (value.action !== "set" && value.action !== "replace" && value.action !== "remove") continue;
    if (typeof value.scope !== "string" || typeof value.path !== "string") continue;
    if (value.digest !== void 0 && typeof value.digest !== "string") continue;
    changes.push({
      action: value.action,
      scope: value.scope,
      path: value.path,
      ...value.digest !== void 0 ? { digest: value.digest } : {}
    });
  }
  return changes;
}
function sameInstructionChange(a, b) {
  return a.action === b.action && a.scope === b.scope && a.path === b.path && a.digest === b.digest;
}
function visibleInstructionChanges(agent, authorityMessages) {
  const visibleSeqs = new Set(agent.session.surface.nodes);
  const visible = /* @__PURE__ */ new Map();
  for (const [seq, event] of agent.session.events.entries()) {
    if (event.type !== "user/message" || !isWorkspaceContextSource(event.data.source)) continue;
    const changes = workspaceInstructionChanges(event.data.source);
    for (const change of changes) {
      if (visibleSeqs.has(seq)) visible.set(change.scope, change);
    }
  }
  for (const message of authorityMessages) {
    if (!isWorkspaceContextSource(message.source)) continue;
    for (const change of workspaceInstructionChanges(message.source)) {
      visible.set(change.scope, change);
    }
  }
  return visible;
}
function baselineInstructionState(files) {
  const changes = /* @__PURE__ */ new Map();
  const versions = /* @__PURE__ */ new Map();
  for (const file of files) {
    const digest = instructionContentSha1(file.content);
    const change = {
      action: "set",
      scope: instructionScopeKey(file.displayPath),
      path: file.displayPath,
      digest
    };
    changes.set(change.scope, change);
    if (file.version !== void 0) {
      versions.set(change.scope, {
        path: file.displayPath,
        version: file.version,
        digest,
        trimmedDigest: trimmedInstructionDigest(file.content)
      });
    }
  }
  return { changes, versions };
}
function versionStatesFor(session, cache) {
  let states = cache.get(session);
  if (states === void 0) {
    states = /* @__PURE__ */ new Map();
    cache.set(session, states);
  }
  return states;
}
function retainedInstructionVersionUpdates(updates, renderedChanges) {
  return updates.filter((update) => renderedChanges.some((change) => sameInstructionChange(update.change, change)));
}
function applyInstructionVersionUpdates(session, updates, cache) {
  if (updates.length === 0) return;
  const states = versionStatesFor(session, cache);
  for (const update of updates) {
    if (update.state === void 0) states.delete(update.change.scope);
    else states.set(update.change.scope, update.state);
  }
  if (states.size === 0) cache.delete(session);
}
function relativeScope(projectRoot, dir) {
  const scope2 = relativeDisplay(projectRoot, dir);
  return scope2.length === 0 ? "." : scope2;
}
async function reconcileInstructionContext(agent, resolved, versionCache, fileSystem, options) {
  const session = agent.session;
  const effective = visibleInstructionChanges(agent, options.authorityMessages);
  const cwd = session.header.cwd ?? process.cwd();
  const projectRoot = options.projectRoot ?? await findProjectRoot2(cwd, resolved.projectRootMarkers, fileSystem, options.signal);
  const scopes = /* @__PURE__ */ new Set();
  const baselineScopes = /* @__PURE__ */ new Set();
  const addDirScopes = (target, directory) => {
    for (const candidate of resolved.instructionFileCandidates) target.add(candidateScopeKey(directory, candidate));
    for (const candidate of resolved.localInstructionFileCandidates) target.add(candidateScopeKey(directory, candidate));
  };
  const addProjectScopes = (target, dir) => {
    addDirScopes(target, relativeScope(projectRoot, dir));
  };
  baselineScopes.add(candidateScopeKey(USER_GLOBAL_DIRECTORY, USER_GLOBAL_FILE));
  for (const dir of ancestorChain(projectRoot, cwd)) addProjectScopes(baselineScopes, dir);
  if (options.includeBaselineScopes) {
    for (const scope2 of baselineScopes) scopes.add(scope2);
  }
  for (const message of options.scopeMessages) {
    if (!isWorkspaceContextSource(message.source)) continue;
    for (const change of workspaceInstructionChanges(message.source)) {
      if (!options.includeBaselineScopes && baselineScopes.has(change.scope)) continue;
      scopes.add(change.scope);
    }
  }
  for (const scope2 of effective.keys()) {
    if (!options.includeBaselineScopes && baselineScopes.has(scope2)) continue;
    const { directory } = decodeScopeKey(scope2);
    if (directory === USER_GLOBAL_DIRECTORY) scopes.add(candidateScopeKey(USER_GLOBAL_DIRECTORY, USER_GLOBAL_FILE));
    else addDirScopes(scopes, directory);
  }
  for (const touchedPath of options.touchedPaths) {
    for (const dir of descendantDirsBetween(cwd, touchedPath)) addProjectScopes(scopes, dir);
  }
  const versions = versionStatesFor(session, versionCache);
  const seenAbsolutePaths = /* @__PURE__ */ new Set();
  const keptTrimmedByDir = /* @__PURE__ */ new Map();
  const registerKeptTrimmed = (directory, digest) => {
    let digests = keptTrimmedByDir.get(directory);
    if (digests === void 0) {
      digests = /* @__PURE__ */ new Set();
      keptTrimmedByDir.set(directory, digests);
    }
    if (digests.has(digest)) return true;
    digests.add(digest);
    return false;
  };
  const items = [];
  const versionUpdates = [];
  const pushRemoval = (scope2, path) => {
    const change = { action: "remove", scope: scope2, path };
    items.push({ change, file: { absolutePath: `removed:${scope2}`, displayPath: path, content: "" } });
    versionUpdates.push({ change });
  };
  const scopesByDirectory = /* @__PURE__ */ new Map();
  for (const scope2 of scopes) {
    const { directory } = decodeScopeKey(scope2);
    const directoryScopes = scopesByDirectory.get(directory);
    if (directoryScopes === void 0) scopesByDirectory.set(directory, [scope2]);
    else directoryScopes.push(scope2);
  }
  for (const [directory, directoryScopes] of scopesByDirectory) {
    const probedScopes = [];
    for (const scope2 of directoryScopes) {
      if (options.excludedBaselineScopes !== void 0 && baselineScopes.has(scope2) && options.excludedBaselineScopes.has(scope2)) {
        const previous = effective.get(scope2);
        if (previous === void 0 || previous.action === "remove") versions.delete(scope2);
        else pushRemoval(scope2, previous.path);
      } else {
        probedScopes.push(scope2);
      }
    }
    const itemStart = items.length;
    const versionUpdateStart = versionUpdates.length;
    const addedAbsolutePaths = [];
    const priorVersions = new Map(probedScopes.map((scope2) => [scope2, versions.get(scope2)]));
    for (const scope2 of probedScopes) {
      const previous = effective.get(scope2);
      const probe = await probeScopeInstruction(scope2, projectRoot, resolved, fileSystem, options.signal);
      if (probe.kind === "unavailable") {
        if (previous === void 0 || previous.action === "remove") continue;
        items.splice(itemStart);
        versionUpdates.splice(versionUpdateStart);
        for (const [candidateScope, prior] of priorVersions) {
          if (prior === void 0) versions.delete(candidateScope);
          else versions.set(candidateScope, prior);
        }
        for (const absolutePath of addedAbsolutePaths) seenAbsolutePaths.delete(absolutePath);
        keptTrimmedByDir.delete(directory);
        break;
      }
      if (probe.kind === "absent") {
        if (previous === void 0 || previous.action === "remove") versions.delete(scope2);
        else pushRemoval(scope2, previous.path);
        continue;
      }
      const { file: probedFile } = probe;
      if (seenAbsolutePaths.has(probedFile.absolutePath)) continue;
      seenAbsolutePaths.add(probedFile.absolutePath);
      addedAbsolutePaths.push(probedFile.absolutePath);
      const cached = versions.get(scope2);
      if (cached !== void 0 && cached.path === probedFile.displayPath && cached.version === probedFile.version && previous !== void 0 && previous.action !== "remove" && previous.path === cached.path && previous.digest === cached.digest) {
        if (registerKeptTrimmed(directory, cached.trimmedDigest)) pushRemoval(scope2, previous.path);
        continue;
      }
      const file = await readScopeInstruction(probedFile, resolved.maxSourceBytes, fileSystem, options.signal);
      if (file === void 0) continue;
      const currentDigest = instructionContentSha1(file.content);
      const trimmedDigest = trimmedInstructionDigest(file.content);
      if (registerKeptTrimmed(directory, trimmedDigest)) {
        if (previous !== void 0 && previous.action !== "remove") pushRemoval(scope2, previous.path);
        else versions.delete(scope2);
        continue;
      }
      const nextVersion = {
        path: file.displayPath,
        version: probedFile.version,
        digest: currentDigest,
        trimmedDigest
      };
      if (previous !== void 0 && previous.action !== "remove" && previous.path === file.displayPath && previous.digest === currentDigest) {
        versions.set(scope2, nextVersion);
        continue;
      }
      const action = previous === void 0 || previous.action === "remove" ? "set" : "replace";
      const change = {
        action,
        scope: scope2,
        path: file.displayPath,
        digest: currentDigest
      };
      items.push({ change, file });
      versionUpdates.push({ change, state: nextVersion });
    }
  }
  if (items.length === 0) return void 0;
  const rendered = renderInstructionChanges(items, resolved.maxBytes);
  if (rendered.text.length === 0 || rendered.changes.length === 0) return void 0;
  return {
    context: workspaceContextHook(rendered.text, rendered.changes),
    versionUpdates: retainedInstructionVersionUpdates(versionUpdates, rendered.changes)
  };
}

// ../../source/deepseek-harness/packages/context/agent-instructions/src/index.ts
function visibleBaselineSource(agent, authorityMessages) {
  for (const message of authorityMessages.toReversed()) {
    if (message.source.kind === "agent-instructions" && message.source.baseline === true) {
      return message.source;
    }
  }
  for (const seq of agent.session.surface.nodes.toReversed()) {
    const event = agent.session.events[seq];
    if (event?.type === "user/message" && event.data.source.kind === "agent-instructions" && event.data.source.baseline === true) return event.data.source;
  }
  return void 0;
}
function isWorkspaceContext(message) {
  return message.source.kind === "agent-instructions";
}
function sameContextPayload(left, right) {
  return isDeepStrictEqual2(left.content, right.content) && isDeepStrictEqual2(left.source, right.source);
}
var FILE_TOUCH_TOOL_NAMES = /* @__PURE__ */ new Set(["read", "write", "edit"]);
function filePathFromExecution(exec) {
  if (!FILE_TOUCH_TOOL_NAMES.has(exec.name)) return void 0;
  if (typeof exec.arguments !== "object" || exec.arguments === null) return void 0;
  if (!("file_path" in exec.arguments) || typeof exec.arguments.file_path !== "string") return void 0;
  const filePath = exec.arguments.file_path.trim();
  return filePath.length > 0 ? filePath : void 0;
}
function apply10(ctx, config) {
  const resolved = resolveConfig3(config);
  const instructionVersions = /* @__PURE__ */ new WeakMap();
  const baselinePreparations = /* @__PURE__ */ new WeakMap();
  const projectionLifecycle = new AbortController();
  const executionTouches = /* @__PURE__ */ new Map();
  ctx.effect(
    () => () => {
      projectionLifecycle.abort(new Error("agent-instructions disposed"));
      executionTouches.clear();
    },
    "agent-instructions.projectionLifecycle"
  );
  const projectionTails = /* @__PURE__ */ new WeakMap();
  const openSteps = /* @__PURE__ */ new WeakMap();
  const stepTouches = /* @__PURE__ */ new WeakMap();
  const compose = async (agent, signal, claimed, pending, touchedPaths = []) => {
    signal.throwIfAborted();
    if (resolved.maxBytes <= 0 || !Number.isFinite(resolved.maxBytes)) {
      return void 0;
    }
    const fileSystem = ctx.get("fs");
    if (fileSystem === void 0) return void 0;
    if (touchedPaths.length === 0 && pending.length > 0) return pending[0];
    const content = [];
    const changes = [];
    let desiredBaseline = false;
    const authorityMessages = [...claimed];
    const cwd = agent.session.header.cwd ?? process.cwd();
    const projectRoot = await findProjectRoot2(cwd, resolved.projectRootMarkers, fileSystem, signal);
    const identity = workspaceBaselineIdentity(resolved, cwd, projectRoot);
    const visibleBaseline = visibleBaselineSource(agent, authorityMessages);
    const baselinePresent = visibleBaseline !== void 0;
    const keepVisibleBaseline = visibleBaseline?.baselineIdentity === identity;
    const prepared = baselinePreparations.get(agent.session);
    let excludedBaselineScopes = keepVisibleBaseline && prepared?.identity === identity ? prepared.excludedScopes : void 0;
    let nextPreparation;
    if (!baselinePresent || !keepVisibleBaseline || excludedBaselineScopes === void 0) {
      const replacePreviousBaseline = baselinePresent && !keepVisibleBaseline;
      const instructions = await loadBaselineInstructionSet({
        cwd,
        dshHome: resolved.dshHome,
        projectRootMarkers: resolved.projectRootMarkers,
        maxBytes: resolved.maxBytes,
        maxSourceBytes: resolved.maxSourceBytes,
        instructionFileCandidates: resolved.instructionFileCandidates,
        localInstructionFileCandidates: resolved.localInstructionFileCandidates,
        projectRoot,
        replacePreviousBaseline,
        signal
      }, fileSystem);
      const baseline = baselineInstructionState(instructions?.included ?? []);
      const observedBaseline = baselineInstructionState(instructions?.observed ?? []);
      const excludedScopes = new Set(observedBaseline.changes.keys());
      for (const scope2 of baseline.changes.keys()) excludedScopes.delete(scope2);
      excludedBaselineScopes = excludedScopes;
      nextPreparation = { identity, excludedScopes };
      let versionStates = instructionVersions.get(agent.session);
      if (versionStates === void 0 && baseline.versions.size > 0) {
        versionStates = /* @__PURE__ */ new Map();
        instructionVersions.set(agent.session, versionStates);
      }
      for (const [scope2, state] of baseline.versions) versionStates?.set(scope2, state);
      if (!keepVisibleBaseline && instructions !== void 0 && instructions.rendered.text.length > 0) {
        const baselineContent = workspaceContextMessage(instructions.rendered.text).content;
        content.push(...baselineContent);
        const replacementScopes = new Set(baseline.changes.keys());
        const replacementRemovals = replacePreviousBaseline ? visibleBaseline.changes.flatMap((change) => change.action === "remove" || replacementScopes.has(change.scope) ? [] : [{ action: "remove", scope: change.scope, path: change.path }]) : [];
        const baselineChanges = [...replacementRemovals, ...baseline.changes.values()];
        changes.push(...baselineChanges);
        authorityMessages.push(createUserMessage({
          content: baselineContent,
          source: {
            kind: "agent-instructions",
            form: "instructions",
            baseline: true,
            baselineIdentity: identity,
            changes: baselineChanges
          }
        }));
        desiredBaseline = true;
      }
    }
    const update = await reconcileInstructionContext(
      agent,
      resolved,
      instructionVersions,
      fileSystem,
      {
        authorityMessages,
        scopeMessages: pending,
        includeBaselineScopes: keepVisibleBaseline,
        ...keepVisibleBaseline ? { excludedBaselineScopes } : {},
        touchedPaths,
        projectRoot,
        signal
      }
    );
    if (update !== void 0) {
      content.push(...update.context.content);
      if (update.context.source.kind === "agent-instructions") {
        changes.push(...update.context.source.changes);
      }
      applyInstructionVersionUpdates(agent.session, update.versionUpdates, instructionVersions);
    }
    if (nextPreparation !== void 0) baselinePreparations.set(agent.session, nextPreparation);
    if (content.length === 0) return void 0;
    return createUserMessage({
      content,
      source: {
        kind: "agent-instructions",
        form: "instructions",
        ...desiredBaseline ? { baseline: true } : {},
        ...desiredBaseline ? { baselineIdentity: identity } : {},
        changes
      }
    });
  };
  const syncInbox = (agent, claimed, desired) => {
    const pending = agent.inbox.nextStep.filter(isWorkspaceContext);
    const alreadySupplied = desired !== void 0 && (claimed.some((message) => sameContextPayload(message, desired)) || agent.session.surface.nodes.some((seq) => {
      const event = agent.session.events[seq];
      return event?.type === "user/message" && sameContextPayload(event.data, desired);
    }));
    if (desired === void 0 || alreadySupplied) {
      for (const message of pending) agent.inbox.remove(message.id);
      return;
    }
    const reusable = pending.find((message) => sameContextPayload(message, desired));
    if (reusable !== void 0) {
      for (const message of pending) {
        if (message !== reusable) agent.inbox.remove(message.id);
      }
      return;
    }
    const replaced = pending[0];
    if (replaced === void 0) agent.inbox.prepend("next-step", desired);
    else agent.inbox.replace(replaced.id, desired);
    for (const message of pending.slice(1)) agent.inbox.remove(message.id);
  };
  const composeAndSync = async (agent, signal, claimed, touchedPaths = []) => {
    const pending = agent.inbox.nextStep.filter(isWorkspaceContext);
    const desired = await compose(agent, signal, claimed, pending, touchedPaths);
    signal.throwIfAborted();
    syncInbox(agent, claimed, desired);
  };
  const queueProjection = (agent, touchedPath) => {
    const previous = projectionTails.get(agent) ?? Promise.resolve();
    const current = previous.then(() => composeAndSync(agent, projectionLifecycle.signal, [], [touchedPath])).catch((error) => {
      if (!projectionLifecycle.signal.aborted) ctx.logger.warn("workspace instruction refresh failed: %o", error);
    });
    projectionTails.set(agent, current);
    void current.then(() => {
      if (projectionTails.get(agent) === current) projectionTails.delete(agent);
    });
  };
  const waitForProjections = async (agent) => {
    let projection;
    while ((projection = projectionTails.get(agent)) !== void 0) await projection;
  };
  const stepIsOpen = (session) => {
    const known = openSteps.get(session);
    if (known !== void 0) return known;
    let open = false;
    for (const event of session.events) {
      if (event.type === "step/start") open = true;
      else if (event.type === "step/end" || event.type === "turn/end") open = false;
    }
    openSteps.set(session, open);
    return open;
  };
  const projectTouch = (touch) => {
    const session = touch.agent.session;
    if (!stepIsOpen(session)) {
      queueProjection(touch.agent, touch.path);
      return;
    }
    const pending = stepTouches.get(session);
    if (pending === void 0) stepTouches.set(session, [touch]);
    else pending.push(touch);
  };
  ctx.on("session/event", (session, event) => {
    if (event.type === "step/start") {
      openSteps.set(session, true);
      return;
    }
    if (event.type === "turn/end") {
      openSteps.set(session, false);
      return;
    }
    if (event.type !== "step/end") return;
    openSteps.set(session, false);
    const pending = stepTouches.get(session);
    if (pending === void 0) return;
    stepTouches.delete(session);
    for (const touch of pending) queueProjection(touch.agent, touch.path);
  });
  ctx.on("agent/pre-step", async ({ agent, messages, step, signal }, next) => {
    const decision = await next();
    await waitForProjections(agent);
    const pending = agent.inbox.nextStep.filter(isWorkspaceContext);
    const desired = await compose(agent, signal, messages, pending);
    signal.throwIfAborted();
    if (decision.kind === "reject" || step === 1 && decision.messages.length === 0) {
      syncInbox(agent, messages, desired);
      return decision;
    }
    for (const message of pending) agent.inbox.remove(message.id);
    if (desired === void 0 || decision.messages.some((message) => sameContextPayload(message, desired))) {
      return decision;
    }
    const lastClaimedIndex = decision.messages.findLastIndex((message) => messages.includes(message));
    const entered = decision.messages.toSpliced(lastClaimedIndex + 1, 0, desired);
    return { kind: "enter", messages: entered };
  });
  ctx.on("tools/result", (exec, result) => {
    const touches = executionTouches.get(exec.token) ?? [];
    executionTouches.delete(exec.token);
    if (!result.isError && exec.agent !== void 0 && !exec.signal.aborted) {
      const ownPath = filePathFromExecution(exec);
      if (ownPath !== void 0) touches.push({ agent: exec.agent, path: ownPath });
    }
    if (exec.parent !== void 0) {
      if (touches.length > 0) {
        const parentTouches = executionTouches.get(exec.parent);
        if (parentTouches === void 0) executionTouches.set(exec.parent, touches);
        else parentTouches.push(...touches);
      }
      return;
    }
    for (const touch of touches) projectTouch(touch);
  });
}

// ../../source/deepseek-harness/packages/skill/tool-skill/src/index.ts
var src_exports7 = {};
__export(src_exports7, {
  Config: () => Config6,
  apply: () => apply11,
  inject: () => inject10,
  name: () => name11
});
import { createHash as createHash2 } from "node:crypto";
var name11 = "tool-skill";
var inject10 = ["agents", "tools", "skills"];
var DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH = 500;
function catalogSourceEntries(skills, descriptionMaxLength) {
  return skills.map((skill) => ({
    name: skill.name,
    description: catalogDescription(skill.description, descriptionMaxLength)
  }));
}
var Config6 = src_default2.object({
  catalogDescriptionMaxLength: src_default2.number().default(DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH)
});
function apply11(ctx, config = {}) {
  const catalogDescriptionMaxLength = config.catalogDescriptionMaxLength ?? DEFAULT_CATALOG_DESCRIPTION_MAX_LENGTH;
  assertPositiveInteger5("catalogDescriptionMaxLength", catalogDescriptionMaxLength, 3);
  const skillTool = defineTool({
    name: "skill",
    description: "Load the full instructions for an available skill. Call this with the exact skill name from the session skill catalog before acting on a task that names or clearly matches that skill.",
    parameters: {
      name: { type: "string", required: true, description: "The exact skill name from the available skills list." }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", required: true },
          provider: { type: "string", required: true },
          resourceBase: {
            oneOf: [
              {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string", required: true, const: "directory" },
                  path: { type: "string", required: true }
                }
              },
              {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string", required: true, const: "url" },
                  url: { type: "string", required: true }
                }
              },
              {
                type: "object",
                additionalProperties: false,
                properties: {
                  kind: { type: "string", required: true, const: "opaque" },
                  description: { type: "string", required: true }
                }
              }
            ]
          },
          content: { type: "string", required: true }
        }
      },
      render: (_args, value) => [{ type: "text", text: renderSkillContent(value) }]
    },
    async execute(args, exec) {
      if (!isSkillName(args.name)) {
        throw new Error(`invalid skill name "${args.name}"`);
      }
      const lookup = { cwd: exec.agent?.session.header.cwd, signal: exec.signal, scope: exec.agent };
      const summary = (await ctx.skills.list(lookup)).find((skill2) => skill2.name === args.name);
      if (!summary) {
        throw new Error(`skill "${args.name}" is unknown or no longer available`);
      }
      if (!isModelInvocable(summary)) {
        throw new Error(`skill "${args.name}" is not available for model invocation`);
      }
      const skill = await ctx.skills.get(args.name, lookup);
      if (!skill) {
        throw new Error(`skill "${args.name}" is unknown or no longer available`);
      }
      if (!isModelInvocable(skill)) {
        throw new Error(`skill "${args.name}" is not available for model invocation`);
      }
      return {
        name: skill.name,
        provider: skill.provider,
        ...skill.resourceBase !== void 0 ? {
          resourceBase: { ...skill.resourceBase }
        } : {},
        content: skill.content
      };
    },
    presentCall(args) {
      return { card: "generic", title: `Load skill ${args.name}`, kind: "read", rawInput: args.name };
    }
  });
  ctx.tools.register(skillTool);
  ctx.on("agent/pre-step", async ({ agent, messages, signal }, next) => {
    const decision = await next();
    if (decision.kind === "reject") return decision;
    const names = invokedSkillNames(messages);
    if (names.length === 0) return decision;
    signal.throwIfAborted();
    const lookup = { cwd: agent.session.header.cwd, signal, scope: agent };
    const injections = [];
    for (const name15 of names) {
      const skill = await ctx.skills.get(name15, lookup);
      signal.throwIfAborted();
      if (skill === void 0 || !isUserInvocable(skill)) continue;
      const source = { kind: "skill-invocation", name: name15, form: "instructions" };
      injections.push(createUserMessage({
        content: [{ type: "text", text: renderSkillContent(skill) }],
        source
      }));
    }
    if (injections.length === 0) return decision;
    return { kind: "enter", messages: [...decision.messages, ...injections] };
  });
  ctx.on("agent/pre-step", async ({ agent, signal }, next) => {
    const decision = await next();
    if (decision.kind === "reject") return decision;
    signal.throwIfAborted();
    const toolVisible = ctx.tools.get(skillTool.name, agent) === skillTool;
    const snapshot = toolVisible ? await ctx.skills.snapshot({ cwd: agent.session.header.cwd, signal, scope: agent }) : { skills: [], complete: true };
    signal.throwIfAborted();
    if (!snapshot.complete) return decision;
    const skills = snapshot.skills.filter(isModelInvocable);
    const entries = catalogSourceEntries(skills, catalogDescriptionMaxLength);
    const digest = digestCatalogEntries(entries);
    const history = catalogHistory(agent);
    const existing = catalogMessage(decision.messages);
    if (history.visibleDigest === digest) {
      return existing === void 0 ? decision : { kind: "enter", messages: decision.messages.filter((message) => message.id !== existing.message.id) };
    }
    if (existing !== void 0 && digestCatalogEntries(existing.entries) === digest) return decision;
    if (!history.published && skills.length === 0) {
      return existing === void 0 ? decision : { kind: "enter", messages: decision.messages.filter((message) => message.id !== existing.message.id) };
    }
    const catalog = history.published ? renderCatalogUpdate(entries) : renderCatalogMessage(entries);
    return {
      kind: "enter",
      messages: existing === void 0 ? [...decision.messages, catalog] : decision.messages.map((message) => message.id === existing.message.id ? catalog : message)
    };
  });
}
function renderCatalogMessage(entries) {
  return createUserMessage({
    content: [{
      type: "text",
      text: [
        "<system-reminder>",
        "A skill is a reusable set of task-specific instructions. The following skills are available in this session:",
        "",
        "<available_skills>",
        ...renderCatalogEntries(entries),
        "</available_skills>",
        "",
        "If the user names a skill, or the task clearly matches a skill's description, call the `skill` tool with the exact skill name before taking task actions. Load all applicable skills, then follow their full instructions. This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.",
        "A user may also invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool again for that skill.",
        "</system-reminder>"
      ].join("\n")
    }],
    source: {
      kind: "skill-catalog",
      form: "catalog",
      entries
    }
  });
}
function renderCatalogUpdate(entries) {
  const availability = entries.length === 0 ? [
    "No skills are currently available through the `skill` tool. Do not use names from earlier skill catalogs.",
    "A user may still invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool for it."
  ] : [
    "Use only names in this replacement catalog. If the user names a listed skill, or the task clearly matches its description, call the `skill` tool with the exact name before acting.",
    "A user may also invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the `skill` tool again for that skill."
  ];
  return createUserMessage({
    content: [{
      type: "text",
      text: [
        "<system-reminder>",
        "The available skill catalog changed. This complete catalog replaces every earlier available-skills list in this session:",
        "",
        "<available_skills>",
        ...renderCatalogEntries(entries),
        "</available_skills>",
        "",
        ...availability,
        "</system-reminder>"
      ].join("\n")
    }],
    source: {
      kind: "skill-catalog",
      form: "catalog",
      update: true,
      entries
    }
  });
}
function renderCatalogEntries(entries) {
  return entries.map((entry) => `- \`${entry.name}\`: ${escapeText(entry.description)}`);
}
function digestCatalogEntries(entries) {
  const canonical = entries.map((entry) => JSON.stringify([entry.name, entry.description])).join("\n");
  return createHash2("sha256").update(canonical).digest("hex");
}
function readCatalogEntries(source) {
  const entries = source.entries;
  if (!Array.isArray(entries)) return void 0;
  const readable = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) return void 0;
    const { name: name15, description } = entry;
    if (typeof name15 !== "string" || name15 === "" || typeof description !== "string") return void 0;
    readable.push({ name: name15, description });
  }
  return readable;
}
function catalogHistory(agent) {
  const visible = new Set(agent.session.surface.nodes);
  const events = agent.session.events;
  let published = false;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type !== "user/message" || event.data.source.kind !== "skill-catalog") continue;
    const entries = readCatalogEntries(event.data.source);
    if (entries === void 0) continue;
    const digest = digestCatalogEntries(entries);
    published = true;
    if (visible.has(event.seq)) return { visibleDigest: digest, published };
  }
  return { published };
}
function catalogMessage(messages) {
  for (const message of messages) {
    if (message.source.kind !== "skill-catalog") continue;
    const entries = readCatalogEntries(message.source);
    if (entries !== void 0) return { message, entries };
  }
  return void 0;
}
function catalogDescription(value, maxLength) {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
}
function assertPositiveInteger5(name15, value, minimum = 1) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`tool-skill: ${name15} must be an integer greater than or equal to ${minimum}`);
  }
}
var SKILL_GESTURE = /(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g;
function invokedSkillNames(messages) {
  const names = [];
  for (const message of messages) {
    if (message.source.kind !== "user") continue;
    for (const block of message.content) {
      if (block.type !== "text") continue;
      for (const match of block.text.matchAll(SKILL_GESTURE)) {
        const name15 = match[2];
        if (name15 !== void 0 && !names.includes(name15)) names.push(name15);
      }
    }
  }
  return names;
}

// ../../source/deepseek-harness/packages/jobs/tool-jobs/src/index.ts
var src_exports8 = {};
__export(src_exports8, {
  Config: () => Config7,
  apply: () => apply12,
  inject: () => inject11,
  name: () => name12,
  statusLine: () => statusLine
});

// ../../source/deepseek-harness/packages/util/output-retention/src/index.ts
function assertBudget(value, name15) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name15} must be a non-negative integer`);
  }
}
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function trimTrailingPartialUtf8(bytes) {
  let i = bytes.length - 1;
  while (i >= 0 && (bytes[i] & 192) === 128 && bytes.length - i <= 3) i--;
  if (i < 0) return bytes;
  const lead = bytes[i];
  const expected = lead < 128 ? 1 : lead < 224 ? 2 : lead < 240 ? 3 : lead < 248 ? 4 : 0;
  if (expected === 0) return bytes;
  return bytes.length - i < expected ? bytes.subarray(0, i) : bytes;
}
function trimLeadingContinuationUtf8(bytes) {
  let i = 0;
  while (i < bytes.length && (bytes[i] & 192) === 128) i++;
  return bytes.subarray(i);
}
var TextRetainer = class {
  prefixCap;
  suffixCap;
  prefixChunks = [];
  prefixHeld = 0;
  suffixChunks = [];
  suffixHeld = 0;
  total = 0;
  /** @param strategy One {@link TextRetentionStrategy} variant; byte budgets must be non-negative integers. */
  constructor(strategy) {
    switch (strategy.kind) {
      case "head":
        assertBudget(strategy.maxBytes, "maxBytes");
        this.prefixCap = strategy.maxBytes;
        this.suffixCap = 0;
        break;
      case "tail":
        assertBudget(strategy.maxBytes, "maxBytes");
        this.prefixCap = 0;
        this.suffixCap = strategy.maxBytes;
        break;
      case "headTail":
        assertBudget(strategy.headBytes, "headBytes");
        assertBudget(strategy.tailBytes, "tailBytes");
        this.prefixCap = strategy.headBytes;
        this.suffixCap = strategy.tailBytes;
        break;
    }
  }
  /**
   * Offer one chunk (a `Uint8Array`, or a `string` encoded as UTF-8). Prefix
   * bytes fill up to the prefix cap then stop; suffix bytes roll so only the
   * last `suffixCap` bytes are retained. `kept` is `true` only when no byte of
   * this chunk was dropped.
   *
   * @param chunk The next bytes of the stream (`Uint8Array` or UTF-8 `string`).
   * @returns The per-push {@link PushDecision}.
   */
  push(chunk) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    const before = this.total;
    this.total += bytes.length;
    const room = this.prefixCap - this.prefixHeld;
    const take = Math.max(0, Math.min(room, bytes.length));
    if (take > 0) {
      this.prefixChunks.push(bytes.subarray(0, take));
      this.prefixHeld += take;
    }
    if (this.suffixCap > 0) {
      this.suffixChunks.push(bytes);
      this.suffixHeld += bytes.length;
      let head = this.suffixChunks[0];
      while (head !== void 0 && this.suffixHeld - head.length >= this.suffixCap) {
        this.suffixChunks.shift();
        this.suffixHeld -= head.length;
        head = this.suffixChunks[0];
      }
      if (head !== void 0 && this.suffixHeld > this.suffixCap) {
        const excess = this.suffixHeld - this.suffixCap;
        this.suffixChunks[0] = head.subarray(excess);
        this.suffixHeld -= excess;
      }
    }
    const droppedThisChunk = this.omittedAt(this.total) > this.omittedAt(before);
    return {
      kept: !droppedThisChunk,
      truncated: this.omittedAt(this.total) > 0
    };
  }
  /** Bytes omitted once `total` bytes have been seen: `total − keptPrefix − keptSuffix`. */
  omittedAt(total) {
    const prefixLen = Math.min(total, this.prefixCap);
    const suffixLen = Math.min(total - prefixLen, this.suffixCap);
    return total - prefixLen - suffixLen;
  }
  /**
   * Finalize: decode the retained prefix and suffix (each trimmed to a UTF-8
   * boundary at its cut) and report the exact omitted byte count.
   *
   * @returns The {@link RetainedText} snapshot (safe to hand to a formatter).
   */
  finish() {
    const prefixLen = Math.min(this.total, this.prefixCap);
    const suffixLen = Math.min(this.total - prefixLen, this.suffixCap);
    const prefix = concat(this.prefixChunks);
    const suffix = concat(this.suffixChunks).subarray(this.suffixHeld - suffixLen);
    const budgetOmitted = this.omittedAt(this.total);
    const [keptPrefix, keptSuffix] = budgetOmitted > 0 ? [trimTrailingPartialUtf8(prefix), trimLeadingContinuationUtf8(suffix)] : [prefix, suffix];
    const text = budgetOmitted > 0 ? decoder.decode(keptPrefix) + decoder.decode(keptSuffix) : decoder.decode(concat([prefix, suffix]));
    const omitted = this.total - keptPrefix.length - keptSuffix.length;
    const truncated = omitted > 0;
    return {
      text,
      truncated,
      omittedBytes: truncated ? { kind: "exact", count: omitted } : { kind: "none" }
    };
  }
};
function concat(chunks) {
  let length = 0;
  for (const chunk of chunks) length += chunk.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// ../../source/deepseek-harness/packages/jobs/tool-jobs/src/index.ts
var name12 = "tool-jobs";
var inject11 = ["tools", "jobs", "systemPrompt"];
var Config7 = src_default2.object({
  waitTimeoutMs: src_default2.number().min(1).default(3e4),
  maxWaitTimeoutMs: src_default2.number().min(1).default(6e5),
  completionDelivery: src_default2.union(["quiet", "wakeup"]).default("wakeup"),
  maxConsecutiveWakes: src_default2.number().min(1).default(3)
});
var PUBLIC_TASK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", required: true },
    kind: { type: "string", required: true },
    label: { type: "string", required: true },
    status: {
      type: "string",
      required: true,
      enum: ["running", "stopping", "completed", "killed", "failed"]
    },
    detail: { type: "string" },
    startedAt: { type: "integer", required: true },
    finishedAt: { type: "integer" }
  }
};
function publicJob(snapshot) {
  return {
    id: snapshot.id,
    kind: snapshot.kind,
    label: snapshot.label,
    status: snapshot.status,
    ...snapshot.detail !== void 0 ? { detail: snapshot.detail } : {},
    startedAt: snapshot.startedAt,
    ...snapshot.finishedAt !== void 0 ? { finishedAt: snapshot.finishedAt } : {}
  };
}
function statusLine(snapshot) {
  return snapshot.detail !== void 0 ? `[status: ${snapshot.status}, ${snapshot.detail}]` : `[status: ${snapshot.status}]`;
}
var encoder2 = new TextEncoder();
function retainTail(text, maxBytes) {
  const retainer = new TextRetainer({ kind: "tail", maxBytes });
  retainer.push(text);
  return retainer.finish().text;
}
function retainHead(text, maxBytes) {
  const retainer = new TextRetainer({ kind: "head", maxBytes });
  retainer.push(text);
  return retainer.finish().text;
}
function fitWithSuffix(content, suffix, maxBytes, omitted) {
  const complete = `${content}${suffix}`;
  if (maxBytes === void 0 || encoder2.encode(complete).byteLength <= maxBytes) return complete;
  const fixed = `${content.endsWith(omitted.trimStart()) ? "" : omitted}${suffix}`;
  const fixedBytes = encoder2.encode(fixed).byteLength;
  if (fixedBytes >= maxBytes) return retainTail(fixed, maxBytes);
  return `${retainTail(content, maxBytes - fixedBytes)}${fixed}`;
}
function completionSummary(snapshot) {
  return boundContextSummary(`${snapshot.kind} ${snapshot.label} ${statusLine(snapshot)}`);
}
function fitCompletionNotice(snapshot) {
  const prefix = `background job ${snapshot.id}`;
  const detail = ` (${snapshot.kind}: ${snapshot.label}) finished ${statusLine(snapshot)}`;
  const action = "\nDone; job_output.";
  const complete = `${prefix}${detail}. Read its output with job_output.`;
  const maxBytes = snapshot.outputLimitBytes;
  if (maxBytes === void 0 || encoder2.encode(complete).byteLength <= maxBytes) return complete;
  const omitted = "\n[notice truncated]";
  const fixed = `${prefix}${omitted}${action}`;
  const fixedBytes = encoder2.encode(fixed).byteLength;
  if (fixedBytes <= maxBytes) {
    return fixedBytes === maxBytes ? fixed : `${prefix}${retainHead(detail, maxBytes - fixedBytes)}${omitted}${action}`;
  }
  const compact = `${prefix}${action}`;
  const compactBytes = encoder2.encode(compact).byteLength;
  if (compactBytes <= maxBytes) return compact;
  const actionBytes = encoder2.encode(action).byteLength;
  if (actionBytes >= maxBytes) return retainTail(action, maxBytes);
  return `${retainHead(prefix, maxBytes - actionBytes)}${action}`;
}
function rawSingleText(content) {
  if (content.length !== 1) return void 0;
  const block = content[0];
  if (block?.type !== "text") return void 0;
  return block.text;
}
function boundSingleText(content, maxBytes) {
  const text = rawSingleText(content);
  if (text === void 0) return void 0;
  return [{
    type: "text",
    text: fitWithSuffix(text, "", maxBytes, "\n[result truncated]")
  }];
}
function visibleOutputLimit(ctx, exec) {
  if (exec.name !== "job_output" && exec.name !== "job_kill") return void 0;
  const jobId = exec.arguments?.job_id;
  if (typeof jobId !== "string" || jobId.length === 0) return void 0;
  return ctx.jobs.list(exec.agent).find((snapshot) => snapshot.id === jobId)?.outputLimitBytes;
}
function validateJobId(value) {
  if (value.length === 0) {
    throw new Error(`invalid job_id: expected a non-empty string, got ${JSON.stringify(value)}`);
  }
  return JobId(value);
}
function presentTaskCall(title, kind, rawInput) {
  return { card: "generic", title, kind, ...rawInput !== void 0 ? { rawInput } : {} };
}
function apply12(ctx, config) {
  const waitDefault = config.waitTimeoutMs ?? 3e4;
  const waitCap = config.maxWaitTimeoutMs ?? 6e5;
  const delivery = config.completionDelivery ?? "wakeup";
  const wakeBudget = config.maxConsecutiveWakes ?? 3;
  const spentWakes = /* @__PURE__ */ new WeakMap();
  if (waitDefault > waitCap) {
    throw new Error(`tool-jobs: waitTimeoutMs (${waitDefault}) exceeds maxWaitTimeoutMs (${waitCap})`);
  }
  if (!Number.isSafeInteger(wakeBudget)) {
    throw new Error(`tool-jobs: maxConsecutiveWakes (${wakeBudget}) must be a whole number of turns`);
  }
  if (delivery === "wakeup") {
    ctx.on("agent/inbox/claimed", ({ agent, message }) => {
      if (message.source.kind === "user") spentWakes.delete(agent);
    });
  }
  const outputLimits = /* @__PURE__ */ new WeakMap();
  ctx.on("tools/pre-execute", (exec, next) => {
    const maxBytes = visibleOutputLimit(ctx, exec);
    if (maxBytes !== void 0) outputLimits.set(exec, maxBytes);
    return next();
  }, { prepend: true });
  const finalizeTaskContent = (exec, result) => {
    const maxBytes = outputLimits.get(exec) ?? visibleOutputLimit(ctx, exec);
    outputLimits.delete(exec);
    if (maxBytes === void 0) return void 0;
    if (exec.name === "job_output" && !result.isError) {
      const value = result.value;
      const body = value.text.length > 0 ? value.text : "(no new output)";
      const content = body.endsWith("\n") ? body.slice(0, -1) : body;
      const suffix = `
${statusLine(value.job)}`;
      if (rawSingleText(result.content) === `${content}${suffix}`) {
        return [{
          type: "text",
          text: fitWithSuffix(content, suffix, maxBytes, "\n[output truncated]")
        }];
      }
    }
    return boundSingleText(result.content, maxBytes);
  };
  ctx.jobs.attachController("tool-jobs");
  ctx.systemPrompt.section({
    name: "tool:jobs",
    order: 106,
    text: "Track every background job id you start. You are notified in-session when a job finishes \u2014 do not busy-poll or sleep on one; keep working on independent steps and do not duplicate a running job's work. Before giving a final answer, collect every still-relevant job with job_output (set wait: true only when you are genuinely blocked on it), and job_kill jobs that stopped mattering."
  });
  ctx.jobs.onJobDone((snapshot, owner) => {
    if (snapshot.reported || owner === void 0) return;
    const message = createUserMessage({
      content: [{
        type: "text",
        text: fitCompletionNotice(snapshot)
      }],
      source: {
        kind: "plugin",
        plugin: "tool-jobs",
        form: "notice",
        summary: completionSummary(snapshot)
      }
    });
    const spent = spentWakes.get(owner) ?? 0;
    if (delivery === "wakeup" && owner.status === "idle" && spent < wakeBudget) {
      spentWakes.set(owner, spent + 1);
      owner.followup(message);
      return;
    }
    owner.inject(message);
  });
  ctx.tools.register(defineTool({
    name: "job_output",
    description: "Read a background job. Stream jobs return only output since the previous read; final-output jobs return their result after settlement. Every response ends with `[status: ...]`. Reads are non-blocking unless `wait: true`, which waits up to the configured cap.",
    // A timed-out wait returns job state rather than a TOOL_TIMEOUT error, so
    // this tool owns its deadline instead of using ToolDefinition.timeoutMs.
    parameters: {
      job_id: { type: "string", required: true, description: "Job id returned by the tool that started the background work." },
      wait: { type: "boolean", description: "Block until the job reaches a terminal status or the timeout expires. A timed-out wait returns [status: running] and leaves the job alive." },
      timeout_ms: { type: "number", description: "Max wait in milliseconds (only meaningful with wait: true). Defaults to the configured wait timeout; capped by the configured maximum." }
    },
    finalizeContent: finalizeTaskContent,
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", required: true },
          job: { ...PUBLIC_TASK_SCHEMA, required: true }
        }
      },
      render: (_args, value) => {
        const body = value.text.length > 0 ? value.text : "(no new output)";
        const separator = body.endsWith("\n") ? "" : "\n";
        return [{ type: "text", text: `${body}${separator}${statusLine(value.job)}` }];
      }
    },
    async execute(args, exec) {
      const id = validateJobId(args.job_id);
      if (args.wait === true) {
        const timeout = Math.min(args.timeout_ms ?? waitDefault, waitCap);
        await ctx.jobs.wait(id, timeout, exec.agent, exec.signal);
      }
      const read = ctx.jobs.read(id, exec.agent);
      return { text: read.text, job: publicJob(read.snapshot) };
    },
    presentCall: (args) => presentTaskCall(`Read output from background job ${args.job_id}`, "read", args.job_id)
  }));
  ctx.tools.register(defineTool({
    name: "job_list",
    description: "List your background jobs (running and finished) with their ids, kinds, and statuses.",
    parameters: {},
    output: {
      schema: { type: "array", items: PUBLIC_TASK_SCHEMA },
      render: (_args, jobs) => [{
        type: "text",
        text: jobs.length === 0 ? "(no background jobs)" : jobs.map((t) => `${t.id} [${t.kind}] ${t.status} \u2014 ${t.label}`).join("\n")
      }]
    },
    execute(_args, exec) {
      const jobs = ctx.jobs.list(exec.agent);
      return Promise.resolve(jobs.map(publicJob));
    },
    presentCall: () => presentTaskCall("List background jobs", "read")
  }));
  ctx.tools.register(defineTool({
    name: "job_kill",
    description: "Request cancellation of a running background job by job id. Returns immediately; the job settles as killed once its work actually stops.",
    parameters: {
      job_id: { type: "string", required: true, description: "Job id returned by the tool that started the background work." },
      reason: { type: "string", description: "Optional short reason, recorded in the log and forwarded to the job." }
    },
    finalizeContent: finalizeTaskContent,
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          outcome: {
            type: "string",
            required: true,
            enum: ["cancellation-requested", "already-finished"]
          },
          job: { ...PUBLIC_TASK_SCHEMA, required: true }
        }
      },
      render: (_args, value) => [{
        type: "text",
        text: value.outcome === "already-finished" ? `job ${value.job.id} had already finished ${statusLine(value.job)}` : `requested cancellation of job ${value.job.id}`
      }]
    },
    execute(args, exec) {
      const id = validateJobId(args.job_id);
      const result = ctx.jobs.kill(id, exec.agent, args.reason);
      const snapshot = publicJob(ctx.jobs.get(id, exec.agent));
      return Promise.resolve({
        outcome: result === "already-finished" ? "already-finished" : "cancellation-requested",
        job: snapshot
      });
    },
    presentCall: (args) => presentTaskCall(`Kill background job ${args.job_id}`, "execute", args.job_id)
  }));
}

// ../../source/deepseek-harness/packages/core/agent-loop/src/index.ts
import { randomUUID as randomUUID2 } from "node:crypto";

// ../../source/deepseek-harness/packages/core/agent-loop/src/runtime-context.ts
var SOURCE = "@deepseek-ai/dsh-system-prompt";
var CLEARED = "Current runtime context: none. Earlier runtime-context snapshots no longer apply.";
function isOwned(message) {
  return message.source.kind === "plugin" && message.source.plugin === SOURCE;
}
function textOf(message) {
  const [block] = message.content;
  return message.content.length === 1 && block?.type === "text" ? block.text : void 0;
}
var RuntimeContextProjection = class {
  /** `undefined` means no snapshot ever existed; `null` means none is retained. */
  retained;
  /**
   * Restore projection state once, then follow authoritative session events.
   * @param ctx - agent-scoped event context.
   * @param session - session receiving projected messages.
   */
  constructor(ctx, session) {
    const surface = new Set(session.surface.nodes);
    for (let index = session.events.length - 1; index >= 0; index -= 1) {
      const event = session.events[index];
      if (event?.type !== "user/message" || !isOwned(event.data)) continue;
      this.retained ??= null;
      if (surface.has(event.seq)) {
        this.retained = { seq: event.seq, text: textOf(event.data) };
        break;
      }
    }
    ctx.on("session/event", (subject, event) => {
      if (subject !== session) return;
      if (event.type === "user/message" && isOwned(event.data)) {
        this.retained = { seq: event.seq, text: textOf(event.data) };
      } else if (this.retained && isReplacementSurfaceEvent(event) && event.sourceEventSeqs?.includes(this.retained.seq) === true) {
        this.retained = null;
      }
    });
  }
  /**
   * Create an uncommitted snapshot only when the retained value differs.
   * @param current - fully rendered dynamic context.
   * @param sections - named contributions that formed the current snapshot.
   * @returns a candidate user message, or `undefined` when no update is needed.
   */
  project(current, sections) {
    if (this.retained === void 0 && current.length === 0) return;
    const snapshot = current.length === 0 ? CLEARED : current;
    if (this.retained?.text === snapshot) return;
    return createUserMessage({
      content: [{ type: "text", text: snapshot }],
      // The cleared marker has no contributions left to attribute.
      source: sections.length === 0 ? { kind: "plugin", plugin: SOURCE } : { kind: "plugin", plugin: SOURCE, form: "snapshot", sections }
    });
  }
};

// ../../source/deepseek-harness/packages/core/agent-loop/src/tool-calls.ts
async function executeToolCalls(ctx, turn, step, toolCalls, signal, acceptContext) {
  const agent = ctx.agents.requireInitiator();
  const { session } = agent;
  const planned = toolCalls.map((block) => ({
    block,
    exec: {
      callId: block.id,
      name: block.name,
      arguments: parseArguments(block.arguments),
      agent,
      signal
    }
  }));
  let next = 0;
  let concluded = false;
  while (next < planned.length) {
    const first = planned[next];
    const mode = ctx.tools.executionMode(first.exec).kind;
    const group = mode === "parallel" ? planned.slice(next) : [first];
    const outcome = await runGroup(
      ctx,
      turn,
      step,
      group,
      mode,
      signal,
      acceptContext
    );
    next += outcome.consumed;
    concluded ||= outcome.concluded;
    if (outcome.aborted) {
      for (const call of planned.slice(next)) appendSkippedToolCall(session, turn, step, call.block);
      return { concluded };
    }
  }
  return { concluded };
}
function parseArguments(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return raw;
  }
}
async function runGroup(ctx, turn, step, group, mode, signal, acceptContext) {
  const { session } = ctx.agents.requireInitiator();
  const { maxParallelToolCalls } = ctx.agentLoop.config;
  const slots = group.map(() => void 0);
  const callSeqs = group.map(() => -1);
  let nextToStart = 0;
  let committed = 0;
  let started = 0;
  let aborted = signal.aborted;
  let concluded = false;
  let schedulerFailure;
  const throwSchedulerFailure = () => {
    if (schedulerFailure !== void 0) throw schedulerFailure.error;
  };
  const commitReady = async () => {
    while (committed < group.length) {
      const slot = slots[committed];
      if (slot === void 0) break;
      const call = group[committed];
      const result = slot.needsPost ? await ctx.tools[TOOL_RUNTIME_SCHEDULER].finalize(slot.exec, slot.result) : ctx.tools[TOOL_RUNTIME_SCHEDULER].finish(slot.exec, slot.result);
      appendToolResult(session, turn, step, call.block, result, callSeqs[committed]);
      for (const context of result.additionalContexts ?? []) acceptContext(context);
      concluded ||= result.concludesTurn === true;
      committed++;
    }
  };
  const inFlight = /* @__PURE__ */ new Map();
  const startCall = async (index) => {
    const call = group[index];
    callSeqs[index] = appendToolCall(session, turn, step, call.block);
    started++;
    const prepared = await ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec);
    throwSchedulerFailure();
    switch (prepared.kind) {
      case "dispatch": {
        const promise = ctx.tools[TOOL_RUNTIME_SCHEDULER].dispatch(prepared.exec).then(
          (outcome) => {
            slots[index] = { exec: prepared.exec, result: outcome.result, needsPost: outcome.kind === "post-result" };
            return index;
          },
          (error) => {
            schedulerFailure ??= { error };
            return index;
          }
        );
        inFlight.set(index, promise);
        break;
      }
      case "post-result":
        slots[index] = { exec: prepared.exec, result: prepared.result, needsPost: true };
        break;
      case "final-result":
        slots[index] = { exec: prepared.exec, result: prepared.result, needsPost: false };
        break;
      /* v8 ignore next -- closed-union exhaustiveness guard */
      default:
        assertNever(prepared, "tool-call scheduler prepare result");
    }
  };
  const fillPool = async () => {
    while (!aborted && nextToStart < group.length && inFlight.size < maxParallelToolCalls) {
      const nextCall = group[nextToStart];
      if (nextToStart > 0 && mode === "parallel" && ctx.tools.executionMode(nextCall.exec).kind !== "parallel") break;
      await startCall(nextToStart);
      nextToStart++;
      throwSchedulerFailure();
      await commitReady();
      throwSchedulerFailure();
      if (signal.aborted) aborted = true;
    }
  };
  try {
    await fillPool();
    while (inFlight.size > 0) {
      const settledIndex = await Promise.race(inFlight.values());
      inFlight.delete(settledIndex);
      throwSchedulerFailure();
      await commitReady();
      throwSchedulerFailure();
      if (signal.aborted) aborted = true;
      await fillPool();
    }
  } catch (error) {
    schedulerFailure ??= { error };
    await Promise.allSettled(inFlight.values());
    throw schedulerFailure.error;
  }
  if (aborted) {
    for (const call of group.slice(started)) appendSkippedToolCall(session, turn, step, call.block);
    return { consumed: group.length, aborted: true, concluded };
  }
  if (committed !== started) throw new Error("tool-call scheduler: uncommitted settled calls");
  return { consumed: started, aborted: false, concluded };
}
function appendSkippedToolCall(session, turn, step, block) {
  const callSeq = appendToolCall(session, turn, step, block);
  appendToolResult(session, turn, step, block, {
    content: [{ type: "text", text: "Error: tool call aborted before dispatch" }],
    isError: true,
    error: {
      message: "tool call aborted before dispatch",
      info: { name: "AbortError", code: TOOL_ABORTED_BEFORE_DISPATCH }
    }
  }, callSeq);
}
function appendToolCall(session, turn, step, block) {
  const event = session.append("tool/call", { turn, step, callId: block.id, name: block.name, arguments: block.arguments });
  return event.seq;
}
function appendToolResult(session, turn, step, block, result, callSeq) {
  const message = createToolResultMessage({
    callId: block.id,
    content: result.content,
    isError: result.isError
  });
  session.append("tool/result", {
    turn,
    step,
    message,
    ...result.error?.info ? { error: result.error.info } : {},
    // The tool's private presentation payload (e.g. a result-time diff),
    // persisted so a UI bridge reproduces the card on replay.
    ...result.meta !== void 0 ? { meta: result.meta } : {}
  }, { surfaceOp: "append", sourceEventSeqs: [callSeq] });
}

// ../../source/deepseek-harness/packages/core/agent-loop/src/agent.ts
function requestProposal(header) {
  if (header.adapterDefaults === void 0) return header.config;
  const proposal = { ...header.config };
  if (header.adapterDefaults.reasoningEffort === true) delete proposal.reasoningEffort;
  if (header.adapterDefaults.maxTokens === true) delete proposal.maxTokens;
  return proposal;
}
var ReactLoopAgent = class {
  constructor(loopCtx, id, options, session) {
    this.loopCtx = loopCtx;
    this.id = id;
    this.options = options;
    this.session = session;
    this.dispatch = agentEvents(loopCtx, this);
    this.inbox = new Inbox(session, {
      inserted: (message) => {
        this.dispatch.emit("agent/inbox/inserted", { message });
      },
      discarded: (message) => {
        this.dispatch.emit("agent/inbox/discarded", { message });
      },
      claimed: (message, turn) => {
        this.dispatch.emit("agent/inbox/claimed", { message, turn });
      }
    });
    const lastTurn = session.events.findLast((event) => event.type === "turn/start")?.data.turn ?? 0;
    this.phase = { kind: "idle", lastTurn };
    this.scope = createScope(loopCtx, this);
    this.ctx = this.scope.ctx.extend({ agent: this });
    this.runtimeContext = new RuntimeContextProjection(this.ctx, session);
  }
  loopCtx;
  id;
  options;
  session;
  inbox;
  phase;
  activityDone = Promise.resolve();
  /** The agent-scoped registration boundary; the lifecycle owner unwinds it after the driver exits. */
  scope;
  ctx;
  /** Fused dispatcher, built once in the constructor so hot-path dispatches never allocate. */
  dispatch;
  /** Whether this loop instance has appended its initial/resume request anchor. */
  requestHeaderLogged = false;
  runtimeContext;
  get status() {
    return this.phase.kind === "idle" || this.phase.kind === "maintenance" ? "idle" : "running";
  }
  /** Commit a phase and publish its externally visible status transition. */
  setPhase(next) {
    const previousStatus = this.status;
    this.phase = next;
    const status = this.status;
    if (status !== previousStatus) {
      this.dispatch.emit("agent/status", { status });
    }
  }
  send(message, target, wakeup) {
    const wakingAfterAbort = wakeup && this.phase.kind !== "idle" && this.phase.abort.signal.aborted;
    const resolvedTarget = wakingAfterAbort ? "next-turn" : target;
    this.inbox.splice(resolvedTarget, Infinity, 0, [message]);
    if (wakeup) this.wakeDriver(wakingAfterAbort);
  }
  followup(input) {
    this.send(input, "next-turn", true);
  }
  steer(input) {
    this.send(input, "next-step", true);
  }
  inject(input) {
    this.send(input, "next-step", false);
  }
  cancel(cause, options = {}) {
    if (!options.keepInbox) {
      this.inbox.clear();
      if (this.phase.kind !== "idle") this.phase.wakeRequested = false;
    }
    if (this.phase.kind !== "idle") this.phase.abort.abort(cause);
  }
  runMaintenance(job) {
    if (this.phase.kind !== "idle") throw new Error(`agent "${this.id}" already has active work`);
    const done = Promise.withResolvers();
    const maintenance = {
      kind: "maintenance",
      abort: new AbortController(),
      lastTurn: this.phase.lastTurn,
      wakeRequested: false
    };
    this.setPhase(maintenance);
    this.activityDone = done.promise;
    return (async () => {
      try {
        return await job(maintenance.abort.signal);
      } finally {
        this.setPhase({ kind: "idle", lastTurn: maintenance.lastTurn });
        if (maintenance.wakeRequested && this.inbox.hasPending) this.wakeDriver();
        done.resolve();
      }
    })();
  }
  /**
   * Start one driver, or latch its wake behind maintenance or an aborted
   * activity. A wake sent while idle always opens its turn boundary, even
   * when its message was cleared; only a latched replay is suppressed when
   * the queue no longer holds the wake.
   * @param wakeAfterAbort - the {@link send} classification, captured before
   *   the inbox insertion so a reentrant cancel cannot reclassify it.
   */
  wakeDriver(wakeAfterAbort = false) {
    if (this.phase.kind !== "idle") {
      const reason = this.phase.abort.signal.reason;
      if (reason?.kind !== "disposed" && (this.phase.kind === "maintenance" || wakeAfterAbort)) {
        this.phase.wakeRequested = true;
      }
      return;
    }
    const driver = Promise.withResolvers();
    this.activityDone = driver.promise;
    this.setPhase({
      kind: "running",
      abort: new AbortController(),
      turn: this.phase.lastTurn,
      step: 0,
      wakeRequested: false
    });
    this.loopCtx.agents.withInitiator(this, () => this.kick()).then(driver.resolve, driver.reject);
  }
  async whenIdle() {
    let activity;
    do {
      await (activity = this.activityDone);
    } while (activity !== this.activityDone);
  }
  /** Report one failure at its live boundary, then preserve it for driver containment. */
  throwError(error) {
    const turn = this.phase.kind === "running" ? this.phase.turn : this.phase.lastTurn;
    const step = this.phase.kind === "running" ? this.phase.step : 0;
    this.dispatch.emit("agent/error", { turn, step, error });
    throw error;
  }
  async kick() {
    try {
      while (await this.turn()) {
      }
    } catch (_error) {
    } finally {
      if (this.phase.kind === "running") {
        const { turn, wakeRequested } = this.phase;
        this.setPhase({ kind: "idle", lastTurn: turn });
        if (wakeRequested && this.inbox.hasPending) this.wakeDriver();
      }
    }
  }
  async preStep(target, position) {
    if (this.phase.kind !== "running") throw new Error(`agent "${this.id}": pre-step outside running phase`);
    const signal = this.phase.abort.signal;
    const claimed = this.inbox.claim(target, position.turn);
    const assembly = await this.loopCtx.systemPrompt.assemble(assembleContextFor(this, signal));
    signal.throwIfAborted();
    const sections = renderContextSections(assembly);
    const context = this.runtimeContext.project(joinContextSections(sections), sections);
    const decision = await this.dispatch.waterfall(
      "agent/pre-step",
      { messages: claimed, ...position, signal },
      () => Promise.resolve({
        kind: "enter",
        messages: context === void 0 ? claimed : [...claimed, context]
      })
    );
    signal.throwIfAborted();
    return decision.kind === "reject" ? decision : { ...decision, assembly };
  }
  /** Open one turn before claiming its first proposed step. */
  async turn() {
    if (this.phase.kind !== "running") {
      this.throwError(new Error(`agent "${this.id}": turn without driver reservation`));
    }
    const phase = this.phase;
    const { signal } = phase.abort;
    signal.throwIfAborted();
    const turn = phase.turn + 1;
    try {
      this.session.append("turn/start", { turn });
    } catch (error) {
      this.throwError(error);
    }
    phase.turn = turn;
    let turnEnds = null;
    let target = "next-turn";
    try {
      while (true) {
        signal.throwIfAborted();
        const step = phase.step + 1;
        const decision = await this.preStep(target, { turn, step });
        if (decision.kind === "reject") {
          turnEnds = { kind: "blocked" };
          return false;
        }
        if (turnEnds && decision.messages.length === 0) break;
        if (phase.step === 0 && decision.messages.length === 0) {
          turnEnds = { kind: "completed" };
          return false;
        }
        signal.throwIfAborted();
        this.session.append("step/start", { turn, step });
        phase.step = step;
        try {
          for (const message of decision.messages) {
            this.session.append("user/message", message, { surfaceOp: "append" });
          }
          const stepEnd = await this.step(decision.assembly);
          if (turnEnds === null || turnEnds.kind !== "max-tokens") turnEnds = stepEnd;
        } finally {
          this.session.append("step/end", { turn, step });
        }
        signal.throwIfAborted();
        if (turnEnds && this.inbox.nextStep.length === 0) {
          await this.dispatch.serial("agent/turn-stopping", { turn, signal });
          signal.throwIfAborted();
        }
        if (turnEnds && this.inbox.nextStep.length === 0) break;
        target = "next-step";
      }
    } catch (error) {
      if (signal.aborted) {
        turnEnds = { kind: "aborted", reason: signal.reason };
        throw error;
      }
      turnEnds = {
        kind: "error",
        error: error instanceof LlmError ? error.failure : { message: errorChain(error), code: "UNKNOWN" }
      };
      this.throwError(error);
    } finally {
      try {
        this.session.append("turn/end", { turn, reason: turnEnds });
      } catch (error) {
        this.throwError(error);
      }
    }
    if (!this.inbox.hasPending) return false;
    phase.abort = new AbortController();
    phase.wakeRequested = false;
    phase.step = 0;
    return true;
  }
  async step(assembly) {
    if (this.phase.kind !== "running") throw new Error(`agent "${this.id}": step outside running phase`);
    const { turn, step, abort: { signal } } = this.phase;
    signal.throwIfAborted();
    const system = renderPrompt(assembly);
    while (true) {
      const { request, preparedCall } = await this.buildRequest(
        turn,
        step,
        assembly.tools,
        system,
        this.session.deriveMessages(),
        signal
      );
      const assembler = new BlockAssembler();
      const chunkSeqs = [];
      const stream = preparedCall?.stream(request) ?? this.loopCtx.llm.stream(request);
      signal.throwIfAborted();
      for await (const chunk of stream) {
        signal.throwIfAborted();
        chunkSeqs.push(this.session.append("assistant/chunk", { turn, step, chunk }).seq);
        assembler.push(chunk);
      }
      signal.throwIfAborted();
      const finish = assembler.finish;
      if (finish.kind === "error" || finish.kind === "aborted") {
        const action = await this.dispatch.waterfall(
          "agent/request-error",
          {
            turn,
            step,
            provider: request.provider,
            failure: finish.failure,
            retryPolicy: preparedCall?.retryPolicy,
            signal
          },
          () => Promise.resolve(void 0)
        );
        signal.throwIfAborted();
        if (action?.kind !== "retry") {
          throw new LlmError(finish.failure.message, finish.failure.code, finish.failure);
        }
        continue;
      }
      const message = createAssistantMessage({
        content: assembler.blocks(),
        source: {
          provider: request.provider,
          model: request.model,
          ...assembler.replayState !== void 0 ? { replayState: assembler.replayState } : {}
        }
      });
      this.session.append(
        "assistant/message",
        {
          turn,
          step,
          message,
          ...assembler.usage === void 0 ? {} : { usage: assembler.usage }
        },
        { surfaceOp: "append", sourceEventSeqs: chunkSeqs }
      );
      if (finish.kind === "max-tokens") return { kind: "max-tokens" };
      const toolCalls = message.content.filter((block) => block.type === "tool-call");
      if (toolCalls.length === 0) return { kind: "completed" };
      const { concluded } = await executeToolCalls(
        this.loopCtx,
        turn,
        step,
        toolCalls,
        signal,
        (context) => this.inbox.splice("next-step", this.inbox.nextStep.length, 0, [context])
      );
      return concluded ? { kind: "completed" } : null;
    }
  }
  /**
   * Compose one frozen request and bind it to the adapter registration that
   * resolved its exact-model defaults.
   */
  async buildRequest(turn, step, tools, system, boundaryMessages, signal) {
    const { session } = this;
    const persistedHeader = session.requestHeader();
    const persistedConfig = persistedHeader?.config;
    const route = { provider: this.options.provider ?? "", model: this.options.model ?? "" };
    const reasoningEffort = persistedConfig?.provider === route.provider && persistedConfig.model === route.model && persistedHeader?.adapterDefaults?.reasoningEffort !== true ? persistedConfig.reasoningEffort : void 0;
    const maxTokens = this.options.maxTokens;
    const seedConfig = deepFreeze(structuredClone(
      this.requestHeaderLogged ? requestProposal(persistedHeader) : {
        ...route,
        ...reasoningEffort === void 0 ? {} : { reasoningEffort },
        ...maxTokens === void 0 ? {} : { maxTokens }
      }
    ));
    const proposedConfig = await this.dispatch.waterfall(
      "agent/request",
      { turn, step, signal },
      () => Promise.resolve(seedConfig)
    );
    signal.throwIfAborted();
    if (!proposedConfig.provider || !proposedConfig.model) {
      throw new Error(`agent "${this.id}" has no provider/model: set AgentOptions.provider and AgentOptions.model or supply both via the agent/request waterfall`);
    }
    let config;
    let preparedCall;
    try {
      preparedCall = await this.loopCtx.llm.prepareCall(proposedConfig, signal);
      config = preparedCall.config;
    } catch (error) {
      if (!(error instanceof LlmError) || error.code !== "NO_ADAPTER") throw error;
      config = proposedConfig;
    }
    signal.throwIfAborted();
    const header = canonicalHeader({
      config,
      ...preparedCall === void 0 ? {} : { adapterDefaults: preparedCall.adapterDefaults },
      ...system ? { system } : {},
      ...tools.length > 0 ? { tools } : {}
    });
    const baseline = this.session.requestHeader();
    if (!this.requestHeaderLogged) {
      this.session.append("request/header", { header, reason: baseline === void 0 ? "initial" : "resume" });
      this.requestHeaderLogged = true;
    } else if (baseline === void 0 || !headerEquals(baseline, header)) {
      this.session.append("request/header", { header, reason: "change" });
    }
    const contextWindow = preparedCall?.context?.contextWindow;
    const requestContext = {
      provider: config.provider,
      model: config.model,
      ...contextWindow === void 0 ? {} : { contextWindow }
    };
    const previousContext = session.requestContext();
    if (previousContext?.provider !== requestContext.provider || previousContext.model !== requestContext.model || previousContext.contextWindow !== requestContext.contextWindow) {
      session.append("request/context", requestContext);
    }
    signal.throwIfAborted();
    const request = markAgentLoopRequest(deepFreeze({
      ...header.config,
      messages: boundaryMessages,
      ...header.system !== void 0 ? { system: header.system } : {},
      ...header.tools !== void 0 ? { tools: header.tools } : {},
      sessionId: this.session.id,
      signal
    }));
    return { request, ...preparedCall === void 0 ? {} : { preparedCall } };
  }
};

// ../../source/deepseek-harness/packages/core/agent-loop/src/constants.ts
var DEFAULT_MAX_PARALLEL_TOOL_CALLS = 10;

// ../../source/deepseek-harness/packages/core/agent-loop/src/index.ts
var INACTIVE_STATES = /* @__PURE__ */ new Set([
  5 /* UNLOADING */,
  4 /* DISPOSED */,
  3 /* FAILED */
]);
var FactoryOwnership = class {
  constructor(fiber) {
    this.fiber = fiber;
  }
  fiber;
  accepting = true;
  teardown = new AbortController();
  inactive = Promise.withResolvers();
  liveAgents = /* @__PURE__ */ new Set();
  startupTasks = /* @__PURE__ */ new Set();
  /** Aborts (reason: `agent loop is not active` error) when factory teardown begins. */
  get signal() {
    return this.teardown.signal;
  }
  isActive() {
    return this.accepting && !INACTIVE_STATES.has(this.fiber.state);
  }
  /** Track one live agent's shared teardown until it has run. */
  track(dispose) {
    this.liveAgents.add(dispose);
    return () => {
      this.liveAgents.delete(dispose);
    };
  }
  /** Join config startup work that begins before an agent exists. */
  trackStartup(job) {
    this.startupTasks.add(job);
    const forget = () => {
      this.startupTasks.delete(job);
    };
    void job.then(forget, forget);
  }
  /** Join one public create/resume continuation; factory dispose awaits its settlement. */
  trackWrapper(job) {
    this.trackStartup(job.then(() => void 0, () => void 0));
  }
  /** Resolve `task`, or stop waiting when factory teardown begins. */
  async waitWhileActive(job) {
    await Promise.race([job, this.inactive.promise]);
  }
  async dispose() {
    this.accepting = false;
    this.teardown.abort(new Error("agent loop is not active"));
    this.inactive.resolve();
    await Promise.all([
      ...[...this.liveAgents].map((dispose) => dispose()),
      ...this.startupTasks
    ]);
  }
};
async function raceAbort(operation, signal, id) {
  const toAbortError = () => signal.reason instanceof Error ? signal.reason : new Error(`agent "${id}" creation aborted`, { cause: signal.reason });
  if (signal.aborted) throw toAbortError();
  const aborted = Promise.withResolvers();
  const listener = () => {
    aborted.reject(toAbortError());
  };
  signal.addEventListener("abort", listener, { once: true });
  try {
    return await Promise.race([Promise.resolve(operation), aborted.promise]);
  } finally {
    signal.removeEventListener("abort", listener);
  }
}
async function raceAbortCall(operation, signal, id, releaseAbandoned) {
  if (signal.aborted) {
    throw signal.reason instanceof Error ? signal.reason : new Error(`agent "${id}" creation aborted`, { cause: signal.reason });
  }
  const pending = Promise.resolve().then(operation);
  try {
    return await raceAbort(pending, signal, id);
  } catch (error) {
    if (signal.aborted && releaseAbandoned !== void 0) {
      void pending.then(releaseAbandoned, () => void 0);
    }
    throw error;
  }
}
function resolveMaxParallelToolCalls(value) {
  const maxParallelToolCalls = value ?? DEFAULT_MAX_PARALLEL_TOOL_CALLS;
  if (!Number.isInteger(maxParallelToolCalls) || maxParallelToolCalls < 1) {
    throw new Error("maxParallelToolCalls must be a positive integer");
  }
  return maxParallelToolCalls;
}
function assertAgentOptions(options) {
  if (options.maxTokens !== void 0 && (!Number.isSafeInteger(options.maxTokens) || options.maxTokens <= 0)) {
    throw new TypeError("agent maxTokens must be a positive safe integer");
  }
}
var CONFIGURED_AGENT_IDENTITIES_KEY = "configuredAgentIdentities";
function applyLauncherIdentities(agents, identities) {
  if (identities === void 0) return agents;
  return agents.map((agent) => {
    const identity = identities[agent.id];
    if (identity === void 0) return agent;
    const { sessionId: _sessionId, resumeSessionId: _resumeSessionId, ...rest } = agent;
    return identity.resume ? { ...rest, resumeSessionId: identity.id } : { ...rest, sessionId: identity.id };
  });
}
var AGENT_LOOP_SETTINGS_NAMESPACE = settingsNamespace("agent-loop");
var AGENT_LOOP_SETTINGS_SCHEMA = src_default2.object({
  maxParallelToolCalls: src_default2.number().step(1).min(1).default(DEFAULT_MAX_PARALLEL_TOOL_CALLS)
});
function validateConfiguredAgents(agents) {
  const exactIdentities = /* @__PURE__ */ new Map();
  for (const { id, sessionId, resumeSessionId } of agents) {
    const hasResumeId = resumeSessionId !== void 0 && resumeSessionId !== "";
    if (sessionId !== void 0 && hasResumeId) {
      throw new Error(`agent "${id}": sessionId and resumeSessionId are mutually exclusive`);
    }
    const exactIdentity = hasResumeId ? resumeSessionId : sessionId;
    if (exactIdentity === void 0) continue;
    const firstId = exactIdentities.get(exactIdentity);
    if (firstId !== void 0) {
      throw new Error(`agents "${firstId}" and "${id}" use duplicate exact session identity "${exactIdentity}"`);
    }
    exactIdentities.set(exactIdentity, id);
  }
}
var AgentLoop = class extends Service {
  static inject = ["agents", "sessions", "llm", "tools", "systemPrompt"];
  /** Runtime schema for declarative agents. */
  static Config = src_default2.object({
    maxParallelToolCalls: src_default2.number().step(1).min(1).default(DEFAULT_MAX_PARALLEL_TOOL_CALLS),
    agents: src_default2.array(src_default2.object({
      id: src_default2.string().required(),
      sessionId: src_default2.string().min(1),
      provider: src_default2.string(),
      model: src_default2.string(),
      maxTokens: src_default2.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER),
      cwd: src_default2.string(),
      resumeSessionId: src_default2.string()
    })).default([])
  });
  /** Validated configuration owned by the agent-loop service. */
  config;
  ownership;
  /** Plain holder prevents Cordis from re-tracing the factory's dependency context through a caller shadow. */
  runtime;
  constructor(ctx, config) {
    super(ctx, "agentLoop");
    const entry = {
      maxParallelToolCalls: resolveMaxParallelToolCalls(config.maxParallelToolCalls)
    };
    let source = () => entry;
    this.config = {
      ...config,
      agents: applyLauncherIdentities(config.agents, ctx.get(CONFIGURED_AGENT_IDENTITIES_KEY)),
      // Read through on every scheduler decision: `tool-calls.ts` destructures
      // this at the start of each group, so a committed change caps the next
      // group without disturbing the one in flight.
      get maxParallelToolCalls() {
        return source().maxParallelToolCalls;
      }
    };
    installSettingsSection(ctx, AGENT_LOOP_SETTINGS_NAMESPACE, AGENT_LOOP_SETTINGS_SCHEMA, entry, {
      // The schema admits any integer above zero; `resolveMaxParallelToolCalls`
      // owns the whole rule, so refusing here keeps the running scheduler on
      // its last good cap instead of failing at the next tool group.
      validate: (value) => void resolveMaxParallelToolCalls(value.maxParallelToolCalls),
      setSource: (current) => {
        source = current;
      },
      // Nothing is derived from the cap: the getter above is the only reader.
      onChange: () => {
      }
    });
    validateConfiguredAgents(this.config.agents);
    this.ownership = new FactoryOwnership(ctx.fiber);
    this.runtime = { ctx };
    ctx.effect(() => () => this.ownership.dispose(), "agentLoop.transactions()");
    ctx.effect(() => ctx.agents.setFactory(this), "agentLoop.setFactory()");
    ctx.systemPrompt.variable("provider", (context) => context.agent?.options.provider);
    ctx.systemPrompt.variable("model", (context) => context.agent?.options.model);
    ctx.systemPrompt.variable("cwd", (context) => context.agent?.session.header.cwd);
    for (const { id, sessionId, cwd, resumeSessionId, ...options } of this.config.agents) {
      const meta = cwd === void 0 ? {} : { cwd };
      if (resumeSessionId === void 0 || resumeSessionId === "") {
        const configuredId = sessionId ?? SessionId(`${id}-session-${randomUUID2()}`);
        const persistence = sessionId === void 0 ? void 0 : ctx.get("sessionPersistence");
        if (persistence === void 0) {
          this.create(configuredId, options, meta);
        } else {
          const startup = this.restoreOrCreateConfigured(ctx, persistence, configuredId, options, meta).catch((error) => {
            this.reportConfiguredStartupFailure(id, "restore", configuredId, error);
          });
          this.ownership.trackStartup(startup);
        }
        continue;
      }
      ctx.effect(() => {
        const fiber = ctx.inject(["sessionPersistence"], (childCtx) => {
          void this.resumeWith(ctx, childCtx.sessionPersistence, {
            resumeSessionId,
            agentOptions: options
          }).catch((error) => {
            this.reportConfiguredStartupFailure(id, "resume", resumeSessionId, error);
          });
        });
        return fiber.dispose;
      }, `agentLoop.resume(${id})`);
    }
  }
  /** Report a contained declarative-start failure to identity-bound consumers. */
  reportConfiguredStartupFailure(configId, action, sessionId, error) {
    if (!this.ownership.isActive()) return;
    this.ctx.logger.warn(`agent "${configId}": config-driven ${action} of "${sessionId}" failed: ${errorChain(error)}`);
    const args = ["agent-loop/config-start-failed", { sessionId, error }];
    for (const callback of this.ctx.events.dispatch("emit", args)) {
      try {
        const returned = callback(...args);
        void Promise.resolve(returned).catch((listenerError) => {
          this.ctx.logger.warn(`agent "${configId}": config-start-failed listener rejected: ${errorChain(listenerError)}`);
        });
      } catch (listenerError) {
        this.ctx.logger.warn(`agent "${configId}": config-start-failed listener threw: ${errorChain(listenerError)}`);
      }
    }
  }
  /** Restore a materialized exact config identity on remount, or create it on first use. */
  async restoreOrCreateConfigured(ownerCtx, persistence, sessionId, agentOptions, meta) {
    await this.waitForDrainingConfiguredIdentity(ownerCtx, sessionId);
    if (!this.ownership.isActive()) return;
    try {
      await this.resumeWith(ownerCtx, persistence, { resumeSessionId: sessionId, agentOptions });
      return;
    } catch (error) {
      if (!this.ownership.isActive()) return;
      const exists = (await persistence.list()).some((header) => header.id === sessionId);
      if (exists) throw error;
    }
    this.create(sessionId, agentOptions, meta);
  }
  /** Wait for a draining same-id lifecycle to finish registry teardown. */
  async waitForDrainingConfiguredIdentity(ownerCtx, sessionId) {
    if (ownerCtx.agents.get(sessionId) === void 0 && ownerCtx.sessions.get(sessionId) === void 0) return;
    const released = Promise.withResolvers();
    const checkReleased = () => {
      if (ownerCtx.agents.get(sessionId) === void 0 && ownerCtx.sessions.get(sessionId) === void 0) {
        released.resolve();
      }
    };
    const disposeAgentListener = ownerCtx.on("agent/disposed", () => {
      checkReleased();
    });
    const disposeSessionListener = ownerCtx.on("session/disposed", checkReleased);
    try {
      checkReleased();
      await this.ownership.waitWhileActive(released.promise);
    } finally {
      disposeAgentListener();
      disposeSessionListener();
    }
  }
  /**
   * Construct the driver, scope, and one memoized reverse teardown for a new
   * agent. The teardown is registered with the factory and the owner fiber
   * BEFORE publication, so a mid-setup unload rolls everything back; `signal`
   * fuses caller cancellation with lifecycle teardown for setup awaits.
   */
  prepare(ownerCtx, id, options, session, callerSignal) {
    assertAgentOptions(options);
    ownerCtx.fiber.assertActive();
    if (!this.ownership.isActive()) throw new Error("agent loop is not active");
    if (callerSignal?.aborted) {
      throw callerSignal.reason instanceof Error ? callerSignal.reason : new Error(`agent "${id}" creation aborted`, { cause: callerSignal.reason });
    }
    const loopCtx = this.runtime.ctx;
    const abort = new AbortController();
    const onCallerAbort = () => {
      abort.abort(callerSignal?.reason instanceof Error ? callerSignal.reason : new Error(`agent "${id}" creation aborted`, { cause: callerSignal?.reason }));
    };
    const onFactoryTeardown = () => {
      abort.abort(this.ownership.signal.reason);
    };
    callerSignal?.addEventListener("abort", onCallerAbort, { once: true });
    this.ownership.signal.addEventListener("abort", onFactoryTeardown, { once: true });
    let machine;
    let detachSession;
    let detachAgent;
    let disposing;
    const machineReady = Promise.withResolvers();
    const dispose = (ownerTriggered = false) => disposing ??= (async () => {
      abort.abort(new Error(`agent "${id}" lifecycle disposed`));
      callerSignal?.removeEventListener("abort", onCallerAbort);
      this.ownership.signal.removeEventListener("abort", onFactoryTeardown);
      try {
        if (machine === void 0) await machineReady.promise;
        if (machine !== void 0) {
          machine.cancel({ kind: "disposed" });
          await machine.whenIdle();
          await machine.scope.dispose();
        }
      } finally {
        try {
          detachAgent?.();
          detachSession?.();
        } finally {
          untrack();
          if (!ownerTriggered) await unfollowOwner();
        }
      }
    })();
    const untrack = this.ownership.track(dispose);
    let unfollowOwner;
    try {
      unfollowOwner = ownerCtx.effect(() => () => {
        if (disposing !== void 0) return;
        abort.abort(new Error(`agent "${id}" setup aborted: owner disposed during setup`));
        return dispose(true);
      }, `agentLoop.lifecycle(${id})`);
    } catch (error) {
      untrack();
      callerSignal?.removeEventListener("abort", onCallerAbort);
      this.ownership.signal.removeEventListener("abort", onFactoryTeardown);
      throw error;
    }
    const assertLive = () => {
      if (!abort.signal.aborted) return;
      throw abort.signal.reason instanceof Error ? abort.signal.reason : new Error(String(abort.signal.reason));
    };
    try {
      const agent = machine = new ReactLoopAgent(loopCtx, id, options, session);
      machineReady.resolve();
      assertLive();
      return {
        agent,
        signal: abort.signal,
        publish: (source) => {
          assertLive();
          detachSession = agent.ctx.sessions.enter(session);
          detachAgent = loopCtx.agents.enter(agent, ownerCtx.agent);
          agent.ctx.sessions.announce(session);
          assertLive();
          loopCtx.agents.announce(agent);
          assertLive();
          emitAgentEvent(loopCtx, agent, "agent/session-start", { source });
          assertLive();
          return { agent, dispose };
        },
        dispose
      };
    } catch (error) {
      machineReady.resolve();
      void dispose();
      throw error;
    }
  }
  /**
   * Create an agent and session under one caller-supplied identity, owned by
   * the accessing fiber. Constructor-driven config calls mint a fresh combined
   * id before entering this boundary.
   * @param id - shared agent/session identity.
   * @param options - concrete loop options.
   * @param meta - optional fresh-session workspace metadata.
   * @returns the published running agent.
   */
  create(id, options = {}, meta = {}) {
    var _stack = [];
    try {
      const preparation = __using(_stack, SessionPreparation.create(this.runtime.ctx.sessions.prepare(id, { meta })));
      const prepared = this.prepare(this.ctx, id, options, preparation.session);
      try {
        return prepared.publish("startup").agent;
      } catch (error) {
        void prepared.dispose();
        throw error;
      }
    } catch (_) {
      var _error = _, _hasError = true;
    } finally {
      __callDispose(_stack, _error, _hasError);
    }
  }
  /**
   * Create an owned agent on a caller-supplied session id.
   * @param ownerCtx - caller context that structurally owns the lifecycle.
   * @param options - identities, session seed/metadata, loop options, setup, and cancellation.
   * @returns the published handle.
   */
  async createAgent(ownerCtx, options) {
    const preparation = SessionPreparation.create(this.runtime.ctx.sessions.prepare(options.sessionId, {
      ...options.seed === void 0 ? {} : { seed: options.seed },
      ...options.meta === void 0 ? {} : { meta: options.meta }
    }));
    const published = this.setupAndPublish(
      ownerCtx,
      options.sessionId,
      preparation,
      options.agentOptions ?? {},
      options.setup,
      options.signal,
      "startup"
    );
    this.ownership.trackWrapper(published);
    return published;
  }
  /** Prepare one Agent around an acquired Session, run setup, and publish it. */
  async setupAndPublish(ownerCtx, id, preparation, agentOptions, setup, signal, source) {
    var _stack = [];
    try {
      const ownedPreparation = __using(_stack, preparation);
      const session = ownedPreparation.session;
      const prepared = this.prepare(ownerCtx, id, agentOptions, session, signal);
      try {
        const setupCommit = await raceAbort(setup?.(prepared.agent.ctx), prepared.signal, id);
        setupCommit?.commit();
        return prepared.publish(source);
      } catch (error) {
        await prepared.dispose();
        throw error;
      }
    } catch (_) {
      var _error = _, _hasError = true;
    } finally {
      __callDispose(_stack, _error, _hasError);
    }
  }
  /**
   * Resume an owned agent from the configured persistence service.
   * @param ownerCtx - caller context that owns load, setup, and the live lifecycle.
   * @param options - persisted identity, loop options, setup, and cancellation.
   * @returns the published handle.
   */
  async resume(ownerCtx, options) {
    const persistence = this.runtime.ctx.get("sessionPersistence");
    if (persistence === void 0) {
      throw new Error("cannot resume: session persistence is not configured (load a dsh-session-persistence backend)");
    }
    return this.resumeWith(ownerCtx, persistence, options);
  }
  /** Resume through an explicit persistence handle used by the deferred config path. */
  resumeWith(ownerCtx, persistence, options) {
    const id = options.resumeSessionId;
    const published = (async () => {
      const ownerAbort = new AbortController();
      const unfollowOwner = ownerCtx.effect(() => () => {
        ownerAbort.abort(new Error(`agent "${id}" setup aborted: owner disposed during setup`));
      }, `agentLoop.resume-load(${id})`);
      const fused = AbortSignal.any([
        ...options.signal === void 0 ? [] : [options.signal],
        ownerAbort.signal,
        this.ownership.signal
      ]);
      let preparation;
      try {
        try {
          preparation = await raceAbortCall(
            () => persistence.prepare(id, fused),
            fused,
            id,
            (abandoned) => {
              abandoned[Symbol.dispose]();
            }
          );
        } finally {
          await unfollowOwner();
        }
        ownerCtx.fiber.assertActive();
        if (!this.ownership.isActive()) throw new Error("agent loop is not active");
        return await this.setupAndPublish(
          ownerCtx,
          id,
          preparation,
          options.agentOptions ?? {},
          options.setup,
          options.signal,
          "resume"
        );
      } finally {
        preparation?.[Symbol.dispose]();
      }
    })();
    this.ownership.trackWrapper(published);
    return published;
  }
};
var src_default13 = AgentLoop;

// ../../source/deepseek-harness/packages/llm/llm-retry/src/index.ts
var src_exports9 = {};
__export(src_exports9, {
  Config: () => Config8,
  RetryId: () => RetryId,
  apply: () => apply13,
  inject: () => inject12,
  name: () => name13
});
import { randomUUID as randomUUID3 } from "node:crypto";

// ../../source/deepseek-harness/packages/llm/llm-retry/src/brand.ts
function RetryId(id) {
  return id;
}

// ../../source/deepseek-harness/packages/llm/llm-retry/src/index.ts
var name13 = "llm-retry";
var inject12 = ["agents"];
var Config8 = src_default2.object({});
function validateConfig(config) {
  const [key] = Object.keys(config);
  if (key === void 0) return;
  if (key === "retryPolicy") {
    throw new Error("llm-retry: retryPolicy belongs under each provider configuration");
  }
  throw new Error(`llm-retry: unknown key "${key}"`);
}
async function settleDownstream(next) {
  try {
    return { type: "decision", decision: await next() };
  } catch (error) {
    return { type: "error", error };
  }
}
function localDelay(config, retry, random) {
  const exponent = Math.min(retry - 1, 1024);
  const exponential = Math.min(config.initialDelayMs * 2 ** exponent, config.maxDelayMs);
  const jitter = 1 - config.jitterRatio + 2 * config.jitterRatio * random();
  return Math.min(exponential * jitter, config.maxDelayMs);
}
function retryPolicyKey(policy) {
  return policy.mode === "always" ? JSON.stringify([policy.mode, policy.initialDelayMs, policy.maxDelayMs, policy.jitterRatio]) : JSON.stringify([
    policy.mode,
    policy.maxRetries,
    [...policy.retryableCodes].sort(),
    policy.initialDelayMs,
    policy.maxDelayMs,
    policy.jitterRatio
  ]);
}
function cancellableDelay(delayMs, signal) {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve5) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve5(true);
    }, delayMs);
    function onAbort() {
      clearTimeout(timer);
      resolve5(false);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
function apply13(ctx, config = {}, internals = {}) {
  validateConfig(config);
  const random = internals.random ?? Math.random;
  const lifetime = new AbortController();
  const active = /* @__PURE__ */ new Set();
  function track(operation) {
    const tracked = operation.finally(() => active.delete(tracked));
    active.add(tracked);
    return tracked;
  }
  async function backoff(agent, turn, step, failure, provider, policy, policyKey, retry, retryId, delayMs, signal) {
    const fusedSignal = AbortSignal.any([signal, lifetime.signal]);
    if (fusedSignal.aborted) return;
    const eventData = policy.mode === "normal" ? {
      retryId,
      turn,
      step,
      provider,
      mode: policy.mode,
      policyKey,
      retry,
      maxRetries: policy.maxRetries,
      delayMs,
      failure
    } : {
      retryId,
      turn,
      step,
      provider,
      mode: policy.mode,
      policyKey,
      retry,
      delayMs,
      failure
    };
    agent.session.append("llm/retry", eventData);
    if (!await cancellableDelay(delayMs, fusedSignal)) return;
    agent.session.append("llm/retry-started", { retryId, turn, step, retry });
    return { kind: "retry" };
  }
  async function recover({ agent, turn, step, provider, failure, retryPolicy: policy, signal }, next) {
    if (policy === void 0) return next();
    if (policy.mode === "always") {
      if (signal.aborted || lifetime.signal.aborted) return;
      const fusedSignal = AbortSignal.any([signal, lifetime.signal]);
      const downstream = await settleDownstream(next);
      if (fusedSignal.aborted) return;
      if (downstream.type === "error") {
        ctx.logger.warn(
          `llm-retry: provider "${provider}" always policy ignored a downstream recovery failure: %o`,
          downstream.error
        );
      }
      if (downstream.type === "decision" && downstream.decision?.kind === "retry") {
        return downstream.decision;
      }
    } else if (!policy.retryableCodes.includes(failure.code)) {
      return next();
    }
    const policyKey = retryPolicyKey(policy);
    const priorPolicyRetry = agent.session.events.findLast(
      (event) => event.type === "llm/retry" && event.data.turn === turn && event.data.step === step && event.data.provider === provider && event.data.policyKey === policyKey
    );
    const previousRetry = priorPolicyRetry?.data.retry ?? 0;
    if (policy.mode === "normal" && previousRetry >= policy.maxRetries) return next();
    const retry = previousRetry + 1;
    const retryId = priorPolicyRetry?.data.retryId ?? RetryId(randomUUID3());
    let delayMs;
    if (failure.providerRetryAfterMs !== void 0 && Number.isFinite(failure.providerRetryAfterMs) && failure.providerRetryAfterMs > 0) {
      if (failure.providerRetryAfterMs > policy.maxDelayMs) {
        if (policy.mode === "normal") return next();
        delayMs = localDelay(policy, retry, random);
      } else {
        delayMs = failure.providerRetryAfterMs;
      }
    } else {
      delayMs = localDelay(policy, retry, random);
    }
    return backoff(agent, turn, step, failure, provider, policy, policyKey, retry, retryId, delayMs, signal);
  }
  const disposeListener = ctx.on("agent/request-error", (payload, next) => {
    if (lifetime.signal.aborted) return Promise.resolve(void 0);
    return track(recover(payload, next));
  });
  ctx.effect(() => async () => {
    disposeListener();
    lifetime.abort(new Error("llm-retry plugin disposed"));
    await Promise.allSettled([...active]);
  }, "llm-retry: abort and drain active recovery");
}

// ../../source/deepseek-harness/packages/examples/agent-spine-demo/lib/index.js
var name14 = "agent-spine-demo";
var EXAMPLE_SESSION_TITLE_CONFIG = {
  fallbackMaxWords: 5,
  fallbackMaxBytes: 40,
  maxTitleBytes: 80
};
var SkillConfigSchema = src_default2.object({
  enabled: src_default2.boolean().default(true),
  registry: src_default8.Config,
  filesystem: Config,
  tool: Config6
});
var SessionTitleConfigSchema = src_default5.Config.default(EXAMPLE_SESSION_TITLE_CONFIG);
var ToolBashConfigSchema = src_default2.union([src_default2.const(false), Config3]);
var JobsConfigSchema = src_default11.Config;
var ToolJobsConfigSchema = Config7;
var GoalConfigSchema = src_default2.object({
  domain: src_default10.Config,
  tool: Config2
});
var Config9 = src_default2.intersect([
  src_default13.Config,
  src_default6.Config,
  src_default2.object({
    tools: src_default7.Config,
    dshHome: src_default2.string(),
    sessionTitle: SessionTitleConfigSchema,
    skills: SkillConfigSchema,
    workspaceContext: src_default2.union([src_default2.const(false), Config5]).required(),
    toolBash: ToolBashConfigSchema,
    jobs: JobsConfigSchema,
    toolJobs: src_default2.union([src_default2.const(false), ToolJobsConfigSchema]),
    invariants: src_default12.Config,
    goals: src_default2.union([src_default2.const(false), GoalConfigSchema])
  })
]);
function pickSpineConfig(config) {
  return {
    ...config.maxParallelToolCalls !== void 0 ? { maxParallelToolCalls: config.maxParallelToolCalls } : {},
    ...config.includeHarnessIdentity !== void 0 ? { includeHarnessIdentity: config.includeHarnessIdentity } : {},
    ...config.includeRuntimeContext !== void 0 ? { includeRuntimeContext: config.includeRuntimeContext } : {},
    ...config.persona !== void 0 ? { persona: config.persona } : {},
    ...config.toolOrder !== void 0 ? { toolOrder: config.toolOrder } : {},
    ...config.tools !== void 0 ? { tools: config.tools } : {},
    ...config.dshHome !== void 0 ? { dshHome: config.dshHome } : {},
    ...config.sessionTitle !== void 0 ? { sessionTitle: config.sessionTitle } : {},
    workspaceContext: config.workspaceContext,
    ...config.skills !== void 0 ? { skills: config.skills } : {},
    ...config.toolBash !== void 0 ? { toolBash: config.toolBash } : {},
    ...config.jobs !== void 0 ? { jobs: config.jobs } : {},
    ...config.toolJobs !== void 0 ? { toolJobs: config.toolJobs } : {},
    ...config.invariants !== void 0 ? { invariants: config.invariants } : {},
    ...config.goals !== void 0 ? { goals: config.goals } : {}
  };
}
function apply14(ctx, config) {
  const nestedDshHome = config.skills?.filesystem?.dshHome;
  if (config.dshHome !== void 0 && nestedDshHome !== void 0 && resolveDshHome(config.dshHome) !== resolveDshHome(nestedDshHome)) throw new Error("agent-spine-demo: dshHome and skills.filesystem.dshHome must resolve to the same directory");
  const dshHome = resolveDshHome(config.dshHome ?? nestedDshHome);
  ctx.plugin(src_default);
  ctx.plugin(src_default3);
  ctx.plugin(src_default4);
  ctx.plugin(src_default5, config.sessionTitle ?? EXAMPLE_SESSION_TITLE_CONFIG);
  ctx.plugin(src_default6, {
    includeHarnessIdentity: config.includeHarnessIdentity ?? true,
    includeRuntimeContext: config.includeRuntimeContext ?? true,
    persona: config.persona ?? "",
    ...config.toolOrder !== void 0 ? { toolOrder: config.toolOrder } : {}
  });
  ctx.plugin(src_default7, config.tools ?? {});
  const skillsEnabled = config.skills?.enabled ?? true;
  if (skillsEnabled) {
    ctx.plugin(src_default8, config.skills?.registry ?? {});
    ctx.plugin(src_exports, Object.assign({}, config.skills?.filesystem, { dshHome }));
  }
  ctx.plugin(src_default9);
  ctx.plugin(src_exports9);
  if (config.goals !== void 0 && config.goals !== false) {
    ctx.plugin(src_default10, config.goals.domain ?? {});
    ctx.plugin(src_exports3, config.goals.tool ?? {});
    ctx.plugin(src_exports2);
  }
  ctx.plugin(src_default11, config.jobs ?? {});
  ctx.plugin(src_default12, config.invariants ?? {});
  ctx.plugin(invariant_exports);
  ctx.plugin(invariant_exports2);
  ctx.plugin(invariant_exports3);
  ctx.plugin(invariant_exports4);
  if (config.toolBash !== false) {
    ctx.plugin(src_exports5, { dshHome });
    ctx.plugin(src_exports4, config.toolBash ?? {});
  }
  if (config.workspaceContext !== false) ctx.plugin(src_exports6, config.workspaceContext);
  if (skillsEnabled) ctx.plugin(src_exports7, config.skills?.tool ?? {});
  if (config.toolJobs !== false) ctx.plugin(src_exports8, config.toolJobs ?? {});
  ctx.plugin(src_default13, {
    agents: config.agents ?? [],
    ...config.maxParallelToolCalls !== void 0 ? { maxParallelToolCalls: config.maxParallelToolCalls } : {}
  });
}
export {
  Config9 as Config,
  GoalConfigSchema,
  JobsConfigSchema,
  SessionTitleConfigSchema,
  SkillConfigSchema,
  ToolBashConfigSchema,
  ToolJobsConfigSchema,
  apply14 as apply,
  name14 as name,
  pickSpineConfig
};
