package nodecompat

// Compression.
//
// zstd is the one that has to be here: the session log is JSONL compressed with
// it, so a runtime that cannot decompress zstd cannot read back a session it
// wrote five minutes ago. gzip and deflate come along because they are in the standard
// library and because HTTP responses arrive in them.
//
// Everything is one-shot except zstd compression, which also streams (see
// zstdStream below). Node's zlib is stream-shaped, and the shim wraps these to
// look that way; the one stream that is real exists because harness 0.1.5
// migrates every session log through createZstdCompress, and faking it by
// buffering the whole log would be a memory cost disguised as a stream. Its
// state lives in Go the way an open file's does: behind an id, released by an
// explicit end or destroy, and swept by Close for any a script abandoned.

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"compress/zlib"
	"errors"
	"fmt"
	"io"

	"github.com/klauspost/compress/zstd"
)

// Synchronous, like the filesystem bindings and for the same reason: the
// promise-shaped API is built on top of these in the shim, and a session log
// record is kilobytes. See fs.go.
func (c *Compat) compressBindings() map[string]any {
	return map[string]any{
		"zstdCompress":       zstdCompress,
		"zstdDecompress":     zstdDecompress,
		"zstdDecompressTorn": zstdDecompressTorn,
		"zstdStreamOpen":     c.zstdStreamOpen,
		"zstdStreamWrite":    c.zstdStreamWrite,
		"zstdStreamFlush":    c.zstdStreamFlush,
		"zstdStreamEnd":      c.zstdStreamEnd,
		"zstdStreamDestroy":  c.zstdStreamDestroy,
		"gzip":               gzipCompress,
		"gunzip":             gzipDecompress,
		"deflate":            func(b []byte, level int) ([]byte, error) { return deflateCompress(b, level, true) },
		"inflate":            func(b []byte) ([]byte, error) { return inflateDecompress(b, true) },
		"deflateRaw":         func(b []byte, level int) ([]byte, error) { return deflateCompress(b, level, false) },
		"inflateRaw":         func(b []byte) ([]byte, error) { return inflateDecompress(b, false) },
	}
}

// zstdEncoders are shared: building one allocates window buffers, and the
// session writer compresses a record at a time.
var (
	zstdEnc *zstd.Encoder
	zstdDec *zstd.Decoder
)

func zstdCompress(data []byte, level int) ([]byte, error) {
	if zstdEnc == nil {
		e, err := zstd.NewWriter(nil, zstd.WithEncoderLevel(zstdLevel(level)))
		if err != nil {
			return nil, err
		}
		zstdEnc = e
	}
	return zstdEnc.EncodeAll(data, nil), nil
}

func zstdDecompress(data []byte) ([]byte, error) {
	if zstdDec == nil {
		d, err := zstd.NewReader(nil)
		if err != nil {
			return nil, err
		}
		zstdDec = d
	}
	out, err := zstdDec.DecodeAll(data, nil)
	if err != nil {
		return nil, fmt.Errorf("zstd: %w", err)
	}
	return out, nil
}

// zstdLevel maps zstd's 1..22 onto the four the encoder offers, which is what
// it does internally anyway.
func zstdLevel(level int) zstd.EncoderLevel {
	switch {
	case level <= 0:
		return zstd.SpeedDefault
	case level <= 2:
		return zstd.SpeedFastest
	case level <= 7:
		return zstd.SpeedDefault
	case level <= 12:
		return zstd.SpeedBetterCompression
	default:
		return zstd.SpeedBestCompression
	}
}

