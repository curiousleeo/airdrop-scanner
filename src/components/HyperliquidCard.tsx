"use client";
import { motion } from "framer-motion";
import AsciiBar from "./AsciiBar";
import { TierVerdict, AnimatedScore } from "./TerminalScore";

interface DetectedProtocol {
  name: string;
  category: string;
}

interface HyperEVMStats {
  wallet: string;
  txCount: number;
  hypeBalance: number;
  tokenCount: number;
  uniqueContracts: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  walletAge: number;
  score: number;
  tier: "legendary" | "high" | "medium" | "low" | "none";
  detectedProtocols?: DetectedProtocol[];
  error?: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  DEX: "rgba(170,255,0,0.85)",
  Lending: "rgba(80,200,255,0.85)",
  CDP: "rgba(255,200,60,0.85)",
  LST: "rgba(200,150,255,0.85)",
  Bridge: "rgba(255,120,80,0.85)",
  Native: "rgba(170,255,0,0.5)",
};

function fmtAge(d: number): string {
  if (d >= 365) return `${Math.floor(d / 365)}Y ${d % 365}D`;
  if (d >= 30) return `${Math.floor(d / 30)}M ${d % 30}D`;
  return `${d}D`;
}

export default function HyperliquidCard({ stats, delay = 0 }: { stats: HyperEVMStats; delay?: number }) {
  const txScore =
    stats.txCount >= 100 ? 60 :
    stats.txCount >= 50 ? 45 :
    stats.txCount >= 20 ? 30 :
    stats.txCount >= 6 ? 20 :
    stats.txCount >= 1 ? 10 : 0;

  const contractScore =
    stats.uniqueContracts >= 10 ? 20 :
    stats.uniqueContracts >= 5 ? 15 :
    stats.uniqueContracts >= 3 ? 10 :
    stats.uniqueContracts >= 1 ? 5 : 0;

  const tokenScore =
    stats.tokenCount >= 5 ? 10 :
    stats.tokenCount >= 3 ? 7 :
    stats.tokenCount >= 1 ? 4 : 0;

  const protocols = stats.detectedProtocols ?? [];

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
        <span className="text-lime font-bold text-sm">■ HYPEREVM</span>
        <span className="text-xs" style={{ color: "rgba(170,255,0,0.4)" }}>ECOSYSTEM ACTIVITY</span>
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

            <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />

            {/* Data rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px" }}>
              <DataRow label="TRANSACTIONS" value={stats.txCount > 0 ? stats.txCount.toLocaleString() : "—"} />
              <DataRow label="PROTOCOLS USED" value={stats.uniqueContracts > 0 ? `${stats.uniqueContracts} CONTRACTS` : "—"} />
              <DataRow label="TOKENS HELD" value={stats.tokenCount > 0 ? `${stats.tokenCount} TOKENS` : "—"} />
              <DataRow
                label="HYPE BALANCE"
                value={stats.hypeBalance > 0 ? `${stats.hypeBalance.toLocaleString()} HYPE` : "—"}
                highlight={stats.hypeBalance > 0}
              />
              <DataRow label="WALLET AGE" value={stats.walletAge > 0 ? fmtAge(stats.walletAge) : "—"} />
              {stats.firstTxDate && <DataRow label="FIRST TX" value={stats.firstTxDate} />}
              {stats.lastTxDate && <DataRow label="LAST TX" value={stats.lastTxDate} />}
            </div>

            {/* Protocol badges */}
            {protocols.length > 0 && (
              <>
                <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />
                <div className="text-xs text-muted mb-2">DETECTED PROTOCOLS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {protocols.map((p) => (
                    <span
                      key={p.name}
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        border: `1px solid ${CATEGORY_COLOR[p.category] ?? "rgba(170,255,0,0.4)"}`,
                        color: CATEGORY_COLOR[p.category] ?? "rgba(170,255,0,0.8)",
                        background: `${(CATEGORY_COLOR[p.category] ?? "rgba(170,255,0,0.1)").replace("0.85", "0.08").replace("0.5", "0.05")}`,
                        letterSpacing: "0.08em",
                        fontFamily: "inherit",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                      <span style={{ opacity: 0.5, marginLeft: 4, fontSize: 9 }}>{p.category}</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid rgba(170,255,0,0.08)", margin: "12px 0" }} />

            {/* Score breakdown */}
            <div className="text-xs text-muted mb-2">SCORE BREAKDOWN</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
              <BarRow label="TX COUNT" value={txScore} max={60} />
              <BarRow label="PROTOCOLS" value={contractScore} max={20} />
              <BarRow label="TOKENS" value={tokenScore} max={10} />
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
      style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", borderBottom: "1px solid rgba(170,255,0,0.04)" }}
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
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ color: "rgba(200,232,168,0.4)", minWidth: 68 }}>{label}</span>
      <AsciiBar value={value} max={max} width={16} />
      <span className="text-lime" style={{ minWidth: 32, textAlign: "right" }}>{value}</span>
      <span className="text-dim">/{max}</span>
    </div>
  );
}
