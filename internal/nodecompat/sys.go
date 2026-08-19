package nodecompat

// The bindings that describe the machine and the process: os, process, the
// clock, and URL parsing.
//
// URL is here rather than in JavaScript for one reason: getting it wrong is
// silent. A hand-written parser handles the cases its author thought of and
// mangles the rest — a port, an IPv6 host, a percent-encoded path — and the
// failure shows up as a request to slightly the wrong place. net/url has been
// answering those questions for a decade.

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"
)

func (c *Compat) osBindings() map[string]any {
	return map[string]any{
		"platform": func() string { return c.opts.Platform },
		"arch":     func() string { return nodeArch(runtime.GOARCH) },
		// Node's os.homedir() answers $HOME first and consults the user
		// database only when it is unset — and here "the process's
		// environment" is opts.Env, the one the embedder composed, not the
		// host's. Asking the host first inverted that: a runtime fenced into a
		// workspace with HOME set inside it reported the operator's real home,
		// and everything upstream that derives a path from homedir() — skill
		// roots, config dirs — aimed outside the fence and was refused.
		// (userInfo below is different on purpose: Node documents ITS homedir
		// as the operating system's answer, $HOME notwithstanding.)
		"homedir": func() string {
			if h := c.opts.Env["HOME"]; h != "" {
				return h
			}
			h, _ := os.UserHomeDir()
			return h
		},
		"tmpdir": os.TempDir,
		"hostname": func() string {
			h, _ := os.Hostname()
			return h
		},
		"cpus":      func() int { return runtime.NumCPU() },
		"totalmem":  func() float64 { return float64(totalMemory()) },
		"freemem":   func() float64 { return float64(totalMemory()) },
		"uptime":    func() float64 { return time.Since(processStart).Seconds() },
		"eol":       func() string { return lineEnding(c.opts.Platform) },
		"separator": string(filepath.Separator),
		"delimiter": string(filepath.ListSeparator),
		"userInfo": func() map[string]any {
			home, _ := os.UserHomeDir()
			name := c.opts.Env["USER"]
			if name == "" {
				name = c.opts.Env["USERNAME"]
			}
			return map[string]any{
				"username": name,
				"homedir":  home,
				"shell":    c.opts.Env["SHELL"],
			}
		},
	}
}

var processStart = time.Now()

func (c *Compat) processBindings() map[string]any {
	return map[string]any{
		"cwd":  func() string { return c.opts.CWD },
		"env":  func() map[string]any { return envObject(c.opts.Env) },
		"argv": func() []string { return append([]string(nil), c.opts.Argv...) },
		"pid":  func() int { return os.Getpid() },
		"exit": func(code int) { c.exit(code) },
		"hrtime": func() float64 {
			return float64(time.Since(processStart).Nanoseconds())
		},
		"now": func() float64 {
			return float64(time.Since(processStart).Nanoseconds()) / 1e6
		},
		"epochMs": func() float64 { return float64(c.now().UnixMilli()) },
		"write": func(stream string, data string) {
			c.writeStream(stream, []byte(data))
		},
		"memoryUsage": func() map[string]any {
			var m runtime.MemStats
			runtime.ReadMemStats(&m)
			return map[string]any{
				"rss":       float64(m.Sys),
				"heapTotal": float64(m.HeapSys),
				"heapUsed":  float64(m.HeapAlloc),
				"external":  0,
			}
		},
	}
}

// exit records that the script asked to stop. There is no os.Exit here on
// purpose: the Runtime is embedded in a program that has other work, and a
// plugin calling process.exit must not take it down.
func (c *Compat) exit(code int) {
	c.mu.Lock()
	c.exitCode = &code
	c.mu.Unlock()
}

// ExitCode reports the code a script asked to exit with, if it did.
func (c *Compat) ExitCode() (int, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.exitCode == nil {
		return 0, false
	}
	return *c.exitCode, true
}

