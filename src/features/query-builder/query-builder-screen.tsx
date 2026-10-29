"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DraftActions } from "@/components/patterns/draft-actions";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import { markPublished } from "@/lib/published";
import { StepHeader, stepHref } from "@/features/approval/parts";
import { QueryTable } from "./query-table";
import { useQueryBuilder } from "./use-query-builder";

/**
 * Step six, Query Builder. A table of the boxes annotated at step four, each
 * with the rule that fills it; the SQL column starts empty. Ticking rows (one,
 * several, or all) brings up Generate query, and any query can be opened from
 * its row and written or corrected by hand.
 */
export function QueryBuilderScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const q = useQueryBuilder(countryCode);
  const t = copy.queryBuilder;

  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const count = q.boxes.filter((b) => selected.has(b.id)).length;
  const all = q.boxes.length > 0 && count === q.boxes.length;
  const complete = q.boxes.length > 0 && q.ready === q.boxes.length;

  function setRowSelected(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function selectAll(on: boolean) {
    setSelected(on ? new Set(q.boxes.map((b) => b.id)) : new Set());
  }

  /* Generates the ticked rows, clears the ticks, and once the batch lands
     offers one Undo that puts back whatever each row held before. */
  function generateSelected() {
    const ids = q.boxes
      .filter((b) => selected.has(b.id) && q.queries[b.id].status !== "generating")
      .map((b) => b.id);
    if (ids.length === 0) return;
    const only = q.boxes.find((b) => b.id === ids[0])?.box ?? "";
    setSelected(new Set());
    q.generate(ids, (before) => {
      toast(
        ids.length === 1
          ? fill(t.generatedToast, { box: only })
          : fill(t.generatedToastPlural, { count: ids.length }),
        { action: { label: t.undo, onClick: () => q.restore(before) } },
      );
    });
  }

  /* What the queries held at the last save, so Save changes only lights up
     once something differs from it. */
  const [saved, setSaved] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(q.boxes.map((b) => [b.id, ""])),
  );
  const unsaved = q.boxes.some((b) => q.queries[b.id].sql !== saved[b.id]);

  function snapshot() {
    setSaved(Object.fromEntries(q.boxes.map((b) => [b.id, q.queries[b.id].sql])));
  }

  function saveChanges() {
    snapshot();
    toast(t.savedToast);
  }

  /* Publishing keeps what is on screen: unsaved queries are saved first. */
  function publish() {
    snapshot();
    markPublished(countryCode, countryName);
    toast(fill(t.publishedToast, { country: countryName }));
    router.push("/countries");
  }

  return (
    <div className="pb-24">
      <StepHeader
        backHref={stepHref(countryCode, 4)}
        backLabel={t.backLink}
        title={countryName}
        actions={<DraftActions onDiscard={() => router.push("/countries")} />}
        currentIndex={5}
        completedCount={5}
      />

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {q.boxes.length === 0 ? (
            <EmptyState countryCode={countryCode} />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div>
                  <h2 className="text-[17px] font-medium tracking-tight text-heading">
                    {fill(t.heading, { count: q.boxes.length })}
                  </h2>
                  <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
                    {t.intro}
                  </p>
                </div>

                {/* Select all stands on its own; the count and Generate query
                    join it once a row is ticked. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {count > 0 && (
                    <span className="rise text-[13px] font-medium text-text" data-numeric>
                      {fill(t.selectedCount, { count })}
                    </span>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => selectAll(!all)}
                    className="active:scale-[0.98]"
                  >
                    {all ? t.deselectAll : t.selectAll}
                  </Button>
                  {count > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={generateSelected}
                      className="rise active:scale-[0.98]"
                    >
                      {count === 1 ? t.generate : t.generatePlural}
                    </Button>
                  )}
                </div>
              </div>

              <QueryTable
                q={q}
                selected={selected}
                onSelectedChange={setRowSelected}
                onSelectAll={selectAll}
              />
            </>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={stepHref(countryCode, 4)}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-sm",
                complete ? "text-settled" : "text-text-muted",
              )}
              data-numeric
            >
              {complete && <Check className="size-4" />}
              {fill(t.progress, { done: q.ready, total: q.boxes.length })}
            </span>
            <Button
              variant="secondary"
              disabled={!unsaved || q.generating}
              onClick={saveChanges}
            >
              {t.saveChanges}
            </Button>
            <Button
              variant="primary"
              disabled={q.ready === 0 || q.generating}
              title={q.ready === 0 ? t.publishBlocked : undefined}
              onClick={publish}
            >
              {t.publish}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ countryCode }: { countryCode: string }) {
  const t = copy.queryBuilder;
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-6 py-14">
      <p className="text-[15px] font-medium text-heading">{t.empty}</p>
      <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
        {t.emptyBody}
      </p>
      <Button variant="secondary" size="sm" asChild className="mt-5">
        <Link href={stepHref(countryCode, 3)}>{t.emptyAction}</Link>
      </Button>
    </div>
  );
}
