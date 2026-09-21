// .harness/packages/core/scope/lib/index.js
import { Context } from "@deepseek-ai/cordis";
var NamedEntries = class {
  duplicateError;
  data = /* @__PURE__ */ new Map();
  constructor(duplicateError) {
    this.duplicateError = duplicateError;
  }
  /**
  * Insert one unique name.
  * @param name - name unique within this table.
  * @param value - borrowed value to retain.
  * @returns an idempotent undo that removes only this insertion.
  */
  insert(name, value) {
    const data = this.data;
    if (data.has(name)) throw this.duplicateError(name);
    data.set(name, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(name);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
  * Read one named value.
  * @param name - name to resolve.
  * @returns the retained value, or `undefined` when absent.
  */
  get(name) {
    return this.data.get(name);
  }
  /**
  * Test one name for membership.
  * @param name - name to test.
  * @returns whether the table contains that name.
  */
  has(name) {
    return this.data.has(name);
  }
  /**
  * Iterate live names in insertion order.
  * @returns the native live key iterator.
  */
  keys() {
    return this.data.keys();
  }
  /**
  * Iterate live entries in insertion order.
  * @returns the native live entry iterator.
  */
  entries() {
    return this.data.entries();
  }
  /**
  * Iterate live values in insertion order.
  * @returns the native live value iterator.
  */
  values() {
    return this.data.values();
  }
  /**
  * Test whether this table has no entries.
  * @returns whether the table is empty.
  */
  isEmpty() {
    return this.data.size === 0;
  }
};
var AnonymousEntries = class {
  data = /* @__PURE__ */ new Map();
  /**
  * Append one independently owned value.
  * @param value - borrowed value to retain.
  * @returns an idempotent undo for this exact append.
  */
  append(value) {
    const data = this.data;
    const key = /* @__PURE__ */ Symbol();
    data.set(key, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(key);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
  * Iterate live values in insertion order.
  * @returns the native live value iterator.
  */
  values() {
    return this.data.values();
  }
  /**
  * Test whether this table has no entries.
  * @returns whether the table is empty.
  */
  isEmpty() {
    return this.data.size === 0;
  }
};
var ScopedLayers = class {
  createLayer;
  onChange;
  /** The eagerly constructed context-global layer. */
  global;
  scoped = /* @__PURE__ */ new Map();
  constructor(createLayer, onChange) {
    this.createLayer = createLayer;
    this.onChange = onChange;
    this.global = createLayer(void 0);
  }
  /**
  * Read an existing exact-scope overlay. Deliberately chain-blind: callers
  * addressing one scope's OWN contributions (its restrictions, its guards)
  * must not silently pick up an ancestor's — use {@link chainLayers} where
  * inheritance is the point.
  * @param scope - exact scope key; `undefined` denotes no overlay.
  * @returns the existing scoped layer, or `undefined` without creating one.
  */
  peek(scope2) {
    if (scope2 === void 0) return void 0;
    return this.scoped.get(scope2);
  }
  /**
  * Existing overlays along the scope's parent chain ({@link scopeChainOf}),
  * farthest ancestor first and the exact scope last, so a caller layering
  * them in order gives the nearest scope the final word.
  * @param scope - viewing scope, or `undefined` for no overlays.
  * @returns the existing layers, nearest last; absent overlays are skipped.
  */
  chainLayers(scope2) {
    const layers = [];
    for (const key of scopeChainOf(scope2).reverse()) {
      const layer = this.scoped.get(key);
      if (layer !== void 0) layers.push(layer);
    }
    return layers;
  }
  /**
  * Materialize global named entries followed by scope-chain shadows,
  * farthest ancestor first, so the nearest scope's entry wins a name.
  * @param scope - viewing scope, or `undefined` for the global view.
  * @param pick - select the named table from a layer.
  * @returns an insertion-ordered effective map.
  */
  merge(scope2, pick) {
    const merged = new Map(pick(this.global).entries());
    for (const layer of this.chainLayers(scope2)) for (const [name, value] of pick(layer).entries()) merged.set(name, value);
    return merged;
  }
  /**
  * Attach one synchronous layer mutation to its registration context.
  * @param ctx - context that determines both scope visibility and effect ownership.
  * @param action - atomic mutation returning its synchronous undo.
  * @param options - Cordis effect label and optional change notification.
  * @returns the exact disposer returned by `ctx.effect()`.
  */
  effect(ctx, action, options) {
    const scope2 = scopeOf(ctx);
    const notify = options.notify ?? true;
    return ctx.effect(function* () {
      let layer;
      let created = false;
      if (scope2 === void 0) layer = this.global;
      else {
        const existing = this.scoped.get(scope2);
        if (existing === void 0) {
          layer = this.createLayer(scope2);
          this.scoped.set(scope2, layer);
          created = true;
        } else layer = existing;
      }
      let undo;
      try {
        undo = action(layer);
      } catch (error) {
        if (scope2 !== void 0 && created && layer.isEmpty()) this.scoped.delete(scope2);
        throw error;
      }
      yield () => {
        undo();
        if (scope2 !== void 0 && layer.isEmpty()) this.scoped.delete(scope2);
        if (notify) this.onChange();
      };
      if (notify) this.onChange();
    }.bind(this), options.label);
  }
};
var kScope = /* @__PURE__ */ Symbol("dsh.scope");
var carrierKeys = /* @__PURE__ */ new WeakMap();
var scopeParents = /* @__PURE__ */ new WeakMap();
function linkScopeParent(key, parent) {
  for (let cursor = parent; cursor !== void 0; cursor = scopeParents.get(cursor)) if (cursor === key) throw new Error("dsh-scope: scope parent link would form a cycle");
  scopeParents.set(key, parent);
}
function bindScopeParent(key, parent) {
  if (scopeParents.has(key)) throw new Error("dsh-scope: scope key is already bound to a parent; re-linking requires the binding returned by the original bind");
  linkScopeParent(key, parent);
  return { rebind(next) {
    linkScopeParent(key, next);
  } };
}
function scopeParentOf(key) {
  return scopeParents.get(key);
}
function scopeChainOf(key) {
  const chain = [];
  for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) chain.push(cursor);
  return chain;
}
async function quiesceFiber(fiber) {
  await Promise.resolve(fiber.dispose());
  while (fiber.inertia !== void 0) await fiber.inertia;
}
function scope() {
}
function createScope(ctx, key, options) {
  if (options?.parent !== void 0) bindScopeParent(key, options.parent);
  const fiber = ctx.plugin(scope);
  const scoped = fiber.ctx.extend({ [kScope]: key });
  let disposing;
  return {
    ctx: scoped,
    rawDispose: fiber.dispose,
    dispose: () => disposing ??= quiesceFiber(fiber)
  };
}
function scopeOf(ctx) {
  return ctx[kScope];
}
function scopeTarget(base, key) {
  const baseFilter = base[Context.filter];
  const carrier = { [Context.filter](ctx) {
    if (baseFilter !== void 0 && !baseFilter.call(base, ctx)) return false;
    const tag = scopeOf(ctx);
    if (tag === void 0) return true;
    for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) if (cursor === tag) return true;
    return false;
  } };
  carrierKeys.set(carrier, key);
  return carrier;
}
function isScopeCarrier(value) {
  return typeof value === "object" && value !== null && carrierKeys.has(value);
}
function carrierKeyOf(value) {
  if (!isScopeCarrier(value)) return void 0;
  return carrierKeys.get(value);
}
export {
  AnonymousEntries,
  NamedEntries,
  ScopedLayers,
  bindScopeParent,
  carrierKeyOf,
  createScope,
  isScopeCarrier,
  scopeChainOf,
  scopeOf,
  scopeParentOf,
  scopeTarget
};
