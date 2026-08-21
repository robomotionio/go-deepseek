package main

// The exchange again — the same Meridian Trust Bank telephone tree as the
// parent example, kept in lockstep with ../ivr.go. The one addition is
// emit(): every dial, every key and every prompt the line plays is also
// announced to whoever is watching, which is what makes the web page beside
// this file possible. The agent does not know it is being watched; the tools
// it holds are the same three.

import (
	"fmt"
	"strings"
	"sync"
)

const (
	bankNumber = "1-800-634-7100"
	accessCode = "731942"

	greeting = "Thank you for calling Meridian Trust Bank. Calls may be recorded for quality assurance. "

	codePrompt = "For your security, please enter your six-digit phone banking access code, " +
		"followed by the pound key."
	invalidLine = "I'm sorry, that is not a valid option. "
)

type figures struct {
	balance   string
	available string
}

var books = []figures{
	{balance: "2,847.19", available: "3,152.81"}, // what run 1 hears
	{balance: "1,983.47", available: "4,016.53"}, // what the line says after the reset
}

type node struct {
	say  string
	keys map[byte]string
	auth bool
}

// tree is identical to the parent example's: every department name equally
// plausible, only the leaves say what they are, rewards points where a
// balance is expected, and the money behind the label a caller tries last.
func tree() map[string]*node {
	return map[string]*node{
		"main-menu": {
			say: "Main menu. For account services, press 1. For card services, press 2. " +
				"For member services, press 3. For rates and information, press 4. " +
				"To hear these options again, press 0.",
			keys: map[byte]string{'1': "account-services", '2': "card-services",
				'3': "member-services", '4': "rates-info"},
		},

		"account-services": {
			say: "Account services. For account information, press 1. For account maintenance, " +
				"press 2. For payment services, press 3. To return to the main menu, press " +
				"star. To hear these options again, press 0.",
			keys: map[byte]string{'1': "account-information", '2': "account-maintenance",
				'3': "payment-services"},
		},
		"account-information": {
			say: "Account information. For deposit accounts, press 1. For statements, press 2. " +
				"For tax documents, press 3. To return to the previous menu, press star. " +
				"To hear these options again, press 0.",
			keys: map[byte]string{'1': "deposit-accounts", '2': "statements",
				'3': "tax-documents"},
		},
		"deposit-accounts": {
			say: "Balance and activity information for checking and savings accounts is " +
				"available in online banking and at any Meridian ATM. To return to the " +
				"previous menu, press star.",
		},
		"statements": {
			say: "Statements are available in online banking, under Documents. To return to " +
				"the previous menu, press star.",
		},
		"tax-documents": {
			say: "Tax documents for the previous year are mailed in January and available in " +
				"online banking. To return to the previous menu, press star.",
		},
		"account-maintenance": {
			say: "To update your address or contact details, please call during business hours. " +
				"To return to the previous menu, press star.",
		},
		"payment-services": {
			say: "Payments made by phone post the next business day. To set up transfers, use " +
				"online banking or the Meridian mobile app. To return to the previous menu, " +
				"press star.",
		},

		"card-services": {
			say: "Card services. For card programs, press 1. For card assistance, press 2. " +
				"For card activation, press 3. To return to the main menu, press star. " +
				"To hear these options again, press 0.",
			keys: map[byte]string{'1': "card-programs", '2': "card-assistance",
				'3': "card-activation"},
		},
		"card-programs": {
			say: "Card programs. For rewards, press 1. For travel benefits, press 2. " +
				"To return to the previous menu, press star. To hear these options again, " +
				"press 0.",
			keys: map[byte]string{'1': "rewards", '2': "travel-benefits"},
		},
		"rewards": {
			say: "Your rewards balance is 12,410 points. Points do not expire while the " +
				"account is open. To return to the previous menu, press star.",
		},
		"travel-benefits": {
			say: "Travel benefits are described in your cardholder agreement. To return to " +
				"the previous menu, press star.",
		},
		"card-assistance": {
			say: "To report a card lost or stolen, please stay on the line for the card " +
				"security team. All of our agents are busy. Your expected wait time is over " +
				"one hour. To return to the previous menu, press star.",
		},
		"card-activation": {
			say: "Card activation is available in the Meridian mobile app. To return to the " +
				"previous menu, press star.",
		},

		"member-services": {
			say: "Member services. For self-service banking, press 1. For branch appointments, " +
				"press 2. For lost and found, press 3. To return to the main menu, press " +
				"star. To hear these options again, press 0.",
			keys: map[byte]string{'1': "self-service", '2': "branch-appointments",
				'3': "lost-found"},
		},
		"self-service": {
			auth: true,
			say: "Self-service banking. For deposit balances, press 1. For your credit card " +
				"balance and available credit, press 2. For recent activity, press 3. " +
				"To return to the previous menu, press star. To hear these options again, " +
				"press 0.",
			keys: map[byte]string{'1': "deposit-balances", '2': "credit-balance",
				'3': "recent-activity"},
		},
		"deposit-balances": {
			say: "Your checking account balance is $1,240.06. Your savings account balance is " +
				"$8,910.44. To return to the previous menu, press star.",
		},
		"credit-balance": {
			say: "Your credit card, ending 4417, has a current balance of ${CREDIT_BALANCE}. " +
				"Your available credit is ${AVAILABLE_CREDIT}. Your next minimum payment of " +
				"$85.00 is due September the 12th. To return to the previous menu, press star.",
		},
		"recent-activity": {
			say: "Your last three transactions: card purchase, Fresh Fields Market, $31.80. " +
				"Card purchase, Northside Fuel, $52.10. Direct deposit, Globex Logistics " +
				"payroll, $2,120.00. To return to the previous menu, press star.",
		},
		"branch-appointments": {
			say: "To book a branch appointment, use the Meridian mobile app or online banking. " +
				"To return to the previous menu, press star.",
		},
		"lost-found": {
			say: "For lost and found, please contact your branch during business hours. " +
				"To return to the previous menu, press star.",
		},

		"rates-info": {
			say: "Rates and information. For today's rates, press 1. For branch locations and " +
				"hours, press 2. To return to the main menu, press star. To hear these " +
				"options again, press 0.",
			keys: map[byte]string{'1': "loan-rates", '2': "branch-hours"},
		},
		"loan-rates": {
			say: "Today's rates: thirty-year fixed mortgage, 6.1 percent. Five-year auto, 7.4 " +
				"percent. Rates change daily and your rate may differ. To return to the " +
				"previous menu, press star.",
		},
		"branch-hours": {
			say: "Our branches are open Monday through Friday, nine to five, and Saturday, nine " +
				"to noon. To find a branch or ATM, use the locator in the Meridian mobile app. " +
				"To return to the previous menu, press star.",
		},
	}
}

