import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import {
  findAllNotionOrders,
  findNotionOrder,
  setOrderPaymentStatus,
  updateNotionOrderStatus,
} from "@/lib/orderServer";
import { PAYMENT_PAID, PAYMENT_STATUSES, normalizedStatus } from "@/lib/orderStatus";
import { sendPaymentConfirmedEmail, sendShippedEmail } from "@/lib/customerEmails";

const SHIPPED = "🚚 貨品已寄出";

async function loadOrder(orderId) {
  try {
    const found = await findNotionOrder(orderId);
    return found?.found ? found.order : null;
  } catch {
    return null;
  }
}
import { syncOrderReferrer } from "@/lib/referral";

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

  // Payment status change (admin verified the PayPal payment).
  if (payload.paymentStatus !== undefined) {
    const paymentStatus = String(payload.paymentStatus || "").trim();
    if (!orderId || !PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid order ID or payment status.", ok: false },
        { status: 422 }
      );
    }
    const before = await loadOrder(orderId);
    try {
      const result = await setOrderPaymentStatus(orderId, paymentStatus);
      if (result?.skipped) {
        return NextResponse.json({ error: result.reason, ok: false }, { status: 400 });
      }
    } catch (error) {
      console.error("Admin payment status update failed:", error);
      return NextResponse.json({ error: "Payment status update failed.", ok: false }, { status: 500 });
    }

    await syncOrderReferrer(orderId);

    // Tell the customer once, when the order first becomes paid.
    let email = null;
    if (paymentStatus === PAYMENT_PAID && before && before.paymentStatus !== PAYMENT_PAID) {
      email = await sendPaymentConfirmedEmail(before);
    }
    return NextResponse.json({ ok: true, orderId, paymentStatus, email });
  }

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

  const before = await loadOrder(orderId);
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

  await syncOrderReferrer(orderId);

  // Shipping email: when the order first ships, or a new tracking number is added.
  let email = null;
  if (status === SHIPPED && before) {
    const firstShipment = normalizedStatus(before.productionStatus) !== SHIPPED;
    const newTracking = trackingNumber && trackingNumber !== before.trackingNumber;
    if (firstShipment || newTracking) {
      email = await sendShippedEmail(before, trackingNumber);
    }
  }

  return NextResponse.json({
    ok: true,
    orderId,
    status,
    email,
    trackingNumber: trackingNumber || null,
    message: "Order status updated.",
  });
}