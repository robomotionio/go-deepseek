package nodecompat

// fetch.
//
// The response body is the part that decides the shape of everything else. An
// LLM stream arrives as server-sent events over a connection that stays open for
// the length of the answer, so a binding that returned the whole body would turn
// a streamed reply into a long silence and then a wall of text. The body
// therefore stays open on the Go side behind a handle, and the shim reads it a
// chunk at a time into a ReadableStream.
//
// Cancellation is real for the same reason: an AbortSignal that only stopped
// JavaScript from listening would leave the request running and the tokens
// billing.

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/robomotionio/goant"
)

// bodyReader is a response whose body is still arriving.
type bodyReader struct {
	resp   *http.Response
	cancel context.CancelFunc
	buf    []byte
}

func (b *bodyReader) close() {
	if b.resp != nil && b.resp.Body != nil {
		b.resp.Body.Close()
	}
	if b.cancel != nil {
		b.cancel()
	}
}

func (c *Compat) httpBindings() map[string]any {
	return map[string]any{
		"fetch":  c.httpFetch,
		"read":   c.httpRead,
		"cancel": c.httpCancel,
		"abort":  c.httpAbort,
	}
}

// httpFetch performs the request and returns as soon as the headers are in,
// which is what fetch promises: the Response resolves at the head, not at the
// end of the body.
//
// requestID is the handle an abort refers to. It is allocated by the shim before
// the call, because a signal may already be aborted by the time we get here and
// there would otherwise be nothing to abort.
func (c *Compat) httpFetch(req map[string]any) goant.Value {
	method, _ := req["method"].(string)
	rawURL, _ := req["url"].(string)
	headers := stringList(req["headers"])
	body := byteSlice(req["body"])
	requestID := int64(toFloat(req["requestId"]))
	redirect, _ := req["redirect"].(string)

	c.traceHTTP("fetch", requestID, method+" "+rawURL)
	p, resolve, reject := c.rt.NewPromise()
	go func() {
		res, err := c.doFetch(method, rawURL, headers, body, requestID, redirect)
		if err != nil {
			reject(err)
			return
		}
		resolve(res)
	}()
	return p
}

func (c *Compat) doFetch(method, rawURL string, headers []string, body []byte, requestID int64, redirect string) (map[string]any, error) {
	if method == "" {
		method = "GET"
	}
	ctx, cancel := context.WithCancel(context.Background())
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		cancel()
		return nil, fmt.Errorf("nodecompat: runtime is closed")
	}
	if requestID != 0 {
		c.cancels[requestID] = cancel
	}
	c.mu.Unlock()

	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	httpReq, err := http.NewRequestWithContext(ctx, method, rawURL, reader)
	if err != nil {
		c.forget(requestID)
		cancel()
		return nil, err
	}
	for i := 0; i+1 < len(headers); i += 2 {
		// Add, not Set: a header may legitimately repeat (Set-Cookie, Accept),
		// and collapsing repeats is a change the caller did not ask for.
		httpReq.Header.Add(headers[i], headers[i+1])
	}
	if httpReq.Header.Get("Accept-Encoding") == "" {
		// Let the transport negotiate and decompress. Setting it by hand turns
		// off Go's transparent gzip and hands the script bytes it cannot read.
		httpReq.Header.Del("Accept-Encoding")
	}

	client := c.opts.HTTPClient
	if redirect == "manual" || redirect == "error" {
		clone := *client
		clone.CheckRedirect = func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		}
		client = &clone
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		c.forget(requestID)
		cancel()
		if ctx.Err() != nil {
			return nil, fmt.Errorf("AbortError: the operation was aborted")
		}
		return nil, fmt.Errorf("fetch failed: %w", err)
	}
	if redirect == "error" && resp.StatusCode >= 300 && resp.StatusCode < 400 {
		resp.Body.Close()
		c.forget(requestID)
		cancel()
		return nil, fmt.Errorf("fetch failed: redirect was not allowed")
	}

	br := &bodyReader{resp: resp, cancel: cancel}
	bodyID := c.id()
	c.mu.Lock()
	if c.closed {
		c.mu.Unlock()
		br.close()
		return nil, fmt.Errorf("nodecompat: runtime is closed")
	}
	c.bodies[bodyID] = br
	c.mu.Unlock()

	c.traceHTTP("response", bodyID, fmt.Sprintf("%d %s", resp.StatusCode, resp.Header.Get("content-type")))
	out := map[string]any{
		"status":     resp.StatusCode,
		"statusText": statusText(resp),
		"url":        resp.Request.URL.String(),
		"headers":    headerList(resp.Header),
		"bodyId":     bodyID,
		"redirected": resp.Request.URL.String() != rawURL,
	}
	return out, nil
}

