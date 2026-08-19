// Command shell fills a capability seam from Go, and the agent gains `bash`.
//
// What it proves — and this is the whole point of the set. The harness declares
// `ctx.shell` as a seam: an abstract three-method service (resolve, run, start)
// that SOMEBODY must provide. Its own `tool-bash` plugin is already mounted in
// the default composition and already waiting, because it injects
// ['tools', 'shell', 'systemPrompt', 'shellEnv'] and the bundle provides every
// one of those except `shell` — nothing here can reach a subprocess, and
// node:child_process is refused by this runtime by name.
//
// So this program provides `shell`. In Go. With os/exec, an allowlist and a
// deadline it owns.
//
// The moment worth the example: h.Tools(ctx) then lists a `bash` THIS PROGRAM
// NEVER REGISTERED. Nothing was configured to make that happen and no flag was
// set — tool-bash's declared coeffect became satisfiable, so the loader mounted
// it. The dependency topology did it.
//
// Read that as the real-world shape it is: the agent gets a shell, and YOUR
// PROGRAM decides what a shell means. Every command is allowlisted, time-boxed
// and logged by code you own, in your language, in your process — rather than
// by a sandbox you configure from outside and hope you configured right.
//
// WHAT AN ALLOWLIST DOES NOT DO, because it is the thing most likely to be
// assumed. Naming the programs does not fence the FILES they touch: `cat` is a
// safe program and `cat /etc/passwd` is not a safe command. `ctx.fs` fences the
// filesystem tools, and nothing about that fence reaches a subprocess — so an
// executor has to draw its own line, and this one draws two. The command is an
// argv, never a shell string, so there is nothing to inject into. And every
// argument is checked below, because a program allowlist without an argument
// policy confines nothing worth confining.
//
// Seam: ctx.shell — @deepseek-ai/dsh-shell's ShellExecutor, whose abstract
// surface is exactly resolve/run/start plus an optional sandboxMode getter.
//
// Upstream: docs/capability-seams.md, docs/subsystems/shell.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/10-shell
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// What a shell means here. Not "bash", not "anything on PATH" — these nine
// programs, and nothing that chains, redirects or substitutes.
var allowed = map[string]bool{
	"cat": true, "cut": true, "echo": true, "grep": true, "head": true,
	"ls": true, "sort": true, "tail": true, "wc": true,
}

// Metacharacters that would smuggle a second command past a first-word
// allowlist. Refusing them is why the allowlist means anything.
const chaining = ";&|`$><\n"

