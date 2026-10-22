import type { Evidence, Finding, ObligationRun } from "../types";

/**
 * Belgian VAT detail, as the research agent would return it.
 *
 * Deliberately mixed: most findings corroborated, a few genuinely thin, one
 * obligation still running. Without that mix the review UI can't be judged —
 * a screen where everything is already settled proves nothing.
 */

const INTERVAT: Evidence = {
  sourceTitle: "VAT filing portal",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat",
  locator: "Filing calendar",
  quote:
    "Periodic returns must be submitted no later than the 20th day of the month following the return period. Payment is due by the same date.",
};

const GUIDE: Evidence = {
  sourceTitle: "VAT implementation guide 2026",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat/guide-2026",
  locator: "§ 12.3",
  quote:
    "Taxable persons whose annual turnover excluding VAT does not exceed EUR 2 500 000 may opt to submit quarterly returns.",
};

const RATES: Evidence = {
  sourceTitle: "VAT rates in Belgium",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat/vat-rates",
  locator: "Table 1",
  quote:
    "The standard rate of VAT is 21 %. Reduced rates of 6 % and 12 % apply to the categories of goods and services listed in Royal Decree No 20.",
};

const DIRECTIVE: Evidence = {
  sourceTitle: "EU VAT Directive 2006/112/EC",
  publisher: "European Union",
  url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0112",
  locator: "Art. 262",
  quote:
    "Every taxable person identified for VAT purposes shall submit a recapitulative statement of the acquirers identified for VAT purposes to whom he has supplied goods.",
};

const COMMENTARY: Evidence = {
  sourceTitle: "Belgian SAF-T: anticipated requirements",
  publisher: "Vandeputte & Partners (commentary)",
  url: "https://example-accountancy.be/blog/saf-t",
  quote:
    "A Belgian SAF-T schema has been discussed but no implementing decree has been published at the time of writing.",
};

const VAT_RETURN_FINDINGS: Finding[] = [
  {
    id: "be-vat-freq",
    group: "filing",
    label: "Filing frequency",
    value: "Monthly",
    detail: "Quarterly permitted below €2,500,000 annual turnover",
    evidence: GUIDE,
    state: "corroborated",
  },
  {
    id: "be-vat-deadline",
    group: "filing",
    label: "Filing deadline",
    value: "20th of the following month",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-vat-payment",
    group: "filing",
    label: "Payment deadline",
    value: "20th of the following month",
    detail: "Same date as filing",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-vat-channel",
    group: "filing",
    label: "Submission channel",
    value: "Intervat — XML upload",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-vat-standard",
    group: "rates",
    label: "Standard rate",
    value: "21%",
    evidence: RATES,
    state: "corroborated",
  },
  {
    id: "be-vat-reduced",
    group: "rates",
    label: "Reduced rates",
    value: "6% and 12%",
    evidence: RATES,
    state: "needs_review",
    concern:
      "The source lists both rates but defers the category mapping to Royal Decree No 20, which was not retrieved. Which supplies fall under 6% versus 12% is unresolved.",
  },
  {
    id: "be-vat-nil",
    group: "rules",
    label: "Nil return",
    value: "Required",
    detail: "A return is due even where no transactions occurred",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-vat-correction",
    group: "rules",
    label: "Correction mechanism",
    value: "Adjustment in the next periodic return",
    evidence: GUIDE,
    state: "needs_review",
    concern:
      "Only one source addresses corrections, and it does not distinguish between adjustments below the tolerance threshold and those requiring a corrective filing.",
  },
];

const ESL_FINDINGS: Finding[] = [
  {
    id: "be-esl-freq",
    group: "filing",
    label: "Filing frequency",
    value: "Monthly",
    detail: "Quarterly where intra-Community supplies stay below €50,000",
    evidence: DIRECTIVE,
    state: "corroborated",
  },
  {
    id: "be-esl-deadline",
    group: "filing",
    label: "Filing deadline",
    value: "20th of the following month",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-esl-channel",
    group: "filing",
    label: "Submission channel",
    value: "Intervat — XML upload",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-esl-nil",
    group: "rules",
    label: "Nil return",
    value: "Not required",
    detail: "No statement is due for periods without intra-Community supplies",
    evidence: DIRECTIVE,
    state: "corroborated",
  },
];

const SAFT_FINDINGS: Finding[] = [
  {
    id: "be-saft-trigger",
    group: "rules",
    label: "When produced",
    value: "On request by the tax authority",
    evidence: COMMENTARY,
    state: "needs_review",
    concern:
      "Sourced only from secondary commentary dated 2019. No implementing decree was found, so whether this obligation exists at all is unconfirmed.",
  },
  {
    id: "be-saft-format",
    group: "rules",
    label: "Format",
    value: "SAF-T XML",
    evidence: COMMENTARY,
    state: "needs_review",
    concern: "No published schema was retrieved. The version is unknown.",
  },
];

export const BE_OBLIGATIONS: ObligationRun[] = [
  {
    id: "be-vat",
    name: "VAT Return",
    localName: "Aangifte btw",
    agent: "ready",
    progress: 100,
    findings: VAT_RETURN_FINDINGS,
  },
  {
    id: "be-esl",
    name: "EC Sales List",
    localName: "Intracommunautaire opgave",
    agent: "confirmed",
    progress: 100,
    findings: ESL_FINDINGS.map((f) => ({ ...f, state: "confirmed" as const })),
  },
  {
    id: "be-annual",
    name: "Annual client listing",
    localName: "Jaarlijkse klantenlisting",
    agent: "running",
    progress: 42,
    findings: [],
  },
  {
    id: "be-saft",
    name: "SAF-T",
    localName: null,
    agent: "ready",
    progress: 100,
    findings: SAFT_FINDINGS,
  },
];

export function obligationsFor(countryCode: string): ObligationRun[] {
  // One jurisdiction is modelled in detail; the rest reuse its shape.
  return countryCode === "BE"
    ? BE_OBLIGATIONS
    : BE_OBLIGATIONS.map((o) => ({ ...o, localName: null }));
}
