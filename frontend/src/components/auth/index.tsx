// src/components/auth/index.tsx
// Login and Register form.
// Shown when no user is logged in (App.tsx checks useAuth().user).

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export const AuthPage = () => {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState<"login" | "register">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else                  await register(email, password);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 10, padding: "12px 14px", color: "#f1f5f9",
    fontSize: 15, outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background: "#1a1f2e", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px" }}>💸</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#f1f5f9", letterSpacing: "-0.02em" }}>ExpenseTracker</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
          <input type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(244,63,94,.1)", border: "1px solid rgba(244,63,94,.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f43f5e", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 16, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        {/* Toggle */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#64748b" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: 13 }}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
