package nodecompat

// The filesystem bindings.
//
// These are synchronous, and that is a decision rather than an oversight. Node's
// fs has three faces — callback, sync, promise — and the code that runs here
// uses the sync one heavily: existsSync, readFileSync, statSync, mkdtempSync. A
// shim cannot synchronously await a promise, so an async-only binding would
// leave every one of those unimplementable, and the promise face is trivially
// built on a sync one while the reverse is impossible.
//
// What it costs is the loop being blocked for the length of a local file
// operation. That is microseconds for the reads an agent actually does, and the
// alternative — an engine that cannot answer existsSync — is not a trade.
// Anything genuinely slow (HTTP) is asynchronous; see fetch.go.

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
	"time"
)

// fsBindings is the host object's fs half.
func (c *Compat) fsBindings() map[string]any {
	return map[string]any{
		"readFile":   c.fsReadFile,
		"writeFile":  c.fsWriteFile,
		"appendFile": c.fsAppendFile,
		"readdir":    c.fsReaddir,
		"stat":       c.fsStat,
		"exists":     c.fsExists,
		"mkdir":      c.fsMkdir,
		"rm":         c.fsRm,
		"rename":     c.fsRename,
		"copyFile":   c.fsCopyFile,
		"cp":         c.fsCopyTree,
		"realpath":   c.fsRealpath,
		"readlink":   c.fsReadlink,
		"symlink":    c.fsSymlink,
		"link":       c.fsLink,
		"chmod":      c.fsChmod,
		"utimes":     c.fsUtimes,
		"access":     c.fsAccess,
		"truncate":   c.fsTruncate,
		"mkdtemp":    c.fsMkdtemp,
		"open":       c.fsOpen,
		"close":      c.fsClose,
		"read":       c.fsRead,
		"write":      c.fsWriteFD,
		"fsync":      c.fsSync,
		"fstat":      c.fsFstat,
		"fchmod":     c.fsFchmod,
		"ftruncate":  c.fsFtruncate,
	}
}

func (c *Compat) fsReadFile(path string) ([]byte, error) {
	if content, ok := c.virtual(path); ok {
		return []byte(content), nil
	}
	p, err := c.resolvePath(path)
	if err != nil {
		return nil, err
	}
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, fsError(err, "open", path)
	}
	return b, nil
}

func (c *Compat) fsWriteFile(path string, data []byte, mode int) error {
	return c.write(path, data, false, mode)
}

func (c *Compat) fsAppendFile(path string, data []byte, mode int) error {
	return c.write(path, data, true, mode)
}

func (c *Compat) write(path string, data []byte, appendTo bool, mode int) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	perm := os.FileMode(0o644)
	if mode > 0 {
		perm = os.FileMode(mode)
	}
	flags := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	if appendTo {
		flags = os.O_WRONLY | os.O_CREATE | os.O_APPEND
	}
	f, err := os.OpenFile(p, flags, perm)
	if err != nil {
		return fsError(err, "open", path)
	}
	defer f.Close()
	if _, err := f.Write(data); err != nil {
		return fsError(err, "write", path)
	}
	return nil
}

func (c *Compat) fsReaddir(path string, withTypes bool) (any, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(p)
	if err != nil {
		return nil, fsError(err, "scandir", path)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	if !withTypes {
		names := make([]string, len(entries))
		for i, e := range entries {
			names[i] = e.Name()
		}
		return names, nil
	}
	out := make([]map[string]any, len(entries))
	for i, e := range entries {
		out[i] = map[string]any{
			"name":        e.Name(),
			"isDirectory": e.IsDir(),
			"isFile":      e.Type().IsRegular(),
			"isSymlink":   e.Type()&fs.ModeSymlink != 0,
		}
	}
	return out, nil
}

func (c *Compat) fsStat(path string, follow bool) (map[string]any, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return nil, err
	}
	var info os.FileInfo
	if follow {
		info, err = os.Stat(p)
	} else {
		info, err = os.Lstat(p)
	}
	if err != nil {
		return nil, fsError(err, "stat", path)
	}
	return statObject(info), nil
}

// fsExists answers without throwing, because existsSync's whole contract is
// that it does not.
func (c *Compat) fsExists(path string) bool {
	if _, ok := c.virtual(path); ok {
		return true
	}
	p, err := c.resolvePath(path)
	if err != nil {
		return false
	}
	_, err = os.Stat(p)
	return err == nil
}

