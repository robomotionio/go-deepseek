// How far has upstream moved since we pinned it, and does any of it matter?
//
// The bundle is a copy of somebody else's code taken at a moment. Nothing in
// this repository notices when that moment recedes: `.harness/` is gitignored,
// `internal/bundle/` is generated, and `make verify` proves only that what we
// already copied still runs. A copy nobody is watching is how a fixed
// vulnerability stays shipped.
//
// So this reads UPSTREAM.lock.json, fetches the upstream repository, and reports
// the commits since the pin that touch a path the bundle actually carries. It
// deliberately does not report the rest: 743 commits arrived in the last refresh
// and 115 touched a bundled path, and a report that lists everything is a report
// nobody reads twice.
//
// Commits whose subject reads like a security fix are raised to the top, because
// the ordering IS the point — against the previous pin the first line would have
// been the bwrap PID-namespace escape.
//
//   node tools/upstream/check.mjs [--repo <dir>] [--json] [--quiet]
//
// Exit codes:  0 no drift   1 drift   2 the check itself failed
//
// `make verify` runs it and tolerates a failure to reach the network: an
// upstream that is unreachable is not a reason to fail the build, but drift is.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const value = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const asJSON = flag('--json')
const quiet = flag('--quiet')

// Subjects that decide the ordering. Not a classifier — a reading order. A
// false positive costs one line of attention; a false negative buries the one
// commit that mattered under sixty that did not.
// Stems match anywhere, because they are long enough that a chance hit is rare
// and their inflections matter ('traversal', 'sanitising', 'credentials').
const SECURITY_STEMS = [
  'sandbox', 'escape', 'traversal', 'injection', 'credential', 'redact',
  'secret', 'privilege', 'sanitis', 'sanitiz', 'spoof', 'symlink',
  'permission', 'disclos', 'confin', 'namespace', 'untrusted',
]
// Acronyms and short words match only as whole words. 'rce' inside 'source'
// and 'leak' inside 'leaky' are the kind of noise that trains a reader to skim
// the section that exists to be read.
const SECURITY_WORDS = ['cve', 'ssrf', 'rce', 'xss', 'csrf', 'leak', 'exploit', 'auth']

function fail(message) {
  process.stderr.write(`upstream-check: ${message}\n`)
  process.exit(2)
}

function readJSON(file, what) {
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch (error) {
    fail(`cannot read ${what} at ${file}: ${String(error?.message ?? error)}`)
  }
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`${what} at ${file} is not valid JSON: ${String(error?.message ?? error)}`)
  }
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

// Both of these are read through readJSON rather than JSON.parse, and the
// lockfile is the reason. It is hand-edited on purpose — that is the whole
// point of it being separate from the generated manifest — which makes a
// trailing comma the single most likely failure this script will ever see. An
// uncaught SyntaxError exits 1, and 1 is the code that means "drift found": the
// weekly workflow would open a public issue with a Node stack trace where the
// drift report should be, in exactly the case that is supposed to go red.
const lockPath = path.join(root, 'UPSTREAM.lock.json')
if (!fs.existsSync(lockPath)) fail(`no UPSTREAM.lock.json at ${lockPath}`)
const lock = readJSON(lockPath, 'the pin')
const { repo, ref, commit } = lock.harness ?? {}
if (!repo || !commit) fail('UPSTREAM.lock.json has no harness.repo / harness.commit')

// The pin must describe the bundle it claims to describe. This is the half of
// the check that needs no network, and the one that catches the likelier
// mistake: a bundle regenerated with a wider ENTRIES list and a lockfile nobody
// updated, which would then under-report drift for every path newly bundled.
const manifest = readJSON(path.join(root, 'internal/bundle/manifest.json'), 'the bundle manifest')
const pinned = Object.keys(lock.entries ?? {})
const bundled = manifest.entries ?? []
const onlyBundle = bundled.filter((e) => !pinned.includes(e))
const onlyLock = pinned.filter((e) => !bundled.includes(e))
if (manifest.harness?.commit && manifest.harness.commit !== commit) {
  fail(`the lockfile pins ${commit.slice(0, 12)} but the bundle was generated from ${manifest.harness.commit.slice(0, 12)} — regenerate one of them`)
}
if (onlyBundle.length || onlyLock.length) {
  const lines = []
  if (onlyBundle.length) lines.push(`bundled but not pinned: ${onlyBundle.join(', ')}`)
  if (onlyLock.length) lines.push(`pinned but not bundled: ${onlyLock.join(', ')}`)
  fail(`UPSTREAM.lock.json is out of step with the bundle\n  ${lines.join('\n  ')}`)
}

