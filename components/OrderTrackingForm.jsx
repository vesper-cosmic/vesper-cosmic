"use client";

import { useState } from "react";
import Link from "next/link";

export default function OrderTrackingForm() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setOrder(null);

    const params = new URLSearchParams({ orderId, email });
    const response = await fetch(`/api/track?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setError(data?.error || "Could not find your order. Please check the order ID and email.");
      return;
    }

    if (!data?.found) {
      setStatus("error");
      setError("We couldn't find an order with that order ID and email.");
      return;
    }

    setOrder(data.order);
    setStatus("success");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="orderId" className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
            Order ID
          </label>
          <input
            id="orderId"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. VC-20260801-AB12"
            required
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-50"
        >
          {status === "loading" ? "Tracking..." : "Track Order"}
        </button>
      </form>

      {status === "error" ? (
        <div className="mt-4 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-4 text-sm text-[#ffe1dd]">
          {error}
        </div>
      ) : null}

      {status === "success" && order ? (
        <div className="mt-6 space-y-4">
          <div className="rounded bg-white/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
              Order {order.orderId}
            </p>
            <p className="mt-2 text-base font-semibold text-[#1C2B48]">
              {order.productName}
            </p>
            <p className="mt-1 text-sm text-[#5B7893]">
              Placed {formatDate(order.createdAt)} · ${Number(order.amount).toFixed(2)} USD
            </p>
          </div>

          <StatusRow label="Payment">
            {order.paymentStatus || "N/A"}
          </StatusRow>
          <StatusRow label="Production">
            {order.productionStatus || "N/A"}
          </StatusRow>
          {order.trackingNumber ? (
            <StatusRow label="Tracking Number">
              <span className="font-mono">{order.trackingNumber}</span>
            </StatusRow>
          ) : (
            <StatusRow label="Tracking Number">
              Not shipped yet — you'll receive an email once it ships.
            </StatusRow>
          )}
          {order.shippingDate ? (
            <StatusRow label="Shipped On">
              {formatDate(order.shippingDate)}
            </StatusRow>
          ) : null}

          <p className="text-sm leading-6 text-[#5B7893]">
            Questions? Email{" "}
            <a
              href="mailto:vesper.cosmic.blueprint@gmail.com"
              className="text-[#8EB1D1] underline"
            >
              vesper.cosmic.blueprint@gmail.com
            </a>
          </p>
          <Link
            href="/shop"
            className="mist-button inline-flex rounded border border-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] hover:bg-[#8EB1D1]"
          >
            Back to Shop
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function StatusRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded bg-white/60 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
        {label}
      </span>
      <span className="text-right text-sm text-[#1C2B48]">{children}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}