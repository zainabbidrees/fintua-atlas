/**
 * A stylised stand-in for the official return PDF, as the form-preview panel on
 * the specs step draws it. Not the real document — a mock built from the fields
 * the agent would extract, so the box overlay and the viewer chrome have
 * something to render before a real PDF is uploaded.
 *
 * `tone` is the extraction state of a box, and carries the step's colours: ok
 * (mapped cleanly), warn (needs a look) and error (no mapping yet).
 */
export type BoxTone = "ok" | "warn" | "error";

/** A field overlay: a mapping name on a tab above an input strip. */
export interface FormBox {
  /** Shown on the box's tab, e.g. "#tax_office#" or "box_110". */
  name: string;
  tone: BoxTone;
  /** Width weight within its line (default 1). */
  grow?: number;
  /** The input shape under the tab. */
  variant?: "input" | "yesno" | "date";
}

/**
 * A numbered cell in a computation column — the form's line code and, when the
 * agent mapped it, the box overlay. No box means the line is printed but
 * unmapped, so it draws as a bare comb.
 */
export interface AmountCell {
  num: string;
  box?: FormBox;
  /** Show the money-column unit captions above the comb — "EUR" on a base
      column, "EUR"/"Ct" on a tax column — as the printed form prints them at
      the head of each boxed group. */
  units?: "base" | "tax";
  /** "money" (default) draws the comb; "yesno" draws a "1 = Ja" cell for the
      questionnaire lines (e.g. the § 15a adjustment checks). */
  variant?: "money" | "yesno";
}

/** One line of the form. Its `kind` decides how the row is drawn. */
export interface FormRow {
  /** The number printed in the form's left gutter. */
  n?: number;
  kind: "section" | "subsection" | "columns" | "note" | "fields" | "labeled" | "amount" | "check";
  /** Section title, or the label for a note / labeled / amount row. */
  text?: string;
  /** A secondary line beneath the label. */
  sub?: string;
  /** Input boxes, for a "fields" row. */
  boxes?: FormBox[];
  /** A right-aligned numbered box, for a "labeled" or "note" row. */
  code?: { num: string; box: FormBox };
  /** For an "amount" row: the base-amount column, and the optional tax column
      beside it — the two money columns on the computation pages. */
  base?: AmountCell;
  tax?: AmountCell;
  /** For a "columns" header row: the captions over the base and tax columns. */
  cols?: { base: string; tax: string };
  /** Bold the label on an amount row — a sub-total or an emphasised line. */
  strong?: boolean;
  /** For a "check" row: one or more tick-box options, drawn inline. */
  checks?: string[];
  /** Indent a check row under the question it belongs to. */
  indent?: boolean;
}

export interface FormPage {
  rows: FormRow[];
  /** The form's page code printed in the bottom corners, e.g. "2025USt2A502". */
  footer?: string;
}

export interface FormDoc {
  /** The toolbar title. */
  title: string;
  /** The masthead on the sheet. */
  heading: string;
  year: string;
  pages: FormPage[];
}

