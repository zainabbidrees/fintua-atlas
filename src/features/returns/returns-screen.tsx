"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { SentStatus, useSendStep } from "@/features/review/use-send-step";
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
import { useSaveDraft } from "@/features/drafts/use-save-draft";
import { StepNav, ViewOnlyBar, useStepView, useCameBack } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import { writeReturnsCarried } from "@/lib/returns-carried";
import type { Evidence, ObligationRun } from "@/lib/types";
import { ReturnsTable } from "./returns-table";
import { PassageDrawer } from "./passage-drawer";
import { AddRowDialog, type ReturnTypeChoice } from "./add-row-dialog";
import { returnTypeOf, useReturns } from "./use-returns";


type View = keyof typeof copy.list.returnsChips;

export function ReturnsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const saveDraft = useSaveDraft(countryCode, countryName, 1);
  const r = useReturns(countryCode);
  /* In review, a reviewer reads this step locked; the expert can still edit
     it and send it for approval again. */
  const review = useStepReview(countryCode, 1);
  /* Moving on sends the step for approval; the expert carries on regardless. */
  const sendStep = useSendStep(countryCode, countryName, 1);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(1);
  const readOnly = review.readOnly || viewFrom !== null;
  const cameBack = useCameBack();
  /* The agent works for a few seconds on first arrival; a step looked back
     at, or one whose run already finished, opens on the result. */
  const agent = useAgentRun(copy.agentRuns.returns.trail.length, {
    skip: readOnly || cameBack,
  });

  /* One passage drawer for the whole table — a source click anywhere opens it on
     that document, scrolled to the exact wording. */
  const [passage, setPassage] = React.useState<Evidence | null>(null);

  /* Adding a schedule the agent missed: to one of this country's return
     types, each listed once with the frequencies it already has. */
  const [adding, setAdding] = React.useState(false);
  const returnTypes: ReturnTypeChoice[] = [];
  for (const o of r.obligations) {
    if (o.agent === "running") continue;
    const id = returnTypeOf(o);
    const frequency = o.findings.find((f) => f.role === "frequency")?.value;
    const known = returnTypes.find((x) => x.id === id);
    if (known) {
      if (frequency) known.frequencies.push(frequency);
    } else {
      returnTypes.push({ id, name: o.name, frequencies: frequency ? [frequency] : [] });
    }
  }

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

  /* Carry forward. Every return type is carried by default; deselecting a row
     drops it — so it won't block Continue and won't appear in the later steps.
     Tracked as exclusions, so a row the agent adds later is carried too. */
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(new Set());
  const carried = r.obligations.filter((o) => !excluded.has(o.id));
  const carriedIds = new Set(carried.map((o) => o.id));
  const droppedCount = r.obligations.length - carried.length;

  /* The carried rows still waiting on a decision — what Confirm all acts on.
     Dropped rows are left out: not carried, so they need not be settled. */
  const toConfirm = carried.filter(
    (o) => o.agent !== "running" && !r.isSettled(o),
  );
  /* Continue waits only on what's carried, and on at least one being kept. */
  const cleared = carried.filter(r.isSettled).length;
  const carriedSettled = carried.length > 0 && carried.every(r.isSettled);

  /* The return types carried forward, for the later steps to read. A return
     type stays carried while any one of its schedule rows is. */
  const carriedTypes = React.useMemo(
    () => [...new Set(r.obligations.filter((o) => !excluded.has(o.id)).map(returnTypeOf))],
    [r.obligations, excluded],
  );
  React.useEffect(() => {
    writeReturnsCarried(countryCode, carriedTypes);
  }, [countryCode, carriedTypes]);

  /* Clears every carried row still waiting, with one Undo that puts them back. */
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

  /* Deselecting drops a row from carry-forward; selecting takes it back. */
  function setRowSelected(id: string, on: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (on) next.delete(id);
      else next.add(id);
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
            <DraftActions onDiscard={() => router.push("/countries")} onSave={saveDraft} />
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
                  count: new Set(r.obligations.map(returnTypeOf)).size,
                })}
              </h2>
              {/* Carry-forward: a note when some rows are dropped, with one way
                  to take them all back, and a bulk Confirm for what's still open. */}
              {(droppedCount > 0 || toConfirm.length > 0) && (
                <div className="inline-flex items-center gap-x-3 rounded-lg border border-border-strong bg-surface px-3 py-1.5 shadow-[var(--shadow-raised)]">
                  {droppedCount > 0 && (
                    <>
                      <span className="text-[13px] font-medium text-text" data-numeric>
                        {fill(copy.returnsTable.notCarried, { count: droppedCount })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExcluded(new Set())}
                        className="text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
                      >
                        {copy.returnsTable.carryAll}
                      </button>
                    </>
                  )}
                  {droppedCount > 0 && toConfirm.length > 0 && (
                    <span aria-hidden className="h-4 w-px bg-border" />
                  )}
                  {toConfirm.length > 0 && (
                    <button
                      type="button"
                      onClick={confirmSelected}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
                    >
                      <Check className="size-3.5" />
                      {copy.returnsTable.confirmAll}
                    </button>
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
                  actions={
                    !readOnly && (
                      <Button
                        variant="secondary"
                        onClick={() => setAdding(true)}
                        className="h-9 shrink-0 active:scale-[0.98]"
                      >
                        <Plus />
                        {copy.returnsTable.addRow}
                      </Button>
                    )
                  }
                />
                <AddRowDialog
                  open={adding}
                  onOpenChange={setAdding}
                  types={returnTypes}
                  onAdd={(row) => {
                    r.addRow(row);
                    /* Clear the filter so the new row is in view. */
                    setTerm("");
                    setView("all");
                    const name = returnTypes.find((x) => x.id === row.returnTypeId)?.name ?? "";
                    toast(fill(copy.returnsTable.addedToast, { name, frequency: row.frequency }));
                  }}
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
                    selected={carriedIds}
                    onSelectedChange={setRowSelected}
                    onOpenSource={(evidence) => setPassage(evidence)}
                  />
                )}
                <Pagination
                  className="mt-4"
                  page={paged.page}
                  pages={paged.pages}
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
      ) : review.reviewing ? (
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
            {!agent.running && !carriedSettled && (
              <span className="text-sm text-text-muted" data-numeric>
                {fill(copy.returnsTable.cleared, {
                  cleared,
                  total: carried.length,
                })}
              </span>
            )}
            <SentStatus send={sendStep} />
            <ContinueActions
              onSave={() => toast(copy.page.savedToast)}
              continueDisabled={agent.running || !carriedSettled}
              continueLabel={sendStep.label}
              onContinue={() =>
                sendStep.send(() => router.push(`/countries/${countryCode.toLowerCase()}/forms`))
              }
              onNext={() => router.push(`/countries/${countryCode.toLowerCase()}/forms`)}
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
