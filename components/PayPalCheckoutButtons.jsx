"use client";

import { useEffect, useRef, useState } from "react";

let sdkPromise = null;

function loadPaypalSdk(clientId) {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
        clientId
      )}&currency=USD&intent=capture&components=buttons`;
      script.async = true;
      script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error("PayPal failed to load")));
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("PayPal failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

/**
 * PayPal / card buttons. PayPal opens in a pop-up; when the customer
 * approves, our server captures and verifies the payment, then onPaid runs.
 */
export default function PayPalCheckoutButtons({ clientId, checkout, onPaid }) {
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const latest = useRef({ checkout, onPaid });
  latest.current = { checkout, onPaid };

  useEffect(() => {
    let cancelled = false;
    let buttons = null;

    loadPaypalSdk(clientId)
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        buttons = paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay" },
          createOrder: async () => {
            setError("");
            const { checkout: current } = latest.current;
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: current.orderId, email: current.order.email }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.id) {
              const message = data.error || "We couldn't start PayPal. Please try again.";
              setError(message);
              throw new Error(message);
            }
            return data.id;
          },
          onApprove: async (data, actions) => {
            setProcessing(true);
            setError("");
            const { checkout: current, onPaid: done } = latest.current;
            try {
              const response = await fetch("/api/paypal/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: current.orderId,
                  paypalOrderId: data.orderID,
                  order: current.order,
                  saveAddressToMember: Boolean(current.order.saveAddressToMember),
                }),
              });
              const result = await response.json().catch(() => ({}));
              if (response.ok && result.success) {
                done(result);
                return;
              }
              if (result.retry && actions?.restart) {
                setProcessing(false);
                setError(result.error);
                return actions.restart();
              }
              setError(
                result.error ||
                  `Something went wrong confirming your payment. Please contact us with order ID ${current.orderId}.`
              );
            } catch {
              setError(
                `A network error occurred. If you were charged, please contact us with order ID ${current.orderId} — don't pay again.`
              );
            }
            setProcessing(false);
          },
          onCancel: () => setError("Payment was cancelled. You can try again whenever you're ready."),
          onError: (err) => {
            console.error("PayPal button error:", err);
            setError((prev) => prev || "PayPal ran into a problem. Please try again.");
          },
        });
        if (buttons.isEligible()) {
          buttons.render(containerRef.current).catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("PayPal couldn't load. Please refresh the page or disable your ad blocker.");
      });

    return () => {
      cancelled = true;
      if (buttons?.close) buttons.close().catch(() => {});
    };
  }, [clientId]);

  return (
    <div>
      {loadError ? (
        <p role="alert" className="rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-3 text-left text-sm text-[#ffe1dd]">
          {loadError}
        </p>
      ) : null}
      <div ref={containerRef} className={processing ? "pointer-events-none opacity-40" : ""} />
      {processing ? (
        <p className="mt-3 text-sm text-[#35506B]" aria-live="polite">
          Confirming your payment with PayPal… please don&apos;t close this page.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-3 text-left text-sm leading-5 text-[#ffe1dd]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
