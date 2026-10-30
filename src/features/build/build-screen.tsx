"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DraftActions } from "@/components/patterns/draft-actions";
import { Stepper } from "@/components/patterns/stepper";
import { ONBOARDING_STEPS } from "@/components/domain/onboarding-steps";
import { UploadBar } from "@/components/patterns/upload-bar";
import { copy, fill } from "@/lib/copy";
import { artifactsFor, crossFieldFor, dryRunFor, BE_RECONCILE_PERIOD } from "@/lib/mock/build";
import {
  ARTIFACT_GROUP_LABEL,
  type ArtifactGroup,
  type BuildPhase,
  type Check as CheckType,
} from "@/lib/types";
import { cn } from "@/lib/cn";
import { ArtifactRow } from "./artifact-row";
import { DryRunOutput } from "./dry-run-output";
import { ValidationPanel } from "./validation-panel";
import { backHref } from "@/features/steps/step-view";

const STEPS = ONBOARDING_STEPS;
const GROUPS: ArtifactGroup[] = ["schema", "boxes", "calculations"];

/** The kinds of lint finding the tally chips walk through. */
type FindingKind = "warn" | "fail";
/** The finding the expert was last taken to; `seq` re-fires a repeat jump. */
export type FindingFocus = { key: string; seq: number };

