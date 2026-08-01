export const metadata = {
  title: "FAQ | VESPER COSMOS",
  description:
    "Frequently asked questions about VESPER COSMOS press-on nails, customization, Eastern astrology reports, digital reports, shipping, and tracking.",
};

const faqSections = [
  {
    icon: "💅",
    title: "Press-On Nails & Customization",
    items: [
      {
        question:
          "How do you determine the design and crystal energy for my nails?",
        answer:
          "Based on your birth data (Date, Time, and Location of birth), we calculate your Eastern astrology chart (BaZi) to identify your dominant and deficient elemental energies (Wood, Fire, Earth, Metal, Water). We then curate specific crystal energies and color palettes to balance your aura.",
      },
      {
        question: "How do I measure my nail size?",
        answer:
          "You can find our detailed Sizing Guide on each product page. We strongly recommend using a soft measuring tape across the widest part of your natural nail bed or purchasing our Sizing Kit before ordering custom sets.",
      },
      {
        question: "How long do the press-on nails last?",
        answer:
          "With proper nail preparation and adhesive application, Nail Adhesive Tabs last 3–7 days (reusable nails), and Nail Glue lasts 2–3 weeks with durable wear.",
        bullets: [
          { label: "Nail Adhesive Tabs:", value: "3–7 days (reusable nails)." },
          { label: "Nail Glue:", value: "2–3 weeks with durable wear." },
        ],
      },
    ],
  },
  {
    icon: "📜",
    title: "Eastern Astrology & Digital Reports",
    items: [
      {
        question: "What information do I need to provide for a Digital Report?",
        answer:
          "You will need to provide your exact birth date, exact birth time (hour and minute if known), birth city/country, and gender at checkout.",
      },
      {
        question: "What if I don't know my exact birth time?",
        answer:
          "While exact birth time offers the highest precision for Zi Wei Dou Shu readings, we can still conduct a comprehensive BaZi reading based on your birth day, month, and year.",
      },
    ],
  },
  {
    icon: "📦",
    title: "Shipping & Tracking",
    items: [
      {
        question: "Where do you ship from?",
        answer:
          "All physical items are crafted and shipped directly from our studio in Taiwan via international postal service.",
      },
      {
        question: "Will I receive tracking information?",
        answer:
          "Yes, every package is dispatched with a tracking number that will be emailed to you as soon as your shipping label is generated.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Customer Care · We&rsquo;re Here to Help
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            Frequently Asked Questions
          </h1>
        </header>

        {/* FAQ Sections */}
        <div className="mt-12 space-y-12">
          {faqSections.map((section) => (
            <section key={section.title}>
              <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
                <span aria-hidden="true">{section.icon}</span>
                {section.title}
              </h2>

              <div className="mt-6 space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-6"
                  >
                    <h3 className="text-base font-semibold text-[#1C2B48] sm:text-lg">
                      Q: {item.question}
                    </h3>
                    <p className="mt-2.5 text-sm leading-7 text-[#35506B] sm:text-base">
                      A: {item.answer}
                    </p>

                    {item.bullets && (
                      <ul className="mt-3 space-y-1.5">
                        {item.bullets.map((bullet) => (
                          <li
                            key={bullet.label}
                            className="flex items-start gap-2 text-sm leading-7 text-[#5B7893] sm:text-base"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EB1D1]"
                            />
                            <span>
                              <strong className="font-medium text-[#35506B]">
                                {bullet.label}
                              </strong>{" "}
                              {bullet.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact prompt */}
        <div className="mt-14 rounded-lg border border-[#8EB1D1]/20 bg-[#E8ECEF]/95 p-6 text-center">
          <h2 className="text-xl font-semibold text-[#1C2B48]">
            Still have questions?
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#35506B] sm:text-base">
            Our team is happy to help. Reach out to us via the{" "}
            <a
              href="/contact"
              className="font-semibold text-[#1C2B48] underline decoration-[#8EB1D1] decoration-2 underline-offset-2 transition hover:text-[#5B7893]"
            >
              Contact page
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}