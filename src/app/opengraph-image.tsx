import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Airdrop Scanner — Polymarket × HyperEVM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Corner brackets */}
        {[
          { top: 40, left: 40, borderTop: "3px solid #AAFF00", borderLeft: "3px solid #AAFF00", width: 80, height: 80 },
          { top: 40, right: 40, borderTop: "3px solid #AAFF00", borderRight: "3px solid #AAFF00", width: 80, height: 80 },
          { bottom: 40, left: 40, borderBottom: "3px solid #AAFF00", borderLeft: "3px solid #AAFF00", width: 80, height: 80 },
          { bottom: 40, right: 40, borderBottom: "3px solid #AAFF00", borderRight: "3px solid #AAFF00", width: 80, height: 80 },
        ].map((style, i) => (
          <div key={i} style={{ position: "absolute", ...style }} />
        ))}

        {/* Top label */}
        <div style={{ color: "#AAFF00", opacity: 0.45, fontSize: 18, letterSpacing: 8, marginBottom: 32, display: "flex" }}>
          WALLET ELIGIBILITY SCANNER
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
          <span style={{ color: "#ffffff", fontSize: 108, fontWeight: 800, letterSpacing: -4, lineHeight: 1, display: "flex" }}>
            ARE YOU
          </span>
          <span style={{ color: "#AAFF00", fontSize: 108, fontWeight: 800, letterSpacing: -4, lineHeight: 1, display: "flex" }}>
            IN?
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 800, height: 1, background: "#AAFF00", opacity: 0.12, margin: "40px 0 32px" }} />

        {/* Protocol badges */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{
            border: "1px solid rgba(170,255,0,0.35)",
            color: "#AAFF00",
            fontSize: 18,
            padding: "10px 28px",
            letterSpacing: 3,
            display: "flex",
          }}>
            POLYMARKET
          </div>
          <span style={{ color: "#AAFF00", opacity: 0.35, fontSize: 22, display: "flex" }}>×</span>
          <div style={{
            border: "1px solid rgba(170,255,0,0.35)",
            color: "#AAFF00",
            fontSize: 18,
            padding: "10px 28px",
            letterSpacing: 3,
            display: "flex",
          }}>
            HYPEREVM
          </div>
        </div>

        {/* URL */}
        <div style={{ color: "#AAFF00", opacity: 0.3, fontSize: 16, letterSpacing: 3, marginTop: 48, display: "flex" }}>
          airdrop-scanner.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
