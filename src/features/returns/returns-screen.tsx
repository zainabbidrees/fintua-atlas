"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { copy } from "@/lib/copy";
import { FINDING_GROUP_LABEL, type FindingGroup } from "@/lib/types";
import { FindingRow } from "./finding-row";
import { ObligationRail } from "./obligation-rail";
import { useReturns } from "./use-returns";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));
const GROUP_ORDER: FindingGroup[] = ["filing", "rates", "rules"];

export function ReturnsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const r = useReturns(countryCode);

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Countries
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-text">
                {countryName}
              </h1>
            </div>
            <Button variant="filled" size="sm">
              {copy.page.saveDraft}
            </Button>
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={1} completedCount={1} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Asymmetric: the rail navigates, the findings carry the work. */}
          <div className="grid gap-x-10 gap-y-8 [&>*]:min-w-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start">
            <ObligationRail
              obligations={r.obligations}
              selectedId={r.selectedId}
              onSelect={r.setSelectedId}
              outstanding={r.outstanding}
              isSettled={r.isSettled}
            />

            {r.selected && <Detail run={r.selected} r={r} />}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/countries/new">{copy.page.back}</Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {r.totalOutstanding > 0 && (
              <span className="text-sm text-text-muted">
                {r.totalOutstanding === 1
                  ? "1 finding requires review"
                  : `${r.totalOutstanding} findings require review`}
              </span>
            )}
            {r.totalOutstanding === 0 && r.anyRunning && (
              <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <Loader2 className="size-3.5 animate-spin" />
                An obligation is still being researched
              </span>
            )}
            {r.allSettled && !r.anyRunning ? (
              <Button variant="primary" asChild>
                <Link href={`/countries/${countryCode}/rules`}>
                  Continue to Specs &amp; Datasets
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                Continue to Specs &amp; Datasets
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  run,
  r,
}: {
  run: ReturnType<typeof useReturns>["selected"];
  r: ReturnType<typeof useReturns>;
}) {
  if (!run) return null;

  const corroborated = run.findings.filter((f) => f.state === "corroborated").length;

  if (run.agent === "running") {
    return <Researching name={run.name} progress={run.progress} />;
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-[19px] font-semibold tracking-tight text-text">
            {run.name}
          </h2>
          {run.localName && (
            <p className="mt-0.5 text-sm text-text-muted">{run.localName}</p>
          )}
        </div>

        {/* The one bulk action. The counts that used to sit beside it repeated
            what the rail and the rows already say. */}
        {corroborated > 0 && (
          <Button size="sm" onClick={() => r.confirmCorroborated(run.id)}>
            <Check />
            Confirm {corroborated}
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-8">
        {GROUP_ORDER.map((group) => {
          const rows = run.findings.filter((f) => f.group === group);
          if (rows.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
                {FINDING_GROUP_LABEL[group]}
              </h3>
              <ul className="mt-2 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                {rows.map((finding, i) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    /* An odd last cell spans the row rather than leaving a gap. */
                    full={rows.length % 2 === 1 && i === rows.length - 1}
                    onConfirm={() => r.confirm(finding.id)}
                    onEdit={(value, reason) => r.edit(finding, value, reason)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Partial state: the agent is still working, and the page stays usable. */
function Researching({ name, progress }: { name: string; progress: number }) {
  return (
    <section>
      <h2 className="text-[19px] font-semibold tracking-tight text-text">{name}</h2>
      <p className="mt-0.5 text-sm text-text-muted">
        Research is still running. Findings appear here as they are retrieved —
        you can work on another obligation meanwhile.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2.5 text-[13px] text-text-muted">
          <Loader2 className="size-3.5 animate-spin text-brand" />
          Reading finances.belgium.be — annual listing requirements
          <span className="ml-auto tabular-nums text-text-faint">{progress}%</span>
        </div>

        {/* Skeleton rows matching the real layout, not a spinner in a void. */}
        <ul className="mt-5 space-y-4" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="h-3 w-32 shrink-0 rounded bg-border" />
              <span className="flex-1 space-y-2">
                <span
                  className="block h-3 rounded bg-border"
                  style={{ width: `${70 - i * 14}%` }}
                />
                <span
                  className="block h-3 rounded bg-border/60"
                  style={{ width: `${48 - i * 10}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
