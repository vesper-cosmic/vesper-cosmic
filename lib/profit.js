// Estimated NET profit per product. Pure functions, no I/O.
//
// Net profit = price − material − PayPal fee − postage − duty & fees −
// packaging − referral commission − labour − marketing, all in TWD at the
// exchange rate passed in. Postage, entry fee and broker fee are per parcel,
// so this assumes ONE product per parcel; multi-item orders share them and the
// real margin is higher.

import { productUnitCost, paypalFeeTWD, DEFAULT_PAYPAL_FEE } from "./cost.js";
import { roundMoney } from "./inventory.js";
import { suggestPresetId } from "./customs/presets.js";

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pos = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) >= 0 && v !== "" && v !== null ? Number(v) : fallback);

export const SERVICE_EPACKET = "epacket";
export const SERVICE_AIR = "airParcel";
export const SERVICE_LABELS = { [SERVICE_EPACKET]: "e小包 ePacket", [SERVICE_AIR]: "航空包裹 Air Parcel" };
export const PACKAGING_LABELS = { envelope: "信封 Envelope", box: "箱子 Box (易碎)" };

/** Defaults from the spec. All editable on /admin/settings/profit. */
export const DEFAULT_PROFIT_SETTINGS = {
  hourlyRateTWD: 300,
  marketingPerOrderTWD: 400,
  brokerFeeTWD: 80, // estimate until confirmed in EZPost
  entryFeeUSD: 2,
  dutyRatePct: 10,
  includeReferral: true,
  packaging: {
    envelope: { costTWD: 30, weightG: 30 },
    box: { costTWD: 60, weightG: 150 },
  },
  // brackets: [[upToGrams, priceTWD], …] ascending; beyond the last bracket
  // price grows by extraTWD per started extraStepG. maxG null = no limit.
  postage: {
    [SERVICE_EPACKET]: { brackets: [[100, 200], [200, 240], [300, 280], [400, 320]], extraStepG: 100, extraTWD: 40, maxG: 2000 },
    [SERVICE_AIR]: { brackets: [[500, 500], [1000, 605]], extraStepG: 500, extraTWD: 105, maxG: null },
  },
};

/** Settings from storage or a form → a complete, sane settings object. */
export function normalizeSettings(raw) {
  const d = DEFAULT_PROFIT_SETTINGS;
  const r = raw && typeof raw === "object" ? raw : {};
  const pack = (key) => ({
    costTWD: pos(r.packaging?.[key]?.costTWD, d.packaging[key].costTWD),
    weightG: pos(r.packaging?.[key]?.weightG, d.packaging[key].weightG),
  });
  const table = (key) => {
    const t = r.postage?.[key];
    const def = d.postage[key];
    const brackets = Array.isArray(t?.brackets)
      ? t.brackets
          .map((b) => [num(b?.[0]), num(b?.[1])])
          .filter(([g, p]) => g > 0 && p >= 0)
          .sort((a, b) => a[0] - b[0])
      : [];
    const maxG = t && "maxG" in t ? (num(t.maxG) > 0 ? num(t.maxG) : null) : def.maxG;
    return {
      brackets: brackets.length ? brackets : def.brackets.map((b) => [...b]),
      extraStepG: num(t?.extraStepG) > 0 ? num(t.extraStepG) : def.extraStepG,
      extraTWD: pos(t?.extraTWD, def.extraTWD),
      maxG,
    };
  };
  return {
    hourlyRateTWD: pos(r.hourlyRateTWD, d.hourlyRateTWD),
    marketingPerOrderTWD: pos(r.marketingPerOrderTWD, d.marketingPerOrderTWD),
    brokerFeeTWD: pos(r.brokerFeeTWD, d.brokerFeeTWD),
    entryFeeUSD: pos(r.entryFeeUSD, d.entryFeeUSD),
    dutyRatePct: pos(r.dutyRatePct, d.dutyRatePct),
    includeReferral: r.includeReferral === undefined ? d.includeReferral : Boolean(r.includeReferral),
    packaging: { envelope: pack("envelope"), box: pack("box") },
    postage: { [SERVICE_EPACKET]: table(SERVICE_EPACKET), [SERVICE_AIR]: table(SERVICE_AIR) },
  };
}

/**
 * Postage in TWD for a parcel weight (grams).
 * @returns {{ ok: true, postageTWD: number } | { ok: false, reason: "noWeight" | "overLimit" }}
 */
export function postageFor(service, weightG, settings = DEFAULT_PROFIT_SETTINGS) {
  const table = settings.postage?.[service];
  const w = num(weightG);
  if (!table) return { ok: false, reason: "noWeight" };
  if (!(w > 0)) return { ok: false, reason: "noWeight" };
  if (table.maxG && w > table.maxG) return { ok: false, reason: "overLimit" };
  for (const [upTo, price] of table.brackets) {
    if (w <= upTo) return { ok: true, postageTWD: price };
  }
  const [lastUpTo, lastPrice] = table.brackets[table.brackets.length - 1];
  const steps = Math.ceil((w - lastUpTo) / table.extraStepG);
  return { ok: true, postageTWD: lastPrice + steps * table.extraTWD };
}

