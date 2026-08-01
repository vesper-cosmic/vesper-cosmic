import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { updateMemberDefaultAddress } from "@/lib/memberServer";

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const address = body.address || {};

  const result = await updateMemberDefaultAddress(session.user.email, address);

  if (result?.skipped) {
    return NextResponse.json({ error: result.reason }, { status: 200 });
  }

  return NextResponse.json({ success: true, address });
}