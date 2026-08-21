// Command web is example 13 with a face: the same phone-banking demo — the
// same tree, the same three tools, the same learn-and-replay — served as a
// page you can watch. A telephone hangs on the left of it; the transcript of
// what the line says types out on the right. Press Start and the agent picks
// up the handset.
//
// Everything the page shows is the agent's own doing, live. The IVR emits an
// event for every key the agent presses and every prompt it plays, the server
// broadcasts them over Server-Sent Events, and the browser animates what it
// is told: the key lights and clicks (a real DTMF tone, synthesized in the
// browser), the pressed digits march across the display, the prompt types
// out. Nothing is scripted and no browser robot clicks anything — what you
// are watching is the tool-call stream of a real session, at the pace the
// model actually works.
//
//	run 1   explore   watch it ride wrong branches to the bottom and back
//	RESET             the balance changes; the page wipes clean
//	run 2   replay    one press, straight to the money
//
// When a run hears the balance, the page stamps the moment: the figure, the
// wall-clock time it took to find, the airtime it cost. The two stamps are
// the comparison the parent example prints as a table.
//
// Run it — an OPENROUTER_API_KEY alone is enough:
//
//	export OPENROUTER_API_KEY=...      # aims the demo at openrouter.ai and
//	go run ./examples/13-phone-banking/web   # picks that endpoint's model id
//	# then open http://127.0.0.1:8013
//
// or the explicit way every example documents, which always wins when set:
//
//	export DEEPSEEK_API_KEY=...
//	export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1   # or your gateway
//	export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731
//	go run ./examples/13-phone-banking/web
//
// One binary: the page is embedded, the phone system is a Go struct, and the
// only thing reached over the network is the model.
package main

import (
	"context"
	"embed"
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

//go:embed index.html
var pageFS embed.FS

// event is one thing the page is told. Kind decides which fields matter.
type event struct {
	Kind string `json:"kind"`

	Run      int    `json:"run,omitempty"`
	Number   string `json:"number,omitempty"`
	Key      string `json:"key,omitempty"`
	Node     string `json:"node,omitempty"`
	Text     string `json:"text,omitempty"`
	Secs     int    `json:"secs,omitempty"`
	Airtime  int    `json:"airtime,omitempty"`
	Explorer string `json:"explorer,omitempty"`
	Operator string `json:"operator,omitempty"`

	Balance   string `json:"balance,omitempty"`
	Available string `json:"available,omitempty"`
	ElapsedMS int64  `json:"elapsedMs,omitempty"`

	Stats  *runStats   `json:"stats,omitempty"`
	Lesson *lessonView `json:"lesson,omitempty"`
	Run1   *runStats   `json:"run1,omitempty"`
	Run2   *runStats   `json:"run2,omitempty"`
	Answer string      `json:"answer,omitempty"`

	// Replay marks an event resent from the demo's history to a page that
	// arrived late — the page renders it instantly, without sounds or pauses,
	// so a refresh mid-run catches up in a blink and then continues live.
	Replay bool `json:"replay,omitempty"`
}

type runStats struct {
	Prompts   int    `json:"prompts"`
	Keys      int    `json:"keys"`
	Wrong     int    `json:"wrong"`
	AirtimeS  int    `json:"airtimeS"`
	WallMS    int64  `json:"wallMs"`
	ToolCalls int    `json:"toolCalls"`
	Balance   string `json:"balance"`
	Reported  bool   `json:"reported"`
}

type lessonView struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Content     string `json:"content"`
}

// hub broadcasts events to every open browser tab, and keeps the current
// demo's history so a tab that arrives late is told the story so far. A slow
// tab drops live events rather than stalling the demo — the page is a
// window, not a recorder.
type hub struct {
	mu      sync.Mutex
	clients map[chan []byte]bool
	history []event
}

func newHub() *hub { return &hub{clients: map[chan []byte]bool{}} }

// subscribe registers a listener and returns the history it missed, already
// marked for instant replay.
func (h *hub) subscribe() (chan []byte, [][]byte) {
	ch := make(chan []byte, 256)
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[ch] = true
	replay := make([][]byte, 0, len(h.history))
	for _, e := range h.history {
		e.Replay = true
		if raw, err := json.Marshal(e); err == nil {
			replay = append(replay, raw)
		}
	}
	return ch, replay
}

func (h *hub) unsubscribe(ch chan []byte) {
	h.mu.Lock()
	delete(h.clients, ch)
	h.mu.Unlock()
}

func (h *hub) forget() {
	h.mu.Lock()
	h.history = nil
	h.mu.Unlock()
}

