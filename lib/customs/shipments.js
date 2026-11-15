// Combined shipments: several orders going to the same person in one parcel.
// Pure functions, no I/O — the Notion side lives in lib/shipmentServer.js.

import { isUnitedStates, parseShippingAddress } from "./address.js";
import { buildCustomsLines, isPhysical, mergeCustomsLines, summarize } from "./lines.js";
import { EZPOST_MAX_LINES, suggestService, validateForCustoms } from "./validate.js";
import { OS_CANCELLED, OS_COMPLETED, OS_SHIPPED, PAYMENT_PAID, adminOrderStatus, normalizedStatus } from "../orderStatus.js";

export const SHIPMENT_PENDING = "📦 待出貨";
export const SHIPMENT_SHIPPED = "🚚 已出貨";
export const SHIPMENT_CANCELLED = "❌ 已取消";

export const SHIPMENT_ID_PATTERN = /^VC-SHP-\d{8}-\d{2,}$/;

/** "VC-SHP-20261115-01" from a date and the day's running number. Taiwan time. */
export function formatShipmentNo(date, seq) {
  const taipei = new Date(new Date(date).getTime() + 8 * 3600 * 1000);
  const ymd = taipei.toISOString().slice(0, 10).replace(/-/g, "");
  return `VC-SHP-${ymd}-${String(seq).padStart(2, "0")}`;
}

const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normCountry = (value) => (isUnitedStates(value) ? "united states" : norm(value));

const ADDRESS_FIELDS = [
  ["fullName", "收件人姓名"],
  ["address", "街道地址"],
  ["city", "城市"],
  ["stateProvince", "州"],
  ["postalCode", "郵遞區號"],
  ["country", "國家"],
];

function addressKey(order) {
  const a = parseShippingAddress(order.address, order.fullName);
  return {
    fullName: norm(a.fullName),
    address: norm(`${a.addressLine1} ${a.addressLine2}`),
    city: norm(a.city),
    stateProvince: norm(a.stateProvince),
    postalCode: norm(a.postalCode),
    country: normCountry(a.country),
  };
}

/** An order that is already on its way (or closed) can't join a new shipment. */
export function isOrderShipped(order) {
  const status = adminOrderStatus(order);
  return (
    status === OS_SHIPPED ||
    status === OS_COMPLETED ||
    normalizedStatus(order?.productionStatus) === "🚚 貨品已寄出" ||
    Boolean(order?.trackingNumber)
  );
}

/**
 * Can these orders go in one parcel?
 * Rules: at least two orders; all paid; none shipped or cancelled yet; none
 * already in another shipment; same recipient name, address, city, state, ZIP
 * and country (whitespace, case and punctuation ignored).
 *
 * options.inShipment: { [orderId]: shipmentNo }   options.hasPhysical(order): boolean
 * @returns {{ ok: boolean, errors: string[], diffs: Array<{field:string,label:string,values:Array<{orderId:string,value:string}>}> }}
 */
