"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
 * The full picture, as a table.
 *
 * Every field the original prototype carried is here — status, stage, progress
 * through the obligations, what needs a person, owner, and what last moved.
 * All of it matters for triage, so none of it was cut.
 *
 * What made the prototype's version hard to read was weight, not information:
 * a grey header band, pill badges competing with the text beside them, a
 * progress bar restating the fraction printed next to it, a bare orange number
 * under a heading that didn't say what it counted, and activity text clipped
 * mid-word.
 *
 * Here each cell holds one short value, numbers are tabular so they align down
 * the column, colour appears only on the two states that need a person, and
 * the review column stays blank at zero — an empty cell reads faster than a
 * nought, and makes the ones that aren't empty impossible to miss.
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
      <div className="flex items-center justify-between gap-x-6 border-b border-border pb-4">
        <nav className="-mb-px flex min-w-0 items-center gap-x-6 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  "relative shrink-0 whitespace-nowrap pb-1 text-[13px] transition-colors active:scale-[0.98]",
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

        <div className="relative shrink-0">
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
        <>
          {/* Full table above lg; stacked rows below, where columns cannot fit. */}
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="border-b border-border">
                <Th>Jurisdiction</Th>
                <Th className="w-32">Status</Th>
                <Th className="w-36">Stage</Th>
                <Th className="w-28">Obligations</Th>
                <Th className="w-20">Review</Th>
                <Th className="w-40">Owner</Th>
                <Th className="w-[17rem]">Last activity</Th>
                <th className="w-6" />
              </tr>
            </thead>
            <tbody>
              {rows.map((run, i) => (
                <Row key={run.code} run={run} index={i} />
              ))}
            </tbody>
          </table>

          <ul className="lg:hidden">
            {rows.map((run, i) => (
              <CompactRow key={run.code} run={run} index={i} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "pb-2.5 pr-6 text-[11px] font-medium uppercase tracking-[0.07em] text-text-faint",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Row({ run, index }: { run: CountryRun; index: number }) {
  const router = useRouter();
  const state = STATE_META[run.state];
  const done = run.state === "live";
  const href = `/countries/${run.code}/returns`;

  return (
    <tr
      /* The name is the real link, so keyboard and middle-click behave. The
         row click is a convenience on top, and stands aside when the user is
         selecting text or has already hit the link. */
      onClick={(e) => {
        if (window.getSelection()?.toString()) return;
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(href);
      }}
      className="rise group cursor-pointer border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <Td className="relative">
        <span
          aria-hidden
          className="absolute inset-y-0 -left-2 w-[2px] origin-top scale-y-0 bg-brand transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
        />
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold transition-colors duration-300",
              done
                ? "bg-settled-quiet text-settled"
                : "bg-surface-sunken text-text-muted group-hover:bg-brand group-hover:text-on-brand",
            )}
          >
            {run.code}
          </span>
          <Link
            href={href}
            className="truncate text-[14px] font-medium text-text rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            {run.name}
          </Link>
        </span>
      </Td>

      <Td>
        <span className={cn("text-[13px]", state.text, run.state === "awaiting_you" && "font-medium")}>
          {state.label}
        </span>
      </Td>

      <Td>
        <span className="text-[13px] text-text">{run.step}</span>
        <span className="ml-1.5 text-[13px] tabular-nums text-text-faint">
          {run.stepsDone}/5
        </span>
      </Td>

      <Td>
        <span className="text-[13px] tabular-nums text-text">
          {run.filingsConfirmed}
        </span>
        <span className="text-[13px] tabular-nums text-text-faint">
          {" / "}
          {run.filingsFound}
        </span>
      </Td>

      {/* Blank at zero: an empty cell reads faster than a nought, and makes the
          rows that do need someone impossible to miss. */}
      <Td>
        {run.review > 0 && (
          <span className="inline-flex min-w-5 justify-center rounded-full bg-attention-quiet px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-attention-text">
            {run.review}
          </span>
        )}
      </Td>

      <Td>
        <span className="block truncate text-[13px] text-text-muted">
          {run.owner.name}
        </span>
      </Td>

      <Td>
        <span className="block truncate text-[13px] text-text" title={run.lastActivity.text}>
          {run.lastActivity.text}
        </span>
        <span className="mt-0.5 block text-[12px] text-text-faint">
          {run.lastActivity.at}
        </span>
      </Td>

      <Td className="pr-0">
        <ChevronRight
          aria-hidden
          className="size-4 text-border-strong transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:text-brand"
        />
      </Td>
    </tr>
  );
}

function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "py-3.5 pr-6 align-middle transition-colors duration-300 group-hover:bg-surface",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Below lg the columns cannot fit, so the same fields stack. */
function CompactRow({ run, index }: { run: CountryRun; index: number }) {
  const state = STATE_META[run.state];
  const done = run.state === "live";

  return (
    <li
      className="rise border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <Link
        href={`/countries/${run.code}/returns`}
        className="flex items-start gap-3 py-4 transition-colors hover:bg-surface"
      >
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold",
            done ? "bg-settled-quiet text-settled" : "bg-surface-sunken text-text-muted",
          )}
        >
          {run.code}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-[14px] font-medium text-text">
              {run.name}
            </span>
            {run.review > 0 && (
              <span className="shrink-0 rounded-full bg-attention-quiet px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-attention-text">
                {run.review}
              </span>
            )}
          </span>

          <span className={cn("mt-0.5 block text-[13px]", state.text)}>
            {state.label}
            <span className="text-text-faint">
              {" · "}
              {run.step} {run.stepsDone}/5 · {run.filingsConfirmed}/
              {run.filingsFound} obligations
            </span>
          </span>

          <span className="mt-1 block truncate text-[12px] text-text-faint">
            {run.lastActivity.text} · {run.lastActivity.at}
          </span>
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
        className="mt-5 text-sm font-medium text-brand transition-transform active:scale-[0.98]"
      >
        Clear filters
      </button>
    </div>
  );
}
