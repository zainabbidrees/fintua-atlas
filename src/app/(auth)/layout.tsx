import { DotTexture } from "@/components/brand/logo";

/**
 * Centred, single column. The only thing on screen is the way in.
 *
 * 100dvh rather than h-screen: iOS Safari's collapsing toolbar makes vh jump,
 * which on a centred layout visibly shifts the form mid-interaction.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-canvas px-6 py-12">
      {/* Fixed and non-interactive, so it never repaints with scroll. */}
      <DotTexture className="fixed inset-0 text-text/[0.035]" />
      <main className="relative w-full max-w-[21rem]">{children}</main>
    </div>
  );
}