func (h *hub) broadcast(e event) {
	raw, err := json.Marshal(e)
	if err != nil {
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	h.history = append(h.history, e)
	for ch := range h.clients {
		select {
		case ch <- raw:
		default: // a tab that stopped reading loses events, not the demo
		}
	}
}

// creds is where the demo's model calls will be served from, worked out once
// at startup. The SDK itself reads only DEEPSEEK_API_KEY, so a machine that
// holds an OPENROUTER_API_KEY and nothing else fails with MISSING_CREDENTIAL
// — this resolver checks both. An explicit DEEPSEEK_API_KEY always wins;
// OPENROUTER_API_KEY alone aims the demo at OpenRouter and switches the
// default model to that endpoint's id, because the two endpoints do not
// even agree on what the model is called.
type creds struct {
	key    string
	base   string
	model  string // the default model id for this endpoint
	source string // which variable supplied the key; empty means neither did
}

func resolveCreds() creds {
	c := creds{
		key:    os.Getenv("DEEPSEEK_API_KEY"),
		base:   os.Getenv("DEEPSEEK_BASE_URL"),
		source: "DEEPSEEK_API_KEY",
	}
	if c.key == "" {
		if or := os.Getenv("OPENROUTER_API_KEY"); or != "" {
			c.key, c.source = or, "OPENROUTER_API_KEY"
			if c.base == "" {
				c.base = "https://openrouter.ai/api/v1"
			}
		}
	}
	if c.key == "" {
		c.source = ""
	}
	// The default model follows the endpoint: deepseek-v4-flash at DeepSeek,
	// deepseek/deepseek-v4-flash-0731 through OpenRouter. DEEPSEEK_MODEL and
	// the DSH_*_MODEL variables still override either.
	c.model = "deepseek-v4-flash"
	if strings.Contains(c.base, "openrouter") {
		c.model = "deepseek/deepseek-v4-flash-0731"
	}
	return c
}

const noKeyAdvice = "no API key found: export DEEPSEEK_API_KEY (any OpenAI-compatible gateway, " +
	"with DEEPSEEK_BASE_URL), or just OPENROUTER_API_KEY — the demo aims itself at " +
	"https://openrouter.ai/api/v1 and picks that endpoint's model id"

// server owns the one demo that may run at a time.
type server struct {
	hub      *hub
	creds    creds
	explorer string
	operator string

	mu          sync.Mutex
	running     bool
	runStarted  time.Time
	currentRun  int
	balanceSeen bool
}

// emit forwards an IVR event to the page — and watches for the moment the
// whole demo exists to show: the first time a run's credit-balance leaf is
// played, it stamps the elapsed wall clock beside the figure.
func (s *server) emit(e event) {
	s.hub.broadcast(e)
	if e.Kind != "prompt" || e.Node != "credit-balance" {
		return
	}
	s.mu.Lock()
	seen, run, started := s.balanceSeen, s.currentRun, s.runStarted
	s.balanceSeen = true
	s.mu.Unlock()
	if seen {
		return
	}
	f := books[0]
	if run == 2 {
		f = books[1]
	}
	s.hub.broadcast(event{
		Kind:      "balance-heard",
		Run:       run,
		Balance:   f.balance,
		Available: f.available,
		ElapsedMS: time.Since(started).Milliseconds(),
		Airtime:   e.Airtime,
	})
}

func (s *server) note(text string) { s.hub.broadcast(event{Kind: "note", Text: text}) }

// demo is the whole parent example, narrated: run 1 with the learn half of
// the job, the reset, run 2 with the lesson replayed, and the comparison.
func (s *server) demo(ctx context.Context) {
	defer func() {
		s.mu.Lock()
		s.running = false
		s.mu.Unlock()
	}()

	s.hub.forget() // this demo's story starts here; the page shows one at a time

	root, err := os.MkdirTemp("", "dsh-ivr-web-")
	if err != nil {
		s.hub.broadcast(event{Kind: "error", Text: err.Error()})
		return
	}
	defer os.RemoveAll(root)
	workspace := filepath.Join(root, "workspace")
	if err := os.MkdirAll(workspace, 0o755); err != nil {
		s.hub.broadcast(event{Kind: "error", Text: err.Error()})
		return
	}
	remembered := filepath.Join(root, "learned.jsonl")

	line := newIVR(s.emit)

	// ---- run 1 ----
	stats1, ok := s.run(ctx, 1, s.explorer, workspace, line, remembered, true)
	if !ok {
		return
	}

	learned, _ := load(remembered)
	var lesson *lessonView
	if len(learned) > 0 {
		lesson = &lessonView{Name: learned[0].Name, Description: learned[0].Description,
			Content: learned[0].Content}
	}
	s.hub.broadcast(event{Kind: "run-done", Run: 1, Stats: stats1, Lesson: lesson})

	// A beat for the viewer to read the lesson, then the reset.
	time.Sleep(6 * time.Second)
	line.reset()
	s.hub.broadcast(event{Kind: "reset", Balance: books[1].balance})
	time.Sleep(2 * time.Second)

	// ---- run 2 ----
	stats2, ok := s.run(ctx, 2, s.operator, workspace, line, remembered, false)
	if !ok {
		return
	}
	s.hub.broadcast(event{Kind: "run-done", Run: 2, Stats: stats2})
	s.hub.broadcast(event{Kind: "compare", Run1: stats1, Run2: stats2})
}

func (s *server) run(ctx context.Context, which int, model, workspace string, line *ivr,
	remembered string, canTeach bool) (*runStats, bool) {

	s.mu.Lock()
	s.currentRun, s.runStarted, s.balanceSeen = which, time.Now(), false
	s.mu.Unlock()
	s.hub.broadcast(event{Kind: "run-start", Run: which, Explorer: s.explorer, Operator: s.operator})

	prompt := job()
	session := "replay"
	if canTeach {
		prompt += alsoRecord
		session = "explore"
	}

	courier := newMemory(remembered)
	h, err := openHarness(ctx, s.creds, model, workspace, line, courier, canTeach)
	if err != nil {
		s.hub.broadcast(event{Kind: "error", Text: err.Error()})
		return nil, false
	}
	ans, err := ask(ctx, h.Session(session), prompt, s.note)
	h.Close()
	if err != nil {
		s.hub.broadcast(event{Kind: "error", Text: err.Error()})
		return nil, false
	}

	expect := books[0]
	if which == 2 {
		expect = books[1]
	}
	t := measure(line.legs())
	stats := &runStats{
		Prompts:   t.prompts,
		Keys:      t.keys,
		Wrong:     t.wrong,
		AirtimeS:  t.seconds,
		WallMS:    ans.took.Milliseconds(),
		ToolCalls: len(ans.calls),
		Balance:   expect.balance,
		Reported:  strings.Contains(norm(ans.text), norm(expect.balance)),
	}
	s.hub.broadcast(event{Kind: "answer", Run: which, Answer: oneLine(ans.text)})
	return stats, true
}

func main() {
	addr := flag.String("addr", "127.0.0.1:8013", "address to serve the demo on")
	flag.Parse()

	c := resolveCreds()
	s := &server{
		hub:      newHub(),
		creds:    c,
		explorer: pick("DSH_EXPLORER_MODEL", c.model),
		operator: pick("DSH_OPERATOR_MODEL", c.model),
	}

	page := template.Must(template.ParseFS(pageFS, "index.html"))

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_ = page.Execute(w, map[string]string{
			"Bank":     bankNumber,
			"Explorer": s.explorer,
			"Operator": s.operator,
		})
	})

	mux.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST only", http.StatusMethodNotAllowed)
			return
		}
		if s.creds.key == "" {
			// Answered on the page as well as here, because the person who
			// pressed Start is looking at the page.
			s.hub.broadcast(event{Kind: "error", Text: noKeyAdvice})
			http.Error(w, noKeyAdvice, http.StatusPreconditionFailed)
			return
		}
		s.mu.Lock()
		if s.running {
			s.mu.Unlock()
			http.Error(w, "a demo is already running", http.StatusConflict)
			return
		}
		s.running = true
		s.mu.Unlock()
		// The demo outlives the request on purpose; the page watches /events.
		go s.demo(context.Background())
		w.WriteHeader(http.StatusAccepted)
	})

	mux.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")

		ch, missed := s.hub.subscribe()
		defer s.hub.unsubscribe(ch)

		s.mu.Lock()
		hello := event{Kind: "hello", Explorer: s.explorer, Operator: s.operator}
		if s.running {
			hello.Run = s.currentRun
		}
		s.mu.Unlock()
		raw, _ := json.Marshal(hello)
		fmt.Fprintf(w, "data: %s\n\n", raw)
		// The story so far, so a page opened mid-run catches up instantly.
		for _, m := range missed {
			fmt.Fprintf(w, "data: %s\n\n", m)
		}
		flusher.Flush()

		keepalive := time.NewTicker(20 * time.Second)
		defer keepalive.Stop()
		for {
			select {
			case <-r.Context().Done():
				return
			case <-keepalive.C:
				fmt.Fprint(w, ": ping\n\n")
				flusher.Flush()
			case msg := <-ch:
				fmt.Fprintf(w, "data: %s\n\n", msg)
				flusher.Flush()
			}
		}
	})

	fmt.Printf("Meridian Trust Bank, on the wall: http://%s\n", *addr)
	if c.source == "" {
		fmt.Printf("credentials: NONE — %s\n", noKeyAdvice)
	} else {
		endpoint := c.base
		if endpoint == "" {
			endpoint = "DeepSeek official"
		}
		fmt.Printf("credentials: %s → %s\n", c.source, endpoint)
	}
	fmt.Printf("explorer: %s\noperator: %s\n", s.explorer, s.operator)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
