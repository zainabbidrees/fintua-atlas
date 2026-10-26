/**
 * The field map behind the return PDF — every box the agent pulled off the
 * form, as the mapping table under the preview lists them. The set and its
 * values mirror the extracted boxes (src/lib/mock/form-preview.ts); here they
 * carry the full column data the table edits.
 *
 * `conf` is the agent's confidence tier and drives the row's dot: H high, M
 * medium, L low. `calc`/`formula` are blank until a box is marked calculated.
 */
export type FieldType =
  | "String"
  | "Numeric"
  | "Checkbox"
  | "Date"
  | "Dropdown"
  | "List";

export type Confidence = "H" | "M" | "L";

export const FIELD_TYPES: FieldType[] = [
  "String",
  "Numeric",
  "Checkbox",
  "Date",
  "Dropdown",
  "List",
];

/** How a numeric value is rounded for the XML — the spec columns scroll right. */
export type Rounding = "none" | "round_0" | "round_2" | "floor_0" | "ceil_0";
export const ROUNDING_OPTIONS: Rounding[] = [
  "none",
  "round_0",
  "round_2",
  "floor_0",
  "ceil_0",
];

/** The XML data type the box serialises to. */
export type DataType =
  | "decimal"
  | "integer"
  | "string"
  | "boolean"
  | "date"
  | "enum"
  | "array";
export const DATA_TYPES: DataType[] = [
  "decimal",
  "integer",
  "string",
  "boolean",
  "date",
  "enum",
  "array",
];

/** The XML-spec detail for a box, derived from its type and required flag —
    the same mapping the prototype applies: numeric rounds to two places and
    serialises as decimal, each other type to its matching XML type. */
export interface FieldSpec {
  rounding: Rounding;
  dataType: DataType;
  mandatoryForXml: boolean;
  startDate: string;
  endDate: string;
  note: string;
}

export function fieldSpec(row: FieldMapRow): FieldSpec {
  const dataType: DataType =
    row.type === "Numeric"
      ? "decimal"
      : row.type === "Checkbox"
        ? "boolean"
        : row.type === "Date"
          ? "date"
          : row.type === "Dropdown"
            ? "enum"
            : row.type === "List"
              ? "array"
              : "string";
  return {
    rounding: row.type === "Numeric" ? "round_2" : "none",
    dataType,
    mandatoryForXml: row.required,
    startDate: "2025-01-01",
    endDate: "",
    note: "",
  };
}

export interface FieldMapRow {
  name: string;
  labelEn: string;
  labelLocal: string;
  type: FieldType;
  required: boolean;
  calc: boolean;
  formula: string;
  page: number;
  /** Top-left on the PDF page, in points (595.276 × 841.89). */
  x: number;
  y: number;
  conf: Confidence;
}

/** PDF page dimensions the positions are normalised against. */
export const PAGE_W = 595.276;
export const PAGE_H = 841.89;

/** "p1 · 0.11,0.13" — the page and the box's normalised top-left. */
export function positionLabel(row: FieldMapRow): string {
  const f = (v: number) => (Math.floor(v * 100) / 100).toFixed(2);
  return `p${row.page} · ${f(row.x / PAGE_W)},${f(row.y / PAGE_H)}`;
}

const r = (
  name: string,
  labelEn: string,
  labelLocal: string,
  type: FieldType,
  required: boolean,
  page: number,
  x: number,
  y: number,
  conf: Confidence,
): FieldMapRow => ({
  name,
  labelEn,
  labelLocal,
  type,
  required,
  calc: false,
  formula: "",
  page,
  x,
  y,
  conf,
});

