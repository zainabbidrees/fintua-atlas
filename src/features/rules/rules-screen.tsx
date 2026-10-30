"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReadOnly } from "@/components/patterns/read-only";
import { ReviewBar } from "@/features/review/review-bar";
import { useStepReview } from "@/features/review/use-step-review";
import { SentStatus, useSendStep } from "@/features/review/use-send-step";
import { AgentWorking, useAgentRun } from "@/components/patterns/agent-working";
import { DraftActions } from "@/components/patterns/draft-actions";
import { useSaveDraft } from "@/features/drafts/use-save-draft";
import { setHasQueryStep } from "@/lib/query-step";
import { StepNav, ViewOnlyBar, useStepView, backHref, useCameBack } from "@/features/steps/step-view";
import { copy, fill } from "@/lib/copy";
import { FORM_PREVIEWS } from "@/lib/mock/form-preview";
import { completedRetrievalFor, formsFor } from "@/lib/mock/tax-forms";
import { AddBoxDialog } from "./add-box-dialog";
import { AddDropdownDialog, type DropdownValue } from "./add-dropdown-dialog";
import { FieldMapTable } from "./field-map-table";
import { FormPreview } from "./form-preview";
import { RetrievedForm } from "./retrieved-form";
import { ReturnTypePanel, ReturnTypePicker, type ReturnTypeForm } from "./return-type-picker";
import {
  ADDED_PREFIX,
  PAGE_COLUMN,
  type Sheet,
  hasSpec,
  rowKey,
  useSpecSheets,
  type SpecSheets,
} from "./use-spec-sheets";


