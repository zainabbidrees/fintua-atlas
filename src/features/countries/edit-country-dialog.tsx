"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy, fill } from "@/lib/copy";
import { cn } from "@/lib/cn";
import {
  STAGES,
  STATE_ORDER,
  STATE_META,
  initialsOf,
  normalizeStage,
  type CountryRow,
  type RunState,
  type Stage,
} from "./data";

/**
 * Edits the fields the index shows for a country — name, status, stage, owner
 * and the two obligation counts. Deliberately not everything: the work inside
 * each stage belongs to that stage's screen, so this dialog stays the index's
 * own small surface rather than a second place to run the onboarding.
 */
export function EditCountryDialog({
  run,
  onOpenChange,
  onSave,
}: {
  /** The row being edited, or null when the dialog is closed. */
  run: CountryRow | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<CountryRow>) => void;
}) {
  return (
    <Dialog open={run !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Radix unmounts on close, so a fresh row re-seeds the fields. */}
        {run && (
          <Body
            run={run}
            onCancel={() => onOpenChange(false)}
            onSave={(patch) => {
              onSave(run.id, patch);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Body({
  run,
  onCancel,
  onSave,
}: {
  run: CountryRow;
  onCancel: () => void;
  onSave: (patch: Partial<CountryRow>) => void;
}) {
  const [name, setName] = React.useState(run.name);
  const [state, setState] = React.useState<RunState>(run.state);
  const [stage, setStage] = React.useState<Stage>(normalizeStage(run.step));
  const [owner, setOwner] = React.useState(run.owner.name);
  const [found, setFound] = React.useState(String(run.filingsFound));
  const [confirmed, setConfirmed] = React.useState(String(run.filingsConfirmed));

  const canSave = name.trim().length > 0;

  function save() {
    const foundN = Math.max(0, Math.floor(Number(found) || 0));
    // Confirmed can't outrun found — the index reads "confirmed / found".
    const confirmedN = Math.min(foundN, Math.max(0, Math.floor(Number(confirmed) || 0)));
    const ownerName = owner.trim() || run.owner.name;

    onSave({
      name: name.trim(),
      state,
      step: stage,
      stepsDone: STAGES.indexOf(stage) + 1,
      owner: { name: ownerName, initials: initialsOf(ownerName) },
      filingsFound: foundN,
      filingsConfirmed: confirmedN,
    });
  }

  return (
    <>
      <DialogTitle>{fill(copy.countries.editTitle, { country: run.name })}</DialogTitle>
      <DialogDescription>{copy.countries.editHint}</DialogDescription>

      <div className="mt-5 space-y-4">
        <Field label={copy.countries.nameLabel} htmlFor="country-name">
          <Input
            id="country-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!canSave}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={copy.countries.statusLabel} htmlFor="country-status">
            <Select
              id="country-status"
              value={state}
              onChange={(e) => setState(e.target.value as RunState)}
            >
              {STATE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATE_META[s].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={copy.countries.stageLabel} htmlFor="country-stage">
            <Select
              id="country-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
            >
              {STAGES.map((s, i) => (
                <option key={s} value={s}>
                  {s} · {i + 1}/6
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label={copy.countries.ownerLabel} htmlFor="country-owner">
          <Input
            id="country-owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder={copy.countries.ownerPlaceholder}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-text">
            {copy.countries.obligationsLabel}
          </legend>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <Field label={copy.countries.confirmedLabel} htmlFor="country-confirmed" small>
              <Input
                id="country-confirmed"
                type="number"
                inputMode="numeric"
                min={0}
                value={confirmed}
                onChange={(e) => setConfirmed(e.target.value)}
                data-numeric
              />
            </Field>
            <Field label={copy.countries.foundLabel} htmlFor="country-found" small>
              <Input
                id="country-found"
                type="number"
                inputMode="numeric"
                min={0}
                value={found}
                onChange={(e) => setFound(e.target.value)}
                data-numeric
              />
            </Field>
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {copy.countries.cancel}
        </Button>
        <Button variant="primary" disabled={!canSave} onClick={save}>
          {copy.countries.save}
        </Button>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  small,
  children,
}: {
  label: string;
  htmlFor: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className={cn(
          "block font-medium text-text",
          small ? "text-[13px] text-text-muted" : "text-sm",
        )}
      >
        {label}
      </label>
      <div className={small ? "mt-1" : "mt-1.5"}>{children}</div>
    </div>
  );
}

/** A native select dressed to match the Input beside it. */
function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-border-strong bg-surface pl-3 pr-8 text-sm text-text",
          "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-faint"
      />
    </div>
  );
}
