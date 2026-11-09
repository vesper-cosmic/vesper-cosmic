import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import { READY_MADE_NAILS_CATEGORY, standardNailSizes } from "@/lib/formOptions";
import {
  buildProductSlug,
  mergeProducts,
  staticCategories,
  staticProducts,
} from "@/lib/productData";

/**
 * Dynamic product catalog stored in a Notion database.
 *
 * Database schema:
 * - 名稱 (title)             — Product name (used for Notion display only)
 * - 產品資料 (rich_text)     — JSON string of the full product object
 * - 上架中 (checkbox)        — Whether the product is shown in the shop
 * - 庫存 (number)            — Stock count; empty means unlimited
 *
 * 上架中 and 庫存 are real columns (not only inside the JSON) so they can be
 * edited straight from Notion too; the columns always win over the JSON.
 *
 * The static catalog in data/products.js always acts as a fallback, so the
 * storefront keeps working even if Notion is unreachable or not configured.
 * A Notion product with the same id as a static product overrides it.
 */

const PRODUCT_PROPERTIES = {
  產品資料: { rich_text: {} },
  上架中: { checkbox: {} },
  庫存: { number: { format: "number" } },
};

// Notion caps a single rich_text item at 2000 characters.
const RICH_TEXT_CHUNK = 1900;

export function createProductClient() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({ auth: process.env.NOTION_TOKEN });
}

export async function getProductDatabaseId() {
  return process.env.NOTION_PRODUCTS_DATABASE_ID || "";
}

async function getProductDataSourceId(notion) {
  return resolveDataSourceId(notion, await getProductDatabaseId());
}

/** Every product page in the Notion database, paired with its parsed product. */
async function listProductPages(notion, dataSourceId) {
  const seen = new Set();
  const entries = [];
  let startCursor;

  do {
    const queryResult = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: startCursor,
    });

    for (const page of queryResult.results || []) {
      const parsed = parseProductPage(page);
      if (!parsed?.id || seen.has(parsed.id)) continue;
      seen.add(parsed.id);
      entries.push({ page, product: parsed });
    }

    startCursor = queryResult.has_more ? queryResult.next_cursor || undefined : undefined;
  } while (startCursor);

  return entries;
}

async function findProductPage(notion, dataSourceId, id) {
  const entries = await listProductPages(notion, dataSourceId);
  return entries.find((entry) => entry.product.id === id) || null;
}

/** Read every dynamic product from the Notion product database. */
export async function findNotionProducts() {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const dataSourceId = await getProductDataSourceId(notion);
    const products = (await listProductPages(notion, dataSourceId)).map(
      (entry) => entry.product
    );

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

/**
 * Products for the admin dashboard: the full merged catalog, each tagged with
 * `source` — "notion" when it is stored in Notion (fully editable) or
 * "static" when it only exists in data/products.js so far.
 */
export async function findAdminProducts() {
  const result = await findNotionProducts();
  const notionIds = new Set(
    result?.skipped ? [] : (result.products || []).map((product) => product.id)
  );
  const products = mergeProducts(
    staticProducts,
    result?.skipped ? [] : result.products
  ).map((product) => ({
    ...product,
    published: product.published !== false,
    inventory: product.inventory ?? null,
    source: notionIds.has(product.id) ? "notion" : "static",
  }));

  return {
    configured: Boolean(await getProductDatabaseId()) && Boolean(createProductClient()),
    error: result?.skipped ? result.reason : "",
    products,
  };
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
    const page = await createProductPage(notion, product);
    return { skipped: false, product: parseProductPage(page) };
  } catch (error) {
    console.error("createNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product create failed." };
  }
}

/**
 * Update a product. A static product that is not in Notion yet is copied
 * into Notion with the same id, so it overrides the static entry from then on.
 */
export async function updateNotionProduct(id, input) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const dataSourceId = await getProductDataSourceId(notion);
    const existing = await findProductPage(notion, dataSourceId, id);
    const staticProduct = staticProducts.find((product) => product.id === id);

    if (!existing && !staticProduct) {
      return { skipped: false, error: "Product not found in Notion." };
    }

    const { errors, product } = validateProductInput({ ...input, id }, [], true);
    if (Object.keys(errors).length > 0) {
      return { skipped: false, error: "Validation failed.", errors };
    }

    const merged = {
      ...product,
      id,
      createdAt: existing?.product.createdAt || new Date().toISOString(),
    };

    const page = existing
      ? await notion.pages.update({
          page_id: existing.page.id,
          properties: productPageProperties(merged, await getCommissionColumn(notion)),
        })
      : await createProductPage(notion, merged);

    return { skipped: false, product: parseProductPage(page) };
  } catch (error) {
    console.error("updateNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product update failed." };
  }
}

/**
 * Change only the shelf status and/or stock of a product, leaving every
 * other field untouched. `changes` may contain `published` and `inventory`.
 */
