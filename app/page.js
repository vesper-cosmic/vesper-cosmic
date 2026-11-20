"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProducts } from "@/components/ProductProvider";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductRail from "@/components/home/ProductRail";
import { benefits, heroSlides, productRails } from "@/data/homeContent";

const inCategories = (product, ids) => ids.includes(product.category);

/** First photo of the first product in these categories. */
function photoFor(products, categories, which = 0) {
  const match = products.find((p) => inCategories(p, categories) && p.images?.length);
  return match ? match.images[Math.min(which, match.images.length - 1)] : "";
}

/** "product" / "product:<category>" → that product's order page; anything else as written. */
function resolveHref(href, products, categories) {
  if (!href?.startsWith("product")) return href;
  const wanted = href.includes(":") ? [href.split(":")[1]] : categories;
  const match = products.find((p) => inCategories(p, wanted) && p.slug);
  return match ? `/order/${match.slug}` : `/shop?category=${wanted[0]}`;
}

export default function HomePage() {
  const { products } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const slides = useMemo(() => {
    const resolved = heroSlides
      .map((slide) => ({
        ...slide,
        image: slide.image || photoFor(products, slide.categories),
        cta: slide.cta && { ...slide.cta, href: resolveHref(slide.cta.href, products, slide.categories) },
      }))
      .filter((slide) => slide.image);
    // Before products load (or if none match), still show the first slide.
    return resolved.length ? resolved : heroSlides.slice(0, 1).map((s) => ({ ...s, cta: { ...s.cta, href: "/shop" } }));
  }, [products]);

  const rails = useMemo(
    () =>
      productRails.map((rail) => ({
        ...rail,
        items: products.filter((p) =>
          rail.categories ? inCategories(p, rail.categories) : !inCategories(p, rail.excludeCategories || [])
        ),
        featureHref: rail.feature && resolveHref(rail.feature.href, products, rail.categories || []),
      })),
    [products]
  );

  const storyImage = photoFor(products, ["custom-nails"], 1) || photoFor(products, ["nails", "ready-made-nails"]);
  const leadImage = photoFor(products, ["custom-nails"], 3) || storyImage;
  const statementImage =
    photoFor(products, ["energy-bottles", "custom-energy-bottles"]) || photoFor(products, ["ready-made-nails"]);
  const customHref = resolveHref("product:custom-nails", products, []);

  return (
    <>
      <main className="bg-[#F6F7F9]">
        <h1 className="sr-only">Vesper Cosmos — custom BaZi crystal press-on nails and ritual objects</h1>

        <HeroCarousel slides={slides} />

        {/* Service highlights */}
        <section aria-label="Why shop with us" className="border-b border-[#1C2B48]/10 bg-white">
          <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-7 sm:px-6 lg:grid-cols-4 lg:px-8">
            {benefits.map((item) => (
              <li key={item.title} className="flex items-center justify-center gap-3 text-center sm:text-left">
                <BenefitIcon name={item.icon} />
                <div>
                  <p className="font-display text-lg font-semibold leading-tight text-[#1C2B48]">{item.title}</p>
                  <p className="text-xs text-[#5B7893]">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {rails[0] ? (
          <ProductRail
            eyebrow={rails[0].eyebrow}
            title={rails[0].title}
            href={rails[0].href}
            products={rails[0].items}
            onOpen={setSelectedProduct}
            lead={
              rails[0].feature ? (
                <Link
                  href={rails[0].featureHref}
                  className="group relative flex h-full min-h-[320px] flex-col justify-end overflow-hidden bg-[#1C2B48] p-6 text-white"
                >
                  {leadImage ? (
                    <img
                      src={leadImage}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-35"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2B48] via-[#1C2B48]/40 to-transparent" />
                  <div className="relative">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BFA06A]">Custom BaZi</p>
                    <p className="mt-2 font-display text-[32px] font-medium leading-[1.05]">{rails[0].feature.title}</p>
                    <p className="mt-3 text-sm leading-6 text-[#C4D8E5]">{rails[0].feature.text}</p>
                    <span className="mt-5 inline-flex items-center gap-2 border-b border-[#BFA06A] pb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#BFA06A]">
                      {rails[0].feature.cta} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              ) : null
            }
          />
        ) : null}

        {/* Story: how a custom set is made */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative isolate">
              <div className="relative z-10 aspect-[4/5] overflow-hidden bg-[#EEF1F4] sm:aspect-[5/4] lg:aspect-[4/5]">
                {storyImage ? <img src={storyImage} alt="A custom BaZi crystal press-on nail set" loading="lazy" className="h-full w-full object-cover" /> : null}
              </div>
              <div aria-hidden="true" className="absolute -bottom-5 -right-5 z-0 hidden h-2/3 w-2/3 border border-[#BFA06A]/60 lg:block" />
            </div>
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B7893]">The Custom Ritual</p>
              <h2 className="mt-3 font-display text-[38px] font-medium leading-[1.05] text-[#1C2B48] sm:text-6xl">
                Designed around <em className="text-[#5B7893]">your</em> birth chart.
              </h2>
              <p className="mt-6 max-w-lg text-[15px] leading-7 text-[#35506B]">
                BaZi — the Four Pillars of Destiny — reads the balance of the Five
                Elements in the moment you were born. We use it to choose the
                crystals and colours for a set that is yours alone.
              </p>
              <ol className="mt-9 space-y-6">
                {[
                  ["Share your birth details", "Date, time and place of birth, plus your nail sizes."],
                  ["We read your Five Elements", "Which elements are strong, and which need support."],
                  ["Handcrafted for you", "Crystals and colours matched to your chart, made by hand and shipped to you."],
                ].map(([title, text], i) => (
                  <li key={title} className="flex gap-5">
                    <span className="font-display text-4xl font-medium leading-none text-[#BFA06A]">0{i + 1}</span>
                    <div className="border-l border-[#1C2B48]/15 pl-5">
                      <p className="font-display text-2xl font-medium text-[#1C2B48]">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#5B7893]">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href={customHref}
                className="mt-10 inline-block border border-[#1C2B48] bg-[#1C2B48] px-9 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-transparent hover:text-[#1C2B48]"
              >
                Design Your Custom Set
              </Link>
            </div>
          </div>
        </section>

        {rails.slice(1).map((rail) => (
          <ProductRail
            key={rail.id}
            eyebrow={rail.eyebrow}
            title={rail.title}
            href={rail.href}
            products={rail.items}
            onOpen={setSelectedProduct}
          />
        ))}

        {/* Statement */}
        <section className="relative overflow-hidden bg-[#1C2B48] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          {statementImage ? (
            <img src={statementImage} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          ) : null}
          <div className="absolute inset-0 bg-[#1C2B48]/55" />
          <div className="relative mx-auto max-w-2xl bg-[#F6F7F9] px-6 py-12 text-center sm:px-14 sm:py-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B7893]">Haute Occult Ritual Objects</p>
            <h2 className="mt-4 font-display text-[36px] font-medium leading-[1.05] text-[#1C2B48] sm:text-5xl">
              Ancient wisdom, modern ritual.
            </h2>
            <span aria-hidden="true" className="mx-auto mt-6 block h-px w-14 bg-[#BFA06A]" />
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-[#35506B]">
              Every piece begins with the Five Elements — wood, fire, earth, metal
              and water — and ends as something you can wear, carry or keep close.
            </p>
            <Link
              href="/shop"
              className="mt-9 inline-block border border-[#1C2B48] px-9 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-[#1C2B48] transition hover:bg-[#1C2B48] hover:text-white"
            >
              Explore the Collection
            </Link>
          </div>
        </section>
      </main>

      {selectedProduct ? (
        <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      ) : null}
    </>
  );
}

function BenefitIcon({ name }) {
  const paths = {
    truck: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
    shield: "M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4",
    hand: "M8 13V6.5a1.5 1.5 0 013 0V12m0-1V5a1.5 1.5 0 013 0v6m0-1V6.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1a6 6 0 01-5.2-3L3.6 14a1.5 1.5 0 012.6-1.5L8 15",
    lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 017 0v3",
  };
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BFA06A]/50 text-[#1C2B48]">
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[name] || paths.lock} />
      </svg>
    </span>
  );
}
