import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { updateMemberDefaultBirthData } from "@/lib/memberServer";

/**
 * Birth details the member chose to save for their next BaZi order.
 * PUT { birthData } saves them; DELETE (or PUT { birthData: null }) removes them.
 */
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const birthData = body.birthData || null;
  if (birthData && !/^\d{4}-\d{2}-\d{2}$/.test(String(birthData.birthDate || ""))) {
    return NextResponse.json({ error: "A valid date of birth is required." }, { status: 422 });
  }

  const result = await updateMemberDefaultBirthData(session.user.email, birthData);
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason }, { status: 503 });
  }
  return NextResponse.json({ success: true, saved: Boolean(birthData) });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const result = await updateMemberDefaultBirthData(session.user.email, null);
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason }, { status: 503 });
  }
  return NextResponse.json({ success: true, saved: false });
}