// virtual looks a path up in the host-supplied overlay, after normalising the
// `..` segments a caller may have built it from.
func (c *Compat) virtual(path string) (string, bool) {
	if len(c.opts.Virtual) == 0 {
		return "", false
	}
	if content, ok := c.opts.Virtual[path]; ok {
		return content, true
	}
	content, ok := c.opts.Virtual[normaliseVirtual(path)]
	return content, ok
}

// normaliseVirtual resolves `.` and `..` without touching the filesystem, so
// that "dsh:/modules/../package.json" and "dsh:/package.json" are one key. The
// path package would mangle the scheme, which is why this is by hand.
func normaliseVirtual(p string) string {
	scheme := ""
	if i := strings.Index(p, ":/"); i > 1 {
		scheme, p = p[:i+2], p[i+2:]
	}
	var out []string
	for _, part := range strings.Split(p, "/") {
		switch part {
		case "", ".":
		case "..":
			if len(out) > 0 {
				out = out[:len(out)-1]
			}
		default:
			out = append(out, part)
		}
	}
	return scheme + strings.Join(out, "/")
}

// statObject is the shape the shim turns into a Stats instance. Times are
// milliseconds since the epoch, which is what Node's *Ms fields are.
func statObject(info os.FileInfo) map[string]any {
	ms := float64(info.ModTime().UnixNano()) / 1e6
	m := map[string]any{
		"size":        info.Size(),
		"mode":        uint32(info.Mode().Perm()),
		"mtimeMs":     ms,
		"atimeMs":     ms,
		"ctimeMs":     ms,
		"birthtimeMs": ms,
		"isFile":      info.Mode().IsRegular(),
		"isDirectory": info.IsDir(),
		"isSymlink":   info.Mode()&fs.ModeSymlink != 0,
		"uid":         0,
		"gid":         0,
		"ino":         0,
		"dev":         0,
		"nlink":       1,
	}
	// The ownership and inode fields only exist on a real syscall stat. Code
	// that reads them is usually deciding whether two paths are the same file.
	statFields(info, m)
	return m
}

func (c *Compat) fsMkdir(path string, recursive bool, mode int) (string, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return "", err
	}
	perm := os.FileMode(0o755)
	if mode > 0 {
		perm = os.FileMode(mode)
	}
	if recursive {
		if err := os.MkdirAll(p, perm); err != nil {
			return "", fsError(err, "mkdir", path)
		}
		return p, nil
	}
	if err := os.Mkdir(p, perm); err != nil {
		return "", fsError(err, "mkdir", path)
	}
	return p, nil
}

func (c *Compat) fsRm(path string, recursive, force bool) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if recursive {
		err = os.RemoveAll(p)
	} else {
		err = os.Remove(p)
	}
	if err != nil {
		if force && errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return fsError(err, "unlink", path)
	}
	return nil
}

func (c *Compat) fsRename(from, to string) error {
	src, err := c.resolvePath(from)
	if err != nil {
		return err
	}
	dst, err := c.resolvePath(to)
	if err != nil {
		return err
	}
	if err := os.Rename(src, dst); err != nil {
		if !errors.Is(err, syscall.EXDEV) {
			return fsError(err, "rename", from)
		}
		// Across filesystems a rename is a copy and a delete. This happens for
		// real whenever a workspace and a temp dir are on different mounts,
		// which is the normal shape of a container.
		if err := copyFile(src, dst); err != nil {
			return fsError(err, "rename", from)
		}
		if err := os.Remove(src); err != nil {
			return fsError(err, "rename", from)
		}
	}
	return nil
}

func (c *Compat) fsCopyFile(from, to string) error {
	src, err := c.resolvePath(from)
	if err != nil {
		return err
	}
	dst, err := c.resolvePath(to)
	if err != nil {
		return err
	}
	if err := copyFile(src, dst); err != nil {
		return fsError(err, "copyfile", from)
	}
	return nil
}

