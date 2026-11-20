"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const AUTOPLAY_MS = 6500;

/**
 * Full-width hero slider: a navy text panel beside a large photo (photo on top
 * on phones). Auto-advances unless the visitor hovers, focuses inside it, or
 * prefers reduced motion.
 * slides: [{ id, eyebrow, title, text, cta: { label, href }, image }]
 */
export default function HeroCarousel({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;
  const current = Math.min(index, Math.max(0, count - 1));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const go = useCallback((next) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return undefined;
    const timer = setTimeout(() => go(current + 1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [current, count, paused, reducedMotion, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative overflow-hidden bg-[#1C2B48]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(current - 1);
        if (event.key === "ArrowRight") go(current + 1);
      }}
    >
      <div className="relative grid">
        {slides.map((slide, i) => {
          const active = i === current;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              inert={!active}
              className={`col-start-1 row-start-1 grid transition-opacity duration-700 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] ${
                active ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
            >
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[#C4D8E5] sm:aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[560px]">
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
                      active && !reducedMotion ? "scale-105" : "scale-100"
                    }`}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#8EB1D1] to-[#1C2B48]">
                    <img src="/images/vesper-logo.png" alt="" className="h-28 w-auto opacity-80" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1C2B48]/40 to-transparent lg:bg-gradient-to-r lg:from-[#1C2B48]/30" />
              </div>

              {/* Words */}
              <div className="flex flex-col justify-center px-6 pb-16 pt-9 sm:px-12 lg:order-1 lg:px-14 lg:py-16 xl:px-20">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#BFA06A] sm:text-xs">
                  {slide.eyebrow}
                </p>
                <h2 className="mt-4 font-display text-[40px] font-medium leading-[1.02] text-white sm:text-6xl xl:text-7xl">
                  {slide.title}
                </h2>
                <span aria-hidden="true" className="mt-6 block h-px w-16 bg-[#BFA06A]" />
                <p className="mt-6 max-w-md text-[15px] leading-7 text-[#C4D8E5] sm:text-base">
                  {slide.text}
                </p>
                {slide.cta ? (
                  <Link
                    href={slide.cta.href}
                    className="mt-8 inline-flex w-fit items-center gap-3 border border-[#BFA06A] bg-[#BFA06A] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1C2B48] transition hover:bg-transparent hover:text-[#BFA06A]"
                  >
                    {slide.cta.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 sm:left-12 lg:left-14 xl:left-20">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                className="group flex h-6 items-center"
              >
                <span
                  className={`block h-[2px] transition-all duration-500 ${
                    i === current ? "w-10 bg-[#BFA06A]" : "w-5 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 z-20 hidden gap-2 sm:flex lg:bottom-6 lg:right-6">
            {[
              { label: "Previous slide", step: -1, path: "M15 6l-6 6 6 6" },
              { label: "Next slide", step: 1, path: "M9 6l6 6-6 6" },
            ].map((arrow) => (
              <button
                key={arrow.label}
                type="button"
                onClick={() => go(current + arrow.step)}
                aria-label={arrow.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-[#1C2B48]/40 text-white backdrop-blur transition hover:bg-white hover:text-[#1C2B48]"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={arrow.path} />
                </svg>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
