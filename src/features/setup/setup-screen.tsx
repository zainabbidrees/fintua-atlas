"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFileOrLink } from "@/components/patterns/add-file-or-link";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { DraftActions } from "@/components/patterns/draft-actions";
import { JumpToReview } from "@/components/patterns/jump-to-review";
import { LiveTrail } from "@/components/patterns/live-trail";
import { Stepper } from "@/components/patterns/stepper";
import { CountryPicker } from "@/components/domain/country-picker";
import { DocumentList } from "@/components/domain/document-list";
import { FilingCard } from "@/components/domain/filing-card";
import { copy, fill } from "@/lib/copy";
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { useSetup } from "./use-setup";
import type { Filing } from "@/lib/types";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function SetupScreen() {
  const s = useSetup();

  const [filingToRemove, setFilingToRemove] = React.useState<Filing | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  /** Tracked as exclusions, so anything newly found is carried by default. */
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(new Set());

  const researching = s.phase === "researching";
  const hasResults = s.phase === "found" && s.filings.length > 0;
  /* The draft actions belong to work that exists. Before the expert has picked
     a country or added a document, there is nothing to save or discard, so the
     pair stays off the header entirely. */
  const hasStarted = Boolean(s.country) || s.documents.length > 0;

  function discardDraft() {
    s.discard();
    setExcluded(new Set());
    setFileError(null);
  }
  const carriedCount = s.filings.filter((f) => !excluded.has(f.id)).length;
  const canContinue = hasResults && s.needsCheck === 0 && carriedCount > 0;

  function setCarried(filing: Filing, carried: boolean) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (carried) next.delete(filing.id);
      else next.add(filing.id);
      return next;
    });
  }

  /* Attach files straight away — one or many at a time. No type to pick and no
     note to write: the file itself is what the model needs. Invalid files are
     named back; the valid ones are added. */
  function handleFiles(files: File[]): boolean {
    setFileError(null);
    const rejected: string[] = [];
    let added = 0;
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        rejected.push(fill(copy.documents.tooLarge, { name: file.name }));
        continue;
      }
      const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ACCEPTED_FILE_TYPES.includes(ext)) {
        rejected.push(fill(copy.documents.wrongType, { name: file.name }));
        continue;
      }
      s.addDocument(file.name, file.size);
      added++;
    }
    if (rejected.length) setFileError(rejected.join(" "));
    return added > 0;
  }

  return (
    <div className="pb-20">
      {/* Header band — sits on the sunken surface so the working area reads as paper. */}
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
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
                <h1 className="text-[22px] font-medium tracking-tight text-heading">
                  {s.country ? s.country.name : copy.page.title}
                </h1>
              </div>
            </div>
            {hasStarted && <DraftActions onDiscard={discardDraft} />}
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
          <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)]">
            <CountryPicker
              value={s.country}
              label={copy.country.label}
              placeholder={copy.country.placeholder}
              onSelect={s.selectCountry}
            />
            {!s.country && (
              <p className="mt-3 text-sm text-text-muted">{copy.country.empty}</p>
            )}

            {/* A country is chosen but research hasn't begun. Selecting a country
                starts nothing on its own: the expert picks one of the two ways
                in, and only that begins the research. */}
            {s.country && s.phase === "empty" && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="text-sm text-text-muted">
                  {fill(copy.research.chooseHint, { country: s.country.name })}
                </p>

                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={s.startResearch}
                >
                  <Search />
                  {copy.research.runAction}
                </Button>

                <div className="mt-5 flex items-center gap-4" role="separator">
                  <span aria-hidden className="h-px flex-1 bg-border" />
                  <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-faint">
                    {copy.documents.orDivider}
                  </span>
                  <span aria-hidden className="h-px flex-1 bg-border" />
                </div>

                {/* Uploading a document is the other way in — adding one begins
                    the research against it, so there's no separate "go". */}
                <AddFileOrLink
                  className="mt-5"
                  hint={copy.documents.hint}
                  chooseLabel={copy.documents.dropAction}
                  linkPlaceholder={copy.documents.linkPlaceholder}
                  linkInvalidMessage={copy.documents.linkInvalid}
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  onFiles={(files) => {
                    if (handleFiles(files)) s.startResearch();
                  }}
                  onLink={(url) => {
                    s.addDocument(new URL(url).hostname, 0, url);
                    s.startResearch();
                  }}
                />
                {fileError && <p className="mt-2 text-sm text-risk">{fileError}</p>}
              </div>
            )}
          </section>

          {researching && s.country && (
            <section className="mt-5 rounded-xl border border-brand-edge bg-brand-quiet/50 p-5">
              <h2 className="text-[15px] font-medium text-heading">
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
              {/* Heading left; the shortcut to what still needs a decision sits
                  on the right, where the summary text used to be. */}
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[17px] font-medium tracking-tight text-heading">
                  {fill(copy.filings.heading, {
                    country: s.country.name,
                    count: s.filings.length,
                  })}
                </h2>
                {s.needsCheck > 0 && (
                  <JumpToReview count={s.needsCheck} verb="review" />
                )}
              </div>

              <div className="mt-4 space-y-3">
                {s.filings.map((filing) => (
                  <FilingCard
                    key={filing.id}
                    filing={filing}
                    selected={!excluded.has(filing.id)}
                    onSelectedChange={setCarried}
                    onKeep={s.keepFiling}
                    onRemove={setFilingToRemove}
                  />
                ))}
              </div>
            </section>
          )}

          {/* What the expert attached as a way in, listed back once research is
              under way. The upload control itself isn't repeated here — the
              material is added at the start, beside the deep search — so this is
              a record of it, not a second place to add more. */}
          {s.country && s.phase !== "empty" && s.documents.length > 0 && (
            <section className="mt-7">
              <DocumentList documents={s.documents} onRemove={s.removeDocument} />
            </section>
          )}

        </div>
      </div>

      {/* Action bar — pinned, so Continue is reachable without scrolling to the end. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Step one is the first step — there's no step to go back to. The
              Countries breadcrumb above still exits the flow. */}
          <Button variant="ghost" disabled className="hidden sm:inline-flex">
            <ArrowLeft />
            {copy.page.back}
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {hasResults && s.needsCheck > 0 && (
              <span className="text-sm text-text-muted">
                {fill(
                  s.needsCheck === 1
                    ? copy.page.blockedNeedsCheck
                    : copy.page.blockedNeedsCheckPlural,
                  { count: s.needsCheck },
                )}
              </span>
            )}
            {s.phase === "found" && (s.filings.length === 0 || carriedCount === 0) && (
              <span className="text-sm text-text-muted">{copy.page.blockedNoFilings}</span>
            )}
            {canContinue && s.country ? (
              <Button variant="primary" asChild>
                <Link
                  href={`/countries/${s.country.code}/returns`}
                  /* Carry only the checked return types into step two, so an
                     unchecked one never reappears there. Keyed by country. */
                  onClick={() => {
                    try {
                      localStorage.setItem(
                        `fintua:carried:${s.country!.code}`,
                        JSON.stringify(
                          s.filings
                            .filter((f) => !excluded.has(f.id))
                            .map((f) => f.id),
                        ),
                      );
                    } catch {
                      /* storage unavailable — step two then shows them all. */
                    }
                  }}
                >
                  {copy.page.continue}
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button variant="primary" disabled>
                {copy.page.continue}
                <ArrowRight />
              </Button>
            )}
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

    </div>
  );
}

