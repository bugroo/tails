# Form — five axes, one stamp

Loaded in phase 3, before any code.

A named style ("minimal", "brutalist", "editorial") is not a form. It is a mood, and a
mood produces the same page every time because the model resolves it to its average.

A **form** is five decisions taken together. Take them explicitly, write them down, and
the page has a fingerprint before a single rule of CSS exists.

---

## The five axes

Pick exactly one value on each. The five together are the form.

### A · Hero composition — where the eye lands first

| Code | Value | What it is | Fits |
|---|---|---|---|
| A1 | **Stacked** | Headline, sub, action, centred column | Trust-first, public service, anything where reading order must be obvious |
| A2 | **Split** | Type on one side, a single image or scene on the other | A product you can photograph |
| A3 | **Full-bleed** | Image or canvas fills the frame, type sits inside it | Places, food, film, anything where the picture *is* the argument |
| A4 | **Type-only** | No image. The words at a size that becomes the image | A claim strong enough to carry alone |
| A5 | **Object** | One thing, isolated, centred, lit | A physical product, a device, a single dish |
| A6 | **Board** | The offer itself as the hero: showtimes, menu, prices, availability | **A hard task.** A cinema, a restaurant, a clinic |

> A6 is the one every AI skill forgets. When the visitor came to *do* something, the
> fastest hero is the thing itself. Do not make them scroll past a mood to reach it.

### B · Section rhythm — how the page breathes down the scroll

| Code | Value | What it is |
|---|---|---|
| B1 | **Even** | Equal blocks, equal spacing. Calm, predictable, easy to maintain |
| B2 | **Accelerating** | Blocks get shorter and tighter as you descend, toward the action |
| B3 | **Punctuated** | Long, quiet stretches interrupted by one full-height moment |
| B4 | **Dense-then-open** | An information-heavy top (the task), then air (the story) |
| B5 | **Woven** | Two alternating widths that never resolve into a grid |

### C · Division language — how one section becomes the next

| Code | Value | What it is |
|---|---|---|
| C1 | **Air** | Nothing. Space alone does the work. Demands real spacing discipline |
| C2 | **Rule** | A hairline. One weight, one colour, used everywhere or nowhere |
| C3 | **Surface** | Background changes. No lines at all |
| C4 | **Overlap** | Sections bleed into each other; the next one starts before the last ends |
| C5 | **Numbered** | An explicit sequence — *only* when the content is genuinely ordered |

> C5 with unordered content is decoration pretending to be structure. If the reader
> could start at 03, the numbers are lying.

### D · Image treatment — how pictures are handled

| Code | Value | What it is |
|---|---|---|
| D1 | **Framed** | Contained, with margin, treated as an object on the page |
| D2 | **Bled** | Edge to edge, no margin |
| D3 | **Masked** | Cropped to a shape the brand owns |
| D4 | **Sequenced** | Several images in a deliberate order, read like a strip |
| D5 | **Absent** | No photography. Type, colour and space carry it |

### E · Reveal pattern — what happens as you scroll

| Code | Value | What it is |
|---|---|---|
| E1 | **None** | Everything is present. Fastest, most accessible, sometimes correct |
| E2 | **Settle** | Content arrives with a short fade and a few pixels of travel |
| E3 | **Staggered** | Elements arrive in a deliberate order that carries meaning |
| E4 | **Scrubbed** | Progress is tied to scroll position; the user drives it |
| E5 | **Held** | One section pins while something inside it changes |

> E4 and E5 are expensive: they need `references/06-motion.md` **and**
> `references/08-collisions.md`. Do not pick them because they look impressive. Pick
> them when the content is genuinely sequential and the visitor gains something.

---

## The stamp

Write this comment at the very top of the stylesheet you produce:

```css
/* tails · form: A6-B4-C3-D2-E2 · density: dense · 2026-09-07 */
```

Five codes, the density position, the date. Nothing else.

## The diversification rule — mandatory, and not a matter of judgement

Before choosing:

1. **Search the target project for `tails · form:`** in any CSS file.
2. If you find one, **your combination must differ on at least three of the five
   axes.** Not one. Three.
3. If you find several, differ by three axes from the most recent one.

One-axis drift is the same page with a different picture. Three-axis drift is a
different page.

With six, five, five, five and five values the space holds 3 750 forms. You will not
run out. Repetition here is always a choice, never a constraint.

## When the project has a brand already

The form is still yours to choose; the brand is not. Colour, type and voice come from
the project's `DESIGN.md` or from the material the client gave you. Never invent a
brand identity and never override one that exists — see `00-contract.md`.
