// node:os — a thin naming layer over the host's description of the machine.

const host = globalThis.__nodeHost;

export const EOL = host.os.eol();
export const platform = () => host.os.platform();
export const arch = () => host.os.arch();
export const homedir = () => host.os.homedir();
export const tmpdir = () => host.os.tmpdir();
export const hostname = () => host.os.hostname();
export const type = () => ({ win32: 'Windows_NT', darwin: 'Darwin' }[host.os.platform()] || 'Linux');
export const release = () => '';
export const totalmem = () => host.os.totalmem();
export const freemem = () => host.os.freemem();
export const uptime = () => host.os.uptime();
export const userInfo = () => host.os.userInfo();
export const endianness = () => 'LE';
export const devNull = host.os.platform() === 'win32' ? '\\\\.\\nul' : '/dev/null';

// cpus() is asked for the COUNT far more often than for the model names, and a
// count is the only part of it that is portable.
export const cpus = () => Array.from({ length: host.os.cpus() }, () => ({
  model: 'unknown',
  speed: 0,
  times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
}));

export const networkInterfaces = () => ({});
export const loadavg = () => [0, 0, 0];
export const availableParallelism = () => host.os.cpus();

export default {
  EOL, platform, arch, homedir, tmpdir, hostname, type, release,
  totalmem, freemem, uptime, userInfo, endianness, cpus, networkInterfaces,
  loadavg, availableParallelism, devNull,
};
