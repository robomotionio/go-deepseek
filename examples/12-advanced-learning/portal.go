package main

// The portal: a small HR web application, served by this program on loopback.
//
// Why a stand-in rather than a real site. The example has to be runnable by
// anyone who clones the repository, offline, with the same result every time —
// and it has to be VERIFIABLE, which is the harder half. Because the portal
// runs in this process, the assertions at the end read its own state directly
// rather than believing what the agent said it did. An agent cannot forge a
// struct it can only reach over HTTP.
//
// It is modelled on Workmonth HR from Robomotion's training universe — the same
// personas, the same GLX- worker ids, the same Pending/Approved/Denied states,
// the same credentials — because the point is a portal that behaves like the
// enterprise software an RPA actually meets.
//
// And it is deliberately AWKWARD, in the specific ways enterprise software is
// awkward: login fields named `u` and `p`, a session cookie, a per-page token
// that a POST is refused without, a paginated queue, the policy on a page
// nothing links to prominently, a strict format for a denial reason, and a bulk
// endpoint that exists but is not where you would look first. None of that is
// hard. It is just unknowable without going and finding out, which is exactly
// the cost this example is about paying once.

import (
	"fmt"
	"html"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// leave is one pending request, in Workmonth's vocabulary.
type leave struct {
	ID         string
	Worker     string
	WorkerID   string
	Department string
	Type       string // Annual, Sick, Unpaid
	Days       int
	Start      string // ISO date
	Notice     int    // days between the request and the start
	Balance    int    // the worker's remaining days

	Status string // Pending, Approved, Denied
	Reason string
}

// seeded is the queue, restored on every reset so both runs face the same work.
//
// Three approve and three deny, and each denial fails EXACTLY ONE rule — so the
// reason a run writes says which rule it actually applied, and a run that
// guessed cannot come out right by accident. TOR-2045 is the one that matters
// most: it is sick leave starting inside the blackout with no notice at all, so
// a run that skipped the exemption sentence in the policy denies it.
func seeded() []leave {
	return []leave{
		{ID: "TOR-2041", Worker: "Ayşe Demir", WorkerID: "GLX-1002", Department: "Finance",
			Type: "Annual", Days: 5, Start: "2026-09-14", Notice: 21, Balance: 12, Status: "Pending"},
		{ID: "TOR-2042", Worker: "Jonas Weber", WorkerID: "GLX-1004", Department: "Sales",
			Type: "Annual", Days: 10, Start: "2026-10-14", Notice: 45, Balance: 6, Status: "Pending"},
		{ID: "TOR-2043", Worker: "Tomás Oliveira", WorkerID: "GLX-1003", Department: "Ops",
			Type: "Annual", Days: 3, Start: "2026-09-15", Notice: 9, Balance: 15, Status: "Pending"},
		{ID: "TOR-2044", Worker: "Maria Santos", WorkerID: "GLX-1005", Department: "Ops",
			Type: "Annual", Days: 4, Start: "2026-10-28", Notice: 30, Balance: 18, Status: "Pending"},
		{ID: "TOR-2045", Worker: "Hiroshi Tanaka", WorkerID: "GLX-1001", Department: "Finance",
			Type: "Sick", Days: 2, Start: "2026-08-27", Notice: 0, Balance: 9, Status: "Pending"},
		{ID: "TOR-2046", Worker: "Elif Kaya", WorkerID: "GLX-1044", Department: "Warehouse",
			Type: "Annual", Days: 2, Start: "2026-11-03", Notice: 16, Balance: 4, Status: "Pending"},
	}
}

// verdict is the policy, in Go. The handbook page below states the same thing
// in prose for the agent to read; this is what the assertions check against, so
// the two have to agree and there is one place to change either.
//
// It answers with the decision and, for a denial, the rule that failed.
func verdict(r leave) (string, string) {
	annual := r.Type == "Annual"
	day, _ := strconv.Atoi(r.Start[8:10])
	switch {
	case r.Days > r.Balance:
		return "Denied", "rule 1"
	case annual && r.Notice < 14:
		return "Denied", "rule 2"
	case annual && (day >= 26 || day <= 2):
		return "Denied", "rule 3"
	}
	return "Approved", ""
}

const handbook = `Leave policy, effective 2026

Rule 1 (balance). The days requested may not exceed the worker's remaining balance.
Rule 2 (notice). Annual leave must be requested at least 14 days before it starts.
Rule 3 (month-end close). Annual leave may not START inside the close window, which runs
from the 26th of a month to the 2nd of the next.

Rule 1 applies to every type of leave.
Rules 2 and 3 apply to ANNUAL leave only. Sick and unpaid leave are exempt from both.

Approve a request only when every applicable rule passes. Otherwise deny it, and begin the
reason with the rule that failed, exactly: "rule 1", "rule 2" or "rule 3". A denial whose
reason begins with anything else is rejected.`

// portal is the running application.
type portal struct {
	base     string
	listener net.Listener
	server   *http.Server

	mu       sync.Mutex
	queue    []leave
	sessions map[string]bool
	trail    []string // every request served since the last reset
}

func newPortal() (*portal, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	p := &portal{
		base:     "http://" + listener.Addr().String(),
		listener: listener,
		queue:    seeded(),
		sessions: map[string]bool{},
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/", p.landing)
	mux.HandleFunc("/login", p.login)
	mux.HandleFunc("/desk", p.guard(p.desk))
	mux.HandleFunc("/handbook", p.guard(p.handbookIndex))
	mux.HandleFunc("/handbook/leave-policy", p.guard(p.policy))
	mux.HandleFunc("/timeoff", p.guard(p.queuePage))
	mux.HandleFunc("/timeoff/export", p.guard(p.export))
	mux.HandleFunc("/timeoff/bulk", p.guard(p.bulkPage))
	mux.HandleFunc("/timeoff/bulk-decide", p.guard(p.bulkDecide))
	mux.HandleFunc("/timeoff/", p.guard(p.record))

	p.server = &http.Server{Handler: p.record_(mux), ReadHeaderTimeout: 5 * time.Second}
	go p.server.Serve(listener)
	return p, nil
}

func (p *portal) close() { _ = p.server.Close() }

// reset restores the seeded queue and forgets every session. It is what makes
// the second run a fair repeat of the first rather than a continuation of it.
func (p *portal) reset() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.queue = seeded()
	p.sessions = map[string]bool{}
	p.trail = nil
}

// requests is what the portal was asked for since the last reset. It is the
// measurement the example is really about: the same work, in fewer trips.
func (p *portal) requests() []string {
	p.mu.Lock()
	defer p.mu.Unlock()
	return append([]string(nil), p.trail...)
}

func (p *portal) state() []leave {
	p.mu.Lock()
	defer p.mu.Unlock()
	return append([]leave(nil), p.queue...)
}

// record_ logs every request. Named for what it does to the middleware chain
// rather than to a leave record, which `record` below handles.
func (p *portal) record_(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p.mu.Lock()
		p.trail = append(p.trail, r.Method+" "+r.URL.RequestURI())
		p.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}

// guard is the session check. Everything but the front door needs the cookie,
// which is the first thing an agent has to work out.
func (p *portal) guard(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("wm_session")
		p.mu.Lock()
		ok := err == nil && p.sessions[cookie.Value]
		p.mu.Unlock()
		if !ok {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}
		next(w, r)
	}
}

