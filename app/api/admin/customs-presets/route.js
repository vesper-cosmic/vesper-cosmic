import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { loadPresets, savePreset } from "@/lib/customs/presetStore";
import { isValidHtsus } from "@/lib/customs/htsus";
import { CUSTOMS_DESCRIPTION_MAX } from "@/lib/customs/keywords";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.email && isAdminEmail(session.user.email));
}

/** Effective presets (code defaults + admin overrides). */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  return NextResponse.json(await loadPresets());
}

/** Body: { id, customsDescription, htsus, unitWeightG, fragile } */
export async function PUT(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const htsus = String(payload.htsus || "").trim();
  if (htsus && !isValidHtsus(htsus)) {
    return NextResponse.json({ error: "HTSUS 必須剛好 10 碼數字。" }, { status: 422 });
  }
  if (String(payload.customsDescription || "").length > CUSTOMS_DESCRIPTION_MAX) {
    return NextResponse.json({ error: `品名請在 ${CUSTOMS_DESCRIPTION_MAX} 字以內。` }, { status: 422 });
  }

  const result = await savePreset(String(payload.id || ""), payload);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...(await loadPresets()) });
}
