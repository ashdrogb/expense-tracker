import type {
  Transaction, TransactionType, MonthlySummary,
  CategoryBreakdown, FinancialSummary, SortConfig,
} from "../types";

// ─── ID Generation ────────────────────────────────────────────────────────────
// Algorithm: Base-36 random string  → O(1)
export const generateId = (): string =>
  `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

// ─── Currency Formatting ──────────────────────────────────────────────────────
export const fmt = (n: number): string =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtSigned = (n: number): string =>
  `${n >= 0 ? "+" : "−"}${fmt(n)}`;

// ─── Financial Summary ────────────────────────────────────────────────────────
// Algorithm: Single-pass reduce → O(n)
export const computeSummary = (txns: Transaction[]): FinancialSummary => {
  const { income, expense } = txns.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  return { totalIncome: income, totalExpense: expense, balance, savingsRate };
};

// ─── Group by Month ───────────────────────────────────────────────────────────
// Algorithm: Hash-map bucketing → O(n)
const groupByMonth = (txns: Transaction[]): Map<string, Transaction[]> => {
  const map = new Map<string, Transaction[]>();
  for (const t of txns) {
    const key = t.date.slice(0, 7); // "YYYY-MM"
    const bucket = map.get(key) ?? [];
    bucket.push(t);
    map.set(key, bucket);
  }
  return map;
};

// ─── Monthly Summaries ────────────────────────────────────────────────────────
// Algorithm: Hash-map group + lexicographic sort → O(n log n)
export const computeMonthlySummaries = (txns: Transaction[]): MonthlySummary[] => {
  const grouped = groupByMonth(txns);

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b)) // sort month keys lexicographically
    .map(([month, list]) => {
      const income  = list.filter(t => t.type === "income" ).reduce((s, t) => s + t.amount, 0);
      const expense = list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const label   = new Date(month + "-02").toLocaleString("default", { month: "short", year: "2-digit" });
      return { month, label, income, expense, net: income - expense };
    });
};

// ─── Category Breakdown ───────────────────────────────────────────────────────
// Algorithm: Hash-map accumulation + percentage normalisation → O(n)
export const computeCategoryBreakdown = (
  txns: Transaction[],
  type: TransactionType
): CategoryBreakdown[] => {
  const filtered = txns.filter(t => t.type === type);
  const total    = filtered.reduce((s, t) => s + t.amount, 0);

  const map = new Map<string, { total: number; count: number }>();
  for (const t of filtered) {
    const entry = map.get(t.category) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(t.category, entry);
  }

  return Array.from(map.entries())
    .map(([category, { total: catTotal, count }]) => ({
      category: category as any,
      total: catTotal,
      count,
      percentage: total > 0 ? Math.round((catTotal / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total); // descending by total
};

// ─── Sort Transactions ────────────────────────────────────────────────────────
// Algorithm: Comparison sort (TimSort under the hood) → O(n log n)
export const sortTransactions = (txns: Transaction[], config: SortConfig): Transaction[] => {
  const comparators: Record<SortConfig["field"], (a: Transaction, b: Transaction) => number> = {
    date:     (a, b) => a.date.localeCompare(b.date) || b.createdAt - a.createdAt,
    amount:   (a, b) => a.amount - b.amount,
    category: (a, b) => a.category.localeCompare(b.category),
  };
  const cmp = comparators[config.field];
  const sorted = [...txns].sort(cmp);
  return config.direction === "desc" ? sorted.reverse() : sorted;
};

// ─── Filter Transactions ──────────────────────────────────────────────────────
// Algorithm: Linear scan → O(n)
export const filterTransactions = (
  txns: Transaction[],
  type: "all" | TransactionType,
  query: string
): Transaction[] => {
  const q = query.toLowerCase();
  return txns.filter(t => {
    const matchType   = type === "all" || t.type === type;
    const matchQuery  = !q ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q);
    return matchType && matchQuery;
  });
};
