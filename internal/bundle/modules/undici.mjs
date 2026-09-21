// Refused at bundle time: Node's socket-level HTTP stack; this runtime's HTTP is fetch, and a proxy is the host's to configure
const reason = "Node's socket-level HTTP stack; this runtime's HTTP is fetch, and a proxy is the host's to configure";
const specifier = "undici";

function refuse(name) {
  const fail = () => { throw new Error(`${specifier}.${name} is not available in this runtime: ${reason}`); };
  return new Proxy(function () {}, {
    apply: fail,
    construct: fail,
    get: (_, prop) => (prop === 'name' ? name : fail()),
  });
}

export default refuse('default');
