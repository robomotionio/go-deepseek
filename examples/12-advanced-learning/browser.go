package main

// The browser: `open` and `submit`, in Go.
//
// The agent has no other way to reach anything. `@deepseek-ai/dsh-tool-web` is
// in the bundle but injects `web`, which nothing here provides, so it mounts
// nothing and the agent has no network at all until this component gives it
// one — the same dependency-topology fact example 05 shows and example 10 uses.
//
// What a browser is, for an RPA, is a smaller thing than a browser: a session
// that persists, a way to follow a link, and a way to submit a form. That is
// what these two are. There is no JavaScript engine behind them and no DOM;
// pages come back as text, with their links and their form fields listed,
// because those are the two things the next step is chosen from.
//
// The fence is a Go decision. Every URL is resolved against one origin and
// anything else is refused with a reason the model can read — so an agent that
// wanders cannot wander off the machine.

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/robomotionio/go-deepseek/sdk"
)

// pageBudget caps what one page may contribute to the conversation. A portal
// that answered with a megabyte would cost the turn its context, and an agent
// that cannot see the end of a page is better told so than quietly given half.
const pageBudget = 6000

type browser struct {
	base   *url.URL
	client *http.Client

	mu    sync.Mutex
	calls int
}

func newBrowser(base string) *browser {
	parsed, err := url.Parse(base)
	if err != nil {
		panic(err) // the base is this program's own listener address
	}
	jar, _ := cookiejar.New(nil)
	return &browser{
		base: parsed,
		// The jar is what makes a session a session. Without it every request
		// would be a fresh visitor and the agent would sign in forever.
		client: &http.Client{Jar: jar, Timeout: 20 * time.Second},
	}
}

func (b *browser) plugin() sdk.Plugin {
	return sdk.Plugin{
		ID:     "browser",
		Inject: []string{"tools"},
		Apply: func(ctx *sdk.Context) error {
			if err := ctx.RegisterTool(sdk.Tool{
				Name: "open",
				Description: "Fetch a page from the portal and read it back as text, with every " +
					"link and every form field on it listed. This is the only way to see the " +
					"site; there is no other browser and no network beyond it.",
				Parameters: map[string]any{
					"url": map[string]any{
						"type": "string", "required": true,
						"description": `A path such as "/timeoff?page=2", or a full URL on the same host.`,
					},
				},
				Execute: b.open,
			}); err != nil {
				return err
			}
			return ctx.RegisterTool(sdk.Tool{
				Name: "submit",
				Description: "Submit a form on the portal and read the resulting page back. Send " +
					"every field the form declares, including hidden ones — a form submitted " +
					"without its hidden fields is usually refused.",
				Parameters: map[string]any{
					"url": map[string]any{
						"type": "string", "required": true,
						"description": `The form's action, e.g. "/timeoff/TOR-2041/decide".`,
					},
					"fields": map[string]any{
						"type": "string", "required": true,
						"description": "The fields, either as a JSON object — " +
							`{"token": "…", "decision": "deny", "reason": "rule 2 …"} — or one ` +
							"per line as name=value. Prefer the JSON form: a value that itself " +
							"contains newlines or & cannot survive the name=value form.",
					},
					"method": map[string]any{
						"type":        "string",
						"description": `"POST" (the default) or "GET".`,
					},
				},
				Execute: b.submit,
			})
		},
	}
}

func (b *browser) open(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	target, err := b.resolve(in.URL)
	if err != nil {
		return "", err
	}
	return b.fetch(http.MethodGet, target, nil)
}

func (b *browser) submit(_ context.Context, args json.RawMessage) (string, error) {
	var in struct {
		URL    string `json:"url"`
		Fields string `json:"fields"`
		Method string `json:"method"`
	}
	if err := json.Unmarshal(args, &in); err != nil {
		return "", err
	}
	target, err := b.resolve(in.URL)
	if err != nil {
		return "", err
	}
	form := parseFields(in.Fields)
	if len(form) == 0 {
		return "", fmt.Errorf("no fields to submit; give them as name=value, one per line")
	}
	if strings.EqualFold(in.Method, "GET") {
		target.RawQuery = form.Encode()
		return b.fetch(http.MethodGet, target, nil)
	}
	return b.fetch(http.MethodPost, target, form)
}

// resolve puts one URL inside the fence, or explains why it will not.
func (b *browser) resolve(raw string) (*url.URL, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, fmt.Errorf("no url given")
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("%q is not a url: %w", raw, err)
	}
	target := b.base.ResolveReference(parsed)
	if target.Host != b.base.Host || target.Scheme != b.base.Scheme {
		// The refusal names what IS reachable, because a model told only "no"
		// tries a variation of the same thing.
		return nil, fmt.Errorf("this browser reaches %s and nothing else, so %q is refused",
			b.base.String(), raw)
	}
	return target, nil
}

func (b *browser) fetch(method string, target *url.URL, form url.Values) (string, error) {
	b.mu.Lock()
	b.calls++
	b.mu.Unlock()

	var body io.Reader
	if form != nil {
		body = strings.NewReader(form.Encode())
	}
	req, err := http.NewRequest(method, target.String(), body)
	if err != nil {
		return "", err
	}
	if form != nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}

	res, err := b.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("%s %s: %w", method, target.Path, err)
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return "", err
	}

	// A 4xx is not a tool failure — it is the portal answering, and the answer
	// usually says what was wrong with the request. Handing it back as text
	// gets a corrected retry; raising it as an error gets a shrug.
	return render(method, target, res, string(raw)), nil
}

// ---- turning a page into something worth reading ----------------------------

