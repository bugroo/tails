# Research log · 2026-09-07 · the landscape tails was built from

Everything here was gathered on **2026-09-07** by reading the sources directly, not
from training data. Star counts and dates are what the GitHub API returned that day.
**They move. Re-measure before quoting any of them.**

This file exists because the reasoning behind `tails` would otherwise live only in a
chat window and disappear when it closed.

---

## 1 · The documented cause

**Model collapse.** A 2024 paper in *Nature* formalises it: models trained on generated
data lose information about the tails of the distribution and converge to substantially
reduced variance. Output trends toward the mean.

Consequence for design: an agent asked for a pricing page does not reason about
hierarchy. It returns the average pricing page of its corpus.

**The feedback loop.** Generated sites get published, crawled, and become the next
model's training data. Each generation is a photocopy of the previous one.

**The fingerprint**, consistently named across independent sources: Inter everywhere ·
indigo-to-purple gradient · three rounded cards in a row · dark hero · gradient
"Get Started" button. Extended list maintained by the UI Craft project: purple-cyan
gradients, glassmorphism, gradient text on metrics, identical card grids,
bounce/elastic easing, cards nested in cards.

**Notable detail:** Tailwind's creator publicly apologised for making `indigo-500` the
default that every AI tool now copies.

**Not the model's fault alone — default stack bias.** Most AI coding tools assume
React + Tailwind + shadcn/ui, which narrows the output further.

Sources read: `925studios.co/blog/ai-slop-design-tells`,
`alexlavaee.me/blog/lessons-learned-designing-with-ai`, plus six corroborating
analyses.

---

## 2 · The finding that matters most: the slop is written into the prompts

From `x1xhlol/system-prompts-and-models-of-ai-tools` (143 432 ★), which carries the
leaked system prompts of ~25 tools. Reading Lovable's own agent prompt:

| Line in their prompt | What it produces |
|---|---|
| *"built on React, Vite, Tailwind, TypeScript… not possible to support other frameworks"* | One stack, shadcn/ui, for everyone |
| *"ALWAYS generate beautiful and responsive designs"* | "Beautiful" is not an instruction; the model falls back to its mean |
| *"Beautiful designs are your top priority… to avoid boring designs and leverage colors and animations"* | Pushes colour and animation **as a cure for boring**. Hence the excess |
| **`--gradient-primary: linear-gradient(135deg, …)` given as the worked example** | **The gradient is taught by the prompt itself** |
| *"Use toast components to inform the user"* | Toasts everywhere |

By contrast, Orchids and Bolt carry almost no design guidance at all — they defer to a
"design system reference" that often does not exist.

**Conclusion that shaped tails:** the system prompt decides more than the model does.
A well-written skill genuinely changes the output.

---

## 3 · The competition, measured

| Repo | ★ (2026-09-07) | Differentiator |
|---|---|---|
| `x1xhlol/system-prompts-and-models-of-ai-tools` | 143 432 | Leaked prompts of ~25 tools |
| `garrytan/gstack` | 131 889 | Full Claude Code setup |
| `nextlevelbuilder/ui-ux-pro-max-skill` | 125 709 | Design-system generator per business type |
| `VoltAgent/awesome-design-md` | 114 582 | **74 brand design systems as `DESIGN.md`**, MIT |
| `nexu-io/open-design` | 94 607 | Local-first desktop app |
| `Leonxlnx/taste-skill` | 85 056 | "Design Read" in one line before code |
| `pbakaus/impeccable` | 66 232 | **61 deterministic detector rules, no LLM** · `PRODUCT.md` / `DESIGN.md` split · 23 commands |
| `Nutlope/hallmark` | 28 211 | **Macrostructures + diversification rule** · 57 slop gates · `study` verb |
| `ZSeven-W/openpencil` | 5 863 | AI-native vector tool |
| `Trystan-SA/claude-design-system-prompt` | 1 937 | Anthropic's Claude Design prompt, reverse-engineered |
| `educlopez/ui-craft` | 318 | Four-rung ladder, 10-item acceptance bar |

### Hallmark's anatomy, which set the shape of tails

`SKILL.md` 67 460 bytes + 29 reference files totalling **399 042 bytes**, loaded on
demand. Largest files show where the value is:

```
study.md              42 639   extract DNA from a reference
custom-craft.md       34 133
hero-enrichment.md    32 151   an entire file for the hero alone
slop-test.md          31 065   the 57 gates
component-cookbook.md 30 980
anti-patterns.md      25 676
```

