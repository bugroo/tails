# Verify — look at it

Loaded in phase 5, always. This phase is not optional and it is not a formality.

The model that leads human preference on front-end work leads it because of a **visual
loop**: it renders what it wrote and iterates on what it sees. A model that ships without
looking ships the mean.

## The order

1. **Render it and look.** 320, 375, 768, 1280. Screenshot each. Do this first and do it
   with your own eyes: the gate below measures, it has no taste, and a page can be
   measurably correct and visually wrong.
2. **Run the gate.** One command, one verdict.
3. **Fix what it named.** Then run it again.

```bash
node checks/gate.mjs <url> --dir=<source> --tier=craft \
     --budget=500 --js-budget=100 --prev=<last stamp> --copy-checked
```

```
0  APPROVED
1  NOT APPROVED   — and it lists exactly which of the ten parameters is unmet
2  COULD NOT LOOK — an instrument did not see the page
```

**Exit 2 is not a softer 1.** It is the state this whole file exists because of: an
instrument that stopped looking and a page with no problems produce the same silence.
When the gate cannot see, it refuses to grade rather than award a pass.

## What the single gate folds together

| # | Parameter | Where it comes from |
|---|---|---|
| 1 | Static slop | `checks/slop.mjs`, thirteen rules |
| 2 | Form stamped and ≥ 3 axes from the last | `03-form.md` |
| 3 | Weight against the **declared** budget | `06-motion.md`. No budget declared is a failure in itself |
| 4 | Ambition at the declared tier | `checks/ambition.mjs`, folded in, not re-implemented |
| 5 | No JavaScript error | |
| 6 | Contrast on the composited pixels | rule 8 and rule 9 below, automated |
| 7 | No overflow 320–1280 | |
| 8 | Keyboard path, visible and unobscured focus | WCAG 2.4.11 |
| 9 | Reduced motion in **both** directions | rule 3 below |
| 10 | Nothing invented in the copy | judgement — an explicit attestation, never a measurement |

## How the contrast number is actually obtained

Two screenshots of every band, at the same scroll position, with animation paused:

1. the page as a person sees it;
2. the same page with every glyph made transparent.

**The pixels that differ are the glyphs.** The second screenshot, at exactly those
coordinates, is what is behind them: the photograph, the scrim, the blend mode, all of it
composited by the browser rather than inferred from CSS.

This replaced sampling the element's bounding box, which was wrong in both directions at
once. It read the checker's own marker as if it were page content, and it failed a
centred line of text because the empty half of its box happened to sit over something
dark. Both produced entirely plausible numbers.

Anything the mask cannot see is **named in the output**, never dropped. An unmeasured
element that nobody mentions is indistinguishable from a measured one that passed.

## The gate's own controls

`node checks/gate.mjs --selftest` runs three:

- a build that **must be approved** — a check that only fires on the bad case may be
  firing on everything;
- a build that **must be refused by all nine automatable parameters**;
- a URL that **cannot be read**, which must exit 2 and not be graded.

And on **every** run, not only in the self-test, the contrast checker measures two probes
injected into the page under test: black on white, which must return 21,00:1, and a grey
nobody can read, which must return 1,65:1 **and be reported as a failure**. A magenta
marker is planted at a known pixel; if the sampler cannot find it, the run is void.

Three deliberate mutations were run against this gate on 2026-09-07 and all three turned
it red: blinding the glyph mask, removing the HTTP status check, and handing the bad
fixture a form stamp it had not earned. A control that has never been seen red is not
information.

## Still done by hand, and by eye

1. **Look at the screenshots.** Rhythm, hierarchy, whether the page is worth its subject.
2. **Read every line of copy** against a source. That is what `--copy-checked` attests.
3. **Run the slop test** (`10-slop-test.md`), both halves.

## Static analysis is a first pass, never the verdict

`checks/slop.mjs` reads text. It is blind to the cascade, to `@supports`, to media
queries, and to everything computed. Measured on a real stylesheet, **four of twelve
findings were false positives** for exactly that reason.

**Anything about a final rendered value — tracking, contrast, real sizes, whether a
sticky element sticks — is measured in a browser.** The two are not substitutes.

## The rules that came from getting this wrong

Seven measurement failures in one session produced these, and every one of them cost an
hour:

**1 · Declare the plausible range before you read the number.**
A frame delta below 16 ms at 60 fps is impossible. A headline smaller than the body text
is impossible on an agency site. Both happened, both were believed briefly, and the
impossibility is the only thing that caught them.

**2 · Run the control, every time.**
An effect that also appears in the control run is not a finding, it is a broken
instrument. A sticky test reported failure in four configurations including the one with
no smooth scroll at all.

