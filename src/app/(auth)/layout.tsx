import { BrandPanel } from "@/features/auth/brand-panel";

/**
 * Two halves on a wide screen: the brand panel, built from the logo, and the
 * way in. Below lg the panel steps aside and the form stands alone, centred.
 *
 * 100dvh rather than h-screen: iOS Safari's collapsing toolbar makes vh jump,
 * which on a centred layout visibly shifts the form mid-interaction.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[100dvh] bg-canvas lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <BrandPanel className="hidden lg:flex" />
      <div className="grid place-items-center px-6 py-12 sm:px-12">
        <main className="w-full max-w-[21rem]">{children}</main>
      </div>
    </div>
  );
}