const (
	defaultTimeout  = 5 * time.Second
	maximumTimeout  = 15 * time.Second
	defaultMaxBytes = 32 << 10
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-shell-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)
	if err := os.WriteFile(filepath.Join(workdir, "inventory.txt"),
		[]byte("bolts 120\nnuts 310\nscrews 45\nwashers 0\n"), 0o644); err != nil {
		log.Fatal(err)
	}

	executor := &shell{workdir: workdir}

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),
		CWD:   workdir,
		Roots: []string{workdir},
		Env:   map[string]string{"HOME": workdir},

		Plugins: []sdk.Plugin{{
			ID: "go-shell",

			// The declaration that matters. It makes this component a PROVIDER
			// of `shell`, which is what lets the harness's own tool-bash — a
			// plugin this program does not name, configure or import — become
			// satisfied and mount.
			Provide: []string{"shell"},

			Apply: executor.apply,
		}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	// ---- the payoff ---------------------------------------------------------

	schemas, err := h.Tools(ctx)
	if err != nil {
		log.Fatal(err)
	}
	names := make([]string, len(schemas))
	for i, schema := range schemas {
		names[i] = schema.Name
	}
	sort.Strings(names)
	fmt.Println("the registry:", strings.Join(names, " "))

	if !has(names, "bash") {
		fmt.Println("\nFAIL: `bash` did not appear.")
		fmt.Println("The seam was provided but tool-bash did not mount — so this")
		fmt.Println("example is a demonstration of ctx.Provide against a real seam,")
		fmt.Println("not of a tool that materialised. Check that the composition")
		fmt.Println("still carries agent-spine-demo, which is what mounts tool-bash.")
		os.Exit(1)
	}
	fmt.Println("\n`bash` is in that list, and this program never registered it.")
	fmt.Println("Compare example 05, where the same registry has no `bash` at all:")
	fmt.Println("tool-bash was mounted and waiting the whole time, one coeffect short.")

	// ---- and it works -------------------------------------------------------

	fmt.Println("\n--- the turn ---")
	result, err := h.Run(ctx, sdk.Text(
		"Using the shell: how many lines are in inventory.txt, and which line "+
			"sorts last alphabetically? Then try two things that should not work "+
			"and tell me exactly what each said: run `curl https://example.com`, "+
			"and read the file /etc/hostname with cat."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.FinalResponse)

	fmt.Println("\n--- every command, as this program saw it ---")
	ran, refused := 0, 0
	for _, entry := range executor.log() {
		fmt.Println(" ", entry.line)
		if entry.refused {
			refused++
		} else {
			ran++
		}
	}
	fmt.Printf("\n[%d commands run, %d refused by the host program]\n", ran, refused)

	if ran == 0 {
		log.Fatal("FAIL: the agent never reached the shell")
	}
	if refused == 0 {
		log.Fatal("FAIL: nothing was refused, so neither fence was exercised")
	}

	// Both fences, separately. The allowlist decides which PROGRAMS run; the
	// argument check decides which FILES they may name. A program allowlist on
	// its own would have let `cat /etc/hostname` through, because cat is on it.
	var byProgram, byPath bool
	for _, entry := range executor.log() {
		switch {
		case strings.Contains(entry.line, "not on the allowlist"):
			byProgram = true
		case strings.Contains(entry.line, "absolute path"), strings.Contains(entry.line, "climbs out"):
			byPath = true
		}
	}
	fmt.Printf("[allowlist refused a program: %v | the fence refused a path: %v]\n",
		byProgram, byPath)
	if !byProgram || !byPath {
		log.Fatal("FAIL: one of the two fences was never exercised")
	}
}

// ---- the executor -----------------------------------------------------------

type entry struct {
	line    string
	refused bool
}

type shell struct {
	workdir string

	mu      sync.Mutex
	entries []entry
}

// apply provides the service. Its three methods are the whole of upstream's
// abstract ShellExecutor: resolve, run, start.
func (s *shell) apply(ctx *sdk.Context) error {
	return ctx.Provide("shell", map[string]any{
		// resolve applies this implementation's defaults and caps to a caller's
		// request. It is SYNCHRONOUS by contract — the consumer calls
		// shell.run(shell.resolve(request)) in one expression — so it is a
		// SyncFunc, and it does nothing but arithmetic on the request.
		"resolve": ctx.SyncFunc(s.resolve),

		// run executes. A Func, so it may block: it runs on its own goroutine
		// and answers the JavaScript world with a promise.
		"run": ctx.Func(s.run),

		// start would return a live background process handle. This executor
		// has none, and says so rather than half-implementing one. A SyncFunc
		// that errors throws where the consumer calls it, which is the honest
		// failure — a Func would answer with a promise where a handle is
		// expected and break further away from the cause.
		"start": ctx.SyncFunc(func([]json.RawMessage) (any, error) {
			return nil, errors.New("this executor runs commands in the foreground only; " +
				"do not set run_in_background")
		}),
	})
}

// request is the part of upstream's ShellExecRequest this executor reads.
type request struct {
	Command        string            `json:"command"`
	Workdir        string            `json:"workdir"`
	TimeoutMS      int64             `json:"timeoutMs"`
	StdoutMaxBytes int64             `json:"stdoutMaxBytes"`
	DshEnv         map[string]string `json:"dshEnv"`
	Env            map[string]string `json:"env"`
}

// resolve fills and caps every required field, so run never has to.
//
// The request also carries an optional AbortSignal. It is deliberately dropped:
// the signal is a live JavaScript object, and honouring it from Go would mean
// holding it across the bridge for the life of the command. The deadline below
// is this executor's cancellation, and a caller that cancels waits at most
// timeoutMs longer than it hoped.
func (s *shell) resolve(args []json.RawMessage) (any, error) {
	var in request
	if len(args) > 0 {
		if err := json.Unmarshal(args[0], &in); err != nil {
			return nil, err
		}
	}

	timeout := time.Duration(in.TimeoutMS) * time.Millisecond
	if timeout <= 0 {
		timeout = defaultTimeout
	}
	if timeout > maximumTimeout {
		timeout = maximumTimeout
	}

	workdir := in.Workdir
	if workdir == "" {
		workdir = s.workdir
	}
	// The fence, restated here because a spec is what run trusts. A workdir
	// outside the workspace is not an error to report later; it is one to
	// remove now.
	if rel, err := filepath.Rel(s.workdir, workdir); err != nil || strings.HasPrefix(rel, "..") {
		workdir = s.workdir
	}

	maxBytes := in.StdoutMaxBytes
	if maxBytes <= 0 {
		maxBytes = defaultMaxBytes
	}

	return map[string]any{
		"command":        in.Command,
		"workdir":        workdir,
		"timeoutMs":      timeout.Milliseconds(),
		"stdoutMaxBytes": maxBytes,
		"dshEnv":         in.DshEnv,
		"env":            in.Env,
		// Required by the spec's shape; this executor does not confine, so it
		// carries no policy.
		"sandboxPolicy": nil,
	}, nil
}

// run is the seam's one interesting method. Upstream's contract: it REJECTS
// only for infrastructure failures — a non-zero exit, a timeout kill or a
// refusal all resolve with a descriptive result, because those are outcomes the
// model should read rather than errors the harness should raise.
func (s *shell) run(args []json.RawMessage) (any, error) {
	var spec request
	if len(args) > 0 {
		if err := json.Unmarshal(args[0], &spec); err != nil {
			return nil, err
		}
	}

	argv, refusal := parse(spec.Command)
	if refusal != "" {
		s.note(fmt.Sprintf("REFUSED  %-40s %s", clip(spec.Command), refusal), true)
		// 126 is the shell's own "found it, would not run it". The reason goes
		// on stderr, where the model reads it and adapts.
		return refused(refusal), nil
	}

	maxBytes := int(spec.StdoutMaxBytes)
	if maxBytes <= 0 {
		maxBytes = defaultMaxBytes
	}
	timeout := time.Duration(spec.TimeoutMS) * time.Millisecond

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, argv[0], argv[1:]...)
	cmd.Dir = spec.Workdir
	// The child's whole environment, assembled here rather than inherited. The
	// harness's own DSH_* facts merge last, which is upstream's rule.
	cmd.Env = environ(spec)

	// Collected as it arrives, not afterwards. cmd.Output() would read the
	// whole stream into memory and leave the cap to trim what gets REPORTED —
	// a budget that bounds the report and not the process, which is the wrong
	// half. These bound both.
	stdout := &tail{max: maxBytes}
	stderr := &tail{max: maxBytes}
	cmd.Stdout, cmd.Stderr = stdout, stderr

	started := time.Now()
	err := cmd.Run()
	took := time.Since(started)

	// A command that never started has no exit status to report; one that ran
	// always has one, including when a signal ended it.
	if err != nil && cmd.ProcessState == nil {
		s.note(fmt.Sprintf("FAILED   %-40s %v", clip(spec.Command), err), false)
		out := collected(127, stdout, stderr, timeout)
		out["stderr"] = map[string]any{"text": err.Error(), "truncated": false}
		return out, nil
	}

	if ctx.Err() != nil {
		s.note(fmt.Sprintf("TIMEOUT  %-40s after %v", clip(spec.Command), timeout), false)
		out := collected(0, stdout, stderr, timeout)
		out["exitCode"] = nil
		out["signal"] = "SIGKILL"
		out["timedOut"] = true
		return out, nil
	}

	code := cmd.ProcessState.ExitCode()
	s.note(fmt.Sprintf("ran      %-40s exit %d in %v",
		clip(spec.Command), code, took.Round(time.Millisecond)), false)
	return collected(code, stdout, stderr, timeout), nil
}

