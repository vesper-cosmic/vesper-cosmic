"use client";

import { useState, useMemo } from "react";
import {
  productCategories,
  products,
  singleIntentionOptions,
} from "@/data/products";
import ShopProductCard from "@/components/shop/ShopProductCard";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import CartDrawer from "@/components/shop/CartDrawer";
import { useCart } from "@/lib/cartContext";

export default function ShopPage() {
  const { totalItems } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  function openProductDetail(product) {
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    setSelectedProduct(null);
  }

  // Count products per category
  const categoryProductCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Only show categories that have products
  const activeCategories = productCategories.filter(
    (cat) => categoryProductCounts[cat.id] > 0
  );

  return (
    <>
      {/* Fixed Header with Cart */}
      <header className="sticky top-0 z-30 border-b border-[#8EB1D1]/20 bg-[#E8ECEF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a
            href="/shop"
            className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8EB1D1]"
          >
            Vesper Cosmic
          </a>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            Cart
            {totalItems > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1C2B48] text-xs font-bold text-white">
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="min-h-screen bg-transparent">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Banner */}
          <div className="rounded-lg border border-[#8EB1D1]/40 bg-[#8EB1D1] px-5 py-8 shadow-[0_18px_60px_rgba(28,43,72,0.18)] sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1C2B48]">
              Vesper Cosmic Shop
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-none text-white sm:text-6xl">
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
            {/* Sidebar — Accordion Categories */}
            <aside className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
                Shop by Category
              </p>
              <nav className="mt-4 space-y-1">
                {activeCategories.map((category) => {
                  const count = categoryProductCounts[category.id] || 0;
                  const isActive = selectedCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          isActive ? null : category.id
                        )
                      }
                      className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm font-semibold transition ${
                        isActive
                          ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                          : "border-[#8EB1D1]/20 text-[#1C2B48] hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                      }`}
                    >
                      <span>{category.title}</span>
                      <span className="text-xs font-normal text-[#5B7893]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Product Grid — grouped by category */}
            <div className="space-y-14">
              {activeCategories
                .filter(
                  (cat) =>
                    !selectedCategory || cat.id === selectedCategory
                )
                .map((category) => {
                  const sectionProducts = products.filter(
                    (product) => product.category === category.id
                  );

                  if (sectionProducts.length === 0) return null;

                  return (
                    <section
                      key={category.id}
                      id={category.id}
                      className="scroll-mt-24"
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
                          <ShopProductCard
                            key={product.id}
                            product={product}
                            onClick={() => openProductDetail(product)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
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

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}