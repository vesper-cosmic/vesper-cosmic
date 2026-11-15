import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { updateMaterial } from "@/lib/inventoryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Body: any of { name, unit, safetyStock, note, active }. */
export async function PATCH(request, { params }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: NO_STORE });
  const allowed = ["name", "unit", "safetyStock", "note", "active", "mode", "estimatedUnitsPerPack", "lowUnits"];
  const fields = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
  const result = await updateMaterial(params.materialId, fields);
  if (result.skipped) return NextResponse.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 422, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
