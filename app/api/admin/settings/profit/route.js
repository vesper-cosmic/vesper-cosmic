import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { loadProfitSettings, profitSettingsConfigured, saveProfitSettings } from "@/lib/profitSettingsServer";
import { DEFAULT_PROFIT_SETTINGS } from "@/lib/profit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const result = await loadProfitSettings();
  return NextResponse.json(
    { configured: profitSettingsConfigured(), source: result.source, error: result.error || "", settings: result.settings, defaults: DEFAULT_PROFIT_SETTINGS },
    { headers: NO_STORE }
  );
}

/** Body: the settings object (see lib/profit.js). Missing/invalid values fall back to defaults. */
export async function PUT(request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers: NO_STORE });
  const result = await saveProfitSettings(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 503, headers: NO_STORE });
  return NextResponse.json({ ok: true, settings: result.settings }, { headers: NO_STORE });
}
