import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { CONSENT_VERSION } from "@/lib/legal";
import { findOrCreateMember, setMemberConsent } from "@/lib/memberServer";

/** GET /api/member/consent — whether the member accepted the current terms. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findOrCreateMember(session.user.email, session.user.name || "");
  if (!result?.found) {
    // Don't block the site if Notion is unavailable; ask again next time.
    return NextResponse.json({ currentVersion: CONSENT_VERSION, accepted: true, unavailable: true });
  }
  return NextResponse.json({
    currentVersion: CONSENT_VERSION,
    acceptedVersion: result.member.consentVersion || null,
    accepted: result.member.consentVersion === CONSENT_VERSION,
  });
}

/**
 * POST /api/member/consent
 * Body: { version, ageConfirmed: true } — records acceptance of the
 * Terms of Service, Privacy Policy and Member & Referral Program Agreement.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.version !== CONSENT_VERSION || body.ageConfirmed !== true) {
    return NextResponse.json({ error: "Please accept the current terms." }, { status: 422 });
  }

  try {
    const result = await setMemberConsent(session.user.email, CONSENT_VERSION, session.user.name || "");
    if (result?.skipped) {
      console.error("/api/member/consent:", result.reason);
      return NextResponse.json({ error: "Could not save. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, version: result.version, acceptedAt: result.acceptedAt });
  } catch (error) {
    console.error("/api/member/consent failed:", error);
    return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  }
}
