"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/patterns/stepper";
import { copy } from "@/lib/copy";
import { artifactsFor } from "@/lib/mock/build";
import { ARTIFACT_GROUP_LABEL, type ArtifactGroup, type BuildPhase } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ArtifactRow } from "./artifact-row";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));
const GROUPS: ArtifactGroup[] = ["schema", "boxes", "calculations"];

export function BuildScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const artifacts = React.useMemo(() => artifactsFor(countryCode), [countryCode]);
  const [phase, setPhase] = React.useState<BuildPhase>("ready");
  const [appliedAt, setAppliedAt] = React.useState<string | null>(null);
  /** This step belongs to a developer; everyone else sees it read-only. */
  const [asDeveloper, setAsDeveloper] = React.useState(false);

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const warnings = artifacts.filter((a) =>
    a.checks.some((c) => c.state === "warn"),
  ).length;
  const statements = artifacts.length;

  function apply() {
    setPhase("applying");
    timer.current = setTimeout(() => {
      setPhase("applied");
      setAppliedAt(
        new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 1800);
  }

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={`/countries/${countryCode}/rules`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Specs &amp; Datasets
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
              <Stepper steps={STEPS} currentIndex={3} completedCount={3} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* Honest about ownership, and switchable so both sides are reviewable. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl bg-surface px-4 py-3">
            <p className="text-[13px] text-text-muted">
              {asDeveloper
                ? "Viewing as Priya Shah · Fintua developer"
                : "This step is applied by a Fintua developer. You have read access."}
            </p>
            <button
              type="button"
              onClick={() => setAsDeveloper((d) => !d)}
              className="text-[13px] font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand hover:underline"
            >
              {asDeveloper ? "View as tax expert" : "View as developer"}
            </button>
          </div>

          <section className="mt-8">
            <h2 className="text-[17px] font-semibold tracking-tight text-text">
              What will be applied
            </h2>
            <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
              Generated from the rules approved in the previous step.{" "}
              <span className="tabular-nums">{statements}</span> files, each
              linted and dry-run against a copy of the test database and rolled
              back.
              {warnings > 0 && (
                <>
                  {" "}
                  <span className="text-attention-text">
                    <span className="tabular-nums">{warnings}</span> raised a
                    warning that does not block the run.
                  </span>
                </>
              )}
            </p>
          </section>

          <div className="mt-8 space-y-10">
            {GROUPS.map((group) => {
              const rows = artifacts.filter((a) => a.group === group);
              if (rows.length === 0) return null;

              return (
                <section key={group}>
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
                    {ARTIFACT_GROUP_LABEL[group]}
                  </h3>
                  <ul className="mt-1 border-t border-border">
                    {rows.map((artifact, i) => (
                      <ArtifactRow key={artifact.id} artifact={artifact} index={i} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <ApplyPanel
            phase={phase}
            appliedAt={appliedAt}
            canApply={asDeveloper}
            onApply={apply}
            onReapply={() => setPhase("ready")}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${countryCode}/rules`}>{copy.page.back}</Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {phase !== "applied" && (
              <span className="text-sm text-text-muted">
                Apply to test before requesting approval
              </span>
            )}
            {phase === "applied" ? (
              <Button variant="primary" asChild>
                <Link href={`/countries/${countryCode}/approval`}>
                  Continue to Approval &amp; Publish
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                Continue to Approval &amp; Publish
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplyPanel({
  phase,
  appliedAt,
  canApply,
  onApply,
  onReapply,
}: {
  phase: BuildPhase;
  appliedAt: string | null;
  canApply: boolean;
  onApply: () => void;
  onReapply: () => void;
}) {
  return (
    <section className="mt-12 border-t border-border pt-6">
      {phase === "applied" ? (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-settled-quiet">
              <Check className="size-3 text-settled" />
            </span>
            <div>
              <p className="text-[14px] font-medium text-text">
                Applied to the test environment
              </p>
              <p className="mt-0.5 text-[13px] text-text-muted">
                {appliedAt} · Belgium is now fileable in test. Nothing has
                touched production.
              </p>
            </div>
          </div>
          {canApply && (
            <button
              type="button"
              onClick={onReapply}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-brand"
            >
              <RotateCcw className="size-3.5" />
              Apply again
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-[14px] font-medium text-text">
              Apply to the test environment
            </p>
            <p className="mt-0.5 max-w-[58ch] text-[13px] leading-relaxed text-text-muted">
              {canApply
                ? "Runs these files against Comply's test database. Production is untouched until both approvals are in."
                : "A Fintua developer runs this. Production is untouched until both approvals are in."}
            </p>
          </div>

          <Button
            variant="primary"
            disabled={!canApply || phase === "applying"}
            onClick={onApply}
            className={cn(phase === "applying" && "cursor-wait")}
          >
            {phase === "applying" ? (
              <>
                <Loader2 className="animate-spin" />
                Applying
              </>
            ) : (
              "Apply to test"
            )}
          </Button>
        </div>
      )}

      {phase === "failed" && (
        <p className="mt-3 flex items-start gap-2 text-[13px] text-risk">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          The run stopped at 002_return_types.sql and was rolled back. Nothing
          was written.
        </p>
      )}
    </section>
  );
}
