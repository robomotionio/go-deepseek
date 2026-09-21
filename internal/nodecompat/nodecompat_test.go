package nodecompat_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"testing"

	"github.com/robomotionio/go-deepseek/internal/nodecompat"
	"github.com/robomotionio/goant"
)

// newRuntime builds a Runtime with the layer installed and the shims wired into
// module resolution, which is how a host is expected to use this package.
func newRuntime(t *testing.T, opts nodecompat.Options) (*goant.Runtime, *nodecompat.Compat) {
	t.Helper()
	var compat *nodecompat.Compat
	rt := goant.New(
		goant.WithRealTimers(true),
		goant.WithModuleResolver(func(specifier, referrer string) (string, string, error) {
			if src, path, ok, err := compat.Resolve(specifier, referrer); err != nil {
				return "", "", err
			} else if ok {
				return src, path, nil
			}
			return "", "", fmt.Errorf("no such module %q", specifier)
		}),
	)
	t.Cleanup(rt.Close)
	c, err := nodecompat.Install(rt, opts)
	if err != nil {
		t.Fatalf("install: %v", err)
	}
	compat = c
	t.Cleanup(func() { c.Close() })
	return rt, c
}

// run evaluates src as a module and returns what it left on globalThis.result.
func run(t *testing.T, rt *goant.Runtime, src string) string {
	t.Helper()
	if _, err := rt.RunModule("test:/main.mjs", src); err != nil {
		t.Fatalf("run module: %v", err)
	}
	if err := rt.RunLoop(context.Background()); err != nil {
		t.Fatalf("loop: %v", err)
	}
	v, err := rt.Get("result")
	if err != nil {
		t.Fatal(err)
	}
	return v.String()
}

func TestPath(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{CWD: "/work"})
	got := run(t, rt, `
		import path from 'node:path';
		const checks = [
			path.join('a', 'b', '../c'),
			path.resolve('rel'),
			path.dirname('/x/y/z.txt'),
			path.basename('/x/y/z.txt', '.txt'),
			path.extname('archive.tar.gz'),
			path.extname('.bashrc'),
			path.normalize('/a//b/../c/'),
			path.relative('/a/b/c', '/a/d'),
			String(path.isAbsolute('/x')),
			JSON.stringify(path.parse('/a/b/c.js')),
			path.win32.join('C:\\a', 'b'),
			String(path.win32.isAbsolute('C:\\a')),
		];
		globalThis.result = checks.join('|');
	`)
	want := strings.Join([]string{
		"a/c", "/work/rel", "/x/y", "z", ".gz", "", "/a/c/", "../../d", "true",
		`{"root":"/","dir":"/a/b","base":"c.js","ext":".js","name":"c"}`,
		`C:\a\b`, "true",
	}, "|")
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

func TestFilesystem(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, fmt.Sprintf(`
		import fs from 'node:fs';
		import { readFile, writeFile, mkdir, readdir, stat, rm } from 'node:fs/promises';
		import path from 'node:path';

		const root = %q;
		const out = [];
		await mkdir(path.join(root, 'nested/deep'), { recursive: true });
		await writeFile(path.join(root, 'nested/deep/hello.txt'), 'hello world');
		out.push(await readFile(path.join(root, 'nested/deep/hello.txt'), 'utf8'));
		out.push(String(fs.existsSync(path.join(root, 'nested/deep/hello.txt'))));
		out.push(String(fs.existsSync(path.join(root, 'nope'))));
		out.push((await readdir(path.join(root, 'nested'))).join(','));
		out.push(String((await stat(path.join(root, 'nested/deep/hello.txt'))).size));
		out.push(String((await stat(path.join(root, 'nested'))).isDirectory()));
		fs.appendFileSync(path.join(root, 'nested/deep/hello.txt'), '!');
		out.push(fs.readFileSync(path.join(root, 'nested/deep/hello.txt'), 'utf8'));
		const buf = fs.readFileSync(path.join(root, 'nested/deep/hello.txt'));
		out.push(String(Buffer.isBuffer(buf)) + ':' + buf.length);
		try { await readFile(path.join(root, 'missing')); } catch (e) { out.push(e.code); }
		await rm(path.join(root, 'nested'), { recursive: true });
		out.push(String(fs.existsSync(path.join(root, 'nested'))));
		globalThis.result = out.join('|');
	`, dir))
	want := "hello world|true|false|deep|11|true|hello world!|true:12|ENOENT|false"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// The fence is the security-relevant part of the layer: a path outside the roots
