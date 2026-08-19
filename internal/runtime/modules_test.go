package runtime

import (
	"context"
	"fmt"
	"sort"
	"testing"

	"github.com/robomotionio/go-deepseek/internal/bundle"
)

// Every bundled module has to evaluate on its own. It is a cheap test and it has
// caught everything: a missing node: export, a CommonJS require the bundler left
// dynamic, a language feature the engine got wrong. A failure here names the
// module, which a failure during a plugin mount does not.
func TestEveryModuleEvaluates(t *testing.T) {
	b, err := bundle.Load()
	if err != nil {
		t.Fatal(err)
	}
	specs := b.Specifiers()
	sort.Strings(specs)
	dir := t.TempDir()
	for _, spec := range specs {
		if _, refused := b.Refused(spec); refused {
			continue // a stub that throws on use is supposed to throw
		}
		t.Run(spec, func(t *testing.T) {
			eng, err := newEngine(Config{CWD: dir, Roots: []string{dir}, Env: map[string]string{"HOME": dir}}, nil)
			if err != nil {
				t.Fatal(err)
			}
			defer eng.close()
			src := fmt.Sprintf("import * as m from %q; globalThis.exported = Object.keys(m).length;", spec)
			if _, err := eng.rt.RunModule("probe.mjs", src); err != nil {
				t.Fatalf("%v", withStack(err))
			}
			if err := eng.rt.RunLoop(context.Background()); err != nil {
				t.Fatal(err)
			}
		})
	}
}
