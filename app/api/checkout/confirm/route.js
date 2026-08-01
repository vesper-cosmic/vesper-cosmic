import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { markMultiNotionOrderPaid } from "@/lib/orderServer";
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