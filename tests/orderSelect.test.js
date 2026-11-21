import { describe, expect, it } from "vitest";
import { notionOrderProperties } from "@/lib/orderServer";

const base = { orderId: "VC-1", createdAt: "2026-11-21T00:00:00.000Z", fullName: "A B", email: "a@b.com", productName: "Custom BaZi Crystal Press-On Nails", price: 128, address: {} };

describe("notionOrderProperties select values", () => {
  it("multiple intentions never put a comma in the select option", () => {
    const p = notionOrderProperties({ ...base, baziIntentions: ["Love", "Wealth", "Career"] }, "名稱");
    expect(p.客人意圖.select.name).toBe("Love / Wealth / Career");
    expect(p.客人意圖.select.name).not.toContain(",");
  });

  it("a single intention is unchanged", () => {
    expect(notionOrderProperties({ ...base, baziIntentions: ["Love"] }, "名稱").客人意圖.select.name).toBe("Love");
  });

  it("no intention → no column written", () => {
    expect(notionOrderProperties(base, "名稱").客人意圖).toBeUndefined();
  });
});
