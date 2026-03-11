import { useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  computeSummary, computeMonthlySummaries,
  computeCategoryBreakdown, filterTransactions, sortTransactions,
} from "../utils";
import type { FilterType, SortConfig, Transaction } from "../types";

// ─── useFinancials ────────────────────────────────────────────────────────────
// Derives all aggregate data from raw transactions (memoised)

export const useFinancials = () => {
  const { transactions } = useAppContext();

  const summary          = useMemo(() => computeSummary(transactions),                       [transactions]);
  const monthlySummaries = useMemo(() => computeMonthlySummaries(transactions),              [transactions]);
  const expenseBreakdown = useMemo(() => computeCategoryBreakdown(transactions, "expense"),  [transactions]);
  const incomeBreakdown  = useMemo(() => computeCategoryBreakdown(transactions, "income"),   [transactions]);

  return { summary, monthlySummaries, expenseBreakdown, incomeBreakdown };
};

// ─── useTransactionList ───────────────────────────────────────────────────────
// Filtering + sorting pipeline for the history view

export const useTransactionList = () => {
  const { transactions } = useAppContext();

  const [filter, setFilter]   = useState<FilterType>("all");
  const [query,  setQuery]    = useState("");
  const [sort,   setSort]     = useState<SortConfig>({ field: "date", direction: "desc" });

  const toggleSort = (field: SortConfig["field"]) => {
    setSort(prev =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "desc" }
    );
  };

  const processed = useMemo(() => {
    const filtered = filterTransactions(transactions, filter, query);
    return sortTransactions(filtered, sort);
  }, [transactions, filter, query, sort]);

  return { processed, filter, setFilter, query, setQuery, sort, toggleSort };
};

// ─── useTransactionForm ───────────────────────────────────────────────────────
// Form state + submission logic

import { EXPENSE_CATEGORIES } from "../constants";
import type { TransactionFormData } from "../types";

const DEFAULT_FORM: TransactionFormData = {
  type: "expense",
  amount: "",
  category: EXPENSE_CATEGORIES[0],
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

// Pass an existing Transaction to enter edit mode
export const useTransactionForm = (onSuccess: () => void, existing?: Transaction) => {
  const { addTransaction, editTransaction } = useAppContext();

  const initialForm: TransactionFormData = existing
    ? { type: existing.type, amount: String(existing.amount), category: existing.category, description: existing.description, date: existing.date }
    : DEFAULT_FORM;

  const [form, setForm]     = useState<TransactionFormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});

  const setField = <K extends keyof TransactionFormData>(key: K, value: TransactionFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      errs.amount = "Enter a valid positive amount";
    if (!form.description.trim())
      errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    if (existing) {
      editTransaction(existing.id, form);
    } else {
      addTransaction(form);
    }
    setForm(DEFAULT_FORM);
    onSuccess();
  };

  const isEditMode = !!existing;
  return { form, setField, errors, submit, isEditMode };
};