import { AuthPanel } from "@/features/auth/auth-panel";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthPanel />
      <main>{children}</main>
    </div>
  );
}
