package runtime

import (
	"context"
	"fmt"
	goruntime "runtime"
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

// koffi resolves to the runtime's own stand-in, not the bundle's refusing
// stub: loading a library and declaring a binding work in every spelling the
// harness uses, and a function nobody serves refuses at the call, by name.
// Off Windows every binding refuses, because the Win32 behind it is not there;
// the calls themselves are exercised only on a Windows machine.
func TestKoffiStandIn(t *testing.T) {
	dir := t.TempDir()
	eng, err := newEngine(Config{CWD: dir, Roots: []string{dir}, Env: map[string]string{"HOME": dir}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer eng.close()
	src := `
		const koffi = (await import('koffi')).default;
		const kernel32 = koffi.load('kernel32.dll');
		const advapi32 = koffi.load('advapi32.dll');
		const bound = [
			kernel32.func('__stdcall', 'MoveFileExW', 'int', ['str16', 'str16', 'uint']),
			kernel32.func('uint32_t __stdcall GetLastError()'),
			advapi32.func('int __stdcall SetFileSecurityW(const char16_t *path, uint32_t information, const void *descriptor)'),
			koffi.load('user32.dll').func('__stdcall', 'MessageBoxW', 'int', []),
		];
		const outcomes = bound.map((fn) => {
			try { fn('a', 'b', 0); return 'ran'; } catch (error) { return error.code ?? error.message; }
		});
		globalThis.result = [typeof koffi.load, bound.every((fn) => typeof fn === 'function'), ...outcomes].join(',');
	`
	if _, err := eng.rt.RunModule("probe.mjs", src); err != nil {
		t.Fatalf("%v", withStack(err))
	}
	if err := eng.rt.RunLoop(context.Background()); err != nil {
		t.Fatal(err)
	}
	value, err := eng.rt.Get("result")
	if err != nil {
		t.Fatal(err)
	}
	got := value.String()
	want := "function,true,ERR_NOT_AVAILABLE,ERR_NOT_AVAILABLE,ERR_NOT_AVAILABLE,ERR_NOT_AVAILABLE"
	if goruntime.GOOS == "windows" {
		t.Logf("on Windows: %s", got)
		return
	}
	if got != want {
		t.Fatalf("koffi stand-in: got %q, want %q", got, want)
	}
}
