"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { products, productCategories, singleIntentionOptions } from "@/data/products";
import ShopProductCard from "@/components/shop/ShopProductCard";
import ProductDetailModal from "@/components/shop/ProductDetailModal";

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categoryParam = searchParams.get("category");
  const groupParam = searchParams.get("group");

  // selectedFilter: null (all) | { type: "group", id } | { type: "category", id }
  const selectedFilter = useMemo(() => {
    if (categoryParam) return { type: "category", id: categoryParam };
    if (groupParam) return { type: "group", id: groupParam };
    return null;
  }, [categoryParam, groupParam]);

  function updateFilter(filter) {
    const params = new URLSearchParams(searchParams.toString());
    if (!filter) {
      params.delete("category");
      params.delete("group");
    } else if (filter.type === "category") {
      params.set("category", filter.id);
      params.delete("group");
    } else {
      params.set("group", filter.id);
      params.delete("category");
    }
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }

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
      updateFilter(
        selectedFilter && selectedFilter.type === "group" && selectedFilter.id === item.id
          ? null
          : { type: "group", id: item.id }
      );
      return;
    }
    // Single-level category → filter by its product category id
    if (item.categoryId) {
      updateFilter(
        selectedFilter && selectedFilter.type === "category" && selectedFilter.id === item.categoryId
          ? null
          : { type: "category", id: item.categoryId }
      );
    }
  }

  function toggleCategory(categoryId) {
    if (!categoryId) return;
    updateFilter(
      selectedFilter && selectedFilter.type === "category" && selectedFilter.id === categoryId
        ? null
        : { type: "category", id: categoryId }
    );
  }

  // Products for the current filter — group shows all children, category shows that leaf only
  const visibleProducts = useMemo(() => {
    if (!selectedFilter) return products;

    if (selectedFilter.type === "group") {
      const group = productCategories.find((g) => g.id === selectedFilter.id);
      const categoryIds = new Set(
        (group.children || []).map((child) => child.categoryId).filter(Boolean)
      );
      return products.filter((product) => categoryIds.has(product.category));
    }

    return products.filter((product) => product.category === selectedFilter.id);
  }, [selectedFilter]);

  const emptyMessage =
    selectedFilter && visibleProducts.length === 0
      ? "This category doesn't have products yet — check back soon."
      : null;

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
            {/* Sidebar — Category Filter */}
            <aside className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
                Shop by Category
              </p>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {productCategories.map((group) => {
                  const isParent = Boolean(group.children);
                  const groupCount = isParent
                    ? group.children.reduce(
                        (sum, child) => sum + (categoryCounts[child.categoryId] || 0),
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
                            const isDisabled = !child.categoryId && count === 0;

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
            </aside>

            {/* Product Grid */}
            <div>
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

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}