// Command chat is a conversation: a stdin REPL on one session, streamed, whose
// transcript is then read back off disk by this program.
//
// What it proves: the SESSION LOG is the source of truth. The harness does not
// keep the conversation in a variable it hands you — it appends every turn to a
// durable, ordered log, and everything above (the model's history, a resume, an
// audit) is derived from that log. This program never held the transcript, and
// prints it anyway, by parsing the file the harness wrote.
//
// That is what makes ctx.sessionPersistence a capability SEAM rather than a
// feature: the default composition binds @deepseek-ai/dsh-session-persistence-jsonl
// to it, this example reconfigures that binding, and a deployment wanting
// sessions in Postgres writes a different provider without anything above it
// changing.
//
// Seam: session/event (streamed live through sdk.OnEvent) and
// ctx.sessionPersistence (the durable copy, read here as a file).
//
// Upstream: docs/capability-seams.md, docs/subsystems/persistence.md.
//
// WHAT A RUN IS, because the natural reading is wrong. A run owns the interval
// from the prompt being durably received to the next whole-agent idle — NOT
// "the answer to my question". Steering, injected context and a subagent
// finishing all land in the same interval and contribute to the same RunResult.
// See docs/defensive-patterns.md and sdk/doc.go.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/02-chat
//	# or non-interactively:
//	printf 'Name a fruit.\nAnd its colour?\n' | go run ./examples/02-chat
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

const sessionID = "chat"

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-chat-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	cfg := sdk.Config{
		Model: model(),
		CWD:   workdir,

		// Set explicitly because the composition below is built from this
		// Config, and Compose reads the fields AS THEY ARE. Open fills BaseURL
		// from DEEPSEEK_BASE_URL for you — but only after a hand-built
		// composition has already frozen the adapter's endpoint. A composition
		// assembled before that produces an adapter pointing at the default
		// endpoint, and the symptom is a 401 that looks like a bad key.
		BaseURL: os.Getenv("DEEPSEEK_BASE_URL"),
	}

	// Reconfigure the persistence provider to write plain JSONL rather than the
	// default zstd — so the log this program reads back at the end is legible
	// without a decompressor. Note that the config REPLACES the plugin's
	// defaults rather than merging into them, so `root` has to be restated even
	// though only `compression` is changing.
	sessionRoot := filepath.Join(workdir, ".sessions")
	cfg.Composition = sdk.With(sdk.Compose(cfg), "persistence", map[string]any{
		"root":        sessionRoot,
		"compression": "none",
	})

	h, err := sdk.Open(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}

	session := h.Session(sessionID)
	fmt.Printf("session %q — turns share history and run one at a time. Ctrl-D to finish.\n\n",
		session.ID())

	in := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("you> ")
		if !in.Scan() {
			break
		}
		line := strings.TrimSpace(in.Text())
		if line == "" {
			continue
		}

		fmt.Print("dsh> ")
		result, err := session.Run(ctx, sdk.Text(line), sdk.OnEvent(stream))
		if err != nil {
			h.Close()
			log.Fatal(err)
		}
		// FinishReason is how a caller tells a completed turn from a truncated
		// or a failed one; the text alone cannot say.
		fmt.Printf("\n     [%s, %d tool calls, %v]\n\n",
			result.FinishReason, result.ToolCalls(),
			result.Duration.Round(time.Millisecond))
	}

	// Close first, so that nothing below can be explained by the harness still
	// being alive and helpful.
	if err := h.Close(); err != nil {
		log.Fatal(err)
	}

	logPath := findLog(sessionRoot)
	if logPath == "" {
		fmt.Println("\n(nothing was said, so nothing was written)")
		return
	}
	info, err := os.Stat(logPath)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("\n--- the log: %s (%d bytes) ---\n", logPath, info.Size())

	// The conversation, reconstructed from the file by a program that never had
	// it in memory. One JSON object per line: a header, then every event in seq
	// order — which is also why a session can be replayed, audited or forked.
	replay(logPath)
}

