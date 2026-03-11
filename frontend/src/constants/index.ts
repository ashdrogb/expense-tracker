import type { ExpenseCategory, IncomeCategory, Transaction } from "../types";

// ─── Categories ───────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food", "Transport", "Housing", "Health",
  "Shopping", "Entertainment", "Education", "Utilities", "Other",
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  "Salary", "Freelance", "Investment", "Gift", "Bonus", "Other",
];

export const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔", Transport: "🚌", Housing: "🏠", Health: "💊",
  Shopping: "🛍️", Entertainment: "🎬", Education: "📚", Utilities: "⚡",
  Salary: "💼", Freelance: "💻", Investment: "📈", Gift: "🎁", Bonus: "🎯",
  Other: "📦",
};

// ─── Chart Palette ────────────────────────────────────────────────────────────

export const CHART_COLORS = [
  "#f43f5e", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#06b6d4", "#a78bfa",
];

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const SEED_TRANSACTIONS: Transaction[] = [
  { id:"s01", type:"income",  amount:4200,  category:"Salary",        description:"Monthly salary",       date:"2025-01-05", createdAt:1 },
  { id:"s02", type:"expense", amount:1100,  category:"Housing",       description:"Rent",                 date:"2025-01-01", createdAt:2 },
  { id:"s03", type:"expense", amount:230,   category:"Food",          description:"Groceries & dining",   date:"2025-01-14", createdAt:3 },
  { id:"s04", type:"expense", amount:60,    category:"Transport",     description:"Monthly bus pass",     date:"2025-01-15", createdAt:4 },
  { id:"s05", type:"expense", amount:89,    category:"Utilities",     description:"Electricity bill",     date:"2025-01-20", createdAt:5 },
  { id:"s06", type:"income",  amount:850,   category:"Freelance",     description:"UI design project",    date:"2025-02-08", createdAt:6 },
  { id:"s07", type:"income",  amount:4200,  category:"Salary",        description:"Monthly salary",       date:"2025-02-05", createdAt:7 },
  { id:"s08", type:"expense", amount:1100,  category:"Housing",       description:"Rent",                 date:"2025-02-01", createdAt:8 },
  { id:"s09", type:"expense", amount:310,   category:"Shopping",      description:"New headphones",       date:"2025-02-18", createdAt:9 },
  { id:"s10", type:"expense", amount:120,   category:"Entertainment", description:"Streaming & games",    date:"2025-02-22", createdAt:10 },
  { id:"s11", type:"income",  amount:4200,  category:"Salary",        description:"Monthly salary",       date:"2025-03-05", createdAt:11 },
  { id:"s12", type:"income",  amount:500,   category:"Investment",    description:"Dividend payout",      date:"2025-03-10", createdAt:12 },
  { id:"s13", type:"expense", amount:1100,  category:"Housing",       description:"Rent",                 date:"2025-03-01", createdAt:13 },
  { id:"s14", type:"expense", amount:450,   category:"Health",        description:"Dental checkup",       date:"2025-03-15", createdAt:14 },
  { id:"s15", type:"expense", amount:200,   category:"Education",     description:"Online course",        date:"2025-03-25", createdAt:15 },
];
