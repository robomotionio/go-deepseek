// .harness/packages/util/atomic-write/lib/index.js
import { randomBytes } from "node:crypto";
import { lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
var WINDOWS_TRANSIENT_RENAME_ERRORS = /* @__PURE__ */ new Set([
  "EACCES",
  "EBUSY",
  "EPERM"
]);
var WINDOWS_RENAME_RETRY_INITIAL_MS = 20;
var WINDOWS_RENAME_RETRY_MAX_MS = 200;
var WINDOWS_RENAME_RETRY_LIMIT = 8;
function isTransientWindowsRenameError(error) {
  if (process.platform !== "win32") return false;
  return WINDOWS_TRANSIENT_RENAME_ERRORS.has(error?.code ?? "");
}
async function renameAtomicTemp(temp, filename) {
  let delay = WINDOWS_RENAME_RETRY_INITIAL_MS;
  for (let retries = 0; ; retries += 1) {
    try {
      await rename(temp, filename);
      return;
    } catch (error) {
      if (!isTransientWindowsRenameError(error)) throw error;
      if (retries >= WINDOWS_RENAME_RETRY_LIMIT) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, WINDOWS_RENAME_RETRY_MAX_MS);
  }
}
async function writeFileAtomic(filename, content, options) {
  await mkdir(dirname(filename), {
    recursive: true,
    ...options.dirMode === void 0 ? {} : { mode: options.dirMode }
  });
  const temp = `${filename}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await writeFile(temp, content, {
      mode: options.mode,
      flag: "wx"
    });
    await renameAtomicTemp(temp, filename);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}
async function isLockContention(error, lockPath) {
  const code = error?.code;
  if (code === "EEXIST") return true;
  if (code !== "EPERM") return false;
  try {
    await lstat(lockPath);
    return true;
  } catch {
    return false;
  }
}
var LOCK_RETRY_INITIAL_MS = 20;
var LOCK_RETRY_MAX_MS = 200;
var DEFAULT_LOCK_WAIT_MS = 2e3;
async function withFileLock(filename, operation, options) {
  const lockPath = `${filename}.lock`;
  const deadline = Date.now() + (options?.waitMs ?? DEFAULT_LOCK_WAIT_MS);
  let delay = LOCK_RETRY_INITIAL_MS;
  let retriedUnconfirmedPermissionError = false;
  for (; ; ) {
    try {
      await writeFile(lockPath, `${process.pid}
`, {
        mode: 384,
        flag: "wx"
      });
      break;
    } catch (error) {
      if (!await isLockContention(error, lockPath)) {
        if (process.platform !== "win32" || error?.code !== "EPERM" || retriedUnconfirmedPermissionError) throw error;
        retriedUnconfirmedPermissionError = true;
      }
    }
    if (Date.now() >= deadline) throw new Error(`atomic-write: timed out waiting for the writer lock at ${lockPath}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, LOCK_RETRY_MAX_MS);
  }
  try {
    return await operation();
  } finally {
    await rm(lockPath, { force: true });
  }
}
export {
  withFileLock,
  writeFileAtomic
};
