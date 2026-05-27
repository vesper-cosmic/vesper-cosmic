import { NextResponse } from "next/server";
import { setupNotionDatabase } from "@/lib/orderServer";

export async function POST(request) {
  const setupSecret = process.env.NOTION_SETUP_SECRET;

  if (process.env.NODE_ENV === "production" && !setupSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Set NOTION_SETUP_SECRET before enabling production database setup.",
      },
      { status: 403 }
    );
  }

  if (
    setupSecret &&
    setupSecret !== requestHeaderSecret(request)
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid setup secret." },
      { status: 401 }
    );
  }

  try {
    const result = await setupNotionDatabase();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Notion setup failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function requestHeaderSecret(request) {
  return request?.headers?.get("x-setup-secret") || "";
}
