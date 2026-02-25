"use client";
import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  tier: "legendary" | "high" | "medium" | "low" | "none";
  size?: number;
}

const TIER_CONFIG = {
  legendary: { color: "#fbbf24", glow: "rgba(251,191,36,0.4)", label: "LEGENDARY" },
  high: { color: "#00d4ff", glow: "rgba(0,212,255,0.35)", label: "HIGH" },
  medium: { color: "#a78bfa", glow: "rgba(167,139,250,0.35)", label: "MEDIUM" },
  low: { color: "#f97316", glow: "rgba(249,115,22,0.3)", label: "LOW" },
  none: { color: "#374151", glow: "rgba(55,65,81,0.2)", label: "NONE" },
};

export default function ScoreRing({ score, tier, size = 120 }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const config = TIER_CONFIG[tier];
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={6}
        />
        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.05s ease",
            filter: `drop-shadow(0 0 8px ${config.glow})`,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: config.color, lineHeight: 1 }}>
          {displayScore}
        </span>
        <span className="text-xs mt-0.5" style={{ color: config.color, opacity: 0.7 }}>
          /100
        </span>
      </div>
    </div>
  );
}
