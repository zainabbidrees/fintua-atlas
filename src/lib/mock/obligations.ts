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
  article:
    "Intervat is the online platform through which periodic VAT returns are filed in Belgium. Every VAT-registered taxable person established in Belgium, and most non-established persons holding a Belgian VAT number, file through it.\n\nAccess is by electronic certificate or by the national eID. A business may file for itself or mandate an accountant or agent to file on its behalf, with the mandate recorded against its VAT number.\n\nThe return period is either a calendar month or a calendar quarter, according to the regime that applies to the taxable person. The period and the regime are fixed in advance, not chosen return by return.\n\nEach return reports the taxable transactions of the period and the VAT due or recoverable on them. The figures are entered in numbered grids, each of which maps to a category of transaction.\n\nA single deadline governs both the submission of the return and the payment of the VAT due for that period. Missing either has the same effect: the return is treated as late.\n\nPeriodic returns must be submitted no later than the 20th day of the month following the return period. Payment is due by the same date. Where the 20th falls on a Saturday, Sunday or public holiday, the deadline moves to the next working day.\n\nA payment is treated as made on the date the funds reach the administration's account, not the date of instruction, so a transfer ordered on the deadline may still arrive late.\n\nA special arrangement applies to the June and second-quarter returns, for which the administration publishes adjusted summer dates each year. The dates are announced before the period begins.\n\nA return filed or paid after the deadline attracts a fixed fine and interest on the amount due, both of which accrue from the day after the deadline.",
};

const GUIDE: Evidence = {
  sourceTitle: "VAT implementation guide 2026",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat/guide-2026",
  locator: "§ 12.3",
  quote:
    "Taxable persons whose annual turnover excluding VAT does not exceed EUR 2 500 000 may opt to submit quarterly returns.",
  article:
    "Chapter 12 of the implementation guide sets out the filing regimes open to VAT-registered businesses and the thresholds that decide which one applies. It is addressed to established taxable persons and to the advisers who file on their behalf.\n\nA filing regime fixes how often a business reports and pays its VAT, and the deadlines that follow from that frequency. The regime is not a matter of preference alone: it depends on turnover, on the sector in which the business operates, and in some cases on its compliance history.\n\nEvery taxable person is assigned a regime when first registered for VAT. The administration confirms the regime in writing, and any later change takes effect from the start of a return period rather than part-way through one.\n\nThe default is the monthly return. It applies to every taxable person unless an election for the quarterly regime has been made and accepted by the administration.\n\nThe monthly regime suits businesses that regularly recover more VAT than they owe, because it brings forward the moment a refund can be claimed. It also carries the shortest interval between a transaction and the return that reports it.\n\nThe quarterly regime reduces the number of periodic filings from twelve to four a year. It is available only below a turnover threshold, and the business must keep within the conditions for the whole of the period for which it is granted.\n\nTaxable persons whose annual turnover excluding VAT does not exceed EUR 2 500 000 may opt to submit quarterly returns. The option is excluded for certain sectors, including the supply of energy products and mobile telephony, where a lower threshold is set.\n\nA business that crosses the threshold during the year moves to the monthly regime from the first return period of the following quarter. The administration does not apply the change retroactively to periods already filed.\n\nWhere a business is uncertain which regime applies to it, it should file monthly until the position is confirmed, since a missed monthly return carries the same penalty whether or not a quarterly option was in fact available.",
};

const RATES: Evidence = {
  sourceTitle: "VAT rates in Belgium",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat/vat-rates",
  locator: "Table 1",
  quote:
    "The standard rate of VAT is 21 %. Reduced rates of 6 % and 12 % apply to the categories of goods and services listed in Royal Decree No 20.",
  article:
    "Belgium applies one standard rate and two reduced rates of VAT. The rates, and the goods and services they cover, are fixed by Royal Decree and reviewed periodically.\n\nThe rate that applies to a supply is a property of what is supplied, not of who supplies it. The same good carries the same rate whether sold by a manufacturer, a wholesaler or a retailer.\n\nFor a configured return this matters because each rate maps to its own grids. A rate applied in error therefore places the taxable amount in the wrong box, and the error is not visible in the totals.\n\nThe standard rate is the default. A supply carries it unless it is specifically listed, by category, as taking a reduced rate or as exempt.\n\nThe reduced rates are the exception, and the list of what they cover is exhaustive rather than illustrative. A category that is not on the list takes the standard rate even where a lower rate might seem to fit its purpose.\n\nThe categories are revised from time to time, and a supply may move between rates when the decree is amended. The rate in force on the date of the chargeable event is the one that applies.\n\nThe standard rate of VAT is 21 %. Reduced rates of 6 % and 12 % apply to the categories of goods and services listed in Royal Decree No 20. The 6 % rate covers most food, water, books and passenger transport; the 12 % rate covers restaurant and catering services and certain social housing.\n\nA zero rate applies to intra-Community supplies and exports, which are exempt with the right to deduct. These are reported in their own grids, separately from domestic supplies.\n\nSupplies that fall under a reverse-charge mechanism are reported by the supplier without VAT, because the customer accounts for the tax. The rate is still recorded, since it governs the amount the customer must self-assess.",
};

