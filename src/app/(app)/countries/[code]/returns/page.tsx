import { notFound } from "next/navigation";
import { ReturnsScreen } from "@/features/returns/returns-screen";
import { findCountry } from "@/lib/mock/countries";

export default async function ReturnsPage({
  params,
}: PageProps<"/countries/[code]/returns">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <ReturnsScreen countryCode={country.code} countryName={country.name} />;
}
