"use client";

import * as React from "react";
import { Check, TriangleAlert } from "lucide-react";
import { AttentionNote } from "@/components/ui/attention-note";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { copy } from "@/lib/copy";
import type { CrossFieldCheck, ReconcileState } from "@/lib/types";
import { cn } from "@/lib/cn";

const v = copy.validation;

/**
 * Cross-field validation for the calculated boxes.
 *
 * This is the check the step is named for. A linted, dry-run file is sound SQL;
 * it is not proof the arithmetic is right. So each calculated box states the
 * identity it encodes and reconciles it against a real period, with the figures
 * shown rather than hidden — the evidence is the point, not a pass/fail tick.
 *
 * A box that does not reconcile, or an identity that leans on a box the schema
 * never defined, is held in the `attention` colour until a person settles it —
 * and settling it asks for a one-line reason, because an overruled validation
 * that applies to production is exactly what this trail has to explain later.
 */
export function ValidationPanel({
  checks,
  period,
  accepted,
  onAccept,
  onUndo,
}: {
  checks: CrossFieldCheck[];
  period: string;
  /** checkId → the reason it was accepted despite not reconciling. */
  accepted: Record<string, string>;
  onAccept: (id: string, reason: string) => void;
  onUndo: (id: string) => void;
}) {
  const reconciled = checks.filter((c) => c.state === "ok").length;
  const allClear = reconciled === checks.length;

  return (
    <section className="mt-12">
      <h2 className="text-[17px] font-medium tracking-tight text-heading">
        {v.title}
      </h2>
      <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-text-muted">
        {v.purpose.replace("{period}", period)}
      </p>

      <ul className="mt-6 border-t border-border">
        {checks.map((check) => (
          <ValidationRow
            key={check.id}
            check={check}
            reason={accepted[check.id]}
            onAccept={(reason) => onAccept(check.id, reason)}
            onUndo={() => onUndo(check.id)}
          />
        ))}
      </ul>

      {allClear && (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-text-muted">
          <Check className="size-3.5 shrink-0 text-settled" />
          {v.allClear.replace("{count}", String(reconciled))}
        </p>
      )}
    </section>
  );
}

const STATE_LABEL: Record<ReconcileState, string> = {
  ok: v.reconciles,
  mismatch: v.mismatch,
  schema: v.schema,
};

function ValidationRow({
  check,
  reason,
  onAccept,
  onUndo,
}: {
  check: CrossFieldCheck;
  reason?: string;
  onAccept: (reason: string) => void;
  onUndo: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const isClash = check.state !== "ok";
  const settled = !isClash || reason !== undefined;

  return (
    <li className="border-b border-border py-4 last:border-0">
      <div className="flex items-start gap-4">
        {/* The box number, as the team refers to it on the return. */}
        <span
          className={cn(
            "mt-0.5 inline-flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md px-1.5 text-[12px] font-medium tabular-nums",
            settled
              ? "bg-surface-sunken text-text-muted"
              : "bg-attention-quiet text-attention-text",
          )}
        >
          {check.box}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-[14px] text-text">{check.boxLabel}</span>
            <StateMark state={check.state} settled={settled} />
          </div>

          {/* Identity first, then the same identity with the period's figures
              substituted in — the arithmetic is the evidence, so it is shown. */}
          <p className="mt-1.5 text-[13px] text-text-muted">
            {check.identity}
          </p>
          <p className="mt-0.5 text-[13px] text-text-faint">
            {check.substituted}
          </p>

          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-0.5 text-[13px]">
            <span className="text-text-muted">
              {v.expectedLabel}{" "}
              <span data-numeric className="text-text">
                {check.expected}
              </span>
            </span>
            <span className="text-text-muted">
              {v.actualLabel}{" "}
              <span
                data-numeric
                className={cn(isClash ? "text-attention-text" : "text-text")}
              >
                {check.actual ?? v.noValue}
              </span>
            </span>
          </p>

          {isClash && check.note && !settled && (
            <AttentionNote className="mt-2">{check.note}</AttentionNote>
          )}

          {/* Settling a clash captures the why, matching the correction flow in
              step 3 — an overruled validation has to explain itself later. */}
          {isClash && !settled && !editing && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => setEditing(true)}
            >
              {v.accept}
            </Button>
          )}

          {isClash && !settled && editing && (
            <AcceptForm
              onCancel={() => setEditing(false)}
              onSave={(r) => {
                onAccept(r);
                setEditing(false);
              }}
            />
          )}

          {isClash && settled && reason && (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <Check className="size-3.5 shrink-0 text-text-faint" />
                {v.accepted.replace("{reason}", reason)}
              </span>
              <button
                type="button"
                onClick={onUndo}
                className="font-medium text-text-muted transition-colors hover:text-text"
              >
                {v.undo}
              </button>
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function StateMark({
  state,
  settled,
}: {
  state: ReconcileState;
  settled: boolean;
}) {
  if (state === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-text-faint">
        <Check className="size-3.5 shrink-0 text-settled" />
        {STATE_LABEL.ok}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px]",
        settled ? "text-text-faint" : "text-attention-text",
      )}
    >
      <TriangleAlert className="size-3.5 shrink-0" />
      {STATE_LABEL[state]}
    </span>
  );
}

function AcceptForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  const canSave = reason.trim() !== "";

  return (
    <div className="mt-3 max-w-lg space-y-3">
      <label className="block text-[13px] text-text-muted">
        {v.reasonLabel}
        <Textarea
          autoFocus
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={v.reasonPlaceholder}
          className="mt-1.5"
        />
      </label>
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          variant="primary"
          disabled={!canSave}
          onClick={() => onSave(reason.trim())}
        >
          {v.confirm}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
        >
          {v.cancel}
        </button>
      </div>
    </div>
  );
}
