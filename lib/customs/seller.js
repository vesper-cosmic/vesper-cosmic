import "server-only";

import { LEGAL } from "@/lib/legal";

// Seller / exporter details for customs documents. Real values live in
// Vercel env vars (see .env.example); never hard-code them here.
export function getSeller() {
  const env = process.env;
  return {
    businessName: env.SELLER_BUSINESS_NAME || LEGAL.businessName || "VESPER COSMOS",
    contactName: env.SELLER_CONTACT_NAME || "",
    addressLine1: env.SELLER_ADDRESS_LINE1 || "",
    addressLine2: env.SELLER_ADDRESS_LINE2 || "",
    city: env.SELLER_CITY || "",
    postalCode: env.SELLER_POSTAL_CODE || "",
    country: env.SELLER_COUNTRY || "Taiwan",
    phone: env.SELLER_PHONE || "",
    email: env.SELLER_EMAIL || LEGAL.contactEmail || "",
    taxId: env.SELLER_TAX_ID || "",
  };
}

export function getCustomsDefaults() {
  const env = process.env;
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    packagingEnvelopeG: number(env.DEFAULT_PACKAGING_WEIGHT_ENVELOPE_G, 30),
    packagingBoxG: number(env.DEFAULT_PACKAGING_WEIGHT_BOX_G, 150),
    dutyRate: number(env.CUSTOMS_DEFAULT_DUTY_RATE, 0.1),
    entryFeeUSD: number(env.CUSTOMS_ENTRY_FEE_USD, 2),
  };
}
