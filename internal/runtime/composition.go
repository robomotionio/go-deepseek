package runtime

// The composition: the entry list that decides what the harness IS.
//
// Everything in the harness is a plugin, and a deployment is the list of them
// plus their configuration. There is no other configuration surface, which is
// what makes this file the interesting one — and what makes two of its rules
// worth stating loudly, because both are quiet traps:
//
//   - An entry's config REPLACES the plugin's defaults rather than merging into
//     them. An override that mentions one key and means to leave the rest alone
//     silently discards the rest.
//   - The YAML form supports `!!js`, which is arbitrary JavaScript evaluated by
//     the loader. Nothing here emits it, and validate rejects it in anything a
//     caller supplied: a composition that arrives from outside the program is
//     data, and a value in it that executes is arbitrary code with the host's
//     privileges.

import (
	"fmt"
	"strings"
)

// Compose builds the default v1 composition from a Config.
//
// It is the "minimal useful agent": a model, a session that persists, a
// filesystem it can read and edit, and a todo list. Anything more — bash, the
// web tools, skills — is added by the caller, because each one widens what the
// agent can reach and that should be a decision rather than a default.
func Compose(cfg Config) []Entry {
	model := cfg.Model
	if model == "" {
		model = "deepseek-v4-flash"
	}
	provider := cfg.Provider
	if provider == "" {
		provider = "deepseek-official"
	}

	llmConfig := map[string]any{
		// The catalog the adapter advertises. A model the agent asks for that is
		// not listed here is not resolvable, so the configured one is always in
		// it.
		"models": []map[string]any{{"id": model, "contextWindow": 128000}},
		// Pinned, because upstream moved its default from 2 to 5 in 0.1.1-rc.2
		// and a default is the wrong place for that decision to be made for us.
		// Retries are latency an operator cannot see: a provider that is down
		// answers on the fifth attempt after five backoffs rather than on the
		// second, and what surfaces meanwhile is a node that appears to hang.
		// A robot runs on a schedule, so failing sooner and reporting honestly
		// beats waiting longer and occasionally succeeding. Two is what every
		// flow built against v0.2.0 was tuned on; raising it is a decision to
		// take deliberately, per deployment, not one to inherit from an
		// upstream bump.
		"retryPolicy": map[string]any{"mode": "normal", "maxRetries": 2},
	}
	if cfg.BaseURL != "" {
		llmConfig["baseURL"] = cfg.BaseURL
	}

	agent := map[string]any{
		"id":       "main",
		"provider": provider,
		"model":    model,
		// Computed here rather than left to `!!js process.cwd()`, which is what
		// the upstream examples write and what this design exists to avoid.
		"cwd": cfg.CWD,
	}

	return []Entry{
		{
			ID:     "llm-deepseek",
			Name:   "@deepseek-ai/dsh-llm-deepseek",
			Config: llmConfig,
		},
		{
			ID:   "agent-spine",
			Name: "@deepseek-ai/dsh-agent-spine-demo",
			Config: map[string]any{
				"agents":           []map[string]any{agent},
				"workspaceContext": map[string]any{"maxBytes": 65536},
			},
		},
		{
			ID:   "persistence",
			Name: "@deepseek-ai/dsh-session-persistence-jsonl",
			Config: map[string]any{
				"root": cfg.SessionRoot,
				// zstd, because the session log is the thing that grows without
				// bound and the runtime can decompress it (see nodecompat).
				"compression": "zstd",
			},
		},
		{
			ID:   "checkpoint-policy",
			Name: "@deepseek-ai/dsh-session-checkpoint-policy",
		},
		{
			ID:     "fs-local",
			Name:   "@deepseek-ai/dsh-fs-local",
			Config: map[string]any{"cwd": cfg.CWD},
		},
		{
			ID:   "tool-fs",
			Name: "@deepseek-ai/dsh-tool-fs",
		},
		{
			ID:   "tool-str-replace-editor",
			Name: "@deepseek-ai/dsh-tool-str-replace-editor",
		},
		{
			ID:   "tool-todo",
			Name: "@deepseek-ai/dsh-tool-todo",
			Config: map[string]any{
				"allowParallelInProgress": true,
			},
		},
	}
}