// stream renders the reply as it arrives. Event payloads stay as raw JSON
// upstream-side — dozens of event types whose shapes move with the harness — so
// decoding the two fields actually read beats a generated struct per type.
func stream(e sdk.Event) {
	switch e.Type {
	case "assistant/chunk":
		var chunk struct {
			Chunk struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"chunk"`
		}
		if e.Decode(&chunk) == nil && chunk.Chunk.Type == "text-delta" {
			fmt.Print(chunk.Chunk.Text)
		}
	case "tool/call":
		var call struct {
			Name string `json:"name"`
		}
		if e.Decode(&call) == nil {
			fmt.Printf("\n     · %s\n     ", call.Name)
		}
	}
}

// findLog locates the session log. The provider lays them out as
// <root>/<encoded cwd>/<session id>/session.jsonl, so the layout is walked
// rather than assumed.
func findLog(root string) string {
	found := ""
	_ = filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return nil
		}
		if strings.HasPrefix(d.Name(), "session.jsonl") {
			found = path
			return fs.SkipAll
		}
		return nil
	})
	return found
}

// replay reads the durable log and prints the conversation it holds, plus a
// census of everything else in it.
func replay(path string) {
	file, err := os.Open(path)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	census := map[string]int{}
	var order []string
	lines := bufio.NewScanner(file)
	lines.Buffer(make([]byte, 0, 1<<20), 1<<24)

	for lines.Scan() {
		var envelope struct {
			Type string          `json:"type"`
			Seq  int64           `json:"seq"`
			Data json.RawMessage `json:"data"`
			// The header line, which has no seq.
			ID        string `json:"id"`
			CreatedAt int64  `json:"createdAt"`
			CWD       string `json:"cwd"`
		}
		if json.Unmarshal(lines.Bytes(), &envelope) != nil {
			continue
		}
		if _, seen := census[envelope.Type]; !seen {
			order = append(order, envelope.Type)
		}
		census[envelope.Type]++

		switch envelope.Type {
		case "session":
			fmt.Printf("header · id %q, cwd %s, started %s\n\n",
				envelope.ID, envelope.CWD,
				time.UnixMilli(envelope.CreatedAt).Format(time.RFC3339))
		case "user/message", "assistant/message":
			who := "you"
			if envelope.Type == "assistant/message" {
				who = "dsh"
			}
			fmt.Printf("%s> %s\n", who, oneLine(messageText(envelope.Data)))
		}
	}
	if err := lines.Err(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("\n--- everything else the log holds ---")
	for _, kind := range order {
		fmt.Printf("  %-24s %d\n", kind, census[kind])
	}

	// Worth being exact about, because the obvious next question has an
	// unsatisfying answer today: the log is complete enough to resume from, and
	// upstream's agent loop has the API for it (agentLoop.resume), but this
	// SDK's boot script only ever calls agentLoop.create. So a second process
	// cannot pick this conversation back up yet — it would collide with the
	// stored log rather than continue it.
	fmt.Println("\nThe log is the durable copy: ordered, self-describing, and readable")
	fmt.Println("by anything. Resuming a stored session from a new process is not")
	fmt.Println("wired up in this SDK yet — see the note in this file.")
}

// messageText pulls the text blocks out of a user/ or assistant/message.
func messageText(data json.RawMessage) string {
	// user/message carries the message inline; assistant/message wraps it.
	var payload struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
		Message struct {
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
		} `json:"message"`
	}
	if json.Unmarshal(data, &payload) != nil {
		return ""
	}
	blocks := payload.Content
	if len(blocks) == 0 {
		blocks = payload.Message.Content
	}
	var out strings.Builder
	for _, block := range blocks {
		if block.Type == "text" {
			out.WriteString(block.Text)
		}
	}
	return out.String()
}

func oneLine(s string) string {
	s = strings.Join(strings.Fields(s), " ")
	if len(s) > 96 {
		return s[:95] + "…"
	}
	return s
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
