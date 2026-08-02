export const products = [
  // ── Crystal Press-On Nails — Ready to Ship ──
  {
    id: "crystal-press-on-nails-ready",
    slug: "crystal-press-on-nails-ready",
    name: "Crystal Press-On Nails",
    category: "nails",
    categoryLabel: "Nails",
    productKind: "Crystal Press-On Nails — Ready to Ship",
    formType: "B",
    price: 88,
    originalPrice: null,
    currency: "USD",
    description:
      "Ready-to-ship press-on nails infused with crystal energy. Each set is crafted around a single intention and comes in your selected size, shape, and length.",
    fulfillmentTime: "Ships within 3–5 business days",
    fulfillmentMode: "Ready to Ship",
    intentionType: "single",
    availableIntentions: ["Health", "Career", "Love", "Wealth", "Protection", "General Energy"],
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: true,
    nailIntro:
      "These press-on nails are crafted around your BaZi element and intentions. Provide your nail measurements below and I will custom-fit them to your hands.",
    includes: "10 press-on nails, nail glue, cuticle stick, mini file, energy cleansing card",
    badge: "Ready to Ship",
    images: [
      "/images/celestial-nails-1.svg",
      "/images/celestial-nails-2.svg",
      "/images/celestial-nails-3.svg",
    ],
  },

  // ── Crystal Press-On Nails — Custom BaZi ──
  {
    id: "crystal-press-on-nails-custom",
    slug: "crystal-press-on-nails-custom",
    name: "Custom BaZi Crystal Press-On Nails",
    category: "custom-nails",
    categoryLabel: "Nails",
    productKind: "Custom BaZi Crystal Press-On Nails",
    formType: "B",
    price: 128,
    originalPrice: null,
    currency: "USD",
    description:
      "Fully custom press-on nails designed from your BaZi chart. Every color, crystal placement, and symbol is chosen to align with your natal elements.",
    fulfillmentTime: "Made to order — ships within 7–10 business days",
    fulfillmentMode: "Made to Order",
    intentionType: "bazi",
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: true,
    nailIntro:
      "These custom nails are designed exclusively from your BaZi birth chart. Each nail is sized to your measurements for a perfect fit.",
    badge: "Custom",
    images: [
      "/images/celestial-nails-1.svg",
      "/images/celestial-nails-2.svg",
      "/images/celestial-nails-3.svg",
    ],
  },

  // ── Crystal Energy Bottle — Ready to Ship ──
  {
    id: "crystal-energy-bottle-ready",
    slug: "crystal-energy-bottle-ready",
    name: "Crystal Energy Bottle",
    category: "energy-bottles",
    categoryLabel: "Energy Bottles",
    productKind: "Crystal Energy Bottle — Ready to Ship",
    formType: "A",
    price: 48,
    originalPrice: null,
    currency: "USD",
    description:
      "A ready-to-ship crystal energy bottle charged with a single intention. Carried in your bag or placed on your altar for daily energetic support.",
    fulfillmentTime: "Ships within 2–3 business days",
    fulfillmentMode: "Ready to Ship",
    intentionType: "single",
    availableIntentions: ["Health", "Career", "Love", "Wealth", "Protection", "General Energy"],
    requiresBirthData: false,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "Ready to Ship",
    images: [
      "/images/spell-jar-1.svg",
      "/images/spell-jar-2.svg",
      "/images/spell-jar-3.svg",
    ],
  },

  // ── Crystal Energy Bottle — Custom BaZi ──
  {
    id: "crystal-energy-bottle-custom",
    slug: "crystal-energy-bottle-custom",
    name: "BaZi Crystal Energy Bottle",
    category: "custom-energy-bottles",
    categoryLabel: "Energy Bottles",
    productKind: "BaZi Crystal Energy Bottle — Custom",
    formType: "B",
    price: 78,
    originalPrice: null,
    currency: "USD",
    description:
      "A custom crystal energy bottle formulated from your BaZi chart. Each crystal is selected to balance your elemental makeup and support your intention.",
    fulfillmentTime: "Made to order — ships within 5–7 business days",
    fulfillmentMode: "Made to Order",
    intentionType: "bazi",
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "Custom",
    images: [
      "/images/spell-jar-1.svg",
      "/images/spell-jar-2.svg",
      "/images/spell-jar-3.svg",
    ],
  },

  // ── Crystal Sachet — Ready to Use ──
  {
    id: "crystal-sachet-ready",
    slug: "crystal-sachet-ready",
    name: "Crystal Sachet",
    category: "sachets-ready",
    categoryLabel: "Ready-to-Use Sachet",
    productKind: "Crystal Sachet — Ready to Use",
    formType: "A",
    price: 28,
    originalPrice: null,
    currency: "USD",
    description:
      "A ready-to-use crystal sachet charged with a single intention. Carry it in your pocket, purse, or place it under your pillow for gentle energetic alignment.",
    fulfillmentTime: "Ships within 2–3 business days",
    fulfillmentMode: "Ready to Ship",
    intentionType: "single",
    availableIntentions: ["Health", "Career", "Love", "Wealth", "Protection", "General Energy"],
    requiresBirthData: false,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "Ready to Ship",
    images: [
      "/images/bazi-spell-bag-1.svg",
      "/images/bazi-spell-bag-2.svg",
      "/images/bazi-spell-bag-3.svg",
    ],
  },

  // ── DIY BaZi Crystal Sachet Kit ──
  {
    id: "diy-bazi-crystal-sachet-kit",
    slug: "diy-bazi-crystal-sachet-kit",
    name: "DIY BaZi Crystal Sachet Kit",
    category: "custom-diy-sachet-kits",
    categoryLabel: "DIY Sachet Kits",
    productKind: "DIY BaZi Crystal Sachet Kit",
    formType: "B",
    price: 58,
    originalPrice: null,
    currency: "USD",
    description:
      "A DIY kit with raw crystals selected from your BaZi chart, plus a pouch and instructions. You assemble and charge the sachet yourself for a hands-on energy practice.",
    fulfillmentTime: "Ships within 3–5 business days",
    fulfillmentMode: "Made to Order",
    intentionType: "bazi",
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "DIY Kit",
    images: [
      "/images/bazi-spell-bag-1.svg",
      "/images/bazi-spell-bag-2.svg",
      "/images/bazi-spell-bag-3.svg",
    ],
  },

  // ── Eastern Astrology Report ──
  {
    id: "eastern-astrology-report",
    slug: "eastern-astrology-report",
    name: "Eastern Astrology Report",
    category: "digital-reports",
    categoryLabel: "Digital Reports",
    productKind: "Eastern Astrology Report",
    formType: "C",
    price: 68,
    originalPrice: null,
    currency: "USD",
    description:
      "A detailed PDF report based on your BaZi (Four Pillars of Destiny) chart. Covers your life path, element composition, and key cycles with personalized guidance.",
    fulfillmentTime: "Delivered via email within 3–5 business days",
    fulfillmentMode: "Digital Delivery",
    intentionType: "bazi",
    requiresBirthData: true,
    requiresShipping: false,
    requiresNailDetails: false,
    badge: "Digital",
    images: [
      "/images/cosmic-blueprint-1.svg",
      "/images/cosmic-blueprint-2.svg",
      "/images/cosmic-blueprint-3.svg",
    ],
  },

  // ── The Complete BaZi Energy Set ──
  {
    id: "complete-bazi-energy-set",
    slug: "complete-bazi-energy-set",
    name: "The Complete BaZi Energy Set",
    category: "bundles",
    categoryLabel: "Bundles",
    productKind: "The Complete BaZi Energy Set",
    formType: "D",
    price: 198,
    originalPrice: 238,
    currency: "USD",
    description:
      "The full Vesper Cosmos experience: a BaZi crystal energy bottle, a crystal sachet, a press-on nail set, and your Eastern Astrology Report — all aligned to your birth chart.",
    fulfillmentTime: "Ships within 7–10 business days (report delivered via email)",
    fulfillmentMode: "Bundle",
    intentionType: "bazi",
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: true,
    nailIntro:
      "Your Complete BaZi Energy Set includes a custom press-on nail set. Please provide your nail measurements for a perfect fit.",
    badge: "Best Value",
    images: [
      "/images/cosmic-blueprint-1.svg",
      "/images/cosmic-blueprint-2.svg",
      "/images/cosmic-blueprint-3.svg",
    ],
  },
];

