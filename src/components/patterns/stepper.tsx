import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Step {
  id: string;
  label: string;
}

/**
 * Where you are in the five steps.
 *
 * Later steps read as locked rather than merely dim — an expert should be able
 * to tell at a glance that they're unreachable, not just unvisited.
 */
export function Stepper({
  steps,
  currentIndex,
  completedCount,
}: {
  steps: Step[];
  currentIndex: number;
  completedCount: number;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((step, i) => {
        const done = i < completedCount;
        const current = i === currentIndex;
        const locked = i > currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                current && "border-brand-edge bg-brand-quiet",
                done && "border-transparent bg-surface-sunken",
                locked && "border-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
                  done && "bg-settled text-on-brand",
                  current && "bg-brand text-on-brand",
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
                  locked && "text-text-faint",
                )}
              >
                {step.label}
              </span>
            </div>

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
