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
  /** Which of the six steps it currently sits at. */
  step: string;
  /** Wizard steps finished, out of six. */
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
    step: "Return Types",
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
    step: "Query Builder",
    stepsDone: 5,
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
    step: "Query Builder",
    stepsDone: 5,
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
    step: "Tax Rules Generation",
    stepsDone: 4,
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
    step: "Form Annotations & Box Mapping",
    stepsDone: 3,
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
    stepsDone: 6,
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
    stepsDone: 6,
    filingsConfirmed: 5,
    filingsFound: 5,
    review: 0,
    version: "v1.2",
    owner: { name: "Niamh Brennan", initials: "NB" },
    lastActivity: { text: "Niamh Brennan published v1.2", at: "2 Apr 2026" },
    state: "live",
  },
  {
    code: "FR",
    name: "France",
    step: "Form Annotations & Box Mapping",
    stepsDone: 3,
    filingsConfirmed: 3,
    filingsFound: 8,
    review: 1,
    version: "v0.2",
    owner: { name: "Lucas Moreau", initials: "LM" },
    lastActivity: { text: "Agent drafted 12 box mappings", at: "3 hours ago" },
    state: "in_progress",
  },
  {
    code: "ES",
    name: "Spain",
    step: "Return Types",
    stepsDone: 1,
    filingsConfirmed: 2,
    filingsFound: 6,
    review: 2,
    version: "v0.1",
    owner: { name: "Marco Rossi", initials: "MR" },
    lastActivity: { text: "Two reduced rates need your review", at: "Yesterday" },
    state: "awaiting_you",
  },
  {
    code: "NL",
    name: "Netherlands",
    step: "Tax Rules Generation",
    stepsDone: 4,
    filingsConfirmed: 5,
    filingsFound: 5,
    review: 0,
    version: "v0.4",
    owner: { name: "Priya Shah", initials: "PS" },
    lastActivity: { text: "Priya Shah applied SQL to test", at: "9 Oct 2026" },
    state: "testing",
  },
  {
    code: "PT",
    name: "Portugal",
    step: "Published",
    stepsDone: 6,
    filingsConfirmed: 6,
    filingsFound: 6,
    review: 0,
    version: "v1.0",
    owner: { name: "Niamh Brennan", initials: "NB" },
    lastActivity: { text: "Niamh Brennan published v1.0", at: "28 Mar 2026" },
    state: "live",
  },
  {
    code: "IE",
    name: "Ireland",
    step: "Return Types",
    stepsDone: 1,
    filingsConfirmed: 1,
    filingsFound: 4,
    review: 0,
    version: "v0.1",
    owner: { name: "Annelies Vermeulen", initials: "AV" },
    lastActivity: { text: "Agent retrieved 4 filing obligations", at: "5 hours ago" },
    state: "in_progress",
  },
  {
    code: "SE",
    name: "Sweden",
    step: "Query Builder",
    stepsDone: 5,
    filingsConfirmed: 5,
    filingsFound: 5,
    review: 0,
    version: "v0.9",
    owner: { name: "Ingrid Haugen", initials: "IH" },
    lastActivity: { text: "Submitted for second-level approval", at: "2 days ago" },
    state: "awaiting_approval",
  },
  {
    code: "CZ",
    name: "Czechia",
    step: "Return Types",
    stepsDone: 1,
    filingsConfirmed: 0,
    filingsFound: 3,
    review: 0,
    version: "v0.1",
    owner: { name: "Marta Kowalczyk", initials: "MK" },
    lastActivity: { text: "Draft created for Czechia", at: "Yesterday" },
    state: "draft",
  },
  {
    code: "DK",
    name: "Denmark",
    step: "Published",
    stepsDone: 6,
    filingsConfirmed: 7,
    filingsFound: 7,
    review: 0,
    version: "v1.1",
    owner: { name: "Søren Dahlgaard", initials: "SD" },
    lastActivity: { text: "Søren Dahlgaard published v1.1", at: "14 Feb 2026" },
    state: "live",
  },
  {
    code: "GR",
    name: "Greece",
    step: "Tax Rules Generation",
    stepsDone: 4,
    filingsConfirmed: 4,
    filingsFound: 9,
    review: 1,
    version: "v0.3",
    owner: { name: "Teodora Ilić", initials: "TI" },
    lastActivity: { text: "Agent flagged a conflicting deadline", at: "7 Oct 2026" },
    state: "in_progress",
  },
];

