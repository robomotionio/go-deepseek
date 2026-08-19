package sdk

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Config is what a harness needs to run.
//
// Everything is optional. The zero Config runs the embedded harness in the
// current directory with the default model, reading DEEPSEEK_API_KEY from the
// process environment.
type Config struct {
	// Provider is the model route the composition registers. Defaults to
	// "deepseek-official".
	Provider string

	// Model is the model id that route resolves. Defaults to
	// "deepseek-v4-flash".
	Model string

	// BaseURL points the adapter at another endpoint — a gateway, a proxy, a
	// local server. Empty uses the provider's own.
	BaseURL string

	// APIKey is the credential. Empty reads DEEPSEEK_API_KEY from Env, and then
	// from the process environment.
	APIKey string

	// MaxTokens caps a single response. Zero leaves it to the model.
	MaxTokens int

	// CWD is the directory the agent's tools work in, and the fence they cannot
	// reach outside of. Defaults to the process's working directory.
	CWD string

	// SessionRoot is where session logs are written. Defaults to CWD/.sessions.
	SessionRoot string

	// Env is the environment the harness sees. Nil inherits the process's own,
	// which is what a command-line program wants; pass an explicit map to run
	// with less.
	Env map[string]string

	// Roots widens the filesystem fence beyond CWD. Empty fences the agent to
	// CWD, its session directory and the temporary directory — which is the
	// setting to leave alone unless the agent has a reason to read elsewhere.
	Roots []string

	// Composition is the plugin list the harness is built from. Nil uses the
	// default — see Compose, which returns that list to adjust.
	//
	// In-process only: a runtime driven over JSON-RPC composes itself.
	Composition []Entry

	// MemoryLimit bounds the JavaScript heap, in bytes. Zero means no limit,
	// which means a plugin that runs away takes the process with it rather than
	// failing.
	MemoryLimit uint64

	// Stdout and Stderr receive anything the harness prints. Nil discards it,
	// because a library that writes to the program's stdout uninvited is a
	// library people work around.
	Stdout, Stderr func([]byte)

	// TraceTimers and TraceHTTP report what the runtime is doing underneath: the
	// timers it arms, and each step of each request. Both are off unless set,
	// and both exist because two questions have no other way to be asked —
	// "what is keeping this alive?" and "is the stream stalled, or slow?".
	//
	// In-process only.
	TraceTimers func(kind string, delayMs float64, id float64, stack string)
	TraceHTTP   func(step string, id int64, detail string)

	// carrier, when set, replaces the default in-process one. Set through
	// WithRuntimeBinary or WithCarrier.
	carrier Carrier
}

// Option adjusts a Config before the harness opens.
type Option func(*Config)

// WithRuntimeBinary runs a prebuilt harness executable as a subprocess and
// speaks JSON-RPC to it, instead of running the harness in this process.
//
// Use it when you have that executable and want it — a build with plugins the
// embedded bundle does not carry, or a version pinned separately from this
// package. Everything above the carrier is unchanged.
func WithRuntimeBinary(path string, args ...string) Option {
	return func(cfg *Config) {
		cfg.carrier = &jsonrpcCarrier{bin: path, args: args, cfg: cfg}
	}
}

// WithCarrier supplies a carrier of your own — a fake for tests, a transport
// this package does not implement.
func WithCarrier(c Carrier) Option {
	return func(cfg *Config) { cfg.carrier = c }
}

// Carrier is how a harness is reached. Implement it to put the same API over a
// transport this package does not have.
type Carrier interface {
	// Start makes the harness ready to take prompts.
	Start(ctx context.Context) error

	// Prompt runs one interval: it delivers the input to the session and returns
	// when the agent is idle again, having called sink for every notification it
	// saw on the way.
	//
	// sink is called from one goroutine and must not block for long; anything
	// slow belongs behind a channel of the caller's own.
	Prompt(ctx context.Context, sessionID string, input Input, sink func(Notification)) error

	// Close releases the harness. A Carrier is not restartable.
	Close() error
}

// Harness is a running DeepSeek Harness. It is safe for concurrent use; runs on
// one session are serialised, and runs on different sessions are not.
type Harness struct {
	cfg     Config
	carrier Carrier

	mu       sync.Mutex
	closed   bool
	sessions map[string]*sync.Mutex
}

// Open starts a harness. Close it when finished.
func Open(ctx context.Context, cfg Config, opts ...Option) (*Harness, error) {
	for _, opt := range opts {
		if opt != nil {
			opt(&cfg)
		}
	}
	if cfg.Provider == "" {
		cfg.Provider = "deepseek-official"
	}
	if cfg.Model == "" {
		cfg.Model = "deepseek-v4-flash"
	}
	if cfg.CWD == "" {
		wd, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("sdk: no working directory: %w", err)
		}
		cfg.CWD = wd
	}
	abs, err := filepath.Abs(cfg.CWD)
	if err != nil {
		return nil, fmt.Errorf("sdk: working directory: %w", err)
	}
	cfg.CWD = abs
	if cfg.SessionRoot == "" {
		cfg.SessionRoot = filepath.Join(cfg.CWD, ".sessions")
	}
	if cfg.APIKey == "" {
		cfg.APIKey = cfg.Env["DEEPSEEK_API_KEY"]
	}
	if cfg.APIKey == "" {
		cfg.APIKey = os.Getenv("DEEPSEEK_API_KEY")
	}
	if cfg.BaseURL == "" {
		cfg.BaseURL = os.Getenv("DEEPSEEK_BASE_URL")
	}

	carrier := cfg.carrier
	if carrier == nil {
		carrier = newInProcess(&cfg)
	}
	if err := carrier.Start(ctx); err != nil {
		carrier.Close()
		return nil, err
	}
	return &Harness{cfg: cfg, carrier: carrier, sessions: map[string]*sync.Mutex{}}, nil
}