// collected builds upstream's ShellRunResult. Its shape is small and fixed:
// exitCode, signal, timedOut, aborted, timeoutMs, and two CollectedOutputs.
func collected(exitCode int, stdout, stderr *tail, timeout time.Duration) map[string]any {
	return map[string]any{
		"exitCode":  exitCode,
		"signal":    nil,
		"timedOut":  false,
		"aborted":   false,
		"timeoutMs": timeout.Milliseconds(),
		"stdout":    stdout.collected(),
		"stderr":    stderr.collected(),
	}
}

// refused is the result for a command this executor would not run at all.
func refused(reason string) map[string]any {
	return map[string]any{
		"exitCode":  126,
		"signal":    nil,
		"timedOut":  false,
		"aborted":   false,
		"timeoutMs": defaultTimeout.Milliseconds(),
		"stdout":    map[string]any{"text": "", "truncated": false},
		"stderr": map[string]any{
			"text":      "refused by the host program: " + reason,
			"truncated": false,
		},
	}
}

// tail keeps the LAST max bytes of a stream and says when it dropped any,
// which is the shape upstream's CollectedOutput describes — a truncated
// capture is the END of the output, and the model is told so rather than left
// to assume it read the whole thing.
//
// It never holds more than max, so the budget bounds this process's memory and
// not merely its report.
type tail struct {
	max       int
	buf       []byte
	truncated bool
}

