import { NextResponse } from "next/server";
import {
  findOrderForConfirmation,
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

  // Security: only confirm an order that was actually created, and verify
  // the submitted payload matches the stored order. This prevents an
  // attacker from forging a confirmation request for an arbitrary orderId
  // and marking it paid in Notion.
  //
  // The lookup first checks the in-memory store. Serverless instances can be
  // recycled at any time, so if the order is not in memory we fall back to
  // querying the Notion orders database — the order page was created when
  // the order was submitted, so it is authoritative and survives instance
  // recycling.
  const found = await findOrderForConfirmation(order.orderId);

  if (found.skipped) {
    return NextResponse.json(
      { errors: { orderId: `Unable to verify order: ${found.reason}` } },
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

  if (!ordersMatch(storedOrder, order, found.source)) {
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
 * originally created. Compares the fields that uniquely identify the order
 * and its customer so an attacker cannot confirm an order they did not
 * create.
 *
 * When the order was recovered from the Notion database (source ===
 * "notion"), only the fields that were written to Notion are available, so
 * the comparison is limited to those fields. In-memory orders are compared
 * against the full payload.
 */
function ordersMatch(stored, submitted, source) {
  if (source === "notion") {
    return (
      stored.orderId === submitted.orderId &&
      String(stored.email || "").toLowerCase() ===
        String(submitted.email || "").toLowerCase() &&
      Number(stored.amount || 0) === Number(submitted.price || 0)
    );
  }

  return (
    stored.orderId === submitted.orderId &&
    String(stored.email || "").toLowerCase() ===
      String(submitted.email || "").toLowerCase() &&
    stored.productId === submitted.productId &&
    stored.price === submitted.price
  );
}
