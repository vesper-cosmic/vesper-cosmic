"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cartContext";

export default function ProductDetailModal({ product, onClose }) {
  const { addItem } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleAddToCart() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!product) return null;

  const activeImage = product.images[activeImageIndex] || product.images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1C2B48]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-y-auto rounded-none border border-[#8EB1D1]/30 bg-[#E8ECEF] shadow-[0_30px_80px_rgba(28,43,72,0.4)] sm:max-h-[90vh] sm:flex-row sm:rounded-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#8EB1D1]/40 bg-[#1C2B48]/80 text-[#E8ECEF] text-lg transition hover:bg-[#1C2B48]"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left: Images */}
        <div className="flex w-full flex-col sm:w-1/2">
          <div className="relative aspect-[4/3] w-full overflow-hidden sm:rounded-l-2xl sm:rounded-tr-none">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.badge ? (
              <span className="absolute left-3 top-3 rounded-full border border-[#8EB1D1] bg-[#1C2B48]/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#E8ECEF]">
                {product.badge}
              </span>
            ) : null}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 border-t border-[#8EB1D1]/20 bg-[#C4D8E5]/50 p-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded border ${
                    activeImageIndex === index
                      ? "border-[#8EB1D1] ring-1 ring-[#8EB1D1]"
                      : "border-[#8EB1D1]/25 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right: Details */}
        <div className="flex w-full flex-col sm:w-1/2">
          <div className="flex-1 space-y-4 p-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#8EB1D1]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8EB1D1]">
                {product.categoryLabel}
              </span>
              <span className="rounded-full border border-[#8EB1D1]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#35506B]">
                {product.fulfillmentMode}
              </span>
            </div>

            <h2 className="text-2xl font-semibold leading-tight text-[#1C2B48]">
              {product.name}
            </h2>

            <p className="text-sm leading-6 text-[#35506B]">
              {product.description}
            </p>

            {product.includes ? (
              <div className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
                  Includes
                </p>
                <p className="mt-1 text-sm leading-6 text-[#1C2B48]">
                  {product.includes}
                </p>
              </div>
            ) : null}

            {product.availableIntentions?.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
                  Available Intentions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.availableIntentions.map((intention) => (
                    <span
                      key={intention}
                      className="rounded-full border border-[#8EB1D1]/30 bg-white/60 px-3 py-1 text-xs font-medium text-[#1C2B48]"
                    >
                      {intention}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-sm text-[#5B7893]">
              {product.fulfillmentTime}
            </p>

            {/* Quantity selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#1C2B48]">
                Qty:
              </span>
              <div className="flex items-center rounded border border-[#8EB1D1]/40 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center text-[#1C2B48] transition hover:bg-[#C4D8E5]"
                >
                  −
                </button>
                <span className="flex h-9 w-10 items-center justify-center text-sm font-semibold text-[#1C2B48]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center text-[#1C2B48] transition hover:bg-[#C4D8E5]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Price & Add to Cart */}
          <div className="border-t border-[#8EB1D1]/20 p-6">
            <div className="mb-4 flex items-baseline gap-3">
              {product.originalPrice ? (
                <p className="text-lg text-[#5B7893] line-through">
                  ${product.originalPrice} {product.currency}
                </p>
              ) : null}
              <p className="text-3xl font-semibold text-[#1C2B48]">
                ${product.price} {product.currency}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full rounded border px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] transition ${
                added
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48] hover:bg-[#A7C7E7]"
              }`}
            >
              {added ? "✓ Added to Cart" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}