// fsCopyTree is fs.cp with recursive: a directory and everything under it.
func (c *Compat) fsCopyTree(from, to string, recursive bool) error {
	src, err := c.resolvePath(from)
	if err != nil {
		return err
	}
	dst, err := c.resolvePath(to)
	if err != nil {
		return err
	}
	info, err := os.Stat(src)
	if err != nil {
		return fsError(err, "cp", from)
	}
	if !info.IsDir() {
		return copyFile(src, dst)
	}
	if !recursive {
		return fmt.Errorf("ERR_FS_EISDIR: recursive option not enabled, cp '%s'", from)
	}
	return filepath.WalkDir(src, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, p)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if d.Type()&fs.ModeSymlink != 0 {
			link, err := os.Readlink(p)
			if err != nil {
				return err
			}
			os.Remove(target)
			return os.Symlink(link, target)
		}
		return copyFile(p, target)
	})
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	info, err := in.Stat()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, info.Mode().Perm())
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func (c *Compat) fsRealpath(path string) (string, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return "", err
	}
	r, err := filepath.EvalSymlinks(p)
	if err != nil {
		return "", fsError(err, "realpath", path)
	}
	return r, nil
}

func (c *Compat) fsReadlink(path string) (string, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return "", err
	}
	r, err := os.Readlink(p)
	if err != nil {
		return "", fsError(err, "readlink", path)
	}
	return r, nil
}

func (c *Compat) fsSymlink(target, path string) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if err := os.Symlink(target, p); err != nil {
		return fsError(err, "symlink", path)
	}
	return nil
}

func (c *Compat) fsLink(existing, path string) error {
	src, err := c.resolvePath(existing)
	if err != nil {
		return err
	}
	dst, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if err := os.Link(src, dst); err != nil {
		return fsError(err, "link", path)
	}
	return nil
}

func (c *Compat) fsChmod(path string, mode int) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if err := os.Chmod(p, os.FileMode(mode)); err != nil {
		return fsError(err, "chmod", path)
	}
	return nil
}

func (c *Compat) fsUtimes(path string, atimeMs, mtimeMs float64) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if err := os.Chtimes(p, time.UnixMilli(int64(atimeMs)), time.UnixMilli(int64(mtimeMs))); err != nil {
		return fsError(err, "utimes", path)
	}
	return nil
}

// fsAccess checks for existence and, when asked, for writability. Node's mode
// bits are a bitmask; only the write bit changes the answer in practice, and
// the execute bit is not portable enough to be worth pretending about.
func (c *Compat) fsAccess(path string, write bool) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	info, err := os.Stat(p)
	if err != nil {
		return fsError(err, "access", path)
	}
	if write && info.Mode().Perm()&0o200 == 0 {
		return fmt.Errorf("EACCES: permission denied, access '%s'", path)
	}
	return nil
}

func (c *Compat) fsTruncate(path string, size int64) error {
	p, err := c.resolvePath(path)
	if err != nil {
		return err
	}
	if err := os.Truncate(p, size); err != nil {
		return fsError(err, "truncate", path)
	}
	return nil
}

func (c *Compat) fsMkdtemp(prefix string) (string, error) {
	p, err := c.resolvePath(filepath.Dir(prefix))
	if err != nil {
		return "", err
	}
	out, err := os.MkdirTemp(p, filepath.Base(prefix))
	if err != nil {
		return "", fsError(err, "mkdtemp", prefix)
	}
	return out, nil
}

// --- descriptors -------------------------------------------------------------
//
// An open file is host state a script holds a number for, which is what a file
// descriptor already is. Keeping them in a map rather than handing out real fds
// means a script cannot reach a descriptor it was never given, and Close can
// reclaim the ones it forgot.

func (c *Compat) fsOpen(path, flags string, mode int) (int64, error) {
	p, err := c.resolvePath(path)
	if err != nil {
		return 0, err
	}
	perm := os.FileMode(0o644)
	if mode > 0 {
		perm = os.FileMode(mode)
	}
	f, err := os.OpenFile(p, openFlags(flags), perm)
	if err != nil {
		return 0, fsError(err, "open", path)
	}
	id := c.id()
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		f.Close()
		return 0, fmt.Errorf("nodecompat: runtime is closed")
	}
	c.files[id] = f
	c.mu.Unlock()
	return id, nil
}

