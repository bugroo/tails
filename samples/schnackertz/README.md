# Sample · Haus Schnackertz

**An unsolicited proposal, not their website.** Built to show what the same content could
look like. Every fact on the page — address, phone, hours, the dish and its price, the
1912 date, the alcohol-free line — was taken from `schnackertz.koeln` on 2026-09-07.
Nothing is invented. No reviews, no counts, no claims they have not made themselves.

The logo and photographs are theirs and are **not** reproduced here; the sample uses
their text only, and says on its face that it is a proposal.

## Why this one

Measured against the two other candidates, this site loses money in a way its owner can
see immediately:

| | schnackertz.koeln today |
|---|---|
| Phone tappable on a mobile | **No.** The number is plain text; you have to copy it by hand |
| Weight | 4 754 KB for 144 words |
| Time to first content | 1 772 ms · full load 5 459 ms |
| Images without alt text | 11 of 12 |
| Smallest body text | 12 px |

A restaurant where you book by phone, on a page where the phone number cannot be tapped.

## The form

```
tails · form: A6-B4-C3-D1-E1 · density: dense
```

- **A6 Board** — the offer is the hero. Today's hours, the phone, the house dish.
  Someone arriving wants to know *are they open and what do they have*, not to scroll
  past a mood.
- **B4 Dense-then-open** — the task at the top, the story below it.
- **C3 Surface** — sections divide by background, no rules.
- **D1 Framed** — their photographs, contained, as objects.
- **E1 None** — no scroll reveals. Sunday lunch is booked by people who want the number,
  not a performance.

Checked against the previous stamp in this repository (`A3-B3-C1-D5-E4`): differs on all
five axes.

---

## What the quality gate says about this sample, 2026-09-07

```
node checks/gate.mjs http://localhost:4600/ --dir=samples/schnackertz \
     --tier=craft --budget=500 --js-budget=100 --copy-checked
```

**NOT APPROVED — over budget.** Nine of ten parameters are met; the tenth is weight:

| | |
|---|---|
| Transferred at 1280 px | **1 187 KB** across 14 requests, 148 KB of it JavaScript |
| The budget this skill recommends for a local business | 500 KB, 100 KB JS |
| Contrast | worst **6,91:1** on the composited pixels, 10 measured, 4 the mask could not see |
| Ambition at `craft` | met — a moment, layers, motion, reduced motion handled |
| 320–1280 | no overflow |

**This is the skill failing its own sample, and it stays written down.** The number that
was quoted in an earlier note, 583 KB, is stale: it predates the food photographs, and
those photographs were added precisely because the person paying said a restaurant page
without them was not worth paying for.

So the two rules collide here, and the collision is real work, not a formatting problem:
a restaurant needs its food on screen, and its customers are on mobile data. The way out
is not to delete the photographs. It is `srcset` that actually serves the 800 px variants
above the fold, AVIF alongside JPEG, and the gsap bundle trimmed to the three plugins
that are used. Until that is done this sample is **NOT APPROVED**, and saying so is the
point of having a gate.