func (c *Compat) writeStream(stream string, p []byte) {
	if stream == "stderr" {
		if c.opts.Stderr != nil {
			c.opts.Stderr(p)
			return
		}
		os.Stderr.Write(p)
		return
	}
	if c.opts.Stdout != nil {
		c.opts.Stdout(p)
		return
	}
	os.Stdout.Write(p)
}

func envObject(env map[string]string) map[string]any {
	out := make(map[string]any, len(env))
	for k, v := range env {
		out[k] = v
	}
	return out
}

func nodeArch(goarch string) string {
	switch goarch {
	case "amd64":
		return "x64"
	case "386":
		return "ia32"
	case "arm64":
		return "arm64"
	}
	return goarch
}

func lineEnding(platform string) string {
	if platform == "win32" {
		return "\r\n"
	}
	return "\n"
}

// totalMemory is a figure rather than a measurement: nothing portable reports
// it, and the callers that ask are sizing a cache. A wrong answer here is a
// cache that is the wrong size, which is why guessing is acceptable and a cgo
// dependency to do better is not.
func totalMemory() uint64 { return 8 << 30 }

// --- URL ---------------------------------------------------------------------

func (c *Compat) urlBindings() map[string]any {
	return map[string]any{
		"parse":       parseURL,
		"fileToPath":  fileURLToPath,
		"pathToFile":  pathToFileURL,
		"encodeQuery": encodeQuery,
		"parseQuery":  parseQuery,
	}
}

// parseURL returns the components the JavaScript URL class exposes. An input
// that will not parse comes back as ok:false rather than an error, because the
// URL constructor's failure is a TypeError the shim throws itself with the
// message the platform uses.
func parseURL(input, base string) map[string]any {
	var u *url.URL
	var err error
	if base != "" {
		b, berr := url.Parse(base)
		if berr != nil || !b.IsAbs() {
			return map[string]any{"ok": false}
		}
		u, err = b.Parse(input)
	} else {
		u, err = url.Parse(input)
		if err == nil && !u.IsAbs() {
			// A relative URL with no base is not a URL. net/url is happy to
			// parse one, which is the difference between it and WHATWG.
			return map[string]any{"ok": false}
		}
	}
	if err != nil || u == nil {
		return map[string]any{"ok": false}
	}
	host := u.Hostname()
	port := u.Port()
	pathname := u.EscapedPath()
	if pathname == "" && u.Host != "" {
		pathname = "/"
	}
	search := ""
	if u.RawQuery != "" {
		search = "?" + u.RawQuery
	}
	hash := ""
	if u.Fragment != "" {
		hash = "#" + u.EscapedFragment()
	}
	username, password := "", ""
	if u.User != nil {
		username = u.User.Username()
		password, _ = u.User.Password()
	}
	hostport := host
	if port != "" {
		hostport = host + ":" + port
	}
	return map[string]any{
		"ok":       true,
		"href":     u.String(),
		"protocol": u.Scheme + ":",
		"username": username,
		"password": password,
		"hostname": host,
		"port":     port,
		"host":     hostport,
		"pathname": pathname,
		"search":   search,
		"hash":     hash,
		"origin":   origin(u),
	}
}

func origin(u *url.URL) string {
	switch u.Scheme {
	case "http", "https", "ws", "wss", "ftp":
		return u.Scheme + "://" + u.Host
	}
	return "null"
}

// fileURLToPath is url.fileURLToPath: the inverse of pathToFileURL, and the
// thing every module does with import.meta.url when it wants to read a file
// beside itself.
func fileURLToPath(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", err
	}
	if u.Scheme != "file" {
		return "", fmt.Errorf("ERR_INVALID_URL_SCHEME: the URL must be of scheme file")
	}
	p, err := url.PathUnescape(u.Path)
	if err != nil {
		return "", err
	}
	if runtime.GOOS == "windows" {
		if u.Host != "" {
			return `\\` + u.Host + filepath.FromSlash(p), nil
		}
		return filepath.FromSlash(strings.TrimPrefix(p, "/")), nil
	}
	return p, nil
}

