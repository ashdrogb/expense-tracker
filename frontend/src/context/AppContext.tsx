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

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_TRANSACTIONS";  payload: Transaction[] }
  | { type: "ADD_TRANSACTION";   payload: Transaction }
  | { type: "BULK_ADD";          payload: Transaction[] }
  | { type: "EDIT_TRANSACTION";  payload: Transaction }
  | { type: "DELETE_TRANSACTION";payload: string }
  | { type: "SET_LOADING";       payload: boolean }
  | { type: "SET_ERROR";         payload: string | null };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_TRANSACTIONS":  return { ...state, transactions: action.payload, loading: false };
    // Prepend all bulk rows to existing transactions in one update
    case "BULK_ADD":          return { ...state, transactions: [...action.payload, ...state.transactions] };
    case "ADD_TRANSACTION":   return { ...state, transactions: [action.payload, ...state.transactions] };
    case "EDIT_TRANSACTION":  return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? { ...action.payload, createdAt: t.createdAt } : t) };
    case "DELETE_TRANSACTION":return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case "SET_LOADING":       return { ...state, loading: action.payload };
    case "SET_ERROR":         return { ...state, error: action.payload, loading: false };
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
}

export const AppProvider = ({ children, isLoggedIn }: AppProviderProps) => {
  const [state, dispatch] = useReducer(reducer, {
    transactions: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch({ type: "SET_LOADING", payload: true });
    apiFetchTransactions()
      .then(txns => dispatch({ type: "SET_TRANSACTIONS", payload: txns }))
      .catch(e => dispatch({ type: "SET_ERROR", payload: e.message }));
  }, [isLoggedIn]);

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
    dispatch({ type: "ADD_TRANSACTION", payload: txn });
    await apiCreateTransaction(txn);
  }, []);

  // Send all to server in one call, then update local state in one dispatch
  const bulkAddTransactions = useCallback(async (txns: Transaction[]) => {
    await apiBulkCreateTransactions(txns);
    dispatch({ type: "BULK_ADD", payload: txns });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_TRANSACTION", payload: id });
    await apiDeleteTransaction(id);
  }, []);

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
    await apiUpdateTransaction(id, form);
  }, []);

  return (
    <AppContext.Provider value={{
      transactions: state.transactions,
      loading: state.loading,
      error: state.error,
      addTransaction,
      bulkAddTransactions,
      deleteTransaction,
      editTransaction,
    }}>
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
