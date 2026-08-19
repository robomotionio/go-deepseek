package sdk

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// The JSON-RPC carrier: a prebuilt harness executable, spoken to over
// newline-delimited JSON on its stdin and stdout.
//
// It is the same protocol the official Python SDK uses, deliberately — the same
// methods, the same notification names, the same run-interval rule — so that
// this package can drive an executable built and shipped by upstream, and so
// that behaviour matches between the two carriers for reasons other than luck.
//
// The interval here is not "while the call is inside", as it is in process. The
// transport is asynchronous and shared: a prompt returns a message id
// immediately, other sessions' work interleaves on the same connection, and the
// run owns everything from the durable receipt of THAT message to the next idle
// for THAT session.

type jsonrpcCarrier struct {
	bin  string
	args []string
	cfg  *Config

	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout *bufio.Reader

	writeMu sync.Mutex

	mu        sync.Mutex
	nextID    int64
	pending   map[int64]chan *rpcResponse
	listeners map[int64]func(Notification)
	nextHook  int64
	stderr    []string
	closed    bool
	failure   error
	readDone  chan struct{}
}

type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      int64  `json:"id,omitempty"`
	Method  string `json:"method"`
	Params  any    `json:"params,omitempty"`
}

type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      *int64          `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	Result  json.RawMessage `json:"result"`
	Error   *struct {
		Code    int             `json:"code"`
		Message string          `json:"message"`
		Data    json.RawMessage `json:"data"`
	} `json:"error"`
}

func (c *jsonrpcCarrier) Start(ctx context.Context) error {
	c.pending = map[int64]chan *rpcResponse{}
	c.listeners = map[int64]func(Notification){}
	c.readDone = make(chan struct{})

	cmd := exec.Command(c.bin, c.args...)
	cmd.Dir = c.cfg.CWD
	cmd.Env = c.environment()

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return &StartError{Reason: "cannot write to the runtime: " + err.Error()}
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return &StartError{Reason: "cannot read from the runtime: " + err.Error()}
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return &StartError{Reason: "cannot read the runtime's diagnostics: " + err.Error()}
	}
	if err := cmd.Start(); err != nil {
		return &StartError{Reason: fmt.Sprintf("cannot start %s: %v", c.bin, err)}
	}
	c.cmd = cmd
	c.stdin = stdin
	c.stdout = bufio.NewReaderSize(stdout, 1<<20)

	go c.readLoop()
	go c.readStderr(stderr)

	// initialize is a handshake and a configuration in one: the runtime learns
	// the working directory, the route and the model before any session exists.
	params := map[string]any{
		"cwd":      c.cfg.CWD,
		"provider": c.cfg.Provider,
		"model":    c.cfg.Model,
	}
	if c.cfg.MaxTokens > 0 {
		params["maxTokens"] = c.cfg.MaxTokens
	}
	if _, err := c.call(ctx, "initialize", params, nil); err != nil {
		c.Close()
		return &StartError{Reason: "the runtime did not initialize: " + err.Error(), Stderr: c.diagnostics()}
	}
	return nil
}

// environment builds the subprocess's environment. The harness reads its
// credentials and its session root from there rather than from the wire, which
// is why this is not simply the caller's Env.
func (c *jsonrpcCarrier) environment() []string {
	env := map[string]string{}
	if c.cfg.Env == nil {
		for _, kv := range os.Environ() {
			if k, v, ok := strings.Cut(kv, "="); ok {
				env[k] = v
			}
		}
	} else {
		for k, v := range c.cfg.Env {
			env[k] = v
		}
	}
	if c.cfg.APIKey != "" {
		env["DEEPSEEK_API_KEY"] = c.cfg.APIKey
	}
	if c.cfg.BaseURL != "" {
		env["DEEPSEEK_BASE_URL"] = c.cfg.BaseURL
	}
	if c.cfg.SessionRoot != "" {
		env["DSH_SESSION_ROOT"] = c.cfg.SessionRoot
	}
	env["DSH_CWD"] = c.cfg.CWD

	out := make([]string, 0, len(env))
	for k, v := range env {
		out = append(out, k+"="+v)
	}
	return out
}

// Prompt sends the input and waits for the interval to close.
func (c *jsonrpcCarrier) Prompt(ctx context.Context, sessionID string, input Input, sink func(Notification)) error {
	blocks := make([]map[string]any, len(input))
	for i, b := range input {
		block := map[string]any{"type": b.Type}
		if b.Text != "" {
			block["text"] = b.Text
		}
		blocks[i] = block
	}

	// Notifications are QUEUED from the moment the listener is registered, and
	// examined only after the prompt's response names the message id.
	//
	// Doing it live instead is a race the first scripted test found: the durable
	// receipt can arrive before the response that says which message it is for,
	// and a listener that has no id yet has no way to recognise it. Dropping that
	// one notification loses the start of the interval, so the idle that ends it
	// is never reached and the run waits for its context. The Python SDK buffers
	// for the same reason.
	queue := newNotificationQueue()
	unhook := c.listen(queue.push)
	defer unhook()

	result, err := c.call(ctx, "session/prompt", map[string]any{
		"sessionId":     sessionID,
		"contentBlocks": blocks,
	}, nil)
	if err != nil {
		return err
	}
	var prompt struct {
		MessageID string `json:"messageId"`
	}
	if err := json.Unmarshal(result, &prompt); err != nil || prompt.MessageID == "" {
		return fmt.Errorf("%w: session/prompt returned no messageId", ErrProtocol)
	}

	open := false
	for {
		n, err := queue.next(ctx, c.readDone)
		if err != nil {
			if errors.Is(err, ErrTransportClosed) {
				return c.transportError()
			}
			return err
		}
		if !open {
			// Everything before this prompt's own receipt belongs to whatever the
			// session was already doing.
			if !isInboxReceipt(n, sessionID, prompt.MessageID) {
				continue
			}
			open = true
		}
		sink(n)
		if isIdle(n, sessionID) {
			return nil
		}
	}
}

// notificationQueue is an unbounded FIFO between the transport's reader and one
// run.
//
// Unbounded on purpose: the alternative is dropping, and the notification that
// gets dropped under load is as likely to be the idle that ends the run as any
// other. The queue lives exactly as long as one Prompt call, so its size is
// bounded in practice by how much a single turn can emit.
type notificationQueue struct {
	mu     sync.Mutex
	items  []Notification
	signal chan struct{}
}

func newNotificationQueue() *notificationQueue {
	return &notificationQueue{signal: make(chan struct{}, 1)}
}

func (q *notificationQueue) push(n Notification) {
	q.mu.Lock()
	q.items = append(q.items, n)
	q.mu.Unlock()
	select {
	case q.signal <- struct{}{}:
	default:
	}
}

func (q *notificationQueue) next(ctx context.Context, closed <-chan struct{}) (Notification, error) {
	for {
		q.mu.Lock()
		if len(q.items) > 0 {
			n := q.items[0]
			q.items = q.items[1:]
			q.mu.Unlock()
			return n, nil
		}
		q.mu.Unlock()

		select {
		case <-q.signal:
		case <-ctx.Done():
			return Notification{}, ctx.Err()
		case <-closed:
			// Drain what arrived before the transport went: the last thing a
			// runtime does before exiting may be the answer.
			q.mu.Lock()
			if len(q.items) > 0 {
				n := q.items[0]
				q.items = q.items[1:]
				q.mu.Unlock()
				return n, nil
			}
			q.mu.Unlock()
			return Notification{}, ErrTransportClosed
		}
	}
}

// listen registers a notification hook and returns the function that removes it.
func (c *jsonrpcCarrier) listen(fn func(Notification)) func() {
	c.mu.Lock()
	c.nextHook++
	id := c.nextHook
	c.listeners[id] = fn
	c.mu.Unlock()
	return func() {
		c.mu.Lock()
		delete(c.listeners, id)
		c.mu.Unlock()
	}
}

func (c *jsonrpcCarrier) call(ctx context.Context, method string, params any, _ any) (json.RawMessage, error) {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil, ErrClosed
	}
	c.nextID++
	id := c.nextID
	reply := make(chan *rpcResponse, 1)
	c.pending[id] = reply
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.pending, id)
		c.mu.Unlock()
	}()

	if err := c.write(rpcRequest{JSONRPC: "2.0", ID: id, Method: method, Params: params}); err != nil {
		return nil, err
	}

	select {
	case response := <-reply:
		if response.Error != nil {
			return nil, &RPCError{Code: response.Error.Code, Message: response.Error.Message, Data: response.Error.Data}
		}
		return response.Result, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-c.readDone:
		return nil, c.transportError()
	}
}

func (c *jsonrpcCarrier) write(message any) error {
	payload, err := json.Marshal(message)
	if err != nil {
		return err
	}
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	if c.stdin == nil {
		return ErrTransportClosed
	}
	if _, err := c.stdin.Write(append(payload, '\n')); err != nil {
		return fmt.Errorf("%w: %v", ErrTransportClosed, err)
	}
	return nil
}

func (c *jsonrpcCarrier) readLoop() {
	defer close(c.readDone)
	for {
		line, err := c.stdout.ReadBytes('\n')
		if len(line) > 0 {
			c.dispatch(line)
		}
		if err != nil {
			return
		}
	}
}

func (c *jsonrpcCarrier) dispatch(line []byte) {
	trimmed := strings.TrimSpace(string(line))
	if trimmed == "" {
		return
	}
	var message rpcResponse
	if err := json.Unmarshal([]byte(trimmed), &message); err != nil {
		// Not JSON at all: a runtime writing progress to stdout rather than
		// stderr. Keep it for the diagnostics instead of failing the session on
		// it — but do not try to interpret it.
		c.mu.Lock()
		c.stderr = append(c.stderr, trimmed)
		c.mu.Unlock()
		return
	}

	if message.ID != nil && message.Method == "" {
		c.mu.Lock()
		reply, ok := c.pending[*message.ID]
		c.mu.Unlock()
		if ok {
			reply <- &message
		}
		return
	}
	if message.Method == "" {
		return
	}

	notification := Notification{Method: message.Method, Params: message.Params}
	var envelope struct {
		SessionID string `json:"sessionId"`
	}
	if len(message.Params) > 0 {
		_ = json.Unmarshal(message.Params, &envelope)
	}
	notification.SessionID = envelope.SessionID

	c.mu.Lock()
	hooks := make([]func(Notification), 0, len(c.listeners))
	for _, fn := range c.listeners {
		hooks = append(hooks, fn)
	}
	c.mu.Unlock()
	for _, fn := range hooks {
		fn(notification)
	}
}

func (c *jsonrpcCarrier) readStderr(r io.Reader) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 1<<20)
	for scanner.Scan() {
		line := scanner.Text()
		c.mu.Lock()
		// Bounded: a runtime that logs forever must not become a memory leak in
		// the program embedding it. The last hundred lines are what a failure
		// report needs.
		c.stderr = append(c.stderr, line)
		if len(c.stderr) > 100 {
			c.stderr = c.stderr[len(c.stderr)-100:]
		}
		c.mu.Unlock()
		if c.cfg.Stderr != nil {
			c.cfg.Stderr([]byte(line + "\n"))
		}
	}
}

func (c *jsonrpcCarrier) diagnostics() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return strings.Join(c.stderr, "\n")
}

func (c *jsonrpcCarrier) transportError() error {
	if diag := c.diagnostics(); diag != "" {
		return fmt.Errorf("%w\n%s", ErrTransportClosed, diag)
	}
	return ErrTransportClosed
}

func (c *jsonrpcCarrier) Close() error {
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		return nil
	}
	c.closed = true
	c.mu.Unlock()

	if c.stdin != nil {
		c.stdin.Close()
	}
	if c.cmd == nil || c.cmd.Process == nil {
		return nil
	}
	// Closing stdin is how a well-behaved runtime is asked to stop. Give it a
	// moment before insisting: killing a harness mid-write leaves a session log
	// truncated, and the log is the only record of what happened.
	done := make(chan error, 1)
	go func() { done <- c.cmd.Wait() }()
	select {
	case err := <-done:
		if err != nil && !errors.As(err, new(*exec.ExitError)) {
			return err
		}
		return nil
	case <-time.After(2 * time.Second):
		c.cmd.Process.Kill()
		<-done
		return nil
	}
}

// isInboxReceipt reports whether the notification is the durable receipt for a
// prompt: the session's inbox recording that this exact message was queued.
func isInboxReceipt(n Notification, sessionID, messageID string) bool {
	if n.Method != methodSessionEvent || n.SessionID != sessionID {
		return false
	}
	var payload struct {
		Event struct {
			Type string `json:"type"`
			Data struct {
				Inserted []struct {
					ID string `json:"id"`
				} `json:"inserted"`
			} `json:"data"`
		} `json:"event"`
	}
	if err := n.Decode(&payload); err != nil || payload.Event.Type != EventInboxSpliced {
		return false
	}
	for _, message := range payload.Event.Data.Inserted {
		if message.ID == messageID {
			return true
		}
	}
	return false
}

// isIdle reports the whole-agent idle that closes an interval.
func isIdle(n Notification, sessionID string) bool {
	if n.Method != methodSessionStatus || n.SessionID != sessionID {
		return false
	}
	var payload struct {
		Status string `json:"status"`
	}
	if err := n.Decode(&payload); err != nil {
		return false
	}
	return payload.Status == "idle"
}
