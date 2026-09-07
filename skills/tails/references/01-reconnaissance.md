# Reconnaissance — looking outside the model

Loaded in phase 1, always.

## Why this phase exists

Your training data is the average. Every default you reach for without looking is a
vote for the mean. This phase is the only structural defence.

## What counts as a source

**Ranked, best first:**

1. **The live site itself** — its CSS, its type scale, its measured contrast, its DOM.
2. **Vendor documentation**, current version.
3. **Curated galleries** — for finding sites, not for reading opinions.
4. **A build write-up by the people who built it.**
5. **Listicles and "top 10" articles** — these are mostly SEO output and often
   AI-written. Use them to find names. Never quote them as fact.

**The rule:** search to locate real sites; then read the site, not the article about it.

## Where to look, and what each source is biased toward

Every gallery has a bias, and treating them as equal produces an agency site for a
corner shop:

| Source | Rewards | Use it for | Its bias |
|---|---|---|---|
| One-page galleries | Real businesses, normal budgets | **Small business, local, one-pagers** | Low risk, sometimes flat |
| Curated design indexes | Editorial restraint, typography | Type and grid | Minimal-elegant as the answer to everything |
| Award sites | Spectacle, technical ambition | One gesture, one idea | **Over-design.** Much of it is unaffordable and unmaintainable |
| Designer shot platforms | Composition, colour | Visual direction only | **Concepts that were never built.** Never proof that something works |

## The degraded path — when there is no tool

Say it, before building, in your own words:

> "I have no way to look anything up in this session, so I would be working from
> training data — which is the average I am here to avoid. Give me one or two reference
> URLs and I will work from those. Otherwise I will build a first draft blind and mark
> it as such."

Then **ask once for a reference**. If none arrives, build anyway — never stall the
user — and label the handoff as built without reconnaissance.

Do not go quiet about it and do not pretend the draft is calibrated. A user who is told
"this is blind" can judge it. A user who is not told will assume you looked.

## Version checks

Before naming any library: current version, licence, last commit. See
`references/08-collisions.md` § *Before you name any library*.
