package main

import "testing"

// The fence is the security-relevant half of this example, and a review already
// found one hole in it — `grep -f/etc/passwd`, where GNU getopt attaches a
// short option's value with no separator, walked straight past a check that
// only understood `--flag=value`. So it gets a table rather than a claim.
func TestFenceRefusesEveryWayOutOfTheWorkspace(t *testing.T) {
	for _, c := range []struct {
		name    string
		argv    []string
		refused bool
	}{
		{"a plain relative path", []string{"cat", "notes.txt"}, false},
		{"a relative path in a subdirectory", []string{"cat", "drafts/notes.md"}, false},
		{"bare flags", []string{"ls", "-la"}, false},
		{"a flag whose value is not a path", []string{"grep", "--color=auto", "x"}, false},
		{"an empty argument", []string{"grep", "", "notes.txt"}, false},

		{"an absolute path", []string{"cat", "/etc/passwd"}, true},
		{"a home-relative path", []string{"cat", "~/.ssh/id_rsa"}, true},
		{"a climbing path", []string{"cat", "../../etc/passwd"}, true},
		{"a climb in the middle", []string{"cat", "drafts/../../etc/passwd"}, true},
		{"a long flag carrying an absolute path", []string{"grep", "--file=/etc/passwd", "."}, true},
		{"a short flag carrying an absolute path", []string{"grep", "-f/etc/passwd", "."}, true},
		{"a bunched short flag carrying one", []string{"grep", "-rf/etc/passwd", "."}, true},
		{"a short flag carrying a climb", []string{"grep", "-f../../etc/passwd", "."}, true},
	} {
		t.Run(c.name, func(t *testing.T) {
			refusal := fence(c.argv)
			if (refusal != "") != c.refused {
				t.Fatalf("fence(%q) = %q, refused=%v, want refused=%v",
					c.argv, refusal, refusal != "", c.refused)
			}
			if c.refused {
				t.Logf("refused: %s", refusal)
			}
		})
	}
}

// The other half: the allowlist names programs, and the two are independent.
// `cat` passing here while `cat /etc/passwd` is fenced above is the whole point.
func TestParseSeparatesProgramFromPath(t *testing.T) {
	if _, refusal := parse("curl https://example.com"); refusal == "" {
		t.Error("an unlisted program was allowed")
	}
	if _, refusal := parse("cat /etc/hostname"); refusal == "" {
		t.Error("a listed program reached an unlisted path")
	}
	if argv, refusal := parse(`grep -c "a;b" notes.txt`); refusal != "" {
		t.Errorf("a quoted semicolon was refused as punctuation: %s", refusal)
	} else if len(argv) != 4 || argv[2] != "a;b" {
		t.Errorf("quoted argument mangled: %q", argv)
	}
	if _, refusal := parse("ls -la; rm -rf /"); refusal == "" {
		t.Error("an unquoted chain was allowed, and there is no shell to run it")
	}
}
