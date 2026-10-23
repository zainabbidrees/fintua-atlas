"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddFileOrLink } from "@/components/patterns/add-file-or-link";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { LiveTrail } from "@/components/patterns/live-trail";
import { PickOne } from "@/components/patterns/pick-one";
import { StepMarks, Stepper } from "@/components/patterns/stepper";
import { CountryPicker } from "@/components/domain/country-picker";
import { DescribeDocument } from "@/components/domain/describe-document";
import { DocumentList } from "@/components/domain/document-list";
import { FilingCard, formatDate } from "@/components/domain/filing-card";
import { SourcePanel } from "@/components/domain/source-panel";
import { copy, fill } from "@/lib/copy";
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { useSetup } from "./use-setup";
import type { Filing, Source } from "@/lib/types";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function SetupScreen() {
  const s = useSetup();

  const [filingToRemove, setFilingToRemove] = React.useState<Filing | null>(null);
  const [sourceToRemove, setSourceToRemove] = React.useState<Source | null>(null);
  const [pendingFile, setPendingFile] = React.useState<{ name: string; size: number } | null>(null);
  const [collision, setCollision] = React.useState<{
    source: Source;
    file: { name: string; size: number };
  } | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [term, setTerm] = React.useState("");
  const [finished, setFinished] = React.useState(false);

  const researching = s.phase === "researching";
  const hasResults = s.phase === "found" && s.filings.length > 0;
  const canContinue = hasResults && s.needsCheck === 0;

  function handleFile(file: File) {
    setFileError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError(fill(copy.documents.tooLarge, { name: file.name }));
      return;
    }
    const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPTED_FILE_TYPES.includes(ext)) {
      setFileError(fill(copy.documents.wrongType, { name: file.name }));
      return;
    }
    const clash = s.findCollision(file.name);
    if (clash) {
      setCollision({ source: clash.source, file: { name: file.name, size: file.size } });
      return;
    }
    setPendingFile({ name: file.name, size: file.size });
  }

  if (finished && s.country) {
    return (
      <SetupComplete
        countryCode={s.country.code}
        countryName={s.country.name}
        count={s.filings.length}
        onBack={() => setFinished(false)}
      />
    );
  }

  return (
    <div className="pb-20">
      {/* Header band — sits on the sunken surface so the working area reads as paper. */}
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            Countries
          </Link>

          <div className="mt-3 flex items-end justify-between gap-6">
            <div className="flex items-center gap-3">
              {s.country && (
                <span aria-hidden className="text-[28px] leading-none">
                  {s.country.flag}
                </span>
              )}
              <div>
                <h1 className="text-[22px] font-semibold tracking-tight text-text">
                  {s.country ? s.country.name : copy.page.title}
                </h1>
                <p className="mt-0.5 text-sm text-text-muted">{copy.page.step}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              {copy.page.saveDraft}
            </Button>
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={0} completedCount={0} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <section className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)]">
            <CountryPicker
              value={s.country}
              label={copy.country.label}
              placeholder={copy.country.placeholder}
              onSelect={s.selectCountry}
            />
            {s.phase === "empty" && (
              <p className="mt-3 text-sm text-text-muted">{copy.country.empty}</p>
            )}
          </section>

          {/* Before a jurisdiction is chosen, both downstream blocks are shown
              inert rather than hidden — the expert can see what this step will
              ask of them before committing to a jurisdiction. */}
          {!s.country && (
            <div aria-disabled className="select-none">
              <section className="mt-5 rounded-xl border border-border bg-surface-sunken/60 p-5">
                <h2 className="text-[15px] font-semibold text-text-faint">
                  {copy.filings.pendingHeading}
                </h2>
                <p className="mt-1 text-sm text-text-faint">{copy.filings.pendingHint}</p>
              </section>

              <section className="mt-5 rounded-xl border border-border bg-surface-sunken/60 p-5">
                <h2 className="text-[15px] font-semibold text-text-faint">
                  {copy.documents.heading}
                </h2>
                <p className="mt-1 text-sm text-text-faint">{copy.documents.pendingHint}</p>
              </section>
            </div>
          )}

          {researching && s.country && (
            <section className="mt-5 rounded-xl border border-brand-edge bg-brand-quiet/50 p-5">
              <h2 className="text-[15px] font-semibold text-text">
                {fill(copy.research.runningTitle, { country: s.country.name })}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{copy.research.runningHint}</p>
              <LiveTrail entries={s.trail} label={copy.research.trailLabel} className="mt-4" />
            </section>
          )}

          {(s.phase === "nothing_found" || s.phase === "failed") && s.country && (
            <section className="mt-5 rounded-xl border border-attention-edge bg-attention-quiet p-5">
              <p className="text-sm leading-relaxed text-text">
                {s.phase === "failed"
                  ? fill(copy.filings.failed, { country: s.country.name })
                  : fill(copy.filings.noneFound, { country: s.country.name })}
              </p>
              <Button size="sm" className="mt-3" onClick={s.retry}>
                <RotateCcw />
                {copy.filings.retry}
              </Button>
            </section>
          )}

          {hasResults && s.country && (
            <section className="mt-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[17px] font-semibold tracking-tight text-text">
                  {fill(copy.filings.heading, {
                    country: s.country.name,
                    count: s.filings.length,
                  })}
                </h2>
                <p
                  className={
                    s.needsCheck === 0
                      ? "text-sm font-medium text-settled"
                      : "text-sm font-medium text-attention-text"
                  }
                >
                  {s.needsCheck === 0
                    ? fill(copy.filings.summaryAllClear, { count: s.filings.length })
                    : fill(
                        s.needsCheck === 1
                          ? copy.filings.summaryMixed
                          : copy.filings.summaryMixedPlural,
                        { solid: s.filings.length - s.needsCheck, checks: s.needsCheck },
                      )}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {s.filings.map((filing) => (
                  <FilingCard
                    key={filing.id}
                    filing={filing}
                    onKeep={s.keepFiling}
                    onRemove={setFilingToRemove}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-border bg-surface p-4">
                <label className="text-sm font-medium text-text">
                  {copy.filings.searchMore}
                </label>
                <div className="mt-2 flex max-w-md gap-2">
                  <Input
                    value={term}
                    onChange={(e) => {
                      setTerm(e.target.value);
                      s.clearSearchMessage();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && term.trim()) {
                        void s.addFiling(term);
                        setTerm("");
                      }
                    }}
                    placeholder={copy.filings.searchMorePlaceholder}
                  />
                  <Button
                    disabled={!term.trim() || s.searching}
                    onClick={() => {
                      void s.addFiling(term);
                      setTerm("");
                    }}
                  >
                    <Search />
                    {copy.filings.searchMoreAction}
                  </Button>
                </div>
                {s.searchMessage && (
                  <p className="mt-2 text-sm text-text-muted">{s.searchMessage}</p>
                )}
              </div>
            </section>
          )}

          {s.sources.length > 0 && (
            <div className="mt-6">
              <SourcePanel sources={s.sources} filings={s.filings} onRemove={setSourceToRemove} />
            </div>
          )}

          {s.country && (
            <div className="mt-6">
              <AddFileOrLink
                heading={copy.documents.heading}
                hint={copy.documents.hint}
                chooseLabel={copy.documents.dropAction}
                linkPlaceholder={copy.documents.linkPlaceholder}
                linkInvalidMessage={copy.documents.linkInvalid}
                accept={ACCEPTED_FILE_TYPES.join(",")}
                onFile={handleFile}
                onLink={(url) => setPendingFile({ name: new URL(url).hostname, size: 0 })}
              />
              {fileError && <p className="mt-2 text-sm text-risk">{fileError}</p>}
              <DocumentList documents={s.documents} onRemove={s.removeDocument} />
            </div>
          )}
        </div>
      </div>

      {/* Action bar — pinned, so Continue is reachable without scrolling to the end. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/countries">
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {hasResults && s.needsCheck > 0 && (
              <span className="text-sm text-attention-text">
                {fill(
                  s.needsCheck === 1
                    ? copy.page.blockedNeedsCheck
                    : copy.page.blockedNeedsCheckPlural,
                  { count: s.needsCheck },
                )}
              </span>
            )}
            {s.phase === "found" && s.filings.length === 0 && (
              <span className="text-sm text-text-muted">{copy.page.blockedNoFilings}</span>
            )}
            <Button
              variant="primary"
              disabled={!canContinue}
              onClick={() => setFinished(true)}
            >
              {copy.page.continue}
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <ConfirmWithReason
        open={filingToRemove !== null}
        onOpenChange={(open) => !open && setFilingToRemove(null)}
        title={copy.removeReason.title}
        hint={copy.removeReason.hint}
        placeholder={copy.removeReason.placeholder}
        confirmLabel={copy.removeReason.confirm}
        cancelLabel={copy.removeReason.cancel}
        onConfirm={(reason) => {
          if (filingToRemove) s.removeFiling(filingToRemove, reason);
          setFilingToRemove(null);
        }}
      />

      <ConfirmWithReason
        open={sourceToRemove !== null}
        onOpenChange={(open) => !open && setSourceToRemove(null)}
        title={copy.removeReason.title}
        hint={copy.removeReason.hint}
        placeholder={copy.removeReason.placeholder}
        confirmLabel={copy.removeReason.confirm}
        cancelLabel={copy.removeReason.cancel}
        onConfirm={(reason) => {
          if (sourceToRemove) s.removeSource(sourceToRemove, reason);
          setSourceToRemove(null);
        }}
      />

      <DescribeDocument
        fileName={pendingFile?.name ?? null}
        open={pendingFile !== null}
        onOpenChange={(open) => !open && setPendingFile(null)}
        onSave={(kind, note) => {
          if (pendingFile) s.addDocument(pendingFile.name, pendingFile.size, kind, note);
          setPendingFile(null);
        }}
      />

      {collision && (
        <PickOne
          open
          onOpenChange={(open) => !open && setCollision(null)}
          title={copy.duplicate.title}
          hint={fill(copy.duplicate.body, {
            name: collision.file.name,
            publisher: collision.source.publisher,
          })}
          subject={collision.source.title}
          options={[
            {
              id: "yours",
              label: copy.duplicate.useYours,
              attribution: collision.file.name,
              meta: `Your copy · ${formatDate("2026-09-01")}`,
            },
            {
              id: "theirs",
              label: copy.duplicate.keepOurs,
              attribution: collision.source.publisher,
              meta: collision.source.lastUpdated
                ? `Found online · ${formatDate(collision.source.lastUpdated)}`
                : undefined,
            },
            {
              id: "both",
              label: copy.duplicate.keepBoth,
              attribution: "Use both, and flag any disagreement",
            },
          ]}
          reasonLabel={copy.clash.reasonLabel}
          reasonPlaceholder={copy.clash.reasonPlaceholder}
          confirmLabel={copy.clash.confirm}
          cancelLabel={copy.documents.cancel}
          onConfirm={(choice, reason) => {
            s.record("Resolved duplicate", collision.source.title, reason);
            if (choice !== "theirs") setPendingFile(collision.file);
            setCollision(null);
          }}
        />
      )}
    </div>
  );
}

/** Closes the step: says what was agreed, and what happens next. */
function SetupComplete({
  countryCode,
  countryName,
  count,
  onBack,
}: {
  countryCode: string;
  countryName: string;
  count: number;
  onBack: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-16 sm:px-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-[var(--shadow-raised)]">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-settled-quiet">
            <Check className="size-6 text-settled" />
          </span>

          <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-text">
            {copy.page.done}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-text-muted">
            {fill(copy.page.doneBody, { count, country: countryName })}
          </p>

          <div className="mt-7">
            <StepMarks total={STEPS.length} completed={1} label="Step 1 of 5 complete" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="ghost" onClick={onBack}>
              {copy.page.doneReview}
            </Button>
            <Button variant="primary" size="lg" asChild>
              <Link href={`/countries/${countryCode}/returns`}>
                {copy.page.doneNext}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
