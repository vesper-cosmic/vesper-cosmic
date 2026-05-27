export { POST } from "@/app/api/create-order/route";

import { NextResponse } from "next/server";
import { updateStoredTracking } from "@/lib/orderServer";

export async function PATCH(request) {
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
  const trackingNumber = String(payload.trackingNumber || "").trim();
  const carrier = String(payload.carrier || "").trim();

  if (!orderId || !trackingNumber) {
    return NextResponse.json(
      {
        errors: {
          orderId: !orderId ? "Order ID is required." : undefined,
          trackingNumber: !trackingNumber ? "Tracking number is required." : undefined,
        },
      },
      { status: 422 }
    );
  }

  const updatedOrder = await updateStoredTracking({
    orderId,
    trackingNumber,
    carrier,
  });

  if (!updatedOrder) {
    return NextResponse.json(
      { errors: { orderId: "Order not found in temporary storage." } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    orderId: updatedOrder.orderId,
    trackingNumber: updatedOrder.trackingNumber,
    message: "Tracking number updated.",
  });
}
