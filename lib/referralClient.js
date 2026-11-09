"use client";

// Referral code from a ?ref= link, remembered in this browser for 30 days so
// it can be applied at checkout even if the friend buys later.
const STORAGE_KEY = "vesperReferralCode";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function saveReferralCode(code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(clean)) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: clean, savedAt: Date.now() }));
  } catch {
    // Storage unavailable (private mode) — the checkout field still works.
  }
}

export function getReferralCode() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored?.code && Date.now() - stored.savedAt < TTL_MS) return stored.code;
  } catch {
    // ignore
  }
  return "";
}
