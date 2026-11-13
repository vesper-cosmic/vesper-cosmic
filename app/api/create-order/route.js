import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getOrderReferral, syncReferrerBalances } from "@/lib/referral";
import { saveMemberNailSizing } from "@/lib/memberServer";
import { rateLimitResponse } from "@/lib/rateLimit";
import {
  createNotionOrder,
  createPaypalUrl,
  validateOrderPayload,
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

  const { errors, order } = await validateOrderPayload(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // Custom / personalized items are final sale: the customer must say they understand.
  if ((order.requiresBirthData || order.requiresNailDetails) && payload.acknowledgedFinalSale !== true) {
    return NextResponse.json(
      {
        errors: {
          submit:
            "Please confirm you understand that custom and personalized items are final sale.",
        },
      },
      { status: 422 }
    );
  }

  // The member link comes from the session, never from the request body.
  const session = await getServerSession(authOptions);
  order.memberEmail = session?.user?.email?.toLowerCase() || null;

  let referral = null;
  try {
    referral = await getOrderReferral({
      memberEmail: order.memberEmail,
      customerEmail: order.email,
      referralCode: payload.referralCode,
      items: [{ productId: order.productId, quantity: 1 }],
    });
  } catch (error) {
    console.error("Referral lookup failed:", error);
  }

  let notionResult = null;
  try {
    notionResult = await createNotionOrder(order, referral);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion order creation failed:", error);
  }

  // Without a saved order the customer could pay for an order we have no record of.
  if (notionResult?.error || notionResult?.skipped) {
    console.error("Order not saved; checkout stopped:", order.orderId, notionResult.error || notionResult.reason);
    return NextResponse.json(
      { errors: { submit: "We couldn't save your order just now. Please try again in a moment — you have not been charged." } },
      { status: 503 }
    );
  }

  // Remember the member's nail sizing for their next custom nail order.
  if (order.memberEmail && order.sizeMode && !notionResult?.error) {
    const keep = payload.saveNailSizing !== false;
    await saveMemberNailSizing(
      order.memberEmail,
      keep
        ? {
            sizeMode: order.sizeMode,
            standardSize: order.standardSize,
            measurements: order.nailMeasurements,
          }
        : null
    ).catch((error) => console.error("Saving nail sizing failed:", error));
  }

  if (referral && !notionResult?.error) {
    await syncReferrerBalances(referral.referrerEmail);
  }

  try {
    await decrementProductInventory([{ productId: order.productId, quantity: 1 }]);
  } catch (error) {
    console.error("Inventory update failed:", error);
  }

  return NextResponse.json(
    {
      success: true,
      orderId: order.orderId,
      createdAt: order.createdAt,
      paypalUrl: createPaypalUrl(order.price),
      notion: notionResult?.error ? "failed" : "ok",
      emails: "will_send_after_payment_return",
    },
    { status: 201 }
  );
}
