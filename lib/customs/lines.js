// Turn an order into customs declaration lines. Pure functions, no I/O.
//
// Product customs data lives in product.customs:
//   { description, htsus, unitWeightG, origin, valueOverrideUSD, bundleComponents }
// bundleComponents: [{ productId, quantity }]
// A product is physical when requiresShipping !== false.

const DEFAULT_ORIGIN = "Taiwan";

export const DEFAULT_PACKAGING_G = { envelope: 30, box: 150 };

const toCents = (usd) => Math.round(Number(usd || 0) * 100);
const fromCents = (cents) => cents / 100;

export function isPhysical(product) {
  return Boolean(product) && product.requiresShipping !== false;
}

/**
 * Split `totalCents` across `weights` proportionally, in whole cents, so the
 * parts add up exactly; any rounding remainder goes to the largest part.
 */
export function allocateCents(totalCents, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0) return [];
  if (sum <= 0) {
    const parts = weights.map(() => 0);
    parts[0] = totalCents;
    return parts;
  }
  const parts = weights.map((w) => Math.floor((totalCents * w) / sum));
  const remainder = totalCents - parts.reduce((a, b) => a + b, 0);
  let largest = 0;
  weights.forEach((w, i) => {
    if (w > weights[largest]) largest = i;
  });
  parts[largest] += remainder;
  return parts;
}

function lineFor(product, qty, totalCents) {
  const customs = product.customs || {};
  const unitWeightG = Number(customs.unitWeightG) || 0;
  return {
    productId: product.id,
    productName: product.name || "",
    description: String(customs.description || "").trim(),
    htsus: String(customs.htsus || "").replace(/[\s.]/g, ""),
    qty,
    unitValueUSD: fromCents(Math.round(totalCents / qty)),
    totalValueUSD: fromCents(totalCents),
    unitWeightG,
    totalWeightG: unitWeightG * qty,
    origin: String(customs.origin || DEFAULT_ORIGIN),
  };
}

/**
 * order.items: [{ productId, quantity, price }] where price is the paid unit price.
 * productsById: { [id]: product }
 * Returns { lines, missingProducts }.
 */
export function buildCustomsLines(order, productsById) {
  const lines = [];
  const missingProducts = [];

  for (const item of order?.items || []) {
    const product = productsById[item.productId];
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (!product) {
      missingProducts.push(item.productId);
      continue;
    }

    const components = product.customs?.bundleComponents || [];
    if (components.length > 0) {
      // Bundle: declare its physical components.
      const parts = components
        .map((c) => ({ product: productsById[c.productId], qty: Math.max(1, Number(c.quantity) || 1) }))
        .filter((c) => {
          if (!c.product) missingProducts.push(c.productId);
          return Boolean(c.product);
        });
      const physical = parts.filter((c) => isPhysical(c.product));
      if (physical.length === 0) continue;

      const listCents = (c) => toCents(c.product.price) * c.qty;
      const override = Number(product.customs?.valueOverrideUSD);
      let bundleCents;
      if (override > 0) {
        bundleCents = toCents(override) * qty;
      } else {
        // Paid price minus the share of digital components (by list price).
        const allList = parts.reduce((sum, c) => sum + listCents(c), 0);
        const physicalList = physical.reduce((sum, c) => sum + listCents(c), 0);
        const paidCents = toCents(item.price) * qty;
        bundleCents = allList > 0 ? Math.round((paidCents * physicalList) / allList) : paidCents;
      }

      const split = allocateCents(bundleCents, physical.map(listCents));
      physical.forEach((c, i) => lines.push(lineFor(c.product, c.qty * qty, split[i])));
      continue;
    }

    if (!isPhysical(product)) continue; // digital: never shipped, never declared

    const override = Number(product.customs?.valueOverrideUSD);
    const unitCents = override > 0 ? toCents(override) : toCents(item.price);
    lines.push(lineFor(product, qty, unitCents * qty));
  }

  return { lines, missingProducts };
}

/** Totals for the declaration. Weights in grams. */
export function summarize(lines, packagingWeightG = DEFAULT_PACKAGING_G.envelope) {
  const totalValueCents = lines.reduce((sum, line) => sum + toCents(line.totalValueUSD), 0);
  const netWeightG = lines.reduce((sum, line) => sum + (Number(line.totalWeightG) || 0), 0);
  const packaging = Math.max(0, Number(packagingWeightG) || 0);
  return {
    lineCount: lines.length,
    totalQty: lines.reduce((sum, line) => sum + line.qty, 0),
    totalValueUSD: fromCents(totalValueCents),
    netWeightG,
    packagingWeightG: packaging,
    grossWeightG: netWeightG + packaging,
  };
}

/**
 * ESTIMATE ONLY of what prepaying US duties costs. EZPost / Chunghwa Post's
 * own calculation at label time is authoritative.
 */
export function estimateLandedCost({
  totalValueUSD,
  postageTWD = 0,
  fxTWDperUSD = 32,
  dutyRate = 0.1,
  entryFeeUSD = 2,
  brokerFeeUSD = 0,
}) {
  const value = Number(totalValueUSD) || 0;
  const fx = Number(fxTWDperUSD) > 0 ? Number(fxTWDperUSD) : 32;
  const dutyUSD = Math.round(value * (Number(dutyRate) || 0) * 100) / 100;
  const feesUSD = (Number(entryFeeUSD) || 0) + (Number(brokerFeeUSD) || 0);
  const postageUSD = Math.round(((Number(postageTWD) || 0) / fx) * 100) / 100;
  const totalUSD = Math.round((dutyUSD + feesUSD + postageUSD) * 100) / 100;
  return {
    isEstimate: true,
    dutyUSD,
    feesUSD,
    postageUSD,
    totalUSD,
    totalTWD: Math.round(totalUSD * fx),
    assumptions: { dutyRate: Number(dutyRate) || 0, entryFeeUSD, brokerFeeUSD, fxTWDperUSD: fx },
  };
}
