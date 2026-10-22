import type { Cell, Dataset, DatasetId, RuleRow } from "../types";

/**
 * Belgian mapping datasets.
 *
 * Box numbers are the real ones from the Belgian periodic return — 01/02/03
 * for sales by rate, 46 for intra-Community supplies, 54 for VAT due, 59 for
 * deductible VAT, 81–87 for purchases. Plausible data is the only way to tell
 * whether a layout actually works at this density.
 */

const c = (value: string): Cell => ({ value });

function row(id: string, cells: Record<string, string>, issue?: string): RuleRow {
  return {
    id,
    cells: Object.fromEntries(Object.entries(cells).map(([k, v]) => [k, c(v)])),
    issue,
  };
}

const RATES: Dataset = {
  id: "rates",
  columns: [
    { key: "name", label: "Rate", width: "w-32" },
    { key: "percentage", label: "Percentage", mono: true, editable: true, width: "w-28" },
    { key: "applies", label: "Applies to", editable: true },
    { key: "from", label: "In force from", mono: true, editable: true, width: "w-32" },
  ],
  rows: [
    row("r-std", {
      name: "Standard",
      percentage: "21.0%",
      applies: "Supplies not otherwise specified",
      from: "2026-01-01",
    }),
    row("r-red6", {
      name: "Reduced",
      percentage: "6.0%",
      applies: "Food, water, books, passenger transport",
      from: "2026-01-01",
    }),
    row("r-red12", {
      name: "Reduced",
      percentage: "12.0%",
      applies: "Restaurant and catering, social housing",
      from: "2026-01-01",
    }),
    row("r-zero", {
      name: "Zero",
      percentage: "0.0%",
      applies: "Intra-Community supplies, exports",
      from: "2026-01-01",
    }),
  ],
  uncovered: [],
};

const SALES: Dataset = {
  id: "sales",
  columns: [
    { key: "type", label: "Transaction type" },
    { key: "rate", label: "Rate", mono: true, editable: true, width: "w-20" },
    { key: "base", label: "Base box", mono: true, editable: true, width: "w-24" },
    { key: "vat", label: "VAT box", mono: true, editable: true, width: "w-24" },
  ],
  rows: [
    row("s-std", { type: "Domestic sale — standard rate", rate: "21.0%", base: "03", vat: "54" }),
    row("s-r6", { type: "Domestic sale — 6%", rate: "6.0%", base: "01", vat: "54" }),
    row("s-r12", { type: "Domestic sale — 12%", rate: "12.0%", base: "02", vat: "54" }),
    row("s-ics", { type: "Intra-Community supply of goods", rate: "0.0%", base: "46", vat: "—" }),
    row("s-exp", { type: "Export outside the EU", rate: "0.0%", base: "47", vat: "—" }),
    row(
      "s-rc",
      { type: "Reverse charge — construction", rate: "—", base: "45", vat: "—" },
      "The agent could not establish whether the taxable base belongs in box 45 or box 47. Both appear in the guidance for construction work.",
    ),
  ],
  uncovered: ["Distance sales under OSS", "Margin scheme — second-hand goods"],
};

const PURCHASES: Dataset = {
  id: "purchases",
  columns: [
    { key: "type", label: "Transaction type" },
    { key: "rate", label: "Rate", mono: true, editable: true, width: "w-20" },
    { key: "base", label: "Base box", mono: true, editable: true, width: "w-24" },
    { key: "vat", label: "Deductible box", mono: true, editable: true, width: "w-32" },
  ],
  rows: [
    row("p-goods", { type: "Domestic purchase — goods for resale", rate: "21.0%", base: "81", vat: "59" }),
    row("p-serv", { type: "Domestic purchase — services", rate: "21.0%", base: "82", vat: "59" }),
    row("p-cap", { type: "Capital goods", rate: "21.0%", base: "83", vat: "59" }),
    row(
      "p-ica",
      { type: "Intra-Community acquisition", rate: "21.0%", base: "86", vat: "59" },
      "Acquisitions also generate output VAT in box 55. That second entry has no rule yet.",
    ),
    row("p-imp", { type: "Import with deferred accounting", rate: "21.0%", base: "87", vat: "59" }),
  ],
  uncovered: [],
};

const VIES: Dataset = {
  id: "vies",
  columns: [
    { key: "type", label: "Transaction type" },
    { key: "code", label: "VIES code", mono: true, editable: true, width: "w-28" },
    { key: "note", label: "Note", editable: true },
  ],
  rows: [
    row("v-goods", { type: "Intra-Community supply of goods", code: "L", note: "Standard goods supply" }),
    row("v-tri", { type: "Triangular supply", code: "T", note: "Intermediary in a chain of three" }),
    row("v-serv", { type: "Services under reverse charge", code: "S", note: "Article 44 services" }),
  ],
  uncovered: [],
};

const BE: Record<DatasetId, Dataset> = {
  rates: RATES,
  sales: SALES,
  purchases: PURCHASES,
  vies: VIES,
};

export function datasetsFor(_countryCode: string): Record<DatasetId, Dataset> {
  // One jurisdiction is modelled in detail; others reuse its shape for now.
  return BE;
}
