import "server-only";

import { createPaypalUrl, customerEmailsEnabled, safeSendEmail } from "@/lib/orderServer";
import { LEGAL } from "@/lib/legal";

const STORE = "Vesper Cosmos";

function signature() {
  return ["", "With love,", "Team Vesper", STORE, LEGAL.contactEmail].join("\n");
}

/** An optional message the admin typed, shown as its own paragraph. */
function noteLines(note) {
  const text = String(note || "").trim();
  return text ? ["", text] : [];
}

function skipped() {
  return { skipped: true, reason: "Customer emails are not enabled." };
}

/** Sent when the admin marks an order paid. */
export async function sendPaymentConfirmedEmail(order, note) {
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
      ...noteLines(note),
      "",
      "We'll email you again when it ships. You can check your order status any time on our Track Order page or in your account.",
      signature(),
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}

/** Sent when the admin marks an order shipped (with the tracking number). */
export async function sendShippedEmail(order, trackingNumber, note, { attachments = [] } = {}) {
  if (!customerEmailsEnabled() || !order?.email) return skipped();
  const tracking = trackingNumber || order.trackingNumber;
  return safeSendEmail({
    attachments,
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
      "",
      "Duties and import fees have been prepaid — there is nothing to pay on delivery.",
      attachments.length ? "Your commercial invoice is attached for your records." : null,
      ...noteLines(note),
      "",
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

/** Sent when the admin moves an order to 已發付款通知: we got your order, please pay. */
export async function sendPaymentRequestEmail(order, note) {
  if (!customerEmailsEnabled() || !order?.email) return skipped();
  const amount = Number(order.amount || 0).toFixed(2);
  return safeSendEmail({
    to: order.email,
    subject: `${STORE} — Payment needed for your order — ${order.orderId}`,
    text: [
      `Hi ${order.fullName || "there"},`,
      "",
      "Thank you for your order! We've received it, but we haven't received your payment yet.",
      "",
      `Order ID: ${order.orderId}`,
      order.productName ? `Item: ${order.productName}` : null,
      `Amount due: $${amount} USD`,
      "",
      "Please pay by PayPal here:",
      createPaypalUrl(amount),
      "",
      `Please include your order ID (${order.orderId}) in the PayPal note. Once we've confirmed your payment we'll start preparing your order and email you.`,
      ...noteLines(note),
      "",
      "If you've already paid, just reply to this email and we'll check it for you.",
      signature(),
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });
}

/** Sent when the admin cancels an order. */
export async function sendOrderCancelledEmail(order, note) {
  if (!customerEmailsEnabled() || !order?.email) return skipped();
  return safeSendEmail({
    to: order.email,
    subject: `${STORE} — Your order has been cancelled — ${order.orderId}`,
    text: [
      `Hi ${order.fullName || "there"},`,
      "",
      `Your order ${order.orderId} has been cancelled.`,
      ...noteLines(note),
      "",
      "If you already paid for this order, we will refund the full amount to your original payment method within 15 days. If you have any questions, just reply to this email.",
      signature(),
    ].join("\n"),
  });
}
