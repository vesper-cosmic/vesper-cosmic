// Words that don't belong in a customs description: customs officers need
// factual material / product terms, not marketing or metaphysical claims.
export const CUSTOMS_BLOCKLIST = [
  "energy",
  "spell",
  "magic",
  "healing",
  "protection",
  "luck",
  "blessed",
  "charged",
  "ritual",
  "manifest",
  "chakra",
  "aura",
];

export const CUSTOMS_DESCRIPTION_MAX = 100;

/** Blocklisted words found in the text (case-insensitive, whole words). */
export function findBlocklistedWords(text) {
  const lower = String(text || "").toLowerCase();
  return CUSTOMS_BLOCKLIST.filter((word) => new RegExp(`\\b${word}`, "i").test(lower));
}

/**
 * Suggested starting values per category. UNVERIFIED — confirm every code
 * at https://hts.usitc.gov before relying on it.
 */
export const CUSTOMS_SUGGESTIONS = {
  nails: { htsus: "3926400000", description: "Plastic press-on artificial nails set" },
  "ready-made-nails": { htsus: "3926400000", description: "Plastic press-on artificial nails set" },
  "custom-nails": { htsus: "3926400000", description: "Plastic press-on artificial nails set" },
  "energy-bottles": { htsus: "7013999090", description: "Decorative glass bottle with stone chips" },
  "custom-energy-bottles": { htsus: "7013999090", description: "Decorative glass bottle with stone chips" },
  "sachets-ready": { htsus: "6307909891", description: "Fabric pouch with decorative stones" },
  sachets: { htsus: "6307909891", description: "Fabric pouch with decorative stones" },
  "custom-diy-sachet-kits": { htsus: "", description: "", note: "Needs classification" },
};
