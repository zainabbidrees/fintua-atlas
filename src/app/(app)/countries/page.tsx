import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryList } from "@/features/countries/country-list";
import { RUNS } from "@/features/countries/data";

export default function CountriesPage() {
  const live = RUNS.filter((r) => r.state === "live").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:py-12">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-text">
            Countries
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            <span className="tabular-nums">{RUNS.length}</span> jurisdictions ·{" "}
            <span className="tabular-nums">{live}</span> live in Comply
          </p>
        </div>

        <Button variant="primary" asChild>
          <Link href="/countries/new">
            <Plus />
            Add a country
          </Link>
        </Button>
      </header>

      <CountryList />
    </div>
  );
}
