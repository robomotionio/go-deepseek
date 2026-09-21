// .harness/packages/sandbox/sandbox/lib/index.js
import { Service } from "@deepseek-ai/cordis";
import { HarnessError } from "@deepseek-ai/dsh-llm";
import { assertNever } from "@deepseek-ai/dsh-util-values";
import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
var WIDER_MODES = {
  "read-only": ["workspace-write", "danger-full-access"],
  "workspace-write": ["danger-full-access"]
};
var ESCALATION_TARGETS = ["workspace-write", "danger-full-access"];
function validateEscalationArgs(sandboxPermissions, justification) {
  if (sandboxPermissions !== void 0 && justification === void 0) throw new Error("invalid escalation: sandbox_permissions requires a justification");
  if (justification !== void 0 && sandboxPermissions === void 0) throw new Error("invalid escalation: justification is only valid together with sandbox_permissions");
  if (justification !== void 0 && justification.trim().length === 0) throw new Error("invalid justification: expected a non-empty sentence");
}
function sandboxDenialMarker(mode) {
  return `[sandbox: file access denied under ${mode} mode]`;
}
function escalationHintMarker(subject) {
  return `[sandbox: escalation available \u2014 retry this exact ${subject} once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]`;
}
async function approveEscalation(request, approval) {
  const { requestedMode: mode, effectiveMode, justification, subject } = request;
  if (mode === effectiveMode) return effectiveMode;
  if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) throw new Error(`sandbox escalation to "${mode}" is not strictly wider than this call's current "${effectiveMode}" mode`);
  if (approval.approver === void 0) throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`);
  if (approval.agent === void 0) throw new Error(`sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`);
  const outcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `escalate sandbox to ${mode}: ${justification}`,
    ...approval.signal ? { signal: approval.signal } : {}
  });
  switch (outcome) {
    case "allowed-once":
      return mode;
    case "rejected":
      throw new Error(`the user rejected escalating this ${subject} to "${mode}"`);
    case "cancelled":
      throw new Error(`approval for escalating to "${mode}" was cancelled`);
    case "unavailable":
      throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval channel is available`);
    default:
      return assertNever(outcome, "EscalationOutcome");
  }
}
function canonicalPath(path) {
  try {
    return realpathSync.native(path);
  } catch {
    return path;
  }
}
function writableRoots(policy) {
  if (policy.mode !== "workspace-write") return [];
  return [...new Set([
    policy.workspaceRoot,
    "/tmp",
    tmpdir()
  ].map(canonicalPath))];
}
var EXECUTABLE_SPAWN_CODES = /* @__PURE__ */ new Set(["EACCES", "ENOENT"]);
function isUsableWorkdir(path) {
  try {
    if (!statSync(path).isDirectory()) return false;
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function isRunnerSpawnFailure(error, runnerProgram, workdir) {
  if (runnerProgram === void 0 || !isUsableWorkdir(workdir)) return false;
  if (typeof error !== "object" || error === null) return false;
  const { code, path, syscall } = error;
  if (typeof code !== "string" || !EXECUTABLE_SPAWN_CODES.has(code)) return false;
  if (typeof syscall !== "string") return false;
  const exactSyscall = `spawn ${runnerProgram}`;
  if (path === void 0) return syscall === exactSyscall;
  if (typeof path !== "string" || path.length === 0 || path !== runnerProgram) return false;
  return syscall === "spawn" || syscall === exactSyscall;
}
function classifyRunnerFailure(exitCode, stderr, rules) {
  if (exitCode === null || exitCode === 0) return void 0;
  const lines = stderr.split(/\r?\n/);
  for (const rule of rules) {
    if (rule.allowedExitCodes !== void 0 && !rule.allowedExitCodes.includes(exitCode)) continue;
    const informationalLines = new Set((rule.informationalLines ?? []).map((line) => line.toLowerCase()));
    const fatalSignatures = rule.fatalSignatures.filter((signature) => signature.trim().length > 0).map((signature) => signature.toLowerCase());
    for (const line of lines) {
      const lowered = line.toLowerCase();
      if (informationalLines.has(lowered)) continue;
      if (fatalSignatures.some((signature) => lowered.includes(signature))) return { detail: line };
    }
  }
}
function matchesSignature(exitCode, stderr, signatures) {
  if (exitCode === null || exitCode === 0) return false;
  const lowered = stderr.toLowerCase();
  return signatures.some((signature) => lowered.includes(signature.toLowerCase()));
}
var SANDBOX_UNAVAILABLE = "SANDBOX_UNAVAILABLE";
var SandboxUnavailableError = class extends HarnessError {
  constructor(mode, detail) {
    super(`sandbox mode "${mode}" is requested but no sandbox backend is usable on this host; refusing to run the command unconfined. Install bubblewrap or run a Landlock-enforcing kernel (Linux), ensure sandbox-exec is usable (macOS), or ensure the ACL restricted-token runner can start (Windows) \u2014 otherwise switch the consumer to danger-full-access.` + (detail === void 0 ? "" : ` Runner failure: ${detail}`), SANDBOX_UNAVAILABLE);
    this.name = "SandboxUnavailableError";
  }
};
var SandboxProvider = class extends Service {
  /* v8 ignore next -- abstract service construction is covered through concrete provider packages. */
  constructor(ctx) {
    super(ctx, "sandbox");
  }
};
export {
  ESCALATION_TARGETS,
  SANDBOX_UNAVAILABLE,
  SandboxProvider,
  SandboxUnavailableError,
  WIDER_MODES,
  approveEscalation,
  canonicalPath,
  classifyRunnerFailure,
  SandboxProvider as default,
  escalationHintMarker,
  isRunnerSpawnFailure,
  matchesSignature,
  sandboxDenialMarker,
  validateEscalationArgs,
  writableRoots
};
