"use client";

import { useSubmission } from "@/lib/review";
import { useSession } from "@/lib/session";

/**
 * A step as the approval workflow sees it: whether the country is in review,
 * who is looking, and — for a reviewer — that the step is theirs to read, not
 * to change.
 */
export function useStepReview(countryCode: string, stepIndex: number) {
  const person = useSession();
  const submission = useSubmission(countryCode);
  const step = submission?.steps[stepIndex] ?? null;
  const inReview = submission !== null;

  return {
    person,
    submission,
    step,
    inReview,
    /* A reviewer never edits, in review or not. */
    readOnly: person.role === "reviewer",
    /* The reviewer's bar — approve, ask for changes — replaces a step's footer
       while they review. The expert keeps the normal footer and sends for
       approval again from the last step only. */
    reviewing: inReview && person.role === "reviewer",
  };
}

export type StepReviewState = ReturnType<typeof useStepReview>;
