import { NextResponse } from "next/server";
import {
  findStoredOrder,
  markNotionOrderPaid,
  normalizeConfirmedOrderPayload,
  sendOrderEmails,
} from "@/lib/orderServer";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { errors: { submit: "Invalid JSON payload." } },
      { status: 400 }
    );
  }

  const { errors, order } = await normalizeConfirmedOrderPayload(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Security: only confirm an order that was actually created by this
  // server instance, and verify the submitted payload matches the stored
  // order. This prevents an attacker from forging a confirmation request
  // for an arbitrary orderId and marking it paid in Notion.
  const storedOrder = findStoredOrder(order.orderId);
  if (!storedOrder) {
    return NextResponse.json(
      { errors: { orderId: "Order not found or already confirmed." } },
      { status: 404 }
    );
  }

  if (!ordersMatch(storedOrder, order)) {
    return NextResponse.json(
      { errors: { orderId: "Order data does not match the original order." } },
      { status: 409 }
    );
  }

  let notionResult = null;
  try {
    notionResult = await markNotionOrderPaid(order.orderId);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion payment status update failed:", error);
  }

  const emailResult = await sendOrderEmails(order, notionResult);

  return NextResponse.json({
    success: true,
    orderId: order.orderId,
    notion: notionResult?.error ? "failed" : "ok",
    emails: emailResult,
  });
}

/**
 * Verify the submitted confirmation payload matches the order that was
 * originally created by this server. Compares the fields that uniquely
 * identify the order and its customer so an attacker cannot confirm an
 * order they did not create.
 */
function ordersMatch(stored, submitted) {
  return (
    stored.orderId === submitted.orderId &&
    String(stored.email || "").toLowerCase() ===
      String(submitted.email || "").toLowerCase() &&
    stored.productId === submitted.productId &&
    stored.price === submitted.price
  );
}
