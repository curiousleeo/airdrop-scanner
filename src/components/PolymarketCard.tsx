"use client";
import { motion } from "framer-motion";
import AsciiBar from "./AsciiBar";
import { TierVerdict, AnimatedScore } from "./TerminalScore";

interface PolymarketStats {
  wallet: string;
  totalVolumeUSDC: number;
  marketsTraded: number;
  totalTrades: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
  openPositions: number;
  walletAge: number;
  score: number;
  tier: "legendary" | "high" | "medium" | "low" | "none";
  error?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtAge(d: number): string {
  if (d >= 365) return `${Math.floor(d / 365)}Y ${d % 365}D`;
  if (d >= 30) return `${Math.floor(d / 30)}M ${d % 30}D`;
  return `${d}D`;
}

export default function PolymarketCard({ stats, delay = 0 }: { stats: PolymarketStats; delay?: number }) {
  const volScore = stats.totalVolumeUSDC >= 100000 ? 65 :
    stats.totalVolumeUSDC >= 25000 ? 50 :
    stats.totalVolumeUSDC >= 5000 ? 35 :
    stats.totalVolumeUSDC >= 1000 ? 20 :
    stats.totalVolumeUSDC >= 100 ? 10 : 0;

  const mktScore = stats.marketsTraded >= 100 ? 20 :
    stats.marketsTraded >= 50 ? 15 :
    stats.marketsTraded >= 20 ? 10 :
    stats.marketsTraded >= 5 ? 5 : 0;

  const ageScore = stats.walletAge >= 180 ? 15 :
    stats.walletAge >= 90 ? 10 :
    stats.walletAge >= 30 ? 5 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{ border: "1px solid rgba(170,255,0,0.18)", background: "var(--surface)" }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(170,255,0,0.1)",
          background: "rgba(170,255,0,0.04)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className="text-lime font-bold text-sm">■ POLYMARKET (POLY)</span>
        <span className="text-xs" style={{ color: "rgba(170,255,0,0.4)" }}>AIRDROP 2026 · POLYGON</span>
      </div>

      <div style={{ padding: "16px" }}>
        {stats.error ? (
          <div className="text-red text-sm">{">"} ERROR: {stats.error}</div>
        ) : (
          <>
            {/* Score + verdict */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ textAlign: "center", minWidth: 64 }}>
                <div className="text-xs text-muted mb-1">SCORE</div>
                <div className="text-4xl font-bold text-lime" style={{ lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  <AnimatedScore score={stats.score} />
                </div>
                <div className="text-xs text-muted">/100</div>
              </div>
              <div style={{ flex: 1 }}>
                <TierVerdict tier={stats.tier} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />

            {/* Data rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
              <DataRow label="USDC VOLUME" value={fmt(stats.totalVolumeUSDC)} />
              <DataRow label="MARKETS" value={stats.marketsTraded.toLocaleString()} />
              <DataRow label="TRADES" value={stats.totalTrades.toLocaleString()} />
              <DataRow label="WALLET AGE" value={stats.walletAge > 0 ? fmtAge(stats.walletAge) : "—"} />
              {stats.openPositions > 0 && (
                <DataRow label="OPEN POSITIONS" value={`${stats.openPositions} ACTIVE`} highlight />
              )}
              {stats.firstTradeDate && (
                <DataRow label="FIRST TRADE" value={stats.firstTradeDate} />
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />

            {/* Score breakdown */}
            <div className="text-xs text-muted mb-2">SCORE BREAKDOWN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
              <BarRow label="VOLUME" value={volScore} max={65} />
              <BarRow label="MARKETS" value={mktScore} max={20} />
              <BarRow label="AGE" value={ageScore} max={15} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function DataRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="data-row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "3px 4px",
        borderBottom: "1px solid rgba(170,255,0,0.04)",
      }}
    >
      <span style={{ color: "rgba(200,232,168,0.45)", minWidth: 140 }}>{label}</span>
      <span style={{ color: highlight ? "var(--lime)" : "var(--text)", fontWeight: highlight ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 52px", alignItems: "center", gap: "8px" }}>
      <span style={{ color: "rgba(200,232,168,0.4)" }}>{label}</span>
      <div style={{ overflow: "hidden" }}>
        <AsciiBar value={value} max={max} width={14} />
      </div>
      <span className="text-lime" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {value}<span className="text-dim">/{max}</span>
      </span>
    </div>
  );
}
