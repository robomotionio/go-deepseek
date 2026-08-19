// Package nodecompat gives a goant Runtime enough of Node.js and the web
// platform to run ordinary published JavaScript.
//
// goant is a language implementation. It has no fs, no http, no Buffer, no
// fetch, and says so — "there is no Node.js compatibility layer" is a line in
// its README rather than an omission. That is the right shape for an engine and
// the wrong shape for a host that wants to run code somebody else wrote, because
// the first line of almost any such code is `import path from 'node:path'`.
//
// This package is the layer in between. The split it draws is deliberate:
//
//   - Anything that is pure computation — path, util, events, the Buffer
//     methods, the stream classes — is JavaScript, embedded here and served as a
//     module. Writing those in Go would be a translation exercise with a bug in
//     it, and no faster for the trouble.
//   - Anything that touches the machine — files, processes, the clock, the
//     network, randomness, compression — is Go, exposed through one host object
//     the shims call. That keeps the OS surface small enough to read, and it is
//     the layer a sandbox can restrict.
//
// What is NOT here is as deliberate: no child_process, no worker_threads, no vm.
// A capability that dangerous should be reached through an explicit seam a host
// installs on purpose, not by importing a module name.
package nodecompat

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/goant"
)

// Options configures the compatibility layer.
type Options struct {
	// CWD is what process.cwd() reports and what relative paths resolve
	// against. Defaults to the process's own working directory.
	CWD string

	// Env is what process.env exposes. A nil map means an empty environment,
	// NOT the process's own: inheriting every variable a robot happens to have
	// is how credentials end up in a subprocess by accident. Pass os.Environ()
	// explicitly if that is what you want.
	Env map[string]string

	// Argv is process.argv. Defaults to a plausible two-element form.
	Argv []string

	// Roots fences filesystem access: every path a script reaches for must be
	// inside one of them. Empty means unrestricted, which is only appropriate
	// when something outside is doing the fencing instead.
	Roots []string

	// HTTPClient backs fetch. Defaults to a client with no timeout — a timeout
	// belongs to the request (through AbortSignal) rather than to every request
	// alike, and a streaming response that is still arriving is not a stuck one.
	HTTPClient *http.Client

	// Platform overrides what os.platform() and process.platform report. Empty
	// means this machine's.
	Platform string

	// Stdout and Stderr receive process.stdout.write / console output. Nil sends
	// them to the process's own.
	Stdout, Stderr func(p []byte)

	// TraceTimers, when set, is called for every timer a script arms. It exists
	// for one question that is otherwise very hard to answer — "what is keeping
	// the event loop alive?" — and costs nothing when nil.
	TraceTimers func(kind string, delayMs float64, id float64, stack string)

	// TraceHTTP, when set, reports each step of a request: the fetch, every body
	// chunk, the end of the body, a cancellation. Off by default; it exists
	// because a stalled stream is otherwise invisible from either side.
	TraceHTTP func(step string, id int64, detail string)

	// Virtual serves files that are not on disk, keyed by exact path. It exists
	// for one real case: a bundled module reading its own package.json to learn
	// its version. That module has no directory, so there is nothing for the
	// read to find and nowhere sensible to put one — and the alternative,
	// letting it fail, breaks every package that does it, which is all of them.
	Virtual map[string]string
}

// Compat is an installed compatibility layer. It owns the host resources the
// shims reach through — open files, in-flight responses — so closing it closes
// those too.
type Compat struct {
	rt   *goant.Runtime
	opts Options

	mu      sync.Mutex
	files   map[int64]*os.File
	bodies  map[int64]*bodyReader
	nextID  int64
	closed  bool
	cancels map[int64]context.CancelFunc

	// exitCode is what a script asked to exit with. There is no os.Exit here:
	// the Runtime is one part of a robot, and a plugin calling process.exit must
	// not take the rest of it down.
	exitCode *int
}

