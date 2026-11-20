import Link from "next/link";

const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Press-On Nails", href: "/shop?category=nails" },
      { label: "Energy Bottles", href: "/shop?category=energy-bottles" },
      { label: "Sachets", href: "/shop?group=sachets" },
      { label: "Digital Reports", href: "/shop?category=digital-reports" },
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
      { label: "Member & Referral Agreement", href: "/member-agreement" },
      { label: "Your Privacy Rights", href: "/privacy#section-10" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

// Payment badge placeholders — replace with official SVGs / icons
const paymentMethods = [
  { label: "PayPal", text: "PayPal" },
];


export default function SiteFooter() {
  return (
    <footer className="bg-[#1C2B48] text-[#C4D8E5]" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr] lg:gap-16">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <img src="/images/vesper-logo.png" alt="" className="h-10 w-auto" />
              <span className="font-display text-xl font-medium uppercase tracking-[0.26em] text-white">
                Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs font-display text-lg italic leading-7 text-[#E8ECEF]">
              Where ancient eastern wisdom meets modern daily rituals.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#8EB1D1]">
              Custom BaZi press-on nails, crystal energy bottles and personalized
              eastern astrology reports.
            </p>
          </div>

          {/* Link columns */}
          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer navigation">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="font-display text-base font-semibold uppercase tracking-[0.22em] text-[#BFA06A]">
                  {group.title}
                </h2>
                <ul className="mt-3 space-y-0.5 sm:mt-4 sm:space-y-1">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-block py-1.5 text-sm text-[#C4D8E5] transition hover:text-white sm:py-1"
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

        {/* Payment + copyright */}
        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8EB1D1]">We Accept</p>
            <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
              {paymentMethods.map((method) => (
                <li
                  key={method.label}
                  className="flex h-8 min-w-[3.5rem] items-center justify-center rounded border border-white/20 px-2.5 text-[11px] font-bold tracking-wide text-white"
                  title={method.label}
                >
                  {method.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-[#C4D8E5]">© 2026 VESPER COSMOS. All Rights Reserved.</p>
            <p className="mt-1 text-xs text-[#8EB1D1]">Crafted with intention · Aligned with your elements</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
