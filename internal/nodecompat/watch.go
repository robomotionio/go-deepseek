package nodecompat

// The filesystem watcher.
//
// fs.watch is the one binding here that is neither pure computation nor a
// single blocking syscall: it is a long-lived host resource that produces
// events nobody asked for yet. That is why it was refused for a while, and the
// refusal cost more than it saved — chokidar is what every skill catalogue in
// the harness discovers files with, chokidar needs fs.watch, and a skill
// provider that cannot finish discovery suppresses the whole catalogue rather
// than degrading.
//
// The shape that makes it fit the rest of this package is a POLL ON AN UNREF'D
// TIMER, and the reason is the one thing a watcher must never do here: hold the
// event loop open. The obvious design — a promise per batch, as fetch.go does
// for body chunks — was written first and does exactly that. An in-flight host
// operation is work the loop waits for, so one watcher nobody closed parks
// RunModule forever; the test that proves it is TestWatchClosedByRuntime.
//
// So nothing blocks. Events are buffered in Go as they arrive and the shim
// collects them from ONE unref'd interval shared by every watcher, whatever
// their number. An unref'd timer fires while the loop is alive for other
// reasons and never keeps it alive by itself, which gives exactly the semantics
// an embedded runtime wants: events are delivered promptly during a turn, and
// between turns the loop drains and the buffer simply waits.
//
// The backend is fsnotify — inotify on Linux, ReadDirectoryChangesW on Windows,
// kqueue on the BSDs and macOS. No cgo, and every platform this runtime
// cross-compiles to is one it supports.

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/fsnotify/fsnotify"
)

// watchEventBufferLimit caps the events one watcher holds for a reader that has
// stopped asking. A watcher whose consumer has stalled is not a reason to grow
// without bound; the overflow is reported as a lost-events marker so the script
// can rescan rather than quietly believing it saw everything.
const watchEventBufferLimit = 4096

// watchEvent is one Node fs.watch event: its type and the filename it concerns,
// relative to the watched path.
type watchEvent struct {
	Type     string `json:"eventType"`
	Filename string `json:"filename"`
}

// watcher is one live fs.watch. Its goroutine translates fsnotify events into
// Node ones and parks them until the script asks; every field below the mutex
// is shared with that goroutine.
type watcher struct {
	fsw       *fsnotify.Watcher
	root      string
	dir       bool
	recursive bool

	mu      sync.Mutex
	pending []watchEvent
	err     error
	closed  bool
	// reported records that the shim has already been told this watcher ended,
	// so the end is delivered once rather than on every poll from then on.
	reported bool
}

// watchBindings is the host object's watcher half.
func (c *Compat) watchBindings() map[string]any {
	return map[string]any{
		"start": c.watchStart,
		"poll":  c.watchPoll,
		"close": c.watchClose,
	}
}

// watchStart begins watching a path and returns the handle a script names it
// by. A directory watch reports its children; recursive adds every directory
// beneath it, and keeps adding them as they appear, which is what makes
// recursive mean the same thing on Linux as it does on the platforms whose
// kernels implement it.
func (c *Compat) watchStart(path string, recursive bool) (int64, error) {
	resolved, err := c.resolvePath(path)
	if err != nil {
		return 0, err
	}
	info, err := os.Stat(resolved)
	if err != nil {
		return 0, err
	}

	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return 0, err
	}

	w := &watcher{
		fsw:       fsw,
		root:      resolved,
		dir:       info.IsDir(),
		recursive: recursive && info.IsDir(),
	}

	if w.recursive {
		err = w.addTree(resolved)
	} else {
		err = fsw.Add(resolved)
	}
	if err != nil {
		fsw.Close()
		return 0, err
	}

	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		fsw.Close()
		return 0, errors.New("nodecompat: runtime is closed")
	}
	if c.watchers == nil {
		c.watchers = make(map[int64]*watcher)
	}
	c.nextID++
	id := c.nextID
	c.watchers[id] = w
	c.mu.Unlock()

	go w.pump()
	return id, nil
}

// watchPoll collects what every watcher has seen since the last poll. It never
// blocks and never waits — a poll with nothing to report answers with an empty
// list, which is the common case and has to be cheap.
//
// One call for all watchers rather than one per watcher, because chokidar opens
// a watch per directory and a tree of any size would otherwise mean a timer
// each. The answer names them: [{id, events, error, ended}], and only the ones
// with something to say appear in it.
func (c *Compat) watchPoll() []map[string]any {
	c.mu.Lock()
	ids := make([]int64, 0, len(c.watchers))
	for id := range c.watchers {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	watchers := make([]*watcher, len(ids))
	for i, id := range ids {
		watchers[i] = c.watchers[id]
	}
	c.mu.Unlock()

	var out []map[string]any
	var ended []int64
	for i, w := range watchers {
		report, done := w.drain()
		if report != nil {
			report["id"] = ids[i]
			out = append(out, report)
		}
		if done {
			ended = append(ended, ids[i])
		}
	}

	// A watcher that has reported its end is no longer anyone's to poll. It is
	// dropped here rather than in drain so that the map is touched once, under
	// one lock, however many ended at the same time.
	if len(ended) > 0 {
		c.mu.Lock()
		for _, id := range ended {
			delete(c.watchers, id)
		}
		c.mu.Unlock()
	}
	return out
}

// drain takes this watcher's news, and says whether that news was its last.
func (w *watcher) drain() (report map[string]any, ended bool) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.reported {
		return nil, false
	}
	events, err := w.pending, w.err
	w.pending, w.err = nil, nil
	finished := w.closed && err == nil
	if len(events) == 0 && err == nil && !finished {
		return nil, false
	}
	report = map[string]any{}
	if len(events) > 0 {
		report["events"] = events
	}
	if err != nil {
		report["error"] = err.Error()
	}
	// An error ends the watch, and so does the backend closing. Either way the
	// shim hears it once.
	if err != nil || finished {
		report["ended"] = true
		w.reported = true
		return report, true
	}
	return report, false
}

