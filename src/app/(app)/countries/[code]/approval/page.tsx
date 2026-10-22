import { notFound } from "next/navigation";
import { ApprovalScreen } from "@/features/approval/approval-screen";
import { findCountry } from "@/lib/mock/countries";

export default async function ApprovalPage({
  params,
}: PageProps<"/countries/[code]/approval">) {
  const { code } = await params;
  const country = findCountry(code.toUpperCase());
  if (!country) notFound();

  return <ApprovalScreen countryCode={country.code} countryName={country.name} />;
}
