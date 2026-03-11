import type { ReactNode, CSSProperties } from "react";
import { fmt } from "../../utils";

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  color?: string;
  size?: "sm" | "md";
}

export const Badge = ({ label, color = "#6366f1", size = "sm" }: BadgeProps) => (
  <span style={{
    display: "inline-block",
    padding: size === "sm" ? "3px 10px" : "5px 14px",
    borderRadius: 20,
    fontSize: size === "sm" ? 11 : 13,
    fontWeight: 600,
    background: `${color}22`,
    color,
    letterSpacing: "0.02em",
  }}>
    {label}
  </span>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  suffix?: string;
  formatter?: (n: number) => string;
}

export const StatCard = ({ label, value, icon, color, suffix = "", formatter = fmt }: StatCardProps) => (
  <div style={{
    background: "#1a1f2e",
    borderRadius: 16,
    padding: "22px 26px",
    borderLeft: `4px solid ${color}`,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  }}>
    <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
      <span style={{ marginRight: 6 }}>{icon}</span>{label}
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.02em" }}>
      {formatter(value)}{suffix}
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  message: string;
  sub?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon = "🔍", message, sub, action }: EmptyStateProps) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 16, color: "#94a3b8", marginBottom: 4 }}>{message}</div>
    {sub && <div style={{ fontSize: 13, marginBottom: 16 }}>{sub}</div>}
    {action}
  </div>
);

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  style?: CSSProperties;
}

const BUTTON_STYLES: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
  primary:   { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none" },
  secondary: { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" },
  danger:    { background: "rgba(244,63,94,.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,.3)" },
  ghost:     { background: "transparent", color: "#64748b", border: "none" },
};

const BUTTON_SIZES: Record<NonNullable<ButtonProps["size"]>, CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: 12, borderRadius: 8 },
  md: { padding: "10px 20px", fontSize: 14, borderRadius: 10 },
  lg: { padding: "14px 28px", fontSize: 16, borderRadius: 12 },
};

export const Button = ({ label, onClick, variant = "primary", size = "md", fullWidth, style }: ButtonProps) => (
  <button
    onClick={onClick}
    style={{
      cursor: "pointer",
      fontWeight: 700,
      letterSpacing: "0.01em",
      width: fullWidth ? "100%" : undefined,
      ...BUTTON_STYLES[variant],
      ...BUTTON_SIZES[size],
      ...style,
    }}
  >
    {label}
  </button>
);
