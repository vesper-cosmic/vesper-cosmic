import OrderTrackingForm from "@/components/OrderTrackingForm";

export const metadata = {
  title: "Order Tracking | Vesper Cosmos",
  description:
    "Track the status of your Vesper Cosmos order. Enter your order ID and email to see production status and tracking information.",
};

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
            Order Tracking
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#1C2B48]">
            Track Your Order
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#35506B]">
            Enter your order ID (e.g. VC-20260801-AB12) and the email you used
            at checkout to see the current status of your order.
          </p>
          <div className="mt-6">
            <OrderTrackingForm />
          </div>
        </div>
      </div>
    </main>
  );
}