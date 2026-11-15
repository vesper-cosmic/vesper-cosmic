import { beforeEach, describe, expect, it, vi } from "vitest";

// Every inventory route must refuse a request without an admin session.
const guard = vi.hoisted(() => ({ denied: true }));
vi.mock("@/lib/adminAuth", async () => {
  const { NextResponse } = await import("next/server");
  return {
    adminGuard: async () => (guard.denied ? NextResponse.json({ error: "Sign in required." }, { status: 401 }) : null),
  };
});
vi.mock("@/lib/inventoryServer", () => ({
  getInventory: vi.fn(async () => ({ skipped: false, materials: [], summary: {} })),
  inventoryConfigured: vi.fn(() => true),
  createMaterial: vi.fn(),
  updateMaterial: vi.fn(),
  createPurchase: vi.fn(async () => ({ skipped: false, errors: ["請至少勾選一項進貨品項。"] })),
  listPurchases: vi.fn(async () => ({ skipped: false, purchases: [] })),
  adjustMaterialStock: vi.fn(),
  listMovements: vi.fn(async () => ({ skipped: false, movements: [] })),
}));

const req = (method = "GET", body) => new Request("http://x/api/admin/inventory", { method, body: body ? JSON.stringify(body) : undefined });

describe("inventory routes without an admin session", () => {
  beforeEach(() => {
    guard.denied = true;
  });

  it("return 401", async () => {
    const root = await import("@/app/api/admin/inventory/route.js");
    const one = await import("@/app/api/admin/inventory/[materialId]/route.js");
    const purchases = await import("@/app/api/admin/inventory/purchases/route.js");
    const adjust = await import("@/app/api/admin/inventory/adjustments/route.js");
    const movements = await import("@/app/api/admin/inventory/movements/route.js");
    expect((await root.GET()).status).toBe(401);
    expect((await root.POST(req("POST", { name: "x" }))).status).toBe(401);
    expect((await one.PATCH(req("PATCH", { name: "x" }), { params: { materialId: "m1" } })).status).toBe(401);
    expect((await purchases.GET()).status).toBe(401);
    expect((await purchases.POST(req("POST", { lines: [] }))).status).toBe(401);
    expect((await adjust.POST(req("POST", { materialId: "m1", delta: 1 }))).status).toBe(401);
    expect((await movements.GET()).status).toBe(401);
  });
});

describe("purchase route for an admin", () => {
  beforeEach(() => {
    guard.denied = false;
  });

  it("answers 422 with the validation errors", async () => {
    const { POST } = await import("@/app/api/admin/inventory/purchases/route.js");
    const res = await POST(req("POST", { lines: [] }));
    expect(res.status).toBe(422);
    expect((await res.json()).errors[0]).toMatch(/至少勾選/);
  });
});
