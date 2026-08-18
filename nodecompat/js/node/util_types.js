// node:util/types — the brand checks, which are the only part of util that has
// to know about internal slots.

// A brand check rather than instanceof: a value from another realm is still a
// Map, and only the prototype method can tell.
const branded = (method) => (v) => {
  try { method.call(v, undefined); return true; } catch { return false; }
};

export const isDate = branded(Date.prototype.getTime);
export const isRegExp = (v) => { try { return typeof RegExp.prototype.source === 'string' && Object.getOwnPropertyDescriptor(RegExp.prototype, 'source').get.call(v) !== undefined; } catch { return false; } };
export const isMap = branded(Map.prototype.has);
export const isSet = branded(Set.prototype.has);
export const isPromise = (v) => v instanceof Promise || (!!v && typeof v.then === 'function' && typeof v.catch === 'function');
export const isTypedArray = (v) => ArrayBuffer.isView(v) && !(v instanceof DataView);
export const isUint8Array = (v) => v instanceof Uint8Array;
export const isArrayBuffer = (v) => v instanceof ArrayBuffer;
export const isSharedArrayBuffer = (v) => typeof SharedArrayBuffer !== 'undefined' && v instanceof SharedArrayBuffer;
export const isDataView = (v) => v instanceof DataView;
export const isAnyArrayBuffer = (v) => isArrayBuffer(v) || isSharedArrayBuffer(v);
export const isArrayBufferView = (v) => ArrayBuffer.isView(v);
export const isAsyncFunction = (v) => typeof v === 'function' && v.constructor && v.constructor.name === 'AsyncFunction';
export const isGeneratorFunction = (v) => typeof v === 'function' && v.constructor && v.constructor.name === 'GeneratorFunction';
export const isGeneratorObject = (v) => !!v && typeof v.next === 'function' && typeof v.throw === 'function';
export const isProxy = () => false;   // a Proxy is not distinguishable from here, and saying "maybe" would be worse
export const isNativeError = (v) => v instanceof Error;
export const isBoxedPrimitive = (v) => v instanceof Number || v instanceof String || v instanceof Boolean || v instanceof Symbol;

export default {
  isDate, isRegExp, isMap, isSet, isPromise, isTypedArray, isUint8Array,
  isArrayBuffer, isSharedArrayBuffer, isDataView, isAnyArrayBuffer,
  isArrayBufferView, isAsyncFunction, isGeneratorFunction, isGeneratorObject,
  isProxy, isNativeError, isBoxedPrimitive,
};
