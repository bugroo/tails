# tails

**A design skill for coding agents that refuses to build the average.**


---

## The problem it is built around

Models produce the statistical mean of their training data. That is measured, not
opinion: a 2024 *Nature* paper on model collapse documents that models trained on
generated data lose the tails of the distribution and converge to reduced variance.
Distinctive design lives in those tails.

The mean has a face you already know: Inter everywhere, an indigo-to-purple gradient,
three rounded cards in a row, a dark hero, a gradient *Get Started*. Not ugly.
**Generic — which is worse, because generic is forgettable.**

And a large part of it is not even the model. It is written into the tools: one
popular builder's own system prompt fixes a single stack, tells the model to *"always
generate beautiful designs"*, and includes a `linear-gradient(135deg, …)` as its
worked example. The gradient is taught, not inferred.

## What tails does differently

Three mechanisms, not three opinions:

1. **It looks outside the model.** Live sources at defined checkpoints — and when it
   has no way to look, it *says so before building* instead of quietly serving the
   average.
2. **It commits to a form before writing code, and stamps it.** Five axes — hero
   composition, section rhythm, division language, image treatment, reveal pattern —
   give 3 750 combinations. The stamp goes in the CSS, and the next build in that
   project **must differ on at least three axes**. Deterministic, not inspirational.
3. **It looks at what it made.** Rendered, at four widths, contrast measured against
   the real background, keyboard path walked.

## What makes it usable on real work

- **It never refuses the brief.** WebGL for a hair salon gets built, and built well.
  What it adds is the survival plan: degradation, a performance budget, a
  reduced-motion path, and something that still works in a year.
- **It knows where the stack breaks.** Two libraries claiming the scroll, two RAF
  clocks drifting, `position: fixed` inside a transformed ancestor, `will-change` left
  on, and the iOS address bar whose `resize` kills momentum scrolling. Each entry
  carries what happens, **how to check it**, and the date it was verified.
- **It has a density axis, not a style.** How much work does the page have to do? A
  cinema built around negative space is a beautiful site where nobody can buy a
  ticket.
- **It carries no project's brand.** Nothing about any client lives in the skill. That
  belongs in each project's own `DESIGN.md`. The skill answers *how you design*; the
  project answers *how this one looks*.
- **It refuses to hand over unfinished work.** One command decides, not the model:

  ```
  node checks/gate.mjs <url> --dir=<source> --tier=craft --budget=500 --copy-checked
  ```

  Ten parameters, one verdict — `APPROVED`, `NOT APPROVED`, or `COULD NOT LOOK` — and the
  third is not a pass. Contrast is measured on the composited pixels under the glyphs, so
  text on a photograph is judged against the photograph. The gate exercises itself against
  known answers on every run and has been seen going red under three deliberate mutations.

## Install

**As a plugin**, which is the whole thing: the skill, the checks, the single quality
gate, the one reviewer, and the hook that enforces them.

```
/plugin marketplace add bugroo/tails
/plugin install tails@tails
```

The repository is its own marketplace, so those two lines are the whole installation.

Node 18 or later is needed for the checks, and Playwright for the ones that drive a
browser (`gate.mjs`, `ambition.mjs`, `baseline.mjs`). The static detector `slop.mjs`
needs neither.

```
.claude-plugin/plugin.json     the manifest
skills/tails/                  SKILL.md + references, loaded on demand
agents/paying-client.md        one isolated reviewer, sonnet, Read only
commands/tails-verdict.md      the quality stage: gate, then look, then the reviewer
hooks/stop-gate.sh             refuses to let an unverified build close
checks/                        the detectors
```

### The part that does not ask nicely

A document cannot make anything happen. Every skill ever written says "verify before you
ship", and the model that just spent an hour on a page is exactly the wrong judge of
whether it is finished. So the plugin ships a **Stop hook**, and it does not let the turn
end while a `tails` build in the working directory has no earned verdict.

It blocks when:

- there is **no verdict** for a stamped build;
- the last verdict was **NOT APPROVED** or **COULD NOT LOOK** (it names what was unmet);
- the verdict is APPROVED but was taken **without `--expect`**, so nothing confirms the
  gate measured the intended page;
- the verdict is APPROVED but was taken **without `--copy-checked`**, so nothing attests
  the copy is not invented;
