// Product cost, order profit and the cost report. Pure functions, no I/O.
// All money here is TWD unless a name says USD.
//
// Cost of a product = materials in its recipe × each material's current
// average cost, plus packaging and labour. A bundle adds up its components'
// costs. When an order ships the cost is saved on the order (a snapshot), so
// later price changes don't rewrite past profit.

import { roundMoney } from "./inventory.js";

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** The product's recipe, defensively read: [{ materialId, quantity }]. */
export function readRecipe(product) {
  return (product?.cost?.recipe || [])
    .map((r) => ({ materialId: String(r?.materialId || ""), quantity: num(r?.quantity) }))
    .filter((r) => r.materialId && r.quantity > 0);
}

/**
 * Unit cost of one product.
 * materialCostById: { [materialId]: averageUnitCostTWD }
 * Returns { unitCostTWD, materialCostTWD, extraTWD, hasRecipe, missingMaterials, unknownComponents }.
 */
export function productUnitCost(product, productsById, materialCostById, _seen = new Set()) {
  const result = { unitCostTWD: 0, materialCostTWD: 0, extraTWD: 0, hasRecipe: false, missingMaterials: [], unknownComponents: [] };
  if (!product || _seen.has(product.id)) return result;
  const seen = new Set(_seen).add(product.id);

  const recipe = readRecipe(product);
  for (const line of recipe) {
    const cost = materialCostById[line.materialId];
    if (cost === undefined) result.missingMaterials.push(line.materialId);
    result.materialCostTWD += line.quantity * num(cost);
  }
  result.extraTWD = num(product.cost?.packagingTWD) + num(product.cost?.laborTWD);
  result.hasRecipe = recipe.length > 0 || result.extraTWD > 0;

  for (const component of product.customs?.bundleComponents || []) {
    const part = productsById[component.productId];
    if (!part) {
      result.unknownComponents.push(component.productId);
      continue;
    }
    const sub = productUnitCost(part, productsById, materialCostById, seen);
    const qty = Math.max(1, num(component.quantity) || 1);
    result.materialCostTWD += sub.materialCostTWD * qty;
    result.extraTWD += sub.extraTWD * qty;
    result.hasRecipe = result.hasRecipe || sub.hasRecipe;
    result.missingMaterials.push(...sub.missingMaterials);
    result.unknownComponents.push(...sub.unknownComponents);
  }

  result.materialCostTWD = roundMoney(result.materialCostTWD);
  result.extraTWD = roundMoney(result.extraTWD);
  result.unitCostTWD = roundMoney(result.materialCostTWD + result.extraTWD);
  return result;
}

/**
 * Raw materials needed for order items, bundles expanded.
 * items: [{ productId, quantity }] → Map<materialId, quantity>
 */
export function materialUsageForItems(items, productsById) {
  const usage = new Map();
  const add = (product, qty, seen) => {
    if (!product || seen.has(product.id)) return;
    const next = new Set(seen).add(product.id);
    for (const line of readRecipe(product)) {
      usage.set(line.materialId, (usage.get(line.materialId) || 0) + line.quantity * qty);
    }
    for (const component of product.customs?.bundleComponents || []) {
      add(productsById[component.productId], qty * Math.max(1, num(component.quantity) || 1), next);
    }
  };
  for (const item of items || []) {
    add(productsById[item.productId], Math.max(1, num(item.quantity) || 1), new Set());
  }
  return usage;
}

/** Per-item cost snapshot for an order: [{ productId, quantity, unitCostTWD }] and their total. */
export function snapshotOrderCost(items, productsById, materialCostById) {
  const lines = (items || []).map((item) => {
    const quantity = Math.max(1, num(item.quantity) || 1);
    const unit = productUnitCost(productsById[item.productId], productsById, materialCostById);
    return { productId: item.productId, quantity, unitCostTWD: unit.unitCostTWD, hasRecipe: unit.hasRecipe };
  });
  return { lines, totalTWD: roundMoney(lines.reduce((sum, l) => sum + l.unitCostTWD * l.quantity, 0)) };
}

export const DEFAULT_PAYPAL_FEE = { percent: 4.4, fixedUSD: 0.3 };

export function paypalFeeConfig(env = {}) {
  const percent = Number(env.PAYPAL_FEE_PERCENT);
  const fixed = Number(env.PAYPAL_FEE_FIXED_USD);
  return {
    percent: Number.isFinite(percent) && percent >= 0 ? percent : DEFAULT_PAYPAL_FEE.percent,
    fixedUSD: Number.isFinite(fixed) && fixed >= 0 ? fixed : DEFAULT_PAYPAL_FEE.fixedUSD,
  };
}