// must fail no matter how it is spelled.
func TestFilesystemFence(t *testing.T) {
	dir := t.TempDir()
	outside := filepath.Join(t.TempDir(), "secret.txt")
	if err := os.WriteFile(outside, []byte("classified"), 0o600); err != nil {
		t.Fatal(err)
	}
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, fmt.Sprintf(`
		import fs from 'node:fs';
		const out = [];
		for (const p of [%q, %q]) {
			try { fs.readFileSync(p); out.push('READ'); }
			catch (e) { out.push(e.code || 'ERR'); }
		}
		globalThis.result = out.join('|');
	`, outside, dir+"/../"+filepath.Base(filepath.Dir(outside))+"/secret.txt"))
	if got != "EACCES|EACCES" {
		t.Fatalf("fence let something through: %s", got)
	}
}

func TestBufferAndEncoding(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		const out = [];
		out.push(Buffer.from('héllo').length);
		out.push(Buffer.from('hello').toString('hex'));
		out.push(Buffer.from('68656c6c6f', 'hex').toString());
		out.push(Buffer.from('hello').toString('base64'));
		out.push(Buffer.from('aGVsbG8=', 'base64').toString());
		out.push(Buffer.concat([Buffer.from('a'), Buffer.from('b')]).toString());
		out.push(new TextDecoder().decode(new TextEncoder().encode('round trip')));
		out.push(Buffer.byteLength('héllo'));
		out.push(String(Buffer.from('ab').equals(Buffer.from('ab'))));
		globalThis.result = out.join('|');
	`)
	want := "6|68656c6c6f|hello|aGVsbG8=|hello|ab|round trip|6|true"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// Buffer is a binary reader too, and the session-log reader depends on it: it
// walks Zstandard frame headers with readUInt32LE, readUInt8 and readUIntLE.
// Without them a log this runtime wrote is a log it cannot open, and the
// symptom — "undefined is not a function" — names nothing.
//
// Every expected value below was produced by running the same expressions on
// real Node, because "it returns a number" is not the property that matters.
func TestBufferNumericAccessors(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		// The first four bytes are a real Zstandard frame magic, which is the
		// read that mattered.
		const buf = Buffer.from([0x28, 0xb5, 0x2f, 0xfd, 0x24, 0x08, 0x91, 0x00,
		                         0x00, 0xff, 0xfe, 0x80, 0x01, 0x02, 0x03, 0x04]);
		const out = [];
		out.push(buf.readUInt8(0));
		out.push(buf.readUInt32LE(0));
		out.push(buf.readUInt32BE(0));
		out.push(buf.readUIntLE(4, 3));
		out.push(buf.readUIntBE(4, 3));
		out.push(buf.readInt8(1));
		out.push(buf.readInt16LE(9));
		out.push(buf.readInt16BE(9));
		out.push(buf.readIntLE(9, 3));
		out.push(buf.readIntBE(9, 3));
		out.push(buf.readUint8(0));
		out.push(buf.readUintLE(4, 3));
		out.push(String(buf.readBigUInt64LE(0)));
		out.push(String(buf.readBigInt64BE(8)));
		out.push(buf.readFloatLE(0).toPrecision(8));
		out.push(buf.readDoubleBE(0).toPrecision(8));
		// A slice, because an offset is relative to the Buffer and not to the
		// ArrayBuffer it may be a window on. Getting that wrong reads a
		// neighbour's bytes and reports nothing.
		const tail = buf.subarray(4);
		out.push(tail.readUInt8(0));
		out.push(tail.readUIntLE(0, 3));
		// Writers round-trip and answer with the next offset.
		const w = Buffer.alloc(8);
		out.push(w.writeUInt32LE(0xdeadbeef, 0));
		out.push(w.readUInt32LE(0));
		out.push(w.writeUIntBE(0x0102030405, 0, 5));
		out.push(w.readUIntBE(0, 5));
		out.push(w.writeIntLE(-1234567, 0, 4));
		out.push(w.readIntLE(0, 4));
		// Out of range is an error rather than a wrong answer.
		try { buf.readUInt32LE(13); out.push('no throw'); } catch (e) { out.push(e.code); }
		try { buf.readUIntLE(0, 7); out.push('no throw'); } catch (e) { out.push(e.code); }
		globalThis.result = out.join('|');
	`)
	want := "40|4247762216|682962941|9504804|2361489|-75|-257|-2|-8323329|-384|40|9504804|" +
		"40822826582652200|72055944787395332|-1.4597220e+37|1.3765768e-112|36|9504804|" +
		"4|3735928559|5|4328719365|4|-1234567|ERR_OUT_OF_RANGE|ERR_OUT_OF_RANGE"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// The write side range-checks its VALUE, not just its offset. DataView wraps
