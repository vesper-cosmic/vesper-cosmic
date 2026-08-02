import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import {
  createMultiNotionOrder,
  createPaypalUrl,
  persistOrder,
  validateMultiCheckoutPayload,
} from "@/lib/orderServer";

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

  await persistOrder(order);

  let notionResult = null;
  try {
    notionResult = await createMultiNotionOrder(order);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion multi order creation failed:", error);
  }

  return NextResponse.json(
    {
      success: true,
      orderId: order.orderId,
      createdAt: order.createdAt,
      paypalUrl: createPaypalUrl(order.total),
      notion: notionResult?.error ? "failed" : "ok",
      emails: "will_send_after_payment_return",
    },
    { status: 201 }
  );
}