"use client";
import { motion } from "framer-motion";

type Tier = "legendary" | "high" | "medium" | "low" | "none";

interface WalletResult {
  input: string; // original input (could be ENS or address)
  address: string;
  polyScore: number;
  polyTier: Tier;
  hlScore: number;
  hlTier: Tier;
  combinedScore: number;
  polyError?: string;
  hlError?: string;
}

const TIER_COLOR: Record<Tier, string> = {
  legendary: "var(--lime)",
  high: "var(--lime)",
  medium: "var(--amber)",
  low: "var(--amber)",
  none: "var(--red)",
};

const TIER_LABEL: Record<Tier, string> = {
  legendary: "★ LEGENDARY",
  high: "▲ HIGH",
  medium: "● MEDIUM",
  low: "▼ LOW",
  none: "✕ NONE",
};

function TierCell({ tier }: { tier: Tier }) {
  return (
    <span style={{ color: TIER_COLOR[tier], fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
      {TIER_LABEL[tier]}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 10);
  return (
    <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--lime)", opacity: 0.7 }}>
      {"█".repeat(filled)}{"░".repeat(10 - filled)}
    </span>
  );
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function BatchResults({
  results,
  onReset,
}: {
  results: WalletResult[];
  onReset: () => void;
}) {
  const sorted = [...results].sort((a, b) => b.combinedScore - a.combinedScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div className="text-dim" style={{ fontSize: 11, marginBottom: 4 }}>
            BATCH SCAN COMPLETE · {results.length} WALLET{results.length !== 1 ? "S" : ""}
          </div>
          <div className="text-lime font-bold" style={{ fontSize: 13 }}>
            RANKED BY COMBINED SCORE
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            fontSize: 12,
            padding: "5px 14px",
            border: "1px solid rgba(170,255,0,0.2)",
            background: "rgba(170,255,0,0.04)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.08em",
          }}
        >
          ← NEW SCAN
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid rgba(170,255,0,0.15)",
          background: "var(--surface)",
          overflowX: "auto",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1fr 130px 130px 130px",
            borderBottom: "1px solid rgba(170,255,0,0.12)",
            background: "rgba(170,255,0,0.04)",
            padding: "6px 14px",
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "rgba(170,255,0,0.45)",
            gap: 8,
            minWidth: 560,
          }}
        >
          <span>#</span>
          <span>WALLET</span>
          <span>POLYMARKET (POLY)</span>
          <span>HYPEREVM</span>
          <span>COMBINED</span>
        </div>

        {sorted.map((r, i) => (
          <motion.div
            key={r.address}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 130px 130px 130px",
              borderBottom: "1px solid rgba(170,255,0,0.06)",
              padding: "10px 14px",
              gap: 8,
              alignItems: "center",
              minWidth: 560,
              background: i === 0 ? "rgba(170,255,0,0.03)" : "transparent",
            }}
          >
            {/* Rank */}
            <span
              style={{
                fontSize: 11,
                color: i === 0 ? "var(--lime)" : "rgba(170,255,0,0.3)",
                fontWeight: i === 0 ? 700 : 400,
              }}
            >
              {i + 1}
            </span>

            {/* Wallet */}
            <div style={{ overflow: "hidden" }}>
              {r.input !== r.address && (
                <div style={{ fontSize: 13, color: "var(--lime)", fontWeight: 600, marginBottom: 1 }}>
                  {r.input}
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {shortAddr(r.address)}
              </div>
            </div>

            {/* Polymarket */}
            <div>
              {r.polyError ? (
                <span style={{ fontSize: 11, color: "var(--red)" }}>ERROR</span>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span className="text-lime font-bold" style={{ fontSize: 14, minWidth: 28 }}>
                      {r.polyScore}
                    </span>
                    <span className="text-dim" style={{ fontSize: 10 }}>/100</span>
                  </div>
                  <ScoreBar score={r.polyScore} />
                  <div style={{ marginTop: 2 }}>
                    <TierCell tier={r.polyTier} />
                  </div>
                </>
              )}
            </div>

            {/* Hyperliquid */}
            <div>
              {r.hlError ? (
                <span style={{ fontSize: 11, color: "var(--red)" }}>ERROR</span>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span className="text-lime font-bold" style={{ fontSize: 14, minWidth: 28 }}>
                      {r.hlScore}
                    </span>
                    <span className="text-dim" style={{ fontSize: 10 }}>/100</span>
                  </div>
                  <ScoreBar score={r.hlScore} />
                  <div style={{ marginTop: 2 }}>
                    <TierCell tier={r.hlTier} />
                  </div>
                </>
              )}
            </div>

            {/* Combined */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: i === 0 ? "var(--lime)" : "var(--text)",
                    minWidth: 28,
                  }}
                >
                  {r.combinedScore}
                </span>
                <span className="text-dim" style={{ fontSize: 10 }}>/100</span>
              </div>
              <ScoreBar score={r.combinedScore} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-dim"
        style={{ fontSize: 11, marginTop: 16, lineHeight: 1.8 }}
      >
        ─────────────────────────────────────────────────────────────────────<br />
        DISCLAIMER: SCORES ARE ESTIMATES BASED ON PUBLIC ON-CHAIN DATA.<br />
        FINAL ELIGIBILITY DETERMINED SOLELY BY POLYMARKET AND HYPERLIQUID TEAMS.<br />
        ─────────────────────────────────────────────────────────────────────
      </motion.div>
    </motion.div>
  );
}

export type { WalletResult };