export const FIELD_MAP: FieldMapRow[] = [
  r("#tax_office#", "Tax office", "An das Finanzamt", "String", true, 1, 66, 84, "H"),
  r("#tax_number#", "Tax number", "Steuernummer", "String", true, 1, 66, 115, "H"),
  r("#vat_id#", "Business ID number (W-IdNr.)", "Wirtschafts-Identifikationsnummer", "String", false, 1, 66, 181, "M"),
  r("#full_name#", "Business name", "Name des Unternehmers", "String", true, 1, 66, 207, "H"),
  r("#trading_name#", "Trading name (if different)", "ggf. abweichender Firmenname", "String", false, 1, 66, 233, "M"),
  r("#business_type#", "Type of business", "Art des Unternehmens", "String", false, 1, 66, 259, "M"),
  r("#street#", "Street", "Straße", "String", true, 1, 66, 286, "H"),
  r("#house_number#", "House number", "Hausnummer", "String", true, 1, 66, 312, "H"),
  r("#house_number_suffix#", "House number suffix", "Hausnummerzusatz", "String", false, 1, 137, 312, "M"),
  r("#address_supplement#", "Address supplement", "Adressergänzung", "String", false, 1, 236, 312, "L"),
  r("#postal_code#", "Postal code", "Postleitzahl", "String", true, 1, 66, 338, "H"),
  r("#city#", "City", "Ort", "String", true, 1, 151, 338, "H"),
  r("#po_box_postal_code#", "PO box postal code", "Postleitzahl (Postfach)", "String", false, 1, 66, 364, "M"),
  r("#po_box#", "PO box", "Postfach", "String", false, 1, 151, 364, "M"),
  r("#phone#", "Phone", "Telefon", "String", false, 1, 66, 391, "M"),
  r("#email#", "Email address", "E-Mail-Adresse", "String", false, 1, 66, 417, "M"),
  r("box_110", "Corrected return", "Berichtigte Steuererklärung", "Checkbox", false, 1, 505, 134.6, "H"),
  r("box_125", "Business established abroad", "Im Ausland ansässiger Unternehmer", "Checkbox", false, 1, 505, 436.1, "H"),
  r("box_126", "Fiscal representative", "Fiskalvertreter", "Checkbox", false, 1, 505, 458.6, "H"),
  r("box_136", "Date of switch from small-business scheme", "Datum des Wechsels (§ 19 UStG)", "Date", false, 1, 447, 481.1, "M"),
  r("box_133", "Tax calculated on (agreed / received)", "Die Steuer wurde berechnet nach", "Dropdown", true, 1, 92, 589.9, "H"),
  r("box_129", "Offset / assignment of refund", "Verrechnung des Erstattungsbetrages", "Checkbox", false, 1, 505, 646.1, "H"),
  r("box_123", "Additional information attached", "Ergänzende Angaben zur Steuererklärung", "Checkbox", false, 1, 505, 690.4, "M"),
  r("box_177", "Supplies at 19% (net)", "Lieferungen und sonstige Leistungen zu 19 %", "Numeric", true, 2, 236, 88.9, "H"),
  r("box_178", "Free supplies § 3(1b) at 19%", "Lieferungen nach § 3 Abs. 1b UStG zu 19 %", "Numeric", false, 2, 236, 119.6, "M"),
  r("box_179", "Free services § 3(9a) at 19%", "Sonstige Leistungen nach § 3 Abs. 9a zu 19 %", "Numeric", false, 2, 236, 139.9, "M"),
  r("box_275", "Supplies at 7% (net)", "Lieferungen und sonstige Leistungen zu 7 %", "Numeric", true, 2, 236, 184.9, "H"),
  r("box_195", "Free supplies § 3(1b) at 7%", "Lieferungen nach § 3 Abs. 1b UStG zu 7 %", "Numeric", false, 2, 236, 215.6, "M"),
  r("box_196", "Free services § 3(9a) at 7%", "Sonstige Leistungen nach § 3 Abs. 9a zu 7 %", "Numeric", false, 2, 236, 235.9, "M"),
  r("box_157", "Supplies at 0%", "Lieferungen und sonstige Leistungen zu 0 %", "Numeric", false, 2, 236, 280.9, "H"),
  r("box_155", "Supplies at other rates (net)", "Umsätze zu anderen Steuersätzen", "Numeric", false, 2, 236, 359.6, "L"),
  r("box_156", "Tax on supplies at other rates", "Steuer zu anderen Steuersätzen", "Numeric", false, 2, 393, 359.6, "L"),
  r("box_741", "Intra-EU acquisitions at 19% (net)", "Innergemeinschaftliche Erwerbe zu 19 %", "Numeric", false, 3, 430, 103.9, "H"),
  r("box_744", "Intra-EU acquisitions at 7% (net)", "Innergemeinschaftliche Erwerbe zu 7 %", "Numeric", false, 3, 430, 124.1, "M"),
  r("box_237", "Reverse charge § 13b services (net)", "Leistungen nach § 13b UStG", "Numeric", false, 3, 430, 282.4, "M"),
  r("box_781", "Deductible input VAT from invoices", "Vorsteuerbeträge aus Rechnungen", "Numeric", true, 3, 258, 535.9, "M"),
  r("box_793", "Input VAT on intra-EU acquisitions", "Vorsteuer aus innergemeinschaftlichem Erwerb", "Numeric", false, 3, 258, 556.1, "M"),
];
