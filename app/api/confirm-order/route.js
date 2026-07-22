import { NextResponse } from "next/server";
import {
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

  const { errors, order } = normalizeConfirmedOrderPayload(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
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
