import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildCustomsLines, mergeCustomsLines } from "@/lib/customs/lines";
import { renderInvoicePdf, renderPackingListPdf, renderPackingSlipPdf } from "@/lib/customs/render";
import { buildShipmentData } from "@/lib/customs/shipments";
import { customsData, productsById } from "../fixtures/customs.js";

const isPdf = (buffer) => Buffer.from(buffer).subarray(0, 5).toString() === "%PDF-";

const fixtures = {
  "nails order": [{ productId: "nails-ready", quantity: 1, price: 88 }],
  "glass bottle order": [{ productId: "jar", quantity: 2, price: 48 }],
  "bundle with digital report": [{ productId: "bundle", quantity: 1, price: 120 }],
};

describe("PDF rendering", () => {
  for (const [name, items] of Object.entries(fixtures)) {
    it(`renders the invoice and packing slip for a ${name}`, async () => {
      const { lines } = buildCustomsLines({ items }, productsById);
      const data = customsData(lines, {
        kitContents: [{ name: "Celestial Romance -S", includes: productsById["nails-ready"].includes }],
      });
      expect(isPdf(await renderInvoicePdf(data))).toBe(true);
      expect(isPdf(await renderPackingSlipPdf(data))).toBe(true);
    }, 30000);
  }
});

describe("multi-item order", () => {
  it("renders an order with three different products, invoice merged and packing slip itemised", async () => {
    const items = [
      { productId: "nails-ready", quantity: 1, price: 88 },
      { productId: "jar", quantity: 2, price: 48 },
      { productId: "sachet", quantity: 1, price: 28 },
    ];
    const { lines } = buildCustomsLines({ items }, productsById);
    expect(lines).toHaveLength(3);
    const data = { ...customsData(lines), invoiceLines: mergeCustomsLines(lines) };
    expect(isPdf(await renderInvoicePdf(data))).toBe(true);
    expect(isPdf(await renderPackingSlipPdf(data))).toBe(true);
  }, 30000);
});

describe("combined shipment PDFs", () => {
  it("renders one invoice and a grouped packing list for two orders (nails + energy bottle)", async () => {
    const mk = (orderId, items) => ({
      orderId,
      fullName: "Emily Johnson",
      email: "emily@example.com",
      createdAt: "2026-11-12T08:00:00.000Z",
      amount: items.reduce((sum, i) => sum + i.price * i.quantity, 0) + 8,
      paypalCaptureId: `CAP-${orderId}`,
      address: "Emily Johnson, 12 Main St, Austin, TX, 78701, United States, Tel: +1 512 555 0100",
      items,
    });
    const data = buildShipmentData({
      shipment: { shipmentNo: "VC-SHP-20261115-01", trackingNumber: "RR123456789TW", service: "Air Parcel" },
      orders: [
        mk("VC-20261112-AAA1", [{ productId: "nails-ready", quantity: 1, price: 88 }]),
        mk("VC-20261112-BBB2", [{ productId: "jar", quantity: 1, price: 48 }]),
      ],
      productsById,
      defaults: { packagingEnvelopeG: 30, packagingBoxG: 150 },
      seller: { businessName: "VESPER COSMOS", country: "Taiwan", email: "hello@example.com" },
      packaging: "box",
    });
    expect(data.validation.ok).toBe(true);
    expect(data.invoiceLines).toHaveLength(2);
    expect(isPdf(await renderInvoicePdf(data))).toBe(true);
    expect(isPdf(await renderPackingListPdf(data))).toBe(true);
  }, 30000);
});

// ── Route: admin only, PDF content type, Notion mocked ──
const guard = vi.hoisted(() => ({ result: null }));
vi.mock("@/lib/adminAuth", async () => {
  const { NextResponse } = await import("next/server");
  return {
    adminGuard: async () =>
      guard.result === "401" ? NextResponse.json({ error: "Sign in required." }, { status: 401 }) : null,
  };
});
vi.mock("@/lib/customs/context", async () => {
  const fixturesModule = await import("../fixtures/customs.js");
  const linesModule = await import("@/lib/customs/lines");
  return {
    ORDER_ID_PATTERN: /^VC-\d{8}-[A-Z0-9]{3,8}$/,
    loadOrderCustoms: async () => {
      const { lines } = linesModule.buildCustomsLines(
        { items: [{ productId: "nails-ready", quantity: 1, price: 88 }] },
        fixturesModule.productsById
      );
      return { status: 200, data: fixturesModule.customsData(lines) };
    },
  };
});

describe("GET /api/admin/orders/[orderId]/invoice.pdf", () => {
  beforeEach(() => {
    guard.result = null;
  });

  it("returns 401 without an admin session", async () => {
    guard.result = "401";
    const { GET } = await import("@/app/api/admin/orders/[orderId]/invoice.pdf/route.js");
    const res = await GET(new Request("http://x/api/admin/orders/VC-20261112-AB12/invoice.pdf"), {
      params: { orderId: "VC-20261112-AB12" },
    });
    expect(res.status).toBe(401);
  });

  it("returns a no-store PDF for an admin", async () => {
    const { GET } = await import("@/app/api/admin/orders/[orderId]/invoice.pdf/route.js");
    const res = await GET(new Request("http://x/api/admin/orders/VC-20261112-AB12/invoice.pdf"), {
      params: { orderId: "VC-20261112-AB12" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("cache-control")).toMatch(/no-store/);
    expect(isPdf(await res.arrayBuffer())).toBe(true);
  }, 30000);
});
