import OrderTrackingForm from "@/components/OrderTrackingForm";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Order Tracking | Vesper Cosmos",
  description:
    "Track the status of your Vesper Cosmos order. Enter your order ID and email to see production status and tracking information.",
};

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <PageHero
        size="sm"
        eyebrow="Order Tracking"
        title="Track Your Order"
        subtitle="Signed in? Your order history appears automatically — just select an order to see its status. Otherwise, enter your order ID (e.g. VC-20260801-AB12) and the email you used at checkout."
      />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-sm border border-[#1C2B48]/10 bg-white p-8">
          <div>
            <OrderTrackingForm />
          </div>
        </div>
      </div>
    </main>
  );
}