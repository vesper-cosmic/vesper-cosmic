import crypto from "crypto";
import { NextResponse } from "next/server";
import { syncAllReferrerBalances } from "@/lib/referral";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily Vercel Cron (see vercel.json): refresh every referrer's balance
 * columns in Notion, since commissions become available 8 days after
 * shipping without any other event happening.
 *
 * Vercel sends "Authorization: Bearer $CRON_SECRET" automatically.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const provided = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!secret || !safeEqual(secret, provided)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncAllReferrerBalances();
    if (result?.skipped) {
      console.error("Referral balance cron skipped:", result.reason);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true, referrers: result.count });
  } catch (error) {
    console.error("Referral balance cron failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}
