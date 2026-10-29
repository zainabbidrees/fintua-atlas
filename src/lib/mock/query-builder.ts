/**
 * The query builder's rows: one per box annotated at step four, with the rule
 * that fills it and the SQL generated from that rule.
 *
 * Nothing here is written by hand per box. A box's calculation rule is read
 * back out of the step-five tax rules — every sales or purchase line whose
 * "VAT return box" column names the box — so the rule a reviewer reads and
 * the query that runs come from the same source. The tax-rule sheets name a
 * box without its "box_" prefix ("05_net"); the field map names it in full.
 *
 * A list box is the exception: it is not a sum of tax lines but a grouped
 * listing, and the sheet already holds its query in the calculation column,
 * so that query is what generating it returns.
 */

import { RETURN_BOXES } from "./return-boxes";
import { PURCHASES, PURCHASES_COLUMNS, RATES, SALES, SALES_COLUMNS } from "./tax-rules";

export type QueryMeasure = "net" | "vat" | "list";

/** One tax-rule line feeding a box, as the reviewer reads it. */
export interface RuleLine {
  flow: "sale" | "purchase";
  transaction: string;
  region: string;
  supply: string;
  rate: string;
  subCategory: string;
}

export interface BoxQuery {
  id: string;
  box: string;
  description: string;
  measure: QueryMeasure;
  lines: RuleLine[];
  /** Columns a list box groups its lines by. */
  groupBy: string[];
  /** What Generate query produces for this box. */
  generated: string;
}

const col = <T extends readonly string[]>(columns: T, name: T[number]) =>
  columns.indexOf(name);

/* Where each flow names the box a line's net amount and its VAT land in. */
const SOURCES = [
  {
    flow: "sale" as const,
    rows: SALES,
    at: {
      transaction: col(SALES_COLUMNS, "Transaction type2"),
      region: col(SALES_COLUMNS, "Region"),
      supply: col(SALES_COLUMNS, "Goods/Services"),
      rate: col(SALES_COLUMNS, "Rate"),
      subCategory: col(SALES_COLUMNS, "sub_category"),
    },
    net: [col(SALES_COLUMNS, "VAT return box - OUT (TAX BASE)")],
    vat: [col(SALES_COLUMNS, "VAT return box - OUT (OUTPUT TAX)")],
  },
  {
    flow: "purchase" as const,
    rows: PURCHASES,
    at: {
      transaction: col(PURCHASES_COLUMNS, "Transaction type2"),
      region: col(PURCHASES_COLUMNS, "Region"),
      supply: col(PURCHASES_COLUMNS, "Goods/Services"),
      rate: col(PURCHASES_COLUMNS, "Rate"),
      subCategory: col(PURCHASES_COLUMNS, "sub_category"),
    },
    net: [
      col(PURCHASES_COLUMNS, "VAT return box - OUT (TAX BASE)"),
      col(PURCHASES_COLUMNS, "VAT return box - IN (TAX BASE)"),
    ],
    vat: [
      col(PURCHASES_COLUMNS, "VAT return box - OUT (OUTPUT TAX)"),
      col(PURCHASES_COLUMNS, "VAT return box - IN (DEDUCTIBLE INPUT TAX)"),
    ],
  },
];

const listsBox = (cell: string | undefined, key: string) =>
  (cell ?? "").split(",").some((part) => part.trim() === key);

/* The lines whose box columns name this box, once each — the sheet repeats a
   line per document type and deductibility, which do not change the rule. */
function linesFor(key: string, measure: "net" | "vat"): RuleLine[] {
  const seen = new Set<string>();
  const out: RuleLine[] = [];
  for (const source of SOURCES) {
    for (const row of source.rows) {
      if (!source[measure].some((i) => listsBox(row[i], key))) continue;
      const line: RuleLine = {
        flow: source.flow,
        transaction: row[source.at.transaction],
        region: row[source.at.region],
        supply: row[source.at.supply],
        rate: row[source.at.rate],
        subCategory: row[source.at.subCategory],
      };
      const id = Object.values(line).join("|");
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(line);
    }
  }
  return out;
}

/** "5%" for a rate code, from the rates sheet; blank where the sheet is. */
export const RATE_VALUE: Record<string, string> = Object.fromEntries(
  RATES.map(([, code, value]) => [code, value]),
);

/** The rate's own name, from the rates sheet. */
export const RATE_NAME: Record<string, string> = Object.fromEntries(
  RATES.map(([name, code]) => [code, name]),
);

const sqlText = (value: string) => `'${value.replace(/'/g, "''")}'`;

function lineCondition(line: RuleLine): string {
  const parts = [
    `t.flow = ${sqlText(line.flow === "sale" ? "S" : "P")}`,
    `t.transaction_type = ${sqlText(line.transaction)}`,
    `t.region = ${sqlText(line.region)}`,
  ];
  if (line.supply !== "ALL") parts.push(`t.supply_type = ${sqlText(line.supply)}`);
  if (line.rate !== "ALL") parts.push(`t.rate_code = ${sqlText(line.rate)}`);
  parts.push(
    line.subCategory
      ? `t.sub_category = ${sqlText(line.subCategory)}`
      : "t.sub_category IS NULL",
  );
  return `(${parts.join(" AND ")})`;
}

function sumQuery(id: string, box: string, measure: "net" | "vat", lines: RuleLine[]) {
  const amount = measure === "net" ? "t.net_amount" : "t.vat_amount";
  return [
    `-- ${box}: return_box_id ${id}`,
    `SELECT ROUND(COALESCE(SUM(${amount}), 0), 0) AS Value`,
    "FROM @schema.tax_return_lines AS t",
    "WHERE t.tax_return_id = @TaxReturnId",
    "  AND (",
    ...lines.map((line, i) => `    ${i === 0 ? "   " : "OR "}${lineCondition(line)}`),
    "  )",
  ].join("\n");
}

export const BOX_QUERIES: BoxQuery[] = RETURN_BOXES.map((row) => {
  const id = row.id ?? "";
  const box = row.box_name ?? "";
  const description = row.return_box_description ?? "";

  if (row.is_list === "TRUE") {
    return {
      id,
      box,
      description,
      measure: "list",
      lines: [],
      groupBy: (row.group_by ?? "").split(",").map((c) => c.trim()).filter(Boolean),
      generated: row.calculation ?? "",
    };
  }

  const key = box.replace(/^box_/, "");
  const measure = key.endsWith("_vat") ? "vat" : "net";
  const lines = linesFor(key, measure);
  return {
    id,
    box,
    description,
    measure,
    lines,
    groupBy: [],
    generated: sumQuery(id, box, measure, lines),
  };
});
