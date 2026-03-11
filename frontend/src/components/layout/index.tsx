import type { ActiveView } from "../../types";

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  userEmail?: string;
  onLogout?: () => void;
}

const NAV_ITEMS: { view: ActiveView; label: string; icon: string }[] = [
  { view: "dashboard", label: "Dashboard", icon: "📊" },
  { view: "add",       label: "Add",       icon: "➕" },
  { view: "history",   label: "History",   icon: "📋" },
];

export const Header = ({ activeView, onNavigate, userEmail, onLogout }: HeaderProps) => (
  <header style={{
    background: "linear-gradient(135deg, #1a1f2e 0%, #0f172a 100%)",
    borderBottom: "1px solid #1e293b",
    padding: "0 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    position: "sticky",
    top: 0,
    zIndex: 100,
  }}>
    {/* Logo */}
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💸</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: "#f1f5f9" }}>ExpenseTracker</div>
        <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.05em", textTransform: "uppercase" }}>Personal Finance</div>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ display: "flex", gap: 4 }}>
      {NAV_ITEMS.map(({ view, label, icon }) => (
        <button key={view} onClick={() => onNavigate(view)} style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: activeView === view ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: activeView === view ? "#fff" : "#64748b" }}>
          <span>{icon}</span> {label}
        </button>
      ))}
    </nav>

    {/* User + Logout */}
    {userEmail && (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>{userEmail}</span>
        <button onClick={onLogout} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          Sign Out
        </button>
      </div>
    )}
  </header>
);

// ─── PageWrapper ──────────────────────────────────────────────────────────────

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const PageWrapper = ({ children, title, subtitle }: PageWrapperProps) => (
  <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
    {(title || subtitle) && (
      <div style={{ marginBottom: 24 }}>
        {title    && <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>}
        {subtitle && <p  style={{ fontSize: 14, color: "#64748b", margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
    )}
    {children}
  </main>
);
