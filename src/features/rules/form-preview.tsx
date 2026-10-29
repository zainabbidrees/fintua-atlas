"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, FileDown, Maximize2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrintOnly, printAs } from "@/components/patterns/print-only";
import { ScaleToFit } from "@/components/ui/scale-to-fit";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import {
  boxesOf,
  type AmountCell,
  type BoxTone,
  type FormBox,
  type FormDoc,
  type FormPage,
  type FormRow,
} from "@/lib/mock/form-preview";

/** Base sheet size in px; every view scales off this. The height is a little
    over A4 so the longest page (page 3) fits whole — every sheet is drawn at
    this height, so the pages stay one paper size. */
const SHEET_W = 880;
const SHEET_H = 1408;
/** Fits a sheet to an A4 page's height (297mm at 96dpi is 1123px). */
const PRINT_SCALE = 1123 / SHEET_H;

/* The same strip of pages as the Tax Form Retrieval step: two up on a phone,
   then as many as fit. */
const PAGE_GRID =
  "grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]";

/* The box fill/outline and its name tab, by extraction state. The outline and
   tab only paint while the boxes are shown; underneath, the comb of input cells
   is always there. */
const TONE_TAB: Record<BoxTone, string> = {
  ok: "bg-settled text-on-brand",
  warn: "bg-attention text-on-brand",
  error: "bg-risk text-on-brand",
};

/* The box name rides on a filled pill above its field — green/amber/red by tone,
   bold white type. Sized to read as the primary mark on the sheet, the way the
   official annotated form prints it: it takes its own width and sits proud of
   the comb rather than tucking into a corner tab. */
const PILL =
  "absolute -top-[17px] left-0 z-10 w-max rounded-md px-2 py-[3px] text-[13px] font-bold leading-none shadow-sm";

function toneCounts(page: FormPage): Record<BoxTone, number> {
  const counts: Record<BoxTone, number> = { ok: 0, warn: 0, error: 0 };
  for (const box of boxesOf(page)) counts[box.tone]++;
  return counts;
}

/**
 * The return PDF with the agent's extracted boxes drawn over it, read the same
 * way as the Tax Form Retrieval step: every page as a thumbnail, and any page
 * opened at reading size with Previous / Next to move through the form.
 *
 * A stand-in for the real document (see src/lib/mock/form-preview.ts), with a
 * labelled, colour-coded box over each field the agent mapped — green where it
 * mapped cleanly, amber where it wants a look, red where nothing matched.
 * "Show boxes" lifts the overlay to read the bare form underneath.
 */
/** A box the expert added, and the 1-based page it sits on. */
export type AddedBox = { name: string; page: number };

