// src/context/AuthContext.tsx
// Manages whether the user is logged in.
// Stores the JWT token in localStorage so it survives page refresh.
// Any component can call useAuth() to get the current user or auth functions.

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { apiLogin, apiRegister } from "../api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthUser {
  email: string;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout:   () => void;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "expense-tracker:token";
const EMAIL_KEY = "expense-tracker:email";

// ─── Load saved session ───────────────────────────────────────────────────────

const loadUser = (): AuthUser | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const email = localStorage.getItem(EMAIL_KEY);
  return token && email ? { token, email } : null;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const saveUser = (token: string, email: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EMAIL_KEY, email);
    setUser({ token, email });
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    saveUser(res.token, res.email);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    saveUser(res.token, res.email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
