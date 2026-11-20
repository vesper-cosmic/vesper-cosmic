import PageHero from "@/components/PageHero";
import CreatorApplicationForm from "@/components/creators/CreatorApplicationForm";

export const metadata = {
  title: "Creator & Tester Program",
  description:
    "Apply to test Vesper Cosmos Custom BaZi Crystal Press-On Nails before launch — a set designed from your birth chart, in exchange for honest reviews and videos.",
};

const GIVE = [
  ["A full custom set", "Custom BaZi Crystal Press-On Nails ($128 value), designed from your birth chart and made by hand."],
  ["Shipping on us", "Tracked shipping to your US address, with import duties prepaid — nothing to pay at the door."],
  ["Your voice in the brand", "Your feedback shapes the website, the fit and the packaging before we launch."],
];

const ASK = [
  ["A test order", "Order your set on our website with PayPal (that's where you enter your birth details and sizes) — refunded in full within 7 days."],
  ["Delivery notes", "Tell us the day it arrives and how the parcel looked."],
  ["Honest content", "Share a video or post, clearly marked #gifted or #ad, kept public for the time you choose."],
  ["Your review", "An honest written review we may show on our website."],
];

export default function CreatorsPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <PageHero
        eyebrow="Creator & Tester Program"
        title="Wear your chart. Tell it your way."
        subtitle="We're inviting a small group of testers to try our Custom BaZi Crystal Press-On Nails before launch — and share honest reviews and videos."
      />

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B7893]">What you receive</p>
            <ul className="mt-5 space-y-5">
              {GIVE.map(([title, text]) => (
                <li key={title} className="border-l border-[#BFA06A] pl-5">
                  <p className="font-display text-2xl font-medium text-[#1C2B48]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#5B7893]">{text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5B7893]">What we ask</p>
            <ol className="mt-5 space-y-5">
              {ASK.map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="font-display text-3xl leading-none text-[#BFA06A]">0{i + 1}</span>
                  <div>
                    <p className="font-display text-2xl font-medium text-[#1C2B48]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#5B7893]">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-10 border-t border-[#1C2B48]/10 pt-6 text-center text-sm leading-6 text-[#5B7893]">
          We choose a small number of testers each round, so applying doesn&rsquo;t guarantee a set. US addresses only, 18+.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <CreatorApplicationForm />
      </section>
    </main>
  );
}
