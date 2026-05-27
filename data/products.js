export const PAYPAL_ME_USERNAME = process.env.PAYPAL_ME || "VesperCosmic";

export const productSections = [
  {
    id: "ready-to-ship",
    title: "Ready to Ship",
    description: "Finished pieces that only need your shipping details.",
  },
  {
    id: "custom-bazi",
    title: "Custom BaZi",
    description: "Personalized pieces guided by birth data and intentions.",
  },
  {
    id: "digital-bundles",
    title: "Digital & Bundles",
    description: "Reports and complete energy sets for deeper guidance.",
  },
];

export const products = [
  {
    id: "crystal-energy-bottle-ready",
    slug: "crystal-energy-bottle-ready",
    name: "Crystal Energy Bottle — Ready to Ship",
    section: "ready-to-ship",
    formType: "A",
    productKind: "Physical",
    price: 45,
    currency: "USD",
    description:
      "A handcrafted crystal energy bottle with curated stones for general protection, clarity, and abundance. Sealed with wax and presented in a black floating display box.",
    fulfillmentTime: "Ships within 3–5 business days",
    images: [
      "/images/spell-jar-1.svg",
      "/images/spell-jar-2.svg",
      "/images/spell-jar-3.svg",
    ],
    requiresBirthData: false,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: null,
  },
  {
    id: "crystal-press-on-nails-ready",
    slug: "press-on-nails-ready",
    name: "Crystal Press-On Nails — Ready to Ship",
    section: "ready-to-ship",
    formType: "A",
    productKind: "Physical",
    price: 38,
    currency: "USD",
    description:
      "Handmade press-on nails with crystal and mystic design. One size fits most, includes nail glue and prep pad.",
    fulfillmentTime: "Ships within 3–5 business days",
    images: [
      "/images/celestial-nails-1.svg",
      "/images/celestial-nails-2.svg",
      "/images/celestial-nails-3.svg",
    ],
    requiresBirthData: false,
    requiresShipping: true,
    requiresNailDetails: true,
    nailIntro:
      "This is a ready-made design. Share your size and style preferences and I'll match you with the best option from current stock.",
    badge: null,
  },
  {
    id: "bazi-crystal-energy-bottle-custom",
    slug: "crystal-energy-bottle-custom",
    name: "BaZi Crystal Energy Bottle — Custom",
    section: "custom-bazi",
    formType: "B",
    productKind: "Physical",
    price: 65,
    currency: "USD",
    description:
      "A crystal energy bottle made specifically for your BaZi chart and personal intentions. Every stone, symbol, and seal is chosen based on your unique energy blueprint.",
    fulfillmentTime: "Ships within 7–14 business days",
    images: [
      "/images/spell-jar-1.svg",
      "/images/spell-jar-2.svg",
      "/images/spell-jar-3.svg",
    ],
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "Most Popular",
  },
  {
    id: "custom-bazi-crystal-press-on-nails",
    slug: "press-on-nails-custom",
    name: "Custom BaZi Crystal Press-On Nails",
    section: "custom-bazi",
    formType: "B",
    productKind: "Physical",
    price: 58,
    currency: "USD",
    description:
      "Handmade press-on nails designed around your BaZi element, dominant energy, and intentions. Each set is completely one-of-a-kind.",
    fulfillmentTime: "Ships within 7–14 business days",
    images: [
      "/images/celestial-nails-1.svg",
      "/images/celestial-nails-2.svg",
      "/images/celestial-nails-3.svg",
    ],
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: true,
    nailIntro:
      "Your nails will be designed specifically for your BaZi element and intentions. No two sets are ever the same.",
    badge: "Most Popular",
  },
  {
    id: "eastern-astrology-report",
    slug: "astrology-report",
    name: "Eastern Astrology Report",
    section: "digital-bundles",
    formType: "C",
    productKind: "Digital",
    price: 55,
    currency: "USD",
    description:
      "A deeply personalized PDF report based on your BaZi and Zi Wei Dou Shu chart. Covers personality, wealth timing, career path, relationships, and 2026–2027 forecast.",
    fulfillmentTime: "Delivered to your inbox within 3–5 business days",
    images: [
      "/images/cosmic-blueprint-1.svg",
      "/images/cosmic-blueprint-2.svg",
      "/images/cosmic-blueprint-3.svg",
    ],
    requiresBirthData: true,
    requiresShipping: false,
    requiresNailDetails: false,
    badge: null,
  },
  {
    id: "diy-bazi-crystal-sachet-kit",
    slug: "crystal-sachet-kit",
    name: "DIY BaZi Crystal Sachet Kit",
    section: "digital-bundles",
    formType: "B",
    productKind: "Physical",
    price: 38,
    currency: "USD",
    description:
      "A curated set of crystal chips selected for your BaZi element, with a velvet pouch and handwritten intention card. Assemble your own energy talisman at home.",
    fulfillmentTime: "Ships within 3–7 business days",
    images: [
      "/images/bazi-spell-bag-1.svg",
      "/images/bazi-spell-bag-2.svg",
      "/images/bazi-spell-bag-3.svg",
    ],
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: null,
  },
  {
    id: "complete-bazi-energy-set",
    slug: "complete-bazi-set",
    name: "The Complete BaZi Energy Set",
    section: "digital-bundles",
    formType: "B+C",
    productKind: "Bundle",
    price: 130,
    originalPrice: 158,
    currency: "USD",
    includes:
      "Eastern Astrology Report + BaZi Crystal Energy Bottle + DIY Crystal Sachet Kit",
    description:
      "Everything you need to understand your energy blueprint and surround yourself with aligned crystals.",
    fulfillmentTime:
      "Report delivered within 3–5 business days. Physical items ship within 7–14 business days.",
    images: [
      "/images/cosmic-blueprint-1.svg",
      "/images/spell-jar-1.svg",
      "/images/bazi-spell-bag-1.svg",
    ],
    requiresBirthData: true,
    requiresShipping: true,
    requiresNailDetails: false,
    badge: "Best Value",
  },
];

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id) {
  return products.find((product) => product.id === id);
}

export function getPaypalMeUrl(product) {
  return `https://www.paypal.com/paypalme/${PAYPAL_ME_USERNAME}/${product.price}`;
}
