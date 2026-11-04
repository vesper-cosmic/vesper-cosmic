import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { importStaticProducts, setupProductDatabase } from "@/lib/productServer";

/**
 * One-time product catalog setup, triggered from /admin/products.
 * - action "database": create the Notion product database (or add missing
 *   columns to the configured one)
 * - action "import": copy the built-in products from data/products.js into it
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    if (payload.action === "database") {
      const result = await setupProductDatabase();
      return NextResponse.json({ ok: true, ...result });
    }

    if (payload.action === "import") {
      const result = await importStaticProducts();
      if (result?.skipped) {
        return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
      }
      return NextResponse.json({ ok: true, imported: result.imported });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Product setup failed:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Product setup failed." },
      { status: 500 }
    );
  }
}
