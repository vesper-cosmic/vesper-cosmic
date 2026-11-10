import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { authOptions } from "@/lib/auth";
import { findOrderForConfirmation, setAdminOrderStatus } from "@/lib/orderServer";
import { OS_PAID, PAYMENT_PAID } from "@/lib/orderStatus";
import { capturePaypalOrder, paypalCheckoutEnabled } from "@/lib/paypal";
import { ordersMatch } from "@/lib/orderMatch";
import { sendMultiOrderEmails } from "@/lib/orderEmails";
import { upsertMember } from "@/lib/memberServer";
import { syncOrderReferrer } from "@/lib/referral";

/**
 * The customer approved the payment in PayPal's pop-up. Capture it on the
 * server, check it is for this order and the full amount, then mark the
 * order paid. The client never decides that an order is paid.
 */
export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;
  if (!paypalCheckoutEnabled()) {
    return NextResponse.json({ error: "PayPal Checkout is not set up." }, { status: 503 });
  }

  const payload = await request.json().catch(() => ({}));
  const orderId = String(payload.orderId || "").trim();
  const paypalOrderId = String(payload.paypalOrderId || "").trim();
  const order = payload.order || null;

  if (!orderId || !/^[A-Z0-9]{8,40}$/i.test(paypalOrderId) || !order?.items?.length) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 422 });
  }

  const found = await findOrderForConfirmation(orderId);
  if (found.skipped || !found.found) {
    return NextResponse.json(
      { error: `We couldn't load order ${orderId}. If you were charged, please contact us.` },
      { status: found.skipped ? 503 : 404 }
    );
  }
  const stored = found.order;
  if (!ordersMatch(stored, order, found.source)) {
    return NextResponse.json({ error: "Order data does not match the original order." }, { status: 409 });
  }

  const capture = await capturePaypalOrder(paypalOrderId);
  if (capture.status === "DECLINED") {
    return NextResponse.json(
      { error: "PayPal declined this payment. Please try another card or payment method.", retry: true },
      { status: 402 }
    );
  }
  if (capture.status !== "COMPLETED") {
    console.error("PayPal capture not completed:", orderId, capture);
    return NextResponse.json(
      {
        error: `PayPal hasn't completed this payment yet (status: ${capture.status || "unknown"}). We'll check it and email you — your order ID is ${orderId}.`,
      },
      { status: 502 }
    );
  }

  const amountOk =
    capture.currency === "USD" &&
    Math.abs(Number(capture.amount) - Number(stored.amount || 0)) < 0.005;
  if (capture.customId !== orderId || !amountOk) {
    console.error("PayPal capture does not match order:", orderId, capture, stored.amount);
    return NextResponse.json(
      { error: `This payment doesn't match order ${orderId}. Please contact us so we can sort it out.` },
      { status: 409 }
    );
  }

  // Already marked paid (double click / retry): don't resend emails.
  if (stored.paymentStatus === PAYMENT_PAID) {
    return NextResponse.json({ success: true, orderId, captureId: capture.captureId });
  }

  const notionResult = await setAdminOrderStatus({
    orderId,
    orderStatus: OS_PAID,
    paypalCaptureId: capture.captureId,
  });
  if (notionResult?.skipped) {
    console.error("Paid order could not be updated in Notion:", orderId, capture.captureId, notionResult.reason);
  }
  await syncOrderReferrer(orderId);

  if (payload.saveAddressToMember && order.shipping) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      try {
        await upsertMember({
          email: session.user.email,
          name: session.user.name || "",
          defaultAddress: { fullName: order.fullName, ...order.shipping },
        });
      } catch (error) {
        console.error("Member address save failed:", error);
      }
    }
  }

  const emails = await sendMultiOrderEmails(
    order,
    notionResult?.skipped ? { error: notionResult.reason } : notionResult,
    { paypalCaptureId: capture.captureId }
  );

  return NextResponse.json({ success: true, orderId, captureId: capture.captureId, emails });
}