export function FormPreview({
  doc,
  returnType,
  added = [],
  onAddBox,
}: {
  doc: FormDoc;
  returnType: string;
  /** Boxes the expert added, counted under the page each sits on. */
  added?: AddedBox[];
  /** Opens Add box on a page; the page viewer offers it when given. */
  onAddBox?: (page: number) => void;
}) {
  const [showBoxes, setShowBoxes] = React.useState(true);
  const [viewing, setViewing] = React.useState<number | null>(null);

  /* Lay the annotated pages out for print, then hand them to the browser's
     Save as PDF once they have rendered. */
  const [printing, setPrinting] = React.useState(false);
  React.useEffect(() => {
    if (!printing) return;
    const id = requestAnimationFrame(() => {
      printAs(fill(copy.formPreview.exportFileName, { name: returnType }));
      setPrinting(false);
    });
    return () => cancelAnimationFrame(id);
  }, [printing, returnType]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <h3 className="mr-auto flex min-w-0 items-baseline gap-2 text-[14px] font-medium text-heading">
          <span className="shrink-0">{returnType}</span>
          <span className="truncate text-[13px] font-normal text-text-muted">{doc.title}</span>
        </h3>
        <BoxesSwitch on={showBoxes} onChange={setShowBoxes} />
        <Button variant="secondary" size="sm" onClick={() => setPrinting(true)}>
          <FileDown />
          {copy.formPreview.exportPdf}
        </Button>
      </div>

      <div className="bg-wash p-6">
        <ol className={PAGE_GRID}>
          {doc.pages.map((page, i) => (
            <PageThumb
              key={i}
              doc={doc}
              page={page}
              index={i}
              showBoxes={showBoxes}
              added={added.filter((b) => b.page === i + 1).length}
              onOpen={() => setViewing(i)}
            />
          ))}
        </ol>
      </div>

      {viewing !== null && (
        <PageViewer
          doc={doc}
          index={viewing}
          onIndexChange={setViewing}
          onClose={() => setViewing(null)}
          showBoxes={showBoxes}
          onShowBoxesChange={setShowBoxes}
          added={added.filter((b) => b.page === viewing + 1)}
          onAddBox={
            onAddBox &&
            (() => {
              /* One dialog at a time: the viewer closes as Add box opens. */
              const page = viewing + 1;
              setViewing(null);
              onAddBox(page);
            })
          }
        />
      )}

      {/* Export: every page with its boxes drawn, laid out one per A4 sheet for
          the browser's own Save as PDF. The sheet is taller than A4, so it is
          scaled to the page's height and centred. */}
      {printing && (
        <PrintOnly>
          {doc.pages.map((page, i) => (
            <div
              key={i}
              style={{
                width: "210mm",
                height: "297mm",
                overflow: "hidden",
                breakAfter: i < doc.pages.length - 1 ? "page" : "auto",
              }}
            >
              <div
                style={{
                  width: SHEET_W,
                  transform: `scale(${PRINT_SCALE})`,
                  transformOrigin: "top center",
                  margin: "0 auto",
                }}
              >
                <Sheet doc={doc} page={page} pageNumber={i + 1} showBoxes />
              </div>
            </div>
          ))}
        </PrintOnly>
      )}
    </section>
  );
}

/** "Show boxes" — lifts the mapping overlay off every sheet, here and in the viewer. */
function BoxesSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2 text-[13px] font-medium text-text-muted"
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-brand" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-surface shadow-sm transition-[left]",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {copy.formPreview.showBoxes}
    </button>
  );
}

