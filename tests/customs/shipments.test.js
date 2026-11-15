import { describe, expect, it } from "vitest";
import {
  buildShipmentData,
  checkCombinable,
  formatShipmentNo,
  recipientSnapshot,
  validateShipment,
} from "@/lib/customs/shipments";
import { suggestService } from "@/lib/customs/validate";
import { OS_PAID, OS_SHIPPED, PAYMENT_PAID, PAYMENT_PENDING } from "@/lib/orderStatus";
import { buildCustomsLines } from "@/lib/customs/lines";
import { jar, nails, productsById, sachet } from "../fixtures/customs.js";

const ADDRESS = "Emily Johnson, 12 Main St, Austin, TX, 78701, United States, Tel: +1 512 555 0100";

const order = (orderId, items, extra = {}) => ({
  orderId,
  fullName: "Emily Johnson",
  email: "emily@example.com",
  createdAt: "2026-11-12T08:00:00.000Z",
  paymentStatus: PAYMENT_PAID,
  orderStatus: OS_PAID,
  productionStatus: "✅ 訂單已接受",
  trackingNumber: "",
  address: ADDRESS,
  amount: items.reduce((sum, i) => sum + i.price * i.quantity, 0) + 8,
  paypalCaptureId: `CAP-${orderId}`,
  items,
  ...extra,
});

const nailsOrder = (id, extra) => order(id, [{ productId: "nails-ready", quantity: 1, price: 88 }], extra);
const jarOrder = (id, extra) => order(id, [{ productId: "jar", quantity: 1, price: 48 }], extra);

describe("formatShipmentNo", () => {
  it("uses the Taiwan date and a 2-digit sequence", () => {
    expect(formatShipmentNo("2026-11-15T17:00:00Z", 1)).toBe("VC-SHP-20261116-01"); // already the 16th in Taipei
    expect(formatShipmentNo("2026-11-15T01:00:00Z", 12)).toBe("VC-SHP-20261115-12");
  });
});

describe("checkCombinable", () => {
  it("allows paid, unshipped orders with the same recipient, ignoring case, spacing and punctuation", () => {
    const b = nailsOrder("VC-20261112-BBB2", { address: "emily  johnson, 12 MAIN ST., austin, tx, 78701, USA, Tel: 1" });
    const result = checkCombinable([nailsOrder("VC-20261112-AAA1"), b]);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("blocks and names the field that differs", () => {
    const b = nailsOrder("VC-20261112-BBB2", { address: ADDRESS.replace("78701", "78702") });
    const result = checkCombinable([nailsOrder("VC-20261112-AAA1"), b]);
    expect(result.ok).toBe(false);
    expect(result.diffs.map((d) => d.field)).toEqual(["postalCode"]);
    expect(result.errors.join(" ")).toMatch(/郵遞區號/);
    expect(result.errors.join(" ")).toMatch(/78702/);
  });

  it("blocks a different recipient name, city, state and country", () => {
    const b = nailsOrder("VC-20261112-BBB2", {
      address: "Bob Smith, 12 Main St, Dallas, CA, 78701, Canada, Tel: 1",
      fullName: "Bob Smith",
    });
    const fields = checkCombinable([nailsOrder("VC-20261112-AAA1"), b]).diffs.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["fullName", "city", "stateProvince", "country"]));
  });

  it("blocks unpaid, shipped, cancelled-like and already-combined orders, and a single order", () => {
    expect(checkCombinable([nailsOrder("VC-20261112-AAA1")]).ok).toBe(false);
    const unpaid = nailsOrder("VC-20261112-BBB2", { paymentStatus: PAYMENT_PENDING, orderStatus: "🆕 新訂單" });
    expect(checkCombinable([nailsOrder("VC-20261112-AAA1"), unpaid]).errors.join(" ")).toMatch(/尚未付款/);
    const shipped = nailsOrder("VC-20261112-BBB2", { orderStatus: OS_SHIPPED });
    expect(checkCombinable([nailsOrder("VC-20261112-AAA1"), shipped]).errors.join(" ")).toMatch(/已經出貨/);
    const inShip = checkCombinable([nailsOrder("VC-20261112-AAA1"), nailsOrder("VC-20261112-BBB2")], {
      inShipment: { "VC-20261112-BBB2": "VC-SHP-20261115-01" },
    });
    expect(inShip.errors.join(" ")).toMatch(/VC-SHP-20261115-01/);
  });

  it("blocks digital-only orders", () => {
    const result = checkCombinable([nailsOrder("VC-20261112-AAA1"), nailsOrder("VC-20261112-BBB2")], {
      hasPhysical: (o) => o.orderId !== "VC-20261112-BBB2",
    });
    expect(result.errors.join(" ")).toMatch(/沒有需要寄送/);
  });
});

