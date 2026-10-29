"use client";

import * as React from "react";
import { LiveTrail } from "./live-trail";

/** How long each line of an agent's trail takes to land. */
const PACE_MS = Number(process.env.NEXT_PUBLIC_MOCK_PACE_MS ?? 700) * 1.1;

/**
 * Plays an agent's run on arrival: one trail line at a time, then done.
 * `shown` is how many lines have landed; `running` is false once the last has.
 */
export function useAgentRun(lines: number, paceMs: number = PACE_MS) {
  const [shown, setShown] = React.useState(1);
  const running = shown <= lines;
  React.useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setShown((n) => n + 1), paceMs);
    return () => clearTimeout(id);
  }, [shown, running, paceMs]);
  return { shown, running };
}

/**
 * The agent at work: what it is doing right now, how far along it is, and the
 * shape of what it is producing — so the wait reads as work, not as a stall.
 * `children` draws that shape; without it, a plain set of rows stands in.
 */
export function AgentWorking({
  title,
  hint,
  trailLabel,
  trail,
  shown,
  children,
}: {
  title: string;
  hint: string;
  trailLabel: string;
  trail: readonly string[];
  shown: number;
  children?: React.ReactNode;
}) {
  const total = trail.length;
  const done = Math.min(shown - 1, total);

  return (
    <section
      aria-live="polite"
      aria-busy
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]"
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium">{title}</h3>
          <span className="text-[13px] text-text-muted" data-numeric>
            {done} / {total}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-text-muted">{hint}</p>
        {/* Determinate, and moved by the work itself rather than looping. */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full origin-left rounded-full bg-brand transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `scaleX(${(done + 0.5) / (total + 0.5)})` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 px-5 py-6 md:flex-row">
        <LiveTrail
          className="md:w-80 md:shrink-0"
          label={trailLabel}
          entries={trail.slice(0, shown).map((text, i) => ({ id: String(i), text, at: i }))}
        />
        <div className="min-w-0 flex-1" aria-hidden>
          {children ?? <RowsShape />}
        </div>
      </div>
    </section>
  );
}

/** A header band, then rows of varying length. */
function RowsShape() {
  return (
    <>
      <div className="flex gap-5 border-b border-border pb-2.5">
        {[56, 80, 120, 64].map((w, i) => (
          <span key={i} className="h-3 rounded bg-border-strong" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-4 space-y-3.5">
        {Array.from({ length: 7 }, (_, r) => (
          <div key={r} className="grid grid-cols-[6rem_8rem_minmax(0,1fr)_5rem] gap-4">
            <span className="h-3 animate-pulse rounded bg-surface-sunken" />
            <span className="h-3 animate-pulse rounded bg-surface-sunken" />
            <span
              className="h-3 animate-pulse rounded bg-surface-sunken"
              style={{ width: `${88 - ((r * 17) % 40)}%` }}
            />
            <span className="h-3 animate-pulse rounded bg-surface-sunken" />
          </div>
        ))}
      </div>
    </>
  );
}
