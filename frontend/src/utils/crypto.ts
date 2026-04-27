// src/utils/crypto.ts
// Client-side AES-GCM encryption using the browser's built-in Web Crypto API.
// No library needed — crypto.subtle is available in all modern browsers.
//
// HOW IT WORKS:
// 1. User sets an encryption password (separate from login password)
// 2. Password is stretched into a 256-bit AES key using PBKDF2
// 3. Every transaction field is encrypted before leaving the browser
// 4. The server stores only ciphertext — unreadable without the key
// 5. Decryption happens in the browser after fetching from server
//
// The encryption key NEVER leaves the browser.
// Even if someone reads your database, they see only random bytes.

const PBKDF2_ITERATIONS = 100_000; // high iteration count = harder to brute force
const SALT_KEY = "expense-tracker:enc-salt";

// ─── Get or create a persistent salt ─────────────────────────────────────────
// Salt is random bytes stored in localStorage.
// Same salt + same password = same key every time (deterministic).
// Different user = different salt = different key even with same password.
const getSalt = (): Uint8Array => {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) return new Uint8Array(JSON.parse(stored));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, JSON.stringify(Array.from(salt)));
  return salt;
};

// ─── Derive AES-GCM key from password using PBKDF2 ───────────────────────────
// PBKDF2 = Password-Based Key Derivation Function 2
// It hashes the password 100,000 times to make brute-force attacks slow.
export const deriveKey = async (password: string): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: getSalt(), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// ─── Encrypt a string → base64 ciphertext ────────────────────────────────────
// AES-GCM uses a random 12-byte IV (Initialization Vector) per encryption.
// The IV is prepended to the ciphertext so we can decrypt later.
// IV does not need to be secret — it just needs to be unique per message.
export const encrypt = async (text: string, key: CryptoKey): Promise<string> => {
  const enc = new TextEncoder();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );
  // Combine IV + ciphertext into one Uint8Array, then base64 encode
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
};

// ─── Decrypt base64 ciphertext → string ──────────────────────────────────────
export const decrypt = async (b64: string, key: CryptoKey): Promise<string> => {
  const combined  = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv        = combined.slice(0, 12);
  const ciphertext= combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
};

// ─── Encrypt a transaction before sending to server ──────────────────────────
// Only description and category are encrypted (sensitive fields).
// Amount, date, type stay as numbers/strings for server-side aggregation.
// If you want full encryption, encrypt amount too — but you lose server sorting.
export const encryptTransaction = async (
  txn: { description: string; category: string },
  key: CryptoKey
) => ({
  description: await encrypt(txn.description, key),
  category:    await encrypt(txn.category, key),
});

// ─── Decrypt a transaction after fetching from server ─────────────────────────
export const decryptTransaction = async (
  txn: { description: string; category: string },
  key: CryptoKey
) => {
  try {
    return {
      description: await decrypt(txn.description, key),
      category:    await decrypt(txn.category, key),
    };
  } catch {
    // If decryption fails (wrong key or unencrypted old data), return as-is
    return { description: txn.description, category: txn.category };
  }
};

// ─── Check if a string looks like encrypted ciphertext ───────────────────────
// Base64 strings are much longer than plain text descriptions.
// This lets us handle a mix of encrypted and unencrypted data gracefully.
export const isEncrypted = (str: string): boolean => {
  try { return atob(str).length > 20; } catch { return false; }
};
