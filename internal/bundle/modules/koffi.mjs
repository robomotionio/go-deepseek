// Refused at bundle time: native FFI; the Windows paths that use it are reached through Go instead
const reason = "native FFI; the Windows paths that use it are reached through Go instead";
const specifier = "koffi";

function refuse(name) {
  const fail = () => { throw new Error(`${specifier}.${name} is not available in this runtime: ${reason}`); };
  return new Proxy(function () {}, {
    apply: fail,
    construct: fail,
    get: (_, prop) => (prop === 'name' ? name : fail()),
  });
}

export default refuse('default');
