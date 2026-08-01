import "server-only";

import { safeSendEmail } from "@/lib/orderServer";

const ownerEmail = "vesper.cosmic.blueprint@gmail.com";
const storeName = "Vesper Cosmos";

export async function sendMultiOrderEmails(order, notionResult) {
  const customerResult = await safeSendEmail({
    to: order.email,
    replyTo: ownerEmail,
    subject: `${storeName} — Your order is confirmed`,
    text: multiCustomerEmailText(order),
  });

  const ownerResult = await safeSendEmail({
    to: ownerEmail,
    replyTo: order.email,
    subject: `${storeName} — Payment submitted — ${order.fullName}`,
    text: multiOwnerEmailText(order, notionResult),
  });

  return { customerResult, ownerResult };
}

function multiCustomerEmailText(order) {
  const itemLines = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.productName} × ${item.quantity} — $${(
          item.price * item.quantity
        ).toFixed(2)} USD`
    )
    .join("\n");

  return `${storeName}

Hi ${order.fullName},

Thank you for your Vesper Cosmos order. Your payment has been submitted through PayPal, and your order is now in my queue.

Order ID: ${order.orderId}
Amount: $${order.total.toFixed(2)} USD
Payment status: PayPal payment submitted

Items
${itemLines}

${
  order.shipping?.country
    ? `Shipping address:\n${[
        order.shipping.addressLine1,
        order.shipping.addressLine2,
        order.shipping.city,
        order.shipping.stateProvince,
        order.shipping.postalCode,
        order.shipping.country,
      ]
        .filter(Boolean)
        .join(", ")}`
    : "Your personalized digital reports will be delivered to this email."
}

I will review your order and be in touch within 24 hours to confirm the details.

Please reply to this email if any details need to be corrected.

I'm honored to be part of your journey.
Vesper
${storeName}
${ownerEmail}`;
}

function multiOwnerEmailText(order, notionResult) {
  const notionStatus = notionResult?.skipped
    ? `Notion status: Skipped — ${notionResult.reason}`
    : notionResult?.error
    ? `Notion status: Failed — ${notionResult.error}`
    : "Notion status: Payment status updated";

  const itemLines = order.items
    .map((item, index) => {
      const parts = [
        `${index + 1}. ${item.productName} × ${item.quantity} — $${(
          item.price * item.quantity
        ).toFixed(2)} USD`,
      ];
      if (item.intention) parts.push(`   Intention: ${item.intention}`);
      if (item.birth?.birthDate) {
        parts.push(
          `   Birth: ${item.birth.birthDate} ${item.birth.birthTime} ${
            item.birth.biologicalGender
          } ${item.birth.daylightSavingTime} ${item.birth.birthLocation}`
        );
      }
      if (item.nails?.nailShape) {
        parts.push(
          `   Nails: ${item.nails.nailShape} ${item.nails.nailLength} ${
            item.nails.stylePreference
          } ${
            item.nails.mixedSet
              ? "Mixed Set"
              : Object.entries(item.nails.measurements || {})
                  .map(([key, value]) => `${key}:${value}`)
                  .join(" ")
          }`
        );
      }
      if (item.notes) parts.push(`   Notes: ${item.notes}`);
      return parts.join("\n");
    })
    .join("\n");

  return `${storeName}

Payment submitted order notification (Multi-item cart)

${notionStatus}

Order ID: ${order.orderId}
Amount: $${order.total.toFixed(2)} USD
Payment status: PayPal payment submitted
Order time: ${order.createdAt}
${order.memberEmail ? `Member email: ${order.memberEmail}` : "Guest checkout"}
${
  order.saveAddressToMember
    ? "Address saved to member profile: Yes"
    : ""
}

Customer
Full name: ${order.fullName}
Email: ${order.email}

Items
${itemLines}

Shipping address
${
  order.shipping?.country
    ? [
        order.shipping.addressLine1,
        order.shipping.addressLine2,
        order.shipping.city,
        order.shipping.stateProvince,
        order.shipping.postalCode,
        order.shipping.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "N/A"
}

Full order payload
${JSON.stringify(order, null, 2)}`;
}