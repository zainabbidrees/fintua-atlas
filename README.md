# Fintua ATLAS

A country onboarding portal for Fintua's Comply VAT platform.

Adding a new jurisdiction to Comply is slow, manual expert work: a tax specialist
reads a country's tax authority sites and works out which filings apply, when they
are due, what goes in each box and which rules govern them. ATLAS puts research
agents in front of that work and keeps the expert in the deciding seat.

This is a design prototype. All data is fixtures — nothing talks to a real tax
authority, and no filing here should be relied on.

## The five steps

| Step | What the expert does |
|---|---|
| Select Country | Picks a jurisdiction; confirms the filing obligations found, each shown with its source |
| Return Types | Works through each obligation — frequency, deadlines, rates, treatment |
| Specs & Datasets | Reviews the field specifications and datasets behind each return |
| SQL Review | Checks the generated queries before they run |
| Approval & Publish | Signs off, with a log of everything a human overruled |

## Design principles

**The answer and its evidence live together.** Every finding shows the source it
came from, inline. Checking a claim should never mean leaving the screen.

**The expert is a tie-breaker, not a data-entry clerk.** Where sources disagree,
both are shown and a human picks, with a reason. Nothing auto-resolves — in tax,
a disagreement is the most important thing on screen.

**Capture the why.** Removing or overruling anything asks for one line. That
reasoning is the expertise Fintua sells and the audit defence it promises.

**Colour carries meaning, not decoration.** It is reserved for the primary action
and for anything asking for a decision. If everything is coloured, "needs your
check" stops meaning anything.

## Running it

```bash
npm install
npm run dev
```

The app serves on [http://localhost:3000](http://localhost:3000). `npm run build`
produces the production build; `npm run lint` and `npx tsc --noEmit` check it.

Fixtures cover the unhappy paths as well as the happy one, so they are clickable
rather than theoretical — Belgium succeeds with one obligation that needs review,
and the research, upload and conflict states each have a fixture behind them.

## How the code is laid out

Layers import downward only. A file in `ui/` that mentions "filing" is a bug.

```
src/components/ui/        Button, Input, Checkbox, Dialog, Badge
src/components/patterns/  Stepper, ConfirmWithReason, PickOne, LiveTrail, AddFileOrLink
src/components/domain/    FilingCard, SourceBlock, SourcePanel, CountryPicker
src/features/             One directory per step, each owning its screen and state
src/lib/mock/             Typed async fixtures with simulated latency
src/lib/copy.ts           Every user-facing string, in one place
```

`copy.ts` is deliberate: the terminology is reviewable in one file, so a tax
expert can correct the words without touching a component.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Radix primitives ·
lucide-react. Colour is defined in OKLCH; the typeface is Mona Sans, self-hosted
under the SIL Open Font License.
