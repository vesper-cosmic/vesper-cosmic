"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  baziIntentions,
  countries,
  daylightSavingOptions,
  digitalCuriosityAreas,
  emptyAddress,
  emptyNailMeasurements,
  nailLengths,
  nailShapes,
  nailSizeKeys,
  stylePreferences,
} from "@/lib/formOptions";
import NailShapeIcon from "@/components/forms/NailShapeIcon";

const baseForm = {
  fullName: "",
  email: "",
  birthDate: "",
  birthTime: "",
  biologicalGender: "",
  daylightSavingTime: "",
  birthLocation: "",
  baziIntention: "",
  digitalCuriosityArea: "",
  specificIntentions: "",
  address: emptyAddress(),
  nailMeasurements: emptyNailMeasurements(),
  mixedSet: false,
  nailShape: "",
  nailLength: "",
  stylePreference: "",
  inspirationPhotoName: "",
  inspirationPhotoSize: 0,
  nailNotes: "",
};

export default function OrderIntakeForm({ product }) {
  const router = useRouter();
  const [form, setForm] = useState(baseForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateAddress(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      address: { ...current.address, [name]: value },
    }));
  }

  function updateNailMeasurement(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      nailMeasurements: { ...current.nailMeasurements, [name]: value },
    }));
  }

  function updatePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({
        ...current,
        inspirationPhotoName: "",
        inspirationPhotoSize: 0,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      inspirationPhotoName: file.name,
      inspirationPhotoSize: file.size,
    }));
  }

  function validate() {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!emailPattern.test(form.email)) nextErrors.email = "Enter a valid email.";

    if (product.requiresBirthData) {
      if (!form.birthDate) nextErrors.birthDate = "Date of birth is required.";
      if (!form.birthTime) nextErrors.birthTime = "Exact birth time is required.";
      if (!form.biologicalGender) nextErrors.biologicalGender = "Select biological gender.";
      if (!form.daylightSavingTime) nextErrors.daylightSavingTime = "Select daylight saving time.";
      if (!form.birthLocation.trim()) nextErrors.birthLocation = "City and country of birth are required.";
      if (product.formType === "C" && !form.digitalCuriosityArea) {
        nextErrors.digitalCuriosityArea = "Select the area you are most curious about.";
      }
      if (product.formType !== "C" && !form.baziIntention) {
        nextErrors.baziIntention = "Select what you are hoping to achieve.";
      }
    }

    if (product.requiresShipping) {
      if (!form.address.addressLine1.trim()) nextErrors.addressLine1 = "Address line 1 is required.";
      if (!form.address.city.trim()) nextErrors.city = "City is required.";
      if (!form.address.stateProvince.trim()) nextErrors.stateProvince = "State or province is required.";
      if (!form.address.postalCode.trim()) nextErrors.postalCode = "Postal code is required.";
      if (!form.address.country) nextErrors.country = "Country is required.";
    }

    if (product.requiresNailDetails) {
      if (!form.mixedSet) {
        nailSizeKeys.forEach(([key, label]) => {
          if (!form.nailMeasurements[key]) {
            nextErrors[key] = `${label} width is required, or choose Mixed Set.`;
          }
        });
      }
      if (!form.nailShape) nextErrors.nailShape = "Select a nail shape.";
      if (!form.nailLength) nextErrors.nailLength = "Select a nail length.";
      if (!form.stylePreference) nextErrors.stylePreference = "Select a style preference.";
      if (form.inspirationPhotoSize > 5 * 1024 * 1024) {
        nextErrors.inspirationPhoto = "Inspiration photo must be 5MB or smaller.";
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const orderDraft = {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productKind: product.productKind,
      price: product.price,
      currency: product.currency,
      formType: product.formType,
      fulfillmentTime: product.fulfillmentTime,
      requiresBirthData: product.requiresBirthData,
      requiresShipping: product.requiresShipping,
      requiresNailDetails: product.requiresNailDetails,
      ...form,
    };

    setIsSubmitting(true);
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDraft),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrors(payload.errors || { submit: "Unable to create the order." });
      return;
    }

    const payload = await response.json();
    const checkoutOrder = {
      ...orderDraft,
      orderId: payload.orderId,
      createdAt: payload.createdAt,
      paypalUrl: payload.paypalUrl,
    };
    sessionStorage.setItem("vesperCheckoutOrder", JSON.stringify(checkoutOrder));
    router.push("/checkout");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.submit ? <ErrorBox>{errors.submit}</ErrorBox> : null}

      <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#8EB1D1]">
          Step 1 of 2 — Your Details
        </p>
        <div className="mt-4 h-2 rounded-full bg-[#C4D8E5]">
          <div className="h-2 w-1/2 rounded-full bg-[#8EB1D1]" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold text-[#1C2B48]">
          {product.name}
        </h1>
        <p className="mt-2 text-2xl font-semibold text-[#1C2B48]">
          ${product.price} {product.currency}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#35506B]">
          {product.fulfillmentTime}
        </p>
      </section>

      <FormPanel title="Basic Information">
        <Field label="Full Name" error={errors.fullName}>
          <input name="fullName" value={form.fullName} onChange={updateField} required className={inputClass} />
        </Field>
        <Field label="Email Address" error={errors.email}>
          <input name="email" type="email" value={form.email} onChange={updateField} required className={inputClass} />
        </Field>
      </FormPanel>

      {product.requiresBirthData ? (
        <BirthDataFields
          form={form}
          product={product}
          errors={errors}
          updateField={updateField}
        />
      ) : null}

      {product.requiresNailDetails ? (
        <NailDetailsFields
          form={form}
          errors={errors}
          updateField={updateField}
          updateNailMeasurement={updateNailMeasurement}
          updatePhoto={updatePhoto}
          setForm={setForm}
          intro={product.nailIntro}
        />
      ) : null}

      {product.requiresShipping ? (
        <ShippingFields form={form} errors={errors} updateAddress={updateAddress} />
      ) : null}

      <p className="rounded-lg border border-[#8EB1D1]/25 bg-[#C4D8E5] p-4 text-sm leading-6 text-[#35506B]">
        Your information is kept strictly confidential and used only for your
        order. Your order is not confirmed until PayPal payment is completed.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mist-button w-full rounded border border-[#8EB1D1] bg-[#8EB1D1] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#1C2B48] transition hover:bg-[#A7C7E7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Preparing Checkout..." : "Continue to Review & Pay"}
      </button>
    </form>
  );
}

