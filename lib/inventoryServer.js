import "server-only";

import { Client } from "@notionhq/client";
import { resolveDataSourceId } from "@/lib/notionDataSource";
import {
  MOVEMENT_ADJUST,
  MOVEMENT_PURCHASE,
  TARGET_MATERIAL,
  computeMaterialStats,
  formatPurchaseNo,
  resolveAdjustment,
  roundMoney,
  roundQty,
  summarizeInventory,
  validatePurchase,
} from "@/lib/inventory";

// Raw-material inventory lives in three Notion databases:
//   原料 Materials (NOTION_MATERIALS_DATABASE_ID)        — the list of materials
//   進貨紀錄 Purchases (NOTION_PURCHASES_DATABASE_ID)     — one row per purchased item
//   庫存異動 Stock movements (NOTION_STOCK_MOVEMENTS_DATABASE_ID) — every stock change
// Stock and average cost are computed from the movements; nothing is typed in.

const M = { title: "名稱", unit: "單位", safety: "安全庫存量", note: "備註", inactive: "停用" };
const P = {
  title: "名稱",
  no: "進貨編號",
  date: "進貨日期",
  supplier: "供應商",
  materialId: "原料ID",
  materialName: "原料名稱",
  unit: "單位",
  quantity: "數量",
  total: "該項總額 (TWD)",
  note: "備註",
};
const S = {
  title: "名稱",
  type: "類型",
  targetType: "對象類型",
  targetId: "對象ID",
  targetName: "對象名稱",
  quantity: "數量變動",
  amount: "金額 (TWD)",
  orderId: "訂單編號",
  purchaseNo: "進貨編號",
  note: "備註",
  at: "時間",
};

const SCHEMAS = {
  materials: {
    env: "NOTION_MATERIALS_DATABASE_ID",
    title: M.title,
    properties: {
      [M.unit]: { rich_text: {} },
      [M.safety]: { number: { format: "number" } },
      [M.note]: { rich_text: {} },
      [M.inactive]: { checkbox: {} },
    },
  },
  purchases: {
    env: "NOTION_PURCHASES_DATABASE_ID",
    title: P.title,
    properties: {
      [P.no]: { rich_text: {} },
      [P.date]: { date: {} },
      [P.supplier]: { rich_text: {} },
      [P.materialId]: { rich_text: {} },
      [P.materialName]: { rich_text: {} },
      [P.unit]: { rich_text: {} },
      [P.quantity]: { number: { format: "number" } },
      [P.total]: { number: { format: "number" } },
      [P.note]: { rich_text: {} },
    },
  },
  movements: {
    env: "NOTION_STOCK_MOVEMENTS_DATABASE_ID",
    title: S.title,
    properties: {
      [S.type]: { select: { options: ["進貨", "耗用", "調整", "取消回補"].map((name) => ({ name })) } },
      [S.targetType]: { select: { options: ["原料", "成品"].map((name) => ({ name })) } },
      [S.targetId]: { rich_text: {} },
      [S.targetName]: { rich_text: {} },
      [S.quantity]: { number: { format: "number" } },
      [S.amount]: { number: { format: "number" } },
      [S.orderId]: { rich_text: {} },
      [S.purchaseNo]: { rich_text: {} },
      [S.note]: { rich_text: {} },
      [S.at]: { date: {} },
    },
  },
};

function client() {
  if (!process.env.NOTION_TOKEN) return null;
  return new Client({
    auth: process.env.NOTION_TOKEN,
    // Never serve a cached Notion response (Next.js caches server fetches).
    fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
  });
}

export function inventoryConfigured() {
  return Boolean(process.env.NOTION_TOKEN && Object.values(SCHEMAS).every((s) => process.env[s.env]));
}

async function source(notion, key) {
  const schema = SCHEMAS[key];
  return resolveDataSourceId(notion, process.env[schema.env], { title: schema.title, properties: schema.properties });
}

const rich = (value) => ({ rich_text: [{ text: { content: String(value ?? "").slice(0, 1900) } }] });
const title = (value) => ({ title: [{ text: { content: String(value ?? "").slice(0, 200) } }] });
const text = (property) => (property?.rich_text || property?.title || []).map((item) => item.plain_text || "").join("");

async function queryAll(notion, dataSourceId, extra = {}) {
  const rows = [];
  let cursor;
  do {
    const page = await notion.dataSources.query({ data_source_id: dataSourceId, page_size: 100, start_cursor: cursor, ...extra });
    rows.push(...(page.results || []));
    cursor = page.has_more ? page.next_cursor || undefined : undefined;
  } while (cursor);
  return rows;
}

function parseMaterial(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    name: text(p[M.title]),
    unit: text(p[M.unit]),
    safetyStock: p[M.safety]?.number ?? 0,
    note: text(p[M.note]),
    active: !p[M.inactive]?.checkbox,
  };
}

