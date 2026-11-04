import { NextResponse } from "next/server";
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

  let notionResult = null;
  try {
    notionResult = await createNotionOrder(order);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion order creation failed:", error);
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
