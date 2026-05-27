import ThankYouMessage from "@/components/ThankYouMessage";

export const metadata = {
  title: "Thank You | Vesper Cosmic",
  description:
    "Your Vesper Cosmic order has been received. Order confirmation and delivery details are shown here.",
};

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07090f] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <ThankYouMessage />
      </div>
    </main>
  );
}
