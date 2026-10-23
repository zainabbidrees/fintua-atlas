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

/* ── Step 3: Specs & datasets ────────────────────────────────────────────
 *
 * The datasets Comply consumes. Unlike step 2 this genuinely is tabular —
 * rules are rows with consistent columns and experts read down them — so it
 * stays a table rather than being forced into prose.
 *
 * The risk here is different too. A wrong rate is visible; a wrong box mapping
 * produces a return that looks correct and is not. So coverage gaps matter
 * more than a tidy row count.
 *
 * The six datasets are not independent, which is the whole shape of this
 * step: a rule cites a rate code and a box name, and neither exists until the
 * returns and the form have been settled. So they are worked in three ordered
 * stages rather than as six peer tabs — you cannot map to a box you have not
 * declared.
 */

export type DatasetId =
  | "returns"
  | "boxes"
  | "rates"
  | "sales"
  | "purchases"
  | "vies";

export const DATASET_LABEL: Record<DatasetId, string> = {
  returns: "Return details",
  boxes: "Form boxes",
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

/** The passage behind a row, carried through from research in step 2. */
export interface Citation {
  /** What the expert reads, e.g. "fisconetplus.be". */
  label: string;
  url: string;
  /** Section or article, when the agent could pin one down. */
  locator?: string;
}

export interface RuleRow {
  id: string;
  cells: Record<string, Cell>;
  /** Set when the row needs a human decision before it can ship. */
  issue?: string;
  /** Absent when the agent produced the row from inference rather than a text. */
  citation?: Citation;
  /** Rows a human added by hand carry no agent provenance. */
  addedByHand?: boolean;
}

/** How a cell is edited. Text unless stated. */
export type ColumnKind = "text" | "select" | "date" | "flag";

export interface RuleColumn {
  key: string;
  label: string;
  kind?: ColumnKind;
  /** The choices, for a "select" column. */
  options?: string[];
  /** Codes and percentages align and compare better in mono. */
  mono?: boolean;
  editable?: boolean;
  /** Empty blocks the stage. Marked on the header, not with an asterisk. */
  required?: boolean;
  /** Tailwind width class for the column. */
  width?: string;
}

export interface Dataset {
  id: DatasetId;
  /** One line on what the dataset is for, shown above the table. */
  purpose: string;
  columns: RuleColumn[];
  rows: RuleRow[];
  /**
   * Transaction types Comply knows about that no rule covers. The quiet
   * failure mode of this step, and the reason it isn't just a grid.
   */
  uncovered: string[];
}

/**
 * The three ordered parts of step 3.
 *
 * Named for what they establish rather than for the tables they contain, so
 * the order reads as a consequence rather than as an arbitrary sequence.
 */
export type SpecStageId = "returns" | "form" | "mapping";

export interface SpecStage {
  id: SpecStageId;
  label: string;
  /** What this part settles. */
  purpose: string;
  /** Why it has to come before the next one. */
  unlocks: string;
  datasets: DatasetId[];
}

export const SPEC_STAGES: SpecStage[] = [
  {
    id: "returns",
    label: "Returns",
    purpose: "What Comply has to file for this country, and on what cycle.",
    unlocks: "Every box on the form belongs to one of these returns.",
    datasets: ["returns"],
  },
  {
    id: "form",
    label: "Form & rates",
    purpose:
      "The vocabulary the rules are written in: each box on the return, and each rate in force.",
    unlocks: "A rule can only target a box and a rate declared here.",
    datasets: ["boxes", "rates"],
  },
  {
    id: "mapping",
    label: "Rules & mapping",
    purpose:
      "Where each transaction lands — the part that decides whether a return is right.",
    unlocks: "",
    datasets: ["sales", "purchases", "vies"],
  },
];

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
