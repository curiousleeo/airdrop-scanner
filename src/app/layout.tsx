import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "AIRDROP SCANNER — Polymarket × Hyperliquid",
  description:
    "Check your wallet eligibility for Polymarket POLY and Hyperliquid Season 2. Paste address. No connection required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={mono.variable}>{children}</body>
    </html>
  );
}
