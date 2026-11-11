import { isProductSoldOut, productBadges } from "@/lib/productData";

export default function ShopProductCard({ product, onClick }) {
  const soldOut = isProductSoldOut(product);
  return (
    <article
      className="mist-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#8EB1D1]/45 bg-[#E8ECEF]"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#E8ECEF]">
        <img
          src={product.images[0]}
          alt={product.name}
          className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
            soldOut ? "opacity-50 grayscale" : "opacity-90"
          }`}
        />
        {soldOut ? (
          <span className="absolute right-3 top-3 rounded-full bg-[#1C2B48] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Sold Out
          </span>
        ) : null}
        {productBadges(product).length ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {productBadges(product).map((badge) => (
              <span key={badge} className="rounded-full border border-[#8EB1D1] bg-[#1C2B48]/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#E8ECEF]">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-semibold leading-tight text-[#1C2B48] sm:text-2xl">
          {product.name}
        </h3>
        {product.nailSize ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
            Ready-made · Size {product.nailSize}
          </p>
        ) : null}

        {/* 主要功效 — 卡片上只顯示一句主要功效，其餘詳細資訊在點擊後顯示 */}
        <p className="mt-2 text-sm leading-6 text-[#35506B] line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4 sm:gap-4 sm:pt-6">
          <div>
            {product.originalPrice ? (
              <p className="text-xs text-[#5B7893] line-through sm:text-sm">
                ${product.originalPrice} {product.currency}
              </p>
            ) : null}
            <p className="text-lg font-semibold text-[#1C2B48] sm:text-2xl">
              ${product.price} {product.currency}
            </p>
          </div>
          {onClick ? (
            <span className="mist-button inline-block cursor-pointer rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]">
              View Details
            </span>
          ) : (
            <a
              href={`/order/${product.slug}`}
              className="mist-button inline-block rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            >
              Order Now
            </a>
          )}
        </div>
      </div>
    </article>
  );
}