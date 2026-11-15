import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { findNotionOrder } from "@/lib/orderServer";
import { getAllProducts } from "@/lib/productServer";
import { createShipment, listShipments, shipmentIndex, shipmentsConfigured } from "@/lib/shipmentServer";
import { buildCustomsLines } from "@/lib/customs/lines";
import { parseShippingAddress } from "@/lib/customs/address";
import { checkCombinable, recipientSnapshot } from "@/lib/customs/shipments";
import { suggestService } from "@/lib/customs/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** All shipments, plus { [orderId]: shipmentNo } so the order list can mark combined orders. */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await listShipments();
  return NextResponse.json(
    {
      configured: shipmentsConfigured(),
      error: result.skipped ? result.reason : "",
      shipments: result.shipments,
      orderIndex: shipmentIndex(result.shipments),
    },
    { headers: NO_STORE }
  );
}

/** Body: { orderIds: string[] } — checks the orders can share a parcel, then creates the shipment. */
export async function POST(request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const orderIds = Array.from(new Set((Array.isArray(body?.orderIds) ? body.orderIds : []).map((id) => String(id).trim())));
  if (orderIds.length === 0) {
    return NextResponse.json({ error: "請選擇訂單。" }, { status: 422, headers: NO_STORE });
  }
  if (!shipmentsConfigured()) {
    return NextResponse.json({ error: "尚未設定 NOTION_SHIPMENTS_DATABASE_ID。" }, { status: 503, headers: NO_STORE });
  }

  const orders = [];
  for (const id of orderIds) {
    const found = await findNotionOrder(id);
    if (found?.skipped) return NextResponse.json({ error: "Could not load the orders." }, { status: 503, headers: NO_STORE });
    if (!found?.found) return NextResponse.json({ error: `找不到訂單 ${id}。` }, { status: 404, headers: NO_STORE });
    orders.push(found.order);
  }

  const existing = await listShipments();
  if (existing.skipped) {
    return NextResponse.json({ error: existing.reason }, { status: 503, headers: NO_STORE });
  }
  const { products } = await getAllProducts();
  const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));

  const hasPhysical = (order) => {
    const { lines, missingProducts } = buildCustomsLines({ items: order.items || [] }, productsById);
    return lines.length > 0 || missingProducts.length > 0;
  };
  const check = checkCombinable(orders, { inShipment: shipmentIndex(existing.shipments), hasPhysical });
  if (!check.ok) {
    return NextResponse.json({ error: "這些訂單不能合併出貨。", errors: check.errors, diffs: check.diffs }, { status: 422, headers: NO_STORE });
  }

  // Pre-fill service and packaging from what's in the parcel (editable later).
  const physical = orders
    .flatMap((order) => (order.items || []).map((item) => productsById[item.productId]))
    .filter((product) => product && product.requiresShipping !== false);
  const suggestion = suggestService({ products: physical, grossWeightG: 0 });
  const service = /e小包/.test(suggestion.service) ? "ePacket" : "Air Parcel";

  const address = parseShippingAddress(orders[0].address, orders[0].fullName);
  const created = await createShipment({
    orderIds,
    recipient: recipientSnapshot(address),
    service,
    packaging: suggestion.packaging,
  });
  if (created.skipped) {
    return NextResponse.json({ error: created.reason }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, shipment: created.shipment }, { status: 201, headers: NO_STORE });
}