export function checkCombinable(orders, { inShipment = {}, hasPhysical = () => true, minOrders = 2 } = {}) {
  const errors = [];
  const diffs = [];
  const list = orders || [];

  if (list.length < minOrders) errors.push(`請至少選擇 ${minOrders} 張訂單。`);

  for (const order of list) {
    const id = order.orderId;
    if (order.paymentStatus !== PAYMENT_PAID) errors.push(`${id}：尚未付款（需為「已付款」）。`);
    if (adminOrderStatus(order) === OS_CANCELLED) errors.push(`${id}：訂單已取消。`);
    else if (isOrderShipped(order)) errors.push(`${id}：已經出貨。`);
    if (inShipment[id]) errors.push(`${id}：已在出貨單 ${inShipment[id]} 裡。`);
    if (!hasPhysical(order)) errors.push(`${id}：沒有需要寄送的實體商品。`);
  }

  if (list.length >= 2) {
    const keys = list.map(addressKey);
    for (const [field, label] of ADDRESS_FIELDS) {
      if (new Set(keys.map((k) => k[field])).size > 1) {
        const raw = list.map((order) => {
          const a = parseShippingAddress(order.address, order.fullName);
          const value = field === "address" ? [a.addressLine1, a.addressLine2].filter(Boolean).join(" ") : a[field];
          return { orderId: order.orderId, value: value || "（空白）" };
        });
        diffs.push({ field, label, values: raw });
        errors.push(`${label}不一致：${raw.map((r) => `${r.orderId}＝${r.value}`).join("；")}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, diffs };
}

/** EZPost-line warning on top of the normal customs checks. */
export function validateShipment(ctx) {
  const result = validateForCustoms(ctx);
  const lineCount = ctx.invoiceLines ? ctx.invoiceLines.length : ctx.lines?.length || 0;
  if (lineCount > EZPOST_MAX_LINES) {
    result.warnings.push(
      `合併後有 ${lineCount} 個申報品項，超過 EZPost 約 ${EZPOST_MAX_LINES} 行的上限（此數字未驗證，請在 EZPost 確認）。`
    );
  }
  return result;
}

/** A digital product, or a bundle that has a digital component (e.g. a report). */
function includesDigital(product, productsById) {
  if (!product) return false;
  if (!isPhysical(product)) return true;
  return (product.customs?.bundleComponents || []).some((c) => {
    const part = productsById[c.productId];
    return part && !isPhysical(part);
  });
}

const joinUnique = (values) => Array.from(new Set(values.filter(Boolean))).join(", ");

/**
 * Everything the shipment's invoice, packing list and EZPost helper need.
 *
 * shipment: { shipmentNo, service, packaging, grossWeightG, postageTWD, dutyFeesTWD,
 *             ezpostLabelNo, trackingNumber, shippedAt }
 * orders:   parsed order objects (see parseNotionOrderPage)
 * The data has the same shape as loadOrderCustoms() so the existing invoice and
 * EZPost components work unchanged; `orders` and `orderIds` are extra.
 */
export function buildShipmentData({ shipment, orders, productsById, defaults, seller, packaging = "envelope" }) {
  const packagingWeightG = packaging === "box" ? defaults.packagingBoxG : defaults.packagingEnvelopeG;

  const perOrder = [];
  const allLines = [];
  const missingProducts = [];
  const orderedProducts = [];
  let shippingChargedUSD = 0;

  for (const order of orders) {
    const items = (Array.isArray(order.items) ? order.items : []).map((item) => ({
      productId: item.productId,
      productName: item.productName || "",
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Number(item.price) || 0,
    }));
    const built = buildCustomsLines({ items }, productsById);
    const lines = built.lines.map((line) => ({ ...line, orderId: order.orderId }));
    allLines.push(...lines);
    missingProducts.push(...built.missingProducts);
    orderedProducts.push(...items.map((item) => productsById[item.productId]).filter(Boolean));

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    shippingChargedUSD += Math.max(0, Math.round((Number(order.amount || 0) - subtotal) * 100) / 100);

    perOrder.push({
      orderId: order.orderId,
      createdAt: order.createdAt,
      email: order.email,
      amountUSD: Number(order.amount || 0),
      paypalCaptureId: order.paypalCaptureId || "",
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
      hasDigital: items.some((item) => includesDigital(productsById[item.productId], productsById)),
    });
  }

  const invoiceLines = mergeCustomsLines(allLines);
  const summary = summarize(allLines, packagingWeightG);
  if (shipment.grossWeightG > 0) {
    summary.grossWeightG = Math.max(summary.netWeightG, shipment.grossWeightG);
    summary.packagingWeightG = summary.grossWeightG - summary.netWeightG;
  }

  const physicalProducts = Array.from(new Map(orderedProducts.filter(isPhysical).map((p) => [p.id, p])).values());
  const first = orders[0] || {};
  const address = parseShippingAddress(first.address, first.fullName);
  if (!address.phone) {
    for (const order of orders) {
      const phone = parseShippingAddress(order.address, order.fullName).phone;
      if (phone) {
        address.phone = phone;
        break;
      }
    }
  }

  const validation = validateShipment({
    address,
    lines: allLines,
    invoiceLines,
    missingProducts,
    products: physicalProducts,
    summary,
  });
  if (orders.length === 0) validation.errors.push("這張出貨單沒有任何訂單。");
  validation.ok = validation.errors.length === 0;

  const createdDates = orders.map((o) => o.createdAt).filter(Boolean).sort();
  const orderIds = orders.map((o) => o.orderId);

  return {
    shipment,
    orderIds,
    orders: perOrder,
    order: {
      orderId: orderIds.join(", "),
      createdAt: createdDates[0] || null,
      email: first.email || "",
      fullName: address.fullName,
      amountUSD: perOrder.reduce((sum, o) => sum + o.amountUSD, 0),
      paypalCaptureId: joinUnique(perOrder.map((o) => o.paypalCaptureId)),
      trackingNumber: shipment.trackingNumber || "",
      shippingDate: shipment.shippedAt || null,
      shippingRecord: {
        shippingService: shipment.service || "",
        grossWeightG: shipment.grossWeightG || null,
        postageTWD: shipment.postageTWD ?? null,
        dutyFeesTWD: shipment.dutyFeesTWD ?? null,
        ezpostLabelNo: shipment.ezpostLabelNo || "",
      },
      hasDigital: perOrder.some((o) => o.hasDigital),
    },
    address,
    seller,
    lines: allLines,
    invoiceLines,
    summary,
    shippingChargedUSD,
    validation,
    suggestion: suggestService({ products: physicalProducts, grossWeightG: summary.grossWeightG }),
    defaults,
    invoiceNumber: `VC-INV-${shipment.shipmentNo}`,
    kitContents: physicalProducts.map((p) => ({ name: p.name, includes: p.includes || "" })),
  };
}

/** The text saved in the shipment's 收件人 column (same format as an order's address). */
export function recipientSnapshot(address) {
  return [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.stateProvince,
    address.postalCode,
    address.country,
    address.phone && `Tel: ${address.phone}`,
  ]
    .filter(Boolean)
    .join(", ");
}
