import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { createMaterial, getInventory, inventoryConfigured } from "@/lib/inventoryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** Materials with stock, average cost and value. */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await getInventory();
  return NextResponse.json(
    { configured: inventoryConfigured(), error: result.skipped ? result.reason : "", materials: result.materials, summary: result.summary },
    { headers: NO_STORE }
  );
}

/** Body: { name, unit, safetyStock?, note? } — add a material. */
export async function POST(request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: NO_STORE });
  const result = await createMaterial(body);
  if (result.skipped) return NextResponse.json({ error: result.reason }, { status: 503, headers: NO_STORE });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 422, headers: NO_STORE });
  return NextResponse.json({ ok: true, material: result.material }, { status: 201, headers: NO_STORE });
}
