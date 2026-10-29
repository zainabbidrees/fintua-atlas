"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { approvedCount, STEP_COUNT, useSubmission, type StepReview } from "@/lib/review";
import { useSession } from "@/lib/session";
import { StepHeader, stepHref } from "@/features/approval/parts";
import { when } from "./comments-drawer";
import { StepStatusBadge } from "./status-badge";

/** Where a step opens from the approval screen. Step one lives at
    /countries/new, so it is told which country to load. */
export function reviewStepHref(countryCode: string, index: number): string {
  return index === 0 ? `/countries/new?review=${countryCode.toUpperCase()}` : stepHref(countryCode, index);
}

/**
 * The approval workflow, after the last step: every step by name with where
 * it stands in review. Each row opens its step — locked for the reviewer, who
 * reads, comments and decides there; open for the tax expert, who changes it
 * and sends it for approval again.
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

  return (
    <div className="pb-16">
      <StepHeader
        backHref={stepHref(countryCode, 5)}
        backLabel={t.backLink}
        title={countryName}
        currentIndex={STEP_COUNT}
        completedCount={STEP_COUNT}
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
                  <Link href={stepHref(countryCode, 5)}>{t.notSubmittedAction}</Link>
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
                  by={fill(t.submittedBy, {
                    name: submission.submittedBy,
                    date: when(submission.submittedAt),
                  })}
                />
              </div>

              {approvedCount(submission) === STEP_COUNT && (
                <p className="rise mt-6 inline-flex items-center gap-2 rounded-lg bg-settled-quiet px-3.5 py-2.5 text-[14px] font-medium text-settled">
                  <CircleCheck className="size-4" />
                  {fill(t.allApproved, { country: countryName })}
                </p>
              )}

              <ol className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
                {submission.steps.map((step, i) => (
                  <StepRow
                    key={i}
                    index={i}
                    step={step}
                    href={reviewStepHref(countryCode, i)}
                  />
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** How many of the six are approved, as a count and a bar that fills. */
function Progress({ approved, by }: { approved: number; by: string }) {
  const t = copy.approvalFlow;
  return (
    <div className="w-full max-w-72">
      <p className="text-[13px] font-medium text-text" data-numeric>
        {fill(t.progress, { approved, total: STEP_COUNT })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full origin-left rounded-full bg-settled transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${approved / STEP_COUNT})` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-text-faint">{by}</p>
    </div>
  );
}

/**
 * One step: its number and name, its status, and the latest word on it. The
 * whole row opens the step. A step sent back carries the attention edge, as
 * anything waiting on a person's decision does.
 */
function StepRow({ index, step, href }: { index: number; step: StepReview; href: string }) {
  const t = copy.approvalFlow;
  const last = step.entries.at(-1);
  const count = step.entries.length;

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-5 px-5 py-4 transition-colors hover:bg-wash",
          step.status === "changes" && "shadow-[inset_3px_0_0_var(--attention)]",
        )}
      >
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
            {last
              ? fill(t.lastBy, {
                  name: last.author,
                  text: last.text || t.entryKind[last.kind],
                })
              : t.noComments}
          </p>
        </div>

        <span className="hidden shrink-0 text-[13px] text-text-faint sm:block" data-numeric>
          {count === 0 ? "" : count === 1 ? t.commentCountOne : fill(t.commentCount, { count })}
        </span>
        <ChevronRight className="size-4 shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
