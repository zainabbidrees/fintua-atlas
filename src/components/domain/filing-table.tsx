"use client";

import * as React from "react";
import { ArrowUpRight, PenLine, Trash2 } from "lucide-react";
import { AttentionNote } from "@/components/ui/attention-note";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { extensionOf, hostOf, SourceMark } from "@/components/domain/source-block";
import { formatDate } from "@/components/domain/filing-card";
import { copy, fill, SOURCE_KIND_LABEL } from "@/lib/copy";
import type { Filing } from "@/lib/types";
import { cn } from "@/lib/cn";

/* Every cell starts on the same first line: text cells are 20px lines, and the
   checkbox, chip and button are nudged so their centres sit on that line. */
const CELL = "px-4 py-4 align-top";

/**
 * The return types found for a country, one row each, as a table.
 *
 * Columns of like things — rationale, source — read faster
 * down a column than card by card, and the source still sits on the same row
 * as the claim it backs. A row that needs review keeps the card's rule: the
 * row stays plain, an amber edge marks it, and the reason sits in an amber
 * note directly underneath, spanning the row.
 */
export function FilingTable({
  filings,
  isSelected,
  onSelectedChange,
  onKeep,
  onRemove,
  className,
}: {
  filings: Filing[];
  isSelected: (filing: Filing) => boolean;
  onSelectedChange: (filing: Filing, selected: boolean) => void;
  onKeep: (filing: Filing) => void;
  onRemove: (filing: Filing) => void;
  className?: string;
}) {
  const head = "px-4 py-2.5 text-left text-[12px] font-medium text-text-muted";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]", className)}>
      {/* Scrolls sideways inside the card on a narrow screen rather than
          pushing the page wider. Relative, so the absolutely placed
          screen-reader labels in the header are clipped with the table
          instead of widening the page. */}
      <div className="relative overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            {/* The text columns grow with the page; the rationale — the
                longest text — takes whatever room is left. */}
            <col className="w-12" />
            <col className="w-[18%]" />
            <col />
            <col className="w-[22%]" />
            <col className="w-[184px]" />
          </colgroup>
          <thead>
            <tr className="bg-surface-sunken">
              <th className={cn(head, "pr-0")}>
                <span className="sr-only">{copy.filings.selectAll}</span>
              </th>
              <th className={head}>{copy.filings.columns.returnType}</th>
              <th className={head}>{copy.filings.columns.rationale}</th>
              <th className={head}>{copy.filings.columns.source}</th>
              <th className={cn(head, "text-right")}>
                <span className="sr-only">{copy.filings.columns.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filings.map((filing, i) => (
              <FilingRows
                key={filing.id}
                filing={filing}
                last={i === filings.length - 1}
                followedByFlag={filings[i + 1]?.certainty === "needs_check"}
                selected={isSelected(filing)}
                onSelectedChange={onSelectedChange}
                onKeep={onKeep}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilingRows({
  filing,
  last,
  followedByFlag,
  selected,
  onSelectedChange,
  onKeep,
  onRemove,
}: {
  filing: Filing;
  last: boolean;
  /** The next row is itself flagged. A flagged row carries its own box, so the
      row above drops its grey divider and the two never double up. */
  followedByFlag: boolean;
  selected: boolean;
  onSelectedChange: (filing: Filing, selected: boolean) => void;
  onKeep: (filing: Filing) => void;
  onRemove: (filing: Filing) => void;
}) {
  const needsCheck = filing.certainty === "needs_check";
  const showNote = needsCheck && Boolean(filing.uncertainty);
  /* Plain rows are parted by a grey divider. A flagged row carries its own box
     instead and takes no divider; the row above it drops the divider too. */
  const rule =
    last || needsCheck || followedByFlag ? "" : "border-b border-border";

  /* A flagged row reads as one box with an attention-yellow stroke — not a left
     edge line. The top closes on the data row; the bottom closes on the note
     row when there is one, otherwise on the data row itself. */
  const box = needsCheck ? "border-attention" : "";
  const boxTop = needsCheck ? "border-t" : "";
  /* Only used when there's no note, so the single data row closes the box. */
  const boxFoot = needsCheck && !showNote ? "border-b" : "";

  return (
    <>
      <tr data-review-item={needsCheck ? "" : undefined}>
        <td
          className={cn(
            CELL,
            "pr-0",
            rule,
            box,
            boxTop,
            boxFoot,
            needsCheck && "border-l rounded-tl-xl",
            needsCheck && !showNote && "rounded-bl-xl",
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(next) => onSelectedChange(filing, next === true)}
            aria-label={fill(copy.filings.includeLabel, { name: filing.name })}
            className="mt-0.5"
          />
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <p className="text-[15px] font-medium leading-5 text-heading">{filing.name}</p>
          <p className="mt-1 leading-5 text-text-muted">
            {filing.localName ?? copy.filings.localNameMissing}
          </p>
        </td>

        <td className={cn(CELL, "leading-5 text-text", rule, box, boxTop, boxFoot)}>
          {filing.whyItApplies}
        </td>

        <td className={cn(CELL, rule, box, boxTop, boxFoot)}>
          <SourceCell filing={filing} />
        </td>

        <td
          className={cn(
            CELL,
            rule,
            box,
            boxTop,
            boxFoot,
            needsCheck && "border-r rounded-tr-xl",
            needsCheck && !showNote && "rounded-br-xl",
          )}
        >
          {/* Nudged up so the chip and button centre on the first text line. */}
          <div className="-mt-1.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onRemove(filing)}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-wash px-2 text-[12px] font-medium text-risk transition-[filter,transform] hover:brightness-95 active:scale-[0.96]"
            >
              <Trash2 className="size-3.5" />
              {copy.filings.remove}
            </button>
            {needsCheck && (
              <Button size="sm" variant="primary" onClick={() => onKeep(filing)}>
                {copy.filings.keep}
              </Button>
            )}
          </div>
        </td>
      </tr>

      {/* What the agent is unsure about closes the box. It takes only the
          return-type and rationale columns; the columns to its right stay empty
          but still carry the box's bottom and right stroke. */}
      {showNote && (
        <tr>
          {/* Spans the checkbox column too, so the note's left edge lines up
              under the checkbox rather than starting a column in. Still stops at
              the rationale column on the right. */}
          <td
            colSpan={3}
            className={cn("px-4 pb-4", box, "border-l border-b rounded-bl-xl")}
          >
            <AttentionNote className="max-w-none">{filing.uncertainty}</AttentionNote>
          </td>
          <td colSpan={2} className={cn(box, "border-b border-r rounded-br-xl")} />
        </tr>
      )}
    </>
  );
}

/** The source, compact: the artefact's mark, its title as a link, kind and date. */
function SourceCell({ filing }: { filing: Filing }) {
  const { url, title, kind, lastUpdated } = filing.foundOn;

  // A return type the expert typed in has no source yet — show that plainly
  // rather than a link to nowhere.
  if (!url) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-text-muted">
        <PenLine className="size-4 text-text-faint" />
        {copy.filings.manualSourceLabel}
      </span>
    );
  }

  const extension = extensionOf(url);
  const host = extension ? null : hostOf(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group/source flex min-w-0 items-start gap-3"
    >
      <SourceMark extension={extension} host={host} />
      <span className="min-w-0 flex-1">
        {/* Wraps rather than truncating: the title is what tells the expert
            which document this is, so none of it is hidden. */}
        <span className="block font-medium leading-5 text-brand transition-colors group-hover/source:text-brand-hover">
          <span className="underline decoration-brand/40 underline-offset-2 group-hover/source:decoration-brand">
            {title}
          </span>
          <ArrowUpRight className="ml-1 inline size-3.5 align-[-2px]" />
        </span>
        {/* Stacked, as in the card, so neither line is cut off in the column. */}
        <span className="mt-1 block truncate text-[13px] leading-5 text-text-muted">
          {SOURCE_KIND_LABEL[kind]}
        </span>
        {lastUpdated && (
          <span className="block truncate text-[13px] leading-5 text-text-muted">
            {copy.sources.updatedLabel} {formatDate(lastUpdated)}
          </span>
        )}
      </span>
    </a>
  );
}