func gzipCompress(data []byte, level int) ([]byte, error) {
	var buf bytes.Buffer
	w, err := gzip.NewWriterLevel(&buf, clampLevel(level, gzip.DefaultCompression, gzip.BestCompression))
	if err != nil {
		return nil, err
	}
	if _, err := w.Write(data); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func gzipDecompress(data []byte) ([]byte, error) {
	r, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer r.Close()
	return io.ReadAll(r)
}

func deflateCompress(data []byte, level int, withHeader bool) ([]byte, error) {
	var buf bytes.Buffer
	var w io.WriteCloser
	var err error
	if withHeader {
		w, err = zlib.NewWriterLevel(&buf, clampLevel(level, zlib.DefaultCompression, zlib.BestCompression))
	} else {
		w, err = flate.NewWriter(&buf, clampLevel(level, flate.DefaultCompression, flate.BestCompression))
	}
	if err != nil {
		return nil, err
	}
	if _, err := w.Write(data); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func inflateDecompress(data []byte, withHeader bool) ([]byte, error) {
	if withHeader {
		r, err := zlib.NewReader(bytes.NewReader(data))
		if err != nil {
			return nil, err
		}
		defer r.Close()
		return io.ReadAll(r)
	}
	r := flate.NewReader(bytes.NewReader(data))
	defer r.Close()
	return io.ReadAll(r)
}

func clampLevel(level, def, max int) int {
	if level <= 0 {
		return def
	}
	if level > max {
		return max
	}
	return level
}

// zstdDecompressTorn decodes as much of a stream as is intact and returns it,
// stopping quietly at a frame the writer never finished. That is Node's
// `finishFlush: ZSTD_e_flush` — the session backend's crash recovery reads the
// torn tail of a log this way, to salvage the records before the tear.
func zstdDecompressTorn(data []byte) ([]byte, error) {
	d, err := zstd.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer d.Close()
	out, err := io.ReadAll(d)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
		return out, fmt.Errorf("zstd: %w", err)
	}
	return out, nil
}

// zstdStream is one streaming encoder: what it has compressed so far waits in
// buf until the shim collects it, so memory is bounded by the encoder's block,
// not by the stream.
type zstdStream struct {
	enc *zstd.Encoder
	buf bytes.Buffer
}

func (c *Compat) zstdStreamOpen(level int, checksum bool) (int64, error) {
	stream := &zstdStream{}
	enc, err := zstd.NewWriter(&stream.buf,
		zstd.WithEncoderLevel(zstdLevel(level)),
		zstd.WithEncoderCRC(checksum),
		zstd.WithEncoderConcurrency(1))
	if err != nil {
		return 0, err
	}
	stream.enc = enc
	id := c.id()
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.closed {
		enc.Close()
		return 0, fmt.Errorf("nodecompat: runtime is closed")
	}
	c.encoders[id] = stream
	return id, nil
}

func (c *Compat) encoder(id int64) (*zstdStream, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	stream, ok := c.encoders[id]
	if !ok {
		return nil, fmt.Errorf("zstd: stream %d is closed", id)
	}
	return stream, nil
}

// drain hands over what the encoder has produced so far.
func (s *zstdStream) drain() []byte {
	out := append([]byte(nil), s.buf.Bytes()...)
	s.buf.Reset()
	return out
}

func (c *Compat) zstdStreamWrite(id int64, data []byte) ([]byte, error) {
	stream, err := c.encoder(id)
	if err != nil {
		return nil, err
	}
	if _, err := stream.enc.Write(data); err != nil {
		return nil, fmt.Errorf("zstd: %w", err)
	}
	return stream.drain(), nil
}

func (c *Compat) zstdStreamFlush(id int64) ([]byte, error) {
	stream, err := c.encoder(id)
	if err != nil {
		return nil, err
	}
	if err := stream.enc.Flush(); err != nil {
		return nil, fmt.Errorf("zstd: %w", err)
	}
	return stream.drain(), nil
}

// zstdStreamEnd finishes the frame — checksum included — and releases the
// encoder.
func (c *Compat) zstdStreamEnd(id int64) ([]byte, error) {
	stream, err := c.encoder(id)
	if err != nil {
		return nil, err
	}
	c.mu.Lock()
	delete(c.encoders, id)
	c.mu.Unlock()
	if err := stream.enc.Close(); err != nil {
		return nil, fmt.Errorf("zstd: %w", err)
	}
	return stream.drain(), nil
}

func (c *Compat) zstdStreamDestroy(id int64) {
	c.mu.Lock()
	stream, ok := c.encoders[id]
	delete(c.encoders, id)
	c.mu.Unlock()
	if ok {
		stream.enc.Close()
	}
}
