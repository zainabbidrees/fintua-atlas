"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/patterns/stepper";
import { ONBOARDING_STEPS } from "@/components/domain/onboarding-steps";
import { copy } from "@/lib/copy";

const STEPS = ONBOARDING_STEPS;

import { StepNav } from "@/features/steps/step-view";

export { stepHref } from "@/features/steps/step-view";

export type Scope = { obligations: number; rules: number; rates: number; boxes: number };

/** The header band every step shares: back link, title, actions, stepper. */
export function StepHeader({
  backHref,
  backLabel,
  title,
  actions,
  currentIndex,
  completedCount,
  countryCode,
  steps = STEPS,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  actions?: React.ReactNode;
  currentIndex: number;
  completedCount: number;
  /** Given, the stepper links every reached step (see StepNav). */
  countryCode?: string;
  /** The steps to show when not linked; all six by default. */
  steps?: typeof STEPS;
}) {
  return (
    <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
      <div className="mx-auto w-full max-w-[1600px]">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[22px] font-medium tracking-tight text-heading">{title}</h1>
          {actions}
        </div>

        <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-max">
            {countryCode ? (
              <StepNav countryCode={countryCode} index={currentIndex} />
            ) : (
              <Stepper steps={steps} currentIndex={currentIndex} completedCount={completedCount} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** What is being signed for: the version, where it goes, and how much of it. */
export function ReleaseCard({
  version,
  previousVersion,
  scope,
}: {
  version: string;
  previousVersion: string | null;
  scope: Scope;
}) {
  const t = copy.approval;
  const stats = [
    { label: t.scope.returnTypes, value: scope.obligations },
    { label: t.scope.boxes, value: scope.boxes },
    { label: t.scope.rules, value: scope.rules },
    { label: t.scope.rates, value: scope.rates },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4 px-5 py-4">
        <div>
          <span className="text-[12px] text-text-faint">{t.releaseLabel}</span>
          <div className="mt-0.5 flex items-center gap-2.5">
            <span className="text-[17px] font-medium tabular-nums text-heading">{version}</span>
            {!previousVersion && <Badge tone="brand">{t.firstVersion}</Badge>}
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-10 gap-y-3 text-[13px]">
          <div>
            <dt className="text-[12px] text-text-faint">{t.publishesToLabel}</dt>
            <dd className="mt-0.5 font-medium text-text">{t.publishesTo}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-text-faint">{t.replacesLabel}</dt>
            <dd className="mt-0.5 font-medium text-text">
              {previousVersion ?? t.replacesNothing}
            </dd>
          </div>
        </dl>
      </div>

      {/* Hairlines from the gap over a border-coloured ground, so the grid
          divides cleanly at two columns and at four. */}
      <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-5 py-4">
            <dd className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-heading">
              {s.value}
            </dd>
            <dt className="mt-1.5 text-[13px] text-text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
