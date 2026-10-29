"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { AgentWorking, useAgentRun } from "@/components/patterns/agent-working";
import { ContinueActions } from "@/components/patterns/continue-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DraftActions } from "@/components/patterns/draft-actions";
import { JumpToReview } from "@/components/patterns/jump-to-review";
import { PrintOnly, printAs } from "@/components/patterns/print-only";
import { FormSheet } from "@/components/domain/form-sheet";
import { StepNav, ViewOnlyBar, useStepView } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import type { FormEdition, FormPage } from "@/lib/types";
import { ExportMenu } from "./export-menu";
import { FormSection } from "./form-section";
import { PageViewer } from "./page-viewer";
import { useForms } from "./use-forms";


interface Viewing {
  obligationId: string;
  editionId: string;
  index: number;
}

interface PrintJob {
  title: string;
  sheets: { key: string; edition: FormEdition; page: FormPage; pageNumber: number }[];
}

export function FormsScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const t = copy.taxForms;
  const router = useRouter();
  const r = useForms(countryCode);
  /* In review, a reviewer reads this step locked; the expert can still edit
     it and send it for approval again. */
  const review = useStepReview(countryCode, 2);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(2);
  const readOnly = review.readOnly || viewFrom !== null;
  /* The agent works for a few seconds on arrival before the results land. */
  const agent = useAgentRun(copy.agentRuns.forms.trail.length);
  const code = countryCode.toLowerCase();

  /* One viewer for the whole step, opened on whichever page was clicked. */
  const [viewing, setViewing] = React.useState<Viewing | null>(null);
  const viewForm = viewing && r.forms.find((f) => f.obligationId === viewing.obligationId);
  const viewEdition = viewForm?.editions.find((e) => e.id === viewing?.editionId);
  /* Only the edition under review can be ticked; a clashing one is for reading. */
  const viewSelectable = !!viewForm && !!viewEdition && r.editionOf(viewForm)?.id === viewEdition.id;

  /* Export: lay the ticked pages out for print, then hand them to the browser's
     own Save as PDF once they have rendered. */
  const [printJob, setPrintJob] = React.useState<PrintJob | null>(null);
  React.useEffect(() => {
    if (!printJob) return;
    const id = requestAnimationFrame(() => {
      printAs(printJob.title);
      setPrintJob(null);
    });
    return () => cancelAnimationFrame(id);
  }, [printJob]);

  function exportPdf(obligationId: string | null) {
    const sheets = r.forms
      .filter((f) => obligationId === null || f.obligationId === obligationId)
      .flatMap((f) => {
        const edition = r.editionOf(f);
        if (!edition) return [];
        return edition.pages
          .map((page, i) => ({ key: page.id, edition, page, pageNumber: i + 1 }))
          .filter((s) => r.isSelected(s.page));
      });
    const name = obligationId
      ? `${countryName} — ${r.forms.find((f) => f.obligationId === obligationId)?.obligationName}`
      : fill(t.exportFileName, { country: countryName });
    setPrintJob({ title: name, sheets });
  }

  const exportChoices = r.forms
    .map((f) => ({
      obligationId: f.obligationId,
      label: f.obligationName,
      count: r.selectedPages(f).length,
    }))
    .filter((c) => c.count > 0);

  return (
    <ReadOnly value={readOnly}>
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={`/countries/${code}/returns`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            {t.backLink}
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[22px] font-medium tracking-tight text-heading">
              {countryName}
            </h1>
            <DraftActions onDiscard={() => router.push("/countries")} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <StepNav countryCode={countryCode} index={2} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {agent.running ? (
            <AgentWorking
              title={copy.agentRuns.forms.title}
              hint={copy.agentRuns.hint}
              trailLabel={copy.agentRuns.trailLabel}
              trail={copy.agentRuns.forms.trail}
              shown={agent.shown}
            />
          ) : (
            <>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <h2 className="text-[17px] font-medium tracking-tight text-heading">
                  {t.title}
                </h2>
                <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">
                  {t.intro}
                </p>
              </div>

              {r.forms.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <JumpToReview count={r.decisionCount} verb="review" />
                  <span className="text-[13px] text-text-muted" data-numeric>
                    {fill(t.summary, {
                      selected: r.totalSelected,
                      pages: r.totalPages,
                    })}
                  </span>
                  <ExportMenu all={r.totalSelected} perForm={exportChoices} onExport={exportPdf} />
                </div>
              )}
            </div>

            {r.forms.length === 0 ? (
              <EmptyState countryCode={code} />
            ) : (
              <div className="mt-6 space-y-6">
                {r.forms.map((f, i) => (
                  <FormSection
                    key={f.obligationId}
                    form={f}
                    r={r}
                    index={i}
                    onOpenPage={(obligationId, editionId, index) =>
                      setViewing({ obligationId, editionId, index })
                    }
                  />
                ))}
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Pinned action bar — Continue is reachable without scrolling to the end. */}
      {viewFrom !== null ? (
        <ViewOnlyBar countryCode={countryCode} index={2} from={viewFrom} />
      ) : review.inReview ? (
        <ReviewBar countryCode={countryCode} stepIndex={2} review={review} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${code}/returns`}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {!agent.running && !r.allReady && r.forms.length > 0 && (
              <span className="text-sm text-text-muted" data-numeric>
                {fill(t.ready, { ready: r.readyCount, total: r.forms.length })}
              </span>
            )}
            <ContinueActions
              onSave={() => toast(copy.page.savedToast)}
              continueDisabled={agent.running || !r.allReady}
              onContinue={() => router.push(`/countries/${code}/rules`)}
            />
          </div>
        </div>
      </div>
      )}

      {viewForm && viewEdition && viewing && (
        <PageViewer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          formName={viewForm.obligationName}
          edition={viewEdition}
          index={viewing.index}
          onIndexChange={(index) => setViewing({ ...viewing, index })}
          isSelected={viewSelectable ? r.isSelected : undefined}
          onSelectedChange={viewSelectable && !readOnly ? (page, on) => r.setPage(page.id, on) : undefined}
        />
      )}

      <PrintOnly>
        {printJob?.sheets.map((s, i) => (
          <div
            key={s.key}
            style={{
              width: "210mm",
              height: "297mm",
              overflow: "hidden",
              breakAfter: i < printJob.sheets.length - 1 ? "page" : "auto",
            }}
          >
            <FormSheet edition={s.edition} page={s.page} pageNumber={s.pageNumber} />
          </div>
        ))}
      </PrintOnly>
    </div>
    </ReadOnly>
  );
}

function EmptyState({ countryCode }: { countryCode: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border-strong bg-surface p-10 text-center">
      <p className="text-[15px] font-medium text-text">{copy.taxForms.empty}</p>
      <p className="mx-auto mt-1.5 max-w-[48ch] text-sm text-text-muted">
        {copy.taxForms.emptyHint}
      </p>
      <Button variant="secondary" asChild className="mt-5">
        <Link href={`/countries/${countryCode}/returns`}>
          <ArrowLeft />
          {copy.page.back}
        </Link>
      </Button>
    </div>
  );
}
