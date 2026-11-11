"use client";

// Remembers the customer's nail sizing in this browser (guests), alongside
// the member record (signed-in members), to pre-fill the next order.
const KEY = "vesperNailSizing";

export function rememberNailSizing(sizing) {
  if (!sizing?.sizeMode) return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        sizeMode: sizing.sizeMode,
        standardSize: sizing.sizeMode === "standard" ? sizing.standardSize || "" : "",
        measurements: sizing.sizeMode === "custom" ? sizing.measurements || {} : {},
      })
    );
  } catch {
    // ignore
  }
}

/** Remove the sizing saved in this browser. */
export function forgetNailSizing() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Saved sizing: the member's record wins over this browser's copy. */
export function getSavedNailSizing(member) {
  if (member?.nailSizing?.sizeMode) return member.nailSizing;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored?.sizeMode) return stored;
  } catch {
    // ignore
  }
  return null;
}
