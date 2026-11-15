import { beforeEach, describe, expect, it, vi } from "vitest";

// The cost report must refuse a request without an admin session, and must
// never send recipes or costs to the public product API.
const guard = vi.hoisted(() => ({ denied: true }));
vi.mock("@/lib/adminAuth", async () => {
  const { NextResponse } = await import("next/server");
  return {
    adminGuard: async () => (guard.denied ? NextResponse.json({ error: "Sign in required." }, { status: 401 }) : null),
  };
});
vi.mock("@/lib/orderServer", () => ({ findAllNotionOrders: vi.fn(async () => ({ skipped: false, orders: [] })) }));
vi.mock("@/lib/productServer", () => ({
  getAllProducts: vi.fn(async () => ({ products: [] })),
  findNotionProducts: vi.fn(async () => ({
    skipped: false,
    products: [
      {
        id: "p1",
        name: "Bottle",
        price: 10,
        referralCommission: 1,
        customs: { htsus: "7013999090" },
        cost: { recipe: [{ materialId: "m1", quantity: 5 }], packagingTWD: 10, laborTWD: 5 },
      },
    ],
  })),
}));
vi.mock("@/lib/shipmentServer", () => ({ listShipments: vi.fn(async () => ({ skipped: false, shipments: [] })) }));
vi.mock("@/lib/inventoryServer", () => ({
  getInventory: vi.fn(async () => ({ skipped: false, materials: [], summary: {} })),
  inventoryConfigured: vi.fn(() => true),
}));
vi.mock("@/lib/fx", () => ({
  fallbackRate: () => 32,
  getUsdTwdRate: vi.fn(async () => ({ rate: 32.5, source: "live" })),
}));

describe("GET /api/admin/reports/cost", () => {
  beforeEach(() => {
    guard.denied = true;
  });

  it("returns 401 without an admin session", async () => {
    const { GET } = await import("@/app/api/admin/reports/cost/route.js");
    expect((await GET(new Request("http://x/api/admin/reports/cost"))).status).toBe(401);
  });

  it("rejects a malformed month for an admin and answers with the report otherwise", async () => {
    guard.denied = false;
    const { GET } = await import("@/app/api/admin/reports/cost/route.js");
    expect((await GET(new Request("http://x/api/admin/reports/cost?month=nope"))).status).toBe(400);
    const ok = await GET(new Request("http://x/api/admin/reports/cost?month=2026-11"));
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(body.totals.orderCount).toBe(0);
    expect(body.todayRate).toEqual({ rate: 32.5, source: "live" });
  });
});

describe("public product API", () => {
  it("strips cost, customs and commission data", async () => {
    const { GET } = await import("@/app/api/products/route.js");
    const body = await (await GET()).json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0]).toEqual({ id: "p1", name: "Bottle", price: 10 });
  });
});
