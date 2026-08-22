package runtime

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// `llm-deepseek` 0.1.1-rc.2 gained a durable upload index: a JSON file under the
// harness home, published through a writer lock and replaced atomically. It is
// the first thing in the bundle to depend on fs SEMANTICS rather than fs calls,
// and the dependency is narrow enough to miss:
//
//   - the lock is an exclusive create (`flag: 'wx'`) whose contention signal is
//     an EEXIST error code. A shim that ignores the flag makes the lock a no-op
//     — two writers, last one wins, silently.
//   - the atomic replace is write-temp-then-rename, so rename must overwrite an
//     existing destination rather than fail.
//   - a missing index must fail with code ENOENT, because that is what the
//     module reads to mean "empty". Anything else propagates as a hard error on
//     the very first image upload.
//
// TestEveryModuleEvaluates proves this module LOADS. None of the above is
// exercised by loading it. A live turn carrying an image exercises all of it,
// which is why the release notes ask for one — but a key-gated test is not a
// test most of the time, so drive the index directly here.
func TestUploadIndexWritesInsideTheFence(t *testing.T) {
	dir := t.TempDir()
	eng, err := newEngine(Config{
		CWD:   dir,
		Roots: []string{dir},
		// HOME is what puts `~/.dsh` inside the fence: nodecompat's
		// os.homedir() answers this before the operating system's, so the
		// harness home resolves under the workspace the filesystem allows.
		Env: map[string]string{"HOME": dir},
	}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer eng.close()

	// parseRecord holds attachment and variant ids to `sha256:<64 hex>`, so a
	// placeholder that does not look like one is rejected as a corrupt index
	// rather than exercising the write.
	const src = `
import { DeepSeekUploadIndex, deepSeekFileScope } from '@deepseek-ai/dsh-llm-deepseek';

const hex = (c) => c.repeat(64);
const index = new DeepSeekUploadIndex();
const scope = deepSeekFileScope('https://api.deepseek.com', 'not-a-real-key');
const now = 1760000000000;
const record = {
  scope,
  attachmentId: 'sha256:' + hex('a'),
  variantId: 'sha256:' + hex('b'),
  fileId: 'file-1',
  bytes: 12,
  createdAt: now,
  expiresAt: now + 86400000,
};

globalThis.result = 'the probe never ran';
globalThis.settled = (async () => {
  // An index that does not exist yet must read as empty, not as an error.
  const before = await index.get(scope, record.variantId, now, 0);

  const first = await index.commit(record, now, 0);
  const read = await index.get(scope, record.variantId, now, 0);

  // Committing again takes the lock on a file that now exists — the path that
  // proves the lock is released rather than leaked, and that the atomic
  // replace overwrites its destination instead of failing on it.
  const second = await index.commit({ ...record, fileId: 'file-2' }, now, 0);

  return JSON.stringify({
    path: index.path,
    beforeWasEmpty: before === undefined,
    firstAccepted: first.accepted,
    readBack: read === undefined ? null : read.fileId,
    secondWinner: second.record.fileId,
  });
})().then(
  (value) => { globalThis.result = value; },
  (error) => { globalThis.result = 'ERROR: ' + (error && error.stack ? error.stack : String(error)); },
);
`
	if _, err := eng.rt.RunModule("upload-index-probe.mjs", src); err != nil {
		t.Fatalf("%v", withStack(err))
	}
	if err := eng.rt.RunLoop(context.Background()); err != nil {
		t.Fatalf("the upload index failed against the fs shim: %v", withStack(err))
	}

	value, err := eng.rt.Get("result")
	if err != nil {
		t.Fatal(err)
	}
	out := value.String()
	if strings.HasPrefix(out, "ERROR:") || strings.Contains(out, "never ran") {
		t.Fatalf("the upload index does not work against the fs shim:\n%s", out)
	}
	t.Logf("upload index: %s", out)

	for _, want := range []string{
		`"beforeWasEmpty":true`,
		`"firstAccepted":true`,
		`"readBack":"file-1"`,
	} {
		if !strings.Contains(out, want) {
			t.Errorf("expected %s in %s", want, out)
		}
	}

	// The whole point of HOME: the file lands inside the fence, so the fenced
	// filesystem allows the write instead of refusing it with EACCES.
	written := filepath.Join(dir, ".dsh", "llm-deepseek", "files-v3.json")
	if _, err := os.Stat(written); err != nil {
		t.Fatalf("the upload index was not written to %s: %v", written, err)
	}

	// A leaked lock file makes the NEXT process wait out the lock timeout and
	// then fail. It is invisible until it matters, so assert it is gone.
	if _, err := os.Stat(written + ".lock"); err == nil {
		t.Errorf("the writer lock at %s.lock was left behind", written)
	}
}

// The other half of the lock: a lock somebody else holds must be REFUSED.
//
// This is the assertion that would have failed before the fs shim honoured
// `flag: 'wx'`. Without it, the exclusive create quietly truncated the existing
// lock file, every contender was granted the lock at once, and the only visible
// symptom would have been two harnesses sharing a DSH home writing over each
// other's upload index — occasionally, under load, with no error anywhere.
func TestUploadIndexLockIsExclusive(t *testing.T) {
	dir := t.TempDir()
	eng, err := newEngine(Config{CWD: dir, Roots: []string{dir}, Env: map[string]string{"HOME": dir}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer eng.close()

	// Stand in for another process holding the writer lock.
	indexPath := filepath.Join(dir, ".dsh", "llm-deepseek", "files-v3.json")
	if err := os.MkdirAll(filepath.Dir(indexPath), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(indexPath+".lock", []byte("99999\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	const src = `
import { DeepSeekUploadIndex, deepSeekFileScope } from '@deepseek-ai/dsh-llm-deepseek';

const hex = (c) => c.repeat(64);
const index = new DeepSeekUploadIndex();
const scope = deepSeekFileScope('https://api.deepseek.com', 'not-a-real-key');
const now = 1760000000000;

globalThis.result = 'the probe never ran';
globalThis.settled = index.commit({
  scope,
  attachmentId: 'sha256:' + hex('a'),
  variantId: 'sha256:' + hex('b'),
  fileId: 'file-1',
  bytes: 12,
  createdAt: now,
  expiresAt: now + 86400000,
}, now, 0).then(
  () => { globalThis.result = 'ACQUIRED'; },
  (error) => { globalThis.result = 'REFUSED: ' + String(error && error.message ? error.message : error); },
);
`
	if _, err := eng.rt.RunModule("upload-index-lock-probe.mjs", src); err != nil {
		t.Fatalf("%v", withStack(err))
	}
	if err := eng.rt.RunLoop(context.Background()); err != nil {
		t.Fatalf("%v", withStack(err))
	}

	value, err := eng.rt.Get("result")
	if err != nil {
		t.Fatal(err)
	}
	got := value.String()
	if got == "ACQUIRED" {
		t.Fatal("the writer lock was granted while another holder had it — " +
			"fs.writeFile is ignoring flag: 'wx' again, and the lock protects nothing")
	}
	if !strings.Contains(got, "timed out waiting for the writer lock") {
		t.Fatalf("expected a lock timeout, got: %s", got)
	}
	t.Logf("contended lock: %s", got)
}
