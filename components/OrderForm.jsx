"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { products } from "@/data/products";

const intentionOptions = ["Wealth", "Love", "Health", "Protection"];

const initialState = {
  email: "",
  transactionId: "",
  fullName: "",
  birthDateTime: "",
  birthLocation: "",
  intentions: [],
  purchasedProductId: products[0].id,
  shippingAddress: "",
  postalCode: "",
};

export default function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProductId = searchParams.get("product") || products[0].id;
  const [form, setForm] = useState({
    ...initialState,
    purchasedProductId: defaultProductId,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === form.purchasedProductId),
    [form.purchasedProductId]
  );
  const requiresShipping = selectedProduct?.type === "Physical";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateIntentions(event) {
    const { value, checked } = event.target;
    setForm((current) => ({
      ...current,
      intentions: checked
        ? [...current.intentions, value]
        : current.intentions.filter((item) => item !== value),
    }));
  }

  function validate() {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.transactionId.trim()) {
      nextErrors.transactionId = "PayPal transaction ID is required.";
    }
    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!form.birthDateTime) {
      nextErrors.birthDateTime = "Birth date and time are required.";
    }
    if (!form.birthLocation.trim()) {
      nextErrors.birthLocation = "Birth city and country are required.";
    }
    if (form.intentions.length === 0) {
      nextErrors.intentions = "Select at least one intention.";
    }
    if (!form.purchasedProductId) {
      nextErrors.purchasedProductId = "Select the purchased product.";
    }
    if (requiresShipping && !form.shippingAddress.trim()) {
      nextErrors.shippingAddress = "Shipping address is required for physical products.";
    }
    if (requiresShipping && !form.postalCode.trim()) {
      nextErrors.postalCode = "Postal code is required for physical products.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrors(payload.errors || { submit: "Unable to submit the order form." });
      return;
    }

    router.push("/success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      {errors.submit ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errors.submit}
        </p>
      ) : null}

      <Field label="Email address" error={errors.email}>
        <input
          required
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="customer@example.com"
        />
      </Field>

      <Field label="PayPal transaction ID" error={errors.transactionId}>
        <input
          required
          type="text"
          name="transactionId"
          value={form.transactionId}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="PayPal order or transaction number"
        />
      </Field>

      <Field label="Purchased product" error={errors.purchasedProductId}>
        <select
          required
          name="purchasedProductId"
          value={form.purchasedProductId}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - ${product.price} {product.currency}
            </option>
          ))}
        </select>
      </Field>

      <Field label="English full name" error={errors.fullName}>
        <input
          required
          type="text"
          name="fullName"
          value={form.fullName}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Jane Doe"
        />
      </Field>

      <Field label="Western birth date and time" error={errors.birthDateTime}>
        <input
          required
          type="datetime-local"
          name="birthDateTime"
          value={form.birthDateTime}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
        />
      </Field>

      <Field label="Birth city and country" error={errors.birthLocation}>
        <input
          required
          type="text"
          name="birthLocation"
          value={form.birthLocation}
          onChange={updateField}
          className="w-full rounded border border-zinc-300 px-3 py-2"
          placeholder="Los Angeles, United States"
        />
      </Field>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-zinc-800">
          Intentions
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {intentionOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                value={option}
                checked={form.intentions.includes(option)}
                onChange={updateIntentions}
                className="h-4 w-4"
              />
              {option}
            </label>
          ))}
        </div>
        {errors.intentions ? <ErrorText>{errors.intentions}</ErrorText> : null}
      </fieldset>

      {requiresShipping ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="English shipping address" error={errors.shippingAddress}>
            <textarea
              required
              name="shippingAddress"
              value={form.shippingAddress}
              onChange={updateField}
              className="min-h-24 w-full rounded border border-zinc-300 px-3 py-2"
              placeholder="Street, city, state, country"
            />
          </Field>

          <Field label="Postal code" error={errors.postalCode}>
            <input
              required
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={updateField}
              className="w-full rounded border border-zinc-300 px-3 py-2"
              placeholder="90001"
            />
          </Field>
        </div>
      ) : (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Shipping address and postal code are optional for the digital report.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Order Form"}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </label>
  );
}

function ErrorText({ children }) {
  return <p className="mt-2 text-sm text-red-600">{children}</p>;
}
