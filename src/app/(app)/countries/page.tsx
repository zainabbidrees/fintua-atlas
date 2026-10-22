import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttentionPanel } from "@/features/countries/attention-panel";
import { CountryList } from "@/features/countries/country-list";
import { RUNS, spell } from "@/features/countries/data";

export default function CountriesPage() {
  const live = RUNS.filter((r) => r.state === "live").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:py-14">
      {/* Editorial header: eyebrow, two-tone headline, supporting text pushed right. */}
      <header className="grid gap-x-12 gap-y-6 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-faint">
            <span aria-hidden className="size-1 rounded-full bg-brand" />
            Coverage
          </p>

          <h1 className="mt-4 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-tight">
            <span className="text-text">{spell(RUNS.length)} jurisdictions.</span>
            <br />
            <span className="text-text-faint">
              {spell(live)} live in Comply.
            </span>
          </h1>
        </div>

        <div className="flex flex-col items-start gap-5 lg:pt-14">
          <p className="max-w-[46ch] text-sm leading-relaxed text-text-muted">
            Each country is researched, reviewed by a tax expert and approved
            twice before it files anything. Open one to see where it stands and
            what it still needs.
          </p>
          <Button variant="primary" asChild>
            <Link href="/countries/new">
              <Plus />
              Add a country
            </Link>
          </Button>
        </div>
      </header>

      {/* Asymmetric split: the list carries the weight, the panel holds the right. */}
      <div className="mt-14 grid gap-x-12 gap-y-10 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <CountryList />
        <AttentionPanel />
      </div>
    </div>
  );
}