const page1: FormPage = {
  rows: [
    { kind: "fields", n: 1, boxes: [{ name: "#tax_office#", tone: "ok" }] },
    { kind: "fields", n: 2, boxes: [{ name: "#tax_number#", tone: "ok", grow: 2 }] },
    {
      kind: "labeled",
      n: 3,
      text: "Berichtigte Steuererklärung",
      code: { num: "110", box: { name: "box_110", tone: "ok", variant: "yesno" } },
    },
    { kind: "section", text: "A. Allgemeine Angaben" },
    { kind: "fields", n: 4, boxes: [{ name: "#vat_id#", tone: "warn" }] },
    { kind: "fields", n: 5, boxes: [{ name: "#full_name#", tone: "ok", grow: 3 }] },
    { kind: "fields", n: 6, boxes: [{ name: "#trading_name#", tone: "warn", grow: 3 }] },
    { kind: "fields", n: 7, boxes: [{ name: "#business_type#", tone: "warn", grow: 3 }] },
    { kind: "fields", n: 8, boxes: [{ name: "#street#", tone: "ok", grow: 3 }] },
    {
      kind: "fields",
      n: 9,
      boxes: [
        { name: "#house_number#", tone: "ok", grow: 1 },
        { name: "#house_number_suffix#", tone: "warn", grow: 1 },
        { name: "#address_supplement#", tone: "error", grow: 3 },
      ],
    },
    {
      kind: "fields",
      n: 10,
      boxes: [
        { name: "#postal_code#", tone: "ok", grow: 1 },
        { name: "#city#", tone: "ok", grow: 2 },
      ],
    },
    {
      kind: "fields",
      n: 11,
      boxes: [
        { name: "#po_box_postal_code#", tone: "warn", grow: 1 },
        { name: "#po_box#", tone: "warn", grow: 1 },
      ],
    },
    { kind: "fields", n: 12, boxes: [{ name: "#phone#", tone: "warn", grow: 2 }] },
    { kind: "fields", n: 13, boxes: [{ name: "#email#", tone: "warn", grow: 2 }] },
    {
      kind: "labeled",
      n: 14,
      text: "Im Ausland ansässiger Unternehmer",
      sub: "Bitte tätigen Sie in diesem Fall auch Angaben auf der Anlage UN.",
      code: { num: "125", box: { name: "box_125", tone: "ok", variant: "yesno" } },
    },
    {
      kind: "labeled",
      n: 15,
      text: "Fiskalvertreter",
      sub: "Bitte tätigen Sie in diesem Fall auch Angaben auf der Anlage FV.",
      code: { num: "126", box: { name: "box_126", tone: "ok", variant: "yesno" } },
    },
    {
      kind: "labeled",
      n: 16,
      text: "Wechsel von der Kleinunternehmer-Regelung (§ 19 UStG) zur Regelbesteuerung",
      sub: "Datum des Wechsels",
      code: { num: "136", box: { name: "box_136", tone: "warn", variant: "date" } },
    },
    {
      kind: "note",
      text: "Dauer der Unternehmereigenschaft",
      sub: "(falls nicht vom 1. Januar bis zum 31. Dezember 2025)",
    },
    {
      kind: "labeled",
      n: 18,
      text: "Die Steuer wurde berechnet nach",
      sub: "vereinbarten / vereinnahmten Entgelten",
      code: { num: "133", box: { name: "box_133", tone: "ok", variant: "input" } },
    },
    {
      kind: "labeled",
      n: 19,
      text: "Verrechnung des Erstattungsbetrages erwünscht / Erstattungsbetrag abgetreten",
      code: { num: "129", box: { name: "box_129", tone: "ok", variant: "yesno" } },
    },
    {
      kind: "labeled",
      n: 20,
      text: "Ergänzende Angaben zur Steuererklärung",
      code: { num: "123", box: { name: "box_123", tone: "warn", variant: "yesno" } },
    },
  ],
};

/* Pages two and three carry the tax-computation boxes; the fields, labels and
   tones are the real set the agent extracted (pages 1-3). Pages four to six are
   the remaining PDF pages, which hold no extracted fields — so they draw as the
   bare form, and the pager still runs to six. */
