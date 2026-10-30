"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { copy, fill } from "@/lib/copy";
import { useDrafts, type Draft } from "@/lib/drafts";
import { hasQueryStep } from "@/lib/query-step";
import { onboardingSteps } from "@/components/domain/onboarding-steps";
import { stepHref } from "@/features/steps/step-view";
import { when } from "@/features/review/comments-drawer";

/**
 * Every saved draft, grouped by country — the country most recently saved
 * first, and its versions newest first. Each version says how far it reaches
 * and opens the step it was saved from.
 */
export function DraftsList() {
  const t = copy.drafts;
  const drafts = useDrafts();

  /* Grouped in the order drafts come — newest first — so the country saved
     most recently leads. */
  const countries = React.useMemo(() => {
    const groups = new Map<string, Draft[]>();
    for (const d of drafts) groups.set(d.code, [...(groups.get(d.code) ?? []), d]);
    return [...groups.values()];
  }, [drafts]);

  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mx-auto w-full max-w-[1600px]">
        <h1 className="text-[22px] font-medium tracking-tight text-heading">{t.title}</h1>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">{t.intro}</p>

        {countries.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border-strong px-6 py-14">
            <p className="text-[15px] font-medium text-heading">{t.empty}</p>
            <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
              {t.emptyHint}
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {countries.map((versions) => (
              <CountryDrafts key={versions[0].code} versions={versions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CountryDrafts({ versions }: { versions: Draft[] }) {
  const t = copy.drafts;
  const { name } = versions[0];
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <header className="flex items-baseline gap-3 border-b border-border bg-surface-sunken px-5 py-3">
        <h2 className="text-[15px] font-medium text-heading">{name}</h2>
        <span className="text-[13px] text-text-muted" data-numeric>
          {versions.length === 1 ? t.countDraftsOne : fill(t.countDrafts, { count: versions.length })}
        </span>
      </header>
      <ul>
        {versions.map((d, i) => (
          <li key={d.id} className="border-b border-border last:border-b-0">
            <Link
              href={stepHref(d.code, d.step)}
              aria-label={fill(t.open, { version: d.version, country: d.name })}
              className="group grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-wash md:grid-cols-[10rem_minmax(0,1.6fr)_minmax(0,1.4fr)_1rem]"
            >
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-medium text-heading" data-numeric>
                  {fill(t.version, { version: d.version })}
                </span>
                {i === 0 && (
                  <span className="rounded border border-border bg-surface-sunken px-1.5 text-[11px] font-medium leading-5 text-text-muted">
                    {t.latest}
                  </span>
                )}
              </span>
              <span className="col-start-1 text-[14px] text-text md:col-start-auto">
                {fill(t.upTo, { step: copy.page.stepsLabel[d.step] })}
                <span className="ml-2 text-[13px] text-text-muted" data-numeric>
                  {fill(t.stepOf, {
                    n: d.step + 1,
                    total: onboardingSteps(hasQueryStep(d.code)).length,
                  })}
                </span>
              </span>
              <span className="col-start-1 text-[13px] text-text-muted md:col-start-auto">
                {fill(t.savedBy, { name: d.savedBy, date: when(d.savedAt) })}
              </span>
              <ChevronRight className="col-start-2 row-span-3 row-start-1 size-4 text-text-faint transition-transform group-hover:translate-x-0.5 md:col-start-auto md:row-span-1 md:row-start-auto" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
