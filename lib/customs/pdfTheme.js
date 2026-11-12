// Colors and fonts for the customs PDFs.
// Fonts are the PDF standard fonts (Helvetica / Times), which every PDF
// viewer has built in: nothing is downloaded at render time and nothing has
// to be bundled into the serverless function.

export const pdfTheme = {
  // Brand tokens used across the site.
  navy: "#1C2B48",
  slate: "#35506B",
  mist: "#8EB1D1",
  mistLight: "#E8ECEF",
  // Accents (packing slip only — the invoice stays black on white).
  mistBlue: "#A7B8C8",
  mistBlueLight: "#DDE5EC",
  champagne: "#C9B27C",
  champagneLight: "#E8DCC0",
  black: "#000000",
  grey: "#444444",
  rule: "#999999",
  fonts: {
    sans: "Helvetica",
    sansBold: "Helvetica-Bold",
    serif: "Times-Roman",
    serifItalic: "Times-Italic",
    serifBold: "Times-Bold",
  },
};

export const money = (usd) => `$${(Number(usd) || 0).toFixed(2)}`;
export const kg = (grams, digits = 3) => ((Number(grams) || 0) / 1000).toFixed(digits);

export function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