export async function updateProductStock(id, changes = {}) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  try {
    const dataSourceId = await getProductDataSourceId(notion);
    const existing = await findProductPage(notion, dataSourceId, id);
    const base = existing?.product || staticProducts.find((product) => product.id === id);

    if (!base) {
      return { skipped: false, error: "Product not found." };
    }

    const next = { ...base };
    if ("published" in changes) next.published = Boolean(changes.published);
    if ("inventory" in changes) next.inventory = normalizeInventory(changes.inventory);

    const page = existing
      ? await notion.pages.update({
          page_id: existing.page.id,
          properties: productPageProperties(next, await getCommissionColumn(notion)),
        })
      : await createProductPage(notion, {
          ...next,
          createdAt: next.createdAt || new Date().toISOString(),
        });

    return { skipped: false, product: parseProductPage(page) };
  } catch (error) {
    console.error("updateProductStock failed:", error);
    return { skipped: false, error: error.message || "Product update failed." };
  }
}

export async function deleteNotionProduct(id) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  if (staticProducts.some((product) => product.id === id)) {
    return {
      skipped: false,
      error: "內建產品無法刪除，請改用「下架」。 Built-in products can only be unpublished.",
    };
  }

  try {
    const dataSourceId = await getProductDataSourceId(notion);
    const existing = await findProductPage(notion, dataSourceId, id);

    if (!existing) {
      return { skipped: false, error: "Product not found in Notion." };
    }

    await notion.pages.update({ page_id: existing.page.id, in_trash: true });

    return { skipped: false, success: true };
  } catch (error) {
    console.error("deleteNotionProduct failed:", error);
    return { skipped: false, error: error.message || "Product delete failed." };
  }
}

/**
 * Deduct ordered quantities from stock. Products without a stock count
 * (inventory null) are unlimited and left alone. Stock never goes below 0.
 */
export async function decrementProductInventory(items = []) {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  const quantities = new Map();
  items.forEach((item) => {
    if (!item?.productId) return;
    const quantity = Math.max(1, Number(item.quantity || 1));
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + quantity);
  });
  if (quantities.size === 0) return { skipped: false, updated: [] };

  const dataSourceId = await getProductDataSourceId(notion);
  const entries = await listProductPages(notion, dataSourceId);
  const updated = [];

  for (const [productId, quantity] of quantities) {
    const entry = entries.find((candidate) => candidate.product.id === productId);
    if (!entry || entry.product.inventory == null) continue;

    const inventory = Math.max(0, entry.product.inventory - quantity);
    await notion.pages.update({
      page_id: entry.page.id,
      properties: productPageProperties({ ...entry.product, inventory }),
    });
    updated.push({ productId, inventory });
  }

  return { skipped: false, updated };
}

/**
 * Prepare the Notion product database.
 * - Not configured yet: create a new database next to the orders database
 *   and return its id, to be saved as NOTION_PRODUCTS_DATABASE_ID.
 * - Already configured: make sure the required columns exist.
 */
export async function setupProductDatabase() {
  const notion = createProductClient();
  if (!notion) throw new Error("Missing NOTION_TOKEN.");

  if (await getProductDatabaseId()) {
    const dataSourceId = await getProductDataSourceId(notion);
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: PRODUCT_PROPERTIES,
    });
    return { created: false };
  }

  const parentPageId = await findOrdersParentPageId(notion);
  const database = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: "Vesper Cosmos 產品" } }],
    initial_data_source: {
      properties: {
        名稱: { title: {} },
        ...PRODUCT_PROPERTIES,
      },
    },
  });

  return { created: true, databaseId: database.id };
}

/** Copy every static product that is not in Notion yet into Notion. */
export async function importStaticProducts() {
  const notion = createProductClient();
  const databaseId = await getProductDatabaseId();

  if (!notion || !databaseId) {
    return { skipped: true, reason: "Missing product database config." };
  }

  const dataSourceId = await getProductDataSourceId(notion);
  const existingIds = new Set(
    (await listProductPages(notion, dataSourceId)).map((entry) => entry.product.id)
  );
  const imported = [];

  // Earlier entries get later timestamps, so the newest-first sort keeps
  // the data/products.js order.
  const missing = staticProducts.filter((product) => !existingIds.has(product.id));
  const baseTime = Date.now() - missing.length * 1000;
  for (let index = 0; index < missing.length; index += 1) {
    const product = missing[index];
    await createProductPage(notion, {
      ...product,
      published: product.published !== false,
      inventory: product.inventory ?? null,
      createdAt: new Date(baseTime - index * 1000).toISOString(),
    });
    imported.push(product.id);
  }

  return { skipped: false, imported };
}

async function findOrdersParentPageId(notion) {
  const ordersId = process.env.NOTION_DATABASE_ID;
  if (!ordersId) throw new Error("Missing NOTION_DATABASE_ID.");

  const dataSource = await notion.dataSources.retrieve({
    data_source_id: await resolveDataSourceId(notion, ordersId),
  });
  const database = await notion.databases.retrieve({
    database_id: dataSource.parent?.database_id,
  });

  if (database.parent?.type !== "page_id") {
    throw new Error(
      "訂單資料庫不在一般頁面底下，無法自動建立。請在 Notion 手動建立產品資料庫並連結 integration。"
    );
  }
  return database.parent.page_id;
}

