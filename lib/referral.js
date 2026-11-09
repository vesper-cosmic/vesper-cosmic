import "server-only";

import { addReferralReward, findMemberByEmail } from "@/lib/memberServer";
import {
  REWARD_CREDITED,
  findNotionOrder,
  findReferralOrders,
  markOrderReferralCredited,
} from "@/lib/orderServer";
import { PAYMENT_PAID } from "@/lib/orderStatus";
import { getProductById } from "@/lib/productServer";

/**
 * Referral commission for an order placed by a signed-in member.
 *
 * Every order from a referred member earns their referrer the sum of each
 * product's commission (Notion products column, per unit) × quantity.
 * Returns null when there is nothing to record.
 */
export async function getOrderReferral(memberEmail, items = []) {
  if (!memberEmail) return null;

  const member = await findMemberByEmail(memberEmail);
  const referrerEmail = member?.found ? member.member?.referredByEmail : "";
  if (!referrerEmail || referrerEmail === memberEmail.toLowerCase()) return null;

  let reward = 0;
  for (const item of items) {
    const { product } = await getProductById(item.productId);
    const commission = Number(product?.referralCommission) || 0;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    reward += commission * quantity;
  }
  reward = Math.round(reward * 100) / 100;

  return reward > 0 ? { referrerEmail, reward } : null;
}

/**
 * Credit an order's commission to its referrer. Called when the admin marks
 * the order paid. Each order is credited at most once.
 */
export async function creditOrderReferral(orderId) {
  const found = await findNotionOrder(orderId);
  if (!found?.found) return { credited: false, reason: "Order not found." };

  const order = found.order;
  if (!order.referrerEmail || !(order.referralReward > 0)) {
    return { credited: false, reason: "No referral on this order." };
  }
  if (order.referralStatus === REWARD_CREDITED) {
    return { credited: false, reason: "Already credited." };
  }

  const result = await addReferralReward(order.referrerEmail, order.referralReward);
  if (result?.skipped) return { credited: false, reason: result.reason };

  await markOrderReferralCredited(order.pageId);
  return {
    credited: true,
    referrerEmail: order.referrerEmail,
    amount: order.referralReward,
  };
}

/** Commission history shown to the referrer on their account page. */
export async function getReferralHistory(referrerEmail) {
  const result = await findReferralOrders(referrerEmail);
  if (result?.skipped) return result;

  const entries = (result.orders || []).map((order) => ({
    date: order.createdAt,
    friend: maskName(order.fullName),
    amount: order.referralReward || 0,
    status:
      order.referralStatus === REWARD_CREDITED
        ? "credited"
        : order.paymentStatus === PAYMENT_PAID
        ? "processing"
        : "pending",
  }));

  const pendingTotal = entries
    .filter((entry) => entry.status !== "credited")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return { skipped: false, entries, pendingTotal: Math.round(pendingTotal * 100) / 100 };
}

// Show only the first letter of the friend's name for privacy.
function maskName(name) {
  const first = Array.from(String(name || "").trim())[0];
  return first ? `${first.toUpperCase()}***` : "A friend";
}
