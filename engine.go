package deepseek

// The runtime assembly: an engine, a Node surface, and the harness, wired into
// one Runtime with a module resolver that knows which is which.
//
// Resolution order is the whole of the interesting design here, and it is:
//
//  1. the bundle — a package the harness ships wins, including one whose name
//     collides with a Node builtin (`events` and `assert` both exist on npm);
//  2. node: builtins, whether spelled `node:fs` or `fs`;
//  3. the host's own resolver, if it supplied one, for user-authored plugins;
//  4. nothing, which is a load failure naming the specifier.
//
// A Runtime is single-goroutine, so everything here happens on the goroutine
// that owns it. See harness.go for how that is arranged.

import (
	"fmt"
	"strings"

	"github.com/robomotionio/go-deepseek/bundle"
	"github.com/robomotionio/go-deepseek/nodecompat"
	"github.com/robomotionio/goant"
)

// engine is a Runtime with everything installed, plus what it owns.
type engine struct {
	rt     *goant.Runtime
	compat *nodecompat.Compat
	bundle *bundle.Bundle

	// extra is the host's own resolver, consulted after the bundle and the
	// builtins. It is where a user-authored plugin comes from.
	extra Resolver
}

// Resolver is a host's module resolution, for modules that are neither the
// harness nor Node: a plugin the user wrote, compiled somewhere the host knows
// about. Return ok false for anything it does not have.
type Resolver func(specifier, referrer string) (source, path string, ok bool, err error)

// newEngine builds the Runtime. It does NOT run anything: the caller decides
// when, and on which goroutine.
func newEngine(cfg Config, extra Resolver) (*engine, error) {
	b, err := bundle.Load()
	if err != nil {
		return nil, err
	}
	e := &engine{bundle: b, extra: extra}

	rt := goant.New(
		// The wall clock, because a retry backoff that retries instantly is not
		// a backoff and an idle timeout that never elapses is not a timeout.
		goant.WithRealTimers(true),
		// Off by default in goant; worth having here because an agent turn runs
		// the same parsing and formatting code thousands of times.
		goant.WithJIT(true),
		goant.WithMemoryLimit(cfg.MemoryLimit),
		goant.WithModuleResolver(e.resolve),
	)
	e.rt = rt

	version, commit := b.Version()
	compat, err := nodecompat.Install(rt, nodecompat.Options{
		CWD:      cfg.CWD,
		Env:      cfg.Env,
		Roots:    cfg.Roots,
		Argv:     []string{"node", "dsh"},
		Stdout:   cfg.Stdout,
		Stderr:   cfg.Stderr,
		Platform:    cfg.Platform,
		TraceTimers: cfg.TraceTimers,
		TraceHTTP:   cfg.TraceHTTP,
		// Every bundled package reads its own version out of a package.json
		// beside it — `createRequire(import.meta.url)('../package.json')`, which
		// tsdown puts in each one. A bundled module has no directory, so this
		// serves the one file they are all reaching for.
		Virtual: map[string]string{
			bundle.Namespace + "package.json": fmt.Sprintf(
				`{"name":"@deepseek-ai/dsh","version":%q,"commit":%q,"type":"module"}`, version, commit),
		},
	})
	if err != nil {
		rt.Close()
		return nil, err
	}
	e.compat = compat
	return e, nil
}

// resolve is the module resolver the engine installs. See the file comment for
// the order and why it is that order.
func (e *engine) resolve(specifier, referrer string) (source, path string, err error) {
	if src, p, ok, err := e.bundle.Resolve(specifier, referrer); err != nil {
		return "", "", err
	} else if ok {
		return src, p, nil
	}
	if src, p, ok, err := e.compat.Resolve(specifier, referrer); err != nil {
		return "", "", err
	} else if ok {
		return src, p, nil
	}
	if e.extra != nil {
		if src, p, ok, err := e.extra(specifier, referrer); err != nil {
			return "", "", err
		} else if ok {
			return src, p, nil
		}
	}
	return "", "", fmt.Errorf("%s (imported from %s)", describeMissing(specifier), describeReferrer(referrer))
}

// describeMissing says what kind of failure this is, because the three kinds
// send whoever reads the message to three different places.
func describeMissing(specifier string) string {
	switch {
	case strings.HasPrefix(specifier, "node:"):
		return fmt.Sprintf("%q is not implemented by this runtime", specifier)
	case strings.HasPrefix(specifier, "@deepseek-ai/"):
		return fmt.Sprintf("%q is not in the bundle — add it to the entry list in tools/bundle/build.mjs and regenerate", specifier)
	case strings.HasPrefix(specifier, ".") || strings.HasPrefix(specifier, "/"):
		return fmt.Sprintf("relative import %q has no file behind it", specifier)
	default:
		return fmt.Sprintf("%q is not bundled and no host resolver claimed it", specifier)
	}
}

func describeReferrer(referrer string) string {
	if referrer == "" {
		return "the entry point"
	}
	return referrer
}

// close releases the Runtime and everything the compatibility layer holds.
func (e *engine) close() {
	if e == nil {
		return
	}
	if e.compat != nil {
		e.compat.Close()
	}
	if e.rt != nil {
		e.rt.Close()
	}
}
