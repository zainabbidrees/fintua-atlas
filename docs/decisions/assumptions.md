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
| A19 | Only Return Types, Form Annotations & Box Mapping, Tax Rules Generation and Query Builder need approval; Select Country and Tax Form Retrieval do not. The tax expert sends each of the four **from its own footer** and carries straight on to the next step — nothing waits on the reviewer. The reviewer decides **in order**: a step opens for approve / request changes only once it is sent and every approval step before it is approved. The country publishes when all four are approved | User request and decision (2026-10-30), replacing "send every step from the last step" (2026-10-29). Supersedes the two-level release sign-off (A10–A13) for now; that screen is still in `src/features/approval`, unrouted |
| A20 | A reviewer reads each step as the real screen, locked — every edit control hidden — and can only comment, approve, or ask for changes; asking for changes needs a reason | User request and decision. Viewing tools (tabs, filters, page viewers, exports) stay |
| A21 | The tax expert can reopen any step in review and edit it with the step's normal footer, whose primary button reads "Send for approval" until sent, "Send for approval again" after changes are asked for, and Continue once waiting or approved. Steps sent again return to waiting, marked "Sent again"; approved steps stay approved. Comments are read and answered from the approval screen | User request ("tab is clickable… send for approval again"); per-step sending from the user, 2026-10-30: "it should let me do my work further and not hook me" |
| A22 | Sign-in never asks for a role: the account decides it. In the product the Comply SSO carries the role (authorisation is the backend's); the prototype stands in by email — `elena.fischer@fintua.com` is the reviewer, anyone else the tax expert | User decision (2026-10-29), replacing a Tax expert / Reviewer choice on the sign-in screen |
| A23 | A return type can be filed on several schedules (e.g. monthly by default, quarterly below a threshold), each with its own deadline and sources. The Return Types table gives each schedule a **complete row of its own** — the return type's name repeated, with its own tick, Attach and Confirm — and each row is cleared on its own. The heading still counts return types; the footer counts rows | User request (2026-10-30), after a grouped layout with one Confirm per return type was rejected |
| A24 | Return Types carries every column of the return-deadline sheet a person reads. The agent fills the non-working-day rule and working-days-only (`standard_frequency`, `min_threshold` and `max_threshold` are not used — designer, 2026-10-30); the expert fills the five workflow offsets (the **Offset** column — renamed from "Workflow days" by the designer, 2026-10-30) and is_default in one form per row, laid out as the data-due → submission-due timeline with live dates. One row's offset can be copied to every row still at zero; each return type starts with its first frequency as default. The offset is optional: a row left alone, or a stage left blank, counts as zero days, and nothing waits on it (designer, 2026-10-30). Database ids are not shown | User request (2026-10-30), from `SL_F1_Return Deadlines as of 2026-07-29.xlsx`. The meaning of `deadline_change_when_not_working_day_id` codes is inferred (next / previous / none) |
| A25 | Save draft keeps a **new numbered version** per country — Draft 1, Draft 2… — never overwriting the last. Each covers every step up to the one it was saved from. A **Drafts** item in the sidebar lists them by country, newest first; each opens the step it was saved from. On step 1, Save draft waits until a country is picked | User request (2026-10-30): "save draft should make drafts of all steps done til that page… different versions… a separate option in the side bar" |
| A26 | Adding a column to a tax-rule sheet (Tax Rules Generation) alerts the developer, because Comply's database needs the column too. The dialog says so before the column is added and the toast confirms it. The alert goes **both ways**: an email to the development inbox, and a row in a **Developer alerts** list in the sidebar (with a count of open ones) until a developer marks the column added. Each carries country, sheet, column, letter, default value, who and when. **No email is delivered yet**: there is no mail service, so the email is composed and recorded, and "Open email" opens it in the person's own mail app. `comply-dev@fintua.com` is a stand-in inbox | User request (2026-10-30): "both of these options, it should do both". Step four's field-map columns raise no alert — not asked for |
| A27 | In Query Builder, a box with no query — not generated, or generated to nothing — must say **in plain English** what it should calculate. The SQL cell asks for it, and Send for approval stays disabled, with a count in the footer, until every box has a query or a description. A box calculated in the field map is exempt: its calculation is its query (designer, 2026-10-30). This replaces "send needs at least one query" | User request (2026-10-30): "we want the user to at must add data like in simple english, it shouldn't let the user go to other step otherwise" |
| A28 | **is_calculated decides two things.** In Form Annotations & Box Mapping, the **List boxes** and **Dropdown fields** tabs show only while a box of that return type has is_calculated ticked. **Query Builder (step 6)** exists only while some box of any of the country's return types is calculated; otherwise the flow ends at Tax Rules Generation, which sends for approval as the last step and lands on the approval screen, and only steps 2, 4 and 5 need approval. Step 4 records the answer as boxes are ticked (`src/lib/query-step.ts`); until then the fixtures decide (Belgium has calculated boxes, so it keeps all six steps). Query Builder's address hands on to step 5 when the step is gone | User requests (2026-10-30): "the 6th step of query builder should appear when … is_calculated of any field is true" (whole step, confirmed) and "If is_calculated is true, only then show the list boxes and dropdown fields option" |
| A29 | A box with is_calculated ticked **owes its calculation** (column J). Until it is written, column J shows an Add calculation button that opens the row on that field. Send for approval on Form Annotations & Box Mapping stops at a pop-up naming every such box, in any return type, with a button to go to the first; the step moves on only once each is written or unticked | User request (2026-10-30): "it should not let the user go before he fills it, either he has to uncheck the box or fill the field, a pop up telling him this" |
| A30 | Query Builder lists **only boxes with is_calculated ticked**; boxes filled from the tax rules no longer appear there, so their rule lines (Sale · Export · Goods…) are gone from step 6. A calculated box's rule is its calculation; one whose calculation is not written yet shows **NULL** | User request (2026-10-30): "the calculation rules column should stay Null for the ones like these, and for those whose is_calculated is off, those rows shouldn't be here" |

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
- **Draft contents are not restored.** Save draft records a version (A25) in this browser's localStorage, but the steps' own state is not snapshotted, so opening a draft shows the step as its fixtures load it.

## Superseded

- An early note said the prototype's OKLCH token set and Inter would be
  "extracted verbatim" into `design.md` so the dev team's visual work carried
  forward. **This was overturned by the user**, who asked that none of the
  Lovable design be copied. The token set was deleted and rebuilt from scratch
  around a blue-violet brand at hue 272, with Mona Sans. See `design.md` §1.
