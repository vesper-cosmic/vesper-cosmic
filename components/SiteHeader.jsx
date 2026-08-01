"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cartContext";
import AccountButton from "@/components/AccountButton";

const ADMIN_EMAILS = String(process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export default function SiteHeader() {
  const pathname = usePathname();
  const isShop = pathname?.startsWith("/shop");
  const { totalItems, openCart } = useCart();
  const { data: session } = useSession();

  const isAdmin = Boolean(
    session?.user?.email &&
      ADMIN_EMAILS.includes(session.user.email.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#8EB1D1]/20 bg-[#E8ECEF]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <img
            src="/images/vesper-logo.png"
            alt="Vesper Cosmos"
            className="h-10 w-auto"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1C2B48] transition group-hover:text-[#35506B] sm:text-base">
            Vesper<span className="text-[#8EB1D1]"> Cosmos</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/track"
            className="hidden rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] sm:block"
          >
            Track Order
          </Link>
          {!isShop ? (
            <Link
              href="/shop"
              className="rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
            >
              Shop
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] md:block"
            >
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
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
            Cart
            {totalItems > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1C2B48] text-xs font-bold text-white">
                {totalItems}
              </span>
            ) : null}
          </button>
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