// silently — 300 becomes 44 — and Node throws instead, because a parser that
// stores the wrong byte without complaining is the failure this whole family
// exists to avoid. Every expectation below came from running the same
// expressions on real Node.
func TestBufferWriteRangeChecks(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		const out = [];
		const w = Buffer.alloc(8);
		const t = (label, fn) => {
			try { out.push(label + '=' + fn()); } catch (e) { out.push(label + '=' + e.code); }
		};
		t('u8_300', () => w.writeUInt8(300));
		t('u8_255', () => w.writeUInt8(255));
		t('i8_neg129', () => w.writeInt8(-129));
		t('i8_neg128', () => w.writeInt8(-128));
		t('u16_70000', () => w.writeUInt16LE(70000));
		t('u32_neg1', () => w.writeUInt32LE(-1));
		t('varI3_big', () => w.writeIntLE(99999999, 0, 3));
		t('varI3_ok', () => w.writeIntLE(-8388608, 0, 3));
		t('varU3_neg1', () => w.writeUIntLE(-1, 0, 3));
		t('varU6_max', () => w.writeUIntLE(281474976710655, 0, 6));
		t('varU6_over', () => w.writeUIntLE(281474976710656, 0, 6));
		// The float pair takes any number: out of range means precision loss
		// there, not an error, and Node agrees.
		t('f32_1e39', () => w.writeFloatLE(1e39));
		t('f64_1e308', () => w.writeDoubleLE(1e308));
		t('big_neg1', () => w.writeBigUInt64LE(-1n));
		t('big_max', () => w.writeBigUInt64LE(18446744073709551615n));
		globalThis.result = out.join('|');
	`)
	want := "u8_300=ERR_OUT_OF_RANGE|u8_255=1|i8_neg129=ERR_OUT_OF_RANGE|i8_neg128=1|" +
		"u16_70000=ERR_OUT_OF_RANGE|u32_neg1=ERR_OUT_OF_RANGE|varI3_big=ERR_OUT_OF_RANGE|" +
		"varI3_ok=3|varU3_neg1=ERR_OUT_OF_RANGE|varU6_max=6|varU6_over=ERR_OUT_OF_RANGE|" +
		"f32_1e39=4|f64_1e308=8|big_neg1=ERR_OUT_OF_RANGE|big_max=8"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// createZstdDecompress is PROBED rather than used: the session-log reader builds
// one to ask whether this release exposes a private fast path, then falls back
// to the public one-shot API. Throwing there does not decline the fast path, it
// takes the read down with it — so it must answer, and must still refuse to
// pretend it is a stream.
func TestZstdDecompressProbeDeclinesRatherThanThrows(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { createZstdDecompress, createGzip } from 'node:zlib';
		const out = [];
		const probe = createZstdDecompress({ chunkSize: 1024 });
		// What the reader actually inspects, and the answer it needs.
		out.push('handle=' + typeof probe._handle);
		out.push('writeState=' + (probe._writeState instanceof Uint32Array));
		out.push('symbols=' + Reflect.ownKeys(probe).filter((k) => typeof k === 'symbol').length);
		probe.close();
		out.push('closed');
		// It is not a stream, and says so rather than behaving like one.
		try { probe.write('x'); out.push('wrote'); } catch { out.push('write refused'); }
		try { createGzip(); out.push('made a gzip stream'); } catch { out.push('createGzip refused'); }
		globalThis.result = out.join('|');
	`)
	want := "handle=undefined|writeState=false|symbols=0|closed|write refused|createGzip refused"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// A decoder fed one byte at a time must not turn a multi-byte character into
// replacement characters, which is the whole point of streaming mode and the
// thing SSE parsing depends on.
func TestStreamingDecode(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		const bytes = new TextEncoder().encode('héllo wörld');
		const dec = new TextDecoder();
		let text = '';
		for (const b of bytes) text += dec.decode(new Uint8Array([b]), { stream: true });
		text += dec.decode();
		globalThis.result = text;
	`)
	if got != "héllo wörld" {
		t.Fatalf("got %q", got)
	}
}

func TestURL(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		const u = new URL('https://api.example.com:8443/v1/chat?model=x&n=2#top');
		const out = [
			u.protocol, u.hostname, u.port, u.pathname, u.search, u.hash, u.origin,
			u.searchParams.get('model'),
			new URL('../other', 'https://example.com/a/b/c').href,
			String(URL.canParse('not a url')),
		];
		const q = new URLSearchParams({ a: '1', b: 'two words' });
		out.push(q.toString());
		u.searchParams.set('model', 'y');
		out.push(u.href);
		globalThis.result = out.join('|');
	`)
	want := strings.Join([]string{
		"https:", "api.example.com", "8443", "/v1/chat", "?model=x&n=2", "#top",
		"https://api.example.com:8443", "x",
		"https://example.com/a/other", "false",
		"a=1&b=two+words",
		"https://api.example.com:8443/v1/chat?model=y&n=2#top",
	}, "|")
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

