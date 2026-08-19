// Build the embeddable DeepSeek Harness bundle.
//
// This is a maintainer's tool, not part of the build. It runs against a
// deepseek-harness checkout with Node and pnpm available, and its output — one
// ESM file per package, plus a manifest — is committed as a generated artifact.
// Using it then needs none of that: the files are compiled into the binary and
// served to the engine by the module resolver.
//
// Why one file per package rather than one file for everything:
//
//   - The plugin loader does a real dynamic `import(specifier)` with a name
//     taken from the composition YAML. A single bundle cannot answer that, and
//     rewriting the loader to consult a registry would be a patch to maintain
//     against every upstream release. One file per package means the ordinary
//     module resolver answers it, which is what that hook is for.
//   - Identity survives. A package externalised from every bundle that imports
//     it is instantiated once, so `instanceof` across packages holds and a
//     module with state has one copy of it — which a single-file bundle with
//     duplicated dependencies quietly breaks.
//
// Usage:
//   node tools/bundle/build.mjs --harness /path/to/deepseek-harness [--out bundle]

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const args = parseArgs(process.argv.slice(2));
const harness = path.resolve(args.harness ?? '../deepseek-harness');
const outDir = path.resolve(args.out ?? 'bundle');
const modulesDir = path.join(outDir, 'modules');

if (!fs.existsSync(path.join(harness, 'package.json'))) {
  fail(`no deepseek-harness checkout at ${harness} (pass --harness <path>)`);
}

const esbuild = await import(findEsbuild(harness));

// pnpm links a workspace package into the node_modules of whoever depends on
// it, not into the root — so resolving `@deepseek-ai/dsh-agent` from the
// checkout's top level finds nothing, and the whole run came back unresolved.
// The workspace is indexed by reading its package.json files instead, which is
// what the layout actually is.
const workspace = indexWorkspace(harness);

function indexWorkspace(root) {
  const index = new Map();
  const walk = (dir, depth) => {
    if (depth > 3 || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules') continue;
      const sub = path.join(dir, entry.name);
      const manifest = path.join(sub, 'package.json');
      if (fs.existsSync(manifest)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
          if (pkg.name && !index.has(pkg.name)) index.set(pkg.name, sub);
        } catch { /* an unreadable manifest is not a package */ }
      }
      walk(sub, depth + 1);
    }
  };
  for (const group of ['packages', 'vendor', 'apps', 'native']) walk(path.join(root, group), 0);
  return index;
}

// The plugin set this bundle carries. Adding a plugin here is what makes it
// available to a composition; a composition naming something outside this list
// fails at build time, here, rather than at run time.
const ENTRIES = [
  // the kernel and the loader
  '@deepseek-ai/cordis',
  '@deepseek-ai/cordis-plugin-loader',
  '@deepseek-ai/cosmokit',
  '@deepseek-ai/schemastery',
  // the agent spine
  '@deepseek-ai/dsh-agent-spine-demo',
  '@deepseek-ai/dsh-agent',
  '@deepseek-ai/dsh-agent-loop',
  '@deepseek-ai/dsh-session',
  '@deepseek-ai/dsh-scope',
  '@deepseek-ai/dsh-system-prompt',
  '@deepseek-ai/dsh-tools',
  // models
  '@deepseek-ai/dsh-llm',
  '@deepseek-ai/dsh-llm-deepseek',
  '@deepseek-ai/dsh-llm-pi-ai',
  '@deepseek-ai/dsh-llm-retry',
  // durability
  '@deepseek-ai/dsh-session-persistence',
  '@deepseek-ai/dsh-session-persistence-jsonl',
  '@deepseek-ai/dsh-session-checkpoint-policy',
  // capabilities and tools
  '@deepseek-ai/dsh-fs',
  '@deepseek-ai/dsh-fs-local',
  '@deepseek-ai/dsh-tool-fs',
  '@deepseek-ai/dsh-tool-str-replace-editor',
  '@deepseek-ai/dsh-subprocess',
  '@deepseek-ai/dsh-bash-local',
  '@deepseek-ai/dsh-tool-bash',
  '@deepseek-ai/dsh-skill',
  '@deepseek-ai/dsh-skill-filesystem',
  '@deepseek-ai/dsh-tool-skill',
  '@deepseek-ai/dsh-tool-todo',
  '@deepseek-ai/dsh-tool-web',
  '@deepseek-ai/dsh-sandbox',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-credentials',
];

