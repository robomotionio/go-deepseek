// .harness/packages/shell/tool-bash/lib/index.js
import z from "@deepseek-ai/schemastery";
import { isAbsolute, sep } from "node:path";
import { TOOL_ABORTED, defineTool } from "@deepseek-ai/dsh-tools";
import { HarnessError } from "@deepseek-ai/dsh-llm";
import { ESCALATION_TARGETS, approveEscalation, escalationHintMarker, sandboxDenialMarker, sandboxPermissionsDescription, validateEscalationArgs } from "@deepseek-ai/dsh-sandbox";
import { DSH_ENV_PREFIX, parseExitStatus } from "@deepseek-ai/dsh-shell";
function sandboxNotes(sandbox, escalationModes) {
  if (sandbox?.runnerFailed) return [`[sandbox: the sandbox runner itself failed under ${sandbox.mode} mode \u2014 the command did not run; this is a sandbox problem, not a command failure]`];
  if (sandbox?.denied) {
    const notes = [sandboxDenialMarker(sandbox.mode)];
    if (escalationModes.length > 0) notes.push(escalationHintMarker("command"));
    return notes;
  }
  return [];
}
function processOutcome(proc, escalationModes = []) {
  const base = proc.status === "killed" ? {
    status: "killed",
    detail: proc.signal !== null ? `signal: ${proc.signal}` : "killed before exit"
  } : {
    status: "completed",
    detail: `exit code: ${proc.exitCode ?? 0}`
  };
  const notes = sandboxNotes(proc.sandbox, escalationModes);
  return notes.length === 0 ? base : {
    ...base,
    detail: `${base.detail}; ${notes.join(" ")}`
  };
}
function processSources(proc) {
  const source = (channel) => ({
    channel,
    read: (fromByte) => {
      const live = proc();
      return live === void 0 ? {
        text: "",
        nextOffset: fromByte,
        lossy: false
      } : live.observed[channel].readFrom(fromByte);
    }
  });
  return [source("stdout"), source("stderr")];
}
function ringDelta(chunks) {
  const out = chunks.filter((chunk) => chunk.channel !== "stderr").map((chunk) => chunk.text).join("");
  const err = chunks.filter((chunk) => chunk.channel === "stderr").map((chunk) => chunk.text).join("");
  const separator = out.length > 0 && !out.endsWith("\n") ? "\n" : "";
  return out + (err.length > 0 ? `${separator}[stderr]
${err}` : "");
}
function processJob(start, outcome) {
  const controller = new AbortController();
  let process;
  return {
    cancel: (reason) => {
      if (controller.signal.aborted) return;
      controller.abort(reason);
      process?.kill();
    },
    done: (async () => {
      try {
        process = await start(controller.signal);
        try {
          if (controller.signal.aborted) process.kill();
        } finally {
          await process.done;
        }
        return outcome(process);
      } catch (error) {
        return {
          status: controller.signal.aborted && process === void 0 ? "killed" : "failed",
          detail: error instanceof Error ? error.message : String(error)
        };
      }
    })()
  };
}
function streamText(output) {
  if (!output.truncated) return output.text;
  return `${output.text}
[output truncated; full output: ${output.spillPath ?? "(unavailable)"}]`;
}
function renderResult(result, escalationModes = []) {
  const out = streamText(result.stdout);
  const err = streamText(result.stderr);
  let body = out;
  if (err.length > 0) {
    if (body.length > 0 && !body.endsWith("\n")) body += "\n";
    body += `[stderr]
${err}`;
  }
  if (body.length === 0) body = "(no output)";
  const markers = [];
  if (result.sandbox?.denied) {
    markers.push(sandboxDenialMarker(result.sandbox.mode));
    if (escalationModes.length > 0) markers.push(escalationHintMarker("command"));
  }
  if (result.timedOut) markers.push(`[timed out after ${result.timeoutMs}ms]`);
  if (result.stopped !== void 0) markers.push(`[stopped: ${result.stopped}]`);
  if (result.signal !== null) markers.push(`[killed by signal: ${result.signal}]`);
  else if (result.exitCode !== 0) markers.push(`[exit code: ${result.exitCode}]`);
  if (markers.length === 0) return body;
  if (!body.endsWith("\n")) body += "\n";
  return body + markers.join("\n");
}
function renderPromoted(promoted) {
  return `${promoted.output.length > 0 ? promoted.output.endsWith("\n") ? promoted.output : `${promoted.output}
` : ""}[still running after ${promoted.timeoutMs}ms; moved to background job ${promoted.jobId}]
The command keeps running in the background. You will be notified when it finishes; read newer output with job_output, stop it with job_kill.`;
}
function renderJobRead(delta, lossy, spillPaths, sandbox, escalationModes = []) {
  const notices = [];
  if (lossy) notices.push(`[some output was dropped from memory; full output: ${spillPaths.length > 0 ? spillPaths.join(", ") : "(unavailable)"}]`);
  if (sandbox?.runnerFailed) notices.push(`[sandbox: the sandbox runner itself failed under ${sandbox.mode} mode \u2014 the command did not run; this is a sandbox problem, not a command failure]`);
  else if (sandbox?.denied) {
    notices.push(sandboxDenialMarker(sandbox.mode));
    if (escalationModes.length > 0) notices.push(escalationHintMarker("command"));
  }
  if (notices.length === 0) return delta;
  return `${delta}${delta.length > 0 && !delta.endsWith("\n") ? "\n" : ""}${notices.join("\n")}`;
}
var name = "tool-bash";
var inject = [
  "tools",
  "shell",
  "systemPrompt",
  "shellEnv"
];
var Config = z.object({
  enableRunInBackground: z.boolean().default(true),
  promoteOnTimeout: z.boolean().default(true)
});
function validateBashArgs(args, effectiveMode) {
  if (args.command.trim().length === 0) throw new Error("invalid command: expected a non-empty string");
  if (args.description.trim().length === 0) throw new Error("invalid description: expected a non-empty string");
  if (args.timeoutMs !== void 0 && (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0)) throw new Error(`invalid timeoutMs: expected a positive number, got ${JSON.stringify(args.timeoutMs)}`);
  if (args.sandbox_permissions !== void 0 && args.sandbox_permissions === effectiveMode) return;
  const justification = args.sandbox_permissions === void 0 && args.justification?.trim() === "" ? void 0 : args.justification;
  validateEscalationArgs(args.sandbox_permissions, justification);
}
function bashDescription() {
  return `Execute a bash command (\`bash -c\`) and return its stdout/stderr. Each call runs in a fresh shell; pass \`workdir\` instead of using \`cd\`. Managed \`$${DSH_ENV_PREFIX}*\` variables expose current harness environment facts. Long output is truncated to its tail; the full output is saved to a file whose path is reported when available. Before any delete or move, verify that the resolved absolute target path is the intended one; never run it against a computed path you have not checked. An unset variable expands to an empty string, so guard variables in such paths with \`\${VAR:?}\`. Commands may run under a file sandbox; a blocked file operation is reported as \`[sandbox: file access denied under <mode> mode]\`, a policy denial: do not retry another way.`;
}
function presentBashCall(args) {
  if (args.run_in_background === true) return {
    card: "generic",
    title: args.command,
    kind: "execute",
    rawInput: args.command,
    content: [{
      type: "text",
      text: args.description
    }]
  };
  return {
    card: "terminal",
    title: args.command,
    description: args.description,
    ...args.workdir !== void 0 ? { cwd: args.workdir } : {}
  };
}
function presentBashResult(args, result) {
  const block = result.content.length === 1 ? result.content[0] : void 0;
  if (block === void 0 || block.type !== "text") return void 0;
  const raw = block.text;
  const isBackground = typeof args === "object" && args !== null && args.run_in_background === true;
  const isPromoted = result.value?.kind === "promoted";
  if (isBackground || isPromoted || result.isError) return {
    card: "generic",
    content: [{
      type: "text",
      text: `\`\`\`console
${raw.replace(/\n+$/, "")}
\`\`\``
    }]
  };
  const { body, ...exit } = parseExitStatus(raw);
  return {
    card: "terminal",
    output: body,
    ...exit
  };
}
function resolveWorkdir(modelWorkdir, exec, policyWorkspaceRoot) {
  const headerCwd = exec.agent?.session.header.cwd;
  const sessionCwd = policyWorkspaceRoot ?? headerCwd;
  if (modelWorkdir === void 0) return sessionCwd;
  if (sessionCwd !== void 0 && !isAbsolute(modelWorkdir)) return `${sessionCwd}${sep}${modelWorkdir}`;
  return modelWorkdir;
}
function canonicalBashResult(result) {
  const output = (stream) => ({
    text: stream.text,
    truncated: stream.truncated,
    ...stream.spillPath !== void 0 ? { spillPath: stream.spillPath } : {}
  });
  return {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    aborted: result.aborted,
    timeoutMs: result.timeoutMs,
    stdout: output(result.stdout),
    stderr: output(result.stderr),
    ...result.sandbox !== void 0 ? { sandbox: {
      mode: result.sandbox.mode,
      denied: result.sandbox.denied,
      ...result.sandbox.enforcement !== void 0 ? { enforcement: result.sandbox.enforcement } : {},
      ...result.sandbox.runnerFailed !== void 0 ? { runnerFailed: result.sandbox.runnerFailed } : {}
    } } : {}
  };
}
function toolAborted() {
  const error = new HarnessError("tool call aborted", TOOL_ABORTED);
  error.name = "AbortError";
  return error;
}
var BACKGROUND_OUTPUT_PROPERTIES = {
  kind: {
    type: "string",
    required: true,
    const: "background"
  },
  jobId: {
    type: "string",
    required: true
  }
};
function apply(ctx, config = {}) {
  const backgroundEnabled = config.enableRunInBackground ?? true;
  const promoteOnTimeout = (config.promoteOnTimeout ?? true) && backgroundEnabled;
  const defaultMode = ctx.shell.sandboxMode;
  const escalationModes = defaultMode === void 0 ? [] : ESCALATION_TARGETS;
  const sandboxPolicy = defaultMode === void 0 ? void 0 : ctx.get("sandboxPolicy");
  if (defaultMode !== void 0 && sandboxPolicy === void 0) throw new Error("tool-bash: the mounted bash executor confines but ctx.sandboxPolicy is missing");
  const resolveSandboxPolicy = (exec) => sandboxPolicy?.resolve(exec.agent === void 0 ? {} : { session: exec.agent.session });
  const approveBashEscalation = (mode, justification, exec, standingPolicy) => {
    if (escalationModes.length === 0) throw new Error("sandbox_permissions is not available in this composition (no sandboxing executor to escalate)");
    const effectiveMode = standingPolicy.mode;
    return approveEscalation({
      requestedMode: mode,
      justification,
      effectiveMode,
      subject: "command"
    }, {
      approver: ctx.get("approval"),
      agent: exec.agent,
      callId: exec.callId,
      toolName: "bash",
      signal: exec.signal
    });
  };
  ctx.systemPrompt.section({
    name: "tool:bash",
    order: ctx.systemPrompt.getSectionOrder("TOOL_BASH"),
    text: "Check the [exit code: N] marker on every bash result; investigate failures before moving on."
  });
  const bashTool = (jobs) => {
    const background = jobs !== void 0;
    const promote = background && promoteOnTimeout;
    const startJob = (registry, args, exec, spec) => {
      let proc;
      let stopped;
      return {
        id: registry.start({
          kind: "bash",
          label: args.command,
          ...exec.agent ? { owner: exec.agent.id } : {},
          output: processSources(() => proc),
          run: () => {
            const hooks = processJob(async (signal) => {
              proc = await ctx.shell.execute({
                ...spec,
                signal
              });
              return proc;
            }, (started) => processOutcome(started, escalationModes));
            return {
              done: hooks.done,
              cancel: (reason) => {
                stopped = reason;
                hooks.cancel(reason);
              }
            };
          }
        }),
        process: () => proc,
        stopped: () => stopped
      };
    };
    const waitOnJob = async (registry, attached, exec, spec) => {
      const owner = exec.agent?.id;
      const timeoutMs = spec.timeoutMs;
      const stop = async (reason) => {
        registry.kill(attached.id, owner, reason);
        const settled = await registry.wait(attached.id, timeoutMs, owner);
        if (settled.status !== "running" && settled.status !== "stopping") registry.remove(attached.id, owner);
        return settled;
      };
      let view;
      try {
        view = await registry.wait(attached.id, timeoutMs, owner, exec.signal);
      } catch {
        await stop("tool call aborted");
        throw toolAborted();
      }
      if ((view.status === "running" || view.status === "stopping") && attached.process() === void 0) {
        await stop("timed out during preparation");
        return {
          kind: "foreground",
          exitCode: null,
          signal: null,
          timedOut: true,
          aborted: false,
          timeoutMs,
          stdout: {
            text: "",
            truncated: false
          },
          stderr: {
            text: "",
            truncated: false
          },
          ...spec.sandboxPolicy !== void 0 ? { sandbox: {
            mode: spec.sandboxPolicy.mode,
            denied: false
          } } : {}
        };
      }
      if (view.status === "running" || view.status === "stopping") {
        const read = registry.read(attached.id, owner);
        return {
          kind: "promoted",
          jobId: attached.id,
          timeoutMs,
          output: renderJobRead(ringDelta(read.chunks), read.lossy, read.job.output.spillPaths ?? [], attached.process()?.sandbox, escalationModes)
        };
      }
      registry.remove(attached.id, owner);
      const process = attached.process();
      if (process === void 0) throw new Error(view.detail);
      const result = await process.result();
      const stopped = attached.stopped();
      return {
        kind: "foreground",
        ...canonicalBashResult(result),
        ...stopped !== void 0 ? { stopped } : {}
      };
    };
    return defineTool({
      name: "bash",
      description: bashDescription(),
      parameters: {
        command: {
          type: "string",
          required: true,
          description: "The bash command to execute."
        },
        description: {
          type: "string",
          required: true,
          description: 'Clear, concise description of what this command does in active voice, 5-10 words (shown in the UI). Examples: "ls" \u2192 "List files in current directory"; "git status" \u2192 "Show working tree status"; "npm install" \u2192 "Install package dependencies".'
        },
        timeoutMs: {
          type: "number",
          description: promote ? "Timeout in milliseconds. The executor applies its configured default and cap; on expiry the command moves to the background as a job instead of being killed." : "Timeout in milliseconds. The executor applies its configured default and cap, and kills the command on expiry."
        },
        workdir: {
          type: "string",
          description: "Working directory for this command. Defaults to the session workspace; a relative path is resolved against it."
        },
        ...background ? { run_in_background: {
          type: "boolean",
          description: "Run in the background and return a job id immediately (collect with job_output, stop with job_kill). No timeout applies."
        } } : {},
        ...escalationModes.length > 0 ? {
          sandbox_permissions: {
            type: "string",
            enum: [...escalationModes],
            description: sandboxPermissionsDescription("command")
          },
          justification: {
            type: "string",
            description: "Required with sandbox_permissions: one sentence for the user explaining why this exact command needs the wider access. Use the language of the user\u2019s current request."
          }
        } : {}
      },
      output: {
        schema: { oneOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: BACKGROUND_OUTPUT_PROPERTIES
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: {
                type: "string",
                required: true,
                const: "promoted"
              },
              jobId: {
                type: "string",
                required: true
              },
              timeoutMs: {
                type: "number",
                required: true
              },
              output: {
                type: "string",
                required: true
              }
            }
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              kind: {
                type: "string",
                required: true,
                const: "foreground"
              },
              exitCode: {
                required: true,
                oneOf: [{ type: "integer" }, { type: "null" }]
              },
              signal: {
                required: true,
                oneOf: [{ type: "string" }, { type: "null" }]
              },
              timedOut: {
                type: "boolean",
                required: true
              },
              aborted: {
                type: "boolean",
                required: true
              },
              stopped: { type: "string" },
              timeoutMs: {
                type: "number",
                required: true
              },
              stdout: {
                type: "object",
                additionalProperties: false,
                required: true,
                properties: {
                  text: {
                    type: "string",
                    required: true
                  },
                  truncated: {
                    type: "boolean",
                    required: true
                  },
                  spillPath: { type: "string" }
                }
              },
              stderr: {
                type: "object",
                additionalProperties: false,
                required: true,
                properties: {
                  text: {
                    type: "string",
                    required: true
                  },
                  truncated: {
                    type: "boolean",
                    required: true
                  },
                  spillPath: { type: "string" }
                }
              },
              sandbox: {
                type: "object",
                additionalProperties: false,
                properties: {
                  mode: {
                    type: "string",
                    required: true
                  },
                  denied: {
                    type: "boolean",
                    required: true
                  },
                  enforcement: { type: "string" },
                  runnerFailed: { type: "boolean" }
                }
              }
            }
          }
        ] },
        render: (_args, value) => [{
          type: "text",
          text: value.kind === "background" ? `started background job ${value.jobId}` : value.kind === "promoted" ? renderPromoted(value) : renderResult(value, escalationModes)
        }]
      },
      async execute(args, exec) {
        const standingPolicy = resolveSandboxPolicy(exec);
        validateBashArgs(args, standingPolicy?.mode);
        const approvedMode = args.sandbox_permissions !== void 0 && args.justification !== void 0 ? await approveBashEscalation(args.sandbox_permissions, args.justification, exec, standingPolicy) : void 0;
        const policy = approvedMode === void 0 ? standingPolicy : {
          ...standingPolicy,
          mode: approvedMode
        };
        const workdir = resolveWorkdir(args.workdir, exec, standingPolicy?.workspaceRoot);
        const dshEnv = ctx.shellEnv.collect(exec);
        const request = {
          command: args.command,
          ...workdir !== void 0 ? { workdir } : {},
          ...args.timeoutMs !== void 0 ? { timeoutMs: args.timeoutMs } : {},
          dshEnv,
          ...policy !== void 0 ? { sandboxPolicy: policy } : {}
        };
        if (args.run_in_background === true) {
          if (!backgroundEnabled) throw new Error("run_in_background is disabled for this deployment (enableRunInBackground: false)");
          if (jobs === void 0) throw new Error("background jobs unavailable: load @deepseek-ai/dsh-jobs and @deepseek-ai/dsh-tool-jobs");
          if (exec.signal.aborted) throw toolAborted();
          return {
            kind: "background",
            jobId: startJob(jobs, args, exec, ctx.shell.resolve({
              ...request,
              onExpiry: "none"
            })).id
          };
        }
        if (jobs !== void 0 && promote) {
          const spec = ctx.shell.resolve({
            ...request,
            onExpiry: "none"
          });
          let attached;
          try {
            attached = startJob(jobs, args, exec, spec);
          } catch (error) {
            ctx.logger.warn(`bash: job registration refused, running in the foreground with the timeout kill instead: ${String(error)}`);
          }
          if (attached !== void 0) return waitOnJob(jobs, attached, exec, spec);
        }
        const result = await (await ctx.shell.execute(ctx.shell.resolve({
          ...request,
          signal: exec.signal
        }))).result();
        if (result.aborted) throw toolAborted();
        return {
          kind: "foreground",
          ...canonicalBashResult(result)
        };
      },
      presentCall: presentBashCall,
      presentResult: presentBashResult
    });
  };
  if (!backgroundEnabled) {
    ctx.tools.register(bashTool(void 0));
    return;
  }
  let foregroundOnly = ctx.get("jobs") === void 0 ? ctx.tools.register(bashTool(void 0)) : void 0;
  ctx.inject(["jobs"], (jobCtx) => {
    foregroundOnly?.();
    foregroundOnly = void 0;
    const unregister = ctx.tools.register(bashTool(jobCtx.jobs));
    jobCtx.effect(() => () => {
      unregister();
      if (ctx.fiber.state === 2) foregroundOnly = ctx.tools.register(bashTool(void 0));
    });
  });
}
export {
  Config,
  apply,
  inject,
  name
};
