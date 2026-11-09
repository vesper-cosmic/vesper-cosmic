import "server-only";

import crypto from "crypto";
import {
  findMemberByEmail,
  findMemberByReferralCode,
  findMembersWithWithdrawals,
  saveMemberBalances,
  saveMemberPayoutData,
} from "@/lib/memberServer";
import { findAllReferrerEmails, findNotionOrder, findReferralOrders } from "@/lib/orderServer";
import { PAYMENT_PAID, normalizedStatus } from "@/lib/orderStatus";
import { getProductById } from "@/lib/productServer";
import { sendPayoutPaidEmail } from "@/lib/customerEmails";

/**
 * Referral commissions
 * ────────────────────
 * Each product has a per-unit commission (USD) in its Notion column. An order
 * placed with a referral (link/code at checkout, or a member who signed up
 * through a link) stores the referrer and the commission on the order.
 *
 * A commission's state is derived from the order, nothing is credited by hand:
 *   pending   → order placed, not yet paid + shipped + 8 days
 *   available → paid, shipped, and 8 days have passed since shipping
 * Withdrawals are stored on the referrer's member record:
 *   processing → requested, waiting for the store to pay out
 *   paid       → paid out
 *   rejected   → returned to the available balance
 */
export const MATURITY_DAYS = 8;
export const MINIMUM_WITHDRAWAL = 15; // USD
const SHIPPED_STATUS = "🚚 貨品已寄出";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Work out who referred an order and the commission it earns.
 * A code given at checkout wins; otherwise the member's own referrer.
 */
export async function getOrderReferral({
  memberEmail,
  customerEmail,
  referralCode,
  items = [],
}) {
  const buyerEmails = [memberEmail, customerEmail]
    .filter(Boolean)
    .map((email) => email.toLowerCase());

  let referrerEmail = "";
  const code = String(referralCode || "").trim().toUpperCase();
  if (code && /^[A-Z0-9-]{4,32}$/.test(code)) {
    const referrer = await findMemberByReferralCode(code);
    if (referrer?.found) referrerEmail = referrer.member.email;
  }
  if (!referrerEmail && memberEmail) {
    const member = await findMemberByEmail(memberEmail);
    if (member?.found) referrerEmail = member.member?.referredByEmail || "";
  }

  referrerEmail = referrerEmail.toLowerCase();
  if (!referrerEmail || buyerEmails.includes(referrerEmail)) return null;

  let reward = 0;
  for (const item of items) {
    const { product } = await getProductById(item.productId);
    const commission = Number(product?.referralCommission) || 0;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    reward += commission * quantity;
  }
  reward = roundMoney(reward);

  return reward > 0 ? { referrerEmail, reward } : null;
}

/** When the commission on an order becomes withdrawable, or null. */
function availableAt(order) {
  if (order.paymentStatus !== PAYMENT_PAID) return null;
  if (normalizedStatus(order.productionStatus) !== SHIPPED_STATUS) return null;
  const shipped = Date.parse(order.shippingDate || "");
  if (Number.isNaN(shipped)) return null;
  return new Date(shipped + MATURITY_DAYS * DAY_MS);
}

/**
 * Everything the account page shows: the four balances, per-order history
 * and withdrawals.
 */
export async function getReferralSummary(member) {
  const result = await findReferralOrders(member.email);
  if (result?.skipped) return result;

  const now = Date.now();
  const history = (result.orders || []).map((order) => {
    const maturesAt = availableAt(order);
    const available = Boolean(maturesAt && maturesAt.getTime() <= now);
    return {
      date: order.createdAt,
      friend: maskName(order.fullName),
      amount: order.referralReward || 0,
      status: available ? "available" : "pending",
      availableOn: maturesAt && !available ? maturesAt.toISOString() : null,
    };
  });

  const withdrawals = Array.isArray(member.withdrawals) ? member.withdrawals : [];
  const sum = (list) => roundMoney(list.reduce((total, entry) => total + (Number(entry.amount) || 0), 0));

  const lifetime = sum(history.filter((entry) => entry.status === "available"));
  const pending = sum(history.filter((entry) => entry.status === "pending"));
  const processing = sum(withdrawals.filter((entry) => entry.status === "processing"));
  const paidOut = sum(withdrawals.filter((entry) => entry.status === "paid"));
  const available = roundMoney(Math.max(0, lifetime - processing - paidOut));

  return {
    skipped: false,
    balances: { available, pending, processing, lifetime, paidOut },
    minimumWithdrawal: MINIMUM_WITHDRAWAL,
    maturityDays: MATURITY_DAYS,
    history,
    withdrawals: withdrawals
      .slice()
      .reverse()
      .map(({ id, amount, requestedAt, paidAt, status, payout }) => ({
        id,
        amount,
        requestedAt,
        paidAt: paidAt || null,
        status,
        method: payout?.method || "",
      })),
    payoutInfo: member.payoutInfo || null,
  };
}

/**
 * Copy the member's balances into their Notion columns when they changed.
 * Never throws — Notion being slow must not break the calling request.
 */
export async function syncMemberBalances(pageId, member, summary) {
  try {
    const stored = member.storedBalances || {};
    const changed = ["available", "pending", "processing", "lifetime"].some(
      (key) => stored[key] !== summary.balances[key]
    );
    if (changed) await saveMemberBalances(pageId, summary.balances);
  } catch (error) {
    console.error("syncMemberBalances failed:", error.message || error);
  }
}

