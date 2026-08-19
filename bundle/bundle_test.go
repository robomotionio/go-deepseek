package bundle_test

import (
	"strings"
	"testing"

	"github.com/robomotionio/go-deepseek/bundle"
)

func TestManifestLoads(t *testing.T) {
	b, err := bundle.Load()
	if err != nil {
		t.Fatal(err)
	}
	version, commit := b.Version()
	if version == "" || commit == "" {
		t.Fatalf("bundle does not record where it came from: %q @ %q", version, commit)
	}
	if len(b.Entries()) == 0 {
		t.Fatal("no entry packages recorded")
	}
	for _, spec := range b.Entries() {
		if !b.Has(spec) {
			t.Errorf("entry %s is listed but not bundled", spec)
		}
	}
}

// Every module the manifest names must actually be embedded and non-empty. A
// missing file here is a bundle that was committed half-built, which otherwise
// shows up as a resolution failure deep inside a plugin load.
func TestEveryModuleIsServed(t *testing.T) {
	b, _ := bundle.Load()
	for _, spec := range b.Specifiers() {
		src, path, ok, err := b.Resolve(spec, "")
		if err != nil || !ok {
			t.Fatalf("%s: ok=%v err=%v", spec, ok, err)
		}
		if !strings.HasPrefix(path, bundle.Namespace) {
			t.Fatalf("%s resolved to %q, outside the bundle namespace", spec, path)
		}
		if len(src) == 0 {
			t.Fatalf("%s is empty", spec)
		}
	}
}

// The refusals are part of the contract: a native addon must fail with a
// sentence rather than a resolution error.
func TestRefusalsExplainThemselves(t *testing.T) {
	b, _ := bundle.Load()
	reason, refused := b.Refused("koffi")
	if !refused {
		t.Skip("koffi was not reached by this bundle")
	}
	if reason == "" {
		t.Fatal("koffi is refused with no reason recorded")
	}
	src, _, _, _ := b.Resolve("koffi", "")
	if !strings.Contains(src, "throw new Error") {
		t.Fatalf("the koffi stub does not throw:\n%s", src)
	}
}