export function RulesScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const saveDraft = useSaveDraft(countryCode, countryName, 3);
  /* Every return type carried in, each with the form step three retrieved for
     it — where two editions clashed, the one the publisher's portal accepts. */
  const returnTypes = React.useMemo<ReturnTypeForm[]>(
    () =>
      formsFor(countryCode).map((f) => {
        const editions =
          f.state === "retrieving" ? completedRetrievalFor(f.obligationId).editions : f.editions;
        return {
          id: f.obligationId,
          name: f.obligationName,
          localName: f.localName,
          edition: editions[0] ?? null,
          doc: FORM_PREVIEWS[f.obligationId] ?? null,
        };
      }),
    [countryCode],
  );
  const [returnTypeId, setReturnTypeId] = React.useState(
    () => returnTypes.find((t) => t.doc !== null)?.id ?? returnTypes[0]?.id ?? "",
  );
  const returnType = returnTypes.find((t) => t.id === returnTypeId);
  const [confirming, setConfirming] = React.useState(false);
  /* The spec sheets' edits live here, so Save changes in the footer reaches
     them. */
  const sheets = useSpecSheets(returnTypeId);
  /* In review, a reviewer reads this step locked; the expert can still edit
     it and send it for approval again. */
  const review = useStepReview(countryCode, 3);
  /* Moving on sends the step for approval; the expert carries on regardless. */
  const sendStep = useSendStep(countryCode, countryName, 3);
  /* Opened from a later step through the stepper: read, never edited. */
  const viewFrom = useStepView(3);
  const readOnly = review.readOnly || viewFrom !== null;
  /* Query Builder exists only while some box is calculated, so the steps
     after this one follow the field map as it changes. A reader changes
     nothing, so only the expert's view records it. */
  React.useEffect(() => {
    if (!readOnly) setHasQueryStep(countryCode, sheets.calculatedAnywhere);
  }, [readOnly, countryCode, sheets.calculatedAnywhere]);
  const cameBack = useCameBack();
  /* The agent works for a few seconds on first arrival; a step looked back
     at, or one whose run already finished, opens on the result. */
  const agent = useAgentRun(copy.agentRuns.specs.trail.length, {
    skip: readOnly || cameBack,
  });
  const unsaved = sheets.unsaved;

  /* Adding a box the agent missed. `adding` is the page the dialog opens on —
     null to make the expert pick one, undefined while it is closed. */
  const [adding, setAdding] = React.useState<number | null | undefined>(undefined);
  /* Bumped on each add, so the field map opens on the new row. */
  const [reveal, setReveal] = React.useState(0);
  const addedBoxes = sheets.rows.boxes
    .filter((row) => row.id?.startsWith(ADDED_PREFIX) && row[PAGE_COLUMN])
    .map((row) => ({ name: row.box_name ?? "", page: Number(row[PAGE_COLUMN]) }));
  const takenNames = new Set(
    sheets.rows.boxes.map((row) => (row.box_name ?? "").toLowerCase()).filter(Boolean),
  );

  function addBox(box: { name: string; description: string; page: number | null }) {
    const id = sheets.addBox({
      box_name: box.name,
      return_box_description: box.description,
      [PAGE_COLUMN]: box.page === null ? "" : String(box.page),
    });
    /* Open straight away, so the rest of its columns can be filled in. */
    sheets.toggleEditing(rowKey("boxes", { id }, 0));
    setReveal((n) => n + 1);
    toast(
      box.page === null
        ? fill(copy.fieldMap.addedNoPage, { name: box.name })
        : fill(copy.fieldMap.added, { name: box.name, page: box.page }),
      {
        action: {
          label: copy.fieldMap.show,
          onClick: () =>
            document.getElementById("field-map")?.scrollIntoView({ behavior: "smooth" }),
        },
      },
    );
  }

  /* Adding a dropdown value: only the field map's drop-down boxes can take
     one, read from the draft so a box just switched to drop-down is offered. */
  const [addingValue, setAddingValue] = React.useState(false);
  const [revealValues, setRevealValues] = React.useState(0);
  const dropdownBoxes = sheets.rows.boxes
    .filter((row) => (row.field_type ?? "").toLowerCase() === "drop-down" && row.box_name)
    .map((row) => ({ name: row.box_name ?? "", description: row.return_box_description ?? "" }));

  function addValue(value: DropdownValue) {
    const position = sheets.rows.dropdowns.filter((v) => v.field_name === value.field_name).length + 1;
    sheets.addRow("dropdowns", {
      ...value,
      position_nr: String(position),
      is_default: "FALSE",
    });
    setRevealValues((n) => n + 1);
    toast(fill(copy.fieldMap.addedValue, { key: value.value, box: value.field_name }));
  }

  function saveChanges() {
    sheets.save();
    toast(copy.fieldMap.saved);
  }

  /* A box ticked is_calculated owes its calculation: until each is written or
     unticked, moving on stops at a pop-up that names them. */
  const missing = sheets.missingCalculations;
  const [missingOpen, setMissingOpen] = React.useState(false);
  const typeName = (id: string) => returnTypes.find((rt) => rt.id === id)?.name ?? id;

  function tryToProceed() {
    if (missing.length > 0) setMissingOpen(true);
    else setConfirming(true);
  }

  /** Takes the expert to a box that owes a calculation, open to write it. */
  function goToMissing(m: (typeof missing)[number]) {
    setReturnTypeId(m.returnType);
    sheets.openRow(m.returnType, m.key);
    setMissingOpen(false);
    requestAnimationFrame(() =>
      document.getElementById("field-map")?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  function proceed() {
    if (missing.length > 0) {
      setConfirming(false);
      setMissingOpen(true);
      return;
    }
    if (unsaved > 0) sheets.save();
    sendStep.send(() => router.push(`/countries/${countryCode.toLowerCase()}/build`));
  }

  return (
    <ReadOnly value={readOnly}>
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={backHref(countryCode, 2)}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            {copy.page.stepsLabel[2]}
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[22px] font-medium tracking-tight text-heading">
              {countryName}
            </h1>
            <DraftActions onDiscard={() => router.push("/countries")} onSave={saveDraft} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <StepNav countryCode={countryCode} index={3} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {agent.running ? (
            <AgentWorking
              title={copy.agentRuns.specs.title}
              hint={copy.agentRuns.hint}
              trailLabel={copy.agentRuns.trailLabel}
              trail={copy.agentRuns.specs.trail}
              shown={agent.shown}
            />
          ) : (
            <>
            <h2 className="mb-8 text-[22px] font-medium tracking-tight text-heading">
              {copy.page.specsTitle}
            </h2>

            {/* Which return type the form, its annotations and its field map
                below belong to. */}
            <div className="mb-6">
              <ReturnTypePicker
                types={returnTypes}
                value={returnTypeId}
                onValueChange={setReturnTypeId}
              />
            </div>

            <ReturnTypePanel id={returnTypeId}>
            {returnType?.doc ? (
              <>
                {/* The official return with the agent's extracted boxes drawn over it. */}
                <div className="mb-12">
                  <FormPreview
                    doc={returnType.doc}
                    returnType={returnType.name}
                    added={addedBoxes}
                    onAddBox={hasSpec(returnType.id) && !readOnly ? (page) => setAdding(page) : undefined}
                  />
                </div>

                {/* The field map behind that form — every extracted box as an editable
                    row, the mapping the spec is built from. Only the VAT return's
                    is modelled so far. */}
                <div className="mb-12">
                  {hasSpec(returnType.id) ? (
                    <>
                      <FieldMapTable
                        key={returnType.id}
                        s={sheets}
                        onAddBox={() => setAdding(null)}
                        onAddValue={() => setAddingValue(true)}
                        reveal={reveal}
                        revealValues={revealValues}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadSpecCsv(sheets.sheets, sheets.rows, returnType.name)}
                        >
                          <Download />
                          {copy.fieldMap.exportCsv}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <NoFieldMap name={returnType.name} />
                  )}
                </div>
              </>
            ) : (
              returnType && (
                <div className="mb-12">
                  <RetrievedForm key={returnType.id} type={returnType} />
                </div>
              )
            )}
            </ReturnTypePanel>
            </>
          )}
        </div>
      </div>

      {viewFrom !== null ? (
        <ViewOnlyBar countryCode={countryCode} index={3} from={viewFrom} />
      ) : review.reviewing ? (
        <ReviewBar countryCode={countryCode} stepIndex={3} review={review} />
      ) : (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={backHref(countryCode, 2)}>
              <ArrowLeft />
              {copy.page.back}
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {unsaved > 0 && (
              <span className="text-sm text-text-muted" data-numeric>
                {fill(
                  unsaved === 1 ? copy.fieldMap.unsavedCount : copy.fieldMap.unsavedCountPlural,
                  { count: unsaved },
                )}
              </span>
            )}
            <Button variant="secondary" disabled={unsaved === 0} onClick={saveChanges}>
              {copy.fieldMap.save}
            </Button>
            <SentStatus send={sendStep} />
            <Button variant="primary" disabled={agent.running} onClick={tryToProceed}>
              <Check />
              {sendStep.label}
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* The one stop before Tax Rules Generation: the mapping is what the SQL is built
          from, so moving on is confirmed rather than a plain Continue. */}
      {returnType?.doc && (
        <AddBoxDialog
          open={adding !== undefined}
          page={adding ?? null}
          pages={returnType.doc.pages}
          taken={takenNames}
          onOpenChange={(open) => !open && setAdding(undefined)}
          onAdd={addBox}
        />
      )}

      <AddDropdownDialog
        open={addingValue}
        boxes={dropdownBoxes}
        values={sheets.rows.dropdowns}
        onOpenChange={setAddingValue}
        onAdd={addValue}
      />

      <Dialog open={missingOpen} onOpenChange={setMissingOpen}>
        <DialogContent>
          <DialogTitle>{copy.fieldMap.missingTitle}</DialogTitle>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{copy.fieldMap.missingHint}</p>
          <ul className="mt-4 space-y-1.5">
            {missing.map((m) => (
              <li
                key={`${m.returnType}|${m.key}`}
                className="rounded-md border border-attention-edge bg-attention-fill px-3 py-2 text-[13px] text-on-attention"
              >
                <span className="font-mono text-[12px]">{m.name}</span>
                {" · "}
                {typeName(m.returnType)}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMissingOpen(false)}>
              {copy.fieldMap.missingClose}
            </Button>
            {missing[0] && (
              <Button variant="primary" autoFocus onClick={() => goToMissing(missing[0])}>
                {fill(copy.fieldMap.missingGo, { box: missing[0].name })}
                <ArrowRight />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogTitle>{copy.confirmMapping.title}</DialogTitle>
          {unsaved > 0 && (
            <p className="mt-3 rounded-md bg-surface-sunken px-3 py-2 text-sm text-text-muted">
              {unsaved === 1
                ? copy.confirmMapping.unsavedOne
                : fill(copy.confirmMapping.unsaved, { count: unsaved })}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {copy.confirmMapping.cancel}
            </Button>
            <Button
              variant="primary"
              autoFocus
              onClick={proceed}
            >
              {copy.confirmMapping.proceed}
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ReadOnly>
  );
}

/** Where a return type's boxes are drawn but its field map is not built yet. */
function NoFieldMap({ name }: { name: string }) {
  const t = copy.returnTypeSpecs;
  return (
    <div className="rounded-xl border border-dashed border-border-strong px-6 py-12">
      <p className="text-[15px] font-medium text-heading">{fill(t.noFieldMapTitle, { name })}</p>
      <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-text-muted">
        {t.noFieldMapHint}
      </p>
    </div>
  );
}

/**
 * Downloads a return type's spec as one CSV: each of its four sheets as a
 * titled section, columns in sheet order, with what is on screen — saved or
 * not.
 */
function downloadSpecCsv(sheets: Sheet[], rows: SpecSheets["rows"], name: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines: string[] = [];

  sheets.forEach((sheet, i) => {
    if (i > 0) lines.push("");
    lines.push(escape(copy.fieldMap.tabs[sheet.id]));
    lines.push(sheet.columns.map(escape).join(","));
    for (const row of rows[sheet.id]) {
      lines.push(sheet.columns.map((col) => escape(row[col] ?? "")).join(","));
    }
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fill(copy.fieldMap.exportFileName, { name })}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