function parseMovement(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    type: p[S.type]?.select?.name || "",
    targetType: p[S.targetType]?.select?.name || "",
    targetId: text(p[S.targetId]),
    targetName: text(p[S.targetName]),
    quantity: p[S.quantity]?.number ?? 0,
    amountTWD: p[S.amount]?.number ?? 0,
    orderId: text(p[S.orderId]),
    purchaseNo: text(p[S.purchaseNo]),
    note: text(p[S.note]),
    at: p[S.at]?.date?.start || page.created_time || null,
  };
}

const notConfigured = { skipped: true, reason: "尚未設定原料庫存的 Notion 資料庫（NOTION_MATERIALS / PURCHASES / STOCK_MOVEMENTS_DATABASE_ID）。" };

/** Materials with live stock, average cost and value, plus totals. */
export async function getInventory() {
  const notion = client();
  if (!notion || !inventoryConfigured()) return { ...notConfigured, materials: [], summary: summarizeInventory([]) };
  try {
    const [materialRows, movementRows] = await Promise.all([
      source(notion, "materials").then((id) => queryAll(notion, id)),
      source(notion, "movements").then((id) => queryAll(notion, id)),
    ]);
    const materials = materialRows.map(parseMaterial).sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    const stats = computeMaterialStats(materials, movementRows.map(parseMovement));
    return { skipped: false, materials: stats, summary: summarizeInventory(stats) };
  } catch (error) {
    console.error("getInventory failed:", error);
    return { skipped: true, reason: error.message || "Could not load the inventory.", materials: [], summary: summarizeInventory([]) };
  }
}

export async function createMaterial({ name, unit, safetyStock, note }) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return notConfigured;
  const cleanName = String(name || "").trim().slice(0, 100);
  if (!cleanName) return { skipped: false, error: "請輸入原料名稱。" };
  try {
    const id = await source(notion, "materials");
    const existing = await queryAll(notion, id);
    if (existing.some((row) => text(row.properties?.[M.title]).trim() === cleanName)) {
      return { skipped: false, error: `已經有「${cleanName}」這個原料了。` };
    }
    const page = await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: id },
      properties: {
        [M.title]: title(cleanName),
        [M.unit]: rich(String(unit || "").trim().slice(0, 20)),
        [M.safety]: { number: Number(safetyStock) > 0 ? Number(safetyStock) : 0 },
        [M.note]: rich(String(note || "").trim().slice(0, 500)),
        [M.inactive]: { checkbox: false },
      },
    });
    return { skipped: false, material: parseMaterial(page) };
  } catch (error) {
    console.error("createMaterial failed:", error);
    return { skipped: true, reason: error.message || "Could not create the material." };
  }
}

/** Edit a material's name, unit, safety stock, note, or switch it off (停用). */
export async function updateMaterial(materialId, fields = {}) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return notConfigured;
  const properties = {};
  if ("name" in fields) {
    const name = String(fields.name || "").trim().slice(0, 100);
    if (!name) return { skipped: false, error: "原料名稱不能是空的。" };
    properties[M.title] = title(name);
  }
  if ("unit" in fields) properties[M.unit] = rich(String(fields.unit || "").trim().slice(0, 20));
  if ("safetyStock" in fields) properties[M.safety] = { number: Number(fields.safetyStock) > 0 ? Number(fields.safetyStock) : 0 };
  if ("note" in fields) properties[M.note] = rich(String(fields.note || "").trim().slice(0, 500));
  if ("active" in fields) properties[M.inactive] = { checkbox: !fields.active };
  try {
    await notion.pages.update({ page_id: materialId, properties });
    return { skipped: false };
  } catch (error) {
    console.error("updateMaterial failed:", error);
    return { skipped: true, reason: error.message || "Could not update the material." };
  }
}

async function writeMovement(notion, movementSourceId, movement) {
  const typeLabel = `${movement.type} ${movement.targetName}`;
  return notion.pages.create({
    parent: { type: "data_source_id", data_source_id: movementSourceId },
    properties: {
      [S.title]: title(typeLabel),
      [S.type]: { select: { name: movement.type } },
      [S.targetType]: { select: { name: movement.targetType } },
      [S.targetId]: rich(movement.targetId),
      [S.targetName]: rich(movement.targetName),
      [S.quantity]: { number: roundQty(movement.quantity) },
      [S.amount]: { number: roundMoney(movement.amountTWD || 0) },
      [S.orderId]: rich(movement.orderId || ""),
      [S.purchaseNo]: rich(movement.purchaseNo || ""),
      [S.note]: rich(movement.note || ""),
      [S.at]: { date: { start: movement.at || new Date().toISOString() } },
    },
  });
}

/**
 * Record one purchase of several materials (進貨登記).
 * input: { date, supplier, note, lines: [{ materialId, quantity, totalTWD }] }
 * Writes one 進貨紀錄 row and one 進貨 stock movement per item.
 */
