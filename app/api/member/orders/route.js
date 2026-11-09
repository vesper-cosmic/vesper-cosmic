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
    console.error("/api/member/orders failed:", result.reason);
    return NextResponse.json(
      { error: "Could not load your orders right now.", orders: [] },
      { status: 200 }
    );
  }

  // Hide internal bookkeeping (referrer, commission, Notion ids).
  const orders = (result.orders || []).map(
    ({ referrerEmail, referralReward, referralStatus, pageId, ...order }) => order
  );
  return NextResponse.json({ orders });
}