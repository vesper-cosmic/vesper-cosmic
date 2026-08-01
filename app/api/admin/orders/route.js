import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { findAllNotionOrders, updateNotionOrderStatus } from "@/lib/orderServer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const result = await findAllNotionOrders();
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, orders: [] }, { status: 200 });
  }
  return NextResponse.json({ orders: result.orders || [] });
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { submit: "Invalid JSON payload." } },
      { status: 400 }
    );
  }

  const orderId = String(payload.orderId || "").trim();
  const status = String(payload.status || "").trim();
  const trackingNumber = String(payload.trackingNumber || "").trim();

  if (!orderId || !status) {
    return NextResponse.json(
      {
        errors: {
          orderId: !orderId ? "Order ID is required." : undefined,
          status: !status ? "Status is required." : undefined,
        },
      },
      { status: 422 }
    );
  }

  const result = await updateNotionOrderStatus({
    orderId,
    status,
    trackingNumber: trackingNumber || undefined,
  });

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, ok: false },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderId,
    status,
    trackingNumber: trackingNumber || null,
    message: "Order status updated.",
  });
}