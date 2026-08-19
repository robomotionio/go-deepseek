// Command composition builds two different agents from one binary.
//
// What it proves: the plugin list IS the product. Everything in the harness is a
// plugin and a deployment is a list of them with their configuration — there is
// no second configuration surface. So "what is this agent?" is answered by
// reading the list, and changing what the agent is means changing the list.
//
// Nothing here calls a model. The whole example is inspection: what the bundle
// CAN mount (sdk.Plugins), what a config WOULD mount (sdk.Compose), and what two
// adjusted lists actually DID mount (h.Tools). An example whose claim is checked
// by looking rather than by asking is the right shape for this one.
//
// Seam: the composition itself — sdk.Compose / Add / With / Disable / Plugins.
//
// Upstream: docs/cordis-tutorial/06-composition-and-hmr.md, docs/config-catalog.md.
//
// Run it:
//
//	export DEEPSEEK_API_KEY=...   # only to mount the model adapter; nothing is called
//	go run ./examples/05-composition
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"github.com/robomotionio/go-deepseek/sdk"
)

func main() {
	ctx := context.Background()

	workdir, err := os.MkdirTemp("", "dsh-composition-")
	if err != nil {
		log.Fatal(err)
	}
	defer os.RemoveAll(workdir)

	base := sdk.Config{Model: model(), CWD: workdir, Env: map[string]string{"HOME": workdir}}

	// ---- what the bundle can mount ------------------------------------------

	// sdk.Plugins() answers with every specifier the bundle can serve, which is
	// more than the mountable plugins: the libraries they import are in there
	// too (zod, openai, yaml). The harness's own plugins are the @deepseek-ai/dsh-
	// subset, and a composition naming anything NOT on the full list fails when
	// the harness starts — demonstrated at the bottom.
	available := sdk.Plugins()
	sort.Strings(available)
	var mountable []string
	for _, specifier := range available {
		if strings.HasPrefix(specifier, "@deepseek-ai/dsh-") {
			mountable = append(mountable, specifier)
		}
	}
	fmt.Printf("--- the bundle serves %d modules; %d of them are dsh plugins ---\n",
		len(available), len(mountable))
	fmt.Println(wrap(mountable, 78))

	// ---- what this config would mount ---------------------------------------

	entries := sdk.Compose(base)
	fmt.Println("\n--- the default composition ---")
	for _, entry := range entries {
		fmt.Printf("  %-24s %s\n", entry.ID, entry.Name)
	}
	fmt.Println("(a model, a session that persists, a filesystem it can read and edit, a todo list)")

	// ---- agent one: the default ---------------------------------------------

	editor := base
	editorTools := open(ctx, editor)

	// ---- agent two: a smaller tool surface ----------------------------------

	// Disable marks an entry off without removing it, so its configuration stays
	// where a reader can see what it WOULD be. Both of these are honest little
	// removals; neither makes the agent read-only, and it is worth saying why:
	// dsh-tool-fs ships `read`, `write` and `edit` as ONE plugin, so "may look
	// but not touch" is not a line the composition can draw. That is a policy
	// question, and policy is example 06.
	lean := base
	lean.Composition = sdk.Disable(
		sdk.Disable(sdk.Compose(base), "tool-str-replace-editor", true),
		"tool-todo", true)

	// While we are here: ADD a plugin that is in the bundle but whose coeffect
	// nothing satisfies. tool-web injects `web`, and no bundled plugin provides
	// it. The harness does not fail — an unsatisfied component WAITS, and would
	// activate if a provider appeared. So `web_search` is simply absent below.
	// Example 10 is the other end of exactly this: a coeffect satisfied from Go,
	// and the tool that appears the moment it is.
	lean.Composition = sdk.Add(lean.Composition,
		sdk.Entry{ID: "tool-web", Name: "@deepseek-ai/dsh-tool-web"})

	leanTools := open(ctx, lean)

	// ---- the difference, visible rather than asserted -----------------------

	fmt.Println("\n--- two agents, one binary ---")
	fmt.Printf("  default : %s\n", strings.Join(editorTools, " "))
	fmt.Printf("  lean    : %s\n", strings.Join(leanTools, " "))
	fmt.Printf("  removed : %s\n", strings.Join(missing(editorTools, leanTools), " "))
	fmt.Printf("  added   : %s\n", orNone(missing(leanTools, editorTools)))
	fmt.Println("  (tool-web mounted nothing: it injects `web`, which this bundle has no provider for)")

	// ---- the two traps ------------------------------------------------------

	fmt.Println("\n--- trap 1: an entry's config REPLACES the plugin's defaults ---")
	replaced := sdk.With(sdk.Compose(base), "tool-fs", map[string]any{"readLimit": 200})
	for _, entry := range replaced {
		if entry.ID == "tool-fs" {
			fmt.Printf("  tool-fs config is now %v — and ONLY that.\n", entry.Config)
		}
	}
	fmt.Println("  An override that mentions one key discards the rest, so an override")
	fmt.Println("  meaning to keep a default has to say the default.")

	fmt.Println("\n--- trap 2: naming a plugin the bundle does not carry ---")
	absent := base
	absent.Composition = sdk.Add(sdk.Compose(base),
		sdk.Entry{ID: "sqlite", Name: "@deepseek-ai/dsh-session-persistence-sqlite"})
	if _, err := sdk.Open(ctx, absent); err != nil {
		// The harness's own error carries a stack; the first line is the fact.
		fmt.Printf("  Open refused it: %s\n", firstLine(err.Error()))
	} else {
		log.Fatal("FAIL: an unbundled plugin mounted")
	}
	fmt.Println("  Refused at start-up rather than during a turn, which is the")
	fmt.Println("  difference between a configuration error and an outage.")
}

// open starts a harness and answers with its tool names, sorted.
func open(ctx context.Context, cfg sdk.Config) []string {
	h, err := sdk.Open(ctx, cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer h.Close()

	schemas, err := h.Tools(ctx)
	if err != nil {
		log.Fatal(err)
	}
	names := make([]string, len(schemas))
	for i, schema := range schemas {
		names[i] = schema.Name
	}
	sort.Strings(names)
	return names
}

// missing is the names in a that are not in b.
func missing(a, b []string) []string {
	set := map[string]bool{}
	for _, name := range b {
		set[name] = true
	}
	var out []string
	for _, name := range a {
		if !set[name] {
			out = append(out, name)
		}
	}
	return out
}

// firstLine keeps an error readable when the runtime attached a stack to it.
func firstLine(s string) string {
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		return s[:i]
	}
	return s
}

func orNone(values []string) string {
	if len(values) == 0 {
		return "(none)"
	}
	return strings.Join(values, " ")
}

// wrap prints a long list of names as indented lines.
func wrap(values []string, width int) string {
	var out strings.Builder
	line := "  "
	for _, value := range values {
		if len(line)+len(value)+1 > width {
			out.WriteString(strings.TrimRight(line, " ") + "\n")
			line = "  "
		}
		line += value + " "
	}
	out.WriteString(strings.TrimRight(line, " "))
	return out.String()
}

func model() string {
	if id := os.Getenv("DEEPSEEK_MODEL"); id != "" {
		return id
	}
	return "deepseek-v4-flash"
}
