export const metadata = {
  title: "Privacy Policy | VESPER COSMOS",
  description:
    "Privacy Policy for VESPER COSMOS. Learn how we collect, use, and safeguard your personal data, including astrological details for custom BaZi and Zi Wei Dou Shu reports.",
};

const infoItems = [
  {
    title: "Personal & Contact Details",
    text: "Name, email address, shipping address, and phone number when placing an order.",
  },
  {
    title: "Astrological & Personalization Data",
    text: "Birth date, birth time, birth location, and gender provided for custom BaZi/Zi Wei Dou Shu reports and tailored energy products.",
  },
  {
    title: "Payment Information",
    text: "Processed securely through encrypted third-party payment gateways (Visa, MasterCard, PayPal, Apple Pay). We do not store your credit card details on our servers.",
  },
];

const usageItems = [
  "To fulfill, handcraft, and ship your physical and digital orders.",
  "To perform accurate Eastern astrological analysis for your customized items.",
  "To communicate order updates, tracking information, and customer care responses.",
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Legal · Your Privacy Matters
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-[#5B7893]">
            Last Updated: 2026
          </p>
        </header>

        {/* Intro */}
        <div className="mt-10 space-y-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
          <p>
            At <strong className="font-semibold text-[#1C2B48]">VESPER COSMOS</strong>,
            we respect your privacy and are committed to protecting your
            personal data. This policy outlines how we collect, use, and
            safeguard your information when you visit our website or purchase
            our services.
          </p>
        </div>

        {/* Information We Collect */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Information We Collect
          </h2>
          <ol className="mt-6 space-y-4">
            {infoItems.map((item, index) => (
              <li
                key={item.title}
                className="flex items-start gap-4 rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8EB1D1]/15 text-sm font-semibold text-[#1C2B48]"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#1C2B48] sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-7 text-[#35506B] sm:text-base">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* How We Use Your Information */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            How We Use Your Information
          </h2>
          <ul className="mt-6 space-y-4">
            {usageItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EB1D1]"
                />
                <p className="text-sm leading-7 text-[#35506B] sm:text-base">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Data Protection & Sacred Confidentiality */}
        <section className="mt-12 rounded-lg border border-[#8EB1D1]/20 bg-[#E8ECEF]/95 p-6">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Data Protection & Sacred Confidentiality
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            Your astrological details and personal information are treated with
            the highest level of confidentiality and respect. We{" "}
            <strong className="font-semibold text-[#1C2B48]">never</strong>{" "}
            sell, rent, or trade your personal data or birth details to third
            parties.
          </p>
        </section>

        {/* Contact Us */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Contact Us
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            If you have questions regarding our Privacy Policy, please email us
            at{" "}
            <a
              href="mailto:privacy@vespercosmos.com"
              className="font-semibold text-[#1C2B48] underline decoration-[#8EB1D1] decoration-2 underline-offset-2 transition hover:text-[#5B7893]"
            >
              privacy@vespercosmos.com
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}