/** One page of the form as a thumbnail; the whole sheet opens it. */
function PageThumb({
  doc,
  page,
  index,
  showBoxes,
  added,
  onOpen,
}: {
  doc: FormDoc;
  page: FormPage;
  index: number;
  showBoxes: boolean;
  /** How many boxes the expert added on this page. */
  added: number;
  onOpen: () => void;
}) {
  const n = index + 1;
  const counts = toneCounts(page);
  const toCheck = counts.warn + counts.error;

  return (
    <li className="rise min-w-0" style={{ "--index": index } as React.CSSProperties}>
      <div className="group relative">
        <button
          type="button"
          onClick={onOpen}
          aria-label={fill(copy.formPreview.openPage, { n })}
          className="block w-full overflow-hidden rounded-[3px] bg-white text-left shadow-[var(--shadow-raised)] ring-1 ring-border-strong transition-shadow duration-200 hover:shadow-[var(--shadow-overlay)]"
        >
          <ScaleToFit width={SHEET_W} height={SHEET_H}>
            <Sheet doc={doc} page={page} pageNumber={n} showBoxes={showBoxes} />
          </ScaleToFit>
        </button>

        {/* The way in, surfaced on hover — the whole sheet is the target. */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-surface text-text-muted opacity-0 shadow-[var(--shadow-raised)] transition-opacity group-hover:opacity-100"
        >
          <Maximize2 className="size-3.5" />
        </span>
      </div>

      <p className="mt-3 flex items-baseline gap-1.5 text-[12.5px]">
        <span className="font-medium text-text" data-numeric>
          {fill(copy.formPreview.pageLabel, { n })}
        </span>
        {page.footer && <span className="truncate text-text-faint">· {page.footer}</span>}
      </p>
      <p className="mt-0.5 truncate text-[12px]" data-numeric>
        <span className="text-text-muted">
          {fill(copy.formPreview.boxCount, { count: counts.ok + toCheck })}
        </span>
        {toCheck > 0 && (
          <span className="text-attention-text">
            {" · "}
            {fill(copy.formPreview.toCheck, { count: toCheck })}
          </span>
        )}
        {added > 0 && (
          <span className="text-brand">
            {" · "}
            {fill(copy.formPreview.addedCount, { count: added })}
          </span>
        )}
      </p>
    </li>
  );
}

/**
 * A page at reading size, with its mapping summary beside it. Previous / Next
 * and the arrow keys move through the form without leaving the viewer.
 */
function PageViewer({
  doc,
  index,
  onIndexChange,
  onClose,
  showBoxes,
  onShowBoxesChange,
  added,
  onAddBox,
}: {
  doc: FormDoc;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  showBoxes: boolean;
  onShowBoxesChange: (on: boolean) => void;
  /** Boxes the expert added on this page. */
  added: AddedBox[];
  onAddBox?: () => void;
}) {
  const t = copy.formPreview;
  const total = doc.pages.length;
  const page = doc.pages[index];
  const counts = toneCounts(page);
  const go = (i: number) => onIndexChange(Math.min(total - 1, Math.max(0, i)));

  const rows: { tone: BoxTone; label: string; dot: string }[] = [
    { tone: "ok", label: t.toneOk, dot: "bg-settled" },
    { tone: "warn", label: t.toneWarn, dot: "bg-attention" },
    { tone: "error", label: t.toneError, dot: "bg-risk" },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[min(60rem,calc(100dvh-2rem))] w-[min(80rem,calc(100vw-2rem))] flex-col overflow-hidden p-0 lg:flex-row"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          if (e.key === "ArrowLeft") go(index - 1);
        }}
      >
        <div className="min-h-0 flex-1 overflow-auto bg-wash p-4 sm:p-8 [scrollbar-width:thin]">
          <div className="mx-auto w-full max-w-[760px] shadow-[var(--shadow-overlay)]">
            <ScaleToFit width={SHEET_W} height={SHEET_H}>
              <Sheet doc={doc} page={page} pageNumber={index + 1} showBoxes={showBoxes} />
            </ScaleToFit>
          </div>
        </div>

        <aside className="flex shrink-0 flex-col gap-5 border-t border-border p-5 lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>{doc.title}</DialogTitle>
              <DialogDescription className="mt-1 text-[13px]" data-numeric>
                {fill(t.pageOf, { current: index + 1, total })}
                {page.footer && <span className="text-text-faint"> · {page.footer}</span>}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" aria-label={t.close} className="-mr-2 -mt-1 px-2">
                <X />
              </Button>
            </DialogClose>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
              {t.onThisPage}
            </p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {rows.map((row) => (
                <li key={row.tone} className="flex items-center gap-2.5 px-3 py-2 text-[13px]">
                  <span aria-hidden className={cn("size-2 rounded-full", row.dot)} />
                  <span className="flex-1 text-text-muted">{row.label}</span>
                  <span className="font-medium text-text" data-numeric>
                    {counts[row.tone]}
                  </span>
                </li>
              ))}
              {/* The expert's own boxes, by name — they have no place drawn on
                  the sheet yet, so the list is where they show. */}
              {added.length > 0 && (
                <li className="px-3 py-2 text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="size-2 rounded-full bg-brand" />
                    <span className="flex-1 text-text-muted">{t.addedByYou}</span>
                    <span className="font-medium text-text" data-numeric>
                      {added.length}
                    </span>
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5 pl-[18px]">
                    {added.map((b) => (
                      <li
                        key={b.name}
                        className="rounded bg-brand-quiet px-1.5 py-0.5 font-mono text-[11.5px] text-brand"
                      >
                        {b.name}
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
            {onAddBox && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full active:scale-[0.98]"
                onClick={onAddBox}
              >
                <Plus />
                {t.addOnPage}
              </Button>
            )}
          </div>

          <BoxesSwitch on={showBoxes} onChange={onShowBoxesChange} />

          <div className="mt-auto">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => go(index - 1)}
                disabled={index === 0}
              >
                <ArrowLeft />
                {t.prev}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => go(index + 1)}
                disabled={index === total - 1}
              >
                {t.next}
                <ArrowRight />
              </Button>
            </div>
            <p className="mt-2.5 hidden text-center text-[12px] text-text-faint lg:block">
              {t.keys}
            </p>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
}

/* ── The sheet ──────────────────────────────────────────────────────────────
   A facsimile of the official Umsatzsteuererklärung page, drawn to match the
   printed form: a mint panel inside a green frame, black crop marks, the line
   numbers in the margin outside the frame, green line codes, and white digit
   cells. The greens and the ink here are the form's own print colours — the
   document's content, not the app's colour system — so they are fixed values
   rather than tokens. */

/* The few words the form prints in its own language, for the sheets that are
   not German: the yes tick's caption and the date mask's letters. */
const PRINT: Record<string, { yes: string; date: string }> = {
  de: { yes: "1 = Ja", date: "TTMMJJ" },
  fr: { yes: "1 = Oui", date: "JJMMAA" },
};
const SheetLang = React.createContext("de");

/* One digit cell, and the gap between cells, at base scale. */
const CELL = 17;
const CELL_H = 21;
const GAP = 3;
/* Both money columns share a width so their combs line up down the page; the
   combs sit right-aligned inside them, as on the form. */
const COL_W = 248;
/* Digits per comb: whole-euro columns carry eight; a tax column carries seven
   euro digits and two cents. */
const EUR_WHOLE = 8;
const EUR_TAX = 7;
const CENTS = 2;

const combWidth = (n: number) => n * CELL + (n - 1) * GAP;

/** Renders **bold** runs in a label, as the form sets key phrases in bold. */
function rich(text: string) {
  return text.split("**").map((part, i) =>
    i % 2 ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function Sheet({
  doc,
  page,
  pageNumber,
  showBoxes,
}: {
  doc: FormDoc;
  page: FormPage;
  pageNumber: number;
  showBoxes: boolean;
}) {
  return (
    <div
      lang={doc.lang ?? "de"}
      className="relative flex flex-col bg-white text-[#1d2420] shadow-sm ring-1 ring-black/5"
      // One paper size for every page, so the panel runs to the foot as on paper.
      style={{ minHeight: SHEET_H, padding: "34px 46px 22px" }}
    >
      <SheetLang.Provider value={doc.lang ?? "de"}>
      <CropMarks />

      {/* The machine-readable strip in the right margin. */}
      <div
        aria-hidden
        className="absolute right-[14px] top-[70px] h-[190px] w-[16px]"
        style={{
          background:
            "repeating-linear-gradient(180deg, #1d2420 0 2px, transparent 2px 4px, #1d2420 4px 5px, transparent 5px 8px, #1d2420 8px 11px, transparent 11px 13px)",
        }}
      />

      {/* Above the frame: the tax-number box on its top edge and the page
          number centred; the first page carries the form's title instead. */}
      <div className="relative h-[30px]">
        {pageNumber === 1 ? (
          <div className="flex h-full items-end justify-between pb-1">
            <span className="text-[20px] font-bold leading-none">{doc.heading}</span>
            <span className="text-[20px] font-bold leading-none tabular-nums">{doc.year}</span>
          </div>
        ) : (
          <>
            <div className="absolute bottom-[-1.5px] left-[18px] h-[26px] w-[236px] border-[1.5px] border-[#4f9a6b] bg-white px-1.5">
              <span className="block text-[9px] leading-[11px]">{doc.idLabel ?? "Steuernummer"}</span>
            </div>
            <span className="absolute inset-x-0 top-[2px] text-center text-[12px]">
              - {pageNumber} -
            </span>
          </>
        )}
      </div>

      <div className="relative flex-1 border-[1.5px] border-[#4f9a6b] bg-[#e2eee6] px-3 pb-5">
        {page.rows.length > 0 ? (
          <div
            className="grid items-end gap-x-[14px] gap-y-[8px]"
            style={{ gridTemplateColumns: `minmax(0,1fr) ${COL_W}px ${COL_W}px` }}
          >
            {page.rows.map((row, i) => (
              <Row key={i} row={row} first={i === 0} showBoxes={showBoxes} />
            ))}
          </div>
        ) : (
          <div className="grid h-80 place-items-center text-[12px] opacity-60">
            {copy.formPreview.noFields}
          </div>
        )}
      </div>

      {/* The page code printed in both bottom corners. */}
      <div className="flex justify-between px-[36px] pt-[10px] text-[12.5px] font-bold">
        <span>{page.footer}</span>
        <span>{page.footer}</span>
      </div>
      </SheetLang.Provider>
    </div>
  );
}

/** The four printer's crop marks at the corners of the sheet. */
function CropMarks() {
  const mark = "pointer-events-none absolute size-[20px] border-[#1d2420]";
  return (
    <>
      <span aria-hidden className={cn(mark, "left-[22px] top-[18px] border-l-[2.5px] border-t-[2.5px]")} />
      <span aria-hidden className={cn(mark, "right-[22px] top-[18px] border-r-[2.5px] border-t-[2.5px]")} />
      <span aria-hidden className={cn(mark, "bottom-[14px] left-[22px] border-b-[2.5px] border-l-[2.5px]")} />
      <span aria-hidden className={cn(mark, "bottom-[14px] right-[22px] border-b-[2.5px] border-r-[2.5px]")} />
    </>
  );
}

/** The printed line number, set in the margin outside the frame. */
function LineNo({ n }: { n?: number }) {
  if (n == null) return null;
  return (
    <span className="absolute bottom-[3px] right-full mr-[18px] text-[9px] tabular-nums">
      {n}
    </span>
  );
}

function Row({
  row,
  first,
  showBoxes,
}: {
  row: FormRow;
  first: boolean;
  showBoxes: boolean;
}) {
  // A section: a full-width green rule with the title on a black label.
  if (row.kind === "section") {
    return (
      <div
        className={cn(
          "col-span-full -mx-3",
          first ? "" : "mt-2 border-t-[1.5px] border-[#4f9a6b]",
        )}
      >
        <span className="inline-block bg-[#1d2420] px-[6px] py-[2px] text-[12.5px] font-bold leading-tight text-white">
          {row.text}
        </span>
      </div>
    );
  }

  // A group heading inside a section, set bold in the label column.
  if (row.kind === "subsection") {
    // Fills its grid row, so the lines after it start in the label column.
    return (
      <>
        <div className="mt-3 text-[11px] font-bold leading-[1.28]">{rich(row.text ?? "")}</div>
        <div />
        <div />
      </>
    );
  }

  // The captions over the money columns, centred over each comb.
  if (row.kind === "columns") {
    return (
      <>
        <div />
        <ColumnCaption text={row.cols?.base} />
        <ColumnCaption text={row.cols?.tax} />
      </>
    );
  }

  if (row.kind === "amount") {
    // With no left-hand amount the label runs on into that column, as the
    // form's long single-column lines do.
    const span = !row.base;
    return (
      <>
        <Label n={row.n} span={span} strong={row.strong}>
          {rich(row.text ?? "")}
        </Label>
        {!span && <AmountBox cell={row.base} column="base" showBoxes={showBoxes} />}
        <AmountBox cell={row.tax} column="tax" sum={row.sum} showBoxes={showBoxes} />
      </>
    );
  }

  // A "Dauer der Unternehmereigenschaft" line: vom / bis zum day-month masks.
  if (row.kind === "period") {
    return (
      <>
        <Label n={row.n}>{row.text}</Label>
        <div className="flex justify-end">
          <LetterComb letters="TTMM" caption={row.captions ? "vom" : undefined} />
        </div>
        <div className="flex justify-end">
          <LetterComb letters="TTMM" caption={row.captions ? "bis zum" : undefined} />
        </div>
      </>
    );
  }

  // Tick-box options, drawn inline.
  if (row.kind === "check") {
    return (
      <div className={cn("relative col-span-full flex flex-wrap gap-x-6 gap-y-1", row.indent && "pl-6")}>
        <LineNo n={row.n} />
        {row.checks?.map((c, i) => (
          <span key={i} className="flex items-start gap-2 text-[11px] leading-[1.28]">
            <span aria-hidden className="mt-px size-[15px] shrink-0 bg-white" />
            {c}
          </span>
        ))}
      </div>
    );
  }

  // Free-text fields: one or more white combs across the line.
  if (row.kind === "fields") {
    return (
      <div className="relative col-span-full flex items-end gap-[12px] pt-4">
        <LineNo n={row.n} />
        {row.boxes?.map((box, i) => (
          <FieldComb key={i} box={box} showBoxes={showBoxes} />
        ))}
      </div>
    );
  }

  // A note or a labelled line with a coded cell on the right.
  const note = row.kind === "note";
  return (
    <>
      <Label n={row.n} span wide={!row.code}>
        {row.text && (
          <span className={cn("block", note ? "font-normal" : "font-medium")}>
            {rich(row.text)}
          </span>
        )}
        {row.sub && <span className="mt-0.5 block text-[11px] leading-[1.3] opacity-80">{row.sub}</span>}
      </Label>
      {row.code && (
        <div className="flex justify-end">
          <CodedCell num={row.code.num} box={row.code.box} showBoxes={showBoxes} />
        </div>
      )}
    </>
  );
}

/** The label of a line, with its number in the margin. */
function Label({
  n,
  span = false,
  wide = false,
  strong = false,
  children,
}: {
  n?: number;
  span?: boolean;
  wide?: boolean;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative hyphens-auto text-[11px] leading-[1.28]",
        wide ? "col-span-3" : span ? "col-span-2" : "col-span-1",
        strong && "font-bold",
      )}
    >
      <LineNo n={n} />
      {children}
    </div>
  );
}

/** A money-column caption, centred over the comb rather than the code. */
function ColumnCaption({ text }: { text?: string }) {
  return (
    <div className="self-end pl-[40px] text-center text-[10px] leading-[1.25]">{text}</div>
  );
}

/** A run of white digit cells. */
function Cells({ n }: { n: number }) {
  return (
    <span className="flex" style={{ gap: GAP }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block bg-white" style={{ width: CELL, height: CELL_H }} />
      ))}
    </span>
  );
}

