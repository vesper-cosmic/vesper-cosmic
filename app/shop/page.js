import ShopProductCard from "@/components/shop/ShopProductCard";
import {
  productCategories,
  products,
  singleIntentionOptions,
} from "@/data/products";

export const metadata = {
  title: "Shop | Vesper Cosmic",
  description:
    "Shop ready-to-ship crystal goods, custom BaZi energy pieces, press-on nails, reports, and bundles by Vesper Cosmic.",
};

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#8EB1D1]/40 bg-[#8EB1D1] px-5 py-8 shadow-[0_18px_60px_rgba(28,43,72,0.18)] sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1C2B48]">
            Vesper Cosmic Shop
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-none text-white sm:text-6xl">
            Ritual objects for your energy blueprint
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#1C2B48]">
            Choose a ready-made piece, a custom BaZi creation, or a personalized
            Eastern astrology report. Each order begins with a focused intake
            form, then moves to secure PayPal payment.
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8EB1D1]">
            Single Intention Ready Pieces
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1C2B48]">
            Choose one focus for ready-made pieces
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#35506B]">
            Crystal sachets, energy bottles, and ready-to-ship nails can be
            ordered around one main focus. Dual-focus combinations can be added
            later as separate products.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {singleIntentionOptions.map((option) => (
              <span
                key={option}
                className="rounded-full border border-[#8EB1D1]/40 bg-[#C4D8E5] px-3 py-1 text-xs font-semibold text-[#1C2B48]"
              >
                {option}
              </span>
            ))}
          </div>
        </section>

        <div className="mt-12 grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
          <aside className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
              Shop by Category
            </p>
            <nav className="mt-4 grid gap-2">
              {productCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="rounded border border-[#8EB1D1]/20 px-3 py-2 text-sm font-semibold text-[#1C2B48] transition hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                >
                  {category.title}
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-14">
            {productCategories.map((category) => {
              const sectionProducts = products.filter(
                (product) => product.category === category.id
              );

              return (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-8"
                >
                  <div className="mb-5 border-b border-[#8EB1D1]/25 pb-4">
                    <h2 className="text-3xl font-semibold text-[#1C2B48]">
                      {category.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#35506B]">
                      {category.description}
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
        </div>
      </section>
    </main>
  );
}
