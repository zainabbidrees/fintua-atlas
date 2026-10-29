import type { FormEdition, FormGrid, FormPage, FormRetrieval } from "../types";
import { obligationsFor } from "./obligations";

/**
 * The official return forms the retrieval agent would bring back for Belgium.
 *
 * Stand-ins for the real PDFs, drawn from the grids each form carries so the
 * page review has something faithful to render. The form's own words are in
 * French, as the publisher prints them; they are fixture data, not app copy.
 *
 * One return type per state, so every path on the step is clickable: the VAT
 * Return is found, the EC Sales List comes back in two editions that disagree,
 * the annual listing is still being retrieved, and nothing is published for
 * SAF-T.
 */

const FPS = "Belgian Federal Public Service Finance";
const RETRIEVED = "28 Oct 2026";

const grids = (rows: [string, string][]): FormGrid[] =>
  rows.map(([code, label]) => ({ code, label }));

const IDENTITY = [
  "Numéro d'entreprise",
  "Nom ou dénomination",
  "Adresse",
  "Période — mois ou trimestre",
  "Année",
];

/* ── VAT Return · form 625 ──────────────────────────────────────────────── */

const VAT_PAGES: FormPage[] = [
  {
    id: "vat-1",
    kind: "form",
    summary: "Identification · grids 00–03",
    note: "Holds the declarant's identification and the first outgoing grids. Mapped in the next step.",
    selected: true,
    blocks: [
      {
        kind: "masthead",
        title: "Déclaration périodique à la TVA",
        subtitle: "SPF Finances · Administration générale de la Fiscalité",
        reference: "625",
      },
      { kind: "identity", fields: IDENTITY },
      {
        kind: "frame",
        title: "II. Opérations à la sortie",
        grids: grids([
          ["00", "Opérations soumises à un régime particulier"],
          ["01", "Opérations pour lesquelles la TVA est due par le déclarant — 6 %"],
          ["02", "Opérations pour lesquelles la TVA est due par le déclarant — 12 %"],
          ["03", "Opérations pour lesquelles la TVA est due par le déclarant — 21 %"],
        ]),
      },
    ],
  },
  {
    id: "vat-2",
    kind: "form",
    summary: "Grids 44–49 · 81–83",
    note: "Exempt and reverse-charge outgoing supplies, and the first incoming grids. Mapped in the next step.",
    selected: true,
    blocks: [
      {
        kind: "frame",
        title: "II. Opérations à la sortie (suite)",
        grids: grids([
          ["44", "Services pour lesquels la TVA étrangère est due par le cocontractant"],
          ["45", "Opérations pour lesquelles la TVA est due par le cocontractant"],
          ["46", "Livraisons intracommunautaires exemptées"],
          ["47", "Autres opérations exemptées et opérations effectuées à l'étranger"],
          ["48", "Notes de crédit relatives aux opérations des grilles 44 et 46"],
          ["49", "Notes de crédit relatives aux autres opérations"],
        ]),
      },
      {
        kind: "frame",
        title: "III. Opérations à l'entrée",
        grids: grids([
          ["81", "Marchandises, matières premières et matières auxiliaires"],
          ["82", "Services et biens divers"],
          ["83", "Biens d'investissement"],
        ]),
      },
    ],
  },
  {
    id: "vat-3",
    kind: "form",
    summary: "Grids 84–88 · 54–63",
    note: "Intra-Community acquisitions and the VAT due. Mapped in the next step.",
    selected: true,
    blocks: [
      {
        kind: "frame",
        title: "III. Opérations à l'entrée (suite)",
        grids: grids([
          ["84", "Notes de crédit relatives aux opérations des grilles 86 et 88"],
          ["85", "Notes de crédit relatives aux autres opérations"],
          ["86", "Acquisitions intracommunautaires de biens"],
          ["87", "Autres opérations à l'entrée pour lesquelles la TVA est due"],
          ["88", "Services intracommunautaires avec report de perception"],
        ]),
      },
      {
        kind: "frame",
        title: "IV. Taxes dues",
        grids: grids([
          ["54", "TVA relative aux opérations des grilles 01, 02 et 03"],
          ["55", "TVA relative aux opérations des grilles 86 et 88"],
          ["56", "TVA relative aux opérations de la grille 87"],
          ["57", "TVA relative aux importations avec report de perception"],
          ["61", "Diverses régularisations en faveur de l'État"],
          ["63", "TVA à reverser mentionnée sur les notes de crédit reçues"],
        ]),
      },
    ],
  },
  {
    id: "vat-4",
    kind: "form",
    summary: "Grids 59–72 · 91 · signature",
    note: "Deductible VAT, the balance and the December advance. Mapped in the next step.",
    selected: true,
    blocks: [
      {
        kind: "frame",
        title: "V. Taxes déductibles",
        grids: grids([
          ["59", "Taxes déductibles"],
          ["62", "Diverses régularisations en faveur du déclarant"],
          ["64", "TVA à récupérer mentionnée sur les notes de crédit délivrées"],
        ]),
      },
      {
        kind: "frame",
        title: "VI. Solde",
        grids: grids([
          ["71", "Taxe due à l'État"],
          ["72", "Sommes dues par l'État"],
        ]),
      },
      {
        kind: "frame",
        title: "VII. Acompte",
        grids: grids([["91", "TVA réellement due pour la période du 1er au 20 décembre"]]),
      },
      { kind: "signature", label: "Date et signature du déclarant ou de son mandataire" },
    ],
  },
  {
    id: "vat-5",
    kind: "instructions",
    summary: "Explanatory notes, part 1",
    note: "Explanatory notes with no grids to map. Left unticked; tick it to keep the notes with the form.",
    selected: false,
    blocks: [
      {
        kind: "prose",
        title: "Notice explicative — cadres I et II",
        paragraphs: [
          "Le cadre I reprend l'identification du déclarant telle qu'elle figure au registre. Toute modification doit être communiquée préalablement au bureau de gestion compétent.",
          "La grille 00 comprend les opérations soumises au régime particulier de la marge bénéficiaire, ainsi que les opérations des agences de voyages.",
          "Les grilles 01 à 03 reprennent la base d'imposition des opérations pour lesquelles la taxe est due par le déclarant, ventilée selon le taux applicable.",
          "La grille 44 reprend les services visés à l'article 21, § 2, du Code, pour lesquels la taxe est due par le preneur établi dans un autre État membre.",
          "La grille 46 reprend les livraisons intracommunautaires exemptées, lesquelles doivent également figurer au relevé intracommunautaire de la même période.",
        ],
      },
    ],
  },
  {
    id: "vat-6",
    kind: "instructions",
    summary: "Explanatory notes, part 2",
    note: "Explanatory notes with no grids to map. Left unticked; tick it to keep the notes with the form.",
    selected: false,
    blocks: [
      {
        kind: "prose",
        title: "Notice explicative — cadres III à VII",
        paragraphs: [
          "Les grilles 81 à 83 reprennent le montant, hors taxe, des achats de biens et de services, quel que soit le régime de taxation qui leur est applicable.",
          "La grille 59 reprend le montant total des taxes déductibles, y compris la taxe relative aux opérations des grilles 86, 87 et 88.",
          "Le solde est porté en grille 71 lorsqu'il est en faveur de l'État, et en grille 72 lorsqu'il est en faveur du déclarant.",
          "La grille 91 n'est complétée que dans la déclaration du mois de décembre, par les assujettis soumis au régime mensuel.",
          "La déclaration est déposée par voie électronique au plus tard le 20e jour du mois qui suit la période à laquelle elle se rapporte.",
        ],
      },
    ],
  },
];

