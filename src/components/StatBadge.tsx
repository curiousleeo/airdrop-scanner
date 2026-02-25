"use client";

interface StatBadgeProps {
  label: string;
  value: string;
  subValue?: string;
  accent?: string;
  icon?: string;
}

export default function StatBadge({ label, value, subValue, accent = "#00d4ff", icon }: StatBadgeProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid rgba(255,255,255,0.06)`,
        borderTop: `1px solid ${accent}22`,
      }}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
          {label}
        </span>
      </div>
      <span className="text-lg font-bold" style={{ color: accent }}>
        {value}
      </span>
      {subValue && (
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          {subValue}
        </span>
      )}
    </div>
  );
}
