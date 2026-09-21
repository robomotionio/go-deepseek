// .harness/packages/subprocess/subprocess/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { proxyEnvironmentForChild } from "@deepseek-ai/dsh-http-proxy";
var DSH_ENV_PREFIX = "DSH_";
var SENSITIVE_ENV_PATTERN = /KEY|PASSWORD|SECRET|TOKEN/i;
function scrubbedParentEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) if (value !== void 0 && !SENSITIVE_ENV_PATTERN.test(key) && !key.toUpperCase().startsWith("DSH_")) env[key] = value;
  for (const [name, value] of Object.entries(proxyEnvironmentForChild())) if (value === void 0) Reflect.deleteProperty(env, name);
  else env[name] = value;
  return env;
}
var SubprocessRuntime = class extends Service {
  constructor(ctx) {
    super(ctx, "subprocess");
  }
};
var SubprocessExecutableNotFoundError = class extends Error {
  /**
  * @param message - provider-specific lookup diagnostic.
  * @param options - original provider failure, when available.
  */
  constructor(message, options) {
    super(message, options);
    this.name = "SubprocessExecutableNotFoundError";
  }
};
export {
  DSH_ENV_PREFIX,
  SENSITIVE_ENV_PATTERN,
  SubprocessExecutableNotFoundError,
  SubprocessRuntime,
  SubprocessRuntime as default,
  scrubbedParentEnv
};
