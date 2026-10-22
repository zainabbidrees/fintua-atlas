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

/* ── Step 2: Returns ─────────────────────────────────────────────────────
 *
 * Where the agent's research meets the specialist's judgement. Each extracted
 * value carries the passage it came from, so review is "confirm or correct"
 * rather than "go and read the source" — the one pattern every document-AI
 * product converges on, and the thing the dev prototype lacked entirely.
 */

/** Where a value was found, including the passage itself. */
export interface Evidence {
  sourceTitle: string;
  publisher: string;
  url: string;
  /** Section, article or page, when the agent could pin one down. */
  locator?: string;
  /** The actual wording. Shown verbatim so nobody has to take it on trust. */
  quote: string;
}

export type FindingState =
  /** Two or more sources agree. Pre-accepted, still inspectable. */
  | "corroborated"
  /** Thin or conflicting evidence. Blocks the step until a human rules. */
  | "needs_review"
  /** A human has explicitly accepted it. */
  | "confirmed"
  /** A human changed the value; the agent's original is retained. */
  | "edited";

export type FindingGroup = "filing" | "rates" | "rules";

export const FINDING_GROUP_LABEL: Record<FindingGroup, string> = {
  filing: "Filing & deadlines",
  rates: "Rates",
  rules: "Treatment & rules",
};

export interface Finding {
  id: string;
  group: FindingGroup;
  /** e.g. "Filing frequency". */
  label: string;
  value: string;
  /** Qualification that would otherwise be lost, e.g. a turnover threshold. */
  detail?: string;
  evidence: Evidence;
  state: FindingState;
  /** Present when state is "needs_review": what the agent is unsure about. */
  concern?: string;
  /** The agent's value before a human changed it. */
  originalValue?: string;
  /** Why the human changed it. Required on edit. */
  editReason?: string;
}

/** An obligation carried forward from scope, now being researched in detail. */
export interface ObligationRun {
  id: string;
  name: string;
  localName: string | null;
  /** Agents run per obligation and in parallel, so each has its own state. */
  agent: "running" | "ready" | "confirmed";
  /** 0–100, meaningful only while running. */
  progress: number;
  findings: Finding[];
}

/* ── Step 3: Rules & rates ───────────────────────────────────────────────
 *
 * The datasets Comply consumes. Unlike step 2 this genuinely is tabular —
 * rules are rows with consistent columns and experts read down them — so it
 * stays a table rather than being forced into prose.
 *
 * The risk here is different too. A wrong rate is visible; a wrong box mapping
 * produces a return that looks correct and is not. So coverage gaps matter
 * more than a tidy row count.
 */

export type DatasetId = "rates" | "sales" | "purchases" | "vies";

export const DATASET_LABEL: Record<DatasetId, string> = {
  rates: "Rates",
  sales: "Sale rules",
  purchases: "Purchase rules",
  vies: "VIES mapping",
};

/** One editable cell's worth of state. */
export interface Cell {
  value: string;
  /** The agent's value, kept once a human changes it. */
  original?: string;
}

export interface RuleRow {
  id: string;
  cells: Record<string, Cell>;
  /** Set when the row needs a human decision before it can ship. */
  issue?: string;
}

export interface RuleColumn {
  key: string;
  label: string;
  /** Codes and percentages align and compare better in mono. */
  mono?: boolean;
  editable?: boolean;
  /** Tailwind width class for the column. */
  width?: string;
}

export interface Dataset {
  id: DatasetId;
  columns: RuleColumn[];
  rows: RuleRow[];
  /**
   * Transaction types Comply knows about that no rule covers. The quiet
   * failure mode of this step, and the reason it isn't just a grid.
   */
  uncovered: string[];
}

/* ── Step 4: Build ───────────────────────────────────────────────────────
 *
 * Owned by a Fintua developer, not the tax specialist — the only step in the
 * wizard with a different audience.
 *
 * The SQL is generated from datasets already approved in step 3, so a human
 * reading it line by line is quality assurance rather than design. What
 * actually gives confidence is the lint, the dry run and the reference checks,
 * so those lead and the SQL is available rather than forced.
 */

export type CheckState = "pass" | "warn" | "fail";

export interface Check {
  label: string;
  state: CheckState;
  /** What the check found, in words. */
  detail: string;
}

export type ArtifactGroup = "schema" | "boxes" | "calculations";

export const ARTIFACT_GROUP_LABEL: Record<ArtifactGroup, string> = {
  schema: "Country & returns",
  boxes: "Return boxes",
  calculations: "Calculated boxes",
};

export interface BuildArtifact {
  id: string;
  group: ArtifactGroup;
  fileName: string;
  /** Plain-English summary, so the step is legible without reading SQL. */
  summary: string;
  sql: string;
  checks: Check[];
}

export type BuildPhase = "ready" | "applying" | "applied" | "failed";

/* ── Step 5: Approval ────────────────────────────────────────────────────
 *
 * The production gate. Two levels, a comment required on every decision, and
 * nothing reaches Comply until both are in.
 *
 * This is where the rationales captured in every earlier step pay off. An
 * approver signing their name needs to see not just what the agent found, but
 * what a human overruled and why — otherwise the sign-off is a formality.
 */

export type DecisionKind = "removed" | "corrected" | "resolved" | "dismissed";

export const DECISION_KIND_LABEL: Record<DecisionKind, string> = {
  removed: "Removed",
  corrected: "Corrected",
  resolved: "Resolved",
  dismissed: "Marked not applicable",
};

/** A human overrule, with the reasoning that justified it. */
export interface DecisionRecord {
  id: string;
  kind: DecisionKind;
  subject: string;
  /** Which step it was made in, so an approver can go back to it. */
  step: string;
  reason: string;
  by: string;
  at: string;
}

export interface ReadinessCheck {
  label: string;
  detail: string;
  passed: boolean;
}

export type ApprovalStatus2 = "pending" | "approved" | "rejected";

export interface ApprovalRecord {
  level: 1 | 2;
  label: string;
  /** Who is entitled to decide it. */
  group: string;
  status: ApprovalStatus2;
  decidedBy?: string;
  decidedAt?: string;
  comment?: string;
}

export type PublishPhase = "awaiting" | "ready" | "publishing" | "published";
