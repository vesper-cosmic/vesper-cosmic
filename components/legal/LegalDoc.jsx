import { LEGAL } from "@/lib/legal";
import PageHero from "@/components/PageHero";

/**
 * Shared layout for legal pages.
 * sections: [{ title, paragraphs?: ReactNode[], bullets?: ReactNode[], after?: ReactNode[] }]
 */
export default function LegalDoc({ kicker, title, intro = [], sections = [], showAddress = true }) {
  return (
    <main className="min-h-screen bg-transparent">
      <PageHero
        eyebrow={<>{kicker}</>}
        title={<>{title}</>}
        subtitle={<>Effective: {LEGAL.effectiveDate}</>}
      />
      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">

        {intro.length ? (
          <div className="mt-10 space-y-5 text-base leading-8 text-[#35506B] sm:text-lg sm:leading-9">
            {intro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        {sections.length > 3 ? (
          <nav aria-label="Contents" className="mt-10 rounded-sm border border-[#1C2B48]/10 bg-white/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5B7893]">Contents</p>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-[#35506B] sm:grid-cols-2">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#section-${index + 1}`} className="hover:text-[#1C2B48] hover:underline">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {sections.map((section, index) => (
          <section key={section.title} id={`section-${index + 1}`} data-reveal className="mt-12 scroll-mt-24 lg:scroll-mt-36">
            <h2 className="text-2xl font-semibold text-[#1C2B48] sm:text-3xl">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-5 space-y-4 text-base leading-8 text-[#35506B]">
              {(section.paragraphs || []).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul className="space-y-3">
                  {section.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-sm border border-[#1C2B48]/10 bg-white p-4"
                    >
                      <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EB1D1]" />
                      <span className="text-sm leading-7 sm:text-base">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {(section.after || []).map((paragraph, i) => (
                <p key={`after-${i}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-14 rounded-sm border border-[#1C2B48]/10 bg-white p-6 text-[#35506B]">
          <h2 className="text-xl font-semibold text-[#1C2B48]">Contact Us</h2>
          <p className="mt-3 leading-7">
            {LEGAL.operatorDescription}
            {LEGAL.representative ? (
              <>
                <br />
                Representative: {LEGAL.representative}
              </>
            ) : null}
            {LEGAL.taiwanBusinessId ? (
              <>
                <br />
                Taiwan Business ID: {LEGAL.taiwanBusinessId}
              </>
            ) : null}
            {LEGAL.phone ? (
              <>
                <br />
                Phone: {LEGAL.phone}
              </>
            ) : null}
            <br />
            Email:{" "}
            <a href={`mailto:${LEGAL.contactEmail}`} className="text-[#5B7893] underline">
              {LEGAL.contactEmail}
            </a>
            {showAddress && LEGAL.mailingAddress ? (
              <>
                <br />
                Mailing address: {LEGAL.mailingAddress}
              </>
            ) : null}
          </p>
        </section>
      </section>
    </main>
  );
}

export function A({ href, children }) {
  return (
    <a href={href} className="font-medium text-[#1C2B48] underline decoration-[#8EB1D1] underline-offset-2">
      {children}
    </a>
  );
}

export function B({ children }) {
  return <strong className="font-semibold text-[#1C2B48]">{children}</strong>;
}
