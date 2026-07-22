import { NextResponse } from "next/server";
import {
  createNotionOrder,
  createPaypalUrl,
  persistOrder,
  validateOrderPayload,
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

  const { errors, order } = validateOrderPayload(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  await persistOrder(order);

  let notionResult = null;
  try {
    notionResult = await createNotionOrder(order);
  } catch (error) {
    notionResult = { error: error.message };
    console.error("Notion order creation failed:", error);
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
