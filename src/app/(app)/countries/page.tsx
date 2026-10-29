import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountryList } from "@/features/countries/country-list";
import { CountrySummary } from "@/features/countries/country-summary";

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
  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div>
            <h1 className="text-[20px] font-medium tracking-tight text-heading">
              Countries
            </h1>
            <CountrySummary />
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
    </div>
  );
}
