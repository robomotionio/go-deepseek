// .harness/packages/llm/llm-deepseek/lib/index.js
import { CONTEXT_WINDOW_EXCEEDED_CODE, EMPTY_RESPONSE_CODE, IMAGE_OFFLOAD_REQUIRED_CODE, LlmAdapter, LlmError, ProviderRequestId, QUOTA_EXCEEDED_CODE, ReasoningEffortId, RetryPolicySchema, ToolCallId, assertUsableApiKey, attributionHeaders, contentHasImage, isContextWindowExceededError, isQuotaExceededError, offloadedImageText, projectOffloadedImages, requestImageHandleText, requiredImageOffload, resolveImageAttachmentAccess, resolveRetryPolicy, textOnlyImageText } from "@deepseek-ai/dsh-llm";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { assertNever, deepEqualJson } from "@deepseek-ai/dsh-util-values";
import { getOrCreateAnonymousUserId } from "@deepseek-ai/dsh-anonymous-user-id";
import { MAX_TIMER_DELAY_MS, deadline, idleWatchdog, timeoutOf } from "@deepseek-ai/dsh-timeout";
import { ImageVariantId, longEdgeDimensions, requestImageDimensions } from "@deepseek-ai/dsh-attachment";
import { EventSourceParserStream } from "eventsource-parser/stream";
import { brandString } from "@deepseek-ai/dsh-brand";
import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { withFileLock, writeFileAtomic } from "@deepseek-ai/dsh-atomic-write";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
var TOOL_RESULT_IMAGE_TEXT = "Attached image(s) from tool result:";
function reasoningEffort(effort) {
  if (effort === "off" || effort === "low" || effort === "high" || effort === "max") return effort;
  throw new LlmError(`DeepSeek does not support reasoning effort "${effort}"`, "UNSUPPORTED_REASONING_EFFORT");
}
function resolveThinking(options, defaults) {
  if (options.purpose === "session-title") return { thinking: "disabled" };
  const effort = options.reasoningEffort === void 0 ? defaults.reasoningEffort : reasoningEffort(options.reasoningEffort);
  if (defaults.thinking === "disabled" && effort !== void 0 && effort !== "off") throw new LlmError(`DeepSeek deployment does not support reasoning effort "${effort}"`, "UNSUPPORTED_REASONING_EFFORT");
  if (effort === "off") return { thinking: "disabled" };
  if (effort === "low" || effort === "high" || effort === "max") return {
    thinking: "enabled",
    reasoningEffort: effort
  };
  return defaults.thinking === void 0 ? {} : { thinking: defaults.thinking };
}
function flattenText(blocks) {
  return blocks.filter((block) => block.type === "text").map((block) => block.text).join("");
}
function assertTextOnly(blocks) {
  if (contentHasImage(blocks)) throw new LlmError("The DeepSeek chat-completions adapter does not support image content.", "UNSUPPORTED_CONTENT");
}
function assertSupportedImageRoles(messages) {
  for (const message of messages) if (message.role !== "user" && contentHasImage(message.content)) throw new LlmError(`The DeepSeek chat-completions adapter cannot represent image content in a ${message.role} message.`, "UNSUPPORTED_CONTENT");
}
function imageHandle(ref, version, resolveAccess, precededByContent) {
  return {
    type: "text",
    text: `${precededByContent ? "\n" : ""}${requestImageHandleText(ref, version, resolveAccess?.(ref))}`
  };
}
async function imageParts(block, images, location, precededByContent) {
  const version = images.requestImages.get(block.attachment.attachmentId);
  if (version === void 0) throw new LlmError(`DeepSeek request image ${block.attachment.attachmentId} was not prepared.`, "INVALID_REQUEST");
  const image = images.representation.kind === "file" ? {
    type: "file",
    file_id: await images.representation.resolveFileId(version, block, location)
  } : {
    type: "image_url",
    image_url: { url: `data:${version.mediaType};base64,${Buffer.from(version.data).toString("base64")}` }
  };
  return [imageHandle(block.attachment, version, images.resolveImageAccess, precededByContent), image];
}
async function contentParts(blocks, images, message, nextImage) {
  const parts = [];
  for (const block of blocks) switch (block.type) {
    case "text":
      if (block.text.length > 0) parts.push({
        type: "text",
        text: block.text
      });
      break;
    case "image":
      nextImage.value += 1;
      parts.push(...await imageParts(block, images, {
        message,
        image: nextImage.value
      }, parts.length > 0));
      break;
    case "tool-result":
      parts.push(...await contentParts(block.content, images, message, nextImage));
      break;
    default:
      break;
  }
  return parts;
}
function userContent(parts) {
  const text = [];
  for (const part of parts) {
    if (part.type !== "text") return [...parts];
    text.push(part.text);
  }
  return text.join("");
}
function serializeAssistant(message) {
  const text = flattenText(message.content);
  const reasoning = message.content.filter((block) => block.type === "reasoning").map((block) => block.text).join("");
  const toolCalls = message.content.filter((block) => block.type === "tool-call").map((block) => ({
    id: block.id,
    type: "function",
    function: {
      name: block.name,
      arguments: block.arguments
    }
  }));
  return {
    role: "assistant",
    content: text,
    ...reasoning.length > 0 ? { reasoning_content: reasoning } : {},
    ...toolCalls.length > 0 ? { tool_calls: toolCalls } : {}
  };
}
function serializeMessages(messages) {
  const wire = [];
  for (const message of messages) {
    assertTextOnly(message.content);
    if (message.role === "system") {
      wire.push({
        role: "system",
        content: flattenText(message.content)
      });
      continue;
    }
    if (message.role === "assistant") {
      wire.push(serializeAssistant(message));
      continue;
    }
    const toolResults = message.content.filter((block) => block.type === "tool-result");
    const text = flattenText(message.content);
    if (text.length > 0 || toolResults.length === 0) wire.push({
      role: "user",
      content: text
    });
    for (const result of toolResults) wire.push({
      role: "tool",
      tool_call_id: result.toolCallId,
      content: flattenText(result.content) || "(no output)"
    });
  }
  return wire;
}
async function serializeMessagesWithImages(messages, images) {
  assertSupportedImageRoles(messages);
  const wire = [];
  let pendingToolImages = [];
  const flushToolImages = () => {
    if (pendingToolImages.length === 0) return;
    wire.push({
      role: "user",
      content: [{
        type: "text",
        text: TOOL_RESULT_IMAGE_TEXT
      }, ...pendingToolImages]
    });
    pendingToolImages = [];
  };
  for (const [messageIndex, message] of messages.entries()) {
    const nextImage = { value: 0 };
    if (message.role === "system") {
      flushToolImages();
      wire.push({
        role: "system",
        content: flattenText(message.content)
      });
      continue;
    }
    if (message.role === "assistant") {
      flushToolImages();
      wire.push(serializeAssistant(message));
      continue;
    }
    const regular = message.content.filter((block) => block.type !== "tool-result");
    const toolResults = message.content.filter((block) => block.type === "tool-result");
    const content = userContent(await contentParts(regular, images, messageIndex + 1, nextImage));
    if (content.length > 0 || toolResults.length === 0) {
      flushToolImages();
      wire.push({
        role: "user",
        content
      });
    }
    for (const result of toolResults) {
      const parts = await contentParts(result.content, images, messageIndex + 1, nextImage);
      const imageParts2 = parts.filter((part) => part.type !== "text");
      const text = parts.filter((part) => part.type === "text").map((part) => part.text).join("");
      wire.push({
        role: "tool",
        tool_call_id: result.toolCallId,
        content: text || "(no output)"
      });
      pendingToolImages.push(...imageParts2);
    }
  }
  flushToolImages();
  return wire;
}
function requestWithMessages(options, messages, defaults) {
  const tools = options.tools?.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
  const resolvedThinking = resolveThinking(options, defaults);
  return {
    model: options.model,
    messages,
    stream: true,
    stream_options: { include_usage: true },
    ...resolvedThinking.thinking !== void 0 ? { thinking: { type: resolvedThinking.thinking } } : {},
    ...resolvedThinking.reasoningEffort !== void 0 ? { reasoning_effort: resolvedThinking.reasoningEffort } : {},
    ...tools !== void 0 && tools.length > 0 ? { tools } : {},
    ...options.temperature !== void 0 ? { temperature: options.temperature } : {},
    ...options.maxTokens === void 0 ? {} : { max_tokens: options.maxTokens },
    ...options.stop !== void 0 ? { stop: options.stop } : {}
  };
}
function serializeRequest(options, defaults = {}) {
  const messages = [];
  if (options.system !== void 0) messages.push({
    role: "system",
    content: options.system
  });
  messages.push(...serializeMessages(options.messages));
  return requestWithMessages(options, messages, defaults);
}
function assertRetainedImagesFit(messages, images) {
  const representation = images.representation.kind === "file" ? "raw" : "base64";
  const offloadImages = requiredImageOffload(messages, {
    representation,
    maxBytes: images.maxRequestImageBytes,
    ...images.maxImagesPerRequest === void 0 ? {} : { maxImages: images.maxImagesPerRequest },
    ...images.byteQuantum === void 0 ? {} : { byteQuantum: images.byteQuantum },
    ...images.countQuantum === void 0 ? {} : { countQuantum: images.countQuantum }
  }, (block) => {
    const version = images.requestImages.get(block.attachment.attachmentId);
    if (version === void 0) throw new LlmError(`DeepSeek request image ${block.attachment.attachmentId} was not prepared.`, "INVALID_REQUEST");
    return version.bytes;
  });
  if (offloadImages > 0) throw new LlmError(`DeepSeek ${representation} request images exceed the route budget; ${offloadImages} more oldest occurrence(s) must be offloaded.`, IMAGE_OFFLOAD_REQUIRED_CODE, { offloadImages });
}
async function serializeRequestWithImages(options, images, defaults = {}) {
  assertSupportedImageRoles(options.messages);
  assertRetainedImagesFit(options.messages, images);
  const requestMessages = projectOffloadedImages(options.messages, (ref) => offloadedImageText(ref, images.resolveImageAccess?.(ref)));
  const messages = [];
  if (options.system !== void 0) messages.push({
    role: "system",
    content: options.system
  });
  messages.push(...await serializeMessagesWithImages(requestMessages, images));
  return requestWithMessages(options, messages, defaults);
}
var PATCH_SIZE = 14;
var DOWNSAMPLE_RATIO = 3;
var MAX_IMAGE_TOKENS = 1024;
var MIN_PIXELS = 544 * 544;
var CELL_SIZE = PATCH_SIZE * DOWNSAMPLE_RATIO;
var intDiv = (value, divisor) => Math.floor(value / divisor);
var ceilDiv = (value, divisor) => Math.floor((value + divisor - 1) / divisor);
function gridTokens(gridHeight, gridWidth) {
  return gridHeight * (gridWidth + 1) + 2;
}
function gridCells(paddedLength) {
  return ceilDiv(intDiv(paddedLength, PATCH_SIZE), DOWNSAMPLE_RATIO);
}
function solveResizeRatio(height, width, budget) {
  const aspect = height / width;
  const idealGridWidth = Math.sqrt((budget - 2) / aspect + 0.25) - 0.5;
  const idealGridHeight = idealGridWidth * aspect;
  let bestHeight;
  let bestWidth;
  if (idealGridWidth < 1) {
    const solvedGridWidth = 1;
    const solvedGridHeight = intDiv(budget - 2, 2);
    bestWidth = solvedGridWidth * CELL_SIZE;
    bestHeight = solvedGridHeight * CELL_SIZE;
  } else if (idealGridHeight < 1) {
    const solvedGridHeight = 1;
    bestWidth = (intDiv(budget - 2, solvedGridHeight) - 1) * CELL_SIZE;
    bestHeight = solvedGridHeight * CELL_SIZE;
  } else {
    const solvedGridWidth = Math.trunc(idealGridWidth);
    const solvedGridHeight = Math.trunc(idealGridHeight);
    const scale = Math.min(solvedGridWidth * CELL_SIZE / width, solvedGridHeight * CELL_SIZE / height);
    bestWidth = Math.trunc(width * scale / PATCH_SIZE) * PATCH_SIZE;
    bestHeight = Math.trunc(height * scale / PATCH_SIZE) * PATCH_SIZE;
  }
  const gridHeight = gridCells(bestHeight);
  const gridWidth = gridCells(bestWidth);
  return {
    gridHeight,
    gridWidth,
    bestHeight,
    bestWidth,
    numTokens: gridTokens(gridHeight, gridWidth)
  };
}
function safeResize(height, width, paddedHeight, paddedWidth) {
  const gridHeight = gridCells(paddedHeight);
  const gridWidth = gridCells(paddedWidth);
  const direct = {
    gridHeight,
    gridWidth,
    bestHeight: paddedHeight,
    bestWidth: paddedWidth,
    numTokens: gridTokens(gridHeight, gridWidth)
  };
  if (direct.numTokens <= MAX_IMAGE_TOKENS) return direct;
  const solved = solveResizeRatio(height, width, MAX_IMAGE_TOKENS);
  if (solved.numTokens > MAX_IMAGE_TOKENS) throw new Error(`deepseek image tokens: no grid fits the token budget for ${width}x${height}`);
  return solved;
}
function resizeOnce(width, height) {
  let scaledWidth = width;
  let scaledHeight = height;
  const pixels = scaledWidth * scaledHeight;
  if (pixels < MIN_PIXELS && pixels > 0) {
    const scale = Math.sqrt(MIN_PIXELS / pixels);
    scaledWidth = Math.trunc(scaledWidth * scale);
    scaledHeight = Math.trunc(scaledHeight * scale);
  }
  const paddedWidth = ceilDiv(scaledWidth, PATCH_SIZE) * PATCH_SIZE;
  const paddedHeight = ceilDiv(scaledHeight, PATCH_SIZE) * PATCH_SIZE;
  return safeResize(scaledHeight, scaledWidth, paddedHeight, paddedWidth);
}
function sameResize(a, b) {
  return a.gridHeight === b.gridHeight && a.gridWidth === b.gridWidth && a.bestHeight === b.bestHeight && a.bestWidth === b.bestWidth && a.numTokens === b.numTokens;
}
function deepSeekRequestImageDimensions(width, height) {
  const paddedWidth = ceilDiv(width, PATCH_SIZE) * PATCH_SIZE;
  if (gridTokens(gridCells(ceilDiv(height, PATCH_SIZE) * PATCH_SIZE), gridCells(paddedWidth)) <= MAX_IMAGE_TOKENS) return {
    width,
    height
  };
  const solved = solveResizeRatio(height, width, MAX_IMAGE_TOKENS);
  return longEdgeDimensions(width, height, width >= height ? solved.bestWidth : solved.bestHeight);
}
function deepSeekImageTokens(width, height) {
  let result = resizeOnce(width, height);
  for (let iteration = 1; iteration < 10; iteration += 1) {
    const next = resizeOnce(result.bestWidth, result.bestHeight);
    if (sameResize(next, result)) return result.numTokens;
    result = next;
  }
  throw new Error(`deepseek image tokens: resize did not converge for ${width}x${height}`);
}
var DEFAULT_MAX_REQUEST_FILES_BYTES = 128 * 1024 * 1024;
var DEFAULT_MAX_IMAGES_PER_REQUEST = 600;
var DEFAULT_LOW_DETAIL_IMAGE_PIXEL_BUDGET = 512 * 512;
var DEFAULT_REQUEST_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
var REQUEST_IMAGE_MAX_DIMENSION = 4096;
function resolveRequestImageMaxBytes(model) {
  return model.imageMaxBytes ?? 2097152;
}
function resolveRequestImageTarget(model, source) {
  const budget = model.imagePixelBudget === "low" ? DEFAULT_LOW_DETAIL_IMAGE_PIXEL_BUDGET : model.imagePixelBudget;
  const projected = budget === void 0 ? deepSeekRequestImageDimensions(source.width, source.height) : requestImageDimensions(source.width, source.height, budget);
  return {
    ...Math.max(projected.width, projected.height) > 4096 ? longEdgeDimensions(source.width, source.height, REQUEST_IMAGE_MAX_DIMENSION) : projected,
    maxBytes: resolveRequestImageMaxBytes(model)
  };
}
function textOnlyPrice(block) {
  return {
    visualTokens: 0,
    text: textOnlyImageText(block.attachment)
  };
}
function deepSeekImageRequestPricing(connection, model, resolveAccess) {
  const catalogModel2 = connection.models.find((entry) => entry.id === model);
  if (catalogModel2?.inputModalities?.includes("image") !== true) return { priceImages: (images) => images.map(textOnlyPrice) };
  return { priceImages: (images) => images.map(({ attachment: ref, offloaded }) => {
    if (offloaded === true) return {
      visualTokens: 0,
      text: offloadedImageText(ref, resolveAccess?.(ref))
    };
    const target = resolveRequestImageTarget(catalogModel2, ref);
    return {
      visualTokens: deepSeekImageTokens(target.width, target.height),
      text: requestImageHandleText(ref, target, resolveAccess?.(ref))
    };
  }) };
}
var OFF_REASONING_EFFORT = ReasoningEffortId("off");
var LOW_REASONING_EFFORT = ReasoningEffortId("low");
var HIGH_REASONING_EFFORT = ReasoningEffortId("high");
var MAX_REASONING_EFFORT = ReasoningEffortId("max");
var REASONING_EFFORTS = [
  {
    id: OFF_REASONING_EFFORT,
    name: "Off",
    description: "Use for simple tasks that do not need reasoning."
  },
  {
    id: LOW_REASONING_EFFORT,
    name: "Low",
    description: "Prefer for routine or latency-sensitive tasks."
  },
  {
    id: HIGH_REASONING_EFFORT,
    name: "High",
    description: "The default balance for most tasks."
  },
  {
    id: MAX_REASONING_EFFORT,
    name: "Max",
    description: "Reserve for the hardest quality-first tasks."
  }
];
var OFF_ONLY_REASONING_EFFORTS = [{
  id: OFF_REASONING_EFFORT,
  name: "Off",
  description: "Use for simple tasks that do not need reasoning."
}];
function catalogModelInfo(provider, model) {
  return {
    provider,
    id: model.id,
    name: model.name ?? model.id,
    ...model.description === void 0 ? {} : { description: model.description },
    inputModalities: model.inputModalities ?? ["text"]
  };
}
function modelInfo(connection, provider, model) {
  const configured = connection.models.find((entry) => entry.id === model);
  const contextWindow = configured?.contextWindow ?? connection.defaultContextWindow;
  return {
    ...configured === void 0 ? {
      provider,
      id: model,
      name: model,
      inputModalities: ["text"]
    } : catalogModelInfo(provider, configured),
    context: { contextWindow },
    defaultMaxTokens: configured?.maxTokens ?? connection.maxTokens,
    ...configured?.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: configured.systemPromptUpdate },
    ...connection.defaults.thinking === "disabled" ? { reasoning: {
      efforts: OFF_ONLY_REASONING_EFFORTS,
      defaultEffort: OFF_REASONING_EFFORT
    } } : { reasoning: {
      efforts: REASONING_EFFORTS,
      defaultEffort: connection.defaults.reasoningEffort === "off" ? OFF_REASONING_EFFORT : connection.defaults.reasoningEffort === "low" ? LOW_REASONING_EFFORT : connection.defaults.reasoningEffort === "max" ? MAX_REASONING_EFFORT : HIGH_REASONING_EFFORT
    } }
  };
}
var __addDisposableResource$2 = function(env, value, async) {
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
var __disposeResources$2 = /* @__PURE__ */ (function(SuppressedError2) {
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
var FileResolutionFailure = class extends Error {
  constructor(cause) {
    super("DeepSeek Files API could not resolve a request image.", { cause });
    this.name = "FileResolutionFailure";
  }
};
function providerRejectedNormalizedImage(detail) {
  return /(?:unsupported|invalid|cannot read|failed to (?:decode|process)).{0,40}image/iu.test(detail) || /image.{0,40}(?:unsupported|invalid|cannot be decoded)/iu.test(detail);
}
function providerRejectedFileId(detail) {
  const file = /\bfile(?:[_ -]?(?:id|api|not[_ -]?found|deleted|expired))?/iu.test(detail);
  const missing = /(?:expired|not[_ -]?found|deleted|do(?:es)? not exist|not created under (?:this|your) account)/iu.test(detail);
  const invalidId = /(?:invalid.{0,20}file[_ -]?(?:id|api)|file[_ -]?(?:id|api).{0,20}invalid)/iu.test(detail);
  return file && (missing || invalidId);
}
function detailNamesFileId(detail, fileId) {
  let index = detail.indexOf(fileId);
  while (index >= 0) {
    const before = detail[index - 1];
    const after = detail[index + fileId.length];
    if ((before === void 0 || !/[\p{L}\p{N}_-]/u.test(before)) && (after === void 0 || !/[\p{L}\p{N}_-]/u.test(after))) return true;
    index = detail.indexOf(fileId, index + 1);
  }
  return false;
}
function staleMappings(files, detail) {
  const unique = [...new Map(files.map((file) => [`${file.version.variantId}\0${file.fileId}`, file])).values()];
  const exact = unique.filter((file) => detailNamesFileId(detail, file.fileId));
  return exact.length > 0 ? exact : unique;
}
function normalizedImageFacts(file) {
  const version = file.version;
  const name2 = version.attachment.name ?? version.attachment.attachmentId;
  const colour = version.hasAlpha ? "sRGBA" : "sRGB";
  return `"${name2}" at message ${file.location.message}, image ${file.location.image} (${version.mediaType}, 8-bit ${colour}, ${version.width}x${version.height})`;
}
function normalizedImageDiagnostic(files, providerMessage, providerDetail) {
  const target = files.find((file) => detailNamesFileId(providerDetail, file.fileId)) ?? (files.length === 1 ? files[0] : void 0);
  if (target !== void 0) return `DeepSeek rejected normalized image ${normalizedImageFacts(target)}: ${providerMessage}. The provider rejected bytes already normalized by the harness; PNG, JPEG, WebP, and GIF remain supported input formats.`;
  return `DeepSeek rejected a normalized request image: ${providerMessage}. Candidate images: ${[...new Map(files.map((file) => [`${file.version.variantId}\0${file.location.message}\0${file.location.image}`, file])).values()].map(normalizedImageFacts).join("; ")}. The provider rejected bytes already normalized by the harness; PNG, JPEG, WebP, and GIF remain supported input formats.`;
}
var RequestFiles = class {
  files;
  connection;
  policy;
  timeoutMs;
  signal;
  activity;
  used = [];
  retried = false;
  constructor(files, connection, policy, timeoutMs, signal, activity) {
    this.files = files;
    this.connection = connection;
    this.policy = policy;
    this.timeoutMs = timeoutMs;
    this.signal = signal;
    this.activity = activity;
  }
  /** Reset occurrence tracking before serializing the next HTTP attempt. */
  beginAttempt() {
    this.used = [];
  }
  /**
  * Resolve a retained image under its own upload deadline.
  * @param version - prepared request image.
  * @param location - occurrence used by provider-rejection diagnostics.
  * @returns the reusable provider id.
  */
  async resolve(version, location) {
    const env_1 = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      const limit = __addDisposableResource$2(env_1, deadline(this.signal, this.timeoutMs, "DEEPSEEK_FILES_API_TIMEOUT"), false);
      let resolved;
      try {
        resolved = await this.files.ensureUploaded(version, this.connection, this.policy, limit.signal);
      } catch (error) {
        if (this.signal.aborted) throw error;
        throw new FileResolutionFailure(error);
      }
      this.activity();
      this.used.push({
        version,
        fileId: resolved.record.fileId,
        location
      });
      return resolved.record.fileId;
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources$2(env_1);
    }
  }
  /**
  * Invalidate rejected mappings; only the first stale-id response permits another request.
  * @param detail - provider error fields used for stale-id classification.
  * @returns whether the caller should serialize and dispatch again.
  */
  async retry(detail) {
    if (this.used.length === 0 || !providerRejectedFileId(detail)) return false;
    await Promise.all(staleMappings(this.used, detail).map((file) => this.files.invalidate(file.version, file.fileId, this.connection)));
    if (this.retried) return false;
    this.retried = true;
    return true;
  }
  /**
  * Attribute a normalized-image rejection to the actual uploaded image occurrences.
  * @param status - rejected request's HTTP status.
  * @param message - provider's error message.
  * @param detail - provider error classification fields.
  * @returns the image diagnostic or the original provider message.
  */
  errorMessage(status, message, detail) {
    return status === 400 && this.used.length > 0 && providerRejectedNormalizedImage(detail) ? normalizedImageDiagnostic(this.used, message, detail) : message;
  }
};
async function prepareRequestExtensions(body, options, prepare) {
  let extensions;
  try {
    extensions = await prepare({
      body,
      ...options
    });
  } catch (error) {
    throw new LlmError("DeepSeek request extension preparation failed", "REQUEST_EXTENSION", { cause: error });
  }
  for (const field of Object.keys(extensions.fields)) if (Object.hasOwn(body, field)) throw new LlmError(`DeepSeek request extension field ${JSON.stringify(field)} collides with the base request`, "REQUEST_EXTENSION");
  return {
    payload: JSON.stringify({
      ...body,
      ...extensions.fields
    }),
    async accept() {
      try {
        await extensions.accept();
      } catch (error) {
        throw new LlmError("DeepSeek request extension acceptance failed", "REQUEST_EXTENSION", { cause: error });
      }
    }
  };
}
async function* parseSse$1(stream, onComment) {
  const events = stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream({ onComment }));
  for await (const { data } of events) {
    yield data;
    if (data === "[DONE]") return;
  }
  throw new LlmError("SSE stream ended without [DONE]", "STREAM_CLOSED");
}
function mapFinishReason(reason) {
  switch (reason) {
    case "stop":
      return { kind: "stop" };
    case "tool_calls":
      return { kind: "tool-calls" };
    case "length":
      return { kind: "max-tokens" };
    default:
      return {
        kind: "error",
        failure: {
          message: `model stopped: ${reason}`,
          code: reason.toUpperCase()
        }
      };
  }
}
function mapUsage(usage) {
  const cacheRead = usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens;
  const reasoning = usage.completion_tokens_details?.reasoning_tokens;
  const combined = usage.prompt_tokens + usage.completion_tokens;
  const hasExactTotal = Number.isSafeInteger(usage.prompt_tokens) && usage.prompt_tokens >= 0 && Number.isSafeInteger(usage.completion_tokens) && usage.completion_tokens >= 0 && Number.isSafeInteger(combined) && (usage.total_tokens === void 0 || usage.total_tokens === combined);
  return {
    inputTokens: usage.prompt_tokens - (cacheRead ?? 0),
    outputTokens: usage.completion_tokens,
    ...hasExactTotal ? { totalTokens: combined } : {},
    ...cacheRead !== void 0 ? { cacheReadTokens: cacheRead } : {},
    ...reasoning !== void 0 ? { reasoningTokens: reasoning } : {}
  };
}
function acceptIdentity(current, incoming) {
  return typeof incoming === "string" && incoming.length > 0 ? incoming : current;
}
function closeBlock(block) {
  switch (block.kind) {
    case "text":
      return {
        type: "text",
        text: block.text
      };
    case "reasoning":
      return {
        type: "reasoning",
        text: block.text
      };
    case "tool-call":
      return {
        type: "tool-call",
        id: brandString(block.callId ?? ""),
        name: block.name ?? "",
        arguments: block.text
      };
  }
}
async function* translate$1(payloads) {
  let nextIndex = 0;
  let textBlock;
  let reasoningBlock;
  const toolBlocks = /* @__PURE__ */ new Map();
  const order = [];
  let pendingFinish;
  let pendingUsage;
  function open(kind) {
    const block = {
      index: nextIndex++,
      kind,
      text: ""
    };
    order.push(block);
    return block;
  }
  for await (const payload of payloads) {
    if (payload === "[DONE]") {
      for (const block of order) yield {
        type: "block-end",
        index: block.index,
        block: closeBlock(block)
      };
      if (pendingUsage) yield {
        type: "usage",
        usage: pendingUsage
      };
      const reason = pendingFinish ?? { kind: "stop" };
      yield {
        type: "finish",
        reason: reason.kind === "stop" && order.length === 0 ? {
          kind: "error",
          failure: {
            message: "model returned a completed response with no content",
            code: EMPTY_RESPONSE_CODE
          }
        } : reason
      };
      return;
    }
    let chunk;
    try {
      chunk = JSON.parse(payload);
    } catch {
      throw new LlmError(`malformed SSE payload: ${payload.slice(0, 120)}`, "MALFORMED_RESPONSE");
    }
    for (const choice of chunk.choices ?? []) {
      const delta = choice.delta;
      const reasoning = delta?.reasoning_content;
      if (typeof reasoning === "string" && reasoning.length > 0) {
        if (!reasoningBlock) {
          reasoningBlock = open("reasoning");
          yield {
            type: "block-start",
            index: reasoningBlock.index,
            blockType: "reasoning"
          };
        }
        reasoningBlock.text += reasoning;
        yield {
          type: "reasoning-delta",
          index: reasoningBlock.index,
          text: reasoning
        };
      }
      const content = delta?.content;
      if (typeof content === "string" && content.length > 0) {
        if (!textBlock) {
          textBlock = open("text");
          yield {
            type: "block-start",
            index: textBlock.index,
            blockType: "text"
          };
        }
        textBlock.text += content;
        yield {
          type: "text-delta",
          index: textBlock.index,
          text: content
        };
      }
      for (const call of delta?.tool_calls ?? []) {
        let block = toolBlocks.get(call.index);
        if (!block) {
          block = open("tool-call");
          toolBlocks.set(call.index, block);
          yield {
            type: "block-start",
            index: block.index,
            blockType: "tool-call"
          };
        }
        block.callId = acceptIdentity(block.callId, call.id);
        block.name = acceptIdentity(block.name, call.function?.name);
        const fragment = call.function?.arguments ?? "";
        block.text += fragment;
        yield {
          type: "tool-call-delta",
          index: block.index,
          id: brandString(block.callId ?? ""),
          ...block.name !== void 0 ? { name: block.name } : {},
          argumentsDelta: fragment
        };
      }
      if (typeof choice.finish_reason === "string") pendingFinish = mapFinishReason(choice.finish_reason);
    }
    if (chunk.usage) pendingUsage = mapUsage(chunk.usage);
  }
  throw new LlmError("SSE payload stream ended without [DONE]", "STREAM_CLOSED");
}
var __addDisposableResource$1 = function(env, value, async) {
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
var __disposeResources$1 = /* @__PURE__ */ (function(SuppressedError2) {
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
var STREAM_IDLE_TIMEOUT_CODE = "LLM_STREAM_IDLE_TIMEOUT";
function collectImageRefs(content, refs) {
  for (const block of content) if (block.type === "image" && block.offloaded !== true) refs.set(block.attachment.attachmentId, block.attachment);
  else if (block.type === "tool-result") collectImageRefs(block.content, refs);
}
async function prepareRequestImages(options, attachments, model, signal) {
  const refs = /* @__PURE__ */ new Map();
  for (const message of options.messages) collectImageRefs(message.content, refs);
  const orderedRefs = [...refs.values()];
  const projected = await Promise.all(orderedRefs.map((ref) => attachments.readImageRequest(ref, resolveRequestImageTarget(model, ref), signal)));
  return new Map(orderedRefs.map((ref, index) => [ref.attachmentId, projected[index]]));
}
function providerRetryAfterMs(value) {
  if (value === null) return void 0;
  if (/^\d+$/.test(value)) {
    const delay2 = Number(value) * 1e3;
    return Number.isFinite(delay2) && delay2 > 0 ? delay2 : void 0;
  }
  const delay = Date.parse(value) - Date.now();
  return Number.isFinite(delay) && delay > 0 ? delay : void 0;
}
function requestId(headers) {
  const value = headers.get("x-request-id") ?? headers.get("x-deepseek-request-id");
  return value === null || value.length === 0 ? void 0 : ProviderRequestId(value);
}
function httpErrorCode(status, error) {
  if (status === 401 || status === 403) return "AUTH";
  if (status === 413) return "INVALID_REQUEST";
  const detail = [
    error?.code,
    error?.type,
    error?.message
  ].filter(Boolean).join(" ");
  if (isQuotaExceededError(detail)) return QUOTA_EXCEEDED_CODE;
  if (status === 429) return "RATE_LIMIT";
  if (status === 400) {
    if (isContextWindowExceededError(detail)) return CONTEXT_WINDOW_EXCEEDED_CODE;
    return "INVALID_REQUEST";
  }
  if (status >= 500) return "SERVER";
  return `HTTP_${status}`;
}
var ChatCompletionsAdapter = class extends LlmAdapter {
  config;
  files;
  constructor(config) {
    super();
    this.config = config;
    this.files = config.resolveFiles();
  }
  providerInfo(provider) {
    return {
      id: provider,
      name: "DeepSeek"
    };
  }
  providerRetryPolicy(_provider) {
    return this.config.options().retryPolicy;
  }
  imageRequestPricing(_provider, model) {
    const attachments = this.config.resolveAttachments?.();
    const resolveAccess = attachments === void 0 ? void 0 : (ref) => this.config.resolveImageAccess?.(attachments, ref);
    return deepSeekImageRequestPricing(this.config.options(), model, resolveAccess);
  }
  listModels(provider) {
    return Promise.resolve(this.config.options().models.map((model) => catalogModelInfo(provider, model)));
  }
  resolveModel(provider, model, _signal) {
    return Promise.resolve(modelInfo(this.config.options(), provider, model));
  }
  prepareCall(provider, model, _signal) {
    const connection = this.config.options();
    return Promise.resolve({
      model: modelInfo(connection, provider, model),
      stream: (options) => this.streamWithConnection(options, connection)
    });
  }
  stream(options) {
    return this.streamWithConnection(options, this.config.options());
  }
  async *streamWithConnection(options, connection) {
    const env_1 = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      const hasImages = options.messages.some((message) => contentHasImage(message.content));
      let attachments;
      if (hasImages) {
        if (connection.models.find((entry) => entry.id === options.model)?.inputModalities?.includes("image") !== true) throw new LlmError(`DeepSeek model "${options.model}" does not accept image input.`, "UNSUPPORTED_CONTENT");
        attachments = this.config.resolveAttachments?.();
        if (attachments === void 0) throw new LlmError("DeepSeek image conversion requires the durable attachment service.", "UNSUPPORTED_CONTENT");
      }
      const apiKey = await this.config.resolveApiKey(connection);
      const userId = this.config.resolveUserId();
      const consumer = new AbortController();
      const watchdog = __addDisposableResource$1(env_1, idleWatchdog(options.signal === void 0 ? consumer.signal : AbortSignal.any([options.signal, consumer.signal]), connection.streamIdleTimeoutMs, STREAM_IDLE_TIMEOUT_CODE), false);
      const iterator = this.request(options, watchdog.signal, connection, apiKey, userId, attachments, () => {
        watchdog.pulse();
      })[Symbol.asyncIterator]();
      let exhausted = false;
      try {
        while (true) {
          const result = await watchdog.next(iterator);
          if (result.done) {
            exhausted = true;
            return;
          }
          yield result.value;
        }
      } catch (error) {
        if (timeoutOf(watchdog.signal, STREAM_IDLE_TIMEOUT_CODE) !== void 0) throw new LlmError(`DeepSeek stream idle timeout after ${connection.streamIdleTimeoutMs}ms`, "TIMEOUT", { cause: error });
        if (options.signal?.aborted) throw new LlmError("DeepSeek request aborted by caller", "ABORTED", { cause: error });
        if (error instanceof LlmError) throw error;
        throw new LlmError(`DeepSeek API stream from ${connection.baseURL} failed`, "TRANSPORT", { cause: error });
      } finally {
        consumer.abort("DeepSeek stream consumer stopped");
        if (!exhausted && iterator.return !== void 0) try {
          await iterator.return();
        } catch (_abortedTransportTeardown) {
        }
      }
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources$1(env_1);
    }
  }
  async *request(options, signal, connection, apiKey, userId, attachments, onActivity) {
    const headers = {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "accept": "text/event-stream",
      ...attributionHeaders(),
      "x-deepseek-harness-user-id": String(userId),
      ...options.sessionId !== void 0 ? { "x-deepseek-harness-session-id": String(options.sessionId) } : {},
      ...options.purpose === "compaction" ? { "x-deepseek-harness-compact": "1" } : {}
    };
    const fileConnection = {
      baseURL: connection.baseURL,
      apiKey,
      protocol: connection.protocol
    };
    const model = connection.models.find((entry) => entry.id === options.model);
    const resolveImageAccess = attachments === void 0 ? void 0 : (ref) => this.config.resolveImageAccess?.(attachments, ref);
    const imageAccessOptions = resolveImageAccess === void 0 ? {} : { resolveImageAccess };
    const requestOptions = options;
    const requestImages = attachments === void 0 || model === void 0 ? /* @__PURE__ */ new Map() : await prepareRequestImages(requestOptions, attachments, model, signal);
    let representation = "file";
    const requestFiles = new RequestFiles(this.files, fileConnection, connection.filePolicy, connection.filesApiTimeoutMs, signal, onActivity);
    while (true) {
      requestFiles.beginAttempt();
      let body;
      if (attachments === void 0) body = serializeRequest(requestOptions, connection.defaults);
      else if (representation === "base64") body = await serializeRequestWithImages(requestOptions, {
        representation: { kind: "base64" },
        requestImages,
        ...imageAccessOptions,
        maxRequestImageBytes: connection.maxInlineRequestImageBytes,
        maxImagesPerRequest: connection.maxImagesPerRequest,
        byteQuantum: connection.inlineImageOffloadByteQuantum,
        countQuantum: connection.imageOffloadCountQuantum
      }, connection.defaults);
      else try {
        body = await serializeRequestWithImages(requestOptions, {
          representation: {
            kind: "file",
            resolveFileId: (version, _block, location) => requestFiles.resolve(version, location)
          },
          requestImages,
          ...imageAccessOptions,
          maxRequestImageBytes: connection.maxRequestFilesBytes,
          maxImagesPerRequest: connection.maxImagesPerRequest,
          byteQuantum: connection.imageOffloadByteQuantum,
          countQuantum: connection.imageOffloadCountQuantum
        }, connection.defaults);
      } catch (error) {
        if (!(error instanceof FileResolutionFailure)) throw error;
        representation = "base64";
        continue;
      }
      const extensions = await prepareRequestExtensions(body, {
        signal,
        ...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },
        ...options.purpose === void 0 ? {} : { purpose: options.purpose }
      }, this.config.prepareExtensions);
      let response;
      try {
        response = await fetch(`${connection.baseURL}/chat/completions`, {
          method: "POST",
          headers,
          body: extensions.payload,
          signal
        });
      } catch (error) {
        if (signal.aborted) throw error;
        throw new LlmError(`DeepSeek API request to ${connection.baseURL} failed`, "TRANSPORT", { cause: error });
      }
      if (!response.ok) {
        let message = `DeepSeek API error (HTTP ${response.status})`;
        let providerError2;
        const rawResponse = await response.text();
        try {
          providerError2 = JSON.parse(rawResponse).error;
          if (providerError2?.message) message = providerError2.message;
        } catch {
        }
        const detail = [
          providerError2?.code,
          providerError2?.type,
          providerError2?.message
        ].filter((field) => typeof field === "string").join(" ");
        if (await requestFiles.retry(detail)) continue;
        message = requestFiles.errorMessage(response.status, message, detail);
        const delay = providerRetryAfterMs(response.headers.get("retry-after"));
        const id = requestId(response.headers);
        throw new LlmError(message, httpErrorCode(response.status, providerError2), {
          cause: new Error(rawResponse.length > 0 ? rawResponse : `DeepSeek HTTP ${response.status}`),
          status: response.status,
          ...delay === void 0 ? {} : { providerRetryAfterMs: delay },
          ...id === void 0 ? {} : { requestId: id }
        });
      }
      await extensions.accept();
      if (!response.body) throw new LlmError("DeepSeek API returned no response body", "EMPTY_RESPONSE");
      yield* translate$1(parseSse$1(response.body, onActivity));
      return;
    }
  }
};
function DeepSeekFileId(id) {
  return id;
}
function DeepSeekFileScope(scope) {
  return scope;
}
var MESSAGES_FILES_BETA = "files-api-2025-04-14";
function messagesApiRoot(baseURL) {
  const base = baseURL.replace(/\/+$/u, "");
  return new URL(base).pathname.endsWith("/v1") ? base : `${base}/v1`;
}
var MIN_FILE_EXPIRY_SECONDS = 3600;
var MAX_FILE_EXPIRY_SECONDS = 2592e3;
var MAX_FILE_UPLOAD_BYTES = 128 * 1024 * 1024;
var MAX_STORED_FILE_COUNT = 1e4;
var MAX_STORED_FILE_BYTES = 25 * 1024 * 1024 * 1024;
var DeepSeekFilesError = class extends LlmError {
  /** Parsed provider detail used only for error classification. */
  detail;
  /**
  * @param message - user-readable provider failure.
  * @param status - HTTP status returned by the Files API.
  * @param detail - provider error fields joined for classification.
  */
  constructor(message, status, detail) {
    super(message, status === 401 || status === 403 ? "AUTH" : status === 429 ? "RATE_LIMIT" : status >= 500 ? "SERVER" : "FILES_API", { status });
    this.name = "DeepSeekFilesError";
    this.detail = detail;
  }
};
function isFilesQuotaError(error) {
  return error instanceof DeepSeekFilesError && /(?:quota|storage|stored files|file count|too many files)/iu.test(error.detail);
}
function invalidResponse(operation) {
  return new LlmError(`DeepSeek Files API returned an invalid ${operation} response.`, "INVALID_RESPONSE");
}
function parseFileObject(value, operation) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalidResponse(operation);
  const wire = value;
  if (typeof wire.id !== "string" || wire.id.length === 0 || wire.object !== "file" || !Number.isSafeInteger(wire.bytes) || wire.bytes < 0 || !Number.isSafeInteger(wire.created_at) || wire.created_at < 0 || typeof wire.filename !== "string" || wire.filename.length === 0 || wire.purpose !== "user_data" || wire.expires_at !== void 0 && (!Number.isSafeInteger(wire.expires_at) || wire.expires_at < 0)) throw invalidResponse(operation);
  return {
    id: DeepSeekFileId(wire.id),
    bytes: wire.bytes,
    createdAt: wire.created_at,
    filename: wire.filename,
    purpose: "user_data",
    ...wire.expires_at === void 0 ? {} : { expiresAt: wire.expires_at }
  };
}
function parseMessagesFile(value, operation) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalidResponse(operation);
  const wire = value;
  const createdAt = typeof wire.created_at === "string" ? Math.floor(Date.parse(wire.created_at) / 1e3) : NaN;
  if (wire.type !== "file" || typeof wire.mime_type !== "string" || !Number.isSafeInteger(createdAt)) throw invalidResponse(operation);
  return parseFileObject({
    id: wire.id,
    object: "file",
    bytes: wire.size_bytes,
    created_at: createdAt,
    filename: wire.filename,
    purpose: "user_data"
  }, operation);
}
function providerErrorDetail$1(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { detail: "" };
  const error = value.error;
  if (error === null || typeof error !== "object" || Array.isArray(error)) return { detail: "" };
  const fields = error;
  const message = typeof fields.message === "string" ? fields.message : void 0;
  return {
    ...message === void 0 ? {} : { message },
    detail: [
      fields.code,
      fields.type,
      fields.message
    ].filter((field) => typeof field === "string").join(" ")
  };
}
var DeepSeekFilesClient = class {
  baseURL;
  apiKey;
  fetchImpl;
  protocol;
  path;
  /**
  * @param options - endpoint, API-key snapshot, and optional test transport.
  */
  constructor(options) {
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.protocol = options.protocol;
    this.baseURL = this.protocol === "messages" ? messagesApiRoot(options.baseURL) : options.baseURL.replace(/\/+$/u, "");
    this.path = "/files";
  }
  parseFile(value, operation) {
    return this.protocol === "messages" ? parseMessagesFile(value, operation) : parseFileObject(value, operation);
  }
  async request(path, init, signal) {
    let response;
    try {
      const headers = new Headers(attributionHeaders());
      if (this.protocol === "messages") {
        headers.set("x-api-key", this.apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.set("anthropic-beta", MESSAGES_FILES_BETA);
      } else headers.set("authorization", `Bearer ${this.apiKey}`);
      response = await this.fetchImpl(`${this.baseURL}${path}`, {
        ...init,
        redirect: "error",
        headers,
        ...signal === void 0 ? {} : { signal }
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new LlmError(`DeepSeek Files API request to ${this.baseURL} failed`, "TRANSPORT", { cause: error });
    }
    if (response.ok) return response;
    let parsed;
    try {
      parsed = await response.json();
    } catch {
    }
    const { message, detail } = providerErrorDetail$1(parsed);
    throw new DeepSeekFilesError(message ?? `DeepSeek Files API error (HTTP ${response.status})`, response.status, detail);
  }
  /**
  * Upload one image with an explicit expiry.
  * @param input - deterministic request-version bytes, media type, filename, lifetime, and cancellation.
  * @returns the validated file and reuse deadline. Messages omits expiry metadata;
  *   its deadline uses upload creation plus the requested lifetime.
  */
  async upload(input) {
    if (input.data.byteLength > 134217728) throw new LlmError("DeepSeek Files API upload exceeds 128 MiB.", "INVALID_REQUEST");
    if (!Number.isSafeInteger(input.expiresAfterSeconds) || input.expiresAfterSeconds < 3600 || input.expiresAfterSeconds > 2592e3) throw new LlmError("DeepSeek file expiry must be between 3600 and 2592000 seconds.", "INVALID_REQUEST");
    const form = new FormData();
    if (this.protocol === "chat-completions") form.set("purpose", "user_data");
    form.set("expires_after[anchor]", "created_at");
    form.set("expires_after[seconds]", String(input.expiresAfterSeconds));
    form.set("file", new Blob([Uint8Array.from(input.data).buffer], { type: input.mediaType }), input.filename);
    const response = await this.request(this.path, {
      method: "POST",
      body: form
    }, input.signal);
    const file = this.parseFile(await response.json(), "upload");
    if (this.protocol === "messages") return {
      ...file,
      expiresAt: file.createdAt + input.expiresAfterSeconds
    };
    if (file.expiresAt === void 0) throw invalidResponse("upload");
    return {
      ...file,
      expiresAt: file.expiresAt
    };
  }
  /**
  * List one page of files. Ordering applies only to Chat Completions; Messages owns its page order.
  * @param options - pagination, ordering, and cancellation.
  * @returns the validated page with null Messages cursors omitted.
  */
  async list(options = {}) {
    const query = new URLSearchParams(this.protocol === "messages" ? {} : { purpose: "user_data" });
    if (options.after !== void 0) query.set(this.protocol === "messages" ? "after_id" : "after", options.after);
    if (options.limit !== void 0) query.set("limit", String(options.limit));
    if (options.order !== void 0 && this.protocol === "chat-completions") query.set("order", options.order);
    const value = await (await this.request(`${this.path}?${query.toString()}`, { method: "GET" }, options.signal)).json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalidResponse("list");
    const wire = value;
    const firstId = this.protocol === "messages" ? wire.first_id ?? void 0 : wire.first_id;
    const lastId = this.protocol === "messages" ? wire.last_id ?? void 0 : wire.last_id;
    if (this.protocol === "chat-completions" && wire.object !== "list" || !Array.isArray(wire.data) || typeof wire.has_more !== "boolean" || firstId !== void 0 && typeof firstId !== "string" || lastId !== void 0 && typeof lastId !== "string") throw invalidResponse("list");
    return {
      data: wire.data.map((item) => this.parseFile(item, "list")),
      ...typeof firstId === "string" ? { firstId: DeepSeekFileId(firstId) } : {},
      ...typeof lastId === "string" ? { lastId: DeepSeekFileId(lastId) } : {},
      hasMore: wire.has_more
    };
  }
  /**
  * Retrieve one file object.
  * @param fileId - provider file identifier.
  * @param signal - request cancellation.
  * @returns the validated file object.
  */
  async retrieve(fileId, signal) {
    const response = await this.request(`${this.path}/${encodeURIComponent(fileId)}`, { method: "GET" }, signal);
    return this.parseFile(await response.json(), "retrieve");
  }
  /**
  * Delete one provider file.
  * @param fileId - provider file identifier.
  * @param signal - request cancellation.
  */
  async delete(fileId, signal) {
    const value = await (await this.request(`${this.path}/${encodeURIComponent(fileId)}`, { method: "DELETE" }, signal)).json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw invalidResponse("delete");
    const wire = value;
    if (wire.id !== fileId || (this.protocol === "messages" ? wire.type !== "file_deleted" : wire.object !== "file" || wire.deleted !== true)) throw invalidResponse("delete");
  }
};
var InvalidUploadIndexError = class extends Error {
};
function deepSeekFileScope(baseURL, apiKey) {
  return DeepSeekFileScope(createHash("sha256").update(baseURL.replace(/\/+$/u, "")).update("\0").update(apiKey).digest("hex"));
}
function absent(error) {
  return error?.code === "ENOENT";
}
function parseRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new InvalidUploadIndexError("llm-deepseek: upload index contains a non-object record");
  const record = value;
  if (typeof record.scope !== "string" || !/^[0-9a-f]{64}$/u.test(record.scope) || typeof record.attachmentId !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(record.attachmentId) || typeof record.variantId !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(record.variantId) || typeof record.fileId !== "string" || record.fileId.length === 0 || !Number.isSafeInteger(record.bytes) || record.bytes < 0 || !Number.isSafeInteger(record.createdAt) || record.createdAt < 0 || !Number.isSafeInteger(record.expiresAt) || record.expiresAt < 0) throw new InvalidUploadIndexError("llm-deepseek: upload index contains an invalid record");
  return {
    scope: DeepSeekFileScope(record.scope),
    attachmentId: record.attachmentId,
    variantId: ImageVariantId(record.variantId),
    fileId: DeepSeekFileId(record.fileId),
    bytes: record.bytes,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt
  };
}
function parseIndex(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new InvalidUploadIndexError("llm-deepseek: upload index is not valid JSON", { cause: error });
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new InvalidUploadIndexError("llm-deepseek: upload index is not an object");
  const index = value;
  if (index.formatVersion !== 3 || !Array.isArray(index.records)) throw new InvalidUploadIndexError("llm-deepseek: unsupported upload index format");
  const records = index.records.map(parseRecord);
  const keys = /* @__PURE__ */ new Set();
  for (const record of records) {
    const key = `${record.scope}\0${record.variantId}`;
    if (keys.has(key)) throw new InvalidUploadIndexError("llm-deepseek: upload index contains duplicate mappings");
    keys.add(key);
  }
  return {
    formatVersion: 3,
    records
  };
}
function reusable(record, now, refreshMarginMs) {
  return record.expiresAt - now > refreshMarginMs;
}
var DeepSeekUploadIndex = class {
  /** Absolute owner-private JSON index path. */
  path;
  /**
  * @param path - explicit test path; omission uses `DSH_HOME/llm-deepseek/files-v3.json`.
  */
  constructor(path = join(resolveDshHome(), "llm-deepseek", "files-v3.json")) {
    this.path = path;
  }
  async load() {
    try {
      return parseIndex(await readFile(this.path, "utf8"));
    } catch (error) {
      if (absent(error) || error instanceof InvalidUploadIndexError) return {
        formatVersion: 3,
        records: []
      };
      throw error;
    }
  }
  async save(index) {
    await writeFileAtomic(this.path, `${JSON.stringify(index, void 0, 2)}
`, {
      mode: 384,
      dirMode: 448
    });
  }
  /**
  * Read one reusable mapping.
  * @param scope - endpoint/API-key namespace.
  * @param variantId - complete request-image transformation identity.
  * @param now - current Unix time in milliseconds.
  * @param refreshMarginMs - remaining lifetime below which a mapping is not reused.
  * @returns the mapping when it has enough lifetime remaining.
  */
  async get(scope, variantId, now, refreshMarginMs) {
    const record = (await this.load()).records.find((candidate) => candidate.scope === scope && candidate.variantId === variantId);
    return record !== void 0 && reusable(record, now, refreshMarginMs) ? record : void 0;
  }
  /**
  * Publish a completed upload unless another process already published a reusable mapping.
  * @param candidate - completed remote upload.
  * @param now - current Unix time in milliseconds.
  * @param refreshMarginMs - minimum reusable remaining lifetime.
  * @returns the winning record and whether the candidate entered the index.
  */
  async commit(candidate, now, refreshMarginMs) {
    await mkdir(dirname(this.path), {
      recursive: true,
      mode: 448
    });
    return withFileLock(this.path, async () => {
      const index = await this.load();
      const existing = index.records.find((record) => record.scope === candidate.scope && record.variantId === candidate.variantId && reusable(record, now, refreshMarginMs));
      if (existing !== void 0) return {
        record: existing,
        accepted: false
      };
      const records = index.records.filter((record) => reusable(record, now, refreshMarginMs) && !(record.scope === candidate.scope && record.variantId === candidate.variantId));
      records.push(candidate);
      await this.save({
        formatVersion: 3,
        records
      });
      return {
        record: candidate,
        accepted: true
      };
    });
  }
  /**
  * Remove one exact mapping without deleting a concurrently installed successor.
  * @param scope - endpoint/API-key namespace.
  * @param variantId - complete request-image transformation identity.
  * @param fileId - exact remote generation being invalidated.
  */
  async remove(scope, variantId, fileId) {
    await mkdir(dirname(this.path), {
      recursive: true,
      mode: 448
    });
    await withFileLock(this.path, async () => {
      const index = await this.load();
      const records = index.records.filter((record) => !(record.scope === scope && record.variantId === variantId && record.fileId === fileId));
      if (records.length !== index.records.length) await this.save({
        formatVersion: 3,
        records
      });
    });
  }
  /**
  * Remove every local mapping for one remote namespace.
  * @param scope - endpoint/API-key namespace.
  */
  async clear(scope) {
    await mkdir(dirname(this.path), {
      recursive: true,
      mode: 448
    });
    await withFileLock(this.path, async () => {
      const index = await this.load();
      const records = index.records.filter((record) => record.scope !== scope);
      if (records.length !== index.records.length) await this.save({
        formatVersion: 3,
        records
      });
    });
  }
};
var MAX_IMAGE_BYTES = 32 * 1024 * 1024;
var OWNED_FILE_PREFIX = "dsh-";
function fileScope(connection) {
  return deepSeekFileScope(connection.protocol === "messages" ? messagesApiRoot(connection.baseURL) : connection.baseURL, connection.apiKey);
}
function abortReason(signal) {
  const reason = signal.reason;
  return reason instanceof Error ? reason : new Error("DeepSeek file upload cancelled with a non-Error reason.", { cause: reason });
}
function uploadFailure(error) {
  return error instanceof Error ? error : new Error("DeepSeek file upload failed with a non-Error reason.", { cause: error });
}
function waitForUpload(operation, signal) {
  signal?.throwIfAborted();
  operation.waiters += 1;
  let released = false;
  const release = (cancelledReason) => {
    if (released) return;
    released = true;
    operation.waiters -= 1;
    if (cancelledReason !== void 0 && operation.waiters === 0 && !operation.settled) operation.controller.abort(cancelledReason);
  };
  if (signal === void 0) return operation.promise.finally(() => {
    release();
  });
  return new Promise((resolve, reject) => {
    const abort = () => {
      const reason = abortReason(signal);
      release(reason);
      reject(reason);
    };
    signal.addEventListener("abort", abort, { once: true });
    operation.promise.then((value) => {
      signal.removeEventListener("abort", abort);
      release();
      resolve(value);
    }, (error) => {
      signal.removeEventListener("abort", abort);
      release();
      reject(uploadFailure(error));
    });
  });
}
function extension(mediaType) {
  switch (mediaType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpeg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
  }
}
function filename(version) {
  return `${OWNED_FILE_PREFIX}${String(version.attachment.attachmentId).slice(7, 23)}-${String(version.variantId).slice(7, 15)}.${extension(version.mediaType)}`;
}
var DeepSeekFileStore = class {
  index;
  now;
  fetchImpl;
  inflight = /* @__PURE__ */ new Map();
  /**
  * @param options - testable index, clock, and transport boundaries.
  */
  constructor(options = {}) {
    this.index = options.index ?? new DeepSeekUploadIndex();
    this.now = options.now ?? Date.now;
    this.fetchImpl = options.fetch;
  }
  client(connection) {
    return new DeepSeekFilesClient({
      baseURL: connection.baseURL,
      apiKey: connection.apiKey,
      protocol: connection.protocol,
      ...this.fetchImpl === void 0 ? {} : { fetch: this.fetchImpl }
    });
  }
  /**
  * Resolve or upload one deterministic request image. Concurrent calls share one upload while retaining independent waits.
  * @param version - deterministic model-request bytes and complete transformation identity.
  * @param connection - endpoint and API-key snapshot.
  * @param policy - expiry and quota-recovery policy.
  * @param signal - cancellation of this wait; shared transport stops when no waiter remains.
  * @returns a reusable file id and whether this call published a new upload.
  */
  ensureUploaded(version, connection, policy, signal) {
    signal?.throwIfAborted();
    const key = `${fileScope(connection)}\0${version.variantId}`;
    let active = this.inflight.get(key);
    if (active?.controller.signal.aborted) {
      this.inflight.delete(key);
      active = void 0;
    }
    if (active !== void 0) return waitForUpload(active, signal);
    const controller = new AbortController();
    const shared = {
      controller,
      settled: false,
      waiters: 0,
      promise: void 0
    };
    shared.promise = this.ensureUploadedOnce(version, connection, policy, controller.signal).then((value) => {
      shared.settled = true;
      return value;
    }, (error) => {
      shared.settled = true;
      throw uploadFailure(error);
    });
    this.inflight.set(key, shared);
    shared.promise.finally(() => {
      if (this.inflight.get(key) === shared) this.inflight.delete(key);
    }).catch(() => {
    });
    return waitForUpload(shared, signal);
  }
  async ensureUploadedOnce(version, connection, policy, signal) {
    if (version.bytes > 33554432) throw new LlmError("DeepSeek image exceeds the 32 MiB per-image limit.", "INVALID_REQUEST");
    const scope = fileScope(connection);
    const now = this.now();
    const marginMs = policy.refreshMarginSeconds * 1e3;
    const cached = await this.index.get(scope, version.variantId, now, marginMs);
    if (cached !== void 0) return {
      record: cached,
      uploaded: false
    };
    const client = this.client(connection);
    const upload = async () => {
      const remote = await client.upload({
        data: version.data,
        mediaType: version.mediaType,
        filename: filename(version),
        expiresAfterSeconds: policy.expiresAfterSeconds,
        signal
      });
      if (remote.bytes !== version.data.byteLength) throw new LlmError("DeepSeek Files API upload response does not match the submitted image.", "INVALID_RESPONSE");
      return {
        scope,
        attachmentId: version.attachment.attachmentId,
        variantId: version.variantId,
        fileId: remote.id,
        bytes: remote.bytes,
        createdAt: remote.createdAt * 1e3,
        expiresAt: remote.expiresAt * 1e3
      };
    };
    let candidate;
    try {
      candidate = await upload();
    } catch (error) {
      if (!isFilesQuotaError(error)) throw error;
      if (await this.reclaimOldestOwned(connection, policy.quotaCleanupBatch, signal) === 0) throw error;
      candidate = await upload();
    }
    const committed = await this.index.commit(candidate, this.now(), marginMs);
    if (!committed.accepted) try {
      await client.delete(candidate.fileId, signal);
    } catch {
    }
    return {
      record: committed.record,
      uploaded: committed.accepted
    };
  }
  /**
  * Invalidate one exact local mapping after a model request rejects its remote id.
  * @param version - request-image version whose remote generation failed.
  * @param fileId - exact rejected file id.
  * @param connection - endpoint and API-key snapshot.
  */
  async invalidate(version, fileId, connection) {
    await this.index.remove(fileScope(connection), version.variantId, fileId);
  }
  /**
  * Delete the indexed remote file for one attachment and remove its local mapping.
  * @param version - exact request-image version to release.
  * @param connection - endpoint and API-key snapshot.
  * @param policy - expiry policy used to locate a reusable mapping.
  * @param signal - request cancellation.
  * @returns whether an indexed file existed and was deleted.
  */
  async release(version, connection, policy, signal) {
    const scope = fileScope(connection);
    const record = await this.index.get(scope, version.variantId, this.now(), policy.refreshMarginSeconds * 1e3);
    if (record === void 0) return false;
    await this.client(connection).delete(record.fileId, signal);
    await this.index.remove(scope, version.variantId, record.fileId);
    return true;
  }
  /**
  * Delete the oldest provider files whose names identify harness ownership.
  * @param connection - endpoint and API-key snapshot.
  * @param count - positive maximum number of files to delete.
  * @param signal - request cancellation.
  * @returns number of successfully deleted files.
  */
  async reclaimOldestOwned(connection, count, signal) {
    const client = this.client(connection);
    let after;
    const owned = [];
    while (connection.protocol === "messages" || owned.length < count) {
      const page = await client.list({
        ...after === void 0 ? {} : { after },
        limit: 1e3,
        order: "asc",
        ...signal === void 0 ? {} : { signal }
      });
      for (const file of page.data) {
        if (!file.filename.startsWith(OWNED_FILE_PREFIX)) continue;
        owned.push({
          id: file.id,
          createdAt: file.createdAt
        });
        if (connection.protocol === "chat-completions" && owned.length === count) break;
      }
      if (connection.protocol === "messages") {
        owned.sort((left, right) => left.createdAt - right.createdAt);
        owned.splice(count);
      }
      if (!page.hasMore || page.lastId === void 0 || page.lastId === after) break;
      after = page.lastId;
    }
    for (const file of owned) await client.delete(file.id, signal);
    return owned.length;
  }
  /**
  * Delete every remote harness-owned file in the active API-key namespace and clear its index.
  * @param connection - endpoint and API-key snapshot.
  * @param signal - request cancellation.
  * @returns number of deleted files.
  */
  async releaseAll(connection, signal) {
    let total = 0;
    for (; ; ) {
      const deleted = await this.reclaimOldestOwned(connection, 1e3, signal);
      total += deleted;
      if (deleted < 1e3) break;
    }
    await this.index.clear(fileScope(connection));
    return total;
  }
};
function bounds(connection, representation) {
  return {
    representation,
    maxBytes: representation === "raw" ? connection.maxRequestFilesBytes : connection.maxInlineRequestImageBytes,
    maxImages: connection.maxImagesPerRequest,
    byteQuantum: representation === "raw" ? connection.imageOffloadByteQuantum : connection.inlineImageOffloadByteQuantum,
    countQuantum: connection.imageOffloadCountQuantum
  };
}
function* imageRefs(blocks) {
  for (const block of blocks) if (block.type === "image") yield block.attachment;
  else if (block.type === "tool-result") yield* imageRefs(block.content);
}
async function prepareImages(history, connection, modelId, attachments, access, signal) {
  const versions = /* @__PURE__ */ new Map();
  const messages = projectOffloadedImages(history, (ref) => offloadedImageText(ref, access(ref)));
  if (!messages.some((message) => contentHasImage(message.content))) return {
    messages,
    versions
  };
  const model = connection.models.find((entry) => entry.id === modelId);
  if (model?.inputModalities?.includes("image") !== true || attachments === void 0) throw new LlmError("DeepSeek Messages image input requires a vision model and attachment service", "UNSUPPORTED_CONTENT");
  if (messages.some((message) => message.role !== "user" && contentHasImage(message.content))) throw new LlmError("DeepSeek Messages supports images only in user messages and tool results", "UNSUPPORTED_CONTENT");
  for (const message of messages) for (const ref of imageRefs(message.content)) if (!versions.has(ref.attachmentId)) versions.set(ref.attachmentId, await attachments.readImageRequest(ref, resolveRequestImageTarget(model, ref), signal));
  assertImagesFit(messages, versions, connection, "raw");
  return {
    messages,
    versions
  };
}
function inlineImages(messages, versions, connection) {
  assertImagesFit(messages, versions, connection, "base64");
  return messages;
}
function assertImagesFit(messages, versions, connection, representation) {
  const offloadImages = requiredImageOffload(messages, bounds(connection, representation), (block) => versions.get(block.attachment.attachmentId).bytes);
  if (offloadImages > 0) throw new LlmError(`DeepSeek Messages ${representation} request images exceed the route budget; ${offloadImages} more oldest occurrence(s) must be offloaded.`, IMAGE_OFFLOAD_REQUIRED_CODE, { offloadImages });
}
async function prepareFileIds(messages, versions, files) {
  const ids = /* @__PURE__ */ new Map();
  for (const [index, message] of messages.entries()) {
    let image = 0;
    for (const ref of imageRefs(message.content)) {
      const version = versions.get(ref.attachmentId);
      ids.set(ref.attachmentId, await files.resolve(version, {
        message: index + 1,
        image: ++image
      }));
    }
  }
  return ids;
}
function object(value, code = "MALFORMED_RESPONSE") {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new LlmError("DeepSeek Messages expected a JSON object", code);
  return value;
}
function replayState(model, blocks) {
  return {
    response: {
      kind: "deepseek-messages",
      version: 1,
      model
    },
    blocks
  };
}
function readReplay(message, model, onDegrade) {
  try {
    return validateReplay(message, model);
  } catch (error) {
    if (!(error instanceof LlmError) || error.code !== "INVALID_REPLAY_STATE") throw error;
    onDegrade?.(error.message);
    return;
  }
}
function validateReplay(message, model) {
  if (message.source.kind !== "model" || message.source.replayState === void 0) return void 0;
  const fail = (detail) => {
    throw new LlmError(`DeepSeek Messages replay: ${detail}`, "INVALID_REPLAY_STATE");
  };
  const envelope = object(message.source.replayState, "INVALID_REPLAY_STATE");
  const response = object(envelope.response, "INVALID_REPLAY_STATE");
  if (response.kind !== "deepseek-messages" || response.version !== 1) return fail("unsupported kind or version");
  if (response.model !== message.source.model) return fail("model does not match assistant source model");
  if (!Array.isArray(envelope.blocks) || envelope.blocks.length !== message.content.length) return fail("block count mismatch");
  const blocks = envelope.blocks.map((value, index) => {
    const block = object(value, "INVALID_REPLAY_STATE");
    if (block.type !== message.content[index]?.type || ![
      "text",
      "reasoning",
      "tool-call"
    ].includes(String(block.type))) return fail("block type mismatch");
    if (block.signature !== void 0 && (block.type !== "reasoning" || typeof block.signature !== "string")) return fail("invalid signature");
    return block;
  });
  return response.model === model ? blocks : void 0;
}
function unsupported(type) {
  throw new LlmError(`DeepSeek Messages cannot represent ${type}`, "UNSUPPORTED_CONTENT");
}
function toolInput(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch (_invalidToolHistoryJson) {
    return {};
  }
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function assistant(message, model, onReplayDegrade) {
  const replay = readReplay(message, model, onReplayDegrade);
  return message.content.map((block, index) => {
    switch (block.type) {
      case "text":
        return {
          type: "text",
          text: block.text
        };
      case "reasoning":
        return {
          type: "thinking",
          thinking: block.text,
          ...replay?.[index]?.signature === void 0 ? {} : { signature: replay[index].signature }
        };
      case "tool-call":
        return {
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: toolInput(block.arguments)
        };
      default:
        return unsupported(`assistant content ${block.type}`);
    }
  });
}
function serialize(options, connection, history, images, access, onReplayDegrade, fileIds) {
  const model = connection.models.find((entry) => entry.id === options.model);
  const inHistory = model?.systemPromptUpdate === "in-history";
  const input = (blocks) => blocks.flatMap((block) => {
    if (block.type === "text") return block.text ? [{
      type: "text",
      text: block.text
    }] : [];
    if (block.type !== "image") return unsupported(`user/tool-result content ${block.type}`);
    const version = images.get(block.attachment.attachmentId);
    if (version === void 0) throw new LlmError("DeepSeek Messages request image is missing", "INVALID_REQUEST");
    const fileId = fileIds?.get(block.attachment.attachmentId);
    if (fileIds !== void 0 && fileId === void 0) throw new LlmError("DeepSeek Messages request file id is missing", "INVALID_REQUEST");
    return [{
      type: "text",
      text: requestImageHandleText(block.attachment, version, access(block.attachment))
    }, fileId === void 0 ? {
      type: "image",
      source: {
        type: "base64",
        media_type: version.mediaType,
        data: Buffer.from(version.data).toString("base64")
      }
    } : {
      type: "image",
      source: {
        type: "file",
        file_id: fileId
      }
    }];
  });
  const messages = [];
  let historySystem;
  const systemUpdates = [];
  const flushSystemUpdates = () => {
    if (systemUpdates.length === 0) return;
    if (messages.at(-1)?.role !== "user") return unsupported("system update without a preceding user or tool-result turn");
    messages.push(...systemUpdates.splice(0));
  };
  for (const message of history) {
    if (message.role === "system") {
      const texts = message.content.filter((block) => block.type === "text");
      if (texts.length !== message.content.length) return unsupported("non-text system message");
      const text = texts.map((block) => block.text).join("");
      if (inHistory && messages.length > 0) {
        if (text.length === 0) return unsupported("empty in-history system update");
        systemUpdates.push({
          role: "system",
          content: [{
            type: "text",
            text
          }]
        });
      } else historySystem = text;
      continue;
    }
    if (message.role === "assistant") flushSystemUpdates();
    const content = message.role === "assistant" ? assistant(message, options.model, onReplayDegrade) : message.content.flatMap((block) => {
      if (block.type !== "tool-result") return input([block]);
      return [{
        type: "tool_result",
        tool_use_id: block.toolCallId,
        content: input(block.content),
        ...block.isError === void 0 ? {} : { is_error: block.isError }
      }];
    });
    const previous = messages.at(-1);
    if (previous?.role === message.role) previous.content.push(...content);
    else messages.push({
      role: message.role,
      content
    });
  }
  flushSystemUpdates();
  let pending = /* @__PURE__ */ new Set();
  for (const message of messages) if (message.role === "assistant") {
    const calls = message.content.filter((block) => block.type === "tool_use");
    pending = new Set(calls.map((block) => block.id));
    if (pending.size !== calls.length) throw new LlmError("DeepSeek Messages duplicate tool call id", "INVALID_REQUEST");
  } else if (message.role === "user") {
    const results = message.content.filter((block) => block.type === "tool_result");
    for (const result of results) if (!pending.delete(result.tool_use_id)) throw new LlmError("DeepSeek Messages tool result has no matching call", "INVALID_REQUEST");
    if (pending.size > 0) throw new LlmError("DeepSeek Messages tool calls need immediate results", "INVALID_REQUEST");
    message.content = [...results, ...message.content.filter((block) => block.type !== "tool_result")];
  }
  if (pending.size > 0) throw new LlmError("DeepSeek Messages history ends with unresolved tools", "INVALID_REQUEST");
  const effort = options.purpose === "session-title" ? "off" : options.reasoningEffort ?? connection.defaults.reasoningEffort ?? (connection.defaults.thinking === "disabled" ? "off" : "high");
  if (![
    "off",
    "low",
    "high",
    "max"
  ].includes(effort) || connection.defaults.thinking === "disabled" && effort !== "off") throw new LlmError(`DeepSeek Messages does not support reasoning effort ${effort}`, "UNSUPPORTED_REASONING_EFFORT");
  const system = [options.system, historySystem].filter(Boolean).join("\n\n");
  return {
    model: options.model,
    stream: true,
    messages,
    max_tokens: options.maxTokens ?? model?.maxTokens ?? connection.maxTokens,
    thinking: { type: effort === "off" ? "disabled" : "enabled" },
    ...effort === "off" ? {} : { output_config: { effort } },
    ...system.length === 0 ? {} : { system },
    ...options.temperature === void 0 ? {} : { temperature: options.temperature },
    ...options.stop === void 0 ? {} : { stop_sequences: options.stop },
    ...options.tools === void 0 ? {} : { tools: options.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    })) }
  };
}
function providerErrorDetail(raw) {
  const error = typeof raw === "object" && raw !== null && "error" in raw ? raw.error : void 0;
  if (typeof error !== "object" || error === null) return "";
  const fields = error;
  return [
    fields.code,
    fields.type,
    fields.message
  ].filter((value) => typeof value === "string").join(" ");
}
function providerError(raw, status, headers) {
  const envelope = typeof raw === "object" && raw !== null ? raw : {};
  const error = typeof envelope.error === "object" && envelope.error !== null ? envelope.error : {};
  const message = typeof error.message === "string" ? error.message : `DeepSeek Messages request failed (${status ?? "stream error"})`;
  const type = typeof error.type === "string" ? error.type : "";
  const detail = `${type} ${typeof error.code === "string" ? error.code : ""} ${message}`;
  let code;
  if (status === 401 || status === 403 || ["authentication_error", "permission_error"].includes(type)) code = "AUTH";
  else if (isQuotaExceededError(detail) || status === 402) code = "QUOTA";
  else if (status === 429 || type === "rate_limit_error") code = "RATE_LIMIT";
  else if (isContextWindowExceededError(detail)) code = "CONTEXT_WINDOW_EXCEEDED";
  else if (status === 400 || status === 413 || type === "invalid_request_error") code = "INVALID_REQUEST";
  else if (status !== void 0 && status >= 500 || ["api_error", "overloaded_error"].includes(type)) code = "SERVER";
  else code = status === void 0 ? "SERVER" : `HTTP_${status}`;
  const retry = headers?.get("retry-after");
  const delay = retry == null ? NaN : /^\d+(?:\.\d+)?$/u.test(retry) ? Number(retry) * 1e3 : Date.parse(retry) - Date.now();
  const id = headers?.get("request-id") ?? headers?.get("x-request-id") ?? headers?.get("x-deepseek-request-id");
  return new LlmError(message, code, {
    ...status === void 0 ? {} : { status },
    ...id ? { requestId: ProviderRequestId(id) } : {},
    ...Number.isFinite(delay) && delay > 0 ? { providerRetryAfterMs: delay } : {}
  });
}
async function* parseSse(body, activity) {
  const events = body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream({ onComment: activity }));
  for await (const frame of events) {
    activity();
    let raw;
    try {
      raw = JSON.parse(frame.data);
    } catch (_invalidSseJson) {
      throw new LlmError("DeepSeek Messages SSE contains invalid JSON", "MALFORMED_RESPONSE");
    }
    const event = object(raw);
    if (typeof event.type !== "string" || frame.event !== void 0 && frame.event !== event.type) throw new LlmError("DeepSeek Messages SSE event type mismatch", "MALFORMED_RESPONSE");
    if (event.type === "error") throw providerError(event, void 0);
    yield event;
  }
}
function string(value) {
  if (typeof value !== "string") throw new LlmError("DeepSeek Messages expected a string field", "MALFORMED_RESPONSE");
  return value;
}
function malformed(detail) {
  throw new LlmError(`DeepSeek Messages stream: ${detail}`, "MALFORMED_RESPONSE");
}
function indexOf(event) {
  if (!Number.isSafeInteger(event.index) || event.index < 0) return malformed("invalid block index");
  return event.index;
}
function updateUsage(usage, raw) {
  const fields = object(raw);
  for (const [wire, local] of Object.entries({
    input_tokens: "inputTokens",
    output_tokens: "outputTokens",
    cache_read_input_tokens: "cacheReadTokens",
    cache_creation_input_tokens: "cacheWriteTokens"
  })) {
    const value = fields[wire];
    if (value === void 0) continue;
    if (!Number.isSafeInteger(value) || value < 0) return malformed(`invalid ${wire}`);
    usage[local] = value;
  }
}
function startBlock(event, index) {
  const native = object(event.content_block);
  let content;
  let replay;
  switch (native.type) {
    case "text":
      content = {
        type: "text",
        text: string(native.text)
      };
      replay = { type: "text" };
      break;
    case "thinking":
      content = {
        type: "reasoning",
        text: string(native.thinking)
      };
      replay = {
        type: "reasoning",
        ...native.signature === void 0 ? {} : { signature: string(native.signature) }
      };
      break;
    case "tool_use":
      content = {
        type: "tool-call",
        id: ToolCallId(string(native.id)),
        name: string(native.name),
        arguments: JSON.stringify(object(native.input))
      };
      if (!content.id || !content.name) return malformed("empty tool identity");
      replay = { type: "tool-call" };
      break;
    default:
      throw new LlmError(`DeepSeek Messages does not support response block ${String(native.type)}`, "UNSUPPORTED_CONTENT");
  }
  return {
    index,
    content,
    replay,
    closed: false,
    json: ""
  };
}
function deltaChunk(block, raw) {
  const delta = object(raw);
  const content = block.content;
  if (delta.type === "text_delta" && content.type === "text") {
    const text = string(delta.text);
    content.text += text;
    return {
      type: "text-delta",
      index: block.index,
      text
    };
  }
  if (delta.type === "thinking_delta" && content.type === "reasoning") {
    const text = string(delta.thinking);
    content.text += text;
    return {
      type: "reasoning-delta",
      index: block.index,
      text
    };
  }
  if (delta.type === "signature_delta" && content.type === "reasoning") {
    block.replay.signature = (block.replay.signature ?? "") + string(delta.signature);
    return;
  }
  if (delta.type === "input_json_delta" && content.type === "tool-call") {
    const argumentsDelta = string(delta.partial_json);
    block.json += argumentsDelta;
    return {
      type: "tool-call-delta",
      index: block.index,
      id: content.id,
      argumentsDelta
    };
  }
  return malformed(`unsupported delta ${String(delta.type)} for ${content.type}`);
}
function stopReason(raw) {
  switch (raw) {
    case "end_turn":
    case "stop_sequence":
      return { kind: "stop" };
    case "tool_use":
      return { kind: "tool-calls" };
    case "max_tokens":
      return { kind: "max-tokens" };
    default:
      return malformed(`unsupported stop reason ${String(raw)}`);
  }
}
async function* translate(events, model) {
  const blocks = /* @__PURE__ */ new Map();
  const usage = {
    inputTokens: 0,
    outputTokens: 0
  };
  let started = false;
  let reason;
  for await (const event of events) {
    if (event.type === "message_start") {
      if (started) return malformed("duplicate message_start");
      updateUsage(usage, object(event.message).usage);
      started = true;
      continue;
    }
    if (![
      "content_block_start",
      "content_block_delta",
      "content_block_stop",
      "message_delta",
      "message_stop"
    ].includes(String(event.type))) continue;
    if (!started) return malformed("event precedes message_start");
    if (event.type === "content_block_start") {
      const wireIndex = indexOf(event);
      if (blocks.has(wireIndex) || reason !== void 0) return malformed("block starts after settlement or repeats an index");
      const block = startBlock(event, blocks.size);
      blocks.set(wireIndex, block);
      yield {
        type: "block-start",
        index: block.index,
        blockType: block.content.type
      };
      if (block.content.type === "text" || block.content.type === "reasoning") {
        if (block.content.text) yield {
          type: block.content.type === "text" ? "text-delta" : "reasoning-delta",
          index: block.index,
          text: block.content.text
        };
      } else yield {
        type: "tool-call-delta",
        index: block.index,
        id: block.content.id,
        name: block.content.name,
        argumentsDelta: ""
      };
    } else if (event.type === "content_block_delta" || event.type === "content_block_stop") {
      const block = blocks.get(indexOf(event));
      if (block === void 0 || block.closed) return malformed("delta/stop without an open block");
      if (event.type === "content_block_delta") {
        const chunk = deltaChunk(block, event.delta);
        if (chunk !== void 0) yield chunk;
      } else {
        block.closed = true;
        if (block.content.type === "tool-call" && block.json.length > 0) block.content.arguments = block.json;
        yield {
          type: "block-end",
          index: block.index,
          block: { ...block.content }
        };
      }
    } else if (event.type === "message_delta") {
      const delta = object(event.delta);
      if (delta.stop_reason != null) reason = stopReason(delta.stop_reason);
      if (event.usage !== void 0) updateUsage(usage, event.usage);
    } else {
      if (reason === void 0 || [...blocks.values()].some((block) => !block.closed)) return malformed("message_stop without settled blocks and stop reason");
      if (blocks.size === 0 && reason.kind === "stop") throw new LlmError("DeepSeek Messages returned no content", "EMPTY_RESPONSE");
      if (reason.kind !== "max-tokens") for (const { content } of blocks.values()) {
        if (content.type !== "tool-call") continue;
        let parsed;
        try {
          parsed = JSON.parse(content.arguments);
        } catch (_invalidProviderToolJson) {
          return malformed("tool input is invalid JSON");
        }
        object(parsed);
      }
      usage.totalTokens = usage.inputTokens + usage.outputTokens + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
      yield {
        type: "usage",
        usage
      };
      yield {
        type: "finish",
        reason,
        replayState: replayState(model, [...blocks.values()].map((block) => block.replay))
      };
      return;
    }
  }
  throw new LlmError("DeepSeek Messages stream ended before message_stop", "STREAM_CLOSED");
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
var DeepSeekMessagesAdapter = class extends LlmAdapter {
  dependencies;
  constructor(dependencies) {
    super();
    this.dependencies = dependencies;
  }
  providerInfo(provider) {
    return {
      id: provider,
      name: "DeepSeek"
    };
  }
  providerRetryPolicy(_provider) {
    return this.dependencies.connection().retryPolicy;
  }
  listModels(provider) {
    const connection = this.dependencies.connection();
    return Promise.resolve(connection.models.map((model) => catalogModelInfo(provider, model)));
  }
  resolveModel(provider, model) {
    return Promise.resolve(modelInfo(this.dependencies.connection(), provider, model));
  }
  imageRequestPricing(_provider, model) {
    return deepSeekImageRequestPricing(this.dependencies.connection(), model, this.dependencies.imageAccess);
  }
  prepareCall(provider, model) {
    const connection = this.dependencies.connection();
    return Promise.resolve({
      model: modelInfo(connection, provider, model),
      stream: (options) => this.generate(options, connection)
    });
  }
  stream(options) {
    return this.generate(options, this.dependencies.connection());
  }
  async *generate(options, connection) {
    const env_1 = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      const consumer = new AbortController();
      const watchdog = __addDisposableResource(env_1, idleWatchdog(options.signal === void 0 ? consumer.signal : AbortSignal.any([consumer.signal, options.signal]), connection.streamIdleTimeoutMs, "MESSAGES_IDLE"), false);
      const iterator = this.request(options, connection, watchdog.signal, () => {
        watchdog.pulse();
      });
      try {
        while (true) {
          const next = await watchdog.next(iterator);
          if (next.done) return;
          yield next.value;
        }
      } catch (error) {
        if (timeoutOf(watchdog.signal, "MESSAGES_IDLE") !== void 0) throw new LlmError("DeepSeek Messages stream idle timeout", "TIMEOUT", { cause: error });
        if (options.signal?.aborted) throw new LlmError("DeepSeek Messages request aborted", "ABORTED", { cause: error });
        if (error instanceof LlmError) throw error;
        throw new LlmError("DeepSeek Messages transport failed", "TRANSPORT", { cause: error });
      } finally {
        consumer.abort();
        try {
          await iterator.return(void 0);
        } catch (_abortedRequestCleanup) {
        }
      }
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources(env_1);
    }
  }
  async *request(options, connection, signal, activity) {
    signal.throwIfAborted();
    const { messages, versions } = await prepareImages(options.messages, connection, options.model, this.dependencies.attachments(), this.dependencies.imageAccess, signal);
    const key = await this.dependencies.apiKey(connection);
    const files = new RequestFiles(this.dependencies.files(), {
      baseURL: connection.baseURL,
      apiKey: key,
      protocol: "messages"
    }, connection.filePolicy, connection.filesApiTimeoutMs, signal, activity);
    let inline = false;
    while (true) {
      signal.throwIfAborted();
      files.beginAttempt();
      let fileIds;
      if (!inline) try {
        fileIds = await prepareFileIds(messages, versions, files);
      } catch (error) {
        if (!(error instanceof FileResolutionFailure)) throw error;
        inline = true;
        continue;
      }
      const extensions = await prepareRequestExtensions(serialize(options, connection, inline ? inlineImages(messages, versions, connection) : messages, versions, this.dependencies.imageAccess, (reason) => {
        this.dependencies.onReplayDegrade?.({
          provider: options.provider,
          model: options.model,
          reason
        });
      }, fileIds), {
        signal,
        ...options.sessionId === void 0 ? {} : { sessionId: String(options.sessionId) },
        ...options.purpose === void 0 ? {} : { purpose: options.purpose }
      }, this.dependencies.prepareExtensions);
      signal.throwIfAborted();
      const response = await fetch(`${messagesApiRoot(connection.baseURL)}/messages`, {
        method: "POST",
        signal,
        body: extensions.payload,
        redirect: "error",
        headers: {
          ...attributionHeaders(),
          "content-type": "application/json",
          "accept": "text/event-stream",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          ...fileIds === void 0 || fileIds.size === 0 ? {} : { "anthropic-beta": MESSAGES_FILES_BETA },
          "x-deepseek-harness-user-id": this.dependencies.userId(),
          ...options.sessionId === void 0 ? {} : { "x-deepseek-harness-session-id": String(options.sessionId) },
          ...options.purpose === "compaction" ? { "x-deepseek-harness-compact": "1" } : {}
        }
      });
      if (!response.ok) {
        const text = await response.text();
        let raw;
        try {
          raw = JSON.parse(text);
        } catch (_nonJsonGatewayError) {
        }
        const detail = providerErrorDetail(raw);
        if (await files.retry(detail)) continue;
        const failure = providerError(raw, response.status, response.headers);
        throw new LlmError(files.errorMessage(response.status, failure.message, detail), failure.code, {
          ...failure.failure,
          cause: new Error(text)
        });
      }
      await extensions.accept();
      if (response.body === null) throw new LlmError("DeepSeek Messages returned no response body", "EMPTY_RESPONSE");
      yield* translate(parseSse(response.body, activity), options.model);
      return;
    }
  }
};
var DeepSeekAdapter = class extends LlmAdapter {
  dependencies;
  files;
  constructor(dependencies) {
    super();
    this.dependencies = dependencies;
    this.files = dependencies.resolveFiles?.() ?? new DeepSeekFileStore();
  }
  implementation() {
    const connection = this.dependencies.options();
    switch (connection.protocol) {
      case "messages":
        return new DeepSeekMessagesAdapter({
          connection: () => connection,
          apiKey: this.dependencies.resolveApiKey,
          userId: this.dependencies.resolveUserId,
          attachments: () => this.dependencies.resolveAttachments?.(),
          imageAccess: (ref) => {
            const attachments = this.dependencies.resolveAttachments?.();
            return attachments === void 0 ? void 0 : this.dependencies.resolveImageAccess?.(attachments, ref);
          },
          files: () => this.files,
          prepareExtensions: this.dependencies.prepareExtensions,
          ...this.dependencies.onReplayDegrade === void 0 ? {} : { onReplayDegrade: this.dependencies.onReplayDegrade }
        });
      case "chat-completions":
        return new ChatCompletionsAdapter({
          ...this.dependencies,
          options: () => connection,
          resolveFiles: () => this.files
        });
      /* v8 ignore next -- protocol is validated at configuration resolution. */
      default:
        return assertNever(connection.protocol, "DeepSeek protocol");
    }
  }
  providerInfo(provider) {
    return this.implementation().providerInfo(provider);
  }
  providerRetryPolicy(provider) {
    return this.implementation().providerRetryPolicy(provider);
  }
  listModels(provider) {
    return this.implementation().listModels(provider);
  }
  resolveModel(provider, model, signal) {
    return this.implementation().resolveModel(provider, model, signal);
  }
  imageRequestPricing(provider, model) {
    return this.implementation().imageRequestPricing(provider, model);
  }
  prepareCall(provider, model, signal) {
    return this.implementation().prepareCall(provider, model, signal);
  }
  stream(options) {
    return this.implementation().stream(options);
  }
};
var DEFAULT_STREAM_IDLE_TIMEOUT_MS = 3e5;
var DEFAULT_CONTEXT_WINDOW = 1e6;
var DEFAULT_MAX_TOKENS = 256e3;
var DEFAULT_MAX_INLINE_REQUEST_IMAGE_BYTES = 20 * 1024 * 1024;
var DEFAULT_IMAGE_OFFLOAD_BYTE_QUANTUM = 64 * 1024 * 1024;
var DEFAULT_INLINE_IMAGE_OFFLOAD_BYTE_QUANTUM = 10 * 1024 * 1024;
var DEFAULT_IMAGE_OFFLOAD_COUNT_QUANTUM = 20;
var DEFAULT_FILE_EXPIRY_SECONDS = 10080 * 60;
var DEFAULT_FILE_REFRESH_MARGIN_SECONDS = 3600;
var DEFAULT_FILE_QUOTA_CLEANUP_BATCH = 100;
var DEFAULT_FILES_API_TIMEOUT_MS = 6e4;
var DEFAULT_MODELS = [{
  id: "deepseek-flash",
  name: "DeepSeek-V41-Flash",
  contextWindow: DEFAULT_CONTEXT_WINDOW,
  inputModalities: ["text", "image"],
  systemPromptUpdate: "in-history"
}, {
  id: "deepseek-v4-pro",
  name: "DeepSeek-V4-Pro",
  description: "Stronger agentic coding, knowledge, and difficult reasoning; suited to complex or quality-critical tasks at higher cost.",
  contextWindow: DEFAULT_CONTEXT_WINDOW
}];
var DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";
var MODEL_MODALITIES = ["text", "image"];
var catalogModel = z.object({
  id: z.string().required(),
  name: z.string(),
  description: z.string(),
  contextWindow: z.number().step(1).min(1),
  maxTokens: z.number().step(1).min(1),
  inputModalities: z.array(z.union(MODEL_MODALITIES)).min(1).default(["text"]),
  imagePixelBudget: z.union([z.number().step(1).min(1), "low"]),
  imageMaxBytes: z.number().step(1).min(1),
  systemPromptUpdate: z.const("in-history")
});
var Config = z.object({
  protocol: z.union(["chat-completions", "messages"]).default("messages"),
  apiKeyEnv: z.string().role("credential-ref").default(DEFAULT_API_KEY_ENV),
  baseURL: z.string(),
  thinking: z.union(["enabled", "disabled"]),
  reasoningEffort: z.union([
    "off",
    "low",
    "high",
    "max"
  ]),
  maxTokens: z.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_TOKENS),
  defaultContextWindow: z.number().step(1).min(1).default(DEFAULT_CONTEXT_WINDOW),
  models: z.array(catalogModel).default(DEFAULT_MODELS),
  streamIdleTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_STREAM_IDLE_TIMEOUT_MS),
  maxRequestFilesBytes: z.number().step(1).min(1).default(DEFAULT_MAX_REQUEST_FILES_BYTES),
  maxInlineRequestImageBytes: z.number().step(1).min(1).default(DEFAULT_MAX_INLINE_REQUEST_IMAGE_BYTES),
  maxImagesPerRequest: z.number().step(1).min(1).default(600),
  imageOffloadByteQuantum: z.number().step(1).min(1).default(DEFAULT_IMAGE_OFFLOAD_BYTE_QUANTUM),
  inlineImageOffloadByteQuantum: z.number().step(1).min(1).default(DEFAULT_INLINE_IMAGE_OFFLOAD_BYTE_QUANTUM),
  imageOffloadCountQuantum: z.number().step(1).min(1).default(20),
  filesApiTimeoutMs: z.number().min(Number.MIN_VALUE).max(MAX_TIMER_DELAY_MS).default(DEFAULT_FILES_API_TIMEOUT_MS),
  fileExpiresAfterSeconds: z.number().step(1).min(3600).max(2592e3).default(DEFAULT_FILE_EXPIRY_SECONDS),
  fileRefreshMarginSeconds: z.number().step(1).min(0).default(DEFAULT_FILE_REFRESH_MARGIN_SECONDS),
  fileQuotaCleanupBatch: z.number().step(1).min(1).max(1e3).default(100),
  retryPolicy: RetryPolicySchema
});
var PUBLIC_BASE_URL = "https://api.deepseek.com";
var MESSAGES_BASE_URL = "https://api.deepseek.com/anthropic";
var BASE_URL_ENV = "DEEPSEEK_BASE_URL";
function resolveModels(models) {
  const seen = /* @__PURE__ */ new Set();
  return (models ?? DEFAULT_MODELS).map((model) => {
    if (Object.hasOwn(model, "imageDetail")) throw new Error("llm-deepseek: catalog model imageDetail is no longer supported; use imagePixelBudget");
    if (model.id.length === 0) throw new Error("llm-deepseek: catalog model ids must be non-empty");
    if (model.name !== void 0 && model.name.length === 0) throw new Error(`llm-deepseek: catalog model "${model.id}" has an empty name`);
    if (model.contextWindow !== void 0 && (!Number.isInteger(model.contextWindow) || model.contextWindow <= 0)) throw new Error(`llm-deepseek: catalog model "${model.id}" contextWindow must be a positive integer`);
    if (model.maxTokens !== void 0 && (!Number.isInteger(model.maxTokens) || model.maxTokens <= 0)) throw new Error(`llm-deepseek: catalog model "${model.id}" maxTokens must be a positive integer`);
    const inputModalities = model.inputModalities ?? ["text"];
    if (inputModalities.length === 0) throw new Error(`llm-deepseek: catalog model "${model.id}" inputModalities must not be empty`);
    if (inputModalities.some((modality) => !MODEL_MODALITIES.includes(modality))) throw new Error(`llm-deepseek: catalog model "${model.id}" inputModalities must contain only "text" and "image"`);
    if (new Set(inputModalities).size !== inputModalities.length) throw new Error(`llm-deepseek: catalog model "${model.id}" inputModalities must not contain duplicates`);
    const hasImage = inputModalities.includes("image");
    if (!hasImage && (model.imagePixelBudget !== void 0 || model.imageMaxBytes !== void 0)) throw new Error(`llm-deepseek: text-only catalog model "${model.id}" cannot declare image request limits`);
    if (model.imagePixelBudget !== void 0 && model.imagePixelBudget !== "low" && (!Number.isSafeInteger(model.imagePixelBudget) || model.imagePixelBudget <= 0)) throw new Error(`llm-deepseek: catalog model "${model.id}" imagePixelBudget must be "low" or a positive safe integer`);
    if (model.imageMaxBytes !== void 0 && (!Number.isSafeInteger(model.imageMaxBytes) || model.imageMaxBytes <= 0)) throw new Error(`llm-deepseek: catalog model "${model.id}" imageMaxBytes must be a positive safe integer`);
    const systemPromptUpdate = model.systemPromptUpdate;
    if (systemPromptUpdate !== void 0 && systemPromptUpdate !== "in-history") throw new Error(`llm-deepseek: catalog model "${model.id}" systemPromptUpdate must be "in-history" when present`);
    if (seen.has(model.id)) throw new Error(`llm-deepseek: duplicate catalog model "${model.id}"`);
    seen.add(model.id);
    return {
      id: model.id,
      ...model.name === void 0 ? {} : { name: model.name },
      ...model.description === void 0 ? {} : { description: model.description },
      ...model.contextWindow === void 0 ? {} : { contextWindow: model.contextWindow },
      ...model.maxTokens === void 0 ? {} : { maxTokens: model.maxTokens },
      ...model.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: model.systemPromptUpdate },
      inputModalities: [...inputModalities],
      ...hasImage ? {
        ...model.imagePixelBudget === void 0 ? {} : { imagePixelBudget: model.imagePixelBudget },
        imageMaxBytes: model.imageMaxBytes ?? 2097152
      } : {}
    };
  });
}
function resolveAdapterOptions(config, environment) {
  const protocol = config.protocol ?? "messages";
  if (protocol !== "chat-completions" && protocol !== "messages") throw new Error("llm-deepseek: protocol must be chat-completions or messages");
  if (config.thinking === "disabled" && config.reasoningEffort !== void 0 && config.reasoningEffort !== "off") throw new Error('llm-deepseek: only reasoningEffort "off" can be configured when thinking is disabled');
  if (config.defaultContextWindow !== void 0 && (!Number.isInteger(config.defaultContextWindow) || config.defaultContextWindow <= 0)) throw new Error("llm-deepseek: defaultContextWindow must be a positive integer");
  if (config.maxTokens !== void 0 && (!Number.isSafeInteger(config.maxTokens) || config.maxTokens <= 0)) throw new Error("llm-deepseek: maxTokens must be a positive safe integer");
  const streamIdleTimeoutMs = config.streamIdleTimeoutMs ?? 3e5;
  if (!Number.isFinite(streamIdleTimeoutMs) || streamIdleTimeoutMs <= 0 || streamIdleTimeoutMs > MAX_TIMER_DELAY_MS) throw new Error(`llm-deepseek: streamIdleTimeoutMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  const maxRequestFilesBytes = config.maxRequestFilesBytes ?? 134217728;
  if (!Number.isSafeInteger(maxRequestFilesBytes) || maxRequestFilesBytes <= 0) throw new Error("llm-deepseek: maxRequestFilesBytes must be a positive safe integer");
  const maxInlineRequestImageBytes = config.maxInlineRequestImageBytes ?? 20971520;
  if (!Number.isSafeInteger(maxInlineRequestImageBytes) || maxInlineRequestImageBytes <= 0) throw new Error("llm-deepseek: maxInlineRequestImageBytes must be a positive safe integer");
  const maxImagesPerRequest = config.maxImagesPerRequest ?? 600;
  if (!Number.isSafeInteger(maxImagesPerRequest) || maxImagesPerRequest <= 0) throw new Error("llm-deepseek: maxImagesPerRequest must be a positive safe integer");
  const imageOffloadByteQuantum = config.imageOffloadByteQuantum ?? 67108864;
  if (!Number.isSafeInteger(imageOffloadByteQuantum) || imageOffloadByteQuantum <= 0) throw new Error("llm-deepseek: imageOffloadByteQuantum must be a positive safe integer");
  if (imageOffloadByteQuantum > maxRequestFilesBytes) throw new Error("llm-deepseek: imageOffloadByteQuantum must not exceed maxRequestFilesBytes");
  const inlineImageOffloadByteQuantum = config.inlineImageOffloadByteQuantum ?? 10485760;
  if (!Number.isSafeInteger(inlineImageOffloadByteQuantum) || inlineImageOffloadByteQuantum <= 0) throw new Error("llm-deepseek: inlineImageOffloadByteQuantum must be a positive safe integer");
  if (inlineImageOffloadByteQuantum > maxInlineRequestImageBytes) throw new Error("llm-deepseek: inlineImageOffloadByteQuantum must not exceed maxInlineRequestImageBytes");
  const imageOffloadCountQuantum = config.imageOffloadCountQuantum ?? 20;
  if (!Number.isSafeInteger(imageOffloadCountQuantum) || imageOffloadCountQuantum <= 0) throw new Error("llm-deepseek: imageOffloadCountQuantum must be a positive safe integer");
  if (imageOffloadCountQuantum > maxImagesPerRequest) throw new Error("llm-deepseek: imageOffloadCountQuantum must not exceed maxImagesPerRequest");
  const filesApiTimeoutMs = config.filesApiTimeoutMs ?? 6e4;
  if (!Number.isFinite(filesApiTimeoutMs) || filesApiTimeoutMs <= 0 || filesApiTimeoutMs > MAX_TIMER_DELAY_MS) throw new Error(`llm-deepseek: filesApiTimeoutMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  const fileExpiresAfterSeconds = config.fileExpiresAfterSeconds ?? 604800;
  if (!Number.isSafeInteger(fileExpiresAfterSeconds) || fileExpiresAfterSeconds < 3600 || fileExpiresAfterSeconds > 2592e3) throw new Error("llm-deepseek: fileExpiresAfterSeconds must be an integer from 3600 through 2592000");
  const fileRefreshMarginSeconds = config.fileRefreshMarginSeconds ?? 3600;
  if (!Number.isSafeInteger(fileRefreshMarginSeconds) || fileRefreshMarginSeconds < 0 || fileRefreshMarginSeconds >= fileExpiresAfterSeconds) throw new Error("llm-deepseek: fileRefreshMarginSeconds must be a non-negative integer below fileExpiresAfterSeconds");
  const fileQuotaCleanupBatch = config.fileQuotaCleanupBatch ?? 100;
  if (!Number.isSafeInteger(fileQuotaCleanupBatch) || fileQuotaCleanupBatch < 1 || fileQuotaCleanupBatch > 1e3) throw new Error("llm-deepseek: fileQuotaCleanupBatch must be an integer from 1 through 1000");
  const baseURL = config.baseURL ?? environment?.get(BASE_URL_ENV)?.value ?? (protocol === "messages" ? "https://api.deepseek.com/anthropic" : "https://api.deepseek.com");
  if (protocol === "messages") {
    const parsed = new URL(baseURL);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("llm-deepseek: Messages baseURL must be an HTTP(S) root without credentials, query, or fragment");
  }
  return {
    protocol,
    apiKeyEnv: credentialRef(config.apiKeyEnv ?? DEFAULT_API_KEY_ENV),
    baseURL,
    defaults: {
      thinking: config.thinking,
      reasoningEffort: config.reasoningEffort
    },
    maxTokens: config.maxTokens ?? 256e3,
    defaultContextWindow: config.defaultContextWindow ?? 1e6,
    models: resolveModels(config.models),
    streamIdleTimeoutMs,
    maxRequestFilesBytes,
    maxInlineRequestImageBytes,
    maxImagesPerRequest,
    imageOffloadByteQuantum,
    inlineImageOffloadByteQuantum,
    imageOffloadCountQuantum,
    filesApiTimeoutMs,
    filePolicy: {
      expiresAfterSeconds: fileExpiresAfterSeconds,
      refreshMarginSeconds: fileRefreshMarginSeconds,
      quotaCleanupBatch: fileQuotaCleanupBatch
    },
    retryPolicy: resolveRetryPolicy(config.retryPolicy, "llm-deepseek: retryPolicy")
  };
}
var name = "llm-deepseek";
var inject = ["llm"];
var NS = "llm-deepseek";
var PROVIDER = "deepseek-official";
function apply(ctx, config) {
  let current = () => config;
  let lastRaw;
  let lastGood;
  const options = () => {
    const raw = current();
    if (raw === lastRaw && lastGood !== void 0) return lastGood;
    try {
      const next = resolveAdapterOptions(raw, launchEnvironmentOf(ctx));
      lastRaw = raw;
      lastGood = next;
      return next;
    } catch (error) {
      if (lastGood === void 0) throw error;
      lastRaw = raw;
      ctx.logger.error("llm-deepseek: keeping the last good configuration after an invalid settings section");
      ctx.logger.error(error);
      return lastGood;
    }
  };
  options();
  const resolveApiKey = async (connection) => {
    const ref = connection.apiKeyEnv;
    const credentials = ctx.get("credentials");
    if (credentials !== void 0) {
      const hit = await credentials.resolve(ref);
      if (hit !== void 0) return assertUsableApiKey(hit.value, "llm-deepseek", ref);
    } else {
      const ambient = launchEnvironmentOf(ctx).get(ref);
      if (ambient !== void 0 && ambient.value.length > 0) return assertUsableApiKey(ambient.value, "llm-deepseek", ref);
    }
    throw new LlmError(`llm-deepseek: no API key for provider route "${PROVIDER}"; store ${ref} through the credentials service (the web Models page writes it), or export ${ref} in the launching environment`, "MISSING_CREDENTIAL");
  };
  let userId;
  const resolveUserId = () => userId ??= getOrCreateAnonymousUserId();
  const adapter = new DeepSeekAdapter({
    options,
    onReplayDegrade: ({ provider, model, reason }) => {
      ctx.logger.warn(`llm-deepseek: unusable Messages replay state on assistant history for route "${provider}/${model}"; sending provider-neutral content (${reason})`);
    },
    resolveApiKey,
    resolveUserId,
    resolveAttachments: () => ctx.get("attachments"),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(attachments, (hostPath) => ctx.get("fs")?.processPathFromHostPath(hostPath), ref),
    prepareExtensions: (request) => {
      return ctx.get("deepseekLlmApiExtensions")?.prepare(request) ?? Promise.resolve({
        fields: {},
        accept: () => Promise.resolve()
      });
    }
  });
  ctx.llm.registerConfigurableProviders([{
    provider: PROVIDER,
    displayName: "DeepSeek",
    settingsNs: NS,
    settingsPath: []
  }]);
  const registration = ctx.llm.registerAdapter([PROVIDER], adapter);
  let registeredPolicy = options().retryPolicy;
  const ensureRegistrationFacts = () => {
    const policy = options().retryPolicy;
    if (deepEqualJson(policy, registeredPolicy)) return;
    registration.replace([PROVIDER]);
    registeredPolicy = policy;
  };
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, NS, Config, config, {
      setSource: (source) => {
        current = source;
      },
      onChange: ensureRegistrationFacts
    });
  });
}
export {
  Config,
  DEFAULT_CONTEXT_WINDOW,
  DEFAULT_FILES_API_TIMEOUT_MS,
  DEFAULT_FILE_EXPIRY_SECONDS,
  DEFAULT_FILE_QUOTA_CLEANUP_BATCH,
  DEFAULT_FILE_REFRESH_MARGIN_SECONDS,
  DEFAULT_IMAGE_OFFLOAD_BYTE_QUANTUM,
  DEFAULT_IMAGE_OFFLOAD_COUNT_QUANTUM,
  DEFAULT_INLINE_IMAGE_OFFLOAD_BYTE_QUANTUM,
  DEFAULT_LOW_DETAIL_IMAGE_PIXEL_BUDGET,
  DEFAULT_MAX_IMAGES_PER_REQUEST,
  DEFAULT_MAX_INLINE_REQUEST_IMAGE_BYTES,
  DEFAULT_MAX_REQUEST_FILES_BYTES,
  DEFAULT_MAX_TOKENS,
  DEFAULT_REQUEST_IMAGE_MAX_BYTES,
  DEFAULT_STREAM_IDLE_TIMEOUT_MS,
  DeepSeekAdapter,
  DeepSeekFileId,
  DeepSeekFileStore,
  DeepSeekFilesClient,
  DeepSeekUploadIndex,
  MAX_FILE_EXPIRY_SECONDS,
  MAX_FILE_UPLOAD_BYTES,
  MAX_IMAGE_BYTES,
  MAX_STORED_FILE_BYTES,
  MAX_STORED_FILE_COUNT,
  MESSAGES_BASE_URL,
  MIN_FILE_EXPIRY_SECONDS,
  PUBLIC_BASE_URL,
  REQUEST_IMAGE_MAX_DIMENSION,
  apply,
  deepSeekFileScope,
  deepSeekImageRequestPricing,
  deepSeekImageTokens,
  deepSeekRequestImageDimensions,
  inject,
  name,
  resolveAdapterOptions,
  resolveRequestImageMaxBytes,
  resolveRequestImageTarget
};
