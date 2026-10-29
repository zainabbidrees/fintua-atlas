"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search, SearchX, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";

/**
 * The controls every listing shares, taken from the countries page so a list
 * filters and pages the same way wherever it appears: a filter field (with
 * optional status chips) above, and a footer below that says what is showing
 * and pages the rest.
 */

/** How many rows a listing shows at a time. */
export const PAGE_SIZE = 10;

/**
 * Slices a list into pages. The page is clamped, so a filter that shrinks the
 * list never strands the viewer past its end; callers reset to page one when
 * the filter changes.
 */
export function usePaged<T>(items: readonly T[], pageSize = PAGE_SIZE) {
  const [page, setPage] = React.useState(1);
  return { ...paginate(items, page, pageSize), setPage };
}

/** The same slice without the state, for a caller that keeps its own page. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize = PAGE_SIZE,
) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    pages,
    start,
    items: items.slice(start, start + pageSize),
    total: items.length,
  };
}

/** Case-insensitive match of a filter term against any of the given values. */
export function matches(term: string, values: readonly (string | undefined)[]) {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return values.some((v) => v?.toLowerCase().includes(query));
}

export type Chip<Id extends string> = { id: Id; label: string; count: number };

export function ListFilter<Id extends string>({
  value,
  onChange,
  placeholder,
  chips,
  chip,
  onChipChange,
  leading,
  actions,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Status chips beside the field — each a view of the list, with its count. */
  chips?: Chip<Id>[];
  chip?: Id;
  onChipChange?: (id: Id) => void;
  /** Without chips, what sits to the field's left — a line about the list. */
  leading?: React.ReactNode;
  /** Buttons that act on the list, after the field — e.g. adding a row. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6",
        className,
      )}
    >
      {chips && chips.length > 0 ? (
        <div
          role="group"
          aria-label={placeholder}
          className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((c) => {
            const active = c.id === chip;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChipChange?.(c.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[13px] font-medium",
                  "transition-[color,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                  active
                    ? "border-brand-edge bg-brand-quiet text-brand"
                    : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
                )}
              >
                {c.label}
                <span
                  data-numeric
                  className={active ? "text-brand/70" : "text-text-faint"}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="min-w-0">{leading}</div>
      )}

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        <div className="relative w-full min-w-0 sm:w-72">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className={cn(
              "h-9 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-9 text-[13px] text-text",
              "placeholder:text-text-faint",
              "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={copy.list.clear}
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}

/** The footer a listing ends on: what is showing, and Previous / Next. */
export function Pagination({
  page,
  pages,
  start,
  shown,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pages: number;
  start: number;
  shown: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const t = copy.list;
  const step = cn(
    "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors",
    "text-text-muted hover:bg-wash hover:text-text",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
  );

  return (
    <nav
      aria-label={t.pagination}
      className={cn(
        "flex flex-col items-start gap-3 text-[13px] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-text-muted" data-numeric>
        {fill(t.showing, {
          from: total === 0 ? 0 : start + 1,
          to: start + shown,
          total,
        })}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={step}
        >
          <ChevronLeft className="size-4" />
          {t.previous}
        </button>
        <span className="px-2 text-text-muted" data-numeric>
          {fill(t.page, { page, pages })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={step}
        >
          {t.next}
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

/** What a listing shows when its filter leaves nothing. */
export function NoMatch({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear: () => void;
  className?: string;
}) {
  const t = copy.list;
  const term = query.trim();
  return (
    <div className={cn("flex flex-col items-start px-4 py-12", className)}>
      <span className="grid size-10 place-items-center rounded-xl bg-surface-sunken">
        <SearchX className="size-5 text-text-faint" />
      </span>
      <p className="mt-4 text-[15px] font-medium text-text">
        {term ? fill(t.noMatch, { query: term }) : t.noneInView}
      </p>
      <p className="mt-1 text-[13px] text-text-muted">
        {term ? t.noMatchHint : t.noneInViewHint}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 text-[13px] font-medium text-brand transition-transform active:scale-[0.98]"
      >
        {t.clear}
      </button>
    </div>
  );
}
