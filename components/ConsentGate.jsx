"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { CONSENT_VERSION } from "@/lib/legal";

export const CONSENT_PENDING_KEY = "vesperConsentPending";

/**
 * After sign-in, make sure the member has accepted the current Terms,
 * Privacy Policy and Member Agreement. Acceptance ticked on the sign-in page
 * is recorded silently; otherwise (existing members, updated terms) a dialog
 * asks for it.
 */
export default function ConsentGate() {
  const { status } = useSession();
  const [needed, setNeeded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/member/consent");
        const data = await response.json();
        if (cancelled || data.accepted) return;

        let pending = "";
        try {
          pending = localStorage.getItem(CONSENT_PENDING_KEY) || "";
        } catch {
          // Storage unavailable: fall through to the dialog.
        }
        if (pending === CONSENT_VERSION && (await recordConsent())) return;
        if (!cancelled) setNeeded(true);
      } catch {
        // Network problem: don't block the visitor; ask again next time.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  async function accept() {
    setSaving(true);
    setError("");
    try {
      if (await recordConsent()) setNeeded(false);
      else setError("Could not save. Please try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!needed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C2B48]/60 px-4"
    >
      <div className="w-full max-w-md rounded-lg bg-[#E8ECEF] p-6 shadow-xl">
        <h2 id="consent-title" className="text-xl font-semibold text-[#1C2B48]">
          Please review our terms
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5B7893]">
          To continue using your member account, please review and accept our terms.
        </p>
        <ConsentCheckbox checked={checked} onChange={setChecked} />
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={!checked || saving}
            onClick={accept}
            className="flex-1 rounded border border-[#8EB1D1] bg-[#8EB1D1] px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Accept"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded border border-[#8EB1D1]/50 px-4 py-2.5 text-sm font-semibold text-[#5B7893] hover:bg-[#C4D8E5]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

async function recordConsent() {
  const response = await fetch("/api/member/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ version: CONSENT_VERSION, ageConfirmed: true }),
  });
  if (response.ok) {
    try {
      localStorage.removeItem(CONSENT_PENDING_KEY);
    } catch {
      // ignore
    }
  }
  return response.ok;
}

/** The agreement checkbox, shared by the sign-in page and the dialog. */
export function ConsentCheckbox({ checked, onChange }) {
  return (
    <label className="mt-4 flex items-start gap-2 text-left text-sm leading-6 text-[#35506B]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1"
      />
      <span>
        I am at least 13 years old and I agree to the{" "}
        <Link href="/terms" target="_blank" className="underline">
          Terms of Service
        </Link>
        ,{" "}
        <Link href="/privacy" target="_blank" className="underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/member-agreement" target="_blank" className="underline">
          Member &amp; Referral Program Agreement
        </Link>
        .
      </span>
    </label>
  );
}
