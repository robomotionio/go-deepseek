// node:assert — the checks a library makes about its own arguments. Everything
// throws an AssertionError with the same shape Node's does, because test
// harnesses and error reporters read `err.actual` and `err.expected`.

import { isDeepStrictEqual } from 'node:util';

export class AssertionError extends Error {
  constructor({ message, actual, expected, operator }) {
    super(message || `${render(actual)} ${operator} ${render(expected)}`);
    this.name = 'AssertionError';
    this.code = 'ERR_ASSERTION';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
  }
}

function render(v) {
  try { return typeof v === 'string' ? `'${v}'` : JSON.stringify(v) ?? String(v); } catch { return String(v); }
}

function fail(actual, expected, message, operator) {
  throw new AssertionError({ message, actual, expected, operator });
}

export function ok(value, message) {
  if (!value) fail(value, true, message, '==');
}

export function equal(actual, expected, message) {
  // eslint-disable-next-line eqeqeq
  if (actual != expected) fail(actual, expected, message, '==');
}

export function strictEqual(actual, expected, message) {
  if (!Object.is(actual, expected)) fail(actual, expected, message, 'strictEqual');
}

export function notStrictEqual(actual, expected, message) {
  if (Object.is(actual, expected)) fail(actual, expected, message, 'notStrictEqual');
}

export function deepStrictEqual(actual, expected, message) {
  if (!isDeepStrictEqual(actual, expected)) fail(actual, expected, message, 'deepStrictEqual');
}

export const deepEqual = deepStrictEqual;
export const notDeepStrictEqual = (a, b, m) => { if (isDeepStrictEqual(a, b)) fail(a, b, m, 'notDeepStrictEqual'); };

export function throws(fn, _expected, message) {
  try { fn(); } catch { return; }
  fail(undefined, 'an exception', message || 'Missing expected exception', 'throws');
}

export async function rejects(promise, _expected, message) {
  try { await (typeof promise === 'function' ? promise() : promise); } catch { return; }
  fail(undefined, 'a rejection', message || 'Missing expected rejection', 'rejects');
}

export function match(value, regexp, message) {
  if (!regexp.test(value)) fail(value, regexp, message, 'match');
}

const assert = Object.assign(ok, {
  AssertionError, ok, equal, strictEqual, notStrictEqual, deepEqual,
  deepStrictEqual, notDeepStrictEqual, throws, rejects, match,
  fail: (message) => fail(undefined, undefined, message || 'Failed', 'fail'),
  strict: null,
});
assert.strict = assert;

export default assert;
