"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceBlock } from "@/components/domain/source-block";
import { copy, fill, SOURCE_KIND_LABEL } from "@/lib/copy";
import type { Filing } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * A filing, with the source it came from shown underneath it.
 *
 * This is the central change from the prototype. There, sources were one table
 * and return types another, so the answer and its evidence lived on different
 * screens — checking "is the deadline really the 16th?" meant leaving, finding
 * the document and searching it by hand. Every document-AI product converges on
 * the opposite: put the value and its source together, so the expert's job is
 * "confirm or correct", not "go do research".
 */
export function FilingCard({
  filing,
  selected,
  onSelectedChange,
  onKeep,
  onRemove,
}: {
  filing: Filing;
  /** Whether this obligation is carried into the next step. */
  selected: boolean;
  onSelectedChange: (filing: Filing, selected: boolean) => void;
  onKeep: (filing: Filing) => void;
  onRemove: (filing: Filing) => void;
}) {
  const needsCheck = filing.certainty === "needs_check";

  return (
    <article
      className={cn(
        "group rounded-lg border bg-surface p-4 shadow-[var(--shadow-raised)] transition-colors",
        needsCheck ? "border-attention-edge" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {/* Carried forward or not. Distinct from Remove, which deletes the
              obligation outright and asks why. */}
          <Checkbox
            checked={selected}
            onCheckedChange={(next) => onSelectedChange(filing, next === true)}
            aria-label={fill(copy.filings.includeLabel, { name: filing.name })}
            className="mt-0.5"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h3 className="text-[15px] font-semibold text-text">
                {filing.name}
              </h3>
              <span className="text-sm text-text-muted">
                {filing.localName ?? copy.filings.localNameMissing}
              </span>
            </div>

            {filing.frequency && (
              <p className="mt-0.5 text-sm text-text-muted">{filing.frequency}</p>
            )}
          </div>
        </div>

        {needsCheck && (
          <Badge tone="attention" className="shrink-0">
            <AlertTriangle className="size-3" />
            {copy.filings.needsCheck}
          </Badge>
        )}
      </div>

      {/* The claim and its proof sit side by side, so the eye travels across
          rather than down: reading "why this applies" and "where it came from"
          is one movement. The source sits centred against the claim so it reads
          as a document pinned beside it, not a footnote under it. Capped at a
          readable measure: without it the text column grows with the page and
          strands the source against the far edge. Stacked only when there is no
          room for two columns. */}
      <div className="mt-3 flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-text">
            <span className="text-text-faint">{copy.filings.whyLabel}: </span>
            {filing.whyItApplies}
          </p>

          {/* What the agent is unsure about — stated plainly, not as a score. */}
          {needsCheck && filing.uncertainty && (
            <p className="mt-2 rounded-md bg-attention-quiet px-3 py-2 text-sm leading-relaxed text-attention-text">
              {filing.uncertainty}
            </p>
          )}
        </div>

        <SourceBlock
          className="sm:w-[338px] sm:shrink-0"
          url={filing.foundOn.url}
          title={filing.foundOn.title}
          meta={[
            SOURCE_KIND_LABEL[filing.foundOn.kind],
            filing.foundOn.lastUpdated
              ? `${copy.sources.updatedLabel} ${formatDate(filing.foundOn.lastUpdated)}`
              : null,
          ]}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(filing)}
          className={cn(
            "-ml-2 text-text-faint hover:text-risk",
            !needsCheck && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
          )}
        >
          <Trash2 />
          {copy.filings.remove}
        </Button>

        {needsCheck && (
          <Button size="sm" variant="primary" onClick={() => onKeep(filing)}>
            {copy.filings.keep}
          </Button>
        )}
      </div>
    </article>
  );
}

/** Dates are read, not calculated — spell the month out to avoid DD/MM ambiguity. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
