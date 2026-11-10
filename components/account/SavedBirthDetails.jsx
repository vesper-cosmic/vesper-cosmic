"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartContext";

/** Account page: the birth details the member chose to save, with a delete button. */
export default function SavedBirthDetails() {
  const { member, saveDefaultBirthData } = useCart();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);
  const saved = member?.defaultBirthData?.birthDate ? member.defaultBirthData : null;

  async function remove() {
    if (!window.confirm("Delete your saved birth details?")) return;
    setDeleting(true);
    setMessage(null);
    const result = await saveDefaultBirthData(null);
    setDeleting(false);
    setMessage(
      result?.ok
        ? { type: "success", text: "Your saved birth details have been deleted." }
        : { type: "error", text: "Could not delete them right now — please try again." }
    );
  }

  if (!saved && !message) return null;

  return (
    <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
      <h2 className="text-2xl font-semibold text-[#1C2B48]">Saved Birth Details</h2>
      <p className="mt-2 text-sm leading-6 text-[#5B7893]">
        You chose to save these for your next BaZi order. They&apos;re only used to fill in your
        order form.
      </p>

      {saved ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-[#8EB1D1]/20 bg-white/60 px-4 py-3">
          <dl className="grid gap-x-6 gap-y-1 text-sm text-[#1C2B48] sm:grid-cols-2">
            <Row label="Date of birth" value={saved.birthDate} />
            <Row label="Birth time" value={saved.birthTime} />
            <Row label="Biological gender" value={saved.biologicalGender} />
            <Row label="Daylight saving" value={saved.daylightSavingTime} />
            <Row label="Birthplace" value={saved.birthLocation} />
          </dl>
          <button
            type="button"
            disabled={deleting}
            onClick={remove}
            className="rounded border border-[#8EB1D1]/50 bg-white px-4 py-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5B7893] transition hover:bg-[#C4D8E5] disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className={`mt-3 text-sm ${message.type === "success" ? "text-[#1E8A5A]" : "text-red-500"}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-[#5B7893]">{label}:</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