// With returns a copy of the composition with one entry's config replaced.
//
// Replaced, not merged — the harness's own rule, restated here so that a caller
// reading this file cannot end up believing otherwise. An override that means to
// keep a default has to say the default.
func With(entries []Entry, id string, config map[string]any) []Entry {
	out := make([]Entry, len(entries))
	copy(out, entries)
	for i := range out {
		if out[i].ID == id {
			out[i].Config = config
		}
	}
	return out
}

// Add appends an entry, or replaces one that already has its id.
func Add(entries []Entry, entry Entry) []Entry {
	for i := range entries {
		if entries[i].ID == entry.ID {
			out := make([]Entry, len(entries))
			copy(out, entries)
			out[i] = entry
			return out
		}
	}
	return append(append([]Entry(nil), entries...), entry)
}

// Disable marks an entry disabled without removing it, which is how a plugin is
// turned off with its configuration intact.
func Disable(entries []Entry, id string, disabled bool) []Entry {
	out := make([]Entry, len(entries))
	copy(out, entries)
	for i := range out {
		if out[i].ID == id {
			out[i].Disabled = disabled
		}
	}
	return out
}

// validate checks a composition before anything mounts it.
func validate(entries []Entry) error {
	seen := map[string]bool{}
	return walk(entries, func(entry Entry, path string) error {
		if entry.ID == "" {
			return fmt.Errorf("deepseek: composition%s: an entry has no id", path)
		}
		if seen[entry.ID] {
			// The loader raises this too, but only after mounting the entries
			// before it — so a duplicate id would leave a half-built tree.
			return fmt.Errorf("deepseek: composition%s: duplicate entry id %q", path, entry.ID)
		}
		seen[entry.ID] = true
		if entry.Name == "" && !entry.Group {
			return fmt.Errorf("deepseek: composition%s: entry %q names no plugin", path, entry.ID)
		}
		if err := rejectExecutable(entry.Config, fmt.Sprintf("%s: entry %q", path, entry.ID)); err != nil {
			return err
		}
		return nil
	}, "")
}

// rejectExecutable refuses a config that carries a `!!js` expression.
//
// The loader evaluates those, so a composition that arrives from outside — a
// configuration file, a database row, an API request — is a way to run arbitrary
// JavaScript with the host's privileges. Nothing this package emits contains
// one, so finding one means it came from somewhere it should not have, and the
// right response is to refuse rather than to sanitise.
func rejectExecutable(value any, where string) error {
	switch v := value.(type) {
	case string:
		if strings.HasPrefix(strings.TrimSpace(v), "!!js") {
			return fmt.Errorf("deepseek: composition%s: config carries a !!js expression, which this runtime will not evaluate", where)
		}
	case map[string]any:
		for key, item := range v {
			if strings.HasPrefix(strings.TrimSpace(key), "!!js") {
				return fmt.Errorf("deepseek: composition%s: config key %q is a !!js expression", where, key)
			}
			if err := rejectExecutable(item, where); err != nil {
				return err
			}
		}
	case []any:
		for _, item := range v {
			if err := rejectExecutable(item, where); err != nil {
				return err
			}
		}
	case []map[string]any:
		for _, item := range v {
			if err := rejectExecutable(item, where); err != nil {
				return err
			}
		}
	}
	return nil
}

// walk visits every entry, descending into groups.
func walk(entries []Entry, visit func(Entry, string) error, path string) error {
	for i, entry := range entries {
		here := fmt.Sprintf("%s[%d]", path, i)
		if err := visit(entry, here); err != nil {
			return err
		}
		if len(entry.Children) > 0 {
			if err := walk(entry.Children, visit, here); err != nil {
				return err
			}
		}
	}
	return nil
}
