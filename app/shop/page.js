"use client";

import { useState, useMemo } from "react";
import { products, singleIntentionOptions } from "@/data/products";
import ShopProductCard from "@/components/shop/ShopProductCard";
import ProductDetailModal from "@/components/shop/ProductDetailModal";

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  function openProductDetail(product) {
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    setSelectedProduct(null);
  }

  // Build simple category list from the products' main labels (e.g. Press-On Nails)
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.categoryLabel] = (counts[p.categoryLabel] || 0) + 1;
    });
    return counts;
  }, []);

  // Simple product list — all products, or just the selected category's products
  const visibleProducts = selectedCategory
    ? products.filter((product) => product.categoryLabel === selectedCategory)
    : products;

  return (
    <>
      <main className="min-h-screen bg-transparent">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Banner */}
          <div className="rounded-lg border border-[#8EB1D1]/40 bg-[#8EB1D1] px-5 py-8 shadow-[0_18px_60px_rgba(28,43,72,0.18)] sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1C2B48]">
              Vesper Cosmos Shop
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-none text-white sm:text-6xl">
              Ritual objects for your energy blueprint
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#1C2B48]">
              Choose a ready-made piece, a custom BaZi creation, or a
              personalized Eastern astrology report. Click any product to view
              details and add to cart.
            </p>
          </div>

          {/* Single Intention Options */}
          <section className="mt-8 rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8EB1D1]">
              Single Intention Ready Pieces
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1C2B48]">
              Choose one focus for ready-made pieces
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#35506B]">
              Crystal sachets, energy bottles, and ready-to-ship nails can be
              ordered around one main focus. Dual-focus combinations can be
              added later as separate products.
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

          {/* Sidebar + Content Layout */}
          <div className="mt-12 grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
            {/* Sidebar — Category Filter (horizontal chips on mobile, vertical list on desktop) */}
            <aside className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
                Shop by Category
              </p>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {Object.entries(categoryCounts).map(([label, count]) => {
                  const isActive = selectedCategory === label;

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          isActive ? null : label
                        )
                      }
                      className={`flex flex-shrink-0 items-center gap-2 rounded border px-3 py-2 text-left text-sm font-semibold transition lg:w-full ${
                        isActive
                          ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                          : "border-[#8EB1D1]/20 text-[#1C2B48] hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-xs font-normal text-[#5B7893]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Product Grid — simple list of all products, or just the selected category's products */}
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ShopProductCard
                    key={product.id}
                    product={product}
                    onClick={() => openProductDetail(product)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          onClose={closeProductDetail}
        />
      ) : null}
    </>
  );
}