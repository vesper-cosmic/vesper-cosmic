import { NextResponse } from "next/server";
import { paypalCheckoutEnabled, paypalClientId } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/** The public PayPal client ID for the checkout buttons (null = use PayPal.me). */
export async function GET() {
  return NextResponse.json({
    clientId: paypalCheckoutEnabled() ? paypalClientId() : null,
  });
}
