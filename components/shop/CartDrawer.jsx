"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";

export default function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
    cartOpen,
    closeCart,
  } = useCart();

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") closeCart();
    }
    if (cartOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        cartOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1C2B48]/60 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#E8ECEF] shadow-[0_0_60px_rgba(28,43,72,0.3)] transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#8EB1D1]/25 px-4 py-4 sm:px-5 [padding-top:max(1rem,env(safe-area-inset-top))]">
          <h2 className="text-xl font-semibold text-[#1C2B48]">
            Cart ({totalItems})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8EB1D1]/40 bg-white/60 text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {items.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-lg font-semibold text-[#1C2B48]">
                Your cart is empty
              </p>
              <p className="mt-2 text-sm text-[#5B7893]">
                Browse the shop to add items.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-[#8EB1D1]/20 bg-white/60 p-3 sm:gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 flex-shrink-0 rounded object-cover sm:h-20 sm:w-20"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold leading-tight text-[#1C2B48]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#5B7893]">
                        ${item.price} {item.currency}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center rounded border border-[#8EB1D1]/30 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-9 w-9 items-center justify-center text-sm text-[#1C2B48] transition hover:bg-[#C4D8E5]"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="flex h-9 w-8 items-center justify-center text-sm font-semibold text-[#1C2B48]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-9 w-9 items-center justify-center text-sm text-[#1C2B48] transition hover:bg-[#C4D8E5]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded px-2 py-2 text-xs font-medium text-[#8EB1D1] transition hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 ? (
          <div className="border-t border-[#8EB1D1]/25 px-4 py-4 sm:px-5 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <span className="text-base font-semibold text-[#1C2B48]">
                Total
              </span>
              <span className="text-2xl font-semibold text-[#1C2B48]">
                ${totalPrice.toFixed(2)} USD
              </span>
            </div>
            <Link
              href="/checkout"
              className="block w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
              onClick={closeCart}
            >
              Proceed to Checkout
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full py-2 text-center text-xs font-medium text-[#5B7893] underline transition hover:text-[#1C2B48]"
            >
              Clear Cart
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}