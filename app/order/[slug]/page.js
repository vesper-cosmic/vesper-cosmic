import { notFound } from "next/navigation";
import OrderIntakeForm from "@/components/forms/OrderIntakeForm";
import { getProductBySlug, products } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Order | Vesper Cosmic",
    };
  }

  return {
    title: `Order ${product.name} | Vesper Cosmic`,
    description: `Submit your details for ${product.name}. ${product.fulfillmentTime}.`,
  };
}

export default function ProductOrderPage({ params }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <OrderIntakeForm product={product} />
      </div>
    </main>
  );
}