// Close releases the harness and everything it started.
func (h *Harness) Close() error {
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return nil
	}
	h.closed = true
	h.mu.Unlock()
	return h.carrier.Close()
}

// Session returns a handle for a session id. Turns on one id share history; a
// new id starts fresh. Calling it twice with the same id returns handles to the
// same session.
func (h *Harness) Session(id string) *Session {
	return &Session{harness: h, id: id}
}

// NewSession returns a handle with a fresh random id.
func (h *Harness) NewSession() *Session {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		// A random id that cannot be random is still an id; the clock keeps it
		// unique enough for a name, and nothing here depends on it being
		// unguessable.
		return h.Session(fmt.Sprintf("session-%d", time.Now().UnixNano()))
	}
	return h.Session("session-" + hex.EncodeToString(b[:]))
}

// Run is a turn on a session named for the occasion. Use Session when the
// history matters.
func (h *Harness) Run(ctx context.Context, input Input, opts ...RunOption) (*RunResult, error) {
	return h.NewSession().Run(ctx, input, opts...)
}

// Session is a conversation. Its turns share history and run one at a time.
type Session struct {
	harness *Harness
	id      string
}

// ID is the session's identifier, which is also the name of its log.
func (s *Session) ID() string { return s.id }

// RunResult is what one run produced.
//
// It describes the interval the run owned — from the prompt being received to
// the next whole-agent idle — rather than an answer attributable to the prompt.
// See the package documentation.
type RunResult struct {
	// SessionID is the session that ran.
	SessionID string

	// FinalResponse is the last committed assistant text in the interval.
	FinalResponse string

	// FinishReason is the kind of the last turn that ended: "completed",
	// "max-tokens", "error". Empty when no turn ended.
	FinishReason string

	// Events are the session's own events, in wire order.
	Events []Event

	// Notifications are everything the runtime sent during the interval,
	// including descendants' events for a session that delegated.
	Notifications []Notification

	// SessionRoot is where the session log was written, when one was.
	SessionRoot string

	// Duration is the wall-clock time the run took.
	Duration time.Duration
}

// ToolCalls is how many tools the run called.
func (r *RunResult) ToolCalls() int { return ToolCalls(r.Events) }

// RunOption adjusts one run.
type RunOption func(*runOptions)

type runOptions struct {
	onEvent         func(Event)
	onNotification  func(Notification)
	failOnTurnError bool
}

// OnEvent calls fn for each of the session's own events as it arrives. It is
// how a caller streams a reply rather than waiting for it.
//
// fn runs on the reading goroutine: keep it short, and hand anything slow to a
// channel.
func OnEvent(fn func(Event)) RunOption {
	return func(o *runOptions) { o.onEvent = fn }
}

// OnNotification calls fn for every notification during the run, including
// those of descendant sessions a delegation created.
func OnNotification(fn func(Notification)) RunOption {
	return func(o *runOptions) { o.onNotification = fn }
}

// FailOnTurnError makes Run report a turn that ended with a provider error as an
// error, rather than as a result whose FinishReason is "error".
//
// Off by default, because a failed turn is still a described outcome and the
// events explaining it are worth having. On for callers who would only check
// the reason and return anyway.
func FailOnTurnError() RunOption {
	return func(o *runOptions) { o.failOnTurnError = true }
}

// Run performs one turn and returns what the interval produced.
func (s *Session) Run(ctx context.Context, input Input, opts ...RunOption) (*RunResult, error) {
	if len(input) == 0 {
		return nil, errors.New("sdk: run needs at least one input block")
	}
	var options runOptions
	for _, opt := range opts {
		if opt != nil {
			opt(&options)
		}
	}

	h := s.harness
	h.mu.Lock()
	if h.closed {
		h.mu.Unlock()
		return nil, ErrClosed
	}
	lock, ok := h.sessions[s.id]
	if !ok {
		lock = &sync.Mutex{}
		h.sessions[s.id] = lock
	}
	h.mu.Unlock()

	// One turn at a time per session: the harness queues a second prompt into
	// the same inbox, and the two intervals would then overlap and report each
	// other's events.
	lock.Lock()
	defer lock.Unlock()

	started := time.Now()
	result := &RunResult{SessionID: s.id, SessionRoot: h.cfg.SessionRoot}

	err := h.carrier.Prompt(ctx, s.id, input, func(n Notification) {
		result.Notifications = append(result.Notifications, n)
		if options.onNotification != nil {
			options.onNotification(n)
		}
		if n.Method != methodSessionEvent || (n.SessionID != "" && n.SessionID != s.id) {
			return
		}
		event, ok := eventOf(n)
		if !ok {
			return
		}
		result.Events = append(result.Events, event)
		if options.onEvent != nil {
			options.onEvent(event)
		}
	})
	result.Duration = time.Since(started)
	if err != nil {
		return nil, err
	}

	result.FinalResponse = FinalResponse(result.Events)
	reason, err := FinishReason(result.Events)
	if err != nil {
		return nil, err
	}
	result.FinishReason = reason
	if options.failOnTurnError {
		if turnErr := TurnError(result.Events); turnErr != nil {
			return result, turnErr
		}
	}
	return result, nil
}

// eventOf pulls the session event out of a session.event notification.
func eventOf(n Notification) (Event, bool) {
	var payload struct {
		Event json.RawMessage `json:"event"`
	}
	if err := n.Decode(&payload); err != nil || len(payload.Event) == 0 {
		return Event{}, false
	}
	var event Event
	if err := json.Unmarshal(payload.Event, &event); err != nil {
		return Event{}, false
	}
	event.Raw = payload.Event
	return event, true
}