/** PayPal fee on a USD amount, in TWD. */
export function paypalFeeTWD(amountUSD, rate, config = DEFAULT_PAYPAL_FEE) {
  if (!(num(amountUSD) > 0)) return 0;
  return roundMoney((num(amountUSD) * (config.percent / 100) + config.fixedUSD) * num(rate));
}

/**
 * Share of each shipment's postage and duties that belongs to each order,
 * split by the order's amount. Single orders keep their own record.
 * @returns {{ [orderId]: { postageTWD: number, dutyFeesTWD: number, fromShipment: string } }}
 */
export function allocateShippingCosts(orders, shipments) {
  const result = {};
  const inShipment = new Set();
  const byId = Object.fromEntries((orders || []).map((o) => [o.orderId, o]));

  for (const shipment of shipments || []) {
    if (shipment.status === "❌ 已取消") continue;
    const members = (shipment.orderIds || []).map((id) => byId[id]).filter(Boolean);
    const total = members.reduce((sum, o) => sum + num(o.amount), 0);
    members.forEach((o) => {
      const share = total > 0 ? num(o.amount) / total : 1 / members.length;
      result[o.orderId] = {
        postageTWD: roundMoney(num(shipment.postageTWD) * share),
        dutyFeesTWD: roundMoney(num(shipment.dutyFeesTWD) * share),
        fromShipment: shipment.shipmentNo,
      };
      inShipment.add(o.orderId);
    });
  }
  for (const order of orders || []) {
    if (inShipment.has(order.orderId)) continue;
    result[order.orderId] = {
      postageTWD: num(order.shippingRecord?.postageTWD),
      dutyFeesTWD: num(order.shippingRecord?.dutyFeesTWD),
      fromShipment: "",
    };
  }
  return result;
}

/**
 * Profit of one order. revenue = amount paid (items + shipping charged) × the
 * exchange rate of the day it was placed.
 * input: { amountUSD, rate, productCostTWD, postageTWD, dutyFeesTWD, referralRewardUSD, feeConfig }
 */
export function computeOrderProfit({ amountUSD, rate, productCostTWD = 0, postageTWD = 0, dutyFeesTWD = 0, referralRewardUSD = 0, feeConfig = DEFAULT_PAYPAL_FEE }) {
  const revenueTWD = roundMoney(num(amountUSD) * num(rate));
  const paypalFee = paypalFeeTWD(amountUSD, rate, feeConfig);
  const referral = roundMoney(num(referralRewardUSD) * num(rate));
  const costs = {
    productCostTWD: roundMoney(productCostTWD),
    paypalFeeTWD: paypalFee,
    postageTWD: roundMoney(postageTWD),
    dutyFeesTWD: roundMoney(dutyFeesTWD),
    referralTWD: referral,
  };
  const totalCostTWD = roundMoney(Object.values(costs).reduce((sum, v) => sum + v, 0));
  const profitTWD = roundMoney(revenueTWD - totalCostTWD);
  return { revenueTWD, ...costs, totalCostTWD, profitTWD, marginPct: revenueTWD > 0 ? Math.round((profitTWD / revenueTWD) * 1000) / 10 : 0 };
}

/** "2026-11" in Taiwan time. */
export function monthOf(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 7);
}

const isPaid = (order) => order.paymentStatus === "✅ 已付款";
const isCancelled = (order) => order.orderStatus === "❌ 已取消";

/**
 * The cost report: paid, non-cancelled orders only.
 *
 * Needs: orders (parsed, with fxRate/fxSource/costSnapshot), shipments,
 * productsById, materialCostById (current average cost), fallbackRate, feeConfig.
 * `month` ("YYYY-MM") limits the orders; omit for all time.
 *
 * Cost per order: the saved snapshot when the order has shipped ("actual");
 * otherwise estimated from today's recipes and average costs ("estimate").
 */
