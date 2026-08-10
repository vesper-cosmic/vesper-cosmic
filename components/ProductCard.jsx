export default function ProductCard({ product, featured = false }) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-[#E8ECEF] shadow-sm ${
        featured ? "border-[#8EB1D1]" : "border-[#8EB1D1]/35"
      }`}
    >
      <div className="relative aspect-[4/3] bg-[#E8ECEF]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded bg-[#1C2B48]/85 px-2 py-1 text-xs font-medium text-[#E8ECEF]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold leading-snug text-[#1C2B48]">
          {product.name}
        </h2>
        {/* 主要功效 — 卡片上只顯示一句主要功效，其餘詳細資訊在點擊進入商品後顯示 */}
        <p className="mt-2 text-sm leading-6 text-[#35506B] line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="text-xl font-semibold text-[#1C2B48]">
            ${product.price} {product.currency}
          </p>
          <a
            href={`/order/${product.slug}`}
            className="mist-button rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-medium text-[#1C2B48] transition hover:bg-[#A7C7E7]"
          >
            Order Now
          </a>
        </div>
      </div>
    </article>
  );
}