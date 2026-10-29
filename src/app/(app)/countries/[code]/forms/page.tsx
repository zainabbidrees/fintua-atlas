import { notFound } from "next/navigation";
import { FormsScreen } from "@/features/forms/forms-screen";
import { findCountry } from "@/lib/mock/countries";

export default async function FormsPage({
  params,
}: PageProps<"/countries/[code]/forms">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <FormsScreen countryCode={country.code} countryName={country.name} />;
}