// Specifiers that must NOT be bundled. Each is a capability this runtime reaches
// through a seam instead, or a native addon that cannot exist here — and each is
// stubbed so the import fails with a sentence rather than a resolution error.
const REFUSED = new Map([
  ['koffi', 'native FFI; the Windows paths that use it are reached through Go instead'],
  ['node-pty', 'a native pseudo-terminal; use the subprocess seam'],
]);

fs.rmSync(modulesDir, { recursive: true, force: true });
fs.mkdirSync(modulesDir, { recursive: true });

const manifest = new Map();   // specifier -> { file, bytes }
const refusedNames = new Map();   // refused specifier -> Set of imported names
const queue = ENTRIES.map((spec) => ({ spec, from: harness }));
const done = new Set();
const refused = new Set();
let bundled = 0;

while (queue.length) {
  const { spec, from } = queue.shift();
  if (done.has(spec)) continue;
  done.add(spec);

  if (REFUSED.has(spec)) { refused.add(spec); continue; }

  const entryFile = resolveEntry(spec, from);
  if (!entryFile) {
    console.warn(`  ! unresolved: ${spec} (imported from ${short(from)})`);
    continue;
  }

  const slug = slugify(spec);
  const outFile = path.join(modulesDir, `${slug}.mjs`);
  process.stdout.write(`  ${String(bundled + 1).padStart(3)} ${spec}\n`);
  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2023',
    // Everything bare stays external: workspace packages, npm packages and
    // node: builtins alike. Relative files are inlined, which is what makes one
    // package one module.
    packages: 'external',
    outfile: outFile,
    write: true,
    legalComments: 'none',
    logLevel: 'silent',
  }).catch((err) => {
    console.warn(`  ! ${spec}: ${String(err).split('\n')[0]}`);
    return null;
  });
  if (!result) continue;

  const code = fs.readFileSync(outFile, 'utf8');
  manifest.set(spec, { file: `modules/${slug}.mjs`, bytes: code.length });
  bundled++;

  // What this bundle still imports is what has to be bundled next. Reading it
  // off the OUTPUT rather than the source is exact: it is the set esbuild
  // actually left external, after its own resolution.
  const dir = path.dirname(entryFile);
  for (const [spec, names] of importedNames(code)) {
    if (REFUSED.has(spec)) {
      if (!refusedNames.has(spec)) refusedNames.set(spec, new Set());
      for (const name of names) refusedNames.get(spec).add(name);
    }
  }
  for (const next of bareImports(code)) {
    if (next.startsWith('node:') || isNodeBuiltin(next)) continue;
    if (!done.has(next)) queue.push({ spec: next, from: dir });
  }
}

// A CommonJS package bundled to ESM exports only its default: esbuild has no
// way to know what `module.exports` will hold, so `import { parse } from 'yaml'`
// fails to link even though the property is there at run time.
//
// The names each package is imported under ARE known — they are in the bundled
// output of whoever imports it — so the missing bindings can be added
// afterwards, in one pass once every module exists.
reexportNamedFromCjs();
registerRuntimeRequires();

// A CommonJS package may `require` another PACKAGE at run time, not just a Node
// builtin: `__require("retry")` is what esbuild leaves behind when the target is
// external. require is synchronous and cannot import, so the only way to serve
// one is to have it already evaluated — which a static import at the top of the
// requiring module guarantees, since a module graph evaluates dependencies
// first.
function registerRuntimeRequires() {
  for (const [spec, entry] of manifest) {
    if (entry.refused) continue;
    const full = path.join(outDir, entry.file);
    if (!fs.existsSync(full)) continue;
    const code = fs.readFileSync(full, 'utf8');
    const wanted = new Set();
    for (const m of code.matchAll(/\b__?require\(\s*["']([^"']+)["']\s*\)/g)) {
      const dep = m[1];
      if (dep.startsWith('.') || dep.startsWith('/')) continue;
      if (dep.startsWith('node:') || isNodeBuiltin(dep)) continue;   // the prelude serves those
      if (!manifest.has(dep)) continue;
      wanted.add(dep);
    }
    if (wanted.size === 0) continue;
    const header = [...wanted].map((dep, i) => [
      `import * as __req${i} from ${JSON.stringify(dep)};`,
      `(globalThis.__nodeRegistry ??= {})[${JSON.stringify(dep)}] = __req${i}.default ?? __req${i};`,
    ].join('\n')).join('\n');
    fs.writeFileSync(full, `${header}\n${code}`);
    entry.bytes += header.length + 1;
    console.log(`  = ${spec}: pre-imported ${wanted.size} runtime require(s): ${[...wanted].join(', ')}`);
  }
}

