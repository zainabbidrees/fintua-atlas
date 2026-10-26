"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { copy, fill } from "@/lib/copy";
import {
  DATA_TYPES,
  FIELD_MAP,
  FIELD_TYPES,
  ROUNDING_OPTIONS,
  fieldSpec,
  positionLabel,
  type Confidence,
  type FieldMapRow,
} from "@/lib/mock/field-map";

/* The confidence dot, by tier — the same green / amber / red the boxes carry. */
const CONF_DOT: Record<Confidence, string> = {
  H: "bg-settled",
  M: "bg-attention",
  L: "bg-risk",
};

/**
 * The field map under the form preview.
 *
 * One row per box the agent pulled off the return: its name, the English and
 * local labels, its type, whether it is required or calculated, any formula,
 * where it sits on the page, and the agent's confidence. The spec downstream is
 * built from exactly this table, so every cell is editable.
 */
export function FieldMapTable() {
  const rows = FIELD_MAP;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-raised)]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-[14px] font-medium text-heading">
          {copy.fieldMap.heading}
        </h3>
        <p className="mt-0.5 text-[13px] text-text-muted">
          {fill(copy.fieldMap.hint, { count: rows.length })}
        </p>
      </div>

      <div className="max-h-[62vh] overflow-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[1680px] border-separate border-spacing-0 text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="text-left text-[12px] font-medium text-text-faint">
              <Th className="w-[180px]">{copy.fieldMap.name}</Th>
              <Th className="w-[200px]">{copy.fieldMap.labelEn}</Th>
              <Th className="w-[200px]">{copy.fieldMap.labelLocal}</Th>
              <Th className="w-[130px]">{copy.fieldMap.type}</Th>
              <Th className="w-[52px] text-center">{copy.fieldMap.required}</Th>
              <Th className="w-[52px] text-center">{copy.fieldMap.calc}</Th>
              <Th className="w-[150px]">{copy.fieldMap.formula}</Th>
              <Th className="w-[130px]">{copy.fieldMap.position}</Th>
              <Th className="w-[72px]">{copy.fieldMap.confidence}</Th>
              <Th className="w-[120px]">{copy.fieldMap.rounding}</Th>
              <Th className="w-[110px]">{copy.fieldMap.dataType}</Th>
              <Th className="w-[96px] text-center">{copy.fieldMap.mandatoryXml}</Th>
              <Th className="w-[120px]">{copy.fieldMap.startDate}</Th>
              <Th className="w-[120px]">{copy.fieldMap.endDate}</Th>
              <Th className="w-[160px]">{copy.fieldMap.note}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.name} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th
      className={cn(
        "border-b border-border px-3 py-2.5 font-medium",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Row({ row }: { row: FieldMapRow }) {
  const spec = fieldSpec(row);
  return (
    <tr className="group">
      <Td>
        <CellInput defaultValue={row.name} className="font-mono text-[12px]" />
      </Td>
      <Td>
        <CellInput defaultValue={row.labelEn} />
      </Td>
      <Td>
        <CellInput defaultValue={row.labelLocal} />
      </Td>
      <Td>
        <select
          defaultValue={row.type}
          className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[13px] text-text transition-colors hover:border-border-strong focus:border-brand focus:outline-none"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Td>
      <Td className="text-center">
        <CheckCell defaultChecked={row.required} label={`${copy.fieldMap.required} ${row.name}`} />
      </Td>
      <Td className="text-center">
        <CheckCell defaultChecked={row.calc} label={`${copy.fieldMap.calc} ${row.name}`} />
      </Td>
      <Td>
        <CellInput
          defaultValue={row.formula}
          placeholder={copy.fieldMap.empty}
          className="text-text-muted"
        />
      </Td>
      <Td>
        <span className="whitespace-nowrap font-mono text-[12px] text-text-faint">
          {positionLabel(row)}
        </span>
      </Td>
      <Td>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[12px] font-medium text-text">
          <span className={cn("size-1.5 rounded-full", CONF_DOT[row.conf])} />
          {row.conf}
        </span>
      </Td>
      <Td>
        <CellSelect defaultValue={spec.rounding} options={ROUNDING_OPTIONS} label={copy.fieldMap.rounding} />
      </Td>
      <Td>
        <CellSelect defaultValue={spec.dataType} options={DATA_TYPES} label={copy.fieldMap.dataType} />
      </Td>
      <Td className="text-center">
        <CheckCell defaultChecked={spec.mandatoryForXml} label={`${copy.fieldMap.mandatoryXml} ${row.name}`} />
      </Td>
      <Td>
        <CellInput defaultValue={spec.startDate} placeholder={copy.fieldMap.empty} className="font-mono text-[12px]" />
      </Td>
      <Td>
        <CellInput defaultValue={spec.endDate} placeholder={copy.fieldMap.empty} className="font-mono text-[12px]" />
      </Td>
      <Td>
        <CellInput defaultValue={spec.note} placeholder={copy.fieldMap.empty} className="text-text-muted" />
      </Td>
    </tr>
  );
}

function Td({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <td className={cn("border-b border-border px-3 py-1.5 align-middle", className)}>
      {children}
    </td>
  );
}

/** The editable text cell — quiet until hovered or focused, like the prototype. */
function CellInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      className={cn(
        "h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] text-text transition-colors hover:border-border focus:border-brand focus:bg-surface focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

/** A compact select cell for the spec columns (rounding, data type). */
function CellSelect({
  defaultValue,
  options,
  label,
}: {
  defaultValue: string;
  options: readonly string[];
  label: string;
}) {
  return (
    <select
      defaultValue={defaultValue}
      aria-label={label}
      className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[13px] text-text transition-colors hover:border-border-strong focus:border-brand focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function CheckCell({
  defaultChecked,
  label,
}: {
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      aria-label={label}
      className="size-4 rounded border-border accent-brand"
    />
  );
}
