"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { staticCategories, staticSingleIntentions, groupCategoryIds, categoryCountsFor, categoryMemberIds } from "@/lib/productData";
import { useProducts } from "@/components/ProductProvider";
import { RailProductCard } from "@/components/home/ProductRail";
import CategoryPanel from "@/components/shop/CategoryPanel";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import PageHero from "@/components/PageHero";

function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products } = useProducts();
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
  const categoryCounts = useMemo(() => categoryCountsFor(products), [products]);

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
      const group = staticCategories.find((g) => g.id === selectedFilter.id);
      const categoryIds = groupCategoryIds(group);
      return products.filter((product) => categoryIds.has(product.category));
    }

    return products.filter((product) => categoryMemberIds(selectedFilter.id).has(product.category));
  }, [selectedFilter, products]);

  const emptyMessage =
    selectedFilter && visibleProducts.length === 0
      ? "This category doesn't have products yet — check back soon."
      : null;

  return (
    <>
      <main className="min-h-screen bg-transparent">
        <PageHero
          eyebrow="Vesper Cosmos Shop"
          title="Ritual objects for your energy blueprint"
          subtitle="Choose a ready-made piece, a custom BaZi creation, or a personalized Eastern astrology report."
        />

        {/* Phones: category chips (the sidebar shows on desktop) */}
        <nav aria-label="Categories" className="sticky top-16 z-20 border-b border-[#1C2B48]/10 bg-[#F6F7F9]/95 backdrop-blur lg:hidden">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
            <li>
              <button
                type="button"
                onClick={() => updateFilter(null)}
                aria-pressed={!selectedFilter}
                className={`whitespace-nowrap border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                  !selectedFilter ? "border-[#1C2B48] bg-[#1C2B48] text-white" : "border-[#1C2B48]/20 bg-white text-[#1C2B48]"
                }`}
              >
                All
              </button>
            </li>
            {staticCategories
              .filter((item) => item.children || item.categoryId)
              .map((item) => {
                const active = item.children
                  ? selectedFilter?.type === "group" && selectedFilter.id === item.id
                  : selectedFilter?.type === "category" && selectedFilter.id === item.categoryId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(item)}
                      aria-pressed={active}
                      className={`whitespace-nowrap border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${
                        active ? "border-[#1C2B48] bg-[#1C2B48] text-white" : "border-[#1C2B48]/20 bg-white text-[#1C2B48]"
                      }`}
                    >
                      {item.title}
                      {categoryCounts[item.categoryId || item.id] ? (
                        <span className="ml-1.5 opacity-60">{categoryCounts[item.categoryId || item.id]}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Single Intention Options */}
          <section className="mt-8 rounded-sm border border-[#1C2B48]/10 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5B7893]">
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
              {staticSingleIntentions.map((option) => (
                <span
                  key={option}
                  className="rounded-full border border-[#1C2B48]/20 bg-[#EEF1F4] px-3 py-1 text-xs font-semibold text-[#1C2B48]"
                >
                  {option}
                </span>
              ))}
            </div>
          </section>

          {/* Sidebar + Content Layout */}
          <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            {/* Sidebar — Category Filter */}
            <aside className="hidden rounded-sm border border-[#1C2B48]/10 bg-white p-4 lg:sticky lg:top-36 lg:block">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7893]">
                Shop by Category
              </p>
              <CategoryPanel
                categoryCounts={categoryCounts}
                selectedFilter={selectedFilter}
                onToggleGroup={toggleGroup}
                onToggleCategory={toggleCategory}
                showAbout={false}
              />
            </aside>

            {/* Product Grid */}
            <div>
              {emptyMessage ? (
                <div className="rounded-sm border border-[#1C2B48]/10 bg-white px-5 py-10 text-center">
                  <p className="text-sm leading-6 text-[#35506B]">
                    {emptyMessage}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <RailProductCard key={product.id} product={product} onOpen={openProductDetail} />
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