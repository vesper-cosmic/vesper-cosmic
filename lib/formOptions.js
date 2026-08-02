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
