// ─── Core Domain Types ────────────────────────────────────────────────────────

export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Housing"
  | "Health"
  | "Shopping"
  | "Entertainment"
  | "Education"
  | "Utilities"
  | "Other";

export type IncomeCategory =
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Gift"
  | "Bonus"
  | "Other";

export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO "YYYY-MM-DD"
  createdAt: number; // timestamp for stable sort
}

// ─── Aggregation Types ────────────────────────────────────────────────────────

export interface MonthlySummary {
  month: string;       // "YYYY-MM"
  label: string;       // "Jan '25"
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number; // % of income saved
}

// ─── UI / Form Types ──────────────────────────────────────────────────────────

export type ActiveView = "dashboard" | "add" | "history";
export type FilterType = "all" | "income" | "expense";
export type SortField = "date" | "amount" | "category";
export type SortDirection = "asc" | "desc";

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  category: Category;
  description: string;
  date: string;
}

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
