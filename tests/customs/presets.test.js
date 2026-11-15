import { describe, expect, it } from "vitest";
import {
  CUSTOMS_PRESETS,
  applyPreset,
  findPreset,
  planBulkApply,
  presetWarnings,
  resolvePresets,
  suggestPresetId,
} from "@/lib/customs/presets";
import { CUSTOMS_DESCRIPTION_MAX, findBlocklistedWords } from "@/lib/customs/keywords";
import { isValidHtsus } from "@/lib/customs/htsus";

const presets = resolvePresets();
const nails = findPreset(presets, "press-on-nails");

describe("code presets", () => {
  it("have valid descriptions and HTSUS codes", () => {
    for (const p of CUSTOMS_PRESETS.filter((x) => x.isPhysical && x.htsus)) {
      expect(isValidHtsus(p.htsus)).toBe(true);
      expect(p.customsDescription.length).toBeLessThanOrEqual(CUSTOMS_DESCRIPTION_MAX);
      expect(findBlocklistedWords(p.customsDescription)).toEqual([]);
    }
  });
});

describe("suggestPresetId", () => {
  it("maps categories to presets", () => {
    expect(suggestPresetId("ready-made-nails")).toBe("press-on-nails");
    expect(suggestPresetId("custom-energy-bottles")).toBe("energy-bottle");
    expect(suggestPresetId("sachets-ready")).toBe("crystal-sachet");
    expect(suggestPresetId("custom-diy-sachet-kits")).toBe("diy-kit");
    expect(suggestPresetId("digital-reports")).toBe("digital");
    expect(suggestPresetId("bundles")).toBe("");
  });
});

describe("applyPreset", () => {
  it("fills empty fields and keeps a null weight empty", () => {
    const { next, changes, conflicts } = applyPreset({}, nails);
    expect(next.htsus).toBe("3926400090");
    expect(next.description).toMatch(/press-on/);
    expect(next.unitWeightG).toBeNull();
    expect(next.preset).toBe("press-on-nails");
    expect(changes.every((c) => c.action === "fill")).toBe(true);
    expect(conflicts).toEqual([]);
  });

  it("does not overwrite existing values unless asked", () => {
    const customs = { description: "My own", htsus: "1111111111", unitWeightG: 50 };
    const keep = applyPreset(customs, nails);
    expect(keep.next.description).toBe("My own");
    expect(keep.next.htsus).toBe("1111111111");
    expect(keep.conflicts.map((c) => c.field).sort()).toEqual(["description", "htsus"]);

    const over = applyPreset(customs, nails, { overwrite: true });
    expect(over.next.htsus).toBe("3926400090");
    expect(over.next.unitWeightG).toBe(50); // preset has no weight: never clears
    expect(over.changes.every((c) => c.action === "overwrite" || c.action === "fill")).toBe(true);
  });

  it("uses an edited weight from overrides", () => {
    const edited = findPreset(resolvePresets({ "press-on-nails": { unitWeightG: 42 } }), "press-on-nails");
    expect(applyPreset({}, edited).next.unitWeightG).toBe(42);
  });

  it("does nothing for the digital preset", () => {
    const digital = findPreset(presets, "digital");
    const result = applyPreset({ description: "x" }, digital);
    expect(result.changes).toEqual([]);
  });
});

describe("resolvePresets", () => {
  it("ignores unknown ids and blank overrides", () => {
    const out = resolvePresets({ nope: { htsus: "1" }, "energy-bottle": { htsus: "", unitWeightG: "" } });
    expect(findPreset(out, "energy-bottle").htsus).toBe("7013999090");
    expect(out).toHaveLength(CUSTOMS_PRESETS.length);
  });

  it("ships the diy kit and sachet with provisional codes, no longer unclassified", () => {
    expect(findPreset(presets, "diy-kit").htsus).toBe("7103995000");
    expect(findPreset(presets, "diy-kit").needsClassification).toBeFalsy();
    expect(findPreset(presets, "crystal-sachet").htsus).toBe("7103995000");
  });
});

describe("presetWarnings", () => {
  const diy = { ...findPreset(presets, "diy-kit"), needsClassification: true }; // a preset still awaiting a code
  it("flags diy kits as needing classification and missing weight", () => {
    expect(presetWarnings({ customs: {}, preset: diy })).toEqual({ needsClassification: true, weightMissing: true });
  });
  it("is quiet for digital products", () => {
    expect(presetWarnings({ customs: {}, preset: diy, physical: false })).toEqual({
      needsClassification: false,
      weightMissing: false,
    });
  });
  it("only warns about weight once classified", () => {
    const w = presetWarnings({ customs: { htsus: "6307909891", description: "x", unitWeightG: 30 }, preset: diy });
    expect(w).toEqual({ needsClassification: false, weightMissing: false });
  });
});

describe("planBulkApply", () => {
  const products = [
    { id: "a", name: "A", category: "ready-made-nails", customs: {} },
    { id: "b", name: "B", category: "energy-bottles", customs: { description: "Own text", htsus: "7013999090" } },
    { id: "c", name: "C", category: "digital-reports", requiresShipping: false, customs: {} },
    { id: "d", name: "D", category: "bundles", customs: {} },
    { id: "e", name: "E", category: "nails", customs: { preset: "press-on-nails", origin: "Taiwan", htsus: "3926400090", description: nails.customsDescription } },
  ];

  it("suggests by category and never overwrites by default", () => {
    const rows = Object.fromEntries(planBulkApply(products, presets).map((r) => [r.product.id, r]));
    expect(rows.a.next.htsus).toBe("3926400090");
    expect(rows.b.next.description).toBe("Own text");
    expect(rows.b.conflicts.map((c) => c.field)).toContain("description");
    expect(rows.c.skipped).toMatch(/數位/);
    expect(rows.d.skipped).toMatch(/沒有對應/);
    expect(rows.e.skipped).toBe("已是最新");
  });

  it("overwrites only when ticked", () => {
    const rows = Object.fromEntries(planBulkApply(products, presets, { overwrite: true }).map((r) => [r.product.id, r]));
    expect(rows.b.next.description).toMatch(/Decorative glass bottle/);
  });

  it("sync mode only touches products using that preset", () => {
    const rows = planBulkApply(products, presets, { mode: "sync", presetId: "press-on-nails" });
    expect(rows.map((r) => r.product.id)).toEqual(["e"]);
  });
});
