import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { PAYMENT_PENDING } from "@/lib/orderStatus";
import { authOptions } from "@/lib/auth";
import {
  findOrderForConfirmation,
  markMultiNotionOrderPaid,
} from "@/lib/orderServer";
import { upsertMember } from "@/lib/memberServer";
import { sendMultiOrderEmails } from "@/lib/orderEmails";
import { ordersMatch } from "@/lib/orderMatch";

export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;

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
  const order = payload.order || null;

  if (!orderId || !order?.items?.length) {
    return NextResponse.json(
      {
        errors: {
          orderId: !orderId ? "Order ID is required." : undefined,
          items: !order?.items?.length ? "Order items are required." : undefined,
        },
      },
      { status: 422 }
    );
  }

  // Security: only confirm an order that was actually created, and verify
  // the submitted payload matches the stored order. This prevents an
  // attacker from forging a confirmation request for an arbitrary orderId
  // and marking it paid in Notion.
  //
  // The lookup first checks the in-memory store. Serverless instances can be
  // recycled at any time, so if the order is not in memory we fall back to
  // querying the Notion orders database — the order page was created when
  // the checkout was submitted, so it is authoritative and survives instance
  // recycling.
  const found = await findOrderForConfirmation(orderId);

  if (found.skipped) {
    console.error("Order confirmation lookup failed:", found.reason);
    return NextResponse.json(
      { errors: { orderId: "Unable to verify order right now. Please try again shortly." } },
      { status: 503 }
    );
  }

  if (!found.found) {
    return NextResponse.json(
      { errors: { orderId: "Order not found or already confirmed." } },
      { status: 404 }
    );
  }

  const storedOrder = found.order;

  // Only an order still awaiting payment can be confirmed. This stops the
  // same order from being re-confirmed to resend emails or reset status.
  if (storedOrder.paymentStatus && storedOrder.paymentStatus !== PAYMENT_PENDING) {
    return NextResponse.json(
      { errors: { orderId: "This order has already been confirmed." } },
      { status: 409 }
    );
  }

  if (!ordersMatch(storedOrder, order, found.source)) {
    return NextResponse.json(
      { errors: { orderId: "Order data does not match the original order." } },
      { status: 409 }
    );
  }

  let notionResult = null;
  try {
    notionResult = await markMultiNotionOrderPaid(orderId);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion multi order payment status update failed:", error);
  }

  // Save default address to member profile if requested and signed in
  let memberResult = null;
  if (payload.saveAddressToMember && order.shipping) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      try {
        memberResult = await upsertMember({
          email: session.user.email,
          name: session.user.name || "",
          defaultAddress: {
            fullName: order.fullName,
            ...order.shipping,
          },
        });
      } catch (error) {
        console.error("Member address save failed:", error);
        memberResult = { error: error.message };
      }
    }
  }

  const emailResult = await sendMultiOrderEmails(order, notionResult);

  return NextResponse.json({
    success: true,
    orderId,
    notion: notionResult?.error ? "failed" : "ok",
    emails: emailResult,
    member: memberResult,
  });
}
