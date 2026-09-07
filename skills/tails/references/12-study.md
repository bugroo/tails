# Studying a reference

Loaded when someone points at a site and says "like this".

## Why this matters more than any other phase

Given a reference, output is calibrated. Without one, it drifts to the mean and gets
rejected — repeatedly, and without either side being able to say why. **Ask for one or
two references before designing, not after the fourth rejection.**

## What to extract — and what never to

**Extract the DNA:**

| | What to write down |
|---|---|
| **Structural fingerprint** | Where the eye lands, how sections divide, what the rhythm is down the scroll. Map it to the five axes in `03-form.md` |
| **Type pairing** | The two faces and their roles. Display size, tracking, line-height, and the **contrast ratio to body** |
| **Colour anchor** | The surface first, then the ink, then what the accent is *for* |
| **Motion register** | Does it pace, reveal, give weight — or decorate? At what speed |
| **Density position** | Where it sits on the axis in `02-density-axis.md`, and whether that matches its task |

**Never extract:**

- The layout, copied. That is theft and it produces a worse result than understanding it.
- The brand. Their colour and their typeface belong to them.
- A paid template's structure.
- The content, obviously.

**The line:** you are taking the *reasoning*, not the artefact. If you cannot say **why**
a decision works before reusing it, you are copying, not studying.

## How to read a site properly

Read the site, **never an article about the site.** An article is someone else's average.

```js
// what to pull, in a browser, after the loaders have finished
getComputedStyle(el).fontSize / letterSpacing / lineHeight / fontFamily
getComputedStyle(el).backgroundColor / color        // by painted area
document.querySelectorAll('canvas')                 // and their contexts
window.THREE?.REVISION, window.gsap?.version        // what it actually runs
performance.getEntriesByType('resource')            // weight, and where it went
```

**Three things that will bite you**, all of which did:

1. **Wait long enough.** Nine seconds is not excessive on these sites. Measure too early
   and you record the loader.
2. **Check you got the page.** One study measured a 404 and reported its typography as
   the studio's. Confirm the status and a positive marker.
3. **Capture the text you measured**, not only the numbers. One site served *"Your
   browser is not supported"* to a headless browser and produced a perfectly coherent
   typographic profile of an error message.

## Reading a bad site — the prospecting case

Starting from a business with a poor existing site, the study runs in reverse. You are
not extracting what works, you are finding **what the site fails to do for its owner**:

- Can you find the phone number on a phone, without pinching?
- Can you tell what they sell, in five seconds?
- Can you do the thing you came to do — book, order, ask — or does it end in an email
  address?
- Does it load on mobile data?
- Is the information that decides a purchase — price, hours, address, availability —
  visible, or buried?

**Report that in business terms, not design terms.** "Your phone number is an image, so
nobody can tap it" moves an owner. "The typography is generic" does not.

## Before you use anything you extracted

Write one sentence: **why does this decision work, for this business?** If the sentence
only works for the site you took it from, you have copied a form. Go back to
`03-form.md` and choose your own.
