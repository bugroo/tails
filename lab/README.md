# lab — the bench

A hero built with the real stack, written to be broken. Findings go to
`skills/tails/references/08-collisions.md`.

```
pnpm install
pnpm dev          # http://localhost:4500
```

## Flags

Each switches one known collision on, so the same page can be measured in both states.
Anything that shows up in **both** states was never about that collision — that is how
the sticky claim in § 2 of the collisions file was caught being wrong.

| Flag | What it does |
|---|---|
| `?twoClocks=1` | Two RAF loops instead of one ticker |
| `?noLenis=1` | No smooth scroll at all — **the control** |
| `?leakWillChange=1` | Never clean up `will-change` |
| `?reduced=1` | Force the reduced-motion path |

The HUD bottom-left reports fps, worst frame in the last second, and worst frame ever.
Worst frame, not average: an average of 60 fps hides three 90 ms hitches, and the
hitches are what people feel.

## What the harness reads

`window.__lab` exposes `worstFrame()`, `willChangeLeft()`, `chars()` and the shared
`state`, so a Playwright script can measure without scraping pixels.
