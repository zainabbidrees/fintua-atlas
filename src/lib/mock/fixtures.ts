import type { Filing, Source } from "../types";

/**
 * Fixtures include the unhappy paths on purpose, so error and uncertainty
 * states are clickable in the browser rather than theoretical:
 *
 *   BE  succeeds, with one low-certainty filing that needs a human decision
 *   FR  returns nothing
 *   XX  fails outright
 *
 * Everything else returns a small generic set.
 */

const BE_AUTHORITY: Source = {
  id: "be-spf",
  title: "VAT filing portal",
  url: "https://finances.belgium.be/en/enterprises/vat",
  publisher: "Belgian Federal Public Service Finance",
  lastUpdated: "2026-01-14",
  kind: "authority",
  whatsInIt: "Return forms, filing calendar and submission channels.",
};

const BE_GUIDANCE: Source = {
  id: "be-guide",
  title: "VAT implementation guide 2026",
  url: "https://finances.belgium.be/en/enterprises/vat/guide-2026",
  publisher: "Belgian Federal Public Service Finance",
  lastUpdated: "2026-02-03",
  kind: "guidance",
  whatsInIt: "Box-by-box instructions and the XML schema for electronic filing.",
};

const EU_DIRECTIVE: Source = {
  id: "eu-directive",
  title: "EU VAT Directive 2006/112/EC",
  url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006L0112",
  publisher: "European Union",
  lastUpdated: "2025-11-20",
  kind: "authority",
  whatsInIt: "The EU-wide VAT framework that national rules are built on.",
};

/** Deliberately weak: old, and not an official body. Drives the "needs check" state. */
const BLOG: Source = {
  id: "be-blog",
  title: "Belgian SAF-T: what to expect",
  url: "https://example-accountancy.be/blog/saf-t",
  publisher: "An accountancy firm's blog",
  lastUpdated: "2019-06-11",
  kind: "other",
  whatsInIt: "A commentary piece speculating about a future SAF-T mandate.",
};

export const BE_SOURCES: Source[] = [
  BE_AUTHORITY,
  BE_GUIDANCE,
  EU_DIRECTIVE,
  BLOG,
];

export const BE_FILINGS: Filing[] = [
  {
    id: "be-vat",
    name: "VAT Return",
    localName: "Aangifte btw",
    frequency: "Monthly or quarterly",
    whyItApplies: "Mandatory for every VAT-registered business.",
    foundOn: BE_AUTHORITY,
    certainty: "confident",
    origin: "found",
  },
  {
    id: "be-esl",
    name: "EC Sales List",
    localName: "Intracommunautaire opgave",
    frequency: "Monthly or quarterly",
    whyItApplies: "Required for business-to-business sales to other EU countries.",
    foundOn: EU_DIRECTIVE,
    certainty: "confident",
    origin: "found",
  },
  {
    id: "be-annual",
    name: "Annual client listing",
    localName: "Jaarlijkse klantenlisting",
    frequency: "Once a year, by 31 March",
    whyItApplies: "Belgium requires an annual listing of Belgian VAT-registered customers.",
    foundOn: BE_GUIDANCE,
    certainty: "confident",
    origin: "found",
  },
  {
    id: "be-saft",
    name: "SAF-T",
    localName: null,
    frequency: null,
    whyItApplies: "A standard audit file may be requested by the tax authority.",
    foundOn: BLOG,
    certainty: "needs_check",
    uncertainty:
      "We only found this on a commentary blog from 2019, and nothing on the tax authority's own site. It may not apply in Belgium.",
    origin: "found",
  },
];

/** The document an expert might upload that collides with something we found. */
export const COLLIDING_DOCUMENT = {
  fileName: "BE VAT guide 2026.pdf",
  matches: BE_GUIDANCE,
  theirVersion: "2026-02-03",
  yourVersion: "2026-09-01",
};

const GENERIC_SOURCE: Source = {
  id: "generic-authority",
  title: "National tax authority portal",
  url: "https://example.gov",
  publisher: "National tax authority",
  lastUpdated: "2026-01-01",
  kind: "authority",
  whatsInIt: "Return forms and filing deadlines.",
};

export const GENERIC_FILINGS: Filing[] = [
  {
    id: "generic-vat",
    name: "VAT Return",
    localName: null,
    frequency: "Monthly",
    whyItApplies: "Mandatory for every VAT-registered business.",
    foundOn: GENERIC_SOURCE,
    certainty: "confident",
    origin: "found",
  },
  {
    id: "generic-esl",
    name: "EC Sales List",
    localName: null,
    frequency: "Quarterly",
    whyItApplies: "Required for business-to-business sales to other EU countries.",
    foundOn: GENERIC_SOURCE,
    certainty: "confident",
    origin: "found",
  },
];

export const GENERIC_SOURCES: Source[] = [GENERIC_SOURCE];
