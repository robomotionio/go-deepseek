// .harness/packages/llm/llm-pi-ai/lib/index.js
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { CONTEXT_WINDOW_EXCEEDED_CODE, EMPTY_RESPONSE_CODE, IMAGE_OFFLOAD_REQUIRED_CODE, INVALID_CREDENTIAL_CODE, LlmAdapter, LlmError, QUOTA_EXCEEDED_CODE, ReasoningEffortId, RetryPolicySchema, assertUsableApiKey, attributionHeaders, contentHasImage, isContextWindowExceededError, isQuotaExceededError, normalizeApiKey, offloadedImageText, projectOffloadedImages, requestImageHandleText, requiredImageOffload, resolveImageAttachmentAccess, resolveRetryPolicy } from "@deepseek-ai/dsh-llm";
import { deepEqualJson } from "@deepseek-ai/dsh-util-values";
import { MAX_TIMER_DELAY_MS, idleWatchdog, timeoutOf } from "@deepseek-ai/dsh-timeout";
import { brandString } from "@deepseek-ai/dsh-brand";
import { requestImageDimensions } from "@deepseek-ai/dsh-attachment";
import z from "@deepseek-ai/schemastery";
import { credentialKey, credentialKeyId, credentialKeyScope, credentialRef, isCredentialKeySegment, isCredentialRefName } from "@deepseek-ai/dsh-credentials";
import { builtinModels, builtinProviders, getBuiltinModels, getBuiltinProviders } from "@earendil-works/pi-ai/providers/all";
import { anthropicMessagesApi } from "@earendil-works/pi-ai/api/anthropic-messages.lazy";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { openAIResponsesApi } from "@earendil-works/pi-ai/api/openai-responses.lazy";
import { isContextOverflow } from "@earendil-works/pi-ai/utils/overflow";
import { homedir } from "node:os";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
function parseArguments(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
  } catch {
  }
  return {};
}
function emptyPiUsage() {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      total: 0
    }
  };
}
function toPiReplayState(message, requestedModel = message.model) {
  const responseModel = message.api === "anthropic-messages" && message.model !== requestedModel ? message.model : message.responseModel;
  return {
    response: {
      kind: "pi-ai",
      version: 2,
      api: message.api,
      provider: message.provider,
      model: requestedModel,
      ...responseModel === void 0 ? {} : { responseModel },
      ...message.responseId === void 0 ? {} : { responseId: message.responseId },
      ...message.providerThinkingLevel === void 0 ? {} : { providerThinkingLevel: message.providerThinkingLevel },
      stopReason: message.stopReason
    },
    blocks: message.content.map((block) => {
      switch (block.type) {
        case "text":
          return {
            type: "text",
            ...block.textSignature === void 0 ? {} : { textSignature: block.textSignature }
          };
        case "thinking":
          return {
            type: "reasoning",
            ...block.thinkingSignature === void 0 ? {} : { thinkingSignature: block.thinkingSignature },
            ...block.redacted === void 0 ? {} : { redacted: block.redacted }
          };
        case "toolCall":
          return {
            type: "tool-call",
            ...block.thoughtSignature === void 0 ? {} : { thoughtSignature: block.thoughtSignature }
          };
      }
    })
  };
}
function invalidReplay(message) {
  throw new LlmError(`invalid pi-ai replay state: ${message}`, "INVALID_REPLAY_STATE");
}
function readReplayState(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return invalidReplay("expected a replay envelope");
  const envelope = value;
  const rawResponse = envelope["response"];
  if (typeof rawResponse !== "object" || rawResponse === null || Array.isArray(rawResponse)) return invalidReplay("expected a response object");
  const response = rawResponse;
  if (response["kind"] !== "pi-ai") return invalidReplay("unknown state kind");
  if (response["version"] !== 2) return invalidReplay(`unsupported version ${String(response["version"])}`);
  for (const key of [
    "api",
    "provider",
    "model"
  ]) if (typeof response[key] !== "string" || response[key].length === 0) return invalidReplay(`${key} must be a non-empty string`);
  if (![
    "stop",
    "length",
    "toolUse",
    "error",
    "aborted"
  ].includes(String(response["stopReason"]))) return invalidReplay("unknown stopReason");
  if (response["responseModel"] !== void 0 && typeof response["responseModel"] !== "string") return invalidReplay("responseModel must be a string");
  if (response["responseId"] !== void 0 && typeof response["responseId"] !== "string") return invalidReplay("responseId must be a string");
  if (response["providerThinkingLevel"] !== void 0 && typeof response["providerThinkingLevel"] !== "string") return invalidReplay("providerThinkingLevel must be a string");
  const blocks = envelope["blocks"];
  if (!Array.isArray(blocks)) return invalidReplay("blocks must be an array");
  for (const [index, value2] of blocks.entries()) {
    if (typeof value2 !== "object" || value2 === null || Array.isArray(value2)) return invalidReplay(`block ${index} must be an object`);
    const block = value2;
    if (![
      "text",
      "reasoning",
      "tool-call"
    ].includes(String(block["type"]))) return invalidReplay(`block ${index} has an unknown type`);
    for (const signature of [
      "textSignature",
      "thinkingSignature",
      "thoughtSignature"
    ]) if (block[signature] !== void 0 && typeof block[signature] !== "string") return invalidReplay(`block ${index} ${signature} must be a string`);
    if (block["redacted"] !== void 0 && typeof block["redacted"] !== "boolean") return invalidReplay(`block ${index} redacted must be boolean`);
  }
  return {
    response,
    blocks
  };
}
function foreignAssistant(message) {
  const source = message.source.kind === "model" ? message.source : void 0;
  const content = [];
  for (const block of message.content) switch (block.type) {
    case "text":
      content.push({
        type: "text",
        text: block.text
      });
      break;
    case "reasoning":
      content.push({
        type: "thinking",
        thinking: block.text
      });
      break;
    case "tool-call":
      content.push({
        type: "toolCall",
        id: block.id,
        name: block.name,
        arguments: parseArguments(block.arguments)
      });
      break;
    case "image":
      throw new LlmError("pi-ai chat history cannot represent structured assistant image output", "UNSUPPORTED_CONTENT");
    default:
      break;
  }
  return {
    role: "assistant",
    content,
    api: "dsh-foreign",
    provider: source?.provider ?? "dsh-foreign",
    model: source?.model ?? "dsh-foreign",
    usage: emptyPiUsage(),
    stopReason: content.some((piece) => piece.type === "toolCall") ? "toolUse" : "stop",
    timestamp: 0
  };
}
function replayedAssistant(message, source, rawState) {
  const state = readReplayState(rawState);
  if (state.response.provider !== source.provider) return invalidReplay("provider does not match assistant source");
  if (state.response.model !== source.model) return invalidReplay("model does not match assistant source");
  if (state.blocks.length !== message.content.length) return invalidReplay("block count does not match assistant content");
  return {
    role: "assistant",
    content: message.content.map((block, index) => {
      const replay = state.blocks[index];
      if (replay === void 0 || replay.type !== block.type) return invalidReplay(`block ${index} does not match assistant content`);
      switch (block.type) {
        case "text":
          return {
            type: "text",
            text: block.text,
            ...replay.type === "text" && replay.textSignature !== void 0 ? { textSignature: replay.textSignature } : {}
          };
        case "reasoning":
          return {
            type: "thinking",
            thinking: block.text,
            ...replay.type === "reasoning" && replay.thinkingSignature !== void 0 ? { thinkingSignature: replay.thinkingSignature } : {},
            ...replay.type === "reasoning" && replay.redacted !== void 0 ? { redacted: replay.redacted } : {}
          };
        case "tool-call":
          return {
            type: "toolCall",
            id: block.id,
            name: block.name,
            arguments: parseArguments(block.arguments),
            ...replay.type === "tool-call" && replay.thoughtSignature !== void 0 ? { thoughtSignature: replay.thoughtSignature } : {}
          };
        /* v8 ignore next -- readReplayState rejects unknown replay tags, so an equal plugin-added Harness tag cannot reach this switch */
        default:
          return invalidReplay(`block ${index} has an unsupported Harness type`);
      }
    }),
    api: state.response.api,
    provider: state.response.provider,
    model: state.response.api === "anthropic-messages" ? state.response.responseModel ?? state.response.model : state.response.model,
    ...state.response.responseModel === void 0 ? {} : { responseModel: state.response.responseModel },
    ...state.response.responseId === void 0 ? {} : { responseId: state.response.responseId },
    ...state.response.providerThinkingLevel === void 0 ? {} : { providerThinkingLevel: state.response.providerThinkingLevel },
    usage: emptyPiUsage(),
    stopReason: state.response.stopReason,
    timestamp: 0
  };
}
function toPiAssistant(message, onDegrade) {
  const source = message.source;
  if (source.kind !== "model" || source.replayState === void 0) return foreignAssistant(message);
  try {
    return replayedAssistant(message, source, source.replayState);
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== "INVALID_REPLAY_STATE") throw error;
    onDegrade?.(error.message);
    return foreignAssistant(message);
  }
}
var NO_COST = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0
};
var MODALITIES = Object.keys({
  text: true,
  image: true
});
function declaredInput(configured) {
  return configured === void 0 || configured.length === 0 ? void 0 : [...configured];
}
var THINKING_LEVELS = Object.keys({
  off: true,
  minimal: true,
  low: true,
  medium: true,
  high: true,
  xhigh: true,
  max: true
});
var SUPPORTED_THINKING_FORMATS = Object.keys({
  "openai": true,
  "deepseek": true,
  "openrouter": true,
  "together": true,
  "baseten": true,
  "zai": true,
  "qwen": true,
  "chat-template": true,
  "qwen-chat-template": true,
  "string-thinking": true,
  "ant-ling": true
});
var MAX_TOKENS_FIELDS = Object.keys({
  max_completion_tokens: true,
  max_tokens: true
});
var THINKING_TOKEN_BUDGET_FIELDS = Object.keys({
  thinking_token_budget: true,
  thinking_budget: true,
  thinking_budget_tokens: true
});
var CACHE_CONTROL_FORMATS = Object.keys({ anthropic: true });
var CHAT_TEMPLATE_VARS = Object.keys({
  "thinking.enabled": true,
  "thinking.effort": true,
  "thinking.budget": true
});
var providerIndex;
function catalogProviders() {
  providerIndex ??= new Map(builtinProviders().map((provider) => [provider.id, provider]));
  return providerIndex;
}
function catalogProvider(provider) {
  return catalogProviders().get(provider);
}
function catalogProviderIds() {
  return getBuiltinProviders();
}
function catalogModels(provider) {
  if (!catalogProviders().has(provider)) return /* @__PURE__ */ new Map();
  const models = getBuiltinModels(provider);
  return new Map(models.map((model) => [model.id, model]));
}
var COMPLETIONS_COMPAT_GATE = {
  supportsStore: "offer",
  supportsDeveloperRole: "offer",
  supportsReasoningEffort: "offer",
  supportsUsageInStreaming: "offer",
  supportsFinishReason: "offer",
  maxTokensField: "offer",
  requiresToolResultName: "offer",
  requiresAssistantAfterToolResult: "offer",
  requiresThinkingAsText: "offer",
  requiresReasoningContentOnAssistantMessages: "offer",
  thinkingFormat: "offer",
  chatTemplateKwargs: "offer",
  chatTemplateArgs: "offer",
  supportsThinkingTokenBudget: "offer",
  thinkingTokenBudgetField: "offer",
  vllmPriority: "offer",
  supportsStrictMode: "offer",
  cacheControlFormat: "offer",
  supportsLongCacheRetention: "offer",
  openRouterRouting: "withhold",
  vercelGatewayRouting: "withhold",
  zaiToolStream: "withhold",
  supportsOpenAIGrammarTools: "withhold",
  sendSessionAffinityHeaders: "withhold",
  deferredToolsMode: "withhold",
  sessionAffinityFormat: "withhold"
};
var RESPONSES_COMPAT_GATE = {
  supportsDeveloperRole: "offer",
  supportsMaxOutputTokens: "offer",
  supportsStrictMode: "offer",
  supportsLongCacheRetention: "offer",
  sessionAffinityFormat: "withhold",
  supportsOpenAIGrammarTools: "withhold",
  supportsAdditionalTools: "withhold",
  supportsToolSearch: "withhold",
  supportsExplicitPromptCacheMode: "withhold"
};
var COMPAT_GATES = {
  "openai-completions": COMPLETIONS_COMPAT_GATE,
  "openai-responses": RESPONSES_COMPAT_GATE,
  "azure-openai-responses": RESPONSES_COMPAT_GATE,
  "openai-codex-responses": RESPONSES_COMPAT_GATE,
  "anthropic-messages": {
    supportsEagerToolInputStreaming: "offer",
    supportsLongCacheRetention: "offer",
    supportsCacheControlOnTools: "offer",
    supportsTemperature: "offer",
    forceAdaptiveThinking: "offer",
    allowEmptySignature: "offer",
    supportsStrictTools: "offer",
    sendSessionAffinityHeaders: "withhold",
    supportsToolReferences: "withhold",
    supportsMidConvoEffort: "withhold",
    allowedFallbackModels: "withhold"
  },
  "bedrock-converse-stream": { supportsStrictMode: "offer" }
};
function compatGate(api) {
  return COMPAT_GATES[api];
}
function configuredCompatEntries(compat) {
  return Object.entries(compat ?? {}).flatMap(([field, value]) => {
    return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0 ? [] : [[field, value]];
  });
}
function compatProtocols(field) {
  return Object.entries(COMPAT_GATES).flatMap(([api, gate]) => gate[field] === "offer" ? [api] : []);
}
function offeredCompatFields(api) {
  return Object.entries(compatGate(api) ?? {}).flatMap(([field, disposition]) => disposition === "offer" ? [field] : []);
}
function allOfferedCompatFields() {
  const fields = /* @__PURE__ */ new Set();
  for (const api of Object.keys(COMPAT_GATES)) for (const field of offeredCompatFields(api)) fields.add(field);
  return [...fields];
}
function assertOfferedCompatFields(provider, site, compat) {
  for (const [field, value] of Object.entries(compat ?? {})) {
    if (compatProtocols(field).length === 0) {
      if (Object.values(COMPAT_GATES).some((gate) => gate[field] !== void 0)) invalid(provider, `${site} sets compat "${field}", which is not configurable here: pi-ai's installed catalog sets it for the vendors that need it, so name that provider as the route instead`);
      invalid(provider, `${site} sets compat "${field}", which no wire protocol declares; the configurable switches are ${allOfferedCompatFields().join(", ")}`);
    }
    if (value == null) invalid(provider, `${site} sets compat "${field}" with no value; give it one, or remove the key to leave the field to the next layer \u2014 the installed catalog entry, then pi-ai's own detection`);
  }
}
var PiAiCatalogError = class extends Error {
};
function invalid(provider, detail) {
  throw new PiAiCatalogError(`llm-pi-ai: provider "${provider}" ${detail}`);
}
function sharedCatalogApi(defaults) {
  const apis = /* @__PURE__ */ new Set();
  for (const model of defaults.values()) apis.add(model.api);
  return apis.size === 1 ? [...apis][0] : void 0;
}
function resolveModelReasoning(provider, entry, base) {
  const efforts = entry.reasoningEfforts;
  if (efforts === void 0) return { reasoning: base?.reasoning ?? false };
  if (efforts === false) return { reasoning: false };
  if (efforts === null || Object.keys(efforts).length === 0) invalid(provider, `model "${entry.id}" has an empty reasoningEfforts; declare the offered levels, set false for a non-reasoning model, or omit the field to keep the installed catalog's capability`);
  const declared = THINKING_LEVELS.flatMap((level) => {
    const wire = efforts[level];
    return wire === void 0 ? [] : [[level, wire]];
  });
  for (const [level, wire] of declared) if (wire === null) {
    if (level !== "off") invalid(provider, `model "${entry.id}" reasoningEfforts.${level} needs the wire value dispatch should send; only "off" may leave it empty`);
  } else if (wire.length === 0) invalid(provider, `model "${entry.id}" reasoningEfforts.${level} must not be an empty string`);
  if (!declared.some(([level]) => level !== "off")) invalid(provider, `model "${entry.id}" reasoningEfforts offers no level beyond "off"; declare a thinking level, or set reasoningEfforts to false for a non-reasoning model`);
  const map = {};
  for (const level of THINKING_LEVELS) {
    const wire = efforts[level];
    if (wire === void 0) map[level] = null;
    else if (wire !== null) map[level] = wire;
  }
  return {
    reasoning: true,
    thinkingLevelMap: map
  };
}
function resolveModelCompat(provider, entry, route, base, api) {
  const gate = compatGate(api);
  const configured = {};
  for (const [field, value] of configuredCompatEntries(route)) {
    if (gate?.[field] !== "offer") continue;
    configured[field] = value;
  }
  for (const [field, value] of configuredCompatEntries(entry.compat)) {
    if (gate?.[field] !== "offer") {
      const offered = offeredCompatFields(api);
      invalid(provider, `model "${entry.id}" sets compat "${field}", but its api is "${api}", which does not take it; that switch exists on ${compatProtocols(field).join(", ")}, and "${api}" offers ${offered.length === 0 ? "no configurable compat" : offered.join(", ")}`);
    }
    configured[field] = value;
  }
  if (Object.keys(configured).length === 0) return {};
  return { compat: {
    ...base?.api === api ? base.compat : void 0,
    ...configured
  } };
}
function resolveRouteModels(request, validation = "strict") {
  const { provider } = request;
  const defaults = catalogModels(provider);
  const providerBaseUrl = catalogProvider(provider)?.baseUrl;
  const configured = request.models ?? [];
  const overrides = request.modelOverrides ?? {};
  const modelErrors = /* @__PURE__ */ new Map();
  for (const [id, override] of Object.entries(overrides)) {
    if (id.length === 0) invalid(provider, "has a modelOverrides entry with an empty model id");
    if (defaults.size === 0) invalid(provider, `sets modelOverrides for "${id}", but the installed catalog does not describe this route; a declared route spells every model out in its models list`);
    if (configured.length > 0) invalid(provider, `sets modelOverrides for "${id}" beside a models list; models already replaces the served catalog, so declare the fields on its entries`);
    if (!defaults.has(id)) {
      const message = `modelOverrides names "${id}", which the installed catalog does not describe`;
      if (validation === "strict") invalid(provider, message);
      modelErrors.set(id, `llm-pi-ai: provider "${provider}" ${message}`);
    }
    if ("id" in override) invalid(provider, `modelOverrides entry "${id}" sets "id", which is the dict key`);
  }
  const entries = configured.length > 0 ? configured : [...defaults.values()].map((model) => ({
    id: model.id,
    ...overrides[model.id]
  }));
  if (entries.length === 0) invalid(provider, "resolves no models; the installed catalog does not describe this route, so its models must be listed in configuration");
  const routeApi = sharedCatalogApi(defaults);
  assertOfferedCompatFields(provider, "route", request.compat);
  const seen = /* @__PURE__ */ new Set();
  const configuredMaxTokens = /* @__PURE__ */ new Map();
  const resolveEntry = (entry) => {
    assertOfferedCompatFields(provider, `model "${entry.id}"`, entry.compat);
    if (entry.id.length === 0) invalid(provider, "has a model with an empty id");
    if (seen.has(entry.id)) invalid(provider, `lists model "${entry.id}" more than once`);
    seen.add(entry.id);
    const base = defaults.get(entry.id);
    const api = request.api ?? base?.api ?? routeApi;
    if (api === void 0) invalid(provider, `model "${entry.id}" needs an api; the installed catalog does not describe it, so set the route's api to the wire protocol its endpoint speaks`);
    const baseUrl = request.baseURL ?? base?.baseUrl ?? providerBaseUrl;
    if (baseUrl === void 0) invalid(provider, `model "${entry.id}" needs a baseURL; the installed catalog does not describe this route`);
    const contextWindow = entry.contextWindow ?? base?.contextWindow ?? request.defaultContextWindow;
    if (!Number.isInteger(contextWindow) || contextWindow <= 0) invalid(provider, `model "${entry.id}" contextWindow must be a positive integer`);
    const maxTokens = entry.maxTokens ?? base?.maxTokens ?? request.defaultMaxTokens;
    if (!Number.isInteger(maxTokens) || maxTokens <= 0) invalid(provider, `model "${entry.id}" maxTokens must be a positive integer`);
    if (entry.maxTokens !== void 0) configuredMaxTokens.set(entry.id, entry.maxTokens);
    return {
      ...base,
      id: entry.id,
      name: entry.name ?? base?.name ?? entry.id,
      api,
      provider,
      baseUrl,
      input: declaredInput(entry.input) ?? base?.input ?? [...request.defaultInput],
      cost: base?.cost ?? NO_COST,
      contextWindow,
      maxTokens,
      ...resolveModelReasoning(provider, entry, base),
      ...resolveModelCompat(provider, entry, request.compat, base, api)
    };
  };
  const models = [];
  for (const entry of entries) {
    let model;
    try {
      model = resolveEntry(entry);
    } catch (error) {
      if (validation === "strict" || !(error instanceof PiAiCatalogError)) throw error;
      modelErrors.set(entry.id, error.message);
      continue;
    }
    models.push(model);
  }
  const serviceableModels = models.filter((model) => !modelErrors.has(model.id));
  for (const [field] of configuredCompatEntries(request.compat)) {
    const takers = compatProtocols(field);
    if (serviceableModels.some((model) => takers.includes(model.api))) continue;
    invalid(provider, `sets compat "${field}", but no model on the route speaks a protocol that takes it; it exists on ${takers.join(", ")}`);
  }
  return {
    models: serviceableModels,
    configuredMaxTokens,
    modelErrors
  };
}
function createModels(options) {
  const models = builtinModels(options);
  models.clearProviders();
  return models;
}
function createProvider(input) {
  return {
    id: input.id,
    name: input.name,
    ...input.baseUrl === void 0 ? {} : { baseUrl: input.baseUrl },
    auth: input.auth,
    getModels: () => input.models,
    stream: (model, context, options) => input.api.stream(model, context, options),
    streamSimple: (model, context, options) => input.api.streamSimple(model, context, options)
  };
}
function getSupportedThinkingLevels(model) {
  if (!model.reasoning) return ["off"];
  return THINKING_LEVELS.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level];
    if (mapped === null) return false;
    if (level === "xhigh" || level === "max") return mapped !== void 0;
    return true;
  });
}
var PROTOCOLS = {
  "openai-completions": openAICompletionsApi,
  "openai-responses": openAIResponsesApi,
  "anthropic-messages": anthropicMessagesApi
};
function supportedProtocols() {
  return Object.keys(PROTOCOLS);
}
function harnessApiKeyAuth(name2) {
  return {
    name: name2,
    resolve: ({ credential }) => Promise.resolve({
      auth: credential?.key === void 0 ? {} : { apiKey: credential.key },
      source: name2
    })
  };
}
function routeAuth(spec, catalog) {
  if (catalog === void 0) return { apiKey: harnessApiKeyAuth(spec.displayName) };
  if (catalog.auth.apiKey !== void 0 || !spec.namesCredential) return catalog.auth;
  return {
    ...catalog.auth,
    apiKey: harnessApiKeyAuth(spec.displayName)
  };
}
function reuseCatalogProvider(base, spec) {
  const baseUrl = spec.baseURL ?? base.baseUrl;
  return {
    id: spec.provider,
    name: spec.displayName,
    ...baseUrl === void 0 ? {} : { baseUrl },
    auth: routeAuth(spec, base),
    getModels: () => spec.models,
    stream: (model, context, options) => base.stream(model, context, options),
    streamSimple: (model, context, options) => base.streamSimple(model, context, options)
  };
}
function buildProvider(spec) {
  const catalog = catalogProvider(spec.provider);
  if (catalog !== void 0 && spec.api === void 0) return reuseCatalogProvider(catalog, spec);
  const factory = spec.api === void 0 ? void 0 : PROTOCOLS[spec.api];
  if (factory === void 0) throw new PiAiCatalogError(`llm-pi-ai: provider "${spec.provider}" names api "${spec.api}", which this build cannot serve; supported protocols are ${supportedProtocols().join(", ")}`);
  return createProvider({
    id: spec.provider,
    name: spec.displayName,
    ...spec.baseURL === void 0 ? {} : { baseUrl: spec.baseURL },
    auth: routeAuth(spec, catalog),
    models: spec.models,
    api: factory()
  });
}
var DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
var DEFAULT_MAX_REQUEST_IMAGE_BYTES = 20 * 1024 * 1024;
var DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET = 2048 * 2048;
var DEFAULT_REQUEST_IMAGE_MAX_BYTES = 1024 * 1024;
var DEFAULT_CONTEXT_WINDOW = 262144;
var DEFAULT_MAX_TOKENS = 32768;
var DEFAULT_INPUT = ["text"];
var thinkingBudgets = z.object({
  minimal: z.number(),
  low: z.number(),
  medium: z.number(),
  high: z.number()
});
var chatTemplateKwarg = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.const(null),
  z.object({
    $var: z.union(CHAT_TEMPLATE_VARS).required(),
    omitWhenOff: z.boolean()
  })
]);
var compatProfile = z.object({
  supportsStore: z.boolean(),
  supportsDeveloperRole: z.boolean(),
  supportsReasoningEffort: z.boolean(),
  supportsUsageInStreaming: z.boolean(),
  supportsFinishReason: z.boolean(),
  maxTokensField: z.union(MAX_TOKENS_FIELDS),
  requiresToolResultName: z.boolean(),
  requiresAssistantAfterToolResult: z.boolean(),
  requiresThinkingAsText: z.boolean(),
  requiresReasoningContentOnAssistantMessages: z.boolean(),
  thinkingFormat: z.union(SUPPORTED_THINKING_FORMATS),
  chatTemplateKwargs: z.dict(chatTemplateKwarg),
  chatTemplateArgs: z.dict(chatTemplateKwarg),
  supportsThinkingTokenBudget: z.boolean(),
  thinkingTokenBudgetField: z.union(THINKING_TOKEN_BUDGET_FIELDS),
  vllmPriority: z.number().step(1),
  supportsMaxOutputTokens: z.boolean(),
  supportsStrictMode: z.boolean(),
  cacheControlFormat: z.union(CACHE_CONTROL_FORMATS),
  supportsLongCacheRetention: z.boolean(),
  supportsEagerToolInputStreaming: z.boolean(),
  supportsCacheControlOnTools: z.boolean(),
  supportsTemperature: z.boolean(),
  forceAdaptiveThinking: z.boolean(),
  allowEmptySignature: z.boolean(),
  supportsStrictTools: z.boolean()
});
var reasoningEfforts = z.dict(z.union([z.string(), z.const(null)]), z.union(THINKING_LEVELS));
var modelFields = {
  name: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  input: z.array(z.union(MODALITIES)),
  reasoningEfforts: z.union([z.const(false), reasoningEfforts]),
  compat: compatProfile
};
var modelProfile = z.object({
  id: z.string().required(),
  ...modelFields
});
var modelOverride = z.object(modelFields);
var profile = z.object({
  apiKeyEnv: z.string().role("credential-ref"),
  displayName: z.string(),
  api: z.union(supportedProtocols()),
  baseURL: z.string(),
  models: z.array(modelProfile),
  modelOverrides: z.dict(modelOverride),
  compat: compatProfile,
  defaultContextWindow: z.number().step(1).min(1).default(DEFAULT_CONTEXT_WINDOW),
  defaultMaxTokens: z.number().step(1).min(1).default(DEFAULT_MAX_TOKENS),
  defaultInput: z.array(z.union(MODALITIES)).default([...DEFAULT_INPUT]),
  headers: z.dict(z.string()),
  reasoning: z.union(THINKING_LEVELS),
  thinkingBudgets,
  cacheRetention: z.union([
    "none",
    "short",
    "long"
  ]),
  transport: z.union([
    "sse",
    "websocket",
    "websocket-cached",
    "auto"
  ]),
  timeoutMs: z.natural(),
  websocketConnectTimeoutMs: z.natural(),
  streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  maxRequestImageBytes: z.number().step(1).min(1).default(DEFAULT_MAX_REQUEST_IMAGE_BYTES),
  requestImagePixelBudget: z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_PIXEL_BUDGET),
  requestImageMaxBytes: z.number().step(1).min(1).default(DEFAULT_REQUEST_IMAGE_MAX_BYTES),
  retryPolicy: RetryPolicySchema
});
var Config = z.object({ providers: z.dict(profile).default({}) });
function assertServiceable(config, previous) {
  resolveProfiles(Object.fromEntries(Object.entries(config.providers ?? {}).filter(([provider, profile2]) => !deepEqualJson(profile2, previous?.providers?.[provider]))));
}
function rejectRemovedFields(provider, source) {
  const legacy = source;
  if ("provider" in legacy) throw new Error(`llm-pi-ai: provider "${provider}" sets "provider", which moved to the providers dict key`);
  if ("maxRetries" in legacy || "maxRetryDelayMs" in legacy) throw new Error(`llm-pi-ai: provider "${provider}" sets maxRetries or maxRetryDelayMs, which were removed; compose agent recovery with dsh-llm-retry`);
}
function assertValidHeaders(provider, headers) {
  for (const [name2, value] of Object.entries(headers ?? {})) try {
    new Headers([[name2, value]]);
  } catch {
    throw new Error(`llm-pi-ai: provider "${provider}" header "${name2}" is not valid for Fetch; use a valid HTTP field name and a single-line value representable as bytes`);
  }
}
function resolveProfiles(providers, validation = "strict") {
  if (Array.isArray(providers)) throw new Error("llm-pi-ai: providers is now a dict keyed by provider route, not an array of profiles");
  const entries = Object.entries(providers ?? {});
  const resolved = /* @__PURE__ */ new Map();
  for (const [provider, source] of entries) {
    rejectRemovedFields(provider, source);
    if (provider.length === 0) throw new Error("llm-pi-ai: provider names must be non-empty");
    if (source.baseURL !== void 0 && source.baseURL.length === 0) throw new Error(`llm-pi-ai: provider "${provider}" has an empty baseURL`);
    if (source.displayName !== void 0 && source.displayName.length === 0) throw new Error(`llm-pi-ai: provider "${provider}" has an empty displayName`);
    assertValidHeaders(provider, source.headers);
    const streamIdleTimeoutMs = source.streamIdleTimeoutMs ?? 3e5;
    if (!Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0 || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) throw new Error(`llm-pi-ai: provider "${provider}" streamIdleTimeoutMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
    const maxRequestImageBytes = source.maxRequestImageBytes ?? 20971520;
    if (!Number.isInteger(maxRequestImageBytes) || maxRequestImageBytes <= 0) throw new Error(`llm-pi-ai: provider "${provider}" maxRequestImageBytes must be a positive integer`);
    const requestImagePixelBudget = source.requestImagePixelBudget ?? 4194304;
    if (!Number.isSafeInteger(requestImagePixelBudget) || requestImagePixelBudget <= 0) throw new Error(`llm-pi-ai: provider "${provider}" requestImagePixelBudget must be a positive safe integer`);
    const requestImageMaxBytes = source.requestImageMaxBytes ?? 1048576;
    if (!Number.isSafeInteger(requestImageMaxBytes) || requestImageMaxBytes <= 0) throw new Error(`llm-pi-ai: provider "${provider}" requestImageMaxBytes must be a positive safe integer`);
    const defaultInput = [...source.defaultInput ?? DEFAULT_INPUT];
    if (defaultInput.length === 0) throw new Error(`llm-pi-ai: provider "${provider}" defaultInput must name at least one modality`);
    const displayName = source.displayName ?? provider;
    let catalog;
    let piProvider;
    let catalogError;
    try {
      catalog = resolveRouteModels({
        provider,
        ...source.api === void 0 ? {} : { api: source.api },
        ...source.baseURL === void 0 ? {} : { baseURL: source.baseURL },
        ...source.models === void 0 ? {} : { models: source.models },
        ...source.modelOverrides === void 0 ? {} : { modelOverrides: source.modelOverrides },
        ...source.compat === void 0 ? {} : { compat: source.compat },
        defaultInput,
        defaultContextWindow: source.defaultContextWindow ?? 262144,
        defaultMaxTokens: source.defaultMaxTokens ?? 32768
      }, validation);
      catalogError = catalog.modelErrors.values().next().value;
      piProvider = buildProvider({
        provider,
        displayName,
        ...source.api === void 0 ? {} : { api: source.api },
        ...source.baseURL === void 0 ? {} : { baseURL: source.baseURL },
        models: catalog.models,
        namesCredential: source.apiKeyEnv !== void 0
      });
    } catch (error) {
      if (validation === "strict" || !(error instanceof PiAiCatalogError)) throw error;
      catalogError ??= error.message;
    }
    const { apiKeyEnv, retryPolicy, models: _models, displayName: _displayName, ...rest } = source;
    resolved.set(provider, {
      ...rest,
      provider,
      displayName,
      ...apiKeyEnv === void 0 ? {} : { apiKeyEnv: credentialRef(apiKeyEnv) },
      streamIdleTimeoutMs,
      maxRequestImageBytes,
      requestImagePixelBudget,
      requestImageMaxBytes,
      retryPolicy: resolveRetryPolicy(retryPolicy, `llm-pi-ai: provider "${provider}" retryPolicy`),
      ...rest.headers === void 0 ? {} : { headers: { ...rest.headers } },
      ...rest.thinkingBudgets === void 0 ? {} : { thinkingBudgets: { ...rest.thinkingBudgets } },
      configuredMaxTokens: catalog?.configuredMaxTokens ?? /* @__PURE__ */ new Map(),
      modelErrors: catalog?.modelErrors ?? /* @__PURE__ */ new Map(),
      ...piProvider === void 0 ? {} : { piProvider },
      ...catalogError === void 0 ? {} : { catalogError }
    });
  }
  return resolved;
}
function flattenText(message) {
  return message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
}
function toolResultText(blocks) {
  return blocks.map((block) => block.type === "text" ? block.text : block.type === "tool-result" ? toolResultText(block.content) : "").join("");
}
function assertSupportedImageRoles(messages) {
  for (const message of messages) if (message.role !== "user" && contentHasImage(message.content)) throw new LlmError(`pi-ai cannot represent an image in an in-history ${message.role} message`, "UNSUPPORTED_CONTENT");
}
async function userContent(blocks, requestImages, resolveImageAccess) {
  const content = [];
  for (const block of blocks) switch (block.type) {
    case "text":
      if (block.text.length > 0) content.push({
        type: "text",
        text: block.text
      });
      break;
    case "image": {
      const version = requestImages.get(block.attachment.attachmentId);
      content.push({
        type: "text",
        text: requestImageHandleText(block.attachment, version, resolveImageAccess(block.attachment))
      });
      content.push({
        type: "image",
        data: Buffer.from(version.data).toString("base64"),
        mimeType: version.mediaType
      });
      break;
    }
    case "tool-result":
      {
        const nested = await userContent(block.content, requestImages, resolveImageAccess);
        if (typeof nested === "string") {
          if (nested.length > 0) content.push({
            type: "text",
            text: nested
          });
        } else content.push(...nested);
      }
      break;
    default:
      break;
  }
  if (content.every((block) => block.type === "text")) return content.map((block) => block.text).join("");
  return content;
}
function collectImageRefs(blocks, refs) {
  for (const block of blocks) if (block.type === "image") {
    if (block.offloaded !== true) refs.set(block.attachment.attachmentId, block.attachment);
  } else if (block.type === "tool-result") collectImageRefs(block.content, refs);
}
async function prepareRequestImages(messages, attachments, budget, signal) {
  const refs = /* @__PURE__ */ new Map();
  for (const message of messages) collectImageRefs(message.content, refs);
  const orderedRefs = [...refs.values()];
  const prepared = await Promise.all(orderedRefs.map((ref) => attachments.readImageRequest(ref, requestImageTarget(ref, budget), signal)));
  const versions = /* @__PURE__ */ new Map();
  for (const [index, ref] of orderedRefs.entries()) versions.set(ref.attachmentId, prepared[index]);
  return versions;
}
function toolsOf(options) {
  return options.tools?.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}
function splitSystemPrompt(options) {
  if (options.system !== void 0) return {
    systemPrompt: options.system,
    messages: options.messages
  };
  const [first, ...rest] = options.messages;
  if (first?.role !== "system") return {
    systemPrompt: void 0,
    messages: options.messages
  };
  const text = flattenText(first);
  return {
    systemPrompt: text.length > 0 ? text : void 0,
    messages: rest
  };
}
function piContext(systemPrompt, options, messages) {
  const tools = toolsOf(options);
  return {
    ...systemPrompt !== void 0 ? { systemPrompt } : {},
    messages,
    ...tools !== void 0 && tools.length > 0 ? { tools } : {}
  };
}
function appendAssistant(message, messages, toolNames, onReplayDegrade) {
  const assistant = toPiAssistant(message, onReplayDegrade);
  for (const block of assistant.content) if (block.type === "toolCall") toolNames.set(brandString(block.id), block.name);
  messages.push(assistant);
}
function textOnlyContext(options, onReplayDegrade) {
  assertSupportedImageRoles(options.messages);
  const split = splitSystemPrompt(options);
  const toolNames = /* @__PURE__ */ new Map();
  const messages = [];
  for (const message of split.messages) {
    if (contentHasImage(message.content)) throw new LlmError("pi-ai image conversion requires the durable attachment service", "UNSUPPORTED_CONTENT");
    if (message.role === "system") {
      messages.push({
        role: "user",
        content: flattenText(message),
        timestamp: 0
      });
      continue;
    }
    if (message.role === "assistant") {
      appendAssistant(message, messages, toolNames, onReplayDegrade);
      continue;
    }
    const text = flattenText(message);
    const results = message.content.filter((block) => block.type === "tool-result");
    if (text.length > 0 || results.length === 0) messages.push({
      role: "user",
      content: text,
      timestamp: 0
    });
    for (const result of results) messages.push({
      role: "toolResult",
      toolCallId: result.toolCallId,
      toolName: toolNames.get(result.toolCallId) ?? "unknown",
      content: [{
        type: "text",
        text: toolResultText(result.content) || "(no output)"
      }],
      isError: result.isError ?? false,
      timestamp: 0
    });
  }
  return piContext(split.systemPrompt, options, messages);
}
function requestImageTarget(ref, budget) {
  return {
    ...requestImageDimensions(ref.width, ref.height, budget.maxPixels),
    maxBytes: budget.maxBytes
  };
}
function toPiContext(options, images, onReplayDegrade) {
  return images === void 0 ? textOnlyContext(options, onReplayDegrade) : toPiContextWithImages(options, images, onReplayDegrade);
}
async function toPiContextWithImages(options, images, onReplayDegrade) {
  const { attachments, resolveImageAccess, maxRequestImageBytes } = images;
  const requestImagePolicy = images.requestImagePolicy ?? {
    maxPixels: 4194304,
    maxBytes: 1048576
  };
  assertSupportedImageRoles(options.messages);
  const split = splitSystemPrompt(options);
  const requestImages = await prepareRequestImages(split.messages, attachments, requestImagePolicy, options.signal);
  if (maxRequestImageBytes !== void 0) {
    const offloadImages = requiredImageOffload(split.messages, {
      representation: "base64",
      maxBytes: maxRequestImageBytes
    }, (block) => requestImages.get(block.attachment.attachmentId).bytes);
    if (offloadImages > 0) throw new LlmError(`pi-ai request images exceed the ${maxRequestImageBytes}-byte base64 bound; ${offloadImages} more oldest occurrence(s) must be offloaded.`, IMAGE_OFFLOAD_REQUIRED_CODE, { offloadImages });
  }
  const exactMessages = projectOffloadedImages(split.messages, (ref) => offloadedImageText(ref, resolveImageAccess(ref)));
  const toolNames = /* @__PURE__ */ new Map();
  const messages = [];
  for (const message of exactMessages) {
    if (message.role === "system") {
      messages.push({
        role: "user",
        content: flattenText(message),
        timestamp: 0
      });
      continue;
    }
    if (message.role === "assistant") {
      appendAssistant(message, messages, toolNames, onReplayDegrade);
      continue;
    }
    const content = await userContent(message.content.filter((block) => block.type !== "tool-result"), requestImages, resolveImageAccess);
    const results = message.content.filter((block) => block.type === "tool-result");
    if (content.length > 0 || results.length === 0) messages.push({
      role: "user",
      content,
      timestamp: 0
    });
    for (const result of results) {
      const resultContent = await userContent(result.content, requestImages, resolveImageAccess);
      messages.push({
        role: "toolResult",
        toolCallId: result.toolCallId,
        toolName: toolNames.get(result.toolCallId) ?? "unknown",
        content: typeof resultContent === "string" ? [{
          type: "text",
          text: resultContent || "(no output)"
        }] : resultContent,
        isError: result.isError ?? false,
        timestamp: 0
      });
    }
  }
  return piContext(split.systemPrompt, options, messages);
}
function mapUsage(usage) {
  return {
    inputTokens: usage.input,
    outputTokens: usage.output,
    totalTokens: usage.totalTokens,
    ...usage.cacheRead > 0 ? { cacheReadTokens: usage.cacheRead } : {},
    ...usage.cacheWrite > 0 ? { cacheWriteTokens: usage.cacheWrite } : {}
  };
}
function classifyPiAiError(message) {
  if (/\b(?:401|403)\b/.test(message)) return "AUTH";
  if (isQuotaExceededError(message)) return QUOTA_EXCEEDED_CODE;
  if (/\b429\b|rate.?limit/i.test(message)) return "RATE_LIMIT";
  if (/\b413\b|failed to buffer the request body:\s*length limit exceeded|payload too large|request body too large/i.test(message)) return "INVALID_REQUEST";
  if (/\b400\b|invalid.?request/i.test(message)) return "INVALID_REQUEST";
  if (/\b5\d\d\b/.test(message)) return "SERVER";
  if (/\btime(?:d)?\s*out\b|timeout/i.test(message)) return "TIMEOUT";
  if (/stream ended (?:before|without)\b/i.test(message)) return "TRANSPORT";
  if (/\b(?:network|connection|socket|fetch)\b|\bECONN[A-Z]+\b/i.test(message) || /\b(?:other side closed|HTTP2 request did not get a response|WebSocket closed unexpectedly)\b/i.test(message) || /\bterminated\b|premature close/i.test(message)) return "TRANSPORT";
  return "PI_AI_ERROR";
}
function mapStopReason(message, contextWindow) {
  const piAiOverflow = isContextOverflow(message, contextWindow);
  const harnessOverflow = message.stopReason === "error" && message.errorMessage !== void 0 && isContextWindowExceededError(message.errorMessage);
  if (piAiOverflow || harnessOverflow) return {
    kind: "error",
    failure: {
      message: message.errorMessage ?? `pi-ai detected context overflow for model "${message.model}"`,
      code: CONTEXT_WINDOW_EXCEEDED_CODE
    }
  };
  switch (message.stopReason) {
    case "stop":
      if (message.content.length === 0) return {
        kind: "error",
        failure: {
          message: `model "${message.model}" returned a completed response with no content`,
          code: EMPTY_RESPONSE_CODE
        }
      };
      return { kind: "stop" };
    case "length":
      return { kind: "max-tokens" };
    case "toolUse":
      return { kind: "tool-calls" };
    case "pending":
      return {
        kind: "error",
        failure: {
          message: `pi-ai stream for model "${message.model}" ended pending`,
          code: "PI_AI_ERROR"
        }
      };
    case "deferred":
      return {
        kind: "error",
        failure: {
          message: `pi-ai deferred response for model "${message.model}" is not supported`,
          code: "PI_AI_ERROR"
        }
      };
    case "aborted":
      return {
        kind: "aborted",
        failure: {
          message: message.errorMessage ?? "pi-ai stream aborted",
          code: "ABORTED"
        }
      };
    case "error": {
      const text = message.errorMessage ?? "pi-ai stream error";
      return {
        kind: "error",
        failure: {
          message: text,
          code: classifyPiAiError(text)
        }
      };
    }
  }
}
async function* toStreamChunks(events, contextWindow, callerSignal, requestedModel) {
  const toolIds = /* @__PURE__ */ new Map();
  for await (const event of events) switch (event.type) {
    case "start":
      break;
    case "text_start":
      yield {
        type: "block-start",
        index: event.contentIndex,
        blockType: "text"
      };
      break;
    case "text_delta":
      yield {
        type: "text-delta",
        index: event.contentIndex,
        text: event.delta
      };
      break;
    case "text_end":
      yield {
        type: "block-end",
        index: event.contentIndex,
        block: {
          type: "text",
          text: event.content
        }
      };
      break;
    case "thinking_start":
      yield {
        type: "block-start",
        index: event.contentIndex,
        blockType: "reasoning"
      };
      break;
    case "thinking_delta":
      yield {
        type: "reasoning-delta",
        index: event.contentIndex,
        text: event.delta
      };
      break;
    case "thinking_end":
      yield {
        type: "block-end",
        index: event.contentIndex,
        block: {
          type: "reasoning",
          text: event.content
        }
      };
      break;
    case "toolcall_start": {
      const partial = event.partial.content[event.contentIndex];
      const id = partial?.type === "toolCall" ? partial.id : "";
      const name2 = partial?.type === "toolCall" ? partial.name : "";
      toolIds.set(event.contentIndex, {
        id,
        name: name2
      });
      yield {
        type: "block-start",
        index: event.contentIndex,
        blockType: "tool-call"
      };
      break;
    }
    case "toolcall_delta": {
      const known = toolIds.get(event.contentIndex);
      yield {
        type: "tool-call-delta",
        index: event.contentIndex,
        id: brandString(known?.id ?? ""),
        ...known?.name !== void 0 && known.name.length > 0 ? { name: known.name } : {},
        argumentsDelta: event.delta
      };
      break;
    }
    case "toolcall_end":
      yield {
        type: "block-end",
        index: event.contentIndex,
        block: {
          type: "tool-call",
          id: brandString(event.toolCall.id),
          name: event.toolCall.name,
          arguments: JSON.stringify(event.toolCall.arguments)
        }
      };
      break;
    case "done":
      yield {
        type: "usage",
        usage: mapUsage(event.message.usage)
      };
      yield {
        type: "finish",
        reason: mapStopReason(event.message, contextWindow),
        replayState: toPiReplayState(event.message, requestedModel)
      };
      return;
    case "error":
      yield {
        type: "usage",
        usage: mapUsage(event.error.usage)
      };
      yield {
        type: "finish",
        reason: mapStopReason(callerSignal?.aborted ? {
          ...event.error,
          stopReason: "aborted"
        } : event.error, contextWindow)
      };
      return;
  }
  throw new LlmError("pi-ai event stream ended without done/error", "STREAM_CLOSED");
}
var __addDisposableResource = function(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose, inner;
    if (async) {
      if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
      dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
      if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
      dispose = value[Symbol.dispose];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    env.stack.push({
      value,
      dispose,
      async
    });
  } else if (async) env.stack.push({ async: true });
  return value;
};
var __disposeResources = /* @__PURE__ */ (function(SuppressedError2) {
  return function(env) {
    function fail(e) {
      env.error = env.hasError ? new SuppressedError2(e, env.error, "An error was suppressed during disposal.") : e;
      env.hasError = true;
    }
    var r, s = 0;
    function next() {
      while (r = env.stack.pop()) try {
        if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
        if (r.dispose) {
          var result = r.dispose.call(r.value);
          if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
            fail(e);
            return next();
          });
        } else s |= 1;
      } catch (e) {
        fail(e);
      }
      if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
      if (env.hasError) throw env.error;
    }
    return next();
  };
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
function profileOptions(profile2, reasoning, apiKey) {
  const enabledReasoning = reasoning === "off" ? void 0 : reasoning;
  return {
    ...apiKey === void 0 ? {} : { apiKey },
    ...enabledReasoning === void 0 ? {} : { reasoning: enabledReasoning },
    ...profile2.thinkingBudgets === void 0 ? {} : { thinkingBudgets: profile2.thinkingBudgets },
    ...profile2.cacheRetention === void 0 ? {} : { cacheRetention: profile2.cacheRetention },
    ...profile2.transport === void 0 ? {} : { transport: profile2.transport },
    ...profile2.timeoutMs === void 0 ? {} : { timeoutMs: profile2.timeoutMs },
    ...profile2.websocketConnectTimeoutMs === void 0 ? {} : { websocketConnectTimeoutMs: profile2.websocketConnectTimeoutMs },
    maxRetries: 0
  };
}
function describableReasoningLevel(model, effort) {
  if (effort === void 0) return void 0;
  return getSupportedThinkingLevels(model).some((level) => level === effort) ? effort : void 0;
}
function resolveReasoningLevel(model, effort) {
  if (effort === void 0) return void 0;
  if (getSupportedThinkingLevels(model).some((level) => level === effort)) return effort;
  throw new LlmError(`pi-ai provider "${model.provider}" model "${model.id}" does not support reasoning effort "${effort}"`, "UNSUPPORTED_REASONING_EFFORT");
}
function reasoningInfo(model, defaultLevel) {
  if (!model.reasoning) return {};
  return { reasoning: {
    efforts: getSupportedThinkingLevels(model).map((level) => ({
      id: ReasoningEffortId(level),
      name: `${level.charAt(0).toUpperCase()}${level.slice(1)}`
    })),
    ...defaultLevel === void 0 ? {} : { defaultEffort: ReasoningEffortId(defaultLevel) }
  } };
}
function requestHeaders(headers) {
  const attribution = attributionHeaders();
  const reserved = new Set(Object.keys(attribution).map((name2) => name2.toLowerCase()));
  return {
    ...Object.fromEntries(Object.entries(headers ?? {}).filter(([name2]) => !reserved.has(name2.toLowerCase()))),
    ...attribution
  };
}
var PiAiAdapter = class extends LlmAdapter {
  config;
  snapshot;
  constructor(config) {
    super();
    this.config = config;
  }
  /**
  * The snapshot for the current profiles. Resolution memoizes its result, so
  * an unchanged configuration is recognized by identity; a changed one gets a
  * brand-new collection, leaving any snapshot an operation already captured
  * untouched for as long as that operation holds it.
  */
  current() {
    const profiles = this.config.profiles();
    if (this.snapshot?.profiles === profiles) return this.snapshot;
    const models = createModels(this.config.auth);
    for (const profile2 of profiles.values()) if (profile2.piProvider !== void 0) models.setProvider(profile2.piProvider);
    this.snapshot = {
      profiles,
      models
    };
    return this.snapshot;
  }
  /** The profile for one route within one snapshot, or the not-owned failure. */
  profileOf(snapshot, provider) {
    const profile2 = snapshot.profiles.get(provider);
    if (profile2 === void 0) throw new LlmError(`pi-ai adapter does not own provider "${provider}"`, "NO_ADAPTER");
    return profile2;
  }
  /** The configured descriptor for one exact route/model pair within one snapshot. */
  modelOf(snapshot, provider, model) {
    const profile2 = this.profileOf(snapshot, provider);
    const failure = profile2.modelErrors.get(model) ?? (profile2.piProvider === void 0 ? profile2.catalogError : void 0);
    if (failure !== void 0) throw new LlmError(failure, "INVALID_CONFIG");
    const resolved = snapshot.models.getModel(provider, model);
    if (resolved === void 0) throw new LlmError(`pi-ai provider "${provider}" has no configured model "${model}"`, "UNKNOWN_MODEL");
    return resolved;
  }
  providerInfo(provider) {
    return {
      id: provider,
      name: this.current().profiles.get(provider)?.displayName ?? provider
    };
  }
  providerRetryPolicy(provider) {
    return this.current().profiles.get(provider)?.retryPolicy;
  }
  listModels(provider) {
    return Promise.resolve().then(() => {
      const snapshot = this.current();
      this.profileOf(snapshot, provider);
      return snapshot.models.getModels(provider).map((model) => ({
        provider,
        id: model.id,
        name: model.name,
        inputModalities: [...model.input]
      }));
    });
  }
  resolveModel(provider, model, _signal) {
    return Promise.resolve().then(() => {
      const snapshot = this.current();
      return this.modelInfo(snapshot, provider, model);
    });
  }
  modelInfo(snapshot, provider, model) {
    const profile2 = this.profileOf(snapshot, provider);
    const resolvedModel = this.modelOf(snapshot, provider, model);
    const defaultLevel = describableReasoningLevel(resolvedModel, profile2.reasoning);
    const configuredMaxTokens = profile2.configuredMaxTokens.get(model);
    return {
      provider,
      id: model,
      name: resolvedModel.name,
      inputModalities: [...resolvedModel.input],
      context: { contextWindow: resolvedModel.contextWindow },
      ...configuredMaxTokens === void 0 ? {} : { defaultMaxTokens: configuredMaxTokens },
      ...reasoningInfo(resolvedModel, defaultLevel)
    };
  }
  prepareCall(provider, model, _signal) {
    const snapshot = this.current();
    return Promise.resolve({
      model: this.modelInfo(snapshot, provider, model),
      stream: (options) => this.streamWithSnapshot(options, snapshot)
    });
  }
  stream(options) {
    return this.streamWithSnapshot(options, this.current());
  }
  async *streamWithSnapshot(options, snapshot) {
    const env_1 = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      if (options.stop !== void 0) throw new LlmError("llm-pi-ai does not support GenerateOptions.stop", "UNSUPPORTED_OPTION");
      const profile2 = this.profileOf(snapshot, options.provider);
      const model = this.modelOf(snapshot, options.provider, options.model);
      const reasoning = resolveReasoningLevel(model, options.reasoningEffort ?? profile2.reasoning);
      const apiKey = await this.config.resolveApiKey(options.provider, profile2);
      const consumer = new AbortController();
      const upstream = options.signal === void 0 ? consumer.signal : AbortSignal.any([options.signal, consumer.signal]);
      const streamIdleTimeoutMs = profile2.streamIdleTimeoutMs;
      const watchdog = __addDisposableResource(env_1, idleWatchdog(upstream, streamIdleTimeoutMs, "LLM_STREAM_IDLE_TIMEOUT"), false);
      try {
        const containsImage = options.messages.some((message) => contentHasImage(message.content));
        if (containsImage && !model.input.includes("image")) throw new LlmError(`pi-ai model "${model.id}" does not support image input`, "UNSUPPORTED_CONTENT");
        const attachments = containsImage ? this.config.resolveAttachments?.() : void 0;
        if (containsImage && attachments === void 0) throw new LlmError("pi-ai image input requires the durable attachment service", "UNSUPPORTED_CONTENT");
        const onReplayDegrade = (reason) => {
          this.config.onReplayDegrade?.({
            provider: options.provider,
            model: options.model,
            reason
          });
        };
        const context = attachments === void 0 ? toPiContext(options, void 0, onReplayDegrade) : await toPiContext({
          ...options,
          signal: watchdog.signal
        }, {
          attachments,
          resolveImageAccess: (ref) => this.config.resolveImageAccess?.(attachments, ref),
          maxRequestImageBytes: profile2.maxRequestImageBytes,
          requestImagePolicy: {
            maxPixels: profile2.requestImagePixelBudget,
            maxBytes: profile2.requestImageMaxBytes
          }
        }, onReplayDegrade);
        const iterator = toStreamChunks(snapshot.models.streamSimple(model, context, {
          ...profileOptions(profile2, reasoning, apiKey),
          ...options.temperature === void 0 ? {} : { temperature: options.temperature },
          ...options.maxTokens === void 0 ? {} : { maxTokens: options.maxTokens },
          ...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },
          signal: watchdog.signal,
          headers: requestHeaders(profile2.headers)
        }), model.contextWindow, options.signal, model.id)[Symbol.asyncIterator]();
        let exhausted = false;
        try {
          while (true) {
            const result = await watchdog.next(iterator);
            const timeout = timeoutOf(watchdog.signal, "LLM_STREAM_IDLE_TIMEOUT");
            if (timeout !== void 0) throw timeout;
            if (result.done) {
              exhausted = true;
              return;
            }
            yield result.value;
          }
        } finally {
          if (!exhausted) {
            consumer.abort("pi-ai stream consumer stopped");
            try {
              await iterator.return(void 0);
            } catch (_abortedSdkTeardown) {
            }
          }
        }
      } catch (error) {
        if (timeoutOf(watchdog.signal, "LLM_STREAM_IDLE_TIMEOUT") !== void 0) throw new LlmError(`pi-ai stream idle timeout after ${streamIdleTimeoutMs}ms`, "TIMEOUT", { cause: error });
        if (options.signal?.aborted) throw new LlmError("pi-ai request aborted by caller", "ABORTED", { cause: error });
        throw error;
      } finally {
        consumer.abort("pi-ai stream consumer stopped");
      }
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources(env_1);
    }
  }
};
var RECORD_SCOPE = "llm-pi-ai";
function recordKeyFor(providerId) {
  return credentialKey(RECORD_SCOPE, providerId);
}
function jsonImage(value) {
  if (Array.isArray(value)) return value.map((entry) => entry === void 0 ? null : jsonImage(entry));
  if (typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    const image = {};
    for (const [key, member] of Object.entries(value)) if (member !== void 0) image[key] = jsonImage(member);
    return image;
  }
  return value;
}
function toPiCredential(record) {
  if (record === void 0) return void 0;
  if (record.kind === "api-key") return {
    type: "api_key",
    ...record.key === void 0 ? {} : { key: record.key },
    ...record.env === void 0 ? {} : { env: { ...record.env } }
  };
  return record.payload;
}
function toRecord(credential) {
  if (credential.type === "api_key") return {
    kind: "api-key",
    ...credential.key === void 0 ? {} : { key: credential.key },
    ...credential.env === void 0 ? {} : { env: { ...credential.env } }
  };
  return {
    kind: "grant",
    payload: jsonImage(credential)
  };
}
function writableStore(ctx) {
  const credentials = ctx.get("credentials");
  if (credentials === void 0) throw new LlmError("llm-pi-ai: this composition mounts no credentials service, so there is nowhere to store the credential a sign-in produces; mount one (dsh-credentials-local) to sign in", "NO_CREDENTIAL_STORE");
  return credentials;
}
function credentialStoreFrom(ctx) {
  return {
    async read(providerId) {
      const credentials = ctx.get("credentials");
      if (credentials === void 0) return void 0;
      if (!isCredentialKeySegment(providerId)) return void 0;
      return toPiCredential(await credentials.readRecord(recordKeyFor(providerId)));
    },
    async list() {
      const stored = await ctx.get("credentials")?.listRecords() ?? [];
      const mine = [];
      for (const entry of stored) {
        if (credentialKeyScope(entry.key) !== "llm-pi-ai") continue;
        mine.push({
          providerId: credentialKeyId(entry.key),
          type: entry.kind === "api-key" ? "api_key" : "oauth"
        });
      }
      return mine;
    },
    async modify(providerId, mutate) {
      if (!isCredentialKeySegment(providerId)) throw new LlmError(`llm-pi-ai: provider id "${providerId}" cannot address a stored credential record (a record id is a lowercase hyphenated identifier); authenticate this route through apiKeyEnv instead of a stored credential`, "UNSTORABLE_PROVIDER_ID");
      return toPiCredential(await writableStore(ctx).modifyRecord(recordKeyFor(providerId), async (current) => {
        const next = await mutate(toPiCredential(current));
        return next === void 0 ? void 0 : toRecord(next);
      }));
    },
    async delete(providerId) {
      if (!isCredentialKeySegment(providerId)) return;
      await writableStore(ctx).deleteRecord(recordKeyFor(providerId));
    }
  };
}
function authContextFrom(ctx) {
  return {
    async env(name2) {
      if (isCredentialRefName(name2)) {
        const hit = await ctx.get("credentials")?.resolve(credentialRef(name2));
        if (hit !== void 0) return hit.value;
      }
      return launchEnvironmentOf(ctx).get(name2)?.value;
    },
    async fileExists(path) {
      const expanded = path.startsWith("~/") || path === "~" ? resolve(homedir(), path.slice(1).replace(/^\//, "")) : path;
      try {
        await access(expanded);
        return true;
      } catch {
        return false;
      }
    }
  };
}
var LISTABLE_PROTOCOLS = /* @__PURE__ */ new Set([
  "anthropic-messages",
  "openai-completions",
  "openai-responses"
]);
var ANTHROPIC_VERSION = "2023-06-01";
var ANTHROPIC_MODEL_LIMIT = 1e3;
var MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
function capacity(...candidates) {
  for (const candidate of candidates) if (typeof candidate === "number" && Number.isInteger(candidate) && candidate > 0) return candidate;
}
function label(...candidates) {
  for (const candidate of candidates) if (typeof candidate === "string" && candidate.length > 0) return candidate;
}
function listingUrl(baseURL, api) {
  const base = baseURL.replace(/\/+$/, "");
  if (api !== "anthropic-messages") return `${base}/models`;
  return `${base.endsWith("/v1") ? base.slice(0, -3) : base}/v1/models?limit=${String(ANTHROPIC_MODEL_LIMIT)}`;
}
async function readBounded(response, url) {
  const oversized = () => new LlmError(`${url} answered with more than ${MAX_RESPONSE_BYTES} bytes`, "DISCOVERY_FAILED");
  const declared = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw oversized();
  }
  if (response.body === null) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) throw oversized();
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {
    });
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
function readListing(body) {
  const listing = body;
  const data = listing?.data;
  let listed;
  if (Array.isArray(data)) listed = data.map((raw) => ({ raw }));
  else {
    const models2 = listing?.models;
    if (models2 === null || typeof models2 !== "object" || Array.isArray(models2)) throw new LlmError(`the endpoint's model listing has neither a "data" array nor a "models" object; enter this provider's models by hand`, "DISCOVERY_FAILED");
    listed = Object.entries(models2).filter(([, raw]) => raw !== null && typeof raw === "object" && !Array.isArray(raw)).map(([key, raw]) => ({
      key,
      raw
    }));
  }
  const models = [];
  for (const { key, raw } of listed) {
    const entry = raw;
    const id = label(key, entry?.id);
    if (id === void 0) continue;
    const name2 = label(entry?.name, entry?.display_name, entry?.displayName) ?? id;
    const contextWindow = capacity(entry?.contextWindow, entry?.context_window, entry?.context_length, entry?.max_input_tokens, entry?.limit?.context);
    const maxTokens = capacity(entry?.maxOutputTokens, entry?.max_output_tokens, entry?.maxTokens, entry?.max_tokens, entry?.limit?.output, entry?.top_provider?.max_completion_tokens);
    models.push({
      id,
      name: name2,
      ...contextWindow === void 0 ? {} : { contextWindow },
      ...maxTokens === void 0 ? {} : { maxTokens }
    });
  }
  return models;
}
function usableProbeKey(raw) {
  const checked = normalizeApiKey(raw);
  if (checked.ok) return checked.value;
  throw new LlmError(checked.reason === "empty" ? "this provider's API key is blank; enter it on the Models page, or clear it to probe unauthenticated" : "this provider's API key contains characters no HTTP header can carry; paste the raw key only", INVALID_CREDENTIAL_CODE);
}
async function discoverModels(request, storedProfile) {
  if (request.provider !== void 0) {
    const installed = catalogModels(request.provider);
    if (installed.size > 0) return [...installed.values()].map((model) => ({
      id: model.id,
      name: model.name,
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
      inputModalities: [...model.input]
    }));
  }
  if (request.baseURL === void 0 || request.baseURL.length === 0) throw new LlmError(`pi-ai ships no catalog for provider "${request.provider ?? ""}", so its models can only come from its endpoint; set a baseURL, or enter this provider's models by hand`, "DISCOVERY_FAILED");
  const api = request.api ?? "openai-completions";
  if (!LISTABLE_PROTOCOLS.has(api)) throw new LlmError(`pi-ai protocol "${api}" has no model listing this build can read; enter this provider's models by hand`, "DISCOVERY_UNSUPPORTED");
  const url = listingUrl(request.baseURL, api);
  const stored = storedProfile?.();
  const supplied = request.apiKey ?? await stored?.resolveApiKey();
  const apiKey = supplied === void 0 ? void 0 : usableProbeKey(supplied);
  let response;
  try {
    const headers = new Headers(stored?.headers === void 0 ? void 0 : Object.entries(stored.headers));
    headers.set("accept", "application/json");
    if (api === "anthropic-messages") {
      headers.set("anthropic-version", ANTHROPIC_VERSION);
      if (apiKey !== void 0) headers.set("x-api-key", apiKey);
    } else if (apiKey !== void 0) headers.set("authorization", `Bearer ${apiKey}`);
    for (const [name2, value] of Object.entries(attributionHeaders())) headers.set(name2, value);
    response = await fetch(url, {
      method: "GET",
      headers,
      ...request.signal === void 0 ? {} : { signal: request.signal }
    });
  } catch (error) {
    if (request.signal?.aborted) throw new LlmError("model discovery aborted by caller", "ABORTED", { cause: error });
    throw new LlmError(`could not reach ${url}`, "DISCOVERY_FAILED", { cause: error });
  }
  if (!response.ok) throw new LlmError(`${url} answered ${response.status}${response.status === 401 || response.status === 403 ? "; check the API key" : ""}`, "DISCOVERY_FAILED");
  let text;
  try {
    text = await readBounded(response, url);
  } catch (error) {
    if (request.signal?.aborted) throw new LlmError("model discovery aborted by caller", "ABORTED", { cause: error });
    throw error;
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new LlmError(`${url} did not answer with JSON`, "DISCOVERY_FAILED", { cause: error });
  }
  return readListing(body);
}
function loginMethods(provider) {
  const methods = [];
  const oauth = provider?.auth.oauth;
  if (oauth !== void 0) methods.push({
    id: "oauth",
    label: oauth.loginLabel ?? oauth.name
  });
  const apiKey = provider?.auth.apiKey;
  if (apiKey?.login !== void 0) methods.push({
    id: "api-key",
    label: apiKey.name
  });
  return methods;
}
function relay(event, session) {
  switch (event.type) {
    case "info": {
      const link = event.links?.[0];
      session.notify({
        message: event.message,
        ...link === void 0 ? {} : { url: link.url }
      });
      return;
    }
    case "auth_url":
      session.notify({
        message: event.instructions ?? "Open this page to continue signing in.",
        url: event.url
      });
      return;
    case "device_code":
      session.notify({
        message: "Enter this code on the verification page to finish signing in.",
        url: event.verificationUri,
        code: event.userCode
      });
      return;
    case "progress":
      session.notify({ message: event.message });
      return;
    default:
      session.notify({ message: "Signing in\u2026" });
  }
}
function restate(prompt) {
  const signal = prompt.signal === void 0 ? {} : { signal: prompt.signal };
  switch (prompt.type) {
    case "select":
      return {
        ...signal,
        kind: "select",
        message: prompt.message,
        options: prompt.options
      };
    case "secret":
      return {
        ...signal,
        kind: "secret",
        message: prompt.message,
        ...prompt.placeholder === void 0 ? {} : { placeholder: prompt.placeholder }
      };
    default:
      return {
        ...signal,
        kind: "text",
        message: prompt.message,
        ...prompt.placeholder === void 0 ? {} : { placeholder: prompt.placeholder }
      };
  }
}
function registerPiAiFlows(ctx, auth) {
  for (const providerId of catalogProviderIds()) {
    const provider = catalogProvider(providerId);
    const [first, ...rest] = loginMethods(provider);
    if (provider === void 0 || first === void 0) continue;
    if (!isCredentialKeySegment(providerId)) {
      ctx.logger.warn('llm-pi-ai: catalog provider "%s" cannot address a credential record; its sign-in is not offered', providerId);
      continue;
    }
    ctx.authorization.registerFlow({
      key: recordKeyFor(providerId),
      label: provider.name,
      methods: [first, ...rest],
      async run(session) {
        const models = createModels(auth);
        models.setProvider(provider);
        const type = session.method === "oauth" ? "oauth" : "api_key";
        await models.login(providerId, type, {
          signal: session.signal,
          notify: (event) => {
            relay(event, session);
          },
          prompt: (prompt) => session.prompt(restate(prompt))
        });
      }
    });
  }
}
var name = "llm-pi-ai";
var inject = ["llm"];
var NS = "llm-pi-ai";
function registrationFacts(profiles) {
  return [...profiles.entries()].map(([provider, profile2]) => ({
    provider,
    displayName: profile2.displayName,
    retryPolicy: profile2.retryPolicy
  })).sort((left, right) => left.provider.localeCompare(right.provider));
}
function directoryEntries(profiles) {
  const catalog = new Set(catalogProviderIds());
  const entries = /* @__PURE__ */ new Map();
  const declare = (provider, displayName, error) => {
    entries.set(provider, {
      provider,
      displayName,
      settingsNs: NS,
      settingsPath: ["providers", provider],
      declared: !catalog.has(provider),
      ...error === void 0 ? {} : { error }
    });
  };
  for (const provider of catalog) declare(provider, provider);
  for (const [provider, profile2] of profiles) declare(provider, profile2.displayName, profile2.catalogError);
  return [...entries.values()];
}
function apply(ctx, config) {
  let current = () => config;
  let lastRaw;
  let memoized;
  const profiles = () => {
    const raw = current();
    if (raw === lastRaw && memoized !== void 0) return memoized;
    const next = resolveProfiles(raw.providers, "deferred");
    lastRaw = raw;
    memoized = next;
    return next;
  };
  profiles();
  const resolveApiKey = async (provider, profile2) => {
    const ref = profile2.apiKeyEnv;
    if (ref === void 0) return void 0;
    const credentials = ctx.get("credentials");
    const hit = credentials !== void 0 ? (await credentials.resolve(ref))?.value : launchEnvironmentOf(ctx).get(ref)?.value;
    if (hit !== void 0 && hit.length > 0) return assertUsableApiKey(hit, "llm-pi-ai", ref);
    throw new LlmError(`llm-pi-ai: no credential for provider route "${provider}"; its profile resolves ${ref}, which is not set \u2014 store ${ref} through the credentials service (the web Models page writes it) or export it, and remove apiKeyEnv only if this provider should authenticate from pi-ai's own environment discovery`, "MISSING_CREDENTIAL");
  };
  const auth = {
    credentials: credentialStoreFrom(ctx),
    authContext: authContextFrom(ctx)
  };
  const adapter = new PiAiAdapter({
    profiles,
    resolveApiKey,
    auth,
    resolveAttachments: () => ctx.get("attachments"),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(attachments, (hostPath) => ctx.get("fs")?.processPathFromHostPath(hostPath), ref),
    onReplayDegrade: ({ provider, model, reason }) => {
      ctx.logger.warn(`llm-pi-ai: unusable replay state on assistant history for route "${provider}/${model}"; sending that message as provider-neutral content (${reason})`);
    }
  });
  ctx.inject(["authorization"], (authorized) => {
    registerPiAiFlows(authorized, auth);
  });
  let directory;
  let directoryFacts;
  const ensureDirectory = () => {
    const entries = directoryEntries(profiles());
    if (deepEqualJson(entries, directoryFacts)) return;
    if (directory === void 0) directory = ctx.llm.registerConfigurableProviders(entries);
    else directory.replace(entries);
    directoryFacts = entries;
  };
  ensureDirectory();
  const storedDiscoveryProfile = (provider) => {
    if (provider === void 0) return void 0;
    const profile2 = profiles().get(provider);
    if (profile2 === void 0) return void 0;
    return {
      headers: profile2.headers,
      resolveApiKey: () => resolveApiKey(provider, profile2)
    };
  };
  ctx.llm.registerModelDiscovery(NS, (request, signal) => discoverModels({
    ...request,
    ...signal === void 0 ? {} : { signal }
  }, () => storedDiscoveryProfile(request.provider)));
  let registration;
  let registeredFacts;
  const ensureRegistrationFacts = () => {
    const facts = registrationFacts(profiles());
    if (deepEqualJson(facts, registeredFacts)) return;
    const routes = [...profiles().keys()];
    if (registration === void 0) {
      if (routes.length === 0) {
        registeredFacts = facts;
        return;
      }
      registration = ctx.llm.registerAdapter(routes, adapter);
    } else registration.replace(routes);
    registeredFacts = facts;
  };
  ensureRegistrationFacts();
  ctx.inject(["settings"], (settingsCtx) => {
    let registering = true;
    settingsCtx.settings.installSection(ctx, NS, Config, config, {
      validate: (value) => {
        if (registering) resolveProfiles(value.providers, "deferred");
        else assertServiceable(value, current());
      },
      setSource: (source) => {
        current = source;
      },
      onChange: () => {
        try {
          ensureRegistrationFacts();
        } catch (error) {
          ctx.logger.error("llm-pi-ai: keeping the previously registered routes after a refused update");
          ctx.logger.error(error);
        }
        try {
          ensureDirectory();
        } catch (error) {
          ctx.logger.error("llm-pi-ai: keeping the previous configurable-provider directory after a refused update");
          ctx.logger.error(error);
        }
      }
    });
    registering = false;
  });
}
export {
  Config,
  PiAiAdapter,
  apply,
  inject,
  name,
  recordKeyFor,
  supportedProtocols
};
