// .harness/packages/identity/anonymous-user-id/lib/index.js
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
var ANONYMOUS_USER_ID_FILE_NAME = ".anonymous-user-id";
var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var memo = /* @__PURE__ */ new Map();
function readPersistedId(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  const value = text.trim();
  return UUID_PATTERN.test(value) ? value : void 0;
}
function getOrCreateAnonymousUserId(options = {}) {
  const file = join(resolveDshHome(void 0, options.env ?? process.env), ANONYMOUS_USER_ID_FILE_NAME);
  const cached = memo.get(file);
  if (cached !== void 0) return cached;
  let id = readPersistedId(file);
  if (id === void 0) {
    const created = (options.randomUUID ?? randomUUID)();
    try {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${created}
`, {
        encoding: "utf8",
        flag: "wx"
      });
      id = created;
    } catch {
      id = readPersistedId(file);
      if (id === void 0) {
        try {
          writeFileSync(file, `${created}
`, "utf8");
        } catch {
        }
        id = created;
      }
    }
  }
  memo.set(file, id);
  return id;
}
export {
  ANONYMOUS_USER_ID_FILE_NAME,
  getOrCreateAnonymousUserId
};
