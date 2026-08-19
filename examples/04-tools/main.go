// Command tools gives the agent two functions written in Go.
//
// What it proves: the tools an agent calls come from plugins, and a plugin can
// be Go. `order_status` and `refund_window` are ordinary Go functions over an
// ordinary Go map. They are mounted by the same cordis loader as `read` and
// `edit`, land in the same registry, and are shown to the model the same way —
// which the program checks by printing h.Tools(ctx) BEFORE the turn, so the two
// families are visibly sitting in one list.
//
// This is the answer to "how does the agent query our database, call our
// internal API, talk to the device on the bench": not by being handed a shell
// and a hope, but by being given a named function with a schema that runs in
// this process under this program's control.
//
// Seam: ctx.tools.register() — reached through Plugin.Tools, which is the short
// form of Context.RegisterTool.
//
// Upstream: docs/cookbook/adding-a-tool.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...
//	go run ./examples/04-tools
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// The "database". In-memory and deterministic on purpose: an example that
// depends on a service is an example that fails for a reason unrelated to what
// it teaches. Replace this map with your own process's real reach.
type order struct {
	status    string
	carrier   string
	tracking  string
	delivered string // ISO date, empty when not delivered
	category  string
}

var orders = map[string]order{
	"A-4471": {status: "delivered", carrier: "Ryder", tracking: "RY82255193",
		delivered: "2026-08-02", category: "headphones"},
	"A-4472": {status: "in transit", carrier: "Ryder", tracking: "RY82255207",
		category: "kettle"},
	"A-4108": {status: "delivered", carrier: "Pelican", tracking: "PL55510042",
		delivered: "2026-05-19", category: "mattress"},
}

// Refund policy by category, in days from delivery. The model cannot guess
// these, which is the point: a pass cannot be the model being agreeable.
var refundDays = map[string]int{"headphones": 14, "kettle": 30, "mattress": 100}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	workdir, err := os.MkdirTemp("", "dsh-tools-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	var mu sync.Mutex
	var called []string
	record := func(name string) { mu.Lock(); called = append(called, name); mu.Unlock() }

	h, err := sdk.Open(ctx, sdk.Config{
		Model: model(),
		CWD:   workdir,
		Env:   map[string]string{"HOME": workdir},
		Plugins: []sdk.Plugin{{
			ID: "fulfilment",
			Tools: []sdk.Tool{
				{
					Name: "order_status",
					// The description IS the interface. It is the whole of what
					// the model knows beyond the parameters, so an empty one is
					// refused rather than mounted.
					Description: "Where an order is right now: its state, carrier and tracking " +
						"number. The only source of order state — never guess it.",
					Parameters: map[string]any{
						"order_id": map[string]any{
							"type":        "string",
							"required":    true,
							"description": `The order number, e.g. "A-4471".`,
						},
					},
					Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
						record("order_status")
						return orderStatus(ctx, args)
					},
				},
				{
					Name: "refund_window",
					Description: "How many days remain to return a delivered order, " +
						"from the per-category refund policy. The only source of refund policy.",
					Parameters: map[string]any{
						"order_id": map[string]any{
							"type":        "string",
							"required":    true,
							"description": `The order number, e.g. "A-4471".`,
						},
						"today": map[string]any{
							"type":        "string",
							"description": `Optional ISO date to evaluate against; defaults to today.`,
						},
					},
					Execute: func(ctx context.Context, args json.RawMessage) (string, error) {
						record("refund_window")
						return refundWindow(ctx, args)
					},
				},
			},
		}},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	// One registry. The Go tools are in it beside the harness's own, which is
	// how you confirm a plugin registered what it meant to — otherwise a
	// question only the model gets an answer to.
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
	for _, want := range []string{"order_status", "refund_window", "read"} {
		if !has(names, want) {
			log.Fatalf("FAIL: %q is missing from the registry", want)
		}
	}
	fmt.Println("(ours and the harness's own, in one list)")

	fmt.Println("\n--- the turn ---")
	result, err := h.Run(ctx, sdk.Text(
		"Order A-4471: where is it, and do I still have time to return it? "+
			"Today is 2026-08-19. Then check A-4472 as well."))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.FinalResponse)

	mu.Lock()
	defer mu.Unlock()
	fmt.Printf("\n[%s, Go tools called: %s]\n",
		result.FinishReason, strings.Join(called, ", "))
	if len(called) == 0 {
		log.Fatal("FAIL: the model never called a Go function")
	}
}

// orderStatus runs on its own goroutine — not the one that owns the JavaScript
// world — so a slow lookup costs the agent a wait rather than stopping
// everything else the harness is doing. Its context is cancelled when the
// harness closes and when the harness abandons the call (a cancelled turn, a
// tool-call timeout), so honouring it is what stops work nobody awaits.
func orderStatus(ctx context.Context, args json.RawMessage) (string, error) {
	var in struct {
		OrderID string `json:"order_id"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}

	o, ok := orders[strings.ToUpper(strings.TrimSpace(in.OrderID))]
	if !ok {
		// The error text is shown to the model, so it is part of the interface:
		// this one earns a corrected retry where "not found" earns a shrug.
		return "", fmt.Errorf("no order %q; known orders: %s",
			in.OrderID, strings.Join(knownOrders(), ", "))
	}
	if o.delivered != "" {
		return fmt.Sprintf("%s — delivered %s by %s, tracking %s",
			o.status, o.delivered, o.carrier, o.tracking), nil
	}
	return fmt.Sprintf("%s with %s, tracking %s", o.status, o.carrier, o.tracking), nil
}

func refundWindow(ctx context.Context, args json.RawMessage) (string, error) {
	var in struct {
		OrderID string `json:"order_id"`
		Today   string `json:"today"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}

	o, ok := orders[strings.ToUpper(strings.TrimSpace(in.OrderID))]
	if !ok {
		return "", fmt.Errorf("no order %q; known orders: %s",
			in.OrderID, strings.Join(knownOrders(), ", "))
	}
	if o.delivered == "" {
		return "not delivered yet, so the refund window has not started", nil
	}

	delivered, err := time.Parse("2006-01-02", o.delivered)
	if err != nil {
		return "", err
	}
	today := time.Now().UTC()
	if in.Today != "" {
		if today, err = time.Parse("2006-01-02", in.Today); err != nil {
			return "", fmt.Errorf("today must be an ISO date like 2026-08-19, got %q", in.Today)
		}
	}

	allowed := refundDays[o.category]
	left := allowed - int(today.Sub(delivered).Hours()/24)
	if left <= 0 {
		return fmt.Sprintf("closed — %s have a %d-day window and it ended %d days ago",
			o.category, allowed, -left), nil
	}
	return fmt.Sprintf("open — %s have a %d-day window; %d days left",
		o.category, allowed, left), nil
}

func knownOrders() []string {
	ids := make([]string, 0, len(orders))
	for id := range orders {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
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
