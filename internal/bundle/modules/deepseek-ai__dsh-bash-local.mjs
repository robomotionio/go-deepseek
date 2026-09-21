// .harness/packages/shell/bash-local/lib/index.js
import z from "@deepseek-ai/schemastery";
import { SHELL_SETTINGS_NAMESPACE, ShellExecutor } from "@deepseek-ai/dsh-shell";
import { MAX_TIMER_DELAY_MS, clampTimeout, deadline, timeoutOf } from "@deepseek-ai/dsh-timeout";
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
var ENV_OVERRIDES = {
  NO_COLOR: "1",
  TERM: "dumb",
  PAGER: "cat",
  GIT_PAGER: "cat"
};
var DEFAULT_GRACE_MS = 3e3;
var DEFAULT_MAX_SPILL_BYTES = 64 * 1024 * 1024;
function finalOutput(reader) {
  const read = reader.readFrom(0);
  return {
    text: read.text,
    truncated: read.lossy,
    ...read.spillPath !== void 0 ? { spillPath: read.spillPath } : {}
  };
}
function assertPositiveFinite(name, value) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`bash-local: ${name} must be a positive finite number`);
}
function assertServiceableBashConfig(config) {
  const resolved = config;
  assertPositiveFinite("timeoutMs", resolved.timeoutMs);
  assertPositiveFinite("maxTimeoutMs", resolved.maxTimeoutMs);
  assertPositiveFinite("maxOutputBytes", resolved.maxOutputBytes);
  assertPositiveFinite("maxSpillBytes", resolved.maxSpillBytes);
  assertPositiveFinite("graceMs", resolved.graceMs);
  if (resolved.graceMs > MAX_TIMER_DELAY_MS) throw new Error(`bash-local: graceMs must be no greater than ${MAX_TIMER_DELAY_MS}`);
}
var LocalBashExecutor = class LocalBashExecutor2 extends ShellExecutor {
  static inject = ["subprocess"];
  static Config = z.object({
    cwd: z.string(),
    timeoutMs: z.number().default(12e4),
    maxTimeoutMs: z.number().default(6e5),
    maxOutputBytes: z.number().default(64e3),
    maxSpillBytes: z.number().default(DEFAULT_MAX_SPILL_BYTES),
    graceMs: z.number().default(DEFAULT_GRACE_MS)
  });
  /** The currently authoritative config: the settings section, or the composition entry. */
  source;
  /** Validated config (schemastery applied the defaults before construction). */
  get config() {
    return this.source();
  }
  constructor(ctx, config) {
    super(ctx);
    const entry = config;
    assertServiceableBashConfig(entry);
    this.source = () => entry;
    ctx.inject(["settings"], (settingsCtx) => {
      settingsCtx.settings.installSection(ctx, SHELL_SETTINGS_NAMESPACE, LocalBashExecutor2.Config, entry, {
        validate: assertServiceableBashConfig,
        setSource: (current) => {
          this.source = current;
        },
        onChange: () => {
        }
      });
    });
  }
  /**
  * Resolve a request into a fully-specified spec: fill `workdir` from
  * `config.cwd` (else `process.cwd()`), and `timeoutMs` from
  * `config.timeoutMs`, capped at `config.maxTimeoutMs`. The tool layer calls
  * this before {@link run}/{@link start}, so those methods receive explicit
  * values and never re-default.
  */
  resolve(request) {
    const timeoutMs = clampTimeout(request.timeoutMs, this.config.timeoutMs, this.config.maxTimeoutMs, "bash-local: request.timeoutMs");
    const stdoutMaxBytes = request.stdoutMaxBytes ?? this.config.maxOutputBytes;
    assertPositiveFinite("request.stdoutMaxBytes", stdoutMaxBytes);
    return {
      command: request.command,
      workdir: request.workdir ?? this.config.cwd ?? process.cwd(),
      timeoutMs,
      stdoutMaxBytes,
      ...request.signal ? { signal: request.signal } : {},
      ...request.stdin !== void 0 ? { stdin: request.stdin } : {},
      ...request.env !== void 0 ? { env: request.env } : {},
      ...request.dshEnv !== void 0 ? { dshEnv: request.dshEnv } : {},
      sandboxPolicy: request.sandboxPolicy
    };
  }
  /** Map one resolved bash spec and explicit argv onto a fully-specified subprocess spawn. */
  spawnSpec(spec, argv, stdoutMaxBytes, signal) {
    const collect = (maxBytes) => ({
      maxBytes,
      spill: { maxBytes: this.config.maxSpillBytes }
    });
    return {
      argv,
      cwd: spec.workdir,
      stdio: {
        stdin: spec.stdin !== void 0 ? { data: spec.stdin } : "ignore",
        stdout: collect(stdoutMaxBytes),
        stderr: collect(this.config.maxOutputBytes)
      },
      graceMs: this.config.graceMs,
      signal,
      env: {
        ...ENV_OVERRIDES,
        ...spec.env,
        ...spec.dshEnv
      }
    };
  }
  /** The collect-mode readers the executor itself requested (present by construction). */
  static collected(handle) {
    const { stdout, stderr } = handle.collected;
    if (stdout === void 0 || stderr === void 0) throw new Error("bash-local: subprocess implementation dropped a requested collect stream");
    return {
      stdout,
      stderr
    };
  }
  async run(spec) {
    return (await this.runArgv(spec, [
      "bash",
      "-c",
      spec.command
    ])).result;
  }
  /**
  * Run an explicit argv with the foreground lifecycle, environment, output,
  * timeout, and cancellation semantics of this executor. Subclasses use this
  * after replacing the public command's shell argv at an execution boundary.
  * @param spec - resolved execution settings and caller-owned command metadata.
  * @param argvOrPrepare - exact argv, or preparation cancelled by the same deadline as execution.
  * @returns the foreground result and whether argv reached the subprocess provider.
  */
  async runArgv(spec, argvOrPrepare) {
    const env_1 = {
      stack: [],
      error: void 0,
      hasError: false
    };
    try {
      const d = __addDisposableResource(env_1, deadline(spec.signal, spec.timeoutMs, "BASH_TIMEOUT"), false);
      let argv;
      if (typeof argvOrPrepare === "function") {
        const cancelled = Promise.withResolvers();
        const abort = () => {
          cancelled.reject(d.signal.reason);
        };
        d.signal.addEventListener("abort", abort, { once: true });
        try {
          argv = await Promise.race([Promise.resolve().then(() => {
            d.signal.throwIfAborted();
            return argvOrPrepare(d.signal);
          }), cancelled.promise]);
          d.signal.throwIfAborted();
        } catch (error) {
          if (timeoutOf(d.signal, "BASH_TIMEOUT") === void 0) throw error;
          return {
            spawnRequested: false,
            result: {
              exitCode: null,
              signal: null,
              timedOut: true,
              aborted: false,
              timeoutMs: spec.timeoutMs,
              stdout: {
                text: "",
                truncated: false
              },
              stderr: {
                text: "",
                truncated: false
              }
            }
          };
        } finally {
          d.signal.removeEventListener("abort", abort);
        }
      } else argv = argvOrPrepare;
      const handle = this.ctx.subprocess.spawn(this.spawnSpec(spec, argv, spec.stdoutMaxBytes, d.signal));
      const outcome = await handle.done;
      const collected = LocalBashExecutor2.collected(handle);
      const timedOut = timeoutOf(d.signal, "BASH_TIMEOUT") !== void 0;
      const aborted = d.signal.aborted && !timedOut;
      return {
        spawnRequested: true,
        result: {
          ...outcome,
          timedOut,
          aborted,
          timeoutMs: spec.timeoutMs,
          stdout: finalOutput(collected.stdout),
          stderr: finalOutput(collected.stderr)
        }
      };
    } catch (e_1) {
      env_1.error = e_1;
      env_1.hasError = true;
    } finally {
      __disposeResources(env_1);
    }
  }
  async start(spec) {
    return Promise.resolve(this.startArgv(spec, [
      "bash",
      "-c",
      spec.command
    ]));
  }
  /**
  * Start an explicit argv with the background lifecycle, environment, output,
  * cancellation, and managed-range ownership semantics of this executor.
  * Subclasses use this after replacing the public command's shell argv at an
  * execution boundary.
  * @param spec - resolved execution settings and caller-owned command metadata.
  * @param argv - exact executable and arguments to hand to `ctx.subprocess`.
  * @returns the live background handle; provider rejection settles it as killed.
  */
  startArgv(spec, argv) {
    spec.signal?.throwIfAborted();
    const running = this.ctx.subprocess.spawn(this.spawnSpec(spec, argv, this.config.maxOutputBytes, spec.signal));
    const collected = LocalBashExecutor2.collected(running);
    let providerFailureNote;
    const consumeProviderFailure = () => {
      const note = providerFailureNote ?? "";
      providerFailureNote = void 0;
      return note;
    };
    let stdoutOffset = 0;
    let stderrOffset = 0;
    const proc = {
      status: "running",
      exitCode: null,
      signal: null,
      done: running.done.then((outcome) => {
        if (proc.status === "running") proc.status = spec.signal?.aborted === true || outcome.signal !== null ? "killed" : "completed";
        proc.exitCode = outcome.exitCode;
        proc.signal = outcome.signal;
        this.onProcessDone(proc, collected.stderr.readFrom(0).text, false);
      }, (error) => {
        proc.status = "killed";
        let detail = "unprintable provider failure";
        try {
          detail = String(error);
        } catch {
        }
        providerFailureNote = `subprocess failed before reporting an outcome: ${detail}`;
        this.onProcessDone(proc, providerFailureNote, true, error);
      }),
      readOutput: () => {
        const out = collected.stdout.readFrom(stdoutOffset);
        const err = collected.stderr.readFrom(stderrOffset);
        stdoutOffset = out.nextOffset;
        stderrOffset = err.nextOffset;
        const providerFailure = consumeProviderFailure();
        const failureSeparator = err.text.length > 0 && !err.text.endsWith("\n") ? "\n" : "";
        const errText = err.text + (providerFailure.length > 0 ? `${failureSeparator}${providerFailure}` : "");
        const separator = out.text.length > 0 && !out.text.endsWith("\n") ? "\n" : "";
        return {
          delta: out.text + (errText.length > 0 ? `${separator}[stderr]
${errText}` : ""),
          lossy: out.lossy || err.lossy,
          ...out.spillPath !== void 0 ? { stdoutSpillPath: out.spillPath } : {},
          ...err.spillPath !== void 0 ? { stderrSpillPath: err.spillPath } : {}
        };
      },
      kill: () => {
        if (proc.status !== "running") return false;
        proc.status = "killed";
        running.terminate();
        return true;
      }
    };
    return proc;
  }
  /**
  * Settlement hook for subclasses that attach execution facts to a process.
  * Called after exit facts or provider-failure output are stamped and before
  * {@link ShellProcess.done} resolves. The base implementation is intentionally
  * empty.
  * @param _proc - the settled process handle.
  * @param _stderr - the process's retained stderr tail used by subclasses for settlement classification.
  * @param _providerRejected - whether the subprocess promise rejected without a direct outcome.
  * @param _providerError - the provider rejection reason, which may itself be undefined.
  */
  onProcessDone(_proc, _stderr, _providerRejected, _providerError) {
  }
};
export {
  ENV_OVERRIDES,
  LocalBashExecutor,
  assertServiceableBashConfig,
  LocalBashExecutor as default
};
