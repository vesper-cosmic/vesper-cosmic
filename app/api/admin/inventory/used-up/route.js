import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { markPackUsedUp } from "@/lib/inventoryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Body: { materialId, actualUnits } — a bulk pack is finished; says how many products it made. */
export async function POST(request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !body.materialId) {
    return NextResponse.json({ error: "請選擇原料。" }, { status: 422, headers: NO_STORE });
  }
  const result = await markPackUsedUp(body);
  if (result.skipped) return NextResponse.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 422, headers: NO_STORE });
  return NextResponse.json({ ok: true, unitsPerPack: result.unitsPerPack, stock: result.stock }, { headers: NO_STORE });
}
