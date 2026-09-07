# Migration — what happens to the design skills already installed

Written 2026-09-07, for the machine `tails` was built on. Useful to anyone with a
similar pile.

## The principle

`tails` absorbs **judgement**. It does not absorb **API reference** or **measurement
tooling**. A skill that tells you how `gsap.timeline()` is called does a different job
from one that tells you whether this page should move at all, and merging them produces
a document nobody can maintain.

So: three skills are replaced because they say the same thing in three voices. The rest
stay, and `tails` calls them.

## Replaced — turn off, do not delete

| Skill | Why |
|---|---|
| `design-distinctive-ui` | Same job. Its own *Provenance* section already declares it derives from `design-taste-frontend` and `impeccable-design-polish`, i.e. it is a copy of two of the projects benchmarked in the research log |
| `wx-design` | The same skill in Spanish. Two voices on one subject drift apart |
| `frontend-design` (plugin) | The shortest of the three; its content is a subset of `tails` phases 2 and 3 |

Turning three overlapping design skills off is the point of the exercise. Keeping them
"just in case" reproduces the problem: whichever loads first wins, and it will not be
the same one twice.

**How:** `skillOverrides` in `~/.claude/settings.json` → `"off"`. Reversible in one
line. Nothing is deleted.

## Kept — `tails` calls these, it does not contain them

| Skill | Called from | For |
|---|---|---|
| `webapp-testing` | Phase 5 | Driving a real browser: render, screenshot, read the console |
| `web-quality-audit` | Phase 5 | Performance, accessibility and SEO sweep |
| `fixing-accessibility` | Phase 5 | Repairing what the sweep finds |
| `core-web-vitals` | Phase 5 | LCP, INP, CLS when the build is motion-heavy |
| `fixing-motion-performance` | Phases 4–5 | Layout thrashing, compositor properties |
| `gsap-*` (core, timeline, scrolltrigger, utils, performance, plugins) | Phase 4 | **API reference.** `tails` decides *whether and why* something moves; these say *how it is written* |
| `context7` | Phases 1 and 4 | Current vendor documentation at the checkpoints |

Several of these may already be **off** on a machine that has trimmed its resident
context, and there is a real trade-off there rather than a free choice.

**Correcting what this file said before:** it claimed an off skill "saves nothing at
rest" because skills load on demand. That is wrong, and the machine this was written on
disproves it: turning a group of skills off cut resident context from 47,6k to 26,6k
tokens. A skill's *body* loads on demand, but its **name and description are resident**,
because that is how the model knows the skill exists at all. Off is a real saving and a
real loss at the same time.

What follows from that is narrow: keep on the ones `tails` actually reaches for. If the
`gsap-*` skills are off, phase 4 has no API reference to call and will fall back to
training data for syntax, which is exactly the failure mode this project exists to
avoid.

## Unaffected

Everything not about design: `medir-antes-de-afirmar`, `cruzar-la-junta`, `geo-*`,
infrastructure, server-audit and SEO skills that have nothing to do with design.

## Order of operations

1. `tails` reaches usable state (the nine pending reference files).
2. Run it once on a real brief, side by side with the current setup.
3. Only then turn the three replaced skills off.

Do not turn anything off before step 2. A skill that has never been used on real work
is not a replacement, it is a hypothesis.
