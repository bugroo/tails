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

Thirteen rules, each with a reason attached:

| Rule | Fires on |
|---|---|
| `default-face` | Inter, Roboto, Open Sans, Poppins, Lato in a `font-family` |
| `indigo-gradient` | Indigo/violet gradients — the most recognisable tell there is |
| `gradient-text` | `background-clip: text` |
| `card-stripe` | A side border of 3 px or more on a card |
| `pure-black-white` | `#000` / `#fff` as a base *(skips blocks using `mix-blend-mode: difference`)* |
| `transition-all` | `transition: all` |
| `static-will-change` | `will-change` outside a hover/focus/animating state |
| `viewport-unit-mobile` | `100vh` instead of `svh`/`dvh` |
| `loose-display` | Type ≥ 40 px at line-height ≥ 1,3 |
| `untracked-display` | Type ≥ 48 px with no `letter-spacing` |
| `italic-heading` | `font-style: italic` on a heading or hero title |
| `focus-by-border` | Focus ring built from `border` instead of `outline` |
| `emoji-as-icon` | An emoji opening a heading or list item |
| `no-form-stamp` | No `tails · form:` stamp in the stylesheet |

**Exit code 2 exists on purpose.** "No files found" must never come back as "no problems
found". A checker that reports success when it could not look is the single most common
way a green result means nothing.

### The self-test is not optional

`--selftest` runs a deliberately awful fixture and a deliberately clean one:

```
positive control · bad fixture: 13 rules fired  ✓ every rule that should fire, fired
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

### Content

6. Is there a claim, number, review, award or local detail that is not in a source you
   can point at? **Delete it or ask.** No exceptions.
7. Is any text placeholder that a reader would mistake for real?
8. Would this copy work verbatim for a competitor?
9. Does the CTA hide the outcome? "Get Started" says nothing; "See the showtimes" says
   what happens.

### Craft

10. Is the density position defensible from the task, or was it chosen by taste?
11. Can every moving thing be defended as pacing, revealing or giving weight — rather
    than decorating?
12. Is there decoration that could disappear without changing meaning, brand or
    atmosphere?
13. Does the colour carry information — category, state, action — or is it filling space?
14. Is there anything here that exists because it was easy rather than because it was
    right?

### The one that catches what the others miss

15. **Would somebody believe a person designed this?** If the honest answer is no, start
    again. Not adjust — start again. Adjusting the average produces a tidier average.

---

## Before you say it is done

State plainly, in the handoff:

- Which checks ran and what they returned, **including the exit code**.
- What you looked at with your own eyes, at which widths.
- **What you did not verify, and why.** An unmeasured thing named is information; an
  unmeasured thing unmentioned is a claim.
