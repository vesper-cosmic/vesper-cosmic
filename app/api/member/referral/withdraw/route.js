import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { safeSendEmail } from "@/lib/orderServer";
import { rateLimitResponse } from "@/lib/rateLimit";
import { requestWithdrawal, validatePayoutInfo } from "@/lib/referral";

const OWNER_EMAIL = "vesper.cosmic.blueprint@gmail.com";

/**
 * POST /api/member/referral/withdraw
 * Request a payout of the member's whole available commission balance.
 * Body: { payoutInfo: { paypalEmail } } — payouts are PayPal only.
 */
export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { errors, payoutInfo } = validatePayoutInfo(body.payoutInfo);
  if (body.confirmAdult !== true) {
    errors.confirmAdult =
      "Please confirm you are at least 18 and agree to the Member & Referral Program Agreement.";
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  let result;
  try {
    result = await requestWithdrawal(session.user.email, payoutInfo);
  } catch (error) {
    console.error("Withdrawal request failed:", error);
    return NextResponse.json(
      { error: "Could not submit your request. Please try again later." },
      { status: 500 }
    );
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  const { withdrawal, member } = result;

  await safeSendEmail({
    to: OWNER_EMAIL,
    replyTo: session.user.email,
    subject: `Vesper Cosmos — 分潤提現申請 $${withdrawal.amount.toFixed(2)} — ${member.email}`,
    text: [
      "有會員申請分潤提現，請到 /admin/referrals 處理。",
      "",
      `申請編號: ${withdrawal.id}`,
      `會員: ${member.name || ""} <${member.email}>`,
      `金額: $${withdrawal.amount.toFixed(2)} USD`,
      `PayPal: ${payoutInfo.paypalEmail}`,
    ].join("\n"),
  }).catch((error) => console.error("Withdrawal email failed:", error));

  return NextResponse.json({ ok: true, withdrawal: { id: withdrawal.id, amount: withdrawal.amount } });
}
