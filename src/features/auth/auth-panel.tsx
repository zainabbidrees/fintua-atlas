import { ShieldCheck, FileSearch, GitBranch } from "lucide-react";
import { DotTexture, Wordmark } from "@/components/brand/logo";

const POINTS = [
  {
    icon: FileSearch,
    title: "Research that shows its working",
    body: "Every filing arrives with the source it came from, and the date that source was last updated.",
  },
  {
    icon: ShieldCheck,
    title: "Your judgement, recorded",
    body: "Each decision keeps the reason behind it — the knowledge stays with the country, not in someone's head.",
  },
  {
    icon: GitBranch,
    title: "Nothing ships unreviewed",
    body: "Anything the research isn't sure about is held back until a tax expert has ruled on it.",
  },
];

/**
 * The deep brand panel. Flat colour plus a fine dot texture — depth without the
 * gradient sheen the brand direction rules out.
 */
export function AuthPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-deep p-12 lg:flex lg:flex-col">
      <DotTexture className="text-on-deep/[0.07]" />

      <div className="relative">
        <Wordmark tone="on-deep" />
      </div>

      <div className="relative mt-auto max-w-md">
        <h2 className="text-[32px] font-semibold leading-[1.15] tracking-tight text-on-deep">
          Add a country in days,
          <br />
          not weeks.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-deep-text">
          Atlas researches a jurisdiction&apos;s filings, deadlines and rules, and
          brings them to you with the evidence attached. You decide what&apos;s right.
        </p>

        <ul className="mt-10 space-y-6">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-deep-border bg-deep-raised">
                <Icon className="size-4 text-on-deep" />
              </span>
              <div>
                <p className="text-sm font-medium text-on-deep">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-deep-text-faint">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-12 text-xs text-deep-text-faint">
        Internal tool · Fintua Comply
      </p>
    </aside>
  );
}
