import "server-only";

import { Client } from "@notionhq/client";
import {
  buildProductSlug,
  mergeProducts,
  staticCategories,
  staticProducts,
} from "@/lib/productData";

/**
 * Dynamic product catalog stored in a Notion database.
 *
 * Database schema (minimal on purpose — all product fields are serialized
 * into a single rich_text column):
 * - 名稱 (title)             — Product name (used for Notion display only)
 * - 產品資料 (rich_text)     — JSON string of the full product object
 *
 * The static catalog in data/products.js always acts as a fallback, so the
 * storefront keeps working even if Notion is unreachable or not configured.
 */

export function createProductClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

export async function getProductDatabaseId() {
  return process.env.NOTION_PRODUCTS_DATABASE_ID || "";
}

/** Read every dynamic product from the Notion product database. */
export async function findNotionProducts() {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const seen = new Set();
    const products = [];
    let startCursor;

    do {
      const queryResult = await notion.databases.query({
        database_id: databaseId,
        page_size: 100,
        start_cursor: startCursor,
      });

      for (const page of queryResult.results || []) {
        const parsed = parseProductPage(page);
        if (!parsed?.id || seen.has(parsed.id)) continue;
        seen.add(parsed.id);
        products.push(parsed);
      }

      const nextHasMore = queryResult.has_more;
      startCursor = queryResult.next_cursor || undefined;
      if (!nextHasMore) break;
    } while (startCursor);

    products.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return { skipped: false, products };
  } catch (error) {
    console.error("findNotionProducts failed:", error);
    return { skipped: true, reason: error.message || "Product lookup failed." };
  }
}

/** All products (static + dynamic), dynamic taking precedence by id. */
export async function getAllProducts() {
  const result = await findNotionProducts();
  if (result?.skipped) {
    return { skipped: true, products: staticProducts, reason: result.reason };
  }
  return { skipped: false, products: mergeProducts(staticProducts, result.products) };
}

export async function getProductBySlug(slug) {
  const { skipped, products } = await getAllProducts();
  const found = (products || []).find((product) => product.slug === slug) || null;
  return { skipped, product: found };
}

export async function getProductById(id) {
  const { skipped, products } = await getAllProducts();
  const found = (products || []).find((product) => product.id === id) || null;
  return { skipped, product: found };
}

/**
 * Create a new dynamic product in Notion.
 * Returns `{ skipped, product, error }` — `skipped` means the DB is not
 * configured (API should fall back gracefully), `error` is a real failure.
 */
export async function createNotionProduct(input) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  const { errors, product } = validateProductInput(input, []);
  if (Object.keys(errors).length > 0) {
    return { skipped: false, error: "Validation failed.", errors };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: productPageProperties(product),
    });
    return { skipped: false, product: parseProductPage(page) };
  } catch (error) {
    console.error("createNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product create failed." };
  }
}

export async function updateNotionProduct(id, input) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });

    const page = (queryResult.results || []).find((entry) => {
      const parsed = parseProductPage(entry);
      return parsed?.id === id;
    });

    if (!page?.id) {
      return { skipped: false, error: "Product not found in Notion." };
    }

    const { errors, product } = validateProductInput(input, [], true);
    if (Object.keys(errors).length > 0) {
      return { skipped: false, error: "Validation failed.", errors };
    }

    const updated = await notion.pages.update({
      page_id: page.id,
      properties: productPageProperties({
        ...product,
        id,
        createdAt: parseProductPage(page)?.createdAt || new Date().toISOString(),
      }),
    });

    return { skipped: false, product: parseProductPage(updated) };
  } catch (error) {
    console.error("updateNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product update failed." };
  }
}

export async function deleteNotionProduct(id) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const queryResult = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });

    const page = (queryResult.results || []).find((entry) => {
      const parsed = parseProductPage(entry);
      return parsed?.id === id;
    });

    if (!page?.id) {
      return { skipped: false, error: "Product not found in Notion." };
    }

    await notion.blocks.delete({ block_id: page.id });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("deleteNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product delete failed." };
  }
}

/** Public list of product category options for the admin form. */
export function getProductCategoryOptions() {
  const options = [];
  const flatten = (items, depth = 0) => {
    (items || []).forEach((item) => {
      if (item.categoryId) {
        options.push({ id: item.categoryId, label: item.title, depth });
      }
      if (item.children) flatten(item.children, depth + 1);
    });
  };
  flatten(staticCategories);
  return options;
}

export function validateProductInput(raw = {}, existingSlugs = [], isUpdate = false) {
  const errors = {};
  const name = String(raw.name || "").trim();
  const price = Number(raw.price);
  const category = String(raw.category || "").trim();

  if (!name) errors.name = "Product name is required.";
  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Price must be a positive number.";
  }
  if (!category) errors.category = "Category is required.";
  if (!Array.isArray(raw.images) || raw.images.length === 0 || !raw.images.some(Boolean)) {
    errors.images = "At least one image URL is required.";
  }

  const id = isUpdate
    ? String(raw.id || "").trim()
    : `notion-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  const used = Array.isArray(existingSlugs) ? existingSlugs : [];
  if (used.includes(String(raw.slug || ""))) {
    errors.slug = "Slug already in use.";
  }

  const product = {
    id,
    slug: String(raw.slug || "").trim() || buildProductSlug(name, id.slice(-6), used),
    name,
    category,
    categoryLabel: String(raw.categoryLabel || "").trim() || category,
    productKind: String(raw.productKind || "").trim() || name,
    formType: String(raw.formType || "").trim() || "A",
    price,
    originalPrice:
      raw.originalPrice != null && Number(raw.originalPrice) > 0
        ? Number(raw.originalPrice)
        : null,
    currency: String(raw.currency || "USD").toUpperCase().trim() || "USD",
    description: String(raw.description || "").trim(),
    fulfillmentTime: String(raw.fulfillmentTime || "").trim(),
    fulfillmentMode: String(raw.fulfillmentMode || "").trim(),
    intentionType: raw.intentionType === "bazi" ? "bazi" : "single",
    availableIntentions: Array.isArray(raw.availableIntentions)
      ? raw.availableIntentions.map((item) => String(item).trim()).filter(Boolean)
      : [],
    requiresBirthData: Boolean(raw.requiresBirthData),
    requiresShipping: Boolean(raw.requiresShipping),
    requiresNailDetails: Boolean(raw.requiresNailDetails),
    nailIntro: String(raw.nailIntro || "").trim(),
    includes: String(raw.includes || "").trim(),
    badge: String(raw.badge || "").trim() || null,
    images: Array.isArray(raw.images)
      ? raw.images.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    inventory: raw.inventory == null ? null : Math.max(0, Number(raw.inventory) || 0),
    isNew: Boolean(raw.isNew),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };

  return { errors, product };
}

function productPageProperties(product) {
  return {
    名稱: title(product.name),
    產品資料: richText(JSON.stringify(product)),
  };
}

function parseProductPage(page) {
  const raw = textOf(page.properties?.["產品資料"]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function textOf(property) {
  if (!property) return "";
  if (property.type === "rich_text") {
    return (property.rich_text || []).map((item) => item.plain_text || "").join("");
  }
  if (property.type === "title") {
    return (property.title || []).map((item) => item.plain_text || "").join("");
  }
  return "";
}

function richText(content) {
  return { rich_text: [{ text: { content: content || "" } }] };
}

function title(content) {
  return { title: [{ text: { content: content || "" } }] };
}