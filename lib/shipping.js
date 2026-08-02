// Shipping rate calculation for Vesper Cosmos.
//
// Products are classified into 3 shipping tiers:
//   DIGITAL — no physical shipping (weight 0 kg)
//   LIGHT   — lightweight physical items (~100g–150g per unit)
//   HEAVY   — heavy / fragile physical items (~300g–500g per unit)
//
// Free shipping threshold: subtotal of physical items >= $89.00 USD.

export const SHIPPING_TIERS = {
  DIGITAL: "DIGITAL",
  LIGHT: "LIGHT",
  HEAVY: "HEAVY",
};

export const FREE_SHIPPING_THRESHOLD = 89.0;

export const BASE_RATES = {
  LIGHT: 8.0,
  HEAVY: 15.0,
};

export const ADD_ON_RATES = {
  LIGHT: 2.0,
  HEAVY: 6.0,
};

/**
 * Determine the shipping tier for a product.
 *
 * A product may carry an explicit `shippingTier` field (set in the static
 * catalog or the admin form). If absent, we fall back to `requiresShipping`:
 *   - requiresShipping === false  → DIGITAL
 *   - requiresShipping === true   → LIGHT (safe default for unknown physical items)
 */
export function getShippingTier(product) {
  if (!product) return SHIPPING_TIERS.DIGITAL;

  const explicit = String(product.shippingTier || "").toUpperCase();
  if (explicit === SHIPPING_TIERS.DIGITAL) return SHIPPING_TIERS.DIGITAL;
  if (explicit === SHIPPING_TIERS.LIGHT) return SHIPPING_TIERS.LIGHT;
  if (explicit === SHIPPING_TIERS.HEAVY) return SHIPPING_TIERS.HEAVY;

  return product.requiresShipping === false
    ? SHIPPING_TIERS.DIGITAL
    : SHIPPING_TIERS.LIGHT;
}

/**
 * Calculate the shipping fee for a cart.
 *
 * @param {Array<{product?: object, price?: number, quantity?: number}>} cartItems
 *   Each item must expose a `product` object (used to derive the tier) and a
 *   `quantity`. `price` is used for the free-shipping subtotal check.
 *
 * @returns {{ shippingFee: number, subtotal: number, freeShipping: boolean, tierCounts: object }}
 */
export function calculateShippingFee(cartItems) {
  const items = Array.isArray(cartItems) ? cartItems : [];

  // 1. Compute subtotal (all items, including digital) and physical subtotal.
  let totalSubtotal = 0;
  let physicalSubtotal = 0;
  const physicalItems = [];

  items.forEach((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const price = Number(item.price || 0);
    const lineTotal = price * quantity;
    totalSubtotal += lineTotal;

    const tier = getShippingTier(item.product);
    if (tier !== SHIPPING_TIERS.DIGITAL) {
      physicalSubtotal += lineTotal;
      for (let i = 0; i < quantity; i += 1) {
        physicalItems.push(tier);
      }
    }
  });

  // 2. Free shipping rule.
  //    Digital items count toward the $89 threshold, but only physical items
  //    can trigger a shipping fee. If there are no physical items, fee is $0.
  if (physicalItems.length === 0) {
    return {
      shippingFee: 0,
      subtotal: totalSubtotal,
      freeShipping: false,
      tierCounts: { LIGHT: 0, HEAVY: 0 },
    };
  }

  if (totalSubtotal >= FREE_SHIPPING_THRESHOLD) {
    return {
      shippingFee: 0,
      subtotal: totalSubtotal,
      freeShipping: true,
      tierCounts: countTiers(physicalItems),
    };
  }

  // 3. Determine base fee (highest tier in cart).
  const hasHeavy = physicalItems.includes(SHIPPING_TIERS.HEAVY);
  let shippingFee = hasHeavy ? BASE_RATES.HEAVY : BASE_RATES.LIGHT;

  // Capture tier counts BEFORE removing the primary item.
  const tierCounts = countTiers(physicalItems);

  // Remove the first physical item — it is covered by the base rate.
  const primaryTier = hasHeavy ? SHIPPING_TIERS.HEAVY : SHIPPING_TIERS.LIGHT;
  const primaryIndex = physicalItems.indexOf(primaryTier);
  if (primaryIndex !== -1) {
    physicalItems.splice(primaryIndex, 1);
  }

  // 4. Add add-on fees for every remaining physical item.
  physicalItems.forEach((tier) => {
    shippingFee += ADD_ON_RATES[tier] || 0;
  });

  return {
    shippingFee: round2(shippingFee),
    subtotal: totalSubtotal,
    freeShipping: false,
    tierCounts,
  };
}

function countTiers(tiers) {
  return tiers.reduce(
    (counts, tier) => {
      counts[tier] = (counts[tier] || 0) + 1;
      return counts;
    },
    { LIGHT: 0, HEAVY: 0 }
  );
}

function round2(value) {
  return Math.round(value * 100) / 100;
}