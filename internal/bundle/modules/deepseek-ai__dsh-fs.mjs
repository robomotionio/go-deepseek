// .harness/packages/fs/fs/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { HarnessError } from "@deepseek-ai/dsh-llm";
function FsTargetKey(key) {
  return key;
}
function FsVersion(v) {
  return v;
}
var FsError = class extends HarnessError {
  code;
  constructor(message, code, options) {
    super(message, code, options);
    this.code = code;
  }
};
var FileSystem = class extends Service {
  constructor(ctx) {
    super(ctx, "fs");
  }
  /**
  * The sandbox mode this backend enforces on mutations BY DEFAULT, or
  * `undefined` when it does not confine at all — the capability fact the tool
  * layer reads to advertise the escalation fields honestly (mirrors
  * `ShellExecutor.sandboxMode`). The base class and the bare local backend
  * report `undefined`; a sandboxing backend (`@deepseek-ai/dsh-fs-sandbox`)
  * overrides it with the deployment default. A session override may make the
  * effective mode narrower or wider, so strict escalation widening is checked
  * per call rather than encoded in this default-relative fact.
  * @returns the configured default mode of a sandboxing backend; `undefined`
  *   for a backend that never confines.
  */
  get sandboxMode() {
  }
  /**
  * Map an absolute path from the harness host into this filesystem's
  * execution world when both paths identify the same file. The base provider
  * exposes no mapping; host-backed or explicitly shared backends override it.
  * @param hostPath - absolute path in the harness host filesystem.
  * @returns the process path for the same file, or undefined when this
  *   execution world cannot read that host file.
  */
  processPathFromHostPath(hostPath) {
  }
};
export {
  FileSystem,
  FsError,
  FsTargetKey,
  FsVersion,
  FileSystem as default
};