/** Recalculate and store one referrer's balances. */
export async function syncReferrerBalances(email) {
  try {
    if (!email) return;
    const found = await findMemberByEmail(email);
    if (!found?.found) return;
    const summary = await getReferralSummary(found.member);
    if (summary?.skipped) return;
    await syncMemberBalances(found.pageId, found.member, summary);
  } catch (error) {
    console.error("syncReferrerBalances failed:", error.message || error);
  }
}

/** Refresh the referrer of one order (after the admin changes the order). */
export async function syncOrderReferrer(orderId) {
  try {
    const found = await findNotionOrder(orderId);
    if (found?.found && found.order.referrerEmail) {
      await syncReferrerBalances(found.order.referrerEmail);
    }
  } catch (error) {
    console.error("syncOrderReferrer failed:", error.message || error);
  }
}

/** Daily job: refresh every referrer (commissions mature after 8 days). */
export async function syncAllReferrerBalances() {
  const result = await findAllReferrerEmails();
  if (result?.skipped) return result;
  for (const email of result.emails) {
    await syncReferrerBalances(email);
  }
  return { skipped: false, count: result.emails.length };
}

/** Validate payout details from the account page. Payouts are PayPal only. */
export function validatePayoutInfo(raw = {}) {
  const paypalEmail = String(raw.paypalEmail || "").trim().toLowerCase().slice(0, 120);
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
    errors.paypalEmail = "Enter the email address of your PayPal account.";
  }
  return { errors, payoutInfo: { method: "paypal", paypalEmail } };
}

/**
 * Create a withdrawal for the member's whole available balance.
 * Returns { ok, withdrawal } or { error, status }.
 */
export async function requestWithdrawal(email, payoutInfo) {
  const found = await findMemberByEmail(email);
  if (!found?.found) return { error: "Member not found.", status: 404 };

  const summary = await getReferralSummary(found.member);
  if (summary?.skipped) {
    return { error: "Could not load your earnings. Please try again later.", status: 503 };
  }

  const amount = summary.balances.available;
  if (amount < MINIMUM_WITHDRAWAL) {
    return {
      error: `You can withdraw once your available balance reaches $${MINIMUM_WITHDRAWAL.toFixed(2)} USD.`,
      status: 400,
    };
  }

  const withdrawal = {
    id: `WD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    amount,
    requestedAt: new Date().toISOString(),
    status: "processing",
    // Member ticked "18+, my PayPal, I agree to the Member Agreement".
    attestedAt: new Date().toISOString(),
    payout: payoutInfo,
  };
  const withdrawals = [...(found.member.withdrawals || []), withdrawal];

  await saveMemberPayoutData(found.pageId, { payoutInfo, withdrawals });
  await syncReferrerBalances(email);
  return { ok: true, withdrawal, member: found.member };
}

/** Admin: all withdrawal requests (processing first). */
export async function listWithdrawals({ processingOnly = false } = {}) {
  const result = await findMembersWithWithdrawals({ processingOnly });
  if (result?.skipped) return result;

  const rows = [];
  for (const { member } of result.members) {
    for (const withdrawal of member.withdrawals || []) {
      if (processingOnly && withdrawal.status !== "processing") continue;
      rows.push({ ...withdrawal, memberEmail: member.email, memberName: member.name });
    }
  }
  rows.sort((a, b) => {
    if ((a.status === "processing") !== (b.status === "processing")) {
      return a.status === "processing" ? -1 : 1;
    }
    return String(b.requestedAt).localeCompare(String(a.requestedAt));
  });
  return { skipped: false, withdrawals: rows };
}

/** Admin: mark a withdrawal paid, or reject it (amount returns to balance). */
export async function setWithdrawalStatus(memberEmail, withdrawalId, status, { notifyMember = true } = {}) {
  if (!["paid", "rejected"].includes(status)) {
    return { error: "Invalid status.", status: 422 };
  }
  const found = await findMemberByEmail(memberEmail);
  if (!found?.found) return { error: "Member not found.", status: 404 };

  const withdrawals = found.member.withdrawals || [];
  const target = withdrawals.find((entry) => entry.id === withdrawalId);
  if (!target) return { error: "Withdrawal not found.", status: 404 };
  if (target.status !== "processing") {
    return { error: "This withdrawal has already been handled.", status: 409 };
  }

  const updated = withdrawals.map((entry) =>
    entry.id === withdrawalId
      ? { ...entry, status, [status === "paid" ? "paidAt" : "rejectedAt"]: new Date().toISOString() }
      : entry
  );
  await saveMemberPayoutData(found.pageId, { withdrawals: updated });
  await syncReferrerBalances(memberEmail);
  if (status === "paid" && notifyMember) {
    await sendPayoutPaidEmail(found.member, target).catch((error) =>
      console.error("Payout email failed:", error)
    );
  }
  return { ok: true };
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

// Show only the first letter of the friend's name for privacy.
function maskName(name) {
  const first = Array.from(String(name || "").trim())[0];
  return first ? `${first.toUpperCase()}***` : "A friend";
}
