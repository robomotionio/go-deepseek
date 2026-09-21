//go:build !windows

package nodecompat

import (
	"errors"
	"syscall"
)

// tryLock takes a non-blocking exclusive flock(2) on an open descriptor and
// reports the errno the way the native addon it stands in for does: 0 for
// taken, the positive errno otherwise (EWOULDBLOCK while another holder has it).
//
// Since harness 0.1.5 the JSONL session backend holds one of these on
// `session.lock` for as long as a session is open for writing, through
// @deepseek-ai/node-addon-system — a Node-API binary this runtime cannot load.
// The lock is the kernel's either way; only the caller changed.
func (c *Compat) tryLock(id int64) int {
	f, err := c.file(id)
	if err != nil {
		return int(syscall.EBADF)
	}
	err = syscall.Flock(int(f.Fd()), syscall.LOCK_EX|syscall.LOCK_NB)
	if err == nil {
		return 0
	}
	var errno syscall.Errno
	if errors.As(err, &errno) {
		return int(errno)
	}
	return int(syscall.EIO)
}

// errnoName is util.getSystemErrorName for this platform: the symbolic name
// of an errno, which is what a caller turns a native error into a `code` with.
func errnoName(errno int) string {
	if name, ok := errnoNames[syscall.Errno(errno)]; ok {
		return name
	}
	return ""
}

var errnoNames = map[syscall.Errno]string{
	syscall.EACCES:  "EACCES",
	syscall.EAGAIN:  "EAGAIN",
	syscall.EBADF:   "EBADF",
	syscall.EBUSY:   "EBUSY",
	syscall.EEXIST:  "EEXIST",
	syscall.EINTR:   "EINTR",
	syscall.EINVAL:  "EINVAL",
	syscall.EIO:     "EIO",
	syscall.EISDIR:  "EISDIR",
	syscall.ENOENT:  "ENOENT",
	syscall.ENOLCK:  "ENOLCK",
	syscall.ENOSPC:  "ENOSPC",
	syscall.ENOSYS:  "ENOSYS",
	syscall.ENOTDIR: "ENOTDIR",
	syscall.EPERM:   "EPERM",
	syscall.EROFS:   "EROFS",
}
