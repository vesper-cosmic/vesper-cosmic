import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getOrderReferral } from "@/lib/referral";
import { rateLimitResponse } from "@/lib/rateLimit";
import {
  createMultiNotionOrder,
  createPaypalUrl,
  validateMultiCheckoutPayload,
} from "@/lib/orderServer";
import { decrementProductInventory } from "@/lib/productServer";

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

  const { errors, order } = await validateMultiCheckoutPayload(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // The member link comes from the session, never from the request body.
  const session = await getServerSession(authOptions);
  order.memberEmail = session?.user?.email?.toLowerCase() || null;

  let referral = null;
  try {
    referral = await getOrderReferral(order.memberEmail, order.items);
  } catch (error) {
    console.error("Referral lookup failed:", error);
  }

  let notionResult = null;
  try {
    notionResult = await createMultiNotionOrder(order, referral);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion multi order creation failed:", error);
  }

  try {
    await decrementProductInventory(order.items);
  } catch (error) {
    console.error("Inventory update failed:", error);
  }

  return NextResponse.json(
    {
      success: true,
      orderId: order.orderId,
      createdAt: order.createdAt,
      order,
      paypalUrl: createPaypalUrl(order.total),
      notion: notionResult?.error ? "failed" : "ok",
      emails: "will_send_after_payment_return",
    },
    { status: 201 }
  );
}