"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import PolymarketCard from "@/components/PolymarketCard";
import HyperliquidCard from "@/components/HyperliquidCard";
import BatchResults, { WalletResult } from "@/components/BatchResults";
import ShareCard from "@/components/ShareCard";

type Tier = "legendary" | "high" | "medium" | "low" | "none";

interface PolymarketResult {
  wallet: string;
  totalVolumeUSDC: number;
  marketsTraded: number;
  totalTrades: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
  openPositions: number;
  walletAge: number;
  score: number;
  tier: Tier;
  error?: string;
}

interface HyperEVMResult {
  wallet: string;
  txCount: number;
  hypeBalance: number;
  tokenCount: number;
  uniqueContracts: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  walletAge: number;
  score: number;
  tier: Tier;
  error?: string;
}

interface SingleResults {
  polymarket: PolymarketResult;
  hyperliquid: HyperEVMResult;
  wallet: string;
}

const MAX_WALLETS = 10;

function isValidEthAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a.trim());
}

function isENS(a: string) {
  return a.trim().toLowerCase().endsWith(".eth") || (a.includes(".") && !a.startsWith("0x"));
}

function OverallVerdict({ poly, hl }: { poly: number; hl: number }) {
  const avg = Math.round((poly + hl) / 2);
  if (avg >= 75) return <span style={{ color: "var(--lime)" }}>COMBINED STANDING: LEGENDARY — TOP PERCENTILE CONFIRMED</span>;
  if (avg >= 50) return <span style={{ color: "var(--lime)" }}>COMBINED STANDING: HIGH — STRONG ELIGIBILITY ACROSS BOTH</span>;
  if (avg >= 25) return <span style={{ color: "var(--amber)" }}>COMBINED STANDING: MEDIUM — INCREASE ACTIVITY TO IMPROVE</span>;
  if (avg >= 10) return <span style={{ color: "var(--amber)" }}>COMBINED STANDING: LOW — POSITION BUILDING REQUIRED</span>;
  return <span style={{ color: "var(--red)" }}>COMBINED STANDING: NONE — NO SIGNIFICANT ACTIVITY FOUND</span>;
}

function parseInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, MAX_WALLETS);
}

async function resolveEntry(entry: string): Promise<{ input: string; address: string | null; error?: string }> {
  if (isValidEthAddress(entry)) return { input: entry, address: entry };
  if (isENS(entry)) {
    try {
      const res = await fetch(`/api/ens?name=${encodeURIComponent(entry)}`);
      const data = await res.json();
      if (data.address) return { input: entry, address: data.address };
      return { input: entry, address: null, error: data.error ?? "Not found" };
    } catch {
      return { input: entry, address: null, error: "ENS resolution failed" };
    }
  }
  return { input: entry, address: null, error: "Invalid address or ENS name" };
}

