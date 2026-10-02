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
	"sort"
	"strings"
)

// Compose builds the default v1 composition from a Config.
//
// It is the "minimal useful agent": a model, a session that persists, a
// filesystem it can read and edit, and a todo list. Anything that reaches
// further — the web tools, a shell executor — is added by the caller, because
// each one widens what the agent can reach and that should be a decision
// rather than a default. The `bash`, job and skill tools ARE mounted, but
// dormant: each injects a service (`shell`, a skill root) that nothing here
// provides, so the model sees none of them until the caller supplies one.
//
// Until harness 0.1.6 the agent core was ONE row, `agent-spine`, a demo
// bundle that mounted a dozen plugins from a single merged config. Upstream
// deleted it without an alias (2026-08-26), so the core is spelled out below
// row by row, the way upstream's own sdk-minimal and base profiles now write
// it. The rows and their defaults are the spine's, so a composition built here
// mounts what 0.3.0's did; SplitSpine carries a saved spine config across.
func Compose(cfg Config) []Entry {
	model := cfg.Model
	if model == "" {
		model = "deepseek-v4-flash"
	}
	provider := cfg.Provider
	if provider == "" {
		provider = "deepseek-official"
	}
	agent := map[string]any{
		"id":       "main",
		"provider": provider,
		"model":    model,
		// Computed here rather than left to `!!js process.cwd()`, which is what
		// the upstream examples write and what this design exists to avoid.
		"cwd": cfg.CWD,
	}

	entries := []Entry{modelRow(cfg, provider, model)}
	entries = append(entries, coreRows(agent)...)
	return append(entries, []Entry{
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
	}...)
}

// ModelRowID is the id of the row that serves the model, whichever plugin that
// is. It predates the day the protocol started choosing the plugin, and saved
// compositions address the model's settings by it.
const ModelRowID = "llm-deepseek"

const (
	// ProtocolChatCompletions is the OpenAI-compatible wire, and the default.
	ProtocolChatCompletions = "chat-completions"
	// ProtocolMessages is DeepSeek's Anthropic-compatible wire.
	ProtocolMessages = "messages"

	messagesPlugin        = "@deepseek-ai/dsh-llm-deepseek-api-key"
	chatCompletionsPlugin = "@deepseek-ai/dsh-llm-pi-ai"

	// Where chat completions goes when no BaseURL says otherwise: the endpoint
	// upstream's adapter defaulted to while it still spoke this wire.
	chatCompletionsBaseURL = "https://api.deepseek.com"
	// The output cap that adapter sent when nobody chose one. DeepSeek's own
	// default is far smaller, so leaving the field off would truncate answers
	// that used to arrive whole.
	defaultMaxTokens = 256000
)

