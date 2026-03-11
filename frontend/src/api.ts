// src/api.ts
// All communication with the backend lives here.
// Components and context never call fetch() directly — they use these functions.
// This means if the API URL changes, only this file needs updating.

import type { Transaction, TransactionFormData } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Helper ───────────────────────────────────────────────────────────────────

// Reads the JWT from localStorage and adds it to every request header.
// The backend's authMiddleware reads this header to identify the user.
const authHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("expense-tracker:token") ?? ""}`,
});

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const apiRegister = (email: string, password: string) =>
  request<{ token: string; email: string }>("POST", "/api/auth/register", { email, password });

export const apiLogin = (email: string, password: string) =>
  request<{ token: string; email: string }>("POST", "/api/auth/login", { email, password });

// ─── Transactions ─────────────────────────────────────────────────────────────

export const apiFetchTransactions = () =>
  request<Transaction[]>("GET", "/api/transactions");

export const apiCreateTransaction = (txn: Transaction) =>
  request<{ id: string }>("POST", "/api/transactions", txn);

export const apiUpdateTransaction = (id: string, form: TransactionFormData) =>
  request<{ id: string }>("PUT", `/api/transactions/${id}`, {
    type: form.type,
    amount: parseFloat(form.amount),
    category: form.category,
    description: form.description,
    date: form.date,
  });

export const apiDeleteTransaction = (id: string) =>
  request<{ id: string }>("DELETE", `/api/transactions/${id}`);
