import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Password hashing using Node's built-in scrypt (no external dependency).
 *
 * Format: `<salt-hex>:<hash-hex>` where hash is scrypt(password, salt, 64).
 * Stored as a 257-char string, well within Notion rich_text limits.
 */

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(String(password), salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) {
    return false;
  }
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const storedHash = Buffer.from(hash, "hex");
    const testHash = scryptSync(String(password), salt, KEY_LENGTH);
    if (storedHash.length !== testHash.length) return false;
    return timingSafeEqual(storedHash, testHash);
  } catch {
    return false;
  }
}