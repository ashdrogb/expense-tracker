// src/components/csv/index.tsx
// Accepts a bank CSV in this format:
// #,Date,Description,Chq/Ref. No.,Withdrawal (Dr.),Deposit (Cr.),Balance
// Maps Withdrawal → expense, Deposit → income
// Lets user preview rows before importing

import { useState, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { generateId } from "../../utils";
import type { Transaction } from "../../types";

// ─── CSV Parsing Algorithm — O(n) ────────────────────────────────────────────
// Each row is split by comma, but amounts like "10,69,252.67" are quoted.
// We need a proper CSV parser that respects quoted fields.

const parseCSVLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
};

// Convert "05 Feb 2026" → "2026-02-05" (ISO format our app uses)
const parseDate = (raw: string): string => {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

// Strip commas from amounts like "10,69,252.67" → 1069252.67
const parseAmount = (raw: string): number => {
  const cleaned = raw.replace(/,/g, "").trim();
  return parseFloat(cleaned) || 0;
};

// Guess category from description using keyword matching — O(k) per row
const guessCategory = (description: string, type: "income" | "expense"): string => {
  const d = description.toLowerCase();
  if (type === "income") {
    if (d.includes("salary") || d.includes("sal"))    return "Salary";
    if (d.includes("dividend") || d.includes("int"))  return "Investment";
    if (d.includes("refund") || d.includes("cashback"))return "Other";
    return "Other";
  }
  if (d.includes("zomato") || d.includes("swiggy") || d.includes("food")) return "Food";
  if (d.includes("uber") || d.includes("ola") || d.includes("irctc"))     return "Transport";
  if (d.includes("rent") || d.includes("housing"))                          return "Housing";
  if (d.includes("amazon") || d.includes("flipkart") || d.includes("shop"))return "Shopping";
  if (d.includes("netflix") || d.includes("spotify") || d.includes("prime"))return "Entertainment";
  if (d.includes("electric") || d.includes("water") || d.includes("broadband"))return "Utilities";
  if (d.includes("hospital") || d.includes("pharma") || d.includes("doctor"))  return "Health";
  return "Other";
};

interface ParsedRow {
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  selected: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CSVImportProps {
  onDone: () => void;
}

export const CSVImport = ({ onDone }: CSVImportProps) => {
  const { bulkAddTransactions } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows]       = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  // ── Parse uploaded file ───────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setRows([]);
    setDone(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

      // Skip header row
      // Expected header: #,Date,Description,Chq/Ref. No.,Withdrawal (Dr.),Deposit (Cr.),Balance
      const dataLines = lines.slice(1);

      const parsed: ParsedRow[] = [];

      for (const line of dataLines) {
        const fields = parseCSVLine(line);
        // fields[0] = #
        // fields[1] = Date
        // fields[2] = Description
        // fields[3] = Chq/Ref No
        // fields[4] = Withdrawal (Dr.)
        // fields[5] = Deposit (Cr.)
        // fields[6] = Balance

        if (fields.length < 6) continue;

        const date        = parseDate(fields[1]);
        const description = fields[2] || "Bank transaction";
        const withdrawal  = parseAmount(fields[4]);
        const deposit     = parseAmount(fields[5]);

        // Skip rows where both withdrawal and deposit are 0
        if (withdrawal === 0 && deposit === 0) continue;

        const type   = withdrawal > 0 ? "expense" : "income";
        const amount = withdrawal > 0 ? withdrawal : deposit;

        parsed.push({
          date,
          description,
          type,
          amount,
          category: guessCategory(description, type),
          selected: true,
        });
      }

      if (parsed.length === 0) {
        setError("No valid transactions found. Make sure the CSV matches the expected format.");
        return;
      }

      setRows(parsed);
    };
    reader.readAsText(file);
  };

  // ── Toggle row selection ──────────────────────────────────────────────────
  const toggleRow = (i: number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));

  const toggleAll = () => {
    const allSelected = rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  // ── Update category inline ────────────────────────────────────────────────
  const updateCategory = (i: number, category: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, category } : r));

  // ── Import — one API call, one state update ───────────────────────────────
  const handleImport = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const txns: Transaction[] = selected.map(row => ({
        id: generateId(),
        type: row.type,
        amount: row.amount,
        category: row.category as any,
        description: row.description,
        date: row.date,
        createdAt: Date.now(),
      }));
      // One API call + one state dispatch — dashboard updates instantly
      await bulkAddTransactions(txns);
      setDone(true);
    } finally {
      setImporting(false);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const selectedCount = rows.filter(r => r.selected).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (done) return (
    <div style={{ background: "#1a1f2e", borderRadius: 20, padding: 40, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: "#22c55e", marginBottom: 8 }}>Import Complete</div>
      <div style={{ color: "#64748b", marginBottom: 24 }}>{selectedCount} transactions added to your account</div>
      <button onClick={onDone} style={{ padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15 }}>
        Go to Dashboard
      </button>
    </div>
  );

  return (
    <div style={{ background: "#1a1f2e", borderRadius: 20, padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
        📂 Import Bank CSV
      </h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
        Expected format: #, Date, Description, Chq/Ref. No., Withdrawal (Dr.), Deposit (Cr.), Balance
      </p>

      {/* File Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{ border: "2px dashed #334155", borderRadius: 12, padding: "32px 20px", textAlign: "center", cursor: "pointer", marginBottom: 24, background: "#0f172a" }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
        <div style={{ color: "#64748b", fontSize: 14 }}>Click to upload your bank CSV file</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(244,63,94,.1)", border: "1px solid rgba(244,63,94,.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f43f5e", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600 }}>
              {selectedCount} of {rows.length} transactions selected
            </div>
            <button onClick={toggleAll} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              {rows.every(r => r.selected) ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto", borderRadius: 12, border: "1px solid #1e293b", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0f172a", position: "sticky", top: 0 }}>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "left", width: 40 }}>✓</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Description</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Category</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 600, textAlign: "left" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e293b", background: row.selected ? "transparent" : "#0a0f1a", opacity: row.selected ? 1 : 0.4 }}>
                    <td style={{ padding: "10px 12px" }}>
                      <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} style={{ cursor: "pointer", width: 16, height: 16 }} />
                    </td>
                    <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{row.date}</td>
                    <td style={{ padding: "10px 12px", color: "#e2e8f0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.description}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        value={row.category}
                        onChange={e => updateCategory(i, e.target.value)}
                        style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", color: "#f1f5f9", fontSize: 12 }}
                      >
                        {["Food","Transport","Housing","Health","Shopping","Entertainment","Education","Utilities","Salary","Freelance","Investment","Gift","Bonus","Other"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: row.type === "income" ? "#22c55e" : "#f43f5e" }}>
                      {row.type === "income" ? "+" : "−"}{fmt(row.amount)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: row.type === "income" ? "rgba(34,197,94,.15)" : "rgba(244,63,94,.15)", color: row.type === "income" ? "#22c55e" : "#f43f5e" }}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onDone} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              style={{ flex: 2, padding: "14px 0", borderRadius: 12, border: "none", cursor: importing || selectedCount === 0 ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, opacity: importing || selectedCount === 0 ? 0.6 : 1 }}
            >
              {importing ? "Importing..." : `Import ${selectedCount} Transactions`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