const page2: FormPage = {
  footer: "2025USt2A502",
  rows: [
    {
      kind: "section",
      text: "B. Steuerpflichtige Lieferungen, sonstige Leistungen und unentgeltliche Wertabgaben",
    },
    {
      kind: "columns",
      cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "Steuer" },
    },

    { kind: "subsection", text: "Umsätze zum allgemeinen Steuersatz" },
    {
      kind: "amount",
      n: 22,
      text: "Lieferungen und sonstige Leistungen zu 19 %",
      base: { num: "177", box: { name: "box_177", tone: "ok" }, units: "base" },
    },
    {
      kind: "amount",
      n: 23,
      text: "Unentgeltliche Wertabgaben — Lieferungen nach § 3 Abs. 1b UStG zu 19 %",
      base: { num: "178", box: { name: "box_178", tone: "warn" } },
    },
    {
      kind: "amount",
      n: 24,
      text: "Sonstige Leistungen nach § 3 Abs. 9a UStG zu 19 %",
      base: { num: "179", box: { name: "box_179", tone: "warn" } },
    },

    { kind: "subsection", text: "Umsätze zum ermäßigten Steuersatz von 7 %" },
    {
      kind: "amount",
      n: 25,
      text: "Lieferungen und sonstige Leistungen zu 7 %",
      base: { num: "275", box: { name: "box_275", tone: "ok" } },
    },
    {
      kind: "amount",
      n: 26,
      text: "Unentgeltliche Wertabgaben — Lieferungen nach § 3 Abs. 1b UStG zu 7 %",
      base: { num: "195", box: { name: "box_195", tone: "warn" } },
    },
    {
      kind: "amount",
      n: 27,
      text: "Sonstige Leistungen nach § 3 Abs. 9a UStG zu 7 %",
      base: { num: "196", box: { name: "box_196", tone: "warn" } },
    },

    { kind: "subsection", text: "Umsätze zum ermäßigten Steuersatz von 0 %" },
    {
      kind: "amount",
      n: 28,
      text: "Lieferungen und sonstige Leistungen zu 0 %",
      base: { num: "157", box: { name: "box_157", tone: "ok" } },
    },
    {
      kind: "amount",
      n: 29,
      text: "Unentgeltliche Wertabgaben — Lieferungen nach § 3 Abs. 1b UStG zu 0 %",
      base: { num: "158" },
    },
    {
      kind: "amount",
      n: 30,
      text: "Sonstige Leistungen nach § 3 Abs. 9a UStG zu 0 %",
      base: { num: "159" },
    },
    {
      kind: "amount",
      n: 31,
      text: "Umsätze zu anderen Steuersätzen",
      base: { num: "155", box: { name: "box_155", tone: "error" } },
      tax: { num: "156", box: { name: "box_156", tone: "error" }, units: "tax" },
    },

    {
      kind: "subsection",
      text: "Umsätze land- und forstwirtschaftlicher Betriebe nach § 24 UStG",
    },
    {
      kind: "amount",
      n: 32,
      text: "Lieferungen in das übrige Gemeinschaftsgebiet an Abnehmer mit Umsatzsteuer-Identifikationsnummer",
      base: { num: "777" },
    },
    {
      kind: "amount",
      n: 33,
      text: "Steuerpflichtige Umsätze (einschließlich unentgeltlicher Wertabgaben), für die eine Steuer nach § 24 UStG zu entrichten ist (Sägewerkserzeugnisse, Getränke und alkoholische Flüssigkeiten, z. B. Wein)",
      base: { num: "346" },
      tax: { num: "347", units: "tax" },
    },
    {
      kind: "amount",
      n: 34,
      text: "Übrige steuerpflichtige Umsätze land- und forstwirtschaftlicher Betriebe, für die keine Steuer zu entrichten ist",
      base: { num: "361" },
    },

    {
      kind: "subsection",
      text: "Wechsel von der Kleinunternehmer-Regelung (§ 19 UStG) zur Regelbesteuerung beziehungsweise Durchschnittssatzbesteuerung (§ 24 UStG)",
    },
    {
      kind: "amount",
      n: 35,
      text: "Steuer (Nachsteuer) auf vereinnahmte Anzahlungen infolge des Wechsels der Besteuerungsform",
      tax: { num: "317", units: "tax" },
    },
    {
      kind: "amount",
      n: 36,
      strong: true,
      text: "Nachsteuer auf versteuerte Anzahlungen und ähnlichem wegen Steuersatzänderung",
      tax: { num: "319" },
    },
    {
      kind: "amount",
      n: 37,
      text: "Summe der Steuer (zu übertragen in Zeile 103)",
      tax: { num: "" },
    },
  ],
};

