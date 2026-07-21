"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getProductById } from "@/data/products";

export default function CheckoutReview() {
  const [order, setOrder] = useState(null);

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
      <div className="rounded-lg border border-[#7fa9b5]/35 bg-[#10232d] p-6 text-center">
        <h1 className="text-3xl font-semibold text-[#edf7f8]">
          No order to review
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#c7d9dd]">
          Please choose a product first and complete the intake form.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded border border-[#b8d7df] px-4 py-2 text-sm font-semibold text-[#d8eef3]"
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
    window.location.href = order.paypalUrl;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#7fa9b5]/35 bg-[#10232d] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#9bc4cf]">
          Step 2 of 2 — Review & Pay
        </p>
        <div className="mt-4 h-2 rounded-full bg-[#1f3944]">
          <div className="h-2 w-full rounded-full bg-[#b8d7df]" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-[#edf7f8]">
          Review your order
        </h1>
      </section>

      <section className="rounded-lg border border-[#7fa9b5]/35 bg-[#10232d] p-5">
        <h2 className="text-2xl font-semibold text-[#edf7f8]">Order Summary</h2>
        <dl className="mt-5 grid gap-4 text-sm">
          <SummaryRow label="Order ID" value={order.orderId} />
          <SummaryRow label="Product" value={order.productName} />
          <SummaryRow label="Price" value={`$${order.price} ${order.currency}`} />
          <SummaryRow label="Timeline" value={order.fulfillmentTime} />
        </dl>
      </section>

      <section className="rounded-lg border border-[#7fa9b5]/35 bg-[#10232d] p-5">
        <h2 className="text-2xl font-semibold text-[#edf7f8]">Your Details</h2>
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

      <section className="rounded-lg border border-[#b8d7df]/45 bg-[#0d1d26] p-5 text-center">
        <button
          type="button"
          onClick={proceedToPayment}
          className="mist-button w-full rounded border border-[#b8d7df] bg-[#b8d7df] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#08141b] transition hover:bg-[#d8eef3]"
        >
          Proceed to Payment
        </button>
        <p className="mt-3 text-xs leading-5 text-[#9fb8bf]">
          You will be redirected to PayPal to complete your payment securely.
        </p>
      </section>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-[#7fa9b5]/15 pb-3 sm:grid-cols-[180px_1fr]">
      <dt className="font-semibold text-[#9bc4cf]">{label}</dt>
      <dd className="text-[#edf7f8]">{value || "—"}</dd>
    </div>
  );
}