func TestCryptoAndCompression(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { createHash, createHmac, randomUUID, randomBytes } from 'node:crypto';
		import { zstdCompressSync, zstdDecompressSync, gzipSync, gunzipSync } from 'node:zlib';

		const out = [];
		out.push(createHash('sha256').update('abc').digest('hex'));
		out.push(createHmac('sha256', 'key').update('abc').digest('hex').slice(0, 16));
		out.push(String(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(randomUUID())));
		out.push(String(randomBytes(16).length));

		const text = 'the same line, over and over, '.repeat(50);
		const packed = zstdCompressSync(text);
		out.push(String(packed.length < text.length));
		out.push(String(zstdDecompressSync(packed).toString() === text));
		out.push(String(gunzipSync(gzipSync(text)).toString() === text));
		globalThis.result = out.join('|');
	`)
	// sha256('abc'), the standard vector.
	want := "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad|9c196e32dc0175f8|true|16|true|true|true"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

func TestEventsAndStreams(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { EventEmitter, once } from 'node:events';
		import { Readable, Writable } from 'node:stream';

		const out = [];
		const em = new EventEmitter();
		let seen = 0;
		em.on('tick', (n) => { seen += n; });
		em.once('tick', () => out.push('once'));
		em.emit('tick', 1);
		em.emit('tick', 2);
		out.push(String(seen));

		const later = once(em, 'done');
		em.emit('done', 'value');
		out.push((await later)[0]);

		const chunks = [];
		const readable = Readable.from(['a', 'b', 'c']);
		for await (const chunk of readable) chunks.push(chunk);
		out.push(chunks.join(''));

		const written = [];
		const w = new Writable({ write(chunk, enc, cb) { written.push(String(chunk)); cb(); } });
		w.write('x'); w.write('y'); w.end();
		out.push(written.join(''));

		try { new EventEmitter().emit('error', new Error('unhandled')); out.push('NOT THROWN'); }
		catch (e) { out.push('threw:' + e.message); }
		globalThis.result = out.join('|');
	`)
	want := "once|3|value|abc|xy|threw:unhandled"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

