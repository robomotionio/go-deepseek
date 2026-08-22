package bundle_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"testing"

	"github.com/robomotionio/go-deepseek/internal/bundle"
)

// UPSTREAM.lock.json says what this repository ships. The manifest says the
// same thing, but it is generated — so the two can disagree, and the way they
// disagree is silent: regenerate the bundle from a different revision, or widen
// ENTRIES, and the lockfile still reads as authoritative while describing
// something that is no longer here. `make upstream-check` would then compute
// drift over the wrong set of paths, which is worse than no check at all,
// because it reports "no drift" with confidence.
//
// This is the half of that check that needs no network, so it runs in `go test`
// with everything else rather than only when somebody remembers.
func TestLockfileDescribesTheBundle(t *testing.T) {
	var lock struct {
		Harness struct {
			Commit  string `json:"commit"`
			Ref     string `json:"ref"`
			Version string `json:"version"`
		} `json:"harness"`
		Entries map[string]struct {
			Version string `json:"version"`
			Path    string `json:"path"`
		} `json:"entries"`
	}

	raw, err := os.ReadFile(filepath.Join("..", "..", "UPSTREAM.lock.json"))
	if err != nil {
		t.Fatalf("the pin is missing: %v", err)
	}
	if err := json.Unmarshal(raw, &lock); err != nil {
		t.Fatalf("UPSTREAM.lock.json is not readable: %v", err)
	}

	b, err := bundle.Load()
	if err != nil {
		t.Fatal(err)
	}
	version, commit := b.Version()

	if lock.Harness.Commit != commit {
		t.Errorf("the pin names %s but the bundle was generated from %s —\n"+
			"one of them is stale; regenerate the bundle or move the pin",
			short(lock.Harness.Commit), short(commit))
	}
	if lock.Harness.Version != version {
		t.Errorf("the pin says harness %s, the bundle says %s", lock.Harness.Version, version)
	}
	if lock.Harness.Ref == "" {
		t.Error("the pin records no ref, so nothing can fetch what it names")
	}

	pinned := make([]string, 0, len(lock.Entries))
	for name, entry := range lock.Entries {
		pinned = append(pinned, name)
		if entry.Path == "" {
			t.Errorf("%s is pinned with no upstream path, so drift over it cannot be computed", name)
		}
		if entry.Version == "" {
			t.Errorf("%s is pinned with no version", name)
		}
	}
	bundled := append([]string(nil), b.Entries()...)
	sort.Strings(pinned)
	sort.Strings(bundled)

	for _, name := range diff(bundled, pinned) {
		t.Errorf("%s is bundled but not pinned — upstream-check would not watch it", name)
	}
	for _, name := range diff(pinned, bundled) {
		t.Errorf("%s is pinned but no longer bundled", name)
	}
}

// diff returns the members of a that are absent from b. Both are sorted.
func diff(a, b []string) []string {
	present := make(map[string]bool, len(b))
	for _, name := range b {
		present[name] = true
	}
	var out []string
	for _, name := range a {
		if !present[name] {
			out = append(out, name)
		}
	}
	return out
}

func short(sha string) string {
	if len(sha) > 12 {
		return sha[:12]
	}
	return sha
}
