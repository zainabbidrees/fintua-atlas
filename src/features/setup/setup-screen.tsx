"use client";

import * as React from "react";
import { ArrowRight, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddFileOrLink } from "@/components/patterns/add-file-or-link";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { LiveTrail } from "@/components/patterns/live-trail";
import { PickOne } from "@/components/patterns/pick-one";
import { CountryPicker } from "@/components/domain/country-picker";
import { DescribeDocument } from "@/components/domain/describe-document";
import { DocumentList } from "@/components/domain/document-list";
import { FilingCard, formatDate } from "@/components/domain/filing-card";
import { SourcePanel } from "@/components/domain/source-panel";
import { copy, fill } from "@/lib/copy";
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { useSetup } from "./use-setup";
import type { Filing, Source, UserDocument } from "@/lib/types";

export function SetupScreen() {
  const s = useSetup();

  const [filingToRemove, setFilingToRemove] = React.useState<Filing | null>(null);
  const [sourceToRemove, setSourceToRemove] = React.useState<Source | null>(null);
  const [pendingFile, setPendingFile] = React.useState<{
    name: string;
    size: number;
  } | null>(null);
  const [collision, setCollision] = React.useState<{
    source: Source;
    file: { name: string; size: number };
  } | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [term, setTerm] = React.useState("");

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

    // A document we already found: the expert decides, we never silently merge.
    const clash = s.findCollision(file.name);
    if (clash) {
      setCollision({ source: clash.source, file: { name: file.name, size: file.size } });
      return;
    }

    setPendingFile({ name: file.name, size: file.size });
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">
            {copy.page.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{copy.page.step}</p>
        </div>
        <Button variant="secondary" size="sm">
          {copy.page.saveDraft}
        </Button>
      </header>

      <div className="mt-8">
        <CountryPicker
          value={s.country}
          label={copy.country.label}
          placeholder={copy.country.placeholder}
          onSelect={s.selectCountry}
        />
      </div>

      {s.phase === "empty" && (
        <p className="mt-8 text-sm text-text-muted">{copy.country.empty}</p>
      )}

      {/* Research in progress. The page stays usable throughout. */}
      {researching && s.country && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-text">
            {fill(copy.research.runningTitle, { country: s.country.name })}
          </h2>
          <p className="mt-1 text-sm text-text-muted">{copy.research.runningHint}</p>
          <LiveTrail
            entries={s.trail}
            label={copy.research.trailLabel}
            className="mt-4"
          />
        </section>
      )}

      {(s.phase === "nothing_found" || s.phase === "failed") && s.country && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-5">
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
          <h2 className="text-[15px] font-semibold text-text">
            {fill(copy.filings.heading, {
              country: s.country.name,
              count: s.filings.length,
            })}
          </h2>
          <p className="mt-0.5 text-sm text-text-muted">
            {s.needsCheck === 0
              ? fill(copy.filings.summaryAllClear, { count: s.filings.length })
              : fill(
                  s.needsCheck === 1
                    ? copy.filings.summaryMixed
                    : copy.filings.summaryMixedPlural,
                  { solid: s.filings.length - s.needsCheck, checks: s.needsCheck },
                )}
          </p>

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

          {/* Targeted search for something the agent missed. */}
          <div className="mt-5">
            <label className="text-sm font-medium text-text">
              {copy.filings.searchMore}
            </label>
            <div className="mt-1.5 flex max-w-md gap-2">
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
              <p className="mt-1.5 text-sm text-text-muted">{s.searchMessage}</p>
            )}
          </div>
        </section>
      )}

      {/* Supporting evidence — quieter than the scope decision above. */}
      {s.sources.length > 0 && (
        <div className="mt-8">
          <SourcePanel
            sources={s.sources}
            filings={s.filings}
            onRemove={setSourceToRemove}
          />
        </div>
      )}

      {/* Always available once a country is chosen — including after a failure. */}
      {s.country && (
        <div className="mt-8">
          <AddFileOrLink
            heading={copy.documents.heading}
            hint={copy.documents.hint}
            chooseLabel={copy.documents.dropAction}
            linkPlaceholder={copy.documents.linkPlaceholder}
            linkInvalidMessage={copy.documents.linkInvalid}
            accept={ACCEPTED_FILE_TYPES.join(",")}
            onFile={handleFile}
            onLink={(url) => {
              const name = new URL(url).hostname;
              setPendingFile({ name, size: 0 });
            }}
          />
          {fileError && <p className="mt-2 text-sm text-risk">{fileError}</p>}
          <DocumentList documents={s.documents} onRemove={s.removeDocument} />
        </div>
      )}

      <footer className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <Button variant="ghost">{copy.page.back}</Button>
        <div className="flex items-center gap-3">
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
          {s.phase === "found" && s.filings.length === 0 && (
            <span className="text-sm text-text-muted">
              {copy.page.blockedNoFilings}
            </span>
          )}
          <Button variant="primary" disabled={!canContinue}>
            {copy.page.continue}
            <ArrowRight />
          </Button>
        </div>
      </footer>

      {/* ── Decisions that need a human ─────────────────────────────────── */}

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
          if (pendingFile) {
            s.addDocument(pendingFile.name, pendingFile.size, kind, note);
          }
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
            if (choice !== "theirs") {
              setPendingFile(collision.file);
            }
            setCollision(null);
          }}
        />
      )}
    </div>
  );
}

export type { UserDocument };