/**
 * One money column on a line: the green code, then the comb. Whole-euro combs
 * end ",—"; a tax comb carries a comma and two cent cells. The EUR / Ct
 * captions print only at the head of a group, and a "Summe" line gets the heavy
 * rule over its tax comb.
 */
function AmountBox({
  cell,
  column,
  sum = false,
  showBoxes,
}: {
  cell?: AmountCell;
  column: "base" | "tax";
  sum?: boolean;
  showBoxes: boolean;
}) {
  if (!cell) return <div aria-hidden />;

  if (cell.variant === "yesno") {
    return (
      <div className="flex justify-end">
        <CodedCell num={cell.num} box={{ name: "", tone: "ok", variant: "yesno" }} showBoxes={false} />
      </div>
    );
  }

  const cents = cell.cents ?? column === "tax";
  const eur = cents ? EUR_TAX : EUR_WHOLE;
  const mapped = Boolean(cell.box && showBoxes);

  return (
    // A comb that carries the EUR / Ct captions takes the room for them above,
    // as the form opens a little space at the head of each group.
    <div className={cn("flex items-end justify-end gap-[6px]", cell.units && "pt-[14px]")}>
      <span className="w-[34px] pb-[4px] text-right text-[10.5px] font-bold tabular-nums text-[#3a9a5b]">
        {cell.num}
      </span>

      <div
        className={cn(
          "relative flex items-end",
          mapped && cell.box && cn("rounded-[3px] outline outline-2 outline-offset-2", TONE_OUTLINE[cell.box.tone]),
        )}
      >
        {mapped && cell.box && (
          <span className={cn(PILL, "-top-[24px]", TONE_TAB[cell.box.tone])}>{cell.box.name}</span>
        )}

        {/* The heavy rule a "Summe" line carries over its comb. */}
        {sum && (
          <span aria-hidden className="absolute -top-[6px] left-0 right-0 h-[2.5px] bg-[#3f8a5a]" />
        )}

        {cell.units && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-[13px] left-0 flex text-[8.5px] font-bold leading-none text-[#3a9a5b]"
          >
            <span className="text-center" style={{ width: combWidth(eur) }}>
              EUR
            </span>
            {cents && (
              <span className="text-center" style={{ width: combWidth(CENTS), marginLeft: 10 }}>
                Ct
              </span>
            )}
          </span>
        )}

        <Cells n={eur} />
        {cents ? (
          <>
            <span className="w-[10px] pb-[1px] text-center text-[12px] font-bold leading-none">,</span>
            <Cells n={CENTS} />
          </>
        ) : (
          <span className="w-[20px] pb-[2px] pl-[3px] text-[12px] font-bold leading-none">,—</span>
        )}
      </div>
    </div>
  );
}