**Its diversification rule — copied in principle, extended in tails.** Hallmark stamps
the chosen macrostructure as a CSS comment, and before choosing it searches the project
for that stamp; if found, it must pick a *different* macrostructure. Twenty-one named
shapes.

tails extends this from a closed catalogue to a **combinatorial space**: five axes
instead of one name, 3 750 combinations, and a requirement to differ on **three axes**,
not merely to be a different name. Twenty-one shapes run out at build twenty-two.

**Its scope contract, adopted almost wholesale:** does not invent copy, does not pick a
brand identity, does not enforce a style, does not build logic — visual and interaction
layer only. Existing global stylesheet is append-only, because dropping a framework
directive un-styles the whole app.

---

## 4 · The five methods that recur across everything that works

1. **Break the one-shot problem.** Asking for design decision + implementation +
   integration in one move guarantees the average. Split into phases.
2. **Structure before style.** Pick the page's *shape* before dressing it.
3. **Deterministic rules that do not depend on the model** (impeccable's 61 detectors
   run with no LLM and no API key).
4. **Durable, machine-readable context.** Not Figma or Notion — structured rules the
   agent consumes. `PRODUCT.md` (business truth) separate from `DESIGN.md` (visual
   system).
5. **A visual loop.** Render it and look, not just write code.

Research finding cited in one source and worth keeping: **moderate constraints produce
better creative output than total freedom.** Which is why "be creative" fails and "this
business, this audience, this density" works.

---

## 5 · Models: the best engineer is not the best designer

- **Kimi K3 is #1 on the Frontend Code Arena at 1 679 ELO**, ahead of Claude Fable 5,
  on human preference. The reason repeatedly cited: its **agentic visual loop** — it
  sees what it produces and iterates.
- In the same period **Claude Opus 5 leads SWE-bench Verified at 97,00 %** and DeepSWE
  (68,8 % vs 67,5 %).

**Reliability note:** one source states Opus 5 lacks a public model card and a
reproducible benchmark package, so arena ELO should be read as aggregated human
preference, not a hard measure.

**Why this is in here:** it is the strongest available evidence that *looking at the
output* is what separates good design from average design — which is why phase 5 of
`SKILL.md` is not optional.

---

## 6 · Japanese practice, and why the Western summary of it is wrong

Source: Utsubo's field guide (a Tokyo studio; commercial bias noted, cultural and
technical content checks out), plus corroborating studio directories.

**"Japanese web design is minimal" is a Western projection.** The domestic commercial
web (Rakuten, Yahoo! Japan, Kakaku.com) is deliberately **information-dense**, and it
works, for reasons that are not aesthetic:

- **Information equals trust.** In a risk-averse purchasing culture more visible detail
  reads as transparency. A sparse page can feel like it is hiding something.
- **Kanji is dense by nature** — a line carries more meaning per character.
- **i-mode heritage** trained users to scan compact, link-rich menus.
- **Choice as a service** — showing the full range respects a shopper who wants to
  compare before committing.

**The other pole is *ma* (間)** — not "whitespace" but the *active, charged interval*
that gives an element weight. Space as an element, not as leftover. Where luxury,
hospitality and museums live.

**Where Japanese studios genuinely lead: craft motion.** In the Flash era (2000–2010)
Yugo Nakamura (tha ltd.), FromArpil and Group Inc. set the global bar. Flash died with
the iPhone; the tradition returned with WebGL/Three.js/WebGPU. Current names:
SHIFTBRAIN, mount, Garden Eight, monopo, Rhizomatiks, Dentsu Lab Tokyo, BASSDRUM.

**The rule worth keeping**, in their own framing: *motion used not to decorate but to
pace, reveal, and give weight.* And the warning: cherry blossoms and a brush font bolted
onto a Western layout is cargo-cult. **Borrow the principle, never the motif.**

This is the origin of the **density axis** in `02-density-axis.md`.

---

## 7 · The engineering, from a real award-winning build

Source: Codrops build write-up (2026-07-15) for a site by Trionn — a full architecture
teardown by the people who built it.

**The hero is two layers sharing one state:**

- **Background:** a single Three.js scene — idle motion, magnetic hover,
  hold-to-blast, spark effects. All interactions feed **one value** (`explodeAmt`)
  controlling how far the symbol's panels separate. Scroll, hover and hold update the
  same number, which is why transitions between states feel continuous instead of
  stepped.
- **Foreground:** plain DOM — headline, rotating word — animated with GSAP + SplitText.
  Real HTML keeps it accessible; `mix-blend-mode: difference` keeps it legible over the
  canvas.
