import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findOrCreateMember, setMemberMarketingOptIn } from "@/lib/memberServer";

/** GET /api/member/preferences — the member's email preferences. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findOrCreateMember(session.user.email, session.user.name || "");
  if (!result?.found) {
    if (result?.reason) console.error("/api/member/preferences GET:", result.reason);
    return NextResponse.json({ error: "Could not load your preferences." }, { status: 503 });
  }
  return NextResponse.json({ marketingOptIn: Boolean(result.member.marketingOptIn) });
}

/** PUT /api/member/preferences — body: { marketingOptIn: boolean } */
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.marketingOptIn !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await setMemberMarketingOptIn(
      session.user.email,
      body.marketingOptIn,
      session.user.name || ""
    );
    if (result?.skipped) {
      console.error("/api/member/preferences PUT:", result.reason);
      return NextResponse.json({ error: "Could not save your preferences." }, { status: 503 });
    }
    return NextResponse.json({ marketingOptIn: result.marketingOptIn });
  } catch (error) {
    console.error("/api/member/preferences PUT failed:", error);
    return NextResponse.json({ error: "Could not save your preferences." }, { status: 500 });
  }
}
