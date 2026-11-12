import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { loadOrderCustoms, ORDER_ID_PATTERN } from "@/lib/customs/context";
import { updateOrderShippingRecord } from "@/lib/orderServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Customs lines, checks and EZPost data for one order (admin only). */
export async function GET(request, { params }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const packaging = new URL(request.url).searchParams.get("packaging") === "box" ? "box" : "envelope";
  const result = await loadOrderCustoms(params.orderId, { packaging });
  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status, headers: NO_STORE });
  }
  return NextResponse.json(result.data, { headers: NO_STORE });
}

/** Save the shipping record (service, weight, postage, duties, EZPost label, tracking). */
export async function PATCH(request, { params }) {
  const denied = await adminGuard();
  if (denied) return denied;

  const orderId = String(params.orderId || "").trim().toUpperCase();
  if (!ORDER_ID_PATTERN.test(orderId)) {
    return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const allowed = ["shippingService", "grossWeightG", "postageTWD", "dutyFeesTWD", "ezpostLabelNo", "trackingNumber"];
  const fields = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  const result = await updateOrderShippingRecord(orderId, fields);
  if (result.skipped) {
    return NextResponse.json({ error: result.reason }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