export async function createPurchase(input) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return notConfigured;
  try {
    const materialRows = await queryAll(notion, await source(notion, "materials"));
    const materialsById = Object.fromEntries(materialRows.map(parseMaterial).map((m) => [m.id, m]));
    const checked = validatePurchase(input, materialsById);
    if (!checked.ok) return { skipped: false, errors: checked.errors };
    const { purchase } = checked;

    const purchaseSource = await source(notion, "purchases");
    const movementSource = await source(notion, "movements");

    const prefix = formatPurchaseNo(purchase.date, 0).slice(0, -2); // "VC-PUR-YYYYMMDD-"
    const sameDay = await queryAll(notion, purchaseSource, { filter: { property: P.no, rich_text: { starts_with: prefix } } });
    const used = new Set(sameDay.map((row) => text(row.properties?.[P.no])));
    let seq = 1;
    while (used.has(formatPurchaseNo(purchase.date, seq))) seq += 1;
    const purchaseNo = formatPurchaseNo(purchase.date, seq);

    for (const line of purchase.lines) {
      await notion.pages.create({
        parent: { type: "data_source_id", data_source_id: purchaseSource },
        properties: {
          [P.title]: title(`${purchaseNo} · ${line.name}`),
          [P.no]: rich(purchaseNo),
          [P.date]: { date: { start: purchase.date } },
          [P.supplier]: rich(purchase.supplier),
          [P.materialId]: rich(line.materialId),
          [P.materialName]: rich(line.name),
          [P.unit]: rich(line.unit),
          [P.quantity]: { number: line.quantity },
          [P.total]: { number: line.totalTWD },
          [P.note]: rich(purchase.note),
        },
      });
      await writeMovement(notion, movementSource, {
        type: MOVEMENT_PURCHASE,
        targetType: TARGET_MATERIAL,
        targetId: line.materialId,
        targetName: line.name,
        quantity: line.quantity,
        amountTWD: line.totalTWD,
        purchaseNo,
        note: purchase.supplier ? `供應商：${purchase.supplier}` : "",
        at: purchase.date,
      });
    }
    return { skipped: false, purchaseNo, purchase };
  } catch (error) {
    console.error("createPurchase failed:", error);
    return { skipped: true, reason: error.message || "Could not save the purchase." };
  }
}

/** Recent purchases, grouped by purchase number (newest first). */
export async function listPurchases(limit = 30) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return { ...notConfigured, purchases: [] };
  try {
    const rows = await queryAll(notion, await source(notion, "purchases"));
    const groups = new Map();
    for (const row of rows) {
      const p = row.properties || {};
      const no = text(p[P.no]);
      if (!no) continue;
      const group = groups.get(no) || { purchaseNo: no, date: p[P.date]?.date?.start || null, supplier: text(p[P.supplier]), note: text(p[P.note]), lines: [], totalTWD: 0 };
      const total = p[P.total]?.number ?? 0;
      group.lines.push({ name: text(p[P.materialName]), unit: text(p[P.unit]), quantity: p[P.quantity]?.number ?? 0, totalTWD: total });
      group.totalTWD = roundMoney(group.totalTWD + total);
      groups.set(no, group);
    }
    const purchases = Array.from(groups.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.purchaseNo.localeCompare(a.purchaseNo));
    return { skipped: false, purchases: purchases.slice(0, limit) };
  } catch (error) {
    console.error("listPurchases failed:", error);
    return { skipped: true, reason: error.message || "Could not load purchases.", purchases: [] };
  }
}

/**
 * Manual stock correction (調整). Give `delta` (change by) or `counted`
 * (the real count after a stocktake).
 */
export async function adjustMaterialStock({ materialId, delta, counted, note }) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return notConfigured;
  try {
    const inventory = await getInventory();
    if (inventory.skipped) return inventory;
    const material = inventory.materials.find((m) => m.id === materialId);
    if (!material) return { skipped: false, error: "找不到這個原料。" };
    const resolved = resolveAdjustment({ delta, counted }, material.stock);
    if (!resolved.ok) return { skipped: false, error: resolved.error };

    await writeMovement(notion, await source(notion, "movements"), {
      type: MOVEMENT_ADJUST,
      targetType: TARGET_MATERIAL,
      targetId: material.id,
      targetName: material.name,
      quantity: resolved.delta,
      amountTWD: 0,
      note: String(note || "").trim().slice(0, 500) || (counted !== undefined && counted !== "" ? "盤點調整" : "手動調整"),
    });
    return { skipped: false, delta: resolved.delta, stock: roundQty(material.stock + resolved.delta) };
  } catch (error) {
    console.error("adjustMaterialStock failed:", error);
    return { skipped: true, reason: error.message || "Could not adjust the stock." };
  }
}

/** The latest stock movements, newest first (for the history list). */
export async function listMovements(limit = 50) {
  const notion = client();
  if (!notion || !inventoryConfigured()) return { ...notConfigured, movements: [] };
  try {
    const rows = await queryAll(notion, await source(notion, "movements"));
    const movements = rows.map(parseMovement).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return { skipped: false, movements: movements.slice(0, limit) };
  } catch (error) {
    console.error("listMovements failed:", error);
    return { skipped: true, reason: error.message || "Could not load movements.", movements: [] };
  }
}
