"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProducts } from "@/components/ProductProvider";
import { useCart } from "@/lib/cartContext";
import { getReferralCode } from "@/lib/referralClient";
import NailSizePicker from "@/components/NailSizePicker";
import CheckoutGate from "@/components/CheckoutGate";
import CheckoutNotices from "@/components/CheckoutNotices";
import NameFields, { joinName, nameErrors, splitName } from "@/components/NameFields";
import { BirthDateSelect, BirthTimeSelect } from "@/components/BirthDateTimeInputs";
import { forgetNailSizing, getSavedNailSizing, rememberNailSizing } from "@/lib/nailSizingClient";
import { applyBirthDataChoice, getSavedBirthData } from "@/lib/birthDataClient";
import {
  countries,
  nailShapes,
  nailLengths,
  stylePreferences,
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
    saveDefaultBirthData,
  } = useCart();

  const [form, setForm] = useState(() => {
    const draft = readDraft();
    if (draft?.form) {
      const shipping = { ...emptyAddress(), ...(draft.form.shipping || {}) };
      // Drafts saved before names were split into first / last.
      if (shipping.fullName && shipping.firstName === undefined) Object.assign(shipping, splitName(shipping.fullName));
      const restored = { ...emptyAddress(), ...draft.form, shipping };
      if (restored.fullName && restored.firstName === undefined) Object.assign(restored, splitName(restored.fullName));
      return restored;
    }
    return {
      firstName: "",
      lastName: "",
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
  const [referralCode, setReferralCode] = useState("");
  const [savedSizing, setSavedSizing] = useState(null);
  // Nail size is not sensitive, so keeping it for next time is on by default.
  const [keepNails, setKeepNails] = useState(true);

  // Nail sizing from the customer's last order (member record or this browser).
  useEffect(() => {
    setSavedSizing(getSavedNailSizing(member));
  }, [member]);

  // Birth details the customer chose to keep last time (opt-in).
  const [savedBirth, setSavedBirth] = useState(null);
  const [keepBirth, setKeepBirth] = useState(false);
  useEffect(() => {
    const saved = getSavedBirthData(member);
    setSavedBirth(saved);
    if (saved) setKeepBirth(true);
  }, [member]);

  // Prefill the referral code remembered from a friend's ?ref= link.
  useEffect(() => {
    setReferralCode((current) => current || getReferralCode());
  }, []);

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
        const receiver = address.fullName ? splitName(address.fullName) : null;
        const contact = !prev.fullName && receiver ? { ...receiver, fullName: address.fullName } : {};
        return {
          ...prev,
          ...contact,
          shipping: hasAddress
            ? {
                ...(receiver ? { ...receiver, fullName: address.fullName } : {}),
                phone: address.phone || "",
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
  // The "save my birth details" choice is shown once, on the first BaZi item.
  const firstBirthItemId = enrichedItems.find((item) => item.product?.requiresBirthData)?.id || null;
  const firstNailItemId = enrichedItems.find((item) => item.product?.requiresNailDetails)?.id || null;
  // Custom / personalized items (made from birth details or nail sizes) are final sale.
  const hasCustomItems = enrichedItems.some(
    (item) => item.product?.requiresBirthData || item.product?.requiresNailDetails
  );
  const [ackFinalSale, setAckFinalSale] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateName(firstName, lastName) {
    setForm((prev) => ({ ...prev, firstName, lastName, fullName: joinName(firstName, lastName) }));
  }

  function updateReceiverName(firstName, lastName) {
    setForm((prev) => ({
      ...prev,
      shipping: { ...prev.shipping, firstName, lastName, fullName: joinName(firstName, lastName) },
    }));
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

    const missingNames = {
      ...nameErrors(form.firstName, form.lastName),
      ...(hasShippingItems
        ? nameErrors(form.shipping.firstName, form.shipping.lastName, "receiver")
        : {}),
    };
    if (Object.keys(missingNames).length) {
      setErrors(missingNames);
      setSubmitError("Please enter both a first and last name.");
      return;
    }

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
      referralCode: referralCode.trim() || null,
      acknowledgedFinalSale: hasCustomItems ? ackFinalSale : undefined,
      saveNailSizing: keepNails,
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
      const sized = Object.values(itemDetails).find((detail) => detail?.nails?.sizeMode);
      if (sized && keepNails) rememberNailSizing(sized.nails);
      else if (sized && !keepNails) forgetNailSizing();
      if (firstBirthItemId) {
        await applyBirthDataChoice({
          keep: keepBirth,
          birth: itemDetails[firstBirthItemId]?.birth,
          hadSaved: Boolean(savedBirth),
          isSignedIn,
          saveDefaultBirthData,
        });
      }
      // Use the server-computed order (includes shippingFee, subtotal and
      // total) so the review page shows the correct shipping charge and the
      // confirmation request matches the stored order exactly.
      sessionStorage.setItem(
        "vesperCheckoutOrder",
        JSON.stringify({ ...data, order: data.order })
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
    <CheckoutGate>
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
          savedSizing={savedSizing}
          nailChoice={
            item.id === firstNailItemId
              ? { keep: keepNails, setKeep: setKeepNails, isSignedIn, hadSaved: Boolean(savedSizing) }
              : null
          }
          savedBirth={savedBirth}
          birthChoice={
            item.id === firstBirthItemId
              ? { keep: keepBirth, setKeep: setKeepBirth, isSignedIn, hadSaved: Boolean(savedBirth) }
              : null
          }
        />
      ))}

      {/* Contact & Shipping */}
      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <h2 className="text-2xl font-semibold text-[#1C2B48]">Contact & Delivery</h2>
        <div className="mt-5 space-y-4">
          <NameFields
            idPrefix="contact"
            firstName={form.firstName}
            lastName={form.lastName}
            onChange={updateName}
            firstError={errors.firstName || errors.fullName}
            lastError={errors.lastName}
          />
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
            />
          </Field>
          <Field label="Referral Code (optional)">
            <input
              type="text"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="e.g. USER-AB12C"
              maxLength={32}
              className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 font-mono text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
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
                onNameChange={updateReceiverName}
                contactName={{ firstName: form.firstName, lastName: form.lastName }}
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

      <CheckoutNotices
        hasCustomItems={hasCustomItems}
        hasShippingItems={hasShippingItems}
        ackFinalSale={ackFinalSale}
        onAckChange={setAckFinalSale}
      />

      <button
        type="submit"
        disabled={submitting || (hasCustomItems && !ackFinalSale)}
        className="w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Continue to Review & Pay"}
      </button>
    </form>
    </CheckoutGate>
  );
}

function ItemFormSection({ item, index, details, errors, onChange, savedSizing, nailChoice, savedBirth, birthChoice }) {
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
          {product.nailSize ? (
            <p className="mt-0.5 text-sm font-semibold text-[#1C2B48]">
              Ready-made · Size {product.nailSize}
            </p>
          ) : null}
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
            savedBirth={savedBirth}
            birthChoice={birthChoice}
          />
        ) : null}

        {product.requiresNailDetails ? (
          <NailFields
            itemId={item.id}
            details={details}
            errors={errors}
            onChange={onChange}
            savedSizing={savedSizing}
            nailChoice={nailChoice}
          />
        ) : null}
      </div>
    </section>
  );
}

