"use client";

import { toast } from "sonner";
import { copy, fill } from "@/lib/copy";
import { submitStep, type StepStatus } from "@/lib/review";
import { StepStatusBadge } from "./status-badge";
import { useStepReview } from "./use-step-review";

/**
 * The tax expert's side of a step that needs approval. Moving on from the
 * step sends it to the reviewer — or sends it again, after changes were asked
 * for — and carries straight on: the expert never waits on the reviewer. A
 * step already sent, or approved, simply moves on.
 */
export function useSendStep(countryCode: string, countryName: string, stepIndex: number) {
  const t = copy.approvalFlow;
  const { person, step } = useStepReview(countryCode, stepIndex);
  const status: StepStatus = step?.status ?? "not_sent";
  const sends = status === "not_sent" || status === "changes";

  /** Sends the step when it is due to be sent, then runs `next`. */
  function send(next: () => void) {
    if (sends) {
      submitStep(countryCode, countryName, stepIndex, person);
      toast(fill(t.sentStepToast, { step: copy.page.stepsLabel[stepIndex] }));
    }
    next();
  }

  return {
    status,
    step,
    send,
    label: status === "changes" ? t.sendAgain : sends ? t.sendForApproval : copy.page.continue,
  };
}

/** Where a sent step stands, for the expert's footer; nothing before it is sent. */
export function SentStatus({ send }: { send: ReturnType<typeof useSendStep> }) {
  return send.step && send.status !== "not_sent" ? <StepStatusBadge step={send.step} /> : null;
}
