// Homepage content — edit the words and pictures here, no layout changes needed.

// Scrolling announcement bar at the very top of every page.
export const announcements = [
  "Free US shipping on orders over $89",
  "US duties prepaid — no surprise fees at delivery",
  "Handcrafted in Taiwan",
  "Custom sets designed around your BaZi chart",
];

// Hero slides. `categories` picks the product whose photo is shown; set `image`
// (e.g. "/images/hero-hands.jpg" or an uploaded image URL) to use your own photo.
// `href: "product"` links to that product's order page.
export const heroSlides = [
  {
    id: "custom",
    eyebrow: "Custom BaZi Press-On Nails",
    title: "Your elements, at your fingertips.",
    text: "A set designed from your birth chart — crystals and colours chosen for the elements you need most.",
    cta: { label: "Design Your Custom Set", href: "product" },
    categories: ["custom-nails"],
    image: "",
  },
  {
    id: "ready-made",
    eyebrow: "Ready-Made Collection",
    title: "Ready when you are.",
    text: "Finished sets in standard sizes, handcrafted with genuine crystals.",
    cta: { label: "Shop Ready-Made", href: "/shop?category=ready-made-nails" },
    categories: ["ready-made-nails"],
    image: "",
  },
  {
    id: "energy-bottles",
    eyebrow: "Crystal Energy Bottles",
    title: "Carry your intention.",
    text: "Hand-filled crystal bottles for protection, intuition and love.",
    cta: { label: "Shop Energy Bottles", href: "/shop?category=energy-bottles" },
    categories: ["energy-bottles", "custom-energy-bottles"],
    image: "",
  },
];

// Product rows on the homepage, in order.
export const productRails = [
  {
    id: "nails",
    eyebrow: "Press-On Nails",
    title: "Nails That Hold Your Energy",
    categories: ["nails", "ready-made-nails", "custom-nails"],
    href: "/shop?category=nails",
    feature: {
      title: "Made for your chart",
      text: "Every custom set starts with your birth date, time and place.",
      cta: "Start a custom set",
      href: "product:custom-nails",
    },
  },
  {
    id: "rituals",
    eyebrow: "Ritual Objects",
    title: "Crystals, Sachets & Readings",
    excludeCategories: ["nails", "ready-made-nails", "custom-nails"],
    href: "/shop",
  },
];

export const benefits = [
  { icon: "truck", title: "Free US Shipping", text: "On orders over $89" },
  { icon: "shield", title: "Duties Prepaid", text: "No fees at your door" },
  { icon: "hand", title: "Handcrafted", text: "Made by hand in Taiwan" },
  { icon: "lock", title: "Secure Checkout", text: "Pay safely with PayPal" },
];
