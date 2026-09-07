# Typography — where distinctiveness lives or dies

Loaded in phase 4, always. If you get one thing right, get this one.

Type is the cheapest way to stop looking generated and the fastest way to start. It
costs nothing to render, it works before any image loads, and it is the first thing a
trained eye reads as "someone chose this" or "nobody did".

---

## What award-winning studios actually do, measured

Nine sites read from the inside on **2026-09-07**: computed type from the rendered page
after the loaders finished. Studios with Awwwards records, plus the Japanese set.

| Site | Display size | Family | Tracking | Line-height | Body | Contrast |
|---|---|---|---|---|---|---|
| garden-eight.com | **215 px** | gunsan, w600 | normal | **0,76×** | 14 px | **15:1** |
| unseen.co | 90 px | Neue Montreal | **−1,44 px** | **1,00×** | 14 px | 6,4:1 |
| basement.studio | 87 px | Geist, w600 | **−3,48 px** | **0,90×** | 16 px | 5,4:1 |
| obys.agency | 80 px | **Obys** (their own) | **−2,40 px** | **1,00×** | 11 px | **7,3:1** |
| resn.co.nz | 59 px | Fort-Extralight | **−1,17 px** | **0,99×** | 15 px | 3,9:1 |
| shiftbrain.com | 20 px | TT Norms | normal | — | 14 px ×556 | dense pole |
| rhizomatiks.com | 15 px | Libre Baskerville | — | 2,00× | 15 px | dense pole |

### The five patterns, and every one of them is the opposite of the default

**1 · Negative tracking on display type, always.** −1,17 · −1,44 · −2,40 · −3,48 px.
Every single one. And it scales with size: the bigger the type, the more negative. Left
at `normal`, large type looks loose and amateur, because the spacing that works at 16 px
is far too wide at 90.

```css
.display { letter-spacing: -0.03em; }   /* start here, tighten as size grows */
```

**2 · Line-height at or below 1,0 on display type.** 0,76 · 0,90 · 0,99 · 1,00 · 1,00.
The web default is around 1,5 and every generated page inherits it. A headline at 1,5
reads as a paragraph in a big font; at 0,9 it reads as a *headline*.

```css
.display { line-height: 0.92; }         /* below 1 is normal here, not a mistake */
```

**3 · Scale contrast between 4:1 and 15:1.** A generated page uses a smooth modular
scale where each step is 1,25× the last, and the display ends up 2–3× the body. These
sites jump from 14 px to 90 px with **nothing in between**. Two or three sizes total,
far apart.

> The smoothness of a modular scale is itself a tell. Real hierarchy is a cliff, not a
> ramp.

**4 · Small body text.** 11 · 14 · 14 · 15 · 16 px. Nobody sets body at 18–20 px. The
drama comes from the display, not from inflating everything.

**5 · Not one site in the set uses Inter.** Observed instead: Fort, Obys *(a house
face)*, Geist, Neue Montreal, Saol Display, nbarchitekt, flauta, gunsan, TT Norms,
Roobert, lausanne, Yu Gothic, Garamond Premier Pro, Noto Serif JP.

`Times` appears as a declared fallback on three of them, which is the signature of a
real webfont being loaded rather than a system stack being accepted.

---

## Inter, and why it became the mark

Inter is a good typeface. That is not the problem. The problem is that it is **the
statistical default**: it is what a model reaches for when nobody made a decision, so
its presence reads as absence of choice.

Use it when the brief argues for it — dense UI, interface chrome, a product that already
uses it. Do not use it as the answer to "what font".

**The practical rule:** if you cannot say in one sentence *why this typeface for this
business*, you have not chosen one yet.

---

## Choosing, when there is no brand

Two faces is a system. Three is usually one too many.

| Role | What it does | How to pick |
|---|---|---|
| **Display** | Carries the personality. Used large, rarely | The one decision that must be specific to this business |
| **Body** | Disappears. Readable at 14–16 px, long text | Boring is correct here |
| *(optional)* **Utility** | Captions, data, code | Only if the content actually has data or code |

**Where to look**, in order: a foundry with a free or affordable licence; Google Fonts
*beyond the first screen* (the first screen is where the average lives); a variable font
so one file covers the whole weight range.

**The pairing that reads as considered**, seen twice in the set above: a neutral grotesk
for everything, plus a serif — often italic — used *surgically* inside headlines as the
accent. The accent is the serif, not a colour. Cheap, distinctive, and hard to make ugly.

---

## The floor

- **Measure, not `em` guesses.** Body between 14 and 18 px, and the line between 45 and
  75 characters. Wider than 80 and the eye loses the line return.
- **Contrast computed against the actual background**, not the intended one. See
  `11-verify.md`.
- **Text is text.** Never an image, never inside the canvas without a DOM equivalent —
  see the two-layer hero pattern in `06-motion.md`.
- **`text-wrap: balance`** on headlines, **`text-wrap: pretty`** on body. Cheap, and it
  removes the single-word last line that makes a layout look unfinished.
- **Do not animate `font-size`.** It runs on the main thread — it is not hardware
  accelerated — and it drags the whole scroll-driven animation onto the main thread with
  it. Animate `transform: scale()` instead. *(Reported by Bramus Van Damme, Chrome
  DevRel; custom properties have the same problem.)*

---

## Method note

Three measurement attempts were needed to get the table above, and the failures are
instructive because they will happen to you:

1. **Measuring at 4 seconds** on sites with entrance animations returned nav links as
   "the largest text", producing impossible contrast ratios below 1:1 — a headline
   smaller than the body. **If a ratio comes out below about 2:1 on an agency site, the
   measurement caught a loader, not a design.**
2. **`activetheory.net` returned "Your browser is not supported"** to a headless
   browser. That is a message, not a design; it was dropped from the set rather than
   quoted.
3. Waiting 9 seconds, scrolling to trigger reveals, and reading the **declared** size
   across the whole document — instead of only what was visible — produced the numbers
   above.
