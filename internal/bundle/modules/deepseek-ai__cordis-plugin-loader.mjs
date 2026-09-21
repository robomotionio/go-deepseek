// .harness/vendor/loader/lib/index.js
import { createRequire } from "node:module";
import { Context, Inject, Service, composeError } from "@deepseek-ai/cordis";
import { deepEqual, defineProperty, isNonNullable, isNullable, valueMap } from "@deepseek-ai/cosmokit";
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
    if (major < 22) return;
    const raw = requireInternal("internal/modules/esm/loader")?.getOrInitializeCascadedLoader();
    if (!raw) return;
    const version = typeof raw.getOrCreateModuleJob === "function" ? "v2" : typeof raw.getModuleJobForImport === "function" ? "v1" : void 0;
    if (!version) return;
    return _cachedLoader = Object.assign(raw, { version });
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
    const entry = this.tree.store[id] ??= new Entry(this.ctx.loader);
    entry.parent = this;
    await entry.update(options, true, true);
    return entry.id;
  }
  unlink(options) {
    const config = this.data;
    const index = config.indexOf(options);
    if (index >= 0) config.splice(index, 1);
  }
  remove(id, isDispose = false) {
    const entry = this.tree.store[id];
    if (!entry) return;
    entry.fiber?.dispose();
    if (!isDispose) this.unlink(entry.options);
    delete this.tree.store[id];
    this.context.emit("loader/partial-dispose", entry, entry.options, false);
  }
  async update(config) {
    const oldConfig = this.data;
    this.data = config;
    const oldMap = Object.fromEntries(oldConfig.map((options) => [options.id, options]));
    const newMap = Object.fromEntries(config.map((options) => [options.id ?? /* @__PURE__ */ Symbol("anonymous"), options]));
    const ids = Reflect.ownKeys({
      ...oldMap,
      ...newMap
    });
    await Promise.all(ids.map(async (id) => {
      if (newMap[id]) await this.create(newMap[id]).catch((error) => {
        this.ctx.logger.error(error);
      });
      else this.remove(id);
    }));
  }
  stop() {
    for (const options of this.data) this.remove(options.id, true);
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
    ctx.on("internal/update", (config2) => {
      this.update(config2);
    });
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
  /** Wait until this tree has no pending import or lifecycle tasks. */
  async await() {
    while (true) {
      const tasks = this.getTasks();
      if (!tasks.length) return;
      await Promise.allSettled(tasks);
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
    group.data.splice(position, 0, options);
    group.tree.write();
    return group.create(options);
  }
  /** Stop and remove an entry from its parent group. */
  remove(id) {
    const entry = this.resolve(id);
    entry.parent.remove(id);
    entry.parent.tree.write();
  }
  /** Update an entry and optionally move it to another group. */
  async update(id, options, parent, position) {
    const entry = this.resolve(id);
    const source = entry.parent;
    if (parent !== void 0) {
      const target = this.resolveGroup(parent);
      source.unlink(entry.options);
      target.data.splice(position ?? Infinity, 0, entry.options);
      target.tree.write();
      entry.parent = target;
    }
    source.tree.write();
    return entry.update(options, false, true);
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
  else return valueMap(value, (item) => interpolate(ctx, item));
}
function isJsExpr(value) {
  return value instanceof Object && "__jsExpr" in value;
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
    if (this.options.group) return false;
    let entry = this;
    do {
      if (this.disabledOf(entry.options)) return true;
      entry = entry.parent.ctx.fiber.entry;
    } while (entry);
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
  _patchContext(diff) {
    this.context.waterfall("loader/patch-context", this, () => {
      Object.setPrototypeOf(this.ctx, this.parent.ctx);
      if (this.fiber?.uid && (diff.includes("config") || this.options.group)) this.fiber.update(this.options.config, true);
    });
  }
  async refresh() {
    if (this.fiber) return;
    if (this.disabled) return;
    await this.init();
  }
  /** Merge new options, restart as needed, and persist through the parent tree. */
  async update(options, create = false, force = false) {
    const legacy = { ...this.options };
    if (create) this.options = options;
    else for (const [key, value] of Object.entries(options)) if (isNullable(value)) delete this.options[key];
    else this.options[key] = value;
    sortKeys(this.options);
    if (this.disabled) {
      this.fiber?.dispose();
      return;
    }
    if (this.fiber?.uid) {
      const diff = Object.keys({
        ...this.options,
        ...legacy
      }).filter((key) => !deepEqual(this.options[key], legacy[key]));
      if (!diff.length && !force) return;
      this.context.emit("loader/partial-dispose", this, legacy, true);
      this._patchContext(diff);
    } else await this.init();
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
    }
    const notify = () => {
      if (this.loader.getTasks().length) return;
      this.ctx.reflect.notify(["loader"]);
    };
    this.fiber?.await().then(notify, notify);
  }
  async _init() {
    let exports;
    try {
      exports = await this.parent.tree.import(this.options.name, this.getOuterStack);
    } catch (error) {
      this.ctx.logger.error(error);
      return;
    } finally {
      this._initTask = void 0;
    }
    const plugin = this.loader.unwrapExports(exports);
    this._patchContext([]);
    this.loader.showLog(this, "apply");
    this.fiber = this.ctx.registry.plugin(plugin, this.options.config, this.getOuterStack).ctx.fiber;
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
  ctx.on("loader/patch-context", (entry, next) => {
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
    next();
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
    ctx.on("internal/update", function(config2, noSave, next) {
      if (!this.entry || noSave || this.parent.fiber?.entry === this.entry) return next();
      const unparse = this.runtime?.Config?.["simplify"];
      this.entry.options.config = unparse ? unparse(config2) : config2;
      this.entry.parent.tree.write();
      return next();
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
