/**
 * Step 1 only.
 *
 * Deliberately narrow: no five-step wizard model and no role matrix. Those
 * assumptions came from the prototype and are still open — we add them when
 * we've designed the steps that need them.
 */

export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  flag: string;
}

/** What kind of thing a source is. Replaces the prototype's T1/T2/T3 codes. */
export type SourceKind = "authority" | "guidance" | "other";

export interface Source {
  id: string;
  title: string;
  url: string;
  /** Who stands behind it, e.g. "Belgian Federal Public Service Finance". */
  publisher: string;
  /**
   * When the source itself was last updated. The first thing an expert judges a
   * document on — guidance from 2019 about 2026 rules is worthless.
   */
  lastUpdated: string | null;
  kind: SourceKind;
  /** What the document contains — not why a machine picked it. */
  whatsInIt: string;
}

/**
 * How sure the agent is about a finding.
 *
 * Deliberately two values, not a percentage. A number invites the reader to
 * interpret a calibration they can't see; what the expert needs to know is only
 * whether this one is theirs to decide.
 */
export type Certainty = "confident" | "needs_check";

export interface Filing {
  id: string;
  /** e.g. "VAT Return". */
  name: string;
  /** Name in the country's own language. Null renders as an em dash. */
  localName: string | null;
  /** e.g. "Monthly or quarterly". Null when the agent couldn't establish it. */
  frequency: string | null;
  /** Why this filing applies in this country. */
  whyItApplies: string;
  /** The source this came from — the proof, shown with the answer. */
  foundOn: Source;
  certainty: Certainty;
  /** Present when certainty is "needs_check": what the agent is unsure about. */
  uncertainty?: string;
  origin: "found" | "added";
}

/** What an expert's uploaded document actually is. The agent reads each differently. */
export type DocumentKind =
  | "blank_form"
  | "completed_example"
  | "official_guidance"
  | "schema"
  | "advisor_notes";

export interface UserDocument {
  id: string;
  fileName: string;
  sizeBytes: number;
  kind: DocumentKind;
  /** Optional one-liner, e.g. "This is the 2026 version, the site's is older." */
  note?: string;
  addedAt: string;
}

/**
 * Two answers that can't both be right.
 *
 * Never auto-resolved. In tax a disagreement is the most important thing on the
 * screen, so it goes to a human with both options visible — and the reason for
 * the choice is kept.
 */
export interface Clash<T = unknown> {
  id: string;
  /** What's being disputed, e.g. "Filing deadline". */
  subject: string;
  options: ClashOption<T>[];
}

export interface ClashOption<T = unknown> {
  id: string;
  /** The competing answer, as the expert should read it. */
  label: string;
  /** Where this answer came from. */
  attribution: string;
  value: T;
}

/** A decision an expert made, with their reasoning. This is the part worth keeping. */
export interface Decision {
  id: string;
  /** What they did, e.g. "Removed source", "Chose deadline". */
  action: string;
  subject: string;
  /** Why. Required — this is the expertise and the audit defence. */
  reason: string;
  at: string;
}

/** Where the setup screen currently is. */
export type SetupPhase =
  | "empty"
  | "researching"
  | "found"
  | "nothing_found"
  | "failed";

/** One line in the live research trail. */
export interface TrailEntry {
  id: string;
  text: string;
  at: number;
}
