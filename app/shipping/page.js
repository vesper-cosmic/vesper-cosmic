export const metadata = {
  title: "Shipping & Delivery | VESPER COSMOS",
  description:
    "Learn about VESPER COSMOS shipping times, methods, and global delivery estimates. We ship worldwide from Taiwan via Taiwan Post Air Mail and EMS with tracking included on every order.",
};

const shippingZones = [
  {
    destination: "United States & Canada",
    standard: "10 – 18 Business Days",
    express: "5 – 8 Business Days",
  },
  {
    destination: "Europe & United Kingdom",
    standard: "12 – 20 Business Days",
    express: "6 – 9 Business Days",
  },
  {
    destination: "Australia & New Zealand",
    standard: "10 – 18 Business Days",
    express: "5 – 8 Business Days",
  },
  {
    destination: "Asia-Pacific",
    standard: "7 – 14 Business Days",
    express: "3 – 5 Business Days",
  },
];

const processingTimes = [
  {
    product: "Custom BaZi Press-On Nails & Personalized Astrology Reports",
    time: "7–12 business days.",
    note: "Each set is handcrafted and personalized based on your elemental analysis.",
  },
  {
    product: "Energy Bottles & Ritual Sachets",
    time: "3–5 business days.",
    note: null,
  },
  {
    product: "Digital Astrology Reports",
    time: "Delivered via email within 5–7 business days",
    note: "after receiving your birth details.",
  },
];

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Customer Care · Worldwide Delivery
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            Shipping & Delivery
          </h1>
        </header>

        {/* Intro */}
        <div className="mt-10 space-y-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
          <p>
            At <strong className="font-semibold text-[#1C2B48]">VESPER COSMOS</strong>,
            every sacred object and ritual piece is prepared with clear intention
            and energetic alignment. All orders are packed securely and
            dispatched directly from our studio in Taiwan.
          </p>
        </div>

        {/* Processing Time */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Processing Time
          </h2>
          <ul className="mt-6 space-y-4">
            {processingTimes.map((item) => (
              <li
                key={item.product}
                className="rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-5"
              >
                <p className="text-base font-semibold text-[#1C2B48] sm:text-lg">
                  {item.product}
                </p>
                <p className="mt-1.5 text-sm leading-7 text-[#35506B] sm:text-base">
                  <strong className="font-medium text-[#5B7893]">
                    {item.time}
                  </strong>
                  {item.note ? ` ${item.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Shipping Methods */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Shipping Methods & Estimated Transit Times
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            We ship globally using{" "}
            <strong className="font-semibold text-[#1C2B48]">
              Taiwan Post (International Registered Air Mail / Express Mail
              Service - EMS)
            </strong>{" "}
            with tracking included for every order.
          </p>

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-[#8EB1D1]/40">
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8EB1D1]">
                    Destination
                  </th>
                  <th className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8EB1D1]">
                    Standard Shipping (Air Mail)
                  </th>
                  <th className="py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8EB1D1]">
                    Express Shipping (EMS)
                  </th>
                </tr>
              </thead>
              <tbody>
                {shippingZones.map((zone) => (
                  <tr
                    key={zone.destination}
                    className="border-b border-[#8EB1D1]/20"
                  >
                    <td className="py-4 pr-4 text-base font-semibold text-[#1C2B48]">
                      {zone.destination}
                    </td>
                    <td className="py-4 pr-4 text-base text-[#35506B]">
                      {zone.standard}
                    </td>
                    <td className="py-4 text-base text-[#35506B]">
                      {zone.express}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm italic leading-7 text-[#5B7893]">
            Please note: Transit times are estimates and may vary due to customs
            inspection, holiday peak seasons, or local postal delays.
          </p>
        </section>

        {/* Tracking Your Order */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Tracking Your Order
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            Once your order is shipped, you will receive a confirmation email
            containing your tracking number and a link to monitor your
            package&rsquo;s journey.
          </p>
        </section>

        {/* Customs */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Customs, Taxes & Import Duties
          </h2>
          <p className="mt-4 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            International shipments may be subject to customs duties, VAT, or
            import taxes levied by the destination country. These fees are the
            responsibility of the customer. VESPER COSMOS is not responsible for
            delays caused by local customs clearance processes.
          </p>
        </section>
      </section>
    </main>
  );
}