"use client";

type Tier = "legendary" | "high" | "medium" | "low" | "none";

const TIER_META: Record<Tier, { label: string; emoji: string; color: string; bg: string; message: string }> = {
  legendary: {
    label: "LEGENDARY",
    emoji: "👑",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    message: "The chain remembers you.",
  },
  high: {
    label: "HIGH CHANCE",
    emoji: "🔥",
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.08)",
    message: "Your wallet speaks volumes.",
  },
  medium: {
    label: "POSSIBLE",
    emoji: "⚡",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    message: "Keep grinding — you're close.",
  },
  low: {
    label: "UNLIKELY",
    emoji: "🌱",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    message: "Every trade counts. Start building.",
  },
  none: {
    label: "NOT ELIGIBLE",
    emoji: "💤",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.08)",
    message: "No activity detected on this wallet.",
  },
};

export default function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1"
        style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}
      >
        <span className="text-sm">{meta.emoji}</span>
        <span className="text-xs font-bold tracking-widest" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.45)" }}>
        &ldquo;{meta.message}&rdquo;
      </p>
    </div>
  );
}
