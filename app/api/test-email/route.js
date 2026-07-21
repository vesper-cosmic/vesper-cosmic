import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/orderServer";

export async function POST(request) {
  const setupSecret = process.env.NOTION_SETUP_SECRET;

  if (process.env.NODE_ENV === "production" && !setupSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Set NOTION_SETUP_SECRET before enabling production email tests.",
      },
      { status: 403 }
    );
  }

  if (setupSecret && setupSecret !== request.headers.get("x-setup-secret")) {
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
