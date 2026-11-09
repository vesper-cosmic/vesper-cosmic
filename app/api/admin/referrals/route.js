import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { listWithdrawals, setWithdrawalStatus } from "@/lib/referral";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.email && isAdminEmail(session.user.email));
}

/** GET /api/admin/referrals — every withdrawal request, processing first. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const result = await listWithdrawals();
  if (result?.skipped) {
    return NextResponse.json({ error: result.reason, withdrawals: [] }, { status: 200 });
  }
  return NextResponse.json({ withdrawals: result.withdrawals });
}

/**
 * PATCH /api/admin/referrals
 * Body: { memberEmail, withdrawalId, status: "paid" | "rejected" }
 */
export async function PATCH(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const memberEmail = String(body.memberEmail || "").trim().toLowerCase();
  const withdrawalId = String(body.withdrawalId || "").trim();
  const status = String(body.status || "").trim();

  if (!memberEmail || !withdrawalId) {
    return NextResponse.json({ error: "Missing withdrawal." }, { status: 422 });
  }

  try {
    const result = await setWithdrawalStatus(memberEmail, withdrawalId, status);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
  } catch (error) {
    console.error("Withdrawal update failed:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
