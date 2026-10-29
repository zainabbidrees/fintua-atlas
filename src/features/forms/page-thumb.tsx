"use client";

import * as React from "react";
import { Maximize2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScaleToFit } from "@/components/ui/scale-to-fit";
import { FormSheet, SHEET_H, SHEET_W } from "@/components/domain/form-sheet";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { FormEdition, FormPage } from "@/lib/types";

/** The grid every page strip sits in — two up on a phone, then as many as fit. */
export const PAGE_GRID =
  "grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]";

/**
 * One page of a retrieved form: the sheet itself, and whether it carries
 * forward.
 *
 * The tick and the page are separate targets on purpose. Ticking is the quick
 * decision made from the thumbnail; opening the page is for reading it. A
 * carried page is outlined in brand; one left behind keeps a dashed outline and
 * stays fully legible — set aside, never greyed out as though broken.
 */
export function PageThumb({
  formName,
  edition,
  page,
  index,
  selected,
  onSelectedChange,
  onOpen,
}: {
  formName: string;
  edition: FormEdition;
  page: FormPage;
  index: number;
  /** Omitted where the page can be looked at but not yet chosen. */
  selected?: boolean;
  onSelectedChange?: (on: boolean) => void;
  onOpen: () => void;
}) {
  const t = copy.taxForms;
  const n = index + 1;
  const selectable = selected !== undefined && onSelectedChange !== undefined;

  return (
    <li className="rise min-w-0" style={{ "--index": index } as React.CSSProperties}>
      <div className="group relative">
        <button
          type="button"
          onClick={onOpen}
          aria-label={fill(t.openPage, { n, name: formName })}
          className={cn(
            "block w-full overflow-hidden rounded-[3px] bg-white text-left shadow-[var(--shadow-raised)] transition-[box-shadow,outline-color] duration-200",
            !selectable && "ring-1 ring-border-strong",
            selectable && selected && "ring-2 ring-brand ring-offset-2 ring-offset-wash",
            selectable &&
              !selected &&
              "outline outline-[1.5px] outline-offset-[3px] outline-dashed outline-text-faint",
            "hover:shadow-[var(--shadow-overlay)]",
          )}
        >
          <ScaleToFit width={SHEET_W} height={SHEET_H}>
            <FormSheet edition={edition} page={page} pageNumber={n} />
          </ScaleToFit>
        </button>

        {selectable && (
          <span className="absolute left-2 top-2 flex rounded-[7px] bg-surface p-[3px] shadow-[var(--shadow-raised)]">
            <Checkbox
              checked={selected}
              onCheckedChange={(v) => onSelectedChange(v === true)}
              aria-label={fill(t.selectPage, { n, name: formName })}
            />
          </span>
        )}

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
          {fill(t.pageLabel, { n })}
        </span>
        <span className="text-text-faint">· {t.kind[page.kind]}</span>
      </p>
      <p className="mt-0.5 truncate text-[12px] text-text-muted" title={page.summary}>
        {selectable && !selected ? t.excluded : page.summary}
      </p>
    </li>
  );
}
