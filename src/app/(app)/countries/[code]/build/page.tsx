import { notFound } from "next/navigation";
import { BuildScreen } from "@/features/build/build-screen";
import { findCountry } from "@/lib/mock/countries";

export default async function BuildPage({
  params,
}: PageProps<"/countries/[code]/build">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <BuildScreen countryCode={country.code} countryName={country.name} />;
}
