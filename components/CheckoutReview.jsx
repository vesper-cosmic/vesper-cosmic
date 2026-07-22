"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProductById } from "@/data/products";

export default function CheckoutReview() {
  const [order, setOrder] = useState(null);
  const [paymentStarted, setPaymentStarted] = useState(false);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("vesperCheckoutOrder");
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  const product = useMemo(
    () => (order ? getProductById(order.productId) : null),
    [order]
  );

  if (!order || !product) {
    return (
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 text-center">
        <h1 className="text-3xl font-semibold text-[#1C2B48]">
          No order to review
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#35506B]">
          Please choose a product first and complete the intake form.
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

  function proceedToPayment() {
    const thankYouUrl = `${window.location.origin}/thank-you`;
    sessionStorage.setItem("vesperLastOrder", JSON.stringify(order));
    sessionStorage.setItem("vesperPaypalReturnHint", thankYouUrl);
    setPaymentStarted(true);
    window.open(order.paypalUrl, "_blank", "noopener,noreferrer");
  }

  function goToThankYou() {
    sessionStorage.setItem("vesperLastOrder", JSON.stringify(order));
    window.location.href = "/thank-you";
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
          <SummaryRow label="Order ID" value={order.orderId} />
          <SummaryRow label="Product" value={order.productName} />
          <SummaryRow label="Price" value={`$${order.price} ${order.currency}`} />
          <SummaryRow label="Timeline" value={order.fulfillmentTime} />
        </dl>
      </section>

      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Your Details</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <SummaryRow label="Name" value={order.fullName} />
          <SummaryRow label="Email" value={order.email} />
          {order.requiresBirthData ? (
            <>
              <SummaryRow label="Birth Date" value={order.birthDate} />
              <SummaryRow label="Birth Time" value={order.birthTime} />
              <SummaryRow label="Birth Location" value={order.birthLocation} />
              <SummaryRow label="Gender" value={order.biologicalGender} />
            </>
          ) : null}
          {order.requiresShipping ? (
            <SummaryRow
              label="Shipping Address"
              value={[
                order.address.addressLine1,
                order.address.addressLine2,
                order.address.city,
                order.address.stateProvince,
                order.address.postalCode,
                order.address.country,
              ]
                .filter(Boolean)
                .join(", ")}
            />
          ) : null}
          {order.requiresNailDetails ? (
            <>
              <SummaryRow label="Nail Shape" value={order.nailShape} />
              <SummaryRow label="Nail Length" value={order.nailLength} />
              <SummaryRow label="Style Preference" value={order.stylePreference} />
              <SummaryRow label="Mixed Set" value={order.mixedSet ? "Yes" : "No"} />
            </>
          ) : null}
        </dl>
      </section>

      <section className="rounded-lg border border-[#8EB1D1]/45 bg-[#C4D8E5] p-5 text-center">
        <p className="mb-4 rounded border border-[#8EB1D1]/35 bg-[#E8ECEF] p-3 text-sm leading-6 text-[#35506B]">
          Your order will only be confirmed after PayPal payment is completed.
          Unpaid submissions will not be processed.
        </p>
        <button
          type="button"
          onClick={proceedToPayment}
          className="mist-button w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
        >
          Proceed to Payment
        </button>
        <p className="mt-3 text-xs leading-5 text-[#5B7893]">
          PayPal will open in a new tab. After payment, return here and continue
          to the confirmation page.
        </p>
        {paymentStarted ? (
          <button
            type="button"
            onClick={goToThankYou}
            className="mt-4 w-full rounded border border-[#1C2B48] bg-[#1C2B48] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#E8ECEF] transition hover:bg-[#35506B]"
          >
            I have completed PayPal payment
          </button>
        ) : null}
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
