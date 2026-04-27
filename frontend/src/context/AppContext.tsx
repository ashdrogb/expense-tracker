// src/context/AppContext.tsx
// Manages transaction state. When an encryption key is available,
// all data is encrypted before sending to server and decrypted after fetching.

import {
  createContext, useContext, useReducer, useCallback, useEffect,
  type ReactNode,
} from "react";
import type { Transaction, TransactionFormData } from "../types";
import { generateId } from "../utils";
import {
  apiFetchTransactions, apiCreateTransaction,
  apiUpdateTransaction, apiDeleteTransaction,
  apiBulkCreateTransactions,
} from "../api";
import { encryptTransaction, decryptTransaction } from "../utils/crypto";

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_TRANSACTIONS";   payload: Transaction[] }
  | { type: "ADD_TRANSACTION";    payload: Transaction }
  | { type: "BULK_ADD";           payload: Transaction[] }
  | { type: "EDIT_TRANSACTION";   payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "SET_LOADING";        payload: boolean }
  | { type: "SET_ERROR";          payload: string | null };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_TRANSACTIONS":   return { ...state, transactions: action.payload, loading: false };
    case "BULK_ADD":           return { ...state, transactions: [...action.payload, ...state.transactions] };
    case "ADD_TRANSACTION":    return { ...state, transactions: [action.payload, ...state.transactions] };
    case "EDIT_TRANSACTION":   return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? { ...action.payload, createdAt: t.createdAt } : t) };
    case "DELETE_TRANSACTION": return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case "SET_LOADING":        return { ...state, loading: action.payload };
    case "SET_ERROR":          return { ...state, error: action.payload, loading: false };
    default: return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction:      (form: TransactionFormData) => Promise<void>;
  bulkAddTransactions: (txns: Transaction[]) => Promise<void>;
  deleteTransaction:   (id: string) => Promise<void>;
  editTransaction:     (id: string, form: TransactionFormData) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode;
  isLoggedIn: boolean;
  encKey: CryptoKey | null; // passed from App.tsx via EncryptionContext
}

export const AppProvider = ({ children, isLoggedIn, encKey }: AppProviderProps) => {
  const [state, dispatch] = useReducer(reducer, { transactions: [], loading: false, error: null });

  // ── Fetch and decrypt all transactions on login ───────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch({ type: "SET_LOADING", payload: true });
    apiFetchTransactions().then(async txns => {
      // Decrypt each transaction if encryption key is available
      const decrypted = encKey
        ? await Promise.all(txns.map(async t => {
            const { description, category } = await decryptTransaction(t, encKey);
            return { ...t, description, category: category as any };
          }))
        : txns;
      dispatch({ type: "SET_TRANSACTIONS", payload: decrypted });
    }).catch(e => dispatch({ type: "SET_ERROR", payload: e.message }));
  }, [isLoggedIn, encKey]);

  // ── Add — encrypt before sending ─────────────────────────────────────────
  const addTransaction = useCallback(async (form: TransactionFormData) => {
    const txn: Transaction = {
      id: generateId(),
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      createdAt: Date.now(),
    };
    // Update local state with plaintext (user sees readable data)
    dispatch({ type: "ADD_TRANSACTION", payload: txn });
    // Encrypt sensitive fields before sending to server
    const toSend = encKey
      ? { ...txn, ...(await encryptTransaction(txn, encKey)) }
      : txn;
    await apiCreateTransaction(toSend);
  }, [encKey]);

  // ── Bulk add — encrypt all before sending ────────────────────────────────
  const bulkAddTransactions = useCallback(async (txns: Transaction[]) => {
    const toSend = encKey
      ? await Promise.all(txns.map(async t => ({ ...t, ...(await encryptTransaction(t, encKey)) })))
      : txns;
    await apiBulkCreateTransactions(toSend);
    dispatch({ type: "BULK_ADD", payload: txns }); // local state stays plaintext
  }, [encKey]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    await apiDeleteTransaction(id);
  }, []);

  // ── Edit — encrypt before sending ────────────────────────────────────────
  const editTransaction = useCallback(async (id: string, form: TransactionFormData) => {
    const updated: Transaction = {
      id,
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      createdAt: Date.now(),
    };
    dispatch({ type: "EDIT_TRANSACTION", payload: updated });
    const toSend = encKey
      ? { ...form, ...(await encryptTransaction({ description: form.description, category: form.category }, encKey)) }
      : form;
    await apiUpdateTransaction(id, toSend as TransactionFormData);
  }, [encKey]);

  return (
    <AppContext.Provider value={{ transactions: state.transactions, loading: state.loading, error: state.error, addTransaction, bulkAddTransactions, deleteTransaction, editTransaction }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
