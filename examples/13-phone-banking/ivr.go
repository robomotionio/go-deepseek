package main

// The exchange: a bank's telephone tree, in Go.
//
// Why a stand-in rather than a real phone line. The example has to be runnable
// by anyone who clones the repository, offline, with the same result every
// time — and it has to be VERIFIABLE. Because the IVR runs in this process,
// the assertions at the end read its own call log directly rather than
// believing what the agent said it heard. An agent cannot forge a trail it can
// only add to by pressing keys.
//
// An IVR is the oldest self-describing interface there is: every menu reads
// out what its keys do, so nothing about the tree needs to be in the prompt —
// and everything about the tree costs airtime to hear. That trade is the whole
// example. The first caller pays to listen; a caller who knows the tree keys
// ahead and hears almost nothing.
//
// It is deliberately shaped the way real bank lines are shaped, which is to
// say against the caller: a greeting that plays before you can do anything;
// department names that all sound equally likely to hold a balance — account
// services, card services, member services; an access code at the door of
// anything private; and leaves that only say what they are once you have
// paid your way down to them. One branch even bottoms out in a balance that
// is not the balance — rewards points. The credit card figure sits behind
// the label a caller tries last. None of it is hard. It is just unknowable
// without riding each branch to the bottom, which is the cost this example
// is about paying once.
//
// And the balance CHANGES between the two runs, the way a balance does. That
// is what keeps the lesson honest: a route written down is good tomorrow, a
// figure written down is a wrong answer waiting to be read out — and the
// assertions can tell the difference, because only a run that really dialed
// can know the new number.

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

// figures is what the credit-balance leaf reads out. One set per run: reset()
// moves from the first to the second, so the two calls hear different money
// through identical menus.
type figures struct {
	balance   string
	available string
}

var books = []figures{
	{balance: "2,847.19", available: "3,152.81"}, // what run 1 hears
	{balance: "1,983.47", available: "4,016.53"}, // what the line says after the reset
}

// node is one place a call can be. A menu maps keys to children; a leaf maps
// nothing and offers only star. auth marks the doors the access code guards.
type node struct {
	say  string
	keys map[byte]string
	auth bool
}