export function BuildScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const artifacts = React.useMemo(() => artifactsFor(countryCode), [countryCode]);
  const checks = React.useMemo(() => crossFieldFor(countryCode), [countryCode]);
  const dryRun = React.useMemo(() => dryRunFor(countryCode), [countryCode]);
  const [phase, setPhase] = React.useState<BuildPhase>("ready");
  const [appliedAt, setAppliedAt] = React.useState<string | null>(null);
  /** This step belongs to a developer; everyone else sees it read-only. */
  const [asDeveloper, setAsDeveloper] = React.useState(false);
  /** checkId → the reason a non-reconciling box was accepted anyway. */
  const [accepted, setAccepted] = React.useState<Record<string, string>>({});
  /** "artifactId:checkIndex" of lint findings the developer auto-fixed. */
  const [fixed, setFixed] = React.useState<ReadonlySet<string>>(new Set());
  /** The policy a finding opened, shown in a dialog. */
  const [policy, setPolicy] = React.useState<CheckType["policy"] | null>(null);

  /* A calculated box that neither reconciles nor has been settled holds the
     step: the quiet failure this validation exists to catch must reach a
     person before anything is applied. */
  const pendingValidations = checks.filter(
    (c) => c.state !== "ok" && accepted[c.id] === undefined,
  ).length;

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const statements = artifacts.length;

  /* The safety tally, read by severity and after any auto-fix: a warning the
     developer has fixed no longer counts. */
  const severity = React.useMemo(() => {
    let passed = 0;
    let warnings = 0;
    let blockers = 0;
    for (const a of artifacts) {
      a.checks.forEach((c, i) => {
        const state = fixed.has(`${a.id}:${i}`) ? "pass" : c.state;
        if (state === "pass") passed += 1;
        else if (state === "warn") warnings += 1;
        else blockers += 1;
      });
    }
    return { passed, warnings, blockers };
  }, [artifacts, fixed]);

  /* Every lint finding in reading order — the groups as the page lists them,
     then each file's checks top to bottom — keyed "artifactId:checkIndex". */
  const order = React.useMemo(
    () =>
      GROUPS.flatMap((g) => artifacts.filter((a) => a.group === g)).flatMap((a) =>
        a.checks.map((c, i) => ({ key: `${a.id}:${i}`, state: c.state })),
      ),
    [artifacts],
  );

  /* The findings of one kind still open, in that order. A fixed warning drops
     out, so walking them never lands on one already dealt with. */
  const openFindings = (kind: FindingKind) =>
    order.filter((f) => f.state === kind && !fixed.has(f.key)).map((f) => f.key);

  const [focus, setFocus] = React.useState<FindingFocus | null>(null);

  /* Go to the next open finding of a kind after the one last visited, wrapping
     to the first. Position is read from the full order, so if the last one was
     fixed in between, the walk carries on from where it stood. */
  function jumpTo(kind: FindingKind) {
    const open = openFindings(kind);
    if (open.length === 0) return;
    const keys = order.map((f) => f.key);
    const from = focus ? keys.indexOf(focus.key) : -1;
    const next = open.find((k) => keys.indexOf(k) > from) ?? open[0];
    setFocus({ key: next, seq: (focus?.seq ?? 0) + 1 });
  }

  /** Where the focused finding sits among the open ones of its kind. */
  function positionOf(key: string, kind: FindingKind) {
    const open = openFindings(kind);
    return { n: open.indexOf(key) + 1, total: open.length };
  }

  function resolvedFor(artifactId: string): ReadonlySet<number> {
    const indices = new Set<number>();
    for (const key of fixed) {
      const [id, idx] = key.split(":");
      if (id === artifactId) indices.add(Number(idx));
    }
    return indices;
  }

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
            href={backHref(countryCode, 3)}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            {copy.page.stepsLabel[3]}
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-medium tracking-tight text-heading">
                {countryName}
              </h1>
            </div>
            <DraftActions onDiscard={() => router.push("/countries")} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={4} completedCount={4} />
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
              className="text-[13px] font-medium text-brand underline decoration-brand/40 underline-offset-2 transition-colors hover:decoration-brand"
            >
              {asDeveloper ? "View as tax expert" : "View as developer"}
            </button>
          </div>

          <section className="mt-8">
            <h2 className="text-[17px] font-medium tracking-tight text-heading">
              What will be applied
            </h2>
            <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
              Generated from the rules approved in the previous step.{" "}
              <span className="tabular-nums">{statements}</span> files, each
              linted and dry-run against a copy of the test database and rolled
              back.
            </p>

            {/* The severity tally — the safety report at a glance, before the
                per-file detail below. Colour only where a finding needs an eye. */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-settled-quiet px-2 py-1 text-settled">
                <Check className="size-3.5" />
                {fill(copy.build.countPassed, { count: severity.passed })}
              </span>
              {/* A warning or blocker chip is the way to it: each click opens
                  the file holding the next one and lands on that finding. */}
              {severity.warnings > 0 && (
                <button
                  type="button"
                  onClick={() => jumpTo("warn")}
                  aria-label={copy.build.jumpToWarning}
                  title={copy.build.jumpToWarning}
                  className="inline-flex items-center gap-1.5 rounded-md bg-attention-quiet px-2 py-1 text-attention-text transition-[filter,transform] hover:brightness-[0.97] active:scale-[0.98]"
                >
                  <TriangleAlert className="size-3.5" />
                  {fill(
                    severity.warnings === 1
                      ? copy.build.countWarning
                      : copy.build.countWarningPlural,
                    { count: severity.warnings },
                  )}
                  <ArrowDown className="size-3.5 opacity-70" />
                </button>
              )}
              {severity.blockers > 0 && (
                <button
                  type="button"
                  onClick={() => jumpTo("fail")}
                  aria-label={copy.build.jumpToBlocker}
                  title={copy.build.jumpToBlocker}
                  className="inline-flex items-center gap-1.5 rounded-md bg-risk-quiet px-2 py-1 text-risk transition-[filter,transform] hover:brightness-[0.97] active:scale-[0.98]"
                >
                  <TriangleAlert className="size-3.5" />
                  {fill(
                    severity.blockers === 1
                      ? copy.build.countBlocker
                      : copy.build.countBlockerPlural,
                    { count: severity.blockers },
                  )}
                  <ArrowDown className="size-3.5 opacity-70" />
                </button>
              )}
            </div>
          </section>

          <div className="mt-10 space-y-8">
            {GROUPS.map((group) => {
              const rows = artifacts.filter((a) => a.group === group);
              if (rows.length === 0) return null;

              return (
                <section key={group}>
                  <h3 className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
                    {ARTIFACT_GROUP_LABEL[group]}
                  </h3>
                  <ul className="mt-2 border-t border-border">
                    {rows.map((artifact, i) => (
                      <ArtifactRow
                        key={artifact.id}
                        artifact={artifact}
                        index={i}
                        resolved={resolvedFor(artifact.id)}
                        focus={
                          focus && focus.key.startsWith(`${artifact.id}:`)
                            ? {
                                index: Number(focus.key.split(":")[1]),
                                seq: focus.seq,
                                ...positionOf(
                                  focus.key,
                                  artifact.checks[Number(focus.key.split(":")[1])].state === "fail"
                                    ? "fail"
                                    : "warn",
                                ),
                              }
                            : undefined
                        }
                        onNextFinding={(kind) => jumpTo(kind)}
                        onAutoFix={(checkIndex) =>
                          setFixed((prev) => {
                            const next = new Set(prev);
                            next.add(`${artifact.id}:${checkIndex}`);
                            return next;
                          })
                        }
                        onViewPolicy={setPolicy}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <DryRunOutput dryRun={dryRun} />

          <ValidationPanel
            checks={checks}
            period={BE_RECONCILE_PERIOD}
            accepted={accepted}
            onAccept={(id, reason) =>
              setAccepted((a) => ({ ...a, [id]: reason }))
            }
            onUndo={(id) =>
              setAccepted((a) => {
                const next = { ...a };
                delete next[id];
                return next;
              })
            }
          />

          {/* Supporting material for the build — a reference export or a schema
              to check the generated files against. */}
          <UploadBar className="mt-8" />

          <ApplyPanel
            phase={phase}
            appliedAt={appliedAt}
            canApply={asDeveloper}
            pendingValidations={pendingValidations}
            lintBlockers={severity.blockers}
            onApply={apply}
            onReapply={() => setPhase("ready")}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={backHref(countryCode, 3)}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
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
                  {copy.page.continue}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                {copy.page.continue}
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* The policy behind a finding — the rule and why it exists, so "View
          policy" answers "on what basis?" without leaving the step. */}
      <Dialog open={policy !== null} onOpenChange={(open) => !open && setPolicy(null)}>
        <DialogContent>
          <DialogTitle>{policy?.name}</DialogTitle>
          <DialogDescription>{policy?.detail}</DialogDescription>
          <div className="mt-5 flex justify-end">
            <Button variant="filled" size="sm" onClick={() => setPolicy(null)}>
              {copy.build.policyClose}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplyPanel({
  phase,
  appliedAt,
  canApply,
  pendingValidations,
  lintBlockers,
  onApply,
  onReapply,
}: {
  phase: BuildPhase;
  appliedAt: string | null;
  canApply: boolean;
  pendingValidations: number;
  /** Unresolved lint blockers — a file that cannot safely run as written. */
  lintBlockers: number;
  onApply: () => void;
  onReapply: () => void;
}) {
  /** The validation message is specific to cross-field checks; a lint blocker
      disables the apply too, but does not borrow that message. */
  const blocked = pendingValidations > 0;
  const canRun = canApply && !blocked && lintBlockers === 0;
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
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-text"
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
              {blocked ? (
                <span className="text-attention-text">
                  {(pendingValidations === 1
                    ? copy.validation.blocked
                    : copy.validation.blockedPlural
                  ).replace("{count}", String(pendingValidations))}
                </span>
              ) : canApply ? (
                "Runs these files against Comply's test database. Production is untouched until both approvals are in."
              ) : (
                "A Fintua developer runs this. Production is untouched until both approvals are in."
              )}
            </p>
          </div>

          <Button
            variant="primary"
            disabled={!canRun || phase === "applying"}
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
