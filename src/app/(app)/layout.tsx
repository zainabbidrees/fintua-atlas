import type * as React from "react";
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
        /* Top right, clear of the pinned footer's primary button below. A toast
           can still sit over a control, so every one carries a cross to clear
           it straight away. */
        position="top-right"
        closeButton
        /* Wider than Sonner's 356px and set in a larger size, so a toast is
           noticed without being hunted for. */
        style={{ "--width": "420px" } as React.CSSProperties}
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface !border !border-border !text-text !rounded-xl !shadow-[var(--shadow-overlay)] !px-5 !py-4 !gap-3",
            title: "!text-[15px] !font-medium !leading-6",
            description: "!text-[13px] !text-text-muted",
            actionButton: "!h-8 !px-3 !text-[13px] !font-medium !rounded-md",
            closeButton:
              "!bg-surface !border !border-border-strong !text-text-muted hover:!bg-wash hover:!text-text",
          },
        }}
      />
    </div>
  );
}
