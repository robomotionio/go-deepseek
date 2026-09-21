// .harness/packages/context/agent-instructions/lib/index.js
import { isDeepStrictEqual } from "node:util";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
import { dshHomeDisplay, resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { assertNever } from "@deepseek-ai/dsh-util-values";
import { createHash } from "node:crypto";
var DEFAULT_PROJECT_ROOT_MARKERS = [".git"];
var DEFAULT_INSTRUCTION_FILE_CANDIDATES = ["AGENTS.md", "CLAUDE.md"];
var DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES = ["AGENTS.local.md", "CLAUDE.local.md"];
var DEFAULT_MAX_SOURCE_BYTES = 1048576;
var RESERVED_PATH_SEGMENTS = /* @__PURE__ */ new Set([
  "",
  ".",
  ".."
]);
var Config = z.object({
  dshHome: z.string(),
  projectRootMarkers: z.array(z.string()).default([...DEFAULT_PROJECT_ROOT_MARKERS]),
  maxBytes: z.number().required(),
  maxSourceBytes: z.number().step(1).min(1).default(DEFAULT_MAX_SOURCE_BYTES),
  instructionFileCandidates: z.array(z.string()).default([...DEFAULT_INSTRUCTION_FILE_CANDIDATES]),
  localInstructionFileCandidates: z.array(z.string()).default([...DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES])
});
function workspaceBaselineIdentity(config, cwd, projectRoot) {
  return JSON.stringify({
    projectRoot: relative(cwd, projectRoot),
    projectRootMarkers: config.projectRootMarkers,
    maxBytes: config.maxBytes,
    maxSourceBytes: config.maxSourceBytes,
    instructionFileCandidates: config.instructionFileCandidates,
    localInstructionFileCandidates: config.localInstructionFileCandidates
  });
}
function resolveConfig(config) {
  return {
    ...resolveDiscoveryConfig(config),
    maxBytes: config.maxBytes,
    maxSourceBytes: config.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES
  };
}
function resolveDiscoveryConfig(config) {
  return {
    dshHome: resolveDshHome(config.dshHome),
    projectRootMarkers: config.projectRootMarkers ?? [...DEFAULT_PROJECT_ROOT_MARKERS],
    instructionFileCandidates: resolveInstructionFileCandidates(config.instructionFileCandidates, DEFAULT_INSTRUCTION_FILE_CANDIDATES),
    localInstructionFileCandidates: resolveInstructionFileCandidates(config.localInstructionFileCandidates, DEFAULT_LOCAL_INSTRUCTION_FILE_CANDIDATES)
  };
}
function resolveInstructionFileCandidates(candidates, fallback) {
  return (candidates ?? [...fallback]).filter((candidate) => !RESERVED_PATH_SEGMENTS.has(candidate) && !/[\\/]/.test(candidate));
}
function instructionContentSha1(content) {
  return createHash("sha1").update(content).digest("hex");
}
function trimmedInstructionDigest(content) {
  return instructionContentSha1(content.trim());
}
var SYSTEM_REMINDER_OPEN = "<system-reminder>";
var SYSTEM_REMINDER_CLOSE = "</system-reminder>";
var AGENT_INSTRUCTIONS_INTRO = "The following workspace instructions may be relevant to your work. Use them as guidance when applicable. More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.";
var REPLACEMENT_AGENT_INSTRUCTIONS_INTRO = "This complete workspace instruction baseline replaces all earlier workspace instruction baselines. The following workspace instructions may be relevant to your work. Use them as guidance when applicable. More specific instructions take precedence over broader ones. They do not override system, developer, or direct user instructions.";
var EMPTY_REPLACEMENT_AGENT_INSTRUCTIONS_INTRO = "This complete workspace instruction baseline replaces all earlier workspace instruction baselines. No workspace instructions are currently active.";
var COMPACT_AGENT_INSTRUCTIONS_INTRO = "Workspace instructions were omitted or truncated to fit the configured byte budget.";
function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}
function truncateUtf8(value, maxBytes) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length <= maxBytes) return value;
  let end = Math.max(0, Math.trunc(maxBytes));
  while (end > 0 && (bytes.readUInt8(end) & 192) === 128) end -= 1;
  return bytes.subarray(0, end).toString("utf8");
}
function escapeInstructionFrameBody(body) {
  return body.replaceAll(SYSTEM_REMINDER_CLOSE, "<\\/system-reminder>");
}
function sectionText(file) {
  return `Instructions from: ${file.displayPath}

${file.content}`;
}
var USER_GLOBAL_DIRECTORY = "user-global";
var USER_GLOBAL_FILE = "AGENTS.md";
function scopeForDisplayPath(displayPath) {
  if (displayPath === "~/.dsh/AGENTS.md" || displayPath === "$DSH_HOME/AGENTS.md") return USER_GLOBAL_DIRECTORY;
  return dirname(displayPath);
}
var SCOPE_SEPARATOR = "\0";
function candidateScopeKey(directory, candidateName) {
  return `${directory}${SCOPE_SEPARATOR}${candidateName}`;
}
function instructionScopeKey(displayPath) {
  return candidateScopeKey(scopeForDisplayPath(displayPath), basename(displayPath));
}
function decodeScopeKey(scope) {
  const separator = scope.indexOf(SCOPE_SEPARATOR);
  if (separator < 0) return {
    directory: scope,
    candidateName: ""
  };
  return {
    directory: scope.slice(0, separator),
    candidateName: scope.slice(separator + 1)
  };
}
function additionalSectionText(file) {
  const scope = scopeForDisplayPath(file.displayPath);
  return [
    `Additional instructions from: ${file.displayPath}`,
    "",
    `These instructions apply to work under \`${scope}\`. Use them as guidance when relevant; more specific instructions take precedence. They do not override system, developer, or direct user instructions.`,
    "",
    file.content
  ].join("\n");
}
var BASELINE_RENDER_STYLE = {
  intro: AGENT_INSTRUCTIONS_INTRO,
  section: sectionText
};
function baselineRenderStyle(files, replacePreviousBaseline) {
  if (replacePreviousBaseline !== true) return BASELINE_RENDER_STYLE;
  return {
    ...BASELINE_RENDER_STYLE,
    intro: files.length === 0 ? EMPTY_REPLACEMENT_AGENT_INSTRUCTIONS_INTRO : REPLACEMENT_AGENT_INSTRUCTIONS_INTRO
  };
}
function changedSectionText(item) {
  const { change, file } = item;
  if (change.action === "set") return additionalSectionText(file);
  if (change.action === "remove") return `Instructions removed: ${change.path}

The previously loaded instructions from this file no longer apply.`;
  return [
    `Updated instructions from: ${change.path}`,
    "",
    "This file changed after it was loaded. Use the following content instead of the previously loaded instructions from this file.",
    "",
    file.content
  ].join("\n");
}
function renderInstructionChanges(items, maxBytes) {
  const byAbsolutePath = new Map(items.map((item) => [item.file.absolutePath, item]));
  const rendered = renderInstructionContext(items.map((item) => item.file), maxBytes, {
    intro: "",
    section(file) {
      const item = byAbsolutePath.get(file.absolutePath);
      return item === void 0 ? "" : changedSectionText({
        ...item,
        file
      });
    }
  });
  const represented = new Set(rendered.represented.map((file) => file.absolutePath));
  return {
    text: rendered.text,
    changes: items.filter((item) => represented.has(item.file.absolutePath)).map((item) => item.change)
  };
}
function markerText(maxBytes, omitted, truncated) {
  if (omitted.length === 0 && truncated.length === 0) return "";
  const parts = [];
  if (omitted.length > 0) parts.push(`omitted ${omitted.map((file) => file.displayPath).join(", ")}`);
  if (truncated.length > 0) parts.push(`truncated ${truncated.map((item) => `${item.displayPath} from ${item.originalBytes} to ${item.includedBytes} bytes`).join(", ")}`);
  return `Workspace instruction budget ${maxBytes} bytes: ${parts.join("; ")}`;
}
function buildInstructionText(files, maxBytes, omitted, truncated, style) {
  return [
    SYSTEM_REMINDER_OPEN,
    escapeInstructionFrameBody([
      markerText(maxBytes, omitted, truncated),
      style.intro,
      ...files.map((file) => style.section(file))
    ].filter((block) => block.length > 0).join("\n\n")),
    SYSTEM_REMINDER_CLOSE
  ].join("\n");
}
function withTruncatedContent(file, includedBytes) {
  return {
    ...file,
    content: truncateUtf8(file.content, includedBytes)
  };
}
function truncateToFit(file, includedFiles, maxBytes, omitted, style) {
  const originalBytes = byteLength(file.content);
  let low = 0;
  let high = originalBytes;
  let best = withTruncatedContent(file, 0);
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = withTruncatedContent(file, mid);
    const truncated = [{
      displayPath: file.displayPath,
      originalBytes,
      includedBytes: byteLength(candidate.content)
    }];
    if (byteLength(buildInstructionText([...includedFiles, candidate], maxBytes, omitted, truncated, style)) <= maxBytes) {
      best = candidate;
      low = mid + 1;
    } else high = mid - 1;
  }
  return best;
}
function renderInstructionContext(files, maxBytes, style) {
  if (maxBytes <= 0 || !Number.isFinite(maxBytes)) return {
    text: "",
    omitted: files,
    truncated: [],
    represented: []
  };
  const fullText = buildInstructionText(files, maxBytes, [], [], style);
  if (byteLength(fullText) <= maxBytes) return {
    text: fullText,
    omitted: [],
    truncated: [],
    represented: files
  };
  for (let start = 1; start < files.length; start += 1) {
    const included = files.slice(start);
    const omitted2 = files.slice(0, start).map((file) => ({
      absolutePath: file.absolutePath,
      displayPath: file.displayPath
    }));
    const suffixText = buildInstructionText(included, maxBytes, omitted2, [], style);
    if (byteLength(suffixText) <= maxBytes) return {
      text: suffixText,
      omitted: omitted2,
      truncated: [],
      represented: included
    };
  }
  const mostSpecific = files.at(-1);
  if (mostSpecific === void 0) return {
    text: "",
    omitted: [],
    truncated: [],
    represented: []
  };
  const omitted = files.slice(0, -1).map((file) => ({
    absolutePath: file.absolutePath,
    displayPath: file.displayPath
  }));
  const originalBytes = byteLength(mostSpecific.content);
  for (const candidateStyle of [style, {
    ...style,
    intro: COMPACT_AGENT_INSTRUCTIONS_INTRO
  }]) {
    const truncatedFile = truncateToFit(mostSpecific, [], maxBytes, omitted, candidateStyle);
    const includedBytes = byteLength(truncatedFile.content);
    const truncated2 = [{
      displayPath: mostSpecific.displayPath,
      originalBytes,
      includedBytes
    }];
    const text = buildInstructionText([truncatedFile], maxBytes, omitted, truncated2, candidateStyle);
    if (byteLength(text) <= maxBytes) return {
      text,
      omitted,
      truncated: truncated2,
      represented: includedBytes > 0 || originalBytes === 0 ? [mostSpecific] : []
    };
  }
  const truncated = [{
    displayPath: mostSpecific.displayPath,
    originalBytes,
    includedBytes: 0
  }];
  const compactNotice = escapeInstructionFrameBody(markerText(maxBytes, omitted, truncated));
  const compactWithHeading = escapeInstructionFrameBody([compactNotice, style.section(withTruncatedContent(mostSpecific, 0))].join("\n\n"));
  if (byteLength(compactWithHeading) <= maxBytes) return {
    text: compactWithHeading,
    omitted,
    truncated,
    represented: originalBytes === 0 ? [mostSpecific] : []
  };
  return {
    text: byteLength(compactNotice) <= maxBytes ? compactNotice : truncateUtf8(compactNotice, maxBytes),
    omitted,
    truncated,
    represented: []
  };
}
function renderAgentInstructionSet(files, options) {
  const style = baselineRenderStyle(files, options.replacePreviousBaseline);
  const { represented, ...rendered } = renderInstructionContext(files, options.maxBytes, style);
  return {
    rendered,
    included: represented
  };
}
function renderAgentInstructions(files, options) {
  return renderAgentInstructionSet(files, options).rendered;
}
function signalOptions(signal) {
  return signal === void 0 ? void 0 : { signal };
}
function isMissingPathError(error) {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
}
function isMissingProviderPathError(error) {
  return error instanceof Error && "code" in error && error.code === "FS_NOT_FOUND";
}
async function nodeStatFile(path, signal) {
  try {
    signal?.throwIfAborted();
    const info = await stat(path);
    signal?.throwIfAborted();
    if (!info.isFile()) return { kind: "absent" };
    return {
      kind: "present",
      info: { size: info.size }
    };
  } catch (error) {
    signal?.throwIfAborted();
    return isMissingPathError(error) ? { kind: "absent" } : { kind: "unavailable" };
  }
}
async function fsStatFile(path, fileSystem, signal) {
  try {
    const target = await fileSystem.resolve(path, signalOptions(signal));
    signal?.throwIfAborted();
    const info = await fileSystem.stat(target, signal);
    signal?.throwIfAborted();
    if (info?.type !== "file") return { kind: "absent" };
    return {
      kind: "present",
      info: {
        target,
        version: info.version,
        ...info.size === void 0 ? {} : { size: info.size }
      }
    };
  } catch {
    signal?.throwIfAborted();
    return { kind: "unavailable" };
  }
}
async function statFile(path, fileSystem, signal) {
  return fileSystem === void 0 ? nodeStatFile(path, signal) : fsStatFile(path, fileSystem, signal);
}
async function existsAsMarker(path, fileSystem, signal) {
  if (fileSystem !== void 0) try {
    const target = await fileSystem.resolve(path, signalOptions(signal));
    return await fileSystem.stat(target, signal) !== void 0;
  } catch (error) {
    signal?.throwIfAborted();
    if (isMissingProviderPathError(error)) return false;
    throw error;
  }
  try {
    signal?.throwIfAborted();
    await stat(path);
    signal?.throwIfAborted();
    return true;
  } catch (error) {
    signal?.throwIfAborted();
    if (isMissingPathError(error)) return false;
    throw error;
  }
}
async function findProjectRoot(cwd, markers, fileSystem, signal) {
  let current = resolve(cwd);
  for (; ; ) {
    for (const marker of markers) if (await existsAsMarker(join(current, marker), fileSystem, signal)) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(cwd);
    current = parent;
  }
}
function ancestorChain(root, cwd) {
  const chain = [];
  let current = resolve(cwd);
  const resolvedRoot = resolve(root);
  while (current !== resolvedRoot) {
    chain.push(current);
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  chain.push(resolvedRoot);
  return chain.reverse();
}
function descendantDirsBetween(root, touchedPath) {
  const resolvedRoot = resolve(root);
  const targetDir = dirname(isAbsolute(touchedPath) ? resolve(touchedPath) : resolve(resolvedRoot, touchedPath));
  const rel = relative(resolvedRoot, targetDir);
  if (rel.length === 0 || rel.startsWith("..") || isAbsolute(rel)) return [];
  return ancestorChain(resolvedRoot, targetDir).slice(1);
}
function relativeDisplay(root, path) {
  return relative(root, path);
}
async function allExistingInstructionFiles(dir, root, instructionFileCandidates, fileSystem, signal) {
  const found = [];
  for (const candidate of instructionFileCandidates) {
    const path = join(dir, candidate);
    const probe = await statFile(path, fileSystem, signal);
    switch (probe.kind) {
      case "present":
        found.push({
          absolutePath: path,
          displayPath: relativeDisplay(root, path),
          ...probe.info
        });
        continue;
      case "absent":
      case "unavailable":
        continue;
      /* v8 ignore next 2 -- StatFileProbe is closed; this arm only makes adding a kind a compile error. */
      default:
        assertNever(probe, "StatFileProbe");
    }
  }
  return found;
}
async function discoverInstructionFiles(options, fileSystem) {
  const config = resolveDiscoveryConfig(options);
  const files = [];
  const seen = /* @__PURE__ */ new Set();
  const addFile = (file) => {
    if (seen.has(file.absolutePath)) return;
    seen.add(file.absolutePath);
    files.push(file);
  };
  const userGlobal = join(config.dshHome, USER_GLOBAL_FILE);
  const userGlobalProbe = await statFile(userGlobal, fileSystem, options.signal);
  switch (userGlobalProbe.kind) {
    case "present":
      addFile({
        absolutePath: userGlobal,
        displayPath: userGlobalDisplayPath(config.dshHome),
        ...userGlobalProbe.info
      });
      break;
    case "absent":
    case "unavailable":
      break;
    /* v8 ignore next 2 -- StatFileProbe is closed; this arm only makes adding a kind a compile error. */
    default:
      assertNever(userGlobalProbe, "StatFileProbe");
  }
  const cwd = resolve(options.cwd);
  const projectRoot = options.projectRoot ?? await findProjectRoot(cwd, config.projectRootMarkers, fileSystem, options.signal);
  for (const dir of ancestorChain(projectRoot, cwd)) for (const candidates of [config.instructionFileCandidates, config.localInstructionFileCandidates]) for (const file of await allExistingInstructionFiles(dir, projectRoot, candidates, fileSystem, options.signal)) addFile(file);
  return files;
}
async function discoverBaselineInstructionFiles(options) {
  return (await discoverInstructionFiles(options)).map(({ absolutePath, displayPath }) => ({
    absolutePath,
    displayPath
  }));
}
async function* nodeTextChunks(path, signal) {
  const stream = createReadStream(path, {
    encoding: "utf8",
    signal
  });
  for await (const chunk of stream) yield String(chunk);
}
async function readBounded(file, maxSourceBytes, fileSystem, signal) {
  signal?.throwIfAborted();
  if (file.size !== void 0 && file.size > maxSourceBytes) return void 0;
  try {
    const chunks = fileSystem === void 0 || file.target === void 0 ? nodeTextChunks(file.absolutePath, signal) : await fileSystem.streamText(file.target, signal);
    const parts = [];
    let bytes = 0;
    for await (const chunk of chunks) {
      signal?.throwIfAborted();
      bytes += Buffer.byteLength(chunk, "utf8");
      if (bytes > maxSourceBytes) return void 0;
      parts.push(chunk);
    }
    signal?.throwIfAborted();
    return parts.join("");
  } catch {
    signal?.throwIfAborted();
    return;
  }
}
function dedupInstructionFilesByDirectory(files) {
  const keptDigestsByDir = /* @__PURE__ */ new Map();
  const kept = [];
  for (const file of files) {
    const dir = dirname(file.displayPath);
    let digests = keptDigestsByDir.get(dir);
    if (digests === void 0) {
      digests = /* @__PURE__ */ new Set();
      keptDigestsByDir.set(dir, digests);
    }
    const digest = trimmedInstructionDigest(file.content);
    if (digests.has(digest)) continue;
    digests.add(digest);
    kept.push(file);
  }
  return kept;
}
async function loadBaselineInstructions(options, fileSystem) {
  return (await loadBaselineInstructionSet(options, fileSystem))?.rendered;
}
async function loadBaselineInstructionSet(options, fileSystem) {
  const config = resolveConfig(options);
  if (config.maxBytes <= 0 || !Number.isFinite(config.maxBytes)) return void 0;
  if (config.maxSourceBytes <= 0 || !Number.isFinite(config.maxSourceBytes)) return void 0;
  const discovered = await discoverInstructionFiles(options, fileSystem);
  const loaded = [];
  for (const file of discovered) {
    const content = await readBounded(file, config.maxSourceBytes, fileSystem, options.signal);
    if (content !== void 0) loaded.push({
      absolutePath: file.absolutePath,
      displayPath: file.displayPath,
      content,
      ...file.version === void 0 ? {} : { version: file.version }
    });
  }
  const deduped = dedupInstructionFilesByDirectory(loaded);
  if (deduped.length === 0) {
    if (options.replacePreviousBaseline !== true) return void 0;
    const { rendered: rendered2, included: included2 } = renderAgentInstructionSet([], {
      maxBytes: config.maxBytes,
      replacePreviousBaseline: true
    });
    return {
      rendered: rendered2,
      observed: [],
      included: included2
    };
  }
  const { rendered, included } = renderAgentInstructionSet(deduped, {
    maxBytes: config.maxBytes,
    ...options.replacePreviousBaseline === void 0 ? {} : { replacePreviousBaseline: options.replacePreviousBaseline }
  });
  return {
    rendered,
    observed: loaded,
    included
  };
}
async function probeScopeInstruction(scope, projectRoot, resolved, fileSystem, signal) {
  const { directory, candidateName } = decodeScopeKey(scope);
  const absolutePath = join(directory === "user-global" ? resolved.dshHome : directory === "." ? projectRoot : join(projectRoot, directory), candidateName);
  let target;
  let info;
  try {
    target = await fileSystem.resolve(absolutePath, signalOptions(signal));
    info = await fileSystem.stat(target, signal);
  } catch {
    signal?.throwIfAborted();
    return { kind: "unavailable" };
  }
  if (info?.type !== "file") return { kind: "absent" };
  return {
    kind: "present",
    file: {
      absolutePath,
      displayPath: directory === "user-global" ? userGlobalDisplayPath(resolved.dshHome) : relativeDisplay(projectRoot, absolutePath),
      target,
      version: info.version,
      ...info.size === void 0 ? {} : { size: info.size }
    }
  };
}
async function readScopeInstruction(file, maxSourceBytes, fileSystem, signal) {
  const content = await readBounded(file, maxSourceBytes, fileSystem, signal);
  if (content === void 0) return void 0;
  return {
    absolutePath: file.absolutePath,
    displayPath: file.displayPath,
    content,
    version: file.version
  };
}
function userGlobalDisplayPath(dshHome) {
  return `${dshHomeDisplay(dshHome)}/AGENTS.md`;
}
var name = "agent-instructions";
function agentInstructionsHook(text, changes) {
  return createUserMessage({
    content: [{
      type: "text",
      text
    }],
    source: {
      kind: "agent-instructions",
      form: "instructions",
      changes
    }
  });
}
function agentInstructionsMessage(text) {
  return createUserMessage({
    content: [{
      type: "text",
      text
    }],
    source: {
      kind: "plugin",
      plugin: name
    }
  });
}
function isAgentInstructionsSource(source) {
  return typeof source === "object" && source !== null && "kind" in source && source.kind === "agent-instructions" && "changes" in source && Array.isArray(source.changes);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function workspaceInstructionChanges(source) {
  const changes = [];
  for (const value of source.changes) {
    if (!isRecord(value)) continue;
    if (value.action !== "set" && value.action !== "replace" && value.action !== "remove") continue;
    if (typeof value.scope !== "string" || typeof value.path !== "string") continue;
    if (value.digest !== void 0 && typeof value.digest !== "string") continue;
    changes.push({
      action: value.action,
      scope: value.scope,
      path: value.path,
      ...value.digest !== void 0 ? { digest: value.digest } : {}
    });
  }
  return changes;
}
function sameInstructionChange(a, b) {
  return a.action === b.action && a.scope === b.scope && a.path === b.path && a.digest === b.digest;
}
function visibleInstructionChanges(agent, authorityMessages) {
  const visible = /* @__PURE__ */ new Map();
  for (const seq of agent.session.surface.nodes) {
    const event = agent.session.eventAt(seq);
    if (event?.type !== "user/message" || !isAgentInstructionsSource(event.data.source)) continue;
    const changes = workspaceInstructionChanges(event.data.source);
    for (const change of changes) visible.set(change.scope, change);
  }
  for (const message of authorityMessages) {
    if (!isAgentInstructionsSource(message.source)) continue;
    for (const change of workspaceInstructionChanges(message.source)) visible.set(change.scope, change);
  }
  return visible;
}
function baselineInstructionState(files) {
  const changes = /* @__PURE__ */ new Map();
  const versions = /* @__PURE__ */ new Map();
  for (const file of files) {
    const digest = instructionContentSha1(file.content);
    const change = {
      action: "set",
      scope: instructionScopeKey(file.displayPath),
      path: file.displayPath,
      digest
    };
    changes.set(change.scope, change);
    if (file.version !== void 0) versions.set(change.scope, {
      path: file.displayPath,
      version: file.version,
      digest,
      trimmedDigest: trimmedInstructionDigest(file.content)
    });
  }
  return {
    changes,
    versions
  };
}
function versionStatesFor(session, cache) {
  let states = cache.get(session);
  if (states === void 0) {
    states = /* @__PURE__ */ new Map();
    cache.set(session, states);
  }
  return states;
}
function retainedInstructionVersionUpdates(updates, renderedChanges) {
  return updates.filter((update) => renderedChanges.some((change) => sameInstructionChange(update.change, change)));
}
function applyInstructionVersionUpdates(session, updates, cache) {
  if (updates.length === 0) return;
  const states = versionStatesFor(session, cache);
  for (const update of updates) if (update.state === void 0) states.delete(update.change.scope);
  else states.set(update.change.scope, update.state);
  if (states.size === 0) cache.delete(session);
}
function relativeScope(projectRoot, dir) {
  const scope = relativeDisplay(projectRoot, dir);
  return scope.length === 0 ? "." : scope;
}
async function reconcileInstructionContext(agent, resolved, versionCache, fileSystem, options) {
  const session = agent.session;
  const effective = visibleInstructionChanges(agent, options.authorityMessages);
  const cwd = session.header.cwd ?? process.cwd();
  const projectRoot = options.projectRoot ?? await findProjectRoot(cwd, resolved.projectRootMarkers, fileSystem, options.signal);
  const scopes = /* @__PURE__ */ new Set();
  const baselineScopes = /* @__PURE__ */ new Set();
  const addDirScopes = (target, directory) => {
    for (const candidate of resolved.instructionFileCandidates) target.add(candidateScopeKey(directory, candidate));
    for (const candidate of resolved.localInstructionFileCandidates) target.add(candidateScopeKey(directory, candidate));
  };
  const addProjectScopes = (target, dir) => {
    addDirScopes(target, relativeScope(projectRoot, dir));
  };
  baselineScopes.add(candidateScopeKey(USER_GLOBAL_DIRECTORY, USER_GLOBAL_FILE));
  for (const dir of ancestorChain(projectRoot, cwd)) addProjectScopes(baselineScopes, dir);
  if (options.includeBaselineScopes) for (const scope of baselineScopes) scopes.add(scope);
  for (const message of options.scopeMessages) {
    if (!isAgentInstructionsSource(message.source)) continue;
    for (const change of workspaceInstructionChanges(message.source)) {
      if (!options.includeBaselineScopes && baselineScopes.has(change.scope)) continue;
      scopes.add(change.scope);
    }
  }
  for (const scope of effective.keys()) {
    if (!options.includeBaselineScopes && baselineScopes.has(scope)) continue;
    const { directory } = decodeScopeKey(scope);
    if (directory === "user-global") scopes.add(candidateScopeKey(USER_GLOBAL_DIRECTORY, USER_GLOBAL_FILE));
    else addDirScopes(scopes, directory);
  }
  for (const touchedPath of options.touchedPaths) for (const dir of descendantDirsBetween(cwd, touchedPath)) addProjectScopes(scopes, dir);
  const versions = versionStatesFor(session, versionCache);
  const seenAbsolutePaths = /* @__PURE__ */ new Set();
  const keptTrimmedByDir = /* @__PURE__ */ new Map();
  const registerKeptTrimmed = (directory, digest) => {
    let digests = keptTrimmedByDir.get(directory);
    if (digests === void 0) {
      digests = /* @__PURE__ */ new Set();
      keptTrimmedByDir.set(directory, digests);
    }
    if (digests.has(digest)) return true;
    digests.add(digest);
    return false;
  };
  const items = [];
  const versionUpdates = [];
  const pushRemoval = (scope, path) => {
    const change = {
      action: "remove",
      scope,
      path
    };
    items.push({
      change,
      file: {
        absolutePath: `removed:${scope}`,
        displayPath: path,
        content: ""
      }
    });
    versionUpdates.push({ change });
  };
  const scopesByDirectory = /* @__PURE__ */ new Map();
  for (const scope of scopes) {
    const { directory } = decodeScopeKey(scope);
    const directoryScopes = scopesByDirectory.get(directory);
    if (directoryScopes === void 0) scopesByDirectory.set(directory, [scope]);
    else directoryScopes.push(scope);
  }
  for (const [directory, directoryScopes] of scopesByDirectory) {
    const probedScopes = [];
    for (const scope of directoryScopes) if (options.excludedBaselineScopes !== void 0 && baselineScopes.has(scope) && options.excludedBaselineScopes.has(scope)) {
      const previous = effective.get(scope);
      if (previous === void 0 || previous.action === "remove") versions.delete(scope);
      else pushRemoval(scope, previous.path);
    } else probedScopes.push(scope);
    const itemStart = items.length;
    const versionUpdateStart = versionUpdates.length;
    const addedAbsolutePaths = [];
    const priorVersions = new Map(probedScopes.map((scope) => [scope, versions.get(scope)]));
    for (const scope of probedScopes) {
      const previous = effective.get(scope);
      const probe = await probeScopeInstruction(scope, projectRoot, resolved, fileSystem, options.signal);
      if (probe.kind === "unavailable") {
        if (previous === void 0 || previous.action === "remove") continue;
        items.splice(itemStart);
        versionUpdates.splice(versionUpdateStart);
        for (const [candidateScope, prior] of priorVersions) if (prior === void 0) versions.delete(candidateScope);
        else versions.set(candidateScope, prior);
        for (const absolutePath of addedAbsolutePaths) seenAbsolutePaths.delete(absolutePath);
        keptTrimmedByDir.delete(directory);
        break;
      }
      if (probe.kind === "absent") {
        if (previous === void 0 || previous.action === "remove") versions.delete(scope);
        else pushRemoval(scope, previous.path);
        continue;
      }
      const { file: probedFile } = probe;
      if (seenAbsolutePaths.has(probedFile.absolutePath)) continue;
      seenAbsolutePaths.add(probedFile.absolutePath);
      addedAbsolutePaths.push(probedFile.absolutePath);
      const cached = versions.get(scope);
      if (cached !== void 0 && cached.path === probedFile.displayPath && cached.version === probedFile.version && previous !== void 0 && previous.action !== "remove" && previous.path === cached.path && previous.digest === cached.digest) {
        if (registerKeptTrimmed(directory, cached.trimmedDigest)) pushRemoval(scope, previous.path);
        continue;
      }
      const file = await readScopeInstruction(probedFile, resolved.maxSourceBytes, fileSystem, options.signal);
      if (file === void 0) continue;
      const currentDigest = instructionContentSha1(file.content);
      const trimmedDigest = trimmedInstructionDigest(file.content);
      if (registerKeptTrimmed(directory, trimmedDigest)) {
        if (previous !== void 0 && previous.action !== "remove") pushRemoval(scope, previous.path);
        else versions.delete(scope);
        continue;
      }
      const nextVersion = {
        path: file.displayPath,
        version: probedFile.version,
        digest: currentDigest,
        trimmedDigest
      };
      if (previous !== void 0 && previous.action !== "remove" && previous.path === file.displayPath && previous.digest === currentDigest) {
        versions.set(scope, nextVersion);
        continue;
      }
      const change = {
        action: previous === void 0 || previous.action === "remove" ? "set" : "replace",
        scope,
        path: file.displayPath,
        digest: currentDigest
      };
      items.push({
        change,
        file
      });
      versionUpdates.push({
        change,
        state: nextVersion
      });
    }
  }
  if (items.length === 0) return void 0;
  const rendered = renderInstructionChanges(items, resolved.maxBytes);
  if (rendered.text.length === 0 || rendered.changes.length === 0) return void 0;
  return {
    context: agentInstructionsHook(rendered.text, rendered.changes),
    versionUpdates: retainedInstructionVersionUpdates(versionUpdates, rendered.changes)
  };
}
var inject = ["sessionProjections"];
function visibleBaselineSource(agent, authorityMessages) {
  for (const message of authorityMessages.toReversed()) if (message.source.kind === "agent-instructions" && message.source.baseline === true) return message.source;
  for (const seq of agent.session.surface.nodes.toReversed()) {
    const event = agent.session.eventAt(seq);
    if (event?.type === "user/message" && event.data.source.kind === "agent-instructions" && event.data.source.baseline === true) return event.data.source;
  }
}
function isAgentInstructionsMessage(message) {
  return message.source.kind === "agent-instructions";
}
function sameContextPayload(left, right) {
  return isDeepStrictEqual(left.content, right.content) && isDeepStrictEqual(left.source, right.source);
}
var FILE_TOUCH_TOOL_NAMES = /* @__PURE__ */ new Set([
  "read",
  "write",
  "edit"
]);
function filePathFromExecution(exec) {
  if (!FILE_TOUCH_TOOL_NAMES.has(exec.name)) return void 0;
  if (typeof exec.arguments !== "object" || exec.arguments === null) return void 0;
  if (!("file_path" in exec.arguments) || typeof exec.arguments.file_path !== "string") return void 0;
  const filePath = exec.arguments.file_path.trim();
  return filePath.length > 0 ? filePath : void 0;
}
function apply(ctx, config) {
  const resolved = resolveConfig(config);
  const instructionVersions = /* @__PURE__ */ new WeakMap();
  const baselinePreparations = /* @__PURE__ */ new WeakMap();
  const projectionLifecycle = new AbortController();
  const executionTouches = /* @__PURE__ */ new Map();
  ctx.effect(() => () => {
    projectionLifecycle.abort(/* @__PURE__ */ new Error("agent-instructions disposed"));
    executionTouches.clear();
  }, "agent-instructions.projectionLifecycle");
  const projectionTails = /* @__PURE__ */ new WeakMap();
  const stepTouches = /* @__PURE__ */ new WeakMap();
  const compose = async (agent, signal, claimed, pending, touchedPaths = []) => {
    signal.throwIfAborted();
    if (resolved.maxBytes <= 0 || !Number.isFinite(resolved.maxBytes)) return;
    const fileSystem = ctx.get("fs");
    if (fileSystem === void 0) return void 0;
    if (touchedPaths.length === 0 && pending.length > 0) return pending[0];
    const content = [];
    const changes = [];
    let desiredBaseline = false;
    const authorityMessages = [...claimed];
    const cwd = agent.session.header.cwd ?? process.cwd();
    const projectRoot = await findProjectRoot(cwd, resolved.projectRootMarkers, fileSystem, signal);
    const identity = workspaceBaselineIdentity(resolved, cwd, projectRoot);
    const visibleBaseline = visibleBaselineSource(agent, authorityMessages);
    const baselinePresent = visibleBaseline !== void 0;
    const keepVisibleBaseline = visibleBaseline?.baselineIdentity === identity;
    const prepared = baselinePreparations.get(agent.session);
    let excludedBaselineScopes = keepVisibleBaseline && prepared?.identity === identity ? prepared.excludedScopes : void 0;
    let nextPreparation;
    if (!baselinePresent || !keepVisibleBaseline || excludedBaselineScopes === void 0) {
      const replacePreviousBaseline = baselinePresent && !keepVisibleBaseline;
      const instructions = await loadBaselineInstructionSet({
        cwd,
        dshHome: resolved.dshHome,
        projectRootMarkers: resolved.projectRootMarkers,
        maxBytes: resolved.maxBytes,
        maxSourceBytes: resolved.maxSourceBytes,
        instructionFileCandidates: resolved.instructionFileCandidates,
        localInstructionFileCandidates: resolved.localInstructionFileCandidates,
        projectRoot,
        replacePreviousBaseline,
        signal
      }, fileSystem);
      const baseline = baselineInstructionState(instructions?.included ?? []);
      const observedBaseline = baselineInstructionState(instructions?.observed ?? []);
      const excludedScopes = new Set(observedBaseline.changes.keys());
      for (const scope of baseline.changes.keys()) excludedScopes.delete(scope);
      excludedBaselineScopes = excludedScopes;
      nextPreparation = {
        identity,
        excludedScopes
      };
      let versionStates = instructionVersions.get(agent.session);
      if (versionStates === void 0 && baseline.versions.size > 0) {
        versionStates = /* @__PURE__ */ new Map();
        instructionVersions.set(agent.session, versionStates);
      }
      for (const [scope, state] of baseline.versions) versionStates?.set(scope, state);
      if (!keepVisibleBaseline && instructions !== void 0 && instructions.rendered.text.length > 0) {
        const baselineContent = agentInstructionsMessage(instructions.rendered.text).content;
        content.push(...baselineContent);
        const replacementScopes = new Set(baseline.changes.keys());
        const baselineChanges = [...replacePreviousBaseline ? visibleBaseline.changes.flatMap((change) => change.action === "remove" || replacementScopes.has(change.scope) ? [] : [{
          action: "remove",
          scope: change.scope,
          path: change.path
        }]) : [], ...baseline.changes.values()];
        changes.push(...baselineChanges);
        authorityMessages.push(createUserMessage({
          content: baselineContent,
          source: {
            kind: "agent-instructions",
            form: "instructions",
            baseline: true,
            baselineIdentity: identity,
            changes: baselineChanges
          }
        }));
        desiredBaseline = true;
      }
    }
    const update = await reconcileInstructionContext(agent, resolved, instructionVersions, fileSystem, {
      authorityMessages,
      scopeMessages: pending,
      includeBaselineScopes: keepVisibleBaseline,
      ...keepVisibleBaseline ? { excludedBaselineScopes } : {},
      touchedPaths,
      projectRoot,
      signal
    });
    if (update !== void 0) {
      content.push(...update.context.content);
      if (update.context.source.kind === "agent-instructions") changes.push(...update.context.source.changes);
      applyInstructionVersionUpdates(agent.session, update.versionUpdates, instructionVersions);
    }
    if (nextPreparation !== void 0) baselinePreparations.set(agent.session, nextPreparation);
    if (content.length === 0) return void 0;
    return createUserMessage({
      content,
      source: {
        kind: "agent-instructions",
        form: "instructions",
        ...desiredBaseline ? { baseline: true } : {},
        ...desiredBaseline ? { baselineIdentity: identity } : {},
        changes
      }
    });
  };
  const syncInbox = (agent, claimed, desired) => {
    const pending = agent.inbox.nextStep.filter(isAgentInstructionsMessage);
    const alreadySupplied = desired !== void 0 && (claimed.some((message) => sameContextPayload(message, desired)) || agent.session.surface.nodes.some((seq) => {
      const event = agent.session.eventAt(seq);
      return event?.type === "user/message" && sameContextPayload(event.data, desired);
    }));
    if (desired === void 0 || alreadySupplied) {
      for (const message of pending) agent.inbox.remove(message.id);
      return;
    }
    const reusable = pending.find((message) => sameContextPayload(message, desired));
    if (reusable !== void 0) {
      for (const message of pending) if (message !== reusable) agent.inbox.remove(message.id);
      return;
    }
    const replaced = pending[0];
    if (replaced === void 0) agent.inbox.prepend("next-step", desired);
    else agent.inbox.replace(replaced.id, desired);
    for (const message of pending.slice(1)) agent.inbox.remove(message.id);
  };
  const composeAndSync = async (agent, signal, claimed, touchedPaths = []) => {
    const desired = await compose(agent, signal, claimed, agent.inbox.nextStep.filter(isAgentInstructionsMessage), touchedPaths);
    signal.throwIfAborted();
    syncInbox(agent, claimed, desired);
  };
  const queueProjection = (agent, touchedPath) => {
    const current = (projectionTails.get(agent) ?? Promise.resolve()).then(() => composeAndSync(agent, projectionLifecycle.signal, [], [touchedPath])).catch((error) => {
      if (!projectionLifecycle.signal.aborted) ctx.logger.warn("workspace instruction refresh failed: %o", error);
    });
    projectionTails.set(agent, current);
    current.then(() => {
      if (projectionTails.get(agent) === current) projectionTails.delete(agent);
    });
  };
  const waitForProjections = async (agent) => {
    let projection;
    while ((projection = projectionTails.get(agent)) !== void 0) await projection;
  };
  const stepIsOpen = (session) => {
    const boundary = ctx.sessionProjections.stateOf(session, "turnBoundary");
    if (boundary === void 0) throw new Error("agent-instructions requires the turnBoundary session projection");
    return boundary.openTurnStartSeq !== null && boundary.lastStepBoundary?.kind === "start" && boundary.lastStepBoundary.seq > boundary.openTurnStartSeq;
  };
  const projectTouch = (touch) => {
    const session = touch.agent.session;
    if (!stepIsOpen(session)) {
      queueProjection(touch.agent, touch.path);
      return;
    }
    const pending = stepTouches.get(session);
    if (pending === void 0) stepTouches.set(session, [touch]);
    else pending.push(touch);
  };
  ctx.on("session/event", (session, event) => {
    if (event.type !== "step/end") return;
    const pending = stepTouches.get(session);
    if (pending === void 0) return;
    stepTouches.delete(session);
    for (const touch of pending) queueProjection(touch.agent, touch.path);
  });
  ctx.on("agent/pre-step", async ({ agent, messages, step, signal }, next) => {
    const decision = await next();
    await waitForProjections(agent);
    const pending = agent.inbox.nextStep.filter(isAgentInstructionsMessage);
    const desired = await compose(agent, signal, messages, pending);
    signal.throwIfAborted();
    if (decision.kind === "reject" || step === 1 && decision.messages.length === 0) {
      syncInbox(agent, messages, desired);
      return decision;
    }
    for (const message of pending) agent.inbox.remove(message.id);
    if (desired === void 0 || decision.messages.some((message) => sameContextPayload(message, desired))) return decision;
    const lastClaimedIndex = decision.messages.findLastIndex((message) => messages.includes(message));
    const entered = decision.messages.toSpliced(lastClaimedIndex + 1, 0, desired);
    return {
      ...decision,
      messages: entered
    };
  });
  ctx.on("tools/result", (exec, result) => {
    const touches = executionTouches.get(exec.token) ?? [];
    executionTouches.delete(exec.token);
    if (!result.isError && exec.agent !== void 0 && !exec.signal.aborted) {
      const ownPath = filePathFromExecution(exec);
      if (ownPath !== void 0) touches.push({
        agent: exec.agent,
        path: ownPath
      });
    }
    if (exec.parent !== void 0) {
      if (touches.length > 0) {
        const parentTouches = executionTouches.get(exec.parent);
        if (parentTouches === void 0) executionTouches.set(exec.parent, touches);
        else parentTouches.push(...touches);
      }
      return;
    }
    for (const touch of touches) projectTouch(touch);
  });
}
export {
  Config,
  apply,
  discoverBaselineInstructionFiles,
  inject,
  loadBaselineInstructions,
  name,
  renderAgentInstructions
};
