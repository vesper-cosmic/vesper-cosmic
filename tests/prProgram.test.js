import { describe, expect, it } from "vitest";
import {
  PR_AGREEMENTS,
  emptyPrApplication,
  normalizePrApplication,
  prApplicationId,
  totalFollowers,
  validatePrApplication,
} from "@/lib/prProgram";

function filled() {
  const app = emptyPrApplication();
  return {
    ...app,
    firstName: "Ava",
    lastName: "Lee",
    email: "AVA@example.com ",
    city: "Austin",
    state: "tx",
    social: [{ platform: "TikTok", handle: "@ava", followers: "12,400" }, { platform: "Instagram", handle: "@ava.nails", followers: "3500" }],
    contentTypes: ["Unboxing video"],
    publicDuration: "6 months",
    postTimeline: "Within 14 days of delivery",
    pressOnExperience: "Tried a few times",
    agreements: Object.fromEntries(PR_AGREEMENTS.map((k) => [k, true])),
  };
}

describe("PR application", () => {
  it("accepts a complete application and cleans it", () => {
    const app = normalizePrApplication(filled());
    expect(validatePrApplication(app)).toEqual({});
    expect(app.email).toBe("ava@example.com");
    expect(app.state).toBe("TX");
    expect(totalFollowers(app)).toBe(15900);
  });

  it("does not keep order details (they are entered at checkout)", () => {
    const raw = { ...filled(), birth: { birthDate: "1995-04-12" }, phone: "+1 512 555 0100", address: { addressLine1: "1 Main St" } };
    const app = normalizePrApplication(raw);
    expect(app).not.toHaveProperty("birth");
    expect(app).not.toHaveProperty("phone");
    expect(app).not.toHaveProperty("address");
  });

  it("requires the test order, disclosure and a social account", () => {
    const raw = filled();
    raw.agreements = { ...raw.agreements, testOrder: false, disclosure: false };
    raw.social = [{ platform: "", handle: "", followers: "" }];
    const errors = validatePrApplication(normalizePrApplication(raw));
    expect(errors).toHaveProperty("testOrder");
    expect(errors).toHaveProperty("disclosure");
    expect(errors).toHaveProperty("social");
  });

  it("drops unknown options and states", () => {
    const raw = filled();
    raw.state = "ZZ";
    raw.usageRights = ["repost", "hack"];
    const app = normalizePrApplication(raw);
    expect(app.state).toBe("");
    expect(app.usageRights).toEqual(["repost"]);
    expect(validatePrApplication(app)).toHaveProperty("state");
  });

  it("builds PR ids from the Taiwan date", () => {
    expect(prApplicationId(new Date("2026-11-20T17:00:00Z"), () => 0)).toBe("PR-20261121-AAAA");
  });
});
