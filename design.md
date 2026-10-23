# Fintua ATLAS — design language

How this product looks and behaves, and why. Written for designers and
developers working on it; the component rules at the end are binding.

Companion documents: [`docs/decisions/deviations.md`](docs/decisions/deviations.md)
records where the build departs from the Lovable prototype, and
[`docs/decisions/assumptions.md`](docs/decisions/assumptions.md) records what was
inferred where no user story exists yet.

---

## 1. Where this came from

The dev team built a prototype in Lovable. It is a useful artefact and it is
**the database schema rendered as UI** — a sources table, a return-types table,
an uploads box, a Continue button enforcing a foreign-key rule. It was built
from an engineering view of the data, not from the work a tax expert actually
does.

This design is not a port of it. Its token set was deleted rather than carried
over. Where the prototype and the written user stories disagree, the **story
wins** and the difference is logged, never silently applied.

## 2. Principles

**The answer and its evidence live together.** Every finding shows the source it
came from, inline. In the prototype, sources were one table and return types
another, so checking "is the deadline really the 20th?" meant leaving the screen,
finding the document and searching it by hand. Put the value and its proof side
by side and the expert's job becomes *confirm or correct* rather than *go do
research*.

**The expert is a tie-breaker, not a data-entry clerk.** Where two sources
disagree, show both and make a human choose, with a one-line reason. Nothing
auto-resolves. In tax, a disagreement is the most important thing on screen.

**Agreement raises confidence; disagreement forces review.** A duplicate upload
is not waste — it either corroborates a finding or catches a mistake.

**Capture the why.** Removing or overruling anything asks for one line. That
reasoning is the expertise Fintua sells and the audit defence it promises. It is
why step 5 can show what a human overruled.

**Keep tax words, drop computer words.** Specialist terms stay where users need
them — *jurisdiction*, *obligation*, *corroborated*, *nil return*. What goes is
vocabulary that exists only because a programmer needed a name.

**One way to say no.** The prototype had a checkbox *and* a delete button per
row — two controls for nearly the same intent. Here they mean different things:
the checkbox decides what is **carried forward**; Remove **deletes** the
obligation and asks why.

**The screen never freezes.** Research runs visibly in the background while the
expert keeps working.

## 3. Colour

Colour carries meaning, not decoration. A neutral canvas, with colour reserved
for the primary action and anything asking for a decision. If everything is
coloured, "needs your check" stops meaning anything.

**No gradients.** Depth comes from spacing and hierarchy, not effects. Shadows
are barely-there; a hairline border does most of the separation work.

Defined in `src/app/globals.css` as OKLCH, exposed to Tailwind via `@theme inline`.

### Brand

A blue-violet sitting deliberately between the two — hue 272, where blue is ~260
and violet ~290. Moderate chroma reads considered rather than vivid.

| Token | Value | Use |
|---|---|---|
| `--brand` | `oklch(52% 0.18 272)` | Primary action, selected state, focus ring |
| `--brand-hover` | `oklch(45% 0.19 272)` | Hover on primary |
| `--brand-quiet` | `oklch(96% 0.02 272)` | Tinted background — never a fill |
| `--brand-edge` | `oklch(89% 0.05 272)` | Border on a brand-tinted surface |

### Neutrals

Carry a trace of the brand hue, so greys belong to the system rather than
looking borrowed.

`--canvas` the page · `--surface` cards and raised areas · `--surface-sunken`
inert and placeholder areas · `--border` / `--border-strong` hairlines ·
`--text` / `--text-muted` / `--text-faint` the three text weights ·
`--control` the one flat grey control fill, specified as a hex by design.

### Semantic — the only other colours

| Token | Means |
|---|---|
| `--attention` | Needs a human decision |
| `--risk` | Destructive, or a conflict |
| `--settled` | Confirmed — used sparingly, not as reassurance noise |

Each has a `-quiet` background and most an `-edge` border.

### Deep

`--deep` and its family are the app's spine of colour: the sidebar and the
auth panel. Nothing else uses them.

