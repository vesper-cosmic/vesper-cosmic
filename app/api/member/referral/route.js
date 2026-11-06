import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  findOrCreateMember,
  findMemberByReferralCode,
  updateMemberReferrer,
} from "@/lib/memberServer";

/**
 * GET /api/member/referral
 * Get the current member's referral info
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await findOrCreateMember(session.user.email, session.user.name || "");

  if (result?.skipped) {
    return NextResponse.json(
      { error: result.reason, referral: null },
      { status: 200 }
    );
  }

  if (!result?.found) {
    return NextResponse.json({ error: "Member not found.", referral: null }, { status: 404 });
  }

  const member = result.member;
  return NextResponse.json({
    referral: {
      referralCode: member.referralCode,
      referredByEmail: member.referredByEmail,
      totalReferralReward: member.totalReferralReward,
    },
  });
}

/**
 * POST /api/member/referral
 * Bind a referral code to current member (only works if member doesn't already have a referrer)
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const { referralCode } = body;

  if (!referralCode || typeof referralCode !== "string") {
    return NextResponse.json(
      { error: "Invalid referral code." },
      { status: 400 }
    );
  }

  try {
    // Check if current member already has a referrer
    const member = await findOrCreateMember(session.user.email, session.user.name || "");
    if (member?.skipped) {
      return NextResponse.json({ error: member.reason }, { status: 400 });
    }
    if (!member?.found) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (member.member?.referredByEmail) {
      return NextResponse.json(
        { error: "Member already has a referrer." },
        { status: 400 }
      );
    }

    // Find referrer by referral code
    const referrer = await findMemberByReferralCode(referralCode);
    if (referrer?.skipped) {
      return NextResponse.json({ error: referrer.reason }, { status: 400 });
    }
    if (!referrer?.found) {
      return NextResponse.json(
        { error: "Invalid referral code." },
        { status: 404 }
      );
    }

    // Prevent self-referral
    if (referrer.member?.email === session.user.email) {
      return NextResponse.json(
        { error: "Cannot refer yourself." },
        { status: 400 }
      );
    }

    // Update current member with referrer info
    const updateResult = await updateMemberReferrer(
      session.user.email,
      referrer.member.email
    );

    if (updateResult?.skipped) {
      return NextResponse.json({ error: updateResult.reason }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      referredByEmail: referrer.member.email,
    });
  } catch (error) {
    console.error("/api/member/referral POST failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bind referral code." },
      { status: 500 }
    );
  }
}
