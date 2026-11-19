import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findNotionOrdersByEmail } from "@/lib/orderServer";
import { getAllProducts } from "@/lib/productServer";
import { isDigitalOnlyOrder } from "@/lib/orderDigital";

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
  const { products } = await getAllProducts();
  const productsById = Object.fromEntries((products || []).map((p) => [p.id, p]));
  const orders = (result.orders || []).map(
    ({ referrerEmail, referralReward, referralStatus, pageId, paypalCaptureId, ...order }) => ({
      ...order,
      digital: isDigitalOnlyOrder(order.items, productsById),
    })
  );
  return NextResponse.json({ orders });
}