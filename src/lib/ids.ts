/* ════════════════════════════════════════════════════════
   ULID Generator
   Application-generated sortable unique IDs
   Stored as CHAR(26) in TiDB
   ════════════════════════════════════════════════════════ */

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/** Generate a ULID (Universally Unique Lexicographically Sortable Identifier) */
export function generateULID(): string {
  const now = Date.now();
  let time = "";

  // Encode timestamp (first 10 chars)
  let t = now;
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    time = ENCODING[t % ENCODING_LEN] + time;
    t = Math.floor(t / ENCODING_LEN);
  }

  // Generate random part (last 16 chars)
  let random = "";
  const bytes = new Uint8Array(RANDOM_LEN);
  if (typeof globalThis.crypto !== "undefined") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < RANDOM_LEN; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < RANDOM_LEN; i++) {
    random += ENCODING[bytes[i] % ENCODING_LEN];
  }

  return time + random;
}

/** Generate a human-safe incident reference: NC-YYYY-NNNNNN */
export function generateIncidentReference(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const seq = String(sequenceNumber).padStart(6, "0");
  return `NC-${year}-${seq}`;
}

/** Generate a secure random token (hex string) */
export function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof globalThis.crypto !== "undefined") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
