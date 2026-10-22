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
 * Deliberately sparse. An earlier pass put ten things in every row — chip,
 * name, status dot, status word, stage, owner, date, obligation count, a
 * five-segment progress bar and an arrow — with three of them in brand blue,
 * which left the colour meaning nothing and the metadata line truncating.
 *
 * Several of those said the same thing twice: a count beside a bar of the same
 * count, a dot beside its own label, a "stage" that restated the status. What
 * survives is a name, one line of context, one status, and a way in. Owner and
 * progress belong on the record itself, which is one click away.
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
            placeholder="Search jurisdictions"
            aria-label="Search jurisdictions"
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
        href={`/countries/${run.code}/returns`}
        className="group relative flex items-center gap-4 py-5 pl-4 pr-1 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-brand transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
        />

        {/* Neutral at rest. Brand appears only under the cursor, so the colour
            in this list is never competing with the status. */}
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-sunken font-mono text-[13px] font-semibold tracking-tight text-text-muted transition-colors duration-300 group-hover:bg-brand group-hover:text-on-brand"
        >
          {run.code}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-medium tracking-tight text-text">
            {run.name}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-text-faint">
            {done
              ? `${run.step} · ${run.filingsConfirmed} obligations`
              : `${run.step} · ${run.filingsConfirmed} of ${run.filingsFound} confirmed`}
            {" · "}
            {run.updated}
          </p>
        </div>

        {/* One status treatment, not a dot and a word. Coloured only when it
            means something: green finished, amber your move. */}
        <span
          className={cn(
            "hidden shrink-0 text-[13px] sm:block",
            state.text,
            run.state === "awaiting_you" && "font-medium",
          )}
        >
          {state.label}
        </span>

        <ArrowRight className="size-4 shrink-0 text-border-strong transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:text-brand" />
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
        {query ? `No jurisdiction matches “${query}”` : "No jurisdictions in this view"}
      </p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">
        {query
          ? "This jurisdiction may not be onboarded yet. You can start it from here."
          : "No jurisdiction currently sits at this stage."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-transform active:scale-[0.98]"
      >
        Clear filters
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
