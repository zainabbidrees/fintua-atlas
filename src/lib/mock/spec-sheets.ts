/**
 * The three sheets that sit beside the field map in the return spec, kept as
 * the source workbook holds them: strings, TRUE / FALSE for flags, blanks left
 * blank. They describe the same Hungarian return as src/lib/mock/return-boxes.ts.
 *
 * - List boxes: the columns of each box that holds a list rather than a single
 *   amount. `list_dispatches` groups by exactly these columns.
 * - Mandatory fields: which fields a TXT or XML submission cannot go without,
 *   and when.
 * - Dropdown fields: the closed set of values a field accepts.
 */

export type SheetRow = Record<string, string>;

/* ── List boxes ─────────────────────────────────────────────────────────── */

export const LIST_BOX_COLUMNS = [
  "id",
  "box_name",
  "column_name",
  "display_name",
  "data_type",
  "position_nr",
  "max_length",
  "is_mandatory",
  "accepts_values_from_list",
  "source_column",
] as const;

function listColumn(
  id: string,
  column_name: string,
  display_name: string,
  data_type: string,
  position_nr: string,
  max_length: string,
  is_mandatory: boolean,
  from_list: boolean,
  source_column: string,
): SheetRow {
  return {
    id,
    box_name: "list_dispatches",
    column_name,
    display_name,
    data_type,
    position_nr,
    max_length,
    is_mandatory: is_mandatory ? "TRUE" : "FALSE",
    accepts_values_from_list: from_list ? "TRUE" : "FALSE",
    source_column,
  };
}

export const LIST_BOXES: SheetRow[] = [
  listColumn("1201", "commodity_code", "Commodity code (CN8)", "string", "1", "8", true, false, "intrastat_return_details.commodity_code"),
  listColumn("1202", "goods_origin_country", "Country of origin", "string", "2", "2", true, false, "intrastat_return_details.goods_origin_country"),
  listColumn("1203", "country_arrival_dispatch_iso_code", "Member State of destination", "string", "3", "2", true, false, "intrastat_return_details.country_arrival_dispatch_iso_code"),
  listColumn("1204", "nature_of_transaction", "Nature of transaction", "string", "4", "2", true, true, "intrastat_return_details.nature_of_transaction"),
  listColumn("1205", "vat_nr_supplier_customer", "Partner VAT number", "string", "5", "14", true, false, "intrastat_return_details.vat_nr_supplier_customer"),
  listColumn("1206", "mode_of_transport", "Mode of transport", "string", "6", "1", false, true, "intrastat_return_details.mode_of_transport"),
  listColumn("1207", "delivery_terms", "Delivery terms (Incoterms)", "string", "7", "3", false, true, "intrastat_return_details.delivery_terms"),
  listColumn("1208", "net_mass", "Net mass (kg)", "decimal", "8", "", false, false, "intrastat_return_details.net_mass"),
  listColumn("1209", "supplementary_units", "Supplementary units", "decimal", "9", "", false, false, "intrastat_return_details.supplementary_units"),
  listColumn("1210", "invoiced_value", "Invoiced value (HUF)", "decimal", "10", "", true, false, "intrastat_return_details.invoiced_value"),
];

/* ── Mandatory fields ───────────────────────────────────────────────────── */

export const MANDATORY_COLUMNS = [
  "id",
  "field_name",
  "return_type",
  "submission_type",
  "is_mandatory",
  "condition",
  "error_message",
] as const;

function mandatory(
  id: string,
  field_name: string,
  return_type: string,
  submission_type: string,
  condition: string,
  error_message: string,
): SheetRow {
  return { id, field_name, return_type, submission_type, is_mandatory: "TRUE", condition, error_message };
}

export const MANDATORY_FIELDS: SheetRow[] = [
  mandatory("2101", "tax_number", "VAT Return", "XML", "", "The taxpayer's tax number is required."),
  mandatory("2102", "period_start", "VAT Return", "XML", "", "The return period's start date is required."),
  mandatory("2103", "period_end", "VAT Return", "XML", "", "The return period's end date is required."),
  mandatory("2104", "box_05_vat", "VAT Return", "XML", "box_05_net <> 0", "Box 05 VAT is required when box 05 net is filled."),
  mandatory("2105", "box_06_vat", "VAT Return", "XML", "box_06_net <> 0", "Box 06 VAT is required when box 06 net is filled."),
  mandatory("2106", "commodity_code", "Intrastat Dispatches", "TXT", "", "Every dispatch line needs a CN8 commodity code."),
  mandatory("2107", "vat_nr_supplier_customer", "Intrastat Dispatches", "TXT", "country_arrival_dispatch_iso_code <> 'HU'", "A partner VAT number is required for intra-EU dispatches."),
  mandatory("2108", "net_mass", "Intrastat Dispatches", "TXT", "supplementary_units IS NULL", "Net mass is required where the commodity has no supplementary unit."),
  mandatory("2109", "invoiced_value", "Intrastat Dispatches", "TXT", "", "Every dispatch line needs an invoiced value."),
];

/* ── Dropdown fields ────────────────────────────────────────────────────── */

export const DROPDOWN_COLUMNS = [
  "id",
  "field_name",
  "value",
  "label",
  "label_local_language",
  "position_nr",
  "is_default",
] as const;

function option(
  id: string,
  field_name: string,
  value: string,
  label: string,
  label_local_language: string,
  position_nr: string,
  is_default = false,
): SheetRow {
  return {
    id,
    field_name,
    value,
    label,
    label_local_language,
    position_nr,
    is_default: is_default ? "TRUE" : "FALSE",
  };
}

export const DROPDOWN_FIELDS: SheetRow[] = [
  option("3101", "nature_of_transaction", "11", "Outright purchase or sale", "Végleges adásvétel", "1", true),
  option("3102", "nature_of_transaction", "12", "Supply for sale on approval or after trial", "Próbára vagy megtekintésre történő szállítás", "2"),
  option("3103", "nature_of_transaction", "21", "Return of goods", "Áruk visszaküldése", "3"),
  option("3104", "nature_of_transaction", "31", "Movement to or from a warehouse", "Raktárba vagy raktárból történő mozgatás", "4"),
  option("3105", "nature_of_transaction", "41", "Goods for processing under contract", "Bérmunka céljából történő szállítás", "5"),
  option("3106", "mode_of_transport", "1", "Sea transport", "Tengeri szállítás", "1"),
  option("3107", "mode_of_transport", "2", "Rail transport", "Vasúti szállítás", "2"),
  option("3108", "mode_of_transport", "3", "Road transport", "Közúti szállítás", "3", true),
  option("3109", "mode_of_transport", "4", "Air transport", "Légi szállítás", "4"),
  option("3110", "mode_of_transport", "5", "Postal consignment", "Postai küldemény", "5"),
  option("3111", "mode_of_transport", "8", "Inland waterway transport", "Belvízi szállítás", "6"),
  option("3112", "delivery_terms", "EXW", "Ex works", "Gyárban átadva", "1"),
  option("3113", "delivery_terms", "FCA", "Free carrier", "Fuvarozónak átadva", "2"),
  option("3114", "delivery_terms", "CPT", "Carriage paid to", "Fuvardíj fizetve", "3"),
  option("3115", "delivery_terms", "DAP", "Delivered at place", "Rendeltetési helyen átadva", "4", true),
  option("3116", "delivery_terms", "DDP", "Delivered duty paid", "Vámfizetéssel átadva", "5"),
];
