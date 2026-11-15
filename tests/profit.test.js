import { describe, expect, it } from "vitest";
import { DEFAULT_PROFIT_SETTINGS as D, normalizeSettings, postageFor, productNetProfit, shippingFor, unitWeightG } from "@/lib/profit";

describe("postageFor", () => {
  it("ePacket brackets, boundaries and the +40 per 100 g steps", () => {
    const p = (w) => postageFor("epacket", w, D);
    expect(p(1).postageTWD).toBe(200);
    expect(p(100).postageTWD).toBe(200);
    expect(p(101).postageTWD).toBe(240);
    expect(p(400).postageTWD).toBe(320);
    expect(p(401).postageTWD).toBe(360);
    expect(p(500).postageTWD).toBe(360);
    expect(p(2000).postageTWD).toBe(960);
    expect(p(2001)).toEqual({ ok: false, reason: "overLimit" });
    expect(p(0)).toEqual({ ok: false, reason: "noWeight" });
  });
  it("Air Parcel brackets and +105 per 500 g steps", () => {
    const p = (w) => postageFor("airParcel", w, D).postageTWD;
    expect(p(220)).toBe(500);
    expect(p(500)).toBe(500);
    expect(p(501)).toBe(605);
    expect(p(1000)).toBe(605);
    expect(p(1001)).toBe(710);
    expect(p(2500)).toBe(605 + 3 * 105);
  });
});

describe("shipping defaults and weight", () => {
  it("nails → envelope + ePacket, bottles → box + air, digital → none, explicit wins", () => {
    expect(shippingFor({ category: "nails" })).toEqual({ digital: false, packaging: "envelope", service: "epacket" });
    expect(shippingFor({ category: "energy-bottles" })).toEqual({ digital: false, packaging: "box", service: "airParcel" });
    expect(shippingFor({ category: "sachets" }).packaging).toBe("envelope");
    expect(shippingFor({ category: "digital-reports", requiresShipping: false }).digital).toBe(true);
    expect(shippingFor({ category: "nails", cost: { shippingType: "box", postageService: "airParcel" } })).toMatchObject({ packaging: "box", service: "airParcel" });
  });
  it("sums bundle component weights", () => {
    const parts = { a: { id: "a", customs: { unitWeightG: 26 } }, b: { id: "b", customs: { unitWeightG: 70 } } };
    const bundle = { id: "x", customs: { bundleComponents: [{ productId: "a", quantity: 2 }, { productId: "b", quantity: 1 }] } };
    expect(unitWeightG(bundle, parts)).toBe(122);
  });
});

describe("productNetProfit", () => {
  const rate = 30;
  const nails = {
    id: "n",
    category: "nails",
    price: 40,
    referralCommission: 2,
    customs: { unitWeightG: 26 },
    cost: { recipe: [{ materialId: "m", quantity: 2 }], laborMinutes: 120, laborTWD: 999, packagingTWD: 999 },
  };

  it("adds up every cost line (hand-checked)", () => {
    const r = productNetProfit(nails, { rate, settings: D, feeConfig: { percent: 4, fixedUSD: 0.5 }, materialCostById: { m: 20 } });
    // material 2×20 + decoration 35 = 75; priceTWD 1200; PayPal (40×4%+0.5)×30 = 63
    // postage: 26+30 = 56 g → 200; duty 40×30×10% + 2×30 + 80 = 260; packaging 30
    // referral 2×30 = 60; labour 2 h × 300 = 600; marketing 400
    expect(r).toMatchObject({ materialTWD: 75, paypalFeeTWD: 63, postageTWD: 200, dutyFeesTWD: 260, packagingTWD: 30, referralTWD: 60, laborTWD: 600, marketingTWD: 400 });
    expect(r.netTWD).toBe(1200 - 75 - 63 - 200 - 260 - 30 - 60 - 600 - 400);
    expect(r.netPct).toBe(Math.round((r.netTWD / 1200) * 1000) / 10);
  });

  it("referral toggle off drops the commission", () => {
    const r = productNetProfit(nails, { rate, settings: normalizeSettings({ includeReferral: false }), materialCostById: { m: 20 } });
    expect(r.referralTWD).toBe(0);
  });

  it("no weight → no postage and no net profit; flags missing labour", () => {
    const r = productNetProfit({ ...nails, customs: {}, cost: {} }, { rate, settings: D, materialCostById: {} });
    expect(r.postageTWD).toBeNull();
    expect(r.netTWD).toBeNull();
    expect(r.warnings).toMatchObject({ noWeight: true, noLabor: true });
  });

  it("digital products have no postage, duty or packaging but still pay marketing", () => {
    const r = productNetProfit({ id: "d", category: "digital-reports", requiresShipping: false, price: 20 }, { rate, settings: D, materialCostById: {} });
    expect(r).toMatchObject({ postageTWD: 0, dutyFeesTWD: 0, packagingTWD: 0, marketingTWD: 400 });
    expect(r.netTWD).not.toBeNull();
  });

  it("falls back to defaults for missing or bad settings", () => {
    expect(normalizeSettings({ hourlyRateTWD: "abc", postage: { epacket: { brackets: [] } } })).toMatchObject({ hourlyRateTWD: 300 });
    expect(normalizeSettings(null).postage.airParcel.brackets).toEqual([[500, 500], [1000, 605]]);
  });
});