function reexportNamedFromCjs() {
  const needed = new Map();
  for (const { file } of manifest.values()) {
    const full = path.join(outDir, file);
    if (!fs.existsSync(full)) continue;
    for (const [spec, names] of importedNames(fs.readFileSync(full, 'utf8'))) {
      if (!needed.has(spec)) needed.set(spec, new Set());
      for (const name of names) needed.get(spec).add(name);
    }
  }

  for (const [spec, names] of needed) {
    const entry = manifest.get(spec);
    if (!entry || entry.refused) continue;
    const full = path.join(outDir, entry.file);
    const code = fs.readFileSync(full, 'utf8');
    const already = declaredExports(code);
    const missing = [...names].filter((name) => name !== 'default' && !already.has(name));
    if (missing.length === 0) continue;

    const defaultExport = /\nexport default ([^;]+);/.exec(code);
    if (!defaultExport) {
      console.warn(`  ! ${spec} is missing exports ${missing.join(', ')} and has no default to read them from`);
      continue;
    }
    const patched = code.replace(defaultExport[0], [
      '',
      `const __cjs = ${defaultExport[1]};`,
      'export default __cjs;',
      ...missing.map((name) => `export const ${name} = __cjs?.${name};`),
      '',
    ].join('\n'));
    fs.writeFileSync(full, patched);
    entry.bytes = patched.length;
    console.log(`  + ${spec}: re-exported ${missing.length} name(s) from its CommonJS default`);
  }
}

// declaredExports lists what a module already exports by name.
function declaredExports(code) {
  const out = new Set();
  for (const m of code.matchAll(/export\s+(?:const|let|var|function|class|async function)\s+([A-Za-z_$][\w$]*)/g)) {
    out.add(m[1]);
  }
  for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) out.add(name);
    }
  }
  return out;
}

// A stub for each refusal that links like the real module and fails only when
// something is actually used.
//
// Throwing at the top of the module is not enough: `import chokidar from
// 'chokidar'` fails at LINK time with "has no export named 'default'", before
// any code runs — so the refusal surfaces as a bundler error rather than as the
// sentence it was written to be. The names each one is imported under are
// collected from the bundled output above, which is why this can export exactly
// the right set.
for (const spec of refused) {
  const slug = slugify(spec);
  const file = `modules/${slug}.mjs`;
  const names = [...(refusedNames.get(spec) ?? new Set())].filter((n) => n !== 'default');
  const body = [
    `// Refused at bundle time: ${REFUSED.get(spec)}`,
    `const reason = ${JSON.stringify(REFUSED.get(spec))};`,
    `const specifier = ${JSON.stringify(spec)};`,
    '',
    'function refuse(name) {',
    "  const fail = () => { throw new Error(`${specifier}.${name} is not available in this runtime: ${reason}`); };",
    '  return new Proxy(function () {}, {',
    '    apply: fail,',
    '    construct: fail,',
    "    get: (_, prop) => (prop === 'name' ? name : fail()),",
    '  });',
    '}',
    '',
    "export default refuse('default');",
    ...names.map((name) => `export const ${name} = refuse(${JSON.stringify(name)});`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, file), body);
  manifest.set(spec, { file, bytes: body.length, refused: REFUSED.get(spec) });
}

