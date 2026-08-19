// Package deepseek runs the DeepSeek Harness inside a Go program.
//
// The harness is TypeScript, and everything it needs to run is here: a pure-Go
// JavaScript engine (goant), a Node-compatible runtime built on Go's own
// filesystem and networking (nodecompat), and the harness itself compiled into
// the binary (bundle). There is no Node.js to install, no native addon to build
// and nothing to fetch — so this cross-compiles wherever Go does, which is the
// whole reason it exists.
//
// A Harness owns one JavaScript world on one goroutine. Every method here is
// safe to call from any goroutine; each is a message to that one.
package runtime

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/robomotionio/goant"
)

// Config is everything a Harness needs to start.
type Config struct {
	// Provider and Model name the LLM route, matching what the composition's
	// adapter entry advertises — "deepseek-official" and a model id.
	Provider string
	Model    string

	// BaseURL and APIKey override the adapter's endpoint and credential. Both
	// reach the harness through the environment rather than through the entry
	// config, because that is where the adapter looks for them and because a key
	// in an entry config is a key in a saved flow.
	BaseURL string
	APIKey  string

	// MaxTokens bounds a single response. Zero leaves it to the model.
	MaxTokens int

	// CWD is the working directory the agent's tools operate in. It is also the
	// fence: with Roots empty, this is the only place the filesystem tools can
	// reach.
	CWD string

	// Roots widens the filesystem fence beyond CWD. Empty means CWD alone;
	// explicitly nil-and-unfenced is not expressible here on purpose.
	Roots []string

	// SessionRoot is where the JSONL session log is written. Empty puts it under
	// CWD/.sessions, which is what the upstream examples do.
	SessionRoot string

	// Composition is the cordis entry list, already resolved. Build one with
	// Compose rather than by hand; see composition.go for why the shape has the
	// rules it does.
	Composition []Entry

	// Env is the environment the harness sees. Nil means an empty one: inheriting
	// every variable of the process that started it is how a credential ends up
	// somewhere it was never meant to go.
	Env map[string]string

	// MemoryLimit bounds the JavaScript heap, in bytes. Zero means no limit,
	// which means a runaway plugin can take the process down instead of failing.
	MemoryLimit uint64

	// Platform overrides what process.platform reports. Empty means this one.
	Platform string

	// Stdout and Stderr receive whatever the harness writes. Nil sends it to the
	// process's own.
	Stdout, Stderr func([]byte)

	// TraceTimers, when set, reports every timer the harness arms. It answers
	// "what is keeping the loop alive", which is otherwise a question with no
	// good way to ask it. Optional, and off by default.
	TraceTimers func(kind string, delayMs float64, id float64, stack string)

	// TraceHTTP, when set, reports each step of every request the harness makes.
	// Optional, and off by default.
	TraceHTTP func(step string, id int64, detail string)

	// Resolver supplies modules that are neither the harness nor Node — a plugin
	// the host compiled itself. Optional.
	Resolver Resolver

	// Plugins are cordis plugins implemented in Go. Each one is mounted by the
	// loader like any other entry, and registers tools that run in this process.
	// See plugin.go.
	Plugins []Plugin
}

// Entry is one row of the composition: a plugin, its id, and its configuration.
// It mirrors the cordis entry the harness reads from YAML, so a composition
// built here is one upstream could load.
type Entry struct {
	// ID is the row's identity. Two rows may name the same plugin; their ids
	// distinguish them, and an id is what an override targets.
	ID string `json:"id"`

	// Name is the plugin specifier — a package name in the bundle.
	Name string `json:"name"`

	// Config is the plugin's configuration. It REPLACES the plugin's defaults
	// wholesale rather than merging into them, which is the harness's rule and
	// the reason an override has to restate every key it cares about.
	Config map[string]any `json:"config,omitempty"`

	// Disabled leaves the row in the composition without mounting it. This is
	// how a plugin is turned off without losing its configuration.
	Disabled bool `json:"disabled,omitempty"`

	// Isolate and Intercept are cordis's service-scoping controls, passed
	// through unexamined.
	Isolate   map[string]any `json:"isolate,omitempty"`
	Intercept map[string]any `json:"intercept,omitempty"`

	// Group marks a row that contains others, and Children are those rows.
	Group    bool    `json:"group,omitempty"`
	Children []Entry `json:"config_group,omitempty"`
}

// Block is one piece of a turn's input.
type Block struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// Text is the ordinary case: a turn that is a sentence.
func Text(s string) []Block { return []Block{{Type: "text", Text: s}} }

