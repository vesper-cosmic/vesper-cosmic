"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { mergeProducts, staticProducts } from "@/lib/productData";

const ProductContext = createContext({
  products: staticProducts,
  dynamicProducts: [],
  status: "idle",
  getProductById: () => null,
  getProductBySlug: () => null,
  refresh: () => {},
});

export function ProductProvider({ children }) {
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [status, setStatus] = useState("idle");
  const [tick, setTick] = useState(0);
  const didLoad = useRef(false);

  async function refresh() {
    setStatus("loading");
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Product fetch failed.");
      const payload = await response.json();
      setDynamicProducts(Array.isArray(payload.products) ? payload.products : []);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load dynamic products:", error);
      setStatus("error");
    }
  }

  // Load once on mount; re-fetch after admin actions via refresh()
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch whenever refresh() is triggered from outside (e.g. admin page)
  useEffect(() => {
    if (tick === 0) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const products = useMemo(
    () => mergeProducts(staticProducts, dynamicProducts),
    [dynamicProducts]
  );

  const value = useMemo(
    () => ({
      products,
      dynamicProducts,
      status,
      getProductById: (id) => products.find((product) => product.id === id) || null,
      getProductBySlug: (slug) => products.find((product) => product.slug === slug) || null,
      refresh: () => setTick((current) => current + 1),
    }),
    [products, dynamicProducts, status]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductContext);
}