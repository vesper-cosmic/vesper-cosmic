import "server-only";

import { findNotionOrder } from "@/lib/orderServer";
import { getAllProducts } from "@/lib/productServer";
import { findShipment } from "@/lib/shipmentServer";
import { buildShipmentData, SHIPMENT_ID_PATTERN } from "./shipments.js";
import { getCustomsDefaults, getSeller } from "./seller.js";

/**
 * Everything the shipment pages and PDFs need. Prices and products are read
 * from Notion here, never from the client.
 * Returns { status: 400|404|503, error } or { status: 200, data }.
 */
export async function loadShipmentCustoms(shipmentNo, { packaging } = {}) {
  const id = String(shipmentNo || "").trim().toUpperCase();
  if (!SHIPMENT_ID_PATTERN.test(id)) return { status: 400, error: "Invalid shipment ID." };

  const found = await findShipment(id);
  if (found?.skipped) return { status: 503, error: found.reason || "Could not load the shipment right now." };
  if (!found?.found) return { status: 404, error: "Shipment not found." };
  const shipment = found.shipment;

  const orders = [];
  for (const orderId of shipment.orderIds) {
    const result = await findNotionOrder(orderId);
    if (result?.skipped) return { status: 503, error: "Could not load the orders right now." };
    if (result.found) orders.push(result.order);
  }

  const { products } = await getAllProducts();
  const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));
  const effectivePackaging = packaging || shipment.packaging || "envelope";

  const data = buildShipmentData({
    shipment,
    orders,
    productsById,
    defaults: getCustomsDefaults(),
    seller: getSeller(),
    packaging: effectivePackaging === "box" ? "box" : "envelope",
  });
  data.shipment = { ...shipment, packaging: effectivePackaging };
  return { status: 200, data };
}
