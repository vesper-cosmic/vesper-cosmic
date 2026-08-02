import { notFound } from "next/navigation";
import OrderIntakeForm from "@/components/forms/OrderIntakeForm";
import { getProductBySlug } from "@/lib/productServer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { product } = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Order | Vesper Cosmos",
    };
  }

  return {
    title: `Order ${product.name} | Vesper Cosmos`,
    description: `Submit your details for ${product.name}. ${product.fulfillmentTime}.`,
  };
}

export default async function ProductOrderPage({ params }) {
  const { product } = await getProductBySlug(params.slug);

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
