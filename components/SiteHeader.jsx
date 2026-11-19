"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cartContext";
import AccountButton from "@/components/AccountButton";
import { OPEN_CATEGORIES_EVENT } from "@/components/shop/CategoryDrawer";

const NAV_ITEMS = [
  { label: "Shop", href: "/shop" },
  { label: "Track Order", href: "/track" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isShop = pathname?.startsWith("/shop");
  // Pages with a category list get a ☰ button (mobile) that opens the category drawer.
  const hasCategories = pathname === "/" || isShop;
  const { totalItems, openCart, syncing } = useCart();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // Set by the server in the session callback (lib/auth.js).
  const isAdmin = Boolean(session?.user?.isAdmin);

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (href) => {
    if (href === "/shop") return isShop;
    return pathname === href;
  };

  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "/";

  return (
    <header className="sticky top-0 z-30 border-b border-[#8EB1D1]/20 bg-[#E8ECEF]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {hasCategories ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_CATEGORIES_EVENT))}
              aria-label="Open categories"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#8EB1D1]/40 bg-white/60 text-[#1C2B48] transition hover:bg-[#C4D8E5] lg:hidden"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : null}
          {/* Logo */}
          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
            <img
              src="/images/vesper-logo.png"
              alt="Vesper Cosmos"
              className="h-8 w-auto flex-shrink-0 sm:h-10"
            />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1C2B48] transition group-hover:text-[#35506B] sm:text-base sm:tracking-[0.24em]">
              Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
            </span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Desktop: Track Order */}
          <Link
            href="/track"
            className="hidden rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] md:block"
          >
            Track Order
          </Link>
          {!isShop ? (
            <>
              {/* Desktop: Shop */}
              <Link
                href="/shop"
                className="hidden rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] md:block"
              >
                Shop
              </Link>
            </>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] lg:block"
            >
              Admin
            </Link>
          ) : null}

          {/* Cart (icon-only on mobile, icon+label on desktop) */}
          <button
            type="button"
            onClick={openCart}
            className={`relative flex items-center justify-center rounded-lg border border-[#8EB1D1]/40 bg-white/60 font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] ${
              syncing ? "opacity-70" : ""
            } h-10 px-2.5 text-sm sm:px-4`}
            aria-label={`Open cart (${totalItems} items)`}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1C2B48] px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            ) : null}
          </button>

          {/* Desktop: Account */}
          <div className="hidden md:block">
            <AccountButton />
          </div>

          {/* Mobile: member center (person icon) — opens the account + site links panel */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close member menu" : "Open member menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#8EB1D1]/40 bg-white/60 text-[#1C2B48] transition hover:bg-[#C4D8E5] md:hidden"
          >
            {menuOpen ? (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-x-0 bottom-0 top-[61px] z-40 transition-opacity duration-200 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-[#1C2B48]/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
        <nav
          className="absolute inset-x-0 top-0 mx-auto max-h-[calc(100dvh-61px)] overflow-y-auto rounded-b-2xl border-b border-[#8EB1D1]/25 bg-[#E8ECEF] p-5 shadow-[0_20px_60px_rgba(28,43,72,0.25)]"
          aria-label="Mobile navigation"
        >
          {/* Mobile account section */}
          <div className="mb-5 border-b border-[#8EB1D1]/25 pb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5B7893]">Member Center</p>
            {status === "loading" ? (
              <p className="rounded-lg border border-[#8EB1D1]/20 bg-white/60 px-4 py-3 text-sm text-[#5B7893]">
                Loading…
              </p>
            ) : status === "authenticated" ? (
              <div className="space-y-2">
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg border border-[#8EB1D1]/20 px-4 py-3 text-base font-semibold text-[#1C2B48] transition hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                >
                  Account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/shop" });
                  }}
                  className="w-full rounded-lg border border-[#8EB1D1]/20 px-4 py-3 text-left text-base font-semibold text-[#35506B] transition hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href={`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`}
                onClick={() => setMenuOpen(false)}
                className="block w-full rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-3 text-center text-base font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
              >
                Sign in
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg border px-4 py-3 text-base font-semibold transition ${
                    active
                      ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                      : "border-[#8EB1D1]/20 text-[#1C2B48] hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg border border-[#8EB1D1]/20 px-4 py-3 text-base font-semibold text-[#1C2B48] transition hover:border-[#8EB1D1] hover:bg-[#C4D8E5]"
              >
                Admin
              </Link>
            ) : null}
          </div>

        </nav>
      </div>
    </header>
  );
}