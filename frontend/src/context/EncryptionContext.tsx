// src/context/EncryptionContext.tsx
// Manages the encryption key for the session.
// The key is derived from the user's encryption password and kept in memory only.
// When the user closes the tab, the key is gone — data stays encrypted on server.

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { deriveKey } from "../utils/crypto";

interface EncryptionContextValue {
  encKey:      CryptoKey | null;       // null = encryption not set up yet
  isEncrypted: boolean;                // true = user has set an encryption password
  setupEncryption: (password: string) => Promise<void>;
  clearEncryption: () => void;
}

const EncryptionContext = createContext<EncryptionContextValue | null>(null);

const ENC_FLAG_KEY = "expense-tracker:enc-enabled";

export const EncryptionProvider = ({ children }: { children: ReactNode }) => {
  const [encKey, setEncKey] = useState<CryptoKey | null>(null);
  const isEncrypted = localStorage.getItem(ENC_FLAG_KEY) === "true";

  const setupEncryption = useCallback(async (password: string) => {
    const key = await deriveKey(password);
    setEncKey(key);
    localStorage.setItem(ENC_FLAG_KEY, "true");
  }, []);

  const clearEncryption = useCallback(() => {
    setEncKey(null);
    localStorage.removeItem(ENC_FLAG_KEY);
    localStorage.removeItem("expense-tracker:enc-salt");
  }, []);

  return (
    <EncryptionContext.Provider value={{ encKey, isEncrypted, setupEncryption, clearEncryption }}>
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = () => {
  const ctx = useContext(EncryptionContext);
  if (!ctx) throw new Error("useEncryption must be used within EncryptionProvider");
  return ctx;
};