**3 · Both directions, or it proves nothing.**
A check that only fires on the bad case may fire on everything. A check that only stays
quiet on the good case may be dead. `--selftest` runs both, and so should you.

**4 · Verify the page before you measure it.**
Status code, and a positive marker that this is the page you meant — a title, an element
that exists only there. A 404 was measured as a studio's homepage and returned a complete,
well-formed, entirely wrong result. **A measurement of the wrong URL looks exactly like a
measurement.**

**5 · Wait for the page to finish being itself.**
Sites with entrance animations return nav links as "the largest text" if you measure at
four seconds. Wait, scroll to trigger reveals, and prefer declared values over what
happens to be visible.

**6 · Read the whole set, not the first element.**
A `prefers-reduced-motion` test that read the first character of a staggered animation
reported "no animation" in both directions — because the first character had already
finished.

**7 · One clock, one unit.**
`gsap.ticker` gives seconds, `requestAnimationFrame` gives milliseconds. Measuring each
branch with its own callback argument produced a completely false performance comparison.
Use `performance.now()` everywhere.

**8 · Resolve colours through the browser, never with a regular expression.**
`getComputedStyle().color` returns whatever the stylesheet declared — and this skill
tells you to declare `oklch()`. A contrast checker that assumes `rgb()` will parse
`oklch(22% 0.018 55)` as the numbers 22, 0.018 and 55, and report **≈1,05:1 for every
element on the page**. That happened on the first sample built with this skill: thirteen
elements, thirteen identical impossible failures.

```js
// resolves oklch, lab, color-mix, hsl, named colours — anything the browser accepts
const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
const toRGB = (css) => { cv.fillStyle = '#000'; cv.fillStyle = css; cv.fillRect(0,0,1,1);
  const d = cv.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]]; };
```

**And give the checker its own control:** black on white must return 21:1. If it does not,
the checker is broken and every number it produced is worthless. That one line is what
separated "thirteen failures" from "all pass, worst case 6,61:1" — the same page, twice.

**9 · Text over an image is measured against the image's pixels, not the CSS.**
`getComputedStyle` gives you the background of the *container*. Text sitting on a
photograph has no CSS background behind it, so a normal contrast check reads the section's
colour and returns a clean pass for the most visible element on the page.

Measured on the first sample: the checker said *all pass*; sampling the actual pixels of
the plate photograph under the headline gave **1,09:1 at its worst point against a 3:1
floor**.

```js
// draw the image into a canvas, map screen coords through object-fit, sample
// under the text box — or screenshot the composited page and sample that,
// which also captures any scrim drawn on top
```

**And when it fails, more scrim is usually the wrong fix.** A gradient dark enough to
rescue light text flattened the photograph, which was the argument of the page. The
answer was to move the type off the image entirely: the photo keeps all of itself, and the
headline sits below it on paper at 14:1 with no shadow at all. Two measurements, one
composition change, and both problems gone.

**10 · A pixel outside the box is not the element's background.**
Sampling a bounding box with `ceil(x + w)` reads the first pixel belonging to whatever is
next to it. The black-on-white control came back **1,11:1** against a dark neighbour: a
one-pixel arithmetic error, on the instrument's own control, producing a number nobody
would question if the control had not been there to make it impossible. Sample inside the
box — better still, sample only the pixels the glyphs actually cover.

**11 · An element that could not be measured is not an element that passed.**
Every sampler drops things: clipped, covered, off-screen, too few pixels to judge. Count
them and print the count. Silence about a skipped element reads exactly like a pass.

## Separate startup from steady state

They have different causes and different fixes, and mixing them hides both. On the bench,
worst frame during load was 92–114 ms in every configuration including the control — that
is compilation and first paint, not the animation. Steady state was a clean 60 fps
everywhere.

Say which one you measured.

## A light scene proves nothing

Seven planes and a fifteen-character split held 60 fps on a phone with its CPU throttled
six times. That measures the size of the scene, not the quality of the stack. **If the
real build is heavy, measure the real build.**

## What emulation does not give you

It gives the engine and a slow CPU. It does not give thermal throttling, real GPU memory
limits, or browser chrome that resizes as you scroll — and that last one is a documented
cause of scroll inertia dying on iOS. **A physical phone is not optional for anything
motion-heavy**, and if you did not have one, say so.

## The handoff

State, in order:

1. What it is.
2. What was verified, how, and at what widths — with the exit codes.
3. **What was not verified, and why.**
4. What breaks first if nobody maintains it.

An unmeasured thing named is information. An unmeasured thing unmentioned is a claim.
