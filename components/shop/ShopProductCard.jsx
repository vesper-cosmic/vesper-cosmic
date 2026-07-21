import Link from "next/link";

export default function ShopProductCard({ product }) {
  return (
    <article className="mist-card group flex h-full flex-col overflow-hidden rounded-lg border border-[#7fa9b5]/35 bg-[#10232d]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0b1a22]">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full border border-[#b8d7df] bg-[#08141b]/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#d8eef3]">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9bc4cf]">
          Form Type {product.formType}
        </p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#edf7f8]">
          {product.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#c7d9dd]">
          {product.description}
        </p>
        {product.includes ? (
          <p className="mt-3 text-sm leading-6 text-[#d8eef3]">
            Includes: {product.includes}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-[#9fb8bf]">{product.fulfillmentTime}</p>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            {product.originalPrice ? (
              <p className="text-sm text-[#738c93] line-through">
                ${product.originalPrice} {product.currency}
              </p>
            ) : null}
            <p className="text-2xl font-semibold text-[#d8eef3]">
              ${product.price} {product.currency}
            </p>
          </div>
          <Link
            href={`/order/${product.slug}`}
            className="mist-button rounded border border-[#b8d7df] px-4 py-2 text-sm font-semibold text-[#d8eef3] transition hover:bg-[#b8d7df] hover:text-[#08141b]"
          >
            Order Now
          </Link>
        </div>
      </div>
    </article>
  );
}
