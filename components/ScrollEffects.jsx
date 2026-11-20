"use client";

import { useEffect, useRef } from "react";

/**
 * Inline script for the top of <body>: marks the page as ready for reveal
 * animations before anything paints (so nothing flashes), unless the visitor
 * prefers reduced motion. If the reveal code never starts, a safety timer
 * shows everything after 3 s.
 */
export const REVEAL_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;d.classList.add('reveal-ready');setTimeout(function(){if(!window.__vcReveal)d.classList.remove('reveal-ready')},3000)}catch(e){}})();`;

const STAGGER_MS = 90;
const MAX_STAGGER_MS = 450;

/**
 * Elements with data-reveal fade/slide in the first time they scroll into
 * view. Elements that enter together are staggered. New elements (client
 * navigation, products loading) are picked up automatically.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("reveal-ready")) return undefined;
    window.__vcReveal = true;

    const show = (el, delay) => {
      el.style.transitionDelay = `${delay}ms`;
      el.classList.add("is-revealed");
      // Clear the delay afterwards so later hover transitions aren't slowed.
      setTimeout(() => {
        el.style.transitionDelay = "";
      }, delay + 900);
    };

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((entry) => {
            io.unobserve(entry.target);
            show(entry.target, Math.min(i * STAGGER_MS, MAX_STAGGER_MS));
            i += 1;
          });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    // Tracked per run (not as a DOM attribute) so a re-run of this effect —
    // e.g. React Strict Mode in development — observes everything again.
    const watched = new WeakSet();
    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => {
        if (watched.has(el)) return;
        watched.add(el);
        io.observe(el);
      });
    };

    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    scan();
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/** Thin gold bar along the bottom of the sticky header showing how far down the page you are. */
export function ScrollProgress() {
  const bar = useRef(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
      <div ref={bar} className="h-full origin-left bg-gradient-to-r from-[#BFA06A] to-[#E2C98F]" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
