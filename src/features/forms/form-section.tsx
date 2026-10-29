"use client";

import * as React from "react";
import { ArrowUpRight, FileText, Paperclip, RotateCw } from "lucide-react";
import { AttentionNote } from "@/components/ui/attention-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { LiveTrail } from "@/components/patterns/live-trail";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import type { FormEdition, FormRetrieval } from "@/lib/types";
import { PAGE_GRID, PageThumb } from "./page-thumb";
import type { FormsState } from "./use-forms";

const MAX_BYTES = 20 * 1024 * 1024;

/** Opens the page viewer on one page of one edition. */
export type OpenPage = (obligationId: string, editionId: string, index: number) => void;

/**
 * One return type's form, in whichever of the step's states it is in: still
 * being retrieved, found, found twice in editions that disagree, or not found.
 *
 * The header carries the source the form came from — publisher, edition, a
 * link to the original — so the pages and their provenance are read together.
 * A section waiting on a person keeps an amber edge and carries the reason.
 */
export function FormSection({
  form: f,
  r,
  index,
  onOpenPage,
}: {
  form: FormRetrieval;
  r: FormsState;
  index: number;
  onOpenPage: OpenPage;
}) {
  const edition = r.editionOf(f);
  const needs = r.needsDecision(f);

  return (
    <section
      id={`form-${f.obligationId}`}
      data-review-item={needs ? "" : undefined}
      className={cn(
        "rise scroll-mt-6 overflow-hidden rounded-xl border bg-surface shadow-[var(--shadow-raised)]",
        needs ? "border-attention-edge" : "border-border",
      )}
      style={{ "--index": index } as React.CSSProperties}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {edition && <SectionCheckbox form={f} edition={edition} r={r} />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-[15px] font-medium">{f.obligationName}</h3>
              {f.localName && (
                <span className="text-[13px] text-text-faint">{f.localName}</span>
              )}
            </div>
            {edition && <SourceLine edition={edition} />}
          </div>
        </div>
        <Status form={f} edition={edition} r={r} />
      </header>

      {f.state === "retrieving" && (
        <Retrieving trail={(f.trail ?? []).slice(0, r.trailShown[f.obligationId] ?? 1)} />
      )}

      {f.state === "clash" && !edition && (
        <EditionClash form={f} r={r} onOpenPage={onOpenPage} />
      )}

      {f.state === "none" && <NoneFound form={f} r={r} />}

      {edition && (
        <div className="bg-wash/60 px-5 pb-6 pt-5">
          {f.state === "clash" && <ChosenLine form={f} r={r} />}
          <ul className={PAGE_GRID}>
            {edition.pages.map((page, i) => (
              <PageThumb
                key={page.id}
                formName={f.obligationName}
                edition={edition}
                page={page}
                index={i}
                selected={r.isSelected(page)}
                onSelectedChange={(on) => r.setPage(page.id, on)}
                onOpen={() => onOpenPage(f.obligationId, edition.id, i)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Ticks or clears every page of the form at once; a dash when some are ticked. */
function SectionCheckbox({
  form: f,
  edition,
  r,
}: {
  form: FormRetrieval;
  edition: FormEdition;
  r: FormsState;
}) {
  const count = r.selectedPages(f).length;
  const all = count === edition.pages.length;
  return (
    <Checkbox
      className="mt-[3px]"
      checked={all ? true : count > 0 ? "indeterminate" : false}
      onCheckedChange={() => r.setAllPages(edition, !all)}
      aria-label={fill(copy.taxForms.selectForm, { name: f.obligationName })}
    />
  );
}

/** Where the form came from: its reference, its edition, and the original. */
function SourceLine({ edition }: { edition: FormEdition }) {
  const t = copy.taxForms;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-text-muted">
      <span className="font-medium text-text">{edition.reference}</span>
      <span aria-hidden className="text-text-faint">·</span>
      <span lang="fr">{edition.title}</span>
      <span aria-hidden className="text-text-faint">·</span>
      <span>{fill(t.edition, { edition: edition.edition })}</span>
      <span aria-hidden className="text-text-faint">·</span>
      <span>{edition.publisher}</span>
      <a
        href={edition.url}
        target="_blank"
        rel="noreferrer"
        className="ml-1 inline-flex items-center gap-0.5 font-medium text-brand transition-opacity hover:opacity-80"
      >
        {t.openSource}
        <ArrowUpRight className="size-3.5" />
      </a>
    </p>
  );
}

/** The header's right-hand reading: the page count, or what the section waits on. */
function Status({
  form: f,
  edition,
  r,
}: {
  form: FormRetrieval;
  edition: FormEdition | null;
  r: FormsState;
}) {
  const t = copy.taxForms;

  if (edition) {
    const count = r.selectedPages(f).length;
    return (
      <span
        className={cn(
          "pt-0.5 text-[13px]",
          count === 0 ? "font-medium text-attention-text" : "text-text-muted",
        )}
        data-numeric
      >
        {count === 0
          ? t.noPages
          : fill(t.pagesSelected, { selected: count, total: edition.pages.length })}
      </span>
    );
  }

  if (f.state === "retrieving") return <Badge>{t.retrievingBadge}</Badge>;
  if (f.state === "clash") return <Badge tone="attention">{t.clashTitle}</Badge>;
  if (r.attached[f.obligationId]) return <Badge>{t.attached}</Badge>;
  if (r.withoutForm[f.obligationId]) return <Badge>{t.withoutFormBadge}</Badge>;
  return <Badge tone="attention">{t.noneTitle}</Badge>;
}

/* ── Working ─────────────────────────────────────────────────────────────── */

/** The trail of what is being read, beside the shape of what will arrive. */
function Retrieving({ trail }: { trail: string[] }) {
  const t = copy.taxForms;
  return (
    <div className="flex flex-col gap-6 bg-wash/60 px-5 py-5 md:flex-row" aria-live="polite">
      <LiveTrail
        className="md:w-80 md:shrink-0"
        label={t.trailLabel}
        entries={trail.map((text, i) => ({ id: String(i), text, at: i }))}
      />
      <ul className={cn(PAGE_GRID, "flex-1")} aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <span className="block aspect-[794/1123] rounded-[3px] bg-surface-sunken" />
            <span className="mt-3 block h-3 w-16 rounded bg-border-strong" />
            <span className="mt-1.5 block h-2.5 w-24 rounded bg-border" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Clash ───────────────────────────────────────────────────────────────── */

/**
 * Two editions of the same form, side by side. Never settled automatically —
 * the newer date is not proof — so each shows its source and what sets it
 * apart, its pages can be opened and read, and choosing one asks why.
 */
function EditionClash({
  form: f,
  r,
  onOpenPage,
}: {
  form: FormRetrieval;
  r: FormsState;
  onOpenPage: OpenPage;
}) {
  const t = copy.taxForms;
  const [choosing, setChoosing] = React.useState<FormEdition | null>(null);

  return (
    <div className="px-5 pb-6 pt-5">
      <AttentionNote>{t.clashHint}</AttentionNote>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {f.editions.map((edition) => (
          <div
            key={edition.id}
            className="flex min-w-0 flex-col rounded-lg border border-border-strong bg-surface"
          >
            <div className="border-b border-border px-4 py-3.5">
              <p className="text-[14px] font-medium text-text">
                {fill(t.edition, { edition: edition.edition })}
              </p>
              <p className="mt-0.5 text-[13px] text-text-muted">{edition.publisher}</p>
              {edition.difference && (
                <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-text">
                  {edition.difference}
                </p>
              )}
            </div>

            <div className="flex-1 bg-wash/60 px-4 py-4">
              <ul className="grid grid-cols-3 gap-x-3 gap-y-4">
                {edition.pages.map((page, i) => (
                  <PageThumb
                    key={page.id}
                    formName={f.obligationName}
                    edition={edition}
                    page={page}
                    index={i}
                    onOpen={() => onOpenPage(f.obligationId, edition.id, i)}
                  />
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
              <a
                href={edition.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
              >
                {t.openSource}
                <ArrowUpRight className="size-3.5" />
              </a>
              <Button variant="attention" size="sm" onClick={() => setChoosing(edition)}>
                {t.useEdition}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmWithReason
        open={choosing !== null}
        onOpenChange={(open) => !open && setChoosing(null)}
        title={fill(t.clashReasonTitle, { edition: choosing?.edition ?? "" })}
        hint={t.clashReasonHint}
        placeholder={t.clashReasonPlaceholder}
        confirmLabel={t.clashConfirm}
        cancelLabel={t.clashCancel}
        destructive={false}
        onConfirm={(reason) => choosing && r.chooseEdition(f.obligationId, choosing.id, reason)}
      />
    </div>
  );
}

/** Once a clash is settled: which edition lost, the reason, and a way back. */
function ChosenLine({ form: f, r }: { form: FormRetrieval; r: FormsState }) {
  const t = copy.taxForms;
  const choice = r.choices[f.obligationId];
  const other = f.editions.find((e) => e.id !== choice?.editionId);
  if (!choice || !other) return null;

  return (
    <p className="mb-5 max-w-[80ch] text-[13px] leading-relaxed text-text-muted">
      {fill(t.chosen, { other: other.edition, reason: choice.reason })}
      <button
        type="button"
        onClick={() => r.clearChoice(f.obligationId)}
        className="ml-2 font-medium text-brand transition-opacity hover:opacity-80"
      >
        {t.changeChoice}
      </button>
    </p>
  );
}

/* ── Nothing found ───────────────────────────────────────────────────────── */

/**
 * No form was found. Say so plainly, and keep every way forward open: look
 * again, supply the form, or go on without one — the last asks why, since the
 * specs step will then have nothing to map for this return type.
 */
function NoneFound({ form: f, r }: { form: FormRetrieval; r: FormsState }) {
  const t = copy.taxForms;
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [asking, setAsking] = React.useState(false);

  const file = r.attached[f.obligationId];
  const without = r.withoutForm[f.obligationId];

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    e.target.value = "";
    if (!chosen) return;
    if (!/\.pdf$/i.test(chosen.name)) return setError(fill(t.wrongType, { name: chosen.name }));
    if (chosen.size > MAX_BYTES) return setError(fill(t.tooLarge, { name: chosen.name }));
    setError(null);
    r.attach(f.obligationId, { name: chosen.name, size: chosen.size });
  }

  if (file) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
        <FileText className="size-4 shrink-0 text-text-faint" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-text">{file.name}</p>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {fill(t.fileSize, { size: (file.size / 1024 / 1024).toFixed(1) })} · {t.attachedPages}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => r.removeAttached(f.obligationId)}>
          {t.removeAttached}
        </Button>
      </div>
    );
  }

  if (without) {
    return (
      <p className="px-5 py-4 text-[13px] leading-relaxed text-text-muted">
        {fill(t.withoutFormDone, { reason: without })}
        <button
          type="button"
          onClick={() => r.undoWithout(f.obligationId)}
          className="ml-2 font-medium text-brand transition-opacity hover:opacity-80"
        >
          {t.undo}
        </button>
      </p>
    );
  }

  return (
    <div className="px-5 pb-5 pt-4">
      {f.noneDetail && <AttentionNote>{f.noneDetail}</AttentionNote>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => r.retry(f.obligationId)}>
          <RotateCw />
          {t.retry}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Paperclip />
          {t.attach}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={onFile}
        />
        <Button variant="attention" size="sm" onClick={() => setAsking(true)}>
          {t.withoutForm}
        </Button>
      </div>
      <p className={cn("mt-2 text-[12px]", error ? "text-risk" : "text-text-faint")} role={error ? "alert" : undefined}>
        {error ?? t.attachHint}
      </p>

      <ConfirmWithReason
        open={asking}
        onOpenChange={setAsking}
        title={fill(t.withoutFormTitle, { name: f.obligationName })}
        hint={t.withoutFormHint}
        placeholder={t.withoutFormPlaceholder}
        confirmLabel={t.withoutFormConfirm}
        cancelLabel={t.withoutFormCancel}
        destructive={false}
        onConfirm={(reason) => r.continueWithout(f.obligationId, reason)}
      />
    </div>
  );
}
