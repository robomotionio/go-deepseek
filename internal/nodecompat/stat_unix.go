//go:build !windows

package nodecompat

import (
	"io/fs"
	"syscall"
)

// statFields fills in the ownership and inode fields, which only exist on a
// real syscall stat. Code that reads them is usually deciding whether two
// paths are the same file.
func statFields(info fs.FileInfo, m map[string]any) {
	sys, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return
	}
	m["uid"] = sys.Uid
	m["gid"] = sys.Gid
	m["ino"] = uint64(sys.Ino)
	m["dev"] = uint64(sys.Dev)
	m["nlink"] = uint64(sys.Nlink)
}
