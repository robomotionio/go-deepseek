// .harness/packages/fs/fs-local/lib/index.js
import { constants } from "node:buffer";
import { basename, dirname, isAbsolute, join, relative, resolve, sep, toNamespacedPath } from "node:path";
import { pathToFileURL } from "node:url";
import z from "@deepseek-ai/schemastery";
import { FileSystem, FsError, FsTargetKey, FsVersion } from "@deepseek-ai/dsh-fs";
import { randomUUID } from "node:crypto";
import { createReadStream, realpath } from "node:fs";
import { chmod, link, lstat, mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import { TextDecoder, promisify } from "node:util";
var DACL_SECURITY_INFORMATION = 4;
var ERROR_FILE_NOT_FOUND = 2;
var ERROR_PATH_NOT_FOUND = 3;
var ERROR_ACCESS_DENIED = 5;
var bindings;
async function win32() {
  if (bindings !== void 0) return bindings;
  const koffi = (await import("koffi")).default;
  const advapi32 = koffi.load("advapi32.dll");
  const kernel32 = koffi.load("kernel32.dll");
  bindings = {
    getFileSecurityW: advapi32.func("int __stdcall GetFileSecurityW(const char16_t *path, uint32_t requested, void *descriptor, uint32_t length, _Out_ uint32_t *needed)"),
    setFileSecurityW: advapi32.func("int __stdcall SetFileSecurityW(const char16_t *path, uint32_t information, const void *descriptor)"),
    replaceFileW: kernel32.func("int __stdcall ReplaceFileW(const char16_t *replaced, const char16_t *replacement, const char16_t *backup, uint32_t flags, void *exclude, void *reserved)"),
    getLastError: kernel32.func("uint32_t __stdcall GetLastError()")
  };
  return bindings;
}
function errnoCode(win32Code) {
  switch (win32Code) {
    case ERROR_FILE_NOT_FOUND:
    case ERROR_PATH_NOT_FOUND:
      return "ENOENT";
    case ERROR_ACCESS_DENIED:
      return "EACCES";
    default:
      return "EIO";
  }
}
function win32Error(syscall, win32Code, path) {
  const code = errnoCode(win32Code);
  const error = /* @__PURE__ */ new Error(`${syscall} ${code} (Win32 ${win32Code}): ${path}`);
  error.code = code;
  error.errno = win32Code;
  error.syscall = syscall;
  error.path = path;
  error.win32Code = win32Code;
  return error;
}
async function readFileDaclWin32(path) {
  const api = await win32();
  const nativePath = toNamespacedPath(path);
  const needed = [0];
  api.getFileSecurityW(nativePath, DACL_SECURITY_INFORMATION, null, 0, needed);
  if (needed[0] === 0) throw win32Error("GetFileSecurityW", api.getLastError(), path);
  const descriptor = Buffer.alloc(needed[0]);
  if (api.getFileSecurityW(nativePath, DACL_SECURITY_INFORMATION, descriptor, descriptor.length, needed) === 0) throw win32Error("GetFileSecurityW", api.getLastError(), path);
  return descriptor.subarray(0, needed[0]);
}
async function copyFileDaclWin32(source, destination) {
  const descriptor = await readFileDaclWin32(source);
  const api = await win32();
  if (api.setFileSecurityW(toNamespacedPath(destination), 2147483652, descriptor) === 0) throw win32Error("SetFileSecurityW", api.getLastError(), destination);
}
async function replaceFileWin32(replaced, replacement) {
  const api = await win32();
  if (api.replaceFileW(toNamespacedPath(replaced), toNamespacedPath(replacement), null, 0, null, null) === 0) throw win32Error("ReplaceFileW", api.getLastError(), replaced);
}
var BINARY_SAMPLE_BYTES = 8192;
var realpath$1 = promisify(realpath.native);
var DIFF_BASIS_READ_CHUNK_BYTES = 64 * 1024;
function isENOENT(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
function isEEXIST(error) {
  return error instanceof Error && "code" in error && error.code === "EEXIST";
}
function isENOTDIR(error) {
  return error instanceof Error && "code" in error && error.code === "ENOTDIR";
}
function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function isPermissionError(error) {
  return error instanceof Error && "code" in error && (error.code === "EACCES" || error.code === "EPERM");
}
function throwIfAborted(signal, verb) {
  if (signal?.aborted) throw new FsError(`${verb} aborted`, "FS_ABORTED");
}
async function readFileAbortable(absolutePath, verb, signal) {
  try {
    return await readFile(absolutePath, signal ? { signal } : {});
  } catch (error) {
    if (!isAbortError(error)) throw error;
    throw new FsError(`${verb} aborted`, "FS_ABORTED");
  }
}
function versionOf(info) {
  return FsVersion(`${info.dev}:${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`);
}
function localDisplayPath(cwd, path) {
  const absoluteCwd = isAbsolute(cwd) ? cwd : `${process.cwd()}${sep}${cwd}`;
  const raw = isAbsolute(path) ? path : `${absoluteCwd}${sep}${path}`;
  const physicalSpelling = /(?:^|[\\/])\.\.(?:[\\/]|$)/u.test(raw) ? raw : resolve(cwd, path);
  return process.platform === "win32" ? resolve(cwd, path) : physicalSpelling;
}
async function resolveLocalTarget(cwd, path) {
  if (path.trim().length === 0) throw new FsError("file_path must be a non-empty string", "FS_NOT_FOUND");
  const displayPath = localDisplayPath(cwd, path);
  try {
    return {
      displayPath,
      targetKey: FsTargetKey(await realpath$1(displayPath))
    };
  } catch (error) {
    if (isENOTDIR(error)) throw new FsError(`cannot resolve "${displayPath}": a parent path segment is not a directory`, "FS_NOT_FOUND");
    if (!isENOENT(error)) throw error;
  }
  const missing = [basename(displayPath)];
  let ancestor = dirname(displayPath);
  while (true) try {
    const realAncestor = await realpath$1(ancestor);
    if (missing.includes("..")) throw new FsError(`cannot resolve "${displayPath}": parent traversal crosses a missing directory`, "FS_NOT_FOUND");
    if (process.platform === "win32") {
      if (!(await stat(realAncestor)).isDirectory()) throw new FsError(`cannot resolve "${displayPath}": a parent path segment is not a directory`, "FS_NOT_FOUND");
    }
    return {
      displayPath,
      targetKey: FsTargetKey(join(realAncestor, ...missing))
    };
  } catch (error) {
    if (error instanceof FsError) throw error;
    if (!isENOENT(error)) throw error;
    const parent = dirname(ancestor);
    if (parent === ancestor) return {
      displayPath,
      targetKey: FsTargetKey(displayPath)
    };
    missing.unshift(basename(ancestor));
    ancestor = parent;
  }
}
function pathType(info) {
  if (info.isFile()) return "file";
  if (info.isDirectory()) return "directory";
  return "other";
}
function pathLinkType(info) {
  if (info.isSymbolicLink()) return "symlink";
  return pathType(info);
}
async function probeStats(absolutePath, readStats) {
  try {
    return await readStats(absolutePath);
  } catch (error) {
    if (!isENOENT(error) && !isENOTDIR(error)) throw error;
    return null;
  }
}
async function probe(absolutePath) {
  const info = await probeStats(absolutePath, (path) => stat(path, { bigint: true }));
  if (!info) return null;
  return {
    version: versionOf(info),
    mode: Number(info.mode & 511n),
    type: pathType(info),
    size: Number(info.size)
  };
}
async function probeNoFollow(absolutePath) {
  const info = await probeStats(absolutePath, (path) => lstat(path, { bigint: true }));
  if (!info) return null;
  return {
    version: versionOf(info),
    mode: Number(info.mode & 511n),
    type: pathLinkType(info),
    size: Number(info.size)
  };
}
function listingIoError(displayPath, error) {
  if (error instanceof FsError) return error;
  if (isENOENT(error) || isENOTDIR(error)) return new FsError(`cannot list "${displayPath}": not found`, "FS_NOT_FOUND", { cause: error });
  if (isPermissionError(error)) return new FsError(`cannot list "${displayPath}": permission denied`, "FS_PERMISSION_DENIED", { cause: error });
  return new FsError(`cannot list "${displayPath}": ${errorMessage(error)}`, "FS_IO_ERROR", { cause: error });
}
async function resolveListedChildTarget(parent, name) {
  const identity = await resolveLocalTarget(parent.targetKey, name);
  return {
    displayPath: localDisplayPath(parent.displayPath, name),
    targetKey: identity.targetKey
  };
}
async function listDirectory(target, signal) {
  throwIfAborted(signal, "list");
  let info;
  try {
    info = await probe(target.targetKey);
  } catch (error) {
    throw listingIoError(target.displayPath, error);
  }
  if (!info) throw new FsError(`cannot list "${target.displayPath}": not found`, "FS_NOT_FOUND");
  if (info.type !== "directory") throw new FsError(`cannot list "${target.displayPath}": not a directory`, "FS_NOT_DIRECTORY");
  let entries;
  try {
    entries = await readdir(target.targetKey, {
      withFileTypes: true,
      encoding: "utf8"
    });
  } catch (error) {
    throw listingIoError(target.displayPath, error);
  }
  throwIfAborted(signal, "list");
  const result = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    throwIfAborted(signal, "list");
    try {
      const childTarget = await resolveListedChildTarget(target, entry.name);
      const childInfo = await probe(childTarget.targetKey);
      result.push({
        name: entry.name,
        type: childInfo?.type ?? "other",
        target: childTarget,
        ...childInfo ? { version: childInfo.version } : {},
        ...childInfo?.type === "file" ? { size: childInfo.size } : {}
      });
    } catch (error) {
      throw listingIoError(localDisplayPath(target.displayPath, entry.name), error);
    }
    throwIfAborted(signal, "list");
  }
  return result;
}
function notTextError(verb, displayPath) {
  return new FsError(`cannot ${verb} "${displayPath}": invalid UTF-8 text`, "FS_NOT_TEXT");
}
function decodeUtf8(buffer, verb, displayPath) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw notTextError(verb, displayPath);
  }
}
function decodeUtf8Stream(decoder, chunk, verb, displayPath) {
  try {
    return chunk ? decoder.decode(chunk, { stream: true }) : decoder.decode();
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw notTextError(verb, displayPath);
  }
}
async function statRegularFile(target, verb, signal) {
  throwIfAborted(signal, verb);
  let info;
  try {
    info = await stat(target.targetKey);
  } catch (error) {
    if (!isENOENT(error)) throw error;
    throw new FsError(`cannot ${verb} "${target.displayPath}": not found`, "FS_NOT_FOUND");
  }
  if (!info.isFile()) throw new FsError(`cannot ${verb} "${target.displayPath}": not a regular file`, "FS_NOT_REGULAR_FILE");
  return info;
}
async function readWholeText(target, signal) {
  await statRegularFile(target, "read", signal);
  const raw = await readFileAbortable(target.targetKey, "read", signal);
  throwIfAborted(signal, "read");
  if (raw.subarray(0, BINARY_SAMPLE_BYTES).includes(0)) throw new FsError(`cannot read "${target.displayPath}": binary file`, "FS_NOT_TEXT");
  return decodeUtf8(raw, "read", target.displayPath);
}
async function readWholeBytes(target, signal, maxBytes, internals = {}) {
  const info = await statRegularFile(target, "read", signal);
  if (info.size > maxBytes) throw new FsError(`cannot read "${target.displayPath}": ${info.size} bytes exceeds the ${maxBytes}-byte limit`, "FS_TOO_LARGE");
  await internals.inspectReadBytesAfterStat?.(target);
  const stream = createReadStream(target.targetKey, {
    end: maxBytes,
    ...signal ? { signal } : {}
  });
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of stream) {
      bytes += chunk.length;
      if (bytes > maxBytes) throw new FsError(`cannot read "${target.displayPath}": content exceeds the ${maxBytes}-byte limit`, "FS_TOO_LARGE");
      chunks.push(chunk);
    }
  } catch (error) {
    if (isAbortError(error)) throw new FsError("read aborted", "FS_ABORTED");
    throw error;
  }
  return Buffer.concat(chunks, bytes);
}
async function readByteWindow(target, range, signal) {
  await statRegularFile(target, "read", signal);
  if (range.length === 0) return new Uint8Array(0);
  const stream = createReadStream(target.targetKey, {
    start: range.offset,
    end: range.offset + range.length - 1,
    ...signal ? { signal } : {}
  });
  const chunks = [];
  let bytes = 0;
  try {
    for await (const chunk of stream) {
      chunks.push(chunk);
      bytes += chunk.length;
    }
  } catch (error) {
    if (isAbortError(error)) throw new FsError("read aborted", "FS_ABORTED");
    throw error;
  }
  return Buffer.concat(chunks, bytes);
}
async function* streamWholeText(target, signal) {
  await statRegularFile(target, "read", signal);
  const stream = createReadStream(target.targetKey, signal ? { signal } : {});
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let sampledBytes = 0;
  function scanBinarySample(chunk) {
    if (sampledBytes >= BINARY_SAMPLE_BYTES) return;
    const sample = chunk.subarray(0, Math.min(chunk.length, BINARY_SAMPLE_BYTES - sampledBytes));
    if (sample.includes(0)) throw new FsError(`cannot read "${target.displayPath}": binary file`, "FS_NOT_TEXT");
    sampledBytes += sample.length;
  }
  try {
    for await (const chunk of stream) {
      scanBinarySample(chunk);
      yield decodeUtf8Stream(decoder, chunk, "read", target.displayPath);
    }
    yield decodeUtf8Stream(decoder, void 0, "read", target.displayPath);
  } catch (error) {
    if (isAbortError(error)) throw new FsError("read aborted", "FS_ABORTED");
    throw error;
  }
}
async function removeStagingDirOrThrow(stagingDir, originalError, removeStagingDir) {
  try {
    await removeStagingDir(stagingDir);
  } catch (cleanupError) {
    throw new FsError(`write failed (${errorMessage(originalError)}) and temp cleanup failed (${errorMessage(cleanupError)})`, "FS_NOT_FOUND", { cause: originalError });
  }
  throw originalError;
}
async function throwGuardedCreateFailure(error, absolutePath, displayPath, inspectPublicationTarget) {
  let existing;
  try {
    existing = await inspectPublicationTarget(absolutePath);
  } catch (metadataError) {
    if (!isENOENT(metadataError) && !isENOTDIR(metadataError)) throw new FsError(`cannot write "${displayPath}": ${errorMessage(metadataError)}`, "FS_IO_ERROR", { cause: metadataError });
  }
  if (existing !== void 0) {
    if (!existing.isFile()) throw new FsError(`cannot write "${displayPath}": not a regular file`, "FS_NOT_REGULAR_FILE", { cause: error });
    throw new FsError(`cannot overwrite existing "${displayPath}" without reading it first`, "FS_NOT_OBSERVED", { cause: error });
  }
  if (isEEXIST(error)) throw new FsError(`cannot overwrite existing "${displayPath}" without reading it first`, "FS_NOT_OBSERVED", { cause: error });
  throw new FsError(`cannot write "${displayPath}": ${errorMessage(error)}`, "FS_IO_ERROR", { cause: error });
}
async function writeFileAtomic(absolutePath, content, mode, signal, internals = {}, createIfAbsent) {
  throwIfAborted(signal, "write");
  const directory = dirname(absolutePath);
  await mkdir(directory, { recursive: true });
  throwIfAborted(signal, "write");
  const stagingDir = join(directory, internals.tempDirName?.(absolutePath) ?? `.${basename(absolutePath)}.${process.pid}.${randomUUID()}.tmpdir`);
  const tempPath = join(stagingDir, internals.tempName?.(absolutePath) ?? `${basename(absolutePath)}.tmp`);
  const platform = internals.platform ?? process.platform;
  const copyFileDacl = internals.copyFileDacl ?? copyFileDaclWin32;
  const replaceFile = internals.replaceFile ?? replaceFileWin32;
  const linkFile = internals.linkFile ?? link;
  const inspectPublicationTarget = internals.inspectPublicationTarget ?? ((path) => lstat(path, { bigint: true }));
  const removeStagingDir = internals.removeStagingDir ?? ((path) => rm(path, {
    recursive: true,
    force: true
  }));
  let handle;
  let stagingCreated = false;
  try {
    await mkdir(stagingDir, { mode: 448 });
    stagingCreated = true;
    await chmod(stagingDir, 448);
    handle = await open(tempPath, "wx", 384);
    await handle.chmod(384);
    if (platform === "win32" && mode !== void 0) await copyFileDacl(absolutePath, tempPath);
    await handle.writeFile(content, {
      encoding: "utf8",
      ...signal ? { signal } : {}
    });
    await handle.sync();
    await internals.inspectTemp?.({
      stagingDir,
      tempPath
    });
    if (mode !== void 0) await handle.chmod(mode);
    await handle.close();
    handle = void 0;
    throwIfAborted(signal, "write");
    if (createIfAbsent !== void 0) try {
      await linkFile(tempPath, absolutePath);
    } catch (error) {
      await throwGuardedCreateFailure(error, absolutePath, createIfAbsent.displayPath, inspectPublicationTarget);
    }
    else if (platform === "win32" && mode !== void 0) try {
      await replaceFile(absolutePath, tempPath);
    } catch (error) {
      if (!isENOENT(error)) throw error;
      await rename(tempPath, absolutePath);
    }
    else await rename(tempPath, absolutePath);
    try {
      await removeStagingDir(stagingDir);
    } catch (_committedStagingCleanupFailure) {
    }
  } catch (error) {
    let failure = isAbortError(error) ? new FsError("write aborted", "FS_ABORTED") : error;
    if (handle) try {
      await handle.close();
    } catch (closeError) {
      failure = new FsError(`write failed (${errorMessage(failure)}) and temp close failed (${errorMessage(closeError)})`, "FS_NOT_FOUND", { cause: failure });
    }
    if (!stagingCreated) throw failure;
    return removeStagingDirOrThrow(stagingDir, failure, removeStagingDir);
  }
}
function normalizeLineEndings(content) {
  return content.replaceAll("\r\n", "\n");
}
function detectLineEndings(raw) {
  const sample = raw.slice(0, 4096);
  const crlfCount = sample.split("\r\n").length - 1;
  return crlfCount > sample.split("\n").length - 1 - crlfCount ? "CRLF" : "LF";
}
function restoreLineEndings(content, lineEndings) {
  return lineEndings === "LF" ? content : normalizeLineEndings(content).split("\n").join("\r\n");
}
function countOccurrences(content, needle) {
  let count = 0;
  let index = 0;
  while (true) {
    const found = content.indexOf(needle, index);
    if (found === -1) return count;
    count += 1;
    index = found + needle.length;
  }
}
async function readForEdit(absolutePath, displayPath, signal) {
  throwIfAborted(signal, "edit");
  const buffer = await readFileAbortable(absolutePath, "edit", signal);
  throwIfAborted(signal, "edit");
  if (buffer.includes(0)) throw new FsError(`cannot edit "${displayPath}": binary file`, "FS_NOT_TEXT");
  const raw = decodeUtf8(buffer, "edit", displayPath);
  return {
    content: normalizeLineEndings(raw),
    lineEndings: detectLineEndings(raw)
  };
}
async function readTextForDiff(absolutePath, maxBytes, signal) {
  throwIfAborted(signal, "read");
  try {
    const handle = await open(absolutePath, "r");
    let buffer;
    let total = 0;
    let openedSize = 0;
    try {
      throwIfAborted(signal, "read");
      const info = await handle.stat();
      throwIfAborted(signal, "read");
      if (!info.isFile()) return null;
      if (info.size >= maxBytes) return null;
      openedSize = info.size;
      buffer = Buffer.allocUnsafe(openedSize + 1);
      while (total < buffer.length) {
        throwIfAborted(signal, "read");
        const length = Math.min(buffer.length - total, DIFF_BASIS_READ_CHUNK_BYTES);
        const { bytesRead } = await handle.read(buffer, total, length, null);
        if (bytesRead === 0) break;
        total += bytesRead;
      }
    } finally {
      await handle.close();
    }
    throwIfAborted(signal, "read");
    if (total !== openedSize) return null;
    const basis = buffer.subarray(0, total);
    if (basis.includes(0)) return null;
    try {
      return normalizeLineEndings(new TextDecoder("utf-8", { fatal: true }).decode(basis));
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      return null;
    }
  } catch (error) {
    if (error instanceof FsError) throw error;
    if (error instanceof Error && "code" in error) return null;
    throw error;
  }
}
function applyLiteralEdit(content, oldString, newString, replaceAll, displayPath) {
  const oldNorm = normalizeLineEndings(oldString);
  if (oldNorm.length === 0) throw new FsError("old_string must be a non-empty string", "FS_EDIT_NOT_FOUND");
  const newNorm = normalizeLineEndings(newString);
  const replacements = countOccurrences(content, oldNorm);
  if (replacements === 0) throw new FsError(`old_string was not found in "${displayPath}"`, "FS_EDIT_NOT_FOUND");
  if (!replaceAll && replacements > 1) throw new FsError(`old_string matched ${replacements} times in "${displayPath}"; provide a more specific old_string or set replace_all to true`, "FS_AMBIGUOUS_EDIT");
  return {
    content: content.split(oldNorm).join(newNorm),
    replacements
  };
}
var DEFAULT_DIFF_BASIS_MAX_BYTES = 10 * 1024 * 1024;
var MAX_DIFF_BASIS_BYTES = Math.min(constants.MAX_LENGTH, constants.MAX_STRING_LENGTH);
var LocalFileSystem = class extends FileSystem {
  static Config = z.object({
    cwd: z.string().default(process.cwd()),
    diffBasisMaxBytes: z.number().default(DEFAULT_DIFF_BASIS_MAX_BYTES)
  });
  /** Validated config (schemastery applied the defaults before construction). */
  config;
  /** Test hook forwarded to fsio for atomic-publication boundaries. */
  internals = {};
  /** Per-targetKey tail promise: serializes mutating ops so the read→guard→write
  * window can't interleave, making concurrent writes/edits deterministically
  * ordered (one wins, the rest see the new version and reject as stale). */
  locks = /* @__PURE__ */ new Map();
  constructor(ctx, config) {
    super(ctx);
    const resolved = config;
    if (!Number.isSafeInteger(resolved.diffBasisMaxBytes) || resolved.diffBasisMaxBytes <= 0 || resolved.diffBasisMaxBytes > MAX_DIFF_BASIS_BYTES) throw new Error(`fs-local: diffBasisMaxBytes must be a positive safe integer no greater than ${MAX_DIFF_BASIS_BYTES}`);
    this.config = resolved;
  }
  /** Run `op` with exclusive access to `targetKey` (FIFO per key). */
  async withLock(targetKey, op) {
    const run = (this.locks.get(targetKey) ?? Promise.resolve()).then(op, op);
    const tail = run.then(() => void 0, () => void 0);
    this.locks.set(targetKey, tail);
    try {
      return await run;
    } finally {
      if (this.locks.get(targetKey) === tail) this.locks.delete(targetKey);
    }
  }
  async resolve(path, opts) {
    if (opts?.signal?.aborted) throw new FsError("resolve aborted", "FS_ABORTED");
    const local = await resolveLocalTarget(opts?.cwd ?? this.config.cwd, path);
    if (opts?.signal?.aborted) throw new FsError("resolve aborted", "FS_ABORTED");
    return {
      targetKey: local.targetKey,
      displayPath: local.displayPath
    };
  }
  processPath(target) {
    return String(target.targetKey);
  }
  processPathFromHostPath(hostPath) {
    return isAbsolute(hostPath) ? resolve(hostPath) : void 0;
  }
  fileUrl(target) {
    return pathToFileURL(this.processPath(target)).href;
  }
  contains(parent, child) {
    const path = relative(this.processPath(parent), this.processPath(child));
    return path === "" || path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
  }
  async stat(target, signal) {
    if (signal?.aborted) throw new FsError("stat aborted", "FS_ABORTED");
    const info = await probe(target.targetKey);
    if (signal?.aborted) throw new FsError("stat aborted", "FS_ABORTED");
    if (!info) return void 0;
    return {
      version: info.version,
      type: info.type,
      size: info.size
    };
  }
  async lstat(path, opts, signal) {
    if (signal?.aborted) throw new FsError("lstat aborted", "FS_ABORTED");
    if (path.trim().length === 0) throw new FsError("file_path must be a non-empty string", "FS_NOT_FOUND");
    const info = await probeNoFollow(localDisplayPath(opts?.cwd ?? this.config.cwd, path));
    if (signal?.aborted) throw new FsError("lstat aborted", "FS_ABORTED");
    if (!info) return void 0;
    return {
      version: info.version,
      type: info.type,
      size: info.size
    };
  }
  async readText(target, signal) {
    return readWholeText({
      displayPath: target.displayPath,
      targetKey: target.targetKey
    }, signal);
  }
  streamText(target, signal) {
    return Promise.resolve(streamWholeText({
      displayPath: target.displayPath,
      targetKey: target.targetKey
    }, signal));
  }
  async readBytes(target, signal, maxBytes) {
    return readWholeBytes({
      displayPath: target.displayPath,
      targetKey: target.targetKey
    }, signal, maxBytes, this.internals);
  }
  async readByteRange(target, range, signal) {
    return readByteWindow({
      displayPath: target.displayPath,
      targetKey: target.targetKey
    }, range, signal);
  }
  async listDir(target, signal) {
    return (await listDirectory({
      displayPath: target.displayPath,
      targetKey: target.targetKey
    }, signal)).map((entry) => ({
      name: entry.name,
      type: entry.type,
      target: {
        targetKey: entry.target.targetKey,
        displayPath: entry.target.displayPath
      },
      ...entry.version !== void 0 ? { version: entry.version } : {},
      ...entry.size !== void 0 ? { size: entry.size } : {}
    }));
  }
  async writeText(target, content, expected, signal) {
    return this.withLock(target.targetKey, async () => {
      const existing = await probe(target.targetKey);
      if (existing && existing.type !== "file") throw new FsError(`cannot write "${target.displayPath}": not a regular file`, "FS_NOT_REGULAR_FILE");
      if (expected?.kind === "replaceIfVersion") {
        if (!existing) throw new FsError(`cannot write "${target.displayPath}": file no longer exists`, "FS_STALE_VERSION");
        if (existing.version !== expected.version) throw new FsError(`cannot write "${target.displayPath}": file changed since it was read`, "FS_STALE_VERSION");
      } else if (expected?.kind === "createIfAbsent" && existing) throw new FsError(`cannot overwrite existing "${target.displayPath}" without reading it first`, "FS_NOT_OBSERVED");
      const before = existing !== null && Buffer.byteLength(content, "utf8") < this.config.diffBasisMaxBytes ? await readTextForDiff(target.targetKey, this.config.diffBasisMaxBytes, signal) : null;
      await writeFileAtomic(target.targetKey, content, existing?.mode, signal, this.internals, expected?.kind === "createIfAbsent" ? { displayPath: target.displayPath } : void 0);
      const after = await probe(target.targetKey);
      return {
        operation: existing ? "update" : "create",
        version: this.versionAfterWrite(after, target),
        before,
        after: normalizeLineEndings(content)
      };
    });
  }
  async editText(target, edit, expected, signal) {
    return this.withLock(target.targetKey, async () => {
      const existing = await probe(target.targetKey);
      if (!existing) throw new FsError(`cannot edit "${target.displayPath}": file changed since it was read`, "FS_STALE_VERSION");
      if (existing.type !== "file") throw new FsError(`cannot edit "${target.displayPath}": not a regular file`, "FS_NOT_REGULAR_FILE");
      if (expected && existing.version !== expected.version) throw new FsError(`cannot edit "${target.displayPath}": file changed since it was read`, "FS_STALE_VERSION");
      const original = await readForEdit(target.targetKey, target.displayPath, signal);
      const edited = applyLiteralEdit(original.content, edit.oldString, edit.newString, edit.replaceAll, target.displayPath);
      const content = restoreLineEndings(edited.content, original.lineEndings);
      await writeFileAtomic(target.targetKey, content, existing.mode, signal, this.internals);
      const after = await probe(target.targetKey);
      return {
        version: this.versionAfterWrite(after, target),
        before: original.content,
        after: edited.content
      };
    });
  }
  /* v8 ignore next 5 -- the post-write probe finding the file absent requires a
  * concurrent unlink between rename and stat; fall back to a sentinel version. */
  versionAfterWrite(after, target) {
    if (after) return after.version;
    return FsVersion(`missing:${target.targetKey}`);
  }
};
export {
  LocalFileSystem,
  LocalFileSystem as default
};