// Install adds the globals and returns the layer, whose Resolve serves the
// node: modules. It runs the prelude script, so the Runtime must be usable —
// call it before running any application code.
func Install(rt *goant.Runtime, opts Options) (*Compat, error) {
	if rt == nil {
		return nil, fmt.Errorf("nodecompat: nil runtime")
	}
	if opts.CWD == "" {
		if wd, err := os.Getwd(); err == nil {
			opts.CWD = wd
		}
	}
	if opts.Platform == "" {
		opts.Platform = nodePlatform(runtime.GOOS)
	}
	if opts.HTTPClient == nil {
		opts.HTTPClient = &http.Client{}
	}
	if len(opts.Argv) == 0 {
		opts.Argv = []string{"node", "dsh"}
	}
	c := &Compat{
		rt:      rt,
		opts:    opts,
		files:   map[int64]*os.File{},
		bodies:  map[int64]*bodyReader{},
		cancels: map[int64]context.CancelFunc{},
	}
	if err := rt.Set(hostGlobal, c.hostObject()); err != nil {
		return nil, fmt.Errorf("nodecompat: install host: %w", err)
	}
	for _, part := range preludeOrder {
		src, err := jsSource(part)
		if err != nil {
			return nil, err
		}
		if _, err := rt.RunScript(part, src); err != nil {
			return nil, fmt.Errorf("nodecompat: prelude %s: %w", part, err)
		}
	}
	return c, nil
}

// hostGlobal is where the Go bindings live. The shims are the only thing that
// should read it, and the name says so.
const hostGlobal = "__nodeHost"

// preludeOrder is the order the global scripts run in. Streams come first
// because fetch's Response bodies are built on them.
var preludeOrder = []string{
	"vendor/web-streams-polyfill.js",
	"prelude.js",
}

// Close releases what the layer is holding: open file descriptors and any
// response body still being read. Everything opened through a script is the
// host's to clean up, because a script that forgot is exactly the case this
// exists for.
func (c *Compat) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		return nil
	}
	c.closed = true
	for _, f := range c.files {
		f.Close()
	}
	clear(c.files)
	for _, cancel := range c.cancels {
		cancel()
	}
	clear(c.cancels)
	for _, b := range c.bodies {
		b.close()
	}
	clear(c.bodies)
	return nil
}

// shimNamespace is the path prefix every shim module is keyed under. It is a
// URL scheme rather than a directory because these modules are not on disk, and
// import.meta.url on one should say so rather than name a file that is not there.
const shimNamespace = "nodecompat:/"

// Resolve serves the node: modules. Wire it into the Runtime's module
// resolution ahead of the host's own; anything it does not recognise comes back
// with ok false, for the next resolver to answer.
func (c *Compat) Resolve(specifier, referrer string) (source, path string, ok bool, err error) {
	// A relative import from inside a shim — the shims share helpers, and those
	// helpers are not builtins anyone should be able to import by name.
	if strings.HasPrefix(referrer, shimNamespace) && (strings.HasPrefix(specifier, "./") || strings.HasPrefix(specifier, "../")) {
		file := "node/" + pathBase(specifier)
		src, err := jsSource(file)
		if err != nil {
			return "", "", false, err
		}
		return src, shimNamespace + file, true, nil
	}

	name := strings.TrimPrefix(specifier, "node:")
	file, isBuiltin := builtinFiles[name]
	if !isBuiltin {
		if strings.HasPrefix(specifier, "node:") && isKnownAbsentBuiltin(name) {
			// Named on purpose rather than left to fail as "module not found",
			// which sends whoever hits it looking for a bundling mistake.
			return "", "", false, fmt.Errorf(
				"node:%s is deliberately not implemented — reach that capability through a host seam instead", name)
		}
		return "", "", false, nil
	}
	src, err := jsSource(file)
	if err != nil {
		return "", "", false, err
	}
	return src, shimNamespace + file, true, nil
}