const page3: FormPage = {
  footer: "2025USt2A503",
  rows: [
    {
      kind: "section",
      text: "C. Steuerfreie Lieferungen, sonstige Leistungen und unentgeltliche Wertabgaben",
    },
    { kind: "columns", cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "" } },

    { kind: "subsection", text: "Steuerfreie Umsätze mit Vorsteuerabzug" },
    { kind: "subsection", text: "a) Innergemeinschaftliche Lieferungen (§ 4 Nummer 1 Buchstabe b UStG)" },
    {
      kind: "amount",
      n: 38,
      text: "an Abnehmer mit Umsatzsteuer-Identifikationsnummer",
      base: { num: "741", box: { name: "box_741", tone: "ok" }, units: "base" },
    },
    {
      kind: "amount",
      n: 39,
      text: "neuer Fahrzeuge an Abnehmer ohne Umsatzsteuer-Identifikationsnummer",
      base: { num: "744", box: { name: "box_744", tone: "warn" } },
    },
    {
      kind: "amount",
      n: 40,
      text: "neuer Fahrzeuge außerhalb eines Unternehmens (§ 2a UStG)",
      base: { num: "749" },
    },
    {
      kind: "subsection",
      text: "b) Weitere steuerfreie Umsätze mit Vorsteuerabzug (z. B. nach § 4 Nummer 1 Buchstabe a, 2 bis 7 UStG)",
    },
    {
      kind: "amount",
      n: 41,
      text: "Ausfuhrlieferungen (§ 4 Nummer 1 Buchstabe a UStG)",
      base: { num: "752" },
    },
    { kind: "amount", n: 42, text: "Umsätze nach § … UStG", base: { num: "753" } },
    {
      kind: "amount",
      n: 43,
      text: "Umsätze im Sinne des Offshore-Steuerabkommens, des Zusatzabkommens zum NATO-Truppenstatut und des Ergänzungsabkommens zum Protokoll über die NATO-Hauptquartiere",
      base: { num: "" },
    },
    {
      kind: "amount",
      n: 44,
      text: "Reiseleistungen nach § 25 Absatz 2 UStG",
      base: { num: "237", box: { name: "box_237", tone: "warn" } },
    },
    { kind: "amount", n: 45, text: "Summe der Zeilen 42 bis 44", base: { num: "" } },

    { kind: "subsection", text: "Steuerfreie Umsätze ohne Vorsteuerabzug" },
    { kind: "subsection", text: "a) nicht zum Gesamtumsatz (§ 19 Absatz 2 UStG) gehörend" },
    {
      kind: "amount",
      n: 46,
      text: "nach § 4 Nummer 12 UStG (Vermietung und Verpachtung von Grundstücken)",
      base: { num: "286" },
    },
    { kind: "amount", n: 47, text: "nach § 4 Nummer … UStG", base: { num: "287" } },
    { kind: "subsection", text: "b) zum Gesamtumsatz (§ 19 Absatz 2 UStG) gehörend" },
    { kind: "amount", n: 48, text: "nach § 19 Absatz 1 UStG", base: { num: "236" } },
    { kind: "amount", n: 49, text: "nach § …", base: { num: "240" } },

    { kind: "section", text: "D. Innergemeinschaftliche Erwerbe" },
    { kind: "columns", cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "Steuer" } },
    {
      kind: "amount",
      n: 50,
      text: "Steuerfreie innergemeinschaftliche Erwerbe von bestimmten Gegenständen und Anlagegold nach §§ 4b und 25c UStG",
      base: { num: "791", units: "base" },
    },
    { kind: "subsection", text: "Steuerpflichtige innergemeinschaftliche Erwerbe (§ 1a UStG)" },
    {
      kind: "amount",
      n: 51,
      text: "zum Steuersatz von 19 %",
      base: { num: "781", box: { name: "box_781", tone: "warn" } },
      tax: { num: "", units: "tax" },
    },
    {
      kind: "amount",
      n: 52,
      text: "zum Steuersatz von 7 %",
      base: { num: "793", box: { name: "box_793", tone: "warn" } },
      tax: { num: "" },
    },
    { kind: "amount", n: 53, text: "zum Steuersatz von 0 %", base: { num: "780" } },
    {
      kind: "amount",
      n: 54,
      text: "zu anderen Steuersätzen",
      base: { num: "798" },
      tax: { num: "799" },
    },
    {
      kind: "amount",
      n: 55,
      text: "neuer Fahrzeuge (§ 1b Absatz 2 und 3 UStG) von Lieferern ohne Umsatzsteuer-Identifikationsnummer zum allgemeinen Steuersatz",
      base: { num: "794" },
      tax: { num: "796" },
    },
    {
      kind: "amount",
      n: 56,
      text: "Summe der Steuer (zu übertragen in Zeile 104)",
      tax: { num: "" },
    },

    {
      kind: "section",
      text: "E. Steuerschuldner bei Auslagerung (§ 13a Absatz 1 Nummer 6 UStG)",
    },
    { kind: "columns", cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "Steuer" } },
    {
      kind: "amount",
      n: 57,
      text: "Lieferungen, die der Auslagerung vorangegangen sind (§ 4 Nummer 4a Satz 1 Buchstabe a Satz 2 UStG)",
      base: { num: "852", units: "base" },
      tax: { num: "853", units: "tax" },
    },
    {
      kind: "amount",
      n: 58,
      text: "Summe der Steuer (zu übertragen in Zeile 105)",
      tax: { num: "" },
    },
  ],
};

