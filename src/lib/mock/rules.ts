import type { Cell, Citation, Dataset, DatasetId, RuleRow } from "../types";

/**
 * Belgian specs and datasets.
 *
 * Grids are the real ones from the Belgian periodic return — 01/02/03 for
 * sales by rate, 44/45/46/47 for the exempt and reverse-charge families, 54–59
 * for VAT due and deductible, 81–87 for purchases. Plausible data is the only
 * way to tell whether a layout actually works at this density, and the only
 * way the stage order can be judged: a sale rule here really does cite a rate
 * code and a grid declared two stages earlier.
 */

const c = (value: string): Cell => ({ value });

const FISCONET: Citation = {
  label: "fisconetplus.be",
  url: "https://eservices.minfin.fgov.be/myminfin-web/",
  locator: "VAT Code, art. 53",
};
const CIRCULAR: Citation = {
  label: "finances.belgium.be",
  url: "https://finances.belgium.be/en/enterprises/vat",
  locator: "Periodic return — explanatory notes",
};
const EURLEX: Citation = {
  label: "eur-lex.europa.eu",
  url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32006L0112",
  locator: "Directive 2006/112/EC",
};
const INTERVAT: Citation = {
  label: "intervat.minfin.fgov.be",
  url: "https://finances.belgium.be/en/E-services/Intervat",
  locator: "Submission schema",
};

function row(
  id: string,
  cells: Record<string, string>,
  extra: { issue?: string; citation?: Citation } = {},
): RuleRow {
  return {
    id,
    cells: Object.fromEntries(Object.entries(cells).map(([k, v]) => [k, c(v)])),
    issue: extra.issue,
    citation: extra.citation,
  };
}

/* ── Stage 1 — Returns ─────────────────────────────────────────────────── */

