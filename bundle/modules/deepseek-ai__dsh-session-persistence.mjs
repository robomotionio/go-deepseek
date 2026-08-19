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
      setupBarrier ??= new Promise((resolve2, reject) => {
        resolveSetup = resolve2;
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

// ../../source/deepseek-harness/vendor/cordis/src/registry.ts
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
        const property2 = this[symbols.tracker]?.property;
        (this[symbols.initHooks] ??= []).push(() => {
          this.ctx.inject(inject, (ctx) => {
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
  function resolve2(inject, result = /* @__PURE__ */ Object.create(null)) {
    if (!inject) return result;
    if (Array.isArray(inject)) {
      for (const name of inject) {
        result[name] = null;
      }
    } else if (Reflect.has(inject, symbols.checkProto)) {
      Object.assign(result, resolve2(Object.getPrototypeOf(inject)));
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
  Inject2.resolve = resolve2;
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

// ../../source/deepseek-harness/packages/llm/llm/src/brand.ts
function MessageId(id) {
  return id;
}

// ../../source/deepseek-harness/packages/llm/llm/src/call-config.ts
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
function freezeMessage(message) {
  return deepFreeze(structuredClone(message));
}

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
Schema.extend = function extend(type, resolve2) {
  resolvers[type] = resolve2;
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
function defineMethod(name, keys, format) {
  formatters[name] = format;
  Object.assign(Schema, {
    [name](...args) {
      const schema = new Schema({ type: name });
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
      if (name === "object" || name === "dict") {
        schema.meta.default = {};
      } else if (name === "array" || name === "tuple") {
        schema.meta.default = [];
      } else if (name === "bitset") {
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
var src_default = Schema;

// ../../source/deepseek-harness/packages/util/timeout/src/index.ts
var MAX_TIMER_DELAY_MS = 2147483647;

// ../../source/deepseek-harness/packages/llm/llm/src/error.ts
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
var backoffSchema = src_default.object({
  initialDelayMs: src_default.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_INITIAL_DELAY_MS),
  maxDelayMs: src_default.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_MAX_DELAY_MS),
  jitterRatio: src_default.number().min(0).max(1).default(DEFAULT_JITTER_RATIO)
});
var normalPolicySchema = src_default.object({
  mode: src_default.const("normal").required(),
  maxRetries: src_default.number().step(1).min(0).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_RETRIES),
  retryableCodes: src_default.array(src_default.string()).default([...DEFAULT_RETRYABLE_CODES]),
  backoff: backoffSchema
});
var alwaysPolicySchema = src_default.object({
  mode: src_default.const("always").required(),
  backoff: backoffSchema
});
var RetryPolicySchema = src_default.union([
  normalPolicySchema,
  alwaysPolicySchema
]);

// ../../source/deepseek-harness/packages/llm/llm/src/attribution.ts
import { createRequire } from "node:module";
var { version } = createRequire(import.meta.url)("../package.json");

// ../../source/deepseek-harness/packages/core/session/src/types.ts
var SESSION_FORMAT_VERSION = 0;

// ../../source/deepseek-harness/packages/core/session/src/json.ts
function hasIntrinsicConstructor(prototype, name) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === `function ${name}() { [native code] }`;
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
var TOOL_OUTCOME_UNKNOWN = "TOOL_OUTCOME_UNKNOWN";
function interruptedTurnClosers(events) {
  let openTurn = null;
  let openStep = null;
  const pendingCalls = /* @__PURE__ */ new Map();
  for (const event of events) {
    switch (event.type) {
      case "turn/start":
        openTurn = event.data.turn;
        openStep = null;
        pendingCalls.clear();
        break;
      case "turn/end":
        openTurn = null;
        openStep = null;
        pendingCalls.clear();
        break;
      case "step/start":
        openStep = event.data.step;
        break;
      case "step/end":
        pendingCalls.clear();
        openStep = null;
        break;
      case "assistant/message":
        for (const block of event.data.message.content) {
          if (block.type === "tool-call") pendingCalls.set(block.id, { step: event.data.step });
        }
        break;
      case "tool/call":
        {
          const entry = pendingCalls.get(event.data.callId);
          if (entry) {
            entry.callSeq = event.seq;
          }
        }
        break;
      case "tool/result":
        pendingCalls.delete(event.data.message.source.callId);
        break;
      // Other event types do not move the turn/step boundary cursor.
      default:
        break;
    }
  }
  const last = events.at(-1);
  if (openTurn === null || last === void 0) return [];
  let seq = last.seq + 1;
  const time = last.time;
  const closers = [];
  for (const [callId, { step, callSeq }] of pendingCalls) {
    const started = callSeq !== void 0;
    const message = freezeMessage({
      id: MessageId(`interrupted-tool-result-${callId}-${seq}`),
      role: "user",
      source: { kind: "tool", callId },
      content: [{
        type: "tool-result",
        toolCallId: callId,
        isError: true,
        content: [{
          type: "text",
          text: started ? "The tool call was interrupted after it was recorded, but no result was durably recorded. Its outcome is unknown. Decide whether to retry from the tool semantics: retry only if the operation is read-only or idempotent; if it may have side effects, first verify external state or ask the user. Do not retry blindly." : "The tool call was interrupted before the Harness recorded it as started. Retry it if it is still needed."
        }]
      }]
    });
    closers.push({
      type: "tool/result",
      seq: seq++,
      time,
      data: {
        turn: openTurn,
        step,
        message,
        error: started ? { name: "ToolOutcomeUnknownError", code: TOOL_OUTCOME_UNKNOWN } : { name: "ToolNotStartedError", code: TOOL_NOT_STARTED }
      },
      surfaceOp: "append",
      ...started ? { sourceEventSeqs: [callSeq] } : {}
    });
  }
  if (openStep !== null) {
    closers.push({ type: "step/end", seq: seq++, time, data: { turn: openTurn, step: openStep } });
  }
  closers.push({ type: "turn/end", seq: seq++, time, data: { turn: openTurn, reason: { kind: "interrupted" } } });
  return closers;
}

// ../../source/deepseek-harness/packages/core/session/src/known-event-types.ts
var KNOWN_SESSION_EVENT_TYPES = /* @__PURE__ */ new Set([
  "agent-preset/selected",
  "agent/inbox/spliced",
  "approval/asked",
  "approval/decided",
  "approval/policy",
  "assistant/chunk",
  "assistant/message",
  "command/done",
  "command/run",
  "compaction/end",
  "compaction/prune",
  "compaction/start",
  "compaction/summary",
  "feedback/record",
  "goal/change",
  "hook/invoked",
  "hook/result",
  "llm/retry",
  "llm/retry-started",
  "permission/preset",
  "plan/mode",
  "request/context",
  "request/header",
  "sandbox/mode",
  "schedule/change",
  "session/end-seed",
  "session/title",
  "session/title-llm-request",
  "step/end",
  "step/start",
  "subagent/descriptor",
  "todo/write",
  "tool-workflow/agent-end",
  "tool-workflow/agent-start",
  "tool-workflow/run-end",
  "tool-workflow/run-start",
  "tool/call",
  "tool/code-dispatch",
  "tool/code-dispatch-start",
  "tool/result",
  "turn/end",
  "turn/start",
  "user/message",
  "web/deepseek-search-llm-request"
]);

// ../../source/deepseek-harness/packages/core/session/src/index.ts
function adoptSessionEvent(event) {
  assertMessageEventShape(
    event,
    `session event at seq ${event.seq}`
  );
  switch (event.type) {
    case "user/message":
      deepFreeze(event.data);
      break;
    case "assistant/message":
    case "tool/result":
      deepFreeze(event.data.message);
      break;
    default:
      break;
  }
  return event;
}
function snapshotSessionEvent(event) {
  return adoptSessionEvent(structuredClone(event));
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

// ../../source/deepseek-harness/packages/session/session-persistence/lib/index.js
function SessionPersistenceRevision(value) {
  return value;
}
var SessionPreparations = class {
  capacity;
  entries = /* @__PURE__ */ new Map();
  constructor(capacity) {
    this.capacity = capacity;
  }
  /**
  * Whether this pool currently knows about an unpublished identity.
  * @param id - session identity.
  * @returns whether an entry exists for the identity.
  */
  has(id) {
    return this.entries.has(id);
  }
  /**
  * Observe one prepared source, sharing an in-flight read for the same id.
  * @param id - session identity.
  * @param load - cold loader used when no entry exists.
  * @param signal - optional cancellation signal while waiting.
  * @returns the shared prepared source.
  */
  async inspect(id, load, signal) {
    const entry = this.entryFor(id, load);
    const loaded = signal === void 0 ? await entry.result : await observeQueuedAbort(entry.result, signal);
    const source = entry.source ?? loaded;
    if (this.entries.get(id) === entry && entry.phase === "ready") this.touch(entry);
    return source;
  }
  /**
  * Reserve one ready source after committing its pending durable repair.
  * @param id - session identity.
  * @param load - cold loader used when no entry exists.
  * @param commit - durable repair and cursor-state commit.
  * @param signal - optional cancellation signal while waiting.
  * @returns the exclusive reservation, or undefined if its entry was invalidated.
  */
  async reserve(id, load, commit, signal) {
    const entry = this.entryFor(id, load);
    await (signal === void 0 ? entry.result : observeQueuedAbort(entry.result, signal));
    while (this.entries.get(id) === entry && entry.phase !== "ready") {
      const settled = entry.reservationSettled;
      if (settled === void 0) throw new Error(`session "${id}" preparation lost its reservation waiter`);
      if (signal === void 0) await settled;
      else await observeQueuedAbort(settled, signal);
    }
    if (this.entries.get(id) !== entry) return void 0;
    const source = entry.source;
    const reservationSettled = Promise.withResolvers();
    entry.phase = "committing";
    entry.reservationSettled = reservationSettled.promise;
    entry.settleReservation = reservationSettled.resolve;
    let committed;
    try {
      committed = await commit(source);
    } catch (error) {
      this.remove(entry);
      throw error;
    }
    if (committed === void 0) {
      this.remove(entry);
      return;
    }
    entry.source = committed.source;
    try {
      signal?.throwIfAborted();
    } catch (error) {
      this.makeReady(entry);
      throw error;
    }
    if (this.entries.get(id) !== entry) return void 0;
    const reservation = {
      entry,
      source: committed.source,
      state: committed.state
    };
    entry.phase = "reserved";
    entry.reservation = reservation;
    return reservation;
  }
  /**
  * Return the exact reservation for Session publication, rejecting aliases.
  * @param session - exact Session candidate for publication.
  * @returns its reservation, or undefined when no preparation exists.
  */
  reservationFor(session) {
    const entry = this.entries.get(session.id);
    if (entry === void 0) return void 0;
    if (entry.phase === "reserved" && entry.source?.session === session && entry.reservation !== void 0) return entry.reservation;
    throw new Error(`cannot publish session "${session.id}": persisted state already owns this identity`);
  }
  /**
  * Consume a reservation after its exact Session has attached.
  * @param reservation - reservation to consume.
  */
  attach(reservation) {
    const { entry } = reservation;
    if (this.entries.get(entry.id) !== entry || entry.reservation !== reservation) throw new Error(`session "${entry.id}" preparation is no longer reserved`);
    this.remove(entry);
  }
  /**
  * Consume a reservation whose caller only needs the committed inspection.
  * @param reservation - reservation to consume.
  */
  discard(reservation) {
    const { entry } = reservation;
    if (this.entries.get(entry.id) !== entry || entry.reservation !== reservation) return;
    this.remove(entry);
  }
  /**
  * Return a reusable unpublished reservation to the ready LRU.
  * @param reservation - reservation to release.
  * @param reusable - whether the source remains valid for reuse.
  */
  release(reservation, reusable) {
    const { entry } = reservation;
    if (this.entries.get(entry.id) !== entry || entry.reservation !== reservation || entry.phase !== "reserved") return;
    if (!reusable) {
      this.remove(entry);
      return;
    }
    delete entry.reservation;
    this.makeReady(entry);
  }
  /**
  * Discard a prepared view after the durable log changes.
  * @param id - changed session identity.
  */
  invalidate(id) {
    const entry = this.entries.get(id);
    if (entry !== void 0) this.remove(entry);
  }
  /**
  * Discard an exact stale ready source without disturbing an exclusive owner.
  * @param id - changed session identity.
  * @param expected - exact source observed before its revision check.
  * @returns whether the source was discarded, retained by a reservation, or is absent.
  */
  discardReady(id, expected) {
    const entry = this.entries.get(id);
    if (entry === void 0 || entry.source !== expected) return "missing";
    if (entry.phase !== "ready") return "retained";
    this.remove(entry);
    return "discarded";
  }
  /**
  * Reject writes while an unpublished Session exclusively reserves the id.
  * @param id - session identity to check.
  */
  assertWritable(id) {
    const phase = this.entries.get(id)?.phase;
    if (phase === "committing" || phase === "reserved") throw new Error(`cannot append session "${id}" while its persisted preparation is reserved`);
  }
  /**
  * Remove a completed entry for an already-serialized append adoption.
  * @param id - adopted session identity.
  * @returns the prepared source, or undefined when no ready entry exists.
  */
  takeReady(id) {
    const entry = this.entries.get(id);
    if (entry === void 0 || entry.phase !== "ready" || entry.source === void 0) return void 0;
    this.remove(entry);
    return entry.source;
  }
  entryFor(id, load) {
    const existing = this.entries.get(id);
    if (existing !== void 0) return existing;
    const deferred = Promise.withResolvers();
    const entry = {
      id,
      result: deferred.promise,
      phase: "loading"
    };
    this.entries.set(id, entry);
    let loading;
    try {
      loading = load();
    } catch (error) {
      this.remove(entry);
      deferred.reject(error);
      return entry;
    }
    loading.then((source) => {
      if (this.entries.get(id) === entry) {
        entry.source = source;
        this.makeReady(entry);
      }
      deferred.resolve(source);
    }, (error) => {
      this.remove(entry);
      deferred.reject(error);
    });
    return entry;
  }
  makeReady(entry) {
    if (this.entries.get(entry.id) !== entry) return;
    entry.phase = "ready";
    const settle = entry.settleReservation;
    delete entry.reservationSettled;
    delete entry.settleReservation;
    settle?.();
    this.touch(entry);
  }
  remove(entry) {
    if (this.entries.get(entry.id) !== entry) return;
    this.entries.delete(entry.id);
    const settle = entry.settleReservation;
    delete entry.reservationSettled;
    delete entry.settleReservation;
    settle?.();
  }
  touch(entry) {
    this.entries.delete(entry.id);
    this.entries.set(entry.id, entry);
    let readyCount = 0;
    for (const candidate of this.entries.values()) if (candidate.phase === "ready") readyCount += 1;
    if (readyCount <= this.capacity) return;
    for (const [id, candidate] of this.entries) {
      if (candidate.phase !== "ready") continue;
      this.entries.delete(id);
      return;
    }
  }
};
function observeQueuedAbort(operation, signal, started = () => false) {
  return new Promise((resolve2, reject) => {
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      callback();
    };
    const onAbort = () => {
      if (started()) return;
      finish(() => {
        try {
          signal.throwIfAborted();
        } catch (reason) {
          rejectObservation(reject, reason);
          return;
        }
        reject(/* @__PURE__ */ new Error("queued observation abort event lacked an aborted signal"));
      });
    };
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then((value) => {
      finish(() => {
        resolve2(value);
      });
    }, (reason) => {
      finish(() => {
        rejectObservation(reject, reason);
      });
    });
    if (signal.aborted) onAbort();
  });
}
function rejectObservation(reject, reason) {
  reject(reason);
}
var SessionWriteBehind = class {
  options;
  pending = [];
  timer;
  active;
  barrier;
  deadlineExpired = false;
  automaticPaused = false;
  /**
  * @param options - fixed scheduling policy and durable batch sink.
  */
  constructor(options) {
    this.options = options;
  }
  /** Whether this controller owns queued events or an active durable write. */
  get hasWork() {
    return this.pending.length > 0 || this.active !== void 0;
  }
  /**
  * Copy one event into the persistence-owned queue and start a fixed deadline
  * when the automatic path is idle.
  * @param event - frozen live event to retain independently of its producer.
  */
  enqueue(event) {
    const wasEmpty = this.pending.length === 0;
    this.pending.push(structuredClone(event));
    if (this.barrier !== void 0) return;
    if (this.automaticPaused) {
      this.automaticPaused = false;
      this.deadlineExpired = false;
      this.armTimer();
    } else if (wasEmpty) this.armTimer();
  }
  /**
  * Cancel the batching wait and durably drain through a quiescent point.
  * Concurrent callers join the same barrier.
  * @returns a promise that rejects if the barrier's durable retry fails.
  */
  flush() {
    if (this.barrier !== void 0) return this.barrier;
    this.cancelTimer();
    this.deadlineExpired = false;
    this.automaticPaused = false;
    const barrier = Promise.withResolvers();
    this.barrier = barrier.promise;
    this.drainBarrier(barrier.resolve, barrier.reject);
    return barrier.promise;
  }
  /** Cancel the current automatic deadline without draining retained work. */
  cancelAutomaticWait() {
    this.cancelTimer();
    this.deadlineExpired = false;
  }
  /** Start the one fixed window for the current pending prefix. */
  armTimer() {
    this.timer = setTimeout(() => {
      this.onDeadline();
    }, this.options.maxDelayMs);
  }
  /** Cancel any pending automatic deadline. */
  cancelTimer() {
    if (this.timer === void 0) return;
    clearTimeout(this.timer);
    this.timer = void 0;
  }
  /** Start a background write now, or remember that an active write used the budget. */
  onDeadline() {
    this.timer = void 0;
    if (this.active !== void 0) {
      this.deadlineExpired = true;
      return;
    }
    this.startBackground();
  }
  /** Start one detached write whose failure is reported and retained. */
  startBackground() {
    this.startWrite(true).then(() => {
      this.continueAutomatic();
    }, () => {
    });
  }
  /** Continue immediately after an over-budget active write, otherwise keep its timer. */
  continueAutomatic() {
    if (this.barrier !== void 0 || this.pending.length === 0) return;
    if (this.deadlineExpired) {
      this.deadlineExpired = false;
      this.startBackground();
    }
  }
  /** Await overlapping work, drain to quiescence, and settle the shared barrier. */
  async drainBarrier(resolve2, reject) {
    try {
      const overlapping = this.active;
      if (overlapping !== void 0) {
        await Promise.allSettled([overlapping]);
        this.automaticPaused = false;
      }
      while (this.pending.length > 0) await this.startWrite(false);
    } catch (error) {
      this.barrier = void 0;
      reject(error);
      return;
    }
    this.barrier = void 0;
    resolve2();
  }
  /** Start one stable pending prefix, retaining it in order if durability fails. */
  startWrite(background) {
    const batch = this.pending.splice(0);
    this.cancelTimer();
    this.deadlineExpired = false;
    const active = Promise.resolve().then(() => this.options.write(batch)).catch((error) => {
      this.pending = batch.concat(this.pending);
      this.cancelTimer();
      this.deadlineExpired = false;
      this.automaticPaused = true;
      if (background) this.options.reportBackgroundFailure(error);
      throw error;
    }).finally(() => {
      this.active = void 0;
    });
    this.active = active;
    return active;
  }
};
var DEFAULT_PREPARED_SESSION_CACHE_SIZE = 5;
var DEFAULT_WRITE_BATCH_MAX_DELAY_MS = 200;
var MAX_WRITE_BATCH_DELAY_MS = MAX_TIMER_DELAY_MS;
var SessionPersistenceCorruptionError = class extends Error {
  /**
  * @param message - stable corruption context.
  * @param options - original validation failure.
  */
  constructor(message, options) {
    super(message, options);
    this.name = "SessionPersistenceCorruptionError";
  }
};
var SessionFormatUnsupportedError = class extends Error {
  location;
  /**
  * @param message - stable reason the log cannot be interpreted, already
  *   including the raw-log path when one exists.
  * @param location - the backend's artifact location, when one exists.
  */
  constructor(message, location) {
    super(message);
    this.location = location;
    this.name = "SessionFormatUnsupportedError";
  }
};
function sessionFormatVersionRefusal(id, version2) {
  return version2 > SESSION_FORMAT_VERSION ? `session "${id}" uses log format v${version2}, but this harness reads only v${SESSION_FORMAT_VERSION}: the log was written by a newer harness \u2014 upgrade the harness to open it` : `session "${id}" uses log format v${version2}, older than the supported v${SESSION_FORMAT_VERSION}, and this build ships no upgrade path for it`;
}
async function settledErrors(promises) {
  const settled = await Promise.allSettled([...promises]);
  const errors = [];
  for (const result of settled) if (result.status === "rejected") errors.push(result.reason);
  return errors;
}
function seedCoversPrefix(seed, prefix) {
  return prefix.length <= seed.length && prefix.every((event, index) => {
    const seedEvent = seed[index];
    return seedEvent !== void 0 && JSON.stringify(seedEvent) === JSON.stringify(event);
  });
}
function assertSupportedEvents(events, id) {
  const legacyType = "request/header-delta";
  const legacy = events.find((event) => event.type === legacyType);
  if (legacy !== void 0) throw new Error(`session "${id}" contains unsupported legacy request/header-delta event at seq ${legacy.seq}`);
  const legacyModeType = "mode/set";
  const legacyMode = events.find((event) => event.type === legacyModeType);
  if (legacyMode !== void 0) throw new Error(`session "${id}" contains unsupported legacy mode/set event at seq ${legacyMode.seq}`);
  const fallback = events.find((event) => event.type === "request/header" && event.data.reason === "fallback");
  if (fallback !== void 0) throw new Error(`session "${id}" contains unsupported legacy request/header reason "fallback" at seq ${fallback.seq}`);
}
function asRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function hasOnlyKeys(record, required, optional = []) {
  const allowed = [...required, ...optional];
  return Object.keys(record).every((key) => allowed.includes(key)) && required.every((key) => Object.hasOwn(record, key));
}
function legacyMessageId(id, seq) {
  return `legacy-message:${id}:${seq}`;
}
function replacementStart(event) {
  const op = asRecord(event.surfaceOp);
  return op?.["op"] === "replace" && typeof op["start"] === "number" ? op["start"] : void 0;
}
function needsLegacyPrefix(event) {
  const data = asRecord(event.data);
  if (event.type === "steering/message") return true;
  if (data === void 0) return false;
  switch (event.type) {
    case "user/message":
      return !Object.hasOwn(data, "id") && Object.hasOwn(data, "content");
    case "assistant/message":
      return !Object.hasOwn(data, "message") && Object.hasOwn(data, "content");
    case "tool/result":
      return !Object.hasOwn(data, "message") && Object.hasOwn(data, "callId");
    default:
      return false;
  }
}
function migrateLegacySteeringEvent(event, id) {
  if (event.type !== "steering/message") return event;
  const data = asRecord(event.data);
  if (data === void 0) throw new Error(`session "${id}" contains malformed pre-react-loop steering/message at seq ${event.seq}`);
  const wrapped = asRecord(data["message"]);
  if (wrapped !== void 0 && Number.isSafeInteger(data["turn"]) && hasOnlyKeys(data, ["turn", "message"])) return {
    ...event,
    type: "user/message",
    data: wrapped
  };
  if (!Number.isSafeInteger(data["turn"]) || !hasOnlyKeys(data, [
    "turn",
    "content",
    "source"
  ])) throw new Error(`session "${id}" contains malformed pre-react-loop steering/message at seq ${event.seq}`);
  const { turn: _turn, ...message } = data;
  return {
    ...event,
    type: "user/message",
    data: {
      ...message,
      id: legacyMessageId(id, event.seq),
      role: "user"
    }
  };
}
function migrateLegacyTurnStartEvent(event, id) {
  if (event.type !== "turn/start") return event;
  const data = asRecord(event.data);
  if (data === void 0 || !Object.hasOwn(data, "trigger")) return event;
  const trigger = asRecord(data["trigger"]);
  if (!Number.isSafeInteger(data["turn"]) || data["turn"] < 1 || !hasOnlyKeys(data, ["turn", "trigger"]) || trigger === void 0 || typeof trigger["kind"] !== "string" || trigger["kind"].length === 0) throw new Error(`session "${id}" contains malformed pre-react-loop turn/start at seq ${event.seq}`);
  return {
    ...event,
    data: { turn: data["turn"] }
  };
}
function migrateLegacyTurnEndEvent(event, id) {
  if (event.type !== "turn/end") return event;
  const data = asRecord(event.data);
  if (data === void 0) return event;
  const malformed = () => {
    throw new Error(`session "${id}" contains malformed pre-react-loop turn/end at seq ${event.seq}`);
  };
  const reason = asRecord(data["reason"]);
  if (!Number.isSafeInteger(data["turn"]) || data["turn"] < 1 || !hasOnlyKeys(data, ["turn", "reason"]) || reason === void 0 || typeof reason["kind"] !== "string") return malformed();
  let currentReason;
  switch (reason["kind"]) {
    case "completed":
    case "blocked":
    case "max-tokens":
    case "interrupted":
      if (!hasOnlyKeys(reason, ["kind"])) return malformed();
      return event;
    case "aborted":
      if (Object.hasOwn(reason, "reason")) return event;
      if (!hasOnlyKeys(reason, ["kind"])) return malformed();
      currentReason = {
        kind: "aborted",
        reason: { kind: "legacy" }
      };
      break;
    case "disposed":
      if (!hasOnlyKeys(reason, ["kind"])) return malformed();
      currentReason = {
        kind: "aborted",
        reason: { kind: "disposed" }
      };
      break;
    case "error": {
      if (Object.hasOwn(reason, "error")) return event;
      if (!Number.isSafeInteger(reason["step"]) || reason["step"] < 0) return malformed();
      const failure = asRecord(reason["failure"]);
      if (failure !== void 0 && hasOnlyKeys(reason, [
        "kind",
        "step",
        "failure"
      ]) && hasOnlyKeys(failure, ["message", "code"], [
        "status",
        "providerRetryAfterMs",
        "requestId"
      ]) && typeof failure["message"] === "string" && typeof failure["code"] === "string" && (failure["status"] === void 0 || typeof failure["status"] === "number") && (failure["providerRetryAfterMs"] === void 0 || typeof failure["providerRetryAfterMs"] === "number") && (failure["requestId"] === void 0 || typeof failure["requestId"] === "string")) {
        currentReason = {
          kind: "error",
          error: failure
        };
        break;
      }
      if (!hasOnlyKeys(reason, reason["code"] === void 0 ? [
        "kind",
        "step",
        "message"
      ] : [
        "kind",
        "step",
        "message",
        "code"
      ]) || typeof reason["message"] !== "string" || reason["code"] !== void 0 && typeof reason["code"] !== "string") return malformed();
      currentReason = {
        kind: "error",
        error: {
          message: reason["message"],
          code: typeof reason["code"] === "string" ? reason["code"] : "UNKNOWN"
        }
      };
      break;
    }
    default:
      return event;
  }
  return {
    ...event,
    data: {
      ...data,
      reason: currentReason
    }
  };
}
function migrateLegacyMessageEvent(event, id, messageIds) {
  const data = asRecord(event.data);
  if (data === void 0) return event;
  switch (event.type) {
    case "user/message":
      if (Object.hasOwn(data, "id") || Object.hasOwn(data, "role") || Object.hasOwn(data, "message") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "source")) return event;
      return {
        ...event,
        data: {
          ...data,
          id: legacyMessageId(id, event.seq),
          role: "user"
        }
      };
    case "assistant/message": {
      if (Object.hasOwn(data, "message") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "provenance")) return event;
      const { content, provenance, ...eventData } = data;
      return {
        ...event,
        data: {
          ...eventData,
          message: {
            id: legacyMessageId(id, event.seq),
            role: "assistant",
            content,
            source: {
              ...asRecord(provenance),
              kind: "model"
            }
          }
        }
      };
    }
    case "tool/result": {
      if (Object.hasOwn(data, "message") || !Object.hasOwn(data, "callId") || !Object.hasOwn(data, "content") || !Object.hasOwn(data, "isError")) return event;
      const { callId, content, isError, ...eventData } = data;
      const inheritedId = replacementStart(event);
      return {
        ...event,
        data: {
          ...eventData,
          message: {
            id: inheritedId === void 0 ? legacyMessageId(id, event.seq) : messageIds.get(inheritedId),
            role: "user",
            content: [{
              type: "tool-result",
              toolCallId: callId,
              content,
              isError
            }],
            source: {
              kind: "tool",
              callId
            }
          }
        }
      };
    }
    default:
      return event;
  }
}
function eventMessageId(event) {
  const data = asRecord(event.data);
  const message = event.type === "user/message" ? data : asRecord(data?.["message"]);
  return typeof message?.["id"] === "string" ? message["id"] : void 0;
}
function snapshotStoredEvents(events, id) {
  assertSupportedEvents(events, id);
  const messageIds = /* @__PURE__ */ new Map();
  return events.map((event) => {
    const snapshot = snapshotSessionEvent(migrateLegacyMessageEvent(migrateLegacySteeringEvent(migrateLegacyTurnEndEvent(migrateLegacyTurnStartEvent(event, id), id), id), id, messageIds));
    const messageId = eventMessageId(snapshot);
    if (messageId !== void 0) messageIds.set(snapshot.seq, messageId);
    return snapshot;
  });
}
function adoptStoredEvents(events, id) {
  assertSupportedEvents(events, id);
  const messageIds = /* @__PURE__ */ new Map();
  for (const [index, event] of events.entries()) {
    const adopted = adoptSessionEvent(migrateLegacyMessageEvent(migrateLegacySteeringEvent(migrateLegacyTurnEndEvent(migrateLegacyTurnStartEvent(event, id), id), id), id, messageIds));
    events[index] = adopted;
    const messageId = eventMessageId(adopted);
    if (messageId !== void 0) messageIds.set(adopted.seq, messageId);
  }
  return events;
}
var PersistenceCoordinator = class {
  ctx;
  backend;
  /** Backend bookkeeping keyed by session id (NOT the live Session object). */
  states = /* @__PURE__ */ new Map();
  /** Lifecycle and write-behind state keyed by the exact live Session. */
  live = /* @__PURE__ */ new Map();
  /** Exact disposed lifecycles whose buffered tail is still draining. */
  retirements = /* @__PURE__ */ new Map();
  /** Shared cold reads, unpublished reservations, and completed LRU entries. */
  preparations;
  /**
  * Per-session serialization: every operation chains onto the prior one for the
  * same id, so writes for one session never interleave. Keyed by session id.
  */
  chains = /* @__PURE__ */ new Map();
  /** Resolved fixed write-batching window shared by per-session controllers. */
  writeBatchMaxDelayMs;
  constructor(ctx, backend, options = {
    preparedSessionCacheSize: 5,
    writeBatchMaxDelayMs: 200
  }) {
    this.ctx = ctx;
    this.backend = backend;
    if (!Number.isSafeInteger(options.preparedSessionCacheSize) || options.preparedSessionCacheSize < 1) throw new TypeError("preparedSessionCacheSize must be a positive safe integer");
    if (!Number.isSafeInteger(options.writeBatchMaxDelayMs) || options.writeBatchMaxDelayMs < 1 || options.writeBatchMaxDelayMs > MAX_WRITE_BATCH_DELAY_MS) throw new TypeError(`writeBatchMaxDelayMs must be an integer between 1 and ${MAX_WRITE_BATCH_DELAY_MS}`);
    this.writeBatchMaxDelayMs = options.writeBatchMaxDelayMs;
    this.preparations = new SessionPreparations(options.preparedSessionCacheSize);
    this.installWritePath();
  }
  /**
  * Register detached session metadata for lazy creation on the first append.
  * @param meta - header to snapshot; duplicate tracked or persisted ids reject.
  */
  create(meta) {
    const snapshot = snapshotJsonValue(meta);
    if (snapshot === void 0) return Promise.reject(/* @__PURE__ */ new TypeError("session metadata must be losslessly JSON-serializable"));
    if (!Number.isSafeInteger(snapshot.createdAt) || snapshot.createdAt < 0) return Promise.reject(/* @__PURE__ */ new TypeError("session metadata createdAt must be a non-negative safe integer"));
    return this.serialize(snapshot.id, () => this.createCore(snapshot));
  }
  async createCore(meta) {
    if (this.states.has(meta.id) || this.preparations.has(meta.id)) throw new Error(`session "${meta.id}" already exists in this backend`);
    if (await this.backend.loadStored(meta.id) !== void 0) throw new Error(`session "${meta.id}" already has a persisted log on disk; load/resume it instead of creating`);
    this.states.set(meta.id, {
      meta,
      cursor: 0,
      materialized: false
    });
  }
  /**
  * Durably persist a batch of events. Honors the append-only and contiguous-seq
  * contracts; rejects non-JSON-serializable `event.data`.
  * @param id - the session the batch belongs to.
  * @param events - the contiguous batch to persist, in seq order; materialized
  *   as a detached lossless-JSON snapshot at call time.
  */
  async append(id, events) {
    const batch = snapshotJsonValue(events);
    if (batch === void 0) throw new TypeError("session event batch is not losslessly JSON-serializable because it contains non-JSON-serializable data");
    return this.serialize(id, () => this.appendCore(id, batch));
  }
  async appendCore(id, events) {
    assertSupportedEvents(events, id);
    if (events.length === 0) return;
    this.preparations.assertWritable(id);
    let state = this.states.get(id);
    if (state === void 0) state = await this.adopt(id);
    for (const [i, event] of events.entries()) if (event.seq !== state.cursor + i) throw new Error(`append seq mismatch for "${id}": expected ${state.cursor + i} at index ${i}, got ${event.seq}`);
    await this.backend.appendBatch(state.meta, events, state.materialized);
    state.materialized = true;
    state.cursor += events.length;
    this.preparations.invalidate(id);
  }
  /**
  * Prepare and reserve the exact unpublished Session used by resume.
  * Revision retries converge once the durable log remains unchanged for one
  * read/check round trip; continuous external writers may delay completion.
  * @param id - persisted session to prepare.
  * @param signal - optional cancellation for reading and repair.
  * @returns an owned preparation released after publication or rollback.
  */
  async prepare(id, signal) {
    for (; ; ) {
      await this.waitForRetirement(id, signal);
      if (this.ctx.sessions.get(id) !== void 0) throw new Error(`cannot prepare session "${id}" while it is live`);
      const reservation = await this.preparations.reserve(id, () => this.serialize(id, () => this.prepareCore(id)), (source) => this.serialize(id, () => this.commitPrepared(source), signal), signal);
      if (reservation === void 0) continue;
      if (this.ctx.sessions.get(id) !== void 0) {
        this.preparations.release(reservation, false);
        throw new Error(`cannot prepare session "${id}" while it is live`);
      }
      return SessionPreparation.create(reservation.source.session, { release: () => {
        this.preparations.release(reservation, reservation.state.owner === void 0 && reservation.source.session.events.length === reservation.source.sessionLength);
      } });
    }
  }
  /**
  * Commit recovery and return its immutable logical view without publication.
  * Revision retries converge once the durable log remains unchanged for one
  * read/check round trip; continuous external writers may delay completion.
  * @param id - persisted session to load.
  * @returns prepared header and balanced events.
  */
  async load(id) {
    for (; ; ) {
      await this.waitForRetirement(id);
      const live = this.ctx.sessions.get(id);
      if (live !== void 0) return this.loadLiveSnapshot(live);
      const reservation = await this.preparations.reserve(id, () => this.serialize(id, () => this.prepareCore(id)), (source) => this.serialize(id, () => this.commitPrepared(source)));
      if (reservation === void 0) continue;
      const attached = this.ctx.sessions.get(id);
      if (attached !== void 0) {
        this.preparations.discard(reservation);
        return this.loadLiveSnapshot(attached);
      }
      this.preparations.discard(reservation);
      return reservation.source.inspection;
    }
  }
  /**
  * Inspect a logical session without publishing it or committing recovery.
  * A stale ready source is reloaded. A source already committing or reserved
  * for resume remains exclusive, and inspection may borrow its immutable view.
  * Revision retries converge once the log is stable for one read/check round
  * trip; continuous external writers may delay completion.
  * @param id - persisted session to inspect.
  * @param signal - optional cancellation for preparation work.
  * @returns immutable prepared metadata and events; a live view may have an open turn.
  */
  async inspect(id, signal) {
    for (; ; ) {
      signal?.throwIfAborted();
      if (this.retirements.has(id)) await this.waitForRetirement(id, signal);
      const live = this.ctx.sessions.get(id);
      if (live !== void 0) return this.inspectLive(live);
      try {
        const source = await this.preparations.inspect(id, () => this.serialize(id, () => this.prepareCore(id)), signal);
        const attached = this.ctx.sessions.get(id);
        if (attached !== void 0) return this.inspectLive(attached);
        const current = await this.serialize(id, () => this.isPreparedSourceCurrent(source, signal), signal);
        const published = this.ctx.sessions.get(id);
        if (published !== void 0) return this.inspectLive(published);
        if (current) return source.inspection;
        if (this.preparations.discardReady(id, source) === "retained") return source.inspection;
      } catch (error) {
        signal?.throwIfAborted();
        const attached = this.ctx.sessions.get(id);
        if (attached !== void 0) return this.inspectLive(attached);
        throw error;
      }
    }
  }
  /**
  * Read the stored events from `fromSeq` onward, detached and non-mutating
  * (the read-from-seq primitive behind the service's `readFrom`). Runs on
  * the same per-id chain as writes; a backend with the seek-capable
  * {@link PersistenceBackend.loadStoredFrom} hook reads only the suffix,
  * every other backend reads its stored prefix and skips forward here.
  * @param id - persisted session to read.
  * @param fromSeq - first event seq to include; a non-negative safe integer.
  * @param signal - optional cancellation for queued and backend read work.
  * @returns stored header and the valid stored events with `seq >= fromSeq`.
  */
  readFrom(id, fromSeq, signal) {
    if (!Number.isSafeInteger(fromSeq) || fromSeq < 0) return Promise.reject(/* @__PURE__ */ new TypeError(`readFrom fromSeq must be a non-negative safe integer, got ${String(fromSeq)}`));
    const retired = Promise.resolve(this.retirements.get(id));
    return (signal === void 0 ? retired : observeQueuedAbort(retired, signal, () => false)).then(() => this.serialize(id, () => this.readFromCore(id, fromSeq, signal), signal));
  }
  async readFromCore(id, fromSeq, signal) {
    signal?.throwIfAborted();
    if (this.backend.loadStoredFrom !== void 0) {
      let suffix;
      try {
        suffix = await this.backend.loadStoredFrom(id, fromSeq, signal);
      } catch (error) {
        if (signal?.aborted) signal.throwIfAborted();
        throw error;
      }
      signal?.throwIfAborted();
      if (suffix === void 0) throw new Error(`session "${id}" not found`);
      this.assertStoredId(id, suffix.meta);
      this.assertVersion(suffix.meta);
      if (suffix.events.some(needsLegacyPrefix)) {
        const whole2 = await this.readStoredPrefix(id, signal);
        return {
          meta: whole2.meta,
          events: whole2.events.filter((event) => event.seq >= fromSeq)
        };
      }
      const events = snapshotStoredEvents(suffix.events, id);
      this.assertEventsSupported(suffix.meta, events);
      return {
        meta: structuredClone(suffix.meta),
        events
      };
    }
    const whole = await this.readStoredPrefix(id, signal);
    return {
      meta: whole.meta,
      events: whole.events.slice(fromSeq)
    };
  }
  /** Read one detached physical prefix without logical recovery or caching. */
  async readStoredPrefix(id, signal) {
    signal?.throwIfAborted();
    const stored = await this.backend.loadStored(id, signal);
    signal?.throwIfAborted();
    if (stored === void 0) throw new Error(`session "${id}" not found`);
    this.assertStoredId(id, stored.meta);
    this.assertVersion(stored.meta);
    const events = snapshotStoredEvents(stored.events, id);
    this.assertEventsSupported(stored.meta, events);
    return {
      meta: structuredClone(stored.meta),
      events
    };
  }
  /** Read, repair in memory, validate, and freeze one cold source once. */
  async prepareCore(id) {
    const stored = await this.backend.loadStored(id);
    if (stored === void 0) throw new Error(`session "${id}" not found`);
    try {
      const { meta, events, revision, tornMarker } = stored;
      this.assertStoredId(id, meta);
      this.assertVersion(meta);
      const storedEvents = adoptStoredEvents(events, id);
      this.assertEventsSupported(meta, storedEvents);
      const closers = interruptedTurnClosers(storedEvents).map(adoptSessionEvent);
      const balanced = [...storedEvents, ...closers];
      const session = this.ctx.sessions.prepare(id, {
        seed: balanced,
        meta,
        seedSource: "persistence"
      });
      return {
        inspection: Object.freeze({
          meta: session.header,
          events: Object.freeze(balanced)
        }),
        session,
        revision,
        sessionLength: session.events.length,
        tornMarker,
        closers
      };
    } catch (error) {
      if (error instanceof SessionFormatUnsupportedError) throw error;
      throw new SessionPersistenceCorruptionError(`stored session "${id}" failed validation: ${String(error)}`, { cause: error });
    }
  }
  /** Commit one prepared repair and establish its ownerless durable cursor. */
  async commitPrepared(source) {
    const id = source.inspection.meta.id;
    const cursor = source.inspection.events.length;
    const existing = this.states.get(id);
    if (existing?.owner !== void 0) throw new Error(`session "${id}" already has a live persistence owner`);
    if (!await this.isPreparedSourceCurrent(source)) return void 0;
    if (source.tornMarker !== void 0 || source.closers.length > 0) {
      await this.backend.commitRepair(source.inspection.meta, source.tornMarker, source.closers);
      return;
    }
    const state = existing ?? {
      meta: source.inspection.meta,
      cursor,
      materialized: true
    };
    state.meta = source.inspection.meta;
    state.cursor = cursor;
    state.materialized = true;
    this.states.set(id, state);
    return {
      source,
      state
    };
  }
  /** Whether one cached source still names the current durable log revision. */
  async isPreparedSourceCurrent(source, signal) {
    return await this.backend.readStoredRevision(source.inspection.meta.id, signal) === source.revision;
  }
  /** Return one durable immutable view of an already-live Session. */
  async loadLiveSnapshot(session) {
    const events = session.events;
    await this.flush(session);
    const state = this.states.get(session.id);
    if (state === void 0) throw new Error(`session "${session.id}" lost persistence state during load`);
    if (events.length === 0) throw new Error(`session "${session.id}" not found`);
    if (interruptedTurnClosers(events).length > 0) throw new Error(`cannot load session "${session.id}" while its live turn is open; use the live Session or wait for the turn to close`);
    return Object.freeze({
      meta: state.meta,
      events
    });
  }
  /** Borrow one immutable view from an already-live Session. */
  inspectLive(session) {
    return Object.freeze({
      meta: session.header,
      events: session.events
    });
  }
  /** Await one retiring lifecycle with caller cancellation. */
  waitForRetirement(id, signal) {
    const retired = Promise.resolve(this.retirements.get(id));
    return signal === void 0 ? retired : observeQueuedAbort(retired, signal, () => false);
  }
  /**
  * Run `op` after any in-flight operation for the same session id, so writes for
  * one session never interleave. Errors do not poison the chain. NOTE: serialized
  * public methods must NOT call each other (deadlock); they call the unserialized
  * `*Core` helpers instead.
  */
  serialize(id, op, signal) {
    const prior = this.chains.get(id) ?? Promise.resolve();
    let started = false;
    const run = () => {
      signal?.throwIfAborted();
      started = true;
      return op();
    };
    const next = prior.then(run, run);
    const tail = next.then(() => void 0, () => void 0);
    this.chains.set(id, tail);
    tail.then(() => {
      if (this.chains.get(id) === tail) this.chains.delete(id);
    });
    return signal === void 0 ? next : observeQueuedAbort(next, signal, () => started);
  }
  /** Build a state for a session discovered in storage but not yet in memory. */
  async adopt(id) {
    for (; ; ) {
      const source = this.preparations.takeReady(id) ?? await this.prepareCore(id);
      const committed = await this.commitPrepared(source);
      if (committed !== void 0) return committed.state;
    }
  }
  assertVersion(meta) {
    if (meta.version === SESSION_FORMAT_VERSION) return;
    throw this.unsupported(meta, sessionFormatVersionRefusal(meta.id, meta.version));
  }
  /**
  * Refuse a log containing an event type this build does not know, unless the
  * writer marked the event ignorable: an unrecognized required event may
  * change how the rest of the log must be interpreted, so silently skipping
  * it would reconstruct a wrong session (the envelope contract on
  * `SessionEvent.ignorable`). Runs on NORMALIZED events — after
  * `snapshotStoredEvents`/`adoptStoredEvents` has upgraded the legacy shapes
  * this build still reads and rejected the ones it does not, so those keep
  * their specific diagnostics.
  */
  assertEventsSupported(meta, events) {
    for (const event of events) {
      if (KNOWN_SESSION_EVENT_TYPES.has(event.type) || event.ignorable === true) continue;
      throw this.unsupported(meta, `session "${meta.id}" contains event type "${event.type}" (seq ${event.seq}) unknown to this harness and not marked ignorable; refusing to interpret the log \u2014 it was likely written by a newer harness`);
    }
  }
  /** Build a format refusal that points at the raw artifact when the backend has one. */
  unsupported(meta, reason) {
    const location = this.backend.locate?.(meta);
    return new SessionFormatUnsupportedError(location === void 0 ? reason : `${reason} (raw log: ${location.path})`, location);
  }
  /** Reject backend metadata that is not bound to the requested session id. */
  assertStoredId(id, meta) {
    if (meta.id !== id) throw new Error(`stored session identity mismatch: requested "${id}", header contains "${meta.id}"`);
  }
  installWritePath() {
    const ctx = this.ctx;
    ctx.effect(() => async () => {
      let disposeError;
      try {
        const errors = await settledErrors([...this.live.keys()].map((session) => this.flush(session)));
        while (this.chains.size > 0) await Promise.allSettled([...this.chains.values()]);
        if (errors.length > 0) throw new AggregateError(errors, `${this.backend.name} dispose failed`);
      } catch (error) {
        disposeError = error;
        throw error;
      } finally {
        try {
          await this.backend.close?.();
        } catch (closeError) {
          if (disposeError === void 0) throw closeError;
        }
      }
    }, `${this.backend.name} write path`);
    ctx.on("session/created", (session) => {
      this.initFor(session);
    });
    ctx.on("session/event", (session, event) => {
      this.initFor(session).writes.enqueue(event);
    });
    ctx.on("session/flush", (session) => this.flush(session));
    ctx.on("session/disposed", (session) => {
      this.retire(session);
    });
    for (const session of ctx.sessions.list()) this.initFor(session);
  }
  /** Start and observe one disposed session's final drain. */
  retire(session) {
    if (!this.live.has(session)) return;
    const retirement = this.retireCore(session);
    this.retirements.set(session.id, retirement);
    const forget = () => {
      if (this.retirements.get(session.id) === retirement) this.retirements.delete(session.id);
    };
    retirement.then(forget, forget);
    retirement.catch((error) => {
      this.ctx.logger.warn(`${this.backend.name}: session "${session.id}" retirement failed: ${String(error)}`);
    });
  }
  /** Drain and release state owned by one exact disposed Session lifecycle. */
  async retireCore(session) {
    await this.flush(session);
    const id = session.header.id;
    await this.serialize(id, () => {
      this.live.delete(session);
      if (this.states.get(id)?.owner === session) this.states.delete(id);
    });
  }
  /** Return the one lifecycle controller for a live session, creating it if needed. */
  initFor(session) {
    const existing = this.live.get(session);
    if (existing) return existing;
    const reservation = this.preparations.reservationFor(session);
    if (reservation !== void 0) {
      const restored = this.attachPrepared(session, reservation);
      this.live.set(session, restored);
      return restored;
    }
    const seed = session.events.map((e) => structuredClone(e));
    const live = {
      init: Promise.resolve(),
      writes: this.createWriteBehind(session, () => live.init)
    };
    this.live.set(session, live);
    live.init = this.serialize(session.header.id, () => this.onCreated(session, seed));
    live.init.catch(() => {
    });
    return live;
  }
  /** Bind one exact prepared Session and persist only its unpublished suffix. */
  attachPrepared(session, reservation) {
    const { source, state } = reservation;
    if (source.session !== session || state.owner !== void 0 || state.cursor !== source.inspection.events.length || session.firstLiveSeq !== state.cursor) throw new Error(`session "${session.id}" preparation no longer matches its persistence state`);
    const suffix = session.events.slice(state.cursor).map((event) => structuredClone(event));
    this.preparations.attach(reservation);
    state.owner = session;
    const live = {
      init: Promise.resolve(),
      writes: this.createWriteBehind(session, () => live.init)
    };
    if (suffix.length > 0) {
      live.init = this.serialize(session.id, () => this.appendCore(session.id, suffix));
      live.init.catch(() => {
      });
    }
    return live;
  }
  /**
  * Whether a live session's `seed` reproduces the first `cursor` persisted
  * events. A `cursor` of 0 (nothing persisted yet) trivially matches. Used when
  * a live session claims ownerless state left by a prior `load()`/`create()`.
  */
  async seedMatchesPersisted(id, seed, cursor) {
    if (cursor === 0) return true;
    const stored = await this.backend.loadStored(id);
    if (stored === void 0) return false;
    this.assertStoredId(id, stored.meta);
    return seedCoversPrefix(seed, snapshotStoredEvents(stored.events, id).slice(0, cursor));
  }
  /**
  * On session/created: sync the backend's in-memory state to a live Session.
  *
  * Cases, by whether this backend tracks the id and whether an artifact exists:
  *   1. Already tracked → no-op (or claim ownerless state if the seed matches,
  *      or reclaim a truly-abandoned id, else reject as a collision).
  *   2. Not tracked, an artifact EXISTS at the same cwd and is a seq-aligned
  *      PREFIX of the live events → ADOPT it, persisting any live suffix.
  *   3. Not tracked, an artifact EXISTS at another cwd or is NOT a prefix →
  *      REJECT (collision).
  *   4. Not tracked and NO artifact → a genuinely new session: register meta
  *      (lazy) and persist its seed once.
  */
  async onCreated(session, seed) {
    const id = session.header.id;
    const tracked = this.states.get(id);
    if (tracked !== void 0) {
      if (tracked.owner === session) return;
      if (tracked.owner === void 0) {
        if (tracked.meta.cwd !== session.header.cwd) throw new Error(`session "${id}" is already persisted at a different cwd (persisted: ${String(tracked.meta.cwd)}, live: ${String(session.header.cwd)}) (id collision)`);
        if (!await this.seedMatchesPersisted(id, seed, tracked.cursor)) throw new Error(`session "${id}" is already persisted with ${tracked.cursor} event(s) that do not match this live session (id collision)`);
        tracked.owner = session;
        const suffix = seed.slice(tracked.cursor);
        if (suffix.length > 0) await this.appendCore(id, suffix);
        return;
      }
      const owner = this.live.get(tracked.owner);
      if (!tracked.materialized && !owner?.writes.hasWork) this.states.delete(id);
      else throw new Error(`session "${id}" is already bound to a different live session in this backend (id collision)`);
    }
    const live = await this.backend.loadStored(id);
    if (live !== void 0) {
      await this.adoptLivePrefix(session, seed, live);
      return;
    }
    const meta = { ...session.header };
    await this.createCore(meta);
    const created = this.states.get(id);
    if (created !== void 0) created.owner = session;
    if (seed.length > 0) await this.appendCore(id, seed);
  }
  /**
  * Adopt a stored prefix as a live session's history (HMR/reload): verify the
  * seed covers the stored prefix, truncate any torn tail (NOT the open turn —
  * the live Session is still the authority), bind ownership, and persist the
  * live suffix that was ahead of the stored prefix.
  */
  async adoptLivePrefix(session, seed, stored) {
    const { meta, events, tornMarker } = stored;
    this.assertStoredId(session.header.id, meta);
    if (meta.cwd !== session.header.cwd) throw new Error(`session "${session.header.id}" is already persisted at a different cwd (persisted: ${String(meta.cwd)}, live: ${String(session.header.cwd)}) (id collision)`);
    this.assertVersion(meta);
    const storedEvents = snapshotStoredEvents(events, session.header.id);
    this.assertEventsSupported(meta, storedEvents);
    if (!seedCoversPrefix(seed, storedEvents)) throw new Error(`session "${session.header.id}" already has a persisted log on disk that does not match this live session (id collision)`);
    if (tornMarker !== void 0) await this.backend.commitRepair(meta, tornMarker, []);
    this.states.set(session.header.id, {
      meta: { ...meta },
      cursor: storedEvents.length,
      materialized: true,
      owner: session
    });
    const suffix = seed.slice(storedEvents.length);
    if (suffix.length > 0) await this.appendCore(session.header.id, suffix);
  }
  async flush(session) {
    const live = this.initFor(session);
    live.writes.cancelAutomaticWait();
    try {
      await live.init;
    } catch (error) {
      live.writes.cancelAutomaticWait();
      throw error;
    }
    await live.writes.flush();
  }
  /** Build one package-private write controller around initialization and id serialization. */
  createWriteBehind(session, ready) {
    return new SessionWriteBehind({
      maxDelayMs: this.writeBatchMaxDelayMs,
      write: async (batch) => {
        await ready();
        await this.serialize(session.header.id, () => this.appendLiveBatch(session.header.id, batch));
      },
      reportBackgroundFailure: (error) => {
        this.ctx.logger.warn(`${this.backend.name}: background write for session "${session.id}" failed (buffered events retained): ${String(error)}`);
      }
    });
  }
  /** Append one controller-owned prefix after filtering events initialization already stored. */
  async appendLiveBatch(id, batch) {
    const cursor = this.states.get(id)?.cursor ?? 0;
    const fresh = batch.filter((e) => e.seq >= cursor);
    await this.appendCore(id, fresh);
  }
};
var SessionPersistence = class extends Service {
  constructor(ctx) {
    super(ctx, "sessionPersistence");
  }
  /**
  * Read a session's backend-owned artifact text verbatim — the exact durable
  * bytes the backend wrote (decoded from its physical encoding, e.g. a
  * decompressed JSONL). The returned `content` is the raw text, not a
  * reconstruction from parsed events, so it preserves backend-specific
  * serialization (chunk packing, key order, line breaks). Callers first test
  * {@link supportsRawArtifacts}; `undefined` then means only that the requested
  * session has no materialized artifact.
  * @param _id - the persisted session to read (unused by the default: no
  * per-session artifact).
  * @param signal - optional cancellation for backend read work.
  * @returns the raw artifact plus its parsed header, or `undefined` when the
  * session is absent.
  * @throws when this backend does not expose per-session raw artifacts.
  */
  readRaw(_id, signal) {
    if (signal?.aborted === true) return Promise.reject(signal.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("aborted"));
    return Promise.reject(/* @__PURE__ */ new Error("this session persistence backend does not expose raw artifacts"));
  }
  /**
  * Prepare the exact unpublished Session used by resume. Implementations may
  * reuse object graphs retained by an earlier {@link inspect} after confirming
  * their durable revision is still current; disposal releases an unpublished
  * reservation. Revision retries require the durable log to remain unchanged
  * for one read/check round trip; continuous external writers may delay completion.
  * @param id - persisted session to prepare.
  * @param signal - optional cancellation for preparation work.
  * @returns one owned unpublished Session preparation.
  */
  async prepare(id, signal) {
    signal?.throwIfAborted();
    const loaded = await this.load(id);
    signal?.throwIfAborted();
    const sessions = this.ctx.get("sessions");
    if (sessions === void 0) throw new Error("cannot prepare a session: SessionStore is not configured");
    return SessionPreparation.create(sessions.prepare(id, {
      seed: loaded.events.map((event) => structuredClone(event)),
      meta: structuredClone(loaded.meta),
      seedSource: "persistence"
    }));
  }
};
export {
  DEFAULT_PREPARED_SESSION_CACHE_SIZE,
  DEFAULT_WRITE_BATCH_MAX_DELAY_MS,
  MAX_WRITE_BATCH_DELAY_MS,
  PersistenceCoordinator,
  SessionFormatUnsupportedError,
  SessionPersistence,
  SessionPersistenceCorruptionError,
  SessionPersistenceRevision,
  SessionPersistence as default,
  sessionFormatVersionRefusal
};
