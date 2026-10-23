import type { ApprovalRecord, DecisionRecord, ReadinessCheck } from "../types";

/**
 * The decisions a human made during this onboarding, each with the reasoning
 * that was required at the time. Assembled from the earlier steps — a removal
 * in scope, a correction in returns, a flagged mapping resolved in rules.
 *
 * This is the point of having asked for a rationale at every one of those
 * moments. Without it an approver is signing for work they cannot inspect.
 */
export const BE_DECISIONS: DecisionRecord[] = [
  {
    id: "d-saft",
    kind: "removed",
    subject: "SAF-T",
    step: "Select Country",
    reason:
      "No SAF-T mandate is in force in Belgium. The 2019 commentary described a proposal that was never enacted.",
    by: "Marco Rossi",
    at: "22 Oct, 14:08",
  },
  {
    id: "d-rates",
    kind: "corrected",
    subject: "Reduced rates — VAT Return",
    step: "Return Types",
    reason:
      "Mapped from Royal Decree No 20, Tables A and B. The agent could not retrieve the decree itself.",
    by: "Marco Rossi",
    at: "22 Oct, 15:31",
  },
  {
    id: "d-rc",
    kind: "resolved",
    subject: "Reverse charge — construction",
    step: "Specs & Datasets",
    reason:
      "Box 45 confirmed with local counsel. Box 47 applies only to exempt supplies, not to reverse-charged work.",
    by: "Marco Rossi",
    at: "22 Oct, 16:02",
  },
  {
    id: "d-margin",
    kind: "dismissed",
    subject: "Margin scheme — second-hand goods",
    step: "Specs & Datasets",
    reason: "Out of scope for this registration; no second-hand trading.",
    by: "Marco Rossi",
    at: "22 Oct, 16:14",
  },
];

export const BE_READINESS: ReadinessCheck[] = [
  {
    label: "Obligations confirmed",
    detail: "4 of 4, each with a cited source",
    passed: true,
  },
  {
    label: "Nothing awaiting review",
    detail: "No finding or mapping is still open",
    passed: true,
  },
  {
    label: "Every transaction type covered",
    detail: "No type can file without a box mapping",
    passed: true,
  },
  {
    label: "Applied to test",
    detail: "22 Oct, 23:32 · dry run clean, rolled back",
    passed: true,
  },
];

export const BE_APPROVALS: ApprovalRecord[] = [
  {
    level: 1,
    label: "First approval",
    group: "Tax / Domain Expert",
    status: "pending",
  },
  {
    level: 2,
    label: "Second approval",
    group: "Second-Level Approvers",
    status: "pending",
  },
];

export function approvalDataFor(_countryCode: string) {
  return {
    decisions: BE_DECISIONS,
    readiness: BE_READINESS,
    approvals: BE_APPROVALS,
    /** Belgium has never been published, so there is nothing to diff against. */
    previousVersion: null as string | null,
    version: "v1.0",
    scope: { obligations: 4, rules: 14, rates: 4, boxes: 7 },
  };
}
