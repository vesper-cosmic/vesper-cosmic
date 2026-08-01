import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findMemberByEmail, upsertMember } from "@/lib/memberServer";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findMemberByEmail(session.user.email);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, member: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    member: result.found ? result.member : null,
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const result = await upsertMember({
    email: session.user.email,
    name: body.name || session.user.name || "",
  });

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, member: null },
      { status: 200 }
    );
  }

  return NextResponse.json({ member: result.member });
}