async function createProductPage(notion, product) {
  const dataSourceId = await getProductDataSourceId(notion);
  return notion.pages.create({
    parent: { type: "data_source_id", data_source_id: dataSourceId },
    properties: productPageProperties(product, await getCommissionColumn(notion)),
  });
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

  // Ready-made nails come in one fixed size, so no measurements are asked.
  const isReadyMadeNails = category === READY_MADE_NAILS_CATEGORY;
  const nailSize = standardNailSizes.includes(String(raw.nailSize || "").toUpperCase())
    ? String(raw.nailSize).toUpperCase()
    : "";
  if (isReadyMadeNails && !nailSize) {
    errors.nailSize = "Choose the size of this ready-made set (XS, S, M or L).";
  }
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
    shippingTier: ["LIGHT", "HEAVY", "DIGITAL"].includes(raw.shippingTier)
      ? raw.shippingTier
      : raw.requiresShipping
      ? "LIGHT"
      : "DIGITAL",
    requiresNailDetails: isReadyMadeNails ? false : Boolean(raw.requiresNailDetails),
    nailSize: isReadyMadeNails ? nailSize : "",
    nailIntro: String(raw.nailIntro || "").trim(),
    includes: String(raw.includes || "").trim(),
    badge: String(raw.badge || "").trim() || null,
    images: Array.isArray(raw.images)
      ? raw.images.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    inventory: normalizeInventory(raw.inventory),
    referralCommission: normalizeCommission(raw.referralCommission),
    published: raw.published !== false,
    isNew: Boolean(raw.isNew),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };

  return { errors, product };
}

function normalizeInventory(value) {
  if (value == null || value === "") return null;
  return Math.max(0, Math.floor(Number(value)) || 0);
}

/**
 * `commissionColumn`: the Notion column holding the referral commission.
 * When given (and the product has a commission value) it is written too;
 * otherwise that column is left untouched.
 */
function productPageProperties(product, commissionColumn = "") {
  // referralCommission lives only in its own Notion column, not in the JSON.
  const { source, referralCommission, ...stored } = product;
  const properties = {
    名稱: title(stored.name),
    產品資料: chunkedRichText(JSON.stringify(stored)),
    上架中: { checkbox: stored.published !== false },
    庫存: { number: stored.inventory ?? null },
  };
  if (commissionColumn && referralCommission !== undefined) {
    properties[commissionColumn] = { number: normalizeCommission(referralCommission) };
  }
  return properties;
}

const DEFAULT_COMMISSION_COLUMN = "分潤金額";
const commissionColumns = new Map();

/**
 * Name of the commission column in the products database. Uses an existing
 * number column whose name contains 分潤/回饋/返利/佣金, or creates "分潤金額".
 */
async function getCommissionColumn(notion) {
  const dataSourceId = await getProductDataSourceId(notion);
  if (commissionColumns.has(dataSourceId)) return commissionColumns.get(dataSourceId);

  const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  let name = Object.entries(dataSource.properties || {}).find(
    ([columnName, property]) =>
      property.type === "number" && COMMISSION_COLUMN_PATTERN.test(columnName)
  )?.[0];

  if (!name) {
    name = DEFAULT_COMMISSION_COLUMN;
    await notion.dataSources.update({
      data_source_id: dataSourceId,
      properties: { [name]: { number: { format: "dollar" } } },
    });
  }

  commissionColumns.set(dataSourceId, name);
  return name;
}

function normalizeCommission(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.round(number * 100) / 100;
}

function parseProductPage(page) {
  const raw = textOf(page.properties?.["產品資料"]);
  if (!raw) return null;
  let product;
  try {
    product = JSON.parse(raw);
  } catch {
    return null;
  }

  const publishedProperty = page.properties?.["上架中"];
  if (publishedProperty?.type === "checkbox") {
    product.published = publishedProperty.checkbox;
  }
  const inventoryProperty = page.properties?.["庫存"];
  if (inventoryProperty?.type === "number") {
    product.inventory = normalizeInventory(inventoryProperty.number);
  }
  product.referralCommission = readReferralCommission(page.properties);
  return product;
}

// Referral commission per unit (USD), from a number column the store owner
// adds in Notion, e.g. "分潤金額". Any number column whose name contains one
// of these words is used.
const COMMISSION_COLUMN_PATTERN = /分潤|回饋|返利|佣金/;

function readReferralCommission(properties = {}) {
  for (const [name, property] of Object.entries(properties)) {
    if (property?.type === "number" && COMMISSION_COLUMN_PATTERN.test(name)) {
      const value = Number(property.number);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }
  }
  return 0;
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

function chunkedRichText(content) {
  // Split by code point so an emoji is never cut in half.
  const characters = Array.from(content || "");
  const chunks = [];
  for (let index = 0; index < characters.length; index += RICH_TEXT_CHUNK) {
    chunks.push({
      text: { content: characters.slice(index, index + RICH_TEXT_CHUNK).join("") },
    });
  }
  return { rich_text: chunks.length ? chunks : [{ text: { content: "" } }] };
}

function title(content) {
  return { title: [{ text: { content: content || "" } }] };
}
