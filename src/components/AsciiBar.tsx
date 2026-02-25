"use client";
import { useEffect, useState } from "react";

interface AsciiBarProps {
  value: number;   // points earned
  max: number;     // max possible
  width?: number;  // bar width in chars
  color?: string;
}

export default function AsciiBar({ value, max, width = 20, color = "var(--lime)" }: AsciiBarProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value]);

  const filled = max > 0 ? Math.round((displayed / max) * width) : 0;
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <span style={{ color, letterSpacing: "0.05em", fontFamily: "monospace" }}>
      {bar}
    </span>
  );
}
