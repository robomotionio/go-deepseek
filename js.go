package deepseek

// The boot script, embedded. It is the only JavaScript this package writes for
// itself; everything else it runs is upstream's.

import (
	"embed"
	"fmt"
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
