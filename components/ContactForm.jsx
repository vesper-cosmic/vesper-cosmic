"use client";

import { useState } from "react";

const initialForm = {
  name: "",
  email: "",
  orderNumber: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setErrors({});

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok || data?.errors) {
      setStatus("error");
      setErrors(data?.errors || {});
      return;
    }

    setStatus("success");
    setSuccess(
      "Thank you for your message! We have received it and will get back to you within 24–48 hours (Monday – Friday, GMT+8)."
    );
    setForm(initialForm);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
          {errors.name ? (
            <p className="mt-1 text-xs font-medium text-[#c05b4d]">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
          {errors.email ? (
            <p className="mt-1 text-xs font-medium text-[#c05b4d]">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="orderNumber"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
          >
            Order Number <span className="font-normal normal-case text-[#8EB1D1]">(optional)</span>
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            value={form.orderNumber}
            onChange={handleChange}
            placeholder="e.g. VC-20260801-AB12"
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            rows={6}
            required
            className="w-full resize-y rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm leading-6 text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
          {errors.message ? (
            <p className="mt-1 text-xs font-medium text-[#c05b4d]">{errors.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-50"
        >
          {status === "loading" ? "Sending..." : "Send Message"}
        </button>
      </form>

      {status === "success" ? (
        <div className="mt-4 rounded border border-[#8EB1D1]/40 bg-white/60 p-4 text-sm leading-6 text-[#1C2B48]">
          {success}
        </div>
      ) : null}

      {status === "error" && Object.keys(errors).length > 0 ? (
        <div className="mt-4 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-4 text-sm text-[#ffe1dd]">
          Please fix the errors below and try again.
        </div>
      ) : null}
    </div>
  );
}