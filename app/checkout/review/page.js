import CheckoutReview from "@/components/CheckoutReview";

export const metadata = {
  title: "Review & Pay | Vesper Cosmos",
  description:
    "Review your Vesper Cosmos order details before completing secure PayPal payment.",
};

export default function CheckoutReviewPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CheckoutReview />
      </div>
    </main>
  );
}