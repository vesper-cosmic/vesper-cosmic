import crypto from "crypto";
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sendTestEmail } from "@/lib/orderServer";

export async function POST(request) {
  const rateLimited = rateLimitResponse(request);
  if (rateLimited) return rateLimited;

  const setupSecret = process.env.NOTION_SETUP_SECRET;

  if (!setupSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Set NOTION_SETUP_SECRET before enabling email tests.",
      },
      { status: 403 }
    );
  }

  const providedSecret = request.headers.get("x-setup-secret") || "";
  if (!timingSafeEqual(setupSecret, providedSecret)) {
    return NextResponse.json(
      { success: false, error: "Invalid setup secret." },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const result = await sendTestEmail(payload.to);

  return NextResponse.json({
    success: Boolean(result.success),
    result,
  });
}

/**
 * Constant-time string comparison to prevent timing attacks when
 * verifying the setup secret.
 */
function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
