# Redesigning something that exists

A redesign is not a build with a head start. It has a mode, an audit, a set of things
that never move without being asked, and one risk that outranks every visual one. Getting
the mode wrong is the single largest cause of bad redesign output: an overhaul delivered
to someone who asked for a refresh, or a refresh delivered to someone who wanted the old
site gone. Protocol taken from Leonxlnx/taste-skill §11 (MIT, read 2026-09-20), adapted to
this skill's phases and its non-negotiables.

## 1 · Detect the mode, before phase 0

| Mode | What it means | Dials |
|---|---|---|
| **Preserve** | Modernise without breaking the brand. Extract the tokens, evolve them | Read the existing site's dials first; that is the starting point, not the baseline |
| **Overhaul** | New visual language on top of existing content and structure | Greenfield for visuals; content and information architecture stay |
| **Greenfield** | The brand itself is changing, or a full overhaul is approved | The pass as written |

If it is not obvious, ask **once**: *"Should this keep the existing brand, or are we
starting visually from scratch?"* Then phase 0 and the design read, with the mode in it.

## 2 · Audit before touching anything

Write the current state down before proposing a change. This is the reconnaissance of
phase 1 pointed inward:

- **Brand tokens.** Primary and accent colours, the type stack, the logo treatment, the
  radii. Read them from the served CSS, not from the source you think is deployed.
- **Information architecture.** Page tree, primary navigation, the conversion paths.
- **Content blocks.** What exists, what is doing work, what is filler.
- **Patterns to keep.** Signature interactions, a recognisable hero, the copy voice.
- **Patterns to retire.** The tells `checks/slop.mjs` and `checks/structure.mjs` find,
  broken layouts, dead links, generic stock imagery, performance traps.
- **The existing site's dials.** Variance, motion, density as they are now.
- **The search baseline.** Which pages rank, their titles, structured data, OG cards,
  the slugs. **Losing search is the first risk of any redesign**, and it is invisible in
  a screenshot.

The audit is a deliverable in itself. A redesign that starts without one has no way to
say what it kept.

## 3 · What never changes silently

Not without an explicit yes, in that turn, from the person who owns the site:

- URL structure and route slugs.
- Primary navigation labels.
- Form field names and their order: analytics events and browser autofill depend on them.
- The logo or wordmark.
- Legal, consent and cookie copy.
- Anchor IDs and element IDs that tracking is wired to.
- Existing accessibility wins: focus states, alt text, keyboard paths, contrast. A
  redesign may not regress any of them, and the gate measures the last three.

## 4 · Levers, in order of lift per unit of risk

Apply in order and stop when the brief is satisfied:

1. **Typography.** The biggest visual change for the least risk. `04-typography.md`.
2. **Spacing and rhythm.** Section padding, vertical rhythm, the density position.
3. **Colour recalibration.** Unify the neutrals, keep the brand accent. `05-colour.md`.
4. **A motion layer** on the components that exist. `06-motion.md`, and the tier.
5. **Hero and key-section recomposition.** The form, stamped as in `03-form.md`.
6. **Full block replacement.** Only when a block cannot be saved.

The first four carry most of the value at a fraction of the risk.
When the information architecture, the content and the search position are sound, stop
there; that is a targeted evolution and it is the right answer more often than a full
redesign. When the debt is structural (no design system, broken on phones, an IA nobody
can navigate) it is a full redesign with strict content preservation. When the brand
itself is changing, it is greenfield.

## 5 · Preserve, concretely

- A brand that is already purple stays purple. `05-colour.md` argues against the default
  reach for it, not against a brand that owns it.
- The copy voice stays unless a rewrite was asked for. Visual modernisation is not a
  content rewrite, and copy is still governed by `09-copy.md`: nothing invented.
- The stamp still applies. A redesign gets a form, written into the stylesheet, at least
  three axes from the last one in the project.

## 6 · Hand off

Phase 6 as written, plus: what was kept and why, what was retired and why, which slugs,
labels and field names are byte-identical to before, and which search signals were
compared before and after.