- Synchronised by a shared `transitionReady` flag: nothing starts until the page
  transition finishes, non-critical work deferred with `requestIdleCallback`.

**One responsibility per layer:**

| Layer | Tool | ★ · licence (2026-09-07) |
|---|---|---|
| Timelines, page transitions | GSAP + `@gsap/react` | 28 282 |
| Scroll: reveals, pinning, scrub | ScrollTrigger | plugin |
| Per-character/word/line text | SplitText | plugin |
| 3D | Three.js | 115 223 · MIT |
| Scroll feel | Lenis | 15 730 · MIT |
| Runtime sound | Web Audio API | native |
| React 3D layer (not used here, on purpose) | react-three-fiber | 32 159 · MIT |
| Component-level motion | Motion | 33 517 · MIT |

**Three engineering details that separate craft from decoration:**

1. **Lenis is driven from `gsap.ticker`** — one clock for everything, not two RAF loops.
2. The text component centralises `prefers-reduced-motion`, GPU-layer cleanup and
   ScrollTrigger refreshes instead of solving them per heading. `will-change` only
   *while* animating.
3. They chose Three.js **without** react-three-fiber deliberately, to control the shared
   render loop.

**Licence change that resets the budget for this kind of work:** since April 2025 **GSAP
is 100 % free including every formerly paid Club plugin** (SplitText, MorphSVG, DrawSVG,
ScrollSmoother), commercial use included, funded by Webflow. Verified against Webflow's
blog, `gsap.com/pricing` and the 3.13 release notes.

**Dead dependency caught by version-checking:** `theatre-js/theatre`, 12 656 ★, **no
commits since 2024-08**. It appears in current "best animation libraries" listicles.
This is exactly why `01-reconnaissance.md` mandates a version check before naming any
library.

---

## 8 · Where the gap is, and what tails does about it

Nothing in section 3 covers:

1. **Stack engineering knowledge** — where these libraries break each other. Every
   competitor names libraries; none says what happens when two of them claim the
   scroll. → `08-collisions.md`
2. **A density decision driven by the task**, not by fashion. → `02-density-axis.md`
3. **Prospecting work** — starting from a Google listing and a bad existing site, with
   no brief and no brand. → phase 0 of `SKILL.md`
4. **A combinatorial form space with a hard diversification rule**, rather than a
   closed catalogue of named shapes. → `03-form.md`

Adopted from others, with credit: the diversification stamp and the scope contract
(Hallmark), the one-line design read (taste-skill), deterministic checks that do not
need an LLM (impeccable), the "would someone believe AI made this?" acceptance question
(ui-craft), the `PRODUCT.md` / `DESIGN.md` split (impeccable).

---

## 9 · Japanese studios, read from the inside (second pass, same day)

Seven sites loaded in a headless browser, libraries detected on `window`, canvas
contexts enumerated, type computed from the rendered page. This is the section that
replaced an article-based summary with measurement.

| Site | Stack | Canvas | Largest visible type | Scale used |
|---|---|---|---|---|
| garden-eight.com | THREE r133 · gsap 3.12.1 | 1440×900 webgl2 | 215 px `gunsan` w600, lh 164 px | 215 · 15 · 14 · 12 |
| shiftbrain.com | React chunks, clip-path×16, 3 448 nodes | webgl2 | 20 px TT Norms | 14 px ×556 · 12 ×184 |
| taotajima.jp | THREE r86dev, JS dated 2017 | webgl2 | in-canvas | 19 · 22 · 16 |
| monopo.co.jp | — | — | 20 px Roobert | 14 ×25 · 60 ×24 |
| dentsulab.tokyo | — | — | 24 px Yu Gothic | 16 ×85 · 12 ×79 |
| mount-inc.com | jQuery · slick · meanmenu | none | 14 px Lato | 16 ·13 ·19 ·22 |
| rhizomatiks.com | jQuery 3.5.1 · slick · WordPress | none | 15 px Libre Baskerville | 12 ·13 ·14 ·16 |

**Findings**

1. **Half of them run no WebGL at all on their own site.** Rhizomatiks — one of the most
   technically ambitious studios in the world — publishes on WordPress with jQuery and a
   slick slider. mount likewise. The technology follows the job, and a studio site's job
   is to show work and survive maintenance.
