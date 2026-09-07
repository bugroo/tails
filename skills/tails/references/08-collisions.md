# Collisions — measured on a bench, not read in an article

Load this **the moment two layers touch the scroll**, and before shipping anything that
pins, scrubs, or smooths.

Every entry below was produced by building a hero with the real stack, switching one
thing at a time, and measuring. The bench is in `lab/` of this repository, and each
entry says how to reproduce it.

**Three entries turned out to be wrong when measured, including the one that was
originally called the most valuable rule in the file.** They are kept and marked,
because a file that deletes its own errors cannot be audited — and because the wrong
version is what most articles will tell you.

| Measured on | 2026-09-07 |
|---|---|
| Stack | three 0.185.1 · gsap 3.15.0 · lenis 1.3.26 · vite 8.2.2 |
| Engines | Chromium 1440×900 · Chromium as Pixel 7 with CPU throttled ×1/×4/×6 · **WebKit as iPhone 15, the real Safari engine** |
| Not covered | A physical phone. Emulation gets you the engine and a slow CPU; it does not get you thermal throttling, real GPU memory limits, browser chrome that resizes, or a compositing bug that moves the pixels while leaving the layout correct (§ 11.3) |
| Bench | `lab/` — flags `?twoClocks=1` `?noLenis=1` `?leakWillChange=1` `?reduced=1` |

> **Rule for adding to this file:** an entry needs a measurement or a way to reproduce
> one. "An article said so" is not an entry — it is a checkpoint that sends you to the
> vendor's documentation.

---

## 1 · Two clocks — sync, not speed. **The performance claim did not survive.**

**What was claimed here first, and was wrong.** An earlier version of this file reported
*"worst frame 123,0 ms with two clocks against 0,2 ms with one"* and called it the
highest-value rule in the document.

**It was an instrument error, not a finding.** `gsap.ticker` hands its callback a time in
**seconds**; `requestAnimationFrame` hands it **milliseconds**. The two branches of the
bench were therefore measured in different units. A worst frame of 0,2 ms is impossible
at 60 fps — the gap between frames is 16,7 ms — and that impossibility is what gave it
away.

**Re-measured with `performance.now()` on both branches**, steady state, startup
excluded, scrolling throughout:

| Platform | One clock | Two clocks | No smooth scroll (control) |
|---|---|---|---|
| Chromium desktop 1440×900 | median **16,7** · p95 16,9 | median **16,7** · p95 16,8 | median 16,7 · p95 16,8 |
| Pixel 7, CPU throttled ×6 | median **16,6** · p95 17,9 | median **16,5** · p95 17,9 | — |
| WebKit iPhone 15 (real Safari engine) | median **17,0** · p95 18,0 | median **17,0** · p95 18,0 | — |

Sixty frames a second on every platform, both configurations, including a mid-range
phone with its CPU throttled six times. **There is no frame-rate argument for one clock
on this bench.**

**So why keep the rule at all?** Because its real justification is **synchronisation**,
not speed: two independent loops read and write scroll state at different moments, so a
pinned element can lag the content it is pinned to by a frame. That is a correctness
problem, and it does not show up in a frame-time histogram. Keep the pattern:

