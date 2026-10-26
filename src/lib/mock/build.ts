import type { BuildArtifact, CrossFieldCheck, DryRun } from "../types";

/**
 * Generated from the datasets approved in step 3, using the same Belgian box
 * numbers (01/02/03 by rate, 46 intra-Community, 54 VAT due, 59 deductible).
 * One artifact carries a lint warning so the non-clean path is visible.
 */
export const BE_ARTIFACTS: BuildArtifact[] = [
  {
    id: "a-country",
    group: "schema",
    fileName: "001_country_config.sql",
    summary:
      "Registers Belgium with structured e-invoicing and a five-day transmission window.",
    sql: `INSERT INTO country_config (code, name, einvoice_enabled, einvoice_format)
VALUES ('BE', 'Belgium', TRUE, 'UBL-2.1');

INSERT INTO country_rules (country_code, rule, value)
VALUES ('BE', 'transmission_days', 5),
       ('BE', 'vies_validation', 1),
       ('BE', 'nil_return_required', 1);`,
    checks: [
      { label: "Lint", state: "pass", detail: "No issues" },
      {
        label: "Naming",
        state: "pass",
        detail: "Identifiers follow snake_case, matching the schema.",
        policy: {
          name: "Naming convention",
          detail:
            "Tables and columns use snake_case, so generated SQL reads the same as the hand-written schema and the two never drift apart.",
        },
      },
      { label: "Dry run", state: "pass", detail: "2 statements · 4 rows · rolled back" },
      { label: "References", state: "pass", detail: "All foreign keys resolve" },
    ],
  },
  {
    id: "a-returns",
    group: "schema",
    fileName: "002_return_types.sql",
    summary:
      "Creates the four obligations confirmed in scope, with their filing frequencies.",
    sql: `INSERT INTO return_types (country_code, code, name, frequency, deadline_day)
VALUES ('BE', 'BE-VAT',   'VAT Return',            'monthly',   20),
       ('BE', 'BE-ESL',   'EC Sales List',         'monthly',   20),
       ('BE', 'BE-ANNUAL','Annual client listing', 'annual',    90),
       ('BE', 'BE-SAFT',  'SAF-T',                 'on_demand', NULL)`,
    checks: [
      {
        label: "Lint",
        state: "warn",
        detail: "The final statement is not terminated with a semicolon.",
        line: 5,
        autoFix: { summary: "Add the missing semicolon" },
        policy: {
          name: "Statement termination",
          detail:
            "Every statement ends with a semicolon so the migration runner can split the file reliably. An unterminated final statement can run into the next file when the plan is applied.",
        },
      },
      { label: "Dry run", state: "pass", detail: "1 statement · 4 rows · rolled back" },
      { label: "References", state: "pass", detail: "country_code resolves to BE" },
    ],
  },
  {
    id: "a-boxes",
    group: "boxes",
    fileName: "010_boxes_vat_return.sql",
    summary:
      "Defines the boxes on the Belgian periodic return, with their data types.",
    sql: `INSERT INTO return_boxes (country_code, return_type, box, label, data_type, is_calculated)
VALUES ('BE', 'BE-VAT', '01', 'Sales at 6%',               'decimal', FALSE),
       ('BE', 'BE-VAT', '02', 'Sales at 12%',              'decimal', FALSE),
       ('BE', 'BE-VAT', '03', 'Sales at 21%',              'decimal', FALSE),
       ('BE', 'BE-VAT', '46', 'Intra-Community supplies',  'decimal', FALSE),
       ('BE', 'BE-VAT', '47', 'Exports outside the EU',    'decimal', FALSE),
       ('BE', 'BE-VAT', '54', 'VAT due on sales',          'decimal', TRUE),
       ('BE', 'BE-VAT', '59', 'Deductible VAT',            'decimal', FALSE),
       ('BE', 'BE-VAT', '71', 'VAT payable to the State',  'decimal', TRUE);`,
    checks: [
      { label: "Lint", state: "pass", detail: "No issues" },
      { label: "Dry run", state: "pass", detail: "1 statement · 8 rows · rolled back" },
      { label: "References", state: "pass", detail: "return_type BE-VAT exists" },
    ],
  },
  {
    id: "a-rules",
    group: "boxes",
    fileName: "011_sale_rules.sql",
    summary: "Maps each sale transaction type to its base and VAT box.",
    sql: `INSERT INTO sale_rules (country_code, transaction_type, rate, base_box, vat_box)
VALUES ('BE', 'domestic_standard', 21.0, '03', '54'),
       ('BE', 'domestic_reduced_6',  6.0, '01', '54'),
       ('BE', 'domestic_reduced_12',12.0, '02', '54'),
       ('BE', 'ic_supply',            0.0, '46', NULL),
       ('BE', 'export',               0.0, '47', NULL);`,
    checks: [
      { label: "Lint", state: "pass", detail: "No issues" },
      { label: "Dry run", state: "pass", detail: "1 statement · 5 rows · rolled back" },
      { label: "References", state: "pass", detail: "All box references exist" },
    ],
  },
  {
    id: "a-calc",
    group: "calculations",
    fileName: "020_calc_box_54.sql",
    summary:
      "Derives box 54 as the VAT on boxes 01, 02 and 03 at their respective rates.",
    sql: `UPDATE return_values v
SET box_54 = ROUND(
      COALESCE(v.box_01, 0) * 0.06
    + COALESCE(v.box_02, 0) * 0.12
    + COALESCE(v.box_03, 0) * 0.21, 2)
WHERE v.country_code = 'BE'
  AND v.return_type  = 'BE-VAT';`,
    checks: [
      { label: "Lint", state: "pass", detail: "No issues" },
      { label: "Dry run", state: "pass", detail: "1 statement · 0 rows · rolled back" },
      { label: "Rates", state: "pass", detail: "Matches the approved rate table" },
    ],
  },
  {
    id: "a-calc-net",
    group: "calculations",
    fileName: "021_calc_box_71.sql",
    summary:
      "Derives box 71, the net VAT payable to the State, as box 54 less the deductible VAT in box 59.",
    sql: `UPDATE return_values v
SET box_71 = GREATEST(
      ROUND(COALESCE(v.box_54, 0) - COALESCE(v.box_59, 0), 2), 0)
WHERE v.country_code = 'BE'
  AND v.return_type  = 'BE-VAT';`,
    checks: [
      { label: "Lint", state: "pass", detail: "No issues" },
      { label: "Dry run", state: "pass", detail: "1 statement · 0 rows · rolled back" },
      { label: "References", state: "pass", detail: "box_54 and box_59 exist" },
    ],
  },
];

