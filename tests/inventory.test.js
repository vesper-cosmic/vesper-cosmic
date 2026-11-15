import { describe, expect, it } from "vitest";
import {
  MOVEMENT_ADJUST,
  MOVEMENT_PURCHASE,
  MOVEMENT_USE,
  TARGET_MATERIAL,
  TARGET_PRODUCT,
  computeMaterialStats,
  formatPurchaseNo,
  resolveAdjustment,
  summarizeInventory,
  validatePurchase,
} from "@/lib/inventory";

const materials = [
  { id: "m1", name: "水晶碎石", unit: "克", safetyStock: 100, active: true },
  { id: "m2", name: "玻璃瓶", unit: "個", safetyStock: 5, active: true },
  { id: "m3", name: "舊原料", unit: "個", safetyStock: 0, active: false },
];
const byId = Object.fromEntries(materials.map((m) => [m.id, m]));

const move = (targetId, type, quantity, amountTWD = 0, targetType = TARGET_MATERIAL) => ({ targetType, targetId, type, quantity, amountTWD });

describe("formatPurchaseNo", () => {
  it("uses the Taiwan date and a 2-digit sequence", () => {
    expect(formatPurchaseNo("2026-11-15T17:00:00Z", 1)).toBe("VC-PUR-20261116-01");
    expect(formatPurchaseNo("2026-11-15T01:00:00Z", 12)).toBe("VC-PUR-20261115-12");
  });
});

describe("validatePurchase", () => {
  it("accepts ticked rows and ignores blank ones", () => {
    const result = validatePurchase(
      {
        date: "2026-11-15",
        supplier: " 材料行 ",
        lines: [
          { materialId: "m1", quantity: "500", totalTWD: "250" },
          { materialId: "m2", quantity: "", totalTWD: "" },
          { materialId: "m2", quantity: 10, totalTWD: 300 },
        ],
      },
      byId
    );
    expect(result.errors).toEqual([]);
    expect(result.purchase.lines).toHaveLength(2);
    expect(result.purchase.lines[0]).toMatchObject({ materialId: "m1", quantity: 500, totalTWD: 250, unitCostTWD: 0.5 });
    expect(result.purchase.totalTWD).toBe(550);
    expect(result.purchase.supplier).toBe("材料行");
  });

  it("rejects missing amounts, zero quantities, unknown and duplicate materials", () => {
    const result = validatePurchase(
      { lines: [{ materialId: "m1", quantity: 0, totalTWD: 10 }, { materialId: "m2", quantity: 5, totalTWD: "" }, { materialId: "zz", quantity: 1, totalTWD: 1 }, { materialId: "m1", quantity: 1, totalTWD: 1 }] },
      byId
    );
    expect(result.ok).toBe(false);
    const text = result.errors.join(" ");
    expect(text).toMatch(/數量必須大於 0/);
    expect(text).toMatch(/總金額/);
    expect(text).toMatch(/找不到原料/);
    expect(text).toMatch(/重複/);
  });

  it("requires at least one item", () => {
    expect(validatePurchase({ lines: [] }, byId).errors[0]).toMatch(/至少勾選/);
  });
});

describe("computeMaterialStats", () => {
  it("averages the cost across batches bought at different prices", () => {
    const stats = computeMaterialStats(materials, [
      move("m1", MOVEMENT_PURCHASE, 500, 250), // 0.50 / g
      move("m1", MOVEMENT_PURCHASE, 500, 350), // 0.70 / g
    ]);
    const m1 = stats.find((m) => m.id === "m1");
    expect(m1.stock).toBe(1000);
    expect(m1.avgCostTWD).toBe(0.6);
    expect(m1.stockValueTWD).toBe(600);
  });

  it("consumption lowers stock but not the unit cost", () => {
    const stats = computeMaterialStats(materials, [
      move("m1", MOVEMENT_PURCHASE, 1000, 600),
      move("m1", MOVEMENT_USE, -300),
      move("m1", MOVEMENT_ADJUST, -50),
    ]);
    const m1 = stats.find((m) => m.id === "m1");
    expect(m1.stock).toBe(650);
    expect(m1.avgCostTWD).toBe(0.6);
    expect(m1.stockValueTWD).toBe(390);
  });

  it("flags low stock and negative stock, and ignores finished-goods movements", () => {
    const stats = computeMaterialStats(materials, [
      move("m1", MOVEMENT_PURCHASE, 80, 40),
      move("m2", MOVEMENT_USE, -2),
      move("m2", MOVEMENT_PURCHASE, 99, 99, TARGET_PRODUCT),
    ]);
    expect(stats.find((m) => m.id === "m1").low).toBe(true);
    const m2 = stats.find((m) => m.id === "m2");
    expect(m2.negative).toBe(true);
    expect(m2.stock).toBe(-2);
    expect(m2.stockValueTWD).toBe(0);
  });

  it("has zero cost until something is bought, and never flags inactive materials", () => {
    const stats = computeMaterialStats(materials, []);
    expect(stats.find((m) => m.id === "m1").avgCostTWD).toBe(0);
    expect(stats.find((m) => m.id === "m3").low).toBe(false);
  });

  it("summarises the active materials", () => {
    const stats = computeMaterialStats(materials, [move("m1", MOVEMENT_PURCHASE, 80, 40), move("m3", MOVEMENT_PURCHASE, 10, 1000)]);
    expect(summarizeInventory(stats)).toEqual({ materialCount: 2, totalValueTWD: 40, lowCount: 2, negativeCount: 0 });
  });
});

describe("resolveAdjustment", () => {
  it("accepts a delta or a counted number", () => {
    expect(resolveAdjustment({ delta: "-3" }, 10)).toEqual({ ok: true, delta: -3 });
    expect(resolveAdjustment({ counted: "7" }, 10)).toEqual({ ok: true, delta: -3 });
    expect(resolveAdjustment({ counted: 12.5 }, 10)).toEqual({ ok: true, delta: 2.5 });
  });
  it("rejects zero changes and bad input", () => {
    expect(resolveAdjustment({ delta: 0 }, 10).ok).toBe(false);
    expect(resolveAdjustment({ counted: 10 }, 10).ok).toBe(false);
    expect(resolveAdjustment({ counted: -1 }, 10).ok).toBe(false);
    expect(resolveAdjustment({ delta: "abc" }, 10).ok).toBe(false);
  });
});
