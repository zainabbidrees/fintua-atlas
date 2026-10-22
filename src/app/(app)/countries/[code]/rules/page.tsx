import { notFound } from "next/navigation";
import { RulesScreen } from "@/features/rules/rules-screen";
import { findCountry } from "@/lib/mock/countries";

export default async function RulesPage({
  params,
}: PageProps<"/countries/[code]/rules">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <RulesScreen countryCode={country.code} countryName={country.name} />;
}
