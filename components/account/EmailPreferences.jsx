"use client";

import { useEffect, useState } from "react";

/** Account page: subscribe to / unsubscribe from the newsletter. */
export default function EmailPreferences() {
  const [optIn, setOptIn] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch("/api/member/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.marketingOptIn === "boolean") setOptIn(data.marketingOptIn);
        else setMessage({ type: "error", text: data?.error || "Could not load your preferences." });
      })
      .catch(() => setMessage({ type: "error", text: "Could not load your preferences." }));
  }, []);

  async function save(next) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/member/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingOptIn: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Could not save your preferences." });
        return;
      }
      setOptIn(data.marketingOptIn);
      setMessage({
        type: "success",
        text: data.marketingOptIn
          ? "You're subscribed to our newsletter."
          : "You've been unsubscribed. You'll still receive emails about your orders.",
      });
    } catch {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
      <h2 className="text-2xl font-semibold text-[#1C2B48]">Email Preferences</h2>
      <p className="mt-2 text-sm leading-6 text-[#5B7893]">
        Choose whether you&apos;d like to receive our newsletter with new arrivals and
        offers. Order and shipping emails are always sent.
      </p>

      {optIn === null && !message ? (
        <p className="mt-4 text-sm text-[#5B7893]">Loading…</p>
      ) : optIn !== null ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-[#8EB1D1]/20 bg-white/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1C2B48]">Newsletter</p>
            <p className="text-xs text-[#5B7893]">
              {optIn ? "Subscribed" : "Not subscribed"}
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(!optIn)}
            className={`rounded border px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] transition disabled:opacity-50 ${
              optIn
                ? "border-[#8EB1D1]/50 bg-white text-[#5B7893] hover:bg-[#C4D8E5]"
                : "border-[#8EB1D1] bg-[#8EB1D1] text-[#1C2B48] hover:bg-[#A7C7E7]"
            }`}
          >
            {saving ? "Saving…" : optIn ? "Unsubscribe" : "Subscribe"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-3 text-sm ${
            message.type === "success" ? "text-[#1E8A5A]" : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
