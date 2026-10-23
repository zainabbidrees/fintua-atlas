import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryList } from "@/features/countries/country-list";
import { RUNS, filingsLive } from "@/features/countries/data";

/**
 * A portal index, not a landing page.
 *
 * An earlier pass had an editorial header here — eyebrow, two-tone display
 * headline, a paragraph explaining what the product does. That came from
 * copying the surface of two marketing references rather than their
 * principles. Someone opening this screen for the twentieth time today needs
 * the work and the way in, not the pitch.
 */
export default function CountriesPage() {
  const live = RUNS.filter((r) => r.state === "live").length;
  const obligations = filingsLive(RUNS);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-text">
            Countries
          </h1>
          <p className="mt-0.5 text-[13px] text-text-muted">
            <span className="tabular-nums">{RUNS.length}</span> jurisdictions ·{" "}
            <span className="tabular-nums">{live}</span> live in Comply ·{" "}
            <span className="tabular-nums">{obligations}</span> obligations
            filing
          </p>
        </div>

        <Button variant="primary" asChild>
          <Link href="/countries/new">
            <Plus />
            Onboard country
          </Link>
        </Button>
      </header>

      <div className="mt-7">
        <CountryList />
      </div>
    </div>
  );
}