const page4: FormPage = {
  footer: "2025USt2A504",
  rows: [
    { kind: "section", text: "F. Innergemeinschaftliche Dreiecksgeschäfte (§ 25b UStG)" },
    { kind: "columns", cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "Steuer" } },
    {
      kind: "amount",
      n: 59,
      text: "Lieferungen des ersten Abnehmers",
      base: { num: "742", units: "base" },
    },
    { kind: "subsection", text: "Lieferungen, für die der letzte Abnehmer die Umsatzsteuer schuldet" },
    {
      kind: "amount",
      n: 60,
      text: "zum Steuersatz von 19 %",
      base: { num: "751" },
      tax: { num: "", units: "tax" },
    },
    { kind: "amount", n: 61, text: "zum Steuersatz von 7 %", base: { num: "746" }, tax: { num: "" } },
    { kind: "amount", n: 62, text: "zum Steuersatz von 0 %", base: { num: "750" }, tax: { num: "" } },
    {
      kind: "amount",
      n: 63,
      text: "zu anderen Steuersätzen",
      base: { num: "747" },
      tax: { num: "748" },
    },
    {
      kind: "amount",
      n: 64,
      text: "Summe der Steuer (zu übertragen in Zeile 106)",
      tax: { num: "" },
    },

    { kind: "section", text: "G. Leistungsempfänger als Steuerschuldner (§ 13b UStG)" },
    { kind: "columns", cols: { base: "Bemessungsgrundlage ohne Umsatzsteuer", tax: "Steuer" } },
    {
      kind: "amount",
      n: 65,
      text: "Sonstige Leistungen nach § 3a Absatz 2 UStG eines im übrigen Gemeinschaftsgebiet ansässigen Unternehmers (§ 13b Absatz 1 UStG)",
      base: { num: "846", units: "base" },
      tax: { num: "847", units: "tax" },
    },
    {
      kind: "amount",
      n: 66,
      text: "Umsätze, die unter das GrEStG fallen (§ 13b Absatz 2 Nummer 3 UStG)",
      base: { num: "873" },
      tax: { num: "874" },
    },
    {
      kind: "amount",
      n: 67,
      text: "Andere Leistungen (§ 13b Absatz 2 Nummer 1, 2, 4 bis 12 UStG)",
      base: { num: "877" },
      tax: { num: "878" },
    },
    {
      kind: "amount",
      n: 68,
      text: "Summe der Steuer (zu übertragen in Zeile 107)",
      tax: { num: "" },
    },

    { kind: "section", text: "H. Ergänzende Angaben zu Umsätzen" },
    { kind: "columns", cols: { base: "Betrag", tax: "" } },
    {
      kind: "amount",
      n: 69,
      text: "Umsätze, die auf Grund eines Verzichts auf Steuerbefreiung (§ 9 UStG) als steuerpflichtig behandelt worden sind (in Abschnitt B enthalten)",
      base: { num: "", units: "base" },
    },
    {
      kind: "amount",
      n: 70,
      text: "Steuerpflichtige Umsätze des leistenden Unternehmers, für die der Leistungsempfänger die Steuer nach § 13b Absatz 5 UStG schuldet",
      base: { num: "209" },
    },
    {
      kind: "amount",
      n: 71,
      text: "Telekommunikations-, Rundfunk- und Fernsehdienstleistungen sowie auf elektronischem Weg erbrachte sonstige Leistungen an im übrigen Gemeinschaftsgebiet ansässige Nichtunternehmer sowie innergemeinschaftliche Fernverkäufe (§ 3a Absatz 5 und § 3c Absatz 1 UStG; in Abschnitt B oder C enthalten)",
      base: { num: "213" },
    },
    {
      kind: "amount",
      n: 72,
      text: "Telekommunikations-, Rundfunk- und Fernsehdienstleistungen sowie auf elektronischem Weg erbrachte sonstige Leistungen (in anderen EU-Mitgliedstaaten zu versteuern)",
      base: { num: "214" },
    },
    {
      kind: "amount",
      n: 73,
      text: "Nicht steuerbare Geschäftsveräußerung im Ganzen gemäß § 1 Absatz 1a UStG",
      base: { num: "211" },
    },
    {
      kind: "amount",
      n: 74,
      text: "Nicht steuerbare sonstige Leistungen gemäß § 18b Satz 1 Nummer 2 UStG",
      base: { num: "721" },
    },
    {
      kind: "amount",
      n: 75,
      text: "Übrige nicht steuerbare Umsätze (Leistungsort nicht im Inland)",
      base: { num: "205" },
    },
    {
      kind: "amount",
      n: 76,
      text: "In den Zeilen 72, 74 und 75 enthaltene Umsätze, die nach § 15 Absatz 2 und 3 UStG den Vorsteuerabzug ausschließen",
      base: { num: "204" },
    },
    {
      kind: "amount",
      n: 77,
      text: "Auf den inländischen Streckenanteil entfallende Umsätze grenzüberschreitender Personenbeförderungen im Luftverkehr (§ 26 Absatz 3 UStG)",
      base: { num: "212" },
    },
    {
      kind: "amount",
      n: 78,
      text: "Minderung der Bemessungsgrundlage nach § 17 Absatz 1 Satz 1 in Verbindung mit Absatz 2 Nummer 1 Satz 1 UStG für uneinbringliche Forderungsentgelte (in Abschnitt B enthalten)",
      base: { num: "650" },
    },
  ],
};

