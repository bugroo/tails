# The slop test

Run before handing anything back. Two halves, and the split is the point.

**Half one is code.** `checks/slop.mjs` decides without a model, without an API key and
without a network. Asking a model *"is this generic?"* asks the same distribution that
made it generic. Code does not have that problem.

**Half two is judgement.** Things no regular expression can see. These need you, and
they need you to be honest.

---

## Half one · what the machine decides

```bash
node checks/slop.mjs <file|dir>       # 0 clean · 1 findings · 2 could not look
node checks/slop.mjs --selftest       # prove the detector can still fail
```

Twenty-three rules, each with a reason attached. Fourteen read the stylesheet, nine read
the text a person reads (script and style bodies are stripped first):

| Rule | Fires on |
|---|---|
| `default-face` | Inter, Roboto, Open Sans, Poppins, Lato in a `font-family` |
| `indigo-gradient` | Indigo/violet gradients, the most recognisable tell there is |
| `gradient-text` | `background-clip: text` |
| `card-stripe` | A side border of 3 px or more on a card |
| `cream-surface` | A warm cream background or surface token that nobody asked for (replaced `pure-black-white`: four of five award-winning sites use pure white and pure black) |
| `transition-all` | `transition: all` |
| `static-will-change` | `will-change` outside a hover/focus/animating state |
| `viewport-unit-mobile` | `100vh` instead of `svh`/`dvh` |
| `loose-display` | Type ≥ 40 px at line-height ≥ 1,3 |
| `untracked-display` | Type ≥ 48 px with no `letter-spacing` |
| `italic-heading` | `font-style: italic` on a heading or hero title |
| `focus-by-border` | Focus ring built from `border` instead of `outline` |
| `pulsing-halo` | A `@keyframes` whose `box-shadow` fades out to alpha 0: a halo that pulses |
| `fake-window` | macOS traffic-light hexes: a product screenshot built out of divs |
| `no-form-stamp` | No `tails · form:` stamp in the stylesheet |
| `emoji-as-icon` | An emoji opening a heading or list item |
| `em-dash` | An em-dash anywhere a person reads |
| `numbered-eyebrow` | `001 · Capabilities`, `00 / INDEX`, `01 / 4` as labels |
| `scroll-cue` | "Scroll", "↓ scroll to explore", "Scrollen" as a label |
| `dot-strip` | Four or more values joined by middle dots on one line (a NAP line with two is not a strip) |
| `version-stamp` | `v1.4.2`, `Build 0048`, "last sync" on a page that is not a devtool |
| `locale-strip` | A clock and a temperature on the same line |
| `quiet-trust` | "Quietly trusted by" |

The nine text rules and the two new stylesheet rules came from Leonxlnx/taste-skill §9.F
and §9.G (MIT, read 2026-09-20), kept only where a regular expression can decide. Before
they went in they were pointed at claveon.de's build and at both samples: `dot-strip`
started at three values and fired on every footer address line, so it moved to four;
`em-dash` found three in the schnackertz sample, and those are real.

**Exit code 2 exists on purpose.** "No files found" must never come back as "no problems
found". A checker that reports success when it could not look is the single most common
way a green result means nothing.

### The self-test is not optional

`--selftest` runs a deliberately awful fixture and a deliberately clean one, in CSS and
then again in HTML for the text rules:

```
positive control · bad fixture: 15 rules fired  ✓ every rule that should fire, fired
negative control · good fixture: 0 rules fired  ✓ no false positives
```

**Both directions.** A checker that only proves it can fire will eventually fire at
everything and get switched off; one that only proves it stays quiet may be dead. Run it
after touching any rule.

### What it looked like on real code

Run against 3 000+ lines of a production stylesheet on 2026-09-07: **12 findings, none
absurd** — but when each one was checked against the rendered page, **four of the twelve
were false positives** and the rest were `#fff` used on coloured surfaces plus a missing
stamp. See the next section: that exercise is where this detector learned its limits.

