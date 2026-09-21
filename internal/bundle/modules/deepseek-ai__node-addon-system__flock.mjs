// .harness/native/system/packages/entry/lib/flock.js
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { getSystemErrorName } from "node:util";
var binding;
function loadBinding() {
  if (binding)
    return binding;
  const { platform, arch } = process;
  if (platform !== "linux" && platform !== "darwin") {
    throw Object.assign(new Error(`flock is not supported on ${platform}-${arch}`), {
      code: "ERR_FLOCK_UNSUPPORTED_PLATFORM",
      syscall: "flock"
    });
  }
  let filename = "system.node";
  if (platform === "linux") {
    const report = process.report.getReport();
    filename = join(report.header.glibcVersionRuntime ? "glibc" : "musl", filename);
  }
  const require2 = createRequire(import.meta.url);
  const manifest = require2.resolve(`@deepseek-ai/node-addon-system-${platform}-${arch}/package.json`);
  binding = require2(join(dirname(manifest), "bin", filename));
  return binding;
}
async function tryLockExclusive(fd) {
  const errno = await new Promise((resolve) => {
    loadBinding().tryLock(fd, resolve);
  });
  if (errno === 0)
    return;
  const code = getSystemErrorName(-errno);
  throw Object.assign(new Error(`${code}: flock failed`), {
    code,
    errno,
    syscall: "flock"
  });
}
export {
  tryLockExclusive
};
