/**
 * Every word the user reads, in one file.
 *
 * Two reasons it lives here rather than inside components:
 *  1. The tax experts can correct the terminology without touching code.
 *  2. The whole vocabulary is reviewable in one sitting.
 *
 * The rule we're applying: keep the words tax people actually say out loud
 * ("Return", "Boxes", "Local name"), drop the ones that only exist because a
 * programmer needed a name ("Initiation", "Discovery", "Deep Search",
 * "T1/T2/T3", "AI Reason").
 */

import type { DocumentKind, SourceKind } from "./types";

export const copy = {
  page: {
    title: "Onboard country",
    step: "Step 1 of 5 · Set up",
    stepsLabel: ["Set up", "Filings", "Rules", "Build", "Approval"],
    done: "Set up complete",
    doneBody:
      "{count} filings confirmed for {country}, each with its source. Next we work through them one at a time.",
    doneNext: "Go to Filings",
    doneReview: "Review set up again",
    saveDraft: "Save draft",
    back: "Back",
    continue: "Continue",
    /** Shown next to Continue, saying what is actually blocking it. */
    blockedNeedsCheck: "{count} filing still needs your check",
    blockedNeedsCheckPlural: "{count} filings still need your check",
    blockedNoFilings: "Keep at least one filing to continue",
  },

  country: {
    label: "Which country?",
    placeholder: "Search for a country…",
    /** Replaces "Select a country to discover sources." */
    empty: "Pick a country and we'll start looking.",
    changeWarningTitle: "Start again with a different country?",
    changeWarningBody:
      "We'll clear what we found for {current} and look up {next} instead.",
    changeConfirm: "Yes, switch",
    changeCancel: "Keep {current}",
  },

  research: {
    /** Replaces "AI is discovering sources and return types…" */
    runningTitle: "Looking up {country}'s tax filings",
    runningHint: "You can keep working — we'll fill this in as we go.",
    trailLabel: "What we're reading",
    /** Replaces "Deep Search" / "Agent log" / "Live log". */
    activity: "Activity",
  },

  filings: {
    /** Replaces "Return Types (4 selected)". The count that matters is the work. */
    heading: "{country} — {count} filings found",
    summaryAllClear: "All {count} look solid",
    summaryMixed: "{solid} look solid · {checks} needs your check",
    summaryMixedPlural: "{solid} look solid · {checks} need your check",
    localNameMissing: "—",
    /** Replaces "Rationale". */
    whyLabel: "Why",
    /** The proof, shown with the answer rather than on another screen. */
    foundOnLabel: "Found on",
    needsCheck: "Needs your check",
    keep: "Keep",
    remove: "Remove",
    searchMore: "Something missing?",
    searchMorePlaceholder: "Search for a filing…",
    searchMoreAction: "Search",
    noneFound:
      "We couldn't find any filings for {country}. You can try again, or add what you know below.",
    failed:
      "Something went wrong while looking up {country}. You can try again, or add what you know below.",
    retry: "Try again",
  },

  sources: {
    /** Collapsed by default — supporting evidence, not a second checklist. */
    heading: "We read from {count} places",
    publisherLabel: "Published by",
    updatedLabel: "Last updated",
    updatedUnknown: "No date given",
    /** Replaces the "AI Reason" column header. */
    whatsInItLabel: "What's in it",
    remove: "Remove",
    /** Shown when a source still backs a filing the expert kept. */
    inUse: "Used by {count} filing",
    inUsePlural: "Used by {count} filings",
  },

  documents: {
    heading: "Know something we missed?",
    hint: "Drop a file, or paste a link.",
    dropAction: "Choose a file",
    linkPlaceholder: "https://…",
    linkInvalid: "That doesn't look like a web address.",
    tooLarge: "{name} is over 20 MB.",
    wrongType: "We can't read {name}. Try a PDF, spreadsheet, XML or text file.",
    yours: "Your documents",
    /** Asked once, when a file lands. */
    kindQuestion: "What is this?",
    noteQuestion: "Anything we should know?",
    notePlaceholder: "Optional — e.g. this is the 2026 version",
    save: "Add it",
    cancel: "Cancel",
  },

  duplicate: {
    title: "We already have this one",
    body: "{name} matches a document we found on {publisher}.",
    yoursNewer: "Yours is from {yours}. Ours is from {ours}.",
    useYours: "Use mine instead",
    keepBoth: "Keep both",
    keepOurs: "Keep theirs",
  },

  clash: {
    title: "Two sources don't agree",
    /** Never resolved automatically — a disagreement is the point. */
    hint: "Pick the one that's right, and say why.",
    reasonLabel: "Why this one?",
    reasonPlaceholder: "One line is enough",
    confirm: "Save decision",
  },

  removeReason: {
    /** The "why" box. This is the expertise worth keeping, and the audit defence. */
    title: "Why are you removing this?",
    hint: "One line. It's kept with the country record.",
    placeholder: "e.g. superseded by the 2026 circular",
    confirm: "Remove",
    cancel: "Cancel",
  },
} as const;

/** Replaces "T1 / T2 / T3" — nobody says "that's a T2 source". */
export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  authority: "Tax authority",
  guidance: "Official guidance",
  other: "Other source",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  blank_form: "Blank form",
  completed_example: "Completed example return",
  official_guidance: "Official guidance",
  schema: "Schema or technical spec",
  advisor_notes: "Advisor notes",
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
