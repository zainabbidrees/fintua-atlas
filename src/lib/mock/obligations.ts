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

/* A return type can be filed on more than one schedule — a monthly default
   and a quarterly option below a threshold — each with its own deadline. Each
   schedule's frequency and deadline share a `schedule` key, and the table
   gives every schedule its own row. */
const VAT_RETURN_FINDINGS: Finding[] = [
  {
    id: "be-vat-freq",
    group: "filing",
    role: "frequency",
    schedule: "monthly",
    label: "Filing frequency",
    value: "Monthly",
    detail: "The default regime for every VAT-registered business",
    evidence: GUIDE,
    state: "corroborated",
  },
  {
    id: "be-vat-deadline",
    group: "filing",
    role: "deadline",
    schedule: "monthly",
    label: "Filing deadline",
    value: "EOP + 20 days",
    detail: "The 20th of the month after the period. Payment is due the same date, through Intervat",
    evidence: INTERVAT,
    nonWorkingDay: "next",
    workdaysOnly: false,
    state: "corroborated",
  },
  {
    id: "be-vat-freq-q",
    group: "filing",
    role: "frequency",
    schedule: "quarterly",
    label: "Filing frequency",
    value: "Quarterly",
    detail: "Optional below €2,500,000 annual turnover",
    evidence: GUIDE,
    state: "corroborated",
  },
  {
    id: "be-vat-deadline-q",
    group: "filing",
    role: "deadline",
    schedule: "quarterly",
    label: "Filing deadline",
    value: "EOP + 20 days",
    detail: "The 20th of the month after the quarter. Payment is due the same date, through Intervat",
    evidence: INTERVAT,
    nonWorkingDay: "next",
    workdaysOnly: false,
    state: "corroborated",
  },
];

const ESL_FINDINGS: Finding[] = [
  {
    id: "be-esl-freq",
    group: "filing",
    role: "frequency",
    schedule: "monthly",
    label: "Filing frequency",
    value: "Monthly",
    detail: "Where intra-Community supplies exceed €50,000 a quarter",
    evidence: DIRECTIVE,
    state: "corroborated",
  },
  {
    id: "be-esl-deadline",
    group: "filing",
    role: "deadline",
    schedule: "monthly",
    label: "Filing deadline",
    value: "EOP + 20 days",
    detail: "The 20th of the month after the period, filed through Intervat",
    evidence: INTERVAT,
    nonWorkingDay: "next",
    workdaysOnly: false,
    state: "corroborated",
  },
  {
    id: "be-esl-freq-q",
    group: "filing",
    role: "frequency",
    schedule: "quarterly",
    label: "Filing frequency",
    value: "Quarterly",
    detail: "Where intra-Community supplies stay below €50,000 a quarter",
    evidence: DIRECTIVE,
    state: "corroborated",
  },
  {
    id: "be-esl-deadline-q",
    group: "filing",
    role: "deadline",
    schedule: "quarterly",
    label: "Filing deadline",
    value: "EOP + 20 days",
    detail: "The 20th of the month after the quarter, filed through Intervat",
    evidence: INTERVAT,
    nonWorkingDay: "next",
    workdaysOnly: false,
    state: "corroborated",
  },
];

const SAFT_FINDINGS: Finding[] = [
  {
    id: "be-saft-freq",
    group: "filing",
    role: "frequency",
    label: "Filing frequency",
    value: "Not established",
    detail: "Produced on request by the tax authority, if adopted at all",
    evidence: COMMENTARY,
    state: "needs_review",
    concern:
      "Identified only in secondary commentary from 2019, with nothing from the tax authority to confirm it. Applicability to Belgium is unconfirmed.",
  },
];

const LISTING_FINDINGS: Finding[] = [
  {
    id: "be-annual-freq",
    group: "filing",
    role: "frequency",
    label: "Filing frequency",
    value: "Annually",
    evidence: LISTING,
    state: "corroborated",
  },
  {
    id: "be-annual-deadline",
    group: "filing",
    role: "deadline",
    label: "Filing deadline",
    value: "EOP + 90 days",
    detail: "31 March for the preceding calendar year, filed through Intervat",
    evidence: LISTING,
    nonWorkingDay: "next",
    workdaysOnly: false,
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
