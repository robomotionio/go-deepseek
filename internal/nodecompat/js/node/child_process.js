// node:child_process — importable, and refusing every call.
//
// Spawning a process is a capability, and this runtime grants it through one
// seam: the harness's `subprocess` service, which a host provides on purpose
// (go-deepseek's example 10, the DeepSeek Agent package's subprocess.go). Code
// that reaches for child_process directly would go around that seam, and around
// whatever the host put in it — a sandbox, a process-tree reaper, a policy.
//
// Refusing the IMPORT was the right shape while nothing bundled imported it.
// @anthropic-ai/sdk now does, statically, for an optional agent toolset (skill
// archive extraction, a bash session, ripgrep) that nothing here drives — and
// pi-ai imports that SDK, so a refused import took the Anthropic-compatible
// provider routes down with it. The refusal moves to the call: the module
// loads, and the first attempt to run anything says why it cannot.

function refuse(name) {
  return () => {
    throw Object.assign(
      new Error(
        `child_process.${name}() is not available in this runtime — `
        + 'processes are reached through the subprocess seam, which the host provides deliberately',
      ),
      { code: 'ERR_NOT_AVAILABLE' },
    );
  };
}

export const spawn = refuse('spawn');
export const spawnSync = refuse('spawnSync');
export const exec = refuse('exec');
export const execSync = refuse('execSync');
export const execFile = refuse('execFile');
export const execFileSync = refuse('execFileSync');
export const fork = refuse('fork');
export class ChildProcess {
  constructor() { refuse('ChildProcess')(); }
}

const __ns = { spawn, spawnSync, exec, execSync, execFile, execFileSync, fork, ChildProcess };
export default __ns;

// Registered for CommonJS interop, like every other shim; see prelude.js.
(globalThis.__nodeRegistry ??= {})['child_process'] = __ns;
