import { notFound } from "next/navigation";
import { QueryBuilderScreen } from "@/features/query-builder/query-builder-screen";
import { findCountry } from "@/lib/mock/countries";

/* Step 6, Query Builder. The route keeps its old `approval` path so the links
   into it from step five stay put; the Approval & Publish screen it used to
   show is still in src/features/approval, unrouted. */
export default async function QueryBuilderPage({
  params,
}: PageProps<"/countries/[code]/approval">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <QueryBuilderScreen countryCode={country.code} countryName={country.name} />;
}
