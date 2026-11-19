"use client";

import { useEffect, useState } from "react";

export const OPEN_CATEGORIES_EVENT = "vesper:open-categories";

/**
 * Mobile category drawer. The header's ☰ button dispatches OPEN_CATEGORIES_EVENT;
 * this slides the list in from the left. Hidden on desktop (the sidebar shows there).
 * `children` is a function receiving `close`.
 */
export default function CategoryDrawer({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CATEGORIES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CATEGORIES_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close categories"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-[#1C2B48]/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Shop by category"
        className={`absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-[#E8ECEF] shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#8EB1D1]/30 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7893]">Shop by Category</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#8EB1D1]/40 bg-white/60 text-[#1C2B48]"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{open ? children(() => setOpen(false)) : null}</div>
      </aside>
    </div>
  );
}