// Category tree — items without `children` are single-level categories,
// items with `children` are parent categories with sub-categories.
export const productCategories = [
  { id: "nails", title: "Nails", categoryId: "nails" },
  { id: "energy-bottles", title: "Energy Bottles", categoryId: "energy-bottles" },
  {
    id: "sachets",
    title: "Sachets",
    children: [
      { id: "sachets-diy", title: "DIY Sachet Kits", categoryId: null },
      { id: "sachets-ready", title: "Ready-to-Use Sachet", categoryId: "sachets-ready" },
    ],
  },
  { id: "digital-reports", title: "Digital Reports", categoryId: "digital-reports" },
  {
    id: "custom",
    title: "Custom",
    children: [
      { id: "custom-nails", title: "Nails", categoryId: "custom-nails" },
      { id: "custom-energy-bottles", title: "Energy Bottles", categoryId: "custom-energy-bottles" },
      { id: "custom-diy-sachet-kits", title: "DIY Sachet Kits", categoryId: "custom-diy-sachet-kits" },
    ],
  },
  { id: "bundles", title: "Bundles", categoryId: "bundles" },
];

export const singleIntentionOptions = [
  "Health",
  "Career",
  "Love",
  "Wealth",
  "Protection",
  "General Energy",
];

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug) || null;
}

export function getProductById(id) {
  return products.find((product) => product.id === id) || null;
}