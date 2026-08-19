package nodecompat_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
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

// The refusals are part of the contract: a capability that is missing on purpose
// should say so where the mistake was made.
func TestAbsentBuiltinsAreNamed(t *testing.T) {
	rt, _ := newRuntime(t, nodecompat.Options{})
	_, err := rt.RunModule("test:/main.mjs", `import cp from 'node:child_process';`)
	if err == nil {
		t.Fatal("expected child_process to be refused")
	}
	if !strings.Contains(err.Error(), "deliberately not implemented") {
		t.Fatalf("refusal did not explain itself: %v", err)
	}
}
