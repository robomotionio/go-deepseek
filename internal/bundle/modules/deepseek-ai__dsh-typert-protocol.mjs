// .harness/packages/typert/protocol/lib/index.js
import { Service } from "@deepseek-ai/cordis";
var RemoteError = class extends Error {
  code;
  details;
  /** Structural marker: cross-realm/bundle identification never uses instanceof. */
  isDSHRemoteError = true;
  /**
  * @param code - stable failure code declared in {@link RemoteErrorDetailsMap}.
  * @param message - human diagnostic carried across the wire.
  * @param details - structured payload typed by the code.
  * @param options - standard Error options (`cause` survives in-process only).
  */
  constructor(code, message, details, options) {
    super(message, options);
    this.code = code;
    this.details = details;
    this.name = "RemoteError";
  }
};
function remoteErrorOf(value) {
  if (typeof value === "object" && value !== null && value.isDSHRemoteError === true && typeof value.code === "string") return value;
}
var TYPERT_OWNED_VALUE = /* @__PURE__ */ Symbol.for("dsh.typert.owned-value");
function typertOwnedValue(value, release) {
  let active = true;
  return {
    [TYPERT_OWNED_VALUE]: true,
    value,
    [Symbol.dispose]() {
      if (!active) return;
      active = false;
      release();
    }
  };
}
function isTypertOwnedValue(value) {
  return typeof value === "object" && value !== null && TYPERT_OWNED_VALUE in value && value[TYPERT_OWNED_VALUE] === true;
}
var TYPERT_REMOTE_SEGMENT_PATTERN = /^[A-Za-z0-9_$.-]+$/;
function isTypertRemoteSegment(value) {
  return value !== "." && value !== ".." && TYPERT_REMOTE_SEGMENT_PATTERN.test(value);
}
var REMOTE_METHOD_DESCRIPTOR = "@deepseek-ai/dsh-typert-protocol/remote-methods";
function bindTypertRemote(service, serviceKey, options = {}) {
  validateName("service key", serviceKey);
  const namespace = options.namespace ?? serviceKey;
  validateName("namespace", namespace);
  return Object.freeze({
    service,
    serviceKey,
    namespace
  });
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
function Remote(methodExportOrOptions, context) {
  if (typeof methodExportOrOptions === "string") {
    validateName("Remote export name", methodExportOrOptions);
    return remoteDecorator({ kind: "direct" }, void 0, methodExportOrOptions);
  }
  if (typeof methodExportOrOptions === "object") {
    if (remoteOptionMode(methodExportOrOptions) !== "stream" || Reflect.ownKeys(methodExportOrOptions).length !== 1) throw new TypeError('typert-protocol: Remote options must contain exactly mode: "stream"');
    return remoteDecorator({ kind: "direct" }, "stream");
  }
  if (context === void 0) throw new TypeError("typert-protocol: Remote decorator context is missing");
  addMarkerInitializer(context, { kind: "direct" });
}
function remoteOptionMode(options) {
  return Reflect.get(options, "mode");
}
function remoteDecorator(invocation, mode, exportName) {
  return function(_method, context) {
    addMarkerInitializer(context, invocation, mode, exportName);
  };
}
function RemoteScope(key, exportName) {
  validateName("Scope key", key);
  if (exportName !== void 0) validateName("Remote export name", exportName);
  return remoteDecorator({
    kind: "context",
    context: key
  }, void 0, exportName);
}
function remoteMethods(service) {
  const prototype = Object.getPrototypeOf(service);
  if (prototype === null) return [];
  return (readRemoteMethodDescriptor(prototype)?.methods ?? []).map((marker) => ({ ...marker }));
}
function readRemoteMethodDescriptor(prototype) {
  const property = Object.getOwnPropertyDescriptor(prototype, REMOTE_METHOD_DESCRIPTOR);
  if (property === void 0) return void 0;
  const descriptor = property.value;
  if (descriptor === null || typeof descriptor !== "object") throw new TypeError("typert-protocol: Remote method descriptor must be an object");
  const version = Reflect.get(descriptor, "version");
  if (version !== 1) throw new TypeError(`typert-protocol: unsupported Remote method descriptor version ${String(version)}`);
  const methods = Reflect.get(descriptor, "methods");
  if (!Array.isArray(methods)) throw new TypeError("typert-protocol: Remote method descriptor methods must be an array");
  return descriptor;
}
function addMarkerInitializer(context, invocation, mode, exportName) {
  if (context.private || context.static || typeof context.name !== "string") throw new TypeError("typert-protocol: Remote decorators require a public instance method with a string name");
  const method = context.name;
  context.addInitializer(function() {
    const prototype = Object.getPrototypeOf(this);
    if (prototype === null) throw new TypeError(`typert-protocol: cannot mark Remote method "${method}" on an object without a prototype`);
    mark(prototype, method, invocation, mode, exportName);
  });
}
function mark(prototype, method, invocation, mode, exportName) {
  const descriptor = readRemoteMethodDescriptor(prototype);
  const marker = Object.freeze({
    method,
    ...exportName === void 0 || exportName === method ? {} : { exportName },
    ...mode === void 0 ? {} : { mode },
    invocation: Object.freeze(invocation)
  });
  const current = descriptor?.methods.find((candidate) => candidate.method === method);
  if (current !== void 0) {
    if (current.exportName === marker.exportName && current.mode === marker.mode && sameInvocation(current.invocation, invocation)) return;
    throw new Error(`typert-protocol: Remote method "${method}" has conflicting invocation markers`);
  }
  Object.defineProperty(prototype, REMOTE_METHOD_DESCRIPTOR, {
    configurable: true,
    value: Object.freeze({
      version: 1,
      methods: Object.freeze([...descriptor?.methods ?? [], marker])
    })
  });
}
function sameInvocation(left, right) {
  if (left.kind === "direct") return right.kind === "direct";
  if (right.kind === "direct") return false;
  return left.context === right.context;
}
function validateName(subject, value) {
  if (!isTypertRemoteSegment(value)) throw new TypeError(`typert-protocol: ${subject} must contain only RPC endpoint segment characters`);
}
export {
  Remote,
  RemoteError,
  RemoteScope,
  TYPERT_OWNED_VALUE,
  TypertRemoteService,
  bindTypertRemote,
  isTypertOwnedValue,
  isTypertRemoteSegment,
  remoteErrorOf,
  remoteMethods,
  typertOwnedValue
};