2. **Density is a real, deliberate pole.** shiftbrain serves 556 elements at 14 px.
3. **The distinctive ones use brutal type contrast, not a modular scale.**
   garden-eight: 215 px headline against 14 px body (≈15:1), line-height *below* the
   font size (164 on 215). A smooth 1,25× modular scale is itself a tell.
4. **Not one of the seven uses Inter.** Observed: gunsan, TT Norms, Lato, Roobert,
   Yu Gothic, garamond-premier-pro, Noto Serif JP, lausanne, Libre Baskerville.
5. taotajima.jp has been running Three.js r86 with JS stamped `20171208` for about nine
   years. Longevity is a design outcome too.

**Instrument note.** The first pass hit `www.rhizomatiks.com`, which serves a **404**,
and dutifully reported the 404 page's typography (Libre Baskerville, 60 px, "404") as if
it were the site. Caught because a studio homepage whose largest visible text is the
string "404" is not plausible. The apex domain is the live one. **A measurement of the
wrong URL looks exactly like a measurement.**

## 10 · CSS as the other technology — who to read

Named and verified as active in 2026:

- **Amit Sheen** — builds 3D mathematical surfaces (a Klein bottle) out of `<i>`
  elements in pure CSS. The closest thing to "CSS that looks like Three.js".
- **Ana Tudor** — CSS driven by real trigonometry; the school the rest comes from.
- **Temani Afif** — the frontier of shapes: `shape()`, an SVG-path-to-CSS converter,
  hexagon grids without magic numbers. Replaces SVG and canvas in places people assume
  need them.
- **Bramus Van Damme** (Chrome DevRel) — the technical reference for scroll-driven
  animations.
- **Adam Argyle** (nerdy.dev) — combining new features with each other, which is where
  the "this cannot be CSS" effect lives.

**Engineering detail worth carrying into the motion file**, from Bramus via CSS-Tricks:
animating `font-size` runs **on the main thread** — it is not hardware accelerated — and
that drags the *entire* scroll-driven animation onto the main thread with it. Custom
properties have the same problem. Not in the tutorials that rank first.

---

## 11 · Typography of award-winning studios, measured

Nine sites, computed type read after loaders finished, 2026-09-07.

| Site | Display | Family | Tracking | Line-height | Body | Contrast |
|---|---|---|---|---|---|---|
| garden-eight.com | 215 px | gunsan w600 | normal | 0,76× | 14 | 15:1 |
| unseen.co | 90 px | Neue Montreal | −1,44 px | 1,00× | 14 | 6,4:1 |
| basement.studio | 87 px | Geist w600 | −3,48 px | 0,90× | 16 | 5,4:1 |
| obys.agency | 80 px | Obys (house face) | −2,40 px | 1,00× | 11 | 7,3:1 |
| resn.co.nz | 59 px | Fort-Extralight | −1,17 px | 0,99× | 15 | 3,9:1 |

**Five patterns, each the opposite of the default:**

1. Negative tracking on display, always, scaling with size (−1,17 to −3,48 px).
2. Line-height at or **below** 1,0 (0,76 · 0,90 · 0,99 · 1,00 · 1,00). Web default ≈1,5.
3. Scale contrast 4:1 to 15:1, with **nothing in between**. A smooth 1,25× modular
   scale is itself a tell.
4. Small body: 11–16 px. Nobody inflates to 18–20.
5. **Not one uses Inter.** Fort · Obys · Geist · Neue Montreal · Saol Display ·
   nbarchitekt · flauta · gunsan · TT Norms · Roobert · lausanne · Yu Gothic ·
   Garamond Premier Pro · Noto Serif JP. `Times` appears as declared fallback on three,
   the signature of a real webfont rather than an accepted system stack.

**Instrument failures, third and fourth of the day.** Measuring at 4 s on sites with
entrance animations returned nav links as "largest text" and impossible contrast ratios
below 1:1. `activetheory.net` served "Your browser is not supported" to a headless
browser — a message, not a design, and dropped rather than quoted. Fixed by waiting 9 s,
scrolling to trigger reveals, and reading the **declared** size across the whole
document instead of only what was visible.

**Running tally of instrument failures on 2026-09-07: five.** Units mismatched between
`gsap.ticker` (seconds) and `requestAnimationFrame` (milliseconds); a sticky test that
never reached the stick point; a reduced-motion test reading the first character of a
stagger; a 404 page measured as if it were a studio homepage; and a loader measured as
if it were a design. Every one of them produced a plausible-looking number.

**That ratio — five bad measurements against roughly a dozen good ones — is the single
strongest argument for the control-first discipline in `11-verify.md`.**
