# Assumptions

Written user stories cover the **Initiation step only** — 5 epics, 15 stories,
many items marked (TBC). Everything in steps 2 to 5 was inferred from the flow
diagrams, the swimlane and the role/system/output matrix.

Those inferences are recorded here rather than resolved silently, so the team can
confirm or overturn them.

## Scope and framing

| # | Assumption | Basis |
|---|---|---|
| A1 | All five steps are in scope, not Initiation alone | User decision, 2026-10-22 |
| A2 | Step names: Select Country · Return Types · Tax Form Retrieval · Form Annotations & Box Mapping · Tax Rules Generation · Query Builder | Prototype and user decision. "Select Country" for step 1 was chosen by the user over earlier candidates |
| A3 | Run lifecycle is draft → in_review → l1_approved → testing → l2_pending → live \| rejected | Flow diagrams |
| A4 | Swapping to a live API must touch only the service layer | User decision. All data is typed mock fixtures in `src/lib/mock/` with simulated latency |

## Behaviour not covered by a story

| # | Assumption | Reasoning |
|---|---|---|
| A5 | An obligation carries forward by **checkbox**, which is distinct from Remove | User request. Checkbox parks it; Remove deletes it and asks why. See `design.md` §2 |
| A6 | Continue is blocked while any obligation still requires review, **and** when nothing is carried forward | Consistent with story 1.x gating; the second half is inferred |
| A7 | Selection is tracked as *exclusions*, so anything found later is carried by default | Inferred. The alternative silently drops late findings |
| A8 | Before a jurisdiction is chosen, downstream blocks render inert rather than hidden | User request — the expert should see what the step will ask before committing |
| A9 | A removal reason is required, not optional | Story 1.x asks for reasons; made mandatory because the audit trail is the product |
| A10 | Step 5 approval is two people in order — first approval, then second — and the second cannot be the first approver | Maker-checker from the swimlane; separation of duties inferred as standard for a production release |
| A11 | Both approvals stay shut while any readiness check fails | Inferred — an approver should not sign for a run that is known not to be ready |
| A12 | A rejection stops the release; asking for approval again resets **both** approvals | Inferred — the fix may change what the first approver signed for |
| A13 | Publishing records a release note, shown with both sign-offs on the closing release record | Inferred — the closing record is what anyone revisits later |
| A14 | Tax Form Retrieval is its own step, between Return Types and Form Annotations & Box Mapping (formerly Specs & Datasets) — six steps, not five | User request. No story or prototype screen covers it; the countries index stages and the approval readiness links were renumbered to match |
| A15 | A page's checkbox decides only whether it carries into the specs, and asks no reason | Same rule as A5 — unticking parks a page, it deletes nothing. The agent pre-unticks explanatory notes and says why in the page viewer |
| A16 | Two editions of one form are never settled automatically; choosing one asks why | Follows the clash principle in `design.md` §2 — a newer date is not proof |
| A17 | A return type with no published form may continue only with an attached form or a recorded reason | Inferred — the specs step otherwise has nothing to map, silently |
| A18 | Export PDF prints the ticked pages through the browser's Save as PDF, rather than generating a file | No PDF library in the project; the printed sheets are the same drawing as the thumbnails |
| A19 | After the last step, the tax expert sends every step for approval; a reviewer approves or sends back **each step on its own**, and the country publishes only when all six are approved | User request and decision (2026-10-29). Replaces Query Builder's direct Publish. Supersedes the two-level release sign-off (A10–A13) for now; that screen is still in `src/features/approval`, unrouted |
| A20 | A reviewer reads each step as the real screen, locked — every edit control hidden — and can only comment, approve, or ask for changes; asking for changes needs a reason | User request and decision. Viewing tools (tabs, filters, page viewers, exports) stay |
| A21 | The tax expert can reopen any step in review and edit it with the step's normal footer; sending for approval again happens **only from the last step**, Query Builder. Steps sent back then return to waiting, marked "Sent again"; approved steps stay approved. Comments are read and answered from the approval screen | User request ("tab is clickable… send for approval again"), corrected by the user 2026-10-29: "the send for approval thing must be at the last step, not before that" |
| A22 | Sign-in never asks for a role: the account decides it. In the product the Comply SSO carries the role (authorisation is the backend's); the prototype stands in by email — `elena.fischer@fintua.com` is the reviewer, anyone else the tax expert | User decision (2026-10-29), replacing a Tax expert / Reviewer choice on the sign-in screen |

## Known gaps — not yet built

These are **not** decisions; they are unfinished work, recorded so they are not
mistaken for deliberate omissions.

- **`/audit-log` and `/settings` are dead routes.** Both appear in the sidebar and
  404. `/approvals` is now built: it lists every country sent for approval.
- **Review state lives in the browser.** Submissions, decisions and comments are
  kept in localStorage, so they are per-browser and a reviewer on another machine
  cannot see them. Step data is not saved either, so a reviewer sees each step as
  its fixtures and agent replay produce it, not the expert's exact edits.
- **Sign-in accepts anything.** No credentials are checked and there is no
  sign-up, by user decision — security was explicitly out of scope for the
  prototype. This must not reach anything real in its current form.
- **Only Belgium has full fixture data.** Other jurisdictions are listed but their
  research paths are stubs. Three `_countryCode` lint warnings mark the places
  waiting on a second jurisdiction.
- **No draft persistence.** "Save draft" does not yet write anywhere.

## Superseded

- An early note said the prototype's OKLCH token set and Inter would be
  "extracted verbatim" into `design.md` so the dev team's visual work carried
  forward. **This was overturned by the user**, who asked that none of the
  Lovable design be copied. The token set was deleted and rebuilt from scratch
  around a blue-violet brand at hue 272, with Mona Sans. See `design.md` §1.
