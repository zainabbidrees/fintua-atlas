"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { copy, fill } from "@/lib/copy";
import { markPublished } from "@/lib/published";
import { addComment, decideStep, resubmitStep, STEP_COUNT } from "@/lib/review";
import { CommentsDrawer } from "./comments-drawer";
import { StepStatusBadge } from "./status-badge";
import type { StepReviewState } from "./use-step-review";

export const reviewHref = (countryCode: string) =>
  `/countries/${countryCode.toLowerCase()}/review`;

/**
 * A step's pinned footer while its country is in review, in place of Save and
 * Continue. Both roles get the way back to the approval screen, the step's
 * status, and its comments. Then the roles part:
 *
 * - The reviewer approves the step, or asks for changes — which needs a
 *   reason, since the expert has to know what to change.
 * - The tax expert, who can edit the step again, sends it for approval again
 *   once it is right; anything unsaved is saved first.
 *
 * Approving the last of the six steps publishes the country.
 */
export function ReviewBar({
  countryCode,
  stepIndex,
  review,
  onSave,
}: {
  countryCode: string;
  stepIndex: number;
  review: StepReviewState;
  /** Saves the step's unsaved edits, before the expert sends it again. */
  onSave?: () => void;
}) {
  const t = copy.approvalFlow;
  const router = useRouter();
  const { person, submission, step } = review;
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [asking, setAsking] = React.useState(false);
  if (!submission || !step) return null;

  const stepName = copy.page.stepsLabel[stepIndex];
  const comments = step.entries.length;
  const reviewer = person.role === "reviewer";

  function approve() {
    if (!submission || !step) return;
    decideStep(countryCode, stepIndex, person, "approved", "");
    const othersApproved = submission.steps.filter(
      (s, i) => i !== stepIndex && s.status === "approved",
    ).length;
    if (othersApproved === STEP_COUNT - 1) markPublished(countryCode, submission.name);
    toast(fill(t.approvedToast, { step: stepName }));
    router.push(reviewHref(countryCode));
  }

  function requestChanges(reason: string) {
    decideStep(countryCode, stepIndex, person, "changes", reason);
    toast(fill(t.requestedToast, { step: stepName }));
    router.push(reviewHref(countryCode));
  }

  function sendAgain() {
    onSave?.();
    resubmitStep(countryCode, stepIndex, person, t.sentAgainNote);
    toast(fill(t.sentAgainToast, { step: stepName }));
    router.push(reviewHref(countryCode));
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="self-start sm:self-auto">
            <Link href={reviewHref(countryCode)}>
              <ArrowLeft />
              {t.backToApproval}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {reviewer && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-text-muted">
                <Eye className="size-4" />
                {t.readOnly}
              </span>
            )}
            <StepStatusBadge step={step} />
            <Button variant="secondary" onClick={() => setCommentsOpen(true)}>
              <MessageSquare />
              {t.comments}
              {comments > 0 && (
                <span className="text-text-faint" data-numeric>
                  {comments}
                </span>
              )}
            </Button>
            {reviewer ? (
              <>
                <Button variant="secondary" onClick={() => setAsking(true)}>
                  {t.requestChanges}
                </Button>
                <Button
                  variant="primary"
                  disabled={step.status === "approved"}
                  onClick={approve}
                >
                  <Check />
                  {step.status === "approved" ? t.status.approved : t.approve}
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={sendAgain}>
                {t.sendAgain}
              </Button>
            )}
          </div>
        </div>
      </div>

      <CommentsDrawer
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        stepName={stepName}
        entries={step.entries}
        onPost={(text) => addComment(countryCode, stepIndex, person, text)}
      />

      <ConfirmWithReason
        open={asking}
        onOpenChange={setAsking}
        title={fill(t.requestTitle, { step: stepName })}
        hint={t.requestHint}
        placeholder={t.requestPlaceholder}
        confirmLabel={t.requestConfirm}
        cancelLabel={t.requestCancel}
        destructive={false}
        onConfirm={requestChanges}
      />
    </>
  );
}
