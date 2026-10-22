"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { TrailEntry } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Shows the machine's work as it happens.
 *
 * Not a spinner. A professional who can't see what the machine is doing won't
 * sign their name under its output — and the research suggests experts trust
 * machine help less than novices, not more. So we show the actual trail:
 * which site, which document, right now.
 *
 * Critically, this never blocks the page. The expert can keep reading, adding
 * documents, or switch to another country while it runs.
 */
export function LiveTrail({
  entries,
  label,
  className,
}: {
  entries: TrailEntry[];
  label: string;
  className?: string;
}) {
  const current = entries[entries.length - 1];
  const past = entries.slice(0, -1);

  return (
    <div className={cn("text-sm", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
        {label}
      </p>

      <ul className="mt-2 space-y-1.5">
        {past.map((entry) => (
          <li key={entry.id} className="flex items-start gap-2 text-text-muted">
            <Check className="mt-0.5 size-3.5 shrink-0 text-settled" />
            <span className="leading-snug">{entry.text}</span>
          </li>
        ))}

        {current && (
          <li className="flex items-start gap-2 text-text">
            <span
              aria-hidden
              className="mt-[7px] size-1.5 shrink-0 animate-pulse rounded-full bg-brand"
            />
            <span className="leading-snug">{current.text}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
