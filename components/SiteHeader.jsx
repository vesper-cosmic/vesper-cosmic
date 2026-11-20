"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cartContext";
import { ScrollProgress } from "@/components/ScrollEffects";

// Category links (desktop row under the logo, and the "Shop" part of the phone menu).
const SHOP_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Nails", href: "/shop?category=nails" },
  { label: "Custom BaZi Sets", href: "/shop?category=custom-nails" },
  { label: "Energy Bottles", href: "/shop?category=energy-bottles" },
  { label: "Sachets", href: "/shop?group=sachets" },
  { label: "Digital Reports", href: "/shop?category=digital-reports" },
];

const PAGE_LINKS = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Track Order", href: "/track" },
];

const iconClass = "h-[22px] w-[22px]";

function MenuIcon() {
  return (
    <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4.5 20.5c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinejoin="round" d="M5 8h14l-1.2 12.5H6.2L5 8z" />
      <path strokeLinecap="round" d="M9 10V6.5a3 3 0 016 0V10" />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg aria-hidden="true" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinejoin="round" d="M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5v-9z" />
      <path strokeLinejoin="round" d="M3 7.5l9 4.5 9-4.5M12 12v9" />
    </svg>
  );
}

/** Is this link the page being shown? Shop links compare the category/group too. */
function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (href) => {
    const [path, query = ""] = href.split("?");
    if (path !== pathname) return false;
    if (path !== "/shop") return true;
    const want = new URLSearchParams(query);
    const keys = ["category", "group"];
    return keys.every((key) => (want.get(key) || "") === (searchParams.get(key) || ""));
  };
}

function DesktopNav() {
  const isActive = useIsActive();
  return <NavLinks isActive={isActive} />;
}

function NavLinks({ isActive = () => false }) {
  return (
    <ul className="flex items-center justify-center gap-x-7 xl:gap-x-9">
      {[...SHOP_LINKS, ...PAGE_LINKS.slice(0, 3)].map((link) => {
        const active = isActive(link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`relative inline-block py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-left after:bg-[#BFA06A] after:transition-transform ${
                active
                  ? "text-[#BFA06A] after:scale-x-100"
                  : "text-[#E8ECEF] after:scale-x-0 hover:text-white hover:after:scale-x-100"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { totalItems, openCart, syncing } = useCart();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // Set by the server in the session callback (lib/auth.js).
  const isAdmin = Boolean(session?.user?.isAdmin);
  const signedIn = status === "authenticated";

  // Close the phone menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock page scroll while the phone menu is open; close it with Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Read the full URL after mounting so the server and first client render match.
  const [currentUrl, setCurrentUrl] = useState("/");
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, [pathname]);
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`;
  const accountHref = signedIn ? "/account" : signInHref;
  const firstName = session?.user?.name?.split(" ")[0] || "Account";

  const iconButton =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-[#E8ECEF] transition hover:bg-white/10 hover:text-white";

  return (
    <header className="sticky top-0 z-30 bg-[#1C2B48] text-[#E8ECEF] shadow-[0_8px_30px_rgba(18,28,48,0.25)]">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-x-1.5 px-3 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Left: menu (phones) / track order (desktop) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className={`${iconButton} lg:hidden`}
          >
            <MenuIcon />
          </button>
          <Link
            href="/track"
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#E8ECEF] transition hover:bg-white/10 hover:text-white lg:flex"
          >
            <TrackIcon />
            Track Order
          </Link>
        </div>

        {/* Center: logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Vesper Cosmos — home">
          <img src="/images/vesper-logo.png" alt="" className="h-7 w-auto flex-shrink-0 min-[360px]:h-8 sm:h-10" />
          <span className="font-display whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.12em] text-white min-[360px]:text-[14px] min-[360px]:tracking-[0.16em] min-[400px]:text-[17px] min-[400px]:tracking-[0.22em] sm:text-2xl sm:tracking-[0.28em]">
            Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
          </span>
        </Link>

        {/* Right: account, admin, cart */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#E8ECEF] transition hover:bg-white/10 lg:block"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={status === "loading" ? "#" : accountHref}
            aria-label={signedIn ? `Account (${firstName})` : "Sign in"}
            title={signedIn ? firstName : "Sign in"}
            className={`${iconButton} lg:w-auto lg:gap-2 lg:px-3`}
          >
            <PersonIcon />
            <span className="hidden max-w-28 truncate text-[12px] font-semibold uppercase tracking-[0.16em] lg:inline">
              {signedIn ? firstName : "Sign in"}
            </span>
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart (${totalItems} items)`}
            className={`${iconButton} ${syncing ? "opacity-70" : ""}`}
          >
            <BagIcon />
            {totalItems > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#BFA06A] px-1 text-[11px] font-bold text-[#1C2B48]">
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Desktop: category row */}
      <nav aria-label="Main" className="hidden border-t border-white/10 lg:block">
        <Suspense fallback={<NavLinks />}>
          <DesktopNav />
        </Suspense>
      </nav>

      {/* How far down the page you are */}
      <ScrollProgress />

      {/* Phones: slide-in menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        inert={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-[#121C30]/60 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-[#F6F7F9] text-[#1C2B48] shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between bg-[#1C2B48] px-3 text-[#E8ECEF]">
            <span className="font-display px-2 text-lg uppercase tracking-[0.24em]">Menu</span>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className={iconButton}>
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B7893]">Shop</p>
            <ul className="mt-2 divide-y divide-[#1C2B48]/10 border-y border-[#1C2B48]/10">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between py-3.5 font-display text-xl text-[#1C2B48]"
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-sm text-[#8EB1D1]">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B7893]">Help</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {PAGE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded border border-[#1C2B48]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#1C2B48]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B7893]">Member Center</p>
            <div className="mt-2 space-y-2">
              {status === "loading" ? (
                <p className="py-2 text-sm text-[#5B7893]">Loading…</p>
              ) : signedIn ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded border border-[#1C2B48]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#1C2B48]"
                  >
                    My Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/shop" });
                    }}
                    className="w-full rounded border border-[#1C2B48]/15 bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#35506B]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href={signInHref}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded bg-[#1C2B48] px-3 py-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Sign in
                </Link>
              )}
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded border border-[#1C2B48]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#1C2B48]"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
