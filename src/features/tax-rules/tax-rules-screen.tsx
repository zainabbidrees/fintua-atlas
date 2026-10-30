"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Columns3, Plus } from "lucide-react";
import { toast } from "sonner";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar, reviewHref } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { SentStatus, useSendStep } from "@/features/review/use-send-step";
import { ContinueActions } from "@/components/patterns/continue-actions";
import { Button } from "@/components/ui/button";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { ConfirmWithReason } from "@/components/patterns/confirm-with-reason";
import { DraftActions } from "@/components/patterns/draft-actions";
import { useSaveDraft } from "@/features/drafts/use-save-draft";
import {
  ListFilter,
  NoMatch,
  Pagination,
  matches,
  paginate,
} from "@/components/patterns/list-controls";
import { AgentWorking, useAgentRun } from "@/components/patterns/agent-working";
import { StepNav, ViewOnlyBar, useCameBack, useStepView } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import { RATE_NOTES } from "@/lib/mock/tax-rules";
import { AddColumnDialog, type NewColumn } from "@/components/patterns/add-column-dialog";
import { alertDeveloper, DEVELOPER_INBOX, reopenAlert, withdrawAlert } from "@/lib/developer-alerts";
import { readPublished } from "@/lib/published";
import { useSession } from "@/lib/session";
import { useHasQueryStep } from "@/lib/query-step";
import { RuleSheet, columnLetter } from "./rule-sheet";
import { useRuleEdits, type SheetId } from "./use-rule-edits";


/** How long each line of the generation trail takes to land. */
const PACE_MS = Number(process.env.NEXT_PUBLIC_MOCK_PACE_MS ?? 700) * 1.3;

/* `rowName` is the column that names a row — the rate, or the transaction
   type. Only the sales and purchase sheets take new columns; the rates sheet's
   shape is fixed by what a rate is. The columns themselves live in the edits,
   since they can grow. */
const SHEETS: {
  id: SheetId;
  pinned: number;
  rowName: number;
  canAddColumn: boolean;
}[] = [
  { id: "rates", pinned: 1, rowName: 0, canAddColumn: false },
  { id: "sales", pinned: 2, rowName: 1, canAddColumn: true },
  { id: "purchases", pinned: 2, rowName: 1, canAddColumn: true },
];

/**
 * What a rule is called where there is no row number to point at: a rate by
 * its name; a sales or purchase rule by its transaction type and rate, since
 * many share a type.
 */