// watchClose ends a watch. It is idempotent, because a script that closes a
// watcher twice — an explicit close and then an AbortSignal, say — is asking
// for the same state twice rather than making a mistake.
func (c *Compat) watchClose(id int64) error {
	c.mu.Lock()
	w, ok := c.watchers[id]
	delete(c.watchers, id)
	c.mu.Unlock()
	if !ok {
		return nil
	}
	w.close()
	return nil
}

// pump is the watcher's own goroutine: fsnotify events in, Node events out.
func (w *watcher) pump() {
	for {
		select {
		case event, ok := <-w.fsw.Events:
			if !ok {
				w.finish(nil)
				return
			}
			w.translate(event)
		case err, ok := <-w.fsw.Errors:
			if !ok {
				w.finish(nil)
				return
			}
			w.finish(err)
			return
		}
	}
}

// translate turns one fsnotify event into Node's vocabulary and buffers it.
//
// Node has two event types and fsnotify has five. The mapping is the one Node
// itself uses on Linux: anything that changes which names exist is a "rename",
// and anything that changes what a name holds is a "change".
func (w *watcher) translate(event fsnotify.Event) {
	// A new directory under a recursive watch has to be added before anything
	// is reported, because files created inside it in the same instant would
	// otherwise never be seen. inotify has this race by construction; adding
	// first narrows it to the width of one syscall.
	if w.recursive && event.Has(fsnotify.Create) {
		if info, err := os.Stat(event.Name); err == nil && info.IsDir() {
			_ = w.addTree(event.Name)
		}
	}

	kind := "change"
	if event.Has(fsnotify.Create) || event.Has(fsnotify.Remove) || event.Has(fsnotify.Rename) {
		kind = "rename"
	}
	w.emit(watchEvent{Type: kind, Filename: w.relative(event.Name)})
}

// relative names the event's subject the way Node does: relative to the watched
// directory, or the file's own basename when a single file is being watched.
func (w *watcher) relative(path string) string {
	if !w.dir {
		return filepath.Base(w.root)
	}
	rel, err := filepath.Rel(w.root, path)
	if err != nil || rel == "." || strings.HasPrefix(rel, "..") {
		return filepath.Base(path)
	}
	return rel
}

func (w *watcher) emit(event watchEvent) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.closed {
		return
	}
	if len(w.pending) >= watchEventBufferLimit {
		// Say so rather than drop silently. A consumer that reads this knows its
		// view is incomplete and can rescan; one that never hears about the
		// overflow believes a stale tree is the current one.
		w.err = fmt.Errorf("fs.watch: dropped events, the buffer of %d filled before the last poll",
			watchEventBufferLimit)
		w.pending = nil
		return
	}
	w.pending = append(w.pending, event)
}

// finish ends the pump, delivering a final error when there was one.
func (w *watcher) finish(err error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if err != nil && w.err == nil {
		w.err = err
	}
	w.closed = true
}

func (w *watcher) close() {
	w.fsw.Close() // ends pump, which calls finish
	w.mu.Lock()
	defer w.mu.Unlock()
	w.closed = true
}

// addTree watches root and every directory beneath it.
//
// A directory that vanishes between the walk and the add is not an error worth
// failing the whole watch for — it is the ordinary case of watching a tree
// something else is editing — so those are skipped and the walk continues.
func (w *watcher) addTree(root string) error {
	return filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			if errors.Is(err, os.ErrNotExist) || errors.Is(err, os.ErrPermission) {
				return nil
			}
			return err
		}
		if !d.IsDir() {
			return nil
		}
		if addErr := w.fsw.Add(path); addErr != nil {
			if errors.Is(addErr, os.ErrNotExist) || errors.Is(addErr, os.ErrPermission) {
				return nil
			}
			return addErr
		}
		return nil
	})
}

// closeWatchers ends every live watch. Called from Compat.Close, which is what
// keeps a runtime from leaving inotify descriptors behind when the program that
// owns it moves on.
func (c *Compat) closeWatchers() {
	ids := make([]int64, 0, len(c.watchers))
	for id := range c.watchers {
		ids = append(ids, id)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	for _, id := range ids {
		c.watchers[id].close()
	}
	clear(c.watchers)
}
