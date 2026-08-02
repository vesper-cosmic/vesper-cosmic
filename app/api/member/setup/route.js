import crypto from "crypto";
import { NextResponse } from "next/server";
import { setupMembersDatabase } from "@/lib/memberServer";

export async function POST(request) {
  const setupSecret = process.env.NOTION_SETUP_SECRET;

  if (!setupSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Set NOTION_SETUP_SECRET before enabling member database setup.",
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

  try {
    const result = await setupMembersDatabase();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Member database setup failed:", error);
    return NextResponse.json(
      { error: error.message || "Member database setup failed." },
      { status: 500 }
    );
  }
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
