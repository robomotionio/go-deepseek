# 05 · composition — the plugin list is the product

**This one calls no model.** It proves its claim by inspection, which is the
right shape for it: what the embedded bundle can serve, what the default
composition would mount, and what two adjusted lists actually did mount —
side by side, as tool registries.

The line to sit with is the last one: `tool-web` was **added** to the
composition and mounted *nothing*, because it injects `web` and nothing in
this bundle provides it. An unsatisfied component waits rather than failing.
Example 10 is the other end of exactly that fact — a Go program satisfying a
waiting component's coeffect and watching it mount.

## Run it

```sh
go run ./examples/05-composition
```

## What to look for

- The bundle census: 64 modules, 29 of them dsh plugins.
- `default` vs `lean`: two agents from one binary, differing only in the list.
- The two quiet traps it demonstrates:
  - an entry's config **replaces** the plugin's defaults rather than merging;
  - a composition naming a plugin the bundle does not carry is refused at
    `Open`, not during a turn.

Upstream: `docs/cordis-tutorial/06-composition-and-hmr.md`,
`docs/config-catalog.md`.
Part of [the examples tour](../README.md).
