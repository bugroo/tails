# Metropol Düsseldorf — a proposal, built with `tails`

Not a commission and not their site. A sample landing of the kind you send to a business
whose current page is losing them visitors, labelled as a proposal on the page itself.

```bash
bash samples/metropol/servir.sh        # → http://localhost:4700/
```

## Against the page it would replace

Measured with `checks/baseline.mjs` on 2026-09-07, both at 1280 px on the same machine.

| | filmkunstkinos.de/kinos/metropol/ | this |
|---|---|---|
| Transferred | **4 696 KB** across 46 requests | **58 KB** across 3 |
| JavaScript | 3 538 KB | 8 KB |
| First contentful paint | 1 824 ms | **36 ms** |
| DOM nodes | 2 649 | 111 |
| `tel:` links | **0** | 3 |
| Images without `alt` | 4 of 167 | none, there are no images |

Fifty times lighter, and the thing a person actually came for is the first thing on the
screen instead of the fourth tab.

## The form

`A6-B4-C2-D5-E4 · dense` — differs from the previous stamp on all five axes.

- **A6 Board.** The visitor came to find out what is on and when. The board is the hero.
  Nothing sits above it.
- **B4 Dense, then open.** The task on top, tight. Then the house gets room.
- **C2 Rule.** One hairline everywhere. A printed programme sheet is rules and type.
- **D5 No photography.** Not a preference: nobody here owns the rights to a film still,
  and inventing atmosphere with stock imagery is what this skill exists to prevent.
- **E4 Scrubbed.** The house lights come down as you scroll. Scroll writes one value,
  `--k`, and the projector and the CSS both read that same number.

**The surface is white on purpose.** A cinema page wants to be black with one acid
accent, which is one of the three looks AI-generated design collapses into. The idea here
is the paper programme with the projector light falling across it, so the light is the
only colour on the page.

## The WebGL, and why it is not three.js

The whole scene is one full-screen fragment shader on a single quad: warm tungsten
falloff, film grain, and the slow gate weave a real projector has. three.js would add
roughly 170 KB gzipped to draw two triangles.

It also answers the constraint that actually matters. The average phone in Europe in 2026
is **mid-range or better and three to four years old** — a good phone with an old GPU and
an old battery, not a weak phone. One quad and no textures is close to zero GPU memory.
See `references/08-collisions.md § 11.1`.

**Context loss is handled**, which almost no WebGL page does. Mobile Chrome reclaims GPU
memory the moment a tab goes to the background; without `preventDefault()` on
`webglcontextlost` the context never comes back and the visitor returns from a phone call
to a black rectangle. The canvas also renders at half resolution, stops when it is off
screen, and stops when the tab is hidden.

## What is deliberately missing

**The base ticket price.** Their site renders it with JavaScript and it is not in the
document text, so it is not here either. It is marked on the page as a gap for the cinema
to fill. Missing information is named as missing, never filled in.

Two sentences were written into a first draft and cut before anything was measured: a
founding year, and a date for the switch to digital projection. Neither is on their site.
The gate cannot catch that, which is why `--copy-checked` is an attestation a person
makes rather than something a program decides.

## Verified, and not

**Verified:** `node checks/gate.mjs http://localhost:4700/ --dir=samples/metropol
--tier=craft --budget=900 --js-budget=250 --prev=A3-B3-C4-D2-E2 --expect=Brunnenstraße
--copy-checked` → **APPROVED**, ten of ten. Looked at by eye at 1280 and 375; a collision
between the umlaut of LÄNGST and the eyebrow above it was found that way and fixed with
proportional clearance, because no check in this repository can see it.

**Not verified:**

- **A physical phone.** No real iPhone or Android was used. iOS 26 displaces fixed and
  sticky elements while leaving the layout correct, so the sticky stage here could be
  20 px out of place on the majority of iPhones and every instrument would still report
  it correct (`08-collisions.md § 11.3`).
- **A heavy scene.** This is one fragment shader, which is the right answer for this
  brief and the wrong test for the heavy end of `08-collisions.md`. Thousands of
  triangles, real textures and thermal throttling remain unmeasured.
- **Context loss under real pressure.** The handler is written and has not been seen
  firing on a real device.
- **The programme is a snapshot** of Monday 7 September 2026. A real build reads it from
  the cinema's own source.
## The version with the room in it

The first build of this page carried no photography at all, justified by not owning any
film stills. The first person to see it said he did not understand the design or what
would appeal to the owner, and he was right: **a cinema page with no cinema in it.** That
was the same mistake as a restaurant page with no food, made a second time in a different
costume, and a rights constraint had been allowed to decide the design.

The cinema publishes photographs of its own rooms, taken by F. Kiefer in May 2025, and
the distributors' posters. So the room is in it now.

**The palette is sampled, not chosen.** `--rot: #bf3835` is the seat velvet, read off the
photograph itself, 5,48:1 on white. The dark surface is the wall of the same room. The
worst contrast on the finished page is 5,48:1, which is that accent doing its job.

## What the quality gate says, 2026-09-07

```
node checks/gate.mjs http://localhost:4700/ --dir=samples/metropol --tier=craft \
     --budget=900 --js-budget=250 --prev=A3-B3-C4-D2-E2 --expect=Brunnenstraße --copy-checked
```

**APPROVED, ten of ten.** 368 KB across 7 requests, 8 KB of JavaScript.

| | filmkunstkinos.de/kinos/metropol | this |
|---|---|---|
| Transferred | **4 696 KB** across 46 requests | **368 KB** across 7 |
| JavaScript | 3 538 KB | 8 KB |
| First contentful paint | 1 824 ms | tens of ms |
| DOM nodes | 2 649 | ~130 |
| `tel:` links | **0** | 3 |

## Two things the gate caught that would have shipped

**White type over the auditorium read 1,00:1 and 1,09:1** against the composited pixels,
because the projector beam this page is so pleased with was brightening the exact area
under the words. The reflex is a darker scrim; that flattens the photograph, which is the
argument of the section. The type came off the image and landed on paper below it.

**The parallax inside the pin drifted seven pixels** across the whole section: invisible
to a reader and below the resolution of the check that measures depth. It is 8% now.

## And one thing no check could catch

The first beam was drawn over white paper. Technically real, visually invisible: on an
ordinary screen it looked like a beige background. The second was visible and wrong in
the other direction, washing the whole frame until the photograph looked like fog and the
screen stopped being the brightest thing in the picture. Both verdicts came from looking
at it.

## What is deliberately missing

**The base ticket price.** Their site renders it with JavaScript and it is not in the
document text, so it is not here either. It is marked on the page as a gap for the cinema
to fill.

Two sentences were written into a first draft and cut before anything was measured: a
founding year, and a date for the switch to digital projection. Neither is on their site.

## Not verified

- **A physical phone.** iOS 26 displaces fixed and sticky elements while leaving the
  layout correct, so the pinned room here could be 20 px out of place on the majority of
  iPhones and every instrument would still report it correct
  (`08-collisions.md § 11.3`).
- **A heavy scene.** One fragment shader on one quad is the right answer for this brief
  and the wrong test for the heavy end of `08-collisions.md`.
- **Context loss under real pressure.** The handler is written and has not been seen
  firing on a device.
- **The programme is a snapshot** of Monday 7 September 2026.

## The images are not in this repository

They belong to the cinema and to the photographer, and the posters to the distributors.
An MIT licence over them would be a false statement about who may reuse them. Fetch them
into `assets/` yourself if you want to see the page as built; the filenames are in
`index.html`.
