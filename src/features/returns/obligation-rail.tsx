"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ObligationRun } from "@/lib/types";

/**
 * The return types, each openable in any order.
 *
 * A cleared return is ticked, the one being viewed carries the card, and the
 * rest show their outstanding count — none is locked, so the reviewer can jump
 * to whichever return they want. A progress bar at the top says how far through
 * the country they are.
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
  return (
    <nav aria-label="Return types">
      <div className="px-1">
        <p className="text-[13px] font-semibold tracking-tight text-text">
          Return types
        </p>
      </div>

      <ol className="mt-4 space-y-1.5">
        {obligations.map((o, i) => {
          const settled = isSettled(o);
          /* No gating — any return can be opened, so the reviewer works them in
             whatever order suits. Emphasis is on the one being viewed. */
          const active = o.id === selectedId;
          const running = o.agent === "running";
          const todo = outstanding(o);
          const toConfirm = o.findings.filter(
            (f) => f.state === "corroborated",
          ).length;

          const sub = settled
            ? "Confirmed"
            : running
              ? "Researching…"
              : todo > 0
                ? `${todo} to review`
                : `${toConfirm} to confirm`;

          return (
            <li key={o.id}>
              {/* The node lives inside the block, centred on the row. Every
                  return is openable; the active one carries the card and a
                  brand node, the rest a quiet numbered one. */}
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset",
                  "transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active
                    ? "bg-surface ring-border-strong shadow-[var(--shadow-raised)]"
                    : "ring-transparent hover:bg-surface hover:ring-border hover:shadow-[var(--shadow-raised)] active:scale-[0.99]",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-inset transition-colors",
                    settled
                      ? "bg-settled text-on-brand"
                      : active
                        ? "bg-brand text-on-brand"
                        : "bg-surface-sunken text-text-muted ring-1 ring-border",
                  )}
                >
                  {settled ? (
                    <Check className="size-3" />
                  ) : running ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium tracking-tight text-text">
                    {o.name}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[12px]",
                      !settled && todo > 0 ? "text-attention-text" : "text-text-faint",
                    )}
                  >
                    {sub}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
