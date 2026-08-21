# 04 · tools — your functions, as tools

Two Go functions over a deterministic in-memory dataset, exposed to the agent
as `order_status` and `refund_window`. The program prints `h.Tools(ctx)`
**before** the turn, so the Go tools are visibly sitting in one registry
beside `read`, `edit` and `todo_write` — one list, no second-class citizens.

The question asked is one no model could answer from training data — a
per-category refund policy against a delivery date — so a pass cannot be the
model being agreeable.

## Run it

```sh
export DEEPSEEK_API_KEY=...
go run ./examples/04-tools
```

## What to look for

- The registry line: harness tools and this program's Go tools, together.
- The parameter-spec shape: `"required": true` *inside* each parameter.
- A returned error becomes what the model is told — so
  `no order "A-9"; known orders: A-4108, A-4471, A-4472` earns a corrected
  retry where a bare `not found` earns a shrug.
- Each `Execute` runs on its own goroutine and must honour its
  `context.Context`.

Upstream: `docs/cookbook/adding-a-tool.md`.
Part of [the examples tour](../README.md).
