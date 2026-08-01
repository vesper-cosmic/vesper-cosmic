"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProductById } from "@/data/products";
import { useCart } from "@/lib/cartContext";

export default function CheckoutReview() {
  const { clearCart } = useCart();
  const [checkout, setCheckout] = useState(null);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("vesperCheckoutOrder");
    if (stored) {
      setCheckout(JSON.parse(stored));
    }
  }, []);

  if (!checkout?.orderId || !checkout?.order?.items?.length) {
    return (
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 text-center">
        <h1 className="text-3xl font-semibold text-[#1C2B48]">
          No order to review
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#35506B]">
          Please add items to your cart and complete the checkout form first.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded border border-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48]"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const order = checkout.order;
  const enrichedItems = order.items
    .map((item) => ({
      ...item,
      product: getProductById(item.productId),
    }))
    .filter((item) => item.product);

  async function proceedToPayment() {
    sessionStorage.setItem("vesperLastOrder", JSON.stringify(checkout));
    sessionStorage.setItem("vesperPaypalReturnHint", `${window.location.origin}/checkout/review`);
    setPaymentStarted(true);
    window.open(checkout.paypalUrl, "_blank", "noopener,noreferrer");
  }

  async function confirmOrder() {
    if (confirming || confirmed) return;
    setConfirming(true);

    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: checkout.orderId,
          order,
          saveAddressToMember: Boolean(order.saveAddressToMember),
        }),
      });

      if (response.ok) {
        setConfirmed(true);
        clearCart();
        sessionStorage.setItem("vesperLastOrder", JSON.stringify(checkout));
        window.location.href = "/thank-you";
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
          Step 2 of 2 — Review & Pay
        </p>
        <div className="mt-4 h-2 rounded-full bg-[#C4D8E5]">
          <div className="h-2 w-full rounded-full bg-[#8EB1D1]" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-[#1C2B48]">
          Review your order
        </h1>
      </section>

      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Order Summary</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <SummaryRow label="Order ID" value={checkout.orderId} />
          <div className="border-b border-[#8EB1D1]/15 pb-3">
            <dt className="mb-2 font-semibold text-[#8EB1D1]">Items</dt>
            <ul className="space-y-2">
              {enrichedItems.map((item) => (
                <li
                  key={`${item.productId}-${item.index}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[#1C2B48]">
                      {item.product?.name || item.productId}{" "}
                      <span className="text-[#5B7893]">× {item.quantity}</span>
                    </span>
                  </div>
                  <span className="text-[#1C2B48]">
                    $
                    {(
                      (item.product?.price || checkout.order?.total ||
                        item.price ||
                        0) *
                      item.quantity
                    ).toFixed(2)}{" "}
                    USD
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <SummaryRow label="Total" value={`$${order.total.toFixed(2)} USD`} />
        </dl>
      </section>

      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Your Details</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <SummaryRow label="Name" value={order.fullName} />
          <SummaryRow label="Email" value={order.email} />
          {order.shipping?.country ? (
            <SummaryRow
              label="Shipping Address"
              value={[
                order.shipping.addressLine1,
                order.shipping.addressLine2,
                order.shipping.city,
                order.shipping.stateProvince,
                order.shipping.postalCode,
                order.shipping.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          ) : null}
        </dl>
      </section>

      <section className="rounded-lg border border-[#8EB1D1]/45 bg-[#C4D8E5] p-5 text-center">
        <p className="mb-4 rounded border border-[#8EB1D1]/35 bg-[#E8ECEF] p-3 text-sm leading-6 text-[#35506B]">
          Your order will only be confirmed after PayPal payment is completed.
          Unpaid submissions will not be processed.
        </p>
        {!confirmed ? (
          <>
            <button
              type="button"
              onClick={proceedToPayment}
              className="mist-button w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              Proceed to Payment
            </button>
            <p className="mt-3 text-xs leading-5 text-[#5B7893]">
              PayPal will open in a new tab. After payment, return here and
              confirm below.
            </p>
            {paymentStarted ? (
              <button
                type="button"
                onClick={confirmOrder}
                disabled={confirming}
                className="mt-4 w-full rounded border border-[#1C2B48] bg-[#1C2B48] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#E8ECEF] transition hover:bg-[#35506B] disabled:opacity-60"
              >
                {confirming
                  ? "Confirming…"
                  : "I have completed PayPal payment"}
              </button>
            ) : null}
          </>
        ) : (
          <p className="py-4 text-sm text-[#35506B]">
            Order confirmed. Redirecting…
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-[#8EB1D1]/15 pb-3 sm:grid-cols-[180px_1fr]">
      <dt className="font-semibold text-[#8EB1D1]">{label}</dt>
      <dd className="text-[#1C2B48]">{value || "—"}</dd>
    </div>
  );
}