// .harness/packages/shell/shell/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { DSH_ENV_PREFIX } from "@deepseek-ai/dsh-subprocess";
function parseExitStatus(text) {
  const signal = /\n\[killed by signal: ([^\]\n]+)\]$/.exec(text);
  if (signal?.[1] !== void 0) return {
    body: text.slice(0, signal.index),
    signal: signal[1]
  };
  const exit = /\n\[exit code: (\d+)\]$/.exec(text);
  if (exit?.[1] !== void 0) return {
    body: text.slice(0, exit.index),
    exitCode: Number(exit[1])
  };
  return {
    body: text,
    exitCode: 0
  };
}
var SHELL_SETTINGS_NAMESPACE = "shell";
var ShellExecutor = class extends Service {
  constructor(ctx) {
    super(ctx, "shell");
  }
  /**
  * The sandbox mode this executor applies by default, or `undefined` when it
  * does not sandbox commands.
  * @returns the configured default sandbox mode, when supported.
  */
  get sandboxMode() {
  }
};
export {
  DSH_ENV_PREFIX,
  SHELL_SETTINGS_NAMESPACE,
  ShellExecutor,
  ShellExecutor as default,
  parseExitStatus
};
