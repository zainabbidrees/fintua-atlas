"use client";

import * as React from "react";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { copy, fill } from "@/lib/copy";
import { cn } from "@/lib/cn";
import type { DryRun, ExplainNode, PerfMetric } from "@/lib/types";

const b = copy.build;

/**
 * The dry run's own evidence. The step already states the files were run
 * against a copy of the test database and rolled back; this is that run, shown
 * rather than asserted — what it would write, how the database would run it, and
 * what it would cost. Keeping it beside the files is the same principle the
 * findings follow: the answer and its proof in one place.
 */
export function DryRunOutput({ dryRun }: { dryRun: DryRun }) {
  const tabs = [
    { id: "result", label: b.tabResult },
    { id: "plan", label: b.tabPlan },
    { id: "performance", label: b.tabPerformance },
  ];
  const [tab, setTab] = React.useState("result");

  return (
    <section className="mt-12">
      <h2 className="text-[17px] font-medium tracking-tight text-heading">
        {b.outputTitle}
      </h2>
      <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
        {b.outputPurpose}
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)]">
        <Tabs tabs={tabs} value={tab} onValueChange={setTab} idBase="dry-run" />

        <div className="mt-5">
          {tab === "result" && (
            <TabPanel id="result" idBase="dry-run">
              <ResultPreview dryRun={dryRun} />
            </TabPanel>
          )}
          {tab === "plan" && (
            <TabPanel id="plan" idBase="dry-run">
              <QueryPlan plan={dryRun.plan} />
            </TabPanel>
          )}
          {tab === "performance" && (
            <TabPanel id="performance" idBase="dry-run">
              <Performance metrics={dryRun.performance} />
            </TabPanel>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultPreview({ dryRun }: { dryRun: DryRun }) {
  const first = dryRun.results[0];
  return (
    <div className="space-y-6">
      <p className="text-[13px] text-text-muted">
        {fill(b.rowsAffected, { count: first.rowsAffected })} ·{" "}
        {fill(b.statementsRun, { count: first.statements })}
      </p>

      {dryRun.results.map((result) => (
        <div key={result.fileName}>
          <p className="mb-2 font-mono text-[12px] text-text-muted">
            {fill(b.resultFor, { file: result.fileName })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-sunken">
                  {result.columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-medium text-text-muted"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-3 py-2 text-text"
                        data-numeric
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const SCAN_LABEL: Record<ExplainNode["scan"], string> = {
  index: b.scanIndex,
  sequential: b.scanSequential,
  none: b.scanWrite,
};

function QueryPlan({ plan }: { plan: ExplainNode[] }) {
  return (
    <ul className="space-y-px">
      {plan.map((node, i) => {
        const flagged = node.scan === "sequential";
        return (
          <li
            key={i}
            className={cn(
              "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-3 py-2.5",
              flagged ? "bg-attention-quiet" : "bg-surface-sunken",
            )}
          >
            <span className="font-mono text-[13px] text-text">{node.op}</span>
            <span className="font-mono text-[12px] text-text-muted">{node.target}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium",
                node.scan === "sequential"
                  ? "text-attention-text"
                  : node.scan === "index"
                    ? "text-settled"
                    : "text-text-faint",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  node.scan === "sequential"
                    ? "bg-attention"
                    : node.scan === "index"
                      ? "bg-settled"
                      : "bg-text-faint",
                )}
              />
              {SCAN_LABEL[node.scan]}
            </span>
            <span className="w-full text-[12px] text-text-muted sm:ml-auto sm:w-auto" data-numeric>
              {node.detail}
            </span>
            {flagged && (
              <p className="w-full text-[12px] text-attention-text">{b.scanFlag}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const BAR_TONE: Record<NonNullable<PerfMetric["tone"]>, string> = {
  settled: "bg-settled",
  attention: "bg-attention",
  risk: "bg-risk",
};

function Performance({ metrics }: { metrics: PerfMetric[] }) {
  return (
    <dl className="space-y-5">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[13px] text-text">{metric.label}</dt>
            <dd className="text-[13px] font-medium text-text" data-numeric>
              {metric.value}
            </dd>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn(
                "h-full rounded-full",
                metric.tone ? BAR_TONE[metric.tone] : "bg-border-strong",
              )}
              style={{ width: `${Math.round(metric.ratio * 100)}%` }}
            />
          </div>
          {metric.note && (
            <p className="mt-1.5 text-[12px] text-text-muted">{metric.note}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
