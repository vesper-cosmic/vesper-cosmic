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

export const baziIntentions = [
  "Career & Wealth",
  "Love & Relationships",
  "Protection & Clarity",
  "General Energy Alignment",
];

export const digitalCuriosityAreas = [
  "Career & Wealth",
  "Love & Relationships",
  "General Life Guidance",
  "Health & Energy",
];

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
