import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Hook to automatically apply referral code from URL if user is signed in
 */
export function useReferral() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  useEffect(() => {
    const ref = searchParams.get("ref");

    // Only apply referral if:
    // 1. There's a ref parameter
    // 2. User is signed in
    // 3. We haven't already tried (stored in sessionStorage to avoid duplicate attempts)
    if (ref && session?.user?.email) {
      const alreadyTried = sessionStorage.getItem("referral_attempted");
      if (!alreadyTried) {
        sessionStorage.setItem("referral_attempted", "true");
        applyReferral(ref);
      }
    }
  }, [searchParams, session?.user?.email]);

  return null;
}

async function applyReferral(referralCode) {
  try {
    const res = await fetch("/api/member/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode }),
    });

    if (res.ok) {
      console.log("Referral code applied successfully");
    } else {
      const data = await res.json();
      console.warn("Failed to apply referral:", data.error);
    }
  } catch (error) {
    console.error("Error applying referral:", error);
  }
}