/* Pages five and six: the input-tax deductions, the § 15a adjustment and the
   final computation. These weren't in the agent's mapped set, so they carry no
   box overlays — just the printed line codes and empty combs. */
const page5: FormPage = {
  footer: "2025USt2A505",
  rows: [
    { kind: "section", text: "I. Abziehbare Vorsteuerbeträge" },
    { kind: "note", text: "(ohne die Berichtigung nach § 15a UStG)" },
    { kind: "columns", cols: { base: "", tax: "Steuer" } },
    {
      kind: "amount",
      n: 79,
      text: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmern (§ 15 Absatz 1 Satz 1 Nummer 1 UStG)",
      tax: { num: "320", units: "tax" },
    },
    {
      kind: "amount",
      n: 80,
      text: "Vorsteuerbeträge aus innergemeinschaftlichen Erwerben von Gegenständen (§ 15 Absatz 1 Satz 1 Nummer 3 UStG)",
      tax: { num: "761" },
    },
    {
      kind: "amount",
      n: 81,
      text: "Entstandene Einfuhrumsatzsteuer (§ 15 Absatz 1 Satz 1 Nummer 2 UStG)",
      tax: { num: "762" },
    },
    {
      kind: "amount",
      n: 82,
      text: "Vorsteuerabzug für die Steuer, die der Abnehmer als Auslagerer nach § 13a Absatz 1 Nummer 6 UStG schuldet (§ 15 Absatz 1 Satz 1 Nummer 5 UStG)",
      tax: { num: "466" },
    },
    {
      kind: "amount",
      n: 83,
      text: "Vorsteuerbeträge aus Leistungen im Sinne des § 13b UStG (§ 15 Absatz 1 Satz 1 Nummer 4 UStG)",
      tax: { num: "467" },
    },
    {
      kind: "amount",
      n: 84,
      text: "Vorsteuerbeträge nach den Durchschnittssätzen für bestimmte Körperschaften, Personenvereinigungen und Vermögensmassen (§ 23a UStG)",
      tax: { num: "334" },
    },
    {
      kind: "amount",
      n: 85,
      text: "Vorsteuerbeträge für innergemeinschaftliche Lieferungen neuer Fahrzeuge außerhalb eines Unternehmens (§ 2a UStG) sowie von Kleinunternehmern im Sinne des § 19 Absatz 1 UStG (§ 15 Absatz 4a UStG)",
      tax: { num: "759" },
    },
    {
      kind: "amount",
      n: 86,
      text: "Vorsteuerbeträge aus innergemeinschaftlichen Dreiecksgeschäften (§ 25b Absatz 5 UStG)",
      tax: { num: "760" },
    },
    {
      kind: "amount",
      n: 87,
      text: "Summe der Vorsteuerbeträge (zu übertragen in Zeile 109)",
      tax: { num: "" },
    },

    { kind: "subsection", text: "Ergänzende Angabe" },
    {
      kind: "amount",
      n: 88,
      text: "Minderung der abziehbaren Vorsteuerbeträge nach § 17 Absatz 1 Satz 2 in Verbindung mit Absatz 2 Nummer 1 Satz 1 UStG (in Zeile 79, 84 und 85 enthalten)",
      tax: { num: "637" },
    },

    { kind: "section", text: "J. Berichtigung des Vorsteuerabzugs (§ 15a UStG)" },
    {
      kind: "amount",
      n: 89,
      text: "Sind im Kalenderjahr 2025 Grundstücke, Grundstücksteile, Gebäude oder Gebäudeteile, für die Vorsteuer abgezogen worden ist, erstmals tatsächlich verwendet worden?",
      tax: { num: "370", variant: "yesno" },
    },
    {
      kind: "note",
      text: "(Geben Sie bitte auf einem besonderen Blatt für jedes Grundstück oder Gebäude gesondert an: Lage, Zeitpunkt der erstmaligen tatsächlichen Verwendung, Art und Umfang der Verwendung im Erstjahr, insgesamt angefallene Vorsteuer, in den Vorjahren – Investitionsphase – bereits abgezogene Steuer)",
    },
    {
      kind: "note",
      text: "Haben sich im Jahr 2025 die für den ursprünglichen Vorsteuerabzug maßgebenden Verhältnisse geändert bei",
    },
    {
      kind: "amount",
      n: 90,
      text: "1. Grundstücken, Grundstücksteilen, Gebäuden oder Gebäudeteilen, die innerhalb der letzten 10 Jahre erstmals tatsächlich und nicht nur einmalig zur Ausführung von Umsätzen verwendet worden sind?",
      tax: { num: "371", variant: "yesno" },
    },
    {
      kind: "amount",
      n: 91,
      text: "2. anderen Wirtschaftsgütern und sonstigen Leistungen, die innerhalb der letzten 5 Jahre erstmals tatsächlich und nicht nur einmalig zur Ausführung von Umsätzen verwendet worden sind?",
      tax: { num: "372", variant: "yesno" },
    },
    {
      kind: "amount",
      n: 92,
      text: "3. Wirtschaftsgütern und sonstigen Leistungen, die nur einmalig zur Ausführung von Umsätzen verwendet worden sind?",
      tax: { num: "369", variant: "yesno" },
    },
    {
      kind: "note",
      text: "Die Verhältnisse, die ursprünglich für die Beurteilung des Vorsteuerabzugs maßgebend waren, haben sich seitdem geändert durch:",
    },
    {
      kind: "check",
      n: 93,
      checks: [
        "Veräußerung",
        "Lieferung im Sinne des § 3 Absatz 1b UStG",
        "Wechsel der Besteuerungsform, § 15 Absatz 7 UStG",
      ],
    },
    {
      kind: "check",
      n: 94,
      checks: ["Wechsel der Besteuerungsform im Rahmen der Kleinunternehmer-Regelung"],
    },
    { kind: "check", n: 95, checks: ["Nutzungsänderung, und zwar"] },
    {
      kind: "check",
      n: 96,
      indent: true,
      checks: [
        "Übergang von steuerpflichtiger zu steuerfreier Vermietung oder umgekehrt beziehungsweise Änderung des Verwendungsschlüssels bei gemischt genutzten Grundstücken (insbesondere bei Mieterwechsel).",
      ],
    },
    {
      kind: "check",
      n: 97,
      indent: true,
      checks: [
        "steuerfreie Vermietung bisher eigengewerblich genutzter Räume oder umgekehrt; Übergang von einer Vermietung für NATO- oder ähnliche Zwecke zu einer nach § 4 Nummer 12 UStG steuerfreien Vermietung.",
      ],
    },
    { kind: "check", n: 98, indent: true, checks: [""] },

    { kind: "subsection", text: "Vorsteuerberichtigungsbeträge" },
    { kind: "columns", cols: { base: "nachträglich abziehbar", tax: "zurückzuzahlen" } },
    {
      kind: "amount",
      n: 99,
      text: "zu 1. (z. B. Grundstücke, § 15a Absatz 1 Satz 2 UStG)",
      base: { num: "", units: "tax" },
      tax: { num: "", units: "tax" },
    },
    {
      kind: "amount",
      n: 100,
      text: "zu 2. (z. B. andere Wirtschaftsgüter, § 15a Absatz 1 Satz 1 UStG)",
      base: { num: "" },
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 101,
      text: "zu 3. (z. B. Wirtschaftsgüter, § 15a Absatz 2 UStG)",
      base: { num: "" },
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 102,
      text: "Summe",
      base: { num: "357" },
      tax: { num: "359" },
    },
  ],
};

