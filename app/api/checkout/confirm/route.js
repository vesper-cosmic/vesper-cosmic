import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findStoredOrder, markMultiNotionOrderPaid } from "@/lib/orderServer";
import { upsertMember } from "@/lib/memberServer";
import { sendMultiOrderEmails } from "@/lib/orderEmails";

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

  // Security: only confirm an order that was actually created by this
  // server instance, and verify the submitted payload matches the stored
  // order. This prevents an attacker from forging a confirmation request
  // for an arbitrary orderId and marking it paid in Notion.
  const storedOrder = findStoredOrder(orderId);
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

/**
 * Verify the submitted confirmation payload matches the order that was
 * originally created by this server. Compares the fields that uniquely
 * identify the order and its customer so an attacker cannot confirm an
 * order they did not create.
 */
function ordersMatch(stored, submitted) {
  if (
    stored.orderId !== submitted.orderId ||
    String(stored.email || "").toLowerCase() !==
      String(submitted.email || "").toLowerCase() ||
    stored.total !== submitted.total
  ) {
    return false;
  }

  const storedItems = stored.items || [];
  const submittedItems = submitted.items || [];

  if (storedItems.length !== submittedItems.length) return false;

  for (let i = 0; i < storedItems.length; i += 1) {
    const a = storedItems[i];
    const b = submittedItems[i];
    if (
      a.productId !== b.productId ||
      a.quantity !== b.quantity ||
      a.price !== b.price
    ) {
      return false;
    }
  }

  return true;
}
