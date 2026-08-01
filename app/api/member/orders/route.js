import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findNotionOrdersByEmail } from "@/lib/orderServer";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findNotionOrdersByEmail(session.user.email);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, orders: [] },
      { status: 200 }
    );
  }

  return NextResponse.json({ orders: result.orders || [] });
}