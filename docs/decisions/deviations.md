# Deviations — story vs prototype

Conflicts between `Fintua_Country_Onboarding_Initiation_User_Stories.pdf` and the
Lovable prototype at `domain-delineator.lovable.app`.

**The rule: the written story wins, and the difference is logged here.** Never
"fix" the build toward the prototype on any of these without a decision from the
team. Identified 2026-10-22, during discovery.

| ID | Subject | Story says | Prototype does | Built |
|---|---|---|---|---|
| D1 | Country dropdown | Story 1.1: already-onboarded countries appear "with no difference from other countries"; the list is not filtered | Greys them out, disables them, adds an "onboarded" tag | **Reversed at the designer's request (2026-10-28), then tightened (2026-10-29):** a country already on the Countries page — in progress, in review or published — is left out of the dropdown entirely, so it is never started twice; it is found on the Countries page instead. Includes countries published or sent for approval in this browser. The "nothing found" research fixture moved from France (onboarded) to Malta |
| D2 | During discovery | Story 1.3: all other content greyed out and non-interactive | Shows skeleton rows, leaves Add URL visible | **Story** for behaviour, prototype for appearance: interaction blocked, skeletons kept as the visual |
| D3 | Source title link | Story 2.2 contradicts itself — the acceptance criterion says "without leaving the Initiation screen", the story detail says "new browser tab (TBC)" | New tab | **New tab** with `rel="noopener"`. Flagged for sign-off — this one is unresolved in the source material, not a prototype error |
| D4 | Actor naming | "Onboarding Expert" throughout | Prototype and swimlane split the work across four roles | **Four roles** — Business/Product, Tax/Domain Expert, Fintua Developer, Administrator, plus L1/L2 approver groups. The story's single actor maps to whoever owns that step |
| D5 | Add URL field | Story 1.4 needs it for manual continuation after discovery fails | Only renders once discovery has started | **Story.** Present whenever a jurisdiction is selected |
| D6 | Bulk confirm on review | A self-imposed rule, not the story: confirm per value — "a tax record can't be cleared on trust" | Offered bulk actions on the review grid | **Reversed at the designer's request (2026-10-26).** The Return Types review now has a checkbox per value and a selection bar with bulk **Confirm** and **Delete**. Kept safe: confirming stays reversible (per-row undo and the confirm toast's Undo), and Delete *dismisses* the finding from the review rather than destroying a record |

## Why this file exists

These are real requirement conflicts, not implementation details. The team needs
them visible in order to rule on them. D3 in particular is a contradiction inside
the source document and cannot be resolved by reading it more carefully.
