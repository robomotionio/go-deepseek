// .harness/packages/util/launch-environment/lib/index.js
var SOURCE_ORDER = [
  "process",
  "project-env",
  "user-env"
];
function lookupKey(name) {
  return process.platform === "win32" ? name.toUpperCase() : name;
}
function createLaunchEnvironmentSnapshot(layers) {
  const bySource = /* @__PURE__ */ new Map();
  for (const layer of layers) bySource.set(layer.source, {
    ...layer.path === void 0 ? {} : { path: layer.path },
    values: new Map(Object.entries(layer.values).map(([name, value]) => [lookupKey(name), value]))
  });
  const getFrom = (name, sources) => {
    const key = lookupKey(name);
    for (const source of SOURCE_ORDER) {
      if (!sources.includes(source)) continue;
      const layer = bySource.get(source);
      const value = layer?.values.get(key);
      if (value === void 0) continue;
      return {
        value,
        source,
        ...layer?.path === void 0 ? {} : { path: layer.path }
      };
    }
  };
  return {
    get: (name) => getFrom(name, SOURCE_ORDER),
    getFrom
  };
}
var DSH_LAUNCH_ENVIRONMENT_KEY = "launchEnvironment";
function launchEnvironmentOf(ctx) {
  return ctx.get("launchEnvironment") ?? createLaunchEnvironmentSnapshot([{
    source: "process",
    values: process.env
  }]);
}
function launchedThroughSsh(environment) {
  return ["SSH_CONNECTION", "SSH_TTY"].some((name) => {
    const value = environment.getFrom(name, ["process"])?.value;
    return value !== void 0 && value !== "";
  });
}
export {
  DSH_LAUNCH_ENVIRONMENT_KEY,
  createLaunchEnvironmentSnapshot,
  launchEnvironmentOf,
  launchedThroughSsh
};
