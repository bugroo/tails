# The density axis — measured, not assumed

Loaded in phase 2, always. This is the decision that matters more than any style word.

## The axis is not "simple vs. complex"

It is **how much work the page has to do**.

- **A cinema has a hard task**: what is on, at what time, in which room, buy. That is
  dense by necessity. A cinema built around negative space is a beautiful site where
  nobody can buy a ticket. Motion there must serve the task — give weight to the
  premiere, pace the step into the showtime — or it is in the way.
- **A creative studio sells the ability to impress.** There, motion *is* the product.

Both poles are legitimate. Choosing one by fashion instead of by task is the failure.

---

## What the two poles actually look like, measured

Seven Japanese studios read from the inside on **2026-09-07** with a headless browser —
libraries detected on `window`, canvas contexts, computed type. Japan is the right place
to look because it holds both poles at full strength.

| Site | Stack found | Canvas | Largest visible type | Type scale actually used |
|---|---|---|---|---|
| garden-eight.com | **THREE r133 · gsap 3.12.1** | 1440×900 webgl2 | **215 px**, `gunsan`, weight 600, line-height 164 px | 215 · 15 · 14 · 12 |
| shiftbrain.com | React chunks, `clip-path`×16 | webgl2 | 20 px, TT Norms | 14 px **×556** · 12 ×184 · 20 ×180 |
| taotajima.jp | **THREE r86dev**, JS dated 2017 | webgl2 | — (type lives in the canvas) | 19 · 22 · 16 |
| monopo.co.jp | — | — | 20 px, Roobert | 14 ×25 · **60 ×24** · 20 ×15 |
| dentsulab.tokyo | — | — | 24 px, Yu Gothic | 16 ×85 · 12 ×79 · 14 ×19 |
| mount-inc.com | **jQuery · slick · meanmenu** | **none** | 14 px, Lato | 16 ·13 ·19 ·22 |
| rhizomatiks.com | **jQuery 3.5.1 · slick · WordPress** | **none** | **15 px**, Libre Baskerville | 12 ·13 ·14 ·16 ·15 |

### Three things this kills

**1 · The award-winning Japanese studio does not necessarily run WebGL.** Rhizomatiks —
the studio behind some of the most technically ambitious installation work in the world
— publishes on WordPress with jQuery and a slick slider, no canvas at all, and body copy
at 15 px. mount, cited in every "best Tokyo studio" list, is jQuery and no canvas.

The lesson is not that they are lazy. It is that **the technology is chosen for the
job**, and a studio's own site has a job: show the work, be found, be maintained by
whoever is there next year. Reaching for Three.js because the client is impressive is
the same error as reaching for indigo because the model saw a lot of it.

**2 · Density is real and it is not a failure.** shiftbrain serves **556 separate
elements at 14 px**. dentsulab: 85 at 16 px and 79 at 12 px. To an eye trained on
Silicon Valley minimalism that reads as cluttered. It is not — it is the
information-dense tradition of the domestic Japanese commercial web, where more visible
detail reads as transparency, kanji carries more meaning per character, and showing the
full range respects a shopper who wants to compare before committing.

**3 · The distinctive ones use brutal type contrast, not a modular scale.** garden-eight
sets its headline at **215 px** next to body text at **14 px** — a ratio of about 15:1 —
with the line-height *tighter than the font size* (164 px on 215 px, ≈0,76). There is
nothing in between. A generated page reaches for a smooth modular scale where every step
is 1,25× the last; that smoothness is itself a tell.

---

## `Ma` (間) — and what it is not

*Ma* is usually translated "negative space", which undersells it. It is the **active,
charged interval** between things: the pause that gives a sound its rhythm, the gap that
gives an object presence. Space as an element doing work, not as leftover.

This is where the Western stereotype is actually true — and it is only one of the two
poles, used by hospitality, museums and luxury.

**Borrow the principle, never the motif.** Cherry blossoms, a torii gate and a
brush-stroke font bolted onto a Western layout is cargo cult, and it is spotted
instantly. What travels is: restraint over decoration, type discipline, space used
deliberately, and matching the pole to the audience.

---

## Choosing the position

Ask the question from phase 0: **what must happen when someone arrives?**

| The task | Position | What that means |
|---|---|---|
| Find a fact, compare, decide, buy, book | **Dense** | The offer is the hero (`A6 Board` in `03-form.md`). Information visible without scrolling. Motion paces the task, never delays it |
| Read something | **Middle** | Measure, rhythm and hierarchy carry it. Motion arrives content, nothing more |
| Be convinced someone is good at this | **Sparse / `ma`** | Space is the argument. Motion can be the product |

### Dense does not mean unillustrated

Learned by getting it wrong, 2026-09-07. The first sample built with this skill was for a
restaurant, correctly placed at the dense pole, and it shipped **without a single
photograph of food**. It was an accurate information board and a bad restaurant page: 7 KB,
every fact in place, and nothing that made anyone hungry.

**Density is about how much information the page carries, not about whether it has
images.** A restaurant, a hotel, a shop and a bakery all sit at the dense pole *and* sell
through their pictures. The rebuilt version leads with the plate at full bleed and still
weighs 583 KB — eight times lighter than the 4 754 KB site it replaces.

The question that catches this: **what does this business actually sell?** If the answer is
something you can photograph, a page without photographs has failed regardless of how
correct its information architecture is.

**Write the position into the stamp** (`03-form.md`) so the next build inherits the
decision instead of re-guessing it.

## And the rule about motion, from the tradition that leads it

> Motion used **not to decorate but to pace, reveal, and give weight.**

If a movement cannot be defended in those terms — what does it pace, what does it
reveal, what does it give weight to — it is decoration, and decoration is the thing that
makes a page read as generated.
