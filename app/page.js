"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { staticCategories, groupCategoryIds, categoryCountsFor, categoryMemberIds } from "@/lib/productData";
import { useProducts } from "@/components/ProductProvider";
import ShopProductCard from "@/components/shop/ShopProductCard";
import CategoryPanel from "@/components/shop/CategoryPanel";
import CategoryDrawer from "@/components/shop/CategoryDrawer";
import ProductDetailModal from "@/components/shop/ProductDetailModal";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const { products } = useProducts();
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
  const categoryCounts = useMemo(() => categoryCountsFor(products), [products]);

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
      const group = staticCategories.find((g) => g.id === selectedFilter.id);
      const categoryIds = groupCategoryIds(group);
      return visibleAllProducts.filter((product) =>
        categoryIds.has(product.category)
      );
    }

    return visibleAllProducts.filter(
      (product) => categoryMemberIds(selectedFilter.id).has(product.category)
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
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-none text-white sm:text-6xl">
              Your elements, at your fingertips.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#1C2B48]">
              Handcrafted press-on nails and crystal ritual objects, designed
              around your BaZi chart — the ancient Chinese art of reading your
              Five Elements.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="rounded border border-[#1C2B48] bg-[#1C2B48] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-[#2A3D60]"
              >
                Shop the Collection
              </Link>
              <Link
                href="/order/custom-bazi-crystal-press-on-nails-bwsz4y"
                className="rounded border border-[#1C2B48] bg-transparent px-6 py-3 text-center text-sm font-bold text-[#1C2B48] transition hover:bg-white/30"
              >
                Design Your Custom Set
              </Link>
            </div>
          </header>

          {/* Sidebar + Content Layout */}
          <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            {/* Sidebar — Category Filter (persistent on the side) */}
            <aside className="hidden rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-4 lg:sticky lg:top-24 lg:block">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8EB1D1]">
                Shop by Category
              </p>
              <CategoryPanel
                categoryCounts={categoryCounts}
                selectedFilter={selectedFilter}
                onToggleGroup={toggleGroup}
                onToggleCategory={toggleCategory}
                showAbout={true}
              />
            </aside>
            <CategoryDrawer>
              {(close) => (
                <CategoryPanel
                  categoryCounts={categoryCounts}
                  selectedFilter={selectedFilter}
                  onToggleGroup={toggleGroup}
                  onToggleCategory={toggleCategory}
                  showAbout={true}
                  onPick={close}
                  roomy
                />
              )}
            </CategoryDrawer>

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
                <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
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