func TestAsyncLocalStorage(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { AsyncLocalStorage } from 'node:async_hooks';
		const als = new AsyncLocalStorage();
		const out = [];
		await als.run({ id: 'session-1' }, async () => {
			out.push(als.getStore().id);
			await new Promise((r) => setTimeout(r, 5));
			// The store has to survive the await, which is the only reason this
			// API exists.
			out.push(als.getStore().id);
		});
		out.push(String(als.getStore()));
		globalThis.result = out.join('|');
	`)
	if got != "session-1|session-1|undefined" {
		t.Fatalf("got %q", got)
	}
}

func TestFetch(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/json":
			body, _ := json.Marshal(map[string]any{"method": r.Method, "auth": r.Header.Get("Authorization")})
			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
		case "/echo":
			b := make([]byte, r.ContentLength)
			r.Body.Read(b)
			w.Write(b)
		case "/stream":
			flusher := w.(http.Flusher)
			for i := 0; i < 3; i++ {
				fmt.Fprintf(w, "data: chunk-%d\n\n", i)
				flusher.Flush()
			}
		case "/missing":
			w.WriteHeader(404)
			w.Write([]byte("gone"))
		}
	}))
	defer server.Close()

	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, fmt.Sprintf(`
		const base = %q;
		const out = [];

		const res = await fetch(base + '/json', { headers: { Authorization: 'Bearer sk-test' } });
		out.push(String(res.ok) + ':' + res.status);
		out.push(res.headers.get('content-type'));
		const body = await res.json();
		out.push(body.method + ':' + body.auth);

		const echo = await fetch(base + '/echo', { method: 'POST', body: 'round trip' });
		out.push(await echo.text());

		const missing = await fetch(base + '/missing');
		out.push(String(missing.ok) + ':' + missing.status + ':' + await missing.text());

		// The streaming path: read the body as it arrives rather than waiting
		// for the whole thing, which is what an LLM stream needs.
		const stream = await fetch(base + '/stream');
		let text = '';
		for await (const chunk of stream.body.pipeThrough(new TextDecoderStream())) text += chunk;
		out.push(text.trim().split('\n\n').length + ' events');

		globalThis.result = out.join('|');
	`, server.URL))
	want := "true:200|application/json|GET:Bearer sk-test|round trip|false:404:gone|3 events"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// A request must actually stop when its signal fires, or a cancelled turn keeps
// billing tokens.
func TestFetchAbort(t *testing.T) {
	release := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		<-release
		w.Write([]byte("too late"))
	}))
	defer server.Close()
	defer close(release)

	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, fmt.Sprintf(`
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 20);
		try {
			await fetch(%q, { signal: controller.signal });
			globalThis.result = 'completed';
		} catch (err) {
			globalThis.result = 'aborted:' + (err.message.includes('abort') ? 'yes' : err.message);
		}
	`, server.URL))
	if !strings.HasPrefix(got, "aborted") {
		t.Fatalf("got %q, expected the request to be aborted", got)
	}
}

func TestProcessAndOS(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{
		CWD: "/somewhere",
		Env: map[string]string{"DEEPSEEK_API_KEY": "sk-test", "HOME": "/home/agent"},
	})
	got := run(t, rt, `
		import os from 'node:os';
		import process from 'node:process';
		const out = [
			process.cwd(),
			process.env.DEEPSEEK_API_KEY,
			String(process.env.NOT_SET),
			process.platform,
			String(typeof os.tmpdir()),
			String(os.cpus().length > 0),
			String(typeof performance.now()),
		];
		globalThis.result = out.join('|');
	`)
	want := "/somewhere|sk-test|undefined|linux|string|true|number"
	if got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}
}

// os.homedir() is $HOME — the composed environment's, not the host's. Node
// answers the environment first and the user database second, and an embedder
// that fences the runtime into a workspace sets HOME inside that fence: a
// homedir that ignored it aimed every path upstream derives from it — skill
// roots, config dirs — at the operator's real home, outside the fence, where
// the filesystem answers EACCES. userInfo().homedir stays the operating
// system's answer, which is Node's documented behavior for that one.
func TestHomedirIsTheComposedHome(t *testing.T) {
	hostHome, err := os.UserHomeDir()
	if err != nil {
		t.Skipf("no host home to compare against: %v", err)
	}

	rt, _ := newRuntime(t, nodecompat.Options{
		CWD: "/work",
		Env: map[string]string{"HOME": "/work/home"},
	})
	got := run(t, rt, `
		import os from 'node:os';
		globalThis.result = [os.homedir(), os.userInfo().homedir].join('|');
	`)
	if want := "/work/home|" + hostHome; got != want {
		t.Fatalf("\n got %s\nwant %s", got, want)
	}

	// And with no HOME composed, the host's answer is the fallback.
	rt, _ = newRuntime(t, nodecompat.Options{CWD: "/work"})
	got = run(t, rt, `
		import os from 'node:os';
		globalThis.result = os.homedir();
	`)
	if got != hostHome {
		t.Fatalf("fallback homedir: got %q, want %q", got, hostHome)
	}
}

// The refusals are part of the contract: a capability that is missing on purpose
// should say so where the mistake was made.
func TestAbsentBuiltinsAreNamed(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	_, err := rt.RunModule("test:/main.mjs", `import vm from 'node:vm';`)
	if err == nil {
		t.Fatal("expected vm to be refused")
	}
	if !strings.Contains(err.Error(), "deliberately not implemented") {
		t.Fatalf("refusal did not explain itself: %v", err)
	}
}

// child_process imports — a bundled SDK imports it statically for a path
// nothing here takes — but nothing it offers runs. The refusal is at the call,
// and it names the seam.
func TestChildProcessImportsButRefusesToSpawn(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import * as cp from 'node:child_process';
		import { promisify } from 'node:util';
		const execFileAsync = promisify(cp.execFile);
		const outcomes = [];
		for (const call of [() => cp.spawn('/bin/sh'), () => cp.execFileSync('ls'), () => execFileAsync('ls')]) {
			try { await call(); outcomes.push('ran'); } catch (error) { outcomes.push(error.code + ':' + /subprocess seam/.test(error.message)); }
		}
		globalThis.result = outcomes.join(',');
	`)
	want := "ERR_NOT_AVAILABLE:true,ERR_NOT_AVAILABLE:true,ERR_NOT_AVAILABLE:true"
	if got != want {
		t.Fatalf("child_process: got %q, want %q", got, want)
	}
}

