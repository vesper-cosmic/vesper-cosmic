import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { findOrderForConfirmation } from "@/lib/orderServer";
import { PAYMENT_PAID } from "@/lib/orderStatus";
import { createPaypalOrder, paypalCheckoutEnabled } from "@/lib/paypal";

/** Start a PayPal payment for an order already saved at checkout. */
export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;
  if (!paypalCheckoutEnabled()) {
    return NextResponse.json({ error: "PayPal Checkout is not set up." }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const orderId = String(payload.orderId || "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required." }, { status: 422 });
  }

  const found = await findOrderForConfirmation(orderId);
  if (found.skipped) {
    return NextResponse.json({ error: "We couldn't load your order. Please try again." }, { status: 503 });
  }
  if (!found.found) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const stored = found.order;
  if (stored.paymentStatus === PAYMENT_PAID) {
    return NextResponse.json({ error: "This order has already been paid." }, { status: 409 });
  }
  if (String(stored.email || "").toLowerCase() !== String(payload.email || "").toLowerCase()) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const amount = Number(stored.amount || 0);
  if (!(amount > 0)) {
    return NextResponse.json({ error: "This order has no amount to pay." }, { status: 422 });
  }

  try {
    const id = await createPaypalOrder({
      orderId,
      amount,
      description: `Vesper Cosmos order ${orderId}`,
    });
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
