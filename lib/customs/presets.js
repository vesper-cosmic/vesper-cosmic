// Customs presets: one-click defaults for a product's 海關資料. Pure, no I/O.
//
// HTSUS codes below are UNVERIFIED SUGGESTIONS — confirm each one at
// https://hts.usitc.gov before relying on it for a real shipment.
//
// Code presets are the fallback defaults. The admin can override description,
// htsus, unitWeightG and fragile per preset from /admin/settings/customs-presets
// (stored in the Notion "Customs Presets" database); `resolvePresets` merges
// the two.

/**
 * @typedef {Object} CustomsPreset
 * @property {string} id
 * @property {string} label
 * @property {string} customsDescription
 * @property {string} htsus                10 digits, no dots ("" = not classified yet)
 * @property {number|null} unitWeightG     null = not weighed yet
 * @property {string} origin
 * @property {boolean} isPhysical
 * @property {boolean} [fragile]
 * @property {boolean} [needsClassification]
 */

/** @type {CustomsPreset[]} */
export const CUSTOMS_PRESETS = [
  {
    id: "press-on-nails",
    label: "穿戴甲 Press-on nails",
    customsDescription: "Plastic press-on artificial nails set w/ stone chips; nail file, wood stick, adhesive tabs",
    htsus: "3926400090", // unverified suggestion — confirm at hts.usitc.gov
    unitWeightG: 26,
    origin: "Taiwan",
    isPhysical: true,
  },
  {
    id: "energy-bottle",
    label: "能量瓶 Energy bottle",
    customsDescription: "Decorative glass bottle with tumbled natural stone chips, cork, wax seal",
    htsus: "7013999090", // unverified suggestion — confirm at hts.usitc.gov
    unitWeightG: 70,
    origin: "Taiwan",
    isPhysical: true,
    fragile: true,
  },
  {
    id: "crystal-sachet",
    label: "水晶香包 Crystal sachet",
    customsDescription: "Fabric sachet containing tumbled natural stone chips",
    htsus: "7103995000", // provisional (暫定) — confirm at hts.usitc.gov
    unitWeightG: null,
    origin: "Taiwan",
    isPhysical: true,
  },
  {
    id: "diy-kit",
    label: "DIY 水晶組 DIY kit",
    customsDescription: "DIY kit: fabric pouch, tumbled natural stone chips, accessories",
    htsus: "7103995000", // provisional (暫定) — confirm at hts.usitc.gov
    unitWeightG: null,
    origin: "Taiwan",
    isPhysical: true,
  },
  {
    id: "digital",
    label: "數位商品 Digital (not shipped)",
    customsDescription: "",
    htsus: "",
    unitWeightG: null,
    origin: "Taiwan",
    isPhysical: false,
  },
];

/** The preset fields an admin may override from the settings page. */
export const OVERRIDABLE_FIELDS = ["customsDescription", "htsus", "unitWeightG", "fragile"];

/** Product category id → suggested preset id. Shown as a hint, never auto-applied. */
export const CATEGORY_PRESET = {
  nails: "press-on-nails",
  "ready-made-nails": "press-on-nails",
  "custom-nails": "press-on-nails",
  "energy-bottles": "energy-bottle",
  "custom-energy-bottles": "energy-bottle",
  "sachets-ready": "crystal-sachet",
  sachets: "crystal-sachet",
  "custom-diy-sachet-kits": "diy-kit",
  "digital-reports": "digital",
};

export function suggestPresetId(category) {
  return CATEGORY_PRESET[category] || "";
}

const cleanHtsus = (value) => String(value || "").replace(/[\s.]/g, "");
const cleanWeight = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Merge admin overrides (`{ [presetId]: { customsDescription?, htsus?, unitWeightG?, fragile? } }`)
 * over the code presets. Unknown preset ids are ignored; blank override
 * values fall back to the code default.
 * @returns {CustomsPreset[]}
 */
export function resolvePresets(overrides = {}) {
  return CUSTOMS_PRESETS.map((preset) => {
    const o = overrides?.[preset.id];
    if (!o || !preset.isPhysical) return { ...preset };
    const next = { ...preset };
    if (typeof o.customsDescription === "string" && o.customsDescription.trim()) {
      next.customsDescription = o.customsDescription.trim();
    }
    if (cleanHtsus(o.htsus)) next.htsus = cleanHtsus(o.htsus);
    if (cleanWeight(o.unitWeightG)) next.unitWeightG = cleanWeight(o.unitWeightG);
    if (typeof o.fragile === "boolean") next.fragile = o.fragile;
    // Once an HTSUS and description exist the kit no longer needs classification.
    if (next.needsClassification && next.htsus && next.customsDescription) {
      next.needsClassification = false;
    }
    return next;
  });
}