// A cache rather than the working .harness/, so the check never disturbs a
// checkout somebody is building from. It is a cache for repeated LOCAL runs
// only: the workflow gets a fresh runner every week and no actions/cache step,
// so CI pays the full clone every time.
let dir = value('--repo', process.env.HARNESS_DIR || path.join(root, '.harness'))
let usable = fs.existsSync(path.join(dir, '.git'))
if (!usable) {
  dir = path.join(os.tmpdir(), 'go-deepseek-upstream-check')
  usable = fs.existsSync(path.join(dir, '.git'))
}

try {
  if (!usable) {
    fs.mkdirSync(path.dirname(dir), { recursive: true })
    git(['clone', '--filter=blob:none', '--no-checkout', repo, dir], root)
  }
  git(['fetch', '--tags', '--force', 'origin'], dir)
} catch (error) {
  const message = String(error?.stderr || error?.message || error).split('\n')[0]
  process.stderr.write(`upstream-check: cannot reach ${repo} — ${message}\n`)
  process.exit(2)
}

// origin/HEAD is absent from a checkout cloned with --no-checkout and from one
// whose clone was interrupted, so origin/master is the fallback — and it can be
// absent too, which is a broken cache rather than drift. Both are failures of
// this script's own machinery, so both exit 2.
let head
try {
  head = git(['rev-parse', 'origin/HEAD'], dir)
} catch {
  try {
    head = git(['rev-parse', 'origin/master'], dir)
  } catch (error) {
    fail(`cannot find upstream's default branch in ${dir} — the cache may be half-cloned; `
      + `remove it and retry (${String(error?.stderr || error?.message || error).split('\n')[0]})`)
  }
}

// Only the paths the bundle carries. `path` comes from the lockfile rather than
// from a fresh scan, deliberately: a package upstream MOVED is drift we want
// reported as a missing path, not silently followed to its new home.
const paths = [...new Set(Object.values(lock.entries).map((e) => e.path))]

let log = ''
try {
  log = git(['log', '--no-merges', '--format=%H%x00%an%x00%ad%x00%s', '--date=short',
    `${commit}..${head}`, '--', ...paths], dir)
} catch (error) {
  fail(`git log failed — is ${commit.slice(0, 12)} still reachable upstream? ${String(error?.stderr || error).split('\n')[0]}`)
}

const commits = log ? log.split('\n').filter(Boolean).map((line) => {
  const [sha, author, date, subject] = line.split('\0')
  const lower = subject.toLowerCase()
  const hit = [
    ...SECURITY_STEMS.filter((w) => lower.includes(w)),
    ...SECURITY_WORDS.filter((w) => new RegExp(`\\b${w}\\b`).test(lower)),
  ]
  return { sha, author, date, subject, security: hit }
}) : []

const total = (() => {
  try { return Number(git(['rev-list', '--count', `${commit}..${head}`], dir)) } catch { return commits.length }
})()

commits.sort((a, b) => (b.security.length ? 1 : 0) - (a.security.length ? 1 : 0))
const flagged = commits.filter((c) => c.security.length)

if (asJSON) {
  process.stdout.write(JSON.stringify({
    pinned: { ref, commit }, head, total, touching: commits.length, security: flagged.length, commits,
  }, null, 2) + '\n')
} else if (!quiet || commits.length) {
  const short = (s) => s.slice(0, 12)
  process.stdout.write(`pinned  ${ref} ${short(commit)}\n`)
  process.stdout.write(`upstream ${short(head)}\n`)
  if (!commits.length) {
    process.stdout.write(total ? `\n${total} commit(s) upstream, none touching a bundled path.\n` : '\nno drift.\n')
  } else {
    process.stdout.write(`\n${total} commit(s) upstream, ${commits.length} touching a bundled path`)
    process.stdout.write(flagged.length ? `, ${flagged.length} reading as security work (listed first):\n\n` : ':\n\n')
    for (const c of commits) {
      const mark = c.security.length ? '!' : ' '
      process.stdout.write(`${mark} ${short(c.sha)}  ${c.date}  ${c.subject}\n`)
      if (c.security.length) process.stdout.write(`               ↑ ${c.security.join(', ')}\n`)
    }
    process.stdout.write(`\nMove the pin with: make sync HARNESS_REF=<ref> && make build && make bundle && make verify\n`)
    process.stdout.write(`Then update UPSTREAM.lock.json — the pin is a decision, so it is written by hand.\n`)
  }
}

process.exit(commits.length ? 1 : 0)
