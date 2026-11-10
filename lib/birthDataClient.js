"use client";

// Birth details the customer chose to keep for their next BaZi order.
// Members: saved on their account. Guests: saved in this browser only.
const KEY = "vesperBirthData";

export const BIRTH_FIELDS = [
  "birthDate",
  "birthTime",
  "biologicalGender",
  "daylightSavingTime",
  "birthLocation",
];

function pick(birth = {}) {
  return Object.fromEntries(BIRTH_FIELDS.map((key) => [key, String(birth[key] || "")]));
}

/** Saved birth details: the member's account wins over this browser's copy. */
export function getSavedBirthData(member) {
  if (member?.defaultBirthData?.birthDate) return pick(member.defaultBirthData);
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored?.birthDate) return pick(stored);
  } catch {
    // ignore
  }
  return null;
}

/**
 * Save or forget after a successful checkout.
 * saveDefaultBirthData comes from the cart context (members only).
 */
export async function applyBirthDataChoice({ keep, birth, hadSaved, isSignedIn, saveDefaultBirthData }) {
  try {
    if (keep && birth?.birthDate) {
      if (isSignedIn) {
        await saveDefaultBirthData(pick(birth));
        localStorage.removeItem(KEY);
      } else {
        localStorage.setItem(KEY, JSON.stringify(pick(birth)));
      }
    } else if (hadSaved) {
      localStorage.removeItem(KEY);
      if (isSignedIn) await saveDefaultBirthData(null);
    }
  } catch {
    // Saving is a convenience — never block the order.
  }
}