function ruleName(
  sheet: { rowName: number },
  columns: readonly string[],
  row: readonly string[],
): string {
  const name = row[sheet.rowName] ?? "";
  const rate = sheet.rowName === 0 ? "" : (row[columns.indexOf("Rate")] ?? "");
  return [name, rate].filter(Boolean).join(" · ");
}

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
  const person = useSession();
  const router = useRouter();
  const saveDraft = useSaveDraft(countryCode, countryName, 4);
  const code = countryCode.toLowerCase();

  const [tab, setTab] = React.useState<SheetId>("rates");
  const current = SHEETS.find((s) => s.id === tab) ?? SHEETS[0];

  const edits = useRuleEdits();
  /* In review, a reviewer reads this step locked; the expert can still edit
     it and send it for approval again. */
  const review = useStepReview(countryCode, 4);
  /* Moving on sends the step for approval; the expert carries on regardless. */
  const sendStep = useSendStep(countryCode, countryName, 4);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(4);
  const readOnly = review.readOnly || viewFrom !== null;
  const cameBack = useCameBack();
  /* Generation lands one trail line at a time; past the last, it is done. A
     step looked back at, or reached by Back, opens on the rules. */
  const { shown, running: generating } = useAgentRun(t.trail.length, {
    skip: readOnly || cameBack,
    paceMs: PACE_MS,
  });

  /* Each sheet keeps its own filter and page, so switching tabs keeps your
     place. Ten rows a page, so the page never runs long. */
  const [terms, setTerms] = React.useState<Record<SheetId, string>>({
    rates: "",
    sales: "",
    purchases: "",
  });
  const [pages, setPages] = React.useState<Record<SheetId, number>>({
    rates: 1,
    sales: 1,
    purchases: 1,
  });
  const term = terms[current.id];
  const entries = edits.rows[current.id]
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => matches(term, row));
  const paged = paginate(entries, pages[current.id]);
  const setTerm = (value: string) => {
    setTerms((t) => ({ ...t, [current.id]: value }));
    setPages((p) => ({ ...p, [current.id]: 1 }));
  };
  const unsaved = edits.changed.size;

  /* A new row lands at the end, open: drop the filter and go to its page. */
  function addRow() {
    edits.addRow(current.id);
    setTerms((t) => ({ ...t, [current.id]: "" }));
    setPages((p) => ({ ...p, [current.id]: Number.MAX_SAFE_INTEGER }));
    toast(t.rowAdded);
  }

  /* What names a row in a toast or a dialog: its number, and its rate or
     transaction type. */
  const nameOf = (row: string[]) => ruleName(current, edits.columns[current.id], row) || t.newRule;
  const rowLabel = (r: number) => nameOf(edits.rows[current.id][r] ?? []);

  function duplicateRow(r: number) {
    edits.duplicateRow(current.id, r);
    toast(fill(t.duplicated, { name: rowLabel(r) }));
  }

  /* The row waiting on a reason before it is deleted. */
  const [deleting, setDeleting] = React.useState<number | null>(null);
  function confirmDelete(reason: string) {
    if (deleting === null) return;
    const sheet = current.id;
    const index = deleting;
    const rule = edits.deleteRow(sheet, index);
    if (!rule) return;
    toast(fill(t.deleted, { name: ruleName(current, edits.columns[sheet], rule.cells) || t.newRule }), {
      description: fill(t.deletedReason, { reason }),
      action: { label: t.undo, onClick: () => edits.restoreRow(sheet, index, rule) },
    });
  }

  const [addingColumn, setAddingColumn] = React.useState(false);
  function addColumn(column: NewColumn) {
    const letter = columnLetter(edits.columns[current.id].length);
    edits.addColumn(current.id, column.name, column.value, column.type);
    /* A new column changes what Comply stores, so the developer hears of it,
       with what it holds — what they need to create it. */
    const sheet = t.tabs[current.id];
    alertDeveloper(
      {
        country: countryCode,
        countryName,
        sheet,
        column: column.name,
        letter,
        value: column.value,
        type: column.type ? copy.addColumn.types[column.type] : undefined,
      },
      person,
    );
    toast(fill(t.columnAdded, { name: column.name, letter }), {
      description: fill(t.developerAlerted, { name: column.name, sheet, inbox: DEVELOPER_INBOX }),
      action: { label: t.viewAlerts, onClick: () => router.push("/developer-alerts") },
    });
  }

  /* An added column can be taken out until the country is published; then it
     is part of what Comply runs. Its developer alert is withdrawn with it. */
  function deleteColumn(name: string) {
    if (readPublished().some((p) => p.code === countryCode.toUpperCase())) {
      toast(fill(t.columnLocked, { name }));
      return;
    }
    const taken = edits.deleteColumn(current.id, name);
    if (!taken) return;
    const sheet = t.tabs[current.id];
    const alertId = withdrawAlert({ country: countryCode, sheet, column: name }, person);
    toast(fill(t.columnDeleted, { name }), {
      description: alertId ? t.columnDeletedHint : undefined,
      action: {
        label: t.undo,
        onClick: () => {
          edits.restoreColumn(taken);
          if (alertId) reopenAlert(alertId);
        },
      },
    });
  }

  function saveChanges() {
    edits.save();
    toast(t.saved);
  }

  /* Without a calculated box there is no Query Builder, so this is the last
     step: moving on lands on the approval screen, as step six's does. */
  const lastStep = !useHasQueryStep(countryCode);
  const continueLabel =
    lastStep && (sendStep.status === "waiting" || sendStep.status === "approved")
      ? copy.approvalFlow.openApproval
      : sendStep.label;

  /* Moving on keeps what was typed: unsaved edits are saved first. */
  function continueOn() {
    if (unsaved > 0) edits.save();
    sendStep.send(() =>
      router.push(lastStep ? reviewHref(countryCode) : `/countries/${code}/approval`),
    );
  }

  return (
    <ReadOnly value={readOnly}>
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
            <DraftActions onDiscard={() => router.push("/countries")} onSave={saveDraft} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <StepNav countryCode={countryCode} index={4} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div className="min-w-0">
              <h2 className="text-[22px] font-medium tracking-tight text-heading">
                {t.title}
              </h2>
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
                </div>

                {/* Only the open sheet is laid out: its pinned columns read their
                    widths from the rendered table, which a hidden one lacks. */}
                {[current].map((sheet) => (
                  <TabPanel
                    key={sheet.id}
                    id={sheet.id}
                    idBase="tax-rules"
                  >
                    <ListFilter
                      className="border-b border-border px-4 py-3"
                      leading={
                        <p className="text-[13px] text-text-muted" data-numeric>
                          {fill(t.hints[sheet.id], {
                            count: edits.rows[sheet.id].length,
                            last: columnLetter(edits.columns[sheet.id].length - 1),
                          })}
                        </p>
                      }
                      value={term}
                      onChange={setTerm}
                      placeholder={copy.list.filterRows}
                      actions={
                        !readOnly && (
                        <div className="flex shrink-0 gap-2">
                          {sheet.canAddColumn && (
                            <Button
                              variant="secondary"
                              onClick={() => setAddingColumn(true)}
                              className="h-9 active:scale-[0.98]"
                            >
                              <Columns3 />
                              {t.addColumn}
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={addRow}
                            className="h-9 active:scale-[0.98]"
                          >
                            <Plus />
                            {t.addRow}
                          </Button>
                        </div>
                        )
                      }
                    />
                    {entries.length === 0 ? (
                      <NoMatch query={term} onClear={() => setTerm("")} />
                    ) : (
                      <RuleSheet
                        columns={edits.columns[sheet.id]}
                        entries={paged.items}
                        pinned={sheet.pinned}
                        nameOf={nameOf}
                        isEditing={(r) =>
                          edits.editing.has(edits.ruleKey(sheet.id, r))
                        }
                        isChanged={(r) =>
                          edits.changed.has(edits.ruleKey(sheet.id, r))
                        }
                        onToggleEditing={(r) =>
                          edits.toggleEditing(edits.ruleKey(sheet.id, r))
                        }
                        onDuplicate={duplicateRow}
                        onDelete={(r) => setDeleting(r)}
                        addedColumn={(name) => {
                          const added = edits.addedColumn(sheet.id, name);
                          return added && {
                            typeLabel: added.type ? copy.addColumn.types[added.type] : undefined,
                          };
                        }}
                        onDeleteColumn={deleteColumn}
                        onCellChange={(r, c, v) =>
                          edits.setCell(sheet.id, r, c, v)
                        }
                      />
                    )}
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
                    <Pagination
                      className="border-t border-border px-4 py-3"
                      page={paged.page}
                      pages={paged.pages}
                      onPageChange={(n) =>
                        setPages((p) => ({ ...p, [current.id]: n }))
                      }
                    />
                  </TabPanel>
                ))}
              </section>
            )}
            {/* Deleting keeps its why — the same pattern as every other removal. */}
            <ConfirmWithReason
              open={deleting !== null}
              onOpenChange={(open) => !open && setDeleting(null)}
              title={fill(t.deleteTitle, {
                name: deleting === null ? "" : rowLabel(deleting),
              })}
              hint={t.deleteHint}
              placeholder={t.deletePlaceholder}
              confirmLabel={t.deleteConfirm}
              cancelLabel={t.deleteCancel}
              onConfirm={confirmDelete}
            />
            <AddColumnDialog
              open={addingColumn}
              sheetName={t.tabs[current.id]}
              columns={edits.columns[current.id]}
              letter={columnLetter(edits.columns[current.id].length)}
              notice={t.developerNotice}
              withType
              onOpenChange={setAddingColumn}
              onAdd={addColumn}
            />
          </div>
        </div>
      </div>

      {/* Pinned action bar — Continue is reachable without scrolling to the end. */}
      {viewFrom !== null ? (
        <ViewOnlyBar countryCode={countryCode} index={4} from={viewFrom} />
      ) : review.reviewing ? (
        <ReviewBar countryCode={countryCode} stepIndex={4} review={review} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
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
                continueLabel={continueLabel}
                onContinue={continueOn}
              />
            ) : (
              <>
                {unsaved > 0 && (
                  <span className="text-sm text-text-muted" data-numeric>
                    {fill(
                      unsaved === 1 ? t.unsavedCount : t.unsavedCountPlural,
                      {
                        count: unsaved,
                      },
                    )}
                  </span>
                )}
                <SentStatus send={sendStep} />
                <ContinueActions
                  onSave={saveChanges}
                  saveDisabled={unsaved === 0}
                  saveLabel={t.save}
                  continueLabel={continueLabel}
                  onContinue={continueOn}
                />
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
    </ReadOnly>
  );
}

/**
 * The agent at work, drawn in the shape of the sheet it is filling: tabs,
 * then rows.
 */
function Generating({ shown }: { shown: number }) {
  const t = copy.taxRules;
  return (
    <AgentWorking
      title={t.generatingTitle}
      hint={t.generatingHint}
      trailLabel={t.trailLabel}
      trail={t.trail}
      shown={shown}
    >
      <div className="flex gap-5 border-b border-border pb-2.5">
        {[44, 40, 64].map((w, i) => (
          <span
            key={i}
            className="h-3 rounded bg-border-strong"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-3.5">
        {Array.from({ length: 7 }, (_, r) => (
          <div
            key={r}
            className="grid grid-cols-[4rem_7rem_minmax(0,1fr)_5rem] gap-4"
          >
            <span className="h-3 rounded bg-surface-sunken" />
            <span className="h-3 rounded bg-surface-sunken" />
            <span
              className="h-3 rounded bg-surface-sunken"
              style={{ width: `${88 - ((r * 17) % 40)}%` }}
            />
            <span className="h-3 rounded bg-surface-sunken" />
          </div>
        ))}
      </div>
    </AgentWorking>
  );
}
