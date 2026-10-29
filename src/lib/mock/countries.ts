import type { Country } from "../types";

/**
 * A working subset. The real list is every country in the world — story 1.1 is
 * explicit that countries already in Comply are NOT filtered out or marked
 * differently, so there is no "already onboarded" flag here on purpose.
 */
export const COUNTRIES: Country[] = [
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CZ", name: "Czechia", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "MT", name: "Malta (finds nothing)", flag: "🇲🇹" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "XX", name: "Testland (forces a failure)", flag: "🏴" },
];

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function searchCountries(term: string): Country[] {
  const t = term.trim().toLowerCase();
  if (!t) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(t) || c.code.toLowerCase() === t,
  );
}
