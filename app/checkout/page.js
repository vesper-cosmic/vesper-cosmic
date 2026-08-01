import CheckoutFlow from "@/components/CheckoutFlow";

export const metadata = {
  title: "Checkout | Vesper Cosmos",
  description:
    "Complete your Vesper Cosmos order details before secure PayPal payment.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CheckoutFlow />
      </div>
    </main>
  );
}