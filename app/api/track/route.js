import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { findNotionOrder } from "@/lib/orderServer";

export async function GET(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const orderId = String(searchParams.get("orderId") || "").trim();
  const email = String(searchParams.get("email") || "").trim().toLowerCase();

  if (!orderId || !email) {
    return NextResponse.json(
      {
        errors: {
          orderId: !orderId ? "Order ID is required." : undefined,
          email: !email ? "Email is required." : undefined,
        },
      },
      { status: 422 }
    );
  }

  const result = await findNotionOrder(orderId);

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, order: null },
      { status: 500 }
    );
  }

  if (!result?.found) {
    return NextResponse.json({ found: false, order: null });
  }

  const order = result.order;

  // Only expose order details when the email matches the order email or member email.
  const emailMatches =
    order.email?.toLowerCase() === email || order.memberEmail?.toLowerCase() === email;

  if (!emailMatches) {
    return NextResponse.json(
      { error: "Order not found for this email." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    found: true,
    order: {
      orderId: order.orderId,
      createdAt: order.createdAt,
      fullName: order.fullName,
      productName: order.productName,
      amount: order.amount,
      paymentStatus: order.paymentStatus,
      productionStatus: order.productionStatus,
      trackingNumber: order.trackingNumber,
      shippingDate: order.shippingDate,
    },
  });
}