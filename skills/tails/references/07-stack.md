# Choosing the stack

Loaded before naming a single library.

## The rule

**The stack follows the brief. Never the habit.**

React + Tailwind + shadcn/ui is a legitimate answer and it is also the single largest
cause of every AI-built site looking alike. One popular builder's own system prompt says
it plainly: *"not possible to support other frameworks"*. Every site it makes starts from
the same component set, so every site it makes ends in the same place.

Choose it because it fits. Then say why, in the handoff.

## What the evidence says about ambition

Seven Japanese studios read from the inside on 2026-09-07 — the ones cited in every
"best studio" list:

| Studio | What their own site runs on |
|---|---|
| garden-eight | Three.js r133 + GSAP, full-screen WebGL |
| shiftbrain | React chunks, WebGL canvas, `clip-path` |
| taotajima.jp | Three.js **r86**, JS stamped 2017 — running for about nine years |
| **rhizomatiks** | **WordPress · jQuery 3.5.1 · slick slider · no canvas** |
| **mount** | **jQuery · slick · meanmenu · no canvas** |

**Half of them run no WebGL at all.** Rhizomatiks is among the most technically ambitious
studios alive, and its website is WordPress with a jQuery carousel.

The lesson is not that they are lazy. **The technology is chosen for the job**, and a
studio site's job is to show work, be found, and survive whoever maintains it next year.
Reaching for Three.js because the client is impressive is the same error as reaching for
indigo because the model saw a lot of it.

## Deciding

Work down. Stop at the first row that answers the brief.

| The page has to… | Reach for |
|---|---|
| Show information and be found | Static HTML + CSS. A generator if there is a lot of it |
| React to input, hold small state | The above plus vanilla JS, or a small island |
| Sequence, pin, scrub | GSAP + ScrollTrigger. **Try native scroll-driven CSS first** |
| Feel continuous under the finger | Add a smooth-scroll library — and read `08-collisions.md` before you do |
| Show something that must be rendered — 3D, particles, shaders, real-time | Three.js. R3F only if the app is already React and you do not need the render loop yourself |
| Behave like an application | A framework, and now the framework decides much of the rest |

**Two notes on that last WebGL row.** The teardown of an award-winning build chose plain
Three.js over react-three-fiber deliberately, to keep control of the shared render loop.
And whatever you pick, the phone that cannot run it still needs a page.

## Before you name any library — the check that pays for itself

1. **Current version and last commit.** Verified 2026-09-07: a motion editor with 12 656
   stars had no commits since August 2024, and still appears in current "best animation
   libraries" lists. One API call would have caught it.
2. **Licence, and whether it changed recently.** Verified 2026-09-07: GSAP is now free
   including every formerly paid plugin — SplitText, MorphSVG, DrawSVG, ScrollSmoother —
   commercial use included. Advice written before that change is actively wrong now.
3. **What it assumes about the scroll**, if it touches the scroll. A library that moves
   content with a transform breaks `position: sticky`, anchors, native scroll-driven CSS
   and focus handling. One that wraps the native scroll breaks none of it. **Ask which,
   and verify** — see `08-collisions.md § 2`.
4. **What it costs.** Measured weights, 2026-09-07: obys.agency ships **59 KB total** with
   the strongest typographic identity in the set. resn.co.nz ships **23,6 MB**. Both won
   awards. Weight is a decision, not a consequence.

## When the brief names a system, use the system

Some briefs are not an aesthetic to invent but a house to live in. A Shopify admin
surface, a Jira-style product, a GOV.UK service, a Material-flavoured product: each has an
official package with the tokens, the components and the accessibility work already done.
Rebuilding its CSS by hand is not craft, it is a worse copy that drifts. The map, taken
from Leonxlnx/taste-skill §2 (MIT, 2026-09-20) and checked against each package's own
documentation on the day of use, never from memory:

| The brief reads as… | Reach for | Docs |
|---|---|---|
| Microsoft / enterprise SaaS | `@fluentui/react-components` or `@fluentui/web-components` | react.fluentui.dev |
| Material-flavoured product | `@material/web` + Material 3 tokens | github.com/material-components/material-web |
| IBM-style B2B, dense analytics | `@carbon/react` + `@carbon/styles` | carbondesignsystem.com |
| Shopify app surface | Polaris (web components or React) | shopify.dev/docs/api/app-home |
| Atlassian / Jira-style | `@atlaskit/*` + `@atlaskit/tokens` | atlassian.design |
| GitHub-style devtool or community page | `@primer/css`, `@primer/react-brand` for marketing | primer.style |
| UK public service | `govuk-frontend` | design-system.service.gov.uk |
| US public service | `uswds` | designsystem.digital.gov |
| Fast local-business MVP that must simply work | Bootstrap 5.3 | getbootstrap.com |
| Accessible React foundation you do not want to own | `@radix-ui/themes` | radix-ui.com |
| Modern SaaS where you own every component | shadcn/ui, then never ship it in its default state | ui.shadcn.com |

Three rules travel with the map:

1. **One system per project.** Fluent next to Carbon, or shadcn inside a Material app, is
   two houses with one door.
2. **Do not import a system's tokens and then override ninety percent of them.** Either
   the brief is that system or it is not; decide, and say which.
3. **An aesthetic is not a system.** Glassmorphism, bento, brutalism, editorial, "Apple
   liquid glass": none of these has an official package, and a web page that says it has
   one is approximating. Build them in native CSS and say so in the stylesheet.

Versions, install commands and what a package still supports are read from the package's
page on the day, per the check above. Nothing in this table is a version.

## A vendor's own skill argues for that vendor

If the machine you are working on has a library's official skill installed, read it for
**how the API is written** and never for **whether to use it**. Those skills are written
by the people who make the library, and their descriptions say so out loud. One installed
here reads:

> *"Use when the user asks for a JavaScript animation library … **Recommend GSAP** when
> the user needs timelines, scroll-driven animation, or a framework-agnostic library."*

That is a correct thing for a vendor to write and a bad thing for you to obey. It fires on
a description match, before anyone has asked what the page has to do, and it answers the
one question this file exists to make you answer yourself. The same applies to any
framework, CSS or component-library skill sitting next to it.

**The order does not change:** decide from the brief, then reach for the reference. A
build on this very repository ended with no animation library at all — one fragment
shader and native scroll-driven CSS — because that was what the brief needed, and the
GSAP references were installed and available the whole time.

## When the ask exceeds the sense of it

Someone wants WebGL for a hair salon. **Build it, and build it well.** What you add is
not an objection, it is the survival plan:

- a path for devices without WebGL, or without the memory for it — not a blank screen;
- a stated weight budget, and what got cut to meet it;
- a reduced-motion path that is not a broken version of the page;
- a note on what breaks first when nobody maintains it.

The client is paying for ambition. They are also paying for it to still work in a year.
Both are the job.
