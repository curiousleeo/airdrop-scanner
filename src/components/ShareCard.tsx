"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tier = "legendary" | "high" | "medium" | "low" | "none";

interface ShareCardProps {
  wallet: string;
  ensName?: string | null;
  polyScore: number;
  polyTier: Tier;
  hyperEvmScore: number;
  hyperEvmTier: Tier;
}

const TIER_LABEL: Record<Tier, string> = {
  legendary: "★ LEGENDARY",
  high: "▲ HIGH",
  medium: "● MEDIUM",
  low: "▼ LOW",
  none: "✕ NONE",
};

const TIER_COLOR: Record<Tier, string> = {
  legendary: "var(--lime)",
  high: "var(--lime)",
  medium: "var(--amber)",
  low: "var(--amber)",
  none: "var(--red)",
};

function ScoreBar({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 12);
  return (
    <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--lime)", opacity: 0.8 }}>
      {"█".repeat(filled)}{"░".repeat(12 - filled)}
    </span>
  );
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function ShareCard({ wallet, ensName, polyScore, polyTier, hyperEvmScore, hyperEvmTier }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const combined = Math.round((polyScore + hyperEvmScore) / 2);
  const display = ensName ?? shortAddr(wallet);

  const shareText =
`🔍 AIRDROP SCANNER RESULTS

Wallet: ${display}

📊 POLYMARKET (POLY)
   Score: ${polyScore}/100 — ${TIER_LABEL[polyTier]}
   ${"█".repeat(Math.round(polyScore / 10))}${"░".repeat(10 - Math.round(polyScore / 10))}

⛓ HYPEREVM
   Score: ${hyperEvmScore}/100 — ${TIER_LABEL[hyperEvmTier]}
   ${"█".repeat(Math.round(hyperEvmScore / 10))}${"░".repeat(10 - Math.round(hyperEvmScore / 10))}

⚡ COMBINED SCORE: ${combined}/100

Check yours → airdrop-scanner.vercel.app
#Polymarket #HyperEVM #Airdrop #Crypto`;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: 12,
          padding: "5px 14px",
          border: "1px solid rgba(170,255,0,0.2)",
          background: "rgba(170,255,0,0.06)",
          color: "var(--lime)",
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.08em",
        }}
      >
        ↗ SHARE
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                border: "1px solid rgba(170,255,0,0.25)",
                background: "var(--bg)",
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  borderBottom: "1px solid rgba(170,255,0,0.1)",
                  padding: "8px 16px",
                  background: "rgba(170,255,0,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span className="text-lime" style={{ fontSize: 11, fontWeight: 700 }}>▶ SHARE RESULTS</span>
                <button
                  onClick={() => setOpen(false)}
                  style={{ fontSize: 14, color: "rgba(170,255,0,0.4)", cursor: "pointer", fontFamily: "inherit", background: "none", border: "none" }}
                >
                  ✕
                </button>
              </div>

              {/* Card body */}
              <div style={{ padding: "20px 20px 16px" }}>
                {/* Wallet */}
                <div style={{ marginBottom: 20 }}>
                  <div className="text-dim" style={{ fontSize: 10, marginBottom: 4 }}>WALLET</div>
                  <div style={{ fontSize: 13, color: "var(--lime)", fontFamily: "monospace" }}>{display}</div>
                  {ensName && (
                    <div className="text-dim" style={{ fontSize: 10, marginTop: 2 }}>{shortAddr(wallet)}</div>
                  )}
                </div>

                {/* Score rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  {/* Polymarket */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span className="text-dim" style={{ fontSize: 11 }}>POLYMARKET (POLY)</span>
                      <span style={{ color: TIER_COLOR[polyTier], fontSize: 11, fontWeight: 700 }}>
                        {TIER_LABEL[polyTier]}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ScoreBar score={polyScore} />
                      <span className="text-lime font-bold" style={{ fontSize: 13 }}>{polyScore}<span className="text-dim" style={{ fontSize: 10 }}>/100</span></span>
                    </div>
                  </div>

                  {/* HyperEVM */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span className="text-dim" style={{ fontSize: 11 }}>HYPEREVM</span>
                      <span style={{ color: TIER_COLOR[hyperEvmTier], fontSize: 11, fontWeight: 700 }}>
                        {TIER_LABEL[hyperEvmTier]}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ScoreBar score={hyperEvmScore} />
                      <span className="text-lime font-bold" style={{ fontSize: 13 }}>{hyperEvmScore}<span className="text-dim" style={{ fontSize: 10 }}>/100</span></span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)" }} />

                  {/* Combined */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-dim" style={{ fontSize: 11 }}>COMBINED SCORE</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "var(--lime)" }}>
                      {combined}<span className="text-dim" style={{ fontSize: 12 }}>/100</span>
                    </span>
                  </div>
                </div>

                {/* Powered by */}
                <div className="text-dim" style={{ fontSize: 10, textAlign: "center", marginBottom: 16, letterSpacing: "0.1em" }}>
                  POWERED BY GTR TRADE · AIRDROP SCANNER
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleCopy}
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: "8px 0",
                      border: "1px solid rgba(170,255,0,0.2)",
                      background: copied ? "rgba(170,255,0,0.12)" : "rgba(170,255,0,0.04)",
                      color: copied ? "var(--lime)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.08em",
                      transition: "all 0.15s",
                    }}
                  >
                    {copied ? "✓ COPIED" : "⎘ COPY TEXT"}
                  </button>
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: "8px 0",
                      border: "1px solid rgba(170,255,0,0.2)",
                      background: "rgba(170,255,0,0.04)",
                      color: "var(--lime)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.08em",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    𝕏 SHARE ON X
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