// fs.realpath.native exists, because dsh-fs-local promisifies it at module
// scope and a missing one fails the whole plugin before it mounts.
func TestRealpathNative(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, `
		import { realpath, realpathSync } from 'node:fs';
		import { promisify } from 'node:util';
		const native = await promisify(realpath.native)('.');
		globalThis.result = String(native === realpathSync.native('.') && native.length > 0);
	`)
	if got != "true" {
		t.Fatalf("realpath.native: got %q", got)
	}
}

// The semantics `@deepseek-ai/dsh-atomic-write` builds its writer lock out of.
// It takes the lock by creating a file with `flag: 'wx'` and decides that
// somebody else holds it by reading `err.code === 'EEXIST'` — so a shim that
// accepted the flag and overwrote, or that failed with any other code, would
// turn a mutual-exclusion primitive into a no-op without failing anything.
// `llm-deepseek` publishes its durable upload index through that lock, which is
// why this is worth pinning rather than assuming.
func TestExclusiveCreateReportsEEXIST(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, `
		import { writeFileSync, readFileSync } from 'node:fs';
		import path from 'node:path';
		const file = path.join(`+quote(dir)+`, 'lock');
		const checks = [];

		writeFileSync(file, 'first', { flag: 'wx' });
		checks.push('created=' + readFileSync(file, 'utf8'));

		try {
			writeFileSync(file, 'second', { flag: 'wx' });
			checks.push('code=NONE');
		} catch (error) {
			checks.push('code=' + error.code);
		}

		// The loser must not have clobbered the winner's lock.
		checks.push('kept=' + readFileSync(file, 'utf8'));
		globalThis.result = checks.join('|');
	`)
	want := "created=first|code=EEXIST|kept=first"
	if got != want {
		t.Fatalf("exclusive create:\n got %s\nwant %s", got, want)
	}
}

// The descriptor path has the same contract as the whole-file one: `ax+` is a
// flag Node documents, and a flag nobody documents is refused rather than
// guessed at. Guessing meant silently opening read-only — the call succeeded
// and the failure surfaced later, at a write, as EBADF: an error that cannot
// explain itself. That is the same shape as the truncation bug on the write
// path, reached through a different door.
func TestOpenFlagsAreCompleteAndRefuseNonsense(t *testing.T) {
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, `
		import { openSync, closeSync, writeSync, readFileSync } from 'node:fs';
		import path from 'node:path';
		const checks = [];
		const at = (name) => path.join(`+quote(dir)+`, name);

		// ax+ : exclusive create, append, readable. Documented by Node, and
		// missing from this shim's table until it shared one with the write path.
		const fd = openSync(at('exclusive'), 'ax+');
		writeSync(fd, 'first');
		closeSync(fd);
		checks.push('created=' + readFileSync(at('exclusive'), 'utf8'));

		try {
			closeSync(openSync(at('exclusive'), 'ax+'));
			checks.push('second=NONE');
		} catch (error) {
			checks.push('second=' + error.code);
		}

		// A flag that means nothing must say so, not open read-only.
		try {
			closeSync(openSync(at('exclusive'), 'not-a-flag'));
			checks.push('nonsense=ACCEPTED');
		} catch (error) {
			checks.push('nonsense=' + error.code);
		}

		// The ordinary spellings still work.
		closeSync(openSync(at('plain'), 'w'));
		checks.push('plain=ok');
		globalThis.result = checks.join('|');
	`)
	want := "created=first|second=EEXIST|nonsense=EINVAL|plain=ok"
	if got != want {
		t.Fatalf("open flags:\n got %s\nwant %s", got, want)
	}
}

// The session backend's write lock, end to end through the path its loader
// takes: process.report for the C library, require.resolve for the addon's
// package, require of the .node binary, then tryLock on a real descriptor.
// Two descriptors on one file conflict — flock(2) locks an open file
// description, not a process — and closing the holder frees it.
func TestSystemAddonFlock(t *testing.T) {
	if goruntime.GOOS == "windows" {
		t.Skip("the flock addon is POSIX-only; its loader refuses win32 before asking")
	}
	dir := t.TempDir()
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, `
		import { createRequire } from 'node:module';
		import { open } from 'node:fs/promises';
		import { getSystemErrorName } from 'node:util';
		import { join, dirname } from 'node:path';
		const report = process.report.getReport();
		const filename = join(report.header.glibcVersionRuntime ? 'glibc' : 'musl', 'system.node');
		const require = createRequire(import.meta.url);
		const manifest = require.resolve('@deepseek-ai/node-addon-system-' + process.platform + '-' + process.arch + '/package.json');
		const addon = require(join(dirname(manifest), 'bin', filename));
		const lock = (fd) => new Promise((resolve) => addon.tryLock(fd, resolve));
		const first = await open('session.lock', 'w');
		const second = await open('session.lock', 'w');
		const taken = await lock(first.fd);
		const contended = await lock(second.fd);
		await first.close();
		const retaken = await lock(second.fd);
		await second.close();
		globalThis.result = [taken, getSystemErrorName(-contended), retaken].join(',');
	`)
	if got != "0,EAGAIN,0" && got != "0,EWOULDBLOCK,0" {
		t.Fatalf("flock through the addon: got %q, want 0,EAGAIN,0", got)
	}
}

