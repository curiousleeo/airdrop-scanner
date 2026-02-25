"use client";
import { useEffect, useState } from "react";

type Tier = "legendary" | "high" | "medium" | "low" | "none";

const TIER_META: Record<Tier, { label: string; color: string; msg: string; access: string }> = {
  legendary: {
    label: "LEGENDARY",
    color: "var(--lime)",
    msg: "ACCESS LEVEL: MAXIMUM — THIS WALLET IS UNTOUCHABLE",
    access: "██ ELIGIBLE",
  },
  high: {
    label: "HIGH",
    color: "var(--lime)",
    msg: "ACCESS LEVEL: ELEVATED — STRONG POSITION CONFIRMED",
    access: "██ ELIGIBLE",
  },
  medium: {
    label: "MEDIUM",
    color: "var(--amber)",
    msg: "ACCESS LEVEL: STANDARD — MORE ACTIVITY RECOMMENDED",
    access: "░░ POSSIBLE",
  },
  low: {
    label: "LOW",
    color: "var(--amber)",
    msg: "ACCESS LEVEL: MINIMAL — BUILD YOUR POSITION",
    access: "░░ UNLIKELY",
  },
  none: {
    label: "NONE",
    color: "var(--red)",
    msg: "NO ACTIVITY DETECTED — WALLET NOT RECOGNIZED",
    access: "XX NOT DETECTED",
  },
};

export function TierVerdict({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return (
    <div>
      <div className="text-xs text-muted mb-1">VERDICT</div>
      <div className="text-base font-bold" style={{ color: meta.color }}>
        {meta.access} — {meta.label}
      </div>
      <div className="text-xs text-muted mt-1" style={{ color: "rgba(200,232,168,0.35)" }}>
        {meta.msg}
      </div>
    </div>
  );
}

export function AnimatedScore({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score]);

  return (
    <span className="text-lime font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
      {String(displayed).padStart(3, "0")}
    </span>
  );
}