type leg struct {
	action string
	keys   int
	heard  string
	secs   int
}

// ivr is the running phone system, as in the parent — plus the witness.
type ivr struct {
	mu    sync.Mutex
	phase int

	inCall   bool
	at       string
	authed   bool
	entering bool
	buffer   string
	pending  string

	nodes  map[string]*node
	parent map[string]string

	trail []leg
	secs  int

	// emit announces what just happened on the line, for the page. It is
	// called with the lock held and must not call back into the ivr.
	emit func(event)
}

func newIVR(emit func(event)) *ivr {
	nodes := tree()
	parent := map[string]string{"main-menu": "main-menu"}
	for id, n := range nodes {
		for _, child := range n.keys {
			parent[child] = id
		}
	}
	if emit == nil {
		emit = func(event) {}
	}
	return &ivr{phase: 0, nodes: nodes, parent: parent, emit: emit}
}

func (x *ivr) reset() {
	x.mu.Lock()
	defer x.mu.Unlock()
	x.inCall = false
	x.phase = 1
	x.trail = nil
	x.secs = 0
}

func (x *ivr) legs() []leg {
	x.mu.Lock()
	defer x.mu.Unlock()
	return append([]leg(nil), x.trail...)
}

func (x *ivr) figures() figures {
	x.mu.Lock()
	defer x.mu.Unlock()
	return books[x.phase]
}

func (x *ivr) dial(number string) (string, error) {
	if !reachable(number) {
		return "", fmt.Errorf("this handset dials %s — the bank's automated line — and nothing "+
			"else, so %q does not connect", bankNumber, number)
	}
	x.mu.Lock()
	defer x.mu.Unlock()
	if x.inCall {
		x.trail = append(x.trail, leg{action: "hangup"})
		x.emit(event{Kind: "hangup"})
	}
	x.inCall, x.at = true, "main-menu"
	x.authed, x.entering, x.buffer, x.pending = false, false, "", ""

	said := greeting + x.spoken("main-menu")
	cost := 2 + saySeconds(said)
	x.secs += cost
	x.trail = append(x.trail, leg{action: "dial " + bankNumber, heard: "main-menu", secs: cost})
	x.emit(event{Kind: "dial", Number: bankNumber})
	x.emit(event{Kind: "prompt", Node: "main-menu", Text: said, Secs: saySeconds(said), Airtime: x.secs})
	return x.hearing(said), nil
}

