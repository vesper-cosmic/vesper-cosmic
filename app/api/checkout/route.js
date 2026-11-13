import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getOrderReferral, syncReferrerBalances } from "@/lib/referral";
import { saveMemberNailSizing } from "@/lib/memberServer";
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

  // Custom / personalized items are final sale: the customer must say they understand.
  if ((order.items.some((item) => item.requiresBirthData || item.requiresNailDetails)) && payload.acknowledgedFinalSale !== true) {
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
      items: order.items,
    });
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

  // Without a saved order the customer could pay for an order we have no
  // record of (and PayPal checkout would say "Order not found"), so stop here.
  if (notionResult?.error || notionResult?.skipped) {
    console.error("Order not saved; checkout stopped:", order.orderId, notionResult.error || notionResult.reason);
    return NextResponse.json(
      { errors: { submit: "We couldn't save your order just now. Please try again in a moment — you have not been charged." } },
      { status: 503 }
    );
  }

  // Remember the member's nail sizing for their next custom nail order.
  const sizedItem = order.items.find((item) => item.nails?.sizeMode);
  if (order.memberEmail && sizedItem && !notionResult?.error) {
    const keep = payload.saveNailSizing !== false;
    await saveMemberNailSizing(order.memberEmail, keep ? sizedItem.nails : null).catch((error) =>
      console.error("Saving nail sizing failed:", error)
    );
  }

  if (referral && !notionResult?.error) {
    await syncReferrerBalances(referral.referrerEmail);
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