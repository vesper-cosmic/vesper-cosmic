"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProducts } from "@/components/ProductProvider";
import { useCart } from "@/lib/cartContext";
import {
  countries,
  nailShapes,
  nailLengths,
  stylePreferences,
  nailSizeKeys,
  emptyAddress,
  baziIntentions,
  digitalCuriosityAreas,
  daylightSavingOptions,
  fortuneSelectionHint,
  maxFortuneSelections,
} from "@/lib/formOptions";

export default function CheckoutFlow() {
  const { getProductById } = useProducts();
  const {
    items,
    totalPrice,
    isSignedIn,
    userEmail,
    member,
    saveDefaultAddress,
  } = useCart();

  const [form, setForm] = useState(() => {
    const draft = readDraft();
    if (draft?.form) {
      return { ...emptyAddress(), ...draft.form, shipping: { ...emptyAddress(), ...(draft.form.shipping || {}) } };
    }
    return {
      fullName: "",
      email: "",
      shipping: emptyAddress(),
      saveAddressToMember: false,
    };
  });
  const [itemDetails, setItemDetails] = useState(() => {
    const draft = readDraft();
    return draft?.itemDetails || {};
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // Persist draft so a page refresh / back button never loses the form
  useEffect(() => {
    sessionStorage.setItem(
      "vesperCheckoutDraft",
      JSON.stringify({ form, itemDetails })
    );
  }, [form, itemDetails]);

  // Prefill from member profile — only when the user has not typed anything yet
  useEffect(() => {
    const hasDraft = sessionStorage.getItem("vesperCheckoutDraft");
    if (hasDraft) return;
    if (member?.defaultAddress) {
      setForm((prev) => {
        const address = member.defaultAddress;
        const hasAddress =
          address.addressLine1 || address.city || address.postalCode;
        return {
          ...prev,
          shipping: hasAddress
            ? {
                addressLine1: address.addressLine1 || "",
                addressLine2: address.addressLine2 || "",
                city: address.city || "",
                stateProvince: address.stateProvince || "",
                postalCode: address.postalCode || "",
                country: address.country || "United States",
              }
            : prev.shipping,
        };
      });
    }
  }, [member]);

  const enrichedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        product: getProductById(item.id) || null,
      })),
    [items, getProductById]
  );

  const hasShippingItems = enrichedItems.some((item) => item.product?.requiresShipping);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateShipping(field, value) {
    setForm((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, [field]: value },
    }));
  }

  function updateItemDetails(itemId, key, value) {
    setItemDetails((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [key]: value },
    }));
  }

  function updateFortuneCheckbox(itemId, field, option, checked) {
    setItemDetails((prev) => {
      const current = prev[itemId] || {};
      const currentList = current[field] || [];
      let nextList;
      if (checked) {
        if (currentList.length >= maxFortuneSelections) return prev;
        nextList = [...currentList, option];
      } else {
        nextList = currentList.filter((item) => item !== option);
      }
      return { ...prev, [itemId]: { ...current, [field]: nextList } };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setErrors({});

    const payload = {
      fullName: form.fullName,
      email: form.email,
      shipping: hasShippingItems ? form.shipping : {},
      items: enrichedItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        details: itemDetails[item.id] || {},
      })),
      memberEmail: isSignedIn ? userEmail : null,
      saveAddressToMember: form.saveAddressToMember && isSignedIn,
    };

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
        setSubmitError(
          data.errors?.submit ||
            "Some required fields are missing. Please scroll down and check the highlighted fields."
        );
        return;
      }

      sessionStorage.removeItem("vesperCheckoutDraft");
      sessionStorage.setItem(
        "vesperCheckoutOrder",
        JSON.stringify({
          ...data,
          order: {
            fullName: form.fullName,
            email: form.email,
            shipping: hasShippingItems ? form.shipping : {},
            items: enrichedItems.map((item, index) => ({
              productId: item.id,
              quantity: item.quantity,
              details: itemDetails[item.id] || {},
              index,
            })),
            total: totalPrice,
            memberEmail: isSignedIn ? userEmail : null,
            saveAddressToMember: form.saveAddressToMember && isSignedIn,
          },
        })
      );

      if (form.saveAddressToMember && isSignedIn) {
        await saveDefaultAddress({
          fullName: form.fullName,
          ...form.shipping,
        });
      }

      window.location.href = `/checkout/review`;
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-6 text-center">
        <h1 className="text-3xl font-semibold text-[#1C2B48]">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#35506B]">
          Add items to your cart from the shop.
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
          Checkout
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[#1C2B48]">
          {items.length} item{items.length > 1 ? "s" : ""} · ${totalPrice.toFixed(2)} USD
        </h1>
      </section>

      {/* Item customization forms */}
      {enrichedItems.map((item, index) => (
        <ItemFormSection
          key={item.id}
          item={item}
          index={index}
          details={itemDetails[item.id] || {}}
          errors={errors[`item_${index}`] || {}}
          onChange={updateItemDetails}
        />
      ))}

      {/* Contact & Shipping */}
      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Contact & Delivery</h2>
        <div className="mt-5 space-y-4">
          <Field label="Full Name" error={errors.fullName}>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
            />
          </Field>

          {hasShippingItems ? (
            <>
              <div className="pt-2">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8EB1D1]">
                  Shipping Address
                </p>
                {member?.defaultAddress?.addressLine1 ? (
                  <p className="mt-1 text-xs text-[#5B7893]">
                    Pre-filled from your saved member address — you can edit it below.
                  </p>
                ) : null}
              </div>
              <ShippingForm
                shipping={form.shipping}
                errors={errors}
                onChange={updateShipping}
              />
            </>
          ) : null}

          {isSignedIn ? (
            <label className="flex items-start gap-2 text-sm text-[#35506B]">
              <input
                type="checkbox"
                checked={form.saveAddressToMember}
                onChange={(event) =>
                  updateField("saveAddressToMember", event.target.checked)
                }
                className="mt-1"
              />
              <span>
                Save this as my default shipping address for future orders
              </span>
            </label>
          ) : (
            <p className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-3 text-xs leading-5 text-[#35506B]">
              Sign in to save your address and cart for next time.
            </p>
          )}
        </div>
      </section>

      {submitError ? (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Continue to Review & Pay"}
      </button>
    </form>
  );
}

function ItemFormSection({ item, index, details, errors, onChange }) {
  const product = item.product;
  if (!product) return null;

  return (
    <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
      <div className="flex items-center gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-16 w-16 rounded object-cover"
        />
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-[#5B7893]">
            Item {index + 1}
          </p>
          <h2 className="text-xl font-semibold text-[#1C2B48]">
            {item.name} × {item.quantity}
          </h2>
          <p className="text-sm text-[#5B7893]">
            ${item.price} {item.currency} each
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {product.intentionType === "single" ? (
          <FortuneCheckboxGroup
            label="Choose your focus areas"
            hint={fortuneSelectionHint}
            options={product.availableIntentions || []}
            selected={details.readyIntentions || []}
            error={errors.readyIntentions}
            onChange={(option, checked) =>
              onChange(item.id, "readyIntentions", toggleInList(details.readyIntentions || [], option, checked))
            }
          />
        ) : null}

        {product.requiresBirthData ? (
          <BirthFields
            itemId={item.id}
            product={product}
            details={details}
            errors={errors}
            onChange={onChange}
          />
        ) : null}

        {product.requiresNailDetails ? (
          <NailFields
            itemId={item.id}
            details={details}
            errors={errors}
            onChange={onChange}
          />
        ) : null}
      </div>
    </section>
  );
}

function BirthFields({ itemId, product, details, errors, onChange }) {
  const birth = details.birth || {};
  function update(key, value) {
    onChange(itemId, "birth", { ...birth, [key]: value });
  }

  return (
    <div className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-4 space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
        Birth Information (for your BaZi chart)
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of Birth" error={errors.birthDate}>
          <input
            type="date"
            value={birth.birthDate || ""}
            onChange={(event) => update("birthDate", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
        <Field label="Exact Birth Time" error={errors.birthTime}>
          <input
            type="time"
            value={birth.birthTime || ""}
            onChange={(event) => update("birthTime", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
        <Field label="Biological Gender" error={errors.biologicalGender}>
          <select
            value={birth.biologicalGender || ""}
            onChange={(event) => update("biologicalGender", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>
        <Field label="Daylight Saving Time" error={errors.daylightSavingTime}>
          <select
            value={birth.daylightSavingTime || ""}
            onChange={(event) => update("daylightSavingTime", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select…</option>
            {daylightSavingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="City & Country of Birth" error={errors.birthLocation}>
        <input
          type="text"
          value={birth.birthLocation || ""}
          onChange={(event) => update("birthLocation", event.target.value)}
          placeholder="e.g. Taipei, Taiwan"
          className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />
      </Field>
      {product.formType === "C" ? (
        <FortuneCheckboxGroup
          label="What areas are you most curious about?"
          hint={fortuneSelectionHint}
          options={digitalCuriosityAreas}
          selected={birth.digitalCuriosityAreas || []}
          error={errors.digitalCuriosityAreas}
          onChange={(option, checked) =>
            update("digitalCuriosityAreas", toggleInList(birth.digitalCuriosityAreas || [], option, checked))
          }
        />
      ) : (
        <FortuneCheckboxGroup
          label="What areas are you hoping to work on?"
          hint={fortuneSelectionHint}
          options={baziIntentions}
          selected={birth.baziIntentions || []}
          error={errors.baziIntentions}
          onChange={(option, checked) =>
            update("baziIntentions", toggleInList(birth.baziIntentions || [], option, checked))
          }
        />
      )}
    </div>
  );
}

function NailFields({ itemId, details, errors, onChange }) {
  const nails = details.nails || {};
  function update(key, value) {
    onChange(itemId, "nails", { ...nails, [key]: value });
  }

  return (
    <div className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-4 space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
        Nail Details
      </p>
      <label className="flex items-start gap-2 text-sm text-[#35506B]">
        <input
          type="checkbox"
          checked={Boolean(nails.mixedSet)}
          onChange={(event) => update("mixedSet", event.target.checked)}
          className="mt-1"
        />
        <span>I prefer a mixed set (sizes 10–18mm) — skip nail measurements</span>
      </label>
      {!nails.mixedSet ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {nailSizeKeys.map(([key, label]) => (
            <Field key={key} label={label} error={errors[key]}>
              <input
                type="number"
                min="10"
                max="18"
                value={nails.measurements?.[key] || ""}
                onChange={(event) =>
                  update("measurements", {
                    ...(nails.measurements || {}),
                    [key]: event.target.value,
                  })
                }
                placeholder="mm"
                className="w-full rounded border border-[#8EB1D1]/40 bg-white px-2 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
              />
            </Field>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nail Shape" error={errors.nailShape}>
          <select
            value={nails.nailShape || ""}
            onChange={(event) => update("nailShape", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select…</option>
            {nailShapes.map((shape) => (
              <option key={shape.id} value={shape.id}>
                {shape.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nail Length" error={errors.nailLength}>
          <select
            value={nails.nailLength || ""}
            onChange={(event) => update("nailLength", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select…</option>
            {nailLengths.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Style Preference" error={errors.stylePreference}>
          <select
            value={nails.stylePreference || ""}
            onChange={(event) => update("stylePreference", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          >
            <option value="">Select…</option>
            {stylePreferences.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes for This Item">
        <textarea
          value={nails.nailNotes || ""}
          onChange={(event) => update("nailNotes", event.target.value)}
          rows="2"
          className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />
      </Field>
    </div>
  );
}

function FortuneCheckboxGroup({ label, hint, options, selected, error, onChange }) {
  return (
    <div>
      <p className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </p>
      {hint ? (
        <p className="mb-3 text-xs leading-5 text-[#5B7893]">{hint}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isChecked = selected.includes(option);
          const isDisabled = !isChecked && selected.length >= maxFortuneSelections;
          return (
            <label
              key={option}
              className={`flex items-center gap-3 rounded border p-3 text-sm transition ${
                isChecked
                  ? "border-[#8EB1D1] bg-[#C4D8E5] text-[#1C2B48]"
                  : "border-[#8EB1D1]/25 bg-white text-[#35506B] hover:border-[#8EB1D1]"
              } ${isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isDisabled}
                onChange={(event) => onChange(option, event.target.checked)}
                className="mt-0.5"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function toggleInList(list, option, checked) {
  if (checked) {
    if (list.length >= maxFortuneSelections) return list;
    return [...list, option];
  }
  return list.filter((item) => item !== option);
}

function ShippingForm({ shipping, errors, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Receiver Name" error={errors.addressFullName}>
          <input
            type="text"
            value={shipping.fullName || ""}
            onChange={(event) => onChange("fullName", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
        <Field label="Country" error={errors.country}>
          <select
            value={shipping.country}
            onChange={(event) => onChange("country", event.target.value)}
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
      <Field label="Address Line 1" error={errors.addressLine1}>
        <input
          type="text"
          value={shipping.addressLine1}
          onChange={(event) => onChange("addressLine1", event.target.value)}
          className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />
      </Field>
      <Field label="Address Line 2 (optional)">
        <input
          type="text"
          value={shipping.addressLine2}
          onChange={(event) => onChange("addressLine2", event.target.value)}
          className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" error={errors.city}>
          <input
            type="text"
            value={shipping.city}
            onChange={(event) => onChange("city", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
        <Field label="State / Province" error={errors.stateProvince}>
          <input
            type="text"
            value={shipping.stateProvince}
            onChange={(event) => onChange("stateProvince", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
        <Field label="Postal Code" error={errors.postalCode}>
          <input
            type="text"
            value={shipping.postalCode}
            onChange={(event) => onChange("postalCode", event.target.value)}
            className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
          />
        </Field>
      </div>
    </div>
  );
}

function readDraft() {
  try {
    const raw = sessionStorage.getItem("vesperCheckoutDraft");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#5B7893]">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
