import "server-only";

import { customerEmailsEnabled, safeSendEmail } from "@/lib/orderServer";
import { LEGAL } from "@/lib/legal";

const STORE = "Vesper Cosmos";

function signature() {
  return ["", "With love,", "Team Vesper", STORE, LEGAL.contactEmail].join("\n");
}

function skipped() {
  return { skipped: true, reason: "Customer emails are not enabled." };
}

/** Sent when the admin marks an order paid. */
export async function sendPaymentConfirmedEmail(order) {
  if (!customerEmailsEnabled() || !order?.email) return skipped();
  return safeSendEmail({
    to: order.email,
    subject: `${STORE} — Payment confirmed — ${order.orderId}`,
    text: [
      `Hi ${order.fullName || "there"},`,
      "",
      "Good news — we've confirmed your PayPal payment, and your order is now being prepared.",
      "",
      `Order ID: ${order.orderId}`,
      order.productName ? `Item: ${order.productName}` : null,
      `Amount: $${Number(order.amount || 0).toFixed(2)} USD`,
      "",
      "We'll email you again when it ships. You can check your order status any time on our Track Order page or in your account.",
      signature(),
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}

/** Sent when the admin marks an order shipped (with the tracking number). */
export async function sendShippedEmail(order, trackingNumber) {
  if (!customerEmailsEnabled() || !order?.email) return skipped();
  const tracking = trackingNumber || order.trackingNumber;
  return safeSendEmail({
    to: order.email,
    subject: `${STORE} — Your order has shipped — ${order.orderId}`,
    text: [
      `Hi ${order.fullName || "there"},`,
      "",
      "Your order is on its way!",
      "",
      `Order ID: ${order.orderId}`,
      order.productName ? `Item: ${order.productName}` : null,
      tracking ? `Tracking number: ${tracking}` : "Tracking number: we'll send it as soon as it's available.",
      "",
      tracking
        ? "Use this tracking number on your postal service's website to follow the delivery."
        : null,
      "If anything arrives damaged, reply to this email within 48 hours of delivery with photos and we'll make it right.",
      signature(),
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}

/** Sent when the admin marks a referral payout as paid. */
export async function sendPayoutPaidEmail(member, withdrawal) {
  if (!customerEmailsEnabled() || !member?.email) return skipped();
  return safeSendEmail({
    to: member.email,
    subject: `${STORE} — Your referral payout has been sent`,
    text: [
      `Hi ${member.name || "there"},`,
      "",
      `We've sent your referral commission payout of $${Number(withdrawal.amount || 0).toFixed(2)} USD by PayPal${
        withdrawal.payout?.paypalEmail ? ` to ${withdrawal.payout.paypalEmail}` : ""
      }.`,
      "",
      `Payout ID: ${withdrawal.id}`,
      "",
      "Thank you for sharing Vesper Cosmos with your friends. You can see your earnings any time in your account.",
      signature(),
    ].join("\n"),
  });
}
