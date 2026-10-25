"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { JumpToReview } from "@/components/patterns/jump-to-review";
import { UploadBar } from "@/components/patterns/upload-bar";
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
  const clearedReturns = r.obligations.filter(r.isSettled).length;

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
              <h1 className="text-[22px] font-medium tracking-tight text-heading">
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
          {/* Asymmetric: the rail navigates, the findings carry the work. A
              hairline down the findings' edge sets the rail apart as its own
              panel — where you are, not what you are doing. */}
          <div className="grid gap-x-6 gap-y-8 [&>*]:min-w-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-stretch">
            {/* The rail lives in its own panel: a full-height stroke on its
                right edge sets it apart from the work, while the nav inside
                stays sticky. */}
            <div className="lg:border-r lg:border-border-strong lg:pr-6">
              <ObligationRail
                obligations={r.obligations}
                selectedId={r.selectedId}
                onSelect={r.setSelectedId}
                outstanding={r.outstanding}
                isSettled={r.isSettled}
              />
            </div>

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
            {/* Speaks in return types, not scattered findings: the gate is
                clearing every return, and the message counts exactly that. */}
            {!r.allSettled && (
              <span className="text-sm text-text-muted">
                <span className="font-medium tabular-nums text-text">
                  {clearedReturns}
                </span>{" "}
                of{" "}
                <span className="tabular-nums">{r.obligations.length}</span>{" "}
                return types cleared
              </span>
            )}
            {r.allSettled ? (
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
  const needsReview = run.findings.filter((f) => f.state === "needs_review").length;
  const settled = run.findings.filter(
    (f) => f.state === "confirmed" || f.state === "edited",
  ).length;
  /* Everything still waiting on a human — cross-checked and flagged alike. The
     walkthrough steps through all of these, one at a time. */
  const toReview = needsReview + corroborated;

  if (run.agent === "running") {
    return <Researching name={run.name} progress={run.progress} />;
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="text-[19px] font-medium tracking-tight text-heading">
            {run.name}
          </h2>
          {run.localName && (
            <p className="mt-0.5 text-sm text-text-muted">{run.localName}</p>
          )}
          {/* Progress within this return, in one line. */}
          <p className="mt-1.5 text-[13px] text-text-muted">
            <span className="font-medium tabular-nums text-text">{settled}</span>{" "}
            of {run.findings.length} values confirmed
          </p>
        </div>

        {/* No bulk confirm — a tax record can't be cleared on trust. The
            walkthrough steps to each value still open; when none remain the
            return reads as done. */}
        {toReview > 0 ? (
          <JumpToReview count={toReview} verb="review" />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-settled">
            <Check className="size-4" />
            All confirmed
          </span>
        )}
      </div>

      <div className="mt-6 space-y-8">
        {GROUP_ORDER.map((group) => {
          const rows = run.findings.filter((f) => f.group === group);
          if (rows.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="px-1 text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
                {FINDING_GROUP_LABEL[group]}
              </h3>
              {/* One finding per row, full width: the answer gets room to
                  breathe and its proof sits alongside it rather than stacked
                  under it. Hairlines between rows via the gap-px grid. */}
              <ul className="mt-2 grid gap-px overflow-hidden rounded-xl border border-border bg-border">
                {rows.map((finding) => (
                  <FindingRow
                    key={finding.id}
                    finding={finding}
                    onConfirm={() => r.confirm(finding.id)}
                    onEdit={(value, reason) => r.edit(finding, value, reason)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Supporting material for this return — the specialist's own copy of a
          form or an advisor's note that the research didn't surface. */}
      <UploadBar className="mt-8" />
    </section>
  );
}

/** Partial state: the agent is still working, and the page stays usable. */
function Researching({ name, progress }: { name: string; progress: number }) {
  return (
    <section>
      <h2 className="text-[19px] font-medium tracking-tight text-heading">{name}</h2>
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
