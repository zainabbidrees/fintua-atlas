import { notFound } from "next/navigation";
import { TaxRulesScreen } from "@/features/tax-rules/tax-rules-screen";
import { findCountry } from "@/lib/mock/countries";

/* Step 5, Tax Rules Generation. The route keeps its old `build` path so the
   links into it from steps four and six stay put; the SQL Review screen it
   used to show is still in src/features/build, unrouted. */
export default async function TaxRulesPage({
  params,
}: PageProps<"/countries/[code]/build">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <TaxRulesScreen countryCode={country.code} countryName={country.name} />;
}
