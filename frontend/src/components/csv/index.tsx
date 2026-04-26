// src/components/csv/index.tsx
import { useState, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { generateId } from "../../utils";
import type { Transaction } from "../../types";

// ─── CSV Parser — handles quoted fields like "10,69,252.67" ──────────────────
const parseCSVLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { fields.push(current.trim()); current = ""; }
    else { current += char; }
  }
  fields.push(current.trim());
  return fields;
};

// ─── Date Parser ──────────────────────────────────────────────────────────────
const parseDate = (raw: string): string => {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch { return new Date().toISOString().slice(0, 10); }
};

// ─── Amount Parser — strips Indian number formatting ─────────────────────────
const parseAmount = (raw: string): number => parseFloat(raw.replace(/,/g, "").trim()) || 0;

// ─── Category Rules — O(k) keyword scan per transaction ──────────────────────
// Rules are checked in order — first match wins.
// Add more rules here as needed.
const EXPENSE_RULES: { keywords: string[]; category: string }[] = [
  // Transport
  { keywords: ["metro", "dmrc", "uber", "ola", "rapido", "irctc", "railway", "bus", "auto", "cab", "toll", "petrol", "fuel", "parking"], category: "Transport" },
  // Food
  { keywords: ["fresh", "food", "sweets", "bread", "nature", "cafe", "zomato", "swiggy", "restaurant", "kitchen", "bakery", "dairy", "milk", "grocer", "vegetable", "fruits", "blinkit", "zepto", "instamart"], category: "Food" },
  // Investment (Zerodha and other brokers)
  { keywords: ["zerodha", "groww", "upstox", "zerodha konsult", "nse", "bse", "mutual fund", "mf", "sip", "demat"], category: "Investment" },
  // Housing
  { keywords: ["rent", "maintenance", "society", "housing", "flat", "pg", "landlord"], category: "Housing" },
  // Utilities
  { keywords: ["electric", "electricity", "water", "broadband", "wifi", "internet", "jio", "airtel", "vi ", "bsnl", "gas", "cylinder"], category: "Utilities" },
  // Health
  { keywords: ["hospital", "clinic", "pharma", "medical", "doctor", "medicine", "health", "apollo", "1mg", "netmeds"], category: "Health" },
  // Shopping
  { keywords: ["amazon", "flipkart", "myntra", "meesho", "shopping", "store", "mart", "mall"], category: "Shopping" },
  // Entertainment
  { keywords: ["netflix", "spotify", "prime", "hotstar", "disney", "youtube", "gaming", "cinema", "movie", "theatre"], category: "Entertainment" },
  // Education
  { keywords: ["udemy", "coursera", "college", "school", "fees", "tuition", "education", "course", "book"], category: "Education" },
];

const INCOME_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["salary", "sal ", "payroll", "stipend"], category: "Salary" },
  { keywords: ["freelance", "project", "client", "consulting"], category: "Freelance" },
  { keywords: ["dividend", "interest", "returns", "zerodha", "groww", "upstox", "mutual fund"], category: "Investment" },
  { keywords: ["refund", "cashback", "reversal"], category: "Other" },
  { keywords: ["gift", "bonus", "reward"], category: "Bonus" },
];

