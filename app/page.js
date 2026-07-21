import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#9bc4cf]">
          Vesper Cosmic
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[#edf7f8] sm:text-5xl">
          Cosmic goods and personalized BaZi reports
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#c7d9dd]">
          A lightweight storefront for ready-to-ship ritual objects, custom BaZi
          pieces, and digital reports.
        </p>
        <Link
          href="/shop"
          className="mist-button mt-6 inline-flex rounded border border-[#b8d7df] px-4 py-2 text-sm font-semibold text-[#d8eef3] hover:bg-[#b8d7df] hover:text-[#08141b]"
        >
          View Full Shop
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {products.slice(0, 4).map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            featured={index === 0}
          />
        ))}
      </section>
    </main>
  );
}
