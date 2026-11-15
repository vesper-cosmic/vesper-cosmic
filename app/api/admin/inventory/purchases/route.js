import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { createPurchase, listPurchases } from "@/lib/inventoryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await listPurchases();
  return NextResponse.json({ error: result.skipped ? result.reason : "", purchases: result.purchases }, { headers: NO_STORE });
}

/** Body: { date?, supplier?, note?, lines: [{ materialId, quantity, totalTWD }] } — 進貨登記. */
export async function POST(request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: NO_STORE });
  const result = await createPurchase(body);
  if (result.skipped) return NextResponse.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  if (result.errors) return NextResponse.json({ error: "進貨資料有誤。", errors: result.errors }, { status: 422, headers: NO_STORE });
  return NextResponse.json({ ok: true, purchaseNo: result.purchaseNo, purchase: result.purchase }, { status: 201, headers: NO_STORE });
}