## 4. Type

**Mona Sans**, self-hosted as a variable font via `next/font/local` under the
SIL Open Font License. Weights 400/500/600 only.

Headings get `letter-spacing: -0.015em` — Mona Sans opens up at larger sizes.
Body text sits at 13–15px; this is a dense professional tool, not a landing page.
Anything numeric that sits in a column gets `[data-numeric]` for tabular figures,
so digits align.

Headings do not shout. Hierarchy comes from weight and colour before size.

## 5. Layout

**Every page uses the same frame.** This is binding — it was got wrong several
times before it was settled.

```
px-6 py-8 sm:px-12          ← outer: 48px gutters from the sm breakpoint up
  mx-auto w-full max-w-[1600px]   ← inner: the content column
```

Applied to all three wrappers on a step screen — the header band, the body, and
the pinned footer — so the title, the content and the action bar share one left
edge. The Countries index uses the same frame.

Prose inside a page is capped separately (`max-w-[62ch]` and similar) to keep
paragraphs readable. **Those are not page margins and must not be confused with
them.** Likewise the filing card's two-column row is capped at `max-w-5xl`:
without it the text column grows with the page and strands the source block
against the far edge.

The sidebar is 288px (`w-72`), sticky, and does not scroll with the page.

## 6. Motion

Restrained. An entrance cascade (`rise`) carries lists and cards in on load,
staggered by `--index`, using transform and opacity only — nothing that forces
layout. It is disabled wholesale under `prefers-reduced-motion`.

No perpetual animation. This is a tool people use for hours.

## 7. States

Every screen is built in five states, not one. Fixtures exist for each so they
are clickable rather than theoretical.

| State | What is shown |
|---|---|
| Empty | The picker, plus inert placeholders of what will appear — so the expert sees what the step will ask before committing |
| Working | A live trail of what is being read. The screen stays usable |
| Found | Results, each with its proof. Uncertain ones flagged |
| Nothing found / failed | Plain message, Retry, and the add-your-own input still live |
| Clash | Two answers side by side; the expert picks one and says why |

Belgium succeeds with one obligation that needs review. Other fixtures cover
empty and failed research, and an upload that collides with a discovered source.

## 8. Components

Four layers. **A layer imports downward only — a file in `ui/` that mentions
"filing" is a bug.**

```
src/components/ui/        badge · button · checkbox · dialog · disclosure · input · popover
src/components/patterns/  stepper · confirm-with-reason · pick-one · live-trail · add-file-or-link
src/components/domain/    filing-card · source-block · source-panel · country-picker ·
                          describe-document · document-list
src/components/brand/     logo
src/features/<step>/      one directory per step: its screen, its state hook, its parts
```

`ui/` knows nothing about tax. `patterns/` knows about interaction shapes but not
about filings. `domain/` knows the vocabulary. `features/` assembles them.

**`PickOne` is the one to get right** — it is reused wherever two answers clash,
here for duplicate documents and later for conflicting values. Built once,
properly.

## 9. Words

**Every user-facing string lives in `src/lib/copy.ts`.** No exceptions. The point
is that terminology is reviewable in one file, so a tax expert can correct the
words without touching a component — and so a change of term lands everywhere at
once.

The register sits in the middle: not baby language, not jargon for its own sake.
*Jurisdiction* rather than *country*, because it covers territories and protocols
that are not countries but do have their own VAT regime. *Corroborated* rather
than *verified*, because it means specifically that more than one independent
source agrees — it is an evidential standard, not a confidence score and not a
claim that a human checked.

## 10. Accessibility

Approvers drive this app by keyboard. Focus is a requirement, not a polish item:
a 2px brand outline at 2px offset, never removed.

Inert sections are marked `aria-disabled` and read as outlines rather than dimmed
text, so "not carried forward" never looks like "broken". Every page must hold a
48px side gutter and work at 375px with no horizontal scroll; tables and the
stepper scroll inside their own containers rather than pushing the page.
