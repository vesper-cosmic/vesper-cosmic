"use client";

// Contact + shipping details the customer used last time, so the next order
// starts pre-filled (and fully editable).
// Members: saved on their account (default address). Guests: saved in this
// browser only. Both are on by default and can be switched off at checkout.
import { splitName } from "@/components/NameFields";
import { emptyAddress } from "@/lib/formOptions";

const KEY = "vesperContactData";

const ADDRESS_FIELDS = ["addressLine1", "addressLine2", "city", "stateProvince", "postalCode", "country", "phone"];

const str = (v) => String(v ?? "").trim();

function pickAddress(address = {}) {
  return Object.fromEntries(ADDRESS_FIELDS.map((key) => [key, str(address[key])]));
}

const hasAddress = (address) => Boolean(address.addressLine1 || address.city || address.postalCode);

/**
 * What was used last time.
 * @returns {{ firstName: string, lastName: string, email: string, address: object|null } | null}
 */
export function getSavedContact(member, sessionEmail = "") {
  const saved = member?.defaultAddress;
  if (member && (saved?.fullName || hasAddress(saved || {}) || member.name)) {
    const name = splitName(saved?.fullName || member.name);
    const address = pickAddress(saved || {});
    return {
      ...name,
      email: str(member.email || sessionEmail),
      address: hasAddress(address) ? address : null,
    };
  }
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "null");
    if (stored && (stored.email || stored.firstName)) {
      const address = pickAddress(stored.address || {});
      return {
        firstName: str(stored.firstName),
        lastName: str(stored.lastName),
        email: str(stored.email),
        address: hasAddress(address) ? address : null,
      };
    }
  } catch {
    // ignore
  }
  // Signed in but nothing saved yet: at least the account email.
  if (sessionEmail) return { firstName: "", lastName: "", email: str(sessionEmail), address: null };
  return null;
}

/** An address object for a form: saved values over the empty defaults (country keeps its default if none saved). */
export function addressFromSaved(saved) {
  const base = emptyAddress();
  const out = { ...base, phone: "" };
  for (const key of Object.keys(out)) {
    if (saved?.[key]) out[key] = saved[key];
  }
  return out;
}

/**
 * After a successful order: keep the details (or forget them).
 * saveDefaultAddress comes from the cart context (members only).
 */
export async function applyContactChoice({ keep, contact, isSignedIn, saveDefaultAddress }) {
  try {
    if (!keep) {
      localStorage.removeItem(KEY);
      return;
    }
    const address = pickAddress(contact?.address || {});
    const fullName = [str(contact?.firstName), str(contact?.lastName)].filter(Boolean).join(" ");
    if (isSignedIn) {
      // Only overwrite the saved address when this order actually had one.
      if (hasAddress(address)) await saveDefaultAddress({ fullName, ...address });
      localStorage.removeItem(KEY);
    } else {
      // A digital-only order has no address: keep the one saved earlier.
      let previous = null;
      try {
        previous = JSON.parse(localStorage.getItem(KEY) || "null");
      } catch {
        previous = null;
      }
      localStorage.setItem(
        KEY,
        JSON.stringify({
          firstName: str(contact?.firstName),
          lastName: str(contact?.lastName),
          email: str(contact?.email),
          address: hasAddress(address) ? address : pickAddress(previous?.address || {}),
        })
      );
    }
  } catch {
    // Saving is a convenience — never block the order.
  }
}
