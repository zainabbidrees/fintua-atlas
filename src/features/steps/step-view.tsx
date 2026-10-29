"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { ONBOARDING_STEPS as STEPS } from "@/components/domain/onboarding-steps";
import { copy, fill } from "@/lib/copy";

/** Where each step lives, so a check or a decision can be opened in place. */
export function stepHref(countryCode: string, index: number): string {
  const code = countryCode.toLowerCase();
  return [
    "/countries/new",
    `/countries/${code}/returns`,
    `/countries/${code}/forms`,
    `/countries/${code}/rules`,
    `/countries/${code}/build`,
    `/countries/${code}/approval`,
  ][index];
}

/**
 * A finished step opened to look at, from the step you are on. `?view=` names
 * that step, so the way back is always to where the work was left. Step one
 * has no country in its path, so it is given one.
 */
export function viewHref(countryCode: string, index: number, from: number): string {
  if (index === 0) return `/countries/new?review=${countryCode.toLowerCase()}&view=${from}`;
  return `${stepHref(countryCode, index)}?view=${from}`;
}

/**
 * Whether this step is open to look at rather than to work on — reached from a
 * later step through the stepper. Returns the step it was opened from, or null
 * when the step is being worked on.
 */
export function useStepView(index: number): number | null {
  const raw = useSearchParams().get("view");
  const from = raw !== null && /^\d$/.test(raw) ? Number(raw) : null;
  return from !== null && from > index && from < STEPS.length ? from : null;
}

/**
 * The stepper with every reached step a link. Finished steps open to view
 * only; while viewing, the step you came from stays open — not done, not
 * locked — and takes you back to work on it.
 */
export function StepNav({ countryCode, index }: { countryCode: string; index: number }) {
  const from = useStepView(index);
  const reached = from ?? index;
  return (
    <Stepper
      steps={STEPS}
      currentIndex={index}
      completedCount={reached}
      reachedIndex={reached}
      hrefFor={
        countryCode
          ? (i) => (i === from ? stepHref(countryCode, i) : viewHref(countryCode, i, reached))
          : undefined
      }
    />
  );
}

/**
 * The pinned footer while viewing, in place of Save and Continue: it says the
 * step is read only, and the one action is back to the step you were on.
 */
export function ViewOnlyBar({
  countryCode,
  index,
  from,
}: {
  countryCode: string;
  index: number;
  from: number;
}) {
  const t = copy.viewOnly;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="flex min-w-0 items-center gap-2.5 text-sm text-text-muted">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-surface-sunken px-2 py-1 text-[12px] font-medium text-text">
            <Eye className="size-3.5" />
            {t.badge}
          </span>
          <span className="hidden truncate xl:inline">
            {fill(t.note, { step: copy.page.stepsLabel[index] })}
          </span>
        </p>
        <Button variant="primary" asChild className="shrink-0">
          <Link href={stepHref(countryCode, from)}>
            {fill(t.back, { step: copy.page.stepsLabel[from] })}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
