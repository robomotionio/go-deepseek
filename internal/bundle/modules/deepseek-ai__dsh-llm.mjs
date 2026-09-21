// .harness/packages/llm/llm/lib/index.js
import { createRequire } from "node:module";
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { assertNever, deepFreeze, snapshotJsonValue } from "@deepseek-ai/dsh-util-values";
import { randomUUID } from "@deepseek-ai/dsh-util-crypto";
import { brandString } from "@deepseek-ai/dsh-brand";
import z from "@deepseek-ai/schemastery";
import { MAX_TIMER_DELAY_MS } from "@deepseek-ai/dsh-timeout";
var CONTEXT_SUMMARY_MAX_CHARS = 120;
function boundContextSummary(summary) {
  return summary.length <= 120 ? summary : `${summary.slice(0, 119)}\u2026`;
}
function freezeMessage(message) {
  return deepFreeze(structuredClone(message));
}
function createMessage(input) {
  return freezeMessage({
    ...input,
    id: brandString(randomUUID())
  });
}
function createUserMessage(input) {
  return createMessage({
    ...input,
    role: "user"
  });
}
function createAssistantMessage(input) {
  return createMessage({
    role: "assistant",
    content: input.content,
    source: {
      kind: "model",
      ...input.source
    }
  });
}
function createSystemMessage(text, plugin) {
  return createMessage({
    role: "system",
    content: text.length === 0 ? [] : [{
      type: "text",
      text
    }],
    source: {
      kind: "plugin",
      plugin
    }
  });
}
function createToolResultMessage(input) {
  return createUserMessage({
    source: {
      kind: "tool",
      callId: input.callId
    },
    content: [{
      type: "tool-result",
      toolCallId: input.callId,
      content: input.content,
      isError: input.isError
    }]
  });
}
var HarnessError = class extends Error {
  /** Stable machine-routable failure class (e.g. `RATE_LIMIT`); route on this, never by parsing `message`. */
  code;
  constructor(message, code, options) {
    super(message, options);
    this.code = code;
    this.name = new.target.name;
  }
};
var CONTEXT_WINDOW_EXCEEDED_CODE = "CONTEXT_WINDOW_EXCEEDED";
var QUOTA_EXCEEDED_CODE = "QUOTA";
var EMPTY_RESPONSE_CODE = "EMPTY_RESPONSE";
var INVALID_CREDENTIAL_CODE = "INVALID_CREDENTIAL";
var STRUCTURED_CONTEXT_OVERFLOW = new RegExp(String.raw`(?:^|[^a-z0-9])context[\s_-](?:length|window)[\s_-]` + String.raw`(?:exceed(?:ed|s)?|overflow(?:ed)?|limit[\s_-]exceeded)(?:$|[^a-z0-9])`, "i");
var TOO_LARGE_FOR_CONTEXT = new RegExp(String.raw`\b(?:request|prompt|input|messages?)\s+(?:is\s+|are\s+)?` + String.raw`too\s+(?:large|long)\s+for\s+(?:(?:this|the)\s+)?` + String.raw`(?:model(?:'s)?\s+)?context(?:\s+window)?\b`, "i");
var EXCEEDS_MODEL_CONTEXT = new RegExp(String.raw`\b(?:input|prompt|request|messages?)\b.{0,40}` + String.raw`\b(?:exceed(?:s|ed)?|overflows?|is\s+larger\s+than)\b.{0,40}` + String.raw`\b(?:the\s+)?(?:model(?:'s)?\s+)?context(?:\s+(?:length|window))?\b`, "i");
function isContextWindowExceededError(detail) {
  return STRUCTURED_CONTEXT_OVERFLOW.test(detail) || /\b(?:maximum|max)(?:\s+(?:allowed|supported))?\s+context\s+(?:length|window)\b/i.test(detail) || TOO_LARGE_FOR_CONTEXT.test(detail) || /\b(?:input|prompt|request)\s+(?:is\s+)?too\s+(?:long|large)\s+for\s+(?:this|the)\s+model\b/i.test(detail) || EXCEEDS_MODEL_CONTEXT.test(detail);
}
function isQuotaExceededError(detail) {
  return /\binsufficient[\s_-]+(?:quota|balance|credits?)\b/i.test(detail) || /\b(?:quota|usage[\s_-]+limit)[\s_-]+(?:exceeded|exhausted|reached)\b/i.test(detail) || /\bexceed(?:ed|s)?[\s_-]+(?:(?:your|the)[\s_-]+)?(?:current[\s_-]+)?quota\b/i.test(detail) || /\b(?:balance|credits?)[\s_-]+(?:exhausted|depleted)\b/i.test(detail) || /\bout[\s_-]+of[\s_-]+(?:credits?|budget)\b/i.test(detail);
}
function errorChain(value) {
  const path = /* @__PURE__ */ new Set();
  const render = (current) => {
    if (path.has(current)) return "<circular cause>";
    path.add(current);
    try {
      if (!(current instanceof Error)) {
        if (typeof current === "object" && current !== null) {
          const descriptor = Object.getOwnPropertyDescriptor(current, "message");
          if (descriptor !== void 0 && "value" in descriptor && typeof descriptor.value === "string") return descriptor.value;
        }
        return String(current);
      }
      const message = current.message === "" ? current.name : current.message;
      const members = current instanceof AggregateError && current.errors.length > 0 ? ` [${current.errors.map(render).join("; ")}]` : "";
      const causeText = current.cause === void 0 || current.cause === null ? "" : render(current.cause);
      return `${message}${members}${causeText === "" || causeText === message ? "" : `: ${causeText}`}`;
    } catch {
      return "<unrenderable value>";
    } finally {
      path.delete(current);
    }
  };
  return render(value);
}
function isHarnessError(value) {
  return value instanceof HarnessError;
}
var IMAGE_OFFLOAD_REQUIRED_CODE = "IMAGE_OFFLOAD_REQUIRED";
var DEFAULT_MAX_RETRIES = 5;
var DEFAULT_INITIAL_DELAY_MS = 500;
var DEFAULT_MAX_DELAY_MS = 1e4;
var DEFAULT_JITTER_RATIO = 0.1;
var DEFAULT_RETRYABLE_CODES = Object.freeze([
  EMPTY_RESPONSE_CODE,
  "RATE_LIMIT",
  "SERVER",
  "TIMEOUT",
  "TRANSPORT"
]);
var backoffSchema = z.object({
  initialDelayMs: z.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_INITIAL_DELAY_MS),
  maxDelayMs: z.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_MAX_DELAY_MS),
  jitterRatio: z.number().min(0).max(1).default(DEFAULT_JITTER_RATIO)
});
var normalPolicySchema = z.object({
  mode: z.const("normal").required(),
  maxRetries: z.number().step(1).min(0).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_RETRIES),
  retryableCodes: z.array(z.string()).default([...DEFAULT_RETRYABLE_CODES]),
  backoff: backoffSchema
});
var alwaysPolicySchema = z.object({
  mode: z.const("always").required(),
  backoff: backoffSchema
});
var RetryPolicySchema = z.union([normalPolicySchema, alwaysPolicySchema]);
var NORMAL_POLICY_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "maxRetries",
  "retryableCodes",
  "backoff"
]);
var ALWAYS_POLICY_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "maxRetries",
  "retryableCodes",
  "backoff"
]);
var BACKOFF_KEYS = /* @__PURE__ */ new Set([
  "initialDelayMs",
  "maxDelayMs",
  "jitterRatio"
]);
function validateKeys(value, allowed, path) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`${path}: unknown key "${key}"`);
}
function resolveBackoff(config, path) {
  if (config !== void 0) validateKeys(config, BACKOFF_KEYS, path);
  const initialDelayMs = config?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = config?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitterRatio = config?.jitterRatio ?? DEFAULT_JITTER_RATIO;
  if (!Number.isFinite(initialDelayMs) || initialDelayMs <= 0 || initialDelayMs > MAX_TIMER_DELAY_MS) throw new Error(`${path}.initialDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  if (!Number.isFinite(maxDelayMs) || maxDelayMs <= 0 || maxDelayMs > MAX_TIMER_DELAY_MS) throw new Error(`${path}.maxDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  if (initialDelayMs > maxDelayMs) throw new Error(`${path}.initialDelayMs must be less than or equal to maxDelayMs`);
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1) throw new Error(`${path}.jitterRatio must be between 0 and 1`);
  return Object.freeze({
    initialDelayMs,
    maxDelayMs,
    jitterRatio
  });
}
function resolveRetryPolicy(config, path) {
  if (config === void 0) return Object.freeze({
    mode: "normal",
    maxRetries: DEFAULT_MAX_RETRIES,
    retryableCodes: DEFAULT_RETRYABLE_CODES,
    ...resolveBackoff(void 0, `${path}.backoff`)
  });
  switch (config.mode) {
    case "normal": {
      validateKeys(config, NORMAL_POLICY_KEYS, path);
      const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
      const retryableCodes = config.retryableCodes ?? [...DEFAULT_RETRYABLE_CODES];
      if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) throw new Error(`${path}.maxRetries must be a non-negative safe integer`);
      if (retryableCodes.length === 0) throw new Error(`${path}.retryableCodes must not be empty`);
      if (retryableCodes.some((code) => typeof code !== "string" || code.length === 0)) throw new Error(`${path}.retryableCodes must contain only non-empty strings`);
      if (new Set(retryableCodes).size !== retryableCodes.length) throw new Error(`${path}.retryableCodes must not contain duplicates`);
      return Object.freeze({
        mode: "normal",
        maxRetries,
        retryableCodes: Object.freeze([...retryableCodes]),
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    }
    case "always":
      validateKeys(config, ALWAYS_POLICY_KEYS, path);
      return Object.freeze({
        mode: "always",
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    default:
      throw new Error(`${path}.mode must be "normal" or "always"`);
  }
}
var AGENT_LOOP_REQUESTS = /* @__PURE__ */ new WeakSet();
function callConfigEquals(a, b) {
  if (a.provider !== b.provider || a.model !== b.model || a.reasoningEffort !== b.reasoningEffort || a.temperature !== b.temperature || a.maxTokens !== b.maxTokens) return false;
  if (a.stop === void 0 || b.stop === void 0) return a.stop === b.stop;
  return a.stop.length === b.stop.length && a.stop.every((s, i) => s === b.stop?.[i]);
}
function markAgentLoopRequest(request) {
  AGENT_LOOP_REQUESTS.add(request);
  return request;
}
function isAgentLoopRequest(request) {
  return AGENT_LOOP_REQUESTS.has(request);
}
function normalizeLlmFailure(value) {
  const error = value instanceof Error ? value : new HarnessError(thrownMessage(value), "UNKNOWN", { cause: value });
  const carried = ownFailureSnapshot(error);
  if (carried !== void 0 && carried.code === ownErrorCode(error)) return carried;
  return Object.freeze({
    message: errorMessage(error),
    code: harnessErrorCode(error)
  });
}
function thrownMessage(value) {
  try {
    const message = String(value);
    return message.length > 0 ? message : "LLM adapter failed";
  } catch (_hostileThrownValue) {
    return "LLM adapter failed";
  }
}
function ownErrorCode(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "code");
    return descriptor !== void 0 && "value" in descriptor ? descriptor.value : void 0;
  } catch (_sdkPropertyTrap) {
    return;
  }
}
function ownFailureSnapshot(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "failure");
    return descriptor !== void 0 && "value" in descriptor ? failureSnapshot(descriptor.value) : void 0;
  } catch (_sdkPropertyTrap) {
    return;
  }
}
function failureSnapshot(value) {
  if (typeof value !== "object" || value === null) return void 0;
  try {
    const candidate = value;
    const message = candidate.message;
    const code = candidate.code;
    const status = candidate.status;
    const providerRetryAfterMs = candidate.providerRetryAfterMs;
    const requestId = candidate.requestId;
    const offloadImages = candidate.offloadImages;
    if (typeof message !== "string" || message.length === 0 || typeof code !== "string" || code.length === 0 || status !== void 0 && (!Number.isInteger(status) || status < 100 || status > 599) || providerRetryAfterMs !== void 0 && (!Number.isFinite(providerRetryAfterMs) || providerRetryAfterMs <= 0) || requestId !== void 0 && (typeof requestId !== "string" || requestId.length === 0) || offloadImages !== void 0 && (!Number.isSafeInteger(offloadImages) || offloadImages <= 0)) return void 0;
    return Object.freeze({
      message,
      code,
      ...status === void 0 ? {} : { status },
      ...providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs },
      ...requestId === void 0 ? {} : { requestId },
      ...offloadImages === void 0 ? {} : { offloadImages }
    });
  } catch (_sdkFailureGetter) {
    return;
  }
}
function errorMessage(error) {
  try {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) return message;
  } catch (_sdkMessageGetter) {
  }
  return "LLM adapter failed";
}
function harnessErrorCode(error) {
  return error instanceof HarnessError ? error.code : "UNKNOWN";
}
var LEGAL_API_KEY = /^[\x21-\x7E]+$/;
function normalizeApiKey(raw) {
  const value = raw.trim();
  if (value.length === 0) return {
    ok: false,
    reason: "empty"
  };
  if (!LEGAL_API_KEY.test(value)) return {
    ok: false,
    reason: "illegalCharacters"
  };
  return {
    ok: true,
    value
  };
}
function resolveImageAttachmentAccess(attachments, mapHostPath, ref) {
  const hostPath = attachments.imageHostPath(ref);
  if (hostPath === void 0) return void 0;
  const readonlyPath = mapHostPath(hostPath);
  return readonlyPath === void 0 ? void 0 : { readonlyPath };
}
function quoted(value) {
  return JSON.stringify(value);
}
function imageIdentity(ref) {
  return ref.name === void 0 ? String(ref.attachmentId) : `${quoted(ref.name)} (${ref.attachmentId})`;
}
function extension(mediaType) {
  switch (mediaType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return assertNever(mediaType, "image extension");
  }
}
function normalizedAccessText(ref, access) {
  return ` Normalized copy (read-only; may be resized or re-encoded): ${quoted(access.readonlyPath)} (${ref.width}x${ref.height}px, ${ref.mediaType}). Source dimensions, format, and byte size may differ. Copy to a writable path ending in ${extension(ref.mediaType)} before editing.`;
}
function textOnlyImageText(ref) {
  return `[image omitted because this model accepts text only; attachment sha256:${String(ref.attachmentId).slice(7, 15)}]`;
}
function requestImageHandleText(ref, version2, access) {
  const preview = `Image ${imageIdentity(ref)}; request preview ${version2.width}x${version2.height}px.`;
  return access === void 0 ? `${preview} It may be resized or re-encoded; source dimensions, format, and byte size may differ.` : preview + normalizedAccessText(ref, access);
}
function offloadedImageText(ref, access) {
  const identity = `image omitted to fit request image limits; ${imageIdentity(ref)}.`;
  if (access === void 0) return `[${identity} No local normalized image path is available; ask the user to attach it again if needed.]`;
  return `[${identity}${normalizedAccessText(ref, access)}]`;
}
function contentHasImage(content) {
  return content.some((block) => block.type === "image" || block.type === "tool-result" && contentHasImage(block.content));
}
function contentHasFile(content) {
  for (const block of content) if (block.type === "file" || block.type === "tool-result" && contentHasFile(block.content)) return true;
  return false;
}
function fileHandleText(ref, readonlyPath) {
  const digest = String(ref.attachmentId).slice(7, 15);
  const identity = `File ${quoted(ref.name)} (${ref.bytes} bytes, sha256:${digest})`;
  if (readonlyPath === void 0) return `[${identity} was uploaded, but the current execution environment cannot access a readable path. Report that limitation if its contents are needed; do not claim to have read it.]`;
  return `[${identity}: verbatim read-only copy saved at ${quoted(readonlyPath)}. Read that path with your file tools when its contents are needed; copy it to a writable location before modifying it. When delegating file work, include this saved path in the delegation prompt; only subagents sharing this execution environment can read it.]`;
}
function replaceFilesWithHandles(blocks, resolvePath) {
  let next;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "file") {
      next ??= blocks.slice(0, index);
      next.push({
        type: "text",
        text: fileHandleText(block.attachment, resolvePath(block.attachment))
      });
      continue;
    }
    if (block.type === "tool-result") {
      const content = replaceFilesWithHandles(block.content, resolvePath);
      if (content !== block.content) {
        next ??= blocks.slice(0, index);
        next.push({
          ...block,
          content
        });
        continue;
      }
    }
    next?.push(block);
  }
  return next ?? blocks;
}
function projectFilesToText(messages, resolvePath) {
  if (!messages.some((message) => contentHasFile(message.content))) return messages;
  return messages.map((message) => {
    const content = replaceFilesWithHandles(message.content, resolvePath);
    return content === message.content ? message : {
      ...message,
      content
    };
  });
}
function base64Length(bytes) {
  return Math.ceil(bytes / 3) * 4;
}
function visitImageBlocks(content, visit) {
  for (const block of content) if (block.type === "image") visit(block);
  else if (block.type === "tool-result") visitImageBlocks(block.content, visit);
}
function replaceOffloadedImages(blocks, placeholder) {
  let next;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "image" && block.offloaded === true) {
      next ??= blocks.slice(0, index);
      next.push({
        type: "text",
        text: placeholder(block.attachment)
      });
      continue;
    }
    if (block.type === "tool-result") {
      const content = replaceOffloadedImages(block.content, placeholder);
      if (content !== block.content) {
        next ??= blocks.slice(0, index);
        next.push({
          ...block,
          content
        });
        continue;
      }
    }
    next?.push(block);
  }
  return next ?? blocks;
}
function projectOffloadedImages(messages, placeholder) {
  return messages.map((message) => {
    const content = replaceOffloadedImages(message.content, placeholder);
    return content === message.content ? message : {
      ...message,
      content
    };
  });
}
function offloadedImagePrefixCount(lengths, budget) {
  const total = lengths.reduce((sum, bytes) => sum + bytes, 0);
  const excessCount = budget.maxImages === void 0 ? 0 : Math.max(0, lengths.length - budget.maxImages);
  const excessBytes = budget.maxBytes === void 0 ? 0 : Math.max(0, total - budget.maxBytes);
  if (excessCount === 0 && excessBytes === 0) return 0;
  const countQuantum = budget.countQuantum ?? 1;
  const byteQuantum = budget.byteQuantum ?? 1;
  const removeCount = excessCount === 0 ? 0 : Math.ceil(excessCount / countQuantum) * countQuantum;
  const removeBytes = excessBytes === 0 ? 0 : Math.ceil(excessBytes / byteQuantum) * byteQuantum;
  let count = 0;
  let removedBytes = 0;
  for (const imageBytes of lengths) {
    if (count >= removeCount && (removeBytes === 0 || (byteQuantum === 1 ? removedBytes >= removeBytes : removedBytes > removeBytes))) break;
    removedBytes += imageBytes;
    count += 1;
  }
  return count;
}
function requiredImageOffload(messages, budget, versionBytes) {
  const lengths = [];
  for (const message of messages) visitImageBlocks(message.content, (block) => {
    if (block.offloaded === true) return;
    const bytes = versionBytes(block);
    lengths.push(budget.representation === "base64" ? base64Length(bytes) : bytes);
  });
  return offloadedImagePrefixCount(lengths, budget);
}
function replaceImagesForTextModel(blocks) {
  let next;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "image") {
      next ??= blocks.slice(0, index);
      next.push({
        type: "text",
        text: textOnlyImageText(block.attachment)
      });
      continue;
    }
    if (block.type === "tool-result") {
      const content = replaceImagesForTextModel(block.content);
      if (content !== block.content) {
        next ??= blocks.slice(0, index);
        next.push({
          ...block,
          content
        });
        continue;
      }
    }
    next?.push(block);
  }
  return next ?? blocks;
}
function projectImagesForTextModel(messages) {
  if (!messages.some((message) => contentHasImage(message.content))) return messages;
  return messages.map((message) => {
    const content = replaceImagesForTextModel(message.content);
    return content === message.content ? message : {
      ...message,
      content
    };
  });
}
var { version } = createRequire(import.meta.url)("../package.json");
var APP_IDENTITY = {
  product: "deepseek-harness",
  version,
  url: "https://github.com/deepseek-ai/deepseek-harness"
};
function userAgent(identity = APP_IDENTITY) {
  return `${identity.product}/${identity.version} (+${identity.url})`;
}
function attributionHeaders(identity = APP_IDENTITY) {
  return { "user-agent": userAgent(identity) };
}
function MessageId(id) {
  return brandString(id);
}
function ToolCallId(id) {
  return brandString(id);
}
function ProviderRequestId(id) {
  return brandString(id);
}
function LlmAttemptId(id) {
  return brandString(id);
}
function ReasoningEffortId(id) {
  return brandString(id);
}
var BlockAssembler = class {
  partials = /* @__PURE__ */ new Map();
  order = [];
  _usage;
  _finish;
  _replayState;
  /**
  * Feed one chunk into the assembly state.
  * @param chunk - the next raw chunk, in stream order.
  */
  push(chunk) {
    switch (chunk.type) {
      case "block-start":
        if (!this.partials.has(chunk.index)) {
          this.order.push(chunk.index);
          this.partials.set(chunk.index, {
            blockType: chunk.blockType,
            text: "",
            toolCallArguments: ""
          });
        }
        return;
      case "text-delta":
      case "reasoning-delta": {
        const partial = this.ensure(chunk.index, chunk.type === "text-delta" ? "text" : "reasoning");
        if (partial.block) return;
        partial.text += chunk.text;
        return;
      }
      case "tool-call-delta": {
        const partial = this.ensure(chunk.index, "tool-call");
        if (partial.block) return;
        partial.toolCallId = chunk.id;
        if (chunk.name) partial.toolCallName = chunk.name;
        partial.toolCallArguments += chunk.argumentsDelta;
        return;
      }
      case "block-end": {
        const partial = this.ensure(chunk.index, chunk.block.type);
        if (partial.block) return;
        partial.block = chunk.block;
        return;
      }
      case "usage":
        this._usage = chunk.usage;
        return;
      case "finish":
        this._finish = chunk.reason;
        this._replayState = chunk.replayState;
        return;
      default:
        return assertNever(chunk, "BlockAssembler.push");
    }
  }
  ensure(index, blockType) {
    let partial = this.partials.get(index);
    if (!partial) {
      partial = {
        blockType,
        text: "",
        toolCallArguments: ""
      };
      this.partials.set(index, partial);
      this.order.push(index);
    }
    return partial;
  }
  assemble(partial, index) {
    if (partial.block) return partial.block;
    switch (partial.blockType) {
      case "text":
        return {
          type: "text",
          text: partial.text
        };
      case "reasoning":
        return {
          type: "reasoning",
          text: partial.text
        };
      case "tool-call":
        return {
          type: "tool-call",
          id: partial.toolCallId ?? brandString(`call-${index}`),
          name: partial.toolCallName ?? "",
          arguments: partial.toolCallArguments
        };
      default:
        throw new Error(`cannot assemble incomplete block of type "${partial.blockType}"`);
    }
  }
  /** Invariant accessor: every index in `order` has a partial. */
  mustGet(index) {
    const partial = this.partials.get(index);
    if (!partial) throw new Error(`BlockAssembler invariant violated: no partial for index ${index}`);
    return partial;
  }
  /**
  * The one shared keep/drop decision over all seen blocks: max-token
  * truncation drops tool calls that cannot be executed safely. Emitted blocks
  * and replay metadata both derive from this result, so they cannot disagree.
  */
  assembled() {
    const all = this.order.map((index) => this.assemble(this.mustGet(index), index));
    const kept = this.finish.kind === "max-tokens" ? all.map((block) => block.type !== "tool-call") : void 0;
    const blocks = kept === void 0 ? all : all.filter((_, position) => kept[position]);
    const envelope = this._replayState;
    if (envelope?.blocks === void 0) return {
      blocks,
      replay: envelope
    };
    if (envelope.blocks.length !== all.length) return {
      blocks,
      replay: void 0
    };
    return {
      blocks,
      replay: kept === void 0 || blocks.length === all.length ? envelope : {
        response: envelope.response,
        blocks: envelope.blocks.filter((_, position) => kept[position])
      }
    };
  }
  /**
  * Assemble all blocks seen so far, in stream order.
  * @returns one block per seen index, except that max-token truncation drops
  *   tool calls that cannot be executed safely; an open block assembles from
  *   its accumulated deltas (an unknown block type never closed by `block-end` throws).
  */
  blocks() {
    return this.assembled().blocks;
  }
  /**
  * Assemble the prefix an interrupted stream can safely finalize: closed and
  * open text/reasoning blocks with non-whitespace content, in stream order.
  * Tool calls are omitted because interruption precedes dispatch; retaining
  * one would require a fabricated result. Open unknown blocks are also omitted.
  * @returns the kept blocks; empty when nothing streamed before the interruption.
  */
  interruptedBlocks() {
    return this.order.map((index) => {
      const partial = this.mustGet(index);
      const type = partial.block?.type ?? partial.blockType;
      if (type !== "text" && type !== "reasoning") return void 0;
      return this.assemble(partial, index);
    }).filter((block) => (block?.type === "text" || block?.type === "reasoning") && block.text.trim() !== "");
  }
  /** Usage from the `usage` chunk; undefined until one arrives. */
  get usage() {
    return this._usage;
  }
  /** Finish reason from the `finish` chunk; `{kind: 'stop'}` when the stream ended without one. */
  get finish() {
    return this._finish ?? { kind: "stop" };
  }
  /**
  * Replay metadata from the terminal finish chunk, if any, with per-block
  * entries pruned in step with {@link blocks}. Undefined when the envelope's
  * entries do not align with the emitted blocks.
  */
  get replayState() {
    return this.assembled().replay;
  }
  /**
  * The assembled assistant message.
  * @param source - producer attribution for the assembled message.
  * @returns a frozen assistant-role message over `blocks()` (same open-block assembly rules).
  */
  message(source = {
    kind: "plugin",
    plugin: "dsh-llm/assembler"
  }) {
    return createMessage({
      role: "assistant",
      content: this.blocks(),
      source
    });
  }
};
function safeTime(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`Assistant stream time must be a safe integer, got ${String(value)}`);
  return value;
}
function safeIndex(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || Object.is(value, -0)) throw new TypeError(`${label} index must be a non-negative safe integer`);
  return value;
}
function snapshotChunk(chunk) {
  const snapshot = snapshotJsonValue(chunk);
  if (snapshot === void 0) throw new TypeError("Assistant stream chunk must be losslessly JSON-serializable");
  return snapshot;
}
function safeGap(previous, next) {
  const gap = next - previous;
  return Number.isSafeInteger(gap) && previous + gap === next ? gap : void 0;
}
var AssistantStreamAccumulator = class {
  records = [];
  /**
  * Add one timed chunk to the compact attempt stream.
  * @param value - model chunk and its original Session timestamp.
  * @returns a detached immutable copy for assembly and live publication.
  */
  push(value) {
    const time = safeTime(value.time);
    const chunk = snapshotChunk(value.chunk);
    const timed = deepFreeze({
      time,
      chunk
    });
    const previous = this.records.at(-1);
    switch (chunk.type) {
      case "text-delta":
      case "reasoning-delta": {
        safeIndex(chunk.index, chunk.type);
        if (typeof chunk.text !== "string") throw new TypeError(`${chunk.type} text must be a string`);
        const type = chunk.type === "text-delta" ? "text-chunks" : "reasoning-chunks";
        const gap = previous !== void 0 && previous.type === type ? safeGap(previous.lastTime, time) : void 0;
        if (previous !== void 0 && previous.type === type && previous.index === chunk.index && gap !== void 0) {
          previous.dt.push(gap);
          previous.texts.push(chunk.text);
          previous.lastTime = time;
        } else this.records.push({
          type,
          time0: time,
          index: chunk.index,
          dt: [],
          texts: [chunk.text],
          lastTime: time
        });
        return timed;
      }
      case "tool-call-delta": {
        safeIndex(chunk.index, chunk.type);
        if (typeof chunk.id !== "string") throw new TypeError("tool-call-delta id must be a string");
        if (Object.hasOwn(chunk, "name") && typeof chunk.name !== "string") throw new TypeError("tool-call-delta name must be a string");
        if (typeof chunk.argumentsDelta !== "string") throw new TypeError("tool-call-delta argumentsDelta must be a string");
        if (chunk.id.length === 0 || chunk.name === "") {
          this.records.push({
            type: "chunk",
            time,
            chunk
          });
          return timed;
        }
        const gap = previous?.type === "tool-call-chunks" ? safeGap(previous.lastTime, time) : void 0;
        const sameName = previous?.type === "tool-call-chunks" && Object.hasOwn(previous, "name") === Object.hasOwn(chunk, "name") && previous.name === chunk.name;
        if (previous?.type === "tool-call-chunks" && previous.index === chunk.index && previous.id === chunk.id && sameName && gap !== void 0) {
          previous.dt.push(gap);
          previous.args.push(chunk.argumentsDelta);
          previous.lastTime = time;
        } else this.records.push({
          type: "tool-call-chunks",
          time0: time,
          index: chunk.index,
          dt: [],
          id: chunk.id,
          ...Object.hasOwn(chunk, "name") ? { name: chunk.name } : {},
          args: [chunk.argumentsDelta],
          lastTime: time
        });
        return timed;
      }
      case "block-start":
      case "block-end":
      case "usage":
      case "finish":
        this.records.push({
          type: "chunk",
          time,
          chunk
        });
        return timed;
      default:
        return assertNever(chunk, "AssistantStreamAccumulator.push");
    }
  }
  /**
  * Return the current compact attempt stream.
  * @returns a detached immutable record list suitable for a durable event.
  */
  snapshot() {
    return deepFreeze(this.records.map((record) => {
      if (record.type === "chunk") return { ...record };
      const { lastTime: _lastTime, ...durable } = record;
      if (durable.type === "tool-call-chunks") return {
        ...durable,
        dt: [...durable.dt],
        args: [...durable.args]
      };
      return {
        ...durable,
        dt: [...durable.dt],
        texts: [...durable.texts]
      };
    }));
  }
};
function expandAssistantStream(stream) {
  const chunks = [];
  for (const candidate of stream) {
    const record = validateRecord(candidate);
    if (record.type === "chunk") {
      chunks.push({
        time: record.time,
        chunk: record.chunk
      });
      continue;
    }
    const members = record.type === "tool-call-chunks" ? record.args : record.texts;
    let time = record.time0;
    for (let index = 0; index < members.length; index += 1) {
      if (index > 0) time += record.dt[index - 1];
      let chunk;
      if (record.type === "text-chunks") chunk = {
        type: "text-delta",
        index: record.index,
        text: members[index]
      };
      else if (record.type === "reasoning-chunks") chunk = {
        type: "reasoning-delta",
        index: record.index,
        text: members[index]
      };
      else chunk = {
        type: "tool-call-delta",
        index: record.index,
        id: record.id,
        ...Object.hasOwn(record, "name") ? { name: record.name } : {},
        argumentsDelta: members[index]
      };
      chunks.push({
        time,
        chunk
      });
    }
  }
  return chunks;
}
function hasNonWhitespace(text) {
  return /\S/.test(text);
}
function blockIsVisible(block) {
  if (block.type === "tool-call") return false;
  if (block.type === "text" || block.type === "reasoning") return hasNonWhitespace(block.text);
  return true;
}
function isTokenDelta(chunk) {
  switch (chunk.type) {
    case "text-delta":
    case "reasoning-delta":
      return chunk.text !== "";
    case "tool-call-delta":
      return chunk.argumentsDelta !== "" || chunk.name !== void 0;
    default:
      return false;
  }
}
function isVisibleChunk(chunk) {
  switch (chunk.type) {
    case "text-delta":
    case "reasoning-delta":
      return hasNonWhitespace(chunk.text);
    case "block-start":
      return chunk.blockType !== "text" && chunk.blockType !== "reasoning" && chunk.blockType !== "tool-call";
    case "block-end":
      return blockIsVisible(chunk.block);
    default:
      return false;
  }
}
function chunkHasVisibleText(chunk) {
  if (chunk.type === "text-delta") return hasNonWhitespace(chunk.text);
  return chunk.type === "block-end" && chunk.block.type === "text" && hasNonWhitespace(chunk.block.text);
}
function firstRunMemberTime(run, predicate) {
  const fragments = run.type === "tool-call-chunks" ? run.args : run.texts;
  let time = run.time0;
  for (let index = 0; index < fragments.length; index += 1) {
    if (index > 0) time += run.dt[index - 1];
    if (predicate(fragments[index])) return time;
  }
}
function runFirstTokenTime(run) {
  if (run.type === "tool-call-chunks" && run.name !== void 0) return run.time0;
  return firstRunMemberTime(run, (fragment) => fragment !== "");
}
function runFirstVisibleTime(run) {
  return run.type === "tool-call-chunks" ? void 0 : firstRunMemberTime(run, hasNonWhitespace);
}
function assistantStreamFirstTokenTime(stream) {
  for (const record of stream) {
    const time = record.type === "chunk" ? isTokenDelta(record.chunk) ? record.time : void 0 : runFirstTokenTime(record);
    if (time !== void 0) return time;
  }
}
function assistantStreamHasVisibleContent(stream) {
  return stream.some((record) => record.type === "chunk" ? isVisibleChunk(record.chunk) : runFirstVisibleTime(record) !== void 0);
}
function assistantStreamHasVisibleText(stream) {
  return stream.some((record) => record.type === "text-chunks" ? record.texts.some(hasNonWhitespace) : record.type === "chunk" && chunkHasVisibleText(record.chunk));
}
function lastAssistantStreamChunk(stream, type) {
  for (let index = stream.length - 1; index >= 0; index -= 1) {
    const record = stream[index];
    if (record.type === "chunk" && record.chunk.type === type) return record.chunk;
  }
}
function assistantStreamChunks(stream, type) {
  const chunks = [];
  for (const record of stream) if (record.type === "chunk" && record.chunk.type === type) chunks.push(record.chunk);
  return chunks;
}
function joinAssistantStreamText(stream) {
  const parts = [];
  for (const record of stream) if (record.type === "text-chunks") parts.push(record.texts.join(""));
  else if (record.type === "chunk" && record.chunk.type === "text-delta") parts.push(record.chunk.text);
  return parts.join("");
}
function assembleAssistantStream(stream, assembler = new BlockAssembler()) {
  for (const record of stream) switch (record.type) {
    case "chunk":
      assembler.push(record.chunk);
      break;
    case "text-chunks":
      assembler.push({
        type: "text-delta",
        index: record.index,
        text: record.texts.join("")
      });
      break;
    case "reasoning-chunks":
      assembler.push({
        type: "reasoning-delta",
        index: record.index,
        text: record.texts.join("")
      });
      break;
    case "tool-call-chunks":
      assembler.push({
        type: "tool-call-delta",
        index: record.index,
        id: record.id,
        ...record.name === void 0 ? {} : { name: record.name },
        argumentsDelta: record.args.join("")
      });
      break;
    default:
      assertNever(record, "assembleAssistantStream");
  }
  return assembler;
}
function validateRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("Assistant stream record must be an object");
  const record = value;
  switch (record.type) {
    case "text-chunks":
    case "reasoning-chunks": {
      exactKeys(record, [
        "type",
        "time0",
        "index",
        "dt",
        "texts"
      ], record.type);
      const texts = stringArray(record.texts, `${record.type} texts`);
      if (texts.length === 0) throw new TypeError(`${record.type} texts must be non-empty`);
      validateRun(record, texts.length, record.type);
      return record;
    }
    case "tool-call-chunks": {
      exactKeys(record, Object.hasOwn(record, "name") ? [
        "type",
        "time0",
        "index",
        "dt",
        "id",
        "name",
        "args"
      ] : [
        "type",
        "time0",
        "index",
        "dt",
        "id",
        "args"
      ], record.type);
      const args = stringArray(record.args, "tool-call-chunks args");
      if (args.length === 0) throw new TypeError("tool-call-chunks args must be non-empty");
      if (typeof record.id !== "string" || record.id.length === 0) throw new TypeError("tool-call-chunks id must be a non-empty string");
      if (record.name !== void 0 && (typeof record.name !== "string" || record.name.length === 0)) throw new TypeError("tool-call-chunks name must be a non-empty string");
      validateRun(record, args.length, record.type);
      return record;
    }
    case "chunk": {
      exactKeys(record, [
        "type",
        "time",
        "chunk"
      ], "chunk");
      const time = safeTime(record.time);
      if (typeof record.chunk !== "object" || record.chunk === null || Array.isArray(record.chunk)) throw new TypeError("Assistant stream raw chunk must be a lossless JSON object");
      let chunk;
      try {
        chunk = snapshotChunk(record.chunk);
      } catch (error) {
        throw new TypeError("Assistant stream raw chunk must be a lossless JSON object", { cause: error });
      }
      return deepFreeze({
        type: "chunk",
        time,
        chunk
      });
    }
    default:
      throw new TypeError(`Unsupported Assistant stream record ${JSON.stringify(record.type)}`);
  }
}
function validateRun(record, members, label) {
  safeTime(record.time0);
  safeIndex(record.index, label);
  if (!Array.isArray(record.dt) || record.dt.some((value) => !Number.isSafeInteger(value))) throw new TypeError(`${label} dt must contain safe integers`);
  if (record.dt.length !== members - 1) throw new TypeError(`${label} dt length must be one less than its members`);
  let time = record.time0;
  for (const gap of record.dt) {
    time += gap;
    if (!Number.isSafeInteger(time)) throw new TypeError(`${label} member times must stay safe integers`);
  }
}
function stringArray(value, label) {
  if (!Array.isArray(value) || value.some((member) => typeof member !== "string")) throw new TypeError(`${label} must be a string array`);
  return value;
}
function exactKeys(record, keys, label) {
  if (Object.keys(record).length !== keys.length || !keys.every((key) => Object.hasOwn(record, key))) throw new TypeError(`${label} Assistant stream record must contain exactly ${keys.join(", ")}`);
}
var __runInitializers = function(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function(f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? {
      get: descriptor.get,
      set: descriptor.set
    } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
    else descriptor[key] = _;
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
var LlmError = class extends HarnessError {
  /** Serializable facts retained beside this live Error. */
  failure;
  /**
  * @param message - non-empty human-readable failure summary.
  * @param code - non-empty stable provider-neutral machine code.
  * @param options - optional cause and validated serializable provider facts.
  */
  constructor(message, code, options) {
    if (typeof message !== "string" || message.length === 0) throw new Error("LlmError message must be a non-empty string");
    if (typeof code !== "string" || code.length === 0) throw new Error("LlmError code must be a non-empty string");
    if (options?.status !== void 0 && (!Number.isInteger(options.status) || options.status < 100 || options.status > 599)) throw new Error("LlmError status must be an integer from 100 through 599");
    if (options?.providerRetryAfterMs !== void 0 && (!Number.isFinite(options.providerRetryAfterMs) || options.providerRetryAfterMs <= 0)) throw new Error("LlmError providerRetryAfterMs must be a positive finite number");
    if (options?.requestId !== void 0 && (typeof options.requestId !== "string" || options.requestId.length === 0)) throw new Error("LlmError requestId must be a non-empty string");
    super(message, code, options);
    this.name = "LlmError";
    this.failure = Object.freeze({
      message,
      code,
      ...options?.status === void 0 ? {} : { status: options.status },
      ...options?.providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs: options.providerRetryAfterMs },
      ...options?.requestId === void 0 ? {} : { requestId: options.requestId },
      ...options?.offloadImages === void 0 ? {} : { offloadImages: options.offloadImages }
    });
  }
};
function assertUsableApiKey(raw, pkg, ref) {
  const checked = normalizeApiKey(raw);
  if (checked.ok) return checked.value;
  throw new LlmError(checked.reason === "empty" ? `${pkg}: the API key resolved from ${ref} is blank; set ${ref} to the raw key (the web Models page writes it) or export it in the launching environment` : `${pkg}: the API key resolved from ${ref} contains characters no HTTP header can carry; set ${ref} to the raw key alone (the web Models page writes it)`, INVALID_CREDENTIAL_CODE);
}
var LlmAdapter = class {
  /**
  * Describe one provider route owned by this adapter.
  * @param provider - a route passed to `registerAdapter()` for this instance.
  * @returns detached display metadata whose id must equal `provider`.
  */
  providerInfo(provider) {
    return {
      id: provider,
      name: provider
    };
  }
  /**
  * Return the provider-owned retry policy captured with this route.
  * @param _provider - a route passed to `registerAdapter()` for this instance.
  * @returns a resolved policy, or `undefined` to use the normal defaults.
  */
  providerRetryPolicy(_provider) {
  }
  /**
  * Resolve provider-side request-image pricing for one exact model route.
  * The default declares none, so consumers fall back to their own neutral
  * estimate. Implementations must answer synchronously without I/O; the
  * token meter resolves this per measurement.
  * @param _provider - a route passed to `registerAdapter()` for this instance.
  * @param _model - exact model id passed to {@link GenerateOptions.model}.
  * @returns route-owned image pricing, or `undefined` when the route declares none.
  */
  imageRequestPricing(_provider, _model) {
  }
  /**
  * List models this adapter can currently advertise for one owned provider.
  * The result is advisory: an adapter may accept unlisted model ids, and
  * consumers must not turn absence into request rejection.
  * @param _provider - one provider route owned by this adapter.
  * @returns discoverable models in adapter-preferred order.
  */
  listModels(_provider) {
    return Promise.resolve([]);
  }
  /**
  * Resolve all metadata available for one exact model. This query is
  * independent of the advisory catalog and does not validate request routing.
  * @param provider - one provider route owned by this adapter.
  * @param model - exact model id passed to {@link GenerateOptions.model}.
  * @param _signal - cancellation for this exact-model lookup; asynchronous
  *   implementations must settle promptly after it aborts.
  * @returns provider/model identity plus any context, call-default, and reasoning metadata.
  */
  resolveModel(provider, model, _signal) {
    return Promise.resolve({
      provider,
      id: model,
      name: model
    });
  }
  /**
  * Bind exact model metadata and the eventual request dispatch to one adapter generation.
  * Dynamic adapters override this so settings changes between preparation and
  * dispatch cannot combine one generation's capabilities with another's endpoint.
  * @param provider - registered provider route.
  * @param model - exact model id.
  * @param signal - cancellation for model resolution.
  * @returns model metadata and a one-generation stream entry point.
  */
  async prepareCall(provider, model, signal) {
    return {
      model: await this.resolveModel(provider, model, signal),
      stream: (options) => this.stream(options)
    };
  }
};
var LlmRuntime = (() => {
  let _classSuper = TypertRemoteService;
  let _instanceExtraInitializers = [];
  let _listProviders_decorators;
  let _listConfigurableProviders_decorators;
  let _remoteDiscoverModels_decorators;
  return class LlmRuntime extends _classSuper {
    static {
      const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
      _listProviders_decorators = [Remote];
      _listConfigurableProviders_decorators = [Remote];
      _remoteDiscoverModels_decorators = [Remote("discoverModels")];
      __esDecorate(this, null, _listProviders_decorators, {
        kind: "method",
        name: "listProviders",
        static: false,
        private: false,
        access: {
          has: (obj) => "listProviders" in obj,
          get: (obj) => obj.listProviders
        },
        metadata: _metadata
      }, null, _instanceExtraInitializers);
      __esDecorate(this, null, _listConfigurableProviders_decorators, {
        kind: "method",
        name: "listConfigurableProviders",
        static: false,
        private: false,
        access: {
          has: (obj) => "listConfigurableProviders" in obj,
          get: (obj) => obj.listConfigurableProviders
        },
        metadata: _metadata
      }, null, _instanceExtraInitializers);
      __esDecorate(this, null, _remoteDiscoverModels_decorators, {
        kind: "method",
        name: "remoteDiscoverModels",
        static: false,
        private: false,
        access: {
          has: (obj) => "remoteDiscoverModels" in obj,
          get: (obj) => obj.remoteDiscoverModels
        },
        metadata: _metadata
      }, null, _instanceExtraInitializers);
      if (_metadata) Object.defineProperty(this, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata
      });
    }
    adapters = (__runInitializers(this, _instanceExtraInitializers), /* @__PURE__ */ new Map());
    directory = /* @__PURE__ */ new Map();
    discoveries = /* @__PURE__ */ new Map();
    constructor(ctx) {
      super(ctx, "llm");
    }
    /** Notify topology observers without letting one broken listener veto the commit. */
    emitAdaptersUpdated() {
      let invariantFailure;
      for (const listener of this.ctx.events.dispatch("emit", ["llm/adapters-updated"])) try {
        const returned = listener();
        if (returned != null && typeof returned.then === "function") Promise.resolve(returned).then(void 0, (error) => {
          this.warnAdaptersListenerFailure(error);
        });
      } catch (error) {
        if (error?.code === "INVARIANT") {
          invariantFailure ??= error;
          continue;
        }
        this.warnAdaptersListenerFailure(error);
      }
      if (invariantFailure !== void 0) throw invariantFailure;
    }
    /** Contained-listener diagnostic shared by the sync and async failure paths. */
    warnAdaptersListenerFailure(error) {
      this.ctx.logger.warn("llm: an llm/adapters-updated listener failed");
      this.ctx.logger.warn(error);
    }
    /**
    * Register an adapter for the given provider routes. Throws `LlmError` with code
    * `DUPLICATE_ADAPTER` if any provider already has an adapter (all-or-nothing).
    * Disposed with the fiber.
    * @param providers - every provider route this adapter should serve.
    * @param adapter - the adapter that streams calls for those providers.
    * @returns the disposer, carrying {@link AdapterRegistrationHandle.replace}.
    */
    registerAdapter(providers, adapter) {
      const owned = /* @__PURE__ */ new Set();
      let released = false;
      const dispose = this.ctx.effect(function* () {
        if (providers.length === 0) throw new LlmError("an adapter must register at least one provider", "INVALID_ADAPTER");
        this.commitRoutes(owned, this.prepareRoutes(providers, adapter, owned));
        yield () => {
          released = true;
          for (const provider of owned) this.adapters.delete(provider);
          owned.clear();
          this.emitAdaptersUpdated();
        };
      }.bind(this), "llm.registerAdapter()");
      const handle = (() => void dispose());
      handle.replace = (next) => {
        if (released) throw new LlmError("a disposed adapter registration cannot replace its routes", "REGISTRATION_DISPOSED");
        this.commitRoutes(owned, this.prepareRoutes(next, adapter, owned));
      };
      return handle;
    }
    /**
    * Validate one candidate route set for `adapter`, treating routes this
    * registration already holds as available. Nothing is mutated: a rejected
    * candidate leaves the registry exactly as it was.
    */
    prepareRoutes(providers, adapter, owned) {
      const unique = /* @__PURE__ */ new Set();
      const registrations = [];
      for (const provider of providers) {
        if (provider.length === 0) throw new LlmError("adapter provider names must be non-empty", "INVALID_ADAPTER");
        if (unique.has(provider) || this.adapters.has(provider) && !owned.has(provider)) throw new LlmError(`an adapter for provider "${provider}" is already registered`, "DUPLICATE_ADAPTER");
        const info = adapter.providerInfo(provider);
        if (typeof info.id !== "string" || info.id !== provider || typeof info.name !== "string" || info.name.length === 0) throw new LlmError(`adapter metadata for provider "${provider}" must preserve its id and have a non-empty name`, "INVALID_ADAPTER");
        unique.add(provider);
        const retryPolicy = adapter.providerRetryPolicy(provider) ?? resolveRetryPolicy(void 0, `llm: provider "${provider}" retryPolicy`);
        registrations.push({
          adapter,
          provider: {
            id: info.id,
            name: info.name
          },
          retryPolicy
        });
      }
      return registrations;
    }
    /**
    * Swap this registration's routes for the prepared ones in one synchronous
    * section, so no observer can see the registry between the release and the
    * re-registration. The route set's one mutation point is also where
    * `llm/adapters-updated` is published, so a `replace` announces itself
    * exactly like a first registration.
    */
    commitRoutes(owned, registrations) {
      for (const provider of owned) this.adapters.delete(provider);
      owned.clear();
      for (const registration of registrations) {
        this.adapters.set(registration.provider.id, registration);
        owned.add(registration.provider.id);
      }
      this.emitAdaptersUpdated();
    }
    /**
    * Describe provider routes with a registered adapter.
    * @returns detached provider metadata in registration order.
    */
    listProviders() {
      return [...this.adapters.values()].map(({ provider }) => ({ ...provider }));
    }
    /**
    * Declare provider routes an adapter plugin can activate through
    * configuration. Registration is all-or-nothing: an empty list, invalid
    * entry, or a provider already declared by any registration throws
    * `LlmError` without registering the rest. Disposed with the fiber.
    * @param entries - every configurable provider this plugin owns.
    * @returns a handle that withdraws all of them, and can atomically replace them.
    */
    registerConfigurableProviders(entries) {
      let held = [];
      let disposed = false;
      const commit = (candidates) => {
        const detached = [];
        const own = new Set(held.map((entry) => entry.provider));
        for (const entry of candidates) {
          if (entry.provider.length === 0 || entry.displayName.length === 0 || entry.settingsNs.length === 0) throw new LlmError("configurable providers need a non-empty provider, displayName, and settingsNs", "INVALID_DIRECTORY");
          if (entry.settingsPath.some((segment) => segment.length === 0)) throw new LlmError(`configurable provider "${entry.provider}" has an empty settingsPath segment`, "INVALID_DIRECTORY");
          if (this.directory.has(entry.provider) && !own.has(entry.provider) || detached.some((seen) => seen.provider === entry.provider)) throw new LlmError(`configurable provider "${entry.provider}" is already declared`, "DUPLICATE_DIRECTORY");
          detached.push({
            ...entry,
            settingsPath: [...entry.settingsPath]
          });
        }
        for (const entry of held) this.directory.delete(entry.provider);
        for (const entry of detached) this.directory.set(entry.provider, entry);
        held = detached;
        this.emitAdaptersUpdated();
      };
      const dispose = this.ctx.effect(function* () {
        if (entries.length === 0) throw new LlmError("a configurable-provider registration must declare at least one provider", "INVALID_DIRECTORY");
        commit(entries);
        yield () => {
          disposed = true;
          for (const entry of held) this.directory.delete(entry.provider);
          held = [];
          this.emitAdaptersUpdated();
        };
      }.bind(this), "llm.registerConfigurableProviders()");
      const handle = (() => void dispose());
      handle.replace = (next) => {
        if (disposed) throw new LlmError("this configurable-provider registration was disposed", "REGISTRATION_DISPOSED");
        commit(next);
      };
      return handle;
    }
    /**
    * List every declared configurable provider, registered or dormant.
    * @returns detached directory entries in declaration order.
    */
    listConfigurableProviders() {
      return [...this.directory.values()].map((entry) => ({
        ...entry,
        settingsPath: [...entry.settingsPath]
      }));
    }
    /**
    * Offer to interrogate provider endpoints on behalf of the settings
    * namespace this plugin owns. The namespace is the key because that is what
    * a configuration surface already holds from the configurable-provider
    * directory, and because a provider being *added* has no route to name yet.
    * Disposed with the fiber.
    * @param settingsNs - the namespace whose profiles this discovery serves.
    * @param discover - interrogates one endpoint and must honor the supplied signal.
    * @returns the disposer that withdraws the offer.
    */
    registerModelDiscovery(settingsNs, discover) {
      const dispose = this.ctx.effect(function* () {
        if (settingsNs.length === 0) throw new LlmError("model discovery needs a non-empty settings namespace", "INVALID_DISCOVERY");
        if (this.discoveries.has(settingsNs)) throw new LlmError(`model discovery for "${settingsNs}" is already registered`, "DUPLICATE_DISCOVERY");
        this.discoveries.set(settingsNs, discover);
        yield () => {
          this.discoveries.delete(settingsNs);
        };
      }.bind(this), "llm.registerModelDiscovery()");
      return () => void dispose();
    }
    /**
    * Interrogate one provider endpoint for the models it advertises. The
    * request describes a draft, not a stored route, so nothing here reads or
    * writes settings or credentials — the caller owns both, and the reply is
    * candidate metadata a surface may offer for adoption.
    * @param settingsNs - namespace whose registered discovery serves this draft.
    * @param request - the endpoint, protocol, and one-shot credential to use.
    * @param signal - caller cancellation.
    * @returns the advertised models, deduplicated in endpoint order.
    */
    async discoverModels(settingsNs, request, signal) {
      const discover = this.discoveries.get(settingsNs);
      if (discover === void 0) throw new LlmError(`no model discovery is registered for "${settingsNs}"`, "NO_DISCOVERY");
      if ((request.provider ?? "").length === 0 && (request.baseURL ?? "").length === 0) throw new LlmError("model discovery needs a provider route or a baseURL", "INVALID_DISCOVERY");
      const discovered = signal === void 0 ? await discover(request) : await discover(request, signal);
      const seen = /* @__PURE__ */ new Set();
      const models = [];
      for (const model of discovered) {
        if (typeof model.id !== "string" || model.id.length === 0 || seen.has(model.id)) continue;
        seen.add(model.id);
        models.push({
          id: model.id,
          ...model.name === void 0 ? {} : { name: model.name },
          ...model.contextWindow === void 0 ? {} : { contextWindow: model.contextWindow },
          ...model.maxTokens === void 0 ? {} : { maxTokens: model.maxTokens },
          ...model.inputModalities === void 0 ? {} : { inputModalities: [...model.inputModalities] }
        });
      }
      return models;
    }
    /**
    * Remote adapter for one draft provider interrogation.
    * @param settingsNs - namespace whose registered discovery serves this draft.
    * @param request - endpoint, protocol, and one-shot credential to use.
    * @param signal - caller cancellation supplied by the Remote carrier.
    * @returns advertised models in endpoint order.
    * @throws RemoteError with `llm/model-discovery-rejected` when discovery refuses or fails.
    */
    async remoteDiscoverModels(settingsNs, request, signal) {
      try {
        return await this.discoverModels(settingsNs, request, signal);
      } catch (error) {
        throw new RemoteError("llm/model-discovery-rejected", error instanceof Error ? error.message : String(error), {
          settingsNs,
          ...request.baseURL === void 0 ? {} : { baseURL: request.baseURL }
        }, { cause: error });
      }
    }
    /**
    * Resolve the retry policy captured when one provider route was registered.
    * @param provider - registered provider route to inspect.
    * @returns the provider-owned policy, with normal defaults already resolved.
    */
    providerRetryPolicy(provider) {
      return this.registration(provider).retryPolicy;
    }
    /**
    * Resolve provider-side request-image pricing for one exact route, or
    * `undefined` when the provider is unregistered or declares none. Unknown
    * providers degrade to `undefined` rather than throwing because callers
    * price durable history whose route may no longer be mounted.
    * @param provider - provider route named by a request header.
    * @param model - exact model id named by the same header.
    * @returns the owning adapter's image pricing for the route, when declared.
    */
    imageRequestPricing(provider, model) {
      return this.adapters.get(provider)?.adapter.imageRequestPricing(provider, model);
    }
    /**
    * Resolve the exact text one durable file occurrence contributes to every
    * provider request in the current execution environment.
    * @param ref - durable verbatim file reference from model history.
    * @returns the same deterministic handle text used at adapter dispatch.
    */
    fileRequestText(ref) {
      return fileHandleText(ref, this.fileReadPath(ref));
    }
    /** Detach typed adapter-owned modality metadata. */
    detachedModalities(modalities) {
      return modalities === void 0 ? void 0 : [...modalities];
    }
    /**
    * Discover models advertised by one registered provider. Catalog membership
    * is advisory and never changes routing or request validation.
    * @param provider - registered provider route to inspect.
    * @returns detached model metadata in adapter-preferred order.
    */
    async listModels(provider) {
      const models = await this.registration(provider).adapter.listModels(provider);
      const seen = /* @__PURE__ */ new Set();
      return models.map((model) => {
        if (typeof model.provider !== "string" || model.provider !== provider || typeof model.id !== "string" || model.id.length === 0 || typeof model.name !== "string" || model.name.length === 0 || model.description !== void 0 && typeof model.description !== "string" || seen.has(model.id)) throw new LlmError(`adapter returned invalid or duplicate model metadata for provider "${provider}"`, "INVALID_CATALOG");
        seen.add(model.id);
        const inputModalities = this.detachedModalities(model.inputModalities);
        return {
          provider: model.provider,
          id: model.id,
          name: model.name,
          ...model.description === void 0 ? {} : { description: model.description },
          ...inputModalities === void 0 ? {} : { inputModalities }
        };
      });
    }
    /**
    * Resolve and validate all metadata from the adapter that owns one exact
    * route. The result is detached from adapter-owned objects; catalog
    * membership remains advisory and does not control request routing.
    * @param provider - registered provider route to inspect.
    * @param model - exact model id passed to the adapter.
    * @param signal - optional cancellation for adapter-owned asynchronous lookup.
    * @returns exact model identity plus available context and reasoning metadata.
    */
    async resolveModelInfo(provider, model, signal) {
      return this.resolveModelInfoFor(this.registration(provider), model, signal);
    }
    async resolveModelInfoFor(registration, model, signal) {
      const resolved = await registration.adapter.resolveModel(registration.provider.id, model, signal);
      return this.normalizeModelInfo(registration, model, resolved);
    }
    /** Validate and detach one adapter-returned exact model result. */
    normalizeModelInfo(registration, model, resolved) {
      const provider = registration.provider.id;
      if (typeof resolved.provider !== "string" || resolved.provider !== provider || typeof resolved.id !== "string" || resolved.id !== model || typeof resolved.name !== "string" || resolved.name.length === 0 || resolved.description !== void 0 && typeof resolved.description !== "string") throw new LlmError(`adapter returned invalid exact model metadata for provider "${provider}" model "${model}"`, "INVALID_MODEL_INFO");
      const context = resolved.context;
      if (context !== void 0 && (!Number.isInteger(context.contextWindow) || context.contextWindow <= 0)) throw new LlmError(`adapter returned invalid context metadata for provider "${provider}" model "${model}"`, "INVALID_MODEL_CONTEXT");
      const inputModalities = this.detachedModalities(resolved.inputModalities);
      const systemPromptUpdate = resolved.systemPromptUpdate;
      if (systemPromptUpdate !== void 0 && systemPromptUpdate !== "in-history") throw new LlmError(`adapter returned invalid system prompt update mode for provider "${provider}" model "${model}"`, "INVALID_MODEL_INFO");
      const defaultMaxTokens = resolved.defaultMaxTokens;
      if (defaultMaxTokens !== void 0 && (!Number.isSafeInteger(defaultMaxTokens) || defaultMaxTokens <= 0)) throw new LlmError(`adapter returned invalid default maxTokens for provider "${provider}" model "${model}"`, "INVALID_MODEL_MAX_TOKENS");
      const info = {
        provider,
        id: model,
        name: resolved.name,
        ...resolved.description === void 0 ? {} : { description: resolved.description },
        ...inputModalities === void 0 ? {} : { inputModalities },
        ...context === void 0 ? {} : { context: { contextWindow: context.contextWindow } },
        ...defaultMaxTokens === void 0 ? {} : { defaultMaxTokens },
        ...resolved.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: resolved.systemPromptUpdate }
      };
      const reasoning = resolved.reasoning;
      if (reasoning === void 0) return info;
      if (reasoning.efforts.length === 0) throw new LlmError(`adapter returned invalid reasoning metadata for provider "${provider}" model "${model}"`, "INVALID_MODEL_REASONING");
      const seen = /* @__PURE__ */ new Set();
      const efforts = reasoning.efforts.map((effort) => {
        if (typeof effort.id !== "string" || effort.id.length === 0 || typeof effort.name !== "string" || effort.name.length === 0 || effort.description !== void 0 && typeof effort.description !== "string" || seen.has(effort.id)) throw new LlmError(`adapter returned invalid or duplicate reasoning effort metadata for provider "${provider}" model "${model}"`, "INVALID_MODEL_REASONING");
        seen.add(effort.id);
        return {
          id: effort.id,
          name: effort.name,
          ...effort.description === void 0 ? {} : { description: effort.description }
        };
      });
      if (reasoning.defaultEffort !== void 0 && !seen.has(reasoning.defaultEffort)) throw new LlmError(`adapter returned an unknown default reasoning effort for provider "${provider}" model "${model}"`, "INVALID_MODEL_REASONING");
      return {
        ...info,
        reasoning: {
          efforts,
          ...reasoning.defaultEffort === void 0 ? {} : { defaultEffort: reasoning.defaultEffort }
        }
      };
    }
    /**
    * Validate a conversation call config against its exact model capability and
    * materialize adapter-configured defaults. Unsupported explicit efforts
    * reject before provider I/O; no clamping or aliasing is performed. This
    * standalone query does not bind a later dispatch; use {@link prepareCall}
    * when logging and streaming must share one adapter registration.
    * @param config - provider/model route and optional request controls.
    * @param signal - optional cancellation for adapter-owned capability lookup.
    * @returns a detached config only when a default must be materialized.
    */
    async resolveCallConfig(config, signal) {
      return (await this.resolveCallFor(this.registration(config.provider), config, signal)).config;
    }
    async resolveCallFor(registration, config, signal) {
      const info = await this.resolveModelInfoFor(registration, config.model, signal);
      return this.resolveCallWithInfo(config, info);
    }
    /** Validate request controls against one already-bound exact model result. */
    resolveCallWithInfo(config, info) {
      const defaulted = config.maxTokens === void 0 && info.defaultMaxTokens !== void 0 ? {
        ...config,
        maxTokens: info.defaultMaxTokens
      } : config;
      const reasoning = info.reasoning;
      const requested = defaulted.reasoningEffort;
      let resolvedConfig = defaulted;
      if (reasoning === void 0) {
        if (requested !== void 0) throw new LlmError(`provider "${config.provider}" model "${config.model}" does not support reasoning effort "${requested}"`, "UNSUPPORTED_REASONING_EFFORT");
      } else {
        const effective = requested ?? reasoning.defaultEffort;
        if (effective !== void 0) {
          if (!reasoning.efforts.some((effort) => effort.id === effective)) throw new LlmError(`provider "${config.provider}" model "${config.model}" does not support reasoning effort "${effective}"`, "UNSUPPORTED_REASONING_EFFORT");
          if (requested !== effective) resolvedConfig = {
            ...defaulted,
            reasoningEffort: effective
          };
        }
      }
      return {
        config: resolvedConfig,
        ...info.context === void 0 ? {} : { context: info.context },
        modelInfo: info
      };
    }
    /**
    * Resolve one call under its current adapter registration. The returned
    * one-shot handle keeps that registration across header logging and dispatch,
    * so HMR cannot combine one adapter's capability result with another adapter.
    * @param config - provider/model route and optional request controls.
    * @param signal - optional cancellation for adapter-owned capability lookup.
    * @returns a prepared config and its registration-bound stream entry point.
    */
    async prepareCall(config, signal) {
      const registration = this.registration(config.provider);
      const adapterCall = await registration.adapter.prepareCall(config.provider, config.model, signal);
      const modelInfo = this.normalizeModelInfo(registration, config.model, adapterCall.model);
      const resolved = this.resolveCallWithInfo(config, modelInfo);
      const resolvedConfig = deepFreeze(structuredClone(resolved.config));
      const context = resolved.context === void 0 ? void 0 : deepFreeze(structuredClone(resolved.context));
      const adapterDefaults = deepFreeze({
        ...config.reasoningEffort === void 0 && resolvedConfig.reasoningEffort !== void 0 ? { reasoningEffort: true } : {},
        ...config.maxTokens === void 0 && resolvedConfig.maxTokens !== void 0 ? { maxTokens: true } : {}
      });
      let dispatched = false;
      return Object.freeze({
        config: resolvedConfig,
        retryPolicy: registration.retryPolicy,
        adapterDefaults,
        ...context === void 0 ? {} : { context },
        ...modelInfo.inputModalities === void 0 ? {} : { inputModalities: Object.freeze([...modelInfo.inputModalities]) },
        ...modelInfo.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: modelInfo.systemPromptUpdate },
        stream: (options) => {
          if (dispatched) throw new LlmError("a prepared LLM call can only be dispatched once", "INVALID_PREPARED_CALL");
          if (!callConfigEquals(options, resolvedConfig)) throw new LlmError("prepared LLM call config changed before adapter dispatch", "INVALID_PREPARED_CALL");
          dispatched = true;
          return this.streamWithRegistration(options, {
            registration,
            config: resolvedConfig,
            modelInfo,
            dispatch: (options2) => adapterCall.stream(options2)
          });
        }
      });
    }
    registration(provider) {
      const registration = this.adapters.get(provider);
      if (!registration) throw new LlmError(`no adapter registered for provider "${provider}"`, "NO_ADAPTER");
      return registration;
    }
    /** Remove replay state whose historical route is owned by another adapter. */
    forAdapter(options, adapter) {
      const messages = options.messages.map((message) => {
        const source = message.source;
        if (message.role !== "assistant" || source.kind !== "model" || source.replayState === void 0) return message;
        if (this.adapters.get(source.provider)?.adapter === adapter) return message;
        return freezeMessage({
          ...message,
          source: {
            kind: "model",
            provider: source.provider,
            model: source.model
          }
        });
      });
      if (messages.every((message, index) => message === options.messages[index])) return options;
      const filtered = {
        ...options,
        messages
      };
      return Object.isFrozen(options) ? deepFreeze(filtered) : filtered;
    }
    /**
    * Resolve the current execution-world read path of one durable file
    * reference through the mounted attachment and filesystem providers.
    */
    fileReadPath(ref) {
      let hostPath;
      try {
        hostPath = this.ctx.get("attachments")?.fileHostPath(ref);
      } catch {
        return;
      }
      if (hostPath === void 0) return void 0;
      return this.ctx.get("fs")?.processPathFromHostPath(hostPath);
    }
    /**
    * Final adapter boundary. Adapter selection, dispatch, iterator construction,
    * and iteration failures become one terminal failure chunk. Middleware and
    * downstream consumer failures remain thrown plugin or consumer errors.
    */
    async *adapterStream(options, prepared) {
      let iterator;
      try {
        const registration = prepared?.registration ?? this.registration(options.provider);
        const adapter = registration.adapter;
        let modelInfo;
        let resolvedConfig;
        let dispatch;
        if (prepared === void 0) {
          const adapterCall = await adapter.prepareCall(options.provider, options.model, options.signal);
          modelInfo = this.normalizeModelInfo(registration, options.model, adapterCall.model);
          resolvedConfig = this.resolveCallWithInfo(options, modelInfo).config;
          dispatch = (options2) => adapterCall.stream(options2);
        } else {
          modelInfo = prepared.modelInfo;
          resolvedConfig = prepared.config;
          dispatch = prepared.dispatch;
        }
        if (prepared !== void 0 && !callConfigEquals(options, resolvedConfig)) throw new LlmError("prepared LLM call config changed before adapter dispatch", "INVALID_PREPARED_CALL");
        const resolvedOptions = callConfigEquals(options, resolvedConfig) ? options : Object.isFrozen(options) ? deepFreeze({
          ...options,
          ...resolvedConfig
        }) : {
          ...options,
          ...resolvedConfig
        };
        let projectedMessages = resolvedOptions.messages;
        if (projectedMessages.some((message) => contentHasFile(message.content))) projectedMessages = projectFilesToText(projectedMessages, (ref) => this.fileReadPath(ref));
        if (modelInfo.inputModalities !== void 0 && !modelInfo.inputModalities.includes("image") && projectedMessages.some((message) => contentHasImage(message.content))) projectedMessages = projectImagesForTextModel(projectedMessages);
        const projectedOptions = projectedMessages === resolvedOptions.messages ? resolvedOptions : Object.isFrozen(resolvedOptions) ? deepFreeze({
          ...resolvedOptions,
          messages: projectedMessages
        }) : {
          ...resolvedOptions,
          messages: projectedMessages
        };
        iterator = dispatch(this.forAdapter(projectedOptions, adapter))[Symbol.asyncIterator]();
      } catch (error) {
        yield adapterFailureChunk(error, options.signal);
        return;
      }
      let completed = false;
      try {
        while (true) {
          let item;
          try {
            const next = await iterator.next();
            item = next.done ? { done: true } : {
              done: false,
              value: next.value
            };
          } catch (error) {
            completed = true;
            yield adapterFailureChunk(error, options.signal);
            return;
          }
          if (item.done) {
            completed = true;
            return;
          }
          yield item.value;
        }
      } finally {
        if (!completed) {
          const close = iterator.return?.bind(iterator);
          if (close) await close();
        }
      }
    }
    /**
    * Stream one model call as raw chunks (token-level deltas). Replay state is
    * retained only when the same adapter instance owns its historical provider
    * and the target provider. Final adapter selection remains fixed through
    * asynchronous exact-model resolution and dispatch. Adapter selection,
    * dispatch, and iteration failures become terminal `error` or `aborted`
    * finish chunks; middleware, nested-call, cleanup, and consumer failures
    * remain thrown.
    * @param options - the full request; `options.provider` selects the adapter.
    * @returns the chunk stream, possibly wrapped by `llm/stream` listeners.
    */
    stream(options) {
      return this.streamWithRegistration(options);
    }
    streamWithRegistration(options, prepared) {
      return this.ctx.waterfall(this, "llm/stream", options, () => this.adapterStream(options, prepared));
    }
  };
})();
function adapterFailureChunk(error, signal) {
  const failure = normalizeLlmFailure(error);
  return {
    type: "finish",
    reason: signal?.aborted || failure.code === "ABORTED" ? {
      kind: "aborted",
      failure
    } : {
      kind: "error",
      failure
    }
  };
}
export {
  APP_IDENTITY,
  AssistantStreamAccumulator,
  BlockAssembler,
  CONTEXT_SUMMARY_MAX_CHARS,
  CONTEXT_WINDOW_EXCEEDED_CODE,
  EMPTY_RESPONSE_CODE,
  HarnessError,
  IMAGE_OFFLOAD_REQUIRED_CODE,
  INVALID_CREDENTIAL_CODE,
  LlmAdapter,
  LlmAttemptId,
  LlmError,
  LlmRuntime,
  MessageId,
  ProviderRequestId,
  QUOTA_EXCEEDED_CODE,
  ReasoningEffortId,
  RetryPolicySchema,
  ToolCallId,
  assembleAssistantStream,
  assertUsableApiKey,
  assistantStreamChunks,
  assistantStreamFirstTokenTime,
  assistantStreamHasVisibleContent,
  assistantStreamHasVisibleText,
  attributionHeaders,
  boundContextSummary,
  callConfigEquals,
  chunkHasVisibleText,
  contentHasFile,
  contentHasImage,
  createAssistantMessage,
  createMessage,
  createSystemMessage,
  createToolResultMessage,
  createUserMessage,
  LlmRuntime as default,
  errorChain,
  expandAssistantStream,
  fileHandleText,
  freezeMessage,
  isAgentLoopRequest,
  isContextWindowExceededError,
  isHarnessError,
  isQuotaExceededError,
  isTokenDelta,
  isVisibleChunk,
  joinAssistantStreamText,
  lastAssistantStreamChunk,
  markAgentLoopRequest,
  normalizeApiKey,
  offloadedImageText,
  projectFilesToText,
  projectImagesForTextModel,
  projectOffloadedImages,
  requestImageHandleText,
  requiredImageOffload,
  resolveImageAttachmentAccess,
  resolveRetryPolicy,
  runFirstTokenTime,
  runFirstVisibleTime,
  textOnlyImageText,
  userAgent
};
