package runtime

// The Go half of the plugin bridge.
//
// Everything a Go plugin does to its cordis context crosses here: a path is
// named, arguments are encoded, and the answer comes back. Two rules make the
// whole thing work, and both are about which goroutine is running.
//
// A JavaScript world runs on one goroutine. So a plugin's Apply, and every Go
// callback JavaScript invokes, run on goroutines of THEIR OWN, and reach the
// world only by posting to it. That is why a Go plugin may block — on a
// database, on a network call, on another bridge call — without stopping the
// agent, its timers, or the requests in flight.
//
// The exception is a synchronous callback, which runs on the world's own
// goroutine because cordis needs its answer immediately (a tool's render, a
// guard's verdict). It must not block, and it must not call back across the
// bridge; doing so would wait for a goroutine it is currently occupying.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"

	"github.com/robomotionio/goant"
)

// bridgeModule is the specifier the generated plugin modules import.
const bridgeModule = "go:__bridge"

// jsFunc is a Go function encoded for JavaScript. The JS half revives it into a
// real function, which is how a Go closure becomes a tool's execute, an event
// listener, or a service's method.
type jsFunc struct {
	ID   int64 `json:"$fn"`
	Sync bool  `json:"$sync,omitempty"`
}

// jsThenable is a Go function encoded as the VALUE of a promise-shaped
// property. See Context.Promise.
type jsThenable struct {
	ID int64 `json:"$promise"`
}

// jsUndefined is JavaScript's undefined, encoded. See Undefined, which is the
// only thing that makes one.
type jsUndefined struct {
	Undefined bool `json:"$undefined"`
}

// jsRef names a JavaScript value the bridge is holding. It is how a live object
// — a service, a context, a session — is passed back to the world it lives in
// rather than copied out of it.
type jsRef struct {
	Ref int64 `json:"$ref"`
}

// Handler is a Go function JavaScript can call. Arguments arrive as JSON, one
// per parameter; a returned value is encoded back, and may itself contain
// functions made with Context.Func.
type Handler func(args []json.RawMessage) (any, error)

type hostCallback struct {
	fn    Handler
	sync  bool
	owner int64 // the context handle whose disposal frees it
}

type settled struct {
	ok      bool
	payload json.RawMessage
}

type bridge struct {
	rt      *goant.Runtime
	plugins map[string]*Plugin

	// base ends when the harness does, and every Go tool call derives from it.
	base context.Context

	mu        sync.Mutex
	closed    bool
	next      int64
	callbacks map[int64]*hostCallback
	waiters   map[int64]chan settled
	disposers map[int64][]func()

	done chan struct{}
}

var errBridgeClosed = errors.New("deepseek: the harness is shutting down")

// callContext is the context a Go tool call runs under.
func (b *bridge) callContext() context.Context {
	if b.base == nil {
		return context.Background()
	}
	return b.base
}

func newBridge(rt *goant.Runtime, plugins []Plugin) *bridge {
	b := &bridge{
		rt:        rt,
		plugins:   map[string]*Plugin{},
		callbacks: map[int64]*hostCallback{},
		waiters:   map[int64]chan settled{},
		disposers: map[int64][]func(){},
		done:      make(chan struct{}),
	}
	for i := range plugins {
		b.plugins[plugins[i].ID] = &plugins[i]
	}
	return b
}

func (b *bridge) id() int64 {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.next++
	return b.next
}

// close wakes everything waiting on an answer that is no longer coming.
func (b *bridge) close() {
	b.mu.Lock()
	if b.closed {
		b.mu.Unlock()
		return
	}
	b.closed = true
	owners := make([]int64, 0, len(b.disposers))
	for owner := range b.disposers {
		owners = append(owners, owner)
	}
	b.mu.Unlock()
	// A backstop for the components the tree did not get to unmount — a close
	// that timed out, a world that failed mid-teardown. dispose forgets what it
	// ran, so a component taken down properly is not taken down twice.
	for _, owner := range owners {
		b.dispose(owner)
	}
	close(b.done)
}

