"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProductCard({ product, featured = false }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = product.images[activeImageIndex] || product.images[0];

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-[#E8ECEF] shadow-sm ${
        featured ? "border-[#8EB1D1]" : "border-[#8EB1D1]/35"
      }`}
    >
      <div className="relative aspect-[4/3] bg-[#E8ECEF]">
        <img
          src={activeImage}
          alt={`${product.name} preview ${activeImageIndex + 1}`}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded bg-[#1C2B48]/85 px-2 py-1 text-xs font-medium text-[#E8ECEF]">
          Form Type {product.formType}
        </span>
      </div>

      <div className="flex gap-2 border-b border-[#8EB1D1]/20 p-3">
        {product.images.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`Show image ${index + 1} for ${product.name}`}
            onClick={() => setActiveImageIndex(index)}
            className={`h-14 w-14 overflow-hidden rounded border ${
              activeImageIndex === index
                ? "border-[#8EB1D1]"
                : "border-[#8EB1D1]/25 hover:border-[#8EB1D1]"
            }`}
          >
            <img src={image} alt="" className="h-full w-full object-cover" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <h2 className="text-lg font-semibold leading-snug text-[#1C2B48]">
            {product.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#35506B]">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="text-xl font-semibold text-[#1C2B48]">
            ${product.price} {product.currency}
          </p>
          <Link
            href={`/order/${product.slug}`}
            className="mist-button rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-medium text-[#1C2B48] transition hover:bg-[#A7C7E7]"
          >
            Order Now
          </Link>
        </div>
      </div>
    </article>
  );
}