func pathToFileURL(p string) string {
	abs, err := filepath.Abs(p)
	if err != nil {
		abs = p
	}
	u := &url.URL{Scheme: "file", Path: filepath.ToSlash(abs)}
	if runtime.GOOS == "windows" && !strings.HasPrefix(u.Path, "/") {
		u.Path = "/" + u.Path
	}
	return u.String()
}

// encodeQuery serialises pairs the way URLSearchParams does — including the
// application/x-www-form-urlencoded space-as-plus rule, which is the one
// difference from ordinary percent-encoding that surprises people.
func encodeQuery(pairs []any) string {
	var b strings.Builder
	for i := 0; i+1 < len(pairs); i += 2 {
		if b.Len() > 0 {
			b.WriteByte('&')
		}
		b.WriteString(url.QueryEscape(fmt.Sprint(pairs[i])))
		b.WriteByte('=')
		b.WriteString(url.QueryEscape(fmt.Sprint(pairs[i+1])))
	}
	return b.String()
}

// parseQuery returns a flat [k, v, k, v] list, preserving order and repeats —
// which a map would lose, and URLSearchParams keeps.
func parseQuery(query string) []string {
	query = strings.TrimPrefix(query, "?")
	if query == "" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(query, "&") {
		if part == "" {
			continue
		}
		k, v, _ := strings.Cut(part, "=")
		dk, err := url.QueryUnescape(k)
		if err != nil {
			dk = k
		}
		dv, err := url.QueryUnescape(v)
		if err != nil {
			dv = v
		}
		out = append(out, dk, dv)
	}
	return out
}

// --- timers ------------------------------------------------------------------

// timerBindings exposes ref/unref, which the engine owns because only the loop
// knows what is keeping it alive.
func (c *Compat) timerBindings() map[string]any {
	return map[string]any{
		"unref": func(id float64) { c.rt.UnrefTimer(id) },
		"ref":   func(id float64) { c.rt.RefTimer(id) },
		"trace": func(kind string, delay, id float64, stack string) {
			if c.opts.TraceTimers != nil {
				c.opts.TraceTimers(kind, delay, id, stack)
			}
		},
		"tracing": c.opts.TraceTimers != nil,
	}
}

// --- text --------------------------------------------------------------------

func (c *Compat) textBindings() map[string]any {
	return map[string]any{
		"encode": func(s string) []byte { return []byte(s) },
		// Go strings are UTF-8 and JavaScript strings are UTF-16, and the engine
		// converts between them at the boundary — so decoding is this short and
		// still correct, including for the replacement character a lone
		// surrogate or a truncated sequence produces.
		"decode": func(b []byte) string { return string(b) },
		"base64Encode": func(b []byte) string { return base64Encode(b) },
		"base64Decode": func(s string) ([]byte, error) { return base64Decode(s) },
		"hexEncode":    func(b []byte) string { return hexEncode(b) },
		"hexDecode":    func(s string) ([]byte, error) { return hexDecode(s) },
	}
}

// --- assembly ----------------------------------------------------------------

// hostObject is everything the shims can reach, in one place. Reading this is
// reading the entire operating-system surface a script has.
func (c *Compat) hostObject() map[string]any {
	return map[string]any{
		"fs":      c.fsBindings(),
		"os":      c.osBindings(),
		"process": c.processBindings(),
		"url":     c.urlBindings(),
		"text":    c.textBindings(),
		"crypto":  c.cryptoBindings(),
		"timers":  c.timerBindings(),
		"zlib":    c.compressBindings(),
		"http":    c.httpBindings(),
		"sortStrings": func(in []string) []string {
			out := append([]string(nil), in...)
			sort.Strings(out)
			return out
		},
	}
}
