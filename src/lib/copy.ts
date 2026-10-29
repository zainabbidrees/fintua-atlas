/**
 * Every word the user reads, in one file.
 *
 * Register: the language a practising indirect-tax specialist uses in their own
 * working notes. Precise where the profession is precise — obligation,
 * rationale, intra-Community, taxable person, secondary source —
 * and plain everywhere else. Two failure modes to avoid: implementation
 * vocabulary that leaked out of the codebase ("Deep Search", "T1/T2/T3"), and
 * consumer-app chattiness that reads as beneath the reader ("Know something we
 * missed?", "look solid").
 *
 * The step names are the exception: they match the prototype verbatim, so the
 * team reads one set of names across both. Tax Form Retrieval is the one step
 * the prototype does not have.
 */

import type { DocumentKind, SourceKind } from "./types";

export const copy = {
  page: {
    title: "Onboard country",
    specsTitle: "Form Annotations & Box Mapping",
    step: "Step 1 of 6 · Select Country",
    stepsLabel: [
      "Select Country",
      "Return Types",
      "Tax Form Retrieval",
      "Form Annotations & Box Mapping",
      "Tax Rules Generation",
      "Query Builder",
    ],
    saveDraft: "Save draft",
    discard: "Discard",
    back: "Back",
    continue: "Continue",
    saveChanges: "Save changes",
    savedToast: "Changes saved",
    /* Asked before Continue moves on to the next step. */
    confirmContinue: "Are you sure you want to confirm this?",
    confirmBack: "Back",
    confirm: "Confirm",
    blockedNeedsCheck: "{count} return type requires review",
    blockedNeedsCheckPlural: "{count} return types require review",
    blockedNoFilings: "At least one return type must be confirmed",
    done: "Selection complete",
    doneBody:
      "{count} return types confirmed for {country}, each with supporting evidence. Each is now worked through individually.",
    doneNext: "Continue to Return Types",
    doneReview: "Return to selection",
  },

  /* The end of step four. The mapping is what the SQL is generated from, so
     handing it on is a deliberate act: the footer asks to Confirm rather than
     Continue, and confirms once more before moving on. */
  confirmMapping: {
    action: "Confirm",
    title: "Are you sure you want to confirm this?",
    cancel: "Back",
    proceed: "Confirm",
    /** Added to the dialog when edits are still unsaved — Proceed saves them. */
    unsaved: "Unsaved changes to {count} rows will be saved.",
    unsavedOne: "Unsaved changes to 1 row will be saved.",
  },

  /* Discarding a draft abandons the expert's own unsaved work on this step, so
     it asks to confirm — but not for a reason. The reason trail is for
     overruling the agent's findings; throwing away a draft you are still
     building is not that. */
  discardDraft: {
    title: "Discard this draft?",
    hint: "The country and anything added on this step are cleared. The draft is not saved.",
    confirm: "Discard draft",
    cancel: "Keep working",
  },

  country: {
    /** Beside a country in the picker that is already published. */
    taken: "Published",
    /** "Country" throughout, matching the step's own name and the portal it
        is reached from. The list does carry territories and protocols with
        their own VAT regime — Northern Ireland, Monaco — which "jurisdiction"
        covered more exactly, at the cost of being the one word on the step
        that nothing else in the product used. */
    label: "Country",
    placeholder: "Search countries…",
    empty: "Select a country to begin research.",
    changeWarningTitle: "Change country?",
    changeWarningBody:
      "Research for {current} will be discarded and restarted for {next}.",
    changeConfirm: "Change country",
    changeCancel: "Keep {current}",
  },

  research: {
    runningTitle: "Researching {country}'s return types",
    runningHint: "Findings populate as they are retrieved. You can continue working.",
    trailLabel: "Sources consulted",
    activity: "Activity",
    /** Shown once a country is chosen: the two ways to begin, neither of which
        runs until the expert picks it. */
    chooseHint:
      "Search public sources for {country}'s return types, or add the source URLs to research against.",
    runAction: "Search",
  },

  filings: {
    heading: "{count} return types identified",
    /** "Cross-checked": the agent found the same value in more than one
        source. Plain label for the evidential standard "corroborated". */
    summaryAllClear: "All {count} cross-checked",
    summaryMixed: "{solid} cross-checked · {checks} requires review",
    summaryMixedPlural: "{solid} cross-checked · {checks} require review",
    localNameMissing: "—",
    /** Column headers for the return-types table. */
    columns: {
      returnType: "Return type",
      rationale: "Rationale",
      source: "Source",
      actions: "Actions",
    },
    whyLabel: "Rationale",
    foundOnLabel: "Source",
    needsCheck: "Requires review",
    keep: "Confirm",
    remove: "Delete",
    searchMore: "Missing a return type?",
    searchMorePlaceholder: "Search by name, e.g. OSS",
    searchMoreAction: "Search",
    /** The two routes on the bar under the listing: add the typed name straight
        to the list, or run the public-sources search for it again. */
    addAction: "Add",
    searchAgainAction: "Search again",
    notFound: 'No return type matching "{term}" was found for {country}.',
    alreadyInScope: "{name} is already in scope.",
    /** A return type the expert typed in by hand: no source yet, so it carries a
        plain rationale, lands flagged for review, and shows "Added manually"
        where a found one shows its source. */
    manualRationale: "Added manually; applies per the reviewer's judgement.",
    manualUncertainty:
      "Added manually — not yet verified against a public source.",
    manualSourceLabel: "Added manually",
    noneFound:
      "No return types were identified for {country}. Retry the research, or supply the material yourself below.",
    failed:
      "Research for {country} could not be completed. Retry, or supply the material yourself below.",
    retry: "Retry research",
    /** Shown before a country is chosen, so the expert can see what this
        step will produce before committing to one. */
    includeLabel: "Carry {name} into the next step",
    /** Appears once one return type is ticked, to tick the rest at once. */
    selectedCount: "{count} selected",
    selectAll: "Select all",
    pendingHeading: "Return types",
    pendingHint:
      "Each return type identified for the country appears here, with the source it was drawn from.",
  },

  /* A needs-review finding (step two) tints its row amber; clicking the row
     opens this modal: the agent's concern in full, and the decision on it.
     Confirm accepts the value as it stands; Delete drops the finding from the
     return; Move forward leaves it flagged to come back to. */
  review: {
    confirm: "Confirm",
    delete: "Delete",
    /* A pinned shortcut to the flagged rows so the expert never scrolls a long
       return hunting for the two that need them. Carries the count, so the pill
       says how many are left as well as being the way down to them. */
    jump: "{count} to be reviewed",
  },

  /* Step 2 as a table: one row per return type, each column a thing the expert
     checks against it. Rates and treatment rules were dropped — the step now
     carries only what the next steps consume: how often it is filed, when, the
     sources behind those answers, and the expert's own attachments. */
  returnsTable: {
    selectLabel: "Select {name}",
    columns: {
      returnType: "Return type",
      frequency: "Filing frequency",
      deadline: "Filing deadline",
      sources: "Sources",
      attach: "Attachments",
      status: "Status",
    },
    /** Shown where the agent established no value for a column. */
    none: "—",
    crossChecked: "Cross-checked",
    needsReview: "Requires review",
    confirmed: "Confirmed",
    confirm: "Confirm",
    undo: "Undo",
    researching: "Researching…",
    /** The pen beside a frequency or deadline value, and the form it opens. The
        agent's original value is always kept alongside the correction. */
    edit: "Edit {label}",
    editValueLabel: "Corrected value",
    editReasonLabel: "Rationale",
    editReasonOptional: "(optional)",
    editReasonPlaceholder: "Retained with the record for audit purposes",
    editSave: "Update",
    editCancel: "Cancel",
    /** The exact date a deadline rule like "EOP + 20 days" falls on next. */
    nextDue: "Next due {date}",
    /** Hover text spelling out a deadline rule. */
    deadlineRuleTitle: "End of the return period, plus {days} days",
    agentProposed: "Agent proposed “{value}”.",
    corrected: "Corrected: {reason}",
    /** The per-row attach control and its popover. */
    attachAction: "Attach",
    attachHint: "Add a file or paste a link for this return type.",
    attachChoose: "Attach a file",
    attachLinkPlaceholder: "Paste a link…",
    attachLinkInvalid: "Not a valid web address.",
    attachNone: "None yet",
    fileKind: "File",
    linkKind: "Link",
    removeAttachment: "Remove {label}",
    /** Footer gate and the confirm toast. */
    cleared: "{cleared} of {total} return types cleared",
    confirmedToast: "{name} confirmed",
    confirmAll: "Confirm all",
    confirmSelected: "Confirm selected",
    confirmedAllToast: "{count} return types confirmed",
    /** Empty state: nothing was carried in from step one. */
    empty: "No return types were carried into this step.",
    emptyHint: "Go back to Select Country to choose the return types to configure.",
  },

  /* Step 3, Tax Form Retrieval: the official form behind each return type,
     page by page. The checkbox decides what carries into the specs, as it does
     everywhere else — an unticked page is kept, just not carried forward. */
  taxForms: {
    backLink: "Return Types",
    title: "Tax return forms",
    intro:
      "The official form for each return type, retrieved from its publisher. Untick any page that should not carry into the specs — explanatory notes usually don't.",
    summary: "{selected} of {pages} pages selected",

    /* The section header for one return type's form. */
    pagesSelected: "{selected} of {total} pages selected",
    selectAllPages: "Select all pages",
    clearPages: "Clear selection",
    selectForm: "Select every page of {name}",
    edition: "Edition {edition}",
    retrieved: "Retrieved {date}",
    openSource: "Open source",
    pageCount: "{count} pages",
    noPages: "No pages selected",
    retrievingBadge: "Retrieving…",
    withoutFormBadge: "Without a form",

    /* A page thumbnail, and what each kind of page is called. */
    pageLabel: "Page {n}",
    selectPage: "Carry page {n} of {name} forward",
    openPage: "Open page {n} of {name}",
    excluded: "Not carried forward",
    kind: {
      form: "Form",
      continuation: "Continuation",
      instructions: "Notes",
    },

    /* The page viewer. */
    viewerOf: "Page {n} of {total}",
    viewerPrev: "Previous page",
    viewerNext: "Next page",
    viewerClose: "Close",
    viewerCarry: "Carry this page forward",
    viewerWhy: "Agent's note",
    viewerKeys: "Use ← and → to move between pages.",
    viewerNotChosen: "Choose this edition to select its pages.",

    /* Working: still being retrieved. */
    retrieving: "Retrieving the form",
    trailLabel: "Activity",

    /* Clash: the agent found two editions that differ. */
    clashTitle: "Two editions found",
    clashHint:
      "The publisher's portal and its own guide carry different editions of this form. Choose the one to use and record why.",
    useEdition: "Use this edition",
    clashReasonTitle: "Use the {edition} edition",
    clashReasonHint:
      "The other edition is set aside, not deleted. Your reason is kept with the record for audit purposes.",
    clashReasonPlaceholder: "e.g. the 2026 edition adds code T, which the 2020 one predates",
    clashConfirm: "Use this edition",
    clashCancel: "Cancel",
    chosen: "Chosen over the {other} edition: {reason}",
    changeChoice: "Change",

    /* Nothing found. */
    noneTitle: "No form found",
    retry: "Retry retrieval",
    attach: "Attach the form",
    attachHint: "PDF only, up to 20 MB.",
    attached: "Uploaded by you",
    attachedPages: "Carried forward whole; pages are read once the file is processed.",
    fileSize: "{size} MB",
    removeAttached: "Remove",
    wrongType: "{name} is not a PDF.",
    tooLarge: "{name} exceeds the 20 MB limit.",
    withoutForm: "Continue without a form",
    withoutFormTitle: "Continue {name} without a form",
    withoutFormHint:
      "The specs step will have no form to map for this return type. Your reason is kept with the record for audit purposes.",
    withoutFormPlaceholder: "e.g. no form is published yet; the return is configured from the schema later",
    withoutFormConfirm: "Continue without a form",
    withoutFormCancel: "Cancel",
    withoutFormDone: "Continuing without a form: {reason}",
    undo: "Undo",

    /* Export. */
    export: "Export PDF",
    exportAll: "All selected pages",
    exportForm: "{name}",
    exportCount: "{count} pages",
    exportNone: "No pages selected",
    exportFileName: "{country} — tax return forms",

    /* The footer gate. */
    ready: "{ready} of {total} return types ready",
    blockedNoPages: "{name} has no pages selected",

    empty: "No return types were carried into this step.",
    emptyHint: "Go back to Return Types to confirm the return types to configure.",
  },

  /* Step 5, Tax Rules Generation: the agent turns the confirmed box mapping
     into the rates, sales and purchase rules Comply files with. It works in
     the open for a few seconds, then the rules land as three sheets — the
     column headers are the source workbook's own, fixture data in
     src/lib/mock/tax-rules.ts. */
  taxRules: {
    backLink: "Form Annotations & Box Mapping",
    title: "Tax Rules Generation",
    intro:
      "Rates, and the rules that route each sales and purchase transaction to a return box, generated from the mapping you confirmed.",
    summary: "{rates} rates · {sales} sales rules · {purchases} purchase rules",

    generatingTitle: "Generating tax rules",
    generatingHint: "This takes a few seconds.",
    trailLabel: "Activity",
    trail: [
      "Reading the box mapping confirmed at step four",
      "Matching VAT rates to the return's boxes",
      "Generating sales rules for each transaction type",
      "Generating purchase rules and their deductibility",
      "Checking every rule lands on a return box",
    ],

    tabs: {
      rates: "Rates",
      sales: "Sales",
      purchases: "Purchases",
    },
    /** The sheets are long, so each tab shows its first few rules as a
        sample and says how many there are in all. */
    hints: {
      rates: "{count} rates, columns A to {last}.",
      sales: "Showing {shown} of {count} sales rules, columns A to {last}.",
      purchases: "Showing {shown} of {count} purchase rules, columns A to {last}.",
    },
    numberColumn: "#",
    /** The per-row pen, as on the spec sheets at step four. */
    editColumn: "Edit",
    editRow: "Edit row {name}",
    doneEditing: "Done editing row {name}",
    unsavedRow: "Unsaved changes",
    save: "Save changes",
    unsavedCount: "{count} row with unsaved changes",
    unsavedCountPlural: "{count} rows with unsaved changes",
    saved: "Changes saved",
    sheetNotes: "Notes from the sheet",
    empty: "—",
  },

  /* The form-preview panel on the specs step: the official return rendered with
     the agent's extracted boxes drawn over it. Chrome only — the form's own
     German labels are fixture data in src/lib/mock/form-preview.ts. */
  formPreview: {
    showBoxes: "Show boxes",
    pageLabel: "Page {n}",
    openPage: "Open page {n}",
    pageOf: "Page {current} of {total}",
    boxCount: "{count} boxes",
    toCheck: "{count} to check",
    onThisPage: "On this page",
    toneOk: "Mapped",
    toneWarn: "Needs a look",
    toneError: "Not matched",
    noFields: "No fields mapped on this page.",
    prev: "Previous page",
    next: "Next page",
    close: "Close",
    keys: "Use ← and → to move between pages.",
  },

  /* The field map under the preview: one row per return box. Table chrome
     only — the column headers are the source sheet's own field names (A to
     AO), and they and the rows are fixture data in src/lib/mock/return-boxes.ts. */
  fieldMap: {
    /** The per-row edit control. A row is read-only until opened. */
    editColumn: "Edit",
    editRow: "Edit {name}",
    doneEditing: "Done editing {name}",
    unsavedRow: "Unsaved changes",
    /** The footer's save, beside Confirm. */
    save: "Save changes",
    unsavedCount: "{count} row with unsaved changes",
    unsavedCountPlural: "{count} rows with unsaved changes",
    saved: "Changes saved",
    /** The four sheets of the spec workbook, one tab each. */
    tabs: {
      boxes: "Field map",
      lists: "List boxes",
      mandatory: "Mandatory fields",
      dropdowns: "Dropdown fields",
    },
    hints: {
      boxes: "{count} return boxes, columns B to AO — the mapping the SQL spec is built from.",
      lists: "{count} subfields across the list boxes — the columns each listed line carries.",
      mandatory: "{count} fields a TXT or XML submission cannot go without, and when.",
      dropdowns: "{count} allowed values across the fields that only accept a value from a list.",
    },
    /** Shown in a blank cell, so an empty value reads as intended. */
    empty: "—",
  },

  /* Step six. One row per box annotated at step four: the rule that fills it,
     read from the step-five tax rules, and the SQL that computes it. The SQL
     column starts empty; ticked rows are generated, and any query can be
     written or corrected by hand. */
  queryBuilder: {
    backLink: "Tax Rules Generation",
    heading: "Queries for {count} boxes",
    intro:
      "Each box's calculation rule comes from the box annotations and tax rules. Tick the boxes to generate their SQL, then edit any query by hand.",
    columns: {
      box: "Box number",
      rule: "Calculation rules",
      sql: "SQL query",
      edit: "Edit",
    },
    selectAll: "Select all",
    deselectAll: "Deselect all",
    selectBox: "Select {box}",
    selectedCount: "{count} selected",
    generate: "Generate query",
    generatePlural: "Generate queries",
    generating: "Generating query for {box}",
    generatedToast: "Query generated for {box}",
    generatedToastPlural: "{count} queries generated",
    undo: "Undo",
    /** The rule's opening line, by what the box adds up. */
    measure: {
      net: "Sum of the net amount on",
      vat: "Sum of the VAT amount on",
      list: "One line per dispatch, grouped by",
    },
    sale: "Sale",
    purchase: "Purchase",
    anyRate: "any rate",
    noLines: "No tax rule names this box yet.",
    notGenerated: "Not generated",
    edited: "Edited by hand",
    editQuery: "Edit query for {box}",
    sqlLabel: "SQL query for {box}",
    sqlPlaceholder: "Write the query, or close this and generate it.",
    save: "Save query",
    cancel: "Cancel",
    saveHint: "⌘ Enter to save · Esc to cancel",
    progress: "{done} of {total} queries ready",
    saveChanges: "Save changes",
    savedToast: "Changes saved",
    publish: "Publish",
    publishBlocked: "Generate or write at least one query to publish",
    publishedToast: "Queries published for {country}",
    empty: "No boxes are annotated yet",
    emptyBody: "Boxes come from the annotations in step four. Map them there and they appear here with their calculation rules.",
    emptyAction: "Go to Form Annotations & Box Mapping",
  },

  /* Step five. Two people sign for the release, then it publishes. The left of
     the page is the case for signing — what ships, whether it is ready, what a
     human overruled and why; the right is the sign-off itself. */
  approval: {
    backLink: "Tax Rules Generation",
    title: "Review and publish",
    introNew:
      "{country} has not been published before, so everything in {version} is new. Two approvals are needed before it reaches clients.",
    introReplaces:
      "{version} replaces {previous} in Comply. Two approvals are needed before it reaches clients.",

    releaseLabel: "Release",
    firstVersion: "First version",
    publishesToLabel: "Publishes to",
    publishesTo: "Comply · production",
    replacesLabel: "Replaces",
    replacesNothing: "Nothing — new jurisdiction",
    scope: {
      returnTypes: "Return types",
      boxes: "Return boxes",
      rules: "Mapping rules",
      rates: "Rates",
    },

    readinessHeading: "Readiness",
    readinessAll: "All {count} checks passed",
    readinessSome: "{passed} of {count} checks passed",
    readinessBlocked:
      "Approval opens once every check passes. Fix the failing check in its step.",
    openStep: "Open {step}",

    decisionsHeading: "What a human overruled",
    decisionsIntro:
      "Everything else came from the research unchanged. These {count} decisions did not, and each carries the reason given at the time.",
    decisionMeta: "{step} · {by} · {at}",

    signOffHeading: "Sign-off",
    signOffHint: "Two people, in order, before anything reaches clients.",
    separation:
      "The second approver cannot be the person who gave the first approval.",
    viewAsApprover: "View as second-level approver",
    viewingAsApprover: "Viewing as Elena Fischer · second-level approver",
    awaitingYou: "Awaiting your decision",
    awaitingGroup: "Awaiting {group}",
    lockedUntilFirst: "Opens once the first approval is in",
    blockedByReadiness: "Opens once every readiness check passes",
    approvedBy: "Approved by {name} · {at}",
    rejectedBy: "Rejected by {name} · {at}",
    approve: "Approve",
    reject: "Reject",
    publishStage: "Publish",
    publishStageGroup: "Comply · production",
    publishWaiting: "Unlocks once both approvals are in",
    publishReady: "Ready. Publish from the bar below.",
    publishInProgress: "Publishing to Comply",
    publishStopped: "Stopped by the rejection",

    rejectedTitle: "{version} was rejected and will not publish",
    rejectedBody:
      "Fix what the comment points to in the step it concerns, then ask for approval again. Both approvals start over.",
    rejectedReopen: "Reopen {step}",
    resubmit: "Ask for approval again",

    approveTitleFirst: "Approve at first level",
    approveTitleSecond: "Approve for production",
    rejectTitle: "Reject this version",
    decisionHint: "A comment is recorded against every decision, approve or reject.",
    approvePlaceholder: "e.g. rates verified against Royal Decree No 20",
    rejectPlaceholder: "e.g. box 45 mapping needs counsel sign-off first",
    cancel: "Cancel",

    publishTitle: "Publish to production",
    publishHint:
      "{country} becomes fileable for every Comply client registered there. Record what this release covers.",
    publishPlaceholder: "e.g. initial Belgian onboarding, effective 1 Jan 2026",
    publishConfirm: "Publish",

    footerNeedBoth: "Both approvals are needed before publishing",
    footerRejected: "Rejected · will not publish",
    footerReady: "Both approvals in",
    publish: "Publish to Comply",
    publishing: "Publishing",

    /* The end of the run: a record of what went live, and where to go next. */
    published: {
      badge: "Live",
      backLink: "Countries",
      title: "{country} is live in Comply",
      body: "{version} was published {at}. Clients registered in {country} can file these return types from their next period.",
      recordHeading: "Release record",
      version: "Version",
      publishedAt: "Published",
      publishedBy: "Published by",
      firstApproval: "First approval",
      secondApproval: "Second approval",
      note: "Release note",
      noteEmpty: "No note recorded",
      nextHeading: "What happens next",
      next: [
        "Clients registered in {country} see these return types from their next filing period.",
        "Every decision in this run, with its reason, is in the audit log.",
        "Any later change starts as a new version and passes the same six steps and two approvals.",
      ],
      backToCountries: "Back to Countries",
      auditTrail: "View the audit trail",
      onboardAnother: "Onboard another country",
    },
  },

  sources: {
    heading: "{count} sources consulted",
    publisherLabel: "Published by",
    updatedLabel: "Last updated",
    updatedUnknown: "No publication date",
    whatsInItLabel: "Contents",
    remove: "Remove",
    inUse: "Cited by {count} return type",
    inUsePlural: "Cited by {count} return types",
  },

  documents: {
    heading: "Add supporting material",
    orDivider: "or",
    hint: "Upload a document, or provide a source URL.",
    dropAction: "Select file",
    linkPlaceholder: "https://…",
    linkInvalid: "Not a valid web address.",
    urlHeading: "Add URL",
    addAnotherUrl: "Add another URL",
    removeUrl: "Remove URL",
    researchFromUrls: "Research these sources",
    tooLarge: "{name} exceeds the 20 MB limit.",
    wrongType:
      "{name} is an unsupported format. Accepted: PDF, XML, XSD, CSV, XLS, XLSX or TXT.",
    yours: "Supporting material",
    /** Marks each attached row as the expert's own, so it is never read as
        something the agent retrieved. */
    uploadedByYou: "Uploaded by you",
    kindQuestion: "Document type",
    noteQuestion: "Note",
    notePlaceholder: "Optional — e.g. supersedes the version published online",
    save: "Add document",
    cancel: "Cancel",
    pendingHint: "Attach a document or a source URL to supplement the research.",
  },

  /** The slim upload bar that sits under a listing. */
  uploadBar: {
    label: "Add supporting material",
    attach: "Attach a file",
    linkPlaceholder: "Paste a link…",
    add: "Add",
    linkInvalid: "Not a valid web address.",
    /** The group that lists what the expert has attached, alongside the
        agent's own groups of findings. */
    groupLabel: "Uploaded by you",
    fileKind: "Uploaded file",
    linkKind: "Pasted link",
  },

  duplicate: {
    title: "Duplicate source",
    body: "{name} corresponds to a document already retrieved from {publisher}.",
    yoursNewer: "Yours is dated {yours}. The retrieved copy is dated {ours}.",
    useYours: "Use the uploaded version",
    keepBoth: "Retain both",
    keepOurs: "Keep the retrieved version",
  },

  clash: {
    title: "Conflicting sources",
    hint: "Select the authoritative version and record your rationale.",
    reasonLabel: "Rationale",
    reasonPlaceholder: "Brief justification",
    confirm: "Record decision",
  },

  removeReason: {
    title: "Reason for removal",
    hint: "Retained with the country record for audit purposes.",
    placeholder: "e.g. superseded by the 2026 circular",
    confirm: "Remove",
    cancel: "Cancel",
  },

  /** Step 4 — SQL Review. The cross-field validation of the calculated boxes:
      a linted file proves syntax, not that the sum is right. Each identity is
      reconciled against a real period, and anything that does not reconcile —
      or leans on a box the schema never defined — is held for a decision. */
  validation: {
    title: "Cross-field validation",
    purpose:
      "Each calculated box is reconciled against {period}, not just linted. A box that does not add up — or an identity that references a field the schema never defined — is held here for a decision rather than applied in silence.",
    identityLabel: "Identity",
    expectedLabel: "Expected",
    actualLabel: "Computed",
    reconciles: "Reconciles",
    mismatch: "Does not reconcile",
    schema: "Schema mismatch",
    noValue: "Cannot be computed",
    accept: "Accept anyway",
    reasonLabel: "Why this is acceptable",
    reasonPlaceholder: "e.g. box 62 is filed manually this period, pending the 2026 schema update",
    confirm: "Record decision",
    cancel: "Cancel",
    accepted: "Accepted · {reason}",
    undo: "Undo",
    allClear: "All {count} calculated boxes reconcile",
    blocked: "{count} calculated box needs a decision before this can be applied",
    blockedPlural: "{count} calculated boxes need a decision before this can be applied",
  },

  /* Step 4, SQL Review: the linter's findings and the dry run's evidence —
     shown, not asserted, so a developer reviews the actual SQL and what it
     would do before any of it reaches the test database. */
  build: {
    /* The severity tally chips — singular/plural kept as separate keys, as the
       rest of this file does. */
    countPassed: "{count} passed",
    countWarning: "{count} warning",
    countWarningPlural: "{count} warnings",
    countBlocker: "{count} blocker",
    countBlockerPlural: "{count} blockers",
    /* The tally chips are also the way to each finding: a click opens the file
       and lands on the next one; the finding then offers the one after it. */
    jumpToWarning: "Go to the next warning",
    jumpToBlocker: "Go to the next blocker",
    nextWarning: "Next warning",
    nextBlocker: "Next blocker",
    findingPosition: "{n} of {total}",
    lineLabel: "Line {line}",
    autoFix: "Auto-fix",
    autoFixed: "Fixed",
    viewPolicy: "View policy",
    policyClose: "Close",

    /* The dry-run output pane. */
    outputTitle: "Dry-run output",
    outputPurpose:
      "What the rolled-back run would have written, how the database would run it, and what it would cost. Nothing here touched a real table.",
    tabResult: "Result preview",
    tabPlan: "Query plan",
    tabPerformance: "Performance",
    resultFor: "Writing to {file}",
    rowsAffected: "{count} rows across the plan",
    statementsRun: "{count} statements",
    scanIndex: "Index scan",
    scanSequential: "Sequential scan",
    scanWrite: "Write",
    scanFlag: "Reads the whole table — no index covers this filter yet.",
  },

  /** The per-row actions on the Countries index, and their two dialogs. */
  countries: {
    rowActions: "Actions for {country}",
    open: "View",
    edit: "Edit",
    duplicate: "Duplicate",
    remove: "Delete",

    /* Toasts after an action. Short — they confirm, they don't explain. */
    edited: "{country} updated",
    duplicated: "{country} started",
    removed: "{country} removed",
    removedReason: "Reason: {reason}",

    /* A duplicate is named for its source and shows where it came from. */
    duplicateSuffix: " (copy)",
    duplicatedFrom: "Duplicated from {source}",

    /* The edit dialog. */
    editTitle: "Edit {country}",
    editHint:
      "What the index shows for this country. The work inside each stage is edited there, not here.",
    nameLabel: "Name",
    statusLabel: "Status",
    stageLabel: "Stage",
    ownerLabel: "Owner",
    ownerPlaceholder: "Full name",
    obligationsLabel: "Obligations",
    confirmedLabel: "Confirmed",
    foundLabel: "Found",
    save: "Save changes",
    cancel: "Cancel",

    /* The remove dialog reuses the reason pattern — removal keeps its why. */
    removeTitle: "Remove {country}?",
    removeHint:
      "The onboarding is removed from the index. The reason is kept with the country record for audit purposes.",
    removePlaceholder: "e.g. onboarding opened in error, duplicate of an existing record",
    removeConfirm: "Remove",
    removeCancel: "Keep {country}",

    /* A country published from the Query Builder. */
    publishedActivity: "Published from the Query Builder",
  },
} as const;

/** The spec's own tiers, written out. Nobody says "that's a T2". */
export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  authority: "Tax authority",
  guidance: "Official guidance",
  other: "Secondary source",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  blank_form: "Blank return form",
  completed_example: "Completed return (example)",
  official_guidance: "Official guidance",
  schema: "Schema or technical specification",
  advisor_notes: "Advisor correspondence",
};

/** Fills {placeholders} in the strings above. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
