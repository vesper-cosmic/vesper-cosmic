"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getReferralCode, saveReferralCode } from "@/lib/referralClient";

/**
 * Remembers a ?ref= code from any page and, once the visitor is signed in,
 * links their member account to the referrer (first referrer only).
 */
export default function ReferralTracker() {
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) saveReferralCode(ref);
  }, []);

  useEffect(() => {
    if (!email) return;
    const code = getReferralCode();
    if (!code) return;

    const attemptKey = `vesperReferralApplied:${email}:${code}`;
    try {
      if (sessionStorage.getItem(attemptKey)) return;
      sessionStorage.setItem(attemptKey, "1");
    } catch {
      // ignore
    }

    fetch("/api/member/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: code }),
    }).catch(() => {});
  }, [email]);

  return null;
}
