import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import {
  findAllNotionOrders,
  setAdminOrderStatus,
  updateNotionOrderStatus,
} from "@/lib/orderServer";
import {
  ADMIN_ORDER_STATUSES,
  OS_CANCELLED,
  OS_PAYMENT_NOTICE,
  OS_SHIPPED,
  OS_VERIFIED_NOTICE,
  ORDER_STATUSES,
  adminOrderStatus,
} from "@/lib/orderStatus";
import {
  sendOrderCancelledEmail,
  sendPaymentConfirmedEmail,
  sendPaymentRequestEmail,
  sendShippedEmail,
} from "@/lib/customerEmails";
import { syncOrderReferrer } from "@/lib/referral";

const SHIPPED_PRODUCTION = "🚚 貨品已寄出";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.email && isAdminEmail(session.user.email));
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const result = await findAllNotionOrders();
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, orders: [] }, { status: 200 });
  }
  return NextResponse.json({ orders: result.orders || [] });
}

/**
 * Body:
 *   { orderId, orderStatus, trackingNumber?, note?, notifyCustomer? }
 *     → change the main order status (訂單狀態); payment and production
 *       status follow, and the matching customer email is sent.
 *   { orderId, status }
 *     → change only the customer-facing production step (訂單已接受 / 製作中).
 */
export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload.", ok: false }, { status: 400 });
  }

  const orderId = String(payload.orderId || "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required.", ok: false }, { status: 422 });
  }

  if (payload.orderStatus !== undefined) {
    return changeOrderStatus(orderId, payload);
  }

  // Production step only (no emails; shipping goes through 已出貨).
  const status = String(payload.status || "").trim();
  if (!ORDER_STATUSES.includes(status) || status === SHIPPED_PRODUCTION) {
    return NextResponse.json({ error: "Invalid production status.", ok: false }, { status: 422 });
  }
  const result = await updateNotionOrderStatus({ orderId, status });
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, ok: false }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderId, status });
}

async function changeOrderStatus(orderId, payload) {
  const orderStatus = String(payload.orderStatus || "").trim();
  const trackingNumber = String(payload.trackingNumber || "").trim().slice(0, 64);
  const note = String(payload.note || "").trim().slice(0, 2000);
  const notify = payload.notifyCustomer !== false;

  if (!ADMIN_ORDER_STATUSES.includes(orderStatus)) {
    return NextResponse.json({ error: "Invalid order status.", ok: false }, { status: 422 });
  }

  const result = await setAdminOrderStatus({
    orderId,
    orderStatus,
    trackingNumber: trackingNumber || undefined,
  });
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, ok: false }, { status: 400 });
  }

  await syncOrderReferrer(orderId);

  const before = result.before;
  const previous = adminOrderStatus(before);
  let email = null;

  if (notify && before?.email) {
    if (orderStatus === OS_PAYMENT_NOTICE) {
      email = await sendPaymentRequestEmail(before, note);
    } else if (orderStatus === OS_VERIFIED_NOTICE) {
      email = await sendPaymentConfirmedEmail(before, note);
    } else if (orderStatus === OS_SHIPPED) {
      const newTracking = trackingNumber && trackingNumber !== before.trackingNumber;
      if (previous !== OS_SHIPPED || newTracking) {
        email = await sendShippedEmail(before, trackingNumber, note);
      }
    } else if (orderStatus === OS_CANCELLED && previous !== OS_CANCELLED) {
      email = await sendOrderCancelledEmail(before, note);
    }
  }

  return NextResponse.json({
    ok: true,
    orderId,
    orderStatus,
    trackingNumber: trackingNumber || null,
    email,
  });
}
