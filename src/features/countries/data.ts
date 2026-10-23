/**
 * Placeholder country runs. Replaced by the service layer when there's a
 * backend; shaped the way the listing needs to read, not the way a table
 * happens to store it.
 */

export type RunState =
  | "draft"
  | "in_progress"
  | "awaiting_you"
  | "awaiting_approval"
  | "testing"
  | "live";

export interface CountryRun {
  code: string;
  name: string;
  /** Which of the five steps it currently sits at. */
  step: string;
  /** Wizard steps finished, out of five. */
  stepsDone: number;
  filingsConfirmed: number;
  filingsFound: number;
  /**
   * Items waiting on a person right now. The most actionable number on the
   * page, so it gets its own column and is left blank at zero — an empty cell
   * reads faster than a nought.
   */
  review: number;
  version: string;
  owner: { name: string; initials: string };
  /** What moved, not just when. "Updated 2 hours ago" tells you nothing. */
  lastActivity: { text: string; at: string };
  state: RunState;
}

export const RUNS: CountryRun[] = [
  {
    code: "DE",
    name: "Germany",
    step: "Returns",
    stepsDone: 1,
    filingsConfirmed: 1,
    filingsFound: 5,
    review: 2,
    version: "v0.1",
    owner: { name: "Annelies Vermeulen", initials: "AV" },
    lastActivity: { text: "Marco Rossi confirmed the VAT Return", at: "2 hours ago" },
    state: "in_progress",
  },
  {
    code: "IT",
    name: "Italy",
    step: "Approval",
    stepsDone: 4,
    filingsConfirmed: 4,
    filingsFound: 4,
    review: 1,
    version: "v0.1",
    owner: { name: "Marco Rossi", initials: "MR" },
    lastActivity: { text: "Priya Shah applied SQL to test", at: "Yesterday" },
    state: "awaiting_you",
  },
  {
    code: "HU",
    name: "Hungary",
    step: "Approval",
    stepsDone: 4,
    filingsConfirmed: 4,
    filingsFound: 4,
    review: 0,
    version: "v0.1",
    owner: { name: "Teodora Ilić", initials: "TI" },
    lastActivity: { text: "Marco Rossi approved at first level", at: "4 days ago" },
    state: "awaiting_approval",
  },
  {
    code: "PL",
    name: "Poland",
    step: "Build",
    stepsDone: 3,
    filingsConfirmed: 6,
    filingsFound: 6,
    review: 0,
    version: "v0.3",
    owner: { name: "Marta Kowalczyk", initials: "MK" },
    lastActivity: { text: "Priya Shah applied SQL to test", at: "11 Oct 2026" },
    state: "testing",
  },
  {
    code: "RO",
    name: "Romania",
    step: "Rules & rates",
    stepsDone: 2,
    filingsConfirmed: 3,
    filingsFound: 7,
    review: 3,
    version: "v0.1",
    owner: { name: "Søren Dahlgaard", initials: "SD" },
    lastActivity: {
      text: "Agent flagged 3 unmapped transaction types",
      at: "6 Oct 2026",
    },
    state: "in_progress",
  },
  {
    code: "AT",
    name: "Austria",
    step: "Published",
    stepsDone: 5,
    filingsConfirmed: 4,
    filingsFound: 4,
    review: 0,
    version: "v1.2",
    owner: { name: "Niamh Brennan", initials: "NB" },
    lastActivity: { text: "Niamh Brennan published v1.2", at: "12 Jun 2026" },
    state: "live",
  },
  {
    code: "AU",
    name: "Australia",
    step: "Published",
    stepsDone: 5,
    filingsConfirmed: 5,
    filingsFound: 5,
    review: 0,
    version: "v1.2",
    owner: { name: "Niamh Brennan", initials: "NB" },
    lastActivity: { text: "Niamh Brennan published v1.2", at: "2 Apr 2026" },
    state: "live",
  },
];

export const STATE_META: Record<
  RunState,
  { label: string; dot: string; text: string }
> = {
  draft: { label: "Draft", dot: "bg-text-faint", text: "text-text-faint" },
  in_progress: { label: "In progress", dot: "bg-text-faint", text: "text-text-muted" },
  awaiting_you: {
    label: "Awaiting you",
    dot: "bg-attention",
    text: "text-attention-text",
  },
  awaiting_approval: {
    label: "With approver",
    dot: "bg-text-faint",
    text: "text-text-muted",
  },
  testing: { label: "In test", dot: "bg-text-faint", text: "text-text-muted" },
  live: { label: "Live", dot: "bg-settled", text: "text-settled" },
};

/** Total obligations already live in Comply, across every published country. */
export function filingsLive(runs: CountryRun[]): number {
  return runs
    .filter((r) => r.state === "live")
    .reduce((sum, r) => sum + r.filingsConfirmed, 0);
}

export type FilterId = "all" | "active" | "needs_you" | "live";

export const FILTERS: { id: FilterId; label: string; match: (r: CountryRun) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  {
    id: "active",
    label: "In progress",
    match: (r) => ["draft", "in_progress", "testing"].includes(r.state),
  },
  { id: "needs_you", label: "Awaiting you", match: (r) => r.state === "awaiting_you" },
  { id: "live", label: "Live", match: (r) => r.state === "live" },
];