const isDigital = (product) => product?.requiresShipping === false || product?.category === "digital-reports";

/** Whether the product (or a bundle component) is fragile → box + air parcel. */
function isFragile(product, productsById, seen = new Set()) {
  if (!product || seen.has(product.id)) return false;
  const next = new Set(seen).add(product.id);
  if (product.customs?.fragile === true) return true;
  if (suggestPresetId(product.category) === "energy-bottle") return true;
  return (product.customs?.bundleComponents || []).some((c) => isFragile(productsById[c.productId], productsById, next));
}

/**
 * Shipping type for a product: explicit settings on the product win, else
 * nails/sachets/kits → envelope + ePacket, energy bottles → box + air parcel.
 * @returns {{ digital: boolean, packaging: "envelope"|"box", service: string }}
 */
export function shippingFor(product, productsById = {}) {
  if (isDigital(product)) return { digital: true, packaging: "envelope", service: SERVICE_EPACKET };
  const fragile = isFragile(product, productsById);
  const packaging = ["envelope", "box"].includes(product?.cost?.shippingType) ? product.cost.shippingType : fragile ? "box" : "envelope";
  const service = [SERVICE_EPACKET, SERVICE_AIR].includes(product?.cost?.postageService)
    ? product.cost.postageService
    : packaging === "box" || fragile
      ? SERVICE_AIR
      : SERVICE_EPACKET;
  return { digital: false, packaging, service };
}

/** Unit weight in grams: the product's own, or the sum of a bundle's components. */
export function unitWeightG(product, productsById = {}, seen = new Set()) {
  if (!product || seen.has(product.id)) return 0;
  const own = num(product.customs?.unitWeightG);
  if (own > 0) return own;
  const next = new Set(seen).add(product.id);
  return (product.customs?.bundleComponents || []).reduce(
    (sum, c) => sum + unitWeightG(productsById[c.productId], productsById, next) * Math.max(1, num(c.quantity) || 1),
    0
  );
}

/**
 * Estimated net profit of one product, one product per parcel.
 * Money fields are NT$; a field is null when it cannot be worked out
 * (no weight → no postage → no net profit).
 */
export function productNetProfit(product, { rate, settings = DEFAULT_PROFIT_SETTINGS, feeConfig = DEFAULT_PAYPAL_FEE, productsById = {}, materialCostById = {} }) {
  const cost = productUnitCost(product, productsById, materialCostById);
  const priceTWD = roundMoney(num(product.price) * num(rate));
  const paypalTWD = paypalFeeTWD(product.price, rate, feeConfig);
  const ship = shippingFor(product, productsById);
  const minutes = num(product.cost?.laborMinutes);
  const laborTWD = roundMoney((minutes / 60) * settings.hourlyRateTWD);
  const referralTWD = settings.includeReferral ? roundMoney(num(product.referralCommission) * num(rate)) : 0;
  const marketingTWD = roundMoney(settings.marketingPerOrderTWD);

  const warnings = { noRecipe: !cost.hasRecipe, noWeight: false, noLabor: !(minutes > 0), overLimit: false };
  let postageTWD = 0;
  let dutyFeesTWD = 0;
  let packagingTWD = 0;
  let weightG = 0;

  if (!ship.digital) {
    const pack = settings.packaging[ship.packaging];
    weightG = unitWeightG(product, productsById);
    packagingTWD = roundMoney(pack.costTWD);
    const declaredUSD = num(product.customs?.valueOverrideUSD) > 0 ? num(product.customs.valueOverrideUSD) : num(product.price);
    dutyFeesTWD = roundMoney(
      declaredUSD * num(rate) * (settings.dutyRatePct / 100) + settings.entryFeeUSD * num(rate) + settings.brokerFeeTWD
    );
    if (weightG > 0) {
      const p = postageFor(ship.service, weightG + pack.weightG, settings);
      if (p.ok) postageTWD = p.postageTWD;
      else {
        warnings.overLimit = p.reason === "overLimit";
        postageTWD = null;
      }
    } else {
      warnings.noWeight = true;
      postageTWD = null;
    }
  }

  const netTWD =
    postageTWD === null
      ? null
      : roundMoney(priceTWD - cost.materialCostTWD - paypalTWD - postageTWD - dutyFeesTWD - packagingTWD - referralTWD - laborTWD - marketingTWD);

  return {
    ...ship,
    weightG,
    materialTWD: cost.materialCostTWD,
    paypalFeeTWD: paypalTWD,
    postageTWD,
    dutyFeesTWD,
    packagingTWD,
    referralTWD,
    laborTWD,
    marketingTWD,
    netTWD,
    netPct: netTWD === null || !(priceTWD > 0) ? null : Math.round((netTWD / priceTWD) * 1000) / 10,
    warnings,
  };
}
