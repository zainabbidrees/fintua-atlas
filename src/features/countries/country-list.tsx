"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, SearchX, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { RowActions } from "./row-actions";
import { EditCountryDialog } from "./edit-country-dialog";
import {
  FILTERS,
  RUNS,
  STATE_META,
  withIds,
  withPublished,
  type CountryRow,
  type FilterId,
} from "./data";
import { findCountry } from "@/lib/mock/countries";
import { readPublished } from "@/lib/published";

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

  /* The rows are held here so the per-row actions have something to change.
     A real backend replaces this with the service layer; the fixtures seed
     it, each given a stable id so a duplicate can share a code without
     colliding as a key. */
  const [all, setAll] = React.useState<CountryRow[]>(() => withIds(RUNS));

  /* Countries published from the Query Builder show as Published and lead
     the list. Read after mount so the first render matches the server. */
  React.useEffect(() => {
    const published = readPublished();
    if (published.length === 0) return;
    // Syncing from localStorage after mount is the one case that
    // legitimately needs setState in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAll((rows) => withPublished(rows, published, copy.countries.publishedActivity));
  }, []);

  /* The two row dialogs. Null is closed; a row is the one being acted on. */
  const [editing, setEditing] = React.useState<CountryRow | null>(null);
  const [removing, setRemoving] = React.useState<CountryRow | null>(null);

  const [page, setPage] = React.useState(1);

  const matchesFilter = FILTERS.find((f) => f.id === filter)!.match;
  const query = term.trim().toLowerCase();

  const rows = all.filter(
    (r) =>
      matchesFilter(r) &&
      (!query ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase() === query),
  );

  /* The set is short today, but a live deployment carries every jurisdiction a
     client files in, so the table pages rather than growing without end. A
     filter or search change drops the viewer back to the first page. */
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);
  const firstShown = rows.length === 0 ? 0 : start + 1;
  const lastShown = Math.min(start + PAGE_SIZE, rows.length);

  function reset() {
    setFilter("all");
    setTerm("");
    setPage(1);
  }

  function saveEdit(id: string, patch: Partial<CountryRow>) {
    setAll((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    toast(fill(copy.countries.edited, { country: patch.name ?? "" }));
  }

  function remove(id: string, name: string, reason: string) {
    setAll((rs) => rs.filter((r) => r.id !== id));
    toast(fill(copy.countries.removed, { country: name }), {
      description: fill(copy.countries.removedReason, { reason }),
    });
  }

  return (
    <div>
      {/* Below sm the control and the search cannot share a row without the
          control being clipped mid-segment, so they stack. */}
      <div className="flex flex-col items-start gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6">
        {/* Discrete filter chips, not one segmented track. The track made every
            option but the active one read as a caption — bare words on an inert
            strip, nothing saying "press me". Each chip now carries its own
            border and surface so it looks pressable, with room to breathe
            between them; selection is the brand tint, the system's one colour
            for a chosen state. */}
        <nav
          aria-label="Filter jurisdictions"
          className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map(({ id, label, match }) => {
            const count = all.filter(match).length;
            const active = filter === id;
            const urgent = id === "needs_you" && count > 0;
            /* A dot only where a filter maps to one status colour — amber
               waiting, green published, grey draft. "All" maps to no single
               status, so a dot there would be noise, not a legend. */
            const dot =
              id === "needs_you"
                ? "bg-attention"
                : id === "live"
                  ? "bg-settled"
                  : id === "draft"
                    ? "bg-text-faint"
                    : null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilter(id);
                  setPage(1);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-[13px] font-medium",
                  "transition-[color,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97]",
                  active
                    ? "border-brand-edge bg-brand-quiet text-brand"
                    : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
                )}
              >
                {dot && (
                  <span
                    aria-hidden
                    className={cn("size-1.5 shrink-0 rounded-full", dot)}
                  />
                )}
                {label}
                <span
                  className={cn(
                    "tabular-nums",
                    active
                      ? "text-brand/70"
                      : urgent
                        ? "text-attention-text"
                        : "text-text-faint",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* A prominent search field: taller than the filter rail beside it, a
            clear leading magnifier, and lifted off the canvas with a hairline
            border and the faintest shadow. Clearable. */}
        <div className="relative w-full shrink-0 sm:w-72">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search jurisdictions"
            aria-label="Search jurisdictions"
            className={cn(
              "h-10 w-full rounded-lg border border-border-strong bg-surface pl-9 pr-9 text-[14px] text-text shadow-[var(--shadow-raised)]",
              "placeholder:text-text-faint",
              "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
              /* The native widget is unstyleable and duplicates the button. */
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                setPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-text-faint transition-colors hover:bg-wash hover:text-text"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState query={term.trim()} onReset={reset} />
      ) : (
        <>
          {/* Full table above xl; stacked rows below, where columns cannot fit.
              The widths below need ~1150px of content, and the content area is
              the viewport less the 288px sidebar and 96px of gutter — so at the
              old lg switch the table came on 300px short, wrapping the header
              labels onto two lines and cutting activity text to three letters. */}
          <table className="hidden w-full table-fixed border-collapse text-left xl:table">
            {/* The header stays put while the rows scroll. Its rule is an inset
                shadow rather than a border: a collapsed-border table drops the
                border on a stuck thead. */}
            <thead className="sticky top-0 z-10">
              {/* Widths are shares of the table, summing to 100%, so the
                  columns spread across the whole width instead of bunching at
                  the left with one column absorbing the slack. */}
              <tr>
                {/* A row number for reference in review and conversation —
                    continuous across pages, so it reads as a position in the
                    whole set, not the page. Kept narrow and faint so it orders
                    without competing with the jurisdiction beside it. */}
                <Th className="w-[4%] text-right">#</Th>
                <Th className="w-[16%]">Country</Th>
                <Th className="w-[11%]">Status</Th>
                {/* Fits "Approval & Publish 5/6", the longest stage. A clipped
                    enum loses its meaning; a clipped sentence still reads, so
                    the activity column is the one that gives way. */}
                <Th className="w-[15%]">Stage</Th>
                {/* Counts align right, under their own digits. */}
                <Th className="w-[9%] text-right">Return types</Th>
                <Th className="w-[7%] text-right">Review</Th>
                <Th className="w-[14%]">Owner</Th>
                {/* The widest share: two lines of activity, truncated with a title. */}
                <Th className="w-[20%]">Last activity</Th>
                <th className="w-[4%] bg-canvas shadow-[inset_0_-1px_0_var(--border)]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((run, i) => (
                <Row
                  key={run.id}
                  run={run}
                  index={i}
                  serial={start + i + 1}
                  onEdit={setEditing}
                  onRemove={setRemoving}
                />
              ))}
            </tbody>
          </table>

          <ul className="lg:hidden">
            {pageRows.map((run, i) => (
              <CompactRow
                key={run.id}
                run={run}
                index={i}
                serial={start + i + 1}
                onEdit={setEditing}
                onRemove={setRemoving}
              />
            ))}
          </ul>

          {/* A footer the table can end on, rather than trailing off into blank
              space: it states what you're looking at and pages the rest. */}
          <nav
            aria-label="Pagination"
            className="mt-4 flex flex-col items-start gap-3 border-t border-border pt-4 text-[13px] sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-text-muted">
              Showing{" "}
              <span className="font-medium tabular-nums text-text">
                {firstShown}&ndash;{lastShown}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-text">
                {rows.length}
              </span>{" "}
              jurisdictions
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors",
                  "text-text-muted hover:bg-wash hover:text-text",
                  "disabled:pointer-events-none disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                )}
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>

              <span className="px-2 tabular-nums text-text-muted">
                Page {current} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage(current + 1)}
                disabled={current === totalPages}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors",
                  "text-text-muted hover:bg-wash hover:text-text",
                  "disabled:pointer-events-none disabled:opacity-40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                )}
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          </nav>
        </>
      )}

      <EditCountryDialog
        run={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={saveEdit}
      />

      {/* Removal keeps its why — the same pattern the obligation list uses. */}
      <ConfirmWithReason
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={fill(copy.countries.removeTitle, { country: removing?.name ?? "" })}
        hint={copy.countries.removeHint}
        placeholder={copy.countries.removePlaceholder}
        confirmLabel={copy.countries.removeConfirm}
        cancelLabel={fill(copy.countries.removeCancel, {
          country: removing?.name ?? "",
        })}
        onConfirm={(reason) =>
          removing && remove(removing.id, removing.name, reason)
        }
      />
    </div>
  );
}

