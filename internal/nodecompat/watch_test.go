package nodecompat_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/robomotionio/go-deepseek/internal/nodecompat"
)

// TestWatchDirectory is the whole contract in one run: a watcher sees a file
// appear and then change, reports each with Node's own vocabulary, and stops
// when it is closed — which is also what lets RunLoop return.
func TestWatchDirectory(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})

	got := run(t, rt, `
		import fs from 'node:fs';
		import path from 'node:path';

		const seen = [];
		const watcher = fs.watch(`+quote(dir)+`, (eventType, filename) => {
			seen.push(eventType + ':' + filename);
		});

		const file = path.join(`+quote(dir)+`, 'note.txt');
		fs.writeFileSync(file, 'one');
		await new Promise((done) => setTimeout(done, 300));
		fs.writeFileSync(file, 'two');
		await new Promise((done) => setTimeout(done, 300));
		watcher.close();
		globalThis.result = seen.join(' ');
	`)

	if !strings.Contains(got, "rename:note.txt") {
		t.Errorf("no creation event in %q", got)
	}
	if !strings.Contains(got, "change:note.txt") {
		t.Errorf("no modification event in %q", got)
	}
}

// TestWatchRecursive covers the half fsnotify does not do for us: a directory
// created after the watch began is watched too, so a file inside it is seen.
func TestWatchRecursive(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})

	got := run(t, rt, `
		import fs from 'node:fs';
		import path from 'node:path';

		const seen = [];
		const watcher = fs.watch(`+quote(dir)+`, { recursive: true }, (type, name) => seen.push(name));

		fs.mkdirSync(path.join(`+quote(dir)+`, 'skills', 'deep'), { recursive: true });
		await new Promise((done) => setTimeout(done, 400));
		fs.writeFileSync(path.join(`+quote(dir)+`, 'skills', 'deep', 'SKILL.md'), '# hi');
		await new Promise((done) => setTimeout(done, 400));
		watcher.close();
		globalThis.result = seen.join(' ');
	`)

	if !strings.Contains(got, filepath.Join("skills", "deep", "SKILL.md")) {
		t.Errorf("a file in a directory created after the watch began was not reported: %q", got)
	}
}

// TestWatchPromises covers the async-iterator face, including the part that is
// easy to get wrong: breaking out of the loop closes the watcher, so the run
// finishes instead of parking on a read nobody will answer.
func TestWatchPromises(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})

	got := run(t, rt, `
		import fs from 'node:fs';
		import fsp from 'node:fs/promises';
		import path from 'node:path';

		const events = [];
		const iterate = (async () => {
			for await (const event of fsp.watch(`+quote(dir)+`)) {
				events.push(event.eventType + ':' + event.filename);
				break;
			}
		})();

		await new Promise((done) => setTimeout(done, 200));
		fs.writeFileSync(path.join(`+quote(dir)+`, 'a.txt'), 'x');
		await iterate;
		globalThis.result = events.join(' ');
	`)

	if !strings.HasPrefix(got, "rename:a.txt") {
		t.Errorf("promise watch reported %q", got)
	}
}

// TestWatchFilePoll is the other mechanism: a stat poll whose listener gets the
// two Stats rather than an event name. Chokidar's polling mode is built on it,
// and so is anything watching a network mount.
func TestWatchFilePoll(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "poll.txt")
	if err := os.WriteFile(file, []byte("first"), 0o644); err != nil {
		t.Fatal(err)
	}
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})

	got := run(t, rt, `
		import fs from 'node:fs';

		let report = 'nothing';
		const listener = (curr, prev) => { report = prev.size + '->' + curr.size; };
		fs.watchFile(`+quote(file)+`, { interval: 40 }, listener);

		await new Promise((done) => setTimeout(done, 100));
		fs.writeFileSync(`+quote(file)+`, 'considerably longer');
		await new Promise((done) => setTimeout(done, 300));
		fs.unwatchFile(`+quote(file)+`, listener);
		globalThis.result = report;
	`)

	if got != "5->19" {
		t.Errorf("watchFile reported %q, want 5->19", got)
	}
}

// TestWatchClosedByRuntime is the liveness guarantee. A watcher nobody closed
// must not keep the loop from draining when the runtime itself goes away —
// otherwise one forgotten watcher parks the whole program.
func TestWatchClosedByRuntime(t *testing.T) {
	dir := t.TempDir()
	rt, compat := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})

	if _, err := rt.RunModule("test:/main.mjs", `
		import fs from 'node:fs';
		globalThis.watcher = fs.watch(`+quote(dir)+`, () => {});
	`); err != nil {
		t.Fatalf("run module: %v", err)
	}
	// Close the layer first: the pending read resolves with null, the pump loop
	// in the shim sees the end and stops, and only then can the loop drain.
	if err := compat.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}
	if err := rt.RunLoop(t.Context()); err != nil {
		t.Fatalf("loop did not drain after the layer closed: %v", err)
	}
}

// quote renders a Go string as a JavaScript one, with Windows separators
// escaped — a path is the one value these tests always have to inline.
func quote(s string) string {
	return "'" + strings.ReplaceAll(strings.ReplaceAll(s, `\`, `\\`), "'", `\'`) + "'"
}
