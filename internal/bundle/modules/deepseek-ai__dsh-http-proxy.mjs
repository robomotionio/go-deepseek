// .harness/packages/util/http-proxy/lib/index.js
var LOOPBACK_NO_PROXY = [
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]"
];
var POLICY_ENV_NAMES = {
  httpProxy: ["http_proxy", "HTTP_PROXY"],
  httpsProxy: ["https_proxy", "HTTPS_PROXY"],
  noProxy: ["no_proxy", "NO_PROXY"]
};
var PROXY_ENV_NAMES = [
  ...Object.values(POLICY_ENV_NAMES).flat(),
  "all_proxy",
  "ALL_PROXY"
];
var SUPPORTED_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:"]);
var SOCKS_PROTOCOLS = /* @__PURE__ */ new Set([
  "socks:",
  "socks4:",
  "socks4a:",
  "socks5:",
  "socks5h:"
]);
var DIRECT_POLICY = {
  noProxy: "",
  source: "none"
};
function readEnv(env, lower) {
  for (const name of [lower, lower.toUpperCase()]) {
    const value = env.get(name)?.value.trim();
    if (value !== void 0 && value !== "") return {
      value,
      name
    };
  }
}
var ABSENT = { kind: "absent" };
function acceptProxyUrl(candidate, diagnostics) {
  if (candidate === void 0) return ABSENT;
  const parsed = URL.parse(candidate.value);
  if (parsed === null) {
    diagnostics.push({
      kind: "invalid",
      origin: candidate.name,
      message: `${candidate.name} is not a valid URL; connecting directly`
    });
    return { kind: "rejected" };
  }
  if (SOCKS_PROTOCOLS.has(parsed.protocol)) {
    diagnostics.push({
      kind: "socks",
      origin: candidate.name,
      message: `${candidate.name} names a SOCKS proxy, which is not supported; connecting directly for that scheme \u2014 set an http:// or https:// proxy URL instead`
    });
    return { kind: "rejected" };
  }
  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    diagnostics.push({
      kind: "invalid",
      origin: candidate.name,
      message: `${candidate.name} uses the unsupported ${parsed.protocol}// scheme; connecting directly for that scheme \u2014 set an http:// or https:// proxy URL instead`
    });
    return { kind: "rejected" };
  }
  return {
    kind: "accepted",
    value: candidate.value
  };
}
function isSupportedProxyUrl(value) {
  const parsed = URL.parse(value);
  return parsed !== null && SUPPORTED_PROTOCOLS.has(parsed.protocol);
}
function resolveScheme(own, ...fallbacks) {
  if (own.kind === "accepted") return own.value;
  if (own.kind === "rejected") return void 0;
  return fallbacks.find((value) => value !== void 0);
}
function withLoopback(noProxy) {
  const entries = (noProxy ?? "").split(/[,\s]+/).map((entry) => entry.trim()).filter((entry) => entry !== "");
  if (entries.includes("*")) return "*";
  const present = new Set(entries.map((entry) => entry.toLowerCase()));
  return [...entries, ...LOOPBACK_NO_PROXY.filter((entry) => !present.has(entry))].join(",");
}
function splitHostPort(entry) {
  if (entry.startsWith("[")) {
    const close = entry.indexOf("]");
    if (close !== -1) {
      const rest = entry.slice(close + 1);
      const host = entry.slice(1, close);
      return rest.startsWith(":") ? {
        host,
        port: rest.slice(1)
      } : { host };
    }
  }
  const colon = entry.indexOf(":");
  if (colon !== -1 && entry.indexOf(":", colon + 1) === -1) return {
    host: entry.slice(0, colon),
    port: entry.slice(colon + 1)
  };
  return { host: entry };
}
var OCTET = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
var LOOPBACK_IPV4 = new RegExp(`^127\\.${OCTET}\\.${OCTET}\\.${OCTET}$`);
function isLoopbackHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "::" || host === "0.0.0.0") return true;
  const mappedHigh = /^::ffff:([0-9a-f]{1,4}):[0-9a-f]{1,4}$/.exec(host)?.[1];
  if (mappedHigh !== void 0) return Number.parseInt(mappedHigh, 16) >>> 8 === 127;
  return LOOPBACK_IPV4.test(host.startsWith("::ffff:") ? host.slice(7) : host);
}
function bypassesProxy(noProxy, url) {
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  const port = url.port !== "" ? url.port : url.protocol === "https:" ? "443" : "80";
  for (const raw of noProxy.split(/[,\s]+/)) {
    const entry = raw.trim().toLowerCase();
    if (entry === "") continue;
    if (entry === "*") return true;
    const split = splitHostPort(entry);
    if (split.port !== void 0 && split.port !== port) continue;
    const candidate = split.host.replace(/^\*?\./, "").replace(/\.$/, "");
    if (candidate === "") continue;
    if (host === candidate || host.endsWith(`.${candidate}`)) return true;
  }
  return false;
}
function resolveProxyPolicy(env) {
  const diagnostics = [];
  const all = acceptProxyUrl(readEnv(env, "all_proxy"), diagnostics);
  const allValue = all.kind === "accepted" ? all.value : void 0;
  const envHttp = acceptProxyUrl(readEnv(env, "http_proxy"), diagnostics);
  const envHttps = acceptProxyUrl(readEnv(env, "https_proxy"), diagnostics);
  const httpProxy = resolveScheme(envHttp, allValue);
  const httpsProxy = resolveScheme(envHttps, allValue, httpProxy);
  if (httpProxy === void 0 && httpsProxy === void 0) return {
    policy: DIRECT_POLICY,
    diagnostics
  };
  return {
    policy: {
      ...httpProxy === void 0 ? {} : { httpProxy },
      ...httpsProxy === void 0 ? {} : { httpsProxy },
      noProxy: withLoopback(readEnv(env, "no_proxy")?.value),
      source: "env"
    },
    diagnostics
  };
}
function proxyForUrl(policy, url) {
  const proxy = url.protocol === "https:" ? policy.httpsProxy : url.protocol === "http:" ? policy.httpProxy : void 0;
  if (proxy === void 0) return void 0;
  if (isLoopbackHost(url.hostname)) return void 0;
  return bypassesProxy(policy.noProxy, url) ? void 0 : proxy;
}
var active;
var inheritedProxyEnv;
var installed;
var DIRECT_ROUTE = { proxied: false };
function proxyRouteFor(url) {
  const policy = active;
  const dispatcher = installed;
  if (policy === void 0 || dispatcher === void 0) return DIRECT_ROUTE;
  const proxy = proxyForUrl(policy, url);
  return proxy === void 0 ? DIRECT_ROUTE : {
    proxied: true,
    proxy,
    dispatcher
  };
}
function applyPolicyEnv(policy) {
  const previousInherited = inheritedProxyEnv;
  inheritedProxyEnv = previousInherited ?? snapshotProxyEnv();
  const published = {};
  for (const [field, names] of Object.entries(POLICY_ENV_NAMES)) {
    const value = policy[field];
    for (const name of names) published[name] = value;
  }
  const restore = writeProxyEnv(published);
  return () => {
    restore();
    inheritedProxyEnv = previousInherited;
  };
}
function snapshotProxyEnv() {
  const snapshot = {};
  for (const names of Object.values(POLICY_ENV_NAMES)) for (const name of names) snapshot[name] = process.env[name];
  return snapshot;
}
function writeProxyEnv(values) {
  const previous = snapshotProxyEnv();
  for (const name of Object.keys(previous)) {
    const value = values[name];
    if (value === void 0) Reflect.deleteProperty(process.env, name);
    else process.env[name] = value;
  }
  return () => {
    for (const [name, value] of Object.entries(previous)) if (value === void 0) Reflect.deleteProperty(process.env, name);
    else process.env[name] = value;
  };
}
async function createPolicyDispatcher(policy) {
  const { Agent, Pool, ProxyAgent } = await import("undici");
  return new Agent({ factory(origin, options) {
    const passed = options;
    const proxy = proxyForUrl(policy, new URL(origin.toString()));
    if (proxy !== void 0) return new ProxyAgent({
      ...passed,
      uri: proxy
    });
    return new Pool(origin, passed);
  } });
}
async function installGlobalProxy(policy) {
  const previousPolicy = active;
  if (policy.source === "none") {
    if (previousPolicy === void 0) {
      active = policy;
      return () => {
        active = previousPolicy;
        return Promise.resolve();
      };
    }
    const previousInstalled2 = installed;
    const restoreEnv2 = inheritedProxyEnv === void 0 ? void 0 : writeProxyEnv(inheritedProxyEnv);
    const undici = await import("undici");
    const previous = undici.getGlobalDispatcher();
    const direct = new undici.Agent();
    undici.setGlobalDispatcher(direct);
    active = policy;
    installed = void 0;
    return async () => {
      undici.setGlobalDispatcher(previous);
      active = previousPolicy;
      installed = previousInstalled2;
      restoreEnv2?.();
      await direct.close();
    };
  }
  const restoreEnv = applyPolicyEnv(policy);
  const { getGlobalDispatcher, setGlobalDispatcher } = await import("undici");
  const previousDispatcher = getGlobalDispatcher();
  const previousInstalled = installed;
  const agent = await createPolicyDispatcher(policy);
  setGlobalDispatcher(agent);
  active = policy;
  installed = agent;
  return async () => {
    setGlobalDispatcher(previousDispatcher);
    active = previousPolicy;
    installed = previousInstalled;
    restoreEnv();
    await agent.close();
  };
}
function proxyEnvironmentForChild() {
  const policy = active;
  const inherited = inheritedProxyEnv;
  if (policy === void 0 || policy.source === "none" || inherited === void 0) return {};
  const overlay = { NODE_USE_ENV_PROXY: "1" };
  for (const [field, names] of Object.entries(POLICY_ENV_NAMES)) {
    const resolved = policy[field];
    const named = field !== "noProxy" && names.some((name) => inherited[name] !== void 0);
    for (const name of names) overlay[name] = named ? inherited[name] : resolved;
  }
  if ([...POLICY_ENV_NAMES.httpProxy, ...POLICY_ENV_NAMES.httpsProxy].some((name) => overlay[name] !== void 0 && !isSupportedProxyUrl(overlay[name]))) delete overlay.NODE_USE_ENV_PROXY;
  return overlay;
}
async function installProxyFromEnvironment(env, report) {
  const { policy, diagnostics } = resolveProxyPolicy(env);
  for (const diagnostic of diagnostics) report(diagnostic.message);
  return await installGlobalProxy(policy);
}
function clearedProxyEnv() {
  return Object.fromEntries(PROXY_ENV_NAMES.map((name) => [name, void 0]));
}
export {
  clearedProxyEnv,
  installProxyFromEnvironment,
  proxyEnvironmentForChild,
  proxyRouteFor
};
