"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ContinueActions } from "@/components/patterns/continue-actions";
import { Button } from "@/components/ui/button";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { DraftActions } from "@/components/patterns/draft-actions";
import { LiveTrail } from "@/components/patterns/live-trail";
import { Stepper } from "@/components/patterns/stepper";
import { copy, fill } from "@/lib/copy";
import {
  PURCHASES_COLUMNS,
  RATES_COLUMNS,
  RATE_NOTES,
  SALES_COLUMNS,
} from "@/lib/mock/tax-rules";
import { RuleSheet, columnLetter } from "./rule-sheet";
import { ruleKey, useRuleEdits, type SheetId } from "./use-rule-edits";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

/** How many rules each tab shows — a sample, so the page never runs long. */
const SAMPLE = 10;

/** How long each line of the generation trail takes to land. */
const PACE_MS = Number(process.env.NEXT_PUBLIC_MOCK_PACE_MS ?? 700) * 1.3;

/* `rowName` is the column that names a row — the rate, or the transaction type. */
const SHEETS: { id: SheetId; columns: readonly string[]; pinned: number; rowName: number }[] = [
  { id: "rates", columns: RATES_COLUMNS, pinned: 1, rowName: 0 },
  { id: "sales", columns: SALES_COLUMNS, pinned: 2, rowName: 1 },
  { id: "purchases", columns: PURCHASES_COLUMNS, pinned: 2, rowName: 1 },
];

/**
 * Step 5. The agent generates the tax rules from the confirmed box mapping,
 * visibly — a trail of what it is doing, not a spinner — then the rules land
 * as three sheets: rates, sales, purchases.
 */
export function TaxRulesScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const t = copy.taxRules;
  const router = useRouter();
  const code = countryCode.toLowerCase();

  /* Generation lands one trail line at a time; past the last, it is done. */
  const [shown, setShown] = React.useState(1);
  const generating = shown <= t.trail.length;
  React.useEffect(() => {
    if (!generating) return;
    const id = setTimeout(() => setShown((n) => n + 1), PACE_MS);
    return () => clearTimeout(id);
  }, [shown, generating]);

  const [tab, setTab] = React.useState<SheetId>("rates");
  const current = SHEETS.find((s) => s.id === tab) ?? SHEETS[0];

  const edits = useRuleEdits();
  const unsaved = edits.changed.size;

  function saveChanges() {
    edits.save();
    toast(t.saved);
  }

  /* Moving on keeps what was typed: unsaved edits are saved first. */
  function continueOn() {
    if (unsaved > 0) edits.save();
    router.push(`/countries/${code}/approval`);
  }

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={`/countries/${code}/rules`}
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
              <Stepper steps={STEPS} currentIndex={4} completedCount={4} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-medium tracking-tight text-heading">{t.title}</h2>
              <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-text-muted">
                {t.intro}
              </p>
            </div>
            {!generating && (
              <span className="rise text-[13px] text-text-muted" data-numeric>
                {fill(t.summary, {
                  rates: edits.rows.rates.length,
                  sales: edits.rows.sales.length,
                  purchases: edits.rows.purchases.length,
                })}
              </span>
            )}
          </div>

          <div className="mt-8">
            {generating ? (
              <Generating shown={shown} />
            ) : (
              <section className="rise overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
                <div className="px-4 pt-4">
                  <Tabs
                    idBase="tax-rules"
                    value={tab}
                    onValueChange={(id) => setTab(id as SheetId)}
                    tabs={SHEETS.map((s) => ({
                      id: s.id,
                      label: t.tabs[s.id],
                      count: edits.rows[s.id].length,
                    }))}
                  />
                  <p className="py-3 text-[13px] text-text-muted" data-numeric>
                    {fill(t.hints[current.id], {
                      shown: Math.min(SAMPLE, edits.rows[current.id].length),
                      count: edits.rows[current.id].length,
                      last: columnLetter(current.columns.length - 1),
                    })}
                  </p>
                </div>

                {/* Only the open sheet is laid out: its pinned columns read their
                    widths from the rendered table, which a hidden one lacks. */}
                {[current].map((sheet) => (
                  <TabPanel
                    key={sheet.id}
                    id={sheet.id}
                    idBase="tax-rules"
                    className="border-t border-border"
                  >
                    <RuleSheet
                      columns={sheet.columns}
                      rows={edits.rows[sheet.id].slice(0, SAMPLE)}
                      pinned={sheet.pinned}
                      rowName={sheet.rowName}
                      isEditing={(r) => edits.editing.has(ruleKey(sheet.id, r))}
                      isChanged={(r) => edits.changed.has(ruleKey(sheet.id, r))}
                      onToggleEditing={(r) => edits.toggleEditing(ruleKey(sheet.id, r))}
                      onCellChange={(r, c, v) => edits.setCell(sheet.id, r, c, v)}
                    />
                    {sheet.id === "rates" && RATE_NOTES.length > 0 && (
                      <div className="px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
                          {t.sheetNotes}
                        </p>
                        <ul className="mt-1.5 space-y-0.5 text-[13px] text-text-muted">
                          {RATE_NOTES.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabPanel>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Pinned action bar — Continue is reachable without scrolling to the end. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${code}/rules`}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {generating ? (
              <ContinueActions
                onSave={saveChanges}
                saveDisabled
                saveLabel={t.save}
                continueDisabled
                onContinue={continueOn}
              />
            ) : (
              <>
                {unsaved > 0 && (
                  <span className="text-sm text-text-muted" data-numeric>
                    {fill(unsaved === 1 ? t.unsavedCount : t.unsavedCountPlural, {
                      count: unsaved,
                    })}
                  </span>
                )}
                <ContinueActions
                  onSave={saveChanges}
                  saveDisabled={unsaved === 0}
                  saveLabel={t.save}
                  onContinue={continueOn}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The agent at work: what it is doing right now, how far along it is, and the
 * shape of the sheet it is filling — so the wait reads as work, not as a stall.
 */
function Generating({ shown }: { shown: number }) {
  const t = copy.taxRules;
  const total = t.trail.length;
  const done = Math.min(shown - 1, total);

  return (
    <section
      aria-live="polite"
      aria-busy
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]"
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium">{t.generatingTitle}</h3>
          <span className="text-[13px] text-text-muted" data-numeric>
            {done} / {total}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-text-muted">{t.generatingHint}</p>
        {/* Determinate, and moved by the work itself rather than looping. */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full origin-left rounded-full bg-brand transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `scaleX(${(done + 0.5) / (total + 0.5)})` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 px-5 py-6 md:flex-row">
        <LiveTrail
          className="md:w-80 md:shrink-0"
          label={t.trailLabel}
          entries={t.trail.slice(0, shown).map((text, i) => ({ id: String(i), text, at: i }))}
        />

        {/* The shape of the sheet to come: tabs, then rows. */}
        <div className="min-w-0 flex-1" aria-hidden>
          <div className="flex gap-5 border-b border-border pb-2.5">
            {[44, 40, 64].map((w, i) => (
              <span key={i} className="h-3 rounded bg-border-strong" style={{ width: w }} />
            ))}
          </div>
          <div className="mt-4 space-y-3.5">
            {Array.from({ length: 7 }, (_, r) => (
              <div key={r} className="grid grid-cols-[4rem_7rem_minmax(0,1fr)_5rem] gap-4">
                <span className="h-3 rounded bg-surface-sunken" />
                <span className="h-3 rounded bg-surface-sunken" />
                <span className="h-3 rounded bg-surface-sunken" style={{ width: `${88 - ((r * 17) % 40)}%` }} />
                <span className="h-3 rounded bg-surface-sunken" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
