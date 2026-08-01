"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCart } from "@/lib/cartContext";
import { countries, emptyAddress } from "@/lib/formOptions";

export default function AccountPage() {
  const {
    isSignedIn,
    userEmail,
    member,
    items,
    saveDefaultAddress,
    clearCart,
  } = useCart();

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState(null); // null = loading
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (isSignedIn) {
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
    }
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const defaultAddress = member?.defaultAddress || emptyAddress();

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.target);
    const address = {
      fullName: formData.get("fullName"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      city: formData.get("city"),
      stateProvince: formData.get("stateProvince"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country"),
    };

    const result = await saveDefaultAddress(address);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError("Could not save your address. Please try again.");
    }
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-8 text-center">
          <h1 className="text-3xl font-semibold text-[#1C2B48]">
            Your Account
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#35506B]">
            Please sign in with Google to see your saved cart and default
            shipping address.
          </p>
          <Link
            href="/shop"
            className="mist-button mt-6 inline-flex rounded border border-[#8EB1D1] px-4 py-2 text-sm font-semibold text-[#1C2B48]"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
            Account
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-[#1C2B48]">
            {member?.name || "Your Account"}
          </h1>
          <p className="mt-2 text-sm text-[#5B7893]">{userEmail}</p>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-4 rounded border border-[#8EB1D1]/40 px-3 py-1.5 text-xs font-medium text-[#5B7893] transition hover:bg-[#C4D8E5] hover:text-[#1C2B48]"
          >
            Sign out
          </button>
        </section>

        <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
          <h2 className="text-2xl font-semibold text-[#1C2B48]">
            Default Shipping Address
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5B7893]">
            This address will be pre-filled at checkout. You can edit it per
            order.
          </p>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <input type="hidden" name="fullName" value={member?.name || ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address Line 1">
                <input
                  type="text"
                  name="addressLine1"
                  defaultValue={defaultAddress.addressLine1 || ""}
                  required
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                />
              </Field>
              <Field label="Address Line 2 (optional)">
                <input
                  type="text"
                  name="addressLine2"
                  defaultValue={defaultAddress.addressLine2 || ""}
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                />
              </Field>
              <Field label="City">
                <input
                  type="text"
                  name="city"
                  defaultValue={defaultAddress.city || ""}
                  required
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                />
              </Field>
              <Field label="State / Province">
                <input
                  type="text"
                  name="stateProvince"
                  defaultValue={defaultAddress.stateProvince || ""}
                  required
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                />
              </Field>
              <Field label="Postal Code">
                <input
                  type="text"
                  name="postalCode"
                  defaultValue={defaultAddress.postalCode || ""}
                  required
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                />
              </Field>
              <Field label="Country">
                <select
                  name="country"
                  defaultValue={defaultAddress.country || "United States"}
                  required
                  className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <button
              type="submit"
              className="rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7]"
            >
              {saved ? "✓ Saved" : "Save Address"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1C2B48]">
              Order History
            </h2>
            <Link
              href="/track"
              className="text-xs font-medium text-[#8EB1D1] underline transition hover:text-[#1C2B48]"
            >
              Track an order
            </Link>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5B7893]">
            Your past orders and their current status.
          </p>
          {orders === null ? (
            <p className="mt-4 text-sm text-[#5B7893]">Loading your orders...</p>
          ) : ordersError ? (
            <p className="mt-4 text-sm text-red-500">{ordersError}</p>
          ) : orders.length > 0 ? (
            <div className="mt-4">
              <ul className="space-y-2">
                {orders.map((order) => (
                  <li
                    key={order.orderId}
                    className="rounded border border-[#8EB1D1]/20 bg-white/60 px-3 py-2.5 text-sm text-[#1C2B48]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {order.productName || "Order"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#5B7893]">
                          {order.orderId} ·{" "}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-[#1C2B48]">
                          ${Number(order.amount || 0).toFixed(2)} USD
                        </p>
                        <p className="mt-1 inline-block rounded bg-[#D6E4EE] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#35506B]">
                          {order.productionStatus ||
                            order.paymentStatus ||
                            "Processing"}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#5B7893]">
              No orders yet.{" "}
              <Link href="/shop" className="text-[#8EB1D1] underline">
                Browse the shop
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#1C2B48]">
              Saved Cart
            </h2>
            <span className="text-sm text-[#5B7893]">{items.length} items</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5B7893]">
            Your cart is saved automatically while signed in. It will be
            restored next time you sign in anywhere.
          </p>
          {items.length > 0 ? (
            <div className="mt-4">
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded border border-[#8EB1D1]/20 bg-white/60 px-3 py-2 text-sm text-[#1C2B48]"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-[#5B7893]">× {item.quantity}</span>
                    </span>
                    <span>
                      ${(item.price * item.quantity).toFixed(2)} {item.currency}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={clearCart}
                className="mt-3 text-xs font-medium text-[#5B7893] underline transition hover:text-[#1C2B48]"
              >
                Clear saved cart
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#5B7893]">
              Your cart is empty.{" "}
              <Link href="/shop" className="text-[#8EB1D1] underline">
                Browse the shop
              </Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </label>
      {children}
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
