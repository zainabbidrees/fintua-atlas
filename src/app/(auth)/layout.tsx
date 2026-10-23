/**
 * Centred, single column. The only thing on screen is the way in.
 *
 * 100dvh rather than h-screen: iOS Safari's collapsing toolbar makes vh jump,
 * which on a centred layout visibly shifts the form mid-interaction.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-canvas px-6 py-12 sm:px-12">
      <main className="w-full max-w-[21rem]">{children}</main>
    </div>
  );
}
