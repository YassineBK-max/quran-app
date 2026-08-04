const PBKDF2_PREFIX = "pbkdf2v1";
const ITERATIONS = 120_000;
const KEY_BITS = 256;

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_BITS
  );
  const toB64 = (u8: Uint8Array) => {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  };
  return `${PBKDF2_PREFIX}:${toB64(salt)}:${toB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(
  password: string,
  stored: string | undefined
): Promise<boolean> {
  if (!stored) return false;
  // Legacy plaintext — transparently accepts so caller can migrate the hash
  if (!stored.startsWith(`${PBKDF2_PREFIX}:`)) {
    return stored === password;
  }
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, saltB64, hashB64] = parts;
  try {
    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
      key,
      KEY_BITS
    );
    const arr = new Uint8Array(bits);
    let s = "";
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    return btoa(s) === hashB64;
  } catch {
    return false;
  }
}

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function generateParentCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let result = "";
  for (let i = 0; i < bytes.length; i++) result += chars[bytes[i] % chars.length];
  return result;
}
