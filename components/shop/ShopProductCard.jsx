import Link from "next/link";

export default function ShopProductCard({ product }) {
  return (
    <article className="mist-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#8EB1D1]/45 bg-[#E8ECEF]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#E8ECEF]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-[#8EB1D1] bg-[#1C2B48]/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#E8ECEF]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#8EB1D1]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8EB1D1]">
            {product.categoryLabel}
          </span>
          <span className="rounded-full border border-[#8EB1D1]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#35506B]">
            {product.fulfillmentMode}
          </span>
          {product.intentionType === "single" ? (
            <span className="rounded-full border border-[#8EB1D1]/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#35506B]">
              Single Intention
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#1C2B48]">
          {product.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#35506B]">
          {product.description}
        </p>
        {product.availableIntentions?.length ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#5B7893]">
            Focus: {product.availableIntentions.join(" / ")}
          </p>
        ) : null}
        {product.includes ? (
          <p className="mt-3 text-sm leading-6 text-[#1C2B48]">
            Includes: {product.includes}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-[#5B7893]">{product.fulfillmentTime}</p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {product.originalPrice ? (
              <p className="text-sm text-[#5B7893] line-through">
                ${product.originalPrice} {product.currency}
              </p>
            ) : null}
            <p className="text-2xl font-semibold text-[#1C2B48]">
              ${product.price} {product.currency}
            </p>
          </div>
          <Link
            href={`/order/${product.slug}`}
            className="mist-button rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
          >
            Order Now
          </Link>
        </div>
      </div>
    </article>
  );
}
