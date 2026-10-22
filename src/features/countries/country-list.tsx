"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  FILTERS,
  RUNS,
  STATE_META,
  type CountryRun,
  type FilterId,
} from "./data";

/**
 * A listing, not a stack of cards.
 *
 * Cards earn their keep when elevation means something; for rows of comparable
 * data they add a border and a shadow per item, push everything apart, and make
 * columns impossible to scan down. Hairline dividers and a shared column grid
 * do the same job quietly — and let each row carry far more detail in less
 * vertical space.
 */

/** Shared column track, so the header labels and every row stay in lockstep. */
const COLS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 lg:grid-cols-[minmax(11rem,1.6fr)_8.5rem_minmax(8rem,1fr)_4.5rem_minmax(7rem,0.9fr)_auto]";

export function CountryList() {
  const [filter, setFilter] = React.useState<FilterId>("all");
  const [term, setTerm] = React.useState("");

  const matchesFilter = FILTERS.find((f) => f.id === filter)!.match;
  const query = term.trim().toLowerCase();

  const rows = RUNS.filter(
    (r) =>
      matchesFilter(r) &&
      (!query ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase() === query),
  );

  function reset() {
    setFilter("all");
    setTerm("");
  }

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
      <nav className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map(({ id, label, match }) => {
          const count = RUNS.filter(match).length;
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors active:scale-[0.98]",
                active
                  ? "border-transparent bg-text text-canvas"
                  : "border-border text-text-muted hover:border-border-strong hover:text-text",
              )}
            >
              {label}
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-canvas/60" : "text-text-faint",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

        {/* 180+ jurisdictions eventually live here; scanning won't scale. */}
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Find a country"
            aria-label="Find a country"
            className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-4 text-[13px] text-text transition-colors placeholder:text-text-faint hover:border-border-strong focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 sm:w-56"
          />
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-xl border border-border bg-surface">
        {/* Column labels. Hidden on narrow screens, where rows stack instead. */}
        <div
          className={cn(
            COLS,
            "hidden border-b border-border bg-surface-sunken px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.07em] text-text-faint lg:grid",
          )}
        >
          <span>Jurisdiction</span>
          <span>Status</span>
          <span>Filings</span>
          <span>Version</span>
          <span>Owner</span>
          <span className="sr-only">Open</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState query={term.trim()} onReset={reset} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((run, i) => (
              <Row key={run.code} run={run} index={i} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Row({ run, index }: { run: CountryRun; index: number }) {
  const state = STATE_META[run.state];

  return (
    <li className="rise" style={{ "--index": index } as React.CSSProperties}>
      <Link
        href="/countries/new"
        className={cn(
          COLS,
          "group px-5 py-4 transition-colors hover:bg-surface-sunken/70",
          "focus-visible:bg-surface-sunken focus-visible:outline-none",
        )}
      >
        {/* Jurisdiction */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-quiet font-mono text-[13px] font-semibold tracking-tight text-brand"
          >
            {run.code}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] font-medium text-text">
              <span className="truncate">{run.name}</span>
              {/* Status has no column below lg, so it rides alongside the name. */}
              <span
                title={state.label}
                className={cn(
                  "size-1.5 shrink-0 rounded-full lg:hidden",
                  state.dot,
                )}
              >
                <span className="sr-only">{state.label}</span>
              </span>
            </p>
            <p className="truncate text-[13px] text-text-muted">
              {run.stage} · {run.updated}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="hidden items-center gap-2 lg:flex">
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", state.dot)}
          />
          <span className={cn("truncate text-[13px] font-medium", state.text)}>
            {state.label}
          </span>
        </div>

        {/* Filings, with the run's own progress underneath */}
        <div className="hidden lg:block">
          <p className="text-[13px] text-text">
            <span className="tabular-nums font-medium">
              {run.filingsConfirmed}
            </span>
            <span className="text-text-faint">
              {" of "}
              <span className="tabular-nums">{run.filingsFound}</span> confirmed
            </span>
          </p>
          <div
            className="mt-1.5 flex gap-1"
            aria-label={`${run.stepsDone} of 5 steps complete`}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 w-full rounded-full",
                  i < run.stepsDone
                    ? run.state === "live"
                      ? "bg-settled"
                      : "bg-brand"
                    : "bg-border",
                )}
              />
            ))}
          </div>
        </div>

        {/* Version */}
        <span className="hidden font-mono text-[13px] tabular-nums text-text-muted lg:block">
          {run.version}
        </span>

        {/* Owner */}
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-[10px] font-semibold text-text-muted ring-1 ring-border"
          >
            {run.owner.initials}
          </span>
          <span className="truncate text-[13px] text-text-muted">
            {run.owner.name}
          </span>
        </div>

        <ChevronRight className="size-4 shrink-0 text-text-faint transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:text-brand" />
      </Link>
    </li>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-surface-sunken">
        <SearchX className="size-5 text-text-faint" />
      </span>
      <p className="mt-4 text-[15px] font-medium text-text">
        {query ? `No country matches "${query}"` : "Nothing here right now"}
      </p>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-text-muted">
        {query
          ? "It may not be onboarded yet — you can start it from here."
          : "No country is in this state at the moment."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-sm font-medium text-brand hover:underline"
      >
        Show all countries
      </button>
    </div>
  );
}
