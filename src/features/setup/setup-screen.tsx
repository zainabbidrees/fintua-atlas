"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { DraftActions } from "@/components/patterns/draft-actions";
import { JumpToReview } from "@/components/patterns/jump-to-review";
import { LiveTrail } from "@/components/patterns/live-trail";
import { SearchAddBar } from "@/components/patterns/search-add-bar";
import { UrlList } from "@/components/patterns/url-list";
import { ContinueActions } from "@/components/patterns/continue-actions";
import { CountryPicker } from "@/components/domain/country-picker";
import { ONBOARDED_CODES } from "@/features/countries/data";
import { useSubmissions } from "@/lib/review";
import { readPublished } from "@/lib/published";
import { DocumentList } from "@/components/domain/document-list";
import { FilingTable } from "@/components/domain/filing-table";
import { StepNav, ViewOnlyBar, useStepView } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import { useSetup } from "./use-setup";
import { ReadOnly } from "@/components/patterns/read-only";
import { findCountry } from "@/lib/mock/countries";
import { ReviewBar } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import type { Filing } from "@/lib/types";


export function SetupScreen({ reviewCode }: { reviewCode?: string } = {}) {
  const s = useSetup();
  const router = useRouter();

  /* Opened from the approval screen, step one shows the country under review:
     it is chosen for you and its research replays. A reviewer reads it locked;
     the expert can still change what carries forward and send it again. */
  const review = useStepReview(reviewCode ?? "", 0);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(0);
  const readOnly = review.readOnly || viewFrom !== null;
  const loaded = React.useRef(false);
  React.useEffect(() => {
    if (!reviewCode || loaded.current) return;
    const country = findCountry(reviewCode.toUpperCase());
    if (!country) return;
    loaded.current = true;
    s.selectCountry(country);
  }, [reviewCode, s]);
  const { country, phase, startResearch } = s;
  React.useEffect(() => {
    if (reviewCode && country?.code === reviewCode.toUpperCase() && phase === "empty") startResearch();
  }, [reviewCode, country, phase, startResearch]);

  /* Countries already onboarded — every one on the Countries page, plus this
     browser's publishes and anything sent for approval — are left out of the
     picker, so none is started twice. Read after mount so the first render
     matches the server. */
  const [published, setPublished] = React.useState<readonly string[]>([]);
  React.useEffect(() => {
    const local = readPublished();
    if (local.length === 0) return;
    // Syncing from localStorage after mount is the one case that
    // legitimately needs setState in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPublished(local.map((p) => p.code));
  }, []);
  const submissions = useSubmissions();
  const onboarded = React.useMemo<ReadonlySet<string>>(
    () => new Set([...ONBOARDED_CODES, ...published, ...submissions.map((sub) => sub.code)]),
    [published, submissions],
  );

  const [filingToRemove, setFilingToRemove] = React.useState<Filing | null>(null);
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

  /* Carry only the checked return types into step two, so an unchecked one
     never reappears there. Keyed by country. */
  function continueToReturns() {
    if (!s.country) return;
    try {
      localStorage.setItem(
        `fintua:carried:${s.country.code}`,
        JSON.stringify(s.filings.filter((f) => !excluded.has(f.id)).map((f) => f.id)),
      );
    } catch {
      /* storage unavailable — step two then shows them all. */
    }
    router.push(`/countries/${s.country.code}/returns`);
  }

  return (
    <ReadOnly value={readOnly}>
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
              <StepNav countryCode={reviewCode ?? ""} index={0} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {!reviewCode && (
          <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)]">
            <CountryPicker
              value={s.country}
              label={copy.country.label}
              placeholder={copy.country.placeholder}
              onSelect={s.selectCountry}
              exclude={onboarded}
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

                {/* Pointing at sources is the other way in — submitting the
                    list begins the research against them, so there's no
                    separate "go". */}
                <UrlList
                  className="mt-5"
                  heading={copy.documents.urlHeading}
                  placeholder={copy.documents.linkPlaceholder}
                  addLabel={copy.documents.addAnotherUrl}
                  removeLabel={copy.documents.removeUrl}
                  invalidMessage={copy.documents.linkInvalid}
                  submitLabel={copy.documents.researchFromUrls}
                  onSubmit={(urls) => {
                    for (const url of urls) s.addDocument(new URL(url).hostname, 0, url);
                    s.startResearch();
                  }}
                />
              </div>
            )}
          </section>
          )}

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
                <div className="flex items-center gap-3">
                  {/* The selected count with a Select all beside it — the same
                      cluster as step two's. Kept visible whenever any row is
                      ticked, so the control is there on landing rather than
                      only appearing once a row is unticked. */}
                  {carriedCount > 0 && !readOnly && (
                    <div className="inline-flex items-center gap-x-3 rounded-lg border border-border-strong bg-surface px-3 py-1.5 shadow-[var(--shadow-raised)]">
                      <span className="text-[13px] font-medium text-text">
                        {fill(copy.filings.selectedCount, { count: carriedCount })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExcluded(new Set())}
                        className="text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
                      >
                        {copy.filings.selectAll}
                      </button>
                    </div>
                  )}
                  {s.needsCheck > 0 && (
                    <JumpToReview count={s.needsCheck} verb="review" />
                  )}
                </div>
              </div>

              <FilingTable
                className="mt-4"
                filings={s.filings}
                isSelected={(filing) => !excluded.has(filing.id)}
                onSelectedChange={setCarried}
                onKeep={s.keepFiling}
                onRemove={setFilingToRemove}
              />

              {/* Two routes for a return type the listing above missed: add the
                  name straight to the list, or run the public-sources search for
                  it again. */}
              {!readOnly && (
              <SearchAddBar
                className="mt-6"
                placeholder={copy.filings.searchMorePlaceholder}
                addLabel={copy.filings.addAction}
                searchLabel={copy.filings.searchAgainAction}
                onAdd={s.addFilingManually}
                onSearch={s.addFiling}
                busy={s.searching}
                message={s.searchMessage}
                onDismissMessage={s.clearSearchMessage}
              />
              )}
            </section>
          )}

          {/* What the expert attached, listed back once research is under way —
              both the document that may have been the way in and anything added
              since from the upload bar above. A record of the material, with its
              own per-row remove. */}
          {s.country && s.phase !== "empty" && s.documents.length > 0 && (
            <section className="mt-7">
              <DocumentList documents={s.documents} onRemove={s.removeDocument} />
            </section>
          )}

        </div>
      </div>

      {/* Action bar — pinned, so Continue is reachable without scrolling to the end. */}
      {viewFrom !== null && reviewCode ? (
        <ViewOnlyBar countryCode={reviewCode} index={0} from={viewFrom} />
      ) : review.reviewing && reviewCode ? (
        <ReviewBar countryCode={reviewCode} stepIndex={0} review={review} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur px-6 py-3 sm:px-12 md:left-72">
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
            <ContinueActions
              onSave={() => toast(copy.page.savedToast)}
              continueDisabled={!(canContinue && s.country)}
              onContinue={continueToReturns}
            />
          </div>
        </div>
      </div>
      )}

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
    </ReadOnly>
  );
}

