/**
 * Every word the user reads, in one file.
 *
 * Register: the language a practising indirect-tax specialist uses in their own
 * working notes. Precise where the profession is precise — obligation,
 * rationale, corroborated, intra-Community, taxable person, secondary source —
 * and plain everywhere else. Two failure modes to avoid: implementation
 * vocabulary that leaked out of the codebase ("Deep Search", "T1/T2/T3"), and
 * consumer-app chattiness that reads as beneath the reader ("Know something we
 * missed?", "look solid").
 *
 * The five step names are the exception: they match the prototype verbatim, so
 * the team reads one set of names across both.
 */

import type { DocumentKind, SourceKind } from "./types";

export const copy = {
  page: {
    title: "Onboard country",
    step: "Step 1 of 5 · Select Country",
    stepsLabel: [
      "Select Country",
      "Return Types",
      "Specs & Datasets",
      "SQL Review",
      "Approval & Publish",
    ],
    saveDraft: "Save draft",
    back: "Back",
    continue: "Continue",
    blockedNeedsCheck: "{count} obligation requires review",
    blockedNeedsCheckPlural: "{count} obligations require review",
    blockedNoFilings: "At least one obligation must be confirmed",
    done: "Selection complete",
    doneBody:
      "{count} filing obligations confirmed for {country}, each with supporting evidence. Each is now worked through individually.",
    doneNext: "Continue to Return Types",
    doneReview: "Return to selection",
  },

  country: {
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
    runningTitle: "Researching {country}'s filing obligations",
    runningHint: "Findings populate as they are retrieved. You can continue working.",
    trailLabel: "Sources consulted",
    activity: "Activity",
  },

  filings: {
    heading: "{count} filing obligations identified",
    /** "Corroborated" is the evidential standard, not a mood. */
    summaryAllClear: "All {count} corroborated",
    summaryMixed: "{solid} corroborated · {checks} requires review",
    summaryMixedPlural: "{solid} corroborated · {checks} require review",
    localNameMissing: "—",
    whyLabel: "Rationale",
    foundOnLabel: "Source",
    needsCheck: "Requires review",
    keep: "Confirm",
    remove: "Remove",
    searchMore: "Missing an obligation?",
    searchMorePlaceholder: "Search by name, e.g. OSS",
    searchMoreAction: "Search",
    noneFound:
      "No filing obligations were identified for {country}. Retry the research, or supply the material yourself below.",
    failed:
      "Research for {country} could not be completed. Retry, or supply the material yourself below.",
    retry: "Retry research",
    /** Shown before a country is chosen, so the expert can see what this
        step will produce before committing to one. */
    includeLabel: "Carry {name} into the next step",
    pendingHeading: "Filing obligations",
    pendingHint:
      "Each obligation identified for the country appears here, with the source it was drawn from.",
  },

  sources: {
    heading: "{count} sources consulted",
    publisherLabel: "Published by",
    updatedLabel: "Last updated",
    updatedUnknown: "No publication date",
    whatsInItLabel: "Contents",
    remove: "Remove",
    inUse: "Cited by {count} obligation",
    inUsePlural: "Cited by {count} obligations",
  },

  documents: {
    heading: "Add supporting material",
    hint: "Upload a document, or provide a source URL.",
    dropAction: "Select file",
    linkPlaceholder: "https://…",
    linkInvalid: "Not a valid web address.",
    tooLarge: "{name} exceeds the 20 MB limit.",
    wrongType:
      "{name} is an unsupported format. Accepted: PDF, XML, XSD, CSV, XLS, XLSX or TXT.",
    yours: "Supporting material",
    kindQuestion: "Document type",
    noteQuestion: "Note",
    notePlaceholder: "Optional — e.g. supersedes the version published online",
    save: "Add document",
    cancel: "Cancel",
    pendingHint: "Attach a document or a source URL to supplement the research.",
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
