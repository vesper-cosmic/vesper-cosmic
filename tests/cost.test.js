import { describe, expect, it } from "vitest";
import {
  allocateShippingCosts,
  buildCostReport,
  computeOrderProfit,
  materialUsageForItems,
  monthOf,
  paypalFeeConfig,
  paypalFeeTWD,
  productUnitCost,
  snapshotOrderCost,
} from "@/lib/cost";
import { fallbackRate, getUsdTwdRate, isPlausibleRate } from "@/lib/fx";

// Materials: crystal 0.6/g, bottle 30 each, cord 2 each.
const materialCost = { crystal: 0.6, bottle: 30, cord: 2 };

const bottle = { id: "bottle-p", name: "Energy Bottle", requiresShipping: true, cost: { recipe: [{ materialId: "crystal", quantity: 20 }, { materialId: "bottle", quantity: 1 }], packagingTWD: 5, laborTWD: 10 } };
const sachet = { id: "sachet-p", name: "Sachet", requiresShipping: true, cost: { recipe: [{ materialId: "crystal", quantity: 10 }, { materialId: "cord", quantity: 1 }] } };
const report = { id: "report-p", name: "Report", requiresShipping: false, cost: {} };
const bundle = { id: "bundle-p", name: "Set", requiresShipping: true, customs: { bundleComponents: [{ productId: "bottle-p", quantity: 1 }, { productId: "sachet-p", quantity: 2 }, { productId: "report-p", quantity: 1 }] }, cost: { packagingTWD: 8 } };
const naked = { id: "naked", name: "No recipe", requiresShipping: true };
const productsById = Object.fromEntries([bottle, sachet, report, bundle, naked].map((p) => [p.id, p]));

describe("productUnitCost", () => {
  it("adds materials at average cost plus packaging and labour", () => {
    const c = productUnitCost(bottle, productsById, materialCost);
    expect(c.materialCostTWD).toBe(42); // 20×0.6 + 30
    expect(c.extraTWD).toBe(15);
    expect(c.unitCostTWD).toBe(57);
    expect(c.hasRecipe).toBe(true);
  });

  it("adds up a bundle's components and its own extras", () => {
    const c = productUnitCost(bundle, productsById, materialCost);
    // bottle 57 + 2 × sachet (6+2=8) + report 0 + bundle packaging 8
    expect(c.unitCostTWD).toBe(57 + 16 + 8);
  });

  it("reports a missing material price and a product without a recipe", () => {
    const c = productUnitCost(bottle, productsById, { crystal: 0.6 });
    expect(c.missingMaterials).toEqual(["bottle"]);
    expect(productUnitCost(naked, productsById, materialCost).hasRecipe).toBe(false);
  });

  it("does not loop on a bundle that contains itself", () => {
    const loop = { id: "loop", customs: { bundleComponents: [{ productId: "loop", quantity: 1 }] }, cost: { packagingTWD: 3 } };
    expect(productUnitCost(loop, { loop }, {}).unitCostTWD).toBe(3);
  });
});

describe("materialUsageForItems", () => {
  it("expands recipes and bundles, multiplied by quantity", () => {
    const usage = materialUsageForItems([{ productId: "bundle-p", quantity: 2 }, { productId: "sachet-p", quantity: 1 }], productsById);
    expect(usage.get("crystal")).toBe((20 + 2 * 10) * 2 + 10);
    expect(usage.get("bottle")).toBe(2);
    expect(usage.get("cord")).toBe(2 * 2 + 1);
  });
});

describe("snapshotOrderCost", () => {
  it("saves a unit cost per item and the total", () => {
    const snap = snapshotOrderCost([{ productId: "bottle-p", quantity: 2 }, { productId: "naked", quantity: 1 }], productsById, materialCost);
    expect(snap.totalTWD).toBe(114);
    expect(snap.lines[1]).toMatchObject({ unitCostTWD: 0, hasRecipe: false });
  });
});

describe("PayPal fee", () => {
  it("is percent plus a fixed USD amount, in TWD", () => {
    expect(paypalFeeTWD(100, 32, { percent: 4.4, fixedUSD: 0.3 })).toBeCloseTo((4.4 + 0.3) * 32, 2);
    expect(paypalFeeTWD(0, 32)).toBe(0);
  });
  it("reads env overrides and falls back to the defaults", () => {
    expect(paypalFeeConfig({ PAYPAL_FEE_PERCENT: "3.9", PAYPAL_FEE_FIXED_USD: "0.49" })).toEqual({ percent: 3.9, fixedUSD: 0.49 });
    expect(paypalFeeConfig({})).toEqual({ percent: 4.4, fixedUSD: 0.3 });
  });
});

describe("computeOrderProfit", () => {
  it("converts at the order's rate and subtracts every cost", () => {
    const p = computeOrderProfit({ amountUSD: 100, rate: 30, productCostTWD: 800, postageTWD: 300, dutyFeesTWD: 100, referralRewardUSD: 5, feeConfig: { percent: 4, fixedUSD: 0.5 } });
    expect(p.revenueTWD).toBe(3000);
    expect(p.paypalFeeTWD).toBe(135); // (4 + 0.5) × 30
    expect(p.referralTWD).toBe(150);
    expect(p.totalCostTWD).toBe(800 + 135 + 300 + 100 + 150);
    expect(p.profitTWD).toBe(3000 - 1485);
    expect(p.marginPct).toBe(50.5);
  });
});