const VAT_EDITION: FormEdition = {
  id: "vat-625-2026",
  title: "Déclaration périodique à la TVA",
  reference: "Form 625",
  publisher: FPS,
  url: "https://finances.belgium.be/fr/entreprises/tva/declaration/declaration-periodique",
  edition: "January 2026",
  retrieved: RETRIEVED,
  pages: VAT_PAGES,
};

/* ── EC Sales List · form 723, in two editions ──────────────────────────── */

const ESL_COLUMNS_2026 = ["N° TVA du client", "Code pays", "Montant", "Code L / T / S"];
const ESL_COLUMNS_2020 = ["N° TVA du client", "Code pays", "Montant", "Code L / S"];

const ESL_2026: FormEdition = {
  id: "esl-723-2026",
  title: "Relevé des opérations intracommunautaires",
  reference: "Form 723",
  publisher: `${FPS} · Intervat`,
  url: "https://finances.belgium.be/fr/entreprises/tva/declaration/releve-intracommunautaire",
  edition: "January 2026",
  retrieved: RETRIEVED,
  difference:
    "Carries code T for triangular trade, and is the edition Intervat currently accepts. Three pages.",
  pages: [
    {
      id: "esl26-1",
      kind: "form",
      summary: "Identification · first 12 lines",
      note: "Holds the listing's columns, including code T for triangular trade. Mapped in the next step.",
      selected: true,
      blocks: [
        {
          kind: "masthead",
          title: "Relevé des opérations intracommunautaires",
          subtitle: "SPF Finances · Intervat",
          reference: "723",
        },
        { kind: "identity", fields: IDENTITY },
        { kind: "table", title: "Opérations de la période", columns: ESL_COLUMNS_2026, rows: 12 },
      ],
    },
    {
      id: "esl26-2",
      kind: "continuation",
      summary: "Continuation sheet",
      note: "Repeats page 1's columns for longer listings. Ticked so the layout is kept; nothing new to map.",
      selected: true,
      blocks: [
        { kind: "table", title: "Opérations de la période (suite)", columns: ESL_COLUMNS_2026, rows: 24 },
        { kind: "signature", label: "Date et signature" },
      ],
    },
    {
      id: "esl26-3",
      kind: "instructions",
      summary: "Explanatory notes",
      note: "Explanatory notes with no fields to map. Left unticked; tick it to keep the notes with the form.",
      selected: false,
      blocks: [
        {
          kind: "prose",
          title: "Notice explicative",
          paragraphs: [
            "Le relevé reprend, par client, le montant total des livraisons intracommunautaires de biens et des services visés à l'article 21, § 2, du Code.",
            "Le code L vise les livraisons de biens, le code T les opérations triangulaires, et le code S les prestations de services.",
            "Le numéro d'identification du client est vérifié dans le système VIES avant le dépôt du relevé.",
            "Le relevé est déposé au plus tard le 20e jour du mois qui suit la période à laquelle il se rapporte.",
          ],
        },
      ],
    },
  ],
};

