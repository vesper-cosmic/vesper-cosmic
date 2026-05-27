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
        <h1 className="text-4xl font-semibold text-[#f8f1df]">
          Your order has been received
        </h1>
        <p className="mt-4 text-base leading-7 text-[#d8ceb7]">
          Thank you. I'll be in touch within 24 hours to confirm your order
          details.
        </p>
      </MessageShell>
    );
  }

  const isDigitalOnly = order.productKind === "Digital" || !order.requiresShipping;

  return (
    <MessageShell>
      <p className="text-sm uppercase tracking-[0.24em] text-[#b59b61]">
        Order {order.orderId}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-[#f8f1df]">
        Your order has been received
      </h1>
      <p className="mt-4 text-base leading-7 text-[#d8ceb7]">
        Thank you, {order.fullName}. I'll be in touch within 24 hours to confirm
        your order details.
      </p>
      {isDigitalOnly ? (
        <p className="mt-4 text-base leading-7 text-[#d8ceb7]">
          Your personalized PDF report will be delivered to {order.email} within
          3–5 business days.
        </p>
      ) : (
        <p className="mt-4 text-base leading-7 text-[#d8ceb7]">
          Your handcrafted item timeline: {order.fulfillmentTime}. You'll
          receive a tracking number by email once it ships.
        </p>
      )}
      <p className="mt-6 text-sm leading-6 text-[#f4d88a]">
        Questions? Email me at vesper.cosmic.blueprint@gmail.com
      </p>
      <Link
        href="/shop"
        className="mt-7 inline-flex rounded border border-[#d8b96f] px-4 py-2 text-sm font-semibold text-[#f4d88a] hover:bg-[#d8b96f] hover:text-[#07090f]"
      >
        Back to Shop
      </Link>
    </MessageShell>
  );
}

function MessageShell({ children }) {
  return (
    <div className="rounded-lg border border-[#a88945]/35 bg-[#101521] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      {children}
    </div>
  );
}