export function buildCostReport({ orders, shipments = [], productsById = {}, materialCostById = {}, fallbackRate = 32, feeConfig = DEFAULT_PAYPAL_FEE, month = "" }) {
  const counted = (orders || []).filter((o) => isPaid(o) && !isCancelled(o));
  const shipping = allocateShippingCosts(counted, shipments);
  const rows = [];
  const productStats = new Map();
  const noRecipe = new Map();

  for (const order of counted) {
    const m = monthOf(order.createdAt);
    if (month && m !== month) continue;

    const hasRate = Number(order.fxRate) > 0;
    const rate = hasRate ? Number(order.fxRate) : fallbackRate;
    const items = Array.isArray(order.items) ? order.items : [];
    const snap = order.costSnapshot && Array.isArray(order.costSnapshot.lines) ? order.costSnapshot : null;
    const estimate = snap ? null : snapshotOrderCost(items, productsById, materialCostById);
    const costLines = (snap ? snap.lines : estimate.lines).map((l) => ({ ...l }));
    const productCostTWD = snap ? roundMoney(num(order.productCostTWD) || snap.lines.reduce((s, l) => s + num(l.unitCostTWD) * num(l.quantity), 0)) : estimate.totalTWD;

    const ship = shipping[order.orderId] || { postageTWD: 0, dutyFeesTWD: 0, fromShipment: "" };
    const profit = computeOrderProfit({
      amountUSD: order.amount,
      rate,
      productCostTWD,
      postageTWD: ship.postageTWD,
      dutyFeesTWD: ship.dutyFeesTWD,
      referralRewardUSD: order.referralReward,
      feeConfig,
    });

    for (const item of items) {
      const qty = Math.max(1, num(item.quantity) || 1);
      const line = costLines.find((l) => l.productId === item.productId);
      const key = item.productId;
      const stat = productStats.get(key) || { productId: key, name: item.productName || productsById[key]?.name || key, quantity: 0, revenueTWD: 0, costTWD: 0 };
      stat.quantity += qty;
      stat.revenueTWD += num(item.price) * qty * rate;
      stat.costTWD += (line ? num(line.unitCostTWD) : 0) * qty;
      productStats.set(key, stat);
      if (line && !line.hasRecipe && productsById[key]?.requiresShipping !== false) {
        noRecipe.set(key, item.productName || productsById[key]?.name || key);
      }
    }

    rows.push({
      orderId: order.orderId,
      createdAt: order.createdAt,
      month: m,
      amountUSD: num(order.amount),
      rate,
      rateSource: hasRate ? order.fxSource || "live" : "fallback",
      costBasis: snap ? "actual" : "estimate",
      shipmentNo: ship.fromShipment,
      ...profit,
    });
  }

  const sum = (key) => roundMoney(rows.reduce((total, r) => total + r[key], 0));
  const totals = {
    orderCount: rows.length,
    revenueTWD: sum("revenueTWD"),
    productCostTWD: sum("productCostTWD"),
    paypalFeeTWD: sum("paypalFeeTWD"),
    postageTWD: sum("postageTWD"),
    dutyFeesTWD: sum("dutyFeesTWD"),
    referralTWD: sum("referralTWD"),
    totalCostTWD: sum("totalCostTWD"),
    profitTWD: sum("profitTWD"),
  };
  totals.marginPct = totals.revenueTWD > 0 ? Math.round((totals.profitTWD / totals.revenueTWD) * 1000) / 10 : 0;

  const byMonth = new Map();
  for (const r of rows) {
    const e = byMonth.get(r.month) || { month: r.month, orderCount: 0, revenueTWD: 0, totalCostTWD: 0, profitTWD: 0 };
    e.orderCount += 1;
    e.revenueTWD = roundMoney(e.revenueTWD + r.revenueTWD);
    e.totalCostTWD = roundMoney(e.totalCostTWD + r.totalCostTWD);
    e.profitTWD = roundMoney(e.profitTWD + r.profitTWD);
    byMonth.set(r.month, e);
  }

  const byProduct = Array.from(productStats.values())
    .map((p) => ({
      ...p,
      revenueTWD: roundMoney(p.revenueTWD),
      costTWD: roundMoney(p.costTWD),
      grossProfitTWD: roundMoney(p.revenueTWD - p.costTWD),
      marginPct: p.revenueTWD > 0 ? Math.round(((p.revenueTWD - p.costTWD) / p.revenueTWD) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenueTWD - a.revenueTWD);

  return {
    totals,
    byMonth: Array.from(byMonth.values()).sort((a, b) => b.month.localeCompare(a.month)),
    byProduct,
    orders: rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    warnings: {
      estimatedOrders: rows.filter((r) => r.costBasis === "estimate").length,
      fallbackRateOrders: rows.filter((r) => r.rateSource === "fallback").length,
      productsWithoutRecipe: Array.from(noRecipe.entries()).map(([productId, name]) => ({ productId, name })),
    },
  };
}
