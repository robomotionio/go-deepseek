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

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.js
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
var init_models = __esm({
  ".harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/models.js"() {
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

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/headers.js
function headersToRecord(headers) {
  const result = {};
  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }
  return result;
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

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/utils/estimate.js
function calculateContextTokens(usage) {
  return usage.totalTokens || usage.input + usage.output + usage.cacheRead + usage.cacheWrite;
}
function safeJsonStringify(value) {
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
      chars += block.name.length + safeJsonStringify(block.arguments).length;
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
  return estimateTextTokens(safeJsonStringify(tools));
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

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/anthropic-messages.js
var anthropic_messages_exports = {};
__export(anthropic_messages_exports, {
  stream: () => stream,
  streamSimple: () => streamSimple
});
import Anthropic from "@anthropic-ai/sdk";
function resolveCacheRetention(cacheRetention, env) {
  if (cacheRetention) {
    return cacheRetention;
  }
  if (getProviderEnvValue("PI_CACHE_RETENTION", env) === "long") {
    return "long";
  }
  return "short";
}
function getCacheControl(model, cacheRetention, env) {
  const retention = resolveCacheRetention(cacheRetention, env);
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
function mergeHeaders(...headerSources) {
  const merged = {};
  for (const headers of headerSources) {
    if (headers) {
      Object.assign(merged, headers);
    }
  }
  return merged;
}
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
function assertRequestAuth(provider, apiKey, headers) {
  if (apiKey)
    return;
  if (hasHeader(headers, "authorization") || hasHeader(headers, "x-api-key") || hasHeader(headers, "cf-aig-authorization")) {
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
function createClient(model, apiKey, interleavedThinking, useFineGrainedToolStreamingBeta, optionsHeaders, dynamicHeaders, sessionId) {
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
      defaultHeaders: mergeHeaders({
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
      defaultHeaders: mergeHeaders({
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
  const defaultHeaders = mergeHeaders({
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
function buildParams(model, context, isOAuthToken2, options) {
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
    messages: convertMessages(transformedMessages, isOAuthToken2, cacheControl, compat.allowEmptySignature, deferredToolNames, normalizeToolName),
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
      ...convertTools(immediateTools, isOAuthToken2, compat.supportsEagerToolInputStreaming, compat.supportsStrictTools, compat.supportsCacheControlOnTools ? cacheControl : void 0),
      ...convertTools(deferredTools, isOAuthToken2, compat.supportsEagerToolInputStreaming, compat.supportsStrictTools, void 0, true)
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
function convertMessages(transformedMessages, isOAuthToken2, cacheControl, allowEmptySignature = false, deferredToolNames = /* @__PURE__ */ new Set(), normalizeToolName = (name) => name) {
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
function convertTools(tools, isOAuthToken2, supportsEagerToolInputStreaming, supportsStrictTools, cacheControl, deferLoading = false) {
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
function mapStopReason(reason, stopDetails) {
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
var claudeCodeVersion, claudeCodeTools, ccToolLookup, toClaudeCodeName, fromClaudeCodeName, FINE_GRAINED_TOOL_STREAMING_BETA, INTERLEAVED_THINKING_BETA, ANTHROPIC_MESSAGE_EVENTS, stream, streamSimple;
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
    stream = (model, context, options) => {
      const stream2 = new AssistantMessageEventStream();
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
            const cacheRetention = resolveCacheRetention(options?.cacheRetention, options?.env);
            const cacheSessionId = cacheRetention === "none" ? void 0 : options?.sessionId;
            const created = createClient(model, apiKey, options?.interleavedThinking ?? true, shouldUseFineGrainedToolStreamingBeta(model, context), options?.headers, copilotDynamicHeaders, cacheSessionId);
            client = created.client;
            isOAuth = created.isOAuthToken;
          }
          let params = buildParams(model, context, isOAuth, options);
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
          stream2.push({ type: "start", partial: output });
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
                stream2.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });
              } else if (event.content_block.type === "thinking") {
                const block = {
                  type: "thinking",
                  thinking: "",
                  thinkingSignature: "",
                  index: event.index
                };
                output.content.push(block);
                stream2.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
              } else if (event.content_block.type === "redacted_thinking") {
                const block = {
                  type: "thinking",
                  thinking: "[Reasoning redacted]",
                  thinkingSignature: event.content_block.data,
                  redacted: true,
                  index: event.index
                };
                output.content.push(block);
                stream2.push({ type: "thinking_start", contentIndex: output.content.length - 1, partial: output });
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
                stream2.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const index = blocks.findIndex((b) => b.index === event.index);
                const block = blocks[index];
                if (block && block.type === "text") {
                  block.text += event.delta.text;
                  stream2.push({
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
                  stream2.push({
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
                  stream2.push({
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
                  stream2.push({
                    type: "text_end",
                    contentIndex: index,
                    content: block.text,
                    partial: output
                  });
                } else if (block.type === "thinking") {
                  stream2.push({
                    type: "thinking_end",
                    contentIndex: index,
                    content: block.thinking,
                    partial: output
                  });
                } else if (block.type === "toolCall") {
                  block.arguments = parseStreamingJson(block.partialJson);
                  delete block.partialJson;
                  stream2.push({
                    type: "toolcall_end",
                    contentIndex: index,
                    toolCall: block,
                    partial: output
                  });
                }
              }
            } else if (event.type === "message_delta") {
              if (event.delta.stop_reason) {
                const stopReasonResult = mapStopReason(event.delta.stop_reason, event.delta.stop_details);
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
          stream2.push({ type: "done", reason: output.stopReason, message: output });
          stream2.end();
        } catch (error) {
          for (const block of output.content) {
            delete block.index;
            delete block.partialJson;
          }
          output.stopReason = options?.signal?.aborted ? "aborted" : "error";
          output.errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
          stream2.push({ type: "error", reason: output.stopReason, error: output });
          stream2.end();
        }
      })();
      return stream2;
    };
    streamSimple = (model, context, options) => {
      assertRequestAuth(model.provider, options?.apiKey, options?.headers);
      const base = buildBaseOptions(model, context, options, options?.apiKey);
      if (!options?.reasoning) {
        return stream(model, context, { ...base, thinkingEnabled: false });
      }
      if (model.compat?.forceAdaptiveThinking === true) {
        const effort = mapThinkingLevelToEffort(model, options.reasoning);
        return stream(model, context, {
          ...base,
          thinkingEnabled: true,
          effort
        });
      }
      const adjusted = adjustMaxTokensForThinking(base.maxTokens, model.maxTokens, options.reasoning, options.thinkingBudgets);
      const maxTokens = clampMaxTokensToContext(model, context, adjusted.maxTokens);
      return stream(model, context, {
        ...base,
        maxTokens,
        thinkingEnabled: true,
        thinkingBudgetTokens: Math.min(adjusted.thinkingBudget, Math.max(0, maxTokens - 1024))
      });
    };
  }
});

// .harness/node_modules/.pnpm/@earendil-works+pi-ai@0.82.1_@modelcontextprotocol+sdk@1.29.0_zod@4.4.3__ws@8.21.0_zod@4.4.3/node_modules/@earendil-works/pi-ai/dist/api/anthropic-messages.lazy.js
init_lazy();
var anthropicMessagesApi = () => lazyApi(() => Promise.resolve().then(() => (init_anthropic_messages(), anthropic_messages_exports)));
export {
  anthropicMessagesApi
};
