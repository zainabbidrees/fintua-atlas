"use client";

import { AlertTriangle, ArrowUpRight, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copy, SOURCE_KIND_LABEL } from "@/lib/copy";
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
  onKeep,
  onRemove,
}: {
  filing: Filing;
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

        {needsCheck && (
          <Badge tone="attention" className="shrink-0">
            <AlertTriangle className="size-3" />
            {copy.filings.needsCheck}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text">
        <span className="text-text-faint">{copy.filings.whyLabel}: </span>
        {filing.whyItApplies}
      </p>

      {/* What the agent is unsure about — stated plainly, not as a score. */}
      {needsCheck && filing.uncertainty && (
        <p className="mt-2 rounded-md bg-attention-quiet px-3 py-2 text-sm leading-relaxed text-attention-text">
          {filing.uncertainty}
        </p>
      )}

      {/* The proof. */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs text-text-faint">{copy.filings.foundOnLabel}</p>
        <a
          href={filing.foundOn.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          {filing.foundOn.title}
          <ArrowUpRight className="size-3.5" />
        </a>
        <p className="mt-0.5 text-xs text-text-muted">
          {SOURCE_KIND_LABEL[filing.foundOn.kind]}
          {filing.foundOn.lastUpdated && (
            <>
              {" · "}
              <span data-numeric>
                {copy.sources.updatedLabel} {formatDate(filing.foundOn.lastUpdated)}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="mt-3 flex justify-end gap-1.5">
        {needsCheck && (
          <Button size="sm" variant="primary" onClick={() => onKeep(filing)}>
            {copy.filings.keep}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(filing)}
          className={cn(
            "text-text-faint hover:text-risk",
            !needsCheck && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
          )}
        >
          <Trash2 />
          {copy.filings.remove}
        </Button>
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
