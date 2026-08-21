# 12 · advanced-learning — a day's RPA, learned once

Example 11 taught the agent a fact; this one has it learn a **job** — the
shape of an enterprise web application it has never seen, and the policy the
business applies inside it. That is the expensive part of real process
automation, and it is expensive exactly once.

This program serves a **Workmonth HR portal** on loopback with six pending
leave requests, and gives the agent two Go functions — `open` and `submit` —
holding a cookie jar and an `http.Client` fenced to that one origin. That is
a browser in the only sense an RPA needs one. Nothing else about the site is
in the prompt: no map, no field names, no policy.

```
run 1   explore   sign in, wander, find the policy, decide six requests,
                  then record the whole route with `learn`
RESET             the queue goes back to six pending, every session forgotten
run 2   replay    a new process, a new session, the same task, and the lesson
                  replayed into ctx.skills before the first token
```

**The portal is awkward on purpose**, in the specific ways enterprise
software is awkward: login fields called `u` and `p`, a session cookie, a
per-page token a POST is refused without, a paginating queue, the leave
policy on a page nothing links to prominently, a denial-reason format the
portal enforces, and a bulk endpoint that is not where you would look first.

**Verification never believes the agent.** The portal is a Go struct in this
process; the assertions read its state and check every decision against the
policy written in Go beside the handbook page. Three approvals, three
denials, each denial naming the one rule it actually breaks.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/12-advanced-learning
```

Set `DSH_EXPLORER_MODEL` and `DSH_OPERATOR_MODEL` to two different ids to
have one model do the exploring and another do the work — only one of the two
has to be clever.

## What to look for

- The request trail: run 2's first HTTP request is `POST /login` — it never
  fetched the login page, because the lesson says what the form takes.
- The captured comparison: 15 requests vs 10, 2m32s vs 57s, both correct.
- `go test ./examples/12-advanced-learning` walks the entire job with no
  model — the token trap, the reason format, the pagination, the bulk route,
  and the one-origin fence — so the task is provably doable before a model is
  spent on it.

Part of [the examples tour](../README.md).
