import { beforeEach, describe, expect, it, vi } from "vitest";

// Every shipment route must refuse a request without an admin session.
const guard = vi.hoisted(() => ({ denied: true }));
vi.mock("@/lib/adminAuth", async () => {
  const { NextResponse } = await import("next/server");
  return {
    adminGuard: async () => (guard.denied ? NextResponse.json({ error: "Sign in required." }, { status: 401 }) : null),
  };
});
vi.mock("@/lib/shipmentServer", () => ({
  listShipments: vi.fn(async () => ({ skipped: false, shipments: [] })),
  shipmentIndex: vi.fn(() => ({})),
  shipmentsConfigured: vi.fn(() => true),
  createShipment: vi.fn(),
  findShipment: vi.fn(async () => ({ skipped: false, found: false })),
  updateShipment: vi.fn(),
}));
vi.mock("@/lib/orderServer", () => ({
  findNotionOrder: vi.fn(),
  setAdminOrderStatus: vi.fn(),
  updateOrderShippingRecord: vi.fn(),
}));
vi.mock("@/lib/productServer", () => ({ getAllProducts: vi.fn(async () => ({ products: [] })) }));
vi.mock("@/lib/referral", () => ({ syncOrderReferrer: vi.fn() }));
vi.mock("@/lib/costServer", () => ({ consumeMaterialsForOrder: vi.fn(async () => ({ done: false })), restoreStockForCancelledOrder: vi.fn() }));
vi.mock("@/lib/customerEmails", () => ({ sendCombinedShippedEmail: vi.fn() }));
vi.mock("@/lib/customs/shipmentContext", () => ({ loadShipmentCustoms: vi.fn(async () => ({ status: 404, error: "x" })) }));
vi.mock("@/lib/customs/render", () => ({ renderInvoicePdf: vi.fn(), renderPackingListPdf: vi.fn() }));

const ID = "VC-SHP-20261115-01";
const ctx = { params: { shipmentId: ID } };
const req = (method = "GET", body) =>
  new Request(`http://x/api/admin/shipments`, { method, body: body ? JSON.stringify(body) : undefined });

describe("shipment routes without an admin session", () => {
  beforeEach(() => {
    guard.denied = true;
  });

  it("GET/POST /api/admin/shipments → 401", async () => {
    const { GET, POST } = await import("@/app/api/admin/shipments/route.js");
    expect((await GET()).status).toBe(401);
    expect((await POST(req("POST", { orderIds: ["VC-20261112-AAA1", "VC-20261112-BBB2"] }))).status).toBe(401);
  });

  it("GET/PATCH /api/admin/shipments/[id] → 401", async () => {
    const { GET, PATCH } = await import("@/app/api/admin/shipments/[shipmentId]/route.js");
    expect((await GET(req(), ctx)).status).toBe(401);
    expect((await PATCH(req("PATCH", { action: "mark-shipped" }), ctx)).status).toBe(401);
  });

  it("invoice.pdf and packing-list.pdf → 401", async () => {
    const invoice = await import("@/app/api/admin/shipments/[shipmentId]/invoice.pdf/route.js");
    const list = await import("@/app/api/admin/shipments/[shipmentId]/packing-list.pdf/route.js");
    expect((await invoice.GET(req(), ctx)).status).toBe(401);
    expect((await list.GET(req(), ctx)).status).toBe(401);
  });
});

describe("shipment PATCH safety", () => {
  beforeEach(() => {
    guard.denied = false;
  });

  it("rejects an unknown shipment and a malformed id for an admin", async () => {
    const { PATCH } = await import("@/app/api/admin/shipments/[shipmentId]/route.js");
    expect((await PATCH(req("PATCH", { action: "cancel" }), { params: { shipmentId: "nope" } })).status).toBe(400);
    expect((await PATCH(req("PATCH", { action: "cancel" }), ctx)).status).toBe(404);
  });

  it("requires at least two orders to create a shipment", async () => {
    const { POST } = await import("@/app/api/admin/shipments/route.js");
    const { findNotionOrder } = await import("@/lib/orderServer");
    findNotionOrder.mockResolvedValue({
      skipped: false,
      found: true,
      order: { orderId: "VC-20261112-AAA1", paymentStatus: "✅ 已付款", orderStatus: "💰 已付款", items: [], address: "" },
    });
    const res = await POST(req("POST", { orderIds: ["VC-20261112-AAA1"] }));
    expect(res.status).toBe(422);
  });
});