async function scanWallet(address: string): Promise<{ poly: PolymarketResult; hl: HyperEVMResult }> {
  const [polyRes, hlRes] = await Promise.allSettled([
    fetch(`/api/polymarket?wallet=${address}`).then((r) => r.json()),
    fetch(`/api/hyperevm?wallet=${address}`).then((r) => r.json()),
  ]);
  return {
    poly: polyRes.status === "fulfilled"
      ? (polyRes.value as PolymarketResult)
      : ({ error: "REQUEST FAILED", wallet: address, score: 0, tier: "none" } as PolymarketResult),
    hl: hlRes.status === "fulfilled"
      ? (hlRes.value as HyperEVMResult)
      : ({ error: "REQUEST FAILED", wallet: address, score: 0, tier: "none" } as HyperEVMResult),
  };
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [singleResults, setSingleResults] = useState<SingleResults | null>(null);
  const [batchResults, setBatchResults] = useState<WalletResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "results">("idle");
  const [loadLog, setLoadLog] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const addLog = useCallback((line: string) => {
    setLoadLog((prev) => [...prev, line]);
  }, []);

  const check = useCallback(async (raw: string) => {
    const entries = parseInput(raw);
    if (entries.length === 0) {
      setError("NO VALID INPUT — PASTE A WALLET ADDRESS OR ENS NAME");
      return;
    }
    setError(null);
    setLoading(true);
    setLoadLog([]);
    setSingleResults(null);
    setBatchResults(null);
    setPhase("loading");

    addLog(`> FOUND ${entries.length} ENTR${entries.length === 1 ? "Y" : "IES"}`);

    const resolved: Array<{ input: string; address: string | null; error?: string }> = [];
    for (const entry of entries) {
      if (isValidEthAddress(entry)) {
        resolved.push({ input: entry, address: entry });
        addLog(`> ${entry.slice(0, 10)}...  VALID ADDRESS`);
      } else if (isENS(entry)) {
        addLog(`> RESOLVING ${entry}...`);
        const r = await resolveEntry(entry);
        resolved.push(r);
        if (r.address) addLog(`> ${entry} → ${r.address.slice(0, 10)}...  RESOLVED`);
        else addLog(`> ${entry}  FAILED: ${r.error}`);
      } else {
        resolved.push({ input: entry, address: null, error: "Invalid" });
        addLog(`> ${entry}  INVALID — SKIPPED`);
      }
    }

    const valid = resolved.filter((r) => r.address !== null) as Array<{ input: string; address: string }>;
    if (valid.length === 0) {
      setError("NO VALID ADDRESSES RESOLVED — CHECK YOUR INPUT");
      setPhase("idle");
      setLoading(false);
      return;
    }

    addLog(`> SCANNING ${valid.length} WALLET${valid.length !== 1 ? "S" : ""} ON-CHAIN...`);
    const scanResults = await Promise.all(valid.map((v) => scanWallet(v.address)));
    addLog(`> CALCULATING SCORES...`);

    if (valid.length === 1) {
      const { poly, hl } = scanResults[0];
      setSingleResults({ polymarket: poly, hyperliquid: hl, wallet: valid[0].address });
    } else {
      const batch: WalletResult[] = valid.map((v, i) => {
        const { poly, hl } = scanResults[i];
        const polyScore = poly.error ? 0 : poly.score;
        const hlScore = hl.error ? 0 : hl.score;
        return {
          input: v.input,
          address: v.address,
          polyScore,
          polyTier: poly.error ? "none" : poly.tier,
          hlScore,
          hlTier: hl.error ? "none" : hl.tier,
          combinedScore: Math.round((polyScore + hlScore) / 2),
          polyError: poly.error,
          hlError: hl.error,
        };
      });
      setBatchResults(batch);
    }

    addLog(`> DONE`);
    setTimeout(() => setPhase("results"), 300);
    setLoading(false);
  }, [addLog]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check(input); }
  };

  const reset = () => {
    setPhase("idle");
    setSingleResults(null);
    setBatchResults(null);
    setInput("");
    setError(null);
    setLoadLog([]);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const isBatch = batchResults !== null;
  const entryCount = parseInput(input).length;
  const resolvedInput = singleResults
    ? (parseInput(input)[0] !== singleResults.wallet ? parseInput(input)[0] : null)
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
      }}
    >
      <div className="scanline-sweep" />

      {/* ── Header ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(170,255,0,0.12)",
          background: "var(--surface)",
          padding: "6px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span className="text-lime font-bold">▶ AIRDROP SCANNER v2.2</span>
          <span className="text-dim">POLYMARKET × HYPEREVM</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="text-dim">POLYGON + HL-L1</span>
          <span style={{ color: "var(--lime)" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--lime)", marginRight: 6, animation: "blink 2s step-end infinite" }} />
            ONLINE
          </span>
          <span className="text-dim">READ-ONLY</span>
        </div>
      </div>

      <main style={{ flex: 1, padding: "32px 20px", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero */}
              <div style={{ marginBottom: 40 }}>
                <div className="text-dim" style={{ fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
                  ┌── WALLET ELIGIBILITY SCANNER ───────────────────────────────────────
                </div>

                {/* Horizontal headline */}
                <div
                  style={{
                    fontSize: "clamp(40px, 6vw, 80px)",
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    marginBottom: 20,
                  }}
                >
                  <span className="text-white">ARE YOU </span>
                  <span className="text-lime">IN?</span>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    maxWidth: 560,
                    lineHeight: 1.7,
                    borderLeft: "2px solid rgba(170,255,0,0.3)",
                    paddingLeft: 16,
                  }}
                >
                  Check if your wallet qualifies for the{" "}
                  <span className="text-lime">Polymarket POLY</span> token airdrop
                  {" "}and{" "}
                  <span className="text-lime">HyperEVM</span> ecosystem airdrops.
                  <br />
                  <span className="text-dim" style={{ fontSize: 12 }}>
                    Paste your address — no wallet connection, no signing required.
                  </span>
                </div>
              </div>

              {/* Input block */}
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    border: "1px solid rgba(170,255,0,0.2)",
                    background: "var(--surface)",
                    maxWidth: 700,
                  }}
                >
                  {/* Input header */}
                  <div
                    style={{
                      borderBottom: "1px solid rgba(170,255,0,0.1)",
                      padding: "6px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(170,255,0,0.03)",
                    }}
                  >
                    <span className="text-dim" style={{ fontSize: 11 }}>WALLET_ADDRESS.input</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: "rgba(170,255,0,0.4)" }}>
                      <span>ENS ✓</span>
                      <span>BATCH UP TO {MAX_WALLETS} ✓</span>
                      {entryCount > 1 && (
                        <span style={{ color: "var(--lime)", background: "rgba(170,255,0,0.1)", padding: "1px 7px", border: "1px solid rgba(170,255,0,0.2)" }}>
                          {entryCount} WALLETS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div style={{ padding: "14px 14px 10px", display: "flex", gap: 8 }}>
                    <span className="text-lime" style={{ opacity: 0.5, userSelect: "none", paddingTop: 2, fontSize: 14 }}>{">"}</span>
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setError(null); }}
                      onKeyDown={handleKeyDown}
                      placeholder={"0x1a2b3c...  or  vitalik.eth\n\nPaste multiple wallets, one per line (up to 10)"}
                      rows={3}
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "var(--lime)",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        caretColor: "var(--lime)",
                        resize: "none",
                        lineHeight: 1.7,
                      }}
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>

                  {/* Footer row */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(170,255,0,0.08)",
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span className="text-dim" style={{ fontSize: 10 }}>
                      ENTER ↵ to scan · SHIFT+ENTER for new line
                    </span>
                    <button
                      onClick={() => check(input)}
                      disabled={!input.trim()}
                      style={{
                        fontSize: 12,
                        padding: "5px 16px",
                        background: input.trim() ? "rgba(170,255,0,0.1)" : "transparent",
                        border: `1px solid ${input.trim() ? "rgba(170,255,0,0.3)" : "rgba(170,255,0,0.1)"}`,
                        color: input.trim() ? "var(--lime)" : "rgba(170,255,0,0.25)",
                        cursor: input.trim() ? "pointer" : "default",
                        fontFamily: "inherit",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {entryCount > 1 ? `SCAN ${entryCount} WALLETS ↵` : "SCAN ↵"}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: 12, color: "var(--red)", marginTop: 6, paddingLeft: 2 }}
                  >
                    ! {error}
                  </motion.div>
                )}
                <div className="text-dim" style={{ fontSize: 11, marginTop: 6, paddingLeft: 2 }}>
                  ↳ Read-only scan · No signing · No wallet connection · ENS resolved via Ethereum mainnet
                </div>
              </div>

              {/* Info grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 1,
                  maxWidth: 700,
                  border: "1px solid rgba(170,255,0,0.08)",
                  background: "rgba(170,255,0,0.02)",
                  fontSize: 12,
                }}
              >
                {[
                  ["POLYMARKET", "POLY TOKEN · 2026", "UPCOMING"],
                  ["HYPEREVM", "ECOSYSTEM ACTIVITY", "ACTIVE NOW"],
                  ["ENS SUPPORT", "RESOLVE .ETH NAMES", "LIVE"],
                  ["BATCH SCAN", `UP TO ${MAX_WALLETS} WALLETS`, "ENABLED"],
                ].map(([k, v, status]) => (
                  <div key={k} style={{ padding: "10px 14px", borderRight: "1px solid rgba(170,255,0,0.06)" }}>
                    <div className="text-dim" style={{ fontSize: 10, marginBottom: 3 }}>{k}</div>
                    <div style={{ color: "var(--text)", marginBottom: 2 }}>{v}</div>
                    <div style={{ color: status === "ACTIVE NOW" || status === "LIVE" || status === "ENABLED" ? "var(--lime)" : "var(--text-muted)", fontSize: 10 }}>
                      {status}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LOADING ── */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ maxWidth: 700 }}>
              <div style={{ border: "1px solid rgba(170,255,0,0.2)", background: "var(--surface)" }}>
                <div style={{ borderBottom: "1px solid rgba(170,255,0,0.1)", padding: "5px 14px", background: "rgba(170,255,0,0.03)", fontSize: 11, color: "var(--lime)" }}>
                  ▶ SCANNING BLOCKCHAIN...
                </div>
                <div style={{ padding: "20px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {loadLog.map((line, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: "18px" }}>{line}</div>
                  ))}
                  {loading && (
                    <div style={{ fontSize: 13, color: "var(--lime)", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--lime)", animation: "blink 0.6s step-end infinite" }} />
                      WORKING...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS — single ── */}
          {phase === "results" && singleResults && !isBatch && (
            <motion.div key="results-single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div className="text-dim" style={{ fontSize: 11, marginBottom: 4 }}>SCAN COMPLETE · TARGET</div>
                  <div style={{ fontSize: 13, color: "var(--lime)", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {resolvedInput ? `${resolvedInput} → ${singleResults.wallet}` : singleResults.wallet}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <ShareCard
                    wallet={singleResults.wallet}
                    ensName={resolvedInput}
                    polyScore={singleResults.polymarket?.score ?? 0}
                    polyTier={singleResults.polymarket?.tier ?? "none"}
                    hyperEvmScore={singleResults.hyperliquid?.score ?? 0}
                    hyperEvmTier={singleResults.hyperliquid?.tier ?? "none"}
                  />
                  <button
                    onClick={reset}
                    style={{ fontSize: 12, padding: "5px 14px", border: "1px solid rgba(170,255,0,0.2)", background: "rgba(170,255,0,0.04)", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em" }}
                  >
                    ← NEW SCAN
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ border: "1px solid rgba(170,255,0,0.15)", background: "rgba(170,255,0,0.03)", padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13 }}
              >
                <OverallVerdict poly={singleResults.polymarket?.score ?? 0} hl={singleResults.hyperliquid?.score ?? 0} />
                <div style={{ display: "flex", gap: 24, fontSize: 12 }}>
                  <span><span className="text-dim">POLY </span><span className="text-lime font-bold">{singleResults.polymarket?.score ?? 0}/100</span></span>
                  <span><span className="text-dim">HYPEREVM </span><span className="text-lime font-bold">{singleResults.hyperliquid?.score ?? 0}/100</span></span>
                </div>
              </motion.div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                <PolymarketCard stats={singleResults.polymarket} delay={0.05} />
                <HyperliquidCard stats={singleResults.hyperliquid} delay={0.15} />
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-dim"
                style={{ fontSize: 11, marginTop: 20, lineHeight: 1.8 }}
              >
                ─────────────────────────────────────────────────────────────────────<br />
                DISCLAIMER: SCORES ARE ESTIMATES BASED ON PUBLIC ON-CHAIN DATA AND KNOWN AIRDROP SIGNALS.<br />
                FINAL ELIGIBILITY IS DETERMINED SOLELY BY POLYMARKET AND HYPEREVM PROTOCOL TEAMS.<br />
                ─────────────────────────────────────────────────────────────────────
              </motion.div>
            </motion.div>
          )}

          {/* ── RESULTS — batch ── */}
          {phase === "results" && batchResults && isBatch && (
            <motion.div key="results-batch" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BatchResults results={batchResults} onReset={reset} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "1px solid rgba(170,255,0,0.08)",
          padding: "8px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          background: "var(--surface)",
        }}
      >
        <span className="text-dim">AIRDROP SCANNER v2.2 · NOT FINANCIAL ADVICE</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="text-dim">POWERED BY</span>
          <Image
            src="/GTR - Logo.png"
            alt="GTR Trade"
            width={64}
            height={18}
            style={{ display: "block", opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}
