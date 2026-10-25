"use client";

import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SpecStage } from "@/lib/types";

/**
 * The three parts of this step, drawn as a sequence rather than a menu.
 *
 * Step 2's rail lists obligations that run in parallel and can be worked in
 * any order. This one must not read the same way: a rule cites a grid and a
 * rate code that the earlier parts declare, so the order is a dependency, not
 * a suggestion. Hence the spine — a continuous line that fills behind you,
 * locks ahead of you, and never lets a part be opened out of turn.
 */
export function StageRail({
  stages,
  stageIndex,
  openIn,
  reachable,
  onSelect,
}: {
  stages: SpecStage[];
  stageIndex: number;
  openIn: (stage: SpecStage) => number;
  reachable: (index: number) => boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Parts of this step" className="lg:sticky lg:top-8">
      <p className="text-[13px] font-semibold tracking-tight text-text">
        Specs &amp; datasets
      </p>

      <ol className="mt-5 flex gap-x-2 overflow-x-auto pb-2 lg:block lg:overflow-visible lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage, i) => {
          const open = openIn(stage);
          const done = open === 0 && i < stageIndex;
          const current = i === stageIndex;
          const locked = !reachable(i);
          const last = i === stages.length - 1;

          return (
            <li
              key={stage.id}
              className="relative shrink-0 lg:shrink lg:pb-1"
              style={{ "--index": i } as React.CSSProperties}
            >
              {/* The spine. Filled behind you, hairline ahead. */}
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute hidden lg:block",
                    "left-[23px] top-[2.4rem] h-[calc(100%-1.9rem)] w-px transition-colors duration-500",
                    done ? "bg-settled" : "bg-border-strong",
                  )}
                />
              )}

              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(i)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "group relative flex w-52 items-start gap-3 rounded-xl p-2.5 text-left transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:w-full",
                  locked ? "cursor-not-allowed" : "hover:bg-surface",
                  current && "bg-surface",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 mt-px grid size-[26px] shrink-0 place-items-center rounded-full border text-[12px] font-semibold transition-colors",
                    done && "border-settled bg-settled text-on-brand",
                    current && "border-brand bg-brand text-on-brand",
                    !done && !current && "border-border-strong bg-canvas text-text-faint",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5" />
                  ) : locked ? (
                    <Lock className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[14px] font-medium tracking-tight",
                      current ? "text-text" : locked ? "text-text-faint" : "text-text-muted",
                    )}
                  >
                    {stage.label}
                  </span>

                  <span
                    className={cn(
                      "mt-0.5 block text-[12px]",
                      open > 0 && (current || done)
                        ? "text-attention-text"
                        : "text-text-faint",
                    )}
                  >
                    {locked
                      ? `Opens after ${stages[i - 1]?.label ?? "the previous part"}`
                      : open > 0
                        ? `${open} to settle`
                        : done
                          ? "Settled"
                          : "Ready to continue"}
                  </span>

                  {current && (
                    <span className="mt-2 hidden max-w-[22ch] text-[12px] leading-relaxed text-text-muted lg:block">
                      {stage.purpose}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