const DIRECTIVE: Evidence = {
  sourceTitle: "EU VAT Directive 2006/112/EC",
  publisher: "European Union",
  url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0112",
  locator: "Art. 262",
  quote:
    "Every taxable person identified for VAT purposes shall submit a recapitulative statement of the acquirers identified for VAT purposes to whom he has supplied goods.",
  article:
    "Title XI of the VAT Directive governs the obligations of taxable persons, among them the recapitulative statement used to report intra-Community supplies.\n\nThe statement is the mechanism by which an exempt cross-border supply in one Member State is matched to a taxed acquisition in another. Without it the common system of VAT could not track goods that move between states free of tax.\n\nIt is a reporting obligation, not a payment one: no VAT is due with the statement itself. The tax arises in the Member State of the acquirer, who declares it on their own return.\n\nEach Member State implements the obligation in its own return, collected from its own taxable persons. In Belgium this is the EC Sales List, filed through Intervat alongside the periodic return.\n\nArticle 262 defines who must file the statement and what it must contain. It is the provision the national lists are built on, and the reference against which their fields are checked.\n\nEvery taxable person identified for VAT purposes shall submit a recapitulative statement of the acquirers identified for VAT purposes to whom he has supplied goods. The statement also covers supplies of services on which the customer accounts for the tax under the reverse charge.\n\nEach line carries the acquirer's VAT identification number, the total value of the supplies to that acquirer for the period, and a code for the nature of the transaction.\n\nThe statement is filed for each calendar month, though Member States may permit quarterly filing below the thresholds set out in Article 263.\n\nAn error in an acquirer's number, or an omitted line, surfaces as a mismatch in the other Member State, which is why the list is validated against VIES before it is submitted.",
};

const LISTING: Evidence = {
  sourceTitle: "Annual client listing",
  publisher: "Belgian Federal Public Service Finance",
  url: "https://finances.belgium.be/en/enterprises/vat/annual-client-listing",
  locator: "Filing calendar",
  quote:
    "The listing of Belgian customers holding a VAT identification number must be filed by 31 March of the year following the calendar year to which it relates.",
  article:
    "The annual client listing is a yearly return of the Belgian VAT-registered customers a business has supplied with goods or services during the calendar year.\n\nIt is a control document. The administration cross-checks the listings filed by suppliers against the returns filed by their customers, so a sale reported by one party should appear as a purchase for the other.\n\nIt reports, per customer, the total taxable amount and the VAT charged over the year, above a de minimis threshold set per customer. Occasional or very small customers fall below it and are left out.\n\nOnly customers holding a Belgian VAT identification number are listed. Private individuals, and customers identified in another Member State, are excluded; the latter are covered by the recapitulative statement instead.\n\nThe listing is annual, not periodic. It summarises a full calendar year in a single return, drawn from the same records that fed the periodic returns across that year.\n\nThe listing of Belgian customers holding a VAT identification number must be filed by 31 March of the year following the calendar year to which it relates. A nil listing is required even where there were no qualifying customers.\n\nA business that ceases activity during the year files early, within three months of ending its VAT-liable operations, rather than waiting for the following March.\n\nThe listing is submitted through Intervat, in the same environment as the periodic return, and may be corrected by filing a replacement for the year.",
};

const COMMENTARY: Evidence = {
  sourceTitle: "Belgian SAF-T: anticipated requirements",
  publisher: "Vandeputte & Partners (commentary)",
  url: "https://example-accountancy.be/blog/saf-t",
  quote:
    "A Belgian SAF-T schema has been discussed but no implementing decree has been published at the time of writing.",
  article:
    "This note summarises the current state of SAF-T (Standard Audit File for Tax) in Belgium, drawing on administrative consultations and sector briefings rather than enacted law.\n\nSAF-T is a standardised export of a business's accounting and tax records, in a defined electronic format, that a tax authority can request in place of ad hoc extracts. Its purpose is to make audit data portable and machine-readable.\n\nSeveral Member States now require such a file, either on request during an audit or on a periodic basis. The formats differ, but all derive from the same OECD schema.\n\nBelgium has signalled an intention to move in the same direction, in the context of a wider shift towards electronic invoicing and near-real-time reporting. The signals are consistent but have not hardened into a rule.\n\nNo draft schema specific to Belgium has been placed in public consultation, and no transition period has been announced. Any timetable circulating in the market is an estimate, not an official date.\n\nA Belgian SAF-T schema has been discussed but no implementing decree has been published at the time of writing. Businesses should treat any obligation as anticipated rather than current, and should not configure a submission until a decree sets the format and scope.\n\nWhat can be done now is preparation: keeping ledgers in a structure that maps cleanly to the OECD fields, so that adoption is a mapping exercise rather than a rebuild.\n\nThe above is the view of the authors and is not a statement of the tax authority's position. It should not be relied on as a basis for filing.",
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

const LISTING_FINDINGS: Finding[] = [
  {
    id: "be-annual-freq",
    group: "filing",
    label: "Filing frequency",
    value: "Annual",
    evidence: LISTING,
    state: "corroborated",
  },
  {
    id: "be-annual-deadline",
    group: "filing",
    label: "Filing deadline",
    value: "31 March",
    detail: "For the preceding calendar year",
    evidence: LISTING,
    state: "corroborated",
  },
  {
    id: "be-annual-channel",
    group: "filing",
    label: "Submission channel",
    value: "Intervat — XML upload",
    evidence: INTERVAT,
    state: "corroborated",
  },
  {
    id: "be-annual-threshold",
    group: "rules",
    label: "Reporting threshold",
    value: "EUR 250 per customer per year",
    detail: "Customers below the threshold are left out of the listing",
    evidence: LISTING,
    state: "corroborated",
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
    agent: "ready",
    progress: 100,
    findings: ESL_FINDINGS,
  },
  {
    id: "be-annual",
    name: "Annual client listing",
    localName: "Jaarlijkse klantenlisting",
    agent: "ready",
    progress: 100,
    findings: LISTING_FINDINGS,
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

/**
 * What an obligation's agent returns once it finishes.
 *
 * The mock starts one obligation mid-research so the parallel case is visible;
 * this is what it lands on, so the run actually completes instead of spinning.
 */
export function completedFindingsFor(obligationId: string): Finding[] {
  return obligationId === "be-annual" ? LISTING_FINDINGS : [];
}
