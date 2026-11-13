"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cartContext";
import AccountButton from "@/components/AccountButton";

const NAV_ITEMS = [
  { label: "Shop", href: "/shop" },
  { label: "Track Order", href: "/track" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const ADMIN_EMAILS = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export default function SiteHeader() {
  const pathname = usePathname();
  const isShop = pathname?.startsWith("/shop");
  const { totalItems, openCart, syncing } = useCart();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = Boolean(
    session?.user?.email &&
      ADMIN_EMAILS.includes(session.user.email.toLowerCase())
  );

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
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <img
            src="/images/vesper-logo.png"
            alt="Vesper Cosmos"
            className="h-9 w-auto sm:h-10"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1C2B48] transition group-hover:text-[#35506B] sm:text-base">
            Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
          </span>
        </Link>

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
              {/* Mobile: Shop (compact icon button) */}
              <Link
                href="/shop"
                aria-label="Shop"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#8EB1D1]/40 bg-white/60 text-[#1C2B48] transition hover:bg-[#C4D8E5] md:hidden"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                  />
                </svg>
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

          {/* Mobile: hamburger menu */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
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
                  d="M4 6h16M4 12h16M4 18h16"
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

          {/* Mobile account section */}
          <div className="mt-5 border-t border-[#8EB1D1]/25 pt-4">
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
                Sign in 登入
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}