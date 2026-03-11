import { useState } from "react";
import type { Transaction, TransactionFormData, ActiveView } from "../../types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_ICONS } from "../../constants";
import { fmt } from "../../utils";
import { Badge, Button, EmptyState } from "../ui";
import { useTransactionList, useTransactionForm } from "../../hooks";
import { useAppContext } from "../../context/AppContext";

// ─── TransactionRow ───────────────────────────────────────────────────────────

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  showBorder?: boolean;
}

export const TransactionRow = ({ transaction: t, onDelete, onEdit, showBorder = true }: TransactionRowProps) => {
  const isIncome = t.type === "income";
  const icon     = CATEGORY_ICONS[t.category] ?? "📦";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 20px",
      borderBottom: showBorder ? "1px solid #1e293b" : "none",
      gap: 12,
    }}>
      {/* Left: icon + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isIncome ? "rgba(34,197,94,.12)" : "rgba(244,63,94,.12)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>{t.description}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <Badge label={t.category} color={isIncome ? "#22c55e" : "#f43f5e"} />
            <span style={{ fontSize: 11, color: "#475569" }}>{t.date}</span>
          </div>
        </div>
      </div>

      {/* Right: amount + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: isIncome ? "#22c55e" : "#f43f5e" }}>
          {isIncome ? "+" : "−"}{fmt(t.amount)}
        </div>
        <button
          onClick={() => onEdit(t)}
          title="Edit"
          style={{
            width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
            background: "rgba(99,102,241,.15)", color: "#6366f1", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✏️</button>
        <button
          onClick={() => onDelete(t.id)}
          title="Delete"
          style={{
            width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer",
            background: "rgba(244,63,94,.12)", color: "#f43f5e", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >×</button>
      </div>
    </div>
  );
};

// ─── TransactionForm ──────────────────────────────────────────────────────────

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  existing?: Transaction;
}

export const TransactionForm = ({ onSuccess, onCancel, existing }: TransactionFormProps) => {
  const { form, setField, errors, submit, isEditMode } = useTransactionForm(onSuccess, existing);
  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const inputStyle = (hasError?: boolean) => ({
    width: "100%",
    background: "#0f172a",
    border: `1px solid ${hasError ? "#f43f5e" : "#1e293b"}`,
    borderRadius: 10,
    padding: "12px 14px",
    color: "#f1f5f9",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  });

  return (
    <div style={{ background: "#1a1f2e", borderRadius: 20, padding: 32, maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: "0 0 24px", letterSpacing: "-0.02em" }}>
        {isEditMode ? "✏️ Edit Transaction" : "➕ New Transaction"}
      </h2>

      {/* Type Toggle */}
      <div style={{ display: "flex", background: "#0f172a", borderRadius: 12, padding: 4, marginBottom: 22 }}>
        {(["expense", "income"] as const).map(t => (
          <button
            key={t}
            onClick={() => {
              setField("type", t);
              setField("category", (t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]);
            }}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 14, transition: "all .2s",
              background: form.type === t ? (t === "income" ? "#22c55e" : "#f43f5e") : "transparent",
              color: form.type === t ? "#fff" : "#475569",
            }}
          >
            {t === "income" ? "📈 Income" : "📉 Expense"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Amount ($)</label>
        <input type="number" placeholder="0.00" value={form.amount} onChange={e => setField("amount", e.target.value)} style={inputStyle(!!errors.amount)} />
        {errors.amount && <div style={{ fontSize: 12, color: "#f43f5e", marginTop: 4 }}>{errors.amount}</div>}
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Description</label>
        <input type="text" placeholder="What was this for?" value={form.description} onChange={e => setField("description", e.target.value)} style={inputStyle(!!errors.description)} />
        {errors.description && <div style={{ fontSize: 12, color: "#f43f5e", marginTop: 4 }}>{errors.description}</div>}
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Category</label>
        <select value={form.category} onChange={e => setField("category", e.target.value as any)} style={inputStyle()}>
          {categories.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c] ?? "📦"} {c}</option>)}
        </select>
      </div>

      {/* Date */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Date</label>
        <input type="date" value={form.date} onChange={e => setField("date", e.target.value)} style={inputStyle()} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button label="Cancel"                          onClick={onCancel} variant="secondary" size="lg" fullWidth />
        <Button label={isEditMode ? "Save Changes" : "Save Transaction"} onClick={submit} variant="primary" size="lg" fullWidth />
      </div>
    </div>
  );
};

// ─── TransactionList ──────────────────────────────────────────────────────────

interface TransactionListProps {
  onNavigateToAdd?: () => void;
  limit?: number;
}

export const TransactionList = ({ onNavigateToAdd, limit }: TransactionListProps) => {
  const { deleteTransaction } = useAppContext();
  const { processed, filter, setFilter, query, setQuery, sort, toggleSort } = useTransactionList();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const displayed = limit ? processed.slice(0, limit) : processed;

  // If a row's edit button is clicked, show the form inline
  if (editingTransaction) {
    return (
      <TransactionForm
        existing={editingTransaction}
        onSuccess={() => setEditingTransaction(null)}
        onCancel={() => setEditingTransaction(null)}
      />
    );
  }

  return (
    <div>
      {/* Controls (only shown when not in preview mode) */}
      {!limit && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          {/* Filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "income", "expense"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13, textTransform: "capitalize",
                  background: filter === f ? "#6366f1" : "#1a1f2e",
                  color: filter === f ? "#fff" : "#64748b",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              background: "#1a1f2e", border: "1px solid #1e293b", borderRadius: 8,
              padding: "8px 14px", color: "#f1f5f9", fontSize: 13, outline: "none", flex: 1, minWidth: 160,
            }}
          />

          {/* Sort */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["date", "amount", "category"] as const).map(field => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 12, textTransform: "capitalize",
                  background: sort.field === field ? "#334155" : "#1a1f2e",
                  color: sort.field === field ? "#f1f5f9" : "#475569",
                }}
              >
                {field} {sort.field === field ? (sort.direction === "asc" ? "↑" : "↓") : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ background: "#1a1f2e", borderRadius: 16, overflow: "hidden" }}>
        {displayed.length === 0 ? (
          <EmptyState
            icon="📭"
            message="No transactions found"
            sub="Try adjusting your filters or add a new transaction"
            action={onNavigateToAdd && (
              <Button label="➕ Add Transaction" onClick={onNavigateToAdd} size="sm" />
            )}
          />
        ) : (
          displayed.map((t, i) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              onDelete={deleteTransaction}
              onEdit={setEditingTransaction}
              showBorder={i < displayed.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
};
