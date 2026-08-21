# 13 · phone-banking — a telephone menu, learned once

Example 12's idea, on the oldest self-describing interface in production
anywhere: an IVR — the bank line that reads its options aloud. *"For account
services, press 1. For card services, press 2."* Everything the agent needs
to know is spoken to it, and every word costs airtime, which is exactly the
trade this example measures.

This program is a **Meridian Trust Bank** phone line: a menu tree three deep,
an access code demanded at the door of anything private, and a credit card
balance read out at the bottom of one path. The agent gets three Go
functions — `dial`, `press`, `hangup` — and a question: what is the balance?
Nothing about the tree is in the prompt beyond the number and the code. The
model decides every key.

```
run 1   explore   dial, listen, ride branch after branch to the bottom,
                  find the balance behind the access code — then record
                  the route with `learn`
RESET             the call log is wiped and THE BALANCE CHANGES, the way a
                  balance does; the menus hold still
run 2   replay    a new process, a new session, the same question, and the
                  lesson replayed into ctx.skills before the first token
```

## Why the menu is deliberately hard to understand

An earlier draft of this tree labelled its departments honestly — "card
services", then "card balances and payments" — and the exploring run walked
straight to the balance without a single wrong turn. Of course it did: an IVR
is **self-describing**, and a model that reads never has to guess. The
comparison still held (exploration costs listening even when every guess is
right), but the *search* never showed, and the search is the half of learning
worth watching.

So the tree is shaped the way real bank lines actually fail their callers:

- **Every department name is equally plausible.** A balance could live under
  *account services*, *card services* or *member services*. Hearing a menu no
  longer tells you which branch holds the answer.
- **Only the leaves say what they are.** You learn what "account
  information" means by riding it to the bottom and hearing a
  see-online-banking shrug. There is no way to rule a branch out from above.
- **One branch bottoms out in a balance that is not the balance** — a
  rewards *points* balance, at the deepest leaf of the branch a credit-card
  question tries first.
- **The money is behind the label a caller tries last** — member services →
  self-service banking — and behind the access code, the only carded door on
  the line.

None of it is hard. It is just unknowable without riding each branch to the
bottom — which is the cost this example is about paying exactly once. In the
captured run, run 1's search looked like this:

```
2 → 1        card programs        (rewards/travel — not it)
2 → 2        card assistance      (an hour-long hold queue)
1 → 1 → 1    account information  (a "see online banking" shrug)
2 → 3        card activation      (mobile app)
2 → 1 → 1    rewards              (a balance! …of points)
2 → 1 → 2    travel benefits      (no)
3 → 1 → code → 2                  BINGO
then: redial and key 31731942#2 in one press, proving the fast route
```

And run 2's, because it had already learned it:

```
3 → 1 → code → 2   as one press: 31731942#2
```

## What is measured, and how it is verified

The line logs every prompt it plays and every key it takes, and prices each
prompt at spoken pace (150 words a minute). It supports **keying ahead**, as
real IVRs do: keys sent in one `press` are taken in order and the menus keyed
past are never played — which is the mechanical reason a learned route is
cheap.

The balance is **different on each run**, so run 2 can only be right by
dialing and hearing it fresh — a lesson that recorded the figure instead of
the route would read out a stale number and fail the assertion. The trail is
the IVR's own log, never the agent's summary.

From the captured run:

```
                                run 1      run 2
  prompts listened to              26          2
  keys pressed                     43         10
  wrong turns                      17          0
  airtime (simulated)           6m34s        44s
  wall clock                    2m58s        14s
  the balance on the line   $2,847.19  $1,983.47
  reported correctly              yes        yes
```

The lesson run 1 recorded carries the negative knowledge only exploration can
buy — *"do NOT press 2 (card services) — the credit card balance is NOT under
card services"* — seventeen wrong turns distilled into one sentence no later
session will ever pay for again.

## Run it

```sh
export DEEPSEEK_API_KEY=...
export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1   # optional; unset = DeepSeek
export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731   # optional
go run ./examples/13-phone-banking
```

Set `DSH_EXPLORER_MODEL` and `DSH_OPERATOR_MODEL` to two different ids to
have one model do the listening and another do the calling.

## The test

`go test ./examples/13-phone-banking` walks the whole call with no model: the
plausible-but-wrong branches down to their leaves, the rewards decoy, the
access-code gate, the wrong-code refusal, star and 0, the keyed-ahead fast
route, and the fence that keeps the handset on one number. The test proves
the tree is walkable; the example is the model walking it.

## Files

- `main.go` — the two runs, the `learn` courier, the comparison and the
  assertions
- `ivr.go` — the bank: the tree, the call state machine, the trail, the
  airtime meter
- `phone.go` — the handset: `dial`, `press`, `hangup`, and the one-number
  fence
- `ivr_test.go` — the model-free walk

Part of [the examples tour](../README.md).
