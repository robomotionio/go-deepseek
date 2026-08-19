package nodecompat

// The JavaScript half of the layer, embedded in the binary.
//
// These are ordinary ES modules and scripts, compiled into the Go binary with
// go:embed so that nothing has to be on disk for them to run. They are the
// implementation of everything that is computation rather than capability: the
// path algebra, the Buffer methods, the event emitter, the stream classes, the
// Node API shapes over the host bindings in this package.

import (
	"embed"
	"fmt"
)

//go:embed js/*.js js/node/*.js js/vendor/*.js
var jsFS embed.FS

// jsSource reads one embedded script by its path under js/.
func jsSource(name string) (string, error) {
	b, err := jsFS.ReadFile("js/" + name)
	if err != nil {
		return "", fmt.Errorf("nodecompat: missing embedded script %s: %w", name, err)
	}
	return string(b), nil
}