export function findPreset(presets, id) {
  return (presets || []).find((preset) => preset.id === id) || null;
}

const isEmpty = (value) => value === "" || value === null || value === undefined;

/**
 * What applying `preset` to a product's customs data would change.
 *
 * `customs`: { description, htsus, unitWeightG, origin, preset }
 * - Empty fields are always filled from the preset.
 * - Non-empty fields that differ are only replaced when `overwrite` is true;
 *   otherwise they are reported as `conflicts`.
 * - Preset values that are blank/null (e.g. a weight not entered yet) never
 *   clear what the product already has.
 *
 * @returns {{ next: object, changes: Array<{field:string, from:any, to:any, action:"fill"|"overwrite"}>, conflicts: Array<{field:string, from:any, to:any}> }}
 */
export function applyPreset(customs = {}, preset, { overwrite = false } = {}) {
  const current = {
    description: customs.description ?? "",
    htsus: cleanHtsus(customs.htsus),
    unitWeightG: customs.unitWeightG ?? null,
    origin: customs.origin || "",
    preset: customs.preset || "",
  };
  const next = { ...customs, ...current };
  const changes = [];
  const conflicts = [];
  if (!preset || !preset.isPhysical) {
    return { next, changes, conflicts };
  }

  const wanted = {
    description: preset.customsDescription,
    htsus: preset.htsus,
    unitWeightG: preset.unitWeightG,
    origin: preset.origin,
  };
  for (const [field, to] of Object.entries(wanted)) {
    if (isEmpty(to)) continue;
    const from = current[field];
    if (isEmpty(from)) {
      next[field] = to;
      changes.push({ field, from, to, action: "fill" });
    } else if (String(from) !== String(to)) {
      if (overwrite) {
        next[field] = to;
        changes.push({ field, from, to, action: "overwrite" });
      } else {
        conflicts.push({ field, from, to });
      }
    }
  }
  next.preset = preset.id;
  return { next, changes, conflicts };
}

/**
 * Warnings for the product form. `physical` = the product ships.
 * @returns {{ needsClassification: boolean, weightMissing: boolean }}
 */
export function presetWarnings({ customs = {}, preset = null, physical = true }) {
  if (!physical) return { needsClassification: false, weightMissing: false };
  const unclassified = !cleanHtsus(customs.htsus) || !String(customs.description || "").trim();
  return {
    needsClassification: Boolean(preset?.needsClassification) && unclassified,
    weightMissing: !(Number(customs.unitWeightG) > 0),
  };
}

/**
 * Bulk plan: one row per product, for the preview table.
 *
 * mode "apply": every physical product gets `customs.preset` or, failing that,
 *               the category's suggested preset.
 * mode "sync":  only products whose `customs.preset` is `presetId`.
 *
 * A row's `skipped` is set (with a reason) when nothing can be applied.
 * Products that are digital (requiresShipping === false) are never changed here.
 *
 * @returns {Array<{ product: object, presetId: string, current: object, next: object, changes: Array, conflicts: Array, skipped: string }>}
 */
export function planBulkApply(products, presets, { mode = "apply", presetId = "", overwrite = false } = {}) {
  const rows = [];
  for (const product of products || []) {
    const customs = product.customs || {};
    if (mode === "sync" && customs.preset !== presetId) continue;

    const id = customs.preset || suggestPresetId(product.category);
    const preset = findPreset(presets, id);
    const base = { product, presetId: id, current: customs, next: customs, changes: [], conflicts: [], skipped: "" };

    if (product.requiresShipping === false) {
      rows.push({ ...base, skipped: "數位商品，不需海關資料" });
    } else if (!preset) {
      rows.push({ ...base, skipped: "沒有對應的預設" });
    } else if (!preset.isPhysical) {
      rows.push({ ...base, skipped: "此預設為數位商品，請在商品中改為不需寄送" });
    } else {
      const result = applyPreset(customs, preset, { overwrite });
      const skipped =
        result.changes.length === 0 && customs.preset === preset.id
          ? result.conflicts.length
            ? "有不同的現有值（未勾選覆蓋）"
            : "已是最新"
          : "";
      rows.push({ ...base, ...result, skipped });
    }
  }
  return rows;
}
