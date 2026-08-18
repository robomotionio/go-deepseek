package nodecompat

// Hashing, HMAC and randomness.
//
// Only the primitives are here. Everything shaped like an API — the streaming
// Hash object with update/digest, the hex and base64 spellings of a digest, the
// webcrypto wrappers — is in the shim, because it is bookkeeping rather than
// cryptography and Go has no advantage at it.

import (
	"crypto/hmac"
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"hash"
)

func (c *Compat) cryptoBindings() map[string]any {
	return map[string]any{
		"randomBytes": randomBytes,
		"randomUUID":  randomUUID,
		"hash":        hashBytes,
		"hmac":        hmacBytes,
		"timingSafeEqual": func(a, b []byte) bool {
			return subtle.ConstantTimeCompare(a, b) == 1
		},
		"algorithms": []string{"md5", "sha1", "sha256", "sha384", "sha512"},
	}
}

func randomBytes(n int) ([]byte, error) {
	if n < 0 || n > 1<<24 {
		return nil, fmt.Errorf("ERR_OUT_OF_RANGE: size is out of range")
	}
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return nil, err
	}
	return b, nil
}

// randomUUID is RFC 4122 version 4, from the same source as randomBytes. Node's
// is cached in blocks for speed; the difference does not matter at the rate an
// agent generates identifiers, and a simpler one is easier to be sure of.
func randomUUID() (string, error) {
	b, err := randomBytes(16)
	if err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}

func newHash(alg string) (hash.Hash, error) {
	switch normaliseAlg(alg) {
	case "md5":
		return md5.New(), nil
	case "sha1":
		return sha1.New(), nil
	case "sha256":
		return sha256.New(), nil
	case "sha384":
		return sha512.New384(), nil
	case "sha512":
		return sha512.New(), nil
	}
	return nil, fmt.Errorf("ERR_CRYPTO_INVALID_DIGEST: unsupported digest %q", alg)
}

// normaliseAlg accepts the spellings both APIs use: node says "sha256", the web
// crypto API says "SHA-256", and code that has been through both says either.
func normaliseAlg(alg string) string {
	out := make([]byte, 0, len(alg))
	for i := 0; i < len(alg); i++ {
		ch := alg[i]
		switch {
		case ch >= 'A' && ch <= 'Z':
			out = append(out, ch+'a'-'A')
		case ch == '-' || ch == '_':
		default:
			out = append(out, ch)
		}
	}
	return string(out)
}

func hashBytes(alg string, data []byte) ([]byte, error) {
	h, err := newHash(alg)
	if err != nil {
		return nil, err
	}
	h.Write(data)
	return h.Sum(nil), nil
}

func hmacBytes(alg string, key, data []byte) ([]byte, error) {
	if _, err := newHash(alg); err != nil {
		return nil, err
	}
	m := hmac.New(func() hash.Hash {
		h, _ := newHash(alg)
		return h
	}, key)
	m.Write(data)
	return m.Sum(nil), nil
}

func base64Encode(b []byte) string { return base64.StdEncoding.EncodeToString(b) }

// base64Decode accepts what Buffer.from(s, 'base64') accepts: padded or not,
// standard or URL alphabet, and whitespace anywhere. Being strict here would
// reject data that every other runtime reads.
func base64Decode(s string) ([]byte, error) {
	clean := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		switch ch := s[i]; ch {
		case ' ', '\t', '\r', '\n', '=':
		case '-':
			clean = append(clean, '+')
		case '_':
			clean = append(clean, '/')
		default:
			clean = append(clean, ch)
		}
	}
	return base64.RawStdEncoding.DecodeString(string(clean))
}

func hexEncode(b []byte) string { return hex.EncodeToString(b) }

// hexDecode stops at the first byte that is not hex, and returns what it read.
// That is Buffer.from(s, 'hex'), which truncates rather than throwing.
func hexDecode(s string) ([]byte, error) {
	if len(s)%2 == 1 {
		s = s[:len(s)-1]
	}
	out := make([]byte, 0, len(s)/2)
	for i := 0; i+1 < len(s); i += 2 {
		b, err := hex.DecodeString(s[i : i+2])
		if err != nil {
			break
		}
		out = append(out, b[0])
	}
	return out, nil
}
