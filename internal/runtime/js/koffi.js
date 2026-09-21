// koffi, as far as the harness uses it.
//
// koffi is native FFI; a binary addon cannot load on this engine, and the
// bundle refuses the real package. But two bundled packages have no other
// way to do their Windows work — the JSONL session backend (publish a file,
// take the session's write lock) and the local filesystem provider (replace a
// file atomically, keeping its ACL) — so on Windows the stub's refusal took
// session persistence and file edits down entirely. This serves the nine
// functions they bind, by name, through Go (nodecompat/win32_windows.go).
//
// Anything else a caller binds resolves to a function that refuses when it is
// CALLED, naming the library and the function: loading a library or declaring
// a binding is not the mistake, reaching native code is.

const win32 = globalThis.__nodeHost.win32;

const bytesOf = (value) => (value == null ? new Uint8Array(0)
  : value instanceof Uint8Array ? value : new Uint8Array(value.buffer ?? value));

const SERVED = {
  'kernel32.dll': {
    MoveFileExW: (existing, replacement, flags) => win32.moveFileExW(existing, replacement, flags >>> 0),
    ReplaceFileW: (replaced, replacement, _backup, flags) => win32.replaceFileW(replaced, replacement, flags >>> 0),
    CreateSemaphoreW: (_attributes, initial, maximum, name) => win32.createSemaphoreW(initial, maximum, name),
    WaitForSingleObject: (handle, milliseconds) => win32.waitForSingleObject(handle, milliseconds >>> 0),
    ReleaseSemaphore: (handle, count) => win32.releaseSemaphore(handle, count),
    CloseHandle: (handle) => win32.closeHandle(handle),
    GetLastError: () => win32.getLastError(),
  },
  'advapi32.dll': {
    // (path, information, descriptor | null, length, needed: [number]) — the
    // out-parameter is a one-element array, koffi's spelling of a pointer.
    GetFileSecurityW: (path, information, descriptor, length, needed) => {
      const answer = win32.getFileSecurityW(path, information >>> 0, descriptor ? length >>> 0 : 0);
      if (Array.isArray(needed)) needed[0] = answer.needed;
      if (descriptor && answer.descriptor) bytesOf(descriptor).set(bytesOf(answer.descriptor));
      return answer.ok;
    },
    SetFileSecurityW: (path, information, descriptor) =>
      win32.setFileSecurityW(path, information >>> 0, bytesOf(descriptor)),
  },
};

// nameOf reads the function name out of every spelling koffi accepts:
// func('__stdcall', 'Name', ret, args), func('Name', ret, args), and the
// one-string prototype func('int __stdcall Name(const char16_t *path, ...)').
function nameOf(spec) {
  if (spec.length === 1 && typeof spec[0] === 'string') {
    const match = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(spec[0]);
    return match ? match[1] : spec[0];
  }
  if (typeof spec[0] === 'string' && spec[0].startsWith('__') && typeof spec[1] === 'string') return spec[1];
  return String(spec[0]);
}

function load(library) {
  const key = String(library).toLowerCase().replace(/^.*[\\/]/, '');
  const table = SERVED[key] ?? {};
  return {
    func(...spec) {
      const name = nameOf(spec);
      const served = table[name];
      if (served && win32.available()) return served;
      return () => {
        throw Object.assign(
          new Error(`koffi: ${key}!${name} is not available in this runtime — native calls are made by the host, and it serves only the ones the harness needs on Windows`),
          { code: 'ERR_NOT_AVAILABLE' },
        );
      };
    },
    unload() {},
  };
}

const koffi = { load };
export default koffi;
export { load };