// Result is what one turn produced.
type Result struct {
	// Text is the assistant's final answer, with tool calls and reasoning left
	// out — what a caller means by "what did it say".
	Text string `json:"text"`

	// FinishReason is why the turn ended: "completed", or whatever the model
	// reported when it did not.
	FinishReason string `json:"finishReason"`

	// Events is how many session events the turn produced.
	Events int `json:"events"`

	// Duration is the wall-clock time the turn took.
	Duration time.Duration `json:"-"`
}

// ToolSchema is one tool as the model is shown it.
type ToolSchema struct {
	Name        string `json:"name"`
	Description string `json:"description"`

	// Parameters is the JSON Schema of the arguments, left as JSON because it is
	// a schema — something to forward, render or validate against, not something
	// to model in Go.
	Parameters json.RawMessage `json:"parameters,omitempty"`
}

// SessionEvent is one event from the harness's own stream, in its own
// vocabulary. The payload is left as raw JSON: the harness defines dozens of
// event types and inventing a Go struct for each would be a translation to
// maintain against every upstream release, for a consumer that mostly wants to
// forward them.
type SessionEvent struct {
	SessionID string          `json:"sessionId"`
	Type      string          `json:"type"`
	Data      json.RawMessage `json:"data,omitempty"`
	Raw       json.RawMessage `json:"-"`
}

// Harness is a running DeepSeek Harness.
type Harness interface {
	// Start boots the composition. It returns once every entry has mounted, so a
	// composition that will not load fails here rather than at the first turn.
	Start(ctx context.Context) error

	// Run performs one turn and returns what it produced. Turns on one session
	// id share an agent and its history; a new id starts fresh.
	Run(ctx context.Context, sessionID string, input []Block) (*Result, error)

	// Tools lists the tools the agent can call, as the model is shown them. It
	// is the way to confirm that a plugin registered what it meant to.
	Tools(ctx context.Context) ([]ToolSchema, error)

	// Events is the session event stream. It is buffered and lossy by design: a
	// consumer that stops reading must not stall the agent, so events are
	// dropped rather than queued without bound.
	Events() <-chan SessionEvent

	// Close disposes the harness and releases the engine. A Harness cannot be
	// restarted.
	Close() error
}

// New builds a Harness. Nothing runs until Start.
func New(cfg Config) (Harness, error) {
	if cfg.CWD == "" {
		wd, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("deepseek: no working directory: %w", err)
		}
		cfg.CWD = wd
	}
	abs, err := filepath.Abs(cfg.CWD)
	if err != nil {
		return nil, fmt.Errorf("deepseek: working directory: %w", err)
	}
	cfg.CWD = abs
	if cfg.SessionRoot == "" {
		cfg.SessionRoot = filepath.Join(cfg.CWD, ".sessions")
	}
	if len(cfg.Roots) == 0 {
		// The fence defaults to the working directory plus the session log,
		// which may legitimately be elsewhere.
		cfg.Roots = []string{cfg.CWD, cfg.SessionRoot, os.TempDir()}
	}
	if len(cfg.Composition) == 0 {
		cfg.Composition = Compose(cfg)
	}
	if err := validatePlugins(cfg.Plugins, cfg.Composition); err != nil {
		return nil, err
	}
	// A Go plugin is an entry like any other, so it joins the composition before
	// it is validated rather than after: one check, and one place that decides
	// whether a composition is well formed.
	cfg.Composition = append(cfg.Composition, pluginEntries(cfg.Plugins)...)
	if err := validate(cfg.Composition); err != nil {
		return nil, err
	}
	return &harness{cfg: cfg, events: make(chan SessionEvent, 256)}, nil
}

// harness owns the goroutine that owns the Runtime.
//
// A goant Runtime is single-goroutine, like every JavaScript engine. Rather than
// asking callers to respect that, one goroutine holds it and everything else is
// a message: Run sends a request and waits for the reply, Close sends a
// shutdown. That is why every method here is safe from anywhere.
type harness struct {
	cfg    Config
	events chan SessionEvent

	mu      sync.Mutex
	started bool
	closed  bool

	requests chan *request
	stopped  chan struct{}
	startErr chan error

	// base is cancelled when the harness shuts down, and every Go plugin's work
	// derives from it: closing the harness has to stop what it started, or Close
	// returns while goroutines are still writing files.
	base       context.Context
	cancelBase context.CancelFunc

	// bridge carries everything between Go plugins and their cordis contexts.
	// Nil when the composition has no Go plugins.
	bridge *bridge
}

// request is one unit of work for the owning goroutine.
//
// It is a closure rather than a turn because a turn is not the only thing that
// needs the engine, and everything that does has to happen on the one goroutine
// that owns it. Anything else is a data race that looks like working code.
type request struct {
	ctx   context.Context
	job   func(*engine) (any, error)
	reply chan replyMessage
}

