"use client";
import { motion } from "framer-motion";
import AsciiBar from "./AsciiBar";
import { TierVerdict, AnimatedScore } from "./TerminalScore";

interface HyperliquidStats {
  wallet: string;
  totalVolumeUSD: number;
  lifetimePnl: number;
  totalFeesPaid: number;
  activeDayCount: number;
  firstActiveDate: string | null;
  lastActiveDate: string | null;
  walletAge: number;
  hypeBalance: number;
  receivedS1Airdrop: boolean;
  openPositions: number;
  score: number;
  tier: "legendary" | "high" | "medium" | "low" | "none";
  error?: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPnl(n: number): string {
  const abs = Math.abs(n);
  const prefix = n >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(1)}K`;
  return `${prefix}$${abs.toFixed(2)}`;
}

export default function HyperliquidCard({ stats, delay = 0 }: { stats: HyperliquidStats; delay?: number }) {
  const volScore = stats.totalVolumeUSD >= 1_000_000 ? 65 :
    stats.totalVolumeUSD >= 200_000 ? 50 :
    stats.totalVolumeUSD >= 50_000 ? 35 :
    stats.totalVolumeUSD >= 10_000 ? 20 :
    stats.totalVolumeUSD >= 1_000 ? 10 : 0;

  const dayScore = stats.activeDayCount >= 60 ? 20 :
    stats.activeDayCount >= 30 ? 15 :
    stats.activeDayCount >= 15 ? 10 :
    stats.activeDayCount >= 5 ? 5 : 0;

  const hypeScore = stats.hypeBalance >= 1000 ? 15 :
    stats.hypeBalance >= 100 ? 10 :
    stats.hypeBalance >= 10 ? 5 : 0;

  const pnlColor = stats.lifetimePnl >= 0 ? "var(--lime)" : "var(--red)";

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="text-lime font-bold text-sm">■ HYPERLIQUID (HYPE)</span>
          {stats.receivedS1Airdrop && (
            <span
              className="text-xs"
              style={{
                color: "var(--lime)",
                border: "1px solid rgba(170,255,0,0.3)",
                padding: "1px 6px",
                background: "rgba(170,255,0,0.06)",
              }}
            >
              S1 RECEIVED
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: "rgba(170,255,0,0.4)" }}>SEASON 2 ACTIVE</span>
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
              <DataRow label="PERP VOLUME" value={fmt(stats.totalVolumeUSD)} />
              <DataRow label="ACTIVE DAYS" value={stats.activeDayCount.toLocaleString()} />
              <DataRow
                label="LIFETIME P&L"
                value={stats.lifetimePnl !== 0 ? fmtPnl(stats.lifetimePnl) : "—"}
                valueColor={stats.lifetimePnl !== 0 ? pnlColor : undefined}
              />
              <DataRow
                label="HYPE BALANCE"
                value={stats.hypeBalance > 0 ? `${stats.hypeBalance.toLocaleString()} HYPE` : "—"}
                highlight={stats.hypeBalance > 0}
              />
              {stats.openPositions > 0 && (
                <DataRow label="OPEN POSITIONS" value={`${stats.openPositions} ACTIVE`} highlight />
              )}
              {stats.firstActiveDate && (
                <DataRow label="FIRST ACTIVE" value={stats.firstActiveDate} />
              )}
              {stats.lastActiveDate && (
                <DataRow label="LAST ACTIVE" value={stats.lastActiveDate} />
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />

            {/* Score breakdown */}
            <div className="text-xs text-muted mb-2">SCORE BREAKDOWN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
              <BarRow label="VOLUME" value={volScore} max={65} />
              <BarRow label="DAYS" value={dayScore} max={20} />
              <BarRow label="HYPE" value={hypeScore} max={15} />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function DataRow({
  label, value, highlight, valueColor,
}: {
  label: string; value: string; highlight?: boolean; valueColor?: string;
}) {
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
      <span style={{ color: valueColor ?? (highlight ? "var(--lime)" : "var(--text)"), fontWeight: highlight ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ color: "rgba(200,232,168,0.4)", minWidth: 68 }}>{label}</span>
      <AsciiBar value={value} max={max} width={16} />
      <span className="text-lime" style={{ minWidth: 32, textAlign: "right" }}>{value}</span>
      <span className="text-dim">/{max}</span>
    </div>
  );
}
