package main

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
)

// The portal and the browser are the part of this example that must work before
// a model is worth spending, and the part a reader is most likely to change. So
// the whole job is walked here without one: sign in, read the policy, decide
// every request, and check the queue against the policy in Go.
//
// It is also the honest answer to "is the task even doable with these tools" —
// a question an example has no business asking a model first.
func TestTheJobCanBeDoneWithTheseTwoTools(t *testing.T) {
	site, err := newPortal()
	if err != nil {
		t.Fatal(err)
	}
	defer site.close()

	agent := newBrowser(site.base)
	get := func(path string) string {
		t.Helper()
		page, err := agent.open(context.Background(), args(map[string]string{"url": path}))
		if err != nil {
			t.Fatalf("open %s: %v", path, err)
		}
		return page
	}
	post := func(path, fields string) string {
		t.Helper()
		page, err := agent.submit(context.Background(),
			args(map[string]string{"url": path, "fields": fields}))
		if err != nil {
			t.Fatalf("submit %s: %v", path, err)
		}
		return page
	}

	// Signed out, everything redirects to the door.
	if page := get("/timeoff"); !strings.Contains(page, "Sign in") {
		t.Fatalf("the queue was reachable without signing in:\n%s", page)
	}

	// The login form declares a hidden field, and the browser has to show it.
	login := get("/login")
	for _, want := range []string{"csrf", "u", "p"} {
		if !strings.Contains(login, want) {
			t.Fatalf("the login form did not list %q:\n%s", want, login)
		}
	}
	desk := post("/login", "csrf=wm-login\nu="+user+"\np="+password)
	if !strings.Contains(desk, "Desk") {
		t.Fatalf("signing in did not land on the desk:\n%s", desk)
	}

	// The policy is reachable, and says what the Go verdict says.
	policy := get("/handbook/leave-policy")
	for _, want := range []string{"Rule 1 (balance)", "Rule 2 (notice)", "Rule 3 (month-end close)",
		"exempt", `"rule 1"`} {
		if !strings.Contains(policy, want) {
			t.Fatalf("the policy page is missing %q:\n%s", want, policy)
		}
	}

	// The queue paginates, so both pages have to be walked to see all six.
	seen := map[string]bool{}
	for _, page := range []string{"/timeoff", "/timeoff?page=2"} {
		for _, item := range seeded() {
			if strings.Contains(get(page), item.ID) {
				seen[item.ID] = true
			}
		}
	}
	if len(seen) != len(seeded()) {
		t.Fatalf("two pages of the queue showed %d of %d requests", len(seen), len(seeded()))
	}

	// A POST without the token is refused, which is the trap the agent has to
	// learn: the token is only on the page, and only for this session.
	if page := post("/timeoff/TOR-2041/decide", "decision=approve"); !strings.Contains(page, "token") {
		t.Fatalf("a decision without a token was accepted:\n%s", page)
	}

	// And a denial whose reason does not name a rule is refused too.
	detail := get("/timeoff/TOR-2043")
	token := tokenIn(t, detail)
	if page := post("/timeoff/TOR-2043/decide",
		"token="+token+"\ndecision=deny\nreason=not enough notice"); !strings.Contains(page, "rule 1") {
		t.Fatalf("a denial with a free-text reason was accepted:\n%s", page)
	}

	// Now do the job properly, one request at a time.
	for _, item := range seeded() {
		page := get("/timeoff/" + item.ID)
		token := tokenIn(t, page)
		want, rule := verdict(item)
		fields := "token=" + token + "\ndecision=approve"
		if want == "Denied" {
			fields = "token=" + token + "\ndecision=deny\nreason=" + rule + " — this request breaks it"
		}
		if got := post("/timeoff/"+item.ID+"/decide", fields); !strings.Contains(got, "Recorded") {
			t.Fatalf("deciding %s failed:\n%s", item.ID, got)
		}
	}

	if result := audit(site.state()); !result.ok {
		t.Fatalf("the queue is not correctly cleared:\n%s", strings.Join(result.lines, "\n"))
	}

	// The fast route is the shortcut a thorough explorer finds, and it has to
	// work too — otherwise the lesson would teach a path that fails. Signing in,
	// exporting, taking the token and deciding in bulk is the whole job in five
	// requests, against the twenty-odd a page-at-a-time run costs.
	site.reset()
	agent = newBrowser(site.base)
	post("/login", "csrf=wm-login\nu="+user+"\np="+password)

	export := get("/timeoff/export")
	for _, want := range []string{"notice_days|balance", "TOR-2041|Ayşe Demir", "TOR-2046|Elif Kaya"} {
		if !strings.Contains(export, want) {
			t.Fatalf("the export is missing %q:\n%s", want, export)
		}
	}

	bulk := get("/timeoff/bulk")
	token = tokenIn(t, bulk)

	var lines []string
	for _, item := range seeded() {
		want, rule := verdict(item)
		if want == "Approved" {
			lines = append(lines, item.ID+"=approve")
		} else {
			lines = append(lines, item.ID+"=deny:"+rule+" — this request breaks it")
		}
	}
	page := post("/timeoff/bulk-decide", "token="+token+"\ndecisions="+strings.Join(lines, ";"))
	if !strings.Contains(page, "6 applied") {
		t.Fatalf("the bulk route did not apply all six:\n%s", page)
	}
	if result := audit(site.state()); !result.ok {
		t.Fatalf("the bulk route left the queue wrong:\n%s", strings.Join(result.lines, "\n"))
	}
}

// The rendering is what the model actually sees, so it gets looked at rather
// than assumed. Run with -v to read the pages as the agent will.
func TestWhatTheAgentSees(t *testing.T) {
	site, err := newPortal()
	if err != nil {
		t.Fatal(err)
	}
	defer site.close()

	agent := newBrowser(site.base)
	for _, path := range []string{"/login"} {
		page, _ := agent.open(context.Background(), args(map[string]string{"url": path}))
		t.Logf("\n%s", page)
	}
	agent.submit(context.Background(), args(map[string]string{
		"url": "/login", "fields": "csrf=wm-login\nu=" + user + "\np=" + password}))
	for _, path := range []string{"/desk", "/timeoff", "/timeoff/TOR-2041", "/handbook/leave-policy"} {
		page, err := agent.open(context.Background(), args(map[string]string{"url": path}))
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("\n%s", page)
	}
}

// The fence is the security-relevant half of the browser, so it gets a table.
func TestTheBrowserReachesNothingElse(t *testing.T) {
	agent := newBrowser("http://127.0.0.1:9/")
	for _, raw := range []string{
		"https://example.com/", "http://127.0.0.1:80/", "//evil.example/x", "file:///etc/passwd",
	} {
		if _, err := agent.resolve(raw); err == nil {
			t.Errorf("the browser accepted %q", raw)
		}
	}
	for _, raw := range []string{"/timeoff", "timeoff?page=2", "http://127.0.0.1:9/desk"} {
		if _, err := agent.resolve(raw); err != nil {
			t.Errorf("the browser refused %q: %v", raw, err)
		}
	}
}

func tokenIn(t *testing.T, page string) string {
	t.Helper()
	for _, line := range strings.Split(page, "\n") {
		if !strings.Contains(line, "token") || !strings.Contains(line, `= "`) {
			continue
		}
		rest := line[strings.Index(line, `= "`)+3:]
		if end := strings.IndexByte(rest, '"'); end >= 0 {
			return rest[:end]
		}
	}
	t.Fatalf("no token listed on the page:\n%s", page)
	return ""
}

func args(fields map[string]string) json.RawMessage {
	raw, _ := json.Marshal(fields)
	return raw
}
