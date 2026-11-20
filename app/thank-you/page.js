import ThankYouMessage from "@/components/ThankYouMessage";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Thank You | Vesper Cosmos",
  description:
    "Your Vesper Cosmos order has been received. Order confirmation and delivery details are shown here.",
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <PageHero size="sm" eyebrow="Vesper Cosmos" title="Thank You" />
      <div className="flex justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <ThankYouMessage />
      </div>
      </div>
    </main>
  );
}