// token is the per-session anti-replay value a POST is refused without. It is
// derived rather than stored so that any page can mint the same one.
func token(session string) string { return "wmt-" + session[len(session)-6:] }

func (p *portal) landing(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	page(w, "Workmonth HR", `<h1>Workmonth HR</h1>
<p>Globex Logistics human resources. Staff only.</p>
<p><a href="/login">Sign in</a></p>`)
}

func (p *portal) login(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		_ = r.ParseForm()
		if r.PostFormValue("u") != "priya.sharma@globex.example" ||
			r.PostFormValue("p") != "WorkTraining2026!" {
			page(w, "Sign in", `<h1>Sign in</h1><p class="err">Those credentials were not accepted.</p>
<p><a href="/login">Try again</a></p>`)
			return
		}
		session := "wm" + strconv.FormatInt(time.Now().UnixNano(), 36)
		p.mu.Lock()
		p.sessions[session] = true
		p.mu.Unlock()
		http.SetCookie(w, &http.Cookie{Name: "wm_session", Value: session, Path: "/"})
		http.Redirect(w, r, "/desk", http.StatusFound)
		return
	}
	page(w, "Sign in", `<h1>Sign in</h1>
<form method="post" action="/login">
  <input type="hidden" name="csrf" value="wm-login">
  <label>Work email <input name="u"></label>
  <label>Password <input type="password" name="p"></label>
  <button type="submit">Sign in</button>
</form>`)
}

func (p *portal) desk(w http.ResponseWriter, r *http.Request) {
	page(w, "Desk", `<h1>Desk</h1>
<p>Signed in as Priya Sharma, HR Operations.</p>
<ul>
  <li><a href="/timeoff">Time off queue</a></li>
  <li><a href="/handbook">Handbook</a></li>
  <li><a href="/timeoff/bulk">Bulk actions (beta)</a></li>
</ul>`)
}

