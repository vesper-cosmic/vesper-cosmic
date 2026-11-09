import { notFound } from "next/navigation";
import OrderIntakeForm from "@/components/forms/OrderIntakeForm";
import CheckoutGate from "@/components/CheckoutGate";
import { getProductBySlug } from "@/lib/productServer";
import { isProductPublished } from "@/lib/productData";

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

  if (!isProductPublished(product)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CheckoutGate>
          <OrderIntakeForm product={product} />
        </CheckoutGate>
      </div>
    </main>
  );
}
