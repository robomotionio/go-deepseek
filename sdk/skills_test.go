package sdk_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// TestSkillDiscoveryCompletes is the acceptance test for fs.watch, stated in the
// terms that made it worth implementing.
//
// The bundled skill provider watches its roots with chokidar, and chokidar
// needs fs.watch. While this runtime refused fs.watch the provider could still
// read a catalogue but never reported discovery COMPLETE — and one incomplete
// provider suppresses the whole <available_skills> section rather than
// degrading it, so a skill on disk was invisible to the model. This asserts
// both halves: the skill is found, and the finding is authoritative.
func TestSkillDiscoveryCompletes(t *testing.T) {
	if testing.Short() {
		t.Skip("booting the harness takes a moment")
	}

	dir := t.TempDir()
	skillDir := filepath.Join(dir, "skills", "inventory-report")
	if err := os.MkdirAll(skillDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(
		"---\nname: inventory-report\ndescription: Summarise the parts inventory.\n---\n\nRun the report.\n",
	), 0o644); err != nil {
		t.Fatal(err)
	}

	type observation struct {
		Complete bool `json:"complete"`
		Skills   []struct {
			Name string `json:"name"`
		} `json:"skills"`
	}
	observed := make(chan observation, 1)
	failed := make(chan error, 1)

	cfg := sdk.Config{CWD: dir, Env: map[string]string{"HOME": dir}}
	cfg.Composition = sdk.With(sdk.Compose(cfg), "agent-spine", map[string]any{
		"agents": []map[string]any{{
			"id": "main", "provider": "deepseek-official",
			"model": "deepseek-v4-flash", "cwd": dir,
		}},
		"workspaceContext": map[string]any{"maxBytes": 65536},
		"skills": map[string]any{
			"filesystem": map[string]any{
				// Only this root: the default ones are whatever the machine
				// running the test happens to have, which is not a fixture.
				"includeDefaultRoots": false,
				"customSkillDirs":     []string{filepath.Join(dir, "skills")},
				// The setting under test. Watching is what needs fs.watch;
				// with it unimplemented this is where discovery stopped being
				// complete.
				"watch": true,
			},
		},
	})

	// The observation has to happen while the event loop is running, and Apply
	// is the one place a Go plugin is certain of that. Mounted last, so the
	// spine — and the skill provider inside it — is already up.
	cfg.Plugins = []sdk.Plugin{{
		ID:     "observe-skills",
		Inject: []string{"skills"},
		Apply: func(ctx *sdk.Context) error {
			skills, err := ctx.Service("skills")
			if err != nil {
				failed <- err
				return err
			}
			answer, err := skills.Call("snapshot", map[string]any{"cwd": dir})
			if err != nil {
				failed <- err
				return err
			}
			var out observation
			if err := json.Unmarshal(answer.JSON(), &out); err != nil {
				failed <- err
				return err
			}
			observed <- out
			return nil
		},
	}}

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	h, err := sdk.Open(ctx, cfg)
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer h.Close()

	select {
	case err := <-failed:
		t.Fatalf("the skills service could not be observed: %v", err)
	case out := <-observed:
		if !out.Complete {
			t.Error("discovery did not report complete, so <available_skills> stays suppressed")
		}
		found := false
		for _, summary := range out.Skills {
			if summary.Name == "inventory-report" {
				found = true
			}
		}
		if !found {
			t.Errorf("the skill on disk was not discovered: %+v", out.Skills)
		}
	case <-ctx.Done():
		t.Fatal("the plugin never applied")
	}
}
