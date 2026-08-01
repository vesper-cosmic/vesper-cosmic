"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { products, productCategories } from "@/data/products";
import ShopProductCard from "@/components/shop/ShopProductCard";
import ProductDetailModal from "@/components/shop/ProductDetailModal";

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  // selectedFilter: null (all) | { type: "group", id } | { type: "category", id }
  const [selectedFilter, setSelectedFilter] = useState(null);

  // Seasonal/featured products — swap this list later for a seasonal
  // "editor's pick" collection without changing the page layout.
  const visibleAllProducts = products;

  function openProductDetail(product) {
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    setSelectedProduct(null);
  }

  // Count products per product.category id
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  function toggleGroup(item) {
    // Parent category with children → show all products in its sub-categories
    if (item.children) {
      setSelectedFilter((prev) =>
        prev && prev.type === "group" && prev.id === item.id
          ? null
          : { type: "group", id: item.id }
      );
      return;
    }
    // Single-level category → filter by its product category id
    if (item.categoryId) {
      setSelectedFilter((prev) =>
        prev && prev.type === "category" && prev.id === item.categoryId
          ? null
          : { type: "category", id: item.categoryId }
      );
    }
  }

  function toggleCategory(categoryId) {
    if (!categoryId) return;
    setSelectedFilter((prev) =>
      prev && prev.type === "category" && prev.id === categoryId
        ? null
        : { type: "category", id: categoryId }
    );
  }

  // Products for the current filter — group shows all children, category shows that leaf only
  const visibleProducts = useMemo(() => {
    if (!selectedFilter) return visibleAllProducts;

    if (selectedFilter.type === "group") {
      const group = productCategories.find((g) => g.id === selectedFilter.id);
      const categoryIds = new Set(
        (group.children || []).map((child) => child.categoryId).filter(Boolean)
      );
      return visibleAllProducts.filter((product) =>
        categoryIds.has(product.category)
      );
    }

    return visibleAllProducts.filter(
      (product) => product.category === selectedFilter.id
    );
  }, [selectedFilter, visibleAllProducts]);

  const emptyMessage =
    selectedFilter && visibleProducts.length === 0
      ? "This category doesn't have products yet — check back soon."
      : null;

  return (
    <>
      <main className="min-h-screen bg-transparent">
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero Banner */}
          <header className="rounded-lg border border-[#8EB1D1]/40 bg-[#8EB1D1] px-5 py-8 shadow-[0_18px_60px_rgba(28,43,72,0.18)] sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1C2B48]">
              Vesper Cosmos
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-none text-white sm:text-6xl">
              Cosmos goods and personalized BaZi reports
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#1C2B48]">
              A lightweight storefront for ready-to-ship ritual objects, custom
              BaZi pieces, and digital reports. Browse the full collection
              below and click any product to view details and add to cart.
            </p>
          </header>

          {/* Sidebar + Content Layout */}
          <div className="mt-12 grid gap-8 lg:grid-cols-[240px_1fr] lg:items-start">
            {/* Sidebar — Category Filter (persistent on the side) */}
            <aside className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
                Shop by Category
              </p>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {productCategories.map((group) => {
                  const isParent = Boolean(group.children);
                  const groupCount = isParent
                    ? group.children.reduce(
                        (sum, child) =>
                          sum + (categoryCounts[child.categoryId] || 0),
                        0
                      )
                    : categoryCounts[group.categoryId] || 0;
                  const isActive =
                    selectedFilter?.type === "group"
                      ? selectedFilter.id === group.id
                      : selectedFilter?.type === "category" &&
                        selectedFilter.id === group.categoryId;

                  return (
                    <div
                      key={group.id}
                      className="flex flex-shrink-0 flex-col lg:w-full"
                    >
                      {/* Category button (parent or single-level) */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        aria-expanded={isParent ? isActive : undefined}
                        className={`flex items-center gap-2 rounded border px-3 py-2 text-left text-sm font-semibold transition ${
                          isActive
                            ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                            : "border-[#8EB1D1]/20 text-[#1C2B48] hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                        }`}
                      >
                        <span>{group.title}</span>
                        <span className="text-xs font-normal text-[#5B7893]">
                          {groupCount}
                        </span>
                      </button>

                      {/* Child sub-categories */}
                      {isParent ? (
                        <div className="mt-1 flex gap-1 pl-3 lg:flex-col">
                          {group.children.map((child) => {
                            const count = child.categoryId
                              ? categoryCounts[child.categoryId] || 0
                              : 0;
                            const childActive =
                              selectedFilter?.type === "category" &&
                              selectedFilter.id === child.categoryId;
                            const isDisabled =
                              !child.categoryId && count === 0;

                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => toggleCategory(child.categoryId)}
                                disabled={isDisabled}
                                className={`flex flex-shrink-0 items-center gap-2 rounded border px-2.5 py-1.5 text-left text-xs font-medium transition lg:w-full ${
                                  isDisabled
                                    ? "cursor-not-allowed border-transparent text-[#5B7893]/60"
                                    : childActive
                                      ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                                      : "border-[#8EB1D1]/20 text-[#35506B] hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                                }`}
                              >
                                <span>{child.title}</span>
                                <span className="text-xs font-normal text-[#5B7893]">
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>

              {/* About Link — 側邊欄最下方 */}
              <Link
                href="/about"
                className="mt-4 flex items-center gap-2 rounded border border-[#8EB1D1]/20 px-3 py-2 text-sm font-semibold text-[#1C2B48] transition hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                About
              </Link>
            </aside>

            {/* Product Grid — full collection, or the selected category */}
            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-[#1C2B48]">
                  {selectedFilter ? "Filtered Collection" : "All Products"}
                </h2>
                <Link
                  href="/shop"
                  className="text-sm font-semibold text-[#5B7893] transition hover:text-[#1C2B48]"
                >
                  View Full Shop →
                </Link>
              </div>

              {emptyMessage ? (
                <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] px-5 py-10 text-center">
                  <p className="text-sm leading-6 text-[#35506B]">
                    {emptyMessage}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ShopProductCard
                      key={product.id}
                      product={product}
                      onClick={() => openProductDetail(product)}
                    />
                  ))}
                </div>
              )}
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