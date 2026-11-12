import "server-only";

import { findNotionOrder } from "@/lib/orderServer";
import { getAllProducts } from "@/lib/productServer";
import { parseShippingAddress } from "./address.js";
import { buildCustomsLines, summarize } from "./lines.js";
import { validateForCustoms, suggestService } from "./validate.js";
import { getCustomsDefaults, getSeller } from "./seller.js";

export const ORDER_ID_PATTERN = /^VC-\d{8}-[A-Z0-9]{3,8}$/;

/**
 * Everything the customs documents and the EZPost helper need for one order.
 * Prices and products are always read from Notion here, never from the client.
 * Returns { status: 400|404|503, error } or { status: 200, data }.
 */
export async function loadOrderCustoms(orderId, { packaging = "envelope" } = {}) {
  const id = String(orderId || "").trim().toUpperCase();
  if (!ORDER_ID_PATTERN.test(id)) return { status: 400, error: "Invalid order ID." };

  const found = await findNotionOrder(id);
  if (found?.skipped) return { status: 503, error: "Could not load the order right now." };
  if (!found?.found) return { status: 404, error: "Order not found." };
  const order = found.order;

  const { products } = await getAllProducts();
  const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));

  const items = (Array.isArray(order.items) ? order.items : []).map((item) => ({
    productId: item.productId,
    productName: item.productName || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: Number(item.price) || 0,
  }));

  const defaults = getCustomsDefaults();
  const packagingWeightG = packaging === "box" ? defaults.packagingBoxG : defaults.packagingEnvelopeG;

  const { lines, missingProducts } = buildCustomsLines({ items }, productsById);
  const summary = summarize(lines, packagingWeightG);
  // A gross weight the admin recorded (actual scale weight) wins.
  if (order.shippingRecord?.grossWeightG > 0) {
    summary.grossWeightG = Math.max(summary.netWeightG, order.shippingRecord.grossWeightG);
    summary.packagingWeightG = summary.grossWeightG - summary.netWeightG;
  }

  const orderedProducts = items.map((item) => productsById[item.productId]).filter(Boolean);
  const physicalProducts = orderedProducts.filter((p) => p.requiresShipping !== false);
  const address = parseShippingAddress(order.address, order.fullName);
  const validation = validateForCustoms({ address, lines, missingProducts, products: physicalProducts, summary });

  const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingChargedUSD = Math.max(0, Math.round((Number(order.amount || 0) - itemsSubtotal) * 100) / 100);
  const hasDigital = orderedProducts.some((p) => p.requiresShipping === false);

  return {
    status: 200,
    data: {
      order: {
        orderId: order.orderId,
        createdAt: order.createdAt,
        email: order.email,
        fullName: order.fullName,
        amountUSD: Number(order.amount || 0),
        paymentStatus: order.paymentStatus,
        paypalCaptureId: order.paypalCaptureId || "",
        trackingNumber: order.trackingNumber || "",
        shippingDate: order.shippingDate || null,
        shippingRecord: order.shippingRecord || {},
        items,
        hasDigital,
      },
      address,
      seller: getSeller(),
      lines,
      summary,
      shippingChargedUSD,
      validation,
      suggestion: suggestService({ products: physicalProducts, grossWeightG: summary.grossWeightG }),
      defaults,
      invoiceNumber: `VC-INV-${order.orderId}`,
      kitContents: physicalProducts.map((p) => ({ name: p.name, includes: p.includes || "" })),
    },
  };
}