// pathBase is filepath.Base for a specifier, which is always slash-separated
// however the host spells its own paths.
func pathBase(specifier string) string {
	if i := strings.LastIndex(specifier, "/"); i >= 0 {
		return specifier[i+1:]
	}
	return specifier
}

// builtinFiles maps a builtin's name onto the shim that implements it. The set
// is what the plugins actually import, established by walking their import
// closure rather than by copying Node's index.
var builtinFiles = map[string]string{
	"assert":          "node/assert.js",
	"async_hooks":     "node/async_hooks.js",
	"buffer":          "node/buffer.js",
	"crypto":          "node/crypto.js",
	"events":          "node/events.js",
	"fs":              "node/fs.js",
	"fs/promises":     "node/fs_promises.js",
	"module":          "node/module.js",
	"os":              "node/os.js",
	"path":            "node/path.js",
	"path/posix":      "node/path.js",
	"perf_hooks":      "node/perf_hooks.js",
	"process":         "node/process.js",
	"querystring":     "node/querystring.js",
	"stream":          "node/stream.js",
	"stream/web":      "node/stream_web.js",
	"string_decoder":  "node/string_decoder.js",
	"timers":          "node/timers.js",
	"timers/promises": "node/timers_promises.js",
	"tty":             "node/tty.js",
	"url":             "node/url.js",
	"util":            "node/util.js",
	"util/types":      "node/util_types.js",
	"zlib":            "node/zlib.js",
}

// isKnownAbsentBuiltin reports whether a name is one this layer refuses on
// purpose. Every one of them is a capability rather than a convenience, and each
// has a seam that grants it deliberately.
func isKnownAbsentBuiltin(name string) bool {
	switch name {
	case "child_process", "worker_threads", "vm", "net", "tls", "http", "https",
		"dgram", "cluster", "inspector", "repl", "sqlite", "v8", "wasi":
		return true
	}
	return false
}

// --- shared plumbing ---------------------------------------------------------

// async runs work on another goroutine and settles a promise with its result.
// It is the shape every blocking binding here takes: the Runtime must not block,
// and the answer must come back through the loop.
func (c *Compat) async(work func() (any, error)) goant.Value {
	p, resolve, reject := c.rt.NewPromise()
	go func() {
		v, err := work()
		if err != nil {
			reject(err)
			return
		}
		resolve(v)
	}()
	return p
}

// id hands out a handle for something the host is holding on a script's behalf.
func (c *Compat) id() int64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.nextID++
	return c.nextID
}

// nodePlatform maps GOOS onto the strings process.platform uses.
func nodePlatform(goos string) string {
	switch goos {
	case "darwin":
		return "darwin"
	case "windows":
		return "win32"
	default:
		return goos
	}
}

// resolvePath makes p absolute against the configured working directory and
// checks it against the fence.
//
// The check is on the cleaned absolute path, so `../` cannot walk out of a root
// — that is the whole attack, and it is why the comparison happens after
// Clean rather than on what the script wrote.
func (c *Compat) resolvePath(p string) (string, error) {
	if p == "" {
		return "", fmt.Errorf("path is empty")
	}
	if strings.HasPrefix(p, "file://") {
		u, err := fileURLToPath(p)
		if err != nil {
			return "", err
		}
		p = u
	}
	if !filepath.IsAbs(p) {
		p = filepath.Join(c.opts.CWD, p)
	}
	p = filepath.Clean(p)
	if len(c.opts.Roots) == 0 {
		return p, nil
	}
	for _, root := range c.opts.Roots {
		root = filepath.Clean(root)
		if p == root || strings.HasPrefix(p, root+string(filepath.Separator)) {
			return p, nil
		}
	}
	return "", fmt.Errorf("EACCES: path is outside the permitted roots: %s", p)
}

// now is the clock, overridable so a test does not have to wait for one.
func (c *Compat) now() time.Time { return time.Now() }
