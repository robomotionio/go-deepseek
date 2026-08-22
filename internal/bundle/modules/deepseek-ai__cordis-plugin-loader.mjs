// .harness/vendor/loader/lib/index.js
import { createRequire } from "node:module";

// .harness/vendor/cosmokit/src/misc.ts
function isNullable(value) {
  return value === null || value === void 0;
}
function isNonNullable(value) {
  return !isNullable(value);
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, { writable: true, value, enumerable: false });
}

// .harness/vendor/cosmokit/src/types.ts
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

// .harness/vendor/cosmokit/src/string.ts
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

// .harness/vendor/cosmokit/src/time.ts
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
  function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
    if (typeof date === "number") date = new Date(date);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date + offset * Time2.minute);
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
  function parseDate(date) {
    const parsed = parseTime(date);
    if (parsed) {
      date = Date.now() + parsed;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) {
      date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
    }
    return date ? new Date(date) : /* @__PURE__ */ new Date();
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

// .harness/vendor/cordis/src/utils.ts
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
function createShadow(ctx, target, property, receiver) {
  if (!property) return receiver;
  const origin = Reflect.getOwnPropertyDescriptor(target, property)?.value;
  if (!origin) return receiver;
  return withProp(receiver, property, ctx.extend({ [symbols.shadow]: origin }));
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
function createCallable(name, proto, tracker) {
  const self = function(...args) {
    const proxy = createTraceable(self["ctx"], self, tracker);
    return applyTraceable(proxy, self, this, args);
  };
  defineProperty(self, "name", name);
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

// .harness/vendor/cordis/src/events.ts
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
    this.on("internal/listener", function(name, listener, options) {
      if (name === "internal/update" && !options.global) {
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
    const name = args.shift();
    if (!name.startsWith("internal/")) {
      this.emit("internal/dispatch", type, name, args, thisArg);
    }
    const filter = thisArg?.[Context.filter];
    return (this._hooks[name] || []).filter((hook) => hook.global || !filter || filter.call(thisArg, hook.ctx)).map((hook) => hook.callback.bind(thisArg));
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
  on(name, listener, options) {
    if (typeof options !== "object") {
      options = { prepend: options };
    }
    this.ctx.fiber.assertActive();
    listener = this.ctx.reflect.bind(listener);
    const result = this.bail(this.ctx, "internal/listener", name, listener, options);
    if (result) return result;
    const hooks = this._hooks[name] ||= [];
    const label = `ctx.on(${typeof name === "string" ? JSON.stringify(name) : name.toString()})`;
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
  once(name, listener, options) {
    const dispose = this.on(name, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, options);
    return dispose;
  }
};

// .harness/vendor/cordis/src/logger.ts
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
  static code(name, level) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 3) - hash + name.charCodeAt(i) + 13;
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
  [symbols.invoke](name) {
    const config = this._resolveConfig();
    const fiber = (this.ctx[symbols.shadow] ?? this.ctx).fiber;
    name ??= config.name;
    name ??= hyphenate(fiber.name);
    return new Logger({
      name,
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

// .harness/vendor/cordis/src/fiber.ts
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
  constructor(parent, config, inject, runtime, getOuterStack) {
    this.parent = parent;
    this.inject = inject;
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
        for (const [name, config2] of injectEntries) {
          if (isNullable(config2)) continue;
          this.ctx[Context.intercept][name] = config2;
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
        for (const name of Object.keys(this.inject)) {
          this._checkImpl(name);
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
      setupBarrier ??= new Promise((resolve, reject) => {
        resolveSetup = resolve;
        rejectSetup = reject;
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
  _checkImpl(name) {
    const impl = this.ctx.reflect._getImpl(name, true);
    if (!impl) return delete this._store[name];
    try {
      if (impl.check && !impl.check.call(getTraceable(this.ctx, impl.value))) {
        return delete this._store[name];
      }
    } catch (error) {
      impl.fiber.ctx.logger.error(error);
      return delete this._store[name];
    }
    this._store[name] = impl;
  }
  _refresh() {
    let epoch = false;
    epoch = "";
    for (const name of Object.keys(this.inject)) {
      const impl = this._store[name];
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

// .harness/vendor/cordis/src/reflect.ts
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
  get(name, strict = true) {
    return getTraceable(this.ctx, this._getImpl(name, strict)?.value);
  }
  _getImpl(name, strict = true) {
    const key = this.ctx[symbols.isolate][name];
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
  set(name, value, error) {
    const key = this.ctx[symbols.isolate][name];
    const impl = this.store[key];
    if (!impl) {
      throw new Error(`cannot set property "${name}" without provide`);
    }
    if (impl.fiber !== this.ctx.fiber) {
      throw new Error(`cannot set property "${name}" in multiple fibers`);
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
  provide(name, value, check) {
    return this.ctx.fiber.effect(() => {
      if (!this.props[name]) {
        this.props[name] ??= { type: "service" };
      } else if (this.props[name].type !== "service") {
        throw new Error(`property "${name}" is already declared as ${this.props[name].type}`);
      }
      this.props[name] = { type: "service" };
      this.ctx.root[symbols.isolate][name] ??= Symbol(name);
      const key = this.ctx[symbols.isolate][name];
      const impl = { name, value, fiber: this.ctx.fiber, check };
      if (this.store[key]) {
        throw new Error(`service "${name}" has been registered at <${this.store[key].fiber.name}>`);
      }
      this.store[key] = impl;
      this.ctx.fiber.store[name] = impl;
      if (this.ctx.fiber.state === 2 /* ACTIVE */) {
        this.notify([name]);
      }
      return async () => {
        delete this.store[key];
        const fibers = this.notify([name]);
        await Promise.allSettled(fibers.map((fiber) => fiber.await()));
        delete this.ctx.fiber.store[name];
      };
    }, `ctx.provide(${JSON.stringify(name)})`);
  }
  /**
   * Re-evaluate every fiber that requires one of the given services.
   *
   * @param names — the service names that changed.
   * @param filter — restricts notification to matching isolation scopes.
   * @returns the fibers whose dependency state was refreshed.
   */
  notify(names, filter = (ctx, name) => ctx[symbols.isolate][name] === this.ctx[symbols.isolate][name]) {
    const fibers = [];
    for (const runtime of this.ctx.registry.values()) {
      for (const fiber of runtime.fibers) {
        let hasUpdate = false;
        for (const name of names) {
          if (!(name in fiber.inject)) continue;
          if (!filter(fiber.ctx, name)) continue;
          hasUpdate = true;
          fiber._checkImpl(name);
        }
        if (!hasUpdate) continue;
        fiber._refresh();
        fibers.push(fiber);
      }
    }
    for (const name of names) {
      const self = Object.create(this.ctx);
      self[symbols.filter] = (target) => filter(target, name);
      this.ctx.events.emit(self, "internal/service", name, this._getImpl(name, false)?.value);
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
  accessor(name, options) {
    return this.ctx.fiber.effect(() => {
      if (name in this.props) {
        throw new Error(`property "${name}" is already declared as ${this.props[name].type}`);
      }
      this.props[name] = { type: "accessor", ...options };
      return () => delete this.props[name];
    }, `ctx.accessor(${JSON.stringify(name)})`);
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

// .harness/vendor/cordis/src/registry.ts
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
function Inject(name, config) {
  return function(value, decorator) {
    if (decorator.kind === "class") {
      if (!Object.hasOwn(value, "inject")) {
        defineProperty(value, "inject", Object.create(Object.getPrototypeOf(value).inject ?? null));
        defineProperty(value.inject, symbols.checkProto, true);
      }
      value.inject[name] = config;
    } else if (decorator.kind === "method") {
      const inject = (value[symbols.metadata] ??= {}).inject ??= /* @__PURE__ */ Object.create(null);
      inject[name] = config;
      decorator.addInitializer(function() {
        const property = this[symbols.tracker]?.property;
        (this[symbols.initHooks] ??= []).push(() => {
          this.ctx.inject(inject, (ctx) => {
            return value.call(property ? withProps(this, { [property]: ctx }) : this);
          });
        });
      });
    } else {
      throw new Error("@Inject() can only be used on class or class methods");
    }
  };
}
((Inject2) => {
  function resolve(inject, result = /* @__PURE__ */ Object.create(null)) {
    if (!inject) return result;
    if (Array.isArray(inject)) {
      for (const name of inject) {
        result[name] = null;
      }
    } else if (Reflect.has(inject, symbols.checkProto)) {
      Object.assign(result, resolve(Object.getPrototypeOf(inject)));
      for (const name of Object.keys(inject)) {
        result[name] = inject[name] ?? null;
      }
    } else {
      for (const name of Object.keys(inject)) {
        result[name] = inject[name] ?? null;
      }
    }
    return result;
  }
  Inject2.resolve = resolve;
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
  inject(inject, callback) {
    return this.plugin({ inject, apply: callback, name: callback.name });
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
      let name = plugin.name;
      if (name === "apply") name = void 0;
      runtime = { name, callback, fibers: new DisposableList(), Config: plugin.Config };
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

// .harness/vendor/cordis/src/context.ts
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
  isolate(name, label) {
    const shadow = Object.create(this[symbols.isolate]);
    shadow[name] = label ?? Symbol(name);
    return this.extend({ [symbols.isolate]: shadow });
  }
  intercept(name, config) {
    const intercept = Object.create(this[symbols.intercept]);
    intercept[name] = config;
    return this.extend({ [symbols.intercept]: intercept });
  }
};

// .harness/vendor/cordis/src/service.ts
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
  constructor(ctx, name) {
    this.ctx = ctx;
    name ??= this.constructor["provide"];
    let self = this;
    const tracker = {
      associate: name,
      property: "ctx"
    };
    if (self[symbols.invoke]) {
      self = createCallable(name, joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    }
    self.ctx = ctx;
    self.name = name;
    defineProperty(self, symbols.tracker, tracker);
    self.ctx.reflect.provide(name, self, this[symbols.check]);
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

// .harness/vendor/loader/lib/index.js
var ModuleLoader;
(function(ModuleLoader2) {
  let _cachedLoader;
  function requireInternal(id) {
    const require2 = createRequire(import.meta.url);
    if (process.execArgv.includes("--expose-internals")) try {
      return require2(id);
    } catch {
    }
    try {
      return require2("node-addon-require-builtin").requireBuiltin(id);
    } catch {
    }
  }
  function fromInternal() {
    if (_cachedLoader) return _cachedLoader;
    const [major] = process.versions.node.split(".").map(Number);
    if (major >= 24) {
      const raw = requireInternal("internal/modules/esm/loader")?.getOrInitializeCascadedLoader();
      if (raw) return _cachedLoader = Object.assign(raw, { version: "v2" });
    } else if (major >= 22) {
      const raw = requireInternal("internal/modules/esm/loader")?.getOrInitializeCascadedLoader();
      if (raw) return _cachedLoader = Object.assign(raw, { version: "v1" });
    }
  }
  ModuleLoader2.fromInternal = fromInternal;
})(ModuleLoader || (ModuleLoader = {}));
var EntryGroup = class {
  ctx;
  tree;
  static key = /* @__PURE__ */ Symbol.for("cordis.group");
  data = [];
  constructor(ctx, tree) {
    this.ctx = ctx;
    this.tree = tree;
    const entry = ctx.fiber.entry;
    if (entry) entry.subgroup = this;
  }
  get context() {
    return this.ctx;
  }
  async create(options) {
    const id = this.tree.ensureId(options);
    const existing = this.tree.store[id];
    const entry = existing ?? (this.tree.store[id] = new Entry(this.ctx.loader));
    const previousParent = entry.parent;
    entry.parent = this;
    try {
      await entry.update(options, true, true);
    } catch (error) {
      if (existing) entry.parent = previousParent;
      else delete this.tree.store[id];
      throw error;
    }
    return entry.id;
  }
  unlink(options) {
    const config = this.data;
    const index = config.indexOf(options);
    if (index >= 0) config.splice(index, 1);
  }
  async remove(id, isDispose = false) {
    const entry = this.tree.store[id];
    if (!entry) return;
    await entry._dispose();
    if (!isDispose) this.unlink(entry.options);
    delete this.tree.store[id];
    this.context.emit("loader/partial-dispose", entry, entry.options, false);
  }
  async update(config) {
    const oldConfig = this.data;
    const seen = /* @__PURE__ */ new Set();
    for (const options of config) {
      const id = this.tree.ensureId(options);
      if (seen.has(id)) throw new TypeError(`duplicate loader entry id: ${id}`);
      seen.add(id);
    }
    const oldMap = Object.fromEntries(oldConfig.map((options) => [options.id, options]));
    const newMap = Object.fromEntries(config.map((options) => [options.id, options]));
    try {
      const outcomes = await Promise.allSettled(config.map((options) => this.create(options)));
      if (this.ctx.fiber.uid === null) return;
      const failures = outcomes.filter((outcome) => outcome.status === "rejected").map((outcome) => outcome.reason);
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) throw new AggregateError(failures, "loader entries failed to apply");
      for (const id of Object.keys(oldMap)) if (!newMap[id]) await this.remove(id, true);
      this.data = config;
    } catch (error) {
      const rollbackErrors = [];
      for (const id of Object.keys(newMap).reverse()) {
        if (oldMap[id]) continue;
        try {
          await this.remove(id, true);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      for (const options of oldConfig) try {
        await this.create(options);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      this.data = oldConfig;
      if (rollbackErrors.length) throw new AggregateError([error, ...rollbackErrors], "loader entry rollback failed");
      throw error;
    }
  }
  async stop() {
    for (const options of this.data) await this.remove(options.id, true);
  }
};
var Group = class extends EntryGroup {
  ctx;
  config;
  static initial = [];
  static [EntryGroup.key] = true;
  constructor(ctx, config) {
    super(ctx, ctx.fiber.entry.parent.tree);
    this.ctx = ctx;
    this.config = config;
    ctx.on("internal/update", (config2) => this.update(config2));
  }
  async *[Service.init]() {
    yield () => this.stop();
    await this.update(this.config);
  }
};
var __rewriteRelativeImportExtension = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
    return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
  });
  return path;
};
var EntryTree = class EntryTree2 {
  static sep = ":";
  ctx;
  enableLogs;
  root;
  store = /* @__PURE__ */ Object.create(null);
  constructor(ctx) {
    this.ctx = ctx.extend({ baseUrl: ctx.baseUrl });
    this.root = new EntryGroup(this.ctx, this);
    const entry = this.ctx.fiber.entry;
    if (entry) entry.subtree = this;
  }
  get context() {
    return this.ctx;
  }
  /** Iterate entries in this tree and any nested subtrees. */
  *entries() {
    for (const entry of Object.values(this.store)) {
      yield entry;
      if (!entry.subtree) continue;
      yield* entry.subtree.entries();
    }
  }
  /** Return pending import and lifecycle tasks owned by this tree. */
  getTasks() {
    return [...this.entries()].map((entry) => entry._initTask || entry.fiber?.inertia).filter(isNonNullable);
  }
  /**
  * Wait until this tree has no active import or lifecycle tasks.
  * @throws a settled fiber failure, or an aggregate when several fibers failed.
  */
  async await() {
    while (true) {
      const tasks = this.getTasks();
      if (tasks.length) {
        await Promise.allSettled(tasks);
        continue;
      }
      const failures = (await Promise.allSettled([...this.entries()].map((entry) => entry._await()))).filter((outcome) => outcome.status === "rejected").map((outcome) => outcome.reason);
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) throw new AggregateError(failures, "loader fibers failed");
      this.ctx.reflect.notify(["loader"]);
      if (!this.getTasks().length) return;
    }
  }
  ensureId(options) {
    if (!options.id) do
      options.id = Math.random().toString(16).slice(2, 10);
    while (this.store[options.id]);
    return options.id;
  }
  /** Resolve an entry by id, including nested ids separated by `EntryTree.sep`. */
  resolve(id) {
    const parts = id.split(EntryTree2.sep);
    let tree = this;
    const final = parts.pop();
    for (const part of parts) {
      tree = tree.store[part]?.subtree;
      if (!tree) throw new Error(`cannot resolve entry ${id}`);
    }
    const entry = tree.store[final];
    if (!entry) throw new Error(`cannot resolve entry ${id}`);
    return entry;
  }
  resolveGroup(id) {
    if (!id) return this.root;
    const entry = this.resolve(id);
    if (!entry.subgroup) throw new Error(`entry ${id} is not a group`);
    return entry.subgroup;
  }
  /** Create an entry in the root group or a nested group. */
  async create(options, parent = null, position = Infinity) {
    const group = this.resolveGroup(parent);
    const id = await group.create(options);
    const entry = this.resolve(id);
    group.data.splice(position, 0, entry.options);
    group.tree.write();
    return id;
  }
  /** Stop and remove an entry from its parent group. */
  async remove(id) {
    const entry = this.resolve(id);
    await entry.parent.remove(id);
    entry.parent.tree.write();
  }
  /** Update an entry and optionally move it to another group. */
  async update(id, options, parent, position) {
    const entry = this.resolve(id);
    const source = entry.parent;
    const sourceIndex = source.data.indexOf(entry.options);
    let target = source;
    if (parent !== void 0) {
      target = this.resolveGroup(parent);
      source.unlink(entry.options);
      target.data.splice(position ?? Infinity, 0, entry.options);
      entry.parent = target;
    }
    try {
      await entry.update(options, false, true);
    } catch (error) {
      if (parent !== void 0) {
        target.unlink(entry.options);
        source.data.splice(sourceIndex < 0 ? source.data.length : sourceIndex, 0, entry.options);
        entry.parent = source;
        try {
          await entry.update({}, false, true);
        } catch (rollbackError) {
          throw new AggregateError([error, rollbackError], `failed to roll back loader entry move ${id}`);
        }
      }
      throw error;
    }
    source.tree.write();
    if (target !== source) target.tree.write();
  }
  /** Import a plugin module from a specifier or `cordis:` builtin. */
  import(name, getOuterStack) {
    if (name.startsWith("cordis:")) return this.ctx.loader.builtins[name.slice(7)];
    return composeError(async (info) => {
      info.offset += 3;
      if (this.ctx.loader.internal) return await this.ctx.loader.internal.import(name, this.ctx.baseUrl, {});
      else if (name.startsWith(".")) return await import(__rewriteRelativeImportExtension(
        /* @vite-ignore */
        new URL(name, this.ctx.baseUrl).href
      ));
      else return await import(__rewriteRelativeImportExtension(
        /* @vite-ignore */
        name
      ));
    }, getOuterStack);
  }
};
var evaluate = new Function("ctx", "expr", `
  with (ctx) {
    return eval(expr)
  }
`);
function interpolate(ctx, value) {
  if (isJsExpr(value)) return evaluate(ctx, value.__jsExpr);
  else if (!value || typeof value !== "object") return value;
  else if (Array.isArray(value)) return value.map((item) => interpolate(ctx, item));
  else return mapValues(value, (item) => interpolate(ctx, item));
}
function isJsExpr(value) {
  return value instanceof Object && "__jsExpr" in value;
}
function updateError(stage, options, cause) {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`failed to ${stage} loader entry ${options.id} (${options.name}): ${detail}`, { cause });
}
function takeEntries(object, keys) {
  const result = [];
  for (const key of keys) {
    if (!(key in object)) continue;
    result.push([key, object[key]]);
    delete object[key];
  }
  return result;
}
function sortKeys(object, prepend = ["id", "name"], append = ["config"]) {
  const part1 = takeEntries(object, prepend);
  const part2 = takeEntries(object, append);
  const rest = takeEntries(object, Object.keys(object)).sort(([a], [b]) => a.localeCompare(b));
  return Object.assign(object, Object.fromEntries([
    ...part1,
    ...rest,
    ...part2
  ]));
}
function replaceKeys(target, source) {
  for (const key of Object.keys(target)) Reflect.deleteProperty(target, key);
  return Object.assign(target, source);
}
var Entry = class Entry2 {
  loader;
  static key = /* @__PURE__ */ Symbol.for("cordis.entry");
  ctx;
  fiber;
  parent;
  options = {};
  subgroup;
  subtree;
  _initTask;
  _disposing = 0;
  constructor(loader) {
    this.loader = loader;
    this.ctx = loader.ctx.extend({ [Entry2.key]: this });
    this.context.emit("loader/entry-init", this);
  }
  get context() {
    return this.ctx;
  }
  get id() {
    let id = this.options.id;
    if (this.parent.tree.ctx.fiber.entry) id = this.parent.tree.ctx.fiber.entry.id + EntryTree.sep + id;
    return id;
  }
  /** True when this entry or any owning parent entry is disabled. */
  get disabled() {
    return this._disabled(this.options);
  }
  _disabled(options) {
    if (options.group) return false;
    if (this.disabledOf(options)) return true;
    let entry = this.parent.ctx.fiber.entry;
    while (entry) {
      if (this.disabledOf(entry.options)) return true;
      entry = entry.parent.ctx.fiber.entry;
    }
    return false;
  }
  /**
  * Effective disabled state: a `!!js` expression evaluates against the loader
  * context. The raw node stays in the options, so write-back keeps the form.
  */
  disabledOf(options) {
    return isJsExpr(options.disabled) ? Boolean(this.evaluate(options.disabled.__jsExpr)) : Boolean(options.disabled);
  }
  evaluate(expr) {
    return evaluate(this.ctx, expr);
  }
  async _patchContext(diff) {
    await this.context.waterfall("loader/patch-context", this, async () => {
      Object.setPrototypeOf(this.ctx, this.parent.ctx);
      if (this.fiber?.uid && (diff.includes("config") || this.options.group)) await this.fiber.update(this.options.config, true);
    });
  }
  async refresh() {
    if (this.fiber) return;
    if (this.disabled) return;
    await this.init();
  }
  async _dispose(fiber = this.fiber) {
    if (!fiber) return;
    if (this.fiber === fiber) this.fiber = void 0;
    this._disposing += 1;
    try {
      await fiber.dispose();
    } finally {
      this._disposing -= 1;
    }
  }
  /** Merge new options, restart as needed, and persist through the parent tree. */
  async update(options, create = false, force = false) {
    const previousOptions = this.options;
    const legacy = { ...previousOptions };
    const candidate = create ? options : { ...previousOptions };
    if (!create) for (const [key, value] of Object.entries(options)) if (isNullable(value)) delete candidate[key];
    else candidate[key] = value;
    sortKeys(candidate);
    const diff = Object.keys({
      ...candidate,
      ...legacy
    }).filter((key) => !deepEqual(candidate[key], legacy[key]));
    if (!diff.length && !force) return;
    const commit = () => {
      if (create) return;
      this.options = replaceKeys(previousOptions, candidate);
    };
    const previous = this.fiber;
    if (!previous?.uid) {
      this.fiber = void 0;
      this.options = candidate;
      try {
        if (!this._disabled(candidate)) await this.init();
      } catch (error) {
        this.options = previousOptions;
        throw error;
      }
      commit();
      return;
    }
    if (this._disabled(candidate)) {
      this.options = candidate;
      try {
        await this._dispose(previous);
      } catch (error) {
        this.options = previousOptions;
        throw updateError("dispose", candidate, error);
      }
      commit();
      this.context.emit("loader/partial-dispose", this, legacy, true);
      return;
    }
    if (!diff.some((key) => key === "name" || key === "inject" || key === "group")) {
      this.options = candidate;
      try {
        await this._patchContext(diff);
      } catch (error) {
        this.options = previousOptions;
        try {
          await this._patchContext(diff);
        } catch (rollbackError) {
          throw updateError("rollback", legacy, new AggregateError([error, rollbackError]));
        }
        this.context.emit("loader/partial-dispose", this, candidate, true);
        throw updateError("apply", candidate, error);
      }
      commit();
      this.context.emit("loader/partial-dispose", this, legacy, true);
      return;
    }
    let plugin;
    try {
      plugin = diff.includes("name") ? this.loader.unwrapExports(await this.parent.tree.import(candidate.name, this.getOuterStack)) : previous.runtime.callback;
    } catch (error) {
      throw updateError("import", candidate, error);
    }
    const previousPlugin = previous.runtime.callback;
    this.options = candidate;
    try {
      await this._dispose(previous);
    } catch (error) {
      this.options = previousOptions;
      throw updateError("dispose", candidate, error);
    }
    try {
      await this._start(plugin);
    } catch (error) {
      this.options = previousOptions;
      try {
        await this._start(previousPlugin);
      } catch (rollbackError) {
        throw updateError("rollback", legacy, new AggregateError([error, rollbackError]));
      }
      this.context.emit("loader/partial-dispose", this, candidate, true);
      throw updateError("apply", candidate, error);
    }
    commit();
    this.context.emit("loader/partial-dispose", this, legacy, true);
  }
  getOuterStack = () => {
    let entry = this;
    const result = [];
    do {
      result.push(`    at ${entry.parent.tree.ctx.baseUrl}#${entry.options.id}`);
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
    return result;
  };
  /** Import and start the configured plugin if it is not already running. */
  async init() {
    try {
      await (this._initTask ??= this._init());
    } finally {
      this._initTask = void 0;
      if (!this.loader.getTasks().length) this.ctx.reflect.notify(["loader"]);
    }
    await this._await();
  }
  async _await() {
    try {
      await this.fiber?.await();
    } catch (error) {
      throw updateError("apply", this.options, error);
    }
  }
  async _init() {
    let plugin;
    try {
      plugin = this.loader.unwrapExports(await this.parent.tree.import(this.options.name, this.getOuterStack));
    } catch (error) {
      throw updateError("import", this.options, error);
    }
    try {
      await this._start(plugin);
    } catch (error) {
      throw updateError("apply", this.options, error);
    }
  }
  async _start(plugin) {
    let fiber;
    try {
      await this._patchContext([]);
      this.loader.showLog(this, "apply");
      fiber = this.fiber = this.ctx.registry.plugin(plugin, this.options.config, this.getOuterStack);
      await fiber.await();
    } catch (error) {
      await this._dispose(fiber);
      throw error;
    }
  }
};
function swap(target, source) {
  for (const key of Reflect.ownKeys(target)) Reflect.deleteProperty(target, key);
  for (const key of Reflect.ownKeys(source || {})) Reflect.defineProperty(target, key, Reflect.getOwnPropertyDescriptor(source, key));
}
var Realm = class {
  store = /* @__PURE__ */ Object.create(null);
  access(key, create = false) {
    if (create) return this.store[key] ??= /* @__PURE__ */ Symbol(`${key}${this.suffix}`);
    else return this.store[key] ?? /* @__PURE__ */ Symbol(`${key}${this.suffix}`);
  }
  delete(key) {
    delete this.store[key];
  }
  get size() {
    return Object.keys(this.store).length;
  }
};
var LocalRealm = class extends Realm {
  entry;
  constructor(entry) {
    super();
    this.entry = entry;
  }
  get suffix() {
    return "#" + this.entry.options.id;
  }
};
var GlobalRealm = class extends Realm {
  label;
  constructor(label) {
    super();
    this.label = label;
  }
  get suffix() {
    return "@" + this.label;
  }
};
function isolate(ctx) {
  const realms = /* @__PURE__ */ Object.create(null);
  const delims = /* @__PURE__ */ Object.create(null);
  function access(entry, name, create = false) {
    let realm;
    const label = entry.options.isolate?.[name];
    if (!label) return;
    if (label === true) realm = entry.realm ??= new LocalRealm(entry);
    else if (create) realm = realms[label] ??= new GlobalRealm(label);
    else realm = realms[label];
    return realm?.access(name, create);
  }
  ctx.on("loader/entry-init", (entry) => {
    entry.ctx[Context.intercept] = Object.create(entry.ctx[Context.intercept]);
    entry.ctx[Context.isolate] = Object.create(entry.ctx[Context.isolate]);
  });
  ctx.on("loader/patch-context", async (entry, next) => {
    const newMap = Object.create(entry.parent.ctx[Context.isolate]);
    for (const name of Object.keys(entry.options.isolate ?? {})) newMap[name] = access(entry, name, true);
    const diff = /* @__PURE__ */ Object.create(null);
    const oldMap = entry.ctx[Context.isolate];
    for (const name in {
      ...newMap,
      ...delims
    }) {
      if (newMap[name] === oldMap[name]) continue;
      const delim = delims[name] ??= /* @__PURE__ */ Symbol(`delim:${name}`);
      entry.ctx[delim] = /* @__PURE__ */ Symbol(`${name}#${entry.id}`);
      for (const symbol of [oldMap[name], newMap[name]]) {
        const impl = symbol && entry.ctx.reflect.store[symbol];
        if (!impl) continue;
        if (!impl.fiber) {
          entry.ctx.logger.warn(/* @__PURE__ */ new Error(`expected service ${name} to be implemented`));
          continue;
        }
        diff[name] = [
          oldMap[name],
          newMap[name],
          entry.ctx[delim],
          impl.fiber.ctx[delim]
        ];
        if (entry.ctx[delim] !== impl.fiber.ctx[delim]) break;
      }
    }
    Object.setPrototypeOf(entry.ctx[Context.isolate], entry.parent.ctx[Context.isolate]);
    Object.setPrototypeOf(entry.ctx[Context.intercept], entry.parent.ctx[Context.intercept]);
    swap(entry.ctx[Context.isolate], newMap);
    swap(entry.ctx[Context.intercept], entry.options.intercept);
    await next();
    for (const [symbol1, symbol2, flag1, flag2] of Object.values(diff)) if (flag1 === flag2 && entry.ctx.reflect.store[symbol1] && !entry.ctx.reflect.store[symbol2]) {
      entry.ctx.reflect.store[symbol2] = entry.ctx.reflect.store[symbol1];
      delete entry.ctx.reflect.store[symbol1];
    }
    ctx.reflect.notify(Object.keys(diff), (ctx2, name) => {
      const [symbol1, symbol2, flag1, flag2] = diff[name];
      const symbol3 = ctx2[Context.isolate][name];
      const flag3 = ctx2[delims[name]];
      return (symbol1 === symbol3 || symbol2 === symbol3) && flag1 === flag3 !== (flag1 === flag2);
    });
    for (const name in delims) if (!Reflect.ownKeys(newMap).includes(name)) delete entry.ctx[delims[name]];
  });
  ctx.on("loader/partial-dispose", (entry, legacy, active) => {
    for (const [name, label] of Object.entries(legacy.isolate ?? {})) {
      if (label === true) continue;
      if (active && entry.options.isolate?.[name] === label) continue;
      const realm = realms[label];
      if (!realm) continue;
      for (const entry2 of ctx.loader.entries()) if (entry2.options.isolate?.[name] === realm.label) return;
      realm.delete(name);
      if (!realm.size) delete realms[realm.label];
    }
  });
}
var Loader = class extends EntryTree {
  config;
  envData = process.env.CORDIS_SHARED ? JSON.parse(process.env.CORDIS_SHARED) : { startTime: Date.now() };
  name = "loader";
  internal = ModuleLoader.fromInternal();
  builtins = /* @__PURE__ */ Object.create(null);
  constructor(ctx, config = {}) {
    super(ctx);
    this.config = config;
    if (config.baseUrl) this.ctx.baseUrl = config.baseUrl;
    const self = this;
    defineProperty(this, Service.tracker, {
      associate: "loader",
      property: "ctx",
      noShadow: true
    });
    ctx.reflect.provide("loader", this, this[Service.check]);
    ctx.on("internal/config", function(_config, next) {
      const config2 = next();
      if (!this.entry || this.parent.fiber?.entry === this.entry) return config2;
      if (this.runtime?.callback?.[EntryGroup.key]) return config2;
      return interpolate(this.ctx, config2);
    }, { global: true });
    ctx.on("internal/update", async function(config2, noSave, next) {
      if (!this.entry || noSave || this.parent.fiber?.entry === this.entry) return next();
      await next();
      const unparse = this.runtime?.Config?.["simplify"];
      this.entry.options.config = unparse ? unparse(config2) : config2;
      this.entry.parent.tree.write();
    }, {
      global: true,
      prepend: true
    });
    ctx.on("internal/update", function(config2, _, next) {
      if (!this.entry || this.parent.fiber?.entry === this.entry) return next();
      self.showLog(this.entry, "reload");
      return next();
    }, { global: true });
    ctx.on("internal/plugin", (fiber) => {
      if (fiber.parent[Entry.key] && !fiber.entry) {
        fiber.entry = fiber.parent[Entry.key];
        Inject.resolve(fiber.entry.options.inject, fiber.inject);
      }
      if (fiber.uid) return;
      if (!fiber.entry) return;
      if (fiber.parent.fiber?.entry === fiber.entry) return;
      if (!ctx.registry.has(fiber.runtime.callback)) return;
      const treeOwner = fiber.entry.parent.tree.ctx.fiber;
      if (!treeOwner.uid || treeOwner.state === 5) return;
      if (fiber.entry._disposing) return;
      this.showLog(fiber.entry, "unload");
      if (fiber.entry.disabled) return;
      fiber.entry.options.disabled = true;
      fiber.entry.parent.tree.write();
    });
    ctx.plugin(isolate);
  }
  write() {
  }
  [Service.check]() {
    if (Service.prototype[Service.resolveConfig].call(this).await && this.getTasks().length) return false;
    return true;
  }
  showLog(entry, type) {
    if (entry.options.group || !entry.parent.tree.enableLogs) return;
    this.ctx.root.logger?.("loader").info("%s plugin %C", type, entry.options.name);
  }
  /** Return the loader entry id that owns `fiber`, if any. */
  locate(fiber = this.ctx.fiber) {
    while (1) {
      if (fiber.entry) return fiber.entry.id;
      const next = fiber.parent.fiber;
      if (fiber === next) return;
      fiber = next;
    }
  }
  /** Hook for hosts that can restart the process on full-reload requests. */
  exit() {
  }
  /** Normalize ESM/CJS/default export shapes before applying a plugin. */
  unwrapExports(exports) {
    if (isNullable(exports)) return exports;
    exports = exports.default ?? exports;
    if (!exports.__esModule) return exports;
    return exports.default ?? exports;
  }
};
export {
  Entry,
  EntryGroup,
  EntryTree,
  GlobalRealm,
  Group,
  Loader,
  LocalRealm,
  ModuleLoader,
  Realm,
  Loader as default,
  evaluate,
  interpolate,
  isJsExpr
};
