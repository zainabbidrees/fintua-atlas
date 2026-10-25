"use client";

import { Check, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ObligationRun } from "@/lib/types";

/**
 * The return types, worked as a gated sequence.
 *
 * Each return is a step on a spine: the ones you've cleared are ticked, the one
 * you're on is live, and the rest are locked until you clear it. A progress bar
 * at the top says how far through the country you are. This is a deliberate
 * change from working them in parallel — the sequence keeps the specialist on
 * one return at a time and makes "what's left" unmistakable.
 */
export function ObligationRail({
  obligations,
  selectedId,
  onSelect,
  outstanding,
  isSettled,
}: {
  obligations: ObligationRun[];
  selectedId: string;
  onSelect: (id: string) => void;
  outstanding: (o: ObligationRun) => number;
  isSettled: (o: ObligationRun) => boolean;
}) {
  const total = obligations.length;
  const clearedCount = obligations.filter(isSettled).length;
  /* The step you're on: the first that isn't cleared. Everything after it is
     locked; -1 means the whole country is done. */
  const currentIndex = obligations.findIndex((o) => !isSettled(o));

  return (
    <nav aria-label="Return types" className="lg:sticky lg:top-8">
      <div className="px-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-semibold tracking-tight text-text">
            Return types
          </p>
          <p className="text-[12px] tabular-nums text-text-faint">
            <span className="font-medium text-text-muted">{clearedCount}</span> of{" "}
            {total} cleared
          </p>
        </div>

        {/* How far through the country's returns the specialist is. */}
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-border">
          <div
            className="h-full rounded-full bg-settled transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${(clearedCount / total) * 100}%` }}
          />
        </div>
      </div>

      <ol className="mt-5">
        {obligations.map((o, i) => {
          const settled = isSettled(o);
          const current = i === currentIndex;
          const locked = !settled && !current;
          const clickable = settled || current;
          /* Emphasis follows what's open on the right; the node still marks the
             current step even when a cleared step is being reviewed. */
          const active = o.id === selectedId;
          const isLast = i === total - 1;
          const running = o.agent === "running";
          const todo = outstanding(o);
          const toConfirm = o.findings.filter(
            (f) => f.state === "corroborated",
          ).length;

          const sub = settled
            ? "Confirmed"
            : current
              ? running
                ? "Researching…"
                : todo > 0
                  ? `${todo} to review`
                  : `${toConfirm} to confirm`
              : "Locked";

          return (
            <li key={o.id} className="flex gap-3">
              {/* Node + spine. The segment below a cleared node is green, so
                  the line fills as the sequence is worked. */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-inset transition-colors",
                    settled && "bg-settled text-on-brand",
                    current && "bg-brand text-on-brand ring-4 ring-brand-quiet",
                    locked && "bg-surface-sunken text-text-faint ring-1 ring-border",
                  )}
                >
                  {settled ? (
                    <Check className="size-3.5" />
                  ) : current && running ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : locked ? (
                    <Lock className="size-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "my-1 w-px flex-1 rounded-full",
                      settled ? "bg-settled" : "bg-border",
                    )}
                  />
                )}
              </div>

              {/* The step itself. Locked steps can't be opened. */}
              <button
                type="button"
                onClick={() => clickable && onSelect(o.id)}
                disabled={!clickable}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "mb-4 min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset",
                  "transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active &&
                    "bg-surface ring-brand-edge shadow-[var(--shadow-raised)]",
                  clickable &&
                    !active &&
                    "ring-transparent hover:bg-surface hover:ring-border hover:shadow-[var(--shadow-raised)] active:scale-[0.99]",
                  locked && "cursor-not-allowed ring-transparent",
                )}
              >
                <span
                  className={cn(
                    "block truncate text-[14px] font-medium tracking-tight",
                    locked ? "text-text-faint" : "text-text",
                  )}
                >
                  {o.name}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block truncate text-[12px]",
                    current && todo > 0 ? "text-attention-text" : "text-text-faint",
                  )}
                >
                  {sub}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
