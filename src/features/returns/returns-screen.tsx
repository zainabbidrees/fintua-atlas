"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { AgentWorking, useAgentRun } from "@/components/patterns/agent-working";
import { ContinueActions } from "@/components/patterns/continue-actions";
import {
  ListFilter,
  NoMatch,
  Pagination,
  matches,
  usePaged,
} from "@/components/patterns/list-controls";
import { Button } from "@/components/ui/button";
import { DraftActions } from "@/components/patterns/draft-actions";
import { StepNav, ViewOnlyBar, useStepView } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import type { Evidence, ObligationRun } from "@/lib/types";
import { ReturnsTable } from "./returns-table";
import { PassageDrawer } from "./passage-drawer";
import { useReturns } from "./use-returns";


type View = keyof typeof copy.list.returnsChips;

export function ReturnsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const r = useReturns(countryCode);
  /* In review, a reviewer reads this step locked; the expert can still edit
     it and send it for approval again. */
  const review = useStepReview(countryCode, 1);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(1);
  const readOnly = review.readOnly || viewFrom !== null;
  /* The agent works for a few seconds on arrival before the results land. */
  const agent = useAgentRun(copy.agentRuns.returns.trail.length);
  const cleared = r.obligations.filter(r.isSettled).length;

  /* One passage drawer for the whole table — a source click anywhere opens it on
     that document, scrolled to the exact wording. */
  const [passage, setPassage] = React.useState<Evidence | null>(null);

  /* The filter: a view by status, and a term matched against the name. */
  const [view, setView] = React.useState<View>("all");
  const [term, setTerm] = React.useState("");
  const inView = (o: ObligationRun, v: View) =>
    v === "all" ||
    (o.agent !== "running" && (v === "confirmed" ? r.isSettled(o) : !r.isSettled(o)));
  const filtered = r.obligations.filter(
    (o) => inView(o, view) && matches(term, [o.name, o.localName ?? undefined]),
  );
  const paged = usePaged(filtered);

  /* Starts empty: Select all appears once the expert ticks a first row. */
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const selectedCount = r.obligations.filter((o) => selected.has(o.id)).length;
  /* The ticked rows still waiting on a decision — what Confirm all acts on. */
  const toConfirm = r.obligations.filter(
    (o) => selected.has(o.id) && o.agent !== "running" && !r.isSettled(o),
  );

  /* Clears every ticked row in one go, with one Undo that puts them all back. */
  function confirmSelected() {
    const ids = toConfirm.map((o) => o.id);
    for (const id of ids) r.confirmObligation(id);
    const message =
      toConfirm.length === 1
        ? fill(copy.returnsTable.confirmedToast, { name: toConfirm[0].name })
        : fill(copy.returnsTable.confirmedAllToast, { count: ids.length });
    toast(message, {
      action: {
        label: copy.returnsTable.undo,
        onClick: () => ids.forEach((id) => r.resetObligation(id)),
      },
    });
  }

  function setRowSelected(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <ReadOnly value={readOnly}>
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            Countries
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[22px] font-medium tracking-tight text-heading">
              {countryName}
            </h1>
            <DraftActions onDiscard={() => router.push("/countries")} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <StepNav countryCode={countryCode} index={1} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {agent.running ? (
            <AgentWorking
              title={copy.agentRuns.returns.title}
              hint={copy.agentRuns.hint}
              trailLabel={copy.agentRuns.trailLabel}
              trail={copy.agentRuns.returns.trail}
              shown={agent.shown}
            />
          ) : (
            <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[17px] font-medium tracking-tight text-heading">
                {fill(copy.filings.heading, {
                  country: countryName,
                  count: r.obligations.length,
                })}
              </h2>
              {/* The same cluster as step one's: the count, with Select all
                  beside it until every row is ticked. */}
              {selectedCount > 0 && (
                <div className="inline-flex items-center gap-x-3 rounded-lg border border-border-strong bg-surface px-3 py-1.5 shadow-[var(--shadow-raised)]">
                  <span className="text-[13px] font-medium text-text" data-numeric>
                    {fill(copy.filings.selectedCount, { count: selectedCount })}
                  </span>
                  {selectedCount < r.obligations.length && (
                    <button
                      type="button"
                      onClick={() => setSelected(new Set(r.obligations.map((o) => o.id)))}
                      className="text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
                    >
                      {copy.filings.selectAll}
                    </button>
                  )}
                  {toConfirm.length > 0 && (
                    <>
                      <span aria-hidden className="h-4 w-px bg-border" />
                      <button
                        type="button"
                        onClick={confirmSelected}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
                      >
                        <Check className="size-3.5" />
                        {selectedCount === r.obligations.length
                          ? copy.returnsTable.confirmAll
                          : copy.returnsTable.confirmSelected}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {r.obligations.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <ListFilter
                  className="mt-4"
                  value={term}
                  onChange={(v) => {
                    setTerm(v);
                    paged.setPage(1);
                  }}
                  placeholder={copy.list.filterReturns}
                  chip={view}
                  onChipChange={(v) => {
                    setView(v);
                    paged.setPage(1);
                  }}
                  chips={(Object.keys(copy.list.returnsChips) as View[]).map((id) => ({
                    id,
                    label: copy.list.returnsChips[id],
                    count: r.obligations.filter((o) => inView(o, id)).length,
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
                  <ReturnsTable
                    r={r}
                    rows={paged.items}
                    selected={selected}
                    onSelectedChange={setRowSelected}
                    onOpenSource={(evidence) => setPassage(evidence)}
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

      {/* Pinned action bar — Continue is reachable without scrolling to the end. */}
      {viewFrom !== null ? (
        <ViewOnlyBar countryCode={countryCode} index={1} from={viewFrom} />
      ) : review.inReview ? (
        <ReviewBar countryCode={countryCode} stepIndex={1} review={review} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/countries/new">
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {!agent.running && !r.allSettled && (
              <span className="text-sm text-text-muted" data-numeric>
                {fill(copy.returnsTable.cleared, {
                  cleared,
                  total: r.obligations.length,
                })}
              </span>
            )}
            <ContinueActions
              onSave={() => toast(copy.page.savedToast)}
              continueDisabled={agent.running || !r.allSettled}
              onContinue={() => router.push(`/countries/${countryCode.toLowerCase()}/forms`)}
            />
          </div>
        </div>
      </div>
      )}

      {passage && (
        <PassageDrawer
          evidence={passage}
          open={passage !== null}
          onOpenChange={(open) => !open && setPassage(null)}
        />
      )}
    </div>
    </ReadOnly>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
      <p className="text-[15px] font-medium text-text">
        {copy.returnsTable.empty}
      </p>
      <p className="mx-auto mt-1.5 max-w-[48ch] text-sm text-text-muted">
        {copy.returnsTable.emptyHint}
      </p>
      <Button variant="secondary" asChild className="mt-5">
        <Link href="/countries/new">
          <ArrowLeft />
          {copy.page.back}
        </Link>
      </Button>
    </div>
  );
}
