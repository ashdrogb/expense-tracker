// src/components/encryption/index.tsx
// Shown after login if encryption is enabled but key not yet loaded.
// User must enter their encryption password to unlock their data.

import { useState } from "react";
import { useEncryption } from "../../context/EncryptionContext";

interface EncryptionGateProps {
  onUnlocked: () => void;
  onSkip: () => void;
  isFirstTime: boolean;
}

export const EncryptionGate = ({ onUnlocked, onSkip, isFirstTime }: EncryptionGateProps) => {
  const { setupEncryption } = useEncryption();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!password) { setError("Enter an encryption password"); return; }
    if (isFirstTime && password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Encryption password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await setupEncryption(password);
      onUnlocked();
    } catch (e: any) {
      setError("Failed to set up encryption: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width:"100%", background:"#0f172a", border:"1px solid #1e293b",
    borderRadius:10, padding:"12px 14px", color:"#f1f5f9",
    fontSize:15, outline:"none", boxSizing:"border-box" as const,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background:"#1a1f2e", borderRadius:20, padding:40, width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <div style={{ fontWeight:800, fontSize:20, color:"#f1f5f9", marginBottom:6 }}>
            {isFirstTime ? "Set Encryption Password" : "Unlock Your Data"}
          </div>
          <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>
            {isFirstTime
              ? "Your data will be encrypted in the browser before being stored. Even the server owner cannot read it."
              : "Enter your encryption password to decrypt your data. This never leaves your device."
            }
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
            Encryption Password
          </label>
          <input type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()}/>
        </div>

        {isFirstTime && (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
              Confirm Password
            </label>
            <input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inp} onKeyDown={e => e.key === "Enter" && handleSubmit()}/>
          </div>
        )}

        {error && (
          <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f43f5e", marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* Warning box */}
        <div style={{ background:"rgba(234,179,8,.08)", border:"1px solid rgba(234,179,8,.2)", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#eab308", marginBottom:20, lineHeight:1.6 }}>
          ⚠️ If you forget this password your data cannot be recovered. There is no reset option.
        </div>

        <div style={{ display:"flex", gap:10 }}>
          {isFirstTime && (
            <button onClick={onSkip} style={{ flex:1, padding:"14px 0", borderRadius:12, border:"1px solid #334155", background:"transparent", color:"#64748b", fontWeight:700, cursor:"pointer", fontSize:14 }}>
              Skip for now
            </button>
          )}
          <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:"14px 0", borderRadius:12, border:"none", cursor: loading ? "not-allowed" : "pointer", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:15, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Setting up..." : isFirstTime ? "Enable Encryption" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Encryption settings panel (shown in a settings section) ─────────────────
export const EncryptionSettings = () => {
  const { isEncrypted, encKey, setupEncryption, clearEncryption } = useEncryption();
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState("");

  const handleEnable = async () => {
    if (password.length < 8) { setMsg("Password must be at least 8 characters"); return; }
    setLoading(true);
    await setupEncryption(password);
    setLoading(false);
    setMsg("Encryption enabled. New transactions will be encrypted.");
    setPassword("");
  };

  return (
    <div style={{ background:"#1a1f2e", borderRadius:16, padding:24 }}>
      <div style={{ fontWeight:700, fontSize:15, color:"#f1f5f9", marginBottom:6 }}>🔐 Client-Side Encryption</div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
        {isEncrypted
          ? encKey
            ? "Encryption is active. Your data is encrypted before leaving your device."
            : "Encryption is enabled but locked. Re-enter your password to unlock."
          : "Encryption is off. Enable it to make your data unreadable to the server."
        }
      </div>

      {!isEncrypted && (
        <div style={{ display:"flex", gap:10 }}>
          <input type="password" placeholder="Set encryption password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)}
            style={{ flex:1, background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"10px 14px", color:"#f1f5f9", fontSize:13, outline:"none" }}/>
          <button onClick={handleEnable} disabled={loading} style={{ padding:"10px 20px", borderRadius:8, border:"none", cursor:"pointer", background:"#22c55e", color:"#fff", fontWeight:700, fontSize:13 }}>
            {loading ? "..." : "Enable"}
          </button>
        </div>
      )}

      {isEncrypted && (
        <button onClick={clearEncryption} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #f43f5e", background:"transparent", color:"#f43f5e", fontWeight:700, cursor:"pointer", fontSize:13 }}>
          Disable Encryption
        </button>
      )}

      {msg && <div style={{ fontSize:12, color:"#22c55e", marginTop:10 }}>{msg}</div>}
    </div>
  );
};
