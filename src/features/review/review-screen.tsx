"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, CircleCheck, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import {
  addComment,
  allApproved,
  approvalSteps,
  approvedCount,
  blockedBy,
  useSubmission,
  type StepReview,
} from "@/lib/review";
import { useSession } from "@/lib/session";
import { useHasQueryStep } from "@/lib/query-step";
import { onboardingSteps } from "@/components/domain/onboarding-steps";
import { StepHeader, stepHref } from "@/features/approval/parts";
import { CommentsDrawer, when } from "./comments-drawer";
import { StepStatusBadge } from "./status-badge";

/** Where a step opens from the approval screen. Step one lives at
    /countries/new, so it is told which country to load. */
export function reviewStepHref(countryCode: string, index: number): string {
  return index === 0 ? `/countries/new?review=${countryCode.toUpperCase()}` : stepHref(countryCode, index);
}

/**
 * The approval workflow: every step that needs approval, by name, with where
 * it stands. Steps are sent one at a time from their own footers, so some may
 * not be sent yet. Each row opens its step — locked for the reviewer, who
 * reads, comments and decides there, and only once the step before it is
 * approved; open for the tax expert, who changes it and sends it again.
 */
export function ReviewScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const t = copy.approvalFlow;
  const person = useSession();
  const submission = useSubmission(countryCode);
  /* The step whose comments are open, read and answered without leaving here. */
  const [thread, setThread] = React.useState<number | null>(null);
  /* Query Builder is there only when a box is calculated; the last step is
     the way back, and the approval steps follow. */
  const steps = onboardingSteps(useHasQueryStep(countryCode));
  const last = steps.length - 1;
  const toApprove = approvalSteps(countryCode);

  return (
    <div className="pb-16">
      <StepHeader
        backHref={stepHref(countryCode, last)}
        backLabel={copy.page.stepsLabel[last]}
        title={countryName}
        currentIndex={steps.length}
        completedCount={steps.length}
        steps={steps}
      />

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {!submission ? (
            <div className="rounded-xl border border-dashed border-border-strong px-6 py-14">
              <p className="text-[15px] font-medium text-heading">
                {fill(t.notSubmitted, { country: countryName })}
              </p>
              <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
                {t.notSubmittedHint}
              </p>
              {person.role === "expert" && (
                <Button variant="secondary" size="sm" asChild className="mt-5">
                  <Link href={stepHref(countryCode, toApprove[0])}>{t.notSubmittedAction}</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                <div className="min-w-0">
                  <h2 className="text-[22px] font-medium tracking-tight text-heading">
                    {t.heading}
                  </h2>
                  <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">
                    {person.role === "reviewer" ? t.introReviewer : t.introExpert}
                  </p>
                </div>
                <Progress
                  approved={approvedCount(submission)}
                  total={toApprove.length}
                  by={fill(t.submittedBy, {
                    name: submission.submittedBy,
                    date: when(submission.submittedAt),
                  })}
                />
              </div>

              {allApproved(submission) && (
                <p className="rise mt-6 inline-flex items-center gap-2 rounded-lg bg-settled-quiet px-3.5 py-2.5 text-[14px] font-medium text-settled">
                  <CircleCheck className="size-4" />
                  {fill(t.allApproved, { country: countryName })}
                </p>
              )}

              <ol className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
                {toApprove.map((i) => {
                  const blocked = person.role === "reviewer" ? blockedBy(submission, i) : null;
                  return (
                    <StepRow
                      key={i}
                      index={i}
                      step={submission.steps[i]}
                      href={reviewStepHref(countryCode, i)}
                      locked={
                        !blocked
                          ? null
                          : blocked.reason === "not_sent"
                            ? t.notSentYet
                            : fill(t.approveEarlierFirst, {
                                step: copy.page.stepsLabel[blocked.step],
                              })
                      }
                      onComments={() => setThread(i)}
                    />
                  );
                })}
              </ol>
              <p className="mt-3 text-[13px] text-text-faint">{t.noApprovalSteps}</p>
            </>
          )}
        </div>
      </div>
      {submission && thread !== null && (
        <CommentsDrawer
          open
          onOpenChange={(open) => !open && setThread(null)}
          stepName={copy.page.stepsLabel[thread]}
          entries={submission.steps[thread].entries}
          onPost={(text) => addComment(countryCode, thread, person, text)}
        />
      )}
    </div>
  );
}

/** How many approval steps are approved, as a count and a bar that fills. */
function Progress({ approved, total, by }: { approved: number; total: number; by: string }) {
  const t = copy.approvalFlow;
  return (
    <div className="w-full max-w-72">
      <p className="text-[13px] font-medium text-text" data-numeric>
        {fill(t.progress, { approved, total })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full origin-left rounded-full bg-settled transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${approved / total})` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-text-faint">{by}</p>
    </div>
  );
}

/**
 * One step: its number and name, its status, and the latest word on it. The
 * row opens the step; the comments button beside it opens the step's thread
 * here, so the expert reads what the reviewer asked without leaving. A step
 * sent back carries the attention edge, as anything waiting on a person's
 * decision does. A step the reviewer cannot decide on yet is not a link, and
 * says why.
 */
function StepRow({
  index,
  step,
  href,
  locked,
  onComments,
}: {
  index: number;
  step: StepReview;
  href: string;
  /** Why the reviewer cannot open this step yet, or null when they can. */
  locked: string | null;
  onComments: () => void;
}) {
  const t = copy.approvalFlow;
  const last = step.entries.at(-1);
  const count = step.entries.length;
  /* A locked step reads as a row, not a link. */
  const Row = locked ? Plain : Link;

  return (
    <li
      className={cn(
        "flex items-center border-b border-border transition-colors last:border-b-0",
        !locked && "hover:bg-wash",
        step.status === "changes" && "shadow-[inset_3px_0_0_var(--attention)]",
      )}
    >
      <Row href={href} className="group flex min-w-0 flex-1 items-center gap-5 py-4 pl-5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
            step.status === "approved"
              ? "bg-settled text-on-brand"
              : "border border-border-strong text-text-muted",
          )}
          data-numeric
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[15px] font-medium text-heading">
              {copy.page.stepsLabel[index]}
            </span>
            <StepStatusBadge step={step} />
          </p>
          <p className="mt-1 truncate text-[13px] text-text-muted">
            {locked ? (
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" />
                {locked}
              </span>
            ) : last
              ? fill(t.lastBy, {
                  name: last.author,
                  text: last.text || t.entryKind[last.kind],
                })
              : t.noComments}
          </p>
        </div>
        {!locked && (
          <ChevronRight className="size-4 shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5" />
        )}
      </Row>

      <Button variant="ghost" size="sm" onClick={onComments} className="mx-3 shrink-0">
        <MessageSquare />
        {count === 0 ? t.comments : count === 1 ? t.commentCountOne : fill(t.commentCount, { count })}
      </Button>
    </li>
  );
}

function Plain({ className, children }: { href: string; className: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