/**
 * The stages a run moves through, in order. The index + 1 is the step
 * number printed next to the stage, so this list is the single source of that
 * mapping — editing a row's stage sets both the label and the "n/6" together.
 */
export const STAGES = [
  "Return Types",
  "Tax Form Retrieval",
  "Form Annotations & Box Mapping",
  "Tax Rules Generation",
  "Query Builder",
  "Published",
] as const;

export type Stage = (typeof STAGES)[number];

/** The states a row can hold, in the order a person would step through them. */
export const STATE_ORDER: RunState[] = [
  "draft",
  "in_progress",
  "awaiting_you",
  "awaiting_approval",
  "testing",
  "live",
];

/**
 * A row carries a stable `id` the fixtures don't need: `code` is the natural
 * key until a duplicate gives two rows the same code, so edits and removals
 * address the `id` and the code stays free to repeat.
 */
export type CountryRow = CountryRun & { id: string };

/** Fixtures keyed by their code; new rows get a generated id. */
export function withIds(runs: CountryRun[]): CountryRow[] {
  return runs.map((r) => ({ ...r, id: r.code }));
}

/** Two-letter owner initials from a name, for the cases a name is edited. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** The stored stage if it is one of the stages, else the first. */
export function normalizeStage(step: string): Stage {
  return (STAGES as readonly string[]).includes(step)
    ? (step as Stage)
    : STAGES[0];
}

/**
 * A duplicate is a fresh onboarding seeded from an existing one, not a copy of
 * its progress — so it starts as a draft at the first stage with nothing yet
 * found or confirmed, keeping only the owner and a trail back to its source.
 */
export function makeDuplicate(source: CountryRow, name: string, activity: string): CountryRow {
  return {
    ...source,
    id: `dup-${Math.random().toString(36).slice(2, 9)}`,
    name,
    step: STAGES[0],
    stepsDone: 0,
    filingsConfirmed: 0,
    filingsFound: 0,
    review: 0,
    version: "v0.1",
    state: "draft",
    lastActivity: { text: activity, at: "Just now" },
  };
}

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
  live: { label: "Published", dot: "bg-settled", text: "text-settled" },
};

/** Total obligations already live in Comply, across every published country. */
export function filingsLive(runs: CountryRun[]): number {
  return runs
    .filter((r) => r.state === "live")
    .reduce((sum, r) => sum + r.filingsConfirmed, 0);
}

export type FilterId = "all" | "needs_you" | "draft" | "live";

export const FILTERS: { id: FilterId; label: string; match: (r: CountryRun) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "needs_you", label: "Awaiting you", match: (r) => r.state === "awaiting_you" },
  { id: "draft", label: "Drafts", match: (r) => r.state === "draft" },
  { id: "live", label: "Published", match: (r) => r.state === "live" },
];

/** The codes already live in Comply, from the fixtures. */
export const LIVE_CODES: readonly string[] = RUNS.filter((r) => r.state === "live").map(
  (r) => r.code,
);

/**
 * Applies the countries published from the Query Builder: an existing row
 * becomes Published at the last stage, a country not yet in the index gains a
 * row, and the newly published ones lead the list so the outcome of the run
 * is the first thing seen.
 */
export function withPublished(
  rows: CountryRow[],
  published: { code: string; name: string }[],
  activity: string,
): CountryRow[] {
  if (published.length === 0) return rows;
  const finished = (row: CountryRow): CountryRow => ({
    ...row,
    step: STAGES[STAGES.length - 1],
    stepsDone: 6,
    review: 0,
    version: "v1.0",
    state: "live",
    lastActivity: { text: activity, at: "Just now" },
  });
  const lead = published.map((p) => {
    const row = rows.find((r) => r.code === p.code);
    return finished(
      row ?? {
        id: `pub-${p.code}`,
        code: p.code,
        name: p.name,
        step: STAGES[0],
        stepsDone: 0,
        filingsConfirmed: 0,
        filingsFound: 0,
        review: 0,
        version: "v1.0",
        owner: { name: "Marco Rossi", initials: "MR" },
        lastActivity: { text: activity, at: "Just now" },
        state: "live",
      },
    );
  });
  const codes = new Set(published.map((p) => p.code));
  return [...lead, ...rows.filter((r) => !codes.has(r.code))];
}