type replyMessage struct {
	value any
	err   error
}

var errClosed = errors.New("deepseek: harness is closed")

func (h *harness) Start(ctx context.Context) error {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return errClosed
	}
	if h.started {
		h.mu.Unlock()
		return errors.New("deepseek: harness is already started")
	}
	h.started = true
	h.requests = make(chan *request)
	h.stopped = make(chan struct{})
	h.startErr = make(chan error, 1)
	h.mu.Unlock()

	go h.own()

	select {
	case err := <-h.startErr:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (h *harness) Run(ctx context.Context, sessionID string, input []Block) (*Result, error) {
	h.mu.Lock()
	started, closed := h.started, h.closed
	h.mu.Unlock()
	if closed {
		return nil, errClosed
	}
	if !started {
		return nil, errors.New("deepseek: harness has not been started")
	}
	if sessionID == "" {
		sessionID = "main"
	}
	value, err := h.submit(ctx, func(eng *engine) (any, error) {
		return h.turn(eng, ctx, sessionID, input)
	})
	if err != nil {
		return nil, err
	}
	return value.(*Result), nil
}

// Tools lists what the agent can call: every tool the composition registered,
// the harness's own and a Go plugin's alike.
func (h *harness) Tools(ctx context.Context) ([]ToolSchema, error) {
	value, err := h.submit(ctx, func(eng *engine) (any, error) {
		return h.listTools(eng)
	})
	if err != nil {
		return nil, err
	}
	return value.([]ToolSchema), nil
}

// submit hands one job to the owning goroutine and waits for its answer.
func (h *harness) submit(ctx context.Context, job func(*engine) (any, error)) (any, error) {
	h.mu.Lock()
	started, closed := h.started, h.closed
	h.mu.Unlock()
	if closed {
		return nil, errClosed
	}
	if !started {
		return nil, errors.New("deepseek: harness has not been started")
	}
	req := &request{ctx: ctx, job: job, reply: make(chan replyMessage, 1)}
	select {
	case h.requests <- req:
	case <-h.stopped:
		return nil, errClosed
	case <-ctx.Done():
		return nil, ctx.Err()
	}
	select {
	case reply := <-req.reply:
		return reply.value, reply.err
	case <-h.stopped:
		return nil, errClosed
	case <-ctx.Done():
		// The job keeps running on the owning goroutine until its own context
		// check stops it; interrupting the engine is what actually ends it, and
		// that is done by the goroutine itself when it sees the context is done.
		return nil, ctx.Err()
	}
}

func (h *harness) Events() <-chan SessionEvent { return h.events }

func (h *harness) Close() error {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return nil
	}
	h.closed = true
	started := h.started
	h.mu.Unlock()
	if !started {
		close(h.events)
		return nil
	}
	close(h.requests)
	<-h.stopped
	return nil
}

// emit delivers an event without ever blocking the agent. A consumer that has
// stopped reading loses events, which is the right trade: the alternative is an
// unbounded queue, or a turn that stalls because nobody is listening.
func (h *harness) emit(event SessionEvent) {
	select {
	case h.events <- event:
	default:
	}
}

// own is the goroutine that holds the Runtime for the harness's whole life.
func (h *harness) own() {
	defer close(h.stopped)
	defer close(h.events)

	h.base, h.cancelBase = context.WithCancel(context.Background())
	// Cancelling before the engine closes, not after: a plugin goroutine holding
	// a file or a request should be told to stop while the world it answers into
	// still exists.
	defer h.cancelBase()
	defer func() {
		if h.bridge != nil {
			h.bridge.close()
		}
	}()

	eng, err := newEngine(h.cfg, h.cfg.Resolver)
	if err != nil {
		h.startErr <- err
		return
	}
	defer eng.close()

	if err := h.install(eng); err != nil {
		h.startErr <- err
		return
	}
	if err := h.bootstrap(eng); err != nil {
		h.startErr <- err
		return
	}
	h.startErr <- nil

	for req := range h.requests {
		value, err := req.job(eng)
		req.reply <- replyMessage{value: value, err: err}
	}
	h.shutdown(eng)
}

// install puts the two things the boot script needs on the global: the event
// sink, and its options.
func (h *harness) install(eng *engine) error {
	if err := eng.rt.Set("__dshEmit", func(sessionID, payload string) {
		var raw map[string]json.RawMessage
		if err := json.Unmarshal([]byte(payload), &raw); err != nil {
			return
		}
		event := SessionEvent{SessionID: sessionID, Raw: json.RawMessage(payload)}
		if t, ok := raw["type"]; ok {
			_ = json.Unmarshal(t, &event.Type)
		}
		if d, ok := raw["data"]; ok {
			event.Data = d
		}
		h.emit(event)
	}); err != nil {
		return err
	}
	if err := h.installBridge(eng); err != nil {
		return err
	}
	entries, err := json.Marshal(h.cfg.Composition)
	if err != nil {
		return fmt.Errorf("deepseek: composition: %w", err)
	}
	options := fmt.Sprintf(`globalThis.__dshOptions = { entries: %s };`, entries)
	if _, err := eng.rt.RunScript("dsh:/options.js", options); err != nil {
		return fmt.Errorf("deepseek: options: %w", err)
	}
	return nil
}

