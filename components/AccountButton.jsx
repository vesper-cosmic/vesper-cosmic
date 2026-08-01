"use client";

import { signIn, signOut, useSession } from "next-auth/react";
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

  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/shop" })}
      className="flex items-center gap-2 rounded-lg border border-[#8EB1D1]/40 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.46a5.5 5.5 0 01-2.38 3.6v3h3.85c2.26-2.08 3.57-5.16 3.57-8.84z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.08 7.94-2.9l-3.85-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.33v3.1A12 12 0 0012 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.25 14.28A7.2 7.2 0 014.83 12c0-.8.15-1.57.42-2.28v-3.1H1.33a12 12 0 000 10.76l3.92-3.1z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.74 0 3.3.6 4.53 1.77l3.4-3.4A11.97 11.97 0 0012 0 12 12 0 001.33 6.62l3.92 3.1c.95-2.85 3.61-4.97 6.75-4.97z"
        />
      </svg>
      <span className="hidden sm:inline">Sign in</span>
    </button>
  );
}