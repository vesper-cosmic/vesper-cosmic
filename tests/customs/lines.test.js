import { describe, expect, it } from "vitest";
import { allocateCents, buildCustomsLines, estimateLandedCost, summarize } from "@/lib/customs/lines";
import { formatHtsus, isValidHtsus, stripHtsus } from "@/lib/customs/htsus";
import { productsById } from "../fixtures/customs.js";

const cents = (lines) => Math.round(lines.reduce((sum, l) => sum + l.totalValueUSD, 0) * 100);

describe("buildCustomsLines", () => {
  it("declares a single item at its paid price", () => {
    const { lines } = buildCustomsLines({ items: [{ productId: "nails-ready", quantity: 1, price: 88 }] }, productsById);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      description: "Plastic press-on artificial nails set",
      htsus: "3926400000",
      qty: 1,
      unitValueUSD: 88,
      totalValueUSD: 88,
      unitWeightG: 45,
      totalWeightG: 45,
      origin: "Taiwan",
    });
  });

  it("multiplies value and weight by quantity", () => {
    const { lines } = buildCustomsLines({ items: [{ productId: "jar", quantity: 3, price: 48 }] }, productsById);
    expect(lines[0]).toMatchObject({ qty: 3, unitValueUSD: 48, totalValueUSD: 144, totalWeightG: 360 });
  });

  it("never declares digital products", () => {
    const { lines } = buildCustomsLines(
      { items: [{ productId: "report", quantity: 1, price: 68 }, { productId: "sachet", quantity: 1, price: 28 }] },
      productsById
    );
    expect(lines.map((l) => l.productId)).toEqual(["sachet"]);
  });

  it("expands a bundle, excluding the digital share, and reconciles to the cent", () => {
    // Paid 120 for list 144 (jar 48 + sachet 28 + report 68). Physical share = 120 × 76/144 = 63.33.
    const { lines } = buildCustomsLines({ items: [{ productId: "bundle", quantity: 1, price: 120 }] }, productsById);
    expect(lines.map((l) => l.productId)).toEqual(["jar", "sachet"]);
    expect(cents(lines)).toBe(6333);
    // jar gets 48/76 of it, sachet 28/76; remainder on the largest line.
    expect(lines[0].totalValueUSD).toBe(40);
    expect(lines[1].totalValueUSD).toBe(23.33);
  });

  it("uses the bundle's customs value override when set", () => {
    const withOverride = {
      ...productsById,
      bundle: { ...productsById.bundle, customs: { ...productsById.bundle.customs, valueOverrideUSD: 50 } },
    };
    const { lines } = buildCustomsLines({ items: [{ productId: "bundle", quantity: 2, price: 120 }] }, withOverride);
    expect(cents(lines)).toBe(10000);
    expect(lines.every((l) => l.qty === 2)).toBe(true);
  });

  it("reports products that no longer exist", () => {
    const { lines, missingProducts } = buildCustomsLines({ items: [{ productId: "gone", quantity: 1, price: 10 }] }, productsById);
    expect(lines).toEqual([]);
    expect(missingProducts).toEqual(["gone"]);
  });
});

describe("allocateCents", () => {
  it("always adds up exactly, remainder on the largest weight", () => {
    expect(allocateCents(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateCents(1001, [3, 7])).toEqual([300, 701]);
    const parts = allocateCents(9999, [13, 29, 7, 51]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(9999);
  });
});

describe("summarize", () => {
  it("adds packaging to the net weight", () => {
    const { lines } = buildCustomsLines({ items: [{ productId: "jar", quantity: 2, price: 48 }] }, productsById);
    expect(summarize(lines, 150)).toMatchObject({ totalValueUSD: 96, netWeightG: 240, grossWeightG: 390, packagingWeightG: 150 });
  });
});

describe("estimateLandedCost", () => {
  it("is labeled as an estimate and adds duty, fees and postage", () => {
    const est = estimateLandedCost({ totalValueUSD: 88, postageTWD: 320, fxTWDperUSD: 32, dutyRate: 0.1, entryFeeUSD: 2, brokerFeeUSD: 1 });
    expect(est.isEstimate).toBe(true);
    expect(est.dutyUSD).toBe(8.8);
    expect(est.feesUSD).toBe(3);
    expect(est.postageUSD).toBe(10);
    expect(est.totalUSD).toBe(21.8);
  });
});

describe("HTSUS helpers", () => {
  it("strips, validates and formats", () => {
    expect(stripHtsus("3926.40.0000")).toBe("3926400000");
    expect(formatHtsus("3926400000")).toBe("3926.40.0000");
    expect(isValidHtsus("3926.40.0000")).toBe(true);
    expect(isValidHtsus("3926.40")).toBe(false);
    expect(isValidHtsus("39264000001")).toBe(false);
  });
});