var (
	dropTags  = regexp.MustCompile(`(?is)<(script|style|head)\b[^>]*>.*?</(script|style|head)>`)
	breakTags = regexp.MustCompile(`(?i)</(p|div|li|ul|ol|h1|h2|h3|h4|h5|h6|dt|dd|dl|tr|form|pre)>|<br\s*/?>`)
	anyTag    = regexp.MustCompile(`(?s)<[^>]*>`)
	linkTag   = regexp.MustCompile(`(?is)<a\b[^>]*href\s*=\s*"([^"]*)"[^>]*>(.*?)</a>`)
	formTag   = regexp.MustCompile(`(?is)<form\b([^>]*)>(.*?)</form>`)
	inputTag  = regexp.MustCompile(`(?is)<(input|textarea|select)\b([^>]*)>`)
	attr      = regexp.MustCompile(`(?is)([a-z-]+)\s*=\s*"([^"]*)"`)
	blankRun  = regexp.MustCompile(`\n{3,}`)
)

func render(method string, asked *url.URL, res *http.Response, body string) string {
	var out strings.Builder
	fmt.Fprintf(&out, "%s %s → %s\n", method, asked.RequestURI(), res.Status)
	// Redirects are followed, so say where the page actually came from — but
	// only when that is news. An agent that posted a login wants to know it
	// landed on the desk; one that fetched a page it got does not.
	if final := res.Request.URL.RequestURI(); final != asked.RequestURI() {
		out.WriteString("redirected to " + final + "\n")
	}

	out.WriteString("\n--- text ---\n")
	out.WriteString(clipTo(textOf(body), pageBudget))

	if links := linksOf(body); len(links) > 0 {
		out.WriteString("\n\n--- links ---\n")
		for _, link := range links {
			out.WriteString("  " + link + "\n")
		}
	}
	if forms := formsOf(body); len(forms) > 0 {
		out.WriteString("\n\n--- forms ---\n")
		out.WriteString(strings.Join(forms, "\n"))
		out.WriteString("\n")
	}
	return out.String()
}

func textOf(body string) string {
	text := dropTags.ReplaceAllString(body, "")
	text = breakTags.ReplaceAllString(text, "\n")
	text = anyTag.ReplaceAllString(text, "")
	text = html.UnescapeString(text)

	lines := strings.Split(text, "\n")
	for i, line := range lines {
		lines[i] = strings.TrimRight(strings.TrimLeft(line, " \t"), " \t\r")
	}
	return strings.TrimSpace(blankRun.ReplaceAllString(strings.Join(lines, "\n"), "\n\n"))
}

func linksOf(body string) []string {
	var out []string
	seen := map[string]bool{}
	for _, match := range linkTag.FindAllStringSubmatch(body, -1) {
		href := html.UnescapeString(match[1])
		label := strings.Join(strings.Fields(textOf(match[2])), " ")
		line := fmt.Sprintf("%-34s %s", href, label)
		if seen[line] {
			continue
		}
		seen[line] = true
		out = append(out, line)
	}
	return out
}

// formsOf lists each form as its action, its method and every field it
// declares, hidden ones included — which is the whole reason this exists,
// because a hidden token is invisible in the text and required by the POST.
func formsOf(body string) []string {
	var out []string
	for i, match := range formTag.FindAllStringSubmatch(body, -1) {
		open := attrsOf(match[1])
		method := strings.ToUpper(open["method"])
		if method == "" {
			method = "GET"
		}
		var lines []string
		lines = append(lines, fmt.Sprintf("  form %d: %s %s", i+1, method, open["action"]))
		for _, field := range inputTag.FindAllStringSubmatch(match[2], -1) {
			f := attrsOf(field[2])
			if f["name"] == "" {
				continue
			}
			kind := f["type"]
			if kind == "" {
				kind = "text"
			}
			note := ""
			if f["value"] != "" {
				note = fmt.Sprintf(" = %q", html.UnescapeString(f["value"]))
			}
			lines = append(lines, fmt.Sprintf("    %-10s (%s)%s", f["name"], kind, note))
		}
		out = append(out, strings.Join(lines, "\n"))
	}
	return out
}

func attrsOf(fragment string) map[string]string {
	found := map[string]string{}
	for _, match := range attr.FindAllStringSubmatch(fragment, -1) {
		found[strings.ToLower(match[1])] = match[2]
	}
	return found
}

// parseFields reads whichever of the two shapes a model wrote.
//
// The JSON object is the one that always works. The name=value form is the one
// a model reaches for anyway, so it is accepted too — but it cannot express a
// value containing a newline, because a newline is how it separates fields, and
// that ambiguity is unresolvable rather than merely unhandled.
func parseFields(raw string) url.Values {
	form := url.Values{}

	trimmed := strings.TrimSpace(raw)
	if strings.HasPrefix(trimmed, "{") {
		var object map[string]any
		if json.Unmarshal([]byte(trimmed), &object) == nil {
			for name, value := range object {
				form.Set(name, fmt.Sprint(value))
			}
			return form
		}
	}

	for _, line := range strings.FieldsFunc(raw, func(r rune) bool { return r == '\n' || r == '&' }) {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		name, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		// A model that URL-encoded its own value should not be punished for it,
		// and one that did not should not be broken by it.
		if decoded, err := url.QueryUnescape(value); err == nil && strings.Contains(value, "%") {
			value = decoded
		}
		form.Set(name, strings.TrimSpace(value))
	}
	return form
}

func clipTo(s string, budget int) string {
	if len(s) <= budget {
		return s
	}
	return s[:budget] + fmt.Sprintf("\n… (%d more bytes on this page)", len(s)-budget)
}