type RowHandlers = {
  onEdit: (run: CountryRow) => void;
  onRemove: (run: CountryRow) => void;
};

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
        "bg-canvas py-2.5 pr-5 text-[12px] font-medium text-text-faint",
        /* A label that wraps turns the bar into two ragged rows. */
        "whitespace-nowrap",
        "shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Row({
  run,
  index,
  serial,
  onEdit,
  onRemove,
}: { run: CountryRow; index: number; serial: number } & RowHandlers) {
  const router = useRouter();
  const state = STATE_META[run.state];
  const done = run.state === "live";
  const href = `/countries/${run.code}/returns`;
  const flag = findCountry(run.code)?.flag;

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
      <Td className="text-right">
        <span className="text-[13px] tabular-nums text-text-faint">{serial}</span>
      </Td>

      <Td>
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300",
              flag
                ? "bg-surface-sunken text-[17px] leading-8"
                : cn(
                    "font-mono text-[12px] font-semibold",
                    done
                      ? "bg-settled-quiet text-settled"
                      : "bg-surface-sunken text-text-muted group-hover:bg-wash",
                  ),
            )}
          >
            {flag ?? run.code}
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
        <span className="block truncate whitespace-nowrap">
          <span className="text-[13px] text-text">{run.step}</span>
          <span className="ml-1.5 text-[13px] tabular-nums text-text-faint">
            {run.stepsDone}/6
          </span>
        </span>
      </Td>

      <Td className="text-right">
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
      <Td className="text-right">
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

      {/* Centred in its own narrow column, so the control reads as a tidy
          trailing slot with even breathing room — not a chip flush to the
          table's edge. */}
      <Td className="px-0 text-center">
        <div className="flex justify-center">
          <RowActions
            run={run}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        </div>
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
        "py-3.5 pr-5 align-middle transition-colors duration-300 group-hover:bg-surface",
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Below lg the columns cannot fit, so the same fields stack. */
function CompactRow({
  run,
  index,
  serial,
  onEdit,
  onRemove,
}: { run: CountryRow; index: number; serial: number } & RowHandlers) {
  const state = STATE_META[run.state];
  const done = run.state === "live";
  const flag = findCountry(run.code)?.flag;

  return (
    <li
      /* The menu is a sibling of the link, not nested inside it — an anchor
         can't hold a button — so it sits in the row's top-right corner. */
      className="rise relative border-b border-border last:border-0"
      style={{ "--index": index } as React.CSSProperties}
    >
      <div className="absolute right-0 top-3 z-10">
        <RowActions
          run={run}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      </div>
      <Link
        href={`/countries/${run.code}/returns`}
        className="flex items-start gap-3 py-4 pr-9 transition-colors hover:bg-surface"
      >
        <span
          aria-hidden
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            flag
              ? "bg-surface-sunken text-[17px] leading-8"
              : cn(
                  "font-mono text-[12px] font-semibold",
                  done ? "bg-settled-quiet text-settled" : "bg-surface-sunken text-text-muted",
                ),
          )}
        >
          {flag ?? run.code}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-[13px] tabular-nums text-text-faint">
                {serial}
              </span>
              <span className="truncate text-[14px] font-medium text-text">
                {run.name}
              </span>
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
              {run.step} {run.stepsDone}/6 · {run.filingsConfirmed}/
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
