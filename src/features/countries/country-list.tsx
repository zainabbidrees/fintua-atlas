"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  FILTERS,
  RUNS,
  STATE_META,
  type CountryRun,
  type FilterId,
} from "./data";

/**
 * Rows, not a table.
 *
 * The previous pass had an uppercase column-header strip over tight rows —
 * which is what a database browser looks like, not a product. Here the rows
 * carry their own labels inline, separated by full-bleed hairlines with no
 * container around each one, and given enough height to breathe. An accent
 * bar wipes in on the left of whichever row you're on.
 */
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
        <nav className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
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
                  "group/tab relative pb-1 text-[13px] transition-colors active:scale-[0.98]",
                  active ? "text-text" : "text-text-faint hover:text-text-muted",
                )}
              >
                {label}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-text-muted" : "text-text-faint/70",
                  )}
                >
                  {count}
                </span>
                {/* Underline wipes rather than toggling, so the tabs feel linked. */}
                <span
                  className={cn(
                    "absolute -bottom-[17px] left-0 h-px w-full origin-left bg-text transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            );
          })}
        </nav>

        <div className="relative w-full sm:w-auto">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-text-faint"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Find a country"
            aria-label="Find a country"
            className="h-7 w-full border-0 bg-transparent pl-6 text-[13px] text-text placeholder:text-text-faint focus:outline-none sm:w-44"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState query={term.trim()} onReset={reset} />
      ) : (
        <ul className="sm:-mx-4">
          {rows.map((run, i) => (
            <Row key={run.code} run={run} index={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ run, index }: { run: CountryRun; index: number }) {
  const state = STATE_META[run.state];
  const done = run.state === "live";

  return (
    <li
      className="rise border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <Link
        href="/countries/new"
        className="group relative flex min-w-0 items-start gap-4 px-0 py-6 sm:gap-5 sm:px-4 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface focus-visible:bg-surface focus-visible:outline-none sm:items-center"
      >
        {/* Accent wipe. scaleY, not height — transforms don't touch layout. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:scale-y-100 group-focus-visible:scale-y-100",
            done ? "bg-settled" : "bg-brand",
          )}
        />

        <span
          aria-hidden
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl font-mono text-[13px] font-semibold tracking-tight transition-colors duration-300",
            done
              ? "bg-settled-quiet text-settled"
              : "bg-brand-quiet text-brand group-hover:bg-brand group-hover:text-on-brand",
          )}
        >
          {run.code}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[15px] font-medium tracking-tight text-text">
              {run.name}
            </h3>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("size-1.5 rounded-full", state.dot)} />
              <span className={cn("text-[12px] font-medium", state.text)}>
                {state.label}
              </span>
            </span>
          </div>

          <p className="mt-1 truncate text-[13px] leading-relaxed text-text-muted">
            {run.stage} · {run.owner.name} · {run.updated}
          </p>
        </div>

        {/* Filings and step progress, right-aligned like the references' actions. */}
        <div className="hidden w-36 shrink-0 sm:block">
          <p className="text-right text-[13px] text-text-muted">
            <span className="tabular-nums font-medium text-text">
              {run.filingsConfirmed}
            </span>
            {" of "}
            <span className="tabular-nums">{run.filingsFound}</span> filings
          </p>
          <div className="mt-2 flex gap-1" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-[3px] w-full rounded-full transition-colors duration-300",
                  i < run.stepsDone
                    ? done
                      ? "bg-settled"
                      : "bg-brand"
                    : "bg-border",
                )}
              />
            ))}
          </div>
          <span className="sr-only">
            {run.stepsDone} of 5 steps complete
          </span>
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 text-[13px] font-medium text-text-faint transition-colors duration-300 group-hover:text-brand lg:flex">
          <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-[3.25rem] group-hover:opacity-100">
            Open
          </span>
          <ArrowRight className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-start py-16">
      <span className="grid size-10 place-items-center rounded-xl bg-surface-sunken">
        <SearchX className="size-5 text-text-faint" />
      </span>
      <p className="mt-4 text-[17px] font-medium tracking-tight text-text">
        {query ? `Nothing matches “${query}”` : "Nothing in this view"}
      </p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">
        {query
          ? "That country may not be onboarded yet — you can start it from here."
          : "No country sits in this state at the moment."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-transform active:scale-[0.98]"
      >
        Show everything
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
