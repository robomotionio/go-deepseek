package sdk

import (
	"context"
	"encoding/json"
	"sync"

	runtime "github.com/robomotionio/go-deepseek/internal/runtime"
)

// The in-process carrier: the harness runs inside this program, on the embedded
// JavaScript engine, with no subprocess and nothing installed.
//
// The run interval is simpler here than over the wire. There, a prompt returns a
// message id and the interval runs from that message's durable receipt to the
// next idle, because the transport is asynchronous and other work shares it. In
// process the call itself is the interval: Prompt returns when the agent is
// idle, and the events it collected are the ones the harness recorded while it
// was inside.

type inProcess struct {
	cfg *Config

	harness runtime.Harness

	mu   sync.Mutex
	sink func(Notification)

	// fanning records that the reader goroutine below was actually started, so
	// that Close waits for it only when there is something to wait for. Without
	// the flag, a harness that failed to START left Close blocked forever on a
	// goroutine that never ran — a hang on the error path, which is the worst
	// place to have one.
	fanning bool
	done    chan struct{}
}

func newInProcess(cfg *Config) Carrier {
	return &inProcess{cfg: cfg, done: make(chan struct{})}
}

func (p *inProcess) Start(ctx context.Context) error {
	env := map[string]string{}
	for k, v := range p.cfg.Env {
		env[k] = v
	}
	if p.cfg.APIKey != "" {
		env["DEEPSEEK_API_KEY"] = p.cfg.APIKey
	}
	if _, ok := env["HOME"]; !ok {
		env["HOME"] = p.cfg.CWD
	}

	h, err := runtime.New(runtime.Config{
		Provider:    p.cfg.Provider,
		Model:       p.cfg.Model,
		BaseURL:     p.cfg.BaseURL,
		APIKey:      p.cfg.APIKey,
		MaxTokens:   p.cfg.MaxTokens,
		CWD:         p.cfg.CWD,
		Roots:       p.cfg.Roots,
		SessionRoot: p.cfg.SessionRoot,
		Composition: p.cfg.Composition,
		MemoryLimit: p.cfg.MemoryLimit,
		Env:         env,
		Stdout:      p.cfg.Stdout,
		Stderr:      p.cfg.Stderr,
		TraceTimers: p.cfg.TraceTimers,
		TraceHTTP:   p.cfg.TraceHTTP,
	})
	if err != nil {
		return err
	}
	if err := h.Start(ctx); err != nil {
		h.Close()
		return err
	}
	p.harness = h
	p.fanning = true
	// One reader owns the harness's event channel for the carrier's life and
	// hands each event to whichever run is in flight. The channel has a single
	// consumer by design — a second one would take events away from the first —
	// so the fan-out has to live somewhere, and this is the only place that
	// knows when a run starts and stops.
	go p.fanOut()
	return nil
}

func (p *inProcess) fanOut() {
	defer close(p.done)
	for event := range p.harness.Events() {
		p.mu.Lock()
		sink := p.sink
		p.mu.Unlock()
		if sink == nil {
			continue
		}
		params, err := json.Marshal(map[string]any{
			"sessionId": event.SessionID,
			"event":     json.RawMessage(event.Raw),
		})
		if err != nil {
			continue
		}
		sink(Notification{
			Method:    methodSessionEvent,
			SessionID: event.SessionID,
			Params:    params,
		})
	}
}

func (p *inProcess) Prompt(ctx context.Context, sessionID string, input Input, sink func(Notification)) error {
	p.mu.Lock()
	p.sink = sink
	p.mu.Unlock()
	defer func() {
		p.mu.Lock()
		p.sink = nil
		p.mu.Unlock()
	}()

	blocks := make([]runtime.Block, len(input))
	for i, b := range input {
		blocks[i] = runtime.Block{Type: b.Type, Text: b.Text}
	}
	_, err := p.harness.Run(ctx, sessionID, blocks)
	return err
}

func (p *inProcess) Close() error {
	if p.harness == nil {
		return nil
	}
	err := p.harness.Close()
	if p.fanning {
		// Closing the harness closes its event channel, which is what ends the
		// reader. Waiting for it means no notification arrives after Close
		// returns.
		<-p.done
	}
	return err
}