export function artifactsFor(_countryCode: string): BuildArtifact[] {
  return BE_ARTIFACTS;
}

/**
 * The period the calculated boxes are reconciled against — a real filed return
 * carries more weight than synthetic values, so the check reads as evidence
 * rather than a unit test.
 */
export const BE_RECONCILE_PERIOD = "a sampled Q3 2025 return";

/**
 * Cross-field validation for Belgium. The first two identities reconcile; the
 * third is the quiet failure this step exists to catch — a correction box the
 * research implied but the approved schema never defined, so the identity
 * cannot be generated and the return would file with an unmapped adjustment.
 */
export const BE_CROSS_FIELD: CrossFieldCheck[] = [
  {
    id: "cf-54",
    box: "54",
    boxLabel: "VAT due on sales",
    identity: "0.06·B01 + 0.12·B02 + 0.21·B03",
    substituted: "0.06·€12,400.00 + 0.12·€3,000.00 + 0.21·€48,250.00",
    expected: "€11,236.50",
    actual: "€11,236.50",
    state: "ok",
  },
  {
    id: "cf-71",
    box: "71",
    boxLabel: "VAT payable to the State",
    identity: "B54 − B59",
    substituted: "€11,236.50 − €4,118.00",
    expected: "€7,118.50",
    actual: "€7,118.50",
    state: "ok",
  },
  {
    id: "cf-62",
    box: "62",
    boxLabel: "Adjustments in favour of the State",
    identity: "B54 + B62",
    substituted: "€11,236.50 + B62",
    expected: "€11,236.50 + B62",
    actual: null,
    state: "schema",
    note: "Box 62 is referenced by the correction rule but is not in the approved box set for BE-VAT, so the identity cannot be built.",
  },
];

export function crossFieldFor(_countryCode: string): CrossFieldCheck[] {
  return BE_CROSS_FIELD;
}

/**
 * The dry run's own evidence for Belgium: what the plan would write, how the
 * database would execute it, and what it would cost. Taken from the same
 * rolled-back run the step already describes — additive inserts plus two
 * calculated updates, so the shape is cheap and backward-compatible.
 *
 * The one thing worth a second look is the plan: the box-54 update reads
 * return_values by a sequential scan, because no index covers country_code yet.
 * Harmless at test volume; named here so it is a decision, not a surprise.
 */
export const BE_DRY_RUN: DryRun = {
  results: [
    {
      fileName: "002_return_types.sql",
      columns: ["country_code", "code", "name", "frequency", "deadline_day"],
      rows: [
        ["BE", "BE-VAT", "VAT Return", "monthly", "20"],
        ["BE", "BE-ESL", "EC Sales List", "monthly", "20"],
        ["BE", "BE-ANNUAL", "Annual client listing", "annual", "90"],
        ["BE", "BE-SAFT", "SAF-T", "on_demand", "—"],
      ],
      rowsAffected: 21,
      statements: 7,
    },
    {
      fileName: "010_boxes_vat_return.sql",
      columns: ["box", "label", "data_type", "is_calculated"],
      rows: [
        ["01", "Sales at 6%", "decimal", "false"],
        ["03", "Sales at 21%", "decimal", "false"],
        ["54", "VAT due on sales", "decimal", "true"],
        ["71", "VAT payable to the State", "decimal", "true"],
      ],
      rowsAffected: 21,
      statements: 7,
    },
  ],
  plan: [
    {
      op: "Insert",
      target: "return_types",
      scan: "none",
      detail: "4 rows · cost 0.00–0.04",
    },
    {
      op: "Insert",
      target: "return_boxes",
      scan: "none",
      detail: "8 rows · cost 0.00–0.08",
    },
    {
      op: "Update",
      target: "return_values (box 54)",
      scan: "none",
      detail: "writes box_54 for matched rows",
    },
    {
      op: "Seq Scan",
      target: "return_values",
      scan: "sequential",
      detail: "filter country_code = 'BE' · cost 0.00–18.40 · no index on country_code",
    },
    {
      op: "Index Scan",
      target: "return_values_pkey",
      scan: "index",
      detail: "box 71 update · cost 0.29–8.31 · 1 row",
    },
  ],
  performance: [
    {
      label: "Estimated lock time",
      value: "6 ms",
      ratio: 0.12,
      tone: "settled",
      note: "Well under the 50 ms threshold for a test apply.",
    },
    {
      label: "Memory footprint",
      value: "2.4 MB",
      ratio: 0.16,
      note: "Peak estimate across the plan's statements.",
    },
    {
      label: "Backward compatibility",
      value: "Full",
      ratio: 1,
      tone: "settled",
      note: "Additive only — no column dropped or renamed.",
    },
  ],
};

export function dryRunFor(_countryCode: string): DryRun {
  return BE_DRY_RUN;
}