const ESL_2020: FormEdition = {
  id: "esl-723-2020",
  title: "Relevé des opérations intracommunautaires",
  reference: "Form 723",
  publisher: `${FPS} · VAT implementation guide 2026, annex 4`,
  url: "https://finances.belgium.be/en/enterprises/vat/guide-2026#annex-4",
  edition: "March 2020",
  retrieved: RETRIEVED,
  difference:
    "Predates code T and says the listing is filed quarterly. Reproduced in the guide's annex, which has not been updated since. Two pages.",
  pages: [
    {
      id: "esl20-1",
      kind: "form",
      summary: "Identification · 16 lines",
      note: "Holds the listing's columns, without code T. Mapped in the next step.",
      selected: true,
      blocks: [
        {
          kind: "masthead",
          title: "Relevé des opérations intracommunautaires",
          subtitle: "SPF Finances",
          reference: "723",
        },
        { kind: "identity", fields: IDENTITY },
        { kind: "table", title: "Opérations de la période", columns: ESL_COLUMNS_2020, rows: 16 },
        { kind: "signature", label: "Date et signature" },
      ],
    },
    {
      id: "esl20-2",
      kind: "instructions",
      summary: "Explanatory notes",
      note: "Explanatory notes with no fields to map. Left unticked; tick it to keep the notes with the form.",
      selected: false,
      blocks: [
        {
          kind: "prose",
          title: "Notice explicative",
          paragraphs: [
            "Le relevé reprend, par client, le montant total des livraisons intracommunautaires de biens et des services visés à l'article 21, § 2, du Code.",
            "Le code L vise les livraisons de biens et le code S les prestations de services.",
            "Le relevé est déposé au plus tard le 20e jour du mois qui suit le trimestre auquel il se rapporte.",
          ],
        },
      ],
    },
  ],
};

/* ── Annual client listing · form 725 ───────────────────────────────────── */

const LISTING_COLUMNS = ["N° TVA du client", "Chiffre d'affaires hors TVA", "Montant de la TVA"];