// Any other native addon is refused by name, not loaded and not guessed at.
func TestOtherNativeAddonsAreRefused(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { createRequire } from 'node:module';
		try { createRequire(import.meta.url)('some-package/build/Release/thing.node'); globalThis.result = 'loaded'; }
		catch (error) { globalThis.result = error.code; }
	`)
	if got != "ERR_DLOPEN_FAILED" {
		t.Fatalf("a foreign addon: got %q", got)
	}
}

// readline splits a stream into lines, as events and as an iterator.
func TestReadlineSplitsLines(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { createInterface } from 'node:readline';
		import { Readable } from 'node:stream';
		const input = Readable.from(['alpha\nbe', 'ta\r\ngamma']);
		const lines = [];
		for await (const line of createInterface({ input, crlfDelay: Infinity })) lines.push(line);
		globalThis.result = lines.join('|');
	`)
	if got != "alpha|beta|gamma" {
		t.Fatalf("readline: got %q", got)
	}
}

// A Worker runs its CommonJS script with its own workerData and parentPort,
// answers through a cloned message, and exits once its port closes — the
// whole contract dsh-session-persistence-jsonl's migration verifier relies on.
func TestWorkerRunsAScriptOnThisLoop(t *testing.T) {
	script := `
		const { parentPort, workerData, isMainThread } = require('node:worker_threads');
		const { join } = require('node:path');
		parentPort.postMessage({ ok: !isMainThread, sum: workerData.a + workerData.b, path: join('a', 'b') });
		parentPort.close();
	`
	rt, _ := newRuntime(t, nodecompat.Options{Virtual: map[string]string{"dsh:/modules/x/worker.cjs": script}})
	got := run(t, rt, `
		import { Worker, isMainThread } from 'node:worker_threads';
		const worker = new Worker(new URL('./x/worker.cjs', 'dsh:/modules/x.mjs'), { workerData: { a: 2, b: 3 } });
		const message = await new Promise((resolve, reject) => { worker.once('message', resolve); worker.once('error', reject); });
		const code = await new Promise((resolve) => worker.once('exit', resolve));
		globalThis.result = JSON.stringify({ main: isMainThread, message, code });
	`)
	want := `{"main":true,"message":{"ok":true,"sum":5,"path":"a/b"},"code":0}`
	if got != want {
		t.Fatalf("worker: got %s, want %s", got, want)
	}
}

// A worker whose script throws reports it as 'error' and exits non-zero, which
// is how the verifier's caller tells a crash from an answer.
func TestWorkerFailureIsReported(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{Virtual: map[string]string{"dsh:/w.cjs": `throw new Error('boom')`}})
	got := run(t, rt, `
		import { Worker } from 'node:worker_threads';
		const worker = new Worker('dsh:/w.cjs');
		const error = await new Promise((resolve) => worker.once('error', resolve));
		const code = await new Promise((resolve) => worker.once('exit', resolve));
		globalThis.result = error.message + ':' + code;
	`)
	if got != "boom:1" {
		t.Fatalf("worker failure: got %q", got)
	}
}