// tree is the menu, three deep on the path that matters:
// main-menu → member-services → self-service → credit-balance.
// Every department name is plausible — a balance could live under account
// services, card services or member services — and only the leaves say what
// they are, so a cold caller has to ride branches to the bottom and back up.
// The decoys are shaped to be tried FIRST: card services bottoms out in a
// rewards POINTS balance, account services in a see-online-banking shrug,
// and the credit card figure waits behind the label a caller tries last.
func tree() map[string]*node {
	return map[string]*node{
		"main-menu": {
			say: "Main menu. For account services, press 1. For card services, press 2. " +
				"For member services, press 3. For rates and information, press 4. " +
				"To hear these options again, press 0.",
			keys: map[byte]string{'1': "account-services", '2': "card-services",
				'3': "member-services", '4': "rates-info"},
		},

		// Branch 1, the second-best guess: "the balance lives on the account."
		// Three menus deep it turns out this department does not read numbers.
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

		// Branch 2, the best guess by vocabulary: it says card. Its deepest
		// leaf even reads out a balance — of rewards points.
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

		// Branch 3, the label nobody tries first — and the one that holds
		// the money, behind the access code.
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

		// Branch 4, honest filler: the one department that could not
		// plausibly hold a balance, so nobody has to try it.
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

// leg is one thing that happened on the line: an action taken and what was
// played because of it. The trail of legs is the example's measurement — the
// travel path, off the phone's own log rather than the agent's account of it.
type leg struct {
	action string // "dial 1-800-634-7100", "press 23", "hangup"
	keys   int    // keys pressed in this leg
	heard  string // node id, "access-code", "code-mismatch", "invalid" — or "" for silence
	secs   int    // airtime this leg cost
}

// ivr is the running phone system: the tree, at most one live call from the
// one handset this example owns, and the log of everything played and pressed.
type ivr struct {
	mu    sync.Mutex
	phase int // which figures the credit-balance leaf reads out

	inCall   bool
	at       string // the node the call is sitting at
	authed   bool   // the access code has been accepted this call
	entering bool   // the line is collecting an access code
	buffer   string // digits of the code so far
	pending  string // where the call goes once the code checks out

	nodes  map[string]*node
	parent map[string]string

	trail []leg
	secs  int
}

func newIVR() *ivr {
	nodes := tree()
	parent := map[string]string{"main-menu": "main-menu"}
	for id, n := range nodes {
		for _, child := range n.keys {
			parent[child] = id
		}
	}
	return &ivr{phase: 0, nodes: nodes, parent: parent}
}

// reset is the seam between the two runs: the call log is wiped and the
// balance moves on, the way a balance does. The menus do not change — the
// tree is the thing worth learning precisely because it holds still.
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

func (x *ivr) airtime() int {
	x.mu.Lock()
	defer x.mu.Unlock()
	return x.secs
}

func (x *ivr) figures() figures {
	x.mu.Lock()
	defer x.mu.Unlock()
	return books[x.phase]
}

// dial connects a fresh call: main menu, unauthenticated, any previous call
// dropped. The fence is here — this handset reaches one number in the world.
func (x *ivr) dial(number string) (string, error) {
	if !reachable(number) {
		return "", fmt.Errorf("this handset dials %s — the bank's automated line — and nothing "+
			"else, so %q does not connect", bankNumber, number)
	}
	x.mu.Lock()
	defer x.mu.Unlock()
	if x.inCall {
		x.trail = append(x.trail, leg{action: "hangup"})
	}
	x.inCall, x.at = true, "main-menu"
	x.authed, x.entering, x.buffer, x.pending = false, false, "", ""

	said := greeting + x.spoken("main-menu")
	cost := 2 + saySeconds(said) // two seconds of ringing, then the greeting
	x.secs += cost
	x.trail = append(x.trail, leg{action: "dial " + bankNumber, heard: "main-menu", secs: cost})
	return x.hearing(said), nil
}

// press takes keys in order. This line supports keying ahead, as real IVRs
// do: menus keyed past are never played — not heard, not charged, not in the
// trail — and the caller hears only where they land. That is the mechanical
// reason a learned route is cheap: the first caller listens to every menu on
// the way down, the second interrupts all of them.
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

		// Collecting an access code: digits accumulate, pound submits, star
		// gives up and stays where the call already was.
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
		case '0': // listen again — the landing replays wherever the call is
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

	cost := len(keys) + saySeconds(said) // a second per key, then the prompt
	x.secs += cost
	x.trail = append(x.trail, leg{action: "press " + keys, keys: len(keys), heard: heard, secs: cost})
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
	return "The call has ended. Dialing again starts over at the main menu, unauthenticated."
}

// spoken resolves a node's prompt against the figures of the current phase.
// Only the credit-balance leaf carries placeholders, but resolving uniformly
// keeps the tree data and the money in separate places.
func (x *ivr) spoken(id string) string {
	f := books[x.phase]
	return strings.NewReplacer(
		"{CREDIT_BALANCE}", f.balance,
		"{AVAILABLE_CREDIT}", f.available,
	).Replace(x.nodes[id].say)
}

// hearing is what a tool call returns: the audio as text, and the meter. The
// running airtime is shown to the model on purpose — the prompt tells it that
// listening costs, and a cost the model cannot see is not a pressure.
func (x *ivr) hearing(said string) string {
	return fmt.Sprintf("you hear: %q\n\n[airtime so far: %s]", said, mmss(x.secs))
}

// reachable is the fence, on digits alone so that every way a model writes a
// phone number — dashes, dots, spaces, +1, parentheses — lands the same way.
func reachable(number string) bool {
	var digits strings.Builder
	for _, r := range number {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	return digits.String() == "18006347100" || digits.String() == "8006347100"
}

// cleanKeys forgives the punctuation models put between keys. "731942 #" and
// "7-3-1-9-4-2#" mean the same press.
func cleanKeys(raw string) string {
	return strings.Map(func(r rune) rune {
		switch r {
		case ' ', '\t', '\n', '-', ',', '.':
			return -1
		}
		return r
	}, strings.TrimSpace(raw))
}

// saySeconds prices a prompt at spoken pace: 150 words a minute, and nothing
// the line says takes under two seconds. This is the "you are being timed"
// the job prompt means — not the model's clock, the caller's.
func saySeconds(text string) int {
	return max((len(strings.Fields(text))*60+149)/150, 2)
}

func mmss(total int) string {
	if total < 60 {
		return fmt.Sprintf("%ds", total)
	}
	return fmt.Sprintf("%dm%02ds", total/60, total%60)
}
