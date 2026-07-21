import CheckoutReview from "@/components/CheckoutReview";

export const metadata = {
  title: "Review & Pay | Vesper Cosmic",
  description:
    "Review your Vesper Cosmic order details before completing secure PayPal payment.",
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CheckoutReview />
      </div>
    </main>
  );
}
