"use client";

import * as React from "react";
import { ArrowDown, ChevronDown, Check, TriangleAlert, X, Wand2, ShieldCheck } from "lucide-react";
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
  focus,
  onNextFinding,
  onAutoFix,
  onViewPolicy,
}: {
  artifact: BuildArtifact;
  index: number;
  /** Indices of this file's checks that have been auto-fixed. */
  resolved: ReadonlySet<number>;
  /** The finding the expert was just taken to in this file, if any: which
      check, a sequence that re-fires a repeat jump, and its place among the
      open findings of its kind. */
  focus?: { index: number; seq: number; n: number; total: number };
  /** Go on to the next open finding of the same kind. */
  onNextFinding: (kind: "warn" | "fail") => void;
  onAutoFix: (checkIndex: number) => void;
  onViewPolicy: (policy: NonNullable<CheckType["policy"]>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const rowRef = React.useRef<HTMLLIElement>(null);
  /** The check the expert was just taken to, held briefly as a highlight. */
  const [landed, setLanded] = React.useState<number | null>(null);

  /* Taken here from the tally: open the file and mark the finding. Adjusted
     during render on each new jump, so the open file paints in one pass. */
  const focusIndex = focus?.index;
  const focusSeq = focus?.seq;
  const [seenSeq, setSeenSeq] = React.useState<number | undefined>(undefined);
  if (focusIndex !== undefined && focusSeq !== seenSeq) {
    setSeenSeq(focusSeq);
    setOpen(true);
    setLanded(focusIndex);
  }

  /* Then, once the checks are on the page, bring the finding to the middle of
     the screen and let the highlight fade. */
  React.useEffect(() => {
    if (focusIndex === undefined) return;
    const frame = requestAnimationFrame(() => {
      const el = rowRef.current?.querySelector<HTMLElement>(`[data-check="${focusIndex}"]`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
    const fade = setTimeout(() => setLanded(null), 2400);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fade);
    };
  }, [focusIndex, focusSeq]);

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
      ref={rowRef}
      className="rise border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-start gap-4 py-4 text-left"
      >
        {/* The file name is set in Mona Sans like every other name in the app;
            only the SQL inside, once expanded, takes the mono face. */}
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium leading-5 text-text">
            {artifact.fileName}
          </span>
          <span className="mt-1 block max-w-[64ch] text-[13px] leading-5 text-text-muted">
            {artifact.summary}
          </span>
        </span>

        {/* One mark for the file, details on expand. */}
        <span
          className={cn(
            "hidden h-5 shrink-0 items-center gap-1.5 text-[12px] sm:flex",
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
            "mt-[3px] size-3.5 shrink-0 text-text-faint transition-[color,transform] group-hover:text-text-muted duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
                <div
                  key={check.label}
                  data-check={i}
                  className={cn(
                    "-mx-2 flex scroll-mt-24 items-baseline gap-2.5 rounded-md px-2 py-1 text-[13px] transition-colors duration-700",
                    landed === i && (state === "fail" ? "bg-risk-quiet" : "bg-attention-quiet"),
                  )}
                >
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
                    {/* Reached from the tally with more to go: the way on to
                        the next one, so the expert never scrolls back up. */}
                    {focus?.index === i && focus.total > 1 && state !== "pass" && (
                      <span className="mt-1.5 flex items-center gap-2 text-[12px]">
                        <span className="tabular-nums text-text-faint">
                          {fill(copy.build.findingPosition, { n: focus.n, total: focus.total })}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNextFinding(state === "fail" ? "fail" : "warn")}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-[filter,transform] hover:brightness-[0.97] active:scale-[0.98]",
                            state === "fail" ? "bg-risk-quiet text-risk" : "bg-attention-quiet text-attention-text",
                          )}
                        >
                          {state === "fail" ? copy.build.nextBlocker : copy.build.nextWarning}
                          <ArrowDown className="size-3.5" />
                        </button>
                      </span>
                    )}

                    {(check.line || check.autoFix || check.policy) && !fixed && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        {check.line && (
                          <span className="rounded bg-wash px-1.5 py-0.5 text-[11px] text-text-muted">
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
