"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import {
  FORM_PREVIEW,
  type AmountCell,
  type BoxTone,
  type FormBox,
  type FormRow,
} from "@/lib/mock/form-preview";

/** Base sheet width in px; zoom scales the whole spread off this. */
const SHEET_W = 880;
/** Gap between the two pages of a spread, at base scale. */
const SPREAD_GAP = 28;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

/* The box fill/outline and its name tab, by extraction state. The outline and
   tab only paint while the boxes are shown; underneath, the comb of input cells
   is always there. */
const TONE_FILL: Record<BoxTone, string> = {
  ok: "border-settled bg-settled-quiet",
  warn: "border-attention-edge bg-attention-quiet",
  error: "border-risk-edge bg-risk-quiet",
};
const TONE_TAB: Record<BoxTone, string> = {
  ok: "bg-settled text-on-brand",
  warn: "bg-attention text-on-brand",
  error: "bg-risk text-on-brand",
};

/* The comb of empty input cells printed on the real form. */
const COMB =
  "repeating-linear-gradient(90deg, transparent 0 15px, color-mix(in oklch, var(--settled) 35%, transparent) 15px 16px)";

/**
 * The return PDF with the agent's extracted boxes drawn over it.
 *
 * A stand-in for the real document (see src/lib/mock/form-preview.ts): a sheet
 * that zooms and pages like a PDF viewer, with a labelled, colour-coded box over
 * each field the agent mapped — green where it mapped cleanly, amber where it
 * wants a look, red where nothing matched. "Show boxes" lifts the overlay to
 * read the bare form underneath.
 */