```js
lenis = new Lenis({ autoRaf: false })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

**And state honestly what it buys you: alignment, not frames per second.**

### The methodological finding, which is worth more than the rule

**A light hero cannot stress anything.** Seven planes and a fifteen-character split run
at 60 fps on a throttled mid-range phone. Measuring frame rate on a scene this small
proves only that the scene is small.

Where the cost actually was: **startup**. Worst frame during load was 92–114 ms across
every configuration *including the control with no smooth scroll at all* — compiling,
fetching Three.js, first render. A collision that appears in the control is not a
collision.

**Two rules come out of this:**

1. **Separate startup from steady state**, and say which one you measured. They have
   different causes and different fixes.
2. **A collision that shows up in the control was never about the thing you were
   testing.** Run the control every time. It is what caught this one and the sticky
   claim in § 2.

---

## 2 · ~~Smooth scroll breaks `position: sticky`~~ — **false for this library**

**What every article says:** a JS smooth-scroll desynchronises `position: sticky`,
in-page anchors and assistive technology.

**What the bench says:** with lenis 1.3.26, sticky holds exactly at its `top` offset,
and anchor links land. Measured past the stick point and 300 px beyond it:

| Configuration | Sticky element top |
|---|---|
| Lenis, one clock | **80 px, then 80 px** — pinned |
| Lenis, two clocks | **80 px, then 80 px** — pinned |
| No smooth scroll (control) | **80 px, then 80 px** — pinned |

The claim does not apply to a library that **rides the native scroll** instead of
transforming a wrapper, which is exactly what Lenis states as a design goal.

**So the real rule is not "smooth scroll breaks sticky". It is:**

> Ask whether the library moves the content with a transform or wraps the native
> scroll. If it transforms, expect sticky, anchors, `scroll-driven` CSS animation and
> focus handling to break. If it wraps native scroll, expect none of that — and verify
> anyway, with the test below.

**How this was nearly recorded wrong.** The first measurement said sticky failed in
*all four* configurations, including the one with no smooth scroll at all. A collision
that happens without the colliding library is not a collision — it is a broken
instrument. The test had scrolled 700 px toward a stick point 965 px away: the element
had never reached the point where it was supposed to stick.

**Test it correctly, with a control:**

```js
const docTop = el.getBoundingClientRect().top + scrollY   // absolute position
scrollTo(0, docTop - STICKY_TOP + 200)                    // 200px PAST the stick point
// el.getBoundingClientRect().top must now equal STICKY_TOP, and stay there
// Control: a normal element nearby must move by exactly what you scrolled.
```

---

## 3 · `position: fixed` inside a transformed ancestor — **confirmed, and not a collision**

**Measured.** A `fixed` element whose ancestor carries `transform: translateZ(0)`
scrolled away with the page: top went from 0 to −500 after scrolling 500 px. It should
not have moved at all.

**And it did exactly the same with smooth scroll switched off.** So this is not a
motion-library problem: it is CSS. A `transform`, `filter`, `perspective`,
`backdrop-filter` or `will-change` on those properties makes the ancestor a containing
block, and `fixed` descendants anchor to it instead of the viewport.

It reads as "the header stopped being fixed" three sections away from the animation
that caused it, which is why it eats afternoons.

**Reproduce:** `lab/`, `.transformed-parent` / `.fixed-child`. Delete the `transform`
and the child pins again.

**Check:** scroll with the fixed element on screen. If it moves, walk up the ancestors
looking for those properties. Animating a wrapper's transform is the usual culprit.

---

## 4 · ~~`will-change` left on is expensive~~ — **not measurable at this scale**

**What is widely repeated:** leaving `will-change` on permanently consumes GPU memory
and makes the page slower than not using it.

**What the bench says:** nothing measurable, at desktop scale.

| Elements holding `will-change: transform, opacity, filter` | FPS over 2 s |
|---|---|
| 15 (the split heading) | 61 |
| 615 (600 injected extra) | **61** |

Identical frame rate with forty times the layers, on a desktop GPU.

*(An earlier version of this table also quoted a "worst frame" figure. It came from the
same broken instrument described in § 1 and has been removed. The frame-count column
was never affected by that bug.)*

**The honest reading.** The cost of `will-change` is *memory*, not frame time, and
frames-per-second is the wrong instrument for it. This bench proves the frame cost is
absent at this scale on this hardware; it proves nothing about a low-memory phone,
where layer count is a real constraint.

**So the rule stays, with its reason corrected:** clean it up when the animation ends —
not because it drops frames, but because layers cost memory and the budget you cannot
see is the one that kills mid-range Android. **Do not cite a frame-rate figure for
this.** If it matters to a decision, measure GPU memory on a real device.

```js
onComplete() { gsap.set(targets, { willChange: 'auto' }) }
```

---

## 5 · `prefers-reduced-motion` — works, and the test that checks it usually lies

**Measured**, 250 ms after load, reading **every** character of a staggered heading:

| Preference | Opacity min → max | Verdict |
|---|---|---|
| `reduce` | 1,00 → 1,00 | did not animate ✓ |
| `no-preference` | 0,00 → 0,83 | animated ✓ |

**The instrument failure worth carrying.** The first version of this test read the
*first* character and reported "no animation" under both settings — because with a
stagger the first element has already finished by the time you look. A reduced-motion
test must read the **whole set**, or the last element, and it needs both directions:
one where motion must be absent and one where it must be present.

---

## Before you name any library

Do this at the moment of choosing, not at the end:

1. **Current version and last commit.** Verified 2026-09-07: a well-known motion editor
   with 12 656 stars had received no commits since August 2024, and still appears in
   current "best animation library" listicles.
2. **Licence, and whether it changed.** Verified 2026-09-07: GSAP is now free including
   every formerly paid plugin (SplitText, MorphSVG, DrawSVG, ScrollSmoother), commercial
   use included. Its npm licence field reads *"Standard 'no charge' license"*. A skill
   written before that change would still be steering people away from the good plugins.
3. **What it assumes about the scroll**, if it touches the scroll at all — see § 2.

---

## Known unmeasured

Named here so nobody mistakes silence for a clean result:

- **iOS Safari address-bar `resize` killing momentum.** Measured on a real iPhone
  (iOS 18.7) on a different project, 2026-09-06, with an A/B/A test: a scroll library
  refreshing its measurements on that `resize` interrupts inertia — the page stops dead
  mid-flick, invisible on desktop. **Not reproduced here even under WebKit**, because
  an emulated viewport has no address bar to collapse. This one needs a physical phone
  and there is no way around that.
- **A scene heavy enough to hurt.** Everything measured here ran at 60 fps on a phone
  with its CPU throttled six times, which says more about the size of the bench scene
  than about the stack. Thousands of triangles, real textures and shaders would be a
  different measurement, and it has not been taken.
- **Thermal throttling.** A phone that has been rendering for ten minutes is a
  different machine from one that just loaded the page.

---

## 11 · Reported by others, current, and not measured here

Read on the open web on **2026-09-07**, with reproduction steps, which is what earns a
place in this file. Not measured on this bench. Treat as a checkpoint, not as a number.

### 11.1 · The device is not weak. It is old.

The instinct to design around "a low-end Android" is out of date in Europe, and the
correction matters because it changes what you build rather than only how you talk
about it.

What the 2026 market data actually says: European shipments are dominated by Samsung and
Apple with premiumisation holding steady, and Counterpoint reports OEMs **cutting
low-margin models** and leaning on refurbished stock through the memory shortage. So new
low-end volume is shrinking.

**But shipments are not the installed base, and the installed base is what visits your
page.** Multiple 2026 sources put the replacement cycle at **3,5 to 4 years**, up from
two to three historically. The phone in a European visitor's hand is therefore typically
a **mid-range-or-better device that is three to four years old** — a good phone with an
old GPU and an old thermal budget, not a cheap phone.

The practical consequence is narrower and more useful than "assume a weak device":

- **Do not budget for a weak CPU.** That has not been the binding constraint for years,
  and the bench agrees: 60 fps at ×6 throttling.
- **Do budget for old GPU memory and an old battery.** Those age badly and are exactly
  what a heavy scene exhausts.
- **Feature-detect, never device-detect.** `navigator.deviceMemory`, the GPU renderer
  string, and an actual frame-time sample during the first seconds are evidence. A
  user-agent string is a guess about a phone whose age you cannot see.

### 11.2 · The GPU is taken away from you, on every tier of phone

This is the WebGL failure that actually happens in the field, and it is **not** a
question of how powerful the device is:

- **Mobile Chrome reclaims GPU memory when a tab goes to the background**, which fires
  `webglcontextlost`. Reported on low-end and high-end phones alike.
- Chrome allows on the order of **16 simultaneous WebGL contexts per tab**; beyond that
  the oldest are dropped.
- **iOS Safari enforces hard memory limits**, and WebGL resources that are never
  released crash the tab far sooner than on desktop.

**So a WebGL build that does not handle context loss is broken by design**, and almost
none do. The floor:

```js
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); detener(); });
canvas.addEventListener('webglcontextrestored', () => { reconstruir(); arrancar(); });
```

`preventDefault()` is what makes restoration possible at all. Without it the context is
gone for good and the visitor gets a black rectangle where the hero was — after they
answered a phone call. **Not exercised on this bench.**

### 11.3 · iOS 26 breaks `position: fixed` and `sticky`, and `svh`/`dvh` do not fix it

The single most consequential thing found today, because of how many people it reaches
and because **no instrument in this repository can see it.**

Adoption: **iOS 26 was on ~79 % of iPhones by June 2026**, and ~86 % of iPhones released
in the previous four years. This is the default iPhone, not an edge case.

Reproduction, from the Mastodon issue tracker (`mastodon/mastodon#36144`), on
`mastodon.social`:

