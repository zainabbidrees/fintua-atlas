"use client";

import * as React from "react";
import { ChevronDown, Check, TriangleAlert, X, Wand2, ShieldCheck } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";
import { copy, fill } from "@/lib/copy";
import { cn } from "@/lib/cn";
import type { BuildArtifact, Check as CheckType, CheckState } from "@/lib/types";

const MARK: Record<CheckState, { icon: typeof Check; tone: string }> = {
  pass: { icon: Check, tone: "text-settled" },
  warn: { icon: TriangleAlert, tone: "text-attention-text" },
  fail: { icon: X, tone: "text-risk" },
};

const LINE_TONE: Record<CheckState, "attention" | "risk" | "settled"> = {
  pass: "settled",
  warn: "attention",
  fail: "risk",
};

/**
 * One generated file.
 *
 * The checks lead and the SQL is behind a disclosure, because the SQL is
 * derived from datasets already approved in step 3 — reading it is assurance,
 * not design. A finding that points at a line tints that line in the code, so
 * the report and the SQL read as one thing; an auto-fixable finding can be
 * settled in place.
 *
 * No code/diff toggle. On a first onboarding there is no previous version to
 * diff against; comparison belongs in Approval, where versions exist.
 */
export function ArtifactRow({
  artifact,
  index,
  resolved,
  onAutoFix,
  onViewPolicy,
}: {
  artifact: BuildArtifact;
  index: number;
  /** Indices of this file's checks that have been auto-fixed. */
  resolved: ReadonlySet<number>;
  onAutoFix: (checkIndex: number) => void;
  onViewPolicy: (policy: NonNullable<CheckType["policy"]>) => void;
}) {
  const [open, setOpen] = React.useState(false);

  /** A fixed warning no longer counts against the file. */
  const effective = (check: CheckType, i: number): CheckState =>
    resolved.has(i) ? "pass" : check.state;

  const worst: CheckState = artifact.checks.some((c, i) => effective(c, i) === "fail")
    ? "fail"
    : artifact.checks.some((c, i) => effective(c, i) === "warn")
      ? "warn"
      : "pass";

  const warnings = artifact.checks.filter((c, i) => effective(c, i) === "warn").length;

  const marks: Record<number, "attention" | "risk" | "settled"> = {};
  artifact.checks.forEach((c, i) => {
    if (c.line) marks[c.line] = LINE_TONE[effective(c, i)];
  });

  return (
    <li
      className="rise border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-wash/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[13px] text-text">
            {artifact.fileName}
          </span>
          <span className="mt-1 block max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
            {artifact.summary}
          </span>
        </span>

        {/* One mark for the file, details on expand. */}
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1.5 text-[12px] sm:flex",
            worst === "pass" ? "text-text-faint" : MARK[worst].tone,
          )}
        >
          {worst === "pass"
            ? "Checks passed"
            : worst === "warn"
              ? warnings === 1
                ? "1 warning"
                : `${warnings} warnings`
              : "Blocked"}
        </span>

        <ChevronDown
          aria-hidden
          className={cn(
            "mt-0.5 size-3.5 shrink-0 text-text-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="pb-5">
          <dl className="space-y-2.5">
            {artifact.checks.map((check, i) => {
              const state = effective(check, i);
              const Icon = MARK[state].icon;
              const fixed = resolved.has(i) && check.state !== "pass";
              return (
                <div key={check.label} className="flex items-baseline gap-2.5 text-[13px]">
                  <Icon
                    aria-hidden
                    className={cn("size-3.5 shrink-0 translate-y-0.5", MARK[state].tone)}
                  />
                  <dt className="w-24 shrink-0 text-text-muted">{check.label}</dt>
                  <dd className="min-w-0 flex-1">
                    <span className={cn(state === "pass" ? "text-text-muted" : MARK[state].tone)}>
                      {fixed ? copy.build.autoFixed : check.detail}
                    </span>

                    {/* Line anchor and the two actions a finding can offer. */}
                    {(check.line || check.autoFix || check.policy) && !fixed && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        {check.line && (
                          <span className="rounded bg-wash px-1.5 py-0.5 font-mono text-[11px] text-text-muted">
                            {fill(copy.build.lineLabel, { line: check.line })}
                          </span>
                        )}
                        {check.autoFix && (
                          <button
                            type="button"
                            onClick={() => onAutoFix(i)}
                            className="inline-flex items-center gap-1 rounded-md bg-brand-quiet px-2 py-1 text-[12px] font-medium text-brand transition-colors hover:bg-brand-edge"
                          >
                            <Wand2 className="size-3.5" />
                            {copy.build.autoFix}
                          </button>
                        )}
                        {check.policy && (
                          <button
                            type="button"
                            onClick={() => onViewPolicy(check.policy!)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-text-muted transition-colors hover:bg-wash hover:text-text"
                          >
                            <ShieldCheck className="size-3.5" />
                            {copy.build.viewPolicy}
                          </button>
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <CodeBlock code={artifact.sql} marks={marks} className="mt-4" />
        </div>
      )}
    </li>
  );
}
