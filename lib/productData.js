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

export function getStaticProductBySlug(slug) {
  return staticProducts.find((product) => product.slug === slug) || null;
}

export function getStaticProductById(id) {
  return staticProducts.find((product) => product.id === id) || null;
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