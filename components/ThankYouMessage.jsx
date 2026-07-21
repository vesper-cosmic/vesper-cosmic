"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ThankYouMessage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const storedOrder =
      sessionStorage.getItem("vesperLastOrder") ||
      sessionStorage.getItem("vesperCheckoutOrder");

    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    }
  }, []);

  if (!order) {
    return (
      <MessageShell>
        <h1 className="text-4xl font-semibold text-[#1C2B48]">
          Your order has been received
        </h1>
        <p className="mt-4 text-base leading-7 text-[#35506B]">
          Thank you. I'll be in touch within 24 hours to confirm your order
          details.
        </p>
      </MessageShell>
    );
  }

  const isDigitalOnly = order.productKind === "Digital" || !order.requiresShipping;

  return (
    <MessageShell>
      <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
        Order {order.orderId}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-[#1C2B48]">
        Your order has been received
      </h1>
      <p className="mt-4 text-base leading-7 text-[#35506B]">
        Thank you, {order.fullName}. I'll be in touch within 24 hours to confirm
        your order details.
      </p>
      {isDigitalOnly ? (
        <p className="mt-4 text-base leading-7 text-[#35506B]">
          Your personalized PDF report will be delivered to {order.email} within
          3–5 business days.
        </p>
      ) : (
        <p className="mt-4 text-base leading-7 text-[#35506B]">
          Your handcrafted item timeline: {order.fulfillmentTime}. You'll
          receive a tracking number by email once it ships.
        </p>
      )}
      <p className="mt-6 text-sm leading-6 text-[#1C2B48]">
        Questions? Email me at vesper.cosmic.blueprint@gmail.com
      </p>
      <Link
        href="/shop"
        className="mist-button mt-7 inline-flex rounded border border-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48] hover:bg-[#8EB1D1] hover:text-[#1C2B48]"
      >
        Back to Shop
      </Link>
    </MessageShell>
  );
}

function MessageShell({ children }) {
  return (
    <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      {children}
    </div>
  );
}
