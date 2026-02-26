import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700", "800"],
});

const SITE_URL = "https://airdrop-scanner.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Airdrop Scanner — Polymarket × HyperEVM Eligibility Checker",
    template: "%s | Airdrop Scanner",
  },
  description:
    "Check if your wallet qualifies for the Polymarket POLY or HyperEVM ecosystem airdrops. Paste any wallet address or ENS name — no connection required. Batch scan up to 10 wallets.",
  keywords: [
    "airdrop checker",
    "airdrop scanner",
    "Polymarket airdrop",
    "POLY token airdrop",
    "HyperEVM airdrop",
    "Hyperliquid airdrop",
    "HYPE airdrop",
    "wallet eligibility checker",
    "crypto airdrop 2025",
    "ENS wallet checker",
    "HyperSwap airdrop",
    "Felix protocol airdrop",
    "HyperLend airdrop",
    "on-chain activity checker",
    "DeFi airdrop scanner",
  ],
  authors: [{ name: "Airdrop Scanner" }],
  creator: "Airdrop Scanner",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Airdrop Scanner — Polymarket × HyperEVM Eligibility Checker",
    description:
      "Check if your wallet qualifies for the Polymarket POLY or HyperEVM ecosystem airdrops. No wallet connection required.",
    siteName: "Airdrop Scanner",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Airdrop Scanner — Check your wallet eligibility",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airdrop Scanner — Polymarket × HyperEVM",
    description:
      "Check if your wallet qualifies for the Polymarket POLY or HyperEVM ecosystem airdrops. No connection required.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Airdrop Scanner",
  url: SITE_URL,
  description:
    "Check wallet eligibility for Polymarket POLY and HyperEVM ecosystem airdrops. Supports ENS names and batch scanning up to 10 wallets.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Polymarket POLY airdrop eligibility check",
    "HyperEVM ecosystem activity score",
    "ENS name resolution",
    "Batch scan up to 10 wallets",
    "No wallet connection required",
    "Named protocol detection: HyperSwap, KittenSwap, HyperLend, Felix",
  ],
  keywords:
    "airdrop checker, Polymarket airdrop, HyperEVM airdrop, POLY token, HYPE token, wallet eligibility",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={mono.variable}>{children}</body>
    </html>
  );
}
