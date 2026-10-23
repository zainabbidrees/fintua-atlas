# Working in this repo

Fintua ATLAS — a country onboarding portal for Fintua's Comply VAT platform.
Read [`design.md`](design.md) before changing anything visual; it is the design
language and its layout rules are binding.

## Non-negotiables

**Every user-facing string goes in `src/lib/copy.ts`.** Never hardcode text in a
component. The point is that a tax expert can review and correct terminology in
one file.

**Layers import downward only.**

```
ui/ → patterns/ → domain/ → features/
```

A file in `ui/` that mentions "filing" is a bug. `ui/` knows nothing about tax;
`patterns/` knows interaction shapes; `domain/` knows the vocabulary; `features/`
assembles them.

**Every page uses the same frame** — `px-6 py-8 sm:px-12` outside,
`mx-auto w-full max-w-[1600px]` inside, applied to the header band, the body and
the pinned footer alike. Do not change one wrapper without the other two. Prose
caps like `max-w-[62ch]` are *not* page margins; leave them alone.

**Do not copy the Lovable prototype.** It is the database rendered as UI and its
design was explicitly rejected. Where it conflicts with the written stories, the
story wins — see [`docs/decisions/deviations.md`](docs/decisions/deviations.md)
for the five logged conflicts, none of which should be "fixed" toward the
prototype without a decision.

**Colour carries meaning.** Brand for the primary action and selection;
`attention` for anything needing a human decision; `risk` for destructive;
`settled` sparingly. No gradients. If you are reaching for colour to make
something look nicer, don't.

## Before saying something works

Verify it in the browser. This project has repeatedly had bugs that typecheck
clean and look fine in the source: a row link that covered only the first cell, a
39px mobile overflow from a grid's `min-width: auto`, a stepper clipped by a
container cap, table headers bunching under auto layout.

Measure rather than assume. When checking layout, wait for hydration — readings
taken mid-render have produced confidently wrong numbers more than once.

Run `npx tsc --noEmit` and `npm run lint`. Three `_countryCode` warnings are
known and intentional, pending a second jurisdiction.

## Building a screen

Five states, not one: empty, working, found, nothing-found/failed, and clash.
Fixtures for each live in `src/lib/mock/` so every path is clickable. Belgium
succeeds with one obligation needing review; other fixtures cover empty research,
failed research, and a colliding upload.

Capture the why. Removing or overruling anything asks for a one-line reason —
that trail is what step 5 reports and what the product actually sells.

## Working with the user

The user is a senior designer. Expect direction on craft, and give reasoning
rather than assertions — claims about what users need should be backed by
evidence, not asserted. Plain language; avoid jargon when a normal word works.

Their uncommitted edits are often in flight across several files. Stage only the
files you actually touched — never `git add -A` — and say so when a commit of
yours also carries their work.

## What is not built

See [`docs/decisions/assumptions.md`](docs/decisions/assumptions.md). In short:
`/approvals`, `/audit-log` and `/settings` are dead routes; sign-in accepts any
input and checks nothing; only Belgium has full fixture data; "Save draft" does
not persist.
