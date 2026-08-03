"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";

export default function AccountButton() {
  const { data: session, status } = useSession();
  const { syncing } = useCart();

  if (status === "loading") {
    return (
      <span className="rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#5B7893]">
        ...
      </span>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="hidden max-w-24 truncate sm:inline">
            {session.user.name?.split(" ")[0] || "Account"}
          </span>
          {syncing ? (
            <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#8EB1D1]" />
          ) : null}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/shop" })}
          className="rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-3 py-2 text-sm font-semibold text-[#35506B] transition hover:bg-[#C4D8E5]"
          title="Sign out"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  const target = `/auth/signin?callbackUrl=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.href : "/"
  )}`;

  return (
    <Link
      href={target}
      className="flex items-center gap-2 rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <span className="hidden sm:inline">Sign in</span>
    </Link>
  );
}