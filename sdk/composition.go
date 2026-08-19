package sdk

import (
	runtime "github.com/robomotionio/go-deepseek/internal/runtime"
)

// The composition: which plugins the harness is made of.
//
// Everything in the DeepSeek Harness is a plugin, and a deployment is a list of
// them with their configuration — there is no other configuration surface. Most
// callers never touch this: Open builds the default list, which is a model, a
// session that persists, a filesystem the agent can read and edit, and a todo
// list. Reach for it to add a capability (a shell, web search, skills), to take
// one away, or to configure one.
//
// It applies to the in-process carrier. A prebuilt runtime driven over JSON-RPC
// composes itself from its own configuration file, so a composition set here is
// ignored there rather than silently half-applied.

// Entry is one row of the composition: a plugin, its id, and its configuration.
// It mirrors the entry the harness reads from YAML, so a composition built here
// is one upstream could load.
type Entry = runtime.Entry

// Compose returns the default composition for a Config — the minimal useful
// agent. Adjust it with Add, With and Disable, then set it as Config.Composition.
//
//	entries := sdk.Compose(cfg)
//	entries = sdk.Add(entries, sdk.Entry{ID: "web", Name: "@deepseek-ai/dsh-tool-web"})
//	cfg.Composition = sdk.Disable(entries, "persistence", true)
//
// It reads the Config exactly as Open would, defaults and environment included:
// the same endpoint from DEEPSEEK_BASE_URL, the same working directory, the
// same session root. That matters because the composition FREEZES what it read
// — an entry list is data, and Open mounts it as written — so a composition
// built from a Config that had not been defaulted yet would aim the model
// adapter at the default endpoint no matter what the environment said, and
// answer with a 401 that reads exactly like a bad key.
func Compose(cfg Config) []Entry {
	// The only way this fails is a process whose working directory cannot be
	// named — and only for a Config that named none itself, which is the
	// unusual case here. Composing is pure, so there is nothing to abandon, and
	// growing an error return every caller would ignore buys nothing: Open
	// resolves the same Config and reports the same failure a moment later.
	//
	// What matters is what survives it. resolve() applies the model route, the
	// endpoint and the credential BEFORE anything that can fail, so a
	// composition built on that path is missing the working directory alone
	// rather than silently pointing at the wrong endpoint.
	_ = cfg.resolve()
	return runtime.Compose(runtime.Config{
		Provider:    cfg.Provider,
		Model:       cfg.Model,
		BaseURL:     cfg.BaseURL,
		MaxTokens:   cfg.MaxTokens,
		CWD:         cfg.CWD,
		SessionRoot: cfg.SessionRoot,
	})
}

// With replaces one entry's configuration.
//
// Replaced, not merged — the harness's own rule. An entry's config stands in for
// the plugin's defaults wholesale, so an override that means to keep a default
// has to say the default.
func With(entries []Entry, id string, config map[string]any) []Entry {
	return runtime.With(entries, id, config)
}

// Add appends an entry, or replaces the one that already has its id.
func Add(entries []Entry, entry Entry) []Entry {
	return runtime.Add(entries, entry)
}

// Disable marks an entry disabled without removing it, which is how a plugin is
// turned off with its configuration intact.
func Disable(entries []Entry, id string, disabled bool) []Entry {
	return runtime.Disable(entries, id, disabled)
}

// Plugins lists what the embedded bundle can mount. A composition naming
// anything else fails when the harness starts, so this is the set to choose
// from — and the reason to regenerate the bundle when you need more.
func Plugins() []string { return runtime.BundledPlugins() }

// HarnessVersion reports the upstream version and commit the embedded harness
// was built from. Worth logging: the harness is a developer preview whose
// session format is still version zero.
func HarnessVersion() (version, commit string) { return runtime.BundleVersion() }
