---
description: The quality stage. Runs the single gate, then the one isolated review, once. Use when a build is finished, never while designing.
argument-hint: <url> --dir=<source> --tier=craft|standard|utility --budget=<KB> [--prev=<stamp>] [--price=<what you are asking>]
---

# The quality stage

This is the only place in `tails` where anything is judged, and it happens once,
at the end. Not per iteration. Running it on work in progress wastes tokens and
produces an opinion about a page that does not exist yet.

Run it in this order and stop at the first thing that fails.

## 1 · The gate decides first, because it costs nothing

```bash
node ${CLAUDE_PLUGIN_ROOT}/checks/gate.mjs $ARGUMENTS --copy-checked
```

Pass `--expect=<some text only this page contains>`. Without it the gate cannot
confirm it measured the page you meant, and a measurement of the wrong page
looks exactly like a measurement.

Only pass `--copy-checked` if you have actually checked every number, review,
opening time, price and local detail against a source you can point at. It is an
attestation, not a flag that makes the output shorter.

**If it returns NOT APPROVED or COULD NOT LOOK, stop here.** Fix what it named
and run this command again. Do not continue to step 2: there is no point asking
anyone whether they would pay for something that is not finished.

## 2 · Look at it yourself

Screenshot at 320, 375, 768 and 1280 and **open the images**. The gate measures;
it has no taste and it cannot see a collision between a diacritic and the line
above it. Fix anything you find, then re-run step 1.

## 3 · The one isolated review, exactly once

Launch the `paying-client` agent with **only** these three things:

- the screenshot paths,
- one line saying what the business is,
- the price being asked (`--price`, or ask before running this).

**Give it nothing else.** No reasoning, no stack, no measurements, no defence of
the design. Everyone else in the process has seen the argument for the page,
which is why nobody else can still tell whether the page makes it alone.

It answers four things: what it thinks the business is, whether it would pay and
how much, the single thing most stopping it, and what it would show its family.

## 4 · What to do with the answer

- **It could not tell what the business is** → nothing else matters yet. The page
  does not communicate. Start from the subject, not from the styling.
- **It would pay less than the asking price** → the gap is the work. The single
  thing it named is where that work goes.
- **There is nothing it would show anybody** → the build is correct and
  forgettable, which every other check in this plugin will happily approve.

**Do not run the agent again after a detail change.** Run it again only when the
build has changed in a way that would change the answer, and at most twice for
any one project. If you find yourself wanting a third opinion, the thing you
actually need is a decision.
