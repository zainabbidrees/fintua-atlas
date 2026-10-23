"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { copy } from "@/lib/copy";
import { DATASET_LABEL, type DatasetId } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RuleTable } from "./rule-table";
import { useRules } from "./use-rules";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));
const TABS = Object.keys(DATASET_LABEL) as DatasetId[];

export function RulesScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const r = useRules(countryCode);
  const current = r.current;
  const issues = r.issuesIn(current);

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <Link
            href={`/countries/${countryCode}/returns`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Returns
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-text">
                {countryName}
              </h1>
              <p className="mt-0.5 text-sm text-text-muted">
                Step 3 of 5 · Specs &amp; Datasets
              </p>
            </div>
            <Button variant="secondary" size="sm">
              {copy.page.saveDraft}
            </Button>
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[34rem]">
              <Stepper steps={STEPS} currentIndex={2} completedCount={2} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-12">
        {/* Same underline rail as the Countries filters, so the two read as
            one system rather than two tab styles. */}
        <div className="flex items-center justify-between gap-x-6 border-b border-border pb-4">
          <nav className="-mb-px flex min-w-0 items-center gap-x-6 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((id) => {
              const open = r.issuesIn(r.datasets[id]) + r.datasets[id].uncovered.length;
              const isActive = r.active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => r.setActive(id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap pb-1 text-[13px] transition-colors active:scale-[0.98]",
                    isActive ? "text-text" : "text-text-faint hover:text-text-muted",
                  )}
                >
                  {DATASET_LABEL[id]}
                  {open > 0 && (
                    <span className="ml-1.5 tabular-nums text-attention-text">{open}</span>
                  )}
                  <span
                    className={cn(
                      "absolute -bottom-[17px] left-0 h-px w-full origin-left bg-text transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-brand"
          >
            <Download className="size-3.5" />
            Export
          </button>
        </div>

        <p className="mt-5 text-[13px] text-text-muted">
          <span className="tabular-nums">{current.rows.length}</span>{" "}
          {current.rows.length === 1 ? "rule" : "rules"}
          {issues > 0 && (
            <span className="text-attention-text">
              {" · "}
              <span className="tabular-nums">{issues}</span>{" "}
              {issues === 1 ? "needs a decision" : "need a decision"}
            </span>
          )}
        </p>

        <div className="mt-4">
          <RuleTable
            dataset={current}
            onEdit={(rowId, key, value) => r.edit(current.id, rowId, key, value)}
            onResolve={(rowId) => r.resolve(current.id, rowId)}
          />
        </div>

        {/* The quiet failure mode of this step: a transaction type with no rule
            files silently and wrongly. Surfaced rather than counted. */}
        {current.uncovered.length > 0 && <Gaps r={r} />}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur md:left-72">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-3 sm:px-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${countryCode}/returns`}>{copy.page.back}</Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {r.openItems > 0 && (
              <span className="text-sm text-attention-text">
                {r.openItems === 1
                  ? "1 item needs a decision"
                  : `${r.openItems} items need a decision`}
              </span>
            )}
            <Button
              variant="primary"
              disabled={r.openItems > 0}
              asChild={r.openItems === 0}
            >
              {r.openItems === 0 ? (
                <Link href={`/countries/${countryCode}/build`}>
                  Continue to SQL Review
                  <ArrowRight />
                </Link>
              ) : (
                <span>
                  Continue to SQL Review
                  <ArrowRight />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gaps({ r }: { r: ReturnType<typeof useRules> }) {
  const current = r.current;

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-[13px] font-medium text-text">
        No rule covers these yet
      </h2>
      <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
        Comply recognises these transaction types for Belgium. Without a rule
        they are filed with no box mapping, which produces a return that looks
        complete and is not.
      </p>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {current.uncovered.map((name) => (
          <li
            key={name}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3"
          >
            <span className="text-[14px] text-text">{name}</span>
            <div className="flex items-center gap-4">
              <Button size="sm" variant="secondary">
                <Plus />
                Add rule
              </Button>
              <button
                type="button"
                onClick={() => r.dismissGap(current.id, name)}
                className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
              >
                Not applicable
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
