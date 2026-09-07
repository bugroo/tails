# Motion

Loaded whenever anything moves. Read `08-collisions.md` alongside it if two layers touch
the scroll.

## The gate

```bash
node checks/ambition.mjs <url> --tier=craft
```

Declared in phase 2, enforced in phase 5. It drives a browser, scrolls, and fails a
`craft` build where nothing pins, nothing layers, and nothing moves.

**It exists because of a real failure.** A sample built with this skill fixed a
restaurant's coherence, its scroll, its contrast, its weight — 583 KB against 4 754,
every check green — and the owner's reaction was that he would not pay for it: *"no hay
ningún dinamismo, no hay nada de tecnología"*. He was right. Correct is the floor. Every
other check in this skill passed that page.

## The test every movement has to pass

From the tradition that leads this work: **motion paces, reveals, or gives weight.** If a
movement cannot be defended in one of those three terms, it is decoration — and
decoration is what makes a page read as generated.

Write the defence down. *"The premiere card arrives last and slowest, so it lands as the
thing worth looking at."* If you cannot write that sentence, delete the animation.

## Budget first, effect second

Measured on real sites, 2026-09-07 — transfer weight and first contentful paint:

| Site | Weight | JS | FCP |
|---|---|---|---|
| **obys.agency** | **59 KB** | 37 KB | 236 ms |
| claveon.de | 269 KB | 47 KB | 336 ms |
| garden-eight.com | 1 911 KB | — | 1 372 ms |
| unseen.co | 7 137 KB | — | 472 ms |
| basement.studio | 12 969 KB | 2 379 KB | 380 ms |
| **resn.co.nz** | **23 620 KB** | 4 350 KB | 664 ms |

**Two things fall out of this, and they point in opposite directions.**

**The award-winning end of the field is heavy.** 13 MB and 23 MB are not typos. If the
brief is a flagship campaign site on desktop over fibre, that is a choice somebody made
with their eyes open.

**And it is not required.** obys.agency — the strongest typographic identity in the set,
its own house typeface, 80 px display, 7,3:1 scale contrast — is **59 KB**. Four hundred
times lighter than resn, and unmistakably itself.

> **Distinction is not bought with weight.** If a build is heavy, that should be a
> decision about what the content needs, never a side effect of how it was assembled.

**Declare the budget before building**, in the handoff, as a number. Suggested starting
points until the brief says otherwise:

| Kind of site | Weight | JS | Notes |
|---|---|---|---|
| Local business, one-pager | ≤ 500 KB | ≤ 100 KB | Their customers are on phones and mobile data |
| Content site, marketing | ≤ 1,5 MB | ≤ 300 KB | |
| Flagship with WebGL | say the number out loud | — | And build a path for phones that cannot carry it |

## The two-layer hero

The pattern from a teardown of an award-winning build, and it is the one to copy:

- **Background:** one WebGL scene. Idle motion, pointer response, scroll response — all
  writing into **one shared value**, not three. Scroll, hover and hold update the same
  number, which is why transitions between them feel continuous instead of stepped.
- **Foreground:** real DOM. Headline, copy, the call to action. Real HTML keeps it
  readable, selectable, translatable and accessible. `mix-blend-mode: difference` keeps
  it legible over anything the canvas does.
- **One flag joins them.** Nothing starts until the page transition finishes; anything
  non-critical is deferred with `requestIdleCallback` so it does not compete with the
  first paint.

**Never put text inside the canvas without a DOM equivalent.** It is unselectable,
untranslatable, invisible to search and to screen readers, and it does not reflow.

## One clock

Drive the smooth-scroll library from the animation library's ticker rather than letting
each run its own loop:

```js
lenis = new Lenis({ autoRaf: false })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

**What this buys is synchronisation, not frame rate.** Measured on the bench across
desktop, a throttled mid-range phone and real WebKit: both configurations held 60 fps.
What two independent loops cost you is *alignment* — a pinned element can lag the content
it is pinned to by a frame. Do not quote a performance figure for this. See
`08-collisions.md § 1`.

## The floor, and it is not optional

- **`prefers-reduced-motion` handled in one place**, not per element. Test **both**
  directions: motion absent when reduced, present when not. Read the whole set, never the
  first element of a stagger — see `08-collisions.md § 5`.
- **`will-change` on when the animation starts, off when it ends.** Its cost is GPU
  memory, not frame time; do not cite a frame-rate number for it.
- **Animate `transform` and `opacity`.** They are composited. Animating `width`,
  `height`, `top`, `margin` forces layout on every frame.
- **Do not animate `font-size`.** It runs on the main thread — it is not hardware
  accelerated — and it drags the entire scroll-driven animation onto the main thread with
  it. Custom properties have the same problem. Animate `transform: scale()` instead.
  *(Reported by Bramus Van Damme, Chrome DevRel.)*
- **Nothing important behind a hover.** Touch has no hover, and neither does a keyboard.
- **Do not pin anything critical to the bottom edge on mobile.** Since iOS 26 — which is
  the majority of iPhones — `position: fixed` and `sticky` elements can render displaced
  from where the layout says they are, and `svh`/`lvh`/`dvh` do not fix it because the
  bug is in compositing. `08-collisions.md § 11.3` has the reproduction. No measurement
  in this repository can detect it.
- **Focus must stay visible** while things move, and the focus ring must not be scrolled
  under sticky chrome.

## Native CSS before a library

Scroll-driven animations (`animation-timeline: view()` / `scroll()`) run **off the main
thread** and need no JavaScript at all. For reveals, progress bars and parallax, native
CSS is now the correct first answer; reach for a library when you need timelines,
sequencing, pinning or WebGL synchronisation.

Where support is missing the animation simply does not run, which is an acceptable
fallback for anything decorative — and anything that is not decorative should not have
been an animation.

## Measure it properly

Two states, and they have different causes:

- **Startup** — everything competing during load. This is where the cost actually was on
  the bench: 92–114 ms worst frame, in *every* configuration including the control.
- **Steady state** — after things settle. Median frame time while scrolling.

Say which one you measured. And **use `performance.now()` on every branch**: mixing a
ticker's seconds with `requestAnimationFrame`'s milliseconds produced a completely false
comparison on this very bench.

**A light scene proves nothing.** Seven planes and a fifteen-character split ran at 60 fps
on a phone with its CPU throttled six times. If the real scene is heavy, measure the real
scene.
