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

The balance is **different on each run** — changed at the reset on purpose,
because it is the demo's anti-cheat check. If the balance held still, run 2
could "answer" without dialing at all: the lesson could simply memorize the
figure, and learning would be indistinguishable from parroting. Because it
moves, run 2 can only be right by dialing and hearing it fresh — a lesson
that recorded the figure instead of the route reads out a stale number and
fails the assertion. The trail is the IVR's own log, never the agent's
summary.

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

## Who does what — deterministic code vs probabilistic AI

The demo is a fixed laboratory with one variable in it: the caller. Every
step below is either code (same on every run, checkable) or the model
(different on every run, measured). The split is the showcase: the harness
supplies the learning *machinery*; the model supplies the learning.

| step | deterministic — the code | probabilistic — the AI |
|---|---|---|
| 1 · the world | The tree, every prompt's wording, the access code, both balance figures, the airtime pricing (150 wpm), the one-number fence — fixed Go data | — |
| 2 · setup | Harness opened; `dial` / `press` / `hangup` and `learn` mounted; any recorded lesson replayed into `ctx.skills` before the first token | — |
| 3 · the job | The prompt string, identical for both runs; run 1 gets the record-a-lesson half appended | — |
| 4 · run 1 explores | The line answers each key: transitions, the auth gate, invalid handling, what each prompt costs | Every choice — which key to press, which branch to probe, when to back out with `*`, when to hang up and redial |
| 5 · the fumbles | Digits at the code prompt buffer until `#`, exactly like a real IVR | Stray keys, wrong codes, detours — different on every run |
| 6 · the balance heard | The figure itself is `books[0]`, decided by code | Recognizing it as the answer and reporting it correctly |
| 7 · the lesson | The host's `admissible` check (name shape, description, minimum substance), the live registration, the durable JSONL write | Everything the lesson *says*: the route, the key sequence, the negative knowledge ("NOT under card services") — model-authored |
| 8 · RESET | Trail wiped, sessions forgotten, balance moved to `books[1]` — the anti-cheat, pure code | — |
| 9 · run 2 replays | The lesson handed to a fresh process at mount | Choosing to load the skill by name, trusting its route, keying `31731942#2` |
| 10 · key-ahead | Menus keyed past are never played and never charged — mechanics | — |
| 11 · measurement | The trail, prompts / keys / wrong turns / airtime / wall clock, the found-it stamps — read off the IVR's own log | — |
| 12 · the verdict | The assertions: the fresh figure reported, no balance inside the lesson, strictly fewer prompts — code judges | Being *right* is the model's doing; being *checkable* is the code's |

The web page belongs entirely in the left column: it renders the agent's
real tool-call stream and invents nothing.

## Run it

```sh
export DEEPSEEK_API_KEY=...
export DEEPSEEK_BASE_URL=https://openrouter.ai/api/v1   # optional; unset = DeepSeek
export DEEPSEEK_MODEL=deepseek/deepseek-v4-flash-0731   # optional
go run ./examples/13-phone-banking
```

Set `DSH_EXPLORER_MODEL` and `DSH_OPERATOR_MODEL` to two different ids to
have one model do the listening and another do the calling.

## The web face

The demo also hangs on a wall — and here an `OPENROUTER_API_KEY` alone is
enough, because the web demo checks both variables and aims itself:

```sh
export OPENROUTER_API_KEY=...      # or the DEEPSEEK_* trio, which wins when set
go run ./examples/13-phone-banking/web
# open http://127.0.0.1:8013 and press START DEMO
```

With only the OpenRouter key set, the demo uses `https://openrouter.ai/api/v1`
and that endpoint's model id (`deepseek/deepseek-v4-flash-0731`) on its own;
`DEEPSEEK_MODEL` and the `DSH_*_MODEL` variables still override the model.
The startup banner says which credential it chose and where it is aimed.

One binary, standard library only, page embedded. A touch-tone phone on the
left — silver keys, an LCD that shows every digit pressed — and the call
transcript typing out on the right. Every key that lights up and clicks
(a real DTMF tone pair, synthesized in the browser) and every prompt that
types out is the agent's own tool-call stream, broadcast live over
Server-Sent Events at the pace the model actually works. Nothing is
scripted and no browser robot clicks anything.

When a run hears the balance, the page stamps the moment — the figure, the
wall-clock time to find it, the airtime it cost. Run 1's stamp lands the
hard way; then the reset overlay announces the balance has moved, the page
wipes, and run 2's stamp lands in one keyed-ahead press. The final card is
the parent example's comparison table. A page opened mid-run catches up
instantly from the server's replay buffer and then continues live.

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
- `web/` — the same demo as a page to watch: keypad, DTMF clicks, typed
  prompts, stamps and the comparison, streamed live from the agent's own
  tool calls

Part of [the examples tour](../README.md).
