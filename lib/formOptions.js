export const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Italy",
  "Spain",
  "Other",
];

// Individual fortune areas customers can check off. Customers may select
// up to three to keep their energy focused and avoid scattering it.
export const fortuneAreas = [
  "Health",
  "Career",
  "Love",
  "Wealth",
  "Protection",
  "General Energy",
];

export const baziIntentions = fortuneAreas;

export const digitalCuriosityAreas = fortuneAreas;

export const singleIntentionOptions = fortuneAreas;

export const maxFortuneSelections = 3;

export const fortuneSelectionHint =
  "Check up to three areas to keep your energy focused. Selecting too many can scatter your intention — a focused set of three or fewer helps your energy stay clear and strong.";

export const daylightSavingOptions = ["Yes", "No", "I don't know"];

export const nailShapes = [
  { id: "Square", icon: "square", label: "Square" },
  { id: "Squoval", icon: "squoval", label: "Squoval" },
  { id: "Oval", icon: "oval", label: "Oval" },
  { id: "Almond", icon: "almond", label: "Almond" },
  { id: "Coffin", icon: "coffin", label: "Coffin" },
];

export const nailLengths = ["Short", "Medium", "Long"];

export const stylePreferences = ["Minimalist", "Detailed", "Maximalist"];

export const nailSizeKeys = [
  ["leftThumb", "Thumb"],
  ["leftIndex", "Index"],
  ["leftMiddle", "Middle"],
  ["leftRing", "Ring"],
  ["leftPinky", "Pinky"],
  ["rightThumb", "Thumb"],
  ["rightIndex", "Index"],
  ["rightMiddle", "Middle"],
  ["rightRing", "Ring"],
  ["rightPinky", "Pinky"],
];

export function emptyAddress() {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "United States",
  };
}

export function emptyNailMeasurements() {
  return Object.fromEntries(nailSizeKeys.map(([key]) => [key, ""]));
}

// Standard press-on nail sizes. Widths in mm, thumb → pinky (one hand).
export const standardNailSizes = ["XS", "S", "M", "L"];
export const nailSizeChart = {
  XS: [14, 10, 11, 10, 7],
  S: [15, 11, 12, 11, 8],
  M: [16, 12, 13, 12, 9],
  L: [18, 13, 14, 13, 10],
};
export const nailSizeFingers = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

export function describeNailSize(size) {
  const widths = nailSizeChart[size];
  return widths ? `${size} (${widths.join(" / ")} mm, thumb → pinky)` : size || "";
}

// Category for ready-made press-on nails sold in one fixed size.
export const READY_MADE_NAILS_CATEGORY = "ready-made-nails";

/**
 * Human-readable nail sizing for orders and emails.
 * nails: { sizeMode: "standard" | "custom", standardSize, measurements, mixedSet }
 */
export function formatNailSizing(nails = {}) {
  if (nails.mixedSet) return "Mixed Set (sizes 10–18mm)";
  if (nails.sizeMode === "standard") return `Standard size ${describeNailSize(nails.standardSize)}`;
  const entries = Object.entries(nails.measurements || {}).filter(([, value]) => String(value).trim());
  if (!entries.length) return "";
  const label = Object.fromEntries(nailSizeKeys.map(([key, name]) => [key, name]));
  return `Custom widths (mm): ${entries
    .map(([key, value]) => `${key.startsWith("left") ? "L" : "R"}-${label[key] || key} ${value}`)
    .join(", ")}`;
}

/** Errors for the nail size choice (standard size or own measurements). */
export function validateNailSizing(nails = {}) {
  const errors = {};
  if (nails.mixedSet) return errors; // older orders
  if (nails.sizeMode === "standard") {
    if (!standardNailSizes.includes(nails.standardSize)) {
      errors.standardSize = "Choose a size: XS, S, M or L.";
    }
  } else if (nails.sizeMode === "custom") {
    nailSizeKeys.forEach(([key, label]) => {
      if (!String(nails.measurements?.[key] || "").trim()) {
        errors[key] = `${label} width is required.`;
      }
    });
  } else {
    errors.sizeMode = "Choose a standard size or enter your own nail widths.";
  }
  return errors;
}