1. Force-quit Safari on iOS 26, reopen it, load the site.
2. Scroll — the fixed bottom bar is correct.
3. **Tap the address bar, then dismiss the keyboard.**
4. Scroll again: a **20 px gap** appears below the fixed bar, and content scrolls behind
   a floating menu that should have blocked it.

Force-quitting Safari resets it, until the address bar is focused again. Apple's own
developer forums carry the same report with a DTS engineer engaged: after the keyboard
shows and hides, `bottom: 0` no longer means the bottom.

**And here is the part that matters for this whole skill:**

> Web Inspector shows the element frame at the position where it is supposed to be, but
> it is not rendered there.

**Layout is right; the pixels are wrong.** `getBoundingClientRect()` returns the correct
number while the visitor sees the element 20 px out of place. That means this failure is
invisible to every measurement in `checks/gate.mjs`, to any headless screenshot, and to
any JavaScript probe you can write. It is only visible to an eye looking at a physical
iPhone.

Do not reach for `svh`, `lvh` or `dvh` as the answer. Developers report the gap persists
regardless of unit, because the bug is in compositing, not in the unit. The workarounds
being passed around — magic-number offsets tuned to the collapsed bar, `viewport-fit=cover`,
setting the background at `body` level, moving the scroll context — are patches on a
rendering bug, and each one is reported to work for some people and not others.

**What to do until Apple fixes it:** prefer designs whose critical elements are not
pinned to the bottom edge of the viewport on mobile; if a fixed bottom bar is genuinely
required, look at it on a real iPhone after tapping the address bar, and accept that a
20 px gap may be the cost.

> **Retracted before it was used:** WebKit bug **261185** (`svh`/`dvh` unexpectedly
> equal) reads like the same problem and is not. It is from 2023, was filed against
> iOS 16.4.1, and is **RESOLVED FIXED**. Citing it as current would have been an
> authoritative-looking reference to a solved bug. Checking the status field cost one
> page load.