func (p *portal) handbookIndex(w http.ResponseWriter, r *http.Request) {
	page(w, "Handbook", `<h1>Handbook</h1>
<ul>
  <li><a href="/handbook/leave-policy">Leave policy</a></li>
</ul>`)
}

func (p *portal) policy(w http.ResponseWriter, r *http.Request) {
	page(w, "Leave policy", "<h1>Leave policy</h1><pre>"+html.EscapeString(handbook)+"</pre>")
}

// queuePage is the pending list, three to a page. The pagination is not there
// to be cruel: a queue that fits on one screen teaches an agent nothing about
// the queue it will meet in production.
func (p *portal) queuePage(w http.ResponseWriter, r *http.Request) {
	const perPage = 3
	which, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if which < 1 {
		which = 1
	}

	var pending []leave
	for _, item := range p.state() {
		if item.Status == "Pending" {
			pending = append(pending, item)
		}
	}
	pages := (len(pending) + perPage - 1) / perPage
	start := (which - 1) * perPage
	if start > len(pending) {
		start = len(pending)
	}
	end := start + perPage
	if end > len(pending) {
		end = len(pending)
	}

	var body strings.Builder
	fmt.Fprintf(&body, "<h1>Time off queue</h1><p>%d pending, page %d of %d.</p><ul>",
		len(pending), which, max(pages, 1))
	for _, item := range pending[start:end] {
		fmt.Fprintf(&body, `<li><a href="/timeoff/%s">%s — %s, %s, %d day(s)</a></li>`,
			item.ID, item.ID, html.EscapeString(item.Worker), item.Type, item.Days)
	}
	body.WriteString("</ul>")
	if which < pages {
		fmt.Fprintf(&body, `<p><a href="/timeoff?page=%d">Next page</a></p>`, which+1)
	}
	body.WriteString(`<p><a href="/timeoff/export">Export the pending queue</a> — every field, one request.</p>`)
	page(w, "Time off queue", body.String())
}

// export is the whole pending queue with every field on it, in one request.
//
// It is the fast path, and it is where a portal's fast path usually is: not on
// the page you land on, but behind a link on a page you only reach if you go
// looking. An agent that never finds it can still do the job — it just pays a
// page per request for the privilege.
func (p *portal) export(w http.ResponseWriter, r *http.Request) {
	var body strings.Builder
	body.WriteString("id|worker|department|type|days|start|notice_days|balance|status\n")
	for _, item := range p.state() {
		if item.Status != "Pending" {
			continue
		}
		fmt.Fprintf(&body, "%s|%s|%s|%s|%d|%s|%d|%d|%s\n", item.ID, item.Worker,
			item.Department, item.Type, item.Days, item.Start, item.Notice,
			item.Balance, item.Status)
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, body.String())
}

// record is one request, with the form that decides it.
func (p *portal) record(w http.ResponseWriter, r *http.Request) {
	rest := strings.TrimPrefix(r.URL.Path, "/timeoff/")
	id, action, _ := strings.Cut(rest, "/")

	if action == "decide" {
		p.decide(w, r, id)
		return
	}
	if action != "" {
		http.NotFound(w, r)
		return
	}

	var found *leave
	for _, item := range p.state() {
		if item.ID == id {
			copied := item
			found = &copied
			break
		}
	}
	if found == nil {
		http.NotFound(w, r)
		return
	}

	cookie, _ := r.Cookie("wm_session")
	var body strings.Builder
	fmt.Fprintf(&body, `<h1>%s</h1>
<dl>
<dt>Worker</dt><dd>%s (%s)</dd>
<dt>Department</dt><dd>%s</dd>
<dt>Leave type</dt><dd>%s</dd>
<dt>Days requested</dt><dd>%d</dd>
<dt>Starts</dt><dd>%s</dd>
<dt>Notice given</dt><dd>%d days</dd>
<dt>Remaining balance</dt><dd>%d days</dd>
<dt>Status</dt><dd>%s</dd>
</dl>`, found.ID, html.EscapeString(found.Worker), found.WorkerID, found.Department,
		found.Type, found.Days, found.Start, found.Notice, found.Balance, found.Status)

	if found.Status == "Pending" {
		fmt.Fprintf(&body, `<form method="post" action="/timeoff/%s/decide">
  <input type="hidden" name="token" value="%s">
  <label>Decision <input name="decision" placeholder="approve or deny"></label>
  <label>Reason (required to deny) <input name="reason"></label>
  <button type="submit">Submit decision</button>
</form>`, found.ID, token(cookie.Value))
	}
	page(w, found.ID, body.String())
}