const RETURNS: Dataset = {
  id: "returns",
  purpose:
    "The filings carried forward from step 2, now with the cycle, the deadline and the channel Comply submits on.",
  columns: [
    { key: "name", label: "Return", editable: true, required: true },
    {
      key: "frequency",
      label: "Frequency",
      kind: "select",
      options: ["Monthly", "Quarterly", "Annual"],
      editable: true,
      required: true,
      width: "w-36",
    },
    { key: "deadline", label: "Deadline day", mono: true, editable: true, required: true, width: "w-24" },
    { key: "channel", label: "Channel", editable: true, required: true, width: "w-32" },
    { key: "from", label: "In force from", kind: "date", mono: true, editable: true, required: true, width: "w-32" },
    { key: "until", label: "Until", kind: "date", mono: true, editable: true, width: "w-28" },
  ],
  rows: [
    row(
      "d-vat",
      {
        name: "VAT Return",
        frequency: "Monthly",
        deadline: "20",
        channel: "Intervat",
        from: "2026-01-01",
        until: "",
      },
      {
        citation: FISCONET,
        issue:
          "Belgium allows a quarterly regime below €2.5m turnover. The agent could not establish which cycle this client falls under, and the two produce different deadlines.",
      },
    ),
    row(
      "d-esl",
      {
        name: "EC Sales List",
        frequency: "Monthly",
        deadline: "20",
        channel: "Intervat",
        from: "2026-01-01",
        until: "",
      },
      { citation: EURLEX },
    ),
    row(
      "d-clients",
      {
        name: "Annual client listing",
        frequency: "Annual",
        deadline: "31",
        channel: "Intervat",
        from: "2026-01-01",
        until: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "d-intrastat",
      {
        name: "Intrastat dispatches",
        frequency: "Monthly",
        deadline: "20",
        channel: "OneGate",
        from: "2026-01-01",
        until: "",
      },
      { citation: CIRCULAR },
    ),
  ],
  uncovered: [],
};

/* ── Stage 2 — Form & rates ────────────────────────────────────────────── */

const BOX_TYPES = ["Numeric", "String", "Date", "Checkbox"];

const BOXES: Dataset = {
  id: "boxes",
  purpose:
    "Every grid on the periodic return, named exactly as Comply will reference it. Nothing downstream can target a box that is missing here.",
  columns: [
    { key: "box", label: "Box", mono: true, editable: true, required: true, width: "w-28" },
    { key: "label", label: "Label", editable: true, required: true },
    {
      key: "type",
      label: "Type",
      kind: "select",
      options: BOX_TYPES,
      editable: true,
      required: true,
      width: "w-32",
    },
    { key: "required", label: "Mandatory", kind: "flag", editable: true, width: "w-28" },
  ],
  rows: [
    row("b-00", { box: "grid_00", label: "Sales at 0%", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
    row("b-01", { box: "grid_01", label: "Sales at 6%", type: "Numeric", required: "yes" }, { citation: CIRCULAR }),
    row("b-02", { box: "grid_02", label: "Sales at 12%", type: "Numeric", required: "yes" }, { citation: CIRCULAR }),
    row("b-03", { box: "grid_03", label: "Sales at 21%", type: "Numeric", required: "yes" }, { citation: CIRCULAR }),
    row("b-44", { box: "grid_44", label: "Services to EU taxable persons", type: "Numeric", required: "no" }, { citation: EURLEX }),
    row(
      "b-45",
      { box: "grid_45", label: "Sales under domestic reverse charge", type: "Numeric", required: "no" },
      { citation: CIRCULAR },
    ),
    row("b-46", { box: "grid_46", label: "Intra-Community supplies of goods", type: "Numeric", required: "no" }, { citation: EURLEX }),
    row("b-47", { box: "grid_47", label: "Other exempt sales and exports", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
    row("b-54", { box: "grid_54", label: "VAT due on grids 01, 02 and 03", type: "Numeric", required: "yes" }, { citation: CIRCULAR }),
    row(
      "b-56",
      { box: "grid_56", label: "VAT due on reverse-charge purchases", type: "Numeric", required: "yes" },
      {
        issue:
          "The explanatory notes put reverse-charge VAT in grid 56; the Intervat schema the agent read puts it in grid 55. One of the two is out of date.",
      },
    ),
    row("b-59", { box: "grid_59", label: "Deductible VAT", type: "Numeric", required: "yes" }, { citation: CIRCULAR }),
    row("b-81", { box: "grid_81", label: "Purchases of goods for resale", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
    row("b-82", { box: "grid_82", label: "Purchases of services and other goods", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
    row("b-83", { box: "grid_83", label: "Purchases of capital goods", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
    row("b-86", { box: "grid_86", label: "Intra-Community acquisitions", type: "Numeric", required: "no" }, { citation: EURLEX }),
    row("b-87", { box: "grid_87", label: "Other purchases under reverse charge", type: "Numeric", required: "no" }, { citation: CIRCULAR }),
  ],
  uncovered: [],
};

const RATES: Dataset = {
  id: "rates",
  purpose:
    "The rates in force, each with the code the rules will cite and the date it took effect.",
  columns: [
    { key: "code", label: "Code", mono: true, editable: true, required: true, width: "w-24" },
    { key: "name", label: "Rate", editable: true, required: true, width: "w-32" },
    { key: "percentage", label: "Percentage", mono: true, editable: true, required: true, width: "w-28" },
    { key: "applies", label: "Applies to", editable: true },
    { key: "from", label: "In force from", kind: "date", mono: true, editable: true, required: true, width: "w-32" },
    { key: "until", label: "Until", kind: "date", mono: true, editable: true, width: "w-28" },
  ],
  rows: [
    row(
      "r-std",
      {
        code: "S",
        name: "Standard",
        percentage: "21.0%",
        applies: "Supplies not otherwise specified",
        from: "2026-01-01",
        until: "",
      },
      { citation: FISCONET },
    ),
    row(
      "r-red12",
      {
        code: "R12",
        name: "Reduced",
        percentage: "12.0%",
        applies: "Restaurant and catering, social housing",
        from: "2026-01-01",
        until: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "r-red6",
      {
        code: "R6",
        name: "Reduced",
        percentage: "6.0%",
        applies: "Food, water, books, passenger transport",
        from: "2026-01-01",
        until: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "r-zero",
      {
        code: "Z",
        name: "Zero",
        percentage: "0.0%",
        applies: "Intra-Community supplies, exports",
        from: "2026-01-01",
        until: "",
      },
      { citation: EURLEX },
    ),
    row(
      "r-rc",
      {
        code: "RC",
        name: "Reverse charge",
        percentage: "0.0%",
        applies: "Domestic construction work under the co-contractor rule",
        from: "2026-01-01",
        until: "",
      },
      { citation: CIRCULAR },
    ),
  ],
  uncovered: [],
};

/* ── Stage 3 — Rules & mapping ─────────────────────────────────────────── */

const SALE_KINDS = ["Domestic", "Intra-EU B2B", "Export", "Reverse charge"];

const SALES: Dataset = {
  id: "sales",
  purpose:
    "Where a sale lands on the return. Each rule cites a rate code and a grid declared in the previous part.",
  columns: [
    { key: "rule", label: "Rule", mono: true, editable: true, required: true, width: "w-20" },
    {
      key: "kind",
      label: "Transaction type",
      kind: "select",
      options: SALE_KINDS,
      editable: true,
      required: true,
      width: "w-40",
    },
    { key: "rate", label: "Rate code", mono: true, editable: true, required: true, width: "w-24" },
    { key: "base", label: "Base box", mono: true, editable: true, required: true, width: "w-28" },
    { key: "vat", label: "VAT box", mono: true, editable: true, width: "w-28" },
    { key: "condition", label: "Condition", editable: true },
  ],
  rows: [
    row(
      "s-std",
      {
        rule: "S-01",
        kind: "Domestic",
        rate: "S",
        base: "grid_03",
        vat: "grid_54",
        condition: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "s-r12",
      {
        rule: "S-02",
        kind: "Domestic",
        rate: "R12",
        base: "grid_02",
        vat: "grid_54",
        condition: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "s-r6",
      {
        rule: "S-03",
        kind: "Domestic",
        rate: "R6",
        base: "grid_01",
        vat: "grid_54",
        condition: "",
      },
      { citation: CIRCULAR },
    ),
    row(
      "s-ics",
      {
        rule: "S-04",
        kind: "Intra-EU B2B",
        rate: "Z",
        base: "grid_46",
        vat: "",
        condition: "Buyer VAT number validated in VIES",
      },
      { citation: EURLEX },
    ),
    row(
      "s-exp",
      {
        rule: "S-05",
        kind: "Export",
        rate: "Z",
        base: "grid_47",
        vat: "",
        condition: "Proof of export held",
      },
      { citation: CIRCULAR },
    ),
    row(
      "s-rc",
      {
        rule: "S-06",
        kind: "Reverse charge",
        rate: "RC",
        base: "grid_45",
        vat: "",
        condition: "",
      },
      {
        issue:
          "The agent could not establish whether the taxable base belongs in grid 45 or grid 47. Both appear in the guidance for construction work.",
      },
    ),
  ],
  uncovered: ["Distance sales under OSS", "Margin scheme — second-hand goods"],
};

const PURCHASE_KINDS = ["Domestic", "Intra-EU acquisition", "Import", "Reverse charge"];

const PURCHASES: Dataset = {
  id: "purchases",
  purpose:
    "Where a purchase lands, and how much of the VAT on it Comply may deduct.",
  columns: [
    { key: "rule", label: "Rule", mono: true, editable: true, required: true, width: "w-20" },
    {
      key: "kind",
      label: "Transaction type",
      kind: "select",
      options: PURCHASE_KINDS,
      editable: true,
      required: true,
      width: "w-44",
    },
    { key: "rate", label: "Rate code", mono: true, editable: true, required: true, width: "w-24" },
    { key: "base", label: "Base box", mono: true, editable: true, required: true, width: "w-28" },
    { key: "vat", label: "Deductible box", mono: true, editable: true, width: "w-32" },
    { key: "deductible", label: "Deductible", mono: true, editable: true, width: "w-28" },
  ],
  rows: [
    row(
      "p-goods",
      {
        rule: "P-01",
        kind: "Domestic",
        rate: "S",
        base: "grid_81",
        vat: "grid_59",
        deductible: "100%",
      },
      { citation: CIRCULAR },
    ),
    row(
      "p-serv",
      {
        rule: "P-02",
        kind: "Domestic",
        rate: "S",
        base: "grid_82",
        vat: "grid_59",
        deductible: "100%",
      },
      { citation: CIRCULAR },
    ),
    row(
      "p-cap",
      {
        rule: "P-03",
        kind: "Domestic",
        rate: "S",
        base: "grid_83",
        vat: "grid_59",
        deductible: "100%",
      },
      { citation: CIRCULAR },
    ),
    row(
      "p-ica",
      {
        rule: "P-04",
        kind: "Intra-EU acquisition",
        rate: "S",
        base: "grid_86",
        vat: "grid_59",
        deductible: "100%",
      },
      {
        citation: EURLEX,
        issue:
          "Acquisitions also generate output VAT in grid 55. That second entry has no rule yet.",
      },
    ),
    row(
      "p-imp",
      {
        rule: "P-05",
        kind: "Import",
        rate: "S",
        base: "grid_87",
        vat: "grid_59",
        deductible: "100%",
      },
      { citation: CIRCULAR },
    ),
  ],
  uncovered: [],
};

const VIES: Dataset = {
  id: "vies",
  purpose:
    "How Comply's own fields are read into the EC Sales List, field by field.",
  columns: [
    { key: "field", label: "VIES field", mono: true, editable: true, required: true, width: "w-52" },
    { key: "source", label: "Source field", mono: true, editable: true, required: true, width: "w-48" },
    { key: "box", label: "Return box", mono: true, editable: true, width: "w-36" },
    { key: "note", label: "Note", editable: true },
  ],
  rows: [
    row(
      "v-vat",
      {
        field: "CustomerVATNumber",
        source: "buyer.vat_id",
        box: "grid_46",
        note: "Prefixed with the country code",
      },
      { citation: INTERVAT },
    ),
    row(
      "v-total",
      { field: "TotalValue", source: "totals.net", box: "grid_46", note: "Net of VAT, in euro" },
      { citation: INTERVAT },
    ),
    row(
      "v-code",
      {
        field: "TransactionIndicator",
        source: "line.supply_kind",
        box: "",
        note: "L goods, T triangular, S services",
      },
      { citation: EURLEX },
    ),
  ],
  uncovered: [],
};

const BE: Record<DatasetId, Dataset> = {
  returns: RETURNS,
  boxes: BOXES,
  rates: RATES,
  sales: SALES,
  purchases: PURCHASES,
  vies: VIES,
};

export function datasetsFor(_countryCode: string): Record<DatasetId, Dataset> {
  // One jurisdiction is modelled in detail; others reuse its shape for now.
  return BE;
}