func (t *tail) Write(p []byte) (int, error) {
	n := len(p)
	switch {
	case t.max <= 0:
		return n, nil
	case len(p) >= t.max:
		t.truncated = t.truncated || len(t.buf) > 0 || len(p) > t.max
		t.buf = append(t.buf[:0], p[len(p)-t.max:]...)
	default:
		if over := len(t.buf) + len(p) - t.max; over > 0 {
			t.truncated = true
			t.buf = append(t.buf[:0], t.buf[over:]...)
		}
		t.buf = append(t.buf, p...)
	}
	return n, nil
}

func (t *tail) collected() map[string]any {
	return map[string]any{"text": string(t.buf), "truncated": t.truncated}
}

// environ is the child
// caller's extras, then the harness's managed DSH_* facts last, so a caller
// entry can never displace a managed one.
func environ(spec request) []string {
	merged := map[string]string{
		"PATH": os.Getenv("PATH"),
		"HOME": spec.Workdir,
		"LANG": "C",
	}
	for key, value := range spec.Env {
		merged[key] = value
	}
	for key, value := range spec.DshEnv {
		merged[key] = value
	}
	out := make([]string, 0, len(merged))
	for key, value := range merged {
		out = append(out, key+"="+value)
	}
	sort.Strings(out)
	return out
}