export function FormPreview() {
  const doc = FORM_PREVIEW;
  const total = doc.pages.length;
  const spreads = Math.ceil(total / 2);
  const SPREAD_W = SHEET_W * 2 + SPREAD_GAP;

  // A notebook view: two facing pages at a time. `spread` 0 → pages 1–2, etc.
  const [spread, setSpread] = React.useState(0);
  const [zoom, setZoom] = React.useState(0.4);
  const [showBoxes, setShowBoxes] = React.useState(true);
  const [goto, setGoto] = React.useState("");

  const left = spread * 2; // 0-based index of the left page
  const pages = [doc.pages[left], doc.pages[left + 1]].filter(Boolean);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const spreadRef = React.useRef<HTMLDivElement>(null);
  const [spreadH, setSpreadH] = React.useState(0);
  const didFit = React.useRef(false);

  // The spread is laid out at SPREAD_W and transform-scaled, so its measured
  // height is the un-zoomed one; the spacer below multiplies it back up.
  React.useEffect(() => {
    const el = spreadRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSpreadH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [spread]);

  const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const step = (d: number) => setZoom((z) => clamp(Math.round((z + d) * 100) / 100));
  const fitWidth = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    setZoom(clamp((vp.clientWidth - 48) / SPREAD_W));
  };

  // Once the first spread is measured, size it so both whole pages sit inside
  // the viewport without a scroll — the "opened notebook" the step lands on.
  React.useEffect(() => {
    if (didFit.current || !spreadH) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const z = clamp(
      Math.min((vp.clientWidth - 48) / SPREAD_W, (vp.clientHeight - 48) / spreadH),
    );
    setZoom(z);
    didFit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadH]);

  const go = (s: number) => setSpread(Math.min(spreads - 1, Math.max(0, s)));
  const commitGoto = () => {
    const n = Number(goto);
    if (Number.isFinite(n) && n >= 1 && n <= total) go(Math.floor((n - 1) / 2));
    setGoto("");
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <h3 className="mr-auto min-w-0 truncate text-[14px] font-medium text-heading">
          {doc.title}
        </h3>

        <div className="flex items-center gap-1">
          <IconButton label={copy.formPreview.zoomOut} onClick={() => step(-0.1)} disabled={zoom <= MIN_ZOOM}>
            <Minus className="size-4" />
          </IconButton>
          <span className="w-11 text-center text-[13px] tabular-nums text-text-muted">
            {Math.round(zoom * 100)}%
          </span>
          <IconButton label={copy.formPreview.zoomIn} onClick={() => step(0.1)} disabled={zoom >= MAX_ZOOM}>
            <Plus className="size-4" />
          </IconButton>
        </div>

        <button
          type="button"
          onClick={fitWidth}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-text-muted transition-colors hover:bg-wash hover:text-text"
        >
          <Maximize2 className="size-3.5" />
          {copy.formPreview.fitWidth}
        </button>

        {/* Show boxes toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={showBoxes}
          onClick={() => setShowBoxes((s) => !s)}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-text-muted"
        >
          <span
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              showBoxes ? "bg-brand" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-surface shadow-sm transition-[left]",
                showBoxes ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
          {copy.formPreview.showBoxes}
        </button>
      </div>

      {/* Viewport — a fixed, compact height so the opened spread lands in view
          without scrolling the page to find it. */}
      <div
        ref={viewportRef}
        className="h-[460px] overflow-auto bg-surface-sunken p-6 [scrollbar-width:thin]"
      >
        <div
          style={{ width: SPREAD_W * zoom, height: spreadH ? spreadH * zoom : undefined }}
          className="mx-auto"
        >
          <div
            ref={spreadRef}
            style={{
              width: SPREAD_W,
              gap: SPREAD_GAP,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
            className="flex items-start"
          >
            {pages.map((p, i) => (
              <div key={left + i} style={{ width: SHEET_W }} className="shrink-0">
                <Sheet
                  doc={doc}
                  page={p}
                  pageNumber={left + i + 1}
                  showBoxes={showBoxes}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-[13px]">
        <IconButton label={copy.formPreview.first} onClick={() => go(0)} disabled={spread === 0}>
          <ChevronsLeft className="size-4" />
        </IconButton>
        <IconButton label={copy.formPreview.prev} onClick={() => go(spread - 1)} disabled={spread === 0}>
          <ChevronLeft className="size-4" />
        </IconButton>
        <span className="px-2 tabular-nums text-text-muted">
          {fill(copy.formPreview.pagesOf, {
            from: left + 1,
            to: Math.min(left + 2, total),
            total,
          })}
        </span>
        <IconButton
          label={copy.formPreview.next}
          onClick={() => go(spread + 1)}
          disabled={spread === spreads - 1}
        >
          <ChevronRight className="size-4" />
        </IconButton>
        <IconButton
          label={copy.formPreview.last}
          onClick={() => go(spreads - 1)}
          disabled={spread === spreads - 1}
        >
          <ChevronsRight className="size-4" />
        </IconButton>

        <span className="ml-3 text-text-faint">{copy.formPreview.goTo}</span>
        <input
          value={goto}
          onChange={(e) => setGoto(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && commitGoto()}
          onBlur={commitGoto}
          inputMode="numeric"
          aria-label={copy.formPreview.goTo}
          placeholder={String(left + 1)}
          className="h-7 w-12 rounded-md border border-border bg-surface px-2 text-center tabular-nums text-text focus:border-brand focus:outline-none"
        />
      </div>
    </section>
  );
}

/** A quiet square icon button for the toolbar and pager. */
function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-wash hover:text-text disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** The sheet itself — masthead, then the page's numbered lines. */
function Sheet({
  doc,
  page,
  pageNumber,
  showBoxes,
}: {
  doc: typeof FORM_PREVIEW;
  page: (typeof FORM_PREVIEW)["pages"][number];
  pageNumber: number;
  showBoxes: boolean;
}) {
  return (
    <div className="rounded-sm bg-surface p-6 text-text shadow-sm ring-1 ring-border">
      {/* Masthead */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-stretch gap-4">
          {/* A stand-in barcode strip. */}
          <div
            aria-hidden
            className="w-6 shrink-0"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--text) 0 1px, transparent 1px 2px, var(--text) 2px 4px, transparent 4px 7px)",
            }}
          />
          <div>
            <h4 className="text-[22px] font-bold leading-none tracking-tight">
              {doc.heading}
            </h4>
            <p className="mt-1 text-[11px] text-text-faint">
              Finanzamt · Steuernummer
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[26px] font-bold leading-none tracking-tight">
            {doc.year}
          </span>
          <div className="mt-2 grid size-9 place-items-center rounded border border-settled text-[13px] font-semibold text-settled">
            {10 + pageNumber}
          </div>
        </div>
      </div>

      {page.rows.length > 0 ? (
        <div className="mt-5 space-y-1.5">
          {page.rows.map((row, i) => (
            <Row key={i} row={row} showBoxes={showBoxes} />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid h-80 place-items-center rounded-sm border border-dashed border-border text-[12px] text-text-faint">
          No fields mapped on this page.
        </div>
      )}

      {/* The page code printed in the form's bottom corners. */}
      {page.footer && (
        <div className="mt-6 flex items-end justify-between border-t border-settled/40 pt-2 text-[10px] font-semibold tabular-nums text-text-faint">
          <span>{page.footer}</span>
          <span>{page.footer}</span>
        </div>
      )}
    </div>
  );
}

function Row({ row, showBoxes }: { row: FormRow; showBoxes: boolean }) {
  if (row.kind === "section") {
    return (
      <div className="mt-4 bg-text px-2.5 py-1 text-[12px] font-semibold text-surface">
        {row.text}
      </div>
    );
  }

  // A rate-group heading inside a section, e.g. "Umsätze zum allgemeinen Steuersatz".
  if (row.kind === "subsection") {
    return (
      <div className="mt-3 pl-8 text-[12px] font-bold leading-snug text-text">
        {row.text}
      </div>
    );
  }

  // The captions over the two money columns on the computation pages.
  if (row.kind === "columns") {
    return (
      <div className="mt-2 flex items-stretch gap-3">
        <div className="w-5 shrink-0" />
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="min-w-0 flex-1" />
          <div className="w-40 shrink-0 text-center text-[10px] font-medium leading-tight text-text-muted">
            {row.cols?.base}
          </div>
          <div className="w-40 shrink-0 text-center text-[10px] font-medium leading-tight text-text-muted">
            {row.cols?.tax}
          </div>
        </div>
      </div>
    );
  }

  // A computation line: label on the left, a base-amount column and an optional
  // tax column on the right — the two line up down the page.
  if (row.kind === "amount") {
    return (
      <div className="flex items-stretch gap-3">
        <div className="w-5 shrink-0 pt-1.5 text-right text-[10px] tabular-nums text-text-faint">
          {row.n ?? ""}
        </div>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <p
            className={cn(
              "min-w-0 flex-1 py-0.5 text-[12px] leading-snug text-text",
              row.strong ? "font-bold" : "font-medium",
            )}
          >
            {row.text}
          </p>
          <AmountBox cell={row.base} showBoxes={showBoxes} />
          <AmountBox cell={row.tax} showBoxes={showBoxes} />
        </div>
      </div>
    );
  }

  // The § 15a adjustment "changed by…" lines — one or more tick-box options.
  if (row.kind === "check") {
    return (
      <div className="flex items-start gap-3">
        <div className="w-5 shrink-0 pt-0.5 text-right text-[10px] tabular-nums text-text-faint">
          {row.n ?? ""}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-wrap items-start gap-x-5 gap-y-1",
            row.indent && "pl-6",
          )}
        >
          {row.checks?.map((c, i) => (
            <span
              key={i}
              className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-text"
            >
              <span
                aria-hidden
                className="mt-0.5 size-3.5 shrink-0 rounded-[2px] border border-border-strong bg-surface"
              />
              {c && <span className="min-w-0">{c}</span>}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-3">
      {/* Left gutter: the printed line number. */}
      <div className="w-5 shrink-0 pt-1.5 text-right text-[10px] tabular-nums text-text-faint">
        {row.n ?? ""}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {row.kind === "fields" ? (
          <div className="flex flex-1 items-end gap-2 pt-2">
            {row.boxes?.map((box, i) => (
              <Box key={i} box={box} showBoxes={showBoxes} />
            ))}
          </div>
        ) : (
          <div className="min-w-0 flex-1 py-1">
            {row.text && (
              <p
                className={cn(
                  "text-[12px] leading-snug",
                  row.kind === "note"
                    ? "font-normal text-text-muted"
                    : "font-medium text-text",
                )}
              >
                {row.text}
              </p>
            )}
            {row.sub && (
              <p className="text-[11px] leading-snug text-text-muted">{row.sub}</p>
            )}
          </div>
        )}

        {row.code && <CodeBox num={row.code.num} box={row.code.box} showBoxes={showBoxes} />}
      </div>
    </div>
  );
}

/**
 * One money column on a computation line — the line code, then the comb cell,
 * with the box overlay on top when the agent mapped it. A fixed width (and an
 * empty placeholder when there's no cell) keeps the base and tax columns lined
 * up down the page. */
function AmountBox({ cell, showBoxes }: { cell?: AmountCell; showBoxes: boolean }) {
  if (!cell) return <div aria-hidden className="w-40 shrink-0" />;

  // A questionnaire "1 = Ja" cell rather than a money comb.
  if (cell.variant === "yesno") {
    return (
      <div className="flex w-40 shrink-0 items-start justify-end gap-1.5">
        {cell.num && (
          <span className="pt-1 text-[11px] font-semibold tabular-nums text-settled">
            {cell.num}
          </span>
        )}
        <div className="flex h-6 items-center gap-1 rounded-[3px] border border-border bg-surface px-1.5 text-[10px] text-text-muted">
          <span className="grid size-4 place-items-center border border-border text-[9px]">
            1
          </span>
          = Ja
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-40 shrink-0 items-start gap-1.5">
      <span className="pt-1.5 text-[11px] font-semibold tabular-nums text-settled">
        {cell.num}
      </span>
      <div className="relative min-w-0 flex-1">
        {cell.units && (
          <div className="pointer-events-none absolute -top-2.5 right-0 flex items-center gap-5 text-[8px] font-semibold leading-none text-settled">
            <span>EUR</span>
            {cell.units === "tax" && <span>Ct</span>}
          </div>
        )}
        {cell.box && showBoxes && (
          <span
            className={cn(
              "absolute -top-2 left-1 z-10 max-w-full truncate rounded px-1 py-[1px] text-[9px] font-medium leading-none",
              TONE_TAB[cell.box.tone],
            )}
          >
            {cell.box.name}
          </span>
        )}
        <div
          className={cn(
            "h-7 rounded-[3px] border",
            cell.box && showBoxes ? TONE_FILL[cell.box.tone] : "border-border bg-surface",
          )}
          style={{
            backgroundImage: COMB,
            backgroundSize: "100% 60%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    </div>
  );
}

/** A field box: the name tab over the comb of input cells. */
function Box({ box, showBoxes }: { box: FormBox; showBoxes: boolean }) {
  return (
    <div className="relative min-w-0" style={{ flexGrow: box.grow ?? 1, flexBasis: 0 }}>
      {showBoxes && (
        <span
          className={cn(
            "absolute -top-2 left-1 z-10 max-w-full truncate rounded px-1 py-[1px] text-[9px] font-medium leading-none",
            TONE_TAB[box.tone],
          )}
        >
          {box.name}
        </span>
      )}
      <div
        className={cn(
          "h-7 rounded-[3px] border",
          showBoxes ? TONE_FILL[box.tone] : "border-border bg-surface",
        )}
        style={{ backgroundImage: COMB, backgroundSize: "100% 60%", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
      />
    </div>
  );
}

/** The right-aligned numbered box — a yes/no cell, a date mask or a value. */
function CodeBox({ num, box, showBoxes }: { num: string; box: FormBox; showBoxes: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {num && <span className="text-[11px] font-semibold tabular-nums text-settled">{num}</span>}
      <div className="relative">
        {showBoxes && (
          <span
            className={cn(
              "absolute -top-2 left-0 z-10 rounded px-1 py-[1px] text-[9px] font-medium leading-none",
              TONE_TAB[box.tone],
            )}
          >
            {box.name}
          </span>
        )}
        {box.variant === "yesno" ? (
          <div
            className={cn(
              "flex h-7 items-center gap-1 rounded-[3px] border px-1.5 text-[10px] text-text-muted",
              showBoxes ? TONE_FILL[box.tone] : "border-border bg-surface",
            )}
          >
            <span className="grid size-5 place-items-center border border-border text-[9px]">1</span>
            = Ja
          </div>
        ) : box.variant === "date" ? (
          <div
            className={cn(
              "flex h-7 items-center rounded-[3px] border px-1 font-mono text-[10px] tracking-[0.3em] text-text-faint",
              showBoxes ? TONE_FILL[box.tone] : "border-border bg-surface",
            )}
          >
            TTMMJJ
          </div>
        ) : (
          <div
            className={cn(
              "h-7 w-28 rounded-[3px] border",
              showBoxes ? TONE_FILL[box.tone] : "border-border bg-surface",
            )}
          />
        )}
      </div>
    </div>
  );
}
