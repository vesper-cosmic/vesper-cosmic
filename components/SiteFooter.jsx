import Link from "next/link";

const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Press-On Nails", href: "/shop" },
      { label: "Energy Bottles", href: "/shop" },
      { label: "Sachets", href: "/shop" },
      { label: "Digital Reports", href: "/shop" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Return & Refund Policy", href: "/returns" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

// Payment badge placeholders — replace with official SVGs / icons
const paymentMethods = [
  { label: "Apple Pay", text: " Pay" },
  { label: "Visa", text: "VISA" },
  { label: "Mastercard", text: "MC" },
  { label: "PayPal", text: "PayPal" },
  { label: "Shopify Payments", text: "Shop" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#8EB1D1]/20 bg-[#E8ECEF]/95" aria-label="Site footer">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr] lg:gap-14">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/images/vesper-logo.png"
                alt="Vesper Cosmos"
                className="h-9 w-auto"
              />
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1C2B48]">
                Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#5B7893]">
              Haute occult ritual objects — custom BaZi press-on nails,
              crystal energy bottles, and personalized eastern astrology
              reports.
            </p>
          </div>

          {/* Link columns */}
          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
            aria-label="Footer navigation"
          >
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1C2B48]">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#35506B] transition hover:text-[#1C2B48]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Payment badges */}
        <div className="mt-10 border-t border-[#8EB1D1]/20 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
            We Accept
          </p>
          <ul
            className="mt-3 flex flex-wrap items-center gap-2"
            aria-label="Accepted payment methods"
          >
            {paymentMethods.map((method) => (
              <li
                key={method.label}
                className="flex h-9 min-w-[3.5rem] items-center justify-center rounded border border-[#8EB1D1]/30 bg-white px-2.5 text-[10px] font-bold tracking-wide text-[#1C2B48]"
                title={method.label}
              >
                {method.label === "Apple Pay" ? (
                  <span className="flex items-center text-sm leading-none">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Pay
                  </span>
                ) : (
                  method.text
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[#8EB1D1]/20 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-[#5B7893]">
            © 2026 VESPER COSMOS. All Rights Reserved.
          </p>
          <p className="text-xs text-[#8EB1D1]">
            Crafted with intention · Aligned with your elements
          </p>
        </div>
      </div>
    </footer>
  );
}