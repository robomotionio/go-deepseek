// .harness/packages/util/home-paths/lib/index.js
import { opendir, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
var DSH_HOME_DIR_NAME = ".dsh";
var DEFAULT_DSH_HOME_DISPLAY = `~/${DSH_HOME_DIR_NAME}`;
var DSH_HOME_ENV = "DSH_HOME";
async function canonicalizeWatchPath(path) {
  let current = resolve(path);
  const missing = [];
  while (true) try {
    const canonical = await realpath(current);
    if (missing.length > 0) await (await opendir(canonical)).close();
    return join(canonical, ...missing.reverse());
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const parent = dirname(current);
    if (parent === current) throw error;
    missing.push(basename(current));
    current = parent;
  }
}
function defaultDshHome() {
  return join(homedir(), DSH_HOME_DIR_NAME);
}
function expandHomePath(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
  return path;
}
function resolveDshHome(configured, env = process.env) {
  const fromEnv = env[DSH_HOME_ENV];
  return resolve(expandHomePath(configured ?? (fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : defaultDshHome())));
}
function dshHomePath(...segments) {
  return join(resolveDshHome(), ...segments);
}
function dshCachePath(optionsOrSegment = {}, ...segments) {
  if (typeof optionsOrSegment === "string") return dshHomePath("cache", optionsOrSegment, ...segments);
  return join(resolveDshHome(optionsOrSegment.dshHome), "cache", ...segments);
}
function dshHomeDisplay(resolvedHome) {
  return resolvedHome === resolve(defaultDshHome()) ? DEFAULT_DSH_HOME_DISPLAY : `$${DSH_HOME_ENV}`;
}
export {
  DEFAULT_DSH_HOME_DISPLAY,
  DSH_HOME_DIR_NAME,
  DSH_HOME_ENV,
  canonicalizeWatchPath,
  defaultDshHome,
  dshCachePath,
  dshHomeDisplay,
  dshHomePath,
  expandHomePath,
  resolveDshHome
};
