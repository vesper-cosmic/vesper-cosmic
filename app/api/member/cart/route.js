import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findMemberByEmail, saveMemberCart } from "@/lib/memberServer";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findMemberByEmail(session.user.email);

  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, cart: [] });
  }

  return NextResponse.json({
    cart: result.found ? result.member.cart : [],
  });
}

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

  const cartItems = Array.isArray(body.cart) ? body.cart : null;

  if (!cartItems) {
    return NextResponse.json(
      { error: "cart must be an array." },
      { status: 422 }
    );
  }

  const result = await saveMemberCart(session.user.email, cartItems);

  if (result?.skipped) {
    return NextResponse.json({ error: result.reason }, { status: 200 });
  }

  return NextResponse.json({ success: true });
}