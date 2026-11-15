import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/adminAuth";
import { findAllNotionOrders } from "@/lib/orderServer";
import { getAllProducts } from "@/lib/productServer";
import { listShipments } from "@/lib/shipmentServer";
import { getInventory, inventoryConfigured } from "@/lib/inventoryServer";
import { buildCostReport, monthOf, paypalFeeConfig } from "@/lib/cost";
import { fallbackRate, getUsdTwdRate } from "@/lib/fx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

/**
 * GET /api/admin/reports/cost[?month=YYYY-MM]
 * Revenue, costs and profit in TWD for paid orders, plus per-month and
 * per-product breakdowns and the current inventory value.
 */
export async function GET(request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const month = new URL(request.url).searchParams.get("month") || "";
  if (month && !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month must look like 2026-11." }, { status: 400, headers: NO_STORE });
  }

  const ordersResult = await findAllNotionOrders();
  if (ordersResult?.skipped) {
    return NextResponse.json({ error: ordersResult.reason }, { status: 503, headers: NO_STORE });
  }
  const [shipmentsResult, productsResult, inventory] = await Promise.all([listShipments(), getAllProducts(), getInventory()]);

  const productsById = Object.fromEntries((productsResult.products || []).map((p) => [p.id, p]));
  const materialCostById = Object.fromEntries((inventory.materials || []).map((m) => [m.id, m.avgCostTWD]));
  const live = await getUsdTwdRate({ timeoutMs: 2000 });

  const report = buildCostReport({
    orders: ordersResult.orders,
    shipments: shipmentsResult.shipments || [],
    productsById,
    materialCostById,
    fallbackRate: fallbackRate(),
    feeConfig: paypalFeeConfig(process.env),
    month,
  });

  const months = Array.from(new Set(ordersResult.orders.map((o) => monthOf(o.createdAt)).filter(Boolean))).sort().reverse();

  return NextResponse.json(
    {
      ...report,
      month,
      months,
      feeConfig: paypalFeeConfig(process.env),
      todayRate: live,
      inventory: {
        configured: inventoryConfigured(),
        totalValueTWD: inventory.summary?.totalValueTWD ?? 0,
        lowCount: inventory.summary?.lowCount ?? 0,
        negativeCount: inventory.summary?.negativeCount ?? 0,
      },
    },
    { headers: NO_STORE }
  );
}
