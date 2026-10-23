"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { copy } from "@/lib/copy";
import { DATASET_LABEL, type Dataset } from "@/lib/types";
import { cn } from "@/lib/cn";
import { RuleTable } from "./rule-table";
import { StageRail } from "./stage-rail";
import { useRules } from "./use-rules";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function RulesScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const r = useRules(countryCode);
  const current = r.current;
  const stage = r.stage;
  const open = r.openInCurrentStage;
  const last = r.stageIndex === r.stages.length - 1;
  const next = r.stages[r.stageIndex + 1];

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={`/countries/${countryCode}/returns`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Return Types
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[22px] font-semibold tracking-tight text-text">
              {countryName}
            </h1>
            <Button variant="filled" size="sm">
              {copy.page.saveDraft}
            </Button>
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={2} completedCount={2} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Asymmetric: the spine carries the order, the table carries the work. */}
          <div className="grid gap-x-10 gap-y-8 [&>*]:min-w-0 lg:grid-cols-[minmax(0,13.5rem)_minmax(0,1fr)] lg:items-start">
            <StageRail
              stages={r.stages}
              stageIndex={r.stageIndex}
              openIn={r.openInStage}
              reachable={r.reachable}
              onSelect={r.goToStage}
            />

            <section key={stage.id} className="rise">
              <h2 className="text-[20px] font-semibold tracking-tight text-text">
                {stage.label}
              </h2>
              <p className="mt-1.5 max-w-[66ch] text-[14px] leading-relaxed text-text-muted">
                {stage.purpose}
              </p>

              {/* Same underline rail as the Countries filters, so the two read
                  as one system rather than two tab styles. Only drawn when the
                  part actually holds more than one dataset. */}
              <div className="mt-7 flex items-end justify-between gap-x-6 border-b border-border pb-4">
                {stage.datasets.length > 1 ? (
                  <nav className="-mb-px flex min-w-0 items-center gap-x-6 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {stage.datasets.map((id) => {
                      const count = r.openIn(r.datasets[id]);
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
                          {count > 0 && (
                            <span className="ml-1.5 tabular-nums text-attention-text">
                              {count}
                            </span>
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
                ) : (
                  <p className="pb-1 text-[13px] text-text">
                    {DATASET_LABEL[current.id]}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => downloadCsv(current, countryCode)}
                  className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-[13px] font-medium text-text-muted transition-colors hover:text-brand"
                >
                  <Download className="size-3.5" />
                  Export CSV
                </button>
              </div>

              <p className="mt-5 max-w-[72ch] text-[13px] leading-relaxed text-text-muted">
                {current.purpose}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-text-muted">
                  <span data-numeric>{current.rows.length}</span>{" "}
                  {current.rows.length === 1 ? "row" : "rows"}
                  {r.openIn(current) > 0 && (
                    <span className="text-attention-text">
                      {" · "}
                      <span data-numeric>{r.openIn(current)}</span> to settle
                    </span>
                  )}
                </p>
                <Button size="sm" variant="secondary" onClick={() => r.addRow(current.id)}>
                  <Plus />
                  Add row
                </Button>
              </div>

              <div className="mt-3">
                <RuleTable
                  dataset={current}
                  onEdit={(rowId, key, value) => r.edit(current.id, rowId, key, value)}
                  onResolve={(rowId) => r.resolve(current.id, rowId)}
                  onDelete={(rowId) => r.deleteRow(current.id, rowId)}
                />
              </div>

              {/* The quiet failure mode of this step: a transaction type with no
                  rule files silently and wrongly. Surfaced rather than counted. */}
              {current.uncovered.length > 0 && (
                <Gaps
                  dataset={current}
                  countryName={countryName}
                  onDismiss={(name) => r.dismissGap(current.id, name)}
                />
              )}

              {stage.unlocks && (
                <p className="mt-10 border-t border-border pt-5 text-[13px] leading-relaxed text-text-faint">
                  {stage.unlocks}
                </p>
              )}
            </section>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {r.stageIndex > 0 ? (
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => r.goToStage(r.stageIndex - 1)}
            >
              Back to {r.stages[r.stageIndex - 1].label}
            </Button>
          ) : (
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href={`/countries/${countryCode}/returns`}>{copy.page.back}</Link>
            </Button>
          )}

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {open > 0 && (
              <span className="text-sm text-text-muted">
                {open === 1
                  ? "1 item in this part needs a decision"
                  : `${open} items in this part need a decision`}
              </span>
            )}

            {last ? (
              <Button variant="primary" asChild={open === 0} disabled={open > 0}>
                {open === 0 ? (
                  <Link href={`/countries/${countryCode}/build`}>
                    Continue to SQL Review
                    <ArrowRight />
                  </Link>
                ) : (
                  <>
                    Continue to SQL Review
                    <ArrowRight />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={open > 0}
                onClick={() => r.goToStage(r.stageIndex + 1)}
              >
                Continue to {next.label}
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Gaps({
  dataset,
  countryName,
  onDismiss,
}: {
  dataset: Dataset;
  countryName: string;
  onDismiss: (name: string) => void;
}) {
  return (
    <section className="mt-10 border-t border-border pt-6">
      <h3 className="text-[13px] font-medium text-text">No rule covers these yet</h3>
      <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
        Comply recognises these transaction types for {countryName}. Without a
        rule they are filed with no box mapping, which produces a return that
        looks complete and is not.
      </p>

      <ul className="mt-4 divide-y divide-border border-y border-border">
        {dataset.uncovered.map((name) => (
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
                onClick={() => onDismiss(name)}
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

/** The dataset as the team already passes it around — one file, no library. */
function downloadCsv(dataset: Dataset, countryCode: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = [...dataset.columns.map((col) => col.label), "Source"];
  const lines = [
    header.map(escape).join(","),
    ...dataset.rows.map((row) =>
      [
        ...dataset.columns.map((col) => row.cells[col.key]?.value ?? ""),
        row.citation?.url ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${countryCode.toLowerCase()}-${dataset.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
