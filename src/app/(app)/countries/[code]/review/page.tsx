import { notFound } from "next/navigation";
import { ReviewScreen } from "@/features/review/review-screen";
import { findCountry } from "@/lib/mock/countries";

/* The approval workflow, after step six: every step with its review status. */
export default async function ReviewPage({
  params,
}: PageProps<"/countries/[code]/review">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <ReviewScreen countryCode={country.code} countryName={country.name} />;
}
