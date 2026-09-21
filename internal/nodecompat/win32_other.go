//go:build !windows

package nodecompat

import (
	"fmt"
	"runtime"
)

// win32Bindings exists everywhere so the koffi stand-in can ask; off Windows
// every call says why it cannot answer. Nothing reaches them here: both
// callers branch on process.platform === 'win32' first.
func (c *Compat) win32Bindings() map[string]any {
	refuse := func(name string) func() error {
		return func() error { return fmt.Errorf("%s: Win32 is not available on %s", name, runtime.GOOS) }
	}
	out := map[string]any{"available": func() bool { return false }}
	for _, name := range []string{"getLastError", "moveFileExW", "replaceFileW", "createSemaphoreW",
		"waitForSingleObject", "releaseSemaphore", "closeHandle", "getFileSecurityW", "setFileSecurityW"} {
		out[name] = refuse(name)
	}
	return out
}