func (p *portal) decide(w http.ResponseWriter, r *http.Request, id string) {
	if r.Method != http.MethodPost {
		http.Error(w, "decide accepts POST only", http.StatusMethodNotAllowed)
		return
	}
	_ = r.ParseForm()
	cookie, _ := r.Cookie("wm_session")
	if r.PostFormValue("token") != token(cookie.Value) {
		http.Error(w, "missing or stale token: read the request page and use the token on it",
			http.StatusForbidden)
		return
	}
	status, reason, err := decision(r.PostFormValue("decision"), r.PostFormValue("reason"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	p.mu.Lock()
	applied := false
	for i := range p.queue {
		if p.queue[i].ID == id && p.queue[i].Status == "Pending" {
			p.queue[i].Status, p.queue[i].Reason = status, reason
			applied = true
		}
	}
	p.mu.Unlock()
	if !applied {
		http.Error(w, "no pending request with that id", http.StatusNotFound)
		return
	}
	page(w, "Recorded", fmt.Sprintf(`<h1>Recorded</h1><p>%s is now %s.</p>
<p><a href="/timeoff">Back to the queue</a></p>`, id, status))
}

// decision normalises what a form said into what the queue stores, and refuses
// a denial whose reason does not name a rule — the house convention the policy
// page states and a run that skipped the policy page will not know.
func decision(raw, reason string) (string, string, error) {
	reason = strings.TrimSpace(reason)
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "approve", "approved":
		return "Approved", "", nil
	case "deny", "denied", "reject":
		lower := strings.ToLower(reason)
		if !strings.HasPrefix(lower, "rule 1") &&
			!strings.HasPrefix(lower, "rule 2") &&
			!strings.HasPrefix(lower, "rule 3") {
			return "", "", fmt.Errorf(
				`a denial reason must begin with the rule that failed — "rule 1", "rule 2" or "rule 3" — and this one begins %q`,
				first12(reason))
		}
		return "Denied", reason, nil
	}
	return "", "", fmt.Errorf("decision must be approve or deny, not %q", raw)
}

func (p *portal) bulkPage(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie("wm_session")
	page(w, "Bulk actions", fmt.Sprintf(`<h1>Bulk actions (beta)</h1>
<p>Pair this with <a href="/timeoff/export">the export</a>, which returns every pending
request with every field in one request, and the whole queue takes two round trips.</p>
<p>Decide the whole queue in one request. Separate the decisions with semicolons:</p>
<pre>TOR-0001=approve; TOR-0002=deny:rule 1 not enough notice</pre>
<p>The same token and denial-reason rules apply as on a single request.</p>
<form method="post" action="/timeoff/bulk-decide">
  <input type="hidden" name="token" value="%s">
  <label>Decisions <input name="decisions"></label>
  <button type="submit">Apply all</button>
</form>`, token(cookie.Value)))
}

func (p *portal) bulkDecide(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "bulk-decide accepts POST only", http.StatusMethodNotAllowed)
		return
	}
	_ = r.ParseForm()
	cookie, _ := r.Cookie("wm_session")
	if r.PostFormValue("token") != token(cookie.Value) {
		http.Error(w, "missing or stale token: read /timeoff/bulk and use the token on it",
			http.StatusForbidden)
		return
	}

	applied, failures := 0, []string{}
	for _, line := range strings.FieldsFunc(r.PostFormValue("decisions"), func(r rune) bool {
		return r == '\n' || r == ';'
	}) {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		id, rest, ok := strings.Cut(line, "=")
		if !ok {
			failures = append(failures, line+": expected ID=decision")
			continue
		}
		verb, reason, _ := strings.Cut(rest, ":")
		status, kept, err := decision(verb, reason)
		if err != nil {
			failures = append(failures, strings.TrimSpace(id)+": "+err.Error())
			continue
		}
		p.mu.Lock()
		hit := false
		for i := range p.queue {
			if p.queue[i].ID == strings.TrimSpace(id) && p.queue[i].Status == "Pending" {
				p.queue[i].Status, p.queue[i].Reason = status, kept
				hit = true
			}
		}
		p.mu.Unlock()
		if hit {
			applied++
		} else {
			failures = append(failures, strings.TrimSpace(id)+": no pending request with that id")
		}
	}

	body := fmt.Sprintf("<h1>Bulk result</h1><p>%d applied.</p>", applied)
	if len(failures) > 0 {
		body += "<p>Rejected:</p><ul><li>" + html.EscapeString(strings.Join(failures, "</li><li>")) + "</li></ul>"
	}
	body += `<p><a href="/timeoff">Back to the queue</a></p>`
	page(w, "Bulk result", body)
}

func page(w http.ResponseWriter, title, body string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, "<!doctype html><html><head><title>%s — Workmonth HR</title></head><body>%s</body></html>",
		html.EscapeString(title), body)
}

func first12(s string) string {
	if len(s) > 12 {
		return s[:12] + "…"
	}
	return s
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
