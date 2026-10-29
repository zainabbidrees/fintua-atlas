import { SetupScreen } from "@/features/setup/setup-screen";

/* `?review=BE` opens step one for a country in review, from the approval
   screen; without it, this is where a new country starts. */
export default async function AddCountryPage({ searchParams }: PageProps<"/countries/new">) {
  const { review } = await searchParams;
  return <SetupScreen reviewCode={typeof review === "string" ? review : undefined} />;
}
