import { NextResponse } from "next/server";
import { findNotionProducts } from "@/lib/productServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await findNotionProducts();

  return NextResponse.json(
    {
      products: result.skipped ? [] : result.products,
      source: result.skipped ? "static" : "notion",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}