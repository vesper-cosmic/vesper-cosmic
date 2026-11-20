import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { listPrApplications, prConfigured, updatePrApplication } from "@/lib/prServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/** GET — every application (contains personal and birth details: admin only, never cached). */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await listPrApplications();
  return NextResponse.json(
    { configured: prConfigured(), applications: result.applications, error: result.error || "" },
    { headers: NO_STORE }
  );
}

/** PATCH { pageId, status?, note? } */
export async function PATCH(request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body?.pageId) return NextResponse.json({ error: "pageId is required." }, { status: 400, headers: NO_STORE });
  const result = await updatePrApplication(body.pageId, { status: body.status, note: body.note });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