- **the source changed after it was approved.** The gate writes a receipt fingerprinted
  over every html, css and js file it judged. Edit one byte and the verdict stops
  applying, which is the point: a verdict is about a specific page, not about a project.

It stays silent everywhere else. It only looks at directories carrying a
`tails · form:` stamp, which means no stamp, no tails, no blocking; `fixtures`
directories are skipped by name, and any directory can opt out with a `.tails-ignore`
file. A gate that fires where it does not belong gets switched off, and a switched-off
gate protects nothing.

**Seen working, in both directions**, which is the standard this repository holds itself
to: nine controls covering a clean directory, a stamped build with no verdict, a real
APPROVED verdict written by the gate itself, that same verdict after one byte of the
source changed, a NOT_APPROVED verdict, an APPROVED verdict missing `--expect`, a second
Stop in the same turn, `.tails-ignore`, and a fixtures directory.

**As a bare skill**, if your agent has no plugin mechanism: copy `skills/tails` into its
skills directory. You lose the reviewer and keep everything else; the skill says so at
the point where it would have used it.

### About the one agent

There is exactly one, and that is a decision rather than a starting point.

- **It runs once**, at the end, after the gate is already green. Never per iteration,
  never during design.
- **`model: sonnet`, fixed.** Looking at four screenshots and answering four questions
  does not need a larger model, and an agent left on `inherit` quietly costs whatever the
  main session costs.
- **`tools: Read`.** No shell, no network.
- **Its context is isolated on purpose.** It is given the screenshots, one line about the
  business and the price, and nothing else. A reviewer who has read your reasoning agrees
  with your reasoning.
- **It carries no design criteria at all.** No checklist, no best practices, no palette.
  A role prompt is criteria smuggled in through the back door, and generic criteria are
  the average this whole project exists to avoid. The criteria live in the reference
  files, where they are measured and dated. The agent is a pair of eyes and a wallet.

Rough cost, estimated rather than measured: four 1280×800 screenshots at roughly
`width × height ÷ 750` tokens each, plus the instruction and a short answer, is on the
order of 7 000 Sonnet tokens per finished build. The permanent cost of a plugin's agents
appearing in every session's agent list is about a hundred tokens each, which is another
reason there is one and not seven.

## What is measured, not asserted

Everything in the reference files was produced on 2026-09-07 by building a bench and
reading real sites, not from training data. Some of it contradicts what the articles say:

- **Two clocks cost nothing in frame rate.** Measured across desktop, a mid-range phone
  with CPU throttled ×6, and real WebKit: 60 fps in every configuration. The rule stays,
  because what it buys is synchronisation — but the performance claim did not survive.
- **Smooth scroll does not break `position: sticky`** with a library that rides the
  native scroll. It held at 80 px in every configuration including the control.
- **Half of the most celebrated Japanese studios run no WebGL on their own site.**
  Rhizomatiks publishes on WordPress with a jQuery carousel.
- **Distinction is not bought with weight.** obys.agency ships 59 KB with the strongest
  typographic identity in the measured set. resn.co.nz ships 23,6 MB. Both won awards.
- **Not one measured site uses Inter.**

Seven measurement failures happened along the way, all of them producing plausible
numbers. They are written into the files as rules, because catching them is the skill.

## Layout

```
skills/tails/SKILL.md          the pass: six phases, eight non-negotiables
skills/tails/references/       thirteen files, loaded on demand
checks/gate.mjs                the single verdict · --selftest
checks/slop.mjs                deterministic static detector · --selftest
checks/ambition.mjs            what is MISSING from a correct page · CLI and importable
checks/lib/png.mjs             dependency-free PNG decoder, for reading real pixels
checks/fixtures/               one build that must pass, one that must be refused
lab/                           the bench: a real hero, built to be broken
samples/                       a real brief, built end to end
docs/research/                 the measured landscape, with dates
docs/migration.md              what to do with design skills already installed
```

## Status

**Proven on one real brief, unproven at the heavy end.** A one-page site for a
restaurant was built with it end to end, rejected three times by the person paying, and
rebuilt until it passed — each rejection is now a rule in the reference files. The
quality gate exists, decides, and has been watched failing.

What has **not** been done: a WebGL-heavy build. Several entries in
`references/08-collisions.md` are still marked *not measured* for exactly that reason —
real GPU memory on a mid-range phone, thermal throttling, and iOS address-bar inertia on
physical hardware. They are named rather than guessed at.

## Licence

MIT.
