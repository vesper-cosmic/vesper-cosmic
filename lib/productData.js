// Client-safe product helpers shared across the app.
// Static catalog lives in data/products.js; dynamic products are loaded
// from the public /api/products endpoint (which merges Notion products with
// the static catalog server-side) and exposed through ProductProvider.
import {
  products as staticProducts,
  productCategories as staticCategories,
  singleIntentionOptions as staticSingleIntentions,
} from "@/data/products";

export {
  staticProducts,
  staticCategories,
  staticSingleIntentions,
};

export const PRODUCT_CATEGORY_IDS = (() => {
  const ids = new Set();
  const visit = (item) => {
    if (item.categoryId) ids.add(item.categoryId);
    (item.children || []).forEach(visit);
  };
  staticCategories.forEach(visit);
  return Array.from(ids);
})();

/** Merge dynamic (Notion-backed) products over the static catalog, de-duplicated by id. */
export function mergeProducts(staticList, dynamicList) {
  const map = new Map();
  (Array.isArray(staticList) ? staticList : []).forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  (Array.isArray(dynamicList) ? dynamicList : []).forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

/** Shown on every product page. */
export const PRODUCT_DISCLAIMER =
  "For entertainment and aesthetic purposes only. These products are not medical devices and have no medical or therapeutic function; they are not intended to diagnose, treat, cure or prevent any condition. No specific results or effects are guaranteed, and individual experiences vary. Not a substitute for professional medical, legal or financial advice.";

export const INCLUDES_PRESETS = [
  {
    id: "nails",
    label: "穿戴甲內容物 Press-on nails kit",
    // No alcohol prep pads: flammable dangerous goods, not allowed in international air mail.
    text: "10 press-on nails. Application kit: mini nail file, wooden cuticle stick, jelly adhesive tabs",
    categories: ["nails", "ready-made-nails", "custom-nails"],
  },
  {
    id: "bottle",
    label: "能量瓶內容物 Energy bottle",
    text: "1 handcrafted crystal energy bottle",
    categories: ["energy-bottles", "custom-energy-bottles"],
  },
];

// Items that count as dangerous goods (flammable, pressurised, lithium…) and
// are not allowed in international air mail. Used for a warning in the admin.
const DANGEROUS_GOODS_TERMS = [
  "alcohol",
  "prep pad",
  "glue",
  "nail polish",
  "perfume",
  "essential oil",
  "lighter",
  "battery",
];

/** Dangerous-goods words found in the text (case-insensitive), e.g. ["glue"]. */
export function findDangerousGoodsTerms(text) {
  const lower = String(text || "").toLowerCase();
  return DANGEROUS_GOODS_TERMS.filter((term) => lower.includes(term));
}

/** The default "includes" text for a category, or "" when it has none. */
export function defaultIncludesForCategory(categoryId) {
  return INCLUDES_PRESETS.find((preset) => preset.categories.includes(categoryId))?.text || "";
}

/** Unpublished (下架) products stay out of the shop. Missing flag means published. */
export function isProductPublished(product) {
  return Boolean(product) && product.published !== false;
}

/** inventory null/undefined means unlimited stock. */
export function isProductSoldOut(product) {
  return product?.inventory != null && Number(product.inventory) <= 0;
}

/**
 * Why `quantity` of this product cannot be ordered, or "" when it can.
 * Shared by the storefront and the order API so both say the same thing.
 */
export function stockProblem(product, quantity = 1) {
  if (!isProductPublished(product)) {
    return `${product?.name || "This product"} is no longer available.`;
  }
  if (isProductSoldOut(product)) {
    return `${product.name} is sold out.`;
  }
  if (product.inventory != null && quantity > Number(product.inventory)) {
    return `Only ${product.inventory} left of ${product.name}. Please lower the quantity.`;
  }
  return "";
}

export function getStaticProductBySlug(slug) {
  return staticProducts.find((product) => product.slug === slug) || null;
}

export function getStaticProductById(id) {
  return staticProducts.find((product) => product.id === id) || null;
}

/** Category ids a sidebar entry shows (an entry may also include others, e.g. Nails). */
export function categoryMemberIds(categoryId) {
  const entry = staticCategories.find((item) => item.categoryId === categoryId);
  return new Set(entry?.includes || [categoryId]);
}

/** Per-category counts, with "includes" entries counting all their categories. */
export function categoryCountsFor(productsList) {
  const counts = countByCategory(productsList);
  const rolled = { ...counts };
  staticCategories.forEach((item) => {
    if (item.categoryId && item.includes) {
      rolled[item.categoryId] = item.includes.reduce((sum, id) => sum + (counts[id] || 0), 0);
    }
  });
  return rolled;
}

/** A product's badges. Several are stored comma-separated, e.g. "Custom, New". */
export function productBadges(product) {
  return String(product?.badge || "")
    .split(",")
    .map((badge) => badge.trim())
    .filter(Boolean);
}

/** Find products whose id belongs to a group (all its sub-categories). */
export function groupCategoryIds(group) {
  return new Set(
    (group?.children || []).map((child) => child.categoryId).filter(Boolean)
  );
}

export function countByCategory(productsList) {
  const counts = {};
  (productsList || []).forEach((product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
  });
  return counts;
}

/**
 * Build a slug from a product name + optional id suffix so duplicate names
 * still produce unique slugs. Slugs are URL-safe and stable per product.
 */
export function buildProductSlug(name, suffixId, usedSlugs = []) {
  const base = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const root = base || "product";
  let candidate = root;
  let counter = 1;
  while (usedSlugs.includes(candidate)) {
    candidate = `${root}-${counter}`;
    counter += 1;
  }
  return suffixId ? `${candidate}-${suffixId}` : candidate;
}