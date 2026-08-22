var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/context.js
function getProcessEnv() {
  const proc = globalThis.process;
  return proc?.env;
}
function defaultProviderAuthContext() {
  return {
    async env(name) {
      const value = getProcessEnv()?.[name];
      return typeof value === "string" && value.trim().length > 0 ? value : void 0;
    },
    async fileExists(path) {
      try {
        const fs = await importNodeModule("node:fs/promises");
        let resolved = path;
        if (resolved.startsWith("~")) {
          const os = await importNodeModule("node:os");
          resolved = os.homedir() + resolved.slice(1);
        }
        await fs.access(resolved);
        return true;
      } catch {
        return false;
      }
    }
  };
}
var __rewriteRelativeImportExtension, importNodeModule;
var init_context = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/context.js"() {
    __rewriteRelativeImportExtension = function(path, preserveJsx) {
      if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
          return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
        });
      }
      return path;
    };
    importNodeModule = (specifier) => import(__rewriteRelativeImportExtension(specifier));
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/credential-store.js
var InMemoryCredentialStore;
var init_credential_store = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/credential-store.js"() {
    InMemoryCredentialStore = class {
      credentials = /* @__PURE__ */ new Map();
      chains = /* @__PURE__ */ new Map();
      /** Serialize tasks per provider id. */
      enqueue(providerId, task) {
        const previous = this.chains.get(providerId) ?? Promise.resolve();
        const next = (async () => {
          await previous.catch(() => {
          });
          return task();
        })();
        this.chains.set(providerId, next.catch(() => {
        }));
        return next;
      }
      async read(providerId) {
        return this.credentials.get(providerId);
      }
      async list() {
        return [...this.credentials].map(([providerId, credential]) => ({ providerId, type: credential.type }));
      }
      modify(providerId, fn) {
        return this.enqueue(providerId, async () => {
          const current = this.credentials.get(providerId);
          const next = await fn(current);
          if (next !== void 0)
            this.credentials.set(providerId, next);
          return next ?? current;
        });
      }
      delete(providerId) {
        return this.enqueue(providerId, async () => {
          this.credentials.delete(providerId);
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/diagnostics.js
function formatThrownValue(value) {
  if (value instanceof Error)
    return value.message || value.name;
  if (typeof value === "string")
    return value;
  return String(value);
}
function extractDiagnosticError(error) {
  if (!(error instanceof Error))
    return { name: "ThrownValue", message: formatThrownValue(error) };
  const code = error.code;
  return {
    name: error.name || void 0,
    message: error.message || error.name,
    stack: error.stack,
    code: typeof code === "string" || typeof code === "number" ? code : void 0
  };
}
function createAssistantMessageDiagnostic(type, error, details) {
  return { type, timestamp: Date.now(), error: extractDiagnosticError(error), details };
}
function appendAssistantMessageDiagnostic(message, diagnostic) {
  message.diagnostics = [...message.diagnostics ?? [], diagnostic];
}
var init_diagnostics = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/diagnostics.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/resolve.js
function withCauseDetail(message, cause) {
  if (cause === void 0 || cause === null)
    return message;
  const detail = formatThrownValue(cause).trim();
  if (!detail || message.includes(detail))
    return message;
  return `${message}: ${detail}`;
}
async function resolveProviderAuth(provider, credentials, authContext, overrides) {
  const requestAuthContext = overrides?.env ? overlayEnvAuthContext(authContext, overrides.env) : authContext;
  if (overrides?.apiKey !== void 0 && provider.auth.apiKey) {
    return resolveApiKey(requestAuthContext, provider.auth.apiKey, provider.id, {
      type: "api_key",
      key: overrides.apiKey,
      env: overrides.env
    });
  }
  const stored = await readCredential(credentials, provider.id);
  if (stored) {
    if (stored.type === "oauth" && provider.auth.oauth) {
      return resolveStoredOAuth(credentials, provider.id, provider.auth.oauth, stored);
    }
    if (stored.type === "api_key" && provider.auth.apiKey) {
      const credential = overrides?.env ? { ...stored, env: { ...stored.env, ...overrides.env } } : stored;
      return resolveApiKey(requestAuthContext, provider.auth.apiKey, provider.id, credential);
    }
    return void 0;
  }
  return provider.auth.apiKey ? resolveApiKey(requestAuthContext, provider.auth.apiKey, provider.id, void 0) : void 0;
}
function overlayEnvAuthContext(base, env) {
  return {
    env: async (name) => env[name] || await base.env(name),
    fileExists: (path) => base.fileExists(path)
  };
}
async function resolveStoredOAuth(credentials, providerId, oauth, stored) {
  let credential = stored;
  if (Date.now() >= credential.expires) {
    let post;
    try {
      post = await credentials.modify(providerId, async (current) => {
        if (current?.type !== "oauth")
          return void 0;
        if (Date.now() < current.expires)
          return void 0;
        try {
          return await oauth.refresh(current);
        } catch (error) {
          throw new ModelsError("oauth", `OAuth refresh failed for ${providerId}`, { cause: error });
        }
      });
    } catch (error) {
      if (error instanceof ModelsError)
        throw error;
      throw new ModelsError("auth", `Credential store modify failed for ${providerId}`, { cause: error });
    }
    if (post?.type !== "oauth")
      return void 0;
    credential = post;
  }
  try {
    return { auth: await oauth.toAuth(credential), source: "OAuth" };
  } catch (error) {
    throw new ModelsError("oauth", `OAuth auth derivation failed for ${providerId}`, { cause: error });
  }
}
async function resolveApiKey(authContext, apiKey, providerId, credential) {
  try {
    return await apiKey.resolve({ ctx: authContext, credential });
  } catch (error) {
    throw new ModelsError("auth", `API key auth failed for provider ${providerId}`, { cause: error });
  }
}
async function readCredential(credentials, providerId) {
  try {
    return await credentials.read(providerId);
  } catch (error) {
    throw new ModelsError("auth", `Credential store read failed for ${providerId}`, { cause: error });
  }
}
var ModelsError;
var init_resolve = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/resolve.js"() {
    init_diagnostics();
    ModelsError = class extends Error {
      code;
      constructor(code, message, options) {
        super(withCauseDetail(message, options?.cause), options);
        this.name = "ModelsError";
        this.code = code;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/event-stream.js
var EventStream, AssistantMessageEventStream;
var init_event_stream = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/event-stream.js"() {
    EventStream = class {
      queue = [];
      waiting = [];
      done = false;
      finalResultPromise;
      resolveFinalResult;
      isComplete;
      extractResult;
      constructor(isComplete, extractResult) {
        this.isComplete = isComplete;
        this.extractResult = extractResult;
        this.finalResultPromise = new Promise((resolve) => {
          this.resolveFinalResult = resolve;
        });
      }
      push(event) {
        if (this.done)
          return;
        if (this.isComplete(event)) {
          this.done = true;
          this.resolveFinalResult(this.extractResult(event));
        }
        const waiter = this.waiting.shift();
        if (waiter) {
          waiter({ value: event, done: false });
        } else {
          this.queue.push(event);
        }
      }
      end(result) {
        this.done = true;
        if (result !== void 0) {
          this.resolveFinalResult(result);
        }
        while (this.waiting.length > 0) {
          const waiter = this.waiting.shift();
          waiter({ value: void 0, done: true });
        }
      }
      async *[Symbol.asyncIterator]() {
        while (true) {
          if (this.queue.length > 0) {
            yield this.queue.shift();
          } else if (this.done) {
            return;
          } else {
            const result = await new Promise((resolve) => this.waiting.push(resolve));
            if (result.done)
              return;
            yield result.value;
          }
        }
      }
      result() {
        return this.finalResultPromise;
      }
    };
    AssistantMessageEventStream = class extends EventStream {
      constructor() {
        super((event) => event.type === "done" || event.type === "error", (event) => {
          if (event.type === "done") {
            return event.message;
          } else if (event.type === "error") {
            return event.error;
          }
          throw new Error("Unexpected event type for final result");
        });
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/lazy.js
function createSetupErrorMessage(model, error) {
  return {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
    },
    stopReason: "error",
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: Date.now()
  };
}
function hasResult(source) {
  return typeof source.result === "function";
}
async function forwardStream(target, source) {
  for await (const event of source) {
    target.push(event);
  }
  target.end(hasResult(source) ? await source.result() : void 0);
}
function lazyStream(model, setup) {
  const outer = new AssistantMessageEventStream();
  setup().then((inner) => forwardStream(outer, inner)).catch((error) => {
    const message = createSetupErrorMessage(model, error);
    outer.push({ type: "error", reason: "error", error: message });
    outer.end(message);
  });
  return outer;
}
function lazyApi(load) {
  return {
    stream: (model, context, options) => lazyStream(model, async () => (await load()).stream(model, context, options)),
    streamSimple: (model, context, options) => lazyStream(model, async () => (await load()).streamSimple(model, context, options))
  };
}
var init_lazy = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/lazy.js"() {
    init_event_stream();
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models-store.js
var InMemoryModelsStore;
var init_models_store = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models-store.js"() {
    InMemoryModelsStore = class {
      entries = /* @__PURE__ */ new Map();
      async read(providerId) {
        const entry = this.entries.get(providerId);
        return entry ? structuredClone(entry) : void 0;
      }
      async write(providerId, entry) {
        this.entries.set(providerId, structuredClone(entry));
      }
      async delete(providerId) {
        this.entries.delete(providerId);
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.js
function mergeHeaders(base, override) {
  if (!base && !override)
    return void 0;
  const merged = { ...base };
  for (const [name, value] of Object.entries(override ?? {})) {
    const lowerName = name.toLowerCase();
    for (const existingName of Object.keys(merged)) {
      if (existingName.toLowerCase() === lowerName)
        delete merged[existingName];
    }
    merged[name] = value;
  }
  return merged;
}
function createModels(options) {
  return new ModelsImpl(options);
}
function createProvider(input) {
  const baselineModels = input.models;
  let dynamicModels = [];
  let inflightRefresh;
  const fetchModels = input.fetchModels;
  const currentModels = () => {
    const merged = [...baselineModels];
    for (const model of dynamicModels) {
      const index = merged.findIndex((entry) => entry.id === model.id);
      if (index >= 0)
        merged[index] = model;
      else
        merged.push(model);
    }
    return merged;
  };
  const single = typeof input.api.stream === "function" ? input.api : void 0;
  const byApi = single ? void 0 : input.api;
  const apiFor = (model) => single ?? byApi?.[model.api];
  const dispatch = (model, run) => {
    const streams = apiFor(model);
    if (!streams) {
      return lazyStream(model, async () => {
        throw new ModelsError("stream", `Provider ${input.id} has no API implementation for "${model.api}"`);
      });
    }
    return run(streams);
  };
  return {
    id: input.id,
    name: input.name ?? input.id,
    baseUrl: input.baseUrl,
    headers: input.headers,
    auth: input.auth,
    getModels: currentModels,
    refreshModels: fetchModels ? (context) => {
      inflightRefresh ??= (async () => {
        try {
          const stored = await context.store.read();
          if (stored) {
            dynamicModels = stored.models.filter((model) => model.provider === input.id).map((model) => model);
          }
          if (!context.allowNetwork || context.signal?.aborted)
            return;
          const refreshed = await fetchModels(context);
          if (context.signal?.aborted)
            return;
          dynamicModels = refreshed;
          await context.store.write({ models: refreshed, checkedAt: Date.now() });
        } finally {
          inflightRefresh = void 0;
        }
      })();
      return inflightRefresh;
    } : void 0,
    filterModels: input.filterModels,
    stream: (model, context, options) => dispatch(model, (streams) => streams.stream(model, context, options)),
    streamSimple: (model, context, options) => dispatch(model, (streams) => streams.streamSimple(model, context, options))
  };
}
function calculateCost(model, usage) {
  const inputTokens = usage.input + usage.cacheRead + usage.cacheWrite;
  let rates = model.cost;
  let matchedThreshold = -1;
  for (const tier of model.cost.tiers ?? []) {
    if (inputTokens > tier.inputTokensAbove && tier.inputTokensAbove > matchedThreshold) {
      rates = tier;
      matchedThreshold = tier.inputTokensAbove;
    }
  }
  const longWrite = usage.cacheWrite1h ?? 0;
  const shortWrite = usage.cacheWrite - longWrite;
  usage.cost.input = rates.input / 1e6 * usage.input;
  usage.cost.output = rates.output / 1e6 * usage.output;
  usage.cost.cacheRead = rates.cacheRead / 1e6 * usage.cacheRead;
  usage.cost.cacheWrite = (rates.cacheWrite * shortWrite + rates.input * 2 * longWrite) / 1e6;
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
  return usage.cost;
}
function getSupportedThinkingLevels(model) {
  if (!model.reasoning)
    return ["off"];
  return EXTENDED_THINKING_LEVELS.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level];
    if (mapped === null)
      return false;
    if (level === "xhigh" || level === "max")
      return mapped !== void 0;
    return true;
  });
}
function clampThinkingLevel(model, level) {
  const availableLevels = getSupportedThinkingLevels(model);
  if (availableLevels.includes(level))
    return level;
  const requestedIndex = EXTENDED_THINKING_LEVELS.indexOf(level);
  if (requestedIndex === -1)
    return availableLevels[0] ?? "off";
  for (let i = requestedIndex; i < EXTENDED_THINKING_LEVELS.length; i++) {
    const candidate = EXTENDED_THINKING_LEVELS[i];
    if (availableLevels.includes(candidate))
      return candidate;
  }
  for (let i = requestedIndex - 1; i >= 0; i--) {
    const candidate = EXTENDED_THINKING_LEVELS[i];
    if (availableLevels.includes(candidate))
      return candidate;
  }
  return availableLevels[0] ?? "off";
}
var ModelsImpl, EXTENDED_THINKING_LEVELS;
var init_models = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.js"() {
    init_lazy();
    init_context();
    init_credential_store();
    init_resolve();
    init_models_store();
    ModelsImpl = class {
      providers = /* @__PURE__ */ new Map();
      credentials;
      modelsStore;
      authContext;
      constructor(options) {
        this.credentials = options?.credentials ?? new InMemoryCredentialStore();
        this.modelsStore = options?.modelsStore ?? new InMemoryModelsStore();
        this.authContext = options?.authContext ?? defaultProviderAuthContext();
      }
      setProvider(provider) {
        this.providers.set(provider.id, provider);
      }
      deleteProvider(id) {
        this.providers.delete(id);
      }
      clearProviders() {
        this.providers.clear();
      }
      getProviders() {
        return Array.from(this.providers.values());
      }
      getProvider(id) {
        return this.providers.get(id);
      }
      getModels(provider) {
        if (provider !== void 0) {
          const entry = this.providers.get(provider);
          if (!entry)
            return [];
          try {
            return entry.getModels();
          } catch {
            return [];
          }
        }
        const models = [];
        for (const entry of this.providers.values()) {
          try {
            models.push(...entry.getModels());
          } catch {
          }
        }
        return models;
      }
      getModel(provider, id) {
        return this.getModels(provider).find((model) => model.id === id);
      }
      async refresh(options = {}) {
        const allowNetwork = options.allowNetwork ?? true;
        const errors = /* @__PURE__ */ new Map();
        const refreshable = Array.from(this.providers.values()).filter((provider) => provider.refreshModels !== void 0);
        await Promise.all(refreshable.map(async (provider) => {
          if (options.signal?.aborted)
            return;
          const store = {
            read: () => this.modelsStore.read(provider.id),
            write: (entry) => this.modelsStore.write(provider.id, entry),
            delete: () => this.modelsStore.delete(provider.id)
          };
          let stored;
          try {
            stored = await this.readCredential(provider.id);
            const credential = await this.resolveRefreshCredential(provider, stored, allowNetwork, options.signal);
            if (!credential)
              return;
            await provider.refreshModels({
              credential,
              store,
              allowNetwork,
              force: options.force,
              signal: options.signal
            });
          } catch (error) {
            if (!options.signal?.aborted) {
              errors.set(provider.id, error instanceof Error ? error : new ModelsError("model_source", `Model refresh failed for ${provider.id}`, { cause: error }));
            }
            try {
              await provider.refreshModels({
                credential: stored,
                store,
                allowNetwork: false,
                signal: options.signal
              });
            } catch {
            }
          }
        }));
        return { aborted: options.signal?.aborted ?? false, errors };
      }
      async resolveRefreshCredential(provider, stored, allowNetwork, signal) {
        if (stored?.type === "oauth") {
          const oauth = provider.auth.oauth;
          if (!oauth)
            return void 0;
          if (!allowNetwork || Date.now() < stored.expires)
            return stored;
          if (signal?.aborted)
            return void 0;
          const post = await this.credentials.modify(provider.id, async (current) => {
            if (current?.type !== "oauth" || Date.now() < current.expires)
              return void 0;
            return oauth.refresh(current, signal);
          });
          return post?.type === "oauth" ? post : void 0;
        }
        const apiKey = provider.auth.apiKey;
        if (!apiKey)
          return void 0;
        const credential = stored?.type === "api_key" ? stored : void 0;
        const result = await apiKey.resolve({ ctx: this.authContext, credential });
        if (!result)
          return void 0;
        return { type: "api_key", key: result.auth.apiKey, env: result.env };
      }
      async readCredential(providerId) {
        try {
          return await this.credentials.read(providerId);
        } catch (error) {
          throw new ModelsError("auth", `Credential store read failed for ${providerId}`, { cause: error });
        }
      }
      async checkProviderAuth(provider, credential) {
        if (credential?.type === "oauth") {
          return provider.auth.oauth ? { source: "OAuth", type: "oauth" } : void 0;
        }
        const apiKey = provider.auth.apiKey;
        if (!apiKey)
          return void 0;
        if (apiKey.check) {
          try {
            return await apiKey.check({
              ctx: this.authContext,
              credential: credential?.type === "api_key" ? credential : void 0
            });
          } catch (error) {
            throw new ModelsError("auth", `API key auth check failed for provider ${provider.id}`, { cause: error });
          }
        }
        const resolution = await resolveProviderAuth(provider, this.credentials, this.authContext);
        return resolution ? { source: resolution.source, type: "api_key" } : void 0;
      }
      async checkAuth(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider)
          return void 0;
        return this.checkProviderAuth(provider, await this.readCredential(providerId));
      }
      async getAvailable(providerId) {
        const providers = providerId ? [this.providers.get(providerId)].filter((entry) => entry !== void 0) : this.getProviders();
        const checks = await Promise.all(providers.map(async (provider) => {
          const credential = await this.readCredential(provider.id);
          return { provider, credential, auth: await this.checkProviderAuth(provider, credential) };
        }));
        return checks.flatMap(({ provider, credential, auth }) => {
          if (!auth)
            return [];
          const models = provider.getModels();
          return provider.filterModels?.(models, credential) ?? models;
        });
      }
      async getAuth(providerOrModel, overrides) {
        const providerId = typeof providerOrModel === "string" ? providerOrModel : providerOrModel.provider;
        const provider = this.providers.get(providerId);
        if (!provider)
          return void 0;
        const result = await resolveProviderAuth(provider, this.credentials, this.authContext, overrides);
        if (!result || typeof providerOrModel === "string" || !providerOrModel.headers)
          return result;
        return {
          ...result,
          auth: {
            ...result.auth,
            headers: mergeHeaders(result.auth.headers, providerOrModel.headers)
          }
        };
      }
      async login(providerId, type, interaction) {
        const provider = this.providers.get(providerId);
        if (!provider)
          throw new ModelsError("provider", `Unknown provider: ${providerId}`);
        const method = type === "oauth" ? provider.auth.oauth : provider.auth.apiKey;
        if (!method?.login) {
          throw new ModelsError("auth", `${provider.name} does not support ${type} login`);
        }
        const credential = await method.login(interaction);
        try {
          await this.credentials.modify(providerId, async () => credential);
        } catch (error) {
          throw new ModelsError("auth", `Credential store modify failed for ${providerId}`, { cause: error });
        }
        return credential;
      }
      async logout(providerId) {
        try {
          await this.credentials.delete(providerId);
        } catch (error) {
          throw new ModelsError("auth", `Credential store delete failed for ${providerId}`, { cause: error });
        }
      }
      requireProvider(model) {
        const provider = this.providers.get(model.provider);
        if (!provider) {
          throw new ModelsError("provider", `Unknown provider: ${model.provider}`);
        }
        return provider;
      }
      async applyAuth(model, options) {
        this.requireProvider(model);
        const resolution = await this.getAuth(model, {
          apiKey: options?.apiKey,
          env: options?.env
        });
        if (!resolution) {
          throw new ModelsError("auth", `Provider is not configured: ${model.provider}`);
        }
        const auth = resolution.auth;
        const apiKey = options?.apiKey ?? auth.apiKey;
        let headers = mergeHeaders(auth.headers, options?.headers);
        if (options?.transformHeaders)
          headers = await options.transformHeaders(headers ?? {});
        const env = resolution.env || options?.env ? { ...resolution.env ?? {}, ...options?.env ?? {} } : void 0;
        const requestModel = auth.baseUrl ? { ...model, baseUrl: auth.baseUrl } : model;
        const { transformHeaders: _transformHeaders, ...providerOptions } = options ?? {};
        const requestOptions = { ...providerOptions, apiKey, headers, env };
        return { requestModel, requestOptions };
      }
      stream(model, context, options) {
        return lazyStream(model, async () => {
          const provider = this.requireProvider(model);
          const { requestModel, requestOptions } = await this.applyAuth(model, options);
          return provider.stream(requestModel, context, requestOptions);
        });
      }
      async complete(model, context, options) {
        return this.stream(model, context, options).result();
      }
      streamSimple(model, context, options) {
        return lazyStream(model, async () => {
          const provider = this.requireProvider(model);
          const { requestModel, requestOptions } = await this.applyAuth(model, options);
          return provider.streamSimple(requestModel, context, requestOptions);
        });
      }
      async completeSimple(model, context, options) {
        return this.streamSimple(model, context, options).result();
      }
    };
    EXTENDED_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/error-body.js
function normalizeProviderError(error) {
  if (!(error instanceof Error)) {
    return { message: safeJsonStringify(error), messageCarriesBody: false };
  }
  const sdkError = error;
  const status = extractStatus(sdkError);
  const body = extractBody(sdkError);
  const messageCarriesBody = body === void 0 || error.message.includes(body);
  return {
    status,
    body,
    message: error.message,
    messageCarriesBody
  };
}
function extractStatus(error) {
  if (typeof error.statusCode === "number")
    return error.statusCode;
  if (typeof error.status === "number")
    return error.status;
  if (typeof error.$metadata?.httpStatusCode === "number")
    return error.$metadata.httpStatusCode;
  if (typeof error.$response?.statusCode === "number")
    return error.$response.statusCode;
  return void 0;
}
function extractBody(error) {
  const bodyText = pickBodyText(error);
  if (bodyText === void 0)
    return void 0;
  const trimmed = bodyText.trim();
  if (trimmed.length === 0)
    return void 0;
  return truncateErrorText(trimmed, MAX_PROVIDER_ERROR_BODY_CHARS);
}
function pickBodyText(error) {
  if (typeof error.body === "string")
    return error.body;
  if (isNonEmptyObject(error.error))
    return safeJsonStringify(error.error);
  const responseBody = error.$response?.body;
  if (typeof responseBody === "string")
    return responseBody;
  if (isReadableStreamLike(responseBody))
    return void 0;
  if (isNonEmptyObject(responseBody))
    return safeJsonStringify(responseBody);
  return void 0;
}
function isReadableStreamLike(value) {
  return typeof value === "object" && value !== null && "pipe" in value && typeof value.pipe === "function";
}
function isNonEmptyObject(value) {
  return typeof value === "object" && value !== null && Object.keys(value).length > 0;
}
function formatProviderError(norm, prefix) {
  if (norm.messageCarriesBody || norm.status === void 0 || norm.body === void 0) {
    return prefix !== void 0 && norm.status !== void 0 ? `${prefix} (${norm.status}): ${norm.message}` : norm.message;
  }
  return prefix !== void 0 ? `${prefix} (${norm.status}): ${norm.body}` : `${norm.status}: ${norm.body}`;
}
function truncateErrorText(text, maxChars) {
  if (text.length <= maxChars)
    return text;
  return `${text.slice(0, maxChars)}... [truncated ${text.length - maxChars} chars]`;
}
function safeJsonStringify(value) {
  try {
    const serialized = JSON.stringify(value);
    return serialized === void 0 ? String(value) : serialized;
  } catch {
    return String(value);
  }
}
var MAX_PROVIDER_ERROR_BODY_CHARS;
var init_error_body = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/error-body.js"() {
    MAX_PROVIDER_ERROR_BODY_CHARS = 4e3;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/hash.js
function shortHash(str) {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
}
var init_hash = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/hash.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/headers.js
function headersToRecord(headers) {
  const result = {};
  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }
  return result;
}
function providerHeadersToRecord(headers) {
  if (!headers)
    return void 0;
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null)
      result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
var init_headers = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/headers.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/json-parse.js
import { parse as partialParse } from "partial-json";
function isControlCharacter(char) {
  const codePoint = char.codePointAt(0);
  return codePoint !== void 0 && codePoint >= 0 && codePoint <= 31;
}
function escapeControlCharacter(char) {
  switch (char) {
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    default:
      return `\\u${char.codePointAt(0)?.toString(16).padStart(4, "0") ?? "0000"}`;
  }
}
function repairJson(json) {
  let repaired = "";
  let inString = false;
  for (let index = 0; index < json.length; index++) {
    const char = json[index];
    if (!inString) {
      repaired += char;
      if (char === '"') {
        inString = true;
      }
      continue;
    }
    if (char === '"') {
      repaired += char;
      inString = false;
      continue;
    }
    if (char === "\\") {
      const nextChar = json[index + 1];
      if (nextChar === void 0) {
        repaired += "\\\\";
        continue;
      }
      if (nextChar === "u") {
        const unicodeDigits = json.slice(index + 2, index + 6);
        if (/^[0-9a-fA-F]{4}$/.test(unicodeDigits)) {
          repaired += `\\u${unicodeDigits}`;
          index += 5;
          continue;
        }
      }
      if (VALID_JSON_ESCAPES.has(nextChar)) {
        repaired += `\\${nextChar}`;
        index += 1;
        continue;
      }
      repaired += "\\\\";
      continue;
    }
    repaired += isControlCharacter(char) ? escapeControlCharacter(char) : char;
  }
  return repaired;
}
function parseJsonWithRepair(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    const repairedJson = repairJson(json);
    if (repairedJson !== json) {
      return JSON.parse(repairedJson);
    }
    throw error;
  }
}
function parseStreamingJson(partialJson) {
  if (!partialJson || partialJson.trim() === "") {
    return {};
  }
  try {
    return parseJsonWithRepair(partialJson);
  } catch {
    try {
      const result = partialParse(partialJson);
      return result ?? {};
    } catch {
      try {
        const result = partialParse(repairJson(partialJson));
        return result ?? {};
      } catch {
        return {};
      }
    }
  }
}
var VALID_JSON_ESCAPES;
var init_json_parse = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/json-parse.js"() {
    VALID_JSON_ESCAPES = /* @__PURE__ */ new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/provider-env.js
function getBunSandboxEnvValue(name) {
  if (typeof process === "undefined" || !process.versions?.bun || Object.keys(process.env).length > 0) {
    return void 0;
  }
  if (procEnvCache === null) {
    procEnvCache = /* @__PURE__ */ new Map();
    try {
      const { readFileSync } = __require("node:fs");
      const data = readFileSync("/proc/self/environ", "utf-8");
      for (const entry of data.split("\0")) {
        const idx = entry.indexOf("=");
        if (idx > 0) {
          procEnvCache.set(entry.slice(0, idx), entry.slice(idx + 1));
        }
      }
    } catch {
    }
  }
  return procEnvCache.get(name);
}
function getProviderEnvValue(name, env) {
  return env?.[name] || (typeof process !== "undefined" ? process.env[name] : void 0) || getBunSandboxEnvValue(name) || void 0;
}
var procEnvCache;
var init_provider_env = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/provider-env.js"() {
    procEnvCache = null;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/provider-retry.js
function isProviderError(error) {
  if (!(error instanceof Error) || !("status" in error) || !("headers" in error))
    return false;
  return (error.status === void 0 || typeof error.status === "number") && (error.headers === void 0 || error.headers instanceof Headers);
}
function isRetryableProviderError(error) {
  const shouldRetry = error.headers?.get("x-should-retry");
  if (shouldRetry === "true")
    return true;
  if (shouldRetry === "false")
    return false;
  if (error.status === void 0)
    return true;
  return error.status === 408 || error.status === 409 || error.status === 429 || typeof error.status === "number" && error.status >= 500;
}
function validateServerRetryDelayMs(delayMs, maxRetryDelayMs, providerErrorMessage) {
  const maxDelayMs = maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  if (maxDelayMs > 0 && delayMs > maxDelayMs) {
    throw new Error(`Server requested ${Math.ceil(delayMs / 1e3)}s retry delay (max: ${Math.ceil(maxDelayMs / 1e3)}s). ${providerErrorMessage}`);
  }
  return delayMs;
}
function getRetryDelayMs(error, retryIndex, maxRetryDelayMs) {
  const retryAfterMs = error.headers?.get("retry-after-ms");
  if (retryAfterMs) {
    const value = Number.parseFloat(retryAfterMs);
    if (!Number.isNaN(value))
      return validateServerRetryDelayMs(value, maxRetryDelayMs, error.message);
  }
  const retryAfter = error.headers?.get("retry-after");
  if (retryAfter) {
    const seconds = Number.parseFloat(retryAfter);
    const delayMs = Number.isNaN(seconds) ? Date.parse(retryAfter) - Date.now() : seconds * 1e3;
    return validateServerRetryDelayMs(delayMs, maxRetryDelayMs, error.message);
  }
  const exponentialDelay = Math.min(0.5 * 2 ** retryIndex, 8) * 1e3;
  return exponentialDelay * (1 - Math.random() * 0.25);
}
function createAbortError() {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}
function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timeout);
      reject(createAbortError());
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, Math.max(0, ms));
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
async function retryProviderRequest(request, options = {}) {
  const maxRetries = options.maxRetries ?? 0;
  let retriesRemaining = maxRetries;
  for (; ; ) {
    try {
      return await request();
    } catch (error) {
      if (options.signal?.aborted)
        throw createAbortError();
      if (retriesRemaining <= 0 || !isProviderError(error) || !isRetryableProviderError(error))
        throw error;
      const retryIndex = maxRetries - retriesRemaining;
      retriesRemaining--;
      await abortableSleep(getRetryDelayMs(error, retryIndex, options.maxRetryDelayMs), options.signal);
    }
  }
}
var DEFAULT_MAX_RETRY_DELAY_MS;
var init_provider_retry = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/provider-retry.js"() {
    DEFAULT_MAX_RETRY_DELAY_MS = 6e4;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/sanitize-unicode.js
function sanitizeSurrogates(text) {
  return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}
var init_sanitize_unicode = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/sanitize-unicode.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/constrained-sampling.js
function getGrammarToolInput(toolName, arguments_, inputProperty) {
  const input = arguments_[inputProperty];
  if (typeof input !== "string") {
    throw new Error(`Grammar tool call "${toolName}" requires argument "${inputProperty}" to be a string.`);
  }
  return input;
}
function appendGrammarToolInputJsonDelta(buffer, inputProperty, nextInput, close) {
  if (buffer.closed) {
    if (close && nextInput === buffer.input)
      return void 0;
    throw new Error(`grammar tool input for property "${inputProperty}" changed after it was closed`);
  }
  if (!nextInput.startsWith(buffer.input)) {
    throw new Error(`grammar tool input for property "${inputProperty}" changed non-monotonically`);
  }
  const inputDelta = nextInput.slice(buffer.input.length);
  if (!close && inputDelta.length === 0)
    return void 0;
  let delta = "";
  if (!buffer.started) {
    delta += `{${JSON.stringify(inputProperty)}:"`;
    buffer.started = true;
  }
  delta += JSON.stringify(inputDelta).slice(1, -1);
  buffer.input = nextInput;
  if (close) {
    delta += '"}';
    buffer.closed = true;
  }
  return delta;
}
function inferGrammarInputProperty(tool) {
  const schema = tool.parameters;
  if (schema.type !== "object") {
    throw new Error("grammar constrained sampling requires an object parameter schema");
  }
  if (!Array.isArray(schema.required) || schema.required.length !== 1 || typeof schema.required[0] !== "string") {
    throw new Error("grammar constrained sampling requires exactly one required string property");
  }
  const inputProperty = schema.required[0];
  if (!schema.properties?.[inputProperty]) {
    throw new Error(`grammar constrained sampling requires a properties entry for ${inputProperty}`);
  }
  if (schema.properties[inputProperty]?.type !== "string") {
    throw new Error(`grammar constrained sampling property ${inputProperty} must have type string`);
  }
  return inputProperty;
}
function resolveJsonSchemaStrictSampling(tool, supportsStrictMode) {
  const config = tool.constrainedSampling;
  if (!config || config.type !== "json_schema") {
    return void 0;
  }
  if (supportsStrictMode) {
    return true;
  }
  if (config.strict === "require") {
    throw new Error(`Tool "${tool.name}" requires JSON-schema constrained sampling, but strict tools are unsupported.`);
  }
  return void 0;
}
function resolveGrammarConstrainedSampling(tool, supportsOpenAIGrammarTools) {
  const config = tool.constrainedSampling;
  if (!config || config.type !== "grammar") {
    return void 0;
  }
  if (!supportsOpenAIGrammarTools) {
    return void 0;
  }
  const larkDefinition = config.variants.openai_lark;
  const regexDefinition = config.variants.openai_regex;
  const hasLarkDefinition = typeof larkDefinition === "string" && larkDefinition.trim().length > 0;
  const hasRegexDefinition = typeof regexDefinition === "string" && regexDefinition.trim().length > 0;
  if (!hasLarkDefinition && !hasRegexDefinition) {
    throw new Error(`Tool "${tool.name}" cannot use grammar constrained sampling: no supported grammar variant was provided.`);
  }
  try {
    return {
      format: hasLarkDefinition ? "lark" : "regex",
      definition: hasLarkDefinition ? larkDefinition : regexDefinition,
      inputProperty: inferGrammarInputProperty(tool)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Tool "${tool.name}" cannot use grammar constrained sampling: ${message}.`);
  }
}
function createGrammarToolInputProperties(tools, supportsOpenAIGrammarTools) {
  const properties = /* @__PURE__ */ new Map();
  for (const tool of tools ?? []) {
    const grammar = resolveGrammarConstrainedSampling(tool, supportsOpenAIGrammarTools);
    if (grammar) {
      properties.set(tool.name, grammar.inputProperty);
    }
  }
  return properties;
}
var init_constrained_sampling = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/constrained-sampling.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/github-copilot-headers.js
function inferCopilotInitiator(messages) {
  const last = messages[messages.length - 1];
  return last && last.role !== "user" ? "agent" : "user";
}
function hasCopilotVisionInput(messages) {
  return messages.some((msg) => {
    if (msg.role === "user" && Array.isArray(msg.content)) {
      return msg.content.some((c) => c.type === "image");
    }
    if (msg.role === "toolResult" && Array.isArray(msg.content)) {
      return msg.content.some((c) => c.type === "image");
    }
    return false;
  });
}
function buildCopilotDynamicHeaders(params) {
  const headers = {
    "X-Initiator": inferCopilotInitiator(params.messages),
    "Openai-Intent": "conversation-edits"
  };
  if (params.hasImages) {
    headers["Copilot-Vision-Request"] = "true";
  }
  return headers;
}
var init_github_copilot_headers = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/github-copilot-headers.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-prompt-cache.js
function clampOpenAIPromptCacheKey(key) {
  if (key === void 0)
    return void 0;
  const chars = Array.from(key);
  if (chars.length <= OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH)
    return key;
  return chars.slice(0, OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH).join("");
}
var OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH;
var init_openai_prompt_cache = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-prompt-cache.js"() {
    OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH = 64;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/estimate.js
function calculateContextTokens(usage) {
  return usage.totalTokens || usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
}
function safeJsonStringify2(value) {
  try {
    return JSON.stringify(value) ?? "undefined";
  } catch {
    return "[unserializable]";
  }
}
function estimateTextAndImageContentChars(content) {
  if (typeof content === "string")
    return content.length;
  let chars = 0;
  for (const block of content)
    chars += block.type === "text" ? block.text.length : ESTIMATED_IMAGE_CHARS;
  return chars;
}
function estimateTextTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
function estimateTextAndImageContentTokens(content) {
  return Math.ceil(estimateTextAndImageContentChars(content) / CHARS_PER_TOKEN);
}
function estimateMessageTokens(message) {
  let chars = 0;
  if (message.role === "user")
    return estimateTextAndImageContentTokens(message.content);
  if (message.role === "toolResult")
    return estimateTextAndImageContentTokens(message.content);
  for (const block of message.content) {
    if (block.type === "text") {
      chars += block.text.length;
    } else if (block.type === "thinking") {
      chars += block.thinking.length;
    } else {
      chars += block.name.length + safeJsonStringify2(block.arguments).length;
    }
  }
  return Math.ceil(chars / CHARS_PER_TOKEN);
}
function getLastAssistantUsageInfo(messages) {
  let latestPrefixTimestamp = Number.NEGATIVE_INFINITY;
  let usageInfo;
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role === "assistant") {
      const assistant = message;
      const usageAppliesToPrefix = assistant.timestamp >= latestPrefixTimestamp;
      if (usageAppliesToPrefix && assistant.stopReason !== "aborted" && assistant.stopReason !== "error" && calculateContextTokens(assistant.usage) > 0) {
        usageInfo = { usage: assistant.usage, index: i };
      }
    }
    latestPrefixTimestamp = Math.max(latestPrefixTimestamp, message.timestamp);
  }
  return usageInfo;
}
function estimateMessages(messages) {
  const usageInfo = getLastAssistantUsageInfo(messages);
  if (usageInfo) {
    const usageTokens = calculateContextTokens(usageInfo.usage);
    let trailingTokens = 0;
    for (let i = usageInfo.index + 1; i < messages.length; i++) {
      trailingTokens += estimateMessageTokens(messages[i]);
    }
    return { tokens: usageTokens + trailingTokens, usageTokens, trailingTokens, lastUsageIndex: usageInfo.index };
  }
  let tokens = 0;
  for (const message of messages)
    tokens += estimateMessageTokens(message);
  return { tokens, usageTokens: 0, trailingTokens: tokens, lastUsageIndex: null };
}
function estimateToolsTokens(tools) {
  if (!tools || tools.length === 0)
    return 0;
  return estimateTextTokens(safeJsonStringify2(tools));
}
function isMessageArray(value) {
  return Array.isArray(value);
}
function estimateContextTokens(context) {
  if (isMessageArray(context))
    return estimateMessages(context);
  const estimate = estimateMessages(context.messages);
  if (estimate.lastUsageIndex !== null) {
    const addedNames = new Set(context.messages.slice(estimate.lastUsageIndex + 1).filter((message) => message.role === "toolResult").flatMap((message) => message.addedToolNames ?? []));
    const addedToolTokens = estimateToolsTokens(context.tools?.filter((tool) => addedNames.has(tool.name)));
    return {
      tokens: estimate.tokens + addedToolTokens,
      usageTokens: estimate.usageTokens,
      trailingTokens: estimate.trailingTokens + addedToolTokens,
      lastUsageIndex: estimate.lastUsageIndex
    };
  }
  const prefixTokens = (context.systemPrompt ? estimateTextTokens(context.systemPrompt) : 0) + estimateToolsTokens(context.tools);
  return {
    tokens: estimate.tokens + prefixTokens,
    usageTokens: estimate.usageTokens,
    trailingTokens: estimate.trailingTokens + prefixTokens,
    lastUsageIndex: estimate.lastUsageIndex
  };
}
var CHARS_PER_TOKEN, ESTIMATED_IMAGE_CHARS;
var init_estimate = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/estimate.js"() {
    CHARS_PER_TOKEN = 4;
    ESTIMATED_IMAGE_CHARS = 4800;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/simple-options.js
function clampMaxTokensToContext(model, context, maxTokens) {
  if (model.contextWindow <= 0)
    return Math.max(MIN_MAX_TOKENS, maxTokens);
  const available = model.contextWindow - estimateContextTokens(context).tokens - CONTEXT_SAFETY_TOKENS;
  return Math.min(maxTokens, Math.max(MIN_MAX_TOKENS, available));
}
function buildBaseOptions(model, context, options, apiKey) {
  return {
    temperature: options?.temperature,
    maxTokens: clampMaxTokensToContext(model, context, options?.maxTokens ?? model.maxTokens),
    signal: options?.signal,
    apiKey: apiKey || options?.apiKey,
    transport: options?.transport,
    cacheRetention: options?.cacheRetention,
    sessionId: options?.sessionId,
    headers: options?.headers,
    onPayload: options?.onPayload,
    onResponse: options?.onResponse,
    timeoutMs: options?.timeoutMs,
    websocketConnectTimeoutMs: options?.websocketConnectTimeoutMs,
    maxRetries: options?.maxRetries,
    maxRetryDelayMs: options?.maxRetryDelayMs,
    metadata: options?.metadata,
    env: options?.env
  };
}
function clampReasoning(effort) {
  return effort === "xhigh" || effort === "max" ? "high" : effort;
}
function adjustMaxTokensForThinking(baseMaxTokens, modelMaxTokens, reasoningLevel, customBudgets) {
  const defaultBudgets = {
    minimal: 1024,
    low: 2048,
    medium: 8192,
    high: 16384
  };
  const budgets = { ...defaultBudgets, ...customBudgets };
  const minOutputTokens = 1024;
  const level = clampReasoning(reasoningLevel);
  let thinkingBudget = budgets[level];
  const maxTokens = baseMaxTokens === void 0 ? modelMaxTokens : Math.min(baseMaxTokens + thinkingBudget, modelMaxTokens);
  if (maxTokens <= thinkingBudget) {
    thinkingBudget = Math.max(0, maxTokens - minOutputTokens);
  }
  return { maxTokens, thinkingBudget };
}
var CONTEXT_SAFETY_TOKENS, MIN_MAX_TOKENS;
var init_simple_options = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/simple-options.js"() {
    init_estimate();
    CONTEXT_SAFETY_TOKENS = 4096;
    MIN_MAX_TOKENS = 1;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/transform-messages.js
function replaceImagesWithPlaceholder(content, placeholder) {
  const result = [];
  let previousWasPlaceholder = false;
  for (const block of content) {
    if (block.type === "image") {
      if (!previousWasPlaceholder) {
        result.push({ type: "text", text: placeholder });
      }
      previousWasPlaceholder = true;
      continue;
    }
    result.push(block);
    previousWasPlaceholder = block.text === placeholder;
  }
  return result;
}
function downgradeUnsupportedImages(messages, model) {
  if (model.input.includes("image")) {
    return messages;
  }
  return messages.map((msg) => {
    if (msg.role === "user" && Array.isArray(msg.content)) {
      return {
        ...msg,
        content: replaceImagesWithPlaceholder(msg.content, NON_VISION_USER_IMAGE_PLACEHOLDER)
      };
    }
    if (msg.role === "toolResult") {
      return {
        ...msg,
        content: replaceImagesWithPlaceholder(msg.content, NON_VISION_TOOL_IMAGE_PLACEHOLDER)
      };
    }
    return msg;
  });
}
function transformMessages(messages, model, normalizeToolCallId2) {
  const toolCallIdMap = /* @__PURE__ */ new Map();
  const normalizedMessages = messages.map((msg) => msg.content == null ? { ...msg, content: [] } : msg);
  const imageAwareMessages = downgradeUnsupportedImages(normalizedMessages, model);
  const transformed = imageAwareMessages.map((msg) => {
    if (msg.role === "user") {
      return msg;
    }
    if (msg.role === "toolResult") {
      const normalizedId = toolCallIdMap.get(msg.toolCallId);
      if (normalizedId && normalizedId !== msg.toolCallId) {
        return { ...msg, toolCallId: normalizedId };
      }
      return msg;
    }
    if (msg.role === "assistant") {
      const assistantMsg = msg;
      const isSameModel = assistantMsg.provider === model.provider && assistantMsg.api === model.api && assistantMsg.model === model.id;
      const transformedContent = assistantMsg.content.flatMap((block) => {
        if (block.type === "thinking") {
          if (block.redacted) {
            return isSameModel ? block : [];
          }
          if (isSameModel && block.thinkingSignature)
            return block;
          if (!block.thinking || block.thinking.trim() === "")
            return [];
          if (isSameModel)
            return block;
          return {
            type: "text",
            text: block.thinking
          };
        }
        if (block.type === "text") {
          if (isSameModel)
            return block;
          return {
            type: "text",
            text: block.text
          };
        }
        if (block.type === "toolCall") {
          const toolCall = block;
          let normalizedToolCall = toolCall;
          if (!isSameModel && toolCall.thoughtSignature) {
            normalizedToolCall = { ...toolCall };
            delete normalizedToolCall.thoughtSignature;
          }
          if (!isSameModel && normalizeToolCallId2) {
            const normalizedId = normalizeToolCallId2(toolCall.id, model, assistantMsg);
            if (normalizedId !== toolCall.id) {
              toolCallIdMap.set(toolCall.id, normalizedId);
              normalizedToolCall = { ...normalizedToolCall, id: normalizedId };
            }
          }
          return normalizedToolCall;
        }
        return block;
      });
      return {
        ...assistantMsg,
        content: transformedContent
      };
    }
    return msg;
  });
  const result = [];
  let pendingToolCalls = [];
  let existingToolResultIds = /* @__PURE__ */ new Set();
  const insertSyntheticToolResults = () => {
    if (pendingToolCalls.length > 0) {
      for (const tc of pendingToolCalls) {
        if (!existingToolResultIds.has(tc.id)) {
          result.push({
            role: "toolResult",
            toolCallId: tc.id,
            toolName: tc.name,
            content: [{ type: "text", text: "No result provided" }],
            isError: true,
            timestamp: Date.now()
          });
        }
      }
      pendingToolCalls = [];
      existingToolResultIds = /* @__PURE__ */ new Set();
    }
  };
  for (let i = 0; i < transformed.length; i++) {
    const msg = transformed[i];
    if (msg.role === "assistant") {
      insertSyntheticToolResults();
      const assistantMsg = msg;
      if (assistantMsg.stopReason === "error" || assistantMsg.stopReason === "aborted") {
        continue;
      }
      const toolCalls = assistantMsg.content.filter((b) => b.type === "toolCall");
      if (toolCalls.length > 0) {
        pendingToolCalls = toolCalls;
        existingToolResultIds = /* @__PURE__ */ new Set();
      }
      result.push(msg);
    } else if (msg.role === "toolResult") {
      existingToolResultIds.add(msg.toolCallId);
      result.push(msg);
    } else if (msg.role === "user") {
      insertSyntheticToolResults();
      result.push(msg);
    } else {
      result.push(msg);
    }
  }
  insertSyntheticToolResults();
  return result;
}
var NON_VISION_USER_IMAGE_PLACEHOLDER, NON_VISION_TOOL_IMAGE_PLACEHOLDER;
var init_transform_messages = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/transform-messages.js"() {
    NON_VISION_USER_IMAGE_PLACEHOLDER = "(image omitted: model does not support images)";
    NON_VISION_TOOL_IMAGE_PLACEHOLDER = "(tool image omitted: model does not support images)";
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-completions.js
var openai_completions_exports = {};
__export(openai_completions_exports, {
  convertMessages: () => convertMessages,
  stream: () => stream,
  streamSimple: () => streamSimple
});
import OpenAI from "openai";
function hasHeader(headers, name) {
  if (!headers)
    return false;
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === expected && value !== null && value.trim().length > 0)
      return true;
  }
  return false;
}
function getClientApiKey(provider, apiKey, headers) {
  if (apiKey)
    return apiKey;
  if (hasHeader(headers, "authorization") || hasHeader(headers, "cf-aig-authorization"))
    return "unused";
  throw new Error(`No API key for provider: ${provider}`);
}
function hasToolHistory(messages) {
  for (const msg of messages) {
    if (msg.role === "toolResult") {
      return true;
    }
    if (msg.role === "assistant") {
      if (msg.content.some((block) => block.type === "toolCall")) {
        return true;
      }
    }
  }
  return false;
}
function getDeferredToolNames(messages) {
  const names = /* @__PURE__ */ new Set();
  for (const message of messages) {
    if (message.role === "toolResult") {
      for (const name of message.addedToolNames ?? []) {
        names.add(name);
      }
    }
  }
  return names;
}
function getToolsByName(tools, names) {
  if (!tools)
    return [];
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
  return Array.from(names).map((name) => toolsByName.get(name)).filter((tool) => tool !== void 0);
}
function isTextContentBlock(block) {
  return block.type === "text";
}
function isThinkingContentBlock(block) {
  return block.type === "thinking";
}
function isToolCallBlock(block) {
  return block.type === "toolCall";
}
function isImageContentBlock(block) {
  return block.type === "image";
}
function isEncryptedReasoningDetail(detail) {
  if (typeof detail !== "object" || detail === null) {
    return false;
  }
  const candidate = detail;
  return candidate.type === "reasoning.encrypted" && typeof candidate.id === "string" && candidate.id.length > 0 && typeof candidate.data === "string" && candidate.data.length > 0;
}
function resolveCacheRetention(cacheRetention, env) {
  if (cacheRetention) {
    return cacheRetention;
  }
  if (getProviderEnvValue("PI_CACHE_RETENTION", env) === "long") {
    return "long";
  }
  return "short";
}
function createClient(model, context, apiKey, optionsHeaders, sessionId, compat = getCompat(model)) {
  const headers = { ...model.headers };
  if (model.provider === "github-copilot") {
    const hasImages = hasCopilotVisionInput(context.messages);
    const copilotHeaders = buildCopilotDynamicHeaders({
      messages: context.messages,
      hasImages
    });
    Object.assign(headers, copilotHeaders);
  }
  if (sessionId && compat.sendSessionAffinityHeaders) {
    if (compat.sessionAffinityFormat === "openrouter") {
      headers["x-session-id"] = sessionId;
    } else {
      if (compat.sessionAffinityFormat === "openai") {
        headers.session_id = sessionId;
      }
      headers["x-client-request-id"] = sessionId;
      headers["x-session-affinity"] = sessionId;
    }
  }
  if (optionsHeaders) {
    Object.assign(headers, optionsHeaders);
  }
  return new OpenAI({
    apiKey,
    baseURL: model.baseUrl,
    dangerouslyAllowBrowser: true,
    defaultHeaders: headers
  });
}
function buildParams(model, context, options, compat = getCompat(model), cacheRetention = resolveCacheRetention(options?.cacheRetention, options?.env), grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools)) {
  const messages = convertMessages(model, context, compat, { grammarToolInputProperties });
  const cacheControl = getCompatCacheControl(compat, cacheRetention);
  const params = {
    model: model.id,
    messages,
    stream: true,
    prompt_cache_key: model.baseUrl.includes("api.openai.com") && cacheRetention !== "none" || cacheRetention === "long" && compat.supportsLongCacheRetention ? clampOpenAIPromptCacheKey(options?.sessionId) : void 0,
    prompt_cache_retention: cacheRetention === "long" && compat.supportsLongCacheRetention ? "24h" : void 0
  };
  if (compat.supportsUsageInStreaming !== false) {
    params.stream_options = { include_usage: true };
  }
  if (compat.supportsStore) {
    params.store = false;
  }
  if (options?.maxTokens) {
    if (compat.maxTokensField === "max_tokens") {
      params.max_tokens = options.maxTokens;
    } else {
      params.max_completion_tokens = options.maxTokens;
    }
  }
  if (options?.temperature !== void 0) {
    params.temperature = options.temperature;
  }
  const deferredToolNames = compat.deferredToolsMode === "kimi" ? getDeferredToolNames(context.messages) : /* @__PURE__ */ new Set();
  const activeTools = context.tools?.filter((tool) => !deferredToolNames.has(tool.name));
  if (activeTools && activeTools.length > 0) {
    params.tools = convertTools(activeTools, compat);
    if (compat.zaiToolStream) {
      params.tool_stream = true;
    }
  } else if (hasToolHistory(context.messages)) {
    params.tools = [];
  }
  if (cacheControl) {
    applyAnthropicCacheControl(messages, params.tools, cacheControl);
  }
  if (options?.toolChoice) {
    params.tool_choice = options.toolChoice;
  }
  if (compat.thinkingFormat === "zai" && model.reasoning) {
    const zaiParams = params;
    zaiParams.thinking = options?.reasoningEffort ? { type: "enabled", clear_thinking: false } : { type: "disabled" };
    if (options?.reasoningEffort && compat.supportsReasoningEffort) {
      const mappedEffort = model.thinkingLevelMap?.[options.reasoningEffort];
      const effort = mappedEffort === void 0 ? options.reasoningEffort : mappedEffort;
      if (typeof effort === "string") {
        zaiParams.reasoning_effort = effort;
      }
    }
  } else if (compat.thinkingFormat === "qwen" && model.reasoning) {
    params.enable_thinking = !!options?.reasoningEffort;
  } else if (compat.thinkingFormat === "qwen-chat-template" && model.reasoning) {
    params.chat_template_kwargs = {
      enable_thinking: !!options?.reasoningEffort,
      preserve_thinking: true
    };
  } else if (compat.thinkingFormat === "chat-template" && model.reasoning) {
    const chatTemplateKwargs = buildChatTemplateKwargs(model, options, compat);
    if (chatTemplateKwargs) {
      params.chat_template_kwargs = chatTemplateKwargs;
    }
  } else if (compat.thinkingFormat === "deepseek" && model.reasoning) {
    if (options?.reasoningEffort) {
      params.thinking = { type: "enabled" };
    } else if (model.thinkingLevelMap?.off !== null) {
      params.thinking = { type: "disabled" };
    }
    if (options?.reasoningEffort && compat.supportsReasoningEffort) {
      params.reasoning_effort = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
    }
  } else if (compat.thinkingFormat === "openrouter" && model.reasoning) {
    const openRouterParams = params;
    if (options?.reasoningEffort) {
      openRouterParams.reasoning = {
        effort: model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort
      };
    } else if (model.thinkingLevelMap?.off !== null) {
      openRouterParams.reasoning = { effort: model.thinkingLevelMap?.off ?? "none" };
    }
  } else if (compat.thinkingFormat === "ant-ling" && model.reasoning && options?.reasoningEffort) {
    const effort = model.thinkingLevelMap?.[options.reasoningEffort];
    if (typeof effort === "string") {
      params.reasoning = { effort };
    }
  } else if (compat.thinkingFormat === "together" && model.reasoning) {
    const togetherParams = params;
    togetherParams.reasoning = { enabled: !!options?.reasoningEffort };
    if (options?.reasoningEffort && compat.supportsReasoningEffort) {
      togetherParams.reasoning_effort = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
    }
  } else if (compat.thinkingFormat === "string-thinking" && model.reasoning) {
    const stringThinkingParams = params;
    if (options?.reasoningEffort) {
      stringThinkingParams.thinking = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
    } else if (model.thinkingLevelMap?.off !== null) {
      stringThinkingParams.thinking = model.thinkingLevelMap?.off ?? "none";
    }
  } else if (options?.reasoningEffort && model.reasoning && compat.supportsReasoningEffort) {
    params.reasoning_effort = model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
  } else if (!options?.reasoningEffort && model.reasoning && compat.supportsReasoningEffort) {
    const offValue = model.thinkingLevelMap?.off;
    if (typeof offValue === "string") {
      params.reasoning_effort = offValue;
    }
  }
  if (model.compat?.openRouterRouting) {
    params.provider = model.compat.openRouterRouting;
  }
  if (model.compat?.vercelGatewayRouting) {
    const routing = model.compat.vercelGatewayRouting;
    if (routing.only || routing.order) {
      const gatewayOptions = {};
      if (routing.only)
        gatewayOptions.only = routing.only;
      if (routing.order)
        gatewayOptions.order = routing.order;
      params.providerOptions = { gateway: gatewayOptions };
    }
  }
  return params;
}
function buildChatTemplateKwargs(model, options, compat) {
  const kwargs = {};
  for (const [key, value] of Object.entries(compat.chatTemplateKwargs)) {
    const resolved = resolveChatTemplateKwargValue(model, options, value);
    if (resolved !== void 0) {
      kwargs[key] = resolved;
    }
  }
  return Object.keys(kwargs).length > 0 ? kwargs : void 0;
}
function resolveChatTemplateKwargValue(model, options, value) {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  const reasoningEffort = options?.reasoningEffort;
  if (!reasoningEffort && value.omitWhenOff) {
    return void 0;
  }
  if (value.$var === "thinking.enabled") {
    return !!reasoningEffort;
  }
  const mappedValue = reasoningEffort ? model.thinkingLevelMap?.[reasoningEffort] : model.thinkingLevelMap?.off;
  return mappedValue === void 0 ? reasoningEffort : typeof mappedValue === "string" ? mappedValue : void 0;
}
function getCompatCacheControl(compat, cacheRetention) {
  if (compat.cacheControlFormat !== "anthropic" || cacheRetention === "none") {
    return void 0;
  }
  const ttl = cacheRetention === "long" && compat.supportsLongCacheRetention ? "1h" : void 0;
  return { type: "ephemeral", ...ttl ? { ttl } : {} };
}
function applyAnthropicCacheControl(messages, tools, cacheControl) {
  addCacheControlToSystemPrompt(messages, cacheControl);
  addCacheControlToLastTool(tools, cacheControl);
  addCacheControlToLastConversationMessage(messages, cacheControl);
}
function addCacheControlToSystemPrompt(messages, cacheControl) {
  for (const message of messages) {
    if (message.role === "system" || message.role === "developer") {
      addCacheControlToInstructionMessage(message, cacheControl);
      return;
    }
  }
}
function addCacheControlToLastConversationMessage(messages, cacheControl) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "user" || message.role === "assistant" || message.role === "tool") {
      if (addCacheControlToMessage(message, cacheControl)) {
        return;
      }
    }
  }
}
function addCacheControlToLastTool(tools, cacheControl) {
  if (!tools || tools.length === 0) {
    return;
  }
  const lastTool = tools[tools.length - 1];
  lastTool.cache_control = cacheControl;
}
function addCacheControlToInstructionMessage(message, cacheControl) {
  return addCacheControlToTextContent(message, cacheControl);
}
function addCacheControlToMessage(message, cacheControl) {
  if (message.role === "user" || message.role === "assistant" || message.role === "tool") {
    return addCacheControlToTextContent(message, cacheControl);
  }
  return false;
}
function addCacheControlToTextContent(message, cacheControl) {
  const content = message.content;
  if (typeof content === "string") {
    if (content.length === 0) {
      return false;
    }
    message.content = [
      {
        type: "text",
        text: content,
        cache_control: cacheControl
      }
    ];
    return true;
  }
  if (!Array.isArray(content)) {
    return false;
  }
  for (let i = content.length - 1; i >= 0; i--) {
    const part = content[i];
    if (part?.type === "text") {
      const textPart = part;
      textPart.cache_control = cacheControl;
      return true;
    }
  }
  return false;
}
function convertMessages(model, context, compat, options) {
  const params = [];
  const normalizeToolCallId2 = (id) => {
    if (id.includes("|")) {
      const separatorIndex = id.indexOf("|");
      const callId = id.slice(0, separatorIndex).replace(/[^a-zA-Z0-9_-]/g, "_");
      const itemId = id.slice(separatorIndex + 1).replace(/[^a-zA-Z0-9_-]/g, "_");
      const combinedId = itemId.length > 0 ? `${callId}_${itemId}` : callId;
      if (combinedId.length <= 40) {
        return combinedId;
      }
      const hash = shortHash(id).slice(0, 8);
      const prefix = callId.slice(0, Math.max(1, 40 - hash.length - 1));
      return `${prefix}_${hash}`;
    }
    if (model.provider === "openai")
      return id.length > 40 ? id.slice(0, 40) : id;
    return id;
  };
  const transformedMessages = transformMessages(context.messages, model, (id) => normalizeToolCallId2(id));
  if (context.systemPrompt) {
    const useDeveloperRole = model.reasoning && compat.supportsDeveloperRole;
    const role = useDeveloperRole ? "developer" : "system";
    params.push({ role, content: sanitizeSurrogates(context.systemPrompt) });
  }
  let lastRole = null;
  for (let i = 0; i < transformedMessages.length; i++) {
    const msg = transformedMessages[i];
    if (compat.requiresAssistantAfterToolResult && lastRole === "toolResult" && msg.role === "user") {
      params.push({
        role: "assistant",
        content: "I have processed the tool results."
      });
    }
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        params.push({
          role: "user",
          content: sanitizeSurrogates(msg.content)
        });
      } else {
        const content = msg.content.map((item) => {
          if (item.type === "text") {
            return {
              type: "text",
              text: sanitizeSurrogates(item.text)
            };
          } else {
            return {
              type: "image_url",
              image_url: {
                url: `data:${item.mimeType};base64,${item.data}`
              }
            };
          }
        });
        if (content.length === 0)
          continue;
        params.push({
          role: "user",
          content
        });
      }
    } else if (msg.role === "assistant") {
      const assistantMsg = {
        role: "assistant",
        content: compat.requiresAssistantAfterToolResult ? "" : null
      };
      const assistantTextParts = msg.content.filter(isTextContentBlock).filter((block) => block.text.trim().length > 0).map((block) => ({
        type: "text",
        text: sanitizeSurrogates(block.text)
      }));
      const assistantText = assistantTextParts.map((part) => part.text).join("");
      const nonEmptyThinkingBlocks = msg.content.filter(isThinkingContentBlock).filter((block) => block.thinking.trim().length > 0);
      if (nonEmptyThinkingBlocks.length > 0) {
        if (compat.requiresThinkingAsText) {
          const thinkingText = nonEmptyThinkingBlocks.map((block) => sanitizeSurrogates(block.thinking)).join("\n\n");
          assistantMsg.content = [{ type: "text", text: thinkingText }, ...assistantTextParts];
        } else {
          if (assistantText.length > 0) {
            assistantMsg.content = assistantText;
          }
          let signature = nonEmptyThinkingBlocks[0].thinkingSignature;
          if (model.provider === "opencode-go" && signature === "reasoning") {
            signature = "reasoning_content";
          }
          if (signature && signature.length > 0) {
            assistantMsg[signature] = nonEmptyThinkingBlocks.map((block) => block.thinking).join("\n");
          }
        }
      } else if (assistantText.length > 0) {
        assistantMsg.content = assistantText;
      }
      const toolCalls = msg.content.filter(isToolCallBlock);
      if (toolCalls.length > 0) {
        assistantMsg.tool_calls = toolCalls.map((tc) => {
          const customInputProperty = options?.grammarToolInputProperties?.get(tc.name);
          if (customInputProperty !== void 0) {
            return {
              id: tc.id,
              type: "custom",
              custom: {
                name: tc.name,
                input: sanitizeSurrogates(getGrammarToolInput(tc.name, tc.arguments, customInputProperty))
              }
            };
          }
          return {
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          };
        });
        const reasoningDetails = toolCalls.filter((tc) => tc.thoughtSignature).map((tc) => {
          try {
            return JSON.parse(tc.thoughtSignature);
          } catch {
            return null;
          }
        }).filter(Boolean);
        if (reasoningDetails.length > 0) {
          assistantMsg.reasoning_details = reasoningDetails;
        }
      }
      if (compat.requiresReasoningContentOnAssistantMessages && model.reasoning && assistantMsg.reasoning_content === void 0) {
        assistantMsg.reasoning_content = "";
      }
      const content = assistantMsg.content;
      const hasContent = content !== null && content !== void 0 && (typeof content === "string" ? content.length > 0 : content.length > 0);
      if (!hasContent && !assistantMsg.tool_calls) {
        continue;
      }
      params.push(assistantMsg);
    } else if (msg.role === "toolResult") {
      const imageBlocks = [];
      const deferredToolNames = /* @__PURE__ */ new Set();
      let j = i;
      for (; j < transformedMessages.length && transformedMessages[j].role === "toolResult"; j++) {
        const toolMsg = transformedMessages[j];
        const textResult = toolMsg.content.filter(isTextContentBlock).map((block) => block.text).join("\n");
        const hasImages = toolMsg.content.some((c) => c.type === "image");
        const hasText = textResult.length > 0;
        const toolResultText = hasText ? textResult : hasImages ? "(see attached image)" : "(no tool output)";
        const toolResultMsg = {
          role: "tool",
          content: sanitizeSurrogates(toolResultText),
          tool_call_id: toolMsg.toolCallId
        };
        if (compat.requiresToolResultName && toolMsg.toolName) {
          toolResultMsg.name = toolMsg.toolName;
        }
        params.push(toolResultMsg);
        if (compat.deferredToolsMode === "kimi") {
          for (const name of toolMsg.addedToolNames ?? []) {
            deferredToolNames.add(name);
          }
        }
        if (hasImages && model.input.includes("image")) {
          for (const block of toolMsg.content) {
            if (isImageContentBlock(block)) {
              imageBlocks.push({
                type: "image_url",
                image_url: {
                  url: `data:${block.mimeType};base64,${block.data}`
                }
              });
            }
          }
        }
      }
      i = j - 1;
      if (imageBlocks.length > 0) {
        if (compat.requiresAssistantAfterToolResult) {
          params.push({
            role: "assistant",
            content: "I have processed the tool results."
          });
        }
        params.push({
          role: "user",
          content: [
            {
              type: "text",
              text: "Attached image(s) from tool result:"
            },
            ...imageBlocks
          ]
        });
        lastRole = "user";
      } else {
        lastRole = "toolResult";
      }
      if (deferredToolNames.size > 0) {
        const deferredTools = getToolsByName(context.tools, deferredToolNames);
        if (deferredTools.length > 0) {
          const kimiToolMessage = {
            role: "system",
            tools: convertTools(deferredTools, compat)
          };
          params.push(kimiToolMessage);
        }
      }
      continue;
    }
    lastRole = msg.role;
  }
  return params;
}
function convertTools(tools, compat) {
  return tools.map((tool) => {
    const grammar = resolveGrammarConstrainedSampling(tool, compat.supportsOpenAIGrammarTools);
    if (grammar) {
      return {
        type: "custom",
        custom: {
          name: tool.name,
          description: tool.description,
          format: {
            type: "grammar",
            grammar: {
              syntax: grammar.format,
              definition: grammar.definition
            }
          }
        }
      };
    }
    const strict = resolveJsonSchemaStrictSampling(tool, compat.supportsStrictMode !== false);
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        // TypeBox already generates JSON Schema
        // Only include strict if provider supports it. Some reject unknown fields.
        ...compat.supportsStrictMode !== false && { strict: strict ?? false }
      }
    };
  });
}
function parseChunkUsage(rawUsage, model) {
  const promptTokens = rawUsage.prompt_tokens || 0;
  const cacheReadTokens = rawUsage.prompt_tokens_details?.cached_tokens ?? rawUsage.prompt_cache_hit_tokens ?? 0;
  const cacheWriteTokens = rawUsage.prompt_tokens_details?.cache_write_tokens || 0;
  const input = Math.max(0, promptTokens - cacheReadTokens - cacheWriteTokens);
  const outputTokens = rawUsage.completion_tokens || 0;
  const usage = {
    input,
    output: outputTokens,
    cacheRead: cacheReadTokens,
    cacheWrite: cacheWriteTokens,
    reasoning: rawUsage.completion_tokens_details?.reasoning_tokens || 0,
    totalTokens: input + outputTokens + cacheReadTokens + cacheWriteTokens,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  };
  calculateCost(model, usage);
  return usage;
}
function mapStopReason(reason) {
  if (reason === null)
    return { stopReason: "stop" };
  switch (reason) {
    case "stop":
    case "end":
      return { stopReason: "stop" };
    case "length":
      return { stopReason: "length" };
    case "function_call":
    case "tool_calls":
      return { stopReason: "toolUse" };
    case "content_filter":
      return { stopReason: "error", errorMessage: "Provider finish_reason: content_filter" };
    case "network_error":
      return { stopReason: "error", errorMessage: "Provider finish_reason: network_error" };
    default:
      return {
        stopReason: "error",
        errorMessage: `Provider finish_reason: ${reason}`
      };
  }
}
function detectCompat(model) {
  const provider = model.provider;
  const baseUrl = model.baseUrl;
  const isZai = provider === "zai" || provider === "zai-coding-cn" || baseUrl.includes("api.z.ai") || baseUrl.includes("open.bigmodel.cn");
  const isTogether = provider === "together" || baseUrl.includes("api.together.ai") || baseUrl.includes("api.together.xyz");
  const isMoonshot = provider === "moonshotai" || provider === "moonshotai-cn" || baseUrl.includes("api.moonshot.");
  const isOpenRouter = provider === "openrouter" || baseUrl.includes("openrouter.ai");
  const isCloudflareWorkersAI = provider === "cloudflare-workers-ai" || baseUrl.includes("api.cloudflare.com");
  const isCloudflareAiGateway = provider === "cloudflare-ai-gateway" || baseUrl.includes("gateway.ai.cloudflare.com");
  const isNvidia = provider === "nvidia" || baseUrl.includes("integrate.api.nvidia.com");
  const isAntLing = provider === "ant-ling" || baseUrl.includes("api.ant-ling.com");
  const isNonStandard = isNvidia || provider === "cerebras" || baseUrl.includes("cerebras.ai") || provider === "xai" || baseUrl.includes("api.x.ai") || isTogether || baseUrl.includes("chutes.ai") || baseUrl.includes("deepseek.com") || isZai || isMoonshot || provider === "opencode" || baseUrl.includes("opencode.ai") || isCloudflareWorkersAI || isCloudflareAiGateway || isAntLing;
  const useMaxTokens = baseUrl.includes("chutes.ai") || isMoonshot || isCloudflareAiGateway || isTogether || isNvidia || isAntLing;
  const isGrok = provider === "xai" || baseUrl.includes("api.x.ai");
  const isDeepSeek = provider === "deepseek" || baseUrl.includes("deepseek.com");
  const isOpenRouterDeveloperRoleModel = isOpenRouter && (model.id.startsWith("anthropic/") || model.id.startsWith("openai/"));
  const cacheControlFormat = provider === "openrouter" && model.id.startsWith("anthropic/") ? "anthropic" : void 0;
  return {
    supportsStore: !isNonStandard,
    supportsDeveloperRole: isOpenRouterDeveloperRoleModel || !isNonStandard && !isOpenRouter,
    supportsReasoningEffort: !isGrok && !isZai && !isMoonshot && !isTogether && !isCloudflareAiGateway && !isNvidia && !isAntLing,
    supportsUsageInStreaming: true,
    maxTokensField: useMaxTokens ? "max_tokens" : "max_completion_tokens",
    requiresToolResultName: false,
    requiresAssistantAfterToolResult: false,
    requiresThinkingAsText: false,
    requiresReasoningContentOnAssistantMessages: isDeepSeek,
    thinkingFormat: isDeepSeek ? "deepseek" : isZai ? "zai" : isTogether ? "together" : isAntLing ? "ant-ling" : isOpenRouter ? "openrouter" : "openai",
    openRouterRouting: {},
    vercelGatewayRouting: {},
    chatTemplateKwargs: {},
    zaiToolStream: false,
    supportsStrictMode: !isMoonshot && !isTogether && !isCloudflareAiGateway && !isNvidia,
    supportsOpenAIGrammarTools: false,
    cacheControlFormat,
    sendSessionAffinityHeaders: false,
    deferredToolsMode: void 0,
    sessionAffinityFormat: isOpenRouter ? "openrouter" : "openai",
    supportsLongCacheRetention: !(isTogether || isCloudflareWorkersAI || isCloudflareAiGateway || isNvidia || isAntLing)
  };
}
function getCompat(model) {
  const detected = detectCompat(model);
  if (!model.compat)
    return detected;
  return {
    supportsStore: model.compat.supportsStore ?? detected.supportsStore,
    supportsDeveloperRole: model.compat.supportsDeveloperRole ?? detected.supportsDeveloperRole,
    supportsReasoningEffort: model.compat.supportsReasoningEffort ?? detected.supportsReasoningEffort,
    supportsUsageInStreaming: model.compat.supportsUsageInStreaming ?? detected.supportsUsageInStreaming,
    maxTokensField: model.compat.maxTokensField ?? detected.maxTokensField,
    requiresToolResultName: model.compat.requiresToolResultName ?? detected.requiresToolResultName,
    requiresAssistantAfterToolResult: model.compat.requiresAssistantAfterToolResult ?? detected.requiresAssistantAfterToolResult,
    requiresThinkingAsText: model.compat.requiresThinkingAsText ?? detected.requiresThinkingAsText,
    requiresReasoningContentOnAssistantMessages: model.compat.requiresReasoningContentOnAssistantMessages ?? detected.requiresReasoningContentOnAssistantMessages,
    thinkingFormat: model.compat.thinkingFormat ?? detected.thinkingFormat,
    openRouterRouting: model.compat.openRouterRouting ?? {},
    vercelGatewayRouting: model.compat.vercelGatewayRouting ?? detected.vercelGatewayRouting,
    chatTemplateKwargs: model.compat.chatTemplateKwargs ?? detected.chatTemplateKwargs,
    zaiToolStream: model.compat.zaiToolStream ?? detected.zaiToolStream,
    supportsStrictMode: model.compat.supportsStrictMode ?? detected.supportsStrictMode,
    supportsOpenAIGrammarTools: model.compat.supportsOpenAIGrammarTools ?? detected.supportsOpenAIGrammarTools,
    cacheControlFormat: model.compat.cacheControlFormat ?? detected.cacheControlFormat,
    sendSessionAffinityHeaders: model.compat.sendSessionAffinityHeaders ?? detected.sendSessionAffinityHeaders,
    deferredToolsMode: model.compat.deferredToolsMode ?? detected.deferredToolsMode,
    sessionAffinityFormat: model.compat.sessionAffinityFormat ?? detected.sessionAffinityFormat,
    supportsLongCacheRetention: model.compat.supportsLongCacheRetention ?? detected.supportsLongCacheRetention
  };
}
var stream, streamSimple;
var init_openai_completions = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-completions.js"() {
    init_models();
    init_error_body();
    init_event_stream();
    init_hash();
    init_headers();
    init_json_parse();
    init_provider_env();
    init_provider_retry();
    init_sanitize_unicode();
    init_constrained_sampling();
    init_github_copilot_headers();
    init_openai_prompt_cache();
    init_simple_options();
    init_transform_messages();
    stream = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = getClientApiKey(model.provider, options?.apiKey, options?.headers);
          const compat = getCompat(model);
          const grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools);
          const cacheRetention = resolveCacheRetention(options?.cacheRetention, options?.env);
          const cacheSessionId = cacheRetention === "none" ? void 0 : options?.sessionId;
          const client = createClient(model, context, apiKey, options?.headers, cacheSessionId, compat);
          let params = buildParams(model, context, options, compat, cacheRetention, grammarToolInputProperties);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const requestOptions = {
            ...options?.signal ? { signal: options.signal } : {},
            ...options?.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {},
            maxRetries: 0
          };
          const { data: openaiStream, response } = await retryProviderRequest(() => client.chat.completions.create(params, requestOptions).withResponse(), {
            maxRetries: options?.maxRetries,
            maxRetryDelayMs: options?.maxRetryDelayMs,
            signal: options?.signal
          });
          await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
          stream10.push({ type: "start", partial: output });
          let textBlock = null;
          let thinkingBlock = null;
          let hasFinishReason = false;
          const toolCallBlocksByIndex = /* @__PURE__ */ new Map();
          const toolCallBlocksById = /* @__PURE__ */ new Map();
          const pendingReasoningDetailsByToolCallId = /* @__PURE__ */ new Map();
          const blocks = output.content;
          const getContentIndex = (block) => blocks.indexOf(block);
          const getCustomToolCallInput2 = (block) => {
            const property = block.customInput?.property;
            if (property === void 0)
              return "";
            const value = block.arguments[property];
            return typeof value === "string" ? value : "";
          };
          const appendCustomToolCallInput2 = (block, nextInput, close) => {
            const customInput = block.customInput;
            if (!customInput)
              return void 0;
            const delta = appendGrammarToolInputJsonDelta(customInput.jsonBuffer, customInput.property, nextInput, close);
            block.arguments = { [customInput.property]: nextInput };
            return delta;
          };
          const finishBlock = (block) => {
            const contentIndex = getContentIndex(block);
            if (contentIndex === -1) {
              return;
            }
            if (block.type === "text") {
              stream10.push({
                type: "text_end",
                contentIndex,
                content: block.text,
                partial: output
              });
            } else if (block.type === "thinking") {
              stream10.push({
                type: "thinking_end",
                contentIndex,
                content: block.thinking,
                partial: output
              });
            } else if (block.type === "toolCall") {
              if (block.customInput) {
                const delta = appendCustomToolCallInput2(block, getCustomToolCallInput2(block), true);
                if (delta !== void 0) {
                  stream10.push({
                    type: "toolcall_delta",
                    contentIndex,
                    delta,
                    partial: output
                  });
                }
              } else {
                block.arguments = parseStreamingJson(block.partialArgs);
              }
              delete block.partialArgs;
              delete block.customInput;
              delete block.streamIndex;
              stream10.push({
                type: "toolcall_end",
                contentIndex,
                toolCall: block,
                partial: output
              });
            }
          };
          const ensureTextBlock = () => {
            if (!textBlock) {
              textBlock = { type: "text", text: "" };
              blocks.push(textBlock);
              stream10.push({ type: "text_start", contentIndex: getContentIndex(textBlock), partial: output });
            }
            return textBlock;
          };
          const ensureThinkingBlock = (thinkingSignature) => {
            if (!thinkingBlock) {
              thinkingBlock = {
                type: "thinking",
                thinking: "",
                thinkingSignature
              };
              blocks.push(thinkingBlock);
              stream10.push({ type: "thinking_start", contentIndex: getContentIndex(thinkingBlock), partial: output });
            }
            return thinkingBlock;
          };
          const applyPendingReasoningDetail = (block) => {
            if (!block.id) {
              return;
            }
            const pendingReasoningDetail = pendingReasoningDetailsByToolCallId.get(block.id);
            if (pendingReasoningDetail) {
              block.thoughtSignature = pendingReasoningDetail;
              pendingReasoningDetailsByToolCallId.delete(block.id);
            }
          };
          const ensureToolCallBlock = (toolCall) => {
            const streamIndex = typeof toolCall.index === "number" ? toolCall.index : void 0;
            const name = toolCall.function?.name ?? toolCall.custom?.name ?? "";
            let block = streamIndex !== void 0 ? toolCallBlocksByIndex.get(streamIndex) : void 0;
            if (!block && toolCall.id) {
              block = toolCallBlocksById.get(toolCall.id);
            }
            if (!block) {
              const customInputProperty = toolCall.custom ? grammarToolInputProperties.get(name) ?? "input" : void 0;
              const hasCustomInput = customInputProperty !== void 0;
              block = {
                type: "toolCall",
                id: toolCall.id || "",
                name,
                arguments: hasCustomInput ? { [customInputProperty]: "" } : {},
                partialArgs: hasCustomInput ? void 0 : "",
                customInput: hasCustomInput ? { property: customInputProperty, jsonBuffer: { input: "", started: false, closed: false } } : void 0,
                streamIndex
              };
              if (streamIndex !== void 0) {
                toolCallBlocksByIndex.set(streamIndex, block);
              }
              if (toolCall.id) {
                toolCallBlocksById.set(toolCall.id, block);
              }
              blocks.push(block);
              stream10.push({
                type: "toolcall_start",
                contentIndex: getContentIndex(block),
                partial: output
              });
            }
            if (streamIndex !== void 0 && block.streamIndex === void 0) {
              block.streamIndex = streamIndex;
              toolCallBlocksByIndex.set(streamIndex, block);
            }
            if (toolCall.id) {
              toolCallBlocksById.set(toolCall.id, block);
            }
            if (!block.name && name) {
              block.name = name;
            }
            if (toolCall.custom && !block.customInput) {
              const customInputProperty = grammarToolInputProperties.get(block.name) ?? "input";
              block.arguments = { [customInputProperty]: "" };
              block.customInput = {
                property: customInputProperty,
                jsonBuffer: { input: "", started: false, closed: false }
              };
              delete block.partialArgs;
            }
            applyPendingReasoningDetail(block);
            return block;
          };
          for await (const chunk of openaiStream) {
            if (!chunk || typeof chunk !== "object")
              continue;
            output.responseId ||= chunk.id;
            if (typeof chunk.model === "string" && chunk.model.length > 0 && chunk.model !== model.id) {
              output.responseModel ||= chunk.model;
            }
            if (chunk.usage) {
              output.usage = parseChunkUsage(chunk.usage, model);
            }
            const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : void 0;
            if (!choice)
              continue;
            if (!chunk.usage && choice.usage) {
              output.usage = parseChunkUsage(choice.usage, model);
            }
            if (choice.finish_reason) {
              const finishReasonResult = mapStopReason(choice.finish_reason);
              output.stopReason = finishReasonResult.stopReason;
              if (finishReasonResult.errorMessage) {
                output.errorMessage = finishReasonResult.errorMessage;
              }
              hasFinishReason = true;
            }
            if (choice.delta) {
              if (choice.delta.content !== null && choice.delta.content !== void 0 && choice.delta.content.length > 0) {
                const block = ensureTextBlock();
                block.text += choice.delta.content;
                stream10.push({
                  type: "text_delta",
                  contentIndex: getContentIndex(block),
                  delta: choice.delta.content,
                  partial: output
                });
              }
              const reasoningFields = ["reasoning_content", "reasoning", "reasoning_text"];
              const deltaFields = choice.delta;
              let foundReasoningField = null;
              for (const field of reasoningFields) {
                const value = deltaFields[field];
                if (typeof value === "string" && value.length > 0) {
                  foundReasoningField = field;
                  break;
                }
              }
              if (foundReasoningField) {
                const delta = deltaFields[foundReasoningField];
                if (typeof delta === "string" && delta.length > 0) {
                  const thinkingSignature = model.provider === "opencode-go" && foundReasoningField === "reasoning" ? "reasoning_content" : foundReasoningField;
                  const block = ensureThinkingBlock(thinkingSignature);
                  block.thinking += delta;
                  stream10.push({
                    type: "thinking_delta",
                    contentIndex: getContentIndex(block),
                    delta,
                    partial: output
                  });
                }
              }
              if (choice?.delta?.tool_calls) {
                for (const toolCall of choice.delta.tool_calls) {
                  const block = ensureToolCallBlock(toolCall);
                  if (!block.id && toolCall.id) {
                    block.id = toolCall.id;
                    toolCallBlocksById.set(toolCall.id, block);
                  }
                  const name = toolCall.function?.name ?? toolCall.custom?.name;
                  if (!block.name && name) {
                    block.name = name;
                  }
                  let delta = "";
                  if (toolCall.function?.arguments) {
                    delta = toolCall.function.arguments;
                    block.partialArgs = (block.partialArgs ?? "") + toolCall.function.arguments;
                    block.arguments = parseStreamingJson(block.partialArgs);
                  } else if (toolCall.custom?.input) {
                    const nextInput = getCustomToolCallInput2(block) + toolCall.custom.input;
                    delta = appendCustomToolCallInput2(block, nextInput, false) ?? "";
                  }
                  stream10.push({
                    type: "toolcall_delta",
                    contentIndex: getContentIndex(block),
                    delta,
                    partial: output
                  });
                }
              }
              const reasoningDetails = choice.delta.reasoning_details;
              if (Array.isArray(reasoningDetails)) {
                for (const detail of reasoningDetails) {
                  if (isEncryptedReasoningDetail(detail)) {
                    const serializedDetail = JSON.stringify(detail);
                    const matchingToolCall = toolCallBlocksById.get(detail.id);
                    if (matchingToolCall) {
                      matchingToolCall.thoughtSignature = serializedDetail;
                    } else {
                      pendingReasoningDetailsByToolCallId.set(detail.id, serializedDetail);
                    }
                  }
                }
              }
            }
          }
          for (const block of blocks) {
            finishBlock(block);
          }
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted") {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "error") {
            throw new Error(output.errorMessage || "Provider returned an error stop reason");
          }
          if (!hasFinishReason) {
            throw new Error("Stream ended without finish_reason");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.index;
            delete block.partialArgs;
            delete block.customInput;
            delete block.streamIndex;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatProviderError(normalizeProviderError(error));
          const rawMetadata = error?.error?.metadata?.raw;
          if (rawMetadata && !output.errorMessage.includes(String(rawMetadata))) {
            output.errorMessage += `
${rawMetadata}`;
          }
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple = (model, context, options) => {
      getClientApiKey(model.provider, options?.apiKey, options?.headers);
      const base = buildBaseOptions(model, context, options, options?.apiKey);
      const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : void 0;
      const reasoningEffort = clampedReasoning === "off" ? void 0 : clampedReasoning;
      const toolChoice = options?.toolChoice;
      return stream(model, context, {
        ...base,
        reasoningEffort,
        toolChoice
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/deferred-tools.js
function splitDeferredTools(context, enabled, normalizeName = identityToolName) {
  const uniqueTools = /* @__PURE__ */ new Map();
  for (const tool of context.tools ?? [])
    uniqueTools.set(normalizeName(tool.name), tool);
  if (!enabled)
    return { immediate: [...uniqueTools.values()], deferred: /* @__PURE__ */ new Map() };
  const deferredNames = /* @__PURE__ */ new Set();
  const usedNames = /* @__PURE__ */ new Set();
  for (const message of context.messages) {
    if (message.role === "assistant") {
      for (const block of message.content) {
        if (block.type === "toolCall")
          usedNames.add(normalizeName(block.name));
      }
    } else if (message.role === "toolResult") {
      for (const name of message.addedToolNames ?? []) {
        const normalizedName = normalizeName(name);
        if (!usedNames.has(normalizedName))
          deferredNames.add(normalizedName);
      }
    }
  }
  const immediate = [];
  const deferred = /* @__PURE__ */ new Map();
  for (const [name, tool] of uniqueTools) {
    if (deferredNames.has(name))
      deferred.set(name, tool);
    else
      immediate.push(tool);
  }
  return { immediate, deferred };
}
var identityToolName;
var init_deferred_tools = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/deferred-tools.js"() {
    identityToolName = (name) => name;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/anthropic-messages.js
var anthropic_messages_exports = {};
__export(anthropic_messages_exports, {
  stream: () => stream2,
  streamSimple: () => streamSimple2
});
import Anthropic from "@anthropic-ai/sdk";
function resolveCacheRetention2(cacheRetention, env) {
  if (cacheRetention) {
    return cacheRetention;
  }
  if (getProviderEnvValue("PI_CACHE_RETENTION", env) === "long") {
    return "long";
  }
  return "short";
}
function getCacheControl(model, cacheRetention, env) {
  const retention = resolveCacheRetention2(cacheRetention, env);
  if (retention === "none") {
    return { retention };
  }
  const ttl = retention === "long" && getAnthropicCompat(model).supportsLongCacheRetention ? "1h" : void 0;
  return {
    retention,
    cacheControl: { type: "ephemeral", ...ttl && { ttl } }
  };
}
function convertContentBlocks(content) {
  const hasImages = content.some((c) => c.type === "image");
  if (!hasImages) {
    return sanitizeSurrogates(content.map((c) => c.text).join("\n"));
  }
  const blocks = content.map((block) => {
    if (block.type === "text") {
      return {
        type: "text",
        text: sanitizeSurrogates(block.text)
      };
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: block.mimeType,
        data: block.data
      }
    };
  });
  const hasText = blocks.some((b) => b.type === "text");
  if (!hasText) {
    blocks.unshift({
      type: "text",
      text: "(see attached image)"
    });
  }
  return blocks;
}
function getAnthropicCompat(model) {
  return {
    supportsEagerToolInputStreaming: model.compat?.supportsEagerToolInputStreaming ?? true,
    supportsLongCacheRetention: model.compat?.supportsLongCacheRetention ?? true,
    sendSessionAffinityHeaders: model.compat?.sendSessionAffinityHeaders ?? false,
    supportsCacheControlOnTools: model.compat?.supportsCacheControlOnTools ?? true,
    supportsTemperature: model.compat?.supportsTemperature ?? true,
    allowEmptySignature: model.compat?.allowEmptySignature ?? false,
    supportsStrictTools: model.compat?.supportsStrictTools ?? false,
    supportsToolReferences: model.compat?.supportsToolReferences ?? defaultSupportsToolReferences(model)
  };
}
function defaultSupportsToolReferences(model) {
  if (model.provider !== "anthropic" || model.id.includes("haiku"))
    return false;
  const version = model.id.match(/^claude-(?:opus|sonnet|fable)-(\d+)(?:-(\d+))?(?:-|$)/);
  if (!version)
    return false;
  const major = Number(version[1]);
  const minor = version[2] && version[2].length < 8 ? Number(version[2]) : 0;
  return major > 4 || major === 4 && minor >= 5;
}
function mergeHeaders2(...headerSources) {
  const merged = {};
  for (const headers of headerSources) {
    if (headers) {
      Object.assign(merged, headers);
    }
  }
  return merged;
}
function hasHeader2(headers, name) {
  if (!headers)
    return false;
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === expected && value !== null && value.trim().length > 0)
      return true;
  }
  return false;
}
function assertRequestAuth(provider, apiKey, headers) {
  if (apiKey)
    return;
  if (hasHeader2(headers, "authorization") || hasHeader2(headers, "x-api-key") || hasHeader2(headers, "cf-aig-authorization")) {
    return;
  }
  throw new Error(`No API key for provider: ${provider}`);
}
function flushSseEvent(state) {
  if (!state.event && state.data.length === 0) {
    return null;
  }
  const event = {
    event: state.event,
    data: state.data.join("\n"),
    raw: [...state.raw]
  };
  state.event = null;
  state.data = [];
  state.raw = [];
  return event;
}
function decodeSseLine(line, state) {
  if (line === "") {
    return flushSseEvent(state);
  }
  state.raw.push(line);
  if (line.startsWith(":")) {
    return null;
  }
  const delimiterIndex = line.indexOf(":");
  const fieldName = delimiterIndex === -1 ? line : line.slice(0, delimiterIndex);
  let value = delimiterIndex === -1 ? "" : line.slice(delimiterIndex + 1);
  if (value.startsWith(" ")) {
    value = value.slice(1);
  }
  if (fieldName === "event") {
    state.event = value;
  } else if (fieldName === "data") {
    state.data.push(value);
  }
  return null;
}
function nextLineBreakIndex(text) {
  const carriageReturnIndex = text.indexOf("\r");
  const newlineIndex = text.indexOf("\n");
  if (carriageReturnIndex === -1) {
    return newlineIndex;
  }
  if (newlineIndex === -1) {
    return carriageReturnIndex;
  }
  return Math.min(carriageReturnIndex, newlineIndex);
}
function consumeLine(text) {
  const lineBreakIndex = nextLineBreakIndex(text);
  if (lineBreakIndex === -1) {
    return null;
  }
  let nextIndex = lineBreakIndex + 1;
  if (text[lineBreakIndex] === "\r" && text[nextIndex] === "\n") {
    nextIndex += 1;
  }
  return {
    line: text.slice(0, lineBreakIndex),
    rest: text.slice(nextIndex)
  };
}
async function* iterateSseMessages(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const state = { event: null, data: [], raw: [] };
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error("Request was aborted");
      }
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let consumed2 = consumeLine(buffer);
      while (consumed2) {
        buffer = consumed2.rest;
        const event = decodeSseLine(consumed2.line, state);
        if (event) {
          yield event;
        }
        consumed2 = consumeLine(buffer);
      }
    }
    buffer += decoder.decode();
    let consumed = consumeLine(buffer);
    while (consumed) {
      buffer = consumed.rest;
      const event = decodeSseLine(consumed.line, state);
      if (event) {
        yield event;
      }
      consumed = consumeLine(buffer);
    }
    if (buffer.length > 0) {
      const event = decodeSseLine(buffer, state);
      if (event) {
        yield event;
      }
    }
    const trailingEvent = flushSseEvent(state);
    if (trailingEvent) {
      yield trailingEvent;
    }
  } finally {
    reader.releaseLock();
  }
}
async function* iterateAnthropicEvents(response, signal) {
  if (!response.body) {
    throw new Error("Attempted to iterate over an Anthropic response with no body");
  }
  let sawMessageStart = false;
  let sawMessageEnd = false;
  for await (const sse of iterateSseMessages(response.body, signal)) {
    if (sse.event === "error") {
      throw new Error(sse.data);
    }
    if (!ANTHROPIC_MESSAGE_EVENTS.has(sse.event ?? "")) {
      continue;
    }
    try {
      const event = parseJsonWithRepair(sse.data);
      if (event.type === "message_start") {
        sawMessageStart = true;
      } else if (event.type === "message_stop") {
        sawMessageEnd = true;
      }
      yield event;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not parse Anthropic SSE event ${sse.event}: ${message}; data=${sse.data}; raw=${sse.raw.join("\\n")}`);
    }
  }
  if (sawMessageStart && !sawMessageEnd) {
    throw new Error("Anthropic stream ended before message_stop");
  }
}
function mapThinkingLevelToEffort(model, level) {
  const mapped = level ? model.thinkingLevelMap?.[level] : void 0;
  if (typeof mapped === "string")
    return mapped;
  switch (level) {
    case "minimal":
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    default:
      return "high";
  }
}
function isOAuthToken(apiKey) {
  return apiKey.includes("sk-ant-oat");
}
function createClient2(model, apiKey, interleavedThinking, useFineGrainedToolStreamingBeta, optionsHeaders, dynamicHeaders, sessionId) {
  const needsInterleavedBeta = interleavedThinking && model.compat?.forceAdaptiveThinking !== true;
  const betaFeatures = [];
  if (useFineGrainedToolStreamingBeta) {
    betaFeatures.push(FINE_GRAINED_TOOL_STREAMING_BETA);
  }
  if (needsInterleavedBeta) {
    betaFeatures.push(INTERLEAVED_THINKING_BETA);
  }
  if (model.provider === "github-copilot") {
    const client2 = new Anthropic({
      apiKey: null,
      authToken: apiKey ?? null,
      baseURL: model.baseUrl,
      dangerouslyAllowBrowser: true,
      defaultHeaders: mergeHeaders2({
        accept: "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
        ...betaFeatures.length > 0 ? { "anthropic-beta": betaFeatures.join(",") } : {}
      }, model.headers, dynamicHeaders, optionsHeaders)
    });
    return { client: client2, isOAuthToken: false };
  }
  if (apiKey && isOAuthToken(apiKey)) {
    const client2 = new Anthropic({
      apiKey: null,
      authToken: apiKey,
      baseURL: model.baseUrl,
      dangerouslyAllowBrowser: true,
      defaultHeaders: mergeHeaders2({
        accept: "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
        "anthropic-beta": ["claude-code-20250219", "oauth-2025-04-20", ...betaFeatures].join(","),
        "user-agent": `claude-cli/${claudeCodeVersion}`,
        "x-app": "cli"
      }, model.headers, optionsHeaders)
    });
    return { client: client2, isOAuthToken: true };
  }
  const sessionAffinityHeaders = sessionId && getAnthropicCompat(model).sendSessionAffinityHeaders ? { "x-session-affinity": sessionId } : {};
  const defaultHeaders = mergeHeaders2({
    accept: "application/json",
    "anthropic-dangerous-direct-browser-access": "true",
    ...betaFeatures.length > 0 ? { "anthropic-beta": betaFeatures.join(",") } : {}
  }, sessionAffinityHeaders, model.headers, optionsHeaders);
  const client = new Anthropic({
    apiKey: apiKey ?? null,
    authToken: null,
    baseURL: model.baseUrl,
    dangerouslyAllowBrowser: true,
    defaultHeaders
  });
  return { client, isOAuthToken: false };
}
function buildParams2(model, context, isOAuthToken2, options) {
  const { cacheControl } = getCacheControl(model, options?.cacheRetention, options?.env);
  const compat = getAnthropicCompat(model);
  const transformedMessages = transformMessages(context.messages, model, normalizeToolCallId);
  const normalizeToolName = isOAuthToken2 ? toClaudeCodeName : (name) => name;
  const toolPlacement = splitDeferredTools({ ...context, messages: transformedMessages }, compat.supportsToolReferences, normalizeToolName);
  let immediateTools = toolPlacement.immediate;
  let deferredTools = [...toolPlacement.deferred.values()];
  if (immediateTools.length === 0 && deferredTools.length > 0) {
    immediateTools = deferredTools;
    deferredTools = [];
  }
  const deferredToolNames = new Set(deferredTools.map((tool) => normalizeToolName(tool.name)));
  const params = {
    model: model.id,
    messages: convertMessages2(transformedMessages, isOAuthToken2, cacheControl, compat.allowEmptySignature, deferredToolNames, normalizeToolName),
    max_tokens: options?.maxTokens ?? model.maxTokens,
    stream: true
  };
  if (isOAuthToken2) {
    params.system = [
      {
        type: "text",
        text: "You are Claude Code, Anthropic's official CLI for Claude.",
        ...cacheControl ? { cache_control: cacheControl } : {}
      }
    ];
    if (context.systemPrompt) {
      params.system.push({
        type: "text",
        text: sanitizeSurrogates(context.systemPrompt),
        ...cacheControl ? { cache_control: cacheControl } : {}
      });
    }
  } else if (context.systemPrompt) {
    params.system = [
      {
        type: "text",
        text: sanitizeSurrogates(context.systemPrompt),
        ...cacheControl ? { cache_control: cacheControl } : {}
      }
    ];
  }
  if (options?.temperature !== void 0 && !options?.thinkingEnabled && compat.supportsTemperature) {
    params.temperature = options.temperature;
  }
  if (immediateTools.length > 0 || deferredTools.length > 0) {
    params.tools = [
      ...convertTools2(immediateTools, isOAuthToken2, compat.supportsEagerToolInputStreaming, compat.supportsStrictTools, compat.supportsCacheControlOnTools ? cacheControl : void 0),
      ...convertTools2(deferredTools, isOAuthToken2, compat.supportsEagerToolInputStreaming, compat.supportsStrictTools, void 0, true)
    ];
  }
  if (model.reasoning) {
    if (options?.thinkingEnabled) {
      const display = options.thinkingDisplay ?? "summarized";
      if (model.compat?.forceAdaptiveThinking === true) {
        params.thinking = { type: "adaptive", display };
        if (options.effort) {
          params.output_config = options.effort === "xhigh" ? { effort: options.effort } : { effort: options.effort };
        }
      } else {
        params.thinking = {
          type: "enabled",
          budget_tokens: options.thinkingBudgetTokens || 1024,
          display
        };
      }
    } else if (options?.thinkingEnabled === false && model.thinkingLevelMap?.off !== null) {
      params.thinking = { type: "disabled" };
    }
  }
  if (options?.metadata) {
    const userId = options.metadata.user_id;
    if (typeof userId === "string") {
      params.metadata = { user_id: userId };
    }
  }
  if (options?.toolChoice) {
    if (typeof options.toolChoice === "string") {
      params.tool_choice = { type: options.toolChoice };
    } else {
      params.tool_choice = options.toolChoice;
    }
  }
  return params;
}
function normalizeToolCallId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}
function convertToolResult(msg, isOAuthToken2, deferredToolNames, loadedToolNames, normalizeToolName) {
  const references = [];
  for (const name of msg.addedToolNames ?? []) {
    const normalizedName = normalizeToolName(name);
    if (!deferredToolNames.has(normalizedName) || loadedToolNames.has(normalizedName))
      continue;
    loadedToolNames.add(normalizedName);
    references.push({
      type: "tool_reference",
      tool_name: isOAuthToken2 ? toClaudeCodeName(name) : name
    });
  }
  const convertedContent = convertContentBlocks(msg.content);
  return {
    toolResult: {
      type: "tool_result",
      tool_use_id: msg.toolCallId,
      content: references.length > 0 ? references : convertedContent,
      is_error: msg.isError
    },
    siblingContent: references.length === 0 ? [] : typeof convertedContent === "string" ? [{ type: "text", text: convertedContent }] : convertedContent
  };
}
function convertMessages2(transformedMessages, isOAuthToken2, cacheControl, allowEmptySignature = false, deferredToolNames = /* @__PURE__ */ new Set(), normalizeToolName = (name) => name) {
  const params = [];
  const loadedToolNames = /* @__PURE__ */ new Set();
  for (let i = 0; i < transformedMessages.length; i++) {
    const msg = transformedMessages[i];
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        if (msg.content.trim().length > 0) {
          params.push({
            role: "user",
            content: sanitizeSurrogates(msg.content)
          });
        }
      } else {
        const blocks = msg.content.map((item) => {
          if (item.type === "text") {
            return {
              type: "text",
              text: sanitizeSurrogates(item.text)
            };
          } else {
            return {
              type: "image",
              source: {
                type: "base64",
                media_type: item.mimeType,
                data: item.data
              }
            };
          }
        });
        const filteredBlocks = blocks.filter((b) => {
          if (b.type === "text") {
            return b.text.trim().length > 0;
          }
          return true;
        });
        if (filteredBlocks.length === 0)
          continue;
        params.push({
          role: "user",
          content: filteredBlocks
        });
      }
    } else if (msg.role === "assistant") {
      const blocks = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          if (block.text.trim().length === 0)
            continue;
          blocks.push({
            type: "text",
            text: sanitizeSurrogates(block.text)
          });
        } else if (block.type === "thinking") {
          if (block.redacted) {
            blocks.push({
              type: "redacted_thinking",
              data: block.thinkingSignature
            });
            continue;
          }
          const thinkingSignature = block.thinkingSignature;
          const hasThinkingSignature = !!thinkingSignature && thinkingSignature.trim().length > 0;
          if (block.thinking.trim().length === 0 && !hasThinkingSignature)
            continue;
          if (!hasThinkingSignature) {
            blocks.push(allowEmptySignature ? {
              type: "thinking",
              thinking: sanitizeSurrogates(block.thinking),
              signature: ""
            } : {
              type: "text",
              text: sanitizeSurrogates(block.thinking)
            });
          } else {
            blocks.push({
              type: "thinking",
              thinking: sanitizeSurrogates(block.thinking),
              signature: thinkingSignature
            });
          }
        } else if (block.type === "toolCall") {
          blocks.push({
            type: "tool_use",
            id: block.id,
            name: isOAuthToken2 ? toClaudeCodeName(block.name) : block.name,
            input: block.arguments ?? {}
          });
        }
      }
      if (blocks.length === 0)
        continue;
      params.push({
        role: "assistant",
        content: blocks
      });
    } else if (msg.role === "toolResult") {
      const toolResults = [];
      const siblingContent = [];
      let j = i;
      while (j < transformedMessages.length && transformedMessages[j].role === "toolResult") {
        const converted = convertToolResult(transformedMessages[j], isOAuthToken2, deferredToolNames, loadedToolNames, normalizeToolName);
        toolResults.push(converted.toolResult);
        siblingContent.push(...converted.siblingContent);
        j++;
      }
      i = j - 1;
      params.push({
        role: "user",
        content: [...toolResults, ...siblingContent]
      });
    }
  }
  if (cacheControl && params.length > 0) {
    const lastMessage = params[params.length - 1];
    if (lastMessage.role === "user") {
      if (Array.isArray(lastMessage.content)) {
        const lastBlock = lastMessage.content[lastMessage.content.length - 1];
        if (lastBlock && (lastBlock.type === "text" || lastBlock.type === "image" || lastBlock.type === "tool_result")) {
          lastBlock.cache_control = cacheControl;
        }
      } else if (typeof lastMessage.content === "string") {
        lastMessage.content = [
          {
            type: "text",
            text: lastMessage.content,
            cache_control: cacheControl
          }
        ];
      }
    }
  }
  return params;
}
function shouldUseFineGrainedToolStreamingBeta(model, context) {
  return !!context.tools?.length && !getAnthropicCompat(model).supportsEagerToolInputStreaming;
}
function convertTools2(tools, isOAuthToken2, supportsEagerToolInputStreaming, supportsStrictTools, cacheControl, deferLoading = false) {
  if (!tools)
    return [];
  return tools.map((tool, index) => {
    const strict = resolveJsonSchemaStrictSampling(tool, supportsStrictTools);
    const schema = tool.parameters;
    const legacyInputSchema = {
      type: "object",
      properties: schema.properties ?? {},
      required: schema.required ?? []
    };
    const inputSchema = strict === true ? {
      ...tool.parameters,
      ...legacyInputSchema
    } : legacyInputSchema;
    return {
      name: isOAuthToken2 ? toClaudeCodeName(tool.name) : tool.name,
      description: tool.description,
      ...supportsEagerToolInputStreaming ? { eager_input_streaming: true } : {},
      ...strict === true ? { strict: true } : {},
      input_schema: inputSchema,
      ...deferLoading ? { defer_loading: true } : {},
      ...cacheControl && index === tools.length - 1 ? { cache_control: cacheControl } : {}
    };
  });
}
function mapStopReason2(reason, stopDetails) {
  switch (reason) {
    case "end_turn":
      return { stopReason: "stop" };
    case "max_tokens":
      return { stopReason: "length" };
    case "tool_use":
      return { stopReason: "toolUse" };
    case "refusal":
      return {
        stopReason: "error",
        errorMessage: stopDetails?.explanation || `The model refused to complete the request`
      };
    case "pause_turn":
      return { stopReason: "stop" };
    case "stop_sequence":
      return { stopReason: "stop" };
    // We don't supply stop sequences, so this should never happen
    case "sensitive":
      return { stopReason: "error" };
    default:
      throw new Error(`Unhandled stop reason: ${reason}`);
  }
}
var claudeCodeVersion, claudeCodeTools, ccToolLookup, toClaudeCodeName, fromClaudeCodeName, FINE_GRAINED_TOOL_STREAMING_BETA, INTERLEAVED_THINKING_BETA, ANTHROPIC_MESSAGE_EVENTS, stream2, streamSimple2;
var init_anthropic_messages = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/anthropic-messages.js"() {
    init_models();
    init_deferred_tools();
    init_event_stream();
    init_headers();
    init_json_parse();
    init_provider_env();
    init_provider_retry();
    init_sanitize_unicode();
    init_constrained_sampling();
    init_github_copilot_headers();
    init_simple_options();
    init_transform_messages();
    claudeCodeVersion = "2.1.75";
    claudeCodeTools = [
      "Read",
      "Write",
      "Edit",
      "Bash",
      "Grep",
      "Glob",
      "AskUserQuestion",
      "EnterPlanMode",
      "ExitPlanMode",
      "KillShell",
      "NotebookEdit",
      "Skill",
      "Task",
      "TaskOutput",
      "TodoWrite",
      "WebFetch",
      "WebSearch"
    ];
    ccToolLookup = new Map(claudeCodeTools.map((t) => [t.toLowerCase(), t]));
    toClaudeCodeName = (name) => ccToolLookup.get(name.toLowerCase()) ?? name;
    fromClaudeCodeName = (name, tools) => {
      if (tools && tools.length > 0) {
        const lowerName = name.toLowerCase();
        const matchedTool = tools.find((tool) => tool.name.toLowerCase() === lowerName);
        if (matchedTool)
          return matchedTool.name;
      }
      return name;
    };
    FINE_GRAINED_TOOL_STREAMING_BETA = "fine-grained-tool-streaming-2025-05-14";
    INTERLEAVED_THINKING_BETA = "interleaved-thinking-2025-05-14";
    ANTHROPIC_MESSAGE_EVENTS = /* @__PURE__ */ new Set([
      "message_start",
      "message_delta",
      "message_stop",
      "content_block_start",
      "content_block_delta",
      "content_block_stop"
    ]);
    stream2 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          let client;
          let isOAuth;
          if (options?.client) {
            client = options.client;
            isOAuth = false;
          } else {
            const apiKey = options?.apiKey;
            assertRequestAuth(model.provider, apiKey, options?.headers);
            let copilotDynamicHeaders;
            if (model.provider === "github-copilot") {
              const hasImages = hasCopilotVisionInput(context.messages);
              copilotDynamicHeaders = buildCopilotDynamicHeaders({
                messages: context.messages,
                hasImages
              });
            }
            const cacheRetention = resolveCacheRetention2(options?.cacheRetention, options?.env);
            const cacheSessionId = cacheRetention === "none" ? void 0 : options?.sessionId;
            const created = createClient2(model, apiKey, options?.interleavedThinking ?? true, shouldUseFineGrainedToolStreamingBeta(model, context), options?.headers, copilotDynamicHeaders, cacheSessionId);
            client = created.client;
            isOAuth = created.isOAuthToken;
          }
          let params = buildParams2(model, context, isOAuth, options);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const requestOptions = {
            ...options?.signal ? { signal: options.signal } : {},
            ...options?.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {},
            maxRetries: 0
          };
          const response = await retryProviderRequest(() => client.messages.create({ ...params, stream: true }, requestOptions).asResponse(), {
            maxRetries: options?.maxRetries,
            maxRetryDelayMs: options?.maxRetryDelayMs,
            signal: options?.signal
          });
          await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
          stream10.push({ type: "start", partial: output });
          const blocks = output.content;
          for await (const event of iterateAnthropicEvents(response, options?.signal)) {
            if (event.type === "message_start") {
              output.responseId = event.message.id;
              output.usage.input = event.message.usage.input_tokens || 0;
              output.usage.output = event.message.usage.output_tokens || 0;
              output.usage.cacheRead = event.message.usage.cache_read_input_tokens || 0;
              output.usage.cacheWrite = event.message.usage.cache_creation_input_tokens || 0;
              output.usage.cacheWrite1h = event.message.usage.cache_creation?.ephemeral_1h_input_tokens || 0;
              output.usage.totalTokens = output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
              calculateCost(model, output.usage);
            } else if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                const block = {
                  type: "text",
                  text: "",
                  index: event.index
                };
                output.content.push(block);
                stream10.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });
              } else if (event.content_block.type === "thinking") {
                const block = {
                  type: "thinking",
                  thinking: "",
                  thinkingSignature: "",
                  index: event.index
                };
                output.content.push(block);
                stream10.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
              } else if (event.content_block.type === "redacted_thinking") {
                const block = {
                  type: "thinking",
                  thinking: "[Reasoning redacted]",
                  thinkingSignature: event.content_block.data,
                  redacted: true,
                  index: event.index
                };
                output.content.push(block);
                stream10.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
              } else if (event.content_block.type === "tool_use") {
                const block = {
                  type: "toolCall",
                  id: event.content_block.id,
                  name: isOAuth ? fromClaudeCodeName(event.content_block.name, context.tools) : event.content_block.name,
                  arguments: event.content_block.input ?? {},
                  partialJson: "",
                  index: event.index
                };
                output.content.push(block);
                stream10.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const index = blocks.findIndex((b) => b.index === event.index);
                const block = blocks[index];
                if (block && block.type === "text") {
                  block.text += event.delta.text;
                  stream10.push({
                    type: "text_delta",
                    contentIndex: index,
                    delta: event.delta.text,
                    partial: output
                  });
                }
              } else if (event.delta.type === "thinking_delta") {
                const index = blocks.findIndex((b) => b.index === event.index);
                const block = blocks[index];
                if (block && block.type === "thinking") {
                  block.thinking += event.delta.thinking;
                  stream10.push({
                    type: "thinking_delta",
                    contentIndex: index,
                    delta: event.delta.thinking,
                    partial: output
                  });
                }
              } else if (event.delta.type === "input_json_delta") {
                const index = blocks.findIndex((b) => b.index === event.index);
                const block = blocks[index];
                if (block && block.type === "toolCall") {
                  block.partialJson += event.delta.partial_json;
                  block.arguments = parseStreamingJson(block.partialJson);
                  stream10.push({
                    type: "toolcall_delta",
                    contentIndex: index,
                    delta: event.delta.partial_json,
                    partial: output
                  });
                }
              } else if (event.delta.type === "signature_delta") {
                const index = blocks.findIndex((b) => b.index === event.index);
                const block = blocks[index];
                if (block && block.type === "thinking") {
                  block.thinkingSignature = block.thinkingSignature || "";
                  block.thinkingSignature += event.delta.signature;
                }
              }
            } else if (event.type === "content_block_stop") {
              const index = blocks.findIndex((b) => b.index === event.index);
              const block = blocks[index];
              if (block) {
                delete block.index;
                if (block.type === "text") {
                  stream10.push({
                    type: "text_end",
                    contentIndex: index,
                    content: block.text,
                    partial: output
                  });
                } else if (block.type === "thinking") {
                  stream10.push({
                    type: "thinking_end",
                    contentIndex: index,
                    content: block.thinking,
                    partial: output
                  });
                } else if (block.type === "toolCall") {
                  block.arguments = parseStreamingJson(block.partialJson);
                  delete block.partialJson;
                  stream10.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: block,
                    partial: output
                  });
                }
              }
            } else if (event.type === "message_delta") {
              if (event.delta.stop_reason) {
                const stopReasonResult = mapStopReason2(event.delta.stop_reason, event.delta.stop_details);
                output.stopReason = stopReasonResult.stopReason;
                if (stopReasonResult.errorMessage) {
                  output.errorMessage = stopReasonResult.errorMessage;
                }
              }
              if (event.usage) {
                if (event.usage.input_tokens != null) {
                  output.usage.input = event.usage.input_tokens;
                }
                if (event.usage.output_tokens != null) {
                  output.usage.output = event.usage.output_tokens;
                }
                if (event.usage.cache_read_input_tokens != null) {
                  output.usage.cacheRead = event.usage.cache_read_input_tokens;
                }
                if (event.usage.cache_creation_input_tokens != null) {
                  output.usage.cacheWrite = event.usage.cache_creation_input_tokens;
                }
                const thinkingTokens = event.usage.output_tokens_details?.thinking_tokens;
                if (thinkingTokens != null) {
                  output.usage.reasoning = thinkingTokens;
                }
              }
              output.usage.totalTokens = output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
              calculateCost(model, output.usage);
            }
          }
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error(output.errorMessage || "An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.index;
            delete block.partialJson;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple2 = (model, context, options) => {
      assertRequestAuth(model.provider, options?.apiKey, options?.headers);
      const base = buildBaseOptions(model, context, options, options?.apiKey);
      if (!options?.reasoning) {
        return stream2(model, context, { ...base, thinkingEnabled: false });
      }
      if (model.compat?.forceAdaptiveThinking === true) {
        const effort = mapThinkingLevelToEffort(model, options.reasoning);
        return stream2(model, context, {
          ...base,
          thinkingEnabled: true,
          effort
        });
      }
      const adjusted = adjustMaxTokensForThinking(base.maxTokens, model.maxTokens, options.reasoning, options.thinkingBudgets);
      const maxTokens = clampMaxTokensToContext(model, context, adjusted.maxTokens);
      return stream2(model, context, {
        ...base,
        maxTokens,
        thinkingEnabled: true,
        thinkingBudgetTokens: Math.min(adjusted.thinkingBudget, Math.max(0, maxTokens - 1024))
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-responses-shared.js
function encodeTextSignatureV1(id, phase) {
  const payload = { v: 1, id };
  if (phase)
    payload.phase = phase;
  return JSON.stringify(payload);
}
function parseTextSignature(signature) {
  if (!signature)
    return void 0;
  if (signature.startsWith("{")) {
    try {
      const parsed = JSON.parse(signature);
      if (parsed.v === 1 && typeof parsed.id === "string") {
        if (parsed.phase === "commentary" || parsed.phase === "final_answer") {
          return { id: parsed.id, phase: parsed.phase };
        }
        return { id: parsed.id };
      }
    } catch {
    }
  }
  return { id: signature };
}
function convertToolResultOutput(model, content) {
  const textResult = content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
  const images = content.filter((c) => c.type === "image");
  const hasText = textResult.length > 0;
  if (images.length === 0 || !model.input.includes("image")) {
    return sanitizeSurrogates(hasText ? textResult : images.length > 0 ? "(see attached image)" : "(no tool output)");
  }
  const output = [];
  if (hasText) {
    output.push({ type: "input_text", text: sanitizeSurrogates(textResult) });
  }
  for (const image of images) {
    output.push({
      type: "input_image",
      detail: "auto",
      image_url: `data:${image.mimeType};base64,${image.data}`
    });
  }
  return output;
}
function convertResponsesMessages(model, context, allowedToolCallProviders, options) {
  const messages = [];
  const loadedToolNames = /* @__PURE__ */ new Set();
  const normalizeIdPart = (part) => {
    const sanitized = part.replace(/[^a-zA-Z0-9_-]/g, "_");
    const normalized = sanitized.length > 64 ? sanitized.slice(0, 64) : sanitized;
    return normalized.replace(/_+$/, "");
  };
  const buildForeignResponsesItemId = (itemId) => {
    const normalized = `fc_${shortHash(itemId)}`;
    return normalized.length > 64 ? normalized.slice(0, 64) : normalized;
  };
  const normalizeToolCallId2 = (id, _targetModel, source) => {
    if (!allowedToolCallProviders.has(model.provider))
      return normalizeIdPart(id);
    if (!id.includes("|"))
      return normalizeIdPart(id);
    const [callId, itemId] = id.split("|");
    const normalizedCallId = normalizeIdPart(callId);
    const isForeignToolCall = source.provider !== model.provider || source.api !== model.api;
    let normalizedItemId = isForeignToolCall ? buildForeignResponsesItemId(itemId) : normalizeIdPart(itemId);
    if (!normalizedItemId.startsWith("fc_")) {
      normalizedItemId = normalizeIdPart(`fc_${normalizedItemId}`);
    }
    return `${normalizedCallId}|${normalizedItemId}`;
  };
  const transformedMessages = transformMessages(context.messages, model, normalizeToolCallId2);
  const includeSystemPrompt = options?.includeSystemPrompt ?? true;
  if (includeSystemPrompt && context.systemPrompt) {
    const compat = model.compat;
    const role = model.reasoning && compat?.supportsDeveloperRole !== false ? "developer" : "system";
    messages.push({
      role,
      content: sanitizeSurrogates(context.systemPrompt)
    });
  }
  let msgIndex = 0;
  for (const msg of transformedMessages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        messages.push({
          role: "user",
          content: [{ type: "input_text", text: sanitizeSurrogates(msg.content) }]
        });
      } else {
        const content = msg.content.map((item) => {
          if (item.type === "text") {
            return {
              type: "input_text",
              text: sanitizeSurrogates(item.text)
            };
          }
          return {
            type: "input_image",
            detail: "auto",
            image_url: `data:${item.mimeType};base64,${item.data}`
          };
        });
        if (content.length === 0)
          continue;
        messages.push({
          role: "user",
          content
        });
      }
    } else if (msg.role === "assistant") {
      const output = [];
      const assistantMsg = msg;
      const isDifferentModel = assistantMsg.model !== model.id && assistantMsg.provider === model.provider && assistantMsg.api === model.api;
      let textBlockIndex = 0;
      for (const block of msg.content) {
        if (block.type === "thinking") {
          if (block.thinkingSignature) {
            const reasoningItem = JSON.parse(block.thinkingSignature);
            output.push(reasoningItem);
          }
        } else if (block.type === "text") {
          const textBlock = block;
          const parsedSignature = parseTextSignature(textBlock.textSignature);
          const fallbackMessageId = textBlockIndex === 0 ? `msg_pi_${msgIndex}` : `msg_pi_${msgIndex}_${textBlockIndex}`;
          textBlockIndex++;
          let msgId = parsedSignature?.id;
          if (!msgId) {
            msgId = fallbackMessageId;
          } else if (msgId.length > 64) {
            msgId = `msg_${shortHash(msgId)}`;
          }
          output.push({
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: sanitizeSurrogates(textBlock.text), annotations: [] }],
            status: "completed",
            id: msgId,
            phase: parsedSignature?.phase
          });
        } else if (block.type === "toolCall") {
          const toolCall = block;
          const [callId, itemIdRaw] = toolCall.id.split("|");
          const customInputProperty = options?.grammarToolInputProperties?.get(toolCall.name);
          let itemId = itemIdRaw;
          if (isDifferentModel && itemId?.startsWith("fc_") || customInputProperty === void 0 && !itemId?.startsWith("fc_")) {
            itemId = void 0;
          }
          if (customInputProperty !== void 0) {
            output.push({
              type: "custom_tool_call",
              id: itemId,
              call_id: callId,
              name: toolCall.name,
              input: sanitizeSurrogates(getGrammarToolInput(toolCall.name, toolCall.arguments, customInputProperty))
            });
          } else {
            output.push({
              type: "function_call",
              id: itemId,
              call_id: callId,
              name: toolCall.name,
              arguments: JSON.stringify(toolCall.arguments)
            });
          }
        }
      }
      if (output.length === 0)
        continue;
      messages.push(...output);
    } else if (msg.role === "toolResult") {
      const [callId] = msg.toolCallId.split("|");
      const output = convertToolResultOutput(model, msg.content);
      if (options?.grammarToolInputProperties?.has(msg.toolName)) {
        messages.push({
          type: "custom_tool_call_output",
          call_id: callId,
          output
        });
      } else {
        messages.push({
          type: "function_call_output",
          call_id: callId,
          output
        });
      }
      const deferredTools = [];
      for (const name of msg.addedToolNames ?? []) {
        const tool = options?.deferredTools?.get(name);
        if (!tool || loadedToolNames.has(name))
          continue;
        loadedToolNames.add(name);
        deferredTools.push(tool);
      }
      if (deferredTools.length > 0) {
        const names = deferredTools.map((tool) => tool.name);
        const searchCallId = `pi_tool_load_${shortHash(`${msg.toolCallId}:${names.join(",")}`)}`;
        messages.push({
          type: "tool_search_call",
          call_id: searchCallId,
          execution: "client",
          status: "completed",
          arguments: { query: names.join(" "), limit: names.length }
        });
        messages.push({
          type: "tool_search_output",
          call_id: searchCallId,
          execution: "client",
          status: "completed",
          tools: convertResponsesTools(deferredTools, {
            ...options?.toolOptions,
            deferLoading: true
          })
        });
      }
    }
    msgIndex++;
  }
  return messages;
}
function convertResponsesTools(tools, options) {
  const defaultStrict = options?.strict === void 0 ? false : options.strict;
  const supportsStrictMode = options?.supportsStrictMode ?? true;
  const supportsOpenAIGrammarTools = options?.supportsOpenAIGrammarTools ?? false;
  return tools.map((tool) => {
    const grammar = resolveGrammarConstrainedSampling(tool, supportsOpenAIGrammarTools);
    if (grammar) {
      return {
        type: "custom",
        name: tool.name,
        description: tool.description,
        format: {
          type: "grammar",
          syntax: grammar.format,
          definition: grammar.definition
        },
        ...options?.deferLoading ? { defer_loading: true } : {}
      };
    }
    const constrainedStrict = resolveJsonSchemaStrictSampling(tool, supportsStrictMode);
    const functionTool = {
      type: "function",
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      // TypeBox already generates JSON Schema
      ...options?.deferLoading ? { defer_loading: true } : {}
    };
    if (supportsStrictMode) {
      functionTool.strict = constrainedStrict ?? defaultStrict;
    }
    return functionTool;
  });
}
function getCustomToolCallInput(block) {
  const property = block.customInput?.property;
  if (property === void 0)
    return "";
  const value = block.arguments[property];
  return typeof value === "string" ? value : "";
}
function appendCustomToolCallInput(block, nextInput, close) {
  const customInput = block.customInput;
  if (!customInput)
    return void 0;
  const delta = appendGrammarToolInputJsonDelta(customInput.jsonBuffer, customInput.property, nextInput, close);
  block.arguments = { [customInput.property]: nextInput };
  return delta;
}
async function processResponsesStream(openaiStream, output, stream10, model, options) {
  let sawTerminalResponseEvent = false;
  const outputSlots = /* @__PURE__ */ new Map();
  const reasoningBlocksById = /* @__PURE__ */ new Map();
  const getSlot = (outputIndex, type) => {
    const slot = outputSlots.get(outputIndex);
    return slot?.type === type ? slot : void 0;
  };
  const pushToolCallDelta = (slot, delta) => {
    if (delta === void 0)
      return;
    stream10.push({
      type: "toolcall_delta",
      contentIndex: slot.contentIndex,
      delta,
      partial: output
    });
  };
  const createSlot = (outputIndex, item) => {
    if (item.type === "reasoning") {
      const block = { type: "thinking", thinking: "" };
      output.content.push(block);
      const slot = {
        type: "thinking",
        block,
        contentIndex: output.content.length - 1
      };
      outputSlots.set(outputIndex, slot);
      stream10.push({ type: "thinking_start", contentIndex: slot.contentIndex, partial: output });
      return slot;
    }
    if (item.type === "message") {
      const block = { type: "text", text: "" };
      output.content.push(block);
      const slot = { type: "text", block, contentIndex: output.content.length - 1 };
      outputSlots.set(outputIndex, slot);
      stream10.push({ type: "text_start", contentIndex: slot.contentIndex, partial: output });
      return slot;
    }
    if (item.type === "function_call") {
      const block = {
        type: "toolCall",
        id: `${item.call_id}|${item.id}`,
        name: item.name,
        arguments: {},
        partialJson: item.arguments || ""
      };
      output.content.push(block);
      const slot = {
        type: "toolCall",
        block,
        contentIndex: output.content.length - 1
      };
      outputSlots.set(outputIndex, slot);
      stream10.push({ type: "toolcall_start", contentIndex: slot.contentIndex, partial: output });
      return slot;
    }
    if (item.type === "custom_tool_call") {
      const inputProperty = options?.grammarToolInputProperties?.get(item.name) ?? "input";
      const input = item.input || "";
      const block = {
        type: "toolCall",
        id: `${item.call_id}|${item.id}`,
        name: item.name,
        arguments: { [inputProperty]: input },
        customInput: {
          property: inputProperty,
          jsonBuffer: { input: "", started: false, closed: false }
        }
      };
      output.content.push(block);
      const slot = {
        type: "toolCall",
        block,
        contentIndex: output.content.length - 1
      };
      outputSlots.set(outputIndex, slot);
      stream10.push({ type: "toolcall_start", contentIndex: slot.contentIndex, partial: output });
      return slot;
    }
    return void 0;
  };
  const getOrCreateSlot = (outputIndex, item) => {
    return outputSlots.get(outputIndex) ?? createSlot(outputIndex, item);
  };
  const backfillReasoningSignatures = (responseOutput) => {
    for (const item of responseOutput) {
      if (item.type !== "reasoning" || !item.encrypted_content)
        continue;
      const block = reasoningBlocksById.get(item.id);
      if (!block?.thinkingSignature)
        continue;
      const storedItem = JSON.parse(block.thinkingSignature);
      if (storedItem.encrypted_content)
        continue;
      block.thinkingSignature = JSON.stringify({
        ...storedItem,
        encrypted_content: item.encrypted_content
      });
    }
  };
  const finalizeResponse = (response) => {
    sawTerminalResponseEvent = true;
    backfillReasoningSignatures(response.output ?? []);
    if (response?.id) {
      output.responseId = response.id;
    }
    if (response?.usage) {
      const inputDetails = response.usage.input_tokens_details;
      const cachedTokens = inputDetails?.cached_tokens || 0;
      const cacheWriteTokens = inputDetails?.cache_write_tokens || 0;
      output.usage = {
        // OpenAI includes cached and cache-write tokens in input_tokens, so subtract both.
        input: Math.max(0, (response.usage.input_tokens || 0) - cachedTokens - cacheWriteTokens),
        output: response.usage.output_tokens || 0,
        cacheRead: cachedTokens,
        cacheWrite: cacheWriteTokens,
        reasoning: response.usage.output_tokens_details?.reasoning_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
      };
    }
    calculateCost(model, output.usage);
    if (options?.applyServiceTierPricing) {
      const serviceTier = options.resolveServiceTier ? options.resolveServiceTier(response?.service_tier, options.serviceTier) : response?.service_tier ?? options.serviceTier;
      options.applyServiceTierPricing(output.usage, serviceTier);
    }
    output.stopReason = mapStopReason3(response?.status);
    if (output.content.some((b) => b.type === "toolCall") && output.stopReason === "stop") {
      output.stopReason = "toolUse";
    }
  };
  for await (const event of openaiStream) {
    if (event.type === "response.created") {
      output.responseId = event.response.id;
    } else if (event.type === "response.output_item.added") {
      createSlot(event.output_index, event.item);
    } else if (event.type === "response.reasoning_summary_text.delta") {
      const slot = getSlot(event.output_index, "thinking");
      if (!slot)
        continue;
      slot.block.thinking += event.delta;
      stream10.push({
        type: "thinking_delta",
        contentIndex: slot.contentIndex,
        delta: event.delta,
        partial: output
      });
    } else if (event.type === "response.reasoning_summary_part.done") {
      const slot = getSlot(event.output_index, "thinking");
      if (!slot)
        continue;
      slot.block.thinking += "\n\n";
      stream10.push({
        type: "thinking_delta",
        contentIndex: slot.contentIndex,
        delta: "\n\n",
        partial: output
      });
    } else if (event.type === "response.reasoning_text.delta") {
      const slot = getSlot(event.output_index, "thinking");
      if (!slot)
        continue;
      slot.block.thinking += event.delta;
      stream10.push({
        type: "thinking_delta",
        contentIndex: slot.contentIndex,
        delta: event.delta,
        partial: output
      });
    } else if (event.type === "response.output_text.delta") {
      const slot = getSlot(event.output_index, "text");
      if (!slot)
        continue;
      slot.block.text += event.delta;
      stream10.push({
        type: "text_delta",
        contentIndex: slot.contentIndex,
        delta: event.delta,
        partial: output
      });
    } else if (event.type === "response.refusal.delta") {
      const slot = getSlot(event.output_index, "text");
      if (!slot)
        continue;
      slot.block.text += event.delta;
      stream10.push({
        type: "text_delta",
        contentIndex: slot.contentIndex,
        delta: event.delta,
        partial: output
      });
    } else if (event.type === "response.function_call_arguments.delta") {
      const slot = getSlot(event.output_index, "toolCall");
      if (!slot || slot.block.partialJson === void 0)
        continue;
      slot.block.partialJson += event.delta;
      slot.block.arguments = parseStreamingJson(slot.block.partialJson);
      pushToolCallDelta(slot, event.delta);
    } else if (event.type === "response.function_call_arguments.done") {
      const slot = getSlot(event.output_index, "toolCall");
      if (!slot || slot.block.partialJson === void 0)
        continue;
      const previousPartialJson = slot.block.partialJson;
      slot.block.partialJson = event.arguments;
      slot.block.arguments = parseStreamingJson(slot.block.partialJson);
      if (event.arguments.startsWith(previousPartialJson)) {
        const delta = event.arguments.slice(previousPartialJson.length);
        if (delta.length > 0)
          pushToolCallDelta(slot, delta);
      }
    } else if (event.type === "response.custom_tool_call_input.delta") {
      const slot = getSlot(event.output_index, "toolCall");
      if (!slot || !slot.block.customInput)
        continue;
      pushToolCallDelta(slot, appendCustomToolCallInput(slot.block, getCustomToolCallInput(slot.block) + event.delta, false));
    } else if (event.type === "response.custom_tool_call_input.done") {
      const slot = getSlot(event.output_index, "toolCall");
      if (!slot || !slot.block.customInput)
        continue;
      pushToolCallDelta(slot, appendCustomToolCallInput(slot.block, event.input, true));
    } else if (event.type === "response.output_item.done") {
      const item = event.item;
      const slot = getOrCreateSlot(event.output_index, item);
      if (item.type === "reasoning" && slot?.type === "thinking") {
        const summaryText = item.summary?.map((s) => s.text).join("\n\n") || "";
        const contentText = item.content?.map((c) => c.text).join("\n\n") || "";
        slot.block.thinking = summaryText || contentText || slot.block.thinking;
        slot.block.thinkingSignature = JSON.stringify(item);
        reasoningBlocksById.set(item.id, slot.block);
        stream10.push({
          type: "thinking_end",
          contentIndex: slot.contentIndex,
          content: slot.block.thinking,
          partial: output
        });
        outputSlots.delete(event.output_index);
      } else if (item.type === "message" && slot?.type === "text") {
        slot.block.text = item.content?.map((c) => c.type === "output_text" ? c.text : c.refusal).join("") || "";
        slot.block.textSignature = encodeTextSignatureV1(item.id, item.phase ?? void 0);
        stream10.push({
          type: "text_end",
          contentIndex: slot.contentIndex,
          content: slot.block.text,
          partial: output
        });
        outputSlots.delete(event.output_index);
      } else if (item.type === "function_call" && slot?.type === "toolCall" && slot.block.partialJson !== void 0) {
        slot.block.arguments = parseStreamingJson(item.arguments || slot.block.partialJson || "{}");
        delete slot.block.partialJson;
        stream10.push({
          type: "toolcall_end",
          contentIndex: slot.contentIndex,
          toolCall: slot.block,
          partial: output
        });
        outputSlots.delete(event.output_index);
      } else if (item.type === "custom_tool_call" && slot?.type === "toolCall" && slot.block.customInput) {
        pushToolCallDelta(slot, appendCustomToolCallInput(slot.block, item.input ?? getCustomToolCallInput(slot.block), true));
        delete slot.block.customInput;
        stream10.push({
          type: "toolcall_end",
          contentIndex: slot.contentIndex,
          toolCall: slot.block,
          partial: output
        });
        outputSlots.delete(event.output_index);
      }
    } else if (event.type === "response.completed" || event.type === "response.incomplete") {
      finalizeResponse(event.response);
    } else if (event.type === "error") {
      throw new Error(`Error Code ${event.code}: ${event.message}` || "Unknown error");
    } else if (event.type === "response.failed") {
      sawTerminalResponseEvent = true;
      const error = event.response?.error;
      const details = event.response?.incomplete_details;
      const msg = error ? `${error.code || "unknown"}: ${error.message || "no message"}` : details?.reason ? `incomplete: ${details.reason}` : "Unknown error (no error details in response)";
      throw new Error(msg);
    }
  }
  if (!sawTerminalResponseEvent) {
    throw new Error("OpenAI Responses stream ended before a terminal response event");
  }
}
function mapStopReason3(status) {
  if (!status)
    return "stop";
  switch (status) {
    case "completed":
      return "stop";
    case "incomplete":
      return "length";
    case "failed":
    case "cancelled":
      return "error";
    // These two are wonky ...
    case "in_progress":
    case "queued":
      return "stop";
    default: {
      const _exhaustive = status;
      throw new Error(`Unhandled stop reason: ${_exhaustive}`);
    }
  }
}
var init_openai_responses_shared = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-responses-shared.js"() {
    init_models();
    init_hash();
    init_json_parse();
    init_sanitize_unicode();
    init_constrained_sampling();
    init_transform_messages();
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/azure-openai-responses.js
var azure_openai_responses_exports = {};
__export(azure_openai_responses_exports, {
  stream: () => stream3,
  streamSimple: () => streamSimple3
});
import { AzureOpenAI } from "openai";
function parseDeploymentNameMap(value) {
  const map = /* @__PURE__ */ new Map();
  if (!value)
    return map;
  for (const entry of value.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed)
      continue;
    const [modelId, deploymentName] = trimmed.split("=", 2);
    if (!modelId || !deploymentName)
      continue;
    map.set(modelId.trim(), deploymentName.trim());
  }
  return map;
}
function resolveDeploymentName(model, options) {
  if (options?.azureDeploymentName) {
    return options.azureDeploymentName;
  }
  const mappedDeployment = parseDeploymentNameMap(getProviderEnvValue("AZURE_OPENAI_DEPLOYMENT_NAME_MAP", options?.env)).get(model.id);
  return mappedDeployment || model.id;
}
function formatAzureOpenAIError(error) {
  return formatProviderError(normalizeProviderError(error), "Azure OpenAI API error");
}
function normalizeAzureBaseUrl(baseUrl) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`Invalid Azure OpenAI base URL: ${baseUrl}`);
  }
  const isAzureHost = url.hostname.endsWith(".openai.azure.com") || url.hostname.endsWith(".cognitiveservices.azure.com") || url.hostname.endsWith(".ai.azure.com");
  const normalizedPath = url.pathname.replace(/\/+$/, "");
  if (isAzureHost && (normalizedPath === "" || normalizedPath === "/" || normalizedPath === "/openai" || normalizedPath === "/openai/v1/responses")) {
    url.pathname = "/openai/v1";
    url.search = "";
  }
  return url.toString().replace(/\/+$/, "");
}
function buildDefaultBaseUrl(resourceName) {
  return `https://${resourceName}.openai.azure.com/openai/v1`;
}
function resolveAzureConfig(model, options) {
  const apiVersion = options?.azureApiVersion || getProviderEnvValue("AZURE_OPENAI_API_VERSION", options?.env) || DEFAULT_AZURE_API_VERSION;
  const baseUrl = options?.azureBaseUrl?.trim() || getProviderEnvValue("AZURE_OPENAI_BASE_URL", options?.env)?.trim() || void 0;
  const resourceName = options?.azureResourceName || getProviderEnvValue("AZURE_OPENAI_RESOURCE_NAME", options?.env);
  let resolvedBaseUrl = baseUrl;
  if (!resolvedBaseUrl && resourceName) {
    resolvedBaseUrl = buildDefaultBaseUrl(resourceName);
  }
  if (!resolvedBaseUrl && model.baseUrl) {
    resolvedBaseUrl = model.baseUrl;
  }
  if (!resolvedBaseUrl) {
    throw new Error("Azure OpenAI base URL is required. Set AZURE_OPENAI_BASE_URL or AZURE_OPENAI_RESOURCE_NAME, or pass azureBaseUrl, azureResourceName, or model.baseUrl.");
  }
  return {
    baseUrl: normalizeAzureBaseUrl(resolvedBaseUrl),
    apiVersion
  };
}
function createClient3(model, apiKey, options) {
  const headers = { ...model.headers };
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  const { baseUrl, apiVersion } = resolveAzureConfig(model, options);
  return new AzureOpenAI({
    apiKey,
    apiVersion,
    dangerouslyAllowBrowser: true,
    defaultHeaders: headers,
    baseURL: baseUrl
  });
}
function buildParams3(model, context, options, deploymentName, grammarToolInputProperties = createGrammarToolInputProperties(context.tools, model.compat?.supportsOpenAIGrammarTools ?? false)) {
  const messages = convertResponsesMessages(model, context, AZURE_TOOL_CALL_PROVIDERS, {
    grammarToolInputProperties
  });
  const params = {
    model: deploymentName,
    input: messages,
    stream: true,
    prompt_cache_key: clampOpenAIPromptCacheKey(options?.sessionId),
    store: false
  };
  if (options?.maxTokens) {
    params.max_output_tokens = Math.max(options.maxTokens, OPENAI_RESPONSES_MIN_OUTPUT_TOKENS);
  }
  if (options?.temperature !== void 0) {
    params.temperature = options?.temperature;
  }
  if (context.tools && context.tools.length > 0) {
    params.tools = convertResponsesTools(context.tools, {
      supportsStrictMode: model.compat?.supportsStrictMode ?? true,
      supportsOpenAIGrammarTools: model.compat?.supportsOpenAIGrammarTools ?? false
    });
  }
  if (model.reasoning) {
    if (options?.reasoningEffort || options?.reasoningSummary) {
      const effort = options?.reasoningEffort ? model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort : "medium";
      params.reasoning = {
        effort,
        summary: options?.reasoningSummary || "auto"
      };
      params.include = ["reasoning.encrypted_content"];
    } else if (model.thinkingLevelMap?.off !== null) {
      params.reasoning = {
        effort: model.thinkingLevelMap?.off ?? "none"
      };
    }
  }
  return params;
}
var DEFAULT_AZURE_API_VERSION, AZURE_TOOL_CALL_PROVIDERS, OPENAI_RESPONSES_MIN_OUTPUT_TOKENS, stream3, streamSimple3;
var init_azure_openai_responses = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/azure-openai-responses.js"() {
    init_models();
    init_error_body();
    init_event_stream();
    init_headers();
    init_provider_env();
    init_provider_retry();
    init_constrained_sampling();
    init_openai_prompt_cache();
    init_openai_responses_shared();
    init_simple_options();
    DEFAULT_AZURE_API_VERSION = "v1";
    AZURE_TOOL_CALL_PROVIDERS = /* @__PURE__ */ new Set(["openai", "openai-codex", "opencode", "azure-openai-responses"]);
    OPENAI_RESPONSES_MIN_OUTPUT_TOKENS = 16;
    stream3 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const deploymentName = resolveDeploymentName(model, options);
        const output = {
          role: "assistant",
          content: [],
          api: "azure-openai-responses",
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = options?.apiKey;
          if (!apiKey) {
            throw new Error(`No API key for provider: ${model.provider}`);
          }
          const client = createClient3(model, apiKey, options);
          const grammarToolInputProperties = createGrammarToolInputProperties(context.tools, model.compat?.supportsOpenAIGrammarTools ?? false);
          let params = buildParams3(model, context, options, deploymentName, grammarToolInputProperties);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const requestOptions = {
            ...options?.signal ? { signal: options.signal } : {},
            ...options?.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {},
            maxRetries: 0
          };
          const { data: openaiStream, response } = await retryProviderRequest(() => client.responses.create(params, requestOptions).withResponse(), {
            maxRetries: options?.maxRetries,
            maxRetryDelayMs: options?.maxRetryDelayMs,
            signal: options?.signal
          });
          await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
          stream10.push({ type: "start", partial: output });
          await processResponsesStream(openaiStream, output, stream10, model, { grammarToolInputProperties });
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error("An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.index;
            delete block.partialJson;
            delete block.customInput;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatAzureOpenAIError(error);
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple3 = (model, context, options) => {
      const apiKey = options?.apiKey;
      if (!apiKey) {
        throw new Error(`No API key for provider: ${model.provider}`);
      }
      const base = buildBaseOptions(model, context, options, apiKey);
      const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : void 0;
      const reasoningEffort = clampedReasoning === "off" ? void 0 : clampedReasoning;
      return stream3(model, context, {
        ...base,
        reasoningEffort
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-responses.js
var openai_responses_exports = {};
__export(openai_responses_exports, {
  stream: () => stream4,
  streamSimple: () => streamSimple4
});
import OpenAI2 from "openai";
function hasHeader3(headers, name) {
  if (!headers)
    return false;
  const expected = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === expected && value !== null && value.trim().length > 0)
      return true;
  }
  return false;
}
function getClientApiKey2(provider, apiKey, headers) {
  if (apiKey)
    return apiKey;
  if (hasHeader3(headers, "authorization") || hasHeader3(headers, "cf-aig-authorization"))
    return "unused";
  throw new Error(`No API key for provider: ${provider}`);
}
function detectSessionAffinityFormat(model) {
  return model.provider === "openrouter" || model.baseUrl.includes("openrouter.ai") ? "openrouter" : "openai";
}
function resolveCacheRetention3(cacheRetention, env) {
  if (cacheRetention) {
    return cacheRetention;
  }
  if (getProviderEnvValue("PI_CACHE_RETENTION", env) === "long") {
    return "long";
  }
  return "short";
}
function getCompat2(model) {
  return {
    supportsDeveloperRole: model.compat?.supportsDeveloperRole ?? true,
    sessionAffinityFormat: model.compat?.sessionAffinityFormat ?? detectSessionAffinityFormat(model),
    supportsLongCacheRetention: model.compat?.supportsLongCacheRetention ?? true,
    supportsStrictMode: model.compat?.supportsStrictMode ?? false,
    supportsOpenAIGrammarTools: model.compat?.supportsOpenAIGrammarTools ?? false,
    supportsToolSearch: model.compat?.supportsToolSearch ?? false,
    supportsExplicitPromptCacheMode: model.compat?.supportsExplicitPromptCacheMode ?? false
  };
}
function getPromptCacheRetention(compat, cacheRetention) {
  return cacheRetention === "long" && compat.supportsLongCacheRetention ? "24h" : void 0;
}
function formatOpenAIResponsesError(error) {
  return formatProviderError(normalizeProviderError(error), "OpenAI API error");
}
function createClient4(model, context, apiKey, optionsHeaders, sessionId) {
  const compat = getCompat2(model);
  const headers = { ...model.headers };
  if (model.provider === "github-copilot") {
    const hasImages = hasCopilotVisionInput(context.messages);
    const copilotHeaders = buildCopilotDynamicHeaders({
      messages: context.messages,
      hasImages
    });
    Object.assign(headers, copilotHeaders);
  }
  if (sessionId) {
    if (compat.sessionAffinityFormat === "openrouter") {
      headers["x-session-id"] = sessionId;
    } else {
      if (compat.sessionAffinityFormat === "openai") {
        headers.session_id = sessionId;
      }
      headers["x-client-request-id"] = sessionId;
    }
  }
  if (optionsHeaders) {
    Object.assign(headers, optionsHeaders);
  }
  return new OpenAI2({
    apiKey,
    baseURL: model.baseUrl,
    dangerouslyAllowBrowser: true,
    defaultHeaders: headers
  });
}
function buildParams4(model, context, options, compat = getCompat2(model), grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools)) {
  const toolPlacement = splitDeferredTools(context, compat.supportsToolSearch);
  const messages = convertResponsesMessages(model, context, OPENAI_TOOL_CALL_PROVIDERS, {
    grammarToolInputProperties,
    deferredTools: toolPlacement.deferred,
    toolOptions: {
      supportsStrictMode: compat.supportsStrictMode,
      supportsOpenAIGrammarTools: compat.supportsOpenAIGrammarTools
    }
  });
  const cacheRetention = resolveCacheRetention3(options?.cacheRetention, options?.env);
  const disableImplicitPromptCache = cacheRetention === "none" && compat.supportsExplicitPromptCacheMode;
  const params = {
    model: model.id,
    input: messages,
    stream: true,
    prompt_cache_key: cacheRetention === "none" ? void 0 : clampOpenAIPromptCacheKey(options?.sessionId),
    prompt_cache_retention: getPromptCacheRetention(compat, cacheRetention),
    prompt_cache_options: disableImplicitPromptCache ? { mode: "explicit" } : void 0,
    store: false
  };
  if (options?.maxTokens) {
    params.max_output_tokens = Math.max(options.maxTokens, OPENAI_RESPONSES_MIN_OUTPUT_TOKENS2);
  }
  if (options?.temperature !== void 0) {
    params.temperature = options?.temperature;
  }
  if (options?.serviceTier !== void 0) {
    params.service_tier = options.serviceTier;
  }
  if (toolPlacement.immediate.length > 0) {
    params.tools = convertResponsesTools(toolPlacement.immediate, {
      supportsStrictMode: compat.supportsStrictMode,
      supportsOpenAIGrammarTools: compat.supportsOpenAIGrammarTools
    });
  }
  if (options?.toolChoice !== void 0) {
    params.tool_choice = options.toolChoice;
  }
  if (model.reasoning) {
    if (options?.reasoningEffort || options?.reasoningSummary) {
      const effort = options?.reasoningEffort ? model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort : "medium";
      params.reasoning = {
        effort,
        summary: options?.reasoningSummary || "auto"
      };
      params.include = ["reasoning.encrypted_content"];
    } else if (model.provider !== "github-copilot" && model.thinkingLevelMap?.off !== null) {
      params.reasoning = {
        effort: model.thinkingLevelMap?.off ?? "none"
      };
    }
    if (model.provider === "xai")
      params.include = ["reasoning.encrypted_content"];
  }
  return params;
}
function getServiceTierCostMultiplier(model, serviceTier) {
  switch (serviceTier) {
    case "flex":
      return 0.5;
    case "priority":
      return model.id === "gpt-5.5" ? 2.5 : 2;
    default:
      return 1;
  }
}
function applyServiceTierPricing(usage, serviceTier, model) {
  const multiplier = getServiceTierCostMultiplier(model, serviceTier);
  if (multiplier === 1)
    return;
  usage.cost.input *= multiplier;
  usage.cost.output *= multiplier;
  usage.cost.cacheRead *= multiplier;
  usage.cost.cacheWrite *= multiplier;
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
}
var OPENAI_TOOL_CALL_PROVIDERS, OPENAI_RESPONSES_MIN_OUTPUT_TOKENS2, stream4, streamSimple4;
var init_openai_responses = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-responses.js"() {
    init_models();
    init_deferred_tools();
    init_error_body();
    init_event_stream();
    init_headers();
    init_provider_env();
    init_provider_retry();
    init_constrained_sampling();
    init_github_copilot_headers();
    init_openai_prompt_cache();
    init_openai_responses_shared();
    init_simple_options();
    OPENAI_TOOL_CALL_PROVIDERS = /* @__PURE__ */ new Set(["openai", "openai-codex", "opencode"]);
    OPENAI_RESPONSES_MIN_OUTPUT_TOKENS2 = 16;
    stream4 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = getClientApiKey2(model.provider, options?.apiKey, options?.headers);
          const cacheRetention = resolveCacheRetention3(options?.cacheRetention, options?.env);
          const cacheSessionId = cacheRetention === "none" ? void 0 : options?.sessionId;
          const compat = getCompat2(model);
          const grammarToolInputProperties = createGrammarToolInputProperties(context.tools, compat.supportsOpenAIGrammarTools);
          const client = createClient4(model, context, apiKey, options?.headers, cacheSessionId);
          let params = buildParams4(model, context, options, compat, grammarToolInputProperties);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const requestOptions = {
            ...options?.signal ? { signal: options.signal } : {},
            ...options?.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {},
            maxRetries: 0
          };
          const { data: openaiStream, response } = await retryProviderRequest(() => client.responses.create(params, requestOptions).withResponse(), {
            maxRetries: options?.maxRetries,
            maxRetryDelayMs: options?.maxRetryDelayMs,
            signal: options?.signal
          });
          await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
          stream10.push({ type: "start", partial: output });
          await processResponsesStream(openaiStream, output, stream10, model, {
            serviceTier: options?.serviceTier,
            grammarToolInputProperties,
            applyServiceTierPricing: (usage, serviceTier) => applyServiceTierPricing(usage, serviceTier, model)
          });
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error("An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.index;
            delete block.partialJson;
            delete block.customInput;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatOpenAIResponsesError(error);
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple4 = (model, context, options) => {
      getClientApiKey2(model.provider, options?.apiKey, options?.headers);
      const base = buildBaseOptions(model, context, options, options?.apiKey);
      const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : void 0;
      const reasoningEffort = clampedReasoning === "off" ? void 0 : clampedReasoning;
      return stream4(model, context, {
        ...base,
        reasoningEffort
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-shared.js
import { FinishReason, FunctionCallingConfigMode } from "@google/genai";
function isThinkingPart(part) {
  return part.thought === true;
}
function retainThoughtSignature(existing, incoming) {
  if (typeof incoming === "string" && incoming.length > 0)
    return incoming;
  return existing;
}
function isValidThoughtSignature(signature) {
  if (!signature)
    return false;
  if (signature.length % 4 !== 0)
    return false;
  return base64SignaturePattern.test(signature);
}
function resolveThoughtSignature(isSameProviderAndModel, signature) {
  return isSameProviderAndModel && isValidThoughtSignature(signature) ? signature : void 0;
}
function requiresToolCallId(modelId) {
  return modelId.startsWith("claude-") || modelId.startsWith("gpt-oss-");
}
function getGeminiMajorVersion(modelId) {
  const match = modelId.toLowerCase().match(/^gemini(?:-live)?-(\d+)/);
  if (!match)
    return void 0;
  return Number.parseInt(match[1], 10);
}
function supportsMultimodalFunctionResponse(modelId) {
  const geminiMajorVersion = getGeminiMajorVersion(modelId);
  if (geminiMajorVersion !== void 0) {
    return geminiMajorVersion >= 3;
  }
  return true;
}
function convertMessages3(model, context) {
  const contents = [];
  const normalizeToolCallId2 = (id) => {
    if (!requiresToolCallId(model.id))
      return id;
    return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  };
  const transformedMessages = transformMessages(context.messages, model, normalizeToolCallId2);
  for (const msg of transformedMessages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        contents.push({
          role: "user",
          parts: [{ text: sanitizeSurrogates(msg.content) }]
        });
      } else {
        const parts = msg.content.map((item) => {
          if (item.type === "text") {
            return { text: sanitizeSurrogates(item.text) };
          } else {
            return {
              inlineData: {
                mimeType: item.mimeType,
                data: item.data
              }
            };
          }
        });
        if (parts.length === 0)
          continue;
        contents.push({
          role: "user",
          parts
        });
      }
    } else if (msg.role === "assistant") {
      const parts = [];
      const isSameProviderAndModel = msg.provider === model.provider && msg.model === model.id;
      for (const block of msg.content) {
        if (block.type === "text") {
          if (!block.text || block.text.trim() === "")
            continue;
          const thoughtSignature = resolveThoughtSignature(isSameProviderAndModel, block.textSignature);
          parts.push({
            text: sanitizeSurrogates(block.text),
            ...thoughtSignature && { thoughtSignature }
          });
        } else if (block.type === "thinking") {
          if (!block.thinking || block.thinking.trim() === "")
            continue;
          if (isSameProviderAndModel) {
            const thoughtSignature = resolveThoughtSignature(isSameProviderAndModel, block.thinkingSignature);
            parts.push({
              thought: true,
              text: sanitizeSurrogates(block.thinking),
              ...thoughtSignature && { thoughtSignature }
            });
          } else {
            parts.push({
              text: sanitizeSurrogates(block.thinking)
            });
          }
        } else if (block.type === "toolCall") {
          const thoughtSignature = resolveThoughtSignature(isSameProviderAndModel, block.thoughtSignature);
          const part = {
            functionCall: {
              name: block.name,
              args: block.arguments ?? {},
              ...requiresToolCallId(model.id) ? { id: block.id } : {}
            },
            ...thoughtSignature && { thoughtSignature }
          };
          parts.push(part);
        }
      }
      if (parts.length === 0)
        continue;
      contents.push({
        role: "model",
        parts
      });
    } else if (msg.role === "toolResult") {
      const textContent = msg.content.filter((c) => c.type === "text");
      const textResult = textContent.map((c) => c.text).join("\n");
      const imageContent = model.input.includes("image") ? msg.content.filter((c) => c.type === "image") : [];
      const hasText = textResult.length > 0;
      const hasImages = imageContent.length > 0;
      const modelSupportsMultimodalFunctionResponse = supportsMultimodalFunctionResponse(model.id);
      const responseValue = hasText ? sanitizeSurrogates(textResult) : hasImages ? "(see attached image)" : "";
      const imageParts = imageContent.map((imageBlock) => ({
        inlineData: {
          mimeType: imageBlock.mimeType,
          data: imageBlock.data
        }
      }));
      const includeId = requiresToolCallId(model.id);
      const functionResponsePart = {
        functionResponse: {
          name: msg.toolName,
          response: msg.isError ? { error: responseValue } : { output: responseValue },
          ...hasImages && modelSupportsMultimodalFunctionResponse && { parts: imageParts },
          ...includeId ? { id: msg.toolCallId } : {}
        }
      };
      const lastContent = contents[contents.length - 1];
      if (lastContent?.role === "user" && lastContent.parts?.some((p) => p.functionResponse)) {
        lastContent.parts.push(functionResponsePart);
      } else {
        contents.push({
          role: "user",
          parts: [functionResponsePart]
        });
      }
      if (hasImages && !modelSupportsMultimodalFunctionResponse) {
        contents.push({
          role: "user",
          parts: [{ text: "Tool result image:" }, ...imageParts]
        });
      }
    }
  }
  return contents;
}
function sanitizeForOpenApi(schema) {
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    return schema;
  }
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    if (JSON_SCHEMA_META_DECLARATIONS.has(key))
      continue;
    result[key] = sanitizeForOpenApi(value);
  }
  return result;
}
function convertTools3(tools, useParameters = false) {
  if (tools.length === 0)
    return void 0;
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        ...useParameters ? { parameters: sanitizeForOpenApi(tool.parameters) } : { parametersJsonSchema: tool.parameters }
      }))
    }
  ];
}
function supportsGoogleStrictToolSampling(modelId) {
  const majorVersion = getGeminiMajorVersion(modelId);
  return majorVersion !== void 0 && majorVersion >= 3;
}
function mapToolChoice(choice) {
  switch (choice) {
    case "auto":
      return FunctionCallingConfigMode.AUTO;
    case "none":
      return FunctionCallingConfigMode.NONE;
    case "any":
      return FunctionCallingConfigMode.ANY;
    default:
      return FunctionCallingConfigMode.AUTO;
  }
}
function resolveGoogleFunctionCallingMode(tools, toolChoice, supportsStrictMode) {
  const useStrictMode = tools.some((tool) => resolveJsonSchemaStrictSampling(tool, supportsStrictMode) === true);
  if (toolChoice === "none" || toolChoice === "any") {
    return mapToolChoice(toolChoice);
  }
  if (useStrictMode) {
    return FunctionCallingConfigMode.VALIDATED;
  }
  return toolChoice ? mapToolChoice(toolChoice) : void 0;
}
function mapStopReason4(reason) {
  switch (reason) {
    case FinishReason.STOP:
      return "stop";
    case FinishReason.MAX_TOKENS:
      return "length";
    case FinishReason.BLOCKLIST:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.SPII:
    case FinishReason.SAFETY:
    case FinishReason.IMAGE_SAFETY:
    case FinishReason.IMAGE_PROHIBITED_CONTENT:
    case FinishReason.IMAGE_RECITATION:
    case FinishReason.IMAGE_OTHER:
    case FinishReason.RECITATION:
    case FinishReason.FINISH_REASON_UNSPECIFIED:
    case FinishReason.OTHER:
    case FinishReason.LANGUAGE:
    case FinishReason.MALFORMED_FUNCTION_CALL:
    case FinishReason.UNEXPECTED_TOOL_CALL:
    case FinishReason.NO_IMAGE:
      return "error";
    default: {
      const _exhaustive = reason;
      throw new Error(`Unhandled stop reason: ${_exhaustive}`);
    }
  }
}
var base64SignaturePattern, JSON_SCHEMA_META_DECLARATIONS;
var init_google_shared = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-shared.js"() {
    init_sanitize_unicode();
    init_constrained_sampling();
    init_transform_messages();
    base64SignaturePattern = /^[A-Za-z0-9+/]+={0,2}$/;
    JSON_SCHEMA_META_DECLARATIONS = /* @__PURE__ */ new Set([
      "$schema",
      "$id",
      "$anchor",
      "$dynamicAnchor",
      "$vocabulary",
      "$comment",
      "$defs",
      "definitions"
      // pre-draft-2019-09 equivalent of $defs
    ]);
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-generative-ai.js
var google_generative_ai_exports = {};
__export(google_generative_ai_exports, {
  stream: () => stream5,
  streamSimple: () => streamSimple5
});
import { GoogleGenAI } from "@google/genai";
function createClient5(model, apiKey, optionsHeaders) {
  const httpOptions = {};
  if (model.baseUrl) {
    httpOptions.baseUrl = model.baseUrl;
    httpOptions.apiVersion = "";
  }
  const headers = providerHeadersToRecord({ ...model.headers, ...optionsHeaders });
  if (headers) {
    httpOptions.headers = headers;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: Object.keys(httpOptions).length > 0 ? httpOptions : void 0
  });
}
function buildParams5(model, context, options = {}) {
  const contents = convertMessages3(model, context);
  const generationConfig = {};
  if (options.temperature !== void 0) {
    generationConfig.temperature = options.temperature;
  }
  if (options.maxTokens !== void 0) {
    generationConfig.maxOutputTokens = options.maxTokens;
  }
  const functionCallingMode = context.tools?.length ? resolveGoogleFunctionCallingMode(context.tools, options.toolChoice, supportsGoogleStrictToolSampling(model.id)) : void 0;
  const config = {
    ...Object.keys(generationConfig).length > 0 && generationConfig,
    ...context.systemPrompt && { systemInstruction: sanitizeSurrogates(context.systemPrompt) },
    ...context.tools && context.tools.length > 0 && { tools: convertTools3(context.tools) },
    ...functionCallingMode !== void 0 && {
      toolConfig: { functionCallingConfig: { mode: functionCallingMode } }
    }
  };
  if (options.thinking?.enabled && model.reasoning) {
    const thinkingConfig = { includeThoughts: true };
    if (options.thinking.level !== void 0) {
      thinkingConfig.thinkingLevel = options.thinking.level;
    } else if (options.thinking.budgetTokens !== void 0) {
      thinkingConfig.thinkingBudget = options.thinking.budgetTokens;
    }
    config.thinkingConfig = thinkingConfig;
  } else if (model.reasoning && options.thinking && !options.thinking.enabled) {
    config.thinkingConfig = getDisabledThinkingConfig(model);
  }
  if (options.signal) {
    if (options.signal.aborted) {
      throw new Error("Request aborted");
    }
    config.abortSignal = options.signal;
  }
  const params = {
    model: model.id,
    contents,
    config
  };
  return params;
}
function isGemma4Model(model) {
  return /gemma-?4/.test(model.id.toLowerCase());
}
function isGemini3ProModel(model) {
  return /gemini-3(?:\.\d+)?-pro/.test(model.id.toLowerCase());
}
function isGemini3FlashModel(model) {
  const id = model.id.toLowerCase();
  return /gemini-3(?:\.\d+)?-flash/.test(id) || id === "gemini-flash-latest" || id === "gemini-flash-lite-latest";
}
function getDisabledThinkingConfig(model) {
  if (isGemini3ProModel(model)) {
    return { thinkingLevel: "LOW" };
  }
  if (isGemini3FlashModel(model)) {
    return { thinkingLevel: "MINIMAL" };
  }
  if (isGemma4Model(model)) {
    return { thinkingLevel: "MINIMAL" };
  }
  return { thinkingBudget: 0 };
}
function getThinkingLevel(effort, model) {
  if (isGemini3ProModel(model)) {
    switch (effort) {
      case "minimal":
      case "low":
        return "LOW";
      case "medium":
      case "high":
        return "HIGH";
    }
  }
  if (isGemma4Model(model)) {
    switch (effort) {
      case "minimal":
      case "low":
        return "MINIMAL";
      case "medium":
      case "high":
        return "HIGH";
    }
  }
  switch (effort) {
    case "minimal":
      return "MINIMAL";
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
  }
}
function getGoogleBudget(model, effort, customBudgets) {
  if (customBudgets?.[effort] !== void 0) {
    return customBudgets[effort];
  }
  if (model.id.includes("2.5-pro")) {
    const budgets = {
      minimal: 128,
      low: 2048,
      medium: 8192,
      high: 32768
    };
    return budgets[effort];
  }
  if (model.id.includes("2.5-flash-lite")) {
    const budgets = {
      minimal: 512,
      low: 2048,
      medium: 8192,
      high: 24576
    };
    return budgets[effort];
  }
  if (model.id.includes("2.5-flash")) {
    const budgets = {
      minimal: 128,
      low: 2048,
      medium: 8192,
      high: 24576
    };
    return budgets[effort];
  }
  return -1;
}
var toolCallCounter, stream5, streamSimple5;
var init_google_generative_ai = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-generative-ai.js"() {
    init_models();
    init_error_body();
    init_event_stream();
    init_headers();
    init_sanitize_unicode();
    init_google_shared();
    init_simple_options();
    toolCallCounter = 0;
    stream5 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: "google-generative-ai",
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = options?.apiKey;
          if (!apiKey) {
            throw new Error(`No API key for provider: ${model.provider}`);
          }
          const client = createClient5(model, apiKey, options?.headers);
          let params = buildParams5(model, context, options);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const googleStream = await client.models.generateContentStream(params);
          stream10.push({ type: "start", partial: output });
          let currentBlock = null;
          const blocks = output.content;
          const blockIndex = () => blocks.length - 1;
          for await (const chunk of googleStream) {
            output.responseId ||= chunk.responseId;
            const candidate = chunk.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text !== void 0) {
                  const isThinking = isThinkingPart(part);
                  if (!currentBlock || isThinking && currentBlock.type !== "thinking" || !isThinking && currentBlock.type !== "text") {
                    if (currentBlock) {
                      if (currentBlock.type === "text") {
                        stream10.push({
                          type: "text_end",
                          contentIndex: blocks.length - 1,
                          content: currentBlock.text,
                          partial: output
                        });
                      } else {
                        stream10.push({
                          type: "thinking_end",
                          contentIndex: blockIndex(),
                          content: currentBlock.thinking,
                          partial: output
                        });
                      }
                    }
                    if (isThinking) {
                      currentBlock = { type: "thinking", thinking: "", thinkingSignature: void 0 };
                      output.content.push(currentBlock);
                      stream10.push({ type: "thinking_start", contentIndex: blockIndex(), partial: output });
                    } else {
                      currentBlock = { type: "text", text: "" };
                      output.content.push(currentBlock);
                      stream10.push({ type: "text_start", contentIndex: blockIndex(), partial: output });
                    }
                  }
                  if (currentBlock.type === "thinking") {
                    currentBlock.thinking += part.text;
                    currentBlock.thinkingSignature = retainThoughtSignature(currentBlock.thinkingSignature, part.thoughtSignature);
                    stream10.push({
                      type: "thinking_delta",
                      contentIndex: blockIndex(),
                      delta: part.text,
                      partial: output
                    });
                  } else {
                    currentBlock.text += part.text;
                    currentBlock.textSignature = retainThoughtSignature(currentBlock.textSignature, part.thoughtSignature);
                    stream10.push({
                      type: "text_delta",
                      contentIndex: blockIndex(),
                      delta: part.text,
                      partial: output
                    });
                  }
                }
                if (part.functionCall) {
                  if (currentBlock) {
                    if (currentBlock.type === "text") {
                      stream10.push({
                        type: "text_end",
                        contentIndex: blockIndex(),
                        content: currentBlock.text,
                        partial: output
                      });
                    } else {
                      stream10.push({
                        type: "thinking_end",
                        contentIndex: blockIndex(),
                        content: currentBlock.thinking,
                        partial: output
                      });
                    }
                    currentBlock = null;
                  }
                  const providedId = part.functionCall.id;
                  const needsNewId = !providedId || output.content.some((b) => b.type === "toolCall" && b.id === providedId);
                  const toolCallId = needsNewId ? `${part.functionCall.name}_${Date.now()}_${++toolCallCounter}` : providedId;
                  const toolCall = {
                    type: "toolCall",
                    id: toolCallId,
                    name: part.functionCall.name || "",
                    arguments: part.functionCall.args ?? {},
                    ...part.thoughtSignature && { thoughtSignature: part.thoughtSignature }
                  };
                  output.content.push(toolCall);
                  stream10.push({ type: "toolcall_start", contentIndex: blockIndex(), partial: output });
                  stream10.push({
                    type: "toolcall_delta",
                    contentIndex: blockIndex(),
                    delta: JSON.stringify(toolCall.arguments),
                    partial: output
                  });
                  stream10.push({ type: "toolcall_end", contentIndex: blockIndex(), toolCall, partial: output });
                }
              }
            }
            if (candidate?.finishReason) {
              output.stopReason = mapStopReason4(candidate.finishReason);
              if (output.content.some((b) => b.type === "toolCall")) {
                output.stopReason = "toolUse";
              }
            }
            if (chunk.usageMetadata) {
              output.usage = {
                input: (chunk.usageMetadata.promptTokenCount || 0) - (chunk.usageMetadata.cachedContentTokenCount || 0),
                output: (chunk.usageMetadata.candidatesTokenCount || 0) + (chunk.usageMetadata.thoughtsTokenCount || 0),
                cacheRead: chunk.usageMetadata.cachedContentTokenCount || 0,
                cacheWrite: 0,
                reasoning: chunk.usageMetadata.thoughtsTokenCount || 0,
                totalTokens: chunk.usageMetadata.totalTokenCount || 0,
                cost: {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                  total: 0
                }
              };
              calculateCost(model, output.usage);
            }
          }
          if (currentBlock) {
            if (currentBlock.type === "text") {
              stream10.push({
                type: "text_end",
                contentIndex: blockIndex(),
                content: currentBlock.text,
                partial: output
              });
            } else {
              stream10.push({
                type: "thinking_end",
                contentIndex: blockIndex(),
                content: currentBlock.thinking,
                partial: output
              });
            }
          }
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error("An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            if ("index" in block) {
              delete block.index;
            }
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatProviderError(normalizeProviderError(error));
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple5 = (model, context, options) => {
      const apiKey = options?.apiKey;
      if (!apiKey) {
        throw new Error(`No API key for provider: ${model.provider}`);
      }
      const base = buildBaseOptions(model, context, options, apiKey);
      if (!options?.reasoning) {
        return stream5(model, context, { ...base, thinking: { enabled: false } });
      }
      const clampedReasoning = clampThinkingLevel(model, options.reasoning);
      const effort = clampedReasoning === "off" ? "high" : clampedReasoning;
      const googleModel = model;
      if (isGemini3ProModel(googleModel) || isGemini3FlashModel(googleModel) || isGemma4Model(googleModel)) {
        return stream5(model, context, {
          ...base,
          thinking: {
            enabled: true,
            level: getThinkingLevel(effort, googleModel)
          }
        });
      }
      return stream5(model, context, {
        ...base,
        thinking: {
          enabled: true,
          budgetTokens: getGoogleBudget(googleModel, effort, options.thinkingBudgets)
        }
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-vertex.js
var google_vertex_exports = {};
__export(google_vertex_exports, {
  stream: () => stream6,
  streamSimple: () => streamSimple6
});
import { GoogleGenAI as GoogleGenAI2, ResourceScope, ThinkingLevel } from "@google/genai";
function createClient6(model, project, location, optionsHeaders, env) {
  const googleAuthOptions = buildGoogleAuthOptions(env);
  return new GoogleGenAI2({
    vertexai: true,
    project,
    location,
    apiVersion: API_VERSION,
    ...googleAuthOptions ? { googleAuthOptions } : {},
    httpOptions: buildHttpOptions(model, optionsHeaders)
  });
}
function createClientWithApiKey(model, apiKey, optionsHeaders) {
  return new GoogleGenAI2({
    vertexai: true,
    apiKey,
    apiVersion: API_VERSION,
    httpOptions: buildHttpOptions(model, optionsHeaders)
  });
}
function buildHttpOptions(model, optionsHeaders) {
  const httpOptions = {};
  const baseUrl = resolveCustomBaseUrl(model.baseUrl);
  if (baseUrl) {
    httpOptions.baseUrl = baseUrl;
    httpOptions.baseUrlResourceScope = ResourceScope.COLLECTION;
    if (baseUrlIncludesApiVersion(baseUrl)) {
      httpOptions.apiVersion = "";
    }
  }
  const headers = providerHeadersToRecord({ ...model.headers, ...optionsHeaders });
  if (headers) {
    httpOptions.headers = headers;
  }
  return Object.keys(httpOptions).length > 0 ? httpOptions : void 0;
}
function resolveCustomBaseUrl(baseUrl) {
  const trimmed = baseUrl.trim();
  if (!trimmed || trimmed.includes("{location}")) {
    return void 0;
  }
  return trimmed;
}
function baseUrlIncludesApiVersion(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return url.pathname.split("/").some((part) => /^v\d+(?:beta\d*)?$/.test(part));
  } catch {
    return /(?:^|\/)v\d+(?:beta\d*)?(?:\/|$)/.test(baseUrl);
  }
}
function buildGoogleAuthOptions(env) {
  const keyFilename = getProviderEnvValue("GOOGLE_APPLICATION_CREDENTIALS", env);
  return keyFilename ? { keyFilename } : void 0;
}
function resolveApiKey2(options) {
  const apiKey = options?.apiKey?.trim();
  if (!apiKey || apiKey === GCP_VERTEX_CREDENTIALS_MARKER || isPlaceholderApiKey(apiKey)) {
    return void 0;
  }
  return apiKey;
}
function isPlaceholderApiKey(apiKey) {
  return /^<[^>]+>$/.test(apiKey);
}
function resolveProject(options) {
  const project = options?.project || getProviderEnvValue("GOOGLE_CLOUD_PROJECT", options?.env) || getProviderEnvValue("GCLOUD_PROJECT", options?.env);
  if (!project) {
    throw new Error("Vertex AI requires a project ID. Set GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT or pass project in options.");
  }
  return project;
}
function resolveLocation(options) {
  const location = options?.location || getProviderEnvValue("GOOGLE_CLOUD_LOCATION", options?.env);
  if (!location) {
    throw new Error("Vertex AI requires a location. Set GOOGLE_CLOUD_LOCATION or pass location in options.");
  }
  return location;
}
function buildParams6(model, context, options = {}) {
  const contents = convertMessages3(model, context);
  const generationConfig = {};
  if (options.temperature !== void 0) {
    generationConfig.temperature = options.temperature;
  }
  if (options.maxTokens !== void 0) {
    generationConfig.maxOutputTokens = options.maxTokens;
  }
  const functionCallingMode = context.tools?.length ? resolveGoogleFunctionCallingMode(context.tools, options.toolChoice, supportsGoogleStrictToolSampling(model.id)) : void 0;
  const config = {
    ...Object.keys(generationConfig).length > 0 && generationConfig,
    ...context.systemPrompt && { systemInstruction: sanitizeSurrogates(context.systemPrompt) },
    ...context.tools && context.tools.length > 0 && { tools: convertTools3(context.tools) },
    ...functionCallingMode !== void 0 && {
      toolConfig: { functionCallingConfig: { mode: functionCallingMode } }
    }
  };
  if (options.thinking?.enabled && model.reasoning) {
    const thinkingConfig = { includeThoughts: true };
    if (options.thinking.level !== void 0) {
      thinkingConfig.thinkingLevel = THINKING_LEVEL_MAP[options.thinking.level];
    } else if (options.thinking.budgetTokens !== void 0) {
      thinkingConfig.thinkingBudget = options.thinking.budgetTokens;
    }
    config.thinkingConfig = thinkingConfig;
  } else if (model.reasoning && options.thinking && !options.thinking.enabled) {
    config.thinkingConfig = getDisabledThinkingConfig2(model);
  }
  if (options.signal) {
    if (options.signal.aborted) {
      throw new Error("Request aborted");
    }
    config.abortSignal = options.signal;
  }
  const params = {
    model: model.id,
    contents,
    config
  };
  return params;
}
function isGemini3ProModel2(model) {
  return /gemini-3(?:\.\d+)?-pro/.test(model.id.toLowerCase());
}
function isGemini3FlashModel2(model) {
  const id = model.id.toLowerCase();
  return /gemini-3(?:\.\d+)?-flash/.test(id) || id === "gemini-flash-latest" || id === "gemini-flash-lite-latest";
}
function getDisabledThinkingConfig2(model) {
  const geminiModel = model;
  if (isGemini3ProModel2(geminiModel)) {
    return { thinkingLevel: ThinkingLevel.LOW };
  }
  if (isGemini3FlashModel2(geminiModel)) {
    return { thinkingLevel: ThinkingLevel.MINIMAL };
  }
  return { thinkingBudget: 0 };
}
function getGemini3ThinkingLevel(effort, model) {
  if (isGemini3ProModel2(model)) {
    switch (effort) {
      case "minimal":
      case "low":
        return "LOW";
      case "medium":
      case "high":
        return "HIGH";
    }
  }
  switch (effort) {
    case "minimal":
      return "MINIMAL";
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
  }
}
function getGoogleBudget2(model, effort, customBudgets) {
  if (customBudgets?.[effort] !== void 0) {
    return customBudgets[effort];
  }
  if (model.id.includes("2.5-pro")) {
    const budgets = {
      minimal: 128,
      low: 2048,
      medium: 8192,
      high: 32768
    };
    return budgets[effort];
  }
  if (model.id.includes("2.5-flash")) {
    const budgets = {
      minimal: 128,
      low: 2048,
      medium: 8192,
      high: 24576
    };
    return budgets[effort];
  }
  return -1;
}
var API_VERSION, GCP_VERTEX_CREDENTIALS_MARKER, THINKING_LEVEL_MAP, toolCallCounter2, stream6, streamSimple6;
var init_google_vertex = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-vertex.js"() {
    init_models();
    init_error_body();
    init_event_stream();
    init_headers();
    init_provider_env();
    init_sanitize_unicode();
    init_google_shared();
    init_simple_options();
    API_VERSION = "v1";
    GCP_VERTEX_CREDENTIALS_MARKER = "gcp-vertex-credentials";
    THINKING_LEVEL_MAP = {
      THINKING_LEVEL_UNSPECIFIED: ThinkingLevel.THINKING_LEVEL_UNSPECIFIED,
      MINIMAL: ThinkingLevel.MINIMAL,
      LOW: ThinkingLevel.LOW,
      MEDIUM: ThinkingLevel.MEDIUM,
      HIGH: ThinkingLevel.HIGH
    };
    toolCallCounter2 = 0;
    stream6 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: "google-vertex",
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = resolveApiKey2(options);
          const client = apiKey ? createClientWithApiKey(model, apiKey, options?.headers) : createClient6(model, resolveProject(options), resolveLocation(options), options?.headers, options?.env);
          let params = buildParams6(model, context, options);
          const nextParams = await options?.onPayload?.(params, model);
          if (nextParams !== void 0) {
            params = nextParams;
          }
          const googleStream = await client.models.generateContentStream(params);
          stream10.push({ type: "start", partial: output });
          let currentBlock = null;
          const blocks = output.content;
          const blockIndex = () => blocks.length - 1;
          for await (const chunk of googleStream) {
            output.responseId ||= chunk.responseId;
            const candidate = chunk.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text !== void 0) {
                  const isThinking = isThinkingPart(part);
                  if (!currentBlock || isThinking && currentBlock.type !== "thinking" || !isThinking && currentBlock.type !== "text") {
                    if (currentBlock) {
                      if (currentBlock.type === "text") {
                        stream10.push({
                          type: "text_end",
                          contentIndex: blocks.length - 1,
                          content: currentBlock.text,
                          partial: output
                        });
                      } else {
                        stream10.push({
                          type: "thinking_end",
                          contentIndex: blockIndex(),
                          content: currentBlock.thinking,
                          partial: output
                        });
                      }
                    }
                    if (isThinking) {
                      currentBlock = { type: "thinking", thinking: "", thinkingSignature: void 0 };
                      output.content.push(currentBlock);
                      stream10.push({ type: "thinking_start", contentIndex: blockIndex(), partial: output });
                    } else {
                      currentBlock = { type: "text", text: "" };
                      output.content.push(currentBlock);
                      stream10.push({ type: "text_start", contentIndex: blockIndex(), partial: output });
                    }
                  }
                  if (currentBlock.type === "thinking") {
                    currentBlock.thinking += part.text;
                    currentBlock.thinkingSignature = retainThoughtSignature(currentBlock.thinkingSignature, part.thoughtSignature);
                    stream10.push({
                      type: "thinking_delta",
                      contentIndex: blockIndex(),
                      delta: part.text,
                      partial: output
                    });
                  } else {
                    currentBlock.text += part.text;
                    currentBlock.textSignature = retainThoughtSignature(currentBlock.textSignature, part.thoughtSignature);
                    stream10.push({
                      type: "text_delta",
                      contentIndex: blockIndex(),
                      delta: part.text,
                      partial: output
                    });
                  }
                }
                if (part.functionCall) {
                  if (currentBlock) {
                    if (currentBlock.type === "text") {
                      stream10.push({
                        type: "text_end",
                        contentIndex: blockIndex(),
                        content: currentBlock.text,
                        partial: output
                      });
                    } else {
                      stream10.push({
                        type: "thinking_end",
                        contentIndex: blockIndex(),
                        content: currentBlock.thinking,
                        partial: output
                      });
                    }
                    currentBlock = null;
                  }
                  const providedId = part.functionCall.id;
                  const needsNewId = !providedId || output.content.some((b) => b.type === "toolCall" && b.id === providedId);
                  const toolCallId = needsNewId ? `${part.functionCall.name}_${Date.now()}_${++toolCallCounter2}` : providedId;
                  const toolCall = {
                    type: "toolCall",
                    id: toolCallId,
                    name: part.functionCall.name || "",
                    arguments: part.functionCall.args ?? {},
                    ...part.thoughtSignature && { thoughtSignature: part.thoughtSignature }
                  };
                  output.content.push(toolCall);
                  stream10.push({ type: "toolcall_start", contentIndex: blockIndex(), partial: output });
                  stream10.push({
                    type: "toolcall_delta",
                    contentIndex: blockIndex(),
                    delta: JSON.stringify(toolCall.arguments),
                    partial: output
                  });
                  stream10.push({ type: "toolcall_end", contentIndex: blockIndex(), toolCall, partial: output });
                }
              }
            }
            if (candidate?.finishReason) {
              output.stopReason = mapStopReason4(candidate.finishReason);
              if (output.content.some((b) => b.type === "toolCall")) {
                output.stopReason = "toolUse";
              }
            }
            if (chunk.usageMetadata) {
              output.usage = {
                input: (chunk.usageMetadata.promptTokenCount || 0) - (chunk.usageMetadata.cachedContentTokenCount || 0),
                output: (chunk.usageMetadata.candidatesTokenCount || 0) + (chunk.usageMetadata.thoughtsTokenCount || 0),
                cacheRead: chunk.usageMetadata.cachedContentTokenCount || 0,
                cacheWrite: 0,
                reasoning: chunk.usageMetadata.thoughtsTokenCount || 0,
                totalTokens: chunk.usageMetadata.totalTokenCount || 0,
                cost: {
                  input: 0,
                  output: 0,
                  cacheRead: 0,
                  cacheWrite: 0,
                  total: 0
                }
              };
              calculateCost(model, output.usage);
            }
          }
          if (currentBlock) {
            if (currentBlock.type === "text") {
              stream10.push({
                type: "text_end",
                contentIndex: blockIndex(),
                content: currentBlock.text,
                partial: output
              });
            } else {
              stream10.push({
                type: "thinking_end",
                contentIndex: blockIndex(),
                content: currentBlock.thinking,
                partial: output
              });
            }
          }
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error("An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            if ("index" in block) {
              delete block.index;
            }
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatProviderError(normalizeProviderError(error));
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple6 = (model, context, options) => {
      const base = buildBaseOptions(model, context, options, void 0);
      if (!options?.reasoning) {
        return stream6(model, context, {
          ...base,
          thinking: { enabled: false }
        });
      }
      const clampedReasoning = clampThinkingLevel(model, options.reasoning);
      const effort = clampedReasoning === "off" ? "high" : clampedReasoning;
      const geminiModel = model;
      if (isGemini3ProModel2(geminiModel) || isGemini3FlashModel2(geminiModel)) {
        return stream6(model, context, {
          ...base,
          thinking: {
            enabled: true,
            level: getGemini3ThinkingLevel(effort, geminiModel)
          }
        });
      }
      return stream6(model, context, {
        ...base,
        thinking: {
          enabled: true,
          budgetTokens: getGoogleBudget2(geminiModel, effort, options.thinkingBudgets)
        }
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/mistral-conversations.js
var mistral_conversations_exports = {};
__export(mistral_conversations_exports, {
  stream: () => stream7,
  streamSimple: () => streamSimple7
});
import { Mistral } from "@mistralai/mistralai";
function createOutput(model) {
  return {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
    },
    stopReason: "stop",
    timestamp: Date.now()
  };
}
function createMistralToolCallIdNormalizer() {
  const idMap = /* @__PURE__ */ new Map();
  const reverseMap = /* @__PURE__ */ new Map();
  return (id) => {
    const existing = idMap.get(id);
    if (existing)
      return existing;
    let attempt = 0;
    while (true) {
      const candidate = deriveMistralToolCallId(id, attempt);
      const owner = reverseMap.get(candidate);
      if (!owner || owner === id) {
        idMap.set(id, candidate);
        reverseMap.set(candidate, id);
        return candidate;
      }
      attempt++;
    }
  };
}
function deriveMistralToolCallId(id, attempt) {
  const normalized = id.replace(/[^a-zA-Z0-9]/g, "");
  if (attempt === 0 && normalized.length === MISTRAL_TOOL_CALL_ID_LENGTH)
    return normalized;
  const seedBase = normalized || id;
  const seed = attempt === 0 ? seedBase : `${seedBase}:${attempt}`;
  return shortHash(seed).replace(/[^a-zA-Z0-9]/g, "").slice(0, MISTRAL_TOOL_CALL_ID_LENGTH);
}
function formatMistralError(error) {
  if (error instanceof Error) {
    const sdkError = error;
    const statusCode = typeof sdkError.statusCode === "number" ? sdkError.statusCode : void 0;
    const bodyText = typeof sdkError.body === "string" ? sdkError.body.trim() : void 0;
    if (statusCode !== void 0 && bodyText) {
      return `Mistral API error (${statusCode}): ${truncateErrorText2(bodyText, MAX_MISTRAL_ERROR_BODY_CHARS)}`;
    }
    if (statusCode !== void 0)
      return `Mistral API error (${statusCode}): ${error.message}`;
    return error.message;
  }
  return safeJsonStringify3(error);
}
function truncateErrorText2(text, maxChars) {
  if (text.length <= maxChars)
    return text;
  return `${text.slice(0, maxChars)}... [truncated ${text.length - maxChars} chars]`;
}
function safeJsonStringify3(value) {
  try {
    const serialized = JSON.stringify(value);
    return serialized === void 0 ? String(value) : serialized;
  } catch {
    return String(value);
  }
}
function buildRequestOptions(model, options) {
  const requestOptions = {
    retries: { strategy: "none" }
  };
  if (options?.signal)
    requestOptions.signal = options.signal;
  const headers = {};
  if (model.headers)
    Object.assign(headers, model.headers);
  if (options?.headers)
    Object.assign(headers, options.headers);
  if (shouldUsePromptCaching(options) && !headers["x-affinity"]) {
    headers["x-affinity"] = options.sessionId;
  }
  if (Object.keys(headers).length > 0) {
    requestOptions.headers = headers;
  }
  return requestOptions;
}
function buildChatPayload(model, context, messages, options) {
  const payload = {
    model: model.id,
    stream: true,
    messages: toChatMessages(messages, model.input.includes("image"))
  };
  if (context.tools?.length)
    payload.tools = toFunctionTools(context.tools);
  if (options?.temperature !== void 0)
    payload.temperature = options.temperature;
  if (options?.maxTokens !== void 0)
    payload.maxTokens = options.maxTokens;
  if (options?.toolChoice)
    payload.toolChoice = mapToolChoice2(options.toolChoice);
  if (options?.promptMode)
    payload.promptMode = options.promptMode;
  if (options?.reasoningEffort)
    payload.reasoningEffort = options.reasoningEffort;
  if (shouldUsePromptCaching(options))
    payload.promptCacheKey = options.sessionId;
  if (context.systemPrompt) {
    payload.messages.unshift({
      role: "system",
      content: sanitizeSurrogates(context.systemPrompt)
    });
  }
  return payload;
}
function shouldUsePromptCaching(options) {
  return options?.cacheRetention !== "none" && !!options?.sessionId;
}
function getMistralCachedPromptTokens(usage, promptTokens) {
  const rawUsage = usage;
  const rawCachedTokens = rawUsage.promptTokensDetails?.cachedTokens ?? rawUsage.prompt_tokens_details?.cached_tokens ?? rawUsage.promptTokenDetails?.cachedTokens ?? rawUsage.prompt_token_details?.cached_tokens ?? rawUsage.numCachedTokens ?? rawUsage.num_cached_tokens ?? 0;
  const cachedTokens = typeof rawCachedTokens === "number" && Number.isFinite(rawCachedTokens) ? rawCachedTokens : 0;
  return Math.min(promptTokens, Math.max(0, cachedTokens));
}
async function consumeChatStream(model, output, stream10, mistralStream) {
  let currentBlock = null;
  const blocks = output.content;
  const blockIndex = () => blocks.length - 1;
  const toolBlocksByKey = /* @__PURE__ */ new Map();
  const finishCurrentBlock = (block) => {
    if (!block)
      return;
    if (block.type === "text") {
      stream10.push({
        type: "text_end",
        contentIndex: blockIndex(),
        content: block.text,
        partial: output
      });
      return;
    }
    if (block.type === "thinking") {
      stream10.push({
        type: "thinking_end",
        contentIndex: blockIndex(),
        content: block.thinking,
        partial: output
      });
    }
  };
  for await (const event of mistralStream) {
    const chunk = event.data;
    output.responseId ||= chunk.id;
    if (chunk.usage) {
      const promptTokens = chunk.usage.promptTokens || 0;
      const cachedPromptTokens = getMistralCachedPromptTokens(chunk.usage, promptTokens);
      output.usage.input = Math.max(0, promptTokens - cachedPromptTokens);
      output.usage.output = chunk.usage.completionTokens || 0;
      output.usage.cacheRead = cachedPromptTokens;
      output.usage.cacheWrite = 0;
      output.usage.totalTokens = chunk.usage.totalTokens || output.usage.input + output.usage.output + output.usage.cacheRead + output.usage.cacheWrite;
      calculateCost(model, output.usage);
    }
    const choice = chunk.choices[0];
    if (!choice)
      continue;
    if (choice.finishReason) {
      output.stopReason = mapChatStopReason(choice.finishReason);
    }
    const delta = choice.delta;
    if (delta.content !== null && delta.content !== void 0) {
      const contentItems = typeof delta.content === "string" ? [delta.content] : delta.content;
      for (const item of contentItems) {
        if (typeof item === "string") {
          const textDelta = sanitizeSurrogates(item);
          if (!currentBlock || currentBlock.type !== "text") {
            finishCurrentBlock(currentBlock);
            currentBlock = { type: "text", text: "" };
            output.content.push(currentBlock);
            stream10.push({ type: "text_start", contentIndex: blockIndex(), partial: output });
          }
          currentBlock.text += textDelta;
          stream10.push({
            type: "text_delta",
            contentIndex: blockIndex(),
            delta: textDelta,
            partial: output
          });
          continue;
        }
        if (item.type === "thinking") {
          const deltaText = item.thinking.map((part) => "text" in part ? part.text : "").filter((text) => text.length > 0).join("");
          const thinkingDelta = sanitizeSurrogates(deltaText);
          if (!thinkingDelta)
            continue;
          if (!currentBlock || currentBlock.type !== "thinking") {
            finishCurrentBlock(currentBlock);
            currentBlock = { type: "thinking", thinking: "" };
            output.content.push(currentBlock);
            stream10.push({ type: "thinking_start", contentIndex: blockIndex(), partial: output });
          }
          currentBlock.thinking += thinkingDelta;
          stream10.push({
            type: "thinking_delta",
            contentIndex: blockIndex(),
            delta: thinkingDelta,
            partial: output
          });
          continue;
        }
        if (item.type === "text") {
          const textDelta = sanitizeSurrogates(item.text);
          if (!currentBlock || currentBlock.type !== "text") {
            finishCurrentBlock(currentBlock);
            currentBlock = { type: "text", text: "" };
            output.content.push(currentBlock);
            stream10.push({ type: "text_start", contentIndex: blockIndex(), partial: output });
          }
          currentBlock.text += textDelta;
          stream10.push({
            type: "text_delta",
            contentIndex: blockIndex(),
            delta: textDelta,
            partial: output
          });
        }
      }
    }
    const toolCalls = delta.toolCalls || [];
    for (const toolCall of toolCalls) {
      if (currentBlock) {
        finishCurrentBlock(currentBlock);
        currentBlock = null;
      }
      const callId = toolCall.id && toolCall.id !== "null" ? toolCall.id : deriveMistralToolCallId(`toolcall:${toolCall.index ?? 0}`, 0);
      const key = `${callId}:${toolCall.index || 0}`;
      const existingIndex = toolBlocksByKey.get(key);
      let block;
      if (existingIndex !== void 0) {
        const existing = output.content[existingIndex];
        if (existing?.type === "toolCall") {
          block = existing;
        }
      }
      if (!block) {
        block = {
          type: "toolCall",
          id: callId,
          name: toolCall.function.name,
          arguments: {},
          partialArgs: ""
        };
        output.content.push(block);
        toolBlocksByKey.set(key, output.content.length - 1);
        stream10.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });
      }
      const argsDelta = typeof toolCall.function.arguments === "string" ? toolCall.function.arguments : JSON.stringify(toolCall.function.arguments || {});
      block.partialArgs = (block.partialArgs || "") + argsDelta;
      block.arguments = parseStreamingJson(block.partialArgs);
      stream10.push({
        type: "toolcall_delta",
        contentIndex: toolBlocksByKey.get(key),
        delta: argsDelta,
        partial: output
      });
    }
  }
  finishCurrentBlock(currentBlock);
  for (const index of toolBlocksByKey.values()) {
    const block = output.content[index];
    if (block.type !== "toolCall")
      continue;
    const toolBlock = block;
    toolBlock.arguments = parseStreamingJson(toolBlock.partialArgs);
    delete toolBlock.partialArgs;
    stream10.push({
      type: "toolcall_end",
      contentIndex: index,
      toolCall: toolBlock,
      partial: output
    });
  }
}
function toFunctionTools(tools) {
  return tools.map((tool) => {
    const strict = resolveJsonSchemaStrictSampling(tool, true);
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: stripSymbolKeys(tool.parameters),
        strict: strict ?? false
      }
    };
  });
}
function stripSymbolKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripSymbolKeys(item));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = stripSymbolKeys(entry);
    }
    return result;
  }
  return value;
}
function toChatMessages(messages, supportsImages) {
  const result = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        result.push({ role: "user", content: sanitizeSurrogates(msg.content) });
        continue;
      }
      const hadImages = msg.content.some((item) => item.type === "image");
      const content = msg.content.filter((item) => item.type === "text" || supportsImages).map((item) => {
        if (item.type === "text")
          return { type: "text", text: sanitizeSurrogates(item.text) };
        return { type: "image_url", imageUrl: `data:${item.mimeType};base64,${item.data}` };
      });
      if (content.length > 0) {
        result.push({ role: "user", content });
        continue;
      }
      if (hadImages && !supportsImages) {
        result.push({ role: "user", content: "(image omitted: model does not support images)" });
      }
      continue;
    }
    if (msg.role === "assistant") {
      const contentParts = [];
      const toolCalls = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          if (block.text.trim().length > 0) {
            contentParts.push({ type: "text", text: sanitizeSurrogates(block.text) });
          }
          continue;
        }
        if (block.type === "thinking") {
          if (block.thinking.trim().length > 0) {
            contentParts.push({
              type: "thinking",
              thinking: [{ type: "text", text: sanitizeSurrogates(block.thinking) }]
            });
          }
          continue;
        }
        toolCalls.push({
          id: block.id,
          type: "function",
          function: { name: block.name, arguments: JSON.stringify(block.arguments || {}) }
        });
      }
      const assistantMessage = { role: "assistant" };
      if (contentParts.length > 0)
        assistantMessage.content = contentParts;
      if (toolCalls.length > 0)
        assistantMessage.toolCalls = toolCalls;
      if (contentParts.length > 0 || toolCalls.length > 0)
        result.push(assistantMessage);
      continue;
    }
    const toolContent = [];
    const textResult = msg.content.filter((part) => part.type === "text").map((part) => part.type === "text" ? sanitizeSurrogates(part.text) : "").join("\n");
    const hasImages = msg.content.some((part) => part.type === "image");
    const toolText = buildToolResultText(textResult, hasImages, supportsImages, msg.isError);
    toolContent.push({ type: "text", text: toolText });
    for (const part of msg.content) {
      if (!supportsImages)
        continue;
      if (part.type !== "image")
        continue;
      toolContent.push({
        type: "image_url",
        imageUrl: `data:${part.mimeType};base64,${part.data}`
      });
    }
    result.push({
      role: "tool",
      toolCallId: msg.toolCallId,
      name: msg.toolName,
      content: toolContent
    });
  }
  return result;
}
function buildToolResultText(text, hasImages, supportsImages, isError) {
  const trimmed = text.trim();
  const errorPrefix = isError ? "[tool error] " : "";
  if (trimmed.length > 0) {
    const imageSuffix = hasImages && !supportsImages ? "\n[tool image omitted: model does not support images]" : "";
    return `${errorPrefix}${trimmed}${imageSuffix}`;
  }
  if (hasImages) {
    if (supportsImages) {
      return isError ? "[tool error] (see attached image)" : "(see attached image)";
    }
    return isError ? "[tool error] (image omitted: model does not support images)" : "(image omitted: model does not support images)";
  }
  return isError ? "[tool error] (no tool output)" : "(no tool output)";
}
function usesReasoningEffort(model) {
  return model.id === "mistral-small-2603" || model.id === "mistral-small-latest" || model.id === "mistral-medium-3.5";
}
function usesPromptModeReasoning(model) {
  return model.reasoning && !usesReasoningEffort(model);
}
function mapReasoningEffort(model, level) {
  return model.thinkingLevelMap?.[level] ?? "high";
}
function mapToolChoice2(choice) {
  if (!choice)
    return void 0;
  if (choice === "auto" || choice === "none" || choice === "any" || choice === "required") {
    return choice;
  }
  return {
    type: "function",
    function: { name: choice.function.name }
  };
}
function mapChatStopReason(reason) {
  if (reason === null)
    return "stop";
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
    case "model_length":
      return "length";
    case "tool_calls":
      return "toolUse";
    case "error":
      return "error";
    default:
      return "stop";
  }
}
var MISTRAL_TOOL_CALL_ID_LENGTH, MAX_MISTRAL_ERROR_BODY_CHARS, stream7, streamSimple7;
var init_mistral_conversations = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/mistral-conversations.js"() {
    init_models();
    init_event_stream();
    init_hash();
    init_json_parse();
    init_sanitize_unicode();
    init_constrained_sampling();
    init_simple_options();
    init_transform_messages();
    MISTRAL_TOOL_CALL_ID_LENGTH = 9;
    MAX_MISTRAL_ERROR_BODY_CHARS = 4e3;
    stream7 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = createOutput(model);
        try {
          const apiKey = options?.apiKey;
          if (!apiKey) {
            throw new Error(`No API key for provider: ${model.provider}`);
          }
          const mistral = new Mistral({
            apiKey,
            serverURL: model.baseUrl
          });
          const normalizeMistralToolCallId = createMistralToolCallIdNormalizer();
          const transformedMessages = transformMessages(context.messages, model, (id) => normalizeMistralToolCallId(id));
          let payload = buildChatPayload(model, context, transformedMessages, options);
          const nextPayload = await options?.onPayload?.(payload, model);
          if (nextPayload !== void 0) {
            payload = nextPayload;
          }
          const mistralStream = await mistral.chat.stream(payload, buildRequestOptions(model, options));
          stream10.push({ type: "start", partial: output });
          await consumeChatStream(model, output, stream10, mistralStream);
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          if (output.stopReason === "aborted" || output.stopReason === "error") {
            throw new Error("An unknown error occurred");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.partialArgs;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatMistralError(error);
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple7 = (model, context, options) => {
      const apiKey = options?.apiKey;
      if (!apiKey) {
        throw new Error(`No API key for provider: ${model.provider}`);
      }
      const base = buildBaseOptions(model, context, options, apiKey);
      const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : void 0;
      const reasoning = clampedReasoning === "off" ? void 0 : clampedReasoning;
      const shouldUseReasoning = model.reasoning && reasoning !== void 0;
      return stream7(model, context, {
        ...base,
        promptMode: shouldUseReasoning && usesPromptModeReasoning(model) ? "reasoning" : void 0,
        reasoningEffort: shouldUseReasoning && usesReasoningEffort(model) ? mapReasoningEffort(model, reasoning) : void 0
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/session-resources.js
function registerSessionResourceCleanup(cleanup) {
  sessionResourceCleanups.add(cleanup);
  return () => {
    sessionResourceCleanups.delete(cleanup);
  };
}
var sessionResourceCleanups;
var init_session_resources = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/session-resources.js"() {
    sessionResourceCleanups = /* @__PURE__ */ new Set();
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/abort-signals.js
function combineAbortSignals(signals) {
  const activeSignals = signals.filter((signal) => signal !== void 0);
  if (activeSignals.length === 0) {
    return { cleanup: () => {
    } };
  }
  if (activeSignals.length === 1) {
    return { signal: activeSignals[0], cleanup: () => {
    } };
  }
  const controller = new AbortController();
  const listeners = [];
  const abort = (signal) => {
    if (!controller.signal.aborted) {
      controller.abort(signal.reason);
    }
  };
  for (const signal of activeSignals) {
    if (signal.aborted) {
      abort(signal);
      break;
    }
    const listener = () => abort(signal);
    signal.addEventListener("abort", listener, { once: true });
    listeners.push({ signal, listener });
  }
  return {
    signal: controller.signal,
    cleanup: () => {
      for (const { signal, listener } of listeners) {
        signal.removeEventListener("abort", listener);
      }
    }
  };
}
var init_abort_signals = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/abort-signals.js"() {
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/node-http-proxy.js
function getProxyEnv(key, env) {
  const lowercaseKey = key.toLowerCase();
  const uppercaseKey = key.toUpperCase();
  return env?.[lowercaseKey] || env?.[uppercaseKey] || getProviderEnvValue(lowercaseKey) || getProviderEnvValue(uppercaseKey) || "";
}
function parseProxyTargetUrl(targetUrl) {
  if (targetUrl instanceof URL) {
    return targetUrl;
  }
  try {
    return new URL(targetUrl);
  } catch {
    return void 0;
  }
}
function shouldProxyHostname(hostname, port, env) {
  const noProxy = getProxyEnv("no_proxy", env).toLowerCase();
  if (!noProxy) {
    return true;
  }
  if (noProxy === "*") {
    return false;
  }
  return noProxy.split(/[,\s]/).every((proxy) => {
    if (!proxy) {
      return true;
    }
    const parsedProxy = proxy.match(/^(.+):(\d+)$/);
    let proxyHostname = parsedProxy ? parsedProxy[1] : proxy;
    const proxyPort = parsedProxy ? Number.parseInt(parsedProxy[2], 10) : 0;
    if (proxyPort && proxyPort !== port) {
      return true;
    }
    if (!/^[.*]/.test(proxyHostname)) {
      return hostname !== proxyHostname;
    }
    if (proxyHostname.startsWith("*")) {
      proxyHostname = proxyHostname.slice(1);
    }
    return !hostname.endsWith(proxyHostname);
  });
}
function getProxyForUrl(targetUrl, env) {
  const parsedUrl = parseProxyTargetUrl(targetUrl);
  if (!parsedUrl?.protocol || !parsedUrl.host) {
    return "";
  }
  const protocol = parsedUrl.protocol.split(":", 1)[0];
  const hostname = parsedUrl.host.replace(/:\d*$/, "");
  const port = Number.parseInt(parsedUrl.port, 10) || DEFAULT_PROXY_PORTS[protocol] || 0;
  if (!shouldProxyHostname(hostname, port, env)) {
    return "";
  }
  let proxy = getProxyEnv(`${protocol}_proxy`, env) || getProxyEnv("all_proxy", env);
  if (proxy && !proxy.includes("://")) {
    proxy = `${protocol}://${proxy}`;
  }
  return proxy;
}
function resolveHttpProxyUrlForTarget(targetUrl, env) {
  const proxy = getProxyForUrl(targetUrl, env);
  if (!proxy) {
    return void 0;
  }
  let proxyUrl;
  try {
    proxyUrl = new URL(proxy);
  } catch (error) {
    throw new Error(`Invalid proxy URL ${JSON.stringify(proxy)}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (proxyUrl.protocol !== "http:" && proxyUrl.protocol !== "https:") {
    throw new Error(`${UNSUPPORTED_PROXY_PROTOCOL_MESSAGE} Got ${proxyUrl.protocol}`);
  }
  return proxyUrl;
}
var DEFAULT_PROXY_PORTS, UNSUPPORTED_PROXY_PROTOCOL_MESSAGE;
var init_node_http_proxy = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/node-http-proxy.js"() {
    init_provider_env();
    DEFAULT_PROXY_PORTS = {
      ftp: 21,
      gopher: 70,
      http: 80,
      https: 443,
      ws: 80,
      wss: 443
    };
    UNSUPPORTED_PROXY_PROTOCOL_MESSAGE = "Unsupported proxy protocol. SOCKS and PAC proxy URLs are not supported; use an HTTP or HTTPS proxy URL.";
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/uuid.js
function fillRandomBytes(bytes) {
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return;
  }
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
}
function uuidv7() {
  const random = new Uint8Array(16);
  fillRandomBytes(random);
  const timestamp = Date.now();
  if (timestamp > lastTimestamp) {
    sequence = random[6] * 16777216 + random[7] * 65536 + random[8] * 256 + random[9];
    lastTimestamp = timestamp;
  } else {
    sequence = sequence + 1 >>> 0;
    if (sequence === 0)
      lastTimestamp++;
  }
  const bytes = new Uint8Array(16);
  bytes[0] = lastTimestamp / 1099511627776 & 255;
  bytes[1] = lastTimestamp / 4294967296 & 255;
  bytes[2] = lastTimestamp / 16777216 & 255;
  bytes[3] = lastTimestamp / 65536 & 255;
  bytes[4] = lastTimestamp / 256 & 255;
  bytes[5] = lastTimestamp & 255;
  bytes[6] = 112 | sequence >>> 28 & 15;
  bytes[7] = sequence >>> 20 & 255;
  bytes[8] = 128 | sequence >>> 14 & 63;
  bytes[9] = sequence >>> 6 & 255;
  bytes[10] = (sequence & 63) << 2 | random[10] & 3;
  bytes[11] = random[11];
  bytes[12] = random[12];
  bytes[13] = random[13];
  bytes[14] = random[14];
  bytes[15] = random[15];
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
var lastTimestamp, sequence;
var init_uuid = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/uuid.js"() {
    lastTimestamp = -Infinity;
    sequence = 0;
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-codex-responses.js
var openai_codex_responses_exports = {};
__export(openai_codex_responses_exports, {
  closeOpenAICodexWebSocketSessions: () => closeOpenAICodexWebSocketSessions,
  getOpenAICodexWebSocketDebugStats: () => getOpenAICodexWebSocketDebugStats,
  resetOpenAICodexWebSocketDebugStats: () => resetOpenAICodexWebSocketDebugStats,
  stream: () => stream8,
  streamSimple: () => streamSimple8
});
function loadNodeOs() {
  if (typeof process === "undefined" || !(process.versions?.node || process.versions?.bun)) {
    return null;
  }
  return process.getBuiltinModule?.("node:os") ?? null;
}
function isTerminalRateLimitError(errorText) {
  return /GoUsageLimitError|FreeUsageLimitError|Monthly usage limit reached|available balance|insufficient_quota|out of budget|quota exceeded|billing/i.test(errorText);
}
function isRetryableError(status, errorText) {
  if (status === 429 && isTerminalRateLimitError(errorText)) {
    return false;
  }
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return /rate.?limit|overloaded|service.?unavailable|upstream.?connect|connection.?refused/i.test(errorText);
}
function getRetryAfterDelayMs(headers) {
  const retryAfterMs = headers.get("retry-after-ms");
  if (retryAfterMs !== null) {
    const millis = Number(retryAfterMs);
    if (Number.isFinite(millis)) {
      return Math.max(0, millis);
    }
  }
  const retryAfter = headers.get("retry-after");
  if (!retryAfter) {
    return void 0;
  }
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1e3);
  }
  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return void 0;
}
function validateRetryDelayMs(delayMs, options) {
  const maxRetryDelayMs = options?.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS2;
  if (maxRetryDelayMs > 0 && delayMs > maxRetryDelayMs) {
    throw new RetryDelayExceededError(`Server requested ${Math.ceil(delayMs / 1e3)}s retry delay (max: ${Math.ceil(maxRetryDelayMs / 1e3)}s)`);
  }
  return delayMs;
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Request was aborted"));
      return;
    }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("Request was aborted"));
    });
  });
}
function normalizeTimeoutMs(value) {
  if (value === void 0)
    return void 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid timeoutMs: ${String(value)}`);
  }
  return Math.floor(value);
}
function loadNodeZlib() {
  if (typeof process === "undefined" || !(process.versions?.node || process.versions?.bun)) {
    return null;
  }
  return process.getBuiltinModule?.("node:zlib") ?? null;
}
function compressRequestBodyZstd(bodyJson) {
  const zlib = loadNodeZlib();
  if (!zlib || typeof zlib.zstdCompressSync !== "function") {
    return null;
  }
  try {
    const compressed = zlib.zstdCompressSync(bodyJson, {
      params: { [zlib.constants.ZSTD_c_compressionLevel]: REQUEST_COMPRESSION_ZSTD_LEVEL }
    });
    return new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength);
  } catch {
    return null;
  }
}
function buildRequestBody(model, context, options, cacheSessionId, grammarToolInputProperties = createGrammarToolInputProperties(context.tools, model.compat?.supportsOpenAIGrammarTools ?? false)) {
  const supportsStrictMode = model.compat?.supportsStrictMode ?? true;
  const supportsOpenAIGrammarTools = model.compat?.supportsOpenAIGrammarTools ?? false;
  const toolPlacement = splitDeferredTools(context, model.compat?.supportsToolSearch ?? false);
  const messages = convertResponsesMessages(model, context, CODEX_TOOL_CALL_PROVIDERS, {
    includeSystemPrompt: false,
    grammarToolInputProperties,
    deferredTools: toolPlacement.deferred,
    toolOptions: {
      strict: null,
      supportsStrictMode,
      supportsOpenAIGrammarTools
    }
  });
  const body = {
    model: model.id,
    store: false,
    stream: true,
    instructions: context.systemPrompt || "You are a helpful assistant.",
    input: messages,
    text: { verbosity: options?.textVerbosity || "low" },
    include: ["reasoning.encrypted_content"],
    prompt_cache_key: cacheSessionId,
    tool_choice: options?.toolChoice ?? "auto",
    parallel_tool_calls: true
  };
  if (options?.temperature !== void 0) {
    body.temperature = options.temperature;
  }
  if (options?.serviceTier !== void 0) {
    body.service_tier = options.serviceTier;
  }
  if (toolPlacement.immediate.length > 0) {
    body.tools = convertResponsesTools(toolPlacement.immediate, {
      strict: null,
      supportsStrictMode,
      supportsOpenAIGrammarTools
    });
  }
  if (options?.reasoningEffort !== void 0) {
    const effort = options.reasoningEffort === "none" ? model.thinkingLevelMap?.off ?? "none" : model.thinkingLevelMap?.[options.reasoningEffort] ?? options.reasoningEffort;
    if (effort !== null) {
      body.reasoning = {
        effort,
        summary: options.reasoningSummary ?? "auto"
      };
    }
  }
  return body;
}
function getServiceTierCostMultiplier2(model, serviceTier) {
  switch (serviceTier) {
    case "flex":
      return 0.5;
    case "priority":
      return model.id === "gpt-5.5" ? 2.5 : 2;
    default:
      return 1;
  }
}
function applyServiceTierPricing2(usage, serviceTier, model) {
  const multiplier = getServiceTierCostMultiplier2(model, serviceTier);
  if (multiplier === 1)
    return;
  usage.cost.input *= multiplier;
  usage.cost.output *= multiplier;
  usage.cost.cacheRead *= multiplier;
  usage.cost.cacheWrite *= multiplier;
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
}
function resolveCodexServiceTier(responseServiceTier, requestServiceTier) {
  if (responseServiceTier === "default" && (requestServiceTier === "flex" || requestServiceTier === "priority")) {
    return requestServiceTier;
  }
  return responseServiceTier ?? requestServiceTier;
}
function resolveCodexUrl(baseUrl) {
  const raw = baseUrl && baseUrl.trim().length > 0 ? baseUrl : DEFAULT_CODEX_BASE_URL;
  const normalized = raw.replace(/\/+$/, "");
  if (normalized.endsWith("/codex/responses"))
    return normalized;
  if (normalized.endsWith("/codex"))
    return `${normalized}/responses`;
  return `${normalized}/codex/responses`;
}
function resolveCodexWebSocketUrl(baseUrl) {
  const url = new URL(resolveCodexUrl(baseUrl));
  if (url.protocol === "https:")
    url.protocol = "wss:";
  if (url.protocol === "http:")
    url.protocol = "ws:";
  return url.toString();
}
async function processStream(response, output, stream10, model, grammarToolInputProperties, options) {
  await processResponsesStream(mapCodexEvents(parseSSE(response, options?.signal)), output, stream10, model, {
    serviceTier: options?.serviceTier,
    grammarToolInputProperties,
    resolveServiceTier: resolveCodexServiceTier,
    applyServiceTierPricing: (usage, serviceTier) => applyServiceTierPricing2(usage, serviceTier, model)
  });
}
function isCodexNonTransportError(error) {
  return error instanceof CodexApiError || error instanceof CodexProtocolError;
}
function isWebSocketConnectionLimitReachedError(error) {
  return error instanceof CodexApiError && error.code === WEBSOCKET_CONNECTION_LIMIT_REACHED_CODE;
}
function isPreviousResponseNotFoundError(error) {
  return error instanceof CodexApiError && error.code === PREVIOUS_RESPONSE_NOT_FOUND_CODE;
}
function extractCodexEventError(event) {
  const nested = event.error && typeof event.error === "object" ? event.error : void 0;
  return {
    code: typeof event.code === "string" ? event.code : typeof nested?.code === "string" ? nested.code : void 0,
    message: typeof event.message === "string" ? event.message : typeof nested?.message === "string" ? nested.message : void 0
  };
}
async function* mapCodexEvents(events) {
  for await (const event of events) {
    const type = typeof event.type === "string" ? event.type : void 0;
    if (!type)
      continue;
    if (type === "error") {
      const { code, message } = extractCodexEventError(event);
      throw new CodexApiError(`Codex error: ${message || code || JSON.stringify(event)}`, {
        code,
        payload: event
      });
    }
    if (type === "response.failed") {
      const response = event.response;
      const code = response?.error?.code;
      const message = response?.error?.message;
      throw new CodexApiError(message || "Codex response failed", { code, payload: event });
    }
    if (type === "response.done" || type === "response.completed" || type === "response.incomplete") {
      const response = event.response;
      const normalizedResponse = response ? { ...response, status: normalizeCodexStatus(response.status) } : response;
      yield { ...event, type: "response.completed", response: normalizedResponse };
      return;
    }
    yield event;
  }
}
function normalizeCodexStatus(status) {
  if (typeof status !== "string")
    return void 0;
  return CODEX_RESPONSE_STATUSES.has(status) ? status : void 0;
}
async function* parseSSE(response, signal) {
  if (!response.body)
    return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const onAbort = () => {
    void reader.cancel().catch(() => {
    });
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error("Request was aborted");
      }
      const { done, value } = await reader.read();
      if (signal?.aborted) {
        throw new Error("Request was aborted");
      }
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf("\n\n");
      while (idx !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const dataLines = chunk.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
        if (dataLines.length > 0) {
          const data = dataLines.join("\n").trim();
          if (data && data !== "[DONE]") {
            try {
              yield JSON.parse(data);
            } catch (cause) {
              throw new CodexProtocolError(`Invalid Codex SSE JSON: ${formatThrownValue(cause)}`, {
                cause,
                payload: data
              });
            }
          }
        }
        idx = buffer.indexOf("\n\n");
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    try {
      await reader.cancel();
    } catch {
    }
    try {
      reader.releaseLock();
    } catch {
    }
  }
}
function getOrCreateWebSocketDebugStats(sessionId) {
  let stats = websocketDebugStats.get(sessionId);
  if (!stats) {
    stats = {
      requests: 0,
      connectionsCreated: 0,
      connectionsReused: 0,
      cachedContextRequests: 0,
      storeTrueRequests: 0,
      fullContextRequests: 0,
      deltaRequests: 0,
      lastInputItems: 0,
      websocketFailures: 0,
      sseFallbacks: 0
    };
    websocketDebugStats.set(sessionId, stats);
  }
  return stats;
}
function getOpenAICodexWebSocketDebugStats(sessionId) {
  const stats = websocketDebugStats.get(sessionId);
  return stats ? { ...stats } : void 0;
}
function resetOpenAICodexWebSocketDebugStats(sessionId) {
  if (sessionId) {
    websocketDebugStats.delete(sessionId);
    websocketSseFallbackSessions.delete(sessionId);
    return;
  }
  websocketDebugStats.clear();
  websocketSseFallbackSessions.clear();
}
function closeOpenAICodexWebSocketSessions(sessionId) {
  const closeEntry = (entry) => {
    if (entry.idleTimer)
      clearTimeout(entry.idleTimer);
    closeWebSocketSilently(entry.socket, 1e3, "debug_close");
  };
  if (sessionId) {
    const entry = websocketSessionCache.get(sessionId);
    if (entry)
      closeEntry(entry);
    websocketSessionCache.delete(sessionId);
    return;
  }
  for (const entry of websocketSessionCache.values()) {
    closeEntry(entry);
  }
  websocketSessionCache.clear();
}
function isWebSocketSseFallbackActive(sessionId) {
  return sessionId ? websocketSseFallbackSessions.has(sessionId) : false;
}
function recordWebSocketSseFallback(sessionId) {
  if (!sessionId)
    return;
  const stats = getOrCreateWebSocketDebugStats(sessionId);
  stats.sseFallbacks++;
  stats.websocketFallbackActive = isWebSocketSseFallbackActive(sessionId);
}
function recordWebSocketFailure(sessionId, error) {
  if (!sessionId)
    return;
  websocketSseFallbackSessions.add(sessionId);
  const stats = getOrCreateWebSocketDebugStats(sessionId);
  stats.websocketFailures++;
  stats.lastWebSocketError = formatThrownValue(error);
  stats.websocketFallbackActive = true;
}
async function getWebSocketConstructor(env) {
  if (!env && _cachedWebsocket)
    return _cachedWebsocket;
  if (typeof process !== "undefined" && process.versions?.bun) {
    const WebSocketWithProxy = class extends WebSocket {
      constructor(url, options) {
        let _opts = {};
        if (Array.isArray(options) || typeof options === "string") {
          _opts = { protocols: options };
        } else {
          _opts = { ...options };
        }
        const proxyUrl = resolveHttpProxyUrlForTarget(url.toString().replace(/^wss:/, "https:").replace(/^ws:/, "http:"), env);
        super(url, { ..._opts, ...proxyUrl ? { proxy: proxyUrl.toString() } : {} });
      }
    };
    if (!env) {
      _cachedWebsocket = WebSocketWithProxy;
    }
    return WebSocketWithProxy;
  }
  const ctor = globalThis.WebSocket;
  if (typeof ctor !== "function")
    return null;
  return ctor;
}
function getWebSocketReadyState(socket) {
  const readyState = socket.readyState;
  return typeof readyState === "number" ? readyState : void 0;
}
function isWebSocketReusable(socket) {
  const readyState = getWebSocketReadyState(socket);
  return readyState === void 0 || readyState === 1;
}
function isWebSocketSessionExpired(entry) {
  return Date.now() - entry.createdAt >= SESSION_WEBSOCKET_MAX_AGE_MS;
}
function closeWebSocketSilently(socket, code = 1e3, reason = "done") {
  try {
    socket.close(code, reason);
  } catch {
  }
}
function scheduleSessionWebSocketExpiry(sessionId, entry) {
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer);
  }
  entry.idleTimer = setTimeout(() => {
    if (entry.busy)
      return;
    closeWebSocketSilently(entry.socket, 1e3, "idle_timeout");
    websocketSessionCache.delete(sessionId);
  }, SESSION_WEBSOCKET_CACHE_TTL_MS);
}
async function connectWebSocket(url, headers, signal, connectTimeoutMs = DEFAULT_WEBSOCKET_CONNECT_TIMEOUT_MS, env) {
  const WebSocketCtor = await getWebSocketConstructor(env);
  if (!WebSocketCtor) {
    throw new Error("WebSocket transport is not available in this runtime");
  }
  const wsHeaders = headersToRecord(headers);
  delete wsHeaders["OpenAI-Beta"];
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout;
    let socket;
    try {
      socket = new WebSocketCtor(url, { headers: wsHeaders });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    const cleanup = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = void 0;
      }
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
      signal?.removeEventListener("abort", onAbort);
    };
    const fail = (error, closeReason) => {
      if (settled)
        return;
      settled = true;
      cleanup();
      if (closeReason) {
        closeWebSocketSilently(socket, 1e3, closeReason);
      }
      reject(error);
    };
    const onOpen = () => {
      if (settled)
        return;
      settled = true;
      cleanup();
      resolve(socket);
    };
    const onError = (event) => {
      fail(extractWebSocketError(event));
    };
    const onClose = (event) => {
      fail(extractWebSocketCloseError(event));
    };
    const onAbort = () => {
      fail(new Error("Request was aborted"), "aborted");
    };
    socket.addEventListener("open", onOpen);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);
    signal?.addEventListener("abort", onAbort);
    if (connectTimeoutMs > 0) {
      timeout = setTimeout(() => {
        fail(new Error(`WebSocket connect timeout after ${connectTimeoutMs}ms`), "connect_timeout");
      }, connectTimeoutMs);
    }
    if (signal?.aborted) {
      onAbort();
    }
  });
}
async function acquireWebSocket(url, headers, sessionId, signal, connectTimeoutMs, env) {
  if (!sessionId) {
    const socket2 = await connectWebSocket(url, headers, signal, connectTimeoutMs, env);
    return {
      socket: socket2,
      reused: false,
      release: () => closeWebSocketSilently(socket2)
    };
  }
  const cached = websocketSessionCache.get(sessionId);
  if (cached) {
    if (cached.idleTimer) {
      clearTimeout(cached.idleTimer);
      cached.idleTimer = void 0;
    }
    if (!cached.busy && isWebSocketSessionExpired(cached)) {
      closeWebSocketSilently(cached.socket, 1e3, "connection_age_limit");
      websocketSessionCache.delete(sessionId);
    } else if (!cached.busy && isWebSocketReusable(cached.socket)) {
      cached.busy = true;
      return {
        socket: cached.socket,
        entry: cached,
        reused: true,
        release: ({ keep } = {}) => {
          if (!keep || !isWebSocketReusable(cached.socket)) {
            closeWebSocketSilently(cached.socket);
            websocketSessionCache.delete(sessionId);
            return;
          }
          cached.busy = false;
          scheduleSessionWebSocketExpiry(sessionId, cached);
        }
      };
    }
    if (cached.busy) {
      const socket2 = await connectWebSocket(url, headers, signal, connectTimeoutMs, env);
      return {
        socket: socket2,
        reused: false,
        release: () => {
          closeWebSocketSilently(socket2);
        }
      };
    }
    if (!isWebSocketReusable(cached.socket)) {
      closeWebSocketSilently(cached.socket);
      websocketSessionCache.delete(sessionId);
    }
  }
  const socket = await connectWebSocket(url, headers, signal, connectTimeoutMs, env);
  const entry = { socket, busy: true, createdAt: Date.now() };
  websocketSessionCache.set(sessionId, entry);
  return {
    socket,
    entry,
    reused: false,
    release: ({ keep } = {}) => {
      if (!keep || !isWebSocketReusable(entry.socket)) {
        closeWebSocketSilently(entry.socket);
        if (entry.idleTimer)
          clearTimeout(entry.idleTimer);
        if (websocketSessionCache.get(sessionId) === entry) {
          websocketSessionCache.delete(sessionId);
        }
        return;
      }
      entry.busy = false;
      scheduleSessionWebSocketExpiry(sessionId, entry);
    }
  };
}
function extractWebSocketError(event) {
  if (event && typeof event === "object") {
    const message = "message" in event ? event.message : void 0;
    if (typeof message === "string" && message.length > 0) {
      return new Error(message);
    }
    const nestedError = "error" in event ? event.error : void 0;
    if (nestedError instanceof Error && nestedError.message.length > 0) {
      return nestedError;
    }
    if (nestedError && typeof nestedError === "object" && "message" in nestedError) {
      const nestedMessage = nestedError.message;
      if (typeof nestedMessage === "string" && nestedMessage.length > 0) {
        return new Error(nestedMessage);
      }
    }
  }
  return new Error("WebSocket error");
}
function extractWebSocketCloseError(event) {
  if (event && typeof event === "object") {
    const code = "code" in event ? event.code : void 0;
    const reason = "reason" in event ? event.reason : void 0;
    const wasClean = "wasClean" in event ? event.wasClean : void 0;
    const codeText = typeof code === "number" ? ` ${code}` : "";
    let reasonText = typeof reason === "string" && reason.length > 0 ? ` ${reason}` : "";
    if (!reasonText && code === WEBSOCKET_MESSAGE_TOO_BIG_CLOSE_CODE) {
      reasonText = " message too big";
    }
    return new WebSocketCloseError(`WebSocket closed${codeText}${reasonText}`.trim(), {
      code: typeof code === "number" ? code : void 0,
      reason: typeof reason === "string" && reason.length > 0 ? reason : void 0,
      wasClean: typeof wasClean === "boolean" ? wasClean : void 0
    });
  }
  return new Error("WebSocket closed");
}
async function decodeWebSocketData(data) {
  if (typeof data === "string")
    return data;
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(data));
  }
  if (ArrayBuffer.isView(data)) {
    const view = data;
    return new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  }
  if (data && typeof data === "object" && "arrayBuffer" in data) {
    const blobLike = data;
    const arrayBuffer = await blobLike.arrayBuffer();
    return new TextDecoder().decode(new Uint8Array(arrayBuffer));
  }
  return null;
}
async function* parseWebSocket(socket, signal, idleTimeoutMs) {
  const queue = [];
  let pending = null;
  let done = false;
  let failed = null;
  let sawCompletion = false;
  const wake = () => {
    if (!pending)
      return;
    const resolve = pending;
    pending = null;
    resolve();
  };
  const onMessage = (event) => {
    void (async () => {
      let text = null;
      try {
        if (!event || typeof event !== "object" || !("data" in event))
          return;
        text = await decodeWebSocketData(event.data);
        if (!text)
          return;
        const parsed = JSON.parse(text);
        const type = typeof parsed.type === "string" ? parsed.type : "";
        if (type === "response.completed" || type === "response.done" || type === "response.incomplete") {
          sawCompletion = true;
          done = true;
        }
        queue.push(parsed);
        wake();
      } catch (cause) {
        failed = new CodexProtocolError(`Invalid Codex WebSocket JSON: ${formatThrownValue(cause)}`, {
          cause,
          payload: text
        });
        done = true;
        wake();
      }
    })();
  };
  const onError = (event) => {
    failed = extractWebSocketError(event);
    done = true;
    wake();
  };
  const onClose = (event) => {
    if (sawCompletion) {
      done = true;
      wake();
      return;
    }
    if (!failed) {
      failed = extractWebSocketCloseError(event);
    }
    done = true;
    wake();
  };
  const onAbort = () => {
    failed = new Error("Request was aborted");
    done = true;
    wake();
  };
  socket.addEventListener("message", onMessage);
  socket.addEventListener("error", onError);
  socket.addEventListener("close", onClose);
  signal?.addEventListener("abort", onAbort);
  try {
    while (true) {
      if (signal?.aborted) {
        throw new Error("Request was aborted");
      }
      if (queue.length > 0) {
        yield queue.shift();
        continue;
      }
      if (done)
        break;
      let timeout;
      await new Promise((resolve, reject) => {
        pending = resolve;
        if (idleTimeoutMs !== void 0 && idleTimeoutMs > 0) {
          timeout = setTimeout(() => {
            const error = new Error(`WebSocket idle timeout after ${idleTimeoutMs}ms`);
            failed = error;
            done = true;
            pending = null;
            closeWebSocketSilently(socket, 1e3, "idle_timeout");
            reject(error);
          }, idleTimeoutMs);
        }
      }).finally(() => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    }
    if (failed) {
      throw failed;
    }
    if (!sawCompletion) {
      throw new Error("WebSocket stream closed before response.completed");
    }
  } finally {
    socket.removeEventListener("message", onMessage);
    socket.removeEventListener("error", onError);
    socket.removeEventListener("close", onClose);
    signal?.removeEventListener("abort", onAbort);
  }
}
function requestBodyWithoutInput(body) {
  const { input: _input, previous_response_id: _previousResponseId, ...rest } = body;
  return rest;
}
function responseInputsEqual(a, b) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}
function requestBodiesMatchExceptInput(a, b) {
  return JSON.stringify(requestBodyWithoutInput(a)) === JSON.stringify(requestBodyWithoutInput(b));
}
function getCachedWebSocketInputDelta(body, continuation) {
  if (!requestBodiesMatchExceptInput(body, continuation.lastRequestBody)) {
    return void 0;
  }
  const currentInput = body.input ?? [];
  const baseline = [...continuation.lastRequestBody.input ?? [], ...continuation.lastResponseItems];
  if (currentInput.length < baseline.length) {
    return void 0;
  }
  const prefix = currentInput.slice(0, baseline.length);
  if (!responseInputsEqual(prefix, baseline)) {
    return void 0;
  }
  return currentInput.slice(baseline.length);
}
function buildCachedWebSocketRequestBody(entry, body) {
  const continuation = entry.continuation;
  if (!continuation) {
    return body;
  }
  const delta = getCachedWebSocketInputDelta(body, continuation);
  if (!delta || !continuation.lastResponseId) {
    entry.continuation = void 0;
    return body;
  }
  return {
    ...body,
    previous_response_id: continuation.lastResponseId,
    input: delta
  };
}
async function* startWebSocketOutputOnFirstEvent(events, onStart) {
  let started = false;
  for await (const event of events) {
    if (!started) {
      started = true;
      onStart();
    }
    yield event;
  }
}
async function processWebSocketStream(url, body, headers, output, stream10, model, onStart, idleTimeoutMs, websocketConnectTimeoutMs, cacheSessionId, grammarToolInputProperties, options) {
  const { socket, entry, reused, release } = await acquireWebSocket(url, headers, cacheSessionId, options?.signal, websocketConnectTimeoutMs, options?.env);
  let keepConnection = true;
  const useCachedContext = options?.transport === "websocket-cached" || options?.transport === "auto";
  const fullBody = body;
  const requestBody = useCachedContext && entry ? buildCachedWebSocketRequestBody(entry, fullBody) : fullBody;
  const stats = cacheSessionId ? getOrCreateWebSocketDebugStats(cacheSessionId) : void 0;
  if (stats) {
    stats.requests++;
    if (reused)
      stats.connectionsReused++;
    else
      stats.connectionsCreated++;
    if (useCachedContext)
      stats.cachedContextRequests++;
    if (requestBody.store === true)
      stats.storeTrueRequests++;
    stats.lastInputItems = requestBody.input?.length ?? 0;
    if (requestBody.previous_response_id) {
      stats.deltaRequests++;
      stats.lastDeltaInputItems = requestBody.input?.length ?? 0;
      stats.lastPreviousResponseId = requestBody.previous_response_id;
    } else {
      stats.fullContextRequests++;
      stats.lastDeltaInputItems = void 0;
      stats.lastPreviousResponseId = void 0;
    }
  }
  try {
    socket.send(JSON.stringify({ type: "response.create", ...requestBody }));
    await processResponsesStream(startWebSocketOutputOnFirstEvent(mapCodexEvents(parseWebSocket(socket, options?.signal, idleTimeoutMs)), onStart), output, stream10, model, {
      serviceTier: options?.serviceTier,
      grammarToolInputProperties,
      resolveServiceTier: resolveCodexServiceTier,
      applyServiceTierPricing: (usage, serviceTier) => applyServiceTierPricing2(usage, serviceTier, model)
    });
    if (options?.signal?.aborted) {
      keepConnection = false;
    } else if (useCachedContext && entry && output.responseId) {
      const responseItems = convertResponsesMessages(model, { messages: [output] }, CODEX_TOOL_CALL_PROVIDERS, {
        includeSystemPrompt: false,
        grammarToolInputProperties
      }).filter((item) => item.type !== "function_call_output" && item.type !== "custom_tool_call_output");
      entry.continuation = {
        lastRequestBody: fullBody,
        lastResponseId: output.responseId,
        lastResponseItems: responseItems
      };
    }
  } catch (error) {
    if (entry) {
      entry.continuation = void 0;
    }
    keepConnection = false;
    throw error;
  } finally {
    release({ keep: keepConnection });
  }
}
async function parseErrorResponse(response) {
  const raw = await response.text();
  let message = raw || response.statusText || "Request failed";
  let friendlyMessage;
  try {
    const parsed = JSON.parse(raw);
    const err = parsed?.error;
    if (err) {
      const code = err.code || err.type || "";
      if (/usage_limit_reached|usage_not_included|rate_limit_exceeded/i.test(code) || response.status === 429) {
        const plan = err.plan_type ? ` (${err.plan_type.toLowerCase()} plan)` : "";
        const mins = err.resets_at ? Math.max(0, Math.round((err.resets_at * 1e3 - Date.now()) / 6e4)) : void 0;
        const when = mins !== void 0 ? ` Try again in ~${mins} min.` : "";
        friendlyMessage = `You have hit your ChatGPT usage limit${plan}.${when}`.trim();
      }
      message = err.message || friendlyMessage || message;
    }
  } catch {
  }
  return { message, friendlyMessage };
}
function extractAccountId(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      throw new Error("Invalid token");
    const payload = JSON.parse(atob(parts[1]));
    const accountId = payload?.[JWT_CLAIM_PATH]?.chatgpt_account_id;
    if (!accountId)
      throw new Error("No account ID in token");
    return accountId;
  } catch {
    throw new Error("Failed to extract accountId from token");
  }
}
function buildBaseCodexHeaders(initHeaders, additionalHeaders, accountId, token) {
  const headers = new Headers(initHeaders);
  for (const [key, value] of Object.entries(additionalHeaders || {})) {
    if (value === null) {
      headers.delete(key);
    } else {
      headers.set(key, value);
    }
  }
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("chatgpt-account-id", accountId);
  headers.set("originator", "pi");
  const userAgent = _os ? `pi (${_os.platform()} ${_os.release()}; ${_os.arch()})` : "pi (browser)";
  headers.set("User-Agent", userAgent);
  return headers;
}
function buildSSEHeaders(initHeaders, additionalHeaders, accountId, token, sessionId) {
  const headers = buildBaseCodexHeaders(initHeaders, additionalHeaders, accountId, token);
  headers.set("OpenAI-Beta", "responses=experimental");
  headers.set("accept", "text/event-stream");
  headers.set("content-type", "application/json");
  if (sessionId) {
    headers.set("session-id", sessionId);
    headers.set("x-client-request-id", sessionId);
  }
  return headers;
}
function buildWebSocketHeaders(initHeaders, additionalHeaders, accountId, token, requestId) {
  const headers = buildBaseCodexHeaders(initHeaders, additionalHeaders, accountId, token);
  headers.delete("accept");
  headers.delete("content-type");
  headers.delete("OpenAI-Beta");
  headers.delete("openai-beta");
  headers.set("OpenAI-Beta", OPENAI_BETA_RESPONSES_WEBSOCKETS);
  headers.set("x-client-request-id", requestId);
  headers.set("session-id", requestId);
  return headers;
}
var _os, DEFAULT_CODEX_BASE_URL, JWT_CLAIM_PATH, DEFAULT_MAX_RETRIES, BASE_DELAY_MS, DEFAULT_MAX_RETRY_DELAY_MS2, DEFAULT_WEBSOCKET_CONNECT_TIMEOUT_MS, REQUEST_COMPRESSION_ZSTD_LEVEL, CODEX_TOOL_CALL_PROVIDERS, WEBSOCKET_MESSAGE_TOO_BIG_CLOSE_CODE, WEBSOCKET_CONNECTION_LIMIT_REACHED_CODE, PREVIOUS_RESPONSE_NOT_FOUND_CODE, CODEX_RESPONSE_STATUSES, RetryDelayExceededError, stream8, streamSimple8, CodexApiError, CodexProtocolError, OPENAI_BETA_RESPONSES_WEBSOCKETS, SESSION_WEBSOCKET_CACHE_TTL_MS, SESSION_WEBSOCKET_MAX_AGE_MS, websocketSessionCache, websocketDebugStats, websocketSseFallbackSessions, _cachedWebsocket, WebSocketCloseError;
var init_openai_codex_responses = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-codex-responses.js"() {
    init_models();
    init_session_resources();
    init_abort_signals();
    init_deferred_tools();
    init_diagnostics();
    init_error_body();
    init_event_stream();
    init_headers();
    init_node_http_proxy();
    init_uuid();
    init_constrained_sampling();
    init_openai_prompt_cache();
    init_openai_responses_shared();
    init_simple_options();
    _os = loadNodeOs();
    DEFAULT_CODEX_BASE_URL = "https://chatgpt.com/backend-api";
    JWT_CLAIM_PATH = "https://api.openai.com/auth";
    DEFAULT_MAX_RETRIES = 0;
    BASE_DELAY_MS = 1e3;
    DEFAULT_MAX_RETRY_DELAY_MS2 = 6e4;
    DEFAULT_WEBSOCKET_CONNECT_TIMEOUT_MS = 15e3;
    REQUEST_COMPRESSION_ZSTD_LEVEL = 3;
    CODEX_TOOL_CALL_PROVIDERS = /* @__PURE__ */ new Set(["openai", "openai-codex", "opencode"]);
    WEBSOCKET_MESSAGE_TOO_BIG_CLOSE_CODE = 1009;
    WEBSOCKET_CONNECTION_LIMIT_REACHED_CODE = "websocket_connection_limit_reached";
    PREVIOUS_RESPONSE_NOT_FOUND_CODE = "previous_response_not_found";
    CODEX_RESPONSE_STATUSES = /* @__PURE__ */ new Set([
      "completed",
      "incomplete",
      "failed",
      "cancelled",
      "queued",
      "in_progress"
    ]);
    RetryDelayExceededError = class extends Error {
    };
    stream8 = (model, context, options) => {
      const stream10 = new AssistantMessageEventStream();
      (async () => {
        const output = {
          role: "assistant",
          content: [],
          api: "openai-codex-responses",
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
          },
          stopReason: "stop",
          timestamp: Date.now()
        };
        try {
          const apiKey = options?.apiKey;
          if (!apiKey) {
            throw new Error(`No API key for provider: ${model.provider}`);
          }
          const accountId = extractAccountId(apiKey);
          const grammarToolInputProperties = createGrammarToolInputProperties(context.tools, model.compat?.supportsOpenAIGrammarTools ?? false);
          const cacheSessionId = options?.cacheRetention === "none" ? void 0 : options?.sessionId;
          const codexSessionId = clampOpenAIPromptCacheKey(cacheSessionId);
          let body = buildRequestBody(model, context, options, codexSessionId, grammarToolInputProperties);
          const nextBody = await options?.onPayload?.(body, model);
          if (nextBody !== void 0) {
            body = nextBody;
          }
          const websocketRequestId = codexSessionId || uuidv7();
          const sseHeaders = buildSSEHeaders(model.headers, options?.headers, accountId, apiKey, codexSessionId);
          const websocketHeaders = buildWebSocketHeaders(model.headers, options?.headers, accountId, apiKey, websocketRequestId);
          const bodyJson = JSON.stringify(body);
          const httpTimeoutMs = normalizeTimeoutMs(options?.timeoutMs);
          const websocketConnectTimeoutMs = normalizeTimeoutMs(options?.websocketConnectTimeoutMs);
          const transport = options?.transport || "auto";
          let startEmitted = false;
          const websocketDisabledForSession = transport !== "sse" && isWebSocketSseFallbackActive(cacheSessionId);
          if (websocketDisabledForSession) {
            recordWebSocketSseFallback(cacheSessionId);
          }
          if (transport !== "sse" && !websocketDisabledForSession) {
            let websocketStarted = false;
            let retriedWebSocketConnectionLimit = false;
            let retriedMissingWebSocketContinuation = false;
            while (true) {
              websocketStarted = false;
              try {
                await processWebSocketStream(resolveCodexWebSocketUrl(model.baseUrl), body, websocketHeaders, output, stream10, model, () => {
                  websocketStarted = true;
                  if (!startEmitted) {
                    startEmitted = true;
                    stream10.push({ type: "start", partial: output });
                  }
                }, httpTimeoutMs, websocketConnectTimeoutMs, cacheSessionId, grammarToolInputProperties, options);
                if (options?.signal?.aborted) {
                  throw new Error("Request was aborted");
                }
                stream10.push({
                  type: "done",
                  reason: output.stopReason,
                  message: output
                });
                stream10.end();
                return;
              } catch (error) {
                const aborted = options?.signal?.aborted;
                const connectionLimitBeforeStart = !websocketStarted && isWebSocketConnectionLimitReachedError(error);
                const previousResponseNotFound = isPreviousResponseNotFoundError(error);
                if (!aborted && previousResponseNotFound && !retriedMissingWebSocketContinuation) {
                  retriedMissingWebSocketContinuation = true;
                  continue;
                }
                if (!aborted && connectionLimitBeforeStart && !retriedWebSocketConnectionLimit) {
                  retriedWebSocketConnectionLimit = true;
                  continue;
                }
                if (aborted || isCodexNonTransportError(error) && !connectionLimitBeforeStart) {
                  throw error;
                }
                appendAssistantMessageDiagnostic(output, createAssistantMessageDiagnostic("provider_transport_failure", error, {
                  configuredTransport: transport,
                  fallbackTransport: websocketStarted ? void 0 : "sse",
                  eventsEmitted: websocketStarted,
                  phase: websocketStarted ? "after_message_stream_start" : "before_message_stream_start",
                  requestBytes: new TextEncoder().encode(bodyJson).byteLength
                }));
                recordWebSocketFailure(cacheSessionId, error);
                if (websocketStarted) {
                  throw error;
                }
                recordWebSocketSseFallback(cacheSessionId);
                break;
              }
            }
          }
          const compressedBody = compressRequestBodyZstd(bodyJson);
          if (compressedBody) {
            sseHeaders.set("content-encoding", "zstd");
          }
          const sseBody = compressedBody ?? bodyJson;
          let response;
          let lastError;
          const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (options?.signal?.aborted) {
              throw new Error("Request was aborted");
            }
            try {
              const headerTimeoutSignal = httpTimeoutMs !== void 0 && httpTimeoutMs > 0 ? AbortSignal.timeout(httpTimeoutMs) : void 0;
              const combinedSignal = combineAbortSignals([options?.signal, headerTimeoutSignal]);
              try {
                response = await fetch(resolveCodexUrl(model.baseUrl), {
                  method: "POST",
                  headers: sseHeaders,
                  body: sseBody,
                  signal: combinedSignal.signal
                });
              } catch (error) {
                if (headerTimeoutSignal?.aborted && !options?.signal?.aborted) {
                  throw new Error(`Codex SSE response headers timed out after ${httpTimeoutMs}ms`);
                }
                throw error;
              } finally {
                combinedSignal.cleanup();
              }
              await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
              if (response.ok) {
                break;
              }
              const errorText = await response.text();
              if (attempt < maxRetries && isRetryableError(response.status, errorText)) {
                const retryAfterDelayMs = getRetryAfterDelayMs(response.headers);
                const delayMs = retryAfterDelayMs === void 0 ? BASE_DELAY_MS * 2 ** attempt : validateRetryDelayMs(retryAfterDelayMs, options);
                await sleep(delayMs, options?.signal);
                continue;
              }
              const fakeResponse = new Response(errorText, {
                status: response.status,
                statusText: response.statusText
              });
              const info = await parseErrorResponse(fakeResponse);
              throw new Error(info.friendlyMessage || info.message);
            } catch (error) {
              if (error instanceof Error) {
                if (error.name === "AbortError" || error.message === "Request was aborted") {
                  throw new Error("Request was aborted");
                }
              }
              lastError = error instanceof Error ? error : new Error(String(error));
              if (attempt < maxRetries && !(lastError instanceof RetryDelayExceededError) && !lastError.message.includes("usage limit")) {
                const delayMs = BASE_DELAY_MS * 2 ** attempt;
                await sleep(delayMs, options?.signal);
                continue;
              }
              throw lastError;
            }
          }
          if (!response?.ok) {
            throw lastError ?? new Error("Failed after retries");
          }
          if (!response.body) {
            throw new Error("No response body");
          }
          if (!startEmitted) {
            startEmitted = true;
            stream10.push({ type: "start", partial: output });
          }
          await processStream(response, output, stream10, model, grammarToolInputProperties, options);
          if (options?.signal?.aborted) {
            throw new Error("Request was aborted");
          }
          stream10.push({ type: "done", reason: output.stopReason, message: output });
          stream10.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.partialJson;
            delete block.customInput;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = formatProviderError(normalizeProviderError(error));
          stream10.push({ type: "error", reason: output.stopReason, error: output });
          stream10.end();
        }
      })();
      return stream10;
    };
    streamSimple8 = (model, context, options) => {
      const apiKey = options?.apiKey;
      if (!apiKey) {
        throw new Error(`No API key for provider: ${model.provider}`);
      }
      const base = buildBaseOptions(model, context, options, apiKey);
      const clampedReasoning = options?.reasoning ? clampThinkingLevel(model, options.reasoning) : void 0;
      const reasoningEffort = clampedReasoning === "off" ? void 0 : clampedReasoning;
      return stream8(model, context, {
        ...base,
        reasoningEffort
      });
    };
    CodexApiError = class extends Error {
      code;
      payload;
      constructor(message, options) {
        super(message);
        this.name = "CodexApiError";
        this.code = options?.code;
        this.payload = options?.payload;
        this.cause = options?.cause;
      }
    };
    CodexProtocolError = class extends Error {
      payload;
      constructor(message, options) {
        super(message);
        this.name = "CodexProtocolError";
        this.payload = options?.payload;
        this.cause = options?.cause;
      }
    };
    OPENAI_BETA_RESPONSES_WEBSOCKETS = "responses_websockets=2026-02-06";
    SESSION_WEBSOCKET_CACHE_TTL_MS = 5 * 60 * 1e3;
    SESSION_WEBSOCKET_MAX_AGE_MS = 55 * 60 * 1e3;
    websocketSessionCache = /* @__PURE__ */ new Map();
    websocketDebugStats = /* @__PURE__ */ new Map();
    websocketSseFallbackSessions = /* @__PURE__ */ new Set();
    registerSessionResourceCleanup(closeOpenAICodexWebSocketSessions);
    _cachedWebsocket = null;
    WebSocketCloseError = class extends Error {
      code;
      reason;
      wasClean;
      constructor(message, options) {
        super(message);
        this.name = "WebSocketCloseError";
        this.code = options?.code;
        this.reason = options?.reason;
        this.wasClean = options?.wasClean;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openrouter-images.js
var openrouter_images_exports = {};
__export(openrouter_images_exports, {
  generateImages: () => generateImages
});
import OpenAI3 from "openai";
function createClient7(model, apiKey, optionsHeaders) {
  return new OpenAI3({
    apiKey,
    baseURL: model.baseUrl,
    dangerouslyAllowBrowser: true,
    defaultHeaders: providerHeadersToRecord({ ...model.headers, ...optionsHeaders })
  });
}
function buildParams7(model, context) {
  const content = context.input.map((item) => {
    if (item.type === "text") {
      return {
        type: "text",
        text: sanitizeSurrogates(item.text)
      };
    }
    return {
      type: "image_url",
      image_url: {
        url: `data:${item.mimeType};base64,${item.data}`
      }
    };
  });
  return {
    model: model.id,
    messages: [
      {
        role: "user",
        content
      }
    ],
    stream: false,
    modalities: model.output.includes("text") ? ["image", "text"] : ["image"]
  };
}
function parseUsage(rawUsage, model) {
  const promptTokens = rawUsage.prompt_tokens || 0;
  const reportedCachedTokens = rawUsage.prompt_tokens_details?.cached_tokens || 0;
  const cacheWriteTokens = rawUsage.prompt_tokens_details?.cache_write_tokens || 0;
  const cacheReadTokens = cacheWriteTokens > 0 ? Math.max(0, reportedCachedTokens - cacheWriteTokens) : reportedCachedTokens;
  const input = Math.max(0, promptTokens - cacheReadTokens - cacheWriteTokens);
  const output = rawUsage.completion_tokens || 0;
  const usage = {
    input,
    output,
    cacheRead: cacheReadTokens,
    cacheWrite: cacheWriteTokens,
    totalTokens: input + output + cacheReadTokens + cacheWriteTokens,
    cost: {
      input: model.cost.input / 1e6 * input,
      output: model.cost.output / 1e6 * output,
      cacheRead: model.cost.cacheRead / 1e6 * cacheReadTokens,
      cacheWrite: model.cost.cacheWrite / 1e6 * cacheWriteTokens,
      total: 0
    }
  };
  usage.cost.total = usage.cost.input + usage.cost.output + usage.cost.cacheRead + usage.cost.cacheWrite;
  return usage;
}
var generateImages;
var init_openrouter_images = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openrouter-images.js"() {
    init_error_body();
    init_headers();
    init_provider_retry();
    init_sanitize_unicode();
    generateImages = async (model, context, options) => {
      const output = {
        api: model.api,
        provider: model.provider,
        model: model.id,
        output: [],
        stopReason: "stop",
        timestamp: Date.now()
      };
      try {
        const apiKey = options?.apiKey;
        if (!apiKey) {
          throw new Error(`No API key for provider: ${model.provider}`);
        }
        const client = createClient7(model, apiKey, options?.headers);
        let params = buildParams7(model, context);
        const nextParams = await options?.onPayload?.(params, model);
        if (nextParams !== void 0) {
          params = nextParams;
        }
        const requestOptions = {
          ...options?.signal ? { signal: options.signal } : {},
          ...options?.timeoutMs !== void 0 ? { timeout: options.timeoutMs } : {},
          maxRetries: 0
        };
        const { data: response, response: rawResponse } = await retryProviderRequest(() => client.chat.completions.create(params, requestOptions).withResponse(), {
          maxRetries: options?.maxRetries,
          maxRetryDelayMs: options?.maxRetryDelayMs,
          signal: options?.signal
        });
        await options?.onResponse?.({ status: rawResponse.status, headers: headersToRecord(rawResponse.headers) }, model);
        const imageResponse = response;
        output.responseId = imageResponse.id;
        if (imageResponse.usage) {
          output.usage = parseUsage(imageResponse.usage, model);
        }
        const choice = imageResponse.choices[0];
        if (choice) {
          const content = choice.message.content;
          if (typeof content === "string" && content.length > 0) {
            output.output.push({ type: "text", text: content });
          }
          for (const image of choice.message.images ?? []) {
            const imageUrl = typeof image.image_url === "string" ? image.image_url : image.image_url?.url;
            if (!imageUrl?.startsWith("data:"))
              continue;
            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches)
              continue;
            output.output.push({
              type: "image",
              mimeType: matches[1],
              data: matches[2]
            });
          }
        }
        return output;
      } catch (error) {
        output.stopReason = options?.signal?.aborted ? "aborted" : "error";
        output.errorMessage = formatProviderError(normalizeProviderError(error));
        return output;
      }
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/pi-messages.js
var pi_messages_exports = {};
__export(pi_messages_exports, {
  PiMessagesResponseError: () => PiMessagesResponseError,
  stream: () => stream9,
  streamSimple: () => streamSimple9
});
function parsePiMessagesErrorBody(body) {
  try {
    const parsed = JSON.parse(body);
    const error = parsed?.error;
    return parsed && typeof error === "object" && error !== null && !Array.isArray(error) ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function truncateDiagnosticString(value) {
  const maxLength = 8192;
  return value.length > maxLength ? `${value.slice(0, maxLength)}\u2026` : value;
}
function formatPiMessagesResponseError(response, body, errorBody) {
  const message = typeof errorBody?.error?.message === "string" ? errorBody.error.message : void 0;
  const code = typeof errorBody?.error?.code === "string" ? errorBody.error.code : void 0;
  const suffix = message ?? body;
  const codeSuffix = code ? ` (${code})` : "";
  return `${response.status} ${response.statusText}: ${suffix}${codeSuffix}`;
}
function createPiMessagesResponseError(model, url, response, body) {
  const errorBody = parsePiMessagesErrorBody(body);
  const code = typeof errorBody?.error?.code === "string" ? errorBody.error.code : void 0;
  return new PiMessagesResponseError(formatPiMessagesResponseError(response, body, errorBody), code, {
    version: 1,
    provider: model.provider,
    model: model.id,
    url: url.toString(),
    status: response.status,
    statusText: response.statusText,
    error: errorBody?.error,
    body: errorBody ? void 0 : truncateDiagnosticString(body),
    timestampMs: Date.now()
  });
}
function createEmptyUsage() {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
  };
}
function appendRewriteDiagnostic(message, rewrite) {
  if (!rewrite) {
    return;
  }
  appendAssistantMessageDiagnostic(message, {
    type: "pi_messages_rewrite",
    timestamp: Date.now(),
    details: { ...rewrite }
  });
}
function createEventConverter(model) {
  const partial = {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: createEmptyUsage(),
    stopReason: "stop",
    timestamp: Date.now()
  };
  const toolJson = /* @__PURE__ */ new Map();
  return (event) => {
    switch (event.type) {
      case "done":
        Object.assign(partial, {
          stopReason: event.reason,
          usage: event.usage,
          responseId: event.responseId
        });
        appendRewriteDiagnostic(partial, event.rewrite);
        return { type: "done", reason: event.reason, message: partial };
      case "error":
        Object.assign(partial, {
          stopReason: event.reason,
          usage: event.usage,
          errorMessage: event.errorMessage,
          responseId: event.responseId
        });
        appendRewriteDiagnostic(partial, event.rewrite);
        return { type: "error", reason: event.reason, error: partial };
      case "start":
        break;
      case "text_start":
        partial.content[event.contentIndex] = { type: "text", text: "" };
        break;
      case "text_delta":
        partial.content[event.contentIndex].text += event.delta;
        break;
      case "text_end":
        Object.assign(partial.content[event.contentIndex], {
          text: event.content,
          textSignature: event.contentSignature
        });
        break;
      case "thinking_start":
        partial.content[event.contentIndex] = { type: "thinking", thinking: "" };
        break;
      case "thinking_delta":
        partial.content[event.contentIndex].thinking += event.delta;
        break;
      case "thinking_end":
        Object.assign(partial.content[event.contentIndex], {
          thinking: event.content,
          thinkingSignature: event.contentSignature,
          redacted: event.redacted
        });
        break;
      case "toolcall_start":
        partial.content[event.contentIndex] = {
          type: "toolCall",
          id: event.id,
          name: event.toolName,
          arguments: {}
        };
        toolJson.set(event.contentIndex, "");
        break;
      case "toolcall_delta": {
        const json = `${toolJson.get(event.contentIndex) ?? ""}${event.delta}`;
        toolJson.set(event.contentIndex, json);
        partial.content[event.contentIndex].arguments = parseStreamingJson(json);
        break;
      }
      case "toolcall_end":
        Object.assign(partial.content[event.contentIndex], event.toolCall);
        toolJson.delete(event.contentIndex);
        return {
          type: "toolcall_end",
          contentIndex: event.contentIndex,
          toolCall: partial.content[event.contentIndex],
          partial
        };
    }
    return { ...event, partial };
  };
}
async function* readPiMessagesEvents(stream10) {
  const decoder = new TextDecoder();
  const reader = stream10.getReader();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        const event = parsePiMessagesEvent(buffer.slice(0, split));
        if (event) {
          yield event;
        }
        buffer = buffer.slice(split + 2);
        split = buffer.indexOf("\n\n");
      }
      if (done) {
        break;
      }
    }
    if (buffer.trim()) {
      const event = parsePiMessagesEvent(buffer);
      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
function parsePiMessagesEvent(raw) {
  const data = raw.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
  return data && data !== "[DONE]" ? JSON.parse(data) : void 0;
}
function createErrorEvent(model, error, aborted) {
  const reason = aborted ? "aborted" : "error";
  const assistantMessage = {
    role: "assistant",
    content: [],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: createEmptyUsage(),
    stopReason: reason,
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: Date.now()
  };
  if (!aborted && error instanceof PiMessagesResponseError) {
    appendAssistantMessageDiagnostic(assistantMessage, createAssistantMessageDiagnostic("pi_messages_response_failure", error, error.diagnosticDetails));
  }
  return { type: "error", reason, error: assistantMessage };
}
function resolveCacheRetention4(cacheRetention, env) {
  if (cacheRetention) {
    return cacheRetention;
  }
  return getProviderEnvValue("PI_CACHE_RETENTION", env) === "long" ? "long" : void 0;
}
var PiMessagesResponseError, stream9, streamSimple9;
var init_pi_messages = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/pi-messages.js"() {
    init_diagnostics();
    init_event_stream();
    init_headers();
    init_json_parse();
    init_provider_env();
    PiMessagesResponseError = class extends Error {
      code;
      diagnosticDetails;
      constructor(message, code, diagnosticDetails) {
        super(message);
        this.name = "PiMessagesResponseError";
        this.code = code;
        this.diagnosticDetails = diagnosticDetails;
      }
    };
    stream9 = (model, context, options) => {
      const eventStream = new AssistantMessageEventStream();
      const convertEvent = createEventConverter(model);
      void (async () => {
        try {
          const apiKey = options?.apiKey;
          if (!apiKey) {
            throw new Error(`No API key provided for provider "${model.provider}"`);
          }
          const url = new URL(`${model.baseUrl.replace(/\/+$/u, "")}/messages`);
          if (options?.debug) {
            url.searchParams.set("debug", "1");
          }
          let payload = {
            model: model.id,
            context,
            options: {
              temperature: options?.temperature,
              maxTokens: options?.maxTokens,
              reasoning: options?.reasoning,
              cacheRetention: resolveCacheRetention4(options?.cacheRetention, options?.env),
              sessionId: options?.sessionId,
              toolChoice: options?.toolChoice
            }
          };
          const nextPayload = await options?.onPayload?.(payload, model);
          if (nextPayload !== void 0) {
            payload = nextPayload;
          }
          const response = await fetch(url, {
            method: "POST",
            headers: {
              authorization: `Bearer ${apiKey}`,
              accept: "text/event-stream",
              "content-type": "application/json",
              ...providerHeadersToRecord(options?.headers)
            },
            body: JSON.stringify(payload),
            signal: options?.signal
          });
          await options?.onResponse?.({ status: response.status, headers: headersToRecord(response.headers) }, model);
          if (!response.ok) {
            const body = await response.text();
            throw createPiMessagesResponseError(model, url, response, body);
          }
          if (!response.body) {
            throw new Error(`${model.provider} response has no body`);
          }
          for await (const piEvent of readPiMessagesEvents(response.body)) {
            const event = convertEvent(piEvent);
            eventStream.push(event);
            if (event.type === "done" || event.type === "error") {
              return;
            }
          }
          throw new Error(`${model.provider} stream ended without a terminal event`);
        } catch (error) {
          eventStream.push(createErrorEvent(model, error, options?.signal?.aborted ?? false));
        }
      })();
      return eventStream;
    };
    streamSimple9 = (model, context, options) => {
      const extra = options;
      return stream9(model, context, {
        ...options,
        reasoning: options?.reasoning,
        toolChoice: extra?.toolChoice,
        debug: extra?.debug
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/images-models.js
init_context();
init_credential_store();
init_resolve();
var ImagesModelsImpl = class {
  providers = /* @__PURE__ */ new Map();
  credentials;
  authContext;
  constructor(options) {
    this.credentials = options?.credentials ?? new InMemoryCredentialStore();
    this.authContext = options?.authContext ?? defaultProviderAuthContext();
  }
  setProvider(provider) {
    this.providers.set(provider.id, provider);
  }
  deleteProvider(id) {
    this.providers.delete(id);
  }
  clearProviders() {
    this.providers.clear();
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
  getProvider(id) {
    return this.providers.get(id);
  }
  getModels(provider) {
    if (provider !== void 0) {
      const entry = this.providers.get(provider);
      if (!entry)
        return [];
      try {
        return entry.getModels();
      } catch {
        return [];
      }
    }
    const models = [];
    for (const entry of this.providers.values()) {
      try {
        models.push(...entry.getModels());
      } catch {
      }
    }
    return models;
  }
  getModel(provider, id) {
    return this.getModels(provider).find((model) => model.id === id);
  }
  async refresh(provider) {
    if (provider !== void 0) {
      const entry = this.providers.get(provider);
      if (!entry?.refreshModels)
        return;
      try {
        await entry.refreshModels();
      } catch (error) {
        if (error instanceof ModelsError)
          throw error;
        throw new ModelsError("model_source", `Model refresh failed for ${provider}`, { cause: error });
      }
      return;
    }
    await Promise.allSettled(Array.from(this.providers.values(), async (entry) => entry.refreshModels?.()));
  }
  async getAuth(providerOrModel, overrides) {
    const providerId = typeof providerOrModel === "string" ? providerOrModel : providerOrModel.provider;
    const provider = this.providers.get(providerId);
    if (!provider)
      return void 0;
    return resolveProviderAuth(provider, this.credentials, this.authContext, overrides);
  }
  async generateImages(model, context, options) {
    try {
      const provider = this.providers.get(model.provider);
      if (!provider) {
        throw new ModelsError("provider", `Unknown provider: ${model.provider}`);
      }
      const resolution = await this.getAuth(model, {
        apiKey: options?.apiKey,
        env: options?.env
      });
      const auth = resolution?.auth;
      if (!auth) {
        return provider.generateImages(model, context, options);
      }
      const requestModel = auth.baseUrl ? { ...model, baseUrl: auth.baseUrl } : model;
      const apiKey = options?.apiKey ?? auth.apiKey;
      const headers = auth.headers || options?.headers ? { ...auth.headers, ...options?.headers } : void 0;
      const env = resolution.env || options?.env ? { ...resolution.env ?? {}, ...options?.env ?? {} } : void 0;
      return await provider.generateImages(requestModel, context, { ...options, apiKey, headers, env });
    } catch (error) {
      return {
        api: model.api,
        provider: model.provider,
        model: model.id,
        output: [],
        stopReason: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      };
    }
  }
};
function createImagesModels(options) {
  return new ImagesModelsImpl(options);
}
function createImagesProvider(input) {
  let models = input.models;
  let inflightRefresh;
  const refreshModels = input.refreshModels;
  return {
    id: input.id,
    name: input.name ?? input.id,
    auth: input.auth,
    getModels: () => models,
    refreshModels: refreshModels ? () => {
      inflightRefresh ??= (async () => {
        try {
          models = await refreshModels();
        } finally {
          inflightRefresh = void 0;
        }
      })();
      return inflightRefresh;
    } : void 0,
    generateImages: (model, context, options) => input.api.generateImages(model, context, options)
  };
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/amazon-bedrock.json
var amazon_bedrock_default = { "bedrock-converse-stream": { "amazon.nova-2-lite-v1:0": { id: "amazon.nova-2-lite-v1:0", name: "Nova 2 Lite", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 0.33, output: 2.75, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "amazon.nova-lite-v1:0": { id: "amazon.nova-lite-v1:0", name: "Nova Lite", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.06, output: 0.24, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 8192 }, "amazon.nova-micro-v1:0": { id: "amazon.nova-micro-v1:0", name: "Nova Micro", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.035, output: 0.14, cacheRead: 875e-5, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "amazon.nova-pro-v1:0": { id: "amazon.nova-pro-v1:0", name: "Nova Pro", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 3.2, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 8192 }, "anthropic.claude-fable-5": { id: "anthropic.claude-fable-5", name: "Claude Fable 5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "anthropic.claude-haiku-4-5-20251001-v1:0": { id: "anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "anthropic.claude-opus-4-1-20250805-v1:0": { id: "anthropic.claude-opus-4-1-20250805-v1:0", name: "Claude Opus 4.1", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3 }, "anthropic.claude-opus-4-5-20251101-v1:0": { id: "anthropic.claude-opus-4-5-20251101-v1:0", name: "Claude Opus 4.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "anthropic.claude-opus-4-6-v1": { id: "anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "anthropic.claude-opus-4-7": { id: "anthropic.claude-opus-4-7", name: "Claude Opus 4.7", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic.claude-opus-4-8": { id: "anthropic.claude-opus-4-8", name: "Claude Opus 4.8", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "anthropic.claude-sonnet-4-6": { id: "anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "anthropic.claude-sonnet-5": { id: "anthropic.claude-sonnet-5", name: "Claude Sonnet 5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "au.anthropic.claude-haiku-4-5-20251001-v1:0": { id: "au.anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5 (AU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "au.anthropic.claude-opus-4-6-v1": { id: "au.anthropic.claude-opus-4-6-v1", name: "AU Anthropic Claude Opus 4.6", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 16.5, output: 82.5, cacheRead: 1.65, cacheWrite: 20.625 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "au.anthropic.claude-opus-4-8": { id: "au.anthropic.claude-opus-4-8", name: "Claude Opus 4.8 (AU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "au.anthropic.claude-opus-5": { id: "au.anthropic.claude-opus-5", name: "Claude Opus 5 (AU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "au.anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "au.anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5 (AU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "au.anthropic.claude-sonnet-4-6": { id: "au.anthropic.claude-sonnet-4-6", name: "AU Anthropic Claude Sonnet 4.6", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3.3, output: 16.5, cacheRead: 0.33, cacheWrite: 4.125 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "au.anthropic.claude-sonnet-5": { id: "au.anthropic.claude-sonnet-5", name: "Claude Sonnet 5 (AU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "deepseek.r1-v1:0": { id: "deepseek.r1-v1:0", name: "DeepSeek-R1", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 1.35, output: 5.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32768 }, "deepseek.v3-v1:0": { id: "deepseek.v3-v1:0", name: "DeepSeek-V3.1", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.58, output: 1.68, cacheRead: 0, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 81920, compat: { supportsStrictMode: true } }, "deepseek.v3.2": { id: "deepseek.v3.2", name: "DeepSeek-V3.2", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.62, output: 1.85, cacheRead: 0, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 81920, compat: { supportsStrictMode: true } }, "eu.anthropic.claude-fable-5": { id: "eu.anthropic.claude-fable-5", name: "Claude Fable 5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 11, output: 55, cacheRead: 1.1, cacheWrite: 13.75 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "eu.anthropic.claude-haiku-4-5-20251001-v1:0": { id: "eu.anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 5.5, cacheRead: 0.11, cacheWrite: 1.375 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "eu.anthropic.claude-opus-4-5-20251101-v1:0": { id: "eu.anthropic.claude-opus-4-5-20251101-v1:0", name: "Claude Opus 4.5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWrite: 6.875 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "eu.anthropic.claude-opus-4-6-v1": { id: "eu.anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWrite: 6.875 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "eu.anthropic.claude-opus-4-7": { id: "eu.anthropic.claude-opus-4-7", name: "Claude Opus 4.7 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWrite: 6.875 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "eu.anthropic.claude-opus-4-8": { id: "eu.anthropic.claude-opus-4-8", name: "Claude Opus 4.8 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWrite: 6.875 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "eu.anthropic.claude-opus-5": { id: "eu.anthropic.claude-opus-5", name: "Claude Opus 5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 27.5, cacheRead: 0.55, cacheWrite: 6.875 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "eu.anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "eu.anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3.3, output: 16.5, cacheRead: 0.33, cacheWrite: 4.125 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "eu.anthropic.claude-sonnet-4-6": { id: "eu.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3.3, output: 16.5, cacheRead: 0.33, cacheWrite: 4.125 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "eu.anthropic.claude-sonnet-5": { id: "eu.anthropic.claude-sonnet-5", name: "Claude Sonnet 5 (EU)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.eu-central-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2.2, output: 11, cacheRead: 0.22, cacheWrite: 2.75 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "global.anthropic.claude-fable-5": { id: "global.anthropic.claude-fable-5", name: "Claude Fable 5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "global.anthropic.claude-haiku-4-5-20251001-v1:0": { id: "global.anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "global.anthropic.claude-opus-4-5-20251101-v1:0": { id: "global.anthropic.claude-opus-4-5-20251101-v1:0", name: "Claude Opus 4.5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "global.anthropic.claude-opus-4-6-v1": { id: "global.anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "global.anthropic.claude-opus-4-7": { id: "global.anthropic.claude-opus-4-7", name: "Claude Opus 4.7 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "global.anthropic.claude-opus-4-8": { id: "global.anthropic.claude-opus-4-8", name: "Claude Opus 4.8 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "global.anthropic.claude-opus-5": { id: "global.anthropic.claude-opus-5", name: "Claude Opus 5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "global.anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "global.anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "global.anthropic.claude-sonnet-4-6": { id: "global.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "global.anthropic.claude-sonnet-5": { id: "global.anthropic.claude-sonnet-5", name: "Claude Sonnet 5 (Global)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "google.gemma-3-27b-it": { id: "google.gemma-3-27b-it", name: "Google Gemma 3 27B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.12, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 8192, compat: { supportsStrictMode: true } }, "google.gemma-3-4b-it": { id: "google.gemma-3-4b-it", name: "Gemma 3 4B IT", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.04, output: 0.08, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "jp.anthropic.claude-haiku-4-5-20251001-v1:0": { id: "jp.anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "jp.anthropic.claude-opus-4-7": { id: "jp.anthropic.claude-opus-4-7", name: "Claude Opus 4.7 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "jp.anthropic.claude-opus-4-8": { id: "jp.anthropic.claude-opus-4-8", name: "Claude Opus 4.8 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "jp.anthropic.claude-opus-5": { id: "jp.anthropic.claude-opus-5", name: "Claude Opus 5 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "jp.anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "jp.anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "jp.anthropic.claude-sonnet-4-6": { id: "jp.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "jp.anthropic.claude-sonnet-5": { id: "jp.anthropic.claude-sonnet-5", name: "Claude Sonnet 5 (JP)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "meta.llama3-1-70b-instruct-v1:0": { id: "meta.llama3-1-70b-instruct-v1:0", name: "Llama 3.1 70B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.72, output: 0.72, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "meta.llama3-1-8b-instruct-v1:0": { id: "meta.llama3-1-8b-instruct-v1:0", name: "Llama 3.1 8B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.22, output: 0.22, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "meta.llama3-3-70b-instruct-v1:0": { id: "meta.llama3-3-70b-instruct-v1:0", name: "Llama 3.3 70B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.72, output: 0.72, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "meta.llama4-maverick-17b-instruct-v1:0": { id: "meta.llama4-maverick-17b-instruct-v1:0", name: "Llama 4 Maverick 17B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.24, output: 0.97, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 16384 }, "meta.llama4-scout-17b-instruct-v1:0": { id: "meta.llama4-scout-17b-instruct-v1:0", name: "Llama 4 Scout 17B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.17, output: 0.66, cacheRead: 0, cacheWrite: 0 }, contextWindow: 35e5, maxTokens: 16384 }, "minimax.minimax-m2": { id: "minimax.minimax-m2", name: "MiniMax M2", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 204608, maxTokens: 128e3 }, "minimax.minimax-m2.1": { id: "minimax.minimax-m2.1", name: "MiniMax M2.1", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072 }, "minimax.minimax-m2.5": { id: "minimax.minimax-m2.5", name: "MiniMax M2.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 98304 }, "mistral.devstral-2-123b": { id: "mistral.devstral-2-123b", name: "Devstral 2 123B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8192, compat: { supportsStrictMode: true } }, "mistral.magistral-small-2509": { id: "mistral.magistral-small-2509", name: "Magistral Small 1.2", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e4, compat: { supportsStrictMode: true } }, "mistral.ministral-3-14b-instruct": { id: "mistral.ministral-3-14b-instruct", name: "Ministral 14B 3.0", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.2, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "mistral.ministral-3-3b-instruct": { id: "mistral.ministral-3-3b-instruct", name: "Ministral 3 3B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8192, compat: { supportsStrictMode: true } }, "mistral.ministral-3-8b-instruct": { id: "mistral.ministral-3-8b-instruct", name: "Ministral 3 8B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "mistral.mistral-large-3-675b-instruct": { id: "mistral.mistral-large-3-675b-instruct", name: "Mistral Large 3", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8192, compat: { supportsStrictMode: true } }, "mistral.pixtral-large-2502-v1:0": { id: "mistral.pixtral-large-2502-v1:0", name: "Pixtral Large (25.02)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "mistral.voxtral-mini-3b-2507": { id: "mistral.voxtral-mini-3b-2507", name: "Voxtral Mini 3B 2507", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.04, output: 0.04, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "mistral.voxtral-small-24b-2507": { id: "mistral.voxtral-small-24b-2507", name: "Voxtral Small 24B 2507", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.35, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32e3, maxTokens: 8192, compat: { supportsStrictMode: true } }, "moonshot.kimi-k2-thinking": { id: "moonshot.kimi-k2-thinking", name: "Kimi K2 Thinking", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262143, maxTokens: 16e3, compat: { supportsStrictMode: true } }, "moonshotai.kimi-k2.5": { id: "moonshotai.kimi-k2.5", name: "Kimi K2.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262143, maxTokens: 16e3, compat: { supportsStrictMode: true } }, "nvidia.nemotron-nano-12b-v2": { id: "nvidia.nemotron-nano-12b-v2", name: "NVIDIA Nemotron Nano 12B v2 VL BF16", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.2, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "nvidia.nemotron-nano-3-30b": { id: "nvidia.nemotron-nano-3-30b", name: "NVIDIA Nemotron Nano 3 30B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.24, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "nvidia.nemotron-nano-9b-v2": { id: "nvidia.nemotron-nano-9b-v2", name: "NVIDIA Nemotron Nano 9B v2", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.06, output: 0.23, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "nvidia.nemotron-super-3-120b": { id: "nvidia.nemotron-super-3-120b", name: "NVIDIA Nemotron 3 Super 120B A12B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.65, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, compat: { supportsStrictMode: true } }, "openai.gpt-5.4": { id: "openai.gpt-5.4", name: "GPT-5.4", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2.75, output: 16.5, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 272e3, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai.gpt-5.5": { id: "openai.gpt-5.5", name: "GPT-5.5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5.5, output: 33, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 272e3, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai.gpt-5.6-luna": { id: "openai.gpt-5.6-luna", name: "GPT-5.6 Luna", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 272e3, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai.gpt-5.6-sol": { id: "openai.gpt-5.6-sol", name: "GPT-5.6 Sol", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 272e3, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai.gpt-5.6-terra": { id: "openai.gpt-5.6-terra", name: "GPT-5.6 Terra", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, contextWindow: 272e3, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai.gpt-oss-120b": { id: "openai.gpt-oss-120b", name: "gpt-oss-120b", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "openai.gpt-oss-120b-1:0": { id: "openai.gpt-oss-120b-1:0", name: "gpt-oss-120b", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "openai.gpt-oss-20b": { id: "openai.gpt-oss-20b", name: "gpt-oss-20b", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.07, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "openai.gpt-oss-20b-1:0": { id: "openai.gpt-oss-20b-1:0", name: "gpt-oss-20b", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.07, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "openai.gpt-oss-safeguard-120b": { id: "openai.gpt-oss-safeguard-120b", name: "GPT OSS Safeguard 120B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "openai.gpt-oss-safeguard-20b": { id: "openai.gpt-oss-safeguard-20b", name: "GPT OSS Safeguard 20B", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.07, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "qwen.qwen3-235b-a22b-2507-v1:0": { id: "qwen.qwen3-235b-a22b-2507-v1:0", name: "Qwen3 235B A22B 2507", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.22, output: 0.88, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, compat: { supportsStrictMode: true } }, "qwen.qwen3-32b-v1:0": { id: "qwen.qwen3-32b-v1:0", name: "Qwen3 32B (dense)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16384, maxTokens: 16384, compat: { supportsStrictMode: true } }, "qwen.qwen3-coder-30b-a3b-v1:0": { id: "qwen.qwen3-coder-30b-a3b-v1:0", name: "Qwen3 Coder 30B A3B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, compat: { supportsStrictMode: true } }, "qwen.qwen3-coder-480b-a35b-v1:0": { id: "qwen.qwen3-coder-480b-a35b-v1:0", name: "Qwen3 Coder 480B A35B Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.22, output: 1.8, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, compat: { supportsStrictMode: true } }, "qwen.qwen3-coder-next": { id: "qwen.qwen3-coder-next", name: "Qwen3 Coder Next", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.22, output: 1.8, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, compat: { supportsStrictMode: true } }, "qwen.qwen3-next-80b-a3b": { id: "qwen.qwen3-next-80b-a3b", name: "Qwen/Qwen3-Next-80B-A3B-Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text"], cost: { input: 0.14, output: 1.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { supportsStrictMode: true } }, "qwen.qwen3-vl-235b-a22b": { id: "qwen.qwen3-vl-235b-a22b", name: "Qwen/Qwen3-VL-235B-A22B-Instruct", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.3, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { supportsStrictMode: true } }, "us.anthropic.claude-fable-5": { id: "us.anthropic.claude-fable-5", name: "Claude Fable 5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "us.anthropic.claude-haiku-4-5-20251001-v1:0": { id: "us.anthropic.claude-haiku-4-5-20251001-v1:0", name: "Claude Haiku 4.5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "us.anthropic.claude-opus-4-1-20250805-v1:0": { id: "us.anthropic.claude-opus-4-1-20250805-v1:0", name: "Claude Opus 4.1 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3 }, "us.anthropic.claude-opus-4-5-20251101-v1:0": { id: "us.anthropic.claude-opus-4-5-20251101-v1:0", name: "Claude Opus 4.5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "us.anthropic.claude-opus-4-6-v1": { id: "us.anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "us.anthropic.claude-opus-4-7": { id: "us.anthropic.claude-opus-4-7", name: "Claude Opus 4.7 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "us.anthropic.claude-opus-4-8": { id: "us.anthropic.claude-opus-4-8", name: "Claude Opus 4.8 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "us.anthropic.claude-opus-5": { id: "us.anthropic.claude-opus-5", name: "Claude Opus 5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "us.anthropic.claude-sonnet-4-5-20250929-v1:0": { id: "us.anthropic.claude-sonnet-4-5-20250929-v1:0", name: "Claude Sonnet 4.5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictMode: true } }, "us.anthropic.claude-sonnet-4-6": { id: "us.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { max: "max" } }, "us.anthropic.claude-sonnet-5": { id: "us.anthropic.claude-sonnet-5", name: "Claude Sonnet 5 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsStrictMode: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "us.deepseek.r1-v1:0": { id: "us.deepseek.r1-v1:0", name: "DeepSeek-R1 (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 1.35, output: 5.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32768 }, "us.meta.llama4-maverick-17b-instruct-v1:0": { id: "us.meta.llama4-maverick-17b-instruct-v1:0", name: "Llama 4 Maverick 17B Instruct (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.24, output: 0.97, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 16384 }, "us.meta.llama4-scout-17b-instruct-v1:0": { id: "us.meta.llama4-scout-17b-instruct-v1:0", name: "Llama 4 Scout 17B Instruct (US)", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: false, input: ["text", "image"], cost: { input: 0.17, output: 0.66, cacheRead: 0, cacheWrite: 0 }, contextWindow: 35e5, maxTokens: 16384 }, "writer.palmyra-x4-v1:0": { id: "writer.palmyra-x4-v1:0", name: "Palmyra X4", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 2.5, output: 10, cacheRead: 0, cacheWrite: 0 }, contextWindow: 122880, maxTokens: 8192 }, "writer.palmyra-x5-v1:0": { id: "writer.palmyra-x5-v1:0", name: "Palmyra X5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.6, output: 6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 104e4, maxTokens: 8192 }, "xai.grok-4.3": { id: "xai.grok-4.3", name: "Grok 4.3", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072, compat: { supportsStrictMode: true } }, "zai.glm-4.7": { id: "zai.glm-4.7", name: "GLM-4.7", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072, compat: { supportsStrictMode: true } }, "zai.glm-4.7-flash": { id: "zai.glm-4.7-flash", name: "GLM-4.7-Flash", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 0.07, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 131072, compat: { supportsStrictMode: true } }, "zai.glm-5": { id: "zai.glm-5", name: "GLM-5", api: "bedrock-converse-stream", provider: "amazon-bedrock", baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com", reasoning: true, input: ["text"], cost: { input: 1, output: 3.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 101376, compat: { supportsStrictMode: true } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/model-catalog.js
function flattenModelCatalog(_provider, groups) {
  return Object.assign({}, ...Object.values(groups));
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/amazon-bedrock.models.js
var AMAZON_BEDROCK_MODELS = flattenModelCatalog("amazon-bedrock", amazon_bedrock_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/ant-ling.json
var ant_ling_default = { "openai-completions": { "Ling-2.6-1T": { id: "Ling-2.6-1T", name: "Ling 2.6 1T", api: "openai-completions", baseUrl: "https://api.ant-ling.com/v1", provider: "ant-ling", reasoning: false, input: ["text"], cost: { input: 0.06, output: 0.25, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "ant-ling", supportsLongCacheRetention: false } }, "Ling-2.6-flash": { id: "Ling-2.6-flash", name: "Ling 2.6 Flash", api: "openai-completions", baseUrl: "https://api.ant-ling.com/v1", provider: "ant-ling", reasoning: false, input: ["text"], cost: { input: 0.01, output: 0.02, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "ant-ling", supportsLongCacheRetention: false } }, "Ring-2.6-1T": { id: "Ring-2.6-1T", name: "Ring 2.6 1T", api: "openai-completions", baseUrl: "https://api.ant-ling.com/v1", provider: "ant-ling", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.25, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "ant-ling", supportsLongCacheRetention: false }, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: "xhigh" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/ant-ling.models.js
var ANT_LING_MODELS = flattenModelCatalog("ant-ling", ant_ling_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/anthropic.json
var anthropic_default = { "anthropic-messages": { "claude-fable-5": { id: "claude-fable-5", name: "Claude Fable 5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsStrictTools: true } }, "claude-haiku-4-5": { id: "claude-haiku-4-5", name: "Claude Haiku 4.5 (latest)", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-haiku-4-5-20251001": { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-opus-4-1": { id: "claude-opus-4-1", name: "Claude Opus 4.1 (latest)", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { supportsStrictTools: true } }, "claude-opus-4-1-20250805": { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { supportsStrictTools: true } }, "claude-opus-4-5": { id: "claude-opus-4-5", name: "Claude Opus 4.5 (latest)", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-opus-4-5-20251101": { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-opus-4-6": { id: "claude-opus-4-6", name: "Claude Opus 4.6", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true, supportsStrictTools: true } }, "claude-opus-4-7": { id: "claude-opus-4-7", name: "Claude Opus 4.7", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false, supportsStrictTools: true } }, "claude-opus-4-8": { id: "claude-opus-4-8", name: "Claude Opus 4.8", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false, supportsStrictTools: true } }, "claude-opus-5": { id: "claude-opus-5", name: "Claude Opus 5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false, supportsStrictTools: true } }, "claude-sonnet-4-5": { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5 (latest)", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-sonnet-4-5-20250929": { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { supportsStrictTools: true } }, "claude-sonnet-4-6": { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true, supportsStrictTools: true } }, "claude-sonnet-5": { id: "claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", provider: "anthropic", baseUrl: "https://api.anthropic.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsStrictTools: true } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/anthropic.models.js
var ANTHROPIC_MODELS = flattenModelCatalog("anthropic", anthropic_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/azure-openai-responses.json
var azure_openai_responses_default = { "azure-openai-responses": { "gpt-4": { id: "gpt-4", name: "GPT-4", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text"], cost: { input: 30, output: 60, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 8192 }, "gpt-4-turbo": { id: "gpt-4-turbo", name: "GPT-4 Turbo", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "gpt-4.1": { id: "gpt-4.1", name: "GPT-4.1", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "gpt-4.1-mini": { id: "gpt-4.1-mini", name: "GPT-4.1 mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "gpt-4.1-nano": { id: "gpt-4.1-nano", name: "GPT-4.1 nano", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "gpt-4o": { id: "gpt-4o", name: "GPT-4o", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-4o-2024-05-13": { id: "gpt-4o-2024-05-13", name: "GPT-4o (2024-05-13)", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 5, output: 15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "gpt-4o-2024-08-06": { id: "gpt-4o-2024-08-06", name: "GPT-4o (2024-08-06)", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-4o-2024-11-20": { id: "gpt-4o-2024-11-20", name: "GPT-4o (2024-11-20)", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-4o-mini": { id: "gpt-4o-mini", name: "GPT-4o mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-5": { id: "gpt-5", name: "GPT-5", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5-chat-latest": { id: "gpt-5-chat-latest", name: "GPT-5 Chat Latest", api: "azure-openai-responses", baseUrl: "", provider: "azure-openai-responses", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5-mini": { id: "gpt-5-mini", name: "GPT-5 Mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5-nano": { id: "gpt-5-nano", name: "GPT-5 Nano", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 0.05, output: 0.4, cacheRead: 5e-3, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5-pro": { id: "gpt-5-pro", name: "GPT-5 Pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 120, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.1": { id: "gpt-5.1", name: "GPT-5.1", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2": { id: "gpt-5.2", name: "GPT-5.2", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2-chat-latest": { id: "gpt-5.2-chat-latest", name: "GPT-5.2 Chat", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2-pro": { id: "gpt-5.2-pro", name: "GPT-5.2 Pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 21, output: 168, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.3-chat-latest": { id: "gpt-5.3-chat-latest", name: "GPT-5.3 Chat (latest)", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: false, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex-spark": { id: "gpt-5.3-codex-spark", name: "GPT-5.3 Codex Spark", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4-mini": { id: "gpt-5.4-mini", name: "GPT-5.4 mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4-nano": { id: "gpt-5.4-nano", name: "GPT-5.4 nano", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4-pro": { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.5-pro": { id: "gpt-5.5-pro", name: "GPT-5.5 Pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", minimal: null, low: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-realtime-2.1": { id: "gpt-realtime-2.1", name: "GPT-Realtime-2.1", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 4, output: 24, cacheRead: 0.4, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32e3 }, o1: { id: "o1", name: "o1", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "o1-pro": { id: "o1-pro", name: "o1-pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 150, output: 600, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, o3: { id: "o3", name: "o3", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "o3-mini": { id: "o3-mini", name: "o3-mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "o3-pro": { id: "o3-pro", name: "o3-pro", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 20, output: 80, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "o4-mini": { id: "o4-mini", name: "o4-mini", api: "azure-openai-responses", provider: "azure-openai-responses", baseUrl: "", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/azure-openai-responses.models.js
var AZURE_OPENAI_RESPONSES_MODELS = flattenModelCatalog("azure-openai-responses", azure_openai_responses_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/cerebras.json
var cerebras_default = { "openai-completions": { "gemma-4-31b": { id: "gemma-4-31b", name: "Gemma 4 31B IT", api: "openai-completions", provider: "cerebras", baseUrl: "https://api.cerebras.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.99, output: 1.49, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 40960, compat: { supportsStore: false, supportsDeveloperRole: false }, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-oss-120b": { id: "gpt-oss-120b", name: "GPT OSS 120B", api: "openai-completions", provider: "cerebras", baseUrl: "https://api.cerebras.ai/v1", reasoning: true, input: ["text"], cost: { input: 0.35, output: 0.75, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 40960, compat: { supportsStore: false, supportsDeveloperRole: false }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "zai-glm-4.7": { id: "zai-glm-4.7", name: "Z.AI GLM-4.7", api: "openai-completions", provider: "cerebras", baseUrl: "https://api.cerebras.ai/v1", reasoning: true, input: ["text"], cost: { input: 2.25, output: 2.75, cacheRead: 2.25, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 40960, compat: { supportsStore: false, supportsDeveloperRole: false }, thinkingLevelMap: { off: "none", minimal: null, low: null, medium: null, high: null, xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cerebras.models.js
var CEREBRAS_MODELS = flattenModelCatalog("cerebras", cerebras_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/cloudflare-ai-gateway.json
var cloudflare_ai_gateway_default = { "anthropic-messages": { "claude-3-5-haiku": { id: "claude-3-5-haiku", name: "Claude Haiku 3.5 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 }, contextWindow: 2e5, maxTokens: 8192, compat: { sendSessionAffinityHeaders: true } }, "claude-3-haiku": { id: "claude-3-haiku", name: "Claude Haiku 3", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 }, contextWindow: 2e5, maxTokens: 4096, compat: { sendSessionAffinityHeaders: true } }, "claude-3-opus": { id: "claude-3-opus", name: "Claude Opus 3", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 4096, compat: { sendSessionAffinityHeaders: true } }, "claude-3-sonnet": { id: "claude-3-sonnet", name: "Claude Sonnet 3", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0.3 }, contextWindow: 2e5, maxTokens: 4096, compat: { sendSessionAffinityHeaders: true } }, "claude-3.5-haiku": { id: "claude-3.5-haiku", name: "Claude Haiku 3.5 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 }, contextWindow: 2e5, maxTokens: 8192, compat: { sendSessionAffinityHeaders: true } }, "claude-3.5-sonnet": { id: "claude-3.5-sonnet", name: "Claude Sonnet 3.5 v2", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: false, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 8192, compat: { sendSessionAffinityHeaders: true } }, "claude-fable-5": { id: "claude-fable-5", name: "Claude Fable 5", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true }, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "claude-haiku-4-5": { id: "claude-haiku-4-5", name: "Claude Haiku 4.5 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { sendSessionAffinityHeaders: true } }, "claude-opus-4": { id: "claude-opus-4", name: "Claude Opus 4 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { sendSessionAffinityHeaders: true } }, "claude-opus-4-1": { id: "claude-opus-4-1", name: "Claude Opus 4.1 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { sendSessionAffinityHeaders: true } }, "claude-opus-4-5": { id: "claude-opus-4-5", name: "Claude Opus 4.5 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { sendSessionAffinityHeaders: true } }, "claude-opus-4-6": { id: "claude-opus-4-6", name: "Claude Opus 4.6 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true }, thinkingLevelMap: { max: "max" } }, "claude-opus-4-7": { id: "claude-opus-4-7", name: "Claude Opus 4.7", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true, supportsTemperature: false }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "claude-opus-4-8": { id: "claude-opus-4-8", name: "Claude Opus 4.8", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true, supportsTemperature: false }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "claude-sonnet-4": { id: "claude-sonnet-4", name: "Claude Sonnet 4 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { sendSessionAffinityHeaders: true } }, "claude-sonnet-4-5": { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5 (latest)", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { sendSessionAffinityHeaders: true } }, "claude-sonnet-4-6": { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true }, thinkingLevelMap: { max: "max" } }, "claude-sonnet-5": { id: "claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { sendSessionAffinityHeaders: true, forceAdaptiveThinking: true }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } } }, "openai-completions": { "workers-ai/@cf/moonshotai/kimi-k2.5": { id: "workers-ai/@cf/moonshotai/kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "workers-ai/@cf/moonshotai/kimi-k2.6": { id: "workers-ai/@cf/moonshotai/kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "workers-ai/@cf/nvidia/nemotron-3-120b-a12b": { id: "workers-ai/@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 Super 120B", api: "openai-completions", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat", reasoning: true, input: ["text"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "workers-ai/@cf/zai-org/glm-4.7-flash": { id: "workers-ai/@cf/zai-org/glm-4.7-flash", name: "GLM-4.7-Flash", api: "openai-completions", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "workers-ai/@cf/zai-org/glm-5.2": { id: "workers-ai/@cf/zai-org/glm-5.2", name: "Glm 5.2", api: "openai-completions", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/compat", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } } }, "openai-responses": { "gpt-4": { id: "gpt-4", name: "GPT-4", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: false, input: ["text"], cost: { input: 30, output: 60, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 8192 }, "gpt-4-turbo": { id: "gpt-4-turbo", name: "GPT-4 Turbo", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: false, input: ["text", "image"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "gpt-4o": { id: "gpt-4o", name: "GPT-4o", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-4o-mini": { id: "gpt-4o-mini", name: "GPT-4o mini", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.08, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "gpt-5.1": { id: "gpt-5.1", name: "GPT-5.1", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.13, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.1-codex": { id: "gpt-5.1-codex", name: "GPT-5.1 Codex", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2": { id: "gpt-5.2", name: "GPT-5.2", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2-codex": { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, o1: { id: "o1", name: "o1", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, o3: { id: "o3", name: "o3", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "o3-mini": { id: "o3-mini", name: "o3-mini", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "o3-pro": { id: "o3-pro", name: "o3-pro", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 20, output: 80, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "o4-mini": { id: "o4-mini", name: "o4-mini", api: "openai-responses", provider: "cloudflare-ai-gateway", baseUrl: "https://gateway.ai.cloudflare.com/v1/{CLOUDFLARE_ACCOUNT_ID}/{CLOUDFLARE_GATEWAY_ID}/openai", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.28, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-ai-gateway.models.js
var CLOUDFLARE_AI_GATEWAY_MODELS = flattenModelCatalog("cloudflare-ai-gateway", cloudflare_ai_gateway_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/cloudflare-workers-ai.json
var cloudflare_workers_ai_default = { "openai-completions": { "@cf/google/gemma-4-26b-a4b-it": { id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B IT", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/ibm-granite/granite-4.0-h-micro": { id: "@cf/ibm-granite/granite-4.0-h-micro", name: "Granite 4.0 H Micro", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: false, input: ["text"], cost: { input: 0.017, output: 0.112, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131e3, maxTokens: 131e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/meta/llama-3.3-70b-instruct-fp8-fast": { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B Instruct fp8 Fast", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: false, input: ["text"], cost: { input: 0.293, output: 2.253, cacheRead: 0, cacheWrite: 0 }, contextWindow: 24e3, maxTokens: 24e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/meta/llama-4-scout-17b-16e-instruct": { id: "@cf/meta/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B 16E Instruct", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: false, input: ["text", "image"], cost: { input: 0.27, output: 0.85, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131e3, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/mistralai/mistral-small-3.1-24b-instruct": { id: "@cf/mistralai/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1 24B Instruct", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: false, input: ["text"], cost: { input: 0.351, output: 0.555, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/moonshotai/kimi-k2.6": { id: "@cf/moonshotai/kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/moonshotai/kimi-k2.7-code": { id: "@cf/moonshotai/kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/nvidia/nemotron-3-120b-a12b": { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 Super 120B", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/openai/gpt-oss-120b": { id: "@cf/openai/gpt-oss-120b", name: "GPT OSS 120B", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 0.35, output: 0.75, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/openai/gpt-oss-20b": { id: "@cf/openai/gpt-oss-20b", name: "GPT OSS 20B", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/qwen/qwen3-30b-a3b-fp8": { id: "@cf/qwen/qwen3-30b-a3b-fp8", name: "Qwen3 30B A3b fp8", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 0.0509, output: 0.335, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 32768, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true } }, "@cf/zai-org/glm-4.7-flash": { id: "@cf/zai-org/glm-4.7-flash", name: "GLM-4.7-Flash", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 0.0605, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "@cf/zai-org/glm-5.2": { id: "@cf/zai-org/glm-5.2", name: "Glm 5.2", api: "openai-completions", provider: "cloudflare-workers-ai", baseUrl: "https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsLongCacheRetention: false, sendSessionAffinityHeaders: true }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-workers-ai.models.js
var CLOUDFLARE_WORKERS_AI_MODELS = flattenModelCatalog("cloudflare-workers-ai", cloudflare_workers_ai_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/deepseek.json
var deepseek_default = { "openai-completions": { "deepseek-v4-flash": { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "openai-completions", baseUrl: "https://api.deepseek.com", provider: "deepseek", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, compat: { supportsStore: false, supportsDeveloperRole: false, requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "deepseek-v4-pro": { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "openai-completions", baseUrl: "https://api.deepseek.com", provider: "deepseek", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 3625e-6, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, compat: { supportsStore: false, supportsDeveloperRole: false, requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/deepseek.models.js
var DEEPSEEK_MODELS = flattenModelCatalog("deepseek", deepseek_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/fireworks.json
var fireworks_default = { "anthropic-messages": { "accounts/fireworks/models/deepseek-v4-flash": { id: "accounts/fireworks/models/deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 0.028, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/deepseek-v4-pro": { id: "accounts/fireworks/models/deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 1.74, output: 3.48, cacheRead: 0.145, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/glm-5p1": { id: "accounts/fireworks/models/glm-5p1", name: "GLM 5.1", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, contextWindow: 202800, maxTokens: 131072, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/gpt-oss-120b": { id: "accounts/fireworks/models/gpt-oss-120b", name: "GPT OSS 120B", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/gpt-oss-20b": { id: "accounts/fireworks/models/gpt-oss-20b", name: "GPT OSS 20B", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 0.07, output: 0.3, cacheRead: 0.035, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/kimi-k2p6": { id: "accounts/fireworks/models/kimi-k2p6", name: "Kimi K2.6", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/kimi-k2p7-code": { id: "accounts/fireworks/models/kimi-k2p7-code", name: "Kimi K2.7 Code", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/minimax-m2p7": { id: "accounts/fireworks/models/minimax-m2p7", name: "MiniMax-M2.7", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 196608, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/minimax-m3": { id: "accounts/fireworks/models/minimax-m3", name: "MiniMax-M3", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 512e3, maxTokens: 512e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/models/qwen3p7-plus": { id: "accounts/fireworks/models/qwen3p7-plus", name: "Qwen 3.7 Plus", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.08, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/routers/glm-5p1-fast": { id: "accounts/fireworks/routers/glm-5p1-fast", name: "GLM 5.1 Fast", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text"], cost: { input: 2.8, output: 8.8, cacheRead: 0.52, cacheWrite: 0 }, contextWindow: 202800, maxTokens: 131072, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/routers/kimi-k2p6-fast": { id: "accounts/fireworks/routers/kimi-k2p6-fast", name: "Kimi K2.6 Fast", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/routers/kimi-k2p6-turbo": { id: "accounts/fireworks/routers/kimi-k2p6-turbo", name: "Kimi K2.6 Turbo", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } }, "accounts/fireworks/routers/kimi-k2p7-code-fast": { id: "accounts/fireworks/routers/kimi-k2p7-code-fast", name: "Kimi K2.7 Code Fast", api: "anthropic-messages", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference", reasoning: true, input: ["text", "image"], cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3, compat: { sendSessionAffinityHeaders: true, supportsEagerToolInputStreaming: false, supportsCacheControlOnTools: false, supportsLongCacheRetention: false } } }, "openai-completions": { "accounts/fireworks/models/glm-5p2": { id: "accounts/fireworks/models/glm-5p2", name: "GLM 5.2", api: "openai-completions", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.14, cacheWrite: 0 }, contextWindow: 1048575, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false }, thinkingLevelMap: { off: "none", minimal: null, low: "high", medium: "high", high: "high", xhigh: null, max: "max" } }, "accounts/fireworks/routers/glm-5p2-fast": { id: "accounts/fireworks/routers/glm-5p2-fast", name: "GLM 5.2 Fast", api: "openai-completions", provider: "fireworks", baseUrl: "https://api.fireworks.ai/inference/v1", reasoning: true, input: ["text"], cost: { input: 2.1, output: 6.6, cacheRead: 0.21, cacheWrite: 0 }, contextWindow: 1048575, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false }, thinkingLevelMap: { off: "none", minimal: null, low: "high", medium: "high", high: "high", xhigh: null, max: "max" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/fireworks.models.js
var FIREWORKS_MODELS = flattenModelCatalog("fireworks", fireworks_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/github-copilot.json
var github_copilot_default = { "anthropic-messages": { "claude-haiku-4.5": { id: "claude-haiku-4.5", name: "Claude Haiku 4.5 (latest)", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsEagerToolInputStreaming: false } }, "claude-opus-4.5": { id: "claude-opus-4.5", name: "Claude Opus 4.5 (latest)", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" } }, "claude-opus-4.6": { id: "claude-opus-4.6", name: "Claude Opus 4.6", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true } }, "claude-opus-4.7": { id: "claude-opus-4.7", name: "Claude Opus 4.7", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { xhigh: "xhigh", max: "max", minimal: "low" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-opus-4.8": { id: "claude-opus-4.8", name: "Claude Opus 4.8", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { xhigh: "xhigh", max: "max", minimal: "low" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-opus-5": { id: "claude-opus-5", name: "Claude Opus 5", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-sonnet-4": { id: "claude-sonnet-4", name: "Claude Sonnet 4 (latest)", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 216e3, maxTokens: 16e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsEagerToolInputStreaming: false } }, "claude-sonnet-4.5": { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5 (latest)", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsEagerToolInputStreaming: false } }, "claude-sonnet-4.6": { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { max: "max", minimal: "low" }, compat: { forceAdaptiveThinking: true } }, "claude-sonnet-5": { id: "claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true } } }, "openai-completions": { "claude-fable-5": { id: "claude-fable-5", name: "Claude Fable 5", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false }, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "gemini-2.5-pro": { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "gemini-3-flash-preview": { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "gemini-3.1-pro-preview": { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0, tiers: [{ inputTokensAbove: 2e5, input: 4, output: 18, cacheRead: 0.4, cacheWrite: 0 }] }, contextWindow: 1e6, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "gemini-3.5-flash": { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "gpt-4.1": { id: "gpt-4.1", name: "GPT-4.1", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } } }, "openai-responses": { "gpt-5-mini": { id: "gpt-5-mini", name: "GPT-5 Mini", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 264e3, maxTokens: 64e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2": { id: "gpt-5.2", name: "GPT-5.2", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.2-codex": { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 0 }] }, contextWindow: 1e6, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4-mini": { id: "gpt-5.4-mini", name: "GPT-5.4 mini", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4-nano": { id: "gpt-5.4-nano", name: "GPT-5.4 nano", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", xhigh: "xhigh" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 0 }] }, contextWindow: 1e6, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25, tiers: [{ inputTokensAbove: 2e5, input: 2, output: 9, cacheRead: 0.2, cacheWrite: 2.5 }] }, contextWindow: 105e4, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 12.5 }] }, contextWindow: 105e4, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 6.25 }] }, contextWindow: 105e4, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsOpenAIGrammarTools: true } }, "mai-code-1-flash-picker": { id: "mai-code-1-flash-picker", name: "MAI-Code-1-Flash", api: "openai-responses", provider: "github-copilot", baseUrl: "https://api.individual.githubcopilot.com", reasoning: true, input: ["text"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 128e3, headers: { "User-Agent": "GitHubCopilotChat/0.35.0", "Editor-Version": "vscode/1.107.0", "Editor-Plugin-Version": "copilot-chat/0.35.0", "Copilot-Integration-Id": "vscode-chat" }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/github-copilot.models.js
var GITHUB_COPILOT_MODELS = flattenModelCatalog("github-copilot", github_copilot_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/google.json
var google_default = { "google-generative-ai": { "deep-research-max-preview-04-2026": { id: "deep-research-max-preview-04-2026", name: "Deep Research Max Preview (Apr-21-2026)", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "deep-research-preview-04-2026": { id: "deep-research-preview-04-2026", name: "Deep Research Preview (Apr-21-2026)", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "gemini-2.0-flash": { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192 }, "gemini-2.0-flash-lite": { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: false, input: ["text", "image"], cost: { input: 0.075, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192 }, "gemini-2.5-computer-use-preview-10-2025": { id: "gemini-2.5-computer-use-preview-10-2025", name: "Gemini 2.5 Computer Use Preview 10-2025", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "gemini-2.5-flash": { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-2.5-flash-lite": { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-2.5-pro": { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-3-flash-preview": { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3-pro-preview": { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.1-flash-lite": { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-flash-lite-image": { id: "gemini-3.1-flash-lite-image", name: "Nano Banana 2 Lite", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 65536, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-flash-lite-preview": { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-flash-live-preview": { id: "gemini-3.1-flash-live-preview", name: "Gemini 3.1 Flash Live Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-pro-preview": { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.1-pro-preview-customtools": { id: "gemini-3.1-pro-preview-customtools", name: "Gemini 3.1 Pro Preview Custom Tools", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.5-flash": { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.5-flash-lite": { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.6-flash": { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-flash-latest": { id: "gemini-flash-latest", name: "Gemini Flash Latest", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-flash-lite-latest": { id: "gemini-flash-lite-latest", name: "Gemini Flash-Lite Latest", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-robotics-er-1.6-preview": { id: "gemini-robotics-er-1.6-preview", name: "Gemini Robotics-ER 1.6 Preview", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "gemma-4-26b-a4b-it": { id: "gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B IT", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, thinkingLevelMap: { off: null, minimal: "MINIMAL", low: null, medium: null, high: "HIGH" } }, "gemma-4-31b-it": { id: "gemma-4-31b-it", name: "Gemma 4 31B IT", api: "google-generative-ai", provider: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, thinkingLevelMap: { off: null, minimal: "MINIMAL", low: null, medium: null, high: "HIGH" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/google.models.js
var GOOGLE_MODELS = flattenModelCatalog("google", google_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/google-vertex.json
var google_vertex_default = { "google-vertex": { "gemini-2.5-flash": { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-2.5-flash-lite": { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-2.5-pro": { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "gemini-3-flash-preview": { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-flash-lite": { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-pro-preview": { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.1-pro-preview-customtools": { id: "gemini-3.1-pro-preview-customtools", name: "Gemini 3.1 Pro Preview Custom Tools", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.5-flash": { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.5-flash-lite": { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.6-flash": { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-flash-latest": { id: "gemini-flash-latest", name: "Gemini Flash Latest", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-flash-lite-latest": { id: "gemini-flash-lite-latest", name: "Gemini Flash-Lite Latest", api: "google-vertex", provider: "google-vertex", baseUrl: "https://{location}-aiplatform.googleapis.com", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/google-vertex.models.js
var GOOGLE_VERTEX_MODELS = flattenModelCatalog("google-vertex", google_vertex_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/groq.json
var groq_default = { "openai-completions": { "llama-3.1-8b-instant": { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: false, input: ["text"], cost: { input: 0.05, output: 0.08, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "llama-3.3-70b-versatile": { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: false, input: ["text"], cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768 }, "meta-llama/llama-4-scout-17b-16e-instruct": { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B 16E", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: false, input: ["text", "image"], cost: { input: 0.11, output: 0.34, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192 }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: true, input: ["text"], cost: { input: 0.075, output: 0.3, cacheRead: 0.0375, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "openai/gpt-oss-safeguard-20b": { id: "openai/gpt-oss-safeguard-20b", name: "Safety GPT OSS 20B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: true, input: ["text"], cost: { input: 0.075, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "qwen/qwen3-32b": { id: "qwen/qwen3-32b", name: "Qwen3-32B", api: "openai-completions", provider: "groq", baseUrl: "https://api.groq.com/openai/v1", reasoning: true, input: ["text"], cost: { input: 0.29, output: 0.59, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 40960, thinkingLevelMap: { off: "none", minimal: null, low: null, medium: null, high: "default", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/groq.models.js
var GROQ_MODELS = flattenModelCatalog("groq", groq_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/huggingface.json
var huggingface_default = { "openai-completions": { "MiniMaxAI/MiniMax-M2": { id: "MiniMaxAI/MiniMax-M2", name: "MiniMax-M2", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 128e3 }, "MiniMaxAI/MiniMax-M2.1": { id: "MiniMaxAI/MiniMax-M2.1", name: "MiniMax-M2.1", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 131072 }, "MiniMaxAI/MiniMax-M2.5": { id: "MiniMaxAI/MiniMax-M2.5", name: "MiniMax-M2.5", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 131072 }, "MiniMaxAI/MiniMax-M2.7": { id: "MiniMaxAI/MiniMax-M2.7", name: "MiniMax-M2.7", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 131072 }, "MiniMaxAI/MiniMax-M3": { id: "MiniMaxAI/MiniMax-M3", name: "MiniMax-M3", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 524288, maxTokens: 128e3 }, "Qwen/Qwen3-235B-A22B": { id: "Qwen/Qwen3-235B-A22B", name: "Qwen3 235B-A22B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.8, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 40960, maxTokens: 16384 }, "Qwen/Qwen3-235B-A22B-Thinking-2507": { id: "Qwen/Qwen3-235B-A22B-Thinking-2507", name: "Qwen3-235B-A22B-Thinking-2507", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 131072 }, "Qwen/Qwen3-32B": { id: "Qwen/Qwen3-32B", name: "Qwen3 32B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.29, output: 0.59, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 16384 }, "Qwen/Qwen3-Coder-30B-A3B-Instruct": { id: "Qwen/Qwen3-Coder-30B-A3B-Instruct", name: "Qwen3-Coder 30B-A3B Instruct", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 0.07, output: 0.26, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3-Coder-480B-A35B-Instruct": { id: "Qwen/Qwen3-Coder-480B-A35B-Instruct", name: "Qwen3-Coder-480B-A35B-Instruct", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 2, output: 2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 66536 }, "Qwen/Qwen3-Coder-Next": { id: "Qwen/Qwen3-Coder-Next", name: "Qwen3-Coder-Next", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 0.2, output: 1.5, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3-Next-80B-A3B-Instruct": { id: "Qwen/Qwen3-Next-80B-A3B-Instruct", name: "Qwen3-Next-80B-A3B-Instruct", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 0.25, output: 1, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 66536 }, "Qwen/Qwen3-Next-80B-A3B-Thinking": { id: "Qwen/Qwen3-Next-80B-A3B-Thinking", name: "Qwen3-Next-80B-A3B-Thinking", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 0.3, output: 2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 131072 }, "Qwen/Qwen3.5-122B-A10B": { id: "Qwen/Qwen3.5-122B-A10B", name: "Qwen3.5 122B-A10B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 3.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.5-27B": { id: "Qwen/Qwen3.5-27B", name: "Qwen3.5 27B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.5-35B-A3B": { id: "Qwen/Qwen3.5-35B-A3B", name: "Qwen3.5 35B-A3B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.5-397B-A17B": { id: "Qwen/Qwen3.5-397B-A17B", name: "Qwen3.5-397B-A17B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3.6, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 32768, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "Qwen/Qwen3.5-9B": { id: "Qwen/Qwen3.5-9B", name: "Qwen3.5 9B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.17, output: 0.25, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.6-27B": { id: "Qwen/Qwen3.6-27B", name: "Qwen3.6 27B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.47, output: 3.19, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.6-35B-A3B": { id: "Qwen/Qwen3.6-35B-A3B", name: "Qwen3.6 35B-A3B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.15, output: 0.95, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 65536 }, "XiaomiMiMo/MiMo-V2-Flash": { id: "XiaomiMiMo/MiMo-V2-Flash", name: "MiMo-V2-Flash", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 4096 }, "XiaomiMiMo/MiMo-V2.5": { id: "XiaomiMiMo/MiMo-V2.5", name: "MiMo-V2.5", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 131072, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "XiaomiMiMo/MiMo-V2.5-Pro": { id: "XiaomiMiMo/MiMo-V2.5-Pro", name: "MiMo-V2.5-Pro", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 1, output: 3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 1048576, maxTokens: 131072, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "deepseek-ai/DeepSeek-R1": { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek-R1", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.7, output: 2.5, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 64e3, maxTokens: 32768 }, "deepseek-ai/DeepSeek-R1-0528": { id: "deepseek-ai/DeepSeek-R1-0528", name: "DeepSeek-R1-0528", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 3, output: 5, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 163840, maxTokens: 163840 }, "deepseek-ai/DeepSeek-V3.2": { id: "deepseek-ai/DeepSeek-V3.2", name: "DeepSeek-V3.2", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.28, output: 0.4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 163840, maxTokens: 65536 }, "deepseek-ai/DeepSeek-V4-Flash": { id: "deepseek-ai/DeepSeek-V4-Flash", name: "DeepSeek V4 Flash", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 1048576, maxTokens: 384e3 }, "deepseek-ai/DeepSeek-V4-Pro": { id: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 3625e-6, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 1048576, maxTokens: 393216, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: null } }, "google/gemma-4-26B-A4B-it": { id: "google/gemma-4-26B-A4B-it", name: "Gemma 4 26B A4B IT", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.13, output: 0.4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 32768 }, "google/gemma-4-31B-it": { id: "google/gemma-4-31B-it", name: "Gemma 4 31B IT", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 32768 }, "meta-llama/Llama-3.3-70B-Instruct": { id: "meta-llama/Llama-3.3-70B-Instruct", name: "Llama-3.3-70B-Instruct", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 0.59, output: 0.79, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 4096 }, "moonshotai/Kimi-K2-Instruct": { id: "moonshotai/Kimi-K2-Instruct", name: "Kimi-K2-Instruct", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 1, output: 3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 16384 }, "moonshotai/Kimi-K2-Instruct-0905": { id: "moonshotai/Kimi-K2-Instruct-0905", name: "Kimi-K2-Instruct-0905", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: false, input: ["text"], cost: { input: 1, output: 3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 16384 }, "moonshotai/Kimi-K2-Thinking": { id: "moonshotai/Kimi-K2-Thinking", name: "Kimi-K2-Thinking", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 262144 }, "moonshotai/Kimi-K2.5": { id: "moonshotai/Kimi-K2.5", name: "Kimi-K2.5", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 262144 }, "moonshotai/Kimi-K2.6": { id: "moonshotai/Kimi-K2.6", name: "Kimi-K2.6", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 262144 }, "moonshotai/Kimi-K2.7-Code": { id: "moonshotai/Kimi-K2.7-Code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 262144 }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.69, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 32768, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.5, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 32768, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "stepfun-ai/Step-3.5-Flash": { id: "stepfun-ai/Step-3.5-Flash", name: "Step 3.5 Flash", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 256e3 }, "stepfun-ai/Step-3.7-Flash": { id: "stepfun-ai/Step-3.7-Flash", name: "Step 3.7 Flash", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.15, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 256e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "zai-org/GLM-4.5": { id: "zai-org/GLM-4.5", name: "GLM-4.5", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 98304 }, "zai-org/GLM-4.5-Air": { id: "zai-org/GLM-4.5-Air", name: "GLM-4.5-Air", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.13, output: 0.85, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 131072, maxTokens: 98304 }, "zai-org/GLM-4.5V": { id: "zai-org/GLM-4.5V", name: "GLM-4.5V", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 1.8, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 65536, maxTokens: 16384 }, "zai-org/GLM-4.6": { id: "zai-org/GLM-4.6", name: "GLM-4.6", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.55, output: 2.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 131072 }, "zai-org/GLM-4.7": { id: "zai-org/GLM-4.7", name: "GLM-4.7", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0.11, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 204800, maxTokens: 131072 }, "zai-org/GLM-4.7-Flash": { id: "zai-org/GLM-4.7-Flash", name: "GLM-4.7-Flash", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 2e5, maxTokens: 128e3 }, "zai-org/GLM-5": { id: "zai-org/GLM-5", name: "GLM-5", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 1, output: 3.2, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 202752, maxTokens: 131072 }, "zai-org/GLM-5.1": { id: "zai-org/GLM-5.1", name: "GLM-5.1", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 1, output: 3.2, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 202752, maxTokens: 131072 }, "zai-org/GLM-5.2": { id: "zai-org/GLM-5.2", name: "GLM-5.2", api: "openai-completions", provider: "huggingface", baseUrl: "https://router.huggingface.co/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0, cacheWrite: 0 }, compat: { supportsDeveloperRole: false }, contextWindow: 262144, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/huggingface.models.js
var HUGGINGFACE_MODELS = flattenModelCatalog("huggingface", huggingface_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/kimi-coding.json
var kimi_coding_default = { "anthropic-messages": { k3: { id: "k3", name: "Kimi K3", api: "anthropic-messages", provider: "kimi-coding", baseUrl: "https://api.kimi.com/coding", headers: { "User-Agent": "KimiCLI/1.5" }, compat: { allowEmptySignature: true, forceAdaptiveThinking: true }, reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" } }, "k3-256k": { id: "k3-256k", name: "Kimi K3-256K", api: "anthropic-messages", provider: "kimi-coding", baseUrl: "https://api.kimi.com/coding", headers: { "User-Agent": "KimiCLI/1.5" }, compat: { forceAdaptiveThinking: true }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" } }, "kimi-for-coding": { id: "kimi-for-coding", name: "Kimi K2.7 Code", api: "anthropic-messages", provider: "kimi-coding", baseUrl: "https://api.kimi.com/coding", headers: { "User-Agent": "KimiCLI/1.5" }, compat: { allowEmptySignature: true, forceAdaptiveThinking: true }, reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768 }, "kimi-for-coding-highspeed": { id: "kimi-for-coding-highspeed", name: "Kimi For Coding HighSpeed", api: "anthropic-messages", provider: "kimi-coding", baseUrl: "https://api.kimi.com/coding", headers: { "User-Agent": "KimiCLI/1.5" }, compat: { forceAdaptiveThinking: true }, reasoning: true, input: ["text", "image"], cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/kimi-coding.models.js
var KIMI_CODING_MODELS = flattenModelCatalog("kimi-coding", kimi_coding_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/minimax.json
var minimax_default = { "anthropic-messages": { "MiniMax-M2.7": { id: "MiniMax-M2.7", name: "MiniMax-M2.7", api: "anthropic-messages", provider: "minimax", baseUrl: "https://api.minimax.io/anthropic", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "MiniMax-M2.7-highspeed": { id: "MiniMax-M2.7-highspeed", name: "MiniMax-M2.7-highspeed", api: "anthropic-messages", provider: "minimax", baseUrl: "https://api.minimax.io/anthropic", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "MiniMax-M3": { id: "MiniMax-M3", name: "MiniMax-M3", api: "anthropic-messages", provider: "minimax", baseUrl: "https://api.minimax.io/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/minimax.models.js
var MINIMAX_MODELS = flattenModelCatalog("minimax", minimax_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/minimax-cn.json
var minimax_cn_default = { "anthropic-messages": { "MiniMax-M2.7": { id: "MiniMax-M2.7", name: "MiniMax-M2.7", api: "anthropic-messages", provider: "minimax-cn", baseUrl: "https://api.minimaxi.com/anthropic", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "MiniMax-M2.7-highspeed": { id: "MiniMax-M2.7-highspeed", name: "MiniMax-M2.7-highspeed", api: "anthropic-messages", provider: "minimax-cn", baseUrl: "https://api.minimaxi.com/anthropic", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "MiniMax-M3": { id: "MiniMax-M3", name: "MiniMax-M3", api: "anthropic-messages", provider: "minimax-cn", baseUrl: "https://api.minimaxi.com/anthropic", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/minimax-cn.models.js
var MINIMAX_CN_MODELS = flattenModelCatalog("minimax-cn", minimax_cn_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/mistral.json
var mistral_default = { "mistral-conversations": { "codestral-latest": { id: "codestral-latest", name: "Codestral (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.3, output: 0.9, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 4096 }, "devstral-2512": { id: "devstral-2512", name: "Devstral 2", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "devstral-latest": { id: "devstral-latest", name: "Devstral 2", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "devstral-medium-2507": { id: "devstral-medium-2507", name: "Devstral Medium", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "devstral-medium-latest": { id: "devstral-medium-latest", name: "Devstral 2 (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "devstral-small-2505": { id: "devstral-small-2505", name: "Devstral Small 2505", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "devstral-small-2507": { id: "devstral-small-2507", name: "Devstral Small", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "labs-devstral-small-2512": { id: "labs-devstral-small-2512", name: "Devstral Small 2", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "magistral-medium-latest": { id: "magistral-medium-latest", name: "Magistral Medium (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text"], cost: { input: 2, output: 5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "magistral-small": { id: "magistral-small", name: "Magistral Small", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text"], cost: { input: 0.5, output: 1.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "ministral-3b-latest": { id: "ministral-3b-latest", name: "Ministral 3B (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.04, output: 0.04, cacheRead: 4e-3, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "ministral-8b-latest": { id: "ministral-8b-latest", name: "Ministral 8B (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.1, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "mistral-large-2411": { id: "mistral-large-2411", name: "Mistral Large 2.1", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384 }, "mistral-large-2512": { id: "mistral-large-2512", name: "Mistral Large 3", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-large-latest": { id: "mistral-large-latest", name: "Mistral Large (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-medium-2505": { id: "mistral-medium-2505", name: "Mistral Medium 3", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "mistral-medium-2508": { id: "mistral-medium-2508", name: "Mistral Medium 3.1", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-medium-2604": { id: "mistral-medium-2604", name: "Mistral Medium 3.5", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-medium-3.5": { id: "mistral-medium-3.5", name: "Mistral Medium 3.5", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-medium-latest": { id: "mistral-medium-latest", name: "Mistral Medium (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "mistral-nemo": { id: "mistral-nemo", name: "Mistral Nemo", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.15, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "mistral-small-2506": { id: "mistral-small-2506", name: "Mistral Small 3.2", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "mistral-small-2603": { id: "mistral-small-2603", name: "Mistral Small 4", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral-small-latest": { id: "mistral-small-latest", name: "Mistral Small (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: true, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "open-mistral-7b": { id: "open-mistral-7b", name: "Mistral 7B", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.25, output: 0.25, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 8e3, maxTokens: 8e3 }, "open-mistral-nemo": { id: "open-mistral-nemo", name: "Open Mistral Nemo", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.15, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "open-mixtral-8x22b": { id: "open-mixtral-8x22b", name: "Mixtral 8x22B", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 64e3, maxTokens: 64e3 }, "open-mixtral-8x7b": { id: "open-mixtral-8x7b", name: "Mixtral 8x7B", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text"], cost: { input: 0.7, output: 0.7, cacheRead: 0.07, cacheWrite: 0 }, contextWindow: 32e3, maxTokens: 32e3 }, "pixtral-12b": { id: "pixtral-12b", name: "Pixtral 12B", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.15, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "pixtral-large-latest": { id: "pixtral-large-latest", name: "Pixtral Large (latest)", api: "mistral-conversations", provider: "mistral", baseUrl: "https://api.mistral.ai", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/mistral.models.js
var MISTRAL_MODELS = flattenModelCatalog("mistral", mistral_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/moonshotai.json
var moonshotai_default = { "openai-completions": { "kimi-k2-0711-preview": { id: "kimi-k2-0711-preview", name: "Kimi K2 0711", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-0905-preview": { id: "kimi-k2-0905-preview", name: "Kimi K2 0905", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-thinking": { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-thinking-turbo": { id: "kimi-k2-thinking-turbo", name: "Kimi K2 Thinking Turbo", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text"], cost: { input: 1.15, output: 8, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-turbo-preview": { id: "kimi-k2-turbo-preview", name: "Kimi K2 Turbo", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: false, input: ["text"], cost: { input: 2.4, output: 10, cacheRead: 0.6, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.5": { id: "kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" }, thinkingLevelMap: { off: null } }, "kimi-k2.7-code-highspeed": { id: "kimi-k2.7-code-highspeed", name: "Kimi K2.7 Code HighSpeed", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" }, thinkingLevelMap: { off: null } }, "kimi-k3": { id: "kimi-k3", name: "Kimi K3", api: "openai-completions", provider: "moonshotai", baseUrl: "https://api.moonshot.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "openai", requiresReasoningContentOnAssistantMessages: true, deferredToolsMode: "kimi" }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/moonshotai.models.js
var MOONSHOTAI_MODELS = flattenModelCatalog("moonshotai", moonshotai_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/moonshotai-cn.json
var moonshotai_cn_default = { "openai-completions": { "kimi-k2-0711-preview": { id: "kimi-k2-0711-preview", name: "Kimi K2 0711", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-0905-preview": { id: "kimi-k2-0905-preview", name: "Kimi K2 0905", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-thinking": { id: "kimi-k2-thinking", name: "Kimi K2 Thinking", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-thinking-turbo": { id: "kimi-k2-thinking-turbo", name: "Kimi K2 Thinking Turbo", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text"], cost: { input: 1.15, output: 8, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2-turbo-preview": { id: "kimi-k2-turbo-preview", name: "Kimi K2 Turbo", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: false, input: ["text"], cost: { input: 2.4, output: 10, cacheRead: 0.6, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.5": { id: "kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" } }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" }, thinkingLevelMap: { off: null } }, "kimi-k2.7-code-highspeed": { id: "kimi-k2.7-code-highspeed", name: "Kimi K2.7 Code HighSpeed", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "deepseek" }, thinkingLevelMap: { off: null } }, "kimi-k3": { id: "kimi-k3", name: "Kimi K3", api: "openai-completions", provider: "moonshotai-cn", baseUrl: "https://api.moonshot.cn/v1", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens", supportsStrictMode: false, thinkingFormat: "openai", requiresReasoningContentOnAssistantMessages: true, deferredToolsMode: "kimi" }, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/moonshotai-cn.models.js
var MOONSHOTAI_CN_MODELS = flattenModelCatalog("moonshotai-cn", moonshotai_cn_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/nvidia.json
var nvidia_default = { "openai-completions": { "meta/llama-3.1-70b-instruct": { id: "meta/llama-3.1-70b-instruct", name: "Llama 3.1 70b Instruct", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 4096 }, "meta/llama-3.1-8b-instruct": { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 16e3, maxTokens: 4096 }, "meta/llama-3.2-11b-vision-instruct": { id: "meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11b Vision Instruct", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 4096 }, "meta/llama-3.2-90b-vision-instruct": { id: "meta/llama-3.2-90b-vision-instruct", name: "Llama-3.2-90B-Vision-Instruct", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: false, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 8192 }, "meta/llama-3.3-70b-instruct": { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70b Instruct", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 4096 }, "minimaxai/minimax-m3": { id: "minimaxai/minimax-m3", name: "MiniMax-M3", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 1e6, maxTokens: 16384 }, "mistralai/mistral-small-4-119b-2603": { id: "mistralai/mistral-small-4-119b-2603", name: "mistral-small-4-119b-2603", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 8192 }, "moonshotai/kimi-k2.6": { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 262144 }, "nvidia/nemotron-3-nano-30b-a3b": { id: "nvidia/nemotron-3-nano-30b-a3b", name: "nemotron-3-nano-30b-a3b", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 131072 }, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 256e3, maxTokens: 65536 }, "nvidia/nemotron-3-super-120b-a12b": { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.8, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 262144 }, "nvidia/nemotron-3-ultra-550b-a55b": { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B A55B", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0.5, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 1e6, maxTokens: 65536 }, "nvidia/nvidia-nemotron-nano-9b-v2": { id: "nvidia/nvidia-nemotron-nano-9b-v2", name: "nvidia-nemotron-nano-9b-v2", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 131072 }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "GPT-OSS-120B", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 128e3, maxTokens: 8192 }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 32768 }, "stepfun-ai/step-3.5-flash": { id: "stepfun-ai/step-3.5-flash", name: "Step 3.5 Flash", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 256e3, maxTokens: 16384 }, "stepfun-ai/step-3.7-flash": { id: "stepfun-ai/step-3.7-flash", name: "Step 3.7 Flash", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 256e3, maxTokens: 16384 }, "z-ai/glm-5.2": { id: "z-ai/glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "nvidia", baseUrl: "https://integrate.api.nvidia.com/v1", headers: { "NVCF-POLL-SECONDS": "3600" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 1e6, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/nvidia.models.js
var NVIDIA_MODELS = flattenModelCatalog("nvidia", nvidia_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/openai.json
var openai_default = { "openai-responses": { "gpt-4": { id: "gpt-4", name: "GPT-4", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text"], cost: { input: 30, output: 60, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8192, maxTokens: 8192, compat: { supportsStrictMode: true } }, "gpt-4-turbo": { id: "gpt-4-turbo", name: "GPT-4 Turbo", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "gpt-4.1": { id: "gpt-4.1", name: "GPT-4.1", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { supportsStrictMode: true } }, "gpt-4.1-mini": { id: "gpt-4.1-mini", name: "GPT-4.1 mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { supportsStrictMode: true } }, "gpt-4.1-nano": { id: "gpt-4.1-nano", name: "GPT-4.1 nano", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { supportsStrictMode: true } }, "gpt-4o": { id: "gpt-4o", name: "GPT-4o", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "gpt-4o-2024-05-13": { id: "gpt-4o-2024-05-13", name: "GPT-4o (2024-05-13)", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 5, output: 15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsStrictMode: true } }, "gpt-4o-2024-08-06": { id: "gpt-4o-2024-08-06", name: "GPT-4o (2024-08-06)", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "gpt-4o-2024-11-20": { id: "gpt-4o-2024-11-20", name: "GPT-4o (2024-11-20)", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "gpt-4o-mini": { id: "gpt-4o-mini", name: "GPT-4o mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { supportsStrictMode: true } }, "gpt-5": { id: "gpt-5", name: "GPT-5", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5-chat-latest": { id: "gpt-5-chat-latest", name: "GPT-5 Chat Latest", api: "openai-responses", baseUrl: "https://api.openai.com/v1", provider: "openai", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5-mini": { id: "gpt-5-mini", name: "GPT-5 Mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5-nano": { id: "gpt-5-nano", name: "GPT-5 Nano", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.05, output: 0.4, cacheRead: 5e-3, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5-pro": { id: "gpt-5-pro", name: "GPT-5 Pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 120, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.1": { id: "gpt-5.1", name: "GPT-5.1", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.2": { id: "gpt-5.2", name: "GPT-5.2", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.2-chat-latest": { id: "gpt-5.2-chat-latest", name: "GPT-5.2 Chat", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: null, xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.2-pro": { id: "gpt-5.2-pro", name: "GPT-5.2 Pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 21, output: 168, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.3-chat-latest": { id: "gpt-5.3-chat-latest", name: "GPT-5.3 Chat (latest)", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: false, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { off: null, xhigh: "xhigh" }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.3-codex-spark": { id: "gpt-5.3-codex-spark", name: "GPT-5.3 Codex Spark", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 0 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.4-mini": { id: "gpt-5.4-mini", name: "GPT-5.4 mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.4-nano": { id: "gpt-5.4-nano", name: "GPT-5.4 nano", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.4-pro": { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 60, output: 270, cacheRead: 0, cacheWrite: 0 }] }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 0 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.5-pro": { id: "gpt-5.5-pro", name: "GPT-5.5 Pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 60, output: 270, cacheRead: 0, cacheWrite: 0 }] }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25, tiers: [{ inputTokensAbove: 272e3, input: 2, output: 9, cacheRead: 0.2, cacheWrite: 2.5 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true, supportsExplicitPromptCacheMode: true } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 12.5 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true, supportsExplicitPromptCacheMode: true } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 6.25 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" }, compat: { supportsStrictMode: true, supportsOpenAIGrammarTools: true, supportsToolSearch: true, supportsExplicitPromptCacheMode: true } }, "gpt-realtime-2.1": { id: "gpt-realtime-2.1", name: "GPT-Realtime-2.1", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 4, output: 24, cacheRead: 0.4, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 32e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null }, compat: { supportsStrictMode: true } }, o1: { id: "o1", name: "o1", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } }, "o1-pro": { id: "o1-pro", name: "o1-pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 150, output: 600, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } }, o3: { id: "o3", name: "o3", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } }, "o3-mini": { id: "o3-mini", name: "o3-mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } }, "o3-pro": { id: "o3-pro", name: "o3-pro", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 20, output: 80, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } }, "o4-mini": { id: "o4-mini", name: "o4-mini", api: "openai-responses", provider: "openai", baseUrl: "https://api.openai.com/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, compat: { supportsStrictMode: true } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openai.models.js
var OPENAI_MODELS = flattenModelCatalog("openai", openai_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/openai-codex.json
var openai_codex_default = { "openai-codex-responses": { "gpt-5.3-codex-spark": { id: "gpt-5.3-codex-spark", name: "GPT-5.3 Codex Spark", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 0 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.4-mini": { id: "gpt-5.4-mini", name: "GPT-5.4 mini", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 0 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25, tiers: [{ inputTokensAbove: 272e3, input: 2, output: 9, cacheRead: 0.2, cacheWrite: 2.5 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25, tiers: [{ inputTokensAbove: 272e3, input: 10, output: 45, cacheRead: 1, cacheWrite: 12.5 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "openai-codex-responses", provider: "openai-codex", baseUrl: "https://chatgpt.com/backend-api", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125, tiers: [{ inputTokensAbove: 272e3, input: 5, output: 22.5, cacheRead: 0.5, cacheWrite: 6.25 }] }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max", minimal: "low" }, compat: { supportsOpenAIGrammarTools: true, supportsToolSearch: true } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openai-codex.models.js
var OPENAI_CODEX_MODELS = flattenModelCatalog("openai-codex", openai_codex_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/opencode.json
var opencode_default = { "anthropic-messages": { "claude-fable-5": { id: "claude-fable-5", name: "Claude Fable 5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true } }, "claude-haiku-4-5": { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3 }, "claude-opus-4-1": { id: "claude-opus-4-1", name: "Claude Opus 4.1", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3 }, "claude-opus-4-5": { id: "claude-opus-4-5", name: "Claude Opus 4.5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3 }, "claude-opus-4-6": { id: "claude-opus-4-6", name: "Claude Opus 4.6", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true } }, "claude-opus-4-7": { id: "claude-opus-4-7", name: "Claude Opus 4.7", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-opus-4-8": { id: "claude-opus-4-8", name: "Claude Opus 4.8", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-opus-5": { id: "claude-opus-5", name: "Claude Opus 5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "claude-sonnet-4": { id: "claude-sonnet-4", name: "Claude Sonnet 4", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3 }, "claude-sonnet-4-5": { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3 }, "claude-sonnet-4-6": { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true } }, "claude-sonnet-5": { id: "claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true } }, "qwen3.5-plus": { id: "qwen3.5-plus", name: "Qwen3.5 Plus", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.2, cacheRead: 0.02, cacheWrite: 0.25 }, contextWindow: 262144, maxTokens: 65536 }, "qwen3.6-plus": { id: "qwen3.6-plus", name: "Qwen3.6 Plus", api: "anthropic-messages", provider: "opencode", baseUrl: "https://opencode.ai/zen", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0.625 }, contextWindow: 262144, maxTokens: 65536 } }, "google-generative-ai": { "gemini-3-flash": { id: "gemini-3-flash", name: "Gemini 3 Flash", api: "google-generative-ai", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.1-pro": { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro Preview", api: "google-generative-ai", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null, minimal: null, low: "LOW", medium: null, high: "HIGH" } }, "gemini-3.5-flash": { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "google-generative-ai", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.5-flash-lite": { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", api: "google-generative-ai", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } }, "gemini-3.6-flash": { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", api: "google-generative-ai", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536, thinkingLevelMap: { off: null } } }, "openai-completions": { "big-pickle": { id: "big-pickle", name: "Big Pickle", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 2e5, maxTokens: 32e3 }, "deepseek-v4-flash": { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 0.028, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false, requiresReasoningContentOnAssistantMessages: true }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: "max" } }, "deepseek-v4-flash-free": { id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", requiresReasoningContentOnAssistantMessages: true }, contextWindow: 2e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: "max" } }, "deepseek-v4-pro": { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 1.74, output: 3.84, cacheRead: 0.145, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false, requiresReasoningContentOnAssistantMessages: true }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: "max" } }, "glm-5": { id: "glm-5", name: "GLM-5", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 1, output: 3.2, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 204800, maxTokens: 131072 }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 204800, maxTokens: 131072 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1e6, maxTokens: 131072, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: "max" } }, "grok-build-0.1": { id: "grok-build-0.1", name: "Grok Build 0.1", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 2, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens" }, contextWindow: 256e3, maxTokens: 256e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null } }, "kimi-k2.5": { id: "kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.08, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 65536 }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, thinkingFormat: "deepseek", supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 65536 }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 262144, maxTokens: 262144 }, "laguna-s-2.1-free": { id: "laguna-s-2.1-free", name: "Laguna S 2.1 Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 256e3, maxTokens: 32e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "ling-3.0-flash-free": { id: "ling-3.0-flash-free", name: "Ling-3.0-flash Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 262144, maxTokens: 32768, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "mimo-v2.5-free": { id: "mimo-v2.5-free", name: "MiMo V2.5 Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 2e5, maxTokens: 32e3 }, "minimax-m2.5": { id: "minimax-m2.5", name: "MiniMax-M2.5", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 204800, maxTokens: 131072 }, "minimax-m2.7": { id: "minimax-m2.7", name: "MiniMax-M2.7", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false }, contextWindow: 204800, maxTokens: 131072 }, "minimax-m3": { id: "minimax-m3", name: "MiniMax-M3", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 512e3, maxTokens: 128e3 }, "nemotron-3-ultra-free": { id: "nemotron-3-ultra-free", name: "Nemotron 3 Ultra Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1e6, maxTokens: 128e3 }, "north-mini-code-free": { id: "north-mini-code-free", name: "North Mini Code Free", api: "openai-completions", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 256e3, maxTokens: 64e3, thinkingLevelMap: { off: "none", minimal: null, low: null, medium: null, high: "high", xhigh: null, max: null } } }, "openai-responses": { "gpt-5": { id: "gpt-5", name: "GPT-5", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5-codex": { id: "gpt-5-codex", name: "GPT-5 Codex", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5-nano": { id: "gpt-5-nano", name: "GPT-5 Nano", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.05, output: 0.4, cacheRead: 5e-3, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5.1": { id: "gpt-5.1", name: "GPT-5.1", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5.1-codex": { id: "gpt-5.1-codex", name: "GPT-5.1 Codex", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.07, output: 8.5, cacheRead: 0.107, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5.1-codex-max": { id: "gpt-5.1-codex-max", name: "GPT-5.1 Codex Max", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.1-codex-mini": { id: "gpt-5.1-codex-mini", name: "GPT-5.1 Codex Mini", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } }, "gpt-5.2": { id: "gpt-5.2", name: "GPT-5.2", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.2-codex": { id: "gpt-5.2-codex", name: "GPT-5.2 Codex", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 272e3, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.4-mini": { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.4-nano": { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.4-pro": { id: "gpt-5.4-pro", name: "GPT-5.4 Pro", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 30, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.5": { id: "gpt-5.5", name: "GPT-5.5", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.5-pro": { id: "gpt-5.5-pro", name: "GPT-5.5 Pro", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 30, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: null, medium: "medium", high: "high", xhigh: "xhigh", max: null } }, "gpt-5.6-luna": { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" } }, "gpt-5.6-sol": { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" } }, "gpt-5.6-terra": { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, compat: { sessionAffinityFormat: "openai-nosession", supportsOpenAIGrammarTools: true }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" } }, "grok-4.5": { id: "grok-4.5", name: "Grok 4.5", api: "openai-responses", provider: "opencode", baseUrl: "https://opencode.ai/zen/v1", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.5, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession" }, contextWindow: 5e5, maxTokens: 5e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/opencode.models.js
var OPENCODE_MODELS = flattenModelCatalog("opencode", opencode_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/opencode-go.json
var opencode_go_default = { "anthropic-messages": { "minimax-m3": { id: "minimax-m3", name: "MiniMax-M3", api: "anthropic-messages", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "qwen3.7-max": { id: "qwen3.7-max", name: "Qwen3.7 Max", api: "anthropic-messages", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go", reasoning: true, input: ["text"], cost: { input: 2.5, output: 7.5, cacheRead: 0.5, cacheWrite: 3.125 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.7-plus": { id: "qwen3.7-plus", name: "Qwen3.7 Plus", api: "anthropic-messages", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.04, cacheWrite: 0.5 }, contextWindow: 1e6, maxTokens: 65536 } }, "openai-completions": { "deepseek-v4-flash": { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "deepseek-v4-pro": { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 3625e-6, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens", requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 202752, maxTokens: 32768 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1e6, maxTokens: 131072, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: "high", xhigh: null, max: "max" } }, hy3: { id: "hy3", name: "Hy3", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.58, cacheRead: 0.035, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 256e3, maxTokens: 64e3, thinkingLevelMap: { off: "none", minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: null } }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, thinkingFormat: "deepseek", supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 65536, thinkingLevelMap: { minimal: null, low: null, medium: null } }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 262144, maxTokens: 262144 }, "kimi-k3": { id: "kimi-k3", name: "Kimi K3 (2x usage)", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1048576, maxTokens: 131072, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null, high: null, xhigh: null, max: "max" } }, "mimo-v2.5": { id: "mimo-v2.5", name: "MiMo V2.5", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1e6, maxTokens: 128e3 }, "mimo-v2.5-pro": { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 3625e-6, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 1048576, maxTokens: 128e3 }, "minimax-m2.7": { id: "minimax-m2.7", name: "MiniMax-M2.7", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, maxTokensField: "max_tokens" }, contextWindow: 204800, maxTokens: 131072 }, "qwen3.6-plus": { id: "qwen3.6-plus", name: "Qwen3.6 Plus", api: "openai-completions", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0.625 }, compat: { supportsStore: false, supportsDeveloperRole: false, thinkingFormat: "qwen", maxTokensField: "max_tokens" }, contextWindow: 1e6, maxTokens: 65536 } }, "openai-responses": { "grok-4.5": { id: "grok-4.5", name: "Grok 4.5", api: "openai-responses", provider: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.5, cacheWrite: 0 }, compat: { sessionAffinityFormat: "openai-nosession" }, contextWindow: 5e5, maxTokens: 5e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/opencode-go.models.js
var OPENCODE_GO_MODELS = flattenModelCatalog("opencode-go", opencode_go_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/openrouter.json
var openrouter_default = { "openai-completions": { "ai21/jamba-large-1.7": { id: "ai21/jamba-large-1.7", name: "AI21: Jamba Large 1.7", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2, output: 8, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "aion-labs/aion-2.0": { id: "aion-labs/aion-2.0", name: "AionLabs: Aion-2.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.8, output: 1.6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "aion-labs/aion-3.0": { id: "aion-labs/aion-3.0", name: "AionLabs: Aion-3.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 3, output: 6, cacheRead: 0.75, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "aion-labs/aion-3.0-mini": { id: "aion-labs/aion-3.0-mini", name: "AionLabs: Aion-3.0-Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.7, output: 1.4, cacheRead: 0.18, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "amazon/nova-2-lite-v1": { id: "amazon/nova-2-lite-v1", name: "Amazon: Nova 2 Lite", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65535, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "amazon/nova-lite-v1": { id: "amazon/nova-lite-v1", name: "Amazon: Nova Lite 1.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.06, output: 0.24, cacheRead: 0, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 5120, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "amazon/nova-micro-v1": { id: "amazon/nova-micro-v1", name: "Amazon: Nova Micro 1.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.035, output: 0.14, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 5120, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "amazon/nova-premier-v1": { id: "amazon/nova-premier-v1", name: "Amazon: Nova Premier 1.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 12.5, cacheRead: 0.625, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 32e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "amazon/nova-pro-v1": { id: "amazon/nova-pro-v1", name: "Amazon: Nova Pro 1.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 3.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 5120, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "anthropic/claude-3-haiku": { id: "anthropic/claude-3-haiku", name: "Anthropic: Claude 3 Haiku", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 }, contextWindow: 2e5, maxTokens: 4096, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-fable-5": { id: "anthropic/claude-fable-5", name: "Anthropic: Claude Fable 5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" } }, "anthropic/claude-haiku-4.5": { id: "anthropic/claude-haiku-4.5", name: "Anthropic: Claude Haiku 4.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-opus-4": { id: "anthropic/claude-opus-4", name: "Anthropic: Claude Opus 4", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-opus-4.1": { id: "anthropic/claude-opus-4.1", name: "Anthropic: Claude Opus 4.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-opus-4.5": { id: "anthropic/claude-opus-4.5", name: "Anthropic: Claude Opus 4.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-opus-4.6": { id: "anthropic/claude-opus-4.6", name: "Anthropic: Claude Opus 4.6", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { max: "max" } }, "anthropic/claude-opus-4.7": { id: "anthropic/claude-opus-4.7", name: "Anthropic: Claude Opus 4.7", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-opus-4.7-fast": { id: "anthropic/claude-opus-4.7-fast", name: "Anthropic: Claude Opus 4.7 (Fast)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 150, cacheRead: 3, cacheWrite: 37.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-opus-4.8": { id: "anthropic/claude-opus-4.8", name: "Anthropic: Claude Opus 4.8", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-opus-4.8-fast": { id: "anthropic/claude-opus-4.8-fast", name: "Anthropic: Claude Opus 4.8 (Fast)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-opus-5": { id: "anthropic/claude-opus-5", name: "Claude Opus 5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-opus-5-fast": { id: "anthropic/claude-opus-5-fast", name: "Claude Opus 5 (Fast)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "anthropic/claude-sonnet-4": { id: "anthropic/claude-sonnet-4", name: "Anthropic: Claude Sonnet 4", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 2e5, maxTokens: 64e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-sonnet-4.5": { id: "anthropic/claude-sonnet-4.5", name: "Anthropic: Claude Sonnet 4.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "anthropic/claude-sonnet-4.6": { id: "anthropic/claude-sonnet-4.6", name: "Anthropic: Claude Sonnet 4.6", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { max: "max" } }, "anthropic/claude-sonnet-5": { id: "anthropic/claude-sonnet-5", name: "Anthropic: Claude Sonnet 5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { thinkingFormat: "openrouter", cacheControlFormat: "anthropic" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "arcee-ai/trinity-large-thinking": { id: "arcee-ai/trinity-large-thinking", name: "Arcee AI: Trinity Large Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.22, output: 0.85, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "arcee-ai/virtuoso-large": { id: "arcee-ai/virtuoso-large", name: "Arcee AI: Virtuoso Large", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.75, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 64e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, auto: { id: "auto", name: "Auto", api: "openai-completions", provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 3e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "bytedance-seed/seed-1.6": { id: "bytedance-seed/seed-1.6", name: "ByteDance Seed: Seed 1.6", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "bytedance-seed/seed-1.6-flash": { id: "bytedance-seed/seed-1.6-flash", name: "ByteDance Seed: Seed 1.6 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.075, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "bytedance-seed/seed-2.0-lite": { id: "bytedance-seed/seed-2.0-lite", name: "ByteDance Seed: Seed-2.0-Lite", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "bytedance-seed/seed-2.0-mini": { id: "bytedance-seed/seed-2.0-mini", name: "ByteDance Seed: Seed-2.0-Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "cohere/command-r-08-2024": { id: "cohere/command-r-08-2024", name: "Cohere: Command R (08-2024)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "cohere/command-r-plus-08-2024": { id: "cohere/command-r-plus-08-2024", name: "Cohere: Command R+ (08-2024)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2.5, output: 10, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "cohere/north-mini-code:free": { id: "cohere/north-mini-code:free", name: "Cohere: North Mini Code (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 64e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-chat": { id: "deepseek/deepseek-chat", name: "DeepSeek: DeepSeek V3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.2002, output: 0.8001, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-chat-v3-0324": { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek: DeepSeek V3 0324", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.27, output: 1.12, cacheRead: 0.135, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-chat-v3.1": { id: "deepseek/deepseek-chat-v3.1", name: "DeepSeek: DeepSeek V3.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.95, cacheRead: 0.13, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-r1": { id: "deepseek/deepseek-r1", name: "DeepSeek: R1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.7, output: 2.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 64e3, maxTokens: 16e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-r1-0528": { id: "deepseek/deepseek-r1-0528", name: "DeepSeek: R1 0528", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.5, output: 2.15, cacheRead: 0.35, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-v3.1-terminus": { id: "deepseek/deepseek-v3.1-terminus", name: "DeepSeek: DeepSeek V3.1 Terminus", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.27, output: 1, cacheRead: 0.135, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-v3.2": { id: "deepseek/deepseek-v3.2", name: "DeepSeek: DeepSeek V3.2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.269, output: 0.4, cacheRead: 0.1345, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-v3.2-exp": { id: "deepseek/deepseek-v3.2-exp", name: "DeepSeek: DeepSeek V3.2 Exp", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.27, output: 0.41, cacheRead: 0, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "deepseek/deepseek-v4-flash": { id: "deepseek/deepseek-v4-flash", name: "DeepSeek: DeepSeek V4 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.0938, output: 0.1876, cacheRead: 0.01876, cacheWrite: 0 }, contextWindow: 1048575, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", requiresReasoningContentOnAssistantMessages: true }, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: null, xhigh: "xhigh" } }, "deepseek/deepseek-v4-pro": { id: "deepseek/deepseek-v4-pro", name: "DeepSeek: DeepSeek V4 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 3625e-6, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 384e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", requiresReasoningContentOnAssistantMessages: true }, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: null, xhigh: "xhigh" } }, "google/gemini-2.5-flash": { id: "google/gemini-2.5-flash", name: "Google: Gemini 2.5 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65535, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-2.5-flash-lite": { id: "google/gemini-2.5-flash-lite", name: "Google: Gemini 2.5 Flash Lite", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.01, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65535, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-2.5-pro": { id: "google/gemini-2.5-pro", name: "Google: Gemini 2.5 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-2.5-pro-preview": { id: "google/gemini-2.5-pro-preview", name: "Google: Gemini 2.5 Pro Preview 06-05", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-2.5-pro-preview-05-06": { id: "google/gemini-2.5-pro-preview-05-06", name: "Google: Gemini 2.5 Pro Preview 05-06", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65535, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3-flash-preview": { id: "google/gemini-3-flash-preview", name: "Google: Gemini 3 Flash Preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65535, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3-pro-image": { id: "google/gemini-3-pro-image", name: "Google: Nano Banana Pro (Gemini 3 Pro Image)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0.375 }, contextWindow: 65536, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.1-flash-lite": { id: "google/gemini-3.1-flash-lite", name: "Google: Gemini 3.1 Flash Lite", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.1-flash-lite-preview": { id: "google/gemini-3.1-flash-lite-preview", name: "Google: Gemini 3.1 Flash Lite Preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.025, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.1-pro-preview": { id: "google/gemini-3.1-pro-preview", name: "Google: Gemini 3.1 Pro Preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.1-pro-preview-customtools": { id: "google/gemini-3.1-pro-preview-customtools", name: "Google: Gemini 3.1 Pro Preview Custom Tools", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.5-flash": { id: "google/gemini-3.5-flash", name: "Google: Gemini 3.5 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.5-flash-lite": { id: "google/gemini-3.5-flash-lite", name: "Google: Gemini 3.5 Flash Lite", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemini-3.6-flash": { id: "google/gemini-3.6-flash", name: "Google: Gemini 3.6 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-3-12b-it": { id: "google/gemma-3-12b-it", name: "Google: Gemma 3 12B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.05, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-3-27b-it": { id: "google/gemma-3-27b-it", name: "Google: Gemma 3 27B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.08, output: 0.45, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-4-26b-a4b-it": { id: "google/gemma-4-26b-a4b-it", name: "Google: Gemma 4 26B A4B ", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.12, output: 0.35, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-4-26b-a4b-it:free": { id: "google/gemma-4-26b-a4b-it:free", name: "Google: Gemma 4 26B A4B  (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-4-31b-it": { id: "google/gemma-4-31b-it", name: "Google: Gemma 4 31B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "google/gemma-4-31b-it:free": { id: "google/gemma-4-31b-it:free", name: "Google: Gemma 4 31B (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "ibm-granite/granite-4.1-8b": { id: "ibm-granite/granite-4.1-8b", name: "IBM: Granite 4.1 8B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.05, output: 0.1, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "inception/mercury-2": { id: "inception/mercury-2", name: "Inception: Mercury 2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.75, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 5e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" }, thinkingLevelMap: { off: null } }, "inclusionai/ling-2.6-1t": { id: "inclusionai/ling-2.6-1t", name: "inclusionAI: Ling-2.6-1T", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.075, output: 0.625, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "inclusionai/ling-2.6-flash": { id: "inclusionai/ling-2.6-flash", name: "inclusionAI: Ling-2.6-flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.01, output: 0.03, cacheRead: 2e-3, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "inclusionai/ling-3.0-flash:free": { id: "inclusionai/ling-3.0-flash:free", name: "Ling-3.0-flash (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "inclusionai/ring-2.6-1t": { id: "inclusionai/ring-2.6-1t", name: "inclusionAI: Ring-2.6-1T", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.075, output: 0.625, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "kwaipilot/kat-coder-air-v2.5": { id: "kwaipilot/kat-coder-air-v2.5", name: "Kwaipilot: KAT-Coder-Air V2.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "kwaipilot/kat-coder-pro-v2": { id: "kwaipilot/kat-coder-pro-v2", name: "Kwaipilot: KAT-Coder-Pro V2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "kwaipilot/kat-coder-pro-v2.5": { id: "kwaipilot/kat-coder-pro-v2.5", name: "Kwaipilot: KAT-Coder-Pro V2.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.74, output: 2.96, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meituan/longcat-2.0": { id: "meituan/longcat-2.0", name: "Meituan: LongCat 2.0", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 6e-3, cacheWrite: 0 }, contextWindow: 1048756, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta-llama/llama-3.1-70b-instruct": { id: "meta-llama/llama-3.1-70b-instruct", name: "Meta: Llama 3.1 70B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.4, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta-llama/llama-3.1-8b-instruct": { id: "meta-llama/llama-3.1-8b-instruct", name: "Meta: Llama 3.1 8B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.05, output: 0.08, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta-llama/llama-3.3-70b-instruct": { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta: Llama 3.3 70B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.13, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta-llama/llama-4-maverick": { id: "meta-llama/llama-4-maverick", name: "Meta: Llama 4 Maverick", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.2, output: 0.8, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta-llama/llama-4-scout": { id: "meta-llama/llama-4-scout", name: "Meta: Llama 4 Scout", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 327680, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "meta/muse-spark-1.1": { id: "meta/muse-spark-1.1", name: "Meta: Muse Spark 1.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 4.25, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m1": { id: "minimax/minimax-m1", name: "MiniMax: MiniMax M1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.55, output: 2.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 4e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m2": { id: "minimax/minimax-m2", name: "MiniMax: MiniMax M2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.255, output: 1.02, cacheRead: 0, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m2.1": { id: "minimax/minimax-m2.1", name: "MiniMax: MiniMax M2.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m2.5": { id: "minimax/minimax-m2.5", name: "MiniMax: MiniMax M2.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.9, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 196608, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m2.7": { id: "minimax/minimax-m2.7", name: "MiniMax: MiniMax M2.7", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.25, output: 1, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "minimax/minimax-m3": { id: "minimax/minimax-m3", name: "MiniMax: MiniMax M3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 524288, maxTokens: 512e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/codestral-2508": { id: "mistralai/codestral-2508", name: "Mistral: Codestral 2508", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.3, output: 0.9, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/devstral-2512": { id: "mistralai/devstral-2512", name: "Mistral: Devstral 2 2512", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/ministral-14b-2512": { id: "mistralai/ministral-14b-2512", name: "Mistral: Ministral 3 14B 2512", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.2, output: 0.2, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/ministral-3b-2512": { id: "mistralai/ministral-3b-2512", name: "Mistral: Ministral 3 3B 2512", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.1, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/ministral-8b-2512": { id: "mistralai/ministral-8b-2512", name: "Mistral: Ministral 3 8B 2512", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.15, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-large": { id: "mistralai/mistral-large", name: "Mistral Large", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-large-2407": { id: "mistralai/mistral-large-2407", name: "Mistral Large 2407", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-large-2512": { id: "mistralai/mistral-large-2512", name: "Mistral: Mistral Large 3 2512", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-medium-3": { id: "mistralai/mistral-medium-3", name: "Mistral: Mistral Medium 3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-medium-3-5": { id: "mistralai/mistral-medium-3-5", name: "Mistral: Mistral Medium 3.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-medium-3.1": { id: "mistralai/mistral-medium-3.1", name: "Mistral: Mistral Medium 3.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 2, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-nemo": { id: "mistralai/mistral-nemo", name: "Mistral: Mistral Nemo", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.019, output: 0.03, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-saba": { id: "mistralai/mistral-saba", name: "Mistral: Saba", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.2, output: 0.6, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-small-2603": { id: "mistralai/mistral-small-2603", name: "Mistral: Mistral Small 4", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mistral-small-3.2-24b-instruct": { id: "mistralai/mistral-small-3.2-24b-instruct", name: "Mistral: Mistral Small 3.2 24B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/mixtral-8x22b-instruct": { id: "mistralai/mixtral-8x22b-instruct", name: "Mistral: Mixtral 8x22B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2, output: 6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 65536, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "mistralai/voxtral-small-24b-2507": { id: "mistralai/voxtral-small-24b-2507", name: "Mistral: Voxtral Small 24B 2507", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 32e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k2": { id: "moonshotai/kimi-k2", name: "MoonshotAI: Kimi K2 0711", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.57, output: 2.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 100352, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k2-0905": { id: "moonshotai/kimi-k2-0905", name: "MoonshotAI: Kimi K2 0905", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 100352, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k2-thinking": { id: "moonshotai/kimi-k2-thinking", name: "MoonshotAI: Kimi K2 Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 100352, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k2.5": { id: "moonshotai/kimi-k2.5", name: "MoonshotAI: Kimi K2.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.41, output: 2.06, cacheRead: 0.07, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k2.6": { id: "moonshotai/kimi-k2.6", name: "MoonshotAI: Kimi K2.6", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.646, output: 2.72, cacheRead: 0.1088, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", requiresReasoningContentOnAssistantMessages: true } }, "moonshotai/kimi-k2.7-code": { id: "moonshotai/kimi-k2.7-code", name: "MoonshotAI: Kimi K2.7 Code", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.78, output: 3.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "moonshotai/kimi-k3": { id: "moonshotai/kimi-k3", name: "MoonshotAI: Kimi K3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nex-agi/nex-n2-mini": { id: "nex-agi/nex-n2-mini", name: "Nex AGI: Nex-N2-Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.025, output: 0.1, cacheRead: 25e-4, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nex-agi/nex-n2-pro": { id: "nex-agi/nex-n2-pro", name: "Nex AGI: Nex-N2-Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-nano-30b-a3b": { id: "nvidia/nemotron-3-nano-30b-a3b", name: "NVIDIA: Nemotron 3 Nano 30B A3B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.05, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 228e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-nano-30b-a3b:free": { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA: Nemotron 3 Nano 30B A3B (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "NVIDIA: Nemotron 3 Nano Omni (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-super-120b-a12b": { id: "nvidia/nemotron-3-super-120b-a12b", name: "NVIDIA: Nemotron 3 Super", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.085, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-super-120b-a12b:free": { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "NVIDIA: Nemotron 3 Super (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-ultra-550b-a55b": { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "NVIDIA: Nemotron 3 Ultra", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.6, output: 3.6, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 512288, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-3-ultra-550b-a55b:free": { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "NVIDIA: Nemotron 3 Ultra (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-nano-12b-v2-vl:free": { id: "nvidia/nemotron-nano-12b-v2-vl:free", name: "NVIDIA: Nemotron Nano 12B 2 VL (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "nvidia/nemotron-nano-9b-v2:free": { id: "nvidia/nemotron-nano-9b-v2:free", name: "NVIDIA: Nemotron Nano 9B V2 (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "openai/gpt-3.5-turbo": { id: "openai/gpt-3.5-turbo", name: "OpenAI: GPT-3.5 Turbo", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16385, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-3.5-turbo-0613": { id: "openai/gpt-3.5-turbo-0613", name: "OpenAI: GPT-3.5 Turbo (older v0613)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4095, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-3.5-turbo-16k": { id: "openai/gpt-3.5-turbo-16k", name: "OpenAI: GPT-3.5 Turbo 16k", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 3, output: 4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16385, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4": { id: "openai/gpt-4", name: "OpenAI: GPT-4", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 30, output: 60, cacheRead: 0, cacheWrite: 0 }, contextWindow: 8191, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4-turbo": { id: "openai/gpt-4-turbo", name: "OpenAI: GPT-4 Turbo", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4-turbo-preview": { id: "openai/gpt-4-turbo-preview", name: "OpenAI: GPT-4 Turbo Preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4.1": { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4.1-mini": { id: "openai/gpt-4.1-mini", name: "OpenAI: GPT-4.1 Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4.1-nano": { id: "openai/gpt-4.1-nano", name: "OpenAI: GPT-4.1 Nano", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o": { id: "openai/gpt-4o", name: "OpenAI: GPT-4o", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o-2024-05-13": { id: "openai/gpt-4o-2024-05-13", name: "OpenAI: GPT-4o (2024-05-13)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 5, output: 15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o-2024-08-06": { id: "openai/gpt-4o-2024-08-06", name: "OpenAI: GPT-4o (2024-08-06)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o-2024-11-20": { id: "openai/gpt-4o-2024-11-20", name: "OpenAI: GPT-4o (2024-11-20)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o-mini": { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o-mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-4o-mini-2024-07-18": { id: "openai/gpt-4o-mini-2024-07-18", name: "OpenAI: GPT-4o-mini (2024-07-18)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5": { id: "openai/gpt-5", name: "OpenAI: GPT-5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5-codex": { id: "openai/gpt-5-codex", name: "OpenAI: GPT-5 Codex", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5-mini": { id: "openai/gpt-5-mini", name: "OpenAI: GPT-5 Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5-nano": { id: "openai/gpt-5-nano", name: "OpenAI: GPT-5 Nano", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.05, output: 0.4, cacheRead: 5e-3, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5-pro": { id: "openai/gpt-5-pro", name: "OpenAI: GPT-5 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 120, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.1": { id: "openai/gpt-5.1", name: "OpenAI: GPT-5.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.1-chat": { id: "openai/gpt-5.1-chat", name: "OpenAI: GPT-5.1 Chat", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.1-codex": { id: "openai/gpt-5.1-codex", name: "OpenAI: GPT-5.1-Codex", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.1-codex-max": { id: "openai/gpt-5.1-codex-max", name: "OpenAI: GPT-5.1-Codex-Max", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.1-codex-mini": { id: "openai/gpt-5.1-codex-mini", name: "OpenAI: GPT-5.1-Codex-Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-5.2": { id: "openai/gpt-5.2", name: "OpenAI: GPT-5.2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.2-chat": { id: "openai/gpt-5.2-chat", name: "OpenAI: GPT-5.2 Chat", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.2-codex": { id: "openai/gpt-5.2-codex", name: "OpenAI: GPT-5.2-Codex", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.2-pro": { id: "openai/gpt-5.2-pro", name: "OpenAI: GPT-5.2 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 21, output: 168, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.3-chat": { id: "openai/gpt-5.3-chat", name: "OpenAI: GPT-5.3 Chat", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.3-codex": { id: "openai/gpt-5.3-codex", name: "OpenAI: GPT-5.3-Codex", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4": { id: "openai/gpt-5.4", name: "OpenAI: GPT-5.4", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-mini": { id: "openai/gpt-5.4-mini", name: "OpenAI: GPT-5.4 Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-nano": { id: "openai/gpt-5.4-nano", name: "OpenAI: GPT-5.4 Nano", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-pro": { id: "openai/gpt-5.4-pro", name: "OpenAI: GPT-5.4 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.5": { id: "openai/gpt-5.5", name: "OpenAI: GPT-5.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.5-pro": { id: "openai/gpt-5.5-pro", name: "OpenAI: GPT-5.5 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", off: null, minimal: null, low: null } }, "openai/gpt-5.6-luna": { id: "openai/gpt-5.6-luna", name: "OpenAI: GPT-5.6 Luna", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-5.6-luna-pro": { id: "openai/gpt-5.6-luna-pro", name: "OpenAI: GPT-5.6 Luna Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-5.6-sol": { id: "openai/gpt-5.6-sol", name: "OpenAI: GPT-5.6 Sol", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-5.6-sol-pro": { id: "openai/gpt-5.6-sol-pro", name: "OpenAI: GPT-5.6 Sol Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-5.6-terra": { id: "openai/gpt-5.6-terra", name: "OpenAI: GPT-5.6 Terra", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-5.6-terra-pro": { id: "openai/gpt-5.6-terra-pro", name: "OpenAI: GPT-5.6 Terra Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, contextWindow: 105e4, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh", max: "max" } }, "openai/gpt-audio": { id: "openai/gpt-audio", name: "OpenAI: GPT Audio", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 2.5, output: 10, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-audio-mini": { id: "openai/gpt-audio-mini", name: "OpenAI: GPT Audio Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-chat-latest": { id: "openai/gpt-chat-latest", name: "OpenAI: GPT Chat Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "OpenAI: gpt-oss-120b", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.037, output: 0.17, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "OpenAI: gpt-oss-20b", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.03, output: 0.13, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-oss-20b:free": { id: "openai/gpt-oss-20b:free", name: "OpenAI: gpt-oss-20b (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { thinkingFormat: "openrouter" } }, "openai/gpt-oss-safeguard-20b": { id: "openai/gpt-oss-safeguard-20b", name: "OpenAI: gpt-oss-safeguard-20b", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.075, output: 0.3, cacheRead: 0.0375, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536, compat: { thinkingFormat: "openrouter" } }, "openai/o1": { id: "openai/o1", name: "OpenAI: o1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o3": { id: "openai/o3", name: "OpenAI: o3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o3-deep-research": { id: "openai/o3-deep-research", name: "OpenAI: o3 Deep Research", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 40, cacheRead: 2.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o3-mini": { id: "openai/o3-mini", name: "OpenAI: o3 Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o3-mini-high": { id: "openai/o3-mini-high", name: "OpenAI: o3 Mini High", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o3-pro": { id: "openai/o3-pro", name: "OpenAI: o3 Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 20, output: 80, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o4-mini": { id: "openai/o4-mini", name: "OpenAI: o4 Mini", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o4-mini-deep-research": { id: "openai/o4-mini-deep-research", name: "OpenAI: o4 Mini Deep Research", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openai/o4-mini-high": { id: "openai/o4-mini-high", name: "OpenAI: o4 Mini High", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5, compat: { thinkingFormat: "openrouter" } }, "openrouter/auto": { id: "openrouter/auto", name: "Auto Router", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: -1e6, output: -1e6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "openrouter/auto-beta": { id: "openrouter/auto-beta", name: "Auto Router (Beta)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: -1e6, output: -1e6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "openrouter/free": { id: "openrouter/free", name: "Free Models Router", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "openrouter/fusion": { id: "openrouter/fusion", name: "OpenRouter: Fusion", api: "openai-completions", provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 3e4, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-m.1": { id: "poolside/laguna-m.1", name: "Poolside: Laguna M.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.2, output: 0.4, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-m.1:free": { id: "poolside/laguna-m.1:free", name: "Poolside: Laguna M.1 (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-s-2.1": { id: "poolside/laguna-s-2.1", name: "Poolside: Laguna S 2.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.2, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-s-2.1:free": { id: "poolside/laguna-s-2.1:free", name: "Poolside: Laguna S 2.1 (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-xs-2.1": { id: "poolside/laguna-xs-2.1", name: "Poolside: Laguna XS 2.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.12, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "poolside/laguna-xs-2.1:free": { id: "poolside/laguna-xs-2.1:free", name: "Poolside: Laguna XS 2.1 (free)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen-2.5-72b-instruct": { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen2.5 72B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.36, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen-2.5-7b-instruct": { id: "qwen/qwen-2.5-7b-instruct", name: "Qwen: Qwen2.5 7B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.04, output: 0.1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen-plus": { id: "qwen/qwen-plus", name: "Qwen: Qwen-Plus", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.26, output: 0.78, cacheRead: 0.052, cacheWrite: 0.325 }, contextWindow: 1e6, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen-plus-2025-07-28": { id: "qwen/qwen-plus-2025-07-28", name: "Qwen: Qwen Plus 0728", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.26, output: 0.78, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen-plus-2025-07-28:thinking": { id: "qwen/qwen-plus-2025-07-28:thinking", name: "Qwen: Qwen Plus 0728 (thinking)", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.26, output: 0.78, cacheRead: 0, cacheWrite: 0.325 }, contextWindow: 1e6, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-14b": { id: "qwen/qwen3-14b", name: "Qwen: Qwen3 14B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.2275, output: 0.91, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-235b-a22b": { id: "qwen/qwen3-235b-a22b", name: "Qwen: Qwen3 235B A22B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.455, output: 1.82, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-235b-a22b-2507": { id: "qwen/qwen3-235b-a22b-2507", name: "Qwen: Qwen3 235B A22B Instruct 2507", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.09, output: 0.55, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-235b-a22b-thinking-2507": { id: "qwen/qwen3-235b-a22b-thinking-2507", name: "Qwen: Qwen3 235B A22B Thinking 2507", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.3, output: 3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-30b-a3b": { id: "qwen/qwen3-30b-a3b", name: "Qwen: Qwen3 30B A3B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.13, output: 0.52, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-30b-a3b-instruct-2507": { id: "qwen/qwen3-30b-a3b-instruct-2507", name: "Qwen: Qwen3 30B A3B Instruct 2507", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-30b-a3b-thinking-2507": { id: "qwen/qwen3-30b-a3b-thinking-2507", name: "Qwen: Qwen3 30B A3B Thinking 2507", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.13, output: 1.56, cacheRead: 0, cacheWrite: 0 }, contextWindow: 81920, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-32b": { id: "qwen/qwen3-32b", name: "Qwen: Qwen3 32B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.08, output: 0.28, cacheRead: 0, cacheWrite: 0 }, contextWindow: 40960, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-8b": { id: "qwen/qwen3-8b", name: "Qwen: Qwen3 8B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.117, output: 0.455, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-coder": { id: "qwen/qwen3-coder", name: "Qwen: Qwen3 Coder 480B A35B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.3, output: 1, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-coder-30b-a3b-instruct": { id: "qwen/qwen3-coder-30b-a3b-instruct", name: "Qwen: Qwen3 Coder 30B A3B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.07, output: 0.27, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16e4, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-coder-flash": { id: "qwen/qwen3-coder-flash", name: "Qwen: Qwen3 Coder Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.195, output: 0.975, cacheRead: 0.039, cacheWrite: 0.24375 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-coder-next": { id: "qwen/qwen3-coder-next", name: "Qwen: Qwen3 Coder Next", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.11, output: 0.8, cacheRead: 0.07, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-coder-plus": { id: "qwen/qwen3-coder-plus", name: "Qwen: Qwen3 Coder Plus", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.65, output: 3.25, cacheRead: 0.13, cacheWrite: 0.8125 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-max": { id: "qwen/qwen3-max", name: "Qwen: Qwen3 Max", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.78, output: 3.9, cacheRead: 0.156, cacheWrite: 0.975 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-max-thinking": { id: "qwen/qwen3-max-thinking", name: "Qwen: Qwen3 Max Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.78, output: 3.9, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-next-80b-a3b-instruct": { id: "qwen/qwen3-next-80b-a3b-instruct", name: "Qwen: Qwen3 Next 80B A3B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.1, output: 1.1, cacheRead: 0.07, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-next-80b-a3b-thinking": { id: "qwen/qwen3-next-80b-a3b-thinking", name: "Qwen: Qwen3 Next 80B A3B Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.0975, output: 0.78, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-235b-a22b-instruct": { id: "qwen/qwen3-vl-235b-a22b-instruct", name: "Qwen: Qwen3 VL 235B A22B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.21, output: 1.9, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-235b-a22b-thinking": { id: "qwen/qwen3-vl-235b-a22b-thinking", name: "Qwen: Qwen3 VL 235B A22B Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.26, output: 2.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-30b-a3b-instruct": { id: "qwen/qwen3-vl-30b-a3b-instruct", name: "Qwen: Qwen3 VL 30B A3B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-30b-a3b-thinking": { id: "qwen/qwen3-vl-30b-a3b-thinking", name: "Qwen: Qwen3 VL 30B A3B Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.13, output: 1.56, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-32b-instruct": { id: "qwen/qwen3-vl-32b-instruct", name: "Qwen: Qwen3 VL 32B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.104, output: 0.416, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-8b-instruct": { id: "qwen/qwen3-vl-8b-instruct", name: "Qwen: Qwen3 VL 8B Instruct", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.117, output: 0.455, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3-vl-8b-thinking": { id: "qwen/qwen3-vl-8b-thinking", name: "Qwen: Qwen3 VL 8B Thinking", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.117, output: 1.365, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-122b-a10b": { id: "qwen/qwen3.5-122b-a10b", name: "Qwen: Qwen3.5-122B-A10B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.26, output: 2.08, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-27b": { id: "qwen/qwen3.5-27b", name: "Qwen: Qwen3.5-27B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.195, output: 1.56, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-35b-a3b": { id: "qwen/qwen3.5-35b-a3b", name: "Qwen: Qwen3.5-35B-A3B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-397b-a17b": { id: "qwen/qwen3.5-397b-a17b", name: "Qwen: Qwen3.5 397B A17B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.39, output: 2.34, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-9b": { id: "qwen/qwen3.5-9b", name: "Qwen: Qwen3.5-9B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-flash-02-23": { id: "qwen/qwen3.5-flash-02-23", name: "Qwen: Qwen3.5-Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.065, output: 0.26, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-plus-02-15": { id: "qwen/qwen3.5-plus-02-15", name: "Qwen: Qwen3.5 Plus 2026-02-15", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.26, output: 1.56, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.5-plus-20260420": { id: "qwen/qwen3.5-plus-20260420", name: "Qwen: Qwen3.5 Plus 2026-04-20", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.8, cacheRead: 0, cacheWrite: 0.375 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.6-27b": { id: "qwen/qwen3.6-27b", name: "Qwen: Qwen3.6 27B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.289, output: 2.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.6-35b-a3b": { id: "qwen/qwen3.6-35b-a3b", name: "Qwen: Qwen3.6 35B A3B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.6-flash": { id: "qwen/qwen3.6-flash", name: "Qwen: Qwen3.6 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.1875, output: 1.125, cacheRead: 0, cacheWrite: 0.234375 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.6-max-preview": { id: "qwen/qwen3.6-max-preview", name: "Qwen: Qwen3.6 Max Preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 1.04, output: 6.24, cacheRead: 0, cacheWrite: 1.3 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.6-plus": { id: "qwen/qwen3.6-plus", name: "Qwen: Qwen3.6 Plus", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.325, output: 1.95, cacheRead: 0, cacheWrite: 0.40625 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.7-max": { id: "qwen/qwen3.7-max", name: "Qwen: Qwen3.7 Max", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 1.475, output: 4.425, cacheRead: 0.295, cacheWrite: 1.84375 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "qwen/qwen3.7-plus": { id: "qwen/qwen3.7-plus", name: "Qwen: Qwen3.7 Plus", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.32, output: 1.28, cacheRead: 0.064, cacheWrite: 0.4 }, contextWindow: 1e6, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "rekaai/reka-edge": { id: "rekaai/reka-edge", name: "Reka Edge", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16384, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "relace/relace-search": { id: "relace/relace-search", name: "Relace: Relace Search", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 1, output: 3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "sakana/fugu-ultra": { id: "sakana/fugu-ultra", name: "Sakana: Fugu Ultra", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "sao10k/l3.1-euryale-70b": { id: "sao10k/l3.1-euryale-70b", name: "Sao10K: Llama 3.1 Euryale 70B v2.2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.85, output: 0.85, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "stepfun/step-3.5-flash": { id: "stepfun/step-3.5-flash", name: "StepFun: Step 3.5 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "stepfun/step-3.7-flash": { id: "stepfun/step-3.7-flash", name: "StepFun: Step 3.7 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "tencent/hy3": { id: "tencent/hy3", name: "Tencent: Hy3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.132, output: 0.528, cacheRead: 0.033, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "tencent/hy3-preview": { id: "tencent/hy3-preview", name: "Tencent: Hy3 preview", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.063, output: 0.21, cacheRead: 0.021, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "thedrummer/unslopnemo-12b": { id: "thedrummer/unslopnemo-12b", name: "TheDrummer: UnslopNemo 12B", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: false, input: ["text"], cost: { input: 0.4, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32768, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "thinkingmachines/inkling": { id: "thinkingmachines/inkling", name: "Thinking Machines: Inkling", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 4.05, cacheRead: 0.17, cacheWrite: 0 }, contextWindow: 524288, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "upstage/solar-pro-3": { id: "upstage/solar-pro-3", name: "Upstage: Solar Pro 3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "x-ai/grok-4.20": { id: "x-ai/grok-4.20", name: "xAI: Grok 4.20", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "x-ai/grok-4.3": { id: "x-ai/grok-4.3", name: "xAI: Grok 4.3", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "x-ai/grok-4.5": { id: "x-ai/grok-4.5", name: "xAI: Grok 4.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 5e5, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "x-ai/grok-build-0.1": { id: "x-ai/grok-build-0.1", name: "xAI: Grok Build 0.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 2, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "xiaomi/mimo-v2.5": { id: "xiaomi/mimo-v2.5", name: "Xiaomi: MiMo-V2.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "xiaomi/mimo-v2.5-pro": { id: "xiaomi/mimo-v2.5-pro", name: "Xiaomi: MiMo-V2.5-Pro", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 36e-4, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.5": { id: "z-ai/glm-4.5", name: "Z.ai: GLM 4.5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0.11, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 98304, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.5-air": { id: "z-ai/glm-4.5-air", name: "Z.ai: GLM 4.5 Air", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.13, output: 0.85, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 98304, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.5v": { id: "z-ai/glm-4.5v", name: "Z.ai: GLM 4.5V", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 1.8, cacheRead: 0.11, cacheWrite: 0 }, contextWindow: 65536, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.6": { id: "z-ai/glm-4.6", name: "Z.ai: GLM 4.6", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.5, output: 2, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.6v": { id: "z-ai/glm-4.6v", name: "Z.ai: GLM 4.6V", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 0.9, cacheRead: 0.055, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.7": { id: "z-ai/glm-4.7", name: "Z.ai: GLM 4.7", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.4, output: 1.75, cacheRead: 0.08, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-4.7-flash": { id: "z-ai/glm-4.7-flash", name: "Z.ai: GLM 4.7 Flash", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.4, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 16384, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-5": { id: "z-ai/glm-5", name: "Z.ai: GLM 5", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.6, output: 1.9, cacheRead: 0.119, cacheWrite: 0 }, contextWindow: 204800, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-5-turbo": { id: "z-ai/glm-5-turbo", name: "Z.ai: GLM 5 Turbo", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 1.2, output: 4, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-5.1": { id: "z-ai/glm-5.1", name: "Z.ai: GLM 5.1", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.966, output: 3.036, cacheRead: 0.1794, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "z-ai/glm-5.2": { id: "z-ai/glm-5.2", name: "Z.ai: GLM 5.2", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text"], cost: { input: 0.721, output: 2.266, cacheRead: 0.1339, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" }, thinkingLevelMap: { xhigh: "xhigh" } }, "z-ai/glm-5v-turbo": { id: "z-ai/glm-5v-turbo", name: "Z.ai: GLM 5V Turbo", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.2, output: 4, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~anthropic/claude-fable-latest": { id: "~anthropic/claude-fable-latest", name: "Anthropic: Claude Fable Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "~anthropic/claude-haiku-latest": { id: "~anthropic/claude-haiku-latest", name: "Anthropic Claude Haiku Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "~anthropic/claude-opus-latest": { id: "~anthropic/claude-opus-latest", name: "Anthropic: Claude Opus Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "~anthropic/claude-sonnet-latest": { id: "~anthropic/claude-sonnet-latest", name: "Anthropic Claude Sonnet Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter", cacheControlFormat: "anthropic" } }, "~google/gemini-flash-latest": { id: "~google/gemini-flash-latest", name: "Google Gemini Flash Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0.083333 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~google/gemini-pro-latest": { id: "~google/gemini-pro-latest", name: "Google Gemini Pro Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0.375 }, contextWindow: 1048576, maxTokens: 65536, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~moonshotai/kimi-latest": { id: "~moonshotai/kimi-latest", name: "MoonshotAI Kimi Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~openai/gpt-latest": { id: "~openai/gpt-latest", name: "OpenAI GPT Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 105e4, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~openai/gpt-mini-latest": { id: "~openai/gpt-mini-latest", name: "OpenAI GPT Mini Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } }, "~x-ai/grok-latest": { id: "~x-ai/grok-latest", name: "xAI: Grok Latest", api: "openai-completions", baseUrl: "https://openrouter.ai/api/v1", provider: "openrouter", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 5e5, maxTokens: 4096, compat: { supportsDeveloperRole: false, thinkingFormat: "openrouter" } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openrouter.models.js
var OPENROUTER_MODELS = flattenModelCatalog("openrouter", openrouter_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/qwen-token-plan.json
var qwen_token_plan_default = { "openai-completions": { "MiniMax-M2.5": { id: "MiniMax-M2.5", name: "MiniMax-M2.5", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 32768 }, "deepseek-v3.2": { id: "deepseek-v3.2", name: "DeepSeek V3.2", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "deepseek-v4-flash": { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "deepseek", supportsDeveloperRole: false, supportsStore: false, requiresReasoningContentOnAssistantMessages: true }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "deepseek-v4-pro": { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "deepseek", supportsDeveloperRole: false, supportsStore: false, requiresReasoningContentOnAssistantMessages: true }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "glm-5": { id: "glm-5", name: "GLM-5", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 16384 }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 128e3 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "kimi-k2.5": { id: "kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 98304 }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "qwen3.6-flash": { id: "qwen3.6-flash", name: "Qwen3.6 Flash", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.6-plus": { id: "qwen3.6-plus", name: "Qwen3.6 Plus", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.7-max": { id: "qwen3.7-max", name: "Qwen3.7 Max", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "qwen3.7-plus": { id: "qwen3.7-plus", name: "Qwen3.7 Plus", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.8-max-preview": { id: "qwen3.8-max-preview", name: "Qwen3.8 Max Preview", api: "openai-completions", provider: "qwen-token-plan", baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/qwen-token-plan.models.js
var QWEN_TOKEN_PLAN_MODELS = flattenModelCatalog("qwen-token-plan", qwen_token_plan_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/qwen-token-plan-cn.json
var qwen_token_plan_cn_default = { "openai-completions": { "MiniMax-M2.5": { id: "MiniMax-M2.5", name: "MiniMax-M2.5", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 196608, maxTokens: 32768 }, "deepseek-v3.2": { id: "deepseek-v3.2", name: "DeepSeek V3.2", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "deepseek-v4-flash": { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "deepseek", supportsDeveloperRole: false, supportsStore: false, requiresReasoningContentOnAssistantMessages: true }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "deepseek-v4-pro": { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "deepseek", supportsDeveloperRole: false, supportsStore: false, requiresReasoningContentOnAssistantMessages: true }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", max: "max" } }, "glm-5": { id: "glm-5", name: "GLM-5", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 16384 }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 202752, maxTokens: 128e3 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "kimi-k2.5": { id: "kimi-k2.5", name: "Kimi K2.5", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 98304 }, "kimi-k2.6": { id: "kimi-k2.6", name: "Kimi K2.6", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "kimi-k2.7-code": { id: "kimi-k2.7-code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "qwen3.6-flash": { id: "qwen3.6-flash", name: "Qwen3.6 Flash", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.6-plus": { id: "qwen3.6-plus", name: "Qwen3.6 Plus", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.7-max": { id: "qwen3.7-max", name: "Qwen3.7 Max", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "qwen3.7-plus": { id: "qwen3.7-plus", name: "Qwen3.7 Plus", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "qwen3.8-max-preview": { id: "qwen3.8-max-preview", name: "Qwen3.8 Max Preview", api: "openai-completions", provider: "qwen-token-plan-cn", baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", compat: { thinkingFormat: "qwen", supportsDeveloperRole: false, supportsStore: false }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/qwen-token-plan-cn.models.js
var QWEN_TOKEN_PLAN_CN_MODELS = flattenModelCatalog("qwen-token-plan-cn", qwen_token_plan_cn_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/together.json
var together_default = { "openai-completions": { "MiniMaxAI/MiniMax-M2.7": { id: "MiniMaxAI/MiniMax-M2.7", name: "MiniMax-M2.7", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { off: null, minimal: null, low: null, medium: null }, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 202752, maxTokens: 131072 }, "MiniMaxAI/MiniMax-M3": { id: "MiniMaxAI/MiniMax-M3", name: "MiniMax-M3", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 524288, maxTokens: 25e4 }, "Qwen/Qwen2.5-7B-Instruct-Turbo": { id: "Qwen/Qwen2.5-7B-Instruct-Turbo", name: "Qwen 2.5 7B Instruct Turbo", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: false, input: ["text"], cost: { input: 0.3, output: 0.3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 32768, maxTokens: 32768 }, "Qwen/Qwen3.5-9B": { id: "Qwen/Qwen3.5-9B", name: "Qwen3.5 9B", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text", "image"], cost: { input: 0.17, output: 0.25, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 65536 }, "Qwen/Qwen3.6-Plus": { id: "Qwen/Qwen3.6-Plus", name: "Qwen3.6 Plus", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text"], cost: { input: 0.5, output: 3, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 1e6, maxTokens: 5e5 }, "Qwen/Qwen3.7-Max": { id: "Qwen/Qwen3.7-Max", name: "Qwen3.7 Max", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: false, input: ["text"], cost: { input: 1.25, output: 3.75, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 1e6, maxTokens: 5e5 }, "deepseek-ai/DeepSeek-V4-Pro": { id: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek V4 Pro", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null, high: "high", xhigh: null }, input: ["text"], cost: { input: 1.74, output: 3.48, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 512e3, maxTokens: 384e3 }, "google/gemma-4-31B-it": { id: "google/gemma-4-31B-it", name: "Gemma 4 31B Instruct", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text", "image"], cost: { input: 0.39, output: 0.97, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 131072 }, "meta-llama/Llama-3.3-70B-Instruct-Turbo": { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: false, input: ["text"], cost: { input: 1.04, output: 1.04, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 131072 }, "moonshotai/Kimi-K2.6": { id: "moonshotai/Kimi-K2.6", name: "Kimi K2.6", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text", "image"], cost: { input: 1.2, output: 4.5, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 131e3 }, "moonshotai/Kimi-K2.7-Code": { id: "moonshotai/Kimi-K2.7-Code", name: "Kimi K2.7 Code", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 131072 }, "nvidia/nemotron-3-ultra-550b-a55b": { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B A55B", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text"], cost: { input: 0.6, output: 3.6, cacheRead: 0.2, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 512300, maxTokens: 512300 }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens", thinkingFormat: "openai", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 131072 }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null }, input: ["text"], cost: { input: 0.05, output: 0.2, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens", thinkingFormat: "openai", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 131072, maxTokens: 131072 }, "thinkingmachines/Inkling": { id: "thinkingmachines/Inkling", name: "Inkling", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text", "image"], cost: { input: 1, output: 4.05, cacheRead: 0.17, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 524288, maxTokens: 131072 }, "zai-org/GLM-5.2": { id: "zai-org/GLM-5.2", name: "GLM-5.2", api: "openai-completions", provider: "together", baseUrl: "https://api.together.ai/v1", reasoning: true, thinkingLevelMap: { minimal: null, low: null, medium: null }, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, maxTokensField: "max_tokens", thinkingFormat: "together", supportsStrictMode: false, supportsLongCacheRetention: false }, contextWindow: 262144, maxTokens: 164e3 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/together.models.js
var TOGETHER_MODELS = flattenModelCatalog("together", together_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/vercel-ai-gateway.json
var vercel_ai_gateway_default = { "anthropic-messages": { "alibaba/qwen-3-14b": { id: "alibaba/qwen-3-14b", name: "Qwen3-14B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.12, output: 0.24, cacheRead: 0, cacheWrite: 0 }, contextWindow: 40960, maxTokens: 16384 }, "alibaba/qwen-3-235b": { id: "alibaba/qwen-3-235b", name: "Qwen3 235B A22B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.22, output: 0.88, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 16384 }, "alibaba/qwen-3-30b": { id: "alibaba/qwen-3-30b", name: "Qwen3-30B-A3B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.12, output: 0.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 40960, maxTokens: 16384 }, "alibaba/qwen-3-32b": { id: "alibaba/qwen-3-32b", name: "Qwen 3 32B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.16, output: 0.64, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "alibaba/qwen-3.6-max-preview": { id: "alibaba/qwen-3.6-max-preview", name: "Qwen 3.6 Max Preview", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.3, output: 7.8, cacheRead: 0.26, cacheWrite: 1.625 }, contextWindow: 24e4, maxTokens: 64e3 }, "alibaba/qwen3-235b-a22b-thinking": { id: "alibaba/qwen3-235b-a22b-thinking", name: "Qwen3 VL 235B A22B Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768 }, "alibaba/qwen3-coder": { id: "alibaba/qwen3-coder", name: "Qwen3 Coder 480B A35B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 1.5, output: 7.5, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536 }, "alibaba/qwen3-coder-30b-a3b": { id: "alibaba/qwen3-coder-30b-a3b", name: "Qwen 3 Coder 30B A3B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 8192 }, "alibaba/qwen3-coder-next": { id: "alibaba/qwen3-coder-next", name: "Qwen3 Coder Next", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.5, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "alibaba/qwen3-coder-plus": { id: "alibaba/qwen3-coder-plus", name: "Qwen3 Coder Plus", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 1, output: 5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "alibaba/qwen3-max": { id: "alibaba/qwen3-max", name: "Qwen3 Max", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 1.2, output: 6, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768 }, "alibaba/qwen3-max-preview": { id: "alibaba/qwen3-max-preview", name: "Qwen3 Max Preview", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 1.2, output: 6, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768 }, "alibaba/qwen3-max-thinking": { id: "alibaba/qwen3-max-thinking", name: "Qwen 3 Max Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.2, output: 6, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 65536 }, "alibaba/qwen3-next-80b-a3b-instruct": { id: "alibaba/qwen3-next-80b-a3b-instruct", name: "Qwen3 Next 80B A3B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.15, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768 }, "alibaba/qwen3-next-80b-a3b-thinking": { id: "alibaba/qwen3-next-80b-a3b-thinking", name: "Qwen3 Next 80B A3B Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.15, output: 1.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768 }, "alibaba/qwen3-vl-235b-a22b-instruct": { id: "alibaba/qwen3-vl-235b-a22b-instruct", name: "Qwen3 VL 235B A22B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 129024 }, "alibaba/qwen3-vl-instruct": { id: "alibaba/qwen3-vl-instruct", name: "Qwen3 VL 235B A22B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 129024 }, "alibaba/qwen3-vl-thinking": { id: "alibaba/qwen3-vl-thinking", name: "Qwen3 VL 235B A22B Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 32768 }, "alibaba/qwen3.5-flash": { id: "alibaba/qwen3.5-flash", name: "Qwen 3.5 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 1e-3, cacheWrite: 0.125 }, contextWindow: 1e6, maxTokens: 64e3 }, "alibaba/qwen3.5-plus": { id: "alibaba/qwen3.5-plus", name: "Qwen 3.5 Plus", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 2.4, cacheRead: 0.04, cacheWrite: 0.5 }, contextWindow: 1e6, maxTokens: 64e3 }, "alibaba/qwen3.6-27b": { id: "alibaba/qwen3.6-27b", name: "Qwen 3.6 27B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "alibaba/qwen3.6-plus": { id: "alibaba/qwen3.6-plus", name: "Qwen 3.6 Plus", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.1, cacheWrite: 0.625 }, contextWindow: 1e6, maxTokens: 64e3 }, "alibaba/qwen3.7-max": { id: "alibaba/qwen3.7-max", name: "Qwen 3.7 Max", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 2.5, output: 7.5, cacheRead: 0.5, cacheWrite: 3.125 }, contextWindow: 991e3, maxTokens: 64e3 }, "alibaba/qwen3.7-plus": { id: "alibaba/qwen3.7-plus", name: "Qwen 3.7 Plus", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.08, cacheWrite: 0.5 }, contextWindow: 1e6, maxTokens: 64e3 }, "amazon/nova-2-lite": { id: "amazon/nova-2-lite", name: "Nova 2 Lite", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "amazon/nova-lite": { id: "amazon/nova-lite", name: "Nova Lite", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.06, output: 0.24, cacheRead: 0, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 8192 }, "amazon/nova-micro": { id: "amazon/nova-micro", name: "Nova Micro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.035, output: 0.14, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "amazon/nova-pro": { id: "amazon/nova-pro", name: "Nova Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.8, output: 3.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 3e5, maxTokens: 8192 }, "anthropic/claude-3-haiku": { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.3 }, contextWindow: 2e5, maxTokens: 4096 }, "anthropic/claude-fable-5": { id: "anthropic/claude-fable-5", name: "Claude Fable 5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { off: null, xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true } }, "anthropic/claude-haiku-4.5": { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 2e5, maxTokens: 64e3 }, "anthropic/claude-opus-4": { id: "anthropic/claude-opus-4", name: "Claude Opus 4", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 8192 }, "anthropic/claude-opus-4.1": { id: "anthropic/claude-opus-4.1", name: "Claude Opus 4.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 }, contextWindow: 2e5, maxTokens: 32e3 }, "anthropic/claude-opus-4.5": { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 2e5, maxTokens: 64e3 }, "anthropic/claude-opus-4.6": { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true } }, "anthropic/claude-opus-4.7": { id: "anthropic/claude-opus-4.7", name: "Claude Opus 4.7", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "anthropic/claude-opus-4.8": { id: "anthropic/claude-opus-4.8", name: "Claude Opus 4.8", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "anthropic/claude-opus-4.8-fast": { id: "anthropic/claude-opus-4.8-fast", name: "Claude Opus 4.8 (Fast)", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "anthropic/claude-opus-5": { id: "anthropic/claude-opus-5", name: "Claude Opus 5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "anthropic/claude-opus-5-fast": { id: "anthropic/claude-opus-5-fast", name: "Claude Opus 5 (Fast)", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 50, cacheRead: 1, cacheWrite: 12.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true, supportsTemperature: false } }, "anthropic/claude-sonnet-4": { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 8192 }, "anthropic/claude-sonnet-4.5": { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 64e3 }, "anthropic/claude-sonnet-4.6": { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { max: "max" }, compat: { forceAdaptiveThinking: true } }, "anthropic/claude-sonnet-5": { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", max: "max" }, compat: { forceAdaptiveThinking: true } }, "arcee-ai/trinity-large-thinking": { id: "arcee-ai/trinity-large-thinking", name: "Trinity Large Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.9, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262100, maxTokens: 8e4 }, "arcee-ai/trinity-mini": { id: "arcee-ai/trinity-mini", name: "Trinity Mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.045, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "bytedance/seed-1.6": { id: "bytedance/seed-1.6", name: "Seed 1.6", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32e3 }, "bytedance/seed-1.8": { id: "bytedance/seed-1.8", name: "Bytedance Seed 1.8", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 64e3 }, "cohere/command-a": { id: "cohere/command-a", name: "Command A", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 2.5, output: 10, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e3 }, "deepseek/deepseek-r1": { id: "deepseek/deepseek-r1", name: "DeepSeek-R1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.35, output: 5.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "deepseek/deepseek-v3": { id: "deepseek/deepseek-v3", name: "DeepSeek V3 0324", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.27, output: 1.12, cacheRead: 0.135, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 163840 }, "deepseek/deepseek-v3.1": { id: "deepseek/deepseek-v3.1", name: "DeepSeek V3.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.95, cacheRead: 0.13, cacheWrite: 0 }, contextWindow: 163840, maxTokens: 128e3 }, "deepseek/deepseek-v3.1-terminus": { id: "deepseek/deepseek-v3.1-terminus", name: "DeepSeek V3.1 Terminus", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.27, output: 1, cacheRead: 0.135, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "deepseek/deepseek-v3.2": { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.28, output: 0.42, cacheRead: 0.028, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8e3 }, "deepseek/deepseek-v3.2-thinking": { id: "deepseek/deepseek-v3.2-thinking", name: "DeepSeek V3.2 Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.62, output: 1.85, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8e3 }, "deepseek/deepseek-v4-flash": { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 0.028, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3 }, "deepseek/deepseek-v4-pro": { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 36e-4, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 384e3 }, "google/gemini-2.5-flash": { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65536 }, "google/gemini-2.5-flash-lite": { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "google/gemini-2.5-pro": { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 65536 }, "google/gemini-3-flash": { id: "google/gemini-3-flash", name: "Gemini 3 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 3, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65e3 }, "google/gemini-3-pro-preview": { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 64e3 }, "google/gemini-3.1-flash-lite": { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 1.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65e3 }, "google/gemini-3.1-pro-preview": { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 12, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 64e3 }, "google/gemini-3.5-flash": { id: "google/gemini-3.5-flash", name: "Gemini 3.5 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 64e3 }, "google/gemini-3.5-flash-lite": { id: "google/gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 2.5, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65e3 }, "google/gemini-3.6-flash": { id: "google/gemini-3.6-flash", name: "Gemini 3.6 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 64e3 }, "google/gemma-4-26b-a4b-it": { id: "google/gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B IT", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.015, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072 }, "google/gemma-4-31b-it": { id: "google/gemma-4-31b-it", name: "Gemma 4 31B IT", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072 }, "inception/mercury-2": { id: "inception/mercury-2", name: "Mercury 2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.25, output: 0.75, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "inception/mercury-coder-small": { id: "inception/mercury-coder-small", name: "Mercury Coder Small Beta", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.25, output: 1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32e3, maxTokens: 16384 }, "inclusionai/ling-3.0-flash-free": { id: "inclusionai/ling-3.0-flash-free", name: "Ling 3.0 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "interfaze/interfaze-beta": { id: "interfaze/interfaze-beta", name: "Interfaze Beta", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 3.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 32e3 }, "kwaipilot/kat-coder-air-v2.5": { id: "kwaipilot/kat-coder-air-v2.5", name: "Kat Coder Air V2.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.6, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e4 }, "kwaipilot/kat-coder-pro-v1": { id: "kwaipilot/kat-coder-pro-v1", name: "KAT-Coder-Pro V1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32e3 }, "kwaipilot/kat-coder-pro-v2": { id: "kwaipilot/kat-coder-pro-v2", name: "Kat Coder Pro V2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "kwaipilot/kat-coder-pro-v2.5": { id: "kwaipilot/kat-coder-pro-v2.5", name: "Kat Coder Pro V2.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.74, output: 2.96, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 8e4 }, "meta/llama-3.1-70b": { id: "meta/llama-3.1-70b", name: "Llama 3.1 70B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.72, output: 0.72, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "meta/llama-3.1-8b": { id: "meta/llama-3.1-8b", name: "Llama 3.1 8B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.22, output: 0.22, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "meta/llama-3.3-70b": { id: "meta/llama-3.3-70b", name: "Llama 3.3 70B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.72, output: 0.72, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "meta/llama-4-maverick": { id: "meta/llama-4-maverick", name: "Llama 4 Maverick 17B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.24, output: 0.97, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "meta/llama-4-scout": { id: "meta/llama-4-scout", name: "Llama 4 Scout 17B Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.17, output: 0.66, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 8192 }, "meta/muse-spark-1.1": { id: "meta/muse-spark-1.1", name: "Muse Spark 1.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 4.25, cacheRead: 0.15, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 1048576 }, "minimax/minimax-m2": { id: "minimax/minimax-m2", name: "MiniMax M2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.375 }, contextWindow: 205e3, maxTokens: 205e3 }, "minimax/minimax-m2.1": { id: "minimax/minimax-m2.1", name: "MiniMax M2.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "minimax/minimax-m2.1-lightning": { id: "minimax/minimax-m2.1-lightning", name: "MiniMax M2.1 Lightning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 2.4, cacheRead: 0.03, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131072 }, "minimax/minimax-m2.5": { id: "minimax/minimax-m2.5", name: "MiniMax M2.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131e3 }, "minimax/minimax-m2.5-highspeed": { id: "minimax/minimax-m2.5-highspeed", name: "MiniMax M2.5 High Speed", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0.03, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131e3 }, "minimax/minimax-m2.7": { id: "minimax/minimax-m2.7", name: "MiniMax M2.7", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131e3 }, "minimax/minimax-m2.7-highspeed": { id: "minimax/minimax-m2.7-highspeed", name: "MiniMax M2.7 High Speed", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 }, contextWindow: 204800, maxTokens: 131100 }, "minimax/minimax-m3": { id: "minimax/minimax-m3", name: "MiniMax M3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "mistral/codestral": { id: "mistral/codestral", name: "Mistral Codestral", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.3, output: 0.9, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3 }, "mistral/devstral-2": { id: "mistral/devstral-2", name: "Devstral 2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.4, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral/devstral-small-2": { id: "mistral/devstral-small-2", name: "Devstral Small 2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral/magistral-medium": { id: "mistral/magistral-medium", name: "Magistral Medium 2509", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 64e3 }, "mistral/magistral-small": { id: "mistral/magistral-small", name: "Magistral Small 2509", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 64e3 }, "mistral/ministral-14b": { id: "mistral/ministral-14b", name: "Ministral 14B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.2, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral/ministral-3b": { id: "mistral/ministral-3b", name: "Ministral 3B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.1, output: 0.1, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3 }, "mistral/ministral-8b": { id: "mistral/ministral-8b", name: "Ministral 8B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3 }, "mistral/mistral-large-3": { id: "mistral/mistral-large-3", name: "Mistral Large 3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral/mistral-medium": { id: "mistral/mistral-medium", name: "Mistral Medium 3.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 64e3 }, "mistral/mistral-medium-3.5": { id: "mistral/mistral-medium-3.5", name: "Mistral Medium Latest", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.5, output: 7.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "mistral/mistral-nemo": { id: "mistral/mistral-nemo", name: "Mistral Nemo 12B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 128e3 }, "mistral/mistral-small": { id: "mistral/mistral-small", name: "Mistral Small", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 32e3, maxTokens: 4e3 }, "mistral/pixtral-12b": { id: "mistral/pixtral-12b", name: "Pixtral 12B 2409", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.15, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4e3 }, "moonshotai/kimi-k2": { id: "moonshotai/kimi-k2", name: "Kimi K2 Instruct", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.57, output: 2.3, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "moonshotai/kimi-k2-thinking": { id: "moonshotai/kimi-k2-thinking", name: "Kimi K2 Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.47, output: 2, cacheRead: 0.141, cacheWrite: 0 }, contextWindow: 216144, maxTokens: 216144 }, "moonshotai/kimi-k2.5": { id: "moonshotai/kimi-k2.5", name: "Kimi K2.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 262114, maxTokens: 262114 }, "moonshotai/kimi-k2.6": { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 }, contextWindow: 262e3, maxTokens: 262e3 }, "moonshotai/kimi-k2.7-code": { id: "moonshotai/kimi-k2.7-code", name: "Kimi K2.7 Code", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32768 }, "moonshotai/kimi-k2.7-code-highspeed": { id: "moonshotai/kimi-k2.7-code-highspeed", name: "Kimi K2.7 Code High Speed", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 32768 }, "moonshotai/kimi-k3": { id: "moonshotai/kimi-k3", name: "Kimi K3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "nvidia/nemotron-3-nano-30b-a3b": { id: "nvidia/nemotron-3-nano-30b-a3b", name: "Nemotron 3 Nano 30B A3B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.05, output: 0.24, cacheRead: 0, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "nvidia/nemotron-3-super-120b-a12b": { id: "nvidia/nemotron-3-super-120b-a12b", name: "NVIDIA Nemotron 3 Super 120B A12B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.15, output: 0.65, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32e3 }, "nvidia/nemotron-3-ultra-550b-a55b": { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 65e3 }, "nvidia/nemotron-nano-12b-v2-vl": { id: "nvidia/nemotron-nano-12b-v2-vl", name: "Nvidia Nemotron Nano 12B V2 VL", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 0.6, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "nvidia/nemotron-nano-9b-v2": { id: "nvidia/nemotron-nano-9b-v2", name: "Nvidia Nemotron Nano 9B V2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.23, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "openai/gpt-3.5-turbo": { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text"], cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 16385, maxTokens: 4096 }, "openai/gpt-4-turbo": { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 10, output: 30, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 4096 }, "openai/gpt-4.1": { id: "openai/gpt-4.1", name: "GPT-4.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "openai/gpt-4.1-mini": { id: "openai/gpt-4.1-mini", name: "GPT-4.1 mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.4, output: 1.6, cacheRead: 0.1, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "openai/gpt-4.1-nano": { id: "openai/gpt-4.1-nano", name: "GPT-4.1 nano", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.1, output: 0.4, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 1047576, maxTokens: 32768 }, "openai/gpt-4o": { id: "openai/gpt-4o", name: "GPT-4o", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 2.5, output: 10, cacheRead: 1.25, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "openai/gpt-4o-mini": { id: "openai/gpt-4o-mini", name: "GPT-4o mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.15, output: 0.6, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "openai/gpt-5": { id: "openai/gpt-5", name: "GPT-5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5-codex": { id: "openai/gpt-5-codex", name: "GPT-5-Codex", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5-mini": { id: "openai/gpt-5-mini", name: "GPT-5 mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5-nano": { id: "openai/gpt-5-nano", name: "GPT-5 nano", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.05, output: 0.4, cacheRead: 5e-3, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5-pro": { id: "openai/gpt-5-pro", name: "GPT-5 pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 120, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 272e3 }, "openai/gpt-5.1-codex": { id: "openai/gpt-5.1-codex", name: "GPT-5.1-Codex", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5.1-codex-max": { id: "openai/gpt-5.1-codex-max", name: "GPT 5.1 Codex Max", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5.1-codex-mini": { id: "openai/gpt-5.1-codex-mini", name: "GPT 5.1 Codex Mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5.1-instant": { id: "openai/gpt-5.1-instant", name: "GPT-5.1 Instant", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384 }, "openai/gpt-5.1-thinking": { id: "openai/gpt-5.1-thinking", name: "GPT 5.1 Thinking", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3 }, "openai/gpt-5.2": { id: "openai/gpt-5.2", name: "GPT 5.2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.2-codex": { id: "openai/gpt-5.2-codex", name: "GPT 5.2 Codex", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.2-pro": { id: "openai/gpt-5.2-pro", name: "GPT 5.2 ", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 21, output: 168, cacheRead: 0, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.3-chat": { id: "openai/gpt-5.3-chat", name: "GPT-5.3 Chat", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 16384, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.3-codex": { id: "openai/gpt-5.3-codex", name: "GPT 5.3 Codex", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.75, output: 14, cacheRead: 0.175, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4": { id: "openai/gpt-5.4", name: "GPT 5.4", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-mini": { id: "openai/gpt-5.4-mini", name: "GPT 5.4 Mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-nano": { id: "openai/gpt-5.4-nano", name: "GPT 5.4 Nano", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.25, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 4e5, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.4-pro": { id: "openai/gpt-5.4-pro", name: "GPT 5.4 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.5": { id: "openai/gpt-5.5", name: "GPT 5.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.5-pro": { id: "openai/gpt-5.5-pro", name: "GPT 5.5 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 30, output: 180, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh", off: null, minimal: null, low: null } }, "openai/gpt-5.6-luna": { id: "openai/gpt-5.6-luna", name: "GPT 5.6 Luna", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 6, cacheRead: 0.1, cacheWrite: 1.25 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.6-sol": { id: "openai/gpt-5.6-sol", name: "GPT 5.6 Sol", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 6.25 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-5.6-terra": { id: "openai/gpt-5.6-terra", name: "GPT 5.6 Terra", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 3.125 }, contextWindow: 105e4, maxTokens: 128e3, thinkingLevelMap: { xhigh: "xhigh" } }, "openai/gpt-oss-120b": { id: "openai/gpt-oss-120b", name: "GPT OSS 120B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.5, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 131072 }, "openai/gpt-oss-20b": { id: "openai/gpt-oss-20b", name: "GPT OSS 20B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.05, output: 0.2, cacheRead: 0, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 8192 }, "openai/gpt-oss-safeguard-20b": { id: "openai/gpt-oss-safeguard-20b", name: "GPT OSS Safeguard 20B", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.075, output: 0.3, cacheRead: 0.037, cacheWrite: 0 }, contextWindow: 131072, maxTokens: 65536 }, "openai/o1": { id: "openai/o1", name: "o1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 15, output: 60, cacheRead: 7.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "openai/o3": { id: "openai/o3", name: "o3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "openai/o3-deep-research": { id: "openai/o3-deep-research", name: "o3-deep-research", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 10, output: 40, cacheRead: 2.5, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "openai/o3-mini": { id: "openai/o3-mini", name: "o3-mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.1, output: 4.4, cacheRead: 0.55, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "openai/o3-pro": { id: "openai/o3-pro", name: "o3 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 20, output: 80, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "openai/o4-mini": { id: "openai/o4-mini", name: "o4-mini", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.1, output: 4.4, cacheRead: 0.275, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 1e5 }, "poolside/laguna-s-2.1": { id: "poolside/laguna-s-2.1", name: "Laguna S 2.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.1, output: 0.2, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 131072 }, "poolside/laguna-s-2.1-free": { id: "poolside/laguna-s-2.1-free", name: "Laguna S 2.1 Free", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 32768 }, "sakana/fugu-ultra": { id: "sakana/fugu-ultra", name: "Fugu Ultra", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "stepfun/step-3.5-flash": { id: "stepfun/step-3.5-flash", name: "StepFun 3.5 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.09, output: 0.3, cacheRead: 0.02, cacheWrite: 0 }, contextWindow: 262114, maxTokens: 262114 }, "stepfun/step-3.7-flash": { id: "stepfun/step-3.7-flash", name: "Step 3.7 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "tencent/hy3": { id: "tencent/hy3", name: "Hy3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.58, cacheRead: 0.035, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 262144 }, "thinkingmachines/inkling": { id: "thinkingmachines/inkling", name: "Inkling", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 4.05, cacheRead: 0.17, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "xai/grok-4.1-fast-non-reasoning": { id: "xai/grok-4.1-fast-non-reasoning", name: "Grok 4.1 Fast Non-Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 0.2, output: 0.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "xai/grok-4.1-fast-reasoning": { id: "xai/grok-4.1-fast-reasoning", name: "Grok 4.1 Fast Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.2, output: 0.5, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "xai/grok-4.20-multi-agent": { id: "xai/grok-4.20-multi-agent", name: "Grok 4.20 Multi-Agent", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.20-multi-agent-beta": { id: "xai/grok-4.20-multi-agent-beta", name: "Grok 4.20 Multi Agent Beta", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.20-non-reasoning": { id: "xai/grok-4.20-non-reasoning", name: "Grok 4.20 Non-Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.20-non-reasoning-beta": { id: "xai/grok-4.20-non-reasoning-beta", name: "Grok 4.20 Beta Non-Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: false, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.20-reasoning": { id: "xai/grok-4.20-reasoning", name: "Grok 4.20 Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.20-reasoning-beta": { id: "xai/grok-4.20-reasoning-beta", name: "Grok 4.20 Beta Reasoning", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 2e6, maxTokens: 2e6 }, "xai/grok-4.3": { id: "xai/grok-4.3", name: "Grok 4.3", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 1e6 }, "xai/grok-4.5": { id: "xai/grok-4.5", name: "Grok 4.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 5e5, maxTokens: 5e5 }, "xai/grok-build-0.1": { id: "xai/grok-build-0.1", name: "Grok Build 0.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 2, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3 }, "xiaomi/mimo-v2.5": { id: "xiaomi/mimo-v2.5", name: "MiMo M2.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 131100 }, "xiaomi/mimo-v2.5-pro": { id: "xiaomi/mimo-v2.5-pro", name: "MiMo V2.5 Pro", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 36e-4, cacheWrite: 0 }, contextWindow: 105e4, maxTokens: 131e3 }, "zai/glm-4.5": { id: "zai/glm-4.5", name: "GLM 4.5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0.11, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 96e3 }, "zai/glm-4.5-air": { id: "zai/glm-4.5-air", name: "GLM 4.5 Air", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.2, output: 1.1, cacheRead: 0.03, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 96e3 }, "zai/glm-4.5v": { id: "zai/glm-4.5v", name: "GLM 4.5V", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.6, output: 1.8, cacheRead: 0.11, cacheWrite: 0 }, contextWindow: 66e3, maxTokens: 16e3 }, "zai/glm-4.6": { id: "zai/glm-4.6", name: "GLM 4.6", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0.11, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 96e3 }, "zai/glm-4.6v": { id: "zai/glm-4.6v", name: "GLM-4.6V", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0.3, output: 0.9, cacheRead: 0.05, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 24e3 }, "zai/glm-4.6v-flash": { id: "zai/glm-4.6v-flash", name: "GLM-4.6V-Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128e3, maxTokens: 24e3 }, "zai/glm-4.7": { id: "zai/glm-4.7", name: "GLM 4.7", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.6, output: 2.2, cacheRead: 0.12, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 12e4 }, "zai/glm-4.7-flash": { id: "zai/glm-4.7-flash", name: "GLM 4.7 Flash", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.07, output: 0.4, cacheRead: 0, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 131e3 }, "zai/glm-4.7-flashx": { id: "zai/glm-4.7-flashx", name: "GLM 4.7 FlashX", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.06, output: 0.4, cacheRead: 0.01, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 128e3 }, "zai/glm-5": { id: "zai/glm-5", name: "GLM 5", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 0.95, output: 3.15, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 202800, maxTokens: 131100 }, "zai/glm-5-turbo": { id: "zai/glm-5-turbo", name: "GLM 5 Turbo", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.2, output: 4, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 202800, maxTokens: 131100 }, "zai/glm-5.1": { id: "zai/glm-5.1", name: "GLM 5.1", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.3, output: 4.3, cacheRead: 0.26, cacheWrite: 0 }, contextWindow: 202e3, maxTokens: 202e3 }, "zai/glm-5.2": { id: "zai/glm-5.2", name: "GLM 5.2", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 1.4, output: 4.4, cacheRead: 0.26, cacheWrite: 0 }, contextWindow: 104e4, maxTokens: 128e3 }, "zai/glm-5.2-fast": { id: "zai/glm-5.2-fast", name: "GLM 5.2 Fast", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text"], cost: { input: 2.1, output: 6.6, cacheRead: 0.21, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 128e3 }, "zai/glm-5v-turbo": { id: "zai/glm-5v-turbo", name: "GLM 5V Turbo", api: "anthropic-messages", baseUrl: "https://ai-gateway.vercel.sh", provider: "vercel-ai-gateway", reasoning: true, input: ["text", "image"], cost: { input: 1.2, output: 4, cacheRead: 0.24, cacheWrite: 0 }, contextWindow: 2e5, maxTokens: 128e3 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/vercel-ai-gateway.models.js
var VERCEL_AI_GATEWAY_MODELS = flattenModelCatalog("vercel-ai-gateway", vercel_ai_gateway_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/xai.json
var xai_default = { "openai-completions": { "grok-4.3": { id: "grok-4.3", name: "Grok 4.3", api: "openai-completions", provider: "xai", baseUrl: "https://api.x.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 1.25, output: 2.5, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 1e6, maxTokens: 3e4, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } }, "grok-build-0.1": { id: "grok-build-0.1", name: "Grok Build 0.1", api: "openai-completions", provider: "xai", baseUrl: "https://api.x.ai/v1", reasoning: true, input: ["text", "image"], cost: { input: 1, output: 2, cacheRead: 0.2, cacheWrite: 0 }, contextWindow: 256e3, maxTokens: 256e3, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false } } }, "openai-responses": { "grok-4.5": { id: "grok-4.5", name: "Grok 4.5", api: "openai-responses", provider: "xai", baseUrl: "https://api.x.ai/v1", compat: { supportsLongCacheRetention: false }, reasoning: true, input: ["text", "image"], cost: { input: 2, output: 6, cacheRead: 0.3, cacheWrite: 0 }, contextWindow: 5e5, maxTokens: 5e5, thinkingLevelMap: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: null, max: null } } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xai.models.js
var XAI_MODELS = flattenModelCatalog("xai", xai_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/xiaomi.json
var xiaomi_default = { "openai-completions": { "mimo-v2-flash": { id: "mimo-v2-flash", name: "MiMo-V2-Flash", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 65536 }, "mimo-v2-omni": { id: "mimo-v2-omni", name: "MiMo-V2-Omni", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 262144, maxTokens: 131072 }, "mimo-v2-pro": { id: "mimo-v2-pro", name: "MiMo-V2-Pro", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 36e-4, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5": { id: "mimo-v2.5", name: "MiMo-V2.5", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text", "image"], cost: { input: 0.14, output: 0.28, cacheRead: 28e-4, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5-pro": { id: "mimo-v2.5-pro", name: "MiMo-V2.5-Pro", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0.435, output: 0.87, cacheRead: 36e-4, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5-pro-ultraspeed": { id: "mimo-v2.5-pro-ultraspeed", name: "MiMo-V2.5-Pro-UltraSpeed", api: "openai-completions", provider: "xiaomi", baseUrl: "https://api.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 1.305, output: 2.61, cacheRead: 0.0108, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi.models.js
var XIAOMI_MODELS = flattenModelCatalog("xiaomi", xiaomi_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/xiaomi-token-plan-ams.json
var xiaomi_token_plan_ams_default = { "openai-completions": { "mimo-v2-pro": { id: "mimo-v2-pro", name: "MiMo-V2-Pro", api: "openai-completions", provider: "xiaomi-token-plan-ams", baseUrl: "https://token-plan-ams.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5": { id: "mimo-v2.5", name: "MiMo-V2.5", api: "openai-completions", provider: "xiaomi-token-plan-ams", baseUrl: "https://token-plan-ams.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5-pro": { id: "mimo-v2.5-pro", name: "MiMo-V2.5-Pro", api: "openai-completions", provider: "xiaomi-token-plan-ams", baseUrl: "https://token-plan-ams.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-ams.models.js
var XIAOMI_TOKEN_PLAN_AMS_MODELS = flattenModelCatalog("xiaomi-token-plan-ams", xiaomi_token_plan_ams_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/xiaomi-token-plan-cn.json
var xiaomi_token_plan_cn_default = { "openai-completions": { "mimo-v2-pro": { id: "mimo-v2-pro", name: "MiMo-V2-Pro", api: "openai-completions", provider: "xiaomi-token-plan-cn", baseUrl: "https://token-plan-cn.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5": { id: "mimo-v2.5", name: "MiMo-V2.5", api: "openai-completions", provider: "xiaomi-token-plan-cn", baseUrl: "https://token-plan-cn.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5-pro": { id: "mimo-v2.5-pro", name: "MiMo-V2.5-Pro", api: "openai-completions", provider: "xiaomi-token-plan-cn", baseUrl: "https://token-plan-cn.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-cn.models.js
var XIAOMI_TOKEN_PLAN_CN_MODELS = flattenModelCatalog("xiaomi-token-plan-cn", xiaomi_token_plan_cn_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/xiaomi-token-plan-sgp.json
var xiaomi_token_plan_sgp_default = { "openai-completions": { "mimo-v2-pro": { id: "mimo-v2-pro", name: "MiMo-V2-Pro", api: "openai-completions", provider: "xiaomi-token-plan-sgp", baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5": { id: "mimo-v2.5", name: "MiMo-V2.5", api: "openai-completions", provider: "xiaomi-token-plan-sgp", baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 }, "mimo-v2.5-pro": { id: "mimo-v2.5-pro", name: "MiMo-V2.5-Pro", api: "openai-completions", provider: "xiaomi-token-plan-sgp", baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1", compat: { requiresReasoningContentOnAssistantMessages: true, thinkingFormat: "deepseek" }, reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-sgp.models.js
var XIAOMI_TOKEN_PLAN_SGP_MODELS = flattenModelCatalog("xiaomi-token-plan-sgp", xiaomi_token_plan_sgp_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/zai.json
var zai_default = { "openai-completions": { "glm-4.5-air": { id: "glm-4.5-air", name: "GLM-4.5-Air", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai" }, contextWindow: 131072, maxTokens: 98304 }, "glm-4.7": { id: "glm-4.7", name: "GLM-4.7", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 204800, maxTokens: 131072 }, "glm-5-turbo": { id: "glm-5-turbo", name: "GLM-5-Turbo", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, thinkingLevelMap: { minimal: null, low: "high", medium: "high", high: "high", max: "max" }, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 1e6, maxTokens: 131072 }, "glm-5v-turbo": { id: "glm-5v-turbo", name: "GLM-5V-Turbo", api: "openai-completions", provider: "zai", baseUrl: "https://api.z.ai/api/coding/paas/v4", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/zai.models.js
var ZAI_MODELS = flattenModelCatalog("zai", zai_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/zai-coding-cn.json
var zai_coding_cn_default = { "openai-completions": { "glm-4.5-air": { id: "glm-4.5-air", name: "GLM-4.5-Air", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai" }, contextWindow: 131072, maxTokens: 98304 }, "glm-4.7": { id: "glm-4.7", name: "GLM-4.7", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 204800, maxTokens: 131072 }, "glm-5-turbo": { id: "glm-5-turbo", name: "GLM-5-Turbo", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 }, "glm-5.1": { id: "glm-5.1", name: "GLM-5.1", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 }, "glm-5.2": { id: "glm-5.2", name: "GLM-5.2", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, thinkingLevelMap: { minimal: null, low: "high", medium: "high", high: "high", max: "max" }, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: true, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 1e6, maxTokens: 131072 }, "glm-5v-turbo": { id: "glm-5v-turbo", name: "GLM-5V-Turbo", api: "openai-completions", provider: "zai-coding-cn", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", reasoning: true, input: ["text", "image"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, compat: { supportsStore: false, supportsDeveloperRole: false, supportsReasoningEffort: false, thinkingFormat: "zai", zaiToolStream: true }, contextWindow: 2e5, maxTokens: 131072 } } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/zai-coding-cn.models.js
var ZAI_CODING_CN_MODELS = flattenModelCatalog("zai-coding-cn", zai_coding_cn_default);

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.generated.js
var MODELS = {
  "amazon-bedrock": AMAZON_BEDROCK_MODELS,
  "ant-ling": ANT_LING_MODELS,
  "anthropic": ANTHROPIC_MODELS,
  "azure-openai-responses": AZURE_OPENAI_RESPONSES_MODELS,
  "cerebras": CEREBRAS_MODELS,
  "cloudflare-ai-gateway": CLOUDFLARE_AI_GATEWAY_MODELS,
  "cloudflare-workers-ai": CLOUDFLARE_WORKERS_AI_MODELS,
  "deepseek": DEEPSEEK_MODELS,
  "fireworks": FIREWORKS_MODELS,
  "github-copilot": GITHUB_COPILOT_MODELS,
  "google": GOOGLE_MODELS,
  "google-vertex": GOOGLE_VERTEX_MODELS,
  "groq": GROQ_MODELS,
  "huggingface": HUGGINGFACE_MODELS,
  "kimi-coding": KIMI_CODING_MODELS,
  "minimax": MINIMAX_MODELS,
  "minimax-cn": MINIMAX_CN_MODELS,
  "mistral": MISTRAL_MODELS,
  "moonshotai": MOONSHOTAI_MODELS,
  "moonshotai-cn": MOONSHOTAI_CN_MODELS,
  "nvidia": NVIDIA_MODELS,
  "openai": OPENAI_MODELS,
  "openai-codex": OPENAI_CODEX_MODELS,
  "opencode": OPENCODE_MODELS,
  "opencode-go": OPENCODE_GO_MODELS,
  "openrouter": OPENROUTER_MODELS,
  "qwen-token-plan": QWEN_TOKEN_PLAN_MODELS,
  "qwen-token-plan-cn": QWEN_TOKEN_PLAN_CN_MODELS,
  "together": TOGETHER_MODELS,
  "vercel-ai-gateway": VERCEL_AI_GATEWAY_MODELS,
  "xai": XAI_MODELS,
  "xiaomi": XIAOMI_MODELS,
  "xiaomi-token-plan-ams": XIAOMI_TOKEN_PLAN_AMS_MODELS,
  "xiaomi-token-plan-cn": XIAOMI_TOKEN_PLAN_CN_MODELS,
  "xiaomi-token-plan-sgp": XIAOMI_TOKEN_PLAN_SGP_MODELS,
  "zai": ZAI_MODELS,
  "zai-coding-cn": ZAI_CODING_CN_MODELS
};

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/all.js
init_models();

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/bedrock-converse-stream.lazy.js
init_lazy();
var __rewriteRelativeImportExtension2 = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
};
var importNodeOnlyApi = (specifier) => {
  const runtimeSpecifier = import.meta.url.endsWith(".js") ? specifier.replace(/\.ts$/, ".js") : specifier;
  return import(__rewriteRelativeImportExtension2(runtimeSpecifier));
};
var bedrockModuleOverride;
var bedrockConverseStreamApi = () => lazyApi(async () => bedrockModuleOverride ?? await importNodeOnlyApi("./bedrock-converse-stream.ts"));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/amazon-bedrock.js
init_models();
var bedrockAuth = {
  name: "AWS credentials or bearer token",
  login: async (interaction) => {
    const method = await interaction.prompt({
      type: "select",
      message: "Select Amazon Bedrock authentication method:",
      options: [
        { id: "bearer-token", label: "Bearer token" },
        { id: "aws-profile", label: "AWS profile" },
        { id: "credential-chain", label: "Existing AWS credential chain" }
      ]
    });
    if (method === "bearer-token") {
      return {
        type: "api_key",
        key: await interaction.prompt({ type: "secret", message: "Enter Amazon Bedrock bearer token" })
      };
    }
    interaction.notify({
      type: "info",
      message: "Amazon Bedrock supports AWS profiles, IAM credentials, and role-based credentials.",
      links: [
        {
          label: "AWS credential provider chain",
          url: "https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html"
        }
      ]
    });
    if (method === "aws-profile") {
      return {
        type: "api_key",
        env: { AWS_PROFILE: await interaction.prompt({ type: "text", message: "Enter AWS profile name" }) }
      };
    }
    if (method !== "credential-chain")
      throw new Error(`Unknown Amazon Bedrock auth method: ${method}`);
    await interaction.prompt({
      type: "text",
      message: "Configure AWS credentials, then press Enter to continue"
    });
    return { type: "api_key" };
  },
  resolve: async ({ ctx, credential }) => {
    if (credential?.key) {
      return { auth: { apiKey: credential.key }, env: credential.env, source: "stored credential" };
    }
    if (await ctx.env("AWS_BEARER_TOKEN_BEDROCK"))
      return { auth: {}, source: "AWS_BEARER_TOKEN_BEDROCK" };
    if (credential?.env?.AWS_PROFILE ?? await ctx.env("AWS_PROFILE")) {
      return {
        auth: {},
        env: credential?.env,
        source: credential?.env?.AWS_PROFILE ? "stored credential" : "AWS_PROFILE"
      };
    }
    if (await ctx.env("AWS_ACCESS_KEY_ID") && await ctx.env("AWS_SECRET_ACCESS_KEY")) {
      return { auth: {}, source: "AWS access keys" };
    }
    if (await ctx.env("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI"))
      return { auth: {}, source: "ECS task role" };
    if (await ctx.env("AWS_CONTAINER_CREDENTIALS_FULL_URI"))
      return { auth: {}, source: "ECS task role" };
    if (await ctx.env("AWS_WEB_IDENTITY_TOKEN_FILE"))
      return { auth: {}, source: "web identity token" };
    return void 0;
  }
};
function amazonBedrockProvider() {
  return createProvider({
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    auth: { apiKey: bedrockAuth },
    models: Object.values(AMAZON_BEDROCK_MODELS),
    api: bedrockConverseStreamApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-completions.lazy.js
init_lazy();
var openAICompletionsApi = () => lazyApi(() => Promise.resolve().then(() => (init_openai_completions(), openai_completions_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/helpers.js
function envApiKeyAuth(name, envVars) {
  return {
    name,
    login: async (interaction) => {
      const key = await interaction.prompt({ type: "secret", message: `Enter ${name}` });
      return { type: "api_key", key };
    },
    resolve: async ({ ctx, credential }) => {
      if (credential?.key) {
        return { auth: { apiKey: credential.key }, env: credential.env, source: "stored credential" };
      }
      for (const envVar of envVars) {
        const value = await ctx.env(envVar);
        if (value)
          return { auth: { apiKey: value }, source: envVar };
      }
      return void 0;
    }
  };
}
function lazyOAuth(input) {
  let promise;
  const loaded = () => {
    promise ??= input.load();
    return promise;
  };
  return {
    name: input.name,
    loginLabel: input.loginLabel,
    login: async (interaction) => (await loaded()).login(interaction),
    refresh: async (credential) => (await loaded()).refresh(credential),
    toAuth: async (credential) => (await loaded()).toAuth(credential)
  };
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/ant-ling.js
init_models();
function antLingProvider() {
  return createProvider({
    id: "ant-ling",
    name: "Ant Ling",
    baseUrl: "https://api.ant-ling.com/v1",
    auth: { apiKey: envApiKeyAuth("Ant Ling API key", ["ANT_LING_API_KEY"]) },
    models: Object.values(ANT_LING_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/anthropic-messages.lazy.js
init_lazy();
var anthropicMessagesApi = () => lazyApi(() => Promise.resolve().then(() => (init_anthropic_messages(), anthropic_messages_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/oauth/load.js
var __rewriteRelativeImportExtension3 = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
};
var importOAuthModule = (specifier) => {
  const runtimeSpecifier = import.meta.url.endsWith(".js") ? specifier.replace(/\.ts$/, ".js") : specifier;
  return import(__rewriteRelativeImportExtension3(runtimeSpecifier));
};
var bundledLoaders;
var loadAnthropicOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.anthropic();
  return (await importOAuthModule("./anthropic.ts")).anthropicOAuth;
};
var loadOpenAICodexOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.openaiCodex();
  return (await importOAuthModule("./openai-codex.ts")).openaiCodexOAuth;
};
var loadGitHubCopilotOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.githubCopilot();
  return (await importOAuthModule("./github-copilot.ts")).githubCopilotOAuth;
};
var loadOpenRouterOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.openrouter();
  return (await importOAuthModule("./openrouter.ts")).openRouterOAuth;
};
var loadKimiCodingOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.kimiCoding();
  return (await importOAuthModule("./kimi-coding.ts")).kimiCodingOAuth;
};
var loadXaiOAuth = async () => {
  if (bundledLoaders)
    return bundledLoaders.xai();
  return (await importOAuthModule("./xai.ts")).xaiOAuth;
};
var loadRadiusOAuth = async (options) => {
  if (bundledLoaders)
    return bundledLoaders.radius(options);
  return (await importOAuthModule("./radius.ts")).createRadiusOAuth(options);
};

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/env-api-keys.js
var __rewriteRelativeImportExtension4 = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
};
var _existsSync = null;
var _homedir = null;
var _join = null;
var dynamicImport = (specifier) => import(__rewriteRelativeImportExtension4(specifier));
var NODE_FS_SPECIFIER = "node:fs";
var NODE_OS_SPECIFIER = "node:os";
var NODE_PATH_SPECIFIER = "node:path";
if (typeof process !== "undefined" && (process.versions?.node || process.versions?.bun)) {
  dynamicImport(NODE_FS_SPECIFIER).then((m) => {
    _existsSync = m.existsSync;
  });
  dynamicImport(NODE_OS_SPECIFIER).then((m) => {
    _homedir = m.homedir;
  });
  dynamicImport(NODE_PATH_SPECIFIER).then((m) => {
    _join = m.join;
  });
}
var ANTHROPIC_AUTH_TOKEN_ENV = "ANTHROPIC_AUTH_TOKEN";
var ANTHROPIC_OAUTH_TOKEN_ENV = "ANTHROPIC_OAUTH_TOKEN";
var ANTHROPIC_API_KEY_ENV = "ANTHROPIC_API_KEY";

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/anthropic.js
init_models();
function anthropicApiKeyAuth() {
  return {
    name: "Anthropic API key",
    login: async (interaction) => ({
      type: "api_key",
      key: await interaction.prompt({ type: "secret", message: "Enter Anthropic API key" })
    }),
    resolve: async ({ ctx, credential }) => {
      if (credential?.key) {
        return { auth: { apiKey: credential.key }, env: credential.env, source: "stored credential" };
      }
      const authToken = await ctx.env(ANTHROPIC_AUTH_TOKEN_ENV);
      if (authToken) {
        return {
          auth: { headers: { Authorization: `Bearer ${authToken}` } },
          source: ANTHROPIC_AUTH_TOKEN_ENV
        };
      }
      for (const envVar of [ANTHROPIC_OAUTH_TOKEN_ENV, ANTHROPIC_API_KEY_ENV]) {
        const apiKey = await ctx.env(envVar);
        if (apiKey)
          return { auth: { apiKey }, source: envVar };
      }
      return void 0;
    }
  };
}
function anthropicProvider() {
  return createProvider({
    id: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    auth: {
      apiKey: anthropicApiKeyAuth(),
      oauth: lazyOAuth({ name: "Anthropic (Claude Pro/Max)", load: loadAnthropicOAuth })
    },
    models: Object.values(ANTHROPIC_MODELS),
    api: anthropicMessagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/azure-openai-responses.lazy.js
init_lazy();
var azureOpenAIResponsesApi = () => lazyApi(() => Promise.resolve().then(() => (init_azure_openai_responses(), azure_openai_responses_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/azure-openai-responses.js
init_models();
function azureOpenAIResponsesProvider() {
  return createProvider({
    id: "azure-openai-responses",
    name: "Azure OpenAI",
    auth: { apiKey: envApiKeyAuth("Azure OpenAI API key", ["AZURE_OPENAI_API_KEY"]) },
    models: Object.values(AZURE_OPENAI_RESPONSES_MODELS),
    api: azureOpenAIResponsesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cerebras.js
init_models();
function cerebrasProvider() {
  return createProvider({
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    auth: { apiKey: envApiKeyAuth("Cerebras API key", ["CEREBRAS_API_KEY"]) },
    models: Object.values(CEREBRAS_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-responses.lazy.js
init_lazy();
var openAIResponsesApi = () => lazyApi(() => Promise.resolve().then(() => (init_openai_responses(), openai_responses_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-ai-gateway.js
init_models();

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-auth.js
var CLOUDFLARE_API_KEY = "CLOUDFLARE_API_KEY";
var CLOUDFLARE_ACCOUNT_ID = "CLOUDFLARE_ACCOUNT_ID";
var CLOUDFLARE_GATEWAY_ID = "CLOUDFLARE_GATEWAY_ID";
async function resolveValue(name, ctx, credential) {
  const fromCredential = credential ? name === CLOUDFLARE_API_KEY ? credential.key : credential.env?.[name] : void 0;
  return fromCredential ?? await ctx.env(name);
}
async function resolveCloudflareEnv(kind, ctx, credential) {
  const apiKey = await resolveValue(CLOUDFLARE_API_KEY, ctx, credential);
  const accountId = await resolveValue(CLOUDFLARE_ACCOUNT_ID, ctx, credential);
  const gatewayId = kind === "ai-gateway" ? await resolveValue(CLOUDFLARE_GATEWAY_ID, ctx, credential) : void 0;
  if (!apiKey || !accountId || kind === "ai-gateway" && !gatewayId)
    return void 0;
  return {
    apiKey,
    env: {
      CLOUDFLARE_ACCOUNT_ID: accountId,
      ...gatewayId ? { CLOUDFLARE_GATEWAY_ID: gatewayId } : {}
    },
    source: credential ? "stored credential" : CLOUDFLARE_API_KEY
  };
}
function cloudflareWorkersAIAuth() {
  return {
    name: "Cloudflare API key",
    login: async (interaction) => {
      const key = await interaction.prompt({ type: "secret", message: "Enter Cloudflare API key" });
      const accountId = await interaction.prompt({ type: "text", message: "Enter Cloudflare account ID" });
      return { type: "api_key", key, env: { CLOUDFLARE_ACCOUNT_ID: accountId } };
    },
    resolve: async ({ ctx, credential }) => {
      const resolved = await resolveCloudflareEnv("workers-ai", ctx, credential);
      if (!resolved)
        return void 0;
      return {
        auth: { apiKey: resolved.apiKey },
        env: resolved.env,
        source: resolved.source
      };
    }
  };
}
function cloudflareAIGatewayAuth() {
  return {
    name: "Cloudflare API key",
    login: async (interaction) => {
      const key = await interaction.prompt({ type: "secret", message: "Enter Cloudflare API key" });
      const accountId = await interaction.prompt({ type: "text", message: "Enter Cloudflare account ID" });
      const gatewayId = await interaction.prompt({ type: "text", message: "Enter Cloudflare AI Gateway ID" });
      return {
        type: "api_key",
        key,
        env: { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_GATEWAY_ID: gatewayId }
      };
    },
    resolve: async ({ ctx, credential }) => {
      const resolved = await resolveCloudflareEnv("ai-gateway", ctx, credential);
      if (!resolved)
        return void 0;
      return {
        auth: {
          headers: {
            "cf-aig-authorization": `Bearer ${resolved.apiKey}`,
            Authorization: null,
            "x-api-key": null
          }
        },
        env: resolved.env,
        source: resolved.source
      };
    }
  };
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-stream.js
var CLOUDFLARE_ACCOUNT_ID2 = "CLOUDFLARE_ACCOUNT_ID";
var CLOUDFLARE_GATEWAY_ID2 = "CLOUDFLARE_GATEWAY_ID";
function resolveCloudflareModel(model, env) {
  if (!env)
    return model;
  const baseUrl = model.baseUrl.replaceAll(`{${CLOUDFLARE_ACCOUNT_ID2}}`, env[CLOUDFLARE_ACCOUNT_ID2] ?? `{${CLOUDFLARE_ACCOUNT_ID2}}`).replaceAll(`{${CLOUDFLARE_GATEWAY_ID2}}`, env[CLOUDFLARE_GATEWAY_ID2] ?? `{${CLOUDFLARE_GATEWAY_ID2}}`);
  return baseUrl === model.baseUrl ? model : { ...model, baseUrl };
}
function cloudflareStreams(streams) {
  return {
    stream: (model, context, options) => streams.stream(resolveCloudflareModel(model, options?.env), context, options),
    streamSimple: (model, context, options) => streams.streamSimple(resolveCloudflareModel(model, options?.env), context, options)
  };
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-ai-gateway.js
function cloudflareAIGatewayProvider() {
  return createProvider({
    id: "cloudflare-ai-gateway",
    name: "Cloudflare AI Gateway",
    auth: { apiKey: cloudflareAIGatewayAuth() },
    models: Object.values(CLOUDFLARE_AI_GATEWAY_MODELS),
    api: {
      "anthropic-messages": cloudflareStreams(anthropicMessagesApi()),
      "openai-completions": cloudflareStreams(openAICompletionsApi()),
      "openai-responses": cloudflareStreams(openAIResponsesApi())
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/cloudflare-workers-ai.js
init_models();
function cloudflareWorkersAIProvider() {
  return createProvider({
    id: "cloudflare-workers-ai",
    name: "Cloudflare Workers AI",
    auth: { apiKey: cloudflareWorkersAIAuth() },
    models: Object.values(CLOUDFLARE_WORKERS_AI_MODELS),
    api: cloudflareStreams(openAICompletionsApi())
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/data/.manifest.json
var manifest_default = { schemaVersion: 3, generatedAt: "2026-07-25T12:44:19.521Z", structureHash: "1a3c7cf59ada71c94abe4540976960524ee933034491c75d6418e2abc1b42535", files: { "amazon-bedrock.json": "1aabd3227d32b332727eec7638cebdbd1323d2e7eedbf9b174226c5d38196df9", "ant-ling.json": "4979fe79d99ed97382d7ce40170c6132e932e77906de1eb54464c042e7d63633", "anthropic.json": "fea1226a62396c8d4a3d9c3b7f65d4dc527ac025d05719880418d3a2b0665a69", "azure-openai-responses.json": "2d13ecc23826b5be73f3628fca5f70cc2c5c15ff609b41e4acba8167cd40934b", "cerebras.json": "3fd3e19b83ab4be07d27817e25e5be0ffe4158b1394f0311d6a22d9f03847728", "cloudflare-ai-gateway.json": "9974b65a0c6dda063ea3a30f4a819cab7bf70f9a25e5e3ee2feaf85cfc167b9b", "cloudflare-workers-ai.json": "03b19d69433c843512e953390d51d4578e9b91f19098a9b14ff820c001623598", "deepseek.json": "0dcc807a4e5827b488c6ceac87884ff6e735e01cf4f2ddfec9dd812e6fde041b", "fireworks.json": "0ea306d50e72343439f71995dcda0776473e0e43a8500c4ff42769f085fee09d", "github-copilot.json": "1215a0792908480ff709a26954b1c4b76bcfec5d31f31d0843d505770c764c1e", "google-vertex.json": "99d0b89ac9d8dc460ed922236abffbe88c9381af4d35046d2ad3a8f08fa2560c", "google.json": "bcf8a8d59ccbb75bc6fb4a261a37ac4b7c806f40ee7313b4411178964be5fa37", "groq.json": "868c90a897f75f866e09a585f6aee5cb991e40a9c3281497b5842a23de7d9add", "huggingface.json": "e001db7b5925939c5850f31cd08b323cd40eb586222e2f74d7890eb52a30f161", "kimi-coding.json": "ba42a26a69e5cb2122c0b384ba572efae93f42239ad86f26c2b7320a14aa75a1", "minimax-cn.json": "8ccd71ff838f4b78bb88809babb0dc32a4fcfaec2bc4f4083841000428df4f77", "minimax.json": "253edd4c910a41c8bb252400ba099f3a4de0a8900ce154319288ab091b372987", "mistral.json": "44531201e872713923b7544a1f75a048d31fa25292e3e1f9f896f608a52e412d", "moonshotai-cn.json": "1e6146ff3477883636448c0f44222f0a52b3c4562ef8f4eecf7e941cdd59d12e", "moonshotai.json": "d8d5209873058ddccd37c1f026833e2ea3f9476c3dc9628b4a940d407acc0b2e", "nvidia.json": "f476e23d9c3743c8ed3bb24a7d43b33cf90d1539ebe61c070ea2323555853e25", "openai-codex.json": "c3313710bc6910e6bbcb06d5867247e97ec3fa6c2af9bc780f8a3eefb03e32e1", "openai.json": "8e3852ef3567b23d2ab03b0f52f1caeb77e6e776f248e6111f851ccbe0fca8b6", "opencode-go.json": "57a677764bc885c83fbbba46ad5d418baabe012a062424a0f6d8d488352102ce", "opencode.json": "905b27bf3d7e48f35ca862991411b97a93782ad92b24129a2c3ee377fd1e3675", "openrouter.json": "bc3e1ea3de6cb962c92ec3bd45f4e73c85ba2ad62ba824253498b41f8acc2b1e", "qwen-token-plan-cn.json": "a1495ccc21835c51d438207652f948aa9ecf4a3d784e81deaf313e484bdab1ec", "qwen-token-plan.json": "597fae649f549a8ffb0b6a28426ea6761b7ece41a78b6fdef49ca970ac029970", "together.json": "1d46a57e99da9be6f7e78d8f98f5610adbb266df3de7b0a13652d6fa175086e7", "vercel-ai-gateway.json": "61242947db49d08e4a70ccf4cd16eea9d58758effc35c2f6abdd953f8da64013", "xai.json": "4cbdbfbbf915246369b9bacbc6f1feeb56accdac9f3444456343f750547f2f38", "xiaomi-token-plan-ams.json": "7ce8ed244672c45737d286ff3ca9c3a2686a5d4b2f0c5f71ab9348c14b14daf3", "xiaomi-token-plan-cn.json": "684892b5fe6fa371d6040d2011c0fa33facd650d2eaf19f5dbee8efb33016200", "xiaomi-token-plan-sgp.json": "b19e79b82ac4fdcb080e6d220106797504c885ed70b27fc2b3c1aa4810f32963", "xiaomi.json": "810368d3828c8bb9498012a0d48639030c0c216b8c13e79da02daa515aa23448", "zai-coding-cn.json": "28fcb04ce65b4c6612a6b866902e0c832e18b685e5374578c4e2872569131d39", "zai.json": "474670a0cf1109f4c296ea93d2c5c6eb8f53541dc9c0bddbb0e6cb054b971ebe" } };

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/deepseek.js
init_models();
function deepseekProvider() {
  return createProvider({
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    auth: { apiKey: envApiKeyAuth("DeepSeek API key", ["DEEPSEEK_API_KEY"]) },
    models: Object.values(DEEPSEEK_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/fireworks.js
init_models();
function fireworksProvider() {
  return createProvider({
    id: "fireworks",
    name: "Fireworks",
    baseUrl: "https://api.fireworks.ai/inference",
    auth: { apiKey: envApiKeyAuth("Fireworks API key", ["FIREWORKS_API_KEY"]) },
    models: Object.values(FIREWORKS_MODELS),
    api: {
      "anthropic-messages": anthropicMessagesApi(),
      "openai-completions": openAICompletionsApi()
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/github-copilot.js
init_models();
function githubCopilotProvider() {
  return createProvider({
    id: "github-copilot",
    name: "GitHub Copilot",
    baseUrl: "https://api.individual.githubcopilot.com",
    auth: {
      apiKey: envApiKeyAuth("GitHub Copilot token", ["COPILOT_GITHUB_TOKEN"]),
      oauth: lazyOAuth({ name: "GitHub Copilot", load: loadGitHubCopilotOAuth })
    },
    models: Object.values(GITHUB_COPILOT_MODELS),
    filterModels: (models, credential) => {
      if (credential?.type !== "oauth")
        return models;
      const availableModelIds = credential.availableModelIds;
      if (!Array.isArray(availableModelIds) || !availableModelIds.every((id) => typeof id === "string")) {
        return models;
      }
      const available = new Set(availableModelIds);
      return models.filter((model) => available.has(model.id));
    },
    api: {
      "anthropic-messages": anthropicMessagesApi(),
      "openai-completions": openAICompletionsApi(),
      "openai-responses": openAIResponsesApi()
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-generative-ai.lazy.js
init_lazy();
var googleGenerativeAIApi = () => lazyApi(() => Promise.resolve().then(() => (init_google_generative_ai(), google_generative_ai_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/google.js
init_models();
function googleProvider() {
  return createProvider({
    id: "google",
    name: "Google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    auth: { apiKey: envApiKeyAuth("Gemini API key", ["GEMINI_API_KEY"]) },
    models: Object.values(GOOGLE_MODELS),
    api: googleGenerativeAIApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/google-vertex.lazy.js
init_lazy();
var googleVertexApi = () => lazyApi(() => Promise.resolve().then(() => (init_google_vertex(), google_vertex_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/google-vertex.js
init_models();
var VERTEX_ADC_PATH = "~/.config/gcloud/application_default_credentials.json";
var vertexAuth = {
  name: "Google Cloud credentials",
  login: async (interaction) => {
    const method = await interaction.prompt({
      type: "select",
      message: "Select Google Vertex AI authentication method:",
      options: [
        { id: "api-key", label: "Google Cloud API key" },
        { id: "adc", label: "Application Default Credentials" },
        { id: "service-account", label: "Service account credentials file" }
      ]
    });
    if (method === "api-key") {
      return {
        type: "api_key",
        key: await interaction.prompt({ type: "secret", message: "Enter Google Cloud API key" })
      };
    }
    if (method !== "adc" && method !== "service-account") {
      throw new Error(`Unknown Google Vertex AI auth method: ${method}`);
    }
    interaction.notify({
      type: "info",
      message: method === "adc" ? "Run `gcloud auth application-default login`, then provide the project and location." : "Provide a service account credentials file, project, and location.",
      links: [
        {
          label: "Application Default Credentials",
          url: "https://cloud.google.com/docs/authentication/provide-credentials-adc"
        }
      ]
    });
    const project = await interaction.prompt({ type: "text", message: "Enter Google Cloud project ID" });
    const location = await interaction.prompt({ type: "text", message: "Enter Google Cloud location" });
    const credentialsPath = method === "service-account" ? await interaction.prompt({ type: "text", message: "Enter service account credentials file path" }) : void 0;
    return {
      type: "api_key",
      env: {
        GOOGLE_CLOUD_PROJECT: project,
        GOOGLE_CLOUD_LOCATION: location,
        ...credentialsPath ? { GOOGLE_APPLICATION_CREDENTIALS: credentialsPath } : {}
      }
    };
  },
  resolve: async ({ ctx, credential }) => {
    const key = credential?.key ?? await ctx.env("GOOGLE_CLOUD_API_KEY");
    if (key)
      return { auth: { apiKey: key }, source: credential?.key ? "stored credential" : "GOOGLE_CLOUD_API_KEY" };
    const adcPath = credential?.env?.GOOGLE_APPLICATION_CREDENTIALS ?? await ctx.env("GOOGLE_APPLICATION_CREDENTIALS");
    const hasCredentials = await ctx.fileExists(adcPath ?? VERTEX_ADC_PATH);
    const project = credential?.env?.GOOGLE_CLOUD_PROJECT ?? await ctx.env("GOOGLE_CLOUD_PROJECT") ?? await ctx.env("GCLOUD_PROJECT");
    const location = credential?.env?.GOOGLE_CLOUD_LOCATION ?? await ctx.env("GOOGLE_CLOUD_LOCATION");
    if (hasCredentials && project && location) {
      return {
        auth: {},
        env: credential?.env,
        source: credential ? "stored credential" : "gcloud application default credentials"
      };
    }
    return void 0;
  }
};
function googleVertexProvider() {
  return createProvider({
    id: "google-vertex",
    name: "Google Vertex AI",
    auth: { apiKey: vertexAuth },
    models: Object.values(GOOGLE_VERTEX_MODELS),
    api: googleVertexApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/groq.js
init_models();
function groqProvider() {
  return createProvider({
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    auth: { apiKey: envApiKeyAuth("Groq API key", ["GROQ_API_KEY"]) },
    models: Object.values(GROQ_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/huggingface.js
init_models();
function huggingfaceProvider() {
  return createProvider({
    id: "huggingface",
    name: "Hugging Face",
    baseUrl: "https://router.huggingface.co/v1",
    auth: { apiKey: envApiKeyAuth("Hugging Face token", ["HF_TOKEN"]) },
    models: Object.values(HUGGINGFACE_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/kimi-coding.js
init_models();
function kimiCodingProvider() {
  return createProvider({
    id: "kimi-coding",
    name: "Kimi For Coding",
    baseUrl: "https://api.kimi.com/coding",
    auth: {
      apiKey: envApiKeyAuth("Kimi API key", ["KIMI_API_KEY"]),
      oauth: lazyOAuth({
        name: "Kimi Code (subscription)",
        loginLabel: "Sign in with Kimi Code",
        load: loadKimiCodingOAuth
      })
    },
    models: Object.values(KIMI_CODING_MODELS),
    api: anthropicMessagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/minimax.js
init_models();
function minimaxProvider() {
  return createProvider({
    id: "minimax",
    name: "MiniMax",
    baseUrl: "https://api.minimax.io/anthropic",
    auth: { apiKey: envApiKeyAuth("MiniMax API key", ["MINIMAX_API_KEY"]) },
    models: Object.values(MINIMAX_MODELS),
    api: anthropicMessagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/minimax-cn.js
init_models();
function minimaxCnProvider() {
  return createProvider({
    id: "minimax-cn",
    name: "MiniMax CN",
    baseUrl: "https://api.minimaxi.com/anthropic",
    auth: { apiKey: envApiKeyAuth("MiniMax CN API key", ["MINIMAX_CN_API_KEY"]) },
    models: Object.values(MINIMAX_CN_MODELS),
    api: anthropicMessagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/mistral-conversations.lazy.js
init_lazy();
var mistralConversationsApi = () => lazyApi(() => Promise.resolve().then(() => (init_mistral_conversations(), mistral_conversations_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/mistral.js
init_models();
function mistralProvider() {
  return createProvider({
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai",
    auth: { apiKey: envApiKeyAuth("Mistral API key", ["MISTRAL_API_KEY"]) },
    models: Object.values(MISTRAL_MODELS),
    api: mistralConversationsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/moonshotai.js
init_models();
function moonshotaiProvider() {
  return createProvider({
    id: "moonshotai",
    name: "Moonshot AI",
    baseUrl: "https://api.moonshot.ai/v1",
    auth: { apiKey: envApiKeyAuth("Moonshot AI API key", ["MOONSHOT_API_KEY"]) },
    models: Object.values(MOONSHOTAI_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/moonshotai-cn.js
init_models();
function moonshotaiCnProvider() {
  return createProvider({
    id: "moonshotai-cn",
    name: "Moonshot AI CN",
    baseUrl: "https://api.moonshot.cn/v1",
    auth: { apiKey: envApiKeyAuth("Moonshot AI API key", ["MOONSHOT_API_KEY"]) },
    models: Object.values(MOONSHOTAI_CN_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/nvidia.js
init_models();
function nvidiaProvider() {
  return createProvider({
    id: "nvidia",
    name: "NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    auth: { apiKey: envApiKeyAuth("NVIDIA API key", ["NVIDIA_API_KEY"]) },
    models: Object.values(NVIDIA_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openai.js
init_models();
function openaiProvider() {
  return createProvider({
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    auth: { apiKey: envApiKeyAuth("OpenAI API key", ["OPENAI_API_KEY"]) },
    models: Object.values(OPENAI_MODELS),
    api: openAIResponsesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openai-codex-responses.lazy.js
init_lazy();
var openAICodexResponsesApi = () => lazyApi(() => Promise.resolve().then(() => (init_openai_codex_responses(), openai_codex_responses_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openai-codex.js
init_models();
function openaiCodexProvider() {
  return createProvider({
    id: "openai-codex",
    name: "OpenAI Codex",
    baseUrl: "https://chatgpt.com/backend-api",
    auth: {
      oauth: lazyOAuth({ name: "OpenAI (ChatGPT Plus/Pro)", load: loadOpenAICodexOAuth })
    },
    models: Object.values(OPENAI_CODEX_MODELS),
    api: openAICodexResponsesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/opencode.js
init_models();
function opencodeProvider() {
  return createProvider({
    id: "opencode",
    name: "OpenCode Zen",
    auth: { apiKey: envApiKeyAuth("OpenCode API key", ["OPENCODE_API_KEY"]) },
    models: Object.values(OPENCODE_MODELS),
    api: {
      "anthropic-messages": anthropicMessagesApi(),
      "google-generative-ai": googleGenerativeAIApi(),
      "openai-completions": openAICompletionsApi(),
      "openai-responses": openAIResponsesApi()
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/opencode-go.js
init_models();
function opencodeGoProvider() {
  return createProvider({
    id: "opencode-go",
    name: "OpenCode Zen Go",
    auth: { apiKey: envApiKeyAuth("OpenCode API key", ["OPENCODE_API_KEY"]) },
    models: Object.values(OPENCODE_GO_MODELS),
    api: {
      "anthropic-messages": anthropicMessagesApi(),
      "openai-completions": openAICompletionsApi(),
      "openai-responses": openAIResponsesApi()
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openrouter.js
init_models();
function openrouterProvider() {
  return createProvider({
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    auth: {
      apiKey: envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"]),
      oauth: lazyOAuth({
        name: "OpenRouter OAuth",
        loginLabel: "Sign in with OpenRouter",
        load: loadOpenRouterOAuth
      })
    },
    models: Object.values(OPENROUTER_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/openrouter-images.lazy.js
var openrouterImagesApi = () => ({
  generateImages: async (model, context, options) => (await Promise.resolve().then(() => (init_openrouter_images(), openrouter_images_exports))).generateImages(model, context, options)
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/image-models.generated.js
var IMAGE_MODELS = {
  openrouter: {
    "black-forest-labs/flux.2-flex": {
      id: "black-forest-labs/flux.2-flex",
      name: "Black Forest Labs: FLUX.2 Flex",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "black-forest-labs/flux.2-klein-4b": {
      id: "black-forest-labs/flux.2-klein-4b",
      name: "Black Forest Labs: FLUX.2 Klein 4B",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "black-forest-labs/flux.2-max": {
      id: "black-forest-labs/flux.2-max",
      name: "Black Forest Labs: FLUX.2 Max",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "black-forest-labs/flux.2-pro": {
      id: "black-forest-labs/flux.2-pro",
      name: "Black Forest Labs: FLUX.2 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "bytedance-seed/seedream-4.5": {
      id: "bytedance-seed/seedream-4.5",
      name: "ByteDance Seed: Seedream 4.5",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "google/gemini-2.5-flash-image": {
      id: "google/gemini-2.5-flash-image",
      name: "Google: Nano Banana (Gemini 2.5 Flash Image)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 0.3,
        output: 2.5,
        cacheRead: 0.03,
        cacheWrite: 0.08333333333333334
      }
    },
    "google/gemini-3-pro-image": {
      id: "google/gemini-3-pro-image",
      name: "Google: Nano Banana Pro (Gemini 3 Pro Image)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      }
    },
    "google/gemini-3-pro-image-preview": {
      id: "google/gemini-3-pro-image-preview",
      name: "Google: Nano Banana Pro (Gemini 3 Pro Image Preview)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 2,
        output: 12,
        cacheRead: 0.19999999999999998,
        cacheWrite: 0.375
      }
    },
    "google/gemini-3.1-flash-image": {
      id: "google/gemini-3.1-flash-image",
      name: "Google: Nano Banana 2 (Gemini 3.1 Flash Image)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "google/gemini-3.1-flash-image-preview": {
      id: "google/gemini-3.1-flash-image-preview",
      name: "Google: Nano Banana 2 (Gemini 3.1 Flash Image Preview)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 0.5,
        output: 3,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "google/gemini-3.1-flash-lite-image": {
      id: "google/gemini-3.1-flash-lite-image",
      name: "Google: Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 0.25,
        output: 1.5,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "krea/krea-2-large": {
      id: "krea/krea-2-large",
      name: "Krea: Krea 2 Large",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "krea/krea-2-medium": {
      id: "krea/krea-2-medium",
      name: "Krea: Krea 2 Medium",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "krea/krea-2-medium-turbo": {
      id: "krea/krea-2-medium-turbo",
      name: "Krea: Krea 2 Medium Turbo",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "microsoft/mai-image-2.5": {
      id: "microsoft/mai-image-2.5",
      name: "Microsoft: MAI-Image-2.5",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 5,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "microsoft/mai-image-2.5-pro": {
      id: "microsoft/mai-image-2.5-pro",
      name: "Microsoft: MAI-Image-2.5 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 5,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "openai/gpt-5-image": {
      id: "openai/gpt-5-image",
      name: "OpenAI: GPT-5 Image",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 10,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      }
    },
    "openai/gpt-5-image-mini": {
      id: "openai/gpt-5-image-mini",
      name: "OpenAI: GPT-5 Image Mini",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 2.5,
        output: 2,
        cacheRead: 0.25,
        cacheWrite: 0
      }
    },
    "openai/gpt-5.4-image-2": {
      id: "openai/gpt-5.4-image-2",
      name: "OpenAI: GPT-5.4 Image 2",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["image", "text"],
      output: ["image", "text"],
      cost: {
        input: 8,
        output: 15,
        cacheRead: 2,
        cacheWrite: 0
      }
    },
    "openai/gpt-image-1": {
      id: "openai/gpt-image-1",
      name: "OpenAI: GPT Image 1",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 10,
        output: 10,
        cacheRead: 1.25,
        cacheWrite: 0
      }
    },
    "openai/gpt-image-1-mini": {
      id: "openai/gpt-image-1-mini",
      name: "OpenAI: GPT Image 1 Mini",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 2.5,
        output: 2.5,
        cacheRead: 0.25,
        cacheWrite: 0
      }
    },
    "openai/gpt-image-2": {
      id: "openai/gpt-image-2",
      name: "OpenAI: GPT Image 2",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 8,
        output: 8,
        cacheRead: 2,
        cacheWrite: 0
      }
    },
    "openrouter/auto": {
      id: "openrouter/auto",
      name: "Auto Router",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["text", "image"],
      cost: {
        input: -1e6,
        output: -1e6,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "openrouter/auto-beta": {
      id: "openrouter/auto-beta",
      name: "Auto Router (Beta)",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["text", "image"],
      cost: {
        input: -1e6,
        output: -1e6,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v3": {
      id: "recraft/recraft-v3",
      name: "Recraft: Recraft V3",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4": {
      id: "recraft/recraft-v4",
      name: "Recraft: Recraft V4",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4-pro": {
      id: "recraft/recraft-v4-pro",
      name: "Recraft: Recraft V4 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4-pro-vector": {
      id: "recraft/recraft-v4-pro-vector",
      name: "Recraft: Recraft V4 Pro Vector",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4-vector": {
      id: "recraft/recraft-v4-vector",
      name: "Recraft: Recraft V4 Vector",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1": {
      id: "recraft/recraft-v4.1",
      name: "Recraft: Recraft V4.1",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1-pro": {
      id: "recraft/recraft-v4.1-pro",
      name: "Recraft: Recraft V4.1 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1-pro-vector": {
      id: "recraft/recraft-v4.1-pro-vector",
      name: "Recraft: Recraft V4.1 Pro Vector",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1-utility": {
      id: "recraft/recraft-v4.1-utility",
      name: "Recraft: Recraft V4.1 Utility",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1-utility-pro": {
      id: "recraft/recraft-v4.1-utility-pro",
      name: "Recraft: Recraft V4.1 Utility Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "recraft/recraft-v4.1-vector": {
      id: "recraft/recraft-v4.1-vector",
      name: "Recraft: Recraft V4.1 Vector",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "sourceful/riverflow-v2-fast": {
      id: "sourceful/riverflow-v2-fast",
      name: "Sourceful: Riverflow V2 Fast",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "sourceful/riverflow-v2-pro": {
      id: "sourceful/riverflow-v2-pro",
      name: "Sourceful: Riverflow V2 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "sourceful/riverflow-v2.5-fast": {
      id: "sourceful/riverflow-v2.5-fast",
      name: "Sourceful: Riverflow V2.5 Fast",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "sourceful/riverflow-v2.5-pro": {
      id: "sourceful/riverflow-v2.5-pro",
      name: "Sourceful: Riverflow V2.5 Pro",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    },
    "x-ai/grok-imagine-image-quality": {
      id: "x-ai/grok-imagine-image-quality",
      name: "xAI: Grok Imagine Image Quality",
      api: "openrouter-images",
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      input: ["text", "image"],
      output: ["image"],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      }
    }
  }
};

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/openrouter-images.js
function openrouterImagesProvider() {
  return createImagesProvider({
    id: "openrouter",
    name: "OpenRouter",
    auth: {
      apiKey: envApiKeyAuth("OpenRouter API key", ["OPENROUTER_API_KEY"]),
      oauth: lazyOAuth({
        name: "OpenRouter OAuth",
        loginLabel: "Sign in with OpenRouter",
        load: loadOpenRouterOAuth
      })
    },
    models: Object.values(IMAGE_MODELS.openrouter),
    api: openrouterImagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/qwen-token-plan.js
init_models();
function qwenTokenPlanProvider() {
  return createProvider({
    id: "qwen-token-plan",
    name: "Qwen Token Plan",
    baseUrl: "https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1",
    auth: { apiKey: envApiKeyAuth("Qwen Token Plan API key", ["QWEN_TOKEN_PLAN_API_KEY"]) },
    models: Object.values(QWEN_TOKEN_PLAN_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/qwen-token-plan-cn.js
init_models();
function qwenTokenPlanCnProvider() {
  return createProvider({
    id: "qwen-token-plan-cn",
    name: "Qwen Token Plan CN",
    baseUrl: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
    auth: { apiKey: envApiKeyAuth("Qwen Token Plan CN API key", ["QWEN_TOKEN_PLAN_CN_API_KEY"]) },
    models: Object.values(QWEN_TOKEN_PLAN_CN_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/pi-messages.lazy.js
init_lazy();
var piMessagesApi = () => lazyApi(() => Promise.resolve().then(() => (init_pi_messages(), pi_messages_exports)));

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/radius-config.js
var DEFAULT_RADIUS_GATEWAY = "https://radius.pi.dev";
function isRadiusGatewayModel(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const model = value;
  return typeof model.id === "string" && typeof model.name === "string" && typeof model.reasoning === "boolean" && Array.isArray(model.input) && typeof model.cost === "object" && model.cost !== null && !Array.isArray(model.cost) && typeof model.contextWindow === "number" && typeof model.maxTokens === "number";
}
function sanitizeRadiusGatewayConfig(config) {
  if (typeof config !== "object" || config === null || Array.isArray(config))
    return void 0;
  const { baseUrl, models } = config;
  if (typeof baseUrl !== "string" || !Array.isArray(models))
    return void 0;
  return {
    baseUrl,
    models: models.filter(isRadiusGatewayModel).map((model) => ({ ...model }))
  };
}
function normalizeRadiusGatewayUrl(value) {
  const withScheme = /^https?:\/\//iu.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/u, "");
}
function getRadiusCredentialConfig(credential) {
  return sanitizeRadiusGatewayConfig(credential?.gatewayConfig);
}
function getRadiusModelsFromConfig(providerId, config) {
  return config.models.map((model) => ({
    ...model,
    api: "pi-messages",
    provider: providerId,
    baseUrl: config.baseUrl
  }));
}
function getRadiusModels(providerId, credential) {
  const config = getRadiusCredentialConfig(credential);
  return config ? getRadiusModelsFromConfig(providerId, config) : [];
}
function truncateHttpBody(body) {
  const trimmed = body.trim();
  return trimmed.length > 512 ? `${trimmed.slice(0, 512)}\u2026` : trimmed;
}
async function loadRadiusGatewayConfig(gateway, apiKey, signal) {
  const headers = { accept: "application/json" };
  if (apiKey)
    headers.authorization = `Bearer ${apiKey}`;
  const response = await fetch(new URL("/v1/config", gateway), { headers, signal });
  if (!response.ok) {
    throw new Error(`Could not load Radius config from ${gateway}: ${response.status}: ${truncateHttpBody(await response.text())}`);
  }
  const config = sanitizeRadiusGatewayConfig(await response.json());
  if (!config)
    throw new Error(`Invalid Radius config from ${gateway}`);
  return config;
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/radius.js
function radiusProvider(options = {}) {
  const id = options.id ?? "radius";
  const name = options.name ?? "Radius";
  const gateway = normalizeRadiusGatewayUrl(options.gateway ?? DEFAULT_RADIUS_GATEWAY);
  let models = getRadiusModels(id, void 0);
  let inflightRefresh;
  const streams = piMessagesApi();
  return {
    id,
    name,
    auth: {
      apiKey: envApiKeyAuth("Radius API key", ["RADIUS_API_KEY"]),
      oauth: lazyOAuth({ name, load: () => loadRadiusOAuth({ name, gateway }) })
    },
    getModels: () => models,
    refreshModels: (context) => {
      inflightRefresh ??= (async () => {
        try {
          const stored = await context.store.read();
          if (stored)
            models = stored.models.filter((model) => model.provider === id);
          if (!stored && context.credential?.type === "oauth") {
            const legacy = getRadiusModels(id, context.credential);
            if (legacy.length > 0) {
              models = legacy;
              await context.store.write({ models: legacy, checkedAt: Date.now() });
            }
          }
          if (!context.allowNetwork || context.signal?.aborted)
            return;
          const apiKey = context.credential?.type === "oauth" ? context.credential.access : context.credential?.key;
          const config = await loadRadiusGatewayConfig(gateway, apiKey, context.signal);
          if (context.signal?.aborted)
            return;
          models = getRadiusModelsFromConfig(id, config);
          await context.store.write({ models, checkedAt: Date.now() });
        } finally {
          inflightRefresh = void 0;
        }
      })();
      return inflightRefresh;
    },
    stream: (model, context, streamOptions) => streams.stream(model, context, streamOptions),
    streamSimple: (model, context, streamOptions) => streams.streamSimple(model, context, streamOptions)
  };
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/together.js
init_models();
function togetherProvider() {
  return createProvider({
    id: "together",
    name: "Together",
    baseUrl: "https://api.together.ai/v1",
    auth: { apiKey: envApiKeyAuth("Together API key", ["TOGETHER_API_KEY"]) },
    models: Object.values(TOGETHER_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/vercel-ai-gateway.js
init_models();
function vercelAIGatewayProvider() {
  return createProvider({
    id: "vercel-ai-gateway",
    name: "Vercel AI Gateway",
    baseUrl: "https://ai-gateway.vercel.sh",
    auth: { apiKey: envApiKeyAuth("Vercel AI Gateway API key", ["AI_GATEWAY_API_KEY"]) },
    models: Object.values(VERCEL_AI_GATEWAY_MODELS),
    api: anthropicMessagesApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xai.js
init_models();
function xaiProvider() {
  return createProvider({
    id: "xai",
    name: "xAI",
    baseUrl: "https://api.x.ai/v1",
    auth: {
      apiKey: envApiKeyAuth("xAI API key", ["XAI_API_KEY"]),
      oauth: lazyOAuth({
        name: "xAI (Grok/X subscription)",
        loginLabel: "Sign in with SuperGrok or X Premium",
        load: loadXaiOAuth
      })
    },
    models: Object.values(XAI_MODELS),
    api: {
      "openai-completions": openAICompletionsApi(),
      "openai-responses": openAIResponsesApi()
    }
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi.js
init_models();
function xiaomiProvider() {
  return createProvider({
    id: "xiaomi",
    name: "Xiaomi",
    baseUrl: "https://api.xiaomimimo.com/v1",
    auth: { apiKey: envApiKeyAuth("Xiaomi API key", ["XIAOMI_API_KEY"]) },
    models: Object.values(XIAOMI_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-ams.js
init_models();
function xiaomiTokenPlanAmsProvider() {
  return createProvider({
    id: "xiaomi-token-plan-ams",
    name: "Xiaomi Token Plan AMS",
    baseUrl: "https://token-plan-ams.xiaomimimo.com/v1",
    auth: { apiKey: envApiKeyAuth("Xiaomi Token Plan AMS API key", ["XIAOMI_TOKEN_PLAN_AMS_API_KEY"]) },
    models: Object.values(XIAOMI_TOKEN_PLAN_AMS_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-cn.js
init_models();
function xiaomiTokenPlanCnProvider() {
  return createProvider({
    id: "xiaomi-token-plan-cn",
    name: "Xiaomi Token Plan CN",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    auth: { apiKey: envApiKeyAuth("Xiaomi Token Plan CN API key", ["XIAOMI_TOKEN_PLAN_CN_API_KEY"]) },
    models: Object.values(XIAOMI_TOKEN_PLAN_CN_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/xiaomi-token-plan-sgp.js
init_models();
function xiaomiTokenPlanSgpProvider() {
  return createProvider({
    id: "xiaomi-token-plan-sgp",
    name: "Xiaomi Token Plan SGP",
    baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1",
    auth: { apiKey: envApiKeyAuth("Xiaomi Token Plan SGP API key", ["XIAOMI_TOKEN_PLAN_SGP_API_KEY"]) },
    models: Object.values(XIAOMI_TOKEN_PLAN_SGP_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/zai.js
init_models();
function zaiProvider() {
  return createProvider({
    id: "zai",
    name: "Z.AI",
    baseUrl: "https://api.z.ai/api/coding/paas/v4",
    auth: { apiKey: envApiKeyAuth("Z.AI API key", ["ZAI_API_KEY"]) },
    models: Object.values(ZAI_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/zai-coding-cn.js
init_models();
function zaiCodingCnProvider() {
  return createProvider({
    id: "zai-coding-cn",
    name: "Z.AI Coding CN",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    auth: { apiKey: envApiKeyAuth("Z.AI Coding CN API key", ["ZAI_CODING_CN_API_KEY"]) },
    models: Object.values(ZAI_CODING_CN_MODELS),
    api: openAICompletionsApi()
  });
}

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/all.js
function getBuiltinModel(provider, modelId) {
  const models = MODELS[provider];
  return models?.[modelId];
}
function getBuiltinProviders() {
  return Object.keys(MODELS);
}
function getBuiltinModelDataGeneratedAt() {
  const generatedAt = Date.parse(manifest_default.generatedAt);
  return Number.isNaN(generatedAt) ? void 0 : generatedAt;
}
function getBuiltinModels(provider) {
  const models = MODELS[provider];
  return models ? Object.values(models) : [];
}
function builtinProviders() {
  return [
    amazonBedrockProvider(),
    antLingProvider(),
    anthropicProvider(),
    azureOpenAIResponsesProvider(),
    cerebrasProvider(),
    cloudflareAIGatewayProvider(),
    cloudflareWorkersAIProvider(),
    deepseekProvider(),
    fireworksProvider(),
    githubCopilotProvider(),
    googleProvider(),
    googleVertexProvider(),
    groqProvider(),
    huggingfaceProvider(),
    kimiCodingProvider(),
    minimaxProvider(),
    minimaxCnProvider(),
    mistralProvider(),
    moonshotaiProvider(),
    moonshotaiCnProvider(),
    nvidiaProvider(),
    openaiProvider(),
    openaiCodexProvider(),
    opencodeProvider(),
    opencodeGoProvider(),
    openrouterProvider(),
    qwenTokenPlanProvider(),
    qwenTokenPlanCnProvider(),
    radiusProvider(),
    togetherProvider(),
    vercelAIGatewayProvider(),
    xaiProvider(),
    xiaomiProvider(),
    xiaomiTokenPlanAmsProvider(),
    xiaomiTokenPlanCnProvider(),
    xiaomiTokenPlanSgpProvider(),
    zaiProvider(),
    zaiCodingCnProvider()
  ];
}
function builtinModels(options) {
  const models = createModels(options);
  for (const provider of builtinProviders()) {
    models.setProvider(provider);
  }
  return models;
}
function builtinImagesProviders() {
  return [openrouterImagesProvider()];
}
function builtinImagesModels(options) {
  const models = createImagesModels(options);
  for (const provider of builtinImagesProviders()) {
    models.setProvider(provider);
  }
  return models;
}
export {
  builtinImagesModels,
  builtinImagesProviders,
  builtinModels,
  builtinProviders,
  getBuiltinModel,
  getBuiltinModelDataGeneratedAt,
  getBuiltinModels,
  getBuiltinProviders,
  radiusProvider
};
