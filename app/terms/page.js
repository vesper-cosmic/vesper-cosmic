export const metadata = {
  title: "Terms of Service | VESPER COSMOS",
  description:
    "Terms of Service for VESPER COSMOS. Understand the guidelines for using our handcrafted ritual objects and astrology services, including disclaimers and intellectual property.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Legal · Guidelines & Agreements
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-[#5B7893]">
            Last Updated: 2026
          </p>
        </header>

        {/* Intro */}
        <div className="mt-10 space-y-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
          <p>
            Welcome to <strong className="font-semibold text-[#1C2B48]">VESPER COSMOS</strong>.
            By accessing or using our website and purchasing our handcrafted
            ritual objects and astrology services, you agree to be bound by the
            following terms.
          </p>
        </div>

        {/* 1. Metaphysical & Astrology Disclaimer */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            1. Metaphysical & Astrology Disclaimer
          </h2>
          <div className="mt-6 space-y-4">
            <p className="text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
              All astrological analysis (BaZi, Zi Wei Dou Shu), crystal
              readings, and energy-infused products offered by VESPER COSMOS are
              designed for spiritual self-reflection, personal empowerment, and
              entertainment/wellness purposes.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-5">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EB1D1]"
                />
                <p className="text-sm leading-7 text-[#35506B] sm:text-base">
                  Our services and products do not constitute professional
                  medical, legal, financial, or psychological advice.
                </p>
              </li>
              <li className="flex items-start gap-3 rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-5">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EB1D1]"
                />
                <p className="text-sm leading-7 text-[#35506B] sm:text-base">
                  VESPER COSMOS makes no guaranteed claims regarding specific
                  life outcomes derived from our ritual objects or digital
                  reports.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Handcrafted & Natural Material Variations */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            2. Handcrafted & Natural Material Variations
          </h2>
          <p className="mt-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            Each pair of press-on nails and crystal energy bottle is uniquely
            handcrafted. Natural gemstones and crystals feature inherent
            variations in color, texture, and pattern. Slight differences
            between product photos and the physical item received are a mark of
            natural authenticity.
          </p>
        </section>

        {/* 3. Intellectual Property */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            3. Intellectual Property
          </h2>
          <p className="mt-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            All content on this website—including text, graphics, logos,
            images, digital astrology reports, and design concepts—is the
            property of VESPER COSMOS and protected by international copyright
            laws.
          </p>
        </section>

        {/* 4. Governing Law */}
        <section className="mt-12 rounded-lg border border-[#8EB1D1]/20 bg-[#E8ECEF]/95 p-6">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            4. Governing Law
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            These Terms of Service and any separate agreements shall be governed
            by and construed in accordance with applicable e-commerce
            regulations.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Contact Us
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            If you have questions regarding our Terms of Service, please email
            us at{" "}
            <a
              href="mailto:legal@vespercosmos.com"
              className="font-semibold text-[#1C2B48] underline decoration-[#8EB1D1] decoration-2 underline-offset-2 transition hover:text-[#5B7893]"
            >
              legal@vespercosmos.com
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}