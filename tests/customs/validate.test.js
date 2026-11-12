import { describe, expect, it } from "vitest";
import { validateForCustoms, suggestService } from "@/lib/customs/validate";
import { parseShippingAddress } from "@/lib/customs/address";
import { buildCustomsLines, summarize } from "@/lib/customs/lines";
import { jar, nails, productsById, usAddress } from "../fixtures/customs.js";

function check(items, address = usAddress, products = productsById) {
  const { lines, missingProducts } = buildCustomsLines({ items }, products);
  const summary = summarize(lines);
  const ordered = items.map((i) => products[i.productId]).filter(Boolean);
  return validateForCustoms({ address, lines, missingProducts, products: ordered, summary });
}

describe("validateForCustoms", () => {
  it("passes a complete US order", () => {
    const result = check([{ productId: "nails-ready", quantity: 1, price: 88 }]);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("blocks on missing phone and non-US destinations", () => {
    const result = check([{ productId: "jar", quantity: 1, price: 48 }], { ...usAddress, phone: "", country: "Canada" });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/United States/);
    expect(result.errors.join(" ")).toMatch(/phone/);
  });

  it("blocks on missing HTSUS, weight or description", () => {
    const broken = { ...productsById, jar: { ...jar, customs: { description: "", htsus: "7013", unitWeightG: null } } };
    const result = check([{ productId: "jar", quantity: 1, price: 48 }], usAddress, broken);
    expect(result.errors).toHaveLength(3);
  });

  it("warns on blocklisted words, dangerous goods and high values", () => {
    const loud = {
      ...productsById,
      "nails-ready": {
        ...nails,
        includes: "nails, alcohol prep pad",
        customs: { ...nails.customs, description: "Healing energy nails" },
      },
    };
    const result = check([{ productId: "nails-ready", quantity: 30, price: 88 }], usAddress, loud);
    expect(result.ok).toBe(true);
    const text = result.warnings.join(" ");
    expect(text).toMatch(/energy/);
    expect(text).toMatch(/dangerous goods/);
    expect(text).toMatch(/2500/);
  });
});

describe("parseShippingAddress", () => {
  it("reads the new format with name and phone", () => {
    expect(
      parseShippingAddress("Emily Johnson, 12 Main St, Apt 4, Austin, TX, 78701, United States, Tel: +1 512 555 0100")
    ).toEqual({ ...usAddress, addressLine2: "Apt 4" });
  });

  it("reads the older format and uses the customer name", () => {
    const parsed = parseShippingAddress("12 Main St, Austin, TX, 78701, United States", "Emily Johnson");
    expect(parsed).toMatchObject({ fullName: "Emily Johnson", addressLine1: "12 Main St", city: "Austin", phone: "" });
  });
});

describe("suggestService", () => {
  it("suggests e-packet for light non-fragile parcels and air parcel for glass", () => {
    expect(suggestService({ products: [nails], grossWeightG: 80 }).service).toBe("國際e小包");
    expect(suggestService({ products: [jar], grossWeightG: 150 }).service).toMatch(/國際航空包裹/);
  });
});
