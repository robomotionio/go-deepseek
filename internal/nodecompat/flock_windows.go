//go:build windows

package nodecompat

// tryLock is POSIX-only. On Windows the session backend takes a named kernel
// semaphore instead, through koffi, and never reaches the flock addon: its
// loader refuses every platform but linux and darwin before asking for it.
func (c *Compat) tryLock(id int64) int {
	return 40 // ENOSYS, as Node spells it on Windows
}

// errnoName has no POSIX errno table to consult on Windows.
func errnoName(errno int) string {
	if errno == 40 {
		return "ENOSYS"
	}
	return ""
}
