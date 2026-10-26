"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddFileOrLink } from "@/components/patterns/add-file-or-link";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { JumpToReview } from "@/components/patterns/jump-to-review";
import { LiveTrail } from "@/components/patterns/live-trail";
import { PickOne } from "@/components/patterns/pick-one";
import { Stepper } from "@/components/patterns/stepper";
import { CountryPicker } from "@/components/domain/country-picker";
import { DescribeDocument } from "@/components/domain/describe-document";
import { DocumentList } from "@/components/domain/document-list";
import { FilingCard, formatDate } from "@/components/domain/filing-card";
import { copy, fill } from "@/lib/copy";
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { useSetup } from "./use-setup";
import type { Filing, Source } from "@/lib/types";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function SetupScreen() {
  const s = useSetup();

  const [filingToRemove, setFilingToRemove] = React.useState<Filing | null>(null);
  const [pendingFile, setPendingFile] = React.useState<{ name: string; size: number } | null>(null);
  const [collision, setCollision] = React.useState<{
    source: Source;
    file: { name: string; size: number };
  } | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  /** Tracked as exclusions, so anything newly found is carried by default. */
  const [excluded, setExcluded] = React.useState<ReadonlySet<string>>(new Set());

  const researching = s.phase === "researching";
  const hasResults = s.phase === "found" && s.filings.length > 0;
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
            <Button variant="filled" size="sm">
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
          <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-raised)]">
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

          {/* An upload bar from the start: an expert who already holds the
              documents for this country can add them straight away, before
              research even runs — not only once the findings are in. */}
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
                <Link href={`/countries/${s.country.code}/returns`}>
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

