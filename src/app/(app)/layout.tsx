import { Toaster } from "sonner";
import { Sidebar } from "@/components/app-shell/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
      {/* Brief confirmation after a row action. Neutral by design — colour on
          the page means "needs a decision", and a toast needs none. */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface !border !border-border !text-text !rounded-lg !shadow-[var(--shadow-overlay)]",
            description: "!text-text-muted",
          },
        }}
      />
    </div>
  );
}
