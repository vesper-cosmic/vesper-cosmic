import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { listMovements } from "@/lib/inventoryServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The latest stock movements (進貨 / 耗用 / 調整 / 取消回補). */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await listMovements();
  return NextResponse.json(
    { error: result.skipped ? result.reason : "", movements: result.movements },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
