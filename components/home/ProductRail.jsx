"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isProductSoldOut, productBadges } from "@/lib/productData";

/** Product tile: square photo, centered serif name, price. */
export function RailProductCard({ product, onOpen }) {
  const soldOut = isProductSoldOut(product);
  const original = Number(product.originalPrice) || 0;
  const price = Number(product.price) || 0;
  const salePct = original > price && price > 0 ? Math.round((1 - price / original) * 100) : 0;
  const badge = salePct ? `Sale −${salePct}%` : productBadges(product)[0];

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="group block w-full text-left focus-visible:outline-offset-4"
      aria-label={`${product.name}, $${product.price} ${product.currency || "USD"}${soldOut ? ", sold out" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#EEF1F4]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition duration-700 group-hover:scale-[1.05] ${
              soldOut ? "opacity-50 grayscale" : ""
            }`}
          />
        ) : null}
        {badge ? (
          <span
            className={`absolute left-3 top-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
              salePct ? "bg-[#9E3B4F] text-white" : "bg-[#1C2B48] text-[#E8ECEF]"
            }`}
          >
            {badge}
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute right-3 top-3 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1C2B48]">
            Sold Out
          </span>
        ) : null}
        <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-[#1C2B48]/90 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Quick View
        </span>
      </div>
      <div className="px-2 pt-4 text-center">
        <h3 className="font-display text-xl font-medium leading-tight text-[#1C2B48] sm:text-[22px]">
          {product.name}
        </h3>
        {product.nailSize ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B7893]">
            Size {product.nailSize}
          </p>
        ) : null}
        <p className="mt-2 text-[15px] text-[#1C2B48]">
          <span className={salePct ? "font-semibold text-[#9E3B4F]" : "font-semibold"}>${product.price}</span>
          {salePct ? <span className="ml-2 text-sm text-[#8A9AAD] line-through">${product.originalPrice}</span> : null}
        </p>
      </div>
    </button>
  );
}

/**
 * Horizontal row of products that scrolls sideways (swipe on phones, arrows on
 * desktop), with a thin progress line underneath. `lead` is an optional tile
 * shown first (e.g. a story card).
 */
export default function ProductRail({ eyebrow, title, href, products, lead, onOpen }) {
  const scroller = useRef(null);
  const [progress, setProgress] = useState({ start: 0, size: 1, atStart: true, atEnd: true });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress({
        start: max > 0 ? el.scrollLeft / el.scrollWidth : 0,
        size: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
        atStart: el.scrollLeft <= 4,
        atEnd: el.scrollLeft >= max - 4,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [products.length]);

  function scrollBy(direction) {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (!products.length) return null;
  const tile = "w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-[calc((100%-3*1.5rem)/4)]";

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B7893]">{eyebrow}</p>
          <h2 className="mt-2 font-display text-[34px] font-medium leading-tight text-[#1C2B48] sm:text-5xl">{title}</h2>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          {[
            { label: "Scroll left", dir: -1, disabled: progress.atStart, path: "M15 6l-6 6 6 6" },
            { label: "Scroll right", dir: 1, disabled: progress.atEnd, path: "M9 6l6 6-6 6" },
          ].map((arrow) => (
            <button
              key={arrow.label}
              type="button"
              onClick={() => scrollBy(arrow.dir)}
              disabled={arrow.disabled}
              aria-label={arrow.label}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1C2B48]/25 text-[#1C2B48] transition hover:bg-[#1C2B48] hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={arrow.path} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <ul
        ref={scroller}
        className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 sm:mx-0 sm:mt-10 sm:gap-6 sm:scroll-px-0 sm:px-0"
      >
        {lead ? <li data-reveal className={tile}>{lead}</li> : null}
        {products.map((product) => (
          <li key={product.id} data-reveal className={tile}>
            <RailProductCard product={product} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      <div className="mt-8 h-px bg-[#1C2B48]/15" aria-hidden="true">
        <div
          className="h-px bg-[#1C2B48] transition-[margin,width] duration-300"
          style={{ marginLeft: `${progress.start * 100}%`, width: `${Math.min(1, progress.size) * 100}%` }}
        />
      </div>

      {href ? (
        <div data-reveal className="mt-10 text-center">
          <Link
            href={href}
            className="inline-block border border-[#1C2B48] bg-[#1C2B48] px-9 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-transparent hover:text-[#1C2B48]"
          >
            View All
          </Link>
        </div>
      ) : null}
    </section>
  );
}
