"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PR_CONTENT_TYPES,
  PR_PLATFORMS,
  PR_POST_TIMELINES,
  PR_PRESS_ON_EXPERIENCE,
  PR_PUBLIC_DURATIONS,
  PR_USAGE_RIGHTS,
  US_STATES,
  emptyPrApplication,
  normalizePrApplication,
  validatePrApplication,
} from "@/lib/prProgram";

const input =
  "w-full rounded-sm border bg-white px-3 py-2.5 text-sm text-[#1C2B48] outline-none transition focus:border-[#1C2B48]";
const inputClass = (error) => `${input} ${error ? "border-[#B03A48]" : "border-[#1C2B48]/20"}`;

function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B7893]">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-[#5B7893]">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-[#B03A48]">{error}</span> : null}
    </label>
  );
}

function Section({ step, title, intro, children }) {
  return (
    <section className="border border-[#1C2B48]/10 bg-white p-5 sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#BFA06A]">Step {step}</p>
      <h2 className="mt-2 font-display text-3xl font-medium text-[#1C2B48]">{title}</h2>
      {intro ? <p className="mt-2 text-sm leading-6 text-[#5B7893]">{intro}</p> : null}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function ChoiceGroup({ label, options, value, onChange, error, multiple = false }) {
  const selected = multiple ? value : [value];
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B7893]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const id = typeof option === "string" ? option : option.id;
          const text = typeof option === "string" ? option : option.label;
          const on = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (!multiple) return onChange(id);
                onChange(on ? value.filter((v) => v !== id) : [...value, id]);
              }}
              className={`border px-3.5 py-2 text-left text-sm transition ${
                on ? "border-[#1C2B48] bg-[#1C2B48] text-white" : "border-[#1C2B48]/20 bg-white text-[#1C2B48] hover:border-[#1C2B48]/50"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-[#B03A48]">{error}</p> : null}
    </fieldset>
  );
}

function Check({ checked, onChange, error, children }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#35506B]">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#1C2B48]" />
        <span>{children}</span>
      </label>
      {error ? <p className="ml-7 mt-0.5 text-xs font-medium text-[#B03A48]">{error}</p> : null}
    </div>
  );
}

export default function CreatorApplicationForm() {
  const [form, setForm] = useState(emptyPrApplication);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const agree = (patch) => setForm((prev) => ({ ...prev, agreements: { ...prev.agreements, ...patch } }));
  const setSocial = (index, patch) =>
    setForm((prev) => ({ ...prev, social: prev.social.map((row, i) => (i === index ? { ...row, ...patch } : row)) }));

  async function submit(event) {
    event.preventDefault();
    const found = validatePrApplication(normalizePrApplication(form));
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector("[data-form-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/pr-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors || { submit: "Something went wrong. Please try again." });
        return;
      }
      setDone(data.applicationId || "received");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ submit: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-[#1C2B48]/10 bg-white p-8 text-center sm:p-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#BFA06A]">Application received</p>
        <h2 className="mt-3 font-display text-4xl font-medium text-[#1C2B48]">Thank you, {form.firstName}.</h2>
        {done !== "received" ? (
          <p className="mt-4 text-sm text-[#5B7893]">
            Your application number is <strong className="text-[#1C2B48]">{done}</strong>.
          </p>
        ) : null}
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-[#35506B]">
          We read every application ourselves. If you&rsquo;re selected, we&rsquo;ll email you a link to place your test
          order — please check out with <strong>{form.email}</strong> so we can match it to your application.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block border border-[#1C2B48] bg-[#1C2B48] px-8 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#2A3D60]"
        >
          Explore the shop
        </Link>
      </div>
    );
  }

  const errorCount = Object.keys(errors).filter((k) => k !== "submit").length;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set({ website: e.target.value })} />
        </label>
      </div>

      <Section step="1" title="About you" intro="Use the email you'll check out with — that's how we match your test order to this application.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            <input className={inputClass(errors.firstName)} autoComplete="given-name" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input className={inputClass(errors.lastName)} autoComplete="family-name" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          <input type="email" className={inputClass(errors.email)} autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Field label="City" error={errors.city}>
            <input className={inputClass(errors.city)} autoComplete="address-level2" value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="State" error={errors.state}>
            <select className={inputClass(errors.state)} autoComplete="address-level1" value={form.state} onChange={(e) => set({ state: e.target.value })}>
              <option value="">Select…</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section step="2" title="Where you'll share" intro="Small accounts are welcome — we care about honest, genuine content more than follower counts.">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B7893]">Your accounts</p>
          {form.social.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_8rem_auto]">
              <select aria-label="Platform" className={inputClass()} value={row.platform} onChange={(e) => setSocial(index, { platform: e.target.value })}>
                <option value="">Platform…</option>
                {PR_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input aria-label="Handle or link" placeholder="@handle or profile link" className={inputClass()} value={row.handle} onChange={(e) => setSocial(index, { handle: e.target.value })} />
              <input aria-label="Followers" inputMode="numeric" placeholder="Followers" className={inputClass()} value={row.followers} onChange={(e) => setSocial(index, { followers: e.target.value })} />
              {form.social.length > 1 ? (
                <button type="button" onClick={() => set({ social: form.social.filter((_, i) => i !== index) })} className="px-2 text-sm text-[#B03A48]" aria-label="Remove account">
                  Remove
                </button>
              ) : <span />}
            </div>
          ))}
          {errors.social ? <p className="text-xs font-medium text-[#B03A48]">{errors.social}</p> : null}
          {form.social.length < 8 ? (
            <button
              type="button"
              onClick={() => set({ social: [...form.social, { platform: "", handle: "", followers: "" }] })}
              className="border border-dashed border-[#1C2B48]/40 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1C2B48]"
            >
              + Add another account
            </button>
          ) : null}
        </div>
        <ChoiceGroup label="What could you create?" options={PR_CONTENT_TYPES} value={form.contentTypes} multiple onChange={(v) => set({ contentTypes: v })} error={errors.contentTypes} />
        <Field label="Links to a few posts you're proud of (optional)">
          <textarea rows={2} className={inputClass()} value={form.portfolio} onChange={(e) => set({ portfolio: e.target.value })} />
        </Field>
        <ChoiceGroup label="When could you post?" options={PR_POST_TIMELINES} value={form.postTimeline} onChange={(v) => set({ postTimeline: v })} error={errors.postTimeline} />
        <ChoiceGroup label="How long can your posts stay public?" options={PR_PUBLIC_DURATIONS} value={form.publicDuration} onChange={(v) => set({ publicDuration: v })} error={errors.publicDuration} />
        <ChoiceGroup label="Content use (optional)" options={PR_USAGE_RIGHTS} value={form.usageRights} multiple onChange={(v) => set({ usageRights: v })} />
      </Section>

      <Section step="3" title="A little more about you">
        <ChoiceGroup label="Have you worn press-on nails before?" options={PR_PRESS_ON_EXPERIENCE} value={form.pressOnExperience} onChange={(v) => set({ pressOnExperience: v })} error={errors.pressOnExperience} />
        <Field label="Any sensitivity to nail glue or adhesive tabs? (optional)">
          <input className={inputClass()} value={form.adhesiveSensitivity} onChange={(e) => set({ adhesiveSensitivity: e.target.value })} />
        </Field>
        <Field label="Why would you like to try Vesper Cosmos? (optional)">
          <textarea rows={4} className={inputClass()} value={form.about} onChange={(e) => set({ about: e.target.value })} />
        </Field>
        <Field label="How did you hear about us? (optional)">
          <input className={inputClass()} value={form.heardFrom} onChange={(e) => set({ heardFrom: e.target.value })} />
        </Field>
      </Section>

      <Section step="4" title="Before you send">
        <div className="border-l-2 border-[#BFA06A] bg-[#F6F7F9] p-4 text-sm leading-6 text-[#35506B]">
          <p className="font-semibold text-[#1C2B48]">How the test order works</p>
          <p className="mt-1">
            If you&rsquo;re selected, you&rsquo;ll order the custom set on our website at full price ($128) and pay with
            PayPal — that&rsquo;s where you enter your birth details, nail sizes and shipping address. We refund the full
            amount through PayPal to your original payment method within 7 days, whether or not you&rsquo;ve posted yet
            and whatever you think of the set.
          </p>
        </div>
        <Check checked={form.agreements.adult} onChange={(v) => agree({ adult: v })} error={errors.adult}>
          I am 18 or older.
        </Check>
        <Check checked={form.agreements.usResident} onChange={(v) => agree({ usResident: v })} error={errors.usResident}>
          My shipping address is in the United States.
        </Check>
        <Check checked={form.agreements.testOrder} onChange={(v) => agree({ testOrder: v })} error={errors.testOrder}>
          If selected, I&rsquo;ll place the test order with PayPal using this email, and I understand it will be refunded
          in full within 7 days.
        </Check>
        <Check checked={form.agreements.disclosure} onChange={(v) => agree({ disclosure: v })} error={errors.disclosure}>
          I will clearly disclose that I received the set free (for example #gifted or #ad, in the caption and on screen), as
          the FTC requires.
        </Check>
        <Check checked={form.agreements.honest} onChange={(v) => agree({ honest: v })} error={errors.honest}>
          I understand Vesper Cosmos wants my honest opinion — I&rsquo;m not required to say anything positive.
        </Check>
        <Check checked={form.agreements.feedback} onChange={(v) => agree({ feedback: v })} error={errors.feedback}>
          If selected, I&rsquo;ll share feedback on the website and checkout, and tell you when the parcel arrives and how
          it was packed.
        </Check>
        <Check checked={form.agreements.privacy} onChange={(v) => agree({ privacy: v })} error={errors.privacy}>
          Vesper Cosmos may store these details to review my application, as described in the{" "}
          <Link href="/privacy#section-3" className="underline" target="_blank">Privacy Policy</Link>. I can ask for them to
          be deleted at any time.
        </Check>
      </Section>

      {errors.submit ? (
        <p data-form-error className="border border-[#B03A48]/30 bg-[#FBEFF1] p-3 text-sm text-[#B03A48]">{errors.submit}</p>
      ) : errorCount ? (
        <p data-form-error className="border border-[#B03A48]/30 bg-[#FBEFF1] p-3 text-sm text-[#B03A48]">
          Please check the {errorCount === 1 ? "field" : `${errorCount} fields`} marked in red.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full border border-[#1C2B48] bg-[#1C2B48] px-8 py-4 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-[#2A3D60] disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send my application"}
      </button>
    </form>
  );
}
