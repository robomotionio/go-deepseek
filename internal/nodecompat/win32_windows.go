//go:build windows

package nodecompat

// The Win32 calls the harness makes through koffi, made from Go.
//
// koffi is native FFI and cannot load here (see the bundle's refused list).
// Two bundled packages reach kernel32 and advapi32 through it on Windows, and
// neither has another path: the JSONL session backend publishes files with
// MoveFileExW and takes its write lock as a named semaphore, and the local
// filesystem provider replaces a file atomically with ReplaceFileW, carrying
// its ACL across with Get/SetFileSecurityW. The runtime's `koffi` stand-in
// (internal/runtime/js/koffi.js) resolves those nine functions by name and
// calls these.
//
// GetLastError is the one that cannot simply be called: Go's runtime makes its
// own system calls between two JavaScript calls, so the thread's last error is
// long gone by the time the script asks. Each call below records its own, and
// GetLastError answers the most recent.

import (
	"syscall"
	"unsafe"
)

var (
	modKernel32 = syscall.NewLazyDLL("kernel32.dll")
	modAdvapi32 = syscall.NewLazyDLL("advapi32.dll")

	procMoveFileExW         = modKernel32.NewProc("MoveFileExW")
	procReplaceFileW        = modKernel32.NewProc("ReplaceFileW")
	procCreateSemaphoreW    = modKernel32.NewProc("CreateSemaphoreW")
	procWaitForSingleObject = modKernel32.NewProc("WaitForSingleObject")
	procReleaseSemaphore    = modKernel32.NewProc("ReleaseSemaphore")
	procCloseHandle         = modKernel32.NewProc("CloseHandle")
	procGetFileSecurityW    = modAdvapi32.NewProc("GetFileSecurityW")
	procSetFileSecurityW    = modAdvapi32.NewProc("SetFileSecurityW")
)

func (c *Compat) win32Bindings() map[string]any {
	call := func(proc *syscall.LazyProc, args ...uintptr) uintptr {
		r, _, err := proc.Call(args...)
		code := uint32(0)
		if errno, ok := err.(syscall.Errno); ok {
			code = uint32(errno)
		}
		c.mu.Lock()
		c.win32LastError = code
		c.mu.Unlock()
		return r
	}
	wide := func(s string) (*uint16, error) { return syscall.UTF16PtrFromString(s) }
	return map[string]any{
		"available": func() bool { return true },
		"getLastError": func() uint32 {
			c.mu.Lock()
			defer c.mu.Unlock()
			return c.win32LastError
		},
		"moveFileExW": func(existing, replacement string, flags uint32) (int64, error) {
			from, err := wide(existing)
			if err != nil {
				return 0, err
			}
			to, err := wide(replacement)
			if err != nil {
				return 0, err
			}
			return int64(call(procMoveFileExW, uintptr(unsafe.Pointer(from)), uintptr(unsafe.Pointer(to)), uintptr(flags))), nil
		},
		"replaceFileW": func(replaced, replacement string, flags uint32) (int64, error) {
			target, err := wide(replaced)
			if err != nil {
				return 0, err
			}
			source, err := wide(replacement)
			if err != nil {
				return 0, err
			}
			return int64(call(procReplaceFileW, uintptr(unsafe.Pointer(target)), uintptr(unsafe.Pointer(source)), 0, uintptr(flags), 0, 0)), nil
		},
		"createSemaphoreW": func(initial, maximum int32, name string) (int64, error) {
			n, err := wide(name)
			if err != nil {
				return 0, err
			}
			return int64(call(procCreateSemaphoreW, 0, uintptr(initial), uintptr(maximum), uintptr(unsafe.Pointer(n)))), nil
		},
		"waitForSingleObject": func(handle int64, milliseconds uint32) uint32 {
			return uint32(call(procWaitForSingleObject, uintptr(handle), uintptr(milliseconds)))
		},
		"releaseSemaphore": func(handle int64, count int32) int64 {
			return int64(call(procReleaseSemaphore, uintptr(handle), uintptr(count), 0))
		},
		"closeHandle": func(handle int64) int64 {
			return int64(call(procCloseHandle, uintptr(handle)))
		},
		// The descriptor is returned rather than written into the caller's
		// buffer, like fs.read: the shim copies it on its own side.
		"getFileSecurityW": func(path string, information uint32, length uint32) (map[string]any, error) {
			p, err := wide(path)
			if err != nil {
				return nil, err
			}
			var needed uint32
			var buf []byte
			var ptr uintptr
			if length > 0 {
				buf = make([]byte, length)
				ptr = uintptr(unsafe.Pointer(&buf[0]))
			}
			ok := call(procGetFileSecurityW, uintptr(unsafe.Pointer(p)), uintptr(information), ptr, uintptr(length), uintptr(unsafe.Pointer(&needed)))
			return map[string]any{"ok": int64(ok), "needed": needed, "descriptor": buf}, nil
		},
		"setFileSecurityW": func(path string, information uint32, descriptor []byte) (int64, error) {
			p, err := wide(path)
			if err != nil {
				return 0, err
			}
			var ptr uintptr
			if len(descriptor) > 0 {
				ptr = uintptr(unsafe.Pointer(&descriptor[0]))
			}
			return int64(call(procSetFileSecurityW, uintptr(unsafe.Pointer(p)), uintptr(information), ptr)), nil
		},
	}
}
