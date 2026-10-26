"use client";

import * as React from "react";
import { ChevronDown, Check, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BuildArtifact, CheckState } from "@/lib/types";

const MARK: Record<CheckState, { icon: typeof Check; tone: string }> = {
  pass: { icon: Check, tone: "text-settled" },
  warn: { icon: TriangleAlert, tone: "text-attention-text" },
  fail: { icon: X, tone: "text-risk" },
};

/**
 * One generated file.
 *
 * The checks lead and the SQL is behind a disclosure, because the SQL is
 * derived from datasets already approved in step 3 — reading it is assurance,
 * not design. The plain-English summary means the step stays legible to the
 * tax specialist who owns everything either side of it.
 *
 * No code/diff toggle. On a first onboarding there is no previous version to
 * diff against; comparison belongs in Approval, where versions exist.
 */
export function ArtifactRow({
  artifact,
  index,
}: {
  artifact: BuildArtifact;
  index: number;
}) {
  const [open, setOpen] = React.useState(false);
  const worst: CheckState = artifact.checks.some((c) => c.state === "fail")
    ? "fail"
    : artifact.checks.some((c) => c.state === "warn")
      ? "warn"
      : "pass";

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
              ? "1 warning"
              : "Failed"}
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
          <dl className="space-y-1.5">
            {artifact.checks.map((check) => {
              const Icon = MARK[check.state].icon;
              return (
                <div key={check.label} className="flex items-baseline gap-2.5 text-[13px]">
                  <Icon
                    aria-hidden
                    className={cn("size-3.5 shrink-0 translate-y-0.5", MARK[check.state].tone)}
                  />
                  <dt className="w-24 shrink-0 text-text-muted">{check.label}</dt>
                  <dd
                    className={cn(
                      "min-w-0",
                      check.state === "pass" ? "text-text-muted" : MARK[check.state].tone,
                    )}
                  >
                    {check.detail}
                  </dd>
                </div>
              );
            })}
          </dl>

          <pre className="mt-4 overflow-x-auto rounded-lg bg-surface-sunken p-4 font-mono text-[12px] leading-relaxed text-text">
            <code>{artifact.sql}</code>
          </pre>
        </div>
      )}
    </li>
  );
}