describe("allocateShippingCosts", () => {
  it("splits a shipment's postage by order amount; single orders keep their own record", () => {
    const orders = [
      { orderId: "A", amount: 100, shippingRecord: {} },
      { orderId: "B", amount: 300, shippingRecord: {} },
      { orderId: "C", amount: 50, shippingRecord: { postageTWD: 120, dutyFeesTWD: 40 } },
    ];
    const out = allocateShippingCosts(orders, [{ shipmentNo: "S1", status: "🚚 已出貨", orderIds: ["A", "B"], postageTWD: 400, dutyFeesTWD: 80 }]);
    expect(out.A).toMatchObject({ postageTWD: 100, dutyFeesTWD: 20, fromShipment: "S1" });
    expect(out.B).toMatchObject({ postageTWD: 300, dutyFeesTWD: 60 });
    expect(out.C).toMatchObject({ postageTWD: 120, dutyFeesTWD: 40, fromShipment: "" });
  });
  it("ignores cancelled shipments", () => {
    const out = allocateShippingCosts([{ orderId: "A", amount: 10, shippingRecord: { postageTWD: 5 } }], [{ shipmentNo: "S1", status: "❌ 已取消", orderIds: ["A"], postageTWD: 999 }]);
    expect(out.A.postageTWD).toBe(5);
  });
});

describe("monthOf", () => {
  it("uses Taiwan time", () => {
    expect(monthOf("2026-10-31T17:00:00Z")).toBe("2026-11");
    expect(monthOf("garbage")).toBe("");
  });
});

describe("buildCostReport", () => {
  const order = (id, extra = {}) => ({
    orderId: id,
    createdAt: "2026-11-12T08:00:00.000Z",
    paymentStatus: "✅ 已付款",
    orderStatus: "💰 已付款",
    amount: 108,
    referralReward: 0,
    shippingRecord: {},
    items: [{ productId: "bottle-p", productName: "Energy Bottle", quantity: 1, price: 100 }],
    ...extra,
  });
  const base = { productsById, materialCostById: materialCost, fallbackRate: 32, feeConfig: { percent: 0, fixedUSD: 0 } };

  it("counts only paid, non-cancelled orders and filters by month", () => {
    const r = buildCostReport({
      ...base,
      orders: [order("A"), order("B", { paymentStatus: "⏳ 待付款" }), order("C", { orderStatus: "❌ 已取消" }), order("D", { createdAt: "2026-10-05T00:00:00Z" })],
      month: "2026-11",
    });
    expect(r.orders.map((o) => o.orderId)).toEqual(["A"]);
  });

  it("uses the saved rate and cost snapshot, and flags estimates and fallback rates", () => {
    const r = buildCostReport({
      ...base,
      orders: [
        order("A", { fxRate: 30, fxSource: "live", productCostTWD: 70, costSnapshot: { lines: [{ productId: "bottle-p", quantity: 1, unitCostTWD: 70, hasRecipe: true }] } }),
        order("B"),
      ],
    });
    const a = r.orders.find((o) => o.orderId === "A");
    const b = r.orders.find((o) => o.orderId === "B");
    expect(a).toMatchObject({ rate: 30, rateSource: "live", costBasis: "actual", revenueTWD: 3240, productCostTWD: 70 });
    expect(b).toMatchObject({ rate: 32, rateSource: "fallback", costBasis: "estimate", productCostTWD: 57 });
    expect(r.warnings).toMatchObject({ estimatedOrders: 1, fallbackRateOrders: 1 });
  });

  it("totals, per-product margin and products without a recipe", () => {
    const r = buildCostReport({
      ...base,
      orders: [order("A", { fxRate: 30, items: [{ productId: "bottle-p", productName: "Energy Bottle", quantity: 2, price: 50 }, { productId: "naked", productName: "No recipe", quantity: 1, price: 8 }] })],
    });
    expect(r.totals.orderCount).toBe(1);
    expect(r.totals.revenueTWD).toBe(3240);
    const p = r.byProduct.find((x) => x.productId === "bottle-p");
    expect(p).toMatchObject({ quantity: 2, revenueTWD: 3000, costTWD: 114 });
    expect(r.warnings.productsWithoutRecipe).toEqual([{ productId: "naked", name: "No recipe" }]);
    expect(r.byMonth[0]).toMatchObject({ month: "2026-11", orderCount: 1 });
  });
});

describe("fx", () => {
  it("accepts a believable live rate", async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ result: "success", rates: { TWD: 32.915595 } }) });
    expect(await getUsdTwdRate({ fetchImpl })).toEqual({ rate: 32.9156, source: "live" });
  });
  it("falls back when the request fails, times out or returns nonsense", async () => {
    expect(await getUsdTwdRate({ fetchImpl: async () => { throw new Error("down"); } })).toEqual({ rate: fallbackRate(), source: "fallback" });
    expect(await getUsdTwdRate({ fetchImpl: async () => ({ ok: true, json: async () => ({ result: "success", rates: { TWD: 3 } }) }) })).toMatchObject({ source: "fallback" });
    expect(await getUsdTwdRate({ fetchImpl: async () => ({ ok: false }) })).toMatchObject({ source: "fallback" });
    expect(isPlausibleRate(32)).toBe(true);
    expect(isPlausibleRate(0)).toBe(false);
  });
});

import { catalogMargins as _catalog } from "@/lib/cost";
describe("catalogMargins", () => {
  it("gives price, cost, PayPal fee and margin for each published product", () => {
    const products = [
      { id: "a", name: "A", price: 10, category: "energy-bottles", cost: { recipe: [{ materialId: "m", quantity: 2 }] } },
      { id: "b", name: "B", price: 5, published: false },
    ];
    const rows = _catalog(products, {}, { m: 20 }, 30, { percent: 4, fixedUSD: 0.5 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ priceTWD: 300, unitCostTWD: 40, paypalFeeTWD: 27, marginTWD: 233, hasRecipe: true });
    expect(rows[0].marginPct).toBe(77.7);
  });
});
