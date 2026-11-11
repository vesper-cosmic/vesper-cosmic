// Products are managed in the admin (stored in the Notion products database).
// This built-in list is intentionally empty.
export const products = [];

export const productCategories = [
  // "includes": this entry also lists products from these categories.
  {
    id: "nails",
    title: "Nails",
    categoryId: "nails",
    includes: ["nails", "ready-made-nails", "custom-nails"],
  },
  { id: "ready-made-nails", title: "Ready-Made Nails", categoryId: "ready-made-nails" },
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