/* The outline a mapped box draws around its comb, by extraction state. */
const TONE_OUTLINE: Record<BoxTone, string> = {
  ok: "outline-settled",
  warn: "outline-attention",
  error: "outline-risk",
};

/** A free-text field as the form prints it: a long white comb. */
function FieldComb({ box, showBoxes }: { box: FormBox; showBoxes: boolean }) {
  return (
    <div className="relative min-w-0" style={{ flexGrow: box.grow ?? 1, flexBasis: 0 }}>
      {showBoxes && <span className={cn(PILL, "-top-[24px]", TONE_TAB[box.tone])}>{box.name}</span>}
      <div
        className={cn(
          "rounded-[1px]",
          showBoxes && cn("outline outline-2 outline-offset-2", TONE_OUTLINE[box.tone]),
        )}
        style={{
          height: CELL_H,
          background: `repeating-linear-gradient(90deg, #fff 0 ${CELL}px, transparent ${CELL}px ${CELL + GAP}px)`,
        }}
      />
    </div>
  );
}

/** A comb with a printed letter in each cell — TTMM, TTMMJJ. */
function LetterComb({ letters, caption }: { letters: string; caption?: string }) {
  return (
    <div className="relative">
      {caption && (
        <span className="absolute -top-[16px] left-0 text-[10.5px]">{caption}</span>
      )}
      <span className="flex" style={{ gap: GAP }}>
        {letters.split("").map((l, i) => (
          <span
            key={i}
            className="grid place-items-center bg-white text-[10px] text-[#1d2420]/35"
            style={{ width: CELL, height: CELL_H }}
          >
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}

/** The right-hand coded cell of a labelled line — a "1 = Ja" tick, a date or a digit. */
function CodedCell({ num, box, showBoxes }: { num: string; box: FormBox; showBoxes: boolean }) {
  const print = PRINT[React.useContext(SheetLang)] ?? PRINT.de;
  const mapped = showBoxes && box.name !== "";
  return (
    <div className="flex items-end gap-[6px]">
      {num && (
        <span className="pb-[4px] text-[10.5px] font-bold tabular-nums text-[#3a9a5b]">{num}</span>
      )}
      <div
        className={cn(
          "relative flex items-end gap-[6px]",
          mapped && cn("rounded-[3px] outline outline-2 outline-offset-2", TONE_OUTLINE[box.tone]),
        )}
      >
        {mapped && <span className={cn(PILL, "-top-[24px] left-auto right-0", TONE_TAB[box.tone])}>{box.name}</span>}
        {box.variant === "date" ? (
          <LetterComb letters={print.date} />
        ) : (
          <Cells n={1} />
        )}
        {box.variant === "yesno" && (
          <span className="pb-[5px] text-[11px]">{print.yes}</span>
        )}
      </div>
    </div>
  );
}
