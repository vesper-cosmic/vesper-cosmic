import { describe, expect, it } from "vitest";
import {
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
    phone: "+1 512 555 0100",
    address: { ...app.address, addressLine1: "1 Main St", city: "Austin", stateProvince: "TX", postalCode: "78701" },
    birth: { ...app.birth, birthDate: "1995-04-12", birthTime: "08:30", birthLocation: "Austin, United States", biologicalGender: "Female", daylightSavingTime: "No", intentions: ["Love", "Career"] },
    nails: { ...app.nails, sizeMode: "standard", standardSize: "S", nailShape: "Almond", nailLength: "Medium", stylePreference: "Detailed" },
    social: [{ platform: "TikTok", handle: "@ava", followers: "12,400" }, { platform: "Instagram", handle: "@ava.nails", followers: "3500" }],
    contentTypes: ["Unboxing video"],
    publicDuration: "6 months",
    postTimeline: "Within 14 days of delivery",
    testOrder: "Yes",
    pressOnExperience: "Tried a few times",
    agreements: { adult: true, usResident: true, disclosure: true, honest: true, feedback: true, privacy: true },
  };
}

describe("PR application", () => {
  it("accepts a complete application and cleans it", () => {
    const app = normalizePrApplication(filled());
    expect(validatePrApplication(app)).toEqual({});
    expect(app.email).toBe("ava@example.com");
    expect(app.address.country).toBe("United States");
    expect(totalFollowers(app)).toBe(15900);
  });

  it("requires the agreements, a social account and birth time (or 'unknown')", () => {
    const raw = filled();
    raw.agreements = { ...raw.agreements, disclosure: false, usResident: false };
    raw.social = [{ platform: "", handle: "", followers: "" }];
    raw.birth = { ...raw.birth, birthTime: "" };
    const errors = validatePrApplication(normalizePrApplication(raw));
    expect(errors).toHaveProperty("disclosure");
    expect(errors).toHaveProperty("usResident");
    expect(errors).toHaveProperty("social");
    expect(errors).toHaveProperty("birthTime");

    raw.birth.birthTimeUnknown = true;
    expect(validatePrApplication(normalizePrApplication(raw))).not.toHaveProperty("birthTime");
  });

  it("drops unknown options and caps intentions at three", () => {
    const raw = filled();
    raw.testOrder = "Sure!";
    raw.birth.intentions = ["Love", "Career", "Health", "Wealth", "Nope"];
    raw.usageRights = ["repost", "hack"];
    const app = normalizePrApplication(raw);
    expect(app.testOrder).toBe("");
    expect(app.birth.intentions).toEqual(["Love", "Career", "Health"]);
    expect(app.usageRights).toEqual(["repost"]);
  });

  it("rejects non-US ZIP codes", () => {
    const raw = filled();
    raw.address.postalCode = "10491";
    expect(validatePrApplication(normalizePrApplication(raw))).not.toHaveProperty("postalCode");
    raw.address.postalCode = "SW1A 1AA";
    expect(validatePrApplication(normalizePrApplication(raw))).toHaveProperty("postalCode");
  });

  it("builds PR ids from the Taiwan date", () => {
    expect(prApplicationId(new Date("2026-11-20T17:00:00Z"), () => 0)).toBe("PR-20261121-AAAA");
  });
});
