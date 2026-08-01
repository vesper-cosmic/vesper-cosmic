export const metadata = {
  title: "About VESPER COSMOS | Modern BaZi Mystic Boutique",
  description:
    "Discover the story behind VESPER COSMOS — where modern aesthetic design meets authentic BaZi (Four Pillars of Destiny) metaphysics, crafting custom crystal energy bottles and bespoke press-on nails aligned to your birth chart.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8EB1D1]">
            Haute Occult · Modern Mystic Boutique
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1C2B48] sm:text-5xl">
            About VESPER COSMOS
          </h1>
          <p className="mt-4 text-lg italic text-[#5B7893] sm:text-xl">
            where ancient eastern wisdom meets modern daily rituals.
          </p>
        </header>

        <div className="mt-12 space-y-6 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
          <p>
            We believe energy isn&rsquo;t something abstract—it is a personal
            frequency you carry every single day.
          </p>
          <p>
            <strong className="font-semibold text-[#1C2B48]">
              VESPER COSMOS
            </strong>{" "}
            was born at the intersection of modern aesthetic design and
            authentic BaZi (Four Pillars of Destiny) metaphysics. We translate
            complex natal element analysis into tangible, beautifully crafted
            physical ritual objects—from custom crystal energy bottles to
            bespoke BaZi press-on nails tailored to your personal birth chart.
          </p>
          <p>
            Every custom piece is individually aligned with your core elements,
            designed not just to adorn, but to empower your daily energy,
            intention, and growth.
          </p>
        </div>
      </section>
    </main>
  );
}