Run against this repository's own `lab/`: **two findings, and one was genuine** — a
static `will-change` in a stylesheet whose own documentation says not to do that. It was
fixed. The other was a false positive on `#fff` under `mix-blend-mode: difference`, where
white is not a colour choice but the inversion operand; the rule now knows that
exception.

> Both of those happened because the detector was pointed at real code instead of only
> at its own fixtures. **Do that with every rule you add.**

### Where static analysis stops, and it matters

Pointing the detector at that same production stylesheet a second time — this time
checking each finding against the rendered page — turned up **two more false positives,
and both are structural, not bugs**:

- **`untracked-display` cannot resolve the cascade.** The file declared
  `letter-spacing: -0.02em` on a grouped `h1,h2,h3,h4` selector and the sizes in a later
  rule. The tracking was correct; the rule fired three times out of three. Measured in
  the browser, those same headings render at −0,035 em and −0,028 em.
- **`viewport-unit-mobile` cannot see `@supports`.** Declaring `100vh` and overriding it
  inside `@supports (min-height: 100svh)` is the *correct* progressive-enhancement
  pattern. The rule was reading a deliberate fallback as a defect.

Both rules now know about their exception, at the cost of some recall. **That trade is
deliberate: a rule that cries wolf gets switched off, and a switched-off rule protects
nothing.**

**The general lesson.** Text-level analysis is cheap, runs anywhere, and needs no
browser — and it is blind to the cascade, to `@supports`, to media queries and to
anything computed. Use it as a fast first pass. **Anything about final rendered values —
tracking, contrast, actual sizes — has to be measured in a browser** (`11-verify.md`).
The two are not substitutes.

---

## Half two · what you have to judge

The machine cannot see these. Answer every one honestly; any *yes* is a revision, not a
note for later.

### Structure

1. Could this page's shape belong to any other business? If yes, the form was not chosen
   (`03-form.md`).
2. Does it share three or more axes with the last build in this project? Read the stamp.
3. Is every section the same shape as the one above it — heading, paragraph, three items?
4. Is the hero everything centred on one vertical axis?
5. Is there a numbered sequence over content that has no order?
6. Is a product being shown as a screenshot that was built out of `<div>`s: a fake task
   list, a fake terminal, a fake dashboard? Use a real capture, a real component, or
   nothing.

The machine now counts the rest of the shape in `checks/structure.mjs` (eyebrows per
section, nav rows and height, wrapped buttons, hero stack, layout families, consecutive
image+text splits, marquees). What it counts is the number; whether the number is right
for this brief is still yours.

### Content

7. Is there a claim, number, review, award or local detail that is not in a source you
   can point at? **Delete it or ask.** No exceptions.
8. Is any text placeholder that a reader would mistake for real?
9. Would this copy work verbatim for a competitor?
10. Does the CTA hide the outcome? "Get Started" says nothing; "See the showtimes" says
   what happens.
11. Do two buttons on the page mean the same thing with different words ("Get in touch",
    "Let's talk", "Start a project")? One intent, one label, everywhere it appears.
12. Are there labels that perform craft instead of naming ("Field notes", "From the
    bench", "Step 1 / Step 2 / Step 3", a photo credit under a stock image)? Plain
    functional labels, or none.
13. Is there a pill or tag laid over a photograph, or a sentence under a section label
    explaining the section? The image speaks alone; the heading is enough.

### Craft

14. Is the density position defensible from the task, or was it chosen by taste?
15. Can every moving thing be defended as pacing, revealing or giving weight — rather
    than decorating?
16. Is there decoration that could disappear without changing meaning, brand or
    atmosphere?
17. Does the colour carry information — category, state, action — or is it filling space?
18. Is there anything here that exists because it was easy rather than because it was
    right?

### The one that catches what the others miss

19. **Would somebody believe a person designed this?** If the honest answer is no, start
    again. Not adjust — start again. Adjusting the average produces a tidier average.

---

## Before you say it is done

State plainly, in the handoff:

- Which checks ran and what they returned, **including the exit code**.
- What you looked at with your own eyes, at which widths.
- **What you did not verify, and why.** An unmeasured thing named is information; an
  unmeasured thing unmentioned is a claim.