// modelRow is the row that serves the model, and the protocol decides which
// plugin it is.
//
// Until harness 0.1.7 one plugin, dsh-llm-deepseek, spoke both wires behind a
// `protocol` key, and Compose pinned that key to chat completions because
// BaseURL has always meant an OpenAI-compatible endpoint here: every gateway,
// proxy and local server a caller has pointed this at speaks it. Upstream then
// made its adapter Messages-only — a config that still says `protocol` is
// refused at boot — and left chat completions to llm-pi-ai. So the default
// stays what it was and is now served by pi-ai, while Messages is the api-key
// provider upstream's own profiles mount. The row keeps one id either way.
//
// Two values are pinned on both, for the reasons they always were:
//
//   - The catalog. A model the agent asks for that the route does not list is
//     not resolvable, so the configured one is always in it.
//   - The retry budget. Upstream moved its default from 2 to 5 in 0.1.1-rc.2,
//     and retries are latency an operator cannot see: a provider that is down
//     answers on the fifth attempt after five backoffs, and what surfaces
//     meanwhile is a node that appears to hang. A robot runs on a schedule, so
//     failing sooner and reporting honestly beats waiting longer. Two is what
//     every flow built against v0.2.0 was tuned on.
func modelRow(cfg Config, provider, model string) Entry {
	retry := map[string]any{"mode": "normal", "maxRetries": 2}

	if cfg.Protocol == ProtocolMessages {
		config := map[string]any{
			"models":      []map[string]any{{"id": model, "contextWindow": 128000}},
			"retryPolicy": retry,
		}
		if cfg.BaseURL != "" {
			config["baseURL"] = cfg.BaseURL
		}
		return Entry{ID: ModelRowID, Name: messagesPlugin, Config: config}
	}

	baseURL := cfg.BaseURL
	if baseURL == "" {
		baseURL = chatCompletionsBaseURL
	}
	return Entry{
		ID:   ModelRowID,
		Name: chatCompletionsPlugin,
		Config: map[string]any{
			"providers": map[string]any{
				provider: map[string]any{
					"api":       "openai-completions",
					"baseURL":   baseURL,
					"apiKeyEnv": "DEEPSEEK_API_KEY",
					"models": []map[string]any{{
						"id":            model,
						"contextWindow": 128000,
						"maxTokens":     defaultMaxTokens,
						// The levels the old adapter offered, under the spellings
						// it sent. `off` carries no value: not thinking is the
						// parameter's absence, not a word.
						"reasoningEfforts": map[string]any{
							"off": nil, "low": "low", "high": "high", "max": "max",
						},
					}},
					"reasoning":   "high",
					"retryPolicy": retry,
					// The dialect, stated rather than detected. pi-ai guesses one
					// from the endpoint's host: deepseek.com gets this one,
					// openrouter.ai a nested `reasoning` object, and a host it
					// does not recognise the OpenAI one — a `developer` role,
					// `store`, `max_completion_tokens`. The adapter this replaces
					// sent DeepSeek's dialect to every endpoint, so that is what
					// each gateway behind a BaseURL has been answering; letting
					// the host decide would change the request for all of them at
					// once, on an upgrade nobody asked to change it.
					"compat": map[string]any{
						"thinkingFormat":                              "deepseek",
						"maxTokensField":                              "max_tokens",
						"supportsReasoningEffort":                     true,
						"supportsDeveloperRole":                       false,
						"supportsStore":                               false,
						"supportsUsageInStreaming":                    true,
						"requiresReasoningContentOnAssistantMessages": true,
					},
				},
			},
		},
	}
}

