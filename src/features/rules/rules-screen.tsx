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
import { DraftActions } from "@/components/patterns/draft-actions";
import { Stepper } from "@/components/patterns/stepper";
import { UploadBar } from "@/components/patterns/upload-bar";
import { copy, fill } from "@/lib/copy";
import { DATASET_LABEL, type Dataset } from "@/lib/types";
import { FieldMapTable } from "./field-map-table";
import { FormPreview } from "./form-preview";
import { useRules } from "./use-rules";
import { useSpecSheets } from "./use-spec-sheets";

const STEPS = copy.page.stepsLabel.map((label, i) => ({ id: String(i), label }));

export function RulesScreen({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) {
  const router = useRouter();
  const r = useRules(countryCode);
  const [confirming, setConfirming] = React.useState(false);
  /* The spec sheets' edits live here, so Save changes in the footer reaches
     them. */
  const sheets = useSpecSheets();
  const unsaved = sheets.changed.size;

  function saveChanges() {
    sheets.save();
    toast(copy.fieldMap.saved);
  }

  function proceed() {
    if (unsaved > 0) sheets.save();
    router.push(`/countries/${countryCode.toLowerCase()}/build`);
  }
  /* Every dataset across the three parts, for the single spec-wide export. */
  const allDatasets = r.stages.flatMap((stage) =>
    stage.datasets.map((id) => r.view(id)),
  );

  return (
    <div className="pb-24">
      <header className="border-b border-border bg-surface px-6 pt-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <Link
            href={`/countries/${countryCode.toLowerCase()}/forms`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="size-3.5" />
            {copy.page.stepsLabel[2]}
          </Link>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[22px] font-medium tracking-tight text-heading">
              {countryName}
            </h1>
            <DraftActions onDiscard={() => router.push("/countries")} />
          </div>

          <div className="-mx-6 mt-6 overflow-x-auto px-6 pb-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <Stepper steps={STEPS} currentIndex={3} completedCount={3} />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 sm:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <h2 className="mb-8 text-[22px] font-medium tracking-tight text-heading">
            {copy.page.specsTitle}
          </h2>

          {/* Supporting material sits at the top of the step now: a spec or an
              example export the whole mapping can be checked against, offered
              before the work rather than tucked beneath it. */}
          <div className="mb-12">
            <UploadBar emphasis />
            {/* A single spec-wide export, as a proper button, sitting right
                under the upload row. */}
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadSpecCsv(allDatasets, countryCode)}
              >
                <Download />
                Export CSV
              </Button>
            </div>
          </div>

          {/* The official return with the agent's extracted boxes drawn over it,
              sitting directly under the upload row it is extracted from. */}
          <div className="mb-12">
            <FormPreview />
          </div>

          {/* The field map behind that form — every extracted box as an editable
              row, the mapping the spec is built from. */}
          <div className="mb-12">
            <FieldMapTable s={sheets} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/90 px-6 py-3 backdrop-blur sm:px-12 md:left-72">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href={`/countries/${countryCode.toLowerCase()}/forms`}>
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
            <Button variant="primary" onClick={() => setConfirming(true)}>
              <Check />
              {copy.confirmMapping.action}
            </Button>
          </div>
        </div>
      </div>

      {/* The one stop before Tax Rules Generation: the mapping is what the SQL is built
          from, so moving on is confirmed rather than a plain Continue. */}
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
  );
}

/** The whole spec as one file, the way the team already passes it around — each
 *  dataset a labelled block, no library. */
function downloadSpecCsv(datasets: Dataset[], countryCode: string) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines: string[] = [];

  datasets.forEach((dataset, i) => {
    if (i > 0) lines.push("");
    lines.push(escape(DATASET_LABEL[dataset.id]));
    lines.push(
      [...dataset.columns.map((col) => col.label), "Source"].map(escape).join(","),
    );
    for (const row of dataset.rows) {
      lines.push(
        [
          ...dataset.columns.map((col) => row.cells[col.key]?.value ?? ""),
          row.citation?.url ?? "",
        ]
          .map(escape)
          .join(","),
      );
    }
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${countryCode.toLowerCase()}-specs.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
