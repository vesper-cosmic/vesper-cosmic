"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

const ERROR_MESSAGES = {
  CredentialsSignin:
    "Incorrect email or password, or this account has no password yet. If you signed up with Google, please use “Continue with Google”.",
  OAuthSignin: "Something went wrong. Please try again.",
  OAuthCallback: "Something went wrong. Please try again.",
  OAuthCreateAccount: "Something went wrong. Please try again.",
  EmailCreateAccount: "Something went wrong. Please try again.",
  Callback: "There was a problem signing you in. Please try again.",
  OAuthAccountNotLinked:
    "This email was used with a different sign-in method. Please sign in the same way you originally signed up.",
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const referralCode = searchParams.get("ref");

  const [mode, setMode] = useState("signin"); // "signin" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [referralInfo, setReferralInfo] = useState(referralCode ? { code: referralCode, trying: false, done: false } : null);

  const errorMessage = useMemo(
    () => (authError ? ERROR_MESSAGES[authError] || ERROR_MESSAGES.default : ""),
    [authError]
  );

  async function handleGoogle() {
    setFormError("");
    if (referralCode) {
      localStorage.setItem("pendingReferralCode", referralCode);
    }
    await signIn("google", { callbackUrl });
  }

  async function tryApplyReferral() {
    if (!referralInfo || referralInfo.trying || referralInfo.done) return;

    setReferralInfo((prev) => ({ ...prev, trying: true }));

    try {
      const res = await fetch("/api/member/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralInfo.code }),
      });

      const data = await res.json();
      if (res.ok) {
        setReferralInfo((prev) => ({ ...prev, done: true, trying: false, success: true }));
        localStorage.removeItem("pendingReferralCode");
      } else {
        setReferralInfo((prev) => ({ ...prev, trying: false, error: data.error }));
      }
    } catch (error) {
      setReferralInfo((prev) => ({ ...prev, trying: false, error: "Failed to apply referral code" }));
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errors = data?.errors || {};
        setFormError(
          errors.email ||
            errors.password ||
            errors.form ||
            "Registration failed. Please try again."
        );
        return;
      }

      // Registration succeeded (either fresh or linked to a Google account).
      // Sign the user in automatically with credentials.
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Credentials sign-in failed right after registration — unusual,
        // but still tell the user their account is ready.
        if (data?.linked) {
          setSuccessMessage(
            "This email is now linked to your account. Please sign in."
          );
        } else {
          setSuccessMessage("Account created! Please sign in.");
        }
        setMode("signin");
        return;
      }

      // Try to apply referral code if present
      if (referralCode) {
        try {
          await fetch("/api/member/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode }),
          });
        } catch {
          // Silently fail, don't block the sign-in flow
        }
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Something went wrong during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setFormError("");

    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);

    if (result?.error) {
      setFormError(ERROR_MESSAGES.CredentialsSignin);
      return;
    }

    // Try to apply referral code if present
    if (referralCode) {
      try {
        await fetch("/api/member/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode }),
        });
      } catch {
        // Silently fail, don't block the sign-in flow
      }
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const inputClass =
    "w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2.5 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]";

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 sm:p-8">
          <p className="text-center text-xs uppercase tracking-[0.24em] text-[#8EB1D1]">
            Vesper Cosmos
          </p>
          <h1 className="mt-2 text-center text-3xl font-semibold text-[#1C2B48]">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="mt-2 text-center text-sm leading-6 text-[#5B7893]">
            {mode === "signin"
              ? "Sign in to sync your cart and default address."
              : "Create an account to sync your cart and default address."}
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : null}

          {formError ? (
            <div className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {formError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 rounded border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded border border-[#8EB1D1]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#1C2B48] transition hover:bg-[#C4D8E5] disabled:opacity-60"
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

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#8EB1D1]/30" />
            <span className="text-xs uppercase tracking-wide text-[#5B7893]">
              or
            </span>
            <div className="h-px flex-1 bg-[#8EB1D1]/30" />
          </div>

          {/* Mode switcher */}
          <div className="mb-4 flex rounded-lg border border-[#8EB1D1]/40 bg-white/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setFormError("");
                setSuccessMessage("");
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-[#C4D8E5] text-[#1C2B48]"
                  : "text-[#5B7893] hover:text-[#1C2B48]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setFormError("");
                setSuccessMessage("");
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-[#C4D8E5] text-[#1C2B48]"
                  : "text-[#5B7893] hover:text-[#1C2B48]"
              }`}
            >
              Register
            </button>
          </div>

          <form
            onSubmit={mode === "signin" ? handleSignIn : handleRegister}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-[#5B7893] hover:text-[#1C2B48]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "register" ? (
                <p className="mt-1 text-xs text-[#5B7893]">
                  At least 8 characters. If you have signed in with Google using this email, it will be linked to the same account.
                </p>
              ) : null}
            </div>

            {mode === "register" ? (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                />
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-60"
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[#5B7893]">
            By creating an account, you agree to our{" "}
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