"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

const ERROR_MESSAGES = {
  OAuthSignin: "Something went wrong. Please try again.",
  OAuthCallback: "Something went wrong. Please try again.",
  OAuthCreateAccount: "Something went wrong. Please try again.",
  Callback: "There was a problem signing you in. Please try again.",
  OAuthAccountNotLinked:
    "This email was used with a different sign-in method. Please sign in the same way you originally signed up.",
  AccessDenied: "Sign-in was cancelled or not allowed.",
  default: "Sign-in failed. Please try again.",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const referralCode = searchParams.get("ref");

  const errorMessage = useMemo(
    () => (authError ? ERROR_MESSAGES[authError] || ERROR_MESSAGES.default : ""),
    [authError]
  );

  async function handleGoogle() {
    // A referral link lands back on the home page with ?ref=, where
    // ReferralTracker remembers the code and links it once signed in.
    const target = referralCode
      ? `/?ref=${encodeURIComponent(referralCode)}`
      : callbackUrl;
    await signIn("google", { callbackUrl: target });
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 sm:p-8">
          <p className="text-center text-xs uppercase tracking-[0.24em] text-[#8EB1D1]">
            Vesper Cosmos
          </p>
          <h1 className="mt-2 text-center text-3xl font-semibold text-[#1C2B48]">
            Sign In
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-[#5B7893]">
            Sign in with Google to sync your cart and default address.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGoogle}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded border border-[#8EB1D1]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5]"
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
            <span>Continue with Google</span>
          </button>

          <p className="mt-4 text-center text-xs text-[#5B7893]">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-[#8EB1D1] underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#8EB1D1] underline">
              Privacy Policy
            </Link>
            .
          </p>

          <Link
            href="/shop"
            className="mt-4 block text-center text-xs font-medium text-[#5B7893] underline transition hover:text-[#1C2B48]"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}
