import Link from "next/link";

export default function ShopProductCard({ product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#a88945]/35 bg-[#101521] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#090c14]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-[#d8b96f] bg-[#07090f]/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f4d88a]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b59b61]">
          Form Type {product.formType}
        </p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#f8f1df]">
          {product.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#d8ceb7]">
          {product.description}
        </p>
        {product.includes ? (
          <p className="mt-3 text-sm leading-6 text-[#f4d88a]">
            Includes: {product.includes}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-[#bfb49d]">{product.fulfillmentTime}</p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {product.originalPrice ? (
              <p className="text-sm text-[#8c826f] line-through">
                ${product.originalPrice} {product.currency}
              </p>
            ) : null}
            <p className="text-2xl font-semibold text-[#f4d88a]">
              ${product.price} {product.currency}
            </p>
          </div>
          <Link
            href={`/order/${product.slug}`}
            className="rounded border border-[#d8b96f] px-4 py-2 text-sm font-semibold text-[#f4d88a] transition hover:bg-[#d8b96f] hover:text-[#07090f]"
          >
            Order Now
          </Link>
        </div>
      </div>
    </article>
  );
}
