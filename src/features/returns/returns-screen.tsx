"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { ContinueActions } from "@/components/patterns/continue-actions";
import { Button } from "@/components/ui/button";
import { DraftActions } from "@/components/patterns/draft-actions";
import { Stepper } from "@/components/patterns/stepper";
import { copy, fill } from "@/lib/copy";
import type { Evidence } from "@/lib/types";
import { ReturnsTable } from "./returns-table";
import { PassageDrawer } from "./passage-drawer";
import { useReturns } from "./use-returns";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function ReturnsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const r = useReturns(countryCode);
  const cleared = r.obligations.filter(r.isSettled).length;

  /* One passage drawer for the whole table — a source click anywhere opens it on
     that document, scrolled to the exact wording. */
  const [passage, setPassage] = React.useState<Evidence | null>(null);

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
              <Stepper steps={STEPS} currentIndex={1} completedCount={1} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
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
            <ReturnsTable
              r={r}
              selected={selected}
              onSelectedChange={setRowSelected}
              onOpenSource={(evidence) => setPassage(evidence)}
            />
          )}
        </div>
      </div>

      {/* Pinned action bar — Continue is reachable without scrolling to the end. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/countries/new">
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {!r.allSettled && (
              <span className="text-sm text-text-muted" data-numeric>
                {fill(copy.returnsTable.cleared, {
                  cleared,
                  total: r.obligations.length,
                })}
              </span>
            )}
            <ContinueActions
              onSave={() => toast(copy.page.savedToast)}
              continueDisabled={!r.allSettled}
              onContinue={() => router.push(`/countries/${countryCode.toLowerCase()}/forms`)}
            />
          </div>
        </div>
      </div>

      {passage && (
        <PassageDrawer
          evidence={passage}
          open={passage !== null}
          onOpenChange={(open) => !open && setPassage(null)}
        />
      )}
    </div>
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