// installBridge wires the Go plugin bridge, if there is anything to bridge.
func (h *harness) installBridge(eng *engine) error {
	if len(h.cfg.Plugins) == 0 {
		return nil
	}
	h.bridge = newBridge(eng.rt, h.cfg.Plugins)
	h.bridge.base = h.base
	return h.bridge.install()
}

// bootstrap runs the boot module, which mounts the composition. Its top level
// awaits, so the module's own evaluation is the boot.
func (h *harness) bootstrap(eng *engine) error {
	src, err := bootSource()
	if err != nil {
		return err
	}
	if _, err := eng.rt.RunModule("dsh:/boot.js", src); err != nil {
		return fmt.Errorf("deepseek: boot: %w", withStack(err))
	}
	if err := eng.rt.RunLoop(context.Background()); err != nil {
		return fmt.Errorf("deepseek: boot: %w", withStack(err))
	}
	return nil
}

// withStack keeps the JavaScript stack attached to an error crossing into Go.
//
// A failure inside a plugin arrives as one line — "value is not a function" —
// and that line is the same for a hundred different mistakes. The stack is the
// only thing that says which one, and it is thrown away by default because a Go
// error is a string.
func withStack(err error) error {
	var jsErr *goant.Error
	if !errors.As(err, &jsErr) || jsErr.Stack == "" {
		return err
	}
	return fmt.Errorf("%w\n%s", err, jsErr.Stack)
}

// turn runs one request. The engine is interrupted if the caller's context ends,
// which is what makes a cancelled turn actually stop rather than finish quietly.
func (h *harness) turn(eng *engine, reqCtx context.Context, sessionID string, input []Block) (*Result, error) {
	started := time.Now()
	stop := eng.rt.WithContext(reqCtx)
	defer func() {
		stop()
		eng.rt.ClearInterrupt()
	}()

	text := ""
	for _, block := range input {
		text += block.Text
	}
	agentOptions := map[string]any{
		"provider": h.cfg.Provider,
		"model":    h.cfg.Model,
		"cwd":      h.cfg.CWD,
	}
	call, err := eng.rt.Get("__dsh")
	if err != nil {
		return nil, err
	}
	run, err := call.Object().Get("run")
	if err != nil {
		return nil, err
	}
	promise, err := run.Function().Call(sessionID, text, agentOptions)
	if err != nil {
		return nil, fmt.Errorf("deepseek: run: %w", err)
	}
	settled, err := eng.rt.AwaitContext(reqCtx, promise)
	if err != nil {
		return nil, fmt.Errorf("deepseek: turn: %w", err)
	}
	var result Result
	if err := json.Unmarshal([]byte(settled.String()), &result); err != nil {
		return nil, fmt.Errorf("deepseek: turn result: %w", err)
	}
	result.Duration = time.Since(started)
	return &result, nil
}

// listTools asks the registry what it holds. It runs on the owning goroutine,
// like everything else that touches the engine.
func (h *harness) listTools(eng *engine) ([]ToolSchema, error) {
	call, err := eng.rt.Get("__dsh")
	if err != nil {
		return nil, err
	}
	fn, err := call.Object().Get("tools")
	if err != nil {
		return nil, err
	}
	value, err := fn.Function().Call()
	if err != nil {
		return nil, fmt.Errorf("deepseek: tools: %w", withStack(err))
	}
	var schemas []ToolSchema
	if err := json.Unmarshal([]byte(value.String()), &schemas); err != nil {
		return nil, fmt.Errorf("deepseek: tools: %w", err)
	}
	return schemas, nil
}

// shutdown disposes the cordis tree so that plugins holding processes or files
// let go of them, then gives the loop a bounded moment to finish that work.
func (h *harness) shutdown(eng *engine) {
	call, err := eng.rt.Get("__dsh")
	if err != nil {
		return
	}
	dispose, err := call.Object().Get("dispose")
	if err != nil {
		return
	}
	promise, err := dispose.Function().Call()
	if err != nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = eng.rt.AwaitContext(ctx, promise)
}

// compile-time check that the implementation satisfies the interface a caller
// programs against.
var _ Harness = (*harness)(nil)
