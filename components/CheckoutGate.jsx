"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const GUEST_KEY = "vesperGuestCheckout";

/**
 * Before checkout, recommend signing in but keep guest checkout available.
 * Signed-in shoppers go straight to the form; guests choose once per visit.
 */
export default function CheckoutGate({ children }) {
  const { status } = useSession();
  const [guest, setGuest] = useState(false);
  const [returnUrl, setReturnUrl] = useState("/checkout");

  useEffect(() => {
    setReturnUrl(window.location.pathname + window.location.search);
    try {
      setGuest(sessionStorage.getItem(GUEST_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  if (status === "loading") {
    return <p className="text-sm text-[#5B7893]">Loading…</p>;
  }

  if (status === "authenticated") return children;

  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`;

  if (guest) {
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded border border-[#8EB1D1]/30 bg-white/60 px-4 py-2.5 text-sm text-[#35506B]">
          <span>Checking out as a guest.</span>
          <a href={signInHref} className="font-semibold text-[#1C2B48] underline">
            Sign in instead
          </a>
        </div>
        {children}
      </>
    );
  }

  function continueAsGuest() {
    try {
      sessionStorage.setItem(GUEST_KEY, "1");
    } catch {
      // ignore
    }
    setGuest(true);
  }

  return (
    <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
      <h2 className="text-2xl font-semibold text-[#1C2B48]">How would you like to check out?</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-lg border-2 border-[#1C2B48] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1E8A5A]">Recommended</p>
          <h3 className="mt-1 text-lg font-semibold text-[#1C2B48]">Sign in with Google</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-[#35506B]">
            <li>✓ Your nail size and address are remembered for next time</li>
            <li>✓ See all your orders and their status in one place</li>
            <li>✓ Your cart is saved on every device</li>
            <li>✓ Get your own referral link and earn commissions</li>
          </ul>
          <a
            href={signInHref}
            className="mt-5 rounded border border-[#1C2B48] bg-[#1C2B48] px-4 py-2.5 text-center text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#2B3E63]"
          >
            Sign in &amp; continue
          </a>
        </div>

        <div className="flex flex-col rounded-lg border border-[#8EB1D1]/40 bg-white/60 p-5">
          <h3 className="text-lg font-semibold text-[#1C2B48]">Continue as guest</h3>
          <p className="mt-3 text-sm leading-6 text-[#35506B]">
            No account needed. You can track your order with your order ID and email, but your
            details won&apos;t be saved for next time.
          </p>
          <button
            type="button"
            onClick={continueAsGuest}
            className="mt-auto rounded border border-[#8EB1D1] bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-[#1C2B48] transition hover:bg-[#C4D8E5] md:mt-5"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </section>
  );
}
