"use client";

import { ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { formatDate } from "./filing-card";
import { copy, fill, SOURCE_KIND_LABEL } from "@/lib/copy";
import type { Filing, Source } from "@/lib/types";

/**
 * Where we read, as supporting evidence rather than a second checklist.
 *
 * Collapsed by default and deliberately quieter than the filings above it. The
 * filings are the scope decision — getting those wrong costs weeks. Sources are
 * the means. The prototype gave both equal weight as side-by-side tables, which
 * split the expert's attention evenly between a large decision and a small one.
 *
 * Each source carries its publisher and when it was last updated: guidance from
 * 2019 about 2026 rules is worthless, and that is the first thing an expert
 * checks. The prototype showed neither.
 */
export function SourcePanel({
  sources,
  filings,
  onRemove,
}: {
  sources: Source[];
  filings: Filing[];
  onRemove: (source: Source) => void;
}) {
  if (sources.length === 0) return null;

  return (
    <Disclosure
      summary={fill(copy.sources.heading, { count: sources.length })}
      className="border-t border-border pt-4"
    >
      <ul className="space-y-2">
        {sources.map((source) => {
          const usedBy = filings.filter((f) => f.foundOn.id === source.id).length;

          return (
            <li
              key={source.id}
              className="group flex items-start justify-between gap-4 rounded-md border border-border bg-surface px-3 py-2.5"
            >
              <div className="min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-text underline decoration-border-strong underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                >
                  {source.title}
                  <ArrowUpRight className="size-3.5 shrink-0 text-text-faint" />
                </a>

                <p className="mt-0.5 text-xs text-text-muted">
                  {SOURCE_KIND_LABEL[source.kind]} · {source.publisher}
                </p>

                <p className="mt-0.5 text-xs text-text-faint" data-numeric>
                  {source.lastUpdated
                    ? `${copy.sources.updatedLabel} ${formatDate(source.lastUpdated)}`
                    : copy.sources.updatedUnknown}
                  {usedBy > 0 &&
                    ` · ${fill(
                      usedBy === 1 ? copy.sources.inUse : copy.sources.inUsePlural,
                      { count: usedBy },
                    )}`}
                </p>

                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                  {source.whatsInIt}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(source)}
                aria-label={`${copy.sources.remove} ${source.title}`}
                className="shrink-0 text-text-faint transition-colors hover:text-risk"
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ul>
    </Disclosure>
  );
}
