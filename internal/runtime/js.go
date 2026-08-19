package runtime

// The boot script, embedded. It is the only JavaScript this package writes for
// itself; everything else it runs is upstream's.

import (
	"embed"
	"fmt"
	"sort"

	"github.com/robomotionio/go-deepseek/internal/bundle"
)

//go:embed js/*.js
var jsFS embed.FS

func bootSource() (string, error) {
	b, err := jsFS.ReadFile("js/boot.js")
	if err != nil {
		return "", fmt.Errorf("deepseek: boot script is missing: %w", err)
	}
	return string(b), nil
}

// BundledPlugins lists the specifiers the embedded bundle can serve, sorted.
// The SDK exposes it so a caller composing by hand can see what exists.
func BundledPlugins() []string {
	b, err := bundle.Load()
	if err != nil {
		return nil
	}
	out := b.Specifiers()
	sort.Strings(out)
	return out
}

// BundleVersion reports the upstream version and commit the bundle was built
// from.
func BundleVersion() (version, commit string) {
	b, err := bundle.Load()
	if err != nil {
		return "", ""
	}
	return b.Version()
}
