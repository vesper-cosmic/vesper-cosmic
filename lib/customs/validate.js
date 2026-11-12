// Checks before printing customs documents / filling EZPost. Pure.
import { isValidHtsus } from "./htsus.js";
import { findBlocklistedWords, CUSTOMS_DESCRIPTION_MAX } from "./keywords.js";
import { isUnitedStates } from "./address.js";
import { findDangerousGoodsTerms } from "../productData.js";

export const FORMAL_ENTRY_THRESHOLD_USD = 2500;

/**
 * ctx: { address, lines, missingProducts, products, summary }
 * Returns { errors: string[], warnings: string[], ok }.
 * errors block the PDFs; warnings are shown but don't block.
 */
export function validateForCustoms({ address = {}, lines = [], missingProducts = [], products = [], summary }) {
  const errors = [];
  const warnings = [];

  if (!address.country || !isUnitedStates(address.country)) {
    errors.push(`Destination must be the United States (this order: ${address.country || "unknown"}).`);
  }
  if (!String(address.phone || "").trim()) {
    errors.push("Missing receiver phone number (required by EZPost / US customs).");
  }
  for (const [field, label] of [
    ["fullName", "receiver name"],
    ["addressLine1", "street address"],
    ["city", "city"],
    ["stateProvince", "state"],
    ["postalCode", "ZIP code"],
  ]) {
    if (!String(address[field] || "").trim()) errors.push(`Missing ${label}.`);
  }

  for (const id of missingProducts) {
    errors.push(`Product ${id} in this order no longer exists — can't build its customs line.`);
  }
  if (lines.length === 0 && missingProducts.length === 0) {
    errors.push("Nothing to declare: this order has no physical items.");
  }

  for (const line of lines) {
    const name = line.productName || line.productId;
    if (!line.description) errors.push(`${name}: missing customs description.`);
    if (!isValidHtsus(line.htsus)) errors.push(`${name}: HTSUS code must be 10 digits.`);
    if (!(line.unitWeightG > 0)) errors.push(`${name}: missing unit weight.`);

    const words = findBlocklistedWords(line.description);
    if (words.length) {
      warnings.push(`${name}: customs description uses "${words.join('", "')}" — use factual material/product terms only.`);
    }
    if (line.description.length > CUSTOMS_DESCRIPTION_MAX) {
      warnings.push(`${name}: customs description is over ${CUSTOMS_DESCRIPTION_MAX} characters.`);
    }
  }

  for (const product of products) {
    const terms = findDangerousGoodsTerms(`${product.includes || ""} ${product.description || ""}`);
    if (terms.length) {
      warnings.push(`${product.name}: possible dangerous goods (${terms.join(", ")}) — not allowed in international air mail.`);
    }
  }

  if (summary && summary.totalValueUSD > FORMAL_ENTRY_THRESHOLD_USD) {
    warnings.push(
      `Declared value $${summary.totalValueUSD.toFixed(2)} is over $${FORMAL_ENTRY_THRESHOLD_USD} — the recipient may need a formal customs entry.`
    );
  }

  return { errors, warnings, ok: errors.length === 0 };
}

/** Suggested Chunghwa Post service for EZPost. */
export function suggestService({ products = [], grossWeightG = 0 }) {
  const fragile = products.some(
    (p) => p.shippingTier === "HEAVY" || /bottle|jar|glass/i.test(`${p.category} ${p.name} ${p.customs?.description || ""}`)
  );
  if (fragile) {
    return { service: "國際航空包裹 或 國際快捷", reason: "Contains glass / fragile items." };
  }
  if (grossWeightG <= 2000) {
    return { service: "國際e小包", reason: "Under 2 kg and not fragile." };
  }
  return { service: "國際航空包裹", reason: "Over 2 kg." };
}
