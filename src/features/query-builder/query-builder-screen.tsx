"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AgentWorking, useAgentRun } from "@/components/patterns/agent-working";
import { DraftActions } from "@/components/patterns/draft-actions";
import {
  ListFilter,
  NoMatch,
  Pagination,
  matches,
  usePaged,
} from "@/components/patterns/list-controls";
import { cn } from "@/lib/cn";
import { ViewOnlyBar, useStepView } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import { submitForReview } from "@/lib/review";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar, reviewHref } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { StepHeader, stepHref } from "@/features/approval/parts";
import { QueryTable } from "./query-table";
import { useQueryBuilder } from "./use-query-builder";
import type { BoxQuery } from "@/lib/mock/query-builder";

type View = keyof typeof copy.list.queryChips;

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
  /* The agent works for a few seconds on arrival before the results land. */
  const agent = useAgentRun(copy.agentRuns.queries.trail.length);
  const t = copy.queryBuilder;

  /* The filter: a view by whether the query exists, and a term matched
     against the box and its description. */
  const [view, setView] = React.useState<View>("all");
  const [term, setTerm] = React.useState("");
  const inView = (b: BoxQuery, v: View) => {
    const has = q.queries[b.id].sql.trim() !== "";
    return v === "all" || (v === "ready" ? has : !has);
  };
  const filtered = q.boxes.filter(
    (b) => inView(b, view) && matches(term, [b.box, b.description]),
  );
  const paged = usePaged(filtered);

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

  /* Sending for approval keeps what is on screen: unsaved queries are saved
     first. Every step goes to the reviewer; publishing waits on their
     approval of all six. */
  const review = useStepReview(countryCode, 5);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(5);
  const readOnly = review.readOnly || viewFrom !== null;
  function sendForApproval() {
    snapshot();
    submitForReview(countryCode, countryName, review.person);
    toast(fill(copy.approvalFlow.sentToast, { country: countryName }));
    router.push(reviewHref(countryCode));
  }

  return (
    <ReadOnly value={readOnly}>
    <div className="pb-24">
      <StepHeader
        backHref={stepHref(countryCode, 4)}
        backLabel={t.backLink}
        title={countryName}
        actions={<DraftActions onDiscard={() => router.push("/countries")} />}
        currentIndex={5}
        completedCount={5}
        countryCode={countryCode}
      />

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {agent.running ? (
            <AgentWorking
              title={copy.agentRuns.queries.title}
              hint={copy.agentRuns.hint}
              trailLabel={copy.agentRuns.trailLabel}
              trail={copy.agentRuns.queries.trail}
              shown={agent.shown}
            />
          ) : (
            <>
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
                      join it once a row is ticked. A reviewer generates nothing. */}
                  {!readOnly && (
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
                  )}
                </div>

                <ListFilter
                  className="mt-6"
                  value={term}
                  onChange={(v) => {
                    setTerm(v);
                    paged.setPage(1);
                  }}
                  placeholder={copy.list.filterBoxes}
                  chip={view}
                  onChipChange={(v) => {
                    setView(v);
                    paged.setPage(1);
                  }}
                  chips={(Object.keys(copy.list.queryChips) as View[]).map((id) => ({
                    id,
                    label: copy.list.queryChips[id],
                    count: q.boxes.filter((b) => inView(b, id)).length,
                  }))}
                />
                {filtered.length === 0 ? (
                  <NoMatch
                    query={term}
                    onClear={() => {
                      setTerm("");
                      setView("all");
                    }}
                  />
                ) : (
                  <QueryTable
                    q={q}
                    boxes={paged.items}
                    selected={selected}
                    onSelectedChange={setRowSelected}
                    onSelectAll={selectAll}
                  />
                )}
                <Pagination
                  className="mt-4"
                  page={paged.page}
                  pages={paged.pages}
                  start={paged.start}
                  shown={paged.items.length}
                  total={paged.total}
                  onPageChange={paged.setPage}
                />
              </>
            )}
            </>
          )}
        </div>
      </div>

      {viewFrom !== null ? (
        <ViewOnlyBar countryCode={countryCode} index={5} from={viewFrom} />
      ) : review.inReview ? (
        <ReviewBar countryCode={countryCode} stepIndex={5} review={review} onSave={snapshot} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={stepHref(countryCode, 4)}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {!agent.running && (
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
            )}
            <Button
              variant="secondary"
              disabled={!unsaved || q.generating}
              onClick={saveChanges}
            >
              {t.saveChanges}
            </Button>
            <Button
              variant="primary"
              disabled={agent.running || q.ready === 0 || q.generating}
              title={q.ready === 0 ? copy.approvalFlow.sendForApprovalBlocked : undefined}
              onClick={sendForApproval}
            >
              {copy.approvalFlow.sendForApproval}
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
    </ReadOnly>
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