// install binds the entry points JavaScript calls.
func (b *bridge) install() error {
	set := func(name string, fn any) error {
		if err := b.rt.Set(name, fn); err != nil {
			return fmt.Errorf("deepseek: bridge %s: %w", name, err)
		}
		return nil
	}

	// A plugin mounting. Apply runs on its own goroutine so that it may block;
	// the promise returned here is what the loader waits on, so a plugin that
	// fails to start fails the composition rather than half-mounting.
	if err := set("__dshGoApply", func(id string, handle float64, config string) (goant.Value, error) {
		plugin, ok := b.plugins[id]
		if !ok {
			return goant.Value{}, fmt.Errorf("deepseek: no Go plugin %q", id)
		}
		promise, resolve, reject := b.rt.NewPromise()
		pc := &Context{
			Object: &Object{bridge: b, ref: int64(handle)},
			Plugin: id,
			Config: json.RawMessage(config),
		}
		go func() {
			if err := b.runApply(plugin, pc); err != nil {
				_ = reject(err)
				return
			}
			_ = resolve(nil)
		}()
		return promise, nil
	}); err != nil {
		return err
	}

	// A plugin unloading. Its Go inverses run in reverse, which is the order
	// cordis uses for the ones it tracked itself.
	if err := set("__dshGoDispose", func(id string, handle float64) (goant.Value, error) {
		promise, resolve, _ := b.rt.NewPromise()
		go func() {
			b.dispose(int64(handle))
			_ = resolve(nil)
		}()
		return promise, nil
	}); err != nil {
		return err
	}

	if err := set("__dshGoInvoke", func(id float64, args string) (goant.Value, error) {
		callback := b.callback(int64(id))
		if callback == nil {
			return goant.Value{}, fmt.Errorf("deepseek: callback %d is gone", int64(id))
		}
		promise, resolve, reject := b.rt.NewPromise()
		go func() {
			out, err := invoke(callback.fn, args)
			if err != nil {
				_ = reject(err)
				return
			}
			_ = resolve(out)
		}()
		return promise, nil
	}); err != nil {
		return err
	}

	if err := set("__dshGoInvokeSync", func(id float64, args string) (string, error) {
		callback := b.callback(int64(id))
		if callback == nil {
			return "", fmt.Errorf("deepseek: callback %d is gone", int64(id))
		}
		return invoke(callback.fn, args)
	}); err != nil {
		return err
	}

	return set("__dshGoSettle", func(token float64, ok bool, payload string) {
		b.mu.Lock()
		waiter := b.waiters[int64(token)]
		delete(b.waiters, int64(token))
		b.mu.Unlock()
		if waiter != nil {
			waiter <- settled{ok: ok, payload: json.RawMessage(payload)}
		}
	})
}

// invoke runs one host callback and encodes what it produced.
func invoke(fn Handler, argsJSON string) (out string, err error) {
	defer func() {
		if r := recover(); r != nil {
			// A panic in a plugin is the host program's bug. The call fails and
			// the harness carries on; taking the process down would be a worse
			// answer to a worse-behaved plugin.
			err = fmt.Errorf("go plugin panicked: %v", r)
		}
	}()
	var args []json.RawMessage
	if argsJSON != "" {
		if err := json.Unmarshal([]byte(argsJSON), &args); err != nil {
			return "", fmt.Errorf("deepseek: bridge arguments: %w", err)
		}
	}
	value, err := fn(args)
	if err != nil {
		return "", err
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return "", fmt.Errorf("deepseek: bridge result: %w", err)
	}
	return string(encoded), nil
}

func (b *bridge) callback(id int64) *hostCallback {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.callbacks[id]
}