const meta = {
  generated: 'by tools/bundle/build.mjs — do not edit by hand',
  harness: {
    version: JSON.parse(fs.readFileSync(path.join(harness, 'package.json'), 'utf8')).version,
    commit: gitCommit(harness),
  },
  entries: ENTRIES,
  modules: Object.fromEntries([...manifest].sort(([a], [b]) => (a < b ? -1 : 1))),
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(meta, null, 2)}\n`);

// The esbuild service is a child process; without this the script hangs at the
// end holding a pipe open.
await esbuild.stop?.();

const total = [...manifest.values()].reduce((n, m) => n + m.bytes, 0);
console.log(`bundled ${bundled} modules, ${refused.size} refused, ${(total / 1024 / 1024).toFixed(1)} MB`);
console.log(`harness ${meta.harness.version} @ ${meta.harness.commit.slice(0, 12)}`);

// --- helpers -----------------------------------------------------------------

// findEsbuild locates a bundler in the harness checkout. It is usually a
// transitive dependency rather than a direct one, so it is not linked at the top
// of node_modules and require.resolve from there does not find it — hence the
// look through pnpm's store, which is where it actually is.
function findEsbuild(root) {
  const require = createRequire(path.join(root, 'noop.js'));
  try {
    return require.resolve('esbuild');
  } catch { /* look in the store instead */ }
  const store = path.join(root, 'node_modules', '.pnpm');
  if (fs.existsSync(store)) {
    const versions = fs.readdirSync(store)
      .filter((d) => d.startsWith('esbuild@'))
      .sort()
      .reverse();
    for (const v of versions) {
      const candidate = path.join(store, v, 'node_modules', 'esbuild', 'lib', 'main.js');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  fail(`no esbuild in ${short(root)} — run pnpm install there first`);
  return '';
}

// resolveEntry finds the file a specifier names, by reading package.json the way
// Node does: walk up for node_modules, then honour "exports" (import condition
// first), then "main", then the conventional index.
//
// An earlier version asked esbuild to resolve, through a plugin that called
// build.resolve inside its own onResolve hook. That re-enters the same hook, so
// it recursed until the machine ran out of memory — ten gigabytes and not one
// module written. Resolution is a few lines of JSON reading; it does not need a
// bundler, and it certainly does not need one re-entering itself.
function resolveEntry(spec, fromDir) {
  const { name, subpath } = splitSpecifier(spec);
  const pkgDir = workspace.get(name) ?? findPackageDir(name, fromDir) ?? findInStore(name);
  if (!pkgDir) return null;
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
  for (const candidate of entryCandidates(pkg, subpath)) {
    const file = path.join(pkgDir, candidate);
    for (const attempt of [file, `${file}.js`, `${file}.mjs`, path.join(file, 'index.js')]) {
      if (fs.existsSync(attempt) && fs.statSync(attempt).isFile()) return attempt;
    }
  }
  return null;
}

// findInStore is the last resort: pnpm links a dependency into the node_modules
// of whoever declared it, so a package imported from code that was inlined from
// somewhere else is not reachable by walking up from the importer. The store has
// exactly one copy of each version, and the newest is the one the workspace
// resolved to.
function findInStore(name) {
  const store = path.join(harness, 'node_modules', '.pnpm');
  if (!fs.existsSync(store)) return null;
  const prefix = `${name.replace('/', '+')}@`;
  const versions = fs.readdirSync(store)
    .filter((d) => d.startsWith(prefix))
    .sort()
    .reverse();
  for (const dir of versions) {
    const candidate = path.join(store, dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
  }
  return null;
}

// splitSpecifier separates "@scope/pkg/sub/path" into the package and the
// subpath the exports map is keyed by.
function splitSpecifier(spec) {
  const parts = spec.split('/');
  const take = spec.startsWith('@') ? 2 : 1;
  return {
    name: parts.slice(0, take).join('/'),
    subpath: parts.length > take ? `./${parts.slice(take).join('/')}` : '.',
  };
}

// findPackageDir walks up from dir looking for node_modules/<name>, which is how
// pnpm's symlinked layout is meant to be read.
function findPackageDir(name, dir) {
  let current = path.resolve(dir);
  for (;;) {
    const candidate = path.join(current, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// entryCandidates lists the files a subpath might mean, best first. The
// conditions are read in the order this runtime cares about: it loads ES
// modules, so "import" beats "require", and "node" beats "browser".
function entryCandidates(pkg, subpath) {
  const out = [];
  const pick = (value) => {
    if (typeof value === 'string') { out.push(value); return; }
    if (!value || typeof value !== 'object') return;
    for (const key of ['import', 'module', 'node', 'default', 'require']) {
      if (key in value) pick(value[key]);
    }
  };
  const exports = pkg.exports;
  if (typeof exports === 'string') {
    if (subpath === '.') pick(exports);
  } else if (exports && typeof exports === 'object') {
    if (subpath in exports) pick(exports[subpath]);
    else if (subpath === '.' && !Object.keys(exports).some((k) => k.startsWith('.'))) pick(exports);
    else {
      // A wildcard entry ("./*": "./lib/*.js") is the other shape published
      // packages use for subpaths.
      for (const [key, value] of Object.entries(exports)) {
        if (!key.includes('*')) continue;
        const [before, after] = key.split('*');
        if (subpath.startsWith(before) && subpath.endsWith(after)) {
          const filled = subpath.slice(before.length, subpath.length - after.length);
          const target = [];
          const collect = (v) => {
            if (typeof v === 'string') target.push(v.replace('*', filled));
            else if (v && typeof v === 'object') for (const k of ['import', 'module', 'node', 'default', 'require']) if (k in v) collect(v[k]);
          };
          collect(value);
          out.push(...target);
        }
      }
    }
  }
  if (subpath === '.') {
    if (pkg.module) out.push(pkg.module);
    if (pkg.main) out.push(pkg.main);
    out.push('lib/index.js', 'dist/index.js', 'index.js', 'src/index.ts');
  } else {
    out.push(subpath);
  }
  return out.filter(Boolean);
}

// importedNames maps a specifier to the names it is imported under, which is
// what a stub has to export for the import to link at all.
function importedNames(code) {
  const out = new Map();
  const add = (spec, names) => {
    if (!out.has(spec)) out.set(spec, new Set());
    for (const name of names) out.get(spec).add(name);
  };
  // Anchored to the start of a line and stopping at the first quote or
  // semicolon: an unanchored version matched the middle of ordinary code and
  // reported `imports.join(", ")` as an imported name.
  for (const m of code.matchAll(/(?:^|\n)\s*import\s+([^;'"]*?)\s+from\s*["']([^"']+)["']/g)) {
    const [, clause, spec] = m;
    const names = [];
    // `import x from 'y'` and `import x, { a } from 'y'`
    if (/^\w/.test(clause.trim())) names.push('default');
    const braces = /\{([\s\S]*?)\}/.exec(clause);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/)[0].trim();
        if (name) names.push(name === 'default' ? 'default' : name);
      }
    }
    if (/\*\s+as\s+/.test(clause)) names.push('default');
    add(spec, names);
  }
  for (const m of code.matchAll(/(?:^|\n)\s*export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    const [, clause, spec] = m;
    add(spec, clause.split(',').map((p) => p.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean));
  }
  // Only real binding names survive: anything else came from a regex meeting
  // code that merely looked like an import.
  for (const [spec, names] of out) {
    out.set(spec, new Set([...names].filter((name) => /^[A-Za-z_$][\w$]*$/.test(name))));
  }
  return out;
}

// bareImports finds the specifiers a bundled module still refers to: static
// imports and exports, plus dynamic imports with a literal argument.
function bareImports(code) {
  const out = new Set();
  const patterns = [
    /(?:^|\n)\s*import\s+(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/g,
    /(?:^|\n)\s*export\s+[\s\S]*?\sfrom\s*["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    for (const m of code.matchAll(re)) {
      const spec = m[1];
      if (spec.startsWith('.') || spec.startsWith('/')) continue;
      out.add(spec);
    }
  }
  return out;
}

// Declared inside the function rather than beside it: everything above runs at
// module top level, and a const declared further down is in its temporal dead
// zone when the first import is classified.
var BUILTINS; // var, not let: this file runs its main loop above the declaration
function isNodeBuiltin(spec) {
  BUILTINS ??= new Set([
    'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'crypto',
    'dgram', 'dns', 'events', 'fs', 'http', 'http2', 'https', 'inspector', 'module',
    'net', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring',
    'readline', 'repl', 'sqlite', 'stream', 'string_decoder', 'timers', 'tls',
    'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
  ]);
  return BUILTINS.has(spec.split('/')[0]);
}

function slugify(spec) {
  return spec.replace(/^@/, '').replace(/[/@]/g, '__');
}

function short(p) { return p.replace(harness, '<harness>'); }

function gitCommit(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--')) fail(`unexpected argument ${argv[i]}`);
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

function fail(message) {
  console.error(`bundle: ${message}`);
  process.exit(1);
}
