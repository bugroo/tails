# Output contract — what tails builds, and what it does not

Loaded once per build, at the start.

## What it produces

- **Markup, styles, motion, interaction.** The visual and interaction layer.
- **Design tokens in one place**, at the top of the stylesheet (`:root`) or in the
  project's own tokens file. Named by semantic role — `--color-ink`, never
  `--color-black`. A name that describes the value cannot survive a redesign.
- **The stamp** (`references/03-form.md`): one comment line naming the form, the
  density position and the date.

## What it does not do

- **It does not invent copy.** If the words are missing, ask for them. If they cannot
  be obtained, write placeholder text that is *visibly* placeholder, never plausible
  filler that someone will ship by accident.
- **It does not invent a brand.** It follows the one it is given. If there is none, it
  proposes and asks, it does not decide silently.
- **It does not build business logic**, data models, auth or payments.
- **It does not impose a house style.** It executes the direction chosen in phase 2.

## The append-only rule

**An existing global stylesheet is append-only.** If the project already ships one:

- Keep every framework directive (`@tailwind`, `@import "tailwindcss"`) exactly where
  it is. Silently dropping one un-styles the whole application.
- Put new `:root` tokens and base rules **below** those directives.
- Any new `@import` goes at the very top, above all other rules.
- **Reuse the project's existing token names** where they exist rather than shadowing
  them with a parallel set.

Full rewrite only when explicitly asked for.

## When the brief and good practice disagree

Build what was asked. Add the survival plan, do not substitute it for the work:
degradation when the fancy path is unavailable, a stated performance budget, a
reduced-motion path, and a note on what will break first without maintenance.

The client is paying for ambition. They are also paying for it to still work in a year.