// register keeps a Go function reachable from JavaScript for as long as the
// context that created it is loaded.
func (b *bridge) registerThenable(owner int64, fn Handler) jsThenable {
	return jsThenable{ID: b.register(owner, fn, false).ID}
}

func (b *bridge) register(owner int64, fn Handler, sync bool) jsFunc {
	id := b.id()
	b.mu.Lock()
	b.callbacks[id] = &hostCallback{fn: fn, sync: sync, owner: owner}
	b.mu.Unlock()
	return jsFunc{ID: id, Sync: sync}
}

func (b *bridge) onDispose(owner int64, fn func()) {
	b.mu.Lock()
	b.disposers[owner] = append(b.disposers[owner], fn)
	b.mu.Unlock()
}

// dispose runs a context's Go inverses and forgets what it owned.
func (b *bridge) dispose(owner int64) {
	b.mu.Lock()
	disposers := b.disposers[owner]
	delete(b.disposers, owner)
	for id, callback := range b.callbacks {
		if callback.owner == owner {
			delete(b.callbacks, id)
		}
	}
	b.mu.Unlock()
	for i := len(disposers) - 1; i >= 0; i-- {
		func() {
			defer func() { _ = recover() }()
			disposers[i]()
		}()
	}
}

// perform is the one road from Go into the JavaScript world.
//
// It posts the operation to the goroutine that owns the world and waits for the
// answer, which arrives through __dshGoSettle. Calling it from that goroutine
// would wait forever, which is why Apply and asynchronous callbacks are given
// goroutines of their own.
func (b *bridge) perform(kind string, handle int64, path string, args []any) (json.RawMessage, error) {
	if args == nil {
		args = []any{}
	}
	payload, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("deepseek: %s %s: %w", kind, path, err)
	}
	token := b.id()
	answer := make(chan settled, 1)

	b.mu.Lock()
	if b.closed {
		b.mu.Unlock()
		return nil, errBridgeClosed
	}
	b.waiters[token] = answer
	b.mu.Unlock()

	post := b.rt.Post(func() {
		perform, err := b.performFn()
		if err != nil {
			b.fail(token, err)
			return
		}
		if _, err := perform.Function().Call(kind, float64(handle), path, string(payload), float64(token)); err != nil {
			b.fail(token, err)
		}
	})
	if post != nil {
		b.mu.Lock()
		delete(b.waiters, token)
		b.mu.Unlock()
		return nil, errBridgeClosed
	}

	select {
	case result := <-answer:
		if !result.ok {
			return nil, bridgeError(kind, path, result.payload)
		}
		return result.payload, nil
	case <-b.done:
		return nil, errBridgeClosed
	}
}

// performFn fetches __dshBridge.perform. Called on the world's own goroutine.
func (b *bridge) performFn() (goant.Value, error) {
	object, err := b.rt.Get("__dshBridge")
	if err != nil {
		return goant.Value{}, err
	}
	return object.Object().Get("perform")
}

func (b *bridge) fail(token int64, err error) {
	b.mu.Lock()
	waiter := b.waiters[token]
	delete(b.waiters, token)
	b.mu.Unlock()
	if waiter == nil {
		return
	}
	payload, _ := json.Marshal(map[string]string{"message": err.Error()})
	waiter <- settled{ok: false, payload: payload}
}

// bridgeError turns the JavaScript side's description back into a Go error,
// keeping the stack, which is the only part that says where it happened.
func bridgeError(kind, path string, payload json.RawMessage) error {
	var described struct {
		Message string `json:"message"`
		Stack   string `json:"stack"`
	}
	_ = json.Unmarshal(payload, &described)
	if described.Message == "" {
		described.Message = string(payload)
	}
	where := path
	if where == "" {
		where = "<context>"
	}
	if described.Stack != "" {
		return fmt.Errorf("deepseek: %s %s: %s\n%s", kind, where, described.Message, described.Stack)
	}
	return fmt.Errorf("deepseek: %s %s: %s", kind, where, described.Message)
}
