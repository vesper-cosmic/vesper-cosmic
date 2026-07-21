import ShopProductCard from "@/components/shop/ShopProductCard";
import { productSections, products } from "@/data/products";

export const metadata = {
  title: "Shop | Vesper Cosmic",
  description:
    "Shop ready-to-ship crystal goods, custom BaZi energy pieces, press-on nails, reports, and bundles by Vesper Cosmic.",
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#7fa9b5]/30 bg-[#10232d]/70 px-5 py-8 shadow-[0_18px_60px_rgba(2,10,14,0.28)] sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#9bc4cf]">
            Vesper Cosmic Shop
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-none text-[#edf7f8] sm:text-6xl">
            Ritual objects for your energy blueprint
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#c7d9dd]">
            Choose a ready-made piece, a custom BaZi creation, or a personalized
            Eastern astrology report. Each order begins with a focused intake
            form, then moves to secure PayPal payment.
          </p>
        </div>

        <div className="mt-12 space-y-14">
          {productSections.map((section) => {
            const sectionProducts = products.filter(
              (product) => product.section === section.id
            );

            return (
              <section key={section.id}>
                <div className="mb-5 border-b border-[#7fa9b5]/25 pb-4">
                  <h2 className="text-3xl font-semibold text-[#edf7f8]">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#9fb8bf]">
                    {section.description}
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sectionProducts.map((product) => (
                    <ShopProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