// WithModelSettings applies model settings to the model row, in the terms the
// plugin serving it reads.
//
// The settings are spelled the way the DeepSeek adapter spelled them —
// `reasoningEffort`, `thinking`, `maxTokens`, `defaultContextWindow`,
// `streamIdleTimeoutMs`, `retryPolicy`, `baseURL` — because that is what a
// composition saved against any earlier bundle holds for this row. On the
// Messages row they are that plugin's own keys and are merged as written. On
// the chat-completions row they are pi-ai's by other names and in other
// places: the effort is the route's `reasoning`, the output cap belongs to the
// model's catalog entry, and `thinking: disabled` is the level `off`. Merging
// them as written there would not fail — the loader accepts an unknown key —
// it would configure nothing, silently.
//
// `protocol` is skipped: it chose the row before this ran. A nil value is
// skipped too, which is how an editor writes "no override here". Anything else
// the chat-completions row has no place for is an error naming the key, rather
// than a setting somebody made and nothing honoured.
//
// An object is MERGED onto the one Compose put there, key by key, rather than
// replacing it: a saved `retryPolicy: {maxRetries: 4}` means that one number,
// and replacing the object would quietly drop the `mode` pinned beside it.
func WithModelSettings(entries []Entry, settings map[string]any) ([]Entry, error) {
	at := -1
	for i := range entries {
		if entries[i].ID == ModelRowID {
			at = i
		}
	}
	if at < 0 {
		return nil, fmt.Errorf("deepseek: the composition has no %q row to apply model settings to", ModelRowID)
	}
	keys := make([]string, 0, len(settings))
	for key, value := range settings {
		if key != "protocol" && value != nil {
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)

	config := cloneConfig(entries[at].Config)
	if entries[at].Name != chatCompletionsPlugin {
		for _, key := range keys {
			config[key] = mergeSetting(config[key], settings[key])
		}
		return With(entries, ModelRowID, config), nil
	}

	providers, _ := config["providers"].(map[string]any)
	if len(providers) != 1 {
		return nil, fmt.Errorf("deepseek: the model row serves %d routes; model settings apply to exactly one", len(providers))
	}
	var route map[string]any
	for _, value := range providers {
		route, _ = value.(map[string]any)
	}
	models, _ := route["models"].([]map[string]any)
	if route == nil || len(models) != 1 {
		return nil, fmt.Errorf("deepseek: the model row is not the one Compose built; model settings cannot be placed on it")
	}

	for _, key := range keys {
		value := settings[key]
		switch key {
		case "reasoningEffort":
			level, _ := value.(string)
			if _, offered := models[0]["reasoningEfforts"].(map[string]any)[level]; !offered {
				return nil, fmt.Errorf("deepseek: reasoningEffort %v is not one of off, low, high or max", value)
			}
			route["reasoning"] = level
		case "thinking":
			if value != "enabled" && value != "disabled" {
				return nil, fmt.Errorf("deepseek: thinking %v is neither enabled nor disabled", value)
			}
		case "maxTokens":
			models[0]["maxTokens"] = value
		case "defaultContextWindow", "streamIdleTimeoutMs", "retryPolicy", "baseURL":
			route[key] = mergeSetting(route[key], value)
		default:
			return nil, fmt.Errorf("deepseek: model setting %q is read by the Messages protocol only; chat completions has no such setting", key)
		}
	}
	// After the loop, so it wins whichever order the keys came in: upstream's
	// rule was that a deployment with thinking disabled runs every request
	// with it off, whatever effort was also named.
	if settings["thinking"] == "disabled" {
		route["reasoning"] = "off"
	}
	return With(entries, ModelRowID, config), nil
}

// mergeSetting lays one setting over what is already there. Two objects merge
// key by key, recursively, and a nil inside the incoming one removes its key —
// the same "no override here" a nil means at the top. Anything else replaces.
func mergeSetting(existing, incoming any) any {
	over, ok := incoming.(map[string]any)
	if !ok {
		return incoming
	}
	base, _ := existing.(map[string]any)
	out := cloneConfig(base)
	for key, value := range over {
		if value == nil {
			delete(out, key)
			continue
		}
		out[key] = mergeSetting(out[key], value)
	}
	return out
}

// cloneConfig copies a row config deeply enough to edit: maps, and the model
// catalog's list of maps. Compose returns fresh values on every call, but an
// entry list is passed around and adjusted by value, and writing through a
// shared map would edit the caller's copy behind its back.
func cloneConfig(in map[string]any) map[string]any {
	out := make(map[string]any, len(in))
	for key, value := range in {
		switch v := value.(type) {
		case map[string]any:
			out[key] = cloneConfig(v)
		case []map[string]any:
			list := make([]map[string]any, len(v))
			for i, item := range v {
				list[i] = cloneConfig(item)
			}
			out[key] = list
		default:
			out[key] = value
		}
	}
	return out
}

// coreRows is the agent core the spine used to mount, one row per plugin.
//
// Row order carries no load semantics — cordis activates a plugin when the
// services it injects exist — with one exception the spine documented and
// this keeps: agent-instructions and tool-skill both prepend session-prefix
// messages, registration order is the rendered order, and the workspace's
// instructions come before the skill catalogue.
func coreRows(agent map[string]any) []Entry {
	return []Entry{
		{ID: "timer", Name: "@deepseek-ai/cordis-plugin-timer"},
		{ID: "llm", Name: "@deepseek-ai/dsh-llm"},
		{ID: "session", Name: "@deepseek-ai/dsh-session"},
		// New in 0.1.5: the per-session state registry the loop, the todo
		// tool, the title service and workspace context now fold through. Every
		// one of them injects it, so without this row nothing below mounts.
		{ID: "session-projection", Name: "@deepseek-ai/dsh-session-projection"},
		{
			ID:   "session-title",
			Name: "@deepseek-ai/dsh-session-title",
			// The spine's example policy, which it applied when the caller
			// named none. The plugin's own schema has no default for these.
			Config: map[string]any{
				"fallbackMaxWords": 5,
				"fallbackMaxBytes": 40,
				"maxTitleBytes":    80,
			},
		},
		{
			ID:   "system-prompt",
			Name: "@deepseek-ai/dsh-system-prompt",
			// Stated rather than left to the schema, because the spine stated
			// them and upstream's minimal profile now turns both off: a
			// default that moves under a composition is a prompt that changes
			// without anyone deciding it should.
			Config: map[string]any{
				"includeHarnessIdentity": true,
				"includeRuntimeContext":  true,
				"personaPrefix":          "",
			},
		},
		{ID: "tools", Name: "@deepseek-ai/dsh-tools"},
		{ID: "skill", Name: "@deepseek-ai/dsh-skill"},
		{ID: "skill-filesystem", Name: "@deepseek-ai/dsh-skill-filesystem"},
		{ID: "agent", Name: "@deepseek-ai/dsh-agent"},
		{ID: "llm-retry", Name: "@deepseek-ai/dsh-llm-retry"},
		{ID: "jobs", Name: "@deepseek-ai/dsh-jobs-local"},
		{ID: "invariants", Name: "@deepseek-ai/dsh-invariants"},
		{ID: "session-invariant", Name: "@deepseek-ai/dsh-session/invariant"},
		{ID: "agent-invariant", Name: "@deepseek-ai/dsh-agent/invariant"},
		{ID: "scope-invariant", Name: "@deepseek-ai/dsh-scope/invariant"},
		{ID: "agent-loop-invariant", Name: "@deepseek-ai/dsh-agent-loop/invariant"},
		{ID: "shell-env", Name: "@deepseek-ai/dsh-shell-env"},
		{
			ID:   "tool-bash",
			Name: "@deepseek-ai/dsh-tool-bash",
			// New in 0.1.7, and on by default upstream: a foreground command
			// that reaches its timeout is kept running as a background job
			// instead of being killed. Until then the timeout was a deadline —
			// the command stopped — and that is what every flow that set one
			// was promised. A process that outlives the limit put on it is a
			// decision to take per deployment, not one to arrive with a bundle.
			Config: map[string]any{"promoteOnTimeout": false},
		},
		{
			ID:   "agent-instructions",
			Name: "@deepseek-ai/dsh-agent-instructions",
			Config: map[string]any{
				"maxBytes": 65536,
				// The workspace IS the project. Upstream walks up from the
				// session cwd looking for a `.git`, and since 0.1.5 treats any
				// answer but "missing" as fatal — so the first directory above
				// the fence, which the filesystem refuses with EACCES rather
				// than pretending it is absent, failed every turn. With no
				// markers the walk probes nothing and the root is the cwd,
				// which is what the fence already said it was.
				"projectRootMarkers": []string{},
			},
		},
		{ID: "tool-skill", Name: "@deepseek-ai/dsh-tool-skill"},
		{
			ID:   "tool-jobs",
			Name: "@deepseek-ai/dsh-tool-jobs",
			// Pinned, because upstream removed its default of 3 in 0.1.7: with
			// none, every background completion opens a turn on an idle agent,
			// without limit. That is the self-exciting chain the cap existed
			// for — a woken turn starts the job whose completion wakes it
			// again — and on a robot nobody is watching, each link is a model
			// call nobody asked for.
			Config: map[string]any{"maxConsecutiveWakes": 3},
		},
		{
			ID:     "agent-loop",
			Name:   "@deepseek-ai/dsh-agent-loop",
			Config: map[string]any{"agents": []map[string]any{agent}},
		},
	}
}

// SplitSpine translates the config of a retired `agent-spine` row into the
// rows that own each key now.
//
// A saved composition written before 0.4.0 may carry one — it was the only way
// to set the persona, the tool order, the workspace-context budget or the
// skill roots — and upstream deleted the plugin that read it, so replaying the
// row as written fails at boot with a module that does not exist. The
// forwarding rules below are the spine's own (see agent-spine-demo's apply at
// dsh-v0.1.1-rc.2), so a config split here mounts what it mounted then:
//
//   - `persona` is system-prompt's `personaPrefix` since 0.1.5; the other
//     prompt keys keep their names.
//   - `tools`, `jobs`, `sessionTitle`, `invariants`, `workspaceContext`,
//     `toolBash` and `toolJobs` were each one child's whole config.
//   - `skills` fanned out: `registry`, `filesystem` and `tool` to the three
//     skill rows, `enabled: false` to not mounting any of them.
//   - `false` for `workspaceContext`, `toolBash` or `toolJobs` meant "do not
//     mount it"; for `toolBash` that took shell-env along with it.
//   - `dshHome` went to shell-env and to the skill filesystem provider.
//
// It returns one config fragment per row and the ids to disable. The
// fragments are FRAGMENTS: whether they replace or merge into the row's
// composed config is the caller's rule, and replacing drops what Compose put
// there. `agents` is ignored, because it is computed from the Config and
// never belonged in a saved row. Anything else — `goals`, which this bundle
// has never carried, or a key nobody knows — is an error rather than a
// setting quietly lost.
func SplitSpine(config map[string]any) (map[string]map[string]any, []string, error) {
	rows := map[string]map[string]any{}
	var disabled []string
	put := func(row, key string, value any) {
		if rows[row] == nil {
			rows[row] = map[string]any{}
		}
		rows[row][key] = value
	}
	whole := func(row string, value any) error {
		object, ok := value.(map[string]any)
		if !ok {
			return fmt.Errorf("agent-spine: %s must be an object, got %T", row, value)
		}
		if rows[row] == nil {
			rows[row] = map[string]any{}
		}
		for key, item := range object {
			rows[row][key] = item
		}
		return nil
	}
	optional := func(value any, rowIDs ...string) error {
		if off, ok := value.(bool); ok {
			if off {
				return fmt.Errorf("agent-spine: %s accepts false or an object, not true", rowIDs[len(rowIDs)-1])
			}
			disabled = append(disabled, rowIDs...)
			return nil
		}
		return whole(rowIDs[len(rowIDs)-1], value)
	}

	keys := make([]string, 0, len(config))
	for key := range config {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		value := config[key]
		var err error
		switch key {
		case "agents":
		case "maxParallelToolCalls":
			put("agent-loop", key, value)
		case "includeHarnessIdentity", "includeRuntimeContext", "toolOrder":
			put("system-prompt", key, value)
		case "persona":
			put("system-prompt", "personaPrefix", value)
		case "dshHome":
			put("shell-env", key, value)
			put("skill-filesystem", key, value)
		case "tools":
			err = whole("tools", value)
		case "jobs":
			err = whole("jobs", value)
		case "sessionTitle":
			err = whole("session-title", value)
		case "invariants":
			err = whole("invariants", value)
		case "workspaceContext":
			err = optional(value, "agent-instructions")
		case "toolBash":
			err = optional(value, "shell-env", "tool-bash")
		case "toolJobs":
			err = optional(value, "tool-jobs")
		case "goals":
			if value != false {
				err = fmt.Errorf("agent-spine: goals are not in this bundle")
			}
		case "skills":
			err = splitSkills(value, rows, &disabled, whole)
		default:
			err = fmt.Errorf("agent-spine: unknown config key %q", key)
		}
		if err != nil {
			return nil, nil, err
		}
	}
	return rows, disabled, nil
}

func splitSkills(value any, rows map[string]map[string]any, disabled *[]string, whole func(string, any) error) error {
	skills, ok := value.(map[string]any)
	if !ok {
		return fmt.Errorf("agent-spine: skills must be an object, got %T", value)
	}
	owners := map[string]string{"registry": "skill", "filesystem": "skill-filesystem", "tool": "tool-skill"}
	for key, part := range skills {
		if key == "enabled" {
			if part == false {
				*disabled = append(*disabled, "skill", "skill-filesystem", "tool-skill")
			}
			continue
		}
		row, ok := owners[key]
		if !ok {
			return fmt.Errorf("agent-spine: unknown skills key %q", key)
		}
		if err := whole(row, part); err != nil {
			return err
		}
	}
	return nil
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