export const LISTING_EDITION: FormEdition = {
  id: "listing-725-2026",
  title: "Listing annuel des clients assujettis",
  reference: "Form 725",
  publisher: FPS,
  url: "https://finances.belgium.be/fr/entreprises/tva/declaration/listing-annuel-clients",
  edition: "January 2026",
  retrieved: RETRIEVED,
  pages: [
    {
      id: "listing-1",
      kind: "form",
      summary: "Identification · first 10 clients",
      note: "Holds the listing's columns and the year's totals. Mapped in the next step.",
      selected: true,
      blocks: [
        {
          kind: "masthead",
          title: "Listing annuel des clients assujettis",
          subtitle: "SPF Finances · Intervat",
          reference: "725",
        },
        { kind: "identity", fields: ["Numéro d'entreprise", "Nom ou dénomination", "Adresse", "Année civile"] },
        { kind: "table", title: "Clients assujettis", columns: LISTING_COLUMNS, rows: 10 },
      ],
    },
    {
      id: "listing-2",
      kind: "continuation",
      summary: "Continuation sheet",
      note: "Repeats page 1's columns for longer listings. Ticked so the layout is kept; nothing new to map.",
      selected: true,
      blocks: [
        { kind: "table", title: "Clients assujettis (suite)", columns: LISTING_COLUMNS, rows: 24 },
        { kind: "signature", label: "Date et signature" },
      ],
    },
    {
      id: "listing-3",
      kind: "instructions",
      summary: "Explanatory notes",
      note: "Explanatory notes with no fields to map. Left unticked; tick it to keep the notes with the form.",
      selected: false,
      blocks: [
        {
          kind: "prose",
          title: "Notice explicative",
          paragraphs: [
            "Le listing reprend les clients identifiés à la TVA en Belgique auxquels des biens ou des services ont été fournis au cours de l'année civile.",
            "Un client n'est repris que lorsque le montant total des opérations effectuées à son égard dépasse 250 euros hors taxe.",
            "Le listing est déposé au plus tard le 31 mars de l'année qui suit l'année civile à laquelle il se rapporte, y compris lorsqu'il est négatif.",
          ],
        },
      ],
    },
  ],
};

/** What the annual listing's retrieval shows while it is still reading. */
export const LISTING_TRAIL = [
  "Opened finances.belgium.be › Listing annuel des clients",
  "Found the 2026 form and its explanatory notes",
  "Reading form 725, page by page",
];

const SAFT_NONE =
  "No official SAF-T form or schema is published for Belgium. The one source that mentions it describes the requirement as anticipated, with no implementing decree.";

const BE_FORMS: FormRetrieval[] = [
  {
    obligationId: "be-vat",
    obligationName: "VAT Return",
    localName: "Aangifte btw",
    state: "found",
    editions: [VAT_EDITION],
  },
  {
    obligationId: "be-esl",
    obligationName: "EC Sales List",
    localName: "Intracommunautaire opgave",
    state: "clash",
    editions: [ESL_2026, ESL_2020],
  },
  {
    obligationId: "be-annual",
    obligationName: "Annual client listing",
    localName: "Jaarlijkse klantenlisting",
    state: "retrieving",
    editions: [],
    trail: LISTING_TRAIL,
  },
  {
    obligationId: "be-saft",
    obligationName: "SAF-T",
    localName: null,
    state: "none",
    editions: [],
    noneDetail: SAFT_NONE,
  },
];

/** The retrieval each return type carried in from step two starts from. */
export function formsFor(countryCode: string): FormRetrieval[] {
  // One jurisdiction is modelled in detail; the rest reuse its shape, keyed to
  // whatever return types that country carried in.
  const carried = new Set(obligationsFor(countryCode).map((o) => o.id));
  return BE_FORMS.filter((f) => carried.has(f.obligationId)).map((f) =>
    countryCode === "BE" ? f : { ...f, localName: null },
  );
}

/** What a retrieval lands on once it finishes — a retry of SAF-T still finds nothing. */
export function completedRetrievalFor(obligationId: string): Pick<FormRetrieval, "state" | "editions" | "noneDetail"> {
  return obligationId === "be-annual"
    ? { state: "found", editions: [LISTING_EDITION] }
    : { state: "none", editions: [], noneDetail: SAFT_NONE };
}

/** The trail a retry shows while it reads again. */
export function retryTrailFor(obligationName: string): string[] {
  return [
    `Searching finances.belgium.be for the ${obligationName} form`,
    "Checking the VAT implementation guide's annexes",
    "Checking the Intervat technical documentation",
  ];
}
