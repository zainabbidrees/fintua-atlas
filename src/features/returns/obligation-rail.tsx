"use client";

import { cn } from "@/lib/cn";
import type { ObligationRun } from "@/lib/types";

/**
 * The obligations carried through from scope, each with its own agent.
 *
 * They run in parallel, so this rail is both a navigator and a status board:
 * one obligation can still be researching while the specialist works another.
 * Nothing here waits on anything else.
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
    <nav aria-label="Obligations" className="lg:sticky lg:top-8">
      <p className="px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-text-faint">
        Obligations
      </p>

      <ul className="mt-3 space-y-1">
        {obligations.map((o) => {
          const active = o.id === selectedId;
          const todo = outstanding(o);
          const settled = isSettled(o);
          const running = o.agent === "running";

          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "group relative w-full rounded-xl px-3.5 py-3 text-left transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active ? "bg-surface" : "hover:bg-surface/70",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-2 left-0 w-[2px] origin-center rounded-full bg-brand transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active ? "scale-y-100" : "scale-y-0",
                  )}
                />

                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-[14px] font-medium tracking-tight",
                        active ? "text-text" : "text-text-muted",
                      )}
                    >
                      {o.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-text-faint">
                      {running
                        ? "Researching…"
                        : todo > 0
                          ? `${todo} to review`
                          : settled
                            ? "Confirmed"
                            : `${o.findings.length} findings`}
                    </span>
                  </span>

                </span>

                {running && (
                  <span
                    aria-hidden
                    className="mt-2.5 block h-[3px] overflow-hidden rounded-full bg-border"
                  >
                    <span
                      className="block h-full rounded-full bg-brand transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ width: `${o.progress}%` }}
                    />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
