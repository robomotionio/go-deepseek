// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/index.js
import { Type as Type2 } from "typebox";

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/event-stream.js
var EventStream = class {
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
var AssistantMessageEventStream = class extends EventStream {
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
function createAssistantMessageEventStream() {
  return new AssistantMessageEventStream();
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/lazy.js
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/context.js
var __rewriteRelativeImportExtension = function(path, preserveJsx) {
  if (typeof path === "string" && /^\.\.?\//.test(path)) {
    return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
      return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
    });
  }
  return path;
};
var importNodeModule = (specifier) => import(__rewriteRelativeImportExtension(specifier));
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/credential-store.js
var InMemoryCredentialStore = class {
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/helpers.js
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/diagnostics.js
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/auth/resolve.js
var ModelsError = class extends Error {
  code;
  constructor(code, message, options) {
    super(withCauseDetail(message, options?.cause), options);
    this.name = "ModelsError";
    this.code = code;
  }
};
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/images-models.js
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models-store.js
var InMemoryModelsStore = class {
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.js
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
var ModelsImpl = class {
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
function hasApi(model, api) {
  return model.api === api;
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
var EXTENDED_THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
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
function modelsAreEqual(a, b) {
  if (!a || !b)
    return false;
  return a.id === b.id && a.provider === b.provider;
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/providers/faux.js
var DEFAULT_API = "faux";
var DEFAULT_PROVIDER = "faux";
var DEFAULT_MODEL_ID = "faux-1";
var DEFAULT_MODEL_NAME = "Faux Model";
var DEFAULT_BASE_URL = "http://localhost:0";
var DEFAULT_MIN_TOKEN_SIZE = 3;
var DEFAULT_MAX_TOKEN_SIZE = 5;
var DEFAULT_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
};
function fauxText(text) {
  return { type: "text", text };
}
function fauxThinking(thinking) {
  return { type: "thinking", thinking };
}
function fauxToolCall(name, arguments_, options = {}) {
  return {
    type: "toolCall",
    id: options.id ?? randomId("tool"),
    name,
    arguments: arguments_
  };
}
function normalizeFauxAssistantContent(content) {
  if (typeof content === "string") {
    return [fauxText(content)];
  }
  return Array.isArray(content) ? content : [content];
}
function fauxAssistantMessage(content, options = {}) {
  return {
    role: "assistant",
    content: normalizeFauxAssistantContent(content),
    api: DEFAULT_API,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL_ID,
    usage: DEFAULT_USAGE,
    stopReason: options.stopReason ?? "stop",
    errorMessage: options.errorMessage,
    responseId: options.responseId,
    timestamp: options.timestamp ?? Date.now()
  };
}
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}
function randomId(prefix) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
function contentToText(content) {
  if (typeof content === "string") {
    return content;
  }
  return content.map((block) => {
    if (block.type === "text") {
      return block.text;
    }
    return `[image:${block.mimeType}:${block.data.length}]`;
  }).join("\n");
}
function assistantContentToText(content) {
  return content.map((block) => {
    if (block.type === "text") {
      return block.text;
    }
    if (block.type === "thinking") {
      return block.thinking;
    }
    return `${block.name}:${JSON.stringify(block.arguments)}`;
  }).join("\n");
}
function toolResultToText(message) {
  return [message.toolName, ...message.content.map((block) => contentToText([block]))].join("\n");
}
function messageToText(message) {
  if (message.role === "user") {
    return contentToText(message.content);
  }
  if (message.role === "assistant") {
    return assistantContentToText(message.content);
  }
  return toolResultToText(message);
}
function serializeContext(context) {
  const parts = [];
  if (context.systemPrompt) {
    parts.push(`system:${context.systemPrompt}`);
  }
  for (const message of context.messages) {
    parts.push(`${message.role}:${messageToText(message)}`);
  }
  if (context.tools?.length) {
    parts.push(`tools:${JSON.stringify(context.tools)}`);
  }
  return parts.join("\n\n");
}
function commonPrefixLength(a, b) {
  const length = Math.min(a.length, b.length);
  let index = 0;
  while (index < length && a[index] === b[index]) {
    index++;
  }
  return index;
}
function withUsageEstimate(message, context, options, promptCache) {
  const promptText = serializeContext(context);
  const promptTokens = estimateTokens(promptText);
  const outputTokens = estimateTokens(assistantContentToText(message.content));
  let input = promptTokens;
  let cacheRead = 0;
  let cacheWrite = 0;
  const sessionId = options?.sessionId;
  if (sessionId && options?.cacheRetention !== "none") {
    const previousPrompt = promptCache.get(sessionId);
    if (previousPrompt) {
      const cachedChars = commonPrefixLength(previousPrompt, promptText);
      cacheRead = estimateTokens(previousPrompt.slice(0, cachedChars));
      cacheWrite = estimateTokens(promptText.slice(cachedChars));
      input = Math.max(0, promptTokens - cacheRead);
    } else {
      cacheWrite = promptTokens;
    }
    promptCache.set(sessionId, promptText);
  }
  return {
    ...message,
    usage: {
      input,
      output: outputTokens,
      cacheRead,
      cacheWrite,
      totalTokens: input + outputTokens + cacheRead + cacheWrite,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
    }
  };
}
function splitStringByTokenSize(text, minTokenSize, maxTokenSize) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    const tokenSize = minTokenSize + Math.floor(Math.random() * (maxTokenSize - minTokenSize + 1));
    const charSize = Math.max(1, tokenSize * 4);
    chunks.push(text.slice(index, index + charSize));
    index += charSize;
  }
  return chunks.length > 0 ? chunks : [""];
}
function cloneMessage(message, api, provider, modelId) {
  const cloned = structuredClone(message);
  return {
    ...cloned,
    api,
    provider,
    model: modelId,
    timestamp: cloned.timestamp ?? Date.now(),
    usage: cloned.usage ?? DEFAULT_USAGE
  };
}
function createErrorMessage(error, api, provider, modelId) {
  return {
    role: "assistant",
    content: [],
    api,
    provider,
    model: modelId,
    usage: DEFAULT_USAGE,
    stopReason: "error",
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: Date.now()
  };
}
function createAbortedMessage(partial) {
  return {
    ...partial,
    stopReason: "aborted",
    errorMessage: "Request was aborted",
    timestamp: Date.now()
  };
}
function scheduleChunk(chunk, tokensPerSecond) {
  if (!tokensPerSecond || tokensPerSecond <= 0) {
    return new Promise((resolve) => queueMicrotask(resolve));
  }
  const delayMs = estimateTokens(chunk) / tokensPerSecond * 1e3;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
async function streamWithDeltas(stream, message, minTokenSize, maxTokenSize, tokensPerSecond, signal) {
  const partial = { ...message, content: [] };
  if (signal?.aborted) {
    const aborted = createAbortedMessage(partial);
    stream.push({ type: "error", reason: "aborted", error: aborted });
    stream.end(aborted);
    return;
  }
  stream.push({ type: "start", partial: { ...partial } });
  for (let index = 0; index < message.content.length; index++) {
    if (signal?.aborted) {
      const aborted = createAbortedMessage(partial);
      stream.push({ type: "error", reason: "aborted", error: aborted });
      stream.end(aborted);
      return;
    }
    const block = message.content[index];
    if (block.type === "thinking") {
      partial.content = [...partial.content, { type: "thinking", thinking: "" }];
      stream.push({ type: "thinking_start", contentIndex: index, partial: { ...partial } });
      for (const chunk of splitStringByTokenSize(block.thinking, minTokenSize, maxTokenSize)) {
        await scheduleChunk(chunk, tokensPerSecond);
        if (signal?.aborted) {
          const aborted = createAbortedMessage(partial);
          stream.push({ type: "error", reason: "aborted", error: aborted });
          stream.end(aborted);
          return;
        }
        partial.content[index].thinking += chunk;
        stream.push({ type: "thinking_delta", contentIndex: index, delta: chunk, partial: { ...partial } });
      }
      stream.push({
        type: "thinking_end",
        contentIndex: index,
        content: block.thinking,
        partial: { ...partial }
      });
      continue;
    }
    if (block.type === "text") {
      partial.content = [...partial.content, { type: "text", text: "" }];
      stream.push({ type: "text_start", contentIndex: index, partial: { ...partial } });
      for (const chunk of splitStringByTokenSize(block.text, minTokenSize, maxTokenSize)) {
        await scheduleChunk(chunk, tokensPerSecond);
        if (signal?.aborted) {
          const aborted = createAbortedMessage(partial);
          stream.push({ type: "error", reason: "aborted", error: aborted });
          stream.end(aborted);
          return;
        }
        partial.content[index].text += chunk;
        stream.push({ type: "text_delta", contentIndex: index, delta: chunk, partial: { ...partial } });
      }
      stream.push({ type: "text_end", contentIndex: index, content: block.text, partial: { ...partial } });
      continue;
    }
    partial.content = [...partial.content, { type: "toolCall", id: block.id, name: block.name, arguments: {} }];
    stream.push({ type: "toolcall_start", contentIndex: index, partial: { ...partial } });
    for (const chunk of splitStringByTokenSize(JSON.stringify(block.arguments), minTokenSize, maxTokenSize)) {
      await scheduleChunk(chunk, tokensPerSecond);
      if (signal?.aborted) {
        const aborted = createAbortedMessage(partial);
        stream.push({ type: "error", reason: "aborted", error: aborted });
        stream.end(aborted);
        return;
      }
      stream.push({ type: "toolcall_delta", contentIndex: index, delta: chunk, partial: { ...partial } });
    }
    partial.content[index].arguments = block.arguments;
    stream.push({ type: "toolcall_end", contentIndex: index, toolCall: block, partial: { ...partial } });
  }
  if (message.stopReason === "error" || message.stopReason === "aborted") {
    stream.push({ type: "error", reason: message.stopReason, error: message });
    stream.end(message);
    return;
  }
  stream.push({ type: "done", reason: message.stopReason, message });
  stream.end(message);
}
function createFauxCore(options) {
  const api = options.api ?? randomId(DEFAULT_API);
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const minTokenSize = Math.max(1, Math.min(options.tokenSize?.min ?? DEFAULT_MIN_TOKEN_SIZE, options.tokenSize?.max ?? DEFAULT_MAX_TOKEN_SIZE));
  const maxTokenSize = Math.max(minTokenSize, options.tokenSize?.max ?? DEFAULT_MAX_TOKEN_SIZE);
  let pendingResponses = [];
  const tokensPerSecond = options.tokensPerSecond;
  const state = { callCount: 0 };
  const promptCache = /* @__PURE__ */ new Map();
  const modelDefinitions = options.models?.length ? options.models : [
    {
      id: DEFAULT_MODEL_ID,
      name: DEFAULT_MODEL_NAME,
      reasoning: false,
      input: ["text", "image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128e3,
      maxTokens: 16384
    }
  ];
  const models = modelDefinitions.map((definition) => ({
    id: definition.id,
    name: definition.name ?? definition.id,
    api,
    provider,
    baseUrl: DEFAULT_BASE_URL,
    reasoning: definition.reasoning ?? false,
    input: definition.input ?? ["text", "image"],
    cost: definition.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: definition.contextWindow ?? 128e3,
    maxTokens: definition.maxTokens ?? 16384
  }));
  const stream = (requestModel, context, streamOptions) => {
    const outer = createAssistantMessageEventStream();
    const step = pendingResponses.shift();
    state.callCount++;
    queueMicrotask(async () => {
      try {
        await streamOptions?.onResponse?.({ status: 200, headers: {} }, requestModel);
        if (!step) {
          let message2 = createErrorMessage(new Error("No more faux responses queued"), api, provider, requestModel.id);
          message2 = withUsageEstimate(message2, context, streamOptions, promptCache);
          outer.push({ type: "error", reason: "error", error: message2 });
          outer.end(message2);
          return;
        }
        const resolved = typeof step === "function" ? await step(context, streamOptions, state, requestModel) : step;
        let message = cloneMessage(resolved, api, provider, requestModel.id);
        message = withUsageEstimate(message, context, streamOptions, promptCache);
        await streamWithDeltas(outer, message, minTokenSize, maxTokenSize, tokensPerSecond, streamOptions?.signal);
      } catch (error) {
        const message = createErrorMessage(error, api, provider, requestModel.id);
        outer.push({ type: "error", reason: "error", error: message });
        outer.end(message);
      }
    });
    return outer;
  };
  const streamSimple = (streamModel, context, streamOptions) => stream(streamModel, context, streamOptions);
  function getModel(requestedModelId) {
    if (!requestedModelId) {
      return models[0];
    }
    return models.find((candidate) => candidate.id === requestedModelId);
  }
  return {
    api,
    provider,
    models,
    stream,
    streamSimple,
    getModel,
    state,
    setResponses(responses) {
      pendingResponses = [...responses];
    },
    appendResponses(responses) {
      pendingResponses.push(...responses);
    },
    getPendingResponseCount() {
      return pendingResponses.length;
    }
  };
}
function fauxProvider(options = {}) {
  const core = createFauxCore(options);
  const provider = createProvider({
    id: core.provider,
    auth: { apiKey: { name: "Faux", resolve: async () => ({ auth: {} }) } },
    models: core.models,
    api: { stream: core.stream, streamSimple: core.streamSimple }
  });
  return {
    provider,
    api: core.api,
    models: core.models,
    getModel: core.getModel,
    state: core.state,
    setResponses: core.setResponses,
    appendResponses: core.appendResponses,
    getPendingResponseCount: core.getPendingResponseCount
  };
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/session-resources.js
var sessionResourceCleanups = /* @__PURE__ */ new Set();
function registerSessionResourceCleanup(cleanup) {
  sessionResourceCleanups.add(cleanup);
  return () => {
    sessionResourceCleanups.delete(cleanup);
  };
}
function cleanupSessionResources(sessionId) {
  const errors = [];
  for (const cleanup of sessionResourceCleanups) {
    try {
      cleanup(sessionId);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to cleanup session resources");
  }
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/json-parse.js
import { parse as partialParse } from "partial-json";
var VALID_JSON_ESCAPES = /* @__PURE__ */ new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/overflow.js
var OVERFLOW_PATTERNS = [
  /prompt is too long/i,
  // Anthropic token overflow
  /request_too_large/i,
  // Anthropic request byte-size overflow (HTTP 413)
  /input is too long for requested model/i,
  // Amazon Bedrock
  /exceeds the context window/i,
  // OpenAI (Completions & Responses API)
  /exceeds (?:the )?(?:model'?s )?maximum context length(?: of [\d,]+ tokens?|\s*\([\d,]+\))/i,
  // OpenAI-compatible proxies (LiteLLM)
  /input token count.*exceeds the maximum/i,
  // Google (Gemini)
  /maximum prompt length is \d+/i,
  // xAI (Grok)
  /reduce the length of the messages/i,
  // Groq
  /maximum context length is \d+ tokens/i,
  // OpenRouter (most backends)
  /exceeds (?:the )?maximum allowed input length of [\d,]+ tokens?/i,
  // OpenRouter/Poolside
  /input \(\d+ tokens\) is longer than the model'?s context length \(\d+ tokens\)/i,
  // Together AI
  /exceeds the limit of \d+/i,
  // GitHub Copilot
  /exceeds the available context size/i,
  // llama.cpp server
  /greater than the context length/i,
  // LM Studio
  /context window exceeds limit/i,
  // MiniMax
  /exceeded model token limit/i,
  // Kimi For Coding
  /too large for model with \d+ maximum context length/i,
  // Mistral
  /prompt has [\d,]+ tokens?, but the configured context size is [\d,]+ tokens?/i,
  // DS4 server
  /model_context_window_exceeded/i,
  // z.ai non-standard finish_reason surfaced as error text
  /prompt too long; exceeded (?:max )?context length/i,
  // Ollama explicit overflow error
  /range of input length should be/i,
  // DashScope / Qwen Token Plan
  /context[_ ]length[_ ]exceeded/i,
  // Generic fallback
  /too many tokens/i,
  // Generic fallback
  /token limit exceeded/i,
  // Generic fallback
  /^4(?:00|13)\s*(?:status code)?\s*\(no body\)/i
  // Cerebras: 400/413 with no body
];
var NON_OVERFLOW_PATTERNS = [
  /^(Throttling error|Service unavailable):/i,
  // AWS Bedrock non-overflow errors (human-readable prefixes from formatBedrockError)
  /rate limit/i,
  // Generic rate limiting
  /too many requests/i
  // Generic HTTP 429 style
];
function isContextOverflow(message, contextWindow) {
  if (message.stopReason === "error" && message.errorMessage) {
    const isNonOverflow = NON_OVERFLOW_PATTERNS.some((p) => p.test(message.errorMessage));
    if (!isNonOverflow && OVERFLOW_PATTERNS.some((p) => p.test(message.errorMessage))) {
      return true;
    }
  }
  if (contextWindow && message.stopReason === "stop") {
    const inputTokens = message.usage.input + message.usage.cacheRead;
    if (inputTokens > contextWindow) {
      return true;
    }
  }
  if (contextWindow && message.stopReason === "length" && message.usage.output === 0) {
    const inputTokens = message.usage.input + message.usage.cacheRead;
    if (inputTokens >= contextWindow * 0.99) {
      return true;
    }
  }
  return false;
}
function getOverflowPatterns() {
  return [...OVERFLOW_PATTERNS];
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/retry.js
function buildProviderErrorPattern(patterns) {
  return new RegExp(patterns.join("|"), "i");
}
var NON_RETRYABLE_PROVIDER_LIMIT_ERROR_PATTERN = buildProviderErrorPattern([
  // OpenCode Go/free-tier limits returned as 429 JSON error types by OpenCode's
  // Zen API. These are subscription/account limits, not transient throttles.
  "GoUsageLimitError",
  "FreeUsageLimitError",
  // OpenCode Go subscription-limit text asks users to enable available-balance
  // usage after rolling/weekly/monthly limits are reached.
  "Monthly usage limit reached",
  "available balance",
  // Generic quota/budget/billing exhaustion. `insufficient_quota` is OpenAI's
  // quota/billing error code; the other strings cover common gateway wording.
  "insufficient_quota",
  "out of budget",
  "quota exceeded",
  "billing"
]);
var RETRYABLE_PROVIDER_ERROR_PATTERN = buildProviderErrorPattern([
  // Generic provider load, HTTP status, and server-side transient failures.
  "overloaded",
  "rate.?limit",
  "too many requests",
  "429",
  "500",
  "502",
  "503",
  "504",
  "524",
  "service.?unavailable",
  "server.?error",
  "internal.?error",
  // Wrapper/provider text for transient upstream failures, including OpenRouter
  // "Provider returned error" responses (#2264).
  "provider.?returned.?error",
  // Network, proxy, and fetch transport failures. This includes OpenAI Codex
  // raw-fetch failures such as "upstream connect", "connection refused", and
  // "reset before headers" (#733), plus OpenRouter connection drops (#3317).
  "network.?error",
  "connection.?error",
  "connection.?refused",
  "connection.?lost",
  "other side closed",
  "fetch failed",
  "getaddrinfo",
  "ENOTFOUND",
  "EAI_AGAIN",
  "upstream.?connect",
  "reset before headers",
  "socket hang up",
  "socket connection was closed",
  "timed? out",
  "timeout",
  "terminated",
  // WebSocket transports can report close/error text instead of HTTP/fetch text.
  "websocket.?closed",
  "websocket.?error",
  // Premature stream endings from SDKs and transports. Anthropic can throw
  // "stream ended without ..." and "Anthropic stream ended before message_stop"
  // (#4433); Bedrock/Smithy can throw an HTTP/2 no-response error (#3594).
  "ended without",
  "stream ended before message_stop",
  "stream ended before a terminal response event",
  "http2 request did not get a response",
  // Provider-requested retry delay cap failures should flow through the outer
  // retry policy so callers can surface/abort the backoff (#1123).
  "retry delay",
  // Explicit retry guidance emitted mid-stream by OpenAI Responses and Bedrock
  // stream exceptions (#6019).
  "you can retry your request",
  "try your request again",
  "please retry your request",
  // gRPC based providers (e.g. NVIDIA NIM)
  "ResourceExhausted"
]);
var RetrySleepAbortError = class extends Error {
  constructor() {
    super("Aborted");
  }
};
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new RetrySleepAbortError());
      return;
    }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new RetrySleepAbortError());
    }, { once: true });
  });
}
async function retryAssistantCall(produce, policy, signal, callbacks) {
  const maxAttempts = policy?.enabled ? policy.maxRetries : 0;
  let attempt = 0;
  let lastRetry;
  for (; ; ) {
    const response = await produce();
    if (response.stopReason === "aborted") {
      if (lastRetry)
        await callbacks?.onRetryFinished?.(false, lastRetry.attempt);
      return response;
    }
    if (response.stopReason !== "error") {
      if (lastRetry)
        await callbacks?.onRetryFinished?.(true, lastRetry.attempt);
      return response;
    }
    if (attempt >= maxAttempts || !isRetryableAssistantError(response)) {
      if (lastRetry)
        await callbacks?.onRetryFinished?.(false, lastRetry.attempt, response.errorMessage);
      return response;
    }
    attempt++;
    lastRetry = { attempt, errorMessage: response.errorMessage || "Unknown error" };
    const delayMs = policy.baseDelayMs * 2 ** (attempt - 1);
    await callbacks?.onRetryScheduled?.(attempt, maxAttempts, delayMs, lastRetry.errorMessage);
    try {
      await sleep(delayMs, signal);
    } catch (error) {
      await callbacks?.onRetryFinished?.(false, attempt, lastRetry.errorMessage);
      if (error instanceof RetrySleepAbortError) {
        return { ...response, stopReason: "aborted", errorMessage: void 0 };
      }
      throw error;
    }
    await callbacks?.onRetryAttemptStart?.();
  }
}
function isRetryableAssistantError(message) {
  if (message.stopReason !== "error" || !message.errorMessage)
    return false;
  const errorMessage = message.errorMessage;
  if (NON_RETRYABLE_PROVIDER_LIMIT_ERROR_PATTERN.test(errorMessage))
    return false;
  return RETRYABLE_PROVIDER_ERROR_PATTERN.test(errorMessage);
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/text.js
function contentText(content, separator = "\n") {
  if (typeof content === "string")
    return content;
  return content.filter((block) => block.type === "text").map((block) => block.text).join(separator);
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/typebox-helpers.js
import { Type } from "typebox";
function StringEnum(values, options) {
  return Type.Unsafe({
    type: "string",
    enum: values,
    ...options?.description && { description: options.description },
    ...options?.default && { default: options.default }
  });
}

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/uuid.js
var lastTimestamp = -Infinity;
var sequence = 0;
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

// ../../source/deepseek-harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/validation.js
import { Compile } from "typebox/compile";
import { Value } from "typebox/value";
var validatorCache = /* @__PURE__ */ new WeakMap();
var TYPEBOX_KIND = /* @__PURE__ */ Symbol.for("TypeBox.Kind");
function getSchemaTypes(schema) {
  if (typeof schema.type === "string") {
    return [schema.type];
  }
  if (Array.isArray(schema.type)) {
    return schema.type.filter((type) => typeof type === "string");
  }
  return [];
}
function matchesJsonType(value, type) {
  switch (type) {
    case "number":
      return typeof value === "number";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "string":
      return typeof value === "string";
    case "null":
      return value === null;
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}
function getSubSchemaValidator(schema) {
  try {
    return getValidator(schema);
  } catch {
    return void 0;
  }
}
function coercePrimitiveByType(value, type) {
  switch (type) {
    case "number": {
      if (value === null) {
        return 0;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }
      return value;
    }
    case "integer": {
      if (value === null) {
        return 0;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isInteger(parsed)) {
          return parsed;
        }
      }
      if (typeof value === "boolean") {
        return value ? 1 : 0;
      }
      return value;
    }
    case "boolean": {
      if (value === null) {
        return false;
      }
      if (typeof value === "string") {
        if (value === "true") {
          return true;
        }
        if (value === "false") {
          return false;
        }
      }
      if (typeof value === "number") {
        if (value === 1) {
          return true;
        }
        if (value === 0) {
          return false;
        }
      }
      return value;
    }
    case "string": {
      if (value === null) {
        return "";
      }
      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
      return value;
    }
    case "null": {
      if (value === "" || value === 0 || value === false) {
        return null;
      }
      return value;
    }
    default:
      return value;
  }
}
function applySchemaObjectCoercion(value, schema) {
  const properties = schema.properties;
  const definedKeys = new Set(properties ? Object.keys(properties) : []);
  if (properties) {
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (!(key in value)) {
        continue;
      }
      value[key] = coerceWithJsonSchema(value[key], propertySchema);
    }
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    for (const [key, propertyValue] of Object.entries(value)) {
      if (definedKeys.has(key)) {
        continue;
      }
      value[key] = coerceWithJsonSchema(propertyValue, schema.additionalProperties);
    }
  }
}
function applySchemaArrayCoercion(value, schema) {
  if (Array.isArray(schema.items)) {
    for (let index = 0; index < value.length; index++) {
      const itemSchema = schema.items[index];
      if (!itemSchema) {
        continue;
      }
      value[index] = coerceWithJsonSchema(value[index], itemSchema);
    }
    return;
  }
  if (schema.items && typeof schema.items === "object") {
    for (let index = 0; index < value.length; index++) {
      value[index] = coerceWithJsonSchema(value[index], schema.items);
    }
  }
}
function coerceWithUnionSchema(value, schemas) {
  for (const schema of schemas) {
    const candidate = structuredClone(value);
    const coerced = coerceWithJsonSchema(candidate, schema);
    const validator = getSubSchemaValidator(schema);
    if (validator?.Check(coerced)) {
      return coerced;
    }
  }
  return value;
}
function coerceWithJsonSchema(value, schema) {
  let nextValue = value;
  if (Array.isArray(schema.allOf)) {
    for (const nested of schema.allOf) {
      nextValue = coerceWithJsonSchema(nextValue, nested);
    }
  }
  if (Array.isArray(schema.anyOf)) {
    nextValue = coerceWithUnionSchema(nextValue, schema.anyOf);
  }
  if (Array.isArray(schema.oneOf)) {
    nextValue = coerceWithUnionSchema(nextValue, schema.oneOf);
  }
  const schemaTypes = getSchemaTypes(schema);
  const matchesUnionMember = schemaTypes.length > 1 && schemaTypes.some((schemaType) => matchesJsonType(nextValue, schemaType));
  if (schemaTypes.length > 0 && !matchesUnionMember) {
    for (const schemaType of schemaTypes) {
      const candidate = coercePrimitiveByType(nextValue, schemaType);
      if (candidate !== nextValue) {
        nextValue = candidate;
        break;
      }
    }
  }
  if (schemaTypes.includes("object") && typeof nextValue === "object" && nextValue !== null && !Array.isArray(nextValue)) {
    applySchemaObjectCoercion(nextValue, schema);
  }
  if (schemaTypes.includes("array") && Array.isArray(nextValue)) {
    applySchemaArrayCoercion(nextValue, schema);
  }
  return nextValue;
}
function getValidator(schema) {
  const key = schema;
  const cached = validatorCache.get(key);
  if (cached) {
    return cached;
  }
  const validator = Compile(schema);
  validatorCache.set(key, validator);
  return validator;
}
function formatValidationPath(error) {
  if (error.keyword === "required") {
    const requiredProperties = error.params.requiredProperties;
    const requiredProperty = requiredProperties?.[0];
    if (requiredProperty) {
      const basePath = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
      return basePath ? `${basePath}.${requiredProperty}` : requiredProperty;
    }
  }
  const path = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
  return path || "root";
}
function validateToolCall(tools, toolCall) {
  const tool = tools.find((t) => t.name === toolCall.name);
  if (!tool) {
    throw new Error(`Tool "${toolCall.name}" not found`);
  }
  return validateToolArguments(tool, toolCall);
}
function validateToolArguments(tool, toolCall) {
  const args = structuredClone(toolCall.arguments);
  Value.Convert(tool.parameters, args);
  const validator = getValidator(tool.parameters);
  if (!Object.getOwnPropertySymbols(tool.parameters).includes(TYPEBOX_KIND)) {
    const coerced = coerceWithJsonSchema(args, tool.parameters);
    if (coerced !== args) {
      if (typeof args === "object" && args !== null && typeof coerced === "object" && coerced !== null) {
        for (const key of Object.keys(args)) {
          delete args[key];
        }
        Object.assign(args, coerced);
      } else {
        return validator.Check(coerced) ? coerced : args;
      }
    }
  }
  if (validator.Check(args)) {
    return args;
  }
  const errors = validator.Errors(args).map((error) => `  - ${formatValidationPath(error)}: ${error.message}`).join("\n") || "Unknown validation error";
  const errorMessage = `Validation failed for tool "${toolCall.name}":
${errors}

Received arguments:
${JSON.stringify(toolCall.arguments, null, 2)}`;
  throw new Error(errorMessage);
}
export {
  AssistantMessageEventStream,
  EventStream,
  InMemoryCredentialStore,
  InMemoryModelsStore,
  ModelsError,
  StringEnum,
  Type2 as Type,
  appendAssistantMessageDiagnostic,
  calculateCost,
  clampThinkingLevel,
  cleanupSessionResources,
  contentText,
  createAssistantMessageDiagnostic,
  createAssistantMessageEventStream,
  createFauxCore,
  createImagesModels,
  createImagesProvider,
  createModels,
  createProvider,
  defaultProviderAuthContext,
  envApiKeyAuth,
  extractDiagnosticError,
  fauxAssistantMessage,
  fauxProvider,
  fauxText,
  fauxThinking,
  fauxToolCall,
  formatThrownValue,
  getOverflowPatterns,
  getSupportedThinkingLevels,
  hasApi,
  isContextOverflow,
  isRetryableAssistantError,
  lazyApi,
  lazyOAuth,
  lazyStream,
  modelsAreEqual,
  parseJsonWithRepair,
  parseStreamingJson,
  registerSessionResourceCleanup,
  repairJson,
  retryAssistantCall,
  uuidv7,
  validateToolArguments,
  validateToolCall
};