const guessCategory = (description: string, type: "income" | "expense"): string => {
  const d = description.toLowerCase();
  const rules = type === "expense" ? EXPENSE_RULES : INCOME_RULES;
  for (const rule of rules) {
    if (rule.keywords.some(kw => d.includes(kw))) return rule.category;
  }
  return "Other";
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedRow {
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  selected: boolean;
}

interface CSVImportProps { onDone: () => void; }

// ─── Component ────────────────────────────────────────────────────────────────
export const CSVImport = ({ onDone }: CSVImportProps) => {
  const { bulkAddTransactions } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows]           = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(""); setRows([]); setDone(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      const dataLines = lines.slice(1);
      const parsed: ParsedRow[] = [];
      for (const line of dataLines) {
        const fields = parseCSVLine(line);
        if (fields.length < 6) continue;
        const date        = parseDate(fields[1]);
        const description = fields[2] || "Bank transaction";
        const withdrawal  = parseAmount(fields[4]);
        const deposit     = parseAmount(fields[5]);
        if (withdrawal === 0 && deposit === 0) continue;
        const type   = withdrawal > 0 ? "expense" : "income";
        const amount = withdrawal > 0 ? withdrawal : deposit;
        parsed.push({ date, description, type, amount, category: guessCategory(description, type), selected: true });
      }
      if (parsed.length === 0) { setError("No valid transactions found."); return; }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const toggleRow    = (i: number) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleAll    = () => { const all = rows.every(r => r.selected); setRows(prev => prev.map(r => ({ ...r, selected: !all }))); };
  const updateCategory = (i: number, category: string) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, category } : r));

  const handleImport = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const txns: Transaction[] = selected.map(row => ({
        id: generateId(), type: row.type, amount: row.amount,
        category: row.category as any, description: row.description,
        date: row.date, createdAt: Date.now(),
      }));
      await bulkAddTransactions(txns);
      setDone(true);
    } finally { setImporting(false); }
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const selectedCount = rows.filter(r => r.selected).length;
  const ALL_CATEGORIES = ["Food","Transport","Housing","Health","Shopping","Entertainment","Education","Utilities","Salary","Freelance","Investment","Gift","Bonus","Other"];

  if (done) return (
    <div style={{ background:"#1a1f2e", borderRadius:20, padding:40, maxWidth:500, margin:"0 auto", textAlign:"center" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
      <div style={{ fontWeight:800, fontSize:20, color:"#22c55e", marginBottom:8 }}>Import Complete</div>
      <div style={{ color:"#64748b", marginBottom:24 }}>{selectedCount} transactions imported</div>
      <button onClick={onDone} style={{ padding:"12px 28px", borderRadius:12, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:15 }}>Go to Dashboard</button>
    </div>
  );

  return (
    <div style={{ background:"#1a1f2e", borderRadius:20, padding:32, maxWidth:960, margin:"0 auto" }}>
      <h2 style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", margin:"0 0 6px" }}>📂 Import Bank CSV</h2>
      <p style={{ fontSize:13, color:"#64748b", margin:"0 0 24px" }}>Format: #, Date, Description, Chq/Ref. No., Withdrawal (Dr.), Deposit (Cr.), Balance</p>

      <div onClick={() => fileRef.current?.click()} style={{ border:"2px dashed #334155", borderRadius:12, padding:"32px 20px", textAlign:"center", cursor:"pointer", marginBottom:24, background:"#0f172a" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
        <div style={{ color:"#64748b", fontSize:14 }}>Click to upload your bank CSV file</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:"none" }}/>
      </div>

      {error && <div style={{ background:"rgba(244,63,94,.1)", border:"1px solid rgba(244,63,94,.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f43f5e", marginBottom:16 }}>{error}</div>}

      {rows.length > 0 && <>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:14, color:"#94a3b8", fontWeight:600 }}>{selectedCount} of {rows.length} selected</div>
          <button onClick={toggleAll} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #334155", background:"transparent", color:"#64748b", cursor:"pointer", fontSize:12, fontWeight:600 }}>
            {rows.every(r => r.selected) ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div style={{ maxHeight:380, overflowY:"auto", borderRadius:12, border:"1px solid #1e293b", marginBottom:20 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#0f172a", position:"sticky", top:0 }}>
                {["✓","Date","Description","Category","Amount","Type"].map(h => (
                  <th key={h} style={{ padding:"10px 12px", color:"#64748b", fontWeight:600, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderTop:"1px solid #1e293b", opacity: row.selected ? 1 : 0.35 }}>
                  <td style={{ padding:"10px 12px" }}><input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} style={{ cursor:"pointer" }}/></td>
                  <td style={{ padding:"10px 12px", color:"#94a3b8" }}>{row.date}</td>
                  <td style={{ padding:"10px 12px", color:"#e2e8f0", maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.description}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <select value={row.category} onChange={e => updateCategory(i, e.target.value)} style={{ background:"#0f172a", border:"1px solid #334155", borderRadius:6, padding:"4px 8px", color:"#f1f5f9", fontSize:12 }}>
                      {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:700, color: row.type === "income" ? "#22c55e" : "#f43f5e" }}>{row.type === "income" ? "+" : "−"}{fmt(row.amount)}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background: row.type === "income" ? "rgba(34,197,94,.15)" : "rgba(244,63,94,.15)", color: row.type === "income" ? "#22c55e" : "#f43f5e" }}>{row.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onDone} style={{ flex:1, padding:"14px 0", borderRadius:12, border:"1px solid #334155", background:"transparent", color:"#94a3b8", fontWeight:700, cursor:"pointer", fontSize:15 }}>Cancel</button>
          <button onClick={handleImport} disabled={importing || selectedCount === 0} style={{ flex:2, padding:"14px 0", borderRadius:12, border:"none", cursor: importing || selectedCount === 0 ? "not-allowed" : "pointer", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontWeight:700, fontSize:15, opacity: importing || selectedCount === 0 ? 0.6 : 1 }}>
            {importing ? "Importing..." : `Import ${selectedCount} Transactions`}
          </button>
        </div>
      </>}
    </div>
  );
};