const page6: FormPage = {
  footer: "2025USt2A506",
  rows: [
    { kind: "section", text: "K. Berechnung der zu entrichtenden Umsatzsteuer" },
    { kind: "columns", cols: { base: "", tax: "Steuer" } },
    {
      kind: "amount",
      n: 103,
      strong: true,
      text: "Umsatzsteuer auf steuerpflichtige Lieferungen, sonstige Leistungen und unentgeltliche Wertabgaben (aus Zeile 37)",
      tax: { num: "", units: "tax" },
    },
    {
      kind: "amount",
      n: 104,
      strong: true,
      text: "Umsatzsteuer auf innergemeinschaftliche Erwerbe (aus Zeile 56)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 105,
      text: "Umsatzsteuer, die vom Auslagerer oder Lagerhalter geschuldet wird (§ 13a Absatz 1 Nummer 6 UStG) (aus Zeile 58)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 106,
      text: "Umsatzsteuer, die vom letzten Abnehmer im innergemeinschaftlichen Dreiecksgeschäft geschuldet wird (§ 25b Absatz 2 UStG) (aus Zeile 64)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 107,
      text: "Umsatzsteuer, die vom Leistungsempfänger nach § 13b UStG geschuldet wird (aus Zeile 68)",
      tax: { num: "" },
    },
    { kind: "amount", n: 108, text: "Zwischensumme", tax: { num: "" } },
    {
      kind: "amount",
      n: 109,
      strong: true,
      text: "Abziehbare Vorsteuerbeträge (aus Zeile 87)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 110,
      text: "Vorsteuerbeträge, die auf Grund des § 15a UStG nachträglich abziehbar sind (aus Zeile 102)",
      tax: { num: "" },
    },
    { kind: "amount", n: 111, strong: true, text: "Verbleibender Betrag", tax: { num: "" } },
    {
      kind: "amount",
      n: 112,
      text: "Vorsteuerbeträge, die auf Grund des § 15a UStG zurückzuzahlen sind (aus Zeile 102)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 113,
      text: "In Rechnungen unrichtig oder unberechtigt ausgewiesene Steuerbeträge (§ 14c UStG) sowie Steuerbeträge, die nach § 6a Absatz 4 Satz 2 UStG geschuldet werden",
      tax: { num: "318" },
    },
    {
      kind: "amount",
      n: 114,
      text: "Steuerbeträge, die nach § 17 Absatz 1 Satz 7 UStG geschuldet werden",
      tax: { num: "331" },
    },
    {
      kind: "amount",
      n: 115,
      text: "Steuer- und Vorsteuerbeträge, die auf frühere Besteuerungszeiträume entfallen (nur für Kleinunternehmer, die § 19 Absatz 1 UStG anwenden)",
      tax: { num: "391" },
    },
    {
      kind: "amount",
      n: 116,
      strong: true,
      text: "Umsatzsteuer / Überschuss – bitte dem Betrag ein Minuszeichen voranstellen –",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 117,
      text: "Anrechenbare Beträge (aus Zeile 18 der Anlage UN)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 118,
      strong: true,
      text: "Verbleibende Umsatzsteuer / Verbleibender Überschuss – bitte dem Betrag ein Minuszeichen voranstellen – (bitte in jedem Fall ausfüllen)",
      tax: { num: "816" },
    },
    {
      kind: "amount",
      n: 119,
      text: "Vorauszahlungssoll 2025 (einschließlich Sondervorauszahlung)",
      tax: { num: "" },
    },
    {
      kind: "amount",
      n: 120,
      strong: true,
      text: "Noch an die Finanzkasse zu entrichten – Abschlusszahlung – / Erstattungsanspruch – bitte dem Betrag ein Minuszeichen voranstellen – (bitte in jedem Fall ausfüllen)",
      tax: { num: "820" },
    },
    {
      kind: "note",
      text: "Ein Umsatzsteuerbescheid ergeht nur, wenn von Ihrer Berechnung der Umsatzsteuer abgewichen wird.",
    },

    { kind: "section", text: "Unterschrift" },
    {
      kind: "amount",
      n: 121,
      text: "Die Steuererklärung wurde unter Mitwirkung einer selbständig und eigenverantwortlich tätigen und zur Hilfeleistung in Steuersachen nach §§ 3 und 4 des Steuerberatungsgesetzes befugten Person oder Vereinigung angefertigt.",
      tax: { num: "", variant: "yesno" },
    },
    {
      kind: "note",
      text: "Bei der Anfertigung dieser Steuererklärung einschließlich der Anlagen hat mitgewirkt:",
    },
    { kind: "note", sub: "Datum, eigenhändige Unterschrift des Unternehmers" },

    { kind: "subsection", text: "Bearbeitungshinweis" },
    {
      kind: "note",
      text: "1. Die aufgeführten Daten sind mit Hilfe des geprüften und genehmigten Programms sowie ggf. unter Berücksichtigung der gespeicherten Daten maschinell zu verarbeiten.",
    },
    {
      kind: "note",
      text: "2. Die weitere Bearbeitung richtet sich nach den Ergebnissen der maschinellen Verarbeitung.",
    },
    { kind: "note", text: "Kontrollzahl und/oder Datenerfassungsvermerk" },
  ],
};

export const FORM_PREVIEW: FormDoc = {
  title: "Umsatzsteuer-Voranmeldung (UStVA) 2025 (official PDF)",
  heading: "Umsatzsteuererklärung",
  year: "2025",
  pages: [page1, page2, page3, page4, page5, page6],
};
