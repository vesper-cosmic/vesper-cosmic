// HTSUS (Harmonized Tariff Schedule of the US) codes.
// Stored as 10 digits without dots ("3926400000"); shown dotted on paper
// documents ("3926.40.0000"); typed into EZPost without dots.

/** "3926.40.0000" / "3926 40 0000" → "3926400000". */
export function stripHtsus(value) {
  return String(value || "").replace(/[\s.]/g, "");
}

/** True when the code is exactly 10 digits (after removing dots/spaces). */
export function isValidHtsus(value) {
  return /^\d{10}$/.test(stripHtsus(value));
}

/** "3926400000" → "3926.40.0000". Returns the input unchanged if not 10 digits. */
export function formatHtsus(value) {
  const digits = stripHtsus(value);
  if (!/^\d{10}$/.test(digits)) return String(value || "");
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}
