// Fixtures for the customs tests. Prices match the live catalog shape.

export const nails = {
  id: "nails-ready",
  name: "Celestial Romance -S",
  category: "ready-made-nails",
  price: 88,
  requiresShipping: true,
  shippingTier: "LIGHT",
  includes: "10 press-on nails, application kit: mini nail file, wooden cuticle stick, 1 sheet of jelly adhesive tabs",
  customs: { description: "Plastic press-on artificial nails set", htsus: "3926400000", unitWeightG: 45, origin: "Taiwan" },
};

export const jar = {
  id: "jar",
  name: "The Sanctuary Jar",
  category: "energy-bottles",
  price: 48,
  requiresShipping: true,
  shippingTier: "LIGHT",
  customs: { description: "Decorative glass bottle with stone chips", htsus: "7013999090", unitWeightG: 120, origin: "Taiwan" },
};

export const sachet = {
  id: "sachet",
  name: "Crystal Sachet",
  category: "sachets-ready",
  price: 28,
  requiresShipping: true,
  customs: { description: "Fabric pouch with decorative stones", htsus: "6307909891", unitWeightG: 60, origin: "Taiwan" },
};

export const report = {
  id: "report",
  name: "Eastern Astrology Report",
  category: "digital-reports",
  price: 68,
  requiresShipping: false,
  customs: {},
};

// Bundle: jar + sachet + digital report. List total 48 + 28 + 68 = 144.
export const bundle = {
  id: "bundle",
  name: "The Complete Set",
  category: "bundles",
  price: 120,
  requiresShipping: true,
  customs: {
    bundleComponents: [
      { productId: "jar", quantity: 1 },
      { productId: "sachet", quantity: 1 },
      { productId: "report", quantity: 1 },
    ],
  },
};

export const productsById = Object.fromEntries([nails, jar, sachet, report, bundle].map((p) => [p.id, p]));

export const usAddress = {
  fullName: "Emily Johnson",
  addressLine1: "12 Main St",
  addressLine2: "",
  city: "Austin",
  stateProvince: "TX",
  postalCode: "78701",
  country: "United States",
  phone: "+1 512 555 0100",
};

/** Build the data object the PDFs render, for a list of order items. */
export function customsData(lines, extra = {}) {
  const totalValueUSD = lines.reduce((sum, l) => sum + l.totalValueUSD, 0);
  const net = lines.reduce((sum, l) => sum + l.totalWeightG, 0);
  return {
    order: {
      orderId: "VC-20261112-AB12",
      createdAt: "2026-11-12T08:00:00.000Z",
      email: "emily@example.com",
      fullName: "Emily Johnson",
      amountUSD: totalValueUSD + 8,
      paypalCaptureId: "9AB12345CD678901E",
      trackingNumber: "RR123456789TW",
      shippingRecord: { shippingService: "ePacket" },
      items: [],
      hasDigital: false,
    },
    address: usAddress,
    seller: { businessName: "VESPER COSMOS", country: "Taiwan", email: "hello@example.com" },
    lines,
    summary: { totalValueUSD, netWeightG: net, grossWeightG: net + 30, packagingWeightG: 30, totalQty: 1, lineCount: lines.length },
    shippingChargedUSD: 8,
    validation: { ok: true, errors: [], warnings: [] },
    invoiceNumber: "VC-INV-VC-20261112-AB12",
    kitContents: [],
    ...extra,
  };
}
