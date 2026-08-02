"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useProducts } from "@/components/ProductProvider";

export default function ThankYouMessage() {
  const { getProductById } = useProducts();
  const [order, setOrder] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState("idle");

  useEffect(() => {
    const storedOrder =
      sessionStorage.getItem("vesperLastOrder") ||
      sessionStorage.getItem("vesperCheckoutOrder");

    if (storedOrder) {
      const parsedOrder = JSON.parse(storedOrder);
      setOrder(parsedOrder);

      const isMultiItem = Array.isArray(parsedOrder.order?.items);

      // Multi-item orders are already confirmed + emailed via /api/checkout/confirm
      if (isMultiItem) {
        setConfirmationStatus("sent");
        return;
      }

      const confirmationKey = `vesperPaymentConfirmed:${parsedOrder.orderId}`;
      if (!sessionStorage.getItem(confirmationKey)) {
        setConfirmationStatus("sending");
        fetch("/api/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedOrder),
        })
          .then(async (response) => {
            if (!response.ok) throw new Error("Confirmation failed.");
            sessionStorage.setItem(confirmationKey, "true");
            setConfirmationStatus("sent");
          })
          .catch(() => setConfirmationStatus("failed"));
      } else {
        setConfirmationStatus("sent");
      }
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

  const orderData = order.order || order;
  const isMultiItem = Array.isArray(orderData.items);
  const fullName = orderData.fullName || "";
  const email = orderData.email || "";

  if (isMultiItem) {
    const items = orderData.items
      .map((item) => ({
        ...item,
        product: getProductById(item.productId),
      }))
      .filter((item) => item.product);
    const hasShipping = items.some((item) => item.product?.requiresShipping);
    const total = orderData.total || 0;

    return (
      <MessageShell>
        <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
          Order {order.orderId || orderData.orderId}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[#1C2B48]">
          Your order has been received
        </h1>
        <p className="mt-4 text-base leading-7 text-[#35506B]">
          Thank you, {fullName}. Your PayPal payment has been submitted. I'll be
          in touch within 24 hours to confirm your order details.
        </p>
        <div className="mt-6 rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-4 text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
            Items ({items.length})
          </p>
          <ul className="space-y-2 text-sm leading-6 text-[#1C2B48]">
            {items.map((item, index) => (
              <li key={`${item.productId}-${index}`}>
                {item.product?.name || item.productId} × {item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-[#1C2B48]">
            Total: ${Number(total || 0).toFixed(2)} USD
          </p>
        </div>
        {hasShipping ? (
          <p className="mt-4 text-base leading-7 text-[#35506B]">
            Your handcrafted items will be prepared and shipped. You'll receive
            a tracking number by email once each item ships.
          </p>
        ) : (
          <p className="mt-4 text-base leading-7 text-[#35506B]">
            Your personalized PDF report will be delivered to {email} within 3–5
            business days.
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
        Thank you, {order.fullName}. Your PayPal payment has been submitted. I'll
        be in touch within 24 hours to confirm your order details.
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
      {confirmationStatus === "sending" ? (
        <p className="mt-4 rounded border border-[#8EB1D1]/35 bg-[#C4D8E5] p-3 text-sm text-[#35506B]">
          Sending your confirmation email now...
        </p>
      ) : null}
      {confirmationStatus === "failed" ? (
        <p className="mt-4 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-3 text-sm text-[#ffe1dd]">
          Your order page loaded, but the confirmation email could not be sent
          automatically. Please email me with your order ID.
        </p>
      ) : null}
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