function BirthFields({ itemId, product, details, errors, onChange, savedBirth, birthChoice }) {
  const birth = details.birth || {};
  function update(key, value) {
    onChange(itemId, "birth", { ...birth, [key]: value });
  }

  // Pre-fill saved birth details (only if nothing has been entered yet).
  useEffect(() => {
    if (savedBirth?.birthDate && !birth.birthDate) {
      onChange(itemId, "birth", { ...birth, ...savedBirth });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedBirth]);

  return (
    <div className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-4 space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
        Birth Information (for your BaZi chart)
      </p>
      {savedBirth?.birthDate && birth.birthDate === savedBirth.birthDate ? (
        <p className="rounded border border-[#8EB1D1]/30 bg-white/70 px-3 py-2 text-xs text-[#35506B]">
          Filled in with the birth details you saved last time — please check they are still correct.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of Birth" error={errors.birthDate}>
          <BirthDateSelect
            value={birth.birthDate || ""}
            onChange={(value) => update("birthDate", value)}
            idPrefix={"birth-" + itemId}
          />
        </Field>
        <Field label="Exact Birth Time" error={errors.birthTime}>
          <BirthTimeSelect
            value={birth.birthTime || ""}
            onChange={(value) => update("birthTime", value)}
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
      {birthChoice ? (
        <label className="flex items-start gap-2 rounded border border-[#8EB1D1]/30 bg-white/70 p-3 text-sm text-[#1C2B48]">
          <input
            type="checkbox"
            checked={birthChoice.keep}
            onChange={(event) => birthChoice.setKeep(event.target.checked)}
            className="mt-1"
          />
          <span>
            Save my birth details for my next order
            <span className="block text-xs text-[#5B7893]">
              {birthChoice.isSignedIn
                ? "Saved to your account so you don’t have to enter them again. You can remove them any time in your account."
                : "Saved in this browser only. Don’t tick this on a shared or public device."}
              {birthChoice.hadSaved && !birthChoice.keep ? " Unticked: your saved details will be deleted when you place this order." : ""}
            </span>
          </span>
        </label>
      ) : null}
    </div>
  );
}

function NailFields({ itemId, details, errors, onChange, savedSizing, nailChoice }) {
  const nails = details.nails || {};

  // Pre-fill the size from the customer's last order (only if not chosen yet).
  useEffect(() => {
    if (!nails.sizeMode && savedSizing?.sizeMode) {
      onChange(itemId, "nails", {
        ...nails,
        sizeMode: savedSizing.sizeMode,
        standardSize: savedSizing.standardSize || "",
        measurements: savedSizing.measurements || {},
        sizePrefilled: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSizing]);
  function update(key, value) {
    onChange(itemId, "nails", { ...nails, [key]: value });
  }

  return (
    <div className="rounded border border-[#8EB1D1]/25 bg-[#C4D8E5]/50 p-4 space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5B7893]">
        Nail Details
      </p>
      <NailSizePicker
        sizeMode={nails.sizeMode}
        standardSize={nails.standardSize}
        measurements={nails.measurements || {}}
        errors={errors}
        prefilled={Boolean(nails.sizePrefilled)}
        onChange={(patch) =>
          onChange(itemId, "nails", { ...nails, mixedSet: false, sizePrefilled: false, ...patch })
        }
      />
      {nailChoice ? (
      <label className="flex items-start gap-2 rounded border border-[#8EB1D1]/30 bg-white/70 p-3 text-sm text-[#1C2B48]">
        <input
          type="checkbox"
          checked={nailChoice.keep}
          onChange={(event) => nailChoice.setKeep(event.target.checked)}
          className="mt-1"
        />
        <span>
          Save my nail size for my next order
          <span className="block text-xs text-[#5B7893]">
            {nailChoice.isSignedIn
              ? "Saved to your account and filled in automatically next time."
              : "Saved in this browser and filled in automatically next time."}
            {nailChoice.hadSaved && !nailChoice.keep ? " Unticked: your saved size will be deleted when you place this order." : ""}
          </span>
        </span>
      </label>
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

function ShippingForm({ shipping, errors, onChange, onNameChange, contactName }) {
  const canCopy =
    (contactName?.firstName || contactName?.lastName) &&
    !shipping.firstName &&
    !shipping.lastName;
  return (
    <div className="space-y-4">
      <NameFields
        idPrefix="ship"
        firstLabel="Receiver First Name"
        lastLabel="Receiver Last Name"
        firstName={shipping.firstName}
        lastName={shipping.lastName}
        onChange={onNameChange}
        firstError={errors.receiverFirstName || errors.addressFullName}
        lastError={errors.receiverLastName}
      />
      {canCopy ? (
        <button
          type="button"
          onClick={() => onNameChange(contactName.firstName || "", contactName.lastName || "")}
          className="-mt-2 text-xs font-semibold text-[#35506B] underline underline-offset-2 hover:text-[#1C2B48]"
        >
          Same as my name
        </button>
      ) : null}
      <Field label="Receiver Phone" error={errors.addressPhone}>
        <input
          type="tel"
          autoComplete="shipping tel"
          value={shipping.phone || ""}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="e.g. +1 512 555 0100"
          className="w-full rounded border border-[#8EB1D1]/40 bg-white px-3 py-2 text-sm text-[#1C2B48] outline-none focus:border-[#8EB1D1]"
        />
        <p className="mt-1 text-[11px] text-[#5B7893]">
          Required by the carrier and US customs to deliver your parcel.
        </p>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
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
