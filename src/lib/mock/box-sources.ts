/**
 * Where a box's calculation and its rounding rule came from.
 *
 * Two cells in the field map are not transcribed from the return form — they are
 * decisions the agent made from a source: the SQL that fills a calculated box,
 * and whether a box is rounded. So each carries the passage it rests on, read
 * back through the same passage drawer the returns step uses: the document, its
 * exact locator, and the verbatim wording, so a specialist confirms the rule
 * against the source rather than taking it on trust.
 *
 * Keyed by box_name, with an entry only for the columns a source was captured
 * for. Hungary's fixtures only — the one jurisdiction with full data.
 */

import type { Evidence } from "@/lib/types";

/** The columns a box can carry a source for. */
export type SourcedColumn = "calculation" | "is_rounded";

/* The KSH Intrastat guide stands behind the one calculated box and its rounding.
   A PDF from the authority, so the drawer leads with the file, not a favicon. */
const KSH_INTRASTAT_URL =
  "https://www.ksh.hu/docs/intrastat/intrastat_kitoltesi_utmutato_2023.pdf";
const KSH_PUBLISHER = "Központi Statisztikai Hivatal (KSH)";

/* The NAV return-completion guide stands behind the VAT boxes' rounding; they
   share one rule, so they share one citation. A page on the authority's site. */
const NAV_VAT_ROUNDING: Evidence = {
  sourceTitle: "ÁFA return — completion guide, general rules",
  publisher: "Nemzeti Adó- és Vámhivatal (NAV)",
  url: "https://nav.gov.hu/ado/afa/afa_bevallas_kitoltesi_utmutato",
  locator: "General instructions — Rounding of amounts",
  quote:
    "The amounts of the return must be stated in whole forints, rounded to the nearest whole number under the general rounding rule.",
  article: [
    "Amounts are entered in forints. Where a figure results from a calculation and is not a whole number, it is rounded before it is entered in the return.",
    "The amounts of the return must be stated in whole forints, rounded to the nearest whole number under the general rounding rule. A fraction of 50 fillér or more is rounded up; a smaller fraction is dropped.",
    "The same treatment applies to every amount field of the return, so that the net and VAT figures in the summary reconcile.",
  ].join("\n\n"),
};

export const BOX_SOURCES: Record<string, Partial<Record<SourcedColumn, Evidence>>> = {
  list_dispatches: {
    calculation: {
      sourceTitle: "Intrastat dispatches — questionnaire completion guide",
      publisher: KSH_PUBLISHER,
      url: KSH_INTRASTAT_URL,
      locator: "Section 4 — Invoiced value",
      quote:
        "The invoiced value to report is the sum of the invoiced amounts of the individual goods items, aggregated per commodity code.",
      article: [
        "Field 4 of the dispatch declaration carries the invoiced value of the goods. It is taken from the commercial invoice, excluding VAT and excise duty.",
        "The invoiced value to report is the sum of the invoiced amounts of the individual goods items, aggregated per commodity code. Where several consignments share a commodity code within the reference period, their values are added together.",
        "The aggregated figure is reported against the commodity code, the country of destination and the nature of the transaction, as set out in the following sections.",
      ].join("\n\n"),
    },
    is_rounded: {
      sourceTitle: "Intrastat dispatches — questionnaire completion guide",
      publisher: KSH_PUBLISHER,
      url: KSH_INTRASTAT_URL,
      locator: "Section 4 — Rounding of values",
      quote:
        "Values are reported in whole units; the amount is rounded to the nearest whole number and no decimal places are given.",
      article: [
        "The invoiced value and the statistical value are both monetary fields. They are reported in forints.",
        "Values are reported in whole units; the amount is rounded to the nearest whole number and no decimal places are given. A value below one unit is reported as the nearest whole number, never as zero where goods actually moved.",
        "Net mass, by contrast, is reported to three decimal places — rounding differs field by field, so the rule is given with each field rather than once for the form.",
      ].join("\n\n"),
    },
  },
  box_01: { is_rounded: NAV_VAT_ROUNDING },
  box_02: { is_rounded: NAV_VAT_ROUNDING },
  box_03: { is_rounded: NAV_VAT_ROUNDING },
  box_04: { is_rounded: NAV_VAT_ROUNDING },
  box_05_net: { is_rounded: NAV_VAT_ROUNDING },
  box_05_vat: { is_rounded: NAV_VAT_ROUNDING },
  box_06_net: { is_rounded: NAV_VAT_ROUNDING },
  box_06_vat: { is_rounded: NAV_VAT_ROUNDING },
  box_07_net: { is_rounded: NAV_VAT_ROUNDING },
};
