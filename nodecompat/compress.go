package nodecompat

// Compression.
//
// zstd is the one that has to be here: the session log is JSONL compressed with
// it, so a robot that cannot decompress zstd cannot read back a session it wrote
// five minutes ago. gzip and deflate come along because they are in the standard
// library and because HTTP responses arrive in them.
//
// Everything is one-shot. Node's zlib is stream-shaped, and the shim wraps these
// to look that way, but a streaming codec across the language boundary would
// mean holding a codec's state in Go on behalf of a JavaScript object with no
// reliable moment to release it. A session file is megabytes, not gigabytes.

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"compress/zlib"
	"fmt"
	"io"

	"github.com/klauspost/compress/zstd"
)

// Synchronous, like the filesystem bindings and for the same reason: the
// promise-shaped API is built on top of these in the shim, and a session log
// record is kilobytes. See fs.go.
func (c *Compat) compressBindings() map[string]any {
	return map[string]any{
		"zstdCompress":   zstdCompress,
		"zstdDecompress": zstdDecompress,
		"gzip":           gzipCompress,
		"gunzip":         gzipDecompress,
		"deflate":        func(b []byte, level int) ([]byte, error) { return deflateCompress(b, level, true) },
		"inflate":        func(b []byte) ([]byte, error) { return inflateDecompress(b, true) },
		"deflateRaw":     func(b []byte, level int) ([]byte, error) { return deflateCompress(b, level, false) },
		"inflateRaw":     func(b []byte) ([]byte, error) { return inflateDecompress(b, false) },
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