func (c *Compat) forget(requestID int64) {
	if requestID == 0 {
		return
	}
	c.mu.Lock()
	delete(c.cancels, requestID)
	c.mu.Unlock()
}

// read is asked for by the shim once per pull. A trace of these against the
// chunks below is what tells a stalled stream (no read outstanding, no EOF seen)
// from a slow one.
//
// httpRead returns the next chunk, or null at the end of the body. Chunks are
// whatever the transport hands over rather than a fixed size: an SSE stream
// arrives event by event, and re-chunking it would only add latency.
func (c *Compat) httpRead(bodyID int64) goant.Value {
	return c.async(func() (any, error) {
		c.mu.Lock()
		br, ok := c.bodies[bodyID]
		c.mu.Unlock()
		if !ok {
			return nil, nil // already drained or cancelled: EOF is the honest answer
		}
		if br.buf == nil {
			br.buf = make([]byte, 32*1024)
		}
		// Read until there are bytes or an error. A Reader may return (0, nil) —
		// io.Reader says so explicitly, and an HTTP body being read as it arrives
		// does — and treating that as the end truncated the stream: the SSE
		// parser downstream then waited forever for the rest of an event that had
		// already been cut off. The whole turn hung on it.
		var n int
		var err error
		for n == 0 && err == nil {
			n, err = br.resp.Body.Read(br.buf)
		}
		if n > 0 {
			chunk := make([]byte, n)
			copy(chunk, br.buf[:n])
			c.traceHTTP("chunk", bodyID, fmt.Sprintf("%d bytes", n))
			return chunk, nil
		}
		if err == io.EOF {
			c.traceHTTP("eof", bodyID, "")
			c.dropBody(bodyID)
			return nil, nil
		}
		c.traceHTTP("error", bodyID, err.Error())
		c.dropBody(bodyID)
		if strings.Contains(err.Error(), "context canceled") {
			return nil, fmt.Errorf("AbortError: the operation was aborted")
		}
		return nil, err
	})
}

func (c *Compat) httpCancel(bodyID int64) {
	c.traceHTTP("cancel", bodyID, "")
	c.dropBody(bodyID)
}

func (c *Compat) traceHTTP(step string, id int64, detail string) {
	if c.opts.TraceHTTP != nil {
		c.opts.TraceHTTP(step, id, detail)
	}
}

func (c *Compat) dropBody(bodyID int64) {
	c.mu.Lock()
	br, ok := c.bodies[bodyID]
	delete(c.bodies, bodyID)
	c.mu.Unlock()
	if ok {
		br.close()
	}
}

// httpAbort cancels an in-flight request. Aborting one that has already
// finished is not an error — a signal fires whether or not anyone is still
// waiting on it.
func (c *Compat) httpAbort(requestID int64) {
	c.mu.Lock()
	cancel, ok := c.cancels[requestID]
	delete(c.cancels, requestID)
	c.mu.Unlock()
	if ok {
		cancel()
	}
}

func statusText(resp *http.Response) string {
	if _, text, ok := strings.Cut(resp.Status, " "); ok {
		return text
	}
	return resp.Status
}

// headerList flattens headers into [k, v, k, v]. A map would lose both order
// and repeats, and Set-Cookie is the case where losing repeats loses data.
func headerList(h http.Header) []string {
	var out []string
	for name, values := range h {
		for _, v := range values {
			out = append(out, strings.ToLower(name), v)
		}
	}
	return out
}

// --- conversion helpers ------------------------------------------------------
//
// A host function taking `map[string]any` receives whatever the script built, so
// these read defensively: a missing key is the zero value, not a panic.

func stringList(v any) []string {
	list, ok := v.([]any)
	if !ok {
		if s, ok := v.([]string); ok {
			return s
		}
		return nil
	}
	out := make([]string, 0, len(list))
	for _, item := range list {
		out = append(out, fmt.Sprint(item))
	}
	return out
}

func byteSlice(v any) []byte {
	switch x := v.(type) {
	case nil:
		return nil
	case []byte:
		return x
	case string:
		return []byte(x)
	case []any:
		out := make([]byte, len(x))
		for i, n := range x {
			out[i] = byte(toFloat(n))
		}
		return out
	}
	return nil
}

func toFloat(v any) float64 {
	switch x := v.(type) {
	case float64:
		return x
	case int:
		return float64(x)
	case int64:
		return float64(x)
	case string:
		var f float64
		fmt.Sscanf(x, "%g", &f)
		return f
	}
	return 0
}