// parse turns a command line into an argv, or explains why it will not.
//
// Note what it does NOT do: hand the string to `bash -c`. The tool tells the
// model it is talking to bash, and this executor answers a deliberately smaller
// question — which is the freedom the seam gives you. There is no shell here to
// be injected into, so the checks below are not injection defences; they are
// this executor deciding what it is willing to be.
func parse(command string) (argv []string, refusal string) {
	command = strings.TrimSpace(command)
	if command == "" {
		return nil, "the command is empty"
	}

	words, ok := split(command)
	if !ok {
		return nil, "the command has an unterminated quote"
	}

	// The chaining check runs on the SPLIT words rather than the raw string,
	// and skips the quoted ones. Both halves matter. A `;` inside quotes is an
	// ordinary character that a shell would have passed through, so refusing
	// `grep "a;b" notes.txt` would be this executor inventing a rule. A `;`
	// outside quotes means the model expected a shell — and since there is not
	// one, running only the first word with the rest as its arguments would do
	// something quietly wrong instead of saying so.
	for _, word := range words {
		if word.quoted {
			continue
		}
		if i := strings.IndexAny(word.text, chaining); i >= 0 {
			return nil, fmt.Sprintf(
				"%q chains, redirects or substitutes, and this shell runs exactly one program",
				string(word.text[i]))
		}
	}

	argv = make([]string, len(words))
	for i, word := range words {
		argv[i] = word.text
	}
	if !allowed[argv[0]] {
		return nil, fmt.Sprintf("%q is not on the allowlist; allowed programs are %s",
			argv[0], strings.Join(allowlist(), ", "))
	}
	if refusal := fence(argv); refusal != "" {
		return nil, refusal
	}
	return argv, ""
}

// fence keeps the command's ARGUMENTS inside the workspace.
//
// This is the half an allowlist does not cover, and the half worth having.
// `cat` is a safe program; `cat /etc/passwd` is not a safe command, and every
// program on the list above will read whatever path it is handed. So paths are
// required to be relative and to stay put: the command runs with cmd.Dir set to
// the workspace, and a relative path with no `..` in it cannot leave.
//
// A symlink inside the workspace still points wherever it points — closing that
// means resolving every argument against the real path, which is where an
// example stops and a real executor keeps going.
func fence(argv []string) string {
	for _, arg := range argv[1:] {
		candidate := arg
		if strings.HasPrefix(arg, "-") {
			// A flag, unless it carries its value inline (--file=PATH).
			_, value, found := strings.Cut(arg, "=")
			if !found {
				continue
			}
			candidate = value
		}
		if candidate == "" {
			continue
		}
		if filepath.IsAbs(candidate) || strings.HasPrefix(candidate, "~") {
			return fmt.Sprintf("%q is an absolute path, and this shell reaches only the workspace", candidate)
		}
		for _, part := range strings.Split(filepath.ToSlash(candidate), "/") {
			if part == ".." {
				return fmt.Sprintf("%q climbs out of the workspace", candidate)
			}
		}
	}
	return ""
}

// word is one argument and whether it arrived quoted, which is the only thing
// the chaining check needs to tell data from punctuation.
type word struct {
	text   string
	quoted bool
}

// split is a quote-aware field split — enough for `grep -c "a;b" file.txt`, and
// deliberately no more.
func split(command string) ([]word, bool) {
	var words []word
	var current strings.Builder
	var quote rune
	inWord, wasQuoted := false, false

	for _, r := range command {
		switch {
		case quote != 0:
			if r == quote {
				quote = 0
			} else {
				current.WriteRune(r)
			}
		case r == '\'' || r == '"':
			quote, inWord, wasQuoted = r, true, true
		case r == ' ' || r == '\t':
			if inWord {
				words = append(words, word{text: current.String(), quoted: wasQuoted})
				current.Reset()
				inWord, wasQuoted = false, false
			}
		default:
			current.WriteRune(r)
			inWord = true
		}
	}
	if quote != 0 {
		return nil, false
	}
	if inWord {
		words = append(words, word{text: current.String(), quoted: wasQuoted})
	}
	return words, len(words) > 0
}

func allowlist() []string {
	names := make([]string, 0, len(allowed))
	for name := range allowed {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

func (s *shell) note(line string, refused bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.entries = append(s.entries, entry{line: line, refused: refused})
}

func (s *shell) log() []entry {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]entry(nil), s.entries...)
}

func clip(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > 40 {
		return s[:39] + "…"
	}
	return s
}

func has(values []string, want string) bool {
	for _, value := range values {
		if value == want {
			return true
		}
	}
	return false
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
