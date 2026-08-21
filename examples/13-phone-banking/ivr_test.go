package main

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
)

// The line and the handset are the part of this example that must work before
// a model is worth spending, and the part a reader is most likely to change.
// So the whole call is walked here without one: the decoy department, the
// redirect, the access code, the balance — and then the keyed-ahead fast
// route the lesson is supposed to teach, because a lesson that recorded a
// route this test cannot walk would teach a path that fails.
func TestTheBalanceCanBeHeardWithTheseKeys(t *testing.T) {
	line := newIVR()
	hs := newHandset(line)

	press := func(keys string) string {
		t.Helper()
		heard, err := hs.press(context.Background(), args(map[string]string{"keys": keys}))
		if err != nil {
			t.Fatalf("press %q: %v", keys, err)
		}
		return heard
	}

	// Off the hook before dialing, the handset says so.
	if _, err := hs.press(context.Background(), args(map[string]string{"keys": "1"})); err == nil ||
		!strings.Contains(err.Error(), "no call in progress") {
		t.Fatalf("pressing with no call did not explain itself: %v", err)
	}

	// The greeting and the main menu play on connect.
	heard, err := hs.dial(context.Background(), args(map[string]string{"number": bankNumber}))
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"Thank you for calling", "press 1", "press 2", "press 0"} {
		if !strings.Contains(heard, want) {
			t.Fatalf("the greeting is missing %q:\n%s", want, heard)
		}
	}

	// The best guess by vocabulary: card services. Its deepest leaf reads a
	// balance — of rewards points, which is not the balance, and no code was
	// asked for on the way, which is a hint this branch holds nothing private.
	if heard := press("2"); !strings.Contains(heard, "Card services") {
		t.Fatalf("key 2 did not reach card services:\n%s", heard)
	}
	if heard := press("1"); !strings.Contains(heard, "Card programs") {
		t.Fatalf("key 1 did not reach card programs:\n%s", heard)
	}
	heard = press("1")
	if !strings.Contains(heard, "rewards balance") || !strings.Contains(heard, "points") {
		t.Fatalf("the rewards leaf did not read a points balance:\n%s", heard)
	}
	if strings.Contains(heard, books[0].balance) {
		t.Fatalf("the rewards leaf leaked the credit balance:\n%s", heard)
	}

	// The second guess: account services, three menus down to a shrug.
	press("*") // card programs
	press("*") // card services
	press("*") // main menu
	if heard := press("1"); !strings.Contains(heard, "Account services") {
		t.Fatalf("key 1 did not reach account services:\n%s", heard)
	}
	press("1") // account information
	if heard := press("1"); !strings.Contains(heard, "online banking") {
		t.Fatalf("the deposit accounts leaf did not shrug:\n%s", heard)
	}

	// The label nobody tries first is where the money is — behind the code.
	press("*") // account information
	press("*") // account services
	press("*") // main menu
	if heard := press("3"); !strings.Contains(heard, "Member services") {
		t.Fatalf("key 3 did not reach member services:\n%s", heard)
	}
	if heard := press("1"); !strings.Contains(heard, "access code") {
		t.Fatalf("self-service did not demand the code:\n%s", heard)
	}
	// A wrong code is refused and asked for again.
	if heard := press("000000#"); !strings.Contains(heard, "does not match") {
		t.Fatalf("a wrong code was accepted:\n%s", heard)
	}
	heard = press(accessCode + "#")
	for _, want := range []string{"Thank you", "Self-service banking"} {
		if !strings.Contains(heard, want) {
			t.Fatalf("the right code did not open self-service banking:\n%s", heard)
		}
	}

	// The leaf this example exists for.
	heard = press("2")
	for _, want := range []string{"4417", books[0].balance, books[0].available} {
		if !strings.Contains(heard, want) {
			t.Fatalf("the credit balance leaf is missing %q:\n%s", want, heard)
		}
	}
	// Zero is "listen again", and it costs airtime like everything else.
	before := line.airtime()
	if heard := press("0"); !strings.Contains(heard, books[0].balance) {
		t.Fatalf("0 did not replay the leaf:\n%s", heard)
	}
	if line.airtime() <= before {
		t.Fatal("listening again cost nothing")
	}

	// A key the menu never offered is refused with the menu replayed.
	press("*")
	if heard := press("9"); !strings.Contains(heard, "not a valid option") {
		t.Fatalf("an unoffered key was accepted:\n%s", heard)
	}

	// The code is not demanded twice on one call.
	press("*") // member services
	if heard := press("1"); !strings.Contains(heard, "Self-service banking") ||
		strings.Contains(heard, "access code") {
		t.Fatalf("an authenticated call was carded again:\n%s", heard)
	}

	// The trail is the line's own account: the leaf is in it, and hanging up
	// is on the record too.
	if !heardIn(line.legs(), "credit-balance") {
		t.Fatal("the trail never played the credit-balance leaf")
	}
	if out, _ := hs.hangup(context.Background(), nil); !strings.Contains(out, "ended") {
		t.Fatalf("hangup did not end the call: %s", out)
	}

	// The fast route, after the reset the real runs get: the balance has
	// moved, the menus have not, and a caller who knows the tree keys ahead —
	// dial, 31, code-pound-2 — hearing three prompts and taking no wrong turn.
	line.reset()
	if line.figures().balance == books[0].balance {
		t.Fatal("the reset did not move the balance")
	}
	if _, err := hs.dial(context.Background(), args(map[string]string{"number": bankNumber})); err != nil {
		t.Fatal(err)
	}
	if heard := press("31"); !strings.Contains(heard, "access code") {
		t.Fatalf("keying ahead to the carded door did not demand the code:\n%s", heard)
	}
	heard = press(accessCode + "#2")
	if !strings.Contains(heard, books[1].balance) {
		t.Fatalf("the fast route did not read the new balance:\n%s", heard)
	}
	if strings.Contains(heard, books[0].balance) {
		t.Fatalf("the fast route read the stale balance:\n%s", heard)
	}
	fast := measure(line.legs())
	if fast.prompts != 3 {
		t.Fatalf("the fast route heard %d prompts, not 3:\n%+v", fast.prompts, line.legs())
	}
	if fast.wrong != 0 {
		t.Fatalf("the fast route took %d wrong turn(s):\n%+v", fast.wrong, line.legs())
	}
}

