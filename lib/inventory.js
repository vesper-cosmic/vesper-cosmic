// Raw-material inventory and cost. Pure functions, no I/O — the Notion side
// lives in lib/inventoryServer.js.
//
// Stock of a material = the sum of its stock movements (purchases add,
// production/adjustments change it). Cost is the cumulative weighted average:
// everything ever spent on the material ÷ everything ever bought, so batches
// bought at different prices average out automatically. All money is TWD.

export const MOVEMENT_PURCHASE = "進貨";
export const MOVEMENT_USE = "耗用";
export const MOVEMENT_ADJUST = "調整";
export const MOVEMENT_RESTORE = "取消回補";

export const TARGET_MATERIAL = "原料";
export const TARGET_PRODUCT = "成品";

const round = (value, digits) => {
  const f = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};
export const roundMoney = (value) => round(value, 2);
export const roundQty = (value) => round(value, 4);

/** "VC-PUR-YYYYMMDD-NN" from a date and the day's running number. Taiwan time. */
export function formatPurchaseNo(date, seq) {
  const taipei = new Date(new Date(date).getTime() + 8 * 3600 * 1000);
  const ymd = taipei.toISOString().slice(0, 10).replace(/-/g, "");
  return `VC-PUR-${ymd}-${String(seq).padStart(2, "0")}`;
}

/**
 * Check a purchase form and normalise it.
 * input: { date, supplier, note, lines: [{ materialId, quantity, totalTWD }] }
 * Lines with no quantity and no amount are ignored (an unticked/empty row).
 * @returns {{ ok: boolean, errors: string[], purchase: object|null }}
 */
export function validatePurchase(input, materialsById = {}) {
  const errors = [];
  const seen = new Set();
  const lines = [];

  for (const raw of input?.lines || []) {
    const id = String(raw?.materialId || "").trim();
    const quantity = Number(raw?.quantity);
    const total = Number(raw?.totalTWD);
    const blank = (raw?.quantity === "" || raw?.quantity == null) && (raw?.totalTWD === "" || raw?.totalTWD == null);
    if (!id || blank) continue;

    const name = materialsById[id]?.name || id;
    if (!materialsById[id]) errors.push(`找不到原料：${name}`);
    if (seen.has(id)) errors.push(`${name} 重複了，請合併成一行。`);
    seen.add(id);
    if (!(quantity > 0)) errors.push(`${name}：數量必須大於 0。`);
    if (!(total >= 0) || raw?.totalTWD === "" || raw?.totalTWD == null) errors.push(`${name}：請填這一項的總金額（可為 0）。`);
    if (quantity > 0 && total >= 0) {
      lines.push({
        materialId: id,
        name,
        unit: materialsById[id]?.unit || "",
        quantity: roundQty(quantity),
        totalTWD: roundMoney(total),
        unitCostTWD: round(total / quantity, 4),
      });
    }
  }

  if (lines.length === 0 && errors.length === 0) errors.push("請至少勾選一項進貨品項。");

  const date = input?.date ? new Date(input.date) : new Date();
  if (Number.isNaN(date.getTime())) errors.push("進貨日期格式不正確。");

  if (errors.length) return { ok: false, errors, purchase: null };
  return {
    ok: true,
    errors: [],
    purchase: {
      date: date.toISOString(),
      supplier: String(input?.supplier || "").trim().slice(0, 100),
      note: String(input?.note || "").trim().slice(0, 500),
      lines,
      totalTWD: roundMoney(lines.reduce((sum, line) => sum + line.totalTWD, 0)),
    },
  };
}

/**
 * Stock, average cost and stock value for each material.
 * materials: [{ id, name, unit, safetyStock, active }]
 * movements: [{ targetType, targetId, type, quantity (signed), amountTWD }]
 * Only 進貨 movements feed the average cost; consumption and adjustments change
 * the stock but never the unit cost.
 */
export function computeMaterialStats(materials, movements) {
  const byId = new Map();
  for (const m of materials) {
    byId.set(m.id, { stock: 0, boughtQty: 0, boughtTotal: 0 });
  }
  for (const move of movements || []) {
    if (move.targetType !== TARGET_MATERIAL) continue;
    const entry = byId.get(move.targetId);
    if (!entry) continue;
    entry.stock += Number(move.quantity) || 0;
    if (move.type === MOVEMENT_PURCHASE) {
      entry.boughtQty += Number(move.quantity) || 0;
      entry.boughtTotal += Number(move.amountTWD) || 0;
    }
  }

  return materials.map((material) => {
    const e = byId.get(material.id);
    const stock = roundQty(e.stock);
    const avgCostTWD = e.boughtQty > 0 ? round(e.boughtTotal / e.boughtQty, 4) : 0;
    const safety = Number(material.safetyStock) || 0;
    return {
      ...material,
      stock,
      avgCostTWD,
      stockValueTWD: roundMoney(Math.max(0, stock) * avgCostTWD),
      purchasedQty: roundQty(e.boughtQty),
      purchasedTotalTWD: roundMoney(e.boughtTotal),
      low: material.active !== false && safety > 0 && stock <= safety,
      negative: stock < 0,
    };
  });
}

/** Summary line for the inventory page. */
export function summarizeInventory(stats) {
  const active = stats.filter((m) => m.active !== false);
  return {
    materialCount: active.length,
    totalValueTWD: roundMoney(active.reduce((sum, m) => sum + m.stockValueTWD, 0)),
    lowCount: active.filter((m) => m.low).length,
    negativeCount: active.filter((m) => m.negative).length,
  };
}

/**
 * A manual stock correction. Give either `delta` (change by) or `counted`
 * (the real count; the change is counted − current stock).
 * @returns {{ ok: boolean, error?: string, delta?: number }}
 */
export function resolveAdjustment({ delta, counted }, currentStock) {
  if (counted !== undefined && counted !== "" && counted !== null) {
    const n = Number(counted);
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: "盤點數量必須是 0 或正數。" };
    const change = roundQty(n - currentStock);
    return change === 0 ? { ok: false, error: "盤點數量和系統庫存相同，不需調整。" } : { ok: true, delta: change };
  }
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return { ok: false, error: "請輸入要增減的數量（不能是 0）。" };
  return { ok: true, delta: roundQty(n) };
}
