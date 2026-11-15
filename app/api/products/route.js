import { NextResponse } from "next/server";
import { findNotionProducts } from "@/lib/productServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await findNotionProducts();

  return NextResponse.json(
    {
      // Commission amounts, customs data and cost data are internal; don't send them to shoppers.
      products: result.skipped
        ? []
        : result.products.map(({ referralCommission, customs, cost, ...product }) => product),
      source: result.skipped ? "static" : "notion",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}