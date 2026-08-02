"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cartContext";
import { ORDER_STATUSES, normalizedStatus } from "@/lib/orderStatus";
import { ORDER_STATUS_EN, ORDER_STATUS_DESCRIPTION_EN } from "@/lib/orderStatus";

const STATUS_STEPS = ORDER_STATUSES.map((key) => ({
  key,
  label: ORDER_STATUS_EN[key] || key,
  description: ORDER_STATUS_DESCRIPTION_EN[key] || "",
}));

export default function OrderTrackingForm() {
  const { isSignedIn, userEmail } = useCart();

  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  // Member order history (auto-loaded when signed in)
  const [orders, setOrders] = useState(null); // null = loading
  const [ordersError, setOrdersError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // When signed in, automatically load the customer's order history.
  useEffect(() => {
    let cancelled = false;

    if (isSignedIn) {
      setOrders(null);
      setOrdersError("");
      setSelectedOrder(null);
      setOrder(null);
      setStatus("idle");

      fetch("/api/member/orders")
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setOrders(data?.orders || []);
          if (data?.error) setOrdersError(data.error);
        })
        .catch(() => {
          if (!cancelled) {
            setOrders([]);
            setOrdersError("Could not load your order history.");
          }
        });
    } else {
      setOrders([]);
      setSelectedOrder(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

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

  function handleSelectOrder(orderItem) {
    setSelectedOrder(orderItem);
    setOrder(null);
    setStatus("idle");
    setError("");
  }

  const displayOrder = selectedOrder || order;
  const displayStatus = displayOrder?.productionStatus
    ? normalizedStatus(displayOrder.productionStatus)
    : "";
  const currentStatusIndex = STATUS_STEPS.findIndex(
    (step) => step.key === displayStatus
  );

  return (
    <div>
      {isSignedIn ? (
        <div className="space-y-4">
          <div className="rounded bg-white/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
              Your Orders
            </p>
            <p className="mt-1 text-sm leading-6 text-[#5B7893]">
              Signed in as {userEmail}. Select an order below to see its
              current status — no order ID needed.
            </p>

            {orders === null ? (
              <p className="mt-4 text-sm text-[#5B7893]">
                Loading your orders...
              </p>
            ) : ordersError ? (
              <p className="mt-4 text-sm text-red-500">{ordersError}</p>
            ) : orders.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {orders.map((item) => (
                  <li key={item.orderId}>
                    <button
                      type="button"
                      onClick={() => handleSelectOrder(item)}
                      className={`w-full rounded border px-3 py-2.5 text-left text-sm transition ${
                        selectedOrder?.orderId === item.orderId
                          ? "border-[#8EB1D1] bg-[#D6E4EE]"
                          : "border-[#8EB1D1]/20 bg-white/60 hover:border-[#8EB1D1]/60 hover:bg-[#EAF2F8]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1C2B48]">
                            {item.productName || "Order"}
                          </p>
                          <p className="mt-0.5 text-xs text-[#5B7893]">
                            {item.orderId} · {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-[#1C2B48]">
                            ${Number(item.amount || 0).toFixed(2)} USD
                          </p>
                          <p className="mt-1 inline-block rounded bg-[#D6E4EE] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#35506B]">
                            {ORDER_STATUS_EN[normalizedStatus(item.productionStatus)] ||
                              item.productionStatus ||
                              item.paymentStatus ||
                              "Processing"}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#5B7893]">
                No orders found for your account yet.{" "}
                <Link href="/shop" className="text-[#8EB1D1] underline">
                  Browse the shop
                </Link>
              </p>
            )}
          </div>

          {selectedOrder ? (
            <OrderStatusDetails
              order={selectedOrder}
              currentStatusIndex={currentStatusIndex}
              displayStatus={displayStatus}
            />
          ) : null}
        </div>
      ) : (
        <>
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
            <OrderStatusDetails
              order={order}
              currentStatusIndex={currentStatusIndex}
              displayStatus={displayStatus}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function OrderStatusDetails({ order, currentStatusIndex, displayStatus }) {
  return (
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

      {currentStatusIndex >= 0 ? (
        <div className="rounded bg-white/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
            Order Status
          </p>
          <ol className="mt-4 space-y-0">
            {STATUS_STEPS.map((step, index) => {
              const isActive = index === currentStatusIndex;
              const isCompleted = index < currentStatusIndex;
              return (
                <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                  {index < STATUS_STEPS.length - 1 ? (
                    <span
                      className={`absolute left-[7px] top-5 h-full w-0.5 ${
                        index < currentStatusIndex
                          ? "bg-[#8EB1D1]"
                          : "bg-[#D4DFE8]"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      isCompleted || isActive
                        ? "border-[#8EB1D1] bg-[#8EB1D1]"
                        : "border-[#B9C8D6] bg-white"
                    }`}
                  >
                    {isCompleted || isActive ? (
                      <svg aria-hidden="true" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? "text-[#1C2B48]" : isCompleted ? "text-[#5B7893]" : "text-[#9AA8B7]"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-[#8B99A8]">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <StatusRow label="Production">
          {order.productionStatus || "N/A"}
        </StatusRow>
      )}

      {order.trackingNumber ? (
        <div className="rounded border border-[#8EB1D1]/40 bg-[#EAF2F8] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
            Postal Tracking Number
          </p>
          <p className="mt-2 text-xl font-mono font-bold tracking-wider text-[#1C2B48]">
            {order.trackingNumber}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#5B7893]">
            Use this code on the postal service website to check delivery status.
          </p>
        </div>
      ) : displayStatus === "🚚 貨品已寄出" ? null : (
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