// openFlags maps Node's flag strings onto the os package's constants.
func openFlags(flags string) int {
	switch flags {
	case "", "r":
		return os.O_RDONLY
	case "r+":
		return os.O_RDWR
	case "w":
		return os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	case "w+":
		return os.O_RDWR | os.O_CREATE | os.O_TRUNC
	case "a":
		return os.O_WRONLY | os.O_CREATE | os.O_APPEND
	case "a+":
		return os.O_RDWR | os.O_CREATE | os.O_APPEND
	case "wx", "xw":
		return os.O_WRONLY | os.O_CREATE | os.O_EXCL
	case "wx+", "xw+":
		return os.O_RDWR | os.O_CREATE | os.O_EXCL
	case "ax", "xa":
		return os.O_WRONLY | os.O_CREATE | os.O_APPEND | os.O_EXCL
	}
	return os.O_RDONLY
}

func (c *Compat) file(id int64) (*os.File, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	f, ok := c.files[id]
	if !ok {
		return nil, fmt.Errorf("EBADF: bad file descriptor")
	}
	return f, nil
}

func (c *Compat) fsClose(id int64) error {
	c.mu.Lock()
	f, ok := c.files[id]
	delete(c.files, id)
	c.mu.Unlock()
	if !ok {
		return fmt.Errorf("EBADF: bad file descriptor")
	}
	return f.Close()
}

// fsRead returns what it read rather than filling a caller's buffer: crossing
// the boundary with a mutable view and a length would mean the script and Go
// both owning the same bytes, and the shim can copy into the caller's buffer on
// its own side.
func (c *Compat) fsRead(id int64, length int, offset float64) ([]byte, error) {
	f, err := c.file(id)
	if err != nil {
		return nil, err
	}
	if length < 0 {
		return nil, fmt.Errorf("ERR_OUT_OF_RANGE: length is out of range")
	}
	buf := make([]byte, length)
	var n int
	if offset >= 0 {
		n, err = f.ReadAt(buf, int64(offset))
	} else {
		n, err = f.Read(buf)
	}
	if err != nil && !errors.Is(err, io.EOF) {
		return nil, err
	}
	return buf[:n], nil
}

func (c *Compat) fsWriteFD(id int64, data []byte, offset float64) (int, error) {
	f, err := c.file(id)
	if err != nil {
		return 0, err
	}
	if offset >= 0 {
		return f.WriteAt(data, int64(offset))
	}
	return f.Write(data)
}

func (c *Compat) fsSync(id int64) error {
	f, err := c.file(id)
	if err != nil {
		return err
	}
	return f.Sync()
}

// fchmod and ftruncate operate on a descriptor the script already holds. They
// exist because the atomic-write dance does: write to a staging file, set its
// mode through the OPEN handle, sync, then link it into place. Without them the
// handle's chmod is undefined, and every write fails with "undefined is not a
// function" — which is exactly what the agent reported.
func (c *Compat) fsFchmod(id int64, mode int) error {
	f, err := c.file(id)
	if err != nil {
		return err
	}
	return f.Chmod(os.FileMode(mode))
}

func (c *Compat) fsFtruncate(id int64, size int64) error {
	f, err := c.file(id)
	if err != nil {
		return err
	}
	return f.Truncate(size)
}

func (c *Compat) fsFstat(id int64) (map[string]any, error) {
	f, err := c.file(id)
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	return statObject(info), nil
}

// fsError renders a Go error the way Node renders one, because code in the wild
// branches on `err.code === 'ENOENT'` far more often than it reads the message.
// The shim reads the code back off the front.
func fsError(err error, op, path string) error {
	code := "EIO"
	switch {
	case errors.Is(err, os.ErrNotExist):
		code = "ENOENT"
	case errors.Is(err, os.ErrExist):
		code = "EEXIST"
	case errors.Is(err, os.ErrPermission):
		code = "EACCES"
	case errors.Is(err, syscall.ENOTDIR):
		code = "ENOTDIR"
	case errors.Is(err, syscall.EISDIR):
		code = "EISDIR"
	case errors.Is(err, syscall.ENOTEMPTY):
		code = "ENOTEMPTY"
	case errors.Is(err, syscall.EXDEV):
		code = "EXDEV"
	}
	return fmt.Errorf("%s: %s, %s '%s'", code, errText(err), op, path)
}

func errText(err error) string {
	var pe *os.PathError
	if errors.As(err, &pe) {
		return pe.Err.Error()
	}
	var le *os.LinkError
	if errors.As(err, &le) {
		return le.Err.Error()
	}
	return err.Error()
}
