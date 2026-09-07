# Colour

Loaded in phase 4, always.

## What the measured sites actually do

Dominant colours by painted area, six sites, 2026-09-07:

| Site | Dominant colours |
|---|---|
| obys.agency | black · white · `#c9c9c9` |
| basement.studio | black · `rgba(0,0,0,.9)` · `#2e2e2e` · `#1a1a1a` · white |
| resn.co.nz | `rgba(0,0,0,.7)` · black · white · `#e3e3e3` · `#717171` |
| unseen.co | white · `#212121` · `#efded9` · `#f1edeb` |
| garden-eight.com | `#1e1f1f` · `#dbd6d0` |

**Four of the five are monochrome.** Black, white, and two or three greys. The fifth
adds one warm neutral. Not one has a brand hue covering significant area.

That is the opposite of what a model produces, which is a saturated accent spread across
buttons, links, icons, badges and gradients — colour used as decoration because nothing
told it what colour was *for*.

### What this means, and what it does not

It does **not** mean "make everything grey". These are studio sites: their work is the
colour, and the interface gets out of the way. A restaurant, a clinic, a cinema, a shop
each have their own reason to carry colour.

**What it does mean:** in every one of them, colour that is not doing a job has been
removed. That is the transferable rule.

## The rule

**Every colour on the page answers a question. If it does not answer one, delete it.**

| Question | Colour is doing |
|---|---|
| What is this? | Category — a service, a section, a product line |
| What state is this in? | Available, sold out, urgent, done |
| What can I do here? | Action — one accent, used sparingly |
| What is this brand? | Identity — usually the surface, not the accent |

Anything that is not one of those four is filling space.

## The surface — and the default is white

The single decision that most changes how a page reads is the surface it is printed on,
and it is the one most often made by accident.

**The default is white.** Not because white is exciting, but because it is what the
measured field actually uses, and because it is the surface that gets out of the way of
everything else.

From the five award-winning sites read on 2026-09-07, by painted area:

| Site | Surfaces |
|---|---|
| obys.agency | **white** · black · `#c9c9c9` |
| basement.studio | black · `#1a1a1a` · `#2e2e2e` · **white** |
| resn.co.nz | black · **white** · `#e3e3e3` · `#717171` |
| unseen.co | **white** · `#212121` · `#efded9` |
| garden-eight.com | `#1e1f1f` · `#dbd6d0` — dark, with the warmth in the *ink* |

**Four of the five use pure white and pure black.** Only one puts a warm tone on a
surface, and one inverts it entirely: dark ground, warm type.

### The cream rule

**Never reach for a cream or warm off-white background unless it was explicitly asked
for.** It is the first of the three clusters that AI-generated design collapses into —
*warm cream background near `#F4F1EA`, high-contrast serif display, terracotta accent* —
and it arrives whenever a model is told "warm, but not white" and has to resolve that
without a decision behind it.

This is not a ban on warm surfaces. It is a ban on **reaching for one by default**. If the
brief, the brand, or the client asks for it, use it and use it well. If nobody asked, the
answer is white.

*(Written after using the same cream four times in one day — `#f2efe9`, two oklch
equivalents, and a production site — without deciding it once, hours after reading the
warning that names it.)*

### Choosing a surface deliberately

Pick one, and be able to say why in a sentence:

| Surface | Reads as | Fits |
|---|---|---|
| **White** | Neutral, current, gets out of the way | **The default.** Product, editorial, retail, anything where the content carries |
| **Near-black** (`#1a1a1a`–`#212121`) | Focus, craft, cinema | Work that is looked at rather than read: photography, 3D, film |
| **Grey** (`#e3e3e3` and down) | Industrial, technical, quiet | Tools, documentation, dashboards |
| **Warm off-white** | Paper, age, hospitality | **Only when asked**, or when the brand genuinely is old paper |
| **A saturated brand colour** | Loud, confident, retail | When the brand owns that colour and the type can survive on it |

**And pure is allowed.** Earlier guidance here said never `#fff` or `#000`; the
measurement contradicts it. What looks like a default is not the value, it is the
*absence of a choice*. White chosen on purpose reads as clean. Cream chosen by reflex
reads as generated.

### Then the ink, then one accent

- **Ink**: black or near-black on light; on dark, an off-white — this is where warmth
  belongs if the brand needs warmth, as garden-eight does it. Two or three steps, named
  by role.
- **One accent**, and you must be able to say which of the four questions above it
  answers.
- **Hairline last**: the ink at 12–18 % alpha.

Six to nine tokens. More than that and they stop being decisions.

## Use OKLCH

```css
--ink:    oklch(21% 0.012 60);
--paper:  oklch(95% 0.012 85);
--accent: oklch(55% 0.19 255);
```

Lightness in OKLCH is *perceptual*, so `oklch(60% …)` looks equally light at any hue —
which HSL does not give you. That makes two things possible that are otherwise guesswork:
a palette whose steps feel evenly spaced, and hue changes that do not silently break
contrast. Also reaches colours outside sRGB on displays that have them.

Keep hex fallbacks where old browsers matter, and **never define a colour only inside a
media query or a `[data-theme]` block** — define the whole palette on bare `:root` and
override tokens, or a theme will inherit a transparent surface.

## Contrast is measured, not intended

- Body text: **4,5:1**. Large text (≥24 px, or ≥18,66 px bold): **3:1**. Non-text UI
  (borders of controls, icons that carry meaning): **3:1**.
- **Measure against the colour actually behind the text**, not the one you meant. On a
  card with its own background, that is the card, not the page.
- A 1 px hairline needs far more than 3:1 to be visible: it has almost no area to
  compare. Nominal compliance and being seen are different things.
- **Never encode meaning in hue alone.** Colour-blind users, dark mode, printouts,
  bright sunlight. The label carries the meaning; the colour reinforces it.

## The two colour tells

1. **The indigo-to-purple gradient.** The single most recognisable mark of a generated
   page. `checks/slop.mjs` fires on it.
2. **A saturated accent covering large areas.** Accent means accent. When a brand colour
   is the surface, it stops being an accent and everything on it has to fight for
   contrast.
