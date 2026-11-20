import { CONTACT_EMAIL } from "@/lib/siteEmail";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Contact Us | VESPER COSMOS",
  description:
    "Have a question about your birth chart report, custom nail sizing, or an existing order? Contact VESPER COSMOS — we respond to all inquiries within 24–48 hours.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <PageHero
        eyebrow={<>Customer Care · We&rsquo;re Here to Help</>}
        title={<>Contact Us</>}
        subtitle={<>Have a question about your birth chart report, custom nail sizing, or an existing order? We are here to guide you.</>}
      />
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">

        {/* Contact info cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-[#1C2B48]/10 bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7893]">
              Customer Support
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#35506B]">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[#1C2B48] underline decoration-[#8EB1D1] decoration-2 underline-offset-2 transition hover:text-[#5B7893]"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-2 text-sm leading-7 text-[#5B7893]">
              We respond to all inquiries within{" "}
              <strong className="font-medium text-[#35506B]">
                24–48 hours
              </strong>{" "}
              (Monday – Friday, GMT+8).
            </p>
          </div>

          <div className="rounded-sm border border-[#1C2B48]/10 bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7893]">
              Business & Press
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#35506B]">
              For collaborations, press, or wholesale inquiries, please contact:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-[#1C2B48] underline decoration-[#8EB1D1] decoration-2 underline-offset-2 transition hover:text-[#5B7893]"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>

        {/* Contact form */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
            Send Us a Message
          </h2>
          <p className="mt-3 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            Fill out the form below and we&rsquo;ll get back to you as soon as
            possible.
          </p>

          <div className="mt-6">
            <ContactForm />
          </div>
        </section>
      </section>
    </main>
  );
}