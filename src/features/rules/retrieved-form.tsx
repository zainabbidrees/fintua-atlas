"use client";

import * as React from "react";
import { copy, fill } from "@/lib/copy";
import { PAGE_GRID, PageThumb } from "@/features/forms/page-thumb";
import { PageViewer } from "@/features/forms/page-viewer";
import type { ReturnTypeForm } from "./return-type-picker";

/**
 * A return type the agent has not annotated: its form as it was retrieved,
 * pages readable, and a plain line saying the boxes are still to be mapped —
 * or, where no form was found, why there is nothing here to annotate.
 */
export function RetrievedForm({ type }: { type: ReturnTypeForm }) {
  const t = copy.returnTypeSpecs;
  const [viewing, setViewing] = React.useState<number | null>(null);
  const edition = type.edition;

  if (!edition) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong px-6 py-12">
        <p className="text-[15px] font-medium text-heading">
          {fill(t.noFormTitle, { name: type.name })}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
          {fill(t.noFormHint, { name: type.name })}
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border px-4 py-2.5">
          <h3 className="text-[14px] font-medium text-heading">{type.name}</h3>
          <span className="text-[13px] text-text-muted">
            {fill(t.pdfLine, {
              reference: edition.reference,
              title: edition.title,
              edition: edition.edition,
            })}
          </span>
        </div>
        <div className="bg-wash p-6">
          <ol className={PAGE_GRID}>
            {edition.pages.map((page, i) => (
              <PageThumb
                key={page.id}
                formName={type.name}
                edition={edition}
                page={page}
                index={i}
                onOpen={() => setViewing(i)}
              />
            ))}
          </ol>
        </div>
      </section>

      <div className="mt-12 rounded-xl border border-dashed border-border-strong px-6 py-12">
        <p className="text-[15px] font-medium text-heading">
          {fill(t.notAnnotatedTitle, { name: type.name })}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
          {t.notAnnotatedHint}
        </p>
      </div>

      {viewing !== null && (
        <PageViewer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          formName={type.name}
          edition={edition}
          index={viewing}
          onIndexChange={setViewing}
        />
      )}
    </>
  );
}
