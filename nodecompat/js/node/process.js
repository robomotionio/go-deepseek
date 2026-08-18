// node:process — the global under its module name.

const process = globalThis.process;

export const env = process.env;
export const argv = process.argv;
export const platform = process.platform;
export const arch = process.arch;
export const version = process.version;
export const versions = process.versions;
export const pid = process.pid;
export const cwd = process.cwd;
export const exit = process.exit;
export const nextTick = process.nextTick;
export const hrtime = process.hrtime;
export const stdout = process.stdout;
export const stderr = process.stderr;
export const stdin = process.stdin;
export const memoryUsage = process.memoryUsage;
export const uptime = process.uptime;
export const emitWarning = process.emitWarning;

export default process;
