import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Mona Sans, self-hosted. Variable across weight and optical size, so one file
 * covers every weight we use (400/500/600) without extra requests.
 * SIL Open Font License — see src/fonts/OFL.txt.
 */
const monaSans = localFont({
  src: "../fonts/MonaSans.woff2",
  variable: "--font-mona-sans",
  display: "swap",
  weight: "200 900",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});

const monaSansMono = localFont({
  src: "../fonts/MonaSansMono.woff2",
  variable: "--font-mona-sans-mono",
  display: "swap",
  weight: "200 900",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
});

export const metadata: Metadata = {
  title: "Fintua ATLAS",
  description: "Country onboarding for the Fintua Comply platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${monaSansMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