describe("buildShipmentData", () => {
  const defaults = { packagingEnvelopeG: 30, packagingBoxG: 150, dutyRate: 0.1, entryFeeUSD: 2 };
  const seller = { businessName: "VESPER COSMOS" };
  const shipment = { shipmentNo: "VC-SHP-20261115-01", service: "", packaging: "", trackingNumber: "" };
  const build = (orders, extra = {}) =>
    buildShipmentData({ shipment: { ...shipment, ...extra }, orders, productsById, defaults, seller, packaging: extra.pk || "envelope" });

  it("merges identical customs lines across orders and keeps every order on the packing list", () => {
    const data = build([nailsOrder("VC-20261112-AAA1"), nailsOrder("VC-20261112-BBB2")]);
    expect(data.invoiceLines).toHaveLength(1);
    expect(data.invoiceLines[0]).toMatchObject({ qty: 2, totalValueUSD: 176 });
    expect(data.orders.map((o) => o.orderId)).toEqual(["VC-20261112-AAA1", "VC-20261112-BBB2"]);
    expect(data.orders.every((o) => o.lines.length === 1)).toBe(true);
    expect(data.order.orderId).toBe("VC-20261112-AAA1, VC-20261112-BBB2");
    expect(data.invoiceNumber).toBe("VC-INV-VC-SHP-20261115-01");
  });

  it("adds packaging to the net weight, and the scale weight wins when recorded", () => {
    const orders = [nailsOrder("VC-20261112-AAA1"), jarOrder("VC-20261112-BBB2")];
    const envelope = build(orders);
    expect(envelope.summary.netWeightG).toBe(45 + 120);
    expect(envelope.summary.grossWeightG).toBe(165 + 30);
    const box = build(orders, { pk: "box" });
    expect(box.summary.grossWeightG).toBe(165 + 150);
    const scale = build(orders, { grossWeightG: 400 });
    expect(scale.summary.grossWeightG).toBe(400);
    expect(scale.summary.packagingWeightG).toBe(400 - 165);
  });

  it("declares only the physical goods actually paid, with shipping charged separately", () => {
    const withDigital = order("VC-20261112-AAA1", [
      { productId: "bundle", quantity: 1, price: 120 },
    ]);
    const data = build([withDigital, nailsOrder("VC-20261112-BBB2")]);
    // The bundle's 120 paid is split by list price (jar 48 + sachet 28 physical, report 68 digital):
    // 120 × 76/144 = 63.33 declared, plus 88 for the nails. The digital report is never declared.
    expect(data.summary.totalValueUSD).toBeCloseTo(63.33 + 88, 2);
    expect(data.lines.map((l) => l.productId)).not.toContain("report");
    expect(data.orders[0].hasDigital).toBe(true);
    expect(data.order.hasDigital).toBe(true);
  });

  it("flags fragile parcels for a box and light ones for an envelope", () => {
    const fragile = build([nailsOrder("VC-20261112-AAA1"), jarOrder("VC-20261112-BBB2")]);
    expect(fragile.suggestion.service).toMatch(/航空包裹/);
    expect(fragile.suggestion.packaging).toBe("box");
    const light = build([nailsOrder("VC-20261112-AAA1"), nailsOrder("VC-20261112-BBB2")]);
    expect(light.suggestion.service).toBe("國際e小包");
    expect(light.suggestion.packaging).toBe("envelope");
  });

  it("sums the shipping charged on each order", () => {
    const data = build([nailsOrder("VC-20261112-AAA1"), nailsOrder("VC-20261112-BBB2")]);
    expect(data.shippingChargedUSD).toBe(16);
  });

  it("blocks when a physical line has no weight, and takes the phone from any order", () => {
    const noWeight = { ...productsById, jar: { ...jar, customs: { ...jar.customs, unitWeightG: null } } };
    const data = buildShipmentData({
      shipment,
      orders: [nailsOrder("VC-20261112-AAA1", { address: ADDRESS.replace(", Tel: +1 512 555 0100", "") }), jarOrder("VC-20261112-BBB2")],
      productsById: noWeight,
      defaults,
      seller,
    });
    expect(data.validation.ok).toBe(false);
    expect(data.validation.errors.join(" ")).toMatch(/missing unit weight/);
    expect(data.address.phone).toBe("+1 512 555 0100");
  });
});

describe("validateShipment", () => {
  const base = { address: { fullName: "E", addressLine1: "1", city: "A", stateProvince: "TX", postalCode: "1", country: "United States", phone: "1" } };
  it("warns above the EZPost line limit and above USD 2,500", () => {
    const { lines } = buildCustomsLines({ items: [{ productId: "nails-ready", quantity: 1, price: 88 }] }, productsById);
    const many = Array.from({ length: 41 }, (_, i) => ({ ...lines[0], description: `Item ${i}` }));
    const result = validateShipment({ ...base, lines: many, invoiceLines: many, missingProducts: [], products: [], summary: { totalValueUSD: 3000 } });
    expect(result.warnings.join(" ")).toMatch(/41/);
    expect(result.warnings.join(" ")).toMatch(/2500/);
    expect(result.ok).toBe(true);
  });
});

describe("suggestService", () => {
  it("suggests a box for fragile goods and an envelope for light ones", () => {
    expect(suggestService({ products: [jar], grossWeightG: 300 }).packaging).toBe("box");
    expect(suggestService({ products: [nails, sachet], grossWeightG: 300 }).packaging).toBe("envelope");
    expect(suggestService({ products: [nails], grossWeightG: 2500 }).service).toBe("國際航空包裹");
  });
});

describe("recipientSnapshot", () => {
  it("round-trips through the order address format", () => {
    expect(recipientSnapshot({ fullName: "Emily Johnson", addressLine1: "12 Main St", addressLine2: "", city: "Austin", stateProvince: "TX", postalCode: "78701", country: "United States", phone: "+1 512 555 0100" })).toBe(ADDRESS);
  });
});
