// Package bundle is the DeepSeek Harness, compiled into the binary.
//
// Upstream ships no bundle. Each package builds to its own lib/*.js which still
// imports its siblings by bare specifier, and the executable upstream publishes
// snapshots a whole node_modules tree as embedded assets. Neither is something a
// Go binary can load, so tools/bundle/build.mjs produces this: one ES module per
// package, everything relative inlined, everything bare left external.
//
// One file per package rather than one file for everything, for two reasons that
// are easy to discover the hard way:
//
//   - The plugin loader performs a real dynamic import with a specifier read
//     from the composition. A single bundle has nothing to answer that with,
//     and the alternative — patching the loader to consult a registry — is a
//     patch to carry against every upstream release.
//   - Identity survives. A package left external everywhere is instantiated
//     once, so `instanceof` across packages holds and a module with state has
//     one copy of it. A single-file bundle with duplicated dependencies breaks
//     both, quietly.
package bundle

import (
	"embed"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
)

//go:embed manifest.json modules/*.mjs
var files embed.FS

// Module is one bundled package.
type Module struct {
	// File is the path within the embedded filesystem.
	File string `json:"file"`
	// Bytes is its size, for reporting.
	Bytes int `json:"bytes"`
	// Refused, when set, is why this specifier is a stub that throws rather than
	// a real module — a native addon, or a capability this runtime reaches
	// through a seam instead.
	Refused string `json:"refused,omitempty"`
}

// Manifest describes what was bundled and where it came from.
type Manifest struct {
	Harness struct {
		Version string `json:"version"`
		Commit  string `json:"commit"`
	} `json:"harness"`
	Entries []string          `json:"entries"`
	Modules map[string]Module `json:"modules"`
}

// Bundle serves the harness's modules to a module resolver.
type Bundle struct {
	manifest Manifest

	mu     sync.RWMutex
	loaded map[string]string
}

// Namespace is the path prefix every bundled module is keyed under. It is a URL
// scheme rather than a directory because these modules are not on disk, and
// import.meta.url should say so rather than name a file that is not there.
const Namespace = "dsh:/"

var (
	once   sync.Once
	shared *Bundle
	loadErr error
)

// Load returns the embedded bundle. It is parsed once and shared: the manifest
// is read-only and the sources are served as strings.
func Load() (*Bundle, error) {
	once.Do(func() {
		raw, err := files.ReadFile("manifest.json")
		if err != nil {
			loadErr = fmt.Errorf("bundle: no manifest embedded (run tools/bundle/build.mjs): %w", err)
			return
		}
		b := &Bundle{loaded: map[string]string{}}
		if err := json.Unmarshal(raw, &b.manifest); err != nil {
			loadErr = fmt.Errorf("bundle: manifest: %w", err)
			return
		}
		shared = b
	})
	return shared, loadErr
}

// Version reports the harness version and commit the bundle was built from.
// Worth surfacing: dsh is a developer preview whose session format is still
// version zero, so "which commit is this" is a question support will ask.
func (b *Bundle) Version() (version, commit string) {
	return b.manifest.Harness.Version, b.manifest.Harness.Commit
}

// Entries lists the packages the bundle was built around — the v1 plugin set.
func (b *Bundle) Entries() []string {
	return append([]string(nil), b.manifest.Entries...)
}

// Specifiers lists every specifier the bundle can serve, including the refused
// stubs. Sorted by the manifest's own key order (JSON objects preserve nothing,
// so callers that need order should sort).
func (b *Bundle) Specifiers() []string {
	out := make([]string, 0, len(b.manifest.Modules))
	for spec := range b.manifest.Modules {
		out = append(out, spec)
	}
	return out
}

// Has reports whether a specifier is in the bundle.
func (b *Bundle) Has(specifier string) bool {
	_, ok := b.manifest.Modules[specifier]
	return ok
}

// Refused reports why a specifier is a stub, if it is one.
func (b *Bundle) Refused(specifier string) (string, bool) {
	m, ok := b.manifest.Modules[specifier]
	if !ok || m.Refused == "" {
		return "", false
	}
	return m.Refused, true
}

// Resolve serves a bundled module. It answers bare specifiers only: everything
// relative was inlined at bundle time, so a relative import from inside the
// bundle is a bug in the bundler rather than a module to look for.
//
// ok is false for anything it does not have, leaving the next resolver to
// answer — which is how node: builtins and the host's own modules get through.
func (b *Bundle) Resolve(specifier, referrer string) (source, path string, ok bool, err error) {
	if strings.HasPrefix(specifier, ".") || strings.HasPrefix(specifier, "/") {
		if strings.HasPrefix(referrer, Namespace) {
			return "", "", false, fmt.Errorf(
				"bundle: %q imported %q relatively, which the bundler should have inlined", referrer, specifier)
		}
		return "", "", false, nil
	}
	m, found := b.manifest.Modules[specifier]
	if !found {
		return "", "", false, nil
	}
	src, err := b.source(m.File)
	if err != nil {
		return "", "", false, err
	}
	return src, Namespace + m.File, true, nil
}

// source reads a module out of the embedded filesystem, caching it: the same
// module is asked for once per Runtime and a robot may run many.
func (b *Bundle) source(file string) (string, error) {
	b.mu.RLock()
	src, ok := b.loaded[file]
	b.mu.RUnlock()
	if ok {
		return src, nil
	}
	raw, err := files.ReadFile(file)
	if err != nil {
		return "", fmt.Errorf("bundle: %s: %w", file, err)
	}
	b.mu.Lock()
	b.loaded[file] = string(raw)
	b.mu.Unlock()
	return string(raw), nil
}
