import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "AIRDROP SCANNER — Polymarket × HyperEVM",
  description:
    "Check your wallet eligibility for Polymarket POLY and HyperEVM ecosystem airdrops. Paste address. No connection required.",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/app-icon.png" type="image/png" />
        <link rel="shortcut icon" href="/app-icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
      </head>
      <body className={mono.variable}>{children}</body>
    </html>
  );
}