// DOMException is a global, and the reasons AbortSignal invents are instances
// of it — the shape code that tells a cancellation from a failure checks for.
func TestDOMException(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		const plain = new DOMException('gone', 'AbortError');
		const aborted = AbortSignal.abort().reason;
		const controller = new AbortController();
		controller.abort();
		globalThis.result = [
			plain instanceof Error, plain.name, plain.code, plain.message,
			aborted instanceof DOMException, aborted.name,
			controller.signal.reason instanceof DOMException,
			DOMException.ABORT_ERR, Object.prototype.toString.call(plain),
		].join(',');
	`)
	want := "true,AbortError,20,gone,true,AbortError,true,20,[object DOMException]"
	if got != want {
		t.Fatalf("DOMException: got %q, want %q", got, want)
	}
}

// The shape the session backend migrates a log through: rows from a generator,
// a streaming zstd compressor with the checksum on, and an async function that
// consumes the compressed bytes. What comes out is one checksummed frame that
// decodes to exactly what went in.
func TestZstdStreamThroughAPipeline(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { createZstdCompress, zstdDecompressSync, constants } from 'node:zlib';
		import { Readable, pipeline } from 'node:stream';
		function* rows() { for (let i = 0; i < 2000; i += 1) yield Buffer.from('{"seq":' + i + '}\n'); }
		const chunks = [];
		await new Promise((resolve, reject) => {
			pipeline(Readable.from(rows()), createZstdCompress({ params: { [constants.ZSTD_c_checksumFlag]: 1 } }),
				async (source) => { for await (const chunk of source) chunks.push(chunk); },
				(error) => (error ? reject(error) : resolve()));
		});
		const compressed = Buffer.concat(chunks);
		const text = zstdDecompressSync(compressed).toString();
		const descriptor = compressed.readUInt8(4);
		globalThis.result = [text.split('\n').length - 1, text.endsWith('{"seq":1999}\n'), (descriptor & 4) !== 0].join(',');
	`)
	if got != "2000,true,true" {
		t.Fatalf("zstd stream: got %q, want 2000 rows, the last intact, checksum flag set", got)
	}
}

// A stage that fails rejects the pipeline instead of leaving it waiting for an
// end that never comes, and the promise form treats a trailing function as a
// stage rather than a callback.
func TestPipelineFailureAndPromiseForm(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { Readable, Transform } from 'node:stream';
		import { pipeline } from 'node:stream/promises';
		const failing = new Transform({ transform(chunk, enc, cb) { cb(new Error('stage broke')); } });
		let first;
		try { await pipeline(Readable.from(['a']), failing, async (source) => { for await (const _ of source) {} }); first = 'resolved'; }
		catch (error) { first = error.message; }
		let total = 0;
		await pipeline(Readable.from([Buffer.from('ab'), Buffer.from('cde')]), async (source) => { for await (const c of source) total += c.length; });
		globalThis.result = first + ',' + total;
	`)
	if got != "stage broke,5" {
		t.Fatalf("pipeline: got %q", got)
	}
}

// A frame the writer never finished decodes as far as it goes when asked with
// finishFlush: ZSTD_e_flush, and is an error otherwise. "As far as it goes" is
// whole blocks: the decoder withholds a frame's last block until the frame
// ends, so what comes back is always a clean prefix of the original — possibly
// empty for a small frame, which crash recovery reads as "nothing salvageable
// in the torn tail" rather than as half a record.
func TestZstdTornFrame(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	got := run(t, rt, `
		import { zstdCompressSync, zstdDecompressSync, constants } from 'node:zlib';
		const original = Buffer.from('x'.repeat(100000) + 'abcdefghij'.repeat(50000));
		const whole = zstdCompressSync(original);
		const torn = whole.subarray(0, whole.length - 50);
		let strict;
		try { zstdDecompressSync(torn); strict = 'decoded'; } catch { strict = 'refused'; }
		const salvaged = zstdDecompressSync(torn, { finishFlush: constants.ZSTD_e_flush });
		const prefix = original.subarray(0, salvaged.length).equals(salvaged);
		globalThis.result = [strict, salvaged.length > 0, salvaged.length < original.length, prefix].join(',');
	`)
	if got != "refused,true,true,true" {
		t.Fatalf("torn frame: got %q", got)
	}
}

// A stat result crosses a structured clone with its data intact, as Node's
// does — the session backend posts one back from its migration verifier — and
// is an instance of fs.Stats with its methods on the prototype.
func TestStatsAreCloneable(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "f.txt"), []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}
	rt, _ := newRuntime(t, nodecompat.Options{CWD: dir, Roots: []string{dir}})
	got := run(t, rt, `
		import { statSync, Stats } from 'node:fs';
		import { stat } from 'node:fs/promises';
		const plain = statSync('f.txt');
		const big = await stat('f.txt', { bigint: true });
		const copy = structuredClone({ identity: big });
		globalThis.result = [
			plain instanceof Stats, plain.isFile(), plain.isDirectory(), plain.size,
			typeof copy.identity.ino, copy.identity.size === 5n, typeof copy.identity.mtimeNs,
			'isFile' in copy.identity, Object.keys(plain).includes('isFile'),
		].join(',');
	`)
	want := "true,true,false,5,bigint,true,bigint,false,false"
	if got != want {
		t.Fatalf("stats: got %q, want %q", got, want)
	}
}
