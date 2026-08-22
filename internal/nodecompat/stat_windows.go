package nodecompat

import "io/fs"

// statFields is a no-op on Windows, which has no syscall.Stat_t: FileInfo.Sys
// answers with a *syscall.Win32FileAttributeData, which carries none of these
// fields. The caller has already seeded them with zeros, and leaving them there
// is both honest and safe for what the harness actually does with them.
//
// Both consumers build a REVISION TOKEN for one path rather than comparing two
// files for identity:
//
//	fs-local:              FsVersion(`${dev}:${ino}:${size}:${mtimeNs}:${ctimeNs}`)
//	session-persistence:   fileRevision([dev, ino, size, mtimeNs, ctimeNs])
//
// Those still change whenever the file does, through size and the nanosecond
// timestamps, so change detection keeps working with the two leading fields
// pinned at zero. The one thing it cannot notice is a file replaced by another
// of exactly the same size with identical mtime and ctime to the nanosecond.
//
// uid and gid staying zero matches what Node itself reports on Windows.
//
// Real values would mean GetFileInformationByHandle through
// golang.org/x/sys/windows — a new dependency and a platform-specific syscall
// path — to sharpen a token that already discriminates. Deliberately not done.
func statFields(_ fs.FileInfo, _ map[string]any) {}
