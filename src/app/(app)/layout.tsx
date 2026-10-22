import { Sidebar } from "@/components/app-shell/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