// The rendering is what the model actually hears, so it gets listened to
// rather than assumed. Run with -v to read the call as the agent will.
func TestWhatTheCallerHears(t *testing.T) {
	line := newIVR()
	hs := newHandset(line)

	heard, err := hs.dial(context.Background(), args(map[string]string{"number": bankNumber}))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("\n%s", heard)
	for _, keys := range []string{"3", "1", accessCode + "#", "2"} {
		heard, err := hs.press(context.Background(), args(map[string]string{"keys": keys}))
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("\npress %s\n%s", keys, heard)
	}
}

// The fence is the security-relevant half of the handset, so it gets a table.
func TestTheHandsetDialsNothingElse(t *testing.T) {
	for _, number := range []string{
		"911", "1-800-555-1212", "+90 555 000 0000", "18006347101", "0", "",
	} {
		if reachable(number) {
			t.Errorf("the handset dialed %q", number)
		}
	}
	for _, number := range []string{
		bankNumber, "8006347100", "18006347100", "+1 (800) 634-7100", "1.800.634.7100",
	} {
		if !reachable(number) {
			t.Errorf("the handset refused the bank's own number written %q", number)
		}
	}
}

// The reset is what makes run 2 a fair repeat rather than a continuation: the
// figures move, the log empties, and any live call is dropped.
func TestTheResetIsReal(t *testing.T) {
	line := newIVR()
	if _, err := line.dial(bankNumber); err != nil {
		t.Fatal(err)
	}
	if _, err := line.press("2"); err != nil {
		t.Fatal(err)
	}
	line.reset()
	if got := line.legs(); len(got) != 0 {
		t.Fatalf("the reset kept %d legs of trail", len(got))
	}
	if line.airtime() != 0 {
		t.Fatal("the reset kept airtime on the meter")
	}
	if _, err := line.press("2"); err == nil {
		t.Fatal("a call survived the reset")
	}
	if line.figures() == books[0] {
		t.Fatal("the reset kept the old figures")
	}
}

func args(fields map[string]string) json.RawMessage {
	raw, _ := json.Marshal(fields)
	return raw
}