func (x *ivr) press(raw string) (string, error) {
	keys := cleanKeys(raw)
	if keys == "" {
		return "", fmt.Errorf("no keys to press; the keys are the digits 0-9, star and pound")
	}
	for _, r := range keys {
		if !strings.ContainsRune("0123456789*#", r) {
			return "", fmt.Errorf("%q is not a key on this handset; the keys are the digits "+
				"0-9, star and pound", string(r))
		}
	}

	x.mu.Lock()
	defer x.mu.Unlock()
	if !x.inCall {
		return "", fmt.Errorf("there is no call in progress; dial %s first", bankNumber)
	}

	heard, said := "", ""
	thanks := false
walk:
	for i := 0; i < len(keys); i++ {
		k := keys[i]
		x.emit(event{Kind: "key", Key: string(k)})

		if x.entering {
			switch {
			case k >= '0' && k <= '9':
				x.buffer += string(k)
			case k == '#':
				if x.buffer == accessCode {
					x.entering, x.authed = false, true
					x.at = x.pending
					thanks = i == len(keys)-1
				} else {
					x.buffer = ""
					heard = "code-mismatch"
					said = "That code does not match our records. " + codePrompt
					break walk
				}
			case k == '*':
				x.entering, x.buffer = false, ""
			}
			continue
		}

		n := x.nodes[x.at]
		switch k {
		case '0':
		case '*':
			x.at = x.parent[x.at]
		case '#':
			heard = "invalid"
			said = invalidLine + x.spoken(x.at)
			break walk
		default:
			target, ok := n.keys[k]
			if !ok {
				heard = "invalid"
				said = invalidLine + x.spoken(x.at)
				break walk
			}
			if x.nodes[target].auth && !x.authed {
				x.entering, x.pending, x.buffer = true, target, ""
			} else {
				x.at = target
			}
		}
	}

	if heard == "" {
		if x.entering {
			heard, said = "access-code", codePrompt
		} else {
			heard, said = x.at, x.spoken(x.at)
			if thanks {
				said = "Thank you. " + said
			}
		}
	}

	cost := len(keys) + saySeconds(said)
	x.secs += cost
	x.trail = append(x.trail, leg{action: "press " + keys, keys: len(keys), heard: heard, secs: cost})
	x.emit(event{Kind: "prompt", Node: heard, Text: said, Secs: saySeconds(said), Airtime: x.secs})
	return x.hearing(said), nil
}

func (x *ivr) hangupCall() string {
	x.mu.Lock()
	defer x.mu.Unlock()
	if !x.inCall {
		return "The line is already idle."
	}
	x.inCall = false
	x.trail = append(x.trail, leg{action: "hangup"})
	x.emit(event{Kind: "hangup"})
	return "The call has ended. Dialing again starts over at the main menu, unauthenticated."
}

func (x *ivr) spoken(id string) string {
	f := books[x.phase]
	return strings.NewReplacer(
		"{CREDIT_BALANCE}", f.balance,
		"{AVAILABLE_CREDIT}", f.available,
	).Replace(x.nodes[id].say)
}

func (x *ivr) hearing(said string) string {
	return fmt.Sprintf("you hear: %q\n\n[airtime so far: %s]", said, mmss(x.secs))
}

func reachable(number string) bool {
	var digits strings.Builder
	for _, r := range number {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	return digits.String() == "18006347100" || digits.String() == "8006347100"
}

func cleanKeys(raw string) string {
	return strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\t', '\n', '-', ',', '.':
			return -1
		}
		return r
	}, strings.TrimSpace(raw))
}

func saySeconds(text string) int {
	return max((len(strings.Fields(text))*60+149)/150, 2)
}

func mmss(total int) string {
	if total < 60 {
		return fmt.Sprintf("%ds", total)
	}
	return fmt.Sprintf("%dm%02ds", total/60, total%60)
}

// ---- measuring, as the parent does ------------------------------------------

var direct = map[string]bool{
	"main-menu": true, "member-services": true, "self-service": true,
	"access-code": true, "credit-balance": true,
}

type tally struct {
	prompts int
	keys    int
	wrong   int
	seconds int
}

func measure(legs []leg) tally {
	var t tally
	for _, l := range legs {
		t.keys += l.keys
		t.seconds += l.secs
		if l.heard == "" {
			continue
		}
		t.prompts++
		if !direct[l.heard] {
			t.wrong++
		}
	}
	return t
}
