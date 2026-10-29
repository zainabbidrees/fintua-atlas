import Link from "next/link";
import { Check, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

export interface Step {
  id: string;
  label: string;
  /** A step the AI does the work of; it carries a sparkle after its name. */
  ai?: boolean;
}

/**
 * Where you are in the six steps.
 *
 * Later steps read as locked rather than merely dim — an expert should be able
 * to tell at a glance that they're unreachable, not just unvisited.
 *
 * Steps already reached can be opened: give `hrefFor` and each one it returns
 * a link for becomes one. `reachedIndex` is the furthest step reached — while
 * looking back at an earlier step it is the one you came from, which stays
 * open (neither done nor locked) so you can return to it.
 */
export function Stepper({
  steps,
  currentIndex,
  completedCount,
  reachedIndex = currentIndex,
  hrefFor,
}: {
  steps: Step[];
  currentIndex: number;
  completedCount: number;
  reachedIndex?: number;
  hrefFor?: (index: number) => string | undefined;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const current = i === currentIndex;
        const done = i < completedCount && !current;
        const locked = i > Math.max(currentIndex, reachedIndex);
        /* Reached but neither done nor current: the step you came from. */
        const open = !done && !current && !locked;
        const href = current || locked ? undefined : hrefFor?.(i);
        const Box = href ? Link : "div";

        return (
          <li key={step.id} className="flex items-center gap-1.5">
            <Box
              href={href as string}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                current && "border-brand-edge bg-brand-quiet",
                done && "border-transparent bg-surface-sunken",
                open && "border-border-strong bg-surface",
                locked && "border-transparent",
                href &&
                  "hover:border-brand-edge focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                  done && "bg-settled text-on-brand",
                  current && "bg-brand text-on-brand",
                  open && "border border-border-strong text-text-muted",
                  locked && "border border-border-strong text-text-faint",
                )}
              >
                {done ? <Check className="size-3" /> : locked ? <Lock className="size-2.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[13px]",
                  current && "font-semibold text-brand",
                  done && "font-medium text-text-muted",
                  open && "font-medium text-text",
                  locked && "text-text-faint",
                )}
              >
                {step.label}
              </span>
              {step.ai && (
                <>
                  <Sparkles
                    aria-hidden
                    className={cn(
                      "-ml-0.5 size-3.5 shrink-0",
                      current && "text-brand",
                      done && "text-text-muted",
                      open && "text-text-muted",
                      locked && "text-text-faint",
                    )}
                  />
                  <span className="sr-only">{copy.page.aiStep}</span>
                </>
              )}
            </Box>

            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-3 shrink-0",
                  done ? "bg-settled" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Compact form for narrow containers, where labels would truncate to nonsense.
 * Same visual language as the progress marks on the countries list.
 */
export function StepMarks({
  total,
  completed,
  label,
}: {
  total: number;
  completed: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-colors",
              i < completed ? "w-8 bg-settled" : "w-8 bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
    </div>
  );
}