function BirthDataFields({ form, product, errors, updateField }) {
  const isDigitalOnly = product.formType === "C";
  const selectOptions = isDigitalOnly ? digitalCuriosityAreas : baziIntentions;
  const selectName = isDigitalOnly ? "digitalCuriosityArea" : "baziIntention";
  const selectLabel = isDigitalOnly
    ? "What area are you most curious about?"
    : "What are you hoping to achieve?";

  return (
    <FormPanel title="Birth Data">
      <Field label="Date of Birth" error={errors.birthDate}>
        <input name="birthDate" type="date" value={form.birthDate} onChange={updateField} required className={inputClass} />
      </Field>
      <Field label="Exact Birth Time" error={errors.birthTime}>
        <input name="birthTime" type="time" value={form.birthTime} onChange={updateField} required className={inputClass} />
      </Field>
      <RadioGroup
        label="Biological Gender"
        name="biologicalGender"
        value={form.biologicalGender}
        options={["Male", "Female"]}
        onChange={updateField}
        error={errors.biologicalGender}
      />
      <RadioGroup
        label="Daylight Saving Time"
        name="daylightSavingTime"
        value={form.daylightSavingTime}
        options={daylightSavingOptions}
        onChange={updateField}
        error={errors.daylightSavingTime}
      />
      <Field
        label="City and Country of Birth"
        error={errors.birthLocation}
        hint="Crucial for accurate chart calculation"
      >
        <input name="birthLocation" value={form.birthLocation} onChange={updateField} required className={inputClass} placeholder="Taipei, Taiwan" />
      </Field>
      <Field label={selectLabel} error={errors[selectName]}>
        <select name={selectName} value={form[selectName]} onChange={updateField} required className={inputClass}>
          <option value="">Select one</option>
          {selectOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </Field>
      {!isDigitalOnly ? (
        <Field label="Any specific intentions for this piece?">
          <textarea name="specificIntentions" value={form.specificIntentions} onChange={updateField} className={`${inputClass} min-h-28`} />
        </Field>
      ) : null}
    </FormPanel>
  );
}

function NailDetailsFields({
  form,
  errors,
  updateField,
  updateNailMeasurement,
  updatePhoto,
  setForm,
  intro,
}) {
  return (
    <FormPanel title="Press-On Nail Details">
      <p className="rounded border border-[#8EB1D1]/35 bg-[#1C2B48] p-4 text-sm leading-6 text-[#E8ECEF]">
        {intro}
      </p>
      <div className="rounded-lg border border-[#8EB1D1]/25 bg-[#C4D8E5] p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-center">
          <p className="text-sm leading-6 text-[#35506B]">
            Measure the widest part of each nail in millimeters using a ruler.
            If you're between sizes, size up. Tip: A credit card is 85mm wide —
            use it as a reference.
          </p>
          <div className="rounded border border-[#8EB1D1]/35 p-3 text-center">
            <div className="mx-auto h-20 w-32 rounded-md border border-[#8EB1D1] bg-[#E8ECEF]" />
            <p className="mt-2 text-xs text-[#5B7893]">85mm reference card</p>
          </div>
        </div>
      </div>

      <NailMeasurementRow
        title="Left Hand"
        keys={nailSizeKeys.slice(0, 5)}
        values={form.nailMeasurements}
        errors={errors}
        disabled={form.mixedSet}
        onChange={updateNailMeasurement}
      />
      <NailMeasurementRow
        title="Right Hand"
        keys={nailSizeKeys.slice(5)}
        values={form.nailMeasurements}
        errors={errors}
        disabled={form.mixedSet}
        onChange={updateNailMeasurement}
      />
      <p className="text-xs leading-5 text-[#5B7893]">
        Not sure? Select 'Mixed Set' below and I'll include the most common
        sizes so you can find your best fit.
      </p>
      <label className="flex items-start gap-3 rounded border border-[#8EB1D1]/25 p-3 text-sm text-[#35506B]">
        <input
          type="checkbox"
          checked={form.mixedSet}
          onChange={(event) =>
            setForm((current) => ({ ...current, mixedSet: event.target.checked }))
          }
          className="mt-1"
        />
        <span>
          Send me a Mixed Set instead
          <span className="block text-xs text-[#5B7893]">
            includes sizes 10–18mm, one of each
          </span>
        </span>
      </label>

      <RadioGroup
        label="Nail Shape"
        name="nailShape"
        value={form.nailShape}
        options={nailShapes}
        onChange={updateField}
        error={errors.nailShape}
        renderOption={(option) => (
          <>
            <NailShapeIcon shape={option.icon} />
            <span>{option.label}</span>
          </>
        )}
      />
      <RadioGroup
        label="Nail Length"
        name="nailLength"
        value={form.nailLength}
        options={nailLengths}
        onChange={updateField}
        error={errors.nailLength}
      />
      <RadioGroup
        label="Style Preference"
        name="stylePreference"
        value={form.stylePreference}
        options={stylePreferences}
        onChange={updateField}
        error={errors.stylePreference}
      />
      <p className="text-sm leading-6 text-[#5B7893]">
        I'll use these as a reference — the final design will be guided by your
        BaZi element and intentions.
      </p>
      <Field
        label="Inspiration Photo (optional)"
        error={errors.inspirationPhoto}
        hint="Upload a photo of a style you love. This helps me understand your aesthetic — your set will still be uniquely designed for your energy."
      >
        <input type="file" accept="image/png,image/jpeg" onChange={updatePhoto} className="w-full text-sm text-[#35506B] file:mr-4 file:rounded file:border-0 file:bg-[#8EB1D1] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1C2B48]" />
      </Field>
      <Field label="Any other notes for your nails?">
        <textarea
          name="nailNotes"
          value={form.nailNotes}
          onChange={updateField}
          className={`${inputClass} min-h-28`}
          placeholder="e.g. I prefer darker tones / no glitter / I love stars and moons"
        />
      </Field>
    </FormPanel>
  );
}

function NailMeasurementRow({ title, keys, values, errors, disabled, onChange }) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-[#1C2B48]">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {keys.map(([key, label]) => (
          <Field key={key} label={label} error={errors[key]}>
            <input
              name={key}
              type="number"
              min="5"
              max="25"
              step="0.5"
              value={values[key]}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g. 14"
              className={inputClass}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

function ShippingFields({ form, errors, updateAddress }) {
  return (
    <FormPanel title="Shipping Address">
      <Field label="Address Line 1" error={errors.addressLine1}>
        <input name="addressLine1" value={form.address.addressLine1} onChange={updateAddress} required className={inputClass} />
      </Field>
      <Field label="Address Line 2" hint="Optional">
        <input name="addressLine2" value={form.address.addressLine2} onChange={updateAddress} className={inputClass} />
      </Field>
      <Field label="City" error={errors.city}>
        <input name="city" value={form.address.city} onChange={updateAddress} required className={inputClass} />
      </Field>
      <Field label="State / Province" error={errors.stateProvince}>
        <input name="stateProvince" value={form.address.stateProvince} onChange={updateAddress} required className={inputClass} />
      </Field>
      <Field label="Postal Code" error={errors.postalCode}>
        <input name="postalCode" value={form.address.postalCode} onChange={updateAddress} required className={inputClass} />
      </Field>
      <Field label="Country" error={errors.country}>
        <select name="country" value={form.address.country} onChange={updateAddress} required className={inputClass}>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </Field>
    </FormPanel>
  );
}

function RadioGroup({ label, name, value, options, onChange, error, renderOption }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#1C2B48]">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.id;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <label key={optionValue} className="flex items-center gap-3 rounded border border-[#8EB1D1]/25 p-3 text-sm text-[#35506B] transition hover:border-[#8EB1D1]">
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={onChange}
                required
              />
              {renderOption ? renderOption(option) : <span>{optionLabel}</span>}
            </label>
          );
        })}
      </div>
      {error ? <ErrorText>{error}</ErrorText> : null}
    </fieldset>
  );
}

function FormPanel({ title, children }) {
  return (
    <section className="rounded-lg border border-[#8EB1D1]/35 bg-[#E8ECEF] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
      <h2 className="mb-5 text-2xl font-semibold text-[#1C2B48]">{title}</h2>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#1C2B48]">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-[#5B7893]">{hint}</span> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </label>
  );
}

function ErrorText({ children }) {
  return <p className="mt-2 text-sm text-[#ffb8b1]">{children}</p>;
}

function ErrorBox({ children }) {
  return (
    <p className="rounded border border-[#ffb8b1]/50 bg-[#2d171d] p-4 text-sm text-[#ffe1dd]">
      {children}
    </p>
  );
}

const inputClass =
  "w-full rounded border border-[#8EB1D1]/45 bg-white px-3 py-2 text-[#1C2B48] outline-none transition placeholder:text-[#5B7893] focus:border-[#8EB1D1] disabled:cursor-not-allowed disabled:opacity-45";
